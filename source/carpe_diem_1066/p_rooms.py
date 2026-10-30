"""1066 · the writing rooms keep their look; two faults in them are mended.

The owner saw two redesigns of the Proposal, Curriculum, Research Writing and French Tutor rooms (30 October 2026) and
chose neither, and no seal in the rooms' headers: the rooms keep the look they have.

Mended: the line under a room's header counted every card it found, so the French Tutor, whose answers are cards, said
"Five rooms in this workspace", and the line was English in French. It now counts the rooms (a card with a name and a
line beneath it, never a quiz's answers), says it in French when the desk is in French ("Six pièces dans cet espace"),
and is not shown where there are fewer than two rooms. Research Writing's closing note said that lessons it already
holds "are being added"; it is gone."""


def apply(p, full):
    note = ('      frame.appendChild(el("div", { style: { fontFamily: "var(--cd-serif)", fontSize: "12px", fontStyle: "italic", '
            'color: "var(--cream-ink-3)", lineHeight: "1.6", marginTop: "8px" }, text: "More lessons are being added one at a '
            'time: the literature review, the theoretical framework and how it differs, research questions and aims, '
            'methodology and methods, the introduction, significance and contribution, and how a proposal grows into a '
            'dissertation. The worked examples will be tied to your own research topic." }));\n')
    p.rep(note, "", where="core")
    p.before_body_end(JS)


JS = r'''<script id="cd-1066-rooms">
(function () {
  'use strict';
  if (window.__cdRooms1066) return; window.__cdRooms1066 = 1;
  var orig = window.workspaceShell;
  if (typeof orig !== 'function') return;
  var WORDS = { en: ['', 'One room', 'Two rooms', 'Three rooms', 'Four rooms', 'Five rooms', 'Six rooms', 'Seven rooms', 'Eight rooms', 'Nine rooms', 'Ten rooms', 'Eleven rooms', 'Twelve rooms'],
                fr: ['', 'Une pièce', 'Deux pièces', 'Trois pièces', 'Quatre pièces', 'Cinq pièces', 'Six pièces', 'Sept pièces', 'Huit pièces', 'Neuf pièces', 'Dix pièces', 'Onze pièces', 'Douze pièces'] };
  function fr() { try { return state && state.lang === 'fr'; } catch (e) { return false; } }
  function recount() {
    var count = document.querySelector('#modal-root .cd-ws-count');
    if (!count) return;
    var frame = count.parentNode;
    var rooms = [].slice.call(frame.querySelectorAll('[data-cd-wscard]')).filter(function (c) { return c.children.length >= 2 && !c.querySelector('button'); });
    var n = rooms.length;
    if (n < 2) { count.remove(); return; }
    var W = WORDS[fr() ? 'fr' : 'en'];
    count.textContent = (n < W.length ? W[n] : String(n)) + (fr() ? ' dans cet espace' : ' in this workspace');
  }
  window.workspaceShell = function () {
    var r = orig.apply(this, arguments);
    try { recount(); } catch (e) {}
    return r;
  };
})();
</script>
'''
