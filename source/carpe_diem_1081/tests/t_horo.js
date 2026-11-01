// t_horo.js URL [os]: the floating window's hourglass while the Clepsydra runs: the ring and the minutes as on the main
// key, the hourglass in its system's look, and the look held from frame to frame.
const { chromium, ctxFor, boot } = require('./winemu');
const URL = process.argv[2], OS = process.argv[3] || 'win10';
(async () => {
  const b = await chromium.launch(); const c = await ctxFor(b, OS); const p = await c.newPage();
  const errs = await boot(p, URL);
  await p.evaluate(() => { try { openExt('tabula'); } catch (e) {} }); await p.waitForTimeout(4500);
  await p.evaluate(() => { try { cdFloatApp('tabula'); } catch (e) {} }); await p.waitForTimeout(3000);
  await p.evaluate(() => { try { pomo.fabLive = true; pomo.remaining = pomo.focusLen * 60; pomo.running = true; pomoPill(); } catch (e) { return String(e); } });
  await p.waitForTimeout(2500);
  const r = await p.evaluate(() => new Promise(res => {
    var f = document.querySelector('iframe[id^="cd-fw-frame-"]'), d = f.contentDocument, seq = [], n = 0, t0 = performance.now();
    function look() { var g = d.querySelector('#cd-wf-horo .cd-wf-glyph'); if (!g) return 'NONE'; return (g.querySelector('img.cd-emo') ? 'IMG' : (/[⌛⏳]/.test(g.textContent) ? 'TXT' : 'NOGLYPH')) + (g.querySelector('svg') ? '+ring' : '') + (g.querySelector('#horo-num') ? '+num' : ''); }
    function frame() { n++; var l = look(); if (seq[seq.length - 1] !== l) seq.push(l); if (performance.now() - t0 < 4000) requestAnimationFrame(function () { setTimeout(frame, 0); }); else res({ seq: seq, n: n, main: document.getElementById('horo-fab').innerHTML.replace(/src="[^"]{40,}"/g, 'src=…').slice(0, 160) }); }
    frame();
  }));
  await p.evaluate(() => { try { pomo.running = false; pomoPill(); } catch (e) {} });
  console.log(OS, 'window hourglass while running:', r.seq.join(' -> '), '(' + r.n + ' frames); errors', errs.length);
  const ok = r.seq.length === 1 && /\+ring\+num/.test(r.seq[0]) && (OS === 'win10' ? /^IMG/.test(r.seq[0]) : /^TXT/.test(r.seq[0]));
  console.log(ok ? 'PASS' : 'FAIL');
  await b.close(); process.exit(ok ? 0 : 1);
})();
