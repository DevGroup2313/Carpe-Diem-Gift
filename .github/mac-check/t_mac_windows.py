# CARPE DIEM  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
# NO LICENCE IS GRANTED. See LICENCE.txt.
"""t_mac_windows.py PROJECT_DIR: the Mac program itself, run from its source on this Mac. Carpe Diem's window opens;
Tabula prints a coloured document through the Mac's own printing, to a file, and the pages are read back (build 1082);
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
sys.argv[0] = os.path.abspath(sys.argv[0])   # pywebview reads the program's folder from it as it is imported
sys.path.insert(0, PROJ)
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


SAMPLE = ('<h1 style="color:#b3261e">Red heading wqw</h1><p>Plain, <span style="color:#1565c0">blue words</span>, '
          '<span style="background-color:#ffeb3b">yellow highlight</span>.</p>'
          '<table style="border-collapse:collapse;width:100%"><tr><th style="background:#1b6b93;color:#fff;border:1px solid #333;padding:6px">Head A</th></tr>'
          '<tr><td style="border:1px solid #333;padding:6px;background:#fff3e0">orange cell</td></tr></table><ol>'
          + "".join("<li>Step %d zqx%dw</li>" % (i, i) for i in range(1, 61)) + "</ol>")


def print_to_pdf(win, path):
    """The Mac's own printing of this window, to a file instead of a printer, with no panel."""
    def go():
        import AppKit
        import Foundation
        from webview.platforms import cocoa
        bv = cocoa.BrowserView.instances[win.uid]
        info = AppKit.NSPrintInfo.sharedPrintInfo().copy()
        info.setJobDisposition_(AppKit.NSPrintSaveJob)
        info.dictionary().setObject_forKey_(Foundation.NSURL.fileURLWithPath_(path), AppKit.NSPrintJobSavingURL)
        make = getattr(bv.webview, "printOperationWithPrintInfo_", None) or bv.webview._printOperationWithPrintInfo_
        op = make(info)
        op.setShowsPrintPanel_(False)
        op.setShowsProgressPanel_(False)
        op.runOperationModalForWindow_delegate_didRunSelector_contextInfo_(bv.window, None, None, None)
        return True
    return A._on_main_thread(go, 30)


def pdf_facts(path):
    def go():
        import AppKit
        import Foundation
        from Quartz import PDFDocument
        doc = PDFDocument.alloc().initWithURL_(Foundation.NSURL.fileURLWithPath_(path))
        text = str(doc.string() or "")
        rep = AppKit.NSPDFImageRep.imageRepWithData_(Foundation.NSData.dataWithContentsOfFile_(path))
        w, h = int(rep.bounds().size.width), int(rep.bounds().size.height)
        bmp = AppKit.NSBitmapImageRep.alloc().initWithBitmapDataPlanes_pixelsWide_pixelsHigh_bitsPerSample_samplesPerPixel_hasAlpha_isPlanar_colorSpaceName_bytesPerRow_bitsPerPixel_(
            None, w, h, 8, 4, True, False, AppKit.NSCalibratedRGBColorSpace, 0, 0)
        ctx = AppKit.NSGraphicsContext.graphicsContextWithBitmapImageRep_(bmp)
        AppKit.NSGraphicsContext.saveGraphicsState()
        AppKit.NSGraphicsContext.setCurrentContext_(ctx)
        AppKit.NSColor.whiteColor().set()
        AppKit.NSRectFill(((0, 0), (w, h)))
        rep.drawInRect_(((0, 0), (w, h)))
        AppKit.NSGraphicsContext.restoreGraphicsState()
        total = coloured = dark = 0
        for y in range(0, h, 4):
            for x in range(0, w, 4):
                c = bmp.colorAtX_y_(x, y)
                r, g, b = c.redComponent(), c.greenComponent(), c.blueComponent()
                total += 1
                coloured += 1 if (max(r, g, b) - min(r, g, b)) > 0.16 else 0
                dark += 1 if (r + g + b) < 0.6 else 0
        return {"pages": int(doc.pageCount()), "size": [w, h], "colour_pct": round(100.0 * coloured / max(1, total), 2),
                "dark_pct": round(100.0 * dark / max(1, total), 2),
                "every_word_once": all(text.count("zqx%dw" % i) == 1 for i in (1, 30, 60)),
                "app_words": any(k in text for k in ("Clipboard", "Carpe Diem", "Documents")), "chars": len(text)}
    return A._on_main_thread(go, 60)


