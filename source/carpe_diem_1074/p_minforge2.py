"""1074 · the mini Forge speaks Carpe Diem's language itself, and offers Another app.

The owner's words (30 October 2026): "The drop down menu inside of the mini Forge that shows Carpe Diem as an option to
edit as an app needs to also show the option to add another app to edit. Also, that drop down menu keeps on glitching
when Carpe Diem is set to French mode along with the "- 100% +", the Fill the whole screen button and the "Plus" drop
down menu that shows the rest of the Preview options, I think that there is a bug there, please fix this issue at the
root so that it never happens again and is sorted for good."

The root, measured in the mini Forge with Carpe Diem in French: the Forge's own language stayed English (its state,
lang="en" on its page), and French was laid over it afterwards by a translating layer (pass 1052) that rewrote the
words thirty milliseconds after the Forge wrote them. So the two kept writing over each other: on every tick of the
Forge's header, and on every press of the app menu, − 100% +, Full and More, the Forge wrote "More", "Saved", "Float",
"Leave full" and the layer wrote "Plus", "Enregistré", "Flottant" back; each English word showed for a frame, the
keys changed width, the row reflowed, and each change woke the other watchers (two hundred changes in three seconds
on the help keys alone). The Forge has its own French (its Editor, its header, its help, the parts it shares with
Carpe Diem: notes, the right-click menu), which it never used, because it was never told.

So, at the root:
* the mini Forge's own language is Carpe Diem's from the first line it runs (the language Carpe Diem hands it when it
  opens it), and follows Carpe Diem when the language is changed while it is open; the Forge then writes its own words
  in French itself, and nothing is written over;
* the layer is kept for the words the Forge has no French for, and now changes them in the same moment the Forge
  writes them, before anything is painted, so no English word is ever shown and no width ever jumps;
* the header's measure of the room keys is taken on the words shown (Éditeur, Boulangerie, Composer), not the English
  ones, so it no longer decides they fit when they do not.

And the app menu (Editing) offers Another app under Carpe Diem: any other app or page you bring the mini Forge, opened
in the Editor with its own edits, kept apart from Carpe Diem's. Each opening still starts on Carpe Diem itself."""
import base64, gzip, re
import p_french

LANG_START = """let state = loadState();
/* CARPE DIEM 1074: the mini Forge's own language is Carpe Diem's from its first line, so it writes its own words in
   French itself (window.__cdMiniLang is set by Carpe Diem in the page's head when it opens the mini Forge) */
try { if (window.__cdMiniLang === "fr" || window.__cdMiniLang === "en") { state.lang = window.__cdMiniLang; document.documentElement.lang = state.lang; document.documentElement.setAttribute("data-fg-lang", state.lang); } } catch (e) {}
"""

LANG_FOLLOW = """<script id="cd1074-mini-lang-js">
/* CARPE DIEM 1074: the mini Forge's language follows Carpe Diem's while it is open (Carpe Diem says it every second) */
(function () {
  var busy = false;
  function apply(v) {
    if (busy) return;
    try {
      if (typeof state === 'undefined' || !state || state.lang === v) return;
      busy = true;
      state.lang = v;
      var R = document.documentElement; R.lang = v; R.setAttribute('data-fg-lang', v);
      try { if (typeof applyLang === 'function') applyLang(); } catch (e) {}
      try { if (typeof renderAll === 'function') renderAll(); } catch (e) {}
      try { if (window.__forgeHeaderSeat) window.__forgeHeaderSeat(); } catch (e) {}
      try { if (window.__forgeGuidance) window.__forgeGuidance.apply(); } catch (e) {}
      try { if (window.__forgeEdAppWords) window.__forgeEdAppWords(); } catch (e) {}
    } catch (e) {}
    busy = false;
  }
  window.addEventListener('message', function (e) {
    try { if (e.source !== window.parent || window.parent === window) return; var d = e.data;
      if (d && typeof d === 'object' && (d.cdLang === 'fr' || d.cdLang === 'en')) apply(d.cdLang); } catch (x) {}
  });
})();
</script>"""

