"""The rooms' icon files from render.js's pictures: .ico for Windows, .icns for the Mac.

Small sizes (the taskbar, title bars, the Start menu's lists, the Finder's lists and Open With) are the key's colours,
with no letter (Scriba's and Fontes's symbols stay); larger sizes are the full key with the room's name. Windows frames under 64 px are 32-bit bitmaps, which every
part of Windows reads; larger ones are PNG, which Windows reads from Vista on. The Mac's go up to 256 px: the Dock's
largest icon is 128 points, 256 px on a Retina screen."""
import io, os, struct, sys
from PIL import Image

ROOMS = ['tabula', 'abacus', 'slides', 'scriba', 'fontes']
PLAIN_WIN = (16, 20, 24, 30, 32, 36, 40)      # taskbar at 100 to 175 per cent, title bars, lists
FULL_WIN = (48, 64, 96, 128, 256)              # desktop shortcuts, Explorer, the Start menu's tiles


def png(img):
    b = io.BytesIO()
    img.save(b, 'PNG', optimize=True)
    return b.getvalue()


def bmp_frame(img):
    """A 32-bit icon frame: BITMAPINFOHEADER (height doubled for the mask), BGRA rows bottom up, then a mask of zeros."""
    w, h = img.size
    px = img.convert('RGBA').tobytes()
    rows = []
    for y in range(h - 1, -1, -1):
        row = px[y * w * 4:(y + 1) * w * 4]
        out = bytearray(len(row))
        out[0::4] = row[2::4]
        out[1::4] = row[1::4]
        out[2::4] = row[0::4]
        out[3::4] = row[3::4]
        rows.append(bytes(out))
    mask_row = ((w + 31) // 32) * 4
    head = struct.pack('<IiiHHIIiiII', 40, w, h * 2, 1, 32, 0, w * h * 4 + mask_row * h, 0, 0, 0, 0)
    return head + b''.join(rows) + b'\0' * (mask_row * h)


def write_ico(path, frames):
    """frames: [(size, Image)] in increasing size."""
    datas = [png(im) if s >= 64 else bmp_frame(im) for s, im in frames]
    out = struct.pack('<HHH', 0, 1, len(frames))
    off = 6 + 16 * len(frames)
    for (s, im), d in zip(frames, datas):
        out += struct.pack('<BBBBHHII', s % 256, s % 256, 0, 0, 1, 32, len(d), off)
        off += len(d)
    with open(path, 'wb') as fh:
        fh.write(out + b''.join(datas))


def write_icns(path, entries):
    """entries: [(type, png bytes)]."""
    body = b''.join(t + struct.pack('>I', 8 + len(d)) + d for t, d in entries)
    with open(path, 'wb') as fh:
        fh.write(b'icns' + struct.pack('>I', 8 + len(body)) + body)


def main(here):
    out = os.path.join(here, 'out')
    os.makedirs(out, exist_ok=True)
    for k in ROOMS:
        mac = Image.open(os.path.join(here, '%s-mac.png' % k)).convert('RGBA')
        win = Image.open(os.path.join(here, '%s-win.png' % k)).convert('RGBA')
        plain = Image.open(os.path.join(here, '%s-small.png' % k)).convert('RGBA')
        size = lambda im, s: im.resize((s, s), Image.LANCZOS)
        frames = [(s, size(plain, s)) for s in PLAIN_WIN] + [(s, size(win, s)) for s in FULL_WIN]
        write_ico(os.path.join(out, '%s.ico' % k), frames)
        # the Mac: 16 and 32 px (16 points, at 1x and 2x: lists, Open With, the menu bar) plain; 32 points and up, the
        # full key, which the Dock shows
        mp = lambda im, s: png(size(im, s))
        write_icns(os.path.join(out, '%s.icns' % k), [
            (b'icp4', mp(plain, 16)), (b'icp5', mp(plain, 32)), (b'ic11', mp(plain, 32)),
            (b'icp6', mp(mac, 64)), (b'ic12', mp(mac, 64)),
            (b'ic07', mp(mac, 128)), (b'ic13', mp(mac, 256)),
            (b'ic08', mp(mac, 256)),
        ])
        print(k, os.path.getsize(os.path.join(out, '%s.ico' % k)), os.path.getsize(os.path.join(out, '%s.icns' % k)))


if __name__ == '__main__':
    main(os.path.dirname(os.path.abspath(sys.argv[0])))
