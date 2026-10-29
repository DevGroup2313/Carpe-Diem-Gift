"""1061 · Carpe Diem and a room side by side, in one window; the ↗ menu without the page that opened in Safari.

The owner's words (29 October 2026): "when I try to achieve the split screen in-app Carpe Diem/Tabula view with Abacus,
the app instead opens Abacus on Safari which is not what I want ... I just retried it on Tabula again and it now opens
to Safari as well ... It's the second option of the exported floating windows I think. I really liked that behaviour
for the app and wanted it preserved. I want that function for all of my apps".

Measured in 1059: the ↗ menu of a floating window offered (1) its own window on this device, (2) "Its own page (a
file)", which writes a copy of the room into Documents and opens it in the browser (Safari on a Mac), and (3) close.
The view the owner liked, Carpe Diem and Tabula together with "Carpe Diem | Tabula" across the top, is what macOS does
with the first option while Carpe Diem fills the screen: the new window becomes a tab of Carpe Diem's. After a bad
ending with a room window open, the first option became "Fill the screen" for one run, which left the second option,
the page in Safari, where the owner's hand expected the split view.

Now the menu holds, for Tabula, Abacus, Imago, Scriba and Fontes alike:
  1. its own window (on the desktop apps; on a Mac it joins Carpe Diem's window as a tab, "Carpe Diem | Tabula", as the
     owner saw), or Fill the screen where a device offers no second window;
  2. "Side by side with Carpe Diem": the room fills the right of the window and Carpe Diem the left, divided by a line
     that can be dragged; it works on every device, the Fire tablet and the iPad included, and is remembered in its
     width; when it is on, the same place offers "Float again";
  3. Fill the screen (when the first option was its own window);
  4. Close.
The copy of a room as a page in the browser is no longer offered here."""


def apply(p, full):
    a, b = p.block("cd-windows-1059")
    seg = p.s[a:b]
    old_page = ("    if (isMain && !locked() && typeof window.__cdRoomPage === 'function') opt(T('🪟 Its own page (a file)', '🪟 Sa propre page (un fichier)'),\n"
                "      T('A self-contained page of ' + name + ', the same as here. A copy: its work travels with it.', 'Une page autonome de ' + name + ', identique. Une copie : son travail l’accompagne.'),\n"
                "      function () { window.__cdRoomPage(which); }, '', 'own-page');\n")
    new_split = ("    if (window.cdSplit) {\n"
                 "      if (window.cdSplit.isOn(win)) opt(T('◫ Float again', '◫ Flotter de nouveau'), T('Back to a floating window over Carpe Diem.', 'Retour à une fenêtre flottante au-dessus de Carpe Diem.'), function () { window.cdSplit.leave(); }, '', 'float');\n"
                 "      else opt(T('◧ Side by side with Carpe Diem', '◧ Côte à côte avec Carpe Diem'),\n"
                 "        window.cdSplit.fits() ? T('Carpe Diem on the left, ' + name + ' on the right, in this window, with the same work. Drag the line between them to share the screen.', 'Carpe Diem à gauche, ' + name + ' à droite, dans cette fenêtre, avec le même travail. Faites glisser la ligne entre les deux pour partager l’écran.')\n"
                 "          : T('This screen is too narrow for two: ' + name + ' fills it instead, with the same work.', 'Cet écran est trop étroit pour deux : ' + name + ' l’occupe alors entièrement, avec le même travail.'),\n"
                 "        function () { if (window.cdSplit.fits()) window.cdSplit.enter(win); else fill(win, which, h, isMain); }, '', 'split');\n"
                 "    }\n"
                 "    if (isMain && (h === 'desktop' || h === 'browser')) opt(T('⛶ Fill the screen', '⛶ Plein écran'), T(name + ' fills Carpe Diem’s window, with the same work.', name + ' occupe la fenêtre de Carpe Diem, avec le même travail.'), function () { fill(win, which, h, isMain); }, '', 'fill');\n")
    if seg.count(old_page) != 1:
        raise SystemExit("the menu's page option was not found once")
    seg = seg.replace(old_page, new_split)
    old_own = "      T(name + ' in a window of the app, with the same work, the side buttons, the notes and the Clepsydra.', name + ' dans une fenêtre de l’application, avec le même travail, les boutons de côté, les notes et la Clepsydre.'),\n      function () { ownNative(which, win); }, '', 'own-window');"
    new_own = "      MAC ? T(name + ' in a window of its own, as a tab beside Carpe Diem at the top of the window, with the same work, the side buttons, the notes and the Clepsydra.', name + ' dans sa propre fenêtre, en onglet à côté de Carpe Diem en haut de la fenêtre, avec le même travail, les boutons de côté, les notes et la Clepsydre.')\n        : T(name + ' in a window of the app, with the same work, the side buttons, the notes and the Clepsydra.', name + ' dans une fenêtre de l’application, avec le même travail, les boutons de côté, les notes et la Clepsydre.'),\n      function () { ownNative(which, win); }, '', 'own-window');"
    if seg.count(old_own) != 1:
        raise SystemExit("the menu's own-window option was not found once")
    seg = seg.replace(old_own, new_own)
    # MAC is used by the own-window option, which comes before the split: define it at the top of the menu
    seg = seg.replace("    var OWN = T('⧉ Open in its own window on this device', '⧉ Ouvrir dans sa propre fenêtre sur cet appareil');\n",
                      "    var OWN = T('⧉ Open in its own window on this device', '⧉ Ouvrir dans sa propre fenêtre sur cet appareil');\n"
                      "    var MAC = /Macintosh|Mac OS X/.test(navigator.userAgent || '') && !/iPhone|iPad/.test(navigator.userAgent || '');\n", 1)
    # the key's name says what it offers now
    old_t = "var want = T('Its own window, its own page, or close', 'Sa propre fenêtre, sa propre page, ou fermer');"
    if seg.count(old_t) != 1:
        raise SystemExit("the key's name was not found once")
    seg = seg.replace(old_t, "var want = T('Its own window, side by side with Carpe Diem, or close', 'Sa propre fenêtre, côte à côte avec Carpe Diem, ou fermer');")
    p.s = p.s[:a] + seg + p.s[b:]
    # the split itself comes before the menu's block, so the menu finds it
    p.rep('<style id="cd-windows-1059-css">', SPLIT + '<style id="cd-windows-1059-css">')


