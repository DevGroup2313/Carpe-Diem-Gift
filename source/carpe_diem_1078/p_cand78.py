"""1078 · How Candidatus works, redesigned and at the top of the Overview.

The owner's words (31 October 2026): "I want the "How Candidatus Works" card to be redesigned and placed on top of the
Overview page, it looks weird down there at the bottom." Approved from the preview: the four rooms as raised keys that
open them (Applications, Proposal, Milestones, Citations), Milestones marked Start here as the guide always advised, a
line on the Overview itself; Fold away keeps it as one line, remembered. The old fold-down guide at the foot goes; the
Guidebook keeps its own text."""
import os

HERE = os.path.dirname(os.path.abspath(__file__))

HOW = r"""
  // 1078 · How Candidatus works, at the top of the Overview, as the owner asked: the four rooms as keys that open them,
  // Milestones marked Start here as the guide always advised; Fold away keeps it as one line, and is remembered.
  function howCard() {
    var L = function (k, en) { try { return typeof tr === 'function' ? tr(k, en) : en; } catch (e) { return en; } };
    var R = [
      ['applications', '📋', L('cand.tabApplications', 'Applications'), T('The programmes you are applying to, each with its checklist and deadlines.', 'Les programmes auxquels vous postulez, chacun avec sa liste et ses échéances.')],
      ['proposal', '🖊️', L('cand.tabProposal', 'Proposal'), T('The proposal and its sections, each with its parts and its mark.', 'La proposition et ses sections, chacune avec ses parties et sa note.')],
      ['milestones', '🗓️', L('cand.tabMilestones', 'Milestones'), T('The dates, funding and visa: the whole cycle laid out, so nothing surprises you later.', 'Les dates, le financement et le visa : tout le cycle déployé, pour que rien ne vous surprenne ensuite.'), 1],
      ['citations', '📚', L('cand.tabCitations', 'Citations'), T('Every reference the proposal rests on, ready for Fontes and Tabula.', 'Chaque référence sur laquelle repose la proposition, prête pour Fontes et Tabula.')]
    ];
    var kick = T('How Candidatus works', 'Comment fonctionne Candidatus'), folded = false;
    try { folded = !!state.cdxHowFold; } catch (e) {}
    if (folded) {
      var line = R[0][2] + ', ' + R[1][2] + ', ' + R[2][2] + T(' and ', ' et ') + R[3][2] + T('; begin with ', ' ; commencez par les ') + R[2][2] + '.';
      return '<section class="cdx-card sky cdx-how folded cdx-rise" data-cdx="how"><div class="cdx-how-top"><span class="cdx-how-badge" aria-hidden="true">🗺️</span>'
        + '<div class="cdx-how-line"><b>' + esc(kick) + '</b>' + esc(line) + '</div>'
        + '<button type="button" class="cdx-key small" data-how-fold="0" aria-expanded="false">' + T('Show ▾', 'Montrer ▾') + '</button></div></section>';
    }
    return '<section class="cdx-card sky cdx-how cdx-rise" data-cdx="how"><div class="cdx-how-top"><span class="cdx-how-badge" aria-hidden="true">🗺️</span>'
      + '<div class="cdx-how-t"><p class="cdx-kick">' + esc(kick) + '</p><h3 class="cdx-h small">' + T('The application, in four rooms', 'La candidature, en quatre pièces') + '</h3></div>'
      + '<button type="button" class="cdx-key small" data-how-fold="1" aria-expanded="true">' + T('Fold away ▴', 'Replier ▴') + '</button></div>'
      + '<div class="cdx-how-map">' + R.map(function (r) {
        return '<button type="button" class="cdx-how-room' + (r[4] ? ' start' : '') + '" data-go="' + r[0] + '"' + (r[4] ? ' data-start="' + esc(T('Start here', 'Commencez ici')) + '"' : '') + '>'
          + '<span class="ic" aria-hidden="true">' + r[1] + '</span><b>' + esc(r[2]) + '</b><span class="d">' + esc(r[3]) + '</span><span class="go">' + T('Open ›', 'Ouvrir ›') + '</span></button>';
      }).join('') + '</div>'
      + '<p class="cdx-cap">' + T('This Overview keeps the next step, the road to the offer and the week together, so you can begin anywhere.', 'Cette vue d’ensemble réunit la prochaine étape, le chemin jusqu’à l’offre et la semaine, pour que vous puissiez commencer n’importe où.') + '</p></section>';
  }
  function renderCand() {"""

GUIDE = """    try { root.appendChild(buildGuideCard('🖊️  ' + TR('How Candidatus works'), (typeof tr === 'function' ? tr('gb.candBody', 'The application itself: the programmes you are applying to, the proposal and its sections, the milestones with their dates, and the funding and visa checklists. Open Milestones first; it lays out the whole cycle so nothing surprises you later.') : ''), null, 0)); } catch (e) {}
"""
FOLD = """    wire(root, renderCand);
    var hf = root.querySelector('[data-how-fold]');
    if (hf) hf.addEventListener('click', function (e) { e.stopPropagation(); try { state.cdxHowFold = hf.getAttribute('data-how-fold') === '1'; } catch (x) {} save(); renderCand(); var k = root.querySelector('[data-how-fold]'); if (k) try { k.focus({ preventScroll: true }); } catch (x) {} });
"""


def read(n):
    t = open(os.path.join(HERE, n), encoding="utf-8").read()
    if "</script" in t or "</style" in t:
        raise SystemExit("cand78: a closing tag inside " + n)
    return t


def once(blk, a, b, what):
    if blk.count(a) != 1:
        raise SystemExit("cand78: %s found %d times" % (what, blk.count(a)))
    return blk.replace(a, b)


def apply(p, full):
    if 'id="cd-cand-1078-css"' in p.s:
        raise SystemExit("cand78: already applied")
    a, b = p.block("cd-cand-1076")
    blk = p.s[a:b]
    blk = once(blk, "  function renderCand() {", HOW, "renderCand")
    blk = once(blk, GUIDE, "", "the old guide at the foot")
    blk = once(blk, "    var h = '<div class=\"cdx\" id=\"cdx-cand\">'\n", "    var h = '<div class=\"cdx\" id=\"cdx-cand\">' + howCard()\n", "the Overview's opening")
    blk = once(blk, "    wire(root, renderCand);\n", FOLD, "the wiring")
    p.s = p.s[:a] + blk + p.s[b:]
    p.before_body_end('<style id="cd-cand-1078-css">\n' + read("how78.css") + "\n</style>")
    print("    Candidatus: How Candidatus works at the top of the Overview")
