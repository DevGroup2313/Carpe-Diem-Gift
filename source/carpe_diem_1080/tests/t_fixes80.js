// t_fixes80.js PAGE.html OUTDIR [demo]: the four 1080 fixes, as a person meets them.
const { chromium } = require('playwright');
const path = require('path');
const [FILE, OUT] = process.argv.slice(2);
let fails = 0;
const ok = (c, what, d) => { if (!c) fails++; console.log((c ? 'ok   ' : 'FAIL ') + what + (d === undefined ? '' : '  ' + JSON.stringify(d).slice(0, 300))); };
async function open(b, theme, mode) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 950 }, colorScheme: theme === 'night' ? 'dark' : 'light' })).newPage();
  p.errs = []; p.on('pageerror', e => p.errs.push(String(e).slice(0, 200)));
  await p.goto('file://' + path.resolve(FILE), { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(4000);
  await p.evaluate(([t, m]) => { try { cdCloseDoor(); } catch (e) {} try { document.getElementById('demo-entry').remove(); } catch (e) {}
    state.themeAuto = false; state.theme = t; if (m) state.mode = m; saveState(); applyTheme(); try { applyMode && applyMode(); } catch (e) {} }, [theme, mode]);
  await p.waitForTimeout(1200);
  return p;
}
(async () => {
  const b = await chromium.launch();
  const ed = await (await (await b.newContext()).newPage()).evaluate(() => 0).catch(() => 0);
  // 1. the name card by night on Ascensus
  let p = await open(b, 'night');
  await p.evaluate(() => showSection('ascent'));
  await p.waitForTimeout(2500);
  const hov = await p.evaluate(() => { const e = [...document.querySelectorAll('#section-ascent button')].find(x => x.getClientRects().length && x.title === '' && /✓/.test(x.textContent)) || [...document.querySelectorAll('#section-ascent button[title]')].find(x => x.getClientRects().length); if (!e) return null; e.scrollIntoView({ block: 'center' }); e.setAttribute('data-t80', '1'); return true; });
  if (hov) {
    await p.hover('[data-t80]'); await p.waitForTimeout(1300);
    const tip = await p.evaluate(() => { const t = document.getElementById('cd-name-tip'); if (!t || !t.classList.contains('show')) return null; const c = getComputedStyle(t); return { bg: c.backgroundColor, img: c.backgroundImage.slice(0, 60) }; });
    ok(tip && /^rgb\(/.test(tip.bg), 'night: the hover card has a solid surface under its gradient', tip);
    await p.screenshot({ path: OUT + '/1-hover-night.png' });
  } else ok(false, 'night: a key to hover on Ascensus');
  ok(!p.errs.length, 'no page errors (Ascensus)', p.errs);
  await p.close();
  // 2. the side keys with the Librarian's conversation
  p = await open(b, 'light');
  await p.evaluate(() => showSection('home'));
  await p.waitForTimeout(1500);
  const opened = await p.evaluate(() => { const e = [...document.querySelectorAll('button')].find(e => /Ask the librarian/i.test(e.textContent) && e.getClientRects().length); if (!e) return false; e.click(); return true; });
  if (opened) {
    await p.waitForTimeout(2500);
    const fabs = () => p.evaluate(() => ['sticky-fab', 'horo-fab', 'cd-theme-fab', 'cd-thought-fab', 'cd-quiet-fab'].map(id => { const e = document.getElementById(id); if (!e) return [id, 'none']; const c = getComputedStyle(e); const r = e.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return [id, c.display !== 'none' && r.width > 0 && !!top && (top === e || e.contains(top))]; }));
    const f1 = await fabs();
    ok(f1.every(x => x[1] === true), 'chat: the side keys show above the conversation', f1);
    ok(await p.evaluate(() => !!document.querySelector('#modal-root > .cdc')), 'chat: the conversation is open');
    await p.screenshot({ path: OUT + '/2-chat-keys.png' });
    await p.click('#cd-dock-toggle'); await p.waitForTimeout(900);
    ok(await p.evaluate(() => document.body.classList.contains('cd-dock-collapsed')), 'chat: the chevron folds them');
    await p.click('#cd-dock-toggle'); await p.waitForTimeout(900);
    const f2 = await fabs();
    ok(f2.every(x => x[1] === true), 'chat: the chevron brings them back, in the conversation', f2);
    const modalStill = await p.evaluate(() => { const ids = ['modal-root']; const m = document.getElementById('modal-root'); return m && m.childElementCount; });
    ok(modalStill >= 1, 'chat: still open after the chevron');
  } else console.log('skip  no Ask the librarian key in this edition');
  // a real panel still hides them
  await p.evaluate(() => { try { document.querySelectorAll('#modal-root > *').forEach(n => n.remove()); } catch (e) {} });
  await p.waitForTimeout(500);
  await p.evaluate(() => { const d = document.createElement('div'); d.className = 'modal-test'; document.getElementById('modal-root').appendChild(d); });
  await p.waitForTimeout(600);
  ok(await p.evaluate(() => document.body.classList.contains('cd-panel-open') && getComputedStyle(document.getElementById('sticky-fab')).display === 'none'), 'a real panel still hides the side keys');
  ok(!p.errs.length, 'no page errors (chat)', p.errs);
  await p.close();
  // 3. the Fontes keys on Candidatus or Projects
  p = await open(b, 'light');
  await p.evaluate(() => showSection('applications'));
  await p.waitForTimeout(1800);
  for (const tab of ['Proposal', 'Citations']) {
    const has = await p.evaluate((tab) => { const e = [...document.querySelectorAll('#section-applications button')].find(e => e.getClientRects().length && e.textContent.trim() === tab); if (!e) return 'no tab'; e.click(); return true; }, tab);
    if (has !== true) { console.log('skip  no ' + tab + ' tab'); continue; }
    await p.waitForTimeout(1500);
    const keys = await p.evaluate(() => [...document.querySelectorAll('#section-applications .fontes-btn')].filter(e => e.getClientRects().length).map(e => !!e.querySelector('svg')));
    ok(keys.length > 0 && keys.every(Boolean), tab + ': each Fontes key carries its drawing', keys);
    await p.screenshot({ path: OUT + '/3-fontes-' + tab + '.png' });
  }
  ok(!p.errs.length, 'no page errors (Candidatus)', p.errs);
  await p.close();
  // 4. Offline by design: Classic white acrylic, Folio tan
  for (const m of ['classic', 'folio']) {
    p = await open(b, 'light', m);
    await p.evaluate(() => { showSection('home'); try { homeUI.tab = 'home'; renderHome(); } catch (e) {} });
    await p.waitForTimeout(1800);
    const c = await p.evaluate(() => { const e = document.querySelector('#offline-notice .cdn-card'); if (!e) return null; e.scrollIntoView({ block: 'center' }); const s = getComputedStyle(e); return { bg: s.backgroundColor, img: s.backgroundImage.slice(0, 70), folio: document.body.classList.contains('mode-folio') }; });
    if (m === 'classic') ok(c && /gradient\(rgba\(255, 255, 255, 0\.9\)/.test(c.img) && !c.folio, 'Classic: Offline by design is white acrylic', c);
    else ok(c && c.folio && c.img === 'none' && /252, 248, 239|251, 247, 238/.test(c.bg), 'Folio: Offline by design stays tan', c);
    await p.waitForTimeout(400);
    await p.screenshot({ path: OUT + '/4-offline-' + m + '.png' });
    ok(!p.errs.length, 'no page errors (' + m + ')', p.errs);
    await p.close();
  }
  await b.close();
  console.log(fails ? fails + ' failed' : 'all passed');
  process.exit(fails ? 1 : 0);
})();
