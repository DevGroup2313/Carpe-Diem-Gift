"""1083 · the Mac program (Mac project/carpe_diem_app.py): a room's own window is confirmed on the screen before the
page is told it opened, and the rooms' own apps can be found.

usage: launcher_mac_edits.py "Mac project/carpe_diem_app.py"      (each change is found exactly once, or it stops)

The owner: on the Mac mini (macOS 27) "no window opens" for a room; and the rooms' own apps "are somewhat hidden and
I can't really find them to add them to my desktop or dock".

* open_app answered True as soon as it had asked for the window, and the page then closed its floating window. Should
  the Mac not show the window, the room was gone from the screen. It now waits until the Mac really shows the window
  (visible, on a screen, not in the Dock); one that is not shown is brought out (out of the Dock, out of Carpe Diem's
  tabs, onto the main screen, to the front), and if it still is not shown it is closed and the page is told, so the
  room stays in its floating window. Each step is written in the record ("room window: ...").
* The window's place (a tab beside Carpe Diem, or apart) was set at the window's "shown" event; set after the event
  had passed, it was never applied. It is now applied at once if the window is already shown, and after two seconds
  in any case.
* The safety rule ("the last run ended badly while a room had a window: none this run") counted any bad ending,
  however long after: a Mac switched off at the wall hours later counted. It now counts only an ending within 25
  seconds of a room's window opening. Likewise a start is counted as one that ended badly only if the app ended
  within a minute of its page loading (two of those in a row open the app in the browser instead).
* rooms_to_dock, rooms_to_desktop, rooms_reveal, rooms_state: every room's own app in the Dock (the Dock restarted
  once), an alias of each on the Desktop (the Finder's own kind, which keeps the icon), the folder shown in the
  Finder, and what is where. app_record gives the page the end of the record, the home folder's name left out."""
import sys

EDITS = []


def edit(old, new):
    EDITS.append((old, new))


# 1. the window's place, whether or not its "shown" event has passed
edit('''        if now:
            apart()
            return
        try:
            win.events.shown += apart
        except Exception:
            log_problem("own window: no shown event", sys.exc_info())
''', '''        if now:
            apart()
            return
        _when_shown(win, apart)
''')
edit('''        if now:
            attach()
            return
        try:
            win.events.shown += attach
        except Exception:
            log_problem("tab beside the desk: no shown event", sys.exc_info())
''', '''        if now:
            attach()
            return
        _when_shown(win, attach)
''')

