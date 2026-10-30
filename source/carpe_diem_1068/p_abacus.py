"""1068 · Abacus: a chosen cell is typed over, as in Excel.

Tested as a person uses it, Abacus held its formatting (bold, italic, underline, colours, fill, alignment, size), but
every cell was always open for writing: a single click put the caret where the pointer fell, and typing went in beside
what the cell already held. "Item" and "Name" became "ItemName"; 1234.5 typed over 1.5 became "1234.51.5", which is
text, so the number formats then had nothing to format.

Now, as in Excel: one click (or the Name Box) chooses a cell, and typing replaces what it holds; a double click or F2
writes inside it, keeping what is there; Backspace empties it and writes; the arrow keys move from cell to cell, and
inside a cell being written in they move the caret. Abacus's own source (ABACUS_SRC) is changed, so its floating window
and its own window have it too.

The currency format shows thousands as Excel does ($1,234.50, not $1234.50), and the comma style keeps two decimals."""
import base64, re

JS = r'''<script id="cd-1068-abacus-type">
(function(){
  'use strict';
  var inplace=null;
  function cellOf(t){return t&&t.closest?t.closest('td[data-ref][contenteditable="true"]'):null;}
  function selectAllIn(c){try{var r=document.createRange();r.selectNodeContents(c);var s=getSelection();s.removeAllRanges();s.addRange(r);}catch(e){}}
  function caretEnd(c){try{var r=document.createRange();r.selectNodeContents(c);r.collapse(false);var s=getSelection();s.removeAllRanges();s.addRange(r);}catch(e){}}
  function col(n){var s='';n++;while(n>0){var m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26);}return s;}
  function colNum(s){var n=0;for(var i=0;i<s.length;i++)n=n*26+(s.charCodeAt(i)-64);return n-1;}
  function neighbour(ref,dr,dc){var m=/^([A-Z]+)(\d+)$/.exec(ref);if(!m)return null;var c=colNum(m[1])+dc,r=parseInt(m[2],10)+dr;if(c<0||r<1)return null;return document.querySelector('td[data-ref="'+col(c)+r+'"][contenteditable="true"]');}
  document.addEventListener('mousedown',function(e){var c=cellOf(e.target);if(!c)return;if(e.detail>=2)inplace=c;else if(inplace!==c)inplace=null;},true);
  document.addEventListener('dblclick',function(e){var c=cellOf(e.target);if(c)inplace=c;},true);
  document.addEventListener('focusout',function(e){if(cellOf(e.target)===inplace)inplace=null;},true);
  document.addEventListener('keydown',function(e){
    var c=cellOf(e.target);if(!c||e.isComposing||e.keyCode===229)return;
    if(e.key==='F2'){inplace=c;caretEnd(c);e.preventDefault();return;}
    if(inplace===c)return;
    var k=e.key,mods=e.ctrlKey||e.metaKey||e.altKey;
    if(!mods&&(k==='ArrowUp'||k==='ArrowDown'||k==='ArrowLeft'||k==='ArrowRight')){
      var d={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]}[k],n=neighbour(c.getAttribute('data-ref'),d[0],d[1]);
      e.preventDefault();if(n){c.blur();n.focus();}return;}
    if(!mods&&(k.length===1||k==='Backspace'||k==='Delete')){selectAllIn(c);inplace=c;
      if(k==='Delete'){e.preventDefault();c.textContent='';}}
  },true);
})();
</script>
'''


# currency as Excel shows it ($1,234.50; 1 234,50 € in French), and the comma style with its two decimals
FMT = [("if(f==='currency')return __APPFR?(v.toFixed(2)+' €'):('$'+v.toFixed(2));",
        "if(f==='currency'){var __m=Math.abs(v).toLocaleString(__APPFR?'fr-FR':'en-US',{minimumFractionDigits:2,maximumFractionDigits:2});return (v<0?'-':'')+(__APPFR?(__m+' €'):('$'+__m));}"),
       ("if(f==='comma')return v.toLocaleString(__APPFR?'fr-FR':'en-US',{minimumFractionDigits:0,maximumFractionDigits:2});",
        "if(f==='comma')return v.toLocaleString(__APPFR?'fr-FR':'en-US',{minimumFractionDigits:2,maximumFractionDigits:2});")]


def apply(p, full):
    m = re.search(r'var ABACUS_SRC = "([A-Za-z0-9+/=]+)"', p.s)
    if not m or p.s.count('var ABACUS_SRC = "') != 1:
        raise SystemExit("Abacus's source was not found once")
    src = base64.b64decode(m.group(1)).decode("utf-8")
    k = src.rfind("</body>")
    if k < 0 or "cd-1068-abacus-type" in src:
        raise SystemExit("Abacus: no </body>, or already changed")
    src = src[:k] + JS + src[k:]
    for a, b in FMT:
        if src.count(a) != 1:
            raise SystemExit("Abacus: %r was not found once" % a[:60])
        src = src.replace(a, b)
    p.s = p.s[:m.start(1)] + base64.b64encode(src.encode("utf-8")).decode("ascii") + p.s[m.end(1):]
