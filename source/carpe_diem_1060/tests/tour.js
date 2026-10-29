const { chromium } = require('playwright');
(async () => {
  const url = process.argv[2];
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(4000);
  await page.evaluate(() => { try { demoStartTour(); } catch (e) { return String(e); } });
  const hits = new Set(); let steps = 0, last = '';
  for (let i = 0; i < 300; i++) {
    await page.waitForTimeout(260);
    const r = await page.evaluate(() => {
      const t = document.getElementById('demo-tour'); const body = document.body.innerText;
      const found = (body.match(/[^\n]*(overdue|en retard|days past|jours après|Proposal first|DPhil offer|fully-funded)[^\n]*/gi) || []).slice(0, 5);
      const card = t ? t.innerText.slice(0, 120) : null;
      let next = null;
      if (t) next = [...t.querySelectorAll('button')].find(b => /^(Next|Suivant|Continue|Continuer)\b|→$/.test(b.textContent.trim()));
      if (next) next.click();
      return { card, found, done: !t };
    });
    r.found.forEach(f => hits.add(f.slice(0, 160)));
    steps++;
    if (r.done || !r.card) break;
    if (r.card === last && i > 5) { /* stuck */ }
    last = r.card;
  }
  console.log('steps', steps);
  console.log('hits', JSON.stringify([...hits], null, 1));
  console.log('errors', errs.slice(0, 10));
  await browser.close();
})();
