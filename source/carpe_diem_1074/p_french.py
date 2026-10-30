"""1074 · the sticky notes' menu and keys in French.

The owner's words (30 October 2026): "Also the right click copy/paste panel and the sticky notes menu panel is still in
English on French mode inside of the app, please fix that as well."

Found, with Carpe Diem in French:
* a note's menu (⋯) said "Minimise note" (or "Unfold note") and "Unpin note" in English: the two had no French words,
  and the one key stood for both "Minimise" and "Unfold";
* a note's keys said "Drag to move", "Close", "Insert image", "Resize", and its format keys named the browser's commands
  ("bold", "strikeThrough", "insertUnorderedList") when the pointer rested on them;
* a note made in a room's own window (the window a room opens in on this device) was English throughout: its menu, its
  keys and "Write a note…".
Each now has its French. The same words serve the mini Forge, which carries Carpe Diem's notes and right-click menu and
now speaks Carpe Diem's language itself (p_minforge2). The right-click menu already had its French words; in the mini
Forge it showed English because the Forge's own language was English, the root p_minforge2 mends."""

# exact replacements, the same in Carpe Diem and in the copy of its notes the Forge carries
NOTES = [
    ('menu.appendChild(mkRow(tr("sn.minimise", (n.min ? "Unfold note" : "Minimise note")), () => {',
     'menu.appendChild(mkRow((n.min ? tr("sn.unfold", "Unfold note") : tr("sn.minimise", "Minimise note")), () => {'),
    ('const grip = el("div", { class: "sn-grip", title: "Drag to move" });',
     'const grip = el("div", { class: "sn-grip", title: tr("sn.drag", "Drag to move") });'),
    ('const x = el("button", { class: "sn-iconbtn", title: "Close", text: "\\u2715" });',
     'const x = el("button", { class: "sn-iconbtn", title: tr("sn.close", "Close"), text: "\\u2715" });'),
    ('const b = el("button", { class: "sn-tool", title: cmd, text: label });',
     'const b = el("button", { class: "sn-tool", title: ({ bold: tr("sn.bold", "Bold"), italic: tr("sn.italic", "Italic"), underline: tr("sn.underline", "Underline"), strikeThrough: tr("sn.strike", "Strikethrough"), insertUnorderedList: tr("sn.list", "Bulleted list") })[cmd] || cmd, text: label });'),
    ('const imgBtn = el("button", { class: "sn-tool", title: "Insert image" });',
     'const imgBtn = el("button", { class: "sn-tool", title: tr("sn.image", "Insert image") });'),
    ('const rsz = el("div", { class: "sn-resize", title: "Resize" });',
     'const rsz = el("div", { class: "sn-resize", title: tr("sn.resize", "Resize") });'),
    ('UI_FR["notif.needAttn"] = " requièrent votre attention. ";\n',
     'UI_FR["notif.needAttn"] = " requièrent votre attention. ";\n'
     '/* 1074: the notes\' menu and keys */\n'
     'UI_FR["sn.minimise"] = "Réduire la note";\nUI_FR["sn.unfold"] = "Déplier la note";\nUI_FR["sn.unpin"] = "Détacher la note";\n'
     'UI_FR["sn.drag"] = "Glisser pour déplacer";\nUI_FR["sn.close"] = "Fermer";\nUI_FR["sn.bold"] = "Gras";\nUI_FR["sn.italic"] = "Italique";\n'
     'UI_FR["sn.underline"] = "Souligné";\nUI_FR["sn.strike"] = "Barré";\nUI_FR["sn.list"] = "Liste à puces";\n'
     'UI_FR["sn.image"] = "Insérer une image";\nUI_FR["sn.resize"] = "Redimensionner";\n'
     'UI_FR["sn.undo"] = "Annuler (Ctrl+Z)";\nUI_FR["sn.redo"] = "Rétablir (Ctrl+Y)";\n'),
]

