"""1060 · Refresh, and the loading page that says the page is still being painted.

The owner's words (29 October 2026): "I want a refresh button added that refreshed the app if it glitches or freezes. I
also want a loading page added that informs the user that the page is still being painted instead of letting a user
think that the app has crashed or is lagging and glitching."

In 1059 the seal turned on its own while the page was read, with no word; Reload hid in the control menu as "Reset app"
(a name that frightens), asked with the browser's own box, and left whatever Tabula, Abacus or Imago had not yet saved.

Now the loading page says what is happening and how far the painting has got, in English or in French as the desk was
left; after a long wait it says so, and offers to start again. Refresh is a key beside Display (↻), the first row of
the Display menu, and F5 or Ctrl+Shift+R (Command+Shift+R on a Mac): it gathers the work of every open room, saves the
desk, then starts Carpe Diem again behind the loading page ("Starting again after Refresh. Your work is saved.")."""
import re


def apply(p, full):
    # 1. the loading page's words, bar and keys, under the seal that already turns there
    bar = re.search(r'<div id="cd-splash-bar" style="[^"]*"></div>', p.s)
    if not bar or p.s.count('<div id="cd-splash-bar"') != 1:
        raise SystemExit("the loading page's bar was not found once")
    p.s = p.s[:bar.end()] + SPLASH_WORDS + p.s[bar.end():]
    k = p.s.find('<noscript>', bar.end())
    if k < 0 or k - bar.end() > 4000:
        raise SystemExit("the end of the loading page was not where expected")
    p.s = p.s[:k] + SPLASH_JS + p.s[k:]

    # 2. Reload is Refresh, named for what it does
    p.rep('menu.appendChild(clusterMenuRow({ label: tr("ctl.resetApp", "Reset app"), onClick: () => { close(); cdResetApp(); } }));',
          'menu.appendChild(clusterMenuRow({ label: state.lang === "fr" ? "\\u21bb Actualiser Carpe Diem" : "\\u21bb Refresh Carpe Diem", onClick: () => { close(); cdResetApp(); } }));', where="core")
    p.before_body_end(REFRESH)


def boot_map(p):
    """Where each of the page's scripts begins, in thousandths of the page, for the loading bar (as The Forge 643)."""
    mark = "/*CD_BOOT_MAP*/"
    i = p.s.find(mark)
    if i < 0:
        raise SystemExit("no boot map mark")
    j = p.s.index("]", i) + 1
    n = len(p.s)
    pos = [m.start() for m in re.finditer(r"<script\b", p.s)]
    vals = sorted(set(min(999, int(x * 1000 / n)) for x in pos))
    p.s = p.s[:i] + mark + "[" + ",".join(str(v) for v in vals) + "]" + p.s[j:]


SPLASH_WORDS = ('<style id="cd-1060-splash-css">'
                '#cd-splash .cds-say{margin:0;max-width:420px;padding:0 18px;text-align:center;font:500 14.5px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;color:var(--cd-splash-fg,#28303a);opacity:.9}'
                '#cd-splash .cds-track{width:220px;height:6px;border-radius:99px;background:rgba(27,107,147,.14);overflow:hidden;margin-top:-6px}'
                'html[data-cd-splash="night"] #cd-splash .cds-track{background:rgba(143,208,240,.16)}'
                '#cd-splash .cds-track i{display:block;height:100%;width:3%;border-radius:inherit;background:#1B6B93;transition:width .35s ease}'
                'html[data-cd-splash="night"] #cd-splash .cds-track i{background:#5BAEDB}'
                '#cd-splash .cds-pct{font:12.5px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;color:var(--cd-splash-fg,#28303a);opacity:.65;font-variant-numeric:tabular-nums;min-height:1.4em;margin-top:-10px}'
                '#cd-splash .cds-more{margin:0;max-width:440px;padding:0 18px;text-align:center;font:14px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;color:var(--cd-splash-fg,#28303a);opacity:.85}'
                '#cd-splash .cds-keys{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}'
                '#cd-splash [hidden]{display:none !important}'
                '#cd-splash .cds-key{font:600 14px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;padding:11px 18px;border-radius:12px;cursor:pointer;border:1px solid rgba(27,107,147,.35);background:#fff;color:#1B6B93;box-shadow:0 2px 0 rgba(27,107,147,.25),0 6px 14px rgba(16,42,58,.12);transition:transform .2s cubic-bezier(.34,1.35,.64,1)}'
                '#cd-splash .cds-key.cds-main{background:#1B6B93;color:#fff;border-color:#155777;box-shadow:0 2px 0 #0f4560,0 6px 14px rgba(16,42,58,.2)}'
                '#cd-splash .cds-key:hover{transform:translateY(-1px)}#cd-splash .cds-key:active{transform:translateY(1px)}'
                '#cd-splash .cds-key:focus-visible{outline:3px solid #c9a24a;outline-offset:2px}'
                'html[data-cd-splash="night"] #cd-splash .cds-key:not(.cds-main){background:#1b2027;color:#e8eef5;border-color:rgba(143,208,240,.3)}'
                '@media (prefers-reduced-motion:reduce){#cd-splash .cds-track i{transition:none}}'
                '</style>'
                '<p class="cds-say" id="cds-say" role="status" aria-live="polite">Getting ready. The page is still being painted; nothing has crashed.</p>'
                '<div class="cds-track" role="progressbar" aria-label="How much of the page is painted" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="cds-bar"></i></div>'
                '<div class="cds-pct" id="cds-pct" aria-hidden="true"></div>'
                '<p class="cds-more" id="cds-more" hidden></p>'
                '<div class="cds-keys" id="cds-keys" hidden><button type="button" class="cds-key cds-main" id="cds-refresh">Refresh</button><button type="button" class="cds-key" id="cds-wait">Keep waiting</button></div>')

