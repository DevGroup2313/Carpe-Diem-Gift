# Carpe Diem 1078

Copyright (c) 2026 Yannie D. Forest. All rights reserved.

Build 1078 is made from build 1077 by `cd1078.py IN_1077.html OUT.html`, once for each edition (the owner's full
edition, the committee demonstration and the public sample). Everything in it was shown to the owner first and
approved (31 October 2026). The parts, in order:

* `p_home78.py` with `home78.css` and `home78.js`: **Home.** The Home and Overview tabs in the Forge's look (Option A):
  the app's own tab bar, drawn by renderHomeSubtabs as always, set compact at the left of the Backup key's row, on Home
  only (in the public sample, where the Backup key is hidden, alone at the row's left). **Offline by design** as a cream
  card with its lock key, keeping its own words in each edition and language. The seal behind Home was tried in its own
  colours and stays all blue, as the owner asked.
* `p_cand78.py` with `how78.css`: **How Candidatus works, redesigned and at the top of the Overview.** The four rooms
  (Applications, Proposal, Milestones, Citations) as raised keys that open their tabs, Milestones marked Start here as
  the guide always advised, a line on the Overview itself; Fold away keeps it as one line, remembered. The old guide at
  the foot is gone; the Guidebook keeps its own text.
* `p_pages78.py` with `pages78.css`, `assess78.js` and `asc78.js`: **Assessments and Ascensus in the approved design,**
  the Forge's tabs on both. Assessments: How marks work folded at the top (Show opens its full text), the overall card
  with each term's bar, the standing card in each edition's own words, Quizzes, Seminars and Records as cards whose keys
  are sized to their words, the way to Ascensus; Records (a card for each term, the app's own modules inside) and Marks
  (each term and the proposal with bar, count, mark and band; the refreshers) as calm lists, without raised lines, as
  the owner asked. Ascensus: the app's own gold title, words, Glossary, Tabula and medal, the rank
  as a butter card, the fire as a switch, the labours as rows with their boxes, Tips and Swap (no glow), Doctorate mode
  as a sage card, the Examen, a card for each course with its ring and the search, the Record with its search. Every
  word the app already said is taken from its own drawing of the page, every action is its own, the tour's marks are
  kept; should anything fail, the app draws its own page. **The courses numbered I to XIII:** Dissertatio keeps Course
  V, The Press becomes Course VI and each course after it moves one on, with every mention of their numbers in the
  Examen's advice and the lessons, in English and in French; Dissertatio's French tag says Cours V; the owner's edition
  says thirteen courses where it said twelve (in French, where the first course is not offered, twelve).
* `p_builders.py`: the install kits carry build 1078, their record files as the release writes them.

The Curriculum is unchanged (its redesign was declined). Then, as in every pass: the boot map, the build record, the
integrity seal, the page's photograph of itself and the mini Forge's trust of this very build.

## Tests

* `tests/t_pages78.js URL OUT`: all of the above used as a person uses it, in English and in French, by day and by
  night, in each edition.
* `tests/t_home_low.js URL OUT`, `tests/t_chat_use.js URL OUT`: Home on a low-energy day and the two conversations, as
  in 1077.
* `tests/t_untouched.js OLD_URL NEW_URL`: every visible key outside the redesigned pages has the same computed look as
  in the build before, by day and by night.
* `tests/t_holds.js PAGE.html`, `tests/t_backup_host.py`: as before.
