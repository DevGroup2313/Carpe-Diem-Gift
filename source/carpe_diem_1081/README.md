# Carpe Diem 1081

Copyright (c) 2026 Yannie D. Forest. All rights reserved.

Build 1081 is made from build 1080 by `cd1081.py IN_1080.html OUT.html`, once for each edition (the owner's full
edition, the committee demonstration and the public sample). The parts, in order:

* `p_windows.py` with `windows1080.js` and `windows1080.css`: **Windows: the side keys hold one look in floating and room
  windows; day and night reach a room's own window at once.** The owner: "particularly the Quiet Screen leaf keeps
  glitching in and out of its updated design without the black harsh lines, the emoji bell and some of the other emojis
  are transparent" and "the Light/Dark mode change and some other transitions are moving really slow on the standalone
  exported floating windows". On Windows 10 pass 1060 shows Microsoft's flat pictures for the side keys; a floating
  window's column (cd-jewel-js, dressFabs, every 700 ms) copied each main key's text, which undid the leaf's picture
  (it flickered 4 to 7 times in 8 s) and left the bell and the thought balloon empty. The column now writes through one
  function (cdWinKey1080). The day/night key was rewritten three to ten times per change; a write that shows what the
  key shows is dropped. In a room's own window a change is shown at once and the hidden desk's redraw follows 260 ms
  later (first drawn frame, median: 588 to 156 ms under load). `launcher_edits.json`, applied to both launchers in
  this build: broadcast_theme tells every window except the sender, each on its own thread (rooms reached in 20 to
  80 ms instead of after a busy desk, 600 ms or more).
* `p_film.py` with `film80.js`, `film80.css` and `film/`: **the Guidebook's film, sharp, with the side keys drawn by the
  device.** The owner: "it reads as an android with a harsh dark outline around the emoji buttons". The film is made
  again by `rec_film80.js` (the page's time held still, one 2x screenshot per frame, 30 frames a second) and
  `build_film.py` (1728x1080 H.264 High 4.0, CRF 24): the owner's cut 53.7 s, 4.1 MB; the demonstrations' cut 47.5 s,
  3.1 MB. The side keys' glyphs are hidden in the film and their place, turn and opacity written for every frame
  (`film/*_keys.json`); the player draws them over the film with the real keys' own glyphs and font on the device (on
  Windows 10, pass 1060's pictures), following the frame shown. The player never shows the film larger than it stays
  sharp, and has its own bar below the film instead of the browser's controls. Emojis inside the page content stay as
  filmed. The film's data is no longer compiled as script at start.
* `p_builders.py`: the install kits carry build 1081 and the launchers as changed.

Then, as in every pass: the boot map, the build record, the integrity seal, the page's photograph of itself and the
mini Forge's trust of this very build.

## Tests

* `tests/t_keys.js URL win10|win11|mac`: every drawn frame for 8 s with two day/night changes, desk with a floating
  Tabula and Tabula's own window (1079 fails on Windows 10; 1081 passes on all three). `tests/t_horo.js`,
  `tests/t_boot.js`, `tests/t_room_theme.js`, `tests/t_rooms_all.js`, `tests/ab_theme.js`; `tests/t_relay.py ROOT`
  for the launchers.
* `tests/t_film.js PAGE OUTDIR tests/check`: the film's real size, the drawn keys against the filmed places at twelve
  moments, captions, speed, scenes, Read instead, keyboard, French, night, a 1024-px window, Windows 10 pictures.
