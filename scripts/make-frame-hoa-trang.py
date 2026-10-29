# Khung sự kiện cưới "Hoa Trắng – Rèm Kem" (khung #19): tờ 4×6 DỌC 1200×1800, 2 ảnh ngang xếp chồng.
# Vẽ: nền kem + rèm vải (trên + 2 mép) → khoét 2 ô ảnh → cụm hoa hồng trắng + lá bạch đàn đè lên góc ảnh
#      → chữ cố định (đường kẻ, trái tim, YOUNG BOOTH). Tên / ngày / lời cảm ơn là chữ ĐỘNG (config.js texts[]).
# Chạy:  py scripts/make-frame-hoa-trang.py            → C:/YoungBooth-Frames/events/hoa-trang/ht-d2.png + -thumb.png
#        py scripts/make-frame-hoa-trang.py --preview  → thêm docs/previews/khung-19-hoa-trang.png (ảnh giả + chữ mẫu)
import math, os, sys, random
from PIL import Image, ImageDraw
import frame_kit as K

W, H = 1200, 1800
OUT_DIR = 'C:/YoungBooth-Frames/events/hoa-trang'
HERE = os.path.dirname(os.path.abspath(__file__))
PREVIEW = os.path.join(HERE, '..', 'docs', 'previews', 'khung-19-hoa-trang.png')

# PHẢI khớp slots của EV-B-ht-d2 trong renderer/config.js
SLOTS = [K.S(45, 95, 1110, 640), K.S(45, 765, 1110, 640)]
QR = dict(x=1012, y=1482, size=120)
INK = '#3f5446'        # xanh rêu đậm (chữ / đường kẻ)
SERIF = '"Cormorant Garamond", "YB Serif", Georgia, serif'
SCRIPT = '"Great Vibes", "YB Script", cursive'

# Chữ ĐỘNG — giống hệt texts[] trong config.js (dùng để vẽ preview)
TEXTS = [
    dict(id='dd', value='20', x=150, y=1520, size=58, color=INK, ff=SERIF, weight='600'),
    dict(id='mm', value='09', x=150, y=1608, size=58, color=INK, ff=SERIF, weight='600'),
    dict(id='yy', value='26', x=150, y=1696, size=58, color=INK, ff=SERIF, weight='600'),
    dict(id='name1', value='MINH VIỆT', x=560, y=1580, size=58, fit=300, color=INK, ff=SERIF, weight='600', ls=2, align='right'),
    dict(id='conn', value='and', x=618, y=1582, size=70, color=INK, ff=SCRIPT),
    dict(id='name2', value='HÀ VY', x=676, y=1580, size=58, fit=300, color=INK, ff=SERIF, weight='600', ls=2, align='left'),
    dict(id='thanks', value='Thank you for being part of our special day', x=618, y=1648, size=32, fit=640, color='#5d6b5f',
         ff=SERIF, weight='500', italic=True),
]


# ---------------------------------------------------------------- nền + rèm
def background(img):
    K.comp(img, K.rad_grad(W, H, (W / 2, H * .45), 0, 1100, [(0, '#fbf8f1'), (1, '#efe7d6')]), 0, 0)
    R = random.Random(7)
    # nếp rèm dọc: dải sáng/tối mềm chạy suốt chiều cao (lộ ra ở lề trái/phải và dải chữ dưới)
    x = -20
    while x < W + 40:
        w = 26 + R.random() * 40
        K.rect(img, x, 0, x + w * .45, H, (255, 255, 255, 70), blur=10)
        K.rect(img, x + w * .55, 0, x + w * .7, H, (176, 158, 128, 34), blur=9)
        x += w
    # rèm mép trái/phải đậm hơn (vải buông)
    for side in (0, 1):
        for k in range(5):
            cx = (12 + k * 9) if side == 0 else (W - 12 - k * 9)
            K.rect(img, cx - 3, 0, cx + 3, H, (165, 145, 112, 40 - k * 6), blur=4)
    # rèm võng trên cùng: 3 lớp vải cong
    for i, (sag, y0, col) in enumerate([(70, -30, '#f3ecdf'), (52, -46, '#f8f3ea'), (36, -60, '#fdfbf6')]):
        pts = [(-20, y0)] + K.cubic((-20, y0 + 40), (W * .3, y0 + 40 + sag * 2.2), (W * .7, y0 + 40 + sag * 2.2), (W + 20, y0 + 40), 40) + [(W + 20, y0)]
        K.fill_poly(img, pts, (150, 128, 96, 90), blur=10, offset=(0, 10))
        K.fill_poly(img, pts, col)
        for f in range(9):   # nếp gấp trên vải võng
            t = (f + .5) / 9
            px = -20 + (W + 40) * t
            depth = y0 + 40 + sag * 2.2 * 4 * t * (1 - t) * .75
            K.stroke_poly(img, [(px - 30, y0), (px + 6, depth - 8)], (170, 148, 112, 70), 3, closed=False, blur=2)


