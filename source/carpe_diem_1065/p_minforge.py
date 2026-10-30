"""1062 · the mini Forge in the Author Studio is The Forge 656 (9s88), and its loading page speaks French.

The owner's words (29 October 2026): "update the mini Forge inside of the Carpe Diem's Author Studio, so that it receives
all of the fixes and upgrades that the main Forge app has on Build 656 - 9s88 which is its latest version", "The loading
page for the mini Forge does not translate to French on French mode", "The live preview panel keeps on shaking when I
scroll inside the mini Forge", and "make sure that the mini Forge inside of the main master version of Carpe Diem (my
personal) version has the full app loaded inside of it instead of Carpe Diem's demo."

The mini Forge is made again from The Forge 656's own lean page (the copy of itself its full page carries, checked
against the size and fingerprint that page names), by the recipe of pass 1057: the device packages' source is left out
(the app around it builds them), Tabula is left out, Abacus, Slides, Scriba and Fontes are the short pages that send you
to Carpe Diem's own side keys, and what rides in it is taken whole from the 641 mini Forge (the French layer, the guard
against Tabula, the rule that it edits Carpe Diem alone, its slim mark). It brings the Forge's own fixes since 641:
among them the Editor's live preview that holds still while the room scrolls (644), the loading page and Refresh (643).

The loading page (the Forge's own, from 643) is given Carpe Diem's language and day or night by the Studio each time
it opens the Forge, and says its words in French when Carpe Diem is in French. "Edit this app" still hands the mini
Forge this very build each time it opens: in the owner's edition, the full Carpe Diem."""
import base64, gzip, hashlib, json, re

FORGE_FULL = "/home/user/Forge-windows/the_forge.html"
NEW_REC = 'CD_BUILD={date:"2026-10-28",pass:"656",stamp:"9s88"}'
OLD_REC = 'CD_BUILD={date:"2026-10-19",pass:"641",stamp:"9s73"}'


def lean656():
    s = open(FORGE_FULL, encoding="utf-8").read()
    meta = json.loads(re.search(r'<script type="application/json" id="forge-bi-meta">(.*?)</script>', s, re.S).group(1))
    want = [a for a in meta["apps"] if a["id"] == "forge-bi-self"][0]
    m = re.search(r'<script type="forge/b64" id="forge-bi-self">([^<]*)</script>', s)
    raw = gzip.decompress(base64.b64decode(m.group(1)))
    if len(raw) != want["size"] or hashlib.sha256(raw).hexdigest() != want["sha256"]:
        raise SystemExit("The Forge 656's lean page is not the copy its full page names")
    t = raw.decode("utf-8")
    if NEW_REC not in t:
        raise SystemExit("this is not The Forge 656")
    if re.search(r'<script type="text/plain" id="cd-src-(carpe|ingenium|inkwell)"', t):
        raise SystemExit("the lean page carries apps")
    return t


def block(page, bid):
    ms = list(re.finditer(r'<(script|style)\b[^>]*\sid="%s"[^>]*>' % re.escape(bid), page))
    if len(ms) != 1:
        raise SystemExit("%s: found %d times" % (bid, len(ms)))
    m = ms[0]
    end = page.find("</%s>" % m.group(1), m.end())
    return m.start(), end + len("</%s>" % m.group(1))


SPLASH_FR = [
    ('var MAP=/*FORGE_BOOT_MAP*/', 'var FR=(window.__cdMiniLang==="fr");function TT(e,f){return FR?f:e;}var MAP=/*FORGE_BOOT_MAP*/'),
    ('  look(night);\n', '  if(typeof window.__cdMiniNight==="boolean")night=window.__cdMiniNight;\n  look(night);\n'
     '  if(FR){try{b.querySelector(".fb-name").textContent="La Forge";$b("fb-say").textContent="Préparation en cours. La page se dessine encore ; rien ne s’est arrêté.";'
     'b.querySelector(".fb-bar").setAttribute("aria-label","Part de la page déjà dessinée");$b("fb-refresh").textContent="Actualiser";$b("fb-wait").textContent="Patienter encore";}catch(e){}}\n'),
    ('if(again)$b("fb-say").textContent="Starting again after Refresh. The page is being painted; nothing has crashed.";',
     'if(again)$b("fb-say").textContent=TT("Starting again after Refresh. The page is being painted; nothing has crashed.","Nouveau départ après Actualiser. La page se dessine ; rien ne s’est arrêté.");'),
    ('pc.textContent=p>=100?"Ready":p+"% painted";', 'pc.textContent=p>=100?TT("Ready","Prête"):TT(p+"% painted",p+" % dessinée");'),
    ('say("This is taking longer than usual. A large page paints slowly on a tablet or a phone, and the first start after an update is the slowest. It is still working.",false);',
     'say(TT("This is taking longer than usual. A large page paints slowly on a tablet or a phone, and the first start after an update is the slowest. It is still working.","Cela prend plus de temps que d’habitude. Une grande page se dessine lentement sur une tablette ou un téléphone, et le premier démarrage après une mise à jour est le plus lent. Elle travaille toujours."),false);'),
    ('say("Nothing has moved for a while. You can keep waiting, or press Refresh to start the Forge again. Your saved work stays where it is.",true);',
     'say(TT("Nothing has moved for a while. You can keep waiting, or press Refresh to start the Forge again. Your saved work stays where it is.","Rien n’a bougé depuis un moment. Vous pouvez patienter encore, ou appuyer sur Actualiser pour relancer la Forge. Votre travail enregistré reste où il est."),true);'),
    ('say("Still working. Thank you for waiting.",false);', 'say(TT("Still working. Thank you for waiting.","Toujours au travail. Merci de patienter."),false);'),
    ('$b("fb-say").textContent=text||"Starting the Forge again. Your work is saved.";', '$b("fb-say").textContent=text||TT("Starting the Forge again. Your work is saved.","La Forge redémarre. Votre travail est enregistré.");'),
]


