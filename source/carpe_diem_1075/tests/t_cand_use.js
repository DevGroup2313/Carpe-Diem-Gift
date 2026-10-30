// t_cand_use.js URL: Candidatus › Overview and Home › Overview used as a person uses them: today's energy, the next step
// (its time, its smaller steps, another, done), Now, Next and Later (keys, the cap of three, dragging, adding, taking
// off), parked thoughts, the guides, Resume, the road and the rings, Begin, the Home Overview's keys, a reload, and a
// change of language. Every check is printed; any failure or page error ends with exit code 1.
const { chromium } = require('playwright');
const URL_ = process.argv[2];
let fails = 0;
function ok(c, what, extra) { console.log((c ? 'ok   ' : 'FAIL ') + what + (extra !== undefined ? '  ' + JSON.stringify(extra) : '')); if (!c) fails++; }
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1400, height: 950 }, colorScheme: 'light' });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(URL_).origin });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('page: ' + e.message.slice(0, 240)));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/sw\.js|favicon|Failed to load resource|bad HTTP response/.test(t)) errs.push('console: ' + t.slice(0, 240)); if (/Candidatus overview|^Overview/.test(t)) errs.push('fallback: ' + t.slice(0, 240)); });
  const ev = (f, a) => p.evaluate(f, a);
  const cand = async () => { await ev(() => { showSection('applications'); candUI.tab = 'overview'; renderCandidature(); }); await p.waitForTimeout(500); };
  const nextTitle = () => ev(() => (document.querySelector('#cdx-cand .cdx-next .cdx-h') || {}).textContent);
  const col = (k) => ev((k) => [...document.querySelectorAll('#cdx-cand .cdx-col[data-col="' + k + '"] .cdx-item b')].map(x => x.textContent), k);

  await p.goto(URL_, { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(3500);
  await ev(() => { try { if (typeof cdCloseDoor === 'function') cdCloseDoor(); } catch (e) {} state.themeAuto = false; state.theme = 'light'; saveState(); applyTheme(); if (state.lang !== 'en') setLang('en'); });
  await p.waitForTimeout(800);
  await cand();
  ok(await ev(() => !!document.getElementById('cdx-cand')), 'Candidatus › Overview is the new page');
  ok(await ev(() => !!state.cdCand && state.cdCand.seeded === true), 'the board is filled from the Proposal, Milestones and Funding');
  const first = await nextTitle();
  ok(!!first, 'a next step is offered', first);

  // today's energy
  await p.click('#cdx-cand [data-energy="low"]'); await p.waitForTimeout(400);
  const low = await ev(() => ({ low: !!(state.support.low || {})[todayString()], attr: document.body.hasAttribute('data-cd-low'), pressed: document.querySelector('#cdx-cand [data-energy="low"]').getAttribute('aria-pressed'), next: (document.querySelector('#cdx-cand .cdx-next .cdx-h') || {}).textContent, mins: (state.cdCand.items[(document.querySelector('#cdx-cand .cdx-next') || {}).getAttribute('data-item')] || {}).mins }));
  ok(low.low && low.pressed === 'true', 'Low is the app’s own low-energy day', low);
  ok(low.mins <= 15, 'on a low day the next step is a short one', low);
  await p.click('#cdx-cand [data-energy="some"]'); await p.waitForTimeout(400);
  ok(await ev(() => !(state.support.low || {})[todayString()] && state.cdEnergy.level === 'some'), 'Some clears the low day');
  await p.click('#cdx-cand [data-energy="plenty"]'); await p.waitForTimeout(300);
  ok(await ev(() => state.cdEnergy.level === 'plenty' && document.querySelector('#cdx-cand [data-energy="plenty"]').getAttribute('aria-pressed') === 'true'), 'Plenty is kept for the day');
  await p.click('#cdx-cand [data-energy="some"]'); await p.waitForTimeout(300);

  // the next step's time
  const id = await ev(() => document.querySelector('#cdx-cand .cdx-next').getAttribute('data-item'));
  const m0 = await ev((id) => state.cdCand.items[id].mins, id);
  await p.click('#cdx-cand .cdx-next [data-mins]'); await p.waitForTimeout(250);
  const m1 = await ev((id) => ({ m: state.cdCand.items[id].mins, tag: document.querySelector('#cdx-cand .cdx-next [data-mins]').textContent }), id);
  ok(m1.m !== m0 && m1.tag.indexOf(String(m1.m)) >= 0 && await ev(() => document.querySelector('#cdx-cand .cdx-next').getAttribute('data-item')) === id, 'the time can be changed, and the step stays the next step', { from: m0, to: m1 });
  await ev((id) => { state.cdCand.items[id].mins = 25; saveState(); window.cdxCandidatus.render(); }, id);

  // smaller steps
  await p.click('#cdx-cand .cdx-next [data-break]'); await p.waitForTimeout(300);
  const pre = await ev(() => [...document.querySelectorAll('#cdx-cand [data-step-in]')].map(i => i.value));
  ok(pre.length === 5 && pre.filter(Boolean).length >= 3, 'Break it into smaller steps offers five lines, three filled in', pre);
  await p.fill('#cdx-cand [data-step-in="3"]', 'Ask a friend to read it');
  await p.click('#cdx-cand [data-keep-steps]'); await p.waitForTimeout(300);
  const steps = await ev(() => [...document.querySelectorAll('#cdx-cand .cdx-step')].map(s => s.textContent));
  ok(steps.length === 4 && steps[3] === 'Ask a friend to read it', 'the steps are kept', steps);
  await p.click('#cdx-cand .cdx-step >> nth=0'); await p.waitForTimeout(250);
  ok(await ev((id) => state.cdCand.items[id].steps[0].done === true && document.querySelector('#cdx-cand .cdx-step').classList.contains('on'), id), 'a small step is ticked');

  // another step
  await p.click('#cdx-cand [data-skip]'); await p.waitForTimeout(300);
  const second = await nextTitle();
  ok(second && second !== first, 'Another step offers another', { first, second });
  await ev(() => { state.cdCand.skip = null; saveState(); window.cdxCandidatus.render(); });

  // done, on a milestone: the milestone is ticked and the week counts it
  const ms = await ev(() => { const c = state.cdCand; const idm = c.board.now.concat(c.board.next, c.board.later).find(i => c.items[i] && c.items[i].src && c.items[i].src.k === 'ms'); return idm ? { id: idm, ms: c.items[idm].src.id } : null; });
  ok(!!ms, 'a milestone is on the board', ms);
  if (ms) {
    await p.click('#cdx-cand .cdx-item[data-id="' + ms.id + '"] [data-done]', { force: true }); await p.waitForTimeout(400);
    const r = await ev((ms) => ({ gone: !state.cdCand.items[ms.id], ticked: !!(state.candidature.milestones.find(m => m.id === ms.ms) || {}).done, week: [...document.querySelectorAll('#cdx-cand .cdx-row3 > .cdx-card:first-child li')].map(l => l.textContent), say: (document.querySelector('#cdx-cand .cdx-say') || {}).textContent }), ms);
    ok(r.gone && r.ticked && r.week.length >= 1, 'Done takes it off the board, ticks the milestone, and the week counts it', r);
    const road = await ev(() => [...document.querySelectorAll('#cdx-cand .cdx-stop')].map(s => s.className.replace('cdx-stop', '').trim() + ':' + s.querySelector('b').textContent).slice(0, 4));
    ok(road.some(x => /done/.test(x)), 'the road shows the stations behind', road);
  }

  // Now, Next and Later
  const nowIds = await ev(() => state.cdCand.board.now.slice());
  if (nowIds.length) {
    await p.click('#cdx-cand .cdx-item[data-id="' + nowIds[0] + '"] [data-move$=":next"]', { force: true }); await p.waitForTimeout(300);
    ok(await ev((i) => state.cdCand.board.next.includes(i) && !state.cdCand.board.now.includes(i), nowIds[0]), '› moves a step from Now to Next');
  }
  for (const t of ['Email the admissions office', 'Read the course page', 'Check the English test date']) {
    const can = await ev(() => !!document.querySelector('#cdx-cand [data-add="now"] input'));
    if (!can) break;
    await p.fill('#cdx-cand [data-add="now"] input', t); await p.press('#cdx-cand [data-add="now"] input', 'Enter'); await p.waitForTimeout(300);
  }
  const now3 = await ev(() => ({ n: state.cdCand.board.now.length, form: !!document.querySelector('#cdx-cand [data-add="now"]'), cap: (document.querySelector('#cdx-cand .cdx-col.now .cdx-cap') || {}).textContent }));
  ok(now3.n === 3 && !now3.form && /three at most/.test(now3.cap || ''), 'Now holds three at most', now3);
  const nx = await ev(() => state.cdCand.board.next[0]);
  await p.click('#cdx-cand .cdx-item[data-id="' + nx + '"] [data-move$=":now"]', { force: true }); await p.waitForTimeout(300);
  const capSay = await ev((nx) => ({ still: state.cdCand.board.next.includes(nx), say: (document.querySelector('#cdx-cand .cdx-say') || {}).textContent }), nx);
  ok(capSay.still && /three at most/.test(capSay.say || ''), 'a fourth step is kept out of Now, kindly', capSay);
  // dragging
  const later0 = await ev(() => state.cdCand.board.later[0]);
  if (later0) {
    await p.locator('#cdx-cand .cdx-item[data-id="' + later0 + '"]').dragTo(p.locator('#cdx-cand .cdx-col[data-col="next"]'));
    await p.waitForTimeout(400);
    ok(await ev((i) => state.cdCand.board.next.includes(i) && !state.cdCand.board.later.includes(i), later0), 'a step is dragged from Later to Next');
  }
  // adding to Later, folding, unfolding, taking off
  for (const t of ['Visa: read the guidance', 'Book the IELTS', 'Ask for transcripts', 'Scan the passport']) { await p.fill('#cdx-cand [data-add="later"] input', t); await p.press('#cdx-cand [data-add="later"] input', 'Enter'); await p.waitForTimeout(250); }
  const fold = await ev(() => ({ n: state.cdCand.board.later.length, shown: document.querySelectorAll('#cdx-cand .cdx-col.later .cdx-item').length, more: !!document.querySelector('#cdx-cand [data-unfold]') }));
  ok(fold.n > 3 && fold.shown === 2 && fold.more, 'a long Later is folded away', fold);
  await p.click('#cdx-cand [data-unfold]'); await p.waitForTimeout(250);
  ok(await ev(() => document.querySelectorAll('#cdx-cand .cdx-col.later .cdx-item').length === state.cdCand.board.later.length), 'and unfolded');
  const rm = await ev(() => state.cdCand.board.later[state.cdCand.board.later.length - 1]);
  await p.click('#cdx-cand .cdx-item[data-id="' + rm + '"] [data-remove]', { force: true }); await p.waitForTimeout(250);
  ok(await ev((i) => !state.cdCand.items[i] && !state.cdCand.board.later.includes(i), rm), '× takes a step off the board');

  // parked thoughts
  await p.fill('#cdx-cand [data-park] input', 'Look up the Bodleian exhibition'); await p.press('#cdx-cand [data-park] input', 'Enter'); await p.waitForTimeout(250);
  await p.fill('#cdx-cand [data-park] input', 'Buy a new notebook'); await p.press('#cdx-cand [data-park] input', 'Enter'); await p.waitForTimeout(250);
  const parked = await ev(() => state.cdCand.parked.map(x => x.t));
  ok(parked.length === 2, 'thoughts are parked', parked);
  const unp = await ev(() => state.cdCand.parked.find(x => /notebook/.test(x.t)).id);
  await p.click('#cdx-cand [data-unpark="' + unp + '"]'); await p.waitForTimeout(250);
  ok(await ev(() => state.cdCand.parked.length === 1 && state.cdCand.board.later.some(i => /notebook/.test(state.cdCand.items[i].t))), '↩ brings a thought back to Later');
  const fg = await ev(() => state.cdCand.parked[0].id);
  await p.click('#cdx-cand [data-forget="' + fg + '"]'); await p.waitForTimeout(250);
  ok(await ev(() => state.cdCand.parked.length === 0), '× lets a thought go');

  // the guides
  for (const g of ['email', 'stuck', 'referee', 'interview', 'page']) {
    await p.click('#cdx-cand [data-guide="' + g + '"]'); await p.waitForTimeout(300);
    const s = await ev(() => { const w = document.getElementById('cdx-sheet'); return w ? { t: w.querySelector('h2').textContent, n: w.innerText.length, focus: document.activeElement && document.activeElement.hasAttribute('data-close') } : null; });
    ok(s && s.n > 300 && s.focus, 'guide ' + g + ' opens', s && s.t);
    if (g === 'email') {
      await p.click('#cdx-sheet [data-copy]'); await p.waitForTimeout(300);
      const clip = await ev(() => navigator.clipboard.readText());
      ok(/^Subject:/.test(clip) && /Dear Professor/.test(clip), 'Copy the model copies the email', clip.slice(0, 60));
      await p.mouse.click(5, 500); await p.waitForTimeout(250);
      ok(await ev(() => !document.getElementById('cdx-sheet')), 'a click beside the guide closes it');
    } else {
      await p.keyboard.press('Escape'); await p.waitForTimeout(250);
      ok(await ev(() => !document.getElementById('cdx-sheet')), 'Escape closes guide ' + g);
    }
  }

  // where you left off
  await ev(() => { candUI.tab = 'proposal'; renderCandidature(); }); await p.waitForTimeout(500);
  await cand();
  const res = await ev(() => (document.querySelector('#cdx-cand [data-resume]') ? document.querySelector('#cdx-cand .cdx-resume').textContent : null));
  ok(res && /Proposal/.test(res), 'Where you left off names the Proposal', res);
  await p.click('#cdx-cand [data-resume]'); await p.waitForTimeout(500);
  ok(await ev(() => candUI.tab === 'proposal'), 'Resume opens it');
  await cand();
  // the road and the rings
  await p.click('#cdx-cand .cdx-stop >> nth=2'); await p.waitForTimeout(400);
  ok(await ev(() => candUI.tab === 'milestones'), 'a station of the road opens Milestones');
  await cand();
  await p.click('#cdx-cand .cdx-ring >> nth=1'); await p.waitForTimeout(400);
  ok(await ev(() => candUI.tab === 'applications'), 'the Applications ring opens Applications');
  await cand();
  // Begin
  await p.click('#cdx-cand [data-begin]'); await p.waitForTimeout(500);
  ok(await ev(() => !!document.getElementById('pomo-modal') && pomo.running === true), 'Begin opens the Clepsydra and starts it');
  await ev(() => { try { pomoStop(); closeModal(); } catch (e) {} });

  // a reload keeps everything
  const before = await ev(() => JSON.stringify(state.cdCand.board));
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(3500);
  await ev(() => { try { if (typeof cdCloseDoor === 'function') cdCloseDoor(); } catch (e) {} });
  await cand();
  const after = await ev(() => JSON.stringify(state.cdCand.board));
  ok(before === after, 'the board is kept across a reload');
  ok(await ev((id) => state.cdCand.items[id] && state.cdCand.items[id].steps.length === 4 && state.cdCand.items[id].steps[0].done === true, id), 'the smaller steps are kept across a reload');
  await ev((id) => { const c = state.cdCand; ['now', 'next', 'later'].forEach(k => { const i = c.board[k].indexOf(id); if (i >= 0) c.board[k].splice(i, 1); }); c.board.next.unshift(id); saveState(); window.cdxCandidatus.render(); }, id);
  await p.click('#cdx-cand .cdx-item[data-id="' + id + '"] b');
  await ev(() => window.cdxCandidatus.render());
  const curId = await ev(() => document.querySelector('#cdx-cand .cdx-next').getAttribute('data-item'));
  if (curId !== id) { await ev(() => { state.cdCand.pin = null; }); }
  await ev((id) => { state.cdCand.pin = { day: todayString(), id }; saveState(); }, id);
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(3500);
  await ev(() => { try { if (typeof cdCloseDoor === 'function') cdCloseDoor(); } catch (e) {} });
  await cand();
  ok(await ev((id) => document.querySelector('#cdx-cand .cdx-next').getAttribute('data-item') === id && document.querySelectorAll('#cdx-cand .cdx-step').length === 4 && document.querySelector('#cdx-cand .cdx-step').classList.contains('on'), id), 'the step being worked on stays the next step across a reload, with its smaller steps');

  // the Home Overview
  const home = async () => { await ev(() => { showSection('home'); homeUI.tab = 'overview'; renderHome(); }); await p.waitForTimeout(700); };
  await home();
  ok(await ev(() => !!document.getElementById('cdx-ov')), 'Home › Overview is the new page');
  await p.click('#cdx-ov [data-energy="low"]'); await p.waitForTimeout(400);
  ok(await ev(() => !!(state.support.low || {})[todayString()] && document.querySelector('#cdx-ov [data-energy="low"]').getAttribute('aria-pressed') === 'true'), 'the Overview’s energy is the same setting');
  await p.click('#cdx-ov [data-energy="some"]'); await p.waitForTimeout(300);
  for (const [sel, check, what] of [
    ['#cdx-ov [data-section="schedule"]', () => !document.getElementById('section-schedule').classList.contains('hidden'), 'Open the Agenda'],
    ['#cdx-ov [data-section="curriculum"]', () => !document.getElementById('section-curriculum').classList.contains('hidden'), 'Open the Curriculum'],
    ['#cdx-ov [data-cand]', () => !document.getElementById('section-applications').classList.contains('hidden') && candUI.tab === 'overview' && !!document.getElementById('cdx-cand'), 'Open Candidatus'],
    ['#cdx-ov [data-propdate]', () => !!document.querySelector('.cd-prop-details'), 'Choose a date'],
    ['#cdx-ov [data-french]', () => typeof frenchUI !== 'undefined' && frenchUI.mode === 'choose' && document.body.innerText.indexOf('Tutor') >= 0, 'Open the French Tutor'],
    ['#cdx-ov .cdx-ov-asc .btn', () => !document.getElementById('section-ascent').classList.contains('hidden'), 'Open Ascensus'],
    ['#cdx-ov [data-begin] >> nth=0', () => !!document.getElementById('pomo-modal'), 'Begin, from the Overview'],
  ]) {
    await home();
    const has = await p.locator(sel).count();
    if (!has) { ok(false, what + ' (no key)'); continue; }
    await p.click(sel); await p.waitForTimeout(600);
    ok(await ev(check), what);
    await ev(() => { try { pomoStop(); } catch (e) {} try { closeModal(); } catch (e) {} try { if (typeof closeWorkspace === 'function') closeWorkspace(); } catch (e) {} });
  }

  // a change of language redraws whichever page is open
  await cand();
  await ev(() => setLang('fr')); await p.waitForTimeout(900);
  const frc = await ev(() => ({ kick: (document.querySelector('#cdx-cand .cdx-kick') || {}).textContent, cols: [...document.querySelectorAll('#cdx-cand .cdx-col h4')].map(h => h.firstChild.textContent.trim()) }));
  ok(/prochaine/.test(frc.kick || '') && frc.cols.join() === 'Maintenant,Ensuite,Plus tard', 'in French at once', frc);
  await home();
  const fro = await ev(() => [...document.querySelectorAll('#cdx-ov .cdx-kick')].map(k => k.textContent.trim()));
  ok(fro[0] === 'Aujourd’hui' && fro.includes('Français'), 'the Overview in French', fro);
  await ev(() => setLang('en')); await p.waitForTimeout(600);
  ok(await ev(() => /Today/.test(document.querySelector('#cdx-ov .cdx-kick').textContent)), 'and back in English');

  ok(errs.length === 0, 'no page errors', errs);
  console.log(fails ? fails + ' FAILED' : 'all passed');
  await b.close();
  process.exit(fails ? 1 : 0);
})();
