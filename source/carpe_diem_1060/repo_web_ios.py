"""Writes Carpe Diem 1060 into the website repositories (the public sample and the committee demonstration) and the
full edition into the iPhone and iPad repository, as the owner asked ("I want the full version of the Carpe Diem for my
iphone and ipad, not the demo version").
usage: repo_web_ios.py web REPO PAGE.html
       repo_web_ios.py ios REPO FULL_PAGE.html"""
import os, re, shutil, sys
import repo_gift

DATE, PASS, STAMP, WHEN = repo_gift.DATE, repo_gift.PASS, repo_gift.STAMP, repo_gift.WHEN

WEB_NEW = ("**New in build 1060.** The demonstrations carry no proposal date of their own, and their sample milestones are "
           "counted again from each visit, so none of them is ever behind it; a date the visitor chooses is kept. \"Rename "
           "your writing\" opens the writing's own details (its working title, an optional date with a key to clear it, and "
           "its sections' names); the curriculum's names have their own panel.\n\n"
           "The side buttons inside a floating window are drawn as the main window's are, without the stacked dark shadows; "
           "they keep their lift, the bell's ring and the hourglass's turn, and the 💭 there shows the number of thoughts in "
           "one flat colour, as the bell's. Timed reminders come in Carpe Diem's own blue card. On Windows 10 the side buttons "
           "show Microsoft's flat emoji drawings, as on Windows 11. While the page starts, a loading page says it is still "
           "being painted and how far it has got; Refresh (↻ beside Display, F5, or Ctrl+Shift+R) saves the work of every "
           "open room and starts again. The About panel is shorter.\n\n")


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
        m = re.search(r'\*\*Build 1059, 25 October 2026\.\*\* The About panel ends with "1059 · 528171059 · ([^"]+)"\.', t)
        if not m:
            raise SystemExit("README: the build line was not where expected")
        t = t.replace(m.group(0), '**Build %s, %s.** The About panel ends with "%s · %s · %s".' % (PASS, WHEN, PASS, STAMP, m.group(1)), 1)
        t = once(t, "**New in build 1059.**", WEB_NEW + "**Earlier, in build 1059.**")
        return t
    edit(os.path.join(repo, "README.md"), readme)
    print("written", repo)


IOS_NEW = """NEW IN THIS BUILD
  This is the full edition of Carpe Diem, the owner's own, as on the Mac,
  Windows and the Fire tablet: no longer the committee demonstration. Its
  work is kept on the iPhone or iPad, under the same app; export a backup
  from the demonstration first if it holds anything you want to keep.

  The proposal no longer carries a date of its own: choose one if and when
  it suits you, in Candidatus, Proposal, "Rename the proposal", which now
  opens the proposal's own details (its working title, its date with a key
  to clear it, and its sections' names). The side buttons inside a floating
  window are drawn as the main window's are, without the dark shadows, and
  the 💭 there shows its number in one flat colour. Timed reminders come in
  Carpe Diem's own blue card. While the page starts, a loading page says it
  is still being painted; Refresh (↻ beside Display) saves the work of every
  open room and starts again. The About panel is shorter. The workflow that
  builds the app runs on Node.js 24.

EARLIER, IN THE BUILD OF 25 OCTOBER 2026
"""


def ios(repo, page):
    s = open(page, encoding="utf-8").read()
    if 'pass:"%s"' % PASS not in s or re.search(r'window\.CD_BUILD=\{[^}]*edition:', s):
        raise SystemExit("%s is not the full edition of build %s" % (page, PASS))
    app = os.path.join(repo, "iphone-ipad")
    shutil.copyfile(page, os.path.join(app, "CarpeDiem", "www", "carpe_diem.html"))
    ver = DATE.replace("-", "")
    edit(os.path.join(app, "BUILD_INFO.txt"), lambda t: re.sub(r"Build: \d{4}-\d\d-\d\d\nPass: \d+\nStamp: \d+", "Build: %s\nPass: %s\nStamp: %s\nCarpe Diem: build %s, the full edition" % (DATE, ver, ver, PASS), t))
    edit(os.path.join(app, "CarpeDiem.xcodeproj", "project.pbxproj"), lambda t: re.sub(r"(CURRENT_PROJECT_VERSION|MARKETING_VERSION) = \d+;", r"\g<1> = %s;" % ver, t))
    # the app's own version follows the project's (it was written in by hand, and had fallen behind it)
    edit(os.path.join(app, "CarpeDiem", "Info.plist"), lambda t: re.sub(r"(<key>CFBundleShortVersionString</key>\s*<string>)[^<]*(</string>)", r"\g<1>$(MARKETING_VERSION)\2",
                                                                         re.sub(r"(<key>CFBundleVersion</key>\s*<string>)[^<]*(</string>)", r"\g<1>$(CURRENT_PROJECT_VERSION)\2", t)))

    def readme(t):
        t = re.sub(r"Build \d+ \(\d+\), \d{4}-\d\d-\d\d\. Carpe Diem build \d+, the committee demo\.",
                   "Build %s (%s), %s. Carpe Diem build %s, the full edition." % (ver, ver, DATE, PASS), t, count=1)
        t = once(t, "NEW IN THIS BUILD\n", IOS_NEW)
        return t
    edit(os.path.join(app, "README.txt"), readme)
    print("written", repo)


if __name__ == "__main__":
    {"web": web, "ios": ios}[sys.argv[1]](sys.argv[2], sys.argv[3])
