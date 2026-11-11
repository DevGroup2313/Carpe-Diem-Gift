# -*- coding: utf-8 -*-
"""1088 · Tabula is offered under Open With, for the files it reads, in the Mac, Windows and Fire tablet projects.

usage: open_with_edits.py GIFT_REPO        (each edit is made once; a second run finds it made and stops)

It edits the Mac, Windows and Fire tablet projects and the Mac and Windows builds' checks, and writes three small
test files (.github/test-files/chapter.md, .txt and .html).

The files Tabula reads: Word (.docx), PDF, plain text (.txt), web pages (.html, .htm) and Markdown (.md, its headings,
lists and emphasis kept).
An old binary Word file (.doc), RTF and OpenDocument text are not offered: Tabula cannot read them yet."""
import os, sys


def once(path, old, new, what):
    t = open(path, encoding="utf-8").read()
    if new in t and old not in t:
        raise SystemExit("%s: made already (%s)" % (path, what))
    if t.count(old) != 1:
        raise SystemExit("%s: expected once, found %d: %s" % (path, t.count(old), what))
    raw = open(path, "rb").read()
    crlf = b"\r\n" in raw
    t = t.replace("\r\n", "\n") if crlf else t
    old2, new2 = old.replace("\r\n", "\n"), new.replace("\r\n", "\n")
    t = t.replace(old2, new2)
    if crlf:
        t = t.replace("\n", "\r\n")
    open(path, "wb").write(t.encode("utf-8"))
    print("  %s: %s" % (os.path.relpath(path), what))


def mac(repo):
    p = os.path.join(repo, "Mac project", "carpe_diem_app.py")
    once(p, 'OPENABLE = (".docx", ".pdf")',
         '# Build 1088: and plain text, web pages and Markdown, which Tabula reads too\n'
         'OPENABLE = (".docx", ".pdf", ".txt", ".text", ".html", ".htm", ".md", ".markdown")', "the files the app takes for Tabula")
    once(p, 'ROOM_APP_KIND = "1073"', 'ROOM_APP_KIND = "1088"', "the rooms' apps are made again once (Tabula's new file types)")
    once(p, '''                {"CFBundleTypeName": "PDF document", "CFBundleTypeRole": "Viewer", "LSHandlerRank": "Alternate",
                 "LSItemContentTypes": ["com.adobe.pdf"]},
            ]
        else:
            info.pop("CFBundleDocumentTypes", None)''', '''                {"CFBundleTypeName": "PDF document", "CFBundleTypeRole": "Viewer", "LSHandlerRank": "Alternate",
                 "LSItemContentTypes": ["com.adobe.pdf"]},
                # build 1088: plain text, web pages and Markdown, read as Tabula's File, Open reads them
                {"CFBundleTypeName": "Text document", "CFBundleTypeRole": "Editor", "LSHandlerRank": "Alternate",
                 "LSItemContentTypes": ["public.plain-text", "net.daringfireball.markdown"]},
                {"CFBundleTypeName": "Web page", "CFBundleTypeRole": "Editor", "LSHandlerRank": "Alternate",
                 "LSItemContentTypes": ["public.html"]},
            ]
            # build 1088: Markdown named for a Mac that does not know it already, so a .md file is offered to Tabula
            info["UTImportedTypeDeclarations"] = [
                {"UTTypeIdentifier": "net.daringfireball.markdown", "UTTypeDescription": "Markdown document",
                 "UTTypeConformsTo": ["public.plain-text"],
                 "UTTypeTagSpecification": {"public.filename-extension": ["md", "markdown"],
                                            "public.mime-type": ["text/markdown"]}},
            ]
        else:
            info.pop("CFBundleDocumentTypes", None)
            info.pop("UTImportedTypeDeclarations", None)''', "Tabula's own app offers itself for text, web pages and Markdown")


