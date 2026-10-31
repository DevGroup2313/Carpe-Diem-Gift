// t_home_low.js URL [OUT]: Home on a low-energy day, 1077. Low chosen on Home's Overview, then back to Home: Home is not
// empty (the low day's card is at its top, with Show everything again); Show everything again brings the whole of Home
// back; the Focus page's switch does the same; a weekday's next step stays under the card; an ordinary day has no card;
// in French; pictures by day and by night. Exit code 1 on any failure or page error.
const { chromium } = require('playwright');
const [URL_, OUT] = process.argv.slice(2);
let fails = 0;
function ok(c, what, extra) { console.log((c ? 'ok   ' : 'FAIL ') + what + (extra !== undefined ? '  ' + JSON.stringify(extra).slice(0, 300) : '')); if (!c) fails++; }
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('page: ' + e.message.slice(0, 240)));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/sw\.js|favicon|Failed to load resource|bad HTTP response/.test(t)) errs.push('console: ' + t.slice(0, 240)); });
  const ev = (f, a) => p.evaluate(f, a);
  await p.goto(URL_, { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(3500);
  await ev(() => { try { if (typeof cdCloseDoor === 'function') cdCloseDoor(); } catch (e) {} try { if (typeof demoRemove === 'function') { demoRemove('demo-entry'); demoRemove('demo-build'); } } catch (e) {} state.themeAuto = false; state.theme = 'light'; saveState(); applyTheme(); if (state.lang !== 'en') setLang('en'); try { window.__cdSC.setLow(false); } catch (e) {} });
  await ev(() => { showSection('home'); homeUI.tab = 'home'; renderHome(); }); await p.waitForTimeout(800);
  const look = () => ev(() => {
    const hv = document.getElementById('home-view'), lc = document.getElementById('cd-low-home');
    const vis = e => !!(e && e.offsetParent && e.getBoundingClientRect().height > 0);
    return { low: document.body.hasAttribute('data-cd-low'), homeH: Math.round(hv.getBoundingClientRect().height), card: vis(lc) && lc.textContent.trim().length > 20, cardText: lc ? lc.textContent.trim().slice(0, 120) : '', again: !!(lc && [...lc.querySelectorAll('button')].some(x => /Show everything again|Tout montrer/.test(x.textContent))), readings: vis(document.getElementById('pleasure-body')), dock: vis(document.getElementById('magister-dock-container')), first: (document.getElementById('home-top').firstElementChild || {}).id };
  });
  const before = await look();
  ok(!before.low && !before.card && before.readings && before.homeH > 300, 'an ordinary day: Home whole, no low card', before);

  // Low on the Overview, then back to Home, by the tabs themselves
  await p.click('.home-subtabs button:has-text("Overview")'); await p.waitForTimeout(700);
  await p.click('#overview-view [data-energy="low"]'); await p.waitForTimeout(700);
  ok(/Home shows only the essentials today/.test(await ev(() => document.querySelector('#overview-view [data-cdx="energy"]').textContent)), 'the energy card says Home shows only the essentials');
  await p.click('.home-subtabs button:has-text("Home")'); await p.waitForTimeout(1800);
  const low = await look();
  ok(low.low && low.card && low.again && low.first === 'cd-low-home' && low.homeH > 90, 'Low, then Home: Home is not empty, the low day\'s card is at its top', low);
  ok(!low.readings && !low.dock, 'and only the essentials show, as a low day should', low);
  if (OUT) await p.screenshot({ path: OUT + '/home_low_day.png' });

  // a weekday keeps its next step under the card
  const was = await ev(() => { const was = state.selectedDateStr; let d = parseDate(todayString()); for (let i = 0; i < 7 && !isWorkday(d); i++) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1); state.selectedDateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); renderHome(); return was; });
  await p.waitForTimeout(400);
  const wd = await ev(() => ({ s: state.selectedDateStr, kids: [...document.getElementById('home-top').children].filter(c => c.offsetParent).map(c => c.id || c.className.toString().slice(0, 20)) }));
  await ev((was) => { state.selectedDateStr = was; renderHome(); }, was); await p.waitForTimeout(400);
  ok(wd.kids[0] === 'cd-low-home' && wd.kids.length >= 2, 'a weekday: the card, then the day\'s next step', wd);

  // Show everything again
  await p.click('#cd-low-home button:has-text("Show everything again")'); await p.waitForTimeout(1800);
  const back = await look();
  ok(!back.low && !back.card && back.readings && back.dock && back.homeH >= before.homeH - 5, 'Show everything again brings the whole of Home back', back);

  // the Focus page's switch
  await ev(() => { showSection('focus'); }); await p.waitForTimeout(700);
  await ev(() => window.__cdSC.setLow(true)); await p.waitForTimeout(400);
  await ev(() => { showSection('home'); }); await p.waitForTimeout(1600);
  const f = await look();
  ok(f.low && f.card && f.again, 'the Focus page\'s low day shows the card on Home too', f);

  // French
  await ev(() => setLang('fr')); await p.waitForTimeout(1200);
  const fr = await look();
  ok(/faible énergie/i.test(fr.cardText) && fr.again, 'in French', fr.cardText);
  await ev(() => setLang('en')); await p.waitForTimeout(800);

  // night
  await ev(() => { state.theme = 'night'; saveState(); applyTheme(); }); await p.waitForTimeout(800);
  if (OUT) await p.screenshot({ path: OUT + '/home_low_night.png' });
  await ev(() => { state.theme = 'light'; saveState(); applyTheme(); window.__cdSC.setLow(false); }); await p.waitForTimeout(1600);
  const end = await look();
  ok(!end.low && !end.card && end.readings, 'and back to an ordinary day', end);

  ok(errs.length === 0, 'no page errors', errs);
  console.log(fails ? fails + ' FAILED' : 'all passed');
  await b.close();
  process.exit(fails ? 1 : 0);
})();
