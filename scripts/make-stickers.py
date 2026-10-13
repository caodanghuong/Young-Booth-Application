# Bộ sticker "đáng yêu" (kawaii) cho màn Trang trí — PNG nền trong suốt, viền trắng cắt dán + bóng nhẹ.
# Tự vẽ hoàn toàn (không dùng hình bên thứ ba). Chữ dùng font nhúng có tiếng Việt (Baloo 2).
# Chạy:  py scripts/make-stickers.py      → ghi renderer/stickers/cute/*.png (rồi đóng gói lại app)
import math, os, sys
from PIL import Image, ImageFilter, ImageChops
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from frame_kit import (rgba, shape, fill_poly, stroke_poly, circle, ellipse_rot, rect, heart_pts, star_pts, quad, cubic,
                       lin_grad, rad_grad, Fonts, draw_text, twinkle_pts)

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'renderer', 'stickers', 'cute')
N = 600                      # khung vẽ 600×600
INK = '#5a4656'              # viền nâu tím mềm
LW = 9                       # độ dày nét viền
BLUSH = (255, 140, 170, 150)
FONTS = Fonts()


def new():
    return Image.new('RGBA', (N, N), (0, 0, 0, 0))


def blob(img, pts, fill, lw=LW, ink=INK):
    """Hình tô màu + viền nâu (kiểu sticker vẽ tay)."""
    fill_poly(img, pts, fill)
    stroke_poly(img, pts, ink, lw)


def oval(cx, cy, rx, ry, rot=0.0, n=72):
    return ellipse_rot(cx, cy, rx, ry, rot, n)


def face(img, cx, cy, s, mouth='smile', blush=True, eye=None):
    """Mặt kawaii: mắt đen long lanh, má hồng, miệng nhỏ."""
    ex = s * .30
    for d in (-1, 1):
        if eye == 'closed':
            stroke_poly(img, [(cx + d * ex + math.cos(t) * s * .09, cy + math.sin(t) * s * .06) for t in [math.pi * (1 + i / 10) for i in range(11)]],
                        INK, s * .045, closed=False)
        else:
            fill_poly(img, oval(cx + d * ex, cy, s * .075, s * .10), '#3a2d38')
            circle(img, cx + d * ex - s * .025, cy - s * .035, s * .03, '#ffffff')
            circle(img, cx + d * ex + s * .02, cy + s * .035, s * .013, '#ffffff')
        if blush:
            fill_poly(img, oval(cx + d * s * .52, cy + s * .17, s * .11, s * .065), BLUSH)
    my = cy + s * .16
    if mouth == 'smile':
        stroke_poly(img, [(cx + math.cos(t) * s * .08, my - s * .02 + math.sin(t) * s * .06) for t in [math.pi * (i / 12) for i in range(13)]],
                    INK, s * .04, closed=False)
    elif mouth == 'w':
        pts = [(cx - s * .1, my), (cx - s * .05, my + s * .05), (cx, my), (cx + s * .05, my + s * .05), (cx + s * .1, my)]
        stroke_poly(img, pts, INK, s * .035, closed=False)
    elif mouth == 'open':
        fill_poly(img, [(cx + math.cos(t) * s * .075, my + math.sin(t) * s * .07) for t in [math.pi * (i / 16) for i in range(17)]] + [(cx - s * .075, my)], '#e8607c')
        stroke_poly(img, [(cx + math.cos(t) * s * .075, my + math.sin(t) * s * .07) for t in [math.pi * (i / 16) for i in range(17)]] + [(cx - s * .075, my)], INK, s * .03)


def sparkle(img, cx, cy, r, col='#fff3a6'):
    pts = twinkle_pts(cx, cy, r)
    fill_poly(img, pts, col); stroke_poly(img, pts, INK, max(3, min(9, r * .06)))


