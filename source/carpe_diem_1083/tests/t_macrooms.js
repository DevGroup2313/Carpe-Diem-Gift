// t_macrooms.js PAGE_URL OUTDIR [engines]: "The rooms as apps on this Mac", with a stand-in for the Mac program. The
// sheet in English and in French, its three keys and what each reports, Escape; the entry in a room's window menu (and
// none in a browser); the note shown once on a Mac with none of the five out; the note of a window that did not open.
const pw = require('playwright'), path = require('path');
const URL = process.argv[2], OUT = process.argv[3], ENG = (process.argv[4] || 'chromium,webkit,firefox').split(',');
async function launch(n) { return n === 'chromium' ? pw.chromium.launch(process.env.CD_CHROMIUM ? { executablePath: process.env.CD_CHROMIUM } : {}) : pw[n].launch(); }
const MAC = `(function(){ if (window !== window.top) return; window.__asked = [];
  var st = { mac: true, where: 'x', apps: ['Tabula','Abacus','Imago','Scriba','Fontes'], dock: [], desktop: [] };
  window.pywebview = { platform: 'cocoa', token: 't', api: {
    rooms_state: function () { window.__asked.push('state'); return Promise.resolve(JSON.parse(JSON.stringify(st))); },
    rooms_to_dock: function () { window.__asked.push('dock'); var a = st.apps.filter(function (n) { return st.dock.indexOf(n) < 0; }); st.dock = st.apps.slice(); return Promise.resolve({ ok: true, added: a, there: st.apps.filter(function (n) { return a.indexOf(n) < 0; }), failed: [] }); },
    rooms_to_desktop: function () { window.__asked.push('desktop'); return Promise.resolve({ ok: false, made: ['Tabula'], there: [], failed: ['Fontes'] }); },
    rooms_reveal: function () { window.__asked.push('reveal'); return Promise.resolve({ ok: true, made: 5 }); },
    app_record: function () { return Promise.resolve('=== room window: tabula is NOT shown (own): None ==='); } } }; })();`;
async function boot(p, url) { const errs = []; p.on('pageerror', e => errs.push(String(e.message).slice(0, 140)));
  await p.goto(url, { waitUntil: 'load', timeout: 240000 }); await p.waitForTimeout(4500);
  await p.evaluate(() => { try { cdCloseDoor(); } catch (e) {} try { var d = document.getElementById('demo-entry'); if (d) d.remove(); } catch (e) {} }); await p.waitForTimeout(500); return errs; }
