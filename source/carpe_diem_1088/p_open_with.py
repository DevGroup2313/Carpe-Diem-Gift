# -*- coding: utf-8 -*-
"""1088 · Tabula offered under Open With on every device, for the files it reads.

The owner: "I want for Tabula inside of Carpe Diem to be offered as a choice to open Word Documents, PDFs and etc. I want
full parity please."

Until now the Mac (1072, 1073) and Windows (1072) apps offered Tabula for Word and PDF files. This pass, with
`open_with_edits.py` (the Mac, Windows and Fire tablet projects) and `ios_open_with.py` (the iPhone and iPad project):

* the page takes a file from whichever app it runs in, through one door: the Mac and Windows apps' bridge, the Fire
  tablet's (window.CarpeNative.takeFile and filePart) and the iPhone and iPad app's (window.pywebview.api.take_file,
  answered by ShellFiles); the web edition, installed, takes files the system gives it (launchQueue);
* besides Word and PDF, Tabula now opens plain text, web pages and Markdown handed to it, through its own File, Open
  (Markdown's headings, lists, bold, italics and code become Tabula's own); a kind it cannot read is refused in words;
* the web edition's manifest names the same kinds (file_handlers), and the iPhone and iPad kit inside the page carries
  the same project as the repository.

Not offered, because Tabula cannot read them yet: an old binary Word file (.doc), RTF, OpenDocument text."""
import base64, gzip, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import ios_open_with

REPORT_OLD = "  function report(name, how) {\n    try { var a = window.pywebview && window.pywebview.api; if (a && a.file_opened) a.file_opened(String(name), String(how)); } catch (e) {}\n  }\n"
REPORT_NEW = r"""  // build 1088: one door for every app the page runs in: the Mac and Windows apps (pywebview), the iPhone and iPad app
  // (which gives the same names, or window.CarpeFiles in the kit's own project), and the Fire tablet's bridge
  // (window.CarpeNative), whose answers are words
  function hostApi() {
    try { var a = window.pywebview && window.pywebview.api; if (a && typeof a.take_file === 'function') return a; } catch (e) {}
    try { var c = window.CarpeFiles; if (c && typeof c.take_file === 'function') return c; } catch (e) {}
    try {
      var n = window.CarpeNative;
      if (n && typeof n.takeFile === 'function' && typeof n.filePart === 'function') return {
        take_file: function (w) { var s = n.takeFile(String(w)); return s ? JSON.parse(s) : null; },
        file_part: function (k, i) { return n.filePart(String(k), i | 0); },
        file_opened: function (name, how) { try { if (n.fileOpened) n.fileOpened(String(name), String(how)); } catch (e) {} return true; }
      };
    } catch (e) {}
    return null;
  }
  function report(name, how) {
    try { var a = hostApi(); if (a && a.file_opened) a.file_opened(String(name), String(how)); } catch (e) {}
  }
"""
ASK_OLD = "    var a = null;\n    try { a = window.pywebview && window.pywebview.api; } catch (e) {}\n    if (busy || !a || typeof a.take_file !== 'function'"
ASK_NEW = "    var a = hostApi();\n    if (busy || !a || typeof a.take_file !== 'function'"

OPEN_HEAD_OLD = """  function openOne(name, b64) {
    return new Promise(function (done) {
      function say(how) { report(name, how); done(); }
      var pdf = /\\.pdf$/i.test(name), bin = atob(b64), u = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      var f = new File([u], name, { type: pdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });"""
