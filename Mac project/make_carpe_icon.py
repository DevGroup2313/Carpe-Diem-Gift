#!/usr/bin/env python3
# CARPE DIEM  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
# NO LICENCE IS GRANTED. See LICENCE.txt.
"""make_carpe_icon.py: the app's icons from one picture of the seal.

Standard library only; Pillow (PIL) is used when it is installed and is needed for
everything but a one-entry .icns.

  python3 make_carpe_icon.py icns carpe_diem.png [carpe_diem.icns]
      The Mac icon from a 1024 x 1024 PNG with transparency: icp4, icp5, icp6, ic07..ic14
      (16 to 1024 px, each smaller size resampled with LANCZOS, as The Forge's icns is).
      Without Pillow only ic10 (the 1024) is written; macOS scales it, less finely.
  python3 make_carpe_icon.py crop seal_day_2048.png carpe_diem.png [--fill 0.96] [--pad 2]
      A 1024 icon from a render of the seal SVG (the page's cdSealArt(px, dark, {layered: true})
      drawn with its viewBox widened by --pad units on each side): keeps the medallion (the disc
      and its lower lip), drops the faint halo outside it, and centres the disc at --fill of the
      canvas width. The Forge's seal fills about 96%; the old Carpe Diem icon filled 90%, which is
      why it looked small in its square.
  python3 make_carpe_icon.py fire carpe_diem.png "Fire tablet project/app/src/main/res"
      The Fire launcher PNGs: mipmap-mdpi 48, hdpi 72, xhdpi 96, xxhdpi 144, xxxhdpi 192 and
      xxxhdpi/ic_launcher_512.
  python3 make_carpe_icon.py ios seal_night_2048.png OUTDIR [--fill 0.8164] [--pad 2]
      The iPhone and iPad icon's dark and tinted faces (icon-1024-dark.png on navy #0f1b26,
      icon-1024-tinted.png as a greyscale on black), both 1024 RGB without transparency, the
      disc at --fill of the width (the light icon-1024.png's disc is 836 px of 1024).
  python3 make_carpe_icon.py check FILE...
      Prints each PNG's or ICNS's sizes, mode and how much of the canvas the opaque part fills.
  python3 make_carpe_icon.py seal "dist/Carpe Diem.app" carpe_diem.png
      macOS only: gives the app its own seal as a CUSTOM icon (the Finder "Get Info" kind).

Why the custom icon. macOS 26 draws an app's bundle icon inside a grey rounded square and shrinks
it when the icon is not Apple's own squircle shape; a custom icon set with NSWorkspace
setIcon:forFile:options: (the one Finder's Get Info sets) is drawn as it is. The Forge's build
script does this after PyInstaller (its seal_icon function); Carpe Diem does it in three places:
"Build Mac App.command" (seal_icon), the GitHub workflow step "Give the app its own seal as a
custom icon" (the zip is made with ditto --sequesterRsrc, which keeps the icon), and the launcher
itself (show_seal_in_dock sets it once on a writable bundle that has none). The icon lives in a
file named "Icon\\r" at the bundle root plus a Finder flag on the bundle. To undo it on a Mac:
Get Info on the app, click the small icon at the top left, press Delete.

The osascript used by the build script and the workflow (JavaScript for Automation):
    osascript -l JavaScript - "/path/carpe_diem.png" "/path/Carpe Diem.app" <<'JS'
    ObjC.import('AppKit');
    function run(a){var i=$.NSImage.alloc.initWithContentsOfFile(a[0]);if(!i||i.isNil())return 'seal: no picture';
      return $.NSWorkspace.sharedWorkspace.setIconForFileOptions(i,a[1],0)?'seal: set':'seal: refused';}
    JS
"""
import os
import struct
import subprocess
import sys

try:
    from PIL import Image, ImageDraw
except Exception:  # Pillow is optional
    Image = None
    ImageDraw = None

PNG_SIG = b"\x89PNG\r\n\x1a\n"

# icns entry types for PNG payloads, by pixel size; the second of a pair is the @2x name
ICNS_TYPES = {16: ["icp4"], 32: ["icp5", "ic11"], 64: ["icp6", "ic12"], 128: ["ic07"],
              256: ["ic08", "ic13"], 512: ["ic09", "ic14"], 1024: ["ic10"]}
ICNS_ORDER = [16, 32, 64, 128, 256, 512, 1024]

# the medallion in the seal's own 0..100 units: the disc (rim outer edge r 49.725) and the
# plate's edge circle, set 0.95 lower, which shows as a lip under the disc
DISC = (50.0, 50.0, 49.75)
LIP = (50.0, 50.95, 49.55)

JXA = ("ObjC.import('AppKit');"
       "function run(a){var i=$.NSImage.alloc.initWithContentsOfFile(a[0]);if(!i||i.isNil())return 'seal: no picture';"
       "return $.NSWorkspace.sharedWorkspace.setIconForFileOptions(i,a[1],0)?'seal: set':'seal: refused';}")


