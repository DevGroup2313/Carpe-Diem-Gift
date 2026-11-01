"""build_film.py REC_DIR CUT [CRF]
From a recording made by rec_film80.js (REC_DIR/f/*.jpg, scenes.json, keys.json, meta.json) make the film's three
files for the pass: film/CUT.mp4 (H.264 High, yuv420p, faststart, 1728x1080, 30 frames a second, BT.709 tagged),
film/CUT_scenes.json and film/CUT_keys.json (where each side key's glyph is in every frame, only the changes kept).

Why 1728x1080: the largest 16:10 picture that every 1080p decoder takes (it fits 1920x1088 and 8160 macroblocks,
level 4.0), so it plays on the Fire tablets too; it stays sharp up to 864 CSS pixels at a device pixel ratio of 2."""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
FILM = os.path.join(HERE, "film")
W, H = 1728, 1080


def encode(rec, out, crf, preset="veryslow", tune="animation"):
    vf = "scale=%d:%d:flags=lanczos+accurate_rnd+full_chroma_int:out_color_matrix=bt709:out_range=tv,format=yuv420p" % (W, H)
    cmd = ["ffmpeg", "-v", "error", "-y", "-framerate", "30", "-i", os.path.join(rec, "f", "%05d.jpg"), "-vf", vf,
           "-c:v", "libx264", "-preset", preset, "-crf", str(crf), "-profile:v", "high", "-level:v", "4.0",
           "-g", "150", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
           "-movflags", "+faststart", "-an"]
    if tune:
        cmd += ["-tune", tune]
    subprocess.run(cmd + [out], check=True)
    return os.path.getsize(out)


def keys_track(rec):
    frames = json.load(open(os.path.join(rec, "keys.json"), encoding="utf-8"))
    meta = json.load(open(os.path.join(rec, "meta.json"), encoding="utf-8"))
    chars, ids, out = [], [], {}
    for fr in frames:
        for k in fr:
            if k not in ids:
                ids.append(k)
    for kid in ids:
        last, t, org = None, [], None
        for f, fr in enumerate(frames):
            e = fr.get(kid)
            if e and e.get("over") is False:
                e = None  # a sheet or a panel is over the key in the film
            if e:
                if e["c"] not in chars:
                    chars.append(e["c"])
                ci = chars.index(e["c"])
                if org is None and e.get("org"):
                    try:
                        org = [round(float(v.replace("px", "")), 2) for v in e["org"].split()[:2]]
                    except ValueError:
                        org = None
                row = [f, round(e["x"], 2), round(e["y"], 2), e["w"], e["h"], round(e["o"], 3), ci]
                if e.get("m"):
                    row += [round(v, 4) for v in e["m"]]
            else:
                row = [f, 0, 0, 0, 0, 0, 0]
            if last is None or row[1:] != last[1:]:
                t.append(row)
                last = row
        out[kid] = {"org": org, "t": t}
    return {"fps": meta["fps"], "w": meta["w"], "h": meta["h"], "vw": W, "vh": H, "frames": meta["frames"], "chars": chars,
            "style": meta.get("style", {}), "keys": out}


def main(rec, cut, crf=None):
    os.makedirs(FILM, exist_ok=True)
    meta = json.load(open(os.path.join(rec, "meta.json"), encoding="utf-8"))
    if meta.get("errors"):
        print("page errors while filming:", meta["errors"])
    scenes = json.load(open(os.path.join(rec, "scenes.json"), encoding="utf-8"))
    json.dump(scenes, open(os.path.join(FILM, cut + "_scenes.json"), "w", encoding="utf-8"), indent=1)
    kt = keys_track(rec)
    json.dump(kt, open(os.path.join(FILM, cut + "_keys.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("keys:", {k: len(v["t"]) for k, v in kt["keys"].items()}, "chars", kt["chars"])
    if crf is not None:
        n = encode(rec, os.path.join(FILM, cut + ".mp4"), crf)
        print("%s.mp4: %d bytes (%.2f MB), %d frames, %.2f s" % (cut, n, n / 1048576, meta["frames"], meta["frames"] / 30))


if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) < 2:
        sys.exit(__doc__)
    main(a[0], a[1], int(a[2]) if len(a) > 2 else None)
