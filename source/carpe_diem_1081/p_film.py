"""1080 · the Guidebook's film, sharp, with this device's own side keys.

The owner's words (1 November 2026): "The film inside of the Guidebook looks blurry and has the look of an harsh android
look for the side buttons on my mac and all other devices and I dislike it, I want it to look how they look on my mac on
all of my devices because the emojis look better and proper and everything looks more defined and neater, at the very
least the videos should match the way the app looks on the device that it is being watched rather than a very regressed
look of emojis having this harsh black line around them, I want them fixed please."

Why it was so: 1079's films were Playwright's screen recordings (about 1 Mbit/s VP8) made again at 1120x700 and about
240 kbit/s, then enlarged by the player to 960 CSS pixels (1920 device pixels on a Mac): soft. Their side keys were drawn
by the recording machine (Linux Chromium, Noto Color Emoji, dark outlines).

What this pass does, for both cuts (the owner's with Candidatus; the demonstrations', filmed from the public sample):
* The films are made again from the 1080 pages (rec_film80.js, the same fresh profile and neutral sample entries as
  1079): every frame a full screenshot at device scale factor 2 with the page's time held still between frames, so
  30 even frames a second; encoded at 1728x1080 (build_film.py). The player never shows the film larger than its
  pixels over the screen's devicePixelRatio.
* The side keys' glyphs are left out of the film; the film carries where each key was in every frame, and the player
  draws the keys' glyphs there with the glyphs of the real keys on this device (Apple's on a Mac, iPhone, iPad;
  Microsoft's on Windows, the app's flat pictures on Windows 10 as pass 1060 does), ringing and turning as filmed.
* The player keeps every promise of 1079 (film80.js, film80.css).

Blocks replaced, each in place: cd-film-1079-css -> cd-film-1080-css; cd-film-1079-data (window.__cdFilmB64="...")
-> cd-film-1080-data (a script of type application/octet-stream, so the film is not parsed as JavaScript at start);
cd-film-1079 -> cd-film-1080. The Guidebook's card and the tour's keys (gbCard, dressGuide, dressTour and the .cdf-gbcard,
.cdf-gbbadge and .cdf-tourkey rules) are carried over word for word."""
import base64, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
FILM = os.path.join(HERE, "film")
MAX_BYTES = 5 * 1024 * 1024

NAMES = {
    "home": ("Home", "Accueil", "Home, with its tabs at the left of the Backup key's row.", "L’accueil, avec ses onglets à gauche de la rangée du bouton Sauvegarde."),
    "overview": ("The Overview", "La vue d’ensemble", "Today's energy chosen: the keys rise under the pointer and sink when pressed.", "L’énergie du jour choisie : les touches se lèvent sous le pointeur et s’enfoncent quand on appuie."),
    "candidatus": ("Candidatus", "Candidatus", "How Candidatus works: the four rooms, Milestones to start with, and the road to the offer.", "Comment fonctionne Candidatus : les quatre pièces, les Jalons pour commencer, et le chemin jusqu’à l’offre."),
    "assessments": ("Assessments", "Évaluations", "How marks work opened and folded, the overall ring, and Marks as a calm list.", "Comment fonctionnent les notes, ouvert puis replié, l’anneau d’ensemble, et les notes en liste calme."),
    "ascensus": ("Ascensus", "Ascensus", "A labour ticked and the xp rising, the fire set to Low ember, and the courses, each with its own number.", "Un labeur coché et l’xp qui monte, le feu mis sur Braise basse, et les cours, chacun avec son numéro."),
    "librarian": ("The Librarian", "Le Bibliothécaire", "A mood chosen: books from your own shelves come back as cards. The side keys stay beside the conversation.", "Une humeur choisie : des livres de vos propres rayons reviennent en cartes. Les touches du côté restent près de la conversation."),
    "magister": ("Magister", "Magister", "A question answered, in the conversation's new look.", "Une question à laquelle Magister répond, dans le nouvel aspect de la conversation."),
    "end": ("", "", "", ""),
}


def vtt(scenes, lang):
    def ts(t):
        h, r = divmod(max(0.0, t), 3600)
        m, s = divmod(r, 60)
        return "%02d:%02d:%06.3f" % (h, m, s)
    out = ["WEBVTT", ""]
    for i, s in enumerate(scenes):
        if s["id"] == "end":
            continue
        nxt = scenes[i + 1]["at"] if i + 1 < len(scenes) else s["at"] + 6
        n = NAMES[s["id"]]
        text = (n[1] + " : " + n[3]) if lang == "fr" else (n[0] + ": " + n[2])
        out += [str(i + 1), ts(s["at"]) + " --> " + ts(nxt - 0.05), text, ""]
    return "\n".join(out)


def read(n):
    t = open(os.path.join(HERE, n), encoding="utf-8").read()
    if "</script" in t or "</style" in t:
        raise SystemExit("film: a closing tag inside " + n)
    return t


def apply(p, full):
    if 'id="cd-film-1080' in p.s:
        raise SystemExit("film: already applied")
    for bid in ("cd-film-1079-css", "cd-film-1079-data", "cd-film-1079"):
        p.block(bid)  # each must be there exactly once
    cut = "full" if full else "sample"
    raw = open(os.path.join(FILM, cut + ".mp4"), "rb").read()
    if len(raw) > MAX_BYTES:
        raise SystemExit("film: the %s film is too large (%d bytes)" % (cut, len(raw)))
    scenes = json.load(open(os.path.join(FILM, cut + "_scenes.json"), encoding="utf-8"))
    keys = json.load(open(os.path.join(FILM, cut + "_keys.json"), encoding="utf-8"))
    for s in scenes:
        n = NAMES[s["id"]]
        s["en"], s["fr"], s["den"], s["dfr"] = n[0], n[1], n[2], n[3]
    js = read("film80.js")
    js = js.replace("/*CD_FILM_SCENES*/[]", json.dumps(scenes, ensure_ascii=False))
    js = js.replace("/*CD_FILM_VTT*/{ en: '', fr: '' }", json.dumps({"en": vtt(scenes, "en"), "fr": vtt(scenes, "fr")}, ensure_ascii=False))
    a = js.find("/*CD_FILM_KEYS*/")
    b = js.find("};", a) + 1
    js = js[:a] + json.dumps(keys, ensure_ascii=False, separators=(",", ":")) + js[b:]
    if "/*CD_FILM_" in js:
        raise SystemExit("film: a placeholder was left")
    css = read("film80.css")
    b64 = base64.b64encode(raw).decode("ascii")

    def swap(bid, new):
        x, y = p.block(bid)
        p.s = p.s[:x] + new + p.s[y:]
    swap("cd-film-1079-css", '<style id="cd-film-1080-css">\n' + css + '\n</style>')
    swap("cd-film-1079-data", '<script type="application/octet-stream" id="cd-film-1080-data">' + b64 + '</script>')
    swap("cd-film-1079", '<script id="cd-film-1080">\n' + js.replace("</", "<\\/") + "\n</script>")
    n_sc = len([s for s in scenes if s["id"] != "end"])
    print("    the Guidebook's film made sharp (%s cut, %d KB, %d scenes, %d frames) with this device's side keys" % (cut, len(raw) // 1024, n_sc, keys["frames"]))
