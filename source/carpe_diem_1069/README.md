# Carpe Diem 1069: how this build was made

`p_word.py` changes Tabula's own source (`TABULA_SRC`). Tested with a chapter made in Word (title, headings, bold,
italic, a List Bullet list, a table, two Chicago footnotes) and with a dissertation of 100,000 words and 310 footnotes:

* The Home ribbon's Word key used `importDocx` (Tabula's older reader: no tables, images or footnotes, and a question
  before replacing even an empty page). It now calls `window.cdOpenDocx`, the reader File, Open uses, and asks only
  when the page holds writing.
* A footnote reference came in as `<sup><sup class="fn-ref">` (Word marks the reference's run superscript too); the
  run's superscript is no longer put around a reference.
* `numOf` read only numbering written on the paragraph; `cdStyleNum` reads numbering from the paragraph style and the
  styles it is based on (styles.xml), and Word's ListBullet/ListNumber styles by name.
* Save .docx offers the document's own name.

Measured (headless Chromium, software drawing): the dissertation opens in about 2 s (341 pages, every note at its page
foot), an added footnote renumbers the rest, and it saves back to Word in about 0.3 s with all 311 notes in order.
Typing costs about 35 ms a key there against 10 ms in a short document; a trace puts most of the difference in the
browser repainting the long page, which software drawing exaggerates; Tabula's own scripts are a small share.
Tests: `tests/t_word_open.js <page> <file.docx> [input|button]`, `tests/t_word_roundtrip.js`, `tests/t_dissertation.js`.
