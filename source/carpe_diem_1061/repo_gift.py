"""Writes build 1060's record into the owner's private repository (Carpe-Diem-Gift) before the page is built, so the
install kits the page carries (synced from these files by p_builders.py) say the same: BUILD_INFO, the Windows
installer's version, the Fire tablet's version name, the READMEs' "New in build 1060", the third-party notices (the
flat emoji drawings), and the workflows on actions that run on Node.js 24.
usage: repo_gift.py GIFT_REPO"""
import os, re, sys

DATE, PASS, STAMP = "2026-10-29", "1061", "528171061"
PREV, PREV_WHEN = "1060", "29 October 2026"
WHEN = "29 October 2026"

NEW_EN = """Carpe Diem and a room can now share the screen. The ↗ key of a floating window
(Tabula, Abacus, Imago, Scriba or Fontes) offers, second, "Side by side with Carpe
Diem": the room fills the right of the window and Carpe Diem the left, divided by a
line you can drag (or move with the arrow keys); the width is remembered, and the
same place then offers "Float again". It works on every device, the Fire tablet and
the iPad included. On a Mac, the first choice, the room's own window, now joins Carpe
Diem's window as a tab ("Carpe Diem | Tabula" across the top), as it did when Carpe
Diem filled the screen. The copy of a room as a page in the browser (which opened
Safari) is no longer offered there. The small notes at the foot of the screen take
the reminders' pastel card too."""

FLUENT = """
4. Fluent Emoji (MIT licence), https://github.com/microsoft/fluentui-emoji
   On Windows 10 only, the side buttons show Microsoft's flat Fluent drawings
   of their emoji, so they look as they do on Windows 11.

   MIT License

   Copyright (c) Microsoft Corporation.

   Permission is hereby granted, free of charge, to any person obtaining a
   copy of this software and associated documentation files (the
   "Software"), to deal in the Software without restriction, including
   without limitation the rights to use, copy, modify, merge, publish,
   distribute, sublicense, and/or sell copies of the Software, and to permit
   persons to whom the Software is furnished to do so, subject to the
   following conditions:

   The above copyright notice and this permission notice shall be included
   in all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
   OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
   NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
   DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
   OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
   USE OR OTHER DEALINGS IN THE SOFTWARE.
"""

NODE24 = [(r"actions/checkout@v4\b", "actions/checkout@v5"), (r"actions/upload-artifact@v4\b", "actions/upload-artifact@v6"),
          (r"actions/download-artifact@v4\b", "actions/download-artifact@v7"), (r"actions/setup-python@v5\b", "actions/setup-python@v6"),
          (r"gradle/actions/setup-gradle@v4\b", "gradle/actions/setup-gradle@v5"), (r"actions/setup-java@v4\b", "actions/setup-java@v5"),
          (r"actions/cache@v4\b", "actions/cache@v5")]


def node24(t):
    for a, b in NODE24:
        t = re.sub(a, b, t)
    return t


def rw(path, fn):
    raw = open(path, "rb").read()
    crlf = b"\r\n" in raw
    t = raw.decode("utf-8").replace("\r\n", "\n")
    t2 = fn(t)
    if crlf:
        t2 = t2.replace("\n", "\r\n")
    open(path, "wb").write(t2.encode("utf-8"))
    return t2 != t


def once(t, a, b):
    if t.count(a) != 1:
        raise SystemExit("not found once: %r" % a[:90])
    return t.replace(a, b)


def main(repo):
    j = lambda *p: os.path.join(repo, *p)
    for proj in ("Mac project", "Windows project", "Fire tablet project"):
        rw(j(proj, "BUILD_INFO.txt"), lambda t: re.sub(r"Build: \d{4}-\d\d-\d\d\nPass: \d{4}\nStamp: \d+", "Build: %s\nPass: %s\nStamp: %s" % (DATE, PASS, STAMP), t))
        rw(j(proj, "THIRD_PARTY_NOTICES.txt"), lambda t: t if "Fluent Emoji" in t else once(t, "\nThe licences named above can be read in full", FLUENT + "\nThe licences named above can be read in full"))
    rw(j("Windows project", "build", "carpe_diem.iss"), lambda t: re.sub(r'#define AppVersion "\d{4}"', '#define AppVersion "%s"' % PASS, t))
    rw(j("Fire tablet project", "app", "build.gradle"), lambda t: re.sub(r"versionName '\d{4}'", "versionName '%s'" % PASS, t))
    for w in os.listdir(j(".github", "workflows")):
        rw(j(".github", "workflows", w), node24)
    for proj in ("Mac project", "Windows project", "Fire tablet project"):
        for f in os.listdir(j(proj)):
            if f == "GITHUB_WORKFLOW_paste_this.txt":
                rw(j(proj, f), node24)

    def md(t, heading):
        t = re.sub(r'\*\*Build 1060, 29 October 2026\.\*\* The About panel in the app ends with\n"Build 1060 · 528171060"\.( Finder\'s Get Info on the app shows\nversion 1060\.)?',
                   lambda m: '**Build 1061, %s.** The About panel in the app ends with\n"Build 1061 · 528171061".%s' % (WHEN, " Finder's Get Info on the app shows\nversion 1061." if m.group(1) else ""), t, count=1)
        t = once(t, "## New in build 1060\n", "## New in build 1061\n\n" + NEW_EN + "\n\n## Earlier, in build 1060\n")
        return t
    rw(j("Mac project", "README.md"), lambda t: md(t, "mac"))
    rw(j("Windows project", "README.md"), lambda t: md(t, "win"))

    def fire(t):
        t = once(t, "Build 1060, 29 October 2026. The About panel inside the app ends with\n\"Build 1060 · 528171060\".\nThe app's own version is 1060 too;",
                 "Build 1061, %s. The About panel inside the app ends with\n\"Build 1061 · 528171061\".\nThe app's own version is 1061 too;" % WHEN)
        body = "\n".join(("  " + x) if x else "" for x in NEW_EN.split("\n"))
        t = once(t, "NEW IN BUILD 1060\n", "NEW IN BUILD 1061\n" + body + "\n\n\nEARLIER, IN BUILD 1060\n")
        return t
    rw(j("Fire tablet project", "README_BUILD.txt"), fire)
    print("Gift repository: build %s written" % PASS)


if __name__ == "__main__":
    main(sys.argv[1])
