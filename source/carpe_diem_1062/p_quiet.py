"""1062 · Ingenium's Quiet Screen in Carpe Diem.

The owner's words (29 October 2026): "I want the "Quiet Screen" feature with the leaf emoji side button and page from
Ingenium added to Carpe Diem. I like the soothing feeling and the many features of Ingenium's".

Ingenium's own screen (the shared quiet_screen.html, carried whole, as The Forge 644 carries it): the same still, dim
page, the same slowly breathing circle and the same one way back, here in Carpe Diem's colours (cream by day with a
gold and blue circle, a dim night blue by night) and in French when the app is in French. It opens from the leaf 🌿 in
the side column (between the bell and the 💭, as in Ingenium), from the leaf in a floating window's column, from Focus
(beside the clock of Now, and "I need quiet" on the Calm card, which used to open the older, darker screen). While it is
open, timed notes wait and the thought bubble keeps quiet; it closes with its key or Esc, and focus goes back where it
was."""

QS = "/home/user/Ingenium-Mac-Mini/source/build/thoughts/quiet_screen.html"


def apply(p, full):
    shared = open(QS, encoding="utf-8").read().strip()
    if "window.QuietScreen={create:create,words:WORDS,v:2};" not in shared:
        raise SystemExit("not the Quiet Screen module expected")
    # Focus's "I need quiet" opens it, and the thought bubble keeps quiet while it is open
    p.rep('SC=SupportCore.create({app:"cd",lang:', 'SC=SupportCore.create({app:"cd",quietOpen:function(){if(!window.cdQuiet)throw 0;window.cdQuiet.open();},lang:')
    p.rep('return !!($("sc-quiet")||$("sc-focus-room")', 'return !!((window.cdQuiet&&window.cdQuiet.isOpen())||$("sc-quiet")||$("sc-focus-room")')
    # the leaf takes its place in the column: under the bell, above the 💭
    p.rep('var IDS=["sticky-fab","horo-fab","cd-theme-fab","cd-thought-fab","reminders-fab","cd-float-fab"];',
          'var IDS=["sticky-fab","horo-fab","cd-theme-fab","cd-thought-fab","cd-quiet-fab","reminders-fab","cd-float-fab"];')
    # and in a floating window's column, beside its neighbours
    p.rep("    { pid: 'cd-thought-fab', wid: 'cd-wf-thought' },\n",
          "    { pid: 'cd-thought-fab', wid: 'cd-wf-thought' },\n    { pid: 'cd-quiet-fab', wid: 'cd-wf-quiet' },\n")
    p.rep("      if (pid === 'cd-thought-fab') { var tg = p.querySelector('.cd-thought-glyph'); return tg ? tg.textContent : '\\uD83D\\uDCAD'; }\n",
          "      if (pid === 'cd-thought-fab') { var tg = p.querySelector('.cd-thought-glyph'); return tg ? tg.textContent : '\\uD83D\\uDCAD'; }\n"
          "      if (pid === 'cd-quiet-fab') return '\\uD83C\\uDF3F';\n")
    p.before_body_end(shared + "\n" + ADAPTER)


