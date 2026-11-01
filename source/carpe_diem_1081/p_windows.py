"""1080 · Windows: the side keys hold one look in floating and room windows; day and night reach a room window at once.

The owner's words (1 November 2026): "the side buttons of the exported floating windows for the apps on the Windows app
only, particularly the Quiet Screen leaf keeps glitching in and out of its updated design without the black harsh lines,
the emoji bell and some of the other emojis are transparent" and "the Light/Dark mode change and some other transitions
are moving really slow on the standalone exported floating windows".

On Windows 10 pass 1060 shows Microsoft's flat pictures for the side keys. A floating window's column of keys
(cd-jewel-js, dressFabs, every 700 ms) copied each main key's text: the leaf as the text 🌿, which undid the picture that
pass 1060 put back every 1.5 s (the leaf flickered between the two looks); the bell and the 💭 as the text of a key that
now holds only a picture, that is nothing (empty keys, only the bell's red count showing). The column now writes through
one function (windows1080.js, cdWinKey1080): the main key's picture where pictures are shown, else its text as before.

The day/night key was rewritten three to ten times per change (cdThemeIcon, the rooms' replies); each rewrite undressed
its picture and set off the page-wide watchers. A write that shows what the key shows is now dropped.

In a room's own window (#cd=<room>) a change of day or night is shown at once (the page, the room, the key) and the
desk's redraw, which nothing in that window shows, follows 260 ms later; the desk under the room is not drawn
(windows1080.css). Nothing changes for the desk's own window or for other systems' keys."""
import os

HERE = os.path.dirname(os.path.abspath(__file__))

DRESS_OLD = "          var want = glyphOf(m.pid);\n          if (want && g.innerHTML !== want) g.innerHTML = want;"
DRESS_NEW = ("          var want = glyphOf(m.pid);\n"
             "          if (typeof window.cdWinKey1080 === 'function') { try { window.cdWinKey1080(g, m.pid, want); } catch (e) {} }\n"
             "          else if (want && g.innerHTML !== want) g.innerHTML = want;")


def _read(name):
    t = open(os.path.join(HERE, name), encoding="utf-8").read()
    if "</script" in t or "</style" in t:
        raise SystemExit("windows: a closing tag inside " + name)
    return t


def apply(p, full):
    if 'id="cd-windows-1080"' in p.s:
        raise SystemExit("windows: already applied")
    for need in ('id="cd-jewel-js"', 'id="cd-1060-emoji"', 'id="cd-room-only-1045"'):
        if need not in p.s:
            raise SystemExit("windows: %s is not there" % need)
    a, b = p.block("cd-jewel-js")
    if p.s[a:b].count(DRESS_OLD) != 1:
        raise SystemExit("windows: the floating window's key writer is not found once in cd-jewel-js")
    p.rep(DRESS_OLD, DRESS_NEW, 1)
    p.before_body_end('<style id="cd-windows-1080-css">\n' + _read("windows1080.css") + "</style>\n"
                      '<script id="cd-windows-1080">\n' + _read("windows1080.js") + "</script>")
    print("    windows: one writer for the floating windows' keys; day and night at once in a room's own window")
