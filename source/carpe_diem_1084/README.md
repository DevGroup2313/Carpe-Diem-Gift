# Carpe Diem 1084

Copyright (c) 2026 Yannie D. Forest. All rights reserved.

Build 1084 is made from build 1083 by `cd1084.py IN_1083.html OUT.html`. The parts:

* `p_french.py`, with `fr_words.py` and `abacus_status.py`: **the five rooms speak French throughout.** The owner:
  "The guidebook is not fully translated to French, there are still other areas inside of the app that are not
  translated. I want Carpe Diem to be fully bilingual."
  * **The Guidebook was found whole in French already.** Its 40 chapters were opened and its 39 Tips keys pressed,
    and of the 233 passages read none was English. What was left in English was inside the rooms.
  * **343 words and sentences** were gathered from the rooms as the person sees them, tab by tab and menu by menu
    (`tests/t_fr_rooms.js` does the gathering), and given their French: Tabula's ribbon in part, its hover words, its
    File page and its Mailings group; Abacus's ribbon almost whole, its hover words and the bar at the foot of its
    sheet; Imago's hover words; Scriba's two tabs; the whole of Fontes's form, its kinds of source and its styles of
    citation.
  * Tabula, Abacus and Imago each carry a layer that puts French in place of English wherever it is written (pass
    1052); the new words are added to those three, and **Scriba and Fontes are given a layer of their own**, the same
    one word for word, so every room is served the same way. A word the room had already is left as the room has it.
  * Abacus's bar at the foot ("Prêt · Cellule A1 · Nombre 11 · Moyenne 15,47 · Somme 170,17") is built as the person
    moves about the sheet, so no layer can reach it; it is given its words in the code (`abacus_status.py`).
  * **Names that are not words of the language are left as they are**: the fonts (Calibri, Garamond, Bradley Hand),
    the makers' formats (Word, Excel, PowerPoint, BibTeX, RIS, CSL-JSON), the paper sizes Letter and Legal, the
    styles of citation (APA, OSCOLA, MLA, Chicago, Harvard) and the tongues in Scriba's list, which name themselves
    (English, Español, Deutsch, Italiano, Nederlands).
* `p_builders.py`: the install kits carry build 1084.

## Tests

`tests/t_fr_rooms.js PAGE_URL [engines]`, from the very words the build uses (`tests/fr_words.json`):

* in French, no room may show the English of any of the 343; in English, no room may show the French;
* every ribbon tab of every room is opened before the reading, so the hover words and the deeper groups are seen;
* the Guidebook in French: every chapter opened, no passage of four words or more that reads as English;
* no page error.

It passes in Chromium, in Safari's engine (WebKit) and in Firefox. 1081's `t_rooms_all.js`, 1082's `t_lists.js`,
`t_print_doc.js` and `t_print_host.js`, 1083's `t_macrooms.js`, the seal in three engines and the six install kits
all pass on this build.

## What this does not claim

The rooms' own sample documents and the words a person types are their own and are not translated. Outside the five
rooms, the app's own pages were read in French in this pass's audit and none was found in English; where the app
speaks in words a person wrote (a note, a title, a document), those words stay as written.
