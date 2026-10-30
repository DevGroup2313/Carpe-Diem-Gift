// tab2.js <page> : use Tabula's ribbon as a person would and report what the document holds after each step
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await p.goto((process.env.CD_BASE || 'http://127.0.0.1:8765/') + process.argv[2], { waitUntil: 'load', timeout: 120000 });
  await p.waitForTimeout(5000); await p.evaluate(() => { try { cdCloseDoor(); } catch (e) {} const d = document.getElementById('demo-entry'); if (d) { const g = [...d.querySelectorAll('button')].find(x => /Go to Home/.test(x.textContent)); if (g) g.click(); else d.remove(); } }); await p.waitForTimeout(1200);
  await p.evaluate(() => openExt('tabula')); await p.waitForTimeout(4000);
  const fr = await (await p.$('#frame-tabula')).contentFrame();
  fr.on && 0;
  const ed = await fr.$('#editor');
  await ed.click(); await p.keyboard.press('Control+A'); await p.keyboard.press('Delete');
  await p.keyboard.type('Alpha Beta Gamma Delta Epsilon');
  await p.keyboard.press('Enter'); await p.keyboard.type('Second line of text here');
  async function word(w) {
    const box = await fr.evaluate((w) => {
      const ed = document.getElementById('editor'); const tw = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
      let n; while ((n = tw.nextNode())) { const i = n.data.indexOf(w); if (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + w.length); const b = r.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; } }
      return null; }, w);
    const off = await (await p.$('#frame-tabula')).boundingBox();
    await p.mouse.dblclick(off.x + box.x, off.y + box.y); await p.waitForTimeout(250);
  }
  async function around(w) { return fr.evaluate((w) => { const ed = document.getElementById('editor'); const tw = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) { if (n.data.indexOf(w) >= 0) { let e = n.parentElement, out = []; while (e && e !== ed) { out.push(e.outerHTML.slice(0, 160)); e = e.parentElement; } const cs = getComputedStyle(n.parentElement); return { chain: out.slice(0, 3), weight: cs.fontWeight, color: cs.color, bg: cs.backgroundColor, size: cs.fontSize, family: cs.fontFamily.slice(0, 30), align: getComputedStyle(n.parentElement.closest('p,div,h1,h2,h3,li') || ed).textAlign }; } } return null; }, w); }
  async function step(name, w, act) { await word(w); await act(); await p.waitForTimeout(400); const r = await around(w); console.log(name.padEnd(22), JSON.stringify(r)); }
  await step('bold', 'Beta', async () => { await fr.click('button[data-cmd="bold"]'); });
  await step('italic', 'Beta', async () => { await fr.click('button[data-cmd="italic"]'); });
  await step('colour palette', 'Delta', async () => {
    await fr.click('#foreGalBtn'); await p.waitForTimeout(400);
    const sw = await fr.evaluate(() => { const pop = [...document.querySelectorAll('[class*=pal],[id*=Pal],[id*=pal],[class*=gallery],[class*=swatch]')].filter(x => x.offsetParent); const s = pop.map(x => (x.id || x.className) + ':' + x.querySelectorAll('button,[data-color],span').length); return s.slice(0, 8); });
    console.log('   palette nodes', JSON.stringify(sw));
    const clicked = await fr.evaluate(() => { const c = [...document.querySelectorAll('[data-color],[data-c],[style*="background"]')].filter(x => x.offsetParent && x.closest('[class*=pal],[id*=Pal],[id*=pal],[class*=gallery]') && x.getBoundingClientRect().width < 40); const red = c.find(x => /rgb\(2\d\d, ?0|#c00000|#ff0000|red/i.test(x.getAttribute('data-color') || x.style.background || '')) || c[5]; if (!red) return 'no swatch'; const b = red.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, what: red.outerHTML.slice(0, 120) }; });
    console.log('   swatch', JSON.stringify(clicked));
    if (clicked && clicked.x) { const off = await (await p.$('#frame-tabula')).boundingBox(); await p.mouse.click(off.x + clicked.x, off.y + clicked.y); }
  });
  await step('text colour button', 'Gamma', async () => { await fr.click('#foreColor'); });
  await step('highlight button', 'Epsilon', async () => { await fr.click('#hiliteColor'); });
  await step('size 18', 'Alpha', async () => { await fr.selectOption('#sizeSel', '18'); });
  await (async () => { await word('here'); await p.keyboard.press('End'); await fr.selectOption('#sizeSel', '24'); await fr.click('#editor', { position: { x: 5, y: 5 }, trial: true }).catch(()=>{}); await p.keyboard.type(' bigger'); await p.waitForTimeout(300); console.log('caret size 24'.padEnd(22), JSON.stringify(await around('bigger'))); })();
  await step('font Cambria', 'Second', async () => { await fr.selectOption('#fontSel', { label: 'Cambria' }); });
  await step('strike', 'line', async () => { await fr.click('button[data-cmd="strikeThrough"]'); });
  await step('underline', 'text', async () => { await fr.click('button[data-cmd="underline"]'); });
  console.log('editor html:', (await fr.evaluate(() => document.getElementById('editor').innerHTML)).slice(0, 900));
  console.log('errors', errs);
  await b.close();
})();
