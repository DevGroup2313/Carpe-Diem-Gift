"""1060 · the install kits the owner's edition carries (cd-builders-data): each says build 1060, each file that is also
in the owner's repository is that very file (so a kit made in the app is the repository's project), and every workflow
in them runs on Node.js 24."""
import base64, gzip, hashlib, json, os, plistlib, re
import repo_gift

PASS, OLD = repo_gift.PASS, repo_gift.PREV
GIFT = "/home/user/Carpe-Diem-Gift"


def repo_twin(kit_path):
    """The repository file a kit file stands for, if any (a kit's own workflow is its own)."""
    rel = kit_path.split("/", 1)[1] if "/" in kit_path else kit_path
    if "/.github/" in "/" + rel or rel.startswith("READ ME FIRST"):
        return None
    for proj in ("Mac project/", "Windows project/", "Fire tablet project/"):
        if rel.startswith(proj):
            p = os.path.join(GIFT, rel)
            return p if os.path.isfile(p) else None
    return None


ROOMS = ("tabula", "abacus", "slides", "scriba", "fontes")


def rooms_icons(D):
    """1073: each room's own icon travels in the Mac and Windows kits, the repository's very files (rooms/*.icns for
    the rooms' own apps on the Mac, rooms/*.ico for their shortcuts and taskbar buttons on Windows)."""
    gone, n = set(), 0
    for K in D["kinds"].values():
        for proj, ext in (("Mac project", ".icns"), ("Windows project", ".ico")):
            names = [f[0] for f in K["files"] if "/%s/" % proj in "/" + f[0]]
            if not names:
                continue
            top = names[0][:names[0].index(proj + "/")] + proj + "/rooms/"
            for f in K["files"]:
                if f[0].startswith(top) and isinstance(f[1], str) and f[1].startswith("b:"):
                    gone.add(f[1][2:])
            K["files"] = [f for f in K["files"] if not f[0].startswith(top)]
            for room in ROOMS:
                raw = open(os.path.join(GIFT, proj, "rooms", room + ext), "rb").read()
                key = hashlib.sha256(raw).hexdigest()[:16]
                D["blobs"][key] = base64.b64encode(raw).decode("ascii")
                K["files"].append([top + room + ext, "b:" + key, 33188])
                n += 1
    used = set(f[1][2:] for K in D["kinds"].values() for f in K["files"] if isinstance(f[1], str) and f[1].startswith("b:"))
    used |= set(f[1][2:] for f in D["ipa"]["files"] if isinstance(f[1], str) and f[1].startswith("b:"))
    for key in gone - used:
        D["blobs"].pop(key, None)
    print("    builders: %d room icons in the kits" % n)


def apply(p, full):
    if not full:
        return
    bm = re.search(r'(<script[^>]*id="cd-builders-data"[^>]*>)(.*?)(</script>)', p.s, re.S)
    if not bm:
        raise SystemExit("the owner's edition has no builders")
    D = json.loads(bm.group(2))
    if str(D.get("pass")) != OLD:
        raise SystemExit("builders: pass %s, %s expected" % (D.get("pass"), OLD))
    D["pass"] = int(PASS) if isinstance(D.get("pass"), int) else PASS
    for K in D["kinds"].values():
        K["zip"] = re.sub(r"^Carpe Diem \d{4} ", "Carpe Diem %s " % PASS, K["zip"])
    T = json.loads(gzip.decompress(base64.b64decode(D["texts"])).decode("utf-8"))

    # a text shared by several kits keeps one key: give each changed text its own new key
    refs = []
    for K in D["kinds"].values():
        refs.extend(K["files"])
    synced, bumped = 0, 0
    newT = dict(T)

    def put(f, text):
        h = hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]
        newT[h] = text
        f[1] = "t:" + h

    for f in refs:
        if not (isinstance(f[1], str) and f[1].startswith("t:")):
            continue
        name, t = f[0], T[f[1][2:]]
        twin = repo_twin(name)
        if twin:
            new = open(twin, "rb").read().decode("utf-8")
            if new != t:
                put(f, new); synced += 1
            continue
        new = t
        if name.endswith(".yml") or name.endswith("GITHUB_WORKFLOW_paste_this.txt"):
            new = repo_gift.node24(new)
        if name.endswith("/READ ME FIRST.txt"):
            new = re.sub(r", BUILD %s: READ ME FIRST" % OLD, ", BUILD %s: READ ME FIRST" % PASS, new)
            new = new.replace("Carpe-Diem-%s-Windows-Setup.exe" % OLD, "Carpe-Diem-%s-Windows-Setup.exe" % PASS)
        if name.endswith("/BUILD_INFO.txt"):
            new = re.sub(r"Build: \d{4}-\d\d-\d\d\nPass: \d{4}\nStamp: \d+", "Build: %s\nPass: %s\nStamp: %s" % (repo_gift.DATE, PASS, repo_gift.STAMP), new)
        if name.endswith("/project.pbxproj"):
            new = re.sub(r"(CURRENT_PROJECT_VERSION|MARKETING_VERSION) = %s;" % OLD, r"\g<1> = %s;" % PASS, new)
        if name.endswith("/Info.plist") and "CFBundleShortVersionString" in new:
            new = re.sub(r"(<key>CFBundle(?:ShortVersionString|Version)</key>\s*<string>)%s(</string>)" % OLD, r"\g<1>%s\2" % PASS, new)
        if new != t:
            put(f, new); bumped += 1
    used = set(f[1][2:] for f in refs if isinstance(f[1], str) and f[1].startswith("t:"))
    T = {k: v for k, v in newT.items() if k in used}

    # the ready-made iPhone and iPad app's own version
    ipa = [f for f in D["ipa"]["files"] if f[0].endswith(".app/Info.plist")]
    if len(ipa) != 1 or not ipa[0][1].startswith("b:"):
        raise SystemExit("builders: the app's Info.plist not found once")
    key = ipa[0][1][2:]
    pl = plistlib.loads(base64.b64decode(D["blobs"][key]))
    pl["CFBundleShortVersionString"] = pl["CFBundleVersion"] = PASS
    raw = plistlib.dumps(pl, fmt=plistlib.FMT_BINARY)
    nkey = hashlib.sha256(raw).hexdigest()[:16]
    D["blobs"][nkey] = base64.b64encode(raw).decode("ascii")
    ipa[0][1] = "b:" + nkey
    still = any(f[1] == "b:" + key for K in D["kinds"].values() for f in K["files"]) or any(f[1] == "b:" + key for f in D["ipa"]["files"])
    if not still:
        del D["blobs"][key]

    rooms_icons(D)

    left = [n for n, t in ((f[0], T[f[1][2:]]) for f in refs if isinstance(f[1], str) and f[1].startswith("t:"))
            if re.search(r"uses: actions/(checkout|upload-artifact)@v4\b|uses: actions/setup-python@v5\b", t)]
    if left:
        raise SystemExit("builders: Node 20 actions left in %s" % left[:3])
    D["texts"] = base64.b64encode(gzip.compress(json.dumps(T, ensure_ascii=False, separators=(",", ":")).encode("utf-8"), mtime=0)).decode("ascii")
    body = json.dumps(D, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    p.s = p.s[:bm.start(2)] + body + p.s[bm.end(2):]
    print("    builders: pass %s; %d files from the repository, %d texts bumped" % (PASS, synced, bumped))
