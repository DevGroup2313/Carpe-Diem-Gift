// t_cand_shots.js URL OUT [lang] [width]: Candidatus › Overview and Home › Overview, by day and by night, as a person
// meets them, with every error the page raises.
const { chromium } = require('playwright');
const [URL_, OUT, LANG = 'en', WIDTH = '1440'] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const errs = [];
  for (const night of [false, true]) {
    const w = +WIDTH, ctx = await b.newContext({ viewport: { width: w, height: 1000 }, isMobile: w < 700, hasTouch: w < 1000, colorScheme: night ? 'dark' : 'light' });
    await ctx.addInitScript(([n, lang]) => { try { if (!sessionStorage.getItem('t')) { sessionStorage.setItem('t', 1); localStorage.setItem('carpe_diem_offline_v1', JSON.stringify({ theme: n ? 'night' : 'light', lang })); } } catch (e) {} }, [night, LANG]);
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push((night ? 'night ' : 'day ') + 'page: ' + e.message.slice(0, 240)));
    p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/sw\.js|favicon|Failed to load resource/.test(t)) errs.push((night ? 'night ' : 'day ') + 'console: ' + t.slice(0, 240)); if (/Candidatus overview|^Overview/.test(t)) errs.push('fallback: ' + t.slice(0, 240)); });
    await p.goto(URL_, { waitUntil: 'load', timeout: 180000 });
    await p.waitForTimeout(3500);
    await p.evaluate(([n, lang]) => { try { if (typeof cdCloseDoor === 'function') cdCloseDoor(); } catch (e) {} try { state.themeAuto = false; state.theme = n ? 'night' : 'light'; saveState(); applyTheme(); } catch (e) { console.error('theme', e.message); } try { if (state.lang !== lang) setLang(lang); } catch (e) { console.error('lang', e.message); } }, [night, LANG]);
    await p.waitForTimeout(900);
    await p.evaluate(() => { try { showSection('applications'); candUI.tab = 'overview'; renderCandidature(); } catch (e) { console.error('open', e.message); } });
    await p.waitForTimeout(1500);
    const tag = OUT + '_' + LANG + '_' + WIDTH + (night ? '_night' : '_day');
    const scrollShots = async (name, n) => {
      await p.evaluate(() => { const sc = document.getElementById('cd-scroll') || document.scrollingElement; sc.scrollTop = 0; });
      await p.waitForTimeout(400);
      for (let k = 0; k < n; k++) {
        await p.screenshot({ path: tag + '_' + name + '_' + k + '.png' });
        const more = await p.evaluate(() => { const sc = document.getElementById('cd-scroll') || document.scrollingElement; const t = sc.scrollTop; sc.scrollTop += Math.round(innerHeight * 0.8); return sc.scrollTop !== t; });
        if (!more) break;
        await p.waitForTimeout(450);
      }
    };
    const info = await p.evaluate(() => {
      const r = document.getElementById('cdx-cand');
      if (!r) return { ours: false, first: (document.getElementById('cand-overview') || {}).innerHTML ? document.getElementById('cand-overview').innerHTML.slice(0, 200) : 'empty' };
      return { ours: true, cards: r.querySelectorAll('.cdx-card').length, cols: [...r.querySelectorAll('.cdx-col')].map(c => c.getAttribute('data-col') + ':' + c.querySelectorAll('.cdx-item').length), stops: r.querySelectorAll('.cdx-stop').length, rings: r.querySelectorAll('.cdx-ring').length, next: (r.querySelector('.cdx-next .cdx-h') || {}).textContent, guide: !!document.querySelector('#cand-overview > :not(#cdx-cand)') };
    });
    console.log((night ? 'night' : 'day') + ' Candidatus:', JSON.stringify(info));
    await scrollShots('cand', 4);
    await p.evaluate(() => { try { showSection('home'); homeUI.tab = 'overview'; renderHome(); } catch (e) { console.error('home', e.message); } });
    await p.waitForTimeout(1600);
    await p.evaluate(() => { const v = document.getElementById('overview-view'); const sc = document.getElementById('cd-scroll'); if (v && sc) sc.scrollTop = v.getBoundingClientRect().top + sc.scrollTop - 90; });
    const ov = await p.evaluate(() => {
      const r = document.getElementById('cdx-ov');
      if (!r) return { ours: false };
      return { ours: true, cards: r.querySelectorAll('.cdx-card').length, kicks: [...r.querySelectorAll('.cdx-kick')].map(k => k.textContent.trim()), asc: (r.querySelector('[data-cdx="asc"]') || {}).children ? r.querySelector('[data-cdx="asc"]').children.length : 0, sup: !!document.getElementById('cd-sup-ov') };
    });
    console.log((night ? 'night' : 'day') + ' Overview:', JSON.stringify(ov));
    await p.waitForTimeout(700);
    for (let k = 0; k < 3; k++) {
      await p.screenshot({ path: tag + '_ov_' + k + '.png' });
      const more = await p.evaluate(() => { const sc = document.getElementById('cd-scroll') || document.scrollingElement; const t = sc.scrollTop; sc.scrollTop += Math.round(innerHeight * 0.8); return sc.scrollTop !== t; });
      if (!more) break;
      await p.waitForTimeout(450);
    }
    await ctx.close();
  }
  console.log('errors:', errs.length ? '\n  ' + errs.join('\n  ') : 'none');
  await b.close();
})();
