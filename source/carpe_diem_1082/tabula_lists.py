"""Tabula: a list that reaches the end of a page is split there, as a paragraph is.

The owner: "bullet points will choose to go to the next page in bulk; leaving ample space before the page ends and
filling out all the bullet points on the next page ... prioritising filling the page over page style."

Tabula lays its pages out itself: a block that crosses a page's end is either cut between two of its lines (a
paragraph) or moved whole to the next page. A list was never cut, so a list that did not fit moved whole and left the
rest of the page empty. Now a list is filled item by item: the first item that does not fit starts the next page (its
own top margin carries it there, so its bullet or number goes with it), and an item of several lines is cut between
two lines, with no minimum kept on either side. A list that carries footnotes, pictures or tables is laid out as
before. What a file made from the document holds (Word, HTML, print) never carries the page marks."""

CSS_OLD = "  .editor:not(.linenums) > [data-pgcut]::before{content:\"\";float:left;width:100%;height:var(--pg-h,0px);shape-outside:var(--pg-shape,none);pointer-events:none;-webkit-user-select:none;user-select:none}\n"
CSS_NEW = CSS_OLD + "  .editor:not(.linenums) li[data-pgcut]::before{content:\"\";float:left;width:100%;height:var(--pg-h,0px);shape-outside:var(--pg-shape,none);pointer-events:none;-webkit-user-select:none;user-select:none}\n"

CLEAR_OLD = "function tabCutClear(b){if(b.__pgCut||(b.hasAttribute&&b.hasAttribute('data-pgcut'))){try{b.removeAttribute('data-pgcut');b.style.removeProperty('--pg-h');b.style.removeProperty('--pg-shape');if(!b.getAttribute('style'))b.removeAttribute('style');}catch(e){}b.__pgCut=null;}b.__pgSeps=null;}"
CLEAR_NEW = """function tabListClear(b){try{if(!b.firstElementChild)return;var q=b.querySelectorAll('li[data-pgpush],li[data-pgcut]'),i,e;for(i=0;i<q.length;i++){e=q[i];
    if(e.hasAttribute('data-pgpush')){e.style.marginTop=e.getAttribute('data-pgpush');e.removeAttribute('data-pgpush');e.__pgPush=null;}
    if(e.hasAttribute('data-pgcut')){e.removeAttribute('data-pgcut');e.style.removeProperty('--pg-h');e.style.removeProperty('--pg-shape');e.__pgCut=null;}
    if(!e.getAttribute('style'))e.removeAttribute('style');}}catch(x){}}
  function tabCutClear(b){if(b.__pgCut||(b.hasAttribute&&b.hasAttribute('data-pgcut'))){try{b.removeAttribute('data-pgcut');b.style.removeProperty('--pg-h');b.style.removeProperty('--pg-shape');if(!b.getAttribute('style'))b.removeAttribute('style');}catch(e){}b.__pgCut=null;}b.__pgSeps=null;tabListClear(b);}"""

CAN_OLD = """function tabCanCut(b){try{if(editor.classList.contains('linenums')||(editor.style.columnCount&&editor.style.columnCount!=='1'))return false;var t=b.tagName;if(t!=='P'&&t!=='DIV'&&t!=='BLOCKQUOTE')return false;if(b.classList.contains('pagebreak'))return false;
    if(b.querySelector('.dropcap,img,table,figure,svg,canvas,iframe,video,ul,ol,h1,h2,h3,h4,h5,h6,.pagebreak,[style*="float"]'))return false;return true;}catch(e){return false;}}"""
