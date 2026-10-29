const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  for (const f of ['cd1062.html', 'cd1063.html']) {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    await ctx.addInitScript(() => {
      const reg = window.__timerReg = [];
      const si = window.setInterval;
      window.setInterval = function (fn, ms, ...a) { const rec = { t: 0, n: 0 }; reg.push(rec); return si.call(this, function () { const t0 = performance.now(); try { return fn.apply(this, arguments); } finally { rec.t += performance.now() - t0; rec.n++; } }, ms, ...a); };
    });
    const page = await ctx.newPage();
    await page.goto('http://127.0.0.1:8765/' + f, { waitUntil: 'load', timeout: 180000 });
    await page.waitForTimeout(4000);
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Go to Home/.test(x.textContent)); if (b) b.click(); });
    await page.waitForTimeout(22000);   // idle past the 20 s threshold
    await page.evaluate(() => { window.__timerReg.forEach(r => { r.t = 0; r.n = 0; }); });
    await page.waitForTimeout(20000);
    const r = await page.evaluate(() => ({ ms: Math.round(window.__timerReg.reduce((s, x) => s + x.t, 0)), calls: window.__timerReg.reduce((s, x) => s + x.n, 0), resting: typeof window.__cdResting === 'function' ? window.__cdResting() : 'n/a' }));
    console.log(f, 'idle 20 s: ms in interval callbacks', r.ms, 'calls', r.calls, 'resting', r.resting);
    await ctx.close();
  }
  await browser.close();
})();
