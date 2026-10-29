# Bộ hàm vẽ dùng chung cho khung PNG (dùng bởi scripts/frame_sets.py → make-frames.py).
# Vẽ bằng mặt nạ siêu lấy mẫu (×4) rồi thu nhỏ → viền mịn; màu chuyển bằng numpy.
# Chữ: dùng font nhúng renderer/fonts (woff2, tách subset) — tự chọn subset theo từng ký tự → đủ dấu tiếng Việt.
import math, os, re, zlib, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(HERE, '..', 'renderer', 'fonts')
CLEAR = (0, 0, 0, 0)


def rgba(c, a=None):
    """'#rrggbb' | (r,g,b) | (r,g,b,a) → (r,g,b,a); a (0..1) nhân thêm độ mờ."""
    if isinstance(c, str):
        c = c.lstrip('#')
        if len(c) == 3: c = ''.join(ch * 2 for ch in c)
        t = (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), 255)
    else:
        t = tuple(c) + ((255,) if len(c) == 3 else ())
    if a is not None: t = t[:3] + (round(t[3] * a),)
    return t


def seeded(key, salt=0):
    return random.Random(zlib.crc32(key.encode()) + salt)


# ---------------------------------------------------------------- dán lớp an toàn (toạ độ âm / tràn mép)
def comp(dst, src, ox, oy):
    ox, oy = int(round(ox)), int(round(oy))
    W, H = dst.size; w, h = src.size
    x0, y0, x1, y1 = max(0, ox), max(0, oy), min(W, ox + w), min(H, oy + h)
    if x0 >= x1 or y0 >= y1: return
    dst.alpha_composite(src.crop((x0 - ox, y0 - oy, x1 - ox, y1 - oy)), (x0, y0))


# ---------------------------------------------------------------- màu chuyển
def _stops(stops, t):
    pos = np.array([p for p, _ in stops], dtype=np.float32)
    cols = np.array([rgba(c) for _, c in stops], dtype=np.float32)
    out = np.empty(t.shape + (4,), dtype=np.float32)
    for k in range(4): out[..., k] = np.interp(t, pos, cols[:, k])
    return out


