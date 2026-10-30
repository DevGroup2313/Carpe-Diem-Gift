// render.js: each room's icon from its own key in Carpe Diem (stone colours, gold rim, glitter, serif name, own glyph)
const { chromium } = require('playwright');
const ROOMS = {
  tabula: { name: 'Tabula', g: ['#3f3f42', '#232326', '#101012'], stops: [0, 45, 100], ink: '#ffffff', glow: 'rgba(198,166,104,.5)', dark: true, mono: 'T' },
  abacus: { name: 'Abacus', g: ['#3f7a58', '#265640', '#132a1e'], stops: [0, 45, 100], ink: '#ffffff', glow: 'rgba(198,166,104,.5)', dark: true, mono: 'A' },
  slides: { name: 'Imago', g: ['#a63c47', '#7A2530', '#4e161d'], stops: [0, 48, 100], ink: '#ffffff', glow: 'rgba(198,166,104,.5)', dark: true, mono: 'I' },
  scriba: { name: 'Scriba', g: ['#4b6a92', '#2c3f60', '#141d2c'], stops: [0, 48, 100], ink: '#ffffff', glow: 'rgba(198,166,104,.5)', dark: true, mono: '',
    glyph: '<svg viewBox="0 0 24 24" fill="none" stroke="#f0dca6" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 3.5c2.9 2.2 4.3 4.6 4.3 7.2L13.5 20l-4.3-9.3c0-2.6 1.4-5 4.3-7.2z"/><path d="M13.5 11.6V20"/><circle cx="13.5" cy="10.4" r="1"/><path d="M6 9c-.8.9-1.2 1.9-1.2 3s.4 2.1 1.2 3"/><path d="M3.6 7.2C2.6 8.6 2 10.4 2 12s.6 3.4 1.6 4.8"/></svg>' },
  fontes: { name: 'Fontes', g: ['#fffdf4', '#f5ecd8', '#e9dcc0'], stops: [0, 55, 100], ink: '#145671', glow: 'rgba(198,166,104,.72)', dark: false, mono: '',
    glyph: '<svg viewBox="0 0 24 24" fill="none" stroke="#145671" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19h14"/><path d="M8.2 19c0-2.9 1.5-4.9 3.8-6.2 2.3 1.3 3.8 3.3 3.8 6.2"/><path d="M12 12.8V5"/><path d="M9.5 7.5C10.1 6.4 11 5.5 12 5c1 .5 1.9 1.4 2.5 2.5"/></svg>' },
};
// the four-pointed glint that moves over the keys
const STAR = '<svg viewBox="0 0 100 100"><path d="M50 0 C53 38 62 47 100 50 C62 53 53 62 50 100 C47 62 38 53 0 50 C38 47 47 38 50 0Z" fill="#fff"/></svg>';
function page(r, kind) {
  // kind: mac (body 824 in a 1024 canvas, Apple's grid), win (full bleed), small (the key's colours, no letter; Scriba's and Fontes's symbols; for 16-40 px)
  const S = 1024, body = kind === 'mac' ? 824 : 960, off = (S - body) / 2, rad = kind === 'mac' ? 186 : 200;
  const grad = `linear-gradient(180deg, ${r.g[0]} ${r.stops[0]}%, ${r.g[1]} ${r.stops[1]}%, ${r.g[2]} ${r.stops[2]}%)`;
  const shade = r.dark ? 'rgba(0,0,0,.5)' : 'rgba(160,135,95,.35)', hi = r.dark ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.85)';
  const tshadow = r.dark ? '0 10px 12px rgba(0,0,0,.6)' : '0 6px 0 rgba(255,255,255,.9)';
  const small = kind === 'small';
  let inner;
  // build 1073, at the owner's word: the taskbar's small sizes keep the key's colours, with no letter; Scriba's and
  // Fontes's own symbols stay. The room's name shows when the pointer rests on it
  if (small) inner = r.glyph ? `<div class="g big">${r.glyph}</div>` : '';
  else inner = (r.glyph ? `<div class="g">${r.glyph}</div>` : '') + `<div class="n${r.glyph ? '' : ' solo'}">${r.name}</div>`;
  return `<!doctype html><html><head><style>
  html,body{margin:0;background:transparent;}
  .ic{position:absolute;left:${off}px;top:${off}px;width:${body}px;height:${body}px;border-radius:${rad}px;box-sizing:border-box;
    background:${grad};border:${small ? 34 : 18}px solid #bd9a52;overflow:hidden;
    box-shadow:inset 0 26px 0 ${hi}, inset 0 -70px 90px ${shade}, inset 0 0 170px 34px ${r.glow}${kind === 'mac' ? ', 0 22px 34px rgba(0,0,0,.26)' : ''};
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;}
  .n{font-family:'Liberation Serif','Times New Roman',serif;font-weight:700;color:${r.ink};font-size:${body * 0.205}px;letter-spacing:.02em;text-shadow:${tshadow};line-height:1;}
  .n.solo{font-size:${body * 0.235}px;}
  .g{width:${body * 0.40}px;height:${body * 0.40}px;filter:${r.dark ? 'drop-shadow(0 8px 8px rgba(0,0,0,.5))' : 'drop-shadow(0 4px 0 rgba(255,255,255,.9))'};margin-top:-20px;}
  .g.big{width:${body * 0.74}px;height:${body * 0.74}px;margin:0;}
  .g svg{width:100%;height:100%;}
  .mono{font-family:'Liberation Serif','Times New Roman',serif;font-weight:700;color:${r.ink};font-size:${body * 0.66}px;line-height:1;text-shadow:${tshadow};margin-top:6px;}
  .star{position:absolute;width:${small ? 0 : body * 0.12}px;height:${body * 0.12}px;right:${body * 0.11}px;top:${body * 0.12}px;filter:drop-shadow(0 0 18px #fff) drop-shadow(0 0 40px rgba(255,250,232,.9)) drop-shadow(0 0 70px rgba(226,190,112,.8));opacity:${r.dark ? 1 : .9}}
  .star svg{width:100%;height:100%}
  </style></head><body><div class="ic">${inner}${small ? '' : `<div class="star">${STAR}</div>`}</div></body></html>`;
}
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1024, height: 1024 } });
  for (const [k, r] of Object.entries(ROOMS)) for (const kind of ['mac', 'win', 'small']) {
    await p.setContent(page(r, kind)); await p.waitForTimeout(150);
    await p.screenshot({ path: `${k}-${kind}.png`, omitBackground: true });
  }
  await b.close();
})();
