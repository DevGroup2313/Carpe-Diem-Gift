# Carpe Diem 1060: how this build was made

Build 1060 (29 October 2026, stamp 528171060) is build 1059 with the changes below, applied by `cd1060.py` to each
edition's 1059 page: the owner's full edition (this repository, and the iPhone and iPad repository), the public sample
(Carpe-DIem-Demo) and the committee demonstration (Carpe-Diem-Offline). Each change is found exactly once or the pass
stops. No app loads anything from here: each app carries everything inside its own page.

| Part | What it does |
| --- | --- |
| `p_proposal.py` | No preset proposal date in any edition; the fixed "16 September 2026" lines read the date that is set; "Rename the proposal" opens the proposal's own details (title, optional date with Clear, section names); the curriculum's names have their own panel; the first-draft milestone and the target are one. |
| `p_runtime.py` | The owner's desk has its proposal date (and milestones still on earlier builds' preset dates) cleared once; the demonstrations' sample dates are counted from each visit. |
| `p_sidekeys.py` | A floating window's side keys lose the stacked drop shadows (as the main window's did in 1048) and keep their lift and animations; the window's 💭 shows the thoughts' number; that number is one flat colour. |
| `p_reminders.py` | Timed reminders, the two-minute clock, a thought's reminder and Custodia's pause in a pastel light-blue card; `el()` takes `className` as well as `class` (seven calls wrote an attribute no style read). |
| `p_emoji.py` | On Windows 10 only, the side keys show Microsoft's flat Fluent emoji drawings (MIT), as on Windows 11. |
| `p_refresh.py` | The loading page says the page is still being painted and how far it has got (English or French), and after a long wait offers Refresh; Refresh (↻ beside Display, the Display menu, F5, Ctrl/Cmd+Shift+R) gathers every open room's work, saves, and starts again. |
| `p_about.py` | The About panel, about half as long, in English and French. |
| `p_builders.py` | The install kits the full edition carries: build 1060, every file that is also in this repository taken from it, every workflow on Node.js 24 actions. |
| `repo_gift.py`, `repo_web_ios.py` | Write the build record, READMEs and notices into the repositories. |

`lib.py` recomputes the integrity seal of pass 1059 (`window.CD_SEAL.core`, the SHA-256 of the core script with runs of
white space made one), and `selfsrc.py` takes the page's photograph of itself again, so a copy, a room window and Edit
this app carry 1060.

The tests in `tests/` drive the built page in Chromium with Playwright (`node tests/run.js URL tests/s1.json`): the
proposal panel and the date reset, the floating window's keys, the cards, the loading page under a slowed processor,
the whole demonstration tour (no overdue proposal, no personal text), the install kits made inside the page, and a walk
through every section of every edition with no page error.
