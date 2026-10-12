# Dựng toàn bộ khung PNG in 4×6 (C:\YoungBooth-Frames). Ô ảnh TRONG SUỐT, tọa độ PHẢI khớp renderer/config.js.
# Quy tắc: lề sát (~36-48px ≈ 3-4mm, máy in hụt mép 1-2mm); khung cắt đôi thì mỗi nửa là tấm hoàn chỉnh
# (lề trái = lề phải, viền riêng), không chi tiết nào vắt qua đường cắt.
#
# Chạy:  py scripts/make-frames.py               → dựng lại TẤT CẢ khung (như trước)
#        py scripts/make-frames.py youngbooth    → chỉ dựng khung được chọn (a b c d f youngbooth)
#        thêm --out <thư mục> để xuất ra chỗ khác (vd xem thử trước khi ghi vào C:\YoungBooth-Frames)
import math, os, shutil, sys, datetime
from PIL import Image, ImageDraw, ImageFont
OUT = 'C:/YoungBooth-Frames/'
CLEAR = (0, 0, 0, 0)

def save_with_backup(im, name):
    """Lưu khung; nếu đã có file cũ thì chép sang _backup-YYYYMMDD trước khi ghi đè."""
    dst = os.path.join(OUT, name)
    if os.path.exists(dst):
        bdir = os.path.join(OUT, '_backup-' + datetime.date.today().strftime('%Y%m%d'))
        os.makedirs(bdir, exist_ok=True)
        shutil.copy2(dst, os.path.join(bdir, name))
    im.save(dst)

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
    'C': [(ox, y, 516, 340) for ox in (42, 642) for y in (124, 478, 832, 1186)],  # khung C cũ (grid6-navy.png), không còn dùng
    'D': [(48, 122, 804, 928), (948, 122, 804, 928)],
    'F': [(x, y, 550, 771) for y in (118, 909) for x in (40, 610)],
    # YoungBooth (dùng cho Layout C "Nhật Ký"): dải đôi 2×6, 4 ô 500×330 (3:2) / dải. Khớp mode 'C' trong config.js.
    'YB': [(ox + 50, y, 500, 330) for ox in (0, 600) for y in (112, 468, 824, 1180)],
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

# ---------------------------------------------------------------------------
# YoungBooth — dải 2×6 phong cách chocolate (nền len kem, khung tem nâu, chocolate chảy).
# Vẽ 1 dải 600×1800 ở độ phân giải ×3 rồi thu nhỏ (viền mịn), dán 2 lần cạnh nhau.
# Chữ "YoungBooth" + ngày + QR do app vẽ lên (texts[]/qr trong config.js) → sửa được trong Cài đặt.
CREAM = (243, 235, 221, 255)     # #F3EBDD
KNIT = (222, 207, 182, 120)      # hoạ tiết len, rất nhạt
CHOCO = (90, 58, 46, 255)        # #5A3A2E
CHOCO_D = (66, 41, 32, 255)
CHOCO_L = (128, 88, 68, 255)
MILK = (150, 102, 72, 255)       # gấu sữa
TAN = (214, 178, 140, 255)
YB_PANEL = (36, 98, 564, 1524)   # khung tem: ô ảnh + viền 14px; cách mép/đường cắt đúng 36px

