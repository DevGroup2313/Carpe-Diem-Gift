// 1078 · Home, as the owner approved (31 October 2026).
// 1. The Home and Overview tabs in the Forge's look (Option A): the app's own tab bar, drawn by renderHomeSubtabs as
//    always, is set at the left of the Backup key's row, compact, sized to its words. It shows on Home only; should the
//    row be missing, the bar stays where the app draws it.
// 2. Offline by design as a cream card with its lock key: the notice keeps its own words (the app's, in English or in
//    French, in each edition), only its look changes.
// (The seal behind Home stays all blue: the owner tried it in its colours and asked for the blue back.)
(function () {
  'use strict';
  if (window.__cdHome1078) return;
  window.__cdHome1078 = 1;
  var D = document;

  // ---------- 1. the tabs ----------
  function homeShown() { var s = D.getElementById('section-home'); return !!(s && !s.classList.contains('hidden')); }
  function dock() {
    var bt = D.getElementById('backup-toggle'), row = bt && bt.parentElement;
    if (!row) return null;
    var d = D.getElementById('cd-home-tabdock');
    if (!d) { d = D.createElement('div'); d.id = 'cd-home-tabdock'; }
    if (d.parentNode !== row || row.firstChild !== d) row.insertBefore(d, row.firstChild);
    if (row.style.alignItems !== 'center') row.style.alignItems = 'center';
    return d;
  }
  var moving = false;
  function placeTabs() {
    if (moving) return;
    moving = true;
    try {
      var d = dock();
      if (d) {
        var fresh = D.querySelector('#home-subtabs > .home-subtabs');
        if (fresh) {
          // the app drew its bar afresh: it replaces the one set here before
          [].slice.call(d.children).forEach(function (c) { if (c !== fresh) d.removeChild(c); });
          d.appendChild(fresh);
        }
        d.hidden = !homeShown() || !d.firstChild;
      }
    } catch (e) {} finally { moving = false; }
  }

  // ---------- 2. the notice ----------
  function noteCard() {
    var n = D.getElementById('offline-notice'); if (!n) return;
    if (n.querySelector(':scope > .cdn-card')) return;
    var strong = n.querySelector('strong');
    var kick = strong ? strong.textContent.trim().replace(/[.\s]+$/, '') : '';
    var all = (n.textContent || '').replace(/\s+/g, ' ').trim();
    var say = strong ? all.slice(all.indexOf(strong.textContent.trim()) + strong.textContent.trim().length).trim() : all;
    if (!kick && !say) return;
    var card = D.createElement('div'); card.className = 'cdn-card';
    var badge = D.createElement('span'); badge.className = 'cdn-badge'; badge.setAttribute('aria-hidden', 'true'); badge.textContent = '🔒';
    var t = D.createElement('div'); t.className = 'cdn-t';
    if (kick) { var k = D.createElement('p'); k.className = 'cdn-kick'; k.textContent = kick; t.appendChild(k); }
    var p = D.createElement('p'); p.className = 'cdn-say'; p.textContent = say; t.appendChild(p);
    card.appendChild(badge); card.appendChild(t);
    n.setAttribute('data-cdn', '1');
    n.textContent = '';
    n.appendChild(card);
  }

  // ---------- watching: each part follows the app's own redrawing ----------
  function boot() {
    var hs = D.getElementById('home-subtabs'), home = D.getElementById('section-home'), note = D.getElementById('offline-notice');
    if (!hs || !home) { setTimeout(boot, 400); return; }
    try { new MutationObserver(placeTabs).observe(hs, { childList: true }); } catch (e) {}
    try { new MutationObserver(placeTabs).observe(home, { attributes: true, attributeFilter: ['class'] }); } catch (e) {}
    if (note) try { new MutationObserver(function () { noteCard(); }).observe(note, { childList: true, characterData: true, subtree: true }); } catch (e) {}
    placeTabs(); noteCard();
    // the Backup key's row is drawn by the app after this script: settle once it is there
    var n = 0, t = setInterval(function () { n++; placeTabs(); noteCard(); if (n > 20) clearInterval(t); }, 300);
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot); else boot();
  window.__cdHome78 = { tabs: placeTabs, note: noteCard };
})();
