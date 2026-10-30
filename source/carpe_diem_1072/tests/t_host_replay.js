// host_replay.js <page> <sent.json>: the calls an app's program made, run in the page as pywebview would run them
const { chromium } = require('playwright');
const fs = require('fs');
const S = process.env.CD_TEST_DIR || (__dirname + '/');
(async () => {
  const [page_, sentFile] = process.argv.slice(2);
  const sent = JSON.parse(fs.readFileSync(sentFile));
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  await ctx.route('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/*', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(S + 'vendor_pdfjs/x/package/legacy/build/' + r.request().url().split('/').pop()) }));
  await ctx.addInitScript(() => { window.__rep = []; window.pywebview = { api: { file_opened: (n, h) => { window.__rep.push(n + ': ' + h); return Promise.resolve(true); } } }; });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const dialogs = []; p.on('dialog', d => { dialogs.push(d.message().slice(0, 50)); d.accept(); });
  await p.goto('http://127.0.0.1:8765/' + page_, { waitUntil: 'load', timeout: 120000 });
  await p.waitForTimeout(6000);
  for (const js of sent) await p.evaluate(js => (0, eval)(js), js);   // back to back, as the program sends them
  for (let k = 0; k < 120; k++) { await p.waitForTimeout(250); if ((await p.evaluate(() => window.__rep.length)) >= 2) break; }
  const rep = await p.evaluate(() => window.__rep);
  const t = await p.evaluate(() => { const d = document.getElementById('frame-tabula').contentDocument; return { title: d.getElementById('docTitle').value, refs: d.querySelectorAll('#editor sup.fn-ref').length, notes: d.querySelectorAll('#footnotes .fn[data-nid]').length }; });
  const ok = rep.join('|') === 'chapter.docx: opened|article.pdf: opened' && t.title === 'article' && t.refs === 10 && t.notes === 10 && errs.length === 0;
  console.log(ok ? 'PASS' : 'FAIL', 'reports:', JSON.stringify(rep), 'Tabula now:', JSON.stringify(t), 'asked:', JSON.stringify(dialogs), 'errors:', JSON.stringify(errs.slice(0, 2)));
  await b.close();
})();
