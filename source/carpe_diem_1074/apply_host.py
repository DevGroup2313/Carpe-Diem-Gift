"""apply_host.py: build 1074's backups in the Mac and Windows programs of the owner's repository (Carpe-Diem-Gift).

The same block of functions goes into both programs (backup_host.txt: the places, and a backup written in pieces), just
before the room window's API; the two APIs of Carpe Diem's own window (CarpeApi and CarpeApiSingle) each gain the six
calls the page's Backup sheet makes. Run once; a second run finds the block there and stops."""
import os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
GIFT = "/home/user/Carpe-Diem-Gift"
PROGS = [os.path.join(GIFT, "Mac project", "carpe_diem_app.py"), os.path.join(GIFT, "Windows project", "carpe_diem_app.py")]

SAVE = "    def save_file(self, name, mime, data_b64):\n        return save_bytes(None, name, mime, data_b64)\n"
CALLS = SAVE + '''
    def backup_places(self):
        """Build 1074: where a backup can be kept, as labels (never a path)."""
        return backup_places()

    def backup_begin(self, place, name):
        """Build 1074: a backup begins (its place, or "ask" for a save dialog, and its name); a key for its pieces."""
        return backup_begin(getattr(self, "main_window", None), place, name)

    def backup_part(self, key, i, data_b64):
        """Build 1074: one piece of a backup, in its turn."""
        return backup_part(key, i, data_b64)

    def backup_end(self, key, keep=0, prefix=""):
        """Build 1074: the backup's last piece is on the disk; it takes its name."""
        return backup_end(key, keep, prefix)

    def backup_abort(self, key):
        """Build 1074: a backup that stopped leaves nothing behind."""
        return backup_abort(key)

    def backup_reveal(self, token):
        """Build 1074: show a backup just kept, in the Finder or File Explorer."""
        return backup_reveal(token)
'''
AT = "class TabulaWindowApi:"


def main():
    block = open(os.path.join(HERE, "backup_host.txt"), encoding="utf-8").read()
    for prog in PROGS:
        s = open(prog, encoding="utf-8").read()
        if "def backup_begin(win, place, name):" in s:
            print("already there:", prog)
            continue
        if s.count(AT) != 1 or s.count(SAVE) != 2:
            raise SystemExit("%s: anchors not found as expected (%d, %d)" % (prog, s.count(AT), s.count(SAVE)))
        s = s.replace(AT, block + AT)
        s = s.replace(SAVE, CALLS)
        compile(s, prog, "exec")
        open(prog, "w", encoding="utf-8").write(s)
        print("backups added:", prog)


if __name__ == "__main__":
    main()
