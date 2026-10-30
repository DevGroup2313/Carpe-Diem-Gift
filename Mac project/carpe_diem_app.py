#!/usr/bin/env python3
# CARPE DIEM  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
# NO LICENCE IS GRANTED. No copying, adaptation, redistribution, reverse
# engineering or commercial use without the author's written permission.
# See LICENCE.txt. Every distributed copy carries a build marker.
"""
Carpe Diem — desktop launcher.

This is a thin native-window shell around the Carpe Diem study app. All of the
app's behaviour lives in the bundled HTML/JavaScript file (carpe_diem.html);
this script only opens it in a proper desktop window using the system's native
web view. The app still runs entirely offline: nothing is sent anywhere.

Run it with:   python carpe_diem_app.py
"""

import os
import sys

# The window title and starting size. The app itself is responsive, so these are
# just sensible defaults; the window can be resized and maximised freely.
WINDOW_TITLE = "Carpe Diem"
DEFAULT_WIDTH = 1180
DEFAULT_HEIGHT = 820
MIN_WIDTH = 380      # the app works down to a narrow width
MIN_HEIGHT = 560
ACCENT_BLUE = "#1B6B93"   # the Carpe Diem sigil blue


def tell_user(text, title="Carpe Diem"):
    """Say something the person will actually see.

    The packaged exe is built windowed, with no console attached, so anything
    written to stderr disappears. Every message below therefore goes to a native
    dialog on Windows, and to the terminal when one exists (running the script
    directly, or on macOS and Linux).
    """
    try:
        sys.stderr.write(text if text.endswith("\n") else text + "\n")
    except Exception:
        pass
    if sys.platform.startswith("win"):
        try:
            import ctypes
            ctypes.windll.user32.MessageBoxW(0, str(text), str(title), 0x40)
            return
        except Exception:
            pass
    if sys.platform == "darwin":
        # An app opened from the Dock or Finder has no terminal either, so the
        # message goes to a real dialog. osascript is present on every Mac.
        try:
            import subprocess
            body = str(text).replace("\\", "\\\\").replace('"', '\\"')
            head = str(title).replace('"', '\\"')
            subprocess.run(
                ["osascript", "-e",
                 'display dialog "%s" with title "%s" buttons {"OK"} default button "OK"'
                 % (body, head)],
                check=False, timeout=120)
            return
        except Exception:
            pass


def open_in_browser(app_html):
    """Last resort: the page itself is the whole application.

    If a native window cannot be created, opening the same file in the default
    browser still gives the entire app, offline. It is better than an exe that
    appears to do nothing.
    """
    try:
        import webbrowser
        from pathlib import Path
        webbrowser.open(Path(app_html).as_uri())
        return True
    except Exception:
        return False


def resource_path(filename):
    """Return an absolute path to a file that sits next to this script.

    This also works when the app has been frozen into a single executable with
    PyInstaller, where bundled files live in a temporary folder exposed as
    sys._MEIPASS.
    """
    if hasattr(sys, "_MEIPASS"):
        base = sys._MEIPASS
    else:
        base = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base, filename)


def find_app_html():
    """Locate the bundled app HTML, with several sensible fallbacks.

    A frozen single-file build carries the page inside itself and finds it
    through resource_path first, so it needs no folder at all. The extra
    candidates cover running from source, and a build started from a different
    working folder.
    """
    here_script = os.path.dirname(os.path.abspath(__file__))
    try:
        here_exe = os.path.dirname(os.path.abspath(sys.executable))
    except Exception:
        here_exe = here_script
    candidates = [
        resource_path("carpe_diem.html"),
        resource_path("carpe_diem_offline.html"),
        # PyInstaller 6 places bundled data files in Contents/Resources on macOS,
        # while sys._MEIPASS points at Contents/Frameworks and the executable sits
        # in Contents/MacOS. Check every home the file could plausibly have.
        os.path.normpath(resource_path(os.path.join("..", "Resources", "carpe_diem.html"))),
        os.path.join(here_exe, "carpe_diem.html"),
        os.path.normpath(os.path.join(here_exe, "..", "Resources", "carpe_diem.html")),
        os.path.join(here_script, "carpe_diem.html"),
        os.path.normpath(os.path.join(here_script, "..", "Resources", "carpe_diem.html")),
        os.path.join(os.getcwd(), "carpe_diem.html"),
    ]
    seen = set()
    for path in candidates:
        if path and path not in seen:
            seen.add(path)
            if os.path.isfile(path):
                return path
    return None


def friendly_missing_dependency_message():
    """A clear, non-technical message shown if pywebview is not installed."""
    return (
        "\n"
        "Carpe Diem needs one small free component to open its window.\n"
        "\n"
        "Please install it once by running this in a terminal or command prompt:\n"
        "\n"
        "    pip install pywebview\n"
        "\n"
        "On Windows you may instead need:   py -m pip install pywebview\n"
        "On some Linux systems you may also need a web view backend, e.g.:\n"
        "    sudo apt install python3-webview   (or)   pip install pywebview[qt]\n"
        "\n"
        "Then run this program again.\n"
    )


def storage_dir():
    """A persistent place for the web view's own storage.

    pywebview runs in PRIVATE MODE by default, which discards localStorage when
    the window closes. Everything written in the desktop app was therefore lost
    on exit, not only a sticky note: curriculum progress, documents, reminders,
    all of it. A onefile build also unpacks into a temporary directory that is
    deleted afterwards, so the storage must live in the user's own profile and
    not beside the executable.
    """
    import os
    home = os.path.expanduser("~")
    if sys.platform.startswith("win"):
        base = os.environ.get("LOCALAPPDATA") or os.path.join(home, "AppData", "Local")
    elif sys.platform == "darwin":
        base = os.path.join(home, "Library", "Application Support")
    else:
        base = os.environ.get("XDG_DATA_HOME") or os.path.join(home, ".local", "share")
    path = os.path.join(base, "CarpeDiem", "storage")
    try:
        os.makedirs(path, exist_ok=True)
        return path
    except Exception:
        log_problem("storage_dir: could not create %r" % path)
        return None


def crash_log_path():
    """Beside the program if that is writable, otherwise the home folder."""
    import os
    try:
        base = os.path.dirname(os.path.abspath(sys.executable if getattr(sys, "frozen", False) else __file__))
        probe = os.path.join(base, ".carpe_write_test")
        with open(probe, "w") as fh:
            fh.write("")
        os.remove(probe)
        return os.path.join(base, "carpe_diem_crash.log")
    except Exception:
        return os.path.join(os.path.expanduser("~"), "carpe_diem_crash.log")


def log_problem(tag, exc_info=None):
    """Record a fault so a crash leaves evidence instead of vanishing."""
    import datetime, traceback
    try:
        with open(crash_log_path(), "a", encoding="utf-8") as fh:
            fh.write("\n=== %s  %s ===\n" % (datetime.datetime.now().isoformat(timespec="seconds"), tag))
            if exc_info:
                traceback.print_exception(exc_info[0], exc_info[1], exc_info[2], file=fh)
            else:
                traceback.print_exc(file=fh)
    except Exception:
        pass


def print_document(win, name, mime, data_b64):
    """Hand a document to the operating system so it can be printed.

    WKWebView, which is what this wrapper draws through on macOS, does not implement
    window.print(). A print request made inside the web view therefore reaches nothing,
    which is the fault this answers. Rather than write a Cocoa print path, the bytes are
    written to a temporary file and opened with the system's own application: a PDF opens
    in Preview and an HTML page in the default browser, and in both the print dialog is
    the machine's own.

    Returns the path opened, or False so the page can fall back to saving the file.
    """
    import base64, os, subprocess, sys, tempfile
    try:
        raw = base64.b64decode(data_b64 or "")
    except Exception:
        log_problem("print_document: undecodable payload")
        return False
    if not raw:
        return False
    safe = "".join(c for c in str(name or "document") if c.isalnum() or c in " ._-").strip()
    if not safe:
        safe = "document"
    try:
        folder = os.path.join(tempfile.gettempdir(), "CarpeDiemPrint")
        os.makedirs(folder, exist_ok=True)
        path = os.path.join(folder, safe)
        with open(path, "wb") as fh:
            fh.write(raw)
    except Exception as exc:
        log_problem("print_document: could not write %s (%s)" % (safe, exc))
        return False
    try:
        if sys.platform == "darwin":
            subprocess.Popen(["/usr/bin/open", path])
        elif sys.platform.startswith("win"):
            os.startfile(path)          # noqa: S606
        else:
            subprocess.Popen(["xdg-open", path])
        log_problem("print_document: opened %s for printing" % safe)
        return path
    except Exception as exc:
        log_problem("print_document: could not open %s (%s)" % (safe, exc))
        return False

def save_bytes(win, name, mime, data_b64):
    """Write an exported file from Python.

    A synthetic <a download> click inside a native web view is handed to the
    platform's download machinery. That is the path the Windows crash was
    reported on, and writing the bytes here avoids it entirely. Returns the path
    written, or False so the page can fall back to the anchor.
    """
    import base64, os
    try:
        raw = base64.b64decode(data_b64 or "")
    except Exception:
        log_problem("save_bytes: undecodable payload")
        return False
    keep = " ._-()[]"
    safe = "".join(c for c in str(name or "download") if c.isalnum() or c in keep).strip() or "download"
    target = None
    shown = False
    try:
        import webview
        # THE EXPORT CRASH (mac/windows): "Export to file" hands the webview a blob
        # download; without download support pywebview can bring the window down.
        # Recent pywebview honours this switch; older ones ignore the unknown key.
        try:
            webview.settings['ALLOW_DOWNLOADS'] = True
        except Exception:
            pass
        w = win
        if w is None:
            ws = [x for x in (getattr(webview, "windows", None) or []) if x is not None]
            w = ws[0] if ws else None
        if w is not None:
            shown = True
            res = w.create_file_dialog(webview.SAVE_DIALOG, save_filename=safe)
            if res:
                target = res if isinstance(res, str) else res[0]
    except Exception:
        # a missing dialog is not a cancellation: fall through to the folder
        log_problem("save_bytes: file dialog unavailable")
        shown = False
        target = None
    if shown and not target:
        # the person chose Cancel, so nothing is written and nothing falls back
        return "cancelled"
    if not target:
        try:
            d = os.path.join(os.path.expanduser("~"), "Downloads")
            if not os.path.isdir(d):
                d = os.path.expanduser("~")
            target = os.path.join(d, safe)
        except Exception:
            log_problem("save_bytes: no writable folder")
            return False
    try:
        with open(target, "wb") as fh:
            fh.write(raw)
        return target
    except Exception:
        log_problem("save_bytes: write failed")
        return False


def exports_dir():
    """Where a room's own page is kept: Documents/Carpe Diem/Exports.

    macOS may ask once before an app writes into Documents. If that is refused, or the
    folder cannot be made, the page goes beside the app's own storage instead, which
    needs no permission, so the export still opens.
    """
    import os
    home = os.path.expanduser("~")
    tries = [os.path.join(home, "Documents", "Carpe Diem", "Exports")]
    base = storage_dir()
    if base:
        tries.append(os.path.join(os.path.dirname(base), "Exports"))
    tries.append(os.path.join(home, "Carpe Diem Exports"))
    for folder in tries:
        try:
            os.makedirs(folder, exist_ok=True)
            probe = os.path.join(folder, ".carpe_write_test")
            with open(probe, "w") as fh:
                fh.write("")
            os.remove(probe)
            return folder
        except Exception:
            log_problem("exports_dir: %r is not writable" % folder)
    return None


