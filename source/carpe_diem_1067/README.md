# Carpe Diem 1067: how this build was made

`p_tabula.py` changes Tabula's own source (`TABULA_SRC`, so the main window, the floating window and Tabula's own window
all have it). Tested as a person uses the ribbon (`tests/t_tabula_ribbon.js <page>`: a word chosen with the mouse, then
a key), bold, italic, underline, strikethrough, font and the palettes held; three things did not, and now do:

* Size: the key asked for the browser's largest size and turned `<font size="7">` into the chosen size, but the browser
  writes `<span style="font-size: xxx-large">` now, so 18 gave 48 px. Either form, inside the selection only, becomes the
  size in points; with nothing selected, a sized span with a zero-width space holds the caret for what is typed next.
* The A and H keys were the system colour chooser itself (an `<input type=color>` over the key), so a press opened a
  chooser and lost the selection. A trusted press now colours the selection with the colour under the letter (the
  last chosen in the palette); "More colours…" still opens the chooser by a click of its own.
