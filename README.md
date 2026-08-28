# El Gaucho Tirana — premium site

Static, single-page, no build step. Open `index.html` over any static server
(`python -m http.server 8641 --directory premium` from the project root, or drop the
folder on Netlify / Vercel / cPanel).

## Stack
- HTML + CSS (brand tokens from `../DESIGN.md`: Quebracho / Cuero / Bronze / Brasa / Parchment)
- GSAP 3.13 (ScrollTrigger, SplitText, ScrollTo) from jsdelivr — all plugins are free since 2024
- Google Fonts: Ibarra Real Nova (display) + Archivo (UI)
- Photography: client-owned, harvested from elgauchotirana.com (`../assets/harvest/photo-inventory.md`)

## Motion map
| Moment | What happens |
|---|---|
| Entrance | Logo + Spanish word cycler + real load progress; the loading bar surges like a heated iron and the room parts along it (top/bottom curtains) → hero settles from 1.22× → headline chars rise with 3D tilt → nav/CTA cascade. Repeat visits in the same session shorten it to ~1 s; an 8 s watchdog and a CDN-failure guard mean nobody is ever trapped behind it |
| Hero loops | Ember canvas with a bottom-centre fire source (sparks dim as they rise, bloom on big sparks, pauses off-screen), directional Ken Burns, spinning circular badge |
| Story | Masked line-by-line serif reveal, parallax frames (`data-speed`), clip-path image wipes |
| Los Cortes | Pinned horizontal scroll (refreshPriority-sorted), 7 panels with giant ghost numerals, background parallax, per-panel stagger via `containerAnimation`, geometry-accurate 01/06 counter + progress bar. Falls back to a vertical stack under 561 px viewport height |
| La Cantina | Count-up stats, slow Ken Burns, parallax bottle duo |
| Gallery | Infinite filmstrip loop that slows on hover and skews with scroll velocity |
| Quotes | 6 s auto-rotating crossfade with manual dots |

## Fallbacks
- `prefers-reduced-motion: reduce` or `?static=1` → no loader, no loops, no pinning; cuts stack vertically
- No JS → everything visible (`html:not(.js)` rules)
- Cursor only on `hover: hover` + `pointer: fine` devices

## Before go-live
1. Confirm with the kitchen: bison on the menu? 11:00 vs 12:00 opening? La Sierra hours?
2. `cwebp -q 80` the images in `assets/img` (≈7 MB now) and add `<picture>` sources
3. Albanian (SQ) version — content docs have the Spanish terms fixed; Albanian copy still to be written
4. Replace the AltaTaste link if booking moves in-house
