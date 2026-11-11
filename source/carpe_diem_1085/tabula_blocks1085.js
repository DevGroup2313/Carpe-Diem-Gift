/* Tabula 1085: paragraphs and lists kept in good order, Tab, indents, and Tabula's own undo.
   The browser's own editing makes lists inside paragraphs, nests lists without an item to hold them,
   turns an indent into a quotation and loses typing to the Tab key. Tabula now does these itself. */
(function () {
  'use strict';
  var ed = document.getElementById('editor');
  if (!ed || ed.__cdBlocks) return;
  ed.__cdBlocks = 1;
  var D = document, NATIVE = D.execCommand.bind(D);
  var STEP = 48;                       /* one indent step: half an inch (CSS has 96 pixels to the inch), as in Word */
  var LISTS = { UL: 1, OL: 1 };
  var INLINE = /^(#text|A|ABBR|B|BDI|BDO|BR|CITE|CODE|DATA|DEL|DFN|EM|FONT|I|IMG|INS|KBD|MARK|Q|S|SAMP|SMALL|SPAN|STRIKE|STRONG|SUB|SUP|TIME|U|VAR|WBR|LABEL|O:P)$/;
  var BLOCKY = /^(P|DIV|UL|OL|H1|H2|H3|H4|H5|H6|BLOCKQUOTE|PRE|TABLE|HR|FIGURE|SECTION|ARTICLE|ASIDE|HEADER|FOOTER|NAV|ADDRESS|DL)$/;
  var MLL = { mbul: ['disc', 'circle', 'square'], mnum: ['decimal', 'lower-alpha', 'lower-roman'], mrom: ['upper-roman', 'upper-alpha', 'decimal'], mstar: ['"✦  "', '"➤  "', 'disc'] };
  var busy = 0;                        /* Tabula's own changes in progress */
  var composing = false;

  try { NATIVE('defaultParagraphSeparator', false, 'p'); } catch (e) {}
  ed.addEventListener('focus', function () { try { NATIVE('defaultParagraphSeparator', false, 'p'); } catch (e) {} });

  /* ---------- small helpers ---------- */
  function topOf(n) { while (n && n.parentNode !== ed) n = n.parentNode; return n && n.parentNode === ed ? n : null; }
  function inEd(n) { return !!n && (n === ed || ed.contains(n)); }
  function range() { var s = window.getSelection(); if (!s || !s.rangeCount) return null; var r = s.getRangeAt(0); return inEd(r.commonAncestorContainer) ? r : null; }
  function isList(n) { return !!n && n.nodeType === 1 && LISTS[n.nodeName] === 1; }
  function special(n) {              /* a block Tabula keeps exactly as it is */
    if (!n || n.nodeType !== 1) return false;
    if (n.getAttribute('contenteditable') === 'false') return true;
    if (n.nodeName === 'DIV') { for (var i = 0; i < n.attributes.length; i++) { var a = n.attributes[i].name; if (!/^(style|dir|align|lang)$/.test(a)) return true; } }
    return false;
  }
  function isInline(n) { return n.nodeType === 3 || (n.nodeType === 1 && INLINE.test(n.nodeName) && n.getAttribute('contenteditable') !== 'false'); }
  function blank(n) { return n.nodeType === 3 && !/[^\s]/.test(n.nodeValue) ; }
  function px(v) {                     /* a length in CSS pixels, whatever unit it was written in */
    var m = /^\s*(-?[\d.]+)\s*(px|pt|cm|mm|in|pc|em|rem)?\s*$/i.exec(String(v || ''));
    if (!m) return 0; var n = parseFloat(m[1]); if (!isFinite(n)) return 0;
    var u = (m[2] || 'px').toLowerCase();
    return u === 'pt' ? n * 96 / 72 : u === 'cm' ? n * 96 / 2.54 : u === 'mm' ? n * 9.6 / 2.54 : u === 'in' ? n * 96 : u === 'pc' ? n * 16 : (u === 'em' || u === 'rem') ? n * 16 : n;
  }
  function lenOut(n) { n = Math.round(n * 100) / 100; return n ? n + 'px' : ''; }
  function copyAttrs(from, to, skip) { for (var i = 0; i < from.attributes.length; i++) { var a = from.attributes[i]; if (!skip || !skip.test(a.name)) try { to.setAttribute(a.name, a.value); } catch (e) {} } }
  function ownStart(li) { return [li, 0]; }
  function ownEnd(li) { for (var i = 0; i < li.childNodes.length; i++) if (isList(li.childNodes[i])) return [li, i]; return [li, li.childNodes.length]; }
  function ownText(el, upto) {         /* characters of an item's own text before a point */
    var r = D.createRange(); r.setStart(el, 0);
    try { r.setEnd(upto[0], upto[1]); } catch (e) { return 0; }
    var n = 0, w = D.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), t;
    while ((t = w.nextNode())) {
      if (el.nodeName === 'LI' && nestedIn(t, el)) continue;
      if (!r.intersectsNode(t)) continue;
      var a = (t === r.startContainer) ? r.startOffset : 0, b = (t === r.endContainer) ? r.endOffset : t.nodeValue.length;
      n += Math.max(0, b - a);
    }
    return n;
  }
  function nestedIn(t, li) { var p = t.parentNode; while (p && p !== li) { if (isList(p)) return true; p = p.parentNode; } return false; }
  function pointAt(el, off) {
    var w = D.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), t, last = null;
    while ((t = w.nextNode())) {
      if (el.nodeName === 'LI' && nestedIn(t, el)) continue;
      last = t;
      if (off <= t.nodeValue.length) return [t, off];
      off -= t.nodeValue.length;
    }
    if (last) return [last, last.nodeValue.length];
    var k = 0; while (k < el.childNodes.length && !isList(el.childNodes[k]) && el.childNodes[k].nodeName !== 'BR') k++;
    return [el, k];
  }
  function atStart(li, r) { if (!r.collapsed) return false; if (ownText(li, [r.startContainer, r.startOffset]) !== 0) return false;
    var x = D.createRange(); x.setStart(li, 0); try { x.setEnd(r.startContainer, r.startOffset); } catch (e) { return false; }
    return !x.cloneContents().querySelector('img,table,.cd-tab'); }
  function liOf(n) { while (n && n !== ed) { if (n.nodeName === 'LI') return n; n = n.parentNode; } return null; }
  function cellOf(n) { while (n && n !== ed) { if (n.nodeName === 'TD' || n.nodeName === 'TH') return n; n = n.parentNode; } return null; }
  function setSel(a, b) {
    b = b || a;
    if (!a || !a[0] || !b[0] || !a[0].isConnected || !b[0].isConnected || !inEd(a[0]) || !inEd(b[0])) return false;
    try { var s = window.getSelection(), r = D.createRange(); r.setStart(a[0], a[1]); r.setEnd(b[0], b[1]); s.removeAllRanges(); s.addRange(r); return true; } catch (e) { return false; }
  }
  function saveSel() { var s = window.getSelection(); if (!s || !s.rangeCount) return null; return { a: s.anchorNode, ao: s.anchorOffset, f: s.focusNode, fo: s.focusOffset }; }
  function backSel(v, map) {
    if (!v) return; var a = map && map.get(v.a) || v.a, f = map && map.get(v.f) || v.f;
    if (!inEd(a) || !inEd(f)) return;
    try { var s = window.getSelection(); var ao = Math.min(v.ao, a.nodeType === 3 ? a.nodeValue.length : a.childNodes.length), fo = Math.min(v.fo, f.nodeType === 3 ? f.nodeValue.length : f.childNodes.length);
      if (s.anchorNode === a && s.anchorOffset === ao && s.focusNode === f && s.focusOffset === fo) return; s.setBaseAndExtent(a, ao, f, fo); } catch (e) {}
  }
  function listKey(l) { return l.nodeName + '|' + (l.style.listStyleType || '') + '|' + (l.getAttribute('data-cd-mll') || '') + '|' + (l.classList.contains('cd-mll-dec') ? 1 : 0) + '|' + (l.getAttribute('start') || '') + '|' + (l.getAttribute('type') || ''); }
  function depthOf(l, root) { var d = 0, n = l; while (n && n !== root) { if (isList(n)) d++; n = n.parentNode; } return d; }
  function restyle(root) {            /* a multilevel list keeps its look at each level */
    if (!root || !isList(root)) return;
    var id = root.getAttribute('data-cd-mll');
    if (root.classList.contains('cd-mll-dec')) { root.querySelectorAll('ul,ol').forEach(function (l) { l.style.listStyleType = ''; l.classList.remove('cd-mll-dec'); l.removeAttribute('data-cd-mll'); }); return; }
    var ts = MLL[id]; if (!ts) return;
    root.style.listStyleType = ts[0];
    root.querySelectorAll('ul,ol').forEach(function (l) { l.removeAttribute('data-cd-mll'); l.style.listStyleType = ts[depthOf(l, root) % 3]; });
  }

  /* ---------- letting Tabula know: layout, autosave and the ribbon ---------- */
  function told(first, last) {
    try {
      if (first && first.parentNode === ed) {
        var d = window.__tabDirty;
        if (d !== 'all' && (!d || !d.isConnected || d.parentNode !== ed || (first.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING))) window.__tabDirty = first;
        var l = window.__tabDirtyLast, e2 = (last && last.parentNode === ed) ? last : first;
        if (!l || !l.isConnected || l.parentNode !== ed || (e2.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_PRECEDING)) window.__tabDirtyLast = e2;
      } else window.__tabDirty = 'all';
    } catch (e) { window.__tabDirty = 'all'; }
    busy++; try { ed.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {} busy--;
  }

  /* ---------- order kept: the normaliser ---------- */
  function wrapRuns(parent, attrsFrom, extraLeft) {   /* runs of loose words at a level that holds blocks become paragraphs */
    var kids = Array.prototype.slice.call(parent.childNodes), run = [], made = [];
    function flush(before) {
      while (run.length && blank(run[0])) run.shift();
      if (!run.length) { run = []; return; }
      if (run.every(blank)) { run = []; return; }
      var p = D.createElement('p'); if (attrsFrom) copyAttrs(attrsFrom, p, /^(id|class|contenteditable)$/);
      if (extraLeft) p.style.marginLeft = (px(p.style.marginLeft) + extraLeft) + 'px';
      parent.insertBefore(p, before); run.forEach(function (n) { p.appendChild(n); }); made.push(p); run = [];
    }
    kids.forEach(function (n) { if (isInline(n)) run.push(n); else flush(n); });
    flush(null);
    return made;
  }
  function hoist(p) {                 /* a paragraph that holds lists or other blocks is opened out */
    var parent = p.parentNode, out = [], cur = null;
    Array.prototype.slice.call(p.childNodes).forEach(function (n) {
      if (isInline(n)) { if (!cur) { cur = D.createElement('p'); copyAttrs(p, cur, /^(id)$/); out.push(cur); } cur.appendChild(n); }
      else { cur = null; if (n.nodeName === 'DIV' && !special(n)) { var q = D.createElement('p'); copyAttrs(p, q, /^(id|class)$/); copyAttrs(n, q, /^(id|class)$/); while (n.firstChild) q.appendChild(n.firstChild); out.push(q); } else out.push(n); }
    });
    out = out.filter(function (n) { return !(n.nodeName === 'P' && n !== p && !n.childNodes.length); });
    out.forEach(function (n) { parent.insertBefore(n, p); });
    parent.removeChild(p);
    out.forEach(function (n) { if (n.nodeName === 'P' && n.querySelector(':scope > ul, :scope > ol, :scope > p, :scope > div, :scope > blockquote, :scope > table, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6, :scope > pre')) hoist(n); });
    return out;
  }
  function plainDivToP(d, map) {
    var p = D.createElement('p'); copyAttrs(d, p);
    while (d.firstChild) p.appendChild(d.firstChild);
    d.parentNode.replaceChild(p, d); if (map) map.set(d, p); return p;
  }
  function indentQuote(b) { var st = (b.getAttribute('style') || '').replace(/\s+/g, ' ');
    return b.nodeName === 'BLOCKQUOTE' && /margin: ?0(px)? 0(px)? 0(px)? 40px/.test(st) && /border: ?none/.test(st); }
  function unquote(b, map) {           /* an indent the browser made as a quotation becomes a plain indent */
    var parent = b.parentNode, extra = STEP + px(b.style.marginLeft) - 40 + 0;
    wrapRuns(b, null, 0);
    var kids = Array.prototype.slice.call(b.childNodes), first = null;
    kids.forEach(function (n) {
      if (n.nodeType === 1) {
        if (n.nodeName === 'DIV' && !special(n)) n = plainDivToP(n, map);
        if (!special(n)) n.style.marginLeft = lenOut(px(n.style.marginLeft) + extra);
      }
      parent.insertBefore(n, b); if (!first && n.nodeType === 1) first = n;
    });
    parent.removeChild(b); if (map) map.set(b, first || parent);
    return first;
  }
  function fixList(l, map) {          /* lists hang from an item; an item is never empty */
    Array.prototype.slice.call(l.childNodes).forEach(function (n) {
      if (isList(n)) {
        var prev = n.previousElementSibling;
        if (prev && prev.nodeName === 'LI') prev.appendChild(n);
        else { var li = D.createElement('li'); li.style.listStyleType = 'none'; l.insertBefore(li, n); li.appendChild(n); }
        fixList(n, map);
      } else if (n.nodeType === 1 && n.nodeName !== 'LI') {
        if (!(n.nodeType === 3 && blank(n))) { var li2 = D.createElement('li'); l.insertBefore(li2, n); li2.appendChild(n); }
      } else if (n.nodeType === 3 && !blank(n)) { var li3 = D.createElement('li'); l.insertBefore(li3, n); li3.appendChild(n); }
    });
    Array.prototype.slice.call(l.children).forEach(function (li) {
      if (li.nodeName !== 'LI') return;
      /* words written after a nested list belong to an item of their own (Firefox leaves them inside) */
      var seen = false, tail = [];
      Array.prototype.slice.call(li.childNodes).forEach(function (n) { if (isList(n)) { seen = true; return; } if (seen && n.nodeType === 1 && (n.nodeName === 'P' || (n.nodeName === 'DIV' && !special(n)))) tail.push(n); else if (seen && tail.length) tail.push(n); });
      if (tail.length) {
        var nl = D.createElement('li'); li.parentNode.insertBefore(nl, li.nextSibling);
        tail.forEach(function (n) { if (n.nodeType === 1 && (n.nodeName === 'P' || n.nodeName === 'DIV') && !special(n)) { while (n.firstChild) nl.appendChild(n.firstChild); n.parentNode.removeChild(n); if (map) map.set(n, nl); } else nl.appendChild(n); });
      }
      Array.prototype.slice.call(li.children).forEach(function (c) { if (isList(c)) fixList(c, map); });
      var own = false; for (var i = 0; i < li.childNodes.length; i++) { var c = li.childNodes[i]; if (isList(c)) break; if (!(c.nodeType === 3 && c.nodeValue === '')) { own = true; break; } }
      if (!own) li.insertBefore(D.createElement('br'), li.firstChild);
    });
    if (!l.children.length && l.parentNode) { var par = l.parentNode; par.removeChild(l); return null; }
    return l;
  }
  function junk(root) {
    root.querySelectorAll('span[style]').forEach(function (s) {
      var st = (s.getAttribute('style') || '').replace(/\s+/g, '').toLowerCase();
      if (s.parentNode && s.attributes.length === 1 && (st === 'background-color:transparent;' || st === 'background-color:transparent' || st === '')) { var p = s.parentNode; while (s.firstChild) p.insertBefore(s.firstChild, s); p.removeChild(s); }
    });
    root.querySelectorAll('span[style]').forEach(function (s) {
      if (!s.parentNode || s.classList.contains('cd-tab')) return;
      var st = s.style; if (!st) return;
      var had = st.whiteSpace || st.getPropertyValue('text-wrap-mode') || st.getPropertyValue('white-space-collapse');
      if (!had) return;
      if (s.textContent.indexOf('\t') >= 0) return;
      st.removeProperty('white-space'); st.removeProperty('text-wrap-mode'); st.removeProperty('white-space-collapse'); st.removeProperty('text-wrap');
      if (!(s.getAttribute('style') || '').replace(/[\s;]/g, '') && s.attributes.length === 1) { var p0 = s.parentNode; while (s.firstChild) p0.insertBefore(s.firstChild, s); p0.removeChild(s); }
    });
    root.querySelectorAll('span.cd-tab').forEach(function (s) {
      if (!s.parentNode) return;
      var inner = s.parentNode.closest && s.parentNode.closest('span.cd-tab');
      if (inner && inner !== s) return;              /* the outer one is seen to */
      if (!s.textContent) { gone(s); return; }
      if (s.childNodes.length === 1 && s.firstChild.nodeType === 3 && s.firstChild.nodeValue === '\t') return;
      var sel = window.getSelection(), an = sel && sel.rangeCount ? sel.anchorNode : null, ao = sel && sel.rangeCount ? sel.anchorOffset : 0, caret = null;
      /* everything after the first tab character leaves the tab, in order, keeping the caret where it was */
      var txt = s.textContent, k = txt.indexOf('\t');
      if (k < 0) { var p1 = s.parentNode; while (s.firstChild) p1.insertBefore(s.firstChild, s); p1.removeChild(s); return; }
      var r = D.createRange(); r.selectNodeContents(s);
      var w = D.createTreeWalker(s, NodeFilter.SHOW_TEXT, null), t, seen = 0, cutNode = null, cutOff = 0;
      while ((t = w.nextNode())) { if (seen + t.nodeValue.length > k) { cutNode = t; cutOff = k - seen; break; } seen += t.nodeValue.length; }
      if (an && s.contains(an)) { var x = D.createRange(); x.selectNodeContents(s); try { x.setEnd(an, ao); caret = x.toString().length; } catch (e) { caret = null; } }
      var before = D.createRange(); before.setStart(s, 0); before.setEnd(cutNode, cutOff);
      var after = D.createRange(); after.setStart(cutNode, cutOff + 1); after.setEnd(s, s.childNodes.length);
      var fb = before.extractContents(), fa = after.extractContents();
      var parent = s.parentNode;
      parent.insertBefore(fb, s);
      while (s.firstChild) s.removeChild(s.firstChild); s.appendChild(D.createTextNode('\t'));
      var tail = D.createTextNode(''); parent.insertBefore(tail, s.nextSibling); parent.insertBefore(fa, tail.nextSibling);
      if (caret != null) { if (caret <= k) { var pb = s.previousSibling; setSel(pb && pb.nodeType === 3 ? [pb, Math.min(caret, pb.nodeValue.length)] : [parent, Array.prototype.indexOf.call(parent.childNodes, s)]); } else { var rest = caret - k - 1, n2 = tail.nextSibling, at2 = null;
          var w2 = D.createTreeWalker(parent, NodeFilter.SHOW_TEXT, null); w2.currentNode = tail; var tt = tail; while (tt) { if (tt !== tail && !s.contains(tt)) { if (rest <= tt.nodeValue.length) { at2 = [tt, rest]; break; } rest -= tt.nodeValue.length; } tt = w2.nextNode(); }
          setSel(at2 || [tail, 0]); } }
      if (!tail.nodeValue && tail.parentNode && (tail.nextSibling || caret == null || caret <= k)) { var sl = window.getSelection(); if (!(sl.rangeCount && sl.anchorNode === tail)) tail.parentNode.removeChild(tail); }
    });
  }
  function gone(n) {                   /* a node removed; a caret inside it stays where the node was */
    var p = n.parentNode; if (!p) return;
    var sel = window.getSelection(), held = sel && sel.rangeCount && (sel.anchorNode === n || n.contains(sel.anchorNode));
    var i = Array.prototype.indexOf.call(p.childNodes, n);
    p.removeChild(n);
    if (held) { var prev = p.childNodes[i - 1]; if (prev && prev.nodeType === 3) setSel([prev, prev.nodeValue.length]); else setSel([p, i]); }
  }
  function emptyParas(list) {
    var sel = window.getSelection(), an = sel && sel.rangeCount ? sel.anchorNode : null;
    list.forEach(function (b) { if (b && b.parentNode === ed && b.nodeName === 'P' && !b.childNodes.length && b.attributes.length === 0 && !(an && (an === b || b.contains(an))) && ed.children.length > 1) ed.removeChild(b); });
  }
  function mergeLists(l) {            /* two lists of one kind side by side are one list, as in Word */
    var n = l.previousElementSibling;
    if (n && isList(n) && listKey(n) === listKey(l) && !special(n)) { while (l.firstChild) n.appendChild(l.firstChild); l.parentNode.removeChild(l); l = n; }
    var m = l.nextElementSibling;
    if (m && isList(m) && listKey(m) === listKey(l) && !special(m)) { while (m.firstChild) l.appendChild(m.firstChild); m.parentNode.removeChild(m); }
    return l;
  }
  function tidy(blocks) {             /* the given top level blocks (or all of them) are put in good order */
    var sv = saveSel(), map = new Map(), changed = [], i;
    var loose = false; for (i = 0; i < ed.childNodes.length; i++) { var c0 = ed.childNodes[i]; if (isInline(c0) && !blank(c0)) { loose = true; break; } }
    if (loose) changed = changed.concat(wrapRuns(ed, null, 0));
    var list = blocks ? blocks.filter(function (b, i) { return b && b.parentNode === ed && blocks.indexOf(b) === i; }) : Array.prototype.slice.call(ed.children);
    list.forEach(function (b) {
      if (b.parentNode !== ed || special(b)) return;
      var nm = b.nodeName;
      if (nm === 'P' && b.querySelector(':scope > ul, :scope > ol, :scope > p, :scope > div, :scope > blockquote, :scope > table, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6, :scope > pre')) { changed = changed.concat(hoist(b)); return; }
      if (nm === 'DIV') {
        if (b.querySelector(':scope > ' + 'p, :scope > div, :scope > ul, :scope > ol, :scope > table, :scope > blockquote, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > pre')) {
          var made = wrapRuns(b, b, 0), first = b.firstChild; while (b.firstChild) { var k = b.firstChild; if (k.nodeType === 1 && k.nodeName === 'DIV' && !special(k)) { var q = plainDivToP(k, map); ed.insertBefore(q, b); } else ed.insertBefore(k, b); }
          ed.removeChild(b); map.set(b, first); changed.push(first); return;
        }
        changed.push(plainDivToP(b, map)); return;
      }
      if (indentQuote(b)) { changed.push(unquote(b, map)); return; }
      if (isList(b)) {
        var bad = b.querySelector(':scope > ul, :scope > ol, :scope > :not(li)') || b.querySelector('li > p ~ ul, li > ul ~ p, li > ol ~ p, li > ul ~ div, li > ol ~ div') || b.querySelector('ul > ul, ul > ol, ol > ul, ol > ol') || b.querySelector('li:empty');
        if (bad) { var r0 = fixList(b, map); if (r0) changed.push(r0); }
        if (b.parentNode === ed) { var r1 = mergeLists(b); if (r1 !== b) changed.push(r1); }
      }
    });
    if (ed.childNodes.length && !ed.firstElementChild) wrapRuns(ed, null, 0);
    (blocks ? list : [ed]).forEach(function (b) {
      if (!b || !b.querySelectorAll) return;
      var q = Array.prototype.slice.call(b.querySelectorAll('[data-w-ind]')); if (b.hasAttribute && b.hasAttribute('data-w-ind')) q.push(b);
      q.forEach(function (e) { var v = (e.getAttribute('data-w-ind') || '').split(','), l = parseFloat(v[0]) || 0, t = parseFloat(v[1]) || 0;
        if (l && !e.style.marginLeft) e.style.marginLeft = lenOut(l); if (t && !e.style.textIndent) e.style.textIndent = lenOut(t); e.removeAttribute('data-w-ind'); });
    });
    backSel(sv, map);
    emptyParas(blocks ? list : Array.prototype.slice.call(ed.children));
    junk(blocks ? { querySelectorAll: function (q) { var o = []; list.forEach(function (b) { if (b.parentNode === ed && b.querySelectorAll) o = o.concat(Array.prototype.slice.call(b.querySelectorAll(q))); }); return o; } } : ed);
    return changed.filter(function (n) { return n && n.parentNode === ed; });
  }

  /* ---------- lists, indents and the Tab key, done by Tabula ---------- */
  function convertible(b) { return b.nodeType === 1 && !special(b) && !/^(TABLE|HR|FIGURE)$/.test(b.nodeName) && !b.querySelector('table'); }
  function flatten(list, level, out) {
    Array.prototype.slice.call(list.childNodes).forEach(function (n) {
      if (n.nodeName === 'LI') {
        out.push({ t: 'li', li: n, level: level, level0: level, list: list, kind: list.nodeName });
        Array.prototype.slice.call(n.childNodes).forEach(function (c) { if (isList(c)) flatten(c, level + 1, out); });
      } else if (isList(n)) flatten(n, level + 1, out);
      else if (!(n.nodeType === 3 && blank(n))) { var li = D.createElement('li'); li.appendChild(n); out.push({ t: 'li', li: li, level: level, level0: level, list: list, kind: list.nodeName }); }
    });
  }
  function region(r) {
    var a = topOf(r.startContainer) || (r.startContainer === ed ? ed.children[Math.min(r.startOffset, ed.children.length - 1)] : null);
    var b = topOf(r.endContainer) || (r.endContainer === ed ? ed.children[Math.max(0, Math.min(r.endOffset - 1, ed.children.length - 1))] : null);
    if (!a) a = b; if (!b) b = a; if (!a) return null;
    if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING) { var t = a; a = b; b = t; }
    var blocks = [], n = a;
    if (a.previousElementSibling && isList(a.previousElementSibling)) blocks.push(a.previousElementSibling);
    while (n) { blocks.push(n); if (n === b) break; n = n.nextElementSibling; }
    if (b.nextElementSibling && isList(b.nextElementSibling)) blocks.push(b.nextElementSibling);
    var units = [];
    blocks.forEach(function (bl) { if (isList(bl) && !special(bl)) flatten(bl, 0, units); else units.push({ t: 'blk', node: bl }); });
    return { blocks: blocks, units: units };
  }
  function selected(u, r) {
    var s, e;
    if (u.t === 'li') { s = ownStart(u.li); e = ownEnd(u.li); }
    else { s = [u.node, 0]; e = [u.node, u.node.childNodes.length]; }
    try { if (r.comparePoint(e[0], e[1]) === -1) return false; if (r.comparePoint(s[0], s[1]) === 1) return false; } catch (x) { return false; }
    if (!r.collapsed) { var x2 = D.createRange(); try { x2.setStart(s[0], s[1]); x2.setEnd(r.endContainer, r.endOffset); if (x2.toString() === '' && !x2.cloneContents().querySelector('img,table,br') && (r.endContainer !== s[0] || r.endOffset === s[1])) return 'edge'; } catch (y) {} }
    return true;
  }
  function elOf(u) { return u.t === 'li' ? u.li : u.node; }
  function where(u, pt) { return ownText(elOf(u), pt); }
  function blockToLi(b) {
    var li = D.createElement('li');
    if (b.nodeName === 'P' || (b.nodeName === 'DIV' && !special(b))) {
      if (b.style.textAlign) li.style.textAlign = b.style.textAlign;
      while (b.firstChild) li.appendChild(b.firstChild);
      if (b.parentNode) b.parentNode.removeChild(b);
    } else li.appendChild(b);
    if (!li.childNodes.length) li.appendChild(D.createElement('br'));
    return li;
  }
  function liToBlocks(li, left) {
    var out = [], cur = null;
    Array.prototype.slice.call(li.childNodes).forEach(function (n) {
      if (isList(n)) return;
      if (isInline(n)) { if (!cur) { cur = D.createElement('p'); if (li.style.textAlign) cur.style.textAlign = li.style.textAlign; if (left) cur.style.marginLeft = left + 'px'; out.push(cur); } cur.appendChild(n); }
      else { cur = null; if (n.nodeName === 'DIV' && !special(n)) { var q = D.createElement('p'); copyAttrs(n, q, /^(id|class)$/); while (n.firstChild) q.appendChild(n.firstChild); n = q; } if (left && !special(n)) n.style.marginLeft = (px(n.style.marginLeft) + left) + 'px'; out.push(n); }
    });
    out = out.filter(function (n) { return !(n.nodeName === 'P' && n.childNodes.length && Array.prototype.every.call(n.childNodes, blank)); });
    if (!out.length) { var p = D.createElement('p'); p.appendChild(D.createElement('br')); if (left) p.style.marginLeft = left + 'px'; out.push(p); }
    return out;
  }
  function rebuild(units) {
    var out = [], stack = [];
    units.forEach(function (u) {
      if (u.t === 'blk') { stack = []; out.push(u.node); return; }
      var L = Math.max(0, Math.min(u.level, stack.length));
      while (stack.length > L + 1) stack.pop();
      if (stack.length === L + 1) { var top = stack[L]; if (top.tag !== u.kind || (u.list && u.level === u.level0 && u.list.nodeName === u.kind && top.key !== listKey(u.list) && top.from !== u.list)) stack.pop(); }
      if (stack.length === L) {
        var el = (u.list && u.level === u.level0 && u.list.nodeName === u.kind) ? u.list.cloneNode(false) : D.createElement(u.kind);
        if (L > 0) { el.removeAttribute('data-cd-mll'); el.classList.remove('cd-mll-dec'); if (!el.getAttribute('class')) el.removeAttribute('class'); }
        if (L === 0) out.push(el); else stack[L - 1].lastLi.appendChild(el);
        stack.push({ el: el, tag: u.kind, key: listKey(el), from: (u.list && u.level === u.level0) ? u.list : null, lastLi: null });
      }
      Array.prototype.slice.call(u.li.childNodes).forEach(function (c) { if (isList(c)) u.li.removeChild(c); });
      stack[L].el.appendChild(u.li); stack[L].lastLi = u.li; u.level = L;
    });
    return out;
  }
  function apply(op) {
    var r = range(); if (!r) return false;
    historyCut();
    var before = encode();
    var reg = region(r); if (!reg || !reg.units.length) return false;
    var picks = reg.units.map(function (u) { return selected(u, r); });
    var any = picks.some(function (p) { return p === true; });
    if (!any) picks = picks.map(function (p) { return p === 'edge'; });
    picks = picks.map(function (p) { return p === true; });
    function unitFor(c, o) {
      var li = (c.nodeName === 'UL' || c.nodeName === 'OL') ? (c.childNodes[o] && c.childNodes[o].nodeName === 'LI' ? c.childNodes[o] : liOf(c)) : liOf(c), i;
      for (i = 0; i < reg.units.length; i++) if (reg.units[i].t === 'li' && reg.units[i].li === li) return reg.units[i];
      var b = topOf(c); for (i = 0; i < reg.units.length; i++) if (reg.units[i].t === 'blk' && reg.units[i].node === b) return reg.units[i];
      return null;
    }
    var uA = unitFor(r.startContainer, r.startOffset), uB = unitFor(r.endContainer, r.endOffset);
    var sA = uA ? { u: uA, off: where(uA, [r.startContainer, r.startOffset]) } : null;
    var sB = uB ? { u: uB, off: where(uB, [r.endContainer, r.endOffset]) } : null;
    var chosen = reg.units.filter(function (u, i) { return picks[i]; });
    if (!sA && chosen.length) sA = { u: chosen[0], off: 0 };
    if (!sB && chosen.length) { var lu = chosen[chosen.length - 1]; sB = { u: lu, off: ownText(elOf(lu), lu.t === 'li' ? ownEnd(lu.li) : [lu.node, lu.node.childNodes.length]) }; }
    var sel = reg.units.filter(function (u, i) { return picks[i]; });
    var old = reg.blocks, next = old[old.length - 1].nextSibling;   /* the place is noted before anything moves */
    var did = op(reg.units, sel);
    if (!did) return true;
    var units = did === true ? reg.units : did;
    var out = rebuild(units);
    var frag = D.createDocumentFragment();
    out.forEach(function (n) { frag.appendChild(n); });
    old.forEach(function (b) { if (b.parentNode === ed) ed.removeChild(b); });
    if (next && next.parentNode === ed) ed.insertBefore(frag, next); else ed.appendChild(frag);
    var firsts = []; out.forEach(function (n) { if (n.parentNode === ed) firsts.push(n); });
    var t = tidy(firsts.slice());
    out.forEach(function (n) { if (isList(n) && n.parentNode === ed) restyle(n); });
    function back(s) { if (!s) return null; var el = s.u.t === 'li' ? s.u.li : s.u.node; if (s.u.made) el = s.u.made; if (!el || !inEd(el)) return null; return pointAt(el, s.off); }
    var pa = back(sA), pb = back(sB) || pa;
    if (pa) setSel(pa, pb);
    var live = out.filter(function (n) { return n.parentNode === ed; }).concat(t);
    live.sort(function (x, y) { return x === y ? 0 : (x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1); });
    told(live[0] || null, live[live.length - 1] || null);
    historyCommit(before);
    return true;
  }
  function toList(kind) {
    return apply(function (units, sel) {
      var cand = sel.filter(function (u) { return u.t === 'li' || convertible(u.node); });
      if (!cand.length) return false;
      var off = cand.every(function (u) { return u.t === 'li' && u.kind === kind; });
      var res = [];
      units.forEach(function (u) {
        if (cand.indexOf(u) < 0) { res.push(u); return; }
        if (off) {
          var bl = liToBlocks(u.li, 0);
          bl.forEach(function (b, k) { var nu = { t: 'blk', node: b }; res.push(nu); if (!k) u.made = b; });
          if (u.li.parentNode) u.li.parentNode.removeChild(u.li);
          u.t = 'blk'; u.node = bl[0];
        } else if (u.t === 'li') { if (u.kind !== kind) { u.kind = kind; u.list = null; } res.push(u); }
        else { var left = px(u.node.style && u.node.style.marginLeft); var li = blockToLi(u.node); var nu2 = { t: 'li', li: li, level: Math.max(0, Math.round(left / STEP)), level0: -1, list: null, kind: kind }; u.made = li; res.push(nu2); }
      });
      return res;
    });
  }
  function rootOf(u) { var l = u.list; while (l && l.parentNode && l.parentNode !== ed) l = l.parentNode; return l && l.parentNode === ed ? l : u.list; }
  function shift(dir, drop) {          /* +1 deeper or further in; -1 back out; drop: the bullet is taken off */
    return apply(function (units, sel) {
      if (!sel.length) return false;
      var res = [], moved = null;
      if (dir > 0) {
        var f = null; for (var q = 0; q < units.length; q++) if (sel.indexOf(units[q]) >= 0 && units[q].t === 'li') { f = q; break; }
        if (f !== null && (f === 0 || units[f - 1].t !== 'li' || rootOf(units[f - 1]) !== rootOf(units[f])) && units[f].level === 0) {
          moved = rootOf(units[f]); if (moved) moved.style.marginLeft = lenOut(px(moved.style.marginLeft) + STEP);
        }
      }
      units.forEach(function (u) {
        if (sel.indexOf(u) < 0) { res.push(u); return; }
        if (u.t === 'blk') {
          var b = u.node;
          if (!special(b) && b.nodeName !== 'HR' && b.style) { var m = Math.max(0, px(b.style.marginLeft) + dir * STEP); b.style.marginLeft = lenOut(m); if (!b.getAttribute('style')) b.removeAttribute('style'); }
          res.push(u); return;
        }
        if (dir > 0) {
          if (moved && rootOf(u) === moved) { res.push(u); return; }
          var prev = res.length ? res[res.length - 1] : null;
          if (prev && prev.t === 'li' && prev.level >= u.level) u.level++;
          res.push(u); return;
        }
        if (u.level > 0) { u.level--; res.push(u); return; }
        var r0 = rootOf(u);
        if (!drop && r0 && px(r0.style.marginLeft) > 0) { var m2 = Math.max(0, px(r0.style.marginLeft) - STEP); r0.style.marginLeft = lenOut(m2); res.push(u); return; }
        var bl = liToBlocks(u.li, 0);
        bl.forEach(function (b, k) { res.push({ t: 'blk', node: b }); if (!k) u.made = b; });
        if (u.li.parentNode) u.li.parentNode.removeChild(u.li);
      });
      return res;
    });
  }
  function insertTab(r) {
    if (!r.collapsed) r.deleteContents();
    var sp = D.createElement('span'); sp.className = 'cd-tab'; sp.textContent = '\t';
    var host = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentNode; host = host && host.closest ? host.closest('span.cd-tab') : null;
    if (host && ed.contains(host)) { r.setStartAfter(host); r.collapse(true); }
    r.insertNode(sp);
    var after = D.createTextNode(''); sp.parentNode.insertBefore(after, sp.nextSibling);
    setSel([after, 0]);
    var b = topOf(sp); told(b, b);
  }
  function nextCell(td, back) {
    historyCut(); explicit = true; pendBefore = encode();
    var table = td.closest('table'); if (!table) return;
    var cells = Array.prototype.slice.call(table.querySelectorAll('td,th')).filter(function (c) { return c.closest('table') === table; });
    var i = cells.indexOf(td) + (back ? -1 : 1);
    if (i < 0) return;
    if (i >= cells.length) {
      var tr = td.closest('tr'), nr = tr.cloneNode(true);
      nr.querySelectorAll('td,th').forEach(function (c) { c.innerHTML = '<br>'; });
      tr.parentNode.insertBefore(nr, tr.nextSibling);
      var b = topOf(table); told(b, b);
      cells = Array.prototype.slice.call(table.querySelectorAll('td,th')).filter(function (c) { return c.closest('table') === table; });
    }
    var c = cells[i]; var r = D.createRange(); r.selectNodeContents(c); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }

  /* a paragraph's indents as Word writes them: left, and the first line or a hanging one (15 twips to a CSS pixel) */
  window.cdWordInd = function (el) {
    try {
      if (!el || !el.style) return '';
      var l = px(el.style.marginLeft), t = px(el.style.textIndent), a = '';
      if (l > 0) a += ' w:left="' + Math.round(l * 15) + '"';
      if (t > 0) a += ' w:firstLine="' + Math.round(t * 15) + '"'; else if (t < 0) a += ' w:hanging="' + Math.round(-t * 15) + '"';
      return a ? '<w:ind' + a + '/>' : '';
    } catch (e) { return ''; }
  };

  /* ---------- Tabula's own undo history ---------- */
  var cache = new WeakMap(), dirty = new Set(), hist = [], at = -1, pend = false, pendBefore = null, lastAfter = null, timer = null, structural = false;
  var MAXH = 400;
  var strip = window.cdPageMarksOff || function (root) { root.querySelectorAll('[data-pgpush],[data-pgcut]').forEach(function (e) { if (e.hasAttribute('data-pgpush')) { e.style.marginTop = e.getAttribute('data-pgpush'); e.removeAttribute('data-pgpush'); } if (e.hasAttribute('data-pgcut')) { e.removeAttribute('data-pgcut'); e.style.removeProperty('--pg-h'); e.style.removeProperty('--pg-shape'); } if (!e.getAttribute('style')) e.removeAttribute('style'); }); return root; };
  function ser(b) { var w = D.createElement('div'); w.appendChild(b.cloneNode(true)); (window.cdPageMarksOff || strip)(w); return w.innerHTML; }
  function snapshot() {
    drain();
    var out = [], k = ed.children, i;
    for (i = 0; i < k.length; i++) { var b = k[i], v = dirty.has(b) ? undefined : cache.get(b); if (v === undefined) { v = ser(b); cache.set(b, v); } out.push(v); }
    dirty.clear(); return out;
  }
  function same(a, b) { if (!a || !b || a.length !== b.length) return false; for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; }
  function encode() {
    var r = range(); if (!r) return null;
    function one(c, o) { var b = topOf(c) || (c === ed ? ed.children[Math.min(o, ed.children.length - 1)] : null); if (!b) return null; var idx = Array.prototype.indexOf.call(ed.children, b); var off; try { var x = D.createRange(); x.setStart(b, 0); x.setEnd(c === ed ? b : c, c === ed ? 0 : o); off = x.toString().length; } catch (e) { off = 0; } return [idx, off]; }
    return { s: one(r.startContainer, r.startOffset), e: one(r.endContainer, r.endOffset) };
  }
  function decode(v) {
    if (!v || !v.s) return;
    function pt(p) { var b = ed.children[Math.min(p[0], ed.children.length - 1)]; if (!b) return [ed, 0]; var w = D.createTreeWalker(b, NodeFilter.SHOW_TEXT, null), t, o = p[1], last = null; while ((t = w.nextNode())) { last = t; if (o <= t.nodeValue.length) return [t, o]; o -= t.nodeValue.length; } return last ? [last, last.nodeValue.length] : [b, 0]; }
    var a = pt(v.s), e = v.e ? pt(v.e) : a; setSel(a, e);
    try { var n = a[0].nodeType === 3 ? a[0].parentNode : a[0]; if (n && n.scrollIntoView) { var rr = n.getBoundingClientRect(); if (rr.top < 60 || rr.bottom > window.innerHeight - 40) n.scrollIntoView({ block: 'center' }); } } catch (e2) {}
  }
  function baseline() { cache = new WeakMap(); dirty.clear(); hist = [{ b: snapshot(), sel: encode(), before: null }]; at = 0; pend = false; pendBefore = null; }
  function historyCommit(before) {
    if (composing) return;
    clearTimeout(timer); timer = null;
    if (at < 0) { baseline(); return; }
    var b = snapshot();
    if (same(b, hist[at].b)) { pend = false; pendBefore = null; return; }
    hist.length = at + 1;
    hist.push({ b: b, sel: encode(), before: before || pendBefore || lastAfter });
    if (hist.length > MAXH) hist.splice(0, hist.length - MAXH);
    at = hist.length - 1; pend = false; pendBefore = null; structural = false; explicit = false;
  }
  function historyCut() { if (pend) historyCommit(); }
  function restore(to, sel) {
    var cur = snapshot(), tgt = to.b, p = 0, s = 0;
    while (p < cur.length && p < tgt.length && cur[p] === tgt[p]) p++;
    while (s < cur.length - p && s < tgt.length - p && cur[cur.length - 1 - s] === tgt[tgt.length - 1 - s]) s++;
    var kids = Array.prototype.slice.call(ed.children), anchor = kids[cur.length - s] || null;
    for (var i = p; i < cur.length - s; i++) ed.removeChild(kids[i]);
    var first = null, last = null;
    for (var j = p; j < tgt.length - s; j++) {
      var tp = D.createElement('template'); tp.innerHTML = tgt[j];
      var els = tp.content.children;
      var one = els.length === 1 ? els[0] : null;
      var node = one || tp.content;
      var firstNew = one || tp.content.firstElementChild;
      if (anchor) ed.insertBefore(node, anchor); else ed.appendChild(node);
      if (one) cache.set(one, tgt[j]);
      if (!first) first = firstNew; last = one || last;
    }
    obs.takeRecords(); dirty.clear();
    if (!first) first = anchor || ed.lastElementChild;
    decode(sel);
    told(first, last || first);
    obs.takeRecords(); dirty.clear(); pend = false; pendBefore = null; explicit = false; quietUntil = Date.now() + 1500;
  }
  function undo() { historyCut(); if (at <= 0) return false; var cur = hist[at]; at--; restore(hist[at], cur.before || hist[at].sel); return true; }
  function redo() { historyCut(); if (at >= hist.length - 1) return false; at++; restore(hist[at], hist[at].sel); return true; }
  window.cdTabulaHistory = { undo: undo, redo: redo, size: function () { return { at: at, n: hist.length }; }, commit: function () { historyCommit(); } };

  /* the browser's own records of change: what Tabula's layout does to a block is not a change of the text */
  function pageOnly(m) {
    if (m.type !== 'attributes') return false;
    if (m.attributeName === 'data-pgpush' || m.attributeName === 'data-pgcut') return true;
    if (m.attributeName === 'style') { var t = m.target; if (t.hasAttribute && (t.hasAttribute('data-pgpush') || t.hasAttribute('data-pgcut'))) return true; var o = m.oldValue || '', n = t.getAttribute('style') || ''; if (o.indexOf('--pg-') >= 0 || n.indexOf('--pg-') >= 0) return true; }
    if (m.attributeName === 'class' || m.attributeName === 'spellcheck') { /* marks Tabula sets on blocks for a moment */ var oc = m.oldValue || '', nc = m.target.getAttribute('class') || ''; if (/\bcd-(sel|hl|flash|find|hit)/.test(oc + ' ' + nc)) return true; }
    return false;
  }
  var tidySet = new Set(), tidyQueued = false, quietUntil = 0, gesture = 0, explicit = false;
  function note(ms) {
    var real = false;
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i]; if (pageOnly(m)) continue;
      real = true;
      if (m.target === ed) { if (m.type === 'childList') { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) { dirty.add(n); tidySet.add(n); } }); var ps = m.previousSibling, ns = m.nextSibling; if (ps && ps.nodeType === 1) tidySet.add(ps); if (ns && ns.nodeType === 1) tidySet.add(ns); } continue; }
      var b = topOf(m.target); if (b) { dirty.add(b); tidySet.add(b); }
    }
    return real;
  }
  function drain() { var ms = obs.takeRecords(); if (ms.length) note(ms); }
  var obs = new MutationObserver(function (ms) {
    var real = note(ms);
    if (!real) return;
    var now = Date.now();
    if (!busy && !composing && (explicit || (now >= quietUntil && now - gesture < 4000))) {
      if (!pend) { pend = true; if (!pendBefore) pendBefore = lastAfter; }
      clearTimeout(timer); timer = setTimeout(function () { historyCommit(); }, 900);
    }
    if (!busy && !composing) queueTidy();
    if (!busy) lastAfter = encode();
  });
  function queueTidy() { if (tidyQueued) return; tidyQueued = true; Promise.resolve().then(runTidy); }
  function runTidy() {
    tidyQueued = false; if (composing) return;
    var bl = []; tidySet.forEach(function (b) { if (b && b.parentNode === ed) { bl.push(b); var p = b.previousElementSibling, n = b.nextElementSibling; if (p) bl.push(p); if (n) bl.push(n); } }); tidySet.clear();
    var loose = false; for (var i = 0; i < ed.childNodes.length && !loose; i++) { var c = ed.childNodes[i]; if (isInline(c) && !blank(c)) loose = true; }
    if (!bl.length && !loose) return;
    busy++; var ch; try { ch = tidy(bl); } finally { busy--; }
    var recs = obs.takeRecords(); recs.forEach(function (m) { var b = m.target === ed ? null : topOf(m.target); if (b) dirty.add(b); if (m.target === ed) m.addedNodes.forEach(function (n) { if (n.nodeType === 1) dirty.add(n); }); });
    if (ch && ch.length) { ch.sort(function (x, y) { return x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; }); told(ch[0], ch[ch.length - 1]); }
  }
  obs.observe(ed, { childList: true, subtree: true, characterData: true, attributes: true, attributeOldValue: true });

  /* a document opened, loaded or replaced whole starts a fresh history */
  var IH = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  if (IH && IH.set) {
    try {
      Object.defineProperty(ed, 'innerHTML', { configurable: true, get: function () { return IH.get.call(this); }, set: function (v) { IH.set.call(this, v); fresh(); } });
    } catch (e) {}
  }
  var freshT = null;
  function fresh() {
    clearTimeout(freshT);
    freshT = setTimeout(function () { freshT = null; busy++; try { tidy(null); Array.prototype.forEach.call(ed.children, function (n) { if (isList(n)) restyle(n); }); } catch (e) {} finally { busy--; } obs.takeRecords(); baseline(); try { if (window.cdScheduleLayout) window.cdScheduleLayout(0); } catch (e) {} }, 0);
  }

  /* ---------- the commands Tabula's buttons and galleries send ---------- */
  D.execCommand = function (cmd, ui, val) {
    var c = String(cmd || '');
    var r = range(), mine = !!r || (c === 'undo' || c === 'redo') && (D.activeElement === ed || ed.contains(D.activeElement));
    if (mine) {
      if (c === 'insertUnorderedList') return toList('UL');
      if (c === 'insertOrderedList') return toList('OL');
      if (c === 'indent') return shift(1);
      if (c === 'outdent') return shift(-1);
      if (c === 'undo') { undo(); return true; }
      if (c === 'redo') { redo(); return true; }
      if (!busy && /^(bold|italic|underline|strikeThrough|subscript|superscript|foreColor|hiliteColor|backColor|fontName|fontSize|formatBlock|justify\w*|removeFormat|insertHTML|insertText|delete|forwardDelete|insertParagraph|insertLineBreak|createLink|unlink|insertImage|insertHorizontalRule)$/.test(c)) {
        historyCut(); explicit = true; var before = encode(); var res;
        try { res = NATIVE(c, ui, val); } finally {}
        if (!pendBefore) pendBefore = before;
        return res;
      }
    }
    return NATIVE(c, ui, val);
  };

  /* ---------- keys ---------- */
  D.addEventListener('keydown', function (e) {
    if (!inEd(e.target) || e.defaultPrevented) return;
    if (e.isComposing || e.keyCode === 229) return;
    var k = e.key, mod = e.ctrlKey || e.metaKey;
    if (mod && !e.altKey && (k === 'z' || k === 'Z')) { e.preventDefault(); e.stopImmediatePropagation(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && !e.altKey && !e.shiftKey && (k === 'y' || k === 'Y') && !e.metaKey) { e.preventDefault(); e.stopImmediatePropagation(); redo(); return; }
    var r = range(); if (!r) return;
    if (k === 'Tab' && !mod && !e.altKey) {
      e.preventDefault(); e.stopImmediatePropagation();
      var td = cellOf(r.startContainer); if (td && !liOf(r.startContainer)) { nextCell(td, e.shiftKey); return; }
      var li = liOf(r.startContainer), li2 = liOf(r.endContainer);
      if (li && (atStart(li, r) || (!r.collapsed && (li !== li2 || ownText(li, [r.startContainer, r.startOffset]) === 0)))) { shift(e.shiftKey ? -1 : 1); return; }
      if (e.shiftKey) { if (li) shift(-1); return; }
      historyCut(); explicit = true; pendBefore = encode(); insertTab(r); return;
    }
    if ((k === 'Backspace') && !mod && !e.altKey && !e.shiftKey && r.collapsed) {
      var l = liOf(r.startContainer);
      if (l && atStart(l, r)) { e.preventDefault(); e.stopImmediatePropagation(); shift(-1, true); return; }
    }
    if (k === 'Enter' && !e.shiftKey && !mod && !e.altKey) {
      historyCut(); pendBefore = encode();
      var l2 = liOf(r.startContainer);
      if (l2 && r.collapsed && ownText(l2, ownEnd(l2)) === 0 && !l2.querySelector(':scope > img, :scope > table')) { e.preventDefault(); e.stopImmediatePropagation(); shift(-1, true); return; }
    }
  }, true);
  D.addEventListener('pointerdown', function () { gesture = Date.now(); }, true);
  D.addEventListener('keydown', function () { gesture = Date.now(); }, true);
  ed.addEventListener('beforeinput', function (e) {
    var t = e.inputType;
    explicit = true;
    if (t === 'historyUndo' || t === 'historyRedo') { e.preventDefault(); if (t === 'historyUndo') undo(); else redo(); return; }
    if (!pend && !pendBefore) pendBefore = encode();
    if (/^(insertFromPaste|insertFromDrop|deleteByCut|insertFromYank)$/.test(t)) historyCut(), pendBefore = encode();
  });
  ed.addEventListener('compositionstart', function () { composing = true; });
  ed.addEventListener('compositionend', function () { composing = false; explicit = true; if (!pend) { pend = true; } queueTidy(); clearTimeout(timer); timer = setTimeout(function () { historyCommit(); }, 900); });
  ed.addEventListener('blur', function () { if (pend) historyCommit(); });
  ed.addEventListener('paste', function () { historyCut(); pendBefore = encode(); }, true);

  /* the caret is never lost: if the browser drops it while the document has the keyboard, it goes back to its last place */
  var lastPlace = null, placeT = null;
  D.addEventListener('selectionchange', function () {
    if (placeT) return;
    placeT = setTimeout(function () { placeT = null; var r = range(); if (r) lastPlace = encode(); }, 0);
  });
  function keepCaret() {
    var s = window.getSelection();
    if (D.activeElement === ed && (!s || !s.rangeCount || !inEd(s.anchorNode)) && lastPlace) decode(lastPlace);
  }
  ed.addEventListener('input', function () { setTimeout(keepCaret, 0); });
  ed.addEventListener('keyup', keepCaret);

  /* the first look: what is already on the page is put in order, and the history begins */
  fresh();
  window.__cdBlocks1085 = { tidy: function () { busy++; try { return tidy(null); } finally { busy--; } }, toList: toList, shift: shift, history: window.cdTabulaHistory };
})();
