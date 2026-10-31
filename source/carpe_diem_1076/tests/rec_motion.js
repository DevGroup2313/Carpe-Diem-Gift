// rec_motion.js URL OUTDIR: a short film of the new pages' feel, with a visible pointer: keys rising and sinking, cards
// lifting, a step bowing out and another arriving, the energy switch, the tabs, a milestone ticked and the road filling.
const { chromium } = require('playwright');
const [URL_, OUT] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: OUT, size: { width: 1280, height: 800 } } });
  const p = await ctx.newPage();
  await p.goto(URL_, { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(3500);
  await p.evaluate(() => {
    try { cdCloseDoor(); } catch (e) {}
    state.themeAuto = false; state.theme = 'light'; saveState(); applyTheme();
    const dot = document.createElement('div');
    dot.style.cssText = 'position:fixed;z-index:2147483647;width:22px;height:22px;margin:-3px 0 0 -3px;pointer-events:none;left:0;top:0;transition:transform .05s';
    dot.innerHTML = '<svg width="22" height="22" viewBox="0 0 22 22"><path d="M3 2l14 9-6 1.5L8 19z" fill="#fff" stroke="#1d2a35" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(dot);
    document.addEventListener('mousemove', e => { dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px'; }, true);
    document.addEventListener('mousedown', () => { dot.style.transform = 'scale(.82)'; }, true);
    document.addEventListener('mouseup', () => { dot.style.transform = ''; }, true);
  });
  const glide = async (sel, steps = 18) => { if (!(await p.locator(sel).count())) return null; const bb = await p.locator(sel).first().boundingBox(); if (!bb) return null; await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps }); return bb; };
  const press = async (sel, hold = 220) => { const bb = await glide(sel); if (!bb) return; await p.waitForTimeout(500); await p.mouse.down(); await p.waitForTimeout(hold); await p.mouse.up(); };
  const scrollTo = async (sel) => { await p.evaluate((sel) => { const n = document.querySelector(sel), sc = document.getElementById('cd-scroll') || document.scrollingElement; if (n && sc) sc.scrollTo({ top: n.getBoundingClientRect().top + sc.scrollTop - 90, behavior: 'smooth' }); }, sel); await p.waitForTimeout(900); };

  // Candidatus › Overview: cards pop in, the road and rings fill
  await p.evaluate(() => { showSection('applications'); candUI.tab = 'overview'; renderCandidature(); });
  await p.mouse.move(640, 120);
  await p.waitForTimeout(1600);
  await glide('#cdx-cand .cdx-next .cdx-key.cdx-main'); await p.waitForTimeout(700);
  await glide('#cdx-cand .cdx-next [data-break]'); await p.waitForTimeout(600);
  await glide('#cdx-cand .cdx-next [data-skip]'); await p.waitForTimeout(500);
  await press('#cdx-cand [data-energy="low"]'); await p.waitForTimeout(900);
  await press('#cdx-cand [data-energy="some"]'); await p.waitForTimeout(700);
  await scrollTo('#cdx-cand .cdx-board');
  await glide('#cdx-cand .cdx-col.next .cdx-item >> nth=0'); await p.waitForTimeout(600);
  await press('#cdx-cand .cdx-col.next .cdx-item >> nth=0 >> [data-move$=":later"]'); await p.waitForTimeout(900);
  await glide('#cdx-cand [data-add="now"] input'); await p.mouse.down(); await p.mouse.up();
  await p.keyboard.type('Email the admissions office', { delay: 35 }); await p.waitForTimeout(250);
  await press('#cdx-cand [data-add="now"] button'); await p.waitForTimeout(900);
  await press('#cdx-cand .cdx-col.now .cdx-item >> nth=0 >> [data-done]'); await p.waitForTimeout(1100);
  await scrollTo('#cdx-cand .cdx-road');
  await glide('#cdx-cand .cdx-stop >> nth=2'); await p.waitForTimeout(700);
  await glide('#cdx-cand .cdx-ring >> nth=0'); await p.waitForTimeout(700);
  await glide('#cdx-cand .cdx-keylist .cdx-key >> nth=0'); await p.waitForTimeout(600);

  // Applications: the tiles, a programme opened, a step ticked
  await p.evaluate(() => { candUI.tab = 'applications'; renderCandidature(); (document.getElementById('cd-scroll') || document.scrollingElement).scrollTop = 0; });
  await p.waitForTimeout(1300);
  await glide('.cdx-tile[data-bucket="review"]'); await p.waitForTimeout(500);
  await press('.cdx-tile[data-bucket="review"]'); await p.waitForTimeout(800);
  await press('.cdx-tile[data-bucket="active"]'); await p.waitForTimeout(900);
  await press('.cdx-prog >> nth=0 >> .cdx-prog-head'); await p.waitForTimeout(1000);
  await scrollTo('.cdx-prog.open .cdx-body .task-row');
  await press('.cdx-prog.open .cdx-body .task-row >> nth=0'); await p.waitForTimeout(700);
  await press('.cdx-prog.open .cdx-body .task-row >> nth=1'); await p.waitForTimeout(800);

  // Milestones: one ticked, the road fills
  await p.evaluate(() => { candUI.tab = 'milestones'; renderCandidature(); (document.getElementById('cd-scroll') || document.scrollingElement).scrollTop = 0; });
  await p.waitForTimeout(1300);
  await scrollTo('.cdx-msroad');
  await press('.cdx-ms >> nth=0 >> .cdx-dot'); await p.waitForTimeout(900);
  await press('.cdx-ms >> nth=1 >> .cdx-dot'); await p.waitForTimeout(1300);
  await glide('.cdx-ms >> nth=2 >> .cdx-key'); await p.waitForTimeout(700);

  // Home › Overview
  await p.evaluate(() => { showSection('home'); homeUI.tab = 'overview'; renderHome(); });
  await p.waitForTimeout(400);
  await p.evaluate(() => { const v = document.getElementById('overview-view'), sc = document.getElementById('cd-scroll'); if (v && sc) sc.scrollTop = v.getBoundingClientRect().top + sc.scrollTop - 90; });
  await p.waitForTimeout(1500);
  await glide('#cdx-ov .cdx-part >> nth=0'); await p.waitForTimeout(600);
  await glide('#cdx-ov .cdx-trio .cdx-card >> nth=1'); await p.waitForTimeout(800);
  await glide('#cdx-ov [data-cand]'); await p.waitForTimeout(800);
  await p.mouse.move(640, 760, { steps: 12 }); await p.waitForTimeout(600);
  const v = p.video();
  await ctx.close();
  console.log(await v.path());
  await b.close();
})();
