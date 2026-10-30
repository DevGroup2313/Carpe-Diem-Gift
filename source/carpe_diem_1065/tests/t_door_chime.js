// door2.js <page> <earlyClickMs> : click the middle of the window early (while loading), then the door's seal
const { chromium } = require('playwright');
(async () => {
  const page_ = process.argv[2], early = +(process.argv[3] || 1500);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    window.__snd = []; const st = AudioScheduledSourceNode.prototype.start;
    AudioScheduledSourceNode.prototype.start = function () { try { window.__snd.push(Math.round(performance.now())); } catch (e) {} return st.apply(this, arguments); };
  });
  const p = await ctx.newPage();
  const nav = p.goto((process.env.CD_BASE || 'http://127.0.0.1:8765/') + page_, { waitUntil: 'load', timeout: 120000 });
  const t0 = Date.now();
  await p.waitForTimeout(early);
  const st = await p.evaluate(() => ({ door: !!document.getElementById('cd-door'), splash: !!document.getElementById('cd-splash'), ready: document.readyState })).catch(e => 'eval failed ' + e);
  await p.mouse.click(720, 450).catch(e => console.log('early click failed', String(e).slice(0, 80)));
  console.log('early click at', Date.now() - t0, 'ms, state', JSON.stringify(st));
  await nav; await p.waitForTimeout(5000);
  const before = await p.evaluate(() => window.__snd.length);
  const seal = await p.$('#cd-door [aria-label*="Enter"]');
  console.log('door now:', await p.evaluate(() => !!document.getElementById('cd-door')), 'seal:', !!seal, 'sounds so far:', before);
  if (seal) { await seal.click(); await p.waitForTimeout(1500); }
  const after = await p.evaluate(() => window.__snd.length);
  console.log('sounds on opening the door:', after - before);
  await b.close();
})();
