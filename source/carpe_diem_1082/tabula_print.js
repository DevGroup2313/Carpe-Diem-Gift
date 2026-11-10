window.cdPrintHtml = function (name) {
  function byId(i) { return document.getElementById(i); }
  function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function cssq(t) { return '"' + String(t).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]+/g, ' ') + '"'; }
  var css = '';
  [].forEach.call(document.querySelectorAll('style'), function (s) { if (s.id !== 'cd-print-over') css += (s.textContent || '') + '\n'; });
  var wrap = document.createElement('div');
  ['docheader', 'toc', 'editor', 'footnotes', 'biblio', 'endnotes', 'docfooter'].forEach(function (id) {
    var n = byId(id); if (!n) return;
    if (id !== 'editor' && n.style.display !== 'block') return;
    wrap.appendChild(n.cloneNode(true));
  });
  var wm = document.querySelector('[data-panel="write"] .paper > .watermark');
  if (wm) wrap.insertBefore(wm.cloneNode(true), wrap.firstChild);
  try { if (window.cdPageMarksOff) window.cdPageMarksOff(wrap); } catch (e) {}
  [].forEach.call(wrap.querySelectorAll('script,style,.hf-tab,.hf-same,.cd-pn-chip,.cd-rs-btn,#pageguides,#cd-fnpages,#cd-pages'), function (e) { e.remove(); });
  [].forEach.call(wrap.querySelectorAll('[contenteditable],[spellcheck],[data-ph]'), function (e) { e.removeAttribute('contenteditable'); e.removeAttribute('spellcheck'); e.removeAttribute('data-ph'); });
  var ed = wrap.querySelector('#editor'); if (ed) ed.classList.remove('show-marks');
  var setup = { size: '8.5in 11in', margin: '1in' };
  try { if (window.cdPageSetup) setup = window.cdPageSetup() || setup; } catch (e) {}
  var hEl = wrap.querySelector('#docheader'), fEl = wrap.querySelector('#docfooter');
  var HDR = hEl ? (hEl.textContent || '').replace(/\s+/g, ' ').trim() : '', FTR = fEl ? (fEl.textContent || '').replace(/\s+/g, ' ').trim() : '';
  var PN = (window.__cdPN && window.__cdPN.on) ? window.__cdPN : null;
  var boxes = '', first = '', m = /Chrome\/(\d+)/.exec(navigator.userAgent || ''), marginBoxes = !!(m && +m[1] >= 131);
  if (marginBoxes && (HDR || FTR || PN)) {
    var F = 'font:10pt "Times New Roman",Times,serif;color:#333;', num = '';
    if (PN) {
      var f = PN.fmt || 'plain';
      num = f === 'romanl' ? 'counter(page,lower-roman)' : f === 'romanu' ? 'counter(page,upper-roman)' : f === 'pageOf' ? '"Page " counter(page) " of " counter(pages)' : f === 'dash' ? '"- " counter(page) " -"' : f === 'page1' ? '"Page " counter(page)' : 'counter(page)';
    }
    var al = PN ? (PN.align === 'left' ? 'left' : PN.align === 'right' ? 'right' : 'center') : '';
    if (HDR) { boxes += '@top-center{content:' + cssq(HDR) + ';' + F + '}'; if (hEl) hEl.remove(); }
    if (FTR && PN && al === 'center') boxes += '@bottom-center{content:' + cssq(FTR) + ' "\\A " ' + num + ';white-space:pre;text-align:center;' + F + '}';
    else {
      if (FTR) boxes += '@bottom-center{content:' + cssq(FTR) + ';' + F + '}';
      if (PN) boxes += '@bottom-' + al + '{content:' + num + ';' + F + '}';
    }
    if (FTR && fEl) fEl.remove();
    if (PN && PN.skipFirst) first = '@page :first{@bottom-' + al + '{content:' + (FTR && al === 'center' ? cssq(FTR) : 'none') + ';' + F + '}}';
  }
  var over = [
    '@page{size:' + setup.size + ';margin:' + setup.margin + ';' + boxes + '}', first,
    'html,body{background:#fff !important;color:#000;margin:0 !important;padding:0 !important;height:auto !important;min-height:0 !important;max-height:none !important;overflow:visible !important;display:block !important;width:auto !important;position:static !important;font-size:14px}',
    '*,*::before,*::after{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important}',
    '.cd-print-paper{position:relative;background:#fff;margin:0;padding:0;box-shadow:none;max-width:none;min-height:0}',
    '.cd-print-paper .editor{min-height:0 !important;outline:0 !important;caret-color:transparent}',
    '.cd-print-paper .editor:empty:before,.cd-print-paper [data-ph]:empty:before{content:none !important}',
    '.cd-print-paper #docheader:empty,.cd-print-paper #docfooter:empty{display:none !important}',
    '.cd-print-paper #docheader,.cd-print-paper #docfooter{border-style:solid !important;border-color:#bbb !important}',
    '.cd-print-paper #footnotes.cd-fn-atfoot{position:static !important;visibility:visible !important;height:auto !important;overflow:visible !important;margin-top:24px !important;padding-top:12px !important;border-top:1px solid #999 !important}',
    '.cd-print-paper .editor .pagebreak{break-after:page;page-break-after:always;border:0 !important;margin:0 !important;height:0 !important}',
    '.cd-print-paper .editor br.cd-pgbr{display:block;break-after:page;page-break-after:always}',
    '.cd-print-paper .editor .comment{background:transparent !important;border-bottom:0 !important}',
    '.cd-print-paper .editor [data-pgcut]::before{content:none !important;display:none !important}',
    '.cd-print-paper .editor h1,.cd-print-paper .editor h2,.cd-print-paper .editor h3,.cd-print-paper .editor h4,.cd-print-paper .editor h5{break-after:avoid;page-break-after:avoid}',
    '.cd-print-paper .editor img,.cd-print-paper .editor tr,.cd-print-paper .cd-signblock{break-inside:avoid;page-break-inside:avoid}',
    '.cd-print-paper .watermark{position:fixed !important;top:0 !important;left:0 !important;right:0 !important;bottom:0 !important;display:flex !important}',
    '.cd-print-paper .watermark img{display:block !important}'
  ].join('\n');
  var lang = document.documentElement.getAttribute('lang') || 'en';
  return '<!doctype html><html lang="' + esc(lang) + '"><head><meta charset="utf-8"><title>' + esc(name || 'Untitled') + '</title><style>' + css.replace(/<\/style/gi, '<\\/style') +
    '</style><style id="cd-print-over">' + over + '</style></head><body class="cd-print-doc"><div class="cd-print-paper">' + wrap.innerHTML + '</div></body></html>';
};

