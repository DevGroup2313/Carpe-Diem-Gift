# CARPE DIEM  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
# NO LICENCE IS GRANTED. See LICENCE.txt.
"""t_mac_windows.py PROJECT_DIR: the Mac program itself, run from its source on this Mac. Carpe Diem's window opens,
then rooms are asked for in windows of their own, both ways the page asks ("beside" and "own"), and after each the
windows the Mac really shows are listed: title, visible or not, minimised or not, where on the screen, how many tabs
share its frame, and what the room's page says of itself. Ends by itself. Nothing here is part of the app."""
import json
import os
import pathlib
import sys
import tempfile
import threading
import time

PROJ = os.path.abspath(sys.argv[1])
sys.path.insert(0, PROJ)
os.chdir(PROJ)
import carpe_diem_app as A  # noqa: E402
import webview  # noqa: E402

RESULT = {"ok": True, "notes": []}


def say(*a):
    print(*a, flush=True)


def windows():
    def go():
        import AppKit
        rows = []
        for w in list(AppKit.NSApp.windows() or []):
            try:
                fr = w.frame()
                scr = w.screen()
                tg = w.tabGroup() if hasattr(w, "tabGroup") else None
                rows.append({
                    "title": str(w.title() or ""), "class": str(w.className()),
                    "visible": bool(w.isVisible()), "mini": bool(w.isMiniaturized()), "key": bool(w.isKeyWindow()),
                    "frame": [round(fr.origin.x), round(fr.origin.y), round(fr.size.width), round(fr.size.height)],
                    "screen": (None if scr is None else [round(scr.frame().size.width), round(scr.frame().size.height)]),
                    "tabs": (len(list(tg.windows() or [])) if tg is not None else 0),
                    "tabbing": (int(w.tabbingMode()) if hasattr(w, "tabbingMode") else None),
                    "onActiveSpace": bool(w.isOnActiveSpace()) if hasattr(w, "isOnActiveSpace") else None,
                    "occluded": (not bool(int(w.occlusionState()) & 2)) if hasattr(w, "occlusionState") else None,
                })
            except Exception as e:  # noqa: BLE001
                rows.append({"error": repr(e)})
        return rows
    return A._on_main_thread(go) or []


def page_says(w):
    js = ("JSON.stringify({room:!!window.__cdRoomOnly,hash:location.hash,build:(window.CD_BUILD||{}).pass,"
          "keys:['sticky-fab','horo-fab','cd-theme-fab','cd-thought-fab','cd-quiet-fab','reminders-fab'].map(function(i){var e=document.getElementById(i);return e?(e.getBoundingClientRect().width>0?1:0):-1;}),"
          "api:!!(window.pywebview&&window.pywebview.api&&window.pywebview.api.open_app),platform:(window.pywebview||{}).platform||'',"
          "print:String(window.print).indexOf('browserDelegate')>=0})")
    try:
        return w.evaluate_js(js)
    except Exception as e:  # noqa: BLE001
        return "evaluate_js failed: %r" % (e,)


def run(win, api):
    try:
        ok = win.events.loaded.wait(90)
        say("desk loaded:", ok, "url:", getattr(win, "real_url", None))
        time.sleep(5)
        say("DESK", json.dumps(windows()))
        say("desk page:", page_says(win))
        for which, mode in (("tabula", "beside"), ("abacus", "own"), ("scriba", "beside"), ("tabula", "own")):
            t0 = time.time()
            try:
                r = api.open_app(which, getattr(win, "real_url", None), mode)
            except Exception as e:  # noqa: BLE001
                r = "raised %r" % (e,)
            say("open_app(%s, %s) -> %r in %.1fs" % (which, mode, r, time.time() - t0))
            time.sleep(7)
            rows = windows()
            say("AFTER %s %s" % (which, mode), json.dumps(rows))
            w = api._wins.get(which)
            if w is None:
                say("  no window object for", which)
                RESULT["ok"] = False
                RESULT["notes"].append("%s %s: no window object" % (which, mode))
                continue
            try:
                say("  shown:", w.events.shown.is_set(), "loaded:", w.events.loaded.is_set())
            except Exception as e:  # noqa: BLE001
                say("  events:", repr(e))
            say("  room page:", page_says(w))
            title = A.CarpeApi.APP_TITLES[which]
            mine = [x for x in rows if x.get("title") == title]
            if not mine or not mine[0].get("visible"):
                RESULT["ok"] = False
                RESULT["notes"].append("%s %s: its window is not visible (%r)" % (which, mode, mine))
    except Exception as e:  # noqa: BLE001
        say("the check itself failed:", repr(e))
        RESULT["ok"] = False
    finally:
        try:
            say("--- the app's own record ---")
            say(open(A.crash_log_path(), encoding="utf-8").read()[-6000:])
        except Exception as e:  # noqa: BLE001
            say("(no record: %r)" % (e,))
        say("RESULT", json.dumps(RESULT))
        os._exit(0 if RESULT["ok"] else 1)


def main():
    A.skip_server_name_lookup()
    html = A.find_app_html()
    say("page:", html, "| build", A._page_build(html))
    api = A.CarpeApi(pathlib.Path(html).as_uri())
    win = A._make_window(webview, api, html)
    api.main_window = win
    A._hear_pywebview()
    threading.Thread(target=run, args=(win, api), daemon=True).start()
    store = tempfile.mkdtemp(prefix="carpe-check-")
    webview.start(gui=None, debug=False, private_mode=False, storage_path=store, http_port=A.CARPE_PORT)


if __name__ == "__main__":
    main()
