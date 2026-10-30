"""1065 · two things 1060 to 1064 took away, given back, and the card for a newer build.

The owner's words (30 October 2026): "The app refresh button is in the wrong location, it needs to be in inside of the
Display panel like it is on Ingenium and the Forge and the introduction door lost its sound for when I click open the
app. You are regressing the app."

Refresh. 1060 put a ↻ key in the top bar, beside Display, and a row of its own kind low in the Display menu. Now, as in
Ingenium and The Forge, Refresh is the first row of the Display panel, inside its title block (so the menu's sorting
leaves it first), drawn as the panel's other rows are: its label, one key of the panel's own kind, and its tip. The top
bar keeps Display, Guide and About. F5 and Ctrl+Shift+R (Command+Shift+R) still refresh. As in The Forge, the key
refreshes at once (the work of every open room is saved first); it asks first only while the Clepsydra runs.

The door's chime. The sound module rings the day's chime once a page: when the door opens, or, on a day without the
door, at the first touch. A touch while the page was still opening (the loading page up, the door not yet drawn) was
taken for the first touch of a day without the door: the chime rang then, half heard under the loading page, and the
door opened in silence. 1060's longer loading page, with its words and keys, made that early touch likely. Now a touch
while the page is opening, or before the door has been decided, leaves the chime to the door.

The newer build. The Mac app (1065) notices when a newer Carpe Diem has been put in its place while it is open, and asks
the page to offer a restart into it: window.cdNewBuildInstalled(build)."""
import re


def apply(p, full):
    # 1. Refresh, in the Display panel
    a = p.s.find('<style id="cd-1060-refresh-css">')
    j = p.s.find('<script id="cd-1060-refresh">')
    if a < 0 or j < a or p.s.count('<script id="cd-1060-refresh">') != 1:
        raise SystemExit("the 1060 Refresh block was not found once")
    b = p.s.find('</script>', j) + len('</script>')
    old = p.s[a:b]
    for must in ("function gather()", "window.cdRefresh", "function key()", "function row()", "c.insertBefore(b, d);"):
        if must not in old:
            raise SystemExit("the 1060 Refresh block is not the one expected (%s)" % must)
    p.s = p.s[:a] + REFRESH + p.s[b:]

    # 2. the door keeps its chime
    old_touch = ("    if (document.getElementById('cd-door') || document.getElementById('demo-entry')) return;\n"
                 "    dayChime();\n")
    new_touch = ("    if (document.getElementById('cd-door') || document.getElementById('demo-entry')) return;\n"
                 "    if (doorAhead()) return;\n"
                 "    dayChime();\n")
    p.rep(old_touch, new_touch, where="all")
    old_fn = "  function firstTouch() {\n"
    new_fn = DOOR_AHEAD + "  function firstTouch() {\n"
    p.rep(old_fn, new_fn, where="all")
    p.before_body_end(DOOR_JS + NEWBUILD)


DOOR_AHEAD = r'''  // 1065: a touch while the page is still opening (the loading page up, or the door not yet decided) is not the first
  // touch of a day without the door; it leaves the chime to the door
  function doorAhead() {
    try {
      var sp = document.getElementById('cd-splash');
      if (sp && sp.parentNode && sp.style.opacity !== '0') return true;
      if (!window.__cdDoorChecked) return true;
    } catch (e) {}
    return false;
  }
'''

DOOR_JS = r'''<script id="cd-1065-door">
(function () {
  'use strict';
  // the door is decided a moment after the page is read (cdMaybeShowDoor); until then a touch leaves the chime to it
  function decided() { window.__cdDoorChecked = true; }
  try {
    if (typeof cdMaybeShowDoor === 'function' && !cdMaybeShowDoor.__cd1065) {
      var was = cdMaybeShowDoor;
      cdMaybeShowDoor = function () { try { return was.apply(this, arguments); } finally { decided(); } };
      cdMaybeShowDoor.__cd1065 = 1;
    }
  } catch (e) {}
  // an edition whose door is drawn another way is decided once the page has settled
  try { window.addEventListener('load', function () { setTimeout(decided, 3000); }); } catch (e) {}
  setTimeout(decided, 30000);
})();
</script>
'''