CAN_NEW = """function tabCanCut(b){try{if(editor.classList.contains('linenums')||(editor.style.columnCount&&editor.style.columnCount!=='1'))return false;var t=b.tagName;if(t==='UL'||t==='OL')return !b.querySelector('.dropcap,img,table,figure,svg,canvas,iframe,video,h1,h2,h3,h4,h5,h6,.pagebreak,[style*="float"]');if(t!=='P'&&t!=='DIV'&&t!=='BLOCKQUOTE')return false;if(b.classList.contains('pagebreak'))return false;
    if(b.querySelector('.dropcap,img,table,figure,svg,canvas,iframe,video,ul,ol,h1,h2,h3,h4,h5,h6,.pagebreak,[style*="float"]'))return false;return true;}catch(e){return false;}}

  function tabLiOwn(li){var er=editor.getBoundingClientRect(),k=tabK(),ct=(editor.clientTop||0),arr=[],out=[],i,n,p,own,rg=document.createRange(),w=document.createTreeWalker(li,NodeFilter.SHOW_TEXT,null);
    while((n=w.nextNode())){if(!n.nodeValue)continue;own=true;p=n.parentNode;while(p&&p!==li){if(p.tagName==='LI'){own=false;break;}p=p.parentNode;}if(!own)continue;
      rg.selectNodeContents(n);var rs=rg.getClientRects();for(i=0;i<rs.length;i++){var r=rs[i];if(r.height>=2&&r.width>=0.5)arr.push({t:(r.top-er.top)/k-ct,b:(r.bottom-er.top)/k-ct,h:r.height/k});}}
    arr.sort(function(x,y){return x.t-y.t;});
    for(i=0;i<arr.length;i++){var a=arr[i],l=out[out.length-1];if(l&&a.t<l.b-3){if(a.h>l.h+0.5){l.t=a.t;l.h=a.h;}l.b=Math.max(l.b,a.b);}else out.push({t:a.t,b:a.b,h:a.h});}
    return out;}

  function tabCutList(b,pageStart,INNER,GAP,TOP,NB){
    if(NB&&NB.list)return null;
    var items=b.getElementsByTagName('li'),seps=[],ps=pageStart,nh=NB?NB.nh:0,i,turns=0,lh=NaN;
    try{lh=parseFloat(getComputedStyle(b).lineHeight);}catch(e){}
    for(i=0;i<items.length&&turns<6000;i++){turns++;
      var li=items[i],L=tabLiOwn(li),n=L.length;if(!n)continue;
      var hl=isFinite(lh)?Math.max(0,(lh-L[n-1].h)/2):0,limit=ps+INNER-nh;
      if(L[n-1].b+hl<=limit)continue;
      var k=0;while(k<n&&L[k].b+hl<=limit)k++;
      var target=ps+INNER+GAP+TOP;
      if(k>=1&&!li.querySelector('li')){var c=tabCut(li,tabTop(li),ps,INNER,GAP,TOP,{nh:nh,list:null},true);
        if(c){seps.push.apply(seps,c.seps);ps=c.pageStart;nh=0;continue;}}
      if(tabTop(li)<=ps+1){var over=Math.max(1,Math.ceil((L[n-1].b-ps)/INNER));ps=ps+over*INNER;nh=0;continue;}
      li.__pgPush=(li.style.marginTop||'');try{li.setAttribute('data-pgpush',li.__pgPush);}catch(e){}
      var cm=0;try{cm=parseFloat(getComputedStyle(li).marginTop)||0;}catch(e){}
      tabLand(li,cm,target);seps.push(target-TOP-(GAP/2));ps=target;nh=0;i--;}
    return {pageStart:ps,seps:seps,pl:[],nh:nh};}"""

CUT_OLD = """  function tabCut(b,bTop,pageStart,INNER,GAP,TOP,NB){
    var L=tabLines(b),n=L.length;if(n<4)return null;
"""
CUT_NEW = """  function tabCut(b,bTop,pageStart,INNER,GAP,TOP,NB,LOOSE){
    if(!LOOSE&&(b.tagName==='UL'||b.tagName==='OL'))return tabCutList(b,pageStart,INNER,GAP,TOP,NB);
    var L=tabLines(b),n=L.length;if(n<(LOOSE?2:4))return null;
"""
WIDOW_OLD = "      if(n-k<2)k=n-2;\n"
WIDOW_NEW = "      if(!LOOSE&&n-k<2)k=n-2;\n"
ORPHAN_OLD = "      if(k-k0<2){if(bands.length)k=k0+1;else if(h0<=INNER)return null;else k=0;}\n"
ORPHAN_NEW = "      if(k-k0<(LOOSE?1:2)){if(bands.length)k=k0+1;else if(h0<=INNER)return null;else k=0;}\n"

BODY_OLD = "function docBody(){var wrap=document.createElement('div');['docheader','toc','editor','footnotes','biblio','endnotes','docfooter'].forEach(function(id){var n=$(id);if(n&&(id==='editor'||n.style.display==='block'))wrap.appendChild(n.cloneNode(true));});return wrap.innerHTML;}"
BODY_NEW = """function cdPageMarksOff(root){try{var q=root.querySelectorAll('[data-pgpush],[data-pgcut]'),i,e;for(i=0;i<q.length;i++){e=q[i];
  if(e.hasAttribute('data-pgpush')){e.style.marginTop=e.getAttribute('data-pgpush');e.removeAttribute('data-pgpush');}
  if(e.hasAttribute('data-pgcut')){e.removeAttribute('data-pgcut');e.style.removeProperty('--pg-h');e.style.removeProperty('--pg-shape');}
  if(!e.getAttribute('style'))e.removeAttribute('style');}}catch(x){}return root;}
window.cdPageMarksOff=cdPageMarksOff;
function docBody(){var wrap=document.createElement('div');['docheader','toc','editor','footnotes','biblio','endnotes','docfooter'].forEach(function(id){var n=$(id);if(n&&(id==='editor'||n.style.display==='block'))wrap.appendChild(n.cloneNode(true));});cdPageMarksOff(wrap);return wrap.innerHTML;}"""

PAIRS = [(CSS_OLD, CSS_NEW), (CLEAR_OLD, CLEAR_NEW), (CAN_OLD, CAN_NEW), (CUT_OLD, CUT_NEW), (WIDOW_OLD, WIDOW_NEW),
         (ORPHAN_OLD, ORPHAN_NEW), (BODY_OLD, BODY_NEW)]


def patch(room):
    for old, new in PAIRS:
        if room.count(old) != 1:
            raise SystemExit("Tabula lists: found %d times: %r" % (room.count(old), old[:70]))
        room = room.replace(old, new)
    return room


if __name__ == "__main__":
    import sys
    open(sys.argv[2], "w", encoding="utf-8").write(patch(open(sys.argv[1], encoding="utf-8").read()))
    print("patched", sys.argv[2])