SAY_OLD = """     "The app at the top (Editing) is Carpe Diem: the mini Forge edits Carpe Diem itself.", "L’app en haut (Édition) est Carpe Diem : la mini Forge modifie Carpe Diem lui-même."],"""
SAY_NEW = """     "The app at the top (Editing) is Carpe Diem, the app the mini Forge lives in. Another app, in the same menu, opens any other app or page you bring it.", "L’app en haut (Édition) est Carpe Diem, l’app où vit la mini Forge. Une autre app, dans le même menu, ouvre toute autre app ou page que vous lui apportez."],"""
# the French of the full Forge's line on its four apps (1055 had the English twice), so the mini Forge's own line takes
# its place in French too
SAY3_OLD = """    ["The Forge carries all four inside it and keeps them on this device on its first start, so choosing one opens it at once.", "The Forge carries all four inside it and keeps them on this device on its first start, so choosing one opens it at once.","""
SAY3_NEW = """    ["The Forge carries all four inside it and keeps them on this device on its first start, so choosing one opens it at once.", "La Forge les porte toutes les quatre en elle et les garde sur cet appareil à son premier démarrage : en choisir une l’ouvre aussitôt.","""
TIPS_OLD = """TIPS = ["The mini Forge edits Carpe Diem, the app it lives in.", "La mini Forge modifie Carpe Diem, l’app où elle vit."];"""
TIPS_NEW = """TIPS = ["The mini Forge edits Carpe Diem, the app it lives in, and, under Another app, any other app or page you bring it.", "La mini Forge modifie Carpe Diem, l’app où elle vit, et, sous Une autre app, toute autre app ou page que vous lui apportez."];"""
FORCE_OLD = """if (on && on.getAttribute("data-app") !== "cd") { var cd = seg.querySelector('button[data-app="cd"]'); if (cd) cd.click(); }"""
FORCE_NEW = """if (on && !/^(cd|any|other)$/.test(on.getAttribute("data-app") || "")) { var cd = seg.querySelector('button[data-app="cd"]'); if (cd) cd.click(); }"""
CSS55_OLD = """<style id="cd1055-carpe-only">#edAppSeg button[data-app]:not([data-app="cd"]){display:none!important}</style>"""
CSS55_NEW = """<style id="cd1055-carpe-only">#edAppSeg button[data-app]:not([data-app="cd"]):not([data-app="any"]):not([data-app="other"]){display:none!important}</style>"""
CSS57_OLD = """body #edAppRow > #edAppSeg > button[data-app]:not([data-app="cd"]),"""
CSS57_NEW = """body #edAppRow > #edAppSeg > button[data-app]:not([data-app="cd"]):not([data-app="any"]):not([data-app="other"]),"""

FLUSH_OLD = "if (!timer) timer = setTimeout(flush, 30);"
FLUSH_NEW = "flush();"

TEXTW_OLD = "var w = 6; for (var i = 0; i < words.length; i++) w += Math.ceil(cv.measureText(words[i]).width) + 20 + (i ? 2 : 0);"
TEXTW_NEW = ("var w = 6; for (var i = 0; i < words.length; i++) { var wd = words[i]; try { if (fr() && window.__cdMiniForgeFr) { var tw = window.__cdMiniForgeFr.look(wd); if (tw) wd = tw; } } catch (e) {} "
             "w += Math.ceil(cv.measureText(wd).width) + 20 + (i ? 2 : 0); }")

HIDE_ANY_OLD = """html body #edAppSeg > [data-app="any"],
"""

# "You were in the Editor, on carpe_diem.html.": the line at the head of the controls, in French too
WHERE_OLD = "el('whereText').textContent='You were in '+(names[w.room]||w.room)+(w.item?', on '+w.item:'')+'.';"
WHERE_NEW = ("var namesFr={editor:'l\\u2019Éditeur',bakery:'la Boulangerie',library:'la Bibliothèque',compose:'Composer',files:'Fichiers',workshop:'l\\u2019Atelier',guidebook:'le Guide',settings:'les Réglages',console:'l\\u2019Atelier',magister:'Magister',curriculum:'le Cursus',assessments:'les Évaluations',ascensus:'Ascensus',fontes:'Fontes',reckoner:'le Calculateur'};\n"
             "    el('whereText').textContent=(document.documentElement.lang==='fr')?('Vous étiez dans '+(namesFr[w.room]||w.room)+(w.item?', sur '+w.item:'')+'.'):('You were in '+(names[w.room]||w.room)+(w.item?', on '+w.item:'')+'.');")

