/* ============================================================
   EL GAUCHO — animated logo renderer (vanilla port)
   Faithful port of the designer's gaucho-scene: exact vector
   records from gaucho-data.js, gallop + boleadoras choreography.
   Only group transforms animate; every drawn line keeps its shape.
   ============================================================ */
(function () {
  'use strict';

  var VB = { x: 129, y: 121, w: 3040, h: 1077 };
  var FLIPK = 121 + 1198; // y-up PDF coords flipped into SVG space
  var PIVOT = {
    legA: [575, 618], legB: [670, 605], legC: [735, 488], legD: [845, 680],
    tail: [712, 785], horseHead: [880, 750], riderHead: [785, 925],
    shoulder: [655, 895], fist: [701, 1103], sleeve: [658, 1002], center: [730, 600]
  };
  var BALL_U = 613;
  var TAU = Math.PI * 2;
  var SVGNS = 'http://www.w3.org/2000/svg';
  var uid = 0;

  function mmul(m, n) {
    return [m[0]*n[0]+m[2]*n[1], m[1]*n[0]+m[3]*n[1], m[0]*n[2]+m[2]*n[3],
            m[1]*n[2]+m[3]*n[3], m[0]*n[4]+m[2]*n[5]+m[4], m[1]*n[4]+m[3]*n[5]+m[5]];
  }
  function rotAt(deg, px, py) {
    var r = deg*Math.PI/180, c = Math.cos(r), s = Math.sin(r);
    return [c, s, -s, c, px - c*px + s*py, py - s*px - c*py];
  }
  function trans(x, y) { return [1, 0, 0, 1, x, y]; }
  function scaleXAt(k, px) { return [k, 0, 0, 1, px*(1-k), 0]; }
  function mstr(m) {
    var out = 'matrix(';
    for (var i = 0; i < 6; i++) out += (i ? ' ' : '') + m[i].toFixed(4);
    return out + ')';
  }

  function create(container, opts) {
    var recs = window.GAUCHO_RECORDS;
    if (!recs || !container) return null;
    opts = opts || {};
    var ver = opts.ver || 1;
    var only = opts.parts ? {} : null;
    if (only) opts.parts.forEach(function (k) { only[k] = 1; });
    var vb = opts.viewBox || VB;

    // group consecutive records by part, preserving exact paint order
    var runs = [], cur = null, badgeD = null;
    recs.forEach(function (r) {
      var a = ver === 1 ? r.a1 : r.a2;
      var c = ver === 1 ? r.c1 : r.c2;
      if (!a) return;
      if (only && !only[r.part]) return;
      if (r.part === 'badge' && !badgeD) badgeD = r.d;
      if (!cur || cur.part !== r.part) { cur = { part: r.part, paths: [] }; runs.push(cur); }
      cur.paths.push({ d: r.d, c: c, a: a, fr: r.fr });
    });

    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.w + ' ' + vb.h);
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'display:block;width:100%;height:100%;overflow:visible;';

    var useClip = opts.clip !== false && badgeD;
    var clipId = 'gaucho-clip-' + (++uid);
    if (useClip) {
      var defs = document.createElementNS(SVGNS, 'defs');
      var clip = document.createElementNS(SVGNS, 'clipPath');
      clip.setAttribute('id', clipId);
      var clipShape = document.createElementNS(SVGNS, 'path');
      clipShape.setAttribute('d', badgeD);
      clip.appendChild(clipShape);
      defs.appendChild(clip);
      svg.appendChild(defs);
    }

    var flip = document.createElementNS(SVGNS, 'g');
    flip.setAttribute('transform', 'matrix(1 0 0 -1 0 ' + FLIPK + ')');
    var clipG = document.createElementNS(SVGNS, 'g');
    if (useClip) clipG.setAttribute('clip-path', 'url(#' + clipId + ')');
    flip.appendChild(clipG);
    svg.appendChild(flip);

    var groupEls = {};
    runs.forEach(function (run) {
      var g = document.createElementNS(SVGNS, 'g');
      g.setAttribute('data-part', run.part);
      run.paths.forEach(function (p) {
        var el = document.createElementNS(SVGNS, 'path');
        el.setAttribute('d', p.d);
        el.setAttribute('fill', p.c);
        if (p.a < 1) el.setAttribute('fill-opacity', p.a);
        if (p.fr === 'e') el.setAttribute('fill-rule', 'evenodd');
        g.appendChild(el);
      });
      clipG.appendChild(g);
      (groupEls[run.part] = groupEls[run.part] || []).push(g);
    });

    container.appendChild(svg);

    var state = {
      energy: opts.energy != null ? opts.energy : 1,
      strideRate: opts.strideRate != null ? opts.strideRate : 2.1,
      lassoRps: opts.lassoRps != null ? opts.lassoRps : 1.05
    };
    var t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    var playing = false;

    function apply(part, m) {
      var els = groupEls[part];
      if (!els) return;
      var s = mstr(m);
      for (var i = 0; i < els.length; i++) els[i].setAttribute('transform', s);
    }

    function setPose(p, q) {
      var en = state.energy;
      var sp = function (ph) { return Math.sin(TAU * (p - ph)); };
      var bounce = (Math.cos(TAU * p) * 13 - 4) * en;
      var pitch = 1.9 * en * Math.sin(TAU * p + 0.8);
      var Mfig = mmul(trans(0, bounce), rotAt(pitch, PIVOT.center[0], PIVOT.center[1]));
      var limb = function (deg, pv) { return mmul(Mfig, rotAt(deg, pv[0], pv[1])); };
      var Marm = mmul(Mfig, rotAt(2.6 * en * Math.sin(TAU * q + 0.35), PIVOT.shoulder[0], PIVOT.shoulder[1]));
      var c = Math.cos(TAU * q);
      var k = 0.81 * c + 0.19; // fore-shortened sweep, artwork-exact at q=0
      var E = 46 * en * Math.sin(TAU * q) + 55 * (1 - Math.abs(k));

      apply('legA', limb(9.0 * en * sp(0), PIVOT.legA));
      apply('legB', limb(8.0 * en * sp(0.09), PIVOT.legB));
      apply('legC', limb(7.5 * en * sp(0.50), PIVOT.legC));
      apply('legD', limb(9.0 * en * sp(0.58), PIVOT.legD));
      apply('tail', limb(5.5 * en * sp(0.22), PIVOT.tail));
      apply('horseHead', limb(2.2 * en * sp(0.10), PIVOT.horseHead));
      apply('riderHead', limb(2.2 * en * sp(0.175), PIVOT.riderHead));
      apply('sleeve', limb(4.5 * en * sp(0.27), PIVOT.sleeve));
      apply('armR', Marm);
      apply('rope', mmul(Marm, mmul(trans(0, E), scaleXAt(k, PIVOT.fist[0]))));
      apply('ball', mmul(Marm, trans((k - 1) * BALL_U, E)));
      apply('body', Mfig);
      apply('torso', Mfig);
    }

    function tick() {
      var t = ((typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000) - t0;
      setPose((t * state.strideRate) % 1, (t * state.lassoRps) % 1);
    }

    setPose(0, 0); // artwork-exact rest pose

    var handle = {
      el: svg,
      state: state,
      setPose: setPose,
      play: function () {
        if (playing || opts.static) return;
        playing = true;
        if (window.gsap) gsap.ticker.add(tick);
      },
      pause: function () {
        if (!playing) return;
        playing = false;
        if (window.gsap) gsap.ticker.remove(tick);
      },
      destroy: function () {
        handle.pause();
        if (svg.parentNode) svg.parentNode.removeChild(svg);
      }
    };
    if (opts.external) return handle; // caller drives setPose directly
    if (!opts.static && opts.autoplay !== false) handle.play();
    return handle;
  }

  window.GauchoLogo = { create: create };
})();
