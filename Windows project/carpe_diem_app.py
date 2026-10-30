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

# Build 1063, as The Forge 649 and 9s57: Carpe Diem's own identity on Windows (its taskbar button, its pins and its Start
# menu shortcut are one), one copy at a time in a sign-in, and the rooms a Start menu shortcut can open by name.
APP_USER_MODEL_ID = "com.yannieforest.carpediem"
SINGLE_INSTANCE_NAME = "Local\\CarpeDiem.windows.single"
ROOMS = ("tabula", "abacus", "slides", "scriba", "fontes")


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
        os.path.join(here_script, "carpe_diem.html"),
        os.path.join(here_exe, "carpe_diem.html"),
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


def _session_flag():
    """Where the breadcrumb for 'a run started and has not finished' lives."""
    import os
    d = storage_dir() or os.path.expanduser("~")
    return os.path.join(d, "carpe_session.flag")


def _begin_session():
    """Record that a run has started, and report how many ended badly before.

    A crash inside the graphics layer of a web view takes the whole process with
    it: no exception, no traceback, nothing for Python to catch. The only way to
    know it happened is to notice, next time, that the previous run never wrote
    its own ending. That count is what lets the app protect itself on hardware
    where the graphics path is unsound, instead of failing the same way forever.
    """
    import os
    prior = 0
    path = _session_flag()
    try:
        if os.path.isfile(path):
            with open(path, "r", encoding="utf-8") as fh:
                prior = int((fh.read() or "0").strip() or "0") or 1
    except Exception:
        prior = 1
    try:
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(str(prior + 1))
    except Exception:
        log_problem("could not write the session breadcrumb")
    return prior


def _end_session():
    """A clean ending, so the next run knows the last one was well."""
    import os
    try:
        room_clear()
    except Exception:
        pass
    try:
        os.remove(_session_flag())
    except Exception:
        pass