REFRESH = r'''<style id="cd-1060-refresh-css">
.cd-rfa-wrap{position:fixed;inset:0;z-index:2147483200;background:rgba(16,42,58,.28);display:flex;align-items:center;justify-content:center;padding:16px}
.cd-rfa-wrap .cd-rfa-card{max-width:440px;width:100%;border-radius:16px;padding:20px 22px;background:#eaf3f9;color:#173f57;border:1px solid #b9d5e6;box-shadow:0 2px 0 rgba(27,107,147,.14),0 18px 44px rgba(16,42,58,.24);font:14.5px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
body[data-theme="night"] .cd-rfa-wrap .cd-rfa-card{background:#d9e8f1;border-color:#a9c9dc;box-shadow:0 2px 0 rgba(0,0,0,.3),0 18px 44px rgba(0,0,0,.45)}
.cd-rfa-wrap h2{margin:0 0 6px;font:600 18px/1.3 var(--cd-serif,Georgia,serif);color:#173f57}
.cd-rfa-wrap p{margin:0 0 14px;color:rgba(23,63,87,.85)}
.cd-rfa-wrap .cd-rfa-keys{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
.cd-rfa-wrap button{font:600 13.5px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;padding:10px 16px;border-radius:999px;cursor:pointer;border:1px solid rgba(27,107,147,.35);background:#fff;color:#1B6B93;box-shadow:0 1px 0 rgba(27,107,147,.18)}
.cd-rfa-wrap button.cd-rfa-go{background:#1B6B93;color:#fff;border-color:#1B6B93;box-shadow:0 2px 0 #124c69}
.cd-rfa-wrap button:focus-visible{outline:2px solid #1B6B93;outline-offset:2px}
.cd-display-menu .cd-rf-row{display:block;padding:7px 8px;margin:8px -8px 0;border-top:1px solid rgba(23,87,122,.12);font:400 13px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;letter-spacing:0;text-transform:none;color:inherit;text-align:left}
body[data-theme="night"] .cd-display-menu .cd-rf-row{border-top-color:rgba(255,255,255,.1)}
#cd-refresh-btn{display:inline-flex;align-items:center;gap:5px}
#cd-refresh-btn .cd-rf-i{width:13px;height:13px;flex:0 0 auto}
#cd-refresh-btn.cd-turning{pointer-events:none;opacity:.7}
#cd-refresh-btn.cd-turning .cd-rf-i{animation:cdRfSpin .6s cubic-bezier(.34,1.35,.64,1)}
@keyframes cdRfSpin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){#cd-refresh-btn.cd-turning .cd-rf-i{animation:none}}
</style>
<script id="cd-1060-refresh">
(function () {
  'use strict';
  if (window.cdRefresh) return;
  function fr() { try { return state && state.lang === 'fr'; } catch (e) { return false; } }
  function T(en, f) { return fr() ? f : en; }
  var ROOMS = ['tabula', 'abacus', 'slides', 'scriba', 'fontes'];
  function gather() {
    ROOMS.forEach(function (w) {
      ['frame-' + w, 'cd-fw-frame-' + w].forEach(function (id) {
        try { var f = document.getElementById(id); if (f && typeof cdCaptureStudio === 'function') cdCaptureStudio(f, w); } catch (e) {}
      });
    });
    try { if (typeof saveState === 'function') saveState(); } catch (e) {}
  }
  window.cdGatherWork = gather;
  function go() {
    try { var b = document.getElementById('cd-refresh-btn'); if (b) b.classList.add('cd-turning'); } catch (e) {}
    gather();
    try { sessionStorage.setItem('cd_refresh_at', String(Date.now())); } catch (e) {}
    setTimeout(function () { try { location.reload(); } catch (e) { location.href = location.href; } }, 380);
  }
  function busy() { try { if (typeof pomo === 'object' && pomo && pomo.running) return T('The Clepsydra is running.', 'La clepsydre est en marche.'); } catch (e) {} return ''; }
  function ask(why) {
    var old = document.getElementById('cd-refresh-ask'); if (old) old.remove();
    var d = document.createElement('div'); d.id = 'cd-refresh-ask'; d.className = 'cd-rfa-wrap'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'cd-rfa-t');
    d.innerHTML = '<div class="cd-rfa-card"><h2 id="cd-rfa-t"></h2><p></p><div class="cd-rfa-keys"><button type="button" class="cd-rfa-no"></button><button type="button" class="cd-rfa-go"></button></div></div>';
    d.querySelector('h2').textContent = T('Refresh Carpe Diem?', 'Actualiser Carpe Diem ?');
    d.querySelector('p').textContent = (why ? why + ' ' : '') + T('Your work in every open room is saved first, then Carpe Diem starts again.', 'Le travail de chaque pièce ouverte est d’abord enregistré, puis Carpe Diem redémarre.');
    var no = d.querySelector('.cd-rfa-no'), yes = d.querySelector('.cd-rfa-go');
    no.textContent = T('Keep working', 'Continuer'); yes.textContent = T('Refresh', 'Actualiser');
    function close() { try { d.remove(); } catch (e) {} document.removeEventListener('keydown', key, true); }
    function key(e) { if (e.key === 'Escape') { close(); e.stopPropagation(); } }
    no.onclick = close; yes.onclick = function () { close(); go(); };
    d.addEventListener('click', function (e) { if (e.target === d) close(); });
    document.body.appendChild(d); document.addEventListener('keydown', key, true);
    try { yes.focus(); } catch (e) {}
  }
  // as in Ingenium and The Forge: at once, the work saved first; asked first only while something would be cut short
  function refresh() { var b = busy(); if (b) ask(b); else go(); }
  window.cdRefresh = function (askFirst) { if (askFirst === false) go(); else if (askFirst === true) ask(''); else refresh(); };
  window.cdResetApp = function () { refresh(); };
  try { cdResetApp = window.cdResetApp; } catch (e) {}
  document.addEventListener('keydown', function (e) {
    var k = e.key || '';
    if (k === 'F5' || ((e.ctrlKey || e.metaKey) && e.shiftKey && (k === 'R' || k === 'r'))) {
      e.preventDefault(); e.stopPropagation(); refresh();
    }
  }, true);
  // the key: the first row of the Display panel, inside its title block, so the panel's sorting leaves it first; drawn
  // again whenever the panel is drawn, which it is afresh each time it opens and after each choice in it
  var ARROW = '<svg class="cd-rf-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.6 4.2v4.6H15"/></svg>';
  function inMenu(menu) {
    var head = menu.querySelector('.cd-dm-head');
    if (!head || head.querySelector('#cd-refresh-row')) return;
    var row = document.createElement('div'); row.className = 'cd-rf-row'; row.id = 'cd-refresh-row';
    var lab = document.createElement('div'); lab.className = 'cd-dm-label'; lab.textContent = '🔄 ' + T('Refresh', 'Actualiser');
    var k = document.createElement('button'); k.id = 'cd-refresh-btn'; k.type = 'button'; k.className = 'cd-seg'; k.setAttribute('data-cd-lift', '1');
    k.innerHTML = ARROW + '<span class="cd-rf-l"></span>';
    k.querySelector('.cd-rf-l').textContent = T('Refresh the app', 'Actualiser l’application');
    k.title = T('Refresh the app: Carpe Diem starts again if it glitches or stops answering. Your work is saved first.', 'Actualiser l’application : Carpe Diem redémarre s’il se fige ou ne répond plus. Votre travail est d’abord enregistré.');
    k.addEventListener('click', function (e) { e.stopPropagation(); refresh(); });
    var tip = document.createElement('div'); tip.className = 'cd-dm-tip';
    tip.textContent = '💡 ' + T('If the app glitches or stops answering. Your work is saved first.', 'Si l’application se fige ou ne répond plus. Votre travail est d’abord enregistré.');
    row.appendChild(lab); row.appendChild(k); row.appendChild(tip);
    head.appendChild(row);
  }
  var menus = document.getElementsByClassName('cd-display-menu');
  function look() { for (var i = 0; i < menus.length; i++) inMenu(menus[i]); }
  function watch() { try { new MutationObserver(function () { if (menus.length) look(); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {} }
  if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch);
})();
</script>
'''

