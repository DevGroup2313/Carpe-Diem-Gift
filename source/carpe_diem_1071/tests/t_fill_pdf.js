// fillpdf.js <page>: Tabula's Fill a PDF key takes a PDF and shows it to be filled
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } }); const p = await ctx.newPage();
  const dialogs = []; p.on('dialog', d => { dialogs.push(d.message().slice(0, 90)); d.accept(); });
  await p.goto('http://127.0.0.1:8765/' + process.argv[2], { waitUntil: 'load', timeout: 120000 });
  await p.waitForTimeout(5000); await p.evaluate(() => cdCloseDoor()); await p.waitForTimeout(800);
  await p.evaluate(() => openExt('tabula')); await p.waitForTimeout(4000);
  const fr = await (await p.$('#frame-tabula')).contentFrame();
  const [chooser] = await Promise.all([p.waitForEvent('filechooser', { timeout: 10000 }).catch(() => null), fr.evaluate(() => { const b = document.getElementById('cd-pdf-btn'); if (b) b.click(); return !!b; })]);
  if (!chooser) { console.log('no file chooser from Fill a PDF'); await b.close(); return; }
  await chooser.setFiles((process.env.CD_TEST_DIR || (__dirname + '/')) + 'docs/pdf/chapter.pdf');
  await p.waitForTimeout(3000);
  const st = await fr.evaluate(() => { const ov = [...document.querySelectorAll('div')].filter(d => getComputedStyle(d).position === 'fixed' && d.getBoundingClientRect().width > 600 && /pdf|PDF|Save|Enregistrer/.test(d.textContent || '')); return ov.length ? ov[0].textContent.slice(0, 120) : 'no PDF studio shown'; });
  console.log('dialogs:', JSON.stringify(dialogs)); console.log('studio:', st);
  await b.close();
})();
