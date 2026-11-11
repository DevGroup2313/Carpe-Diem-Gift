# Carpe Diem 1088

Copyright (c) 2026 Yannie D. Forest. All rights reserved.

Build 1088 is made from build 1087 by `cd1088.py IN_1087.html OUT.html`, after `open_with_edits.py GIFT_REPO` (the
Mac, Windows and Fire tablet projects, and the Mac and Windows builds' checks) and `ios_open_with.py OFFLINE_IOS_REPO`
(the iPhone and iPad project). The parts:

* `p_open_with.py`: **Tabula offered under Open With, on every device, for the files it reads.** The owner: "I want
  for Tabula inside of Carpe Diem to be offered as a choice to open Word Documents, PDFs and etc. I want full parity
  please."
  * **What was so.** The Mac (1072, 1073) and Windows (1072) apps offered Tabula for Word (.docx) and PDF files. The
    Fire tablet, the iPhone and iPad, and the web edition did not offer it.
  * **The kinds.** Word (.docx), PDF, plain text (.txt), web pages (.html, .htm) and Markdown (.md). Markdown's
    headings, lists, quotations, bold, italics and code become Tabula's own. A kind Tabula cannot read is refused in
    words, in English or in French, and nothing on the page is touched.
  * **Mac.** Tabula's own app (in ~/Applications/Carpe Diem Rooms) is offered under Open With for the five kinds, as
    an alternative: the owner chooses the default in the Finder's Get Info. The rooms' apps are made again once, so
    that the Mac learns the new kinds. Markdown is declared for a Mac that does not know it.
  * **Windows.** Explorer's Open With offers Tabula for .txt, .html, .htm and .md, besides .docx and .pdf. Uninstalling
    removes them.
  * **Fire tablet.** Open with and Share offer Carpe Diem for the five kinds. The app reads the file, keeps it until
    the page takes it, and Tabula opens it. Words shared from another app (not a file) open in Tabula as plain text.
    There is one Carpe Diem at a time: a file opened while Carpe Diem is open goes to the one already open.
  * **iPhone and iPad.** "Open in Carpe Diem", from Files, Mail or a share sheet, for the five kinds. The file waits
    for the page and opens in Tabula. Only Carpe Diem's own page can take it, as for the clipboard. The copy that iOS
    makes in the app's own folder is removed once it has been read; the file itself stays where it was.
  * **The web edition, installed.** Its manifest names the five kinds (`file_handlers`), and the page takes the files
    the system gives it (`launchQueue`).
  * **One door.** The page asks every app it runs in through one door (the Mac and Windows apps' bridge, the tablet's
    and the iPhone's), so a file arrives the same way everywhere and goes through the same readers as Tabula's File,
    Open.
* `p_builders.py`: the install kits carry build 1088, with the same Open With in each kit's project.

## Tests

`tests/t_open_with.js PAGE_URL [engine]`: three hosts are stood in for (a computer's bridge, the tablet's and the
iPhone's). Each hands Tabula a Word file, a text file, a web page and a Markdown file. Each file opens in Tabula with
its words and with its name as the title, and the host is told "opened". Markdown keeps its headings, lists and
emphasis. An RTF file is refused in words. It passes, 14 of 14, in Chromium, in Safari's engine (WebKit) and in
Firefox.

The Mac and Windows builds on GitHub now also check the new kinds: on the Mac, that the Finder's Open With offers
Tabula for a text file, a web page and a Markdown file, and that a Markdown file opened with Tabula reaches Tabula's
own window; on Windows, that Open With offers Tabula for .txt, .html, .htm and .md, that a Markdown file opened with
Tabula reaches Tabula's own window, and that uninstalling removes it from Open With.

## What this does not claim

* An old binary Word file (.doc), RTF and OpenDocument text (.odt) are not offered, because Tabula cannot read them
  yet. PowerPoint and Excel files are not offered to Tabula; Open With does not yet offer Imago or Abacus for them.
* The tablet's Java and the iPhone's Swift were not run here: GitHub's builds compile them. Open With was not tried on
  a Fire tablet, on an iPhone or on an iPad.
* The iPhone and iPad kit inside the page carries the same project. Its ready-made app (`CarpeDiem.ipa`) carries the
  page of this build but an older shell, which does not take files; the project must be built again for that.
* File handling for an installed web app is offered by Chrome and Edge on a computer. To my knowledge, Safari and
  Firefox do not offer it; this was not tried here.
