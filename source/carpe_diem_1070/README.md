# Carpe Diem 1070: how this build was made

`p_still.py` adds one script to the page (`cd-1070-still`) and mends two older helpers. Measured in headless Chromium
(software drawing), with nothing touched:

* Several decorations move without end: the glitter on the app keys (`cdGlitter`, a `::before` whose `background-size`
  changes, under four soft shadows), the glow on Tabula's app keys (`tbAppGlow`, a `box-shadow`), the seal, the bell, the
  dots. Each frame of the glitter made the browser paint again a large part of the window around it: on Home about
  1.3 to 1.5 s of painting in every 3 s; in Tabula with a 100,000-word document open, 2.0 to 2.3 s. Home's went on
  moving behind Tabula.
* Every 1.5 s (and soon after a click, Escape or a resize) the script looks at every endless CSS animation in the page
  and in its same-origin frames. One that can be seen and paints (anything but transform or opacity) gets a layer of its
  own (`data-cd-lay`: `will-change: transform` on the `::before`, `::after` or, if it holds no words and nothing that
  stacks or is fixed, the element itself). Elements that hold words are left off layers: on a layer, text loses the
  screen's finest smoothing, and the keys' glow costs little where it is.
* One that cannot be seen is held still (`data-cd-hush`, `animation-play-state: paused`, ranked as five ids so the keys'
  own rules that name them by id do not override it): outside the window, or covered at its middle and near both ends
  by another part of the page (a child of the body: an app, a room, a window) drawn above its own. A decoration covered
  by its own glass (the seal's art under its layers) or one that takes no clicks is judged by part, never by what is hit.
  While someone types in a frame, that frame is looked at again after the next pause.
* `paintFold` (cd-699) rewrote the top bar's fold key every 0.8 s though nothing changed, which woke `cd-519-barefold`
  to mark every caret key again (an attribute change even when the class was there), which woke cd-699 again. Both now
  write only a change.

Results: idle painting on Home 1.3 to 1.5 s → 0.02 to 0.06 s per 3 s; in Tabula with the dissertation 2.0 to 2.3 s →
about 1 ms; the page's own idle work on Home 904 → 416 ms per 3 s; typing in the dissertation about 50 → 30 ms a key.
Screenshots of 1069 and 1070 with every endless animation frozen at the same moments: Tabula's ribbon identical to the
pixel, Home within 53 pixels (the soft edge of a sparkle). Earlier tests rerun: the door's chime (full and demo), the
Refresh row and the new-build card, Tabula's ribbon, Abacus, the Word round trip of the dissertation (310 notes).
Tests: `tests/t_still.js <page>`, `tests/t_idle_cost.js <page> base|layer|hidden|none [file.docx]`,
`tests/t_still_look.js <page> <tag>`.
