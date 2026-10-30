"""1064 · the leaf follows its neighbours.

Seen in 1063: inside the writing rooms the side keys step aside, but the Quiet Screen's leaf stayed, alone. The page has
many rules that hide, fold, seat or move the side keys, each naming them; the leaf was named by none. Now the leaf wears
the moon's rules, rule by rule, copied when the page is read (as The Forge 644 does), so it is drawn, hidden, folded and
seated exactly as its neighbours are."""


def apply(p, full):
    p.before_body_end(JS)


JS = r'''<script id="cd-1064-leaf">
(function () {
  'use strict';
  if (window.__cdLeaf1064) return; window.__cdLeaf1064 = 1;
  function splitSel(t) { var out = [], d = 0, cur = ''; for (var i = 0; i < t.length; i++) { var c = t[i]; if (c === '(' || c === '[') d++; else if (c === ')' || c === ']') d--; if (c === ',' && d === 0) { out.push(cur); cur = ''; } else cur += c; } if (cur.trim()) out.push(cur); return out.map(function (x) { return x.trim(); }); }
  function mirror() {
    var n = 0;
    [].forEach.call(document.styleSheets, function (sh) { var rules; try { rules = sh.cssRules; } catch (e) { return; } if (rules) walk(sh, rules); });
    function walk(parent, rules) {
      var adds = [];
      for (var i = 0; i < rules.length; i++) {
        var r = rules[i];
        if (!r.selectorText) { if (r.cssRules) walk(r, r.cssRules); continue; }
        if (r.selectorText.indexOf('#cd-theme-fab') < 0 || r.__cdLeaf) continue;
        var parts = splitSel(r.selectorText).filter(function (s) { return s.indexOf('#cd-theme-fab') >= 0 && s.indexOf('#cd-quiet-fab') < 0; });
        if (!parts.length || !r.style || !r.style.cssText) continue;
        var sel = parts.map(function (s) {
          var q = s.split('#cd-theme-fab').join('#cd-quiet-fab'), k = q.indexOf('#cd-quiet-fab') + 13, head = q.slice(0, k), tail = q.slice(k);
          return head + tail.replace(/>\s*\*/g, '> .cd-quiet-glyph').replace(/\bspan\b(?![.\[:#\w-])/g, 'span.cd-quiet-glyph');
        }).join(', ');
        adds.push({ at: i + 1, text: sel + '{' + r.style.cssText + '}' });
        r.__cdLeaf = 1;
      }
      for (var k = adds.length - 1; k >= 0; k--) { try { parent.insertRule(adds[k].text, adds[k].at); n++; } catch (e) {} }
    }
    return n;
  }
  function go() { try { window.__cdLeafRules = (window.__cdLeafRules || 0) + mirror(); } catch (e) {} }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  [1500, 6000].forEach(function (ms) { setTimeout(go, ms); });
})();
</script>
'''
