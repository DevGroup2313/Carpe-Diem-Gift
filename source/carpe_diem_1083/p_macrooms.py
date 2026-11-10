"""1083 · on a Mac, the rooms' own apps have a place in the app, and a room's window that does not open says so.

The owner: "they are somewhat hidden and I can't really find them to add them to my desktop or dock", and, of the
Mac mini, "no window opens". The Mac program's part is launcher_mac_edits.py. The page's part (`macrooms1083.js`,
`macrooms1083.css`): a sheet, "The rooms as apps on this Mac", that puts all five in the Dock, puts an alias of each
on the Desktop, or shows them in the Finder; it is offered from the menu of a room's floating window, and once by a
note on a Mac that has none of them out. When the Mac program reports that a room's window was not shown, the page's
note offers the app's own record to copy, so the cause can be read."""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OLD = "    function no() { tell('The window could not be opened here; ' + name + ' stays in its floating window.', 'La fenêtre n’a pas pu s’ouvrir ici ; ' + name + ' reste dans sa fenêtre flottante.'); }\n"
NEW = ("    function no() { if (typeof window.cdRoomWindowFailed === 'function') { try { window.cdRoomWindowFailed(which, name); return; } catch (e) {} }\n"
       "      tell('The window could not be opened here; ' + name + ' stays in its floating window.', 'La fenêtre n’a pas pu s’ouvrir ici ; ' + name + ' reste dans sa fenêtre flottante.'); }\n")


def apply(p, full):
    p.rep(OLD, NEW)
    if p.has('id="cd-macrooms-1083"'):
        raise SystemExit("cd-macrooms-1083 is there already")
    css = open(os.path.join(HERE, "macrooms1083.css"), encoding="utf-8").read()
    js = open(os.path.join(HERE, "macrooms1083.js"), encoding="utf-8").read()
    p.before_body_end('<style id="cd-macrooms-1083-css">\n' + css + '</style>\n<script id="cd-macrooms-1083">\n' + js + '</script>')
