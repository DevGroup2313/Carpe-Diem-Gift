// host_open.js <page>: a file handed by the app (as the Mac and Windows apps do) opens in Tabula; a file dropped on the desk too
const { chromium } = require('playwright');
const fs = require('fs');
const S = process.env.CD_TEST_DIR || (__dirname + '/');
(async () => {
  const b = await chromium.launch(); let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  await ctx.route('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/*', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(S + 'vendor_pdfjs/x/package/legacy/build/' + r.request().url().split('/').pop()) }));
  await ctx.addInitScript(() => { window.__rep = []; window.pywebview = { api: { file_opened: (n, h) => { window.__rep.push(n + ': ' + h); return Promise.resolve(true); } } }; });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const dialogs = []; p.on('dialog', d => { dialogs.push(d.message().slice(0, 60)); d.accept(); });
  await p.goto('http://127.0.0.1:8765/' + process.argv[2], { waitUntil: 'load', timeout: 120000 });
  await p.waitForTimeout(6000);
  const doorVis = () => p.evaluate(() => { const d = document.getElementById('cd-door'); if (!d) return false; const cs = getComputedStyle(d); return cs.display !== 'none' && cs.visibility !== 'hidden' && d.getBoundingClientRect().width > 0; });
  const doorUp = await doorVis();
  async function hand(file, name) {
    const b64 = fs.readFileSync(S + file).toString('base64');
    await p.evaluate(([b64, name]) => { window.__cdIn = window.__cdIn || {}; window.__cdIn.k1 = ''; for (let i = 0; i < b64.length; i += 1 << 20) window.__cdIn.k1 += b64.slice(i, i + (1 << 20)); return window.cdHostOpenFile(name, 'k1'); }, [b64, name]);
    for (let k = 0; k < 80; k++) { await p.waitForTimeout(250); const r = await p.evaluate(() => window.__rep.slice()); if (r.some(x => x.startsWith(name))) return r.filter(x => x.startsWith(name)).pop(); }
    return '(no report)';
  }
  const tab = () => p.evaluate(() => { const f = document.getElementById('frame-tabula'); const d = f && f.contentDocument; const ed = d && d.getElementById('editor'); return ed ? { h: [...ed.querySelectorAll('h1,h2')].map(x => x.textContent).slice(0, 3), refs: ed.querySelectorAll('sup.fn-ref').length, title: d.getElementById('docTitle').value, shown: f.getBoundingClientRect().width } : null; });
  let r = await hand('docs/chapter.docx', 'chapter.docx');
  const doorAfter = await doorVis();
  let t = await tab();
  ok(!doorAfter && r === 'chapter.docx: opened' && t && t.title === 'chapter' && t.refs === 2 && t.shown > 0, 'Word file handed by the app, door up=' + doorUp + ' then ' + doorAfter + ': ' + r + ' ' + JSON.stringify(t));
  r = await hand('pdfwork/article.pdf', 'article.pdf');
  t = await tab();
  ok(r === 'article.pdf: opened' && t.title === 'article' && t.refs === 10, 'PDF handed by the app over the Word one: ' + r + ' ' + JSON.stringify(t) + ' asked: ' + JSON.stringify(dialogs));
  // a Word file dropped on the desk: the full reader, footnotes and all
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(5000); await p.evaluate(() => cdCloseDoor()); await p.waitForTimeout(800);
  const dropped = async (file, name, type) => { const b64 = fs.readFileSync(S + file).toString('base64'); await p.evaluate(([b64, name, type]) => { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); window.cdOpenDocument(new File([u], name, { type })); }, [b64, name, type]); await p.waitForTimeout(7000); return p.evaluate(() => { const out = []; document.querySelectorAll('iframe').forEach(f => { try { const d = f.contentDocument, ed = d && d.getElementById('editor'); if (ed && f.getBoundingClientRect().width > 0) out.push({ title: d.getElementById('docTitle').value, refs: ed.querySelectorAll('sup.fn-ref').length, notes: d.querySelectorAll('#footnotes .fn[data-nid]').length }); } catch (e) { } }); return out; }); };
  let d1 = await dropped('docs/chapter.docx', 'chapter.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  ok(d1.some(x => x.title === 'chapter' && x.refs === 2 && x.notes === 2), 'Word file dropped on the desk: full reader, notes kept ' + JSON.stringify(d1));
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(5000); await p.evaluate(() => cdCloseDoor()); await p.waitForTimeout(800);
  let d2 = await dropped('pdfwork/article.pdf', 'article.pdf', 'application/pdf');
  ok(d2.some(x => x.title === 'article' && x.refs === 10), 'PDF dropped on the desk opens in Tabula ' + JSON.stringify(d2) + ' dialogs ' + JSON.stringify(dialogs.slice(-2)));
  ok(!dialogs.some(x => /Carpe Diem opens Word|This is a PDF/.test(x)), 'no refusal');
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
  await b.close();
})();
