// t_open_with.js PAGE_URL [engine]: a file handed to Carpe Diem by the app it runs in reaches Tabula. Three hosts are
// stood in for: the Mac and Windows apps (window.pywebview.api, answers as promises), the Fire tablet (window.CarpeNative,
// answers as words) and the iPhone and iPad kit's shell (window.CarpeFiles). Each hands over a Word document (made by
// Tabula itself), plain text, a web page and Markdown; the Mac's also hands over an RTF file, which Tabula refuses in
// words. Each must land in Tabula with its words, its title from the file's name, and the host told what became of it.
const pw = require('playwright');
const URL = process.argv[2], ENG = process.argv[3] || 'chromium';
let bad = 0, ok = 0;
const say = (g, n, i) => { if (g) ok++; else bad++; console.log((g ? 'ok   ' : 'BAD  ') + n + (i ? '  ' + String(i).slice(0, 300) : '')); };
const b64 = (s) => Buffer.from(s, 'utf8').toString('base64');
const FILES = {
  txt: ['Field notes.txt', b64('First paragraph of the notes.\n\nSecond paragraph, with an accent: été.')],
  html: ['A web page.html', b64('<!doctype html><html><body><h2>Page heading</h2><p>A paragraph from the web page.</p></body></html>')],
  md: ['Chapter plan.md', b64('# Chapter one\n\nThe **argument** in brief, with *emphasis*.\n\n- first point\n- second point\n\n1. step one\n2. step two\n')],
  rtf: ['Old letter.rtf', b64('{\\rtf1\\ansi Hello}')]
};
(async () => {
  const b = ENG === 'chromium' ? await pw.chromium.launch({ executablePath: process.env.CD_CHROMIUM || '/opt/pw-browsers/chromium' }) : await pw[ENG].launch();
  // a Word document, made by Tabula itself
  let docx = null;
  {
    const ctx = await b.newContext({ viewport: { width: 1300, height: 900 } }); const p = await ctx.newPage();
    await p.goto(URL + '#cd=tabula', { waitUntil: 'load', timeout: 240000 }); await p.waitForTimeout(6000);
    const f = await (await p.$('#frame-tabula')).contentFrame();
    docx = await f.evaluate(async () => { var ed = document.getElementById('editor'); ed.innerHTML = '<h2>Word heading</h2><p>A paragraph from a Word document.</p>'; var blob = window.__tbBuildDocx(); var u = new Uint8Array(await blob.arrayBuffer()), s = ''; for (var i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(s); });
    await ctx.close();
  }
  say(docx && docx.length > 1000, 'a Word document made by Tabula, to hand over', docx ? docx.length + ' characters' : '');
  FILES.docx = ['Thesis chapter.docx', docx];
  const HOSTS = {
    desktop: (files) => { window.__given = []; var q = files.slice(), cur = null; window.pywebview = { api: {
      take_file: function (w) { if (!q.length) return Promise.resolve(null); cur = q.shift(); return Promise.resolve({ key: 'k' + q.length, name: cur[0], parts: 2 }); },
      file_part: function (k, i) { var s = cur[1], h = Math.ceil(s.length / 4) * 2; return Promise.resolve(i === 0 ? s.slice(0, h) : s.slice(h)); },
      file_opened: function (n, h) { window.__given.push(n + ': ' + h); return Promise.resolve(true); } } }; },
    tablet: (files) => { window.__given = []; var q = files.slice(), cur = null; window.CarpeNative = {
      takeFile: function (w) { if (!q.length) return ''; cur = q.shift(); return JSON.stringify({ key: 'a' + q.length, name: cur[0], parts: 1 }); },
      filePart: function (k, i) { return i === 0 ? cur[1] : ''; },
      fileOpened: function (n, h) { window.__given.push(n + ': ' + h); }, saveFile: function () { return false; } }; },
    iphone: (files) => { window.__given = []; var q = files.slice(), cur = null; window.CarpeFiles = {
      take_file: function () { if (!q.length) return Promise.resolve(null); cur = q.shift(); return Promise.resolve({ key: 'i' + q.length, name: cur[0], parts: 1 }); },
      file_part: function (k, i) { return Promise.resolve(i === 0 ? cur[1] : ''); },
      file_opened: function (n, h) { window.__given.push(n + ': ' + h); return Promise.resolve(true); } }; }
  };
  const CASES = [['docx', /A paragraph from a Word document/, 'Thesis chapter'], ['txt', /Second paragraph, with an accent: été/, 'Field notes'],
    ['html', /A paragraph from the web page/, 'A web page'], ['md', /The argument in brief/, 'Chapter plan']];
  for (const host of Object.keys(HOSTS)) {
    for (const [kind, words, title] of CASES) {
      const ctx = await b.newContext({ viewport: { width: 1300, height: 900 } });
      const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
      p.on('dialog', d => d.accept());
      await p.addInitScript(HOSTS[host], [FILES[kind]]);
      await p.goto(URL, { waitUntil: 'load', timeout: 240000 });
      let got = null;
      for (let t = 0; t < 60 && !got; t++) {
        await p.waitForTimeout(1000);
        got = await p.evaluate((src) => { var re = new RegExp(src); var fs = document.querySelectorAll('iframe'); for (var i = 0; i < fs.length; i++) { try { var d = fs[i].contentDocument, ed = d && d.getElementById('editor'); if (ed && re.test(ed.textContent)) return { html: ed.innerHTML.slice(0, 400), title: (d.getElementById('docTitle') || {}).value, given: window.__given }; } catch (e) {} } return null; }, words.source);
      }
      const titled = got && got.title === title, told = got && (got.given || []).some(x => /opened/.test(x));
      let extra = true;
      if (got && kind === 'md') extra = /<h2>Chapter one<\/h2>/.test(got.html) && /<b>argument<\/b>/.test(got.html) && /<i>emphasis<\/i>/.test(got.html) && /<ul><li>first point<\/li>/.test(got.html) && /<ol><li>step one<\/li>/.test(got.html);
      if (!told && got) { await p.waitForTimeout(1500); got.given = await p.evaluate(() => window.__given); }
      say(!!got && titled && extra && (got.given || []).some(x => /: opened/.test(x)) && !errs.length, host + ': ' + kind + ' opens in Tabula', JSON.stringify(got ? { title: got.title, given: got.given, md: kind === 'md' ? got.html.slice(0, 200) : undefined } : { errs }));
      await ctx.close();
    }
  }
  // a kind Tabula cannot read is refused in words, and nothing is lost
  {
    const ctx = await b.newContext({ viewport: { width: 1300, height: 900 } }); const p = await ctx.newPage();
    const said = []; p.on('dialog', d => { said.push(d.message()); d.accept(); });
    await p.addInitScript(HOSTS.desktop, [FILES.rtf]);
    await p.goto(URL, { waitUntil: 'load', timeout: 240000 });
    let given = [];
    for (let t = 0; t < 30 && !given.length; t++) { await p.waitForTimeout(1000); given = await p.evaluate(() => window.__given || []); }
    say(given.some(x => /Old letter\.rtf: not opened: Tabula does not read this kind/.test(x)) && said.some(m => /does not read this kind of file yet/.test(m)), 'an RTF file is refused in words', JSON.stringify({ given, said }));
    await ctx.close();
  }
  console.log((bad ? 'FAIL ' : 'PASS ') + ENG + ': ' + ok + ' good, ' + bad + ' bad');
  await b.close(); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL crash ' + String(e).slice(0, 400)); process.exit(2); });
