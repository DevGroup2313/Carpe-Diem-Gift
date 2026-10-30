"""1072 · Word and PDF files open in Tabula from the Mac's Finder and Windows' Explorer.

The owner asked that Tabula be an opener for Word and PDF files. The Mac and Windows apps now offer themselves for .docx
and .pdf (Open With; neither takes over as the default, which stays the owner's choice), and hand a file they are asked
to open to the page in pieces. This pass is the page's side:

* The page asks its app every 1.2 s for a file waiting to open (take_file, then file_part for each 1 MB piece), so the
  app never has to call into a page that may not be ready; the file opens in Tabula (the door gives way to it): a PDF through Tabula's PDF reader (1071), a Word document through the full Word reader (1069), asking first only
  when the page already holds writing. The outcome goes back to the app's record (file_opened), which GitHub's builds
  read to know that a real file opened.
* A Word or PDF file dropped on the desk took the same older route as before 1069 for Word, and a PDF was turned away
  ("Carpe Diem opens Word (.docx), Excel ...") though Tabula now reads PDFs. Both now go to the readers File, Open uses."""
import base64, os, re

HERE = os.path.dirname(os.path.abspath(__file__))


def apply(p, full):
    p.rep("if(/^(docx|doc|html|htm|txt)$/.test(ext)) return 'tabula';",
          "if(/^(docx|doc|html|htm|txt|pdf)$/.test(ext)) return 'tabula';")
    p.rep("alert('Carpe Diem opens Word (.docx), Excel (.xlsx, .csv) and PowerPoint (.pptx) files, and plain text or HTML.');",
          "alert('Carpe Diem opens Word (.docx), PDF, Excel (.xlsx, .csv) and PowerPoint (.pptx) files, and plain text or HTML.');")

    # a file dropped on the desk went to the first room that could take it, even one closed and hidden, where no one
    # saw it arrive; now to one in sight (the room opened for it, when none is)
    p.rep("var ok=(app==='tabula'&&dd.getElementById('editor'))||(app==='abacus'&&dd.getElementById('grid'))||(app==='slides'&&dd.getElementById('objbar')); if(ok) return w;",
          "var ok=(app==='tabula'&&dd.getElementById('editor'))||(app==='abacus'&&dd.getElementById('grid'))||(app==='slides'&&dd.getElementById('objbar')); if(ok&&fr[i].getBoundingClientRect().width>0) return w;")

    m = re.search(r'var TABULA_SRC = "([A-Za-z0-9+/=]+)"', p.s)
    if not m or p.s.count('var TABULA_SRC = "') != 1:
        raise SystemExit("Tabula's source was not found once")
    src = base64.b64decode(m.group(1)).decode("utf-8")
    old = "window.__cdOpenFile=function(f){"
    if src.count(old) != 1:
        raise SystemExit("Tabula: __cdOpenFile was not found once")
    # a Word document handed to Tabula (dropped on the desk) goes to the full reader, as File, Open's does
    src = src.replace(old, old + (
        "if(/\\.docx$/i.test(f.name)&&window.cdOpenDocx){var __e=document.getElementById('editor'),"
        "__h=((__e&&__e.innerText)||'').trim().length>0;"
        "if(__h&&!confirm('Open '+f.name+'? It takes the place of what is written here now.'))return;"
        "window.cdOpenDocx(f).catch(function(err){alert('That document could not be read: '+((err&&err.message)||err));});return;}"))
    # the PDF reader's fingerprint (1071) is checked by the engine's own SHA-256 where a page may use it, and by the
    # page's own where it may not (WebKit can keep crypto.subtle from a page served by the app's local address), so a
    # true copy is never refused for want of the engine's
    old_chk = ("  function checked(name, buf) {\n"
               "    if (!buf) return Promise.resolve(null);\n"
               "    if (!(window.crypto && crypto.subtle)) return Promise.reject(new Error('digest'));\n"
               "    return crypto.subtle.digest('SHA-256', buf).then(function (h) { return hex(h) === SUM[name] ? buf : null; });\n"
               "  }\n")
    if src.count(old_chk) != 1:
        raise SystemExit("Tabula: the PDF reader's check was not found once")
    own = open(os.path.join(HERE, "sha256.js"), encoding="utf-8").read()
    src = src.replace(old_chk, own + (
        "  function checked(name, buf) {\n"
        "    if (!buf) return Promise.resolve(null);\n"
        "    var mine = function () { return sha256(buf) === SUM[name] ? buf : null; };\n"
        "    if (!(window.crypto && crypto.subtle && crypto.subtle.digest)) return Promise.resolve(mine());\n"
        "    return crypto.subtle.digest('SHA-256', buf).then(function (h) { return hex(h) === SUM[name] ? buf : null; }, mine);\n"
        "  }\n"))
    enc = base64.b64encode(src.encode("utf-8")).decode("ascii")
    p.s = p.s[:m.start(1)] + enc + p.s[m.end(1):]
    p.before_body_end(JS)