window.cdPrintFrame = function (html, fallback) {
  function no() { try { if (fallback) fallback(); } catch (e) {} }
  try {
    var old = document.getElementById('cd-print-frame'); if (old) old.remove();
    var f = document.createElement('iframe'), started = false;
    f.id = 'cd-print-frame'; f.setAttribute('aria-hidden', 'true'); f.setAttribute('tabindex', '-1'); f.title = 'Print';
    f.style.cssText = 'position:fixed;left:-10000px;top:0;width:816px;height:600px;border:0;opacity:0;pointer-events:none';
    var go = function () {
      if (started) return; started = true;
      setTimeout(function () {
        try {
          var w = f.contentWindow;
          var away = function () { setTimeout(function () { try { f.remove(); } catch (e) {} }, 1500); };
          try { w.addEventListener('afterprint', away); } catch (e) {}
          setTimeout(function () { try { f.remove(); } catch (e) {} }, 15 * 60 * 1000);
          try { w.focus(); } catch (e) {}
          w.print();
        } catch (e) { try { f.remove(); } catch (x) {} no(); }
      }, 200);
    };
    f.addEventListener('load', go);
    f.srcdoc = html;
    document.body.appendChild(f);
    setTimeout(go, 5000);
  } catch (e) { no(); }
};

window.cdPrintDocument = function () {
  var name = 'Untitled';
  try { if (window.cdDocName) name = window.cdDocName(); } catch (e) {}
  function plain() { try { window.print(); } catch (e) {} }
  var html = '';
  try { html = window.cdPrintHtml(name); } catch (e) { html = ''; }
  if (!html) { plain(); return; }
  function own() { window.cdPrintFrame(html, plain); }
  try {
    if (window.parent !== window && window.cdPrintViaHost) { window.cdPrintViaHost(name + '.html', 'text/html', html, own); return; }
  } catch (e) {}
  own();
};
