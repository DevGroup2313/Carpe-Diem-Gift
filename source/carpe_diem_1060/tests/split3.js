const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://127.0.0.1:8765/cd1061.html', { waitUntil: 'load' });
  await page.waitForTimeout(4500);
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Go to Home/.test(x.textContent)); if (b) b.click(); });
  await page.waitForTimeout(800);
  await page.evaluate(() => openExt('tabula')); await page.waitForTimeout(4500);
  await page.evaluate(() => cdFloatApp('tabula')); await page.waitForTimeout(2500);
  const before = await page.evaluate(() => { const w = document.getElementById('cd-fw-tabula'); const r = w.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); });
  await page.evaluate(() => cdSplit.enter(document.getElementById('cd-fw-tabula')));
  await page.waitForTimeout(400);
  const g = await page.evaluate(() => { const r = document.querySelector('.cd-split-grip').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await page.mouse.move(g[0], g[1]); await page.mouse.down(); await page.mouse.move(500, g[1], { steps: 8 }); await page.mouse.up();
  await page.waitForTimeout(300);
  const dragged = await page.evaluate(() => { const r = document.getElementById('cd-fw-tabula').getBoundingClientRect(); return { left: Math.round(r.left), width: Math.round(r.width), frac: localStorage.getItem('cd_split_frac'), scrollW: Math.round(document.getElementById('cd-scroll').getBoundingClientRect().width) }; });
  // drag the bar: it must not move
  await page.mouse.move(dragged.left + 200, 18); await page.mouse.down(); await page.mouse.move(dragged.left + 50, 300, { steps: 6 }); await page.mouse.up();
  await page.waitForTimeout(300);
  const afterBarDrag = await page.evaluate(() => { const r = document.getElementById('cd-fw-tabula').getBoundingClientRect(); return [r.left, r.top].map(Math.round); });
  // menu while split: Float again
  const menu = await page.evaluate(() => { const w = document.getElementById('cd-fw-tabula'); const k = w.querySelector('[data-cd-export-guard],[data-cd-popout]'); k.click(); const m = document.getElementById('cd-export-choice'); return [...m.querySelectorAll('button')].map(b => b.getAttribute('data-cd-act')); });
  await page.evaluate(() => document.querySelector('#cd-export-choice [data-cd-act=float]').click());
  await page.waitForTimeout(300);
  const floated = await page.evaluate(() => { const r = document.getElementById('cd-fw-tabula').getBoundingClientRect(); return { rect: [r.left, r.top, r.width, r.height].map(Math.round), split: document.body.classList.contains('cd-split'), scrollW: Math.round(document.getElementById('cd-scroll').getBoundingClientRect().width) }; });
  // split again, then close the window: the desk comes back whole
  await page.evaluate(() => cdSplit.enter(document.getElementById('cd-fw-tabula')));
  await page.waitForTimeout(300);
  await page.evaluate(() => { const x = [...document.querySelectorAll('#cd-fw-tabula .cd-fw-bar button')].find(b => b.textContent.trim() === '✕'); x.click(); });
  await page.waitForTimeout(1200);
  const closed = await page.evaluate(() => ({ split: document.body.classList.contains('cd-split'), win: !!document.getElementById('cd-fw-tabula'), scrollW: Math.round(document.getElementById('cd-scroll').getBoundingClientRect().width) }));
  console.log(JSON.stringify({ before, dragged, afterBarDrag, menu, floated, closed, errs }, null, 1));
  await browser.close();
})();