def windows(repo):
    p = os.path.join(repo, "Windows project", "carpe_diem_app.py")
    once(p, 'OPENABLE = (".docx", ".pdf")',
         '# Build 1088: and plain text, web pages and Markdown, which Tabula reads too\n'
         'OPENABLE = (".docx", ".pdf", ".txt", ".text", ".html", ".htm", ".md", ".markdown")', "the files the app takes for Tabula")
    iss = os.path.join(repo, "Windows project", "build", "carpe_diem.iss")
    once(iss, 'Root: HKA; Subkey: "Software\\Classes\\.pdf\\OpenWithProgids"; ValueType: string; ValueName: "CarpeDiem.Tabula"; ValueData: ""; Flags: uninsdeletevalue\n',
         'Root: HKA; Subkey: "Software\\Classes\\.pdf\\OpenWithProgids"; ValueType: string; ValueName: "CarpeDiem.Tabula"; ValueData: ""; Flags: uninsdeletevalue\n'
         '; build 1088: and plain text, web pages and Markdown, which Tabula reads too (Open With only, as for Word and PDF)\n'
         + "".join('Root: HKA; Subkey: "Software\\Classes\\%s\\OpenWithProgids"; ValueType: string; ValueName: "CarpeDiem.Tabula"; ValueData: ""; Flags: uninsdeletevalue\n' % x
                   for x in (".txt", ".html", ".htm", ".md")), "Open With offers Tabula for text, web pages and Markdown")
    once(iss, 'Root: HKA; Subkey: "Software\\Classes\\Applications\\Carpe Diem.exe\\SupportedTypes"; ValueType: string; ValueName: ".pdf"; ValueData: ""\n',
         'Root: HKA; Subkey: "Software\\Classes\\Applications\\Carpe Diem.exe\\SupportedTypes"; ValueType: string; ValueName: ".pdf"; ValueData: ""\n'
         + "".join('Root: HKA; Subkey: "Software\\Classes\\Applications\\Carpe Diem.exe\\SupportedTypes"; ValueType: string; ValueName: "%s"; ValueData: ""\n' % x
                   for x in (".txt", ".html", ".htm", ".md")), "the types Carpe Diem says it opens")



def words(repo):
    """What the launchers say of themselves now (the notes headed "Build 1072" stay: they say what that build did)."""
    for side in ("Mac project", "Windows project"):
        p = os.path.join(repo, side, "carpe_diem_app.py")
        once(p, '"""Word and PDF files to hand to Tabula as soon as the page can take them."""',
             '"""Files Tabula reads (Word, PDF, text, web pages, Markdown), to hand to it as soon as the page can take them."""',
             "the file intake's description")
    p = os.path.join(repo, "Mac project", "carpe_diem_app.py")
    once(p, "Tabula's is the one the Finder offers under Open With for Word and PDF files: it hands the file to",
         "Tabula's is the one the Finder offers under Open With for the files Tabula reads: it hands the file to",
         "the rooms' apps' description")
    once(p, "also hands on the Word and PDF files it is given.", "also hands on the files it is given.",
         "the applet's description")
    once(p, "# Open With offers Tabula for Word and PDF files;", "# Open With offers Tabula for the files it reads;",
         "the document types' note")
    once(p, 'log_note("files: listening for Word and PDF files from the Finder")',
         'log_note("files: listening for files from the Finder")', "the record's line")


TEST_FILES = {
    "chapter.md": "# Chapter One\n\nA short chapter for the build's check, written in **Markdown**.\n\n## Two points\n\n"
                  "- the first point\n- the second point, with *emphasis*\n\n> A quotation, set apart.\n",
    "chapter.txt": "Chapter One\n\nA short chapter for the build's check, written as plain text.\n",
    "chapter.html": "<!doctype html>\n<html><head><meta charset=\"utf-8\"><title>Chapter One</title></head>\n"
                    "<body><h1>Chapter One</h1><p>A short chapter for the build's check, written as a web page.</p></body></html>\n",
}

# A Markdown file is checked from a closed Carpe Diem, so that it is the first file Tabula's own window takes: a window
# that already holds text asks before replacing it, and nobody answers on a build machine.
MAC_MD_CHECK = """          # build 1088: a Markdown file opened with Tabula while Carpe Diem is closed: Carpe Diem starts and Tabula's
          # own window takes it (the first file it is given; a window already holding text asks before replacing it)
          rm -f "$LOG" "$HOME/carpe_diem_crash.log" "$STORE/carpe_session.flag" "$STORE/carpe_room.flag"
          open -a "$ROOMS/Tabula.app" "$F/chapter.md"
          T=0; until rec | grep -q "file: chapter.md handed to Tabula .* in its own window" || [ $T -ge 150 ]; do sleep 3; T=$((T+3)); done
          rec | grep -E "room: tabula|chapter.md" || true
          if ! rec | grep -q "file: chapter.md handed to Tabula .* in its own window"; then echo "::error::a Markdown file opened with Tabula, Carpe Diem closed, did not reach Tabula's own window"; rec | tail -40; stop; exit 1; fi
          echo "A Markdown file opened with Tabula, Carpe Diem closed, went to Tabula's own window after $T seconds."
          if rec | grep -q "Traceback"; then rec; echo "a fault was recorded"; stop; exit 1; fi
          stop; sleep 3
"""