def open_export(win, name, data_b64):
    """Write a room's own page and open it in the default browser.

    "Export this window" makes a whole page that holds one room (Tabula, Abacus, Imago,
    Scriba or Fontes) with the person's work in it. Inside the app's web view a new
    window cannot be opened for it, so the page is written to a file and opened by the
    system, which chooses the default browser. A page of the same name is never written
    over: a number is added instead.

    Returns the path opened, or False so the page can say it did not work.
    """
    import base64, os, subprocess, sys
    try:
        raw = base64.b64decode(data_b64 or "")
    except Exception:
        log_problem("open_export: undecodable payload")
        return False
    if not raw:
        return False
    keep = " ._-()[]"
    safe = "".join(c for c in str(name or "Carpe Diem page") if c.isalnum() or c in keep).strip(" .") or "Carpe Diem page"
    if not safe.lower().endswith((".html", ".htm")):
        safe += ".html"
    folder = exports_dir()
    if not folder:
        return False
    stem, ext = os.path.splitext(safe)
    path = os.path.join(folder, safe)
    n = 2
    while os.path.exists(path) and n < 1000:
        path = os.path.join(folder, "%s (%d)%s" % (stem, n, ext))
        n += 1
    try:
        with open(path, "wb") as fh:
            fh.write(raw)
    except Exception as exc:
        log_problem("open_export: could not write %s (%s)" % (path, exc))
        return False
    try:
        if sys.platform == "darwin":
            subprocess.Popen(["/usr/bin/open", path])
        elif sys.platform.startswith("win"):
            os.startfile(path)          # noqa: S606
        else:
            subprocess.Popen(["xdg-open", path])
    except Exception as exc:
        # the page is kept even when it cannot be opened, so the path is still useful
        log_problem("open_export: wrote %s but could not open it (%s)" % (path, exc))
    return path


def _html_fragment(raw):
    """The fragment inside Windows' "HTML Format" (a header of byte offsets, then the page)."""
    import re
    if not raw:
        return ""
    raw = raw.split(b"\0", 1)[0]
    m0 = re.search(rb"StartFragment:\s*(\d+)", raw)
    m1 = re.search(rb"EndFragment:\s*(\d+)", raw)
    if m0 and m1:
        a, b = int(m0.group(1)), int(m1.group(1))
        if 0 <= a < b <= len(raw):
            return raw[a:b].decode("utf-8", "replace")
    k = raw.find(b"<")
    return raw[k:].decode("utf-8", "replace") if k >= 0 else ""


def read_clipboard():
    """Build 1048: the system clipboard, read for the page's own Paste.

    The page's right-click menu and Tabula's Paste ask for this. The web view
    may not let a page read the clipboard at all, or only after the keyboard
    shortcut; the app can, because it is the app the person is using. It is
    read only when Paste is pressed, and nothing is kept or sent anywhere.
    Returns {"text": ..., "html": ...}; either may be empty.
    """
    out = {"text": "", "html": ""}
    try:
        if sys.platform == "darwin":
            try:
                from AppKit import NSPasteboard  # part of pywebview's own Mac backend
                pb = NSPasteboard.generalPasteboard()
                out["text"] = str(pb.stringForType_("public.utf8-plain-text") or "")
                out["html"] = str(pb.stringForType_("public.html") or "")
            except Exception:
                import subprocess
                r = subprocess.run(["pbpaste"], capture_output=True, timeout=5)
                out["text"] = r.stdout.decode("utf-8", "replace")
        elif sys.platform.startswith("win"):
            import ctypes
            import time
            from ctypes import wintypes
            u32 = ctypes.WinDLL("user32", use_last_error=True)
            k32 = ctypes.WinDLL("kernel32", use_last_error=True)
            u32.OpenClipboard.argtypes = [wintypes.HWND]
            u32.OpenClipboard.restype = wintypes.BOOL
            u32.CloseClipboard.argtypes = []
            u32.CloseClipboard.restype = wintypes.BOOL
            u32.IsClipboardFormatAvailable.argtypes = [wintypes.UINT]
            u32.IsClipboardFormatAvailable.restype = wintypes.BOOL
            u32.GetClipboardData.argtypes = [wintypes.UINT]
            u32.GetClipboardData.restype = wintypes.HANDLE
            u32.RegisterClipboardFormatW.argtypes = [wintypes.LPCWSTR]
            u32.RegisterClipboardFormatW.restype = wintypes.UINT
            k32.GlobalLock.argtypes = [wintypes.HANDLE]
            k32.GlobalLock.restype = ctypes.c_void_p
            k32.GlobalUnlock.argtypes = [wintypes.HANDLE]
            k32.GlobalUnlock.restype = wintypes.BOOL
            k32.GlobalSize.argtypes = [wintypes.HANDLE]
            k32.GlobalSize.restype = ctypes.c_size_t
            opened = False
            for _ in range(10):  # another program may hold the clipboard for a moment
                if u32.OpenClipboard(None):
                    opened = True
                    break
                time.sleep(0.05)
            if not opened:
                return out
            try:
                CF_UNICODETEXT = 13
                if u32.IsClipboardFormatAvailable(CF_UNICODETEXT):
                    h = u32.GetClipboardData(CF_UNICODETEXT)
                    if h:
                        p = k32.GlobalLock(h)
                        if p:
                            try:
                                out["text"] = ctypes.wstring_at(p)
                            finally:
                                k32.GlobalUnlock(h)
                fmt = u32.RegisterClipboardFormatW("HTML Format")
                if fmt and u32.IsClipboardFormatAvailable(fmt):
                    h = u32.GetClipboardData(fmt)
                    if h:
                        p = k32.GlobalLock(h)
                        if p:
                            try:
                                raw = ctypes.string_at(p, k32.GlobalSize(h))
                            finally:
                                k32.GlobalUnlock(h)
                            out["html"] = _html_fragment(raw)
            finally:
                u32.CloseClipboard()
    except Exception:
        log_problem("read_clipboard", sys.exc_info())
    return out


# ===========================================================================================================
# Build 1074: backups, kept in pieces.
# The page's Backup sheet gathers the work, compresses it, seals it when asked (AES-256, from a passphrase that never
# leaves the page) and hands it here in pieces of 768 KB, each tried three times. A backup is written under a hidden
# name and given its own name only when its last piece is on the disk, so one that stops part way leaves nothing that
# looks like a backup. The places are Documents > Carpe Diem > Backups and each cloud folder found on this computer;
# the page is given a label for each, never a path (a cloud folder's path can carry the account's address).
# ===========================================================================================================
_BK = {"lock": None, "open": {}, "done": {}, "name": None}


def _bk_init():
    import re, threading
    if _BK["lock"] is None:
        _BK["lock"] = threading.Lock()
        _BK["name"] = re.compile(r"^carpe-diem-[A-Za-z0-9-]+(\.cdbackup|\.json\.gz|\.json)$")


def _bk_documents():
    """The person's Documents folder (on Windows the one the system names, which OneDrive may have moved)."""
    import os
    if sys.platform.startswith("win"):
        try:
            import ctypes
            buf = ctypes.create_unicode_buffer(1024)
            if ctypes.windll.shell32.SHGetFolderPathW(None, 5, None, 0, buf) == 0 and buf.value:
                return buf.value
        except Exception:
            pass
    return os.path.join(os.path.expanduser("~"), "Documents")


def _bk_clouds():
    """Each cloud folder found on this computer, as (label, folder); two of a kind are told apart by a number."""
    import json, os
    home = os.path.expanduser("~")
    found = []

    def add(label, path):
        try:
            if path and os.path.isdir(path):
                real = os.path.realpath(path)
                if all(os.path.realpath(p) != real for _, p in found):
                    found.append((label, path))
        except Exception:
            pass
    if sys.platform == "darwin":
        add("iCloud Drive", os.path.join(home, "Library", "Mobile Documents", "com~apple~CloudDocs"))
        cs = os.path.join(home, "Library", "CloudStorage")
        try:
            names = sorted(os.listdir(cs)) if os.path.isdir(cs) else []
        except Exception:
            names = []
        for n in names:
            p = os.path.join(cs, n)
            if n.startswith("OneDrive"):
                org = n[len("OneDrive"):].lstrip("-").strip()
                add("OneDrive" + ("" if org in ("", "Personal") else " (" + org + ")"), p)
            elif n.startswith("GoogleDrive"):
                md = os.path.join(p, "My Drive")
                add("Google Drive", md if os.path.isdir(md) else p)
            elif n.startswith("Dropbox"):
                add("Dropbox", p)
            elif n.startswith("Box"):
                add("Box", p)
        add("Dropbox", os.path.join(home, "Dropbox"))
    elif sys.platform.startswith("win"):
        for var in ("OneDriveConsumer", "OneDriveCommercial", "OneDrive"):
            v = os.environ.get(var)
            if v:
                base = os.path.basename(v.rstrip("\\/"))
                org = base[len("OneDrive"):].lstrip(" -").strip() if base.startswith("OneDrive") else ""
                add("OneDrive" + (" (" + org + ")" if org and org != "Personal" else ""), v)
        add("iCloud Drive", os.path.join(home, "iCloudDrive"))
        for d in "GHIJK":
            if os.path.isdir(d + ":\\My Drive"):
                add("Google Drive", d + ":\\My Drive")
                break
        add("Google Drive", os.path.join(home, "Google Drive"))
        for f in (os.path.join(os.environ.get("LOCALAPPDATA", ""), "Dropbox", "info.json"),
                  os.path.join(os.environ.get("APPDATA", ""), "Dropbox", "info.json")):
            try:
                with open(f, encoding="utf-8") as fh:
                    info = json.load(fh)
                for k in ("personal", "business"):
                    if (info.get(k) or {}).get("path"):
                        add("Dropbox", info[k]["path"])
            except Exception:
                pass
        add("Dropbox", os.path.join(home, "Dropbox"))
        add("Box", os.path.join(home, "Box"))
    seen, out = {}, []
    for label, path in found:
        seen[label] = seen.get(label, 0) + 1
        out.append((label if seen[label] == 1 else "%s %d" % (label, seen[label]), path))
    return out


def _bk_places():
    import os
    out = [{"id": "documents", "label": "Documents › Carpe Diem › Backups", "cloud": False,
            "dir": os.path.join(_bk_documents(), "Carpe Diem", "Backups")}]
    for label, path in _bk_clouds():
        out.append({"id": "cloud:" + label, "label": label + " › Carpe Diem Backups", "cloud": True,
                    "dir": os.path.join(path, "Carpe Diem Backups")})
    return out


def backup_places():
    """The places offered to the page: an id and a label each, never a path."""
    try:
        return [{"id": p["id"], "label": p["label"], "cloud": p["cloud"]} for p in _bk_places()]
    except Exception:
        log_note("backup: the places could not be listed")
        return [{"id": "documents", "label": "Documents › Carpe Diem › Backups", "cloud": False}]


def _bk_unique(path):
    import os
    if not os.path.exists(path):
        return path
    folder, name = os.path.split(path)
    for ext in (".json.gz", ".cdbackup", ".json"):
        if name.endswith(ext):
            stem = name[:-len(ext)]
            break
    else:
        stem, ext = os.path.splitext(name)
    for n in range(2, 1000):
        p = os.path.join(folder, "%s-%d%s" % (stem, n, ext))
        if not os.path.exists(p):
            return p
    return path


def _bk_sweep(folder):
    """Hidden pieces of a backup that stopped more than a day ago are taken away."""
    import os, time
    try:
        for n in os.listdir(folder):
            if n.startswith(".carpe-diem-") and n.endswith(".partial"):
                p = os.path.join(folder, n)
                if time.time() - os.path.getmtime(p) > 86400:
                    os.remove(p)
    except Exception:
        pass


def backup_begin(win, place, name):
    """A backup begins: its place ("ask" is a save dialog), its name (carpe-diem-...); a key for its pieces."""
    import os, secrets
    _bk_init()
    name = str(name or "")
    if not _BK["name"].match(name):
        return {"error": "That is not a backup's name."}
    if place == "ask":
        try:
            import webview
            w = win
            if w is None:
                ws = [x for x in (getattr(webview, "windows", None) or []) if x is not None]
                w = ws[0] if ws else None
            if w is None:
                return {"error": "No window to ask where."}
            start = os.path.join(_bk_documents(), "Carpe Diem", "Backups")
            try:
                os.makedirs(start, exist_ok=True)
            except Exception:
                start = _bk_documents()
            res = w.create_file_dialog(webview.SAVE_DIALOG, directory=start, save_filename=name)
            if not res:
                return {"cancelled": True}
            final = res if isinstance(res, str) else res[0]
        except Exception:
            log_note("backup: the save dialog could not be shown")
            return {"error": "The save dialog could not be shown."}
    else:
        p = [x for x in _bk_places() if x["id"] == place]
        if not p:
            return {"error": "That place is not on this computer now."}
        try:
            os.makedirs(p[0]["dir"], exist_ok=True)
        except Exception:
            log_note("backup: the folder for %s could not be made" % p[0]["label"])
            return {"error": "The folder could not be made in " + p[0]["label"] + "."}
        final = _bk_unique(os.path.join(p[0]["dir"], name))
    folder = os.path.dirname(final)
    tmp = os.path.join(folder, "." + os.path.basename(final) + ".partial")
    try:
        fh = open(tmp, "wb")
    except Exception:
        log_note("backup: could not write in the chosen folder")
        return {"error": "Carpe Diem cannot write in that folder."}
    import threading
    key = secrets.token_hex(12)
    with _BK["lock"]:
        _BK["open"][key] = {"final": final, "tmp": tmp, "fh": fh, "next": 0, "pos": 0, "lock": threading.Lock()}
    _bk_sweep(folder)
    return {"key": key}


