# Carpe Diem 1080

Copyright (c) 2026 Yannie D. Forest. All rights reserved.

Build 1080 is made from build 1079 by `cd1080.py IN_1079.html OUT.html`, once for each edition (the owner's full
edition, the committee demonstration and the public sample). The parts, in order:

* `p_fixes80.py` with `fixes80.css`: **four things the owner saw** (1 November 2026).
  1. "The little hover cards for the Ascensus page and its tabs ... are entirely transluscent and almost ineligible in
     Dark mode." The name card (#cd-name-tip, block cd-ctxmenu-843) takes the look of the key it names; when that key's
     face is a gradient it was given the gradient alone, and by night the keys' faces are a faint white veil. The
     gradient is now laid over the solid colour beneath the key.
  2. "The side emoji buttons do not show inside of the 'Ask the Librarian' chat page only the collapsible chevron."
     The conversations (1077) open in the modal root, and the panel watch (cd-panel-watch) counted any child there as a
     panel, which hides the side keys. A conversation is now a page: the side keys stay above it and the chevron folds
     them there. A real panel still hides them.
  3. "The Fontes button on the Candidatus/Projects page is missing its app symbol." The Proposal's and the Citations'
     Fontes keys (the demonstrations' Drafts and Citations) carry Home's drawing of Fontes.
  4. "I want the 'Offline By Design' card to only be tan on Folio mode and to be white acrylic on Classic mode." By day
     in Classic the card is a frosted white surface; Folio keeps its tan card; night is unchanged.
* `p_builders.py`: the install kits carry build 1080.

Then, as in every pass: the boot map, the build record, the integrity seal, the page's photograph of itself and the
mini Forge's trust of this very build.

## Tests

* `tests/t_fixes80.js PAGE.html OUTDIR`: the four fixes as a person meets them (the name card by night on Ascensus; the
  side keys with the Librarian's conversation, folded and back, and still hidden by a real panel; every Fontes key's
  drawing; Offline by design in Classic and in Folio), with no page error.
