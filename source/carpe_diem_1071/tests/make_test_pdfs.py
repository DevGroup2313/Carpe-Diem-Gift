"""A test article as typeset PDFs are: running head and page number, a title, headings, justified paragraphs with words
broken across lines by hyphens, italic phrases, superscript note numbers, notes at the page foot under a short rule,
one note that runs on to the next page; and a 'scan' (a page that is only a picture)."""
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.pdfbase.pdfmetrics import stringWidth
import random, textwrap
random.seed(7)
W, H = A4
L, R, TOP, BOT = 72, W - 72, H - 90, 70
BODY, NOTE = 11.5, 8.5
words = ("archive testimony parish register inheritance correspondence silence memory estate witness narrative county "
         "community interpretation evidence institution historiography marginalia provenance").split()

def para(n):
    return " ".join(random.choice(words) for _ in range(n)).capitalize() + "."

c = canvas.Canvas("article.pdf", pagesize=A4)
page = [1]
notes_here = []
note_no = [0]
y = [TOP]

def head():
    c.setFont("Times-Italic", 9); c.drawCentredString(W / 2, H - 50, "THE ARCHIVE AND ITS SILENCES")
    c.setFont("Times-Roman", 9); c.drawCentredString(W / 2, 50, str(page[0]))

def foot_and_turn(carry=None):
    # notes at the foot of the page, under a short rule
    fy = BOT - 4
    lines = []
    for n, t in notes_here:
        for k, ln in enumerate(textwrap.wrap(t, 95)):
            lines.append((n if k == 0 else None, ln))
    need = len(lines) * (NOTE + 2.5)
    top = 66 + need
    c.line(L, top + 10, L + 120, top + 10)
    yy = top
    over = []
    for i, (n, ln) in enumerate(lines):
        if n is not None:
            c.setFont("Times-Roman", 6); c.drawString(L, yy + 3, str(n)); c.setFont("Times-Roman", NOTE); c.drawString(L + 7, yy, ln)
        else:
            c.setFont("Times-Roman", NOTE); c.drawString(L + 7, yy, ln)
        yy -= NOTE + 2.5
    head(); c.showPage(); page[0] += 1; y[0] = TOP; notes_here.clear()
    return over

def line_out(parts, last, indent):
    # parts: list of (text, font); justify unless last
    x = L + (18 if indent else 0)
    width = R - x
    total = sum(stringWidth(t, "Times-Roman", 7) if f == "sup" else stringWidth(t, f, BODY) for t, f in parts)
    gaps = sum(t.count(" ") for t, f in parts if f != "sup")
    extra = 0 if last or gaps == 0 else (width - total) / gaps
    for t, f in parts:
        if f == "sup":
            c.setFont("Times-Roman", 7); c.drawString(x, y[0] + 4, t); x += stringWidth(t, "Times-Roman", 7); continue
        c.setFont(f, BODY)
        for k, w in enumerate(t.split(" ")):
            if k: x += stringWidth(" ", f, BODY) + extra
            if w: c.drawString(x, y[0], w); x += stringWidth(w, f, BODY)
    y[0] -= BODY * 1.45

def note_height():
    return sum(len(textwrap.wrap(t, 95)) for n, t in notes_here) * (NOTE + 2.5) + (18 if notes_here else 0)

def paragraph(text, note=None, italic=None, indent=True):
    toks = text.split(" ")
    if italic:
        k = random.randint(3, len(toks) - 6); toks[k] = "\x01" + toks[k]; toks[k + 2] = toks[k + 2] + "\x02"
    my_note = None
    if note:
        note_no[0] += 1; toks[-1] = toks[-1] + "\x03%d" % note_no[0]; my_note = (note_no[0], note)
    plain = lambda ws: " ".join(ws).replace("\x01", "").replace("\x02", "").split("\x03")[0]
    lines, cur = [], []
    width = R - L - (18 if indent else 0)
    for t in toks:
        if stringWidth(plain(cur + [t]), "Times-Roman", BODY) > width and cur:
            if len(t) > 9 and random.random() < 0.5:
                cut = len(t) // 2
                if stringWidth(plain(cur + [t[:cut] + "-"]), "Times-Roman", BODY) <= width:
                    lines.append(cur + [t[:cut] + "-"]); cur = [t[cut:]]; width = R - L; continue
            lines.append(cur); cur = [t]; width = R - L
        else:
            cur.append(t)
    lines.append(cur)
    ital = [False]
    for i, ln in enumerate(lines):
        has_note = any("\x03" in w for w in ln)
        extra = (len(textwrap.wrap(my_note[1], 95)) * (NOTE + 2.5) + (18 if not notes_here else 0)) if has_note else 0
        if y[0] - BODY < BOT + note_height() + extra:
            foot_and_turn()
        if has_note: notes_here.append(my_note)
        runs = []
        for k, w in enumerate(ln):
            sup = None
            if "\x03" in w: w, sup = w.split("\x03")
            if w.startswith("\x01"): ital[0] = True; w = w[1:]
            end_ = w.endswith("\x02")
            if end_: w = w[:-1]
            f = "Times-Italic" if ital[0] else "Times-Roman"
            piece = (" " if k else "") + w
            if runs and runs[-1][1] == f: runs[-1] = (runs[-1][0] + piece, f)
            else: runs.append((piece, f))
            if sup: runs.append((sup, "sup"))
            if end_: ital[0] = False
        line_out(runs, i == len(lines) - 1, indent and i == 0)
    y[0] -= 2

def heading(t, size):
    if y[0] < BOT + 80 + note_height(): foot_and_turn()
    y[0] -= 8; c.setFont("Times-Bold", size); c.drawString(L, y[0], t); y[0] -= size * 1.6

c.setFont("Times-Bold", 20); c.drawCentredString(W / 2, TOP, "The Archive and its Silences"); y[0] -= 34
c.setFont("Times-Italic", 12); c.drawCentredString(W / 2, y[0], "A chapter in draft"); y[0] -= 30
heading("1. Introduction", 14)
for k in range(5):
    paragraph(para(random.randint(60, 110)), note="Jane Smith, The Archive (Oxford: Clarendon Press, 2019), %d." % (40 + k) if k % 2 == 0 else None, italic=(k == 1), indent=k > 0)
heading("2. The Parish Registers", 14)
for k in range(9):
    long_note = ("Mary Jones, Registers of the Poor: Parish Record-Keeping in Rural England, 1780-1850 (Cambridge: Cambridge "
                 "University Press, 2015), 112-19; see also the discussion of marginal annotations in the same volume, 140-48, "
                 "and the critical remarks in Thomas Reed, 'Counting the Uncounted', Past and Present 201 (2008): 77-102.")
    paragraph(para(random.randint(70, 120)), note=(long_note if k % 3 == 0 else ("Ibid., %d." % (60 + k) if k % 3 == 1 else None)), italic=(k % 4 == 2))
heading("3. Conclusion", 14)
paragraph(para(90), note="On silences in the record see Smith, The Archive, 201.")
foot_and_turn()
c.save()

# a 'scan': a page that is only a picture
from reportlab.lib.utils import ImageReader
from PIL import Image, ImageDraw
im = Image.new("L", (1240, 1754), 255); d = ImageDraw.Draw(im)
for i in range(40): d.line((120, 160 + i * 36, 1120, 160 + i * 36), fill=90, width=8)
im.save("scan.png")
c2 = canvas.Canvas("scan.pdf", pagesize=A4); c2.drawImage(ImageReader("scan.png"), 0, 0, W, H); c2.showPage(); c2.save()
print("pages", page[0] - 1, "notes", note_no[0])
