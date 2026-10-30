// ab3.js <page> : click a cell and type over it; number formats on a number
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await p.goto((process.env.CD_BASE || 'http://127.0.0.1:8765/') + process.argv[2], { waitUntil: 'load', timeout: 120000 });
  await p.waitForTimeout(5000); await p.evaluate(() => { try { cdCloseDoor(); } catch (e) {} const d = document.getElementById('demo-entry'); if (d) { const g = [...d.querySelectorAll('button')].find(x => /Go to Home/.test(x.textContent)); if (g) g.click(); else d.remove(); } }); await p.waitForTimeout(1200);
  await p.evaluate(() => openExt('abacus')); await p.waitForTimeout(4000);
  const fr = await (await p.$('#frame-abacus')).contentFrame();
  const txt = (ref) => fr.evaluate((r) => { const e = document.querySelector('td[data-ref="' + r + '"]'); return e ? e.textContent : null; }, ref);
  console.log('A1 before:', JSON.stringify(await txt('A1')), 'B2 before:', JSON.stringify(await txt('B2')));
  // a single click then typing, as in Excel, over a cell that holds something
  await fr.click('td[data-ref="A1"]'); await p.keyboard.type('Name'); await p.keyboard.press('Enter');
  console.log('click A1, type "Name", Enter ->', JSON.stringify(await txt('A1')), '| A2 now selected:', await fr.evaluate(() => (document.querySelector('td.sel') || {}).getAttribute && document.querySelector('td.sel').getAttribute('data-ref')));
  // an empty cell
  await fr.click('td[data-ref="C3"]'); await p.keyboard.type('1234.5'); await p.keyboard.press('Enter');
  console.log('C3 typed ->', JSON.stringify(await txt('C3')));
  await fr.click('td[data-ref="C3"]'); await fr.click('#abCur'); await p.waitForTimeout(200); console.log('currency C3 ->', JSON.stringify(await txt('C3')));
  await fr.click('#abComma'); await p.waitForTimeout(200); console.log('thousands C3 ->', JSON.stringify(await txt('C3')));
  await fr.click('#abInc'); await p.waitForTimeout(200); console.log('fewer decimals ->', JSON.stringify(await txt('C3')));
  await fr.click('#abDec'); await p.waitForTimeout(200); console.log('more decimals ->', JSON.stringify(await txt('C3')));
  await fr.click('td[data-ref="C4"]'); await p.keyboard.type('0.25'); await p.keyboard.press('Enter');
  await fr.click('td[data-ref="C4"]'); await fr.click('#abPct'); await p.waitForTimeout(200); console.log('percent C4 ->', JSON.stringify(await txt('C4')));
  await fr.click('td[data-ref="C5"]'); await p.keyboard.type('=C3+C4'); await p.keyboard.press('Enter'); console.log('C5 =C3+C4 ->', JSON.stringify(await txt('C5')));
  // double click edits in place (adds to what is there), as in Excel
  await fr.dblclick('td[data-ref="C3"]'); await p.keyboard.press('End'); await p.keyboard.type('0'); await p.keyboard.press('Enter'); console.log('double-click C3, End, type 0 ->', JSON.stringify(await txt('C3')), '| C5 ->', JSON.stringify(await txt('C5')));
  console.log('errors', errs);
  await b.close();
})();
