# Carpe Diem 1076

Copyright (c) 2026 Yannie D. Forest. All rights reserved.

Build 1076 is made from build 1075 by `cd1076.py IN_1075.html OUT.html`, once for each edition (the owner's full
edition, the committee demonstration and the public sample). The parts, in order:

* `p_cand2.py` with `cand.css`, `cand.js`, `tabs.css` and `tabs.js`, in place of 1075's module:
  * **The app's own feel on the new pages.** Every key stands raised on its edge, rises under the pointer and sinks when
    pressed, on the app's springy curve and with the app's own shadows (measured on its keys and cards, by day and by
    night); every card is raised and lifts. Nothing that can be pressed is flat: the time of a step, the stations of
    the road, the board's ✓ ‹ › × keys and "+" keys, the steps' boxes, the guides, the parts of the day. The cards pop
    in as the app's pages do, and are no longer pinned by their entrance (an animation that kept its end state had
    stopped them lifting). Rings, bars and roads fill in from where they were; a finished step bows out, a moved or new
    one lands with a spring; the station you are at breathes gently. The motion settings and reduced motion are kept.
  * **Applications, Proposal, Milestones and Citations** redesigned like the Overview, everything each tab did kept (the
    app's own working parts are set in the new cards, and each tab falls back to the app's own drawing should anything
    fail). Applications: the three buckets as raised tiles, the chosen one pressed in; each programme a card with its
    checklist ring, opening on the app's own detail (status, deadlines, the fit, funding notes, pros and cons, the
    checklist, Mark submitted). Proposal: the proposal's card with its ring, the title as a key, the workspace keys,
    Course IV, Tabula and Fontes; each section a card with its ring and mark, opening on its parts, mark, workshop and
    notes. Milestones: the dated milestones as a road standing up, each with its date key (the proposal's milestone
    still sets the proposal's target), and funding and visa as checklists. Citations: a card for each reference, the
    form for a new one or an edit, and Fontes.
  * At a phone's width every key keeps clear of the dock at the right edge.
  * The demonstrations keep their own Projects pages. The rest of the app is as it was: only the pages the owner asked
    for are changed.
* `p_builders.py`: the install kits carry build 1076.

Then, as in every pass: the boot map, the build record, the integrity seal, the page's photograph of itself and the
mini Forge's trust of this very build.

## Tests

* `tests/t_tabs_use.js URL`: the four tabs used as a person uses them (buckets, a programme opened, its status,
  deadline, checklist and Mark submitted, a new programme, one removed; a section opened, a part ticked, a mark
  recorded, the workshop, the title key; a milestone done and dated, the proposal's target following; funding and visa;
  a reference added, edited and deleted; French), and every visible key checked to be raised.
* `tests/t_cand_use.js URL`: the Overview and Home's Overview, as in 1075, with the new keys.
* `tests/t_cand_demo.js URL OUT`, `tests/t_road.js URL`, `tests/t_holds.js PAGE.html`, `tests/t_cand_shots.js`: as in 1075.
* `tests/rec_motion.js URL OUTDIR`: a short film of the feel, with a visible pointer.
