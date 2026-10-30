# Carpe Diem 1071: how this build was made

`p_pdf.py` adds `cd-1071-pdf` to Tabula's own source (`TABULA_SRC`): `pdfdoc.js` (the PDF reader's layout pass,
`window.cdPdfToDoc`) and the glue (`window.cdOpenPdf`, the reader's loader, the card). It also mends one line of an
older guard in `cd-jewel-js` that the page puts into Tabula.

* **Reading.** pdf.js 3.11.174 (legacy build) gives each run of text and where it stands. Lines are the runs that share
  a baseline; a small raised run of digits joins the line beneath as a note number. Running heads and feet are a bare
  page number near an edge, or the outermost line at an edge when its words (digits aside) recur on at least 30 per
  cent of pages (three at least) and any number in it follows the page's own; a line that begins with a raised number
  is never one. Footnotes are the lines at a page's foot set smaller than the text, or, when they are not smaller,
  set off by a gap and beginning with numbers raised in the text above or still waiting from the page before, in
  order. Paragraphs break on a change of size, a gap, an indent, a centred line, a bullet, or a line that ends where
  the next line's first word would have fitted; a word broken by a hyphen before a lower-case continuation is made
  whole. Size makes headings (1.5 times the text's size: Heading 1; 1.15: Heading 2), as does a short line all in bold.
  Bold and italic come from the fonts' names and flags. A raised number with its note becomes a Tabula footnote; a
  note that meets no number is kept at the end, never lost. Under 25 characters a page: a PDF of pictures, said so.
* **The reader.** Fetched once from cdn.jsdelivr.net (which the page's security policy already allowed for Scriba),
  kept in the store Scriba keeps it in (`cd-scriba-1044` cache, or `cd_scriba_store`), and used only when its SHA-256 is
  the published file's: `pdf.min.js` 978fd1b2…a5aa6c, `pdf.worker.min.js` 38cde531…0e96f2, taken from npm
  `pdfjs-dist-3.11.174.tgz`, whose SHA-1 matches the registry's (5ff47b80…704c4b). A copy beside the app
  (`vendor/`) or kept is checked the same way.
* **Fill a PDF** had been refused every PDF by the older guard ("This is a PDF. Tabula writes .docx documents"), so it
  never opened one. A chooser that asks for PDFs now has its PDF; any other still refuses, and says where to go.

Tested (headless Chromium): a typeset article (`tests/make_test_pdfs.py`: running head, page numbers, justified lines
broken by hyphens, italic, ten notes at the feet under a rule): title, centred subtitle, three headings, 16 paragraphs,
all ten notes in order. A chapter printed from Word by LibreOffice: headings, a bulleted list, bold and italic, both
notes (set the same size as the text). The 253-page, 100,000-word dissertation printed the same way: about 1.7 s, 1,008
of its 1,011 paragraphs and headings (three paragraphs that end exactly at a page's foot join the next), all 310 notes
in order, every one laid out at its page foot, and saved back to Word with all 310. Also: the reader fetched once and
then taken from the store after a reload; a changed reader refused; no connection the first time said plainly; a page
of pictures said plainly; Stop leaves the page as it was; French wording; all three editions.
Tests: `tests/t_pdf_open.js <page>` (with the PDFs and the npm package in `CD_TEST_DIR`), `tests/t_fill_pdf.js <page>`.
