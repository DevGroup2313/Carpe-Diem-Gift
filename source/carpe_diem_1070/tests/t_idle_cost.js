// t_idle_cost.js <page> <mode> [docx]: idle repaint cost on Home and in Tabula under a trial change
//   mode: base | layer (animated decorations on their own layers) | hidden (pause what cannot be seen) | none (all paused)
const { chromium } = require('playwright');
const LAYER = '.tabula-btn::before,.abacus-btn::before,.imago-btn::before,.scriba-app-btn::before,.scriba-btn::before,.fontes-btn::before,.curric-ws-btn::before,#goAbacus,#goImago,#scribaBtn,#fontesBtn,#fontesHomeBtn,.b3l-idle,#cluster-dot,.rem-fab-bell,.cd-tab-dot{will-change:transform}';
(async () => {
  const [page_, mode, file] = process.argv.slice(2);
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } }); const p = await ctx.newPage();
  p.on('dialog', d => d.accept().catch(() => {}));
  await p.goto('http://127.0.0.1:8765/' + page_, { waitUntil: 'load', timeout: 120000 });
  await p.waitForTimeout(5000); await p.evaluate(() => cdCloseDoor()); await p.waitForTimeout(1500);
  async function apply(fr) {
    if (mode === 'layer') await fr.evaluate(css => { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); }, LAYER);
    if (mode === 'none') await fr.evaluate(() => document.getAnimations().forEach(a => a.pause()));
  }
  async function idle(label) {
    const path = require('path').join(require('os').tmpdir(), 'cd_trace_idle.json');
    await b.startTracing(p, { path, categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline'] });
    await p.waitForTimeout(3000); await b.stopTracing();
    const ev = JSON.parse(require('fs').readFileSync(path)).traceEvents;
    const sum = n => ev.filter(e => e.name === n && e.ph === 'X').reduce((a, e) => a + e.dur / 1000, 0);
    console.log(mode.padEnd(6), label.padEnd(22), 'raster', sum('RasterTask').toFixed(0).padStart(5), 'ms | paint', sum('Paint').toFixed(0).padStart(4), '| style', sum('UpdateLayoutTree').toFixed(0).padStart(4), '| all main-thread tasks', sum('RunTask').toFixed(0), 'ms per 3 s');
  }
  await apply(p); await idle('home');
  await p.evaluate(() => openExt('tabula')); await p.waitForTimeout(4000);
  const fr = await (await p.$('#frame-tabula')).contentFrame();
  if (mode === 'hidden' || mode === 'none') await p.evaluate(() => document.getAnimations().forEach(a => a.pause()));
  await apply(fr); if (mode === 'layer') { } await idle('tabula empty');
  if (file) {
    await fr.setInputFiles('#openFile', file);
    for (let k = 0; k < 60; k++) { await p.waitForTimeout(500); if (await fr.evaluate(() => document.querySelectorAll('#editor sup.fn-ref').length) >= 300) break; }
    await p.waitForTimeout(5000);
    await idle('tabula dissertation');
    await fr.evaluate(() => { const ed = document.getElementById('editor'); const ps = ed.querySelectorAll('p'); const el = ps[Math.floor(ps.length / 2)]; el.scrollIntoView({ block: 'center' }); const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); ed.focus(); });
    await p.waitForTimeout(1500);
    const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable');
    const m0 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
    const t0 = Date.now(); for (let i = 0; i < 20; i++) await p.keyboard.type('a'); const dt = Date.now() - t0;
    const m1 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
    console.log(mode.padEnd(6), 'typing 20 keys'.padEnd(22), dt, 'ms (', (dt / 20).toFixed(1), 'ms a key ) task ms', ((m1.TaskDuration - m0.TaskDuration) * 1000).toFixed(0));
  }
  await b.close();
})();
