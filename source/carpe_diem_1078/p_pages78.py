"""1078 · Assessments and Ascensus in the design the owner approved, and Ascensus's courses numbered I to XIII.

The owner's words (31 October 2026): "I also want you to redesign the Curriculum, Assessment and the Ascensus page
please" (the Curriculum's redesign was declined: it stays as it was); "I approve of all of the redesigns, please push
them everywhere"; "I don't like the long raised line look of the "Take a quiz", "Sit a seminar", and "Open the records"
buttons from the Assessments page, please limit the buttons to where the text is"; "I want the two Course V renumbered."

`pages78.css`, `assess78.js` and `asc78.js` draw the two pages; each falls back to the app's own drawing should anything
fail. The courses: Dissertatio, added after the others, kept Course V, and The Press was Course V too; now The Press is
Course VI and each course after it moves one on (Viva VII ... Formae XIII), with every mention of a course's number in
the Examen's advice and the lessons, in English and in French, moved with it. Dissertatio's French tag says Cours V. The
owner's edition says thirteen courses where it said twelve (in French, where the first course is not offered, twelve)."""
import os, re

HERE = os.path.dirname(os.path.abspath(__file__))
UP = {"VI": "VII", "VII": "VIII", "VIII": "IX", "IX": "X", "X": "XI", "XI": "XII", "XII": "XIII"}


def read(n):
    t = open(os.path.join(HERE, n), encoding="utf-8").read()
    if "</script" in t or "</style" in t:
        raise SystemExit("pages78: a closing tag inside " + n)
    return t


def renumber(p, full):
    s = p.s
    if '"tag":"Course XIII"' in s or 'tag: "Course XIII"' in s:
        raise SystemExit("pages78: the courses are already renumbered")
    # every course from VI on, and every mention of its number, one on: a single pass, so nothing moves twice
    counts = {"Course": 0, "Cours": 0}

    def up(m):
        counts[m.group(1)] += 1
        return m.group(1) + " " + UP[m.group(2)]
    s = re.sub(r"\b(Course|Cours) (XII|XI|X|IX|VIII|VII|VI)\b(?!-)", up, s)
    # then The Press, the second Course V, by its own entry (English, then French): after the pass, so it moves once
    s, n1 = re.subn(r'("id":"c5","icon":"[^"]*","name":"The Press[^"]*","tag":")Course V(")', r"\1Course VI\2", s)
    s, n2 = re.subn(r'(c5: \{ name: "La presse[^"]*", tag: ")Cours V(")', r"\1Cours VI\2", s)
    # Dissertatio's French tag (its English one, Course V, stays)
    s, n3 = re.subn(r'(\n\s*)(c5: \{ name: "La presse)', r'\1"c-diss": { tag: "Cours V" },\1\2', s, count=1)
    n4 = 0
    if full:
        s, a = re.subn(r"and twelve courses running from academic prose to the viva", "and thirteen courses running from academic prose to the viva", s)
        s, b = re.subn(r'def: "One of twelve short courses, from academic prose to the viva\.', 'def: "One of thirteen short courses, from academic prose to the viva.', s)
        n4 = a + b
        if counts["Course"] != 41 or counts["Cours"] != 25 or n1 != 1 or n2 != 1 or n3 != 1 or n4 != 2:
            raise SystemExit("pages78: the renumbering did not find what was counted: %r %r" % (counts, (n1, n2, n3, n4)))
        if len(re.findall(r'"tag":\s*"Course V"', s)) != 1:
            raise SystemExit("pages78: Course V is still given twice")
    p.s = s
    print("    Ascensus: courses numbered I to XIII (%d English and %d French mentions moved; The Press %d+%d; Dissertatio's French tag %d; thirteen %d)" % (counts["Course"], counts["Cours"], n1, n2, n3, n4))


def apply(p, full):
    if 'id="cd-pages-1078' in p.s:
        raise SystemExit("pages78: already applied")
    for f in ("function renderAssessments(", "function renderAssessHome(", "function renderGradesView(", "function renderAssessModule(", "function ascHome(", "function ascHeaderCard(", "function renderAscent("):
        if p.s.count(f) != 1:
            raise SystemExit("pages78: %s found %d times" % (f, p.s.count(f)))
    renumber(p, full)
    p.before_body_end('<style id="cd-pages-1078-css">\n' + read("pages78.css") + '\n</style>\n<script id="cd-pages-1078">\n' + read("assess78.js") + "\n" + read("asc78.js") + "\n</script>")
    print("    Assessments and Ascensus in the approved design")
