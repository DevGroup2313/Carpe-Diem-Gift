(function () {
  'use strict';
  // 1076 · Candidatus's Applications, Proposal, Milestones and Citations in the design of its Overview (the owner, 31
  // October 2026: "redesign them as well because the Overview page just looks really random right now on its own").
  // Everything each tab did, it still does: the app's own working parts are kept and set in the new cards. Each tab
  // falls back to the app's own drawing should anything fail. The demonstrations keep their own pages.
  if (window.__cdxTabs1076) return;
  window.__cdxTabs1076 = 1;
  var W = window, D = document;

  function fr() { try { return state.lang === 'fr'; } catch (e) { return false; } }
  function T(en, f) { return fr() ? f : en; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function TK(k, en) { try { return typeof tr === 'function' ? tr(k, en) : en; } catch (e) { return en; } }
  function TD(s) { try { return typeof trd === 'function' ? trd(s) : s; } catch (e) { return s; } }
  function save() { try { saveState(); } catch (e) {} }
  function demo() { try { return typeof demoOn === 'function' && !!demoOn(); } catch (e) { return false; } }
  function ring(f, c, k) { try { return W.__cdxRing(f, c, k); } catch (e) { return ''; } }
  function bar(p, k) { try { return W.__cdxBar(p, k); } catch (e) { return ''; } }
  function settle(r) { try { W.__cdxSettle(r); } catch (e) {} }
  function stagger(r) { var k = 0; [].forEach.call(r.querySelectorAll('.cdx-rise'), function (n) { n.style.animationDelay = (k++ * 0.045).toFixed(3) + 's'; }); }
  function warn(what, e) { try { console.warn(what, e); } catch (x) {} }
  function days(dstr) { try { var d = parseDate(dstr); if (!d) return null; var t = new Date(); t.setHours(0, 0, 0, 0); return Math.round((d - t) / 864e5); } catch (e) { return null; } }
  function inN(n) { return n === 0 ? T('today', 'aujourd’hui') : n === 1 ? T('tomorrow', 'demain') : T('in ' + n + ' days', 'dans ' + n + ' jours'); }

  var O = { buckets: W.renderBucketTabs, apps: W.renderAppsList, prop: W.renderProposalView, ms: W.renderMilestonesView, cit: W.renderCitationsView };

  // ---------------- Applications ----------------
  function bucketOf(p) { return (p && p.bucket) || 'active'; }
  function appsHead() {
    var sec = D.getElementById('cand-applications'); if (!sec) return false;
    var restore = D.getElementById('apps-restore'); if (restore && restore.parentNode) restore.parentNode.classList.add('cdx-gone');
    var form = D.getElementById('apps-add-form'); if (form) form.classList.add('cdx-tok', 'cdx-form');
    var fb = D.getElementById('funded-banner'); if (fb) fb.classList.add('cdx-tok', 'cdx-banner');
    var ps = state.programs || [], n = { active: 0, review: 0, decided: 0 };
    ps.forEach(function (p) { n[bucketOf(p)] = (n[bucketOf(p)] || 0) + 1; });
    var next = null;
    ps.forEach(function (p) { if (bucketOf(p) !== 'active') return; var d = days(p.deadline); if (d != null && d >= 0 && (!next || d < next.d)) next = { d: d, p: p }; });
    var offer = ps.filter(function (p) { return p.outcome && String(p.outcome).indexOf('Offer') !== -1; }).length;
    var head = D.getElementById('cdx-apps-head');
    if (!head) { head = D.createElement('div'); head.id = 'cdx-apps-head'; head.className = 'cdx'; sec.insertBefore(head, sec.firstChild); }
    head.innerHTML = '<section class="cdx-card cdx-rise"><div class="cdx-flex"><div class="cdx-grow"><p class="cdx-kick">' + T('Applications', 'Candidatures') + '</p>'
      + '<h3 class="cdx-h">' + T(ps.length + (ps.length === 1 ? ' programme' : ' programmes') + ' on your list', ps.length + (ps.length > 1 ? ' programmes' : ' programme') + ' sur votre liste') + '</h3>'
      + '<p class="cdx-note" style="margin:0">' + T(n.review + ' submitted · ' + n.decided + ' decided', n.review + ' envoyée' + (n.review > 1 ? 's' : '') + ' · ' + n.decided + ' décidée' + (n.decided > 1 ? 's' : ''))
      + (offer ? ' · <b>' + T(offer + ' offer' + (offer > 1 ? 's' : ''), offer + ' offre' + (offer > 1 ? 's' : '')) + '</b>' : '')
      + ' · ' + (next ? T('next deadline: ', 'prochaine date limite : ') + esc(next.p.name) + ', ' + inN(next.d) : T('no deadline set yet', 'aucune date limite pour l’instant')) + '</p></div>'
      + '<div class="cdx-keys"><button type="button" class="cdx-key cdx-main" data-a="add">+ ' + T('Add a programme', 'Ajouter un programme') + '</button><button type="button" class="cdx-key" data-a="restore">⟲ ' + T('Restore defaults', 'Rétablir les programmes') + '</button></div></div></section>';
    if (!head.__cdx) {
      head.__cdx = 1;
      head.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('[data-a]'); if (!b) return;
        var id = b.getAttribute('data-a') === 'add' ? 'apps-add' : 'apps-restore', o = D.getElementById(id);
        if (o) o.click();
        if (id === 'apps-add') setTimeout(function () { var i = D.getElementById('apps-add-name'); if (i && !D.getElementById('apps-add-form').classList.contains('hidden')) i.focus(); }, 30);
      });
    }
    var tabs = D.getElementById('apps-bucket-tabs'); if (!tabs) return false;
    tabs.className = 'cdx-tok cdx-buckets'; tabs.removeAttribute('style');
    var cur = (typeof activeBucket !== 'undefined' && activeBucket) || 'active';
    var B = [['active', '📌', T('Active', 'En cours'), T('in preparation', 'en préparation'), 'sky'], ['review', '🔍', T('In review', 'En examen'), T('submitted', 'envoyées'), 'butter'], ['decided', '✅', T('Decided', 'Décidées'), T('outcome recorded', 'issue connue'), 'sage']];
    tabs.innerHTML = B.map(function (b) {
      return '<button type="button" class="cdx-tile ' + b[4] + ' cdx-rise" data-bucket="' + b[0] + '" aria-pressed="' + (cur === b[0]) + '"><i>' + b[1] + '</i><b>' + (n[b[0]] || 0) + '</b><span><strong>' + b[2] + '</strong><small>' + b[3] + '</small></span></button>';
    }).join('');
    if (!tabs.__cdx) {
      tabs.__cdx = 1;
      tabs.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('[data-bucket]'); if (!b) return;
        try { activeBucket = b.getAttribute('data-bucket'); } catch (x) {}
        try { renderApplications(); } catch (x) {}
      });
    }
    stagger(head); stagger(tabs);
    return true;
  }
  W.renderBucketTabs = function () {
    if (demo()) return O.buckets.apply(this, arguments);
    try { if (appsHead() !== false) return; } catch (e) { warn('Applications', e); }
    return O.buckets.apply(this, arguments);
  };

  function appsList() {
    var root = D.getElementById('apps-list'); if (!root) return;
    var cur = (typeof activeBucket !== 'undefined' && activeBucket) || 'active';
    var inB = (state.programs || []).filter(function (p) { return bucketOf(p) === cur; });
    var orig = [].slice.call(root.children), openId = state.openProgram, body = null;
    inB.forEach(function (p, i) { if (p.id === openId && orig[i]) body = orig[i].querySelector(':scope > .fadeup'); });
    var tpl = (typeof CHECKLIST_TEMPLATE !== 'undefined' && CHECKLIST_TEMPLATE) ? CHECKLIST_TEMPLATE.length : 9;
    var wrap = D.createElement('div'); wrap.className = 'cdx cdx-apps';
    if (!inB.length) {
      var msg = cur === 'active' ? TK('app.emptyActive', 'No active programmes. Add one to begin.') : cur === 'review' ? TK('app.emptyReview', 'No applications currently under review. When you submit one, move it here.') : TK('app.emptyDecided', 'No decisions yet. Outcomes will appear here when they arrive.');
      wrap.innerHTML = '<section class="cdx-card butter cdx-rise cdx-empty"><p class="cdx-note" style="margin:0 0 10px">' + esc(msg) + '</p>'
        + (cur === 'active' ? '<button type="button" class="cdx-key cdx-main" data-a="add">+ ' + T('Add a programme', 'Ajouter un programme') + '</button>' : '') + '</section>';
    } else {
      wrap.innerHTML = inB.map(function (p) {
        var open = p.id === openId, b = bucketOf(p), d = days(p.deadline), sd = days(p.scholarshipDeadline);
        var chips = '';
        if (b === 'active' && d != null && d >= 0 && d <= 30) chips += '<span class="cdx-tag warm">' + T('deadline ', 'date limite ') + inN(d) + '</span>';
        else if (b === 'active' && d != null && d >= 0) chips += '<span class="cdx-tag">' + T('deadline ', 'date limite ') + inN(d) + '</span>';
        if (b === 'active' && sd != null && sd >= 0 && sd <= 30) chips += '<span class="cdx-tag warm">' + T('scholarship ', 'bourse ') + inN(sd) + '</span>';
        var offer = p.outcome && String(p.outcome).indexOf('Offer') !== -1;
        var status = b === 'decided' && p.outcome ? '<span class="cdx-tag' + (offer ? ' gold' : '') + '">' + esc(TD(p.outcome)) + '</span>' : '<span class="cdx-tag">' + esc(TD(p.status || '')) + '</span>';
        var done = ((state.checklists || {})[p.id] || []).length;
        var tint = b === 'review' ? ' butter' : b === 'decided' ? (offer ? ' sage' : '') : '';
        return '<section class="cdx-card cdx-prog' + tint + (open ? ' open' : '') + ' cdx-rise" data-prog="' + esc(p.id) + '">'
          + '<div class="cdx-prog-head" role="button" tabindex="0" aria-expanded="' + open + '" data-open="' + esc(p.id) + '">'
          + '<span class="cdx-x cdx-chev" aria-hidden="true">' + (open ? '▾' : '▸') + '</span>'
          + '<div class="cdx-grow"><b class="cdx-prog-name">' + esc(p.name) + '</b><span class="cdx-prog-uni">' + esc(p.uni || '') + '</span>' + (chips ? '<span class="cdx-chips">' + chips + '</span>' : '') + '</div>'
          + status
          + '<span class="cdx-mini" title="' + T('Application checklist', 'Liste de la candidature') + '">' + ring(tpl ? done / tpl : 0, 'var(--cx-blue)', 'r-p-' + p.id) + '<em>' + done + '/' + tpl + '</em></span>'
          + '<button type="button" class="cdx-x" data-del="' + esc(p.id) + '" title="' + T('Remove', 'Retirer') + '" aria-label="' + T('Remove ', 'Retirer ') + esc(p.name) + '">✕</button>'
          + '</div></section>';
      }).join('');
      if (body) {
        var host = wrap.querySelector('.cdx-prog.open');
        if (host) { body.classList.add('cdx-body'); host.appendChild(body); }
      }
    }
    root.innerHTML = '';
    root.appendChild(wrap);
    if (!root.__cdx) {
      root.__cdx = 1;
      var toggle = function (id) { state.openProgram = state.openProgram === id ? null : id; try { renderAppsList(); } catch (x) {} };
      root.addEventListener('click', function (e) {
        var t = e.target;
        var del = t.closest && t.closest('[data-del]');
        if (del) {
          e.stopPropagation();
          var id = del.getAttribute('data-del'), p = (state.programs || []).filter(function (x) { return x.id === id; })[0]; if (!p) return;
          if (confirm(TK('app.removeA', 'Remove ') + p.name + TK('app.removeB', '?'))) { state.programs = state.programs.filter(function (x) { return x.id !== id; }); save(); try { renderApplications(); } catch (x) {} }
          return;
        }
        var add = t.closest && t.closest('[data-a="add"]'); if (add) { var o = D.getElementById('apps-add'); if (o) o.click(); return; }
        var h = t.closest && t.closest('[data-open]');
        if (h && !(t.closest('.cdx-body'))) toggle(h.getAttribute('data-open'));
      });
      root.addEventListener('keydown', function (e) {
        var h = e.target.closest && e.target.closest('[data-open]');
        if (h && e.target === h && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggle(h.getAttribute('data-open')); }
      });
    }
    stagger(wrap); settle(wrap);
  }
  W.renderAppsList = function () {
    var r = O.apps.apply(this, arguments);
    if (demo()) return r;
    try { appsList(); } catch (e) { warn('Applications list', e); try { O.apps.apply(this, arguments); } catch (x) {} }
    return r;
  };

  // ---------------- the Proposal ----------------
  function propView() {
    var root = D.getElementById('cand-proposal'); if (!root) return;
    var kids = [].slice.call(root.children);
    var hero = null, ascent = null, appsRow = null, wsRow = null, cards = [];
    kids.forEach(function (k) {
      if (!hero && k.querySelector && k.querySelector('.cd-prop-title')) { hero = k; return; }
      if (!appsRow && k.querySelector && k.querySelector('.tabula-btn')) { appsRow = k; return; }
      if (!hero && k.classList.contains('glass') && !ascent) { ascent = k; return; }
      if (hero && !wsRow && !k.classList.contains('glass')) { wsRow = k; return; }
      if (hero && k.classList.contains('glass')) cards.push(k);
    });
    if (!hero) return;
    var secs = []; try { secs = ensureProposalSections(); } catch (e) {}
    var total = 0, done = 0;
    secs.forEach(function (s) { var subs = s.subsections || []; total += subs.length || 1; done += subs.length ? subs.filter(function (x) { return x.done; }).length : (s.done ? 1 : 0); });
    var pct = total ? Math.round(done / total * 100) : 0, tline = '';
    try { tline = cdPropTargetLine(false); } catch (e) {}
    var wrap = D.createElement('div'); wrap.className = 'cdx'; wrap.id = 'cdx-prop';
    wrap.innerHTML = '<div class="cdx-row"><section class="cdx-card cdx-rise" data-slot="hero"><p class="cdx-kick">' + T('The proposal', 'La proposition') + '</p><div data-slot="title"></div>'
      + '<div class="cdx-flex" style="margin:10px 0 4px">' + ring(pct / 100, 'var(--cx-blue)', 'r-propall') + '<div class="cdx-grow"><div class="cdx-big"><b>' + pct + '%</b><span>' + T('complete', 'achevée') + '</span></div>'
      + '<p class="cdx-note" style="margin:4px 0 0">' + done + T(' of ', ' sur ') + total + T(' items done', ' éléments faits') + esc(tline) + '</p></div></div>'
      + '<div data-slot="mark"></div><div class="cdx-keys" data-slot="keys" style="margin-top:12px"></div></section>'
      + '<section class="cdx-card butter cdx-rise" data-slot="ascent"><p class="cdx-kick">' + T('Learn it first', 'L’apprendre d’abord') + '</p><div data-slot="ascent-in"></div><div class="cdx-keys" data-slot="apps" style="margin-top:12px"></div></section></div>'
      + '<div class="cdx-secs">' + secs.map(function (s, i) {
        var p = 0; try { p = sectionPctOffline(s); } catch (e) {}
        var subs = s.subsections || [], sd = subs.filter(function (x) { return x.done; }).length, open = candUI.propOpen === s.id;
        var best = null; try { best = bestAttempt(s.marks || []); } catch (e) {}
        var tint = p >= 100 || s.done ? ' sage' : p > 0 ? ' butter' : '';
        return '<section class="cdx-card cdx-sec' + tint + (open ? ' open' : '') + ' cdx-rise" data-sec="' + esc(s.id) + '" data-i="' + i + '">'
          + '<button type="button" class="cdx-sec-head" data-sec-open="' + esc(s.id) + '" aria-expanded="' + open + '">' + ring(p / 100, 'var(--cx-blue)', 'r-sec-' + s.id)
          + '<span class="cdx-grow"><b>' + ((p >= 100 || s.done) ? '✓ ' : '') + esc(TD(s.title)) + '</b><span>' + (subs.length ? sd + T(' of ', ' sur ') + subs.length + (subs.length === 1 ? T(' part', ' partie') : T(' parts', ' parties')) : (s.done ? T('complete', 'achevée') : T('not marked complete yet', 'pas encore achevée'))) + (best != null ? ' · ' + T('mark ', 'note ') + best + '/100' : '') + '</span></span>'
          + '<span class="cdx-x cdx-chev" aria-hidden="true">' + (open ? '▾' : '▸') + '</span></button></section>';
      }).join('') + '</div>';
    // the app's own working parts, set in the new cards
    var title = hero.querySelector('.cd-prop-title'); if (title) { title.classList.add('cdx-titlekey'); wrap.querySelector('[data-slot="title"]').appendChild(title); }
    var mark = hero.querySelector('.grade-chip'); if (mark && mark.parentNode) wrap.querySelector('[data-slot="mark"]').appendChild(mark.parentNode);
    if (wsRow) [].slice.call(wsRow.children).forEach(function (b, i) { b.className = 'cdx-key' + (i === 0 ? ' cdx-main' : ''); wrap.querySelector('[data-slot="keys"]').appendChild(b); });
    if (ascent) {
      var at = ascent.querySelector('div'), ab = ascent.querySelector('button');
      if (at) { var p1 = D.createElement('p'); p1.className = 'cdx-note'; p1.textContent = at.textContent; wrap.querySelector('[data-slot="ascent-in"]').appendChild(p1); }
      if (ab) { ab.className = 'cdx-key cdx-main'; wrap.querySelector('[data-slot="apps"]').appendChild(ab); }
    } else wrap.querySelector('[data-slot="ascent-in"]').innerHTML = '<p class="cdx-note">' + T('Draft beside your notes and sources.', 'Rédigez à côté de vos notes et de vos sources.') + '</p>';
    if (appsRow) [].slice.call(appsRow.children).forEach(function (b) { wrap.querySelector('[data-slot="apps"]').appendChild(b); });
    secs.forEach(function (s, i) {
      if (candUI.propOpen !== s.id || !cards[i]) return;
      var body = cards[i].querySelector(':scope > .fadeup'), host = wrap.querySelector('.cdx-sec.open');
      if (body && host) {
        body.classList.add('cdx-body'); host.appendChild(body);
        // its parts are step rows like the Overview's, each with its raised box; the workshop's bar is a key
        [].forEach.call(body.querySelectorAll(':scope > button'), function (r) { r.classList.add('cdx-step'); });
        var wb = body.querySelector('.glass > button'); if (wb) wb.classList.add('cdx-barkey');
      }
    });
    root.innerHTML = '';
    root.appendChild(wrap);
    if (!root.__cdx) {
      root.__cdx = 1;
      root.addEventListener('click', function (e) {
        var h = e.target.closest && e.target.closest('[data-sec-open]'); if (!h || !root.contains(h)) return;
        var id = h.getAttribute('data-sec-open'); candUI.propOpen = candUI.propOpen === id ? null : id;
        try { renderProposalView(); } catch (x) {}
      });
    }
    stagger(wrap); settle(wrap);
  }
  W.renderProposalView = function () {
    var r = O.prop.apply(this, arguments);
    if (demo()) return r;
    try { propView(); } catch (e) { warn('Proposal', e); try { O.prop.apply(this, arguments); } catch (x) {} }
    return r;
  };

  // ---------------- Milestones ----------------
  function msView() {
    var root = D.getElementById('cand-milestones'); if (!root) return false;
    if (!state.candidature) state.candidature = JSON.parse(JSON.stringify(DEFAULT_CANDIDATURE));
    var c = state.candidature, ms = c.milestones || [];
    var doneN = ms.filter(function (m) { return m.done; }).length, here = -1;
    ms.forEach(function (m, i) { if (here < 0 && !m.done) here = i; });
    var nextM = here >= 0 ? ms[here] : null, lastDone = -1;
    ms.forEach(function (m, i) { if (m.done) lastDone = i; });
    var fill = ms.length > 1 ? Math.max(0, lastDone) / (ms.length - 1) : 0, f0 = 0;
    try { f0 = W.__cdxStill && W.__cdxStill() ? fill.toFixed(3) : (W.__cdxLast && W.__cdxLast('msroad') != null ? W.__cdxLast('msroad') : 0); } catch (e) {}
    var fmt = function (d) { try { return fmtMilestoneDate(d); } catch (e) { return d; } };
    var list = function (key, kick, title, blurb, tint, rk) {
      var items = c[key] || [], dn = items.filter(function (x) { return x.done; }).length;
      return '<section class="cdx-card ' + tint + ' cdx-rise"><p class="cdx-kick">' + esc(kick) + '</p><div class="cdx-flex">' + ring(items.length ? dn / items.length : 0, 'var(--cx-blue)', rk)
        + '<div class="cdx-grow"><h3 class="cdx-h small">' + esc(title) + '</h3><p class="cdx-note" style="margin:0">' + dn + T(' of ', ' sur ') + items.length + T(' done', ' faits') + '</p></div></div>'
        + (blurb ? '<p class="cdx-note" style="margin:10px 0 6px">' + esc(blurb) + '</p>' : '')
        + '<div class="cdx-steps plain">' + items.map(function (x, i) { return '<button type="button" class="cdx-step' + (x.done ? ' on' : '') + '" data-ck="' + key + ':' + i + '" aria-pressed="' + !!x.done + '"><span class="cdx-box' + (x.done ? ' on' : '') + '" aria-hidden="true">✓</span><span>' + esc(TD(x.label)) + '</span></button>'; }).join('') + '</div></section>';
    };
    var editing = root.__cdxEdit || null;
    var h = '<div class="cdx-row"><section class="cdx-card butter cdx-rise"><p class="cdx-kick">' + T('About these dates', 'À propos de ces dates') + '</p><p class="cdx-note" style="margin:0">' + esc(TK('ms.intro', 'The application cycle, end to end. Dates are editable estimates for a typical Oxford gathered-field round; confirm each against your department\'s published deadlines, since they vary by programme. Tap a date to change it.')) + '</p></section>'
      + '<section class="cdx-card cdx-rise"><p class="cdx-kick">' + T('Where you are', 'Où vous en êtes') + '</p><div class="cdx-flex">' + ring(ms.length ? doneN / ms.length : 0, 'var(--cx-blue)', 'r-msall')
      + '<div class="cdx-grow"><div class="cdx-big"><b>' + doneN + '</b><span>' + T('of ' + ms.length + ' milestones done', 'jalon' + (doneN > 1 ? 's' : '') + ' fait' + (doneN > 1 ? 's' : '') + ' sur ' + ms.length) + '</span></div>'
      + '<p class="cdx-note" style="margin:4px 0 0">' + (nextM ? T('Next: ', 'Ensuite : ') + '<b>' + esc(TD(nextM.label)) + '</b>' + (nextM.date ? ', ' + esc(fmt(nextM.date)) : '') : T('Every milestone is behind you.', 'Tous les jalons sont derrière vous.')) + '</p></div></div></section></div>'
      + '<section class="cdx-card cdx-rise"><p class="cdx-kick">' + esc(TK('ms.dated', 'Dated milestones')) + '</p><div class="cdx-msroad"><i class="cdx-msfill" style="--f:' + f0 + '" data-to="' + fill.toFixed(3) + '" data-k="msroad"></i>'
      + ms.map(function (m, i) {
        var dl = null; try { dl = milestoneDaysUntil(m.date); } catch (e) {}
        var when = !m.done && dl != null ? (dl < 0 ? T('date passed: move it when it suits you', 'date passée : à déplacer quand cela vous convient') : inN(dl)) : '';
        var dateKey = editing === m.id ? '<input type="date" class="cdx-field cdx-date" data-ms-date-in="' + esc(m.id) + '" value="' + esc(m.date || '') + '" aria-label="' + T('The date of ', 'La date de ') + esc(TD(m.label)) + '"><button type="button" class="cdx-x" data-ms-cancel="1" title="' + T('Cancel', 'Annuler') + '" aria-label="' + T('Cancel', 'Annuler') + '">✕</button>'
          : '<button type="button" class="cdx-key chip" data-ms-date="' + esc(m.id) + '">📅 ' + (m.date ? esc(fmt(m.date)) : T('Set a date', 'Choisir une date')) + '</button>';
        return '<div class="cdx-ms' + (m.done ? ' done' : '') + (i === here ? ' here' : '') + '"><button type="button" class="cdx-dot" data-ms-done="' + esc(m.id) + '" aria-pressed="' + !!m.done + '" title="' + (m.done ? T('Mark not done', 'Marquer non fait') : T('Mark done', 'Marquer fait')) + '">' + (m.done ? '✓' : (i + 1)) + '</button>'
          + '<div class="cdx-grow"><b class="cdx-ms-t">' + esc(TD(m.label)) + '</b><div class="cdx-keys" style="gap:8px;margin:6px 0 4px">' + dateKey + (when ? '<span class="cdx-tag' + (dl != null && dl >= 0 && dl <= 14 ? ' warm' : '') + '">' + when + '</span>' : '') + '</div>'
          + (m.note ? '<p class="cdx-note" style="margin:0;font-size:12.5px">' + esc(TD(m.note)) + '</p>' : '') + '</div></div>';
      }).join('') + '</div></section>'
      + '<div class="cdx-row even">'
      + list('funding', TK('ms.fundHead', 'Funding and scholarships'), TK('ms.fundTitle', 'Schemes to pursue'), TK('ms.fundBlurb', 'Most Oxford funding ties to the application deadline or earlier. Treat funding as part of the application, not a later step.'), 'sage', 'r-msfund')
      + list('visa', TK('ms.visaHead', 'Visa and arrival'), TK('ms.visaTitle', 'After an offer'), TK('ms.visaBlurb', 'Begins once you hold an offer and a CAS. Listed now so nothing is a surprise later.'), 'sky', 'r-msvisa')
      + '</div>';
    root.innerHTML = '<div class="cdx" id="cdx-ms">' + h + '</div>';
    var inp = root.querySelector('[data-ms-date-in]');
    if (inp) {
      setTimeout(function () { try { inp.focus(); } catch (e) {} }, 30);
      inp.addEventListener('change', function () {
        var id = inp.getAttribute('data-ms-date-in'), m = ms.filter(function (x) { return x.id === id; })[0];
        root.__cdxEdit = null;
        if (m) { if (m.id === 'ms-proposal' && typeof cdSetProposalTarget === 'function') cdSetProposalTarget(inp.value); else { m.date = inp.value; save(); } }
        renderMilestonesView();
      });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Escape') { root.__cdxEdit = null; renderMilestonesView(); } });
    }
    if (!root.__cdx) {
      root.__cdx = 1;
      root.addEventListener('click', function (e) {
        var t = e.target.closest ? e.target.closest('button') : null; if (!t || !root.contains(t)) return;
        var a, cc = state.candidature;
        if (t.hasAttribute('data-ms-cancel')) { root.__cdxEdit = null; renderMilestonesView(); return; }
        if ((a = t.getAttribute('data-ms-done'))) { var m = (cc.milestones || []).filter(function (x) { return x.id === a; })[0]; if (m) { m.done = !m.done; root.__cdxEdit = null; save(); renderMilestonesView(); } return; }
        if ((a = t.getAttribute('data-ms-date'))) { root.__cdxEdit = a; renderMilestonesView(); return; }
        if ((a = t.getAttribute('data-ck'))) { var q = a.split(':'), x = (cc[q[0]] || [])[+q[1]]; if (x) { x.done = !x.done; root.__cdxEdit = null; save(); renderMilestonesView(); } return; }
      });
    }
    var w = root.querySelector('#cdx-ms'); stagger(w); settle(w);
    return true;
  }
  W.renderMilestonesView = function () {
    if (demo()) return O.ms.apply(this, arguments);
    try { if (msView() !== false) return; } catch (e) { warn('Milestones', e); }
    return O.ms.apply(this, arguments);
  };

  // ---------------- Citations ----------------
  function citView() {
    var root = D.getElementById('cand-citations'); if (!root) return false;
    var cits = state.citations || [];
    var sorted = cits.slice().sort(function (a, b) { return (a.author || '').localeCompare(b.author || '') || (a.title || '').localeCompare(b.title || ''); });
    var tags = {}; cits.forEach(function (c) { (c.tags || []).forEach(function (t) { tags[t] = (tags[t] || 0) + 1; }); });
    var h = '<section class="cdx-card cdx-rise"><div class="cdx-flex"><div class="cdx-grow"><p class="cdx-kick">' + T('Citations', 'Citations') + '</p><h3 class="cdx-h">' + cits.length + T(cits.length === 1 ? ' reference' : ' references', cits.length > 1 ? ' références' : ' référence') + '</h3>'
      + '<p class="cdx-note" style="margin:0">' + T('Sorted by author', 'Classées par auteur') + (Object.keys(tags).length ? ' · ' + Object.keys(tags).length + T(' themes', ' thèmes') : '') + '</p></div>'
      + '<div class="cdx-keys">' + (!candUI.citAdding ? '<button type="button" class="cdx-key cdx-main" data-c="add">' + esc(TK('cit.add', '+ Add reference')) + '</button>' : '') + '<button type="button" class="fontes-btn" data-c="fontes">Fontes</button></div></div></section>';
    if (candUI.citAdding) {
      var d = candUI.citDraft || { title: '', author: '', year: '', source: '', note: '', tags: '' };
      var f = function (label, key, ph, wide) { return '<label class="cdx-lab' + (wide ? ' wide' : '') + '"><span>' + esc(label) + '</span><input class="cdx-field" data-f="' + key + '" placeholder="' + esc(ph) + '" value="' + esc(d[key] || '') + '"></label>'; };
      h += '<section class="cdx-card sky cdx-rise"><p class="cdx-kick">' + (candUI.citEditId ? T('Edit the reference', 'Modifier la référence') : T('A new reference', 'Une nouvelle référence')) + '</p><div class="cdx-form-grid">'
        + f(TK('cit.fTitle', 'Title'), 'title', TK('cit.phTitle', 'Work title'), true) + f(TK('cit.fAuthor', 'Author'), 'author', TK('cit.phAuthor', 'Surname, Forename')) + f(TK('cit.fYear', 'Year'), 'year', '2024')
        + f(TK('cit.fSource', 'Source or DOI'), 'source', TK('cit.phSource', 'Journal, publisher, or link'), true) + f(TK('cit.fTags', 'Tags'), 'tags', TK('cit.phTags', 'comma, separated, themes'), true)
        + '<label class="cdx-lab wide"><span>' + esc(TK('cit.fNote', 'Note')) + '</span><textarea class="cdx-field" data-f="note" rows="3" placeholder="' + esc(TK('cit.phNote', 'Why this matters, the argument, the page to revisit.')) + '">' + esc(d.note || '') + '</textarea></label></div>'
        + '<div class="cdx-keys" style="margin-top:12px"><button type="button" class="cdx-key cdx-main" data-c="save">' + esc(candUI.citEditId ? TK('ui.save', 'Save') : TK('ui.add', 'Add')) + '</button><button type="button" class="cdx-key" data-c="cancel">' + esc(TK('ui.cancel', 'Cancel')) + '</button><span class="cdx-say" data-c-say></span></div></section>';
    }
    if (!sorted.length && !candUI.citAdding) {
      h += '<section class="cdx-card butter cdx-rise"><p class="cdx-note" style="margin:0">' + esc(TK('cit.empty', 'No references yet. Add the first one as you read.')) + '</p></section>';
    } else if (sorted.length) {
      h += '<div class="cdx-cits">' + sorted.map(function (c) {
        return '<section class="cdx-card cdx-cit cdx-rise" data-cid="' + esc(c.id) + '"><b class="cdx-cit-t">' + esc(c.title) + '</b><span class="cdx-cit-m">' + esc([c.author, c.year].filter(Boolean).join(' · ') + (c.source ? ' · ' + c.source : '')) + '</span>'
          + (c.note ? '<p class="cdx-note" style="margin:8px 0 0">' + esc(c.note) + '</p>' : '')
          + (c.tags && c.tags.length ? '<div class="cdx-why" style="margin:8px 0 0">' + c.tags.map(function (t) { return '<span class="cdx-tag">' + esc(t) + '</span>'; }).join('') + '</div>' : '')
          + '<div class="cdx-keys" style="margin-top:12px;gap:8px"><button type="button" class="cdx-key small" data-c="edit" data-id="' + esc(c.id) + '">✎ ' + esc(TK('ui.edit', 'Edit')) + '</button><button type="button" class="cdx-key small" data-c="del" data-id="' + esc(c.id) + '">✕ ' + esc(TK('ui.delete', 'Delete')) + '</button></div></section>';
      }).join('') + '</div>';
    }
    root.innerHTML = '<div class="cdx" id="cdx-cit">' + h + '</div>';
    if (!root.__cdx) {
      root.__cdx = 1;
      root.addEventListener('input', function (e) {
        var k = e.target.getAttribute && e.target.getAttribute('data-f'); if (!k) return;
        candUI.citDraft = candUI.citDraft || { title: '', author: '', year: '', source: '', note: '', tags: '' }; candUI.citDraft[k] = e.target.value;
      });
      root.addEventListener('click', function (e) {
        var t = e.target.closest ? e.target.closest('[data-c]') : null; if (!t || !root.contains(t)) return;
        var a = t.getAttribute('data-c'), id = t.getAttribute('data-id');
        if (a === 'fontes') { try { openExt('fontes'); } catch (x) {} return; }
        if (a === 'add') { candUI.citAdding = true; candUI.citEditId = null; candUI.citDraft = { title: '', author: '', year: '', source: '', note: '', tags: '' }; renderCitationsView(); setTimeout(function () { var i = root.querySelector('[data-f="title"]'); if (i) i.focus(); }, 40); return; }
        if (a === 'cancel') { candUI.citAdding = false; candUI.citEditId = null; candUI.citDraft = null; renderCitationsView(); return; }
        if (a === 'save') {
          var d = candUI.citDraft || {};
          if (!d.title || !String(d.title).trim()) { var s = root.querySelector('[data-c-say]'); if (s) s.textContent = T('A title is needed.', 'Il faut un titre.'); var ti = root.querySelector('[data-f="title"]'); if (ti) ti.focus(); return; }
          var tg = d.tags ? String(d.tags).split(',').map(function (x) { return x.trim(); }).filter(Boolean) : [];
          if (candUI.citEditId) state.citations = state.citations.map(function (c) { return c.id === candUI.citEditId ? Object.assign({}, c, { title: d.title, author: d.author, year: d.year, source: d.source, note: d.note, tags: tg }) : c; });
          else state.citations = (state.citations || []).concat([{ id: 'cit-' + Date.now(), title: d.title, author: d.author, year: d.year, source: d.source, note: d.note, tags: tg }]);
          candUI.citAdding = false; candUI.citEditId = null; candUI.citDraft = null; save(); renderCitationsView(); return;
        }
        if (a === 'edit') { var c = (state.citations || []).filter(function (x) { return x.id === id; })[0]; if (!c) return; candUI.citAdding = true; candUI.citEditId = c.id; candUI.citDraft = { title: c.title, author: c.author, year: c.year, source: c.source, note: c.note, tags: (c.tags || []).join(', ') }; renderCitationsView(); try { root.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (x) {} return; }
        if (a === 'del') {
          var card = t.closest('.cdx-card'), go = function () { state.citations = (state.citations || []).filter(function (x) { return x.id !== id; }); save(); renderCitationsView(); };
          if (card && !(D.body.getAttribute('data-motion') === 'minimal')) { card.classList.add('cdx-leave'); setTimeout(go, 190); } else go();
        }
      });
    }
    var w = root.querySelector('#cdx-cit'); stagger(w); settle(w);
    return true;
  }
  W.renderCitationsView = function () {
    if (demo()) return O.cit.apply(this, arguments);
    try { if (citView() !== false) return; } catch (e) { warn('Citations', e); }
    return O.cit.apply(this, arguments);
  };

  // the tab open now is drawn again in the new design
  try { if (typeof candUI !== 'undefined' && D.getElementById('section-applications') && !D.getElementById('section-applications').classList.contains('hidden') && candUI.tab !== 'overview') renderCandidature(); } catch (e) {}
})();