def backup_part(key, i, data_b64):
    """One piece, in its turn. A piece asked again after it arrived (its answer was lost) is taken as done; a piece
    that failed part way is written again from where the last good one ended."""
    import base64
    _bk_init()
    with _BK["lock"]:
        rec = _BK["open"].get(key)
    if not rec:
        return False
    try:
        i = int(i)
    except Exception:
        return False
    with rec["lock"]:
        if i < rec["next"]:
            return True
        if i != rec["next"]:
            return False
        try:
            raw = base64.b64decode(data_b64 or "", validate=True)
            fh = rec["fh"]
            fh.seek(rec["pos"])
            fh.truncate()
            fh.write(raw)
            fh.flush()
            rec["pos"] += len(raw)
            rec["next"] += 1
            return True
        except Exception:
            log_note("backup: piece %d was not written" % i)
            return False


def backup_end(key, keep=0, prefix=""):
    """The last piece is on the disk: the backup takes its name. Daily ones beyond the number kept go."""
    import os, secrets
    _bk_init()
    with _BK["lock"]:
        rec = _BK["open"].pop(key, None)
    if not rec:
        return {"ok": False, "error": "That backup was not begun."}
    fh = rec["fh"]
    try:
        fh.flush()
        os.fsync(fh.fileno())
        fh.close()
        os.replace(rec["tmp"], rec["final"])
    except Exception:
        try:
            fh.close()
        except Exception:
            pass
        try:
            os.remove(rec["tmp"])
        except Exception:
            pass
        log_note("backup: could not be finished on the disk")
        return {"ok": False, "error": "The backup could not be finished on the disk."}
    try:
        keep = int(keep or 0)
    except Exception:
        keep = 0
    if keep > 0 and str(prefix or "").startswith("carpe-diem-auto-"):
        try:
            folder = os.path.dirname(rec["final"])
            mine = sorted(n for n in os.listdir(folder) if n.startswith(prefix) and _BK["name"].match(n))
            for n in mine[:-keep]:
                os.remove(os.path.join(folder, n))
        except Exception:
            log_note("backup: older daily backups could not be cleared")
    token = secrets.token_hex(12)
    with _BK["lock"]:
        _BK["done"][token] = rec["final"]
    log_note("backup: kept, %d bytes" % rec["pos"])
    return {"ok": True, "token": token, "name": os.path.basename(rec["final"]), "size": rec["pos"]}


def backup_abort(key):
    import os
    _bk_init()
    with _BK["lock"]:
        rec = _BK["open"].pop(key, None)
    if not rec:
        return False
    try:
        rec["fh"].close()
    except Exception:
        pass
    try:
        os.remove(rec["tmp"])
    except Exception:
        pass
    return True


def backup_reveal(token):
    """Show a backup just kept, selected, in the Finder or in File Explorer."""
    import os, subprocess
    _bk_init()
    with _BK["lock"]:
        path = _BK["done"].get(token)
    if not path or not os.path.exists(path):
        return False
    try:
        if sys.platform == "darwin":
            subprocess.Popen(["open", "-R", path])
        elif sys.platform.startswith("win"):
            subprocess.Popen(["explorer", "/select,", os.path.normpath(path)])
        else:
            subprocess.Popen(["xdg-open", os.path.dirname(path)])
        return True
    except Exception:
        log_note("backup: could not be shown")
        return False


class TabulaWindowApi:
    """JS API for a floating app window: close, save, and open a sibling window.

    open_app delegates to the main window's API. Without it, pressing Imago
    inside the Tabula window had no way to ask for a window of its own, so the
    page fell back to tearing Tabula down and building Imago in its place, which
    is the heaviest thing a secondary web view can be asked to do.
    """


    # Build 1073: pywebview lists the methods a page may call by walking every public attribute of this object, and
    # followed main_window into the window's own platform objects (on Windows, .NET's AccessibilityObject.Bounds.Empty.
    # Empty... without end), which held the window unanswering. What is not a request of the page is kept from it.
    def __dir__(self):
        return [n for n in object.__dir__(self) if n not in ("main_window", "host", "win", "server_name", "server_port")]

    def __init__(self, host=None):
        self.win = None
        self.host = host

    def open_app(self, which, base=None, mode="beside"):
        try:
            if self.host is not None:
                return self.host.open_app(which, base, mode)
        except Exception:
            log_problem("TabulaWindowApi.open_app(%r)" % (which,))
        return False

    def room_to_dock(self, which):
        """Build 1073: the room as an app of its own, in the Dock."""
        return room_to_dock(which)

    def broadcast_theme(self, dark):
        """Build 1059: a day or night change made in this window reaches the desk and every other window."""
        try:
            if self.host is not None:
                return self.host.broadcast_theme(dark)
        except Exception:
            log_problem("TabulaWindowApi.broadcast_theme")
        return False

    def print_document(self, name, mime, data_b64):
        """Build 1059: printing leaves the web view from a room window too."""
        return print_document(self.win, name, mime, data_b64)


    def open_export(self, name, data_b64):
        """A room's own page, written to Documents/Carpe Diem/Exports and opened in the browser."""
        return open_export(None, name, data_b64)

    def read_clipboard(self):
        """Build 1048: the page's Paste reads the system clipboard through the app."""
        return read_clipboard()

    def file_opened(self, name, how):
        """Build 1072: how a file opened with Carpe Diem went in Tabula, for the record."""
        log_note("file: %s %s" % (str(name)[:120], str(how)[:200]))
        return True

    def take_file(self, where="desk"):
        """Build 1072: a Word or PDF file waiting to open in Tabula, asked for by the page."""
        return _take_file(getattr(self, "host", None) or self, where)

    def file_part(self, key, i):
        """Build 1072: one piece of that file."""
        return _file_part(key, i)

    def save_file(self, name, mime, data_b64):
        """The floating window previously had no way to write a file at all."""
        return save_bytes(self.win, name, mime, data_b64)

    def close_self(self):
        try:
            if self.win is not None:
                self.win.destroy()
                return True
        except Exception:
            pass
        return False


class CarpeApi:
    """JS API exposed to the main window as window.pywebview.api.

    Opens Tabula, Abacus, Imago, Scriba or Fontes in its own native window (the ↗ key
    of a floating window calls open_app; build 1059). The windows share the same on-disk localStorage where
    the platform web view allows it; each app re-reads its saved work on load.
    """

    APP_TITLES = {"tabula": "Tabula", "abacus": "Abacus", "slides": "Imago", "scriba": "Scriba", "fontes": "Fontes"}
    APP_COLORS = {"tabula": "#2A2622", "abacus": "#1E3D2C", "slides": "#7A2530", "scriba": "#22304A", "fontes": "#F1EBE1"}


    # Build 1073: pywebview lists the methods a page may call by walking every public attribute of this object, and
    # followed main_window into the window's own platform objects (on Windows, .NET's AccessibilityObject.Bounds.Empty.
    # Empty... without end), which held the window unanswering. What is not a request of the page is kept from it.
    def __dir__(self):
        return [n for n in object.__dir__(self) if n not in ("main_window", "host", "win", "server_name", "server_port")]

    def __init__(self, app_url):
        import threading
        self._app_url = app_url
        self.main_window = None
        self._wins = {}
        # Creating two native windows at once, or twice for the same studio
        # because the float button was pressed again while the first was still
        # opening, is a real way to destabilise the platform web view. One
        # creation at a time, and never a duplicate.
        self._lock = threading.RLock()
        self._creating = set()

    def _alive(self, which):
        w = self._wins.get(which)
        if w is None:
            return False
        try:
            _ = w.title
            return True
        except Exception:
            self._wins.pop(which, None)
            return False

    def print_document(self, name, mime, data_b64):
        """Printing has to leave the web view.

        WKWebView does not implement window.print(), so a print request made inside
        the page reaches nothing at all. The document is written to a file and opened
        with the system's own application, where the print dialog is the machine's.
        """
        return print_document(getattr(self, "main_window", None), name, mime, data_b64)


    def open_export(self, name, data_b64):
        """A room's own page, written to Documents/Carpe Diem/Exports and opened in the browser."""
        return open_export(None, name, data_b64)

    def read_clipboard(self):
        """Build 1048: the page's Paste reads the system clipboard through the app."""
        return read_clipboard()

    def file_opened(self, name, how):
        """Build 1072: how a file opened with Carpe Diem went in Tabula, for the record."""
        log_note("file: %s %s" % (str(name)[:120], str(how)[:200]))
        return True

    def take_file(self, where="desk"):
        """Build 1072: a Word or PDF file waiting to open in Tabula, asked for by the page."""
        return _take_file(getattr(self, "host", None) or self, where)

    def file_part(self, key, i):
        """Build 1072: one piece of that file."""
        return _file_part(key, i)

    def save_file(self, name, mime, data_b64):
        return save_bytes(None, name, mime, data_b64)

    def backup_places(self):
        """Build 1074: where a backup can be kept, as labels (never a path)."""
        return backup_places()

    def backup_begin(self, place, name):
        """Build 1074: a backup begins (its place, or "ask" for a save dialog, and its name); a key for its pieces."""
        return backup_begin(getattr(self, "main_window", None), place, name)

    def backup_part(self, key, i, data_b64):
        """Build 1074: one piece of a backup, in its turn."""
        return backup_part(key, i, data_b64)

    def backup_end(self, key, keep=0, prefix=""):
        """Build 1074: the backup's last piece is on the disk; it takes its name."""
        return backup_end(key, keep, prefix)

    def backup_abort(self, key):
        """Build 1074: a backup that stopped leaves nothing behind."""
        return backup_abort(key)

    def backup_reveal(self, token):
        """Build 1074: show a backup just kept, in the Finder or File Explorer."""
        return backup_reveal(token)

    def restart_into_new_build(self):
        """Build 1065: quit, then open the newer Carpe Diem now in this one's place (asked by the page's card)."""
        return _restart_into_new_build()

    def close_app(self, which):
        """Close a native studio window, so the desk bar's cross can reach it.
        Without this the cross could only ever close a desk frame, which is why it
        looked ornamental on the desktop builds."""
        if which not in self.APP_TITLES:
            return False
        with self._lock:
            w = self._wins.get(which)
        if w is None:
            return False
        try:
            w.destroy()
        except Exception:
            log_problem("close_app(%r): destroy failed" % (which,), sys.exc_info())
        finally:
            with self._lock:
                self._wins.pop(which, None)
        return True

    def focus_app(self, which):
        """Return True if that app window is open (and try to bring it forward)."""
        if which not in self.APP_TITLES or not self._alive(which):
            return False
        w = self._wins[which]
        try:
            w.restore()
        except Exception:
            pass
        try:
            w.show()
        except Exception:
            pass
        return True

    def _room_url(self, base):
        """Carpe Diem's own address when the page gives it (http://127.0.0.1:<port>, where the desk's
        storage lives, so the window shares the work), else the file URI."""
        try:
            b = str(base or "").split("#")[0]
            own = str(self._app_url or "").split("#")[0]
            if b and (b.startswith("http://127.0.0.1:") or b.startswith("http://localhost:") or b == own):
                return b
        except Exception:
            pass
        return self._app_url

    def room_to_dock(self, which):
        """Build 1073: the room as an app of its own, in the Dock (asked by the page's "Its own window, on the Dock")."""
        return room_to_dock(which)

    def open_app(self, which, base=None, mode="beside"):
        """Open (or focus) a separate native window for the app. True on success;
        {"ok": False, "why": "safety"} when this run offers no native windows (build 1059).
        Build 1073: mode "beside" puts the window beside Carpe Diem's, as a tab of the same window (the page's "Side by
        side with Carpe Diem"); mode "own" keeps it a window of its own, apart from Carpe Diem's (the room's own app in
        the Dock, and "Its own window, on the Dock")."""
        if which not in self.APP_TITLES:
            return False
        if _ROOM.get("off"):
            return {"ok": False, "why": "safety"}
        mode = "own" if mode == "own" else "beside"
        with self._lock:
            if self._alive(which):
                self._place(self._wins[which], mode)
                return self.focus_app(which)
            if which in self._creating:
                log_problem("open_app(%r): already opening, ignored" % (which,))
                return False
            self._creating.add(which)
        try:
            import webview
            win_api = TabulaWindowApi(host=self)
            _room_mark()
            win = webview.create_window(
                self.APP_TITLES[which],
                url=self._room_url(base) + "#cd=" + which,
                width=1050,
                height=760,
                min_size=(MIN_WIDTH, MIN_HEIGHT),
                background_color=self.APP_COLORS[which],
                confirm_close=False,
                text_select=True,
                js_api=win_api,
            )
            win_api.win = win
            self._wins[which] = win
            try:
                win.events.closed += (lambda *a, w=which: self._wins.pop(w, None))
            except Exception:
                pass
            if mode == "own":
                self._stand_apart(win)
            else:
                self._tab_beside_desk(win)
            return True
        except Exception:
            log_problem("open_app(%r)" % (which,))
            self._wins.pop(which, None)
            return False
        finally:
            with self._lock:
                self._creating.discard(which)

    def _place(self, win, mode):
        """A room window already open moves to the place asked: into Carpe Diem's window as a tab, or out of it."""
        if mode == "own":
            self._stand_apart(win, now=True)
        else:
            self._tab_beside_desk(win, now=True)

    def _stand_apart(self, win, now=False):
        """Build 1073: a room's window of its own, never drawn into Carpe Diem's window as a tab (macOS joins windows
        that share a tabbing name; this one keeps a name of its own, and leaves Carpe Diem's tabs if it was among them)."""
        def apart(*_a):
            try:
                import AppKit
                from PyObjCTools import AppHelper
            except Exception:
                log_problem("own window: AppKit", sys.exc_info())
                return

            def go():
                try:
                    room = getattr(win, "native", None)
                    if room is None:
                        return
                    try:
                        room.setTabbingIdentifier_("CarpeDiemRoom-" + str(win.title))
                        room.setTabbingMode_(AppKit.NSWindowTabbingModeDisallowed)
                    except Exception:
                        pass
                    group = room.tabGroup() if hasattr(room, "tabGroup") else None
                    if group is not None and len(list(group.windows() or [])) > 1:
                        room.moveTabToNewWindow_(None)
                    room.makeKeyAndOrderFront_(None)
                    AppKit.NSApp.activateIgnoringOtherApps_(True)
                except Exception:
                    log_problem("own window", sys.exc_info())
            AppHelper.callAfter(go)
        if now:
            apart()
            return
        try:
            win.events.shown += apart
        except Exception:
            log_problem("own window: no shown event", sys.exc_info())

    def _tab_beside_desk(self, win, now=False):
        """Build 1061: a room's own window joins Carpe Diem's window as a tab ("Carpe Diem | Tabula" across the top),
        as macOS does by itself only while Carpe Diem fills the screen. Closing the tab closes the room's window."""
        def attach(*_a):
            try:
                import AppKit
                from PyObjCTools import AppHelper
            except Exception:
                log_problem("tab beside the desk: AppKit", sys.exc_info())
                return

            def go():
                try:
                    desk = getattr(self.main_window, "native", None)
                    room = getattr(win, "native", None)
                    if desk is None or room is None or desk is room:
                        return
                    for w in (desk, room):
                        try:
                            w.setTabbingIdentifier_("CarpeDiem")
                            w.setTabbingMode_(AppKit.NSWindowTabbingModePreferred)
                        except Exception:
                            pass
                    group = room.tabGroup() if hasattr(room, "tabGroup") else None
                    if group is not None and desk in list(group.windows() or []):
                        return
                    desk.addTabbedWindow_ordered_(room, AppKit.NSWindowAbove)
                    room.makeKeyAndOrderFront_(None)
                except Exception:
                    log_problem("tab beside the desk", sys.exc_info())
            AppHelper.callAfter(go)
        if now:
            attach()
            return
        try:
            win.events.shown += attach
        except Exception:
            log_problem("tab beside the desk: no shown event", sys.exc_info())

    def carry_state(self):
        """Build 1050: whether the work kept at the old address still has to come across (asked by the page)."""
        return carry_state()

    def carry_done(self, note=""):
        """Build 1050: the page has the work at Carpe Diem's own address."""
        return carry_done(note)

    # Backward compatible names kept for older builds of the app HTML.
    def broadcast_theme(self, dark):
        """Carry a theme change to every other native window of this app.

        Separate webviews do not reliably observe one another's localStorage
        writes, so the main window asks Python to relay the change directly.
        """
        js = "try{window.cdApplyThemeExternal&&window.cdApplyThemeExternal(%s);}catch(e){}" % (
            "true" if dark else "false",
        )
        targets = []
        try:
            targets.append(self.main_window)
        except Exception:
            pass
        with self._lock:
            targets.extend(list(self._wins.values()))
        for w in targets:
            if w is None:
                continue
            try:
                w.evaluate_js(js)
            except Exception:
                pass
        return True

    def open_tabula(self):
        return self.open_app("tabula")

    def focus_tabula(self):
        return self.focus_app("tabula")



