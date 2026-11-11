// t_blocks.js TABULA_URL [engine]: paragraphs and bullet points as a person makes them with the keyboard and the
// buttons, in Tabula alone. Each case states what Word would hold; every word typed must still be there.
const pw = require('playwright');
const URL = process.argv[2], ENG = process.argv[3] || 'chromium';
let bad = 0, ok = 0;
(async () => {
  const b = ENG === 'chromium' ? await pw.chromium.launch({ executablePath: process.env.CD_CHROMIUM || '/opt/pw-browsers/chromium' }) : await pw[ENG].launch();
  const p = await (await b.newContext({ viewport: { width: 1300, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(1500);
  const mod = ENG === 'webkit' ? 'Meta' : 'Control';
  const html = async () => (await p.evaluate(() => { var d = document.getElementById('editor').cloneNode(true); if (window.cdPageMarksOff) window.cdPageMarksOff(d); return d.innerHTML; }))
    .replace(/<br>/g, '').replace(/ style=""/g, '').replace(/\s+/g, ' ');
  const reset = async (h) => { await p.evaluate((h) => { var ed = document.getElementById('editor'); ed.innerHTML = h || '<p><br></p>'; ed.focus(); var r = document.createRange(); var last = ed.lastElementChild || ed; var w = document.createTreeWalker(last, NodeFilter.SHOW_TEXT), t, lt = null; while ((t = w.nextNode())) lt = t; if (lt) { r.setStart(lt, lt.nodeValue.length); } else r.setStart(last, 0); r.collapse(true); var s = getSelection(); s.removeAllRanges(); s.addRange(r); }, h); await p.waitForTimeout(120); };
  const press = async (sel) => { await p.evaluate((sel) => { var x = document.querySelector(sel); x.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); x.click(); }, sel); await p.waitForTimeout(120); };
  const type = async (t) => { await p.keyboard.type(t); };
  const key = async (k) => { await p.keyboard.press(k); await p.waitForTimeout(40); };
  const expect = async (name, want) => { await p.waitForTimeout(80); const h = await html(); const good = want instanceof RegExp ? want.test(h) : h === want; if (good) { ok++; console.log('ok   ' + name); } else { bad++; console.log('BAD  ' + name + '\n       want ' + want + '\n       got  ' + h); } return h; };
  const focused = async () => p.evaluate(() => document.activeElement && document.activeElement.id);

  // 1. a list typed from a paragraph, with a nested level, leaving it with Enter twice
  await reset('<p><br></p>');
  await type('Intro'); await key('Enter'); await press('button[data-cmd="insertUnorderedList"]');
  await type('a'); await key('Enter'); await type('b'); await key('Enter'); await key('Tab'); await type('b1'); await key('Enter'); await type('b2');
  await key('Enter'); await key('Shift+Tab'); await type('c'); await key('Enter'); await key('Enter'); await type('after');
  await expect('a list with a nested level, typed', '<p>Intro</p><ul><li>a</li><li>b<ul><li>b1</li><li>b2</li></ul></li><li>c</li></ul><p>after</p>');

  // 2. Undo walks back, Redo forward, and nothing is left half done
  for (let i = 0; i < 40; i++) await key(mod + '+z');
  const h0 = await html();
  if (/after|b1|Intro/.test(h0)) { bad++; console.log('BAD  undo to the beginning: ' + h0); } else { ok++; console.log('ok   undo goes back to the start'); }
  for (let i = 0; i < 40; i++) await key(ENG === 'webkit' ? 'Meta+Shift+z' : 'Control+y');
  await expect('redo brings everything back', '<p>Intro</p><ul><li>a</li><li>b<ul><li>b1</li><li>b2</li></ul></li><li>c</li></ul><p>after</p>');

  // 3. bullets taken off several items: one paragraph each, not one paragraph with line breaks
  await reset('<ul><li>one</li><li>two</li><li>three</li></ul>');
  await p.evaluate(() => { var ed = document.getElementById('editor'); var r = document.createRange(); r.selectNodeContents(ed); var s = getSelection(); s.removeAllRanges(); s.addRange(r); });
  await press('button[data-cmd="insertUnorderedList"]');
  await expect('bullets off: a paragraph for each item', '<p>one</p><p>two</p><p>three</p>');
  await press('button[data-cmd="insertOrderedList"]');
  await expect('numbering on three paragraphs', '<ol><li>one</li><li>two</li><li>three</li></ol>');

  // 4. Increase Indent on a paragraph is an indent, not a quotation
  await reset('<p>First.</p><p>Second.</p>');
  await press('button[data-cmd="indent"]');
  await expect('Increase Indent', '<p>First.</p><p style="margin-left: 48px;">Second.</p>');
  await press('button[data-cmd="indent"]'); await press('button[data-cmd="outdent"]');
  await expect('Increase twice, Decrease once', '<p>First.</p><p style="margin-left: 48px;">Second.</p>');
  await key('Enter'); await type('Third.');
  await expect('Enter keeps the indent, as Word does', /<p style="margin-left: 48px;">Second\.<\/p><p style="margin-left: 48px;">Third\.<\/p>$/);

  // 5. Tab within a line is a tab, and the caret stays in the document
  await reset('<p>Name</p>');
  await key('Tab'); await type('Value');
  await expect("Tab in a line", /^<p>Name<span class="cd-tab"> <\/span>Value<\/p>$/);
  const f = await focused(); if (f === 'editor') { ok++; console.log('ok   the caret stays in the document after Tab'); } else { bad++; console.log('BAD  focus left the document: ' + f); }

  // 6. Backspace at the start of the first item takes its bullet off
  await reset('<ul><li>first</li><li>second</li></ul>');
  await p.evaluate(() => { var li = document.querySelector('#editor li'); var r = document.createRange(); r.setStart(li.firstChild, 0); r.collapse(true); var s = getSelection(); s.removeAllRanges(); s.addRange(r); });
  await key('Backspace');
  await expect('Backspace at the start of the first item', '<p>first</p><ul><li>second</li></ul>');

  // 7. a heading, Enter: a real paragraph
  await reset('<h2>Heading</h2>');
  await key('Enter'); await type('Body text.'); await key('Enter'); await type('More.');
  await expect('paragraphs after a heading', '<h2>Heading</h2><p>Body text.</p><p>More.</p>');

  // 8. old documents put in order when they are opened
  await reset('<p>x<ul><li>a</li></ul></p><div>plain</div><ul><li>p</li><ul><li>q</li></ul><li>r</li></ul><blockquote style="margin: 0 0 0 40px; border: none; padding: 0px;"><p>moved in</p></blockquote>');
  await p.waitForTimeout(150);
  await expect('an old document put in order', '<p>x</p><ul><li>a</li></ul><p>plain</p><ul><li>p<ul><li>q</li></ul></li><li>r</li></ul><p style="margin-left: 48px;">moved in</p>');

  // 9. Tab and Shift+Tab on a chosen run of items
  await reset('<ul><li>one</li><li>two</li><li>three</li></ul>');
  await p.evaluate(() => { var l = document.querySelectorAll('#editor li'); var r = document.createRange(); r.setStart(l[1].firstChild, 0); r.setEnd(l[2].firstChild, 3); var s = getSelection(); s.removeAllRanges(); s.addRange(r); });
  await key('Tab');
  await expect('two items moved in together', '<ul><li>one<ul><li>two</li><li>three</li></ul></li></ul>');
  await key('Shift+Tab');
  await expect('and back out', '<ul><li>one</li><li>two</li><li>three</li></ul>');

  // 10. Enter on an empty nested item moves it out a level; again, ends the list
  await reset('<ul><li>a<ul><li>b</li></ul></li></ul>');
  await key('Enter'); await key('Enter'); await type('c'); await key('Enter'); await key('Enter'); await type('d');
  await expect('Enter on empty items', '<ul><li>a<ul><li>b</li></ul></li><li>c</li></ul><p>d</p>');

  // 11. a table: Tab moves to the next cell, and past the last cell adds a row
  await reset('<table><tbody><tr><td>1</td><td>2</td></tr></tbody></table><p>end</p>');
  await p.evaluate(() => { var td = document.querySelector('#editor td'); var r = document.createRange(); r.setStart(td.firstChild, 1); r.collapse(true); var s = getSelection(); s.removeAllRanges(); s.addRange(r); });
  await key('Tab'); await type('X'); await key('Tab'); await type('Y');
  await expect('Tab in a table', /<td>1<\/td><td>X<\/td><\/tr><tr><td>Y<\/td><td><\/td><\/tr>/);

  // 12. Undo after a list change and after typing, one step each
  await reset('<p>alpha</p>');
  await p.waitForTimeout(60);
  await type(' beta'); await p.waitForTimeout(1000);
  await press('button[data-cmd="insertUnorderedList"]');
  await key(mod + '+z');
  await expect('undo the bullets only', '<p>alpha beta</p>');
  await key(mod + '+z');
  await expect('then the typing', '<p>alpha</p>');

  if (errs.length) { bad++; console.log('BAD  page errors: ' + errs.join(' | ').slice(0, 600)); }
  console.log((bad ? 'FAIL ' : 'PASS ') + ENG + ': ' + ok + ' good, ' + bad + ' bad');
  await b.close(); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL crash ' + e); process.exit(2); });
