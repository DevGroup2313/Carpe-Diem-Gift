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


class TabulaWindowApi:
    """JS API for a floating app window: close, save, and open a sibling window.

    open_app delegates to the main window's API. Without it, pressing Imago
    inside the Tabula window had no way to ask for a window of its own, so the
    page fell back to tearing Tabula down and building Imago in its place, which
    is the heaviest thing a secondary web view can be asked to do.
    """

    def __init__(self, host=None):
        self.win = None
        self.host = host

    def open_app(self, which, base=None):
        try:
            if self.host is not None:
                return self.host.open_app(which, base)
        except Exception:
            log_problem("TabulaWindowApi.open_app(%r)" % (which,))
        return False

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

    def save_file(self, name, mime, data_b64):
        return save_bytes(None, name, mime, data_b64)

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

    def open_app(self, which, base=None):
        """Open (or focus) a separate native window for the app. True on success;
        {"ok": False, "why": "safety"} when this run offers no native windows (build 1059)."""
        if which not in self.APP_TITLES:
            return False
        if _ROOM.get("off"):
            return {"ok": False, "why": "safety"}
        with self._lock:
            if self._alive(which):
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
            return True
        except Exception:
            log_problem("open_app(%r)" % (which,))
            self._wins.pop(which, None)
            return False
        finally:
            with self._lock:
                self._creating.discard(which)

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


def _make_window(webview, api, app_html):
    """The main window, in one place so its creation can be guarded."""
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

    def save_file(self, name, mime, data_b64):
        return save_bytes(None, name, mime, data_b64)

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


def main():
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
