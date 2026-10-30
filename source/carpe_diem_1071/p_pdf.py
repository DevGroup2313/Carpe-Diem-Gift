"""1071 · Tabula opens a PDF as a document to write in.

The owner asked that Tabula open Word and PDF files. Word came in 1069; a PDF could only be filled in (Fill a PDF writes
on top of its pages). Now File, Open (and a PDF dropped on Tabula) brings a PDF's words in as an ordinary document:
lines are rebuilt from where each word stands on the page, then paragraphs (a word broken by a hyphen at a line's end
made whole), headings by their size or weight, centred lines, bulleted lists, bold and italic, and footnotes: the
numbers raised in the text are matched with the notes at the page feet (smaller type, or set off by a gap and numbered
as the text's raised numbers are, even when a note stands on the page after its number) and become Tabula's own
footnotes. Running heads, running feet and page numbers are left out. A PDF that holds only pictures of its pages says
so. A long PDF shows its progress page by page and can be stopped.

PDFs are read with pdf.js 3.11.174, the reader Scriba already uses: it is fetched once, the first time it is needed,
from the address the app's security policy allows, and kept for offline use in the store Scriba keeps it in; each copy,
fetched or kept, is used only when its SHA-256 fingerprint is the published package's (npm pdfjs-dist 3.11.174, whose
checksum matches the registry's), so a changed file is never run."""
import base64, os, re

HERE = os.path.dirname(os.path.abspath(__file__))