def _prepare_windows_graphics(prior_failures):
    """Choose the browser arguments Edge WebView2 starts with, on Windows only.

    Reported from the field: on an HP with AMD Radeon graphics the window died on
    the very first click, while an Intel machine ran until a second window was
    opened. The first is the signature of a crash inside the graphics process,
    which is why nothing was ever written to the log. These arguments must be set
    BEFORE the web view is created, because that is when the environment is read.

    First run gets the mild setting, which costs almost nothing. After a run that
    never finished, graphics acceleration is turned off altogether.
    """
    import os
    if not sys.platform.startswith("win"):
        return None
    if prior_failures >= 1:
        # PASS 447: a bare --disable-gpu does not always stop a WebView2 crash on
        # AMD Radeon drivers; the compositor and the occlusion calculation can each
        # take the process down on their own. This is the complete belt-and-braces
        # set that has to hold on hardware where the graphics path is unsound.
        # --use-angle=swiftshader forces pure CPU rendering, which cannot crash in
        # an AMD driver. NOTE: it must NOT be combined with --disable-software-
        # rasterizer (the original had that): together with --disable-gpu they can
        # leave NO renderer at all, which is itself a crash. Software rendering is
        # allowed, GPU acceleration and the AMD-crashing paths are off.
        args = ("--disable-gpu --disable-gpu-compositing --disable-gpu-rasterization "
                "--disable-accelerated-2d-canvas "
                "--disable-features=CalculateNativeWinOcclusion,UseGpuInRasterization "
                "--disable-direct-composition --disable-d3d11 --use-angle=swiftshader")
        why = "a previous run ended without finishing, so software rendering is forced"
    else:
        args = "--disable-gpu-compositing --disable-features=CalculateNativeWinOcclusion"
        why = "the usual safe setting"
    existing = os.environ.get("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "").strip()
    if existing:
        args = existing + " " + args
    os.environ["WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS"] = args
    log_problem("graphics: %s -> %s" % (why, args))
    return args


class CarpeApiSingle:
    """The API offered when CARPE_DIEM_NATIVE_WINDOWS=0: no second native window.

    Why: a second web view in the same process is what killed the Intel machine
    the moment a studio was opened. The page asks Python for a native window only
    because open_app exists here; with it absent the app uses ITS OWN floating
    window instead, which it draws inside the page. Those windows are no longer a
    poor relation: they resize from every edge, remember their size and place,
    fold into the dock and answer the desk tabs. Nothing is lost except the crash.

    From build 1059 native room windows are on by default (CarpeApi), opened
    from the ↗ key of a floating window; a run that follows a bad ending while
    one was open offers none. CARPE_DIEM_NATIVE_WINDOWS=0 chooses this API.
    """

    def __init__(self, app_url):
        self._app_url = app_url
        self.main_window = None


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

    # Backward compatible names kept for older builds of the app HTML.
    def carry_state(self):
        """Build 1050: whether the work kept at the old address still has to come across (asked by the page)."""
        return carry_state()

    def carry_done(self, note=""):
        """Build 1050: the page has the work at Carpe Diem's own address."""
        return carry_done(note)

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

def _make_window(webview, api, app_url):
    """The main window, in one place so its creation can be guarded.

    It is handed a proper file:// URI, not a bare path. Every studio window
    already used one; this window did not, and on Windows a bare path like
    C:\\Users\\...\\carpe_diem.html is turned into file://C:\\Users..., which is
    not a valid URL. Edge WebView2 fails that navigation inside the backend,
    before any Python error can be raised, which is why the window died with
    nothing written down.
    """
    _guard_local_server()
    return webview.create_window(
        WINDOW_TITLE,
        url=app_url,
        width=DEFAULT_WIDTH,
        height=DEFAULT_HEIGHT,
        min_size=(MIN_WIDTH, MIN_HEIGHT),
        background_color=ACCENT_BLUE,
        confirm_close=False,
        text_select=True,
        js_api=api,
    )


# ---------------------------------------------------------------------------
# Build 1050, at the owner's word: Carpe Diem's own address.
# pywebview serves the page at 127.0.0.1 on port 42001 unless it is told
# otherwise, and The Forge, Inkwell and Ingenium are built the same way.
# Whichever app opened first answered for all of them, so Carpe Diem could show
# another app's "Error: 404 Not Found", or an older Carpe Diem's page. From
# build 1050 Carpe Diem opens at 127.0.0.1:42049, its own address.
# A browser keeps a page's work under its address. So the first time, the
# window goes for a few seconds to the old address, where the small page below
# reads the work kept there as the main page and hands it, piece by piece, to
# the helper here; back at the new address the page's first script
# (carry_in.js) takes each piece and writes it. Nothing leaves the device and
# nothing is removed at the old address. The old address is held only while
# that is needed, and every piece is kept in a folder of the app's own that is
# removed once the work is across.
# ---------------------------------------------------------------------------
CARPE_PORT = 42049
OLD_PORT = 42001
CARRY_PAGE = r'''<!doctype html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Carpe Diem: bringing your work across</title>
</head><body style="margin:0;background:#E9ECEF">
<div id="cd-carry-card" role="status" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;font:16px/1.5 -apple-system,'Segoe UI',system-ui,sans-serif;color:#121619">
<div style="max-width:520px;margin:24px;padding:26px 28px;background:#fff;border:1px solid rgba(10,30,46,.16);border-radius:14px;box-shadow:0 18px 40px -18px rgba(16,42,58,.35)">
<div id="cd-carry-t" style="font:700 20px/1.3 Georgia,serif;color:#17577A;margin-bottom:10px"></div>
<div id="cd-carry-m"></div>
<div id="cd-carry-p" style="margin-top:8px;font-size:14px;color:#4A5560"></div>
<button id="cd-carry-b" type="button" style="display:none;margin-top:18px;padding:9px 18px;border-radius:10px;border:1px solid #17577A;background:#17577A;color:#fff;font:600 15px system-ui,sans-serif;cursor:pointer"></button>
</div></div>
<script>
/* Build 1050. Served by the Carpe Diem desktop app at its old address (127.0.0.1:42001), as the main page of its
   own window, for a few seconds and once. As the main page here it sees exactly what Carpe Diem kept at this
   address (an engine may keep a page shown inside another page apart, so it is not shown that way). It reads that
   work (the local storage, every database one record at a time, the stored files one by one) and hands each piece
   to the app's own helper on this device, then goes back to Carpe Diem's own address, where the page takes it.
   Nothing leaves the device, and nothing is removed here. */
(function () {
  'use strict';
  var KEY = '__CD_CARRY_TOKEN__', NEW = 'http://127.0.0.1:42049';
  var fr = /^fr/i.test(navigator.language || '');
  var T = fr ? {
    title: 'Carpe Diem apporte votre travail', busy: 'Votre travail est lu à l’ancienne adresse de Carpe Diem, puis Carpe Diem s’ouvre à sa propre adresse. Rien ne quitte l’appareil.',
    read: 'Lu : ', keys: ' réglages et textes', recs: ' fiches', files: ' fichiers',
    fail: 'Votre travail n’a pas pu être lu ici. Rien n’a été effacé. Appuyez sur le bouton pour revenir à Carpe Diem, qui vous proposera de réessayer.', back: 'Revenir à Carpe Diem'
  } : {
    title: 'Carpe Diem is bringing your work across', busy: 'Your work is being read at Carpe Diem’s old address; then Carpe Diem opens at its own. Nothing leaves the device.',
    read: 'Read so far: ', keys: ' settings and texts', recs: ' records', files: ' files',
    fail: 'Your work could not be read here. Nothing was removed. Press the button to go back to Carpe Diem, which will offer to try again.', back: 'Back to Carpe Diem'
  };
  var $ = function (id) { return document.getElementById(id); };
  $('cd-carry-t').textContent = T.title; $('cd-carry-m').textContent = T.busy; $('cd-carry-b').textContent = T.back;
  var back = NEW + '/carpe_diem.html';
  try { var q = new URLSearchParams(location.search).get('back'); if (q && q.indexOf(NEW + '/') === 0) back = q; } catch (e) {}
  $('cd-carry-b').onclick = function () { location.replace(back); };
  var count = { keys: 0, recs: 0, files: 0 };
  function progress() { $('cd-carry-p').textContent = T.read + count.keys + T.keys + ', ' + count.recs + T.recs + ', ' + count.files + T.files; }
  var stopped = false;
  function failed() { if (stopped) return; stopped = true; $('cd-carry-m').textContent = T.fail; $('cd-carry-b').style.display = 'inline-block'; try { $('cd-carry-b').focus(); } catch (e) {} }

  function post(path, extra, body) {
    return fetch(path + '?t=' + KEY + (extra || ''), { method: 'POST', body: body || '' }).then(function (r) { if (!r.ok) throw new Error(path + ' ' + r.status); });
  }
  var next = 0;
  /* a value as plain JSON: binary parts (Blob, File, ArrayBuffer, typed arrays) are numbered and sent on their own */
  function enc(v, bins, path) {
    var t = typeof v;
    if (v === null || t === 'string' || t === 'boolean') return v;
    if (t === 'number') return (isFinite(v) && !Object.is(v, -0)) ? v : { $: 'n', v: Object.is(v, -0) ? '-0' : String(v) };
    if (t === 'undefined') return { $: 'u' };
    if (t === 'bigint') return { $: 'i', v: String(v) };
    if (t !== 'object') return { $: 'u' };
    if (path.indexOf(v) >= 0) throw new Error('a value refers to itself');
    if (v instanceof Date) return { $: 'd', v: v.getTime() };
    if (v instanceof RegExp) return { $: 'r', s: v.source, f: v.flags };
    if (typeof Blob !== 'undefined' && v instanceof Blob) {
      var o = { $: 'b', n: ++next, t: v.type }; bins.push([o.n, v]);
      if (typeof File !== 'undefined' && v instanceof File) { o.f = v.name; o.m = v.lastModified; }
      return o;
    }
    if (v instanceof ArrayBuffer) { var a = { $: 'ab', n: ++next }; bins.push([a.n, new Blob([v])]); return a; }
    if (ArrayBuffer.isView(v)) { var w = { $: 'tv', k: Object.prototype.toString.call(v).slice(8, -1), n: ++next }; bins.push([w.n, new Blob([new Uint8Array(v.buffer, v.byteOffset, v.byteLength)])]); return w; }
    if (v instanceof Boolean || v instanceof Number || v instanceof String) return { $: 'w', v: enc(v.valueOf(), bins, path) };
    path.push(v);
    var out;
    try {
      if (Array.isArray(v)) { var arr = []; for (var i = 0; i < v.length; i++) arr.push(i in v ? enc(v[i], bins, path) : { $: 'h' }); out = { $: 'a', v: arr }; }
      else if (v instanceof Map) { var mp = []; v.forEach(function (x, k) { mp.push([enc(k, bins, path), enc(x, bins, path)]); }); out = { $: 'm', v: mp }; }
      else if (v instanceof Set) { var st = []; v.forEach(function (x) { st.push(enc(x, bins, path)); }); out = { $: 's', v: st }; }
      else if (v instanceof Error) out = { $: 'e', name: v.name, message: v.message };
      else { var ob = {}; Object.keys(v).forEach(function (k) { ob[k] = enc(v[k], bins, path); }); out = { $: 'o', v: ob }; }
    } finally { path.pop(); }
    return out;
  }
  function sendBins(bins) {
    return bins.reduce(function (p, b) { return p.then(function () { return post('/cd-carry-put', '&n=' + b[0], b[1]); }); }, Promise.resolve());
  }
  function req(r) { return new Promise(function (res, rej) { r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); }
  function openOld(name) {
    return new Promise(function (res, rej) {
      var r, made = false;
      try { r = indexedDB.open(name); } catch (e) { rej(e); return; }
      /* a database that is not here is never made here */
      r.onupgradeneeded = function () { made = true; try { r.transaction.abort(); } catch (e) {} };
      r.onerror = function () { made ? res(null) : rej(r.error); };
      r.onsuccess = function () { res(r.result); };
    });
  }
  /* one database, one store, a few records at a time: read, then hand over, so even large files never pile up */
  function readDb(name) {
    return openOld(name).then(function (db) {
      if (!db) return null;
      var rec = { name: db.name, version: db.version, stores: [] }, names = [].slice.call(db.objectStoreNames);
      return names.reduce(function (p, sn) {
        return p.then(function () {
          var tx = db.transaction(sn, 'readonly'), os = tx.objectStore(sn);
          var s = { name: sn, keyPath: os.keyPath, autoIncrement: os.autoIncrement, indexes: [], recs: [] };
          [].slice.call(os.indexNames).forEach(function (ix) { var I = os.index(ix); s.indexes.push({ name: ix, keyPath: I.keyPath, unique: I.unique, multiEntry: I.multiEntry }); });
          rec.stores.push(s);
          return req(os.getAllKeys()).then(function (keys) {
            var i = 0;
            function batch() {
              if (i >= keys.length) return Promise.resolve();
              var part = keys.slice(i, i + 25); i += 25;
              var t2 = db.transaction(sn, 'readonly'), o2 = t2.objectStore(sn);
              return Promise.all(part.map(function (k) { return req(o2.get(k)); })).then(function (vals) {
                var bins = [];
                part.forEach(function (k, j) { s.recs.push([s.keyPath == null ? enc(k, bins, []) : null, enc(vals[j], bins, [])]); });
                count.recs += part.length; progress();
                return sendBins(bins);
              }).then(batch);
            }
            return batch();
          });
        });
      }, Promise.resolve()).then(function () { db.close(); return rec; }, function (e) { try { db.close(); } catch (x) {} throw e; });
    });
  }
  function dbNames() {
    /* the databases this page kept; where the engine cannot list them, the ones Carpe Diem is known to use */
    var known = ['cd-forge-host', 'cd_writer_store'];
    if (!window.indexedDB) return Promise.resolve([]);
    if (!indexedDB.databases) return Promise.resolve(known);
    return indexedDB.databases().then(function (l) { return l.map(function (d) { return d && d.name; }).filter(Boolean); }, function () { return known; });
  }
  function readCaches(skipped) {
    if (!window.caches || !caches.keys) return Promise.resolve([]);
    var out = [];
    return caches.keys().then(function (names) {
      return names.reduce(function (p, name) {
        return p.then(function () {
          var rec = { name: name, items: [] }; out.push(rec);
          return caches.open(name).then(function (c) {
            return c.keys().then(function (reqs) {
              return reqs.reduce(function (q, rq) {
                return q.then(function () {
                  return c.match(rq).then(function (resp) {
                    /* a file the page could never read (fetched from elsewhere without leave) cannot be copied; it comes again when needed */
                    if (!resp || resp.type === 'opaque' || resp.status === 0) { skipped.push(rq.url); return; }
                    var h = []; resp.headers.forEach(function (v, k) { h.push([k, v]); });
                    return resp.blob().then(function (b) {
                      var n = ++next;
                      return post('/cd-carry-put', '&n=' + n, b).then(function () {
                        rec.items.push({ url: rq.url, status: resp.status, statusText: resp.statusText, headers: h, n: n });
                        count.files++; progress();
                      });
                    });
                  });
                });
              }, Promise.resolve());
            });
          });
        });
      }, Promise.resolve());
    }).then(function () { return out; });
  }
  setTimeout(failed, 900000);
  var m = { v: 1, key: KEY, ls: {}, dbs: [], caches: [], skipped: [] };
  progress();
  post('/cd-carry-begin').then(function () {
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); m.ls[k] = localStorage.getItem(k); }
    count.keys = Object.keys(m.ls).length; progress();
    return dbNames();
  }).then(function (names) {
    return names.reduce(function (p, n) { return p.then(function () { return readDb(n).then(function (d) { if (d) m.dbs.push(d); }); }); }, Promise.resolve());
  }).then(function () { return readCaches(m.skipped); }).then(function (cs) {
    m.caches = cs;
    return post('/cd-carry-put', '&n=0', new Blob([JSON.stringify(m)], { type: 'application/json' }));
  }).then(function () { return post('/cd-carry-seal'); }).then(function () {
    if (!stopped) { stopped = true; location.replace(back); }
  })['catch'](function () { failed(); });
})();
</script>
</body></html>
'''


_CARRY = {"done": False, "dir": None}


def _carry_marker():
    import os
    try:
        d = storage_dir()
        return os.path.join(os.path.dirname(d), "carried_from_42001") if d else None
    except Exception:
        return None


def carry_state():
    """For the page: whether the work kept at the old address still has to come across."""
    import os
    marker = _carry_marker()
    return {"needed": bool(marker) and not os.path.exists(marker)}


def carry_done(note=""):
    """For the page: the work is across. The note is kept beside the app's storage, and the old address is let go."""
    marker = _carry_marker()
    if marker:
        try:
            with open(marker, "w", encoding="utf-8") as fh:
                fh.write("The work kept at 127.0.0.1:42001 was brought to 127.0.0.1:42049.\n%s\n" % str(note)[:2000])
        except Exception:
            log_problem("carry: the marker could not be written")
    _CARRY["done"] = True
    return True


def start_carry_server():
    """Serve the carrying page at the old address until the work has come across.

    It waits for the old address if another app holds it (up to half an hour),
    stops as soon as the work is across, and gives the address back after five
    minutes without a request, so it never keeps other apps out. Only the page
    it serves knows the one-time key that hands pieces in; only the page at the
    app's own address may read them back.
    """
    import json
    import os
    import secrets
    import shutil
    import socket
    import socketserver
    import tempfile
    import threading
    import time
    import http.server
    from urllib.parse import parse_qs, urlsplit
    marker = _carry_marker()
    if not marker or os.path.exists(marker):
        return
    parent = os.path.dirname(marker)
    # pieces left by a carry that was cut short (the app closed half way) are cleared first
    try:
        for name in os.listdir(parent):
            if name.startswith("carry-") and os.path.isdir(os.path.join(parent, name)):
                shutil.rmtree(os.path.join(parent, name), ignore_errors=True)
    except Exception:
        pass
    key = secrets.token_hex(16)
    page = CARRY_PAGE.replace("__CD_CARRY_TOKEN__", key).encode("utf-8")
    new_origin = "http://127.0.0.1:%d" % CARPE_PORT
    state = {"sealed": False, "last": time.time(), "have": set()}
    lock = threading.Lock()

    def clear():
        d, _CARRY["dir"] = _CARRY["dir"], None
        state["have"] = set()
        state["sealed"] = False
        if d:
            shutil.rmtree(d, ignore_errors=True)

    def folder():
        if _CARRY["dir"] is None:
            _CARRY["dir"] = tempfile.mkdtemp(prefix="carry-", dir=parent)
        return _CARRY["dir"]

    class Handler(http.server.BaseHTTPRequestHandler):
        def _reply(self, code, data=b"", ctype=None, open_to_new=False):
            self.send_response(code)
            if open_to_new:
                self.send_header("Access-Control-Allow-Origin", new_origin)
            self.send_header("Cache-Control", "no-store")
            if ctype:
                self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            if data:
                self.wfile.write(data)

        def _ask(self):
            u = urlsplit(self.path)
            q = parse_qs(u.query)
            return u.path, (lambda k: (q.get(k) or [""])[0])

        def do_GET(self):
            state["last"] = time.time()
            path, arg = self._ask()
            if path == "/cd-carry-ping":
                self._reply(200, json.dumps({"carpe": "carry", "sealed": state["sealed"]}).encode("utf-8"),
                            "application/json", True)
            elif path == "/cd-carry.html":
                self._reply(200, page, "text/html; charset=utf-8")
            elif path == "/cd-carry-get":
                try:
                    n = int(arg("n"))
                except ValueError:
                    n = -1
                with lock:
                    ready = state["sealed"] and n in state["have"] and _CARRY["dir"]
                    fn = os.path.join(_CARRY["dir"], str(n)) if ready else None
                if not fn or not os.path.isfile(fn):
                    self._reply(404, open_to_new=True)
                    return
                size = os.path.getsize(fn)
                self.send_response(200)
                self.send_header("Access-Control-Allow-Origin", new_origin)
                self.send_header("Cache-Control", "no-store")
                self.send_header("Content-Type", "application/octet-stream")
                self.send_header("Content-Length", str(size))
                self.end_headers()
                with open(fn, "rb") as fh:
                    shutil.copyfileobj(fh, self.wfile, 1 << 20)
                state["last"] = time.time()
            elif path == "/cd-carry-done":
                # the page at the new address has the work (when the program's own bridge was not there to say so)
                if arg("t") != key:
                    self._reply(403, open_to_new=True)
                    return
                carry_done("told at the old address")
                self._reply(200, b"ok", "text/plain", True)
            else:
                self._reply(404)

        def do_POST(self):
            state["last"] = time.time()
            path, arg = self._ask()
            if arg("t") != key:
                self._reply(403)
                return
            if path == "/cd-carry-begin":
                with lock:
                    clear()
                self._reply(200, b"ok", "text/plain")
            elif path == "/cd-carry-put":
                try:
                    n = int(arg("n"))
                    left = int(self.headers.get("Content-Length") or 0)
                except ValueError:
                    self._reply(400)
                    return
                if n < 0 or left < 0:
                    self._reply(400)
                    return
                with lock:
                    d = folder()
                with open(os.path.join(d, str(n)), "wb") as fh:
                    while left > 0:
                        chunk = self.rfile.read(min(left, 1 << 20))
                        if not chunk:
                            break
                        fh.write(chunk)
                        left -= len(chunk)
                        state["last"] = time.time()
                if left:
                    self._reply(400)
                    return
                with lock:
                    state["have"].add(n)
                self._reply(200, b"ok", "text/plain")
            elif path == "/cd-carry-seal":
                with lock:
                    state["sealed"] = 0 in state["have"]
                self._reply(200 if state["sealed"] else 409, b"ok", "text/plain")
            else:
                self._reply(404)

        def log_message(self, *args):
            pass

    class Server(socketserver.ThreadingMixIn, socketserver.TCPServer):
        daemon_threads = True
        # on a Mac (and Linux) the address can be taken again at once after an app has let it go, but never
        # while another app listens there; on Windows that same setting would let it be taken from a running
        # app, so there the address is held exclusively instead
        allow_reuse_address = (os.name != "nt")

        def server_bind(self):
            if hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
                self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
            socketserver.TCPServer.server_bind(self)

    def run():
        give_up = time.time() + 1800
        srv = None
        while srv is None and time.time() < give_up and not _CARRY["done"]:
            try:
                srv = Server(("127.0.0.1", OLD_PORT), Handler)
            except OSError:
                time.sleep(2)
        if srv is None:
            if not _CARRY["done"]:
                log_problem("carry: the old address stayed busy; the work waits there")
            return
        state["last"] = time.time()
        threading.Thread(target=srv.serve_forever, kwargs={"poll_interval": 0.5}, daemon=True).start()
        while not _CARRY["done"] and time.time() < give_up and time.time() - state["last"] < 300:
            time.sleep(0.5)
        try:
            srv.shutdown()
            srv.server_close()
        except Exception:
            pass
        with lock:
            clear()

    try:
        threading.Thread(target=run, daemon=True).start()
    except Exception:
        log_problem("carry: could not start", sys.exc_info())



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


def _own_taskbar_identity():
    """Carpe Diem's own AppUserModelID, set before any window, so its taskbar button and its pins are its own and match
    the installer's Start menu shortcut, even when it runs from the kit's script as python.exe."""
    if not sys.platform.startswith("win"):
        return
    try:
        import ctypes
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(APP_USER_MODEL_ID)
    except Exception:
        log_problem("taskbar identity: not set")


def _room_asked():
    """The room a shortcut asked for (--room tabula, abacus, slides, scriba or fontes), or None."""
    args = sys.argv[1:]
    for i, a in enumerate(args):
        w = None
        if a.lower() in ("--room", "/room") and i + 1 < len(args):
            w = args[i + 1]
        elif a.lower().startswith("--room="):
            w = a.split("=", 1)[1]
        if w is not None:
            w = w.strip().lower()
            w = {"imago": "slides"}.get(w, w)
            return w if w in ROOMS else None
    return None


def _room_request_path():
    """%LOCALAPPDATA%\\CarpeDiem\\open-room.txt: where a second start leaves the room it was asked for."""
    d = storage_dir() or os.path.join(os.path.expanduser("~"), "CarpeDiem", "storage")
    return os.path.join(os.path.dirname(d), "open-room.txt")


def _another_copy_is_open(room=None):
    """True when Carpe Diem is already open in this sign-in: its window is brought forward (and the room a shortcut asked
    for is handed to it), and this copy ends at once, without touching the session mark. A second copy would read the
    session mark as a run that never finished, and two copies would compete for the same address and work.

    A named mutex (Microsoft, CreateMutexW): the first copy keeps its handle for its whole life, and the system closes it
    when the process ends, so a crash never leaves the name behind. Anything that goes wrong here starts the app as usual."""
    if not sys.platform.startswith("win"):
        return False
    try:
        import ctypes
        from ctypes import wintypes
        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        kernel32.CreateMutexW.argtypes = (ctypes.c_void_p, wintypes.BOOL, wintypes.LPCWSTR)
        kernel32.CreateMutexW.restype = wintypes.HANDLE
        handle = kernel32.CreateMutexW(None, False, SINGLE_INSTANCE_NAME)
        err = ctypes.get_last_error()
        if not handle:
            return False
        if err != 183:   # ERROR_ALREADY_EXISTS
            _single_instance.append(handle)
            return False
        try:
            kernel32.CloseHandle.argtypes = (wintypes.HANDLE,)
            kernel32.CloseHandle(handle)
        except Exception:
            pass
    except Exception:
        log_problem("single copy: no guard on this PC; opening as usual")
        return False
    if _open_copy_is_another_build() and _close_the_open_copy(kernel32):
        return False
    if room:
        try:
            with open(_room_request_path(), "w", encoding="utf-8") as fh:
                fh.write(room)
        except Exception:
            log_problem("room %s: the request could not be left for the open copy" % room)
    try:
        if not _bring_window_forward():
            tell_user("Carpe Diem is still opening.\n\nIts window will appear in a moment.")
    except Exception:
        log_problem("already open; its window could not be brought forward")
    return True


_single_instance = []


def _open_copy_is_another_build():
    """Build 1065: whether the open copy is another build than this one. The build last started is noted when it
    starts (page_build.txt, before this copy notes its own), so a newer portable Carpe Diem started while an older one
    is open sees the older one's build there."""
    try:
        mine = (_page_build(find_app_html() or "").split(" ") or [""])[0]
        store = storage_dir()
        with open(os.path.join(os.path.dirname(store), "page_build.txt"), encoding="utf-8") as fh:
            theirs = (fh.read().strip().split(" ") or [""])[0]
        return bool(mine and theirs and mine != theirs)
    except Exception:
        return False


def _close_the_open_copy(kernel32, wait_s=25.0):
    """Build 1065: the open copy is another build, so bringing it forward would show that build. Each of its windows is
    asked to close, its rooms first, as their close buttons ask (the page keeps its work as it closes), and this copy
    takes its place once it has gone. True when this copy now holds the single-copy name; one that will not close is
    brought forward instead."""
    import ctypes
    import time
    from ctypes import wintypes
    wins = _open_copy_windows()
    if not wins:
        return False
    log_note("another build of Carpe Diem is open (%s): it is asked to close, and this build takes its place"
             % ", ".join(repr(t) for (_h, t, _p) in wins))
    user32 = ctypes.WinDLL("user32", use_last_error=True)
    user32.PostMessageW.argtypes = (wintypes.HWND, wintypes.UINT, wintypes.WPARAM, wintypes.LPARAM)
    for hwnd, _t, _p in reversed(wins):
        user32.PostMessageW(hwnd, 0x0010, 0, 0)   # WM_CLOSE
        time.sleep(0.3)
    end = time.monotonic() + wait_s
    while time.monotonic() < end:
        time.sleep(0.25)
        handle = kernel32.CreateMutexW(None, False, SINGLE_INSTANCE_NAME)
        err = ctypes.get_last_error()
        if handle and err != 183:
            _single_instance.append(handle)
            log_note("the other build has closed; this one opens")
            return True
        if handle:
            kernel32.CloseHandle(handle)
    log_note("the other build did not close; it is brought forward instead")
    return False


def _open_copy_windows():
    """The windows of another running Carpe Diem (a process whose program is Carpe Diem.exe, never this one): pywebview's
    WindowsForms windows that are shown, and its message boxes, the main window first. Found by their program, not by
    their title, which the page and the rooms change."""
    import ctypes
    from ctypes import wintypes
    user32 = ctypes.WinDLL("user32", use_last_error=True)
    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel32.OpenProcess.argtypes = (wintypes.DWORD, wintypes.BOOL, wintypes.DWORD)
    kernel32.OpenProcess.restype = wintypes.HANDLE
    kernel32.QueryFullProcessImageNameW.argtypes = (wintypes.HANDLE, wintypes.DWORD, wintypes.LPWSTR, ctypes.POINTER(wintypes.DWORD))
    kernel32.CloseHandle.argtypes = (wintypes.HANDLE,)
    user32.GetWindowThreadProcessId.argtypes = (wintypes.HWND, ctypes.POINTER(wintypes.DWORD))
    user32.GetClassNameW.argtypes = (wintypes.HWND, wintypes.LPWSTR, ctypes.c_int)
    user32.GetWindowTextW.argtypes = (wintypes.HWND, wintypes.LPWSTR, ctypes.c_int)
    user32.IsWindowVisible.argtypes = (wintypes.HWND,)
    me, names, found = os.getpid(), {}, []

    def program(pid):
        if pid not in names:
            name = ""
            h = kernel32.OpenProcess(0x1000, False, pid)   # PROCESS_QUERY_LIMITED_INFORMATION
            if h:
                buf, n = ctypes.create_unicode_buffer(1024), wintypes.DWORD(1024)
                if kernel32.QueryFullProcessImageNameW(h, 0, buf, ctypes.byref(n)):
                    name = os.path.basename(buf.value).lower()
                kernel32.CloseHandle(h)
            names[pid] = name
        return names[pid]

    proc = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)

    def each(hwnd, _l):
        try:
            pid = wintypes.DWORD()
            user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
            if pid.value and pid.value != me and program(pid.value) == "carpe diem.exe":
                cls = ctypes.create_unicode_buffer(256)
                user32.GetClassNameW(hwnd, cls, 256)
                if (cls.value.startswith("WindowsForms") and user32.IsWindowVisible(hwnd)) or cls.value == "#32770":
                    title = ctypes.create_unicode_buffer(512)
                    user32.GetWindowTextW(hwnd, title, 512)
                    found.append((hwnd, title.value, pid.value))
        except Exception:
            pass
        return True
    cb = proc(each)
    user32.EnumWindows.argtypes = (proc, wintypes.LPARAM)
    user32.EnumWindows(cb, 0)
    found.sort(key=lambda w: 0 if w[1].startswith(WINDOW_TITLE) else 1)
    return found