def apply(p, full):
    lean = lean656()
    pm = re.search(r'(<script id="cd-forge-pack" type="text/plain">)([^<]*)(</script>)', p.s)
    if not pm or p.s.count('id="cd-forge-pack"') != 1:
        raise SystemExit("no mini Forge pack, or more than one")
    old = gzip.decompress(base64.b64decode(pm.group(2).strip())).decode("utf-8")
    if OLD_REC not in old:
        raise SystemExit("the mini Forge here is not the 641 one this pass replaces")
    mf = lean
    a, b = block(mf, "cd-pkg-src")
    mf = mf[:a] + '<script id="cd-pkg-src" type="text/plain">\n</script>' + mf[b:]
    mf, n1 = re.subn(r'<script type="text/plain" id="cd-src-tabula">[^<]*</script>\n?', "", mf)
    mf, n2 = re.subn(r'<button id="curric-tabula-btn" class="tabula-btn" onclick="openExt\(\'tabula\'\)">Tabula</button>', "", mf)
    if n1 != 1 or n2 != 1:
        raise SystemExit("Tabula pieces not where expected (%d, %d)" % (n1, n2))
    for k in ("abacus", "slides", "scriba", "fontes"):
        oa, ob = block(old, "cd-src-" + k)
        na, nb = block(mf, "cd-src-" + k)
        if ob - oa > 4000:
            raise SystemExit("the 641 mini Forge's %s is not the short page" % k)
        mf = mf[:na] + old[oa:ob] + mf[nb:]
    ra, _ = block(old, "cd-mini-forge-slim")
    _, rb = block(old, "cd1057-carpe-only")
    ride = old[ra:rb]
    if ride.count('window.__cdMiniForge={from:"641",slim:true};') != 1:
        raise SystemExit("the slim mark is not the 641 one")
    ride = ride.replace('window.__cdMiniForge={from:"641",slim:true};', 'window.__cdMiniForge={from:"656",slim:true};')
    k = mf.rfind("</body>")
    mf = mf[:k] + ride + mf[k:]
    # the loading page in French, and in the Studio's day or night
    for o, n in SPLASH_FR:
        if mf.count(o) != 1:
            raise SystemExit("mini Forge loading page: %r found %d times" % (o[:60], mf.count(o)))
        mf = mf.replace(o, n)
    z = bytearray(gzip.compress(mf.encode("utf-8"), 9, mtime=0))
    z[9] = 3
    p.s = p.s[:pm.start(2)] + base64.b64encode(bytes(z)).decode("ascii") + p.s[pm.end(2):]
    print("    mini Forge: The Forge 656, %d bytes (%d packed)" % (len(mf.encode("utf-8")), len(z)))
    # the Studio gives the Forge its language and its day or night each time it opens it
    p.rep("        var __inj = '<' + 'style id=\"cd-forge-splash-theme\">#cd-splash{background:' + __bg + ' !important}#cd-splash>div{color:' + __fg + ' !important}</' + 'style>';\n",
          "        var __inj = '<' + 'style id=\"cd-forge-splash-theme\">#cd-splash{background:' + __bg + ' !important}#cd-splash>div{color:' + __fg + ' !important}</' + 'style>';\n"
          "        __inj += '<' + 'script>window.__cdMiniLang=\"' + (__st.lang === 'fr' ? 'fr' : 'en') + '\";window.__cdMiniNight=' + (__n ? 'true' : 'false') + ';</' + 'script>';\n")


def handed(p, photo):
    """The very text "Edit this app" hands the mini Forge (fromSelf in pass 697): the photograph, with the photograph's
    own data and its getter put back before the copy maker."""
    o = '<script type="cd/b64" id="cd-self-src-data">'
    a = p.s.find(o)
    b64 = re.sub(r"\s+", "", p.s[a + len(o):p.s.find("</script>", a)])
    g = re.search(r'<script id="cd-self-src">(.*?)</script>', p.s, re.S).group(1)
    block = o + b64 + "</script>\n" + '<script id="cd-self-src">' + g + "</script>\n"
    k = photo.find('<script id="cd-copy-maker">')
    return photo[:k] + block + photo[k:] if k >= 0 else photo


def trust(p, current_photo):
    """The mini Forge knows this very build as the owner's own app: the fingerprint of the file "Edit this app" hands it
    (the page's photograph of itself) is added to the fingerprints its page names, so its preview is not shown apart
    with a "This is my own app" key every time (its sandboxed frame keeps nothing between openings)."""
    h = hashlib.sha256(handed(p, current_photo).encode("utf-8")).hexdigest()
    pm = re.search(r'(<script id="cd-forge-pack" type="text/plain">)([^<]*)(</script>)', p.s)
    mf = gzip.decompress(base64.b64decode(pm.group(2).strip())).decode("utf-8")
    m = re.search(r'(<script type="application/json" id="forge-trust-shas">)(.*?)(</script>)', mf, re.S)
    if not m or mf.count('id="forge-trust-shas"') != 1:
        raise SystemExit("the mini Forge's list of the owner's apps was not found once")
    shas = [h] + [x for x in json.loads(m.group(2)) if x != h]
    mf = mf[:m.start(2)] + json.dumps(shas) + mf[m.end(2):]
    z = bytearray(gzip.compress(mf.encode("utf-8"), 9, mtime=0))
    z[9] = 3
    p.s = p.s[:pm.start(2)] + base64.b64encode(bytes(z)).decode("ascii") + p.s[pm.end(2):]
    print("    mini Forge: this very build is the owner's own (%s)" % h[:16])
