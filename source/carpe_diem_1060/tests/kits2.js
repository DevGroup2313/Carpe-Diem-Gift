const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext()).newPage();
  await page.goto('http://127.0.0.1:8765/cd1060.html', { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(4000);
  for (const k of ['windows', 'fire', 'mac']) {
    const b64 = await page.evaluate(async (k) => { const r = await cdBuild.make(k, '<!doctype html><title>x</title>', function(){}); const blob = r.blob || r; const u8 = new Uint8Array(await blob.arrayBuffer()); let s=''; for (let i=0;i<u8.length;i+=32768) s += String.fromCharCode.apply(null, u8.subarray(i,i+32768)); return btoa(s); }, k);
    fs.writeFileSync('../work/kit_' + k + '.zip', Buffer.from(b64, 'base64'));
  }
  await browser.close();
})();
