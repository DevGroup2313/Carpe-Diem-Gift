// t_chat_use.js URL OUT: the Librarian's and Magister's conversations, 1077, used as a person uses them: every mood and
// prompt, a free question, a book opened, copy, read aloud, keep in my notes, edit and ask again, the three looks (kept),
// begin again, the end of a session (keep, new, close), back; in French; pictures by day and by night. Exit code 1 on
// any failure or page error.
const { chromium } = require('playwright');
const [URL_, OUT] = process.argv.slice(2);
let fails = 0;
function ok(c, what, extra) { console.log((c ? 'ok   ' : 'FAIL ') + what + (extra !== undefined ? '  ' + JSON.stringify(extra).slice(0, 300) : '')); if (!c) fails++; }
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 860 } });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(URL_).origin });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('page: ' + e.message.slice(0, 240)));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/sw\.js|favicon|Failed to load resource|bad HTTP response/.test(t)) errs.push('console: ' + t.slice(0, 240)); if (/^(Librarian|Magister)/.test(t)) errs.push('fallback: ' + t.slice(0, 240)); });
  const ev = (f, a) => p.evaluate(f, a);
  await p.goto(URL_, { waitUntil: 'load', timeout: 180000 });
  await p.waitForTimeout(3500);
  await ev(() => { try { if (typeof cdCloseDoor === 'function') cdCloseDoor(); } catch (e) {} try { if (typeof demoRemove === 'function') { demoRemove('demo-entry'); demoRemove('demo-build'); } } catch (e) {} state.themeAuto = false; state.theme = 'light'; saveState(); applyTheme(); if (state.lang !== 'en') setLang('en'); state.cdChatLook = 'classic'; });
  await p.waitForTimeout(600);
  const notes = () => ev(() => (state.notebookEntries || []).length);

  // ---- the Librarian
  await ev(() => { showSection('books'); openLibrarian(); }); await p.waitForTimeout(600);
  ok(await ev(() => !!document.querySelector('#modal-root .cdc.lib .cdc-chat') && document.querySelectorAll('.cdc.lib [data-intent]').length === 6 && !!document.getElementById('librarian-input')), 'the Librarian: the new page, six moods, the composer');
  ok(await ev(() => document.querySelectorAll('.cdc.lib .cdc-msg.bot').length === 1), 'it opens with its welcome');
  await p.click('.cdc.lib [data-intent="think"]'); await p.waitForTimeout(600);
  const lib1 = await ev(() => ({ msgs: librarianState.messages.length, books: document.querySelectorAll('.cdc.lib .cdc-book').length, me: document.querySelectorAll('.cdc.lib .cdc-msg.me').length }));
  ok(lib1.msgs === 3 && lib1.me === 1 && lib1.books >= 1, 'a mood brings books from the shelves, as cards', lib1);
  await p.fill('#librarian-input', 'Something French for an evening'); await p.press('#librarian-input', 'Enter'); await p.waitForTimeout(600);
  ok(await ev(() => librarianState.messages.length === 5 && !document.getElementById('librarian-input').value), 'a free question is answered, and the composer is cleared');
  const n0 = await notes();
  await p.click('.cdc.lib .cdc-msg.bot >> nth=1 >> [data-a="keep"]'); await p.waitForTimeout(300);
  ok(await notes() === n0 + 1 && await ev(() => document.querySelectorAll('.cdc.lib .cdc-msg.bot')[1].querySelector('[data-a="keep"]').textContent === '★'), 'a reply is kept in my notes');
  await p.click('.cdc.lib .cdc-msg.bot >> nth=1 >> [data-a="copy"]'); await p.waitForTimeout(300);
  const clip = await ev(() => navigator.clipboard.readText().catch(() => ''));
  ok(clip.length > 20, 'a reply is copied, with its books', clip.slice(0, 80));
  await p.click('.cdc.lib .cdc-msg.me >> nth=0 >> [data-a="edit"]'); await p.waitForTimeout(200);
  ok(await ev(() => document.getElementById('librarian-input').value.length > 3), 'Edit puts my question back in the composer');
  await p.click('.cdc.lib .cdc-msg.me >> nth=0 >> [data-a="again"]'); await p.waitForTimeout(600);
  ok(await ev(() => librarianState.messages.length === 7), 'Ask again asks it again');
  // the three looks
  for (const lk of ['soft', 'clean', 'classic']) {
    await p.click('.cdc.lib [data-a="menu"]'); await p.waitForTimeout(250);
    await p.click('.cdc.lib .cdc-menu [data-look="' + lk + '"]'); await p.waitForTimeout(350);
    ok(await ev((lk) => state.cdChatLook === lk && document.querySelector('.cdc.lib').classList.contains(lk === 'classic' ? 'lib' : lk) && (lk !== 'classic' || !/soft|clean/.test(document.querySelector('.cdc.lib').className)), lk), 'the look ' + lk + ' is chosen and kept');
    if (OUT) await p.screenshot({ path: OUT + '/lib_' + lk + '_day.png' });
  }
  await p.click('.cdc.lib [data-a="menu"]'); await p.waitForTimeout(250);
  const n1 = await notes();
  await p.click('.cdc.lib .cdc-menu [data-a="keepall"]'); await p.waitForTimeout(300);
  ok(await notes() === n1 + 1 && await ev(() => !document.querySelector('.cdc-menu')), 'the whole conversation is kept in my notes, and the menu closes');
  // a book opened
  const opened = await p.locator('.cdc.lib [data-a="open"]').count();
  if (opened) {
    await p.click('.cdc.lib [data-a="open"] >> nth=0'); await p.waitForTimeout(700);
    ok(await ev(() => !document.querySelector('#modal-root .cdc') && !document.getElementById('section-books').classList.contains('hidden')), 'Open the book closes the conversation and opens the book');
  } else ok(false, 'a book to open');
  await ev(() => openLibrarian()); await p.waitForTimeout(400);
  await p.click('.cdc.lib [data-intent="french"]'); await p.waitForTimeout(400);
  await p.click('.cdc.lib [data-a="restart"]'); await p.waitForTimeout(400);
  ok(await ev(() => librarianState.messages.length === 1 && document.querySelectorAll('.cdc.lib .cdc-msg').length === 1), 'Begin again starts afresh');
  await p.click('.cdc.lib [data-a="back"]'); await p.waitForTimeout(300);
  ok(await ev(() => !document.querySelector('#modal-root .cdc')), '‹ The Library closes it');

  // ---- Magister
  await ev(() => { showSection('home'); openMagisterChat(); }); await p.waitForTimeout(600);
  ok(await ev(() => !!document.querySelector('#modal-root .cdc.mag .cdc-chat') && document.querySelectorAll('.cdc.mag [data-chip]').length >= 6), 'Magister: the new page, its prompts');
  await p.click('.cdc.mag [data-chip="quiz"]'); await p.waitForTimeout(500);
  ok(await ev(() => magisterConvo.history.length === 3 && document.querySelectorAll('.cdc.mag .cdc-msg').length === 3), 'a prompt is answered');
  await p.fill('.cdc.mag textarea', 'How should I read the Melian Dialogue?'); await p.press('.cdc.mag textarea', 'Enter'); await p.waitForTimeout(500);
  ok(await ev(() => magisterConvo.history.length === 5 && !document.querySelector('.cdc.mag textarea').value), 'a free question is answered');
  await p.fill('.cdc.mag textarea', 'A line'); await p.press('.cdc.mag textarea', 'Shift+Enter'); await p.waitForTimeout(150);
  ok(await ev(() => document.querySelector('.cdc.mag textarea').value.indexOf('\n') > 0 && magisterConvo.history.length === 5), 'Shift+Enter breaks a line and does not send');
  await ev(() => { document.querySelector('.cdc.mag textarea').value = ''; document.querySelector('.cdc.mag textarea').dispatchEvent(new Event('input', { bubbles: true })); });
  ok(await ev(() => document.querySelector('.cdc.mag [data-a="send"]').disabled === true), 'the send key waits for words');
  if (OUT) { await p.mouse.move(400, 300); await p.screenshot({ path: OUT + '/mag_classic_day.png' }); }
  const n2 = await notes();
  await p.click('.cdc.mag [data-a="end"]'); await p.waitForTimeout(500);
  ok(await ev(() => !document.querySelector('#modal-root .cdc')), 'End session closes it') ;
  ok(await notes() === n2 + 1, 'and keeps the transcript, as before');
  await ev(() => { openMagisterChat(); magisterSendChip('push'); renderMagisterChatView(true); }); await p.waitForTimeout(500);
  ok(await ev(() => !!document.querySelector('.cdc.mag .cdc-end') && !document.querySelector('.cdc.mag textarea')), 'the end of a session offers keep, new, close');
  const n3 = await notes();
  await p.click('.cdc.mag [data-a="savend"]'); await p.waitForTimeout(500);
  ok(await notes() === n3 + 1 && await ev(() => state.magisterChatOpen === false && !document.querySelector('#modal-root .cdc')), 'Keep this conversation keeps it and closes');
  await ev(() => { openMagisterChat(); renderMagisterChatView(true); }); await p.waitForTimeout(400);
  await p.click('.cdc.mag .cdc-end [data-a="restart"]'); await p.waitForTimeout(400);
  ok(await ev(() => !!document.querySelector('.cdc.mag textarea') && magisterConvo.history.length === 1), 'New conversation begins again');

  // ---- French, night
  await ev(() => { setLang('fr'); }); await p.waitForTimeout(600);
  await ev(() => openLibrarian()); await p.waitForTimeout(400);
  const frl = await ev(() => document.querySelector('.cdc.lib .cdc-top').textContent + ' | ' + document.querySelector('.cdc.lib .cdc-foot').textContent);
  ok(/Bibliothécaire/.test(frl) && /rayons/.test(frl), 'the Librarian in French', frl.slice(0, 120));
  await ev(() => { closeModal(); openMagisterChat(); }); await p.waitForTimeout(400);
  ok(/La journée/.test(await ev(() => document.querySelector('.cdc.mag .cdc-top').textContent)), 'Magister in French');
  await ev(() => { closeModal(); setLang('en'); state.theme = 'night'; saveState(); applyTheme(); openMagisterChat(); magisterSendChip('context'); }); await p.waitForTimeout(600);
  if (OUT) await p.screenshot({ path: OUT + '/mag_classic_night.png' });
  await ev(() => { closeModal(); openLibrarian(); librarianAct('challenge', 'A hard, rewarding read'); }); await p.waitForTimeout(600);
  if (OUT) await p.screenshot({ path: OUT + '/lib_classic_night.png' });
  await ev(() => { state.cdChatLook = 'clean'; saveState(); renderLibrarian(); }); await p.waitForTimeout(400);
  if (OUT) await p.screenshot({ path: OUT + '/lib_clean_night.png' });
  await ev(() => { state.theme = 'light'; state.cdChatLook = 'classic'; saveState(); applyTheme(); closeModal(); });

  ok(errs.length === 0, 'no page errors', errs);
  console.log(fails ? fails + ' FAILED' : 'all passed');
  await b.close();
  process.exit(fails ? 1 : 0);
})();
