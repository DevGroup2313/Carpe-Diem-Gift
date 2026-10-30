"""make_eval.py: an evaluation copy of one of Carpe Diem's two demonstrations, made to be tried and assessed, not taken.

usage: make_eval.py IN.html OUT.html [--for "Recipient"] [--copy CODE] [--until YYYY-MM-DD]

From the page of the public sample or the committee demonstration (never the owner's own edition):
* the tools that hand out the app's own code go: the mini Forge (The Forge's own page, carried whole) and the page's
  photograph of itself, which "Edit this app" and copies of the app are made from; the Forge's window says the Forge
  is not part of the copy, and Edit this app is not offered;
* comments go, and every script, Tabula's, Abacus's, Imago's, Scriba's and Fontes's included, is made compact (local
  names shortened, white space gone), by terser; the seal's stamp and the data blocks are left as they are;
* the terms of the copy are shown before it first opens (the committee's) and from a mark at the foot of the screen,
  with the name of the person or panel it is lent to and the copy's own code;
* the integrity seal is made again for the compact core."""
import base64, json, os, random, re, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "lib"))
import lib  # noqa: E402

ROOMS = ["TABULA_SRC", "ABACUS_SRC", "SLIDES_SRC", "SCRIBA_SRC", "FONTES_SRC"]


def node_min(html):
    with tempfile.TemporaryDirectory() as d:
        a, b = os.path.join(d, "in.html"), os.path.join(d, "out.html")
        open(a, "w", encoding="utf-8").write(html)
        r = subprocess.run(["node", os.path.join(HERE, "minify_html.js"), a, b], capture_output=True, text=True)
        if r.returncode != 0:
            raise SystemExit("minify: " + (r.stderr or r.stdout)[-800:])
        info = json.loads(r.stdout.strip().splitlines()[-1])
        if info["kept"]:
            print("    left as written:", info["kept"])
        return open(b, encoding="utf-8").read(), info


def drop_element(s, open_tag, what):
    i = s.find(open_tag)
    if i < 0:
        raise SystemExit("%s not found" % what)
    j = s.index("</script>", i) + len("</script>")
    if s.find(open_tag, j) >= 0:
        raise SystemExit("%s found twice" % what)
    return s[:i] + s[j:]


def once(s, old, new, what):
    if s.count(old) != 1:
        raise SystemExit("%s: found %d times" % (what, s.count(old)))
    return s.replace(old, new)


def make(src, recipient="", copy="", until=""):
    p = lib.Page(src, "page")
    ed = p.edition()
    if ed not in ("Public sample", "Committee demo"):
        raise SystemExit("an evaluation copy is made from the public sample or the committee demonstration, not %r" % (ed or "the owner's own edition"))
    kind = "committee" if ed == "Committee demo" else "sample"
    s = p.s
    s = drop_element(s, '<script type="cd/b64" id="cd-self-src-data">', "the page's photograph of itself")
    s = drop_element(s, '<script id="cd-forge-pack" type="text/plain">', "the mini Forge")
    s = drop_element(s, '<script id="cd-forge-dress" type="text/plain">', "the mini Forge's dress")
    s = once(s, """      if (!html) {
        note.textContent = T('The Forge could not be unpacked on this device.',
                             'La Forge n\\u2019a pas pu \\u00eatre d\\u00e9ball\\u00e9e sur cet appareil.');
        return;
      }""", """      if (!html) {
        try { editApp.style.display = 'none'; } catch (e) {}
        note.textContent = T('The Forge, Carpe Diem\\u2019s workshop, is not part of this copy.',
                             'La Forge, l\\u2019atelier de Carpe Diem, ne fait pas partie de cette copie.');
        return;
      }""", "the Forge's window")
    # the rooms' own pages, compact too
    for var in ROOMS:
        m = re.search(r'var %s = "([A-Za-z0-9+/=]+)"' % var, s)
        if not m or s.count('var %s = "' % var) != 1:
            raise SystemExit("%s not found once" % var)
        room = base64.b64decode(m.group(1)).decode("utf-8")
        small, info = node_min(room)
        enc = base64.b64encode(small.encode("utf-8")).decode("ascii")
        s = s[:m.start(1)] + enc + s[m.end(1):]
        print("    %s: %d scripts, %d -> %d bytes" % (var, info["scripts"], len(room), len(small)))
    E = {"kind": kind, "for": recipient, "copy": copy, "until": until, "build": p.build()[1]}
    tag = open(os.path.join(HERE, "eval.html"), encoding="utf-8").read().replace("/*CD_EVAL*/{}", json.dumps(E, ensure_ascii=False).replace("</", "<\\/"))
    p.s = s
    p.before_body_end(tag)
    small, info = node_min(p.s)
    print("    page: %d scripts made compact, %d -> %d bytes of script" % (info["scripts"], info["from"], info["to"]))
    q = lib.Page(small, "page")
    q.reseal(q.build()[0])
    for bad in (r'id="cd-self-src-data">\s*H4sI', r'id="cd-forge-pack"[^>]*>\s*H4sI', r'forge-bi-self'):
        if re.search(bad, q.s):
            raise SystemExit("left in the copy: " + bad)
    return q.s, E


def copy_code():
    return "CD-" + "".join(random.SystemRandom().choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(6))


if __name__ == "__main__":
    args = sys.argv[1:]
    if len(args) < 2:
        sys.exit(__doc__)
    opt = {"--for": "", "--copy": "", "--until": ""}
    rest = []
    i = 0
    while i < len(args):
        if args[i] in opt and i + 1 < len(args):
            opt[args[i]] = args[i + 1]; i += 2
        else:
            rest.append(args[i]); i += 1
    if opt["--until"] and not re.match(r"^\d{4}-\d\d-\d\d$", opt["--until"]):
        raise SystemExit("--until is a date, YYYY-MM-DD")
    page, E = make(open(rest[0], encoding="utf-8").read(), opt["--for"], opt["--copy"] or copy_code(), opt["--until"])
    open(rest[1], "w", encoding="utf-8").write(page)
    print(json.dumps(E, ensure_ascii=False), len(page))
