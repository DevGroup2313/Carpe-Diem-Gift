// 1079 · the Guidebook's film, "Carpe Diem in action" (the owner: "add the preview video ... inside of Carpe Diem's
// Guidebook and also a link in the tour ... a great way for users to interact with and really see the app in action ...
// makes it more AuDHD accessible").
// A calm player: nothing plays until Play is pressed; no sound; captions on; slower or faster (0.75×, 1×, 1.25×); From
// the start; a key for each scene; "Read instead", the film as words; Space plays and pauses, the arrows step five
// seconds, Escape closes. Speed and captions are remembered. Opened from the Guidebook (a card at its top) and from the
// tour (its first chapter and its end). The film is in the page itself, so it
// plays with the network off; it is turned into a playable file only when it is first opened.
(function () {
  'use strict';
  if (window.__cdFilm1079) return;
  window.__cdFilm1079 = 1;
  var W = window, D = document;
  var SCENES = /*CD_FILM_SCENES*/[];
  var VTT = /*CD_FILM_VTT*/{ en: '', fr: '' };

  function fr() { try { return state.lang === 'fr'; } catch (e) { return false; } }
  function T(en, f) { return fr() ? f : en; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function prefs() { try { if (!state.cdFilm || typeof state.cdFilm !== 'object') state.cdFilm = { speed: 1, cc: true }; return state.cdFilm; } catch (e) { return { speed: 1, cc: true }; } }
  function save() { try { saveState(); } catch (e) {} }
  function mmss(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  var URL0 = null, TRK = {};
  function filmURL() {
    if (URL0) return URL0;
    var b64 = W.__cdFilmB64; if (!b64) return null;
    var bin = atob(b64), n = bin.length, u8 = new Uint8Array(n);
    for (var i = 0; i < n; i++) u8[i] = bin.charCodeAt(i);
    URL0 = URL.createObjectURL(new Blob([u8], { type: 'video/mp4' }));
    return URL0;
  }
  function trackURL(lang) { if (!TRK[lang]) TRK[lang] = URL.createObjectURL(new Blob([VTT[lang] || ''], { type: 'text/vtt' })); return TRK[lang]; }
  function scenes() { return SCENES.filter(function (s) { return s.at != null; }); }

  function close() {
    var ov = D.getElementById('cd-film'); if (!ov) return;
    var v = ov.querySelector('video'); try { v.pause(); } catch (e) {}
    ov.remove(); D.removeEventListener('keydown', keys, true);
    try { if (ov.__back && ov.__back.focus) ov.__back.focus(); } catch (e) {}
  }
  function keys(e) {
    var ov = D.getElementById('cd-film'); if (!ov) return;
    var v = ov.querySelector('video'), tag = (e.target && e.target.tagName) || '';
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    if ((e.key === ' ' || e.key === 'k') && !(tag === 'BUTTON' && e.key === ' ')) { e.preventDefault(); if (v.paused) v.play(); else v.pause(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); v.currentTime = Math.min(v.duration || 0, v.currentTime + 5); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); v.currentTime = Math.max(0, v.currentTime - 5); }
  }

  function open(at) {
    close();
    var src = filmURL(); if (!src) return;
    var P = prefs(), lang = fr() ? 'fr' : 'en';
    var ov = D.createElement('div'); ov.id = 'cd-film'; ov.className = 'cdf'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-label', T('Carpe Diem in action, a film', 'Carpe Diem en action, un film'));
    ov.__back = D.activeElement;
    var sc = scenes(), last = sc.length ? sc[sc.length - 1] : null;
    ov.innerHTML = '<div class="cdf-panel"><div class="cdf-top"><div class="grow"><p class="cdf-kick">' + T('The Guidebook · a film', 'Le Guide · un film') + '</p>'
      + '<h2 class="cdf-h">' + T('Carpe Diem in action', 'Carpe Diem en action') + '</h2>'
      + '<p class="cdf-sub">' + T('About a minute, with no sound. It starts only when you press Play; captions say what is on the screen.', 'Environ une minute, sans son. Il ne commence que lorsque vous appuyez sur Lire ; les sous-titres disent ce qui est à l’écran.') + '</p></div>'
      + '<button type="button" class="cdf-key x" data-f="close" aria-label="' + T('Close the film', 'Fermer le film') + '" title="' + T('Close (Escape)', 'Fermer (Échap)') + '">×</button></div>'
      + '<video playsinline preload="metadata" controls></video>'
      + '<div class="cdf-keys"><button type="button" class="cdf-key main" data-f="play">▶ ' + T('Play', 'Lire') + '</button>'
      + '<button type="button" class="cdf-key" data-f="start">↺ ' + T('From the start', 'Depuis le début') + '</button>'
      + '<span class="cdf-label">' + T('Speed', 'Vitesse') + '</span><span class="cdf-seg" role="group" aria-label="' + T('Speed', 'Vitesse') + '">'
      + [0.75, 1, 1.25].map(function (r) { return '<button type="button" data-rate="' + r + '" aria-pressed="' + (P.speed === r) + '">' + String(r).replace('.', fr() ? ',' : '.') + '×</button>'; }).join('') + '</span>'
      + '<button type="button" class="cdf-key" data-f="cc" aria-pressed="' + (P.cc !== false) + '">CC ' + (P.cc !== false ? T('Captions on', 'Sous-titres activés') : T('Captions off', 'Sous-titres désactivés')) + '</button></div>'
      + '<div class="cdf-chaps" role="group" aria-label="' + T('Scenes', 'Scènes') + '">' + sc.filter(function (s) { return s.id !== 'end'; }).map(function (s) {
        return '<button type="button" class="cdf-chap" data-at="' + s.at + '">' + esc(fr() ? s.fr : s.en) + '<span>' + mmss(s.at) + '</span></button>'; }).join('') + '</div>'
      + '<details class="cdf-read"><summary>' + T('Read instead: what the film shows', 'Lire plutôt : ce que montre le film') + '</summary><ol>'
      + sc.filter(function (s) { return s.id !== 'end'; }).map(function (s) { return '<li><b>' + esc(fr() ? s.fr : s.en) + '.</b> ' + esc(fr() ? s.dfr : s.den) + '</li>'; }).join('') + '</ol></details>'
      + '<p class="cdf-note">' + T('Space plays and pauses, the arrows move five seconds, Escape closes.', 'Espace lit et met en pause, les flèches avancent ou reculent de cinq secondes, Échap ferme.') + '</p></div>';
    D.body.appendChild(ov);
    var v = ov.querySelector('video');
    v.src = src;
    ['en', 'fr'].forEach(function (l) { var t = D.createElement('track'); t.kind = 'captions'; t.srclang = l; t.label = l === 'fr' ? 'Français' : 'English'; t.src = trackURL(l); if (l === lang) t.default = true; v.appendChild(t); });
    var applyCC = function () { [].forEach.call(v.textTracks, function (tt) { tt.mode = (prefs().cc !== false && tt.language === lang) ? 'showing' : 'disabled'; }); };
    v.addEventListener('loadedmetadata', function () { applyCC(); v.playbackRate = prefs().speed || 1; if (at != null) v.currentTime = at; });
    setTimeout(applyCC, 60);
    var play = ov.querySelector('[data-f="play"]');
    var paint = function () { play.innerHTML = v.paused ? '▶ ' + T('Play', 'Lire') : '❚❚ ' + T('Pause', 'Pause'); };
    v.addEventListener('play', paint); v.addEventListener('pause', paint); v.addEventListener('ended', paint);
    v.addEventListener('timeupdate', function () {
      var now = v.currentTime, cur = null; sc.forEach(function (s) { if (s.id !== 'end' && now >= s.at - 0.05) cur = s.at; });
      [].forEach.call(ov.querySelectorAll('.cdf-chap'), function (b) { b.setAttribute('aria-current', String(+b.getAttribute('data-at') === cur)); });
    });
    ov.addEventListener('click', function (e) {
      if (e.target === ov) { close(); return; }
      var t = e.target.closest ? e.target.closest('button') : null; if (!t) return;
      var f = t.getAttribute('data-f'), r = t.getAttribute('data-rate'), a = t.getAttribute('data-at');
      if (f === 'close') close();
      else if (f === 'play') { if (v.paused) v.play(); else v.pause(); }
      else if (f === 'start') { v.currentTime = 0; v.play(); }
      else if (f === 'cc') { var P2 = prefs(); P2.cc = P2.cc === false; save(); t.setAttribute('aria-pressed', String(P2.cc)); t.textContent = 'CC ' + (P2.cc ? T('Captions on', 'Sous-titres activés') : T('Captions off', 'Sous-titres désactivés')); applyCC(); }
      else if (r) { var P3 = prefs(); P3.speed = +r; save(); v.playbackRate = +r; [].forEach.call(ov.querySelectorAll('[data-rate]'), function (b) { b.setAttribute('aria-pressed', String(b === t)); }); }
      else if (a != null) { v.currentTime = +a; v.play(); }
    });
    D.addEventListener('keydown', keys, true);
    try { play.focus({ preventScroll: true }); } catch (e) {}
  }

  // ---------- the Guidebook's entry: a card at its top (one entry only, as the owner asked) ----------
  function gbCard() {
    var c = D.createElement('div'); c.className = 'cdf-gbcard'; c.setAttribute('data-cd-film', '1');
    c.innerHTML = '<span class="cdf-gbbadge" aria-hidden="true">▶</span><span class="grow"><b>' + T('Carpe Diem in action', 'Carpe Diem en action') + '</b><span>'
      + T('A one-minute film of the app at work, no sound, with captions. Watch it before reading, or instead.', 'Un film d’une minute sur l’application au travail, sans son, avec sous-titres. Regardez-le avant de lire, ou à la place.') + '</span></span>';
    var k = D.createElement('button'); k.type = 'button'; k.className = 'cdf-key main'; k.textContent = '▶ ' + T('Watch the film', 'Voir le film');
    k.addEventListener('click', function () { open(); });
    c.appendChild(k);
    return c;
  }
  function dressGuide() {
    var m = D.querySelector('#modal-root .cd-guide-modal'); if (!m || m.querySelector('[data-cd-film]')) return;
    var anchor = m.querySelector('.cd-gb-tourkey') ? m.querySelector('.cd-gb-tourkey').parentNode : null;
    var body = anchor && anchor.parentNode ? anchor.parentNode : null;
    var card = gbCard();
    if (body && anchor.nextSibling) body.insertBefore(card, anchor.nextSibling); else { var scrollBox = m.querySelector('.modal > div:last-child') || m; scrollBox.insertBefore(card, scrollBox.firstChild); }
  }
  // ---------- the tour: its first chapter and its end offer the film ----------
  function dressTour() {
    var t = D.getElementById('demo-tour'); if (!t || t.querySelector('[data-cd-film]')) return;
    var txt = t.textContent || '';
    // the tour's first chapter (Welcome to your tour, Bienvenue) and its end (Tour complete, Visite terminée)
    var first = /Welcome to your tour|Bienvenue dans votre visite|Bienvenue dans la visite|Welcome · Getting started|Bienvenue · Pour commencer/.test(txt);
    var end = /Tour complete|Visite terminée/.test(txt);
    if (!first && !end) return;
    var card = t.querySelector('.demo-tour-card') || t.firstElementChild || t;
    var k = D.createElement('button'); k.type = 'button'; k.className = 'cdf-key cdf-tourkey'; k.setAttribute('data-cd-film', '1');
    k.textContent = '▶ ' + (end ? T('Watch the film of the app at work', 'Voir le film de l’application au travail') : T('Prefer to watch? A one-minute film', 'Vous préférez regarder ? Un film d’une minute'));
    k.addEventListener('click', function () { try { if (typeof demoTourSoftClose === 'function') demoTourSoftClose(); } catch (e) {} try { if (typeof demoRemove === 'function') demoRemove('demo-tour'); } catch (e) {} open(); });
    card.appendChild(k);
  }
  function boot() {
    try { new MutationObserver(function () { dressGuide(); dressTour(); }).observe(D.body, { childList: true, subtree: true }); } catch (e) {}
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot); else boot();
  W.cdFilm = { open: open, close: close };
})();
