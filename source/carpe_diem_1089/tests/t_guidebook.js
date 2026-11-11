// t_guidebook.js PAGE_URL [chromium|webkit|firefox]: build 1089, the Guidebook in sections and the short tour.
// Copyright (c) 2026 Yannie D. Forest. All rights reserved.
const pw = require('playwright');
const URL = process.argv[2], ENGINE = process.argv[3] || 'chromium';
const SECTIONS_EN = ['Your day', 'Focus and small tools', 'Reading and study', 'Tutors and practice', 'Your projects', 'The five studios', 'Around the desk', 'Your copy of Carpe Diem', 'For the author'];
const SECTIONS_FR = ['Votre journée', 'Concentration et petits outils', 'Lire et étudier', 'Tuteurs et exercices', 'Vos projets', 'Les cinq ateliers', 'Autour du bureau', 'Votre exemplaire de Carpe Diem', 'Pour l’autrice'];
let good = 0, bad = 0;
function check(ok, what, info) { if (ok) good++; else bad++; console.log((ok ? 'ok   ' : 'BAD  ') + what + (info !== undefined ? '  ' + JSON.stringify(info).slice(0, 300) : '')); }

async function open(p, lang, tab) {
  await p.evaluate(([L, t]) => { try { closeModal(); } catch (e) {} try { setLang(L); } catch (e) {} openGuidebook(t); }, [lang, tab || 'nav']);
  await p.waitForTimeout(1200);
}
function chapterText(p, title) {
  return p.evaluate((t) => {
    var out = null;
    document.querySelectorAll('.cd-guide-modal [data-cd-gbchap]').forEach(function (c) {
      var b = c.querySelector(':scope > button');
      if (b && b.textContent.indexOf(t) >= 0) out = (c.textContent || '').replace(/\s+/g, ' ');
    });
    return out;
  }, title);
}