def _open_copy_window(user32=None):
    """The open copy's main window (or, failing that, one of its windows), or None."""
    try:
        wins = _open_copy_windows()
    except Exception:
        return None
    return wins[0][0] if wins else None


def _bring_window_forward(wait_s=30.0):
    """Find the open copy's window and bring it forward: restored if minimised, otherwise shown as it is."""
    import ctypes
    import time
    from ctypes import wintypes
    user32 = ctypes.WinDLL("user32", use_last_error=True)
    user32.IsIconic.argtypes = (wintypes.HWND,)
    user32.ShowWindow.argtypes = (wintypes.HWND, ctypes.c_int)
    user32.SetForegroundWindow.argtypes = (wintypes.HWND,)

    def find():
        return _open_copy_window(user32)

    end = time.monotonic() + wait_s
    hwnd = find()
    while not hwnd and time.monotonic() < end:
        time.sleep(0.25)
        hwnd = find()
    if not hwnd:
        return False
    user32.ShowWindow(hwnd, 9 if user32.IsIconic(hwnd) else 5)   # SW_RESTORE or SW_SHOW
    user32.SetForegroundWindow(hwnd)
    return True


def _rooms_on_request(api, window, first=None):
    """A room asked for by a Start menu shortcut opens in its own window: the one this start was asked for once the
    desk has loaded, and any asked for later by a second start (left in open-room.txt) as it comes."""
    import threading
    import time
    path = _room_request_path()
    try:
        os.remove(path)
    except Exception:
        pass

    def base():
        try:
            u = window.get_current_url() or ""
            return u if u.startswith("http://127.0.0.1:") else None
        except Exception:
            return None

    def open_room(which):
        try:
            ok = api.open_app(which, base())
            log_problem("room %s asked by a shortcut: %s" % (which, "opened" if ok is True else repr(ok)))
        except Exception:
            log_problem("room %s asked by a shortcut could not open" % which, sys.exc_info())

    def run():
        log_note("rooms: listening for a room asked by a shortcut (%s)" % path)
        if first:
            for _ in range(240):
                if base():
                    break
                time.sleep(0.5)
            time.sleep(2.0)
            open_room(first)
        while True:
            time.sleep(0.8)
            try:
                if not os.path.isfile(path):
                    continue
                with open(path, "r", encoding="utf-8") as fh:
                    which = fh.read().strip().lower()
                os.remove(path)
                log_note("rooms: a shortcut asked for %r" % which)
                if which in ROOMS:
                    open_room(which)
            except Exception:
                log_problem("room request: could not be read")
                time.sleep(5)
    threading.Thread(target=run, daemon=True).start()