// The Linux copy of Safari's engine sometimes crashes while it loads this 48 MB page a second time in one browser (it
// does so on build 1081 too). Each visit here has a browser of its own, and one that crashes is made again, up to
// three times.
async function visit(e, init, fn) {
  for (let turn = 1; ; turn++) {
    const b = await launch(e);
    try {
      const c = await b.newContext({ viewport: { width: 1300, height: 860 } }); if (init) await c.addInitScript(init);
      const p = await c.newPage(); const errs = await boot(p, URL);
      const r = await fn(p); return { r, errs };
    } catch (x) { if (turn === 3 || !/crash/i.test(String(x && x.message))) throw x; console.log('   (' + e + ' crashed while loading the page; again)'); }
    finally { try { await b.close(); } catch (x) {} }
  }
}
(async () => {
  let bad = 0;
  for (const e of ENG) {
    const res = {};
    // on a Mac
    const v1 = await visit(e, MAC, async (p) => {
    res.sheet = await p.evaluate(() => { var ok = window.cdRoomsAsApps(); var d = document.getElementById('cd-macrooms'); return { ok: ok, h: d && d.querySelector('h2').textContent, keys: d ? d.querySelectorAll('.cd-macrooms-key').length : 0, names: d ? d.querySelectorAll('.cd-macrooms-names li').length : 0 }; });
    await p.waitForTimeout(400);
    res.state = await p.evaluate(() => document.querySelector('.cd-macrooms-status').textContent);
    if (e === 'chromium') await p.screenshot({ path: path.join(OUT, 'macrooms_day.png') });
    const click = async (i) => { await p.evaluate((i) => document.querySelectorAll('.cd-macrooms-key')[i].click(), i); await p.waitForTimeout(400); return p.evaluate(() => document.querySelector('.cd-macrooms-status').textContent); };
    res.dock = await click(0); res.dock2 = await click(0); res.desk = await click(1); res.finder = await click(2);
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    res.closed = await p.evaluate(() => !document.getElementById('cd-macrooms'));
    res.fr = await p.evaluate(() => { state.lang = 'fr'; window.cdRoomsAsApps(); var d = document.getElementById('cd-macrooms'); var r = { h: d.querySelector('h2').textContent, k: d.querySelector('.cd-macrooms-key b').textContent, x: d.querySelector('.cd-macrooms-close').textContent }; d.querySelector('.cd-macrooms-close').click(); state.lang = 'en'; return r; });
    res.menu = await p.evaluate(() => new Promise(function (res) { var m = document.createElement('div'); m.id = 'cd-export-choice'; var x = document.createElement('button'); x.className = 'cd-win1059-opt cd-win1059-x'; m.appendChild(x); document.body.appendChild(m);
      setTimeout(function () { var b = m.querySelector('[data-cd-act="rooms-as-apps"]'); var r = { there: !!b, beforeClose: !!b && b.nextSibling === x, label: b ? b.querySelector('.cd-win1059-l').textContent : '' }; if (b) b.click(); r.opened = !!document.getElementById('cd-macrooms'); r.menuGone = !document.getElementById('cd-export-choice'); var d = document.getElementById('cd-macrooms'); if (d) d.remove(); res(r); }, 150); }));
    res.fail = await p.evaluate(() => new Promise(function (res) { window.cdRoomWindowFailed('tabula', 'Tabula'); var n = document.getElementById('cd-macrooms-note'), bs = n.querySelectorAll('button'); var r = { text: n.firstChild.textContent, keys: [].map.call(bs, function (b) { return b.textContent; }) };
      bs[0].click(); setTimeout(function () { r.after = n.firstChild.textContent; n.querySelector('button').click(); r.gone = !document.getElementById('cd-macrooms-note'); res(r); }, 500); }));
    });
    // the note, once, on a Mac with none of the five out (a first visit)
    const v2 = await visit(e, MAC, async (p) => { await p.waitForTimeout(12500);
      res.hint = await p.evaluate(() => { var n = document.getElementById('cd-macrooms-note'); return n ? { text: n.firstChild.textContent.slice(0, 60), keys: n.querySelectorAll('button').length, kept: localStorage.getItem('cd_macrooms_hint_1083') } : null; });
      if (e === 'chromium') await p.screenshot({ path: path.join(OUT, 'macrooms_hint.png') }); });
    // a later visit (the note of the first visit is remembered): no note
    const v3 = await visit(e, MAC + "try{localStorage.setItem('cd_macrooms_hint_1083','1');}catch(e){}", async (p) => { await p.waitForTimeout(12500);
      res.hintAgain = await p.evaluate(() => !!document.getElementById('cd-macrooms-note')); });
    // in a browser: nothing of it
    const v4 = await visit(e, null, async (p) => {
      res.browser = await p.evaluate(() => new Promise(function (res) { var ok = window.cdRoomsAsApps(); var m = document.createElement('div'); m.id = 'cd-export-choice'; document.body.appendChild(m); setTimeout(function () { res({ sheet: ok, entry: !!m.querySelector('[data-cd-act]') }); }, 150); })); });
    const errs = [...v1.errs, ...v2.errs, ...v3.errs, ...v4.errs], errs2 = [], errs3 = [];
    const ok = res.sheet.ok === true && res.sheet.h === 'The rooms as apps on this Mac' && res.sheet.keys === 3 && res.sheet.names === 5 && /None is in the Dock yet/.test(res.state) && /In the Dock now: Tabula, Abacus, Imago, Scriba, Fontes\./.test(res.dock) && /All five were in the Dock already/.test(res.dock2)
      && /The Desktop did not take: Fontes/.test(res.desk) && /The Finder shows the folder/.test(res.finder) && res.closed && res.fr.h === 'Les pièces comme applications sur ce Mac' && res.fr.k === 'Ajouter les cinq au Dock' && res.fr.x === 'Fermer'
      && res.menu.there && res.menu.beforeClose && res.menu.opened && res.menu.menuGone && /Tabula stays in its floating window/.test(res.fail.text) && res.fail.keys.length === 2 && /record/.test(res.fail.after) && res.fail.gone
      && res.hint && res.hint.keys === 2 && res.hint.kept === '1' && res.hintAgain === false && res.browser.sheet === false && res.browser.entry === false && !errs.length && !errs2.length && !errs3.length;
    if (!ok) bad++;
    console.log((ok ? 'ok  ' : 'BAD ') + e + ' ' + JSON.stringify(res) + ([...errs, ...errs2, ...errs3].length ? ' errors ' + [...errs, ...errs2, ...errs3][0] : ''));
  }
  console.log(bad ? 'FAIL' : 'PASS'); process.exit(bad ? 1 : 0);
})();
