"""1063 · a quieter page while it is only being read.

The owner's words (29 October 2026): "the entire app runs slow and just lags in general", and "I want to run on both HP
laptops with great speed and efficiency".

Measured in 1062: 73 background checks run on intervals (each one dresses, seats or re-measures part of the page), about
a second apart, whether anyone is at the desk or not; a profile of the first seconds put half a second into one of them
alone. The governor of pass 4xx already slows them on a weak machine and stops them while the page is hidden or
scrolled. Now, too, when no key, pointer or touch has been used for twenty seconds, or while the window is not the one
in front, they run at a third of their pace; the first touch brings them back at once. A running Clepsydra or the
two-minute start is never slowed."""


def apply(p, full):
    a, b = p.block("cd-timer-governor")
    seg = p.s[a:b]
    old = ("    rec.id = native.call(window, function () {\n\n"
           "      if (document.hidden || paused) return;\n"
           "      try { rec.fn.apply(null, rec.args); } catch (e) {}\n"
           "    }, eased);\n")
    new = ("    rec.id = native.call(window, function () {\n\n"
           "      if (document.hidden || paused) return;\n"
           "      if (resting() && (++rec.skip % 3)) return;\n"
           "      try { rec.fn.apply(null, rec.args); } catch (e) {}\n"
           "    }, eased);\n")
    if seg.count(old) != 1:
        raise SystemExit("the governor's tick was not found once")
    seg = seg.replace(old, new)
    old2 = "    var rec = { fn: fn, period: eased, id: 0, args: args };\n"
    if seg.count(old2) != 1:
        raise SystemExit("the governor's record was not found once")
    seg = seg.replace(old2, "    var rec = { fn: fn, period: eased, id: 0, args: args, skip: 0 };\n")
    old3 = "  window.__cdTimerFactor = factor;\n"
    if seg.count(old3) != 1:
        raise SystemExit("the governor's factor was not found once")
    seg = seg.replace(old3, old3 + REST)
    p.s = p.s[:a] + seg + p.s[b:]


REST = r"""
  var lastInput = Date.now();
  function stir() { lastInput = Date.now(); }
  try {
    ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'focus'].forEach(function (k) { window.addEventListener(k, stir, { capture: true, passive: true }); });
  } catch (e) {}
  function resting() {
    try {
      if (typeof pomo !== 'undefined' && pomo && pomo.running) return false;
      if (document.getElementById('cd-just') || document.getElementById('sc-just')) return false;
      if (Date.now() - lastInput > 20000) return true;
      return typeof document.hasFocus === 'function' && !document.hasFocus();
    } catch (e) { return false; }
  }
  window.__cdResting = resting;
"""
