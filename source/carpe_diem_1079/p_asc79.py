"""1079 · Ascensus: the neon lights back, in the new design.

The owner's words (31 October 2026): "I want the neon flashing lights back on the Ascensus page but I also want to keep
the new design look of the page, I just want the neon flashing lights for the page."

`asc79.css`: the labours and the rank card glow again through gold, blue, lilac, teal and rose on the app's own round
(its ascCardAura, 17 seconds, each labour a little out of step), the glow laid over the new raised cards so their look
stays; Calm, minimal motion and a device's reduced motion keep a still, soft gold glow instead of the flashing."""
import os

HERE = os.path.dirname(os.path.abspath(__file__))


def apply(p, full):
    if 'id="cd-asc-1079-css"' in p.s:
        raise SystemExit("asc79: already applied")
    if 'id="cd-pages-1078"' not in p.s or "@keyframes ascCardAura" not in p.s:
        raise SystemExit("asc79: the 1078 Ascensus or the app's own aura is not there")
    t = open(os.path.join(HERE, "asc79.css"), encoding="utf-8").read()
    if "</style" in t:
        raise SystemExit("asc79: a closing tag inside asc79.css")
    p.before_body_end('<style id="cd-asc-1079-css">\n' + t + "\n</style>")
    print("    Ascensus: the neon lights back on the labours and the rank card")
