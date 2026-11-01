// rec_film80.js URL OUTDIR: the Guidebook's film, "Carpe Diem in action", recorded again for build 1080, sharp.
// The same story and the same fresh profile with neutral sample entries as 1079's rec_film.js (no one's own details).
// What is new:
//  * Sharp: the window is 1280x800 drawn at device scale factor 2 (2560x1600). Time is the page's own, held still and
//    moved one frame at a time (Playwright's clock for the page's timers, Date and frames; every CSS animation and
//    transition set to the same time), so each of the 30 frames a second is a full screenshot, however long it takes.
//  * The side keys' glyphs are hidden in the film; for every frame the place, turn and opacity of each key's glyph is
//    written down (keys.json), so the player can draw the device's own glyphs there.
// VERIFY=1: a short check film for the tests (the keys with their glyphs and nothing else).
// Writes OUTDIR/f/NNNNN.jpg (frame 0 first), OUTDIR/scenes.json, OUTDIR/keys.json, OUTDIR/meta.json.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [URL_, OUT] = process.argv.slice(2);
const FPS = 30;
const VERIFY = !!process.env.VERIFY;
const SEL = { 'sticky-fab': '#sticky-fab>span', 'horo-fab': '#horo-fab>span:first-child', 'cd-theme-fab': '#cd-theme-fab>span',
  'cd-thought-fab': '#cd-thought-fab .cd-thought-glyph', 'reminders-fab': '#reminders-fab .rem-fab-bell', 'cd-quiet-fab': '#cd-quiet-fab .cd-quiet-glyph' };

// In the page: drive every animation to the page's clock, and read the side keys' glyphs.
function driver(SEL) {
  // the animations are held, so each keeps the time it was given from one frame to the next
  var keep = [];
  window.__vdrive = function () {
    var now = performance.now(), list = document.getAnimations();
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      try {
        if (a.__v == null) { var ct = a.currentTime; a.__v = now - (ct == null ? 0 : ct / (a.playbackRate || 1)); a.pause(); keep.push(a); }
        a.currentTime = (now - a.__v) * (a.playbackRate || 1);
      } catch (e) {}
    }
    return list.length;
  };
  function opac(el) { var o = 1; for (var e = el; e && e.nodeType === 1; e = e.parentElement) { var c = getComputedStyle(e); o *= +c.opacity; if (c.display === 'none' || c.visibility === 'hidden' && e !== el) return 0; } return o; }
  window.__vframe = function () {
    var n = window.__vdrive(), out = {};
    for (var id in SEL) {
      var k = document.getElementById(id), g = document.querySelector(SEL[id]);
      if (!k || !g) { out[id] = null; continue; }
      var r = k.getBoundingClientRect();
      if (!r.width || !r.height) { out[id] = null; continue; }
      var kc = getComputedStyle(k);
      if (kc.visibility === 'hidden') { out[id] = null; continue; }
      var o = opac(k) * +getComputedStyle(g).opacity;
      if (o <= 0.01) { out[id] = null; continue; }
      // is the key on top at its centre (a panel or a sheet over it hides it in the film)
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2, top = document.elementFromPoint(cx, cy), over = !!(top && (top === k || k.contains(top)));
      // the glyph's box as laid out (before its own turn), from the key's box
      var x = r.left + k.clientLeft + g.offsetLeft, y = r.top + k.clientTop + g.offsetTop;
      if (g.offsetParent !== k) { var gr = g.getBoundingClientRect(); x = gr.left; y = gr.top; }
      var gs = getComputedStyle(g), tf = gs.transform, m = null;
      if (tf && tf !== 'none') { m = tf.replace(/^matrix\(|\)$/g, '').split(',').map(function (v) { return +(+v).toFixed(4); }); if (m.length !== 6 || (m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1 && m[4] === 0 && m[5] === 0)) m = null; }
      out[id] = { x: +x.toFixed(2), y: +y.toFixed(2), w: g.offsetWidth, h: g.offsetHeight, o: +o.toFixed(3), m: m, c: (g.getAttribute('data-emoji') || g.textContent || '').trim(),
        org: gs.transformOrigin, over: over, pe: kc.pointerEvents };
    }
    return { n: n, k: out };
  };
  window.__vstyle = function () {
    var out = {};
    for (var id in SEL) {
      var k = document.getElementById(id), g = document.querySelector(SEL[id]); if (!k || !g) continue;
      var kc = getComputedStyle(k), gc = getComputedStyle(g);
      out[id] = { keyFilter: kc.filter, glyphFilter: gc.filter, fs: gc.fontSize, lh: gc.lineHeight, ff: gc.fontFamily, disp: gc.display, ai: gc.alignItems, jc: gc.justifyContent, org: gc.transformOrigin, ts: gc.textShadow };
    }
    return out;
  };
}

