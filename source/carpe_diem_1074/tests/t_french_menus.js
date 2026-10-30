// t_french_menus.js URL: with Carpe Diem in French, the right-click menu and a note's menu (⋯) and keys, as a person
// meets them in Carpe Diem itself, in Tabula, and in the mini Forge (its own notes); every word is listed.
const { chromium } = require('playwright');
const URL_ = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('carpe_diem_offline_v1')) localStorage.setItem('carpe_diem_offline_v1', JSON.stringify({ lang: 'fr', theme: 'light' })); } catch (e) {} });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('page: ' + e.message.slice(0, 200)));
  await p.goto(URL_, { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(3500);
  await p.evaluate(() => { try { if (typeof cdCloseDoor === 'function') cdCloseDoor(); } catch (e) {} try { setLang('fr'); } catch (e) {} });
  await p.waitForTimeout(800);
  const out = {};
  async function noteMenus(frame, label) {
    const r = await frame.evaluate(async () => {
      newStickyNote(); await new Promise(r => setTimeout(r, 500));
      const card = [...document.querySelectorAll('.sticky-note')].pop(); if (!card) return 'no note';
      const titles = [...card.querySelectorAll('[title]')].map(e => e.getAttribute('title'));
      const dots = [...card.querySelectorAll('.sn-iconbtn')].find(b => b.textContent === '⋯'); dots.click();
      await new Promise(r => setTimeout(r, 400));
      const rows = [...document.querySelectorAll('.btn.btn-soft.btn-sm')].filter(b => b.offsetParent && /note|Tabula|Notes|Liste|Supprimer|Réduire|Détacher|Envoyer|Déplier|Minimise|Unpin|Delete/.test(b.textContent)).map(b => b.textContent);
      document.querySelectorAll('div').forEach(d => { if (d.style && d.style.position === 'fixed' && d.style.inset === '0px' && d.querySelector('[data-sn-col]')) d.remove(); });
      const body = card.querySelector('.sn-body'); body.focus(); body.textContent = 'Un mot pour le menu';
      const r = body.getBoundingClientRect();
      return { titles, rows, at: [r.left + 30, r.top + 12], ph: body.getAttribute('data-ph') };
    });
    if (typeof r === 'string') { out[label] = r; return; }
    out[label + ' note keys'] = r.titles; out[label + ' note menu'] = r.rows; out[label + ' note placeholder'] = r.ph;
    return r.at;
  }
  async function ctxMenu(frame, x, y, label, offset) {
    const ox = offset ? offset[0] : 0, oy = offset ? offset[1] : 0;
    await p.mouse.click(x + ox, y + oy, { button: 'right' });
    await p.waitForTimeout(500);
    out[label + ' right-click'] = await frame.evaluate(() => {
      const m = [...document.querySelectorAll('.cd-ctx-panel,[data-cd-cmenu]')].filter(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 10).pop();
      return m ? [...m.querySelectorAll('button')].map(x => x.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean) : 'no menu';
    });
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  }
  // Carpe Diem itself
  const at = await noteMenus(p.mainFrame(), 'Carpe Diem');
  if (at) await ctxMenu(p.mainFrame(), at[0], at[1], 'Carpe Diem');
  // Tabula
  await p.evaluate(() => openExt('tabula')); await p.waitForTimeout(5000);
  const tf = await (await p.$('#frame-tabula')).contentFrame();
  const tr = await p.evaluate(() => { const f = document.getElementById('frame-tabula'); const fr = f.getBoundingClientRect(); const d = f.contentDocument; const ed = d.getElementById('editor'); ed.focus(); const r = ed.getBoundingClientRect(); return [fr.left + r.left + 60, fr.top + r.top + 30]; });
  await ctxMenu(tf, tr[0], tr[1], 'Tabula');
  await p.evaluate(() => { try { closeExt('tabula'); } catch (e) {} });
  // the mini Forge's own notes and right-click menu
  await p.evaluate(() => window.cdForgePanel());
  let fr = null;
  for (let i = 0; i < 150; i++) {
    await p.waitForTimeout(1000);
    const fe = await p.$('#cd-forge-panel iframe'); fr = fe ? await fe.contentFrame() : null;
    if (fr && i > 15) { const ok = await fr.evaluate(() => { const fb = document.getElementById('forge-boot'); return !!document.getElementById('room-editor') && (!fb || /fb-gone/.test(fb.className)); }).catch(() => false); if (ok) break; }
  }
  await p.waitForTimeout(2500);
  const fat = await noteMenus(fr, 'mini Forge');
  const fbox = await p.evaluate(() => { const r = document.querySelector('#cd-forge-panel iframe').getBoundingClientRect(); return [r.left, r.top]; });
  if (fat) await ctxMenu(fr, fat[0], fat[1], 'mini Forge', fbox);
  // and by the page's own event, on the note's words selected
  out['mini Forge right-click (event)'] = await fr.evaluate(async () => {
    const body = [...document.querySelectorAll('.sticky-note .sn-body')].pop(); if (!body) return 'no note';
    const rg = document.createRange(); rg.selectNodeContents(body); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(rg);
    const r = body.getBoundingClientRect();
    body.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: r.left + 20, clientY: r.top + 10, button: 2 }));
    await new Promise(res => setTimeout(res, 400));
    const m = [...document.querySelectorAll('.cd-ctx-panel,[data-cd-cmenu]')].filter(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 10).pop();
    return m ? [...m.querySelectorAll('button')].map(x => x.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean) : ('no menu; lang ' + (typeof state !== 'undefined' ? state.lang : '?') + '; wired ' + !!document.__cdCtxWired + '; at ' + JSON.stringify([r.left, r.top, r.width]));
  });
  out.errs = errs;
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
