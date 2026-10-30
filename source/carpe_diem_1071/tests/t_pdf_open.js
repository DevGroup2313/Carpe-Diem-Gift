// t_pdf_open.js <page>: Tabula opens PDFs from File, Open; the reader is fetched once, checked, kept; refusals said plainly
// CD_TEST_DIR holds pdfwork/article.pdf, pdfwork/scan.pdf, docs/pdf/chapter.pdf, docs/pdf/dissertation.pdf and vendor_pdfjs/x/package/legacy/build/ (npm pdfjs-dist 3.11.174)
const { chromium } = require('playwright');
const fs = require('fs');
const S = process.env.CD_TEST_DIR || (__dirname + '/');
const VEND = S + 'vendor_pdfjs/x/package/legacy/build/';
(async () => {
  const page_ = process.argv[2];
  const b = await chromium.launch();
  let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
  async function session(mode) {
    const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
    const hits = [];
    await ctx.route('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/*', route => {
      const name = route.request().url().split('/').pop(); hits.push(name);
      if (mode === 'offline') return route.abort();
      let body = fs.readFileSync(VEND + name);
      if (mode === 'tampered' && name === 'pdf.min.js') body = Buffer.concat([body, Buffer.from('\n;window.__evil=1;')]);
      route.fulfill({ status: 200, contentType: 'text/javascript', body });
    });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    p.on('dialog', d => d.accept());
    await p.goto('http://127.0.0.1:8765/' + page_, { waitUntil: 'load', timeout: 120000 });
    await p.waitForTimeout(5000); await p.evaluate(() => cdCloseDoor()); await p.waitForTimeout(800);
    await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Go to Home/.test(x.textContent)); if (b) b.click(); }); await p.waitForTimeout(800);
    await p.evaluate(() => openExt('tabula')); await p.waitForTimeout(4000);
    const fr = await (await p.$('#frame-tabula')).contentFrame();
    return { ctx, p, fr, hits, errs };
  }
  async function open(fr, file, untilRe, ms) {
    await fr.evaluate(() => { const c = document.getElementById('cd-pdf-open-card'); if (c) c.remove(); });
    await fr.setInputFiles('#openFile', S + file);
    for (let k = 0; k < (ms || 120); k++) { await fr.waitForTimeout(500); const t = await fr.evaluate(() => { const c = document.getElementById('cd-pdf-open-card'); return c ? c.textContent : ''; }); if (untilRe.test(t)) return t; }
    return await fr.evaluate(() => { const c = document.getElementById('cd-pdf-open-card'); return c ? c.textContent : '(no card)'; });
  }
  const count = fr => fr.evaluate(() => { const ed = document.getElementById('editor'); return { h1: ed.querySelectorAll('h1').length, h2: ed.querySelectorAll('h2').length, p: ed.querySelectorAll('p').length, li: ed.querySelectorAll('li').length, refs: ed.querySelectorAll('sup.fn-ref[data-note="foot"]').length, notes: document.querySelectorAll('#footnotes .fn[data-nid]').length, title: (document.getElementById('docTitle') || {}).value, accept: document.getElementById('openFile').getAttribute('accept'), first: (ed.querySelector('h1') || {}).textContent, nums: [...ed.querySelectorAll('sup.fn-ref')].slice(0, 12).map(s => s.textContent).join(','), atFoot: document.querySelectorAll('.cd-fnp').length }; });

  // 1. the reader fetched once, the article opened
  let s = await session('ok');
  let msg = await open(s.fr, 'pdfwork/article.pdf', /Opened|could not|not the published/);
  ok(/Opened from the PDF: 5 pages, 10 footnotes/.test(msg), 'article: ' + msg.slice(0, 90));
  let c = await count(s.fr);
  ok(c.h1 === 1 && c.h2 === 3 && c.refs === 10 && c.notes === 10 && c.title === 'article', 'article in Tabula: ' + JSON.stringify(c));
  ok(/\.pdf/.test(c.accept), 'File, Open offers PDFs: ' + c.accept);
  ok(s.hits.length === 2, 'reader fetched once: ' + s.hits.join(','));
  // 2. the dissertation over it: asked first, then 310 notes in order
  msg = await open(s.fr, 'docs/pdf/dissertation.pdf', /Opened|could not/, 200);
  c = await count(s.fr);
  ok(/253 pages, 310 footnotes/.test(msg) && c.refs === 310 && c.notes === 310, 'dissertation: ' + msg.slice(0, 70) + ' ' + JSON.stringify(c));
  ok(c.nums.startsWith('1,2,3,4,5,6,7,8,9,10,11,12'), 'note numbers in order: ' + c.nums);
  await s.fr.waitForTimeout(6000);
  ok((await count(s.fr)).atFoot > 250, 'notes laid out at the page feet: ' + (await count(s.fr)).atFoot);
  ok(s.hits.length === 2, 'no second fetch: ' + s.hits.length);
  // saved as Word, the notes go with it
  const [dl] = await Promise.all([s.p.waitForEvent('download', { timeout: 60000 }).catch(() => null), s.fr.evaluate(() => document.getElementById('tbSaveDocx').click())]);
  if (dl) { await dl.saveAs(S + 'docs/from_pdf.docx'); const z = require('child_process').execSync(`python3 -c "import zipfile,re;z=zipfile.ZipFile('${S}docs/from_pdf.docx');f=z.read('word/footnotes.xml').decode();print(len(re.findall(r'<w:footnote [^>]*w:id=\\"[1-9]',f)))"`).toString().trim(); ok(+z === 310, 'saved as Word with ' + z + ' notes'); }
  else ok(false, 'Save .docx key not found or no download');
  // 3. a fresh page in the same browser: the kept reader, no fetch
  await s.p.reload({ waitUntil: 'load' }); await s.p.waitForTimeout(5000); await s.p.evaluate(() => cdCloseDoor()); await s.p.waitForTimeout(800);
  await s.p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Go to Home/.test(x.textContent)); if (b) b.click(); }); await s.p.waitForTimeout(800);
  await s.p.evaluate(() => openExt('tabula')); await s.p.waitForTimeout(4000);
  const fr2 = await (await s.p.$('#frame-tabula')).contentFrame();
  const before = s.hits.length;
  msg = await open(fr2, 'docs/pdf/chapter.pdf', /Opened|could not/);
  ok(/Opened from the PDF: 1 page, 2 footnotes/.test(msg) && s.hits.length === before, 'reopened: kept reader used, no fetch: ' + msg.slice(0, 60) + ' fetches ' + (s.hits.length - before));
  const ch = await fr2.evaluate(() => document.getElementById('editor').innerHTML);
  ok(/<ul><li>Letters, 1890 to 1910<\/li>/.test(ch) && /<b>bold claim<\/b> and an <i>italic aside<\/i>/.test(ch), 'chapter: list, bold and italic');
  // 4. a scan
  msg = await open(fr2, 'pdfwork/scan.pdf', /pictures|could not/);
  ok(/pictures of its pages/.test(msg), 'scan: ' + msg.slice(0, 80));
  // 5. stop
  await open(fr2, 'docs/pdf/chapter.pdf', /Opened|could not/);
  await fr2.evaluate(() => { const c = document.getElementById('cd-pdf-open-card'); if (c) c.remove();
    // press Stop as soon as the card counts a page
    const mo = new MutationObserver(() => { const k = document.getElementById('cd-pdf-open-card'); if (k && /page \d+ of/.test(k.textContent)) { k.querySelector('button').click(); mo.disconnect(); } });
    mo.observe(document.body, { childList: true, subtree: true, characterData: true }); });
  await fr2.setInputFiles('#openFile', S + 'docs/pdf/dissertation.pdf');
  for (let k = 0; k < 40; k++) { await fr2.waitForTimeout(250); msg = await fr2.evaluate(() => (document.getElementById('cd-pdf-open-card') || {}).textContent || ''); if (/Stopped/.test(msg)) break; }
  ok(/Stopped\. Nothing was changed/.test(msg), 'stop: ' + msg.slice(0, 50));
  const left = await fr2.evaluate(() => document.getElementById('editor').querySelectorAll('ul li').length);
  ok(left === 3, 'stopped: the chapter is still there (' + left + ' list items)');
  ok(s.errs.length === 0, 'no page errors ' + JSON.stringify(s.errs.slice(0, 3)));
  await s.ctx.close();
  // 6. a changed reader is refused
  s = await session('tampered');
  msg = await open(s.fr, 'pdfwork/article.pdf', /Opened|could not|not the published/);
  ok(/not the published one/.test(msg) && !(await s.fr.evaluate(() => window.__evil)), 'tampered reader refused: ' + msg.slice(0, 80));
  await s.ctx.close();
  // 7. offline the first time
  s = await session('offline');
  msg = await open(s.fr, 'pdfwork/article.pdf', /Opened|could not|not the published/);
  ok(/needed once, with a connection/.test(msg), 'offline: ' + msg.slice(0, 80));
  await s.ctx.close();
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
  await b.close();
})();
