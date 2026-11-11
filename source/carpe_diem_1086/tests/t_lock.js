// t_lock.js PAGE_URL [engine]: the sign-in as a person uses it, from a fresh copy. Work is made first (the desk, a
// document kept in Tabula's larger store, a recording in Scriba's); the sign-in is set from the lock key on the welcome
// card; then: every value in the store is sealed, the start shows only the sign-in, a wrong password opens nothing,
// the right one opens everything as it was, Lock now locks, the recovery phrase opens and sets a new password, and
// turning the sign-in off gives back every value in plain. No page error at any step.
const pw = require('playwright');
const URL = process.argv[2], ENG = process.argv[3] || 'chromium';
let bad = 0, ok = 0;
const say = (g, n, info) => { if (g) ok++; else bad++; console.log((g ? 'ok   ' : 'BAD  ') + n + (info ? '  ' + String(info).slice(0, 400) : '')); };
(async () => {
  const b = ENG === 'chromium' ? await pw.chromium.launch({ executablePath: process.env.CD_CHROMIUM || '/opt/pw-browsers/chromium' }) : await pw[ENG].launch();
  const ctx = await b.newContext({ viewport: { width: 1300, height: 900 } });
  let p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 300)));
  let crashes = 0;
  // Linux's build of Safari's engine crashes at times on a page this size (it did before the sign-in too): a fresh start
  // that crashes is tried again in a new window, and counted as the engine's crash, not as a fault of the page
  const load = async (wait) => {
    for (let t = 0; t < 4; t++) {
      try { await p.goto(URL, { waitUntil: 'load', timeout: 240000 }); await p.waitForTimeout(wait || 6000); return; }
      catch (e) { if (!/crash/i.test(String(e)) || t === 3) throw e; crashes++; try { await p.close(); } catch (x) {} p = await ctx.newPage(); p.on('pageerror', e2 => errs.push(String(e2).slice(0, 300))); }
    }
  };
  const settle = async (ms) => { await p.waitForTimeout(ms || 800); };
  await load();
  // the work made before the sign-in
  await p.evaluate(async () => {
    state.cdLockTestMark = 'hello-lock'; saveState();
    localStorage.setItem('fontes_sources', JSON.stringify([{ title: 'A source kept before the sign-in' }]));
    await new Promise((res) => { const rq = indexedDB.open('tabula-big', 1); rq.onupgradeneeded = () => rq.result.createObjectStore('kv'); rq.onsuccess = () => { const t = rq.result.transaction('kv', 'readwrite'); t.objectStore('kv').put('<p>' + 'A long document. '.repeat(6000) + '</p>', 'tabula_autosave'); t.oncomplete = () => { rq.result.close(); res(); }; }; });
    // a recording; where the engine's database refuses a file (Safari's engine in a private window does), its sound as bytes
    const putRec = (sound) => new Promise((res) => { const rq = indexedDB.open('scriba_db', 1); rq.onupgradeneeded = () => rq.result.createObjectStore('recordings', { keyPath: 'id' }); rq.onerror = () => res(false);
      rq.onsuccess = () => { try { const t = rq.result.transaction('recordings', 'readwrite'); t.objectStore('recordings').put({ id: 'r1', name: 'Interview one', ts: 1, blob: sound, tx: { turns: [{ s: 0, e: 1, text: 'hello', spk: 0 }] } }); t.oncomplete = () => { rq.result.close(); res(true); }; t.onerror = t.onabort = () => { rq.result.close(); res(false); }; } catch (e) { res(false); } }; });
    if (!(await putRec(new Blob([new Uint8Array(300000).fill(7)], { type: 'audio/webm' })))) { await putRec(new Uint8Array(300000).fill(7).buffer); window.__cdSoundAsBytes = 1; }
  });
  await settle(1500);
  say(await p.evaluate(() => !!document.querySelector('#cd-door .cdl-doorkey')), 'the lock key is on the welcome card');
  // setting it up
  await p.evaluate(() => document.querySelector('#cd-door .cdl-doorkey').click()); await settle(400);
  say(await p.evaluate(() => /Protect this copy with a sign-in/.test(document.getElementById('cdLockDoor').textContent)), 'the setup asks to protect this copy');
  await p.fill('#cdlUser', 'Owner'); await p.fill('#cdlP1', 'short'); await p.fill('#cdlP2', 'short'); await p.click('#cdlSet button[type=submit]'); await settle(200);
  say(await p.evaluate(() => /at least eight/.test(document.querySelector('.cdl-err').textContent)), 'a password under eight characters is refused');
  await p.fill('#cdlP1', 'correct horse 1'); await p.fill('#cdlP2', 'correct horse 1'); await p.click('#cdlSet button[type=submit]'); await settle(300);
  const words = await p.evaluate(() => [...document.querySelectorAll('.cdl-words div')].map(d => d.textContent.replace(/^\d+/, '')));
  say(words.length === 10 && new Set(words).size === 10, 'ten different recovery words are shown', words.join(' '));
  await p.click('#cdlWrote'); await settle(300);
  const asked = await p.evaluate(() => [...document.querySelectorAll('#cdlCf label span')].map(s => +s.textContent.replace(/\D+/g, '')));
  await p.fill('#cdlW1', 'wrong'); await p.fill('#cdlW2', 'words'); await p.click('#cdlCf button[type=submit]'); await settle(200);
  say(await p.evaluate(() => !!document.querySelector('.cdl-err') && !document.querySelector('.cdl-err').hidden), 'wrong words are refused');
  await p.fill('#cdlW1', words[asked[0] - 1].toUpperCase()); await p.fill('#cdlW2', ' ' + words[asked[1] - 1] + ' '); await p.click('#cdlCf button[type=submit]');
  await p.waitForSelector('#cdlDone', { timeout: 120000 }); await settle(500);
  const sealed = await p.evaluate(async () => {
    const L = cdLock, R = L.raw, ls = L.store, out = { sealed: 0, plain: [] };
    for (let i = 0; i < ls.length; i++) { const k = R.key.call(ls, i); if (k === 'cd_lock_v1') continue; const v = R.get.call(ls, k); if (L.isEnv(v)) out.sealed++; else out.plain.push(k); }
    const get = (db, st, k) => Promise.race([new Promise((res) => { const rq = indexedDB.open(db); rq.onsuccess = () => { const g = rq.result.transaction(st).objectStore(st).get(k); g.onsuccess = () => { rq.result.close(); res(g.result); }; g.onerror = () => res(null); }; rq.onerror = () => res(null); }), new Promise((res) => setTimeout(() => res('timed out'), 20000))]);
    const doc = await get('tabula-big', 'kv', 'tabula_autosave'), rec = await get('scriba_db', 'recordings', 'r1');
    out.doc = L.isRecEnv(doc); out.rec = L.isRecEnv(rec) && !rec.name && !rec.blob && rec.id === 'r1';
    out.plainKeep = JSON.stringify(rec).indexOf('Interview one') < 0;
    return out;
  });
  say(sealed.sealed > 3 && sealed.plain.length === 0, 'every value in the store is sealed', JSON.stringify(sealed));
  say(sealed.doc && sealed.rec && sealed.plainKeep, "Tabula's document and Scriba's recording are sealed, the recording's name too");
  say(await p.evaluate(() => state.cdLockTestMark === 'hello-lock' && JSON.parse(localStorage.getItem('fontes_sources'))[0].title === 'A source kept before the sign-in'), 'the app reads its work as before while signed in');
  await p.click('#cdlDone'); await settle(300);
  // a new start: a new window, whose session is its own (a reload of a signed-in window stays signed in)
  await p.close(); p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e).slice(0, 300)));
  await load(4000);
  const atDoor = await p.evaluate(() => ({ door: !!document.getElementById('cdLockDoor') && !document.getElementById('cdLockDoor').hidden, app: typeof state !== 'undefined', welcome: /Welcome back, Owner/.test(document.body.textContent) }));
  say(atDoor.door && !atDoor.app && atDoor.welcome, 'a new start shows only the sign-in, the app does not start', JSON.stringify(atDoor));
  await p.fill('#cdlPw', 'not the password'); await p.click('#cdlGo'); await p.waitForFunction(() => document.querySelector('.cdl-err') && !document.querySelector('.cdl-err').hidden, null, { timeout: 60000 });
  say(await p.evaluate(() => /does not open/.test(document.querySelector('.cdl-err').textContent) && typeof state === 'undefined'), 'a wrong password opens nothing');
  await p.fill('#cdlPw', 'correct horse 1'); await Promise.all([p.waitForNavigation({ timeout: 240000 }), p.click('#cdlGo')]); await settle(6000);
  const opened = await p.evaluate(async () => {
    const get = (db, st, k) => Promise.race([new Promise((res) => { const rq = indexedDB.open(db); rq.onsuccess = () => { const g = rq.result.transaction(st).objectStore(st).get(k); g.onsuccess = () => { rq.result.close(); res(g.result); }; g.onerror = () => res(null); }; rq.onerror = () => res(null); }), new Promise((res) => setTimeout(() => res('timed out'), 20000))]);
    const doc = await cdLock.openVal(await get('tabula-big', 'kv', 'tabula_autosave'), 'idb:tabula-big/kv/tabula_autosave');
    const rec = await cdLock.openVal(await get('scriba_db', 'recordings', 'r1'), 'idb:scriba_db/recordings/r1');
    return { mark: state.cdLockTestMark, src: JSON.parse(localStorage.getItem('fontes_sources'))[0].title, doc: doc.length, recName: rec.name, blob: rec.blob instanceof Blob ? rec.blob.size : (rec.blob && rec.blob.byteLength) || -1, door: !!document.getElementById('cd-door') };
  });
  say(opened.mark === 'hello-lock' && opened.src === 'A source kept before the sign-in' && opened.doc > 90000 && opened.recName === 'Interview one' && opened.blob === 300000, 'the right password opens everything as it was', JSON.stringify(opened));
  // Lock now
  await Promise.all([p.waitForNavigation({ timeout: 240000 }), p.evaluate(() => cdLockUI.lockNow())]); await settle(4000);
  say(await p.evaluate(() => typeof state === 'undefined' && !document.getElementById('cdLockDoor').hidden), 'Lock now locks: the sign-in again');
  // the recovery phrase, and a new password
  await p.click('#cdlForgot'); await settle(200);
  await p.fill('#cdlPhrase', words.join('  ').toUpperCase()); await p.click('#cdlFg button[type=submit]');
  await p.waitForSelector('#cdlNp', { timeout: 60000 });
  await p.fill('#cdlP1', 'a new pass 22'); await p.fill('#cdlP2', 'a new pass 22'); await Promise.all([p.waitForNavigation({ timeout: 240000 }), p.click('#cdlNp button[type=submit]')]); await settle(6000);
  say(await p.evaluate(() => state.cdLockTestMark === 'hello-lock'), 'the recovery phrase opens it and keeps a new password');
  await Promise.all([p.waitForNavigation({ timeout: 240000 }), p.evaluate(() => cdLockUI.lockNow())]); await settle(4000);
  await p.fill('#cdlPw', 'correct horse 1'); await p.click('#cdlGo'); await p.waitForFunction(() => document.querySelector('.cdl-err') && !document.querySelector('.cdl-err').hidden, null, { timeout: 60000 });
  say(true, 'the old password no longer opens it');
  await p.fill('#cdlPw', 'a new pass 22'); await Promise.all([p.waitForNavigation({ timeout: 240000 }), p.click('#cdlGo')]); await settle(6000);
  // a backup never carries the sign-in's record, and holds the work opened
  const bk = await p.evaluate(async () => { try { const o = await window.__cdBackupCore.backupObj(); const d = o.data || {}; return { lock: Object.keys(d).some(k => /^cd_lock_/.test(k)), mark: /hello-lock/.test(d.carpe_diem_offline_v1 || ''), sealedIn: JSON.stringify(o).indexOf('CDL1.') >= 0 }; } catch (e) { return { err: String(e) }; } });
  say(bk && !bk.lock && bk.mark && !bk.sealedIn, 'a backup holds the work opened and not the sign-in', JSON.stringify(bk));
  // turning it off
  await p.evaluate(() => cdLockUI.sheet()); await settle(300); await p.click('#cdlOff'); await settle(200);
  await p.fill('#cdlPw', 'a new pass 22'); await Promise.all([p.waitForNavigation({ timeout: 240000 }), p.click('#cdlOffF button[type=submit]')]); await settle(6000);
  const plain = await p.evaluate(async () => {
    const L = cdLock, R = L.raw, ls = L.store, out = { sealed: [], rec: R.get.call(ls, 'cd_lock_v1'), door: !!document.getElementById('cdLockDoor') && !document.getElementById('cdLockDoor').hidden, mark: state.cdLockTestMark };
    for (let i = 0; i < ls.length; i++) { const k = R.key.call(ls, i); if (L.isEnv(R.get.call(ls, k))) out.sealed.push(k); }
    const get = (db, st, k) => Promise.race([new Promise((res) => { const rq = indexedDB.open(db); rq.onsuccess = () => { const g = rq.result.transaction(st).objectStore(st).get(k); g.onsuccess = () => { rq.result.close(); res(g.result); }; g.onerror = () => res(null); }; rq.onerror = () => res(null); }), new Promise((res) => setTimeout(() => res('timed out'), 20000))]);
    const doc = await get('tabula-big', 'kv', 'tabula_autosave'), rec = await get('scriba_db', 'recordings', 'r1');
    out.doc = typeof doc === 'string' && doc.length > 90000; out.recName = rec && rec.name; out.blob = rec && rec.blob instanceof Blob ? rec.blob.size : (rec && rec.blob && rec.blob.byteLength) || -1;
    return out;
  });
  say(!plain.rec && !plain.door && plain.sealed.length === 0 && plain.mark === 'hello-lock' && plain.doc && plain.recName === 'Interview one' && plain.blob === 300000, 'turning it off gives every value back in plain, and no sign-in', JSON.stringify(plain));
  if (errs.length) say(false, 'page errors', errs.join(' | '));
  console.log((bad ? 'FAIL ' : 'PASS ') + ENG + ': ' + ok + ' good, ' + bad + ' bad' + (crashes ? ' (the engine crashed ' + crashes + ' time(s) on a fresh start and was started again)' : ''));
  await b.close(); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL crash ' + String(e).slice(0, 600)); process.exit(2); });
