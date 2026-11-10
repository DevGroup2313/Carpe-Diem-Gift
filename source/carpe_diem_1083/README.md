# Carpe Diem 1083

Copyright (c) 2026 Yannie D. Forest. All rights reserved.

Build 1083 is made from build 1082 by `cd1083.py IN_1082.html OUT.html`, after `launcher_mac_edits.py` has changed the
Mac program (`Mac project/carpe_diem_app.py`; each change is found exactly once, or it stops). The parts:

* `launcher_mac_edits.py`: **on a Mac, a room's own window is confirmed on the screen, and the rooms' own apps can be
  found.** The owner: on the Mac mini (macOS 27) "no window opens" for a room; and the rooms' own apps "are somewhat
  hidden and I can't really find them to add them to my desktop or dock".
  * `open_app` answered True as soon as it had asked for the window, and the page then closed its floating window. It
    now waits until the Mac really shows the window (`_confirm_shown`: visible, on a screen, not in the Dock). One not
    shown after three seconds is brought out (`_bring_out`: out of the Dock, out of Carpe Diem's tabs, onto the main
    screen, to the front); after eight it is closed and the page is told (`{"ok": False, "why": "not shown"}`), so the
    room stays in its floating window. Each case is written in the record ("room window: ...").
  * The window's place (a tab beside Carpe Diem, or apart) is set whether or not its "shown" event has passed
    (`_when_shown`).
  * The safety rule counts only an ending within 25 seconds of a room's window opening (`_room_survives`), and a start
    counts as a bad one only if the app ends within a minute of its page loading (`_session_proved`).
  * `rooms_to_dock`, `rooms_to_desktop`, `rooms_reveal`, `rooms_state`, `app_record`, and from the command line
    `--rooms-to-dock`, `--rooms-to-desktop`.
* `p_macrooms.py` with `macrooms1083.js`, `macrooms1083.css`: the sheet **"The rooms as apps on this Mac"** (all five
  in the Dock, an alias of each on the Desktop, or shown in the Finder), offered from the menu of a room's floating
  window and once by a note on a Mac with none of the five out; and, when a room's window is not shown, a note that
  offers the app's own record to copy.
* `p_builders.py`: the install kits carry build 1083 and the Mac program as changed.

## Tests

* `tests/t_mac_1083.py <Mac program>`: 19 checks with stand-ins for the Mac's own parts (a window shown, in the Dock,
  hidden among the tabs, on no screen, never shown; the place set before, at and without the event; the safety mark;
  the aliases; the count; the record without the home folder's name). 1073's `t_mac_rooms.py` and `t_mac_apps.py` pass.
* `tests/t_macrooms.js PAGE_URL OUTDIR`: the sheet in English and in French, its keys and what each reports, Escape,
  the menu's entry, the note once, the note of a window that did not open, and nothing of it in a browser; Chromium,
  Safari's engine and Firefox. Each visit has a browser of its own: the Linux copy of Safari's engine sometimes
  crashes when this 48 MB page is loaded a second time in one browser (it does so on build 1081 too).
* On GitHub's Mac: the build's check asks for all five in the Dock (each once) and on the Desktop; the Mac check
  (`.github/mac-check/t_mac_windows.py`) opens four windows and reads the record's confirmations.
* 1081's `t_rooms_all.js`, 1082's `t_print_host.js`, the seal in three engines, and the kits pass.

## Not known

Whether this cures the Mac mini. GitHub offers macOS 26 at most, and there the windows opened before this build too.
If no window opens on macOS 27 with this build, the room now stays in its floating window and the note's "Copy the
app's record" gives the lines that say what the Mac did.
