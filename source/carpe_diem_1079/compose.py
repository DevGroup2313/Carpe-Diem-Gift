"""compose.py OUT.png TITLE IMG [IMG...]: the screenshots side by side, two to a row, each with its caption (the file's
name after the last underscore-free label given as IMG=Caption)."""
import sys
from PIL import Image, ImageDraw, ImageFont

out, title, items = sys.argv[1], sys.argv[2], sys.argv[3:]
pairs = [(p.split('=', 1)[0], p.split('=', 1)[1] if '=' in p else '') for p in items]
W = 1100
imgs = []
for path, cap in pairs:
    im = Image.open(path).convert('RGB')
    h = int(im.height * W / im.width)
    imgs.append((im.resize((W, h), Image.LANCZOS), cap))
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 26)
    big = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
except Exception:
    font = big = ImageFont.load_default()
pad, capH, top = 24, 44, 70
rows = [imgs[i:i + 2] for i in range(0, len(imgs), 2)]
heights = [max(im.height for im, _ in r) for r in rows]
canvas = Image.new('RGB', (pad + 2 * (W + pad), top + sum(h + capH + pad for h in heights)), (244, 241, 234))
d = ImageDraw.Draw(canvas)
d.text((pad, 20), title, fill=(27, 107, 147), font=big)
y = top
for r, h in zip(rows, heights):
    x = pad
    for im, cap in r:
        d.text((x, y + 6), cap, fill=(29, 42, 53), font=font)
        canvas.paste(im, (x, y + capH))
        x += W + pad
    y += h + capH + pad
canvas.save(out, optimize=True)
print(out, canvas.size)
