# Carpe Diem 1075

Copyright (c) 2026 Yannie D. Forest. All rights reserved.

Build 1075 is made from build 1074 by `cd1075.py IN_1074.html OUT.html`, once for each edition (the owner's full
edition, the committee demonstration and the public sample). The parts, in order:

* `p_cand.py` with `cand.js` and `cand.css`: Candidatus's Overview in the design the owner approved, and Home's
  Overview given the same makeover.
  * Candidatus › Overview: the next step with its time and size, Begin with the Clepsydra, Break it into smaller steps,
    Another step and Done; today's energy (Low is the app's own low-energy day, the Focus page's switch, so short steps
    come first); where you left off, with Resume; Now, Next and Later, Now holding three at most, moved by keys or by
    dragging; the road to the offer; rings for the Proposal, Applications, Funding and Visa; what was done this week;
    thoughts parked for later; five guides at hand (a model email to a potential supervisor, five ways back in when
    stuck, asking a referee, preparing for the interview, reading a programme page); and the app's own "How Candidatus
    works" card. A step whose time was changed, or which was broken into smaller steps, stays the next step until it is
    done or another is asked for. The road shows seven stations at most (the first, the last, and five around where
    you are), numbered as on the whole road, with the count of all of them beneath.
  * Home › Overview: today with its parts of the day, the day's energy with the next task on the Agenda, Ascensus,
    reading and streak, French, and the proposal with its next step.
  * Cream, light blue, sage and butter cards, raised as the rest of Carpe Diem, in Carpe Diem's blue and gold; no
    purple and no seal; by day and by night, in English and in French, at a phone's width too. The app's two drawing
    functions hand over to the new ones, and draw the old pages should the new ones ever fail.
  * The demonstrations carry no proposal and no Candidatus page: their Overview leaves the proposal out, as theirs
    always has, and no Candidatus board is made in them.
* `p_holds.py`: the backup sheet's "This file holds" names the study under each edition's own store, and Tabula when
  only its large store is in the file.
* `p_builders.py`: the install kits carry build 1075.

Then, as in every pass: the boot map, the build record, the integrity seal, the page's photograph of itself and the
mini Forge's trust of this very build.

## Tests

* `tests/t_cand_use.js URL`: both pages used as a person uses them (energy, the next step, smaller steps, Another step,
  Done ticking a milestone, the board's keys, the cap of three, dragging, folding, parked thoughts, the five guides,
  Copy the model, Resume, the road, the rings, Begin, a reload, the Home Overview's keys, French and back).
* `tests/t_cand_demo.js URL OUT`: a demonstration's Home Overview: no proposal and no Candidatus on it, its keys, French,
  night.
* `tests/t_cand_shots.js URL OUT [lang] [width]`: both pages by day and by night, for the eye.
* `tests/t_road.js URL`: the road with sixteen stations: seven shown, where you are among them, the count of all.
* `tests/t_holds.js PAGE.html`: the backup sheet's list, taken from the page itself.
* `tests/t_backup_host.py PROGRAM.py`: the Mac or Windows program's backups; the computer's own variables are now given
  back before the last part, which looks at the computer itself.
