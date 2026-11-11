# Carpe Diem 1085

Copyright (c) 2026 Yannie D. Forest. All rights reserved.

Build 1085 is made from build 1084 by `cd1085.py IN_1084.html OUT.html`. The parts:

* `p_tabula_blocks.py`, with `tabula_blocks1085.js`: **Tabula keeps its paragraphs and bullet points in good order.**
  The owner: "Tabula still has a lot of formatting issues with the bullets points and paragraphs. I really want that
  fixed."
  * **What was wrong.** Tabula left lists, indents and new paragraphs to the browser's own editing. Measured in
    Chrome's engine and Safari's, both make the same faults: a list made inside a paragraph (which also kept it from
    filling the page); text after a list written into that same paragraph; a paragraph after a heading made as a
    different kind of block with no space after it; Increase Indent turning a paragraph into an italic grey
    quotation; Tab moving the caret out of the document, so the next words typed were lost; bullets taken off a list
    running its items into one paragraph; a nested list hung outside any item; Backspace at the start of the first
    item doing nothing.
  * **What Tabula does now.** Bullets and Numbering go on and off paragraph by paragraph. Tab and Shift+Tab move an
    item in and out a level; Tab on a list's first item moves the whole list in, as in Word. Within a line Tab is a
    tab, at Word's half inch; in a table it goes to the next cell, and past the last cell it adds a row. Increase and
    Decrease Indent are a real indent of half an inch (48 CSS pixels; CSS has 96 to the inch, and Tabula prints at
    that scale). Enter on an empty item moves it out a level, and again ends the list. Backspace at the start of an
    item takes its bullet off. The Bullet Library, the Numbering Library and the multilevel lists work as before.
  * **Order kept.** After every change Tabula checks the blocks around the caret: a list inside a paragraph is lifted
    out, a nested list is hung from the item before it, a stray block becomes a paragraph, an indent the browser made
    as a quotation becomes a plain indent, and two lists of one kind side by side become one. A document made before
    this build is put in order when it opens; its paragraphs typed after a heading gain the space a paragraph has.
  * **Its own Undo.** The browser's undo cannot follow such changes, so Tabula keeps its own history of the
    document: Undo and Redo by the keys (Ctrl or Cmd+Z, Ctrl+Y, Cmd+Shift+Z), by the buttons and by the Edit menu, a
    step for each change and for each pause in typing, up to 400 steps. Each step keeps only the blocks that changed,
    so a long document costs little.
  * **Word.** A Word file made from Tabula now carries tabs as Word tabs and indents as Word indents (left, first
    line and hanging, as a Chicago bibliography needs). A Word file opened in Tabula brings its indents in; before,
    they were dropped.
* `p_builders.py`: the install kits carry build 1085.

The mini Forge change prepared for this build (the live preview held still to the foot of the page) is not in it: the
owner reports that the preview no longer shakes.

## Tests

Run in Chromium, in Safari's engine (WebKit) and in Firefox, on Tabula alone and (Chromium) inside Carpe Diem:

* `tests/t_blocks.js TABULA_URL [engine]`: 19 cases typed with the keyboard and the buttons: a list with a nested
  level, Undo to the start and Redo to the end, bullets off and numbering on, Increase and Decrease Indent, Tab in a
  line, Backspace at the first item, paragraphs after a heading, an old document put in order, Tab and Shift+Tab on a
  chosen run of items, Enter on empty items, Tab in a table, one Undo step for a list change and one for typing.
* `tests/t_blocks_more.js TABULA_URL [engine]`: the Bullet and Numbering Libraries, the multilevel list, a list
  pasted into a paragraph, a Word file made and opened again, and a document of 99,001 words in 3,000 paragraphs.
  Measured there, over several runs: a list made in under 10 ms; an Undo in under 250 ms in every run (most
  under 40 ms). Times vary with the machine; these are from the test machine, not from the owner's devices.
* `tests/t_blocks_random.js TABULA_URL [engine] [steps] [seed]`: 300 or 400 random keys and buttons, repeatable by
  the seed. After each step: no page error, no list in a paragraph, no list outside an item, no loose words, the
  caret in the document; after each list or indent change, not a letter lost or added. At the end, Undo all the way
  gives the first document and Redo all the way the last. Passed for 7 seeds in Chromium, 5 in Firefox and 5 in WebKit.
* `tests/t_blocks_inapp.js PAGE_URL`: the same handling inside Carpe Diem's Tabula, with Undo.

1082's `t_lists.js` (lists split at a page's end), `t_print_doc.js` and `t_print_host.js`, 1083's `t_macrooms.js`,
1084's `t_fr_rooms.js` (Chromium), the seal (Chromium and Firefox) and the six install kits all pass on this build.

## What this does not claim

Tabula is not Word. This build makes paragraphs, lists, indents, tabs and Undo behave as Word does in the cases
tested above; it does not add Word's tab stops at chosen places, its list styles beyond those Tabula had, or its
outline view. Undo covers the document's body; the header, the footer and the notes keep the browser's own undo.