def png_size(data):
    """(width, height) of PNG bytes, from the IHDR chunk."""
    if data[:8] != PNG_SIG or data[12:16] != b"IHDR":
        raise ValueError("not a PNG")
    return struct.unpack(">II", data[16:24])


def icns_bytes(entries):
    """entries: [(type, png_bytes)] -> the .icns file bytes ('icns', total length, then type, length, payload)."""
    body = b"".join(t.encode("ascii") + struct.pack(">I", 8 + len(d)) + d for t, d in entries)
    return b"icns" + struct.pack(">I", 8 + len(body)) + body


def read_icns(data):
    """[(type, length, payload)] of an .icns file."""
    if data[:4] != b"icns":
        raise ValueError("not an icns file")
    out, off = [], 8
    while off + 8 <= len(data):
        t = data[off:off + 4].decode("latin1")
        n = struct.unpack(">I", data[off + 4:off + 8])[0]
        out.append((t, n - 8, data[off + 8:off + n]))
        off += n
    return out


def need_pil(what):
    if Image is None:
        sys.exit("Pillow is needed for %s: python3 -m pip install pillow" % what)


def png_of(img):
    import io
    b = io.BytesIO()
    img.save(b, "PNG", optimize=True)
    return b.getvalue()


def cmd_icns(src, dst=None):
    dst = dst or os.path.splitext(src)[0] + ".icns"
    data = open(src, "rb").read()
    w, h = png_size(data)
    if (w, h) != (1024, 1024):
        sys.exit("the source must be 1024 x 1024, this one is %d x %d" % (w, h))
    entries = []
    if Image is None:
        print("Pillow is not installed: writing the 1024 entry only (ic10)")
        entries.append(("ic10", data))
    else:
        big = Image.open(src).convert("RGBA")
        for px in ICNS_ORDER:
            im = big if px == 1024 else big.resize((px, px), Image.LANCZOS)
            payload = png_of(im)
            for t in ICNS_TYPES[px]:
                entries.append((t, payload))
    open(dst, "wb").write(icns_bytes(entries))
    print("wrote %s: %d entries, %d bytes" % (dst, len(entries), os.path.getsize(dst)))
    for t, n, _ in read_icns(open(dst, "rb").read()):
        print("  %s %7d bytes" % (t, n))


def medallion_mask(size, pad, scale=4):
    """An antialiased mask of the medallion (disc plus lip) for a render of `size` px whose viewBox
    runs from -pad to 100+pad: drawn at `scale` times the size, then brought down with LANCZOS."""
    big = size * scale
    k = big / (100.0 + 2 * pad)
    m = Image.new("L", (big, big), 0)
    d = ImageDraw.Draw(m)
    for cx, cy, r in (DISC, LIP):
        d.ellipse([(cx + pad - r) * k, (cy + pad - r) * k, (cx + pad + r) * k, (cy + pad + r) * k], fill=255)
    return m.resize((size, size), Image.LANCZOS)


def masked_render(src, pad):
    """The render with everything outside the medallion made transparent. Returns (image, px per unit)."""
    im = Image.open(src).convert("RGBA")
    if im.size[0] != im.size[1]:
        sys.exit("the render must be square")
    size = im.size[0]
    m = medallion_mask(size, pad)
    r, g, b, a = im.split()
    from PIL import ImageChops
    a = ImageChops.multiply(a, m)
    return Image.merge("RGBA", (r, g, b, a)), size / (100.0 + 2 * pad)


def place(seal, pad, canvas, fill):
    """Resizes the masked render so the disc is `fill` of `canvas` and centres the disc on the canvas.
    Returns (resized image, paste offset)."""
    units = 100.0 + 2 * pad
    disc_w = 2 * DISC[2]
    k = canvas * fill / disc_w                      # px per unit on the canvas
    whole = int(round(units * k))
    im = seal.resize((whole, whole), Image.LANCZOS)
    off = int(round(canvas / 2.0 - (DISC[0] + pad) * k))
    return im, off


def cmd_crop(src, dst, fill=0.96, pad=2.0):
    need_pil("crop")
    seal, _ = masked_render(src, pad)
    im, off = place(seal, pad, 1024, fill)
    out = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    out.paste(im, (off, off), im)
    out.save(dst, "PNG", optimize=True)
    print("wrote %s" % dst)
    cmd_check(dst)


def cmd_fire(src, res_dir):
    need_pil("fire")
    big = Image.open(src).convert("RGBA")
    if big.size != (1024, 1024):
        sys.exit("the source must be 1024 x 1024")
    for folder, px in (("mdpi", 48), ("hdpi", 72), ("xhdpi", 96), ("xxhdpi", 144), ("xxxhdpi", 192)):
        d = os.path.join(res_dir, "mipmap-" + folder)
        os.makedirs(d, exist_ok=True)
        p = os.path.join(d, "ic_launcher.png")
        big.resize((px, px), Image.LANCZOS).save(p, "PNG", optimize=True)
        print("wrote %s" % p)
    p = os.path.join(res_dir, "mipmap-xxxhdpi", "ic_launcher_512.png")
    big.resize((512, 512), Image.LANCZOS).save(p, "PNG", optimize=True)
    print("wrote %s" % p)


