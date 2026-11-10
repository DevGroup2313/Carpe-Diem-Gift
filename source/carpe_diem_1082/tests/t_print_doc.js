// t_print_doc.js TABULA_URL OUTDIR: what Tabula sends to the printer. A document with coloured text, a highlight, shaded
// cells, a picture and a long list is printed to PDF by day and by night, with and without page numbers; the pages must
// carry colour, be white by night too, hold every word once, and (in Chromium) carry the page numbers.
const pw = require('playwright'), fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const URL = process.argv[2], OUT = process.argv[3];
const SAMPLE = `<h1 style="color:#b3261e">Red heading</h1>
<p>Plain text, then <span style="color:#1565c0">blue words</span>, <span style="background-color:#ffeb3b">yellow highlight</span>, <b style="color:#2e7d32">green bold</b> and <font color="#8e24aa">purple by font tag</font>.</p>
<p style="background-color:#e3f2fd">A paragraph on a pale blue ground.</p>
<table style="border-collapse:collapse;width:100%"><tr><th style="background:#1b6b93;color:#fff;border:1px solid #333;padding:6px">Head A</th><th style="background:#1b6b93;color:#fff;border:1px solid #333;padding:6px">Head B</th></tr><tr><td style="border:1px solid #333;padding:6px;background:#fff3e0">orange cell</td><td style="border:1px solid #333;padding:6px">plain cell</td></tr></table>
<p><img alt="pic" width="220" height="120" src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='120'%3E%3Crect width='110' height='120' fill='%23e53935'/%3E%3Crect x='110' width='110' height='120' fill='%2343a047'/%3E%3C/svg%3E"></p>
<ol>` + Array.from({ length: 60 }, (_, i) => '<li>Numbered step ' + (i + 1) + ' zqx' + (i + 1) + 'w</li>').join('') + '</ol><p>The end of it.</p>';
(async () => {
  const b = await pw.chromium.launch(process.env.CD_CHROMIUM ? { executablePath: process.env.CD_CHROMIUM } : {});
  let bad = 0;
  for (const night of [false, true]) for (const pn of [false, true]) {
    const c = await b.newContext({ viewport: { width: 1300, height: 900 } }); const p = await c.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(String(e.message).slice(0, 140)));
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1200);
    const html = await p.evaluate(([html, night, pn]) => {
      var ed = document.getElementById('editor'); ed.innerHTML = html; ed.dispatchEvent(new Event('input', { bubbles: true }));
      if (night) document.documentElement.classList.add('cd-dark');
      if (pn) { window.__cdPN.on = true; window.__cdPN.fmt = 'pageOf'; window.__cdPN.align = 'center'; var h = document.getElementById('docheader'); h.style.display = 'block'; h.textContent = 'Running header qhq'; }
      return new Promise(function (res) { setTimeout(function () { res(window.cdPrintHtml('Sample')); }, 1500); });
    }, [SAMPLE, night, pn]);
    const tag = (night ? 'night' : 'day') + (pn ? '_pn' : '');
    const q = await c.newPage(); await q.setContent(html, { waitUntil: 'load' });
    const pdf = path.join(OUT, 'print_' + tag + '.pdf');
    await q.pdf({ path: pdf, printBackground: false, preferCSSPageSize: true });
    const text = execFileSync('pdftotext', ['-layout', pdf, '-']).toString();
    const pages = (text.match(/\f/g) || []).length;
    execFileSync('pdftoppm', ['-r', '40', '-png', '-f', '1', '-l', '1', pdf, path.join(OUT, 'print_' + tag)]);
    const stat = JSON.parse(execFileSync('python3', ['-c', `
import sys,json,glob
from PIL import Image
import numpy as np
f=sorted(glob.glob(sys.argv[1]+'-*.png'))[0]
a=np.asarray(Image.open(f).convert('RGB')).astype(int)
print(json.dumps({"colour":round(float(((a.max(axis=2)-a.min(axis=2))>40).mean())*100,2),"lum":int(a.mean())}))`, path.join(OUT, 'print_' + tag)]).toString());
    const once = [1, 30, 60].every(i => (text.match(new RegExp('zqx' + i + 'w', 'g')) || []).length === 1);
    const marks = /data-pgpush|data-pgcut|contenteditable/.test(html.slice(html.indexOf('<body')));
    const numbered = /Page 1 of \d/.test(text) && /Running header qhq/.test(text);
    const hdrCount = (text.match(/Running header qhq/g) || []).length;
    const ok = stat.colour > 5 && stat.lum > 225 && pages >= 2 && once && !marks && (!pn || (numbered && hdrCount === pages)) && !errs.length;
    if (!ok) bad++;
    console.log((ok ? 'ok  ' : 'BAD ') + tag.padEnd(9) + JSON.stringify({ pages, colour: stat.colour, lum: stat.lum, everyWordOnce: once, pageMarks: marks, numbered, headerOnPages: hdrCount, bytes: html.length }) + (errs.length ? ' ' + errs[0] : ''));
    await c.close();
  }
  await b.close(); console.log(bad ? 'FAIL' : 'PASS'); process.exit(bad ? 1 : 0);
})();