def make_youngbooth():
    S = 3
    W, H = 600, 1800
    sc = lambda *v: [round(a * S) for a in v]
    strip_slots = [s for s in SLOTS['YB'] if s[0] < 600]

    base = Image.new('RGBA', (W * S, H * S), CREAM)

    # 1) Hoạ tiết len đan: lưới mũi "V" + rãnh dọc, rất nhạt.
    knit = Image.new('RGBA', base.size, CLEAR); kd = ImageDraw.Draw(knit)
    for i, cx in enumerate(range(15, W, 30)):
        if i % 5 == 4:  # rãnh giữa các bó len
            kd.line(sc(cx, 0, cx, H), fill=KNIT, width=2 * S)
            continue
        for y in range(-6, H, 22):
            kd.line(sc(cx - 8, y, cx, y + 11), fill=KNIT, width=5 * S)
            kd.line(sc(cx + 8, y, cx, y + 11), fill=KNIT, width=5 * S)
    base.alpha_composite(knit)
    d = ImageDraw.Draw(base)

    # 2) Khung tem nâu chocolate: mép răng cưa (đục lỗ tròn dọc 4 cạnh).
    x0, y0, x1, y1 = YB_PANEL
    pm = Image.new('L', base.size, 0); pd = ImageDraw.Draw(pm)
    pd.rectangle(sc(x0, y0, x1, y1), fill=255)
    r = 7
    for x in range(x0, x1 + 1, 21):
        for y in (y0, y1):
            pd.ellipse(sc(x - r, y - r, x + r, y + r), fill=0)
    for y in range(y0, y1 + 1, 21):
        for x in (x0, x1):
            pd.ellipse(sc(x - r, y - r, x + r, y + r), fill=0)
    base.paste(Image.new('RGBA', base.size, CHOCO), (0, 0), pm)
    for x, y, w, h in strip_slots:  # viền sáng mảnh quanh ô ảnh
        d.rounded_rectangle(sc(x - 6, y - 6, x + w + 6, y + h + 6), radius=18 * S, outline=CHOCO_L, width=2 * S)

    # 3) Chuỗi hạt kem giữa các ô ảnh.
    for (_, ya, _, ha), (_, yb, _, _) in zip(strip_slots, strip_slots[1:]):
        cy = (ya + ha + yb) / 2
        for x in range(58, 543, 16):
            d.ellipse(sc(x - 4.5, cy - 4.5, x + 4.5, cy + 4.5), fill=CREAM)

    # 4) Header: lớp chocolate chảy (drip) — không chạm khung tem (y < 98).
    d.rounded_rectangle(sc(36, 36, 564, 82), radius=18 * S, fill=CHOCO, corners=(True, True, False, False))
    for x in range(46, 556, 30):
        d.ellipse(sc(x - 10, 70, x + 10, 90), fill=CHOCO)
    for x, yb in ((84, 93), (150, 88), (236, 95), (330, 90), (404, 94), (478, 89), (530, 92)):
        d.rounded_rectangle(sc(x - 8, 80, x + 8, yb), radius=8 * S, fill=CHOCO)
    d.line(sc(62, 45, 130, 45), fill=CHOCO_L, width=3 * S)  # vệt bóng
    d.line(sc(470, 45, 500, 45), fill=CHOCO_L, width=3 * S)

    # 5) Footer: mép dưới chocolate gợn sóng.
    wave = [(x, 1734 + 6 * math.sin(2 * math.pi * (x - 36) / 56)) for x in range(36, 565, 2)]
    d.polygon([tuple(sc(x, y)) for x, y in wave] + [tuple(sc(564, 1748)), tuple(sc(36, 1748))], fill=CHOCO)
    d.rounded_rectangle(sc(36, 1740, 564, 1764), radius=14 * S, fill=CHOCO, corners=(False, False, True, True))
    d.line(sc(70, 1750, 150, 1750), fill=CHOCO_L, width=3 * S)

    # 6) Đục ô ảnh trong suốt (bo góc nhẹ 14px, khớp radius trong config.js).
    hm = Image.new('L', base.size, 255); hd = ImageDraw.Draw(hm)
    for x, y, w, h in strip_slots:
        hd.rounded_rectangle(sc(x, y, x + w - 1, y + h - 1), radius=14 * S, fill=0)
    base.putalpha(hm)

    # 7) Trang trí tông chocolate ở mép giữa các ô (vẽ sau cùng, viền kem cho nổi).
    deco = Image.new('RGBA', base.size, CLEAR); dd = ImageDraw.Draw(deco)

    def heart(cx, cy, s, fill):
        dd.ellipse(sc(cx - s, cy - s * 0.85, cx, cy + s * 0.15), fill=fill)
        dd.ellipse(sc(cx, cy - s * 0.85, cx + s, cy + s * 0.15), fill=fill)
        dd.polygon([tuple(sc(cx - s * 0.97, cy - s * 0.2)), tuple(sc(cx + s * 0.97, cy - s * 0.2)), tuple(sc(cx, cy + s))], fill=fill)

    def star(cx, cy, ro, ri, fill):
        pts = []
        for k in range(10):
            a = -math.pi / 2 + k * math.pi / 5
            rr_ = ro if k % 2 == 0 else ri
            pts.append(tuple(sc(cx + rr_ * math.cos(a), cy + rr_ * math.sin(a))))
        dd.polygon(pts, fill=fill)

    gaps = [(ya + ha + yb) / 2 for (_, ya, _, ha), (_, yb, _, _) in zip(strip_slots, strip_slots[1:])]
    # Trái tim (mép phải, giữa ô 1–2)
    hx, hy = 528, gaps[0]
    heart(hx, hy, 25, CREAM); heart(hx, hy, 21, CHOCO_D)
    dd.ellipse(sc(hx - 13, hy - 12, hx - 6, hy - 6), fill=(255, 255, 255, 140))
    # Ngôi sao (mép trái, giữa ô 2–3)
    sx, sy = 72, gaps[1]
    star(sx, sy, 28, 13, CREAM); star(sx, sy, 23, 10, CHOCO_D)
    # Gấu cầm kẹo mút (mép phải, giữa ô 3–4)
    bx, by = 526, gaps[2] + 4
    dd.line(sc(bx - 12, by + 8, bx - 28, by - 10), fill=CREAM, width=4 * S)          # que kẹo
    for k, rad in enumerate((12, 9, 6, 3)):                                             # kẹo xoáy
        dd.ellipse(sc(bx - 32 - rad, by - 14 - rad, bx - 32 + rad, by - 14 + rad), fill=CREAM if k % 2 else CHOCO_L)
    for ex in (-14, 14):                                                                # tai
        dd.ellipse(sc(bx + ex - 10, by - 25, bx + ex + 10, by - 5), fill=CREAM)
        dd.ellipse(sc(bx + ex - 8, by - 23, bx + ex + 8, by - 7), fill=MILK)
        dd.ellipse(sc(bx + ex - 4, by - 19, bx + ex + 4, by - 11), fill=TAN)
    dd.ellipse(sc(bx - 22, by - 20, bx + 22, by + 22), fill=CREAM)                       # đầu
    dd.ellipse(sc(bx - 19, by - 17, bx + 19, by + 19), fill=MILK)
    dd.ellipse(sc(bx - 10, by + 2, bx + 10, by + 15), fill=TAN)                           # mõm
    for ex in (-7, 7):
        dd.ellipse(sc(bx + ex - 2.5, by - 5, bx + ex + 2.5, by), fill=CHOCO_D)            # mắt
    dd.ellipse(sc(bx - 3.5, by + 3, bx + 3.5, by + 8), fill=CHOCO_D)                      # mũi
    dd.ellipse(sc(bx - 17, by + 10, bx - 9, by + 18), fill=CREAM)                         # tay cầm que
    base.alpha_composite(deco)

    strip = base.resize((W, H), Image.LANCZOS)
    strip.putalpha(strip.getchannel('A').point(lambda v: 0 if v < 10 else v))  # bỏ nhiễu alpha ở mép ô
    im = Image.new('RGBA', (1200, 1800), CLEAR)
    im.paste(strip, (0, 0)); im.paste(strip, (600, 0))
    dd2 = ImageDraw.Draw(im)
    for y in range(0, 1800, 24):  # vạch cắt nét đứt mảnh giữa 2 dải
        dd2.line([(600, y), (600, min(y + 14, 1799))], fill=(196, 178, 152, 255), width=2)
    save_with_backup(im, 'youngbooth-strip.png')

MAKERS = {'a': make_a, 'b': make_b, 'c': make_c, 'd': make_d, 'f': make_f, 'youngbooth': make_youngbooth}

if __name__ == '__main__':
    args = sys.argv[1:]
    if '--out' in args:
        i = args.index('--out'); OUT = args[i + 1].rstrip('/\\') + '/'; del args[i:i + 2]
        os.makedirs(OUT, exist_ok=True)
    names = [a.lower() for a in args] or ['a', 'b', 'c', 'd', 'f']  # mặc định giữ như cũ (A–F)
    for n in names: MAKERS[n]()
    print('ok', names, '->', OUT)
