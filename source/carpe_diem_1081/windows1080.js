(function () {
  'use strict';
  if (window.__cdWin1080) return; window.__cdWin1080 = 1;
  var D = document, W = window;
  var SUN = '☀', MOON = '🌙';
  var EMO_CSS = 'img.cd-emo{display:inline-block;width:1em;height:1em;vertical-align:-0.125em;margin:0;border:0;pointer-events:none;-webkit-user-drag:none;user-select:none}';
  /* the main keys' emoji, where pass 1060 dresses them */
  var KEY = { 'sticky-fab': '#sticky-fab>span', 'horo-fab': '#horo-fab>span:first-child', 'cd-theme-fab': '#cd-theme-fab>span',
    'cd-thought-fab': '#cd-thought-fab .cd-thought-glyph', 'cd-quiet-fab': '#cd-quiet-fab .cd-quiet-glyph', 'reminders-fab': '#reminders-fab .rem-fab-bell' };
  var DEF = { 'sticky-fab': '🗒', 'horo-fab': '⏳', 'cd-thought-fab': '💭', 'cd-quiet-fab': '🌿', 'reminders-fab': '🔔' };

  function norm(t) { return String(t || '').replace(/️/g, '').trim(); }
  function picsOn() { return D.documentElement.classList.contains('cd-emoji-pics'); }
  function pic(c) {
    try { var P = W.cdEmojiPics && W.cdEmojiPics._ && W.cdEmojiPics._.pics; return (picsOn() && P && P[c]) || ''; } catch (e) { return ''; }
  }
  function night() {
    try { return state.theme === 'night'; } catch (e) { return !!(D.body && D.body.getAttribute('data-theme') === 'night'); }
  }
  function cssIn(doc) {
    try {
      if (doc === D || doc.getElementById('cd-1060-emoji-css')) return;
      var st = doc.createElement('style'); st.id = 'cd-1060-emoji-css'; st.textContent = EMO_CSS;
      (doc.head || doc.body).appendChild(st);
    } catch (e) {}
  }
  /* the emoji a key shows: its picture's, else its text */
  function shown(span) {
    if (!span) return '';
    return span.querySelector('img.cd-emo') ? norm(span.getAttribute('data-emoji')) : norm(span.textContent);
  }
  /* one writer for a key's emoji: the picture where pass 1060 shows pictures, else the text; nothing is written when it already shows */
  function dressTo(span, c, text) {
    var src = pic(c), doc = span.ownerDocument, im = span.firstChild;
    if (src) {
      if (span.childNodes.length === 1 && im && im.nodeName === 'IMG' && im.className === 'cd-emo') {
        if (span.getAttribute('data-emoji') !== c) span.setAttribute('data-emoji', c);
        if (im.getAttribute('src') !== src) im.setAttribute('src', src);
      } else {
        im = doc.createElement('img'); im.alt = ''; im.className = 'cd-emo'; im.draggable = false; im.src = src;
        span.textContent = ''; span.appendChild(im); span.setAttribute('data-emoji', c);
      }
      span.__cdEmo = c;
      return;
    }
    var t = text || c;
    if (span.childNodes.length === 1 && im && im.nodeType === 3) { if (im.data !== t) im.data = t; }
    else if (span.textContent !== t || span.children.length) span.textContent = t;
    if (span.__cdEmo) { span.__cdEmo = null; span.removeAttribute('data-emoji'); }
  }
  function charOf(pid) {
    var c = '';
    try { c = shown(D.querySelector(KEY[pid])); } catch (e) {}
    if (pid === 'cd-theme-fab' && c !== SUN && c !== MOON) c = night() ? SUN : MOON;
    return c || DEF[pid] || '';
  }

  /* A floating window's column of keys (cd-jewel-js dressFabs, every 700 ms) writes through here: the same look as the
     main key, never the text where the main key shows a picture, and never an empty key. */
  /* the hourglass while the Clepsydra runs: its picture, then the ring and the minutes copied from the main key */
  function horoTo(g, c) {
    var main = D.getElementById('horo-fab'), kids = main ? main.children : [], html = '', i;
    for (i = 1; i < kids.length; i++) html += kids[i].outerHTML;
    if (!html) { g.__cdExtra = null; dressTo(g, c); return; }
    var doc = g.ownerDocument, first = g.firstChild;
    if (!(first && first.nodeName === 'SPAN' && first.__cdHoro)) {
      g.textContent = ''; g.__cdExtra = null;
      if (g.__cdEmo) { g.__cdEmo = null; g.removeAttribute('data-emoji'); }
      first = doc.createElement('span'); first.__cdHoro = 1; first.style.cssText = 'font-size:30px;line-height:1';
      g.appendChild(first);
    }
    dressTo(first, c);
    if (g.__cdExtra !== html) {
      g.__cdExtra = html;
      while (g.childNodes.length > 1) g.removeChild(g.lastChild);
      var t = doc.createElement('template'); t.innerHTML = html; g.appendChild(doc.importNode(t.content, true));
    }
  }
  W.cdWinKey1080 = function (g, pid, want) {
    if (!g) return;
    var c = charOf(pid);
    if (pic(c)) { cssIn(g.ownerDocument); if (pid === 'horo-fab') horoTo(g, c); else dressTo(g, c); return; }
    if (want && !/<img\b/i.test(want)) {
      if (g.innerHTML !== want) g.innerHTML = want;
      if (g.__cdEmo) { g.__cdEmo = null; g.removeAttribute('data-emoji'); }
      return;
    }
    dressTo(g, c);
  };
  function winDocs() {
    var out = [];
    try { [].forEach.call(D.querySelectorAll('iframe[id^="cd-fw-frame-"]'), function (f) { try { if (f.contentDocument && f.contentDocument.body) out.push(f.contentDocument); } catch (e) {} }); } catch (e) {}
    try { (W.__cdPopWins || []).forEach(function (pw) { try { var pf = pw && !pw.closed && pw.document.querySelector('iframe[data-cd-pop]'); if (pf && pf.contentDocument) out.push(pf.contentDocument); } catch (e) {} }); } catch (e) {}
    return out;
  }
  /* the windows' moon or sun follows at once rather than at the column's next round */
  function syncWins() {
    var f = D.getElementById('cd-theme-fab'), want = '';
    try { want = f ? f.innerHTML : ''; } catch (e) {}
    winDocs().forEach(function (d) { try { var g = d.querySelector('#cd-wf-theme .cd-wf-glyph'); if (g) W.cdWinKey1080(g, 'cd-theme-fab', want); } catch (e) {} });
  }

  /* The day/night key: cdThemeIcon and the rooms' replies ('cd-theme-state') rewrote its whole content on every change,
     three to ten times per change; each rewrite undressed the picture and set off the page-wide watchers. Writes that
     show what the key already shows are dropped; a change is made in place. */
  var HTML = null;
  try { HTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML'); } catch (e) {}
  function fabWant(v) {
    var m = /^\s*<span\b[^>]*>([^<]*)<\/span>\s*$/i.exec(String(v == null ? '' : v));
    return m ? { c: norm(m[1]), text: m[1] } : null;
  }
  function setFab(dark) {
    var f = D.getElementById('cd-theme-fab'), s = f && f.firstElementChild;
    if (!s || f.children.length !== 1 || s.tagName !== 'SPAN') return false;
    var c = dark ? SUN : MOON, has = !!s.querySelector('img.cd-emo');
    if (shown(s) === c && has === !!pic(c)) return true;
    dressTo(s, c, dark ? '☀️' : MOON);
    syncWins();
    return true;
  }
  function guardFab() {
    var f = D.getElementById('cd-theme-fab');
    if (!f || f.__cdGuard1080 || !HTML || !HTML.set || !HTML.get) return;
    f.__cdGuard1080 = 1;
    try {
      Object.defineProperty(f, 'innerHTML', { configurable: true, enumerable: true,
        get: function () { return HTML.get.call(this); },
        set: function (v) {
          try {
            var w = fabWant(v), s = this.firstElementChild;
            if (w && (w.c === SUN || w.c === MOON) && s && this.children.length === 1 && s.tagName === 'SPAN') {
              var has = !!s.querySelector('img.cd-emo');
              if (shown(s) !== w.c || has !== !!pic(w.c)) { dressTo(s, w.c, w.text); syncWins(); }
              return;
            }
          } catch (e) {}
          HTML.set.call(this, v);
          try { var s2 = this.firstElementChild, c2 = shown(s2); if (s2 && pic(c2)) dressTo(s2, c2); syncWins(); } catch (e) {}
        } });
    } catch (e) {}
  }

  /* A room in a window of its own (the page at #cd=<room>, pass 1045/1073): a change of day or night is shown at once
     (the page, the room inside, the key) and the rest of the desk's redraw, which nothing in the window shows, follows
     once the change is on screen. The desk under the room is not drawn while the room covers it. */
  var ROOM = W.__cdRoomOnly === 1 || W.__cdRoomOnly === true;
  function roomOpen() { var b = D.body; return !!(b && b.classList.contains('ext-open') && b.classList.contains('cd-tabula-window')); }
  function roomFrame() {
    var w = W.__cdWhich;
    if (!w) { var m = /cd=(tabula|abacus|slides|scriba|fontes)(?![a-z])/.exec((location.search || '') + (location.hash || '')); w = m ? m[1] : ''; }
    return w ? D.getElementById('frame-' + w) : null;
  }
  function frameTo(fr, dark) {
    try {
      var fd = fr && fr.contentDocument;
      if (!fd || !fd.documentElement) return;
      if (fd.documentElement.classList.contains('cd-dark') !== dark) fd.documentElement.classList.toggle('cd-dark', dark);
      if (fd.body) {
        if (dark) { if (fd.body.getAttribute('data-theme') !== 'night') fd.body.setAttribute('data-theme', 'night'); }
        else if (fd.body.hasAttribute('data-theme')) fd.body.removeAttribute('data-theme');
      }
    } catch (e) {}
  }
  function roomTheme() {
    if (!ROOM || typeof W.applyTheme !== 'function' || W.applyTheme.__cd1080) return;
    try { D.documentElement.classList.add('cd-room-1080'); } catch (e) {}
    var full0 = W.applyTheme, bc0 = W.cdBroadcastTheme, inFull = false, due = 0, owe = false, told = null;
    function runFull() {
      due = 0; inFull = true;
      try { full0.apply(W, []); } catch (e) {}
      if (owe && typeof bc0 === 'function') { owe = false; try { bc0.call(W, true); } catch (e) {} }
      owe = false; inFull = false;
    }
    function tellRoom(dark) {
      var go = function () {
        if (told !== dark) return;
        try { var fr = roomFrame(); if (fr && fr.contentWindow) fr.contentWindow.postMessage({ kind: 'cd-theme-apply', dark: dark, user: true }, '*'); } catch (e) {}
      };
      try { requestAnimationFrame(function () { setTimeout(go, 0); }); } catch (e) { setTimeout(go, 16); }
    }
    W.applyTheme = function () {
      if (inFull || !roomOpen() || typeof state !== 'object' || !state || !D.body) return full0.apply(this, arguments);
      try {
        var dark = state.theme === 'night';
        if (D.body.getAttribute('data-theme') !== state.theme) D.body.setAttribute('data-theme', state.theme);
        if (D.body.classList.contains('mode-folio') !== (state.mode === 'folio') && typeof W.applyMode === 'function') W.applyMode();
        frameTo(roomFrame(), dark);
        setFab(dark);
        if (told !== dark) { told = dark; tellRoom(dark); }
      } catch (e) {}
      if (!due) due = setTimeout(runFull, 260);
    };
    W.applyTheme.__cd1047 = 1; W.applyTheme.__cd1080 = 1;
    if (typeof bc0 === 'function') {
      W.cdBroadcastTheme = function (user) {
        if (!inFull && due) { if (user) owe = true; return; }
        return bc0.apply(this, arguments);
      };
    }
  }

  function keep() { guardFab(); }
  try { roomTheme(); } catch (e) {}
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', keep); else keep();
  [600, 2000, 6000].forEach(function (ms) { setTimeout(keep, ms); });
  setInterval(keep, 3000);
  W.cdWin1080 = { room: ROOM, setFab: setFab, charOf: charOf, syncWins: syncWins };
})();