def lin_grad(w, h, p0, p1, stops):
    """Ảnh w×h màu chuyển tuyến tính từ p0 → p1 (toạ độ trong ảnh). stops = [(0..1, màu), ...]."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    L2 = dx * dx + dy * dy or 1
    t = np.clip(((xx - p0[0]) * dx + (yy - p0[1]) * dy) / L2, 0, 1)
    return Image.fromarray(_stops(stops, t).round().astype(np.uint8), 'RGBA')


def rad_grad(w, h, c, r0, r1, stops):
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt((xx - c[0]) ** 2 + (yy - c[1]) ** 2)
    t = np.clip((d - r0) / max(1e-3, r1 - r0), 0, 1)
    return Image.fromarray(_stops(stops, t).round().astype(np.uint8), 'RGBA')


# ---------------------------------------------------------------- hình (mặt nạ ×SS)
SS = 4


def shape(img, box, paint, fill, blur=0, alpha=1.0, ss=SS, offset=(0, 0)):
    """Vẽ 1 hình lên img. paint(d, P, k): d = ImageDraw (mặt nạ L), P(x,y) đổi toạ độ ảnh → toạ độ mặt nạ,
    k = hệ số phóng (để đổi độ dày nét). fill = màu hoặc hàm (w,h,x0,y0) → ảnh RGBA màu chuyển."""
    pad = int(blur * 3) + 2
    x0, y0 = int(math.floor(box[0])) - pad, int(math.floor(box[1])) - pad
    x1, y1 = int(math.ceil(box[2])) + pad, int(math.ceil(box[3])) + pad
    w, h = max(1, x1 - x0), max(1, y1 - y0)
    m = Image.new('L', (w * ss, h * ss), 0)
    d = ImageDraw.Draw(m)
    paint(d, lambda x, y: ((x - x0) * ss, (y - y0) * ss), ss)
    m = m.resize((w, h), Image.LANCZOS)
    if blur: m = m.filter(ImageFilter.GaussianBlur(blur))
    if callable(fill): layer = fill(w, h, x0, y0)
    else: layer = Image.new('RGBA', (w, h), rgba(fill))
    a = np.asarray(layer.getchannel('A'), dtype=np.float32) * (np.asarray(m, dtype=np.float32) / 255.0) * alpha
    layer.putalpha(Image.fromarray(a.clip(0, 255).astype(np.uint8)))
    comp(img, layer, x0 + offset[0], y0 + offset[1])


def poly_box(pts, extra=0):
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    return (min(xs) - extra, min(ys) - extra, max(xs) + extra, max(ys) + extra)


def fill_poly(img, pts, fill, blur=0, alpha=1.0, offset=(0, 0)):
    shape(img, poly_box(pts), lambda d, P, k: d.polygon([P(*p) for p in pts], fill=255), fill, blur, alpha, offset=offset)


def stroke_poly(img, pts, color, width, closed=True, alpha=1.0, blur=0):
    q = list(pts) + ([pts[0]] if closed else [])
    def paint(d, P, k):
        d.line([P(*p) for p in q], fill=255, width=max(1, round(width * k)), joint='curve')
        for p in q:  # đầu nét tròn
            r = width * k / 2; c = P(*p); d.ellipse([c[0] - r, c[1] - r, c[0] + r, c[1] + r], fill=255)
    shape(img, poly_box(q, width), paint, color, blur, alpha)


def circle(img, cx, cy, r, fill, blur=0, alpha=1.0, offset=(0, 0)):
    shape(img, (cx - r, cy - r, cx + r, cy + r),
          lambda d, P, k: d.ellipse([*P(cx - r, cy - r), *P(cx + r, cy + r)], fill=255), fill, blur, alpha, offset=offset)


def ellipse_rot(cx, cy, rx, ry, rot, n=48):
    c, s = math.cos(rot), math.sin(rot)
    return [(cx + rx * math.cos(t) * c - ry * math.sin(t) * s, cy + rx * math.cos(t) * s + ry * math.sin(t) * c)
            for t in (i / n * 2 * math.pi for i in range(n))]


def rect(img, x0, y0, x1, y1, fill, radius=0, alpha=1.0, blur=0):
    shape(img, (x0, y0, x1, y1),
          lambda d, P, k: d.rounded_rectangle([*P(x0, y0), *P(x1, y1)], radius=radius * k, fill=255), fill, blur, alpha)


def stroke_rect(img, x0, y0, x1, y1, color, width, radius=0, alpha=1.0):
    shape(img, (x0 - width, y0 - width, x1 + width, y1 + width),
          lambda d, P, k: d.rounded_rectangle([*P(x0, y0), *P(x1, y1)], radius=radius * k, outline=255,
                                              width=max(1, round(width * k))), color, 0, alpha)


def cubic(p0, p1, p2, p3, n=20):
    out = []
    for i in range(n + 1):
        t = i / n; u = 1 - t
        out.append((u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
                    u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1]))
    return out


def quad(p0, p1, p2, n=20):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
             (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]) for t in (i / n for i in range(n + 1))]


# ---------------------------------------------------------------- hoạ tiết
def star_pts(cx, cy, r, rot=0.0, pts=5, inner=0.45):
    """Sao `pts` cánh, 1 cánh hướng thẳng lên khi rot = 0 (rad)."""
    return [(cx + math.cos(rot + i * math.pi / pts - math.pi / 2) * (r if i % 2 == 0 else r * inner),
             cy + math.sin(rot + i * math.pi / pts - math.pi / 2) * (r if i % 2 == 0 else r * inner))
            for i in range(pts * 2)]


def draw_star(img, cx, cy, r, fill, rot=0.0, inner=0.45, alpha=1.0):
    fill_poly(img, star_pts(cx, cy, r, rot, 5, inner), fill, alpha=alpha)


def metal_star(img, cx, cy, r, gold=True, rot=0.0):
    """Sao kim tuyến: màu chuyển chéo vàng / bạc + chấm sáng."""
    st = ([(0, '#c99a2e'), (.5, '#f5dc8c'), (1, '#b8892a')] if gold else
          [(0, '#a9adb2'), (.5, '#f0f2f4'), (1, '#9ca1a7')])
    pts = star_pts(cx, cy, r, rot)
    fill_poly(img, pts, (0, 0, 0, 60), blur=1.2, offset=(1, 1))
    fill_poly(img, pts, lambda w, h, x0, y0: lin_grad(w, h, (cx - r - x0, cy - r - y0), (cx + r - x0, cy + r - y0), st))
    circle(img, cx - r * .18, cy - r * .22, max(1.2, r * .12), (255, 255, 255, 230))


def twinkle_pts(cx, cy, r, rot=0.0):
    return star_pts(cx, cy, r, rot, 4, 0.28)


def glow_star(img, cx, cy, r, color='#ffffff', four=False, halo=0.35):
    """Sao trắng phát sáng: quầng mờ phía sau + sao sắc nét."""
    pts = twinkle_pts(cx, cy, r) if four else star_pts(cx, cy, r)
    circle(img, cx, cy, r * 1.1, rgba(color, halo), blur=max(3, r * .55))
    fill_poly(img, pts, rgba(color, .55), blur=max(1.5, r * .18))
    fill_poly(img, pts, color)


def gem(img, cx, cy, r, pink=True):
    """Đá pha lê vector: bóng đổ + tròn màu chuyển toả tâm + 8 mặt cắt sáng/tối + chấm sáng."""
    circle(img, cx, cy + r * .12, r, (0, 0, 0, 70), blur=max(1.5, r * .18))
    st = ([(0, '#ffd1e0'), (.5, '#e8618c'), (1, '#b8325f')] if pink else
          [(0, '#ffffff'), (.55, '#e2e6ea'), (1, '#9aa0a6')])
    circle(img, cx, cy, r, lambda w, h, x0, y0: rad_grad(w, h, (cx - r * .3 - x0, cy - r * .3 - y0), r * .1, r * 1.2, st))
    edge = '#b8325f' if pink else '#9aa0a6'
    stroke_poly(img, ellipse_rot(cx, cy, r * .97, r * .97, 0, 40), edge, max(1, r * .08))
    for i in range(8):  # mặt cắt hình sao
        a = i * math.pi / 4
        p0 = (cx + math.cos(a) * r * .42, cy + math.sin(a) * r * .42)
        p1 = (cx + math.cos(a + .39) * r * .93, cy + math.sin(a + .39) * r * .93)
        stroke_poly(img, [p0, p1], (255, 255, 255, 170) if i % 2 == 0 else (0, 0, 0, 45), max(.8, r * .06), closed=False)
    fill_poly(img, [(cx + math.cos(i * math.pi / 4 + .2) * r * .42, cy + math.sin(i * math.pi / 4 + .2) * r * .42) for i in range(8)],
              (255, 255, 255, 60))
    circle(img, cx - r * .36, cy - r * .36, max(1.2, r * .18), (255, 255, 255, 240))


def heart_pts(cx, cy, s, n=24):
    """Trái tim (bề rộng ≈ 1.1·s) — cùng đường cong với demo."""
    a = cubic((cx, cy + s * .35), (cx - s * .9, cy - s * .2), (cx - s * .45, cy - s * .85), (cx, cy - s * .35), n)
    b = cubic((cx, cy - s * .35), (cx + s * .45, cy - s * .85), (cx + s * .9, cy - s * .2), (cx, cy + s * .35), n)
    return a + b[1:]


def flag_vn(img, x, y, w, wave=0.0):
    """Cờ đỏ sao vàng chuẩn: tỉ lệ 2:3, sao 5 cánh ở tâm, đường kính vòng ngoại tiếp sao = 0.6 chiều cao cờ."""
    h = w * 2 / 3
    if wave:
        top = [(x + w * t, y + math.sin(t * math.pi * 2) * wave) for t in (i / 24 for i in range(25))]
        bot = [(x + w * t, y + h + math.sin(t * math.pi * 2) * wave) for t in (i / 24 for i in range(24, -1, -1))]
        fill_poly(img, top + bot, '#da251d')
        draw_star(img, x + w / 2, y + h / 2 + math.sin(math.pi) * wave, h * .3, '#ffff00')
    else:
        rect(img, x, y, x + w, y + h, '#da251d')
        draw_star(img, x + w / 2, y + h / 2, h * .3, '#ffff00')


def heart_flag(img, cx, cy, s):
    pts = heart_pts(cx, cy, s)
    stroke_poly(img, pts, '#ffffff', s * .12)
    fill_poly(img, pts, '#da251d')
    draw_star(img, cx, cy - s * .1, s * .22, '#ffff00')


def fireworks(img, cx, cy, r, cols, R, rays=18):
    for i in range(rays):
        a = i / rays * math.pi * 2 + R.random() * .1
        L = r * (.7 + R.random() * .3)
        c = cols[i % len(cols)]
        stroke_poly(img, [(cx + math.cos(a) * r * .22, cy + math.sin(a) * r * .22), (cx + math.cos(a) * L, cy + math.sin(a) * L)],
                    c, max(2, r * .035), closed=False)
        circle(img, cx + math.cos(a) * (L + r * .08), cy + math.sin(a) * (L + r * .08), max(1.5, r * .04), c)
    for i in range(rays // 2):  # vòng chấm trong
        a = (i + .5) / (rays // 2) * math.pi * 2
        circle(img, cx + math.cos(a) * r * .45, cy + math.sin(a) * r * .45, max(1.2, r * .025), cols[(i + 1) % len(cols)])
    circle(img, cx, cy, max(2, r * .06), cols[0])


def cloud(img, x, y, s, color='#ffffff', alpha=1.0, blur=0):
    for dx, dy, r in [(0, 0, .5), (.45, -.18, .42), (.85, 0, .45), (.4, .15, .45), (-.35, .12, .35), (1.2, .15, .32)]:
        circle(img, x + dx * s, y + dy * s, r * s, color, alpha=alpha, blur=blur)


def skyline(img, x, y, w, h, color, R, alpha=1.0):
    """Silhouette thành phố đơn giản (tự vẽ): khối nhà cao thấp + vài chóp nhọn; đáy tại y."""
    pts = [(x, y)]
    cx = x
    while cx < x + w:
        bw = 20 + R.random() * 50; bh = h * (.3 + R.random() * .7)
        bw = min(bw, x + w - cx)
        pts += [(cx, y - bh)]
        if R.random() > .78:
            pts += [(cx + bw * .35, y - bh), (cx + bw / 2, y - bh - h * .3), (cx + bw * .65, y - bh)]
        pts += [(cx + bw, y - bh), (cx + bw, y)]
        cx += bw + 4
        if cx < x + w: pts += [(cx, y)]
    pts += [(x + w, y)]
    fill_poly(img, pts, color, alpha=alpha)


def clover(img, cx, cy, size, alpha=1.0, rot=.3):
    """Cỏ bốn lá vector (tạm thời, khi chưa có ảnh màu nước bản quyền): 4 lá tim xanh, gân sáng, thân mảnh."""
    stem = quad((cx, cy), (cx + size * .1, cy + size * .35), (cx + size * .05, cy + size * .55))
    stroke_poly(img, stem, rgba('#5b8f45', .9 * alpha), size * .035, closed=False)
    for i in range(4):
        a = rot + i * math.pi / 2
        hc = (cx + math.sin(a) * size * .26, cy - math.cos(a) * size * .26)
        pts = heart_pts(0, 0, size * .44)
        ca, sa = math.cos(a), math.sin(a)
        pts = [(hc[0] + (px) * ca - (py + size * .0) * sa, hc[1] + px * sa + py * ca) for px, py in pts]
        fill_poly(img, pts, lambda w, h, x0, y0, hc=hc, a=a: lin_grad(
            w, h, (cx - x0, cy - y0), (cx + math.sin(a) * size * .5 - x0, cy - math.cos(a) * size * .5 - y0),
            [(0, '#4f8a3e'), (1, '#a6d47f')]), alpha=.92 * alpha, blur=.6)
        stroke_poly(img, pts, rgba('#3f7a33', .55 * alpha), max(1, size * .012))
        tip = (cx + math.sin(a) * size * .4, cy - math.cos(a) * size * .4)
        stroke_poly(img, [(cx + math.sin(a) * size * .05, cy - math.cos(a) * size * .05), tip],
                    (255, 255, 255, round(110 * alpha)), max(1, size * .012), closed=False)


def leaf(img, x, y, s, rot, alpha=1.0):
    pts = ellipse_rot(x, y, 70 * s, 26 * s, rot)
    fill_poly(img, pts, lambda w, h, x0, y0: lin_grad(
        w, h, (x - 60 * s * math.cos(rot) - x0, y - 60 * s * math.sin(rot) - y0),
        (x + 60 * s * math.cos(rot) - x0, y + 60 * s * math.sin(rot) - y0), [(0, '#3e6b3a'), (1, '#6f9a5c')]), alpha=alpha, blur=.6)
    stroke_poly(img, [(x - 60 * s * math.cos(rot), y - 60 * s * math.sin(rot)), (x + 60 * s * math.cos(rot), y + 60 * s * math.sin(rot))],
                (255, 255, 255, round(90 * alpha)), 2, closed=False)


def lantern(img, cx, cy, r):
    """Đèn ông sao: sao vàng viền đỏ, vòng xanh lá, tua."""
    pts = star_pts(cx, cy, r)
    for i in range(3):
        stroke_poly(img, [(cx - r * .2 + i * r * .2, cy + r * .6), (cx - r * .25 + i * r * .25, cy + r * 1.35)], '#d0452f', max(1.5, r * .07), closed=False)
    fill_poly(img, pts, lambda w, h, x0, y0: rad_grad(w, h, (cx - x0, cy - y0), 0, r, [(0, '#fff3a6'), (1, '#e8b923')]))
    stroke_poly(img, pts, '#d0452f', max(1.5, r * .1))
    stroke_poly(img, ellipse_rot(cx, cy, r * .35, r * .35, 0, 28), '#7ac74f', max(1.2, r * .07))
    circle(img, cx, cy, r * 1.4, (255, 230, 140, 70), blur=r * .5)


def placeholder(img, x, y, w, h, label, fonts):
    """Ô giữ chỗ nét đứt (CHỈ vẽ trên ảnh thumb để admin biết thiếu file asset)."""
    rect(img, x, y, x + w, y + h, (255, 255, 255, 120))
    d = ImageDraw.Draw(img)
    for x0, y0, x1, y1 in [(x, y, x + w, y), (x, y + h, x + w, y + h), (x, y, x, y + h), (x + w, y, x + w, y + h)]:
        L = math.hypot(x1 - x0, y1 - y0); n = int(L // 24) + 1
        for i in range(n):
            t0, t1 = i * 24 / L, min(1, (i * 24 + 14) / L)
            d.line([(x0 + (x1 - x0) * t0, y0 + (y1 - y0) * t0), (x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1)], fill=(0, 0, 0, 120), width=3)
    lines = label.split('\n'); size = max(14, min(30, w / 8))
    for i, ln in enumerate(lines):
        draw_text(img, fonts, ln, x + w / 2, y + h / 2 + (i - (len(lines) - 1) / 2) * size * 1.25 + size * .35,
                  {'size': size, 'ff': 'Be Vietnam Pro', 'weight': 700, 'color': (0, 0, 0, 150)})


def load_asset(path):
    try:
        return Image.open(path).convert('RGBA') if os.path.isfile(path) else None
    except Exception:
        return None


def paste_fit(img, asset, x, y, w, h, align='center', alpha=1.0):
    """Dán asset vừa trong hộp (giữ tỉ lệ, không méo)."""
    k = min(w / asset.width, h / asset.height)
    a = asset.resize((max(1, round(asset.width * k)), max(1, round(asset.height * k))), Image.LANCZOS)
    if alpha < 1: a.putalpha(a.getchannel('A').point(lambda v: round(v * alpha)))
    ax = x + (w - a.width) / 2 if align == 'center' else (x if align == 'left' else x + w - a.width)
    ay = y + (h - a.height) / 2 if align != 'bottom' else y + h - a.height
    comp(img, a, ax, ay)


# ---------------------------------------------------------------- chữ (font nhúng, chọn subset theo ký tự)
class Fonts:
    def __init__(self, font_dir=FONT_DIR):
        self.dir = font_dir
        self.faces = {}   # (family_lower, italic) → [(weight, [(file, ranges)])]
        css = open(os.path.join(font_dir, 'fonts.css'), encoding='utf-8').read()
        for blk in re.findall(r'@font-face\s*\{(.*?)\}', css, re.S):
            fam = re.search(r"font-family:\s*'([^']+)'", blk).group(1).lower()
            ital = 'italic' in re.search(r'font-style:\s*(\w+)', blk).group(1)
            wt = int(re.search(r'font-weight:\s*(\d+)', blk).group(1))
            fil = re.search(r'url\(([^)]+)\)', blk).group(1)
            rng = []
            for part in re.search(r'unicode-range:\s*([^;]+);', blk).group(1).split(','):
                a = part.strip()[2:].split('-')
                rng.append((int(a[0], 16), int(a[-1], 16)))
            lst = self.faces.setdefault((fam, ital), {})
            lst.setdefault(wt, []).append((fil, rng))
        self._cache = {}

    def get(self, family, weight=400, italic=False, size=40):
        fam = family.lower()
        if (fam, italic) not in self.faces: italic = False
        if (fam, italic) not in self.faces: fam = 'be vietnam pro'
        ws = self.faces[(fam, italic)]
        wt = min(ws, key=lambda w: abs(w - int(weight)))
        key = (fam, italic, wt, round(size, 1))
        if key not in self._cache:
            self._cache[key] = [(ImageFont.truetype(os.path.join(self.dir, f), max(1, round(size))), r) for f, r in ws[wt]]
        return self._cache[key]


def _font_for(fl, ch):
    o = ord(ch)
    for f, rng in fl:
        if any(a <= o <= b for a, b in rng): return f
    return fl[0][0]


def _family(ff):
    m = re.match(r'\s*["\']?([^"\',]+)', ff or 'Be Vietnam Pro')
    return m.group(1).strip()


def _runs(s, fl, ls):
    """Chia chuỗi thành đoạn cùng font. ls > 0 → từng ký tự (giống app đo từng ký tự)."""
    out = []
    for ch in s:
        f = _font_for(fl, ch)
        if not ls and out and out[-1][1] is f: out[-1][0] += ch
        else: out.append([ch, f])
    return out


def text_width(s, fl, ls=0):
    if ls:  # như app: cộng độ rộng từng ký tự + giãn chữ
        return sum(_font_for(fl, c).getlength(c) for c in s) + ls * max(0, len(s) - 1)
    return sum(f.getlength(t) for t, f in _runs(s, fl, 0))


def draw_text(img, fonts, s, x, y, o):
    """Vẽ chữ giống drawFrameTexts của app: size, ff, weight, italic, color, ls, align, stroke, strokeW, rotate, fit, w, lh.
    (x, y) = điểm neo theo align, y = baseline. Trả về hộp bao gần đúng (x0, y0, x1, y1)."""
    if not s: return None
    fam, wt, it = _family(o.get('ff')), o.get('weight', 400), bool(o.get('italic'))
    size = o['size']; ls = o.get('ls', 0)
    fl = fonts.get(fam, wt, it, size)
    if o.get('fit') and not o.get('w'):
        mn = max(8, round(o['size'] * .6))
        while size > mn and text_width(s, fl, ls) > o['fit']:
            size -= 2; fl = fonts.get(fam, wt, it, size)
    lines = [s]
    if o.get('w'):
        lines, line = [], ''
        for wd in s.split():
            t = (line + ' ' + wd) if line else wd
            if text_width(t, fl, ls) > o['w'] and line: lines.append(line); line = wd
            else: line = t
        if line: lines.append(line)
    lh = o.get('lh') or size * 1.3
    align = o.get('align', 'center')
    color = rgba(o.get('color', '#000'))
    sw = o.get('strokeW', o.get('strokeWidth', 4)) if o.get('stroke') else 0
    widths = [text_width(ln, fl, ls) for ln in lines]
    span = max(widths) + sw * 2 + size
    S = int(2 * (span + len(lines) * lh + size * 2)) + 8
    layer = Image.new('RGBA', (S, S), CLEAR)
    d = ImageDraw.Draw(layer)
    ax = ay = S / 2
    for li, ln in enumerate(lines):
        tot = widths[li]
        x0 = ax + (0 if align == 'left' else -tot if align == 'right' else -tot / 2)
        by = ay + li * lh
        for pas in ('stroke', 'fill') if sw else ('fill',):
            cx = x0
            for t, f in _runs(ln, fl, ls):
                if pas == 'stroke':
                    d.text((cx, by), t, font=f, anchor='ls', fill=rgba(o['stroke']), stroke_width=max(1, round(sw / 2)),
                           stroke_fill=rgba(o['stroke']))
                else:
                    d.text((cx, by), t, font=f, anchor='ls', fill=color)
                cx += f.getlength(t) + (ls if ls else 0)
    if o.get('rotate'):
        layer = layer.rotate(-o['rotate'], resample=Image.BICUBIC, center=(ax, ay))
    comp(img, layer, x - ax, y - ay)
    bb = layer.getbbox()
    return (bb[0] + x - ax, bb[1] + y - ay, bb[2] + x - ax, bb[3] + y - ay) if bb else None


def fake_qr(img, x, y, s, seed):
    """Ô QR mẫu (chỉ dùng cho thumb) — cùng kích thước ô trắng của app: pad 10%, không nhãn."""
    pad = round(s * .10)
    rect(img, x, y, x + s + pad * 2, y + s + pad * 2, '#ffffff', radius=16)
    stroke_rect(img, x, y, x + s + pad * 2, y + s + pad * 2, (0, 0, 0, 30), 2, radius=16)
    R = random.Random(seed); n = 25; m = s / n; d = ImageDraw.Draw(img)
    ox, oy = x + pad, y + pad
    for i in range(n):
        for j in range(n):
            fz = (i < 8 and j < 8) or (i > n - 9 and j < 8) or (i < 8 and j > n - 9)
            if not fz and R.random() > .52: d.rectangle([ox + i * m, oy + j * m, ox + (i + 1) * m - 1, oy + (j + 1) * m - 1], fill=(17, 17, 17, 255))
    for fx, fy in [(0, 0), (n - 7, 0), (0, n - 7)]:
        d.rectangle([ox + fx * m, oy + fy * m, ox + (fx + 7) * m - 1, oy + (fy + 7) * m - 1], fill=(17, 17, 17, 255))
        d.rectangle([ox + (fx + 1) * m, oy + (fy + 1) * m, ox + (fx + 6) * m - 1, oy + (fy + 6) * m - 1], fill=(255, 255, 255, 255))
        d.rectangle([ox + (fx + 2) * m, oy + (fy + 2) * m, ox + (fx + 5) * m - 1, oy + (fy + 5) * m - 1], fill=(17, 17, 17, 255))


# ---------------------------------------------------------------- ô ảnh
def strip_slots(top, bottom, side, gap, radius=0, n=4):
    """Nhật Ký: canvas 1200×1800 = 2 dải 600 giống nhau (cắt x=600), n ảnh/dải (mặc định 4) — cùng công thức config.js stripSlots()."""
    w, h = 600 - 2 * side, (1800 - top - bottom - (n - 1) * gap) // n
    return [dict(x=ox + side, y=top + i * (h + gap), w=w, h=h, radius=radius) for ox in (0, 600) for i in range(n)]


def grid2x2_slots(top, bottom, side, gap, radius=0):
    """Dịu Dàng: canvas 1200×1800, lưới 2×2 — cùng công thức config.js grid2x2Slots()."""
    w, h = (1200 - 2 * side - gap) // 2, (1800 - top - bottom - gap) // 2
    return [dict(x=side + c * (w + gap), y=top + r * (h + gap), w=w, h=h, radius=radius) for c, r in ((0, 0), (1, 0), (0, 1), (1, 1))]


def wide_strip_slots(top, bottom, side, gap, radius=0, n=4):
    """Nhật Ký NGANG: canvas 1800×1200 = 2 dải 1800×600 giống nhau (cắt y=600), n ảnh/dải xếp hàng ngang.
    top/bottom = lề trên/dưới TRONG mỗi dải (chừa dải chữ + QR), side = lề trái/phải."""
    w, h = (1800 - 2 * side - (n - 1) * gap) // n, 600 - top - bottom
    return [dict(x=side + i * (w + gap), y=oy + top, w=w, h=h, radius=radius) for oy in (0, 600) for i in range(n)]


def grid2x2_wide_slots(top, bottom, left, right, gap, radius=0):
    """Dịu Dàng NGANG: canvas 1800×1200, lưới 2×2 (left/right = lề trái/phải, thường chừa cột chữ + QR một bên)."""
    w, h = (1800 - left - right - gap) // 2, (1200 - top - bottom - gap) // 2
    return [dict(x=left + c * (w + gap), y=top + r * (h + gap), w=w, h=h, radius=radius) for c, r in ((0, 0), (1, 0), (0, 1), (1, 1))]


def wide_row(x0, step, w, h, ys):
    """Nhật Ký bản ngang: 2 dải 1800×600 (cắt y=600), 4 ảnh/dải."""
    return [dict(x=x0 + i * step, y=y, w=w, h=h, radius=0) for y in ys for i in range(4)]


def S(x, y, w, h, radius=0):
    return dict(x=x, y=y, w=w, h=h, radius=radius)


def punch(img, slots):
    """Khoét lỗ TRONG SUỐT đúng toạ độ ô ảnh (bo góc theo radius). Mép lỗ nằm trong ô → không lộ viền."""
    W, H = img.size
    m = Image.new('L', (W * 2, H * 2), 255); d = ImageDraw.Draw(m)
    for s in slots:
        x0, y0, x1, y1 = s['x'] * 2, s['y'] * 2, (s['x'] + s['w']) * 2 - 1, (s['y'] + s['h']) * 2 - 1
        if s.get('radius'): d.rounded_rectangle([x0, y0, x1, y1], radius=s['radius'] * 2, fill=0)
        else: d.rectangle([x0, y0, x1, y1], fill=0)
    keep = m.resize((W, H), Image.LANCZOS).point(lambda v: 255 if v > 250 else (0 if v < 5 else v))
    a = np.minimum(np.asarray(img.getchannel('A')), np.asarray(keep))
    img.putalpha(Image.fromarray(a))
    return img


# ---------------------------------------------------------------- màu nước (cỏ bốn lá / lá) — tự vẽ, không dùng tranh bên thứ ba
def _smooth_noise(w, h, seed, cell=7):
    """Nhiễu mịn (loang màu nước): lưới ngẫu nhiên nhỏ phóng to bicubic. Trả mảng float ~[-1, 1]."""
    rng = np.random.default_rng(seed)
    gw, gh = max(2, w // cell + 2), max(2, h // cell + 2)
    small = Image.fromarray((rng.random((gh, gw)) * 255).astype(np.uint8), 'L')
    big = np.asarray(small.resize((w, h), Image.BICUBIC), dtype=np.float32)
    return (big - 127.5) / 127.5


def wc_shape(img, pts, stops, focus, edge=None, edge_w=3.0, alpha=0.95, seed=0, blur=0.8, grain=0.07):
    """Hình tô kiểu màu nước: màu chuyển toả từ `focus` + loang ngẫu nhiên + mép đậm hơn (màu đọng ở mép)."""
    def fillfn(w, h, x0, y0):
        g = rad_grad(w, h, (focus[0] - x0, focus[1] - y0), 0, max(w, h) * .72, stops)
        a = np.asarray(g).astype(np.float32)
        n = _smooth_noise(w, h, seed) * .6 + _smooth_noise(w, h, seed + 7, 3) * .4
        a[..., :3] *= (1 + n[..., None] * grain)
        return Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')
    fill_poly(img, pts, fillfn, blur=blur, alpha=alpha)
    if edge:
        stroke_poly(img, pts, rgba(edge, .55 * alpha), edge_w, blur=1.1)


def _rot(pts, cx, cy, a):
    c, s = math.cos(a), math.sin(a)
    return [(cx + x * c - y * s, cy + x * s + y * c) for x, y in pts]


def clover_wc(img, cx, cy, size, alpha=1.0, rot=0.3, seed=1, pale=False):
    """Cỏ bốn lá màu nước: 4 lá hình tim to tròn, loang đậm nhạt, vệt sáng chữ V, gân giữa, thân cong."""
    R = random.Random(seed)
    light, mid, dark = ('#dcefc4', '#b5d88f', '#7fb062') if pale else ('#c9e7a2', '#8cc865', '#3f8a3a')
    edge = '#6fa15a' if pale else '#2f6e2e'
    stem_end = (cx + size * (.08 + R.random() * .08), cy + size * .62)
    stroke_poly(img, quad((cx, cy), (cx + size * .12, cy + size * .32), stem_end), rgba('#5c9447' if not pale else '#94bd7c', .85 * alpha),
                max(1.5, size * .03), closed=False)
    for i in range(4):
        a = rot + i * math.pi / 2 + (R.random() - .5) * .18
        s = size * (.47 + R.random() * .06)
        # lá hình tim: mũi tim ở tâm cây, 2 thuỳ hướng ra ngoài
        local = [(x, -y) for x, y in heart_pts(0, 0, s, 30)]            # tim lộn ngược: mũi ở trên (gần tâm)
        local = [(x, y + s * .36) for x, y in local]                       # đưa mũi về gốc toạ độ
        pts = _rot(local, cx, cy, a - math.pi / 2)
        ox, oy = math.cos(a) * s * .52, math.sin(a) * s * .52              # tâm lá
        wc_shape(img, pts, [(0, light), (.45, mid), (1, dark)], (cx + ox * 1.15, cy + oy * 1.15), edge=edge, edge_w=max(1.5, s * .03),
                 alpha=.93 * alpha, seed=seed * 10 + i)
        # vệt sáng chữ V đặc trưng của cỏ ba lá / bốn lá
        for side in (-1, 1):
            b = a + side * .55
            v = [(cx + math.cos(a) * s * .18, cy + math.sin(a) * s * .18),
                 (cx + math.cos(a) * s * .38 + math.cos(b) * s * .16, cy + math.sin(a) * s * .38 + math.sin(b) * s * .16)]
            stroke_poly(img, v, (255, 255, 255, round(95 * alpha)), max(2, s * .07), closed=False, blur=s * .025)
        # gân giữa
        stroke_poly(img, [(cx + math.cos(a) * s * .06, cy + math.sin(a) * s * .06), (cx + math.cos(a) * s * .74, cy + math.sin(a) * s * .74)],
                    (255, 255, 255, round(120 * alpha)), max(1, s * .018), closed=False)
    circle(img, cx, cy, max(2, size * .035), rgba('#3d7a34' if not pale else '#86b06e', alpha))


def leaf_wc(img, x, y, L, ang, alpha=1.0, seed=3, dark=True):
    """Lá to bản xanh đậm màu nước, gân giữa + gân phụ sáng, mép đậm."""
    a = math.radians(ang)
    w = L * .42
    half = cubic((0, 0), (L * .25, -w * .95), (L * .78, -w * .55), (L, 0), 22)
    other = cubic((L, 0), (L * .78, w * .6), (L * .25, w * .9), (0, 0), 22)
    pts = _rot(half + other[1:], x, y, a)
    stops = [(0, '#7fa96a'), (.5, '#4c7f45'), (1, '#24502c')] if dark else [(0, '#b9d7a0'), (.5, '#86b26c'), (1, '#4f8445')]
    wc_shape(img, pts, stops, (x + math.cos(a) * L * .45, y + math.sin(a) * L * .45), edge='#1d3f22' if dark else '#3d6b36',
             edge_w=max(1.5, L * .012), alpha=.94 * alpha, seed=seed, grain=.09)
    vein = _rot([(L * .04, 0), (L * .94, 0)], x, y, a)
    stroke_poly(img, vein, (220, 240, 210, round(130 * alpha)), max(1.5, L * .012), closed=False)
    for k in range(1, 6):
        t = k / 6.5
        for side in (-1, 1):
            p0 = (L * t, 0); p1 = (L * (t + .13), side * w * .34 * (1 - t * .5))
            stroke_poly(img, _rot([p0, p1], x, y, a), (220, 240, 210, round(85 * alpha)), max(1, L * .007), closed=False)


def droplets(img, cx, cy, r, n, seed, color='#8cc865', alpha=.55):
    R = random.Random(seed)
    for _ in range(n):
        ang, d = R.random() * 2 * math.pi, r * (.6 + R.random() * .6)
        circle(img, cx + math.cos(ang) * d, cy + math.sin(ang) * d, 2 + R.random() * r * .035, rgba(color, alpha * (.5 + R.random() * .5)), blur=.8)


def clover_cluster(img, cx, cy, size, seed=5, big=True, alpha=1.0):
    """Cụm cỏ lớn (điểm nhấn): 1 cây to + 2 cây nhỏ phía dưới + giọt màu; cụm nhỏ = 1 cây nhạt."""
    if not big:
        clover_wc(img, cx, cy, size, alpha=alpha, rot=.25, seed=seed, pale=True)
        return
    droplets(img, cx, cy, size * .7, 9, seed)
    clover_wc(img, cx - size * .30, cy + size * .44, size * .42, alpha=alpha, rot=.9, seed=seed + 1)
    clover_wc(img, cx + size * .02, cy + size * .62, size * .32, alpha=alpha, rot=.45, seed=seed + 2)
    clover_wc(img, cx, cy, size, alpha=alpha, rot=.32, seed=seed)


def leaves_wc(img, x, y, s, seed=9, alpha=1.0):
    """Chùm 3 lá xanh đậm chồi ra từ góc dưới-trái."""
    bx, by = x - 75 * s, y + 125 * s          # gốc chùm lá: sát mép trái-dưới (lá chồi từ ngoài tờ vào)
    leaf_wc(img, bx - 10 * s, by + 10 * s, 190 * s, -72, alpha, seed, dark=True)
    leaf_wc(img, bx, by, 215 * s, -42, alpha, seed + 1, dark=True)
    leaf_wc(img, bx + 10 * s, by + 18 * s, 150 * s, -12, alpha * .9, seed + 2, dark=False)