GLUE = r"""
(function () {
  'use strict';
  if (window.cdOpenPdf) return;
  var V = '3.11.174', CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + V + '/legacy/build/';
  var SUM = { 'pdf.min.js': '978fd1b2d134a98e98966186a97777bebf87d8e770dadab1ece3687e21a5aa6c',
              'pdf.worker.min.js': '38cde5311957b86bc3669f93e7d2566de333a90055ed6635bef60d9bf00e96f2' };
  // the store Scriba keeps the same reader in, so either app's first fetch serves both
  var RT = { cache: 'cd-scriba-1044', key: 'https://scriba.carpe-diem.invalid/pdfjs/' + V + '/', db: 'cd_scriba_store', store: 'files' };
  // as Tabula's ribbon tells: the page's language, or the app's
  function fr() {
    try { if ((document.documentElement.lang || '').indexOf('fr') === 0 || window.__APP_LANG__ === 'fr') return true; } catch (e) {}
    try { return (parent.document.documentElement.lang || '').indexOf('fr') === 0; } catch (e) { return false; }
  }
  function T(en, f) { return fr() ? f : en; }

  function hex(buf) { var a = new Uint8Array(buf), s = ''; for (var i = 0; i < a.length; i++) s += ('0' + a[i].toString(16)).slice(-2); return s; }
  function checked(name, buf) {
    if (!buf) return Promise.resolve(null);
    if (!(window.crypto && crypto.subtle)) return Promise.reject(new Error('digest'));
    return crypto.subtle.digest('SHA-256', buf).then(function (h) { return hex(h) === SUM[name] ? buf : null; });
  }
  function db(mode, fn) {
    return new Promise(function (res, rej) {
      var rq; try { rq = indexedDB.open(RT.db, 1); } catch (e) { rej(e); return; }
      rq.onupgradeneeded = function () { try { rq.result.createObjectStore(RT.store); } catch (e) {} };
      rq.onerror = function () { rej(rq.error || new Error('store')); };
      rq.onsuccess = function () {
        var d = rq.result, out;
        try {
          var tx = d.transaction(RT.store, mode), r2 = fn(tx.objectStore(RT.store));
          if (r2) r2.onsuccess = function () { out = r2.result; };
          tx.oncomplete = function () { try { d.close(); } catch (e) {} res(out); };
          tx.onerror = tx.onabort = function () { try { d.close(); } catch (e) {} rej(tx.error || new Error('store')); };
        } catch (e) { try { d.close(); } catch (x) {} rej(e); }
      };
    });
  }
  function kept(name) {
    var key = RT.key + name;
    var c = (typeof caches !== 'undefined') ? caches.open(RT.cache).then(function (k) { return k.match(key); }).then(function (r) { return r ? r.arrayBuffer() : null; }) : Promise.resolve(null);
    return c.catch(function () { return null; }).then(function (b) {
      return b || db('readonly', function (st) { return st.get(key); }).then(function (v) { return v && v.body ? v.body : null; }, function () { return null; });
    });
  }
  function keep(name, buf) {
    var key = RT.key + name;
    var c = (typeof caches !== 'undefined') ? caches.open(RT.cache).then(function (k) { return k.put(key, new Response(buf, { headers: { 'content-type': 'text/javascript' } })); }) : Promise.reject(new Error('no cache'));
    return c.catch(function () { return db('readwrite', function (st) { return st.put({ body: buf, type: 'text/javascript' }, key); }); }).catch(function () {});
  }
  // beside the app, then kept, then fetched once; each only if it is the published file
  function file(name, say) {
    var base = document.baseURI || location.href;
    return fetch(new URL('vendor/' + name, base).href).then(function (r) { return r.ok ? r.arrayBuffer() : null; }, function () { return null; })
      .then(function (b) { return checked(name, b); })
      .then(function (b) { return b || kept(name).then(function (b2) { return checked(name, b2); }); })
      .then(function (b) {
        if (b) return b;
        say(T('Fetching the PDF reader, once (about 1.5 MB); after that it works offline…', 'Téléchargement du lecteur PDF, une seule fois (environ 1,5 Mo) ; ensuite il fonctionne hors ligne…'));
        return fetch(CDN + name, { credentials: 'omit' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); }, function () { var e = new Error('offline'); e.offline = true; throw e; })
          .then(function (b3) { return checked(name, b3).then(function (ok) { if (!ok) { var e = new Error('mismatch'); e.mismatch = true; throw e; } return keep(name, ok).then(function () { return ok; }); }); });
      });
  }
  var LIB = null;
  function lib(say) {
    if (LIB) return LIB;
    LIB = Promise.all([file('pdf.min.js', say), file('pdf.worker.min.js', say)]).then(function (b) {
      return new Promise(function (res, rej) {
        function ready() { try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([b[1]], { type: 'text/javascript' })); res(window.pdfjsLib); } catch (e) { rej(e); } }
        if (window.pdfjsLib && window.pdfjsLib.getDocument) { ready(); return; }
        var sc = document.createElement('script');
        sc.src = URL.createObjectURL(new Blob([b[0]], { type: 'text/javascript' }));
        sc.onload = ready; sc.onerror = function () { rej(new Error('pdf.js')); };
        document.head.appendChild(sc);
      });
    });
    LIB.catch(function () { LIB = null; });
    return LIB;
  }

  // a quiet card at the foot of the window: what is happening, and a key to stop
  function card() {
    var dark = false;
    try { var m = /(\d+),\s*(\d+),\s*(\d+)/.exec(getComputedStyle(document.body).backgroundColor); dark = m && (+m[1] * 0.3 + +m[2] * 0.59 + +m[3] * 0.11) < 110; } catch (e) {}
    var was = document.getElementById('cd-pdf-open-card'); if (was) was.remove();
    var c = document.createElement('div'), t = document.createElement('span'), b = document.createElement('button');
    c.id = 'cd-pdf-open-card';
    c.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:2147483000;max-width:min(560px,calc(100vw - 32px));display:flex;align-items:center;gap:12px;'
      + 'padding:10px 14px;border-radius:12px;font:13px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;'
      + (dark ? 'background:#26292e;color:#e9e6df;border:1px solid rgba(255,255,255,.12);box-shadow:0 4px 14px rgba(0,0,0,.35);'
              : 'background:#fffdf7;color:#2c2c2e;border:1px solid rgba(176,131,47,.35);box-shadow:0 4px 14px rgba(16,42,58,.12);');
    b.type = 'button'; b.textContent = T('Stop', 'Arrêter');
    b.style.cssText = 'flex:none;border-radius:8px;padding:4px 11px;font:inherit;cursor:pointer;border:1px solid ' + (dark ? 'rgba(255,255,255,.2);background:#33373d;color:inherit' : 'rgba(27,107,147,.35);background:#eef6fa;color:#155f84');
    c.appendChild(t); c.appendChild(b); document.body.appendChild(c);
    var api = { stop: false, say: function (s) { t.textContent = s; }, done: function (s, ms) {
      b.textContent = T('Close', 'Fermer'); b.onclick = function () { c.remove(); }; t.textContent = s;
      setTimeout(function () { try { c.remove(); } catch (e) {} }, ms || 9000);
    } };
    b.onclick = function () { api.stop = true; b.disabled = true; };
    return api;
  }

  window.cdOpenPdf = async function (f) {
    var ed = document.getElementById('editor');
    var has = ((ed && ed.innerText) || '').trim().length > 0;
    if (has && !confirm(T('Open ' + f.name + '? Its words take the place of what is written here now.', 'Ouvrir ' + f.name + ' ? Son texte remplacera ce qui est écrit ici.'))) return 0;
    var ui = card();
    ui.say(T('Opening the PDF…', 'Ouverture du PDF…'));
    var res;
    try {
      var L = await lib(ui.say), bytes = new Uint8Array(await f.arrayBuffer());
      res = await window.cdPdfToDoc(L, bytes, function (n, N) {
        if (N > 3) ui.say(T('Reading the PDF… page ' + n + ' of ' + N, 'Lecture du PDF… page ' + n + ' sur ' + N));
        return !ui.stop;
      });
    } catch (e) {
      var why = e && e.stopped ? T('Stopped. Nothing was changed.', 'Arrêté. Rien n’a changé.')
        : e && e.offline ? T('The PDF reader could not be fetched: it is needed once, with a connection. Try again when you are online.', 'Le lecteur PDF n’a pas pu être téléchargé : il faut une connexion une seule fois. Réessayez une fois en ligne.')
        : e && e.mismatch ? T('The PDF reader that arrived was not the published one, so it was not used.', 'Le lecteur PDF reçu n’était pas celui qui est publié ; il n’a pas été utilisé.')
        : e && /password/i.test(e.name || '') ? T('The PDF stays closed without its password.', 'Le PDF reste fermé sans son mot de passe.')
        : T('That PDF could not be read', 'Ce PDF n’a pas pu être lu') + (e && e.message ? ' (' + e.message + ')' : '') + '.';
      ui.done(why, 12000);
      return 0;
    }
    if (res.scan) {
      ui.done(T('This PDF holds pictures of its pages rather than words, so there is no text to bring in. Fill a PDF can still write on it.',
                'Ce PDF contient des images de ses pages et non du texte : il n’y a rien à reprendre. « Remplir un PDF » peut quand même écrire dessus.'), 14000);
      return 0;
    }
    ed.innerHTML = res.html;
    try {
      var fb = document.getElementById('footnotes');
      if (fb) {
        if (res.notes.length) {
          fb.innerHTML = '<div class="h">Notes</div>';
          res.notes.forEach(function (en) { var d = document.createElement('div'); d.className = 'fn'; d.setAttribute('data-nid', en.nid); d.innerHTML = '<sup></sup> ' + en.html; fb.appendChild(d); });
          fb.style.display = 'block';
        } else { fb.innerHTML = ''; fb.style.display = 'none'; }
      }
      var eb = document.getElementById('endnotes'); if (eb) { eb.innerHTML = ''; eb.style.display = 'none'; }
      var hd = document.getElementById('docheader'); if (hd) { hd.innerHTML = ''; hd.style.display = 'none'; }
      var ft = document.getElementById('docfooter'); if (ft) { ft.innerHTML = ''; ft.style.display = 'none'; }
      if (window.__cdSectionsApply) window.__cdSectionsApply([{ h: '', f: '', link: false }]);
    } catch (e) {}
    try { if (window.__cdAfterImport) window.__cdAfterImport(); } catch (e) {}
    try { var dt = document.getElementById('docTitle'); if (dt) dt.value = (f.name || 'Imported').replace(/\.[^.]+$/, ''); } catch (e) {}
    try { var wt = Array.prototype.find.call(document.querySelectorAll('button'), function (b) { var s = b.textContent.trim(); return s === 'Write' || s === 'Écrire'; }); if (wt) wt.click(); } catch (e) {}
    try { ed.dispatchEvent(new Event('input')); } catch (e) {}
    if (window.__tabulaFlush) try { window.__tabulaFlush(); } catch (e) {}
    var pg = res.pages + T(res.pages === 1 ? ' page' : ' pages', ' page' + (res.pages === 1 ? '' : 's'));
    var nt = res.notes.length ? ', ' + res.notes.length + T(res.notes.length === 1 ? ' footnote' : ' footnotes', ' note' + (res.notes.length === 1 ? '' : 's') + ' de bas de page') : '';
    ui.done(T('Opened from the PDF: ' + pg + nt + '. The words are yours to edit; pictures stay in the PDF. To write on the PDF itself, use Fill a PDF.',
              'Ouvert depuis le PDF : ' + pg + nt + '. Le texte est à vous ; les images restent dans le PDF. Pour écrire sur le PDF lui-même : « Remplir un PDF ».'));
    return 1;
  };

  // File, Open (and a file dropped on Tabula, which passes through it) takes a PDF too
  var of = document.getElementById('openFile');
  if (of) {
    of.setAttribute('accept', (of.getAttribute('accept') || '') + ',.pdf,application/pdf');
    of.addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (f && (/\.pdf$/i.test(f.name) || f.type === 'application/pdf')) {
        e.stopImmediatePropagation();
        of.value = '';
        window.cdOpenPdf(f);
      }
    }, true);
  }
})();
"""