OPEN_HEAD_NEW = r"""  // build 1088: the kinds Tabula reads; Markdown is read as Tabula's own headings, lists and emphasis
  function kindOf(name) {
    if (/\.pdf$/i.test(name)) return 'pdf';
    if (/\.docx$/i.test(name)) return 'docx';
    if (/\.(md|markdown)$/i.test(name)) return 'md';
    if (/\.(html?|xhtml)$/i.test(name)) return 'html';
    if (/\.(txt|text)$/i.test(name)) return 'txt';
    return '';
  }
  function mdToHtml(md) {
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function inline(s) {
      return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/__([^_]+)__/g, '<b>$1</b>')
        .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>').replace(/(^|[^_\w])_([^_\s][^_]*)_/g, '$1<i>$2</i>');
    }
    var out = [], list = null, para = [];
    function flush() { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } }
    function close() { if (list) { out.push('</' + list + '>'); list = null; } }
    String(md || '').replace(/\r\n?/g, '\n').split('\n').forEach(function (line) {
      var h = /^(#{1,6})\s+(.*)$/.exec(line), ul = /^\s*[-*+]\s+(.*)$/.exec(line), ol = /^\s*\d+[.)]\s+(.*)$/.exec(line), q = /^>\s?(.*)$/.exec(line);
      if (h) { flush(); close(); var lv = Math.min(5, h[1].length + 1); out.push('<h' + lv + '>' + inline(h[2].replace(/\s+#+\s*$/, '')) + '</h' + lv + '>'); return; }
      if (ul || ol) { flush(); var want = ul ? 'ul' : 'ol'; if (list !== want) { close(); out.push('<' + want + '>'); list = want; } out.push('<li>' + inline((ul || ol)[1]) + '</li>'); return; }
      if (q) { flush(); close(); out.push('<blockquote><p>' + inline(q[1]) + '</p></blockquote>'); return; }
      if (!line.trim()) { flush(); close(); return; }
      close(); para.push(line.trim());
    });
    flush(); close();
    return '<html><body>' + out.join('') + '</body></html>';
  }
  function openOne(name, b64) {
    return new Promise(function (done) {
      function say(how) { report(name, how); done(); }
      var kind = kindOf(name), pdf = kind === 'pdf', bin = atob(b64), u = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      if (!kind) {
        say('not opened: Tabula does not read this kind of file');
        try { alert(fr() ? 'Tabula ne lit pas encore ce genre de fichier : ' + name + '. Il lit les documents Word (.docx), les PDF, le texte, les pages web et le Markdown.' : 'Tabula does not read this kind of file yet: ' + name + '. It reads Word documents (.docx), PDFs, plain text, web pages and Markdown.'); } catch (e) {}
        return;
      }
      var f = new File([u], name, { type: pdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });"""
OPEN_BODY_OLD = """        var p;
        if (pdf) p = w.cdOpenPdf(f);
        else {
          var ed = w.document.getElementById('editor'), has = ((ed && ed.innerText) || '').trim().length > 0;
          if (has && !w.confirm(fr() ? 'Ouvrir ' + name + ' ? Il remplacera ce qui est \\u00e9crit ici.' : 'Open ' + name + '? It takes the place of what is written here now.')) { say('not opened: the page was kept'); return; }
          p = w.cdOpenDocx(f);
        }"""
OPEN_BODY_NEW = """        var p;
        if (pdf) p = w.cdOpenPdf(f);
        else {
          var ed = w.document.getElementById('editor'), has = ((ed && ed.innerText) || '').trim().length > 0;
          if (has && !w.confirm(fr() ? 'Ouvrir ' + name + ' ? Il remplacera ce qui est \\u00e9crit ici.' : 'Open ' + name + '? It takes the place of what is written here now.')) { say('not opened: the page was kept'); return; }
          if (kind === 'docx') p = w.cdOpenDocx(f);
          else {
            /* build 1088: text, a web page or Markdown, through Tabula's own File, Open */
            var inp = w.document.getElementById('openFile');
            if (!inp || typeof w.DataTransfer !== 'function') { say('not opened: Tabula cannot take it here'); return; }
            var text = new TextDecoder().decode(u), file2;
            if (kind === 'md') file2 = new w.File([mdToHtml(text)], name.replace(/\\.(md|markdown)$/i, '.html'), { type: 'text/html' });
            else file2 = new w.File([text], name, { type: kind === 'html' ? 'text/html' : 'text/plain' });
            var dt = new w.DataTransfer(); dt.items.add(file2);
            try { inp.files = dt.files; } catch (e) { say('not opened: Tabula cannot take it here'); return; }
            inp.dispatchEvent(new w.Event('change', { bubbles: true }));
            p = Promise.resolve(true);
          }
        }"""
TAIL_OLD = "  window.cdHostAsk = ask;\n})();"
TAIL_NEW = """  window.cdHostAsk = ask;
  // build 1088: the web edition, installed, is given files by the system (Open With); each goes to Tabula the same way
  window.cdHostOpenFile = openOne;
  try {
    if (window.launchQueue && typeof window.launchQueue.setConsumer === 'function') {
      window.launchQueue.setConsumer(function (params) {
        var hs = (params && params.files) || [];
        hs.reduce(function (p, h) {
          return p.then(function () {
            return h.getFile().then(function (file) { return file.arrayBuffer().then(function (ab) {
              var u8 = new Uint8Array(ab), s = '', CH = 0x8000;
              for (var i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
              return openOne(file.name, btoa(s));
            }); });
          });
        }, Promise.resolve());
      });
    }
  } catch (e) {}
})();"""

