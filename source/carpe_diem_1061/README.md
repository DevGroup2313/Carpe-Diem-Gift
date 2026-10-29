# Carpe Diem 1061: how this build was made

`cd1061.py` applies build 1061 to each edition's 1060 page (the owner's full edition, the public sample and the
committee demonstration):

* `p_split.py`: "Side by side with Carpe Diem", the second choice of a floating window's ↗ menu, for Tabula, Abacus,
  Imago, Scriba and Fontes: the room docks on the right, Carpe Diem's page narrows to the left (its scroller, its top
  keys and side keys move with it), and a line between them is dragged (or moved with the arrow keys) and remembered;
  the window's bar no longer drags it; "Float again" returns it where it was; closing, folding or filling it ends the
  split. The menu no longer offers the copy of a room as a page in the browser (which opened Safari); on a Mac the
  first choice says the room's window comes as a tab beside Carpe Diem.
* `p_notes.py`: the two small notes at the foot of the screen in the pastel card; the old Ctrl+Shift+R handler, which
  drew a black box and reloaded without saving, gives way to Refresh.
* `p_builders.py`: the kits say 1061 and carry the repository's files (the Mac shell's tab beside the desk).

In the Mac shell (`Mac project/carpe_diem_app.py`), `CarpeApi._tab_beside_desk` adds a room's own window to Carpe
Diem's window as a native tab (`addTabbedWindow:ordered:`), on the main thread once the window is shown.

Test: `node ../carpe_diem_1060/tests/split3.js` (the divider, the bar held still, Float again, closing).
