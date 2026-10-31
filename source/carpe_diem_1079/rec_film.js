// rec_film.js URL OUTDIR: the Guidebook's film, "Carpe Diem in action", about a minute, no sound, a visible pointer.
// Recorded from a fresh profile of the full edition with neutral sample entries in Candidatus (the owner's own details
// never appear): Home and its tabs, the Overview, Candidatus with How Candidatus works, Assessments, Ascensus (a labour
// ticked, the fire, the courses), the Librarian and Magister. Writes OUTDIR/raw.webm and OUTDIR/scenes.json (the start
// of each scene in seconds, for the captions and the chapters).
const { chromium } = require('playwright');
const fs = require('fs');
const [URL_, OUT] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: OUT, size: { width: 1280, height: 800 } } });
  const p = await ctx.newPage();
  const t0 = Date.now();
  await p.goto(URL_, { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(4500);
  const scenes = [];
  const scene = (id) => scenes.push({ id, at: (Date.now() - t0) / 1000 });
  await p.evaluate(() => {
    try { cdCloseDoor(); } catch (e) {}
    try { if (typeof demoRemove === 'function') { demoRemove('demo-entry'); demoRemove('demo-build'); } } catch (e) {}
    state.themeAuto = false; state.theme = 'light'; if (state.lang !== 'en') setLang('en'); saveState(); applyTheme();
    // neutral sample entries, for the film only: no one's own programmes, funding or dates
    if (typeof demoOn === 'function' && demoOn()) return;
    state.programs = [
      { id: 'f1', name: 'MA in the History of Ideas', uni: 'A university of your choice', status: 'Strong fit', bucket: 'active', checklist: {} },
      { id: 'f2', name: 'MPhil in Comparative Literature', uni: 'A second university', status: 'Good fit', bucket: 'active', checklist: {} },
      { id: 'f3', name: 'PhD in Cultural History', uni: 'A third university', status: 'Good fit', bucket: 'active', checklist: {} }
    ];
    try { state.candidature = state.candidature || {}; state.candidature.funding = [{ id: 'ff1', label: 'A doctoral studentship', done: false }, { id: 'ff2', label: 'A travel grant', done: false }]; } catch (e) {}
    try { delete state.cdCand; } catch (e) {}
    saveState();
    const dot = document.createElement('div');
    dot.style.cssText = 'position:fixed;z-index:2147483647;width:22px;height:22px;margin:-3px 0 0 -3px;pointer-events:none;left:-40px;top:-40px;transition:transform .05s';
    dot.innerHTML = '<svg width="22" height="22" viewBox="0 0 22 22"><path d="M3 2l14 9-6 1.5L8 19z" fill="#fff" stroke="#1d2a35" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(dot);
    document.addEventListener('mousemove', e => { dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px'; }, true);
    document.addEventListener('mousedown', () => { dot.style.transform = 'scale(.82)'; }, true);
    document.addEventListener('mouseup', () => { dot.style.transform = ''; }, true);
    // the film never shows anyone's own line under Candidatus's title
    const neutral = () => { const s = document.getElementById('sub-candidature'); if (s && !/one small step/.test(s.textContent)) s.textContent = 'From the first programme to the offer, one small step at a time.'; };
    neutral(); setInterval(neutral, 100);
  });
  const glide = async (sel, steps = 22) => { const l = p.locator(sel).first(); if (!(await l.count())) return null; await l.scrollIntoViewIfNeeded().catch(() => {}); const bb = await l.boundingBox(); if (!bb) return null; await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps }); return bb; };
  const press = async (sel, hold = 200) => { const bb = await glide(sel); if (!bb) return false; await p.waitForTimeout(450); await p.mouse.down(); await p.waitForTimeout(hold); await p.mouse.up(); return true; };
  const scroll = async (y) => { await p.evaluate((y) => { const sc = document.getElementById('cd-scroll') || document.scrollingElement; sc.scrollTo({ top: y, behavior: 'smooth' }); }, y); await p.waitForTimeout(900); };

  // 1 · Home
  await p.evaluate(() => { showSection('home'); homeUI.tab = 'home'; renderHome(); }); await scroll(0);
  scene('home');
  await p.mouse.move(640, 300, { steps: 10 }); await p.waitForTimeout(800);
  await scroll(280);
  await glide('#cd-home-tabdock .nav-btn:has-text("Overview")'); await p.waitForTimeout(700);
  // 2 · the Overview
  await press('#cd-home-tabdock .nav-btn:has-text("Overview")'); await p.waitForTimeout(1300);
  scene('overview');
  await glide('#overview-view [data-energy="plenty"]'); await p.waitForTimeout(500);
  await press('#overview-view [data-energy="plenty"]'); await p.waitForTimeout(1100);
  await press('#overview-view [data-energy="some"]'); await p.waitForTimeout(900);
  // 3 · Candidatus (the owner's edition only: the demonstrations have no Candidatus)
  const demo = await p.evaluate(() => typeof demoOn === 'function' && !!demoOn());
  if (!demo) {
  await p.evaluate(() => { showSection('applications'); candUI.tab = 'overview'; renderCandidature(); }); await scroll(0); await p.waitForTimeout(900);
  scene('candidatus');
  for (const go of ['applications', 'proposal', 'milestones', 'citations']) { await glide('.cdx-how-room[data-go="' + go + '"]', 14); await p.waitForTimeout(450); }
  // Applications, with the sample programmes (Milestones carries notes about one university's own deadlines)
  await press('.cdx-how-room[data-go="applications"]'); await p.waitForTimeout(1600);
  await p.evaluate(() => { candUI.tab = 'overview'; renderCandidature(); }); await p.waitForTimeout(700);
  await scroll(260); await p.waitForTimeout(700);
  }
  // 4 · Assessments
  await p.evaluate(() => { showSection('assessments'); assessUI.view = 'home'; state.cdxMarksOpen = false; renderAssessments(); }); await scroll(0); await p.waitForTimeout(900);
  scene('assessments');
  await press('#cdx-assess [data-marks-how]'); await p.waitForTimeout(1500);
  await press('#cdx-assess [data-marks-how]'); await p.waitForTimeout(600);
  await glide('#cdx-assess .cdx-trio [data-atab="quizzes"]'); await p.waitForTimeout(500);
  // Records, the calm list
  await press('#cdx-assess .cdt-pill [data-atab="record"]'); await p.waitForTimeout(1500);
  // 5 · Ascensus
  await p.evaluate(() => { showSection('ascent'); ascView = { v: 'home', tab: 'today' }; renderAscent(); const sc = document.getElementById('cd-scroll') || document.scrollingElement; const r = document.getElementById('cdx-asc'); sc.scrollTo({ top: Math.max(0, r.getBoundingClientRect().top + sc.scrollTop - 70), behavior: 'auto' }); }); await p.waitForTimeout(900);
  scene('ascensus');
  await scroll(await p.evaluate(() => { const sc = document.getElementById('cd-scroll') || document.scrollingElement; return sc.scrollTop + 230; }));
  await press('#asc-labours .cdz-lab >> nth=0 >> .cdx-box'); await p.waitForTimeout(1300);
  await press('#cdx-asc [data-energy="low"]'); await p.waitForTimeout(1300);
  await press('#cdx-asc [data-energy="steady"]'); await p.waitForTimeout(900);
  if (demo) {
    // the sample's courses (the owner's edition keeps a course named for two universities, so its film leaves the list out)
    await press('#cdx-asc .cdt-pill button:has-text("Courses")'); await p.waitForTimeout(1100);
    await glide('#asc-courses .cdz-course >> nth=2', 18); await p.waitForTimeout(900);
  }
  // 6 · the Librarian
  await p.evaluate(() => { showSection('books'); openLibrarian(); }); await p.waitForTimeout(1100);
  scene('librarian');
  await press('.cdc.lib [data-intent="think"]'); await p.waitForTimeout(2200);
  await glide('.cdc.lib .cdc-book >> nth=0'); await p.waitForTimeout(900);
  await p.evaluate(() => closeModal()); await p.waitForTimeout(400);
  // 7 · Magister
  await p.evaluate(() => { showSection('home'); homeUI.tab = 'home'; renderHome(); openMagisterChat(); }); await p.waitForTimeout(1100);
  scene('magister');
  await press('.cdc.mag [data-chip="quiz"]'); await p.waitForTimeout(2400);
  await p.mouse.move(640, 700, { steps: 14 }); await p.waitForTimeout(800);
  scene('end');
  // put the profile back as it was for the recording
  await p.evaluate(() => { try { closeModal(); } catch (e) {} });
  await p.waitForTimeout(400);
  fs.writeFileSync(OUT + '/scenes.json', JSON.stringify(scenes, null, 1));
  await ctx.close();
  const vids = fs.readdirSync(OUT).filter(f => f.endsWith('.webm'));
  if (vids.length) fs.renameSync(OUT + '/' + vids[vids.length - 1], OUT + '/raw.webm');
  await b.close();
  console.log('scenes', JSON.stringify(scenes));
})();
