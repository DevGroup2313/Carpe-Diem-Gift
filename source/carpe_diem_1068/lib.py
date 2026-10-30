"""Helpers shared by the Carpe Diem 1060 pass: exact replacements that must be found the number of times stated, the
page's blocks by id, the integrity seal of the core script, and the build record."""
import base64, gzip, hashlib, re


class Page:
    def __init__(self, text, label="page"):
        self.s = text
        self.label = label
        self.log = []

    def rep(self, old, new, count=1, where=None):
        """Replace old by new; old must occur exactly count times (in the whole page, or in the core script)."""
        if where == "core":
            a, b = self.core_span()
            seg = self.s[a:b]
            n = seg.count(old)
            if n != count:
                raise SystemExit("%s: core: expected %d, found %d: %r" % (self.label, count, n, old[:140]))
            self.s = self.s[:a] + seg.replace(old, new) + self.s[b:]
        else:
            n = self.s.count(old)
            if n != count:
                raise SystemExit("%s: expected %d, found %d: %r" % (self.label, count, n, old[:140]))
            self.s = self.s.replace(old, new)
        self.log.append(old[:60])

    def resub(self, pattern, new, count=1, flags=0, where=None):
        if where == "core":
            a, b = self.core_span()
            seg, n = re.subn(pattern, new, self.s[a:b], flags=flags)
            if n != count:
                raise SystemExit("%s: core: pattern expected %d, found %d: %r" % (self.label, count, n, pattern[:140]))
            self.s = self.s[:a] + seg + self.s[b:]
        else:
            s2, n = re.subn(pattern, new, self.s, flags=flags)
            if n != count:
                raise SystemExit("%s: pattern expected %d, found %d: %r" % (self.label, count, n, pattern[:140]))
            self.s = s2

    def alt(self, olds, new, where=None):
        """Replace whichever of several wordings is present (exactly one of them, once)."""
        found = [o for o in olds if (self.s[slice(*self.core_span())] if where == "core" else self.s).count(o) == 1]
        if len(found) != 1:
            raise SystemExit("%s: of %d wordings, %d found once: %r" % (self.label, len(olds), len(found), olds[0][:100]))
        self.rep(found[0], new, where=where)

    def has(self, text):
        return text in self.s

    def block(self, bid):
        """(start, end) of the whole element with this id, found exactly once."""
        ms = list(re.finditer(r'<(script|style)\b[^>]*\sid="%s"[^>]*>' % re.escape(bid), self.s))
        if len(ms) != 1:
            raise SystemExit("%s: block %s found %d times" % (self.label, bid, len(ms)))
        m = ms[0]
        end = self.s.find("</%s>" % m.group(1), m.end())
        return m.start(), end + len("</%s>" % m.group(1))

    def block_text(self, bid):
        a, b = self.block(bid)
        return self.s[a:b]

    def core_span(self):
        """The body of the app's main script (the one that holds DEFAULT_CANDIDATURE and is over 1 MB)."""
        i = self.s.find("const DEFAULT_CANDIDATURE")
        if i < 0:
            raise SystemExit("no core script")
        a = self.s.rfind("<script", 0, i)
        a = self.s.find(">", a) + 1
        b = self.s.find("</script>", i)
        if b - a < 1000000:
            raise SystemExit("core script too small")
        return a, b

    def before_body_end(self, html):
        k = self.s.rfind("</body>")
        if k < 0:
            raise SystemExit("no </body>")
        self.s = self.s[:k] + html + "\n" + self.s[k:]

    def edition(self):
        m = re.search(r'window\.CD_BUILD=\{[^}]*\}', self.s)
        if not m:
            raise SystemExit("no build record")
        e = re.search(r'edition:"([^"]*)"', m.group(0))
        return e.group(1) if e else ""

    def build(self):
        m = re.search(r'window\.CD_BUILD=\{date:"([^"]+)",pass:"(\d+)",stamp:"(\d+)"', self.s)
        return m.groups() if m else None

    def set_build(self, date, pas, stamp):
        old = re.search(r'window\.CD_BUILD=\{date:"[^"]+",pass:"\d+",stamp:"\d+"', self.s)
        if not old or self.s.count(old.group(0)) != 1:
            raise SystemExit("build record not found once")
        self.s = self.s.replace(old.group(0), 'window.CD_BUILD={date:"%s",pass:"%s",stamp:"%s"' % (date, pas, stamp))

    def reseal(self, when):
        """The integrity seal (pass 1059): SHA-256 of the core script with runs of white space made one space."""
        a, b = self.core_span()
        norm = re.sub(r"\s+", " ", self.s[a:b]).strip()
        # JS's \s also takes U+00A0, U+FEFF and the Unicode spaces; Python's re \s with str does the same for these
        h = hashlib.sha256(norm.encode("utf-8")).hexdigest()
        m = re.search(r'window\.CD_SEAL=\{core:"[0-9a-f]{64}",when:"[^"]*"\};', self.s)
        if not m or self.s.count(m.group(0)) != 1:
            raise SystemExit("seal stamp not found once")
        self.s = self.s.replace(m.group(0), 'window.CD_SEAL={core:"%s",when:"%s"};' % (h, when))
        return h