(async () => {
  const b = await pw[ENGINE].launch(ENGINE === 'chromium' ? { executablePath: '/opt/pw-browsers/chromium' } : {});
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  p.on('dialog', d => d.dismiss().catch(() => {}));
  await p.goto(URL, { waitUntil: 'load', timeout: 300000 }); await p.waitForTimeout(6000);
  await p.evaluate(() => { try { cdCloseDoor(); } catch (e) {} });

  // ---- the Guidebook, in English ----
  await open(p, 'en');
  const g = await p.evaluate(() => {
    var m = document.querySelector('.cd-guide-modal'), body = m.children[1];
    return {
      secs: [].map.call(body.querySelectorAll('.gb89-sec-name'), function (x) { return x.textContent; }),
      firsts: [].map.call(body.querySelectorAll('.gb89-sec'), function (s) { var b = s.querySelector('[data-cd-gbchap] > button'); return b ? b.textContent.replace(/▾\s*$/, '').replace(/^\S+\s+/, '').trim() : null; }),
      aside: body.getAttribute('data-gb89'),
      titles: [].map.call(body.querySelectorAll('[data-cd-gbchap] > button'), function (b) { return b.textContent.replace(/▾\s*$/, '').trim(); }),
      chips: body.querySelectorAll('.gb89-chip').length,
      line: (body.querySelector('.gb89-tl-text') || {}).textContent || ''
    };
  });
  check(JSON.stringify(g.secs) === JSON.stringify(SECTIONS_EN), 'nine sections, in order', g.secs);
  check(JSON.stringify(g.firsts) === JSON.stringify(['Home', 'Focus, the supports', 'Curriculum', 'Magister', 'Candidatus', 'Tabula, the writing room', 'The top bar', 'Install on your devices', 'Installers and files']), 'each section begins with the right chapter', g.firsts);
  check(g.aside === '2' && !g.titles.some(t => /The Quiet Index|One light for every room/.test(t)), 'the two notes on the look of the page are set aside', { aside: g.aside });
  check(g.titles.length === 40 && g.chips === 9, 'forty chapters (41, two set aside, the Focus chapter added), nine contents keys', { n: g.titles.length, chips: g.chips });
  check(/short one: about .+ The full tour, every card, takes about .+\./.test(g.line), 'the tour line says how long each tour takes', g.line);
  const focus = await chapterText(p, 'Focus, the supports');
  check(!!focus && /Smaller steps/.test(focus) && /The Inbox/.test(focus) && /Low-energy days/.test(focus) && !/ringed here/.test(focus), 'the Focus chapter, from the tour\'s own Focus cards', (focus || '').slice(0, 160));

  // search
  await p.fill('.gb89-find input', 'clepsydra'); await p.waitForTimeout(300);
  const s1 = await p.evaluate(() => { var vis = [].filter.call(document.querySelectorAll('.gb89-sec-list > [data-cd-gbchap]'), function (c) { return c.style.display !== 'none'; }); return { n: vis.length, all: vis.every(function (c) { return /clepsydra/i.test(c.textContent); }), count: document.querySelector('.gb89-count').textContent }; });
  check(s1.n > 0 && s1.all && /chapter/.test(s1.count), 'the search finds the chapters that hold a word', s1);
  await p.fill('.gb89-find input', 'qqqzzzx'); await p.waitForTimeout(300);
  const s2 = await p.evaluate(() => document.querySelector('.gb89-count').textContent);
  check(s2 === 'No chapter has these words.', 'and says so when none does', s2);
  await p.fill('.gb89-find input', ''); await p.waitForTimeout(300);
  const s3 = await p.evaluate(() => [].filter.call(document.querySelectorAll('.gb89-sec-list > [data-cd-gbchap]'), function (c) { return c.style.display !== 'none'; }).length);
  check(s3 === 40, 'an empty search shows every chapter again', s3);

  // a contents key
  await p.click('.gb89-chip[data-go="studios"]'); await p.waitForTimeout(1200);
  const jump = await p.evaluate(() => { var body = document.querySelector('.cd-guide-modal').children[1], sec = body.querySelector('.gb89-sec[data-sec="studios"]'); return Math.round(sec.getBoundingClientRect().top - body.getBoundingClientRect().top); });
  check(jump >= -4 && jump < 60, 'a contents key brings its section to the top', jump);

  // the corrected chapters
  const T = {};
  for (const t of ['Installers and files', 'The morning door', 'The sky, and setting the day', 'The top bar', 'Imago, the slides', 'Fontes, citations', 'Tabula, the writing room', 'Your signature', 'Resetting the app']) T[t] = await chapterText(p, t) || '';
  check(/the iPhone and iPad, the Mac, the Mac mini, Windows and the Fire tablet/.test(T['Installers and files']) && /What is built elsewhere/.test(T['Installers and files']) && !/five makers|Silk route/.test(T['Installers and files']), 'Installers: the seven things it makes; what is built elsewhere');
  check(/Today feels/.test(T['The morning door']) && /Rainy, Stormy, Hot or Night/.test(T['The morning door']) && !/One tap cycles/.test(T['The morning door']), 'The morning door: the sky is chosen on the door');
  check(/Display, then Sky, opens a small page/.test(T['The sky, and setting the day']), 'The sky: set from Display');
  check(/Display/.test(T['The top bar']) && /Guide and About/.test(T['The top bar']) && !/Light or darkSwitches/.test(T['The top bar']) && !/Classic or FolioChanges/.test(T['The top bar']), 'The top bar: Status, Alerts, Display, Guide and About, the language');
  check(/The ribbon carries nine tabs, from Home to View/.test(T['Imago, the slides']) && !/Home, Insert, Design and Slides/.test(T['Imago, the slides']) && !/now follows/.test(T['Imago, the slides']), 'Imago: nine tabs');
  check(!/Tabula too/.test(T['Fontes, citations']) && /lives inside Tabula\./.test(T['Fontes, citations']), 'Fontes: one word too many, gone');
  check(/thirteen house scripts/.test(T['Tabula, the writing room']) && !/—/.test(T['Tabula, the writing room']), 'Tabula: thirteen house scripts, no dashes');
  check(/In the Forge, drawn stroke by stroke/.test(T['Your signature']) && /look at the seven hands/.test(T['Your signature']) && !/On a slower device/.test(T['Your signature']), 'Your signature: seven hands in the Forge, thirteen scripts in the panel');
  check(/On a slower device/.test(T['Resetting the app']), 'Resetting the app: the note on slower devices');

  await open(p, 'en', 'lang');
  const lang = await p.evaluate(() => (document.querySelector('.cd-guide-modal').textContent || '').indexOf('Every word Carpe Diem uses') >= 0);
  check(lang, 'the Language page is as it was');

  // ---- the Guidebook, in French ----
  await open(p, 'fr');
  const gf = await p.evaluate(() => [].map.call(document.querySelectorAll('.gb89-sec-name'), function (x) { return x.textContent; }));
  check(JSON.stringify(gf) === JSON.stringify(SECTIONS_FR), 'in French: the sections', gf);
  const authorFr = await p.evaluate(() => { var s = document.querySelector('.gb89-sec[data-sec="author"]'); return s ? [].map.call(s.querySelectorAll('[data-cd-gbchap] > button'), function (b) { return b.textContent.replace(/▾\s*$/, '').trim(); }) : []; });
  check(authorFr.length === 3 && authorFr.some(t => /Modifier l’app de l’intérieur/.test(t)), 'in French: the Surfaces chapter is there, in French (1088 lost it when the language changed)', authorFr);
  const nFr = await p.evaluate(() => document.querySelectorAll('.gb89-sec-list > [data-cd-gbchap]').length);
  check(nFr === 40, 'in French: the same forty chapters', nFr);
  const F = {};
  for (const t of ['Installateurs et fichiers', 'La porte du matin', 'Le ciel, et le réglage du jour', 'Imago', 'Tabula', 'Votre signature', 'Recharger', 'Concentration, les aides']) F[t] = await chapterText(p, t) || '';
  const top = await p.evaluate(() => { var o = ''; document.querySelectorAll('.cd-guide-modal [data-cd-gbchap]').forEach(function (c) { var t = c.textContent || ''; if (/Guide et À propos/.test(t)) o = t; }); return o; });
  check(/l’iPhone et l’iPad, le Mac, le Mac mini, Windows et la tablette Fire/.test(F['Installateurs et fichiers']) && /Ce qui se construit ailleurs/.test(F['Installateurs et fichiers']), 'in French: Installers');
  check(/Aujourd’hui, le ciel est/.test(F['La porte du matin']) && /Affichage, puis Ciel, ouvre/.test(F['Le ciel, et le réglage du jour']), 'in French: the door and the sky');
  check(/neuf onglets, d’Accueil à Affichage/.test(F['Imago']) && /treize écritures de la maison/.test(F['Tabula']), 'in French: Imago and Tabula');
  check(/Dans la Forge, tracées trait par trait/.test(F['Votre signature']) && /regardez les sept écritures/.test(F['Votre signature']) && /Sur un appareil plus lent/.test(F['Recharger']), 'in French: the signature and the slower device');
  check(/Affichage/.test(top) && !!F['Concentration, les aides'], 'in French: the top bar and the Focus chapter');
  const english = await p.evaluate(() => {
    var EN = /\b(the|and|your|you|with|for|this|that|are|from|when|here|have|will|can|not|what|each|its|their|was|has|into|then|than|every|all|one|more|how|about|only|any|which|them|it|is|of|to|in|on|a|an|by|as|at|or|be)\b/gi;
    var FR = /[éèêëàâîïôùûçœ]|\b(le|la|les|des|et|vous|votre|vos|pour|avec|dans|est|une|un|sur|que|qui|du|au|aux|ce|cette|ces|ne|pas|plus|par|sont|se|son|sa|ses|leur|ou|où|en|il|elle|nous|tout|tous|chaque|ici|puis|comme|sans|entre|depuis)\b/gi;
    var out = [], w = document.createTreeWalker(document.querySelector('.cd-guide-modal'), NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) { var t = (n.nodeValue || '').replace(/\s+/g, ' ').trim(); if (t.length < 12) continue; var words = t.split(' ').length; if (words < 3) continue; var en = (t.match(EN) || []).length, fr = (t.match(FR) || []).length; if (en >= 2 && en > fr * 1.5 && en / words > 0.22) out.push(t.slice(0, 120)); }
    return out;
  });
  check(english.length === 0, 'in French: no English left in the Guidebook', english.slice(0, 4));
  const fl = await p.evaluate(() => [(document.querySelector('.gb89-find input') || {}).placeholder, (document.querySelector('.gb89-tl-text') || {}).textContent]);
  check(/Trouver un chapitre/.test(fl[0]) && /La visite guidée, ci-dessus, est la courte/.test(fl[1]), 'in French: the search and the tour line', fl);

  // ---- the tour, short ----
  await p.evaluate(() => { try { closeModal(); } catch (e) {} setLang('en'); });
  const expect = await p.evaluate(() => { demoStartTour(); var n = 0; for (var i = 0; i < DEMO_TOUR.length; i++) if (!demoTourSkipped(i)) n++; return { n: n, all: DEMO_TOUR.length }; });
  await p.waitForTimeout(1500);
  const seen = [], offscreen = [];
  for (let k = 0; k < 160; k++) {
    const st = await p.evaluate(() => { var t = document.getElementById('demo-tour'); if (!t) return null; var lines = (t.innerText || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); var i = lines.indexOf('Chapters ▾'); var next = [].filter.call(t.querySelectorAll('button'), function (b) { return /^(Next|Continue|Finish|Done)/.test((b.textContent || '').trim()); })[0]; return { title: i >= 0 ? lines[i + 1] : lines[1], done: /COMPLETE/i.test(lines[0] || ''), body: (t.innerText || '').slice(0, 900), next: next ? next.textContent.trim() : null }; });
    if (!st) break;
    if (!st.done) seen.push(st.title);
    if (k === 0) check(/This short tour takes about .+ \(the full one, every card, takes about .+ and starts from the Guidebook\)/.test(st.body), 'the short tour says how long it and the full one take', st.body.slice(0, 120));
    if (!st.next) break;
    const at = await p.evaluate((label) => {
      var bt = [].filter.call(document.querySelectorAll('#demo-tour button'), function (b) { return (b.textContent || '').trim() === label; })[0];
      if (!bt) return null;
      var r = bt.getBoundingClientRect(), off = r.bottom > window.innerHeight || r.top < 0 || r.right > window.innerWidth || r.left < 0;
      bt.click();
      return off ? { top: Math.round(r.top), bottom: Math.round(r.bottom), h: window.innerHeight } : null;
    }, st.next);
    if (at) offscreen.push({ card: st.title, at: at });
    await p.waitForTimeout(ENGINE === 'chromium' ? 650 : 900);
  }
  const SKIPPED = ['Focus length', 'Chime', 'The Clepsydra button', 'A Deep Work Day', 'Your Day, returned', 'Font and alignment', 'The Quiet Index', 'Build your own installers', 'The seal at the top'];
  const leaked = seen.filter(t => SKIPPED.some(s => (t || '').indexOf(s) >= 0));
  check(seen.length === expect.n && expect.n === 71, 'the short tour stops at 71 cards of ' + expect.all, { walked: seen.length, expected: expect.n });
  check(leaked.length === 0, 'no card left to the full tour is shown', leaked);
  check(offscreen.length === 0, 'every card keeps its keys on the screen (1280 by 900)', offscreen.slice(0, 6));
  await p.evaluate(() => { try { demoTourEnd(); } catch (e) {} });

  // ---- the tour, full ----
  const fullN = await p.evaluate(() => { cdStartFullTour(); var n = 0; for (var i = 0; i < DEMO_TOUR.length; i++) if (!demoTourSkipped(i)) n++; return n; });
  await p.waitForTimeout(1200);
  const fw = await p.evaluate(() => (document.getElementById('demo-tour') || {}).innerText || '');
  check(fullN > 150 && /This full tour takes about/.test(fw), 'the full tour keeps every card and says so', { n: fullN });
  await p.evaluate(() => { try { demoTourEnd(); } catch (e) {} });
  const again = await p.evaluate(() => { demoStartTour(); var n = 0; for (var i = 0; i < DEMO_TOUR.length; i++) if (!demoTourSkipped(i)) n++; try { demoTourEnd(); } catch (e) {} return n; });
  check(again === 71, 'the next tour is the short one again', again);

  check(errs.length === 0, 'no faults on the page', errs.slice(0, 3));
  console.log((bad ? 'FAIL ' : 'PASS ') + ENGINE + ': ' + good + ' good, ' + bad + ' bad');
  await b.close();
  process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL ' + ENGINE + ': ' + e); process.exit(2); });
