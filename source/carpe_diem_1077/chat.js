(function () {
  'use strict';
  // 1077 · the Librarian's and Magister's conversations in the look the owner approved (31 October 2026: "I love the
  // chats new look for Magister and the Librarian, push it everywhere"): Ingenium's chat, its three looks (Carpe Diem,
  // Soft, Clean, chosen from the ⋯ menu), in Carpe Diem's colours, raised keys, messages that lift under the pointer.
  // Everything the two pages did, they still do, through the app's own functions: the moods and prompts, free questions,
  // the books opened, copy, begin again, the end of a session and keeping it. Should anything fail, the app draws its own.
  if (window.__cdc1077) return;
  window.__cdc1077 = 1;
  var W = window, D = document;

  function fr() { try { return state.lang === 'fr'; } catch (e) { return false; } }
  function T(en, f) { return fr() ? f : en; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function TK(k, en) { try { return typeof tr === 'function' ? tr(k, en) : en; } catch (e) { return en; } }
  function TD(s) { try { return typeof trd === 'function' ? trd(s) : s; } catch (e) { return s; } }
  function save() { try { saveState(); } catch (e) {} }
  function warn(what, e) { try { console.warn(what, e); } catch (x) {} }

  var O = { lib: W.renderLibrarian, mag: W.renderMagisterChatView };
  var seen = { lib: 0, mag: 0 }, draft = { lib: '', mag: '' }, scroll = { lib: null, mag: null }, kept = { lib: {}, mag: {} };
  var menu = null, lastEnded = false;
  function look() { var v = (state && state.cdChatLook) || 'classic'; return v === 'soft' || v === 'clean' ? v : 'classic'; }
  function key(label, attrs, cls, title) { return '<button type="button" class="cdc-key ' + (cls || '') + '"' + (title ? ' title="' + esc(title) + '" aria-label="' + esc(title) + '"' : '') + ' ' + (attrs || '') + '>' + label + '</button>'; }
  var SPINES = ['#5b2c2c', '#2c4a5b', '#3d5a3a', '#6b4a2a', '#2f5d5a', '#3f4a5a', '#7a5a22', '#4e3b2a'];
  function spine(t) { var h = 0; String(t || '').split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) >>> 0; }); return SPINES[h % SPINES.length]; }
  var canSpeak = (function () { try { return 'speechSynthesis' in W && typeof SpeechSynthesisUtterance !== 'undefined'; } catch (e) { return false; } })();

  // ---------- the pieces both pages share ----------
  function menuHtml(kind) {
    var L = look();
    return '<div class="cdc-menu" role="menu"><p>' + T('The look', 'L’apparence') + '</p><div class="cdc-row">'
      + [['classic', 'Carpe Diem'], ['soft', T('Soft', 'Douce')], ['clean', T('Clean', 'Épurée')]].map(function (x) { return key(x[1], 'data-look="' + x[0] + '" aria-pressed="' + (L === x[0]) + '" role="menuitemradio"', 'sm'); }).join('')
      + '</div><p>' + T('This conversation', 'Cette conversation') + '</p>'
      + key('☆ ' + T('Keep it in my notes', 'La garder dans mes notes'), 'data-a="keepall" role="menuitem"', 'wide sm') + '</div>';
  }
  function botActs(kind, i) {
    return '<div class="cdc-acts">' + (canSpeak ? key('🔊', 'data-a="speak" data-i="' + i + '"', 'mini', T('Read aloud', 'Lire à voix haute')) : '')
      + key('⧉', 'data-a="copy" data-i="' + i + '"', 'mini', T('Copy', 'Copier'))
      + key(kept[kind][i] ? '★' : '☆', 'data-a="keep" data-i="' + i + '" aria-pressed="' + !!kept[kind][i] + '"', 'mini', kept[kind][i] ? T('Kept in your notes', 'Gardée dans vos notes') : T('Keep in my notes', 'Garder dans mes notes')) + '</div>';
  }
  function meActs(i) {
    return '<div class="cdc-acts">' + key('✎', 'data-a="edit" data-i="' + i + '"', 'mini', T('Edit', 'Modifier')) + key('⧉', 'data-a="copy" data-i="' + i + '"', 'mini', T('Copy', 'Copier'))
      + key('↵', 'data-a="again" data-i="' + i + '"', 'mini', T('Ask again', 'Redemander')) + '</div>';
  }
  function frame(kind, top, feed, bottom) {
    return '<div class="cdc-frame"><div class="cdc-chat"><div class="cdc-top">' + top + (menu === kind ? menuHtml(kind) : '') + '</div>'
      + '<div class="cdc-feed" aria-live="polite">' + feed + '</div>' + bottom + '</div></div>';
  }
  function composer(kind, id, ph) {
    return '<div class="cdc-composer"><textarea ' + (id ? 'id="' + id + '" ' : '') + 'data-in="' + kind + '" rows="1" placeholder="' + esc(ph) + '" aria-label="' + esc(ph) + '"></textarea>'
      + key('↑', 'data-a="send"', 'main cdc-send', T('Send', 'Envoyer')) + '</div>';
  }
  function mount(kind, html, label, n) {
    var root = D.getElementById('modal-root'); if (!root) return null;
    var prevFeed = root.querySelector('.cdc-feed'); if (prevFeed && root.querySelector('.cdc.' + (kind === 'lib' ? 'lib' : 'mag'))) scroll[kind] = prevFeed.scrollTop;
    root.innerHTML = '';
    var ov = D.createElement('div');
    ov.className = 'cdc ' + kind + (look() === 'classic' ? '' : ' ' + look());
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', label);
    ov.innerHTML = html;
    root.appendChild(ov);
    var fresh = n > seen[kind], feed = ov.querySelector('.cdc-feed'), ta = ov.querySelector('textarea');
    if (ta) { ta.value = draft[kind] || ''; fit(ta); sendState(ov); }
    setTimeout(function () {
      try { if (fresh || scroll[kind] == null) feed.scrollTop = feed.scrollHeight; else feed.scrollTop = scroll[kind]; } catch (e) {}
      try { if (ta && !menu) ta.focus({ preventScroll: true }); } catch (e) {}
      try { ov.scrollTop = 0; } catch (e) {}
    }, 30);
    seen[kind] = n;
    wire(ov, kind);
    return ov;
  }
  function fit(ta) { try { ta.style.height = 'auto'; ta.style.height = Math.min(180, Math.max(44, ta.scrollHeight)) + 'px'; } catch (e) {} }
  function sendState(ov) { var ta = ov.querySelector('textarea'), s = ov.querySelector('[data-a="send"]'); if (ta && s) s.disabled = !ta.value.trim(); }
  function copyOut(text, btn) {
    try { if (typeof copyText === 'function') { copyText(text, btn); return; } } catch (e) {}
    try { navigator.clipboard.writeText(text); } catch (e) {}
    try { var was = btn.textContent; btn.textContent = '✓'; setTimeout(function () { btn.textContent = was; }, 1200); } catch (e) {}
  }
  function speak(text, btn) {
    try {
      var ss = W.speechSynthesis;
      if (ss.speaking) { ss.cancel(); if (btn.getAttribute('aria-pressed') === 'true') { btn.setAttribute('aria-pressed', 'false'); return; } }
      var u = new SpeechSynthesisUtterance(text); u.lang = fr() ? 'fr-FR' : 'en-GB';
      u.onend = u.onerror = function () { try { btn.setAttribute('aria-pressed', 'false'); } catch (e) {} };
      btn.setAttribute('aria-pressed', 'true'); ss.speak(u);
    } catch (e) {}
  }
  function keepNote(title, text) {
    try { state.notebookEntries = state.notebookEntries || []; state.notebookEntries.unshift({ id: 'conv-' + Date.now(), mode: 'open', ts: Date.now(), title: title, text: text }); save(); return true; } catch (e) { return false; }
  }

  // ---------- the Librarian ----------
  function libName() { return TK('lb.name', fr() ? 'Le Bibliothécaire' : 'The Librarian'); }
  function libMsgs() { try { return (librarianState && librarianState.messages) || []; } catch (e) { return []; } }
  function bookHtml(b, i, j) {
    var m = null, author = '';
    try { m = libBookMeta(b); } catch (e) {}
    try { author = authorFor(b) || ''; } catch (e) {}
    var title = (fr() && typeof FR_BOOK_TITLES !== 'undefined' && FR_BOOK_TITLES[b.title]) ? FR_BOOK_TITLES[b.title] : b.title;
    if (author && fr() && typeof FR_BYLINE !== 'undefined' && FR_BYLINE[author]) author = FR_BYLINE[author];
    var why = (m && m.why) ? ((fr() && m.fr && m.fr.why) ? m.fr.why : m.why) : TK('lib.recDefault', 'A book worth your time.');
    return '<div class="cdc-book"><span class="cdc-spine" style="background:' + spine(b.title) + '" aria-hidden="true"></span><div><b>' + esc(title) + '</b>' + (author ? '<i>' + esc(author) + '</i>' : '')
      + '<p>' + esc(why) + '</p>' + key(esc(TK('lib.openBook', 'Open the book')), 'data-a="open" data-i="' + i + '" data-j="' + j + '"', 'main sm') + '</div></div>';
  }
  function renderLib() {
    var FR = fr(), name = libName(), msgs = libMsgs();
    var top = key(esc(TK('lib.backLibrary', '‹ The Library')), 'data-a="back"')
      + '<div class="cdc-who"><b>' + esc(name) + '</b><span>' + esc(TK('lb.guide', FR ? 'Un guide vers vos propres rayons. Demandez, ou choisissez une humeur.' : 'A guide to the shelves you own. Ask, or pick a mood.')) + '</span></div>'
      + key('⧉', 'data-a="copyall"', 'sq', TK('mc.copyConv', 'Copy this conversation')) + key('↺', 'data-a="restart"', 'sq', TK('mc.restart', 'Restart conversation'))
      + key('⋯', 'data-a="menu" aria-haspopup="menu" aria-expanded="' + (menu === 'lib') + '"', 'sq', T('The look, and keeping this conversation', 'L’apparence, et garder cette conversation'));
    var feed = msgs.map(function (m, i) {
      var nw = i >= seen.lib ? ' new' : '';
      if (m.role === 'user') return '<div class="cdc-msg me' + nw + '"><p class="cdc-text">' + esc(m.text) + '</p>' + meActs(i) + '</div>';
      return '<div class="cdc-msg bot' + nw + '"><p class="cdc-name">' + esc(name) + '</p><p class="cdc-text">' + esc(m.text) + '</p>'
        + (m.empty ? '<p class="cdc-hint">' + esc(TK('lb.tryAnother', 'Try another mood, or add to your pleasure shelf.')) + '</p>' : '')
        + (m.recs && m.recs.length ? '<div class="cdc-books">' + m.recs.map(function (b, j) { return bookHtml(b, i, j); }).join('') + '</div>' : '')
        + botActs('lib', i) + '</div>';
    }).join('');
    var chips = '';
    try {
      chips = ['next', 'think', 'challenge', 'french', 'enjoy', 'surprise'].map(function (id) { var it = LIBRARIAN_INTENTS.filter(function (x) { return x.id === id; })[0]; return it ? key(esc(TD(it.label)), 'data-intent="' + id + '"', 'chip') : ''; }).join('');
    } catch (e) {}
    var bottom = '<div class="cdc-chips">' + chips + '</div>' + composer('lib', 'librarian-input', TK('lb.askPlaceholder', 'Ask the librarian…'))
      + '<p class="cdc-foot">' + T('The Librarian recommends only from your own shelves; nothing leaves this device.', 'Le Bibliothécaire ne recommande que dans vos propres rayons ; rien ne quitte cet appareil.') + '</p>';
    var ov = mount('lib', frame('lib', top, feed, bottom), name, msgs.length);
    if (!ov) throw new Error('no modal root');
  }

  // ---------- Magister ----------
  function tutor() { try { return state.tutorName || DEFAULT_TUTOR_NAME; } catch (e) { return 'Magister'; } }
  function magMsgs() { try { return (magisterConvo && magisterConvo.history) || []; } catch (e) { return []; } }
  function renderMag(ended) {
    lastEnded = !!ended;
    var FR = fr(), name = tutor(), msgs = magMsgs(), dt = null;
    try { dt = typeof dayTotals === 'function' ? dayTotals(state.selectedDateStr) : null; } catch (e) {}
    var sub = String(TK('mc.subGuided', 'A guided talk, not a live tutor.')).replace(/\.\s*$/, '') + (dt ? ' · ' + T(dt.done + ' of ' + dt.total + ' tasks done today', dt.done + ' sur ' + dt.total + ' tâches faites aujourd’hui') : '');
    var top = key(T('‹ Agenda', '‹ La journée'), 'data-a="back"')
      + '<div class="cdc-who"><b>' + esc(name) + '</b><span>' + esc(sub) + '</span></div>' + (ended ? '' : '<span class="cdc-dot" title="' + T('In session', 'En séance') + '"></span>')
      + key('⧉', 'data-a="copyall"', 'sq', TK('mc.copyConv', 'Copy this conversation')) + key('↺', 'data-a="restart"', 'sq', TK('mc.restart', 'Restart conversation'))
      + (ended ? '' : key(esc(TK('mc.endSession', 'End session')), 'data-a="end"', 'end-txt'))
      + key('⋯', 'data-a="menu" aria-haspopup="menu" aria-expanded="' + (menu === 'mag') + '"', 'sq', T('The look, and keeping this conversation', 'L’apparence, et garder cette conversation'));
    var feed = msgs.length ? msgs.map(function (m, i) {
      var nw = i >= seen.mag ? ' new' : '';
      if (m.role === 'user') return '<div class="cdc-msg me' + nw + '"><p class="cdc-text">' + esc(m.text) + '</p>' + meActs(i) + '</div>';
      return '<div class="cdc-msg bot' + nw + '"><p class="cdc-name">' + esc(name) + '</p><p class="cdc-text">' + esc(m.text) + '</p>' + botActs('mag', i) + '</div>';
    }).join('') : '<p class="cdc-empty">' + esc(name) + (FR ? ' prépare l’ouverture de la séance.' : ' is preparing to open the session.') + '</p>';
    var bottom;
    if (ended) {
      bottom = '<div class="cdc-end"><p>' + esc(TK('mc.pausePrompt', 'That is a good place to pause. Keep this conversation?')) + '</p><div class="cdc-row">'
        + key(esc(TK('mc.saveNb', 'Keep this conversation')), 'data-a="savend"', 'main') + key(esc(TK('mc.newConv', 'New conversation')), 'data-a="restart"') + key(esc(TK('ws.closeNoSave', 'Close without saving')), 'data-a="closeend"') + '</div></div>';
    } else {
      var chips = '';
      try { chips = MAGISTER_CHIPS.map(function (c) { return key((c.emoji ? c.emoji + ' ' : '') + esc(TK('mc.chip.' + c.id, c.label)), 'data-chip="' + c.id + '"', 'chip'); }).join(''); } catch (e) {}
      try { if ((parseDate(state.selectedDateStr) || new Date()).getDay() === 5) chips += key('📅 ' + esc(TK('mc.chip.synthesis', 'Weekly synthesis')), 'data-chip="synthesis"', 'chip'); } catch (e) {}
      var asc = ''; try { asc = schedT('Ascensus is your training hall: daily labours, a diagnostic, and the courses. It is a tap away below.', 'Ascensus est votre salle d’entraînement : des labeurs quotidiens, un diagnostic et les cours. Elle est à portée de clic ci-dessous.'); } catch (e) {}
      bottom = (asc ? '<p class="cdc-note">' + esc(asc) + '</p>' : '') + '<div class="cdc-chips">' + chips + '</div>'
        + composer('mag', null, TK('mc.replyPlaceholder', 'Type your reply… (Enter to send, Shift+Enter for new line)'))
        + '<p class="cdc-foot">' + T('Magister’s replies are written, not generated; nothing leaves this device.', 'Les réponses de Magister sont écrites, non générées ; rien ne quitte cet appareil.') + '</p>';
    }
    var ov = mount('mag', frame('mag', top, feed, bottom), name, msgs.length);
    if (!ov) throw new Error('no modal root');
  }

  // ---------- one set of hands for both ----------
  function textOf(kind, i) {
    var m = (kind === 'lib' ? libMsgs() : magMsgs())[i]; if (!m) return '';
    var t = m.text || '';
    if (m.recs && m.recs.length) t += '\n\n' + m.recs.map(function (b) { var a = ''; try { a = authorFor(b) || ''; } catch (e) {} return '• ' + b.title + (a ? ' (' + a + ')' : ''); }).join('\n');
    return t;
  }
  function allText(kind) {
    var name = kind === 'lib' ? libName() : tutor(), me = T('Me', 'Moi');
    return (kind === 'lib' ? libMsgs() : magMsgs()).map(function (m, i) { return ((m.role === 'user') ? me : name) + ': ' + textOf(kind, i); }).join('\n\n');
  }
  function again(kind) { if (kind === 'lib') renderLib(); else renderMag(lastEnded); }
  function send(kind, ov) {
    var ta = ov.querySelector('textarea'); if (!ta) return;
    var v = ta.value.trim(); if (!v) return;
    draft[kind] = '';
    if (kind === 'lib') { try { librarianSendFree(); } catch (e) { warn('Librarian', e); } }
    else { try { magisterSendFree(v); } catch (e) { warn('Magister', e); } }
  }
  function wire(ov, kind) {
    ov.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-a],[data-chip],[data-intent],[data-look]') : null;
      var inMenu = e.target.closest && e.target.closest('.cdc-menu');
      if (menu && !inMenu && !(t && t.getAttribute('data-a') === 'menu')) { menu = null; if (!t) { again(kind); return; } }
      if (!t) return;
      var a = t.getAttribute('data-a'), i = +t.getAttribute('data-i');
      if (t.hasAttribute('data-look')) { try { state.cdChatLook = t.getAttribute('data-look'); save(); } catch (x) {} menu = null; again(kind); return; }
      if (t.hasAttribute('data-intent')) { var id = t.getAttribute('data-intent'), it = null; try { it = LIBRARIAN_INTENTS.filter(function (x) { return x.id === id; })[0]; } catch (x) {} if (it) { try { librarianAct(it.id, it.label); } catch (x) { warn('Librarian', x); } } return; }
      if (t.hasAttribute('data-chip')) { try { magisterSendChip(t.getAttribute('data-chip')); } catch (x) { warn('Magister', x); } return; }
      switch (a) {
        case 'menu': menu = menu === kind ? null : kind; again(kind); return;
        case 'back': if (kind === 'lib') { try { closeModal(); } catch (x) {} } else { try { closeMagisterChat(); } catch (x) {} } return;
        case 'restart': draft[kind] = ''; seen[kind] = 0; kept[kind] = {}; if (kind === 'lib') { try { openLibrarian(); } catch (x) {} } else { try { openMagisterChat(); } catch (x) {} } return;
        case 'end': try { closeMagisterChat(); } catch (x) {} return;
        case 'copyall': copyOut(allText(kind), t); return;
        case 'keepall': if (keepNote((kind === 'lib' ? T('Conversation with the Librarian', 'Conversation avec le Bibliothécaire') : TK('mc.convWith', 'Conversation with ') + tutor()), allText(kind))) { menu = null; again(kind); } return;
        case 'send': send(kind, ov); return;
        case 'copy': copyOut(textOf(kind, i), t); return;
        case 'speak': speak(textOf(kind, i), t); return;
        case 'keep': if (!kept[kind][i] && keepNote((kind === 'lib' ? libName() : tutor()) + T(' · a reply kept', ' · une réponse gardée'), textOf(kind, i))) { kept[kind][i] = 1; t.textContent = '★'; t.setAttribute('aria-pressed', 'true'); t.title = T('Kept in your notes', 'Gardée dans vos notes'); } return;
        case 'edit': case 'again': {
          var m = (kind === 'lib' ? libMsgs() : magMsgs())[i], ta = ov.querySelector('textarea'); if (!m || !ta) return;
          ta.value = m.text || ''; draft[kind] = ta.value; fit(ta); sendState(ov);
          if (a === 'again') send(kind, ov); else { try { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } catch (x) {} }
          return;
        }
        case 'open': {
          var mm = libMsgs()[i], b = mm && mm.recs && mm.recs[+t.getAttribute('data-j')]; if (!b) return;
          try { closeModal(); showSection('books'); openBookDetail(b); } catch (x) { warn('Librarian', x); }
          return;
        }
        case 'savend': {
          try { keepNote(TK('mc.convWith', 'Conversation with ') + tutor(), magMsgs().map(function (m) { return (m.role === 'magister' ? (tutor() + ': ') : 'Me: ') + m.text; }).join('\n\n')); state.magisterChatOpen = false; save(); closeModal(); renderAll(); } catch (x) { warn('Magister', x); }
          return;
        }
        case 'closeend': try { state.magisterChatOpen = false; save(); closeModal(); renderAll(); } catch (x) {} return;
      }
    });
    ov.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu) { menu = null; again(kind); return; }
      if (e.target.matches && e.target.matches('textarea[data-in]') && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(kind, ov); }
    });
    ov.addEventListener('input', function (e) { if (e.target.matches && e.target.matches('textarea[data-in]')) { draft[kind] = e.target.value; fit(e.target); sendState(ov); } });
  }

  W.renderLibrarian = function () {
    try { return renderLib(); } catch (e) { warn('Librarian page', e); return O.lib.apply(this, arguments); }
  };
  W.renderMagisterChatView = function (ended) {
    try { return renderMag(ended); } catch (e) { warn('Magister page', e); return O.mag.apply(this, arguments); }
  };
  W.cdxChat = { look: look, setLook: function (v) { try { state.cdChatLook = v; save(); } catch (e) {} } };
})();
