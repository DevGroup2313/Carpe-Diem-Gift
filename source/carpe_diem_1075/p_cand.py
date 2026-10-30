"""1075 · Candidatus's Overview and the Home Overview, in the design the owner approved.

The owner's words (30 October 2026): "I approve of the Candidatus page new design, push it everywhere please. Also,
please give the Overview page the same makeover, the current looks quite dull and plain."

Candidatus › Overview (`cand.js`, `renderCand`): the next step with its time and size, Begin with the Clepsydra, Break
it into smaller steps, Another step and Done; today's energy (Low is the app's own low-energy day, the Focus page's
switch); where you left off, with Resume; Now, Next and Later, Now holding three at most, moved by keys or by dragging;
the road to the offer; the four rings (Proposal, Applications, Funding, Visa); done this week; parked thoughts; help at
hand (five guides, the model email among them); and the app's own "How Candidatus works" card.
Home › Overview (`renderOv`): today with its parts of the day, the energy of the day with the next task on the Agenda,
Ascensus, reading and streak, French, and the proposal with its next step.
Cream, light blue, sage and butter cards, raised as the rest of Carpe Diem, in Carpe Diem's blue and gold, both
languages, by day and by night. The app's two drawing functions hand over to the new ones and draw the old pages if
the new ones fail."""
import os

HERE = os.path.dirname(os.path.abspath(__file__))

HANDOVER = [
    ("function renderCandOverview() {",
     "function renderCandOverview() { try { if (window.__cdxCand && window.__cdxCand() !== false) return; } catch (e) {}"),
    ("function renderOverview() {",
     "function renderOverview() { try { if (window.__cdxOverview && window.__cdxOverview() !== false) return; } catch (e) {}"),
]


def apply(p, full):
    for o, n in HANDOVER:
        p.rep(o, n, where="core")
    css = open(os.path.join(HERE, "cand.css"), encoding="utf-8").read()
    js = open(os.path.join(HERE, "cand.js"), encoding="utf-8").read()
    if "</script" in js or "</style" in css:
        raise SystemExit("cand: a closing tag inside the script or the style")
    if 'id="cd-cand-1075' in p.s:
        raise SystemExit("cand: already applied")
    p.before_body_end('<style id="cd-cand-1075-css">\n' + css + '\n</style>\n<script id="cd-cand-1075">\n' + js + '\n</script>')
    print("    Candidatus's Overview and the Home Overview in the approved design")
