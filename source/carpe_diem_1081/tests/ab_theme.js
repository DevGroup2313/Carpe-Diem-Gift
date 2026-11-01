// ab_theme.js ROUNDS SLOW name=URL ...: the theme_lag measure for several pages, rounds interleaved so that the machine's
// load falls on all of them alike. Per page: the desk and a room window (#cd=tabula) share one browser context; the desk's
// day/night key is pressed; in the room: when its body changes and when the next frame is drawn, and the long tasks.
const { chromium, ctxFor, boot } = require('./winemu');
const ROUNDS = +process.argv[2], SLOW = +process.argv[3], OS = process.env.OS || 'win10';
const VARS = process.argv.slice(4).map(a => { const i = a.indexOf('='); return { name: a.slice(0, i), url: a.slice(i + 1) }; });
function med(a) { a = a.filter(x => isFinite(x)).sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : NaN; }
async function round(v, pressIn) {
  const { desk, room } = v;
  const press = pressIn === 'room' ? room : desk;
  await room.evaluate(() => {
    var T = function () { return performance.timeOrigin + performance.now(); };
    window.__m = { lt: 0 };
    try { if (!window.__lto) { window.__lto = new PerformanceObserver(l => l.getEntries().forEach(e => { if (window.__m) window.__m.lt += e.duration; })); window.__lto.observe({ entryTypes: ['longtask'] }); } } catch (e) {}
    var want = document.body.getAttribute('data-theme') === 'night' ? 'light' : 'night';
    var mo = new MutationObserver(function () {
      if (document.body.getAttribute('data-theme') !== want || window.__m.body) return;
      window.__m.body = T(); mo.disconnect();
      requestAnimationFrame(function () { setTimeout(function () { window.__m.paint = T(); }, 0); });
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
  });
  const t0 = await press.evaluate(() => { var t = performance.timeOrigin + performance.now(); document.getElementById('cd-theme-fab').click(); return t; });
  await room.waitForTimeout(2600);
  const m = await room.evaluate(() => window.__m);
  v.paint.push(m.paint - t0); v.body.push(m.body - t0); v.lt.push(m.lt);
}
(async () => {
  const b = await chromium.launch();
  for (const v of VARS) {
    v.ctx = await ctxFor(b, OS);
    v.desk = await v.ctx.newPage(); v.errs = await boot(v.desk, v.url);
    await v.desk.evaluate(() => { state.themeAuto = false; state.theme = 'light'; saveState(); applyTheme(); });
    v.room = await v.ctx.newPage(); v.errs.push(...await boot(v.room, v.url + '#cd=tabula'));
    v.paint = []; v.body = []; v.lt = [];
  }
  await new Promise(r => setTimeout(r, 6000));
  if (SLOW > 1) for (const v of VARS) for (const pg of [v.desk, v.room]) { const s = await v.ctx.newCDPSession(pg); await s.send('Emulation.setCPUThrottlingRate', { rate: SLOW }); }
  for (let i = 0; i < ROUNDS; i++) for (const v of VARS) await round(v, process.env.PRESS || 'desk');
  const f = a => a.map(x => Math.round(x)).join(',');
  for (const v of VARS) console.log(`${v.name.padEnd(6)} ${OS} x${SLOW} pressed in ${process.env.PRESS || 'desk'}: room body changed med ${Math.round(med(v.body))} ms | frame drawn med ${Math.round(med(v.paint))} ms [${f(v.paint)}] | long tasks in 2.6 s med ${Math.round(med(v.lt))} ms | errors ${v.errs.length}`);
  await b.close();
})();
