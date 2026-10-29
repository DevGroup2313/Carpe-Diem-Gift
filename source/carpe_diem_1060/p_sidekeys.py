"""1060 · the side keys of a floating window, and the thoughts' number.

The owner's words (29 October 2026): "The side emoji buttons of the in-app exported floating windows have a thick dark
square shadow around them ... it drains the app and make it run slower ... I want the 3D popped out animated look and
effect of the side buttons kept but I want the thick dark shadows reduced or removed to match the main app's side emoji
buttons", and "the Thoughts cloud's blue notification number has some lines on it like a fading."

Measured in 1059: the main window's side keys lost their stacked drop shadows in pass 1048 (filter: none), but the keys
drawn inside each floating window (#cd-jewel-winfabs, written into the window's frame) still carried three stacked
drop-shadow filters on every emoji, the kind WebKit paints as a dark box and recomputes at every frame of an animation;
the thoughts' number was drawn as a gradient with a light line along its top and a dark line along its foot.

Now the window's keys are drawn as the main window's are: no filter, the same lift and press, the bell's ring and the
hourglass's and the notes' slow turn; the 💭 in a window shows the same number as the main one; and the number itself
is one flat colour with a small soft shadow, the bell's own drawing, in every window."""


def apply(p, full):
    # 1. the keys written into each floating window's frame
    p.rep("    + '#cd-jewel-winfabs button{pointer-events:auto;width:42px;height:42px;border:0;'\n"
          "    + 'background:transparent;cursor:pointer;padding:0;display:flex;align-items:center;'\n"
          "    + 'justify-content:center;transition:transform .15s ease;}'\n"
          "    + '#cd-jewel-winfabs button:hover{transform:translateY(-2px) scale(1.06);}'\n"
          "    + '#cd-jewel-winfabs button:active{transform:translateY(1px) scale(.96);}'\n"
          "    + '#cd-jewel-winfabs button > *{font-size:30px;line-height:1;'\n"
          "    + 'filter:drop-shadow(0 1px 1px rgba(16,42,58,.35)) drop-shadow(0 3px 4px rgba(16,42,58,.28)) '\n"
          "    + 'drop-shadow(0 8px 14px rgba(16,42,58,.22));}'\n",
          "    + '#cd-jewel-winfabs button{pointer-events:auto;width:42px;height:42px;border:0;box-shadow:none;'\n"
          "    + 'background:transparent;cursor:pointer;padding:0;display:flex;align-items:center;'\n"
          "    + 'justify-content:center;transition:transform .18s cubic-bezier(.2,.8,.3,1);}'\n"
          "    + '#cd-jewel-winfabs button:hover{transform:translateY(-6px) scale(1.06);}'\n"
          "    + '#cd-jewel-winfabs button:active{transform:translateY(2px);transition-duration:.05s;}'\n"
          "    + '#cd-jewel-winfabs button,#cd-jewel-winfabs button > *{filter:none !important;-webkit-filter:none !important;text-shadow:none !important;}'\n"
          "    + '#cd-jewel-winfabs button > *{font-size:30px;line-height:1;}'\n"
          "    + '#cd-wf-bell .cd-wf-glyph{display:inline-block;transform-origin:50% 2px;animation:cdWfRing 3.4s ease-in-out infinite;}'\n"
          "    + '#cd-wf-horo .cd-wf-glyph{display:inline-block;animation:cdWfTurn 14s ease-in-out infinite;}'\n"
          "    + '#cd-wf-note .cd-wf-glyph{display:inline-block;animation:cdWfTurn 12s ease-in-out infinite;}'\n"
          "    + '@keyframes cdWfRing{0%,84%,100%{transform:rotate(0)}87%{transform:rotate(9deg)}90%{transform:rotate(-6deg)}93%{transform:rotate(3.5deg)}96%{transform:rotate(-2deg)}98%{transform:rotate(1deg)}}'\n"
          "    + '@keyframes cdWfTurn{0%,89%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}'\n"
          "    + '@media (prefers-reduced-motion:reduce){#cd-jewel-winfabs .cd-wf-glyph{animation:none !important;}}'\n"
          "    + '#cd-wf-thought{position:relative;}'\n"
          "    + '#cd-wf-thought .cd-wf-tbadge{position:absolute;top:-1px;right:-3px;min-width:17px;height:17px;'\n"
          "    + 'padding:0 4px;box-sizing:border-box;border-radius:9px;background:#1b6b93;color:#fff;'\n"
          "    + 'font:700 10px/17px -apple-system,system-ui,sans-serif;text-align:center;-webkit-font-smoothing:antialiased;'\n"
          "    + 'box-shadow:0 1px 3px rgba(0,0,0,.35);filter:none;pointer-events:none;}'\n"
          "    + 'html.cd-dark #cd-wf-thought .cd-wf-tbadge,body[data-theme=\"night\"] #cd-wf-thought .cd-wf-tbadge{background:#5baedb;color:#0d1820;}'\n")
    # the 💭 in a window shows the main 💭's number, as the bell shows the bell's
    p.rep("        if (wb) {\n"
          "          if (pb && (pb.textContent || '').trim()) { wb.textContent = pb.textContent; wb.style.display = ''; }\n"
          "          else wb.style.display = 'none';\n"
          "        }\n",
          "        if (wb) {\n"
          "          if (pb && (pb.textContent || '').trim()) { wb.textContent = pb.textContent; wb.style.display = ''; }\n"
          "          else wb.style.display = 'none';\n"
          "        }\n"
          "        try {\n"
          "          var tw = col.querySelector('#cd-wf-thought'), tb = document.querySelector('#cd-thought-fab .tc-badge');\n"
          "          if (tw) {\n"
          "            var tn = (tb && !tb.hidden && tb.style.display !== 'none') ? (tb.textContent || '').trim() : '';\n"
          "            var twb = tw.querySelector('.cd-wf-tbadge');\n"
          "            if (tn && !twb) { twb = d.createElement('span'); twb.className = 'cd-wf-tbadge'; twb.setAttribute('aria-hidden', 'true'); tw.appendChild(twb); }\n"
          "            if (twb) { if (tn) { if (twb.textContent !== tn) twb.textContent = tn; twb.style.display = ''; } else twb.style.display = 'none'; }\n"
          "          }\n"
          "        } catch (e) {}\n")

    # 2. the same keys on a room's own page opened in a browser window (pass 697)
    p.rep('#cd-jewel-winfabs button > *{font-size:30px;line-height:1;filter:drop-shadow(0 1px 1px rgba(16,42,58,.35));}',
          '#cd-jewel-winfabs button > *{font-size:30px;line-height:1;filter:none;}')

    # 3. the thoughts' number: one flat colour and a small soft shadow, as the bell's
    p.rep('background:linear-gradient(180deg,var(--tc-badge-hi),var(--tc-badge));color:var(--tc-badge-ink);font:800 10px/18px var(--tc-sans) !important;text-align:center;letter-spacing:0;text-shadow:none !important;filter:none !important;\n'
          '  box-shadow:inset 0 1px 0 rgba(255,255,255,.25),inset 0 -1px 0 rgba(0,0,0,.15),0 1px 0 rgba(var(--tc-fam),.35),0 2px 4px rgba(var(--tc-fam),.30);',
          'background:var(--tc-badge);color:var(--tc-badge-ink);font:800 10px/18px var(--tc-sans) !important;text-align:center;letter-spacing:0;text-shadow:none !important;filter:none !important;-webkit-font-smoothing:antialiased;\n'
          '  box-shadow:0 1px 3px rgba(0,0,0,.35);')
    p.rep('background:"linear-gradient(180deg,var(--tc-badge-hi),var(--tc-badge))",color:"var(--tc-badge-ink)","text-shadow":"none"});',
          'background:"var(--tc-badge)","box-shadow":"0 1px 3px rgba(0,0,0,.35)",color:"var(--tc-badge-ink)","text-shadow":"none"});')
