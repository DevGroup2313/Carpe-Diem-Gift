# -*- coding: utf-8 -*-
"""1089 · the Guidebook and the tour, tidied.

The owner: "Please clean up the guidebook and the tour of unecessary entries and make it neater and more organised.
The guidebook might need a slight redesign."

What was so. The Guidebook's first page was one list of forty-one chapters in no order: the Forge's installers came
first, Home ninth, and two small notes on the look of the page (The Quiet Index, One light for every room) stood among
the rooms. Several chapters said what was true of an earlier build. The tour had 201 cards, about 15,600 words, and
told the reader it took "about fifteen minutes".

What this pass does:
* the chapters' wording, where it no longer matched the app (each checked against the app before it was changed):
  the Installers room makes seven things, not three; the sky is chosen on the morning door and set in Display, not
  with a button in the top bar; the top bar holds Status, Alerts, Display, Guide, About and the language; Imago's
  ribbon has nine tabs; Tabula's panel has thirteen house scripts, the Forge's Signatures room seven hands drawn
  stroke by stroke; the note on slower devices moves from Your signature to Resetting the app;
* `gb1089.js` and `gb1089.css`: the chapters sorted into nine sections with a contents strip and a search; a chapter
  for the Focus page, which had none; the two notes on the look of the page set aside (their facts are in The top
  bar); a short tour by default, one or two cards for each room, and the full tour kept, one press away;
* the French for every changed sentence.

Nothing is removed from the chapter list or the tour's cards themselves: the Author Studio keeps the owner's own edits
by a chapter's or a card's place in those lists, so their places do not move. What is set aside is set aside where the
Guidebook is drawn and where the tour steps."""
import os, re

HERE = os.path.dirname(os.path.abspath(__file__))

# (what, old, new): inside the Guidebook's chapter list (GUIDE_NAV), each found exactly once there
GUIDE = [
    ("Installers: the packages",
     "and the Fire, Mac and Windows packages. Every icon is drawn from the door seal",
     "and the packages for the iPhone and iPad, the Mac, the Mac mini, Windows and the Fire tablet. Every icon is drawn from the door seal"),
    ("Installers: the makers",
     "exactly as the Forge reads one, and the same five makers fold it.",
     "exactly as the Forge reads one, and the same makers fold it."),
    ("The sky: where it is set",
     'body: "The sky button in the top bar opens a small page',
     'body: "Display, then Sky, opens a small page'),
    ("Imago: its ribbon",
     "The ribbon carries Home, Insert, Design and Slides, each with named groups.",
     "The ribbon carries nine tabs, from Home to View, each with named groups."),
    ("Imago: no longer new",
     "Imago now follows the familiar slide studio closely: nine tabs from Home to View, transitions and animations,",
     "It follows the familiar slide studio closely, with transitions and animations,"),
    ("Fontes: one word too many",
     "and it also lives inside Tabula too.",
     "and it also lives inside Tabula."),
    ("Tabula: its house scripts",
     "written for you in one of five house scripts if you have no scanner",
     "written for you in one of thirteen house scripts if you have no scanner"),
    ("Tabula: the signing boxes",
     "onto the page \\u2014 a signature, initials, a date, a line of text \\u2014 and click",  # the source writes the dash as an escape
     "onto the page (a signature, initials, a date, a line of text) and click"),
    ("Your signature: the Forge's hands",
     "look at the thirteen hands, and keep the one that reads best",
     "look at the seven hands, and keep the one that reads best"),
]

# whole sections, found by their label and replaced (label and body)
SECTIONS = [
    ("Installers: what is made elsewhere", "What cannot be made here", "What is built elsewhere",
     "The apps themselves are not compiled in the page. The Mac, Mac mini, Windows and Fire tablet packages carry "
     "their projects, and GitHub builds the app from each: Carpe Diem.app, the Windows installer, the APK. The iPhone "
     "and iPad package arrives finished, as CarpeDiem.ipa, ready for Sideloadly, with its project beside it. A copy "
     "cannot make further copies or installers either: only a master carries its own source."),
    ("The morning door: its sky", "The Sky button", "Today feels",
     "Under the greeting, the door asks how today feels: Sunny, Windy or Gloomy, and under More, Rainy, Stormy, Hot "
     "or Night. The bright skies wake the app and its motion, the grey and the wet settle it calm and quiet, and heat "
     "slows it, keeping the deep work for the cooler hours. Tap the chosen sky again to let it go."),
    ("Your signature: two kinds of hand", "Type a name and it is drawn", "In the Forge, drawn stroke by stroke",
     "The seven hands of the Forge, below, are not fonts. Carpe Diem draws each letter itself, stroke by stroke, from "
     "a set of parameters for slant, nib, weight, join and flourish. That is why such a hand looks the same on every "
     "machine and needs nothing installed, and why it can letter any name rather than only a scan of one. The "
     "thirteen house scripts of the panel are written with the lettering your device has, so they can differ a "
     "little from one machine to another."),
]

TOP_BAR_NEW = (
    '{ label: "Display", body: "Opens the panel of choices for how Carpe Diem looks and behaves: the theme, light or '
    'dark; the look, Classic or Folio; depth; navigation; the frame; motion and sound; the sky of the morning door; '
    'and the supports of the Focus page. Classic is crisp and modern; Folio, Latin for a leaf and the old word for a '
    'page, is more bookish, with serif headings and a deeper blue. The theme is one switch for the whole house: change '
    'it anywhere and every open room follows, Tabula, Abacus and Imago included." }, '
    '{ label: "Guide and About", body: "Guide opens this Guidebook. About tells who made Carpe Diem, and its last line '
    'names the build you are running." }')

