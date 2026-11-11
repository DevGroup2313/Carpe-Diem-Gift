# Carpe Diem 1087

Copyright (c) 2026 Yannie D. Forest. All rights reserved.

Build 1087 is made from build 1086 by `cd1087.py IN_1086.html OUT.html`. The parts:

* `p_writing_rooms.py`, with `wr1087.js` and `wr1087.css`: **the Writing Rooms, each with a face of its own.** The
  owner: "I want the "Proposal", "Curriculum", "Research Writing" and "French Tutor" pages to be redesigned and receive
  a major upgrade in how they look, they do not match the rest of the app and look plain and basic. I want these rooms
  to properly fit the rest of the app and gain their own individual looks and identity."
  * **What was so.** The four open in one shared frame (`workspaceShell`, dressed by pass 411's rail): a flat cream
    page, a pale header bar and flat cards, the same for all four; the French Tutor's question at half width.
  * **Each room's face.** A raised medallion with its emblem (Proposal: a quill; Curriculum: an open book between
    laurels; Research Writing: a compass rose; the French Tutor: a fleur-de-lis), its colour (ink blue, oxblood, forest
    green, French blue), its name in the house's display letters, its Latin line under it as the app's own name has
    (PROPOSITVM, CVRRICVLVM, ARS SCRIBENDI, LINGVA GALLICA), and its emblem as a faint watermark behind the page.
  * **The doors.** Raised cards in the room's colour, each with a badge, that lift under the pointer and come in one
    after another. The badges go by each door's place, so they are the same in English and in French. The pages inside
    a room keep its face, smaller, beside the name, and number their sections in Roman numerals.
  * **The French Tutor.** Its modes as one tray of keys, its sets as raised pills, its score and level as pills, its
    question at full width with the answers lettered A to D; a right answer is marked with a tick, a wrong one with a
    cross; Next and Check are raised keys in the room's colour.
  * **Followed:** night mode, folio mode, French ("Les salles d'écriture"), a phone's width, and the reader's own
    Motion and Depth settings (no movement, no relief, when they are off).
  * **Unchanged:** what every page does. The layer only draws.
* `p_builders.py`: the install kits carry build 1087.

## Tests

`tests/t_rooms_face.js PAGE_URL [engine]`: each room opens with its face (its class, medallion, Latin line and badged
doors: six, three and five); every door of every room opens its page (fourteen), whose head keeps the room's face;
the French Tutor's answers are not taken for doors and carry their letters; a chosen answer is marked and Next brings
a new question; a typed answer is checked; Tables opens; by night the doors are dark; in French the badges are the
same and the heading is French. It passes, 25 of 25, in Chromium, in Safari's engine (WebKit) and in Firefox.

1079's `t_tabs_use.js` (Candidatus's tabs, among them the Proposal tab) passes on this build as on 1086, and the seal
passes in Chromium and Firefox.

## What this does not claim

The rooms' content is as it was: the same lessons, exercises and wording. The look was checked by pictures in a
desktop window and at a phone's width in Chromium; on the owner's devices it was not seen.
