# Carpe Diem 1068: how this build was made

`p_abacus.py` changes Abacus's own source (`ABACUS_SRC`). Tested as a person uses it (`tests/t_abacus_typing.js`,
`tests/t_abacus_keys.js`), every cell was always open for writing, so a single click put the caret where the pointer
fell and typing went in beside the cell's contents ("Item" + "Name" = "ItemName"; 1234.5 over 1.5 = "1234.51.5", text,
which the number formats then could not format). A script added at the end of Abacus's page (`cd-1068-abacus-type`)
gives Excel's rules: one click or the Name Box chooses a cell and typing replaces it; a double click or F2 writes
inside it; Backspace empties it and writes; Delete empties it; the arrow keys move between cells, and move the caret
only in a cell being written in. The currency format shows thousands ($1,234.50; 1 234,50 € in French) and the comma
style keeps two decimals (display only: `fmtVal` is used for nothing else).

Imago's ribbon was tested the same way (`tests/t_imago_ribbon.js`: bold, colour, underline, grow on a word of a
slide) and needed nothing.
