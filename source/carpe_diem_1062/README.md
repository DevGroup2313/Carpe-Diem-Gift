# Carpe Diem 1062: how this build was made

`cd1062.py` applies build 1062 to each edition's 1061 page:

* `p_quiet.py`: Ingenium's Quiet Screen (`build/thoughts/quiet_screen.html` of the Ingenium repository, carried whole)
  with Carpe Diem's adapter: the leaf 🌿 in the side column (packed between the bell and the 💭) and in a floating
  window's column; Focus's way in beside the clock of Now; the support module's "I need quiet" opens it
  (`quietOpen` hook); the thought bubble keeps quiet while it is open; cream by day, a dim night blue by night;
  English or French words.
* `p_minforge.py`: the mini Forge made again from The Forge 656's lean page (`forge-bi-self` of the Forge's full page,
  checked against `forge-bi-meta`), by the recipe of pass 1057 (no device sources, no Tabula, the short pages for
  Abacus, Slides, Scriba and Fontes, and the 641 mini Forge's riders: French layer, Tabula guard, Carpe-only rule). Its
  loading page takes the Studio's language and day or night (`window.__cdMiniLang`, `window.__cdMiniNight`, injected
  by the Studio each time it opens the Forge) and speaks French. `trust()` adds the fingerprint of the very text
  "Edit this app" hands the Forge to the mini Forge's `forge-trust-shas`, so its preview is not shown apart.
* `p_builders.py`: the kits say 1062.

Tests: `node ../carpe_diem_1060/tests/run.js URL ../carpe_diem_1060/tests/quiet.json`, and
`node ../carpe_diem_1060/tests/mf.js fr` (the mini Forge's build, its French loading page, this very build in it).
