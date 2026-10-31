"""1077 · Home on a low-energy day is never empty.

The owner's words (31 October 2026): "after I leave the Overview page to go back to the Home tab, the entire Home page
is missing and I want that fixed and sorted."

The cause: Low on an Overview's energy card is the app's own low-energy day, which hides everything on Home but its top,
where only the day's next step stays; on a day with no next step (a Saturday, a day with no plan) nothing was left, and
the card that said what had happened lived on the old Overview only. `home.js` and `home.css` put the low day's own card
(the Focus page's, drawn by the support core) at the top of Home on such a day, with "Make today a Gentle Day" and "Show
everything again"; the energy cards' note for Low now says that Home shows only the essentials."""
import os

HERE = os.path.dirname(os.path.abspath(__file__))

NOTES = [
    ("A low day: one small thing is enough. Steps of a quarter of an hour come first; resting is part of the work.'",
     "A low day: one small thing is enough. Steps of a quarter of an hour come first; resting is part of the work. Home shows only the essentials today.'"),
    ("Un jour à faible énergie : une petite chose suffit. Les étapes d’un quart d’heure viennent d’abord ; se reposer fait partie du travail.'",
     "Un jour à faible énergie : une petite chose suffit. Les étapes d’un quart d’heure viennent d’abord ; se reposer fait partie du travail. L’accueil ne montre que l’essentiel aujourd’hui.'"),
]


def read(n):
    t = open(os.path.join(HERE, n), encoding="utf-8").read()
    if "</script" in t or "</style" in t:
        raise SystemExit("home: a closing tag inside " + n)
    return t


def apply(p, full):
    if 'id="cd-home-1077' in p.s:
        raise SystemExit("home: already applied")
    if p.s.count("window.__cdSC=SC") != 1:
        raise SystemExit("home: the support core is not as expected")
    if p.s.count('id="home-top"') != 1:
        raise SystemExit("home: Home's top is not as expected")
    for a, b in NOTES:
        if p.s.count(a) != 1:
            raise SystemExit("home: the energy note not found once: " + a[:60])
        p.s = p.s.replace(a, b)
    p.before_body_end('<style id="cd-home-1077-css">\n' + read("home.css") + '\n</style>\n<script id="cd-home-1077">\n' + read("home.js") + "\n</script>")
    print("    Home on a low-energy day: the low day's own card at its top")
