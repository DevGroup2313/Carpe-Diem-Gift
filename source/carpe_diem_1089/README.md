# Carpe Diem 1089

Copyright (c) 2026 Yannie D. Forest. All rights reserved.

Build 1089 is made from build 1088 by `cd1089.py IN_1088.html OUT.html`, after `kits_step.py GIFT_REPO` (the install
kits' build step). The parts:

* `p_guidebook.py`, with `gb1089.js` and `gb1089.css`: **the Guidebook and the tour, tidied.** The owner: "Please clean
  up the guidebook and the tour of unecessary entries and make it neater and more organised. The guidebook might need
  a slight redesign."
  * **What was so.** The Guidebook's first page was one list of forty-one chapters in no order: the Forge's
    installers came first and Home ninth, and two notes on the look of the page stood among the rooms. Several
    chapters described an earlier build. The Focus page, second in the app's own menu, had no chapter. The chapter on
    editing the app from inside it vanished as soon as the language changed, so a French reader never saw it. The
    tour had 201 cards, about 15,600 words, and its first card gave a length that was much too short.
  * **Sections.** The chapters stand in nine sections, each with a numeral, a name and a line saying what it holds:
    Your day; Focus and small tools; Reading and study; Tutors and practice; Your projects; The five studios; Around
    the desk; Your copy of Carpe Diem; For the author. Above them: a search field ("Find a chapter"), which shows only the chapters holding every word typed and opens the chapter when one is left; a
    contents strip of nine keys with their chapter counts, each bringing its section to the top; and a line saying how
    long the short tour and the full tour take, with a key for the full one. In English and in French, by day and by
    night, at a phone's width, and with the reader's Motion and Depth settings.
  * **Set aside:** The Quiet Index and One light for every room, two notes on the look of the page. What they said
    that a reader needs (the theme is one switch for every room; Display holds the navigation) is now in The top bar.
  * **Added:** a chapter for the Focus page (Focus, the supports), drawn from the tour's own Focus cards, in English
    and in French: Smaller steps, Just start, Time you can see, the Inbox, Low-energy days, Calm mode, Routines, the
    Focus room, and what today asks of you.
  * **Put right**, each checked in the running app before it was changed, in English and in French:
    * Installers and files: the Installers room makes seven things (one file, a web folder, and the packages for the
      iPhone and iPad, the Mac, the Mac mini, Windows and the Fire tablet), not three; "What cannot be made here"
      becomes "What is built elsewhere": the packages carry their projects and GitHub builds the apps, and the iPhone
      and iPad package arrives finished. The same correction is made in the tour's card on the installers and in the
      Installers room itself ("the makers below", not "the five makers").
    * The morning door: the sky is chosen on the door itself (Sunny, Windy, Gloomy, and under More, Rainy, Stormy,
      Hot, Night), not with a button in the top bar.
    * The sky, and setting the day: the sky page opens from Display, then Sky.
    * The top bar: it holds Status, Alerts, Display, Guide, About and the language. Light or dark and Classic or Folio
      are in Display, which is described with what it holds.
    * Imago: its ribbon has nine tabs, from Home to View (the chapter said four in one place and nine in another).
    * Tabula: thirteen house scripts, not five; Your signature: the Forge's Signatures room draws seven hands stroke
      by stroke, and Tabula's panel writes thirteen house scripts with the device's lettering (the chapter mixed the
      two and said "thirteen hands" of the Forge).
    * The note on slower devices moves from Your signature to Resetting the app, where it belongs.
    * Fontes: "also lives inside Tabula too" loses a word.
  * **The Surfaces chapter** ("Editing the app from inside it") is kept in the list and put back whenever the
    Guidebook opens, and it has French now.
  * **The tour.** The guided tour is short by default: 71 of its 201 cards, one or two in each room, with every card of
    Focus kept. The page counts its own words and says how long it takes: about thirty-five minutes in English and
    forty in French, and the full tour about an hour and a half. The full tour, every card, starts from the
    Guidebook's "Take the full tour". The first card says which tour is running and how long each takes.
  * **A tour card stays on the screen.** A "Chapter complete" card could land below the screen, because it took over
    the move of the card before it without reckoning that move properly (1088's tour did it after the second part of
    Home). Its place is now reckoned from the move it really carries.
* `p_builders.py`: the install kits carry build 1089.
* `kits_step.py`: **the install kits are made even when Ubuntu's package server does not answer.** On 11 November the
  kits of 1087 and 1088 were not made: GitHub's Ubuntu machine could not reach the package server while installing
  the headless browser's system libraries, three times. The browser is now installed on its own, and the libraries
  are asked for separately; if the server does not answer, a warning says so and the kits are made with the
  libraries the machine already has.

## Why nothing is deleted from the lists

The Author Studio keeps the owner's own edits to the Guidebook and to the tour by a chapter's or a card's place in
those lists. Removing or reordering entries would move those edits onto other chapters and cards. So the lists keep
every entry where it was, and the sorting, the setting aside and the short tour are done where the Guidebook is drawn
and where the tour steps. The Author Studio's Guidebook and tour rooms still show every chapter and card.

## Tests

`tests/t_guidebook.js PAGE_URL [engine]`, 37 checks: the nine sections in order and the chapter each begins with; the
two notes set aside; forty chapters with the Focus chapter; the tour line; the search, a search that finds nothing,
and an emptied search; a contents key bringing its section to the top; every corrected chapter, in English and in
French; the Language page unchanged; in French, the sections, the Surfaces chapter present and in French, the same
forty chapters, and no English sentence left anywhere in the Guidebook; the short tour walked card by card, 71 cards,
no card of the full tour among them, every card with its keys on a 1280 by 900 screen; the full tour keeping every
card and saying so; the next tour short again; no fault on the page. It passes in Chromium, in Safari's engine
(WebKit) and in Firefox.

## What this does not claim

* Which cards the short tour keeps is a judgement, made for a first walk through the house; any card left to the full
  tour can be brought back. The full tour is unchanged.
* The tour's lengths are reckoned at two hundred words a minute and six seconds a card; a reader may be quicker or
  slower.
* The wording of the chapters not named above was not rewritten, and the Author Studio's own rooms still use some
  older wording.
