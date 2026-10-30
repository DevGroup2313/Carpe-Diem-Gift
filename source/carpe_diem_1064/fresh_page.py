FRESH = r'''
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
'''