SPLIT = r'''<style id="cd-1061-split-css">
body.cd-split #cd-scroll{right:var(--cd-split-w,50vw) !important}
body.cd-split #control-cluster,body.cd-split #sticky-fab,body.cd-split #reminders-fab,body.cd-split #cd-thought-fab,body.cd-split #cd-theme-fab,
body.cd-split #horo-fab,body.cd-split #cd-dock-toggle,body.cd-split #cd-quiet-fab,body.cd-split #cd-float-fab{margin-right:var(--cd-split-w,50vw) !important}
.cd-fw.cd-fw-split{border-radius:0 !important;transform:none !important;margin:0 !important;box-shadow:-1px 0 0 rgba(27,107,147,.28),-10px 0 28px rgba(16,42,58,.12) !important;transition:none !important}
body.cd-split #cd-tabs-bar{left:12px !important;right:auto !important;transform:none !important}
body[data-theme="night"] .cd-fw.cd-fw-split{box-shadow:-1px 0 0 rgba(143,208,240,.25),-10px 0 28px rgba(0,0,0,.4) !important}
.cd-fw.cd-fw-split .cd-fw-edge,.cd-fw.cd-fw-split .cd-fw-grip{display:none !important}
.cd-fw.cd-fw-split .cd-fw-bar{cursor:default !important;border-radius:0 !important}
.cd-split-grip{position:absolute;left:-8px;top:0;bottom:0;width:16px;cursor:col-resize;z-index:6;touch-action:none}
.cd-split-grip::after{content:"";position:absolute;left:6px;top:50%;width:4px;height:56px;margin-top:-28px;border-radius:4px;background:rgba(27,107,147,.38);transition:background .15s ease,height .15s ease}
.cd-split-grip:hover::after,.cd-split-grip.cd-on::after{background:#1B6B93;height:72px;margin-top:-36px}
.cd-split-grip:focus-visible{outline:2px solid #1B6B93;outline-offset:-2px}
body.cd-split-dragging,body.cd-split-dragging *{cursor:col-resize !important;user-select:none !important;-webkit-user-select:none !important}
body.cd-split-dragging iframe{pointer-events:none !important}
@media (prefers-reduced-motion:reduce){.cd-split-grip::after{transition:none}}
</style>
<script id="cd-1061-split">
(function () {
  'use strict';
  if (window.cdSplit) return;
  var MINL = 360, MINR = 380, cur = null, iv = 0, said = false;
  function fr() { try { return state && state.lang === 'fr'; } catch (e) { return false; } }
  function T(en, f) { return fr() ? f : en; }
  function frac() { var f = 0.5; try { f = parseFloat(localStorage.getItem('cd_split_frac')) || 0.5; } catch (e) {} return Math.max(0.25, Math.min(0.75, f)); }
  function fits() { return window.innerWidth >= MINL + MINR; }
  function widthFor(f) { var vw = window.innerWidth; return Math.max(MINR, Math.min(vw - MINL, Math.round(vw * f))); }
  function place() {
    if (!cur) return;
    var vw = window.innerWidth, vh = window.innerHeight, w = fits() ? widthFor(frac()) : vw;
    cur.style.left = (vw - w) + 'px'; cur.style.top = '0px'; cur.style.width = w + 'px'; cur.style.height = vh + 'px';
    document.documentElement.style.setProperty('--cd-split-w', w + 'px');
  }
  function nameOf(win) { try { return ((win.querySelector('.cd-fw-title') || {}).textContent || '').trim(); } catch (e) { return ''; } }
  function grip(win) {
    if (win.querySelector('.cd-split-grip')) return;
    var g = document.createElement('div'); g.className = 'cd-split-grip'; g.tabIndex = 0; g.setAttribute('role', 'separator'); g.setAttribute('aria-orientation', 'vertical');
    g.setAttribute('aria-label', T('The line between Carpe Diem and the room: drag it, or use the arrow keys', 'La ligne entre Carpe Diem et la pièce : faites-la glisser, ou utilisez les flèches'));
    function set(f) { f = Math.max(0.25, Math.min(0.75, f)); try { localStorage.setItem('cd_split_frac', String(f)); } catch (e) {} place(); g.setAttribute('aria-valuenow', String(Math.round(f * 100))); }
    g.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      try { g.setPointerCapture(e.pointerId); } catch (x) {}
      g.classList.add('cd-on'); document.body.classList.add('cd-split-dragging');
      function move(ev) { set((window.innerWidth - ev.clientX) / window.innerWidth); }
      function up() { g.classList.remove('cd-on'); document.body.classList.remove('cd-split-dragging'); g.removeEventListener('pointermove', move); g.removeEventListener('pointerup', up); g.removeEventListener('pointercancel', up); }
      g.addEventListener('pointermove', move); g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
    });
    g.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { set(frac() + 0.03); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { set(frac() - 0.03); e.preventDefault(); }
    });
    win.appendChild(g);
  }
  function check() {
    if (!cur) { stop(); return; }
    var gone = !document.body.contains(cur), hid = false;
    try { hid = cur.className.indexOf('cd-fw-folded') >= 0 || getComputedStyle(cur).display === 'none' || cur.getAttribute('data-cd-full') === '1'; } catch (e) {}
    if (gone || hid) leave(!gone);
  }
  function stop() { if (iv) { clearInterval(iv); iv = 0; } }
  function enter(win) {
    if (!win) return false;
    if (!fits()) return false;
    if (cur && cur !== win) leave(true);
    cur = win;
    try { var r = win.getBoundingClientRect(); if (!win.hasAttribute('data-cd-split-prev')) win.setAttribute('data-cd-split-prev', [r.left, r.top, r.width, r.height].map(Math.round).join(',')); } catch (e) {}
    win.removeAttribute('data-cd-full');
    win.className = win.className.replace(/\s*cd-fw-folded/g, '');
    win.classList.add('cd-fw-split'); win.setAttribute('data-cd-split', '1');
    document.body.classList.add('cd-split');
    grip(win); place();
    try { if (typeof cdFloatRaise === 'function') cdFloatRaise(win); } catch (e) {}
    stop(); iv = setInterval(check, 600);
    if (!said) { said = true; try { var n = nameOf(win); var m = T('Carpe Diem and ' + n + ' side by side. Drag the line between them to share the screen; ↗ then “Float again” brings the window back.', 'Carpe Diem et ' + n + ' côte à côte. Faites glisser la ligne entre les deux pour partager l’écran ; ↗ puis « Flotter de nouveau » fait revenir la fenêtre.'); if (typeof window.say699 === 'function') window.say699(m, m); } catch (e) {} }
    return true;
  }
  function leave(restore) {
    if (!cur) return;
    var win = cur; cur = null; stop();
    win.classList.remove('cd-fw-split'); win.removeAttribute('data-cd-split');
    var g = win.querySelector('.cd-split-grip'); if (g) g.remove();
    var p = (win.getAttribute('data-cd-split-prev') || '').split(','); win.removeAttribute('data-cd-split-prev');
    if (restore !== false && p.length === 4 && document.body.contains(win) && win.getAttribute('data-cd-full') !== '1' && win.className.indexOf('cd-fw-folded') < 0) {
      win.style.left = p[0] + 'px'; win.style.top = p[1] + 'px'; win.style.width = p[2] + 'px'; win.style.height = p[3] + 'px';
    }
    document.body.classList.remove('cd-split');
    document.documentElement.style.removeProperty('--cd-split-w');
  }
  /* a split window stays where it is: its bar does not drag it (Float again, or the window's own keys, move it on) */
  function hold(e) {
    if (!cur) return;
    var t = e.target; if (!t || !t.closest) return;
    var bar = t.closest('.cd-fw-split .cd-fw-bar'); if (!bar) return;
    if (t.closest('button,a,input,select,[role="button"]')) return;
    e.stopPropagation();
  }
  ['pointerdown', 'mousedown', 'touchstart'].forEach(function (k) { document.addEventListener(k, hold, true); });
  window.addEventListener('resize', function () { if (cur) { if (!fits()) leave(true); else place(); } });
  window.cdSplit = { enter: enter, leave: leave, fits: fits, isOn: function (win) { return !!cur && (!win || win === cur); }, current: function () { return cur; } };
})();
</script>
'''
