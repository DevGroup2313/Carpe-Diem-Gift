// preview2.js: the taskbar's plain keys at their real size and enlarged, one with its name shown as the pointer rests on it
const { chromium } = require('playwright');
const fs = require('fs');
const R = [['tabula', 'Tabula'], ['abacus', 'Abacus'], ['slides', 'Imago'], ['scriba', 'Scriba'], ['fontes', 'Fontes']];
const b64 = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
const big = R.map(([k, n]) => `<div class="c"><img src="${b64(k + '-small.png')}" width="96" height="96"><span>${n}</span></div>`).join('');
const bar = R.map(([k, n], i) => `<div class="b${i === 0 ? ' on' : ''}"><img src="${b64(k + '-small.png')}" width="36" height="36">${i === 0 ? `<div class="tip"><div class="tt">${n}</div><div class="th"></div></div>` : ''}</div>`).join('');
const html = `<!doctype html><html><head><style>
body{margin:0;background:#eef0f3;font-family:'Segoe UI','Liberation Sans',sans-serif;width:900px}
.row{display:flex;gap:46px;justify-content:center;padding:34px 20px 10px}
.c{display:flex;flex-direction:column;align-items:center;gap:10px;color:#333;font-size:15px}
.wall{margin:24px 0 0;height:270px;background:linear-gradient(#cfd8e3,#b9c6d4);position:relative}
.task{position:absolute;left:0;right:0;bottom:0;height:72px;background:rgba(32,32,36,.92);display:flex;justify-content:center;align-items:center;gap:10px}
.b{width:60px;height:60px;border-radius:8px;display:flex;align-items:center;justify-content:center;position:relative}
.b.on{background:rgba(255,255,255,.12)}
.b.on::after{content:'';position:absolute;bottom:3px;width:20px;height:4px;border-radius:2px;background:#9ccbff}
.tip{position:absolute;bottom:72px;left:50%;transform:translateX(-50%);width:250px;background:#2b2b2f;border-radius:10px;padding:10px;box-shadow:0 8px 24px rgba(0,0,0,.4)}
.tt{color:#fff;font-size:15px;margin:0 0 8px 4px}
.th{height:120px;border-radius:6px;background:linear-gradient(#f7f4ee,#e9e4da)}
.note{font-size:13px;color:#555;text-align:center;padding:6px 0 0}
</style></head><body><div class="row">${big}</div><div class="note">The taskbar's icons: no letters; Scriba and Fontes keep their symbols</div>
<div class="wall"><div class="task">${bar}</div></div></body></html>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 900, height: 500 }, deviceScaleFactor: 1.5 });
  await p.setContent(html); await p.waitForTimeout(200);
  await p.screenshot({ path: 'preview_taskbar.png', fullPage: true }); await b.close();
})();
