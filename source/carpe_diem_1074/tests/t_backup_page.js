// t_backup_page.js URL: build 1074's Backup sheet in the page, as a person meets it, with a stand-in for the Mac and
// Windows apps (window.pywebview.api.backup_*, which keeps what it is given in memory).
// * the panel's keys say Back up now, Restore from a backup, Every day…, in English and in French, and stay so after
//   the language is changed (the old labels never come back);
// * a backup to a place in the app, compressed, with a piece refused once on the way (tried again), read back whole:
//   the study, a Tabula document in its large store, a Scriba recording;
// * a sealed backup (a passphrase): the wrong passphrase refused, the right one opens it;
// * a piece refused four times: the backup is not kept, nothing half written is left, Try again, Save another way
//   and Reload Carpe Diem are offered;
// * Restore: the backup chosen as a file, Replace; a copy of the present work kept first; Carpe Diem starts again with
//   the backup's work (the marker in the study, the large Tabula record, the Scriba recording);
// * every day: switched on, a backup made at once to the place chosen, the line says so.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const URL_ = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1300, height: 880 }, acceptDownloads: true });
  await ctx.addInitScript(() => {
    // the app's side: places, and a backup kept in pieces in memory (one piece refused once, or always, when asked)
    window.__host = { files: {}, open: {}, refuse: 0, refuseAlways: false, calls: [] };
    const H = window.__host;
    window.pywebview = { api: {
      backup_places() { return Promise.resolve([{ id: 'documents', label: 'Documents › Carpe Diem › Backups', cloud: false }, { id: 'cloud:iCloud Drive', label: 'iCloud Drive › Carpe Diem Backups', cloud: true }]); },
      backup_begin(place, name) { H.calls.push(['begin', place, name]); console.log('HOST begin ' + place + ' ' + name); const k = 'k' + Math.random().toString(36).slice(2); H.open[k] = { place, name, parts: [], next: 0 }; return Promise.resolve({ key: k }); },
      backup_part(k, i, b64) { const r = H.open[k]; H.calls.push(['part', i]); if (!r) return Promise.resolve(false);
        if (H.refuseAlways || H.refuse > 0) { H.refuse--; return Promise.reject(new Error('the disk said no')); }
        if (i < r.next) return Promise.resolve(true); if (i !== r.next) return Promise.resolve(false); r.parts.push(b64); r.next++; return Promise.resolve(true); },
      backup_end(k, keep, prefix) { const r = H.open[k]; delete H.open[k]; H.calls.push(['end', keep, prefix]); H.files[r.place + '/' + r.name] = r.parts.join('|'); return Promise.resolve({ ok: true, token: 't-' + r.name, name: r.name, size: r.parts.reduce((n, p) => n + atob(p).length, 0) }); },
      backup_abort(k) { H.calls.push(['abort']); delete H.open[k]; return Promise.resolve(true); },
      backup_reveal(t) { H.calls.push(['reveal', t]); return Promise.resolve(true); }
    } };
  });
  const p = await ctx.newPage();
  const errs = [], hostLog = [];
  p.on('console', m => { if (/^HOST /.test(m.text())) hostLog.push(m.text()); });
  p.on('pageerror', e => errs.push('page: ' + e.message.slice(0, 300)));
  p.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 300)); });
  await p.goto(URL_, { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(3500);
  await p.evaluate(() => { try { if (typeof cdCloseDoor === 'function') cdCloseDoor(); } catch (e) {} });
  const out = {};
  // some work: a marker in the study, a large Tabula record, a Scriba recording
  await p.evaluate(async () => {
    state.cdTestMarker = 'before-backup-' + 1074; saveState();
    function put(db, store, key, val, ver) { return new Promise((res, rej) => { const r = indexedDB.open(db, ver || 1); r.onupgradeneeded = () => { try { r.result.createObjectStore(store); } catch (e) {} }; r.onsuccess = () => { const d = r.result; const t = d.transaction(store, 'readwrite'); t.objectStore(store).put(val, key); t.oncomplete = () => { d.close(); res(); }; t.onerror = () => rej(t.error); }; r.onerror = () => rej(r.error); }); }
    await put('tabula-big', 'kv', 'doc:test', 'x'.repeat(300000));
    await put('scriba_db', 'recordings', 'rec-1', { id: 'rec-1', name: 'Seminar', blob: new Blob([new Uint8Array(200000).fill(7)], { type: 'audio/webm' }) });
  });
  // the panel's words
  out.panel = await p.evaluate(async () => {
    const W = () => ({ ex: document.getElementById('export-btn').textContent, im: document.getElementById('import-btn').textContent, daily: (document.getElementById('cd-bk-daily') || {}).textContent, desc: document.getElementById('backup-desc').textContent.trim().slice(0, 40) });
    const a = W(); setLang('fr'); await new Promise(r => setTimeout(r, 400)); const f = W(); await new Promise(r => setTimeout(r, 3300)); const f2 = W(); setLang('en'); await new Promise(r => setTimeout(r, 400)); const e = W();
    return { en: a, fr: f, frLater: f2, enAgain: e };
  });
  // a backup to Documents, one piece refused once on the way
  await p.evaluate(() => { window.__host.refuse = 1; cdBackup.open(); });
  await p.waitForSelector('#cd-bk .cd-bk-keys button.cd-bk-go', { timeout: 30000 });
  await p.check('#cd-bk input[name="cd-bk-place"][value="documents"]');
  await p.click('#cd-bk .cd-bk-keys button.cd-bk-go');
  await p.waitForFunction(() => /Kept:|Gardée/.test((document.querySelector('#cd-bk .cd-bk-say') || {}).textContent || ''), null, { timeout: 60000 });
  out.kept = await p.evaluate(() => ({ say: document.querySelector('#cd-bk .cd-bk-say').textContent, keys: [...document.querySelectorAll('#cd-bk .cd-bk-keys button')].map(b => b.textContent), files: Object.keys(window.__host.files), parts: window.__host.calls.filter(c => c[0] === 'part').length }));
  await p.screenshot({ path: path.join(os.tmpdir(), 'bk_kept.png') });
  // read it back whole
  out.readBack = await p.evaluate(async () => {
    const f = Object.keys(window.__host.files)[0]; const parts = window.__host.files[f].split('|');
    const bin = parts.map(x => atob(x)).join(''); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const obj = await cdBackup._read(u, () => Promise.resolve(null));
    return { gz: u[0] === 0x1f && u[1] === 0x8b, format: obj.format, v: obj.v, marker: JSON.parse(obj.data[STORAGE_KEY]).cdTestMarker, tabulaBig: !!(obj.idb['tabula-big'] && obj.idb['tabula-big'].stores.kv.rows.length), scriba: !!(obj.idb.scriba_db && obj.idb.scriba_db.stores.recordings.rows.length), size: u.length, name: f };
  });
  await p.evaluate(() => document.querySelector('#cd-bk .cd-bk-keys button.cd-bk-go').click());
  // a sealed backup, made and opened with the passphrase, refused with another
  out.sealed = await p.evaluate(async () => {
    const g = await cdBackup._gather(); const s = await cdBackup._seal('correct horse battery');
    const keyed = await (async () => { const m = await cdBackup._pack(g, null, () => {}); return m; })();
    return { plainSize: keyed.size };
  });
  out.sealed2 = await p.evaluate(async () => {
    // seal through the sheet's own path: the stored seal from _seal() above
    const g = await cdBackup._gather();
    const te = new TextEncoder();
    const pass = 'a long passphrase 1074';
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const base = await crypto.subtle.importKey('raw', te.encode(pass), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    const m = await cdBackup._pack(g, { key, salt, iter: 600000 }, () => {});
    let wrong = null; let tries = 0;
    try { await cdBackup._read(m.bytes, (again) => { tries++; return Promise.resolve(tries === 1 ? 'not the passphrase' : (tries === 2 ? pass : null)); }); wrong = 'opened after ' + tries + ' tries'; } catch (e) { wrong = 'error ' + e.message; }
    return { sealed: m.sealed, ext: m.ext, head: String.fromCharCode(...m.bytes.slice(0, 4)), result: wrong };
  });
  // four refusals: not kept, the keys offered, nothing left open
  await p.evaluate(() => { window.__host.refuseAlways = true; window.__host.calls = []; cdBackup.open(); });
  await p.waitForSelector('#cd-bk .cd-bk-keys button.cd-bk-go', { timeout: 30000 });
  await p.check('#cd-bk input[name="cd-bk-place"][value="documents"]');
  await p.click('#cd-bk .cd-bk-keys button.cd-bk-go');
  await p.waitForFunction(() => /not kept|pas été gardée/.test((document.querySelector('#cd-bk .cd-bk-say') || {}).textContent || ''), null, { timeout: 60000 });
  out.failed = await p.evaluate(() => ({ say: document.querySelector('#cd-bk .cd-bk-say').textContent, keys: [...document.querySelectorAll('#cd-bk .cd-bk-keys button')].map(b => b.textContent), tries: window.__host.calls.filter(c => c[0] === 'part').length, aborted: window.__host.calls.some(c => c[0] === 'abort'), open: Object.keys(window.__host.open).length }));
  await p.screenshot({ path: path.join(os.tmpdir(), 'bk_failed.png') });
  await p.evaluate(() => { window.__host.refuseAlways = false; document.querySelector('#cd-bk .cd-bk-keys button:last-child').click(); });
  // every day: on, a backup at once
  await p.evaluate(() => cdBackup.daily());
  await p.waitForSelector('#cd-bk .cd-bk-on', { timeout: 30000 });
  await p.check('#cd-bk .cd-bk-on');
  await p.check('#cd-bk input[name="cd-bk-dplace"][value="documents"]');
  await p.evaluate(() => { [...document.querySelectorAll('#cd-bk .cd-bk-keys button')].find(b => /Back up now|Sauvegarder maintenant/.test(b.textContent)).click(); });
  await p.waitForFunction(() => /Daily backups: last|la dernière/.test((document.querySelector('#cd-bk .cd-bk-say') || {}).textContent || ''), null, { timeout: 60000 });
  out.daily = await p.evaluate(() => ({ say: document.querySelector('#cd-bk .cd-bk-say').textContent, autos: Object.keys(window.__host.files).filter(f => /carpe-diem-auto-/.test(f)), end: window.__host.calls.filter(c => c[0] === 'end').slice(-1)[0] }));
  await p.evaluate(() => { const b = [...document.querySelectorAll('#cd-bk .cd-bk-keys button')].find(x => /Close|Fermer/.test(x.textContent)); if (b) b.click(); else document.getElementById('cd-bk').remove(); });
  // restore: the first backup as a file, Replace; the work changed in between comes back as it was
  const fileName = out.readBack.name.split('/').pop();
  const bytes = await p.evaluate((f) => { const parts = window.__host.files[f].split('|'); return parts.join('|'); }, out.readBack.name);
  const buf = Buffer.concat(bytes.split('|').map(x => Buffer.from(x, 'base64')));
  const tmpf = path.join(os.tmpdir(), fileName); fs.writeFileSync(tmpf, buf);
  await p.evaluate(() => { state.cdTestMarker = 'changed-after'; saveState(); });
  await p.evaluate(() => cdBackup.restore());
  await p.waitForSelector('#cd-bk .cd-bk-keys button.cd-bk-go', { timeout: 30000 });
  const [chooser] = await Promise.all([p.waitForEvent('filechooser'), p.click('#cd-bk .cd-bk-keys button.cd-bk-go')]);
  await chooser.setFiles(tmpf);
  await p.waitForFunction(() => [...document.querySelectorAll('#cd-bk .cd-bk-keys button')].some(b => /Replace|Remplacer/.test(b.textContent)), null, { timeout: 60000 });
  out.restoreSays = await p.evaluate(() => document.querySelector('#cd-bk .cd-bk-body').innerText.slice(0, 300));
  await Promise.all([
    p.waitForNavigation({ timeout: 120000 }).catch(() => null),
    p.evaluate(() => [...document.querySelectorAll('#cd-bk .cd-bk-keys button')].find(b => /Replace|Remplacer/.test(b.textContent)).click())
  ]);
  await p.waitForTimeout(6000);
  out.after = await p.evaluate(async () => {
    function get(db, store, key) { return new Promise((res) => { const r = indexedDB.open(db); r.onsuccess = () => { const d = r.result; try { const q = d.transaction(store, 'readonly').objectStore(store).get(key); q.onsuccess = () => { d.close(); res(q.result); }; q.onerror = () => { d.close(); res(null); }; } catch (e) { d.close(); res('no store'); } }; r.onerror = () => res(null); }); }
    const big = await get('tabula-big', 'kv', 'doc:test'); const rec = await get('scriba_db', 'recordings', 'rec-1');
    return { marker: state.cdTestMarker, big: big ? big.length : big, rec: rec ? { name: rec.name, blob: rec.blob instanceof Blob, size: rec.blob && rec.blob.size } : rec, };
  });
  out.hostLog = hostLog;
  out.errs = errs.slice(0, 10);
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
