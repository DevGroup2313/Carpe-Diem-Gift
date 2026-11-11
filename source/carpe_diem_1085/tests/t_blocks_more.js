// t_blocks_more.js TABULA_URL [engine]: the rest of what touches Tabula's lists and paragraphs. The Bullet and Numbering
// libraries and the multilevel list; a pasted list landing inside a paragraph; a Word file made and opened again (tabs,
// indents, nested lists); and a long document (about 100,000 words): typing, a list made, Undo, all in good time.
const pw = require('playwright');
const URL = process.argv[2], ENG = process.argv[3] || 'chromium';
let bad = 0, ok = 0;
const say = (good, name, info) => { if (good) { ok++; console.log('ok   ' + name + (info ? '  ' + info : '')); } else { bad++; console.log('BAD  ' + name + (info ? '\n       ' + info : '')); } };
(async () => {
  const b = ENG === 'chromium' ? await pw.chromium.launch({ executablePath: process.env.CD_CHROMIUM || '/opt/pw-browsers/chromium' }) : await pw[ENG].launch();
  const p = await (await b.newContext({ viewport: { width: 1300, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1500);
  const mod = ENG === 'webkit' ? 'Meta' : 'Control';
  const html = async () => (await p.evaluate(() => { var d = document.getElementById('editor').cloneNode(true); if (window.cdPageMarksOff) window.cdPageMarksOff(d); return d.innerHTML; })).replace(/<br>/g, '').replace(/\s+/g, ' ');
  const reset = async (h) => { await p.evaluate((h) => { var ed = document.getElementById('editor'); ed.innerHTML = h; ed.focus(); var w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT), t, lt = null; while ((t = w.nextNode())) lt = t; var r = document.createRange(); if (lt) r.setStart(lt, lt.nodeValue.length); else r.setStart(ed, 0); r.collapse(true); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }, h); await p.waitForTimeout(120); };
  const pick = async (fn) => { await p.evaluate(fn); await p.waitForTimeout(40); };
  const click = async (sel) => { await p.evaluate((sel) => { var x = document.querySelector(sel); x.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); x.click(); }, sel); await p.waitForTimeout(150); };

  // the Bullet Library on two paragraphs, then the Numbering Library's roman numerals
  await reset('<p>one</p><p>two</p>');
  await pick(() => { var ed = document.getElementById('editor'); var r = document.createRange(); r.selectNodeContents(ed); var s = getSelection(); s.removeAllRanges(); s.addRange(r); });
  await click('#bulGalBtn'); await click('#cdBulGal .wt[data-i="2"]');
  let h = await html(); say(/^<ul style="list-style-type: square;"><li>one<\/li><li>two<\/li><\/ul>$/.test(h), 'Bullet Library: square bullets on two paragraphs', h);
  await pick(() => { var ed = document.getElementById('editor'); var r = document.createRange(); r.selectNodeContents(ed); var s = getSelection(); s.removeAllRanges(); s.addRange(r); });
  await click('#numGalBtn'); await click('#cdNumGal .wt[data-i="5"]');
  h = await html(); say(/^<ol style="list-style-type: upper-roman;"><li>one<\/li><li>two<\/li><\/ol>$/.test(h), 'Numbering Library: roman numerals', h);

  // the multilevel list: a nested item keeps the level's own marker
  await reset('<p>top</p><p>under</p>');
  await pick(() => { var ed = document.getElementById('editor'); var r = document.createRange(); r.selectNodeContents(ed); var s = getSelection(); s.removeAllRanges(); s.addRange(r); });
  const hasMll = await p.evaluate(() => !!document.getElementById('mllGalBtn'));
  if (hasMll) {
    await click('#mllGalBtn'); await click('#cdMllGal .wt[data-i="1"], [id*="Mll"] .wt[data-i="1"]');
    await pick(() => { var l = document.querySelectorAll('#editor li'); var r = document.createRange(); r.setStart(l[1].firstChild, 0); r.collapse(true); var s = getSelection(); s.removeAllRanges(); s.addRange(r); });
    await p.keyboard.press('Tab'); await p.waitForTimeout(150);
    h = await html(); say(/^<ol data-cd-mll="mnum" style="list-style-type: decimal;"><li>top<ol style="list-style-type: lower-alpha;"><li>under<\/li><\/ol><\/li><\/ol>$/.test(h), 'multilevel list: Tab gives the second level its own marker', h);
  } else say(false, 'multilevel list button found');

  // a list pasted into the middle of a paragraph lands as its own block
  await reset('<p>before after</p>');
  await pick(() => { var t = document.querySelector('#editor p').firstChild; var r = document.createRange(); r.setStart(t, 7); r.collapse(true); var s = getSelection(); s.removeAllRanges(); s.addRange(r); });
  await p.evaluate(() => { document.execCommand('insertHTML', false, '<ul><li>pasted one</li><li>pasted two</li></ul>'); });
  await p.waitForTimeout(300);
  h = await html();
  const words = ['before', 'pasted one', 'pasted two', 'after'].every(w => h.indexOf(w) >= 0);
  say(words && !/<p>[^<]*<ul/.test(h) && !/<li>[^<]*<p>/.test(h), 'a pasted list does not sit inside a paragraph, and no word is lost', h);

  // Word: a file made from Tabula holds the tab, the indent and the nested list, and opens again the same
  await reset('<p>Name<span class="cd-tab">\t</span>Value</p><p style="margin-left: 48px; text-indent: -24px;">Indented</p><ul><li>a<ul><li>b</li></ul></li><li>c</li></ul>');
  const wordXml = await p.evaluate(async () => { var blob = window.__tbBuildDocx(); var buf = await blob.arrayBuffer(); window.__cdLastDocx = buf; var u = new Uint8Array(buf); var s = ''; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return s.length; });
  const doc = await p.evaluate(async () => {
    var buf = window.__cdLastDocx, d = new DataView(buf), n = buf.byteLength, eocd = -1;
    for (var i = n - 22; i >= 0; i--) if (d.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    var count = d.getUint16(eocd + 10, true), q = d.getUint32(eocd + 16, true);
    for (var k = 0; k < count; k++) {
      var meth = d.getUint16(q + 10, true), csz = d.getUint32(q + 20, true), nl = d.getUint16(q + 28, true), xl = d.getUint16(q + 30, true), cl = d.getUint16(q + 32, true), lo = d.getUint32(q + 42, true);
      var name = new TextDecoder().decode(new Uint8Array(buf, q + 46, nl));
      if (name === 'word/document.xml') { var lnl = d.getUint16(lo + 26, true), lxl = d.getUint16(lo + 28, true); var data = new Uint8Array(buf, lo + 30 + lnl + lxl, csz);
        if (meth === 0) return new TextDecoder().decode(data);
        var out = await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer(); return new TextDecoder().decode(out); }
      q += 46 + nl + xl + cl;
    }
    return '';
  });
  say(/Name<\/w:t>[\s\S]{0,200}<w:tab\/>[\s\S]{0,200}Value/.test(doc) && !/\t/.test(doc), 'Word file: the tab is a Word tab');
  say(/<w:ind w:left="720"[^>]*\/>[\s\S]*Indented/.test(doc), 'Word file: the indent is a Word indent (half an inch)');
  say(/<w:ilvl w:val="1"\/>[\s\S]*>b</.test(doc), 'Word file: the nested item is at the second level');
  if (await p.evaluate(() => typeof window.__tbImportDocx === 'function' && typeof window.cdOpenDocx === 'function')) {
    await p.evaluate(async () => { var f = new File([window.__cdLastDocx], 'back.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }); await window.cdOpenDocx(f); });
    await p.waitForTimeout(800);
    h = await html();
    say(/Name<span[^>]*> <\/span>Value/.test(h) && /<p style="margin-left: 48px;[^"]*">Indented/.test(h) && /<li>a<ul><li>b<\/li><\/ul><\/li><li>c<\/li>/.test(h.replace(/ style="[^"]*"/g, '').replace(/ class="[^"]*"/g, '').replace(/<\/?span>/g, '')), 'the Word file opened again: the tab, the indent and the nested list come back', h.slice(0, 500));
  }

  // a long document: about 100,000 words in 3,000 paragraphs
  await p.evaluate(() => { var w = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation'.split(' '); var out = []; for (var i = 0; i < 3000; i++) { var s = []; for (var j = 0; j < 34; j++) s.push(w[(i * 7 + j) % w.length]); out.push('<p>' + s.join(' ') + '.</p>'); } var ed = document.getElementById('editor'); ed.innerHTML = out.join(''); });
  await p.waitForTimeout(3000);
  const words2 = await p.evaluate(() => document.getElementById('editor').textContent.split(/\s+/).filter(Boolean).length);
  await pick(() => { var ed = document.getElementById('editor'); var t = ed.children[1500].firstChild; ed.focus(); var r = document.createRange(); r.setStart(t, 10); r.collapse(true); var s = getSelection(); s.removeAllRanges(); s.addRange(r); });
  let t0 = Date.now(); await p.keyboard.type('quick brown fox ', { delay: 0 }); const typeMs = Date.now() - t0;
  await p.waitForTimeout(1200);
  t0 = Date.now(); const listMs = await p.evaluate(() => { var a = performance.now(); document.execCommand('insertUnorderedList'); return performance.now() - a; });
  const undoMs = await p.evaluate(() => { var a = performance.now(); window.cdTabulaHistory.undo(); return performance.now() - a; });
  const undo2 = await p.evaluate(() => { var a = performance.now(); window.cdTabulaHistory.undo(); return performance.now() - a; });
  const after = await p.evaluate(() => { var ed = document.getElementById('editor'); return { n: ed.children.length, has: ed.textContent.indexOf('quick brown fox') >= 0, lists: ed.querySelectorAll('ul').length }; });
  say(words2 > 99000 && after.n === 3000 && !after.has && after.lists === 0, 'a document of ' + words2 + ' words: list made and undone, typing undone', JSON.stringify(after));
  say(typeMs < 16 * 400 && listMs < 300 && undoMs < 400 && undo2 < 400, 'in good time', 'typing 16 letters ' + typeMs + ' ms, a list ' + Math.round(listMs) + ' ms, undo ' + Math.round(undoMs) + ' and ' + Math.round(undo2) + ' ms');

  if (errs.length) say(false, 'page errors', errs.join(' | ').slice(0, 600));
  console.log((bad ? 'FAIL ' : 'PASS ') + ENG + ': ' + ok + ' good, ' + bad + ' bad');
  await b.close(); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL crash ' + e); process.exit(2); });
