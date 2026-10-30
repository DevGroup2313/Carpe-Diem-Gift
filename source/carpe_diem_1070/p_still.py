"""1070 · the decorations that move cost almost nothing, and move only where they can be seen.

The owner asked for a fast app on both HP laptops. Measured with nothing touched, the page kept the processor busy: the
glitter on the app keys, the glow on Tabula's app keys, the seal, the bell and the dots move without end, and each of
their frames made the browser paint again a large part of the window around them (on Home about 1.5 s of painting in
every 3 s; in Tabula with a 100,000-word document open, 2.3 s in every 3 s), and Home's went on moving behind Tabula,
where no one can see them.

Now each moving decoration is drawn on a layer of its own, so a frame of it paints only the decoration (it looks the
same: these keys already stack on their own), and a decoration that cannot be seen (Home behind an open app or a room,
a key behind a panel, anything scrolled out of sight, a window that is not shown) holds still until it can be seen
again. Nothing that moves once (a card arriving, a page turning) is touched, and the settings for calm or minimal motion
keep their meaning."""


def apply(p, full):
    # Two older helpers kept each other awake: every 0.8 s one wrote the fold key's arrow and labels again though they had
    # not changed, which woke the other to mark every caret key again, which woke the first. Each now writes only a change.
    p.rep("""  function paintFold(b, shut) {
    b.textContent = shut ? '\\u2039' : '\\u203a';
    var isFr = false;
    try { isFr = (typeof state !== 'undefined' && state && state.lang === 'fr'); } catch (e) {}
    b.title = shut ? (isFr ? 'Rouvrir la barre' : 'Bring the top bar back')
                   : (isFr ? 'Replier la barre' : 'Fold the top bar away');
    b.setAttribute('aria-label', b.title);
  }""", """  function paintFold(b, shut) {
    var mark = shut ? '\\u2039' : '\\u203a';
    if (b.textContent !== mark) b.textContent = mark;
    var isFr = false;
    try { isFr = (typeof state !== 'undefined' && state && state.lang === 'fr'); } catch (e) {}
    var tip = shut ? (isFr ? 'Rouvrir la barre' : 'Bring the top bar back')
                   : (isFr ? 'Replier la barre' : 'Fold the top bar away');
    if (b.title !== tip) b.title = tip;
    if (b.getAttribute('aria-label') !== tip) b.setAttribute('aria-label', tip);
  }""")
    p.rep("""          bs[i].classList.add('cd-barefold');""",
          """          if (!bs[i].classList.contains('cd-barefold')) bs[i].classList.add('cd-barefold');""")
    p.before_body_end(JS)


