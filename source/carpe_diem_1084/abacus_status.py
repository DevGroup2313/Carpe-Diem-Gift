# -*- coding: utf-8 -*-
"""1084 · Abacus's bar at the foot speaks French: Ready, Cell, Range, Count, Sum, Average.

These are not written in the page but built as the person moves about the sheet ("Count 11", "Sum 170.17"), so the
layer that puts French in place of English cannot reach them: by the time one is read it has a number in it. They
are given their words here instead, from the same `window.__APP_LANG__` the layer reads."""

PAIRS = [
    # the words, once, beside the bar that uses them
    ("""  var st=document.createElement('div');st.id='abStatus';
  var left=document.createElement('span');left.id='abStatReady';left.textContent='Ready';""",
     """  var st=document.createElement('div');st.id='abStatus';
  var __fr=(window.__APP_LANG__==='fr');
  var W={ready:__fr?'Pr\\u00eat':'Ready',cell:__fr?'Cellule':'Cell',range:__fr?'Plage':'Range',
          count:__fr?'Nombre':'Count',sum:__fr?'Somme':'Sum',avg:__fr?'Moyenne':'Average'};
  var left=document.createElement('span');left.id='abStatReady';left.textContent=W.ready;"""),
    ("""      left.textContent=bounds?('Ready    Range '+bounds.a+':'+bounds.b):(ref?('Ready    Cell '+ref):'Ready');""",
     """      left.textContent=bounds?(W.ready+'    '+W.range+' '+bounds.a+':'+bounds.b):(ref?(W.ready+'    '+W.cell+' '+ref):W.ready);"""),
    ("""      cnt.textContent='Count '+ns.length;""",
     """      cnt.textContent=W.count+' '+ns.length;"""),
    ("""        sum.textContent='Sum '+(Math.round(s*100)/100);
        avg.textContent='Average '+(Math.round((s/ns.length)*100)/100);""",
     """        sum.textContent=W.sum+' '+(Math.round(s*100)/100);
        avg.textContent=W.avg+' '+(Math.round((s/ns.length)*100)/100);"""),
]


def patch(room):
    for old, new in PAIRS:
        if room.count(old) != 1:
            raise SystemExit("Abacus's bar: found %d times: %r" % (room.count(old), old[:70]))
        room = room.replace(old, new)
    return room
