// 1078 · Assessments in the design the owner approved (31 October 2026).
// The Overview: How marks work folded at the top; the overall ring with each term's bar; the proposal's standing (each
// edition's own words); Quizzes, Seminars and Records as cards whose keys are sized to their words; the way to Ascensus.
// Marks: the overall ring, each term and the proposal as a row with its bar, count, mark and band, the refreshers.
// Records: a card for each term, the app's own modules inside. Records and Marks are calm, as the owner asked ("the many
// 3D line for the terms, they are triggering my sensory issues"): no raised edges, plain rows with faint dividers. Quizzes and Seminars open their rooms as before. The
// tabs are the Forge's. Every word the app already says is taken from the app's own drawing of the page (so each
// edition and each language keeps its own), and every action is the app's own; should anything fail, the app draws its
// own page.
(function () {
  'use strict';
  if (window.__cdAssess1078) return;
  window.__cdAssess1078 = 1;
  var W = window, D = document;
  var ORIG = W.renderAssessments;
  if (typeof ORIG !== 'function') return;

  function fr() { try { return state.lang === 'fr'; } catch (e) { return false; } }
  function T(en, f) { return fr() ? f : en; }
  function L(k, en) { try { return typeof tr === 'function' ? tr(k, en) : en; } catch (e) { return en; } }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function demo() { try { return typeof demoOn === 'function' && !!demoOn(); } catch (e) { return false; } }
  function ring(f, c) { try { return W.__cdxRing(f, c || 'var(--cx-blue)'); } catch (e) { return ''; } }
  function bar(p) { try { return W.__cdxBar(p); } catch (e) { return ''; } }
  function key(label, attrs, cls) { return '<button type="button" class="cdx-key small' + (cls ? ' ' + cls : '') + '"' + (attrs || '') + '>' + label + '</button>'; }
  function strip(t) { return String(t || '').replace(/^[^A-Za-zÀ-ÿ0-9]+/, '').replace(/[\s▾]+$/, '').trim(); }
  function band(m) { return m >= 70 ? L('as.bDist', 'Distinction') : m >= 60 ? L('as.bMerit', 'Merit') : m >= 50 ? L('as.bPass', 'Pass') : L('as.bBelow', 'Below pass'); }
  function roman(n) { try { return (typeof ROMAN_NUMERALS !== 'undefined' && ROMAN_NUMERALS[n - 1]) || String(n); } catch (e) { return String(n); } }
  function hidden(t) { try { return typeof cdTermHidden === 'function' && cdTermHidden(t.id); } catch (e) { return false; } }
  function emoji(t) { try { return (typeof TERM_EMOJI !== 'undefined' && TERM_EMOJI[t.id]) || ''; } catch (e) { return ''; } }

  function figures(gb) {
    var all = [], per = [], total = 0;
    CURRICULUM.terms.forEach(function (t, ti) {
      total += t.modules.length;
      var marks = t.modules.map(function (m) { return moduleMark(curricMs(m.id), gb, m.legacyBookId); }).filter(function (x) { return x !== null; });
      all = all.concat(marks);
      if (hidden(t)) return;
      per.push({ t: t, ti: ti, n: t.modules.length, marks: marks, mean: marks.length ? Math.round(marks.reduce(function (a, b) { return a + b; }, 0) / marks.length) : null,
        done: t.modules.filter(function (m) { return isModuleAssessed(curricMs(m.id), gb, m.legacyBookId); }).length });
    });
    return { all: all, total: total, overall: all.length ? Math.round(all.reduce(function (a, b) { return a + b; }, 0) / all.length) : null, per: per };
  }
  // the words of a guide card the app draws: its title, its text, its tip
  function guide(card) {
    if (!card) return null;
    var head = card.querySelector(':scope > button > span'), inner = card.querySelector(':scope > div > div');
    var body = inner && inner.firstElementChild, tip = card.querySelector('.cd-tip-line');
    return { title: strip(head && head.textContent), body: body ? body.textContent : '', tip: tip ? tip.textContent : '' };
  }
  // the app's own drawing of a view, aside, for its words and its working parts
  function aside(fn, gb) { var t = D.createElement('div'); try { fn(t, gb); } catch (e) {} return t; }

  function tabs(view) {
    var T5 = [['home', L('as.tabHome', 'Overview')], ['record', L('as.tabRecords', 'Records')], ['quizzes', L('as.tabQuizzes', 'Quizzes')], ['seminars', L('as.tabSeminars', 'Seminars')], ['grades', L('as.tabMarks', 'Marks')]];
    return '<div class="cdz-top"><div class="cdt-pill" role="tablist" aria-label="' + esc(T('Assessments', 'Évaluations')) + '">'
      + T5.map(function (x) { return '<button type="button" class="cdt-tab" role="tab" data-atab="' + x[0] + '" aria-selected="' + (view === x[0]) + '">' + esc(x[1]) + '</button>'; }).join('')
      + '</div><button type="button" class="tabula-btn" data-atabula="1">Tabula</button></div>';
  }
  function howCard(g) {
    if (!g) return '';
    var open = false; try { open = !!state.cdxMarksOpen; } catch (e) {}
    var line = T('Checkpoints 20, quiz 10, essay 40, dialogue 30, on the UK scale; three attempts, the highest counts.', 'Points d’étape 20, quiz 10, dissertation 40, dialogue 30, sur l’échelle britannique ; trois tentatives, la meilleure compte.');
    return '<section class="cdx-card sky cdz-how cdx-rise" data-cdx="marks-how"><div class="cdz-how-top"><span class="cdz-how-badge" aria-hidden="true">⚖️</span>'
      + '<div class="cdz-how-line"><b>' + esc(g.title) + '</b>' + (open ? '' : esc(line)) + '</div>'
      + key(open ? T('Fold away ▴', 'Replier ▴') : T('Show ▾', 'Montrer ▾'), ' data-marks-how="1" aria-expanded="' + open + '"') + '</div>'
      + (open ? '<p class="cdz-how-body">' + esc(g.body) + '</p>' : '') + '</section>';
  }

  function home(root, gb) {
    var src = aside(renderAssessHome, gb);
    var cards = [].slice.call(src.querySelectorAll(':scope > .glass'));
    var heroKick = strip((src.querySelector('.paper > div') || {}).textContent);
    var gProp = guide(cards.filter(function (c) { return c.querySelector(':scope > button'); })[0]);
    var gHow = guide(cards.filter(function (c) { return c.querySelector(':scope > button'); })[1]);
    var ascCard = cards.filter(function (c) { return !c.querySelector(':scope > button') && c.querySelector('button'); })[0];
    var f = figures(gb), ps = null; try { ps = proposalStanding(); } catch (e) {}
    var h = tabs('home') + howCard(gHow);
    h += '<div class="cdx-row"><section class="cdx-card cdx-rise"><p class="cdx-kick">' + esc(heroKick || T('Overall · the curriculum', 'Ensemble · le cursus')) + '</p>'
      + '<div class="cdz-big">' + ring(f.total ? f.all.length / f.total : 0) + '<div class="n">' + f.all.length + T(' of ', ' sur ') + f.total
      + '<small>' + esc(L('as.modulesAssessed', ' modules assessed').trim()) + ' · ' + T('mean mark ', 'note moyenne ') + (f.overall !== null ? f.overall + ' (' + esc(band(f.overall)) + ')' : '—') + '</small></div></div>'
      + '<div class="cdz-mini">' + f.per.map(function (p) {
        return '<div><b>' + esc(L('as.termCaps', 'TERM ').trim().replace(/^./, function (c) { return c; }).toLowerCase().replace(/^./, function (c) { return c.toUpperCase(); }) + ' ' + roman(p.t.n)) + '</b>'
          + (p.n ? p.marks.length + T(' of ', ' sur ') + p.n : '—') + bar(p.n ? 100 * p.marks.length / p.n : 0) + '</div>';
      }).join('') + '</div></section>';
    if (gProp && ps) {
      h += '<section class="cdx-card sky cdx-rise"><p class="cdx-kick">' + esc(gProp.title) + '</p><div class="cdx-ring">' + ring(ps.total ? ps.marked / ps.total : 0)
        + '<div><b>' + ps.marked + T(' of ', ' sur ') + ps.total + T(' sections', ' sections') + '</b><span>' + T('marked · mean mark ', 'notées · note moyenne ') + (ps.mark !== null ? ps.mark : '—') + '</span></div></div>'
        + '<p class="cdx-note" style="margin:12px 0">' + esc(gProp.body) + '</p><div class="cdx-keys cdz-tipline" data-prop-keys="1">'
        + (demo() ? '' : key(T('Open the proposal', 'Ouvrir la proposition'), ' data-aprop="1"')) + '</div></section>';
    }
    h += '</div>';
    h += '<div class="cdx-trio">'
      + '<section class="cdx-card butter cdx-rise"><p class="cdx-kick">' + esc(L('as.tabQuizzes', 'Quizzes')) + '</p><p class="cdx-note">' + esc(L('ws.cardQuizD', 'A quick three-question check on a module. Best score counts toward the mark.')) + '</p><div class="cdx-keys">' + key(T('Take a quiz ›', 'Faire un quiz ›'), ' data-atab="quizzes"') + '</div></section>'
      + '<section class="cdx-card sage cdx-rise"><p class="cdx-kick">' + esc(L('as.tabSeminars', 'Seminars')) + '</p><p class="cdx-note">' + esc(L('ws.cardSeminarsD', 'Sit a Socratic dialogue on a module for a mark.')) + '</p><div class="cdx-keys">' + key(T('Sit a seminar ›', 'Suivre un séminaire ›'), ' data-atab="seminars"') + '</div></section>'
      + '<section class="cdx-card cdx-rise"><p class="cdx-kick">' + esc(L('as.tabRecords', 'Records')) + '</p><p class="cdx-note">' + T('Each module’s checkpoints, quiz, essay and dialogue, term by term.', 'Les points d’étape, le quiz, la dissertation et le dialogue de chaque module, trimestre par trimestre.') + '</p><div class="cdx-keys">' + key(T('Open the records ›', 'Ouvrir les relevés ›'), ' data-atab="record"') + '</div></section>'
      + '</div>';
    if (ascCard) {
      var at = ascCard.querySelector('div'), ab = ascCard.querySelector('button');
      h += '<section class="cdx-card sky cdx-rise" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:12px 18px"><span class="cdx-note" style="flex:1;min-width:200px;margin:0">' + esc(at ? at.textContent : '') + '</span>'
        + key(esc(strip(ab ? ab.textContent : T('Open Ascensus', 'Ouvrir Ascensus')).replace(/\s*→$/, '') + ' ›'), ' data-aasc="1"') + '</section>';
    }
    root.insertAdjacentHTML('beforeend', '<div class="cdx" id="cdx-assess">' + h + '</div>');
    var box = root.querySelector('[data-prop-keys]');
    if (box && gProp && gProp.tip && typeof W.cdTipFold === 'function') box.appendChild(W.cdTipFold(gProp.tip, '0'));
  }

  function grades(root, gb) {
    var src = aside(renderGradesView, gb);
    var f = figures(gb), ps = null; try { ps = proposalStanding(); } catch (e) {}
    var papers = [].slice.call(src.querySelectorAll(':scope > .paper'));
    var propLabel = '';
    papers.forEach(function (p) { var sp = p.querySelectorAll(':scope > span'); if (sp.length >= 3 && /🖊/.test(sp[0].textContent)) propLabel = sp[2].textContent; });
    var refresh = papers.filter(function (p) { return p.querySelector('button'); })[0];
    var foot = src.querySelector(':scope > p');
    var h = tabs('grades');
    h += '<section class="cdx-card cdx-rise"><div class="cdz-big">' + ring(f.total ? f.all.length / f.total : 0) + '<div class="n">' + f.all.length + T(' of ', ' sur ') + f.total
      + '<small>' + esc(L('as.modulesAssessed', ' modules assessed').trim()) + ' · ' + T('mean mark ', 'note moyenne ') + (f.overall !== null ? f.overall + ' (' + esc(band(f.overall)) + ')' : '—') + T(', UK scale', ', échelle britannique') + '</small></div></div></section>';
    var row = function (badge, k, title, frac, count, mark) {
      return '<div class="cdz-mark cdx-rise"><span class="cdz-badge" aria-hidden="true">' + badge + '</span><span class="k">' + esc(k) + '</span><span class="t">' + esc(title) + '</span>'
        + bar(frac * 100) + '<span class="c">' + count + '</span><span class="g' + (mark !== null && mark >= 70 ? ' hi' : '') + '">' + (mark !== null ? mark : '—') + '</span><span class="b">' + (mark !== null ? esc(band(mark)) : '') + '</span></div>';
    };
    h += '<div class="cdz-marks">' + f.per.map(function (p) { return row(emoji(p.t), L('as.termCaps', 'TERM ') + roman(p.t.n), termTitle(p.t), p.n ? p.marks.length / p.n : 0, p.n ? p.marks.length + '/' + p.n : '', p.mean); }).join('');
    if (ps && ps.total) h += row('🖊️', L('cm.proposalRow', 'PROPOSAL'), propLabel || L('as.dphilProposal', 'research proposal'), ps.marked / ps.total, ps.marked + '/' + ps.total, ps.mark);
    h += '</div>';
    root.insertAdjacentHTML('beforeend', '<div class="cdx cdz-calm" id="cdx-assess">' + h + '</div>');
    var cdx = root.querySelector('#cdx-assess');
    if (refresh) {
      // the app's own refreshers, its keys working as before, in a card of the new look
      var sec = D.createElement('section'); sec.className = 'cdx-card butter cdz-own cdz-refresh cdx-rise';
      [].slice.call(refresh.children).forEach(function (c) { sec.appendChild(c); });
      var k0 = sec.firstElementChild; if (k0) { k0.removeAttribute('style'); k0.className = 'cdx-kick'; }
      [].forEach.call(sec.querySelectorAll(':scope > div'), function (d) { if (d.querySelector('button')) d.className = 'cdz-rrow'; });
      cdx.appendChild(sec);
    }
    if (foot) { var p = D.createElement('p'); p.className = 'cdx-cap'; p.textContent = foot.textContent; cdx.appendChild(p); }
  }

  function records(root, gb) {
    var h = tabs('record');
    root.insertAdjacentHTML('beforeend', '<div class="cdx cdz-calm" id="cdx-assess">' + h + '</div>');
    var cdx = root.querySelector('#cdx-assess');
    CURRICULUM.terms.forEach(function (term, ti) {
      if (hidden(term)) return;
      var unlocked = isTermUnlocked(ti, state.curriculum, gb);
      var done = term.modules.filter(function (m) { return isModuleAssessed(curricMs(m.id), gb, m.legacyBookId); }).length;
      var marks = term.modules.map(function (m) { return moduleMark(curricMs(m.id), gb, m.legacyBookId); }).filter(function (m) { return m !== null; });
      var avg = marks.length ? Math.round(marks.reduce(function (a, b) { return a + b; }, 0) / marks.length) : null;
      var open = assessUI.openTerm === term.id;
      var sec = D.createElement('section');
      sec.className = 'cdx-card cdx-rise' + (open ? ' sky' : '');
      sec.innerHTML = '<button type="button" class="cdz-thead" data-aterm="' + esc(term.id) + '" aria-expanded="' + open + '"><span class="cdz-badge" aria-hidden="true">' + emoji(term) + '</span>'
        + '<span class="grow"><p class="cdx-kick">' + esc(L('as.termCaps', 'TERM ') + term.n) + '</p><h4>' + esc(termTitle(term)) + '</h4></span>'
        + (unlocked ? '' : '<span class="cdz-lock">🔒 ' + esc(T('after Term ', 'après le trimestre ') + (term.n - 1)) + '</span>')
        + '<span class="cdx-ring">' + ring(term.modules.length ? done / term.modules.length : 0) + '<span><b>' + done + '/' + term.modules.length + '</b><span>' + esc(L('as.assessed', ' assessed').trim()) + (avg !== null ? esc(L('as.avg', ' · avg ')) + avg : '') + '</span></span></span>'
        + '<span class="cdz-chev" aria-hidden="true">' + (open ? '▴' : '▾') + '</span></button>';
      if (open) {
        var body = D.createElement('div'); body.className = 'cdz-tbody';
        if (!unlocked) { var n = D.createElement('p'); n.textContent = L('cm.unlockA', 'Unlocks after Term ') + (term.n - 1) + L('cm.unlockMarks', ' is assessed. Read ahead freely; the marks will wait for you.'); body.appendChild(n); }
        term.modules.forEach(function (mod) { body.appendChild(renderAssessModule(mod, unlocked)); });
        sec.appendChild(body);
      }
      cdx.appendChild(sec);
    });
  }

  function wire(root) {
    root.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-atab],[data-atabula],[data-aterm],[data-aprop],[data-aasc],[data-marks-how]') : null;
      if (!t || !root.contains(t)) return;
      var a;
      if ((a = t.getAttribute('data-atab'))) {
        if (a === 'seminars') { openSeminarsPage(); return; }
        if (a === 'quizzes') { openQuizzesPage(); return; }
        assessUI.view = a; if (a === 'grades') { try { curricUI.quiz = null; } catch (x) {} }
        W.renderAssessments(); return;
      }
      if (t.hasAttribute('data-atabula')) { try { if (typeof openExt === 'function') openExt('tabula'); } catch (x) {} return; }
      if ((a = t.getAttribute('data-aterm'))) { assessUI.openTerm = assessUI.openTerm === a ? null : a; W.renderAssessments(); return; }
      if (t.hasAttribute('data-aprop')) { try { showSection('applications'); candUI.tab = 'proposal'; renderCandidature(); } catch (x) {} return; }
      if (t.hasAttribute('data-aasc')) { try { showSection('ascent'); } catch (x) {} return; }
      if (t.hasAttribute('data-marks-how')) { try { state.cdxMarksOpen = !state.cdxMarksOpen; saveState(); } catch (x) {} W.renderAssessments(); var k = root.querySelector('[data-marks-how]'); if (k) try { k.focus({ preventScroll: true }); } catch (x) {} return; }
    });
    root.__cdz78 = 1;
  }

  function draw() {
    var root = D.getElementById('assess-root'); if (!root) return;
    var gb = state.gradebook || {};
    var view = assessUI.view || 'home';
    if (view !== 'home' && view !== 'grades' && view !== 'record') return ORIG.apply(this, arguments);
    root.innerHTML = '';
    if (!root.__cdz78) wire(root);
    if (view === 'home') home(root, gb); else if (view === 'grades') grades(root, gb); else records(root, gb);
    var k = 0; [].forEach.call(root.querySelectorAll('.cdx-rise'), function (n) { n.style.animationDelay = (k++ * 0.04).toFixed(2) + 's'; });
    try { W.__cdxSettle(root.querySelector('#cdx-assess')); } catch (e) {}
  }
  W.renderAssessments = function () {
    try { return draw.apply(this, arguments); }
    catch (e) { try { console.warn('Assessments: the app draws its own page', e); } catch (x) {} return ORIG.apply(this, arguments); }
  };
  W.renderAssessments.__cd1078 = 1;
})();
