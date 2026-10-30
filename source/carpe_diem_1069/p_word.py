"""1069 · Tabula opens Word documents whole, by either key.

Tested with a chapter made in Word (a title, headings, bold and italic, a bulleted list, a table, two footnotes in the
Chicago manner), three things went wrong:

* The Word key on the Home ribbon ("Open .docx") read the file with Tabula's older reader, which leaves out tables,
  images and footnotes (its own question said so), and asked to replace the page even when it was empty. File, Open
  used the fuller reader. Both keys now use the fuller one; the question is asked only when the page holds writing.
* A footnote's number came in wrapped in a second superscript (Word marks the reference's run as superscript as well),
  so it sat smaller and higher than a footnote number should, and pushed its line apart. The reference is now itself
  the superscript.
* A list whose bullets or numbers come from its paragraph style (Word's List Bullet and List Number styles, and any
  style built on one) came in as plain paragraphs: only numbering written on the paragraph itself was read. The style's
  numbering is now read too, through the styles it is based on.

Save .docx offers the document's own name ("chapter.docx"), not always "carpe_diem.docx".

Tabula's own source (TABULA_SRC) is changed, so its floating window and its own window have it too."""
import base64, re

FIXES = [
    # Save .docx offers the document's own name, as Word's Save As does
    ("var name=(prompt('Name for the file','carpe_diem.docx')||'carpe_diem.docx');",
     "var __t=(((document.getElementById('docTitle')||{}).value)||'').trim().replace(/[\\\\/:*?\"<>|]+/g,' ').trim()||'carpe_diem';"
     "var name=(prompt('Name for the file',__t+'.docx')||(__t+'.docx'));"),
    # the footnote reference is not wrapped in the run's own superscript
    ("if(va==='superscript'){var s1=document.createElement('sup');s1.appendChild(node);node=s1;}",
     "if(va==='superscript'&&!(node&&(node.nodeType===1||node.nodeType===11)&&((node.classList&&node.classList.contains('fn-ref'))"
     "||(node.querySelector&&node.querySelector('.fn-ref'))))){var s1=document.createElement('sup');s1.appendChild(node);node=s1;}"),
]

NUM_OLD = re.compile(r"var np=pPr&&pPr\.getElementsByTagNameNS\(W,'numPr'\)\[0\];\s*if\(!np\)return null;")
NUM_NEW = ("var np=pPr&&pPr.getElementsByTagNameNS(W,'numPr')[0];\n       if(!np)return cdStyleNum(pPr?V(pPr.getElementsByTagNameNS(W,'pStyle')[0]):'');")
STYLE_NUM = (
    # numbering that comes from a paragraph style (and the styles it is based on), read once from styles.xml
    "var __cdSN=null;function cdStyleNum(sid){if(!sid)return null;"
    "if(!__cdSN){__cdSN={};try{if(files['word/styles.xml']){var sd=X(files['word/styles.xml']),by={};"
    "Array.prototype.forEach.call(sd.getElementsByTagNameNS(W,'style'),function(st){var id=st.getAttribute('w:styleId')||st.getAttributeNS(W,'styleId');if(id)by[id]=st;});"
    "var res=function(id,depth){if(!id||depth>8||!by[id])return null;var st=by[id],pp=null;"
    "Array.prototype.forEach.call(st.childNodes,function(c){if(c.localName==='pPr')pp=c;});"
    "var np=pp&&pp.getElementsByTagNameNS(W,'numPr')[0];"
    "if(np){var nid=V(np.getElementsByTagNameNS(W,'numId')[0]),lvl=parseInt(V(np.getElementsByTagNameNS(W,'ilvl')[0])||'0',10)||0;"
    "if(!nid||nid==='0')return null;var fmt=(numFmt[nid]||{})[String(lvl)]||'bullet';return {tag:fmt==='bullet'?'ul':'ol',lvl:lvl};}"
    "var bo=null;Array.prototype.forEach.call(st.childNodes,function(c){if(c.localName==='basedOn')bo=c;});return bo?res(V(bo),depth+1):null;};"
    "Object.keys(by).forEach(function(id){var r=res(id,0);if(r)__cdSN[id]=r;});}}catch(e){}}"
    "if(__cdSN[sid])return __cdSN[sid];"
    "var m=/^List(Bullet|Number)(\\d?)$/.exec(sid);if(m)return {tag:m[1]==='Bullet'?'ul':'ol',lvl:m[2]?Math.max(0,parseInt(m[2],10)-1):0};"
    "return null;}\n      ")

KEY_OLD_START = "   importDocx(f).then(function(html){\n    inp.remove();\n    if(!confirm('Open '+f.name+'? It will replace what is written here now."
KEY_OLD_END = "    alert('That document could not be read: '+(err&&err.message?err.message:'unknown reason'));\n   });\n"
KEY_NEW = ("   inp.remove();\n"
           "   var __ed=editor(),__has=((__ed&&__ed.innerText)||'').trim().length>0;\n"
           "   if(__has&&!confirm('Open '+f.name+'? It takes the place of what is written here now.'))return;\n"
           "   window.cdOpenDocx(f).catch(function(err){alert('That document could not be read: '+(err&&err.message?err.message:'unknown reason'));});\n")


def apply(p, full):
    m = re.search(r'var TABULA_SRC = "([A-Za-z0-9+/=]+)"', p.s)
    if not m or p.s.count('var TABULA_SRC = "') != 1:
        raise SystemExit("Tabula's source was not found once")
    src = base64.b64decode(m.group(1)).decode("utf-8")
    for old, new in FIXES:
        if src.count(old) != 1:
            raise SystemExit("Tabula: %r was not found once" % old[:60])
        src = src.replace(old, new)
    hits = NUM_OLD.findall(src)
    if len(hits) != 1:
        raise SystemExit("Tabula: the list reader was not found once (%d)" % len(hits))
    k = src.index("function numOf(pEl){")
    src = src[:k] + STYLE_NUM + src[k:]
    src = NUM_OLD.sub(lambda _m: NUM_NEW, src, count=1)
    a = src.find(KEY_OLD_START)
    b = src.find(KEY_OLD_END, a)
    if a < 0 or b < 0 or src.count(KEY_OLD_START) != 1:
        raise SystemExit("Tabula: the Word key's reader was not found once")
    src = src[:a] + KEY_NEW + src[b + len(KEY_OLD_END):]
    p.s = p.s[:m.start(1)] + base64.b64encode(src.encode("utf-8")).decode("ascii") + p.s[m.end(1):]