def log_note(tag):
    """One line in the record with nothing under it (log_problem writes the exception being handled beneath its line,
    and a traceback in the record stops the GitHub build's open test)."""
    import datetime
    try:
        with open(crash_log_path(), "a", encoding="utf-8") as fh:
            fh.write("\n=== %s  %s ===\n" % (datetime.datetime.now().isoformat(timespec="seconds"), tag))
    except Exception:
        pass


# Build 1072: a Word or PDF file the app is asked to open (Open With in the Finder or in Explorer, or a double click once
# Carpe Diem is chosen for it) goes to Tabula, through the same readers as Tabula's File, Open.
OPENABLE = (".docx", ".pdf")
_OPENED = {"queue": [], "parts": {}}
_PART = 1 << 20


def _openable(path):
    try:
        return isinstance(path, str) and path.lower().endswith(OPENABLE) and os.path.isfile(path)
    except Exception:
        return False


def _hear_pywebview():
    """Build 1072: pywebview's own errors (a request from the page that failed inside it, say) are written to the record,
    where they can be read; otherwise they go to a console a windowed app does not have."""
    import logging

    class ToRecord(logging.Handler):
        def emit(self, rec):
            try:
                msg = str(self.format(rec)).replace("Traceback", "trace")
                log_note("pywebview: " + msg[:1500])
            except Exception:
                pass
    try:
        h = ToRecord()
        h.setLevel(logging.ERROR)
        logging.getLogger("pywebview").addHandler(h)
    except Exception:
        pass


def files_asked(paths):
    """Word and PDF files to hand to Tabula as soon as the page can take them."""
    got = [os.path.abspath(p) for p in (paths or []) if _openable(p)]
    for p in got:
        log_note("file: %s asked to open" % os.path.basename(p))
    _OPENED["queue"].extend(got)
    return len(got)


def _take_file(api, where):
    """The page asks for a file waiting to open (it asks every second or so). Tabula's own window takes it when one is
    open, else Carpe Diem's window. The bytes wait here, in pieces the page fetches one at a time (file_part): a long
    PDF is many megabytes. Nothing here calls into the page, so nothing here can wait on a page that is not ready."""
    try:
        return _take_file_now(api, where)
    except Exception:
        log_problem("file: the page's request for a file failed")
        return None


def files_wait_for_tabula(seconds=90.0):
    """Build 1073: files that came with a request for Tabula's own window (Open With, Tabula) wait for that window to
    take them, for a while at most; 0 lets Carpe Diem's window take them (Tabula's window cannot open this run)."""
    import time
    _OPENED["for_tabula"] = (time.time() + seconds) if seconds else 0


def _take_file_now(api, where):
    import base64
    import math
    import time
    import uuid
    if where not in ("desk", "tabula") or not _OPENED["queue"]:
        return None
    try:
        tabula_open = bool(getattr(api, "_alive", None) and api._alive("tabula"))
    except Exception:
        tabula_open = False
    if where == "desk" and tabula_open:
        if not _OPENED.get("held"):
            _OPENED["held"] = True
            log_note("file: waiting for Tabula's own window, which is open, to take it")
        return None
    if where == "desk" and _OPENED.get("for_tabula", 0) > time.time():
        if not _OPENED.get("held_opening"):
            _OPENED["held_opening"] = True
            log_note("file: waiting for Tabula's own window, which is opening, to take it")
        return None
    try:
        path = _OPENED["queue"].pop(0)
    except IndexError:
        return None
    name = os.path.basename(path)
    try:
        with open(path, "rb") as fh:
            data = fh.read()
    except Exception:
        log_note("file: %s could not be read (%s)" % (name, sys.exc_info()[1]))
        return None
    key = uuid.uuid4().hex
    b64 = base64.b64encode(data).decode("ascii")
    _OPENED["parts"][key] = b64
    log_note("file: %s handed to Tabula (%d bytes) in %s" % (name, len(data), "its own window" if where == "tabula" else "Carpe Diem's window"))
    return {"key": key, "name": name, "parts": max(1, int(math.ceil(len(b64) / float(_PART))))}


def _file_part(key, i):
    """One piece of a file the page is taking; the last piece lets the file go."""
    b64 = _OPENED["parts"].get(str(key))
    if b64 is None:
        return ""
    i = int(i)
    piece = b64[i * _PART:(i + 1) * _PART]
    if (i + 1) * _PART >= len(b64):
        _OPENED["parts"].pop(str(key), None)
    return piece

# ---------------------------------------------------------------------------
# Build 1073, at the owner's word: Tabula, Abacus, Imago, Scriba and Fontes are apps of their own, each with its own name
# and icon, kept in ~/Applications/Carpe Diem Rooms, where the Dock, Launchpad and Spotlight find them. Each is a small
# launcher made on this Mac (an AppleScript applet, by the Mac's own osacompile, signed for this Mac alone) that asks
# Carpe Diem for its room in a window of its own, apart from Carpe Diem's window (carpediem://room/<room>), so the work
# stays in one place. Tabula's is the one the Finder offers under Open With for Word and PDF files: it hands the file to
# Carpe Diem, which opens it in Tabula's own window.
# ---------------------------------------------------------------------------
ROOM_NAMES = {"tabula": "Tabula", "abacus": "Abacus", "slides": "Imago", "scriba": "Scriba", "fontes": "Fontes"}
ROOM_LINK = "carpediem://room/"
OWN_BUNDLE_ID = "com.yannieforest.carpediem"
# changes only when the room apps themselves change: a new Carpe Diem leaves them as they are, so the Dock keeps them
ROOM_APP_KIND = "1073"
_ROOMS_ASKED = {"queue": [], "early": None}
_DESK = {"shown": False}


def _rooms_sync():
    import threading
    if "lock" not in _ROOMS_ASKED:
        _ROOMS_ASKED["lock"] = threading.Lock()
        _ROOMS_ASKED["event"] = threading.Event()
    return _ROOMS_ASKED["lock"], _ROOMS_ASKED["event"]


def _room_from(text):
    """'carpediem://room/tabula', or a room's name (tabula, imago...): the room's key, else None."""
    low = str(text or "").strip().lower()
    if low.startswith("carpediem:"):
        low = low.split(":", 1)[1].lstrip("/")
        if not low.startswith("room/"):
            return None
        low = low[5:]
    low = low.strip("/").split("/")[0].split("?")[0].split("#")[0]
    low = {"imago": "slides"}.get(low, low)
    return low if low in ROOM_NAMES else None


def rooms_dir():
    return os.path.join(os.path.expanduser("~"), "Applications", "Carpe Diem Rooms")


def room_app_path(which):
    return os.path.join(rooms_dir(), ROOM_NAMES[which] + ".app")


