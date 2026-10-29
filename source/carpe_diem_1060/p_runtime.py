"""1060 · what runs as the desk opens: the owner's proposal date cleared once, as asked; the demonstrations' sample
dates kept ahead of each visit; and the look of the proposal's working title."""


def apply(p, full):
    p.before_body_end(CSS + (FULL_JS if full else DEMO_JS))


CSS = r'''<style id="cd-1060-proposal-css">
.cd-prop-title{display:block;margin:0 auto 10px;max-width:100%;padding:4px 10px;border:0;border-radius:10px;background:transparent;cursor:pointer;
  font:italic 500 18px/1.35 var(--cd-serif,Georgia,serif);color:var(--text-primary);text-align:center;transition:background .18s ease,transform .18s ease}
.cd-prop-title:hover{background:rgba(27,107,147,.07);transform:translateY(-1px)}
.cd-prop-title:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.cd-prop-title.cd-prop-untitled{font-size:14px;color:var(--text-tertiary)}
.cd-prop-details .cd-prop-in:focus{outline:2px solid rgba(27,107,147,.45);outline-offset:1px;border-color:var(--accent)}
body[data-theme="night"] .cd-prop-title:hover{background:rgba(143,208,240,.08)}
</style>
'''

# The owner's desk: the proposal's date is cleared once, and the milestones still holding the dates an earlier build
# wrote for every desk (never the owner's own) are cleared with it.
FULL_JS = r'''<script id="cd-1060-dates">
(function () {
  'use strict';
  var tries = 0;
  function run() {
    if (typeof state !== 'object' || !state || typeof saveState !== 'function') { if (++tries < 60) setTimeout(run, 250); return; }
    if (state.cd1060DatesCleared) return;
    var PRESET = { 'ms-supervisor': ['2026-09-30'], 'ms-references': ['2026-10-15'], 'ms-application': ['2027-01-08'], 'ms-funding': ['2027-01-08'] };
    state.proposalTarget = '';
    try {
      ((state.candidature && state.candidature.milestones) || []).forEach(function (m) {
        if (!m || m.done) return;
        if (m.id === 'ms-proposal') m.date = '';
        else if (PRESET[m.id] && PRESET[m.id].indexOf(m.date) >= 0) m.date = '';
      });
    } catch (e) {}
    state.cd1060DatesCleared = true;
    try { saveState(); } catch (e) {}
    try { if (typeof cdPropRerender === 'function') cdPropRerender(); } catch (e) {}
  }
  run();
})();
</script>
'''

# A demonstration's sample dates are counted from each visit, so none of them is ever behind it; a date the visitor
# chose is left alone.
DEMO_JS = r'''<script id="cd-1060-demo-dates">
(function () {
  'use strict';
  var AHEAD = { 'ms-proposal': 42, 'ms-supervisor': 56, 'ms-references': 70, 'ms-application': 112, 'ms-funding': 112 }, tries = 0;
  function day(n) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); var m = d.getMonth() + 1, x = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (x < 10 ? '0' : '') + x; }
  function run() {
    if (typeof state !== 'object' || !state || typeof saveState !== 'function') { if (++tries < 60) setTimeout(run, 250); return; }
    var was = state.cd1060Sample || {}, now = {}, moved = 0;
    try {
      ((state.candidature && state.candidature.milestones) || []).forEach(function (m) {
        if (!m || !AHEAD[m.id]) return;
        var mine = was[m.id] !== undefined && m.date !== was[m.id];
        if (!mine && !m.done && m.date !== day(AHEAD[m.id])) { m.date = day(AHEAD[m.id]); moved++; }
        now[m.id] = m.date;
      });
      if (state.proposalTarget && state.proposalTarget < day(0)) { state.proposalTarget = ''; moved++; }
    } catch (e) {}
    state.cd1060Sample = now;
    try { saveState(); } catch (e) {}
    if (moved) { try { if (typeof cdPropRerender === 'function') cdPropRerender(); } catch (e) {} }
  }
  run();
})();
</script>
'''
