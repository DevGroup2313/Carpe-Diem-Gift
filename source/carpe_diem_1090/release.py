"""Writes a build's record into the repositories, for any pass from 1063 on: the owner's private repository (BUILD_INFO,
the Windows installer's version, the Fire tablet's version name, the READMEs' "New in build N"), the two website
repositories (the page, the keeper's cache name, BUILD_INFO, the README) and the iPhone and iPad repository (the full
edition's page, the project's version, the README). Each change is found exactly once, or it stops.

usage: release.py notes.json gift GIFT_REPO
       release.py notes.json web REPO PAGE.html
       release.py notes.json ios REPO FULL_PAGE.html
notes.json: {"date","pass","stamp","prev","when","ios_version","en","web","ios"}"""
import json, os, re, shutil, sys


def load(path):
    n = json.load(open(path, encoding="utf-8"))
    n["prev_stamp"] = "52817" + n["prev"]
    return n


def rw(path, fn):
    raw = open(path, "rb").read()
    crlf = b"\r\n" in raw
    t = raw.decode("utf-8").replace("\r\n", "\n")
    t2 = fn(t)
    if crlf:
        t2 = t2.replace("\n", "\r\n")
    open(path, "wb").write(t2.encode("utf-8"))


def once(t, a, b, what=""):
    if t.count(a) != 1:
        raise SystemExit("not found once%s: %r" % ((" in " + what) if what else "", a[:100]))
    return t.replace(a, b)


def build_info(t, n, pas=None, stamp=None):
    t2, k = re.subn(r"Build: \d{4}-\d\d-\d\d\nPass: \d+\nStamp: \d+", "Build: %s\nPass: %s\nStamp: %s" % (n["date"], pas or n["pass"], stamp or n["stamp"]), t)
    if k != 1:
        raise SystemExit("BUILD_INFO: the record was not found once")
    return t2


def gift(n, repo):
    j = lambda *p: os.path.join(repo, *p)
    for proj in ("Mac project", "Windows project", "Fire tablet project"):
        rw(j(proj, "BUILD_INFO.txt"), lambda t: build_info(t, n))
    rw(j("Windows project", "build", "carpe_diem.iss"), lambda t: re.sub(r'#define AppVersion "\d{4}"', '#define AppVersion "%s"' % n["pass"], t))
    rw(j("Fire tablet project", "app", "build.gradle"), lambda t: re.sub(r"versionName '\d{4}'", "versionName '%s'" % n["pass"], t))
    head_old = '**Build %s, %s.** The About panel in the app ends with\n"Build %s · %s".' % (n["prev"], n["prev_when"], n["prev"], n["prev_stamp"])
    head_new = '**Build %s, %s.** The About panel in the app ends with\n"Build %s · %s".' % (n["pass"], n["when"], n["pass"], n["stamp"])

    def md(t):
        t = once(t, head_old, head_new, "README.md")
        t = t.replace("version %s." % n["prev"], "version %s." % n["pass"], 1)
        return once(t, "## New in build %s\n" % n["prev"], "## New in build %s\n\n%s\n\n## Earlier, in build %s\n" % (n["pass"], n["en"], n["prev"]), "README.md")
    rw(j("Mac project", "README.md"), md)
    rw(j("Windows project", "README.md"), md)

    def fire(t):
        t = once(t, 'Build %s, %s. The About panel inside the app ends with\n"Build %s · %s".\nThe app\'s own version is %s too;' % (n["prev"], n["prev_when"], n["prev"], n["prev_stamp"], n["prev"]),
                 'Build %s, %s. The About panel inside the app ends with\n"Build %s · %s".\nThe app\'s own version is %s too;' % (n["pass"], n["when"], n["pass"], n["stamp"], n["pass"]), "README_BUILD.txt")
        body = "\n".join(("  " + x) if x else "" for x in n["en"].split("\n"))
        return once(t, "NEW IN BUILD %s\n" % n["prev"], "NEW IN BUILD %s\n%s\n\n\nEARLIER, IN BUILD %s\n" % (n["pass"], body, n["prev"]), "README_BUILD.txt")
    rw(j("Fire tablet project", "README_BUILD.txt"), fire)
    print("Gift repository: build %s written" % n["pass"])


