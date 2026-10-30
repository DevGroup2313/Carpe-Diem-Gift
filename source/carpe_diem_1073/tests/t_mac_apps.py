import importlib.util, sys, os, plistlib, subprocess, tempfile, types, time
spec = importlib.util.spec_from_file_location("cdmac", sys.argv[1])
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
tmp = tempfile.mkdtemp(); home = os.path.join(tmp, "home"); os.makedirs(home)
os.environ["HOME"] = home
m.crash_log_path = lambda: os.path.join(tmp, "log.txt")
m.sys.platform = "darwin"
m._OWN_BUNDLE["path"] = "/Applications/Carpe Diem.app"
m.resource_path = lambda f: os.path.join(os.path.dirname(sys.argv[1]), f)
dock = {"apps": []}; calls = []
real_run = subprocess.run
def fake_run(cmd, **kw):
    calls.append(cmd[0].split("/")[-1])
    name = cmd[0].split("/")[-1]
    out = types.SimpleNamespace(returncode=0, stdout=b"" if not kw.get("text") else "", stderr="" if kw.get("text") else b"")
    if name == "osacompile":
        made, src = cmd[2], cmd[3]
        os.makedirs(os.path.join(made, "Contents", "Resources", "Scripts")); os.makedirs(os.path.join(made, "Contents", "MacOS"))
        with open(os.path.join(made, "Contents", "Info.plist"), "wb") as fh:
            plistlib.dump({"CFBundleIdentifier": "com.apple.ScriptEditor.id.x", "CFBundleIconFile": "applet", "CFBundleIconName": "applet",
                           "CFBundleName": "x", "CFBundleExecutable": "applet",
                           "CFBundleDocumentTypes": [{"CFBundleTypeOSTypes": ["****"], "CFBundleTypeRole": "Viewer"}]}, fh)
        open(os.path.join(made, "Contents", "Resources", "applet.icns"), "wb").write(b"x")
        open(os.path.join(made, "Contents", "Resources", "Scripts", "main.scpt"), "w").write(open(src).read())
        open(os.path.join(made, "Contents", "MacOS", "applet"), "wb").write(b"\xcf\xfa\xed\xfe")
    elif name == "defaults" and cmd[1] == "export":
        out.stdout = plistlib.dumps({"persistent-apps": dock["apps"]})
    elif name == "defaults" and cmd[1] == "write":
        import re
        u = re.search(r"<string>(.*?)</string>", cmd[-1]).group(1)
        dock["apps"].append({"tile-data": {"file-data": {"_CFURLString": u.replace("&amp;", "&"), "_CFURLStringType": 15}}})
    return out
m.subprocess = subprocess; subprocess.run = fake_run
n = m.make_room_apps()
print("made", n, "calls", calls.count("osacompile"), "osacompile,", calls.count("codesign"), "codesign,", calls.count("lsregister"), "lsregister")
d = os.path.join(home, "Applications", "Carpe Diem Rooms")
print(sorted(os.listdir(d)))
for r in ("Tabula", "Imago"):
    pl = plistlib.load(open(os.path.join(d, r + ".app", "Contents", "Info.plist"), "rb"))
    print(r, {k: pl.get(k) for k in ("CFBundleIdentifier", "CFBundleName", "CFBundleIconFile", "CFBundleIconName", "LSUIElement", "CDRoomApp")},
          "doc types:", [t.get("LSItemContentTypes") for t in pl.get("CFBundleDocumentTypes", [])])
    print("   icon:", os.path.getsize(os.path.join(d, r + ".app", "Contents", "Resources", "room.icns")))
print(open(os.path.join(d, "Tabula.app", "Contents", "Resources", "Scripts", "main.scpt")).read()[:200])
# a second start makes nothing again; a moved Carpe Diem remakes them in place (the Dock's item keeps its folder)
calls.clear(); m.make_room_apps(); print("second start: osacompile", calls.count("osacompile"))
ino = os.stat(os.path.join(d, "Tabula.app")).st_ino
m._OWN_BUNDLE["path"] = "/Users/me/Downloads/Carpe Diem.app"
calls.clear(); m.make_room_apps(); print("moved: osacompile", calls.count("osacompile"), "same folder:", ino == os.stat(os.path.join(d, "Tabula.app")).st_ino)
print("script names the new place:", "/Users/me/Downloads/Carpe Diem.app" in open(os.path.join(d, "Tabula.app", "Contents", "Resources", "Scripts", "main.scpt")).read())
m._OWN_BUNDLE["path"] = "/private/var/folders/x/AppTranslocation/ABC/d/Carpe Diem.app"
calls.clear(); m.make_room_apps(); print("translocated: names no place:", "AppTranslocation" not in open(os.path.join(d, "Tabula.app", "Contents", "Resources", "Scripts", "main.scpt")).read())
# the Dock: once
print(m.room_to_dock("fontes")); print(m.room_to_dock("carpediem://room/fontes")); print(m.room_to_dock("nothing"))
print("dock items:", [a["tile-data"]["file-data"]["_CFURLString"] for a in dock["apps"]], "killall:", calls.count("killall"))
# files wait for Tabula's own window when it was asked
m._OPENED["queue"][:] = []
f = os.path.join(tmp, "a.docx"); open(f, "wb").write(b"PK..")
class Api:
    def __init__(s): s.alive = False
    def _alive(s, w): return s.alive
api = Api()
m.rooms_asked(["carpediem://room/tabula"]); m.files_asked([f])
print("desk while Tabula opens:", m._take_file_now(api, "desk"))
api.alive = True
print("desk once it is open:", m._take_file_now(api, "desk"))
t = m._take_file_now(api, "tabula"); print("Tabula's window:", t and t["name"])
m.files_wait_for_tabula(0); m.files_asked([f]); api.alive = False
print("desk when Tabula's window cannot open:", (m._take_file_now(api, "desk") or {}).get("name"))
print(open(os.path.join(tmp, "log.txt")).read()[-1500:])
