// t_film.js PAGE_URL OUTDIR [CHECK_DIR]: the Guidebook's film of 1080 used as a person uses it, and measured.
// Opened from the Guidebook's one entry on a screen of device pixel ratio 2: the film's real size (1728x1080) and its
// size on screen (never more than its pixels over the ratio); the side keys drawn over it with this device's glyphs
// (the same text, font and size as the real keys), lined up with the filmed places at several moments (offset in
// pixels), turning as filmed; the owner's cut also against its filmed reminder badge, found in the film's own pixels;
// following the film while it plays faster, never a frame behind or ahead once paused; under the captions, away from the
// controls; the 1079 promises (still until Play, no sound, captions in the reader's language, speed and captions
// remembered, scenes, Read instead, Space, arrows, Escape, the tour's key); Windows 10's flat pictures when the app
// shows them; French; night; a 1024-px window. With CHECK_DIR (film/check: a short film of the keys with their glyphs
// filmed, made by rec_film80.js with VERIFY=1), the drawn glyphs are compared with the filmed ones pixel by pixel.
// Exit code 1 on any failure or page error.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const [URL_, OUT, CHECK] = process.argv.slice(2);
if (OUT) fs.mkdirSync(OUT, { recursive: true });
let fails = 0;
const report = {};
function ok(c, what, extra) { console.log((c ? 'ok   ' : 'FAIL ') + what + (extra !== undefined ? '  ' + JSON.stringify(extra).slice(0, 400) : '')); if (!c) fails++; }

async function boot(b, vp, dpr) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: dpr });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('page: ' + e.message.slice(0, 240)));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/sw\.js|favicon|Failed to load resource|bad HTTP response/.test(t)) errs.push('console: ' + t.slice(0, 240)); });
  await p.goto(URL_, { waitUntil: 'load', timeout: 180000 });
  await p.waitForFunction(() => { const s = document.getElementById('cd-splash'); return !s || getComputedStyle(s).display === 'none' || +getComputedStyle(s).opacity === 0; }, null, { timeout: 120000, polling: 250 }).catch(() => {});
  await p.waitForTimeout(2500);
  for (let i = 0; i < 6; i++) {
    await p.evaluate(() => { try { if (document.getElementById('cd-door')) cdCloseDoor(); } catch (e) {} try { if (typeof demoRemove === 'function') { demoRemove('demo-entry'); demoRemove('demo-build'); } } catch (e) {} });
    await p.waitForTimeout(300);
  }
  await p.evaluate(() => { state.themeAuto = false; state.theme = 'light'; delete state.cdFilm; saveState(); applyTheme(); if (state.lang !== 'en') setLang('en'); });
  await p.waitForTimeout(500);
  return { ctx, p, errs };
}
const ev = (p, f, a) => p.evaluate(f, a);
async function openFromGuide(p) {
  await ev(p, () => { try { closeModal(); } catch (e) {} });
  await ev(p, () => openGuidebook()); await p.waitForTimeout(900);
  await p.click('#modal-root .cdf-gbcard .cdf-key');
  await p.waitForFunction(() => { const v = document.querySelector('#cd-film video'); return v && v.readyState >= 2; }, null, { timeout: 20000 });
  await p.waitForTimeout(400);
}
async function seek(p, t) {
  await ev(p, (t) => new Promise(res => { const v = document.querySelector('#cd-film video'); v.pause(); const done = () => { v.removeEventListener('seeked', done); requestAnimationFrame(() => requestAnimationFrame(res)); }; v.addEventListener('seeked', done); v.currentTime = t; setTimeout(res, 3000); }), t);
}
// where each drawn key is against where the film says it is, in screen pixels
const ALIGN = () => {
  const K = window.cdFilm._keys, st = document.querySelector('#cd-film .cdf-stage'), sk = st.querySelector('.cdf-sk');
  const v = st.querySelector('video'), sr = st.getBoundingClientRect(), s = sr.width / K.w, f = Math.floor(v.currentTime * K.fps + 1e-6);
  const out = { f, painted: sk.__f, scale: +s.toFixed(4), keys: {} };
  for (const id in K.keys) {
    const t = K.keys[id].t; let e = null; for (const r of t) { if (r[0] <= f) e = r; else break; }
    const el = sk.querySelector('[data-k="' + id + '"]'), shown = el && getComputedStyle(el).display !== 'none';
    if (!e || !(e[5] > 0)) { out.keys[id] = { filmed: false, shown }; continue; }
    const r = el.getBoundingClientRect(), g = el.firstChild, tf = getComputedStyle(g).transform;
    const ex = sr.left + e[1] * s, ey = sr.top + e[2] * s;
    let ang = 0; if (tf && tf !== 'none') { const m = tf.match(/matrix\(([^)]+)\)/); if (m) { const a = m[1].split(',').map(Number); ang = Math.atan2(a[1], a[0]) * 180 / Math.PI; } }
    const fang = e.length >= 13 ? Math.atan2(e[8], e[7]) * 180 / Math.PI : 0;
    out.keys[id] = { filmed: true, shown, dx: +(r.left - ex).toFixed(3), dy: +(r.top - ey).toFixed(3), dw: +(r.width - e[3] * s).toFixed(3), dh: +(r.height - e[4] * s).toFixed(3), ang: +ang.toFixed(2), fang: +fang.toFixed(2), ch: K.chars[e[6]], text: g.textContent, img: !!g.querySelector('img') };
  }
  return out;
};

