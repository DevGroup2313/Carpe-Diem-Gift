"""1079 · the Guidebook's film, "Carpe Diem in action", with a link in the tour.

The owner's words (31 October 2026): "I want you to add the preview video that you sent me inside of Carpe Diem's
Guidebook and also a link in the tour, I think it is a great way for users to interact with and really see the app in
action, that is an even better way to experience the app and makes it more AuDHD accessible."

The film the owner saw showed the owner's own programmes and notes, so it is never put in a page: the same kind of film
is made again (`rec_film.js`), from a fresh profile, with neutral sample entries in Candidatus. The owner's edition
carries the cut with Candidatus; the two demonstrations carry their own cut, filmed from the public sample, which has no
Candidatus. `film79.css` and `film79.js` give the calm player (nothing plays until asked, no sound, captions on, slower
or faster, From the start, a key for each scene, Read instead) and its entries: a card at the top of the Guidebook, a key
beside the guided tour's, and a key in the tour's first chapter and at its end. The film lives in the page as base64 and
becomes a playable file only when first opened, so it plays with the network off."""
import base64, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
FILM = os.path.join(HERE, "film")

NAMES = {
    "home": ("Home", "Accueil", "Home, with its tabs at the left of the Backup key's row.", "L’accueil, avec ses onglets à gauche de la rangée du bouton Sauvegarde."),
    "overview": ("The Overview", "La vue d’ensemble", "Today's energy chosen: the keys rise under the pointer and sink when pressed.", "L’énergie du jour choisie : les touches se lèvent sous le pointeur et s’enfoncent quand on appuie."),
    "candidatus": ("Candidatus", "Candidatus", "How Candidatus works: the four rooms, Milestones to start with, and the road to the offer.", "Comment fonctionne Candidatus : les quatre pièces, les Jalons pour commencer, et le chemin jusqu’à l’offre."),
    "assessments": ("Assessments", "Évaluations", "How marks work opened and folded, the overall ring, and Marks as a calm list.", "Comment fonctionnent les notes, ouvert puis replié, l’anneau d’ensemble, et les notes en liste calme."),
    "ascensus": ("Ascensus", "Ascensus", "A labour ticked and the xp rising, the fire set to Low ember, and the courses, each with its own number.", "Un labeur coché et l’xp qui monte, le feu mis sur Braise basse, et les cours, chacun avec son numéro."),
    "librarian": ("The Librarian", "Le Bibliothécaire", "A mood chosen: books from your own shelves come back as cards.", "Une humeur choisie : des livres de vos propres rayons reviennent en cartes."),
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
        raise SystemExit("film79: a closing tag inside " + n)
    return t


def apply(p, full):
    if 'id="cd-film-1079' in p.s:
        raise SystemExit("film79: already applied")
    cut = "full" if full else "sample"
    mp4 = os.path.join(FILM, cut + ".mp4")
    scenes = json.load(open(os.path.join(FILM, cut + "_scenes.json"), encoding="utf-8"))
    for s in scenes:
        n = NAMES[s["id"]]
        s["en"], s["fr"], s["den"], s["dfr"] = n[0], n[1], n[2], n[3]
    raw = open(mp4, "rb").read()
    if len(raw) > 6 * 1024 * 1024:
        raise SystemExit("film79: the %s film is too large (%d bytes)" % (cut, len(raw)))
    js = read("film79.js")
    js = js.replace("/*CD_FILM_SCENES*/[]", json.dumps(scenes, ensure_ascii=False))
    js = js.replace("/*CD_FILM_VTT*/{ en: '', fr: '' }", json.dumps({"en": vtt(scenes, "en"), "fr": vtt(scenes, "fr")}, ensure_ascii=False))
    if "/*CD_FILM_" in js:
        raise SystemExit("film79: a placeholder was left")
    b64 = base64.b64encode(raw).decode("ascii")
    p.before_body_end('<style id="cd-film-1079-css">\n' + read("film79.css") + '\n</style>\n<script id="cd-film-1079-data">window.__cdFilmB64="' + b64
                      + '";</script>\n<script id="cd-film-1079">\n' + js.replace("</", "<\\/") + "\n</script>")
    print("    the Guidebook's film (%s cut, %d KB, %d scenes) and its link in the tour" % (cut, len(raw) // 1024, len([s for s in scenes if s["id"] != "end"])))
