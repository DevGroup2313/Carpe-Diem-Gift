// repro2.js URL OUT: the mini Forge in French (Carpe Diem in French), its toolbars pressed one by one; after each
// press, what changed in the next 1.5 seconds (text set and set back, attributes) and screenshots at once and later.
const { chromium } = require('playwright');
const [URL_, OUT] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1500, height: 950 } });
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('carpe_diem_offline_v1')) localStorage.setItem('carpe_diem_offline_v1', JSON.stringify({ lang: 'fr', theme: 'light' })); } catch (e) {} });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('page: ' + e.message.slice(0, 200)));
  await p.goto(URL_, { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(3000);
  await p.evaluate(() => { try { if (typeof cdCloseDoor === 'function') cdCloseDoor(); } catch (e) {} try { setLang('fr'); } catch (e) {} });
  await p.waitForTimeout(800);
  await p.evaluate(() => window.cdForgePanel());
  let fr = null;
  for (let i = 0; i < 150; i++) {
    await p.waitForTimeout(1000);
    const fe = await p.$('#cd-forge-panel iframe'); fr = fe ? await fe.contentFrame() : null;
    if (fr && i > 15) {
      const ok = await fr.evaluate(() => { const fb = document.getElementById('forge-boot'); return !!document.getElementById('room-editor') && (!fb || /fb-gone/.test(fb.className)) && /\.html/.test((document.getElementById('curName') || {}).textContent || ''); }).catch(() => false);
      if (ok) break;
    }
  }
  await p.waitForTimeout(3000);
  console.log('lang:', JSON.stringify(await fr.evaluate(() => ({ state: typeof state !== 'undefined' && state ? state.lang : 'no state', html: document.documentElement.lang, mini: window.__cdMiniLang, fgl: document.documentElement.getAttribute('data-fg-lang') }))));
  await fr.evaluate(() => {
    window.__rec = []; window.__t0 = 0;
    const o = new MutationObserver(ms => { const t = Math.round(performance.now() - window.__t0); for (const m of ms) {
      if (m.type === 'characterData') window.__rec.push([t, 'chars', (m.oldValue || '').trim().slice(0, 30) + ' -> ' + (m.target.nodeValue || '').trim().slice(0, 30)]);
      else if (m.type === 'childList') { const tx = [...m.addedNodes].map(n => (n.textContent || '').trim().slice(0, 24)).filter(Boolean).join('|'); const rm = [...m.removedNodes].map(n => (n.textContent || '').trim().slice(0, 24)).filter(Boolean).join('|'); if (tx || rm) window.__rec.push([t, 'child', (m.target.id || m.target.className || m.target.tagName) + ': ' + rm + ' -> ' + tx]); }
      else window.__rec.push([t, 'attr', (m.target.id || m.target.className || m.target.tagName).toString().slice(0, 30) + ' ' + m.attributeName + '=' + String(m.target.getAttribute(m.attributeName)).slice(0, 40)]);
    } });
    o.observe(document.body, { childList: true, subtree: true, characterData: true, characterDataOldValue: true, attributes: true, attributeOldValue: true });
  });
  async function press(label, sel) {
    const el = await fr.$(sel);
    if (!el) { console.log(label, ': not found', sel); return; }
    await fr.evaluate(() => { window.__rec = []; window.__t0 = performance.now(); });
    await el.click();
    await p.waitForTimeout(40);
    await p.screenshot({ path: OUT + '_' + label + '_a.png' });
    await p.waitForTimeout(1500);
    await p.screenshot({ path: OUT + '_' + label + '_b.png' });
    const rec = await fr.evaluate(() => window.__rec.slice(0, 400));
    const n = { chars: 0, child: 0, attr: 0 }; rec.forEach(r => n[r[1]]++);
    console.log('\n== ' + label + ': ' + JSON.stringify(n));
    rec.filter(r => r[1] !== 'attr').slice(0, 30).forEach(r => console.log('  ', r.join(' ')));
    const at = {}; rec.filter(r => r[1] === 'attr').forEach(r => { const k = r[2].replace(/=.*/, ''); at[k] = (at[k] || 0) + 1; });
    console.log('   attrs:', JSON.stringify(Object.entries(at).sort((a, b) => b[1] - a[1]).slice(0, 12)));
  }
  await press('appkey', '.hd-appkey');
  await press('appkey_close', '.hd-appkey');
  await press('zoomout', '#zoomOut');
  await press('zoomin', '#zoomIn');
  await press('zoomlvl', '#zoomLvl');
  await press('stagemore', '#stagebar > .hd-more > .hd-more-key');
  await press('stagemore_close', '#stagebar > .hd-more > .hd-more-key');
  await press('full', '#fullBtn');
  await press('full_back', '#fullBtn');
  await press('roommore', '#room-editor .hd-more[data-hd-kind="room"] > .hd-more-key');
  console.log('\nerrors:', errs.join('\n'));
  await b.close();
})();
