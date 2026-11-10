"""t_mac_1083.py <Mac program>: build 1083's changes to the Mac program, with stand-ins for the Mac's own parts (run
anywhere). A room's window is confirmed on the screen, brought out when it is not, and refused when it still is not;
its place is set whether or not the "shown" event has passed; the safety mark goes once the window has lasted; the
rooms' own apps go to the Desktop and are counted; the record is given without the home folder's name."""
import importlib.util, os, sys, tempfile, threading, time, types

spec = importlib.util.spec_from_file_location("cdmac", sys.argv[1])
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
tmp = tempfile.mkdtemp(); home = os.path.join(tmp, "home"); os.makedirs(os.path.join(home, "Desktop"))
os.environ["HOME"] = home
log = os.path.join(tmp, "log.txt")
m.crash_log_path = lambda: log
m._on_main_thread = lambda fn, wait_s=20.0: fn()
ok = []


def check(name, cond):
    ok.append(bool(cond)); print(("ok   " if cond else "BAD  ") + name)


class Ev:
    def __init__(s): s._e = threading.Event(); s.hs = []
    def __iadd__(s, h): s.hs.append(h); return s
    def set(s): s._e.set(); [h() for h in list(s.hs)]
    def is_set(s): return s._e.is_set()


class Native:
    def __init__(s, visible=True, mini=False, screen=True, tabs=1):
        s.v, s.mi, s.sc, s.t, s.calls = visible, mini, screen, tabs, []
    def frame(s): return types.SimpleNamespace(origin=types.SimpleNamespace(x=10, y=20), size=types.SimpleNamespace(width=900, height=700))
    def isVisible(s): return s.v
    def isMiniaturized(s): return s.mi
    def screen(s): return object() if s.sc else None
    def tabGroup(s): return types.SimpleNamespace(windows=lambda: [0] * s.t)
    def deminiaturize_(s, _): s.calls.append("out of the Dock"); s.mi = False
    def moveTabToNewWindow_(s, _): s.calls.append("out of the tabs"); s.t = 1
    def makeKeyAndOrderFront_(s, _): s.calls.append("front"); s.v = s.heal
    def orderFrontRegardless(s): pass
    def setFrame_display_(s, fr, d): s.calls.append("on the screen"); s.sc = True
    heal = True


class Win:
    def __init__(s, native=None): s.events = types.SimpleNamespace(shown=Ev()); s.native = native; s.title = "Tabula"; s.gone = 0
    def destroy(s): s.gone += 1


# stand-ins for AppKit, so _bring_out can run
ak = types.ModuleType("AppKit")
ak.NSScreen = types.SimpleNamespace(mainScreen=lambda: types.SimpleNamespace(visibleFrame=lambda: types.SimpleNamespace(origin=types.SimpleNamespace(x=0, y=0), size=types.SimpleNamespace(width=1440, height=900))))
ak.NSApp = types.SimpleNamespace(activateIgnoringOtherApps_=lambda b: None)
sys.modules["AppKit"] = ak

api = m.CarpeApi("file:///x/carpe_diem.html")

# 1. shown at once
t0 = time.time(); r = api._confirm_shown(Win(Native()), "tabula", "own")
check("a window the Mac shows is confirmed at once", r is True and time.time() - t0 < 1.0)
# 2. in the Dock: brought out, then confirmed
n = Native(visible=False, mini=True); r = api._confirm_shown(Win(n), "abacus", "own")
check("a window in the Dock is brought out and confirmed", r is True and "out of the Dock" in n.calls and "front" in n.calls)
# 3. hidden among Carpe Diem's tabs
n = Native(visible=False, tabs=2); r = api._confirm_shown(Win(n), "scriba", "beside")
check("a window hidden among the tabs is taken out and confirmed", r is True and "out of the tabs" in n.calls)
# 4. on no screen
n = Native(visible=True, screen=False); r = api._confirm_shown(Win(n), "fontes", "own")
check("a window on no screen is set on the main screen", r is True and "on the screen" in n.calls)
# 5. never shown: the answer is no, within nine seconds
n = Native(visible=False); n.heal = False; t0 = time.time(); r = api._confirm_shown(Win(n), "slides", "own"); dt = time.time() - t0
check("a window the Mac never shows is refused (%.1f s)" % dt, r is False and 7.0 < dt < 10.0)
# 6. no native window at all
t0 = time.time(); r = api._confirm_shown(Win(None), "tabula", "own")
check("a window that was never made is refused", r is False)
rec = open(log, encoding="utf-8").read()
check("each case is written in the record", rec.count("room window:") >= 8 and "is NOT shown" in rec and "is shown" in rec)

