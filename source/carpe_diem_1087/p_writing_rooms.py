# -*- coding: utf-8 -*-
"""1087 · the Writing Rooms, each with a face of its own.

The owner: "I want the "Proposal", "Curriculum", "Research Writing" and "French Tutor" pages to be redesigned and
receive a major upgrade in how they look, they do not match the rest of the app and look plain and basic. I want these
rooms to properly fit the rest of the app and gain their own individual looks and identity. I want them to keep in line
with the popped out animated 3D look and feel of Carpe Diem and its themes and design."

The four open in one shared frame (workspaceShell, dressed by pass 411's rail), so they looked alike and flat.
`wr1087.js` wraps the frame once more: each room gets its medallion (a quill, a laurelled book, a compass rose, a
fleur-de-lis), its colour (ink blue, oxblood, forest green, French blue), its Latin line (PROPOSITVM, CVRRICVLVM, ARS
SCRIBENDI, LINGVA GALLICA) and its emblem as a faint watermark; its doors become raised cards with a badge each that
lift under the pointer and come in one after another. The pages inside a room keep its face, smaller. The French Tutor's
modes, sets, score, question and answers are drawn in the same hand, its question at full width. Night mode, folio mode,
the reader's Motion and Depth settings and a phone's width are all followed. What any page does is not touched."""
import os

HERE = os.path.dirname(os.path.abspath(__file__))


def apply(p, full):
    if 'id="cd-wr-1087"' in p.s:
        raise SystemExit("the Writing Rooms have their faces already")
    if 'id="cd-ws-rail"' not in p.s:
        raise SystemExit("the page has no Writing Rooms rail (pass 411) for this pass to dress")
    js = open(os.path.join(HERE, "wr1087.js"), encoding="utf-8").read()
    css = open(os.path.join(HERE, "wr1087.css"), encoding="utf-8").read()
    block = '<style id="cd-wr-1087-css">\n' + css + '</style>\n<script id="cd-wr-1087">\n' + js + '</script>\n'
    k = p.s.rfind("</body>")
    if k < 0 or p.s.find('id="cd-ws-rail"') > k:
        raise SystemExit("the page's end is not as this pass expects")
    p.s = p.s[:k] + block + p.s[k:]
    print("    the Writing Rooms: a face for each (%d bytes)" % len(block))
