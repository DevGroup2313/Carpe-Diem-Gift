import importlib.util, sys, os, time, threading, tempfile
spec = importlib.util.spec_from_file_location("cdmac", sys.argv[1])
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
tmp = tempfile.mkdtemp()
m.crash_log_path = lambda: os.path.join(tmp, "log.txt")
assert m._room_from("carpediem://room/tabula") == "tabula"
assert m._room_from("carpediem://room/Imago/") == "slides"
assert m._room_from("carpediem:room/fontes?x=1") == "fontes"
assert m._room_from("carpediem://other/tabula") is None
assert m._room_from("abacus") == "abacus" and m._room_from("nothing") is None
print(m._room_script("tabula", '/Applications/Carpe "Diem".app'))
print(m._room_script("abacus", ""))
assert m._same_app("file:///Users/x/Applications/Carpe%20Diem%20Rooms/Tabula.app/", "/Users/x/Applications/Carpe Diem Rooms/Tabula.app")
assert not m._same_app("file:///Applications/Safari.app/", "/Users/x/Applications/Carpe Diem Rooms/Tabula.app")
# the room server: rooms asked before the desk shows open "own" with the desk's address, then the desk steps aside
class Ev:
    def __init__(s): s._e = threading.Event(); s.hs = []
    def __iadd__(s, h): s.hs.append(h); return s
    def set(s): s._e.set(); [h() for h in s.hs]
    def is_set(s): return s._e.is_set()
class Events:
    def __init__(s): s.shown = Ev(); s.loaded = Ev()
class Win:
    def __init__(s): s.events = Events(); s.real_url = None; s.mini = 0; s.js = []
    def minimize(s): s.mini += 1
    def run_js(s, j): s.js.append(j)
class Api:
    def __init__(s): s.calls = []
    def open_app(s, which, base=None, mode="beside"): s.calls.append((which, base, mode)); return True
api, win = Api(), Win()
m.rooms_asked(["carpediem://room/tabula", "file:///x.docx"], "test")
m._serve_asked_rooms(api, win)
time.sleep(1.0); assert api.calls == [], api.calls          # waits for the desk's address
win.real_url = "http://127.0.0.1:42049/carpe_diem.html"; win.events.shown.set(); win.events.loaded.set()
time.sleep(3.5)
print(api.calls, "minimized", win.mini)
assert api.calls == [("tabula", "http://127.0.0.1:42049/carpe_diem.html", "own")] and win.mini == 1
m.rooms_asked(["carpediem://room/abacus"]); time.sleep(1.0)
assert api.calls[-1] == ("abacus", "http://127.0.0.1:42049/carpe_diem.html", "own") and win.mini == 1, (api.calls, win.mini)
# one window only: the room opens in Carpe Diem's window
class One: pass
w2 = Win(); w2.real_url = "http://127.0.0.1:42049/c.html"; w2.events.loaded.set()
m._ROOMS_ASKED["queue"].clear()
m._serve_asked_rooms(One(), w2); m.rooms_asked(["carpediem://room/scriba"]); time.sleep(1.5)
print(w2.js)
print(open(os.path.join(tmp, "log.txt")).read())
