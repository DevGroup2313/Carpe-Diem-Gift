# Carpe Diem 1077

Copyright (c) 2026 Yannie D. Forest. All rights reserved.

Build 1077 is made from build 1076 by `cd1077.py IN_1076.html OUT.html`, once for each edition (the owner's full
edition, the committee demonstration and the public sample). The parts, in order:

* `p_chat.py` with `chat.css` and `chat.js`: **the Librarian's and Magister's conversations in the look the owner
  approved** ("I love the chats new look for Magister and the Librarian, push it everywhere"). Ingenium's chat in
  Carpe Diem's colours (the Librarian's cream and gold, Magister's blue), in three looks chosen from the ⋯ menu and
  kept (Carpe Diem: the conversation in its raised card, each message raised; Soft: quieter messages; Clean: flat and
  open, like a page), by day and by night. Each message lifts under the pointer and has its own keys (read aloud, copy,
  keep in my notes; edit, copy, ask again); the Librarian's books are cards with their spines and Open the book; the
  moods and prompts are keys; Enter sends and Shift+Enter breaks a line; the end of a session offers keep, new and
  close. Everything the two pages did is done by the app's own functions, and should anything fail the app draws its
  own page. The old Magister page's dresser (1047) leaves the new pages alone.
* `p_home.py` with `home.css` and `home.js`: **Home is never empty on a low-energy day.** The owner: "after I leave the
  Overview page to go back to the Home tab, the entire Home page is missing". Low on an Overview's energy card is the
  app's own low-energy day, which hides everything on Home but its top, where only the day's next step stays; on a day
  with no next step (a Saturday, a day with no plan) nothing was left. Home now carries the low day's own card at its
  top (the Focus page's, drawn by the support core's mount): what is showing and why, Make today a Gentle Day, and Show
  everything again. The two marks of a low day on the page (the support core's and the one that hides Home's content)
  now follow each other at once, so Home never stands empty for the moment between them. The energy cards' note for
  Low says that Home shows only the essentials.
* `p_builders.py`: the install kits carry build 1077. The files the release writes the build's record into (each
  project's BUILD_INFO, the Windows installer's version, the Fire tablet's version name, the READMEs) are now taken as
  the release will write them, not as the repository held them before: 1076's Mac, Windows and Fire kits said
  "Pass: 1075", and the workflow that makes the kits stopped on it.

Then, as in every pass: the boot map, the build record, the integrity seal, the page's photograph of itself and the
mini Forge's trust of this very build.

## Tests

* `tests/t_chat_use.js URL OUT`: the two conversations used as a person uses them (every mood and prompt, a free
  question, a book opened, copy, read aloud, keep in my notes, edit and ask again, the three looks kept, begin again,
  the end of a session, back; in French; pictures by day and by night).
* `tests/t_home_low.js URL OUT`: Low chosen on Home's Overview, then back to Home by its tabs: the low day's card at the
  top, only the essentials, a weekday's next step under the card, Show everything again bringing the whole of Home
  back, the Focus page's switch, French, night.
* `tests/t_untouched.js OLD_URL NEW_URL`: every visible key elsewhere in the app has the same computed look as in the
  build before, by day and by night.
* `tests/t_holds.js PAGE.html`, `tests/t_backup_host.py`: as before.
