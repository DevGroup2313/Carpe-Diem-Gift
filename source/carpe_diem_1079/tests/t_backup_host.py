"""t_backup_host.py PROGRAM.py: the backups in a Mac or Windows program (since build 1074), run for real in a home of its own.

The places (Documents, and the cloud folders a Mac and a Windows computer have, by their labels, never an address);
a backup written in pieces, one piece sent twice, one out of turn, one broken and sent again; the name taken only at
the end; a second backup of the same name kept beside the first; ten daily backups kept of twelve; a stopped backup
leaving nothing; a name that is not a backup's refused."""
import base64, importlib.util, os, sys, tempfile, types

spec = importlib.util.spec_from_file_location("cdprog", sys.argv[1])
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
home = tempfile.mkdtemp()
# the computer's own variables, given back before the last part, which looks at this very computer as it is (1075)
SAVED = {k: os.environ.get(k) for k in ("HOME", "USERPROFILE", "OneDriveCommercial", "LOCALAPPDATA")}
os.environ["HOME"] = home
os.environ["USERPROFILE"] = home
m.crash_log_path = lambda: os.path.join(home, "log.txt")
real_sys = m.sys
real_docs = m._bk_documents
m._bk_documents = lambda: os.path.join(home, "Documents")

# --- the places a Mac finds: iCloud Drive, OneDrive (own and an organisation's), Google Drive (its folder carries the
# account's address: never shown), Dropbox
for d in ["Library/Mobile Documents/com~apple~CloudDocs", "Library/CloudStorage/OneDrive-Personal",
          "Library/CloudStorage/OneDrive-Acme University", "Library/CloudStorage/GoogleDrive-someone@example.com/My Drive",
          "Library/CloudStorage/Dropbox"]:
    os.makedirs(os.path.join(home, d))
m.sys = types.SimpleNamespace(platform="darwin")
pl = m.backup_places()
m.sys = real_sys
labels = [p["label"] for p in pl]
print("mac places:", labels)
assert labels[0] == "Documents › Carpe Diem › Backups"
assert "iCloud Drive › Carpe Diem Backups" in labels and "Google Drive › Carpe Diem Backups" in labels
assert "OneDrive › Carpe Diem Backups" in labels and "OneDrive (Acme University) › Carpe Diem Backups" in labels
assert "Dropbox › Carpe Diem Backups" in labels
assert not any("@" in str(p) or "/" in p["label"] for p in pl), "a place shows an address or a path"
assert all(set(p) == {"id", "label", "cloud"} for p in pl), "the page is given more than an id, a label and a kind"
assert [p["cloud"] for p in pl] == [False] + [True] * (len(pl) - 1)

# --- the places a Windows computer finds: OneDrive from its variables, iCloud Drive, Dropbox from its own record
os.makedirs(os.path.join(home, "OneDrive - Acme University"))
os.makedirs(os.path.join(home, "iCloudDrive"))
os.makedirs(os.path.join(home, "DropboxElsewhere"))
os.makedirs(os.path.join(home, "AppDataLocal", "Dropbox"))
with open(os.path.join(home, "AppDataLocal", "Dropbox", "info.json"), "w") as fh:
    fh.write('{"personal": {"path": "%s"}}' % os.path.join(home, "DropboxElsewhere").replace("\\", "\\\\"))
os.environ["OneDriveCommercial"] = os.path.join(home, "OneDrive - Acme University")
os.environ["LOCALAPPDATA"] = os.path.join(home, "AppDataLocal")
m.sys = types.SimpleNamespace(platform="win32")
try:
    wl = [p["label"] for p in m.backup_places()]
finally:
    m.sys = real_sys
print("windows places:", wl)
assert "OneDrive (Acme University) › Carpe Diem Backups" in wl and "iCloud Drive › Carpe Diem Backups" in wl
assert "Dropbox › Carpe Diem Backups" in wl

