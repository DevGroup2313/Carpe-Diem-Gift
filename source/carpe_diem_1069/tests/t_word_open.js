// docx1.js <page> <file.docx> : open a Word file in Tabula and describe what arrives
const { chromium } = require('playwright');
(async () => {
  const [page_, file] = process.argv.slice(2);
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await p.goto((process.env.CD_BASE || 'http://127.0.0.1:8765/') + page_, { waitUntil: 'load', timeout: 120000 });
  await p.waitForTimeout(5000); await p.evaluate(() => { try { cdCloseDoor(); } catch (e) {} const d = document.getElementById('demo-entry'); if (d) { const g = [...d.querySelectorAll('button')].find(x => /Go to Home/.test(x.textContent)); if (g) g.click(); else d.remove(); } }); await p.waitForTimeout(1200);
  await p.evaluate(() => openExt('tabula')); await p.waitForTimeout(4000);
  const fr = await (await p.$('#frame-tabula')).contentFrame();
  const inputs = await fr.evaluate(() => [...document.querySelectorAll('input[type=file]')].map(i => (i.id || '') + ' accept=' + i.accept));
  console.log('file inputs:', JSON.stringify(inputs));
  const fc = fr.waitForEvent ? null : null;
  const how = process.argv[4] || 'input';
  if (how === 'button') { const chooser = p.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null); await fr.click('#tbOpenDocx').catch(e => console.log('no #tbOpenDocx', String(e).slice(0, 80))); const ch = await chooser; console.log('chooser from the Word key:', !!ch); if (ch) await ch.setFiles(file); }
  else { await fr.setInputFiles('#openFile', file); console.log('given to #openFile'); }
  for (let k = 0; k < 10; k++) { await p.waitForTimeout(1000); const n = await fr.evaluate(() => document.getElementById('editor').innerText.trim().length); if (n > 20) break; }
  console.log('toasts:', JSON.stringify(await fr.evaluate(() => [...document.querySelectorAll('.toast,[class*=toast],[role=status],[role=alert]')].map(x => x.innerText.trim()).filter(Boolean).slice(0, 5))));
  const r = await fr.evaluate(() => {
    const ed = document.getElementById('editor');
    const q = (s) => ed.querySelectorAll(s).length;
    const fnArea = document.querySelectorAll('.footnotes li, .cd-footnotes li, [data-fn], .fn-body, aside.footnotes p, .footnote').length;
    return { h1: q('h1'), h2: q('h2'), h3: q('h3'), bold: q('b,strong,[style*="bold"]'), italic: q('i,em,[style*="italic"]'), ul: q('ul li'), table: q('table td'), sup: q('sup'), fnRefs: q('[data-fn],sup a,.fn-ref,.footnote-ref'), fnArea,
      text: ed.innerText.replace(/\s+/g, ' ').slice(0, 400), title: (document.getElementById('docTitle') || {}).value || document.title,
      fnText: [...document.querySelectorAll('.footnotes, .cd-footnotes, #footnotes, .fn-list, [id*=footnote]')].map(x => x.innerText.replace(/\s+/g, ' ').slice(0, 200)).slice(0, 3) };
  });
  console.log(JSON.stringify(r, null, 1));
  const html = await fr.evaluate(() => document.getElementById('editor').innerHTML);
  require('fs').writeFileSync('opened.html', html);
  await p.screenshot({ path: 'docx_open.png' });
  console.log('errors', errs);
  await b.close();
})();
