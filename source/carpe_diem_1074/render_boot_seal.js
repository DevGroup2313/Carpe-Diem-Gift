// render_seal2.js URL OUTDIR: the seal of Carpe Diem's own loading page (1073), at rest, with clear corners, day and
// night, drawn at twice its size (240 pixels), for the new loading page's seal.
const { chromium } = require('playwright');
const [URL_, OUT] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  for (const night of [false, true]) {
    const ctx = await b.newContext({ viewport: { width: 500, height: 500 }, deviceScaleFactor: 2 });
    await ctx.addInitScript((night) => {
      try { localStorage.setItem('carpe_diem_offline_v1', JSON.stringify({ theme: night ? 'night' : 'light', motion: 'minimal' })); } catch (e) {}
      document.addEventListener('readystatechange', function () {}, true);
    }, night);
    const p = await ctx.newPage();
    // stop at the splash: the page's own boot is not needed, only the seal drawn in the markup
    await p.route('**/*', r => r.continue());
    await p.goto(URL_, { waitUntil: 'domcontentloaded', timeout: 180000 });
    await p.evaluate(() => {
      const sp = document.getElementById('cd-splash');
      if (!sp) throw new Error('no splash');
      const box = sp.querySelector(':scope > div');
      const host = document.createElement('div');
      host.id = 'seal-host';
      host.setAttribute('style', 'position:fixed;left:20px;top:20px;width:120px;height:120px;z-index:2147483647;background:transparent;');
      host.appendChild(box.cloneNode(true));
      document.documentElement.appendChild(host);
      const st = document.createElement('style');
      st.textContent = 'html,body{background:transparent !important} body{visibility:hidden} #seal-host{visibility:visible} #seal-host *{animation:none !important;transition:none !important} .ambient{display:none !important}';
      document.documentElement.appendChild(st);
    });
    // the host is outside #cd-splash, so its rules (#cd-splash ...) do not reach it: copy them under #seal-host
    await p.evaluate(() => {
      let css = '';
      for (const s of document.querySelectorAll('style')) {
        if (/cd-splash/.test(s.textContent) && /cdspl3|cd-splash-day/.test(s.textContent)) css += s.textContent.replace(/#cd-splash/g, '#seal-host') + '\n';
      }
      const st = document.createElement('style'); st.textContent = css; document.documentElement.appendChild(st);
    });
    await p.waitForTimeout(600);
    await p.locator('#seal-host').screenshot({ path: OUT + '/seal2-' + (night ? 'night' : 'day') + '.png', omitBackground: true });
    await ctx.close();
  }
  await b.close();
})();