# 2. open_app confirms the window is on the screen
edit('''            if mode == "own":
                self._stand_apart(win)
            else:
                self._tab_beside_desk(win)
            return True
        except Exception:
            log_problem("open_app(%r)" % (which,))
            self._wins.pop(which, None)
            return False
''', '''            if mode == "own":
                self._stand_apart(win)
            else:
                self._tab_beside_desk(win)
            _room_survives(win)
            if self._confirm_shown(win, which, mode):
                return True
            # the Mac did not show it: it is closed, and the page keeps the room in its floating window
            try:
                win.destroy()
            except Exception:
                pass
            self._wins.pop(which, None)
            return {"ok": False, "why": "not shown"}
        except Exception:
            log_problem("open_app(%r)" % (which,))
            self._wins.pop(which, None)
            return False
''')
edit('''    def _place(self, win, mode):
        """A room window already open moves to the place asked: into Carpe Diem's window as a tab, or out of it."""
''', '''    def _native_state(self, win):
        """Build 1083: what the Mac shows of a window, read on the main thread; None until the window exists."""
        def go():
            try:
                w = getattr(win, "native", None)
                if w is None:
                    return None
                fr = w.frame()
                grp = w.tabGroup() if hasattr(w, "tabGroup") else None
                return {"visible": bool(w.isVisible()), "mini": bool(w.isMiniaturized()), "screen": w.screen() is not None,
                        "frame": (int(fr.origin.x), int(fr.origin.y), int(fr.size.width), int(fr.size.height)),
                        "tabs": len(list(grp.windows() or [])) if grp is not None else 0}
            except Exception:
                return None
        try:
            return _on_main_thread(go, 5.0)
        except Exception:
            return None

    def _bring_out(self, win):
        """Build 1083: a room's window the Mac does not show is brought out: out of the Dock, out of Carpe Diem's tabs
        if it is hidden among them, onto the main screen if it is on none, and to the front."""
        def go():
            try:
                import AppKit
                w = getattr(win, "native", None)
                if w is None:
                    return False
                try:
                    if w.isMiniaturized():
                        w.deminiaturize_(None)
                except Exception:
                    pass
                try:
                    grp = w.tabGroup() if hasattr(w, "tabGroup") else None
                    if grp is not None and len(list(grp.windows() or [])) > 1 and not w.isVisible():
                        w.moveTabToNewWindow_(None)
                except Exception:
                    pass
                try:
                    if w.screen() is None:
                        scr = AppKit.NSScreen.mainScreen()
                        if scr is not None:
                            vf, fr = scr.visibleFrame(), w.frame()
                            fr.origin.x = vf.origin.x + max(0.0, (vf.size.width - fr.size.width) / 2.0)
                            fr.origin.y = vf.origin.y + max(0.0, (vf.size.height - fr.size.height) / 2.0)
                            w.setFrame_display_(fr, True)
                except Exception:
                    pass
                w.makeKeyAndOrderFront_(None)
                try:
                    w.orderFrontRegardless()
                except Exception:
                    pass
                AppKit.NSApp.activateIgnoringOtherApps_(True)
                return True
            except Exception:
                log_problem("room window: could not be brought out", sys.exc_info())
                return False
        try:
            return bool(_on_main_thread(go, 5.0))
        except Exception:
            return False

    def _confirm_shown(self, win, which, mode):
        """Build 1083: True once the Mac really shows the room's window (visible, on a screen, not in the Dock). One
        that is not shown after three seconds is brought out; after eight the answer is no. Written in the record."""
        import time
        end = time.time() + 8.0
        st, helped = None, False

        def shown(s):
            return bool(s and s.get("visible") and s.get("screen") and not s.get("mini"))
        while time.time() < end:
            st = self._native_state(win)
            if shown(st):
                break
            if not helped and time.time() > end - 5.0:
                helped = True
                log_note("room window: %s is not on the screen yet (%r); it is brought out" % (which, st))
                self._bring_out(win)
            time.sleep(0.2)
        ok = shown(st)
        log_note("room window: %s %s (%s): %r" % (which, "is shown" if ok else "is NOT shown", mode, st))
        return ok

    def _place(self, win, mode):
        """A room window already open moves to the place asked: into Carpe Diem's window as a tab, or out of it."""
''')

# 3. the helpers, before the rooms' own apps
edit('''ROOM_NAMES = {"tabula": "Tabula", "abacus": "Abacus", "slides": "Imago", "scriba": "Scriba", "fontes": "Fontes"}
ROOM_LINK = "carpediem://room/"
''', '''ROOM_NAMES = {"tabula": "Tabula", "abacus": "Abacus", "slides": "Imago", "scriba": "Scriba", "fontes": "Fontes"}
ROOM_LINK = "carpediem://room/"


def _when_shown(win, fn):
    """Build 1083: fn once the window is shown: at once if it is already, else at its "shown" event, and after two
    seconds in any case, should that event have passed unheard. Once only."""
    import threading
    state = {"done": False}
    lock = threading.Lock()

    def once(*_a):
        with lock:
            if state["done"]:
                return
            state["done"] = True
        try:
            fn()
        except Exception:
            log_problem("room window: its place could not be set", sys.exc_info())
    try:
        if win.events.shown.is_set():
            once()
            return
        win.events.shown += once
    except Exception:
        pass
    try:
        t = threading.Timer(2.0, once)
        t.daemon = True
        t.start()
    except Exception:
        once()


def _room_survives(win, after_s=25.0):
    """Build 1083: a room's window that is still open 25 seconds after it was asked for did not bring the app down, so
    its mark is taken away; only an ending within that time makes the next run offer no window of its own."""
    import threading

    def proved():
        try:
            _ = win.title
            room_clear()
        except Exception:
            pass
    try:
        t = threading.Timer(after_s, proved)
        t.daemon = True
        t.start()
    except Exception:
        pass
''')

