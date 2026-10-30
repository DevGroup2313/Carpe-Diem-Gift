// t_still.js <page>: the decorations move where they can be seen and hold still where they cannot
const { chromium } = require('playwright');
(async () => {
  const [page_] = process.argv.slice(2);
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:8765/' + page_, { waitUntil: 'load', timeout: 120000 });
  await p.waitForTimeout(5000); await p.evaluate(() => cdCloseDoor()); await p.waitForTimeout(2500);
  let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
  const homeKeys = () => document.getAnimations().filter(a => a.animationName === 'cdGlitter').map(a => a.playState);
  const st = (name) => document.getAnimations().filter(a => a.animationName === name).map(a => a.playState + '/' + (a.effect.target.getAttribute('data-cd-lay') || '-'));
  ok((await p.evaluate(homeKeys)).every(s => s === 'running'), 'Home: the app keys sparkle ' + JSON.stringify(await p.evaluate(homeKeys)));
  { const sl = await p.evaluate(st, 'cdb3lLift'); ok(sl.length && sl.every(s => s.startsWith('running')), 'Home: the seal moves ' + JSON.stringify(sl)); }
  // a room over Home
  await p.evaluate(() => { const b = [...document.querySelectorAll('button,[role=button],.card,[data-cd-room]')].find(x => /Proposal|Proposition/.test(x.textContent) && x.offsetParent); if (b) b.click(); });
  await p.waitForTimeout(2600);
  const roomOpen = await p.evaluate(() => document.getElementById('modal-root').children.length);
  ok(roomOpen > 0, 'a room opened');
  ok((await p.evaluate(homeKeys)).every(s => s === 'paused'), 'Home under a room: the keys hold still ' + JSON.stringify(await p.evaluate(homeKeys)));
  await p.evaluate(() => closeModal()); await p.mouse.click(5, 450); await p.waitForTimeout(1000);
  ok((await p.evaluate(homeKeys)).every(s => s === 'running'), 'room shut: within a second the keys sparkle again ' + JSON.stringify(await p.evaluate(homeKeys)));
  // Tabula over Home, at a width where its last ribbon keys are past the edge
  await p.evaluate(() => openExt('tabula')); await p.waitForTimeout(4000);
  ok((await p.evaluate(homeKeys)).every(s => s === 'paused'), 'Home behind Tabula: the keys hold still');
  const fr = await (await p.$('#frame-tabula')).contentFrame();
  const tk = await fr.evaluate(() => document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.id === 'goAbacus').map(a => a.animationName + ':' + a.playState));
  ok(tk.every(s => s.endsWith('paused')), 'Tabula at 1400 px: Abacus key past the edge holds still, glow and glitter ' + JSON.stringify(tk));
  const vis = await fr.evaluate(() => document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.getBoundingClientRect().right < innerWidth && a.effect.getTiming().iterations === Infinity).map(a => a.animationName + ':' + a.playState));
  ok(vis.every(s => s.endsWith('running')), 'Tabula: the keys in sight move ' + JSON.stringify(vis));
  await p.setViewportSize({ width: 1920, height: 1000 }); await p.waitForTimeout(1200);
  const tk2 = await fr.evaluate(() => document.getAnimations().filter(a => a.effect && a.effect.target && a.effect.target.id === 'goAbacus').map(a => a.animationName + ':' + a.playState + ':' + (a.effect.target.getAttribute('data-cd-lay') || '-')));
  ok(tk2.every(s => s.includes('running')), 'window made wider: the Abacus key comes into sight and moves ' + JSON.stringify(tk2));
  // typing in Tabula does not move anything about while keys come
  await fr.click('#editor'); await p.keyboard.type('Hello there'); await p.waitForTimeout(300);
  ok(true, 'typed in Tabula');
  await fr.evaluate(() => { try { parent.closeExt ? parent.closeExt('tabula') : null; } catch (e) { } });
  await p.evaluate(() => { try { closeExt('tabula'); } catch (e) { } });
  await p.mouse.click(5, 450); await p.waitForTimeout(1200);
  const shut = await p.evaluate(() => { const f = document.getElementById('frame-tabula'); const r = f && f.getBoundingClientRect(); return r ? r.width + 'x' + r.height : 'gone'; });
  ok((await p.evaluate(homeKeys)).every(s => s === 'running'), 'Tabula shut (' + shut + '): the keys on Home sparkle again ' + JSON.stringify(await p.evaluate(homeKeys)));
  const inner = await p.evaluate(() => { const f = document.getElementById('frame-tabula'); if (!f || !f.contentDocument) return []; return f.contentDocument.getAnimations().filter(a => a.effect && a.effect.getTiming().iterations === Infinity).map(a => a.playState); });
  ok(inner.every(s => s === 'paused'), 'shut Tabula: nothing in it moves unseen ' + JSON.stringify(inner));
  // calm motion is left as it was
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
  await b.close();
})();