_CARE = {"attached": False, "reloads": []}


def _care_attach(window):
    """As The Forge 647 does: when the page's own process stops (Edge WebView2 ends a page that ran out of memory, or a
    driver fault), the page is loaded again by itself, up to three times in two minutes; work is saved as it goes."""
    if _CARE["attached"] or not sys.platform.startswith("win"):
        return
    _CARE["attached"] = True
    try:
        import time as _t
        import clr  # noqa: F401  (pythonnet, already loaded by the window)
        from System import Func, Type
        from Microsoft.Web.WebView2.Core import CoreWebView2ProcessFailedKind as K
        form = getattr(window, "native", None)
        wv = getattr(form, "webview", None) if form is not None else None
        if wv is None:
            return

        def failed(_sender, args):
            try:
                if args.ProcessFailedKind == K.RenderProcessExited:
                    now = _t.time()
                    recent = [x for x in _CARE["reloads"] if now - x < 120]
                    if len(recent) >= 3:
                        log_problem("page: its process stopped again after three new starts in two minutes; left as it is")
                        return
                    recent.append(now)
                    _CARE["reloads"] = recent
                    log_problem("page: its process stopped; the page is loaded again")
                    wv.CoreWebView2.Reload()
            except BaseException:
                log_problem("care: a stopped process could not be handled", sys.exc_info())

        def attach():
            core = wv.CoreWebView2
            if core is not None:
                core.ProcessFailed += failed
                _CARE["refs"] = [failed]
            return None
        form.Invoke(Func[Type](attach))
    except BaseException:
        log_problem("care: could not listen to the web view", sys.exc_info())


