// t_road.js URL: the road to the offer with many milestones: seven stations at most, around where you are, numbered
// as on the whole road, the count of all of them below.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1400, height: 950 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await p.goto(process.argv[2], { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(3500);
  let fails = 0;
  const r = await p.evaluate(async () => {
    try { if (typeof cdCloseDoor === 'function') cdCloseDoor(); } catch (e) {}
    const ms = state.candidature.milestones;
    for (let k = 0; k < 9; k++) ms.push({ id: 'ms-x' + k, label: 'Extra milestone ' + (k + 1), date: '', done: false });
    ms.forEach((m, i) => { m.done = i < 6; });
    saveState();
    showSection('applications'); candUI.tab = 'overview'; renderCandidature();
    await new Promise(r => setTimeout(r, 500));
    const stops = [...document.querySelectorAll('#cdx-cand .cdx-stop')].map(s => (s.classList.contains('here') ? '*' : '') + s.querySelector('.cdx-dot').textContent + ' ' + s.querySelector('b').textContent);
    return { total: ms.length + 2, stops, cap: document.querySelector('#cdx-cand .cdx-road .cdx-cap').textContent };
  });
  console.log(JSON.stringify(r, null, 1));
  const ok = (c, w) => { console.log((c ? 'ok   ' : 'FAIL ') + w); if (!c) fails++; };
  ok(r.stops.length === 7, 'seven stations shown of ' + r.total);
  ok(r.stops.some(s => s[0] === '*'), 'where you are is among them');
  ok(/^✓ Choose/.test(r.stops[0]) && /Interview/.test(r.stops[6]), 'the first and the last stay');
  ok(new RegExp('of ' + r.total + ' stations').test(r.cap), 'the count is of the whole road');
  ok(!errs.length, 'no page errors ' + JSON.stringify(errs));
  await b.close();
  process.exit(fails ? 1 : 0);
})();
