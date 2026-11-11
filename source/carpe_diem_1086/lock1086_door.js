/* Carpe Diem 1086: the sign-in, as Ingenium has it, in Carpe Diem's own look. A copy with a sign-in opens to it; the
   rest of the app does not start until the password (or the recovery phrase) opens the data key. Setting it up, the
   recovery phrase, changing the password, locking, and turning it off are here too. */
(function () {
  'use strict';
  var W = window, D = document, L = W.cdLock;
  if (!L || W.cdLockUI) return;
  var MIN_PW = 8, N_WORDS = 10, IDLE_DEFAULT = 15;
  var WORDS = '/*@WORDS@*/'.split(' ');
  var TE = new TextEncoder(), TD = new TextDecoder();
  var top_ = (function () { try { return W.top === W; } catch (e) { return false; } })();

  /* ---------- words ---------- */
  function lang() {
    try { if (typeof state !== 'undefined' && state && state.lang) return state.lang === 'fr' ? 'fr' : 'en'; } catch (e) {}
    try { var r = L.rec(); if (r && r.look && r.look.lang) return r.look.lang === 'fr' ? 'fr' : 'en'; } catch (e) {}
    try { var s = JSON.parse(L.raw.get.call(L.store, 'carpe_diem_offline_v1') || 'null'); if (s && s.lang === 'fr') return 'fr'; } catch (e) {}
    return 'en';
  }
  function T(en, fr) { return lang() === 'fr' ? fr : en; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var CANT = function () { return T('A sign-in with a password works only where the browser offers its cryptography: in the Carpe Diem apps, or a page opened at localhost or over https. Here it cannot be turned on, and a sealed copy cannot be opened.', 'Une connexion par mot de passe ne fonctionne que là où le navigateur offre sa cryptographie : dans les applications Carpe Diem, ou une page ouverte à localhost ou en https. Ici, elle ne peut pas être activée, et un exemplaire scellé ne peut pas être ouvert.'); };

  /* ---------- the record's cryptography ---------- */
  var S = L.subtle, b64e = L.b64e, b64d = L.b64d, rnd = L.rnd, CHECK = L.names.CHECK;
  function kdf(secret, salt, iter) { var s = S(); return s.importKey('raw', TE.encode(String(secret).normalize('NFC')), 'PBKDF2', false, ['deriveKey']).then(function (k) { return s.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: iter }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); }); }
  function enc(key, iv, aad, bytes) { return S().encrypt({ name: 'AES-GCM', iv: iv, additionalData: TE.encode(aad), tagLength: 128 }, key, bytes).then(function (b) { return new Uint8Array(b); }); }
  function dec(key, iv, aad, bytes) { return S().decrypt({ name: 'AES-GCM', iv: iv, additionalData: TE.encode(aad), tagLength: 128 }, key, bytes).then(function (b) { return new Uint8Array(b); }); }
  function importDek(raw) { return S().importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']); }
  function calibrate() { var salt = rnd(16), t0 = Date.now(); return kdf('calibration', salt, 600000).then(function () { var ms = Math.max(Date.now() - t0, 40), it = Math.round(600000 * 750 / ms / 10000) * 10000; return Math.max(600000, Math.min(2000000, it)); }); }
  function normPhrase(s) { return String(s || '').normalize('NFC').toLowerCase().replace(/[^a-z\s]/g, ' ').trim().split(/\s+/).filter(Boolean).join(' '); }
  function makePhrase() { var w = [], seen = {}; while (w.length < N_WORDS) { var u = new Uint16Array(8); crypto.getRandomValues(u); for (var i = 0; i < u.length && w.length < N_WORDS; i++) { var x = WORDS[u[i] & 511]; if (!seen[x]) { seen[x] = 1; w.push(x); } } } return w; }
  function look() { var o = { lang: lang(), theme: 'day', mode: '' }; try { if (typeof state !== 'undefined' && state) { o.theme = state.theme === 'night' ? 'night' : 'day'; o.mode = state.mode || ''; } else { var r = L.rec(); if (r && r.look) { o.theme = r.look.theme; o.mode = r.look.mode; } } } catch (e) {} return o; }
  function makeRecord(user, password, phrase) {
    var dekRaw = rnd(32), salt = rnd(16), rsalt = rnd(16);
    return calibrate().then(function (iter) {
      return Promise.all([kdf(password, salt, iter), kdf(normPhrase(phrase), rsalt, iter)]).then(function (ks) {
        var iv1 = rnd(12), iv2 = rnd(12);
        return Promise.all([enc(ks[0], iv1, 'carpe-diem-lock dek', dekRaw), enc(ks[1], iv2, 'carpe-diem-lock recovery', dekRaw), importDek(dekRaw)]).then(function (r) {
          var iv3 = rnd(12), iv4 = rnd(12);
          return Promise.all([enc(r[2], iv3, 'carpe-diem-lock check', TE.encode(CHECK)), enc(r[2], iv4, 'carpe-diem-lock phrase', TE.encode(normPhrase(phrase)))]).then(function (c) {
            return { rec: { v: 1, user: String(user || '').slice(0, 60), made: Date.now(), changed: Date.now(), idle: IDLE_DEFAULT, look: look(),
              kdf: { name: 'PBKDF2', hash: 'SHA-256', iter: iter, salt: b64e(salt) }, dek: { iv: b64e(iv1), ct: b64e(r[0]) },
              rec: { iter: iter, salt: b64e(rsalt), iv: b64e(iv2), ct: b64e(r[1]) }, check: { iv: b64e(iv3), ct: b64e(c[0]) }, phr: { iv: b64e(iv4), ct: b64e(c[1]) } }, dekRaw: dekRaw };
          });
        });
      });
    });
  }
  function openWith(rec, secret, which) {
    if (!S()) return Promise.reject(new Error('nosubtle'));
    var w = which === 'rec' ? rec.rec : rec.dek, salt = b64d(which === 'rec' ? rec.rec.salt : rec.kdf.salt), iter = which === 'rec' ? rec.rec.iter : rec.kdf.iter;
    return kdf(secret, salt, iter).then(function (k) { return dec(k, b64d(w.iv), which === 'rec' ? 'carpe-diem-lock recovery' : 'carpe-diem-lock dek', b64d(w.ct)); })
      .then(function (raw) { if (!L.proves(raw, rec)) throw new Error('check'); return raw; });
  }
  function rewrap(rec, raw, pw) {
    var salt = rnd(16), iter = (rec.kdf && rec.kdf.iter) || 600000;
    return kdf(pw, salt, iter).then(function (k) { var iv = rnd(12); return enc(k, iv, 'carpe-diem-lock dek', raw).then(function (ct) {
      var r = JSON.parse(JSON.stringify(rec)); r.kdf = { name: 'PBKDF2', hash: 'SHA-256', iter: iter, salt: b64e(salt) }; r.dek = { iv: b64e(iv), ct: b64e(ct) }; r.changed = Date.now();
      if (!L.writeRec(r)) throw new Error(T('This device’s store refused the change.', 'La mémoire de cet appareil a refusé le changement.')); return r; }); });
  }
  function phraseOf(rec, raw) { return importDek(raw).then(function (k) { return dec(k, b64d(rec.phr.iv), 'carpe-diem-lock phrase', b64d(rec.phr.ct)); }).then(function (u) { return TD.decode(u); }); }
  function sameName(a, b) { function n(x) { return String(x || '').normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase(); } return n(a) === n(b); }

  /* ---------- the stores, sealed and opened whole ---------- */
  var DBS = [
    { db: 'tabula-big', st: 'kv', aad: function (k) { return 'idb:tabula-big/kv/' + k; } },
    { db: 'scriba_db', st: 'recordings', keep: ['id'], aad: function (k) { return 'idb:scriba_db/recordings/' + k; } },
    { db: 'cd-room', st: 'd', aad: function (k) { return 'idb:cd-room/d/' + k; } },
    { db: 'cd-backups', st: 'files', aad: function (k) { return 'idb:cd-backups/files/' + k; } }
  ];
  W.cdLockAad = function (db, st, k) { for (var i = 0; i < DBS.length; i++) if (DBS[i].db === db && DBS[i].st === st) return DBS[i].aad(k); return null; };
  function existing(name) {
    return new Promise(function (res) { if (!W.indexedDB) { res(null); return; } var made = false, rq; try { rq = indexedDB.open(name); } catch (e) { res(null); return; }
      rq.onupgradeneeded = function (ev) { if (ev.oldVersion === 0) { made = true; try { rq.transaction.abort(); } catch (e) {} } };
      rq.onsuccess = function () { var d = rq.result; if (made) { try { d.close(); } catch (e) {} res(null); return; } d.onversionchange = function () { try { d.close(); } catch (e) {} }; res(d); };
      rq.onerror = function (ev) { try { ev.preventDefault(); } catch (e) {} res(null); }; rq.onblocked = function () { res(null); }; });
  }
  function rq(r) { return new Promise(function (res, rej) { r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); }
  function walkDb(spec, dir, say) {
    return existing(spec.db).then(function (d) {
      if (!d) return { n: 0, bad: 0 };
      if (!d.objectStoreNames.contains(spec.st)) { d.close(); return { n: 0, bad: 0 }; }
      var keysP = rq(d.transaction(spec.st, 'readonly').objectStore(spec.st).getAllKeys()), done = 0, bad = 0;
      return keysP.then(function (keys) {
        return (keys || []).reduce(function (p, k) {
          return p.then(function () {
            return rq(d.transaction(spec.st, 'readonly').objectStore(spec.st).get(k)).then(function (v) {
              if (v == null) return;
              var sealedNow = L.isRecEnv(v);
              if (dir === 'seal' && sealedNow) return;
              if (dir === 'open' && !sealedNow) return;
              var work = dir === 'seal' ? L.sealVal(v, spec.aad(k), spec.keep) : L.openVal(v, spec.aad(k));
              return work.then(function (w) {
                return new Promise(function (res) {
                  var t = d.transaction(spec.st, 'readwrite'), s = t.objectStore(spec.st), g = s.get(k);
                  g.onsuccess = function () { var cur = g.result; var still = dir === 'seal' ? (cur != null && !L.isRecEnv(cur)) : (L.isRecEnv(cur) && cur.env === v.env);
                    if (still) { if (s.keyPath != null) s.put(w); else s.put(w, k); done++; } };
                  t.oncomplete = function () { res(); }; t.onerror = t.onabort = function () { bad++; res(); };
                });
              }, function () { bad++; });
            }).then(function () { if (say) say(); });
          });
        }, Promise.resolve());
      }).then(function () { try { d.close(); } catch (e) {} return { n: done, bad: bad }; }, function () { try { d.close(); } catch (e) {} return { n: done, bad: bad + 1 }; });
    });
  }
  function walkLS(dir) {
    var raw = L.raw, ls = L.store, ks = [], done = 0, bad = [];
    try { for (var i = 0; i < ls.length; i++) { var k = raw.key.call(ls, i); if (k && k !== L.names.LSK && k.lastIndexOf(L.names.ASIDE, 0) !== 0) ks.push(k); } } catch (e) {}
    return ks.reduce(function (p, k) {
      return p.then(function () {
        var v = raw.get.call(ls, k); if (v == null) return;
        if (dir === 'seal') { if (L.isEnv(v)) return; return L.sealText(v, 'ls:' + k).then(function (env) { try { if (raw.get.call(ls, k) === v) { raw.set.call(ls, k, env); done++; } } catch (e) { bad.push(k); } }); }
        if (!L.isEnv(v)) return;
        return L.openText(v, 'ls:' + k).then(function (t) { try { if (raw.get.call(ls, k) === v) { raw.set.call(ls, k, t); done++; } } catch (e) { bad.push(k); } }, function () { bad.push(k); });
      });
    }, Promise.resolve()).then(function () { return { n: done, bad: bad }; });
  }
  function walkAll(dir, say) {
    var total = { n: 0, bad: [] };
    return walkLS(dir).then(function (r) { total.n += r.n; total.bad = total.bad.concat(r.bad); if (say) say(1, 5); })
      .then(function () { return DBS.reduce(function (p, spec, i) { return p.then(function () { return walkDb(spec, dir).then(function (r) { total.n += r.n; if (r.bad) total.bad.push(spec.db); if (say) say(i + 2, 5); }); }); }, Promise.resolve()); })
      .then(function () { return total; });
  }

  /* ---------- the door ---------- */
  var DOOR = null, CARD = null;
  function night() { var lk = look(); return lk.theme === 'night'; }
  /* the seal is the app's own icon, carried in the page itself, by day and by night */
  var SEAL_DAY = '/*@SEAL_DAY@*/', SEAL_NIGHT = '/*@SEAL_NIGHT@*/';
  function seal() { return '<img class="cdl-seal" alt="" width="88" height="88" src="' + (night() ? SEAL_NIGHT : SEAL_DAY) + '">'; }
  function door(over) {
    if (!DOOR) {
      DOOR = D.createElement('div'); DOOR.id = 'cdLockDoor'; DOOR.setAttribute('role', 'dialog'); DOOR.setAttribute('aria-modal', 'true');
      CARD = D.createElement('div'); CARD.className = 'cdl-card'; DOOR.appendChild(CARD);
      (D.body || D.documentElement.appendChild(D.createElement('body'))).appendChild(DOOR);
    }
    DOOR.setAttribute('aria-label', T('Carpe Diem’s sign-in', 'La connexion de Carpe Diem'));
    DOOR.classList.toggle('cdl-night', night()); DOOR.classList.toggle('cdl-over', !!over); DOOR.hidden = false; return CARD;
  }
  function view(html, over) {
    var c = door(over); c.innerHTML = html; c.scrollTop = 0;
    setTimeout(function () { var ins = [].slice.call(c.querySelectorAll('input:not([type=hidden])')), f = null; for (var i = 0; i < ins.length; i++) if (!ins[i].value) { f = ins[i]; break; } f = f || ins[0] || c.querySelector('button.cdl-key'); if (f) { try { f.focus(); } catch (e) {} } }, 40);
    return c;
  }
  function closeDoor() { if (DOOR) { DOOR.hidden = true; CARD.innerHTML = ''; } }
  function doorOpen() { return !!(DOOR && !DOOR.hidden); }
  D.addEventListener('keydown', function (e) {
    if (!doorOpen()) return;
    if (e.key === 'Escape' && DOOR.classList.contains('cdl-over')) { var cx = CARD.querySelector('#cdlCancel,#cdlClose,#cdlDone'); if (cx && !cx.disabled) { e.preventDefault(); e.stopPropagation(); cx.click(); } return; }
    if (e.key !== 'Tab') return;
    var f = [].slice.call(CARD.querySelectorAll('input:not([type=hidden]),button,select,a[href]')).filter(function (x) { return !x.disabled && x.offsetParent !== null; }); if (!f.length) return;
    var a = D.activeElement, first = f[0], last = f[f.length - 1];
    if (!CARD.contains(a)) { e.preventDefault(); first.focus(); } else if (e.shiftKey && a === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  }, true);
  function err(c, msg) { var e = c.querySelector('.cdl-err'); if (!e) { e = D.createElement('p'); e.className = 'cdl-err'; e.setAttribute('role', 'alert'); var f = c.querySelector('form') || c; f.insertBefore(e, f.querySelector('label,.cdl-words,.cdl-keys')); } e.textContent = msg || ''; e.hidden = !msg; }
  function busyKeys(c, on) { [].forEach.call(c.querySelectorAll('.cdl-key,.cdl-link'), function (b) { b.disabled = !!on; }); }
  function head(t, sub) { return '<div class="cdl-head">' + seal() + '<div class="cdl-word">Carpe Diem</div><div class="cdl-line"><span></span><b>XVI\u00b7AVGVSTI\u00b7MMXXVI</b><span></span></div></div>' + (t ? '<h2>' + esc(t) + '</h2>' : '') + (sub ? '<p class="cdl-sub">' + esc(sub) + '</p>' : ''); }
  function pwFields(l1, l2) { return '<label><span>' + esc(l1) + '</span><input type="password" id="cdlP1" autocomplete="new-password"></label><label><span>' + esc(l2) + '</span><input type="password" id="cdlP2" autocomplete="new-password"></label>'; }
  function pwCheck(c) { var a = c.querySelector('#cdlP1').value, b = c.querySelector('#cdlP2').value; if (a.length < MIN_PW) { err(c, T('Choose a password of at least eight characters.', 'Choisissez un mot de passe d’au moins huit caractères.')); return null; } if (a !== b) { err(c, T('The two passwords are not the same.', 'Les deux mots de passe ne sont pas identiques.')); return null; } return a; }
  function wordsHtml(w) { return '<div class="cdl-words" aria-label="' + esc(T('Your recovery phrase', 'Votre phrase de secours')) + '">' + w.map(function (x, i) { return '<div><b>' + (i + 1) + '</b>' + esc(x) + '</div>'; }).join('') + '</div>'; }
  function toast(t) { try { if (typeof W.cdSaveNotice === 'function') { W.cdSaveNotice(true, t); return; } } catch (e) {} try { var n = D.createElement('div'); n.className = 'cdl-toast'; n.textContent = t; D.body.appendChild(n); setTimeout(function () { n.remove(); }, 4200); } catch (e) {} }

  /* ---------- signing in ---------- */
  function signIn(msg) {
    var rec = L.rec(), name = rec && rec.user ? rec.user : '';
    var c = view(head('', name ? T('Welcome back, ', 'Bon retour, ') + name + '.' : T('Welcome back.', 'Bon retour.'))
      + '<form id="cdlSign" autocomplete="on"><label><span>' + esc(T('Your user name', 'Votre nom d’utilisateur')) + '</span><input type="text" id="cdlName" autocomplete="username" autocapitalize="off" spellcheck="false" value="' + esc(name) + '"></label>'
      + '<label><span>' + esc(T('Your password', 'Votre mot de passe')) + '</span><input type="password" id="cdlPw" autocomplete="current-password" autocapitalize="off"></label>'
      + '<div class="cdl-keys"><button type="button" class="cdl-link" id="cdlForgot">' + esc(T('Forgot your password?', 'Mot de passe oublié ?')) + '</button><button type="submit" class="cdl-key" id="cdlGo">' + esc(T('Sign in', 'Se connecter')) + '</button></div></form>'
      + '<p class="cdl-note">' + esc(T('Your work on this device is sealed with your password. Nothing in it opens without it.', 'Votre travail sur cet appareil est scellé par votre mot de passe. Rien ne s’ouvre sans lui.')) + '</p>', false);
    if (msg) err(c, msg);
    if (!S()) { err(c, CANT()); busyKeys(c, true); return; }
    c.querySelector('#cdlForgot').onclick = function () { forgot(); };
    c.querySelector('#cdlSign').onsubmit = function (e) {
      e.preventDefault(); var pw = c.querySelector('#cdlPw').value, nm = c.querySelector('#cdlName').value;
      if (name && !sameName(nm, name)) { err(c, T('That user name and password do not open this copy. Nothing was changed.', 'Ce nom d’utilisateur et ce mot de passe n’ouvrent pas cet exemplaire. Rien n’a été modifié.')); return; }
      if (!pw) { err(c, T('Type your password.', 'Saisissez votre mot de passe.')); return; }
      err(c, ''); busyKeys(c, true); var go = c.querySelector('#cdlGo'), was = go.textContent; go.textContent = T('Opening…', 'Ouverture…');
      openWith(rec, pw, 'dek').then(function (raw) { enter(raw); }, function (x) {
        busyKeys(c, false); go.textContent = was;
        err(c, x && x.message === 'nosubtle' ? CANT() : T('That password does not open this copy. Nothing was changed.', 'Ce mot de passe n’ouvre pas cet exemplaire. Rien n’a été modifié.'));
        var i = c.querySelector('#cdlPw'); if (i) { i.value = ''; try { i.focus(); } catch (_) {} }
      });
    };
  }
  function enter(raw) {
    L.hold(raw);
    try { var r = L.rec(); if (r) { r.lastIn = Date.now(); L.writeRec(r); } } catch (e) {}
    view(head('', T('Opening your desk…', 'Ouverture de votre bureau…')), false);
    setTimeout(function () { try { location.reload(); } catch (e) {} }, 30);
  }
  function forgot() {
    var c = view(head(T('Forgot your password?', 'Mot de passe oublié ?'), T('Type the ten words of your recovery phrase, in their order, with spaces between them. Capital letters do not matter.', 'Saisissez les dix mots de votre phrase de secours, dans leur ordre, séparés par des espaces. Les majuscules n’ont pas d’importance.'))
      + '<form id="cdlFg" autocomplete="off"><label><span>' + esc(T('Your recovery phrase', 'Votre phrase de secours')) + '</span><input type="text" id="cdlPhrase" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' + esc(T('ten words', 'dix mots')) + '"></label>'
      + '<div class="cdl-keys"><button type="button" class="cdl-link" id="cdlBack">' + esc(T('Back to the sign-in', 'Retour à la connexion')) + '</button><button type="submit" class="cdl-key">' + esc(T('Open with the phrase', 'Ouvrir avec la phrase')) + '</button></div></form>'
      + '<p class="cdl-note"><button type="button" class="cdl-link" id="cdlNeither">' + esc(T('I have neither the password nor the phrase', 'Je n’ai ni le mot de passe ni la phrase')) + '</button></p>', false);
    c.querySelector('#cdlBack').onclick = function () { signIn(); };
    c.querySelector('#cdlNeither').onclick = function () { neither(); };
    c.querySelector('#cdlFg').onsubmit = function (e) {
      e.preventDefault(); var ph = normPhrase(c.querySelector('#cdlPhrase').value);
      if (ph.split(' ').length < N_WORDS) { err(c, T('That is not the whole phrase: it has ten words.', 'Ce n’est pas toute la phrase : elle a dix mots.')); return; }
      busyKeys(c, true); err(c, '');
      openWith(L.rec(), ph, 'rec').then(function (raw) { newPassword(raw); }, function () { busyKeys(c, false); err(c, T('Those words do not open this copy. Check each word and their order; nothing was changed.', 'Ces mots n’ouvrent pas cet exemplaire. Vérifiez chaque mot et leur ordre ; rien n’a été modifié.')); });
    };
  }
  function newPassword(raw) {
    var c = view(head(T('Choose a new password', 'Choisissez un nouveau mot de passe'), T('Your phrase opened this copy. Choose the password you will sign in with from now on; the phrase stays as it is.', 'Votre phrase a ouvert cet exemplaire. Choisissez le mot de passe avec lequel vous vous connecterez désormais ; la phrase reste la même.'))
      + '<form id="cdlNp">' + pwFields(T('A new password (at least eight characters)', 'Un nouveau mot de passe (au moins huit caractères)'), T('The same password again', 'Le même mot de passe, encore une fois')) + '<div class="cdl-keys"><button type="submit" class="cdl-key">' + esc(T('Keep this password', 'Garder ce mot de passe')) + '</button></div></form>', false);
    c.querySelector('#cdlNp').onsubmit = function (e) { e.preventDefault(); var pw = pwCheck(c); if (!pw) return; busyKeys(c, true);
      rewrap(L.rec(), raw, pw).then(function () { enter(raw); }, function (x) { busyKeys(c, false); err(c, x && x.message || T('The password could not be kept.', 'Le mot de passe n’a pas pu être gardé.')); }); };
  }
  function neither() {
    var c = view(head(T('Start again with an empty copy?', 'Recommencer avec un exemplaire vide ?'), '')
      + '<p>' + esc(T('Without the password or the recovery phrase, what is sealed on this device cannot be opened: not by you, and not by anyone else. Carpe Diem can start again here, empty and with no sign-in.', 'Sans le mot de passe ni la phrase de secours, ce qui est scellé sur cet appareil ne peut être ouvert : ni par vous, ni par personne d’autre. Carpe Diem peut recommencer ici, vide et sans connexion.')) + '</p>'
      + '<p>' + esc(T('The sealed planner, notes and settings are kept aside on this device, unopened. Sealed documents and recordings stay where they are until something new is saved in their place.', 'Le planificateur, les notes et les réglages scellés sont mis de côté sur cet appareil, sans être ouverts. Les documents et enregistrements scellés restent où ils sont jusqu’à ce qu’autre chose soit enregistré à leur place.')) + '</p>'
      + '<div class="cdl-keys"><button type="button" class="cdl-key cdl-ghost" id="cdlBack">' + esc(T('Back', 'Retour')) + '</button><button type="button" class="cdl-key cdl-danger" id="cdlFresh">' + esc(T('Start again with an empty copy', 'Recommencer avec un exemplaire vide')) + '</button></div>', false);
    c.querySelector('#cdlBack').onclick = function () { forgot(); };
    c.querySelector('#cdlFresh').onclick = function () {
      busyKeys(c, true);
      var raw = L.raw, ls = L.store, ks = [];
      try { for (var i = 0; i < ls.length; i++) { var k = raw.key.call(ls, i); if (k && k.lastIndexOf(L.names.ASIDE, 0) !== 0) ks.push(k); } } catch (e) {}
      var at = Date.now();
      ks.forEach(function (k) { try { var v = raw.get.call(ls, k); if (k === L.names.LSK || L.isEnv(v)) { raw.set.call(ls, L.names.ASIDE + at + ':' + k, v); raw.rem.call(ls, k); } } catch (e) {} });
      try { W.sessionStorage.removeItem('cd_lock_s'); } catch (e) {}
      location.reload();
    };
  }

  /* ---------- the gate: a copy with a sign-in shows nothing else until it is opened ---------- */
  function gate() {
    if (L.startState !== 'locked' || !top_) return false;
    /* the rest of the page is read as plain text, so none of it runs; the page still finishes loading as it should */
    var held = false;
    if (D.readyState === 'loading') { try { D.write('<plaintext id="cdl-rest" hidden style="display:none !important">'); held = true; } catch (e) {} }
    if (!held) { try { W.stop(); } catch (e) {} }
    try { D.documentElement.classList.add('cdl-gate'); } catch (e) {}
    (function show(n) {
      if (!D.body && n < 200) { setTimeout(function () { show(n + 1); }, 10); return; }
      view(head('', T('Opening…', 'Ouverture…')), false);
      L.askOthers(450).then(function (raw) { if (raw && L.proves(raw, L.rec())) enter(raw); else signIn(); });
    })(0);
    return true;
  }

  /* ---------- inside the app: setting it up, and its sheet ---------- */
  function setup(opts) {
    opts = opts || {};
    if (!S()) { var c0 = view(head(T('Protect this copy with a sign-in', 'Protéger cet exemplaire par une connexion'), '') + '<p>' + esc(CANT()) + '</p><div class="cdl-keys"><button type="button" class="cdl-key cdl-ghost" id="cdlClose">' + esc(T('Close', 'Fermer')) + '</button></div>', true); c0.querySelector('#cdlClose').onclick = closeDoor; return; }
    if (L.rec()) { sheet(); return; }
    var pre = ''; try { pre = (typeof state !== 'undefined' && state && (state.userName || (state.profile && state.profile.name))) || ''; } catch (e) {}
    var c = view(head(T('Protect this copy with a sign-in', 'Protéger cet exemplaire par une connexion'), '')
      + '<p>' + esc(T('From then on Carpe Diem opens to a sign-in, and everything it keeps on this device is sealed with your password. Choose one you will remember: there is no way to reset it, only the recovery phrase shown next.', 'Dès lors, Carpe Diem s’ouvre sur une connexion, et tout ce qu’il garde sur cet appareil est scellé par votre mot de passe. Choisissez-en un dont vous vous souviendrez : il n’existe aucun moyen de le réinitialiser, seulement la phrase de secours montrée ensuite.')) + '</p>'
      + '<form id="cdlSet" autocomplete="off"><label><span>' + esc(T('Your user name (the sign-in asks for it, with the password)', 'Votre nom d’utilisateur (la connexion le demande, avec le mot de passe)')) + '</span><input type="text" id="cdlUser" maxlength="60" autocomplete="username" value="' + esc(pre) + '"></label>'
      + pwFields(T('A password (at least eight characters)', 'Un mot de passe (au moins huit caractères)'), T('The same password again', 'Le même mot de passe, encore une fois'))
      + '<div class="cdl-keys"><button type="button" class="cdl-key cdl-ghost" id="cdlCancel">' + esc(T('Not now', 'Pas maintenant')) + '</button><button type="submit" class="cdl-key">' + esc(T('Next', 'Suivant')) + '</button></div></form>', true);
    c.querySelector('#cdlCancel').onclick = closeDoor;
    c.querySelector('#cdlSet').onsubmit = function (e) { e.preventDefault(); var user = c.querySelector('#cdlUser').value.trim(), pw = pwCheck(c); if (!pw) return; if (!user) { err(c, T('Type the user name you will sign in with.', 'Saisissez le nom d’utilisateur avec lequel vous vous connecterez.')); return; } showPhrase(user, pw, null); };
  }
  function showPhrase(user, pw, w) {
    w = w || makePhrase();
    var c = view(head(T('Your recovery phrase', 'Votre phrase de secours'), '')
      + '<p>' + esc(T('Write these ten words down, in this order, and keep them somewhere safe, away from this device. If you ever forget your password, they are the only way back in. Without the password and without these words, no one can open this copy: not you, and not anyone else.', 'Notez ces dix mots, dans cet ordre, et gardez-les en lieu sûr, loin de cet appareil. Si vous oubliez un jour votre mot de passe, ils sont le seul moyen de revenir. Sans le mot de passe et sans ces mots, personne ne peut ouvrir cet exemplaire : ni vous, ni personne d’autre.')) + (lang() === 'fr' ? ' Les mots sont en anglais : écrivez-les tels quels.' : '') + '</p>'
      + wordsHtml(w) + '<div class="cdl-keys"><button type="button" class="cdl-key cdl-ghost" id="cdlBack">' + esc(T('Back', 'Retour')) + '</button><button type="button" class="cdl-key" id="cdlWrote">' + esc(T('I have written them down', 'Je les ai notés')) + '</button></div>', true);
    c.querySelector('#cdlBack').onclick = function () { setup(); };
    c.querySelector('#cdlWrote').onclick = function () { confirmPhrase(user, pw, w); };
  }
  function confirmPhrase(user, pw, w) {
    var i1 = Math.floor(Math.random() * N_WORDS), i2 = (i1 + 1 + Math.floor(Math.random() * (N_WORDS - 1))) % N_WORDS; if (i2 < i1) { var t = i1; i1 = i2; i2 = t; }
    var c = view(head(T('Two of the words, to be sure', 'Deux des mots, pour être sûr'), T('Type the words that stand in these two places of your phrase.', 'Saisissez les mots qui occupent ces deux places de votre phrase.'))
      + '<form id="cdlCf" autocomplete="off"><label><span>' + esc(T('Word ', 'Mot ')) + (i1 + 1) + '</span><input type="text" id="cdlW1" autocomplete="off" autocapitalize="off" spellcheck="false"></label><label><span>' + esc(T('Word ', 'Mot ')) + (i2 + 1) + '</span><input type="text" id="cdlW2" autocomplete="off" autocapitalize="off" spellcheck="false"></label>'
      + '<div class="cdl-keys"><button type="button" class="cdl-key cdl-ghost" id="cdlBack">' + esc(T('See the words again', 'Revoir les mots')) + '</button><button type="submit" class="cdl-key">' + esc(T('Seal this copy', 'Sceller cet exemplaire')) + '</button></div></form>', true);
    c.querySelector('#cdlBack').onclick = function () { showPhrase(user, pw, w); };
    c.querySelector('#cdlCf').onsubmit = function (e) {
      e.preventDefault();
      if (normPhrase(c.querySelector('#cdlW1').value) !== w[i1] || normPhrase(c.querySelector('#cdlW2').value) !== w[i2]) { err(c, T('Those are not the words in those places. Look at the list again.', 'Ce ne sont pas les mots de ces places. Revoyez la liste.')); return; }
      busyKeys(c, true); err(c, ''); sealing(user, pw, w);
    };
  }
  function progress(title) {
    var c = view(head(title, '') + '<div class="cdl-bar"><i style="width:4%"></i></div><p class="cdl-sub cdl-count"></p>', true);
    return function (i, n) { var b = c.querySelector('.cdl-bar i'); if (b) b.style.width = Math.max(4, Math.round(i / n * 100)) + '%'; var t = c.querySelector('.cdl-count'); if (t) t.textContent = T(i + ' of ' + n, i + ' sur ' + n); };
  }
  function sealing(user, pw, w) {
    var say = progress(T('Sealing what Carpe Diem keeps on this device…', 'Carpe Diem scelle ce qu’il garde sur cet appareil…'));
    try { if (typeof W.cdGatherWork === 'function') W.cdGatherWork(); } catch (e) {}
    makeRecord(user, pw, w.join(' ')).then(function (made) {
      L.hold(made.dekRaw);
      if (!L.writeRec(made.rec)) { L.drop(); throw new Error(T('This device’s store refused the sign-in’s record.', 'La mémoire de cet appareil a refusé l’enregistrement de la connexion.')); }
      return walkAll('seal', say).then(function (r) { done(r); });
    }).catch(function (x) { var c = view(head(T('The sign-in was not set', 'La connexion n’a pas été activée'), '') + '<p>' + esc(x && x.message || '') + '</p><div class="cdl-keys"><button type="button" class="cdl-key" id="cdlClose">' + esc(T('Close', 'Fermer')) + '</button></div>', true); c.querySelector('#cdlClose').onclick = closeDoor; });
  }
  function done(r) {
    var bad = r && r.bad && r.bad.length ? '<p class="cdl-err">' + esc(T('Some of it could not be sealed yet and will be at the next sign-in: ', 'Une part n’a pas encore pu être scellée ; elle le sera à la prochaine connexion : ') + r.bad.slice(0, 6).join(', ')) + '</p>' : '';
    var c = view(head(T('This copy is protected', 'Cet exemplaire est protégé'), '')
      + '<p>' + esc(T('From now on Carpe Diem opens to a sign-in. It locks itself after a quarter of an hour without use; the lock key on the welcome card changes that.', 'Désormais, Carpe Diem s’ouvre sur une connexion. Il se verrouille après un quart d’heure sans usage ; la clé du verrou, sur la carte d’accueil, permet de le changer.')) + '</p>' + bad
      + '<div class="cdl-keys"><button type="button" class="cdl-key" id="cdlDone">' + esc(T('Done', 'Terminé')) + '</button></div>', true);
    c.querySelector('#cdlDone').onclick = function () { closeDoor(); startIdle(); paintKey(); };
  }
  function idleWords(m) { return m === 5 ? T('five minutes', 'cinq minutes') : m === 60 ? T('an hour', 'une heure') : m === 0 ? T('never', 'jamais') : T('a quarter of an hour', 'un quart d’heure'); }
  function sheet() {
    var rec = L.rec(); if (!rec) { setup(); return; }
    var idle = rec.idle == null ? IDLE_DEFAULT : rec.idle;
    var opts = [5, 15, 60, 0].map(function (m) { return '<option value="' + m + '"' + (m === idle ? ' selected' : '') + '>' + esc(idleWords(m)) + '</option>'; }).join('');
    var c = view(head(T('Sign-in', 'Connexion'), T('This copy is protected, for ', 'Cet exemplaire est protégé, pour ') + (rec.user || '') + '.')
      + '<div class="cdl-col"><button type="button" class="cdl-key" id="cdlLock">' + esc(T('Lock now', 'Verrouiller maintenant')) + '</button>'
      + '<label class="cdl-row"><span>' + esc(T('Lock by itself after', 'Se verrouiller tout seul après')) + '</span><select id="cdlIdle">' + opts + '</select></label>'
      + '<button type="button" class="cdl-key cdl-ghost" id="cdlChange">' + esc(T('Change the password', 'Changer le mot de passe')) + '</button>'
      + '<button type="button" class="cdl-key cdl-ghost" id="cdlPhr">' + esc(T('See the recovery phrase', 'Voir la phrase de secours')) + '</button>'
      + '<button type="button" class="cdl-key cdl-ghost cdl-danger-text" id="cdlOff">' + esc(T('Turn the sign-in off', 'Désactiver la connexion')) + '</button></div>'
      + '<div class="cdl-keys"><button type="button" class="cdl-key cdl-ghost" id="cdlClose">' + esc(T('Close', 'Fermer')) + '</button></div>', true);
    c.querySelector('#cdlClose').onclick = closeDoor;
    c.querySelector('#cdlLock').onclick = function () { lockNow(); };
    c.querySelector('#cdlIdle').onchange = function () { var r = L.rec(); if (!r) return; r.idle = +this.value; r.changed = Date.now(); L.writeRec(r); startIdle(); toast(T('It locks itself after ', 'Il se verrouille après ') + idleWords(r.idle) + (r.idle ? '' : '') + '.'); };
    c.querySelector('#cdlChange').onclick = function () { askPassword(T('Change the password', 'Changer le mot de passe'), function (raw) { changePw(raw); }); };
    c.querySelector('#cdlPhr').onclick = function () { askPassword(T('See the recovery phrase', 'Voir la phrase de secours'), function (raw) { phraseOf(L.rec(), raw).then(function (p) { var c2 = view(head(T('Your recovery phrase', 'Votre phrase de secours'), '') + wordsHtml(p.split(' ')) + '<div class="cdl-keys"><button type="button" class="cdl-key" id="cdlDone">' + esc(T('Done', 'Terminé')) + '</button></div>', true); c2.querySelector('#cdlDone').onclick = sheet; }); }); };
    c.querySelector('#cdlOff').onclick = function () { turnOff(); };
  }
  function askPassword(title, then) {
    var c = view(head(title, '') + '<form id="cdlAsk"><label><span>' + esc(T('Your password', 'Votre mot de passe')) + '</span><input type="password" id="cdlPw" autocomplete="current-password"></label>'
      + '<div class="cdl-keys"><button type="button" class="cdl-key cdl-ghost" id="cdlCancel">' + esc(T('Back', 'Retour')) + '</button><button type="submit" class="cdl-key">' + esc(T('Go on', 'Continuer')) + '</button></div></form>', true);
    c.querySelector('#cdlCancel').onclick = sheet;
    c.querySelector('#cdlAsk').onsubmit = function (e) { e.preventDefault(); busyKeys(c, true); openWith(L.rec(), c.querySelector('#cdlPw').value, 'dek').then(function (raw) { then(raw); }, function () { busyKeys(c, false); err(c, T('That password does not open this copy. Nothing was changed.', 'Ce mot de passe n’ouvre pas cet exemplaire. Rien n’a été modifié.')); }); };
  }
  function changePw(raw) {
    var c = view(head(T('Choose a new password', 'Choisissez un nouveau mot de passe'), T('The recovery phrase stays as it is.', 'La phrase de secours reste la même.')) + '<form id="cdlNp">' + pwFields(T('A new password (at least eight characters)', 'Un nouveau mot de passe (au moins huit caractères)'), T('The same password again', 'Le même mot de passe, encore une fois'))
      + '<div class="cdl-keys"><button type="button" class="cdl-key cdl-ghost" id="cdlCancel">' + esc(T('Back', 'Retour')) + '</button><button type="submit" class="cdl-key">' + esc(T('Keep this password', 'Garder ce mot de passe')) + '</button></div></form>', true);
    c.querySelector('#cdlCancel').onclick = sheet;
    c.querySelector('#cdlNp').onsubmit = function (e) { e.preventDefault(); var pw = pwCheck(c); if (!pw) return; busyKeys(c, true); rewrap(L.rec(), raw, pw).then(function () { closeDoor(); toast(T('The new password is kept.', 'Le nouveau mot de passe est gardé.')); }, function (x) { busyKeys(c, false); err(c, x && x.message || ''); }); };
  }
  function turnOff() {
    var c = view(head(T('Turn the sign-in off?', 'Désactiver la connexion ?'), '')
      + '<p>' + esc(T('Everything Carpe Diem keeps on this device is opened again and kept as it was before the sign-in: anyone who opens Carpe Diem here will see it.', 'Tout ce que Carpe Diem garde sur cet appareil est rouvert et gardé comme avant la connexion : quiconque ouvre Carpe Diem ici le verra.')) + '</p>'
      + '<form id="cdlOffF"><label><span>' + esc(T('Your password', 'Votre mot de passe')) + '</span><input type="password" id="cdlPw" autocomplete="current-password"></label>'
      + '<div class="cdl-keys"><button type="button" class="cdl-key cdl-ghost" id="cdlCancel">' + esc(T('Back', 'Retour')) + '</button><button type="submit" class="cdl-key cdl-danger">' + esc(T('Turn it off', 'La désactiver')) + '</button></div></form>', true);
    c.querySelector('#cdlCancel').onclick = sheet;
    c.querySelector('#cdlOffF').onsubmit = function (e) {
      e.preventDefault(); busyKeys(c, true);
      openWith(L.rec(), c.querySelector('#cdlPw').value, 'dek').then(function () {
        var say = progress(T('Opening what Carpe Diem keeps on this device…', 'Carpe Diem rouvre ce qu’il garde sur cet appareil…'));
        try { if (typeof W.cdGatherWork === 'function') W.cdGatherWork(); } catch (e2) {}
        L.writePlain(true);
        return walkAll('open', say).then(function (r) {
          if (r.bad && r.bad.length) { L.writePlain(false); throw new Error(T('Some of it could not be opened, so the sign-in stays on: ', 'Une part n’a pas pu être rouverte ; la connexion reste donc active : ') + r.bad.slice(0, 6).join(', ')); }
          try { L.raw.rem.call(L.store, L.names.LSK); } catch (e4) {}
          L.drop(); try { L.tellLocked(); } catch (e5) {}
          location.reload();
        });
      }, function () { busyKeys(c, false); err(c, T('That password does not open this copy. Nothing was changed.', 'Ce mot de passe n’ouvre pas cet exemplaire. Rien n’a été modifié.')); })
        .catch(function (x) { var c2 = view(head(T('The sign-in stays on', 'La connexion reste active'), '') + '<p>' + esc(x && x.message || '') + '</p><div class="cdl-keys"><button type="button" class="cdl-key" id="cdlClose">' + esc(T('Close', 'Fermer')) + '</button></div>', true); c2.querySelector('#cdlClose').onclick = closeDoor; });
    };
  }

  /* ---------- locking ---------- */
  function lockNow(fromOther) {
    if (L.state() !== 'open' || !L.rec()) return;
    try { if (typeof W.cdGatherWork === 'function') W.cdGatherWork(); } catch (e) {}
    try { if (typeof saveState === 'function') saveState(); } catch (e) {}
    try { [].slice.call(D.querySelectorAll('iframe')).forEach(function (f) { try { var w = f.contentWindow; if (w.__tabulaFlush) w.__tabulaFlush(); } catch (e) {} }); } catch (e) {}
    setTimeout(function () {
      try { var r = L.rec(); if (r) { r.look = look(); L.writeRec(r); } } catch (e) {}
      L.drop(); if (!fromOther) L.tellLocked();
      try { location.reload(); } catch (e) {}
    }, 400);
  }
  L.lockNow = lockNow;
  var idleT = null, lastAct = Date.now();
  function act() { lastAct = Date.now(); }
  function startIdle() {
    if (idleT) { clearInterval(idleT); idleT = null; }
    var r = L.rec(); if (!r || !top_ || L.state() !== 'open') return;
    var m = r.idle == null ? IDLE_DEFAULT : r.idle; if (!m) return;
    idleT = setInterval(function () { if (Date.now() - lastAct > m * 60000) { clearInterval(idleT); idleT = null; lockNow(); } }, 15000);
  }
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (t) { D.addEventListener(t, act, { capture: true, passive: true }); });
  W.addEventListener('message', function (e) { if (e && e.data && e.data.cdLockAct) act(); });
  W.cdLockTouch = act;

  /* ---------- the key on the welcome card ---------- */
  function lockSvg(shut) { return '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2.2"/>' + (shut ? '<path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>' : '<path d="M8 10.5V7.5a4 4 0 0 1 7.6-1.7"/>') + '<circle cx="12" cy="15.5" r="1.3"/></svg>'; }
  function keyButton() {
    var b = D.createElement('button'); b.type = 'button'; b.className = 'cl-icon folio-btn cdl-doorkey';
    var shut = !!L.rec(); b.innerHTML = lockSvg(shut);
    b.title = shut ? T('Sign-in and lock', 'Connexion et verrouillage') : T('Protect this copy with a sign-in', 'Protéger cet exemplaire par une connexion');
    b.setAttribute('aria-label', b.title);
    b.onclick = function (e) { try { e.stopPropagation(); } catch (x) {} if (L.rec()) sheet(); else setup(); };
    return b;
  }
  function paintKey() {
    var d = D.getElementById('cd-door'); if (!d) return;
    var row = d.querySelector('.cd-door-cluster'); if (!row || row.parentNode.querySelector('.cdl-doorkey')) return;
    var wrap = row.parentNode; wrap.style.justifyContent = 'space-between'; wrap.style.alignItems = 'center';
    wrap.insertBefore(keyButton(), row);
  }
  W.cdLockUI = { setup: setup, sheet: sheet, lockNow: lockNow, paintKey: paintKey, walkAll: walkAll, signIn: signIn };

  if (gate()) return;
  function later() {
    try { new MutationObserver(function () { paintKey(); }).observe(D.body, { childList: true }); } catch (e) {}
    paintKey(); startIdle();
    L.onStoreFull(function (k) { toast(T('Not saved: this device has no room left for ', 'Non enregistré : cet appareil n’a plus de place pour ') + k + T('. Export a backup.', '. Faites une sauvegarde.')); });
    if (L.state() === 'open') setTimeout(function () { walkAll('seal').then(function (r) { if (r.n) toast(T('What was left on this device is now sealed too.', 'Ce qui restait sur cet appareil est maintenant scellé aussi.')); }, function () {}); }, 4000);
  }
  if (top_) { if (D.body) later(); else D.addEventListener('DOMContentLoaded', later); }
})();
