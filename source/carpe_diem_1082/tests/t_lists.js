// t_lists.js TABULA_URL [engines]: Tabula's pages with lists. A list that reaches a page's end is split there: no page is
// left with more empty room than the next line needs, no line stands in the gap between two pages, a moved item keeps
// its bullet beside it, typing inside a split list keeps it split, and a file made from the document has no page marks.
const pw = require('playwright');
const URL = process.argv[2], ENG = (process.argv[3] || 'chromium,webkit,firefox').split(',');
async function launch(n) { return n === 'chromium' ? pw.chromium.launch(process.env.CD_CHROMIUM ? { executablePath: process.env.CD_CHROMIUM } : {}) : pw[n].launch(); }
const LONG = ' and this item goes on for a good while so that it runs over several lines of the page, as a full sentence in a set of notes would, with one clause after another until it finally ends';
const DOCS = {
  plain: (function () { let h = '<h1>One</h1>'; for (let i = 0; i < 7; i++) h += '<p>Paragraph ' + (i + 1) + '. ' + 'The quick brown fox jumps over the lazy dog and keeps on running through the field. '.repeat(4) + '</p>';
    h += '<p>The points are these:</p><ol>'; for (let i = 0; i < 70; i++) h += '<li>Numbered step ' + (i + 1) + '</li>'; return h + '</ol><p>The end.</p>'; })(),
  long: (function () { let h = '<p>Notes.</p><ul>'; for (let i = 0; i < 26; i++) h += '<li>Point ' + (i + 1) + (i % 2 ? LONG + LONG : LONG) + '</li>'; return h + '</ul><p>After.</p>'; })(),
  nested: (function () { let h = '<p>Outline.</p><ul>'; for (let i = 0; i < 12; i++) { h += '<li>Head ' + (i + 1) + (i % 3 === 0 ? LONG : '') + '<ul>'; for (let j = 0; j < 5; j++) h += '<li>Sub ' + (i + 1) + '.' + (j + 1) + (j === 2 ? LONG : '') + (j === 4 ? '<ol><li>deep a</li><li>deep b</li></ol>' : '') + '</li>'; h += '</ul></li>'; } return h + '</ul><p>After.</p>'; })(),
};
const MEASURE = () => {
  var ed = document.getElementById('editor'), er = ed.getBoundingClientRect();
  var seps = [].map.call(document.querySelectorAll('#pageguides .pg-sep'), function (s) { return parseFloat(s.style.top) - ed.offsetTop; });
  var w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT, null), n, lines = [];
  while ((n = w.nextNode())) { var rg = document.createRange(); rg.selectNodeContents(n); var rs = rg.getClientRects(); for (var i = 0; i < rs.length; i++) if (rs[i].height > 2 && rs[i].width > 0.5) lines.push([rs[i].top - er.top, rs[i].bottom - er.top]); }
  lines.sort(function (a, b) { return a[0] - b[0]; });
  var out = { pages: seps.length + 1, worstEmpty: 0, inGap: 0, lines: lines.length, lost: 0 };
  seps.forEach(function (s) { var limit = s - 50, start = s + 104, last = 0;
    lines.forEach(function (l) { if (l[1] <= limit + 6) last = Math.max(last, l[1]); if (l[0] > limit + 1 && l[0] < start - 6) out.inGap++; });
    out.worstEmpty = Math.max(out.worstEmpty, Math.round(limit - last)); });
  // a moved item's own first line begins where the item begins (its bullet is drawn beside that line)
  [].forEach.call(ed.querySelectorAll('li[data-pgpush]'), function (li) { var rg = document.createRange(); rg.selectNodeContents(li); var r = rg.getClientRects()[0], b = li.getBoundingClientRect(); if (!r || Math.abs(r.top - b.top) > 14) out.lost++; });
  out.pushed = ed.querySelectorAll('li[data-pgpush]').length; out.cut = ed.querySelectorAll('li[data-pgcut]').length;
  out.wholeListsPushed = ed.querySelectorAll(':scope > ul[data-pgpush], :scope > ol[data-pgpush]').length;
  return out;
};
(async () => {
  let bad = 0;
  for (const e of ENG) {
    const b = await launch(e);
    for (const name of Object.keys(DOCS)) {
      const c = await b.newContext({ viewport: { width: 1300, height: 1000 } }); const p = await c.newPage(); const errs = [];
      p.on('pageerror', x => errs.push(String(x.message).slice(0, 140)));
      await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1200);
      await p.evaluate((html) => { var ed = document.getElementById('editor'); ed.innerHTML = html; ed.dispatchEvent(new Event('input', { bubbles: true })); }, DOCS[name]);
      await p.waitForTimeout(2200);
      const m1 = await p.evaluate(MEASURE);
      // type inside an item near the first page end: the layout is made again from there
      await p.evaluate(() => { var ed = document.getElementById('editor'), lis = ed.querySelectorAll('li'), li = lis[Math.min(lis.length - 1, 6)]; var r = document.createRange(); r.selectNodeContents(li.firstChild || li); r.collapse(false); var s = getSelection(); s.removeAllRanges(); s.addRange(r); ed.focus(); document.execCommand('insertText', false, ' typed words that add to this item'); });
      await p.waitForTimeout(1800);
      const m2 = await p.evaluate(MEASURE);
      const marks = await p.evaluate(() => { var d = document.createElement('div'); d.appendChild(document.getElementById('editor').cloneNode(true)); if (typeof window.cdPageMarksOff !== 'function') return { len: 0, marks: -1, big: -1 }; window.cdPageMarksOff(d); return { len: d.innerHTML.length, marks: d.querySelectorAll('[data-pgpush],[data-pgcut]').length, big: [].filter.call(d.querySelectorAll('li,p,ul,ol'), function (x) { return parseFloat(x.style.marginTop) > 60; }).length }; });
      const lineH = 28;
      const ok = [m1, m2].every(m => m.pages >= 2 && m.worstEmpty <= lineH + 6 && m.inGap === 0 && m.lost === 0 && m.wholeListsPushed === 0) && marks.len > 100 && marks.marks === 0 && marks.big === 0 && !errs.length;
      if (!ok) bad++;
      console.log((ok ? 'ok  ' : 'BAD ') + e.padEnd(8) + name.padEnd(7) + JSON.stringify(m1) + ' typed ' + JSON.stringify({ pages: m2.pages, worstEmpty: m2.worstEmpty, inGap: m2.inGap, lost: m2.lost }) + ' file ' + JSON.stringify(marks) + (errs.length ? ' errors ' + errs[0] : ''));
      await c.close();
    }
    await b.close();
  }
  console.log(bad ? 'FAIL' : 'PASS'); process.exit(bad ? 1 : 0);
})();
