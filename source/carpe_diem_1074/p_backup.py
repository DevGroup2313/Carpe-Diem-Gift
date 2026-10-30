"""1074 · backups: compressed, sealed if you wish, kept in pieces with retries and progress, every day in the apps.

The owner's list: backups with retry, progress, compression, an encrypted cloud option, room for large files, and a
Reload button. What the Backup panel did until now: one JSON text, built whole in memory and offered as a download,
with no progress, no second try and nothing sealed; a backup with hours of Scriba's recordings could fail on a tablet
without a word, and the Mac and Windows apps kept nothing on their own.

Now (backup.js, the sheet; the apps' own backup_* calls, in the Mac and Windows programs):
* Back up now gathers all your work (the study, Tabula's documents and its large ones, Abacus, Imago, Scriba's notes and
  recordings, Fontes, the Forge's files, and the desk from the larger store when the small one was full), compresses it
  (gzip) and, if you wish, seals it with a passphrase (AES-256-GCM, its key drawn from the passphrase by PBKDF2-SHA-256,
  600,000 rounds); the passphrase is never kept;
* in the Mac and Windows apps it is written to Documents › Carpe Diem › Backups or to a cloud folder found on the
  computer (iCloud Drive, OneDrive, Google Drive, Dropbox, Box: always sealed there), in pieces of 768 KB, each tried
  three times, with the share written shown as it goes; nothing is named until the last piece is on the disk, so a
  stopped backup leaves no half file; elsewhere the browser saves it, or offers it as a download;
* Restore reads a sealed, compressed or plain backup (the old .json ones too), says what it holds, keeps a copy of your
  present work first, closes the rooms with their work saved, and then Merge or Replace, and Carpe Diem starts again;
* Every day…, in the apps: a backup once a day while Carpe Diem is open (never while you are typing), the last ten
  kept, three failures in a row said aloud;
* each failure says what happened, with Try again, Save another way and Reload Carpe Diem.

Here, in Carpe Diem's own backup block (cd-jewel-js): Tabula's store of large documents joins the stores a backup
carries; the block hands the sheet what it needs (window.__cdBackupCore); the Backup panel's words say what it now does,
in English and in French, the same words the sheet keeps, so the two never write over each other."""
import os

HERE = os.path.dirname(os.path.abspath(__file__))

DBS_OLD = "var DBS = ['scriba_db', 'cd-forge-host'];"
DBS_NEW = "var DBS = ['scriba_db', 'cd-forge-host', 'tabula-big'];"

CORE_AT = """  document.addEventListener('click', function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('button') : null;
    if (!b) return;
    var t = (b.textContent || '').trim();
    if (/Export to file|Exporter vers/i.test(t) || /^\\u2193 Export/i.test(t)) {"""
CORE_ADD = """  /* 1074: what the Backup sheet (cd-backup-1074) works with. The desk is taken from the larger store (cd-room) when the
     last save did not fit in the small one, so a backup always carries the newest desk. */
  function deskNow() {
    try {
      var R = window.__cdRoomApi; if (!R || typeof R.get !== 'function') return Promise.resolve(null);
      return R.get().then(function (rec) { return rec && rec.lsOk === false && typeof rec.raw === 'string' && rec.raw.length > 20 ? rec.raw : null; }, function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }
  function backupObj() {
    var idb = {};
    return DBS.reduce(function (p, n) { return p.then(function () { return dumpDb(n).then(function (d) { if (d) idb[n] = d; }); }); }, Promise.resolve())
      .then(deskNow).then(function (desk) {
        var data = keysNow();
        if (desk && typeof STORAGE_KEY !== 'undefined') data[STORAGE_KEY] = desk;
        return { format: 'carpe-diem-backup', v: 3, when: new Date().toISOString(), data: data, idb: idb };
      });
  }
  window.__cdBackupCore = { backupObj: backupObj, KEEP: KEEP, DBS: DBS, restoreDb: restoreDb, mergeVal: mergeVal, holds: holds, safeExport: doExport };
"""

