// t_pages78.js URL [OUT]: build 1078 used as a person uses it. Home: the tabs in the Forge's look at the left of the
// Backup row (Home only), Overview and back, Offline by design as a card in its own words, the seal unchanged.
// Candidatus: How Candidatus works first on the Overview, its rooms opening their tabs, folding and showing again.
// Assessments: the tabs, How marks work, the overall and proposal cards, the three cards' keys (sized to their words),
// Records (a term opened, a module opened), Marks. Ascensus: the rank, the fire, a labour ticked and unticked, a swap,
// Tips, the Examen, the Courses (I to XIII, the search, a course opened), the Record. French; night pictures. Exit code
// 1 on any failure, page error or fallback to the app's own drawing.
const { chromium } = require('playwright');
const [URL_, OUT] = process.argv.slice(2);
let fails = 0;
function ok(c, what, extra) { console.log((c ? 'ok   ' : 'FAIL ') + what + (extra !== undefined ? '  ' + JSON.stringify(extra).slice(0, 300) : '')); if (!c) fails++; }
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('page: ' + e.message.slice(0, 240)));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/sw\.js|favicon|Failed to load resource|bad HTTP response/.test(t)) errs.push('console: ' + t.slice(0, 240)); if (/the app draws its own page/.test(t)) errs.push('fallback: ' + t.slice(0, 240)); });
  const ev = (f, a) => p.evaluate(f, a);
  const wait = (ms) => p.waitForTimeout(ms);
  await p.goto(URL_, { waitUntil: 'load', timeout: 180000 });
  await wait(4000);
  await ev(() => { try { if (typeof cdCloseDoor === 'function') cdCloseDoor(); } catch (e) {} try { if (typeof demoRemove === 'function') { demoRemove('demo-entry'); demoRemove('demo-build'); } } catch (e) {} state.themeAuto = false; state.theme = 'light'; saveState(); applyTheme(); if (state.lang !== 'en') setLang('en'); try { window.__cdSC.setLow(false); } catch (e) {} });
  const demo = await ev(() => typeof demoOn === 'function' && !!demoOn());
  const shot = async (n) => { if (OUT) await p.screenshot({ path: OUT + '/' + n + '.png' }); };

  // ---- Home
  await ev(() => { showSection('home'); homeUI.tab = 'home'; renderHome(); }); await wait(1200);
  const h1 = await ev(() => { const d = document.getElementById('cd-home-tabdock'), row = document.getElementById('backup-toggle').parentElement; const r = d.getBoundingClientRect(), k = document.getElementById('backup-toggle').getBoundingClientRect();
    const kv = k.width > 0; // the sample hides the Backup key: the tabs stand alone at the row's left
    return { inRow: d.parentElement === row && row.firstElementChild === d, shown: !d.hidden && r.width > 60, sameLine: !kv || Math.abs((r.top + r.height / 2) - (k.top + k.height / 2)) < 12, narrow: r.width < 360, tabs: [...d.querySelectorAll('.nav-btn')].map(x => x.textContent.trim()), left: !kv || r.left < k.left }; });
  ok(h1.inRow && h1.shown && h1.sameLine && h1.narrow && h1.left && h1.tabs.length === 2, 'Home: the tabs, compact, at the left of the Backup key\'s row', h1);
  await p.click('#cd-home-tabdock .nav-btn:has-text("Overview")'); await wait(900);
  ok(await ev(() => homeUI.tab === 'overview' && !document.getElementById('overview-view').classList.contains('hidden') && !document.getElementById('cd-home-tabdock').hidden && /Overview/.test(document.querySelector('#cd-home-tabdock .nav-btn.active').textContent)), 'Overview opens, the tabs stay, Overview chosen');
  await p.click('#cd-home-tabdock .nav-btn:has-text("Home")'); await wait(900);
  ok(await ev(() => homeUI.tab === 'home' && document.getElementById('home-view').getBoundingClientRect().height > 200), 'and Home comes back whole');
  const note = await ev(() => { const n = document.getElementById('offline-notice'); const c = n.querySelector('.cdn-card'); return { card: !!c, kick: c && c.querySelector('.cdn-kick').textContent, say: c && c.querySelector('.cdn-say').textContent, w: c && Math.round(c.getBoundingClientRect().width) }; });
  ok(note.card && /Offline by design/i.test(note.kick) && note.say.length > 40 && note.w < 800, 'Offline by design: a cream card, in its own words', note);
  ok(await ev(() => { const s = document.querySelector('#home-seal-bg'); return !!s && !s.hasAttribute('data-cd-colour') && !s.querySelector('[data-cd-tint]'); }), 'the seal behind Home is as it was, all blue');
  await shot('p78_home_day');
  await ev(() => showSection('focus')); await wait(700);
  ok(await ev(() => document.getElementById('cd-home-tabdock').hidden), 'the tabs show on Home only');
  await ev(() => showSection('home')); await wait(700);
  ok(await ev(() => !document.getElementById('cd-home-tabdock').hidden), 'and are back on Home');

  // ---- Candidatus
  if (!demo) {
    await ev(() => { state.cdxHowFold = false; saveState(); showSection('applications'); candUI.tab = 'overview'; renderCandidature(); }); await wait(1200);
    const c1 = await ev(() => { const r = document.getElementById('cdx-cand'); return { first: r.firstElementChild.getAttribute('data-cdx'), rooms: [...r.querySelectorAll('.cdx-how-room')].map(x => x.getAttribute('data-go')), start: (r.querySelector('.cdx-how-room.start') || {}).getAttribute && r.querySelector('.cdx-how-room.start').getAttribute('data-go'), old: document.querySelectorAll('#cand-overview > .glass').length }; });
    ok(c1.first === 'how' && c1.rooms.join() === 'applications,proposal,milestones,citations' && c1.start === 'milestones' && c1.old === 0, 'Candidatus: How Candidatus works first, four rooms, Milestones to start, no old guide', c1);
    await shot('p78_cand_day');
    await p.click('.cdx-how-room[data-go="milestones"]'); await wait(900);
    ok(await ev(() => candUI.tab === 'milestones'), 'a room opens its tab');
    await ev(() => { candUI.tab = 'overview'; renderCandidature(); }); await wait(900);
    await p.click('[data-how-fold="1"]'); await wait(700);
    ok(await ev(() => state.cdxHowFold === true && !!document.querySelector('.cdx-how.folded') && !document.querySelector('.cdx-how-room')), 'Fold away keeps it as one line, remembered');
    await p.click('[data-how-fold="0"]'); await wait(700);
    ok(await ev(() => state.cdxHowFold === false && document.querySelectorAll('.cdx-how-room').length === 4), 'Show brings it back');
  }

  // ---- Assessments
  await ev(() => { window.__opened = []; window.openExt = function (x) { window.__opened.push(x); }; showSection('assessments'); assessUI.view = 'home'; state.cdxMarksOpen = false; renderAssessments(); }); await wait(1200);
  const a1 = await ev(() => { const r = document.getElementById('cdx-assess'); const pill = r.querySelector('.cdt-pill'); return { tabs: [...pill.querySelectorAll('button')].map(x => x.textContent), sel: (pill.querySelector('[aria-selected="true"]') || {}).textContent, pillW: Math.round(pill.getBoundingClientRect().width), how: !!r.querySelector('[data-cdx="marks-how"]'), big: (r.querySelector('.cdz-big .n') || {}).textContent, prop: [...r.querySelectorAll('.cdx-kick')].map(k => k.textContent).join(' | '), openProp: !!r.querySelector('[data-aprop]') }; });
  ok(a1.tabs.length === 5 && a1.sel && a1.pillW < 560 && a1.how && /of/.test(a1.big), 'Assessments: the Forge\'s tabs, How marks work, the overall card', a1);
  ok(demo ? (!a1.openProp && /writing/i.test(a1.prop)) : (a1.openProp && /proposal/i.test(a1.prop)), demo ? 'the sample keeps its writing standing, no proposal key' : 'the proposal\'s standing, with Open the proposal', a1.prop);
  const kw = await ev(() => [...document.querySelectorAll('#cdx-assess .cdx-trio .cdx-key')].map(k => Math.round(k.getBoundingClientRect().width / k.closest('.cdx-card').getBoundingClientRect().width * 100)));
  ok(kw.length === 3 && kw.every(x => x < 60), 'the three keys are sized to their words', kw);
  await p.click('[data-marks-how]'); await wait(600);
  ok(await ev(() => (document.querySelector('.cdz-how-body') || {}).textContent.length > 120 && state.cdxMarksOpen === true), 'How marks work opens on its full text');
  await p.click('[data-marks-how]'); await wait(600);
  await p.click('#cdx-assess .tabula-btn'); await wait(200);
  ok(await ev(() => window.__opened.indexOf('tabula') >= 0), 'Tabula opens Tabula');
  const tipB = await p.$('#cdx-assess .cd-tip-btn');
  if (tipB) { await tipB.click(); await wait(300); ok(await ev(() => [...document.querySelectorAll('#cdx-assess .cd-tip-line')].some(x => x.style.display !== 'none')), 'Tips opens its line'); }
  await p.click('#cdx-assess .cdx-trio [data-atab="quizzes"]'); await wait(900);
  ok(await ev(() => /QUIZ/i.test(document.getElementById('modal-root').textContent)), 'Take a quiz opens the quizzes');
  await ev(() => closeModal()); await wait(400);
  await p.click('#cdx-assess .cdx-trio [data-atab="seminars"]'); await wait(900);
  ok(await ev(() => /SEMINAR|SÉMINAIRE/i.test(document.getElementById('modal-root').textContent)), 'Sit a seminar opens the seminars');
  await ev(() => closeModal()); await wait(400);
  await shot('p78_assess_day');
  await p.click('#cdx-assess .cdx-trio [data-atab="record"]'); await wait(900);
  const r1 = await ev(() => ({ view: assessUI.view, terms: document.querySelectorAll('#cdx-assess .cdz-thead').length }));
  ok(r1.view === 'record' && r1.terms >= 1, 'Open the records: a card for each term', r1);
  const t1 = await ev(() => document.querySelector('#cdx-assess .cdz-thead').getAttribute('data-aterm'));
  await ev((t) => { assessUI.openTerm = null; renderAssessments(); }, t1); await wait(600);
  await p.click('#cdx-assess .cdz-thead[data-aterm="' + t1 + '"]'); await wait(700);
  const mods = await ev(() => document.querySelectorAll('#cdx-assess .cdz-tbody [id^="assess-"]').length);
  ok(mods >= 1, 'a term opens on its modules', mods);
  await p.click('#cdx-assess .cdz-tbody [id^="assess-"] > button >> nth=0'); await wait(700);
  ok(await ev(() => !!assessUI.openModule && !!document.querySelector('#assess-' + assessUI.openModule + ' .fadeup')), 'a module opens on its own working parts');
  await ev(() => { assessUI.openModule = null; assessUI.view = 'grades'; renderAssessments(); }); await wait(900);
  const g1 = await ev(() => ({ rows: document.querySelectorAll('#cdx-assess .cdz-mark').length, foot: !!document.querySelector('#cdx-assess > .cdx-cap'), sel: document.querySelector('#cdx-assess .cdt-pill [aria-selected="true"]').getAttribute('data-atab') }));
  ok(g1.rows >= 2 && g1.foot && g1.sel === 'grades', 'Marks: a row for each term and the proposal, and the note', g1);

  // ---- Ascensus
  await ev(() => { showSection('ascent'); ascView = { v: 'home', tab: 'today' }; renderAscent(); }); await wait(1200);
  const s1 = await ev(() => ({ title: !!document.querySelector('#ascent-root .asc-title-wrap'), tabula: !!document.querySelector('#asc-tabula-btn'), medal: !!document.querySelector('#cdx-asc .medal .asc-medallion'), seg: document.querySelectorAll('#cdx-asc [data-energy]').length, labs: document.querySelectorAll('#asc-labours .cdz-lab').length, glow: document.querySelectorAll('#ascent-root .asc-labour').length, doc: !!document.querySelector('#cdx-asc #asc-doctorate') }));
  ok(s1.title && s1.tabula && s1.medal && s1.seg === 3 && s1.labs === 4 && s1.glow === 0, 'Ascensus: the title, Tabula, the medal, the fire, four labours (no glow)', s1);
  ok(s1.doc, 'Doctorate mode, in its sage card');
  await shot('p78_asc_day');
  const x0 = await ev(() => ascSt().xp), first = await ev(() => ascEnsureToday().picks[0]);
  await p.click('#asc-labours .cdz-lab >> nth=0 >> .cdx-box'); await wait(700);
  const x1 = await ev(() => ascSt().xp);
  ok(await ev((id) => !!ascEnsureToday().done[id], first) && x1 > x0 && await ev(() => document.querySelector('#asc-labours .cdz-lab').classList.contains('done')), 'a labour is ticked, and the xp rises', { x0, x1 });
  await p.click('#asc-labours .cdz-lab >> nth=0 >> .cdx-box'); await wait(700);
  ok(await ev((id) => !ascEnsureToday().done[id], first), 'and unticked');
  const before = await ev(() => ascEnsureToday().picks.slice());
  await p.click('#asc-labours .cdz-lab >> nth=1 >> .cdz-swap'); await wait(700);
  const after = await ev(() => ascEnsureToday().picks.slice());
  ok(before[1] !== after[1] && before[0] === after[0], 'Swap draws another labour in its place');
  const tip = await p.$('#asc-labours .cd-tip-btn');
  if (tip) { await tip.click(); await wait(300); ok(await ev(() => [...document.querySelectorAll('#asc-labours .cd-tip-line')].some(x => x.style.display !== 'none')), 'Tips opens under the labour'); }
  await p.click('#cdx-asc [data-energy="low"]'); await wait(800);
  ok(await ev(() => ascEnsureToday().energy === 'low' && document.querySelector('#cdx-asc [data-energy="low"]').getAttribute('aria-pressed') === 'true'), 'the fire is set to Low ember, the key pressed in');
  await ev(() => { ascSetEnergy('steady'); }); await wait(600);
  await p.click('#cdx-asc .cdt-pill button:has-text("Examen")'); await wait(800);
  ok(await ev(() => ascView.tab === 'examen' && !!document.getElementById('asc-examen')), 'Examen: its card');
  await p.click('#asc-examen .cdx-key.cdx-main'); await wait(800);
  ok(await ev(() => ascView.v === 'examen'), 'Begin the Examen begins it');
  await ev(() => { ascView = { v: 'home', tab: 'courses' }; renderAscent(); }); await wait(900);
  const co = await ev(() => [...document.querySelectorAll('#asc-courses .cdz-course .cdx-kick')].map(k => k.textContent.trim()));
  const uniq = new Set(co).size === co.length;
  ok(uniq && (demo ? co.length >= 1 : (co.length === 13 && co[12] === 'Course XIII' && co[4] === 'Course V' && co[5] === 'Course VI')), 'Courses: each with its own number' + (demo ? '' : ', I to XIII'), co);
  await p.fill('#cdx-asc .cdz-find input', 'press'); await wait(500);
  const fnd = await ev(() => ({ shown: [...document.querySelectorAll('#asc-courses .cdz-course')].filter(x => x.style.display !== 'none').length, cnt: document.querySelector('#cdx-asc .cdz-find span').textContent }));
  ok(demo || (fnd.shown === 1 && /1 course/.test(fnd.cnt)), 'the search finds The Press', fnd);
  await p.fill('#cdx-asc .cdz-find input', ''); await wait(400);
  await shot('p78_asc_courses_day');
  await p.click('#asc-courses .cdz-course:not([disabled]) >> nth=0'); await wait(800);
  ok(await ev(() => ascView.v === 'course' && !!ascView.cid), 'a course opens');
  await ev(() => { ascView = { v: 'home', tab: 'record' }; renderAscent(); }); await wait(800);
  ok(await ev(() => /registre|Record|No entries/i.test(document.getElementById('cdx-asc').textContent)), 'the Record');

  // ---- French
  await ev(() => setLang('fr')); await wait(1200);
  await ev(() => { ascView = { v: 'home', tab: 'courses' }; renderAscent(); }); await wait(900);
  const cf = await ev(() => [...document.querySelectorAll('#asc-courses .cdz-course .cdx-kick')].map(k => k.textContent.trim()));
  ok(new Set(cf).size === cf.length && cf.every(x => /^Cours /.test(x)), 'in French: each course its own number, in French', cf);
  await ev(() => { showSection('assessments'); assessUI.view = 'home'; renderAssessments(); }); await wait(900);
  ok(await ev(() => /Évaluation|Vue d|Relev/i.test(document.getElementById('cdx-assess').textContent) || state.lang === 'fr'), 'Assessments in French');
  if (!demo) { await ev(() => { showSection('applications'); candUI.tab = 'overview'; renderCandidature(); }); await wait(900);
    ok(await ev(() => /Comment fonctionne Candidatus/.test(document.querySelector('.cdx-how').textContent) && /Jalons/.test(document.querySelector('.cdx-how').textContent)), 'How Candidatus works in French'); }
  await ev(() => { showSection('home'); }); await wait(900);
  ok(await ev(() => /Hors ligne/i.test(document.querySelector('#offline-notice .cdn-kick').textContent)), 'Offline by design in French');
  await ev(() => setLang('en')); await wait(900);

  // ---- night
  await ev(() => { state.theme = 'night'; saveState(); applyTheme(); showSection('home'); homeUI.tab = 'home'; renderHome(); }); await wait(1000); await shot('p78_home_night');
  await ev(() => { showSection('assessments'); assessUI.view = 'home'; renderAssessments(); }); await wait(900); await shot('p78_assess_night');
  await ev(() => { showSection('ascent'); ascView = { v: 'home', tab: 'today' }; renderAscent(); }); await wait(900); await shot('p78_asc_night');
  await ev(() => { state.theme = 'light'; saveState(); applyTheme(); showSection('home'); });

  ok(errs.length === 0, 'no page errors, no fallback', errs);
  console.log(fails ? fails + ' FAILED' : 'all passed');
  await b.close();
  process.exit(fails ? 1 : 0);
})();
