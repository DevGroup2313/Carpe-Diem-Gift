"""Build 1050: Carpe Diem's helper that brings the work kept at the old address (127.0.0.1:42001) to the app's
own address (127.0.0.1:42049), once. It sits beside the page, carpe_diem.html, and the program reads it into
itself at start (carpe_diem_app.py, _load_carry), so the names it uses (storage_dir, log_problem, sys,
CARPE_PORT, OLD_PORT) are the program's own. Nothing leaves the device, and nothing is removed at the old
address. See carpe_diem_app.py for why the address changed."""

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
