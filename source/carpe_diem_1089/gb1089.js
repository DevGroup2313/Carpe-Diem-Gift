/* Carpe Diem 1089 · the Guidebook in sections, and a short tour by default.
   Copyright (c) 2026 Yannie D. Forest. All rights reserved.
   The chapter list (GUIDE_NAV) and the tour's cards (DEMO_TOUR) keep every entry in its place, because the Author
   Studio keeps the owner's own edits by those places. What changes is how the Guidebook is drawn and which cards the
   tour stops at. */
(function () {
  'use strict';
  if (window.__cd1089) return;
  window.__cd1089 = 1;

  function isFr() { try { return state.lang === 'fr'; } catch (e) { return false; } }
  function T(en, fr) { return isFr() ? fr : en; }
  function bare(t) { return String(t || '').replace(/^[^A-Za-z0-9À-ɏ’']+/, '').trim(); }
  function mk(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function said(e, en, fr) { e.setAttribute('data-gb89-en', en); e.setAttribute('data-gb89-fr', fr); e.textContent = T(en, fr); return e; }
  function quiet() {
    try { if (document.body.hasAttribute('data-cd-anim-off') || document.body.getAttribute('data-motion') === 'minimal') return true; } catch (e) {}
    try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }

  /* ---------- 1. French for the sentences 1089 put right ---------- */
  // [chapter, field, [[English before, English now]...], [[French before, French now]...]]
  var DERIVED = [
    ['Installers and files', 'body',
      [['and the Fire, Mac and Windows packages.', 'and the packages for the iPhone and iPad, the Mac, the Mac mini, Windows and the Fire tablet.']],
      [['et les paquets pour la Fire, le Mac et Windows.', 'et les paquets pour l’iPhone et l’iPad, le Mac, le Mac mini, Windows et la tablette Fire.']]],
    ['Installers and files', 's:A file of your own',
      [['and the same five makers fold it.', 'and the same makers fold it.']],
      [['et les mêmes cinq fabricants le plient.', 'et les mêmes fabricants le plient.']]],
    ['The sky, and setting the day', 'body',
      [['The sky button in the top bar opens', 'Display, then Sky, opens']],
      [['Le bouton du ciel, dans la barre du haut, ouvre', 'Affichage, puis Ciel, ouvre']]],
    ['Imago, the slides', 'body',
      [['The ribbon carries Home, Insert, Design and Slides, each with named groups.', 'The ribbon carries nine tabs, from Home to View, each with named groups.'],
       ['Imago now follows the familiar slide studio closely: nine tabs from Home to View, transitions and animations,', 'It follows the familiar slide studio closely, with transitions and animations,']],
      [['Le ruban porte Accueil, Insertion, Création et Diapositives, chacun avec ses groupes nommés.', 'Le ruban porte neuf onglets, d’Accueil à Affichage, chacun avec ses groupes nommés.'],
       ['Imago suit désormais de près le studio familier : neuf onglets d’Accueil à Affichage, transitions et animations,', 'Il suit de près le studio familier, avec transitions et animations,']]],
    ['Fontes, citations', 'body', [['and it also lives inside Tabula too.', 'and it also lives inside Tabula.']], []],
    ['Tabula, the writing room', 'body',
      [['in one of five house scripts', 'in one of thirteen house scripts'],
       ['onto the page — a signature, initials, a date, a line of text — and click', 'onto the page (a signature, initials, a date, a line of text) and click']],
      [['dans l’une des cinq écritures de la maison', 'dans l’une des treize écritures de la maison']]],
    ['Your signature', 'tip',
      [['look at the thirteen hands', 'look at the seven hands']],
      [['regardez les treize mains', 'regardez les sept écritures']]]
  ];
  var NEW_FR = {
    'What is built elsewhere': 'Ce qui se construit ailleurs',
    'The apps themselves are not compiled in the page. The Mac, Mac mini, Windows and Fire tablet packages carry their projects, and GitHub builds the app from each: Carpe Diem.app, the Windows installer, the APK. The iPhone and iPad package arrives finished, as CarpeDiem.ipa, ready for Sideloadly, with its project beside it. A copy cannot make further copies or installers either: only a master carries its own source.':
      'Les applications elles-mêmes ne sont pas compilées dans la page. Les paquets pour le Mac, le Mac mini, Windows et la tablette Fire portent leurs projets, et GitHub construit l’application à partir de chacun : Carpe Diem.app, l’installateur Windows, l’APK. Le paquet pour l’iPhone et l’iPad arrive fini, sous la forme de CarpeDiem.ipa, prêt pour Sideloadly, avec son projet à côté. Une copie ne peut pas non plus faire d’autres copies ni d’installateurs : seule une édition maîtresse porte sa propre source.',
    'Today feels': 'Aujourd’hui, le ciel est',
    'Under the greeting, the door asks how today feels: Sunny, Windy or Gloomy, and under More, Rainy, Stormy, Hot or Night. The bright skies wake the app and its motion, the grey and the wet settle it calm and quiet, and heat slows it, keeping the deep work for the cooler hours. Tap the chosen sky again to let it go.':
      'Sous la salutation, la porte demande le ciel du jour : Soleil, Vent ou Maussade, et sous Plus, Pluie, Orage, Chaleur ou Nuit. Les ciels clairs éveillent l’application et son mouvement, le gris et la pluie l’apaisent, calme et silencieuse, et la chaleur la ralentit, gardant le travail profond pour les heures fraîches. Touchez de nouveau le ciel choisi pour le laisser s’en aller.',
    'Display': 'Affichage',
    'Opens the panel of choices for how Carpe Diem looks and behaves: the theme, light or dark; the look, Classic or Folio; depth; navigation; the frame; motion and sound; the sky of the morning door; and the supports of the Focus page. Classic is crisp and modern; Folio, Latin for a leaf and the old word for a page, is more bookish, with serif headings and a deeper blue. The theme is one switch for the whole house: change it anywhere and every open room follows, Tabula, Abacus and Imago included.':
      'Ouvre le panneau des choix sur l’apparence et la conduite de Carpe Diem : le thème, clair ou sombre ; l’apparence, Classique ou Folio ; le relief ; la navigation ; le cadre ; le mouvement et le son ; le ciel de la porte du matin ; et les aides de la page Concentration. Classique est net et moderne ; Folio, mot latin pour la feuille et ancien nom de la page, est plus livresque, avec des titres à empattement et un bleu plus profond. Le thème est un seul interrupteur pour toute la maison : changez-le n’importe où et chaque salle ouverte suit, Tabula, Abacus et Imago compris.',
    'Guide and About': 'Guide et À propos',
    'Guide opens this Guidebook. About tells who made Carpe Diem, and its last line names the build you are running.':
      'Guide ouvre ce Guide. À propos dit qui a fait Carpe Diem, et sa dernière ligne nomme la version que vous utilisez.',
    'In the Forge, drawn stroke by stroke': 'Dans la Forge, tracées trait par trait',
    'The seven hands of the Forge, below, are not fonts. Carpe Diem draws each letter itself, stroke by stroke, from a set of parameters for slant, nib, weight, join and flourish. That is why such a hand looks the same on every machine and needs nothing installed, and why it can letter any name rather than only a scan of one. The thirteen house scripts of the panel are written with the lettering your device has, so they can differ a little from one machine to another.':
      'Les sept écritures de la Forge, ci-dessous, ne sont pas des polices. Carpe Diem trace lui-même chaque lettre, trait par trait, à partir de réglages d’inclinaison, de plume, de graisse, de liaison et de fioriture. C’est pourquoi une telle écriture paraît la même sur chaque machine sans rien à installer, et pourquoi elle peut lettrer n’importe quel nom plutôt que la seule numérisation d’un nom. Les treize écritures de la maison, dans le panneau, sont écrites avec les polices de votre appareil ; elles peuvent donc différer un peu d’une machine à l’autre.'
  };
  // the Surfaces chapter (Editing the app from inside it), which carried no French
  var SURFACES_FR = {
    "Editing the app from inside it":
      "Modifier l\u2019app de l\u2019int\u00e9rieur",
    "Carpe Diem can be re-worded and re-arranged from within the app itself, and what you change is kept. Nothing here needs a computer, a connection, or anyone else. Every control is listed below so you never have to remember where a thing lives.":
      "Carpe Diem peut \u00eatre reformul\u00e9 et r\u00e9organis\u00e9 depuis l\u2019app elle-m\u00eame, et ce que vous changez est gard\u00e9. Rien ici n\u2019a besoin d\u2019un ordinateur, d\u2019une connexion ni de personne d\u2019autre. Chaque commande est d\u00e9crite ci-dessous, pour que vous n\u2019ayez jamais \u00e0 vous rappeler o\u00f9 se trouve une chose.",
    "Opening the Surfaces room":
      "Ouvrir la salle Surfaces",
    "Hold Alt and press S, anywhere in the app. The room also appears in the Author Studio rail, named Surfaces, whenever the Studio is open. Alt and S again closes it.":
      "Maintenez Alt et appuyez sur S, n\u2019importe o\u00f9 dans l\u2019app. La salle para\u00eet aussi dans le rail du Studio d\u2019auteur, sous le nom Surfaces, chaque fois que le Studio est ouvert. Alt et S de nouveau la ferment.",
    "What a surface is":
      "Ce qu\u2019est une surface",
    "A surface is one named group of controls. Two are ready: the Introduction door top bar, and the Home page top bar. More will be added, and they will appear in the same room without anything moving.":
      "Une surface est un groupe nomm\u00e9 de commandes. Deux sont pr\u00eates : la barre du haut de la porte d\u2019introduction, et la barre du haut de la page d\u2019Accueil. D\u2019autres viendront, et elles para\u00eetront dans la m\u00eame salle sans que rien ne bouge.",
    "The door top bar, six controls":
      "La barre du haut de la porte, six commandes",
    "At the desk, Alerts, Day or night, Classic or Folio, Motion, and Weather. Each can be renamed or hidden.":
      "\u00c0 mon bureau, Alertes, Jour ou nuit, Classique ou Folio, Mouvement et M\u00e9t\u00e9o. Chacune peut \u00eatre renomm\u00e9e ou masqu\u00e9e.",
    "The Home top bar, three controls":
      "La barre du haut de l\u2019Accueil, trois commandes",
    "Display, Guidebook, and About. Each can be renamed or hidden.":
      "Affichage, Guide et \u00c0 propos. Chacune peut \u00eatre renomm\u00e9e ou masqu\u00e9e.",
    "Renaming a control":
      "Renommer une commande",
    "Type the new wording in the field beside it and move away from the field. The change appears at once, on the button and in its tooltip. Leave the field empty to keep the original wording.":
      "Tapez la nouvelle formulation dans le champ \u00e0 c\u00f4t\u00e9, puis quittez le champ. Le changement para\u00eet aussit\u00f4t, sur le bouton et dans son info-bulle. Laissez le champ vide pour garder la formulation d\u2019origine.",
    "Hiding a control":
      "Masquer une commande",
    "Clear the checkbox beside it. Tick it again to bring it back. Hiding never removes anything: the control returns exactly as it was.":
      "D\u00e9cochez la case \u00e0 c\u00f4t\u00e9. Cochez-la de nouveau pour la faire revenir. Masquer n\u2019enl\u00e8ve jamais rien : la commande revient exactement telle qu\u2019elle \u00e9tait.",
    "Undoing a bar":
      "D\u00e9faire une barre",
    "Reset this bar, at the foot of each section, returns that whole bar to how it shipped. It asks nothing and takes effect immediately, so use it freely.":
      "Le bouton \u00ab Reset this bar \u00bb, au pied de chaque section, rend toute la barre telle qu\u2019elle a \u00e9t\u00e9 livr\u00e9e. Il ne demande rien et agit aussit\u00f4t : servez-vous-en librement.",
    "Where the changes are kept":
      "O\u00f9 les changements sont gard\u00e9s",
    "In the same place the Carpe Diem\u2019s Forge keeps everything else. They survive closing the app and re-opening it, and they are included in the Studio export.":
      "Au m\u00eame endroit o\u00f9 la Forge de Carpe Diem garde tout le reste. Ils survivent \u00e0 la fermeture et \u00e0 la r\u00e9ouverture de l\u2019app, et ils sont compris dans l\u2019export du Studio.",
    "Carrying changes to another device":
      "Emporter les changements sur un autre appareil",
    "Export from the Carpe Diem\u2019s Forge to save a small file of everything you have authored. Import it on the other device, or use the Forge Bakery below, which is simpler.":
      "Exportez depuis la Forge de Carpe Diem pour enregistrer un petit fichier de tout ce que vous avez r\u00e9dig\u00e9. Importez-le sur l\u2019autre appareil, ou utilisez la Boulangerie de la Forge, ci-dessous, qui est plus simple.",
    "The Forge Bakery":
      "La Boulangerie de la Forge",
    "Open the Forge, choose a Carpe Diem file, choose the file you exported from the Studio, and press Bake. The build that downloads carries your changes inside it and plants them itself the first time it is opened, on any device, offline. This is the way to make a version of Carpe Diem that is yours.":
      "Ouvrez la Forge, choisissez un fichier Carpe Diem, choisissez le fichier export\u00e9 depuis le Studio, et lancez la cuisson (le bouton \u00ab Bake \u00bb). L\u2019\u00e9dition qui se t\u00e9l\u00e9charge porte vos changements en elle et les plante elle-m\u00eame \u00e0 sa premi\u00e8re ouverture, sur n\u2019importe quel appareil, hors ligne. C\u2019est la fa\u00e7on de faire une version de Carpe Diem qui soit la v\u00f4tre.",
    "If a change seems to disappear":
      "Si un changement semble dispara\u00eetre",
    "Changes belong to the file they were made in, because that is how a browser keeps them. Open a newly downloaded build and it begins fresh. Export before you move to a new build, or bake the new build with your export, and nothing is ever lost.":
      "Les changements appartiennent au fichier o\u00f9 ils ont \u00e9t\u00e9 faits, car c\u2019est ainsi qu\u2019un navigateur les garde. Ouvrez une \u00e9dition fra\u00eechement t\u00e9l\u00e9charg\u00e9e et elle commence \u00e0 neuf. Exportez avant de passer \u00e0 une nouvelle \u00e9dition, ou cuisez la nouvelle \u00e9dition avec votre export, et rien n\u2019est jamais perdu."
  };
  // read by the Author Studio's own translator, for text it carries and FR_TEXT does not
  function studioFr(s) { try { var w = window.__cdStudioFr; return (w && typeof w.look === 'function') ? (w.look(s) || null) : null; } catch (e) { return null; } }
  function frOf(s) { try { if (FR_TEXT[s] != null) return FR_TEXT[s]; } catch (e) {} return studioFr(s); }
  function field(it, f) {
    if (f === 'body' || f === 'tip') return { get: function () { return it[f]; } };
    var label = f.slice(2), sec = null;
    (it.sections || []).forEach(function (s) { if (s && s.label === label) sec = s; });
    return sec ? { get: function () { return sec.body; } } : null;
  }
  function teachFrench() {
    if (typeof GUIDE_NAV === 'undefined' || typeof FR_TEXT === 'undefined') return;
    for (var k in NEW_FR) if (FR_TEXT[k] == null) FR_TEXT[k] = NEW_FR[k];
    for (var k2 in SURFACES_FR) if (FR_TEXT[k2] == null) FR_TEXT[k2] = SURFACES_FR[k2];
    DERIVED.forEach(function (d) {
      var it = null;
      GUIDE_NAV.forEach(function (x) { if (x && x.title === d[0]) it = x; });
      if (!it) return;
      var fd = field(it, d[1]); if (!fd) return;
      var now = fd.get(); if (!now || FR_TEXT[now] != null) return;
      var before = now, changed = false;
      d[2].forEach(function (p) { if (before.indexOf(p[1]) >= 0) { before = before.replace(p[1], p[0]); changed = true; } });
      if (!changed) return;
      var frBefore = frOf(before); if (!frBefore) return;
      var frNow = frBefore;
      d[3].forEach(function (p) { frNow = frNow.replace(p[0], p[1]); });
      FR_TEXT[now] = frNow;
    });
    // the note on slower devices, now in Resetting the app: its French where only the Studio's translator had it
    GUIDE_NAV.forEach(function (it) {
      (it && it.sections || []).forEach(function (s) {
        ['label', 'body'].forEach(function (k) { var v = s && s[k]; if (v && FR_TEXT[v] == null) { var f = studioFr(v); if (f && f !== v) FR_TEXT[v] = f; } });
      });
    });
  }

  /* ---------- 2. The Guidebook, in sections ---------- */
  var SECTIONS = [
    { id: 'day', n: 'I', en: 'Your day', fr: 'Votre journée',
      subEn: 'Where each day begins, and how it is shaped.', subFr: 'Où chaque journée commence, et comment elle prend forme.',
      items: ['Home', 'The morning door', 'The sky, and setting the day', 'Agenda', 'Notifications & reminders'] },
    { id: 'focus', n: 'II', en: 'Focus and small tools', fr: 'Concentration et petits outils',
      subEn: 'Help to start, to see the time, and to stop for a rest.', subFr: 'De l’aide pour commencer, voir le temps et s’arrêter pour souffler.',
      items: ['@focus', 'Schedae, quick notes', 'Clepsydra, the focus timer', 'Custodia, the break guard'] },
    { id: 'study', n: 'III', en: 'Reading and study', fr: 'Lire et étudier',
      subEn: 'The course, its books and its lessons.', subFr: 'Le cursus, ses livres et ses leçons.',
      items: ['Curriculum', 'The four reading weeks', 'The Library', 'Seminars', 'The Scriptorium', 'Narrated lectures', 'Renaming for your proposal'] },
    { id: 'tutors', n: 'IV', en: 'Tutors and practice', fr: 'Tuteurs et exercices',
      subEn: 'Guides to talk a book through, and practice that is gently measured.', subFr: 'Des guides pour parler d’un livre, et des exercices mesurés avec douceur.',
      items: ['Magister', 'The Librarian', 'Writing drills', 'French Tutor', 'Ascensus, the training hall', 'Assessments'] },
    { id: 'projects', n: 'V', en: 'Your projects', fr: 'Vos projets',
      subEn: 'Applications, the proposal, and the writing that leads to them.', subFr: 'Les candidatures, la proposition, et l’écriture qui y mène.',
      items: ['Candidatus', 'Workspace'] },
    { id: 'studios', n: 'VI', en: 'The five studios', fr: 'Les cinq ateliers',
      subEn: 'Writing, sheets, slides, sources and dictation, and your signature.', subFr: 'L’écriture, les feuilles, les diapositives, les sources et la dictée, et votre signature.',
      items: ['Tabula, the writing room', 'Abacus, the spreadsheet', 'Imago, the slides', 'Fontes, citations', 'Scriba, dictation', 'Your signature'] },
    { id: 'desk', n: 'VII', en: 'Around the desk', fr: 'Autour du bureau',
      subEn: 'The bars, the windows and the buttons along the edge.', subFr: 'Les barres, les fenêtres et les boutons du bord.',
      items: ['The top bar', 'The desk bar and app tabs', 'Floating windows and their dock', 'The edge buttons and the chevron'] },
    { id: 'copy', n: 'VIII', en: 'Your copy of Carpe Diem', fr: 'Votre exemplaire de Carpe Diem',
      subEn: 'Installing it, reloading it, and knowing which build you have.', subFr: 'L’installer, le recharger, et savoir quelle version vous avez.',
      items: ['Install on your devices', 'Resetting the app', 'Which build am I running'] },
    { id: 'author', n: 'IX', en: 'For the author', fr: 'Pour l’autrice',
      subEn: 'The Forge: copies, installers, and changes made from inside the app.', subFr: 'La Forge : copies, installateurs, et changements faits de l’intérieur de l’app.',
      items: ['Installers and files', 'The Shortcuts library', 'Editing the app from inside it'] },
    { id: 'more', n: 'X', en: 'More chapters', fr: 'Autres chapitres',
      subEn: 'Chapters added to this copy.', subFr: 'Chapitres ajoutés à cette copie.', items: [] }
  ];
  // two notes on the look of the page, whose facts are in The top bar now
  var SET_ASIDE = ['The Quiet Index', 'One light for every room'];

  function focusChapter() {
    if (typeof DEMO_TOUR === 'undefined' || typeof buildGuideCard !== 'function') return null;
    var steps = DEMO_TOUR.filter(function (s) { return s && s.chap === 'Focus' && s.en; });
    if (steps.length < 2) return null;
    var fr = isFr();
    function pick(s, k) { var o = (fr && s.fr) ? s.fr : s.en; return String((o && o[k]) || (s.en && s.en[k]) || ''); }
    function clean(t) { return t.replace(/,\s*ringed here/g, '').replace(/,\s*entourée? ici/g, '').replace(/\s+/g, ' ').trim(); }
    var secs = steps.slice(1).map(function (s) { return { label: bare(pick(s, 't')), body: clean(pick(s, 'b')) }; });
    var card = buildGuideCard('🧭  ' + T('Focus, the supports', 'Concentration, les aides'), clean(pick(steps[0], 'b')), clean(pick(steps[0], 'tip')), 900, secs);
    card.setAttribute('data-gb89-own', 'focus');
    return card;
  }

  function fold(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' '); }

  function arrange(tab) {
    var modal = document.querySelector('#modal-root .cd-guide-modal');
    if (!modal) return;
    headerTour(modal);
    if (tab !== 'nav') return;
    var body = modal.children[1];
    if (!body || body.querySelector('.gb89-wrap')) return;
    var cards = [].filter.call(body.querySelectorAll(':scope > [data-cd-gbchap]'), function (c) { return !c.hasAttribute('data-gb89-own'); });
    if (typeof GUIDE_NAV === 'undefined' || cards.length < 5 || cards.length !== GUIDE_NAV.length) return;
    var where = {}, byId = {};
    SECTIONS.forEach(function (s) { byId[s.id] = s; s.items.forEach(function (t) { where[t] = s.id; }); });
    var bucket = {};
    SECTIONS.forEach(function (s) { bucket[s.id] = []; });
    var anchor = cards[0], setAside = 0;
    var wrap = mk('div', 'gb89-wrap');
    body.insertBefore(wrap, anchor);
    cards.forEach(function (card, i) {
      var t = GUIDE_NAV[i] && GUIDE_NAV[i].title;
      if (SET_ASIDE.indexOf(t) >= 0) { card.remove(); setAside++; return; }
      var id = where[t] || 'more';
      bucket[id].push({ card: card, rank: byId[id].items.indexOf(t), i: i });
    });
    var fc = focusChapter();
    if (fc) bucket.focus.push({ card: fc, rank: 0, i: -1 });
    var toc = mk('nav', 'gb89-toc');
    toc.setAttribute('aria-label', T('Contents', 'Sommaire'));
    SECTIONS.forEach(function (s) {
      var list = bucket[s.id];
      if (!list.length) return;
      list.sort(function (a, b) { var ra = a.rank < 0 ? 999 : a.rank, rb = b.rank < 0 ? 999 : b.rank; return ra - rb || a.i - b.i; });
      var sec = mk('section', 'gb89-sec');
      sec.setAttribute('data-sec', s.id);
      var head = mk('div', 'gb89-sec-head');
      head.appendChild(mk('span', 'gb89-num', s.n));
      var words = mk('div');
      words.appendChild(said(mk('div', 'gb89-sec-name'), s.en, s.fr));
      words.appendChild(said(mk('div', 'gb89-sec-sub'), s.subEn, s.subFr));
      head.appendChild(words);
      sec.appendChild(head);
      var ul = mk('div', 'gb89-sec-list');
      list.forEach(function (x) { ul.appendChild(x.card); });
      sec.appendChild(ul);
      wrap.appendChild(sec);
      var chip = mk('button', 'gb89-chip');
      chip.type = 'button';
      chip.setAttribute('data-go', s.id);
      chip.appendChild(mk('span', 'gb89-num', s.n));
      chip.appendChild(said(mk('span', 'gb89-chip-name'), s.en, s.fr));
      chip.appendChild(mk('span', 'gb89-n', String(list.length)));
      chip.onclick = function () {
        var top = sec.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop - 6;
        try { body.scrollTo({ top: top, behavior: quiet() ? 'auto' : 'smooth' }); } catch (e) { body.scrollTop = top; }
      };
      toc.appendChild(chip);
    });
    // the search and the contents, above the sections
    var tools = mk('div', 'gb89-tools');
    var find = mk('label', 'gb89-find');
    find.appendChild(mk('span', 'gb89-glass', '🔎'));
    var inp = mk('input');
    inp.type = 'search';
    inp.setAttribute('data-gb89-ph-en', 'Find a chapter');
    inp.setAttribute('data-gb89-ph-fr', 'Trouver un chapitre');
    inp.placeholder = T(inp.getAttribute('data-gb89-ph-en'), inp.getAttribute('data-gb89-ph-fr'));
    inp.setAttribute('aria-label', T('Find in the Guidebook', 'Chercher dans le Guide'));
    find.appendChild(inp);
    var count = mk('span', 'gb89-count');
    count.setAttribute('aria-live', 'polite');
    find.appendChild(count);
    tools.appendChild(find);
    tools.appendChild(toc);
    if (typeof demoStartTour === 'function') tools.appendChild(tourLine());
    wrap.parentNode.insertBefore(tools, wrap);
    inp.addEventListener('input', function () {
      var ws = fold(inp.value).split(' ').filter(Boolean), shown = 0, last = null;
      [].forEach.call(wrap.querySelectorAll('.gb89-sec'), function (sec) {
        var n = 0;
        [].forEach.call(sec.querySelectorAll('.gb89-sec-list > [data-cd-gbchap]'), function (c) {
          var hit = !ws.length || ws.every(function (w) { return fold(c.textContent).indexOf(w) >= 0; });
          c.style.display = hit ? '' : 'none';
          if (hit) { n++; last = c; }
        });
        sec.style.display = n ? '' : 'none';
        var chip = toc.querySelector('[data-go="' + sec.getAttribute('data-sec') + '"]');
        if (chip) chip.classList.toggle('gb89-dim', !n);
        shown += n;
      });
      if (!ws.length) { count.textContent = ''; return; }
      count.textContent = shown ? (shown === 1 ? T('1 chapter', '1 chapitre') : T(shown + ' chapters', shown + ' chapitres')) : T('No chapter has these words.', 'Aucun chapitre ne contient ces mots.');
      if (shown === 1 && last && !last.classList.contains('cd-gb-on')) { var hb = last.querySelector(':scope > button'); if (hb) hb.click(); }
    });
    body.setAttribute('data-gb89', String(setAside));
  }

  /* ---------- 3. The tour: short by default, full on request ---------- */
  var SHORT_SKIPS = [
    'Home|A Deep Work Day', 'Home|A Reading and Research Day', 'Home|A Gentle Day', 'Home|Your Day, returned', 'Home|Covers or Spines', 'Home|Manage books', 'Home|The Overview', 'Home|A Day You Can Shape', 'Home|Home and Overview',
    'Magister|The Workshop button', 'Magister|The Curriculum button', 'Magister|Inside the Curriculum room', 'Magister|The Writing tutor button', 'Magister|Inside the Writing tutor', 'Magister|The Librarian button', 'Magister|The French Tutor button',
    'The Agenda|The calendar', 'The Agenda|The full calendar', 'The Agenda|This week, folded', 'The Agenda|This week, opened',
    'The Library|Ask the librarian', 'The Library|Curriculum workspace', 'The Library|The Hidden Architecture', 'The Library|The Hidden Architecture, opened', 'The Library|The shelves and the reading entries', 'The Library|The Manage shelf button', 'The Library|The reading manager', 'The Library|The Marathon',
    'The Curriculum|Your reading, day by day', 'The Curriculum|Your progress through the course', 'The Curriculum|In reserve', 'The Curriculum|A module, opened', 'The Curriculum|Quiz and marks', 'The Curriculum|The lesson room: Orientation', "The Curriculum|The teacher's briefing", 'The Curriculum|Book and companion cards', 'The Curriculum|The lesson plan slides', 'The Curriculum|The lesson room: the weeks', 'The Curriculum|The lesson room: the Carry', 'The Curriculum|The term lecture and the seminar', 'The Curriculum|The Workspace', 'The Curriculum|The Tabula button',
    'Assessments|The Overview tab', 'Assessments|The Records tab', 'Assessments|The Quizzes tab', 'Assessments|The Seminars tab',
    'Ascensus|Your rank', 'Ascensus|A preview of the climb', 'Ascensus|Inside the Examen', 'Ascensus|The bridge to the workshop', 'Ascensus|Tabula, close at hand', 'Ascensus|The Record, and a last word',
    'Candidatus|The Overview tab', 'Candidatus|A programme, opened', 'Candidatus|Adding a programme', 'Candidatus|Filing what you are still deciding', 'Candidatus|The Citations tab',
    'Tools|The Tabula button', 'Tools|The writing room, ribbon and all', 'Tools|Scriba, first the button', 'Tools|Scriba, now watch it write', 'Tools|Fontes, first the button', 'Tools|Fontes, now open the panel',
    'Tools|Four ways to a hand', 'Tools|Your seal, and your own', 'Tools|The signing desk, and PDFs', 'Tools|The Signing desk', 'Tools|Filling it in', 'Tools|What the record says', 'Tools|Fill in a PDF, on the page',
    'Tools|The Abacus button', 'Tools|Font and alignment', 'Tools|Numbers in their proper dress', 'Tools|Styles, cells and editing', 'Tools|Tables and charts', 'Tools|Your seal and signature', 'Tools|The formula library', 'Tools|Watch the totals update', 'Tools|Sorting, and data in and out',
    'Tools|The Imago button', 'Tools|Watch a title slide take shape', 'Tools|Slides and sheets, grouped as you expect',
    'Tools|Scriba, its own room', "Tools|Scriba's room, watch it write", 'Tools|Fontes, its own room', "Tools|Fontes' room, watch a citation form", 'Tools|How Scriba and Fontes connect',
    'Tools|The dock for folded windows', 'Tools|The dock and the desk bar, one pair of hands',
    'Tools|The Schedae button', 'Tools|The New note button', 'Tools|A note, floating', "Tools|The note's menu", 'Tools|Writing in the note', 'Tools|Move a note anywhere', 'Tools|Resize a note', 'Tools|Search your notes', 'Tools|Pin and unpin', 'Tools|The notes have a night of their own',
    'Tools|The Clepsydra button', 'Tools|Start, Pause, Reset, and Skip', 'Tools|Focus length', 'Tools|Short break', 'Tools|Long break', 'Tools|Sessions before a long break', 'Tools|Chime', 'Tools|Auto-start next', 'Tools|Live countdown',
    'Tools|The apps open each other',
    'The top bar|The status button', 'The top bar|The Alerts button', 'The top bar|The Display button', 'The top bar|Light or Dark', 'The top bar|One light for every room', 'The top bar|Classic or Folio', 'The top bar|Depth', 'The top bar|The Quiet Index', 'The top bar|The Frame', 'The top bar|Motion', 'The top bar|Sound', 'The top bar|The Sky, first the button', 'The top bar|Support', 'The top bar|Online look-up in Fontes', 'The top bar|The Guidebook button', 'The top bar|The language page', 'The top bar|Every card carries a tip', 'The top bar|The screen shows the whole page', 'The top bar|Build your own installers', 'The top bar|The About button', 'The top bar|The seal at the top'
  ];
  var SKIPPED = {};
  SHORT_SKIPS.forEach(function (k) { SKIPPED[k] = 1; });
  window.cdTourFull = false;

  function markTour() {
    if (typeof DEMO_TOUR === 'undefined' || !Array.isArray(DEMO_TOUR)) return;
    DEMO_TOUR.forEach(function (st) {
      if (!st || !st.en || st.__cd1089) return;
      if (!SKIPPED[st.chap + '|' + bare(st.en.t)]) return;
      st.__cd1089 = 1;
      var own = (typeof st.skip === 'function') ? st.skip : null;
      st.__cdOwnSkip = own;
      st.skip = function () { if (!window.cdTourFull) return true; try { return own ? !!own.call(st) : false; } catch (e) { return false; } };
    });
  }
  function wordCount(s) { return String(s || '').split(/\s+/).filter(Boolean).length; }
  function minutes(full) {
    var w = 0, n = 0, fr = isFr();
    (DEMO_TOUR || []).forEach(function (st) {
      if (!st || !st.en) return;
      var own = st.__cd1089 ? st.__cdOwnSkip : st.skip, out = false;
      try { out = (typeof own === 'function') ? !!own.call(st) : false; } catch (e) { out = false; }
      if (out || (!full && st.__cd1089)) return;
      var o = (fr && st.fr) ? st.fr : st.en;
      w += wordCount(o.b) + wordCount(o.tip); n++;
    });
    var m = w / 200 + n * 0.1;
    return m <= 60 ? Math.max(5, Math.round(m / 5) * 5) : Math.round(m / 15) * 15;
  }
  var EN_MIN = { 5: 'five minutes', 10: 'ten minutes', 15: 'fifteen minutes', 20: 'twenty minutes', 25: 'twenty-five minutes', 30: 'half an hour', 35: 'thirty-five minutes', 40: 'forty minutes', 45: 'forty-five minutes', 50: 'fifty minutes', 55: 'fifty-five minutes', 60: 'an hour', 75: 'an hour and a quarter', 90: 'an hour and a half', 105: 'an hour and three quarters', 120: 'two hours' };
  var FR_MIN = { 5: 'cinq minutes', 10: 'dix minutes', 15: 'quinze minutes', 20: 'vingt minutes', 25: 'vingt-cinq minutes', 30: 'une demi-heure', 35: 'trente-cinq minutes', 40: 'quarante minutes', 45: 'quarante-cinq minutes', 50: 'cinquante minutes', 55: 'cinquante-cinq minutes', 60: 'une heure', 75: 'une heure et quart', 90: 'une heure et demie', 105: 'une heure trois quarts', 120: 'deux heures' };
  function say(m, fr) { var d = fr ? FR_MIN : EN_MIN; return d[m] || (fr ? 'plus de deux heures' : 'over two hours'); }

  // the welcome card's duration, in the words later builds gave it, then in the first ones
  var EN_WAS = ['The whole tour takes about three quarters of an hour', 'It takes about fifteen minutes'];
  var FR_WAS = ['La visite entière prend environ trois quarts d’heure', 'Comptez environ quinze minutes'];
  function swap(text, olds, now) { for (var i = 0; i < olds.length; i++) if (text.indexOf(olds[i]) >= 0) return text.replace(olds[i], now); return text; }
  function fixWelcome() {
    var st = null;
    (DEMO_TOUR || []).forEach(function (s) { if (!st && s && s.chap === 'Welcome' && s.en) st = s; });
    if (!st) return;
    if (EN_WAS.some(function (w) { return String(st.en.b || '').indexOf(w) >= 0; })) { st.__cdBaseEn = st.en.b; st.__cdBaseFr = st.fr && st.fr.b; }
    if (!st.__cdBaseEn) return;
    var full = !!window.cdTourFull, shortM = minutes(false), fullM = minutes(true);
    st.en.b = swap(st.__cdBaseEn, EN_WAS, full
      ? 'This full tour takes about ' + say(fullM, false)
      : 'This short tour takes about ' + say(shortM, false) + ' (the full one, every card, takes about ' + say(fullM, false) + ' and starts from the Guidebook)');
    if (st.fr && st.__cdBaseFr) st.fr.b = swap(st.__cdBaseFr, FR_WAS, full
      ? 'Cette visite complète prend environ ' + say(fullM, true)
      : 'Cette visite courte prend environ ' + say(shortM, true) + ' (la visite complète, chaque carte comprise, prend environ ' + say(fullM, true) + ' et se lance depuis le Guide)');
  }
  function fixInstallers() {
    (DEMO_TOUR || []).forEach(function (st) {
      if (!st || !st.en || bare(st.en.t) !== 'Build your own installers') return;
      st.en.b = String(st.en.b || '').replace('and the Fire, Mac and Windows packages,', 'and the packages for the iPhone and iPad, the Mac, the Mac mini, Windows and the Fire tablet,').replace('the same five makers will fold that instead', 'the same makers will fold that instead');
      if (/^One limit, said plainly: the Android Studio project/.test(st.en.tip || '')) st.en.tip = 'One limit, said plainly: the apps themselves are not compiled here. Each package carries its project, and GitHub builds the app from it; the iPhone and iPad package alone arrives finished, as CarpeDiem.ipa.';
      if (!st.fr) return;
      st.fr.b = String(st.fr.b || '').replace('et les paquets Fire, Mac et Windows,', 'et les paquets pour l’iPhone et l’iPad, le Mac, le Mac mini, Windows et la tablette Fire,').replace('et les cinq fabricants le plieront à sa place', 'et les mêmes fabricants le plieront à sa place');
      if (/^Une limite, dite clairement : le projet Android Studio/.test(st.fr.tip || '')) st.fr.tip = 'Une limite, dite clairement : les applications elles-mêmes ne sont pas compilées ici. Chaque paquet porte son projet, et GitHub en construit l’application ; seul le paquet pour l’iPhone et l’iPad arrive fini, sous la forme de CarpeDiem.ipa.';
    });
  }

  function headerTour(modal) {
    var key = modal.querySelector('.cd-gb-tourkey');
    if (!key) return;
    markTour();
    var s = minutes(false);
    key.title = T('The short tour: one or two stops in every room, about ' + say(s, false), 'La visite courte : un ou deux arr\u00eats dans chaque salle, environ ' + say(s, true));
  }
  // under the search: how long each tour takes, and the full one a press away
  function tourLine() {
    markTour();
    var s = minutes(false), f = minutes(true);
    var row = mk('div', 'gb89-tourline');
    row.appendChild(mk('span', 'gb89-tl-icon', '\ud83e\udded'));
    said(row.appendChild(mk('span', 'gb89-tl-text')),
      'The guided tour, above, is the short one: about ' + say(s, false) + '. The full tour, every card, takes about ' + say(f, false) + '.',
      'La visite guid\u00e9e, ci-dessus, est la courte : environ ' + say(s, true) + '. La visite compl\u00e8te, chaque carte, prend environ ' + say(f, true) + '.');
    var full = said(row.appendChild(mk('button', 'gb89-full')), 'Take the full tour', 'Faire la visite compl\u00e8te');
    full.type = 'button';
    full.onclick = function () { try { if (typeof closeModal === 'function') closeModal(); } catch (e) {} window.cdStartFullTour(); };
    return row;
  }

  window.cdStartFullTour = function () { window.__cdFullAsked = true; try { demoStartTour(); } catch (e) {} };

  /* ---------- 3b. A tour card stays on the screen ----------
     A card remembers how far it was moved (to clear what it rings, or by a drag) and a new card takes the same move,
     kept inside the screen. For a new card, the old reckoning took its place as already moved when it was not, so a
     "Chapter complete" card after a card moved far down could land below the screen (Home, then Ascensus, in 1088's
     tour). The place is now reckoned from the move the card really carries. */
  function fixCardPlace() {
    if (typeof demoTourOffsetApply !== 'function' || typeof demoTourClampTo !== 'function' || typeof __cdTourOff === 'undefined') return false;
    demoTourOffsetApply = function (ov, card, home) {
      if (!ov) return;
      if (!home && card) {
        var m = /translate\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px\s*\)/.exec(ov.style.transform || ''), ax = m ? +m[1] : 0, ay = m ? +m[2] : 0;
        try { var r = card.getBoundingClientRect(); if (r.width && r.height) home = { left: r.left - ax, top: r.top - ay, right: r.right - ax, bottom: r.bottom - ay }; } catch (e) {}
      }
      demoTourClampTo(home);
      try { ov.style.transform = 'translate(' + __cdTourOff.x + 'px,' + __cdTourOff.y + 'px)'; } catch (e) {}
    };
    return true;
  }

  /* ---------- 3c. The Surfaces chapter stays ----------
     "Editing the app from inside it" is added to the chapter list after the page loads. When the Author Studio sets
     the list again from its own copy, taken before that, the chapter went: in 1088 it was gone as soon as the
     language changed, so a French reader never saw it. It is kept here and put back before the Guidebook is drawn. */
  var keptSurfaces = null;
  function keepSurfaces() {
    if (typeof GUIDE_NAV === 'undefined' || !Array.isArray(GUIDE_NAV)) return;
    if (!keptSurfaces) GUIDE_NAV.forEach(function (c) { if (c && c.title === 'Editing the app from inside it') keptSurfaces = c; });
    if (keptSurfaces && !GUIDE_NAV.some(function (c) { return c && c.title === keptSurfaces.title; })) GUIDE_NAV.push(keptSurfaces);
  }
  (function () { var n = 0, w = setInterval(function () { keepSurfaces(); if (keptSurfaces || ++n > 240) clearInterval(w); }, 250); })();

  /* ---------- 4. Hooks ---------- */
  function hook() {
    if (typeof openGuidebook !== 'function' || typeof demoStartTour !== 'function') return false;
    try { fixCardPlace(); } catch (e) {}
    var openIt = openGuidebook;
    openGuidebook = function (tab) {
      try { keepSurfaces(); teachFrench(); } catch (e) {}
      var r = openIt.apply(this, arguments);
      try { arrange(tab || 'nav'); } catch (e) { try { console.warn('Guidebook sections', e); } catch (e2) {} }
      return r;
    };
    var startIt = demoStartTour;
    demoStartTour = function () {
      window.cdTourFull = !!window.__cdFullAsked;
      window.__cdFullAsked = false;
      try { markTour(); fixInstallers(); fixWelcome(); } catch (e) {}
      return startIt.apply(this, arguments);
    };
    return true;
  }
  if (!hook()) { var tries = 0, t = setInterval(function () { if (hook() || ++tries > 60) clearInterval(t); }, 250); }
  try { teachFrench(); } catch (e) {}

  // the language changed while the Guidebook is open: its new words follow
  try {
    new MutationObserver(function () {
      [].forEach.call(document.querySelectorAll('[data-gb89-en]'), function (e) { e.textContent = T(e.getAttribute('data-gb89-en'), e.getAttribute('data-gb89-fr')); });
      [].forEach.call(document.querySelectorAll('[data-gb89-ph-en]'), function (e) { e.placeholder = T(e.getAttribute('data-gb89-ph-en'), e.getAttribute('data-gb89-ph-fr')); });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  } catch (e) {}
})();
