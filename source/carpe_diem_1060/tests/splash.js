const { chromium } = require('playwright');
(async () => {
  const [url, out, lang] = process.argv.slice(2);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  if (lang === 'fr') await ctx.addInitScript("try{ if(!localStorage.getItem('carpe_diem_offline_v1')) localStorage.setItem('carpe_diem_offline_v1', JSON.stringify({lang:'fr', theme:'night'})); }catch(e){}");
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 8 });
  page.goto(url, { waitUntil: 'commit', timeout: 180000 }).catch(()=>{});
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(500);
    try {
      const r = await page.evaluate(() => { const s = document.getElementById('cds-say'); const p = document.getElementById('cds-pct'); return s ? (s.textContent + ' | ' + (p ? p.textContent : '')) : null; });
      if (r) { console.log(i, r); if (i % 4 === 1) await page.screenshot({ path: out.replace('.png', '_' + i + '.png') }); }
      else if (i > 3) { const gone = await page.evaluate(() => !document.getElementById('cd-splash')); if (gone) { console.log('splash gone at', i); break; } }
    } catch (e) { }
  }
  await browser.close();
})();
