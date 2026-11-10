// t_fr_rooms.js PAGE_URL [engines]: the five rooms in French. Every word this build translates must show its French
// and never its English; in English nothing of the French may show; and the Guidebook, which was found whole in
// French, must stay whole. Reads the very words the build uses (tests/fr_words.json).
const pw = require('playwright'), fs = require('fs'), path = require('path');
const URL = process.argv[2], ENG = (process.argv[3] || 'chromium,webkit,firefox').split(',');
const WORDS = JSON.parse(fs.readFileSync(path.join(__dirname, 'fr_words.json'), 'utf8'));
const ROOM = { tabula: 'TABULA_SRC', abacus: 'ABACUS_SRC', slides: 'SLIDES_SRC', scriba: 'SCRIBA_SRC', fontes: 'FONTES_SRC' };
async function launch(n) { return n === 'chromium' ? pw.chromium.launch(process.env.CD_CHROMIUM ? { executablePath: process.env.CD_CHROMIUM } : {}) : pw[n].launch(); }
// every bit of text the person can see, and the title/placeholder/aria-label of what is on the screen
const SEEN = () => {
  var out = [];
  function vis(e) { try { var r = e.getBoundingClientRect(); if (!r.width || !r.height) return false; var cs = getComputedStyle(e); return cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.02; } catch (x) { return false; } }
  var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null), n;
  while ((n = w.nextNode())) { var p = n.parentElement; if (!p || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.tagName)) continue;
    if (p.closest('[contenteditable="true"],#editor')) continue;
    if (p.tagName !== 'OPTION' && !vis(p)) continue;
    out.push((n.nodeValue || '').replace(/\s+/g, ' ').trim()); }
  ['title', 'placeholder', 'aria-label'].forEach(function (a) { [].forEach.call(document.querySelectorAll('[' + a + ']'), function (e) { out.push((e.getAttribute(a) || '').replace(/\s+/g, ' ').trim()); }); });
  return out;
};
function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }
(async () => {
  let bad = 0;
  for (const e of ENG) {
    const b = await launch(e);
    try {
      const p = await (await b.newContext({ viewport: { width: 1500, height: 1000 } })).newPage(); const errs = [];
      p.on('pageerror', x => errs.push(String(x.message).slice(0, 140)));
      await p.goto(URL, { waitUntil: 'load', timeout: 240000 }); await p.waitForTimeout(5000);
      await p.evaluate(() => { try { cdCloseDoor(); } catch (x) {} try { var d = document.getElementById('demo-entry'); if (d) d.remove(); } catch (x) {} });
      for (const lang of ['fr', 'en']) {
        await p.evaluate((l) => setLang(l), lang); await p.waitForTimeout(1500);
        for (const room of Object.keys(ROOM)) {
          await p.evaluate((r) => { ['tabula','abacus','slides','scriba','fontes'].forEach(function (x) { try { closeExt(x); } catch (y) {} }); try { openExt(r); } catch (y) {} }, room);
          await p.waitForTimeout(3500);
          const h = await p.$('#frame-' + room); const f = h && await h.contentFrame();
          if (!f) { console.log('BAD ' + e + ' ' + lang + ' ' + room + ': no frame'); bad++; continue; }
          let seen = await f.evaluate(SEEN);
          const tabs = await f.evaluate(() => { var q = [].filter.call(document.querySelectorAll('[role="tab"],.ribtab,.tab,.tabs button,#scribaTabs button'), function (x) { return x.getBoundingClientRect().width > 0; }); q.forEach(function (x, i) { x.setAttribute('data-ft', i); }); return q.length; });
          for (let i = 0; i < tabs; i++) { await f.evaluate((i) => { var x = document.querySelector('[data-ft="' + i + '"]'); if (x) x.click(); }, i); await p.waitForTimeout(350); seen = seen.concat(await f.evaluate(SEEN)); }
          const set = new Set(seen.map(norm));
          const dict = WORDS[ROOM[room]];
          let wrong = [];
          if (lang === 'fr') { for (const k of Object.keys(dict)) if (set.has(norm(k))) wrong.push('EN shown: ' + k); }
          else { for (const k of Object.keys(dict)) if (set.has(norm(dict[k]))) wrong.push('FR shown: ' + dict[k]); }
          if (wrong.length) bad++;
          console.log((wrong.length ? 'BAD ' : 'ok  ') + e.padEnd(8) + lang + ' ' + room.padEnd(7) + ' words ' + Object.keys(dict).length + ', seen ' + set.size + (wrong.length ? ' | ' + wrong.slice(0, 6).join(' ; ') : ''));
        }
      }
      // the Guidebook in French: every chapter opened, nothing English
      await p.evaluate(() => { ['tabula','abacus','slides','scriba','fontes'].forEach(function (x) { try { closeExt(x); } catch (y) {} }); setLang('fr'); }); await p.waitForTimeout(1200);
      await p.evaluate(() => { openGuidebook(); }); await p.waitForTimeout(2000);
      const g = await p.evaluate(() => { var m = document.querySelector('.cd-guide-modal'); if (!m) return null;
        [].forEach.call(m.querySelectorAll('button'), function (x) { if (/▾\s*$/.test(x.textContent || '')) { try { x.click(); } catch (e) {} } });
        var EN = /\b(the|and|your|you|with|for|this|that|are|from|when|here|have|will|can|what|each|their|every|about|which)\b/gi;
        var FR = /[éèêëàâîïôùûç]|\b(le|la|les|des|et|vous|votre|pour|avec|dans|est|une|un|sur|que|qui|du|au|ce|cette|ne|pas|plus|par|sont|se|son|sa|leur|ou|en|il|elle|nous|tout|chaque|ici)\b/gi;
        var bad = [], total = 0, w = document.createTreeWalker(m, NodeFilter.SHOW_TEXT, null), n;
        while ((n = w.nextNode())) { var t = (n.nodeValue || '').replace(/\s+/g, ' ').trim(); if (t.split(' ').length < 4) continue; total++;
          var en = (t.match(EN) || []).length, fr = (t.match(FR) || []).length; if (en >= 2 && en > fr * 1.5) bad.push(t.slice(0, 90)); }
        return { total: total, bad: bad }; });
      const gok = g && g.total > 150 && g.bad.length === 0;
      if (!gok) bad++;
      console.log((gok ? 'ok  ' : 'BAD ') + e.padEnd(8) + 'guidebook in French: ' + (g ? g.total + ' passages, ' + g.bad.length + ' English' : 'not found') + (g && g.bad.length ? ' | ' + g.bad.slice(0, 3).join(' ; ') : ''));
      if (errs.length) { bad++; console.log('BAD ' + e + ' page errors: ' + errs.slice(0, 3).join(' | ')); }
    } finally { await b.close(); }
  }
  console.log(bad ? 'FAIL' : 'PASS'); process.exit(bad ? 1 : 0);
})();
