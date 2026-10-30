// docx3.js <page> <in.docx> <out.docx> : open a Word file in Tabula, save it back as Word
const { chromium } = require('playwright');
(async () => {
  const [page_, file, out] = process.argv.slice(2);
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  p.on('dialog', d => d.accept().catch(() => {}));
  await p.goto((process.env.CD_BASE || 'http://127.0.0.1:8765/') + page_, { waitUntil: 'load', timeout: 120000 });
  await p.waitForTimeout(5000); await p.evaluate(() => { try { cdCloseDoor(); } catch (e) {} const d = document.getElementById('demo-entry'); if (d) { const g = [...d.querySelectorAll('button')].find(x => /Go to Home/.test(x.textContent)); if (g) g.click(); else d.remove(); } }); await p.waitForTimeout(1200);
  await p.evaluate(() => openExt('tabula')); await p.waitForTimeout(4000);
  const fr = await (await p.$('#frame-tabula')).contentFrame();
  await fr.setInputFiles('#openFile', file); await p.waitForTimeout(3500);
  const dl = p.waitForEvent('download', { timeout: 15000 }).catch(() => null);
  await fr.click('#tbSaveDocx');
  const d = await dl;
  if (!d) { console.log('no download'); } else { await d.saveAs(out); console.log('saved', d.suggestedFilename()); }
  console.log('errors', errs);
  await b.close();
})();