# the Forge's Installers room, and its French (the Author Studio's own dictionary)
FORGE = [
    ("the Installers room: its makers",
     "'This build itself. Open an HTML file to work on that instead, and the five makers below will fold it.'",
     "'This build itself. Open an HTML file to work on that instead, and the makers below will fold it.'"),
    ("the Installers room: a file opened",
     "' MB. The five makers below now fold it.'",
     "' MB. The makers below now fold it.'"),
    ("the Installers room in French",
     '"This build itself. Open an HTML file to work on that instead, and the five makers below will fold it.":"Cette '
     'édition elle-même. Ouvrez un fichier HTML pour travailler dessus à la place, et les cinq fabricants '
     'ci-dessous le plieront."',
     '"This build itself. Open an HTML file to work on that instead, and the makers below will fold it.":"Cette '
     'édition elle-même. Ouvrez un fichier HTML pour travailler dessus à la place, et les fabricants '
     'ci-dessous le plieront."'),
]
FORGE_PATTERN_AT = "var P = [\n"
FORGE_PATTERN = ("    [/^(.+) is open, ([\\d.]+) MB\\. The makers below now fold it\\.$/, "
                 "'$1 est ouvert, $2 Mo. Les fabricants ci-dessous le plient maintenant.'],\n")


def _once(text, old, new, what):
    n = text.count(old)
    if n != 1:
        raise SystemExit("%s: found %d times, not once" % (what, n))
    return text.replace(old, new)


def _section(gn, label, new_label, new_body, what):
    head = '{ label: "%s", body: "' % label
    i = gn.find(head)
    if i < 0 or gn.count(head) != 1:
        raise SystemExit("%s: the section is not there once" % what)
    j = gn.find('" }', i + len(head))
    if j < 0:
        raise SystemExit("%s: the section has no end" % what)
    return gn[:i] + '{ label: "%s", body: "%s" }' % (new_label, new_body) + gn[j + 3:]


def guide(gn):
    for what, old, new in GUIDE:
        gn = _once(gn, old, new, what)
    for what, label, new_label, new_body in SECTIONS:
        gn = _section(gn, label, new_label, new_body, what)
    # The top bar: Light or dark and Classic or Folio are inside Display now; Guide and About join
    a = gn.find('{ label: "Light or dark", body: "')
    b = gn.find('{ label: "Classic or Folio", body: "')
    if a < 0 or b < a:
        raise SystemExit("The top bar: its sections are not as this pass expects")
    e = gn.find('" }', b) + 3
    gn = gn[:a] + TOP_BAR_NEW + gn[e:]
    # the note on slower devices: from Your signature to Resetting the app
    k = gn.find('{ label: "On a slower device", body: "')
    if k < 0:
        raise SystemExit("the note on slower devices is not in Your signature")
    end = gn.find('" }', k) + 3
    slow = gn[k:end]
    after = gn[end:end + 2]
    gn = gn[:k] + gn[end + (2 if after == ", " else 0):]
    r = gn.find('title: "Resetting the app", body: "')
    if r < 0:
        raise SystemExit("Resetting the app is not where this pass expects")
    t = gn.find('", tip: "', r)
    if t < 0 or gn.find("sections:", r, t) >= 0:
        raise SystemExit("Resetting the app: not as this pass expects")
    gn = gn[:t] + '", sections: [ ' + slow + ' ], tip: "' + gn[t + len('", tip: "'):]
    return gn


def apply(p, full):
    if 'id="cd-1089-guide"' in p.s:
        raise SystemExit("the Guidebook is tidied already")
    a = p.s.find("const GUIDE_NAV = [")
    b = p.s.find("\n];", a)
    if a < 0 or b < 0 or p.s.count("const GUIDE_NAV = [") != 1:
        raise SystemExit("the page has no Guidebook chapter list as this pass expects")
    gn = guide(p.s[a:b])
    p.s = p.s[:a] + gn + p.s[b:]
    for what, old, new in FORGE:
        p.s = _once(p.s, old, new, what)
    st = p.s.find('<script id="cd-studio-fr-1052">')
    k = p.s.find(FORGE_PATTERN_AT, st)
    if st < 0 or k < 0:
        raise SystemExit("the Author Studio's French has no patterns where this pass expects")
    k += len(FORGE_PATTERN_AT)
    p.s = p.s[:k] + FORGE_PATTERN + p.s[k:]
    js = open(os.path.join(HERE, "gb1089.js"), encoding="utf-8").read()
    css = open(os.path.join(HERE, "gb1089.css"), encoding="utf-8").read()
    block = '<style id="cd-1089-guide-css">\n' + css + '</style>\n<script id="cd-1089-guide">\n' + js + '</script>\n'
    e = p.s.rfind("</body>")
    if e < 0:
        raise SystemExit("the page has no end")
    p.s = p.s[:e] + block + p.s[e:]
    print("    the Guidebook: %d sentences put right, %d sections rewritten, The top bar renewed; the Forge's "
          "makers; sections, contents, search, the Focus chapter and the short tour (%d bytes)"
          % (len(GUIDE), len(SECTIONS), len(block)))
