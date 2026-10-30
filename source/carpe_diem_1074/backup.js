(function () {
  'use strict';
  if (window.cdBackup) return;
  var core = window.__cdBackupCore;
  if (!core) return;

  var te = new TextEncoder(), td = new TextDecoder();
  var MAGIC = [67, 68, 66, 75], ITER = 600000, PART = 786432;
  var AUTO_KEY = 'cd_backup_auto_v1', SEAL_KEY = 'cd_backup_seal_v1', NEVER = /^cd_backup_(auto|seal)_v1$/;
  var ROOMS = ['tabula', 'abacus', 'slides', 'scriba', 'fontes'];

  function fr() { try { return typeof state !== 'undefined' && state && state.lang === 'fr'; } catch (e) { return false; } }
  function T(en, f) { return fr() ? f : en; }
  function api() { try { return (window.pywebview && window.pywebview.api) || null; } catch (e) { return null; } }
  function host() { var a = api(); return a && typeof a.backup_begin === 'function' ? a : null; }
  function call(fn) { try { return Promise.resolve(fn()); } catch (e) { return Promise.reject(e); } }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function size(n) {
    if (n >= 1048576) { var m = (n / 1048576).toFixed(1); return fr() ? m.replace('.', ',') + ' Mo' : m + ' MB'; }
    return Math.max(1, Math.round(n / 1024)) + (fr() ? ' Ko' : ' KB');
  }
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function stamp(d) { return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate()) + '-' + two(d.getHours()) + two(d.getMinutes()); }
  function when(t) {
    var d = new Date(t), now = new Date(), hm = two(d.getHours()) + ':' + two(d.getMinutes());
    if (d.toDateString() === now.toDateString()) return T('today at ', 'aujourd’hui à ') + hm;
    var y = new Date(now.getTime() - 86400000);
    if (d.toDateString() === y.toDateString()) return T('yesterday at ', 'hier à ') + hm;
    try { return d.toLocaleDateString(fr() ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long' }) + T(' at ', ' à ') + hm; } catch (e) { return d.toISOString().slice(0, 10) + ' ' + hm; }
  }
  function b64(u8) { var s = '', CH = 0x8000; for (var i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH)); return btoa(s); }
  function unb64(s) { var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
  function get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  // ---------- the file: JSON, packed with gzip, sealed with AES-256-GCM under a key made from a passphrase ----------
  // Sealed: "CDBK", version 1, PBKDF2 iterations (4 bytes), salt (16), IV (12), then the cipher text; the 37 bytes
  // before it are bound to it as additional data, so none of them can be changed unseen.
  function through(u8, stream) { return new Response(new Blob([u8]).stream().pipeThrough(stream)).arrayBuffer().then(function (b) { return new Uint8Array(b); }); }
  function gzip(u8) { if (typeof CompressionStream !== 'function') return Promise.resolve(null); return through(u8, new CompressionStream('gzip')).catch(function () { return null; }); }
  function gunzip(u8) {
    if (typeof DecompressionStream !== 'function') return Promise.reject(new Error(T('This device cannot open a compressed backup.', 'Cet appareil ne peut pas ouvrir une sauvegarde compressée.')));
    return through(u8, new DecompressionStream('gzip'));
  }
  function canSeal() { try { return !!(window.crypto && crypto.subtle && crypto.getRandomValues); } catch (e) { return false; } }
  function keyFrom(pass, salt, iter) {
    return crypto.subtle.importKey('raw', te.encode(pass), 'PBKDF2', false, ['deriveKey']).then(function (k) {
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: iter, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    });
  }
  function seal(u8, s) {
    var iv = crypto.getRandomValues(new Uint8Array(12)), h = new Uint8Array(37);
    h.set(MAGIC, 0); h[4] = 1; h[5] = (s.iter >>> 24) & 255; h[6] = (s.iter >>> 16) & 255; h[7] = (s.iter >>> 8) & 255; h[8] = s.iter & 255;
    h.set(s.salt, 9); h.set(iv, 25);
    return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv, additionalData: h }, s.key, u8).then(function (ct) {
      var out = new Uint8Array(37 + ct.byteLength); out.set(h, 0); out.set(new Uint8Array(ct), 37); return out;
    });
  }
  function isSealed(u8) { return u8.length > 53 && u8[0] === 67 && u8[1] === 68 && u8[2] === 66 && u8[3] === 75; }
  function unseal(u8, pass) {
    if (u8[4] !== 1) return Promise.reject(new Error(T('This backup was sealed by a newer Carpe Diem.', 'Cette sauvegarde a été scellée par un Carpe Diem plus récent.')));
    var iter = u8[5] * 16777216 + (u8[6] << 16) + (u8[7] << 8) + u8[8], h = u8.slice(0, 37);
    return keyFrom(pass, u8.slice(9, 25), iter).then(function (key) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: u8.slice(25, 37), additionalData: h }, key, u8.subarray(37)).then(function (pt) { return new Uint8Array(pt); }, function () {
        var e = new Error('passphrase'); e.code = 'passphrase'; throw e;
      });
    });
  }
  function newSeal(pass) {
    var salt = crypto.getRandomValues(new Uint8Array(16));
    return keyFrom(pass, salt, ITER).then(function (key) { return { key: key, salt: salt, iter: ITER }; });
  }
  // the daily backups' seal: the key made from the owner's passphrase is kept on this device, never the passphrase
  function storedSeal() {
    var s = get(SEAL_KEY);
    if (!s || !s.k || !canSeal()) return Promise.resolve(null);
    return crypto.subtle.importKey('raw', unb64(s.k), { name: 'AES-GCM' }, false, ['encrypt']).then(function (key) {
      return { key: key, salt: unb64(s.salt), iter: s.iter || ITER, at: s.at };
    }, function () { return null; });
  }
  function keepSeal(pass) {
    return newSeal(pass).then(function (s) {
      return crypto.subtle.exportKey('raw', s.key).then(function (raw) {
        put(SEAL_KEY, { k: b64(new Uint8Array(raw)), salt: b64(s.salt), iter: s.iter, at: Date.now() });
        return s;
      });
    });
  }

  function gather() {
    try { if (typeof window.cdGatherWork === 'function') window.cdGatherWork(); } catch (e) {}
    return core.backupObj().then(function (obj) {
      Object.keys(obj.data || {}).forEach(function (k) { if (NEVER.test(k)) delete obj.data[k]; });
      obj.app = 'Carpe Diem';
      try { obj.build = (window.CD_BUILD && window.CD_BUILD.pass) || ''; } catch (e) {}
      return { json: JSON.stringify(obj), obj: obj };
    });
  }
  function pack(g, sealWith, progress) {
    var m = { json: g.json, obj: g.obj, when: new Date(), plain: g.json.length, packed: false, sealed: false };
    progress('pack', 0.25);
    var u8 = te.encode(g.json);
    return gzip(u8).then(function (z) { m.packed = !!z; return z || u8; }).then(function (bytes) {
      if (!sealWith) return bytes;
      progress('seal', 0.45);
      return seal(bytes, sealWith).then(function (s) { m.sealed = true; return s; });
    }).then(function (bytes) {
      m.bytes = bytes; m.size = bytes.length;
      m.ext = m.sealed ? '.cdbackup' : (m.packed ? '.json.gz' : '.json');
      return m;
    });
  }
  function read(u8, askPass) {
    function inner(b) {
      if (b.length > 2 && b[0] === 0x1f && b[1] === 0x8b) return gunzip(b).then(inner);
      var obj = null; try { obj = JSON.parse(td.decode(b).replace(/^﻿/, '')); } catch (e) {}
      if (!obj || typeof obj !== 'object' || (obj.format !== 'carpe-diem-backup' && !obj.data)) throw new Error(T('That file is not a Carpe Diem backup.', 'Ce fichier n’est pas une sauvegarde Carpe Diem.'));
      return obj;
    }
    if (!isSealed(u8)) return Promise.resolve(u8).then(inner);
    if (!canSeal()) return Promise.reject(new Error(T('This device cannot open a sealed backup.', 'Cet appareil ne peut pas ouvrir une sauvegarde scellée.')));
    function attempt(again) {
      return askPass(again).then(function (pass) {
        if (pass == null) { var e = new Error('stopped'); e.code = 'stopped'; throw e; }
        return unseal(u8, pass).then(inner, function (e) { if (e && e.code === 'passphrase') return attempt(true); throw e; });
      });
    }
    return attempt(false);
  }

  // ---------- keeping it: in pieces through the app (a backup with hours of recordings is large), or in the browser ----------
  function sendHost(place, name, bytes, progress, keep) {
    var a = host();
    if (!a) return Promise.reject(new Error('no app'));
    return call(function () { return a.backup_begin(place, name); }).then(function (r) {
      if (r && r.cancelled) return { cancelled: true };
      if (!r || !r.key) throw new Error((r && r.error) || T('Carpe Diem could not begin writing the backup.', 'Carpe Diem n’a pas pu commencer à écrire la sauvegarde.'));
      var n = Math.max(1, Math.ceil(bytes.length / PART)), i = 0;
      function one(tries) {
        var piece = b64(bytes.subarray(i * PART, Math.min(bytes.length, (i + 1) * PART)));
        return call(function () { return a.backup_part(r.key, i, piece); }).then(function (ok) { if (ok !== true) throw new Error('part'); })['catch'](function () {
          if (tries >= 3) throw new Error(T('A part of the backup did not reach the disk, after three tries.', 'Une partie de la sauvegarde n’a pas atteint le disque, après trois essais.'));
          return wait(400 * Math.pow(2, tries)).then(function () { return one(tries + 1); });
        });
      }
      function next() {
        if (i >= n) return call(function () { return a.backup_end(r.key, keep || 0, keep ? 'carpe-diem-auto-' : ''); });
        return one(0).then(function () { i++; progress('save', i / n); return next(); });
      }
      return next().then(function (res) {
        if (!res || !res.ok) throw new Error((res && res.error) || T('The backup was not kept.', 'La sauvegarde n’a pas été gardée.'));
        return { ok: true, token: res.token, name: res.name || name, size: res.size || bytes.length };
      }, function (e) { try { a.backup_abort(r.key); } catch (x) {} throw e; });
    });
  }
  function saveHere(name, bytes) {
    var mime = /\.json$/.test(name) ? 'application/json' : 'application/octet-stream', blob = new Blob([bytes], { type: mime });
    if (typeof window.showSaveFilePicker === 'function') {
      return window.showSaveFilePicker({ suggestedName: name }).then(function (h) { return h.createWritable(); })
        .then(function (w) { return w.write(blob).then(function () { return w.close(); }); })
        .then(function () { return { ok: true, how: 'file', name: name, size: bytes.length }; }, function (e) { if (e && e.name === 'AbortError') return { cancelled: true }; throw e; });
    }
    try {
      if (window.CarpeNative && typeof window.CarpeNative.saveFile === 'function' && window.CarpeNative.saveFile(String(name), mime, b64(bytes))) return Promise.resolve({ ok: true, how: 'device', name: name, size: bytes.length });
    } catch (e) {}
    var u = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = u; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { try { URL.revokeObjectURL(u); a.remove(); } catch (e) {} }, 60000);
    return Promise.resolve({ ok: true, how: 'download', name: name, size: bytes.length });
  }
  // a copy kept inside this browser, for a device with no app around the page (the newest three)
  function keepInBrowser(name, bytes) {
    return new Promise(function (res, rej) {
      var r; try { r = indexedDB.open('cd-backups', 1); } catch (e) { rej(e); return; }
      r.onupgradeneeded = function () { try { r.result.createObjectStore('files'); } catch (e) {} };
      r.onerror = function () { rej(r.error || new Error('indexedDB')); };
      r.onsuccess = function () {
        var d = r.result, t = d.transaction('files', 'readwrite'), st = t.objectStore('files');
        st.put({ name: name, at: Date.now(), bytes: bytes }, name);
        var all = st.getAllKeys();
        all.onsuccess = function () { var ks = (all.result || []).map(String).sort(); while (ks.length > 3) st['delete'](ks.shift()); };
        t.oncomplete = function () { d.close(); res(true); };
        t.onerror = t.onabort = function () { d.close(); rej(t.error || new Error('indexedDB')); };
      };
    });
  }

  // ---------- restoring ----------
  function closeRooms() {
    try { if (typeof window.cdGatherWork === 'function') window.cdGatherWork(); } catch (e) {}
    var a = api();
    ROOMS.forEach(function (w) { try { if (a && typeof a.close_app === 'function') a.close_app(w); } catch (e) {} });
    // a room's frame keeps saving on its own (Tabula every few seconds): each goes, its work saved first, so none of
    // them writes over the restored work in the moment before Carpe Diem starts again
    [].slice.call(document.querySelectorAll('iframe')).forEach(function (f) { try { f.remove(); } catch (e) {} });
    return wait(900);
  }
  // the desk's copy in the larger store (cd-room) wins at the next start only when it was written there because the small
  // store was full: after a restore it is the restored desk when that is too large for the small store, else nothing
  function deskRecord(raw) {
    return new Promise(function (res) {
      if (typeof STORAGE_KEY === 'undefined' || !window.indexedDB) { res(); return; }
      var r; try { r = indexedDB.open('cd-room', 1); } catch (e) { res(); return; }
      r.onupgradeneeded = function () { try { r.result.createObjectStore('d'); } catch (e) {} };
      r.onsuccess = function () {
        var d = r.result;
        try {
          var t = d.transaction('d', 'readwrite');
          t.objectStore('d').put(raw ? { lsOk: false, raw: raw, at: Date.now(), n: raw.length } : { lsOk: true, raw: null, at: Date.now() }, 'desk:' + STORAGE_KEY);
          t.oncomplete = t.onerror = t.onabort = function () { try { d.close(); } catch (e) {} res(); };
        } catch (e) { try { d.close(); } catch (x) {} res(); }
      };
      r.onerror = r.onblocked = function () { res(); };
    });
  }
  function restoreInto(obj, merge, progress) {
    var data = (obj && obj.data) || obj || {}, idb = (obj && obj.idb) || {}, failed = [], over = null;
    try { window.saveState = function () {}; } catch (e) {}
    Object.keys(data).forEach(function (k) {
      if (!core.KEEP.test(k) || NEVER.test(k) || typeof data[k] !== 'string') return;
      var v = data[k];
      if (merge) {
        try { var cur = JSON.parse(localStorage.getItem(k)), inc = JSON.parse(v); if (cur && inc && typeof cur === 'object' && typeof inc === 'object') v = JSON.stringify(core.mergeVal(cur, inc)); } catch (e) {}
      }
      try { localStorage.setItem(k, v); }
      catch (e) { if (typeof STORAGE_KEY !== 'undefined' && k === STORAGE_KEY) over = v; else failed.push(k); }
    });
    progress('restore', 0.6);
    var names = Object.keys(idb).filter(function (n) { return core.DBS.indexOf(n) >= 0 && n !== 'cd-room'; });
    return names.reduce(function (p, n, i) {
      return p.then(function () { return core.restoreDb(n, idb[n], merge); }).then(function () { progress('restore', 0.6 + 0.35 * (i + 1) / names.length); });
    }, Promise.resolve()).then(function () { return deskRecord(over); }).then(function () { progress('restore', 1); return { failed: failed, overflow: !!over }; });
  }
  function safetyCopy(progress) {
    return gather().then(function (g) { return pack(g, null, function () {}); }).then(function (m) {
      var name = 'carpe-diem-before-restore-' + stamp(m.when) + m.ext;
      progress('safety', 0.5);
      if (host()) return sendHost('documents', name, m.bytes, function () {}, 0).then(function (r) {
        if (r.cancelled) throw new Error('cancelled');
        return T('Documents › Carpe Diem › Backups, as ' + r.name, 'Documents › Carpe Diem › Backups, sous le nom ' + r.name);
      });
      return keepInBrowser(name, m.bytes).then(function () { return T('this browser’s own store, as ' + name, 'la réserve de ce navigateur, sous le nom ' + name); });
    });
  }

  // ---------- the sheet ----------
  function sheet(title) {
    var old = document.getElementById('cd-bk'); if (old) old.remove();
    var w = document.createElement('div'); w.id = 'cd-bk'; w.className = 'cd-bk-wrap';
    w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-labelledby', 'cd-bk-t');
    w.innerHTML = '<div class="cd-bk-card"><h2 id="cd-bk-t"></h2><div class="cd-bk-body"></div><div class="cd-bk-bar" hidden><div class="cd-bk-fill"></div></div><p class="cd-bk-say" role="status" aria-live="polite"></p><div class="cd-bk-keys"></div></div>';
    w.querySelector('h2').textContent = title;
    var body = w.querySelector('.cd-bk-body'), bar = w.querySelector('.cd-bk-bar'), fill = w.querySelector('.cd-bk-fill'), sayEl = w.querySelector('.cd-bk-say'), keys = w.querySelector('.cd-bk-keys');
    var busy = false;
    function close() { if (busy) return; try { w.remove(); } catch (e) {} document.removeEventListener('keydown', esc, true); }
    function esc(e) { if (e.key === 'Escape' && !busy) { close(); e.stopPropagation(); } }
    document.addEventListener('keydown', esc, true);
    document.body.appendChild(w);
    var S = {
      el: w, body: body, close: close,
      busy: function (b) { busy = !!b; w.classList.toggle('cd-bk-busy', busy); },
      say: function (t, bad) { sayEl.textContent = t || ''; sayEl.classList.toggle('cd-bk-bad', !!bad); },
      bar: function (f) { if (f == null) { bar.hidden = true; return; } bar.hidden = false; fill.style.width = Math.round(Math.max(0, Math.min(1, f)) * 100) + '%'; },
      keys: function (list) {
        keys.innerHTML = '';
        list.forEach(function (k) {
          var b = document.createElement('button'); b.type = 'button'; b.textContent = k[0];
          if (k[2]) b.className = 'cd-bk-go';
          b.onclick = function () { try { k[1](b); } catch (e) { S.say(String((e && e.message) || e), true); } };
          keys.appendChild(b);
        });
        try { var f = keys.querySelector('.cd-bk-go') || keys.querySelector('button'); if (f) f.focus(); } catch (e) {}
      }
    };
    return S;
  }
  var STAGE = {
    gather: ['Gathering your work…', 'Je rassemble votre travail…'],
    pack: ['Compressing…', 'Compression…'],
    seal: ['Sealing with your passphrase…', 'Scellement avec votre phrase secrète…'],
    save: ['Writing it…', 'Écriture…'],
    read: ['Reading the backup…', 'Lecture de la sauvegarde…'],
    safety: ['Keeping a copy of your work as it is now…', 'Copie de votre travail tel qu’il est maintenant…'],
    rooms: ['Closing the rooms, their work saved…', 'Fermeture des pièces, leur travail enregistré…'],
    restore: ['Restoring…', 'Restauration…']
  };
  function progressOn(S) {
    return function (stage, f) { var t = STAGE[stage]; if (t) S.say(T(t[0], t[1]) + (stage === 'save' && f < 1 ? ' ' + Math.round(f * 100) + ' %' : '')); S.bar(stage === 'save' ? 0.5 + 0.5 * f : f); };
  }
  function placeLabel(p) { return p.id === 'documents' ? T('Documents › Carpe Diem › Backups', 'Documents › Carpe Diem › Backups') : p.label; }
  function places() {
    var a = host();
    if (!a || typeof a.backup_places !== 'function') return Promise.resolve([]);
    return call(function () { return a.backup_places(); }).then(function (l) { return Array.isArray(l) ? l : []; }, function () { return []; });
  }
  function reload() {
    try { if (typeof window.cdRefresh === 'function') { window.cdRefresh(true); return; } } catch (e) {}
    location.reload();
  }
  function reveal(token) { var a = host(); try { if (a && token && typeof a.backup_reveal === 'function') a.backup_reveal(token); } catch (e) {} }
  function passFields(note) {
    return '<div class="cd-bk-pass" hidden><label>' + T('Passphrase', 'Phrase secrète') + '<input type="password" class="cd-bk-p1" autocomplete="new-password"></label>'
      + '<label>' + T('Once more', 'Encore une fois') + '<input type="password" class="cd-bk-p2" autocomplete="new-password"></label>'
      + '<div class="cd-bk-note">' + note + '</div></div>';
  }
  function passOf(S) {
    var p1 = S.body.querySelector('.cd-bk-p1'), p2 = S.body.querySelector('.cd-bk-p2');
    var a = p1 ? p1.value : '', b = p2 ? p2.value : '';
    if (a.length < 8) return { bad: T('The passphrase needs eight characters at least.', 'La phrase secrète demande au moins huit caractères.') };
    if (a !== b) return { bad: T('The two passphrases differ.', 'Les deux phrases secrètes diffèrent.') };
    return { pass: a };
  }
  var LOSE = ['Without it the backup cannot be opened, by you or anyone: keep it somewhere safe.', 'Sans elle, la sauvegarde ne peut être ouverte, ni par vous ni par personne : gardez-la en lieu sûr.'];

  function openBackup() {
    var S = sheet(T('Back up your work', 'Sauvegarder votre travail')), g = null, list = [], made = null, last = null;
    var on = progressOn(S);
    S.busy(true); on('gather', 0.05);
    Promise.all([gather(), places(), storedSeal()]).then(function (r) {
      g = r[0]; list = r[1]; var keptSeal = r[2];
      S.busy(false); S.bar(null); S.say('');
      var html = core.holds(g.obj, fr()) + '<div class="cd-bk-note">' + T('About ', 'Environ ') + size(g.json.length) + T(' of work, compressed before it is kept.', ' de travail, compressés avant d’être gardés.') + '</div>';
      if (list.length) {
        html += '<fieldset class="cd-bk-where"><legend>' + T('Where', 'Où') + '</legend>'
          + '<label><input type="radio" name="cd-bk-place" value="ask" checked> ' + T('Choose a place…', 'Choisir un endroit…') + '</label>'
          + list.map(function (p) { return '<label><input type="radio" name="cd-bk-place" value="' + p.id + '" data-cloud="' + (p.cloud ? 1 : 0) + '"> ' + placeLabel(p).replace(/[<>&]/g, '') + (p.cloud ? ' <span class="cd-bk-tag">' + T('sealed', 'scellée') + '</span>' : '') + '</label>'; }).join('')
          + '</fieldset>';
      }
      html += canSeal() ? '<label class="cd-bk-check"><input type="checkbox" class="cd-bk-seal"> ' + (keptSeal ? T('Seal it with your backup passphrase (AES-256)', 'La sceller avec votre phrase secrète de sauvegarde (AES-256)') : T('Seal it with a passphrase (AES-256)', 'La sceller avec une phrase secrète (AES-256)')) + '</label>'
        + (keptSeal ? '' : passFields(T(LOSE[0], LOSE[1]))) : '';
      S.body.innerHTML = html;
      var sealBox = S.body.querySelector('.cd-bk-seal'), passBox = S.body.querySelector('.cd-bk-pass');
      function sync() {
        var r = S.body.querySelector('input[name="cd-bk-place"]:checked'), cloud = r && r.getAttribute('data-cloud') === '1';
        if (sealBox) { if (cloud) sealBox.checked = true; sealBox.disabled = !!cloud; }
        if (passBox) passBox.hidden = !(sealBox && sealBox.checked);
      }
      S.body.addEventListener('change', sync); sync();
      if (list.length && !canSeal()) [].forEach.call(S.body.querySelectorAll('input[data-cloud="1"]'), function (x) { x.disabled = true; });
      function go() {
        var r = S.body.querySelector('input[name="cd-bk-place"]:checked'), place = r ? r.value : null;
        var wantSeal = !!(sealBox && sealBox.checked), pw = null;
        if (wantSeal && !keptSeal) { pw = passOf(S); if (pw.bad) { S.say(pw.bad, true); return; } }
        S.busy(true); S.keys([]);
        var sealP = !wantSeal ? Promise.resolve(null) : (keptSeal ? Promise.resolve(keptSeal) : newSeal(pw.pass));
        (made && made.sealed === wantSeal ? Promise.resolve(made) : sealP.then(function (s) { return pack(g, s, on); })).then(function (m) {
          made = m;
          var name = 'carpe-diem-backup-' + stamp(m.when) + m.ext;
          return (place ? sendHost(place, name, m.bytes, on, 0) : saveHere(name, m.bytes)).then(function (res) {
            S.busy(false);
            if (res.cancelled) { S.bar(null); S.say(T('Nothing was kept: the choice of a place was cancelled.', 'Rien n’a été gardé : le choix d’un endroit a été annulé.')); S.keys(keysFor()); return; }
            last = res; S.bar(1);
            var where = place && place !== 'ask' ? (list.filter(function (p) { return p.id === place; })[0] || {}) : null;
            S.say(T('Kept: ', 'Gardée : ') + (res.name || name) + ', ' + size(res.size || m.size) + (m.sealed ? T(', sealed', ', scellée') : '') + (where && where.id ? T(', in ', ', dans ') + placeLabel(where) : '') + '.'
              + (res.how === 'download' ? T(' Your browser offered it as a download.', ' Votre navigateur l’a proposée en téléchargement.') : ''));
            var k = [];
            if (res.token && host()) k.push([T('Show it', 'La montrer'), function () { reveal(res.token); }]);
            k.push([T('Close', 'Fermer'), function () { S.close(); }, true]);
            S.keys(k);
          });
        })['catch'](function (e) {
          S.busy(false); S.bar(null);
          S.say(T('The backup was not kept: ', 'La sauvegarde n’a pas été gardée : ') + ((e && e.message) || e), true);
          S.keys([[T('Try again', 'Réessayer'), go, true], [T('Save another way', 'Garder autrement'), another], [T('Reload Carpe Diem', 'Recharger Carpe Diem'), reload], [T('Close', 'Fermer'), function () { S.close(); }]]);
        });
      }
      function another() { S.close(); try { if (typeof core.safeExport === 'function') core.safeExport(); } catch (e) {} }
      function keysFor() { return [[T('Cancel', 'Annuler'), function () { S.close(); }], [T('Back up', 'Sauvegarder'), go, true]]; }
      S.keys(keysFor());
    })['catch'](function (e) {
      S.busy(false); S.bar(null);
      S.say(T('Your work could not be gathered: ', 'Votre travail n’a pas pu être rassemblé : ') + ((e && e.message) || e), true);
      S.keys([[T('Try again', 'Réessayer'), function () { S.close(); openBackup(); }, true], [T('Save another way', 'Garder autrement'), function () { S.close(); try { core.safeExport(); } catch (x) {} }], [T('Reload Carpe Diem', 'Recharger Carpe Diem'), reload]]);
    });
  }

  function openRestore() {
    var S = sheet(T('Restore from a backup', 'Restaurer une sauvegarde')), on = progressOn(S);
    S.body.innerHTML = '<div>' + T('Choose a backup: a .cdbackup, .json.gz or .json file. Before anything changes, Carpe Diem keeps a copy of your work as it is now.',
      'Choisissez une sauvegarde : un fichier .cdbackup, .json.gz ou .json. Avant tout changement, Carpe Diem garde une copie de votre travail tel qu’il est maintenant.') + '</div>';
    function chooser() {
      var inp = document.createElement('input');
      inp.type = 'file'; inp.accept = '.cdbackup,.gz,.json,application/json,application/gzip,application/octet-stream';
      inp.className = 'cd-bk-file'; inp.style.cssText = 'position:fixed;left:-9999px;top:0;';
      document.body.appendChild(inp);
      inp.onchange = function () {
        var f = inp.files && inp.files[0]; inp.remove();
        if (!f) return;
        S.busy(true); on('read', 0);
        var rd = new FileReader();
        rd.onprogress = function (e) { if (e.lengthComputable) S.bar(e.loaded / e.total * 0.9); };
        rd.onerror = function () { S.busy(false); S.bar(null); S.say(T('The file could not be read.', 'Le fichier n’a pas pu être lu.'), true); };
        rd.onload = function () { S.busy(false); opened(new Uint8Array(rd.result), f.name); };
        rd.readAsArrayBuffer(f);
      };
      inp.click();
    }
    function pasted() {
      S.body.innerHTML = '<div>' + T('Paste the text of a backup (a .json file’s contents):', 'Collez le texte d’une sauvegarde (le contenu d’un fichier .json) :') + '</div><textarea class="cd-bk-text" spellcheck="false"></textarea>';
      S.say('');
      S.keys([[T('Cancel', 'Annuler'), function () { S.close(); }], [T('Open', 'Ouvrir'), function () { opened(te.encode(S.body.querySelector('.cd-bk-text').value || ''), ''); }, true]]);
      try { S.body.querySelector('.cd-bk-text').focus(); } catch (e) {}
    }
    function askPass(again) {
      return new Promise(function (res) {
        S.busy(false); S.bar(null);
        S.body.innerHTML = '<div>' + T('This backup is sealed. Its passphrase:', 'Cette sauvegarde est scellée. Sa phrase secrète :') + '</div><input type="password" class="cd-bk-p1" autocomplete="current-password">';
        S.say(again ? T('That passphrase does not open it. Try again.', 'Cette phrase secrète ne l’ouvre pas. Réessayez.') : '', !!again);
        var inp = S.body.querySelector('.cd-bk-p1');
        function ok() { S.busy(true); S.keys([]); S.say(T('Opening…', 'Ouverture…')); res(inp.value); }
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') ok(); });
        S.keys([[T('Cancel', 'Annuler'), function () { res(null); S.close(); }], [T('Open', 'Ouvrir'), ok, true]]);
        try { inp.focus(); } catch (e) {}
      });
    }
    function opened(u8, name) {
      S.busy(true); on('read', 0.9);
      read(u8, askPass).then(function (obj) {
        S.busy(false); S.bar(null); S.say('');
        var made = obj.when ? new Date(obj.when) : null;
        S.body.innerHTML = core.holds(obj, fr()) + (made && !isNaN(made) ? '<div class="cd-bk-note">' + T('Made ', 'Faite ') + when(made.getTime()) + (obj.build ? T(', by build ', ', par la version ') + String(obj.build).replace(/[^0-9]/g, '') : '') + '.</div>' : '')
          + '<div class="cd-bk-note">' + T('Merge keeps your present work and lays the backup over it. Replace puts the backup in its place. Either way a copy of your present work is kept first, and Carpe Diem then starts again.',
            'Fusionner garde votre travail actuel et y applique la sauvegarde. Remplacer met la sauvegarde à sa place. Dans les deux cas, une copie de votre travail actuel est d’abord gardée, puis Carpe Diem redémarre.') + '</div>';
        S.keys([[T('Cancel', 'Annuler'), function () { S.close(); }], [T('Merge', 'Fusionner'), function () { apply(obj, true); }], [T('Replace', 'Remplacer'), function () { apply(obj, false); }, true]]);
      })['catch'](function (e) {
        S.busy(false); S.bar(null);
        if (e && e.code === 'stopped') return;
        S.say(((e && e.message) || e) + '', true);
        S.keys([[T('Choose another file', 'Choisir un autre fichier'), chooser, true], [T('Close', 'Fermer'), function () { S.close(); }]]);
      });
    }
    function apply(obj, merge, anyway) {
      var changed = false;
      S.busy(true); S.keys([]);
      (anyway ? Promise.resolve(null) : safetyCopy(on)).then(function (kept) {
        changed = true;
        on('rooms', 0.1);
        return closeRooms().then(function () { return restoreInto(obj, merge, on); }).then(function (r) {
          var msg = T('Restored. Carpe Diem starts again.', 'Restaurée. Carpe Diem redémarre.');
          if (kept) msg += ' ' + T('Your work as it was is kept in ', 'Votre travail tel qu’il était est gardé dans ') + kept + '.';
          if (r.failed.length) msg += ' ' + T(r.failed.length + ' item(s) did not fit in this device’s store: ', r.failed.length + ' élément(s) n’ont pas tenu dans la réserve de cet appareil : ') + r.failed.slice(0, 4).join(', ') + '.';
          S.say(msg, !!r.failed.length);
          try { sessionStorage.setItem('cd_restored_at', String(Date.now())); } catch (e) {}
          setTimeout(function () { location.reload(); }, r.failed.length ? 6000 : 2200);
        });
      })['catch'](function (e) {
        S.busy(false); S.bar(null);
        if (changed) {
          S.say(T('The restore stopped part way (', 'La restauration s’est arrêtée en chemin (') + ((e && e.message) || e) + T('). Carpe Diem starts again; your work as it was is kept, to restore if need be.', '). Carpe Diem redémarre ; votre travail tel qu’il était est gardé, à restaurer au besoin.'), true);
          setTimeout(function () { location.reload(); }, 6000);
          return;
        }
        if (!anyway && String((e && e.message) || e) !== 'cancelled') {
          S.say(T('A copy of your present work could not be kept (', 'Une copie de votre travail actuel n’a pas pu être gardée (') + ((e && e.message) || e) + T('), so nothing has changed.', '), alors rien n’a changé.'), true);
          S.keys([[T('Cancel', 'Annuler'), function () { S.close(); }], [T('Restore without the copy', 'Restaurer sans la copie'), function () { apply(obj, merge, true); }]]);
        } else {
          S.say(T('Nothing has changed.', 'Rien n’a changé.'), true);
          S.keys([[T('Close', 'Fermer'), function () { S.close(); }, true]]);
        }
      });
    }
    S.keys([[T('Cancel', 'Annuler'), function () { S.close(); }], [T('Paste text…', 'Coller le texte…'), pasted], [T('Choose a file…', 'Choisir un fichier…'), chooser, true]]);
  }

  // ---------- every day, in the Mac and Windows apps ----------
  function auto() { return get(AUTO_KEY) || {}; }
  var lastInput = Date.now(), running = false, soon = null;
  ['keydown', 'pointerdown', 'wheel'].forEach(function (t) { window.addEventListener(t, function () { lastInput = Date.now(); }, true); });
  function dailyLine() {
    var a = auto();
    if (!host()) return '';
    if (!a.on) return T('Daily backups: off.', 'Sauvegardes quotidiennes : désactivées.');
    var l = a.last;
    if (!l) return T('Daily backups: on; the first is made within the hour.', 'Sauvegardes quotidiennes : activées ; la première est faite dans l’heure.');
    if (!l.ok) return T('Daily backups: the last try ', 'Sauvegardes quotidiennes : le dernier essai ') + when(l.at) + T(' failed (', ' a échoué (') + (l.error || '?') + ').';
    return T('Daily backups: last ', 'Sauvegardes quotidiennes : la dernière ') + when(l.at) + ', ' + (l.where || '') + ', ' + size(l.size || 0) + (l.sealed ? T(', sealed', ', scellée') : '') + '.';
  }
  function tick(force) {
    var a = auto();
    if (running || !a.on || !host()) return Promise.resolve(false);
    var l = a.last || {}, now = Date.now();
    if (!force) {
      if (l.ok && now - (l.at || 0) < 20 * 3600000) return Promise.resolve(false);
      if (!l.ok && l.at && now - l.at < 30 * 60000) return Promise.resolve(false);
      if (now - lastInput < 60000) { if (!soon) soon = setTimeout(function () { soon = null; tick(false); }, 120000); return Promise.resolve(false); }
    }
    running = true;
    return Promise.all([gather(), storedSeal(), places()]).then(function (r) {
      var place = a.place || 'documents', p = r[2].filter(function (x) { return x.id === place; })[0];
      if (!p) throw new Error(T('the chosen place is not on this computer now', 'l’endroit choisi n’est pas sur cet ordinateur maintenant'));
      if (p.cloud && !r[1]) throw new Error(T('a passphrase is needed for a cloud folder', 'une phrase secrète est nécessaire pour un dossier en ligne'));
      return pack(r[0], r[1], function () {}).then(function (m) {
        return sendHost(place, 'carpe-diem-auto-' + stamp(m.when) + m.ext, m.bytes, function () {}, a.keep || 10).then(function (res) {
          var b = auto(); b.last = { at: Date.now(), ok: true, name: res.name, size: res.size, sealed: !!m.sealed, where: placeLabel(p), token: res.token }; b.fails = 0; put(AUTO_KEY, b);
          return true;
        });
      });
    })['catch'](function (e) {
      var b = auto(); b.last = { at: Date.now(), ok: false, error: String((e && e.message) || e) }; b.fails = (b.fails || 0) + 1; put(AUTO_KEY, b);
      if (b.fails === 3) { try { if (typeof window.say699 === 'function') window.say699('A daily backup failed three times: ' + b.last.error + '. Open Backup to see why.', 'Une sauvegarde quotidienne a échoué trois fois : ' + b.last.error + '. Ouvrez Sauvegarde pour savoir pourquoi.'); } catch (x) {} }
      return false;
    }).then(function (ok) { running = false; status(); return ok; });
  }
  function openDaily() {
    var S = sheet(T('Daily backups', 'Sauvegardes quotidiennes'));
    if (!host()) { S.body.innerHTML = '<div>' + T('Daily backups are made by the Mac and Windows apps.', 'Les sauvegardes quotidiennes sont faites par les applications Mac et Windows.') + '</div>'; S.keys([[T('Close', 'Fermer'), function () { S.close(); }, true]]); return; }
    S.busy(true); S.say(T('Looking for places…', 'Recherche des endroits…'));
    Promise.all([places(), storedSeal()]).then(function (r) {
      var list = r[0], kept = r[1], a = auto();
      S.busy(false); S.say(dailyLine());
      S.body.innerHTML = '<div class="cd-bk-note">' + T('While Carpe Diem is open, a backup of all your work is made once a day, and the last ten are kept. One kept in a cloud folder (iCloud Drive, OneDrive, Google Drive, Dropbox) is always sealed with your passphrase; your computer’s own program for that folder carries it to your account.',
        'Tant que Carpe Diem est ouvert, une sauvegarde de tout votre travail est faite une fois par jour, et les dix dernières sont gardées. Celle gardée dans un dossier en ligne (iCloud Drive, OneDrive, Google Drive, Dropbox) est toujours scellée avec votre phrase secrète ; le programme de votre ordinateur pour ce dossier la porte vers votre compte.') + '</div>'
        + '<label class="cd-bk-check"><input type="checkbox" class="cd-bk-on"' + (a.on ? ' checked' : '') + '> ' + T('Make a backup every day', 'Faire une sauvegarde chaque jour') + '</label>'
        + '<fieldset class="cd-bk-where"><legend>' + T('Where', 'Où') + '</legend>' + list.map(function (p) {
          return '<label><input type="radio" name="cd-bk-dplace" value="' + p.id + '" data-cloud="' + (p.cloud ? 1 : 0) + '"' + ((a.place || 'documents') === p.id ? ' checked' : '') + '> ' + placeLabel(p).replace(/[<>&]/g, '') + (p.cloud ? ' <span class="cd-bk-tag">' + T('sealed', 'scellée') + '</span>' : '') + '</label>';
        }).join('') + '</fieldset>'
        + (canSeal() ? '<label class="cd-bk-check"><input type="checkbox" class="cd-bk-seal"' + (kept ? ' checked' : '') + '> ' + T('Seal them with a passphrase (AES-256)', 'Les sceller avec une phrase secrète (AES-256)') + '</label>'
          + (kept ? '<div class="cd-bk-note cd-bk-kept">' + T('A passphrase is set (', 'Une phrase secrète est définie (') + when(kept.at || Date.now()) + T('). Only a key made from it is kept on this computer, never the passphrase itself. ', '). Seule une clé tirée d’elle est gardée sur cet ordinateur, jamais la phrase elle-même. ') + '<button type="button" class="cd-bk-change">' + T('Change it', 'La changer') + '</button></div>' : '')
          + passFields(T(LOSE[0], LOSE[1])) : '');
      var sealBox = S.body.querySelector('.cd-bk-seal'), passBox = S.body.querySelector('.cd-bk-pass'), changing = !kept;
      function sync() {
        var r2 = S.body.querySelector('input[name="cd-bk-dplace"]:checked'), cloud = r2 && r2.getAttribute('data-cloud') === '1';
        if (sealBox) { if (cloud) sealBox.checked = true; sealBox.disabled = !!cloud; }
        if (passBox) passBox.hidden = !(sealBox && sealBox.checked && changing);
      }
      S.body.addEventListener('change', sync);
      var ch = S.body.querySelector('.cd-bk-change'); if (ch) ch.onclick = function () { changing = true; sync(); };
      sync();
      function keep(thenRun) {
        var on = S.body.querySelector('.cd-bk-on').checked, r2 = S.body.querySelector('input[name="cd-bk-dplace"]:checked');
        var place = r2 ? r2.value : 'documents', cloud = r2 && r2.getAttribute('data-cloud') === '1', wantSeal = !!(sealBox && sealBox.checked);
        var step = Promise.resolve();
        if (wantSeal && changing) { var pw = passOf(S); if (pw.bad) { S.say(pw.bad, true); return; } S.busy(true); S.say(T('Making the key from your passphrase…', 'Fabrication de la clé à partir de votre phrase secrète…')); step = keepSeal(pw.pass); }
        if (!wantSeal) { if (cloud) { S.say(T('A cloud folder needs a passphrase.', 'Un dossier en ligne demande une phrase secrète.'), true); return; } try { localStorage.removeItem(SEAL_KEY); } catch (e) {} }
        step.then(function () {
          var b = auto(); b.on = on; b.place = place; b.keep = b.keep || 10; if (b.place !== a.place) { b.last = null; b.fails = 0; } put(AUTO_KEY, b);
          S.busy(false); status();
          if (thenRun) { S.busy(true); S.say(T('Backing up now…', 'Sauvegarde en cours…')); return tick(true).then(function (ok) { S.busy(false); S.say(dailyLine(), !ok); }); }
          S.say(T('Saved. ', 'Enregistré. ') + dailyLine());
        })['catch'](function (e) { S.busy(false); S.say(String((e && e.message) || e), true); });
      }
      S.keys([[T('Close', 'Fermer'), function () { S.close(); }], [T('Back up now', 'Sauvegarder maintenant'), function () { keep(true); }], [T('Save', 'Enregistrer'), function () { keep(false); }, true]]);
    });
  }

  // ---------- the Backup panel ----------
  function status() {
    var p = document.getElementById('backup-panel'); if (!p) return;
    var line = document.getElementById('cd-bk-status');
    if (!line) { line = document.createElement('div'); line.id = 'cd-bk-status'; line.className = 'cd-bk-status'; var d = document.getElementById('backup-desc'); p.insertBefore(line, d || null); }
    var t = dailyLine(); if (line.textContent !== t) line.textContent = t; line.hidden = !t;
    var b = document.getElementById('cd-bk-daily');
    if (host() && !b) {
      var ex = document.getElementById('import-btn');
      if (ex && ex.parentNode) { b = document.createElement('button'); b.id = 'cd-bk-daily'; b.type = 'button'; b.className = 'btn btn-ghost btn-sm'; ex.parentNode.insertBefore(b, ex.nextSibling); b.onclick = function (e) { e.preventDefault(); openDaily(); }; }
    }
    if (b) { var lab = T('⟳ Every day…', '⟳ Chaque jour…'); if (b.textContent !== lab) b.textContent = lab; }
    var ex2 = document.getElementById('export-btn'), im = document.getElementById('import-btn'), mg = document.getElementById('import-merge');
    var L1 = T('↓ Back up now', '↓ Sauvegarder maintenant'), L2 = T('↑ Restore from a backup', '↑ Restaurer une sauvegarde');
    if (ex2 && ex2.textContent !== L1) ex2.textContent = L1;
    if (im && im.textContent !== L2) im.textContent = L2;
    if (mg && mg.parentNode && mg.parentNode.style.display !== 'none') mg.parentNode.style.display = 'none';
  }
  window.addEventListener('click', function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('#export-btn,#import-btn') : null;
    if (!b) return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    if (b.id === 'export-btn') openBackup(); else openRestore();
  }, true);
  status(); setInterval(status, 3000);
  // a change of language (the page's lang) relabels the panel at once, before it is painted
  try { new MutationObserver(function () { status(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] }); } catch (e) {}
  try {
    var back = +sessionStorage.getItem('cd_restored_at');
    if (back && Date.now() - back < 120000) {
      sessionStorage.removeItem('cd_restored_at');
      setTimeout(function () { try { if (typeof window.say699 === 'function') window.say699('Your backup is restored.', 'Votre sauvegarde est restaurée.'); } catch (e) {} }, 2500);
    }
  } catch (e) {}
  setTimeout(function () { tick(false); }, 180000);
  setInterval(function () { tick(false); }, 1800000);

  window.cdBackup = { open: openBackup, restore: openRestore, daily: openDaily, tick: tick, status: dailyLine,
    _pack: pack, _read: read, _gather: gather, _seal: keepSeal };
})();
