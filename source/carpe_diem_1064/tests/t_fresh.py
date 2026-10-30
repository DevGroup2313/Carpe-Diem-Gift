import ast, os, sys, types, threading, time, urllib.request, tempfile
ok = lambda c, m: print(("PASS " if c else "FAIL ") + m)
import bottle
for label in sys.argv[1:]:
    src = open(label, encoding="utf-8").read()
    tree = ast.parse(src)
    notes = []
    ns = {"os": os, "sys": sys, "log_problem": lambda *a, **k: notes.append(a[0])}
    for n in tree.body:
        if isinstance(n, ast.FunctionDef) and n.name in ("log_note", "_no_store", "_guard_local_server", "_page_build", "_empty_page_cache", "_forget_old_pages", "crash_log_path"):
            exec(compile(ast.Module([n], []), label, "exec"), ns)
    ns["log_note"] = lambda t: notes.append(t)
    # pywebview's server, as its webview/http.py starts it: bottle.run(app=..., server=..., port=...)
    wh = types.ModuleType("webview.http"); wh.bottle = bottle
    sys.modules["webview"] = types.ModuleType("webview"); sys.modules["webview"].http = wh; sys.modules["webview.http"] = wh
    orig_run = bottle.run
    ok(ns["_guard_local_server"]() is True, label + ": the guard is put on the server")
    root = tempfile.mkdtemp(); open(os.path.join(root, "carpe_diem.html"), "w").write('<script>window.CD_BUILD={date:"2026-10-30",pass:"1064",stamp:"528171064"};</script>')
    app = bottle.Bottle()
    @app.route('/<file:path>')
    def asset(file):
        return bottle.static_file(file, root=root)
    port = 42300 + sys.argv.index(label)
    threading.Thread(target=lambda: bottle.run(app=app, server="wsgiref", port=port, quiet=True), daemon=True).start(); time.sleep(1.0)
    h = dict(urllib.request.urlopen("http://127.0.0.1:%d/carpe_diem.html" % port).headers)
    ok(h.get("Cache-Control") == "no-store, max-age=0" and not any(k.lower() in ("etag", "last-modified") for k in h), label + ": the page goes out no-store, with no ETag or Last-Modified: " + str({k: v for k, v in h.items() if k.lower() in ("cache-control", "etag", "last-modified", "pragma", "expires")}))
    req = urllib.request.Request("http://127.0.0.1:%d/carpe_diem.html" % port, headers={"Host": "evil.example:%d" % port})
    try:
        urllib.request.urlopen(req); ok(False, label + ": a page under another name is refused")
    except urllib.error.HTTPError as e:
        ok(e.code == 421, label + ": a page under another name is refused (421)")
    bottle.run = orig_run
    ok(ns["_page_build"](os.path.join(root, "carpe_diem.html")) == "1064 528171064", label + ": the build read from the page")
    # Windows: the cache emptied once per build, the work untouched
    store = tempfile.mkdtemp(); sd = os.path.join(store, "CarpeDiem", "storage")
    for rel in ("EBWebView/Default/Cache/Cache_Data", "EBWebView/Default/Code Cache/js", "EBWebView/Default/Local Storage/leveldb", "EBWebView/Default/IndexedDB/x"):
        os.makedirs(os.path.join(sd, rel)); open(os.path.join(sd, rel, "f"), "w").write("x")
    ns["storage_dir"] = lambda: sd
    real = sys.platform; sys.platform = "win32"
    try:
        ns["_forget_old_pages"](os.path.join(root, "carpe_diem.html"))
        gone = not os.path.exists(os.path.join(sd, "EBWebView/Default/Cache")) and not os.path.exists(os.path.join(sd, "EBWebView/Default/Code Cache"))
        kept = os.path.exists(os.path.join(sd, "EBWebView/Default/Local Storage/leveldb/f")) and os.path.exists(os.path.join(sd, "EBWebView/Default/IndexedDB/x/f"))
        mark = open(os.path.join(store, "CarpeDiem", "page_build.txt")).read()
        ok(gone and kept and mark == "1064 528171064", label + ": a new build empties the page cache once; the work stays; the build is noted")
        os.makedirs(os.path.join(sd, "EBWebView/Default/Cache/again"))
        ns["_forget_old_pages"](os.path.join(root, "carpe_diem.html"))
        ok(os.path.exists(os.path.join(sd, "EBWebView/Default/Cache/again")), label + ": the same build again leaves the cache alone")
        ok(any("build 1064 528171064 starts" in x and "emptied" in x for x in notes), label + ": the record says which build started and that the cache was emptied")
    finally:
        sys.platform = real
