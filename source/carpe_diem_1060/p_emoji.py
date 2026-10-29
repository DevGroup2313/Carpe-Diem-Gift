"""1060 · the side keys on Windows 10, as on Windows 11.

The owner's words (29 October 2026): "One of my HP laptops have Windows 10 and the side emoji buttons have this harsh black
outline over them that I detest and want removed, I want the emoji buttons to look the same way they look on Windows 11."

Windows 10 draws emoji with the older Segoe UI Emoji, whose figures carry a heavy black outline; Windows 11 draws Fluent's
flat ones. On Windows 10 (and older), and only there, each side key (the notes, the hourglass, the moon or the sun, the
thought, the bell, and the leaf) shows Microsoft's own flat Fluent drawing of its emoji (MIT licence; see
THIRD_PARTY_NOTICES.txt), in the main window and in every floating window's keys, as The Forge 647 and Ingenium do. The key
keeps its name for screen readers; the picture itself says nothing."""
import base64, json, os

EMOJI = "/home/user/Ingenium-Mac-Mini/source/build/emoji"
MAP = {"\U0001f5d2": "spiral_notepad", "⏳": "hourglass_not_done", "⌛": "hourglass_not_done",
       "\U0001f319": "crescent_moon", "☀": "sun", "\U0001f4ad": "thought_balloon", "\U0001f514": "bell",
       "\U0001f33f": "herb"}


def apply(p, full):
    pics = {k: "data:image/svg+xml;base64," + base64.b64encode(open(os.path.join(EMOJI, v + "_flat.svg"), "rb").read()).decode("ascii")
            for k, v in MAP.items()}
    p.before_body_end(BLOCK.replace("__PICS__", json.dumps(pics, ensure_ascii=False)))


BLOCK = r'''<style id="cd-1060-emoji-css">
html.cd-emoji-pics img.cd-emo{display:inline-block;width:1em;height:1em;vertical-align:-0.125em;margin:0;border:0;pointer-events:none;-webkit-user-drag:none;user-select:none}
</style>
<script id="cd-1060-emoji">
(function () {
  'use strict';
  if (window.__cdEmo1060) return; window.__cdEmo1060 = 1;
  var D = document, PIC = __PICS__;
  var SEL = '#sticky-fab>span,#horo-fab>span:first-child,#cd-theme-fab>span,#cd-thought-fab .cd-thought-glyph,#reminders-fab .rem-fab-bell,#cd-quiet-fab .cd-quiet-glyph';
  var WSEL = '#cd-jewel-winfabs .cd-wf-glyph';
  var CSS = 'img.cd-emo{display:inline-block;width:1em;height:1em;vertical-align:-0.125em;margin:0;border:0;pointer-events:none;-webkit-user-drag:none;user-select:none}';
  function norm(t) { return String(t || '').replace(/️/g, '').trim(); }
  function dress(span, doc) {
    var t = norm(span.textContent), src = PIC[t];
    if (!src) return;
    if (span.__cdEmo === t && span.querySelector('img.cd-emo')) return;
    span.__cdEmo = t; span.setAttribute('data-emoji', t);
    var im = doc.createElement('img'); im.alt = ''; im.className = 'cd-emo'; im.draggable = false; im.src = src;
    span.textContent = ''; span.appendChild(im);
  }
  function frames() {
    var out = [];
    try { [].forEach.call(D.querySelectorAll('iframe[id^="cd-fw-frame-"]'), function (f) { try { var d = f.contentDocument; if (d && d.body) out.push(d); } catch (e) {} }); } catch (e) {}
    return out;
  }
  function all() {
    [].forEach.call(D.querySelectorAll(SEL), function (s) { if (!s.querySelector('img.cd-emo') || norm(s.textContent)) dress(s, D); });
    frames().forEach(function (d) {
      if (!d.getElementById('cd-1060-emoji-css')) { var st = d.createElement('style'); st.id = 'cd-1060-emoji-css'; st.textContent = CSS; (d.head || d.body).appendChild(st); }
      [].forEach.call(d.querySelectorAll(WSEL), function (s) { if (!s.querySelector('img.cd-emo') || norm(s.textContent)) dress(s, d); });
    });
  }
  function windowsBefore11() {
    var ua = navigator.userAgent || '';
    if (!/Windows NT/.test(ua)) return Promise.resolve(false);
    if (!/Windows NT 10\.0/.test(ua)) return Promise.resolve(true);
    var d = navigator.userAgentData;
    if (!d || d.platform !== 'Windows' || typeof d.getHighEntropyValues !== 'function') return Promise.resolve(false);
    return d.getHighEntropyValues(['platformVersion']).then(function (h) {
      var major = parseInt(String((h && h.platformVersion) || '').split('.')[0], 10);
      return isFinite(major) && major < 13;
    }, function () { return false; });
  }
  window.cdEmojiPics = { on: false, _: { windowsBefore11: windowsBefore11, all: all, pics: PIC } };
  windowsBefore11().then(function (yes) {
    if (!yes) return;
    D.documentElement.classList.add('cd-emoji-pics');
    all();
    var q = 0, IDS = ['sticky-fab', 'horo-fab', 'cd-theme-fab', 'cd-thought-fab', 'reminders-fab', 'cd-quiet-fab'];
    function soon() { if (!q) q = requestAnimationFrame(function () { q = 0; all(); }); }
    try {
      var keys = new MutationObserver(soon);
      var watch = function () { IDS.forEach(function (id) { var e = D.getElementById(id); if (e && !e.__cdEmoW) { e.__cdEmoW = 1; keys.observe(e, { childList: true, subtree: true, characterData: true }); } }); };
      watch();
      new MutationObserver(function () { watch(); soon(); }).observe(D.body, { childList: true });
    } catch (e) {}
    setInterval(function () { if (frames().length) all(); }, 1500);
    window.cdEmojiPics.on = true;
  }).catch(function () {});
})();
</script>
'''
