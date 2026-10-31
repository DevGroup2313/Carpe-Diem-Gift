// t_untouched.js OLD_URL NEW_URL: the rest of the app looks exactly as before. Every visible button outside Candidatus
// and Home's Overview, on each main page, by day and by night, has the same computed look in the new build as in the
// old one (background, border, shadow, radius, padding, margin, transform). Exit code 1 on any difference.
const { chromium } = require('playwright');
const [OLD, NEW] = process.argv.slice(2);
async function look(b, url, theme) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 950 }, colorScheme: theme === 'night' ? 'dark' : 'light' })).newPage();
  await p.goto(url, { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(3500);
  await p.evaluate((t) => { try { cdCloseDoor(); } catch (e) {} state.themeAuto = false; state.theme = t; saveState(); applyTheme(); }, theme);
  const ids = await p.evaluate(() => [...document.querySelectorAll('section.section[id^="section-"]')].map(s => s.id.replace('section-', '')).filter(x => x !== 'applications'));
  const out = {};
  for (const id of ids) {
    await p.evaluate((id) => { try { showSection(id); if (id === 'home' && typeof homeUI !== 'undefined') { homeUI.tab = 'home'; renderHome(); } } catch (e) {} }, id);
    await p.waitForTimeout(900);
    out[id] = await p.evaluate(() => [...document.querySelectorAll('button')].filter(e => e.offsetParent && !e.closest('#cdx-ov, #overview-view, .cdx, #modal-root')).map(e => {
      const c = getComputedStyle(e);
      return (e.className || e.id || e.tagName).toString().slice(0, 30) + ' | ' + (e.textContent || '').trim().slice(0, 24) + ' :: ' + [c.backgroundColor, c.backgroundImage.slice(0, 60), c.borderTopWidth, c.borderTopStyle, c.boxShadow.slice(0, 90), c.borderRadius, c.padding, c.margin, c.transform].join(' ; ');
    }));
  }
  await p.close();
  return out;
}
(async () => {
  const b = await chromium.launch();
  let diffs = 0, total = 0;
  for (const theme of ['light', 'night']) {
    const a = await look(b, OLD, theme), n = await look(b, NEW, theme);
    for (const id of Object.keys(a)) {
      const x = a[id] || [], y = n[id] || [];
      total += x.length;
      if (x.length !== y.length) { console.log('DIFF ' + theme + ' ' + id + ': ' + x.length + ' buttons before, ' + y.length + ' now'); diffs++; continue; }
      x.forEach((s, i) => { if (s !== y[i]) { diffs++; if (diffs < 15) console.log('DIFF ' + theme + ' ' + id + '\n  before ' + s + '\n  now    ' + y[i]); } });
    }
  }
  console.log(diffs ? diffs + ' differences' : 'the rest of the app is unchanged: ' + total + ' buttons compared, by day and by night');
  await b.close();
  process.exit(diffs ? 1 : 0);
})();
