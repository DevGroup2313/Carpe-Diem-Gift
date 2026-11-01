// t_keys.js URL [os=win10|win11|mac] [seconds=8]: the side keys hold one look. The desk with a floating Tabula window,
// then a room in a window of its own (#cd=tabula). Every animation frame, each key's look is noted (picture of an emoji,
// text, or empty), just after each frame is drawn; day and night are changed twice. Pass: no key empty, every key in its system's look (pictures on
// Windows 10, text elsewhere), and a key changes only when day and night change (the moon and sun key, once each time).
const { chromium, ctxFor, boot } = require('./winemu');
const URL = process.argv[2], OS = process.argv[3] || 'win10', SECS = +(process.argv[4] || 8);
const MAIN = { note: '#sticky-fab>span', horo: '#horo-fab>span:first-child', theme: '#cd-theme-fab>span', thought: '#cd-thought-fab .cd-thought-glyph', quiet: '#cd-quiet-fab .cd-quiet-glyph', bell: '#reminders-fab .rem-fab-bell' };
const WIN = { note: '#cd-wf-note .cd-wf-glyph', horo: '#cd-wf-horo .cd-wf-glyph', theme: '#cd-wf-theme .cd-wf-glyph', thought: '#cd-wf-thought .cd-wf-glyph', quiet: '#cd-wf-quiet .cd-wf-glyph', bell: '#cd-wf-bell .cd-wf-glyph' };
async function watch(p, secs, withWin) {
  return p.evaluate(({ MAIN, WIN, secs, withWin }) => new Promise(res => {
    function look(el) {
      if (!el) return 'NONE';
      var btn = el.closest('button'); if (btn && (btn.ownerDocument.defaultView.getComputedStyle(btn).display === 'none')) return 'HIDDEN';
      var im = el.querySelector('img');
      if (im) { var r = im.getBoundingClientRect(); return (r.width > 4 && im.complete && im.naturalWidth > 0 ? 'IMG:' : 'IMG?:') + (el.getAttribute('data-emoji') || '?'); }
      var t = (el.textContent || '').replace(/️/g, '').trim();
      return t ? 'TXT:' + t : 'EMPTY';
    }
    function docOfWin() { var f = document.querySelector('iframe[id^="cd-fw-frame-"]'); try { return f && f.contentDocument; } catch (e) { return null; } }
    var hist = {}, frames = 0, t0 = performance.now(), toggles = 0;
    function note(k, v) { var h = hist[k] || (hist[k] = { seq: [], n: {} }); if (h.seq[h.seq.length - 1] !== v) h.seq.push(v); h.n[v] = (h.n[v] || 0) + 1; }
    function frame() {
      frames++;
      for (var k in MAIN) note('main.' + k, look(document.querySelector(MAIN[k])));
      if (withWin) { var d = docOfWin(); for (var k2 in WIN) note('win.' + k2, look(d && d.querySelector(WIN[k2]))); }
      var t = performance.now() - t0;
      if (toggles === 0 && t > secs * 333) { toggles = 1; document.getElementById('cd-theme-fab').click(); }
      if (toggles === 1 && t > secs * 666) { toggles = 2; document.getElementById('cd-theme-fab').click(); }
      if (t < secs * 1000) requestAnimationFrame(after); else res({ frames: frames, hist: hist });
    }
    // sampled just after each frame is drawn: what the frame showed
    function after() { setTimeout(frame, 0); }
    requestAnimationFrame(after);
  }), { MAIN, WIN, secs, withWin });
}
function judge(where, r, os) {
  let bad = 0;
  const want = os === 'win10' ? /^IMG:/ : /^TXT:/;
  for (const k of Object.keys(r.hist)) {
    const h = r.hist[k], isTheme = /\.theme$/.test(k);
    // a key this edition does not have: the window's twin stays hidden
    if (h.seq.every(v => v === 'NONE' || v === 'HIDDEN')) { console.log(`  ok  ${where} ${k.padEnd(13)} not in this edition (${h.seq.join(' -> ')})`); continue; }
    const okLook = h.seq.every(v => want.test(v));
    const changes = h.seq.length - 1, allowed = isTheme ? 2 : 0;
    const ok = okLook && changes <= allowed && (!isTheme || changes === 2 || /^win/.test(k));
    if (!ok) bad++;
    console.log(`  ${ok ? 'ok ' : 'BAD'} ${where} ${k.padEnd(13)} ${h.seq.join(' -> ')}  (${changes} change${changes === 1 ? '' : 's'})`);
  }
  console.log(`  ${where}: ${r.frames} frames watched`);
  return bad;
}
(async () => {
  const b = await chromium.launch();
  let bad = 0;
  const c = await ctxFor(b, OS);
  const p = await c.newPage();
  const errs = await boot(p, URL);
  await p.evaluate(() => { state.themeAuto = false; state.theme = 'light'; saveState(); applyTheme(); try { window.__cdTC && window.__cdTC.add('A thought to show the count'); } catch (e) {} });
  await p.evaluate(() => { try { openExt('tabula'); } catch (e) {} });
  await p.waitForTimeout(4500);
  await p.evaluate(() => { try { cdFloatApp('tabula'); } catch (e) {} });
  await p.waitForTimeout(3500);
  console.log(OS + ': the desk with a floating Tabula window');
  bad += judge('desk', await watch(p, SECS, true), OS);
  const r = await c.newPage();
  errs.push(...await boot(r, URL + '#cd=tabula'));
  await r.waitForTimeout(3000);
  console.log(OS + ': Tabula in a window of its own');
  bad += judge('room', await watch(r, SECS, false), OS);
  console.log('page errors: ' + errs.length + (errs.length ? ' ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(bad || errs.length ? 'FAIL ' + bad + ' keys' : 'PASS every key holds one look');
  await b.close();
  process.exit(bad || errs.length ? 1 : 0);
})();