# the window's place: before the event, after the event, and when the event never comes
hits = []
w = Win(); m._when_shown(w, lambda: hits.append("a")); w.events.shown.set()
w2 = Win(); w2.events.shown.set(); m._when_shown(w2, lambda: hits.append("b"))
w3 = Win(); m._when_shown(w3, lambda: hits.append("c"))
check("the place is set at the shown event, and at once when it has passed", hits == ["a", "b"])
time.sleep(2.4)
check("the place is set after two seconds when the event never comes, once each", sorted(hits) == ["a", "b", "c"])

# the safety mark goes once the window has lasted
m._session_flag = lambda: __import__("pathlib").Path(tmp) / "carpe_session.flag"
m._room_mark(); p = m._room_flag_path()
check("a room's window leaves its mark", os.path.isfile(p))
m._room_survives(Win(), after_s=0.3); time.sleep(0.7)
check("the mark goes once the window has lasted", not os.path.isfile(p))
m._room_mark(); m._ROOM["off"] = False; m.room_check_start(0)
check("a mark found at start means no window of its own this run", m._ROOM["off"] is True and not os.path.isfile(p))
m._ROOM["off"] = False; m.room_check_start(1)
check("no mark, no rule, however the last run ended", m._ROOM["off"] is False)
f = m._session_flag(); f.write_text("1"); w = types.SimpleNamespace(events=types.SimpleNamespace(loaded=threading.Event())); w.events.loaded.set()
m._session_proved(w, after_s=0.3); time.sleep(0.8)
check("a start whose page has been up is not counted as a bad one", not f.exists())

# the rooms' own apps: on the Desktop, counted
m.sys.platform = "darwin"
apps = {}
def fake_make(which, force=False):
    d = m.room_app_path(which); os.makedirs(d, exist_ok=True); apps[which] = d; return d
m._make_room_app = fake_make
m._dock_items = lambda: [{"tile-data": {"file-data": {"_CFURLString": "file://" + m.room_app_path("fontes").replace(" ", "%20") + "/"}}}]
r = m.rooms_to_desktop()
check("five aliases on the Desktop (%r)" % (r,), r["ok"] and len(r["made"]) == 5 and all(os.path.lexists(os.path.join(home, "Desktop", n)) for n in m.ROOM_NAMES.values()))
r2 = m.rooms_to_desktop()
check("asked again, those there are left", r2["ok"] and len(r2["there"]) == 5 and not r2["made"])
st = m.rooms_state()
check("the count: five apps, Fontes in the Dock, five on the Desktop", st["mac"] and len(st["apps"]) == 5 and st["dock"] == ["Fontes"] and len(st["desktop"]) == 5 and home not in str(st))
open(log, "a", encoding="utf-8").write("\n=== x  room app: made (%s/Applications/Carpe Diem Rooms/Tabula.app) ===\n" % home)
a = m.app_record()
check("the record is given without the home folder's name", "~/Applications/Carpe Diem Rooms" in a and home not in a)
check("the page may ask for each", all(callable(getattr(api, k, None)) for k in ("rooms_to_dock", "rooms_to_desktop", "rooms_reveal", "rooms_state", "app_record")) and "rooms_state" in dir(m.CarpeApiSingle("x")))
print("PASS" if all(ok) else "FAIL"); sys.exit(0 if all(ok) else 1)
