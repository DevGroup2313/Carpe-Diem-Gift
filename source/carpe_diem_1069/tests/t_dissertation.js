// big1.js <page> <dissertation.docx> <out.docx> : open, type, add a footnote early on, save; with times
const { chromium } = require('playwright');
(async () => {
  const [page_, file, out] = process.argv.slice(2);
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  p.on('dialog', d => d.accept().catch(() => {}));
  await p.goto((process.env.CD_BASE || 'http://127.0.0.1:8765/') + page_, { waitUntil: 'load', timeout: 120000 });
  await p.waitForTimeout(5000); await p.evaluate(() => cdCloseDoor()); await p.waitForTimeout(800);
  await p.evaluate(() => openExt('tabula')); await p.waitForTimeout(4000);
  const fh = await p.$('#frame-tabula'), fr = await fh.contentFrame(), off = await fh.boundingBox();
  let t = Date.now();
  await fr.setInputFiles('#openFile', file);
  for (let k = 0; k < 120; k++) { await p.waitForTimeout(500); const n = await fr.evaluate(() => document.querySelectorAll('#editor sup.fn-ref').length); if (n >= 300) break; }
  console.log('open:', Date.now() - t, 'ms');
  await p.waitForTimeout(2500);
  const st = await fr.evaluate(() => ({ words: (document.getElementById('editor').innerText.match(/\S+/g) || []).length, refs: document.querySelectorAll('#editor sup.fn-ref').length, pages: (document.body.innerText.match(/Page \d+ of (\d+)/) || [])[1], fnShown: document.querySelectorAll('.cd-fnp').length }));
  console.log('loaded:', JSON.stringify(st));
  // typing at the end and in the middle: time per key as the page answers
  async function typeAt(where) {
    const pos = await fr.evaluate((where) => { const ed = document.getElementById('editor'); const ps = ed.querySelectorAll('p'); const el = where === 'end' ? ps[ps.length - 1] : ps[Math.floor(ps.length / 2)]; el.scrollIntoView({ block: 'center' }); const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); ed.focus(); return true; }, where);
    await p.waitForTimeout(800);
    const t0 = Date.now(); await p.keyboard.type(' quick brown fox', { delay: 0 }); await fr.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    return (Date.now() - t0) / 16;
  }
  console.log('typing, ms per key, at the end:', (await typeAt('end')).toFixed(1), '| in the middle:', (await typeAt('middle')).toFixed(1));
  // a new footnote after the first paragraph's text
  const fnBtn = await fr.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Insert Footnote|Footnote/i.test((x.title || '') + ' ' + x.textContent) && !/Endnote/i.test(x.textContent)); return b ? (b.id || b.title || b.textContent.trim()) : null; });
  console.log('footnote key:', fnBtn);
  await fr.evaluate(() => { const ed = document.getElementById('editor'); const p0 = ed.querySelector('h2 + p') || ed.querySelectorAll('p')[1]; p0.scrollIntoView({ block: 'center' }); const tw = document.createTreeWalker(p0, NodeFilter.SHOW_TEXT); const n = tw.nextNode(); const r = document.createRange(); r.setStart(n, 20); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); ed.focus(); });
  await fr.evaluate(() => { const rb = [...document.querySelectorAll('.ribtab')].find(x => /References/.test(x.textContent)); if (rb) rb.click(); });
  await p.waitForTimeout(500);
  t = Date.now();
  const clicked = await fr.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.offsetParent && /Insert Footnote/i.test((x.title || '') + ' ' + x.textContent)); if (!b) return false; b.click(); return true; });
  await p.waitForTimeout(600); await p.keyboard.type('Added note, Chicago style, 12.');
  await p.waitForTimeout(1500);
  const after = await fr.evaluate(() => { const refs = [...document.querySelectorAll('#editor sup.fn-ref')]; return { refs: refs.length, first5: refs.slice(0, 5).map(x => x.textContent).join(','), last: refs[refs.length - 1].textContent }; });
  console.log('insert footnote clicked:', clicked, 'took', Date.now() - t, 'ms ->', JSON.stringify(after));
  await fr.evaluate(() => { const rb = [...document.querySelectorAll('.ribtab')].find(x => /Home/.test(x.textContent)); if (rb) rb.click(); }); await p.waitForTimeout(400);
  const dl = p.waitForEvent('download', { timeout: 60000 }).catch(() => null);
  t = Date.now(); await fr.click('#tbSaveDocx'); const d = await dl; if (d) { await d.saveAs(out); console.log('save .docx:', Date.now() - t, 'ms', d.suggestedFilename()); } else console.log('no download');
  console.log('errors', errs.slice(0, 5));
  await b.close();
})();
