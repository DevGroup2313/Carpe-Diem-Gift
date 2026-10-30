const { chromium } = require('playwright');
(async () => {
  const S = process.env.CD_SHOTS || './';
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  await p.goto((process.env.CD_BASE || 'http://127.0.0.1:8765/') + 'cd1065.html', { waitUntil: 'load', timeout: 120000 });
  await p.waitForTimeout(5000); await p.evaluate(() => cdCloseDoor()); await p.waitForTimeout(1000);
  // night, French
  await p.evaluate(() => { state.lang = 'fr'; state.theme = 'night'; saveState(); });
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(6000);
  await p.evaluate(() => { try { cdCloseDoor(); } catch (e) {} }); await p.waitForTimeout(1200);
  await p.click('#display-btn'); await p.waitForTimeout(900);
  const m = await p.$('.cd-display-menu'); if (m) await m.screenshot({ path: S + 'dm1065-night-fr.png', clip: undefined });
  console.log('row (fr):', await p.evaluate(() => (document.querySelector('#cd-refresh-row') || {}).innerText));
  // a choice in the panel redraws it: the row comes back
  await p.evaluate(() => { const b = [...document.querySelectorAll('.cd-display-menu .cd-seg')].find(x => /Clair|Light/.test(x.textContent)); if (b) b.click(); });
  await p.waitForTimeout(700);
  console.log('after a choice, rows:', await p.evaluate(() => document.querySelectorAll('#cd-refresh-row').length), 'menus:', await p.evaluate(() => document.querySelectorAll('.cd-display-menu').length));
  // the key refreshes, saving first
  await p.evaluate(() => { const b = [...document.querySelectorAll('.cd-display-menu .cd-seg')].find(x => /Sombre|Dark/.test(x.textContent)); if (b) b.click(); });
  await p.waitForTimeout(500);
  if (!(await p.$('.cd-display-menu'))) { await p.click('#display-btn'); await p.waitForTimeout(800); }
  const nav = p.waitForNavigation({ timeout: 20000 }).then(() => 'reloaded', () => 'no reload');
  await p.click('#cd-refresh-btn');
  console.log('refresh key:', await nav);
  await p.waitForTimeout(400);
  console.log('splash says:', await p.evaluate(() => (document.getElementById('cds-say') || {}).textContent));
  await p.waitForTimeout(7000);
  await p.evaluate(() => { try { cdCloseDoor(); } catch (e) {} }); await p.waitForTimeout(800);
  // the newer-build card
  await p.evaluate(() => window.cdNewBuildInstalled('1066'));
  await p.waitForTimeout(400);
  const c = await p.$('#cd-newbuild-ask .cd-rfa-card'); if (c) await c.screenshot({ path: S + 'newbuild-fr.png' });
  await p.click('#cd-newbuild-ask .cd-rfa-go'); await p.waitForTimeout(1800);
  console.log('after Restart without the Mac app:', await p.evaluate(() => (document.querySelector('#cd-newbuild-ask p') || {}).textContent));
  console.log('errors', errs);
  await b.close();
})();