HANDLERS = [{"action": "./index.html", "accept": {
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "application/pdf": [".pdf"],
    "text/plain": [".txt", ".text"],
    "text/html": [".html", ".htm"],
    "text/markdown": [".md", ".markdown"]}}]


def builders(p):
    """The kits inside the page: the web edition's manifest names the kinds, and the iPhone and iPad kit's project is
    the repository's, with Open in Carpe Diem."""
    bm = re.search(r'(<script[^>]*id="cd-builders-data"[^>]*>)(.*?)(</script>)', p.s, re.S)
    if not bm:
        raise SystemExit("the owner's edition has no builders")
    D = json.loads(bm.group(2).replace("<\\/", "</"))
    T = json.loads(gzip.decompress(base64.b64decode(D["texts"])).decode("utf-8"))
    import hashlib
    done = {"manifest": 0, "Info.plist": 0, "CarpeDiemApp.swift": 0, "DeskView.swift": 0}
    edits = {"Info.plist": ios_open_with.edit_info, "CarpeDiemApp.swift": ios_open_with.edit_kit_app, "DeskView.swift": ios_open_with.edit_kit_desk}
    for K in D["kinds"].values():
        for f in K["files"]:
            if not (isinstance(f[1], str) and f[1].startswith("t:")):
                continue
            name, t = f[0], T[f[1][2:]]
            new = None
            if name.endswith("/manifest.webmanifest"):
                m = json.loads(t)
                if "file_handlers" in m:
                    raise SystemExit("the web manifest has file handlers already")
                m["file_handlers"] = HANDLERS
                new = json.dumps(m, ensure_ascii=False, indent=2) + "\n"
                done["manifest"] += 1
            else:
                for leaf, fn in edits.items():
                    if name.endswith("iPhone and iPad project/CarpeDiem/" + leaf):
                        new = fn(t); done[leaf] += 1
            if new is not None:
                h = hashlib.sha256(new.encode("utf-8")).hexdigest()[:16]
                T[h] = new
                f[1] = "t:" + h
    if not all(done.values()):
        raise SystemExit("builders: not every kit file was found: %s" % done)
    used = set(f[1][2:] for K in D["kinds"].values() for f in K["files"] if isinstance(f[1], str) and f[1].startswith("t:"))
    T = {k: v for k, v in T.items() if k in used}
    D["texts"] = base64.b64encode(gzip.compress(json.dumps(T, ensure_ascii=False, separators=(",", ":")).encode("utf-8"), mtime=0)).decode("ascii")
    body = json.dumps(D, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    p.s = p.s[:bm.start(2)] + body + p.s[bm.end(2):]
    print("    builders: the web manifest names the kinds Tabula reads (%d); the iPhone and iPad kit opens them (%s)"
          % (done["manifest"], ", ".join("%s %d" % (k, v) for k, v in done.items() if k != "manifest")))


def apply(p, full):
    i = p.s.find('<script id="cd-1072-host-open">')
    e = p.s.find('</script>', i)
    if i < 0 or e < 0 or p.s.count('<script id="cd-1072-host-open">') != 1:
        raise SystemExit("the page's host door (1072) is not as this pass expects")
    blk = p.s[i:e]
    for old, new, what in ((REPORT_OLD, REPORT_NEW, "the report"), (ASK_OLD, ASK_NEW, "the asking"),
                           (OPEN_HEAD_OLD, OPEN_HEAD_NEW, "the opening"), (OPEN_BODY_OLD, OPEN_BODY_NEW, "Tabula's readers"),
                           (TAIL_OLD, TAIL_NEW, "the web edition's files")):
        if blk.count(old) != 1:
            raise SystemExit("host door: %s is not as expected (%d)" % (what, blk.count(old)))
        blk = blk.replace(old, new)
    p.s = p.s[:i] + blk + p.s[e:]
    print("    the page takes a file from every app it runs in, and Tabula opens Word, PDF, text, web pages and Markdown")
    if full:
        builders(p)
