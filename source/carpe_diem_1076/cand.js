(function () {
  'use strict';
  if (window.__cdx1075) return;
  window.__cdx1075 = 1;
  var W = window, D = document;

  // ---------- the small things ----------
  function fr() { try { return state.lang === 'fr'; } catch (e) { return false; } }
  function T(en, f) { return fr() ? f : en; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function tdy() { try { return todayString(); } catch (e) { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); } }
  function save() { try { saveState(); } catch (e) {} }
  function TR(s) { try { return typeof trd === 'function' ? trd(s) : s; } catch (e) { return s; } }
  function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function mins(n) { n = n || 25; return T('about ' + n + ' minutes', 'environ ' + n + ' minutes'); }
  function size(n) { n = n || 25; return n <= 15 ? T('small', 'petite') : n <= 45 ? T('medium', 'moyenne') : T('large', 'grande'); }
  function C() {
    var c = state.cdCand;
    if (!c || typeof c !== 'object') c = state.cdCand = {};
    if (!c.board || typeof c.board !== 'object') c.board = {};
    ['now', 'next', 'later'].forEach(function (k) { if (!Array.isArray(c.board[k])) c.board[k] = []; });
    if (!c.items || typeof c.items !== 'object') c.items = {};
    if (!Array.isArray(c.done)) c.done = [];
    if (!Array.isArray(c.parked)) c.parked = [];
    return c;
  }
  // what each ring, bar and road last showed, so a redraw moves from there and the first drawing fills in from nothing
  var LAST = {};
  function still() { try { return D.body.getAttribute('data-motion') === 'minimal' || W.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function ring(frac, colour, k) {
    frac = Math.max(0, Math.min(1, frac || 0));
    var to = (frac * 132).toFixed(1), from = k && LAST[k] != null && !still() ? LAST[k] : (still() ? to : 0);
    return '<svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="21" fill="none" stroke="var(--cx-rim)" stroke-width="6"/>'
      + (frac > 0 || from > 0 ? '<circle class="arc" cx="26" cy="26" r="21" fill="none" stroke="' + colour + '" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + from + ' 132" data-to="' + to + '"' + (k ? ' data-k="' + k + '"' : '') + ' transform="rotate(-90 26 26)"/>' : '') + '</svg>';
  }
  function bar(pct, k) { pct = Math.max(0, Math.min(100, Math.round(pct || 0))); var from = k && LAST[k] != null && !still() ? LAST[k] : (still() ? pct : 0); return '<div class="cdx-bar"><i style="width:' + from + '%" data-to="' + pct + '"' + (k ? ' data-k="' + k + '"' : '') + '></i></div>'; }
  // after a drawing: everything moves to its value
  function settle(root) {
    var run = function () {
      [].forEach.call(root.querySelectorAll('.arc[data-to]'), function (a) { a.setAttribute('stroke-dasharray', a.getAttribute('data-to') + ' 132'); var k = a.getAttribute('data-k'); if (k) LAST[k] = a.getAttribute('data-to'); });
      [].forEach.call(root.querySelectorAll('.cdx-bar i[data-to]'), function (b) { b.style.width = b.getAttribute('data-to') + '%'; var k = b.getAttribute('data-k'); if (k) LAST[k] = +b.getAttribute('data-to'); });
      [].forEach.call(root.querySelectorAll('.cdx-fill[data-to],.cdx-msfill[data-to]'), function (f) { f.style.setProperty('--f', f.getAttribute('data-to')); var k = f.getAttribute('data-k'); if (k) LAST[k] = +f.getAttribute('data-to'); });
    };
    if (still()) run(); else requestAnimationFrame(function () { requestAnimationFrame(run); });
  }
  W.__cdxSettle = settle; W.__cdxRing = ring; W.__cdxBar = bar; W.__cdxLast = function (k) { return LAST[k]; }; W.__cdxStill = still;
  // the demonstrations carry no proposal and no Candidatus page: their Overview leaves the proposal out, as theirs always has
  function demo() { try { return typeof demoOn === 'function' && !!demoOn(); } catch (e) { return false; } }
  function rise(html, i) { return html.replace(/^<(section|div)/, '<$1 style="animation-delay:' + (i * 0.06).toFixed(2) + 's"'); }

  // ---------- today's energy: one setting for the whole app ----------
  // Low is the app's own low-energy day (the Focus page's switch, kept in state.support.low), so choosing it here or
  // there is the same choice; Some and Plenty are kept for the day.
  function sup() { try { if (!state.support || typeof state.support !== 'object') state.support = {}; return state.support; } catch (e) { return {}; } }
  function energy() {
    var s = sup(); if (s.low && s.low[tdy()]) return 'low';
    var e = state.cdEnergy; return e && e.day === tdy() && (e.level === 'some' || e.level === 'plenty') ? e.level : 'some';
  }
  function setEnergy(v) {
    var low = v === 'low', was = energy() === 'low';
    state.cdEnergy = { day: tdy(), level: v };
    // a change of low goes through the app's own switch, so Home and the Focus page follow at once
    if (low !== was) {
      var did = false;
      try { if (W.__cdSC && typeof W.__cdSC.setLow === 'function') { W.__cdSC.setLow(low); did = true; } } catch (e) {}
      if (!did) try { if (W.cdSupport && typeof W.cdSupport.setLow === 'function') { W.cdSupport.setLow(low); did = true; } } catch (e) {}
      if (!did) { var s = sup(); s.low = {}; if (low) s.low[tdy()] = true; }
    }
    save();
  }
  function energyCard(extra) {
    var e = energy();
    var note = e === 'low' ? T('A low day: one small thing is enough. Steps of a quarter of an hour come first; resting is part of the work.', 'Un jour à faible énergie : une petite chose suffit. Les étapes d’un quart d’heure viennent d’abord ; se reposer fait partie du travail.')
      : e === 'plenty' ? T('Plenty of energy: the larger steps are offered too. Keep a break in each hour.', 'Beaucoup d’énergie : les grandes étapes sont proposées aussi. Gardez une pause par heure.')
      : T('With some energy, steps of 25 minutes or less come first. Nothing is lost by choosing low.', 'Avec un peu d’énergie, les étapes de 25 minutes ou moins viennent d’abord. Rien n’est perdu en choisissant faible.');
    return '<section class="cdx-card cdx-rise" data-cdx="energy"><p class="cdx-kick">' + T('Today’s energy', 'L’énergie du jour') + '</p>'
      + '<div class="cdx-seg" role="group" aria-label="' + T('Today’s energy', 'L’énergie du jour') + '">'
      + [['low', T('Low', 'Faible')], ['some', T('Some', 'Moyenne')], ['plenty', T('Plenty', 'Grande')]].map(function (x) { return '<button type="button" data-energy="' + x[0] + '" aria-pressed="' + (e === x[0]) + '">' + x[1] + '</button>'; }).join('')
      + '</div><p class="cdx-note">' + note + '</p>' + (extra || '') + '</section>';
  }

  // ---------- Candidatus's data ----------
  function sections() { try { return ensureProposalSections(); } catch (e) { return []; } }
  function secPct(s) { try { return sectionPctOffline(s); } catch (e) { return s && s.done ? 100 : 0; } }
  function cd() { var c = state.candidature || {}; return { milestones: c.milestones || [], funding: c.funding || [], visa: c.visa || [] }; }
  function listOf(k) { var c = cd(); return k === 'ms' ? c.milestones : k === 'fund' ? c.funding : k === 'visa' ? c.visa : null; }
  function srcOf(src) {
    if (!src) return null;
    if (src.k === 'sec') { var s = sections().filter(function (x) { return x.id === src.id; })[0]; return s ? { label: TR(s.title), done: secPct(s) === 100, kind: T('Proposal', 'Proposition') } : null; }
    var l = listOf(src.k);
    if (l) { var x = l.filter(function (y) { return y.id === src.id; })[0]; return x ? { label: TR(x.label), done: !!x.done, obj: x, kind: src.k === 'ms' ? T('Milestone', 'Jalon') : src.k === 'fund' ? T('Funding', 'Financement') : T('Visa', 'Visa') } : null; }
    return null;
  }
  function title(it) { if (it.src) { var s = srcOf(it.src); if (s) return s.label; } return it.t || ''; }
  function kindOf(it) { if (it.src) { var s = srcOf(it.src); if (s) return s.kind; } return T('Your own', 'À vous'); }
  function addItem(col, t, src, m) {
    var c = C(), id = uid();
    c.items[id] = { id: id, t: t || '', src: src || null, mins: m || (src && src.k === 'fund' ? 15 : 25), steps: [], at: Date.now() };
    c.board[col].push(id);
    return id;
  }
  function seed() {
    var c = C(); if (c.seeded) return; c.seeded = true;
    if (Object.keys(c.items).length) return;
    var open = sections().filter(function (s) { return secPct(s) < 100; });
    var ms = cd().milestones.filter(function (m) { return !m.done; });
    var fund = cd().funding.filter(function (f) { return !f.done; });
    if (open[0]) addItem('now', '', { k: 'sec', id: open[0].id });
    if (ms[0]) addItem('now', '', { k: 'ms', id: ms[0].id });
    open.slice(1, 3).forEach(function (s) { addItem('next', '', { k: 'sec', id: s.id }); });
    if (fund[0]) addItem('next', '', { k: 'fund', id: fund[0].id }, 15);
    ms.slice(1, 4).forEach(function (m) { addItem('later', '', { k: 'ms', id: m.id }); });
    save();
  }
  function logDone(t, k) { var c = C(); c.done.unshift({ t: t, at: Date.now(), k: k || '' }); if (c.done.length > 80) c.done.length = 80; }
  function removeFromBoard(id) { var c = C(); ['now', 'next', 'later'].forEach(function (k) { var i = c.board[k].indexOf(id); if (i >= 0) c.board[k].splice(i, 1); }); }
  function complete(id, auto) {
    var c = C(), it = c.items[id]; if (!it) return;
    var s = it.src ? srcOf(it.src) : null;
    if (!auto && s && s.obj && !s.obj.done) { s.obj.done = true; noteSnap(it.src.k + ':' + it.src.id); }
    if (!auto || !alreadyLogged(it)) logDone(title(it), it.src ? it.src.k : 'own');
    removeFromBoard(id); delete c.items[id];
  }
  function alreadyLogged(it) { var c = C(), t = title(it), since = Date.now() - 7 * 864e5; return c.done.some(function (d) { return d.t === t && d.at > since; }); }
  // what was ticked elsewhere (the Proposal, Milestones) counts this week too
  function snapNow() {
    var keys = {};
    ['ms', 'fund', 'visa'].forEach(function (k) { listOf(k).forEach(function (x) { if (x.done) keys[k + ':' + x.id] = TR(x.label); }); });
    sections().forEach(function (s) { (s.subsections || []).forEach(function (u) { if (u.done) keys['sub:' + s.id + ':' + u.id] = TR(u.title || u.label || s.title); }); if (!(s.subsections || []).length && s.done) keys['sec:' + s.id] = TR(s.title); });
    return keys;
  }
  function noteSnap(key) { var c = C(); if (!c.snap) c.snap = {}; c.snap[key] = 1; }
  function sync() {
    var c = C(), now = snapNow(), changed = false;
    if (!c.snap) { c.snap = {}; Object.keys(now).forEach(function (k) { c.snap[k] = 1; }); changed = true; }
    else {
      Object.keys(now).forEach(function (k) { if (!c.snap[k]) { c.snap[k] = 1; logDone(now[k], k.split(':')[0]); changed = true; } });
      Object.keys(c.snap).forEach(function (k) { if (!now[k]) { delete c.snap[k]; changed = true; } });
    }
    Object.keys(c.items).forEach(function (id) { var it = c.items[id]; if (it.src) { var s = srcOf(it.src); if (s && s.done) { complete(id, true); changed = true; } } });
    ['now', 'next', 'later'].forEach(function (k) { var b = c.board[k].filter(function (id) { return !!c.items[id]; }); if (b.length !== c.board[k].length) { c.board[k] = b; changed = true; } });
    if (changed) save();
  }
  function pickNext() {
    var c = C(), list = c.board.now.concat(c.board.next).map(function (id) { return c.items[id]; }).filter(Boolean);
    if (!list.length) return null;
    // the step being worked on (its time changed, or broken into smaller steps) stays until it is done or another is asked for
    if (c.pin && c.pin.day === tdy() && c.items[c.pin.id] && list.indexOf(c.items[c.pin.id]) >= 0) return c.items[c.pin.id];
    var e = energy(), lim = e === 'low' ? 15 : e === 'some' ? 25 : 999;
    var fit = list.filter(function (it) { return (it.mins || 25) <= lim; }), pool = fit.length ? fit : list;
    var sk = c.skip && c.skip.day === tdy() ? c.skip.n : 0;
    return pool[sk % pool.length];
  }
  function suggest(it) {
    var g = [T('Open what you need for it', 'Ouvrir ce qu’il faut pour cela'), T('Do the first five minutes', 'Faire les cinq premières minutes'), T('Note where you stopped', 'Noter où vous vous êtes arrêté·e')];
    if (!it.src) return g;
    if (it.src.k === 'sec') return [T('Re-read what you have for this section', 'Relire ce que vous avez pour cette section'), T('Write three sentences, however rough', 'Écrire trois phrases, même brouillonnes'), T('Find one source to cite here', 'Trouver une source à citer ici')];
    if (it.src.k === 'fund') return [T('Read the scheme’s eligibility', 'Lire les conditions du programme de financement'), T('Note its deadline in Milestones', 'Noter sa date limite dans les Jalons'), T('Tick it once it is checked', 'Le cocher une fois vérifié')];
    var id = it.src.id || '';
    if (/supervis/.test(id)) return [T('List three names whose work you cite', 'Lister trois noms dont vous citez les travaux'), T('Read one recent paper by the first', 'Lire un article récent du premier nom'), T('Draft the email from the model in Help at hand', 'Rédiger le courriel à partir du modèle de l’Aide à portée de main')];
    if (/letter|refer|recom/.test(id)) return [T('Choose your referees', 'Choisir vos référents'), T('Draft the request from the model in Help at hand', 'Rédiger la demande à partir du modèle de l’Aide à portée de main'), T('Gather your CV and the one-page summary', 'Rassembler votre CV et le résumé d’une page')];
    if (/submit|appl/.test(id)) return [T('Open the course page and check the deadline', 'Ouvrir la page du programme et vérifier la date limite'), T('List what the form asks for', 'Lister ce que demande le formulaire'), T('Fill one part of the form', 'Remplir une partie du formulaire')];
    if (/fund|schol/.test(id)) return [T('Read the funding section of the course page', 'Lire la partie financement de la page du programme'), T('List the schemes you qualify for', 'Lister les financements auxquels vous avez droit'), T('Note each deadline', 'Noter chaque date limite')];
    if (/propos|draft/.test(id)) return [T('Draft one section you have not begun', 'Rédiger une section pas encore commencée'), T('Read the draft aloud once', 'Lire le brouillon à voix haute une fois'), T('Note what is still missing', 'Noter ce qui manque encore')];
    return g;
  }

  // ---------- where you left off ----------
  function noteWhere() {
    try {
      if (typeof candUI === 'undefined' || !candUI.tab || candUI.tab === 'overview') return;
      var c = C(), l = { tab: candUI.tab, sec: candUI.tab === 'proposal' ? (candUI.propOpen || null) : null };
      if (c.last && c.last.tab === l.tab && c.last.sec === l.sec && Date.now() - (c.last.at || 0) < 600000) return;
      l.at = Date.now(); c.last = l; save();
    } catch (e) {}
  }
  function tabName(t) { return { applications: T('Applications', 'Candidatures'), proposal: T('Proposal', 'Proposition'), milestones: T('Milestones', 'Jalons'), citations: T('Citations', 'Citations') }[t] || t; }
  function whenAgo(at) {
    var d = new Date(at), now = new Date(), hm = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    var day = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
    if (day <= 0) return T('today at ', 'aujourd’hui à ') + hm;
    if (day === 1) return T('yesterday at ', 'hier à ') + hm;
    try { return d.toLocaleDateString(fr() ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long' }); } catch (e) { return d.toDateString(); }
  }
  function resumeLine() {
    var c = C(), l = c.last;
    if (!l) return '<div class="cdx-resume"><span>' + T('Start anywhere: the Proposal is a good first room.', 'Commencez où vous voulez : la Proposition est une bonne première pièce.') + '</span><button type="button" class="cdx-key small" data-go="proposal">' + T('Open', 'Ouvrir') + '</button></div>';
    var where = tabName(l.tab);
    if (l.sec) { var s = sections().filter(function (x) { return x.id === l.sec; })[0]; if (s) where += ' › ' + TR(s.title); }
    return '<div class="cdx-resume"><span>' + T('Where you left off: ', 'Là où vous en étiez : ') + '<b>' + esc(where) + '</b>, ' + whenAgo(l.at) + '</span><button type="button" class="cdx-key small" data-resume="1">' + T('Resume', 'Reprendre') + '</button></div>';
  }

  // ---------- the guides ----------
  var GUIDES = [
    { id: 'email', icon: '✉️', t: ['Writing to a potential supervisor: a model email', 'Écrire à un futur directeur de thèse : un modèle de courriel'], b: [
      '<p>Write once your research question fits in two sentences, ideally six to ten weeks before the deadline. Some departments ask you to contact supervisors before you apply; others prefer that you apply first: the course page says which.</p>'
      + '<pre>Subject: Prospective DPhil applicant: [your topic in a few words]\n\nDear Professor [Surname],\n\nI am applying for the [course] at [university] for entry in [year], and I am writing because your work on [a specific book, article or project] bears directly on my research question.\n\nMy project asks [your question, in one or two sentences]. I would approach it through [your method or sources, in one sentence]. [One sentence on what prepares you: your degree, a thesis, a publication or relevant experience.]\n\nWould you be willing to consider supervising this project, or to tell me whether it fits the department’s current strengths? I attach a one-page summary and my CV.\n\nWith thanks for your time,\n[Your name]</pre>'
      + '<ul><li>Keep it under 250 words, and name one piece of their work precisely.</li><li>One person per email; never a group message.</li><li>If no reply comes within two weeks, one short, courteous follow-up is enough. A silence is not a verdict on your project.</li></ul>',
      '<p>Écrivez quand votre question de recherche tient en deux phrases, idéalement six à dix semaines avant la date limite. Certains départements demandent de contacter les directeurs avant de candidater ; d’autres préfèrent que vous candidatiez d’abord : la page du programme le précise.</p>'
      + '<pre>Objet : Candidature au DPhil envisagée : [votre sujet en quelques mots]\n\nMadame la Professeure / Monsieur le Professeur [Nom],\n\nJe prépare une candidature au [programme] de [université] pour la rentrée [année], et je vous écris parce que vos travaux sur [un livre, un article ou un projet précis] touchent directement ma question de recherche.\n\nMon projet se demande [votre question, en une ou deux phrases]. Je l’aborderais par [votre méthode ou vos sources, en une phrase]. [Une phrase sur ce qui vous y prépare : votre diplôme, un mémoire, une publication ou une expérience pertinente.]\n\nAccepteriez-vous d’envisager de diriger ce projet, ou de me dire s’il correspond aux forces actuelles du département ? Vous trouverez ci-joint un résumé d’une page et mon CV.\n\nAvec mes remerciements pour votre temps,\n[Votre nom]</pre>'
      + '<ul><li>Restez sous les 250 mots, et citez précisément l’un de leurs travaux.</li><li>Une personne par courriel ; jamais d’envoi groupé.</li><li>Sans réponse au bout de deux semaines, une relance brève et courtoise suffit. Un silence n’est pas un jugement sur votre projet.</li></ul>'] },
    { id: 'stuck', icon: '🧭', t: ['When you are stuck: five ways back in', 'Quand rien n’avance : cinq façons d’y revenir'], b: [
      '<ol><li><b>Make the step smaller.</b> Five minutes, one sentence, one source. A step you can finish beats a step you can only dread.</li><li><b>Change the medium.</b> Say it aloud to Scriba, write by hand, or draw the argument as boxes and arrows.</li><li><b>Write the worst version first.</b> A rough paragraph can be mended; a blank page cannot.</li><li><b>Move sideways.</b> Work on another section and come back: the proposal does not have to be written in order.</li><li><b>Work beside the Clepsydra.</b> Start it and stay for one sprint; the ring keeps you company.</li></ol><p>Rest is part of the work. If none of these helps today, choose Low and let the day be lighter.</p>',
      '<ol><li><b>Rendez l’étape plus petite.</b> Cinq minutes, une phrase, une source. Une étape qu’on peut finir vaut mieux qu’une étape qu’on redoute.</li><li><b>Changez de support.</b> Dites-le à voix haute à Scriba, écrivez à la main, ou dessinez l’argument en cases et en flèches.</li><li><b>Écrivez d’abord la pire version.</b> Un paragraphe brouillon se répare ; une page blanche, non.</li><li><b>Passez à côté.</b> Travaillez une autre section et revenez ensuite : la proposition n’a pas à s’écrire dans l’ordre.</li><li><b>Travaillez avec la Clepsydre.</b> Lancez-la et restez le temps d’un sprint ; l’anneau vous tient compagnie.</li></ol><p>Le repos fait partie du travail. Si rien de cela n’aide aujourd’hui, choisissez Faible et laissez la journée être plus légère.</p>'] },
    { id: 'referee', icon: '📋', t: ['Asking a referee: what to send, and when', 'Demander une lettre de recommandation : quoi envoyer, et quand'], b: [
      '<ul><li>Ask at least six weeks before the deadline, by email, and ask whether they can write a strong reference.</li><li>Send your CV, a one-page summary of your proposal, the list of courses with each deadline and link, and a line on what you would like them to speak to (your independent research, your writing, your seminar work).</li><li>Most Oxford graduate courses ask for three references and most Cambridge PhD courses for two: check each course page. You register your referees in the application form, and they receive the request by email.</li><li>A gentle reminder a week before the deadline is welcome. Thank them afterwards, and tell them the outcome.</li></ul>',
      '<ul><li>Demandez au moins six semaines avant la date limite, par courriel, en demandant s’ils peuvent écrire une recommandation solide.</li><li>Envoyez votre CV, un résumé d’une page de votre proposition, la liste des programmes avec chaque date limite et chaque lien, et une ligne sur ce que vous aimeriez qu’ils mettent en avant (votre recherche autonome, votre écriture, votre travail en séminaire).</li><li>La plupart des programmes de troisième cycle d’Oxford demandent trois références et la plupart des doctorats de Cambridge deux : vérifiez chaque page de programme. Vous inscrivez vos référents dans le formulaire de candidature, et ils reçoivent la demande par courriel.</li><li>Un rappel bienveillant une semaine avant la date limite est apprécié. Remerciez-les ensuite, et dites-leur l’issue.</li></ul>'] },
    { id: 'interview', icon: '🗣️', t: ['Preparing for the interview', 'Se préparer à l’entretien'], b: [
      '<ul><li>Say your question in one sentence, then in three minutes.</li><li>Know three works your project answers to, and why yours differs.</li><li>Be ready on method: why these sources and this approach, and what you would do if access failed.</li><li>Name the limits and the ethics plainly: panels trust candidates who see them.</li><li>Say why this department, these supervisors and this course, specifically.</li><li>Prepare two questions of your own: on supervision, research training, the cohort.</li><li>Practise aloud once, with a friend or with Scriba recording. Interviews are often online: test the camera, the light and the sound the day before.</li></ul><p>It is a conversation about your project, not an examination of everything you know.</p>',
      '<ul><li>Dites votre question en une phrase, puis en trois minutes.</li><li>Connaissez trois travaux auxquels votre projet répond, et en quoi le vôtre diffère.</li><li>Soyez prêt·e sur la méthode : pourquoi ces sources et cette approche, et que feriez-vous si l’accès échouait.</li><li>Nommez simplement les limites et l’éthique : les jurys font confiance aux candidats qui les voient.</li><li>Dites précisément pourquoi ce département, ces directeurs et ce programme.</li><li>Préparez deux questions à vous : sur l’encadrement, la formation à la recherche, la promotion.</li><li>Entraînez-vous une fois à voix haute, avec un ami ou avec un enregistrement de Scriba. Les entretiens ont souvent lieu en ligne : testez la caméra, la lumière et le son la veille.</li></ul><p>C’est une conversation sur votre projet, pas un examen de tout ce que vous savez.</p>'] },
    { id: 'page', icon: '🔎', t: ['Reading a programme page in ten minutes', 'Lire la page d’un programme en dix minutes'], b: [
      '<ol><li>The deadline, and whether there is more than one.</li><li>What to submit: the proposal’s length and form, written work, the number of references.</li><li>Entry requirements, English language included.</li><li>Funding: at Oxford, applying by the December or January deadline usually brings consideration for most scholarships with no separate form; check the course’s own funding section.</li><li>The admissions contact, for anything the page does not answer.</li></ol><p>Note each answer on the programme’s card under Applications, so you never read the page twice for the same thing.</p>',
      '<ol><li>La date limite, et s’il y en a plus d’une.</li><li>Ce qu’il faut envoyer : la longueur et la forme de la proposition, les travaux écrits, le nombre de références.</li><li>Les conditions d’admission, y compris la langue anglaise.</li><li>Le financement : à Oxford, candidater avant la date limite de décembre ou de janvier vaut en général examen pour la plupart des bourses, sans formulaire à part ; vérifiez la partie financement du programme.</li><li>Le contact des admissions, pour tout ce que la page ne dit pas.</li></ol><p>Notez chaque réponse sur la fiche du programme dans Candidatures, pour ne jamais relire la page pour la même chose.</p>'] }
  ];
  function openGuide(id) {
    var g = GUIDES.filter(function (x) { return x.id === id; })[0]; if (!g) return;
    var k = fr() ? 1 : 0, old = D.getElementById('cdx-sheet'); if (old) old.remove();
    var w = D.createElement('div'); w.id = 'cdx-sheet'; w.className = 'cdx-sheet cdx';
    w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-labelledby', 'cdx-sheet-t');
    w.innerHTML = '<div class="cdx-card"><h2 id="cdx-sheet-t">' + g.icon + ' ' + esc(g.t[k]) + '</h2>' + g.b[k] + '<div class="cdx-keys" style="justify-content:flex-end;margin-top:6px">'
      + (id === 'email' || id === 'referee' ? '<button type="button" class="cdx-key" data-copy="1">' + T('Copy the model', 'Copier le modèle') + '</button>' : '')
      + '<button type="button" class="cdx-key cdx-main" data-close="1">' + T('Close', 'Fermer') + '</button></div></div>';
    function close() { try { w.remove(); } catch (e) {} D.removeEventListener('keydown', esc1, true); }
    function esc1(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
    w.addEventListener('click', function (e) {
      if (e.target === w || (e.target.closest && e.target.closest('[data-close]'))) { close(); return; }
      var cp = e.target.closest && e.target.closest('[data-copy]');
      if (cp) { var pre = w.querySelector('pre'), txt = pre ? pre.textContent : w.querySelector('.cdx-card').innerText; try { navigator.clipboard.writeText(txt); cp.textContent = T('Copied ✓', 'Copié ✓'); } catch (x) {} }
    });
    D.addEventListener('keydown', esc1, true);
    D.body.appendChild(w);
    try { w.querySelector('[data-close]').focus(); } catch (e) {}
  }
  function helpCard() {
    return '<section class="cdx-card cdx-rise"><p class="cdx-kick">' + T('Help at hand', 'De l’aide à portée de main') + '</p><div class="cdx-keylist">'
      + GUIDES.map(function (g) { return '<button type="button" class="cdx-key wide" data-guide="' + g.id + '"><i>' + g.icon + '</i><span>' + esc(g.t[fr() ? 1 : 0]) + '</span></button>'; }).join('') + '</div></section>';
  }

  // ---------- the Clepsydra ----------
  function begin() {
    try { if (typeof openPomodoro === 'function') openPomodoro(); } catch (e) {}
    try { if (typeof pomoStart === 'function' && !(typeof pomo !== 'undefined' && pomo && pomo.running)) pomoStart(); } catch (e) {}
  }

  // ---------- Candidatus · Overview ----------
  var ui = { breaking: null, foldLater: true, say: '' };
  function nextCard() {
    var it = pickNext(), c = C();
    if (!it) return '<section class="cdx-card cdx-next cdx-rise"><p class="cdx-kick">' + T('Your next step', 'Votre prochaine étape') + '</p><h3 class="cdx-h">' + T('Nothing is waiting.', 'Rien n’attend.') + '</h3><p class="cdx-why">'
      + T('Add a step to Now, or choose one from the Proposal: the smallest one is a good beginning.', 'Ajoutez une étape à Maintenant, ou choisissez-en une dans la Proposition : la plus petite est un bon début.') + '</p>'
      + '<div class="cdx-keys"><button type="button" class="cdx-key cdx-main" data-go="proposal">' + T('Open the Proposal', 'Ouvrir la Proposition') + '</button></div></section>';
    var steps = it.steps || [], breaking = ui.breaking === it.id;
    var h = '<section class="cdx-card cdx-next cdx-rise" data-item="' + it.id + '"><p class="cdx-kick">' + T('Your next step', 'Votre prochaine étape') + '</p><h3 class="cdx-h">' + esc(title(it)) + '</h3>'
      + '<p class="cdx-why"><span class="cdx-tag">' + esc(kindOf(it)) + '</span><span class="cdx-tag">' + size(it.mins) + '</span><button type="button" class="cdx-key chip" data-mins="' + it.id + '" title="' + T('Change the time', 'Changer la durée') + '">⏱ ' + mins(it.mins) + '</button></p>'
      + '<div class="cdx-keys"><button type="button" class="cdx-key cdx-main" data-begin="1">▶ ' + T('Begin, with the Clepsydra', 'Commencer, avec la Clepsydre') + '</button>'
      + '<button type="button" class="cdx-key" data-break="' + it.id + '">✂ ' + T('Break it into smaller steps', 'La découper en petites étapes') + '</button>'
      + '<button type="button" class="cdx-key" data-skip="1">↷ ' + T('Another step', 'Une autre étape') + '</button>'
      + '<button type="button" class="cdx-key" data-done="' + it.id + '">✓ ' + T('Done', 'Fait') + '</button></div>';
    if (breaking) {
      var pre = steps.length ? steps.map(function (s) { return s.t; }) : suggest(it);
      h += '<div class="cdx-steps" data-editor="' + it.id + '">' + [0, 1, 2, 3, 4].map(function (k) { return '<div style="margin:4px 0"><input class="cdx-in" data-step-in="' + k + '" value="' + esc(pre[k] || '') + '" placeholder="' + T('A smaller step', 'Une plus petite étape') + '"></div>'; }).join('')
        + '<div class="cdx-keys" style="margin-top:8px"><button type="button" class="cdx-key cdx-main small" data-keep-steps="' + it.id + '">' + T('Keep these steps', 'Garder ces étapes') + '</button><button type="button" class="cdx-key small" data-cancel-steps="1">' + T('Cancel', 'Annuler') + '</button></div></div>';
    } else if (steps.length) {
      h += '<div class="cdx-steps">' + steps.map(function (s, k) { return '<button type="button" class="cdx-step' + (s.done ? ' on' : '') + '" data-step="' + it.id + ':' + k + '" aria-pressed="' + !!s.done + '"><span class="cdx-box' + (s.done ? ' on' : '') + '" aria-hidden="true">✓</span><span>' + esc(s.t) + '</span></button>'; }).join('')
        + (steps.every(function (s) { return s.done; }) ? '<p class="cdx-say" style="margin-top:6px">' + T('Every small step is done. Mark the whole step done when it feels done.', 'Chaque petite étape est faite. Marquez l’étape entière faite quand elle vous semble finie.') + '</p>' : '') + '</div>';
    }
    return h + '</section>';
  }
  function itemHtml(id, col) {
    var it = C().items[id]; if (!it) return '';
    var meta = esc(kindOf(it)) + ' · ' + (it.mins || 25) + ' min';
    var left = col === 'now' ? null : col === 'next' ? 'now' : 'next', right = col === 'later' ? null : col === 'now' ? 'next' : 'later';
    var arr = ui.arrive === id ? ' cdx-arrive' : '';
    return '<div class="cdx-item' + arr + '" draggable="true" tabindex="0" data-id="' + id + '"><b>' + esc(title(it)) + '</b><span>' + meta + '</span><div class="cdx-acts">'
      + '<button type="button" class="cdx-x go" data-done="' + id + '" title="' + T('Done', 'Fait') + '" aria-label="' + T('Done', 'Fait') + '">✓</button>'
      + (left ? '<button type="button" class="cdx-x" data-move="' + id + ':' + left + '" title="' + T('Move to ', 'Déplacer vers ') + colName(left) + '" aria-label="' + T('Move to ', 'Déplacer vers ') + colName(left) + '">‹</button>' : '')
      + (right ? '<button type="button" class="cdx-x" data-move="' + id + ':' + right + '" title="' + T('Move to ', 'Déplacer vers ') + colName(right) + '" aria-label="' + T('Move to ', 'Déplacer vers ') + colName(right) + '">›</button>' : '')
      + '<button type="button" class="cdx-x" data-remove="' + id + '" title="' + T('Take off the board', 'Retirer du tableau') + '" aria-label="' + T('Take off the board', 'Retirer du tableau') + '">×</button></div></div>';
  }
  function colName(k) { return { now: T('Now', 'Maintenant'), next: T('Next', 'Ensuite'), later: T('Later', 'Plus tard') }[k]; }
  function board() {
    var c = C(), h = '<section class="cdx-board cdx-rise" data-cdx="board">';
    ['now', 'next', 'later'].forEach(function (k) {
      var ids = c.board[k], shown = ids, more = 0;
      if (k === 'later' && ui.foldLater && ids.length > 3) { shown = ids.slice(0, 2); more = ids.length - 2; }
      h += '<div class="cdx-col ' + k + '" data-col="' + k + '"><h4>' + colName(k) + ' <small>' + (k === 'now' ? T(ids.length + ' of 3 at most', ids.length + ' sur 3 au plus') : ids.length) + '</small></h4>'
        + shown.map(function (id) { return itemHtml(id, k); }).join('')
        + (more ? '<button type="button" class="cdx-more" data-unfold="1">+ ' + T(more + ' more, folded away', more + ' de plus, repliées') + '</button>' : '')
        + ((k !== 'now' || ids.length < 3) ? '<form class="cdx-add" data-add="' + k + '"><input aria-label="' + T('Add a step to ', 'Ajouter une étape à ') + colName(k) + '" placeholder="' + T('Add a step', 'Ajouter une étape') + '" maxlength="140"><button type="submit" class="cdx-key small" title="' + T('Add', 'Ajouter') + '" aria-label="' + T('Add', 'Ajouter') + '">+</button></form>' : '<p class="cdx-cap cap3">' + T('Now holds three at most: finish or move one first.', 'Maintenant en tient trois au plus : finissez-en ou déplacez-en une d’abord.') + '</p>')
        + '</div>';
    });
    return h + '</section>' + (ui.say ? '<p class="cdx-say" role="status">' + esc(ui.say) + '</p>' : '');
  }
  function road() {
    var progs = state.programs || [], ms = cd().milestones;
    var all = [{ label: T('Choose the programmes', 'Choisir les programmes'), done: progs.length > 0, sub: progs.length ? T('done', 'fait') : T('add them in Applications', 'à ajouter dans Candidatures'), go: 'applications' }];
    ms.forEach(function (m) { all.push({ label: TR(m.label), done: !!m.done, date: m.date, go: 'milestones' }); });
    var offer = progs.some(function (p) { return p && p.outcome && String(p.outcome).indexOf('Offer') !== -1; });
    all.push({ label: T('Interview, then the offer', 'L’entretien, puis l’offre'), done: offer, sub: offer ? T('an offer is in', 'une offre est arrivée') : T('spring, usually', 'au printemps, en général'), go: 'applications' });
    all.forEach(function (s, i) { s.n = i + 1; });
    var here = -1; all.forEach(function (s, i) { if (here < 0 && !s.done) here = i; });
    var doneN = all.filter(function (s) { return s.done; }).length, n = all.length;
    // seven stations at most: the first and the last, and five around where you are
    var st = all;
    if (n > 7) {
      var mid = all.slice(1, n - 1), h = here < 0 ? mid.length - 1 : Math.max(0, here - 1);
      var start = Math.max(0, Math.min(h - 1, mid.length - 5));
      st = [all[0]].concat(mid.slice(start, start + 5), [all[n - 1]]);
    }
    var hs = here < 0 ? st.length - 1 : st.indexOf(all[here]);
    var f = st.length > 1 ? (Math.max(0, hs) / (st.length - 1)).toFixed(3) : 0, f0 = LAST['road'] != null && !still() ? LAST['road'] : (still() ? f : 0);
    return '<section class="cdx-card cdx-road cdx-rise"><p class="cdx-kick">' + T('The road to the offer', 'Le chemin jusqu’à l’offre') + '</p><div class="cdx-line" style="--n:' + st.length + '"><i class="cdx-fill" style="--f:' + f0 + '" data-to="' + f + '" data-k="road"></i>'
      + st.map(function (s) {
        return '<button type="button" class="cdx-stop' + (s.done ? ' done' : '') + (s === all[here] ? ' here' : '') + '" data-go="' + s.go + '"><div class="cdx-dot">' + (s.done ? '✓' : s.n) + '</div><b>' + esc(s.label) + '</b><span>' + esc(s.done ? T('done', 'fait') : (s.sub || whenDate(s.date))) + '</span></button>';
      }).join('') + '</div><p class="cdx-cap" style="text-align:right;margin-top:10px">' + T(doneN + ' of ' + n + ' stations behind you', doneN + (doneN > 1 ? ' étapes' : ' étape') + ' sur ' + n + ' derrière vous') + '</p></section>';
  }
  function whenDate(date) {
    var dl = null; try { dl = milestoneDaysUntil(date); } catch (e) {}
    if (dl == null) return T('set a date', 'choisir une date');
    if (dl < 0) return T('date passed: move it when it suits you', 'date passée : à déplacer quand cela vous convient');
    if (dl === 0) return T('today', 'aujourd’hui');
    if (dl < 14) return T('in ' + dl + (dl === 1 ? ' day' : ' days'), 'dans ' + dl + (dl === 1 ? ' jour' : ' jours'));
    if (dl < 70) return T('in about ' + Math.round(dl / 7) + ' weeks', 'dans environ ' + Math.round(dl / 7) + ' semaines');
    try { return fmtMilestoneDate(date); } catch (e) { return date; }
  }
  function rings() {
    var secs = sections(), doneSubs = 0, totalSubs = 0;
    secs.forEach(function (s) { if (s.subsections && s.subsections.length) { totalSubs += s.subsections.length; doneSubs += s.subsections.filter(function (x) { return x.done; }).length; } else { totalSubs += 1; if (s.done) doneSubs += 1; } });
    var progs = state.programs || [], sent = progs.filter(function (p) { return p && (p.bucket === 'review' || p.bucket === 'decided'); }).length;
    var f = cd().funding, v = cd().visa, fd = f.filter(function (x) { return x.done; }).length, vd = v.filter(function (x) { return x.done; }).length;
    var tline = ''; try { tline = cdPropTargetLine(true); } catch (e) {}
    var R = function (go, frac, colour, name, line, k) { return '<button type="button" class="cdx-card cdx-ring" data-go="' + go + '">' + ring(frac, colour, k) + '<div><b>' + name + '</b><span>' + line + '</span></div></button>'; };
    return '<section class="cdx-rings cdx-rise">'
      + R('proposal', totalSubs ? doneSubs / totalSubs : 0, 'var(--cx-blue)', T('Proposal', 'Proposition'), doneSubs + T(' of ', ' sur ') + totalSubs + esc(tline), 'r-prop')
      + R('applications', progs.length ? sent / progs.length : 0, '#7fb3a0', T('Applications', 'Candidatures'), T(sent + ' of ' + progs.length + ' submitted', sent + ' sur ' + progs.length + ' envoyées'), 'r-apps')
      + R('milestones', f.length ? fd / f.length : 0, 'var(--cx-gold)', T('Funding', 'Financement'), T(fd + ' of ' + f.length + ' schemes checked', fd + ' sur ' + f.length + ' financements vérifiés'), 'r-fund')
      + R('milestones', v.length ? vd / v.length : 0, '#9db7d3', T('Visa', 'Visa'), vd ? T(vd + ' of ' + v.length + ' done', vd + ' sur ' + v.length + ' faits') : T('not yet: after the offer', 'pas encore : après l’offre'), 'r-visa')
      + '</section>';
  }
  function weekStart() { var d = new Date(); d.setHours(0, 0, 0, 0); var wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return d.getTime(); }
  function doneCard() {
    var c = C(), since = weekStart(), list = c.done.filter(function (d) { return d.at >= since; });
    var body = list.length ? '<ul class="cdx-list">' + list.slice(0, 6).map(function (d) { return '<li><i>✓</i><span>' + esc(d.t) + '</span></li>'; }).join('') + '</ul>' + (list.length > 6 ? '<p class="cdx-cap">' + T('and ' + (list.length - 6) + ' more', 'et ' + (list.length - 6) + ' de plus') + '</p>' : '')
      : '<p class="cdx-note">' + T('Nothing yet this week, and that is fine. The first small step counts.', 'Rien encore cette semaine, et c’est très bien. La première petite étape compte.') + '</p>';
    return '<section class="cdx-card cdx-rise"><p class="cdx-kick">' + T('Done this week', 'Fait cette semaine') + '</p>' + body + '<p class="cdx-cap">' + T('Each step counts. No streaks, nothing to lose.', 'Chaque étape compte. Pas de série, rien à perdre.') + '</p></section>';
  }
  function parkCard() {
    var c = C();
    return '<section class="cdx-card cdx-rise"><p class="cdx-kick">' + T('Parked for later', 'Mis de côté') + '</p>'
      + (c.parked.length ? '<ul class="cdx-list">' + c.parked.map(function (p) { return '<li><i>💭</i><span>' + esc(p.t) + '</span><button type="button" class="cdx-x" data-unpark="' + p.id + '" title="' + T('Bring it back, to Later', 'Le reprendre, dans Plus tard') + '" aria-label="' + T('Bring it back, to Later', 'Le reprendre, dans Plus tard') + '">↩</button><button type="button" class="cdx-x" data-forget="' + p.id + '" title="' + T('Let it go', 'L’oublier') + '" aria-label="' + T('Let it go', 'L’oublier') + '">×</button></li>'; }).join('') + '</ul>' : '')
      + '<form class="cdx-add" data-park="1"><input aria-label="' + T('Park a thought', 'Mettre une pensée de côté') + '" placeholder="' + T('Park a thought that pulls you away…', 'Mettre de côté une pensée qui vous détourne…') + '" maxlength="200"><button type="submit" class="cdx-key small" title="' + T('Park it', 'La mettre de côté') + '" aria-label="' + T('Park it', 'La mettre de côté') + '">+</button></form>'
      + '<p class="cdx-cap">' + T('A thought that pulls you away waits here, safe, until you choose it.', 'Une pensée qui vous détourne attend ici, en sûreté, jusqu’à ce que vous la choisissiez.') + '</p></section>';
  }
  function renderCand() {
    var root = D.getElementById('cand-overview'); if (!root || demo()) return false;
    seed(); sync();
    var h = '<div class="cdx" id="cdx-cand">'
      + '<div class="cdx-row">' + nextCard() + energyCard(resumeLine()) + '</div>'
      + board() + road() + rings()
      + '<div class="cdx-row3">' + doneCard() + parkCard() + helpCard() + '</div></div>';
    root.innerHTML = h;
    var k = 0; [].forEach.call(root.querySelectorAll('.cdx-rise'), function (n) { n.style.animationDelay = (k++ * 0.05).toFixed(2) + 's'; });
    try { root.appendChild(buildGuideCard('🖊️  ' + TR('How Candidatus works'), (typeof tr === 'function' ? tr('gb.candBody', 'The application itself: the programmes you are applying to, the proposal and its sections, the milestones with their dates, and the funding and visa checklists. Open Milestones first; it lays out the whole cycle so nothing surprises you later.') : ''), null, 0)); } catch (e) {}
    wire(root, renderCand);
    settle(root); ui.arrive = null;
    return true;
  }
  W.__cdxCand = function () { try { return renderCand(); } catch (e) { try { console.warn('Candidatus overview', e); } catch (x) {} return false; } };

  // ---------- the Overview (Home) ----------
  function nextOnAgenda(dStr) {
    try {
      var wd = weekdayFor(dStr), found = null;
      ['pre', 'morning', 'afternoon', 'evening'].some(function (k) { var b = wd[k]; if (b && b.tasks) { var t = b.tasks.filter(function (t) { return !isDone(dStr, b.id, t.id); })[0]; if (t) { found = t; return true; } } return false; });
      return found;
    } catch (e) { return null; }
  }
  function renderOv() {
    var root = D.getElementById('overview-body'); if (!root) return false;
    var dStr = state.selectedDateStr, d = null; try { d = parseDate(dStr) || new Date(); } catch (e) { d = new Date(); }
    var cards = [];
    // today
    var today = '<section class="cdx-card cdx-rise" data-cdx="today"><p class="cdx-kick">' + T('Today', 'Aujourd’hui') + '</p>';
    var dateTxt = ''; try { dateTxt = formatLongDate(d); } catch (e) { dateTxt = d.toDateString(); }
    var work = true; try { work = isWorkday(d); } catch (e) {}
    if (work) {
      var tot = { done: 0, total: 0 }; try { tot = dayTotals(dStr); } catch (e) {}
      today += '<div class="cdx-flex"><div class="cdx-grow"><h3 class="cdx-h">' + esc(dateTxt) + '</h3><div class="cdx-big"><b data-count="' + tot.done + '">' + tot.done + '</b><span>' + T('of ' + tot.total + ' tasks done', (tot.done > 1 ? 'tâches faites sur ' : 'tâche faite sur ') + tot.total) + '</span></div></div>' + ring(tot.total ? tot.done / tot.total : 0, 'var(--cx-blue)', 'r-today') + '</div><div class="cdx-parts">';
      var tints = ['var(--cx-sky)', 'var(--cx-butter)', 'var(--cx-sage)', 'var(--cx-cream)'], ti = 0;
      try {
        var wd = weekdayFor(dStr);
        ['pre', 'morning', 'afternoon', 'evening'].forEach(function (key) {
          var block = wd[key]; if (!block) return; var bp = blockProgress(dStr, block); if (!bp.total) return;
          today += '<button type="button" class="cdx-part" data-section="schedule" style="background:' + tints[ti++ % 4] + '"><b>' + (bp.done === bp.total ? '✓ ' : '') + esc(TR(block.title)) + '</b><span>' + bp.done + ' / ' + bp.total + '</span>' + bar(bp.done / bp.total * 100, 'b-' + key) + '</button>';
        });
      } catch (e) {}
      today += '</div>';
    } else {
      today += '<h3 class="cdx-h">' + esc(dateTxt) + '</h3><p class="cdx-note">' + T('🍃 A rest day. Nothing is owed, and the streak is safe.', '🍃 Un jour de repos. Rien n’est dû, et la série est sauve.') + '</p>';
    }
    today += '<div class="cdx-keys"><button type="button" class="cdx-key cdx-main" data-section="schedule">' + T('Open the Agenda', 'Ouvrir l’Agenda') + ' →</button></div></section>';
    var nx = work ? nextOnAgenda(dStr) : null, nxt = '';
    if (nx) nxt = '<div class="cdx-resume"><span>' + T('Next on the Agenda: ', 'Ensuite à l’Agenda : ') + '<b>' + esc(TR(nx.title)) + '</b>' + (nx.time ? ' · ' + esc(nx.time) : '') + '</span><button type="button" class="cdx-key small" data-begin="1">▶ ' + T('Begin', 'Commencer') + '</button></div>';
    else if (work) nxt = '<div class="cdx-resume"><span>' + T('The day’s plan is complete. Well done.', 'Le programme du jour est terminé. Bravo.') + '</span></div>';
    cards.push('<div class="cdx-row">' + today + energyCard(nxt) + '</div>');
    // Ascensus, reading, French
    var trio = '<div class="cdx-trio">';
    trio += '<section class="cdx-card butter cdx-rise cdx-ov-asc" data-cdx="asc"></section>';
    var streak = 0; try { streak = computeStreak(); } catch (e) {}
    var cur = null; try { cur = curriculumCurrentOffline(); } catch (e) {}
    trio += '<section class="cdx-card sky cdx-rise"><p class="cdx-kick">' + T('Reading & streak', 'Lecture et série') + '</p><div class="cdx-big"><b data-count="' + streak + '">' + streak + '</b><span>' + T('workday streak', streak > 1 ? 'jours de travail d’affilée' : 'jour de travail d’affilée') + ' 🔥</span></div>';
    if (!cur) trio += '<p class="cdx-note">' + T('✨ The curriculum is complete.', '✨ Le cursus est terminé.') + '</p>';
    else trio += '<p class="cdx-quote">' + esc(cur.title) + '</p><p class="cdx-note" style="margin:0">' + T('Module ' + cur.n + ' of ' + cur.total + ' · ' + cur.checkpointsDone + ' of ' + cur.checkpointsTotal + ' checkpoints', 'Module ' + cur.n + ' sur ' + cur.total + ' · ' + cur.checkpointsDone + (cur.checkpointsDone > 1 ? ' étapes' : ' étape') + ' sur ' + cur.checkpointsTotal) + '</p>' + bar(cur.checkpointsTotal ? cur.checkpointsDone / cur.checkpointsTotal * 100 : 0, 'b-cur');
    trio += '<div class="cdx-keys" style="margin-top:12px"><button type="button" class="cdx-key" data-section="curriculum">' + T('Open the Curriculum', 'Ouvrir le Cursus') + ' →</button></div></section>';
    var fs = state.frenchStats || {}, ds = state.drillStats || {};
    var pc = function (c, t) { return t ? Math.round(100 * c / t) : null; };
    var a1 = pc(fs.correct || 0, fs.total || 0), a2 = pc(ds.correct || 0, ds.total || 0);
    var mods = 0; try { mods = Object.keys(typeof FRENCH_MODULE_LESSONS !== 'undefined' ? FRENCH_MODULE_LESSONS : {}).length; } catch (e) {}
    var meter = function (name, v, c, t, k) { return '<div class="cdx-meter"><b>' + name + '</b><span>' + (v == null ? T('not begun yet', 'pas encore commencé') : v + ' % · ' + c + T(' of ', ' sur ') + t) + '</span>' + bar(v || 0, k) + '</div>'; };
    trio += '<section class="cdx-card sage cdx-rise"><p class="cdx-kick">' + T('French', 'Français') + '</p>' + meter(T('Tutor accuracy', 'Justesse avec le tuteur'), a1, fs.correct || 0, fs.total || 0, 'b-fr1') + meter(T('Writing drills', 'Exercices d’écriture'), a2, ds.correct || 0, ds.total || 0, 'b-fr2')
      + (mods ? '<p class="cdx-cap">' + T(mods + ' French modules carry a lesson, with a French shelf in the Library.', mods + ' modules de français portent une leçon, avec un rayon français dans la Bibliothèque.') + '</p>' : '') + '<div class="cdx-keys" style="margin-top:10px"><button type="button" class="cdx-key" data-french="1">' + T('Open the French Tutor', 'Ouvrir le Tuteur de français') + ' →</button></div></section>';
    cards.push(trio + '</div>');
    // the proposal (not in the demonstrations)
    if (!demo()) {
    var secs = sections(), doneSubs = 0, totalSubs = 0;
    secs.forEach(function (s) { if (s.subsections && s.subsections.length) { totalSubs += s.subsections.length; doneSubs += s.subsections.filter(function (x) { return x.done; }).length; } else { totalSubs += 1; if (s.done) doneSubs += 1; } });
    var today0 = new Date(); today0.setHours(0, 0, 0, 0);
    var tgt = null; try { tgt = parseDate(state.proposalTarget); } catch (e) {}
    var days = tgt ? Math.round((tgt - today0) / 864e5) : null, fmt = function (x) { try { return cdPropDateFmt(x); } catch (e) { return x; } };
    var tl = days == null ? T('No target date is set. Choose one if and when it suits you.', 'Aucune date n’est fixée. Choisissez-en une si et quand cela vous convient.')
      : days >= 0 ? T(days + (days === 1 ? ' day' : ' days') + ' to the first full draft · target ' + fmt(state.proposalTarget) + '.', days + (days === 1 ? ' jour' : ' jours') + ' avant le premier brouillon complet · objectif ' + fmt(state.proposalTarget) + '.')
      : T('The date you chose (' + fmt(state.proposalTarget) + ') has passed. Choose a new one when it suits you, or clear it.', 'La date choisie (' + fmt(state.proposalTarget) + ') est passée. Choisissez-en une nouvelle quand cela vous convient, ou effacez-la.');
    var nxs = null; try { seed(); sync(); nxs = pickNext(); } catch (e) {}
    cards.push('<section class="cdx-card cdx-rise" data-cdx="proposal"><p class="cdx-kick">' + T('The proposal', 'La proposition') + '</p><div class="cdx-flex">' + ring(totalSubs ? doneSubs / totalSubs : 0, 'var(--cx-blue)', 'r-ovprop')
      + '<div class="cdx-grow">' + (state.proposalTitle ? '<p class="cdx-quote">' + esc(state.proposalTitle) + '</p>' : '') + '<p class="cdx-note" style="margin:0 0 4px">' + T(doneSubs + ' of ' + totalSubs + ' items done.', doneSubs + (doneSubs > 1 ? ' éléments faits' : ' élément fait') + ' sur ' + totalSubs + '.') + ' ' + esc(tl) + '</p>'
      + (nxs ? '<p class="cdx-note" style="margin:0">' + T('Your next step: ', 'Votre prochaine étape : ') + '<b>' + esc(title(nxs)) + '</b> · ' + mins(nxs.mins) + '</p>' : '') + '</div></div>'
      + '<div class="cdx-keys" style="margin-top:12px"><button type="button" class="cdx-key cdx-main" data-cand="1">' + T('Open Candidatus', 'Ouvrir Candidatus') + ' →</button>' + (nxs ? '<button type="button" class="cdx-key" data-begin="1">▶ ' + T('Begin the next step', 'Commencer la prochaine étape') + '</button>' : '')
      + '<button type="button" class="cdx-key" data-propdate="1">' + (days == null ? T('Choose a date', 'Choisir une date') : T('Change or clear the date', 'Modifier ou effacer la date')) + ' →</button></div></section>');
    }
    root.innerHTML = '<div class="cdx" id="cdx-ov">' + cards.join('') + '</div>';
    // Ascensus: the app's own card, inside ours
    try {
      var host = root.querySelector('[data-cdx="asc"]');
      renderOverviewAscentPanel(function (emoji, ttl) { host.innerHTML = '<p class="cdx-kick">' + esc(ttl) + '</p>'; return host; });
      host.classList.remove('glass'); host.style.padding = '';
      if (!host.children.length || host.children.length < 2) host.innerHTML = '<p class="cdx-kick">Ascensus</p><p class="cdx-note">' + T('Your rank and its labours live in Ascensus.', 'Votre rang et ses travaux sont dans Ascensus.') + '</p><button type="button" class="cdx-key" data-section="ascent">' + T('Open Ascensus', 'Ouvrir Ascensus') + ' →</button>';
    } catch (e) {}
    var k = 0; [].forEach.call(root.querySelectorAll('.cdx-rise'), function (n) { n.style.animationDelay = (k++ * 0.06).toFixed(2) + 's'; });
    countUp(root);
    wire(root, renderOv);
    settle(root);
    return true;
  }
  function countUp(root) {
    var still = false; try { still = D.body.getAttribute('data-motion') === 'minimal' || W.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    if (still) return;
    [].forEach.call(root.querySelectorAll('[data-count]'), function (n) {
      var to = parseInt(n.getAttribute('data-count'), 10) || 0; if (to <= 0) return;
      var t0 = performance.now(); n.textContent = '0';
      (function tick(t) { var k = Math.min(1, (t - t0) / 650), e = 1 - Math.pow(1 - k, 3); n.textContent = String(Math.round(e * to)); if (k < 1) requestAnimationFrame(tick); })(t0);
    });
  }
  W.__cdxOverview = function () { try { return renderOv(); } catch (e) { try { console.warn('Overview', e); } catch (x) {} return false; } };

  // ---------- one set of hands for both pages ----------
  function wire(root, again) {
    if (root.__cdxWired === again) return;
    root.__cdxWired = again;
    root.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('button,[data-guide]') : null; if (!t || !root.contains(t)) return;
      var c = C(), a;
      if ((a = t.getAttribute('data-energy'))) { c.pin = null; setEnergy(a); again(); return; }
      if (t.hasAttribute('data-begin')) { begin(); return; }
      if (t.hasAttribute('data-skip')) { var s = c.skip && c.skip.day === tdy() ? c.skip : { day: tdy(), n: 0 }; s.n++; c.skip = s; c.pin = null; ui.breaking = null; save(); again(); return; }
      if ((a = t.getAttribute('data-done'))) { var dn = t.closest('.cdx-item') || t.closest('.cdx-next'); leave(dn, function () { complete(a, false); ui.breaking = null; ui.say = T('Done. One step behind you.', 'Fait. Une étape derrière vous.'); save(); again(); setTimeout(function () { ui.say = ''; }, 4000); }); return; }
      if ((a = t.getAttribute('data-break'))) { ui.breaking = ui.breaking === a ? null : a; pin(a); again(); return; }
      if (t.hasAttribute('data-cancel-steps')) { ui.breaking = null; again(); return; }
      if ((a = t.getAttribute('data-keep-steps'))) { var it = c.items[a]; if (it) { var ed = root.querySelector('[data-editor="' + a + '"]'); it.steps = [].map.call(ed.querySelectorAll('[data-step-in]'), function (i) { return i.value.trim(); }).filter(Boolean).slice(0, 5).map(function (x) { return { t: x, done: false }; }); pin(a); save(); } ui.breaking = null; again(); return; }
      if ((a = t.getAttribute('data-step'))) { var p = a.split(':'), it2 = c.items[p[0]]; if (it2 && it2.steps[+p[1]]) { it2.steps[+p[1]].done = !it2.steps[+p[1]].done; pin(p[0]); save(); again(); } return; }
      if ((a = t.getAttribute('data-mins'))) { var it3 = c.items[a]; if (it3) { var L = [10, 15, 25, 45, 60], i3 = L.indexOf(it3.mins || 25); it3.mins = L[(i3 + 1) % L.length]; pin(a); save(); again(); } return; }
      if ((a = t.getAttribute('data-move')) && a.split(':')[1] === 'now' && c.board.now.indexOf(a.split(':')[0]) < 0 && c.board.now.length >= 3) { move(a.split(':')[0], 'now'); again(); return; }
      if ((a = t.getAttribute('data-move'))) { var q = a.split(':'); leave(t.closest('.cdx-item'), function () { move(q[0], q[1]); if (ui.say === '') ui.arrive = q[0]; again(); }); return; }
      if ((a = t.getAttribute('data-remove'))) { leave(t.closest('.cdx-item'), function () { removeFromBoard(a); delete c.items[a]; save(); again(); }); return; }
      if (t.hasAttribute('data-unfold')) { ui.foldLater = false; again(); return; }
      if ((a = t.getAttribute('data-unpark'))) { var pk = c.parked.filter(function (x) { return x.id === a; })[0]; if (pk) { leave(t.closest('li'), function () { c.parked = c.parked.filter(function (x) { return x.id !== a; }); ui.arrive = addItem('later', pk.t, null, 25); save(); again(); }); } return; }
      if ((a = t.getAttribute('data-forget'))) { leave(t.closest('li'), function () { c.parked = c.parked.filter(function (x) { return x.id !== a; }); save(); again(); }); return; }
      if ((a = t.getAttribute('data-guide'))) { openGuide(a); return; }
      if (t.hasAttribute('data-resume')) { var l = c.last; if (l) { try { candUI.tab = l.tab; if (l.sec) candUI.propOpen = l.sec; renderCandidature(); } catch (x) {} } return; }
      if ((a = t.getAttribute('data-go'))) { try { if (typeof candUI !== 'undefined') { if (D.getElementById('section-applications') && D.getElementById('section-applications').classList.contains('hidden')) showSection('applications'); candUI.tab = a; renderCandidature(); } } catch (x) {} return; }
      if ((a = t.getAttribute('data-section'))) { try { showSection(a); } catch (x) {} return; }
      if (t.hasAttribute('data-french')) { try { if (typeof openFrench === 'function') openFrench(); } catch (x) {} return; }
      if (t.hasAttribute('data-cand')) { try { showSection('applications'); candUI.tab = 'overview'; renderCandidature(); } catch (x) {} return; }
      if (t.hasAttribute('data-propdate')) { try { openProposalDetails(); } catch (x) {} return; }
    });
    root.addEventListener('submit', function (e) {
      var f = e.target; if (!f || !f.matches || !f.matches('form')) return; e.preventDefault();
      var inp = f.querySelector('input'), v = inp ? inp.value.trim() : ''; if (!v) return;
      var c = C(), col = f.getAttribute('data-add');
      if (col) { if (col === 'now' && c.board.now.length >= 3) { ui.say = T('Now holds three at most: finish or move one first.', 'Maintenant en tient trois au plus : finissez-en ou déplacez-en une d’abord.'); again(); return; } ui.arrive = addItem(col, v, null, 25); save(); again(); refocus(root, '[data-add="' + col + '"] input'); return; }
      if (f.hasAttribute('data-park')) { c.parked.unshift({ id: uid(), t: v, at: Date.now() }); save(); again(); refocus(root, '[data-park] input'); }
    });
    // dragging a step from one column to another
    var dragId = null;
    root.addEventListener('dragstart', function (e) { var it = e.target.closest && e.target.closest('.cdx-item'); if (!it) return; dragId = it.getAttribute('data-id'); it.classList.add('dragging'); try { e.dataTransfer.setData('text/plain', dragId); e.dataTransfer.effectAllowed = 'move'; } catch (x) {} });
    root.addEventListener('dragend', function (e) { var it = e.target.closest && e.target.closest('.cdx-item'); if (it) it.classList.remove('dragging'); [].forEach.call(root.querySelectorAll('.cdx-col.drop'), function (c) { c.classList.remove('drop'); }); });
    root.addEventListener('dragover', function (e) { var col = e.target.closest && e.target.closest('.cdx-col'); if (!col || !dragId) return; e.preventDefault(); [].forEach.call(root.querySelectorAll('.cdx-col.drop'), function (c) { if (c !== col) c.classList.remove('drop'); }); col.classList.add('drop'); });
    root.addEventListener('drop', function (e) { var col = e.target.closest && e.target.closest('.cdx-col'); if (!col || !dragId) return; e.preventDefault(); var to = col.getAttribute('data-col'), id = dragId; dragId = null; move(id, to); if (ui.say === '') ui.arrive = id; again(); });
  }
  function pin(id) { var c = C(); if (c.items[id]) c.pin = { day: tdy(), id: id }; }
  var busy = false;
  function leave(node, then) {
    if (!node || still()) { then(); return; }
    if (busy) return; busy = true;
    node.classList.add('cdx-leave');
    setTimeout(function () { busy = false; then(); }, 190);
  }
  function refocus(root, sel) { setTimeout(function () { try { var n = root.querySelector(sel); if (n) n.focus(); } catch (e) {} }, 30); }
  function move(id, to) {
    var c = C(); if (!c.items[id] || !c.board[to]) return;
    if (to === 'now' && c.board.now.indexOf(id) < 0 && c.board.now.length >= 3) { ui.say = T('Now holds three at most: finish or move one first.', 'Maintenant en tient trois au plus : finissez-en ou déplacez-en une d’abord.'); return; }
    removeFromBoard(id); c.board[to].push(id); ui.say = ''; save();
  }

  // ---------- where you left off: watched as you move through Candidatus ----------
  function hook(name) {
    var f = W[name]; if (typeof f !== 'function' || f.__cdx) return;
    var g = function () { var r = f.apply(this, arguments); noteWhere(); return r; }; g.__cdx = 1; W[name] = g;
  }
  hook('renderCandidature'); hook('renderProposalView');
  // a language change redraws whichever of the two pages is open
  try { new MutationObserver(function () { var a = D.getElementById('cdx-cand'), b = D.getElementById('cdx-ov'); if (a && a.offsetParent) renderCand(); if (b && b.offsetParent) renderOv(); }).observe(D.documentElement, { attributes: true, attributeFilter: ['lang'] }); } catch (e) {}
  W.cdxCandidatus = { render: renderCand, overview: renderOv, energy: energy, setEnergy: setEnergy, next: pickNext, guide: openGuide };
  // a page drawn in the old design before this script arrived is drawn again
  try { var ob = D.getElementById('overview-body'); if (ob && ob.firstChild && !D.getElementById('cdx-ov')) W.__cdxOverview(); } catch (e) {}
  try { var cb = D.getElementById('cand-overview'); if (cb && cb.firstChild && !D.getElementById('cdx-cand')) W.__cdxCand(); } catch (e) {}
})();