# --- a backup in pieces, to Documents
data = os.urandom(786432 * 2 + 1234)
pieces = [data[i:i + 786432] for i in range(0, len(data), 786432)]
b64 = [base64.b64encode(p).decode() for p in pieces]
name = "carpe-diem-backup-2026-10-30-1830.json.gz"
r = m.backup_begin(None, "documents", name)
assert "key" in r, r
k = r["key"]
assert m.backup_part(k, 1, b64[1]) is False                  # out of its turn
assert m.backup_part(k, 0, b64[0]) is True
assert m.backup_part(k, 0, b64[0]) is True                   # sent again: its answer was lost; taken as done
assert m.backup_part(k, 1, "%%%not base64%%%") is False      # broken on the way
assert m.backup_part(k, 1, b64[1]) is True                   # sent again whole: written from where piece 0 ended
folder = os.path.join(home, "Documents", "Carpe Diem", "Backups")
assert not os.path.exists(os.path.join(folder, name)), "named before its last piece"
assert os.path.exists(os.path.join(folder, "." + name + ".partial"))
assert m.backup_part(k, 2, b64[2]) is True
e = m.backup_end(k, 0, "")
assert e["ok"] and e["name"] == name and e["size"] == len(data), e
assert open(os.path.join(folder, name), "rb").read() == data, "the backup is not the bytes sent"
assert not os.path.exists(os.path.join(folder, "." + name + ".partial"))
assert m.backup_end(k, 0, "")["ok"] is False                 # ended once only
# the same name again: kept beside it
r2 = m.backup_begin(None, "documents", name); m.backup_part(r2["key"], 0, b64[0]); e2 = m.backup_end(r2["key"])
assert e2["ok"] and e2["name"] == "carpe-diem-backup-2026-10-30-1830-2.json.gz", e2
# to a cloud folder
cl = [p for p in pl if p["label"].startswith("iCloud")][0]
m.sys = types.SimpleNamespace(platform="darwin")
try:
    r3 = m.backup_begin(None, cl["id"], "carpe-diem-backup-2026-10-30-1831.cdbackup")
finally:
    m.sys = real_sys
m.backup_part(r3["key"], 0, b64[2]); e3 = m.backup_end(r3["key"])
assert e3["ok"] and os.path.exists(os.path.join(home, "Library/Mobile Documents/com~apple~CloudDocs/Carpe Diem Backups", e3["name"]))
# a place no longer there
assert "error" in m.backup_begin(None, "cloud:Nowhere", "carpe-diem-backup-x.json")
# twelve daily backups, ten kept
for n in range(12):
    rr = m.backup_begin(None, "documents", "carpe-diem-auto-2026-10-%02d-0900.json.gz" % (n + 1))
    m.backup_part(rr["key"], 0, b64[2])
    assert m.backup_end(rr["key"], 10, "carpe-diem-auto-")["ok"]
autos = sorted(n for n in os.listdir(folder) if n.startswith("carpe-diem-auto-"))
assert len(autos) == 10 and autos[0] == "carpe-diem-auto-2026-10-03-0900.json.gz", autos
assert os.path.exists(os.path.join(folder, name)), "a backup that is not a daily one was taken away"
# a backup that stops leaves nothing
ra = m.backup_begin(None, "documents", "carpe-diem-backup-2026-10-30-1840.json")
m.backup_part(ra["key"], 0, b64[0])
assert m.backup_abort(ra["key"]) is True
assert not any(n.endswith(".partial") for n in os.listdir(folder)), os.listdir(folder)
# names that are not a backup's
for bad in ("../x.json", "carpe-diem-backup.exe", "notes.json", "carpe-diem-/../../x.json"):
    assert "error" in m.backup_begin(None, "documents", bad), bad
# showing one: the Finder or File Explorer is asked, with the file selected
seen = []
import subprocess
orig = subprocess.Popen
subprocess.Popen = lambda args, *a, **k: seen.append(args)
try:
    m.sys = types.SimpleNamespace(platform="darwin")
    assert m.backup_reveal(e["token"]) is True
    m.sys = types.SimpleNamespace(platform="win32")
    assert m.backup_reveal(e["token"]) is True
    assert m.backup_reveal("no-such-token") is False
finally:
    subprocess.Popen = orig
    m.sys = real_sys
print("shown with:", seen)
assert seen[0][:2] == ["open", "-R"] and seen[1][:2] == ["explorer", "/select,"]
print("log:", open(os.path.join(home, "log.txt")).read().strip().splitlines()[-3:])

# --- this very computer, as it is (no stand-ins): its places, and a backup kept in its own Documents and taken away
for k, v in SAVED.items():
    if v is None:
        os.environ.pop(k, None)
    else:
        os.environ[k] = v
m._bk_documents = real_docs
print("this computer's places:", [x["label"] for x in m.backup_places()])
rr = m.backup_begin(None, "documents", "carpe-diem-backup-check-%d.json" % os.getpid())
if "key" not in rr:
    if real_sys.platform == "darwin":
        print("::notice::Documents could not be written here (%s); a person's Mac asks once, the first time" % rr)
    else:
        raise SystemExit("this computer's Documents could not be written: %r" % (rr,))
else:
    assert m.backup_part(rr["key"], 0, base64.b64encode(b'{"format":"carpe-diem-backup"}').decode()) is True
    ee = m.backup_end(rr["key"])
    kept = os.path.join(real_docs(), "Carpe Diem", "Backups", ee["name"])
    assert ee["ok"] and os.path.exists(kept), (ee, kept)
    print("kept in this computer's Documents:", kept)
    os.remove(kept)
print("backups in the program: all good")
