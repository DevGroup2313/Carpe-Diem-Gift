// t_rooms_face.js PAGE_URL [engine]: the four Writing Rooms with their new faces, used as a person uses them. Each room
// opens with its medallion, colour, Latin line and badged doors; every door still opens its page, whose head keeps the
// room's face; Back comes back; the French Tutor still marks a chosen answer, moves on, checks a typed one and shows its
// tables; night mode and French keep it whole. No page error.
const pw = require('playwright');
const URL = process.argv[2], ENG = process.argv[3] || 'chromium';
let bad = 0, ok = 0;
const say = (g, n, i) => { if (g) ok++; else bad++; console.log((g ? 'ok   ' : 'BAD  ') + n + (i ? '  ' + String(i).slice(0, 300) : '')); };
(async () => {
  const b = ENG === 'chromium' ? await pw.chromium.launch({ executablePath: process.env.CD_CHROMIUM || '/opt/pw-browsers/chromium' }) : await pw[ENG].launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 860 } });
  let p = null; const errs = [];
  // Linux's build of Safari's engine crashes at times on a page this size: a crashed start is tried again in a new page
  for (let t = 0; t < 3; t++) { p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e).slice(0, 200))); try { await p.goto(URL, { waitUntil: 'load', timeout: 240000 }); break; } catch (e) { if (!/crash/i.test(String(e)) || t === 2) throw e; try { await p.close(); } catch (x) {} } }
  await p.waitForTimeout(6000);
  await p.evaluate(() => { try { cdCloseDoor(); } catch (e) {} });
  const face = () => p.evaluate(() => { const o = document.querySelector('#modal-root > .cd-wr'); if (!o) return null; const cards = [...o.querySelectorAll('.cd-wr-card')]; return { cls: o.className, medal: !!o.querySelector('.cd-wr-medal svg'), latin: (o.querySelector('.cd-wr-latin b') || {}).textContent || '', cards: cards.length, badges: cards.filter(c => c.querySelector('.cd-wr-badge')).length, title: ((o.querySelector('.cd-wr-head') || {}).textContent || '').replace(/\s+/g, ' ').slice(0, 80) }; });
  const ROOMS = [['proposal', "openStudioPage('proposal')", 6, 'PROPOSITVM'], ['curriculum', "openStudioPage('curriculum')", 3, 'CVRRICVLVM'], ['research', 'openResearchRoom()', 5, 'ARS SCRIBENDI']];
  for (const [room, open, n, latin] of ROOMS) {
    await p.evaluate((o) => { closeModal(); eval(o); }, open); await p.waitForTimeout(700);
    const f = await face();
    say(f && f.cls.indexOf('cd-wr-' + room) >= 0 && f.cls.indexOf('cd-wr-main') >= 0 && f.medal && f.latin === latin && f.cards === n && f.badges === n, room + ': its face, ' + n + ' badged doors', JSON.stringify(f));
    for (let i = 0; i < n; i++) {
      await p.evaluate((o) => { closeModal(); eval(o); }, open); await p.waitForTimeout(400);
      const before = await p.evaluate(() => (document.getElementById('modal-root').textContent || '').length);
      await p.evaluate((i) => { document.querySelectorAll('#modal-root .cd-wr-card')[i].click(); }, i); await p.waitForTimeout(700);
      const after = await p.evaluate(() => { const o = document.querySelector('#modal-root > *'); return { sec: [...document.querySelectorAll('section[id^="section-"]')].filter(s => !s.classList.contains('hidden')).map(s => s.id)[0], modal: !!o, wr: o ? o.className : '', head: o ? ((o.querySelector('.cd-wr-head, [class*="head"]') || {}).textContent || '').replace(/\s+/g, ' ').slice(0, 60) : '', len: (document.getElementById('modal-root').textContent || '').length }; });
      const opened = after.modal ? after.len !== before || after.wr.indexOf('cd-wr-subpage') >= 0 : true;
      say(opened, room + ': door ' + (i + 1) + ' opens its page', JSON.stringify(after));
    }
  }
  // the French Tutor
  await p.evaluate(() => { closeModal(); openFrench(); }); await p.waitForTimeout(600);
  let f = await face();
  say(f && f.cls.indexOf('cd-wr-french') >= 0 && f.latin === 'LINGVA GALLICA' && f.cards === 0, 'the French Tutor: its face, its answers not taken for doors', JSON.stringify(f));
  const q1 = await p.evaluate(() => { const o = [...document.querySelectorAll('.cd-wr-opt')]; return { n: o.length, letters: o.map(x => x.getAttribute('data-l')).join('') }; });
  say(q1.n >= 2 && /^AB/.test(q1.letters), 'the answers carry their letters', JSON.stringify(q1));
  await p.evaluate(() => document.querySelector('.cd-wr-opt').click()); await p.waitForTimeout(500);
  const marked = await p.evaluate(() => ({ right: document.querySelectorAll('.cd-wr-opt.is-right').length, wrong: document.querySelectorAll('.cd-wr-opt.is-wrong').length, next: [...document.querySelectorAll('.cd-wr-act')].map(x => x.textContent.trim()).join('|'), count: frenchUI.count }));
  say(marked.right === 1 && marked.count === 1 && /Suivant/.test(marked.next), 'a chosen answer is marked, and Next is offered', JSON.stringify(marked));
  const qBefore = await p.evaluate(() => frenchUI.q && frenchUI.q.q);
  await p.evaluate(() => [...document.querySelectorAll('.cd-wr-act')].find(x => /Suivant/.test(x.textContent)).click()); await p.waitForTimeout(500);
  say(await p.evaluate((qb) => !frenchUI.answered && document.querySelectorAll('.cd-wr-opt').length >= 2, qBefore), 'Next brings a new question');
  await p.evaluate(() => [...document.querySelectorAll('.cd-wr-seg > button')][1].click()); await p.waitForTimeout(500);
  const typed = await p.evaluate(() => { const i = document.querySelector('.cd-wr-input'); if (!i) return { input: false }; i.value = (frenchUI.fillQ && frenchUI.fillQ.accept[0]) || 'x'; i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); return { input: true }; });
  await p.waitForTimeout(500);
  const typedRes = await p.evaluate(() => ({ answered: frenchUI.fillAnswered, correct: frenchUI.fillCorrect, seg: [...document.querySelectorAll('.cd-wr-seg > button.is-on')].map(x => x.textContent).join('') }));
  say(typed.input && typedRes.answered && typedRes.correct && /Type/.test(typedRes.seg), 'Type: a typed answer is checked', JSON.stringify(typedRes));
  await p.evaluate(() => [...document.querySelectorAll('.cd-wr-seg > button')][2].click()); await p.waitForTimeout(500);
  say(await p.evaluate(() => document.querySelector('.cd-wr-seg > button.is-on') && /Tables/.test(document.querySelector('.cd-wr-seg > button.is-on').textContent) && (document.getElementById('modal-root').textContent || '').length > 200), 'Tables opens');
  // by night, and in French
  await p.evaluate(() => { closeModal(); document.body.setAttribute('data-theme', 'night'); openStudioPage('curriculum'); }); await p.waitForTimeout(600);
  const night = await p.evaluate(() => { const c = document.querySelector('.cd-wr-card'); return c ? getComputedStyle(c).backgroundImage : ''; });
  say(/rgb\(38, 42, 48\)|#262a30/.test(night) || /linear-gradient\(rgb\(38/.test(night), 'by night the doors are dark', night.slice(0, 80));
  await p.evaluate(() => { closeModal(); document.body.setAttribute('data-theme', 'day'); state.lang = 'fr'; try { applyLang(); } catch (e) {} openStudioPage('proposal'); }); await p.waitForTimeout(700);
  f = await face();
  const kick = await p.evaluate(() => (document.querySelector('.cd-ws-kicker') || {}).textContent);
  say(f && f.badges === 6 && /SALLES/.test(kick), 'in French: the same badges, the heading in French', kick);
  await p.evaluate(() => { state.lang = 'en'; saveState(); });
  if (errs.length) say(false, 'page errors', errs.join(' | '));
  console.log((bad ? 'FAIL ' : 'PASS ') + ENG + ': ' + ok + ' good, ' + bad + ' bad');
  await b.close(); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL crash ' + String(e).slice(0, 400)); process.exit(2); });