def print_check(win):
    """Build 1082: Tabula's Print in the Mac app. The room hands its clean copy to Carpe Diem's window, which sets it
    in a surface only the printer sees and asks the Mac to print. Here the Mac prints that window to a PDF file."""
    try:
        say("open Tabula:", win.evaluate_js("(function(){try{if(typeof cdCloseDoor==='function')cdCloseDoor();}catch(e){}try{openExt('tabula');return 'asked';}catch(e){return 'openExt failed: '+e.message;}})()"))
        got = None
        for _ in range(40):
            time.sleep(1)
            got = win.evaluate_js("(function(){var f=document.getElementById('frame-tabula');return !!(f&&f.contentWindow&&f.contentWindow.cdPrintDocument&&f.contentDocument&&f.contentDocument.getElementById('editor'));})()")
            if got:
                break
        if not got:
            say("PRINT: Tabula's frame did not come up")
            return False
        js = ("(function(){var f=document.getElementById('frame-tabula'),d=f.contentDocument,ed=d.getElementById('editor');ed.innerHTML=%s;"
              "ed.dispatchEvent(new Event('input',{bubbles:true}));d.documentElement.classList.add('cd-dark');"
              "window.__cdHook=String(window.print).indexOf('browserDelegate')>=0;window.__cdAsked=0;window.print=function(){window.__cdAsked++;};"
              "f.contentWindow.cdPrintDocument();return 'printing';})()") % json.dumps(SAMPLE)
        say("ask Tabula to print:", win.evaluate_js(js))
        time.sleep(4)
        state = win.evaluate_js("JSON.stringify({hook:window.__cdHook,asked:window.__cdAsked,surface:!!document.getElementById('cd-print-surface'),"
                                "items:(function(){var h=document.getElementById('cd-print-surface');return h&&h.shadowRoot?h.shadowRoot.querySelectorAll('li').length:-1;})(),"
                                "frame:!!document.getElementById('frame-tabula').contentDocument.getElementById('cd-print-frame')})")
        say("PRINT page:", state)
        st = json.loads(state or "{}")
        path = os.path.join(tempfile.mkdtemp(prefix="carpe-print-"), "tabula.pdf")
        print_to_pdf(win, path)
        for _ in range(60):
            if os.path.isfile(path) and os.path.getsize(path) > 0:
                break
            time.sleep(0.5)
        if not os.path.isfile(path):
            say("PRINT: the Mac made no file")
            return False
        time.sleep(1.5)
        facts = pdf_facts(path)
        say("PRINT file:", os.path.getsize(path), "bytes", json.dumps(facts))
        ok = bool(st.get("hook") and st.get("asked") == 1 and st.get("surface") and st.get("items") == 60 and not st.get("frame")
                  and facts and facts["pages"] >= 2 and facts["colour_pct"] > 0.5 and facts["dark_pct"] < 20
                  and facts["every_word_once"] and not facts["app_words"])
        say("PRINT", "ok" if ok else "NOT as expected")
        try:
            win.evaluate_js("try{window.cdPrintSurfaceClear&&window.cdPrintSurfaceClear();}catch(e){}")
        except Exception:  # noqa: BLE001
            pass
        return ok
    except Exception as e:  # noqa: BLE001
        say("PRINT: the check itself failed:", repr(e))
        return False


def run(win, api):
    try:
        ok = win.events.loaded.wait(90)
        say("desk loaded:", ok, "url:", getattr(win, "real_url", None))
        ready = False
        for _ in range(90):
            time.sleep(1)
            try:
                ready = bool(win.evaluate_js("typeof openExt==='function'&&typeof state!=='undefined'&&!!document.getElementById('frame-tabula')"))
            except Exception:  # noqa: BLE001
                ready = False
            if ready:
                break
        say("desk page ready:", ready)
        time.sleep(3)
        say("DESK", json.dumps(windows()))
        say("desk page:", page_says(win))
        if not print_check(win):
            RESULT["ok"] = False
            RESULT["notes"].append("Tabula's Print did not make the pages expected")
        for which, mode in (("tabula", "beside"), ("abacus", "own"), ("scriba", "beside"), ("tabula", "own")):
            t0 = time.time()
            try:
                r = api.open_app(which, getattr(win, "real_url", None), mode)
            except Exception as e:  # noqa: BLE001
                r = "raised %r" % (e,)
            say("open_app(%s, %s) -> %r in %.1fs" % (which, mode, r, time.time() - t0))
            time.sleep(4)
            w0 = api._wins.get(which)
            for _ in range(60):
                try:
                    if w0 is not None and w0.evaluate_js("!!window.__cdRoomOnly&&!!document.getElementById('sticky-fab')"):
                        break
                except Exception:  # noqa: BLE001
                    pass
                time.sleep(1)
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
    # as the app's own start does: the helper that answers the page's question about work kept at the old address
    # (without it the page waits for an answer and never opens)
    try:
        A._load_carry()
        A.start_carry_server()
    except Exception as e:  # noqa: BLE001
        say("carry helper:", repr(e))
    threading.Thread(target=run, args=(win, api), daemon=True).start()
    store = tempfile.mkdtemp(prefix="carpe-check-")
    webview.start(gui=None, debug=False, private_mode=False, storage_path=store, http_port=A.CARPE_PORT)


if __name__ == "__main__":
    main()