(async () => {
  const b = await chromium.launch();
  const { ctx, p, errs } = await boot(b, { width: 1280, height: 900 }, 2);
  ok(await ev(p, () => { const d = document.getElementById('cd-film-1080-data'); return !!d && d.type === 'application/octet-stream' && d.textContent.length > 100000 && !document.getElementById('cd-film-1079-data') && !window.__cdFilmB64; }), 'the film is in the page (not parsed as a script), the 1079 film gone');

  // the live keys as the app draws them on this device: glyph text, font, size; the reminder badge beside the bell
  const live = await ev(p, () => {
    const SEL = { 'sticky-fab': '#sticky-fab>span', 'horo-fab': '#horo-fab>span:first-child', 'cd-theme-fab': '#cd-theme-fab>span', 'cd-thought-fab': '#cd-thought-fab .cd-thought-glyph', 'reminders-fab': '#reminders-fab .rem-fab-bell', 'cd-quiet-fab': '#cd-quiet-fab .cd-quiet-glyph' };
    const o = {};
    for (const id in SEL) { const g = document.querySelector(SEL[id]); if (!g) continue; const c = getComputedStyle(g); o[id] = { text: g.textContent.trim(), ff: c.fontFamily, fs: parseFloat(c.fontSize) }; }
    const k = document.getElementById('reminders-fab'), g = k && k.querySelector('.rem-fab-bell'), bd = k && k.querySelector('.rem-fab-badge');
    if (k && g && bd && k.getBoundingClientRect().width) {
      const r = k.getBoundingClientRect(), x = r.left + k.clientLeft + g.offsetLeft, y = r.top + k.clientTop + g.offsetTop, br = bd.getBoundingClientRect();
      o.badge = { dx: br.left + br.width / 2 - (x + g.offsetWidth / 2), dy: br.top + br.height / 2 - (y + g.offsetHeight / 2) };
    }
    return o;
  });

  await ev(p, () => openGuidebook()); await p.waitForTimeout(900);
  const g = await ev(p, () => ({ card: document.querySelectorAll('#modal-root .cdf-gbcard').length, entries: document.querySelectorAll('#modal-root [data-cd-film]').length }));
  ok(g.card === 1 && g.entries === 1, 'the Guidebook: one entry to the film, its card', g);
  if (OUT) await p.screenshot({ path: path.join(OUT, 'film_guidebook.png') });
  await p.click('#modal-root .cdf-gbcard .cdf-key');
  await p.waitForFunction(() => { const v = document.querySelector('#cd-film video'); return v && v.readyState >= 2; }, null, { timeout: 20000 });
  await p.waitForTimeout(600);

  // the film's real size and its size on screen
  const sz = await ev(p, () => { const v = document.querySelector('#cd-film video'), st = document.querySelector('#cd-film .cdf-stage'), r = st.getBoundingClientRect(), vr = v.getBoundingClientRect(), K = window.cdFilm._keys;
    return { vw: v.videoWidth, vh: v.videoHeight, dur: v.duration, frames: K.frames, dpr: devicePixelRatio, w: r.width, h: r.height, vidw: vr.width, vidh: vr.height, sharp: v.videoWidth / devicePixelRatio, muted: v.muted, controls: v.controls, paused: v.paused, t: v.currentTime }; });
  report.size = sz;
  ok(sz.vw === 1728 && sz.vh === 1080, 'the film is 1728x1080', sz);
  ok(Math.abs(sz.dur - sz.frames / 30) < 0.1, 'its length matches the side keys\' record (' + sz.frames + ' frames at 30 a second)', { dur: sz.dur });
  ok(sz.w <= sz.sharp + 0.5 && sz.w >= 0.75 * sz.sharp && Math.abs(sz.w / sz.h - 1.6) < 0.01 && Math.abs(sz.vidw - sz.w) < 0.5 && Math.abs(sz.vidh - sz.h) < 0.5, 'shown at ' + sz.w + ' CSS px, never more than its sharp size (' + sz.sharp + ' at a ratio of ' + sz.dpr + ')', sz);
  ok(sz.paused && sz.t === 0 && sz.muted && !sz.controls, 'it opens still, silent, with the player\'s own controls below it');

  // the side keys: this device's glyphs, font and size
  const a0 = await ev(p, ALIGN);
  const glyphs = await ev(p, () => [...document.querySelectorAll('#cd-film .cdf-sk-key')].map(el => { const g = el.firstChild, c = getComputedStyle(g), m = getComputedStyle(el).transform.match(/matrix\(([^,]+)/); return { k: el.dataset.k, shown: getComputedStyle(el).display !== 'none', text: g.textContent, ff: c.fontFamily, fs: parseFloat(c.fontSize), sc: m ? +m[1] : 1 }; }));
  const sc = a0.scale;
  const gl = glyphs.filter(x => x.shown).map(x => ({ k: x.k, text: x.text, same: !!live[x.k] && live[x.k].text === x.text && live[x.k].ff === x.ff && live[x.k].fs === x.fs && Math.abs(x.sc - sc) < 0.001 }));
  ok(gl.length >= 5 && gl.every(x => x.same), 'the side keys are drawn with this device\'s glyphs: ' + gl.map(x => x.text).join(' ') + ' (the same text, font and size as the real keys, then scaled with the film: ' + sc + ')', gl);
  ok(Object.values(a0.keys).every(k => k.filmed === k.shown), 'every key filmed at this moment is drawn, and no other', a0.keys);

  // lined up at several moments: each scene, a ring of the bell, a turn of the hourglass and of the notes
  const K = await ev(p, () => { const K = window.cdFilm._keys; const first = (id) => { const t = (K.keys[id] || {}).t || []; const r = t.find(r => r.length >= 13 && Math.abs(Math.atan2(r[8], r[7])) > 0.12); return r ? r[0] : null; }; return { frames: K.frames, ring: first('reminders-fab'), turnH: first('horo-fab'), turnN: first('sticky-fab') }; });
  const scenesAt = await ev(p, () => [...document.querySelectorAll('#cd-film .cdf-chap')].map(b => +b.getAttribute('data-at')));
  const moments = [0.5].concat(scenesAt.map(t => t + 1.2)).concat([K.ring, K.turnH, K.turnN].filter(f => f != null).map(f => (f + 0.5) / 30)).concat([(K.frames - 1.5) / 30]);
  let worst = 0, worstAng = 0; const per = [];
  for (const t of moments) {
    await seek(p, t);
    const a = await ev(p, ALIGN);
    const ks = Object.values(a.keys).filter(k => k.filmed);
    const m = Math.max(0, ...ks.map(k => Math.max(Math.abs(k.dx), Math.abs(k.dy), Math.abs(k.dw), Math.abs(k.dh))));
    const ma = Math.max(0, ...ks.map(k => Math.abs(k.ang - k.fang)));
    worst = Math.max(worst, m); worstAng = Math.max(worstAng, ma);
    per.push({ t: +t.toFixed(2), f: a.f, painted: a.painted, keys: ks.length, px: +m.toFixed(3), turn: +ma.toFixed(2) });
    if (a.painted !== a.f) ok(false, 'the keys show the frame on screen at ' + t.toFixed(2) + ' s', a);
  }
  report.align = per;
  ok(worst < 0.6 && worstAng < 0.6, 'the drawn keys sit where the film says at ' + moments.length + ' moments: largest offset ' + worst.toFixed(3) + ' px, largest turn difference ' + worstAng.toFixed(2) + '°', per);
  if (OUT) { await seek(p, (K.ring != null ? K.ring + 3 : 30) / 30); await p.screenshot({ path: path.join(OUT, 'film_keys_ring.png') }); }

  // the owner's cut: the filmed reminder badge, found in the film's pixels, against the drawn bell
  if (live.badge && await ev(p, () => !!window.cdFilm._keys.keys['reminders-fab'])) {
    const bad = [];
    for (const t of [1.0, scenesAt[2] + 1, scenesAt[scenesAt.length - 1] + 1.5]) {
      await seek(p, t);
      const r = await ev(p, (bd) => {
        const st = document.querySelector('#cd-film .cdf-stage'), v = st.querySelector('video'), sr = st.getBoundingClientRect(), K = window.cdFilm._keys;
        const el = st.querySelector('[data-k="reminders-fab"]'), er = el.getBoundingClientRect(), s = sr.width / K.w;
        if (getComputedStyle(el).display === 'none') return null;
        const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; const x = c.getContext('2d'); x.drawImage(v, 0, 0);
        const k = v.videoWidth / K.w; // film pixels per filmed CSS pixel
        // expected badge centre in film pixels, from the drawn bell and the live badge's place beside it
        const ecx = ((er.left + er.width / 2 - sr.left) / s + bd.dx) * k, ecy = ((er.top + er.height / 2 - sr.top) / s + bd.dy) * k;
        const R = 40, x0 = Math.max(0, Math.round(ecx - R)), y0 = Math.max(0, Math.round(ecy - R)), d = x.getImageData(x0, y0, 2 * R, 2 * R).data;
        let n = 0, sx = 0, sy = 0;
        for (let j = 0; j < 2 * R; j++) for (let i = 0; i < 2 * R; i++) { const o = (j * 2 * R + i) * 4; if (d[o] > 140 && d[o + 1] < 90 && d[o + 2] < 90) { n++; sx += i; sy += j; } }
        if (!n) return { n: 0 };
        const fx = x0 + sx / n, fy = y0 + sy / n;
        return { n, dxPx: +((fx - ecx) / k * s).toFixed(2), dyPx: +((fy - ecy) / k * s).toFixed(2) };
      }, live.badge);
      bad.push(Object.assign({ t: +t.toFixed(2) }, r || {}));
    }
    report.badge = bad;
    const got = bad.filter(r => r.n > 20);
    ok(got.length >= 2 && got.every(r => Math.abs(r.dxPx) < 1.5 && Math.abs(r.dyPx) < 1.5), 'against the film\'s own pixels: the filmed reminder badge sits beside the drawn bell as in the app (offsets in screen px)', bad);
  }

  // following the film while it plays at 1.25×: never more than a frame off while playing, exact when it stops
  await seek(p, 2);
  await p.click('#cd-film [data-rate="1.25"]');
  const drift = await ev(p, () => new Promise(res => {
    // each frame the video presents (its own callback, after the player's): the keys must show that very frame
    const v = document.querySelector('#cd-film video'), sk = document.querySelector('#cd-film .cdf-sk'), K = window.cdFilm._keys;
    let n = 0, off = 0, worst = 0, seen = new Set(), t0 = 0, raf = 0, rafWorst = 0;
    if (typeof v.requestVideoFrameCallback !== 'function') { res({ none: true }); return; }
    const cb = (now, meta) => { const fm = Math.round(meta.mediaTime * K.fps); if (!v.paused) { n++; seen.add(fm); if (sk.__f !== fm) off++; worst = Math.max(worst, Math.abs(sk.__f - fm)); } if (performance.now() - t0 < 3000) v.requestVideoFrameCallback(cb); };
    const step = () => { if (!v.paused) { raf++; rafWorst = Math.max(rafWorst, Math.abs(sk.__f - Math.floor(v.currentTime * K.fps + 1e-6))); } if (performance.now() - t0 < 3000) requestAnimationFrame(step); };
    v.play().then(() => { t0 = performance.now(); v.requestVideoFrameCallback(cb); requestAnimationFrame(step); setTimeout(() => { v.pause(); setTimeout(() => { const kept = sk.__f; v.addEventListener('seeked', () => requestAnimationFrame(() => requestAnimationFrame(() => res({ n, off, worst, distinct: seen.size, rate: v.playbackRate, t: v.currentTime, kept, after: sk.__f, fNow: Math.floor(v.currentTime * K.fps + 1e-6), clockWorst: rafWorst }))), { once: true }); v.currentTime = v.currentTime; }, 300); }, 3100); });
  }));
  report.drift = drift;
  ok(drift.rate === 1.25 && drift.n > 20 && drift.off === 0 && drift.distinct > 20 && drift.after === drift.fNow, 'the keys follow the film at 1.25×: the frame the video shows, every time (' + drift.n + ' frames shown); stopped and set to a time, the frame at that time', drift);

  // under the captions, away from the controls
  const lay = await ev(p, () => {
    const st = document.querySelector('#cd-film .cdf-stage'), sk = st.querySelector('.cdf-sk'), cc = st.querySelector('.cdf-cc'), sr = st.getBoundingClientRect();
    const ctrls = [...document.querySelectorAll('#cd-film .cdf-seek, #cd-film .cdf-keys, #cd-film .cdf-chaps')].map(e => e.getBoundingClientRect());
    return { ccOver: +getComputedStyle(cc).zIndex > +getComputedStyle(sk).zIndex && cc.compareDocumentPosition(sk) === Node.DOCUMENT_POSITION_PRECEDING, apart: ctrls.every(r => r.top >= sr.bottom - 0.5), skInside: (() => { const r = sk.getBoundingClientRect(); return r.left >= sr.left - 0.5 && r.right <= sr.right + 0.5 && r.bottom <= sr.bottom + 0.5; })(), ccText: cc.textContent };
  });
  ok(lay.ccOver && lay.apart && lay.skInside, 'the captions are drawn above the keys; the keys stay inside the film; the controls are below it', lay);

  // the 1079 promises
  await seek(p, 0);
  const cc0 = await ev(p, () => ({ text: document.querySelector('#cd-film .cdf-cc').textContent, on: document.querySelector('#cd-film .cdf-cc').classList.contains('on'), tracks: [...document.querySelector('#cd-film video').textTracks].map(t => t.language) }));
  ok(/^Home: /.test(cc0.text) && cc0.on && cc0.tracks.join() === 'en,fr', 'captions on in English at the start', cc0);
  await p.click('#cd-film [data-f="play"]'); await p.waitForTimeout(1200);
  ok(await ev(p, () => !document.querySelector('#cd-film video').paused && document.querySelector('#cd-film video').currentTime > 0.5), 'Play plays');
  await p.keyboard.press('Space'); await p.waitForTimeout(300);
  ok(await ev(p, () => document.querySelector('#cd-film video').paused), 'Space pauses');
  const tA = await ev(p, () => document.querySelector('#cd-film video').currentTime);
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300);
  const tB = await ev(p, () => document.querySelector('#cd-film video').currentTime);
  ok(Math.abs(tB - tA - 5) < 0.2, 'the right arrow moves five seconds', { tA, tB });
  const at3 = await ev(p, () => +document.querySelectorAll('#cd-film .cdf-chap')[2].getAttribute('data-at'));
  await p.click('#cd-film .cdf-chap >> nth=2'); await p.waitForTimeout(800);
  const t3 = await ev(p, () => document.querySelector('#cd-film video').currentTime);
  ok(t3 >= at3 - 0.2 && t3 < at3 + 2.5, 'a scene key jumps to its scene', { at3, t3 });
  await ev(p, () => document.querySelector('#cd-film video').pause());
  await p.click('#cd-film [data-rate="0.75"]'); await p.waitForTimeout(200);
  ok(await ev(p, () => document.querySelector('#cd-film video').playbackRate === 0.75 && state.cdFilm.speed === 0.75), 'the speed is chosen and remembered');
  await p.click('#cd-film [data-f="cc"]'); await p.waitForTimeout(200);
  ok(await ev(p, () => state.cdFilm.cc === false && getComputedStyle(document.querySelector('#cd-film .cdf-cc')).display === 'none'), 'captions off, remembered');
  await p.click('#cd-film [data-f="cc"]'); await p.waitForTimeout(200);
  await p.click('#cd-film .cdf-read summary'); await p.waitForTimeout(300);
  ok(await ev(p, () => document.querySelectorAll('#cd-film .cdf-read li').length >= 5), 'Read instead lists what the film shows');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  ok(await ev(p, () => !document.getElementById('cd-film')), 'Escape closes the film');
  await openFromGuide(p);
  ok(await ev(p, () => document.querySelector('#cd-film [data-rate="0.75"]').getAttribute('aria-pressed') === 'true' && document.querySelector('#cd-film video').playbackRate === 0.75), 'opened again, the speed is kept');
  await ev(p, () => window.cdFilm.close());
  await ev(p, () => { try { closeModal(); } catch (e) {} });

  // the tour still offers the film
  await ev(p, () => { try { demoStartTour(); } catch (e) {} }); await p.waitForTimeout(1500);
  const tk = await ev(p, () => !!document.querySelector('#demo-tour [data-cd-film]'));
  ok(tk, 'the tour\'s first chapter offers the film');
  if (tk) { await p.click('#demo-tour [data-cd-film]'); await p.waitForTimeout(900); ok(await ev(p, () => !!document.getElementById('cd-film') && !document.getElementById('demo-tour')), 'and opens it, the tour set aside'); await ev(p, () => window.cdFilm.close()); }
  try { await ev(p, () => { try { demoTourSoftClose(); } catch (e) {} try { demoRemove('demo-tour'); } catch (e) {} }); } catch (e) {}

  // Windows 10: the app shows its flat pictures on the keys (pass 1060); the film's keys show the very same
  const SAVED = await ev(p, () => { const o = {}; ['#sticky-fab>span', '#horo-fab>span:first-child', '#cd-theme-fab>span', '#cd-thought-fab .cd-thought-glyph', '#reminders-fab .rem-fab-bell', '#cd-quiet-fab .cd-quiet-glyph'].forEach(s => { const g = document.querySelector(s); if (g) o[s] = g.innerHTML; }); return o; });
  await ev(p, () => { document.documentElement.classList.add('cd-emoji-pics'); window.cdEmojiPics._.all(); });
  await p.waitForTimeout(300);
  await openFromGuide(p); await seek(p, 1);
  const w10 = await ev(p, () => {
    const SEL = { 'sticky-fab': '#sticky-fab>span', 'horo-fab': '#horo-fab>span:first-child', 'cd-theme-fab': '#cd-theme-fab>span', 'cd-thought-fab': '#cd-thought-fab .cd-thought-glyph', 'reminders-fab': '#reminders-fab .rem-fab-bell', 'cd-quiet-fab': '#cd-quiet-fab .cd-quiet-glyph' };
    return [...document.querySelectorAll('#cd-film .cdf-sk-key')].filter(el => getComputedStyle(el).display !== 'none').map(el => {
      const im = el.querySelector('img.cd-emo'), lv = document.querySelector(SEL[el.dataset.k] + ' img.cd-emo');
      const m = getComputedStyle(el).transform.match(/matrix\(([^,]+)/), sc = m ? +m[1] : 1;
      return { k: el.dataset.k, img: !!im, same: !!(im && lv && im.src === lv.src), w: im ? +im.getBoundingClientRect().width.toFixed(2) : 0, fs: +(parseFloat(getComputedStyle(el.firstChild).fontSize) * sc).toFixed(2) };
    });
  });
  ok(w10.length >= 5 && w10.every(x => x.img && x.same && Math.abs(x.w - x.fs) < 0.6), 'Windows 10: the film\'s keys are the app\'s own flat pictures, the very same as on its real keys', w10);
  if (OUT) { const st = await p.$('#cd-film .cdf-stage'); await st.screenshot({ path: path.join(OUT, 'film_win10_keys.png') }); }
  await ev(p, () => window.cdFilm.close());
  // back to this machine's own glyphs (pass 1060 only turns its pictures on once, on Windows 10)
  await ev(p, (o) => { document.documentElement.classList.remove('cd-emoji-pics'); for (const s in o) { const g = document.querySelector(s); if (g) { g.innerHTML = o[s]; g.__cdEmo = null; } } }, SAVED);

  // French, night
  await ev(p, () => { setLang('fr'); state.theme = 'night'; saveState(); applyTheme(); }); await p.waitForTimeout(900);
  await ev(p, () => window.cdFilm.open()); await p.waitForFunction(() => { const v = document.querySelector('#cd-film video'); return v && v.readyState >= 2; }, null, { timeout: 20000 });
  await seek(p, 1);
  const f3 = await ev(p, () => ({ h: document.querySelector('#cd-film .cdf-h').textContent, cc: document.querySelector('#cd-film .cdf-cc').textContent, play: document.querySelector('#cd-film [data-f="play"]').textContent, chap: document.querySelector('#cd-film .cdf-chap').textContent, bg: getComputedStyle(document.querySelector('#cd-film .cdf-panel')).backgroundColor }));
  ok(/en action/.test(f3.h) && /^Accueil : /.test(f3.cc) && /Lire/.test(f3.play) && /^Accueil/.test(f3.chap), 'in French, captions in French', f3);
  ok(f3.bg === 'rgb(31, 36, 43)', 'by night, the night player', f3.bg);
  const n3 = await ev(p, () => [...document.querySelectorAll('#cd-film .cdf-sk-key')].filter(el => getComputedStyle(el).display !== 'none').map(el => ({ k: el.dataset.k, text: el.firstChild.textContent, img: !!el.querySelector('img'), op: getComputedStyle(el).opacity })));
  ok(n3.length >= 5 && n3.every(x => !x.img && x.text && x.op === '1') && n3.some(x => x.k === 'cd-theme-fab' && x.text === '🌙'), 'by night the film still shows its daytime keys, the moon included, in this machine\'s glyphs', n3);
  if (OUT) await p.screenshot({ path: path.join(OUT, 'film_night_fr.png') });
  await ev(p, () => { window.cdFilm.close(); setLang('en'); state.theme = 'light'; saveState(); applyTheme(); });
  ok(errs.length === 0, 'no page errors (1280 px, ratio 2)', errs);
  await ctx.close();

  // a 1024-px window at a ratio of 1
  {
    const { ctx: c2, p: q, errs: e2 } = await boot(b, { width: 1024, height: 700 }, 1);
    await openFromGuide(q); await seek(q, 3);
    const s2 = await ev(q, () => { const st = document.querySelector('#cd-film .cdf-stage'), pn = document.querySelector('#cd-film .cdf-panel'), r = st.getBoundingClientRect(), pr = pn.getBoundingClientRect(), play = document.querySelector('#cd-film [data-f="play"]').getBoundingClientRect();
      return { w: r.width, h: r.height, inPanel: r.left >= pr.left && r.right <= pr.right, overflow: document.documentElement.scrollWidth > innerWidth, playSeen: play.bottom <= innerHeight, vw: innerWidth }; });
    const a2 = await ev(q, ALIGN);
    const m2 = Math.max(0, ...Object.values(a2.keys).filter(k => k.filmed).map(k => Math.max(Math.abs(k.dx), Math.abs(k.dy))));
    ok(s2.inPanel && !s2.overflow && s2.playSeen && s2.w > 400, 'a 1024-px window: the film fits its panel, Play in sight, no sideways scroll', s2);
    ok(m2 < 0.6 && a2.painted === a2.f, 'a 1024-px window: the keys still sit where the film says (largest offset ' + m2.toFixed(3) + ' px)', a2.scale);
    if (OUT) await q.screenshot({ path: path.join(OUT, 'film_1024.png') });
    ok(e2.length === 0, 'no page errors (1024 px)', e2);
    await c2.close();
  }

  // the check film: the drawn glyphs against the filmed glyphs, pixel by pixel (this machine's glyphs are the filmed ones)
  if (CHECK) {
    const { ctx: c3, p: q, errs: e3 } = await boot(b, { width: 1280, height: 900 }, 2);
    const mp4 = fs.readFileSync(path.join(CHECK, 'check.mp4')).toString('base64');
    const keys = JSON.parse(fs.readFileSync(path.join(CHECK, 'check_keys.json'), 'utf8'));
    await ev(q, ([m, k]) => { document.getElementById('cd-film-1080-data').textContent = m; Object.assign(window.cdFilm._keys, k); }, [mp4, keys]);
    await openFromGuide(q);
    const st = await q.$('#cd-film .cdf-stage');
    const res = [];
    const frames = [10, 38, 44, 70, 80, 100, 120];
    for (const f of frames) {
      await seek(q, (f + 0.5) / 30);
      await ev(q, () => { const st = document.querySelector('#cd-film .cdf-stage'); st.querySelector('.cdf-sk').style.visibility = 'hidden'; st.querySelector('.cdf-cc').style.visibility = 'hidden'; });
      const A = (await st.screenshot()).toString('base64');
      await ev(q, () => { const st = document.querySelector('#cd-film .cdf-stage'); st.querySelector('.cdf-sk').style.visibility = ''; st.querySelector('video').style.visibility = 'hidden'; st.style.background = '#f3efe6'; });
      const B = (await st.screenshot()).toString('base64');
      await ev(q, () => { const st = document.querySelector('#cd-film .cdf-stage'); st.querySelector('video').style.visibility = ''; st.style.background = ''; });
      if (OUT && f === 44) { fs.writeFileSync(path.join(OUT, 'check_filmed_f44.png'), Buffer.from(A, 'base64')); fs.writeFileSync(path.join(OUT, 'check_drawn_f44.png'), Buffer.from(B, 'base64')); }
      const r = await ev(q, async ([A, B]) => {
        const load = (b64) => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.src = 'data:image/png;base64,' + b64; });
        const [ia, ib] = await Promise.all([load(A), load(B)]);
        const px = (im) => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); return x.getImageData(0, 0, c.width, c.height); };
        const da = px(ia), db = px(ib), W = da.width, k = W / document.querySelector('#cd-film .cdf-stage').getBoundingClientRect().width;
        const K = window.cdFilm._keys, sk = document.querySelector('#cd-film .cdf-sk'), sr = document.querySelector('#cd-film .cdf-stage').getBoundingClientRect(), out = {};
        // how far the drawn glyph must move to lie best on the filmed one (device pixels, searched to 8 each way)
        const diff = (d, x0, y0, w, h) => {
          const at = (i, j) => { const o = ((y0 + j) * d.width + (x0 + i)) * 4; return [d.data[o], d.data[o + 1], d.data[o + 2]]; };
          const border = []; for (let i = 0; i < w; i++) { border.push(at(i, 0), at(i, h - 1)); } for (let j = 0; j < h; j++) { border.push(at(0, j), at(w - 1, j)); }
          const med = [0, 1, 2].map(c => border.map(p => p[c]).sort((a, b) => a - b)[border.length >> 1]);
          const m = new Float32Array(w * h); let n = 0;
          for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const p = at(i, j), v = Math.abs(p[0] - med[0]) + Math.abs(p[1] - med[1]) + Math.abs(p[2] - med[2]); m[j * w + i] = v; if (v > 60) n++; }
          return { m, n };
        };
        [...sk.querySelectorAll('.cdf-sk-key')].forEach(el => {
          if (getComputedStyle(el).display === 'none') return;
          const r = el.getBoundingClientRect(), pad = r.width * 0.55, R = 8;
          const x0 = Math.max(0, Math.round((r.left - sr.left - pad) * k)), y0 = Math.max(0, Math.round((r.top - sr.top - pad) * k));
          const w = Math.min(W - x0, Math.round((r.width + 2 * pad) * k)), h = Math.min(da.height - y0, Math.round((r.height + 2 * pad) * k));
          const a = diff(da, x0, y0, w, h), bb = diff(db, x0, y0, w, h);
          let best = null;
          for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
            let e = 0, c = 0;
            for (let j = R; j < h - R; j++) for (let i = R; i < w - R; i++) { const q = a.m[j * w + i] - bb.m[(j - dy) * w + (i - dx)]; e += q * q; c++; }
            e /= c; if (!best || e < best.e) best = { e, dx, dy };
          }
          let e0 = 0, c0 = 0; for (let j = R; j < h - R; j++) for (let i = R; i < w - R; i++) { const q = a.m[j * w + i] - bb.m[j * w + i]; e0 += q * q; c0++; }
          // dx, dy: where the drawn glyph is against the filmed one, in screen (CSS) pixels
          out[el.dataset.k] = { dx: -best.dx / k, dy: -best.dy / k, area: +(bb.n / Math.max(1, a.n)).toFixed(3), fit: +(1 - best.e / Math.max(1e-9, e0 + best.e)).toFixed(3) };
        });
        return out;
      }, [A, B]);
      res.push({ f, keys: r });
    }
    report.check = res;
    const all = res.flatMap(x => Object.entries(x.keys).map(([k, v]) => Object.assign({ f: x.f, k }, v)));
    const worstC = Math.max(...all.map(v => Math.max(Math.abs(v.dx), Math.abs(v.dy))));
    const meanDy = all.reduce((t, v) => t + v.dy, 0) / all.length, meanDx = all.reduce((t, v) => t + v.dx, 0) / all.length;
    const areas = all.map(v => v.area);
    ok(all.length >= 30 && worstC <= 1.5 && Math.min(...areas) > 0.8 && Math.max(...areas) < 1.25, 'the check film: each drawn glyph lies on the filmed one, still, ringing and turning (largest offset ' + worstC.toFixed(2) + ' screen px; on average ' + meanDx.toFixed(2) + ' across, ' + meanDy.toFixed(2) + ' down; size ' + Math.min(...areas).toFixed(2) + ' to ' + Math.max(...areas).toFixed(2) + ' of the filmed)', all.filter(v => Math.max(Math.abs(v.dx), Math.abs(v.dy)) > 0.5));
    ok(e3.length === 0, 'no page errors (check film)', e3);
    await c3.close();
  }

  if (OUT) fs.writeFileSync(path.join(OUT, 't_film_report.json'), JSON.stringify(report, null, 1));
  console.log(fails ? fails + ' FAILED' : 'all passed');
  await b.close();
  process.exit(fails ? 1 : 0);
})();
