/* ============================================================
   EL GAUCHO TIRANA — animation engine
   GSAP 3.13 · ScrollTrigger · SplitText · ScrollTo
   ============================================================ */
(function () {
  'use strict';

  /* ----------------------------------------------------------
     CDN GUARD — if GSAP never arrived, fall back to the static site
     ---------------------------------------------------------- */
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' ||
      typeof ScrollToPlugin === 'undefined' || typeof SplitText === 'undefined') {
    document.documentElement.classList.remove('js');
    var fb = document.getElementById('burger');
    var fo = document.getElementById('menuOverlay');
    if (fb && fo) {
      fb.addEventListener('click', function () {
        var open = fo.classList.toggle('is-open-fallback');
        fb.classList.toggle('is-open', open);
        fb.setAttribute('aria-expanded', String(open));
        fo.setAttribute('aria-hidden', String(!open));
      });
      fo.addEventListener('click', function (e) {
        if (e.target.closest('a')) {
          fo.classList.remove('is-open-fallback');
          fb.classList.remove('is-open');
        }
      });
    }
    return;
  }

  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText);

  var staticMode = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    new URLSearchParams(window.location.search).has('static');
  var loader = document.getElementById('loader');

  /* mount an animated badge into a container; returns handle or null */
  function mountGaucho(id, ver, isStatic) {
    var el = document.getElementById(id);
    if (!el || !window.GauchoLogo || !window.GAUCHO_RECORDS) return null;
    var h = window.GauchoLogo.create(el, { ver: ver, static: isStatic, autoplay: false });
    if (h) el.classList.add('has-anim');
    return h;
  }

  /* the horseman crop used by the hero brand mark */
  var HORSE_PARTS = ['legA', 'legB', 'legC', 'legD', 'tail', 'horseHead', 'riderHead',
                     'sleeve', 'armR', 'rope', 'ball', 'body', 'torso'];
  var HORSE_VB = { x: 240, y: 60, w: 1120, h: 1140 };
  var heroRiderH = null;
  var navRiderH = null;   // the small mark in the bar, riding
  var heroBoost = 0; // spikes when the hero book button is courted
  // while a cast is out, his whirl holds still and his own rope is stretched
  var cast = { on: false, apply: null };
  function mountHorse(id, isStatic, ver) {
    var el = document.getElementById(id);
    if (!el || !window.GauchoLogo || !window.GAUCHO_RECORDS) return null;
    return window.GauchoLogo.create(el, {
      ver: ver || 1, parts: HORSE_PARTS, viewBox: HORSE_VB,
      clip: false, external: true, static: isStatic
    });
  }

  /* the hero gallery he throws the rope at */
  var DISHES = [
    { src: 'assets/img/steak-plate.webp',
      alt: 'Sliced steak plated with grilled vegetables', cap: 'Bife &middot; a la parrilla' },
    { src: 'assets/img/chorizo.webp',
      alt: 'Grilled chorizo with a bowl of sauce and toasted bread', cap: 'Chorizo &middot; para empezar' },
    { src: 'assets/img/pasta-tagliatelle.webp',
      alt: 'Tagliatelle with beef and peppers', cap: 'Tagliatelle &middot; de la cocina' },
    { src: 'assets/img/strip-jamon-carve.webp',
      alt: 'Jamon being carved by hand', cap: 'Jam&oacute;n &middot; cortado a mano' }
  ];

  var CUT_INFO = {
    1:  { en: 'Shoulder' },
    9:  { en: 'Rib cap' },
    3:  { en: 'Rib eye', alt: 'Bife ancho', serve: true,
          why: 'The most marbled cut we grill, and the most forgiving. All that fat keeps working even if you like it cooked further than we would. The largest plate we serve, built for a real appetite.',
          done: 'jugoso &rarr; a punto', price: '1.250 L / 100g &middot; min 300g' },
    2:  { en: 'Eye of the rib' },
    6:  { en: 'Short ribs' },
    12: { en: 'Skirt steak', serve: true,
          why: 'Ask a parrillero in Buenos Aires what he eats on his own night off, and a good number will say entra&ntilde;a. It is the cut that tastes most like beef, and it takes char better than anything else on the grill.',
          done: 'jugoso &rarr; a punto', price: '990 L / 100g &middot; min 200g' },
    11: { en: 'Flank sheet' },
    4:  { en: 'Strip loin', alt: 'Bife de chorizo', serve: true,
          why: 'The steak that ends the argument. Enough fat to be generous, enough grain to taste of something, tender enough that nobody complains. First visit? Order this.',
          done: 'jugoso &rarr; a punto &middot; fat edge down first', price: '1.090 L / 100g &middot; min 200g' },
    7:  { en: 'Flank' },
    13: { en: 'Tenderloin', serve: true,
          why: 'The muscle that does the least work on the animal, and so the tenderest of the fourteen. Lean, fine-grained and quiet in flavour, which is why it is grilled fast and served pink.' },
    14: { en: 'Top round cap' },
    5:  { en: 'Rump', alt: 'Coraz&oacute;n de cuadril', serve: true,
          why: 'Beef flavour with nothing in the way. No fat cap, no marbling. Just the muscle, the fire and the salt. The least expensive way to eat well here; spend the difference on the wine.',
          done: 'jugoso &rarr; a punto &middot; and we stop there' },
    10: { en: 'Eye of round' },
    8:  { en: 'Tri-tip' }
  };
  var LAYER_NOTE = {
    surface: 'Superficie &middot; lifted from the outside',
    deep: 'Profundo &middot; from inside the ribcage',
    overlay: 'La s&aacute;bana &middot; the sheet between hide and rib'
  };

  /* announce new-tab links to assistive tech (both modes) */
  document.querySelectorAll('a[target="_blank"]').forEach(function (a) {
    var s = document.createElement('span');
    s.className = 'sr-only';
    s.textContent = ' (opens in new tab)';
    a.appendChild(s);
  });

  /* ----------------------------------------------------------
     STATIC MODE — no loader, no loops, no pins; all content shown
     ---------------------------------------------------------- */
  if (staticMode) {
    if (loader) loader.style.display = 'none';
    document.body.classList.add('is-static-page');
    document.querySelectorAll('.marquee__track').forEach(function (t) { t.style.animation = 'none'; });
    var cortesEl = document.querySelector('.cortes');
    if (cortesEl) cortesEl.classList.add('is-static');
    var cantinaEl = document.querySelector('.cantina');
    if (cantinaEl) cantinaEl.classList.add('is-static');
    var strip = document.getElementById('filmstrip');
    if (strip) strip.classList.add('is-static');
    mountGaucho('creamSeal', 2, true);
    mountGaucho('footerGaucho', 1, true);
    mountHorse('heroRider', true);
    mountHorse('navRider', true);
    mountHorse('quotesHoof', true, 2);
    initRideHome(true);
    initLasso(true);
    initCortes();
    initQuotes(true);
    initNavBasics(true);
    var at = new URLSearchParams(window.location.search).get('at');
    if (at) {
      var target = document.getElementById(at);
      if (target) setTimeout(function () { target.scrollIntoView(); }, 120);
    }
    return;
  }

  /* ----------------------------------------------------------
     PRELOADER — real progress + minimum runtime + watchdog
     ---------------------------------------------------------- */
  var CRITICAL = [
    'assets/img/hero-asado.webp',
    'assets/img/steak-plate.webp',
    'assets/img/raw-cuts-wide.webp',
    'assets/img/chef-fire.webp'
  ];

  var seenBefore = false;
  try { seenBefore = sessionStorage.getItem('eg-seen') === '1'; sessionStorage.setItem('eg-seen', '1'); } catch (e) {}
  var MIN_MS = seenBefore ? 250 : 650;

  var loaderDone = false;
  var loaderStart = performance.now();
  var loadedCount = 0;
  function maybeStart() {
    if (loaderDone || loadedCount < CRITICAL.length) return;
    var wait = Math.max(0, MIN_MS - (performance.now() - loaderStart));
    setTimeout(finishLoader, wait);
  }
  CRITICAL.forEach(function (src) {
    var img = new Image();
    img.onload = img.onerror = function () { loadedCount++; maybeStart(); };
    img.src = src;
  });

  // watchdog: never trap the visitor behind the veil
  setTimeout(function () { if (!loaderDone) finishLoader(); }, 5000);

  function finishLoader() {
    if (loaderDone) return;
    loaderDone = true;
    entrance();
  }

  /* ----------------------------------------------------------
     HERO SPLIT — chars born glowing like a branding iron
     ---------------------------------------------------------- */
  var heroTitle = document.querySelector('#heroTitle');
  var heroSplit = null;
  var emberApi = null;
  var heroExit = 0; // 0 at rest, 1 when the dive out of the hero completes
  gsap.set(['#heroRider', '#heroEyebrow', '#heroSub', '#heroCta', '#heroPlate', '#nav'], { autoAlpha: 0 });
  gsap.set('#heroPlate', { y: 26 });

  function buildHeroSplit() {
    heroSplit = SplitText.create(heroTitle, { type: 'words,chars', wordsClass: 'word', charsClass: 'char' });
    gsap.set(heroSplit.chars, {
      yPercent: 118, opacity: 0, rotateX: -40,
      color: '#fefefe', textShadow: '0 0 24px rgba(200, 174, 136, 0.75)'
    });
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { if (!heroSplit) buildHeroSplit(); });
  }

  /* ----------------------------------------------------------
     THE ENTRANCE — no bar, no curtain: the rider gallops in from
     beyond the edge and the room lights up behind him
     ---------------------------------------------------------- */
  function entrance() {
    if (!heroSplit) buildHeroSplit();
    heroRiderH = mountHorse('heroRider', window.innerWidth < 760);
    navRiderH = mountHorse('navRider', false);

    // he arrives from the left, so the ride must cover his whole width
    var rideFrom = window.innerWidth * 0.6;
    var rEl = document.getElementById('heroRider');
    if (rEl) {
      var rb = rEl.getBoundingClientRect();
      rideFrom = Math.max(300, rb.right + rb.width * 0.6);
    }
    heroBoost = 2.4;                       // a long gallop needs a deep breath

    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(loader, { autoAlpha: 0, duration: 0.5, ease: 'power1.out' }, 0)
      .set(loader, { display: 'none' })
      // in from the left at a steady, unhurried gallop, as he is drawn
      .fromTo('#heroRider', { x: -rideFrom, autoAlpha: 1 }, {
        x: -rideFrom * 0.3, duration: 1.7, ease: 'none'
      }, 0.05)
      // he eases up as he reaches his post
      .to('#heroRider', { x: 0, duration: 1.4, ease: 'power2.out' }, 1.75)
      // the name forges itself while he crosses it
      .to(heroSplit.chars, {
        yPercent: 0, opacity: 1, rotateX: 0,
        duration: 1.15, stagger: 0.045, ease: 'expo.out'
      }, 1.1)
      .add(function () {
        if (!emberApi) return;
        var hero = document.getElementById('hero');
        heroSplit.chars.forEach(function (ch, i) {
          gsap.delayedCall(i * 0.045 + 0.55, function () {
            var hr = hero.getBoundingClientRect();
            var r = ch.getBoundingClientRect();
            emberApi.burst(r.left + r.width / 2 - hr.left, r.top + r.height * 0.88 - hr.top, 7);
          });
        });
      }, 1.1)
      .to('#heroPlate', { autoAlpha: 1, y: 0, duration: 1.4, ease: 'power3.out' }, 1.9)
      .to('#heroEyebrow', { autoAlpha: 1, y: 0, duration: 0.8 }, 2.05)
      .to('#heroSub', { autoAlpha: 1, duration: 0.9 }, 2.2)
      .to('#heroCta', { autoAlpha: 1, y: 0, duration: 0.8 }, 2.35)
      .to('#nav', { autoAlpha: 1, duration: 0.7 }, 2.5)
      // the forge cools in two stages: white heat to ember amber to bone
      .to(heroSplit.chars, {
        color: '#c8ae88', textShadow: '0 0 14px rgba(200, 174, 136, 0.45)',
        duration: 0.9, stagger: 0.04, ease: 'power1.inOut'
      }, 1.85)
      .to(heroSplit.chars, {
        color: '#f5e4ca', textShadow: '0 0 0px rgba(200, 174, 136, 0)',
        duration: 1.6, stagger: 0.04, ease: 'power2.out'
      }, 2.7)
      .add(function () { ScrollTrigger.refresh(); });

    emberApi = startEmbers();
    startKenBurns();
    initHeroDive();
    initPageBadges();
    mountHorse('quotesHoof', true, 2);
    initRiderMotion();
    initNavLife();
    initLasso(false);
  }

  /* cream seal (story) + dark badge (footer): gallop only while on screen */
  function initPageBadges() {
    [['creamSeal', 2], ['footerGaucho', 1]].forEach(function (pair) {
      var h = mountGaucho(pair[0], pair[1], false);
      if (!h) return;
      ScrollTrigger.create({
        trigger: '#' + pair[0], start: 'top bottom', end: 'bottom top',
        onToggle: function (self) { if (self.isActive) h.play(); else h.pause(); }
      });
    });
  }

  /* ----------------------------------------------------------
     THE RIDER — the brand mark above the name keeps his own gait:
     a steady canter at rest, opening up when the visitor moves
     ---------------------------------------------------------- */
  function initRiderMotion() {
    if (!heroRiderH && !navRiderH) return;
    var phase = 0, lasso = 0;
    var cur = { energy: 0.9, stride: 1.7, rps: 0.9 };
    var lastY = window.scrollY, speed = 0, lastT = performance.now();

    var heroBook = document.querySelector('#heroCta .btn');
    if (heroBook) {
      ['mouseenter', 'focus'].forEach(function (evn) {
        heroBook.addEventListener(evn, function () { heroBoost = 1; });
      });
    }

    gsap.ticker.add(function () {
      var now = performance.now();
      var dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      var y = window.scrollY;
      speed += (Math.abs(y - lastY) / Math.max(dt, 0.001) - speed) * 0.10;
      lastY = y;
      heroBoost *= 0.982;

      cur.energy += (Math.min(1.5, 0.9 + speed / 1600) - cur.energy) * 0.06;
      cur.stride += (Math.min(3.2, 1.7 + speed / 700) - cur.stride) * 0.06;
      cur.rps += (Math.min(1.9, 0.9 + speed / 1100) - cur.rps) * 0.06;

      phase = (phase + dt * (cur.stride + heroBoost * 1.2)) % 1;
      lasso = (lasso + dt * (cur.rps + heroBoost * 0.5)) % 1;
      if (heroRiderH) {
        heroRiderH.state.energy = cur.energy + heroBoost * 0.4;
        heroRiderH.setPose(phase, lasso);
      }
      // the mark in the bar rides the same stride, so they are one animal
      if (navRiderH) {
        navRiderH.state.energy = cur.energy + heroBoost * 0.4;
        navRiderH.setPose(phase, lasso);
      }
      // setPose has just rewritten his parts; lengthen the rope on top of that
      cast.phase = phase; cast.lasso = lasso;
      if (cast.on && cast.apply) cast.apply();
    });
  }

  /* ----------------------------------------------------------
     NAV LIFE — the bar steps aside on the way down, returns when
     you look up or rest; an ember thread tracks the journey
     ---------------------------------------------------------- */
  function initNavLife() {
    var nav = document.getElementById('nav');
    var thread = document.getElementById('navThread');
    if (!nav) return;

    if (thread) {
      ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: function (self) {
          thread.style.transform = 'scaleX(' + self.progress.toFixed(4) + ')';
        }
      });
    }

    var hidden = false, downAcc = 0, lastY = window.scrollY, idleTimer = null;
    function setHidden(h) {
      if (hidden === h) return;
      hidden = h;
      nav.classList.toggle('nav--hidden', h);
    }
    window.addEventListener('scroll', function () {
      var y = window.scrollY, d = y - lastY;
      lastY = y;
      if (document.documentElement.classList.contains('menu-open')) { downAcc = 0; setHidden(false); return; }
      if (y < window.innerHeight * 1.1) { downAcc = 0; setHidden(false); return; }
      if (d > 0) { downAcc += d; if (downAcc > 110) setHidden(true); }
      else if (d < -8) { downAcc = 0; setHidden(false); }
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () { downAcc = 0; setHidden(false); }, 900);
    }, { passive: true });
    nav.addEventListener('focusin', function () { downAcc = 0; setHidden(false); });
  }

  /* ----------------------------------------------------------
     RIDE HOME — the footer badge gallops you back to the top
     ---------------------------------------------------------- */
  function initRideHome(isStatic) {
    var badge = document.getElementById('footerGaucho');
    if (!badge) return;
    function go() {
      if (isStatic || !window.gsap || !gsap.to) { window.scrollTo(0, 0); return; }
      gsap.to(window, { scrollTo: 0, duration: 1.6, ease: 'power2.inOut' });
    }
    badge.addEventListener('click', go);
    badge.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  }

  /* ----------------------------------------------------------
     LOS CORTES — the animal, drawn. The engraving and the cut
     regions are vector, so they take the brand's own gold.
     ---------------------------------------------------------- */
  function initCortes() {
    var art = window.LC_ART;
    var cowEl = document.getElementById('cow');
    var listEl = document.getElementById('cutlist');
    var panelEl = document.getElementById('cutpanel');
    if (!art || !cowEl || !listEl || !panelEl) return;
    var NS = 'http://www.w3.org/2000/svg';

    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', art.VIEW);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'A Black Angus, drawn, with its fourteen cuts marked');
    var ink = document.createElementNS(NS, 'g');
    ink.setAttribute('class', 'cow__ink');
    art.LEVELS.forEach(function (L) {
      var pa = document.createElementNS(NS, 'path');
      pa.setAttribute('d', L.d);
      pa.setAttribute('fill-opacity', L.o);
      ink.appendChild(pa);
    });
    svg.appendChild(ink);

    var regions = {}, buttons = {};
    var order = art.CUTS.slice().sort(function (x, y) { return x.cx - y.cx; });
    art.CUTS.forEach(function (cut) {
      var pa = document.createElementNS(NS, 'path');
      pa.setAttribute('class', 'cow__cut');
      pa.setAttribute('d', cut.d);
      pa.setAttribute('tabindex', '0');
      pa.setAttribute('role', 'button');
      pa.setAttribute('aria-label', cut.name);
      regions[cut.id] = pa;
      svg.appendChild(pa);
    });
    cowEl.appendChild(svg);

    order.forEach(function (cut) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = cut.name;
      buttons[cut.id] = b;
      li.appendChild(b);
      listEl.appendChild(li);
    });

    var layer = 'surface', chosen = null;

    function shown(cut) {
      return layer === 'surface' ? cut.layer === 'surface'
                                 : (cut.layer === 'deep' || cut.layer === 'overlay');
    }
    function hot(id, on) {
      if (regions[id]) regions[id].classList.toggle('is-hot', on);
      if (buttons[id]) buttons[id].classList.toggle('is-hot', on);
    }
    function clearChosen() {
      art.CUTS.forEach(function (c) {
        if (regions[c.id]) regions[c.id].classList.remove('is-on');
        if (buttons[c.id]) buttons[c.id].classList.remove('is-on');
      });
    }
    function paintPanel() {
      if (!chosen) {
        panelEl.innerHTML = '<p class="cutpanel__hint">Choose a cut &mdash; on the animal, or from the list.</p>';
        return;
      }
      var info = CUT_INFO[chosen.id] || {};
      var h = '<div class="cutpanel__grid"><div>' +
        '<h3 class="cutpanel__name">' + chosen.name + '</h3>' +
        '<p class="cutpanel__en">' + (info.en || '') + (info.alt ? ' &middot; ' + info.alt : '') + '</p>' +
        '<p class="cutpanel__layer">' + (LAYER_NOTE[chosen.layer] || '') + '</p>' +
        '</div><div>';
      if (info.serve) {
        h += '<p class="cutpanel__why">' + info.why + '</p><p class="cutpanel__meta">';
        if (info.done) h += '<span>' + info.done + '</span>';
        if (info.price) h += '<span><b>' + info.price + '</b></span>';
        h += '</p>';
      } else {
        h += '<p class="cutpanel__hint">One of the fourteen. What reaches the fire is on the carta.</p>';
      }
      panelEl.innerHTML = h + '</div></div>';
    }
    function choose(cut) {
      chosen = cut;
      clearChosen();
      if (regions[cut.id]) regions[cut.id].classList.add('is-on');
      if (buttons[cut.id]) buttons[cut.id].classList.add('is-on');
      paintPanel();
    }
    function applyLayer() {
      art.CUTS.forEach(function (c) {
        var on = shown(c);
        if (regions[c.id]) {
          regions[c.id].classList.toggle('is-dim', !on);
          regions[c.id].style.display = on ? '' : 'none';
        }
        if (buttons[c.id]) {
          buttons[c.id].classList.toggle('is-off', !on);
          buttons[c.id].parentNode.classList.toggle('is-off', !on);
        }
      });
      if (chosen && !shown(chosen)) { chosen = null; clearChosen(); paintPanel(); }
    }

    art.CUTS.forEach(function (cut) {
      var pa = regions[cut.id], b = buttons[cut.id];
      [pa, b].forEach(function (el) {
        if (!el) return;
        el.addEventListener('mouseenter', function () { hot(cut.id, true); });
        el.addEventListener('mouseleave', function () { hot(cut.id, false); });
        el.addEventListener('focus', function () { hot(cut.id, true); });
        el.addEventListener('blur', function () { hot(cut.id, false); });
        el.addEventListener('click', function () { choose(cut); });
      });
      if (pa) {
        pa.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(cut); }
        });
      }
    });

    document.querySelectorAll('.layers__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        layer = btn.getAttribute('data-layer');
        document.querySelectorAll('.layers__btn').forEach(function (o) {
          o.classList.toggle('is-on', o === btn);
        });
        applyLayer();
      });
    });

    applyLayer();
    // the section opens with its best argument already on the table
    var first = null;
    art.CUTS.forEach(function (c) { if (c.id === 3) first = c; });
    if (first) choose(first); else paintPanel();
  }

  /* ----------------------------------------------------------
     THE FIRE THAT COOKS — scroll drives the heat across the coals
     ---------------------------------------------------------- */
  function initCook() {
    var cook = document.getElementById('cook');
    var grid = document.getElementById('donenessGrid');
    if (!cook || !grid) return;
    var cards = Array.prototype.slice.call(grid.children);
    var thresholds = [0.14, 0.4, 0.64, 0.88];
    ScrollTrigger.create({
      trigger: '#doneness', start: 'top 72%', end: 'bottom 78%',
      onUpdate: function (self) {
        var pr = self.progress;
        cook.style.setProperty('--p', pr.toFixed(4));
        for (var i = 0; i < cards.length; i++) {
          cards[i].classList.toggle('is-lit', pr >= thresholds[i]);
        }
      }
    });
  }

  /* ----------------------------------------------------------
     THE TUNNEL — a drawn descent: bronze arches dolly past,
     the cellar's labels drift by, and the vault opens
     ---------------------------------------------------------- */
  function initDescent() {
    var pinEl = document.getElementById('cantinaPin');
    var tunnel = document.getElementById('tunnel');
    if (!pinEl || !tunnel) return;
    var section = pinEl.closest('.cantina');
    var segs = Array.prototype.slice.call(tunnel.querySelectorAll('.t3d__seg'));
    var labels = Array.prototype.slice.call(tunnel.querySelectorAll('.tunnel__label'));
    var world = document.getElementById('t3dWorld');
    var railL = document.getElementById('railL');
    var railR = document.getElementById('railR');
    var beat1 = document.getElementById('tunnelBeat1');
    var vault = document.getElementById('tunnelVault');
    var rail = document.getElementById('descentRail');
    var mm = gsap.matchMedia();

    mm.add('(max-height: 560px)', function () {
      section.classList.add('is-static');
      return function () { section.classList.remove('is-static'); };
    });

    mm.add('(min-height: 561px)', function () {
      section.classList.remove('is-static');
      var N = segs.length, CYC = 2.2;
      var planes = Array.prototype.slice.call(tunnel.querySelectorAll('.t3d__plane'));
      var Z_FAR = -2400, Z_TRAVEL = 2660;

      function dolly(p) {
        var vaultIn = Math.max(0, Math.min(1, (p - 0.78) / 0.14));
        var ringMul = 1 - vaultIn;

        // camera sway breathes life into the walk
        var sway = Math.sin(p * Math.PI * 2.6);
        // the lamps are old and they gutter, and every so often one nearly
        // dies. Driven by the scroll, never idle: stand still and the tunnel
        // stands still with you.
        var dip = Math.pow(Math.abs(Math.sin(p * 21.7)), 0.28);
        // the flame itself swings hard; the stone it lights only breathes,
        // because a room that drops to a third of its light reads as broken,
        // not as dark
        var lamp = (0.42 + 0.58 * dip) * (1 + 0.07 * Math.sin(p * 137.4));
        var flick = 0.82 + 0.18 * dip;
        // the walk is uneven; the whole passage leans with your step
        var roll = Math.sin(p * Math.PI * 1.7 + 0.6) * 0.7;
        // the passage is 944px across. On a narrow screen its near walls fall
        // outside the frame entirely and you are left staring down a black
        // hole, so the whole section is fitted to the viewport: a smaller
        // corridor of the same length, with its stone where you can see it.
        var cam = Math.max(0.55, Math.min(1, window.innerWidth / 1150));
        world.style.transform = 'translateX(' + (sway * 14).toFixed(1) + 'px) rotateY(' + (sway * 2.1).toFixed(2) + 'deg) rotate(' + roll.toFixed(2) + 'deg) scale(' + cam.toFixed(3) + ')';
        world.style.setProperty('--walk', (p * 5850).toFixed(1) + 'px');
        world.style.setProperty('--surf', (0.25 + 0.75 * ringMul).toFixed(3));
        // the far mouth stays a pinprick until you are nearly on it
        tunnel.style.setProperty('--endglow', ((0.04 + 0.96 * Math.pow(p, 2.4)) * ringMul * lamp).toFixed(3));

        // arches fly past in Z
        for (var i = 0; i < N; i++) {
          var t = (p * CYC + i / N) % 1;
          var z = Z_FAR + t * Z_TRAVEL;
          // an arch comes out of the black, but its lamp carries: a row of
          // lights receding is the thing that tells you how long the tunnel is
          var o = (t < 0.12 ? t / 0.12 : (t > 0.93 ? (1 - t) / 0.07 : 1)) * (0.14 + 0.86 * Math.pow(t, 1.7)) * ringMul * flick;
          segs[i].style.transform = 'translate(-50%, -52%) translateZ(' + z.toFixed(1) + 'px)';
          segs[i].style.opacity = Math.max(0, o).toFixed(3);
        }

        // wall plaques approach on their own beat
        for (var k = 0; k < labels.length; k++) {
          var cj = 0.12 + 0.62 * (k / (labels.length - 1));
          var prog = (p - cj) / 0.18 + 0.5; // 0..1 across its window
          // a plaque holds full strength while it passes, then lets go: the
          // name on the rack is the one thing down here you must be able to read
          // the plaque was reaching full strength while it was still far down
          // the passage, which is when it is smallest: peak it late, when the
          // name is close enough to read
          var d = Math.abs(p - cj - 0.062);
          var bell = d < 0.045 ? 1 : Math.max(0, 1 - (d - 0.045) / 0.055);
          var lz = -1900 + Math.max(0, Math.min(1, prog)) * 2080;
          var dim = labels[k].hasAttribute('data-dim') ? 0.38 : 1; // the fresco stays faint
          labels[k].style.transform =
            'translate(-50%, -50%) translateX(var(--px)) translateZ(' + lz.toFixed(1) + 'px) rotateY(var(--ry))';
          labels[k].style.opacity = (bell * ringMul * dim).toFixed(3);
        }

        // the stone stays present: the dark comes from the fog and the
        // distance, not from switching the walls off
        for (var q = 0; q < planes.length; q++) planes[q].style.opacity = ((0.55 + 0.45 * ringMul) * flick).toFixed(3);

        // floor rails rush toward you
        var dash = (-(p * 1400)).toFixed(1);
        if (railL) { railL.style.strokeDashoffset = dash; railL.style.opacity = (0.34 * ringMul * flick).toFixed(3); }
        if (railR) { railR.style.strokeDashoffset = dash; railR.style.opacity = (0.34 * ringMul * flick).toFixed(3); }

        // beat 1 holds, then rises away
        var b1 = 1 - Math.max(0, Math.min(1, (p - 0.08) / 0.12));
        beat1.style.opacity = b1.toFixed(3);
        beat1.style.transform = 'translateY(' + (-(1 - b1) * 60).toFixed(1) + 'px)';
        beat1.style.visibility = b1 <= 0 ? 'hidden' : 'visible';

        // the vault opens
        vault.style.opacity = vaultIn.toFixed(3);
        vault.style.visibility = vaultIn <= 0 ? 'hidden' : 'visible';
        vault.style.transform = 'scale(' + (0.92 + 0.08 * vaultIn).toFixed(4) + ')';

        if (rail) {
          rail.style.opacity = (Math.max(0, Math.min(1, (p - 0.05) / 0.08)) * (1 - Math.max(0, (p - 0.95) / 0.05))).toFixed(3);
          rail.style.setProperty('--dp', Math.min(1, p / 0.9).toFixed(4));
        }
      }
      dolly(0);

      ScrollTrigger.create({
        trigger: pinEl, pin: true, scrub: 0.35,
        start: 'top top', end: '+=620', invalidateOnRefresh: true,
        onUpdate: function (self) { dolly(self.progress); }
      });

      return function () { dolly(0); };
    });
  }




  function initHeroDive() {
    if (!heroSplit) return;
    var chars = heroSplit.chars;
    var mid = (chars.length - 1) / 2;
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.5,
        onUpdate: function (self) { heroExit = self.progress; }
      }
    });
    tl.fromTo('#heroPlate', { y: 0 }, {
      y: -70, opacity: 0.15, immediateRender: false, ease: 'power1.in', duration: 0.8
    }, 0);
    chars.forEach(function (ch, i) {
      var d = mid ? (i - mid) / mid : 0;
      tl.to(ch, {
        xPercent: d * 90, yPercent: -30 - Math.abs(d) * 10,
        opacity: 0, ease: 'power1.in', duration: 0.62
      }, 0.12);
    });
    tl.to(['#heroRider', '#heroEyebrow', '#heroSub', '#heroCta'], {
      opacity: 0, y: -26, duration: 0.35, ease: 'power1.in'
    }, 0);
  }



  /* ----------------------------------------------------------
     EL LAZO — he throws the rope at the photograph, the loop
     tightens, and the dish inside it collapses to reveal the next
     ---------------------------------------------------------- */

  function initLasso(isStatic) {
    var btn = document.getElementById('heroPlateBtn');
    var cur = document.getElementById('plateCur');
    var nxt = document.getElementById('plateNext');
    var cap = document.getElementById('plateCap');
    var rider = document.getElementById('heroRider');
    var hero = document.getElementById('hero');
    if (!btn || !cur || !nxt || !cap) return;

    DISHES.forEach(function (d) { var im = new Image(); im.src = d.src; });
    var idx = 0, busy = false;

    function setCap(html) { cap.innerHTML = html; }

    // reduced motion and no-GSAP visitors still get the gallery, without the rope
    function swapPlain() {
      idx = (idx + 1) % DISHES.length;
      cur.src = DISHES[idx].src;
      cur.alt = DISHES[idx].alt;
      setCap(DISHES[idx].cap);
    }

    function throwRope() {
      if (busy) return;
      var parts = rider ? rider.querySelectorAll('[data-part="rope"], [data-part="ball"]') : null;
      if (!parts || !parts.length) { swapPlain(); return; }
      busy = true;
      var next = DISHES[(idx + 1) % DISHES.length];
      nxt.src = next.src;

      var pr = cur.getBoundingClientRect();
      var ballEl = rider.querySelector('[data-part="ball"]');
      var br = ballEl.getBoundingClientRect();
      var bx = br.left + br.width / 2, by = br.top + br.height / 2;
      // On a phone the picture sits under him rather than beside him, so he
      // throws down into the top of the frame instead of across at its edge.
      var under = (pr.top - 20) > by;
      var tgtX = under ? (pr.left + pr.width * 0.5) : (pr.left - 30);
      var tgtY = under ? (pr.top + 44) : (pr.top + pr.height / 2);
      var dx = tgtX - bx, dy = tgtY - by;
      var rise = under ? 34 : Math.max(70, Math.abs(dx) * 0.16);
      var K = under ? 0.72 : 1;              // a shorter gap wants a quicker throw

      // screen pixels to the logo's own units; its inner group is y-flipped
      var rr = rider.getBoundingClientRect();
      var u2s = rr.width ? (HORSE_VB.w / rr.width) : 4.5;
      var st = { t: 0 };

      // A plain translation of his whole lasso: nothing is stretched, scaled or
      // redrawn, so it cannot distort. Linear across, a parabola down: the arc
      // of something thrown. The rig keeps whirling it, so it tumbles in flight.
      cast.on = true;
      cast.apply = function () {
        var t = st.t;
        var ox = dx * t;
        var oy = dy * t - rise * 4 * t * (1 - t);
        var pre = 'translate(' + (ox * u2s).toFixed(1) + ' ' + (-oy * u2s).toFixed(1) + ') ';
        for (var i = 0; i < parts.length; i++) {
          parts[i].setAttribute('transform', pre + (parts[i].getAttribute('transform') || ''));
        }
      };
      cast.apply();

      var tl = gsap.timeline({
        onComplete: function () {
          cast.on = false; cast.apply = null;
          busy = false;
        }
      });
      heroBoost = 1;                                  // he winds it up first
      tl.to(st, { t: 1, duration: 0.5 * K, ease: 'none', onUpdate: cast.apply }, 0.26 * K)
        // it arrives, and the dish changes
        .to(cur, {
          opacity: 0, duration: 0.42 * K, ease: 'power1.inOut',
          onComplete: function () {
            cur.src = next.src; cur.alt = next.alt;
            gsap.set(cur, { opacity: 1 });
            setCap(next.cap);
            idx = (idx + 1) % DISHES.length;
          }
        }, 0.78 * K)
        .to(cap, { opacity: 0, duration: 0.2 * K, ease: 'power1.in' }, 0.8 * K)
        .to(cap, { opacity: 1, duration: 0.3 * K, ease: 'power1.out' }, 1.22 * K)
        // and it comes back to his hand
        .to(st, { t: 0, duration: 0.46 * K, ease: 'power2.inOut', onUpdate: cast.apply }, 1.26 * K);
    }


    var fire = isStatic ? swapPlain : throwRope;
    btn.addEventListener('click', fire);
    if (rider) rider.addEventListener('click', fire);
    // it casts on its own every few seconds, and rests while nobody is looking
    if (!isStatic) {
      var heroSeen = true;
      ScrollTrigger.create({
        trigger: '#hero', start: 'top bottom', end: 'bottom top',
        onToggle: function (self) { heroSeen = self.isActive; }
      });
      gsap.delayedCall(3.6, function tick() {
        if (heroSeen && !busy) throwRope();
        gsap.delayedCall(3.5, tick);
      });
    }
  }

  /* ----------------------------------------------------------
     EMBERS — sparks rising from the grill line, not confetti
     ---------------------------------------------------------- */
  function startEmbers() {
    var canvas = document.getElementById('emberCanvas');
    if (!canvas) return null;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var W, H, particles = [];
    var COUNT = window.innerWidth < 720 ? 18 : 32;

    function resize() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    function spawn(p, first) {
      p.x = W * (0.5 + (Math.random() + Math.random() + Math.random() - 1.5) * 0.45);
      p.y = first ? H * (0.55 + Math.random() * 0.45) : H + 10;
      p.r = 0.5 + Math.random() * Math.random() * 3.2;
      p.vy = 0.35 + Math.random() * 1.1;
      p.vx = -0.1 + Math.random() * 0.2;
      p.life = 0;
      p.maxLife = 180 + Math.random() * 220;
      p.hue = 33 + Math.random() * 7; // logo-gold band
      p.flicker = Math.random() * Math.PI * 2;
    }
    for (var i = 0; i < COUNT; i++) { var p = {}; spawn(p, true); particles.push(p); }

    var visible = true;
    ScrollTrigger.create({
      trigger: '.hero', start: 'top bottom', end: 'bottom top',
      onToggle: function (self) { visible = self.isActive; }
    });

    gsap.ticker.add(function () {
      if (!visible) return;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      var rush = heroExit; // the dive turns risers into streaks
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.life++;
        p.flicker += 0.12;
        p.vx += (Math.random() - 0.5) * 0.02;
        p.x += p.vx + Math.sin(p.life * 0.02) * 0.3;
        var vyNow = p.vy * (1 + rush * 3.5);
        p.y -= vyNow;
        var lifeRatio = p.life / p.maxLife;
        var rise = 1 - p.y / H;
        var alpha = Math.sin(Math.min(lifeRatio, 1) * Math.PI) *
                    (0.5 + Math.sin(p.flicker) * 0.25) * (1 - rise * 0.85) * 0.7;
        if (p.y < -12 || p.life > p.maxLife) {
          if (p.burst) { particles.splice(i, 1); i--; continue; }
          spawn(p, false); continue;
        }
        if (alpha <= 0) continue;
        if (rush > 0.12) {
          ctx.beginPath();
          ctx.strokeStyle = 'hsla(' + p.hue + ', 48%, 62%, ' + alpha + ')';
          ctx.lineWidth = Math.max(0.6, p.r * 0.9);
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 3, p.y + vyNow * 3.2);
          ctx.stroke();
          continue;
        }
        if (p.r > 2) {
          ctx.beginPath();
          ctx.fillStyle = 'hsla(' + p.hue + ', 50%, 58%, ' + (alpha * 0.25) + ')';
          ctx.arc(p.x, p.y, p.r * 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.fillStyle = 'hsla(' + p.hue + ', 48%, 62%, ' + alpha + ')';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // sparks thrown by the forge as each letter strikes
    return {
      burst: function (x, y, n) {
        for (var i = 0; i < (n || 8); i++) {
          var p = {
            x: x + (Math.random() - 0.5) * 26,
            y: y + (Math.random() - 0.5) * 10,
            r: 0.5 + Math.random() * 1.8,
            vy: 1.2 + Math.random() * 2.4,
            vx: (Math.random() - 0.5) * 2.4,
            life: 0, maxLife: 36 + Math.random() * 50,
            hue: 33 + Math.random() * 7,
            flicker: Math.random() * Math.PI * 2,
            burst: true
          };
          particles.push(p);
        }
      }
    };
  }

  /* ----------------------------------------------------------
     KEN BURNS — directional drift, never on reveal-frame images
     ---------------------------------------------------------- */
  function startKenBurns() {
    var origins = ['30% 40%', '70% 55%', '45% 65%'];
    document.querySelectorAll('[data-kenburns]:not(.reveal-frame) img').forEach(function (img, i) {
      img.style.transformOrigin = origins[i % origins.length];
      gsap.to(img, { scale: 1.09, duration: 18 + i * 3, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    });
    document.querySelectorAll('[data-kenburns-slow]:not(.reveal-frame) img').forEach(function (img) {
      img.style.transformOrigin = '60% 40%';
      gsap.to(img, { scale: 1.12, duration: 30, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    });
  }

  /* ----------------------------------------------------------
     NAV — scrolled state, anchors, burger (focus/Escape/inert)
     ---------------------------------------------------------- */
  var closeMenuRef = function () {};
  function initNavBasics(isStatic) {
    var nav = document.getElementById('nav');
    window.addEventListener('scroll', function () {
      nav.classList.toggle('is-scrolled', window.scrollY > 60);
    }, { passive: true });
    if (isStatic) nav.style.opacity = '1';

    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        closeMenuRef(false);
        if (isStatic) {
          target.scrollIntoView();
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
          return;
        }
        gsap.to(window, {
          scrollTo: { y: target, offsetY: 0 }, duration: 1.1, ease: 'power3.inOut',
          onComplete: function () {
            target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
          }
        });
      });
    });

    var burger = document.getElementById('burger');
    var overlay = document.getElementById('menuOverlay');
    var main = document.getElementById('main');
    if (!burger || !overlay) return;
    var menuOpen = false;

    var menuTl = gsap.timeline({ paused: true })
      .set(overlay, { visibility: 'visible' })
      .fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: 'power2.out' })
      .fromTo('.menu-overlay__link', { y: 40, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.07, ease: 'expo.out' }, 0.15);
    menuTl.eventCallback('onComplete', function () {
      var first = overlay.querySelector('a');
      if (first) first.focus();
    });

    function setMenu(open, returnFocus) {
      menuOpen = open;
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      overlay.setAttribute('aria-hidden', String(!open));
      document.documentElement.classList.toggle('menu-open', open);
      if (main && 'inert' in main) main.inert = open;
      if (open) { if (isStatic) { overlay.style.visibility = 'visible'; overlay.style.opacity = '1'; } else menuTl.play(); }
      else {
        if (isStatic) { overlay.style.visibility = 'hidden'; overlay.style.opacity = '0'; } else menuTl.reverse();
        if (returnFocus) burger.focus();
      }
    }
    closeMenuRef = function (returnFocus) { if (menuOpen) setMenu(false, returnFocus !== false); };

    burger.addEventListener('click', function () { setMenu(!menuOpen, true); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen) setMenu(false, true);
    });
  }
  initNavBasics(false);
  initRideHome(false);

  /* ----------------------------------------------------------
     CURSOR — one flat gold dot
     ---------------------------------------------------------- */
  (function initCursor() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var dot = document.getElementById('cursor');
    if (!dot) return;
    var xTo = gsap.quickTo(dot, 'x', { duration: 0.18, ease: 'power2.out' });
    var yTo = gsap.quickTo(dot, 'y', { duration: 0.18, ease: 'power2.out' });
    gsap.set(dot, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
    var shown = false;
    window.addEventListener('mousemove', function (e) {
      if (!shown) { shown = true; gsap.to(dot, { autoAlpha: 1, duration: 0.3 }); }
      xTo(e.clientX); yTo(e.clientY);
    });
    document.querySelectorAll('a, button').forEach(function (el) {
      el.addEventListener('mouseenter', function () { gsap.to(dot, { scale: 2.1, duration: 0.25 }); });
      el.addEventListener('mouseleave', function () { gsap.to(dot, { scale: 1, duration: 0.25 }); });
    });
  })();

  /* ----------------------------------------------------------
     SCROLL REVEALS
     ---------------------------------------------------------- */
  gsap.utils.toArray('.reveal-label').forEach(function (el) {
    gsap.from(el, {
      autoAlpha: 0, x: -24, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  gsap.utils.toArray('.reveal-up').forEach(function (el) {
    var focusable = el.classList.contains('reveal-up--focusable');
    gsap.from(el, focusable
      ? { opacity: 0, y: 44, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }
      : { autoAlpha: 0, y: 44, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  gsap.set('.reveal-card', { autoAlpha: 0, y: 40 });
  ScrollTrigger.batch('.reveal-card', {
    start: 'top 90%',
    onEnter: function (els) {
      gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out', overwrite: true });
    },
    onEnterBack: function (els) {
      gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.6, overwrite: true });
    }
  });
  gsap.set('.reveal-item', { opacity: 0, x: -26 });
  ScrollTrigger.batch('.reveal-item', {
    start: 'top 92%',
    onEnter: function (els) {
      gsap.to(els, { opacity: 1, x: 0, duration: 0.7, stagger: 0.06, ease: 'power2.out', overwrite: true });
    },
    onEnterBack: function (els) {
      gsap.to(els, { opacity: 1, x: 0, duration: 0.5, overwrite: true });
    }
  });

  // keyboard escape hatch: focusing hidden-by-reveal content completes its reveal
  document.addEventListener('focusin', function (e) {
    var el = e.target.closest('.reveal-up, .reveal-item, .reveal-card, .reveal-up--focusable');
    if (!el) return;
    gsap.set(el, { clearProps: 'opacity,visibility,transform' });
  });

  // frames: clip-path wipe + settle zoom, then hand hover zoom to JS
  gsap.utils.toArray('.reveal-frame').forEach(function (el) {
    gsap.fromTo(el,
      { clipPath: 'inset(0 0 100% 0)' },
      {
        clipPath: 'inset(0 0 0% 0)', duration: 1.3, ease: 'power4.inOut',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    var img = el.querySelector('img');
    if (img) {
      gsap.fromTo(img, { scale: 1.25 }, {
        scale: 1, duration: 1.6, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
        onComplete: function () { el.dataset.revealed = '1'; }
      });
    }
  });
  document.querySelectorAll('.frame').forEach(function (frame) {
    var img = frame.querySelector('img');
    if (!img) return;
    frame.addEventListener('mouseenter', function () {
      if (frame.classList.contains('reveal-frame') && frame.dataset.revealed !== '1') return;
      gsap.to(img, { scale: 1.045, duration: 1.1, ease: 'power3.out', overwrite: 'auto' });
    });
    frame.addEventListener('mouseleave', function () {
      if (frame.classList.contains('reveal-frame') && frame.dataset.revealed !== '1') return;
      gsap.to(img, { scale: 1, duration: 1.1, ease: 'power3.out', overwrite: 'auto' });
    });
  });

  // big serif line reveals + one clock for every marquee
  function lineReveal(el) {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: function (self) {
        return gsap.from(self.lines, {
          yPercent: 110, duration: 1.1, stagger: 0.09, ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 85%' }
        });
      }
    });
  }
  document.fonts.ready.then(function () {
    gsap.utils.toArray('[data-lines]').forEach(lineReveal);
    document.querySelectorAll('.marquee__track').forEach(function (t) {
      var w = t.children[0].getBoundingClientRect().width;
      if (w) t.style.animationDuration = (w / 28) + 's';
    });
  });

  // parallax
  gsap.utils.toArray('[data-speed]').forEach(function (el) {
    var speed = parseFloat(el.getAttribute('data-speed')) || 1;
    gsap.to(el, {
      y: function () { return (1 - speed) * 220; },
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
    });
  });

  initCortes();
  initCook();
  initDescent();

  /* ----------------------------------------------------------
     LA CANTINA — count-up (markup already holds the real number)
     ---------------------------------------------------------- */
  gsap.utils.toArray('.stat__num').forEach(function (el) {
    var end = parseInt(el.getAttribute('data-count'), 10) || 0;
    el.textContent = '0';
    var obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: function () {
        gsap.to(obj, {
          v: end, duration: 1.8, ease: 'power2.out',
          onUpdate: function () { el.textContent = Math.round(obj.v); }
        });
      }
    });
  });

  /* ----------------------------------------------------------
     FILMSTRIP — seamless loop, aria-hidden clones, velocity skew
     ---------------------------------------------------------- */
  (function initFilmstrip() {
    var row = document.getElementById('filmstripRow');
    if (!row) return;
    var originals = Array.prototype.slice.call(row.children);
    originals.forEach(function (f) {
      var c = f.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      row.appendChild(c);
    });
    var firstClone = row.children[originals.length];
    var period = firstClone.offsetLeft;

    var loop = gsap.to(row, {
      x: function () { return -period; },
      duration: 46, ease: 'none', repeat: -1,
      modifiers: {
        x: function (x) { return (parseFloat(x) % period) + 'px'; }
      }
    });
    ScrollTrigger.addEventListener('refreshInit', function () {
      period = firstClone.offsetLeft;
      loop.invalidate();
    });
    row.addEventListener('mouseenter', function () { gsap.to(loop, { timeScale: 0.25, duration: 0.5 }); });
    row.addEventListener('mouseleave', function () { gsap.to(loop, { timeScale: 1, duration: 0.5 }); });

    var proxy = { skew: 0 };
    var skewSetter = gsap.quickSetter(row, 'skewX', 'deg');
    var clampSkew = gsap.utils.clamp(-6, 6);
    ScrollTrigger.create({
      trigger: row, start: 'top bottom', end: 'bottom top',
      onUpdate: function (self) {
        var skew = clampSkew(self.getVelocity() / -280);
        if (Math.abs(skew) > Math.abs(proxy.skew)) {
          proxy.skew = skew;
          gsap.to(proxy, {
            skew: 0, duration: 0.9, ease: 'power3',
            overwrite: true,
            onUpdate: function () { skewSetter(proxy.skew); }
          });
        }
      }
    });
  })();

  /* ----------------------------------------------------------
     QUOTES — crossfade that cleans up after itself
     ---------------------------------------------------------- */
  function initQuotes(isStatic) {
    var quotes = gsap.utils.toArray('.quote');
    var dots = gsap.utils.toArray('#quotesDots button');
    var stage = document.getElementById('quotesStage');
    if (!quotes.length) return;
    var idx = 0, timer = null, paused = false, manual = false;

    function show(n) {
      quotes.forEach(function (q, i) {
        var active = i === n;
        if (!isStatic) {
          gsap.killTweensOf(q);
          if (active) {
            q.classList.add('is-active');
            gsap.fromTo(q, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' });
          } else {
            gsap.set(q, { clearProps: 'opacity,visibility,transform' });
            q.classList.remove('is-active');
          }
        } else {
          q.classList.toggle('is-active', active);
        }
      });
      dots.forEach(function (d, i) {
        if (i === n) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
      idx = n;
    }
    dots.forEach(function (d, i) {
      d.addEventListener('click', function () {
        manual = true;
        if (timer) { clearInterval(timer); timer = null; }
        show(i);
      });
    });
    if (!isStatic) {
      timer = setInterval(function () {
        if (!paused && !manual) show((idx + 1) % quotes.length);
      }, 6000);
      if (stage) {
        stage.addEventListener('mouseenter', function () { paused = true; });
        stage.addEventListener('mouseleave', function () { paused = false; });
        stage.addEventListener('focusin', function () { paused = true; });
        stage.addEventListener('focusout', function () { paused = false; });
      }
      ScrollTrigger.create({
        trigger: '.quotes', start: 'top bottom', end: 'bottom top',
        onToggle: function (self) { if (self.isActive) paused = false; else paused = true; }
      });
    }
  }
  initQuotes(false);

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });

})();