def _room_script(which, carpe):
    """The launcher's AppleScript: Carpe Diem (the copy that made it, else any by its identity) opens the room; Tabula's
    also hands on the Word and PDF files it is given."""
    def q(t):
        return '"' + str(t).replace("\\", "\\\\").replace('"', '\\"') + '"'
    link = q(ROOM_LINK + which)
    send = []
    if carpe:
        send += ['\ttry',
                 '\t\tdo shell script "/bin/test -d " & quoted form of %s & " && /usr/bin/open -a " & quoted form of %s & " " & quoted form of what' % (q(carpe), q(carpe)),
                 '\t\treturn',
                 '\tend try']
    send += ['\ttry',
             '\t\tdo shell script "/usr/bin/open -b %s " & quoted form of what' % OWN_BUNDLE_ID,
             '\ton error',
             '\t\tif what starts with "carpediem:" then open location what',
             '\tend try']
    lines = ['on run', '\tsendToCarpeDiem(%s)' % link, 'end run', '',
             'on reopen', '\tsendToCarpeDiem(%s)' % link, 'end reopen', '',
             'on sendToCarpeDiem(what)'] + send + ['end sendToCarpeDiem']
    if which == "tabula":
        lines += ['', 'on open theFiles', '\tsendToCarpeDiem(%s)' % link, '\trepeat with f in theFiles',
                  '\t\tsendToCarpeDiem(POSIX path of f)', '\tend repeat', 'end open']
    return "\n".join(lines) + "\n"


def _on_main_thread(fn, wait_s=20.0):
    """fn on AppKit's main thread when the app's window loop runs (from another thread), else here."""
    import threading
    if threading.current_thread() is threading.main_thread():
        return fn()
    try:
        from PyObjCTools import AppHelper
    except Exception:
        return fn()
    done, out = threading.Event(), {}

    def go():
        try:
            out["r"] = fn()
        finally:
            done.set()
    AppHelper.callAfter(go)
    done.wait(wait_s)
    return out.get("r")


def _make_room_app(which, force=False):
    """The room's own app in ~/Applications/Carpe Diem Rooms, made, or brought up to date in place (the Dock keeps
    pointing at it); its path, or None."""
    import plistlib
    import shutil
    import subprocess
    import tempfile
    if sys.platform != "darwin" or which not in ROOM_NAMES:
        return None
    name = ROOM_NAMES[which]
    dest = room_app_path(which)
    carpe = _OWN_BUNDLE.get("path") or ""
    if "/AppTranslocation/" in carpe:
        carpe = ""   # a copy macOS runs from a hidden place for now: the launcher finds Carpe Diem by its identity
    icon = resource_path(os.path.join("rooms", which + ".icns"))
    try:
        icon_size = os.path.getsize(icon)
    except OSError:
        log_note("room app: %s has no icon in this copy (%s)" % (name, icon))
        return None
    want = "%s|%s|%d" % (ROOM_APP_KIND, carpe, icon_size)
    if not force:
        try:
            with open(os.path.join(dest, "Contents", "Info.plist"), "rb") as fh:
                if plistlib.load(fh).get("CDRoomApp") == want:
                    return dest
        except Exception:
            pass
    work = tempfile.mkdtemp(prefix="carpe-room-")
    try:
        src = os.path.join(work, "room.applescript")
        with open(src, "w", encoding="utf-8") as fh:
            fh.write(_room_script(which, carpe))
        made = os.path.join(work, name + ".app")
        r = subprocess.run(["/usr/bin/osacompile", "-o", made, src], capture_output=True, text=True, timeout=120)
        if r.returncode != 0 or not os.path.isdir(made):
            log_note("room app: %s could not be made (osacompile: %s)" % (name, (r.stderr or r.stdout).strip()[:300]))
            return None
        res = os.path.join(made, "Contents", "Resources")
        shutil.copyfile(icon, os.path.join(res, "room.icns"))
        plist = os.path.join(made, "Contents", "Info.plist")
        with open(plist, "rb") as fh:
            info = plistlib.load(fh)
        info.update({
            "CFBundleIdentifier": "%s.room.%s" % (OWN_BUNDLE_ID, which),
            "CFBundleName": name,
            "CFBundleDisplayName": name,
            "CFBundleIconFile": "room",
            "CFBundleShortVersionString": ROOM_APP_KIND,
            "CFBundleVersion": ROOM_APP_KIND,
            "LSUIElement": True,
            "NSHumanReadableCopyright": "Copyright (c) 2026 Yannie D. Forest. All rights reserved.",
            "CDRoomApp": want,
        })
        info.pop("CFBundleIconName", None)
        if which == "tabula":
            # Open With offers Tabula for Word and PDF files; "Alternate": the owner chooses the default in Get Info
            info["CFBundleDocumentTypes"] = [
                {"CFBundleTypeName": "Word document", "CFBundleTypeRole": "Editor", "LSHandlerRank": "Alternate",
                 "LSItemContentTypes": ["org.openxmlformats.wordprocessingml.document"]},
                {"CFBundleTypeName": "PDF document", "CFBundleTypeRole": "Viewer", "LSHandlerRank": "Alternate",
                 "LSItemContentTypes": ["com.adobe.pdf"]},
            ]
        else:
            info.pop("CFBundleDocumentTypes", None)
        with open(plist, "wb") as fh:
            plistlib.dump(info, fh)
        r = subprocess.run(["/usr/bin/codesign", "--force", "--sign", "-", "--timestamp=none", made],
                           capture_output=True, text=True, timeout=120)
        if r.returncode != 0:
            log_note("room app: %s not signed (%s)" % (name, (r.stderr or r.stdout).strip()[:300]))
        os.makedirs(rooms_dir(), exist_ok=True)
        if os.path.isdir(dest):
            # in place, so the Dock's item keeps finding it
            shutil.rmtree(os.path.join(dest, "Contents"), ignore_errors=True)
            shutil.move(os.path.join(made, "Contents"), os.path.join(dest, "Contents"))
        else:
            shutil.move(made, dest)
        _room_app_icon(dest, os.path.join(dest, "Contents", "Resources", "room.icns"))
        subprocess.run(["/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister",
                        "-f", dest], capture_output=True, timeout=60)
        log_note("room app: %s made (%s)" % (name, dest))
        return dest
    except Exception:
        log_problem("room app: %s could not be made" % name)
        return None
    finally:
        shutil.rmtree(work, ignore_errors=True)


def _room_app_icon(app, icns):
    """The room's icon set as the app's own (as Finder's Get Info sets one), so macOS 26 shows it as drawn, never in a
    grey square; the Dock, Launchpad and Open With show it too."""
    def go():
        try:
            from AppKit import NSImage, NSWorkspace
            img = NSImage.alloc().initWithContentsOfFile_(icns)
            if img is None or not NSWorkspace.sharedWorkspace().setIcon_forFile_options_(img, app, 0):
                log_note("room app: the icon of %s was not set as its own (its bundle's icon stays)" % os.path.basename(app))
        except Exception:
            log_note("room app: the icon of %s was not set as its own (%s)" % (os.path.basename(app), sys.exc_info()[1]))
    try:
        _on_main_thread(go)
    except Exception:
        log_note("room app: the icon of %s was not set as its own (%s)" % (os.path.basename(app), sys.exc_info()[1]))


def make_room_apps(force=False):
    """Every room's own app, made or brought up to date; how many are ready."""
    n = sum(1 for w in ROOM_NAMES if _make_room_app(w, force))
    log_note("room apps: %d of %d ready in %s" % (n, len(ROOM_NAMES), rooms_dir()))
    return n


def _make_room_apps_soon(delay_s=8.0):
    """At start, once the window is up: the room apps, so the Finder offers Tabula under Open With from the first run."""
    import threading
    import time
    if sys.platform != "darwin" or not _OWN_BUNDLE.get("path"):
        return

    def run():
        time.sleep(delay_s)
        try:
            make_room_apps()
        except Exception:
            log_problem("room apps: not made")
    threading.Thread(target=run, daemon=True).start()


def _dock_items():
    import plistlib
    import subprocess
    out = subprocess.run(["/usr/bin/defaults", "export", "com.apple.dock", "-"], capture_output=True, timeout=30).stdout
    return plistlib.loads(out).get("persistent-apps", []) if out else []


def _same_app(url, app):
    from urllib.parse import unquote, urlparse
    try:
        u = urlparse(str(url or ""))
        if u.scheme != "file":
            return False
        return os.path.realpath(unquote(u.path).rstrip("/")) == os.path.realpath(app.rstrip("/"))
    except Exception:
        return False


