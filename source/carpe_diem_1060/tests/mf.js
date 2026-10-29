const { chromium } = require('playwright');
(async () => {
  const lang = process.argv[2] || 'en';
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await page.goto('http://127.0.0.1:8765/cd1062.html', { waitUntil: 'load' });
  await page.waitForTimeout(4500);
  await page.evaluate((lang) => { const b = [...document.querySelectorAll('button')].find(x => /Go to Home/.test(x.textContent)); if (b) b.click(); if (lang === 'fr') setLang('fr'); }, lang);
  await page.waitForTimeout(800);
  await page.evaluate(() => { cdAuthor.open(); });
  await page.waitForTimeout(1500);
  await page.evaluate(() => cdForgePanel());
  // the loading page inside the mini Forge, as early as it can be read
  let splash = null;
  for (let i = 0; i < 40 && !splash; i++) {
    await page.waitForTimeout(250);
    for (const f of page.frames()) {
      try { const r = await f.evaluate(() => { const b = document.getElementById('forge-boot'); return b ? { name: (b.querySelector('.fb-name') || {}).textContent, say: (document.getElementById('fb-say') || {}).textContent, pct: (document.getElementById('fb-pct') || {}).textContent, lang: window.__cdMiniLang } : null; }); if (r) { splash = r; break; } } catch (e) {}
    }
  }
  await page.waitForTimeout(30000);
  let forge = null, frame = null;
  for (const f of page.frames()) {
    try { const r = await f.evaluate(() => (window.CD_BUILD && window.CD_BUILD.stamp === '9s88') ? { build: window.CD_BUILD, mini: window.__cdMiniForge, saved: (document.body.innerText.match(/Saved[^\n]*/) || [''])[0].slice(0, 80) } : null); if (r) { forge = r; frame = f; } } catch (e) {}
  }
  // the preview holds still while the room scrolls: measure the preview's top while scrolling the Editor's column
  let steady = null;
  if (frame) {
    steady = await frame.evaluate(async () => {
      const pv = document.querySelector('#edPreviewWrap, .ed-preview, [id*=Preview], iframe');
      const sc = (function () { let best = null; document.querySelectorAll('*').forEach(e => { const cs = getComputedStyle(e); if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && e.scrollHeight > e.clientHeight + 200) { if (!best || e.scrollHeight > best.scrollHeight) best = e; } }); return best; })();
      if (!pv || !sc) return { pv: !!pv, sc: !!sc };
      const tops = [];
      for (let i = 0; i < 30; i++) { sc.scrollTop += 37; await new Promise(r => requestAnimationFrame(() => r())); tops.push(Math.round(pv.getBoundingClientRect().top)); }
      return { scroller: sc.id || sc.className, previewTops: [...new Set(tops)].slice(0, 12), distinct: new Set(tops).size };
    });
  }
  await page.screenshot({ path: '../work/mf_' + lang + '.png' });
  console.log(JSON.stringify({ splash, forge, steady, errs: errs.slice(0, 8) }, null, 1));
  await browser.close();
})();
