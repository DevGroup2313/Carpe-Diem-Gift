# -*- coding: utf-8 -*-
"""1086 · a sign-in for Carpe Diem, as Ingenium has it, and everything it keeps on the device sealed.

The owner: "I want for Carpe Diem to be encrypted so that my data and any users' data can be protected on their
device. I also want the option to have a sign-in or login screen and user name and password to log into the app."
And: "I want you to replicate Ingenium's sign-in page and features. I want full parity with Ingenium but customised
specifically for Carpe Diem."

`lock1086_core.js` (the keeper) and `lock1086_door.js` (the door and its sheets) are put first in the page, before
anything that reads the store; the keeper alone is put first in each of the five rooms, which use the window's keys.
The rooms' larger stores are sealed where they are written: Tabula's documents, Scriba's recordings and transcripts,
the desk's copy in the larger store and the backups kept in the browser. A backup is made whole (opened) and sealed by
its own passphrase as before; the sign-in's record never travels in one. The welcome card gains the lock key and the
switch "Open straight to Home from now on"."""
import os, re

HERE = os.path.dirname(os.path.abspath(__file__))
SCRATCH_AES = os.environ.get("CD_AES_PART")


def ascii_js(t):
    """Every letter outside ASCII written as an escape, so the page's encoding, found later in the page, cannot matter."""
    return "".join(c if ord(c) < 128 else ("\\u%04x" % ord(c) if ord(c) < 0x10000 else "".join("\\u%04x" % u for u in _utf16(c))) for c in t)


def _utf16(c):
    v = ord(c) - 0x10000
    return [0xD800 + (v >> 10), 0xDC00 + (v & 0x3FF)]


def icons(page):
    """The seal as the page carries it for its icon, by day and by night (192 pixels)."""
    out = []
    for lid in ("cd-fav-light-192", "cd-fav-dark-192"):
        m = re.search(r'<link id="%s"[^>]*href="(data:image/png;base64,[A-Za-z0-9+/=]+)"' % lid, page)
        if not m:
            raise SystemExit("the page has no %s icon" % lid)
        out.append(m.group(1))
    return out


def parts(page=None):
    aes = open(os.path.join(HERE, "aes_r197.js"), encoding="utf-8").read()
    gcm = open(os.path.join(HERE, "lock1086_gcm.js"), encoding="utf-8").read()
    core = open(os.path.join(HERE, "lock1086_core.js"), encoding="utf-8").read()
    if core.count("/*@AES@*/") != 1:
        raise SystemExit("the keeper has no place for the cipher")
    core = core.replace("/*@AES@*/", aes + "\n" + gcm)
    door = open(os.path.join(HERE, "lock1086_door.js"), encoding="utf-8").read()
    words = open(os.path.join(HERE, "lock1086_words.txt"), encoding="utf-8").read().split()
    if len(words) != 512 or len(set(words)) != 512:
        raise SystemExit("the recovery words are not 512 distinct words")
    if door.count("/*@WORDS@*/") != 1:
        raise SystemExit("the door has no place for the words")
    door = door.replace("/*@WORDS@*/", " ".join(words))
    if page is not None:
        day, night = icons(page)
        if door.count("/*@SEAL_DAY@*/") != 1 or door.count("/*@SEAL_NIGHT@*/") != 1:
            raise SystemExit("the door has no place for the seal")
        door = door.replace("/*@SEAL_DAY@*/", day).replace("/*@SEAL_NIGHT@*/", night)
    css = open(os.path.join(HERE, "lock1086.css"), encoding="utf-8").read()
    return ascii_js(core), ascii_js(door), ascii_js(css)


def once(t, old, new, what):
    if t.count(old) != 1:
        raise SystemExit("%s: expected once, found %d" % (what, t.count(old)))
    return t.replace(old, new)


# ---------- the rooms ----------
TS_PUT = "function put(k,v){return tx('readwrite',function(st){st.put(v,k);});}"
TS_PUT_NEW = ("function put(k,v){var L=window.cdLock;return (L&&L.sealing()?L.sealVal(v,'idb:tabula-big/kv/'+k):Promise.resolve(v))"
              ".then(function(w){return tx('readwrite',function(st){st.put(w,k);});},function(){return false;});}")
