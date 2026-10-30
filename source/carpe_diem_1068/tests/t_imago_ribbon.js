// im1.js <page> : use Imago's ribbon on a word in a slide's text and report the result after each step
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await p.goto((process.env.CD_BASE || 'http://127.0.0.1:8765/') + process.argv[2], { waitUntil: 'load', timeout: 120000 });
  await p.waitForTimeout(5000); await p.evaluate(() => cdCloseDoor()); await p.waitForTimeout(800);
  await p.evaluate(() => openExt('slides')); await p.waitForTimeout(4000);
  const fh = await p.$('#frame-slides'); const fr = await fh.contentFrame(); const off = await fh.boundingBox();
  const eds = await fr.evaluate(() => [...document.querySelectorAll('[contenteditable="true"]')].filter(e => e.offsetParent).map(e => (e.id || e.className) + ' :: ' + e.textContent.trim().slice(0, 40)));
  console.log('editable parts:', JSON.stringify(eds.slice(0, 8)));
  const target = await fr.evaluate(() => { const e = [...document.querySelectorAll('[contenteditable="true"]')].filter(e => e.offsetParent && e.getBoundingClientRect().width > 200)[0]; if (!e) return null; e.setAttribute('data-t', '1'); const r = e.getBoundingClientRect(); return { x: r.x + 20, y: r.y + r.height / 2 }; });
  await p.mouse.click(off.x + target.x, off.y + target.y); await p.keyboard.press('Control+A'); await p.keyboard.type('Alpha Beta Gamma Delta');
  async function word(w) { const bx = await fr.evaluate((w) => { const ed = document.querySelector('[data-t]'); const tw = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) { const i = n.data.indexOf(w); if (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + w.length); const b = r.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; } } return null; }, w); await p.mouse.dblclick(off.x + bx.x, off.y + bx.y); await p.waitForTimeout(200); }
  async function around(w) { return fr.evaluate((w) => { const ed = document.querySelector('[data-t]'); const tw = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) { if (n.data.indexOf(w) >= 0) { const cs = getComputedStyle(n.parentElement); return { html: n.parentElement.outerHTML.slice(0, 120), weight: cs.fontWeight, color: cs.color, size: cs.fontSize, deco: cs.textDecorationLine }; } } return null; }, w); }
  const btn = (t) => fr.evaluate((t) => { const b = [...document.querySelectorAll('button')].find(x => x.offsetParent && (x.title === t || x.getAttribute('aria-label') === t)); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, t);
  async function press(t) { const c = await btn(t); if (!c) { console.log('   no button', t); return; } await p.mouse.click(off.x + c.x, off.y + c.y); await p.waitForTimeout(250); }
  await word('Beta'); await press('Bold'); console.log('bold Beta     ', JSON.stringify(await around('Beta')));
  await word('Gamma'); await press('#6E1F2E'); console.log('colour Gamma  ', JSON.stringify(await around('Gamma')));
  await word('Delta'); await press('Underline'); console.log('underline     ', JSON.stringify(await around('Delta')));
  await word('Alpha'); await press('Grow the selected text'); console.log('grow Alpha    ', JSON.stringify(await around('Alpha')));
  console.log('errors', errs);
  await b.close();
})();
