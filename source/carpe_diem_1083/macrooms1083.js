(function () {
  'use strict';
  if (window.__cdMacRooms1083) return; window.__cdMacRooms1083 = 1;
  // Build 1083. On a Mac, Tabula, Abacus, Imago, Scriba and Fontes are apps of their own (made by the Mac app since
  // 1073), kept in the home folder's Applications, where the owner could not find them. This gives them a place in the
  // app: one sheet that puts all five in the Dock, puts an alias of each on the Desktop, or shows them in the Finder.
  // It is offered from the menu of a room's floating window, and once, by a note, on a Mac that has none of them out.
  var ROOMS = ['Tabula', 'Abacus', 'Imago', 'Scriba', 'Fontes'], HINT = 'cd_macrooms_hint_1083';
  function fr() { try { if (typeof __cdAppLang === 'function') return __cdAppLang() === 'fr'; } catch (e) {}
    try { return typeof state !== 'undefined' && state && state.lang === 'fr'; } catch (e) { return false; } }
  function T(en, f) { return fr() ? f : en; }
  function api() { try { return (window.pywebview && window.pywebview.api) || null; } catch (e) { return null; } }
  function can() { var a = api(); return !!(a && typeof a.rooms_state === 'function' && typeof a.rooms_to_dock === 'function'); }
  function ask(name) { var a = api(); try { return Promise.resolve(a[name]()); } catch (e) { return Promise.reject(e); } }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function list(a) { return (a || []).join(', '); }
  function closeSheet() { try { var o = document.getElementById('cd-macrooms'); if (o) o.remove(); } catch (e) {} document.removeEventListener('keydown', onKey, true); }
  function onKey(ev) { if (ev && ev.key === 'Escape') { closeSheet(); try { ev.stopPropagation(); } catch (e) {} } }

  function sheet() {
    if (!can()) return false;
    closeSheet();
    var back = el('div', 'cd-macrooms-back'); back.id = 'cd-macrooms'; back.setAttribute('role', 'dialog'); back.setAttribute('aria-modal', 'true'); back.setAttribute('aria-labelledby', 'cd-macrooms-h');
    var card = el('div', 'cd-macrooms-card');
    var h = el('h2', '', T('The rooms as apps on this Mac', 'Les pièces comme applications sur ce Mac')); h.id = 'cd-macrooms-h'; card.appendChild(h);
    card.appendChild(el('p', '', T('Tabula, Abacus, Imago, Scriba and Fontes are also apps of their own, each with its own name and icon. Opened from the Dock, the Desktop or Spotlight, each one opens its room in a window of its own, with the same work. Carpe Diem starts by itself if it is closed.',
      'Tabula, Abacus, Imago, Scriba et Fontes sont aussi des applications à part entière, chacune avec son nom et son icône. Ouverte depuis le Dock, le bureau ou Spotlight, chacune ouvre sa pièce dans sa propre fenêtre, avec le même travail. Carpe Diem démarre de lui-même s’il est fermé.')));
    var ul = el('ul', 'cd-macrooms-names'); ROOMS.forEach(function (n) { ul.appendChild(el('li', '', n)); }); card.appendChild(ul);
    var keys = el('div', 'cd-macrooms-keys'), status = el('div', 'cd-macrooms-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    function say(t) { status.textContent = t || ''; }
    function key(label, sub, fn) { var b = el('button', 'cd-macrooms-key'); b.type = 'button'; b.appendChild(el('b', '', label)); b.appendChild(el('span', '', sub));
      b.onclick = function () { var all = keys.querySelectorAll('button'), i; for (i = 0; i < all.length; i++) all[i].disabled = true; say(T('One moment…', 'Un instant…'));
        fn().then(function (t) { say(t); }, function () { say(T('That did not work on this Mac.', 'Cela n’a pas fonctionné sur ce Mac.')); }).then(function () { for (i = 0; i < all.length; i++) all[i].disabled = false; }); };
      keys.appendChild(b); return b; }
    key(T('Add all five to the Dock', 'Ajouter les cinq au Dock'), T('Each with its own icon. The Dock closes and comes back once.', 'Chacune avec sa propre icône. Le Dock se ferme et revient une fois.'), function () {
      return ask('rooms_to_dock').then(function (r) { r = r || {};
        if (r.failed && r.failed.length) return T('The Dock did not take: ', 'Le Dock n’a pas pris : ') + list(r.failed) + '.';
        if (r.added && r.added.length) return T('In the Dock now: ', 'Maintenant dans le Dock : ') + list(r.added) + '.' + (r.there && r.there.length ? T(' Already there: ', ' Déjà présentes : ') + list(r.there) + '.' : '');
        return T('All five were in the Dock already.', 'Les cinq étaient déjà dans le Dock.'); }); });
    key(T('Put them on the Desktop', 'Les mettre sur le bureau'), T('An alias of each, to open it from there. If the Mac asks whether Carpe Diem may use the Desktop folder, choose Allow.', 'Un alias de chacune, pour l’ouvrir de là. Si le Mac demande si Carpe Diem peut utiliser le dossier Bureau, choisissez Autoriser.'), function () {
      return ask('rooms_to_desktop').then(function (r) { r = r || {};
        if (r.failed && r.failed.length) return T('The Desktop did not take: ', 'Le bureau n’a pas pris : ') + list(r.failed) + T('. In System Settings, Privacy and Security, Files and Folders, allow Carpe Diem the Desktop folder, then try again.', '. Dans Réglages Système, Confidentialité et sécurité, Fichiers et dossiers, autorisez le dossier Bureau à Carpe Diem, puis réessayez.');
        if (r.made && r.made.length) return T('On the Desktop now: ', 'Maintenant sur le bureau : ') + list(r.made) + '.';
        return T('All five were on the Desktop already.', 'Les cinq étaient déjà sur le bureau.'); }); });
    key(T('Show them in the Finder', 'Les montrer dans le Finder'), T('The folder that holds them opens. From there, drag one wherever you like.', 'Le dossier qui les contient s’ouvre. De là, faites glisser celle que vous voulez où vous voulez.'), function () {
      return ask('rooms_reveal').then(function (r) { return (r && r.ok) ? T('The Finder shows the folder.', 'Le Finder montre le dossier.') : T('The Finder did not open the folder.', 'Le Finder n’a pas ouvert le dossier.'); }); });
    card.appendChild(keys); card.appendChild(status);
    card.appendChild(el('p', 'cd-macrooms-where', T('They are kept in your home folder: Applications, then Carpe Diem Rooms. Spotlight finds each by its name.', 'Elles sont rangées dans votre dossier personnel : Applications, puis Carpe Diem Rooms. Spotlight trouve chacune par son nom.')));
    var foot = el('div', 'cd-macrooms-foot'), x = el('button', 'cd-macrooms-close', T('Close', 'Fermer')); x.type = 'button'; x.onclick = closeSheet; foot.appendChild(x); card.appendChild(foot);
    back.appendChild(card);
    back.addEventListener('mousedown', function (ev) { if (ev.target === back) closeSheet(); });
    document.body.appendChild(back);
    document.addEventListener('keydown', onKey, true);
    try { keys.querySelector('button').focus(); } catch (e) {}
    ask('rooms_state').then(function (s) { if (!s || status.textContent) return;
      var d = (s.dock || []).length, k = (s.desktop || []).length;
      say((d ? T('In the Dock: ', 'Dans le Dock : ') + list(s.dock) + '. ' : T('None is in the Dock yet. ', 'Aucune n’est encore dans le Dock. ')) + (k ? T('On the Desktop: ', 'Sur le bureau : ') + list(s.desktop) + '.' : T('None is on the Desktop yet.', 'Aucune n’est encore sur le bureau.'))); }, function () {});
    try { localStorage.setItem(HINT, '1'); } catch (e) {}
    return true;
  }
  window.cdRoomsAsApps = sheet;

  // offered from the menu of a room's floating window (the menu of build 1059, drawn anew each time it opens)
  try {
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) { var add = muts[i].addedNodes; for (var j = 0; j < add.length; j++) { var m = add[j];
        if (!m || m.id !== 'cd-export-choice' || !can() || m.querySelector('[data-cd-act="rooms-as-apps"]')) continue;
        var b = el('button', 'cd-win1059-opt'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.setAttribute('data-cd-act', 'rooms-as-apps');
        b.appendChild(el('div', 'cd-win1059-l', T('⌘ The rooms as apps on this Mac…', '⌘ Les pièces comme applications sur ce Mac…')));
        b.appendChild(el('div', 'cd-win1059-s', T('Put Tabula, Abacus, Imago, Scriba and Fontes in the Dock or on the Desktop, or find them in the Finder.', 'Mettre Tabula, Abacus, Imago, Scriba et Fontes dans le Dock ou sur le bureau, ou les retrouver dans le Finder.')));
        b.onclick = (function (menu) { return function (ev) { try { ev.stopPropagation(); } catch (e) {} try { menu.remove(); } catch (e) {} sheet(); }; })(m);
        var last = m.querySelector('.cd-win1059-x'); if (last) m.insertBefore(b, last); else m.appendChild(b); } }
    }).observe(document.body, { childList: true });
  } catch (e) {}

  // a note with keys of its own, at the foot of the page
  function note(text, keys, ms) {
    try { var o = document.getElementById('cd-macrooms-note'); if (o) o.remove(); } catch (e) {}
    var d = el('div', 'cd-macrooms-note'); d.id = 'cd-macrooms-note'; d.setAttribute('role', 'status');
    var t = el('div', '', text); d.appendChild(t);
    var row = el('div', 'cd-macrooms-row');
    (keys || []).forEach(function (k) { var b = el('button', '', k[0]); b.type = 'button'; b.onclick = function () { k[1](d, t, b); }; row.appendChild(b); });
    d.appendChild(row); document.body.appendChild(d);
    setTimeout(function () { try { d.remove(); } catch (e) {} }, ms || 20000);
    return d;
  }

  // once, on a Mac where none of the five is in the Dock or on the Desktop
  function hint() {
    try { if (!can() || window.__cdRoomOnly || localStorage.getItem(HINT)) return; } catch (e) { return; }
    try { if (typeof window.cdLocked === 'function' && window.cdLocked()) { setTimeout(hint, 30000); return; } } catch (e) {}
    try { if (document.getElementById('demo-entry') || document.querySelector('.cd-tour-on,.tour-active')) { setTimeout(hint, 60000); return; } } catch (e) {}
    ask('rooms_state').then(function (s) {
      if (!s || !s.mac || !(s.apps || []).length) return;
      try { localStorage.setItem(HINT, '1'); } catch (e) {}
      if ((s.dock || []).length || (s.desktop || []).length) return;
      note(T('Tabula, Abacus, Imago, Scriba and Fontes are also apps of their own on this Mac. You can put them in the Dock or on the Desktop.',
        'Tabula, Abacus, Imago, Scriba et Fontes sont aussi des applications à part entière sur ce Mac. Vous pouvez les mettre dans le Dock ou sur le bureau.'),
        [[T('Show me', 'Montrer'), function (d) { d.remove(); sheet(); }], [T('Not now', 'Pas maintenant'), function (d) { d.remove(); }]], 40000);
    }, function () {});
  }
  setTimeout(hint, 15000);

  // a room's own window that did not open: the page says so and offers the app's record, to copy and send
  function copyText(t) {
    try { if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(function () { return true; }, function () { return old(); }); } catch (e) {}
    function old() { try { var a = document.createElement('textarea'); a.value = t; a.setAttribute('readonly', ''); a.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.appendChild(a); a.select(); var ok = document.execCommand('copy'); a.remove(); return !!ok; } catch (e) { return false; } }
    return Promise.resolve(old());
  }
  window.cdRoomWindowFailed = function (which, name) {
    var a = api(), keys = [];
    if (a && typeof a.app_record === 'function') keys.push([T('Copy the app’s record', 'Copier le journal de l’application'), function (d, t, b) {
      Promise.resolve(a.app_record()).then(function (rec) { return copyText(String(rec || '')); }).then(function (ok) {
        t.textContent = ok ? T('The record is copied. Paste it where you report the fault: it says what the Mac did with the window.', 'Le journal est copié. Collez-le là où vous signalez le défaut : il dit ce que le Mac a fait de la fenêtre.')
          : T('The record could not be copied here.', 'Le journal n’a pas pu être copié ici.'); b.remove(); }, function () { t.textContent = T('The record could not be read.', 'Le journal n’a pas pu être lu.'); }); }]);
    keys.push([T('Close', 'Fermer'), function (d) { d.remove(); }]);
    note(T('The window could not be opened here; ' + name + ' stays in its floating window.', 'La fenêtre n’a pas pu s’ouvrir ici ; ' + name + ' reste dans sa fenêtre flottante.'), keys, 45000);
  };
})();
