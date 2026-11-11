/* Carpe Diem 1087: the Writing Rooms, each with a face of its own. Proposal, Curriculum, Research Writing and the
   French Tutor open in the shared frame (workspaceShell, dressed by pass 411's rail); this layer gives each room its
   medallion, its colour, its Latin line and raised cards in the house style, and gives their pages the same. What
   each page does is not touched: only how it is drawn. */
(function () {
  'use strict';
  if (window.__cdWr1087) return;
  var shell = window.workspaceShell;
  if (typeof shell !== 'function') return;
  window.__cdWr1087 = 1;

  var ROOM = null, MAIN = false;
  var ROOMS = {
    proposal: { latin: 'PROPOSITVM', en: 'The Proposal', fr: 'Le projet' },
    curriculum: { latin: 'CVRRICVLVM', en: 'The Curriculum', fr: 'Le cursus' },
    research: { latin: 'ARS SCRIBENDI', en: 'Research Writing', fr: 'L’écriture de recherche' },
    french: { latin: 'LINGVA GALLICA', en: 'The French Tutor', fr: 'Le tuteur de français' }
  };
  /* the emblems: line drawings on a raised medallion */
  var EMB = {
    proposal: '<path d="M44 9c-9 3-17 11-21 22-2 6-3 12-3 17" /><path d="M44 9c1 8-2 17-9 24-4 4-9 7-14 8" /><path d="M23 31c5 0 10-2 14-5" /><path d="M29 22c4 0 8-1 11-3" /><path d="M20 48l-3 7" /><path d="M14 55h14" /><path d="M16 55c0-3 2-5 5-5h2c3 0 5 2 5 5" />',
    curriculum: '<path d="M32 22c-5-4-12-5-18-3v24c6-2 13-1 18 3 5-4 12-5 18-3V19c-6-2-13-1-18 3z" /><path d="M32 22v24" /><path d="M10 50c-4-6-5-14-2-21" /><path d="M8 37l-3-2M9 43l-3-1M8 31l-2-3" /><path d="M54 50c4-6 5-14 2-21" /><path d="M56 37l3-2M55 43l3-1M56 31l2-3" /><path d="M22 56c3-2 7-3 10-3s7 1 10 3" />',
    research: '<circle cx="32" cy="32" r="20" /><circle cx="32" cy="32" r="3" /><path d="M32 12l4 16 16 4-16 4-4 16-4-16-16-4 16-4z" /><path d="M32 6v4M32 54v4M6 32h4M54 32h4" /><path d="M29.5 8.5l2.5-3 2.5 3" />',
    french: '<path d="M32 10c-6 6-6 14 0 22 6-8 6-16 0-22z" /><path d="M30 34c-6-10-16-10-18-2-2 6 4 10 9 7" /><path d="M34 34c6-10 16-10 18-2 2 6-4 10-9 7" /><path d="M22 38h20" /><path d="M32 38v12" /><path d="M26 50c2 3 4 4 6 4s4-1 6-4" /><path d="M24 44h16" />'
  };
  function svg(room, cls) { return '<svg class="' + cls + '" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (EMB[room] || EMB.proposal) + '</svg>'; }
  function fr() { try { return state.lang === 'fr'; } catch (e) { return false; } }

  /* which room a page belongs to: the room's own opener says so, and its pages keep it */
  function mark(name, room, main) {
    var f = window[name]; if (typeof f !== 'function' || f.__cdWr) return;
    var g = function () { ROOM = typeof room === 'function' ? room.apply(this, arguments) : room; MAIN = !!main; return f.apply(this, arguments); };
    g.__cdWr = 1; window[name] = g;
  }
  mark('openStudioPage', function (k) { return k === 'proposal' ? 'proposal' : 'curriculum'; }, true);
  mark('openResearchRoom', 'research', true);
  mark('openFrench', 'french', true);
  mark('renderFrench', 'french', true);
  ['openProposalWorkspace', 'renderProposalWorkspace', 'openProposalWorkshop'].forEach(function (n) { mark(n, 'proposal', false); });
  mark('openResearchLesson', 'research', false);
  ['openSeminarsPage', 'openQuizzesPage', 'openDrills'].forEach(function (n) { var f = window[n]; if (typeof f !== 'function' || f.__cdWr) return; var g = function () { MAIN = false; if (!ROOM) ROOM = 'curriculum'; return f.apply(this, arguments); }; g.__cdWr = 1; window[n] = g; });
  var close0 = window.closeModal;
  if (typeof close0 === 'function' && !close0.__cdWr) { var c = function () { ROOM = null; MAIN = false; return close0.apply(this, arguments); }; c.__cdWr = 1; window.closeModal = c; }

  /* a badge for each door, by its place among the room's doors (the same in both languages); inside a room, numerals */
  var BADGES = {
    proposal: ['\u270d\ufe0f', '\u2696\ufe0f', '\ud83e\udded', '\u2753', '\ud83c\udfaf', '\ud83c\udfdb\ufe0f'],
    curriculum: ['\ud83d\udcac', '\u2753', '\ud83c\udfaf'],
    research: ['\ud83c\udf09', '\ud83d\uddfa\ufe0f', '\ud83d\udd2d', '\u2754', '\ud83e\uddea']
  };
  var ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
  var EMOJI_START = /^[\u2600-\u27bf\ud83c-\udbff]/;

  function dress() {
    var root = document.getElementById('modal-root'); if (!root) return;
    var overlay = root.firstElementChild; if (!overlay) return;
    var frame = overlay.querySelector(':scope > div'); if (!frame) return;
    var room = ROOM && ROOMS[ROOM] ? ROOM : 'plain';
    overlay.classList.add('cd-wr', 'cd-wr-' + room); if (MAIN) overlay.classList.add('cd-wr-main'); else overlay.classList.add('cd-wr-subpage');
    if (!overlay.querySelector(':scope > .cd-wr-mark')) { var mk = document.createElement('div'); mk.className = 'cd-wr-mark'; mk.setAttribute('aria-hidden', 'true'); mk.innerHTML = svg(room === 'plain' ? 'proposal' : room, 'cd-wr-markart'); overlay.insertBefore(mk, overlay.firstChild); }
    var head = frame.querySelector('.cd-ws-head') || frame.children[0];
    if (head && !head.querySelector('.cd-wr-medal')) {
      head.classList.add('cd-wr-head');
      var kk = head.querySelector('.cd-ws-kicker'); if (kk) kk.textContent = fr() ? 'LES SALLES D\u2019\u00c9CRITURE' : 'THE WRITING ROOMS';
      var idb = head.children[1] || head;
      var medal = document.createElement('div'); medal.className = 'cd-wr-medal'; medal.innerHTML = '<span class="cd-wr-shine"></span>' + svg(room === 'plain' ? 'proposal' : room, 'cd-wr-emb');
      head.insertBefore(medal, idb);
      var R = ROOMS[room];
      if (R) {
        var lat = document.createElement('div'); lat.className = 'cd-wr-latin'; lat.innerHTML = '<span></span><b>' + R.latin + '</b><span></span>';
        var title = idb.querySelector(':scope > div:not(.cd-ws-kicker)');
        if (title && title.nextSibling) idb.insertBefore(lat, title.nextSibling); else idb.appendChild(lat);
      }
    }
    /* the doors of a room: raised, each with its badge, in the room's colour */
    var cards = room === 'french' ? [] : [].slice.call(frame.querySelectorAll('.cd-ws-grid > button'));
    var n = 0;
    cards.forEach(function (card, i) {
      if (card.classList.contains('cd-wr-card')) return;
      card.classList.add('cd-wr-card'); card.style.setProperty('--wr-i', String(i));
      var t = ((card.children[0] && card.children[0].textContent) || card.textContent || '').trim();
      var face = null;
      if (EMOJI_START.test(t)) face = null;
      else if (MAIN && BADGES[room]) face = BADGES[room][n] || null;
      else face = ROMAN[n] || String(n + 1);
      if (face !== null || !EMOJI_START.test(t)) n++;
      if (face) { var b = document.createElement('span'); b.className = 'cd-wr-badge' + (/^[IVX0-9]+$/.test(face) ? ' cd-wr-num' : ''); b.setAttribute('aria-hidden', 'true'); b.textContent = face; card.insertBefore(b, card.firstChild); }
      else card.classList.add('cd-wr-nobadge');
      var go = document.createElement('span'); go.className = 'cd-wr-go'; go.setAttribute('aria-hidden', 'true'); go.textContent = '›';
      card.appendChild(go);
    });
    if (room === 'french') dressFrench(frame);
  }

  /* the French Tutor: its modes, its sets, its score and its question, in the same hand */
  function dressFrench(frame) {
    var body = frame.querySelector('.cd-ws-grid') || frame.children[frame.children.length - 1]; if (!body) return;
    body.classList.add('cd-wr-fr');
    var kids = [].slice.call(body.children);
    kids.forEach(function (k) {
      var bs = k.tagName === 'DIV' ? [].slice.call(k.children).filter(function (x) { return x.tagName === 'BUTTON'; }) : [];
      if (bs.length && bs.length === k.children.length) {
        var pills = (k.getAttribute('style') || '').indexOf('wrap') >= 0;
        k.classList.add(pills ? 'cd-wr-chips' : 'cd-wr-seg');
        bs.forEach(function (b) { var st = b.getAttribute('style') || ''; if (st.indexOf('gilt') >= 0) b.classList.add('is-on'); });
        return;
      }
      var st = k.getAttribute('style') || '';
      if (/font-size:\s*11px/.test(st)) { k.classList.add('cd-wr-stat'); return; }
      if (st.indexOf('cream-card-lo') >= 0) { k.classList.add('cd-wr-intro'); return; }
      if (st.indexOf('cream-card') >= 0) {
        k.classList.add('cd-wr-q');
        var n = 0;
        [].slice.call(k.querySelectorAll(':scope > button')).forEach(function (o) {
          var s2 = (o.getAttribute('style') || '').toLowerCase();
          if (s2.indexOf('display: block') < 0 && s2.indexOf('display:block') < 0) { o.classList.add('cd-wr-act'); return; }
          o.classList.add('cd-wr-opt'); o.setAttribute('data-l', 'ABCDEFG'.charAt(n++));
          if (s2.indexOf('#5b8c5a') >= 0 || s2.indexOf('rgb(91, 140, 90)') >= 0) o.classList.add('is-right');
          else if (s2.indexOf('#b3564b') >= 0 || s2.indexOf('rgb(179, 86, 75)') >= 0) o.classList.add('is-wrong');
        });
        [].slice.call(k.querySelectorAll(':scope > button:not(.cd-wr-opt)')).forEach(function (o) { o.classList.add('cd-wr-act'); });
        var inp = k.querySelector('input'); if (inp) inp.classList.add('cd-wr-input');
      }
    });
  }

  window.workspaceShell = function () {
    var r = shell.apply(this, arguments);
    try { dress(); } catch (e) {}
    return r;
  };
})();
