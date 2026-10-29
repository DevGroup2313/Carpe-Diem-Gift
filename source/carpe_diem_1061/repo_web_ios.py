"""Writes Carpe Diem 1060 into the website repositories (the public sample and the committee demonstration) and the
full edition into the iPhone and iPad repository, as the owner asked ("I want the full version of the Carpe Diem for my
iphone and ipad, not the demo version").
usage: repo_web_ios.py web REPO PAGE.html
       repo_web_ios.py ios REPO FULL_PAGE.html"""
import os, re, shutil, sys
import repo_gift

DATE, PASS, STAMP, WHEN = repo_gift.DATE, repo_gift.PASS, repo_gift.STAMP, repo_gift.WHEN

WEB_NEW = ("**New in build 1061.** Carpe Diem and a room can share the screen: the ↗ key of a floating window offers "
           "\"Side by side with Carpe Diem\", with the room on the right, Carpe Diem on the left and a line between them that "
           "can be dragged; the same place then offers \"Float again\". It works on the tablet and the iPad too. The copy of "
           "a room as a page in the browser is no longer offered there. The small notes at the foot of the screen take the "
           "reminders' pastel card.\n\n")


def edit(p, fn):
    raw = open(p, "rb").read()
    crlf = b"\r\n" in raw
    t = raw.decode("utf-8").replace("\r\n", "\n")
    t = fn(t)
    if crlf:
        t = t.replace("\n", "\r\n")
    open(p, "wb").write(t.encode("utf-8"))


def once(t, a, b):
    if t.count(a) != 1:
        raise SystemExit("not found once: %r" % a[:100])
    return t.replace(a, b)


def web(repo, page):
    s = open(page, encoding="utf-8").read()
    if 'pass:"%s"' % PASS not in s:
        raise SystemExit("%s is not build %s" % (page, PASS))
    shutil.copyfile(page, os.path.join(repo, "index.html"))

    def sw(t):
        t2, n = re.subn(r'const CACHE = "(carpe-diem-demo-[a-z]+)-v\d+";', lambda m: 'const CACHE = "%s-v%s%s";' % (m.group(1), DATE.replace("-", ""), PASS), t)
        if n != 1:
            raise SystemExit("sw.js: the keeper's name was not where expected")
        return t2
    edit(os.path.join(repo, "sw.js"), sw)
    edit(os.path.join(repo, "BUILD_INFO.txt"), lambda t: re.sub(r"Build: \d{4}-\d\d-\d\d\nPass: \d{4}\nStamp: \d+", "Build: %s\nPass: %s\nStamp: %s" % (DATE, PASS, STAMP), t))

    def readme(t):
        m = re.search(r'\*\*Build 1060, 29 October 2026\.\*\* The About panel ends with "1060 · 528171060 · ([^"]+)"\.', t)
        if not m:
            raise SystemExit("README: the build line was not where expected")
        t = t.replace(m.group(0), '**Build %s, %s.** The About panel ends with "%s · %s · %s".' % (PASS, WHEN, PASS, STAMP, m.group(1)), 1)
        t = once(t, "**New in build 1060.**", WEB_NEW + "**Earlier, in build 1060.**")
        return t
    edit(os.path.join(repo, "README.md"), readme)
    print("written", repo)


IOS_NEW = """NEW IN THIS BUILD
  Carpe Diem and a room can share the screen: the ↗ key of a floating
  window offers "Side by side with Carpe Diem", with the room on the right,
  Carpe Diem on the left, and a line between them that can be dragged; the
  same place then offers "Float again". The copy of a room as a page in
  the browser is no longer offered there.

EARLIER, IN THE BUILD OF 29 OCTOBER 2026 (CARPE DIEM 1060)
"""


def ios(repo, page):
    s = open(page, encoding="utf-8").read()
    if 'pass:"%s"' % PASS not in s or re.search(r'window\.CD_BUILD=\{[^}]*edition:', s):
        raise SystemExit("%s is not the full edition of build %s" % (page, PASS))
    app = os.path.join(repo, "iphone-ipad")
    shutil.copyfile(page, os.path.join(app, "CarpeDiem", "www", "carpe_diem.html"))
    ver = DATE.replace("-", "")
    edit(os.path.join(app, "BUILD_INFO.txt"), lambda t: re.sub(r"Build: \d{4}-\d\d-\d\d\nPass: \d+\nStamp: \d+\nCarpe Diem: build \d+, the full edition", "Build: %s\nPass: %s\nStamp: %s\nCarpe Diem: build %s, the full edition" % (DATE, ver + "01", ver + "01", PASS), t))
    edit(os.path.join(app, "CarpeDiem.xcodeproj", "project.pbxproj"), lambda t: re.sub(r"(CURRENT_PROJECT_VERSION|MARKETING_VERSION) = \d+;", r"\g<1> = %s;" % (ver + "01"), t))
    # the app's own version follows the project's (it was written in by hand, and had fallen behind it)
    edit(os.path.join(app, "CarpeDiem", "Info.plist"), lambda t: re.sub(r"(<key>CFBundleShortVersionString</key>\s*<string>)[^<]*(</string>)", r"\g<1>$(MARKETING_VERSION)\2",
                                                                         re.sub(r"(<key>CFBundleVersion</key>\s*<string>)[^<]*(</string>)", r"\g<1>$(CURRENT_PROJECT_VERSION)\2", t)))

    def readme(t):
        t = re.sub(r"Build \d+ \(\d+\), \d{4}-\d\d-\d\d\. Carpe Diem build \d+, the full edition\.",
                   "Build %s (%s), %s. Carpe Diem build %s, the full edition." % (ver, ver, DATE, PASS), t, count=1)
        t = once(t, "NEW IN THIS BUILD\n", IOS_NEW)
        t = t.replace("Build %s (%s), %s." % (ver, ver, DATE), "Build %s (%s), %s." % (ver + "01", ver + "01", DATE), 1)
        return t
    edit(os.path.join(app, "README.txt"), readme)
    print("written", repo)


if __name__ == "__main__":
    {"web": web, "ios": ios}[sys.argv[1]](sys.argv[2], sys.argv[3])