# the help keys (First day, Finding my way, At ease) were marked again, the same mark, on every change of the page:
# two hundred marks in three seconds, each waking the page's other watchers; now only a mark that differs is written
LEVEL_OLD = "Array.prototype.forEach.call(document.querySelectorAll('.fg-lv'), function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-fg-level')===lv?'true':'false'); });"
LEVEL_NEW = "Array.prototype.forEach.call(document.querySelectorAll('.fg-lv'), function(b){ var v=b.getAttribute('data-fg-level')===lv?'true':'false'; if(b.getAttribute('aria-pressed')!==v) b.setAttribute('aria-pressed', v); });"

ROWS_CSS = """<style id="cd1074-mini-rows">
/* CARPE DIEM 1074: the Editing key takes a line of its own when the room's row cannot hold the app's whole name,
   rather than cutting it short ("Carp…", the French room names being longer) */
html:not(#hd1):not(#hd2):not(#hd3):not(#hd4):not(#hd5):not(#hd6):not(#hd7) body.forge-app #section-forge .room[data-on="1"] > .hd-appkey-wrap{flex:0 1 auto !important;max-width:100% !important}
/* a key's words stay on one line ("Y retourner", "Écarter") */
html body.forge-app #whereLine .solid{white-space:nowrap !important;flex:0 0 auto !important}
/* the file's name in the preview's bar shows where it can be read; in a bar under 470 points it was a letter and "…" */
html:not(#hd1):not(#hd2):not(#hd3):not(#hd4):not(#hd5):not(#hd6):not(#hd7) body.forge-app #section-forge #stagebar[data-hd-w~="n1"] > #curName{display:none !important}
</style>"""


