// t_lock.js FILE CODE: the locked copy as a committee member meets it, opened from the file itself
const { chromium } = require('playwright');
const [FILE, CODE] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1300, height: 860 } });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  const url = 'file://' + FILE;
  await p.goto(url); await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/claude-0/-home-user/672511ab-54d8-5606-83e8-f1a5ab6a9fe2/scratchpad/evaltools/lock_door_en.png' });
  const out = { door: await p.evaluate(() => document.body.innerText.slice(0, 300)) };
  const visibleCode = await p.evaluate(() => document.documentElement.outerHTML.indexOf('DEFAULT_CANDIDATURE') >= 0);
  out.codeVisibleBeforeOpening = visibleCode;
  await p.fill('#code', 'AAAA-BBBB-CCCC'); await p.click('#go');
  await p.waitForFunction(() => /does not open/.test(document.getElementById('say').textContent), null, { timeout: 30000 });
  out.wrong = await p.evaluate(() => document.getElementById('say').textContent);
  const t0 = Date.now();
  await p.fill('#code', CODE.toLowerCase()); await p.click('#go');
  await p.waitForFunction(() => typeof window.openExt === 'function' && !!document.getElementById('cd-eval-mark'), null, { timeout: 60000 });
  out.openedAfterMs = Date.now() - t0;
  await p.waitForTimeout(2500);
  out.terms = await p.evaluate(() => !!document.getElementById('cd-eval-terms'));
  await p.evaluate(() => { const b = document.querySelector('#cd-eval-terms button'); if (b) b.click(); });
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Go to Home/.test(x.textContent)); if (b) b.click(); try { cdCloseDoor(); } catch (e) {} });
  await p.waitForTimeout(800);
  out.sections = await p.evaluate(async () => { const r = []; for (const s of ['home', 'focus', 'curriculum', 'applications']) { try { showSection(s); await new Promise(x => setTimeout(x, 500)); r.push(s + ':ok'); } catch (e) { r.push(s + ':' + e.message); } } return r; });
  await p.evaluate(() => openExt('tabula')); await p.waitForTimeout(3500);
  out.tabula = await p.evaluate(() => { const f = document.getElementById('frame-tabula'); return !!(f && f.contentDocument && f.contentDocument.getElementById('editor')); });
  out.saveWorks = await p.evaluate(() => { try { localStorage.setItem('cd_probe', '1'); return localStorage.getItem('cd_probe') === '1'; } catch (e) { return 'no storage: ' + e.message; } });
  out.seal = await p.evaluate(() => window.cdSealCheck ? window.cdSealCheck() : 'none');
  await p.screenshot({ path: '/tmp/claude-0/-home-user/672511ab-54d8-5606-83e8-f1a5ab6a9fe2/scratchpad/evaltools/lock_opened.png' });
  // Refresh: opens again with no code asked
  await p.reload(); await p.waitForFunction(() => typeof window.openExt === 'function', null, { timeout: 60000 });
  out.refreshOpens = true;
  // a room in a window of its own (the browser's), from the same file
  const p2 = await ctx.newPage(); p2.on('pageerror', e => errs.push('room: ' + e.message.slice(0, 160)));
  await p2.goto(url + '#cd=tabula');
  await p2.waitForFunction(() => document.body && document.body.classList.contains('cd-tabula-window'), null, { timeout: 60000 }).then(() => out.roomWindow = true, () => out.roomWindow = false);
  out.errs = errs;
  console.log(JSON.stringify(out, null, 1));
  // French door
  const c2 = await b.newContext({ viewport: { width: 1300, height: 860 }, locale: 'fr-FR' });
  const p3 = await c2.newPage(); await p3.goto(url); await p3.waitForTimeout(400);
  await p3.screenshot({ path: '/tmp/claude-0/-home-user/672511ab-54d8-5606-83e8-f1a5ab6a9fe2/scratchpad/evaltools/lock_door_fr.png' });
  await b.close();
})();
