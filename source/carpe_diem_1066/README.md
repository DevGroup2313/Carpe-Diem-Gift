# Carpe Diem 1066: how this build was made

The owner saw two redesigns of the Proposal, Curriculum, Research Writing and French Tutor rooms and chose neither, and
no seal in the rooms' headers: the rooms keep their look. `p_rooms.py` mends two faults found in them: the line under a
room's header (`cd-ws-count`, from `cd-ws-rail`) counted every card, so the French Tutor's answers made "Five rooms in
this workspace", and it was English in French; it now counts rooms (a card with a name and a line beneath, never a
quiz's answers), in either language, and is not shown under two. Research Writing's closing note, which said lessons it
already holds "are being added", is removed from the core.

The programs: on a Mac, a new start asks an open copy to quit with a distributed notification of the Mac's own
(`_ask_to_quit` / `_hear_quit_please`), which needs no permission; Apple's quit event, which macOS may hold for the
owner's permission (it did on GitHub's Mac), is sent only to a copy from before 1065 that has not heard. On Windows, a
newer copy finds the open copy's windows by their program (`_open_copy_windows`: windows of another Carpe Diem.exe), not
by the title "Carpe Diem", which no longer matched once a room window was open, and closes them, rooms first.
