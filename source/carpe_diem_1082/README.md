# Carpe Diem 1082

Copyright (c) 2026 Yannie D. Forest. All rights reserved.

Build 1082 is made from build 1081 by `cd1082.py IN_1081.html OUT.html`. The parts, in order:

* `p_print.py`, with `tabula_print.py` + `tabula_print.js` (Tabula's page) and `print1082.js` (the app's page):
  **Tabula prints in colour.** The owner: "I can't print in color in Tabula no matter what I try ... Tabula turns it to
  gray scale." In the Mac app, Print made a PDF of Tabula's own (`cdBuildPdf`: black Times text, no colour, no
  highlight, no picture) and handed it to Preview; measured, 0 % of its pixels carry colour. In a browser by night, the
  page printed the night's pale ink on white. Print now builds a clean copy of the document (`cdPrintHtml`: Tabula's
  own styles as by day, the text colours, highlights, shaded cells and pictures, `print-color-adjust: exact`, never the
  screen's page marks) and prints that: in a frame of its own where a frame can print (`cdPrintFrame`: browsers, the
  Windows app), and through the app's own window where it cannot (the Mac app, whose `window.print` opens the Mac's
  print panel): the page sets the copy in a surface only the printer sees (`#cd-print-surface`, a shadow root, apart
  from the app's styles) and prints itself. A Mac app whose window could not print would hand the copy to the Mac's
  browser. Where the engine draws page margin boxes (Chromium 131 on: the Windows app, Chrome, Edge), the header, the
  footer and the page numbers are on every page, in the format chosen; elsewhere the header opens the document and the
  footer ends it, as before. Export, PDF Document, is as it was.
* `p_print.py`, with `tabula_lists.py`: **a list that reaches the end of a page is split there.** The owner: "bullet
  points will choose to go to the next page in bulk; leaving ample space before the page ends ... prioritising filling
  the page over page style." Tabula lays its pages out itself; a list was never cut, so it moved whole (267 px left
  empty in the test document), and a list longer than a page ran across the gap between pages. Now the first item that
  does not fit starts the next page (its own top margin carries it, so its bullet or number goes with it; in Safari's
  engine a line moved by the paragraph's method left its number behind), and an item of several lines is cut between
  two lines with no minimum kept on either side. A list that carries footnotes, pictures or tables is laid out as
  before. `docBody` (Word, HTML) and the print copy never carry the page marks (`cdPageMarksOff`).
* `p_builders.py`: the install kits carry build 1082.

Then, as in every pass: the boot map, the build record, the integrity seal, the page's photograph of itself and the
mini Forge's trust of this very build.

## Tests

Chromium, Safari's engine (WebKit) and Firefox, with Playwright (`CD_CHROMIUM` names a Chromium if need be):

* `tests/t_lists.js TABULA_URL`: three documents (a long numbered list, long items, nested lists): no page left with
  more empty room than a line needs, no line in the gap between pages, a moved item's bullet beside it, typing inside
  a split list, no page marks in a file. 1081 fails; 1082 passes in the three engines.
* `tests/t_print_doc.js TABULA_URL OUTDIR`: the print copy printed to PDF by day and by night, with and without
  page numbers: colour on the page (6.3 % of pixels; 0 % before), white paper by night, every word once, the header and
  "Page 1 of 3" on every page.
* `tests/t_print_host.js PAGE_URL OUTDIR`: Print inside Carpe Diem: in a browser the room's own frame prints; with a
  stand-in for the Mac app the app's window prints the surface (3 pages, every word once, none of the app's own words).
* On GitHub's Mac (`.github/mac-check/t_mac_windows.py`): the Mac program itself prints Tabula's document through the
  Mac's own printing to a file, and the pages are read back; then rooms are asked for in windows of their own.
* 1081's `t_rooms_all.js` passes; the seal holds and no page error shows in the three engines; `.github/kits/make_kits.js`
  makes the six kits and the standalone page.

## Not done here, and said plainly

* The public sample and the committee demonstration are not rebuilt: their pages as built (before protection) are not
  in any repository, only their protected copies.
* The owner's Mac mini (macOS 27) opens no window for a room. GitHub offers no macOS 27 to try it on; the Mac check
  above runs on macOS 26, where the windows open.
