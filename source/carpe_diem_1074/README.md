# Carpe Diem 1074

Copyright (c) 2026 Yannie D. Forest. All rights reserved.

Build 1074 is made from build 1073 by `cd1074.py IN_1073.html OUT.html`, once for each edition (the owner's full
edition, the committee demonstration and the public sample). The parts, in order:

* `p_loading.py`: the loading page is the Forge's and Ingenium's own (the seal in a ring that turns, the name, the
  share of the page painted, Refresh and Keep waiting), in Carpe Diem's blue and gold, with Carpe Diem's own seal
  (`boot_seal_day.png`, `boot_seal_night.png`, drawn at 208 pixels from the seal of the page itself by
  `render_boot_seal.js`). The demonstrations keep "The Demo" under the name, and each edition reads its language from
  its own store.
* `p_french.py`: the notes' menu (⋯) and keys in French, in Carpe Diem, in a room's own window, and in the copy of the
  notes the mini Forge carries.
* `p_minforge2.py`: the mini Forge speaks Carpe Diem's language itself (its own state and page language are set from
  Carpe Diem's when it opens, and follow a change), so the Forge writes its own French words and its layer of French no
  longer writes over them a moment later: the cause of the flicker of the app menu, − 100% +, Full and More in French.
  The layer now writes before the paint, the header measures the words shown, the help keys are marked only when their
  mark changes, the app's name in the Editing key takes a line of its own rather than being cut short, and the words
  the Forge had no French for are given French. The Editing menu offers Another app beside Carpe Diem.
* `p_backup.py` with `backup.js`: backups compressed, sealed with a passphrase if wished (AES-256-GCM, PBKDF2-SHA-256,
  600,000 rounds), kept in pieces of 768 KB with three tries each and the progress shown, restored after a copy of the
  present work is kept, every day in the Mac and Windows apps. The apps' side is `backup_host.txt`, put into both
  programs by `apply_host.py` (the places: Documents › Carpe Diem › Backups and the cloud folders found, by label).
* `p_builders.py`: the install kits carry build 1074 and the repository's own files.

Then, as in every pass: the boot map, the build record, the integrity seal, the page's photograph of itself and the
mini Forge's trust of this very build.

## Tests

* `tests/t_backup_host.py PROGRAM.py`: the Mac or Windows program's backups, in a home of its own and on the real
  computer (also run by both build workflows).
* `tests/t_backup_page.js URL`: the Backup sheet in the page, with a stand-in for the apps: a backup in pieces with a
  refused piece, read back whole; a sealed one; four refusals; every day; Restore with Replace.
* `tests/t_french_menus.js URL`: the right-click menu and a note's menu and keys in French, in Carpe Diem, in Tabula and
  in the mini Forge.
* `tests/t_minforge_french.js URL OUT`: the mini Forge in French, its keys pressed one by one, what changes after each.
* `tests/t_minforge_words.js URL`: every word, title and label still in English in the mini Forge's Editor.
* `tests/t_loading.js URL OUT [id]`: the loading page by day and by night, in English and in French, at a phone's width.
