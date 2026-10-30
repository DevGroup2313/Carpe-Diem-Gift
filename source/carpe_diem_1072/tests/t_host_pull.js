// host_pull.js <page> <program.py>: the page asks the app's real program (loaded by serve.py) for the files Open With gave it
const { chromium } = require('playwright');
const fs = require('fs'), cp = require('child_process'), readline = require('readline');
const S = process.env.CD_TEST_DIR || (__dirname + '/');
(async () => {
  const [page_, prog] = process.argv.slice(2);
  const log = require('os').tmpdir() + '/cd_pull.log'; try { fs.unlinkSync(log); } catch (e) { }
  const py = cp.spawn('python3', [__dirname + '/serve_host_api.py', prog, log, S + 'docs/chapter.docx', S + 'pdfwork/article.pdf', S + 'docs/plain.txt']);
  const rl = readline.createInterface({ input: py.stdout }); const waiting = [];
  rl.on('line', l => { const w = waiting.shift(); if (w) w(JSON.parse(l)); });
  py.stderr.on('data', d => process.stderr.write(d));
  await new Promise(r => waiting.push(r));
  const call = (m, a) => new Promise(r => { waiting.push(r); py.stdin.write(JSON.stringify({ m, a }) + '\n'); });
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  await ctx.route('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/*', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(S + 'vendor_pdfjs/x/package/legacy/build/' + r.request().url().split('/').pop()) }));
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const dialogs = []; p.on('dialog', d => { dialogs.push(d.message().slice(0, 50)); d.accept(); });
  await p.exposeFunction('__py', (m, a) => call(m, a));
  await p.addInitScript(() => { window.pywebview = { api: { take_file: w => window.__py('take_file', [w]), file_part: (k, i) => window.__py('file_part', [k, i]), file_opened: (n, h) => window.__py('file_opened', [n, h]) } }; });
  const t0 = Date.now();
  await p.goto('http://127.0.0.1:8765/' + page_, { waitUntil: 'load', timeout: 120000 });
  const rec = () => { try { return fs.readFileSync(log, 'utf8'); } catch (e) { return ''; } };
  for (let k = 0; k < 160; k++) { await p.waitForTimeout(500); if (/article\.pdf opened/.test(rec())) break; }
  const lines = rec().split('\n').filter(l => /file/.test(l)).map(l => l.replace(/=== \S+\s+/, '').replace(/ ===$/, ''));
  const t = await p.evaluate(() => { const d = document.getElementById('frame-tabula').contentDocument; return { title: d.getElementById('docTitle').value, refs: d.querySelectorAll('#editor sup.fn-ref').length }; });
  const ok = lines.includes('file: chapter.docx opened') && lines.includes('file: article.pdf opened') && !lines.some(l => /plain\.txt/.test(l)) && t.title === 'article' && t.refs === 10 && errs.length === 0;
  console.log(ok ? 'PASS' : 'FAIL', Math.round((Date.now() - t0) / 1000) + ' s', JSON.stringify(lines), JSON.stringify(t), 'asked:', JSON.stringify(dialogs), 'errors:', JSON.stringify(errs.slice(0, 2)));
  await b.close(); py.kill();
})();
