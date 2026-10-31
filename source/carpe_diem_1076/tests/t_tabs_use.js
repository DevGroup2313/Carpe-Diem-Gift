// t_tabs_use.js URL: Candidatus's Applications, Proposal, Milestones and Citations, redesigned in 1076, used as a person
// uses them; every function each tab had is tried (buckets, a programme opened and its status, deadline, checklist and
// move to review, a new programme, removing one; a section opened and a part ticked, a mark recorded, the workshop; a
// milestone done and its date set, the proposal's target following; funding and visa ticks; a reference added, edited and
// deleted), and every key is checked to be raised (no flat key). Exit code 1 on any failure or page error.
const { chromium } = require('playwright');
const URL_ = process.argv[2];
let fails = 0;
function ok(c, what, extra) { console.log((c ? 'ok   ' : 'FAIL ') + what + (extra !== undefined ? '  ' + JSON.stringify(extra) : '')); if (!c) fails++; }
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 950 }, colorScheme: 'light' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('page: ' + e.message.slice(0, 240)));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/sw\.js|favicon|Failed to load resource|bad HTTP response/.test(t)) errs.push('console: ' + t.slice(0, 240)); if (/^(Applications|Proposal|Milestones|Citations)/.test(t)) errs.push('fallback: ' + t.slice(0, 240)); });
  p.on('dialog', d => d.accept());
  const ev = (f, a) => p.evaluate(f, a);
  const tab = async (t) => { await ev((t) => { showSection('applications'); candUI.tab = t; renderCandidature(); }, t); await p.waitForTimeout(600); };
  // no flat key: every visible button in the tab stands raised (a shadow with an edge below it)
  const flat = (sel) => ev((sel) => [...document.querySelectorAll(sel + ' button')].filter(b => b.offsetParent && b.getBoundingClientRect().width > 4).filter(b => {
    const c = getComputedStyle(b), sh = c.boxShadow;
    if (b.matches('.cdx-sec-head,.cdx-step,.cdx-stop,.cdx-prog-head') || b.closest('.cdx-step')) return false; // rows whose own key is raised inside them
    if (b.matches('.cdx-step') && !b.querySelector('span')) return true;
    if (b.matches('.tabula-btn,.fontes-btn,.cd-prop-title')) return false; // the app's own raised keys
    return !sh || sh === 'none';
  }).map(b => (b.className || b.tagName) + ': ' + (b.textContent || '').trim().slice(0, 30)), sel);

  await p.goto(URL_, { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(3500);
  await ev(() => { try { if (typeof cdCloseDoor === 'function') cdCloseDoor(); } catch (e) {} state.themeAuto = false; state.theme = 'light'; saveState(); applyTheme(); if (state.lang !== 'en') setLang('en'); });
  await p.waitForTimeout(700);

  // ---- Applications
  await tab('applications');
  ok(await ev(() => !!document.getElementById('cdx-apps-head') && document.querySelectorAll('.cdx-tile').length === 3 && document.querySelectorAll('.cdx-prog').length > 0), 'Applications: the new head, three bucket tiles and the programme cards');
  ok((await flat('#cand-applications')).length === 0, 'Applications: no flat key', await flat('#cand-applications'));
  const pid = await ev(() => document.querySelector('.cdx-prog').getAttribute('data-prog'));
  await p.click('.cdx-prog[data-prog="' + pid + '"] .cdx-prog-head'); await p.waitForTimeout(500);
  ok(await ev((pid) => state.openProgram === pid && !!document.querySelector('.cdx-prog.open .cdx-body select'), pid), 'a programme opens, with the app\'s own detail inside');
  ok((await flat('#cand-applications')).length === 0, 'Applications opened: no flat key', await flat('#cand-applications'));
  await p.selectOption('.cdx-prog.open .cdx-body select', { index: 1 }); await p.waitForTimeout(200);
  ok(await ev((pid) => state.programs.find(x => x.id === pid).status === document.querySelector('.cdx-prog.open .cdx-body select').value, pid), 'its status is changed');
  await p.fill('.cdx-prog.open .cdx-body input[type=date] >> nth=0', '2026-12-01'); await p.dispatchEvent('.cdx-prog.open .cdx-body input[type=date] >> nth=0', 'change'); await p.waitForTimeout(500);
  ok(await ev((pid) => state.programs.find(x => x.id === pid).deadline === '2026-12-01' && /deadline/.test(document.querySelector('.cdx-prog.open .cdx-chips') ? document.querySelector('.cdx-prog.open .cdx-chips').textContent : ''), pid), 'its deadline is set, and shows on the card');
  await p.click('.cdx-prog.open .cdx-body .task-row >> nth=0'); await p.waitForTimeout(500);
  ok(await ev((pid) => (state.checklists[pid] || []).length === 1 && /1\//.test(document.querySelector('.cdx-prog.open .cdx-mini em').textContent), pid), 'a checklist step is ticked, and the card counts it');
  await p.click('.cdx-prog.open .cdx-body .btn-primary'); await p.waitForTimeout(600);
  ok(await ev((pid) => state.programs.find(x => x.id === pid).bucket === 'review', pid), 'Mark submitted moves it to review');
  await p.click('.cdx-tile[data-bucket="review"]'); await p.waitForTimeout(500);
  ok(await ev((pid) => activeBucket === 'review' && document.querySelector('.cdx-tile[data-bucket="review"]').getAttribute('aria-pressed') === 'true' && !!document.querySelector('.cdx-prog[data-prog="' + pid + '"]'), pid), 'the In review tile shows it, pressed in');
  await p.click('.cdx-tile[data-bucket="active"]'); await p.waitForTimeout(400);
  const n0 = await ev(() => state.programs.length);
  await p.click('#cdx-apps-head [data-a="add"]'); await p.waitForTimeout(300);
  await p.fill('#apps-add-name', 'MPhil in Medieval History'); await p.fill('#apps-add-uni', 'University of Cambridge');
  await p.click('#apps-add-confirm'); await p.waitForTimeout(600);
  ok(await ev((n0) => state.programs.length === n0 + 1 && [...document.querySelectorAll('.cdx-prog-name')].some(x => /Medieval/.test(x.textContent)), n0), 'a new programme is added with the form', await ev(() => state.programs.length));
  const nid = await ev(() => state.programs.find(x => /Medieval/.test(x.name)).id);
  await p.click('.cdx-prog[data-prog="' + nid + '"] [data-del]'); await p.waitForTimeout(500);
  ok(await ev((nid) => !state.programs.some(x => x.id === nid), nid), '✕ removes a programme, after asking');

  // ---- Proposal
  await tab('proposal');
  ok(await ev(() => !!document.getElementById('cdx-prop') && !!document.querySelector('#cdx-prop .cdx-titlekey') && document.querySelectorAll('.cdx-sec').length >= 8), 'Proposal: the new cards, the title as a key, the sections');
  ok((await flat('#cand-proposal')).length === 0, 'Proposal: no flat key', await flat('#cand-proposal'));
  const sid = await ev(() => document.querySelectorAll('.cdx-sec')[1].getAttribute('data-sec'));
  await p.click('.cdx-sec[data-sec="' + sid + '"] .cdx-sec-head'); await p.waitForTimeout(500);
  ok(await ev((sid) => candUI.propOpen === sid && !!document.querySelector('.cdx-sec.open .cdx-body'), sid), 'a section opens, with its parts, mark and workshop inside');
  ok((await flat('#cand-proposal')).length === 0, 'Proposal opened: no flat key', await flat('#cand-proposal'));
  await p.click('.cdx-sec.open .cdx-body > button >> nth=0'); await p.waitForTimeout(500);
  ok(await ev((sid) => { const s = ensureProposalSections().find(x => x.id === sid); return s.subsections[0].done === true && /1 of/.test(document.querySelector('.cdx-sec.open .cdx-sec-head').textContent); }, sid), 'a part is ticked, and the section counts it');
  const rec = p.locator('.cdx-sec.open .cdx-body button:has-text("Record mark")');
  if (await rec.count()) {
    await rec.first().click(); await p.waitForTimeout(300);
    await p.fill('.cdx-sec.open .cdx-body input[type=number]', '68'); await p.click('.cdx-sec.open .cdx-body input[type=number] + button'); await p.waitForTimeout(500);
    ok(await ev((sid) => (ensureProposalSections().find(x => x.id === sid).marks || []).some(m => m.score === 68) && /mark 68/.test(document.querySelector('.cdx-sec.open .cdx-sec-head').textContent), sid), 'a mark is recorded, and the section shows it');
  } else ok(false, 'Record mark key');
  await p.click('.cdx-sec.open .cdx-body .glass > button >> nth=0'); await p.waitForTimeout(500);
  ok(await ev(() => { const pn = document.querySelector('.cdx-sec.open .cdx-body .glass > div'); return pn && parseInt(pn.style.maxHeight, 10) > 0; }), 'the workshop opens');
  await p.click('#cdx-prop .cdx-titlekey'); await p.waitForTimeout(500);
  ok(await ev(() => !!document.querySelector('.cd-prop-details')), 'the title key opens the proposal\'s details');
  await ev(() => { try { closeModal(); } catch (e) {} });

  // ---- Milestones
  await tab('milestones');
  ok(await ev(() => !!document.getElementById('cdx-ms') && document.querySelectorAll('.cdx-ms').length >= 4), 'Milestones: the road of dated milestones');
  ok((await flat('#cand-milestones')).length === 0, 'Milestones: no flat key', await flat('#cand-milestones'));
  const mid = await ev(() => state.candidature.milestones[1].id);
  await p.click('[data-ms-done="' + mid + '"]'); await p.waitForTimeout(400);
  ok(await ev((mid) => state.candidature.milestones.find(m => m.id === mid).done === true && document.querySelector('[data-ms-done="' + mid + '"]').textContent === '✓', mid), 'a milestone is marked done');
  await p.click('[data-ms-date="' + mid + '"]'); await p.waitForTimeout(300);
  await p.fill('[data-ms-date-in="' + mid + '"]', '2026-11-20'); await p.waitForTimeout(500);
  ok(await ev((mid) => state.candidature.milestones.find(m => m.id === mid).date === '2026-11-20' && /20/.test(document.querySelector('[data-ms-date="' + mid + '"]').textContent), mid), 'its date is set with the date key');
  await p.click('[data-ms-date="ms-proposal"]'); await p.waitForTimeout(300);
  await p.fill('[data-ms-date-in="ms-proposal"]', '2026-12-15'); await p.waitForTimeout(500);
  ok(await ev(() => state.proposalTarget === '2026-12-15'), 'the proposal\'s milestone date sets the proposal\'s target, as before', await ev(() => state.proposalTarget));
  await p.click('[data-ck="funding:0"]'); await p.click('[data-ck="visa:1"]'); await p.waitForTimeout(500);
  ok(await ev(() => state.candidature.funding[0].done === true && state.candidature.visa[1].done === true), 'funding and visa steps are ticked');

  // ---- Citations
  await tab('citations');
  ok(await ev(() => !!document.getElementById('cdx-cit')), 'Citations: the new page');
  ok((await flat('#cand-citations')).length === 0, 'Citations: no flat key', await flat('#cand-citations'));
  await p.click('#cdx-cit [data-c="add"]'); await p.waitForTimeout(400);
  await p.click('#cdx-cit [data-c="save"]'); await p.waitForTimeout(200);
  ok(await ev(() => /title/i.test(document.querySelector('[data-c-say]').textContent)), 'a reference needs a title');
  await p.fill('[data-f="title"]', 'The Peloponnesian War'); await p.fill('[data-f="author"]', 'Thucydides'); await p.fill('[data-f="year"]', '1972'); await p.fill('[data-f="tags"]', 'history, method'); await p.fill('[data-f="note"]', 'The Melian Dialogue, book V.');
  await p.click('#cdx-cit [data-c="save"]'); await p.waitForTimeout(500);
  ok(await ev(() => (state.citations || []).some(c => c.title === 'The Peloponnesian War' && c.tags.length === 2) && document.querySelectorAll('.cdx-cit').length === 1), 'a reference is added, with its tags and note');
  await p.click('.cdx-cit [data-c="edit"]'); await p.waitForTimeout(400);
  await p.fill('[data-f="year"]', '1954'); await p.click('#cdx-cit [data-c="save"]'); await p.waitForTimeout(500);
  ok(await ev(() => state.citations.find(c => c.title === 'The Peloponnesian War').year === '1954' && /1954/.test(document.querySelector('.cdx-cit-m').textContent)), 'it is edited');
  await p.click('.cdx-cit [data-c="del"]'); await p.waitForTimeout(500);
  ok(await ev(() => !(state.citations || []).length && !document.querySelector('.cdx-cit')), 'it is deleted');

  // ---- French, and back
  await ev(() => setLang('fr')); await p.waitForTimeout(700);
  await tab('applications');
  const frA = await ev(() => document.getElementById('cdx-apps-head').textContent);
  ok(/Candidatures/.test(frA) && /Ajouter un programme/.test(frA), 'Applications in French', frA.slice(0, 80));
  await tab('milestones');
  ok(/jalon/.test(await ev(() => document.getElementById('cdx-ms').textContent)), 'Milestones in French');
  await ev(() => setLang('en')); await p.waitForTimeout(500);

  ok(errs.length === 0, 'no page errors', errs);
  console.log(fails ? fails + ' FAILED' : 'all passed');
  await b.close();
  process.exit(fails ? 1 : 0);
})();