WIN_MD_CHECK = r"""          # build 1088: a Markdown file opened with Tabula while Carpe Diem is closed (Open With's own command): Carpe Diem
          # starts and Tabula's own window takes it (the first file it is given; a window already holding text asks first)
          Stop-Process -Name 'Carpe Diem' -Force -ErrorAction SilentlyContinue
          for ($k = 0; $k -lt 30; $k++) { $h = @(Get-CimInstance Win32_Process -Filter "Name='msedgewebview2.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*CarpeDiem*' }); if ($h.Count -eq 0) { break }; Start-Sleep -Seconds 1 }
          $h | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
          Start-Sleep -Seconds 3
          Remove-Item "$app\carpe_diem_crash.log", (Join-Path $store "carpe_session.flag"), (Join-Path $store "carpe_room.flag") -ErrorAction SilentlyContinue
          $md = Start-Process -FilePath "$app\Carpe Diem.exe" -ArgumentList '--room', 'tabula', ('"' + (Join-Path $F 'chapter.md') + '"') -PassThru
          $ok = $false
          for ($k = 0; $k -lt 150 -and -not $ok; $k++) { Start-Sleep -Seconds 1; $ok = [bool](Select-String -Path "$app\carpe_diem_crash.log" -Pattern "file: chapter.md handed to Tabula \(\d+ bytes\) in its own window" -Quiet -ErrorAction SilentlyContinue) }
          Get-Content "$app\carpe_diem_crash.log" -ErrorAction SilentlyContinue | Select-String -Pattern "chapter.md|room tabula" | ForEach-Object { $_.Line }
          if (-not $ok) { "--- the program's record ---"; Get-Content "$app\carpe_diem_crash.log" -ErrorAction SilentlyContinue | Select-Object -Last 60; Write-Error "A Markdown file opened with Tabula, Carpe Diem closed, did not reach Tabula's own window."; exit 1 }
          "A Markdown file opened with Tabula, Carpe Diem closed, went to Tabula's own window."
          if (Select-String -Path "$app\carpe_diem_crash.log" -Pattern "Traceback" -Quiet -ErrorAction SilentlyContinue) { Get-Content "$app\carpe_diem_crash.log"; Write-Error "A fault was recorded."; exit 1 }
"""

WIN_PDF_LEFT = r"""          if ((Get-Item "HKCU:\Software\Classes\.pdf\OpenWithProgids" -ErrorAction SilentlyContinue).Property -contains 'CarpeDiem.Tabula') { Write-Error "Uninstalling left Carpe Diem under Open With for .pdf."; exit 1 }
"""

WIN_ABACUS_DONE = r"""          "Abacus's shortcut started Carpe Diem and opened Abacus in its own window, with its own taskbar button, after $secs seconds."
          if (Select-String -Path "$app\carpe_diem_crash.log" -Pattern "Traceback" -Quiet -ErrorAction SilentlyContinue) { Get-Content "$app\carpe_diem_crash.log"; Write-Error "A fault was recorded."; exit 1 }
"""