# ---------------------------------------------------------------- hoa hồng trắng + lá
def petal_pts(L, Wd):
    a = K.cubic((0, 0), (L * .1, -Wd), (L * .95, -Wd * 1.05), (L, 0), 16)
    b = K.cubic((L, 0), (L * .95, Wd * 1.05), (L * .1, Wd), (0, 0), 16)
    return a + b[1:]


def rose(img, cx, cy, r, seed=1, tint=0):
    R = random.Random(seed)
    K.circle(img, cx + r * .08, cy + r * .14, r * 1.02, (120, 104, 80, 60), blur=r * .18)   # bóng đổ
    rings = [(1.0, 9), (.8, 8), (.6, 7), (.42, 6), (.26, 5)]
    for ri, (rr, n) in enumerate(rings):
        off = R.random() * math.pi
        for p in range(n):
            ang = off + p * 2 * math.pi / n + R.uniform(-.12, .12)
            L = r * rr * R.uniform(.92, 1.05)
            pts = K._rot(petal_pts(L, L * .55), cx, cy, ang)
            shade = ri / len(rings)
            stops = [(0, '#fffefb'), (.55, '#f8f1e4' if not tint else '#f6ece8'), (1, '#e6d8bf' if shade < .5 else '#dcc8a6')]
            K.wc_shape(img, pts, stops, (cx + math.cos(ang) * L * .8, cy + math.sin(ang) * L * .8), edge='#d4c3a4',
                       edge_w=1.3, alpha=.97, seed=seed * 31 + ri * 7 + p, grain=.04)
    K.circle(img, cx, cy, r * .14, '#d8c39c', blur=r * .04)
    K.circle(img, cx - r * .03, cy - r * .03, r * .07, '#efe2c6')


def sage_leaf(img, x, y, L, ang, seed=1, alpha=1.0, light=False):
    a = math.radians(ang)
    pts = K._rot(petal_pts(L, L * .32), x, y, a)
    stops = [(0, '#c9d6c0'), (.5, '#9fb497'), (1, '#6f8a6b')] if light else [(0, '#a9bda1'), (.5, '#7d9a77'), (1, '#4f6d50')]
    K.wc_shape(img, pts, stops, (x + math.cos(a) * L * .5, y + math.sin(a) * L * .5), edge='#4a6449', edge_w=1.2,
               alpha=.95 * alpha, seed=seed, grain=.06)
    K.stroke_poly(img, K._rot([(L * .05, 0), (L * .9, 0)], x, y, a), (235, 242, 228, 120), 1.6, closed=False)


def eucalyptus(img, x, y, L, ang, seed=3):
    """Cành bạch đàn: thân cong + lá tròn so le."""
    R = random.Random(seed)
    a = math.radians(ang)
    stem = [(x + math.cos(a) * L * t + math.sin(a) * L * .06 * math.sin(t * 3), y + math.sin(a) * L * t - math.cos(a) * L * .06 * math.sin(t * 3))
            for t in [i / 20 for i in range(21)]]
    K.stroke_poly(img, stem, '#7b8f6f', 3, closed=False)
    for i in range(2, 20, 2):
        px, py = stem[i]
        for side in (-1, 1):
            la = ang + side * R.uniform(50, 75)
            sz = L * .13 * (1.1 - i / 26)
            K.wc_shape(img, K.ellipse_rot(px + math.cos(math.radians(la)) * sz * .9, py + math.sin(math.radians(la)) * sz * .9, sz, sz * .78,
                                          math.radians(la), 28),
                       [(0, '#cbd8c6'), (.6, '#a3b7a0'), (1, '#7e977c')], (px, py), edge='#6c8569', edge_w=1, alpha=.92,
                       seed=seed * 13 + i + side, grain=.05)


def buds(img, x, y, n, spread, seed):
    R = random.Random(seed)
    for _ in range(n):
        bx, by = x + R.uniform(-spread, spread), y + R.uniform(-spread, spread)
        K.stroke_poly(img, [(x, y), (bx, by)], '#8a9a7d', 2, closed=False)
        K.circle(img, bx, by, R.uniform(5, 9), '#fbf6ec')
        K.circle(img, bx + 1, by + 1, 3, '#e3d4b8')


