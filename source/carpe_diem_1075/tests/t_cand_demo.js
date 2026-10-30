// t_cand_demo.js URL OUT: a demonstration's Home Overview in the new design: no proposal and no Candidatus on it, in
// English and in French, by day and by night; its keys work; no page errors. Exit code 1 on any failure.
const { chromium } = require('playwright');
const [URL_, OUT] = process.argv.slice(2);
let fails = 0;
function ok(c, what, extra) { console.log((c ? 'ok   ' : 'FAIL ') + what + (extra !== undefined ? '  ' + JSON.stringify(extra) : '')); if (!c) fails++; }
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1400, height: 950 }, colorScheme: 'light' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('page: ' + e.message.slice(0, 240)));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/sw\.js|favicon|Failed to load resource|bad HTTP response/.test(t)) errs.push('console: ' + t.slice(0, 240)); if (/Candidatus overview|^Overview/.test(t)) errs.push('fallback: ' + t.slice(0, 240)); });
  const ev = (f, a) => p.evaluate(f, a);
  await p.goto(URL_, { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(4000);
  ok(await ev(() => typeof demoOn === 'function' && demoOn()), 'this is a demonstration');
  // the welcome: Start fresh, as a visitor might
  const fresh = p.locator('#demo-entry >> text=Start fresh').first();
  if (await fresh.count()) { await fresh.click(); await p.waitForTimeout(1500); }
  ok(await ev(() => !document.getElementById('demo-entry') || !document.getElementById('demo-entry').offsetParent), 'the welcome is closed');
  await ev(() => { try { if (typeof cdCloseDoor === 'function') cdCloseDoor(); } catch (e) {} });
  const home = async () => { await ev(() => { showSection('home'); homeUI.tab = 'overview'; renderHome(); }); await p.waitForTimeout(800); };
  await home();
  const r = await ev(() => { const o = document.getElementById('cdx-ov'); return o ? { kicks: [...o.querySelectorAll('.cdx-kick')].map(k => k.textContent.trim()), text: o.innerText } : null; });
  ok(!!r, 'Home › Overview is the new page');
  ok(r && !/propos|candidat/i.test(r.text), 'no proposal and no Candidatus on it', r && r.kicks);
  ok(await ev(() => !state.cdCand || !state.cdCand.seeded), 'no Candidatus board is made');
  await p.click('#cdx-ov [data-energy="low"]'); await p.waitForTimeout(400);
  ok(await ev(() => !!(state.support.low || {})[todayString()]), 'today’s energy works');
  await p.click('#cdx-ov [data-energy="some"]'); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '_day_en.png' });
  for (const [sel, check, what] of [
    ['#cdx-ov [data-section="schedule"]', () => !document.getElementById('section-schedule').classList.contains('hidden'), 'Open the Agenda'],
    ['#cdx-ov [data-section="curriculum"]', () => !document.getElementById('section-curriculum').classList.contains('hidden'), 'Open the Curriculum'],
    ['#cdx-ov [data-french]', () => typeof frenchUI !== 'undefined' && frenchUI.mode === 'choose', 'Open the French Tutor'],
  ]) {
    await home();
    if (!(await p.locator(sel).count())) { ok(false, what + ' (no key)'); continue; }
    await p.click(sel); await p.waitForTimeout(600);
    ok(await ev(check), what);
    await ev(() => { try { closeModal(); } catch (e) {} try { if (typeof closeWorkspace === 'function') closeWorkspace(); } catch (e) {} });
  }
  await home();
  await ev(() => setLang('fr')); await p.waitForTimeout(900);
  const f = await ev(() => { const o = document.getElementById('cdx-ov'); return o ? { kicks: [...o.querySelectorAll('.cdx-kick')].map(k => k.textContent.trim()), text: o.innerText } : null; });
  ok(f && f.kicks[0] === 'Aujourd’hui' && !/propos|candidat/i.test(f.text), 'in French, still no proposal', f && f.kicks);
  await p.screenshot({ path: OUT + '_day_fr.png' });
  await ev(() => { state.themeAuto = false; state.theme = 'night'; saveState(); applyTheme(); setLang('en'); }); await p.waitForTimeout(900);
  await home();
  await p.screenshot({ path: OUT + '_night_en.png' });
  ok(errs.length === 0, 'no page errors', errs);
  console.log(fails ? fails + ' FAILED' : 'all passed');
  await b.close();
  process.exit(fails ? 1 : 0);
})();