# the words the Forge has no French for, found on the Editor's page with Carpe Diem in French (each one the exact words
# shown, a title or a label the pointer or a screen reader meets): the layer's own dictionary takes them first
WORDS = {
    "🧭 Pick a named surface (the quick way)": "🧭 Choisir une surface nommée (le chemin rapide)",
    "A surface is one named part of the page that the app itself registered (its rail, its door, its top bar). Pick one; its controls open in step 4. For anything else on any page, use step 2.":
        "Une surface est une partie nommée de la page que l’app a elle-même déclarée (sa barre latérale, sa porte, sa barre du haut). Prenez-en une ; ses commandes s’ouvrent à l’étape 4. Pour tout le reste, sur n’importe quelle page, passez par l’étape 2.",
    "📦 Download the app": "📦 Télécharger l’app",
    "The Mac project GitHub builds Carpe Diem.app from, universal for Intel and Apple silicon, with this app inside and READ ME FIRST.txt.":
        "Le projet Mac à partir duquel GitHub construit Carpe Diem.app, universel pour Intel et Apple silicon, avec cette app à l’intérieur et READ ME FIRST.txt.",
    "The same universal app and project, with a guide written for the Mac mini.": "La même app universelle et le même projet, avec un guide écrit pour le Mac mini.",
    "The Windows project GitHub builds the installer and the single Carpe Diem.exe from, with this app inside.":
        "Le projet Windows à partir duquel GitHub construit l’installateur et le seul Carpe Diem.exe, avec cette app à l’intérieur.",
    "CarpeDiem.ipa, finished here and ready for Sideloadly, with the Home Screen app and the Xcode project.":
        "CarpeDiem.ipa, terminé ici et prêt pour Sideloadly, avec l’app de l’écran d’accueil et le projet Xcode.",
    "The Android project GitHub builds carpe-diem.apk from, with its signing key, so each build installs over the last.":
        "Le projet Android à partir duquel GitHub construit carpe-diem.apk, avec sa clé de signature, pour que chaque version s’installe par-dessus la précédente.",
    "An installable site for any static host that serves https: index.html, the manifest, the service worker and the icons.":
        "Un site installable pour tout hébergeur statique qui sert en https : index.html, le manifeste, le service worker et les icônes.",
    "The room": "La pièce",
    "Fold the top bar away": "Replier la barre du haut",
    "Fontes, the coding well": "Fontes, le puits du codeur",
    "Give this page the whole screen, or share it with the preview": "Donner tout l’écran à cette page, ou le partager avec l’aperçu",
    "Open the Workshop chat: say what you want in words, and the Forge writes the code": "Ouvrir la discussion de l’Atelier : dites ce que vous voulez avec des mots, et la Forge écrit le code",
    "The pictures and files kept in this sitting leave the Library and the stage": "Les images et fichiers gardés pendant cette séance quittent la Bibliothèque et la scène",
    "HyperText Markup Language: the text file a browser reads to build a page.": "HyperText Markup Language : le fichier texte qu’un navigateur lit pour construire une page.",
    "The small script, inside Carpe Diem and planted in every app the Forge ships, that applies your edits from data.":
        "Le petit script, dans Carpe Diem et planté dans chaque app que livre la Forge, qui applique vos modifications à partir des données.",
    "An opening tag, a closing tag and everything between them.": "Une balise ouvrante, une balise fermante et tout ce qui se trouve entre elles.",
    "The part of a CSS rule that says which elements it applies to: #id, .class, tag.": "La partie d’une règle CSS qui dit à quels éléments elle s’applique : #id, .classe, balise.",
    "A name one element has alone, pointed at with #name.": "Un nom qu’un seul élément porte, désigné par #nom.",
    "A name many elements share, pointed at with .name.": "Un nom que plusieurs éléments partagent, désigné par .nom.",
    "Cascading Style Sheets: the language of appearance; rules of selector and property.": "Cascading Style Sheets : la langue de l’apparence ; des règles faites d’un sélecteur et de propriétés.",
    "A CSS layout where items sit in a row or column and can be ordered with order.": "Une mise en page CSS où les éléments se placent en ligne ou en colonne et peuvent être ordonnés avec order.",
    "#RRGGBB: two hexadecimal digits each for red, green and blue.": "#RRVVBB : deux chiffres hexadécimaux pour le rouge, le vert et le bleu.",
    "Use the name, id and version the app gives itself": "Reprendre le nom, l’identifiant et la version que l’app se donne elle-même",
    "Build the Mac package": "Construire le paquet Mac",
    "Build the package for a Mac with Apple silicon (Mac mini)": "Construire le paquet pour un Mac avec Apple silicon (Mac mini)",
    "Build the Windows package": "Construire le paquet Windows",
    "Build the iPhone and iPad package": "Construire le paquet iPhone et iPad",
    "Build the Fire and Android package": "Construire le paquet Fire et Android",
    "Build the web package": "Construire le paquet web",
    "The edits go back to how they stood before the import": "Les modifications reviennent à ce qu’elles étaient avant l’importation",
    "A list of files with a table at the end saying where each one starts.": "Une liste de fichiers avec, à la fin, une table qui dit où chacun commence.",
    "Data written in braces, quotes and brackets, so programs can read it back.": "Des données écrites entre accolades, guillemets et crochets, pour que les programmes puissent les relire.",
    "A script planted in the head that holds your data before the page starts.": "Un script planté dans le head qui contient vos données avant que la page ne démarre.",
    "A word in angle brackets that opens or closes an element, such as <p> and </p>.": "Un mot entre chevrons qui ouvre ou ferme un élément, comme <p> et </p>.",
    "Plain text with a few marks, such as # for a heading, that becomes HTML.": "Du texte simple avec quelques marques, comme # pour un titre, qui devient du HTML.",
    "Clear the thread; the Diary keeps every command": "Effacer le fil ; le Journal garde chaque commande",
    "Put the example in the box": "Mettre l’exemple dans la boîte",
    "The text of the file": "Le texte du fichier",
    "What the HTML, CSS or JavaScript under the cursor means, in plain words": "Ce que veut dire le HTML, le CSS ou le JavaScript sous le curseur, en mots simples",
    "Softer colours, more room, and only the part you are working on in full colour": "Des couleurs plus douces, plus d’espace, et seule la partie sur laquelle vous travaillez en pleines couleurs",
    "Clear out what the code does not need: you see each change first": "Retirer ce dont le code n’a pas besoin : vous voyez chaque changement d’abord",
    "Back to the Editor": "Retour à l’Éditeur",
    "Search the Guidebook by what you want to do": "Chercher dans le Guide selon ce que vous voulez faire",
    "The language of behaviour; it runs in the page and can change anything in it.": "La langue du comportement ; il s’exécute dans la page et peut tout y changer.",
    "A name and value inside an opening tag, such as id=\"guide-btn\".": "Un nom et une valeur dans une balise ouvrante, comme id=\"guide-btn\".",
    "A small JSON file naming an app and its icon so a browser can install it.": "Un petit fichier JSON qui nomme une app et son icône pour qu’un navigateur puisse l’installer.",
    "Stating the result as data and letting code apply it, instead of writing the code.": "Énoncer le résultat comme des données et laisser le code l’appliquer, au lieu d’écrire le code.",
    "The zip holds the JSON backup and, beside it as plain files, the copies of your apps kept in the Forge (two per app at most), the files in Files and the new apps made in the Studio. It is the one file to carry to another device. Reading it back checks every file against its fingerprint first; a file that did not arrive whole is named and skipped, and nothing already here is lost.":
        "Le zip contient la sauvegarde JSON et, à côté, en simples fichiers, les copies de vos apps gardées dans la Forge (deux par app au plus), les fichiers de Fichiers et les nouvelles apps faites dans le Studio. C’est le seul fichier à emporter vers un autre appareil. À la relecture, chaque fichier est d’abord vérifié contre son empreinte ; un fichier arrivé incomplet est nommé et laissé de côté, et rien de ce qui est déjà ici n’est perdu.",
    "The meter reads what the browser reports for this app, and the lines underneath count what the Forge itself keeps: the copies of your apps (two per app at most), the files in Files, the new apps and edits of the Studio, and the small notes in localStorage. Clean the library removes only the earlier copy of each app, the one kept one step back; your newest copies and your files stay.":
        "La jauge lit ce que le navigateur indique pour cette app, et les lignes en dessous comptent ce que la Forge garde elle-même : les copies de vos apps (deux par app au plus), les fichiers de Fichiers, les nouvelles apps et modifications du Studio, et les petites notes de localStorage. Nettoyer la bibliothèque ne retire que la copie d’avant de chaque app, celle gardée un pas en arrière ; vos copies les plus récentes et vos fichiers restent.",
    "A script that keeps a copy of an app so it opens with no connection.": "Un script qui garde une copie d’une app pour qu’elle s’ouvre sans connexion.",
    "The licence, version 3, 25 october 2026": "La licence, version 3, 25 octobre 2026",
    "Where (a book, a site, a person)": "Où (un livre, un site, une personne)",
    "What it is good for": "À quoi cela sert",
    "Resize the preview": "Redimensionner l’aperçu",
    "Show the preview again": "Montrer de nouveau l’aperçu",
    "Show the controls again": "Montrer de nouveau les commandes",
    "The engine of the app on the stage": "Le moteur de l’app sur la scène",
    "Views of the file": "Vues du fichier",
    "Dim the preview": "Atténuer l’aperçu",
    "Zoom the preview": "Zoomer l’aperçu",
    "Smaller: see more of the app": "Plus petit : voir davantage de l’app",
    "Fit the whole app, or back to full size": "Faire tenir toute l’app, ou revenir à la taille réelle",
    "Larger: see it closer": "Plus grand : voir de plus près",
    "The preview panel": "Le panneau de l’aperçu",
    "Fill the whole screen with the preview": "Remplir tout l’écran avec l’aperçu",
    "Roll the preview up to its bar": "Enrouler l’aperçu jusqu’à sa barre",
    "Roll the preview up to its bar, or open it again": "Enrouler l’aperçu jusqu’à sa barre, ou le rouvrir",
    "Float the preview as a window you can drag by anywhere and resize from any edge or corner": "Faire flotter l’aperçu dans une fenêtre qu’on déplace en la saisissant n’importe où et qu’on redimensionne par tout bord ou coin",
    "Close the preview; the page takes the width": "Fermer l’aperçu ; la page prend la largeur",
    "Hide the controls and give the preview the width": "Masquer les commandes et donner la largeur à l’aperçu",
    "Drag to resize": "Glisser pour redimensionner",
    "Fold the bar away": "Replier la barre",
    "Catch a thought": "Saisir une pensée",
    "⛶ Leave full": "⛶ Quitter le plein écran",
    "Leave full": "Quitter le plein écran",
}
CURNAME_P = "[/^(.+) \\(live, with your edits\\) · ([\\d,]+) bytes$/, function (m) { return m[1] + ' (en direct, avec vos modifications) · ' + m[2].replace(/,/g, '\\u202f') + ' octets'; }],\n    "