SPLASH_JS = r'''<script id="cd-1060-splash">
(function () {
  'use strict';
  var sp = document.getElementById('cd-splash'); if (!sp) return;
  function $(id) { return document.getElementById(id); }
  var MAP = /*CD_BOOT_MAP*/[], T0 = Date.now(), last = -1, lastMove = Date.now(), stage = 0, seg = -1, segAt = Date.now(), done = false, loadAt = 0, fr = false;
  try { var st = JSON.parse(localStorage.getItem('carpe_diem_offline_v1') || 'null') || {}; fr = st.lang === 'fr'; } catch (e) {}
  function T(en, f) { return fr ? f : en; }
  var again = false; try { again = !!sessionStorage.getItem('cd_refresh_at'); sessionStorage.removeItem('cd_refresh_at'); } catch (e) {}
  $('cds-say').textContent = again ? T('Starting again after Refresh. Your work is saved; the page is being painted.', 'Nouveau départ après Actualiser. Votre travail est enregistré ; la page se dessine.')
                                   : T('Getting ready. The page is still being painted; nothing has crashed.', 'Préparation en cours. La page se dessine encore ; rien ne s’est arrêté.');
  $('cds-refresh').textContent = T('Refresh', 'Actualiser'); $('cds-wait').textContent = T('Keep waiting', 'Patienter encore');
  try { sp.querySelector('.cds-track').setAttribute('aria-label', T('How much of the page is painted', 'Part de la page déjà dessinée')); } catch (e) {}
  try { window.addEventListener('load', function () { loadAt = Date.now(); to(2, 'Almost ready.', 'Presque prête.'); }); } catch (e) {}
  var phase = 0, phaseAt = Date.now();
  function parsed() {
    var n = document.scripts.length, k = Math.max(0, Math.min(MAP.length - 1, n - 1));
    if (!MAP.length) return Math.min(.9, n / 300);
    if (k !== seg) { seg = k; segAt = Date.now(); }
    var a = MAP[k] / 1000, z = (k + 1 < MAP.length ? MAP[k + 1] : 1000) / 1000, s = (Date.now() - segAt) / 1000;
    return a + (z - a) * 0.85 * (1 - Math.exp(-s / 4));
  }
  function frac() {
    if (phase === 0) return 0.7 * parsed();
    var a = phase === 1 ? 0.7 : 0.86, z = phase === 1 ? 0.86 : 0.97, s = (Date.now() - phaseAt) / 1000;
    return a + (z - a) * (1 - Math.exp(-s / 2.5));
  }
  function to(n, en, f) { if (phase >= n) return; phase = n; phaseAt = Date.now(); if (!again || n > 1) { var e = $('cds-say'); if (e) e.textContent = T(en, f); } }
  window.__cdSplashTo = to;
  try { document.addEventListener('DOMContentLoaded', function () { to(1, 'Setting out your desk: the rooms, your work and today’s plan.', 'Mise en place du bureau : les pièces, votre travail et le programme du jour.'); }); } catch (e) {}
  function show(pc) {
    var b = $('cds-bar'); if (b) b.style.width = pc + '%';
    try { sp.querySelector('.cds-track').setAttribute('aria-valuenow', String(pc)); } catch (e) {}
    var t = $('cds-pct'); if (t) t.textContent = pc >= 100 ? T('Ready', 'Prête') : T(pc + '% painted', pc + ' % dessinée');
  }
  function say(t, keys) { var m = $('cds-more'); if (m) { m.hidden = false; m.textContent = t; } var k = $('cds-keys'); if (k) k.hidden = !keys; }
  function gone() { return !sp.parentNode || sp.style.opacity === '0'; }
  function tick() {
    if (done) return;
    if (gone()) { done = true; show(100); return; }
    var pc = Math.max(3, Math.min(97, Math.round(frac() * 100)));
    if (pc > last) { last = pc; lastMove = Date.now(); show(pc); }
    var s = (Date.now() - T0) / 1000;
    if (stage < 1 && s > 15) { stage = 1; say(T('This is taking longer than usual. A large page paints slowly on a tablet or a phone, and the first start after an update is the slowest. It is still working.', 'Cela prend plus de temps que d’habitude. Une grande page se dessine lentement sur une tablette ou un téléphone, et le premier démarrage après une mise à jour est le plus lent. Elle travaille toujours.'), false); }
    if (stage < 2 && s > 45 && Date.now() - lastMove > 20000) { stage = 2; say(T('Nothing has moved for a while. You can keep waiting, or press Refresh to start Carpe Diem again. Your saved work stays where it is.', 'Rien n’a bougé depuis un moment. Vous pouvez patienter encore, ou appuyer sur Actualiser pour relancer Carpe Diem. Votre travail enregistré reste où il est.'), true); }
    if (loadAt && Date.now() - loadAt > 20000 && !gone()) { stage = 2; say(T('The page is painted, but it has not opened. Press Refresh to start Carpe Diem again; your saved work stays where it is.', 'La page est dessinée, mais ne s’est pas ouverte. Appuyez sur Actualiser pour relancer Carpe Diem ; votre travail enregistré reste où il est.'), true); loadAt = 0; }
    setTimeout(tick, 250);
  }
  $('cds-refresh').onclick = function () { try { sessionStorage.setItem('cd_refresh_at', String(Date.now())); } catch (e) {} try { location.reload(); } catch (e) { location.href = location.href; } };
  $('cds-wait').onclick = function () { stage = 1; lastMove = Date.now(); say(T('Still working. Thank you for waiting.', 'Toujours au travail. Merci de patienter.'), false); };
  tick();
})();
</script>
'''