LABELS = [
    ('<button id="export-btn" class="btn btn-soft btn-sm">↓ Export to file</button>',
     '<button id="export-btn" class="btn btn-soft btn-sm">↓ Back up now</button>'),
    ('<button id="import-btn" class="btn btn-ghost btn-sm">↑ Import from file</button>',
     '<button id="import-btn" class="btn btn-ghost btn-sm">↑ Restore from a backup</button>'),
    ('var _ex = document.getElementById("export-btn"); if (_ex) _ex.textContent = (state.lang === "fr") ? "↓ Exporter vers un fichier" : "↓ Export to file";',
     'var _ex = document.getElementById("export-btn"); if (_ex) _ex.textContent = (state.lang === "fr") ? "↓ Sauvegarder maintenant" : "↓ Back up now";'),
    ('var _im = document.getElementById("import-btn"); if (_im) _im.textContent = (state.lang === "fr") ? "↑ Importer depuis un fichier" : "↑ Import from file";',
     'var _im = document.getElementById("import-btn"); if (_im) _im.textContent = (state.lang === "fr") ? "↑ Restaurer une sauvegarde" : "↑ Restore from a backup";'),
]
DESC_EN_OLD = "This file is fully self-contained: save it anywhere, email it, or open it on any device with a browser, no internet needed. Each device keeps its own data on that device. To move your progress between devices, Export a JSON snapshot here and Import it on the other device. This same Export also doubles as a backup you can keep."
DESC_EN = ("Back up now keeps all your work in one compressed file, sealed with a passphrase if you wish: your study, Tabula’s "
           "documents, Abacus, Imago, Scriba’s notes and recordings, Fontes and the Forge’s files. Restore reads one back, on "
           "this device or another, after keeping a copy of your work as it is. In the Mac and Windows apps, Every day… keeps "
           "a backup each day in Documents or a cloud folder. Each device keeps its own work: a backup is how it travels.")
DESC_FR_OLD = "Ce fichier est entièrement autonome : enregistrez-le où vous voulez, envoyez-le par courriel, ou ouvrez-le sur n’importe quel appareil doté d’un navigateur, sans connexion. Chaque appareil conserve ses propres données sur cet appareil. Pour déplacer votre progression d’un appareil à l’autre, exportez ici un instantané JSON et importez-le sur l’autre appareil. Cette même exportation transporte aussi vos données et vous en garde une sauvegarde."
DESC_FR = ("Sauvegarder maintenant garde tout votre travail dans un seul fichier compressé, scellé par une phrase secrète si vous "
           "le souhaitez : votre étude, les documents de Tabula, Abacus, Imago, les notes et enregistrements de Scriba, Fontes et "
           "les fichiers de la Forge. Restaurer en relit une, sur cet appareil ou un autre, après avoir gardé une copie de votre "
           "travail tel qu’il est. Dans les applications Mac et Windows, Chaque jour… garde une sauvegarde par jour dans Documents "
           "ou un dossier en ligne. Chaque appareil garde son propre travail : une sauvegarde est la façon dont il voyage.")