def ci(repo):
    """The Mac and Windows builds check the new kinds: Open With offers Tabula for them, and a Markdown file opened
    with Tabula, Carpe Diem closed, reaches Tabula's own window."""
    d = os.path.join(repo, ".github", "test-files")
    for name, text in TEST_FILES.items():
        f = os.path.join(d, name)
        if not os.path.exists(f):
            open(f, "w", encoding="utf-8", newline="\n").write(text)
            print("  %s: written" % os.path.relpath(f))
    w = os.path.join(repo, ".github", "workflows", "build-mac-app.yml")
    once(w, "Tabula's is offered under Open With for Word and PDF files",
         "Tabula's is offered under Open With for the files it reads", "the Mac build's note")
    once(w, "          # the Finder's Open With for a Word file and a PDF: Tabula, not Carpe Diem\n",
         "          # the Finder's Open With for each kind of file Tabula reads: Tabula, not Carpe Diem\n", "the Mac build's check's note")
    once(w, "          for f in chapter.docx chapter.pdf; do\n",
         "          for f in chapter.docx chapter.pdf chapter.txt chapter.html chapter.md; do\n", "Open With is checked for the new kinds")
    dock = "          stop; sleep 3\n          # kept in the Dock, once however often it is asked\n"
    once(w, dock, "          stop; sleep 3\n" + MAC_MD_CHECK + "          # kept in the Dock, once however often it is asked\n",
         "a Markdown file opened with Tabula, Carpe Diem closed, is checked")
    w = os.path.join(repo, ".github", "workflows", "build-windows-app.yml")
    once(w, "          $ow = @('.docx', '.pdf') | ForEach-Object",
         "          $ow = @('.docx', '.pdf', '.txt', '.html', '.htm', '.md') | ForEach-Object", "Open With is checked for the new kinds")
    once(w, "          \"Open With offers Carpe Diem for .docx and .pdf: $($ow -join ', ')\"",
         "          \"Open With offers Carpe Diem for .docx, .pdf, .txt, .html, .htm and .md: $($ow -join ', ')\"", "and says so")
    once(w, WIN_ABACUS_DONE, WIN_ABACUS_DONE + WIN_MD_CHECK, "a Markdown file opened with Tabula, Carpe Diem closed, is checked")
    once(w, WIN_PDF_LEFT, WIN_PDF_LEFT + WIN_PDF_LEFT.replace(".pdf", ".md"), "uninstalling is checked for .md too")

MIMES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
         "text/plain", "text/html", "text/markdown", "text/x-markdown"]


