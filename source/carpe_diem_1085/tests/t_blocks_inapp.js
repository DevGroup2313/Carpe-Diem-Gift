// t_blocks_inapp.js PAGE_URL: Tabula inside Carpe Diem: a list typed with Tab, Increase Indent, Undo; the room's own
// handling is there and works the same as Tabula alone.
const pw = require('playwright');
(async () => {
  const b = await pw.chromium.launch({ executablePath: process.env.CD_CHROMIUM || '/opt/pw-browsers/chromium' });
  const p = await (await b.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(process.argv[2] + '#cd=tabula', { waitUntil: 'load', timeout: 240000 }); await p.waitForTimeout(6000);
  const el = await p.$('#frame-tabula'); if (!el) { console.log('FAIL no Tabula frame'); process.exit(1); }
  const f = await el.contentFrame();
  let bad = 0; const say = (g, n, i) => { if (!g) bad++; console.log((g ? 'ok   ' : 'BAD  ') + n + (i ? '  ' + i : '')); };
  say(await f.evaluate(() => !!document.getElementById('cd-blocks-1085') && !!window.cdTabulaHistory), "Tabula's own handling is in the room");
  await f.evaluate(() => { var ed = document.getElementById('editor'); ed.innerHTML = '<p><br></p>'; ed.focus(); var r = document.createRange(); r.setStart(ed.firstChild, 0); r.collapse(true); getSelection().removeAllRanges(); getSelection().addRange(r); });
  await p.waitForTimeout(200);
  await p.keyboard.type('Intro'); await p.keyboard.press('Enter');
  await f.evaluate(() => { var x = document.querySelector('button[data-cmd="insertUnorderedList"]'); x.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); x.click(); });
  await p.keyboard.type('a'); await p.keyboard.press('Enter'); await p.keyboard.press('Tab'); await p.keyboard.type('b'); await p.keyboard.press('Enter'); await p.keyboard.press('Enter'); await p.keyboard.press('Enter'); await p.keyboard.type('after');
  await p.waitForTimeout(300);
  const h = await f.evaluate(() => { var d = document.getElementById('editor').cloneNode(true); window.cdPageMarksOff && window.cdPageMarksOff(d); return d.innerHTML.replace(/<br>/g, ''); });
  say(h === '<p>Intro</p><ul><li>a<ul><li>b</li></ul></li></ul><p>after</p>', 'a list typed inside Carpe Diem', h);
  await p.keyboard.press('Control+z'); await p.waitForTimeout(200);
  const h2 = await f.evaluate(() => document.getElementById('editor').textContent);
  say(h2.indexOf('after') < 0 && h2.indexOf('Intro') === 0, 'Undo inside Carpe Diem', h2);
  if (errs.length) say(false, 'page errors', errs.join(' | ').slice(0, 400));
  console.log(bad ? 'FAIL' : 'PASS'); await b.close(); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL crash ' + e); process.exit(2); });
