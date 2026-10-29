// usage: node run.js URL steps.json
// steps: {"viewport":[w,h], "dark":bool, "init":"js run before page scripts", "ua":"...", "steps":[{"eval":"js"},{"wait":ms},{"shot":"f.png","clip":[x,y,w,h],"full":bool},{"click":"sel"},{"mouse":[x,y]},{"key":"Escape"},{"wheel":[x,y,dy]}]}
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [url, stepsFile] = process.argv.slice(2);
  const cfg = JSON.parse(fs.readFileSync(stepsFile, 'utf8'));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: (cfg.viewport||[1400,900])[0], height: (cfg.viewport||[1400,900])[1] }, colorScheme: cfg.dark ? 'dark' : 'light', userAgent: cfg.ua || undefined, deviceScaleFactor: cfg.scale || 1 });
  if (cfg.init) await ctx.addInitScript(cfg.init);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' || (cfg.log && m.type() === 'log')) errs.push(m.type() + ': ' + m.text().slice(0, 400)); });
  page.on('dialog', d => { errs.push('dialog: ' + d.message().slice(0,200)); d.accept(cfg.dialogAnswer || '').catch(()=>{}); });
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'load', timeout: 180000 });
  console.log('load ms', Date.now() - t0);
  for (const st of cfg.steps || []) {
    try {
      if (st.wait) await page.waitForTimeout(st.wait);
      if (st.eval) { const r = await page.evaluate(st.eval); if (r !== undefined) console.log('eval:', typeof r === 'string' ? r : JSON.stringify(r, null, 1)); }
      if (st.click) await page.click(st.click, { timeout: 5000 });
      if (st.mouse) await page.mouse.move(st.mouse[0], st.mouse[1]);
      if (st.mclick) await page.mouse.click(st.mclick[0], st.mclick[1]);
      if (st.key) await page.keyboard.press(st.key);
      if (st.wheel) { await page.mouse.move(st.wheel[0], st.wheel[1]); await page.mouse.wheel(0, st.wheel[2]); }
      if (st.shot) await page.screenshot({ path: st.shot, clip: st.clip ? { x: st.clip[0], y: st.clip[1], width: st.clip[2], height: st.clip[3] } : undefined, fullPage: !!st.full });
    } catch (e) { console.log('step error', JSON.stringify(st).slice(0, 100), e.message.slice(0, 300)); }
  }
  console.log(errs.slice(0, 40).join('\n'));
  await browser.close();
})();