def android(repo):
    m = os.path.join(repo, "Fire tablet project", "app", "src", "main", "AndroidManifest.xml")
    data = "".join('                <data android:mimeType="%s" />\n' % x for x in MIMES)
    once(m, '''        <activity android:name=".MainActivity" android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>''', '''        <!-- Build 1088: one Carpe Diem at a time; a file opened with it goes to the one already open -->
        <activity android:name=".MainActivity" android:exported="true"
            android:launchMode="singleTask"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <!-- Build 1088: Open with and Share offer Carpe Diem for the files Tabula reads: Word, PDF, plain text,
                 web pages and Markdown. The file opens in Tabula. -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:scheme="content" />
''' + data + '''            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.SEND" />
                <category android:name="android.intent.category.DEFAULT" />
''' + data + '''            </intent-filter>
        </activity>''', "Open with and Share offer Carpe Diem for the files Tabula reads")
    j = os.path.join(repo, "Fire tablet project", "app", "src", "main", "java", "com", "yannie", "carpediem", "MainActivity.java")
    once(j, '''    private static final int MODEL_IMPORT_REQUEST = 4714;
    private ModelHost models;
''', '''    private static final int MODEL_IMPORT_REQUEST = 4714;
    private ModelHost models;

    // BUILD 1088: A FILE ANOTHER APP GIVES CARPE DIEM (Open with, Share) waits
    // here until the page takes it, as the Mac and Windows apps keep one for
    // their page: the page asks every second or so (takeFile), then fetches it
    // in pieces (filePart), and Tabula opens it with its own readers.
    private static final int FILE_PART = 393216;
    private static final long FILE_MOST = 200L * 1024 * 1024;
    private final java.util.ArrayList<Object[]> filesWaiting = new java.util.ArrayList<>();
    private Object[] fileGiven;
    private static final String[][] FILE_KINDS = {
            {"application/pdf", ".pdf"},
            {"application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"},
            {"text/plain", ".txt"}, {"text/html", ".html"}, {"text/markdown", ".md"}, {"text/x-markdown", ".md"}};
''', "a file given by another app waits for the page")
    once(j, '''        web.loadUrl("https://appassets.androidplatform.net/assets/carpe_diem.html");
        setContentView(web);
    }
''', '''        web.loadUrl("https://appassets.androidplatform.net/assets/carpe_diem.html");
        setContentView(web);
        takeIncoming(getIntent());
    }

    // Build 1088: a file opened with Carpe Diem while it is already open
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        takeIncoming(intent);
    }

    private void takeIncoming(Intent intent) {
        if (intent == null) return;
        Uri u = null;
        try {
            if (Intent.ACTION_VIEW.equals(intent.getAction())) u = intent.getData();
            else if (Intent.ACTION_SEND.equals(intent.getAction())) u = (Uri) intent.getParcelableExtra(Intent.EXTRA_STREAM);
        } catch (RuntimeException e) {
            u = null;
        }
        if (u == null) {
            // words shared from another app, not a file: they open in Tabula as plain text
            CharSequence words = null;
            try {
                if (Intent.ACTION_SEND.equals(intent.getAction())) words = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
            } catch (RuntimeException e) {
                words = null;
            }
            if (words == null || words.length() == 0) return;
            byte[] b = words.toString().getBytes(StandardCharsets.UTF_8);
            if (b.length > FILE_MOST) return;
            Object[] f = { java.util.UUID.randomUUID().toString(), "Shared text.txt", b };
            synchronized (filesWaiting) { filesWaiting.add(f); }
            return;
        }
        final Uri uri = u;
        final String type = intent.getType();
        new Thread(new Runnable() {
            @Override public void run() {
                try {
                    String name = incomingName(uri, type);
                    InputStream in = getContentResolver().openInputStream(uri);
                    if (in == null) return;
                    ByteArrayOutputStream out = new ByteArrayOutputStream();
                    byte[] buf = new byte[65536];
                    int n;
                    long total = 0;
                    try {
                        while ((n = in.read(buf)) > 0) {
                            total += n;
                            if (total > FILE_MOST) return;
                            out.write(buf, 0, n);
                        }
                    } finally { in.close(); }
                    Object[] f = { java.util.UUID.randomUUID().toString(), name, out.toByteArray() };
                    synchronized (filesWaiting) { filesWaiting.add(f); }
                } catch (Exception ignored) {
                    // a file that cannot be read is not offered; the app goes on as it was
                }
            }
        }).start();
    }

    private String incomingName(Uri u, String type) {
        String name = null;
        Cursor c = null;
        try {
            c = getContentResolver().query(u, new String[]{ OpenableColumns.DISPLAY_NAME }, null, null, null);
            if (c != null && c.moveToFirst()) name = c.getString(0);
        } catch (RuntimeException ignored) {
        } finally { if (c != null) c.close(); }
        if (name == null || name.length() == 0) {
            String last = u.getLastPathSegment();
            name = last == null ? "document" : last;
        }
        if (name.indexOf('.') < 0 && type != null) {
            for (String[] k : FILE_KINDS) if (k[0].equalsIgnoreCase(type)) { name = name + k[1]; break; }
        }
        return name;
    }
''', "a file opened with Carpe Diem is read and kept for the page")
    once(j, '''    public class CarpeBridge {
        @JavascriptInterface
        public boolean saveFile(final String name, final String mime, final String b64) {''', '''    public class CarpeBridge {
        // Build 1088: the page takes a file another app gave (see takeIncoming), as from the Mac and Windows apps
        @JavascriptInterface
        public String takeFile(String where) {
            synchronized (filesWaiting) {
                if (filesWaiting.isEmpty()) return "";
                fileGiven = filesWaiting.remove(0);
                byte[] b = (byte[]) fileGiven[2];
                int parts = Math.max(1, (b.length + FILE_PART - 1) / FILE_PART);
                try {
                    JSONObject o = new JSONObject();
                    o.put("key", fileGiven[0]);
                    o.put("name", fileGiven[1]);
                    o.put("parts", parts);
                    return o.toString();
                } catch (Exception e) {
                    return "";
                }
            }
        }

        @JavascriptInterface
        public String filePart(String key, int i) {
            synchronized (filesWaiting) {
                if (fileGiven == null || key == null || !key.equals(fileGiven[0])) return "";
                byte[] b = (byte[]) fileGiven[2];
                int from = i * FILE_PART;
                if (i < 0 || from >= b.length) return "";
                int to = Math.min(b.length, from + FILE_PART);
                return Base64.encodeToString(b, from, to - from, Base64.NO_WRAP);
            }
        }

        @JavascriptInterface
        public void fileOpened(String name, String how) {
            // the page says what became of the file; nothing is kept
        }

        @JavascriptInterface
        public boolean saveFile(final String name, final String mime, final String b64) {''', "the page can take the file through the bridge")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    repo = sys.argv[1]
    mac(repo); windows(repo); words(repo); ci(repo); android(repo)
