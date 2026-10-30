# Carpe Diem 1072: how this build was made

Word (.docx) and PDF files open in Tabula from the Finder and from Explorer.

* **Mac** (`Mac project/carpe_diem.spec`, `carpe_diem_app.py`): `CFBundleDocumentTypes` declares
  `org.openxmlformats.wordprocessingml.document` (Editor) and `com.adobe.pdf` (Viewer), both `LSHandlerRank`
  `Alternate`: listed under Open With, never the default unless chosen in Get Info. A file that starts the app arrives in
  `sys.argv` (PyInstaller's `argv_emulation`, already on); one opened while the app is open arrives as an Apple event,
  heard by `application:openURLs:` on a subclass of pywebview's own app delegate (`_hear_opened_files`), which
  pywebview's delegate lacks.
* **Windows** (`build/carpe_diem.iss`, `carpe_diem_app.py`): the installer adds the ProgID `CarpeDiem.Tabula`
  ("Tabula (Carpe Diem)"), lists it in `.docx` and `.pdf` `OpenWithProgids` and under `Applications\Carpe Diem.exe`
  (`SupportedTypes`), for this user only, removed on uninstall, with `ChangesAssociations=yes`. Nothing is made the
  default. A start with a file and no copy open hands the file to its own page; a second start (one copy at a time)
  appends the file to `%LOCALAPPDATA%\CarpeDiem\open-file.txt` and ends, and the open copy takes it (`_files_on_request`).
* **Both** (`files_asked`, `take_file`, `file_part`): the file waits in the program until the page asks for it. The page
  asks every 1.2 s for its first minute, then every 2.5 s (`take_file("desk")` from Carpe Diem's window, or
  `take_file("tabula")` from Tabula's own window, which takes it when one is open), then fetches it in 1 MB pieces
  (`file_part`), opens it, and reports back through `file_opened`, written to the record as `file: <name> opened` (or
  why not). The first version pushed the file into the page with `evaluate_js` from a thread of its own; on GitHub's
  Windows that thread waited without end (pywebview's `evaluate_js` waits for an answer with no time limit, and a call
  made while the window was still starting got none), and on the Mac a file opened while the app was open was heard but
  never handed over. Now the program never calls into the page: the page's own requests, the path every other request
  of the page takes, carry the file.
* **Page** (`p_open.py`): `cdHostOpenFile` opens one file at a time; the door gives way; a PDF goes to Tabula's PDF
  reader, a Word file to the full Word reader, asking first only when the page holds writing. A Word or PDF file dropped
  on the desk now goes to those readers too (Tabula's `__cdOpenFile` used the older Word reader, and the desk turned PDFs
  away), and to a room in sight (before, a hidden, closed room could take it unseen). The PDF reader's fingerprint is
  checked with the page's own SHA-256 (`sha256.js`, FIPS 180-4) where the engine keeps `crypto.subtle` from the page.

Tests here: the page (`tests/t_host_open.js`: a file waiting in the app, with the door up; dropped Word and PDF files;
all three editions); the programs (`tests/t_host_pull.js <page> <program.py>`: `serve_host_api.py` loads either
program, asks it to open a Word file, a PDF and a text file, and answers the page's requests as pywebview passes them:
the Word file and then the PDF open, in order, the text file is left alone; the 1.3 MB dissertation PDF arrives in two
pieces with all 310 notes);
`tests/t_sha256.js` (the page's SHA-256 against Node's on ten inputs, the two pdf.js files among them); PDF opening with
the engine's SHA-256 taken away. On GitHub: the Mac build opens a PDF with `open -a` (it starts the app; the record must
say `file: chapter.pdf opened`) and then a Word file while it is open (`handed to Tabula`); the Windows build checks the
registry entries, starts the installed program with a PDF (`opened`), starts it again with a Word file (the second start
must end, the open copy must take the file), and checks that uninstalling removes the entries.

On GitHub's Windows the check failed twice with the page never asking at all, then passed with the page asking 5 s after
the start (the PDF open a second later, the Word file of a second start taken by the open copy). The check force-stops
the app just before; the web view's helper processes outlive a forced stop for a few seconds and hold its storage, and
a start made inside that time can wait on them without its page loading. The check now waits for them to end. The page
notes in the record when it starts asking ("file: - the page asks for files from desk"), and pywebview's own errors are
written to the record.
