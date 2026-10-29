// CARPE DIEM  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
// NO LICENCE IS GRANTED. See LICENCE.txt.
//
// Makes the install kits exactly as the app's own Author Studio makes them (cdBuild.make, with the app as cdBuild.appFor
// gives it), by opening the page in a headless browser: one zip for each device the page carries a project for (Mac,
// Mac mini, Windows, Fire tablet, iPhone and iPad, the web), and the page itself as the standalone app.
// usage: node make_kits.js PAGE.html OUT_DIR
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

(async () => {
  const [page, out] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const body = fs.readFileSync(page);
  const server = http.createServer((req, res) => {
    if (req.url.split('?')[0] === '/carpe_diem.html') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(body); }
    else { res.writeHead(404); res.end(); }
  }).listen(0, '127.0.0.1');
  await new Promise(r => server.once('listening', r));
  const port = server.address().port;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const tab = await ctx.newPage();
  const errors = [];
  tab.on('pageerror', e => errors.push(e.message));
  await tab.goto('http://127.0.0.1:' + port + '/carpe_diem.html', { waitUntil: 'load', timeout: 300000 });
  await tab.waitForFunction(() => window.cdBuild && window.cdBuild.can && window.cdBuild.can(), null, { timeout: 120000 });
  const build = await tab.evaluate(() => window.CD_BUILD);
  const kinds = await tab.evaluate(() => window.cdBuild.kinds());
  console.log('Carpe Diem', build.pass, build.stamp, 'kinds:', kinds.join(', '));
  for (const kind of kinds) {
    const r = await tab.evaluate(async (kind) => {
      const html = await window.cdBuild.appFor(kind);
      const made = await window.cdBuild.make(kind, html, function () {});
      const u8 = new Uint8Array(await made.blob.arrayBuffer());
      let s = '';
      for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
      return { name: made.name, b64: btoa(s) };
    }, kind);
    const file = path.join(out, r.name.replace(/[\\/:*?"<>|]/g, '-'));
    fs.writeFileSync(file, Buffer.from(r.b64, 'base64'));
    console.log('made', path.basename(file), fs.statSync(file).size, 'bytes');
  }
  fs.copyFileSync(page, path.join(out, 'Carpe Diem ' + build.pass + ' (standalone page).html'));
  console.log('standalone page copied');
  if (errors.length) console.log('page errors:', errors.slice(0, 5).join(' | '));
  await browser.close();
  server.close();
})().catch(e => { console.error(e); process.exit(1); });
