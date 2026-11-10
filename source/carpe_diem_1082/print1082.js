(function () {
  'use strict';
  if (window.__cdPrint1082) return; window.__cdPrint1082 = 1;
  // Build 1082. A room's document, sent here to be printed (Tabula's Print). In the Mac app a room's frame cannot
  // print, but the app's own window can: its window.print opens the Mac's print panel. So the document is set in a
  // surface of this page that only the printer sees, apart from the app's own styles, and this window prints.
  function macPrint() {
    try { return !!(window.pywebview && window.pywebview.platform === 'cocoa' && window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.browserDelegate); } catch (e) { return false; }
  }
  function textOf(bytes) {
    try { if (typeof bytes === 'string') return bytes; return new TextDecoder('utf-8').decode(bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes); } catch (e) { return ''; }
  }
  var timer = null;
  function clear() {
    try { var h = document.getElementById('cd-print-surface'); if (h) h.remove(); } catch (e) {}
    try { var s = document.getElementById('cd-print-surface-css'); if (s) s.remove(); } catch (e) {}
    try { document.documentElement.classList.remove('cd-print-surface-on'); } catch (e) {}
    if (timer) { clearTimeout(timer); timer = null; }
  }
  function surface(html) {
    try {
      clear();
      var doc = new DOMParser().parseFromString(html, 'text/html');
      if (!doc || !doc.body) return false;
      var css = '';
      [].forEach.call(doc.querySelectorAll('style'), function (s) { css += (s.textContent || '') + '\n'; });
      // the rules for the sheet itself (its size and margins) belong to this page, not to the surface
      var sheet = css.match(/@page\b[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g) || [];
      var host = document.createElement('div'); host.id = 'cd-print-surface'; host.setAttribute('aria-hidden', 'true');
      var root = host.attachShadow({ mode: 'open' });
      var st = document.createElement('style'); st.textContent = css.replace(/:root\b/g, 'html');
      var h = document.createElement('html'), b = document.createElement('body');
      h.setAttribute('lang', doc.documentElement.getAttribute('lang') || 'en');
      b.className = doc.body.className || '';
      b.innerHTML = doc.body.innerHTML;
      [].forEach.call(b.querySelectorAll('script'), function (x) { x.remove(); });
      h.appendChild(b); root.appendChild(st); root.appendChild(h);
      var top = document.createElement('style'); top.id = 'cd-print-surface-css';
      top.textContent = '#cd-print-surface{display:none}' +
        '@media print{' +
        'html.cd-print-surface-on,html.cd-print-surface-on body{background:#fff !important;height:auto !important;min-height:0 !important;overflow:visible !important;margin:0 !important;padding:0 !important}' +
        'html.cd-print-surface-on body:not(.cd-printing) > *:not(#cd-print-surface){display:none !important}' +
        'html.cd-print-surface-on body:not(.cd-printing) > #cd-print-surface{all:initial;display:block !important}' +
        '}' + sheet.join('\n');
      document.head.appendChild(top);
      document.body.appendChild(host);
      document.documentElement.classList.add('cd-print-surface-on');
      window.addEventListener('afterprint', function done() { window.removeEventListener('afterprint', done); setTimeout(clear, 800); });
      // the Mac's print panel may stay open a long while; the surface is unseen on the screen meanwhile
      timer = setTimeout(clear, 20 * 60 * 1000);
      var imgs = [].slice.call(root.querySelectorAll('img')), left = imgs.length, gone = false;
      var go = function () { if (gone) return; gone = true; setTimeout(function () { try { window.print(); } catch (e) { clear(); } }, 120); };
      if (!left) go();
      else {
        imgs.forEach(function (im) {
          var one = function () { if (--left <= 0) go(); };
          if (im.complete) { one(); return; }
          im.addEventListener('load', one); im.addEventListener('error', one);
        });
        setTimeout(go, 2500);
      }
      return true;
    } catch (e) { clear(); return false; }
  }
  window.cdPrintPage = function (name, bytes) {
    var html = textOf(bytes);
    if (!html || html.indexOf('<html') < 0) return false;
    if (macPrint()) return surface(html);
    try {
      var api = window.pywebview && window.pywebview.api;
      if (api && api.print_document && typeof cdPrintViaPython === 'function') {
        // a Mac app whose window cannot print by itself: the page goes to the Mac's browser, which prints it, in colour
        var auto = html.replace(/<\/body>\s*<\/html>\s*$/i, '<script>addEventListener("load",function(){setTimeout(function(){try{print()}catch(e){}},400)})<\/script></body></html>');
        return cdPrintViaPython(String(name || 'Document.html'), 'text/html', new TextEncoder().encode(auto));
      }
    } catch (e) {}
    return false;
  };
  window.cdPrintSurfaceClear = clear;
})();
