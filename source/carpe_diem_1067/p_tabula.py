"""1067 · Tabula's ribbon: the size and the two colour keys do what they say.

The owner: Tabula's ribbon (text colours, formatting) is unreliable. Tested as a person uses it (a word chosen with the
mouse, then a key of the ribbon), most of the ribbon held, and three things did not:

* Size: choosing 18 made the text 48 px, the largest size there is. The size key asks the browser for its largest size
  and then turns the browser's old <font size="7"> into the size chosen; but the browser now writes
  <span style="font-size: xxx-large"> instead, which was never turned. Now either form, inside the selection only (text
  sized earlier elsewhere is left alone), becomes the size chosen, in points. With nothing selected, the size waits at
  the caret for what is typed next, as in Word.
* The text colour key (A) and the highlight key (H): the whole key was the system's colour chooser, so a press opened
  a chooser (on a Mac the window can draw none at all) and took the selection away from the text, instead of colouring
  it. Now, as in Word, a press colours the selection with the colour shown under the letter, the last one chosen from
  the palette; the arrow beside it opens the palette, and the palette's "More colours…" opens the system's chooser.

Tabula's own source (TABULA_SRC) is changed, so the main window, the floating window and Tabula's own window all have
it."""
import base64, re

OLD_SIZE = ("$('sizeSel').addEventListener('change',function(){var pt=this.value;run('fontSize','7');"
            "editor.querySelectorAll('font[size=\"7\"]').forEach(function(f){var sp=document.createElement('span');"
            "sp.style.fontSize=pt+'pt';while(f.firstChild)sp.appendChild(f.firstChild);f.parentNode.replaceChild(sp,f);});});")

NEW_SIZE = (
    "$('sizeSel').addEventListener('change',function(){var pt=this.value;"
    # with nothing selected: an empty span of that size at the caret, with a zero-width space to hold the caret
    "var s0=window.getSelection();if(s0&&s0.rangeCount&&s0.isCollapsed&&editor.contains(s0.anchorNode)){editor.focus();"
    "var r0=s0.getRangeAt(0),sp0=document.createElement('span');sp0.style.fontSize=pt+'pt';var z=document.createTextNode('\\u200b');"
    "sp0.appendChild(z);r0.insertNode(sp0);var r1=document.createRange();r1.setStart(z,1);r1.collapse(true);s0.removeAllRanges();s0.addRange(r1);"
    "try{editor.dispatchEvent(new Event('input',{bubbles:true}));}catch(e){}return;}"
    "run('fontSize','7');var s=window.getSelection(),rg=s&&s.rangeCount?s.getRangeAt(0):null;"
    "editor.querySelectorAll('font[size=\"7\"],span[style*=\"xxx-large\"]').forEach(function(f){"
    "if(rg&&!rg.intersectsNode(f))return;"
    "if(f.tagName==='FONT'){var sp=document.createElement('span');sp.style.fontSize=pt+'pt';while(f.firstChild)sp.appendChild(f.firstChild);f.parentNode.replaceChild(sp,f);}"
    "else{f.style.fontSize=pt+'pt';}});"
    "try{editor.dispatchEvent(new Event('input',{bubbles:true}));}catch(e){}});")

OLD_BIND = "bindColor('foreColor','foreBar','foreColor');bindColor('hiliteColor','hiliteBar','hiliteColor');"

NEW_BIND = OLD_BIND + (
    # the A and H keys colour the selection with the colour under the letter; a click made by "More colours…" still
    # reaches the chooser
    "['foreColor','hiliteColor'].forEach(function(id){var inp=$(id),bar=$(id==='foreColor'?'foreBar':'hiliteBar');if(!inp||!bar)return;"
    "inp.addEventListener('click',function(e){if(!e.isTrusted)return;e.preventDefault();"
    "var c=getComputedStyle(bar).backgroundColor||inp.value;"
    "if(window.__cdColorApply)window.__cdColorApply(id,c);else run(id,c);},true);"
    "inp.title=id==='foreColor'?'Font colour: colours the selection':'Highlight: marks the selection';});")


def apply(p, full):
    m = re.search(r'var TABULA_SRC = "([A-Za-z0-9+/=]+)"', p.s)
    if not m or p.s.count('var TABULA_SRC = "') != 1:
        raise SystemExit("Tabula's source was not found once")
    src = base64.b64decode(m.group(1)).decode("utf-8")
    for old, new in ((OLD_SIZE, NEW_SIZE), (OLD_BIND, NEW_BIND)):
        if src.count(old) != 1:
            raise SystemExit("Tabula: %r was not found once (%d)" % (old[:60], src.count(old)))
        src = src.replace(old, new)
    enc = base64.b64encode(src.encode("utf-8")).decode("ascii")
    p.s = p.s[:m.start(1)] + enc + p.s[m.end(1):]
