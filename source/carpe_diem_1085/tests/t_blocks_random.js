// t_blocks_random.js TABULA_URL [engine] [steps] [seed]: a long run of mixed keys and buttons, chosen at random but
// repeatable (the seed), in Tabula alone. After every step: no page error, no list inside a paragraph, no list hung
// outside an item, no loose words at the top of the document; after every list or indent change, not a letter lost or
// added. At the end, Undo all the way back gives the first document, and Redo all the way gives the last.
const pw = require('playwright');
const URL = process.argv[2], ENG = process.argv[3] || 'chromium', N = +(process.argv[4] || 300); let seed = +(process.argv[5] || 7);
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
(async () => {
  const b = ENG === 'chromium' ? await pw.chromium.launch({ executablePath: process.env.CD_CHROMIUM || '/opt/pw-browsers/chromium' }) : await pw[ENG].launch();
  const p = await (await b.newContext({ viewport: { width: 1300, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e) + (process.env.DBG ? '\n' + (e.stack || '') : '')));
  await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1500);
  const mod = ENG === 'webkit' ? 'Meta' : 'Control';
  await p.evaluate(() => { var ed = document.getElementById('editor'); ed.innerHTML = '<p>Alpha beta gamma.</p><ul><li>one</li><li>two<ul><li>two a</li></ul></li><li>three</li></ul><p>Delta epsilon.</p><ol><li>first</li><li>second</li></ol><p>Zeta.</p>'; ed.focus(); });
  await p.waitForTimeout(300);
  const first = await p.evaluate(() => { var d = document.getElementById('editor').cloneNode(true); window.cdPageMarksOff && window.cdPageMarksOff(d); return d.innerHTML; });
  const state = () => p.evaluate(() => {
    var ed = document.getElementById('editor'), bad = [];
    if (ed.querySelector(':scope > p ul, :scope > p ol')) bad.push('list in a paragraph');
    if (ed.querySelector('ul > ul, ul > ol, ol > ul, ol > ol')) bad.push('list outside an item');
    for (var i = 0; i < ed.childNodes.length; i++) { var n = ed.childNodes[i]; if (n.nodeType === 3 && /\S/.test(n.nodeValue)) bad.push('loose words'); }
    if (document.activeElement !== ed) bad.push('focus left: ' + (document.activeElement && document.activeElement.id));
    var sl = getSelection(); if (!sl.rangeCount || !ed.contains(sl.anchorNode)) bad.push('no caret in the document');
    return { text: ed.textContent.replace(/\s+/g, ''), bad: bad };
  });
  const place = () => p.evaluate((x) => { var ed = document.getElementById('editor'); var w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT), t, all = []; while ((t = w.nextNode())) all.push(t); if (!all.length) return; var tn = all[Math.floor(x[0] * all.length)], o = Math.floor(x[1] * (tn.nodeValue.length + 1)); var r = document.createRange(); r.setStart(tn, Math.min(o, tn.nodeValue.length)); if (x[2] > 0.7) { var tn2 = all[Math.min(all.length - 1, all.indexOf(tn) + Math.floor(x[3] * 4))]; try { r.setEnd(tn2, Math.min(tn2.nodeValue.length, Math.floor(x[3] * tn2.nodeValue.length))); } catch (e) {} if (r.collapsed) r.collapse(true); } else r.collapse(true); ed.focus(); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }, [rnd(), rnd(), rnd(), rnd()]);
  const click = (sel) => p.evaluate((sel) => { var x = document.querySelector(sel); x.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); x.click(); }, sel);
  let fails = 0, steps = 0;
  const OPS = ['type', 'type', 'enter', 'tab', 'shifttab', 'backspace', 'bullets', 'numbers', 'indent', 'outdent', 'undo', 'redo', 'shiftenter', 'place', 'place'];
  for (let i = 0; i < N; i++) {
    const op = OPS[Math.floor(rnd() * OPS.length)];
    const before = await state();
    const hb = process.env.DBG ? await p.evaluate(() => document.getElementById('editor').innerHTML) : '';
    if (op !== 'place' && rnd() < 0.5) await place();
    if (process.env.DBG) global.__selb = await p.evaluate(() => { var s = getSelection(); if (!s.rangeCount) return null; var r = s.getRangeAt(0); return [r.startContainer.nodeName, r.startContainer.nodeValue, r.startOffset, r.endContainer.nodeName, r.endContainer.nodeValue, r.endOffset]; });
    const keeps = ['bullets', 'numbers', 'indent', 'outdent'].indexOf(op) >= 0;
    if (op === 'type') await p.keyboard.type('w' + i + ' ');
    else if (op === 'enter') await p.keyboard.press('Enter');
    else if (op === 'shiftenter') await p.keyboard.press('Shift+Enter');
    else if (op === 'tab') await p.keyboard.press('Tab');
    else if (op === 'shifttab') await p.keyboard.press('Shift+Tab');
    else if (op === 'backspace') await p.keyboard.press('Backspace');
    else if (op === 'bullets') await click('button[data-cmd="insertUnorderedList"]');
    else if (op === 'numbers') await click('button[data-cmd="insertOrderedList"]');
    else if (op === 'indent') await click('button[data-cmd="indent"]');
    else if (op === 'outdent') await click('button[data-cmd="outdent"]');
    else if (op === 'undo') await p.keyboard.press(mod + '+z');
    else if (op === 'redo') await p.keyboard.press(ENG === 'webkit' ? 'Meta+Shift+z' : 'Control+y');
    else await place();
    await p.waitForTimeout(30);
    const after = await state(); steps++;
    if (process.env.DBG && (after.bad.length || (['bullets', 'numbers', 'indent', 'outdent'].indexOf(op) >= 0 && before.text !== after.text.replace(/\t/g, '')) || errs.length)) { console.log('STEP ' + i + ' ' + op + ' ' + after.bad.join(',') + '\nSELBEFORE ' + JSON.stringify(global.__selb) + '\nSEL ' + JSON.stringify(await p.evaluate(() => { var s = getSelection(); if (!s.rangeCount) return "no selection"; var r = s.getRangeAt(0); return [r.startContainer.nodeName, r.startContainer.nodeValue, r.startOffset, r.endContainer.nodeName, r.endContainer.nodeValue, r.endOffset]; })) + '\nBEFORE ' + hb + '\nAFTER  ' + await p.evaluate(() => document.getElementById('editor').innerHTML) + '\nERRS ' + errs.join('\n')); process.exit(3); }
    const lost = keeps && before.text !== after.text.replace(/\t/g, '');
    if (after.bad.length || lost) { fails++; if (fails < 8) console.log('BAD  step ' + i + ' ' + op + ': ' + after.bad.join(', ') + (lost ? ' text changed: ' + before.text.slice(0, 120) + ' -> ' + after.text.slice(0, 120) : '')); }
  }
  await p.waitForTimeout(1200);
  const last = await p.evaluate(() => { var d = document.getElementById('editor').cloneNode(true); window.cdPageMarksOff && window.cdPageMarksOff(d); return d.innerHTML; });
  for (let i = 0; i < 2000; i++) { const moved = await p.evaluate(() => window.cdTabulaHistory.undo()); if (!moved) break; }
  const back = await p.evaluate(() => { var d = document.getElementById('editor').cloneNode(true); window.cdPageMarksOff && window.cdPageMarksOff(d); return d.innerHTML; });
  for (let i = 0; i < 2000; i++) { const moved = await p.evaluate(() => window.cdTabulaHistory.redo()); if (!moved) break; }
  const fwd = await p.evaluate(() => { var d = document.getElementById('editor').cloneNode(true); window.cdPageMarksOff && window.cdPageMarksOff(d); return d.innerHTML; });
  const norm = (h) => h.replace(/\s+/g, ' ');
  const hist = await p.evaluate(() => window.cdTabulaHistory.size());
  if (norm(back) !== norm(first)) { fails++; const A = norm(first), B = norm(back); let k = 0; while (k < A.length && A[k] === B[k]) k++; console.log('BAD  undo all the way does not give the first document; first difference at ' + k + '\n     first ' + A.slice(Math.max(0, k - 200), k + 200) + '\n     back  ' + B.slice(Math.max(0, k - 200), k + 200)); }
  if (norm(fwd) !== norm(last)) { fails++; const A = norm(last), B = norm(fwd); let k = 0; while (k < A.length && A[k] === B[k]) k++; console.log('BAD  redo all the way does not give the last document; first difference at ' + k + '\n     last ' + A.slice(Math.max(0, k - 200), k + 200) + '\n     fwd  ' + B.slice(Math.max(0, k - 200), k + 200)); }
  if (errs.length) { fails++; console.log('BAD  page errors: ' + errs.slice(0, 3).join(' | ').slice(0, 500)); }
  console.log((fails ? 'FAIL ' : 'PASS ') + ENG + ' seed ' + process.argv[5] + ': ' + steps + ' steps, ' + fails + ' faults, history ' + JSON.stringify(hist));
  await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FAIL crash ' + e); process.exit(2); });