def words(mf):
    import json
    o = 'var D = {"✍️ Editor":"✍️ Éditeur",'
    if mf.count(o) != 1:
        raise SystemExit("mini Forge 1074: the layer's dictionary was not found once")
    add = ",".join(json.dumps(k, ensure_ascii=False) + ":" + json.dumps(v, ensure_ascii=False) for k, v in WORDS.items()).replace("</", "<\\/")
    mf = mf.replace(o, 'var D = {' + add + ',"✍️ Editor":"✍️ Éditeur",')
    po = "var P = [\n    [/^(\\d+) controls?$/,"
    if mf.count(po) != 1:
        raise SystemExit("mini Forge 1074: the layer's patterns were not found once")
    return mf.replace(po, "var P = [\n    " + CURNAME_P + "[/^(\\d+) controls?$/,")


def once(t, old, new, what):
    if t.count(old) != 1:
        raise SystemExit("mini Forge 1074: %s found %d times" % (what, t.count(old)))
    return t.replace(old, new)


def apply(p, full):
    pm = re.search(r'(<script id="cd-forge-pack" type="text/plain">)([^<]*)(</script>)', p.s)
    if not pm or p.s.count('id="cd-forge-pack"') != 1:
        raise SystemExit("no mini Forge pack, or more than one")
    mf = gzip.decompress(base64.b64decode(pm.group(2).strip())).decode("utf-8")
    if 'window.__cdMiniForge={from:"656",slim:true};' not in mf:
        raise SystemExit("the mini Forge here is not the 656 one")
    mf = once(mf, "let state = loadState();\n", LANG_START, "the Forge's state")
    mf = once(mf, FLUSH_OLD, FLUSH_NEW, "the French layer's timer")
    # the help a 💡 key shows (data-tip) is translated too
    mf = once(mf, "ATTR = ['placeholder', 'title', 'aria-label']", "ATTR = ['placeholder', 'title', 'aria-label', 'data-tip']", "the layer's attributes")
    mf = once(mf, TEXTW_OLD, TEXTW_NEW, "the header's measure")
    mf = once(mf, SAY_OLD, SAY_NEW, "the Editor's line on the app")
    mf = once(mf, SAY3_OLD, SAY3_NEW, "the line on the four apps")
    mf = once(mf, TIPS_OLD, TIPS_NEW, "the switch's tip")
    mf = once(mf, FORCE_OLD, FORCE_NEW, "the rule that brings the switch back to Carpe Diem")
    mf = once(mf, CSS55_OLD, CSS55_NEW, "the 1055 rule")
    mf = once(mf, CSS57_OLD, CSS57_NEW, "the 1057 rule")
    mf = once(mf, WHERE_OLD, WHERE_NEW, "the line that says where you were")
    mf = once(mf, LEVEL_OLD, LEVEL_NEW, "the help keys' marks")
    # the notes the Forge carries from Carpe Diem: the same French words as Carpe Diem's own (p_french)
    mf = p_french.notes(mf, "the mini Forge")
    mf = words(mf)
    k = mf.rfind("</body>")
    mf = mf[:k] + ROWS_CSS + LANG_FOLLOW + mf[k:]
    z = bytearray(gzip.compress(mf.encode("utf-8"), 9, mtime=0))
    z[9] = 3
    p.s = p.s[:pm.start(2)] + base64.b64encode(bytes(z)).decode("ascii") + p.s[pm.end(2):]
    # Carpe Diem's own rules for the mini Forge (pass 1048, carried as text and added to the Forge as it opens) hid
    # Another app too
    o = '<script id="cd-mini-forge-1048" type="text/plain">'
    if p.s.count(o) != 1:
        raise SystemExit("the 1048 rules were not found once")
    a = p.s.find(o)
    b = p.s.find("</script>", a)
    blk = p.s[a:b]
    if blk.count(HIDE_ANY_OLD) != 1 or p.s.count(HIDE_ANY_OLD) != 1:
        raise SystemExit("the 1048 rule hiding Another app was not found once")
    p.s = p.s[:a] + blk.replace(HIDE_ANY_OLD, "") + p.s[b:]
    print("    mini Forge: its own language is Carpe Diem's; the layer writes before the paint; Another app offered")