NEWBUILD = r'''<script id="cd-1065-newbuild">
(function () {
  'use strict';
  if (window.cdNewBuildInstalled) return;
  function fr() { try { return state && state.lang === 'fr'; } catch (e) { return false; } }
  function T(en, f) { return fr() ? f : en; }
  // asked by the Mac app when a newer Carpe Diem has been put in this one's place while it is open
  window.cdNewBuildInstalled = function (build) {
    var b = String(build || '').replace(/[^0-9]/g, '');
    if (!b || document.getElementById('cd-newbuild-ask')) return false;
    var d = document.createElement('div'); d.id = 'cd-newbuild-ask'; d.className = 'cd-rfa-wrap'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'cd-nb-t');
    d.innerHTML = '<div class="cd-rfa-card"><h2 id="cd-nb-t"></h2><p></p><div class="cd-rfa-keys"><button type="button" class="cd-rfa-no"></button><button type="button" class="cd-rfa-go"></button></div></div>';
    d.querySelector('h2').textContent = T('Carpe Diem ' + b + ' is installed', 'Carpe Diem ' + b + ' est installé');
    var p = d.querySelector('p');
    p.textContent = T('A newer Carpe Diem was put in this one’s place while it was open. Restart to open it: your work is saved first and stays as it is.',
                      'Un Carpe Diem plus récent a pris la place de celui-ci pendant qu’il était ouvert. Redémarrez pour l’ouvrir : votre travail est d’abord enregistré et reste tel quel.');
    var no = d.querySelector('.cd-rfa-no'), yes = d.querySelector('.cd-rfa-go');
    no.textContent = T('Later', 'Plus tard'); yes.textContent = T('Restart now', 'Redémarrer');
    function close() { try { d.remove(); } catch (e) {} }
    function by() { p.textContent = T('Quit Carpe Diem (Command-Q), then open it again: the newer build opens, with your work.', 'Quittez Carpe Diem (Commande-Q), puis rouvrez-le : la version plus récente s’ouvre, avec votre travail.'); yes.remove(); no.textContent = T('Close', 'Fermer'); }
    no.onclick = close;
    yes.onclick = function () {
      yes.disabled = true; yes.textContent = T('Saving…', 'Enregistrement…');
      try { if (window.cdGatherWork) window.cdGatherWork(); else if (typeof saveState === 'function') saveState(); } catch (e) {}
      setTimeout(function () {
        try {
          var api = window.pywebview && window.pywebview.api;
          if (!api || typeof api.restart_into_new_build !== 'function') { by(); return; }
          Promise.resolve(api.restart_into_new_build()).then(function (ok) { if (ok !== true) by(); }, by);
        } catch (e) { by(); }
      }, 1200);
    };
    document.body.appendChild(d);
    try { yes.focus(); } catch (e) {}
    return true;
  };
})();
</script>
'''