def web(n, repo, page):
    if 'pass:"%s"' % n["pass"] not in open(page, encoding="utf-8").read():
        raise SystemExit("%s is not build %s" % (page, n["pass"]))
    shutil.copyfile(page, os.path.join(repo, "index.html"))

    def sw(t):
        t2, k = re.subn(r'const CACHE = "(carpe-diem-demo-[a-z]+)-v\d+";', lambda m: 'const CACHE = "%s-v%s%s";' % (m.group(1), n["date"].replace("-", ""), n["pass"]), t)
        if k != 1:
            raise SystemExit("sw.js: the keeper's name was not where expected")
        return t2
    rw(os.path.join(repo, "sw.js"), sw)
    rw(os.path.join(repo, "BUILD_INFO.txt"), lambda t: build_info(t, n))

    def readme(t):
        m = re.search(r'\*\*Build %s, %s\.\*\* The About panel ends with "%s · %s · ([^"]+)"\.' % (n["prev"], re.escape(n["prev_when"]), n["prev"], n["prev_stamp"]), t)
        if not m:
            raise SystemExit("README: the build line was not where expected")
        t = t.replace(m.group(0), '**Build %s, %s.** The About panel ends with "%s · %s · %s".' % (n["pass"], n["when"], n["pass"], n["stamp"], m.group(1)), 1)
        return once(t, "**New in build %s.**" % n["prev"], "**New in build %s.** %s\n\n**Earlier, in build %s.**" % (n["pass"], n["web"], n["prev"]), "README.md")
    rw(os.path.join(repo, "README.md"), readme)
    print("written", repo)


def ios(n, repo, page):
    s = open(page, encoding="utf-8").read()
    if 'pass:"%s"' % n["pass"] not in s or re.search(r'window\.CD_BUILD=\{[^}]*edition:', s):
        raise SystemExit("%s is not the full edition of build %s" % (page, n["pass"]))
    app = os.path.join(repo, "iphone-ipad")
    shutil.copyfile(page, os.path.join(app, "CarpeDiem", "www", "carpe_diem.html"))
    v = n["ios_version"]
    rw(os.path.join(app, "BUILD_INFO.txt"), lambda t: re.sub(r"Carpe Diem: build \d+, the full edition", "Carpe Diem: build %s, the full edition" % n["pass"], build_info(t, n, v, v)))
    rw(os.path.join(app, "CarpeDiem.xcodeproj", "project.pbxproj"), lambda t: re.sub(r"(CURRENT_PROJECT_VERSION|MARKETING_VERSION) = \d+;", r"\g<1> = %s;" % v, t))

    def readme(t):
        t2, k = re.subn(r"Build \d+ \(\d+\), \d{4}-\d\d-\d\d\. Carpe Diem build \d+, the full edition\.", "Build %s (%s), %s. Carpe Diem build %s, the full edition." % (v, v, n["date"], n["pass"]), t, count=1)
        if k != 1:
            raise SystemExit("README.txt: the build line was not where expected")
        body = "\n".join(("  " + x) if x else "" for x in n["ios"].split("\n"))
        return once(t2, "NEW IN THIS BUILD\n", "NEW IN THIS BUILD\n%s\n\nEARLIER, IN CARPE DIEM %s\n" % (body, n["prev"]), "README.txt")
    rw(os.path.join(app, "README.txt"), readme)
    print("written", repo)


if __name__ == "__main__":
    n = load(sys.argv[1])
    kind = sys.argv[2]
    if kind == "gift":
        gift(n, sys.argv[3])
    elif kind == "web":
        web(n, sys.argv[3], sys.argv[4])
    elif kind == "ios":
        ios(n, sys.argv[3], sys.argv[4])
    else:
        sys.exit(__doc__)