def cmd_ios(src, out_dir, fill=836.0 / 1024, pad=2.0):
    need_pil("ios")
    os.makedirs(out_dir, exist_ok=True)
    seal, _ = masked_render(src, pad)
    im, off = place(seal, pad, 1024, fill)
    # dark: the night seal on the app's night navy, edge to edge (iOS rounds the corners itself)
    dark = Image.new("RGBA", (1024, 1024), (0x0f, 0x1b, 0x26, 255))
    dark.paste(im, (off, off), im)
    p = os.path.join(out_dir, "icon-1024-dark.png")
    dark.convert("RGB").save(p, "PNG", optimize=True)
    print("wrote %s" % p)
    # tinted: iOS tints a greyscale picture; a dark ground with the mark in light greys
    grey = im.convert("LA")
    l, a = grey.split()
    tinted = Image.new("L", (1024, 1024), 0)
    tinted.paste(l, (off, off), a)
    p = os.path.join(out_dir, "icon-1024-tinted.png")
    tinted.convert("RGB").save(p, "PNG", optimize=True)
    print("wrote %s" % p)
    cmd_check(os.path.join(out_dir, "icon-1024-dark.png"), os.path.join(out_dir, "icon-1024-tinted.png"))


def describe_png(data, indent="  "):
    w, h = png_size(data)
    if Image is None:
        return "%s%d x %d" % (indent, w, h)
    import io
    im = Image.open(io.BytesIO(data))
    s = "%s%d x %d %s" % (indent, w, h, im.mode)
    if im.mode == "RGBA":
        a = im.split()[3]
        bb = a.point(lambda v: 255 if v > 128 else 0).getbbox()
        soft = a.getbbox()
        if bb:
            s += "  opaque %d..%d x %d..%d, fills %.1f%% x %.1f%%" % (bb[0], bb[2], bb[1], bb[3], 100.0 * (bb[2] - bb[0]) / w, 100.0 * (bb[3] - bb[1]) / h)
        if soft and soft != bb:
            s += "  (any alpha %d..%d x %d..%d)" % (soft[0], soft[2], soft[1], soft[3])
    elif im.mode in ("RGB", "L"):
        from PIL import ImageChops
        bg = im.getpixel((0, 0))
        diff = ImageChops.difference(im, Image.new(im.mode, im.size, bg)).convert("L")
        bb = diff.point(lambda v: 255 if v > 48 else 0).getbbox()
        if bb:
            s += "  ground %s, mark %d..%d x %d..%d, fills %.1f%% x %.1f%%" % (bg, bb[0], bb[2], bb[1], bb[3], 100.0 * (bb[2] - bb[0]) / w, 100.0 * (bb[3] - bb[1]) / h)
    return s


def cmd_check(*files):
    for f in files:
        data = open(f, "rb").read()
        print(f)
        if data[:4] == b"icns":
            for t, n, payload in read_icns(data):
                print("  %s %7d bytes%s" % (t, n, (" " + describe_png(payload, "").strip()) if payload[:8] == PNG_SIG else ""))
        else:
            print(describe_png(data))


def cmd_seal(app, png):
    if sys.platform != "darwin":
        sys.exit("the custom icon can only be set on a Mac")
    r = subprocess.run(["osascript", "-l", "JavaScript", "-", os.path.abspath(png), os.path.abspath(app)],
                       input=JXA, capture_output=True, text=True)
    print((r.stdout or r.stderr).strip() or ("osascript exit %d" % r.returncode))


def main(argv):
    opts, args = {}, []
    i = 0
    while i < len(argv):
        if argv[i].startswith("--") and i + 1 < len(argv):
            opts[argv[i][2:]] = argv[i + 1]
            i += 2
        else:
            args.append(argv[i])
            i += 1
    if not args:
        print(__doc__)
        return 1
    cmd, rest = args[0], args[1:]
    if cmd == "icns" and 1 <= len(rest) <= 2:
        cmd_icns(*rest)
    elif cmd == "crop" and len(rest) == 2:
        cmd_crop(rest[0], rest[1], float(opts.get("fill", 0.96)), float(opts.get("pad", 2)))
    elif cmd == "fire" and len(rest) == 2:
        cmd_fire(*rest)
    elif cmd == "ios" and len(rest) == 2:
        cmd_ios(rest[0], rest[1], float(opts.get("fill", 836.0 / 1024)), float(opts.get("pad", 2)))
    elif cmd == "check" and rest:
        cmd_check(*rest)
    elif cmd == "seal" and len(rest) == 2:
        cmd_seal(*rest)
    else:
        print(__doc__)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
