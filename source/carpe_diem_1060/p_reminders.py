"""1060 · the timed reminders in Carpe Diem's own blue card.

The owner's words (29 October 2026): "I want the time reminders that show up on the screen to be in a blue card or a
better colour that matches the app better instead of the black colour it currently is".

Measured in 1059: "In five minutes: ..." and the other words of the support module came in its own near-black note
(rgba(30,34,40,.94)) by day and by night; the older support module's note and its two-minute clock were white by day and
near black by night; a thought asking to come back used the panel's face, near black by night; Custodia's "A pause,
earned" card had no card at all: its class was written as a "classname" attribute, so neither the glass nor the keys'
own look reached it.

Now each of them is one card in Carpe Diem's colours, by day and by night: a pastel light-blue face, Carpe Diem's blue
ink and a soft blue rim, with the app's own keys (the owner's words, on seeing a deep blue: "I want the cards to stay
cream or light blue or pastel colours"); Custodia's card and keys take their classes properly (in the page and in the windows' copy)."""



def apply(p, full):
    # Custodia's card and keys: their classes, not a "classname" attribute (in the page, and in the module the windows carry)
    p.rep('var card = el("div",{className:"glass",style:{maxWidth:"430px"', 'var card = el("div",{className:"glass cd-custodia-card",style:{maxWidth:"430px"', count=2)
    # el() took "class" only, so seven calls that passed "className" (Custodia's card and keys, the import's merge keys)
    # wrote an attribute no style reads: the page's el() now takes both, and the module the windows carry says "class"
    p.rep('      if (k === "class") node.className = attrs[k];\n', '      if (k === "class" || k === "className") node.className = attrs[k];\n', where="core")
    a, b = p.block("cd-mod-pomo")
    seg = p.s[a:b]
    if seg.count("{className:") != 3:
        raise SystemExit("cd-mod-pomo: className not found 3 times")
    p.s = p.s[:a] + seg.replace("{className:", "{class:") + p.s[b:]
    p.before_body_end(CSS)


CSS = r'''<style id="cd-1060-reminder-card">
#sc-toast,#cd-sup-toast,body[data-theme="night"] #cd-sup-toast,#cd-just,body[data-theme="night"] #cd-just,#sc-just,#sc-just[data-sc-night="1"]{
  background:#eaf3f9 !important;color:#173f57 !important;border:1px solid #b9d5e6 !important;
  box-shadow:0 2px 0 rgba(27,107,147,.14),0 10px 26px rgba(16,42,58,.16) !important;-webkit-font-smoothing:antialiased}
body[data-theme="night"] #cd-sup-toast,body[data-theme="night"] #cd-just,body[data-theme="night"] #sc-toast,#sc-just[data-sc-night="1"]{background:#d9e8f1 !important;color:#14374c !important;border-color:#a9c9dc !important;
  box-shadow:0 2px 0 rgba(0,0,0,.30),0 12px 30px rgba(0,0,0,.40) !important}
#cd-just .cd-just-bar,#sc-just .sc-just-bar{background:rgba(27,107,147,.16) !important}
#cd-just .cd-just-bar i,#sc-just .sc-just-bar i{background:#1B6B93 !important}
#cd-just button,#sc-just button{color:#1B6B93 !important;background:#fff !important;border:1px solid rgba(27,107,147,.35) !important;box-shadow:0 1px 0 rgba(27,107,147,.18) !important}
#cd-just button:hover,#sc-just button:hover{background:#f5f9fc !important}
.tc-nudge.tc-el.tc-el[data-tc-app="cd"]{--tc-face-a:#eaf3f9;--tc-face-b:#eaf3f9;--tc-card:#eaf3f9;--tc-card-b:#eaf3f9;--tc-ink:#173f57;--tc-soft:rgba(23,63,87,.74);
  --tc-rim:#b9d5e6;--tc-wall:#c9dfec;--tc-lip:rgba(255,255,255,.7);--tc-fam:16,42,58}
.tc-nudge.tc-el[data-tc-app="cd"] .tc-body{background:#eaf3f9 !important;color:#173f57;box-shadow:inset 0 0 0 1px #b9d5e6,0 2px 0 rgba(27,107,147,.14),0 12px 28px rgba(16,42,58,.16) !important}
.tc-nudge.tc-el[data-tc-app="cd"][data-tc-night="1"] .tc-body{background:#d9e8f1 !important;box-shadow:inset 0 0 0 1px #a9c9dc,0 2px 0 rgba(0,0,0,.3),0 12px 30px rgba(0,0,0,.4) !important}
.tc-nudge.tc-el[data-tc-app="cd"] .tc-nudge-t,.tc-nudge.tc-el[data-tc-app="cd"] .tc-nudge-t q{color:#173f57}
.tc-nudge.tc-el[data-tc-app="cd"] .tc-nudge-x{color:rgba(23,63,87,.7)}
.tc-nudge.tc-el[data-tc-app="cd"] .tc-nudge-x:hover{color:#173f57}
.tc-nudge.tc-el[data-tc-app="cd"] .tc-key{color:#1B6B93 !important;background:#fff !important;box-shadow:inset 0 0 0 1px rgba(27,107,147,.32),0 1px 0 rgba(27,107,147,.18) !important}
.tc-nudge.tc-el[data-tc-app="cd"] .tc-key:hover{background:#f5f9fc !important}
.tc-nudge.tc-el[data-tc-app="cd"] .tc-key.tc-keep{color:#fff !important;background:#1B6B93 !important;box-shadow:0 2px 0 #124c69 !important}
#custodia-overlay{background:rgba(16,42,58,.28) !important}
#custodia-overlay > .cd-custodia-card{background:#eaf3f9 !important;color:#173f57 !important;border:1px solid #b9d5e6 !important;
  box-shadow:0 2px 0 rgba(27,107,147,.14),0 18px 44px rgba(16,42,58,.24) !important;-webkit-backdrop-filter:none !important;backdrop-filter:none !important}
body[data-theme="night"] #custodia-overlay > .cd-custodia-card{background:#d9e8f1 !important;border-color:#a9c9dc !important;box-shadow:0 2px 0 rgba(0,0,0,.3),0 18px 44px rgba(0,0,0,.45) !important}
#custodia-overlay > .cd-custodia-card > div{color:#173f57 !important}
#custodia-overlay > .cd-custodia-card > div:last-child{color:rgba(23,63,87,.72) !important}
#custodia-overlay .cd-custodia-card .btn{color:#1B6B93 !important;background:#fff !important;border:1px solid rgba(27,107,147,.35) !important;box-shadow:0 1px 0 rgba(27,107,147,.18) !important}
#custodia-overlay .cd-custodia-card .btn:hover{background:#f5f9fc !important}
#custodia-overlay .cd-custodia-card .btn-primary{background:#1B6B93 !important;color:#fff !important;border-color:#1B6B93 !important;box-shadow:0 2px 0 #124c69 !important}
#custodia-overlay .cd-custodia-card .btn-primary:hover{background:#1f77a3 !important}
#custodia-overlay .cd-custodia-card .btn:focus-visible,#cd-just button:focus-visible,#sc-just button:focus-visible{outline:2px solid #1B6B93;outline-offset:2px}
</style>
'''