def main():
    _own_taskbar_identity()
    _room = _room_asked()
    if _another_copy_is_open(_room):
        return
    app_html = find_app_html()
    try:
        if app_html:
            _forget_old_pages(app_html)
    except Exception:
        log_note("page cache: the check failed")
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

    _prior = _begin_session()
    room_check_start(_prior)
    if _prior >= 3:
        # PASS 447: three runs in a row took the process with them, including one
        # with acceleration fully off and software rendering forced. The graphics
        # path on this PC is unsound, so the app opens where it is certain to work.
        # The flag is cleared here, so simply reopening tries the window once more;
        # the message says so rather than claiming the app has given up for good.
        log_problem("three runs in a row ended badly; opening in the browser instead")
        if open_in_browser(app_html):
            _end_session()
            tell_user(
                "Carpe Diem has opened in your browser.\n\n"
                "Its own window closed unexpectedly on this PC more than once, so it\n"
                "is using the browser, where it is certain to work. Everything is the\n"
                "same here, offline, and nothing is sent anywhere.\n\n"
                "Reopening Carpe Diem will try its own window once more automatically.\n"
                "If you would rather always use the browser, keep opening it from\n"
                "carpe_diem.html in this folder, which is the whole app on its own.")
            return
    _prepare_windows_graphics(_prior)
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

    if os.environ.get("CARPE_DIEM_NATIVE_WINDOWS", "").strip() == "0":
        api = CarpeApiSingle(app_url)
        log_problem("windows: one window (CARPE_DIEM_NATIVE_WINDOWS=0), the app draws its own floating windows")
    else:
        api = CarpeApi(app_url)
        if _ROOM.get("off"):
            log_problem("windows: no native window this run, the last run ended badly while one was open")
    try:
        window = _make_window(webview, api, app_url)
    except BaseException:
        # Creating the window can fail on its own, before start() is reached.
        log_problem("create_window failed", sys.exc_info())
        if open_in_browser(app_html):
            tell_user(
                "Carpe Diem could not open a native window on this PC, so it has\n"
                "opened in your browser instead. Everything works the same there.\n\n"
                "The usual cause is a missing Microsoft Edge WebView2 runtime,\n"
                "which can be installed from Microsoft for free.\n\n"
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
    _check_page_build(window, app_html)
    try:
        window.events.loaded += (lambda *a: _care_attach(window))
    except Exception:
        log_problem("care: the page's loading could not be heard")
    if isinstance(api, CarpeApi):
        _rooms_on_request(api, window, _room)

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
        start_carry_server()
    except Exception:
        log_problem("carry: not started", sys.exc_info())
    _store = storage_dir()

    def _try_start(gui, with_storage):
        """One attempt, recorded either way. Returns True if the window ran."""
        kw = {"debug": False}
        if gui is not None:
            kw["gui"] = gui
        if with_storage:
            kw["private_mode"] = False
            kw["http_port"] = CARPE_PORT   # build 1050: Carpe Diem's own address
            if _store:
                kw["storage_path"] = _store
        try:
            log_problem("start attempt: gui=%r storage=%s" % (gui, bool(with_storage and _store)))
            webview.start(**kw)
            return True
        except TypeError:
            # An older pywebview refuses private_mode or storage_path. Recorded
            # rather than passed over, because passing it over silently is how
            # the data loss went unnoticed once before.
            log_problem("webview.start refused private_mode or storage_path")
            return False
        except Exception:
            log_problem("webview.start failed with gui=%r" % (gui,), sys.exc_info())
            return False

    # On Windows the backend is chosen explicitly and in order. Left to itself
    # pywebview can settle on MSHTML, the old Internet Explorer engine, when
    # pythonnet is present but the Edge WebView2 runtime is not. MSHTML cannot
    # run this app at all: it fails somewhere inside the page rather than
    # reporting that it is the wrong engine, which reads as a crash.
    _order = [("edgechromium", True), ("edgechromium", False), (None, True), (None, False)] \
        if sys.platform.startswith("win") else [(None, True), (None, False)]

    _ran = False
    for _gui, _with_storage in _order:
        if _try_start(_gui, _with_storage):
            _ran = True
            _end_session()
            if not _with_storage:
                log_problem("started WITHOUT persistent storage: work may not survive closing")
            break

    if not _ran:
        # No native window could be created at all: a missing WebView2 runtime
        # on Windows is the usual reason. The page still is the application, so
        # it opens in the browser rather than the program dying in silence.
        log_problem("every backend refused to start")
        if open_in_browser(app_html):
            tell_user(
                "Carpe Diem could not open a native window on this PC, so it has\n"
                "opened in your browser instead. Everything works the same there.\n\n"
                "The usual cause is a missing Microsoft Edge WebView2 runtime.\n"
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