TS_GET = "function get(k){return tx('readonly',function(st,out){var r=st.get(k);r.onsuccess=function(){out.v=(r.result===undefined)?null:r.result;};});}"
TS_GET_NEW = ("function get(k){return tx('readonly',function(st,out){var r=st.get(k);r.onsuccess=function(){out.v=(r.result===undefined)?null:r.result;};})"
              ".then(function(v){var L=window.cdLock;return (L&&L.isRecEnv(v))?L.openVal(v,'idb:tabula-big/kv/'+k).then(null,function(){return null;}):v;});}")

SC_ALL = ('function recAll(cb) { sdbOpen(function (db) { if (!db) { cb(memRecs.slice()); return; } try { var tx = db.transaction("recordings", "readonly"); '
          'var rq = tx.objectStore("recordings").getAll(); rq.onsuccess = function () { var L0 = rq.result || []; L0.forEach(function (r) { if (cdFromTx(r)) recPut(r); }); cb(L0); }; '
          'rq.onerror = function () { cb(memRecs.slice()); }; } catch (e) { cb(memRecs.slice()); } }); }')
SC_ALL_NEW = ('var cdOpened = {};\n'
              'function cdOpenRecs(L0) { var L = window.cdLock; if (!L) return Promise.resolve(L0);\n'
              '  return Promise.all(L0.map(function (r) { if (!L.isRecEnv(r)) return r; var c = cdOpened[r.id]; if (c && c.env === r.env) return c.rec;\n'
              '    return L.openVal(r, "idb:scriba_db/recordings/" + r.id).then(function (p) { cdOpened[r.id] = { env: r.env, rec: p }; return p; }, function () { return null; }); }))\n'
              '    .then(function (a) { return a.filter(function (x) { return !!x; }); }); }\n'
              'function recAll(cb) { sdbOpen(function (db) { if (!db) { cb(memRecs.slice()); return; } try { var tx = db.transaction("recordings", "readonly"); '
              'var rq = tx.objectStore("recordings").getAll(); rq.onsuccess = function () { cdOpenRecs(rq.result || []).then(function (L0) { L0.forEach(function (r) { if (cdFromTx(r)) recPut(r); }); cb(L0); }); }; '
              'rq.onerror = function () { cb(memRecs.slice()); }; } catch (e) { cb(memRecs.slice()); } }); }')
SC_PUT = ('function recPut(r, cb) { sdbOpen(function (db) { if (!db) { var f = false; for (var i = 0; i < memRecs.length; i++) { if (memRecs[i].id === r.id) { memRecs[i] = r; f = true; break; } } '
          'if (!f) memRecs.push(r); cb && cb(); return; } try { var tx = db.transaction("recordings", "readwrite"); tx.objectStore("recordings").put(r); '
          'tx.oncomplete = function () { cb && cb(); }; tx.onerror = function () { cb && cb(); }; } catch (e) { cb && cb(); } }); }')
SC_PUT_NEW = ('function recPut(r, cb) { sdbOpen(function (db) { if (!db) { var f = false; for (var i = 0; i < memRecs.length; i++) { if (memRecs[i].id === r.id) { memRecs[i] = r; f = true; break; } } '
              'if (!f) memRecs.push(r); cb && cb(); return; } var L = window.cdLock; (L && L.sealing() ? L.sealVal(r, "idb:scriba_db/recordings/" + r.id, ["id"]) : Promise.resolve(r)).then(function (w) { '
              'try { var tx = db.transaction("recordings", "readwrite"); tx.objectStore("recordings").put(w); if (w !== r) cdOpened[r.id] = { env: w.env, rec: r }; '
              'tx.oncomplete = function () { cb && cb(); }; tx.onerror = function () { cb && cb(); }; } catch (e) { cb && cb(); } }, function () { cb && cb(); }); }); }')