def die_cut(art, border=18, shadow=True):
    """Viền trắng cắt dán quanh hình + bóng mờ nhẹ, cắt sát khung."""
    a = art.getchannel('A')
    m = a.point(lambda v: 255 if v > 10 else 0).filter(ImageFilter.GaussianBlur(border * .62)).point(lambda v: 255 if v > 6 else 0)
    m = m.filter(ImageFilter.GaussianBlur(1.2))
    out = Image.new('RGBA', art.size, (0, 0, 0, 0))
    if shadow:
        sh = Image.new('RGBA', art.size, (60, 40, 70, 0)); sh.putalpha(m.point(lambda v: v * 55 // 255).filter(ImageFilter.GaussianBlur(7)))
        out.alpha_composite(sh, (0, 6))
    white = Image.new('RGBA', art.size, (255, 255, 255, 0)); white.putalpha(m)
    out.alpha_composite(white); out.alpha_composite(art)
    bb = out.getbbox()
    return out.crop((max(0, bb[0] - 6), max(0, bb[1] - 6), min(N, bb[2] + 6), min(N, bb[3] + 6)))


# ---------------------------------------------------------------- từng sticker
def s_gau():
    im = new(); c = (300, 320)
    for d in (-1, 1):
        blob(im, oval(c[0] + d * 150, 170, 62, 62), '#c89a74'); fill_poly(im, oval(c[0] + d * 150, 172, 34, 34), '#f2c9a0')
    blob(im, oval(*c, 205, 180), '#c89a74')
    blob(im, oval(300, 385, 82, 60), '#f6e2cc', lw=6)
    fill_poly(im, oval(300, 365, 22, 15), '#3a2d38')
    face(im, 300, 300, 230, mouth='w')
    return im


def s_meo():
    im = new()
    for d in (-1, 1):
        ear = [(300 + d * 70, 150), (300 + d * 190, 70), (300 + d * 185, 230)]
        blob(im, ear, '#fff8f2'); fill_poly(im, [(300 + d * 105, 160), (300 + d * 175, 110), (300 + d * 172, 200)], '#ffc4d4')
    blob(im, oval(300, 320, 210, 175), '#fff8f2')
    for d in (-1, 1):
        for k in (-1, 0, 1):
            stroke_poly(im, [(300 + d * 150, 360 + k * 18), (300 + d * 240, 345 + k * 30)], INK, 5, closed=False)
    fill_poly(im, [(288, 352), (312, 352), (300, 366)], '#ff8fb1')
    face(im, 300, 305, 230, mouth='w')
    return im


def s_tho():
    im = new()
    for d in (-1, 1):
        blob(im, oval(300 + d * 70, 150, 48, 125, d * .18), '#ffffff'); fill_poly(im, oval(300 + d * 70, 155, 24, 90, d * .18), '#ffc4d4')
    blob(im, oval(300, 375, 185, 160), '#ffffff')
    face(im, 300, 365, 210, mouth='w')
    return im


def s_may():
    im = new()
    pts = []
    for cx, cy, r in [(180, 330, 95), (290, 260, 125), (410, 300, 105), (470, 370, 70), (130, 390, 65)]:
        pts.append((cx, cy, r))
    body = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    for cx, cy, r in pts: circle(body, cx, cy, r, '#dff1ff')
    rect(body, 130, 330, 470, 440, '#dff1ff', radius=55)
    # viền: nét nâu quanh khối mây
    m = body.getchannel('A').point(lambda v: 255 if v > 40 else 0)
    edge = ImageChops.subtract(m.filter(ImageFilter.MaxFilter(17)), m)
    ink = Image.new('RGBA', (N, N), rgba(INK)); ink.putalpha(edge.filter(ImageFilter.GaussianBlur(1)))
    im.alpha_composite(body); im.alpha_composite(ink)
    face(im, 300, 345, 200, mouth='smile')
    return im


def s_tim():
    im = new(); pts = heart_pts(300, 330, 330)
    blob(im, pts, lambda w, h, x0, y0: lin_grad(w, h, (0, 0), (w, h), [(0, '#ffb3c9'), (1, '#ff7aa2')]))
    fill_poly(im, oval(215, 230, 40, 22, -.6), (255, 255, 255, 170))
    face(im, 300, 300, 220, mouth='open')
    return im


def s_sao():
    im = new(); pts = star_pts(300, 315, 260, .0, 5, .52)
    pts = [p for p in pts]
    blob(im, pts, lambda w, h, x0, y0: rad_grad(w, h, (300 - x0, 260 - y0), 10, 260, [(0, '#fff3a6'), (1, '#ffcf4d')]))
    face(im, 300, 320, 190, mouth='smile')
    return im


def s_dau():
    im = new()
    body = cubic((300, 520), (120, 470), (120, 190), (300, 190), 30) + cubic((300, 190), (480, 190), (480, 470), (300, 520), 30)[1:]
    blob(im, body, lambda w, h, x0, y0: lin_grad(w, h, (0, 0), (0, h), [(0, '#ff8aa0'), (1, '#ff5d79')]))
    for x, y in [(210, 270), (390, 270), (250, 440), (350, 440), (300, 480), (180, 360), (420, 360)]:
        fill_poly(im, oval(x, y, 7, 11, .3), '#ffe28a')
    for i in range(5):
        a = math.pi * (1.1 + i * .2)
        leaf = oval(300 + math.cos(a) * 55, 190 + math.sin(a) * 35, 55, 22, a)
        blob(im, leaf, '#7fcf7a', lw=6)
    blob(im, [(292, 150), (308, 150), (312, 100), (296, 100)], '#6bb768', lw=5)
    face(im, 300, 340, 190, mouth='w')
    return im


def s_kem():
    im = new()
    cone = [(220, 330), (380, 330), (300, 560)]
    blob(im, cone, '#f3c487')
    for k in range(1, 5):
        stroke_poly(im, [(220 + k * 32, 330), (300 + (k - 2.5) * 8, 560)], '#d49a55', 5, closed=False)
    scoop = cubic((190, 345), (140, 160), (460, 160), (410, 345), 30)
    drip = [(410, 345), (380, 380), (360, 345), (330, 395), (300, 345), (265, 375), (240, 345), (210, 370), (190, 345)]
    blob(im, scoop + drip, '#ffb6cf')
    circle(im, 300, 145, 30, '#ff5d79'); stroke_poly(im, oval(300, 145, 30, 30), INK, 6)
    stroke_poly(im, quad((305, 118), (320, 80), (345, 70)), '#6bb768', 6, closed=False)
    face(im, 300, 270, 170, mouth='smile')
    return im


def s_banh():
    im = new()
    blob(im, [(140, 300), (460, 300), (460, 500), (140, 500)], '#fff1d6')
    blob(im, [(140, 300), (460, 300), (460, 345)] + [(460 - k * 40, 345 + (20 if k % 2 else 0)) for k in range(9)] + [(140, 300)], '#ffb6cf')
    stroke_poly(im, [(140, 430), (460, 430)], '#ffb6cf', 14, closed=False)
    for x in (230, 300, 370):
        blob(im, [(x - 9, 300), (x + 9, 300), (x + 9, 215), (x - 9, 215)], '#9fd8ff', lw=5)
        fill_poly(im, oval(x, 195, 14, 24), '#ffcf4d'); fill_poly(im, oval(x, 200, 6, 12), '#ff8a5b')
    face(im, 300, 385, 150, mouth='smile', blush=True)
    return im


def s_cau_vong():
    im = new()
    for i, col in enumerate(['#ff9aa2', '#ffcf9a', '#fff1a6', '#b5ead7', '#a9d6ff', '#cdb4ff']):
        r = 200 - i * 23
        arc = [(300 + math.cos(t) * r, 400 - math.sin(t) * r) for t in [math.pi * k / 40 for k in range(41)]]
        inner = [(300 + math.cos(t) * (r - 23), 400 - math.sin(t) * (r - 23)) for t in [math.pi * k / 40 for k in range(40, -1, -1)]]
        fill_poly(im, arc + inner, col)
    stroke_poly(im, [(300 + math.cos(t) * 200, 400 - math.sin(t) * 200) for t in [math.pi * k / 40 for k in range(41)]], INK, LW, closed=False)
    for cx in (140, 450):
        for dx, dy, r in [(-30, 0, 42), (20, -16, 48), (52, 10, 36)]:
            circle(im, cx + dx, 410 + dy, r, '#ffffff')
        stroke_poly(im, oval(cx + 10, 415, 92, 50), INK, 7)
    return im


def s_no():
    im = new()
    for d in (-1, 1):
        wing = cubic((300, 300), (300 + d * 120, 150), (300 + d * 260, 220), (300 + d * 230, 330), 24) + cubic((300 + d * 230, 330), (300 + d * 220, 420), (300 + d * 110, 380), (300, 300), 24)[1:]
        blob(im, wing, '#ff9ec0')
        tail = [(300 + d * 15, 320), (300 + d * 90, 500), (300 + d * 140, 470), (300 + d * 50, 315)]
        blob(im, tail, '#ff86b0')
    blob(im, oval(300, 305, 48, 55), '#ff7aa2')
    for d in (-1, 1): fill_poly(im, oval(300 + d * 150, 250, 30, 14, d * -.5), (255, 255, 255, 140))
    return im


def s_ma_hong():
    im = new()
    for d in (-1, 1):
        fill_poly(im, oval(300 + d * 150, 300, 105, 62), (255, 125, 160, 200))
        for k in range(3):
            stroke_poly(im, [(300 + d * 150 - 50 + k * 35, 330), (300 + d * 150 - 30 + k * 35, 270)], (255, 255, 255, 200), 7, closed=False)
    sparkle(im, 300, 220, 34)
    return im


def ears(im, kind):
    band = [(300 + math.cos(t) * 230, 470 - math.sin(t) * 210) for t in [math.pi * (.08 + .84 * k / 40) for k in range(41)]]
    stroke_poly(im, band, INK, 34, closed=False); stroke_poly(im, band, '#ffd1e0', 20, closed=False)
    for d in (-1, 1):
        if kind == 'meo':
            e = [(300 + d * 60, 300), (300 + d * 175, 120), (300 + d * 215, 320)]
            blob(im, e, '#ffffff'); fill_poly(im, [(300 + d * 100, 300), (300 + d * 170, 175), (300 + d * 190, 300)], '#ffb3c9')
        else:
            e = oval(300 + d * 95, 190, 52, 140, d * .2)
            blob(im, e, '#ffffff'); fill_poly(im, oval(300 + d * 95, 200, 25, 100, d * .2), '#ffb3c9')
    if kind == 'tho':
        no = cubic((300, 300), (240, 240), (190, 290), (230, 330), 16) + cubic((230, 330), (260, 350), (290, 320), (300, 300), 16)[1:]
        blob(im, no, '#ff86b0', lw=6); blob(im, [(2 * 300 - x, y) for x, y in no], '#ff86b0', lw=6); circle(im, 300, 305, 20, '#ff7aa2')
    return im


def s_tai_meo(): return ears(new(), 'meo')


def s_tai_tho(): return ears(new(), 'tho')


def s_kinh_tim():
    im = new()
    for d in (-1, 1):
        pts = heart_pts(300 + d * 135, 330, 230)
        fill_poly(im, pts, (255, 150, 190, 150))
        stroke_poly(im, pts, '#ff5d8f', 22); stroke_poly(im, pts, INK, 5)
        fill_poly(im, oval(300 + d * 135 - 45, 270, 30, 14, -.6), (255, 255, 255, 190))
    stroke_poly(im, quad((235, 290), (300, 255), (365, 290)), '#ff5d8f', 18, closed=False)
    return im


def s_vuong_mien_hoa():
    im = new()
    arc = [(300 + math.cos(t) * 240, 470 - math.sin(t) * 200) for t in [math.pi * (.06 + .88 * k / 40) for k in range(41)]]
    stroke_poly(im, arc, '#8bc58a', 14, closed=False)
    cols = ['#ffb3c9', '#fff1a6', '#cdb4ff', '#b5ead7', '#ffcf9a', '#a9d6ff', '#ffb3c9']
    for i in range(7):
        t = math.pi * (.12 + .76 * i / 6); x, y = 300 + math.cos(t) * 240, 470 - math.sin(t) * 200
        for a in range(0, 360, 72):
            r = math.radians(a + i * 20)
            blob(im, oval(x + math.cos(r) * 26, y + math.sin(r) * 26, 27, 20, r), cols[i], lw=5)
        circle(im, x, y, 15, '#ffcf4d'); stroke_poly(im, oval(x, y, 15, 15), INK, 4)
        if i < 6:
            t2 = math.pi * (.12 + .76 * (i + .5) / 6); lx, ly = 300 + math.cos(t2) * 245, 470 - math.sin(t2) * 205
            blob(im, oval(lx, ly - 20, 26, 12, t2), '#7fcf7a', lw=4)
    return im


def s_vuong_mien():
    im = new()
    pts = [(130, 420), (130, 230), (215, 320), (300, 170), (385, 320), (470, 230), (470, 420)]
    blob(im, pts, lambda w, h, x0, y0: lin_grad(w, h, (0, 0), (0, h), [(0, '#fff1a6'), (1, '#ffc94a')]))
    rect(im, 130, 395, 470, 445, '#ffd86b'); stroke_poly(im, [(130, 395), (470, 395), (470, 445), (130, 445)], INK, LW)
    for x, col in [(215, '#ff8fb1'), (300, '#a9d6ff'), (385, '#ff8fb1')]:
        circle(im, x, 420, 16, col); stroke_poly(im, oval(x, 420, 16, 16), INK, 4)
    for x, y in [(130, 230), (300, 170), (470, 230)]:
        circle(im, x, y, 20, '#ff8fb1'); stroke_poly(im, oval(x, y, 20, 20), INK, 5)
    return im


def bubble(text, fill, color='#ffffff', w=470, h=250, tail='left', size=96, heart=False):
    im = new()
    cx, cy = 300, 270
    body = oval(cx, cy, w / 2, h / 2)
    if tail == 'left':
        t = [(cx - w * .28, cy + h * .38), (cx - w * .45, cy + h * .78), (cx - w * .08, cy + h * .45)]
    else:
        t = [(cx + w * .28, cy + h * .38), (cx + w * .45, cy + h * .78), (cx + w * .08, cy + h * .45)]
    fill_poly(im, t, fill); fill_poly(im, body, fill)
    stroke_poly(im, body, INK, LW); stroke_poly(im, t, INK, LW, closed=False)
    fill_poly(im, t, fill)
    fill_poly(im, oval(cx, cy, w / 2 - 5, h / 2 - 5), fill)
    fill_poly(im, oval(cx - w * .3, cy - h * .28, 34, 15, -.4), (255, 255, 255, 150))
    draw_text(im, FONTS, text, cx, cy + size * .34, dict(size=size, ff='Baloo 2', weight=800, color=color, fit=w * .82, stroke=INK, strokeW=12))
    if heart:
        pts = heart_pts(cx + w * .43, cy - h * .42, 70); fill_poly(im, pts, '#ff5d8f'); stroke_poly(im, pts, INK, 6)
    return im


def s_lap_lanh():
    im = new()
    for x, y, r, col in [(260, 280, 150, '#fff3a6'), (430, 170, 70, '#ffd1e0'), (440, 400, 55, '#cdb4ff'), (140, 430, 45, '#b5ead7')]:
        sparkle(im, x, y, r, col)
    return im


def s_hoa_cuc():
    im = new()
    for a in range(0, 360, 30):
        r = math.radians(a)
        blob(im, oval(300 + math.cos(r) * 135, 300 + math.sin(r) * 135, 85, 42, r), '#ffffff', lw=6)
    blob(im, oval(300, 300, 105, 105), '#ffd86b')
    face(im, 300, 295, 150, mouth='smile')
    return im


def s_tim_nho():
    im = new()
    for x, y, s, c in [(230, 300, 230, '#ff8fb1'), (410, 220, 150, '#ffb3c9'), (420, 420, 110, '#ff6f9a'), (130, 170, 90, '#ffd1e0')]:
        pts = heart_pts(x, y, s); blob(im, pts, c, lw=7)
        fill_poly(im, oval(x - s * .25, y - s * .27, s * .12, s * .06, -.6), (255, 255, 255, 170))
    return im


def s_bong_bay():
    im = new()
    for x, y, c in [(200, 230, '#ffb3c9'), (400, 210, '#a9d6ff'), (300, 160, '#fff1a6')]:
        stroke_poly(im, quad((x, y + 125), (x + 20, y + 230), (300, 540)), INK, 4, closed=False)
    for x, y, c in [(200, 230, '#ffb3c9'), (400, 210, '#a9d6ff'), (300, 160, '#fff1a6')]:
        blob(im, oval(x, y, 95, 118), c)
        fill_poly(im, [(x - 14, y + 128), (x + 14, y + 128), (x, y + 112)], c); stroke_poly(im, [(x - 14, y + 128), (x + 14, y + 128), (x, y + 112)], INK, 5)
        fill_poly(im, oval(x - 35, y - 45, 22, 36, .5), (255, 255, 255, 170))
    return im


STICKERS = [
    ('gau', s_gau), ('meo', s_meo), ('tho', s_tho), ('tim', s_tim), ('sao', s_sao), ('may', s_may),
    ('tai-meo', s_tai_meo), ('tai-tho', s_tai_tho), ('kinh-tim', s_kinh_tim), ('vuong-mien-hoa', s_vuong_mien_hoa),
    ('vuong-mien', s_vuong_mien), ('no', s_no), ('ma-hong', s_ma_hong),
    ('xinh-xiu', lambda: bubble('Xinh xỉu!', '#ff8fb1', size=104, heart=True)),
    ('yeu-qua', lambda: bubble('Yêu quá!', '#cdb4ff', size=104, tail='right')),
    ('dang-yeu', lambda: bubble('Đáng yêu ghê', '#7cc8f0', size=84)),
    ('best-friend', lambda: bubble('Bạn thân', '#ffb067', size=100, tail='right', heart=True)),
    ('happy', lambda: bubble('Happy!', '#7fcf9a', size=110)),
    ('dau', s_dau), ('kem', s_kem), ('banh-kem', s_banh), ('cau-vong', s_cau_vong),
    ('hoa-cuc', s_hoa_cuc), ('tim-nho', s_tim_nho), ('lap-lanh', s_lap_lanh), ('bong-bay', s_bong_bay),
]

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    only = set(sys.argv[1:])
    for name, fn in STICKERS:
        if only and name not in only: continue
        die_cut(fn()).save(os.path.join(OUT, name + '.png'), optimize=True)
        print(' ', name)
    print('ok ->', os.path.abspath(OUT))