REFRESH = r'''<style id="cd-1060-refresh-css">
#cd-refresh-btn{font-size:15px;line-height:1;min-width:30px}
#cd-refresh-btn.cd-turning{pointer-events:none;opacity:.7}
#cd-refresh-btn.cd-turning .cd-rf-i{display:inline-block;animation:cdRfSpin .6s cubic-bezier(.34,1.35,.64,1)}
@keyframes cdRfSpin{to{transform:rotate(360deg)}}
#cd-refresh-ask{position:fixed;inset:0;z-index:2147483200;background:rgba(16,42,58,.28);display:flex;align-items:center;justify-content:center;padding:16px}
#cd-refresh-ask .cd-rfa-card{max-width:420px;width:100%;border-radius:16px;padding:20px 22px;background:#eaf3f9;color:#173f57;border:1px solid #b9d5e6;box-shadow:0 2px 0 rgba(27,107,147,.14),0 18px 44px rgba(16,42,58,.24);font:14.5px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
body[data-theme="night"] #cd-refresh-ask .cd-rfa-card{background:#d9e8f1;border-color:#a9c9dc;box-shadow:0 2px 0 rgba(0,0,0,.3),0 18px 44px rgba(0,0,0,.45)}
#cd-refresh-ask h2{margin:0 0 6px;font:600 18px/1.3 var(--cd-serif,Georgia,serif);color:#173f57}
#cd-refresh-ask p{margin:0 0 14px;color:rgba(23,63,87,.85)}
#cd-refresh-ask .cd-rfa-keys{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
#cd-refresh-ask button{font:600 13.5px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;padding:10px 16px;border-radius:999px;cursor:pointer;border:1px solid rgba(27,107,147,.35);background:#fff;color:#1B6B93;box-shadow:0 1px 0 rgba(27,107,147,.18)}
#cd-refresh-ask button.cd-rfa-go{background:#1B6B93;color:#fff;border-color:#1B6B93;box-shadow:0 2px 0 #124c69}
#cd-refresh-ask button:focus-visible{outline:2px solid #1B6B93;outline-offset:2px}
.cd-display-menu .cd-rf-row{display:flex;align-items:center;gap:8px;width:100%;margin:2px 0 8px;padding:9px 11px;border-radius:10px;cursor:pointer;border:1px solid rgba(27,107,147,.28);background:rgba(27,107,147,.06);color:inherit;font:600 13.5px/1.3 inherit;text-align:left}
.cd-display-menu .cd-rf-row:hover{background:rgba(27,107,147,.12)}
.cd-display-menu .cd-rf-row small{display:block;font-weight:400;font-size:11.5px;opacity:.75}
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
  function go() {
    try { var b = document.getElementById('cd-refresh-btn'); if (b) b.classList.add('cd-turning'); } catch (e) {}
    gather();
    try { sessionStorage.setItem('cd_refresh_at', String(Date.now())); } catch (e) {}
    setTimeout(function () { try { location.reload(); } catch (e) { location.href = location.href; } }, 160);
  }
  function ask() {
    var old = document.getElementById('cd-refresh-ask'); if (old) old.remove();
    var d = document.createElement('div'); d.id = 'cd-refresh-ask'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'cd-rfa-t');
    d.innerHTML = '<div class="cd-rfa-card"><h2 id="cd-rfa-t"></h2><p></p><div class="cd-rfa-keys"><button type="button" class="cd-rfa-no"></button><button type="button" class="cd-rfa-go"></button></div></div>';
    d.querySelector('h2').textContent = T('Refresh Carpe Diem?', 'Actualiser Carpe Diem ?');
    d.querySelector('p').textContent = T('Your work in every open room is saved first, then Carpe Diem starts again. Use it whenever the app seems stuck or slow.', 'Le travail de chaque pièce ouverte est d’abord enregistré, puis Carpe Diem redémarre. Utilisez-le quand l’application semble bloquée ou lente.');
    var no = d.querySelector('.cd-rfa-no'), yes = d.querySelector('.cd-rfa-go');
    no.textContent = T('Keep working', 'Continuer'); yes.textContent = T('Refresh', 'Actualiser');
    function close() { try { d.remove(); } catch (e) {} document.removeEventListener('keydown', key, true); }
    function key(e) { if (e.key === 'Escape') { close(); e.stopPropagation(); } }
    no.onclick = close; yes.onclick = function () { close(); go(); };
    d.addEventListener('click', function (e) { if (e.target === d) close(); });
    document.body.appendChild(d); document.addEventListener('keydown', key, true);
    try { yes.focus(); } catch (e) {}
  }
  window.cdRefresh = function (askFirst) { if (askFirst === false) go(); else ask(); };
  window.cdResetApp = function () { ask(); };
  try { cdResetApp = window.cdResetApp; } catch (e) {}
  document.addEventListener('keydown', function (e) {
    var k = e.key || '';
    if (k === 'F5' || ((e.ctrlKey || e.metaKey) && e.shiftKey && (k === 'R' || k === 'r'))) {
      e.preventDefault(); e.stopPropagation(); go();
    }
  }, true);
  function key() {
    var c = document.getElementById('control-cluster'), d = document.getElementById('display-btn');
    if (!c || !d || document.getElementById('cd-refresh-btn')) return;
    var b = document.createElement('button'); b.id = 'cd-refresh-btn'; b.type = 'button'; b.className = 'cl-icon';
    b.innerHTML = '<span class="cd-rf-i" aria-hidden="true">↻</span>';
    function name() { var t = T('Refresh Carpe Diem: saves your work, then starts again', 'Actualiser Carpe Diem : enregistre votre travail, puis redémarre'); b.title = t; b.setAttribute('aria-label', t); }
    name(); b.onclick = function () { ask(); };
    c.insertBefore(b, d);
    try { new MutationObserver(name).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] }); } catch (e) {}
  }
  function row() {
    setTimeout(function () {
      var m = document.querySelector('.cd-display-menu'); if (!m || m.querySelector('.cd-rf-row')) return;
      var r = document.createElement('button'); r.type = 'button'; r.className = 'cd-rf-row';
      r.innerHTML = '<span aria-hidden="true">↻</span><span><span class="cd-rf-l"></span><small></small></span>';
      r.querySelector('.cd-rf-l').textContent = T('Refresh Carpe Diem', 'Actualiser Carpe Diem');
      r.querySelector('small').textContent = T('If the app glitches or freezes: your work is saved, then it starts again.', 'Si l’application se fige ou se dérègle : le travail est enregistré, puis elle redémarre.');
      r.onclick = function () { ask(); };
      var first = m.firstElementChild; if (first && first.nextSibling) m.insertBefore(r, first.nextSibling); else m.appendChild(r);
    }, 0);
  }
  document.addEventListener('click', function (e) { try { if (e.target && e.target.closest && e.target.closest('#display-btn')) row(); } catch (x) {} }, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', key); else key();
  setTimeout(key, 1500); setTimeout(key, 5000);
})();
</script>
'''
