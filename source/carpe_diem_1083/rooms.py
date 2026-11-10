"""A room's own page (Tabula, Abacus, Imago, Scriba, Fontes) is carried in the app's main script as base64
(var TABULA_SRC = "..."). patch_room(p, "TABULA_SRC", fn) hands fn the room's page and puts back what it returns."""
import base64, re


def patch_room(p, var, fn):
    ms = list(re.finditer(r'var %s = "([A-Za-z0-9+/=]+)"' % var, p.s))
    if len(ms) != 1:
        raise SystemExit("%s: %s found %d times" % (p.label, var, len(ms)))
    m = ms[0]
    room = base64.b64decode(m.group(1)).decode("utf-8")
    new = fn(room)
    p.s = p.s[:m.start(1)] + base64.b64encode(new.encode("utf-8")).decode("ascii") + p.s[m.end(1):]
    return len(room), len(new)