JS = r'''<script id="cd-1072-host-open">
(function () {
  'use strict';
  if (window.cdHostAsk) return;
  function fr() { try { return typeof state !== 'undefined' && state && state.lang === 'fr'; } catch (e) { return false; } }
  function report(name, how) {
    try { var a = window.pywebview && window.pywebview.api; if (a && a.file_opened) a.file_opened(String(name), String(how)); } catch (e) {}
  }
  // Tabula in this window, shown and ready to read a file
  function tabula() {
    var fs = document.querySelectorAll('iframe');
    for (var i = 0; i < fs.length; i++) {
      try {
        var w = fs[i].contentWindow;
        if (w && w.cdOpenPdf && w.cdOpenDocx && w.document.getElementById('editor') && fs[i].getBoundingClientRect().width > 0) return w;
      } catch (e) {}
    }
    return null;
  }
  // one file at a time: a second arriving while the first is still opening waits its turn
  function openOne(name, b64) {
    return new Promise(function (done) {
      function say(how) { report(name, how); done(); }
      var pdf = /\.pdf$/i.test(name), bin = atob(b64), u = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      var f = new File([u], name, { type: pdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      // the door gives way to the document
      try {
        var door = document.getElementById('cd-door'), cs = door && getComputedStyle(door);
        if (door && cs.display !== 'none' && cs.visibility !== 'hidden' && door.getBoundingClientRect().width > 0 && typeof cdCloseDoor === 'function') cdCloseDoor();
      } catch (e) {}
      try { if (!tabula() && typeof openExt === 'function') openExt('tabula'); } catch (e) {}
      var tries = 0;
      (function wait() {
        var w = tabula();
        if (!w) { if (++tries < 240) setTimeout(wait, 250); else say('not opened: Tabula did not open'); return; }
        var p;
        if (pdf) p = w.cdOpenPdf(f);
        else {
          var ed = w.document.getElementById('editor'), has = ((ed && ed.innerText) || '').trim().length > 0;
          if (has && !w.confirm(fr() ? 'Ouvrir ' + name + ' ? Il remplacera ce qui est \u00e9crit ici.' : 'Open ' + name + '? It takes the place of what is written here now.')) { say('not opened: the page was kept'); return; }
          p = w.cdOpenDocx(f);
        }
        Promise.resolve(p).then(function (r) { say(r ? 'opened' : 'not opened'); }, function (e) {
          say('not opened: ' + ((e && e.message) || e));
          try { w.alert((fr() ? 'Ce document n\u2019a pas pu \u00eatre lu : ' : 'That document could not be read: ') + ((e && e.message) || e)); } catch (x) {}
        });
      })();
    });
  }
  // the app keeps a file it was asked to open (Open With in the Finder or in Explorer) until this page asks for it: Carpe
  // Diem's own window asks, or Tabula's own window when one is open; the app answers which may take it
  var where = (function () { try { return (typeof cdAppWindowWhich === 'function' && cdAppWindowWhich()) || 'desk'; } catch (e) { return 'desk'; } })();
  var busy = false, told = false;
  function ask() {
    var a = null;
    try { a = window.pywebview && window.pywebview.api; } catch (e) {}
    if (busy || !a || typeof a.take_file !== 'function' || (where !== 'desk' && where !== 'tabula')) return;
    if (!told) { told = true; report('-', 'the page asks for files from ' + where); }
    busy = true;
    function free() { busy = false; }
    Promise.resolve(a.take_file(where)).then(function (t) {
      if (!t || !t.key) { free(); return; }
      var parts = [], i = 0;
      (function next() {
        if (i >= t.parts) { openOne(String(t.name), parts.join('')).then(free, free); return; }
        Promise.resolve(a.file_part(t.key, i)).then(function (s) { parts.push(String(s || '')); i++; next(); },
          function () { report(t.name, 'not opened: a piece did not arrive'); free(); });
      })();
    }, free);
  }
  // often while the app is starting (a file that started it is waiting), then now and then
  var born = Date.now();
  (function tick() { ask(); setTimeout(tick, Date.now() - born < 60000 ? 1200 : 2500); })();
  window.cdHostAsk = ask;
})();
</script>
'''