CSS = """<style id="cd-backup-1074-css">
.cd-bk-wrap{position:fixed;inset:0;z-index:100500;background:rgba(16,30,40,.42);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}
.cd-bk-card{width:min(560px,100%);max-height:88vh;overflow:auto;box-sizing:border-box;background:#fffdf8;color:#1d2a35;border:1px solid rgba(27,107,147,.32);border-radius:16px;padding:20px 22px 16px;
  box-shadow:0 3px 0 rgba(16,42,58,.12),0 18px 44px rgba(16,42,58,.24);font:400 13.5px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
.cd-bk-card h2{margin:0 0 10px;font:600 19px/1.25 var(--cd-serif,Georgia,serif);color:#173f57}
.cd-bk-body ul{margin:4px 0 10px;padding-left:20px}
.cd-bk-note{margin:8px 0;font-size:12.5px;color:rgba(29,42,53,.78)}
.cd-bk-where{border:1px solid rgba(27,107,147,.22);border-radius:12px;margin:10px 0;padding:8px 12px 10px}
.cd-bk-where legend{padding:0 6px;font-weight:600;font-size:12.5px;color:#173f57}
.cd-bk-where label,.cd-bk-check{display:flex;align-items:center;gap:8px;margin:5px 0;cursor:pointer}
.cd-bk-where input:disabled+*,.cd-bk-where label:has(input:disabled){opacity:.55;cursor:default}
.cd-bk-tag{display:inline-block;font-size:11px;padding:1px 7px;border-radius:999px;background:rgba(201,162,74,.18);color:#7a5a1e;border:1px solid rgba(201,162,74,.45)}
.cd-bk-pass{display:grid;gap:8px;margin:6px 0 4px 26px}
.cd-bk-pass[hidden]{display:none}
.cd-bk-pass label{display:grid;gap:4px;font-size:12.5px;font-weight:600}
.cd-bk-card input[type=password],.cd-bk-text{width:100%;box-sizing:border-box;padding:9px 11px;border-radius:10px;border:1px solid rgba(27,107,147,.32);background:#fff;color:#1d2a35;font:14px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
.cd-bk-text{height:180px;font:11.5px/1.4 ui-monospace,Menlo,Consolas,monospace;resize:vertical;margin-top:6px}
.cd-bk-card input:focus-visible,.cd-bk-card button:focus-visible{outline:2px solid #1B6B93;outline-offset:2px}
.cd-bk-bar{height:7px;border-radius:99px;background:rgba(27,107,147,.14);overflow:hidden;margin:12px 0 4px}
.cd-bk-bar[hidden]{display:none}
.cd-bk-fill{height:100%;width:0;border-radius:inherit;background:linear-gradient(90deg,#3f8fb8,#1B6B93);transition:width .3s ease}
.cd-bk-say{min-height:1.4em;margin:8px 0 0;font-size:13px;color:#2c4a5e}
.cd-bk-say.cd-bk-bad{color:#9a3b2e}
.cd-bk-keys{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;margin-top:12px}
.cd-bk-keys button,.cd-bk-change{font:600 13px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;padding:9px 15px;border-radius:999px;cursor:pointer;border:1px solid rgba(27,107,147,.4);background:#fff;color:#1B6B93}
.cd-bk-keys button.cd-bk-go{background:#1B6B93;border-color:#1B6B93;color:#fff;box-shadow:0 2px 0 #124c69}
.cd-bk-change{padding:4px 10px;font-size:12px;margin-left:4px}
.cd-bk-busy .cd-bk-keys button{opacity:.55;pointer-events:none}
.cd-bk-status{font-size:11.5px;color:var(--text-secondary,#4a5a66);margin:2px 0 8px}
.cd-bk-status[hidden]{display:none}
body[data-theme="night"] .cd-bk-card{background:#1b2027;color:#e8eef4;border-color:rgba(91,174,219,.3)}
body[data-theme="night"] .cd-bk-card h2,body[data-theme="night"] .cd-bk-where legend{color:#e8eef4}
body[data-theme="night"] .cd-bk-note,body[data-theme="night"] .cd-bk-say{color:rgba(232,238,244,.8)}
body[data-theme="night"] .cd-bk-say.cd-bk-bad{color:#e59a8b}
body[data-theme="night"] .cd-bk-card input[type=password],body[data-theme="night"] .cd-bk-text{background:#12171d;color:#e8eef4;border-color:rgba(91,174,219,.3)}
body[data-theme="night"] .cd-bk-keys button,body[data-theme="night"] .cd-bk-change{background:#232a33;color:#cfe6f3;border-color:rgba(91,174,219,.35)}
body[data-theme="night"] .cd-bk-keys button.cd-bk-go{background:#2a7fa9;border-color:#2a7fa9;color:#fff;box-shadow:0 2px 0 #0f4560}
@media (prefers-reduced-motion:reduce){.cd-bk-fill{transition:none}}
</style>"""


def apply(p, full):
    a, b = p.block("cd-jewel-js")
    blk = p.s[a:b]
    for o, n, what in ((DBS_OLD, DBS_NEW, "the stores a backup carries"), (CORE_AT, CORE_ADD + CORE_AT, "the old Export key's handler")):
        if blk.count(o) != 1:
            raise SystemExit("backup: %s found %d times" % (what, blk.count(o)))
        blk = blk.replace(o, n)
    for must in ("function dumpDb(", "function restoreDb(", "function mergeVal(", "function holds(", "function doExport(", "function keysNow("):
        if must not in blk:
            raise SystemExit("backup: %s is not in the backup block" % must)
    js = open(os.path.join(HERE, "backup.js"), encoding="utf-8").read()
    if "</script" in js:
        raise SystemExit("backup.js holds a closing script tag")
    p.s = p.s[:a] + blk + "\n" + CSS + '\n<script id="cd-backup-1074">\n' + js + "\n</script>" + p.s[b:]
    for o, n in LABELS:
        p.rep(o, n)
    p.rep('_bd.textContent = (state.lang === "fr") ? "' + DESC_FR_OLD + '" : "' + DESC_EN_OLD + '";',
          '_bd.textContent = (state.lang === "fr") ? "' + DESC_FR + '" : "' + DESC_EN + '";')
    old_html = '<div id="backup-desc" style="font-size: 11px; color: var(--text-tertiary); line-height: 1.5;">\n      ' + DESC_EN_OLD + '\n    </div>'
    p.rep(old_html, old_html.replace(DESC_EN_OLD, DESC_EN))
    print("    backups: compressed, sealed if wished, in pieces with retries; every day in the apps; Tabula's large store carried")
