"""1082 · Tabula prints in colour (see tabula_print.py), and its lists fill the page (see tabula_lists.py).

The page's part: a document a room sends to be printed (kind 'carpe-print', a whole HTML page) is printed by the
app's own window where a room's frame cannot print (the Mac app: its window.print opens the Mac's print panel), from
a surface only the printer sees, kept apart from the app's own styles. Anywhere else the room prints it by itself."""
import os
import rooms, tabula_lists, tabula_print

HERE = os.path.dirname(os.path.abspath(__file__))
OLD = "  var ok = cdPrintViaPython(d.name, d.mime, d.bytes);\n"
NEW = "  var ok = (d.mime === 'text/html' && typeof window.cdPrintPage === 'function') ? window.cdPrintPage(d.name, d.bytes) : cdPrintViaPython(d.name, d.mime, d.bytes);\n"


def apply(p, full):
    a, b = rooms.patch_room(p, "TABULA_SRC", lambda r: tabula_print.patch(tabula_lists.patch(r)))
    print("    Tabula: %d -> %d bytes (lists fill the page; Print in colour)" % (a, b))
    p.rep(OLD, NEW, where="core")
    js = open(os.path.join(HERE, "print1082.js"), encoding="utf-8").read()
    if p.has('id="cd-print-1082"'):
        raise SystemExit("cd-print-1082 is there already")
    p.before_body_end('<script id="cd-print-1082">\n' + js + '</script>')