# the notes of a room's own window (cd-mod-sticky)
MOD_HEAD_OLD = "<script type=\"text/cd-mod\" id=\"cd-mod-sticky\">(function(){'use strict';\n"
MOD_HEAD_NEW = ("<script type=\"text/cd-mod\" id=\"cd-mod-sticky\">(function(){'use strict';\n"
                "var FRL=(function(){try{return String(window.__cdSelfLang||window.__APP_LANG__||document.documentElement.lang||'').slice(0,2)==='fr';}catch(e){return false;}})();"
                "function TT(en,fr){return FRL?fr:en;}\n")
MOD = [
    ("var dot=el('button',{title:'Colour'});", "var dot=el('button',{title:TT('Colour','Couleur')});"),
    ("row(minned?'Unfold note':'Minimise note',", "row(minned?TT('Unfold note','Déplier la note'):TT('Minimise note','Réduire la note'),"),
    ("row('Delete note',", "row(TT('Delete note','Supprimer la note'),"),
    ("body.setAttribute('data-ph','Write a note\\u2026');", "body.setAttribute('data-ph',TT('Write a note\\u2026','Écrire une note\\u2026'));"),
    ("var plus=el('button',{cls:'ib',title:'New note',text:'+'});", "var plus=el('button',{cls:'ib',title:TT('New note','Nouvelle note'),text:'+'});"),
    ("var grip=el('div',{cls:'grip',title:'Drag to move'});", "var grip=el('div',{cls:'grip',title:TT('Drag to move','Glisser pour déplacer')});"),
    ("var und=el('button',{cls:'ib',title:'Undo',text:'\\u21b6'});", "var und=el('button',{cls:'ib',title:TT('Undo','Annuler'),text:'\\u21b6'});"),
    ("var red=el('button',{cls:'ib',title:'Redo',text:'\\u21b7'});", "var red=el('button',{cls:'ib',title:TT('Redo','Rétablir'),text:'\\u21b7'});"),
    ("var x=el('button',{cls:'ib',title:'Close',text:'\\u2715'});", "var x=el('button',{cls:'ib',title:TT('Close','Fermer'),text:'\\u2715'});"),
    ("function fmt(label,cmd,sty){var b=el('button',{cls:'tb',title:cmd,text:label});",
     "function fmt(label,cmd,sty){var b=el('button',{cls:'tb',title:({bold:TT('Bold','Gras'),italic:TT('Italic','Italique'),underline:TT('Underline','Souligné'),strikeThrough:TT('Strikethrough','Barré'),insertUnorderedList:TT('Bulleted list','Liste à puces')})[cmd]||cmd,text:label});"),
    ("var imgBtn=el('button',{cls:'tb',title:'Insert image'});", "var imgBtn=el('button',{cls:'tb',title:TT('Insert image','Insérer une image')});"),
    ("var rz=el('div',{cls:'rz',title:'Resize'});", "var rz=el('div',{cls:'rz',title:TT('Resize','Redimensionner')});"),
]
# the window a room opens in hands the notes its language too, not only the timer
POP_OLD = "if(STK && !w.__cdStk){ w.__cdStk=1; var scS=d.createElement('script');"
POP_NEW = "if(STK && !w.__cdStk){ w.__cdStk=1; try{ w.__cdSelfLang=lang; }catch(e){} var scS=d.createElement('script');"


def notes(t, where):
    for o, n in NOTES:
        if t.count(o) != 1:
            raise SystemExit("%s: the notes' words: %r found %d times" % (where, o[:70], t.count(o)))
        t = t.replace(o, n)
    return t


def apply(p, full):
    p.s = notes(p.s, "Carpe Diem")
    i = p.s.find(MOD_HEAD_OLD)
    if i < 0 or p.s.count(MOD_HEAD_OLD) != 1:
        raise SystemExit("the room window's notes module was not found once")
    j = p.s.find("</script>", i)
    blk = p.s[i:j].replace(MOD_HEAD_OLD, MOD_HEAD_NEW)
    for o, n in MOD:
        if blk.count(o) != 1:
            raise SystemExit("the room window's notes: %r found %d times" % (o[:60], blk.count(o)))
        blk = blk.replace(o, n)
    p.s = p.s[:i] + blk + p.s[j:]
    p.rep(POP_OLD, POP_NEW)
    print("    French: the notes' menu and keys, in Carpe Diem and in a room's own window")
