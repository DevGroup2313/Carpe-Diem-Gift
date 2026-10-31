"""1076 · the animated 3D feel of the new pages, and Candidatus's other four tabs in the design of its Overview.

The owner's words (31 October 2026): "The new redesigned pages look stiff and does not have the animated clickable feel
and motion that the rest of the apps buttons and surfaces have, please fix that and add the animated popped out 3D look
and feel to them please." "You only redesigned the Overview tab of the Candidatus page and did not do the same to the
Applications, Proposal, Milestones and Citations tab please redesign them as well because the Overview page just looks
really random right now on its own." "I really dislike flat buttons, I want them all to look clickable and popped out 3D."

`cand.css` and `cand.js` take the place of 1075's: every key stands on its edge, rises under the pointer and sinks when
pressed, on the app's own springy curve and with the app's own shadows, by day and by night; every card is raised and
lifts; nothing that can be pressed is flat (the time of a step, the stations of the road, the steps' keys and boxes, the
guides, the parts of the day); the cards pop in as the app's pages do, and no longer stay pinned by their entrance, which
had kept them from lifting; rings, bars and the road fill in; a finished step bows out and a moved one lands with a
spring. At a phone's width every key keeps clear of the dock at the right edge.
`tabs.css` and `tabs.js`: Applications, Proposal, Milestones and Citations in the same cards and keys, everything each
tab did kept (the app's own working parts are set in the new cards). The demonstrations keep their own pages."""
import os

HERE = os.path.dirname(os.path.abspath(__file__))


def read(n):
    t = open(os.path.join(HERE, n), encoding="utf-8").read()
    if "</script" in t or "</style" in t:
        raise SystemExit("cand2: a closing tag inside " + n)
    return t


def apply(p, full):
    a, b = p.block("cd-cand-1075-css")
    p.s = p.s[:a] + '<style id="cd-cand-1076-css">\n' + read("cand.css") + "\n" + read("tabs.css") + "\n</style>" + p.s[b:]
    a, b = p.block("cd-cand-1075")
    p.s = p.s[:a] + '<script id="cd-cand-1076">\n' + read("cand.js") + '\n</script>\n<script id="cd-tabs-1076">\n' + read("tabs.js") + "\n</script>" + p.s[b:]
    if p.s.count('id="cd-cand-1075') or p.s.count("__cdx1075") != 2 or 'id="cd-raise-' in p.s:
        raise SystemExit("cand2: the 1075 module is not replaced cleanly")
    print("    the new pages' 3D feel and motion; Applications, Proposal, Milestones and Citations redesigned")
