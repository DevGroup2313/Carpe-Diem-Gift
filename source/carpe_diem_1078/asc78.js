// 1078 · Ascensus in the design the owner approved (31 October 2026).
// The gold title, its words, the Glossary and Tabula keys and the rank's medal are the app's own, taken from its own
// drawing of the page; the rank becomes a butter card; the tabs are the Forge's; Today has the fire as a switch (the
// chosen key pressed in), the labours as raised rows with their boxes, Tips and Swap, and Doctorate mode as a sage card;
// the Examen, the Courses (a card each, with its ring) and the Record follow the same look. Every action is the app's
// own (ascSetEnergy, ascToggleQuest, ascSwapQuest, ascGo, renderAscent); the cards keep the names the tour points at
// (asc-labours, asc-examen, asc-courses, asc-tabula-btn). Should anything fail, the app draws its own page.
(function () {
  'use strict';
  if (window.__cdAsc1078) return;
  window.__cdAsc1078 = 1;
  var W = window, D = document;
  var ORIG = W.ascHome;
  if (typeof ORIG !== 'function') return;

  function FR() { try { return typeof ascFR === 'function' ? !!ascFR() : state.lang === 'fr'; } catch (e) { return false; } }
  function T(en, f) { try { return typeof ascT === 'function' ? ascT(en, f) : (FR() ? f : en); } catch (e) { return en; } }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ring(f, c) { try { return W.__cdxRing(f, c || 'var(--cx-gold)'); } catch (e) { return ''; } }
  function mark(name) { try { return (typeof ASC_MK !== 'undefined' && ASC_MK[name]) || ''; } catch (e) { return ''; } }
  function el(tag, cls, html) { var e = D.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function key(label, cls) { var b = el('button', 'cdx-key small' + (cls ? ' ' + cls : '')); b.type = 'button'; b.innerHTML = label; return b; }

  function tabBar(tab) {
    var tabs = [['today', T('Today', 'Aujourd\'hui')], ['examen', T('Examen', 'Examen')], ['courses', T('Courses', 'Cours')], ['record', T('Record', 'Registre')]];
    var p = el('div', 'cdt-pill'); p.setAttribute('role', 'tablist'); p.setAttribute('aria-label', 'Ascensus');
    tabs.forEach(function (t) {
      var b = el('button', 'cdt-tab'); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(tab === t[0])); b.textContent = t[1];
      b.addEventListener('click', function () { if (typeof ascView !== 'undefined') ascView.tab = t[0]; renderAscent(); });
      p.appendChild(b);
    });
    var row = el('div', 'cdz-top'); row.appendChild(p); return row;
  }

  // the rank, from the app's own card: its medal, name, gloss, xp, bar and lines
  function rankCard(src) {
    var hc = src.querySelector('.asc-medallion'); hc = hc && hc.closest('.glass');
    var c = el('section', 'cdx-card butter cdx-rise');
    if (!hc) return null;
    var top = hc.firstElementChild, parts = top ? [].slice.call(top.children) : [];
    var medal = hc.querySelector('.asc-medallion');
    var name = parts[1] ? parts[1].textContent : '', gloss = parts[2] ? parts[2].textContent : '', xp = parts[3] ? parts[3].textContent : '';
    var fill = hc.querySelector('.asc-bar-fill'), pct = fill ? parseFloat(fill.style.width) || 0 : 0;
    var rest = [].slice.call(hc.children).slice(2).map(function (n) { return n.textContent; }).filter(Boolean);
    var row = el('div', 'cdz-rank'); var md = el('span', 'medal'); if (medal) md.appendChild(medal); row.appendChild(md);
    var g = el('div', 'grow');
    g.appendChild(el('h3', null, esc(name) + (gloss ? '<small>' + esc(gloss) + '</small>' : '')));
    var b = el('div', 'cdx-bar'); var i = D.createElement('i'); i.style.width = pct + '%'; if (fill && fill.classList.contains('asc-celebrate')) i.className = 'asc-bar-fill asc-celebrate'; b.appendChild(i); g.appendChild(b);
    if (rest[0]) g.appendChild(el('p', 'cdx-cap', esc(rest[0])));
    if (rest[1]) g.appendChild(el('p', 'cdz-motto', esc(rest[1])));
    row.appendChild(g); row.appendChild(el('span', 'xp', esc(xp)));
    c.appendChild(row);
    return c;
  }

  function today(cdx, src) {
    var q = ascEnsureToday();
    var NOTE = { low: T('A low ember: the labours are drawn smaller and gentler. Three small ones are a victory, not a compromise.', 'Une braise basse : les labeurs sont tirés plus petits et plus doux. Trois petits sont une victoire, pas un compromis.'),
      steady: T('A steady flame: labours drawn for an ordinary working day.', 'Une flamme régulière : des labeurs tirés pour une journée de travail ordinaire.'),
      bright: T('A bright fire: labours drawn for a day with energy to spare.', 'Un feu vif : des labeurs tirés pour une journée où l’énergie déborde.') };
    var fire = el('section', 'cdx-card cdx-rise');
    fire.appendChild(el('p', 'cdx-kick', esc(T('How is the fire today?', 'Comment est le feu aujourd’hui ?'))));
    var seg = el('div', 'cdx-seg cdz-seg'); seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', T('How is the fire today?', 'Comment est le feu aujourd’hui ?'));
    [['low', T('Low ember', 'Braise basse'), 11], ['steady', T('Steady flame', 'Flamme régulière'), 14], ['bright', T('Bright fire', 'Feu vif'), 18]].forEach(function (p) {
      var b = el('button', null, '<span class="fl" style="font-size:' + p[2] + 'px' + (p[0] === 'low' ? ';opacity:.6' : '') + '">🔥</span>' + esc(p[1]));
      b.type = 'button'; b.setAttribute('aria-pressed', String((q.energy || 'steady') === p[0])); b.setAttribute('data-energy', p[0]);
      b.addEventListener('click', function () { ascSetEnergy(p[0]); });
      seg.appendChild(b);
    });
    fire.appendChild(seg);
    fire.appendChild(el('p', 'cdx-note', esc(NOTE[q.energy || 'steady'] || NOTE.steady))).style.margin = '0';
    cdx.appendChild(fire);

    var lab = el('section', 'cdx-card cdx-rise'); lab.id = 'asc-labours';
    var doneN = q.picks.filter(function (id) { return q.done[id]; }).length, small = Math.min(3, q.picks.length);
    var head = el('div', 'cdz-head');
    var hg = el('div', 'grow');
    hg.appendChild(el('p', 'cdx-kick', mark('labours') + ' ' + esc(T('Today\'s Labours', 'Les labeurs du jour'))));
    hg.appendChild(el('p', 'cdx-note', esc(T('Three small labours and one stretch, drawn fresh each day. The minimum is honourable. Swap anything freely.', 'Trois petits labeurs et un défi, tirés au sort chaque jour. Le minimum est honorable. Échangez ce que vous voulez.'))));
    head.appendChild(hg);
    var smallDone = q.picks.slice(0, 3).filter(function (id) { return q.done[id]; }).length;
    head.appendChild(el('div', 'cdx-ring', ring(small ? smallDone / small : 0) + '<div><b>' + smallDone + T(' of ', ' sur ') + small + '</b><span>' + esc(T('and the stretch', 'et le défi')) + '</span></div>'));
    lab.appendChild(head);
    q.picks.forEach(function (id, idx) {
      var qq = ascQuestById(id); if (!qq) return;
      var done = !!q.done[id], stretch = idx === 3;
      var row = el('div', 'cdz-lab' + (done ? ' done' : '') + (stretch ? ' stretch' : ''));
      var box = el('button', 'cdx-box' + (done ? ' on' : ''), '✓'); box.type = 'button';
      box.setAttribute('aria-pressed', String(done)); box.setAttribute('aria-label', (done ? T('Not done yet: ', 'Pas encore fait : ') : T('Done: ', 'Fait : ')) + qq.t);
      box.addEventListener('click', function () { ascToggleQuest(id); });
      row.appendChild(box);
      var t = el('div', 't');
      t.appendChild(el('b', null, (stretch ? '⭐ ' : '') + esc(qq.t)));
      var tags = el('div', 'tags');
      tags.appendChild(el('span', 'cdx-tag', esc(T('about ', 'environ ') + qq.m + ' min')));
      tags.appendChild(el('span', 'cdx-tag', esc(qq.xp + ' xp')));
      if (stretch) tags.appendChild(el('span', 'cdx-tag', esc(T('the stretch, entirely optional', 'le défi, entièrement facultatif'))));
      t.appendChild(tags);
      var acts = el('div', 'acts');
      if (qq.tip && typeof W.cdTipFold === 'function') {
        // the app's own Tips: its line opens under the labour's words
        var tf = W.cdTipFold(qq.tip, '0'), tb = tf.querySelector('.cd-tip-btn'), tl = tf.querySelector('.cd-tip-line');
        if (tb) { tb.classList.add('cdx-key', 'chip'); acts.appendChild(tb); }
        if (tl) t.appendChild(tl);
      }
      if (!done) { var sw = key('↻', 'cdz-swap'); sw.title = T('Swap this labour for another', 'Échanger ce labeur contre un autre'); sw.setAttribute('aria-label', sw.title); sw.addEventListener('click', function () { ascSwapQuest(idx); }); acts.appendChild(sw); }
      row.appendChild(t); row.appendChild(acts);
      lab.appendChild(row);
    });
    lab.appendChild(el('p', 'cdx-cap', esc(doneN === 0 ? T('Nothing done yet, and nothing owed yet either.', 'Rien de fait pour l’instant, et rien de dû non plus.')
      : (doneN < q.picks.length ? doneN + T(' down. Any one of these was already a real day.', ' de faits. Chacun comptait déjà pour une vraie journée.') : T('All labours done. Close the ledger with a clear conscience.', 'Tous les labeurs faits. Fermez le registre la conscience tranquille.')))));
    cdx.appendChild(lab);
    // Doctorate mode, the app's own card, as a sage card (in English, as the app offers it)
    var hard = src.querySelector('#asc-doctorate') || [].slice.call(src.children).filter(function (c) { return /Doctorate mode/.test((c.firstElementChild || {}).textContent || ''); })[0];
    if (hard) { hard.id = 'asc-doctorate'; hard.classList.add('cdx-rise'); cdx.appendChild(hard); }
  }

  function examen(cdx) {
    var a = ascSt(), ex = a.examen || {};
    var c = el('section', 'cdx-card sky cdx-rise'); c.id = 'asc-examen';
    c.appendChild(el('p', 'cdx-kick', mark('examen') + ' ' + esc(T('The Examen', 'L’Examen'))));
    c.appendChild(el('p', 'cdx-note', esc(ex.done ? T('Last weighed on ', 'Dernière pesée le ') + (ex.profile && ex.profile.when ? ex.profile.when : ex.when) + T('. Retake it whenever you feel the ground has shifted; the system reads the newest weighing.', '. Reprenez-le dès que le sol vous semble avoir bougé ; le système lit la pesée la plus récente.')
      : T('Rooms of questions across the craft: grammar, sentences, structure, argument, conventions, reading, research design, qualitative craft, process, and the feelings underneath. It finds where the work should start. There is no failing it; there is only finding out.', 'Des salles de questions à travers tout le métier : grammaire, phrases, structure, argument, conventions, lecture, conception de la recherche, savoir-faire qualitatif, organisation, et les émotions dessous. L’Examen trouve où le travail doit commencer. On ne peut pas y échouer ; on ne fait que se situer.'))));
    var ks = el('div', 'cdx-keys');
    var go = key(esc(ex.done ? T('Retake the Examen', 'Refaire l’Examen') : T('Begin the Examen', 'Commencer l’Examen')), 'cdx-main');
    go.classList.remove('small');
    go.addEventListener('click', function () { ascSt().examen.answers = {}; ascGo('examen'); });
    ks.appendChild(go);
    if (ex.done && ex.profile) { var pf = key(esc(T('See my profile', 'Voir mon profil'))); pf.addEventListener('click', function () { ascGo('profile'); }); ks.appendChild(pf); }
    c.appendChild(ks);
    cdx.appendChild(c);
  }

  function courses(cdx) {
    var a = ascSt();
    var q0 = (typeof W.__cdAscCourseFind === 'string') ? W.__cdAscCourseFind : '';
    var find = el('div', 'cdz-find');
    var inp = el('input', 'cdx-field cd-find-in'); inp.type = 'search'; inp.value = q0;
    inp.placeholder = T('Search the courses…', 'Chercher dans les cours…'); inp.setAttribute('aria-label', T('Search the courses', 'Chercher dans les cours'));
    var cnt = el('span'); find.appendChild(inp); find.appendChild(cnt);
    cdx.appendChild(find);
    var c = el('section', 'cdx-card cdx-rise'); c.id = 'asc-courses';
    c.appendChild(el('p', 'cdx-kick', mark('courses') + ' ' + esc(T('The Courses', 'Les cours'))));
    var grid = el('div', 'cdz-courses');
    ascCoursesList().forEach(function (co) {
      var open = co.status === 'open', loc = ascLoc(co, 'courses', co.id);
      var readN = open ? co.lessons.filter(function (l) { return a.lessons['read:' + co.id + ':' + l.id]; }).length : 0, n = open ? co.lessons.length : 0;
      var nm = String(loc.name || ''), cut = nm.indexOf(' · '), head = cut > 0 ? nm.slice(0, cut) : nm, sub = cut > 0 ? nm.slice(cut + 3) : '';
      var icon = (typeof ASC_CMK !== 'undefined' && ASC_CMK[co.id]) ? ASC_CMK[co.id] : esc(co.icon || '');
      var b = el('button', 'cdz-course'); b.type = 'button'; if (!open) b.disabled = true;
      b.innerHTML = '<span class="cdz-badge" aria-hidden="true">' + icon + '</span><span class="grow"><p class="cdx-kick">' + esc(loc.tag || '') + '</p><b>' + esc(head) + '</b>'
        + (sub ? '<span class="s">' + esc(sub) + '</span>' : '')
        + '<span class="s">' + esc(open ? readN + T(' of ', ' sur ') + n + T(' lessons read', ' leçons lues') : T('in preparation, honestly not built yet', 'en préparation, pas encore construit')) + '</span></span>'
        + (open ? '<span class="cdx-ring" style="gap:0">' + ring(n ? readN / n : 0) + '</span>' : '');
      if (open) b.addEventListener('click', function () { ascGo('course', co.id); });
      grid.appendChild(b);
    });
    c.appendChild(grid);
    cdx.appendChild(c);
    var apply = function (q) {
      q = (q || '').trim().toLowerCase(); W.__cdAscCourseFind = q;
      var shown = 0;
      [].forEach.call(grid.children, function (k) { var hit = !q || (k.textContent || '').toLowerCase().indexOf(q) >= 0; k.style.display = hit ? '' : 'none'; if (hit) shown++; });
      cnt.textContent = !q ? '' : (shown ? (shown + T(shown === 1 ? ' course' : ' courses', ' cours')) : T('no course of that name', 'aucun cours de ce nom'));
    };
    var t2 = null;
    inp.addEventListener('input', function () { if (t2) clearTimeout(t2); var v = inp.value; t2 = setTimeout(function () { apply(v); }, 120); });
    if (q0) apply(q0);
  }

  function record(cdx) {
    var a = ascSt();
    var c = el('section', 'cdx-card cdx-rise');
    if (!a.log || !a.log.length) {
      c.appendChild(el('p', 'cdx-note', esc(T('No entries yet. Do a labour or read a lesson, and the record starts to fill.', 'Aucune entrée pour l’instant. Faites un labeur ou lisez une leçon, et le registre commence à se remplir.')))).style.margin = '0';
      cdx.appendChild(c); return;
    }
    var mk = (typeof ASC_RECORD_MK !== 'undefined') ? ASC_RECORD_MK : '';
    c.appendChild(el('p', 'cdx-kick', mk + ' ' + esc(T('The Record', 'Le registre'))));
    var q0 = (typeof W.__cdAscRecFind === 'string') ? W.__cdAscRecFind : '';
    var find = el('div', 'cdz-find'); var inp = el('input', 'cdx-field cd-find-in'); inp.type = 'search'; inp.value = q0;
    inp.placeholder = T('Search the record…', 'Chercher dans le registre…'); inp.setAttribute('aria-label', T('Search the record', 'Chercher dans le registre'));
    var cnt = el('span'); find.appendChild(inp); find.appendChild(cnt); c.appendChild(find);
    var ul = el('ul', 'cdz-log'), rows = [];
    a.log.forEach(function (e) { var li = el('li', null, '<b>+' + esc(e.n) + '</b><span>' + esc(e.why) + '</span>'); rows.push(li); ul.appendChild(li); });
    c.appendChild(ul);
    var apply = function (q) {
      q = (q || '').trim().toLowerCase(); W.__cdAscRecFind = q;
      var shown = 0;
      rows.forEach(function (r, i) { var hit = q ? ((r.textContent || '').toLowerCase().indexOf(q) >= 0 && shown < 40) : (i < 6); r.style.display = hit ? '' : 'none'; if (hit) shown++; });
      cnt.textContent = !q ? '' : (shown ? (shown + T(shown === 1 ? ' entry' : ' entries', shown === 1 ? ' entrée' : ' entrées')) : T('nothing of that name in the record', 'rien de ce nom au registre'));
    };
    var t2 = null;
    inp.addEventListener('input', function () { if (t2) clearTimeout(t2); var v = inp.value; t2 = setTimeout(function () { apply(v); }, 120); });
    apply(q0);
    cdx.appendChild(c);
  }

  function home(root) {
    var tab = (typeof ascView !== 'undefined' && ascView.tab) || 'today';
    var src = D.createElement('div');
    ORIG(src);                                         // the app's own page, drawn aside: its title, words, keys and medal
    var title = src.querySelector('.asc-title-wrap');
    if (!title) throw new Error('no title');
    var words = title.nextElementSibling;
    var gl = words && words.nextElementSibling;
    var tb = src.querySelector('#asc-tabula-btn');
    root.appendChild(title);
    if (words) root.appendChild(words);
    var keys = el('div', 'cdz-ascrow'); keys.style.cssText = 'display:flex;align-items:center;gap:10px;margin:0 0 14px';
    if (gl) { var gk = gl.querySelector('button'); if (gk) keys.appendChild(gk); }
    if (tb) { tb.style.marginLeft = 'auto'; keys.appendChild(tb); }
    root.appendChild(keys);
    var cdx = el('div', 'cdx cdz-asc'); cdx.id = 'cdx-asc';
    var rk = rankCard(src); if (rk) cdx.appendChild(rk);
    cdx.appendChild(tabBar(tab));
    if (tab === 'today') today(cdx, src);
    else if (tab === 'examen') examen(cdx);
    else if (tab === 'courses') courses(cdx);
    else if (tab === 'record') record(cdx);
    root.appendChild(cdx);
    var k = 0; [].forEach.call(cdx.querySelectorAll('.cdx-rise'), function (n) { n.style.animationDelay = (k++ * 0.04).toFixed(2) + 's'; });
    try { W.__cdxSettle(cdx); } catch (e) {}
  }

  W.ascHome = function (root) {
    var mark0 = root.childNodes.length;
    try { return home(root); }
    catch (e) {
      try { console.warn('Ascensus: the app draws its own page', e); } catch (x) {}
      while (root.childNodes.length > mark0) root.removeChild(root.lastChild);
      return ORIG(root);
    }
  };
  W.ascHome.__cd1078 = 1;
})();
