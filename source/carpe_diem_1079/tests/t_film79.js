// t_film79.js URL [OUT]: the Guidebook's film used as a person uses it. The Guidebook carries one entry to the film, its
// card at the top; the film opens without playing, captions showing, in the reader's language; Play
// plays and pauses; a scene key jumps to its scene; the speed is chosen and remembered; captions off and on, remembered;
// Read instead lists the scenes; Escape closes. The tour's first chapter offers the film. French; a night picture. Exit
// code 1 on any failure or page error.
const { chromium } = require('playwright');
const [URL_, OUT] = process.argv.slice(2);
let fails = 0;
function ok(c, what, extra) { console.log((c ? 'ok   ' : 'FAIL ') + what + (extra !== undefined ? '  ' + JSON.stringify(extra).slice(0, 300) : '')); if (!c) fails++; }
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('page: ' + e.message.slice(0, 240)));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/sw\.js|favicon|Failed to load resource|bad HTTP response/.test(t)) errs.push('console: ' + t.slice(0, 240)); });
  const ev = (f, a) => p.evaluate(f, a);
  const wait = (ms) => p.waitForTimeout(ms);
  await p.goto(URL_, { waitUntil: 'load', timeout: 180000 });
  await wait(4000);
  await ev(() => { try { if (typeof cdCloseDoor === 'function') cdCloseDoor(); } catch (e) {} try { if (typeof demoRemove === 'function') { demoRemove('demo-entry'); demoRemove('demo-build'); } } catch (e) {} state.themeAuto = false; state.theme = 'light'; delete state.cdFilm; saveState(); applyTheme(); if (state.lang !== 'en') setLang('en'); });
  ok(await ev(() => typeof window.__cdFilmB64 === 'string' && window.__cdFilmB64.length > 100000), 'the film is in the page');

  await ev(() => openGuidebook()); await wait(900);
  const g = await ev(() => ({ card: document.querySelectorAll('#modal-root .cdf-gbcard').length, entries: document.querySelectorAll('#modal-root [data-cd-film]').length, tour: !!document.querySelector('#modal-root .cd-gb-tourkey') }));
  ok(g.card === 1 && g.entries === 1 && g.tour, 'the Guidebook: one entry to the film, its card at the top; the guided tour\'s key as before', g);
  if (OUT) await p.screenshot({ path: OUT + '/film_guidebook.png' });
  await p.click('#modal-root .cdf-gbcard .cdf-key'); await wait(1500);
  const f1 = await ev(() => { const v = document.querySelector('#cd-film video'); return { open: !!v, paused: v && v.paused, dur: v && v.duration, cc: v && [...v.textTracks].filter(t => t.mode === 'showing').map(t => t.language), scenes: document.querySelectorAll('#cd-film .cdf-chap').length, focus: document.activeElement && document.activeElement.getAttribute('data-f') }; });
  ok(f1.open && f1.paused && f1.dur > 20 && f1.cc.join() === 'en' && f1.scenes >= 5 && f1.focus === 'play', 'the film opens still, captions on in English, a key for each scene, Play at hand', f1);
  if (OUT) await p.screenshot({ path: OUT + '/film_open.png' });
  await p.click('#cd-film [data-f="play"]'); await wait(1500);
  ok(await ev(() => !document.querySelector('#cd-film video').paused && document.querySelector('#cd-film video').currentTime > 0.5), 'Play plays');
  await p.keyboard.press('Space'); await wait(300);
  ok(await ev(() => document.querySelector('#cd-film video').paused), 'Space pauses');
  const at3 = await ev(() => +document.querySelectorAll('#cd-film .cdf-chap')[2].getAttribute('data-at'));
  await p.click('#cd-film .cdf-chap >> nth=2'); await wait(800);
  const t3 = await ev(() => document.querySelector('#cd-film video').currentTime);
  ok(t3 >= at3 - 0.2 && t3 < at3 + 2.5, 'a scene key jumps to its scene', { at3, t3 });
  await ev(() => document.querySelector('#cd-film video').pause());
  await p.click('#cd-film [data-rate="0.75"]'); await wait(200);
  ok(await ev(() => document.querySelector('#cd-film video').playbackRate === 0.75 && state.cdFilm.speed === 0.75), 'the speed is chosen and remembered');
  await p.click('#cd-film [data-f="cc"]'); await wait(200);
  ok(await ev(() => state.cdFilm.cc === false && [...document.querySelector('#cd-film video').textTracks].every(t => t.mode !== 'showing')), 'captions off, remembered');
  await p.click('#cd-film [data-f="cc"]'); await wait(200);
  await p.click('#cd-film .cdf-read summary'); await wait(300);
  ok(await ev(() => document.querySelectorAll('#cd-film .cdf-read li').length >= 5), 'Read instead lists what the film shows');
  await p.keyboard.press('Escape'); await wait(300);
  ok(await ev(() => !document.getElementById('cd-film')), 'Escape closes the film');
  await ev(() => { try { closeModal(); } catch (e) {} }); await wait(300);
  await ev(() => openGuidebook()); await wait(600);
  await p.click('#modal-root .cdf-gbcard .cdf-key'); await wait(900);
  const f2 = await ev(() => { const v = document.querySelector('#cd-film video'); return { rate: v.playbackRate, pressed: document.querySelector('#cd-film [data-rate="0.75"]').getAttribute('aria-pressed') }; });
  ok(f2.pressed === 'true', 'opened again, the speed is kept', f2);
  await ev(() => window.cdFilm.close()); await wait(200);
  await ev(() => { try { closeModal(); } catch (e) {} });

  // the tour
  await ev(() => { try { demoStartTour(); } catch (e) {} }); await wait(1500);
  const tk = await ev(() => !!document.querySelector('#demo-tour [data-cd-film]'));
  ok(tk, 'the tour\'s first chapter offers the film');
  if (tk) { await p.click('#demo-tour [data-cd-film]'); await wait(900); ok(await ev(() => !!document.getElementById('cd-film') && !document.getElementById('demo-tour')), 'and opens it, the tour set aside'); await ev(() => window.cdFilm.close()); }
  try { await ev(() => { try { demoTourSoftClose(); } catch (e) {} try { demoRemove('demo-tour'); } catch (e) {} }); } catch (e) {}

  // French, night
  await ev(() => { setLang('fr'); state.theme = 'night'; saveState(); applyTheme(); }); await wait(900);
  await ev(() => window.cdFilm.open()); await wait(1200);
  const f3 = await ev(() => ({ h: document.querySelector('#cd-film .cdf-h').textContent, cc: [...document.querySelector('#cd-film video').textTracks].filter(t => t.mode === 'showing').map(t => t.language) }));
  ok(/en action/.test(f3.h) && f3.cc.join() === 'fr', 'in French, captions in French', f3);
  if (OUT) await p.screenshot({ path: OUT + '/film_night_fr.png' });
  await ev(() => { window.cdFilm.close(); setLang('en'); state.theme = 'light'; saveState(); applyTheme(); });

  ok(errs.length === 0, 'no page errors', errs);
  console.log(fails ? fails + ' FAILED' : 'all passed');
  await b.close();
  process.exit(fails ? 1 : 0);
})();
