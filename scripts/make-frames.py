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

def backup_all():
    """Chép TOÀN BỘ PNG hiện có trong OUT sang _backup-YYYYMMDD trước khi ghi đè.
    File đã có trong backup hôm nay thì giữ nguyên (không ghi đè bản gốc bằng bản mới)."""
    pngs = [f for f in os.listdir(OUT) if f.lower().endswith('.png')] if os.path.isdir(OUT) else []
    if not pngs: return
    bdir = os.path.join(OUT, '_backup-' + datetime.date.today().strftime('%Y%m%d'))
    os.makedirs(bdir, exist_ok=True)
    for f in pngs:
        if not os.path.exists(os.path.join(bdir, f)):
            shutil.copy2(os.path.join(OUT, f), os.path.join(bdir, f))

def save_with_backup(im, name):
    """Lưu khung (backup_all() đã chạy trước trong __main__)."""
    im.save(os.path.join(OUT, name))

# ---- Tiện ích dùng chung cho khung mới ----------------------------------------
SS = 3  # vẽ ở độ phân giải ×3 rồi thu nhỏ → viền mịn

def ss_layer(W, H):
    """Lớp RGBA trong suốt kích thước ×SS + hàm đổi toạ độ px thật → px ×SS."""
    im = Image.new('RGBA', (W * SS, H * SS), CLEAR)
    return im, ImageDraw.Draw(im), (lambda *v: [round(a * SS) for a in v])

def down(im, W, H):
    return im.resize((W, H), Image.LANCZOS)