# 4. the Dock: one room without a restart of the Dock, then all of them
edit('''def room_to_dock(which):
    """The room's own app, made if need be and kept in the Dock (at the end of its apps), once. Asked by the page's
    "Its own window, on the Dock"."""
    import subprocess
''', '''def room_to_dock(which, restart=True):
    """The room's own app, made if need be and kept in the Dock (at the end of its apps), once. Asked by the page's
    "Its own window, on the Dock"."""
    import subprocess
''')
edit('''        subprocess.run(["/usr/bin/killall", "Dock"], capture_output=True, timeout=30)
        log_note("room: %s put in the Dock (%s)" % (which, app))
        return {"ok": True, "added": True, "app": app}
''', '''        if restart:
            subprocess.run(["/usr/bin/killall", "Dock"], capture_output=True, timeout=30)
        log_note("room: %s put in the Dock (%s)" % (which, app))
        return {"ok": True, "added": True, "app": app}
''')
edit('''def rooms_asked(links, how="its own app"):
''', '''def rooms_to_dock():
    """Build 1083: every room's own app kept in the Dock, the Dock restarted once."""
    import subprocess
    if sys.platform != "darwin":
        return {"ok": False, "why": "not a Mac"}
    added, there, failed = [], [], []
    for which in ROOM_NAMES:
        r = room_to_dock(which, restart=False)
        (added if r.get("added") else there if r.get("ok") else failed).append(ROOM_NAMES[which])
    if added:
        try:
            subprocess.run(["/usr/bin/killall", "Dock"], capture_output=True, timeout=30)
        except Exception:
            log_note("rooms: the Dock could not be restarted")
    log_note("rooms: in the Dock: added %r, there already %r, failed %r" % (added, there, failed))
    return {"ok": not failed, "added": added, "there": there, "failed": failed}


def _finder_alias(app, dest):
    """An alias of the app at dest, of the Finder's own kind (it keeps the app's icon and follows the app if it moves);
    a plain link if the Mac will not make one."""
    try:
        from Foundation import NSURL
        src = NSURL.fileURLWithPath_(app)
        data, err = src.bookmarkDataWithOptions_includingResourceValuesForKeys_relativeToURL_error_(1 << 10, None, None, None)
        if data is not None:
            ok, err = NSURL.writeBookmarkData_toURL_options_error_(data, NSURL.fileURLWithPath_(dest), 0, None)
            if ok:
                return True
        log_note("rooms: no alias for %s (%s)" % (os.path.basename(app), err))
    except Exception:
        log_note("rooms: no alias for %s (%s)" % (os.path.basename(app), sys.exc_info()[1]))
    try:
        os.symlink(app, dest)
        return True
    except Exception:
        return False


def rooms_to_desktop():
    """Build 1083: an alias of each room's own app on the Desktop, under the room's name; one already there is left."""
    if sys.platform != "darwin":
        return {"ok": False, "why": "not a Mac"}
    desk = os.path.join(os.path.expanduser("~"), "Desktop")
    made, there, failed = [], [], []
    for which, name in ROOM_NAMES.items():
        app = _make_room_app(which)
        dest = os.path.join(desk, name)
        if not app or not os.path.isdir(desk):
            failed.append(name)
        elif os.path.lexists(dest):
            there.append(name)
        elif _finder_alias(app, dest):
            made.append(name)
        else:
            failed.append(name)
    log_note("rooms: on the Desktop: made %r, there already %r, failed %r" % (made, there, failed))
    return {"ok": not failed, "made": made, "there": there, "failed": failed}


def rooms_reveal():
    """Build 1083: the folder that holds the rooms' own apps, shown in the Finder."""
    import subprocess
    if sys.platform != "darwin":
        return {"ok": False, "why": "not a Mac"}
    n = make_room_apps()
    try:
        subprocess.Popen(["/usr/bin/open", rooms_dir()])
        return {"ok": True, "made": n}
    except Exception:
        log_note("rooms: the folder could not be shown")
        return {"ok": False, "why": "the Finder did not open it", "made": n}


def rooms_state():
    """Build 1083: which rooms have an app of their own, which are in the Dock, which have an alias on the Desktop."""
    if sys.platform != "darwin":
        return {"mac": False}
    out = {"mac": True, "where": "Applications > Carpe Diem Rooms, in your home folder", "apps": [], "dock": [], "desktop": []}
    try:
        tiles = [((t.get("tile-data") or {}).get("file-data") or {}).get("_CFURLString") for t in _dock_items()]
    except Exception:
        tiles = []
    desk = os.path.join(os.path.expanduser("~"), "Desktop")
    for which, name in ROOM_NAMES.items():
        app = room_app_path(which)
        if os.path.isdir(app):
            out["apps"].append(name)
            if any(_same_app(u, app) for u in tiles):
                out["dock"].append(name)
        if os.path.lexists(os.path.join(desk, name)):
            out["desktop"].append(name)
    return out


def app_record(chars=6000):
    """Build 1083: the end of the app's own record, for the page to show or copy; the home folder's name is left out."""
    try:
        with open(crash_log_path(), encoding="utf-8", errors="replace") as fh:
            text = fh.read()[-int(chars):]
        home = os.path.expanduser("~")
        if home and home != "/":
            text = text.replace(home, "~")
        return text
    except Exception:
        return ""


def rooms_asked(links, how="its own app"):
''')

