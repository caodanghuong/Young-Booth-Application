# Dựng toàn bộ khung PNG in 4×6 (C:\YoungBooth-Frames). Ô ảnh TRONG SUỐT, tọa độ PHẢI khớp renderer/config.js.
# Quy tắc: lề sát (~36-48px ≈ 3-4mm, máy in hụt mép 1-2mm); khung cắt đôi thì mỗi nửa là tấm hoàn chỉnh
# (lề trái = lề phải, viền riêng), không chi tiết nào vắt qua đường cắt.
from PIL import Image, ImageDraw
OUT = 'C:/YoungBooth-Frames/'
CLEAR = (0, 0, 0, 0)

def holes(d, slots, line, off, width):
    for x, y, w, h in slots:
        if line: d.rectangle([x - off, y - off, x + w + off - 1, y + h + off - 1], outline=line, width=width)
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=CLEAR)

def dashed_v(d, x, h, color, dash=16, gap=16):
    for y in range(0, h, dash + gap):
        d.line([(x, y), (x, min(y + dash, h))], fill=color, width=2)

SLOTS = {
    'A': [(40, 140, 1120, 1540)],
    'B': [(46, 122, 808, 928), (946, 122, 808, 928)],
    'C': [(ox, y, 516, 340) for ox in (42, 642) for y in (124, 478, 832, 1186)],
    'D': [(48, 122, 804, 928), (948, 122, 804, 928)],
    'F': [(x, y, 550, 771) for y in (118, 909) for x in (40, 610)],
}

def make_a():
    im = Image.new('RGBA', (1200, 1800), (221, 229, 236, 255)); d = ImageDraw.Draw(im)
    holes(d, SLOTS['A'], (183, 197, 212, 255), 2, 2); im.save(OUT + 'grid1-dark.png')

def make_b():
    W, H = 1800, 1200
    im = Image.new('RGBA', (W, H), (243, 237, 225, 255)); d = ImageDraw.Draw(im)
    for i in range(2):
        ox = i * 900
        d.rounded_rectangle([ox + 20, 20, ox + 900 - 21, H - 21], radius=26, outline=(224, 214, 194, 255), width=2)
    holes(d, SLOTS['B'], (214, 203, 182, 255), 6, 3)
    dashed_v(d, W // 2, H, (200, 188, 165, 255)); im.save(OUT + 'wedding-4x6.png')

def make_c():
    W, H = 1200, 1800
    im = Image.new('RGBA', (W, H), (203, 176, 116, 255)); d = ImageDraw.Draw(im)
    for i in range(2):  # mỗi dải viền vàng 22px đủ 4 cạnh
        ox = i * 600
        d.rectangle([ox + 22, 22, ox + 600 - 23, H - 23], fill=(255, 255, 255, 255))
        d.line([(ox + 170, 1612), (ox + 430, 1612)], fill=(190, 185, 175, 255), width=2)
    holes(d, SLOTS['C'], (210, 210, 210, 255), 2, 2); im.save(OUT + 'grid6-navy.png')

def make_d():
    W, H = 1800, 1200
    im = Image.new('RGBA', (W, H), (247, 241, 234, 255)); d = ImageDraw.Draw(im)
    holes(d, SLOTS['D'], (214, 196, 178, 255), 12, 3)
    dashed_v(d, W // 2, H, (190, 180, 170, 255)); im.save(OUT + 'split2-ivory.png')

def make_f():
    im = Image.new('RGBA', (1200, 1800), (241, 228, 222, 255)); d = ImageDraw.Draw(im)
    holes(d, SLOTS['F'], (221, 200, 190, 255), 2, 2); im.save(OUT + 'grid4-charcoal.png')

for f in (make_a, make_b, make_c, make_d, make_f): f()
print('ok')