JS = r'''<script id="cd-1070-still">
(function () {
  'use strict';
  if (window.__cdStill1070) return; window.__cdStill1070 = 1;
  // the attribute holds a decoration still (ranked as five ids, over the keys' own rules that name them by id);
  // data-cd-lay gives the element (e), its ::before (b) or ::after (a) a layer
  var H = ':is([data-cd-hush],#cd-h#cd-h#cd-h#cd-h#cd-h)';
  var CSS = H + ',' + H + '::before,' + H + '::after{animation-play-state:paused!important}'
    + '[data-cd-hush],[data-cd-hush]::before,[data-cd-hush]::after{animation-play-state:paused!important}'
    + '[data-cd-lay~="e"]{will-change:transform}[data-cd-lay~="b"]::before{will-change:transform}[data-cd-lay~="a"]::after{will-change:transform}';
  var FAST = { transform: 1, opacity: 1, translate: 1, rotate: 1, scale: 1, offset: 1, easing: 1, composite: 1, computedOffset: 1 };

  function sheet(d) {
    if (d.getElementById('cd-1070-still-css')) return;
    var s = d.createElement('style'); s.id = 'cd-1070-still-css'; s.textContent = CSS;
    (d.head || d.documentElement).appendChild(s);
  }
  function endless(d) {
    var out = [], all;
    try { all = d.getAnimations ? d.getAnimations() : []; } catch (e) { return out; }
    for (var i = 0; i < all.length; i++) {
      var a = all[i];
      try { if (a.animationName && a.effect && a.effect.target && a.effect.getTiming().iterations === Infinity) out.push(a); } catch (e) {}
    }
    return out;
  }
  // a frame of a transform or an opacity is drawn by the compositor already; anything else is painted, so give it a layer
  function painted(a) {
    try {
      var ks = a.effect.getKeyframes();
      for (var i = 0; i < ks.length; i++) for (var k in ks[i]) if (!FAST[k]) return true;
    } catch (e) { return true; }
    return false;
  }
  // a layer for the element itself must not change how what it holds is placed or stacked, nor how its words are drawn
  // (on a layer of its own, text loses the screen's finest smoothing; the keys' glow costs little where it is)
  function layerable(t) {
    var w = t.ownerDocument.defaultView, kids = t.getElementsByTagName('*');
    if (kids.length > 80 || (t.textContent || '').trim()) return false;
    var cs = w.getComputedStyle(t);
    var stacks = cs.transform !== 'none' || cs.isolation === 'isolate' || cs.filter !== 'none' || parseFloat(cs.opacity) < 1 ||
      cs.mixBlendMode !== 'normal' || (cs.position !== 'static' && cs.zIndex !== 'auto');
    for (var i = 0; i < kids.length; i++) {
      var c = w.getComputedStyle(kids[i]);
      if (c.position === 'fixed') return false;
      if (!stacks && c.position !== 'static' && c.zIndex !== 'auto') return false;
    }
    return true;
  }
  function layer(a) {
    if (!painted(a)) return;
    var t = a.effect.target, ps = a.effect.pseudoElement || '', k = ps === '::before' ? 'b' : ps === '::after' ? 'a' : 'e';
    var cur = t.getAttribute('data-cd-lay') || '';
    if ((' ' + cur + ' ').indexOf(' ' + k + ' ') >= 0 || (t.__cdLayNo && t.__cdLayNo[k])) return;
    if (k === 'e' && !layerable(t)) { (t.__cdLayNo = t.__cdLayNo || {})[k] = 1; return; }
    t.setAttribute('data-cd-lay', cur ? cur + ' ' + k : k);
  }
  // the part of the page a node belongs to (a child of the body: Home, an app, a room, a window) and how high it paints
  function topOf(n, d) {
    var b = d.body, e = d.documentElement;
    while (n && n.parentNode && n.parentNode !== b && n.parentNode !== e) n = n.parentNode;
    return n;
  }
  // the level the page's outermost stacking around n is drawn at (a room's fixed cover at 70 though its holder is plain)
  function rank(n, d, w) {
    var r = null, b = d.body, e = d.documentElement;
    try {
      for (; n && n !== b && n !== e && n.nodeType === 1; n = n.parentNode) {
        var cs = w.getComputedStyle(n), pos = cs.position;
        if (pos !== 'static' && cs.zIndex !== 'auto') r = parseInt(cs.zIndex, 10) || 0;
        else if (pos === 'fixed' || pos === 'sticky' || parseFloat(cs.opacity) < 1 || cs.transform !== 'none' || cs.filter !== 'none' || cs.isolation === 'isolate') r = 0;
        else if (pos !== 'static' && r === null) r = 0;
      }
    } catch (x) { return 0; }
    return r === null ? -0.5 : r;
  }
  // h is what is on top at a point of t: t is covered only when h belongs to another part of the page painted above t's
  // (a decoration that takes no clicks, a glass layer over the seal's art, is never hit, so the test is by parts)
  function clear(h, t, d, w) {
    if (!h || h === t || t.contains(h) || h.contains(t)) return true;
    var a = topOf(t, d), b = topOf(h, d);
    if (!a || !b || a === b) return true;
    var ra = rank(t, d, w), rb = rank(h, d, w);
    if (rb !== ra) return rb < ra;
    return !!(b.compareDocumentPosition(a) & 4);
  }
  // seen: inside the window and not covered at its middle, or near either end
  function seenIn(t, d, w) {
    var r = t.getBoundingClientRect();
    if (!r.width && !r.height) return false;
    var vw = w.innerWidth || d.documentElement.clientWidth, vh = w.innerHeight || d.documentElement.clientHeight;
    if (r.bottom <= 0 || r.right <= 0 || r.top >= vh || r.left >= vw) return false;
    var y = Math.min(Math.max(r.top + r.height / 2, 0), vh - 1), xs = [0.5, 0.2, 0.8];
    for (var i = 0; i < xs.length; i++) {
      var x = Math.min(Math.max(r.left + r.width * xs[i], 0), vw - 1);
      if (clear(d.elementFromPoint(x, y), t, d, w)) return true;
    }
    return false;
  }
  function listen(w) {
    if (w.__cdStillKeys) return; w.__cdStillKeys = 1;
    w.addEventListener('keydown', function () { w.__cdTypedAt = Date.now(); }, true);
  }
  function sweep(d, w, show, depth) {
    sheet(d);
    var list = endless(d), seen = [], verdict = [];
    for (var i = 0; i < list.length; i++) {
      var a = list[i], t = a.effect.target;
      if (!t.isConnected) continue;
      var j = seen.indexOf(t), vis;
      if (j < 0) { vis = !!show && seenIn(t, d, w); seen.push(t); verdict.push(vis); } else vis = verdict[j];
      if (vis) { layer(a); if (t.hasAttribute('data-cd-hush')) t.removeAttribute('data-cd-hush'); }
      else if (!t.hasAttribute('data-cd-hush')) t.setAttribute('data-cd-hush', '');
    }
    if (depth > 2) return;
    var fs = d.getElementsByTagName('iframe');
    for (var n = 0; n < fs.length; n++) {
      var f = fs[n], fd = null, fw = null;
      try { fd = f.contentDocument; fw = f.contentWindow; } catch (e) {}
      if (!fd || !fw || !fd.documentElement) continue;
      listen(fw);
      var fshow = !!show && seenIn(f, d, w);
      // while someone writes there, look again after the next pause rather than make it lay out again now
      if (fshow && fw.__cdTypedAt && Date.now() - fw.__cdTypedAt < 1200) continue;
      try { sweep(fd, fw, fshow, depth + 1); } catch (e) {}
    }
  }
  var busy = false, soon = 0;
  function tick() {
    if (busy) return; busy = true;
    try {
      var show = document.visibilityState !== 'hidden';
      if (!(show && window.__cdTypedAt && Date.now() - window.__cdTypedAt < 1200)) sweep(document, window, show, 0);
    } catch (e) {}
    busy = false;
  }
  function later(ms) { clearTimeout(soon); soon = setTimeout(tick, ms); }
  listen(window);
  setInterval(tick, 1500);
  document.addEventListener('visibilitychange', function () { later(0); });
  // a panel shut or an app closed: the decorations under it move again at once, not at the next look
  document.addEventListener('pointerup', function () { later(450); }, true);
  document.addEventListener('keyup', function (e) { if (e.key === 'Escape') later(450); }, true);
  window.addEventListener('resize', function () { later(300); });
  window.cdStillSweep = tick;
  later(1200);
})();
</script>
'''
