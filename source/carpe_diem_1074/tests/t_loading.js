// shot_boot.js URL OUT_PREFIX [boot element id]: the loading page as it shows while a slow device paints the page,
// by day and by night, in English and in French (and in the folio look), at a phone's width too.
const { chromium } = require('playwright');
const [URL_, OUT, BOOT] = process.argv.slice(2);
const boot = BOOT || 'cd-splash';
const looks = [
  { name: 'day-en', st: { theme: 'light' }, vw: 1200, vh: 800 },
  { name: 'night-fr', st: { theme: 'night', lang: 'fr' }, vw: 1200, vh: 800 },
  { name: 'folio-day', st: { theme: 'light', mode: 'folio' }, vw: 1200, vh: 800 },
  { name: 'phone-night', st: { theme: 'night' }, vw: 390, vh: 760 },
];
(async () => {
  const b = await chromium.launch();
  for (const L of looks) {
    const ctx = await b.newContext({ viewport: { width: L.vw, height: L.vh } });
    await ctx.addInitScript((st) => { try { localStorage.setItem('carpe_diem_offline_v1', JSON.stringify(st)); } catch (e) {} }, L.st);
    const p = await ctx.newPage();
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 10 });
    p.goto(URL_, { waitUntil: 'commit', timeout: 180000 }).catch(() => {});
    let shot = false;
    for (let i = 0; i < 80 && !shot; i++) {
      await p.waitForTimeout(250);
      try {
        const ok = await p.evaluate((boot) => { const e = document.getElementById(boot); if (!e) return false; const c = e.querySelector('[class$="-card"]'); return !!c && getComputedStyle(c).opacity === '1'; }, boot);
        if (ok) {
          await p.waitForTimeout(300);
          await p.screenshot({ path: OUT + '-' + L.name + '.png' });
          const info = await p.evaluate(() => ({ say: (document.getElementById('cds-say') || document.getElementById('fb-say') || {}).textContent, pct: (document.getElementById('cds-pct') || document.getElementById('fb-pct') || {}).textContent }));
          console.log(L.name, JSON.stringify(info));
          shot = true;
        }
      } catch (e) {}
    }
    if (!shot) console.log(L.name, 'no loading page seen');
    await ctx.close();
  }
  await b.close();
})();
