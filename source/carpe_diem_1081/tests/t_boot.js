// t_boot.js URL [os] [hash]: while a window starts, each drawn frame: is a side key on screen (not under the loading page),
// and does it show its system's look? Reports the frames where a visible key showed the other look.
const { chromium, ctxFor } = require('./winemu');
const URL = process.argv[2], OS = process.argv[3] || 'win10', HASH = process.argv[4] || '';
(async () => {
  const b = await chromium.launch(); const c = await ctxFor(b, OS);
  await c.addInitScript(() => {
    window.__bootLog = [];
    var SEL = { note: '#sticky-fab>span', horo: '#horo-fab>span:first-child', theme: '#cd-theme-fab>span', thought: '#cd-thought-fab .cd-thought-glyph', quiet: '#cd-quiet-fab .cd-quiet-glyph', bell: '#reminders-fab .rem-fab-bell' };
    var t0 = performance.now();
    function frame() {
      try {
        var row = [];
        for (var k in SEL) {
          var s = document.querySelector(SEL[k]); if (!s) continue;
          var r = s.getBoundingClientRect(); if (!r.width) continue;
          var hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          var seen = hit && (hit === s || s.contains(hit) || (s.parentNode && s.parentNode.contains(hit)));
          if (!seen) continue;
          var cs = getComputedStyle(s.parentNode); if (cs.visibility === 'hidden' || +cs.opacity < 0.05) continue;
          row.push(k + '=' + (s.querySelector('img.cd-emo') ? 'IMG' : 'TXT'));
        }
        window.__bootLog.push([Math.round(performance.now() - t0), row.join(' ')]);
      } catch (e) {}
      if (performance.now() - t0 < 20000) requestAnimationFrame(function () { setTimeout(frame, 0); });
    }
    requestAnimationFrame(function () { setTimeout(frame, 0); });
  });
  const p = await c.newPage();
  await p.goto(URL + HASH, { waitUntil: 'load', timeout: 240000 });
  await p.waitForTimeout(12000);
  const log = await p.evaluate(() => window.__bootLog);
  const want = OS === 'win10' ? 'IMG' : 'TXT', other = want === 'IMG' ? 'TXT' : 'IMG';
  const shown = log.filter(x => x[1]);
  const wrong = shown.filter(x => x[1].indexOf('=' + other) >= 0);
  console.log(`${OS} ${HASH || 'desk'}: ${log.length} frames, keys first seen at ${shown.length ? shown[0][0] + ' ms' : 'never'}; frames with a key in the other look: ${wrong.length}` + (wrong.length ? ' (first at ' + wrong[0][0] + ' ms: ' + wrong[0][1] + '; last at ' + wrong[wrong.length - 1][0] + ' ms)' : ''));
  await b.close();
  process.exit(wrong.length ? 1 : 0);
})();