# 5. the page may ask (the app's window, and the app with one window)
API = '''    def rooms_to_dock(self):
        """Build 1083: every room's own app kept in the Dock."""
        return rooms_to_dock()

    def rooms_to_desktop(self):
        """Build 1083: an alias of each room's own app on the Desktop."""
        return rooms_to_desktop()

    def rooms_reveal(self):
        """Build 1083: the rooms' own apps shown in the Finder."""
        return rooms_reveal()

    def rooms_state(self):
        """Build 1083: which rooms have an app, are in the Dock, are on the Desktop."""
        return rooms_state()

    def app_record(self):
        """Build 1083: the end of the app's own record."""
        return app_record()

'''
edit('''    def open_app(self, which, base=None, mode="beside"):
        """Open (or focus) a separate native window for the app. True on success;
''', API + '''    def open_app(self, which, base=None, mode="beside"):
        """Open (or focus) a separate native window for the app. True on success;
''')
edit('''    def carry_state(self):
        """Build 1050: whether the work kept at the old address still has to come across (asked by the page)."""
        return carry_state()

    def carry_done(self, note=""):
        """Build 1050: the page has the work at Carpe Diem's own address."""
        return carry_done(note)

    def broadcast_theme(self, dark):
        js = "try{window.cdApplyThemeExternal&&window.cdApplyThemeExternal(%s);}catch(e){}" % (
''', '''    def carry_state(self):
        """Build 1050: whether the work kept at the old address still has to come across (asked by the page)."""
        return carry_state()

    def carry_done(self, note=""):
        """Build 1050: the page has the work at Carpe Diem's own address."""
        return carry_done(note)

''' + API + '''    def broadcast_theme(self, dark):
        js = "try{window.cdApplyThemeExternal&&window.cdApplyThemeExternal(%s);}catch(e){}" % (
''')

# 6. the safety rule counts only an ending soon after a room's window opened
edit('''        if p and os.path.isfile(p):
            if prior_bad:
                _ROOM["off"] = True
                log_problem("native windows: the last run ended badly while one was open; off for this run")
            os.remove(p)
''', '''        if p and os.path.isfile(p):
            # build 1083: the mark is taken away 25 seconds after a room's window opens, so one found here means the
            # app ended within that time
            _ROOM["off"] = True
            log_note("native windows: the last run ended within seconds of a room's window opening; off for this run")
            os.remove(p)
''')
edit('''def _end_session():
    """A clean exit removes the breadcrumb, so only bad endings accumulate."""
''', '''def _session_proved(window, after_s=60.0):
    """Build 1083: a start whose page has been up for a minute did not fail as a start, whatever ends it later (a Mac
    switched off at the wall, a forced quit hours on); its breadcrumb is taken away then. Two starts in a row that end
    sooner still open the app in the browser on the third."""
    import threading
    import time

    def run():
        try:
            window.events.loaded.wait()
            time.sleep(after_s)
            f = _session_flag()
            if f is not None and f.exists():
                f.unlink()
        except Exception:
            pass
    threading.Thread(target=run, name="carpe-session-proved", daemon=True).start()


def _end_session():
    """A clean exit removes the breadcrumb, so only bad endings accumulate."""
''')
edit('''    _serve_asked_rooms(api, window)
    _check_page_build(window, app_html)
''', '''    _serve_asked_rooms(api, window)
    _session_proved(window)
    _check_page_build(window, app_html)
''')

# 7. from the command line, for GitHub's check
edit('''    if "--room-to-dock" in args:
        _note_own_bundle()
''', '''    if "--rooms-to-dock" in args or "--rooms-to-desktop" in args:
        _note_own_bundle()
        r = rooms_to_dock() if "--rooms-to-dock" in args else rooms_to_desktop()
        print("rooms: %r" % (r,))
        sys.exit(0 if r.get("ok") else 1)
    if "--room-to-dock" in args:
        _note_own_bundle()
''')


def main(path):
    s = open(path, encoding="utf-8").read()
    for old, new in EDITS:
        if s.count(old) != 1:
            raise SystemExit("found %d times: %r" % (s.count(old), old[:90]))
        s = s.replace(old, new)
    open(path, "w", encoding="utf-8").write(s)
    print("%s: %d changes" % (path, len(EDITS)))


if __name__ == "__main__":
    main(sys.argv[1])
