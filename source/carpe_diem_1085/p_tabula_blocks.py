# -*- coding: utf-8 -*-
"""1085 · Tabula: paragraphs and bullet points kept in good order.

The owner: "Tabula still has a lot of formatting issues with the bullets points and paragraphs. I really want that fixed."

Tabula left its lists, indents and new paragraphs to the browser's own editing, and every browser makes the same
faults, measured in Chrome's engine and Safari's: a list made inside a paragraph (which also kept it from filling the
page); text after a list written into that same paragraph; a paragraph after a heading made as a different kind of
block with no space after it; Increase Indent turning a paragraph into an italic grey quotation; Tab moving the caret
out of the document; bullets taken off a list running its items into one paragraph; a nested list hung outside any
item; Backspace at the start of the first item doing nothing.

`tabula_blocks1085.js` does these things itself: bullets and numbering on and off by paragraph, Tab and Shift+Tab to
move an item in and out (or a tab within a line; the next cell in a table), Increase and Decrease Indent as a real
indent, Backspace and Enter on an empty item as in Word, and a check after every change that puts any stray structure
back in order without losing a word. Because the browser's undo cannot follow such changes, Tabula keeps its own
history of the document (Undo and Redo, the keys and the buttons). A Word file made from Tabula now carries tabs and
indents."""
import os

HERE = os.path.dirname(os.path.abspath(__file__))

CSS = """<style id="cd-blocks-1085-css">
  .editor{-moz-tab-size:4;tab-size:4;-moz-tab-size:48px;tab-size:48px}
  .editor .cd-tab{white-space:pre-wrap}
  .editor li > p:first-child{margin-top:0}
  .editor li > p:last-child{margin-bottom:0}
</style>
"""

# a tab in a line is a tab in Word, in both of Tabula's Word writers
TAB_A_OLD = "'<w:t xml:space=\"preserve\">'+esc(txt)+'</w:t></w:r>'"
TAB_A_NEW = "'<w:t xml:space=\"preserve\">'+esc(txt).split('\\t').join('</w:t><w:tab/><w:t xml:space=\"preserve\">')+'</w:t></w:r>'"
TAB_B_OLD = "'<w:t xml:space=\"preserve\">'+esc(t)+'</w:t></w:r>'"
TAB_B_NEW = "'<w:t xml:space=\"preserve\">'+esc(t).split('\\t').join('</w:t><w:tab/><w:t xml:space=\"preserve\">')+'</w:t></w:r>'"
# an indent is an indent in Word: 15 twips to a CSS pixel, so one step of 48 pixels is Word's half inch
IND_A_OLD = "if(jc)pPr+='<w:jc w:val=\"'+jc+'\"/>';"
IND_A_NEW = ("if(el.nodeName!=='LI'&&window.cdWordInd)pPr+=window.cdWordInd(el);" + IND_A_OLD)
IND_B_OLD = "if(al==='center')pPr+='<w:jc w:val=\"center\"/>';"
IND_B_NEW = ("try{ if(!(opts&&opts.numId)&&window.cdWordInd)pPr+=window.cdWordInd(node); }catch(e){} " + IND_B_OLD)
# and a Word file's indents (left, first line, hanging) come into Tabula as indents
IMP_OLD = "if(jc)el.style.textAlign=(jc==='both'?'justify':jc);"
IMP_NEW = (IMP_OLD + "try{var __ind=pPr&&pPr.getElementsByTagNameNS(W,'ind')[0];if(__ind&&!pPr.getElementsByTagNameNS(W,'numPr')[0]){"
           "var __g=function(a){var v=__ind.getAttribute('w:'+a);if(v==null)v=__ind.getAttributeNS(W,a);return v==null?NaN:parseInt(v,10);};"
           "var __l=__g('left');if(isNaN(__l))__l=__g('start');var __f=__g('firstLine'),__h=__g('hanging');"
           "var __ti=__h>0?-Math.round(__h/15):(__f>0?Math.round(__f/15):0);if(__l>0||__ti)el.setAttribute('data-w-ind',(__l>0?Math.round(__l/15):0)+','+__ti);}}catch(e){}")


def tabula(room):
    if 'id="cd-blocks-1085"' in room:
        raise SystemExit("Tabula keeps its blocks in order already")
    for old, new in ((TAB_A_OLD, TAB_A_NEW), (TAB_B_OLD, TAB_B_NEW), (IND_A_OLD, IND_A_NEW), (IND_B_OLD, IND_B_NEW), (IMP_OLD, IMP_NEW)):
        if room.count(old) != 1:
            raise SystemExit("Tabula: expected once, found %d: %s" % (room.count(old), old[:60]))
        room = room.replace(old, new)
    js = open(os.path.join(HERE, "tabula_blocks1085.js"), encoding="utf-8").read()
    k = room.rfind("</body>")
    if k < 0:
        raise SystemExit("Tabula's page has no </body>")
    return room[:k] + CSS + '<script id="cd-blocks-1085">\n' + js + '</script>\n' + room[k:]


def apply(p, full):
    import rooms
    a, b = rooms.patch_room(p, "TABULA_SRC", tabula)
    print("    Tabula: paragraphs, lists, Tab, indents and its own undo (%d -> %d bytes)" % (a, b))