ADAPTER = r'''<style id="cd-1062-quiet-css">
#cd-quiet-fab{position:fixed;right:44px !important;left:auto !important;width:48px !important;height:48px !important;border-radius:50%;border:0;cursor:pointer;z-index:94;display:flex;align-items:center;justify-content:center;background:transparent;padding:0;box-shadow:none;color:inherit}
#cd-quiet-fab > span.cd-quiet-glyph{font-size:28px;line-height:1;display:inline-flex;align-items:center;justify-content:center;filter:none;text-shadow:none}
#cd-quiet-fab{transition:transform .18s cubic-bezier(.2,.8,.3,1),opacity .28s}
#cd-quiet-fab:hover{transform:translateY(-6px) scale(1.06)}
#cd-quiet-fab:active{transform:translateY(2px)}
#cd-quiet-fab > .cd-quiet-glyph{animation:cdLeafSway 9s ease-in-out infinite;transform-origin:50% 90%}
@keyframes cdLeafSway{0%,100%{transform:rotate(0)}45%{transform:rotate(-7deg)}55%{transform:rotate(5deg)}}
@media (prefers-reduced-motion:reduce){#cd-quiet-fab > .cd-quiet-glyph{animation:none}}
html[data-sc-calm] #cd-quiet-fab > *,body[data-motion="minimal"] #cd-quiet-fab > *{animation:none !important}
body.cd-dock-collapsed #cd-quiet-fab{transform:translateX(150%) !important;opacity:0 !important;pointer-events:none !important}
html.cd-nested body.cd-in-window #cd-quiet-fab{display:none !important}
body:has(#cd-door) #cd-quiet-fab,body:has(#demo-entry) #cd-quiet-fab,body:has(.sticky-panel-back) #cd-quiet-fab,body:has(#quick-note-pop:not(.hidden)) #cd-quiet-fab{display:none !important}
#cd-quiet-fab:focus-visible{outline:2px solid var(--accent,#1B6B93);outline-offset:3px}
#cd-quiet{--qsc-serif:var(--cd-serif,Georgia,"Iowan Old Style","Times New Roman",serif);--qsc-sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
#cd-quiet .qsc-big{letter-spacing:.01em}
.cd-quiet-way{white-space:nowrap}
</style>
<script id="cd-1062-quiet">
(function () {
  'use strict';
  if (window.cdQuiet || !window.QuietScreen) return;
  function $(id) { return document.getElementById(id); }
  function fr() { try { return state && state.lang === 'fr'; } catch (e) { return false; } }
  function T(en, f) { return fr() ? f : en; }
  function night() { return document.body.getAttribute('data-theme') === 'night'; }
  function calm() { try { if (window.__cdSC && window.__cdSC.on && window.__cdSC.on('calm')) return true; } catch (e) {} return document.documentElement.hasAttribute('data-sc-calm'); }
  function minimal() { return document.body.getAttribute('data-motion') === 'minimal'; }
  var EN = { name: 'Quiet screen', big: 'Nothing needs doing right now.', breathe: 'Breathe in as the circle grows, and out as it shrinks. Stay as long as you like.',
    stay: 'Stay as long as you like.', back: 'I am ready to come back', thought: '💭 A thought came in' };
  var FR = { name: 'Écran calme', big: 'Rien ne demande à être fait pour l’instant.', breathe: 'Inspirez quand le cercle grandit, expirez quand il se resserre. Restez aussi longtemps que vous le souhaitez.',
    stay: 'Restez aussi longtemps que vous le souhaitez.', back: 'Revenir au bureau', thought: '💭 Une pensée est arrivée' };
  var W = QuietScreen.words;
  function words() { var w = fr() ? FR : EN; for (var k in w) W[k] = w[k]; return w; }
  /* Carpe Diem's colours: cream by day with a gold and blue circle; a dim night blue by night */
  var LOOK = {
    day: { bg: '#f3efe6', ink: '#1d4a63', orbA: 'rgba(226,193,118,.66)', orbB: 'rgba(27,107,147,.22)', orbC: 'rgba(27,107,147,.05)', glow: 'rgba(201,162,74,.24)',
      keyInk: '#1B6B93', keyRim: 'rgba(27,107,147,.42)', keyHover: 'rgba(27,107,147,.07)', focus: '#1B6B93' },
    night: { bg: '#111a22', ink: '#e9e3d6', orbA: 'rgba(232,192,100,.42)', orbB: 'rgba(91,174,219,.22)', orbC: 'rgba(91,174,219,.05)', glow: 'rgba(232,192,100,.12)',
      keyInk: '#e9e3d6', keyRim: 'rgba(232,192,100,.55)', keyHover: 'rgba(232,192,100,.10)', focus: '#e8c064' } };
  function seen(n) { try { if (!n || !n.isConnected) return false; var r = n.getBoundingClientRect(), cs = getComputedStyle(n); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; } catch (e) { return false; } }
  var QS = QuietScreen.create({ id: 'cd-quiet', look: LOOK, night: night,
    still: function () { return minimal() || calm(); },
    tc: function () { try { if (window.cdSupport && window.cdSupport.on && !window.cdSupport.on('inbox')) return null; } catch (e) {} return window.__cdTC || null; },
    hush: function () { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} },
    hold: { toast: function () { return $('sc-toast') || $('cd-sup-toast'); }, replay: function (h) { try { if (window.__cdSC) window.__cdSC.toast(h, 9000); } catch (e) {} },
      after: function () { try { if (window.__cdTC && window.__cdTC.tick) window.__cdTC.tick(); } catch (e) {} } },
    returnTo: function () { var k = $('cd-quiet-fab'); return seen(k) ? k : null; } });
  function open() {
    var w = words(); var el = QS.el();
    try { el.setAttribute('aria-label', w.name); var b = $('cd-quiet-big'); if (b) b.textContent = w.big; var k = $('cd-quiet-back'); if (k) k.textContent = w.back; var c = $('cd-quiet-catch'); if (c) c.textContent = w.thought; } catch (e) {}
    QS.open();
  }
  window.cdQuiet = { open: open, close: function () { QS.close(); }, isOpen: function () { return QS.isOpen(); }, screen: QS };

  function name(b) { var t = T('Quiet screen: a still, dim page until you are ready', 'Écran calme : une page immobile et douce jusqu’à ce que vous souhaitiez revenir'); if (b.title !== t) { b.title = t; b.setAttribute('aria-label', T('Quiet screen', 'Écran calme')); } }
  function fab() {
    var b = $('cd-quiet-fab');
    if (!b) {
      b = document.createElement('button'); b.id = 'cd-quiet-fab'; b.type = 'button';
      b.innerHTML = '<span class="cd-quiet-glyph" aria-hidden="true">🌿</span>';
      b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); open(); });
      var bell = $('reminders-fab'); if (bell && bell.parentNode === document.body) document.body.insertBefore(b, bell.nextSibling); else document.body.appendChild(b);
    }
    name(b);
    /* the leaf shows when its neighbour the 💭 shows */
    try { var t = $('cd-thought-fab'); var on = t && getComputedStyle(t).display !== 'none'; b.style.display = on ? 'flex' : 'none'; } catch (e) {}
    return b;
  }
  /* the ways in at Focus: beside the clock of Now */
  function way() {
    var room = $('focusPages') || document;
    var head = room.querySelector && room.querySelector('[data-sc-card="now"] .sc-head');
    if (head && !head.querySelector('.cd-quiet-way')) {
      var k = document.createElement('button'); k.type = 'button'; k.className = 'btn btn-soft btn-sm cd-quiet-way';
      k.textContent = T('🌿 Quiet screen', '🌿 Écran calme'); k.title = T('A still, dim page until you are ready', 'Une page immobile et douce, jusqu’à ce que vous souhaitiez revenir');
      k.addEventListener('click', function (e) { e.stopPropagation(); open(); });
      var clock = head.querySelector('.sc-clock'); if (clock) head.insertBefore(k, clock); else head.appendChild(k);
    }
  }
  function keep() { if (!document.body) return; fab(); way(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', keep); else keep();
  [800, 2500, 6000].forEach(function (ms) { setTimeout(keep, ms); });
  setInterval(keep, 2000);
})();
</script>
'''