def paper(W, H, base, ink, seed=1):
    """Nền giấy: màu base + hạt li ti (sáng/tối) + sợi giấy mảnh, rất nhạt."""
    import random
    rnd = random.Random(seed)
    im = Image.new('RGBA', (W, H), base + (255,))
    n = Image.effect_noise((W, H), 48)
    dark = n.point(lambda v: min(255, max(0, v - 150) * 2))      # hạt tối thưa
    light = n.point(lambda v: min(255, max(0, 110 - v) * 2))     # hạt sáng thưa
    im.paste(Image.new('RGBA', (W, H), ink + (255,)), (0, 0), dark.point(lambda v: v * 22 // 255))
    im.paste(Image.new('RGBA', (W, H), (255, 255, 255, 255)), (0, 0), light.point(lambda v: v * 40 // 255))
    fib = Image.new('RGBA', (W, H), CLEAR); fd = ImageDraw.Draw(fib)
    for _ in range(W * H // 9000):                                  # sợi giấy
        x, y = rnd.uniform(0, W), rnd.uniform(0, H)
        a, L = rnd.uniform(0, math.pi), rnd.uniform(8, 26)
        fd.line([(x, y), (x + L * math.cos(a), y + L * math.sin(a))], fill=ink + (14,), width=1)
    im.alpha_composite(fib)
    return im

def punch(im, slots, radius_px=0):
    """Khoét ô ảnh trong suốt (bo góc = slot.radius), vẽ ở ×SS cho mép mịn."""
    W, H = im.size
    sc = lambda *v: [round(a * SS) for a in v]
    m = Image.new('L', (W * SS, H * SS), 255); md = ImageDraw.Draw(m)
    for x, y, w, h in slots:
        if radius_px: md.rounded_rectangle(sc(x, y, x + w - 1, y + h - 1), radius=radius_px * SS, fill=0)
        else: md.rectangle(sc(x, y, x + w - 1, y + h - 1), fill=0)
    keep = down(m, W, H).point(lambda v: 255 if v > 245 else (0 if v < 10 else v))
    im.putalpha(Image.composite(im.getchannel('A'), Image.new('L', (W, H), 0), keep))
    return im

def tape(length, width, fill, stripe, angle, pattern='stripes'):
    """Miếng băng keo washi (đầu răng cưa, sọc chéo mờ), đã xoay; trả ảnh ×SS."""
    L, Wd = length * SS, width * SS
    t = Image.new('RGBA', (L, Wd), CLEAR); td = ImageDraw.Draw(t)
    z = 5 * SS; pts = [(0, 0)]
    for i in range(0, Wd + 1, z): pts.append((z if (i // z) % 2 else 0, i))      # mép trái răng cưa
    right = [(L - (z if (i // z) % 2 else 0), i) for i in range(Wd, -1, -z)]
    td.polygon(pts + [(0, Wd)] + right + [(L, 0)], fill=fill)
    mask = t.getchannel('A')
    st = Image.new('RGBA', (L, Wd), CLEAR); sd = ImageDraw.Draw(st)
    if pattern == 'dots':
        for yy in range(6 * SS, Wd, 14 * SS):
            for xx in range((yy // (14 * SS)) % 2 * 7 * SS + 6 * SS, L, 14 * SS):
                sd.ellipse([xx - 4 * SS, yy - 4 * SS, xx + 4 * SS, yy + 4 * SS], fill=stripe)
    else:
        for x in range(-Wd, L, 14 * SS): sd.line([(x, Wd), (x + Wd, 0)], fill=stripe, width=5 * SS)
    t.alpha_composite(Image.composite(st, Image.new('RGBA', (L, Wd), CLEAR), mask))
    return t.rotate(angle, resample=Image.BICUBIC, expand=True)

def paste_center(layer, piece, cx, cy):
    layer.alpha_composite(piece, (round(cx * SS - piece.width / 2), round(cy * SS - piece.height / 2)))

def sparkle(d, sc, cx, cy, r, fill):
    """Ngôi sao lấp lánh 4 cánh."""
    k = r * 0.28
    d.polygon([tuple(sc(cx, cy - r)), tuple(sc(cx + k, cy - k)), tuple(sc(cx + r, cy)), tuple(sc(cx + k, cy + k)),
               tuple(sc(cx, cy + r)), tuple(sc(cx - k, cy + k)), tuple(sc(cx - r, cy)), tuple(sc(cx - k, cy - k))], fill=fill)

def holes(d, slots, line, off, width):
    for x, y, w, h in slots:
        if line: d.rectangle([x - off, y - off, x + w + off - 1, y + h + off - 1], outline=line, width=width)
        d.rectangle([x, y, x + w - 1, y + h - 1], fill=CLEAR)

def dashed_v(d, x, h, color, dash=16, gap=16):
    for y in range(0, h, dash + gap):
        d.line([(x, y), (x, min(y + dash, h))], fill=color, width=2)

SLOTS = {
    'A': [(60, 150, 1080, 1390)],  # 1 ảnh gallery; viền ngoài cách mép 42px, footer chừa chữ + ngày + QR
    'B': [(110, 160, 680, 810), (1010, 160, 680, 810)],  # 2 tấm 900px, ảnh bo góc 24; footer chừa tên/ngày/QR
    'C': [(ox, y, 516, 340) for ox in (42, 642) for y in (124, 478, 832, 1186)],  # khung C cũ (grid6-navy.png), không còn dùng
    'D': [(110, 150, 680, 810), (1010, 150, 680, 810)],  # 2 tấm 3×4 dọc, polaroid 14px; footer chừa chữ/ngày/QR
    'F': [(x, y, 490, 650) for y in (168, 854) for x in (92, 618)],  # lưới 2×2, bo góc 28, viền trắng 8, khe 20
    # YoungBooth (dùng cho Layout C "Nhật Ký"): dải đôi 2×6, 4 ô 500×330 (3:2) / dải. Khớp mode 'C' trong config.js.
    'YB': [(ox + 50, y, 500, 330) for ox in (0, 600) for y in (112, 468, 824, 1180)],
}

def velvet(W, H, base, seed=1):
    """Nền vải nhung: màu base + noise rất nhẹ (sáng/tối) + tối dần ra 4 góc."""
    from PIL import ImageFilter
    im = Image.new('RGBA', (W, H), base + (255,))
    n = Image.effect_noise((W, H), 36)
    im.paste(Image.new('RGBA', (W, H), (255, 255, 255, 255)), (0, 0), n.point(lambda v: max(0, v - 128) * 12 // 128))
    im.paste(Image.new('RGBA', (W, H), (0, 0, 0, 255)), (0, 0), n.point(lambda v: max(0, 128 - v) * 22 // 128))
    vg = Image.radial_gradient('L').resize((W, H))        # 0 ở tâm → 255 ở xa
    im.paste(Image.new('RGBA', (W, H), (0, 0, 0, 255)), (0, 0), vg.point(lambda v: max(0, v - 120) * 70 // 135))
    return im

def deco_corner(d, sc, cx, cy, sx, sy, gold):
    """Hoa văn art-deco ~70px tại góc (cx,cy); sx/sy = hướng vào trong (+1/-1).
    Quạt đặc + 2 cung + tia sunburst bên ngoài (không cắt nhau), thoi nhỏ trên 2 cạnh.
    Bán kính ≤ 68 tâm ở góc viền ngoài → đè vào ảnh ≤ ~30px."""
    import math as m
    def P(r, deg):
        a = m.radians(deg)
        return tuple(sc(cx + sx * r * m.cos(a), cy + sy * r * m.sin(a)))
    q = {(1, 1): 0, (-1, 1): 90, (-1, -1): 180, (1, -1): 270}[(sx, sy)]
    d.pieslice(sc(cx - 22, cy - 22, cx + 22, cy + 22), q, q + 90, fill=gold)       # quạt đặc
    for r, wd in ((32, 3), (42, 2)):                                                 # 2 cung
        d.arc(sc(cx - r, cy - r, cx + r, cy + r), q, q + 90, fill=gold, width=wd * SS)
    for deg in (8, 23, 38, 52, 67, 82):                                              # tia sunburst
        ln = 68 if deg in (38, 52) else 60
        d.line([P(50, deg), P(ln, deg)], fill=gold, width=2 * SS)
    for ex, ey in ((cx + sx * 84, cy), (cx, cy + sy * 84)):                          # thoi trên 2 cạnh viền
        d.polygon([tuple(sc(ex, ey - 6)), tuple(sc(ex + 6, ey)), tuple(sc(ex, ey + 6)), tuple(sc(ex - 6, ey))], fill=gold)

def make_a():
    """A — Khoảnh Khắc: GALLERY sang trọng. Nền navy nhung, ảnh 2 lớp viền vàng đồng
    (3px sát ảnh, cách 14px viền 1px), 4 góc hoa văn art-deco. 3 màu: navy, vàng đồng, kem.
    Logo + chữ "YoungBooth" + ngày do app vẽ (logo/texts trong config.js)."""
    W, H = 1200, 1800
    NAVY, GOLD = (28, 37, 65), (201, 169, 97)
    (x0, y0, w, h), = SLOTS['A']
    x1, y1 = x0 + w, y0 + h
    base = velvet(W, H, NAVY, seed=7)

    lay, d, sc = ss_layer(W, H)
    G = GOLD + (255,)
    d.rectangle(sc(x0 - 3, y0 - 3, x1 + 3, y1 + 3), outline=G, width=3 * SS)           # viền trong 3px sát ảnh
    d.rectangle(sc(x0 - 18, y0 - 18, x1 + 18, y1 + 18), outline=G, width=1 * SS)       # viền ngoài 1px, cách 14px
    ly = 81                                                                              # header: 2 đường kẻ có chấm
    for a, b in ((150, 466), (734, 1050)):
        d.line(sc(a, ly, b, ly), fill=G, width=1 * SS)
        for x in (a, b): d.ellipse(sc(x - 4, ly - 4, x + 4, ly + 4), fill=G)
    base.alpha_composite(down(lay, W, H))
    punch(base, SLOTS['A'])

    deco, dd, sc = ss_layer(W, H)                                                        # góc art-deco đè nhẹ lên viền
    for cx, cy, sx, sy in ((x0 - 18, y0 - 18, 1, 1), (x1 + 18, y0 - 18, -1, 1), (x0 - 18, y1 + 18, 1, -1), (x1 + 18, y1 + 18, -1, -1)):
        deco_corner(dd, sc, cx, cy, sx, sy, G)
    base.alpha_composite(down(deco, W, H))
    save_with_backup(base, 'grid1-dark.png')

def heart_shape(d, sc, cx, cy, s, fill):
    """Trái tim tâm (cx,cy), nửa bề rộng s."""
    d.ellipse(sc(cx - s, cy - s * 0.85, cx, cy + s * 0.15), fill=fill)
    d.ellipse(sc(cx, cy - s * 0.85, cx + s, cy + s * 0.15), fill=fill)
    d.polygon([tuple(sc(cx - s * 0.97, cy - s * 0.2)), tuple(sc(cx + s * 0.97, cy - s * 0.2)), tuple(sc(cx, cy + s))], fill=fill)

def rose(d, sc, cx, cy, r, petal, dark, light):
    """Hoa hồng cách điệu: 5 cánh ngoài + nụ giữa + nét xoáy."""
    import math as m
    for k in range(5):
        a = m.radians(k * 72 - 90)
        px, py = cx + r * 0.42 * m.cos(a), cy + r * 0.42 * m.sin(a)
        d.ellipse(sc(px - r * 0.62, py - r * 0.62, px + r * 0.62, py + r * 0.62), fill=petal, outline=dark, width=max(1, round(1.2 * SS)))
    d.ellipse(sc(cx - r * 0.55, cy - r * 0.55, cx + r * 0.55, cy + r * 0.55), fill=light, outline=dark, width=max(1, round(1.2 * SS)))
    for k, rr in enumerate((0.42, 0.28, 0.15)):                      # nét xoáy
        st = 200 + k * 70
        d.arc(sc(cx - r * rr, cy - r * rr, cx + r * rr, cy + r * rr), st, st + 230, fill=dark, width=2 * SS)

def leaf(d, sc, cx, cy, L, ang, fill, vein):
    """Chiếc lá hình thoi bo tròn dài L, xoay ang độ."""
    import math as m
    a = m.radians(ang); ux, uy = m.cos(a), m.sin(a); vx, vy = -uy, ux
    pts = []
    for t in range(0, 181, 12):                                        # 2 mép lá theo sin
        s = m.sin(m.radians(t)) * L * 0.28; u = (t / 180 - 0.5) * L
        pts.append(tuple(sc(cx + ux * u + vx * s, cy + uy * u + vy * s)))
    for t in range(180, -1, -12):
        s = -m.sin(m.radians(t)) * L * 0.28; u = (t / 180 - 0.5) * L
        pts.append(tuple(sc(cx + ux * u + vx * s, cy + uy * u + vy * s)))
    d.polygon(pts, fill=fill)
    d.line([tuple(sc(cx - ux * L * 0.45, cy - uy * L * 0.45)), tuple(sc(cx + ux * L * 0.45, cy + uy * L * 0.45))], fill=vein, width=2 * SS)

def make_b():
    """B — Ngọt Ngào: 6×4 ngang, 2 tấm (cắt đôi x=900), mỗi tấm viền ren chấm hồng,
    ảnh trên nền trắng bo góc 24, cụm hoa hồng góc trên-phải & dưới-trái của ảnh, tim nhỏ.
    4 màu: kem hồng, hồng phấn, hồng đậm, trắng. Logo/tên/ngày/QR do app vẽ."""
    from PIL import ImageFilter
    W, H, HALF = 1800, 1200, 900
    CREAM, BLUSH, ROSE, WHITE = (251, 241, 238), (232, 169, 180), (140, 74, 90), (255, 255, 255)
    B_, R_, Wt = BLUSH + (255,), ROSE + (255,), WHITE + (255,)
    RAD, MAT = 24, 14
    base = paper(W, H, CREAM, ROSE, seed=5)

    sh = Image.new('RGBA', (W, H), CLEAR); shd = ImageDraw.Draw(sh)    # bóng mềm dưới nền trắng
    for x, y, w, h in SLOTS['B']:
        shd.rounded_rectangle([x - MAT + 3, y - MAT + 8, x + w + MAT - 3, y + h + MAT + 8], radius=RAD + MAT, fill=ROSE + (55,))
    base.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12)))

    lay, d, sc = ss_layer(W, H)
    for i in range(2):
        ox = i * HALF
        d.rounded_rectangle(sc(ox + 58, 58, ox + HALF - 58, H - 58), radius=22 * SS, outline=B_, width=2 * SS)   # viền ren
        for x in range(ox + 74, ox + HALF - 73, 16):                    # chấm ren trên/dưới
            for y in (46, H - 46):
                d.ellipse(sc(x - 3, y - 3, x + 3, y + 3), fill=B_)
        for y in range(74, H - 73, 16):                                 # chấm ren trái/phải
            for x in (ox + 46, ox + HALF - 46):
                d.ellipse(sc(x - 3, y - 3, x + 3, y + 3), fill=B_)
        cx = ox + HALF / 2                                              # header: kẻ + tim 2 bên logo
        for a, b, hx in ((cx - 300, cx - 140, cx - 128), (cx + 140, cx + 300, cx + 128)):
            d.line(sc(a, 93, b, 93), fill=B_, width=2 * SS)
            heart_shape(d, sc, hx, 92, 7, R_)
    for x, y, w, h in SLOTS['B']:                                       # nền trắng quanh ảnh
        d.rounded_rectangle(sc(x - MAT, y - MAT, x + w + MAT, y + h + MAT), radius=(RAD + MAT) * SS, fill=Wt)
        d.rounded_rectangle(sc(x - MAT + 5, y - MAT + 5, x + w + MAT - 5, y + h + MAT - 5), radius=(RAD + MAT - 5) * SS, outline=B_, width=1 * SS)
    for ox in (0, HALF):                                                # tim nhỏ rải 2 bên ảnh
        for hx, hy, s in ((76, 330, 8), (82, 560, 6), (74, 790, 9), (HALF - 78, 420, 7), (HALF - 74, 660, 9), (HALF - 80, 880, 6)):
            heart_shape(d, sc, ox + hx, hy, s, B_)
    base.alpha_composite(down(lay, W, H))
    punch(base, SLOTS['B'], RAD)

    deco, dd, sc = ss_layer(W, H)                                       # cụm hoa đè mép ảnh ≤ 40px
    for x, y, w, h in SLOTS['B']:
        x1, y1 = x + w, y + h
        for (cx, cy, sx, sy) in ((x1, y, -1, 1), (x, y1, 1, -1)):        # góc trên-phải, dưới-trái
            leaf(dd, sc, cx - sx * 40, cy - sy * 4, 40, 0, B_, R_)
            leaf(dd, sc, cx - sx * 2, cy - sy * 58, 46, 90, B_, R_)
            leaf(dd, sc, cx + sx * 30, cy - sy * 34, 40, -45 * sx * sy, B_, R_)
            rose(dd, sc, cx - sx * 4, cy - sy * 4, 36, B_, R_, WHITE + (255,))
            rose(dd, sc, cx - sx * 36, cy - sy * 22, 22, B_, R_, WHITE + (255,))
            rose(dd, sc, cx - sx * 14, cy - sy * 44, 18, B_, R_, WHITE + (255,))
            for ox_, oy_ in ((58, 40), (30, 60), (66, 12)):             # nụ nhỏ (lệch ra ngoài ảnh)
                bx, by = cx - sx * ox_, cy - sy * oy_
                dd.ellipse(sc(bx - 5, by - 5, bx + 5, by + 5), fill=R_)
    base.alpha_composite(down(deco, W, H))
    dd2 = ImageDraw.Draw(base)
    for y in range(0, H, 24):                                           # vạch cắt nét đứt mảnh
        dd2.line([(HALF, y), (HALF, min(y + 14, H - 1))], fill=(214, 170, 178, 255), width=2)
    save_with_backup(base, 'wedding-4x6.png')

def make_c():
    W, H = 1200, 1800
    im = Image.new('RGBA', (W, H), (203, 176, 116, 255)); d = ImageDraw.Draw(im)
    for i in range(2):  # mỗi dải viền vàng 22px đủ 4 cạnh
        ox = i * 600
        d.rectangle([ox + 22, 22, ox + 600 - 23, H - 23], fill=(255, 255, 255, 255))
        d.line([(ox + 170, 1612), (ox + 430, 1612)], fill=(190, 185, 175, 255), width=2)
    holes(d, SLOTS['C'], (210, 210, 210, 255), 2, 2); im.save(OUT + 'grid6-navy.png')

def wobble(d, sc, pts, color, width=3, seed=0, closed=False):
    """Nét bút vẽ tay: chia nhỏ đoạn + rung nhẹ ngẫu nhiên, đầu nét tròn."""
    import random
    rnd = random.Random(seed)
    if closed: pts = pts + [pts[0]]
    out = []
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        n = max(2, int(math.hypot(bx - ax, by - ay) / 6))
        for k in range(n):
            t = k / n
            out.append((ax + (bx - ax) * t + rnd.uniform(-0.8, 0.8), ay + (by - ay) * t + rnd.uniform(-0.8, 0.8)))
    out.append(pts[-1])
    d.line([tuple(sc(x, y)) for x, y in out], fill=color, width=width * SS, joint='curve')
    for x, y in (out[0], out[-1]):
        r = width / 2
        d.ellipse(sc(x - r, y - r, x + r, y + r), fill=color)

def doodle_heart(d, sc, cx, cy, s, ink, seed):
    pts = []
    for k in range(0, 361, 10):                       # đường cong trái tim tham số
        t = math.radians(k)
        x = 16 * math.sin(t) ** 3
        y = -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))
        pts.append((cx + x * s / 16, cy + y * s / 16))
    wobble(d, sc, pts, ink, 3, seed)

def doodle_sparkle(d, sc, cx, cy, r, ink, seed):
    k = r * 0.22
    pts = [(cx, cy - r), (cx + k, cy - k), (cx + r, cy), (cx + k, cy + k), (cx, cy + r), (cx - k, cy + k), (cx - r, cy), (cx - k, cy - k)]
    wobble(d, sc, pts, ink, 3, seed, closed=True)

def doodle_cloud(d, sc, cx, cy, w, ink, seed):
    pts = []
    bumps = [(-0.38, 0.0, 0.22), (-0.12, -0.18, 0.28), (0.18, -0.14, 0.24), (0.38, 0.02, 0.2)]
    for bx, by, br in bumps:                          # các vòm mây phía trên
        for k in range(200, 341, 12):
            t = math.radians(k)
            pts.append((cx + (bx + br * math.cos(t)) * w, cy + (by + br * math.sin(t)) * w))
    pts.append((cx + 0.55 * w, cy + 0.12 * w)); pts.append((cx - 0.58 * w, cy + 0.12 * w))
    wobble(d, sc, pts, ink, 3, seed, closed=True)

def doodle_arrow(d, sc, p0, p1, p2, ink, seed):
    """Mũi tên cong (Bezier bậc 2 p0→p2, điểm uốn p1) + đầu mũi tên tại p2."""
    pts = []
    for k in range(21):
        t = k / 20
        pts.append(((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
                    (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]))
    wobble(d, sc, pts, ink, 3, seed)
    a = math.atan2(p2[1] - pts[-3][1], p2[0] - pts[-3][0])
    for da in (2.6, -2.6):
        wobble(d, sc, [p2, (p2[0] + 18 * math.cos(a + da), p2[1] + 18 * math.sin(a + da))], ink, 3, seed + 1)

def make_d():
    """D — Chia Đôi: SCRAPBOOK. 6×4 ngang → 2 tấm 3×4 dọc (cắt x=900). Giấy kẻ ô ly 40px,
    ảnh polaroid viền trắng 14px + bóng, 2 băng keo washi/ảnh (trái: hồng sọc, phải: mint chấm bi,
    80% opacity), ≤5 doodle nét đen mỗi tấm, highlight vàng dưới chữ "YoungBooth" (chữ do app vẽ)."""
    from PIL import ImageFilter
    W, H, HALF = 1800, 1200, 900
    CREAM, GRID, WHITE, INK, YEL = (250, 246, 239), (230, 222, 211), (255, 255, 255), (51, 51, 51), (255, 226, 122)
    PINK, MINT = (244, 182, 194), (168, 216, 201)
    MAT = 14
    base = paper(W, H, CREAM, INK, seed=3); gd = ImageDraw.Draw(base)                  # vân giấy nhẹ
    for x in range(20, W, 40): gd.line([(x, 0), (x, H)], fill=GRID + (255,), width=1)      # giấy ô ly 40px
    for y in range(20, H, 40): gd.line([(0, y), (W, y)], fill=GRID + (255,), width=1)

    sh = Image.new('RGBA', (W, H), CLEAR); shd = ImageDraw.Draw(sh)                       # bóng polaroid
    for x, y, w, h in SLOTS['D']:
        shd.rectangle([x - MAT + 4, y - MAT + 9, x + w + MAT - 2, y + h + MAT + 9], fill=(60, 50, 40, 60))
    base.alpha_composite(sh.filter(ImageFilter.GaussianBlur(10)))

    lay, d, sc = ss_layer(W, H)
    for x, y, w, h in SLOTS['D']:
        d.rectangle(sc(x - MAT, y - MAT, x + w + MAT, y + h + MAT), fill=WHITE + (255,))    # viền polaroid 14px
    for ox in (0, HALF):                                                                  # highlight vàng dưới chữ
        cx = ox + 450
        d.line(sc(cx - 150, 1068, cx + 148, 1062), fill=YEL + (235,), width=16 * SS)
        for ex, ey in ((cx - 150, 1068), (cx + 148, 1062)):
            d.ellipse(sc(ex - 8, ey - 8, ex + 8, ey + 8), fill=YEL + (235,))
    base.alpha_composite(down(lay, W, H))
    punch(base, SLOTS['D'])

    deco, dd, sc = ss_layer(W, H)
    for i, (x, y, w, h) in enumerate(SLOTS['D']):                                         # băng keo washi 2 góc trên
        col, pat = (PINK, 'stripes') if i == 0 else (MINT, 'dots')
        for cx, ang in ((x + 8, 45), (x + w - 8, -45)):
            paste_center(deco, tape(140, 44, col + (204,), (255, 255, 255, 215), ang, pat), cx, y)
    K = INK + (255,)
    for i, ox in enumerate((0, HALF)):                                                    # ≤ 5 doodle / tấm
        s = 10 * i
        doodle_heart(dd, sc, ox + 66, 330, 22, K, s + 1)
        doodle_sparkle(dd, sc, ox + 836, 250, 20, K, s + 2)
        doodle_cloud(dd, sc, ox + 642, 84, 80, K, s + 3)
        doodle_sparkle(dd, sc, ox + 838, 860, 14, K, s + 4)
        doodle_arrow(dd, sc, (ox + 150, 1130), (ox + 160, 1060), (ox + 278, 1046), K, s + 5)
    base.alpha_composite(down(deco, W, H))
    cd = ImageDraw.Draw(base)
    for y in range(0, H, 24):                                                             # vạch cắt nét đứt
        cd.line([(HALF, y), (HALF, min(y + 14, H - 1))], fill=(170, 160, 150, 255), width=2)
    save_with_backup(base, 'split2-ivory.png')

def die_cut(shape_fn, box, border=6, shadow=(120, 60, 80, 70)):
    """Sticker bế: vẽ hình bằng shape_fn(draw, sc) trên ô box×box (px thật, tâm ở box/2),
    thêm viền trắng `border`px + bóng mềm. Trả ảnh RGBA ×SS (dán bằng paste_center)."""
    from PIL import ImageFilter
    N = box * SS
    sc = lambda *v: [round(a * SS) for a in v]
    art = Image.new('RGBA', (N, N), CLEAR); shape_fn(ImageDraw.Draw(art), sc)
    a = art.getchannel('A')
    grow = a.filter(ImageFilter.MaxFilter(2 * border * SS + 1))
    out = Image.new('RGBA', (N, N), CLEAR)
    sh = Image.new('RGBA', (N, N), shadow); sh.putalpha(grow.filter(ImageFilter.GaussianBlur(4 * SS)).point(lambda v: v * shadow[3] // 255))
    out.alpha_composite(sh, (0, 3 * SS))
    wb = Image.new('RGBA', (N, N), (255, 255, 255, 255)); wb.putalpha(grow)
    out.alpha_composite(wb); out.alpha_composite(art)
    return out

def make_f():
    """F — Dịu Dàng: PASTEL HÀN QUỐC (Life4Cuts). Nền gradient hồng phấn → kem + chấm bi trắng mờ,
    lưới 2×2 ảnh bo góc 28 viền trắng 8px, khe ~20px; mỗi ảnh 1 sticker bế ở 1 góc khác nhau
    (nơ, mây, sao lấp lánh, tim). Logo + "YoungBooth" + ngày + QR do app vẽ."""
    W, H = 1200, 1800
    TOP, BOT, DEEP, WHITE = (248, 221, 227), (251, 243, 233), (216, 106, 138), (255, 255, 255)
    LIGHT = (244, 166, 184)        # hồng trung gian cho sticker (pha từ hồng phấn & hồng đậm)
    RAD, BW = 28, 8
    grad = Image.linear_gradient('L').resize((W, H))                    # 0 trên → 255 dưới
    base = Image.composite(Image.new('RGBA', (W, H), BOT + (255,)), Image.new('RGBA', (W, H), TOP + (255,)), grad)
    dots = Image.new('RGBA', (W, H), CLEAR); dd0 = ImageDraw.Draw(dots)
    for j, y in enumerate(range(30, H, 96)):                            # chấm bi trắng mờ, thưa
        for x in range(30 + (j % 2) * 48, W, 96):
            dd0.ellipse([x - 9, y - 9, x + 9, y + 9], fill=(255, 255, 255, 120))
    base.alpha_composite(dots)

    lay, d, sc = ss_layer(W, H)
    for x, y, w, h in SLOTS['F']:                                       # viền trắng 8px bo góc
        d.rounded_rectangle(sc(x - BW, y - BW, x + w + BW, y + h + BW), radius=(RAD + BW) * SS, fill=WHITE + (255,))
    for side in (-1, 1):                                                # header: 3 sao nhỏ mỗi bên logo
        for k, (dx, r) in enumerate(((136, 13), (172, 10), (202, 7))):
            sparkle(d, sc, 600 + side * dx, 87, r, DEEP + (255,))
    base.alpha_composite(down(lay, W, H))
    punch(base, SLOTS['F'], RAD)

    def bow(dr, s):
        c = 60
        for sx in (-1, 1):                                              # 2 quai nơ
            dr.polygon([tuple(s(c, c)), tuple(s(c + sx * 46, c - 30)), tuple(s(c + sx * 52, c - 8)), tuple(s(c + sx * 50, c + 16)), tuple(s(c + sx * 40, c + 26))], fill=DEEP + (255,))
            dr.ellipse(s(c + sx * 36 - 16, c - 14, c + sx * 36 + 16, c + 18), fill=DEEP + (255,))
            dr.ellipse(s(c + sx * 32 - 7, c - 6, c + sx * 32 + 7, c + 8), fill=LIGHT + (255,))
            dr.polygon([tuple(s(c, c + 4)), tuple(s(c + sx * 22, c + 46)), tuple(s(c + sx * 8, c + 42))], fill=DEEP + (255,))   # đuôi nơ
        dr.ellipse(s(c - 11, c - 11, c + 11, c + 11), fill=LIGHT + (255,), outline=DEEP + (255,), width=3 * SS)
    def cloud(dr, s):
        c = 60
        bumps = ((-24, 6, 20), (0, -8, 26), (26, 4, 20), (-8, 12, 18), (14, 14, 18))
        for bx, by, r in bumps:                                         # viền hồng mảnh quanh mây
            dr.ellipse(s(c + bx - r - 3, c + by - r - 3, c + bx + r + 3, c + by + r + 3), fill=LIGHT + (255,))
        for bx, by, r in bumps:
            dr.ellipse(s(c + bx - r, c + by - r, c + bx + r, c + by + r), fill=WHITE + (255,))
        dr.ellipse(s(c - 10, c + 2, c - 4, c + 8), fill=DEEP + (255,)); dr.ellipse(s(c + 6, c + 2, c + 12, c + 8), fill=DEEP + (255,))   # mắt
        dr.arc(s(c - 6, c + 6, c + 8, c + 16), 20, 160, fill=DEEP + (255,), width=2 * SS)                                           # miệng cười
        dr.ellipse(s(c - 22, c + 8, c - 12, c + 14), fill=LIGHT + (255,)); dr.ellipse(s(c + 16, c + 8, c + 26, c + 14), fill=LIGHT + (255,))  # má hồng
    def star(dr, s):
        k = 0.3; c = 60
        for cx, cy, r, col in ((c - 6, c + 4, 38, LIGHT), (c + 28, c - 26, 13, DEEP)):
            kk = r * k
            dr.polygon([tuple(s(cx, cy - r)), tuple(s(cx + kk, cy - kk)), tuple(s(cx + r, cy)), tuple(s(cx + kk, cy + kk)),
                        tuple(s(cx, cy + r)), tuple(s(cx - kk, cy + kk)), tuple(s(cx - r, cy)), tuple(s(cx - kk, cy - kk))], fill=col + (255,))
    def heart(dr, s):
        heart_shape(dr, s, 60, 58, 36, DEEP + (255,))
        dr.ellipse(s(38, 34, 52, 46), fill=(255, 255, 255, 170))       # bóng sáng

    deco, _, sc = ss_layer(W, H)
    (ax, ay, aw, ah), (bx, by, bw, bh), (cx_, cy_, cw, ch), (ex, ey, ew, eh) = SLOTS['F']
    paste_center(deco, die_cut(bow, 120), ax, ay)                # ảnh 1: góc trên-trái
    paste_center(deco, die_cut(cloud, 120), bx + bw, by + 2)         # ảnh 2: góc trên-phải
    paste_center(deco, die_cut(star, 120), cx_, cy_ + ch)        # ảnh 3: góc dưới-trái
    paste_center(deco, die_cut(heart, 120), ex + ew, ey + eh - 2)    # ảnh 4: góc dưới-phải
    base.alpha_composite(down(deco, W, H))
    save_with_backup(base, 'grid4-charcoal.png')

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
    backup_all()  # backup TOÀN BỘ PNG cũ trước khi ghi đè
    for n in names: MAKERS[n]()
    print('ok', names, '->', OUT)
