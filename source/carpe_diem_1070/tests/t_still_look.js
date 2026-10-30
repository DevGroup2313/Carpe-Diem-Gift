// t_still_look.js <page> <tag>: Home and Tabula's ribbon with every endless decoration frozen at the same moments (compare two builds)
const { chromium } = require('playwright');
(async () => {
  const [page_, tag] = process.argv.slice(2);
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1920, height: 1000 } }); const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:8765/' + page_, { waitUntil: 'load', timeout: 120000 });
  await p.waitForTimeout(5000); await p.evaluate(() => cdCloseDoor()); await p.waitForTimeout(3500);
  const freeze = (T) => { document.getAnimations().forEach(a => { try { a.pause(); a.currentTime = a.effect.getTiming().iterations === Infinity ? T : a.effect.getComputedTiming().endTime; } catch (e) { } }); };
  for (const T of [740, 2210, 3130, 5000]) {
    await p.evaluate(freeze, T); await p.waitForTimeout(400);
    await p.screenshot({ path: `look_${tag}_home_${T}.png` });
  }
  await p.evaluate(() => document.getAnimations().forEach(a => a.play()));
  await p.evaluate(() => openExt('tabula')); await p.waitForTimeout(4500);
  const fr = await (await p.$('#frame-tabula')).contentFrame();
  for (const T of [740, 1300, 2210]) {
    await p.evaluate(freeze, T); await fr.evaluate(freeze, T); await p.waitForTimeout(400);
    await p.screenshot({ path: `look_${tag}_tabula_${T}.png`, clip: { x: 0, y: 0, width: 1920, height: 260 } });
  }
  await b.close();
})();
