"""1078 · Home, as the owner approved (31 October 2026).

The owner's words: "I want to go with Option A the recommended look to the side of the Home/Overview tabs"; "the Offline
by Design card from the Home page needs to be redesigned because it looks weird against the rest of the page"; The seal
behind Home was tried in its own colours and the owner asked for it back: "Please revert the background seal to the all
blue look", so it is left exactly as it was.

`home78.css` and `home78.js`: the Home and Overview tabs in the Forge's look at the left of the Backup key's row; the
Offline by design notice as a cream card with its lock key, in its own words."""
import os

HERE = os.path.dirname(os.path.abspath(__file__))


def read(n):
    t = open(os.path.join(HERE, n), encoding="utf-8").read()
    if "</script" in t or "</style" in t:
        raise SystemExit("home78: a closing tag inside " + n)
    return t


def apply(p, full):
    if 'id="cd-home-1078' in p.s:
        raise SystemExit("home78: already applied")
    for need in ('id="home-subtabs"', 'id="offline-notice"', 'id="backup-toggle"', 'function renderHomeSubtabs('):
        if p.s.count(need) < 1:
            raise SystemExit("home78: not found: " + need)
    p.before_body_end('<style id="cd-home-1078-css">\n' + read("home78.css") + '\n</style>\n<script id="cd-home-1078">\n' + read("home78.js") + "\n</script>")
    print("    Home: the tabs in the Forge's look, Offline by design as a card")