def room_to_dock(which):
    """The room's own app, made if need be and kept in the Dock (at the end of its apps), once. Asked by the page's
    "Its own window, on the Dock"."""
    import subprocess
    from urllib.parse import quote
    which = _room_from(which)
    if not which:
        return {"ok": False, "why": "no such room"}
    if sys.platform != "darwin":
        return {"ok": False, "why": "not a Mac"}
    app = _make_room_app(which)
    if not app or not os.path.isdir(app):
        return {"ok": False, "why": "its app could not be made"}
    try:
        if any(_same_app(((t.get("tile-data") or {}).get("file-data") or {}).get("_CFURLString"), app) for t in _dock_items()):
            log_note("room: %s is in the Dock already" % which)
            return {"ok": True, "added": False, "app": app}
        url = "file://" + quote(app.rstrip("/") + "/", safe="/")
        entry = ("<dict><key>tile-data</key><dict><key>file-data</key><dict><key>_CFURLString</key><string>%s</string>"
                 "<key>_CFURLStringType</key><integer>15</integer></dict></dict></dict>"
                 % url.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
        subprocess.run(["/usr/bin/defaults", "write", "com.apple.dock", "persistent-apps", "-array-add", entry],
                       check=True, capture_output=True, timeout=30)
        subprocess.run(["/usr/bin/killall", "Dock"], capture_output=True, timeout=30)
        log_note("room: %s put in the Dock (%s)" % (which, app))
        return {"ok": True, "added": True, "app": app}
    except Exception:
        log_problem("room: %s could not be put in the Dock" % which)
        return {"ok": False, "why": "the Dock did not take it", "app": app}


def rooms_asked(links, how="its own app"):
    """Rooms asked for by their own apps (carpediem://room/<room>), opened in windows of their own as soon as Carpe
    Diem's window has its address. When Carpe Diem was started for a room, its own window steps aside (minimised)."""
    got = [w for w in (_room_from(x) for x in (links or [])) if w]
    if not got:
        return 0
    lock, event = _rooms_sync()
    with lock:
        if _ROOMS_ASKED["early"] is None:
            _ROOMS_ASKED["early"] = not _DESK["shown"]
        _ROOMS_ASKED["queue"].extend(got)
    if "tabula" in got:
        files_wait_for_tabula()
    for w in got:
        log_note("room: %s asked by %s" % (w, how))
    event.set()
    return len(got)


def _serve_asked_rooms(api, window):
    import threading
    import time
    lock, event = _rooms_sync()
    try:
        window.events.shown += (lambda *a: _DESK.update(shown=True))
    except Exception:
        _DESK["shown"] = True

    def ready():
        try:
            return window.events.loaded.is_set() and str(getattr(window, "real_url", "") or "").startswith("http")
        except Exception:
            return False

    def run():
        while True:
            event.wait()
            event.clear()
            for _ in range(240):
                if ready():
                    break
                time.sleep(0.5)
            while True:
                with lock:
                    if not _ROOMS_ASKED["queue"]:
                        break
                    which = _ROOMS_ASKED["queue"].pop(0)
                    early = bool(_ROOMS_ASKED.get("early"))
                    _ROOMS_ASKED["early"] = False
                try:
                    opener = getattr(api, "open_app", None)
                    ok = opener(which, getattr(window, "real_url", None), "own") if opener else {"ok": False, "why": "one window"}
                except Exception:
                    log_problem("room: %s could not open" % which)
                    ok = False
                if ok is True:
                    log_note("room: %s opened in a window of its own" % which)
                    if early:
                        time.sleep(1.5)
                        try:
                            window.minimize()
                        except Exception:
                            pass
                    continue
                # no window of its own this run (the safety rule, or one window only): the room opens in Carpe Diem's
                log_note("room: %s opens in Carpe Diem's window (%r)" % (which, ok))
                if which == "tabula":
                    files_wait_for_tabula(0)
                try:
                    window.run_js("try{if(typeof cdCloseDoor==='function')cdCloseDoor();openExt(%r);}catch(e){}" % which)
                except Exception:
                    log_problem("room: %s could not open in Carpe Diem's window" % which)
    threading.Thread(target=run, daemon=True).start()



def _no_store(start_response):
    """Build 1064, as The Forge 647: every answer from Carpe Diem's own address says it is not to be kept, so the web
    view never shows a page kept from an earlier build (the owner saw 1059 after installing 1062 and 1063)."""
    def sr(status, headers, exc_info=None):
        keep = [(k, v) for (k, v) in headers if k.lower() not in ("cache-control", "expires", "pragma", "etag", "last-modified")]
        keep += [("Cache-Control", "no-store, max-age=0"), ("Pragma", "no-cache"), ("Expires", "0")]
        if exc_info is not None:
            return start_response(status, keep, exc_info)
        return start_response(status, keep)
    return sr


def _guard_local_server():
    """Build 1064, as The Forge 647: the server for Carpe Diem's own address answers only Carpe Diem's own window
    (127.0.0.1 or localhost at its port; a page elsewhere that renames itself cannot read from it), and every answer goes
    out not to be kept."""
    try:
        import webview.http as _wh
    except Exception:
        return False
    b = getattr(_wh, "bottle", None)
    if b is None or getattr(b.run, "_cd_guard", False):
        return bool(b)
    orig = b.run

    def run(app=None, *a, **kw):
        port, inner = kw.get("port") or (a[2] if len(a) > 2 else None), app

        def guarded(environ, start_response):
            host = (environ.get("HTTP_HOST") or "").strip().lower()
            name = host if host.endswith("]") else host.rsplit(":", 1)[0]
            if (port and host in ("127.0.0.1:%s" % port, "localhost:%s" % port, "[::1]:%s" % port)) or \
                    (not port and name in ("127.0.0.1", "localhost", "[::1]")):
                return inner(environ, _no_store(start_response))
            body = b"This address answers only Carpe Diem's own window."
            start_response("421 Misdirected Request", [("Content-Type", "text/plain; charset=utf-8"),
                                                       ("Content-Length", str(len(body)))])
            return [body]
        return orig(guarded, *a, **kw)
    run._cd_guard = True
    b.run = run
    return True


def _page_build(path):
    """The build the page names (window.CD_BUILD's pass and stamp), read from the file, or ''."""
    import re as _re
    try:
        with open(path, "rb") as fh:
            data = fh.read()
        m = _re.search(rb'window\.CD_BUILD=\{date:"[^"]*",pass:"(\d+)",stamp:"([^"]*)"', data)
        return (m.group(1) + b" " + m.group(2)).decode("ascii", "replace") if m else ""
    except Exception:
        return ""


def _empty_page_cache(store):
    """The web view's cache of pages (never its local storage or its databases)."""
    try:
        if sys.platform == "darwin":
            import time as _t
            import WebKit
            from Foundation import NSDate, NSRunLoop, NSSet
            kinds = NSSet.setWithArray_([WebKit.WKWebsiteDataTypeDiskCache, WebKit.WKWebsiteDataTypeMemoryCache])
            done = {"ok": False}

            def _done():
                done["ok"] = True
            WebKit.WKWebsiteDataStore.defaultDataStore().removeDataOfTypes_modifiedSince_completionHandler_(
                kinds, NSDate.dateWithTimeIntervalSince1970_(0), _done)
            end = _t.time() + 5
            while not done["ok"] and _t.time() < end:
                NSRunLoop.currentRunLoop().runUntilDate_(NSDate.dateWithTimeIntervalSinceNow_(0.05))
            return done["ok"]
        if sys.platform.startswith("win") and store:
            import shutil as _sh
            for rel in (("EBWebView", "Default", "Cache"), ("EBWebView", "Default", "Code Cache")):
                p = os.path.join(store, *rel)
                if os.path.isdir(p):
                    _sh.rmtree(p, ignore_errors=True)
            return True
    except Exception:
        log_note("page cache: could not be emptied (%s)" % (sys.exc_info()[1],))
    return False


def _forget_old_pages(app_html):
    """Build 1064, as The Forge 647: the first time a build starts, the web view's cache of pages is emptied, so the
    window shows this build's page and not one kept from an earlier build at the same address."""
    build = _page_build(app_html)
    store = storage_dir()
    if not build or not store:
        return
    note = os.path.join(os.path.dirname(store), "page_build.txt")
    try:
        with open(note, encoding="utf-8") as fh:
            before = fh.read().strip()
    except Exception:
        before = ""
    if before == build:
        return
    emptied = _empty_page_cache(store)
    log_note("page: build %s starts (the build before: %s); the web view's cache of pages %s"
             % (build, before or "none noted", "emptied" if emptied else "NOT emptied"))
    if emptied:
        try:
            with open(note, "w", encoding="utf-8") as fh:
                fh.write(build)
        except Exception:
            pass


def _check_page_build(window, app_html):
    """Build 1064: once the page has loaded, the build it shows is compared with the build installed. If an earlier
    build's page was shown, it is loaded again from Carpe Diem's own address under a new name, which no cache holds,
    once; the address itself is the same, so the work is the same."""
    want = (_page_build(app_html).split(" ") or [""])[0]
    state = {"done": False}

    def check(*_a):
        if state["done"] or not want:
            return
        state["done"] = True
        try:
            shown = str(window.evaluate_js("(window.CD_BUILD && window.CD_BUILD.pass) || ''") or "")
        except Exception:
            return
        if not shown or shown == want:
            return
        log_note("page: the window showed build %s, but build %s is installed; it is loaded again" % (shown, want))
        try:
            url = str(window.get_current_url() or "")
            if url.startswith("http://127.0.0.1:") or url.startswith("http://localhost:"):
                base = url.split("#")[0].split("?")[0]
                window.load_url(base + "?build=" + want)
        except Exception:
            log_note("page: could not be loaded again (%s)" % (sys.exc_info()[1],))
    try:
        window.events.loaded += check
    except Exception:
        pass


_OWN_BUNDLE = {"path": ""}


def _note_own_bundle():
    """This app's bundle (…/Carpe Diem.app) when it runs as one, read once at start: after Finder puts a newer Carpe
    Diem in its place, the same path names the newer one."""
    try:
        from Foundation import NSBundle
        p = str(NSBundle.mainBundle().bundlePath() or "")
        _OWN_BUNDLE["path"] = p if p.endswith(".app") else ""
    except Exception:
        _OWN_BUNDLE["path"] = ""
    return _OWN_BUNDLE["path"]


def _pid_alive(pid):
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False
    except Exception:
        return True


def _address_free(port):
    """True when nothing listens at 127.0.0.1:port."""
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind(("127.0.0.1", port))
        return True
    except OSError:
        return False
    finally:
        s.close()


def _address_holders(port):
    """The processes listening at 127.0.0.1:port (lsof is on every Mac)."""
    import subprocess
    try:
        out = subprocess.run(["/usr/sbin/lsof", "-nP", "-t", "-iTCP:%d" % port, "-sTCP:LISTEN"],
                             capture_output=True, text=True, timeout=10).stdout
        return [int(x) for x in out.split() if x.strip().isdigit() and int(x) != os.getpid()]
    except Exception:
        return []


def _older_copies_step_aside():
    """Build 1065. The owner saw 1059 after installing 1062 and 1063. A Carpe Diem left open keeps Carpe Diem's own
    address (127.0.0.1:42049), so a newly installed one starting beside it would show the open one's page. Every other
    Carpe Diem that is running is asked to quit, as Quit in its Dock menu asks (its page keeps the work as it closes),
    and this start waits until the address is free. If one will not quit, this start says so and ends, rather than
    show another build's page. Returns False when this start should end."""
    if sys.platform != "darwin":
        return True
    try:
        from AppKit import NSRunningApplication
        from Foundation import NSBundle
        bid = str(NSBundle.mainBundle().bundleIdentifier() or "")
    except Exception:
        return True
    others = []
    if bid.startswith("com.yannieforest.carpediem"):
        for a in list(NSRunningApplication.runningApplicationsWithBundleIdentifier_(bid) or []):
            try:
                pid = int(a.processIdentifier())
            except Exception:
                continue
            if pid > 0 and pid != os.getpid():
                others.append((a, pid))
    if not others and _address_free(CARPE_PORT):
        return True
    if not others:
        # held by a Carpe Diem that is not this kind of app (one run from its folder, say): asked the same way
        for pid in _address_holders(CARPE_PORT):
            a = NSRunningApplication.runningApplicationWithProcessIdentifier_(pid)
            name = str(a.localizedName() or "") if a is not None else ""
            if a is not None and "Carpe" in name:
                others.append((a, pid))
        if not others:
            log_note("Carpe Diem's address is held by a program that is not Carpe Diem; this start goes on")
            return True
    import time
    for a, pid in others:
        try:
            where = str(a.bundleURL().path()) if a.bundleURL() is not None else "?"
        except Exception:
            where = "?"
        log_note("another Carpe Diem is open (process %d, %s): it is asked to quit, as Quit in its Dock menu does"
                 % (pid, where))
        _ask_to_quit(pid)
    asked_old = False
    start = time.time()
    while time.time() < start + 25:
        alive = [(a, pid) for (a, pid) in others if _pid_alive(pid)]
        if not alive and _address_free(CARPE_PORT):
            log_note("the other Carpe Diem has closed; this one opens")
            return True
        if alive and not asked_old and time.time() > start + 3:
            # a copy from before 1065 does not hear Carpe Diem's own word: it is asked as the Dock's Quit asks, with
            # Apple's quit event (the Mac may ask the owner to allow it)
            asked_old = True
            for a, pid in alive:
                try:
                    a.terminate()
                except Exception:
                    pass
        time.sleep(0.25)
    log_note("the other Carpe Diem did not close; this start ends rather than show its page")
    tell_user(
        "Another Carpe Diem is still open, and it did not close when asked.\n\n"
        "Quit it first: click its window, then choose Carpe Diem > Quit Carpe Diem\n"
        "(or press Command-Q). Then open Carpe Diem again.\n\n"
        "This keeps you from seeing an earlier build's page.")
    return False


_QUIT_ASK = "com.yannieforest.carpediem.quit-please"


def _ask_to_quit(pid):
    """Build 1065: Carpe Diem's own word to another copy (a notification of the Mac's own, which needs no permission,
    as an Apple event sent to another app can)."""
    try:
        from Foundation import NSDistributedNotificationCenter
        NSDistributedNotificationCenter.defaultCenter().postNotificationName_object_userInfo_deliverImmediately_(
            _QUIT_ASK, str(pid), None, True)
    except Exception:
        log_note("another copy: the word to quit could not be sent (%s)" % (sys.exc_info()[1],))


def _hear_quit_please():
    """Build 1065: when a newer start asks this copy to quit, it quits as Quit does (the page keeps its work)."""
    try:
        from Foundation import NSDistributedNotificationCenter

        def heard(_n):
            log_note("quit: a newer start of Carpe Diem asked this copy to quit; it quits as Quit does")
            try:
                from AppKit import NSApplication
                NSApplication.sharedApplication().terminate_(None)
            except Exception:
                log_note("quit: could not quit by itself (%s)" % (sys.exc_info()[1],))
        tok = NSDistributedNotificationCenter.defaultCenter().addObserverForName_object_queue_usingBlock_(
            _QUIT_ASK, str(os.getpid()), None, heard)
        _QUIT_WATCH.append(tok)
    except Exception:
        log_note("quit: the word from a newer start could not be listened for (%s)" % (sys.exc_info()[1],))


def _watch_for_newer_build(window, app_html):
    """Build 1065. When a newer Carpe Diem is put where this one was opened from while this one is open (Finder's
    Replace), opening Carpe Diem can bring this copy forward instead of starting the newer one, so the window would go
    on showing this build. This copy looks at the page now in its place whenever it is brought forward (from 1068: at
    once, so the offer is there as the window comes up) and once a minute; when it is a newer build, the page offers to
    start again into it (the work stays)."""
    import json
    import threading
    import time
    try:
        started = int((_page_build(app_html).split(" ") or ["0"])[0] or 0)
    except Exception:
        started = 0
    if not started or not _OWN_BUNDLE.get("path"):
        return
    lock = threading.Lock()
    st8 = {"seen": None, "told": 0}

    def check_once():
        with lock:
            try:
                st = os.stat(app_html)
                sig = (st.st_mtime, st.st_size, st.st_ino)
            except Exception:
                return
            if sig == st8["seen"]:
                return
            st8["seen"] = sig
            try:
                now = int((_page_build(app_html).split(" ") or ["0"])[0] or 0)
            except Exception:
                return
            if now <= started or now == st8["told"]:
                return
            st8["told"] = now
        log_note("a newer Carpe Diem (build %d) is in this one's place; the page offers to start it" % now)
        try:
            window.evaluate_js("window.cdNewBuildInstalled && window.cdNewBuildInstalled(%s)" % json.dumps(str(now)))
        except Exception:
            pass

    def every_minute():
        while True:
            time.sleep(60)
            check_once()
    threading.Thread(target=every_minute, name="carpe-newer-build", daemon=True).start()
    try:
        from Foundation import NSNotificationCenter
        tok = NSNotificationCenter.defaultCenter().addObserverForName_object_queue_usingBlock_(
            "NSApplicationDidBecomeActiveNotification", None, None,
            lambda _n: threading.Thread(target=check_once, name="carpe-newer-build-now", daemon=True).start())
        _QUIT_WATCH.append(tok)
    except Exception:
        log_note("newer build: coming forward could not be heard (%s)" % (sys.exc_info()[1],))


def _restart_into_new_build():
    """Build 1065: quit as Quit does, and open the Carpe Diem now in this one's place once this one has gone."""
    import subprocess
    bundle = _OWN_BUNDLE.get("path") or ""
    if not bundle or not os.path.isdir(bundle):
        return False
    script = ('i=0; while kill -0 %d 2>/dev/null && [ $i -lt 150 ]; do sleep 0.2; i=$((i+1)); done; '
              'exec /usr/bin/open "$0"') % os.getpid()
    try:
        subprocess.Popen(["/bin/sh", "-c", script, bundle], start_new_session=True, close_fds=True,
                         stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        log_problem("restart: the newer build could not be asked to open", sys.exc_info())
        return False
    log_note("restart: this build quits so that the newer one opens")
    try:
        from AppKit import NSApplication
        from PyObjCTools import AppHelper
        AppHelper.callAfter(lambda: NSApplication.sharedApplication().terminate_(None))
    except Exception:
        log_problem("restart: could not quit by itself", sys.exc_info())
        return False
    return True


_QUIT_WATCH = []


def _clean_quit_ends_session():
    """Build 1065: Quit (Command-Q, Quit in the Dock, a restart into a newer build, or shutting the Mac down) ends the
    app inside the window system, without coming back to main(), so the run was never marked as ended cleanly; two
    Quits in a row looked like two crashes and the third start opened in the browser. The clean ending is now noted
    as the app goes."""
    try:
        from Foundation import NSNotificationCenter
        tok = NSNotificationCenter.defaultCenter().addObserverForName_object_queue_usingBlock_(
            "NSApplicationWillTerminateNotification", None, None, lambda _n: _end_session())
        _QUIT_WATCH.append(tok)
    except Exception:
        log_note("quit: a clean Quit could not be heard (%s)" % (sys.exc_info()[1],))


def _hear_opened_files():
    """Build 1072: a Word or PDF file opened with Carpe Diem while it is open comes from the Finder as an Apple event,
    which the app's delegate hears (pywebview's own delegate has no ear for it). One that starts the app arrives in
    sys.argv instead (argv_emulation in carpe_diem.spec). Build 1073: so does a room asked for by its own app
    (carpediem://room/tabula)."""
    try:
        from webview.platforms import cocoa
    except Exception:
        log_problem("files: the Finder's requests cannot be heard")
        return

    class CarpeDiemAppDelegate(cocoa.BrowserView.AppDelegate):
        def application_openURLs_(self, app, urls):
            try:
                files_asked([str(u.path()) for u in urls if u.isFileURL()])
                rooms_asked([str(u.absoluteString()) for u in urls if not u.isFileURL()])
            except Exception:
                log_problem("files: the Finder's request could not be read")

    try:
        cocoa.BrowserView._shared_app_delegate = CarpeDiemAppDelegate.alloc().init()
        log_note("files: listening for Word and PDF files from the Finder")
    except Exception:
        log_problem("files: the Finder's requests cannot be heard")


def _make_window(webview, api, app_html):
    """The main window, in one place so its creation can be guarded."""
    _guard_local_server()
    return webview.create_window(
        WINDOW_TITLE,
        url=app_html,
        width=DEFAULT_WIDTH,
        height=DEFAULT_HEIGHT,
        min_size=(MIN_WIDTH, MIN_HEIGHT),
        background_color=ACCENT_BLUE,
        confirm_close=False,
        text_select=True,
        js_api=api,
    )



class CarpeApiSingle:
    """The API offered when CARPE_DIEM_NATIVE_WINDOWS=0: no second native window.

    A second web view in the same process is the most likely cause of the Mac
    crash, by the same reasoning that explained the Intel Windows machine. The
    page asks Python for a native window only because open_app exists; with it
    absent the app uses its own floating windows, drawn inside the page. Since
    pass 299 those resize from every edge, remember their place, fold into the
    dock and answer the desk tabs, so nothing is lost except the risk.

    From build 1059 native room windows are on by default (CarpeApi), opened
    from the ↗ key of a floating window; a run that follows a bad ending while
    one was open offers none. CARPE_DIEM_NATIVE_WINDOWS=0 chooses this API.
    """


    # Build 1073: pywebview lists the methods a page may call by walking every public attribute of this object, and
    # followed main_window into the window's own platform objects (on Windows, .NET's AccessibilityObject.Bounds.Empty.
    # Empty... without end), which held the window unanswering. What is not a request of the page is kept from it.
    def __dir__(self):
        return [n for n in object.__dir__(self) if n not in ("main_window", "host", "win", "server_name", "server_port")]

    def __init__(self, app_url):
        self._app_url = app_url
        self.main_window = None

    def print_document(self, name, mime, data_b64):
        """Printing has to leave the web view.

        WKWebView does not implement window.print(), so a print request made inside
        the page reaches nothing at all. The document is written to a file and opened
        with the system's own application, where the print dialog is the machine's.
        """
        return print_document(getattr(self, "main_window", None), name, mime, data_b64)


    def open_export(self, name, data_b64):
        """A room's own page, written to Documents/Carpe Diem/Exports and opened in the browser."""
        return open_export(None, name, data_b64)

    def read_clipboard(self):
        """Build 1048: the page's Paste reads the system clipboard through the app."""
        return read_clipboard()

    def file_opened(self, name, how):
        """Build 1072: how a file opened with Carpe Diem went in Tabula, for the record."""
        log_note("file: %s %s" % (str(name)[:120], str(how)[:200]))
        return True

    def take_file(self, where="desk"):
        """Build 1072: a Word or PDF file waiting to open in Tabula, asked for by the page."""
        return _take_file(getattr(self, "host", None) or self, where)

    def file_part(self, key, i):
        """Build 1072: one piece of that file."""
        return _file_part(key, i)

    def save_file(self, name, mime, data_b64):
        return save_bytes(None, name, mime, data_b64)

    def backup_places(self):
        """Build 1074: where a backup can be kept, as labels (never a path)."""
        return backup_places()

    def backup_begin(self, place, name):
        """Build 1074: a backup begins (its place, or "ask" for a save dialog, and its name); a key for its pieces."""
        return backup_begin(getattr(self, "main_window", None), place, name)

    def backup_part(self, key, i, data_b64):
        """Build 1074: one piece of a backup, in its turn."""
        return backup_part(key, i, data_b64)

    def backup_end(self, key, keep=0, prefix=""):
        """Build 1074: the backup's last piece is on the disk; it takes its name."""
        return backup_end(key, keep, prefix)

    def backup_abort(self, key):
        """Build 1074: a backup that stopped leaves nothing behind."""
        return backup_abort(key)

    def backup_reveal(self, token):
        """Build 1074: show a backup just kept, in the Finder or File Explorer."""
        return backup_reveal(token)

    def restart_into_new_build(self):
        """Build 1065: quit, then open the newer Carpe Diem now in this one's place (asked by the page's card)."""
        return _restart_into_new_build()

    def carry_state(self):
        """Build 1050: whether the work kept at the old address still has to come across (asked by the page)."""
        return carry_state()

    def carry_done(self, note=""):
        """Build 1050: the page has the work at Carpe Diem's own address."""
        return carry_done(note)

    def broadcast_theme(self, dark):
        js = "try{window.cdApplyThemeExternal&&window.cdApplyThemeExternal(%s);}catch(e){}" % (
            "true" if dark else "false",)
        try:
            if self.main_window is not None:
                self.main_window.evaluate_js(js)
        except Exception:
            pass
        return True


def _session_flag():
    """Where the breadcrumb lives. Beside the log, so one folder holds both."""
    try:
        base = pathlib.Path.home() / "Library" / "Application Support" / "CarpeDiem"
        base.mkdir(parents=True, exist_ok=True)
        return base / "carpe_session.flag"
    except Exception:
        try:
            return pathlib.Path.home() / ".carpe_diem_session.flag"
        except Exception:
            return None


def _begin_session():
    """Return how many previous runs ended without cleaning up after themselves."""
    f = _session_flag()
    if f is None:
        return 0
    prior = 0
    try:
        if f.exists():
            prior = int((f.read_text().strip() or "1"))
    except Exception:
        prior = 1
    try:
        f.write_text(str(prior + 1))
    except Exception:
        pass
    return prior


def _end_session():
    """A clean exit removes the breadcrumb, so only bad endings accumulate."""
    f = _session_flag()
    try:
        room_clear()
    except Exception:
        pass
    try:
        if f is not None and f.exists():
            f.unlink()
    except Exception:
        pass


import pathlib

def skip_server_name_lookup():
    """Start the app's local page server without asking the network who it is.

    pywebview serves carpe_diem.html from a small server on this Mac only
    (127.0.0.1). Python's server, as it starts, looks up the computer's full
    network name before it begins accepting connections. On macOS Sequoia that
    lookup can go out to the local network: macOS then asks "Allow Carpe Diem
    to find devices on local networks?", and while the lookup waits the server
    refuses the window's first request, so the window stays blank. Seen on
    GitHub's Mac in build 1042, Apple silicon and Intel alike.

    The name is only ever used for a header nobody reads, so the server is
    given its own address instead. Same address, same port: the storage that
    holds your work is untouched.
    """
    try:
        import http.server
        import socketserver

        def server_bind(self):
            socketserver.TCPServer.server_bind(self)
            host, port = self.server_address[:2]
            self.server_name = host
            self.server_port = port

        http.server.HTTPServer.server_bind = server_bind
    except Exception:
        log_problem("could not skip the page server's name lookup")


# ---------------------------------------------------------------------------
# Build 1050, at the owner's word: Carpe Diem's own address.
# pywebview serves the page at 127.0.0.1 on port 42001 unless it is told
# otherwise, and The Forge, Inkwell and Ingenium are built the same way.
# Whichever app opened first answered for all of them, so Carpe Diem could show
# another app's "Error: 404 Not Found", or an older Carpe Diem's page. From
# build 1050 Carpe Diem opens at 127.0.0.1:42049, its own address.
# A browser keeps a page's work under its address, so the first time the work
# kept at the old address is brought across, once. The helper that does it,
# carpe_carry.py, sits beside the page and is read into this program at start;
# until it is, the three names below stand in for it and bring nothing across
# (the page then waits and says so, and nothing is hidden or removed).
# ---------------------------------------------------------------------------
CARPE_PORT = 42049
OLD_PORT = 42001


def carry_state():
    return {"needed": True}


def carry_done(note=""):
    return False


def start_carry_server():
    return None


def _load_carry():
    """Read the helper beside the page into this program (its names replace the three above)."""
    try:
        html = find_app_html()
        path = os.path.join(os.path.dirname(os.path.realpath(html)), "carpe_carry.py") if html else ""
        with open(path, encoding="utf-8") as fh:
            src = fh.read()
        exec(compile(src, path, "exec"), globals())
        return True
    except Exception:
        log_problem("carry: the helper beside the page could not be read", sys.exc_info())
        return False



# ---------------------------------------------------------------------------
# Build 1059: native room windows (Tabula, Abacus, Imago, Scriba, Fontes in a
# window of their own, asked for by the ↗ key of a floating window) are on by
# default. A breadcrumb records that one was opened; if the run then ends badly,
# the next run offers no native window (open_app answers {"ok": False, "why":
# "safety"}) and the page keeps its own floating windows and says so; the run
# after that offers them again. CARPE_DIEM_NATIVE_WINDOWS=0 keeps one window.
# ---------------------------------------------------------------------------
_ROOM = {"off": False}


def _room_flag_path():
    try:
        f = _session_flag()
        if f is None:
            return None
        return os.path.join(os.path.dirname(str(f)), "carpe_room.flag")
    except Exception:
        return None


def room_check_start(prior_bad):
    """At start: if the last run ended badly while a native room window was open, offer none for this run only."""
    p = _room_flag_path()
    try:
        if p and os.path.isfile(p):
            if prior_bad:
                _ROOM["off"] = True
                log_problem("native windows: the last run ended badly while one was open; off for this run")
            os.remove(p)
    except Exception:
        pass
    try:
        # the light windows of build 1051 are gone; their breadcrumb with them
        old = os.path.join(os.path.dirname(str(p)), "carpe_lite.flag") if p else None
        if old and os.path.isfile(old):
            os.remove(old)
    except Exception:
        pass


def _room_mark():
    p = _room_flag_path()
    try:
        if p and not os.path.isfile(p):
            with open(p, "w", encoding="utf-8") as fh:
                fh.write("1")
    except Exception:
        pass


def room_clear():
    """A clean ending: native windows were not to blame for anything."""
    p = _room_flag_path()
    try:
        if p and os.path.isfile(p):
            os.remove(p)
    except Exception:
        pass



def show_seal_in_dock(picture):
    """macOS 26 sets an app's own icon in a grey square when it is not Apple's rounded square, and shrinks it,
    but shows a custom icon (the kind Finder's Get Info sets) as it is. While the app runs, the Dock shows the
    picture the app gives it, so the round seal is given here, at its full size. Then, once per copy: when the
    app runs from a .app that has no custom icon yet and can be written, the seal is set as that bundle's custom
    icon (a file "Icon\\r" at the bundle root and a Finder flag), so Finder, Launchpad and the Dock show the
    seal whole when the app is closed too. To undo: Get Info on the app, click the small icon at the top, press
    Delete. Anywhere else (Windows, an older Mac) nothing changes."""
    if sys.platform != "darwin":
        return
    img = None
    try:
        pic = resource_path(picture)
        if not os.path.isfile(pic):
            return
        from AppKit import NSApplication, NSImage
        img = NSImage.alloc().initWithContentsOfFile_(pic)
        if img is not None:
            NSApplication.sharedApplication().setApplicationIconImage_(img)
    except Exception:
        try:
            log_problem("dock seal", sys.exc_info())
        except Exception:
            pass
    if img is None or not getattr(sys, "frozen", False):
        return
    try:
        # .../Carpe Diem.app/Contents/MacOS/Carpe Diem -> the bundle
        exe = os.path.realpath(sys.executable)
        macos_dir = os.path.dirname(exe)
        contents = os.path.dirname(macos_dir)
        bundle = os.path.dirname(contents)
        if os.path.basename(macos_dir) != "MacOS" or os.path.basename(contents) != "Contents" or not bundle.endswith(".app"):
            return
        if os.path.exists(os.path.join(bundle, "Icon\r")):
            return
        if not os.access(bundle, os.W_OK):
            return
        from AppKit import NSWorkspace
        if not NSWorkspace.sharedWorkspace().setIcon_forFile_options_(img, bundle, 0):
            log_problem("custom icon refused: " + bundle)
    except Exception:
        try:
            log_problem("custom icon", sys.exc_info())
        except Exception:
            pass


def _room_commands():
    """Build 1073: `--make-room-apps` makes (or brings up to date) the rooms' own apps, `--room-to-dock <room>` keeps one
    in the Dock; each ends at once, with no window (GitHub's build checks them this way)."""
    args = sys.argv[1:]
    if "--make-room-apps" in args:
        _note_own_bundle()
        n = make_room_apps(force="--force" in args)
        print("room apps: %d of %d in %s" % (n, len(ROOM_NAMES), rooms_dir()))
        sys.exit(0 if n == len(ROOM_NAMES) else 1)
    if "--room-to-dock" in args:
        _note_own_bundle()
        i = args.index("--room-to-dock")
        r = room_to_dock(args[i + 1] if i + 1 < len(args) else "")
        print("room to Dock: %r" % (r,))
        sys.exit(0 if r.get("ok") else 1)


def main():
    _room_commands()
    skip_server_name_lookup()
    app_html = find_app_html()
    if not app_html:
        tell_user(
            "Could not find the Carpe Diem app file, carpe_diem.html.\n\n"
            "If you are running from the source folder, keep carpe_diem.html\n"
            "beside this program. The portable version that needs no folder is\n"
            "the single file made by the Build step (Carpe Diem.exe on Windows,\n"
            "Carpe Diem.app on Mac). It carries the whole app inside and opens\n"
            "from anywhere you move it.\n\n"
            "You can also open carpe_diem.html on its own. That file is the\n"
            "whole app, offline."
        )
        sys.exit(1)

    _note_own_bundle()
    files_asked(sys.argv[1:])
    rooms_asked([a for a in sys.argv[1:] if str(a).lower().startswith("carpediem:")], "its own app, at start")
    try:
        if not _older_copies_step_aside():
            return
    except Exception:
        log_note("another copy: the check failed (%s); this start goes on" % (sys.exc_info()[1],))
    try:
        _forget_old_pages(app_html)
    except Exception:
        log_note("page cache: the check failed")
    log_problem("start: locating the window component")
    try:
        import webview  # pywebview
    except BaseException:
        # Not ImportError alone. On Windows pywebview loads pythonnet, and a
        # runtime that will not start raises RuntimeError, OSError or worse.
        # This was a crash before the window ever appeared.
        log_problem("import webview failed", sys.exc_info())
        _missing = isinstance(sys.exc_info()[1], ImportError)
        if open_in_browser(app_html):
            if _missing:
                tell_user(
                    "Carpe Diem has opened in your browser, because the component\n"
                    "that draws its own window is not installed.\n\n"
                    "Everything works exactly the same there, and nothing is sent\n"
                    "anywhere."
                )
            else:
                tell_user(
                    "Carpe Diem has opened in your browser, because the component\n"
                    "that draws its own window would not start on this PC.\n\n"
                    "Everything works exactly the same there, and nothing is sent\n"
                    "anywhere.\n\n"
                    "Details were written to:\n  %s" % crash_log_path()
                )
            return
        tell_user(friendly_missing_dependency_message())
        sys.exit(1)

    # Create the native window pointing at the local HTML file. Because the file
    # is loaded from disk, everything runs offline with no server involved.
    # background_color tints the native window behind the page. It is what shows
    # during load and around the content, so the window reads as Carpe Diem blue
    # rather than default grey. Note: this is NOT the same as the blue title bar
    # you get from installing as a web app, which comes from the manifest's
    # theme_color and is applied by the browser. See README (Blue title bar).
    # File URI form so a query flag can be appended for the Tabula window.
    try:
        from pathlib import Path
        app_url = Path(app_html).as_uri()
    except Exception:
        app_url = app_html

    # Recorded once at startup so a crash report says what it was running on.
    try:
        import platform
        log_problem("start: python %s on %s %s | pywebview %s" % (
            platform.python_version(), platform.system(), platform.release(),
            getattr(webview, "__version__", "unknown")))
    except Exception:
        pass

    _prior_bad = _begin_session()
    room_check_start(_prior_bad)
    if _prior_bad >= 2:
        # Two runs in a row ended badly. The file is the whole application,
        # so hand it to the browser rather than fail a third time.
        log_problem("mac: two bad endings, opening in the browser instead")
        try:
            import webbrowser
            webbrowser.open(pathlib.Path(app_html).as_uri())
        except Exception:
            pass
        _end_session()
        return 0
    if os.environ.get("CARPE_DIEM_NATIVE_WINDOWS", "").strip() == "0":
        api = CarpeApiSingle(app_url)
        log_problem("mac: one window (CARPE_DIEM_NATIVE_WINDOWS=0), the app draws its own floating windows")
    else:
        api = CarpeApi(app_url)
        if _ROOM.get("off"):
            log_problem("mac: no native window this run, the last run ended badly while one was open")
    try:
        window = _make_window(webview, api, app_html)
    except BaseException:
        # Creating the window can fail on its own, before start() is reached.
        log_problem("create_window failed", sys.exc_info())
        if open_in_browser(app_html):
            tell_user(
                "Carpe Diem could not open a native window on this PC, so it has\n"
                "opened in your browser instead. Everything works the same there.\n\n"
                "On Windows the usual cause is a missing Edge WebView2 runtime; on a Mac\n"
                "it is a Python built without the frameworks a window needs.\n\n"
                "Details were written to:\n  %s" % crash_log_path())
            return
        tell_user(
            "Carpe Diem could not open a window on this PC.\n\n"
            "Open carpe_diem.html by hand: that file IS the whole app.\n\n"
            "Details were written to:\n  %s" % crash_log_path())
        sys.exit(1)
    try:
        api.main_window = window
    except Exception:
        pass
    _serve_asked_rooms(api, window)
    _check_page_build(window, app_html)
    _watch_for_newer_build(window, app_html)
    _clean_quit_ends_session()
    _hear_quit_please()
    _hear_opened_files()
    _hear_pywebview()
    _make_room_apps_soon()

    # gui=None lets pywebview pick the best native backend for the platform
    # (Edge WebView2 on Windows, WKWebView on macOS, WebKitGTK/Qt on Linux).
    # debug=False keeps developer tools hidden for a clean, app-like feel.
    def _hook(exc_type, exc, tb):
        log_problem("uncaught", (exc_type, exc, tb))
        sys.__excepthook__(exc_type, exc, tb)
    sys.excepthook = _hook
    try:
        import threading
        if hasattr(threading, "excepthook"):
            threading.excepthook = lambda a: log_problem(
                "uncaught in thread", (a.exc_type, a.exc_value, a.exc_traceback))
    except Exception:
        pass

    # private_mode=False is what makes the work survive closing the app.
    # storage_path keeps it in the user's profile rather than in a temporary
    # unpack directory. An older pywebview may not accept either, so the failure
    # is caught and RECORDED rather than passing silently, because passing
    # silently is exactly how the data loss went unnoticed.
    try:
        _load_carry()
        start_carry_server()
    except Exception:
        log_problem("carry: not started", sys.exc_info())
    show_seal_in_dock('carpe_diem.png')
    _store = storage_dir()
    try:
        if _store:
            webview.start(gui=None, debug=False, private_mode=False, storage_path=_store, http_port=CARPE_PORT)
            _end_session()
        else:
            webview.start(gui=None, debug=False, private_mode=False, http_port=CARPE_PORT)
    except TypeError:
        log_problem("webview.start refused private_mode or storage_path; "
                    "this pywebview is too old and YOUR WORK WILL NOT PERSIST")
        webview.start(gui=None, debug=False)
    except Exception:
        # No native window could be created at all: a missing WebView2 runtime
        # on Windows is the usual reason. The page still is the application, so
        # it opens in the browser rather than the program dying in silence.
        log_problem("webview.start failed", sys.exc_info())
        if open_in_browser(app_html):
            tell_user(
                "Carpe Diem could not open a native window on this PC, so it has\n"
                "opened in your browser instead. Everything works the same there.\n\n"
                "On Windows that usually means a missing Edge WebView2 runtime; on a Mac,\n"
                "a Python built without the frameworks a window needs.\n"
                "Details were written to:\n  %s" % crash_log_path()
            )
        else:
            tell_user(
                "Carpe Diem could not open a window, and could not reach a browser\n"
                "either. Open carpe_diem.html by hand: that file IS the whole app.\n\n"
                "Details were written to:\n  %s" % crash_log_path()
            )


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception:
        # A crash now leaves a file to read instead of a window that vanishes.
        log_problem("fatal")
        tell_user(
            "Carpe Diem stopped unexpectedly.\n\n"
            "Details were written to:\n  %s\n\n"
            "carpe_diem.html in the same folder still opens the whole app." % crash_log_path())
        sys.exit(1)
