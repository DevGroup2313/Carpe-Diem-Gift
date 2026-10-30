"""Pass 1073 of Carpe Diem, for each edition: the owner's full edition and the two demonstrations.

usage: cd1073.py IN_1072.html OUT.html
The edition is read from the page's build record (none: the owner's full edition)."""
import os, re, sys, importlib

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import lib, selfsrc

DATE, PASS, STAMP, PREV = "2026-10-30", "1073", "528171073", "1072"
PARTS = ["p_rooms", "p_builders"]


def boot_map(p):
    """Where each of the page's scripts begins, in thousandths of the page, for the loading bar (pass 1060)."""
    mark = "/*CD_BOOT_MAP*/"
    i = p.s.find(mark)
    if i < 0:
        raise SystemExit("no boot map mark")
    j = p.s.index("]", i) + 1
    n = len(p.s)
    vals = sorted(set(min(999, int(m.start() * 1000 / n)) for m in re.finditer(r"<script\b", p.s)))
    p.s = p.s[:i] + mark + "[" + ",".join(str(v) for v in vals) + "]" + p.s[j:]


def main(src, dst):
    p = lib.Page(open(src, encoding="utf-8").read(), os.path.basename(src))
    b = p.build()
    if not b or b[1] != PREV:
        raise SystemExit("%s is not Carpe Diem %s" % (src, PREV))
    ed = p.edition()
    full = ed == ""
    print("%s: edition %s" % (p.label, ed or "full (the owner's)"))
    for name in PARTS:
        importlib.import_module(name).apply(p, full)
        print("  applied", name)
    boot_map(p)
    p.set_build(DATE, PASS, STAMP)
    print("  seal", p.reseal(DATE)[:16])
    p.s = selfsrc.rephoto(p.s)
    importlib.import_module("p_minforge").trust(p, selfsrc.current(p.s))
    if re.search(r"<script[^>]+src=[\"']https?://[^\"']*claude(usercontent)?\.(ai|com)", p.s):
        raise SystemExit("a script from outside that does not belong")
    open(dst, "w", encoding="utf-8").write(p.s)
    print("  written", dst, len(p.s.encode("utf-8")))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
