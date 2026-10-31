# Carpe Diem 1079

Copyright (c) 2026 Yannie D. Forest. All rights reserved.

Build 1079 is made from build 1078 by `cd1079.py IN_1078.html OUT.html`, once for each edition (the owner's full
edition, the committee demonstration and the public sample). The parts, in order:

* `p_asc79.py` with `asc79.css`: **Ascensus's neon lights back, in the new design.** The owner: "I want the neon
  flashing lights back on the Ascensus page but I also want to keep the new design look of the page". The labours and
  the rank card glow again on the app's own round (its ascCardAura: gold, blue, lilac, teal, rose, 17 seconds, each
  labour a little out of step), laid over the new raised cards so their look stays; Calm, minimal motion and a device's
  reduced motion keep a still, soft gold glow instead of the flashing.
* `p_film79.py` with `film79.css`, `film79.js` and the films in `film/`: **the Guidebook's film, "Carpe Diem in
  action", with a link in the tour.** The owner: "add the preview video ... inside of Carpe Diem's Guidebook and also a
  link in the tour ... makes it more AuDHD accessible." The film the owner was sent showed the owner's own programmes
  and notes, so it is never put in a page: the same kind of film is made again by `rec_film.js` from a fresh profile,
  with neutral sample entries in Candidatus. The owner's edition carries the cut with Candidatus; the two
  demonstrations carry their own cut, filmed from the public sample (which has no Candidatus). The player is calm:
  nothing plays until Play is pressed, there is no sound, captions are on in the reader's language, the film can be
  slowed to three quarters or quickened, started again, jumped through by scene, or read instead as a list of what it
  shows; Space plays and pauses, the arrows move five seconds, Escape closes; speed and captions are remembered. It
  opens from a card at the top of the Guidebook (one entry only, as the owner asked); the tour's first chapter and its
  end offer it too. The film is in the page as base64 and becomes a playable file only when first opened, so it plays
  with the network off.
* `p_builders.py`: the install kits carry build 1079, their record files as the release writes them.

Then, as in every pass: the boot map, the build record, the integrity seal, the page's photograph of itself and the
mini Forge's trust of this very build.

## Tests

* `tests/t_film79.js URL OUT`: the film used as a person uses it (the Guidebook's one entry, opening still with
  captions, Play and Space, a scene key, the speed and captions remembered, Read instead, Escape, the tour's key; French;
  night).
* `tests/t_pages78.js`, `tests/t_home_low.js`, `tests/t_chat_use.js`, `tests/t_untouched.js`, `tests/t_holds.js`: as in
  1078.
* `rec_film.js URL OUTDIR`: how the films were made.
