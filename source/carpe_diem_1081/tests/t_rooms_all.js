// t_rooms_all.js URL [os]: each room in a window of its own (#cd=<room>): its key changes day and night twice; the page,
// the room inside and the key agree at once, the full redraw follows (the Display panel's word), with no page error.
const { chromium, ctxFor, boot } = require('./winemu');
const URL = process.argv[2], OS = process.argv[3] || 'win10';
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const room of ['tabula', 'abacus', 'slides', 'scriba', 'fontes']) {
    const c = await ctxFor(b, OS); const p = await c.newPage(); const errs = await boot(p, URL + '#cd=' + room); await p.waitForTimeout(2500);
    const res = [];
    for (let i = 0; i < 2; i++) {
      const r = await p.evaluate((room) => new Promise(res => {
        document.getElementById('cd-theme-fab').click();
        var want = state.theme, fr = document.getElementById('frame-' + room), fd = fr && fr.contentDocument;
        var now = { body: document.body.getAttribute('data-theme') === want, room: !!fd && fd.documentElement.classList.contains('cd-dark') === (want === 'night'), key: !!document.querySelector('#cd-theme-fab>span') };
        setTimeout(function () { var lab = document.getElementById('theme-label'); now.label = !lab || lab.textContent === (want === 'night' ? 'Dark' : 'Light'); now.roomLater = !!fd && fd.documentElement.classList.contains('cd-dark') === (want === 'night'); res(now); }, 900);
      }), room);
      res.push(r);
    }
    const ok = res.every(r => r.body && r.room && r.key && r.label && r.roomLater) && !errs.length;
    if (!ok) bad++;
    console.log((ok ? 'ok  ' : 'BAD ') + room.padEnd(7) + JSON.stringify(res) + (errs.length ? ' errors: ' + errs.slice(0, 2).join(' | ') : ''));
    await c.close();
  }
  console.log(bad ? 'FAIL' : 'PASS'); await b.close(); process.exit(bad ? 1 : 0);
})();
