// 1077 · Home on a low-energy day.
// A low day (the Focus page's switch, or Low on an Overview's energy card) hides everything on Home but its top: the
// day's next step stays. On a day with no next step (a weekend, a day with no plan) Home was left empty, and the card
// that said what had happened and gave "Show everything again" lived on the old Overview only. Home now always carries
// the low day's own card at its top on such a day: what is showing and why, "Make today a Gentle Day" and "Show
// everything again". The card is the Focus page's own (the support core's), drawn through its mount, so the two never
// disagree; on any other day the place is empty and hidden.
(function () {
  'use strict';
  if (window.__cdHome1077) return;
  window.__cdHome1077 = 1;
  var W = window;

  function SC() { var s = W.__cdSC; return s && typeof s.mount === 'function' ? s : null; }
  function host() {
    var top = document.getElementById('home-top'); if (!top) return null;
    var h = document.getElementById('cd-low-home');
    if (!h) { h = document.createElement('div'); h.id = 'cd-low-home'; h.hidden = true; }
    if (h.parentNode !== top || top.firstChild !== h) top.insertBefore(h, top.firstChild);
    return h;
  }
  var busy = false;
  function place() {
    if (busy) return;
    busy = true;
    try {
      var h = host(), s = SC();
      if (h && s) s.mount({ low: h });
    } catch (e) {} finally { busy = false; }
  }
  // Home's top is drawn afresh each time Home is: the place comes back each time, whatever drew it
  function watch() {
    var top = document.getElementById('home-top'); if (!top || top.__cdLowWatch) return !!top;
    top.__cdLowWatch = 1;
    try {
      new MutationObserver(function () {
        var h = document.getElementById('cd-low-home');
        if (!h || h.parentNode !== top || top.firstChild !== h) place();
      }).observe(top, { childList: true });
    } catch (e) {}
    place();
    return true;
  }
  // the low day has two marks on the page: the support core's (set the moment it is chosen) and the one that hides
  // Home's content (set by the older supports' round, every second and a half). Until they agreed, Home could stand
  // empty for a moment after "Show everything again", or show nothing but hidden content: each now follows the other
  // at once, and the card is drawn again with them.
  function follow() {
    try {
      new MutationObserver(function () {
        var b = document.body;
        if (b.hasAttribute('data-sc-low') !== b.hasAttribute('data-cd-low')) {
          try { if (W.cdSupport && typeof W.cdSupport.tick === 'function') W.cdSupport.tick(); } catch (e) {}
        }
        place();
      }).observe(document.body, { attributes: true, attributeFilter: ['data-sc-low', 'data-cd-low'] });
    } catch (e) {}
  }
  function boot() {
    if (!watch()) { setTimeout(boot, 400); return; }
    follow();
    // the support core may come after this script: draw again once it is there
    var n = 0, t = setInterval(function () { n++; if (SC() || n > 40) { clearInterval(t); place(); } }, 250);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  W.__cdLowHome = { place: place };
})();
