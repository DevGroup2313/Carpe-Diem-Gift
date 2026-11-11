# Carpe Diem 1086

Copyright (c) 2026 Yannie D. Forest. All rights reserved.

Build 1086 is made from build 1085 by `cd1086.py IN_1085.html OUT.html`. The parts:

* `p_lock.py`, with `lock1086_core.js`, `lock1086_gcm.js`, `aes_r197.js`, `lock1086_door.js`, `lock1086.css` and
  `lock1086_words.txt`: **a sign-in for Carpe Diem, as Ingenium has it, and what it keeps on the device sealed.**
  The owner: "I want for Carpe Diem to be encrypted so that my data and any users' data can be protected on their
  device. I also want the option to have a sign-in or login screen and user name and password to log into the app."
  And: "I want you to replicate Ingenium's sign-in page and features. I want full parity with Ingenium but
  customised specifically for Carpe Diem."
  * **Setting it up.** The welcome card has a lock key at its top left. It opens "Protect this copy with a sign-in":
    a user name, a password of at least eight characters, and the same password again; then the ten words of a
    recovery phrase to write down, and two of them asked back. Then Carpe Diem seals what it keeps, with a bar that
    shows how far it has gone.
  * **The cryptography is Ingenium's.** A data key of 256 bits seals every value with AES-256-GCM. The data key is
    itself sealed twice: under a key made from the password and under one made from the recovery phrase, each by
    PBKDF2 with SHA-256, at between 600,000 and 2,000,000 rounds (measured on the device so that it takes about
    three quarters of a second). The phrase is ten words from a list of 512, so about 90 bits of chance. Each value
    is bound to its own name, so a sealed value moved under another name does not open.
  * **What is sealed.** Every value in the browser's store (the desk: the planner, notes, proposals, the curriculum
    and its marks, the French tutor, settings; Fontes's sources; Abacus's workbooks; Imago's decks; Tabula's smaller
    documents and settings; the signatures); Tabula's documents in its larger store; Scriba's recordings, their sound
    and their transcripts (a recording's name too); the desk's copy in the larger store; the backups kept inside the
    browser. A value written before the sign-in, or brought in by a restore, is sealed at the next start.
  * **The start.** A copy with a sign-in opens to it, and nothing else of Carpe Diem runs until the password or the
    phrase opens the data key: the rest of the page is read as plain text, so none of it starts, and the page still
    finishes loading as a page should. A wrong password opens nothing and changes nothing.
  * **Signed in.** The key is held for that window only, while it is open: a reload keeps you signed in; closing the
    window ends it. The rooms inside the window use the window's key. A window Carpe Diem opens itself inherits it;
    a window opened apart asks a signed-in window for it and, if none answers, asks for the password.
  * **Forgot your password?** The recovery phrase opens the copy and a new password is chosen. With neither, Carpe
    Diem can start again empty and with no sign-in; what was sealed in the browser's store is kept aside, unopened.
  * **The lock key's sheet.** Lock now; lock by itself after five minutes, a quarter of an hour (the default), an
    hour, or never; change the password; see the recovery phrase (the password is asked first); turn the sign-in off,
    which opens every sealed value again.
  * **Backups.** A backup holds the work opened, so it restores on any device, sealed by its own passphrase as
    before. The sign-in's own record never travels in a backup.
  * **The welcome card** gains the switch "Open straight to Home from now on". The card stays one click away, on the
    seal.
  * Every word of it is in English and in French.
* `p_builders.py`: the install kits carry build 1086.

## Tests

`tests/t_lock.js PAGE_URL [engine]`, from a fresh copy, as a person uses it: work is made first (the desk, a document
in Tabula's larger store, a recording in Scriba's); the sign-in is set from the lock key; then every value is sealed,
a new window shows only the sign-in and the app does not start, a wrong password opens nothing, the right one opens
everything as it was, Lock now locks, the phrase opens it and keeps a new password, the old password no longer opens
it, a backup holds the work opened and not the sign-in, and turning it off gives every value back in plain.
It passes, 16 of 16, in Chromium, in Safari's engine (WebKit) and in Firefox. In the test browser, Safari's engine
refuses to keep a sound file in its database at all (build 1085 the same), so there the test keeps the recording's
sound as bytes; Carpe Diem seals it either way.

`tests/t_door_skip.js PAGE_URL`: the welcome card's switch, off at first; on, Carpe Diem opens straight to Home and
the card still opens when asked; in French, its words are French; off again, the card is back. It passes (Chromium).

Found and mended while testing: a first version watched the whole page as it was built, to fit itself to each new
frame; on a page this size that crashed Safari's engine as the page loaded. It now fits a frame the moment any code
reaches into it, and the page loads in Safari's engine as fast as build 1085 (about five seconds in the test).

Also on this build: 1085's `t_blocks.js` and `t_blocks_more.js` on Tabula as built here, 1082's `t_lists.js`,
`t_print_doc.js` and `t_print_host.js`, 1083's `t_macrooms.js` (three engines), 1084's `t_fr_rooms.js` (Chromium),
the seal (Chromium and Firefox) and the six install kits all pass.

## What this does not claim

* The Forge's own stores (the apps built in the mini Forge keep their data there) are not sealed in this build.
* While a window is signed in, its key is held in that window's session store. A browser that restores tabs after a
  restart may keep such a tab signed in; choose Lock now before closing it. Carpe Diem's own apps close the session
  with the window.
* A window the Mac app opens apart for a room asks the signed-in window for the key; whether the Mac lets two of its
  windows speak so was not tried here (GitHub's Mac has no screen for it). If it does not, that window asks for the
  password once.
* The sign-in needs the browser's cryptography. The Mac and Windows apps, the Fire tablet app and the web edition
  have it. Whether the iPhone and iPad app has it, opening the page as a file, was not tried; where it is missing,
  the sign-in says so and cannot be turned on.
* Sealing does not protect against a program running on the device while Carpe Diem is signed in.
