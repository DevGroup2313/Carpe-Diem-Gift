// t_print_host.js PAGE_URL OUTDIR [engines]: Tabula's Print inside Carpe Diem. In a browser the room prints its clean
// copy in a frame of its own. In the Mac app (stood in for here: pywebview's "cocoa" window, whose window.print asks
// the app) the app's own window prints it from a surface only the printer sees: the pages hold the document alone,
// in colour, on white, and nothing of the app around it.
const pw = require('playwright'), fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const URL = process.argv[2], OUT = process.argv[3], ENG = (process.argv[4] || 'chromium,webkit,firefox').split(',');
async function launch(n) { return n === 'chromium' ? pw.chromium.launch(process.env.CD_CHROMIUM ? { executablePath: process.env.CD_CHROMIUM } : {}) : pw[n].launch(); }
const SAMPLE = '<h1 style="color:#b3261e">Red heading wqw</h1><p>Plain, <span style="color:#1565c0">blue words</span>, <span style="background-color:#ffeb3b">yellow highlight</span>.</p>' +
  '<table style="border-collapse:collapse;width:100%"><tr><th style="background:#1b6b93;color:#fff;border:1px solid #333;padding:6px">Head A</th></tr><tr><td style="border:1px solid #333;padding:6px;background:#fff3e0">orange cell</td></tr></table><ol>' +
  Array.from({ length: 60 }, (_, i) => '<li>Step ' + (i + 1) + ' zqx' + (i + 1) + 'w</li>').join('') + '</ol>';
const INIT = (mac) => `(function(){ try {
  if (window === window.top) { window.__printLog = [];
    if (${mac}) { window.pywebview = { platform: 'cocoa', token: 't', api: { print_document: function () { window.__printLog.push('host:print_document'); return Promise.resolve(true); } } };
      try { Object.defineProperty(window, 'webkit', { value: { messageHandlers: { browserDelegate: { postMessage: function (m) { window.__printLog.push('mac-panel:' + m); } } } }, configurable: true }); } catch (e) {}
      window.print = function () { window.webkit.messageHandlers.browserDelegate.postMessage('print'); }; }
    else window.print = function () { window.__printLog.push('top'); }; }
  else { window.print = function () { try { window.top.__printLog.push('frame:' + ((window.frameElement && window.frameElement.id) || '?')); } catch (e) {} }; }
} catch (e) {} })();`;
(async () => {
  let bad = 0;
  for (const e of ENG) {
    const b = await launch(e);
    for (const mode of ['browser', 'mac']) {
      const c = await b.newContext({ viewport: { width: 1400, height: 900 } }); await c.addInitScript(INIT(mode === 'mac'));
      const p = await c.newPage(); const errs = []; p.on('pageerror', x => errs.push(String(x.message).slice(0, 140)));
      await p.goto(URL + '#cd=tabula', { waitUntil: 'load', timeout: 240000 }); await p.waitForTimeout(5000);
      const fr = p.frames().find(f => f !== p.mainFrame() && /cdPrintDocument/.test('') === false && f.name() !== undefined && f.parentFrame() === p.mainFrame() && true);
      const frame = await (await p.$('#frame-tabula')).contentFrame();
      await frame.evaluate((html) => { var ed = document.getElementById('editor'); ed.innerHTML = html; ed.dispatchEvent(new Event('input', { bubbles: true })); document.documentElement.classList.add('cd-dark'); }, SAMPLE);
      await p.waitForTimeout(1500);
      await frame.evaluate(() => { window.cdPrintDocument(); });
      await p.waitForTimeout(2500);
      const r = await p.evaluate(() => { var h = document.getElementById('cd-print-surface'), root = h && h.shadowRoot, h1 = root && root.querySelector('h1'), bd = root && root.querySelector('body');
        return { log: window.__printLog, surface: !!h, shadowBody: bd ? getComputedStyle(bd).display : '', h1: h1 ? getComputedStyle(h1).color : '', on: document.documentElement.classList.contains('cd-print-surface-on') }; });
      const inner = await frame.evaluate(() => !!document.getElementById('cd-print-frame'));
      let ok, extra = {};
      if (mode === 'browser') ok = r.log.length === 1 && r.log[0] === 'frame:cd-print-frame' && !r.surface && inner;
      else {
        ok = r.log.length === 1 && r.log[0] === 'mac-panel:print' && r.surface && !inner && r.shadowBody === 'block' && r.h1 === 'rgb(179, 38, 30)';
        await p.emulateMedia({ media: 'print' }); await p.waitForTimeout(400);
        const vis = await p.evaluate(() => { var shown = [].filter.call(document.body.children, function (x) { return x.id !== 'cd-print-surface' && getComputedStyle(x).display !== 'none'; }).map(function (x) { return x.id || x.tagName; });
          var h = document.getElementById('cd-print-surface'), r = h.getBoundingClientRect(), li = h.shadowRoot.querySelectorAll('li'), bg = getComputedStyle(h.shadowRoot.querySelector('th')).backgroundColor, bodyBg = getComputedStyle(h.shadowRoot.querySelector('body')).backgroundColor, ink = getComputedStyle(h.shadowRoot.querySelector('li')).color;
          return { appShown: shown.slice(0, 4), surfaceDisplay: getComputedStyle(h).display, h: Math.round(r.height), items: li.length, th: bg, bodyBg: bodyBg, ink: ink }; });
        extra = vis;
        ok = ok && vis.appShown.length === 0 && vis.surfaceDisplay === 'block' && vis.h > 1500 && vis.items === 60 && vis.th === 'rgb(27, 107, 147)' && /rgb\(255, 255, 255\)/.test(vis.bodyBg) && !/rgb\((2[0-9]{2}), /.test(vis.ink);
        if (e === 'chromium') {
          const pdf = path.join(OUT, 'host_mac.pdf'); await p.pdf({ path: pdf, printBackground: false, preferCSSPageSize: true });
          const text = execFileSync('pdftotext', ['-layout', pdf, '-']).toString(); const pages = (text.match(/\f/g) || []).length;
          const once = [1, 30, 60].every(i => (text.match(new RegExp('zqx' + i + 'w', 'g')) || []).length === 1);
          const chrome = /Tabula|Back|Forward|Clipboard|Carpe Diem/.test(text);
          extra.pdf = { pages, once, appWords: chrome, bytes: fs.statSync(pdf).size };
          ok = ok && pages >= 2 && pages <= 4 && once && !chrome;
        }
        await p.emulateMedia({ media: 'screen' });
        const hidden = await p.evaluate(() => getComputedStyle(document.getElementById('cd-print-surface')).display);
        extra.onScreen = hidden; ok = ok && hidden === 'none';
      }
      ok = ok && !errs.length; if (!ok) bad++;
      console.log((ok ? 'ok  ' : 'BAD ') + e.padEnd(8) + mode.padEnd(8) + JSON.stringify(r.log) + ' ' + JSON.stringify(extra) + (errs.length ? ' errors ' + errs[0] : ''));
      await c.close();
    }
    await b.close();
  }
  console.log(bad ? 'FAIL' : 'PASS'); process.exit(bad ? 1 : 0);
})();