def apply(p, full):
    # An older guard the page puts into Tabula refused a PDF chosen in any of Tabula's file choosers ("This is a PDF.
    # Tabula writes .docx documents"), which also stopped Fill a PDF from ever opening one. A chooser that asks for PDFs
    # (File, Open; Fill a PDF) now has it; any other (a picture, the Word key) still says no, and says where to go.
    p.rep(r"""    + '  if(!bad)return;\n'""", r"""    + '  if(!bad||/pdf/i.test(t.getAttribute(\'accept\')||\'\'))return;\n'""")
    p.rep(r"""alert(\'This is a PDF. Tabula writes .docx documents; please open PDFs in the PDF editor instead. \\u00b7 Ceci est un PDF : ouvrez-le dans l\\u2019\\u00e9diteur PDF.\');""",
          r"""alert(\'This is a PDF. To edit its words, open it with File, Open; to write on the PDF itself, use Fill a PDF. \\u00b7 Ceci est un PDF : pour en modifier le texte, ouvrez-le par Fichier, Ouvrir ; pour \\u00e9crire sur le PDF lui-m\\u00eame, \\u00ab Remplir un PDF \\u00bb.\');""")
    m = re.search(r'var TABULA_SRC = "([A-Za-z0-9+/=]+)"', p.s)
    if not m or p.s.count('var TABULA_SRC = "') != 1:
        raise SystemExit("Tabula's source was not found once")
    src = base64.b64decode(m.group(1)).decode("utf-8")
    if 'cd-1071-pdf' in src:
        raise SystemExit("Tabula already opens PDFs")
    reader = open(os.path.join(HERE, "pdfdoc.js"), encoding="utf-8").read()
    block = '<script id="cd-1071-pdf">\n' + reader + GLUE + '</script>\n'
    if "</script" in reader + GLUE:
        raise SystemExit("a closing script tag inside the PDF reader")
    k = src.rfind("</body>")
    if k < 0:
        raise SystemExit("Tabula has no </body>")
    src = src[:k] + block + src[k:]
    enc = base64.b64encode(src.encode("utf-8")).decode("ascii")
    p.s = p.s[:m.start(1)] + enc + p.s[m.end(1):]
