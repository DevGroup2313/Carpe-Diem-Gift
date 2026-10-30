// t_rooms_menu.js <page.html> [port]: the menu of a room's floating window (build 1073), with a stand-in for the Mac
// and Windows apps' API: Side by side with Carpe Diem and Its own window (on the Dock / on the taskbar) call the app;
// in a browser the menu is as before (its own browser window, the split, fill, close).
const { chromium } = require('playwright');
const PAGE = process.argv[2], PORT = process.argv[3] || '8765';
const UA = {
  mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)',
  win: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
};
function fakeApi(kind) {
  window.__calls = [];
  const log = (n) => (...a) => { window.__calls.push([n].concat(a)); return Promise.resolve(null); };
  const api = {};
  ['take_file', 'file_part', 'file_opened', 'carry_state', 'carry_done', 'broadcast_theme', 'open_export', 'print_document',
   'read_clipboard', 'save_file', 'restart_into_new_build', 'close_app', 'focus_app'].forEach(n => { api[n] = log(n); });
  api.open_app = (...a) => { window.__calls.push(['open_app'].concat(a)); return Promise.resolve(true); };
  api.room_to_dock = (w) => { window.__calls.push(['room_to_dock', w]); return Promise.resolve(kind === 'mac' ? { ok: true, added: true, app: '/x/Tabula.app' } : { ok: true, pin: 'by hand', name: 'Tabula' }); };
  window.pywebview = { api };
}
async function run(browser, kind, lang) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, userAgent: UA[kind === 'browser' ? 'mac' : kind] });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  if (kind !== 'browser') await page.addInitScript(fakeApi, kind);
  await page.goto('http://127.0.0.1:' + PORT + '/' + PAGE, { waitUntil: 'load' });
  await page.waitForTimeout(4500);
  if (lang === 'fr') await page.evaluate(() => { try { state.lang = 'fr'; } catch (e) {} });
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Go to Home|Aller à l’accueil/.test(x.textContent)); if (b) b.click(); try { if (typeof cdCloseDoor === 'function') cdCloseDoor(); } catch (e) {} });
  await page.waitForTimeout(800);
  await page.evaluate(() => openExt('tabula')); await page.waitForTimeout(4500);
  await page.evaluate(() => cdFloatApp('tabula')); await page.waitForTimeout(2000);
  const open = () => page.evaluate(() => { const w = document.getElementById('cd-fw-tabula'); const k = w.querySelector('[data-cd-export-guard],[data-cd-popout]'); k.click();
    const m = document.getElementById('cd-export-choice'); return { host: m.getAttribute('data-cd-host'), opts: [...m.querySelectorAll('button')].map(b => ({ act: b.getAttribute('data-cd-act'), label: b.querySelector('.cd-win1059-l').textContent, sub: (b.querySelector('.cd-win1059-s') || {}).textContent || '' })) }; });
  const out = { kind, lang, menu: await open() };
  if (kind !== 'browser') {
    await page.evaluate(() => document.querySelector('#cd-export-choice [data-cd-act="side-by-side"]').click());
    await page.waitForTimeout(800);
    out.afterBeside = await page.evaluate(() => ({ calls: window.__calls.filter(c => c[0] === 'open_app' || c[0] === 'room_to_dock'), floating: !!document.getElementById('cd-fw-tabula') }));
    // the room's floating window gave way to its own window; float it again for the next choice
    await page.evaluate(() => { window.__calls.length = 0; try { if (window.__cdNative) delete window.__cdNative.tabula; } catch (e) {} });
    await page.evaluate(() => { if (!document.getElementById('cd-fw-tabula')) { openExt('tabula'); } }); await page.waitForTimeout(3000);
    await page.evaluate(() => { if (!document.getElementById('cd-fw-tabula')) cdFloatApp('tabula'); }); await page.waitForTimeout(1500);
    out.menu2 = (await open()).opts.map(o => o.act);
    await page.evaluate(() => document.querySelector('#cd-export-choice [data-cd-act="own-window"]').click());
    await page.waitForTimeout(1200);
    out.afterOwn = await page.evaluate(() => ({ calls: window.__calls.filter(c => c[0] === 'open_app' || c[0] === 'room_to_dock'),
      said: ((document.getElementById('cd-windows-say-1059') || {}).textContent || '') }));
    await page.waitForTimeout(3000);
    out.saidLater = await page.evaluate(() => ((document.getElementById('cd-windows-say-1059') || {}).textContent || ''));
  }
  out.errs = errs;
  await ctx.close();
  return out;
}
(async () => {
  const browser = await chromium.launch();
  const res = [];
  for (const [k, l] of [['mac', 'en'], ['win', 'en'], ['mac', 'fr'], ['browser', 'en']]) res.push(await run(browser, k, l));
  console.log(JSON.stringify(res, null, 1));
  await browser.close();
})();
