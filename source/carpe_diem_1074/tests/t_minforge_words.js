// scan_en.js URL: the mini Forge with Carpe Diem in French; every visible word, title and label in the Forge's own
// controls that is still English (the preview and the code view left out), with where it is.
const { chromium } = require('playwright');
const [URL_] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1500, height: 950 } });
  await ctx.addInitScript(() => { try { if (!localStorage.getItem('carpe_diem_offline_v1')) localStorage.setItem('carpe_diem_offline_v1', JSON.stringify({ lang: 'fr', theme: 'light' })); } catch (e) {} });
  const p = await ctx.newPage();
  await p.goto(URL_, { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(3000);
  await p.evaluate(() => { try { if (typeof cdCloseDoor === 'function') cdCloseDoor(); } catch (e) {} try { setLang('fr'); } catch (e) {} });
  await p.waitForTimeout(800);
  await p.evaluate(() => window.cdForgePanel());
  let fr = null;
  for (let i = 0; i < 150; i++) {
    await p.waitForTimeout(1000);
    const fe = await p.$('#cd-forge-panel iframe'); fr = fe ? await fe.contentFrame() : null;
    if (fr && i > 15) {
      const ok = await fr.evaluate(() => { const fb = document.getElementById('forge-boot'); return !!document.getElementById('room-editor') && (!fb || /fb-gone/.test(fb.className)) && /\.html/.test((document.getElementById('curName') || {}).textContent || ''); }).catch(() => false);
      if (ok) break;
    }
  }
  await p.waitForTimeout(3000);
  const scan = async (label) => {
    const out = await fr.evaluate(() => {
      const EN = /\b(the|and|your|you|this|with|of|to|for|is|it|on|in|a|an|or|when|what|here|open|close|save|saved|more|full|leave|float|dock|preview|editor|choose|file|app|page|show|hide|back|go|dismiss|first|day|help|smaller|larger|fit|roll|bar|press|copy|download|nothing|yet)\b/i;
      const FRW = /[àâçéèêëîïôûùüÿœ’]|\b(le|la|les|des|du|une|un|et|ou|pour|dans|sur|avec|votre|vos|est|sont|pas|plus|aperçu|modifier|enregistr)\b/i;
      const seen = {}, res = [];
      const skipSel = 'script,style,code,pre,textarea,iframe,svg,#codeView,#changesView,#frameWrap,[hidden]';
      function vis(el) { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity || '1') > 0.05; }
      function where(el) { const r = el.closest('[id]'); return r ? '#' + r.id : el.tagName; }
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.parentElement && !n.parentElement.closest(skipSel)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
      let n;
      while ((n = w.nextNode())) {
        const t = (n.nodeValue || '').replace(/\s+/g, ' ').trim(); if (t.length < 3 || !/[A-Za-z]{3}/.test(t)) continue;
        if (!vis(n.parentElement)) continue;
        if (EN.test(t) && !FRW.test(t)) { const k = 'T|' + t; if (!seen[k]) { seen[k] = 1; res.push(['text', where(n.parentElement), t]); } }
      }
      document.querySelectorAll('[title],[aria-label],[placeholder],[data-tip]').forEach(el => {
        if (el.closest(skipSel)) return;
        ['title', 'aria-label', 'placeholder', 'data-tip'].forEach(a => { const t = (el.getAttribute(a) || '').trim(); if (t.length < 3) return;
          if (EN.test(t) && !FRW.test(t)) { const k = a + '|' + t; if (!seen[k]) { seen[k] = 1; res.push([a, where(el), t]); } } });
      });
      return res;
    });
    console.log('\n== ' + label + ' (' + out.length + ')');
    console.log(JSON.stringify(out));
  };
  await scan('editor');
  const open = async (sel) => { const el = await fr.$(sel); if (el) { await el.click(); await p.waitForTimeout(900); } };
  
  
  
  await b.close();
})();
