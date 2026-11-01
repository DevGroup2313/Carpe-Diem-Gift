// 1080 · the Guidebook's film, "Carpe Diem in action", sharp, with this device's own side keys.
// The owner (1 November 2026): the film "looks blurry" and its side keys have "a very regressed look of emojis having
// this harsh black line around them"; "the videos should match the way the app looks on the device that it is being
// watched". The film is now drawn at twice the pixels and shown no larger than it stays sharp (devicePixelRatio counted).
// The side keys' glyphs are left out of the film; the player draws them over it, where each key was in every frame, with
// the glyphs this device draws for the real keys (Apple's on a Mac, iPhone and iPad, Microsoft's on Windows, the
// app's flat pictures on Windows 10 as in pass 1060), turning and ringing as filmed. They follow the film frame by frame
// through scenes, seeking and speed, and sit under the captions and away from the controls (the controls are below the
// film; the captions are drawn above the keys).
// Kept from 1079: nothing plays until Play is pressed; no sound; captions on in the reader's language; slower or faster;
// From the start; a key for each scene; Read instead; Space plays and pauses, the arrows move five seconds, Escape
// closes; speed and captions remembered; the film is in the page, so it plays offline; one entry at the top of the
// Guidebook and the tour's offers.
(function () {
  'use strict';
  if (window.__cdFilm1080) return;
  window.__cdFilm1080 = 1;
  var W = window, D = document;
  var SCENES = /*CD_FILM_SCENES*/[];
  var VTT = /*CD_FILM_VTT*/{ en: '', fr: '' };
  var KEYS = /*CD_FILM_KEYS*/{ fps: 30, w: 1280, h: 800, vw: 1728, vh: 1080, frames: 0, chars: [], style: {}, keys: {} };
  // the live glyph of each side key, as pass 1060 names them
  var GSEL = { 'sticky-fab': '#sticky-fab>span', 'horo-fab': '#horo-fab>span:first-child', 'cd-theme-fab': '#cd-theme-fab>span',
    'cd-thought-fab': '#cd-thought-fab .cd-thought-glyph', 'reminders-fab': '#reminders-fab .rem-fab-bell', 'cd-quiet-fab': '#cd-quiet-fab .cd-quiet-glyph' };

  function fr() { try { return state.lang === 'fr'; } catch (e) { return false; } }
  function T(en, f) { return fr() ? f : en; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function prefs() { try { if (!state.cdFilm || typeof state.cdFilm !== 'object') state.cdFilm = { speed: 1, cc: true }; return state.cdFilm; } catch (e) { return { speed: 1, cc: true }; } }
  function save() { try { saveState(); } catch (e) {} }
  function mmss(s) { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function norm(t) { return String(t || '').replace(/️/g, '').trim(); }
  var URL0 = null, TRK = {};
  function filmURL() {
    if (URL0) return URL0;
    var el = D.getElementById('cd-film-1080-data'), b64 = el ? el.textContent.replace(/\s+/g, '') : '';
    if (!b64) return null;
    var bin = atob(b64), n = bin.length, u8 = new Uint8Array(n);
    for (var i = 0; i < n; i++) u8[i] = bin.charCodeAt(i);
    URL0 = URL.createObjectURL(new Blob([u8], { type: 'video/mp4' }));
    return URL0;
  }
  function trackURL(lang) { if (!TRK[lang]) TRK[lang] = URL.createObjectURL(new Blob([VTT[lang] || ''], { type: 'text/vtt' })); return TRK[lang]; }
  function scenes() { return SCENES.filter(function (s) { return s.at != null; }); }

  // ---------- the side keys, as this device draws them ----------
  function px(v) { var n = parseFloat(v); return isFinite(n) ? n : null; }
  // how this device draws the glyph of key id: read from the real key (shown or not), else as filmed
  function look(id) {
    var g = null, k = null, out = {};
    try { g = D.querySelector(GSEL[id]); k = D.getElementById(id); } catch (e) {}
    var f = (KEYS.style && KEYS.style[id]) || {};
    try {
      var gc = g ? getComputedStyle(g) : null, kc = k ? getComputedStyle(k) : null;
      out.ff = (gc && gc.fontFamily) || f.ff || '';
      out.fs = (gc && px(gc.fontSize)) || px(f.fs) || 36;
      out.lh = gc ? gc.lineHeight : (f.lh || 'normal');
      out.fw = gc ? gc.fontWeight : '';
      out.ai = (gc && gc.alignItems && gc.alignItems !== 'normal') ? gc.alignItems : (f.ai || 'center');
      out.jc = (gc && gc.justifyContent && gc.justifyContent !== 'normal') ? gc.justifyContent : (f.jc || 'center');
      out.gf = gc ? gc.filter : (f.glyphFilter || 'none');
      out.ts = gc ? gc.textShadow : (f.ts || 'none');
      out.kf = kc ? kc.filter : (f.keyFilter || 'none');
      out.pics = !!(g && g.querySelector && g.querySelector('img.cd-emo'));
    } catch (e) {}
    return out;
  }
  function glyphNode(ch, L) {
    var src = null;
    try { if (L.pics && W.cdEmojiPics && W.cdEmojiPics._ && W.cdEmojiPics._.pics) src = W.cdEmojiPics._.pics[norm(ch)] || null; } catch (e) {}
    if (src) { var im = D.createElement('img'); im.className = 'cd-emo'; im.alt = ''; im.draggable = false; im.src = src; return im; }
    return D.createTextNode(ch);
  }
  function SideKeys(stage) {
    var box = D.createElement('div'); box.className = 'cdf-sk'; box.setAttribute('aria-hidden', 'true');
    stage.appendChild(box);
    var ks = {}, ids = Object.keys(KEYS.keys || {});
    ids.forEach(function (id) {
      var o = D.createElement('span'); o.className = 'cdf-sk-key'; o.setAttribute('data-k', id); o.style.display = 'none';
      var g = D.createElement('span'); g.className = 'cdf-sk-g'; o.appendChild(g); box.appendChild(o);
      ks[id] = { o: o, g: g, t: KEYS.keys[id].t || [], i: 0, cur: null, ch: null, L: null };
    });
    var scale = 1, lastF = -1;
    function find(K, f) {
      var t = K.t, i = K.i;
      if (!t.length || t[0][0] > f) return null;
      if (t[i][0] > f) i = 0;
      // the last change at or before frame f (the film is watched forward, so start from where we were)
      if (i + 1 < t.length && t[i + 1][0] <= f) {
        if (t.length - i > 24 && t[Math.min(t.length - 1, i + 24)][0] <= f) {
          var lo = i, hi = t.length - 1;
          while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (t[mid][0] <= f) lo = mid; else hi = mid - 1; }
          i = lo;
        } else while (i + 1 < t.length && t[i + 1][0] <= f) i++;
      }
      K.i = i;
      return t[i];
    }
    // each key is laid out at the app's own size, as the app lays it out on this device, then scaled with the film
    function dress(id, K) {
      var L = look(id); K.L = L;
      var st = K.g.style;
      st.fontFamily = L.ff; st.fontSize = L.fs + 'px';
      st.lineHeight = L.lh;
      if (L.fw) st.fontWeight = L.fw;
      st.alignItems = L.ai; st.justifyContent = L.jc;
      st.filter = L.gf || 'none';
      st.textShadow = L.ts || 'none';
      K.o.style.filter = L.kf || 'none';
      K.o.style.transform = 'scale(' + scale.toFixed(5) + ')';
      K.ch = null; K.cur = null;
    }
    function paint(f) {
      box.__f = f;
      if (f === lastF) return; lastF = f;
      ids.forEach(function (id) {
        var K = ks[id], e = find(K, f);
        if (!e || !(e[5] > 0)) { if (K.cur !== 0) { K.o.style.display = 'none'; K.cur = 0; } return; }
        if (K.cur === e) return;
        K.cur = e;
        var s = scale, ch = KEYS.chars[e[6]] || '', os = K.o.style, gs = K.g.style, org = KEYS.keys[id].org || [e[3] / 2, e[4] / 2];
        if (K.ch !== ch) { K.g.textContent = ''; K.g.appendChild(glyphNode(ch, K.L || look(id))); K.ch = ch; }
        os.display = 'block';
        os.left = (e[1] * s).toFixed(3) + 'px'; os.top = (e[2] * s).toFixed(3) + 'px';
        os.width = e[3] + 'px'; os.height = e[4] + 'px';
        os.opacity = e[5] >= 1 ? '' : String(e[5]);
        gs.transformOrigin = org[0] + 'px ' + org[1] + 'px';
        gs.transform = e.length >= 13 ? 'matrix(' + e.slice(7, 13).join(',') + ')' : 'none';
      });
    }
    return {
      el: box,
      size: function (w) { scale = w / (KEYS.w || 1280); ids.forEach(function (id) { dress(id, ks[id]); }); lastF = -1; },
      paint: paint,
      frame: function (t) { var n = KEYS.frames || 1; return Math.max(0, Math.min(n - 1, Math.floor(t * (KEYS.fps || 30) + 1e-6))); },
      _ks: ks
    };
  }

  // play() can be cut short by a pause; that is not an error
  function playV(v) { try { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {} }
  function close() {
    var ov = D.getElementById('cd-film'); if (!ov) return;
    var v = ov.querySelector('video'); try { v.pause(); } catch (e) {}
    try { if (ov.__off) ov.__off(); } catch (e) {}
    ov.remove(); D.removeEventListener('keydown', keys, true);
    try { if (ov.__back && ov.__back.focus) ov.__back.focus(); } catch (e) {}
  }
  function keys(e) {
    var ov = D.getElementById('cd-film'); if (!ov) return;
    var v = ov.querySelector('video'), tag = (e.target && e.target.tagName) || '';
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    if ((e.key === ' ' || e.key === 'k') && !(tag === 'BUTTON' && e.key === ' ')) { e.preventDefault(); if (v.paused) playV(v); else v.pause(); }
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
    var sc = scenes(), dur0 = KEYS.frames ? KEYS.frames / (KEYS.fps || 30) : 60;
    ov.innerHTML = '<div class="cdf-panel"><div class="cdf-top"><div class="grow"><p class="cdf-kick">' + T('The Guidebook · a film', 'Le Guide · un film') + '</p>'
      + '<h2 class="cdf-h">' + T('Carpe Diem in action', 'Carpe Diem en action') + '</h2>'
      + '<p class="cdf-sub">' + T('About a minute, with no sound. It starts only when you press Play; captions say what is on the screen.', 'Environ une minute, sans son. Il ne commence que lorsque vous appuyez sur Lire ; les sous-titres disent ce qui est à l’écran.') + '</p></div>'
      + '<button type="button" class="cdf-key x" data-f="close" aria-label="' + T('Close the film', 'Fermer le film') + '" title="' + T('Close (Escape)', 'Fermer (Échap)') + '">×</button></div>'
      + '<div class="cdf-stage"><video playsinline muted preload="auto" disablepictureinpicture disableremoteplayback controlslist="nodownload nofullscreen noremoteplayback" tabindex="-1"></video>'
      + '<div class="cdf-cc" aria-hidden="true"><span></span></div></div>'
      + '<div class="cdf-seek"><span class="cdf-time" data-t="now">0:00</span><input type="range" min="0" max="' + dur0.toFixed(2) + '" step="0.05" value="0" aria-label="' + T('Where in the film', 'Où dans le film') + '"><span class="cdf-time" data-t="dur">' + mmss(dur0) + '</span></div>'
      + '<div class="cdf-keys"><button type="button" class="cdf-key main" data-f="play">▶ ' + T('Play', 'Lire') + '</button>'
      + '<button type="button" class="cdf-key" data-f="start">↺ ' + T('From the start', 'Depuis le début') + '</button>'
      + '<span class="cdf-label">' + T('Speed', 'Vitesse') + '</span><span class="cdf-seg" role="group" aria-label="' + T('Speed', 'Vitesse') + '">'
      + [0.75, 1, 1.25].map(function (r) { return '<button type="button" data-rate="' + r + '" aria-pressed="' + (P.speed === r) + '">' + String(r).replace('.', fr() ? ',' : '.') + '×</button>'; }).join('') + '</span>'
      + '<button type="button" class="cdf-key" data-f="cc" aria-pressed="' + (P.cc !== false) + '">CC ' + (P.cc !== false ? T('Captions on', 'Sous-titres activés') : T('Captions off', 'Sous-titres désactivés')) + '</button></div>'
      + '<div class="cdf-chaps" role="group" aria-label="' + T('Scenes', 'Scènes') + '">' + sc.filter(function (s) { return s.id !== 'end'; }).map(function (s) {
        return '<button type="button" class="cdf-chap" data-at="' + s.at + '">' + esc(fr() ? s.fr : s.en) + '<span>' + mmss(s.at) + '</span></button>'; }).join('') + '</div>'
      + '<details class="cdf-read"><summary>' + T('Read instead: what the film shows', 'Lire plutôt : ce que montre le film') + '</summary><ol>'
      + sc.filter(function (s) { return s.id !== 'end'; }).map(function (s) { return '<li><b>' + esc(fr() ? s.fr : s.en) + '.</b> ' + esc(fr() ? s.dfr : s.den) + '</li>'; }).join('') + '</ol></details>'
      + '<p class="cdf-note">' + T('Space plays and pauses, the arrows move five seconds, Escape closes. The side keys are drawn by this device, as in the app.', 'Espace lit et met en pause, les flèches avancent ou reculent de cinq secondes, Échap ferme. Les touches du côté sont dessinées par cet appareil, comme dans l’application.') + '</p></div>';
    D.body.appendChild(ov);
    var panel = ov.querySelector('.cdf-panel'), stage = ov.querySelector('.cdf-stage'), v = ov.querySelector('video'), cc = ov.querySelector('.cdf-cc'), ccT = cc.firstChild;
    var keysRow = ov.querySelector('.cdf-keys'), seek = ov.querySelector('.cdf-seek input'), tNow = ov.querySelector('[data-t="now"]'), tDur = ov.querySelector('[data-t="dur"]');
    var SK = SideKeys(stage);
    stage.insertBefore(SK.el, cc);
    v.muted = true;
    v.src = src;
    ['en', 'fr'].forEach(function (l) { var t = D.createElement('track'); t.kind = 'captions'; t.srclang = l; t.label = l === 'fr' ? 'Français' : 'English'; t.src = trackURL(l); if (l === lang) t.default = true; v.appendChild(t); });
    // the tracks stay for the reader's tools; the words are drawn by the player, above the side keys
    var applyCC = function () { try { [].forEach.call(v.textTracks, function (tt) { tt.mode = 'hidden'; }); } catch (e) {} cc.style.display = prefs().cc !== false ? '' : 'none'; caption(); };
    function caption() {
      var now = v.currentTime || 0, txt = '';
      if (prefs().cc !== false) {
        for (var i = 0; i < sc.length; i++) {
          var s = sc[i], nxt = i + 1 < sc.length ? sc[i + 1].at : s.at + 6;
          if (s.id !== 'end' && now >= s.at && now < nxt - 0.05) txt = fr() ? (s.fr + ' : ' + s.dfr) : (s.en + ': ' + s.den);
        }
      }
      if (ccT.textContent !== txt) ccT.textContent = txt;
      cc.classList.toggle('on', !!txt);
    }
    // the film is never shown larger than it stays sharp on this screen: its pixels over the device's pixel ratio
    function fit() {
      try {
        var vw = v.videoWidth || KEYS.vw || 1728, vh = v.videoHeight || KEYS.vh || 1080, dpr = W.devicePixelRatio || 1;
        var cs = getComputedStyle(panel), inner = panel.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
        // the film, its bar and the Play key stay in sight together; the scenes and Read instead may scroll below
        var kr = keysRow.getBoundingClientRect(), pr = panel.getBoundingClientRect(), sr = stage.getBoundingClientRect();
        var need = (sr.top - pr.top + panel.scrollTop) + (kr.bottom - sr.bottom) + (parseFloat(cs.paddingBottom) || 0) + 2;
        var room = (W.innerHeight || 800) - 36 - need;
        var w = Math.min(inner, vw / dpr, Math.max(260, room) * vw / vh);
        w = Math.max(160, Math.floor(w));
        stage.style.width = w + 'px'; stage.style.height = Math.round(w * vh / vw) + 'px';
        stage.setAttribute('data-sharp', String(Math.round(vw / dpr)));
        SK.size(w); SK.paint(SK.frame(v.currentTime || 0));
      } catch (e) {}
    }
    // the side keys follow the frame on screen: each frame the video shows, else the time it stands at
    var alive = true, rafId = 0, hasVFC = typeof v.requestVideoFrameCallback === 'function';
    function show(f) { SK.paint(f); }
    // when it stops, the keys keep the frame the video last showed; after a seek, the frame at the new time
    function still(ev) { if (!hasVFC || !ev || ev.type !== 'pause') show(SK.frame(v.currentTime || 0)); caption(); tick(); }
    function tick() { var d = v.duration || dur0; if (document.activeElement !== seek) seek.value = String(v.currentTime || 0); tNow.textContent = mmss(v.currentTime); tDur.textContent = mmss(d); seek.max = d.toFixed(2); }
    if (hasVFC) {
      var onFrame = function (now, meta) { if (!alive) return; show(Math.max(0, Math.min((KEYS.frames || 1) - 1, Math.round(meta.mediaTime * (KEYS.fps || 30))))); caption(); v.requestVideoFrameCallback(onFrame); };
      v.requestVideoFrameCallback(onFrame);
    } else {
      var loop = function () { if (!alive) return; if (!v.paused) { show(SK.frame(v.currentTime || 0)); caption(); } rafId = requestAnimationFrame(loop); };
      rafId = requestAnimationFrame(loop);
    }
    ['seeked', 'loadeddata', 'pause', 'ended', 'ratechange'].forEach(function (n) { v.addEventListener(n, still); });
    v.addEventListener('timeupdate', function () {
      tick(); caption();
      var now = v.currentTime, cur = null; sc.forEach(function (s) { if (s.id !== 'end' && now >= s.at - 0.05) cur = s.at; });
      [].forEach.call(ov.querySelectorAll('.cdf-chap'), function (b) { b.setAttribute('aria-current', String(+b.getAttribute('data-at') === cur)); });
    });
    v.addEventListener('loadedmetadata', function () { applyCC(); v.playbackRate = prefs().speed || 1; if (at != null) v.currentTime = at; fit(); tick(); });
    seek.addEventListener('input', function () { v.currentTime = +seek.value; });
    var onResize = function () { fit(); };
    W.addEventListener('resize', onResize);
    var mq = null; try { mq = W.matchMedia('(resolution: ' + (W.devicePixelRatio || 1) + 'dppx)'); if (mq.addEventListener) mq.addEventListener('change', onResize); } catch (e) {}
    ov.__off = function () { alive = false; if (rafId) cancelAnimationFrame(rafId); W.removeEventListener('resize', onResize); try { if (mq && mq.removeEventListener) mq.removeEventListener('change', onResize); } catch (e) {} };
    setTimeout(applyCC, 60);
    fit();
    var play = ov.querySelector('[data-f="play"]');
    var paint = function () { play.innerHTML = v.paused ? '▶ ' + T('Play', 'Lire') : '❚❚ ' + T('Pause', 'Pause'); };
    v.addEventListener('play', paint); v.addEventListener('pause', paint); v.addEventListener('ended', paint);
    stage.addEventListener('click', function () { if (v.paused) playV(v); else v.pause(); });
    ov.addEventListener('click', function (e) {
      if (e.target === ov) { close(); return; }
      var t = e.target.closest ? e.target.closest('button') : null; if (!t) return;
      var f = t.getAttribute('data-f'), r = t.getAttribute('data-rate'), a = t.getAttribute('data-at');
      if (f === 'close') close();
      else if (f === 'play') { if (v.paused) playV(v); else v.pause(); }
      else if (f === 'start') { v.currentTime = 0; playV(v); }
      else if (f === 'cc') { var P2 = prefs(); P2.cc = P2.cc === false; save(); t.setAttribute('aria-pressed', String(P2.cc)); t.textContent = 'CC ' + (P2.cc ? T('Captions on', 'Sous-titres activés') : T('Captions off', 'Sous-titres désactivés')); applyCC(); }
      else if (r) { var P3 = prefs(); P3.speed = +r; save(); v.playbackRate = +r; [].forEach.call(ov.querySelectorAll('[data-rate]'), function (b) { b.setAttribute('aria-pressed', String(b === t)); }); }
      else if (a != null) { v.currentTime = +a; playV(v); }
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
  W.cdFilm = { open: open, close: close, _keys: KEYS };
})();