(async () => {
  fs.mkdirSync(path.join(OUT, 'f'), { recursive: true });
  const b = await chromium.launch({ args: ['--force-device-scale-factor=2'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await p.clock.install();
  await p.addInitScript(driver, SEL);
  await p.goto(URL_, { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(4500);
  // the page's own loading card must be gone before filming
  await p.waitForFunction(() => { const s = document.getElementById('cd-splash'); return !s || getComputedStyle(s).display === 'none' || +getComputedStyle(s).opacity === 0; }, null, { timeout: 120000, polling: 250 });
  const demo = await p.evaluate(() => {
    try { cdCloseDoor(); } catch (e) {}
    try { if (typeof demoRemove === 'function') { demoRemove('demo-entry'); demoRemove('demo-build'); } } catch (e) {}
    state.themeAuto = false; state.theme = 'light'; if (state.lang !== 'en') setLang('en'); saveState(); applyTheme();
    const isDemo = typeof demoOn === 'function' && !!demoOn();
    if (!isDemo) {
      // neutral sample entries, for the film only: no one's own programmes, funding or dates
      state.programs = [
        { id: 'f1', name: 'MA in the History of Ideas', uni: 'A university of your choice', status: 'Strong fit', bucket: 'active', checklist: {} },
        { id: 'f2', name: 'MPhil in Comparative Literature', uni: 'A second university', status: 'Good fit', bucket: 'active', checklist: {} },
        { id: 'f3', name: 'PhD in Cultural History', uni: 'A third university', status: 'Good fit', bucket: 'active', checklist: {} }
      ];
      try { state.candidature = state.candidature || {}; state.candidature.funding = [{ id: 'ff1', label: 'A doctoral studentship', done: false }, { id: 'ff2', label: 'A travel grant', done: false }]; } catch (e) {}
      try { delete state.cdCand; } catch (e) {}
      saveState();
      // the film never shows anyone's own line under Candidatus's title
      const neutral = () => { const s = document.getElementById('sub-candidature'); if (s && !/one small step/.test(s.textContent)) s.textContent = 'From the first programme to the offer, one small step at a time.'; };
      neutral(); setInterval(neutral, 100);
    }
    // a visible pointer
    const dot = document.createElement('div');
    dot.style.cssText = 'position:fixed;z-index:2147483647;width:22px;height:22px;margin:-3px 0 0 -3px;pointer-events:none;left:-40px;top:-40px';
    dot.innerHTML = '<svg width="22" height="22" viewBox="0 0 22 22"><path d="M3 2l14 9-6 1.5L8 19z" fill="#fff" stroke="#1d2a35" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(dot);
    document.addEventListener('mousemove', e => { dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px'; }, true);
    document.addEventListener('mousedown', () => { dot.style.transform = 'scale(.82)'; }, true);
    document.addEventListener('mouseup', () => { dot.style.transform = ''; }, true);
    // the side keys' glyphs are left out of the film: the player draws this device's own glyphs in their place
    const st = document.createElement('style'); st.id = 'cd-film-rec';
    st.textContent = '#sticky-fab>span,#horo-fab>span:first-child,#cd-theme-fab>span,#cd-thought-fab .cd-thought-glyph,#reminders-fab .rem-fab-bell,#cd-quiet-fab .cd-quiet-glyph{visibility:hidden!important}';
    document.head.appendChild(st);
    return isDemo;
  });
  if (VERIFY) {
    // a check film for the tests only: the side keys with their glyphs over a plain ground, and nothing else
    await p.evaluate(() => {
      document.getElementById('cd-film-rec').textContent = '#reminders-fab .rem-fab-badge,#cd-thought-fab .tc-badge{visibility:hidden!important}';
      let z = 1e9; ['sticky-fab', 'horo-fab', 'cd-theme-fab', 'cd-thought-fab', 'reminders-fab', 'cd-quiet-fab'].forEach(id => { const e = document.getElementById(id); if (e) z = Math.min(z, +getComputedStyle(e).zIndex || 0); });
      const g = document.createElement('div'); g.id = 'cd-film-ground';
      g.style.cssText = 'position:fixed;inset:0;background:#f3efe6;pointer-events:none;z-index:' + (z - 1);
      document.body.appendChild(g);
      document.querySelectorAll('body > div[style*="2147483647"]').forEach(d => d.remove());
      window.__vground = z - 1;
    });
  }
  // the door can come back once the page settles: close it until it stays closed
  for (let i = 0; i < 20; i++) {
    await p.waitForTimeout(500);
    const open = await p.evaluate(() => { const d = document.getElementById('cd-door'); if (d) { try { cdCloseDoor(); } catch (e) {} } try { if (typeof demoRemove === 'function') { demoRemove('demo-entry'); demoRemove('demo-build'); } } catch (e) {} return !!d; });
    if (!open && i >= 2) break;
  }
  const style = await p.evaluate(() => window.__vstyle());
  const now = await p.evaluate(() => Date.now());
  await p.clock.pauseAt(now + 3000);
  const cdp = await ctx.newCDPSession(p);

  let k = 0, vt = 0, mx = 700, my = 460;
  const keys = [], scenes = [];
  const t0 = Date.now();
  await p.mouse.move(mx, my);
  async function frame() {
    const target = Math.round((k + 1) * 1000 / FPS);
    await p.clock.runFor(target - vt); vt = target;
    const s = await p.evaluate(() => window.__vframe());
    keys.push(s.k);
    const shot = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 95 });
    fs.writeFileSync(path.join(OUT, 'f', String(k).padStart(5, '0') + '.jpg'), Buffer.from(shot.data, 'base64'));
    k++;
    if (k % 150 === 0) console.log('frame', k, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  const wait = async (ms) => { const n = Math.max(1, Math.round(ms * FPS / 1000)); for (let i = 0; i < n; i++) await frame(); };
  const scene = (id) => scenes.push({ id, at: +(k / FPS).toFixed(3) });
  const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const moveTo = async (x, y, n) => { const x0 = mx, y0 = my; for (let i = 1; i <= n; i++) { const e = ease(i / n); mx = x0 + (x - x0) * e; my = y0 + (y - y0) * e; await p.mouse.move(mx, my); await frame(); } };
  const glide = async (sel, n = 18) => { const l = p.locator(sel).first(); if (!(await l.count())) { console.log('missing', sel); return null; } await l.scrollIntoViewIfNeeded().catch(() => {}); const bb = await l.boundingBox(); if (!bb) return null; await moveTo(bb.x + bb.width / 2, bb.y + bb.height / 2, n); return bb; };
  const press = async (sel, hold = 200) => { const bb = await glide(sel); if (!bb) return false; await wait(450); await p.mouse.down(); await wait(hold); await p.mouse.up(); return true; };
  const scroller = () => p.evaluate(() => { const sc = document.getElementById('cd-scroll') || document.scrollingElement; return sc.scrollTop; });
  const scroll = async (y, ms = 900) => {
    const y0 = await scroller(), n = Math.round(ms * FPS / 1000);
    for (let i = 1; i <= n; i++) { const yy = y0 + (y - y0) * ease(i / n); await p.evaluate((yy) => { const sc = document.getElementById('cd-scroll') || document.scrollingElement; sc.scrollTo({ top: yy, behavior: 'instant' }); }, yy); await frame(); }
  };

  if (VERIFY) {
    // the bell rings at about 1 s, the notes turn at 2 s and the hourglass at 3 s
    await p.evaluate(() => { const sc = document.getElementById('cd-scroll') || document.scrollingElement; sc.scrollTo({ top: 0, behavior: 'instant' }); });
    await p.evaluate(() => {
      window.__vdrive(); const now = performance.now();
      const set = (sel, ms) => { const g = document.querySelector(sel); if (g) g.getAnimations().forEach(a => { a.__v = now - ms; a.currentTime = ms; }); };
      set('#reminders-fab .rem-fab-bell', 0.82 * 4400 - 1000); set('#sticky-fab>span', 0.89 * 12000 - 2000); set('#horo-fab>span:first-child', 0.89 * 14000 - 3000);
    });
    scene('verify');
    await wait(5500);
    scene('end');
  } else {
  // 1 · Home
  await p.evaluate(() => { showSection('home'); homeUI.tab = 'home'; renderHome(); const sc = document.getElementById('cd-scroll') || document.scrollingElement; sc.scrollTo({ top: 0, behavior: 'instant' }); });
  scene('home');
  await wait(400);
  await moveTo(640, 300, 14); await wait(800);
  await scroll(280);
  await glide('#cd-home-tabdock .nav-btn:has-text("Overview")'); await wait(700);
  // 2 · the Overview
  await press('#cd-home-tabdock .nav-btn:has-text("Overview")'); await wait(1300);
  scene('overview');
  await glide('#overview-view [data-energy="plenty"]'); await wait(500);
  await press('#overview-view [data-energy="plenty"]'); await wait(1100);
  await press('#overview-view [data-energy="some"]'); await wait(1100);
  // 3 · Candidatus (the owner's edition only: the demonstrations have no Candidatus)
  if (!demo) {
    await p.evaluate(() => { showSection('applications'); candUI.tab = 'overview'; renderCandidature(); const sc = document.getElementById('cd-scroll') || document.scrollingElement; sc.scrollTo({ top: 0, behavior: 'instant' }); }); await wait(900);
    scene('candidatus');
    for (const go of ['applications', 'proposal', 'milestones', 'citations']) { await glide('.cdx-how-room[data-go="' + go + '"]', 14); await wait(450); }
    await press('.cdx-how-room[data-go="applications"]'); await wait(1600);
    await p.evaluate(() => { candUI.tab = 'overview'; renderCandidature(); }); await wait(700);
    await scroll(260); await wait(900);
  }
  // 4 · Assessments
  await p.evaluate(() => { showSection('assessments'); assessUI.view = 'home'; state.cdxMarksOpen = false; renderAssessments(); const sc = document.getElementById('cd-scroll') || document.scrollingElement; sc.scrollTo({ top: 0, behavior: 'instant' }); }); await wait(900);
  scene('assessments');
  await press('#cdx-assess [data-marks-how]'); await wait(1500);
  await press('#cdx-assess [data-marks-how]'); await wait(600);
  await glide('#cdx-assess .cdx-trio [data-atab="quizzes"]'); await wait(500);
  await press('#cdx-assess .cdt-pill [data-atab="record"]'); await wait(1600);
  // 5 · Ascensus
  await p.evaluate(() => { showSection('ascent'); ascView = { v: 'home', tab: 'today' }; renderAscent(); const sc = document.getElementById('cd-scroll') || document.scrollingElement; const r = document.getElementById('cdx-asc'); sc.scrollTo({ top: Math.max(0, r.getBoundingClientRect().top + sc.scrollTop - 70), behavior: 'instant' }); }); await wait(900);
  scene('ascensus');
  await scroll((await scroller()) + 230);
  await press('#asc-labours .cdz-lab >> nth=0 >> .cdx-box'); await wait(1300);
  await press('#cdx-asc [data-energy="low"]'); await wait(1300);
  await press('#cdx-asc [data-energy="steady"]'); await wait(900);
  if (demo) {
    // the sample's courses (the owner's edition keeps a course named for two universities, so its film leaves the list out)
    await press('#cdx-asc .cdt-pill button:has-text("Courses")'); await wait(1100);
    await glide('#asc-courses .cdz-course >> nth=2', 18); await wait(900);
  }
  // 6 · the Librarian, with the side keys beside the conversation (1080)
  await p.evaluate(() => { showSection('books'); openLibrarian(); }); await wait(1100);
  scene('librarian');
  await press('.cdc.lib [data-intent="think"]'); await wait(2200);
  await glide('.cdc.lib .cdc-book >> nth=0'); await wait(900);
  await p.evaluate(() => closeModal()); await wait(400);
  // 7 · Magister
  await p.evaluate(() => { showSection('home'); homeUI.tab = 'home'; renderHome(); openMagisterChat(); }); await wait(1100);
  scene('magister');
  await press('.cdc.mag [data-chip="quiz"]'); await wait(2400);
  await moveTo(640, 700, 14); await wait(800);
  scene('end');
  await wait(300);
  }

  fs.writeFileSync(path.join(OUT, 'scenes.json'), JSON.stringify(scenes, null, 1));
  fs.writeFileSync(path.join(OUT, 'keys.json'), JSON.stringify(keys));
  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify({ fps: FPS, frames: k, w: 1280, h: 800, scale: 2, style, demo, errors: errs }, null, 1));
  await b.close();
  console.log('frames', k, 'seconds', (k / FPS).toFixed(2), 'scenes', JSON.stringify(scenes), 'errors', errs.length, 'took', ((Date.now() - t0) / 1000).toFixed(0) + 's');
})();
