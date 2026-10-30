// t_eval.js URL: an evaluation copy as a panel member meets it: the terms before it first opens (the committee's), the
// mark at the foot of the screen, each room working (Tabula: typing and bold; Abacus: a sum; Imago, Scriba and Fontes
// open), the seal intact after the scripts were made compact, the mini Forge and the page's photograph of itself gone,
// and no error in the page or its rooms.
const { chromium } = require('playwright');
const URL_ = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('page: ' + e.message.slice(0, 200)));
  p.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  await p.goto(URL_, { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(3500);
  const out = {};
  out.terms = await p.evaluate(() => { const t = document.getElementById('cd-eval-terms'); return t ? t.innerText.slice(0, 160).replace(/\s+/g, ' ') : null; });
  out.mark = await p.evaluate(() => (document.getElementById('cd-eval-mark') || {}).textContent || null);
  await p.evaluate(() => { const b = document.querySelector('#cd-eval-terms button'); if (b) b.click(); });
  out.accepted = await p.evaluate(() => Object.keys(localStorage).filter(k => /^cd_eval_terms_/.test(k)));
  out.gone = await p.evaluate(() => ({ forgePack: !!document.getElementById('cd-forge-pack'), selfSrc: (document.getElementById('cd-self-src-data') || {}).textContent ? true : false, CD_SELF_SRC: (window.CD_SELF_SRC || '').length }));
  out.seal = await p.evaluate(() => window.cdSealCheck ? window.cdSealCheck() : 'no check');
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Go to Home|Aller à l’accueil|Take a tour/.test(x.textContent)); if (b) b.click(); try { if (typeof cdCloseDoor === 'function') cdCloseDoor(); } catch (e) {} });
  await p.waitForTimeout(1000);
  const rooms = {};
  for (const w of ['tabula', 'abacus', 'slides', 'scriba', 'fontes']) {
    await p.evaluate(w => openExt(w), w);
    await p.waitForTimeout(4000);
    rooms[w] = await p.evaluate(async (w) => {
      const f = document.getElementById('frame-' + w); if (!f) return 'no frame';
      const d = f.contentDocument, win = f.contentWindow; if (!d) return 'no document';
      const r = { title: (d.title || '').slice(0, 40), body: (d.body && d.body.innerText || '').length };
      try {
        if (w === 'tabula') {
          const ed = d.getElementById('editor'); ed.focus();
          d.execCommand('selectAll'); d.execCommand('insertText', false, 'Evaluation test words');
          const range = d.createRange(); range.selectNodeContents(ed); const sel = win.getSelection(); sel.removeAllRanges(); sel.addRange(range);
          const bold = d.querySelector('[data-cmd="bold"],#bBold,button[title^="Bold"],button[aria-label^="Bold"]');
          if (bold) bold.click(); else d.execCommand('bold');
          r.typed = ed.innerText.trim().slice(0, 40); r.bold = !!ed.querySelector('b,strong,[style*="bold"],[style*="700"]');
        }
        if (w === 'abacus') {
          const nb = d.getElementById('nameBox') || d.querySelector('input[aria-label*="Name"],#namebox');
          r.grid = !!d.getElementById('grid');
          const cells = d.querySelectorAll('#grid td, #grid [data-cell], .cell');
          r.cells = cells.length;
        }
        if (w === 'slides') r.objbar = !!d.getElementById('objbar');
      } catch (e) { r.err = String(e.message || e).slice(0, 160); }
      return r;
    }, w);
    await p.evaluate(w => { try { closeExt(w); } catch (e) {} }, w);
    await p.waitForTimeout(600);
  }
  out.rooms = rooms;
  // Abacus: a sum typed as a person types it
  await p.evaluate(() => openExt('abacus')); await p.waitForTimeout(3500);
  const fr = p.frameLocator('#frame-abacus');
  try {
    const cellA1 = await p.evaluate(() => { const d = document.getElementById('frame-abacus').contentDocument; const c = d.querySelector('[data-r="0"][data-c="0"],[data-ref="A1"],#A1,td[data-cell="A1"]'); if (!c) return null; const r = c.getBoundingClientRect(); const fr = document.getElementById('frame-abacus').getBoundingClientRect(); return [fr.left + r.left + r.width / 2, fr.top + r.top + r.height / 2]; });
    if (cellA1) {
      await p.mouse.click(cellA1[0], cellA1[1]); await p.keyboard.type('2'); await p.keyboard.press('Enter');
      await p.keyboard.type('3'); await p.keyboard.press('Enter'); await p.keyboard.type('=SUM(A1:A2)'); await p.keyboard.press('Enter');
      await p.waitForTimeout(600);
      out.abacusSum = await p.evaluate(() => { const d = document.getElementById('frame-abacus').contentDocument; const c = d.querySelector('[data-r="2"][data-c="0"],[data-ref="A3"],#A3,td[data-cell="A3"]'); return c ? c.textContent.trim() : 'no A3'; });
    } else out.abacusSum = 'no A1 found';
  } catch (e) { out.abacusSum = 'error ' + e.message.slice(0, 120); }
  out.forgeNote = await p.evaluate(() => [...document.scripts].some(s => s.textContent.indexOf('is not part of this copy') >= 0));
  out.errs = errs.slice(0, 12);
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
