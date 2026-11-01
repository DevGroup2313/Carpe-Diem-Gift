"""t_relay.py ROOT: applies edits.json to copies of the two launchers under ROOT, then checks broadcast_theme with stand-in
windows: the window that made the change is skipped, and a busy Carpe Diem window (its page answering after 600 ms) no
longer holds back a room window (before: the room waited for it)."""
import importlib.util, json, os, sys, time, types
HERE = os.path.dirname(os.path.abspath(__file__))
root = sys.argv[1]
edits = json.load(open(os.path.join(HERE, "..", "edits.json"), encoding="utf-8"))
for e in edits:
    p = os.path.join(root, e["file"])
    s = open(p, encoding="utf-8").read()
    n = s.count(e["old"])
    if n != e["count"]:
        raise SystemExit("%s: expected %d, found %d" % (e["file"], e["count"], n))
    open(p, "w", encoding="utf-8").write(s.replace(e["old"], e["new"]))
bad = 0
for f in ("Windows project/carpe_diem_app.py", "Mac project/carpe_diem_app.py"):
    path = os.path.join(root, f)
    compile(open(path, encoding="utf-8").read(), path, "exec")
    spec = importlib.util.spec_from_file_location("cdapp_" + f.split()[0].lower(), path)
    m = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = m
    spec.loader.exec_module(m)
    log = []
    class Win:
        def __init__(self, name, delay): self.name, self.delay = name, delay
        def evaluate_js(self, js):
            t = time.time(); time.sleep(self.delay); log.append((self.name, round((time.time() - T0) * 1000), "true" in js))
    api = m.CarpeApi("file:///x/carpe_diem.html")
    desk, room1, room2 = Win("desk", 0.6), Win("tabula", 0.02), Win("abacus", 0.02)
    api.main_window = desk; api._wins = {"tabula": room1, "abacus": room2}
    # the desk makes the change
    log.clear(); T0 = time.time(); api.broadcast_theme(True); time.sleep(0.9)
    got = {n: ms for n, ms, d in log}
    ok1 = "desk" not in got and got.get("tabula", 9999) < 300 and got.get("abacus", 9999) < 300
    # a room makes the change: the desk and the other room hear it, the room itself does not; the room does not wait for the desk
    tw = m.TabulaWindowApi(host=api); tw.win = room1
    log.clear(); T0 = time.time(); tw.broadcast_theme(False); time.sleep(0.9)
    got2 = {n: ms for n, ms, d in log}
    ok2 = "tabula" not in got2 and "desk" in got2 and got2.get("abacus", 9999) < 300
    print(f, "| desk's change:", got, "ok" if ok1 else "BAD", "| Tabula's change:", got2, "ok" if ok2 else "BAD")
    bad += (not ok1) + (not ok2)
print("PASS" if not bad else "FAIL")
sys.exit(1 if bad else 0)
