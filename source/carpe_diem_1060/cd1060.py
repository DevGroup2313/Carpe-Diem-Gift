"""Pass 1060 of Carpe Diem, for each edition: the owner's full edition and the two demonstrations.

usage: cd1060.py IN_1059.html OUT.html
The edition is read from the page's build record (none: the owner's full edition)."""
import os, re, sys, importlib

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import lib, selfsrc

DATE, PASS, STAMP = "2026-10-29", "1060", "528171060"
PARTS = ["p_proposal", "p_runtime", "p_sidekeys", "p_reminders", "p_emoji", "p_refresh", "p_about", "p_builders"]
SPLASH_END = ('<script id="cd-1060-splash-end">try{window.__cdSplashTo&&__cdSplashTo(1,"Setting out your desk: the rooms, your work and today\\u2019s plan.",'
              '"Mise en place du bureau : les pi\\u00e8ces, votre travail et le programme du jour.");}catch(e){}</script>')


def main(src, dst):
    p = lib.Page(open(src, encoding="utf-8").read(), os.path.basename(src))
    b = p.build()
    if not b or b[1] != "1059":
        raise SystemExit("%s is not Carpe Diem 1059" % src)
    ed = p.edition()
    full = ed == ""
    print("%s: edition %s" % (p.label, ed or "full (the owner's)"))
    for name in PARTS:
        mod = importlib.import_module(name)
        mod.apply(p, full)
        print("  applied", name)
    p.before_body_end(SPLASH_END)
    importlib.import_module("p_refresh").boot_map(p)
    p.set_build(DATE, PASS, STAMP)
    h = p.reseal(DATE)
    print("  seal", h[:16])
    if full or 'id="cd-self-src-data"' in p.s:
        p.s = selfsrc.rephoto(p.s)
        print("  photograph of itself taken again")
    if re.search(r"<script[^>]+src=[\"']https?://[^\"']*claude(usercontent)?\.(ai|com)", p.s):
        raise SystemExit("a script from outside that does not belong")
    open(dst, "w", encoding="utf-8").write(p.s)
    print("  written", dst, len(p.s.encode("utf-8")))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