def room(src, name, core):
    if 'id="cd-lock-1086-core"' in src:
        raise SystemExit(name + " has the keeper already")
    src = once(src, "<head>\n", '<head>\n<script id="cd-lock-1086-core">\n' + core + '\n</script>\n', name + " head")
    if name == "TABULA_SRC":
        src = once(src, TS_PUT, TS_PUT_NEW, "Tabula's store, put")
        src = once(src, TS_GET, TS_GET_NEW, "Tabula's store, get")
    if name == "SCRIBA_SRC":
        src = once(src, SC_ALL, SC_ALL_NEW, "Scriba's recordings, all")
        src = once(src, SC_PUT, SC_PUT_NEW, "Scriba's recordings, put")
    return src


# ---------- the page ----------
ROOM_PUT = ("function put(v) { return db().then(function (d) { return new Promise(function (res, rej) { var t = d.transaction(ST, 'readwrite'); t.objectStore(ST).put(v, REC);")
ROOM_PUT_NEW = ("function put(v) { var L = window.cdLock; return (L && L.sealing() ? L.sealVal(v, 'idb:cd-room/d/' + REC) : Promise.resolve(v)).then(function (w) { v = w; return db(); }).then(function (d) { return new Promise(function (res, rej) { var t = d.transaction(ST, 'readwrite'); t.objectStore(ST).put(v, REC);")
ROOM_GET = ("r.onsuccess = function () { res(r.result || null); }; r.onerror = function () { res(null); }; }); })['catch'](function () { return null; }); }")
ROOM_GET_NEW = ("r.onsuccess = function () { res(r.result || null); }; r.onerror = function () { res(null); }; }); }).then(function (v) { var L = window.cdLock; return (L && L.isRecEnv(v)) ? L.openVal(v, 'idb:cd-room/d/' + REC).then(null, function () { return null; }) : v; })['catch'](function () { return null; }); }")
DESK_OLD = ("t.objectStore('d').put(raw ? { lsOk: false, raw: raw, at: Date.now(), n: raw.length } : { lsOk: true, raw: null, at: Date.now() }, 'desk:' + STORAGE_KEY);")
DESK_NEW = ("var __v = raw ? { lsOk: false, raw: raw, at: Date.now(), n: raw.length } : { lsOk: true, raw: null, at: Date.now() }, __L = window.cdLock;"
            " if (__L && __L.sealing() && raw) { try { __v = { cdl: 'sealed', v: 1, env: __L.sealSync(JSON.stringify(__v), 'idb:cd-room/d/desk:' + STORAGE_KEY), parts: [] }; } catch (e) {} }"
            " t.objectStore('d').put(__v, 'desk:' + STORAGE_KEY);")
KEEP_OLD = "st.put({ name: name, at: Date.now(), bytes: bytes }, name);"
KEEP_NEW = "st.put(__sealedCopy || { name: name, at: Date.now(), bytes: bytes }, name);"
KEEP_FN_OLD = "  function keepInBrowser(name, bytes) {\n    return new Promise(function (res, rej) {"
KEEP_FN_NEW = ("  function keepInBrowser(name, bytes) {\n    var __L = window.cdLock;\n"
               "    return (__L && __L.sealing() ? __L.sealVal({ name: name, at: Date.now(), bytes: new Blob([bytes]) }, 'idb:cd-backups/files/' + name) : Promise.resolve(null)).then(function (__sealedCopy) { return new Promise(function (res, rej) {")
KEEP_END_OLD = ("        t.oncomplete = function () { d.close(); res(true); };\n        t.onerror = t.onabort = function () { d.close(); rej(t.error || new Error('indexedDB')); };\n      };\n    });\n  }")
KEEP_END_NEW = ("        t.oncomplete = function () { d.close(); res(true); };\n        t.onerror = t.onabort = function () { d.close(); rej(t.error || new Error('indexedDB')); };\n      };\n    }); });\n  }")
NEVER_OLD = "NEVER = /^cd_backup_(auto|seal)_v1$/;"
NEVER_NEW = "NEVER = /^cd_backup_(auto|seal)_v1$|^cd_lock_/;"
KEYS_OLD = "        if (KEEP.test(k)) data[k] = localStorage.getItem(k);"
KEYS_NEW = "        if (KEEP.test(k) && !/^cd_lock_/.test(k)) data[k] = localStorage.getItem(k);"
DUMP_OLD = "          return Promise.all([req(st.getAllKeys()), req(st.getAll())]).then(function (r) {"
DUMP_NEW = ("          return Promise.all([req(st.getAllKeys()), req(st.getAll())]).then(function (r) {\n"
            "            var __L = window.cdLock; if (__L && __L.on() && typeof window.cdLockAad === 'function') return Promise.all(r[1].map(function (v, i) { var a = window.cdLockAad(name, s, r[0][i]); return (a && __L.isRecEnv(v)) ? __L.openVal(v, a).then(null, function () { return v; }) : v; })).then(function (vals) { return [r[0], vals]; });\n"
            "            return r;\n          }).then(function (r) {")