def bouquet(img, cx, cy, s, dir_deg, seed):
    """Cụm hoa góc: lá & cành toả theo hướng dir_deg, 2–3 bông hồng trắng ở giữa."""
    R = random.Random(seed)
    for k in range(7):
        ang = dir_deg + R.uniform(-80, 80)
        sage_leaf(img, cx, cy, 150 * s * R.uniform(.7, 1.1), ang, seed + k, light=k % 2 == 1)
    for k in range(3):
        eucalyptus(img, cx, cy, 220 * s, dir_deg + R.uniform(-60, 60), seed + 20 + k)
    buds(img, cx + math.cos(math.radians(dir_deg)) * 90 * s, cy + math.sin(math.radians(dir_deg)) * 90 * s, 7, 70 * s, seed + 40)
    da = math.radians(dir_deg)
    rose(img, cx + math.cos(da + 1.4) * 70 * s, cy + math.sin(da + 1.4) * 70 * s, 62 * s, seed + 50, tint=1)
    rose(img, cx + math.cos(da - 1.3) * 75 * s, cy + math.sin(da - 1.3) * 75 * s, 58 * s, seed + 51)
    rose(img, cx, cy, 84 * s, seed + 52)


# ---------------------------------------------------------------- chữ / đường kẻ cố định
def fixed_marks(img, fonts):
    # cột ngày: 2 vạch dọc + tim nhỏ giữa
    K.rect(img, 213, 1462, 215, 1548, INK)
    K.rect(img, 213, 1640, 215, 1720, INK)
    K.fill_poly(img, K.heart_pts(214, 1594, 16), INK)
    # đường kẻ + tim dưới lời cảm ơn
    K.rect(img, 470, 1693, 598, 1695, INK)
    K.rect(img, 638, 1693, 766, 1695, INK)
    K.fill_poly(img, K.heart_pts(618, 1694, 15), INK)
    # thương hiệu: rõ, đậm, tương phản (quy ước khung Young Booth)
    K.draw_text(img, fonts, 'YOUNG BOOTH', 618, 1766, dict(size=32, ff='"Be Vietnam Pro"', weight='800', ls=6, color=INK))


def build():
    fonts = K.Fonts()
    img = Image.new('RGBA', (W, H), K.rgba('#f6f1e6'))
    background(img)
    K.punch(img, SLOTS)
    # viền mảnh quanh ảnh
    for s in SLOTS:
        K.stroke_rect(img, s['x'] - 1, s['y'] - 1, s['x'] + s['w'] + 1, s['y'] + s['h'] + 1, (255, 255, 255, 230), 3)
    bouquet(img, 1150, 70, 1.0, 135, 11)        # góc trên-phải, đè góc ảnh 1
    bouquet(img, 20, 1330, .9, -35, 23)         # góc dưới-trái ảnh 2, toả lên (không đè cột ngày)
    bouquet(img, 1170, 1720, .9, -150, 37)      # góc dưới-phải tờ (dưới QR)
    fixed_marks(img, fonts)
    return img, fonts


def preview(frame, fonts):
    R = random.Random(2)
    out = Image.new('RGBA', (W, H), '#ffffff')
    for i, s in enumerate(SLOTS):
        ph = K.lin_grad(s['w'], s['h'], (0, 0), (s['w'], s['h']), [(0, '#cfc6bd'), (1, '#9c8f86')])
        out.alpha_composite(ph, (s['x'], s['y']))
        K.placeholder(out, s['x'], s['y'], s['w'], s['h'], 'ẢNH %d' % (i + 1), fonts)
    out.alpha_composite(frame)
    K.fake_qr(out, QR['x'], QR['y'], QR['size'], 5)
    for t in TEXTS: K.draw_text(out, fonts, t['value'], t['x'], t['y'], t)
    return out


if __name__ == '__main__':
    img, fonts = build()
    os.makedirs(OUT_DIR, exist_ok=True)
    img.save(os.path.join(OUT_DIR, 'ht-d2.png'))
    img.convert('RGB').resize((300, 450), Image.LANCZOS).save(os.path.join(OUT_DIR, 'ht-d2-thumb.png'))
    if '--preview' in sys.argv:
        os.makedirs(os.path.dirname(PREVIEW), exist_ok=True)
        preview(img, fonts).convert('RGB').save(PREVIEW)
        print('preview →', os.path.abspath(PREVIEW))
    print('frame →', OUT_DIR)
