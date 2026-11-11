/* Carpe Diem 1086: the sign-in's keeper. With a sign-in set, every value Carpe Diem keeps in this browser's store is
   sealed with AES-256-GCM under a data key; the data key is itself sealed twice, under a key made from the password
   and under one made from the recovery phrase (PBKDF2, SHA-256). Without either, nothing opens. The rooms share the
   window's keys; a window opened apart asks the others, or asks for the password. */
(function () {
  'use strict';
  var W = window, D = document;
  if (W.cdLock) return;
  var LSK = 'cd_lock_v1', ASIDE = 'cd_lock_aside:', SESS = 'cd_lock_s', CHAN = 'cd-lock-1086', ENVP = 'CDL1.';
  var CHECK = 'carpe-diem-lock-check v1', MAIN = 'carpe_diem_offline_v1', SYNC_MAX = 65536;
  var TE = new TextEncoder(), TD = new TextDecoder();
  function rnd(n) { var u = new Uint8Array(n); (W.crypto || W.msCrypto).getRandomValues(u); return u; }
  function b64e(u8) { var s = '', CH = 0x8000; for (var i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH)); return btoa(s); }
  function b64d(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function subtle() { try { if (W.isSecureContext === false) return null; return (W.crypto && W.crypto.subtle) || null; } catch (e) { return null; } }
  function warn(e) { try { console.warn('cd-lock', e && e.message || e); } catch (x) {} }

  /*@AES@*/

  /* ---------- the record: plain, so the door can be drawn; it holds nothing that opens anything ---------- */
  var P = Storage.prototype, R = { get: P.getItem, set: P.setItem, rem: P.removeItem, clear: P.clear, key: P.key };
  var LS = null; try { LS = W.localStorage; } catch (e) {}
  function readRec() { try { var r = LS && R.get.call(LS, LSK); if (!r) return null; var o = JSON.parse(r); return (o && o.v === 1 && o.dek && o.kdf && o.check) ? o : null; } catch (e) { return null; } }
  function writeRec(o) { try { R.set.call(LS, LSK, JSON.stringify(o)); return true; } catch (e) { warn(e); return false; } }

  /* ---------- the keys ---------- */
  var K = null;                       /* { raw, js, key (a promise of the browser's own key) } */
  function hold(raw) { K = { raw: raw, js: cdGcm(raw), key: null }; return K; }
  function ckey() { if (!K) return Promise.reject(new Error('locked')); var s = subtle(); if (!s) return Promise.reject(new Error('nosubtle')); if (!K.key) K.key = s.importKey('raw', K.raw, 'AES-GCM', false, ['encrypt', 'decrypt']); return K.key; }
  /* a room inside the window uses the window's keys; so does a window this one opened */
  function share() { return K ? K.raw : null; }
  var KINW = null;
  function owner(w) { try { return (w && w.cdLock && w.cdLock.__k && w.cdLock.__layer) ? w : null; } catch (e) { return null; } }
  function kin() {
    var seen = [], w = null, found = null;
    try { w = W.parent; } catch (e) {}
    while (w && w !== W && seen.indexOf(w) < 0) { seen.push(w); if (owner(w)) found = w; try { if (w === w.parent) break; w = w.parent; } catch (e) { break; } }
    if (!found) { try { if (owner(W.opener)) found = W.opener; } catch (e) {} }
    KINW = found; return found ? found.cdLock : null;
  }
  var KIN = kin();
  if (KIN) ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (t) { D.addEventListener(t, function () { try { if (KINW.cdLockTouch) KINW.cdLockTouch(); } catch (e) {} }, { capture: true, passive: true }); });
  function keys() { if (KIN) { try { var r = KIN.__k(); if (r) { if (!K || K.raw !== r) hold(r); return K; } K = null; return null; } catch (e) { return K; } } return K; }
  function on() { return !!keys(); }
  var PLAIN = false;                  /* set while the sign-in is being turned off: what is written goes in plain */
  function sealing() { return on() && !(KIN ? KIN.plainNow() : PLAIN); }
  function shut() { return !on() && !!readRec(); }   /* a copy with a sign-in, not yet opened: nothing is written */
  function fromSession() { try { var v = W.sessionStorage.getItem(SESS); return v ? b64d(v) : null; } catch (e) { return null; } }
  function toSession(raw) { try { if (raw) W.sessionStorage.setItem(SESS, b64e(raw)); else W.sessionStorage.removeItem(SESS); } catch (e) {} }

  /* ---------- sealing ---------- */
  function isEnv(s) { return typeof s === 'string' && s.length > 30 && s.charCodeAt(0) === 67 && s.lastIndexOf(ENVP, 0) === 0; }
  function sealSync(text, aad) { var k = keys(); if (!k) throw new Error('locked'); var iv = rnd(12); return ENVP + b64e(iv) + '.' + b64e(k.js.seal(iv, TE.encode(aad), TE.encode(String(text)))); }
  function openSync(env, aad) { var k = keys(); if (!k) throw new Error('locked'); var i = env.indexOf('.', 5); return TD.decode(k.js.open(b64d(env.slice(5, i)), TE.encode(aad), b64d(env.slice(i + 1)))); }
  function sealText(text, aad) { return ckey().then(function (key) { var iv = rnd(12); return subtle().encrypt({ name: 'AES-GCM', iv: iv, additionalData: TE.encode(aad), tagLength: 128 }, key, TE.encode(String(text))).then(function (ct) { return ENVP + b64e(iv) + '.' + b64e(new Uint8Array(ct)); }); }); }
  function openText(env, aad) { return ckey().then(function (key) { var i = env.indexOf('.', 5); return subtle().decrypt({ name: 'AES-GCM', iv: b64d(env.slice(5, i)), additionalData: TE.encode(aad), tagLength: 128 }, key, b64d(env.slice(i + 1))).then(function (pt) { return TD.decode(pt); }); }); }
  function sealBytes(u8, aad) { return ckey().then(function (key) { var iv = rnd(12); return subtle().encrypt({ name: 'AES-GCM', iv: iv, additionalData: TE.encode(aad), tagLength: 128 }, key, u8).then(function (ct) { var out = new Uint8Array(12 + ct.byteLength); out.set(iv, 0); out.set(new Uint8Array(ct), 12); return out; }); }); }
  function openBytes(u8, aad) { return ckey().then(function (key) { return subtle().decrypt({ name: 'AES-GCM', iv: u8.subarray(0, 12), additionalData: TE.encode(aad), tagLength: 128 }, key, u8.subarray(12)).then(function (pt) { return new Uint8Array(pt); }); }); }

  /* a database's record: its words and numbers sealed as one text; pictures, sound and other files in parts of 4 MB */
  var PART = 4194304;
  function isRecEnv(v) { return !!(v && typeof v === 'object' && v.cdl === 'sealed' && typeof v.env === 'string'); }
  function sealVal(v, aad, keep) {
    if (!sealing() || v == null || isRecEnv(v)) return Promise.resolve(v);
    var blobs = [], n = 0;
    function walk(x) {
      if (typeof Blob !== 'undefined' && x instanceof Blob) { var i = n++; blobs.push(x); return { $cdb: i, t: x.type || '', n: x.name || '' }; }
      if (x instanceof ArrayBuffer) return { $u8: b64e(new Uint8Array(x)), ab: 1 };
      if (ArrayBuffer.isView && ArrayBuffer.isView(x)) return { $u8: b64e(new Uint8Array(x.buffer, x.byteOffset, x.byteLength)) };
      if (x instanceof Date) return { $date: x.toISOString() };
      if (Array.isArray(x)) return x.map(walk);
      if (x && typeof x === 'object') { var o = {}; for (var k in x) if (Object.prototype.hasOwnProperty.call(x, k)) o[k] = walk(x[k]); return o; }
      return x;
    }
    var shape = walk(v);
    return sealText(JSON.stringify(shape), aad).then(function (env) {
      var out = { cdl: 'sealed', v: 1, env: env, parts: [] };
      (keep || []).forEach(function (k) { if (v && v[k] !== undefined) out[k] = v[k]; });
      return blobs.reduce(function (p, b, bi) {
        return p.then(function () { return b.arrayBuffer ? b.arrayBuffer() : new Response(b).arrayBuffer(); }).then(function (ab) {
          var u8 = new Uint8Array(ab), chunks = [], at = 0;
          function next() { if (at >= u8.length && chunks.length) return Promise.resolve(); var piece = u8.subarray(at, Math.min(u8.length, at + PART)), ix = chunks.length; at += PART;
            return sealBytes(piece, aad + '#' + bi + '.' + ix).then(function (c) { chunks.push(c.buffer); if (at < u8.length) return next(); }); }
          return next().then(function () { out.parts[bi] = chunks; });
        });
      }, Promise.resolve()).then(function () { return out; });
    });
  }
  function openVal(v, aad) {
    if (!isRecEnv(v)) return Promise.resolve(v);
    if (!on()) return Promise.reject(new Error('locked'));
    return openText(v.env, aad).then(function (txt) {
      var shape = JSON.parse(txt), files = [];
      function find(x) { if (Array.isArray(x)) x.forEach(find); else if (x && typeof x === 'object') { if (typeof x.$cdb === 'number') files.push(x); else for (var k in x) find(x[k]); } }
      find(shape);
      return files.reduce(function (p, f) {
        return p.then(function () { var chunks = (v.parts || [])[f.$cdb] || [], out = [];
          return chunks.reduce(function (q, c, ix) { return q.then(function () { return openBytes(new Uint8Array(c), aad + '#' + f.$cdb + '.' + ix).then(function (u) { out.push(u); }); }); }, Promise.resolve())
            .then(function () { f.__blob = new Blob(out, { type: f.t || '' }); }); });
      }, Promise.resolve()).then(function () {
        function back(x) {
          if (Array.isArray(x)) return x.map(back);
          if (x && typeof x === 'object') {
            if (typeof x.$cdb === 'number') { var b = x.__blob; if (x.n && typeof File === 'function') { try { b = new File([b], x.n, { type: x.t || '' }); } catch (e) {} } return b; }
            if (typeof x.$u8 === 'string' && Object.keys(x).length <= 2) { var u = b64d(x.$u8); return x.ab ? u.buffer : u; }
            if (typeof x.$date === 'string' && Object.keys(x).length === 1) return new Date(x.$date);
            var o = {}; for (var k in x) o[k] = back(x[k]); return o;
          }
          return x;
        }
        return back(shape);
      });
    });
  }

  /* ---------- the store: what Carpe Diem writes is sealed on its way in and opened on its way out ---------- */
  var C = new Map(), Q = new Map(), busy = false, leaving = false, STORE_FULL = null;
  function exempt(k) { return k === LSK || k.lastIndexOf(ASIDE, 0) === 0; }
  function aadOf(k) { return 'ls:' + k; }
  var layer = {
    get: function (k) {
      if (exempt(k)) return R.get.call(LS, k);
      if (!on()) { var r0 = R.get.call(LS, k); return (isEnv(r0) && shut()) ? null : r0; }
      var c = C.get(k); if (c) return c.bad ? null : c.p;
      var raw = R.get.call(LS, k);
      if (raw == null) return null;
      if (!isEnv(raw)) { C.set(k, { p: raw }); if (sealing()) { Q.set(k, raw); kick(); } return raw; }
      try { var p = openSync(raw, aadOf(k)); C.set(k, { p: p, e: raw }); return p; }
      catch (e) { C.set(k, { bad: true }); warn('a sealed value did not open: ' + k); return null; }
    },
    set: function (k, v) {
      v = String(v);
      if (exempt(k)) { R.set.call(LS, k, v); return; }
      if (!on()) { if (shut()) return; R.set.call(LS, k, v); C.delete(k); return; }
      if (!sealing()) { R.set.call(LS, k, v); C.set(k, { p: v }); Q.delete(k); return; }
      var was = C.get(k);
      if (was && was.bad) { try { var raw0 = R.get.call(LS, k); if (raw0 != null && R.get.call(LS, ASIDE + k) == null) R.set.call(LS, ASIDE + k, raw0); } catch (e) {} }
      if (v.length <= SYNC_MAX || leaving) {
        var env = sealSync(v, aadOf(k));
        R.set.call(LS, k, env);           /* a full store throws here, as it always did */
        C.set(k, { p: v, e: env }); Q.delete(k); return;
      }
      C.set(k, { p: v }); Q.set(k, v); kick();
    },
    remove: function (k) { if (shut() && !exempt(k)) return; C.delete(k); Q.delete(k); R.rem.call(LS, k); },
    clear: function () { if (shut()) return; C.clear(); Q.clear(); R.clear.call(LS); },
    flush: function () {
      Q.forEach(function (v, k) { try { R.set.call(LS, k, sealSync(v, aadOf(k))); var c = C.get(k); if (c && c.p === v) c.e = true; } catch (e) { full(k, v, e); } });
      Q.clear();
    },
    forget: function (k) { if (k == null) C.clear(); else C.delete(k); }
  };
  function full(k, v, e) {
    warn(e);
    if (k === MAIN && typeof W.__cdOverflow === 'function') { try { W.__cdOverflow(v, false); return; } catch (x) {} }
    if (STORE_FULL) { try { STORE_FULL(k); } catch (x) {} }
  }
  function kick() {
    if (busy || !Q.size) return; busy = true;
    var k = Q.keys().next().value, v = Q.get(k);
    sealText(v, aadOf(k)).then(function (env) {
      if (Q.get(k) !== v) return;          /* written again meanwhile: the newer one goes next */
      Q.delete(k);
      try { R.set.call(LS, k, env); var c = C.get(k); if (c && c.p === v) c.e = env; } catch (e) { full(k, v, e); }
    }, function (e) { warn(e); if (Q.get(k) === v) { Q.delete(k); try { R.set.call(LS, k, sealSync(v, aadOf(k))); } catch (x) { full(k, v, x); } } })
      .then(function () { busy = false; if (Q.size) setTimeout(kick, 0); });
  }
  function host() { return KIN ? (KIN.__layer || null) : layer; }   /* a room inside the window uses the window's store */
  P.getItem = function (k) { if (this !== LS || !LS) return R.get.apply(this, arguments); var h = host(); return h ? h.get(String(k)) : R.get.call(this, k); };
  P.setItem = function (k, v) { if (this !== LS || !LS) return R.set.apply(this, arguments); var h = host(); if (h) return h.set(String(k), v); return R.set.call(this, k, v); };
  P.removeItem = function (k) { if (this !== LS || !LS) return R.rem.apply(this, arguments); var h = host(); if (h) return h.remove(String(k)); return R.rem.call(this, k); };
  P.clear = function () { if (this !== LS || !LS) return R.clear.apply(this, arguments); var h = host(); if (h) return h.clear(); return R.clear.call(this); };

  /* a frame of this window, before its own keeper has come (an empty frame a room is written into later), is fitted
     with this one, so a value written into its store from here or from it is sealed all the same */
  function adoptFrame(w) {
    try {
      if (!w || w === W || !w.Storage || !w.Storage.prototype) return;
      var FP = w.Storage.prototype; if (FP.__cdl) return;
      var fls = null; try { fls = w.localStorage; } catch (e) { return; }
      var g = FP.getItem, st = FP.setItem, rm = FP.removeItem, cl = FP.clear;
      FP.getItem = function (k) { if (this !== fls) return g.apply(this, arguments); var h = host(); return h ? h.get(String(k)) : g.call(this, k); };
      FP.setItem = function (k, v) { if (this !== fls) return st.apply(this, arguments); var h = host(); if (h) return h.set(String(k), v); return st.call(this, k, v); };
      FP.removeItem = function (k) { if (this !== fls) return rm.apply(this, arguments); var h = host(); if (h) return h.remove(String(k)); return rm.call(this, k); };
      FP.clear = function () { if (this !== fls) return cl.apply(this, arguments); var h = host(); if (h) return h.clear(); return cl.call(this); };
      try { Object.defineProperty(FP, '__cdl', { value: 1 }); } catch (e) { FP.__cdl = 1; }
    } catch (e) {}
  }
  function adoptAll(root) { try { var fs = (root || D).querySelectorAll('iframe'); for (var i = 0; i < fs.length; i++) { try { adoptFrame(fs[i].contentWindow); } catch (e) {} } } catch (e) {} }
  try { Object.defineProperty(P, '__cdl', { value: 1 }); } catch (e) {}
  /* a frame is fitted the moment any code reaches into it (its window or its document), and every so often after the
     page has loaded; nothing watches the page as it is built, which on a page this size costs too much */
  (function () {
    try {
      var IF = W.HTMLIFrameElement && W.HTMLIFrameElement.prototype; if (!IF) return;
      var dw = Object.getOwnPropertyDescriptor(IF, 'contentWindow'), dd = Object.getOwnPropertyDescriptor(IF, 'contentDocument');
      if (dw && dw.get && dw.configurable) Object.defineProperty(IF, 'contentWindow', { configurable: true, enumerable: dw.enumerable, get: function () { var w = dw.get.call(this); if (w) adoptFrame(w); return w; } });
      if (dd && dd.get && dd.configurable) Object.defineProperty(IF, 'contentDocument', { configurable: true, enumerable: dd.enumerable, get: function () { var d = dd.get.call(this); try { if (d && d.defaultView) adoptFrame(d.defaultView); } catch (e) {} return d; } });
    } catch (e) {}
  })();

  /* another window wrote: what this one holds of that value is dropped, and the listeners are told in plain words */
  function plainOf(k, s) { if (!isEnv(s) || !on()) return s; try { return openSync(s, aadOf(k)); } catch (e) { return null; } }
  W.addEventListener('storage', function (e) { try { if (e.storageArea && e.storageArea !== LS) return; var h = host(); if (h) h.forget(e.key); } catch (x) {} }, true);
  var AEL = W.addEventListener, REL = W.removeEventListener, wraps = new WeakMap();
  AEL.call(W, 'load', function () { adoptAll(); setInterval(function () { adoptAll(); }, 1500); });
  function wrapFor(fn) {
    if (typeof fn !== 'function') return fn;
    var w = wraps.get(fn); if (w) return w;
    w = function (ev) {
      try {
        if (ev && ev.type === 'storage' && ev.key && (isEnv(ev.newValue) || isEnv(ev.oldValue)) && typeof StorageEvent === 'function') {
          var t = new StorageEvent('storage', { key: ev.key, oldValue: plainOf(ev.key, ev.oldValue), newValue: plainOf(ev.key, ev.newValue), url: ev.url, storageArea: ev.storageArea });
          return fn.call(this, t);
        }
      } catch (x) {}
      return fn.call(this, ev);
    };
    wraps.set(fn, w); return w;
  }
  W.addEventListener = function (type, fn, o) { if (type === 'storage') return AEL.call(this, type, wrapFor(fn), o); return AEL.apply(this, arguments); };
  W.removeEventListener = function (type, fn, o) { if (type === 'storage') return REL.call(this, type, wraps.get(fn) || fn, o); return REL.apply(this, arguments); };

  /* a window closing seals what is still waiting, in the page itself, before it goes */
  function leave() { leaving = true; if (!KIN) { try { layer.flush(); } catch (e) {} } }
  AEL.call(W, 'pagehide', leave, true);
  AEL.call(W, 'beforeunload', leave, true);
  D.addEventListener('visibilitychange', function () { if (D.hidden) leave(); else leaving = false; }, true);
  AEL.call(W, 'pageshow', function () { leaving = false; }, true);

  /* ---------- other windows of this copy: one that is signed in hands its key to one that asks ---------- */
  var BC = null; try { if (typeof BroadcastChannel === 'function') BC = new BroadcastChannel(CHAN); } catch (e) {}
  var asks = {};
  if (BC) BC.onmessage = function (m) {
    var d = m && m.data; if (!d || typeof d !== 'object') return;
    if (d.ask && K && !KIN) { try { BC.postMessage({ answer: d.ask, k: b64e(K.raw) }); } catch (e) {} }
    if (d.answer && asks[d.answer]) { var f = asks[d.answer]; delete asks[d.answer]; f(d.k); }
    if (d.locked && K && !KIN && W.cdLock && W.cdLock.lockNow) { try { W.cdLock.lockNow(true); } catch (e) {} }
  };
  function askOthers(ms) {
    return new Promise(function (res) {
      if (!BC) { res(null); return; }
      var id = b64e(rnd(9)), t = setTimeout(function () { delete asks[id]; res(null); }, ms || 450);
      asks[id] = function (k) { clearTimeout(t); try { res(b64d(k)); } catch (e) { res(null); } };
      try { BC.postMessage({ ask: id }); } catch (e) { clearTimeout(t); res(null); }
    });
  }
  function proves(raw, rec) {          /* a key handed over is taken only if it opens this copy's check */
    try { var g = cdGcm(raw), c = rec.check; return TD.decode(g.open(b64d(c.iv), TE.encode('carpe-diem-lock check'), b64d(c.ct))) === CHECK; } catch (e) { return false; }
  }

  /* ---------- the start ---------- */
  var REC = readRec();
  var state = 'off';
  if (REC && !KIN) {
    var sk = fromSession();
    if (sk && proves(sk, REC)) { hold(sk); state = 'open'; }
    else { toSession(null); state = 'locked'; }
  } else if (KIN) state = KIN.__k() ? 'open' : (KIN.state && KIN.state() === 'off' ? 'off' : 'locked');

  W.cdLock = {
    state: function () { return keys() ? 'open' : (readRec() ? 'locked' : 'off'); },
    on: on, sealing: sealing, rec: readRec, writeRec: writeRec, isEnv: isEnv, isRecEnv: isRecEnv,
    plainNow: function () { return KIN ? KIN.plainNow() : PLAIN; }, writePlain: function (b) { if (!KIN) { PLAIN = !!b; if (PLAIN) { try { layer.flush(); } catch (e) {} C.clear(); } } },
    sealText: sealText, openText: openText, sealBytes: sealBytes, openBytes: openBytes, sealVal: sealVal, openVal: openVal,
    sealSync: sealSync, openSync: openSync,
    hold: function (raw) { hold(raw); toSession(raw); state = 'open'; },
    drop: function () { try { layer.flush(); } catch (e) {} K = null; C.clear(); Q.clear(); toSession(null); state = REC ? 'locked' : 'off'; },
    flush: function () { var h = host(); if (h) h.flush(); },
    askOthers: askOthers, proves: proves, tellLocked: function () { try { if (BC) BC.postMessage({ locked: 1 }); } catch (e) {} },
    onStoreFull: function (f) { STORE_FULL = f; },
    raw: R, store: LS, gcm: function (raw) { return cdGcm(raw); }, rnd: rnd, b64e: b64e, b64d: b64d, subtle: subtle,
    names: { LSK: LSK, ASIDE: ASIDE, CHECK: CHECK, MAIN: MAIN },
    __k: function () { var k = keys(); return k ? k.raw : null; },
    __layer: layer
  };
  if (KIN) W.cdLock.__layer = null;
  W.cdLock.startState = state;
})();
