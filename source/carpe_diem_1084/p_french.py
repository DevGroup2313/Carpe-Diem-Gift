# -*- coding: utf-8 -*-
"""1084 · the five rooms speak French throughout (see fr_words.py for the words and what was found in English).

Tabula, Abacus and Imago each carry a layer that puts French in place of English wherever it is written, from pass
1052: `if(window.__APP_LANG__!=="fr")return;var FR={...}` and, after it, a walk of the page and a watcher for what is
drawn later. This pass adds the new words to those three dictionaries, and gives Scriba and Fontes a layer of their
own, the same one word for word, so every room is served the same way.

A word already in a dictionary is left as the room has it; only what is missing is added. The layer is put at the end
of the room's page, after everything it names."""
import json
import os
import re

import abacus_status
import fr_words
import rooms

HERE = os.path.dirname(os.path.abspath(__file__))
OPEN = 'if(window.__APP_LANG__!=="fr")return;var FR={'
# the walk and the watcher, taken word for word from the layer Tabula, Abacus and Imago already carry (pass 1052)
MACHINERY = (
    '};function rep(node){var k=node.nodeValue.trim();if(k&&Object.prototype.hasOwnProperty.call(FR,k))'
    '{var nv=node.nodeValue.replace(k,FR[k]);if(nv!==node.nodeValue)node.nodeValue=nv;}}'
    'function fix(node){if(node.nodeType===3){rep(node);return;}if(node.nodeType!==1)return;'
    'var w=document.createTreeWalker(node,NodeFilter.SHOW_TEXT,null,false),t,arr=[];while(t=w.nextNode())arr.push(t);'
    'arr.forEach(rep);["title","placeholder","aria-label"].forEach(function(a){if(node.getAttribute){'
    'var v=node.getAttribute(a);if(v){var k=v.trim();if(Object.prototype.hasOwnProperty.call(FR,k))node.setAttribute(a,FR[k]);}}'
    'var els=node.querySelectorAll?node.querySelectorAll("["+a+"]"):[];Array.prototype.forEach.call(els,function(el){'
    'var v=el.getAttribute(a);var k=v&&v.trim();if(k&&Object.prototype.hasOwnProperty.call(FR,k))el.setAttribute(a,FR[k]);});});}'
    'function all(){fix(document.body);}function start(){all();'
    'var mo=new MutationObserver(function(ms){ms.forEach(function(m){if(m.type==="characterData"){rep(m.target);}'
    'else{Array.prototype.forEach.call(m.addedNodes,function(n){fix(n);});}});});'
    'mo.observe(document.body,{childList:true,subtree:true,characterData:true});'
    'document.addEventListener("click",function(){setTimeout(all,0);},true);}'
    'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();'
    'window.addEventListener("load",all);})();'
)


def _js_dict(words):
    """The words as JavaScript, each pair on its own, in the order they are written here."""
    return ",".join('%s: %s' % (json.dumps(k, ensure_ascii=False), json.dumps(v, ensure_ascii=False))
                    for k, v in words.items())


def _add_to_layer(room, words, label):
    """The words the room's layer has not got, added at the front of its dictionary (a key written twice would be the
    room's own, which is kept)."""
    i = room.find(OPEN)
    if i < 0 or room.count(OPEN) != 1:
        raise SystemExit("%s: its French layer was not found once" % label)
    head = i + len(OPEN)
    end = room.index('};', head)
    have = set(re.findall(r'"((?:[^"\\]|\\.)*)"\s*:', room[head:end]))

    def known(k):
        return json.dumps(k, ensure_ascii=False)[1:-1] in have or k in have
    new = {k: v for k, v in words.items() if not known(k)}
    if not new:
        return room, 0
    return room[:head] + _js_dict(new) + ", " + room[head:], len(new)


def _give_layer(room, words, label):
    """A room with no layer is given one, at the end of its page."""
    if OPEN in room:
        raise SystemExit("%s: it has a French layer already" % label)
    layer = '<script>(function(){' + OPEN + _js_dict(words) + MACHINERY + '</script>\n'
    k = room.rfind("</body>")
    if k < 0:
        raise SystemExit("%s: no </body>" % label)
    return room[:k] + layer + room[k:]


def apply(p, full):
    for var, words in fr_words.ROOMS.items():
        name = var.split("_")[0].title()
        counted = {"n": 0}

        def one(room, words=words, name=name, counted=counted):
            if OPEN in room:
                room, n = _add_to_layer(room, words, name)
                counted["n"] = n
                return room
            counted["n"] = len(words)
            return _give_layer(room, words, name)
        def go(room, one=one, var=var):
            if var == "ABACUS_SRC":
                room = abacus_status.patch(room)   # the bar at the foot, built as the person moves about the sheet
            return one(room)
        a, b = rooms.patch_room(p, var, go)
        print("    %s: %d French words added (%d -> %d bytes)" % (name, counted["n"], a, b))
