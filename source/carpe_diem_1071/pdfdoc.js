// A PDF's words as a document: lines from the positions of its words, then paragraphs, headings, lists and footnotes
// as a reader sees them; running heads and page numbers left out.
window.cdPdfToDoc = async function (lib, bytes, progress) {
  'use strict';
  var task = lib.getDocument({ data: bytes, isEvalSupported: false, disableFontFace: true, useSystemFonts: false, verbosity: 0 });
  task.onPassword = function (update, reason) {
    var p = prompt(reason === 2 ? 'That password did not open it. The PDF’s password:' : 'This PDF is locked. Its password:');
    if (p == null) { task.__shut = true; try { task.destroy(); } catch (e) {} } else update(p);
  };
  var doc;
  try { doc = await task.promise; } catch (e) { if (task.__shut) { var pw = new Error('password'); pw.name = 'PasswordException'; throw pw; } throw e; }
  var N = doc.numPages, pages = [], chars = 0;
  var BULLET = /^[•◦▪●‣⁃∙■□–—-]$/;

  function styleOf(name) {
    var n = String(name || '');
    return { b: /bold|black|heavy|semibold|demi/i.test(n), i: /italic|oblique|-it\b|-it[A-Z]|ital\b/i.test(n) || /-It$|It$/.test(n.replace(/MT$/, '')) };
  }

  for (var pn = 1; pn <= N; pn++) {
    var page = await doc.getPage(pn), vp = page.getViewport({ scale: 1 });
    var tc = await page.getTextContent();
    var fonts = {};
    try {
      await page.getOperatorList();
      Object.keys(tc.styles || {}).forEach(function (fn) {
        try { if (page.commonObjs.has(fn)) { var f = page.commonObjs.get(fn) || {}; var st = styleOf(f.name); fonts[fn] = { b: st.b || !!f.bold || !!f.black, i: st.i || !!f.italic }; } } catch (e) {}
      });
    } catch (e) {}
    var items = [];
    tc.items.forEach(function (it) {
      if (!it.str || !it.transform) return;
      var t = it.transform, size = Math.hypot(t[2], t[3]) || it.height;
      if (!size || Math.abs(t[1]) > 0.2 * size) return;
      var p0 = vp.convertToViewportPoint(t[4], t[5]), f = fonts[it.fontName] || {};
      items.push({ s: it.str, x: p0[0], y: p0[1], size: size, w: it.width, b: !!f.b, i: !!f.i });
      chars += it.str.replace(/\s/g, '').length;
    });
    pages.push({ n: pn, w: vp.width, h: vp.height, items: items });
    try { page.cleanup(); } catch (e) {}
    if (progress && progress(pn, N) === false) { try { doc.destroy(); } catch (e) {} var stop = new Error('stopped'); stop.stopped = true; throw stop; }
  }
  try { doc.destroy(); } catch (e) {}
  if (chars < Math.max(40, N * 25)) return { scan: true, pages: N, chars: chars };

  // the body size: the size most of the words are set in
  var bySize = {};
  pages.forEach(function (pg) { pg.items.forEach(function (it) { var k = Math.round(it.size * 2) / 2; bySize[k] = (bySize[k] || 0) + it.s.length; }); });
  var body = +Object.keys(bySize).sort(function (a, b) { return bySize[b] - bySize[a]; })[0];

  // lines: words that share a baseline; small raised words (note numbers) join the line beneath them
  pages.forEach(function (pg) {
    var its = pg.items.slice().sort(function (a, b) { return a.y - b.y || a.x - b.x; }), lines = [];
    its.forEach(function (it) {
      var L = lines[lines.length - 1];
      if (L && Math.abs(it.y - L.y) <= 0.3 * Math.min(it.size, L.size)) { L.items.push(it); if (it.size > L.size) L.size = it.size; }
      else lines.push({ y: it.y, size: it.size, items: [it] });
    });
    for (var i = 0; i < lines.length - 1; i++) {
      var L = lines[i], B = lines[i + 1], small = L.items.every(function (it) { return it.size < 0.85 * B.size; });
      var rise = B.y - L.y, x0 = Math.min.apply(null, B.items.map(function (it) { return it.x; })) - B.size;
      var x1 = Math.max.apply(null, B.items.map(function (it) { return it.x + it.w; })) + B.size;
      var within = L.items.every(function (it) { return it.x >= x0 && it.x <= x1; });
      var digits = L.items.every(function (it) { return /^[\s\d*†‡,–-]+$/.test(it.s); });
      if (small && digits && within && rise > 0.12 * B.size && rise < 0.8 * B.size) {
        L.items.forEach(function (it) { it.sup = true; B.items.push(it); });
        lines.splice(i, 1); i--;
      }
    }
    pg.lines = lines.map(function (L) {
      L.items.sort(function (a, b) { return a.x - b.x; });
      // within a line, a word set small and raised is a note number
      var main = L.items.filter(function (it) { return !it.sup; }), base = main.length ? main : L.items;
      var size = 0, cnt = {};
      base.forEach(function (it) { var k = Math.round(it.size * 2) / 2; cnt[k] = (cnt[k] || 0) + it.s.length; });
      size = +Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })[0];
      var y = base.reduce(function (m, it) { return Math.max(m, it.y); }, -1e9);
      L.items.forEach(function (it) { if (!it.sup && it.size < 0.85 * size && y - it.y > 0.12 * size && /^[\s\d*†‡,]+$/.test(it.s)) it.sup = true; });
      var runs = [], prev = null;
      L.items.forEach(function (it) {
        var gap = prev ? it.x - (prev.x + prev.w) : 0, sp = prev && !it.sup && gap > 0.18 * Math.min(it.size, prev.size) && !/\s$/.test(prev.s) && !/^\s/.test(it.s);
        var s = (sp ? ' ' : '') + it.s, r = runs[runs.length - 1];
        if (r && r.b === it.b && r.i === it.i && !!r.sup === !!it.sup) r.s += s;
        else runs.push({ s: s, b: it.b, i: it.i, sup: !!it.sup });
        prev = it;
      });
      var text = runs.map(function (r) { return r.s; }).join('');
      return { y: y, size: size, x0: L.items[0].x, x1: Math.max.apply(null, L.items.map(function (it) { return it.x + it.w; })), runs: runs, text: text.trim(), page: pg };
    }).filter(function (l) { return l.text; });
  });

  // running heads and feet: a bare page number near the top or foot, and the outermost line at either edge when its
  // words (numbers aside) recur on many pages and any number in it follows the page's own number
  function norm(t) { return t.toLowerCase().replace(/\d+/g, '#').replace(/\s+/g, ' ').trim(); }
  function pageNum(t) { return /^(page\s*)?([\divxlc]+)(\s*(of|\/)\s*\d+)?$/i.test(t); }
  function edges(pg) {
    var ls = pg.lines, out = [];
    if (!ls.length) return out;
    [[0, 1], [ls.length - 1, -1]].forEach(function (e) {
      for (var i = e[0], k = 0; k < 2 && i >= 0 && i < ls.length; i += e[1], k++) {
        var l = ls[i], near = e[1] > 0 ? l.y < 0.12 * pg.h : l.y > 0.88 * pg.h;
        if (!near || (l.runs[0] && l.runs[0].sup)) break;
        out.push(l);
        if (!pageNum(l.text)) break;
      }
    });
    return out;
  }
  var seen = {};
  pages.forEach(function (pg, ix) {
    edges(pg).forEach(function (l) { var k = norm(l.text), m = /\d+/.exec(l.text); (seen[k] = seen[k] || []).push(m ? +m[0] - ix : null); });
  });
  function running(t) {
    var occ = seen[norm(t)];
    if (!occ || N < 3 || occ.length < Math.max(3, Math.ceil(N * 0.3))) return false;
    if (occ[0] === null) return true;
    var c = {}; occ.forEach(function (d) { c[d] = (c[d] || 0) + 1; });
    return Math.max.apply(null, Object.keys(c).map(function (k) { return c[k]; })) >= 0.7 * occ.length;
  }
  pages.forEach(function (pg) {
    var drop = edges(pg).filter(function (l) { return (pageNum(l.text) && l.size <= body * 1.05) || running(l.text); });
    pg.lines = pg.lines.filter(function (l) { return drop.indexOf(l) < 0; });
  });

  // footnotes: small lines at the foot of a page that begin with a number
  var notes = {}, order = [], lastNote = null;
  function numbered(l) { return /^\d{1,3}[.)]?\s/.test(l.text) || (l.runs[0] && l.runs[0].sup && /^\s*\d{1,3}\s*$/.test(l.runs[0].s)); }
  function numOf(l) { var r = l.runs[0]; if (r && r.sup && /^\s*\d{1,3}\s*$/.test(r.s)) return +r.s.trim(); var m = /^(\d{1,3})[.)]?\s/.exec(l.text); return m ? +m[1] : null; }
  var waiting = [];
  pages.forEach(function (pg) {
    var ls = pg.lines, k = ls.length, marks = [];
    ls.forEach(function (l) { l.runs.forEach(function (r, ri) { if (r.sup && /^\s*\d{1,3}\s*$/.test(r.s) && !(ri === 0 && numOf(l) != null)) marks.push(+r.s.trim()); }); });
    // a note may stand at the foot of the page after its number's
    var cand = waiting.concat(marks);
    waiting = cand.slice(-12);
    // set smaller than the text, at the foot
    while (k > 0 && ls[k - 1].size < 0.92 * body) k--;
    if (k >= ls.length || !ls.slice(k).some(numbered)) {
      // or set off by a gap, its lines beginning with numbers raised in the text, in order
      if (!cand.length) return;
      var gaps = [];
      for (var g = 1; g < ls.length; g++) if (ls[g].y > ls[g - 1].y) gaps.push(ls[g].y - ls[g - 1].y);
      gaps.sort(function (a, b) { return a - b; });
      var lead0 = gaps.length ? gaps[Math.floor(gaps.length / 2)] : body * 1.3;
      k = -1;
      for (var j = 1; j < ls.length; j++) {
        if (cand.indexOf(numOf(ls[j])) >= 0 && ls[j].y - ls[j - 1].y > 1.15 * lead0) { k = j; break; }
      }
      if (k < 0) return;
      var last = -1, ok = true;
      ls.slice(k).forEach(function (l) { var n = numOf(l); if (n != null) { if (cand.indexOf(n) < 0 || n <= last) ok = false; last = n; } });
      if (!ok) return;
    }
    // what comes before the first numbered line belongs to a note only if a clear gap sets it off from the text above
    if (!numbered(ls[k]) && !(k > 0 && ls[k].y - ls[k - 1].y > 1.7 * body)) { while (k < ls.length && !numbered(ls[k])) k++; }
    var zone = ls.slice(k);
    pg.lines = ls.slice(0, k);
    var cur = null;
    zone.forEach(function (l) {
      var m = l.runs[0] && l.runs[0].sup && /^\s*(\d{1,3})\s*$/.test(l.runs[0].s) ? [0, l.runs[0].s.trim()] : /^(\d{1,3})[.)]?\s/.exec(l.text);
      if (m) {
        var runs = l.runs.slice(), num = +m[1];
        if (runs[0].sup) runs.shift(); else runs[0] = { s: runs[0].s.replace(/^\s*\d{1,3}[.)]?\s*/, ''), b: runs[0].b, i: runs[0].i };
        cur = { n: num, page: pg.n, runs: runs, used: false };
        notes[pg.n + ':' + num] = cur; order.push(cur);
        waiting = waiting.filter(function (w) { return w !== num; });
      } else if (cur) { cur.runs = cur.runs.concat([{ s: ' ' }], l.runs); }
      else if (lastNote) { lastNote.runs = lastNote.runs.concat([{ s: ' ' }], l.runs); }
      else { pg.lines.push(l); }
    });
    if (cur) lastNote = cur;
  });

  // paragraphs, in reading order
  var all = [];
  pages.forEach(function (pg) { pg.lines.forEach(function (l) { all.push(l); }); });
  var gaps = [];
  for (var i = 1; i < all.length; i++) if (all[i].page === all[i - 1].page && Math.abs(all[i].size - body) < 0.6 && Math.abs(all[i - 1].size - body) < 0.6) { var g = all[i].y - all[i - 1].y; if (g > 0) gaps.push(g); }
  gaps.sort(function (a, b) { return a - b; });
  var lead = gaps.length ? gaps[Math.floor(gaps.length / 2)] : body * 1.3;
  var allR = [];
  pages.forEach(function (pg) { pg.lines.forEach(function (l) { if (Math.abs(l.size - body) < 0.6) allR.push(l.x1); }); });
  allR.sort(function (a, b) { return a - b; });
  var docRight = allR.length ? allR[Math.floor(allR.length * 0.9)] : null;
  pages.forEach(function (pg) {
    var xs = {}, rs = [];
    pg.lines.forEach(function (l) { if (Math.abs(l.size - body) < 0.6) { var k = Math.round(l.x0); xs[k] = (xs[k] || 0) + 1; rs.push(l.x1); } });
    var left = Object.keys(xs).sort(function (a, b) { return xs[b] - xs[a]; })[0];
    rs.sort(function (a, b) { return a - b; });
    pg.left = left != null ? +left : 72;
    pg.right = rs.length >= 12 ? rs[Math.floor(rs.length * 0.9)] : (docRight && docRight > pg.w * 0.5 ? docRight : pg.w - 72);
  });
  var paras = [], P = null;
  all.forEach(function (l, i) {
    var p = all[i - 1], pg = l.page, start = !P;
    var centred = Math.abs((l.x0 + l.x1) / 2 - pg.w / 2) < 0.04 * pg.w && l.x0 > pg.left + 2 * body && l.x1 < pg.right - 2 * body;
    if (!start) {
      var same = p.page === pg;
      if (Math.abs(l.size - p.size) > 0.12 * body) start = true;
      else if (same && l.y - p.y > lead * 1.4) start = true;
      else if (l.x0 > pg.left + 0.8 * l.size && !(P.indent && Math.abs(l.x0 - P.indentX) < 2)) start = true;
      else if (p.x1 + (((/^\S+/.exec(l.text) || [''])[0].length + 1) * 0.5 + 0.5) * p.size < p.page.right) start = true;
      else if (centred || P.centred) start = true;
      else if (BULLET.test(l.text.charAt(0)) && /\s/.test(l.text.charAt(1) || ' ')) start = true;
    }
    if (start) {
      var ind = l.x0 > pg.left + 0.8 * l.size;
      P = { lines: [l], size: l.size, centred: centred, indent: ind && !centred && l.x0 > pg.left + 3 * l.size, indentX: l.x0 };
      paras.push(P);
    } else P.lines.push(l);
  });

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  var nid = 0, out = [], fnEntries = [], listOpen = null;
  function runsHtml(runs, pageNo, inNote) {
    var h = '';
    runs.forEach(function (r) {
      if (!inNote && r.sup && /^\s*\d{1,3}\s*$/.test(r.s)) {
        var num = +r.s.trim(), note = notes[pageNo + ':' + num];
        if (!note) for (var q = 0; q < order.length; q++) if (order[q].n === num && !order[q].used && order[q].page >= pageNo) { note = order[q]; break; }
        if (note && !note.used) {
          note.used = true; nid++;
          fnEntries.push({ nid: 'pdf' + nid, html: runsHtml(note.runs, note.page, true).replace(/\s+/g, ' ').trim() });
          h += '<sup class="fn-ref" data-note="foot" data-nid="pdf' + nid + '">' + num + '</sup>' + (/\s$/.test(r.s) ? ' ' : '');
          return;
        }
      }
      var s = esc(r.s), tail = /\s*$/.exec(s)[0];
      s = s.slice(0, s.length - tail.length);
      if (s) {
        if (r.sup) s = '<sup>' + s + '</sup>';
        if (r.i) s = '<i>' + s + '</i>';
        if (r.b) s = '<b>' + s + '</b>';
      }
      h += s + tail;
    });
    return h;
  }
  paras.forEach(function (P) {
    // lines joined with a space, a word broken at the end of a line made whole
    var runs = [];
    P.lines.forEach(function (l, k) {
      var rs = l.runs.map(function (r) { return { s: r.s, b: r.b, i: r.i, sup: r.sup }; });
      if (k) {
        var last = runs[runs.length - 1];
        if (last && /[A-Za-zÀ-ɏ]-$/.test(last.s) && /^[a-zß-ɏ]/.test(rs[0].s)) last.s = last.s.slice(0, -1);
        else runs.push({ s: ' ', b: false, i: false });
      }
      rs[0].pg = l.page.n; runs = runs.concat(rs);
    });
    var pageNo = P.lines[0].page.n, text = P.lines.map(function (l) { return l.text; }).join(' ');
    var bullet = BULLET.test(text.charAt(0)) && /\s/.test(text.charAt(1) || ' ');
    if (bullet) { for (var b = 0; b < runs.length; b++) if (runs[b].s.trim()) { runs[b].s = runs[b].s.replace(/^\s*\S\s*/, ''); break; } text = text.replace(/^\S\s*/, ''); }
    var html = '', cut = [], cur = [], pgOf = pageNo;
    // the note numbers carry their own page
    runs.forEach(function (r) { if (r.pg && r.pg !== pgOf) { if (cur.length) cut.push([pgOf, cur]); cur = []; pgOf = r.pg; } cur.push(r); });
    if (cur.length) cut.push([pgOf, cur]);
    cut.forEach(function (c) { html += runsHtml(c[1], c[0]); });
    html = html.replace(/\s+/g, ' ').trim();
    var big = P.size / body, words = text.split(/\s+/).length, allBold = P.lines.every(function (l) { return l.runs.every(function (r) { return r.b || !r.s.trim(); }); });
    if (!bullet && listOpen) { out.push('</ul>'); listOpen = null; }
    var plain = allBold ? html.replace(/<\/?b>/g, '') : html;
    if (big >= 1.5 && words <= 30) out.push('<h1>' + plain + '</h1>');
    else if ((big >= 1.15 && words <= 30) || (allBold && words <= 14 && P.lines.length === 1 && !/[.,;:]$/.test(text))) out.push('<h2>' + plain + '</h2>');
    else if (bullet) {
      if (!listOpen) { out.push('<ul>'); listOpen = 1; }
      out.push('<li>' + html + '</li>');
    }
    else if (P.centred) out.push('<p style="text-align:center">' + html + '</p>');
    else out.push('<p>' + html + '</p>');
  });
  if (listOpen) out.push('</ul>');
  var spare = order.filter(function (n) { return !n.used; });
  if (spare.length) {
    out.push('<h2>Notes without a number in the text</h2>');
    spare.forEach(function (n) { out.push('<p>' + n.n + '. ' + runsHtml(n.runs, n.page, true).replace(/\s+/g, ' ').trim() + '</p>'); });
  }
  return { html: out.join(''), notes: fnEntries, spare: spare.length, pages: N, chars: chars, body: body };
};