DOOR_SKIP_OLD = "function cdMaybeShowDoor() {\n  try {\n    if (typeof DEMO_STRANDS !== \"undefined\") return;"
DOOR_SKIP_NEW = "function cdMaybeShowDoor() {\n  try {\n    if (typeof DEMO_STRANDS !== \"undefined\") return;\n    if (typeof state !== \"undefined\" && state && state.doorSkip) return;"
CREDIT_OLD = '    body.appendChild(el("div", { style: { marginTop: "22px", paddingTop: "14px", borderTop: "0.5px solid var(--hairline)"'
CREDIT_NEW = ('    (function () { var row = el("label", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginTop: "16px", fontSize: "12.5px", color: "var(--text-secondary)", cursor: "pointer" } });\n'
              '      var box = el("input", { type: "checkbox", style: { width: "18px", height: "18px", accentColor: "#1b6b93", cursor: "pointer" } }); box.checked = !!state.doorSkip;\n'
              '      box.onchange = function () { state.doorSkip = !!box.checked; saveState(); };\n'
              '      row.appendChild(box); row.appendChild(el("span", { text: fr ? "Ouvrir directement l\\u2019Accueil d\\u00e9sormais" : "Open straight to Home from now on" })); body.appendChild(row); })();\n'
              + CREDIT_OLD)


def apply(p, full):
    import rooms
    core, door, css = parts(p.s)
    if 'id="cd-lock-1086-core"' in p.s:
        raise SystemExit("the page has the sign-in already")
    for var in ("TABULA_SRC", "ABACUS_SRC", "SLIDES_SRC", "SCRIBA_SRC", "FONTES_SRC"):
        a, b = rooms.patch_room(p, var, lambda src, var=var: room(src, var, core))
        print("    %s: the keeper first in its head (%d -> %d bytes)" % (var, a, b))
    i = p.s.find('<meta http-equiv="Content-Security-Policy"')
    j = p.s.find('>', i) + 1
    if i < 0 or j <= 0 or p.s.find('<script') < j:
        raise SystemExit("the page's head is not as this pass expects")
    block = ('\n<style id="cd-lock-1086-css">\n' + css + '</style>\n<script id="cd-lock-1086-core">\n' + core
             + '\n</script>\n<script id="cd-lock-1086-door">\n' + door + '\n</script>\n')
    p.s = p.s[:j] + block + p.s[j:]
    for old, new, what in ((ROOM_PUT, ROOM_PUT_NEW, "the desk's larger store, put"), (ROOM_GET, ROOM_GET_NEW, "the desk's larger store, get"),
                           (DESK_OLD, DESK_NEW, "the backup's desk record"), (KEEP_FN_OLD, KEEP_FN_NEW, "the backups kept in the browser"),
                           (KEEP_OLD, KEEP_NEW, "the backups kept in the browser, put"), (KEEP_END_OLD, KEEP_END_NEW, "the backups kept in the browser, end"),
                           (NEVER_OLD, NEVER_NEW, "what a backup never holds"), (KEYS_OLD, KEYS_NEW, "the backup's keys"),
                           (DUMP_OLD, DUMP_NEW, "the backup's copy of a database"), (DOOR_SKIP_OLD, DOOR_SKIP_NEW, "the welcome card at the start"),
                           (CREDIT_OLD, CREDIT_NEW, "the welcome card's switch")):
        p.s = once(p.s, old, new, what)
    print("    the page: the sign-in first in its head (%d bytes), its stores sealed where they are written" % len(block))
