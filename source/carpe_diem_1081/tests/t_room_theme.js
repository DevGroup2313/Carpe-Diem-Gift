// t_room_theme.js URL [os] [lang]: the desk and Tabula's own window (#cd=tabula) share one browser. Day and night are
// changed from the desk, then from the room's window, four times in all. After each change, both windows agree: the
// saved theme, the page, the room inside the window, the moon or sun key, and (once the redraw has followed) the
// Display panel's word for it. Then the room is closed in its window: a change still applies in full.
const { chromium, ctxFor, boot } = require('./winemu');
const URL = process.argv[2], OS = process.argv[3] || 'win10', LANG = process.argv[4] || 'en';
async function look(p) {
  return p.evaluate(() => {
    var f = document.getElementById('cd-theme-fab'), s = f && f.firstElementChild;
    var key = s ? (s.querySelector('img.cd-emo') ? 'img:' + s.getAttribute('data-emoji') : 'txt:' + (s.textContent || '').replace(/️/g, '')) : 'none';
    var fr = document.getElementById('frame-tabula'), fd = null; try { fd = fr && fr.contentDocument; } catch (e) {}
    var lab = document.getElementById('theme-label');
    return { state: state.theme, body: document.body.getAttribute('data-theme'), key: key,
      room: fd ? (fd.documentElement.classList.contains('cd-dark') ? 'dark' : 'light') : '-', label: lab ? lab.textContent : '-' };
  });
}
function agree(l, want, lang) {
  const sun = '☀', moon = '🌙';
  const word = want === 'night' ? (lang === 'fr' ? 'Sombre' : 'Dark') : (lang === 'fr' ? 'Clair' : 'Light');
  return l.state === want && l.body === want && l.key.slice(4) === (want === 'night' ? sun : moon) && (l.room === '-' || l.room === (want === 'night' ? 'dark' : 'light')) && (l.label === '-' || l.label === word);
}
(async () => {
  const b = await chromium.launch(); const c = await ctxFor(b, OS);
  const desk = await c.newPage(); const errs = await boot(desk, URL);
  await desk.evaluate((lang) => { state.lang = lang; state.themeAuto = false; state.theme = 'light'; saveState(); applyTheme(); try { renderAll(); } catch (e) {} }, LANG);
  const room = await c.newPage(); errs.push(...await boot(room, URL + '#cd=tabula'));
  await room.waitForTimeout(2500);
  let bad = 0, want = 'light';
  for (const where of ['desk', 'desk', 'room', 'room']) {
    await (where === 'desk' ? desk : room).evaluate(() => document.getElementById('cd-theme-fab').click());
    want = want === 'night' ? 'light' : 'night';
    await room.waitForTimeout(1500);
    const a = await look(desk), r = await look(room);
    const ok = agree(a, want, LANG) && agree(r, want, LANG);
    if (!ok) bad++;
    console.log(`${ok ? 'ok ' : 'BAD'} pressed in the ${where}, now ${want}: desk ${JSON.stringify(a)} | room ${JSON.stringify(r)}`);
  }
  // the room closed in its own window: the change is applied in full at once
  await room.evaluate(() => { try { document.body.classList.remove('ext-open'); } catch (e) {} });
  await room.evaluate(() => { document.getElementById('cd-theme-fab').click(); });
  want = want === 'night' ? 'light' : 'night';
  const r2 = await room.evaluate(() => ({ body: document.body.getAttribute('data-theme'), label: (document.getElementById('theme-label') || {}).textContent }));
  const ok2 = r2.body === want;
  if (!ok2) bad++;
  console.log(`${ok2 ? 'ok ' : 'BAD'} room closed in its window, pressed: at once ${JSON.stringify(r2)}`);
  console.log('page errors: ' + errs.length + (errs.length ? ' ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(bad || errs.length ? 'FAIL' : 'PASS ' + OS + ' ' + LANG);
  await b.close(); process.exit(bad || errs.length ? 1 : 0);
})();
