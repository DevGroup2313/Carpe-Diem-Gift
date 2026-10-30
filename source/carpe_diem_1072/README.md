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
* **Both** (`files_asked`, `_deliver_files`): the file goes to Tabula's own window if one is open, else Carpe Diem's,
  in 1 MB pieces into `window.__cdIn[key]`, then `cdHostOpenFile(name, key)`; the page reports back through
  `file_opened`, written to the record as `file: <name> opened` (or why not).
* **Page** (`p_open.py`): `cdHostOpenFile` opens one file at a time; the door gives way; a PDF goes to Tabula's PDF
  reader, a Word file to the full Word reader, asking first only when the page holds writing. A Word or PDF file dropped
  on the desk now goes to those readers too (Tabula's `__cdOpenFile` used the older Word reader, and the desk turned PDFs
  away), and to a room in sight (before, a hidden, closed room could take it unseen). The PDF reader's fingerprint is
  checked with the page's own SHA-256 (`sha256.js`, FIPS 180-4) where the engine keeps `crypto.subtle` from the page.

Tests here: the page (`tests/t_host_open.js`: a file handed by the app, with the door up; dropped Word and PDF files;
all three editions); the programs' calls (`tests/record_host_calls.py` loads either program with a stand-in window and
records what it sends; `tests/t_host_replay.js` runs those calls in the page: both files opened, in order);
`tests/t_sha256.js` (the page's SHA-256 against Node's on ten inputs, the two pdf.js files among them); PDF opening with
the engine's SHA-256 taken away. On GitHub: the Mac build opens a PDF with `open -a` (it starts the app; the record must
say `file: chapter.pdf opened`) and then a Word file while it is open (`handed to Tabula`); the Windows build checks the
registry entries, starts the installed program with a PDF (`opened`), starts it again with a Word file (the second start
must end, the open copy must take the file), and checks that uninstalling removes the entries.
