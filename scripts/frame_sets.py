# 17 bộ khung mới (SPEC-TONG-HOP-KHUNG.md, Phần 5–13) — danh mục + cách vẽ từng phong cách.
# Sinh: <id>.png (overlay đúng canvas, ô ảnh TRONG SUỐT) + <id>-thumb.png (rộng 300, ô xám + chữ mẫu + QR mẫu).
# Chạy qua make-frames.py:  py scripts/make-frames.py sets            → tất cả bộ mới
#                           py scripts/make-frames.py set03 set07     → theo bộ (#03, #07)
#                           py scripts/make-frames.py C-night-sky     → theo id khung
# Toạ độ ô ảnh / chữ / QR ở đây PHẢI khớp renderer/config.js (frames[] của từng kiểu chụp).
#
# Asset bản quyền (chủ app tự đặt, thiếu vẫn chạy): C:\YoungBooth-Frames\assets\...
#   clover\clover-big.png, clover-small.png, leaves.png  · gems\gem-pink.png, gem-clear.png
#   events\orientation\logo-1.png, logo-2.png, building.png, flag.png
#   holidays\quockhanh\non-la.png, be-cam-co.png, lang-bac.png, logo-ky-niem.png, ban-do-vn.png (đủ Hoàng Sa, Trường Sa), tem.png, toa-nha.png (tuỳ chọn)
#   holidays\trungthu\kids.png
# Thiếu file → bản in BỎ QUA phần đó (hoặc hình vector đơn giản nếu spec cho phép); thumb hiện ô giữ chỗ nét đứt.
import math, os
import numpy as np
from PIL import Image, ImageDraw
from frame_kit import (rgba, seeded, comp, lin_grad, rad_grad, shape, fill_poly, stroke_poly, circle, ellipse_rot, rect,
                       stroke_rect, cubic, quad, star_pts, draw_star, metal_star, twinkle_pts, glow_star, gem, heart_pts,
                       flag_vn, heart_flag, fireworks, cloud, skyline, clover, leaf, lantern, placeholder, load_asset, paste_fit,
                       Fonts, draw_text, text_width, _family, fake_qr, strip_slots, grid2x2_slots, wide_row, S, punch)
from PIL import ImageFilter

# ---------------------------------------------------------------- font (chuỗi ff giống config.js)
SCRIPT = '"YB Script", "Dancing Script", cursive'
SERIF = '"YB Serif", Georgia, serif'
SANS = '"Be Vietnam Pro", Arial, sans-serif'
COND = 'Oswald, "Be Vietnam Pro", sans-serif'
HAND = '"Dancing Script", cursive'
ROUND = '"Baloo 2", "Be Vietnam Pro", sans-serif'
NSERIF = '"Noto Serif", Georgia, serif'

# ---------------------------------------------------------------- nhóm chữ động (1 bộ khung = 1 nhóm, admin nhập 1 lần)
GROUPS = {
    'std-white': ('Khung Save The Date', [('line1', 'Tên dòng 1', 'Minh Thư'), ('line2', 'Tên dòng 2', 'Kuan Hsun'),
                                          ('date', 'Ngày', '09.07.2026'), ('tagline', 'Dòng dưới ngày', 'SAVE THE DATE')]),
    'clover-sage': ('Khung Cỏ Bốn Lá', [('line1', 'Tên người thứ nhất', 'Tấn Nhã'), ('sep', 'Ký tự nối', '+'),
                                        ('line2', 'Tên người thứ hai', 'Huỳnh Như'), ('date', 'Ngày', '05.07.2026')]),
    'event-orientation': ('Khung Orientation Day', [('title', 'Tên sự kiện', 'ORIENTATION'), ('title2', 'Chữ phụ tên sự kiện', 'day'),
                                                    ('tagline', 'Khẩu hiệu', 'Future Starts Here')]),
    'quockhanh': ('Khung Quốc Khánh 02.09', [('date', 'Ngày lễ', '02.09'), ('title', 'Dòng chữ dưới', 'VIỆT NAM')]),
    'qk-motto': ('Khung Độc Lập (Xanh Nhạt · Đỏ Bóng)', [('header', 'Khẩu hiệu trên', 'ĐỘC LẬP — TỰ DO — HẠNH PHÚC'),
                                                         ('title', 'Chữ dưới trái', 'VIỆT NAM'), ('years', 'Chữ dưới phải', '1945 - 2026')]),
    'qk-29': ('Khung Quốc Khánh 2.9 – Đỏ Trắng', [('badge', 'Số lớn', '2.9'), ('header', 'Dòng trên', 'MỪNG QUỐC KHÁNH'),
                                                  ('footer', 'Dòng dưới', 'VIỆT NAM TỰ HÀO')]),
    'qk-white-flags': ('Khung Trắng Cờ Hoa', [('kicker', 'Dòng nhỏ', 'Còn gì vui hơn ?'), ('header', 'Dòng chính', 'Độc lập - Tự do')]),
    'qk-maroon': ('Khung Đỏ Thẫm Hoa Văn', [('header', 'Khẩu hiệu', 'ĐỘC LẬP - TỰ DO')]),
    'qk-bronze': ('Khung Không Gì Quý Hơn Độc Lập Tự Do', [('quote', 'Câu trích', '“Không có gì quý hơn độc lập, tự do.”'),
                                                           ('kicker', 'Dòng 1', 'CHÀO MỪNG'), ('header', 'Dòng 2', 'QUỐC KHÁNH'),
                                                           ('title', 'Dòng 3', 'VIỆT NAM'), ('badge', 'Số lớn', '2-9')]),
    'qk-airmail': ('Khung Thư Bưu Chính 2/9', [('para1', 'Đoạn ngắn', '2/9 – Ngày Quốc khánh nước Việt Nam.'),
                                               ('para2', 'Đoạn dài', 'Chúc mừng ngày Quốc khánh 2/9 – cùng nhau lưu giữ khoảnh khắc tự hào.')]),
    'trungthu': ('Khung Trung Thu', [('title', 'Tiêu đề', 'Happy Mid Autumn')]),
}


def T(group, tid, **o):
    """Chữ động của khung: lấy label + giá trị mặc định từ GROUPS, o = toạ độ/kiểu như config.js."""
    lab, val = next((l, v) for k, l, v in GROUPS[group][1] if k == tid)
    return dict(id=tid, label=lab, value=val, **o)


FR = []
BRAND_SERIF = dict(ff=SERIF, weight=600)


def add(**f):
    f.setdefault('canvas', (1200, 1800)); f.setdefault('texts', []); f.setdefault('fixed', []); f.setdefault('qr', [])
    FR.append(f)


def qr(size, *pts):
    return dict(size=size, at=[dict(x=x, y=y) for x, y in pts])


# ================================================================ #01 Save The Date (trắng tối giản)
def std_texts(l1, l2, d, t):
    g = 'std-white'
    return [T(g, 'line1', **l1, ff=SCRIPT, color='#1a1a1a'), T(g, 'line2', **l2, ff=SCRIPT, color='#1a1a1a'),
            T(g, 'date', **d, ff=SERIF, weight='600', color='#333333'), T(g, 'tagline', **t, ff=SERIF, weight='600', color='#333333')]


add(id='C-std-white', mode='C', set='01', name='Save The Date – Trắng', style='plain', background='#ffffff', textGroup='std-white', cut2inch=True,
    slots=[S(40 if i < 4 else 640, 40 + (i % 4) * 344, 520, 328) for i in range(8)],
    texts=std_texts(dict(xs=[270, 870], y=1490, size=72, fit=480), dict(xs=[330, 930], y=1570, size=72, fit=480),
                    dict(xs=[300, 900], y=1625, size=24, ls=2), dict(xs=[300, 900], y=1662, size=22, ls=4)),
    fixed=[dict(text='YOUNG BOOTH', xs=[300, 900], y=1712, size=16, ls=7, color='#9a9a9a', **BRAND_SERIF)],
    qr=qr(110, (448, 1648), (1048, 1648)))
add(id='B-std-white', mode='B', set='01', name='Save The Date – Trắng (dọc)', style='plain', background='#ffffff', textGroup='std-white',
    paper='4x6', noRotate=False, slots=[S(50, 50, 1100, 650), S(50, 740, 1100, 650)],
    texts=std_texts(dict(x=560, y=1500, size=100, fit=760), dict(x=640, y=1610, size=100, fit=760),
                    dict(x=600, y=1680, size=32, ls=3), dict(x=600, y=1728, size=30, ls=5)),
    fixed=[dict(text='YOUNG BOOTH', x=600, y=1772, size=22, ls=9, color='#9a9a9a', **BRAND_SERIF)],
    qr=qr(130, (1024, 1624)))
add(id='D-std-white', mode='D', set='01', name='Save The Date – Trắng', style='plain', background='#ffffff', textGroup='std-white', cut2inch=True,
    canvas=(1800, 1200), slots=[S(30, 30, 700, 540), S(754, 30, 700, 540), S(30, 630, 700, 540), S(754, 630, 700, 540)],
    texts=std_texts(dict(x=1612, ys=[150, 750], size=46, fit=300), dict(x=1642, ys=[220, 820], size=46, fit=300),
                    dict(x=1627, ys=[280, 880], size=20, ls=2), dict(x=1627, ys=[315, 915], size=18, ls=3)),
    fixed=[dict(text='YOUNG BOOTH', x=1627, ys=[352, 952], size=14, ls=5, color='#9a9a9a', **BRAND_SERIF)],
    qr=qr(120, (1567, 420), (1567, 1020)))


# ================================================================ #02 Cỏ Bốn Lá – Sage
def clv_texts(l1, sp, l2, d):
    g = 'clover-sage'; w = dict(ff=SERIF, weight='600', color='#ffffff')
    return [T(g, 'line1', **l1, **w), T(g, 'sep', **sp, **w), T(g, 'line2', **l2, **w),
            T(g, 'date', **d, ff=SERIF, weight='600', color='#f2f6ef')]


CLV_BRAND = dict(color=(255, 255, 255, 204), **BRAND_SERIF)
add(id='C-clover-sage', mode='C', set='02', name='Cỏ Bốn Lá – Sage', style='clover', background='#c3d1ba', textGroup='clover-sage', cut2inch=True,
    band=1417, slots=strip_slots(45, 383, 45, 24, 36),
    texts=clv_texts(dict(xs=[220, 820], y=1500, size=52, fit=360), dict(xs=[290, 890], y=1552, size=36),
                    dict(xs=[370, 970], y=1612, size=52, fit=360), dict(xs=[370, 970], y=1660, size=20, ls=2)),
    fixed=[dict(text='YOUNG BOOTH', xs=[300, 900], y=1765, size=16, ls=7, **CLV_BRAND)],
    clovers=[(40, 40, 110, .6), (505, 1400, 160, 1), (640, 40, 110, .6), (1105, 1400, 160, 1)],
    leaves=[(70, 1480, .6), (670, 1480, .6)],
    qr=qr(110, (36, 1648), (636, 1648)))
add(id='A-clover-sage', mode='A', set='02', name='Cỏ Bốn Lá – Sage', style='clover', background='#c3d1ba', textGroup='clover-sage',
    band=1380, slots=[S(80, 80, 1040, 1300, 40)],
    texts=clv_texts(dict(x=470, y=1530, size=64, fit=520), dict(x=600, y=1600, size=40),
                    dict(x=720, y=1680, size=64, fit=520), dict(x=720, y=1735, size=22, ls=2)),
    fixed=[dict(text='YOUNG BOOTH', x=600, y=1774, size=18, ls=8, **CLV_BRAND)],
    clovers=[(60, 60, 160, .6), (1070, 1370, 240, 1)], leaves=[(110, 1610, 1.2)],
    qr=qr(120, (1036, 1636)))
add(id='A-clover-sage-wide', mode='A', set='02', name='Cỏ Bốn Lá – Sage (ngang)', style='clover', background='#c3d1ba', textGroup='clover-sage',
    canvas=(1800, 1200), paper='4x6', band=973, slots=[S(85, 63, 1630, 910, 40)],
    texts=clv_texts(dict(x=840, y=1090, size=64, fit=620, align='right'), dict(x=900, y=1088, size=44),
                    dict(x=960, y=1090, size=64, fit=620, align='left'), dict(x=900, y=1140, size=22, ls=2)),
    fixed=[dict(text='YOUNG BOOTH', x=900, y=1176, size=16, ls=7, **CLV_BRAND)],
    clovers=[(70, 60, 160, .6), (1660, 870, 220, 1)], leaves=[(100, 1090, 1.0)],
    qr=qr(120, (1636, 1036)))

# ================================================================ #03 Pha Lê / #04 Ngôi Sao Đen / #07 Bầu Trời Sao (chung bố cục)
CRY_C = strip_slots(30, 214, 30, 12)                 # 4 ảnh 540×380 mỗi dải
CRY_F = grid2x2_slots(36, 230, 36, 14)               # 2×2, 557×760
CRY_W = wide_row(24, 441, 427, 476, [24, 624])       # ngang, chữ ở dưới mỗi dải
BS_W = wide_row(24, 441, 427, 486, [90, 690])        # ngang, chữ ở trên mỗi dải
YB = dict(text='Young Booth', ff=SCRIPT)
QR_C = qr(110, (448, 1648), (1048, 1648))
QR_F = qr(120, (1036, 1636))
QR_W = qr(110, (1640, 448), (1640, 1048))

add(id='C-crystal-white', mode='C', set='03', name='Pha Lê Trắng', style='gems', background='#ffffff', cut2inch=True, pink=.6, count=16,
    slots=CRY_C, fixed=[dict(xs=[250, 850], y=1715, size=64, color='#2a2a2a', flourish=True, **YB)], qr=QR_C)
add(id='C-crystal-white-wide', mode='C', set='03', name='Pha Lê Trắng – Ngang', style='gems', background='#ffffff', cut2inch=True,
    canvas=(1800, 1200), pink=.6, count=16, slots=CRY_W, fixed=[dict(x=900, ys=[568, 1168], size=48, color='#2a2a2a', **YB)], qr=QR_W)
add(id='F-crystal-white', mode='F', set='03', name='Pha Lê Trắng', style='gems', background='#ffffff', pink=.3, count=14,
    slots=CRY_F, fixed=[dict(x=600, y=1715, size=90, color='#2a2a2a', flourish=True, **YB)], qr=QR_F)
add(id='F-crystal-pink', mode='F', set='03', name='Pha Lê Hồng', style='gems', background='#ffffff', pink=.85, count=19, big=3,
    slots=CRY_F, fixed=[dict(x=600, y=1715, size=90, color='#2a2a2a', flourish=True, **YB)], qr=QR_F)

add(id='C-black-stars', mode='C', set='04', name='Ngôi Sao Đen', style='bstars', background='#ffffff', cut2inch=True, count=40,
    slots=CRY_C, fixed=[dict(xs=[300, 900], y=1715, size=56, color='#111111', starY=True, **YB)], qr=QR_C)
add(id='C-black-stars-wide', mode='C', set='04', name='Ngôi Sao Đen – Ngang', style='bstars', background='#ffffff', cut2inch=True,
    canvas=(1800, 1200), count=30, slots=BS_W,
    fixed=[dict(x=40, ys=[66, 666], size=44, align='left', color='#111111', starY=True, **YB)], qr=QR_W)
add(id='F-black-stars', mode='F', set='04', name='Ngôi Sao Đen', style='bstars', background='#ffffff', count=22,
    slots=CRY_F, fixed=[dict(x=560, y=1715, size=90, color='#111111', starY=True, **YB)], qr=QR_F)
add(id='F-black-stars-dense', mode='F', set='04', name='Ngôi Sao Dày', style='bstars', background='#ffffff', count=34, big=4,
    slots=CRY_F, fixed=[dict(x=560, y=1715, size=90, color='#111111', starY=True, **YB)], qr=QR_F)

# ================================================================ #05 Sao Kim Tuyến
GS_C = strip_slots(150, 42, 40, 16)
GS_F = grid2x2_slots(160, 160, 60, 14)
add(id='C-gold-stars', mode='C', set='05', name='Sao Kim Tuyến', style='gstars', background='#ffffff', cut2inch=True, gold=.5, count=16,
    outline='#222222', slots=GS_C, fixed=[dict(xs=[44, 644], y=112, size=52, align='left', color='#333333', **YB)], qr=QR_C)
add(id='C-gold-stars-wide', mode='C', set='05', name='Sao Kim Tuyến – Ngang', style='gstars', background='#ffffff', cut2inch=True,
    canvas=(1800, 1200), gold=.5, count=16, outline='#222222', slots=wide_row(30, 438, 424, 476, [100, 700]),
    fixed=[dict(x=900, ys=[72, 672], size=44, color='#333333', **YB)], qr=QR_W)
add(id='F-gold-stars', mode='F', set='05', name='Sao Kim Tuyến', style='gstars', background='#ffffff', gold=.5, count=20,
    outline='#222222', slots=GS_F, fixed=[dict(x=600, y=115, size=80, color='#333333', **YB)], qr=qr(120, (1020, 1636)))
add(id='F-gold-stars-blush', mode='F', set='05', name='Sao Kim Tuyến Hồng', style='gstars', background='#fdeef0', gold=.8, count=22,
    outline='#3a2a2e', slots=GS_F, fixed=[dict(x=600, y=115, size=80, color='#3a2a2e', **YB)], qr=qr(120, (1020, 1636)))


# ================================================================ #06 Sự kiện – Orientation Day (ẩn mặc định)
def ori_texts(t, t2, g):
    G = 'event-orientation'; base = dict(color='#ffffff', stroke='#1d3a8a', rotate=-6)
    return [T(G, 'title', **t, ff=SANS, weight='800', italic=True, strokeW=10, **base),
            T(G, 'title2', **t2, ff=HAND, weight='700', strokeW=8, **base),
            T(G, 'tagline', **g, ff=SANS, weight='700', strokeW=6, **base)]


ORI_BRAND = dict(text='YOUNG BOOTH', color='#ffffff', ls=4, **BRAND_SERIF)
add(id='C-event-orientation', mode='C', set='06', name='Orientation Day', style='orient', background='#3fb6e8', textGroup='event-orientation',
    hidden=True, event='orientation', cut2inch=True, band=1420, slots=strip_slots(130, 380, 36, 18),
    texts=ori_texts(dict(xs=[330, 930], y=1500, size=52), dict(xs=[470, 1070], y=1515, size=36), dict(xs=[320, 920], y=1548, size=22)),
    fixed=[dict(xs=[300, 900], y=1780, size=14, **ORI_BRAND)], qr=QR_C)
add(id='B-event-orientation', mode='B', set='06', name='Orientation Day (dọc)', style='orient', background='#3fb6e8', textGroup='event-orientation',
    hidden=True, event='orientation', paper='4x6', noRotate=False, band=1380, slots=[S(50, 150, 1100, 600), S(50, 780, 1100, 600)],
    texts=ori_texts(dict(x=600, y=1540, size=84), dict(x=830, y=1560, size=56), dict(x=590, y=1600, size=34)),
    fixed=[dict(x=600, y=1778, size=16, **ORI_BRAND)], qr=QR_F)

# ================================================================ #07 Bầu Trời Sao
NS = dict(text='Young Booth', ff=SCRIPT, color='#f5f5f5', twinkle=True)
add(id='C-night-sky', mode='C', set='07', name='Bầu Trời Sao', style='night', background='#0b0b0d', cut2inch=True, count=62,
    slots=CRY_C, fixed=[dict(xs=[560, 1160], y=1700, size=52, align='right', **NS)], qr=qr(110, (36, 1648), (636, 1648)))
add(id='C-night-sky-wide', mode='C', set='07', name='Bầu Trời Sao – Ngang', style='night', background='#0b0b0d', cut2inch=True,
    canvas=(1800, 1200), count=62, slots=BS_W, fixed=[dict(x=40, ys=[66, 666], size=44, align='left', **NS)], qr=QR_W)
add(id='F-night-sky', mode='F', set='07', name='Bầu Trời Sao', style='night', background='#0b0b0d', count=62,
    slots=CRY_F, fixed=[dict(x=1160, y=1650, size=80, align='right', **NS)], qr=qr(120, (36, 1636)))
add(id='F-night-sky-violet', mode='F', set='07', name='Bầu Trời Sao – Tím Đêm', style='night', background='#140d2a', violet=True, count=62,
    slots=CRY_F, fixed=[dict(x=1160, y=1650, size=80, align='right', **NS)], qr=qr(120, (36, 1636)))


# ================================================================ #08 Quốc Khánh 02.09 (dịp lễ, ẩn mặc định)
def vb(x, cy, color, size, ff=SERIF, weight=600, text='YOUNG BOOTH', ls=None):
    """Chữ thương hiệu XOAY DỌC (đọc từ dưới lên), (x, cy) = tâm."""
    return dict(text=text, x=x, y=cy, size=size, color=color, ff=ff, weight=weight, rotate=-90, vcenter=True,
                ls=size * .35 if ls is None else ls)


def qk_texts(d, t):
    g = 'quockhanh'
    return [T(g, 'date', **d, align='left', ff=SANS, weight='800', italic=True, color='#d42a2a', stroke='#ffffff', strokeW=12, rotate=-4),
            T(g, 'title', **t, ff=SANS, weight='800', color='#d42a2a')]


QK = dict(hidden=True, holiday='quockhanh')
add(id='C-quoc-khanh', mode='C', set='08', name='Quốc Khánh 02.09', style='qk08', background='#f8eedb', textGroup='quockhanh', cut2inch=True, **QK,
    slots=strip_slots(50, 170, 50, 12),
    texts=qk_texts(dict(xs=[40, 640], y=862, size=48), dict(xs=[390, 990], y=1740, size=48, fit=250)),
    fixed=[vb(575, 600, '#b5523b', 22), vb(1175, 600, '#b5523b', 22), vb(25, 1400, '#b5523b', 22), vb(625, 1400, '#b5523b', 22)],
    qr=qr(110, (40, 1648), (640, 1648)))
# Bản THƯỜNG NGÀY của khung #08 (chủ app chọn 13/10/2026): giữ nền tia nắng + pháo hoa, bỏ mọi chữ / hình liên quan 2/9 → hiện quanh năm.
add(id='C-sunburst', mode='C', set='08', name='Tia Nắng Pháo Hoa', style='qk08', everyday=True, background='#f8eedb', cut2inch=True,
    slots=strip_slots(50, 170, 50, 12),
    fixed=[vb(575, 600, '#b5523b', 22), vb(1175, 600, '#b5523b', 22), vb(25, 1400, '#b5523b', 22), vb(625, 1400, '#b5523b', 22),
           dict(text='Young Booth', xs=[372, 972], y=1748, size=58, ff=SCRIPT, color='#b5523b')],
    qr=qr(110, (40, 1648), (640, 1648)))
add(id='F-quoc-khanh', mode='F', set='08', name='Quốc Khánh 02.09', style='qk08', background='#f8eedb', textGroup='quockhanh', **QK,
    slots=grid2x2_slots(70, 190, 70, 14),
    texts=qk_texts(dict(x=40, y=868, size=64), dict(x=600, y=1730, size=72, fit=420)),
    fixed=[vb(1165, 520, '#b5523b', 24), vb(35, 1300, '#b5523b', 24)],
    qr=qr(120, (36, 1636)))


# ================================================================ #09 Độc Lập – Xanh Nhạt / #11 Độc Lập – Đỏ Bóng (chung chữ qk-motto)
def motto_texts(mode, col):
    g = 'qk-motto'; base = dict(ff=COND, weight='600', color=col)
    if mode == 'C':
        return [T(g, 'header', xs=[100, 700], y=80, size=24, fit=440, align='left', **base),
                T(g, 'title', xs=[100, 700], y=1760, size=26, fit=120, align='left', **base),
                T(g, 'years', xs=[540, 1140], y=1700, size=24, fit=180, align='right', **base)]
    return [T(g, 'header', x=130, y=92, size=34, fit=960, align='left', **base),
            T(g, 'title', x=140, y=1730, size=34, fit=360, align='left', **base),
            T(g, 'years', x=1090, y=1730, size=34, fit=360, align='right', **base)]


def motto_vb(mode, col):
    if mode == 'C': return [vb(580, 520, col, 18), vb(1180, 520, col, 18), vb(20, 1300, col, 18), vb(620, 1300, col, 18)]
    return [vb(1175, 420, col, 22), vb(25, 1250, col, 22)]


for _id, _name, _tone, _col, _bg, _set in [('qk-blue', 'Độc Lập – Xanh Nhạt', 'blue', '#1f2a44', '#d6e6f1', '09'),
                                           ('qk-red-gloss', 'Độc Lập – Đỏ Bóng', 'red', '#ffffff', '#d7261e', '11')]:
    add(id='C-' + _id, mode='C', set=_set, name=_name, style='motto', tone=_tone, background=_bg, textGroup='qk-motto', cut2inch=True, **QK,
        slots=strip_slots(110, 150, 40, 24), texts=motto_texts('C', _col), fixed=motto_vb('C', _col),
        qr=qr(110, (234, 1648), (834, 1648)))
    add(id='F-' + _id, mode='F', set=_set, name=_name, style='motto', tone=_tone, background=_bg, textGroup='qk-motto', **QK,
        slots=grid2x2_slots(120, 150, 50, 24), texts=motto_texts('F', _col), fixed=motto_vb('F', _col),
        qr=qr(120, (528, 1636)))


# ================================================================ #10 Quốc Khánh 2.9 – Đỏ Trắng
def q29_texts(b, h, f):
    g = 'qk-29'; base = dict(ff=SANS, weight='800', color='#d42a2a')
    return [T(g, 'badge', **b, align='left', **base), T(g, 'header', **h, ls=1, **base), T(g, 'footer', **f, ls=1, **base)]


add(id='C-qk-29', mode='C', set='10', name='Quốc Khánh 2.9 – Đỏ Trắng', style='q29', background='#ffffff', textGroup='qk-29', cut2inch=True, **QK,
    slots=strip_slots(110, 110, 40, 14),
    texts=q29_texts(dict(xs=[50, 650], y=82, size=44), dict(xs=[330, 930], y=76, size=20, fit=280), dict(xs=[300, 900], y=1760, size=20, fit=250)),
    fixed=[vb(582, 900, '#c62828', 16, ff=SANS, weight=700), vb(1182, 900, '#c62828', 16, ff=SANS, weight=700)],
    qr=qr(110, (448, 1648), (1048, 1648)))
add(id='F-qk-29', mode='F', set='10', name='Quốc Khánh 2.9 – Đỏ Trắng', style='q29', background='#ffffff', textGroup='qk-29', **QK,
    slots=grid2x2_slots(130, 130, 50, 12),
    texts=q29_texts(dict(x=70, y=100, size=64), dict(x=720, y=96, size=28, fit=520), dict(x=640, y=1722, size=28, fit=520)),
    fixed=[vb(1176, 900, '#c62828', 20, ff=SANS, weight=700)],
    qr=qr(120, (1036, 1636)))


# ================================================================ #12 Độc Lập – Trắng Cờ Hoa
def wf_texts(k, h):
    g = 'qk-white-flags'
    return [T(g, 'kicker', **k, ff=HAND, weight='600', color='#1a1a1a'), T(g, 'header', **h, ff=HAND, weight='700', color='#1a1a1a')]


add(id='C-qk-white-flags', mode='C', set='12', name='Độc Lập – Trắng Cờ Hoa', style='wflags', background='#ffffff', textGroup='qk-white-flags',
    cut2inch=True, **QK, slots=strip_slots(170, 150, 40, 14),
    texts=wf_texts(dict(xs=[300, 900], y=62, size=22), dict(xs=[300, 900], y=120, size=38, fit=330)),
    fixed=[dict(text='YOUNG BOOTH', xs=[470, 1070], y=1712, size=13, ls=4, color='#555555', **BRAND_SERIF)],
    qr=qr(110, (234, 1648), (834, 1648)))
add(id='F-qk-white-flags', mode='F', set='12', name='Độc Lập – Trắng Cờ Hoa', style='wflags', background='#ffffff', textGroup='qk-white-flags',
    **QK, slots=grid2x2_slots(170, 150, 50, 16),
    texts=wf_texts(dict(x=600, y=70, size=30), dict(x=600, y=132, size=52, fit=760)),
    fixed=[dict(text='YOUNG BOOTH', x=960, y=1764, size=18, ls=6, color='#555555', **BRAND_SERIF)],
    qr=qr(120, (528, 1636)))

# ================================================================ #13 Độc Lập – Đỏ Thẫm Hoa Văn
MAR = dict(ff=SANS, weight='800', color='#ffd21f', align='right')
add(id='C-qk-maroon', mode='C', set='13', name='Độc Lập – Đỏ Thẫm Hoa Văn', style='maroon', background='#8e1717', textGroup='qk-maroon',
    cut2inch=True, **QK, slots=strip_slots(110, 120, 40, 30, 36),
    texts=[T('qk-maroon', 'header', xs=[560, 1160], y=74, size=24, fit=330, **MAR)],
    fixed=[dict(text='YOUNG BOOTH', xs=[300, 900], y=1776, size=13, ls=4, color='#f6d9a8', **BRAND_SERIF)],
    qr=qr(110, (448, 1648), (1048, 1648)))
add(id='F-qk-maroon', mode='F', set='13', name='Độc Lập – Đỏ Thẫm Hoa Văn', style='maroon', background='#8e1717', textGroup='qk-maroon',
    **QK, slots=grid2x2_slots(110, 110, 40, 20, 40),
    texts=[T('qk-maroon', 'header', x=1150, y=82, size=34, fit=760, **MAR)],
    fixed=[dict(text='YOUNG BOOTH', x=760, y=1772, size=16, ls=5, color='#f6d9a8', **BRAND_SERIF)],
    qr=qr(120, (1036, 1636)))

# ================================================================ #14 Không Gì Quý Hơn Độc Lập Tự Do – Đồng
GOLD = '#f1d58a'
BRZ_C = (241, 213, 138, 217)
BRZ_VS = dict(text='Young Booth', ff=SCRIPT, weight=400, ls=0)
add(id='C-qk-bronze', mode='C', set='14', name='Không Gì Quý Hơn Độc Lập Tự Do', style='bronze', background='#7b5e2d', textGroup='qk-bronze',
    cut2inch=True, **QK, slots=strip_slots(40, 240, 40, 14),
    texts=[T('qk-bronze', 'quote', xs=[330, 930], y=1640, w=230, lh=32, size=24, ff=SCRIPT, color=GOLD)],
    fixed=[vb(582, 500, BRZ_C, 28, **BRZ_VS), vb(1182, 500, BRZ_C, 28, **BRZ_VS), vb(18, 1250, BRZ_C, 28, **BRZ_VS), vb(618, 1250, BRZ_C, 28, **BRZ_VS)],
    stars=[(112, 1640, 62), (712, 1640, 62)],
    qr=qr(110, (448, 1648), (1048, 1648)))
add(id='F-qk-bronze', mode='F', set='14', name='Không Gì Quý Hơn Độc Lập Tự Do', style='bronze', background='#7b5e2d', textGroup='qk-bronze',
    **QK, slots=grid2x2_slots(40, 330, 40, 14),
    texts=[T('qk-bronze', 'quote', x=560, y=1600, w=360, lh=44, size=32, ff=SCRIPT, color=GOLD),
           T('qk-bronze', 'kicker', x=1150, y=1560, size=18, align='right', ff=SANS, weight='700', color=GOLD, ls=2),
           T('qk-bronze', 'header', x=1150, y=1592, size=22, align='right', ff=SANS, weight='700', color=GOLD, ls=2),
           T('qk-bronze', 'title', x=1150, y=1630, size=30, align='right', ff=SANS, weight='800', color=GOLD),
           T('qk-bronze', 'badge', x=1150, y=1730, size=90, align='right', ff=SANS, weight='800', color=GOLD)],
    fixed=[vb(1182, 500, BRZ_C, 30, **BRZ_VS), vb(18, 1200, BRZ_C, 30, **BRZ_VS)],
    stars=[(205, 1535, 92)],
    qr=qr(120, (60, 1636)))

# ================================================================ #16 Thư Bưu Chính 2/9
AIR = dict(ff=NSERIF, weight='700', color='#c8252b', align='left')
add(id='C-qk-airmail', mode='C', set='16', name='Thư Bưu Chính 2/9', style='airmail', background='#f3ece0', textGroup='qk-airmail',
    cut2inch=True, **QK, slots=strip_slots(40, 420, 40, 16),
    texts=[T('qk-airmail', 'para2', xs=[44, 644], y=1440, w=300, lh=30, size=22, **AIR)],
    stamps=[(385, 1420, 170, 150), (985, 1420, 170, 150)], logos=[(40, 1760, 24), (640, 1760, 24)],
    buildings=[(380, 1600, 180, 160), (980, 1600, 180, 160)],
    qr=qr(110, (40, 1580), (640, 1580)))
add(id='F-qk-airmail', mode='F', set='16', name='Thư Bưu Chính 2/9 (3 ảnh)', style='airmail', background='#f3ece0', textGroup='qk-airmail',
    **QK, slots=[S(60, 60, 528, 693), S(612, 60, 528, 693), S(60, 777, 528, 693)],
    texts=[T('qk-airmail', 'para1', x=640, y=830, w=480, lh=42, size=32, **AIR),
           T('qk-airmail', 'para2', x=60, y=1545, w=1080, lh=42, size=30, **AIR)],
    stamps=[(680, 1080, 440, 360)], logos=[(60, 1752, 30)], buildings=[(760, 1630, 250, 150)],
    qr=qr(120, (1030, 1630)))

# ================================================================ #17 Trung Thu (dịp lễ, ẩn mặc định)
TT = dict(hidden=True, holiday='trungthu')
TT_T = dict(ff=ROUND, weight='700', color='#ffffff')
add(id='C-trungthu', mode='C', set='17', name='Trung Thu', style='moon', background='#4a2a9e', textGroup='trungthu', cut2inch=True, **TT,
    slots=strip_slots(60, 200, 30, 14),
    texts=[T('trungthu', 'title', xs=[300, 900], y=1690, size=30, fit=290, **TT_T)],
    fixed=[dict(text='Young Booth', xs=[300, 900], y=1736, size=22, **TT_T)],
    qr=qr(110, (448, 1648), (1048, 1648)))
add(id='F-trungthu', mode='F', set='17', name='Trung Thu', style='moon', background='#4a2a9e', textGroup='trungthu', **TT,
    slots=grid2x2_slots(70, 200, 50, 6),
    texts=[T('trungthu', 'title', x=640, y=1690, size=42, fit=560, **TT_T)],
    fixed=[dict(text='Young Booth', x=640, y=1742, size=28, **TT_T)],
    qr=qr(120, (1036, 1636)))


# ================================================================================================ vẽ
class Ctx:
    def __init__(self, f, fonts, asset_dir):
        self.f, self.fonts, self.asset_dir = f, fonts, asset_dir
        self.W, self.H = f['canvas']
        self.ph = []          # ô giữ chỗ (chỉ vẽ trên thumb)
        self.missing = []     # asset thiếu nhưng đã vẽ vector thay thế
        self.keep = keepouts(f, fonts)
        # Khung cắt đôi: dải dọc (Nhật Ký 1200×1800) cắt x=600; dải ngang (Nhật Ký 1800×1200, Chia Đôi) cắt y=600.
        self.cut_x = 600 if (f['mode'] == 'C' and self.W == 1200) else None
        self.cut_y = 600 if (f.get('cut2inch') and self.W == 1800) else None

    def strips(self):
        """Các dải (ox, oy, w, h) — trang trí vẽ riêng từng dải, không vắt qua đường cắt."""
        if self.cut_x: return [(0, 0, 600, self.H), (600, 0, 600, self.H)]
        if self.cut_y: return [(0, 0, self.W, 600), (0, 600, self.W, 600)]
        return [(0, 0, self.W, self.H)]

    def asset(self, rel, img, box, label, align='center', alpha=1.0, vector=False):
        """Dán asset bản quyền nếu có. Thiếu → bản in bỏ qua; thumb hiện ô giữ chỗ (trừ khi có hình vector thay thế)."""
        a = load_asset(os.path.join(self.asset_dir, rel))
        if a is not None: paste_fit(img, a, *box, align=align, alpha=alpha); return True
        if vector: self.missing.append(os.path.basename(rel))
        else: self.ph.append((box, label))
        return False


def _instances(t):
    xs = t['xs'] if 'xs' in t else [t['x']]
    ys = t['ys'] if 'ys' in t else [t['y']]
    return [(x, y) for x in xs for y in ys]


def text_box(fonts, t, s, x, y):
    fl = fonts.get(_family(t.get('ff')), t.get('weight', 400), bool(t.get('italic')), t['size'])
    ls = t.get('ls', 0) or 0
    if t.get('w'):
        w = t['w']; n = max(1, math.ceil(text_width(s, fl, ls) / w)); h0, h1 = t['size'] * .9, (n - 1) * (t.get('lh') or t['size'] * 1.3) + t['size'] * .3
    else:
        w = min(text_width(s, fl, ls), t.get('fit') or 1e9); h0, h1 = t['size'] * .9, t['size'] * .3
    if t.get('vcenter'):
        return (x - t['size'] * .6, y - w / 2, x + t['size'] * .6, y + w / 2)
    a = t.get('align', 'center')
    x0 = x if a == 'left' else x - w if a == 'right' else x - w / 2
    return (x0, y - h0, x0 + w, y + h1)


def keepouts(f, fonts):
    """Vùng không rải hoạ tiết: ô QR (cả nền trắng), chữ động (theo bề rộng tối đa), chữ thương hiệu."""
    k = []
    q = f['qr']
    if q:
        tile = q['size'] * 1.2
        k += [(p['x'] - 8, p['y'] - 8, p['x'] + tile + 8, p['y'] + tile + 8) for p in q['at']]
    for t in f['texts'] + f['fixed']:
        s = t.get('value', t.get('text', ''))
        for x, y in _instances(t):
            b = text_box(fonts, dict(t, w=t.get('w')), s, x, y)
            k.append((b[0] - 10, b[1] - 10, b[2] + 10, b[3] + 10))
    return k


def _sdist(px, py, b):
    """Khoảng cách có dấu tới hình chữ nhật b (dương = ở ngoài, âm = ở trong)."""
    dx = max(b[0] - px, 0, px - b[2]); dy = max(b[1] - py, 0, py - b[3])
    if dx or dy: return math.hypot(dx, dy)
    return -min(px - b[0], b[2] - px, py - b[1], b[3] - py)


def free_spot(c, R, r, allow, region=None, tries=400, edge=-0.4, avoid=()):
    """Chọn vị trí ngẫu nhiên (seed cố định) cho hoạ tiết bán kính r: lấn vào ô ảnh tối đa `allow` px,
    không chạm QR / chữ, không vắt qua đường cắt; edge = phần bán kính được tràn mép giấy (âm = được tràn)."""
    x0, y0, x1, y1 = region or (0, 0, c.W, c.H)
    slots = [(s['x'], s['y'], s['x'] + s['w'], s['y'] + s['h']) for s in c.f['slots']]
    near = [b for b in slots if b[2] > x0 and b[0] < x1 and b[3] > y0 and b[1] < y1]
    for _ in range(tries):
        if near and R.random() < .65:  # ưu tiên sát mép ô ảnh (khe, góc, viền) — lấn vào ảnh tối đa `allow`
            b = near[int(R.random() * len(near))]; side = int(R.random() * 4); d = r - allow + R.random() * (allow + 26)
            t = R.random()
            x, y = [(b[0] + (b[2] - b[0]) * t, b[1] - d), (b[2] + d, b[1] + (b[3] - b[1]) * t),
                    (b[0] + (b[2] - b[0]) * t, b[3] + d), (b[0] - d, b[1] + (b[3] - b[1]) * t)][side]
            if not (x0 <= x <= x1 and y0 <= y <= y1): continue
        else:
            x, y = x0 + R.random() * (x1 - x0), y0 + R.random() * (y1 - y0)
        if any(r - _sdist(x, y, b) > allow for b in slots): continue
        if any(_sdist(x, y, b) < r for b in c.keep): continue
        if any(math.hypot(x - ax, y - ay) < r + ar for ax, ay, ar in avoid): continue
        if c.cut_x and abs(x - c.cut_x) < r + 6: continue
        if c.cut_y and abs(y - c.cut_y) < r + 6: continue
        if x < r * edge or y < r * edge or x > c.W - r * edge or y > c.H - r * edge: continue
        return x, y
    return None


def scatter(c, R, n, size_fn, allow, draw_fn, region=None, edge=-0.4, spread=1.0):
    placed = []
    for i in range(n):
        r = size_fn(i)
        p = free_spot(c, R, r, allow, region, edge=edge, avoid=[(x, y, rr * spread) for x, y, rr in placed])
        if p: placed.append((p[0], p[1], r)); draw_fn(p[0], p[1], r, i)
    return placed


# ---------------------------------------------------------------- chữ cố định (thương hiệu) trong PNG
def draw_fixed(img, c):
    for t in c.f['fixed']:
        for x, y in _instances(t):
            o = dict(t)
            if o.get('starY'): brand_star_y(img, c.fonts, t['text'], x, y, o); continue
            if o.get('twinkle'): night_brand(img, c.fonts, t['text'], x, y, o); continue
            if o.get('vcenter'): vtext(img, c.fonts, t['text'], x, y, o); continue
            bb = draw_text(img, c.fonts, t['text'], x, y, o)
            if o.get('flourish') and bb:
                fl_w = (bb[2] - bb[0]) * .62; cy = bb[3] + t['size'] * .08
                stroke_poly(img, cubic((x - fl_w / 2, cy), (x - fl_w / 6, cy + t['size'] * .14), (x + fl_w / 6, cy - t['size'] * .14),
                                       (x + fl_w / 2, cy)), rgba(o['color'], .55), max(1.5, t['size'] * .025), closed=False)


def vtext(img, fonts, s, cx, cy, o):
    """Chữ dọc căn tâm (cx, cy): vẽ ngang căn giữa rồi xoay quanh tâm thật của khối chữ."""
    from PIL import Image as _I
    size = o['size']; tmp = _I.new('RGBA', (int(size * len(s) * 1.6 + 200), int(size * 4)), (0, 0, 0, 0))
    o2 = {k: v for k, v in o.items() if k not in ('rotate', 'vcenter')}
    if o2.get('color') is None: o2['color'] = '#000000'
    draw_text(tmp, fonts, s, tmp.width / 2, tmp.height / 2, o2)
    bb = tmp.getbbox()
    if not bb: return
    piece = tmp.crop(bb).rotate(-o.get('rotate', -90), expand=True, resample=Image.BICUBIC)
    comp(img, piece, cx - piece.width / 2, cy - piece.height / 2)


def brand_star_y(img, fonts, s, x, y, o):
    """'Young Booth' với sao đen lớn sau chữ Y; chữ Y trắng viền đen, phần còn lại đen."""
    fl = fonts.get(_family(o['ff']), 400, False, o['size'])
    full = text_width(s, fl); yw = text_width('Y', fl)
    sx = x if o.get('align') == 'left' else x - full if o.get('align') == 'right' else x - full / 2
    draw_star(img, sx + yw * .5, y - o['size'] * .32, o['size'] * .8, '#111111', rot=.2)
    draw_text(img, fonts, 'Y', sx, y, dict(o, align='left', color='#ffffff', stroke='#111111', strokeW=max(3, o['size'] * .07)))
    draw_text(img, fonts, s[1:], sx + yw, y, dict(o, align='left'))


def night_brand(img, fonts, s, x, y, o):
    """'✦ Young Booth' trắng: ✦ vẽ vector (font nhúng không có ký tự này) + glow nhẹ."""
    fl = fonts.get(_family(o['ff']), 400, False, o['size'])
    w = text_width(s, fl); g = o['size'] * .55
    sx = x if o.get('align') == 'left' else x - w if o.get('align') == 'right' else x - w / 2
    if o.get('align') == 'left': tx = sx + g * 1.2
    else: tx = sx; sx = sx - g * 1.2
    glow_star(img, sx + g * .45, y - o['size'] * .32, g * .45, '#ffffff', four=True)
    draw_text(img, fonts, s, tx, y, dict(o, align='left'))


# ---------------------------------------------------------------- phong cách
def st_plain_bg(img, c, R):
    rect(img, 0, 0, c.W, c.H, c.f['background'])


def st_clover_bg(img, c, R):
    W, H, band = c.W, c.H, c.f['band']
    rect(img, 0, 0, W, H, '#c3d1ba')
    edge = [(x, band + math.sin(x / 90 + R.random() * .2) * 10 - 6 + math.sin(x / 37) * 4) for x in range(0, W + 30, 30)]
    pts = [(0, H)] + edge + [(W, H)]
    fill_poly(img, pts, lambda w, h, x0, y0: lin_grad(w, h, (0, band - y0), (0, H - y0), [(0, '#a9bfa0'), (1, '#8fab88')]), blur=3)
    blobs = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for i in range(14):
        col = (255, 255, 255, 36) if R.random() > .5 else (90, 130, 80, 46)
        cx, cy, r = R.random() * W, band + R.random() * (H - band), 60 + R.random() * 90
        circle(blobs, cx, cy, r, col)
    blobs = blobs.filter(ImageFilter.GaussianBlur(36))
    img.alpha_composite(blobs)


def st_clover_over(img, c, R):
    for x, y, s in c.f.get('leaves', []):
        if not c.asset('clover/leaves.png', img, (x - 90 * s, y - 70 * s, 180 * s, 150 * s), 'leaves.png', vector=True):
            leaf(img, x, y, s, -.6, .95); leaf(img, x + 40 * s, y + 50 * s, s * .85, .3, .95); leaf(img, x - 30 * s, y + 70 * s, s * .7, -1.3, .9)
    for x, y, size, a in c.f.get('clovers', []):
        name = 'clover/clover-small.png' if a < 1 else 'clover/clover-big.png'
        if not c.asset(name, img, (x - size / 2, y - size / 2, size, size), os.path.basename(name), alpha=a, vector=True):
            clover(img, x, y, size, a, rot=.3 + R.random() * .4)
            if a >= 1: clover(img, x - size * .38, y + size * .42, size * .42, .95, rot=1.1)


def st_white_bg(img, c, R):
    rect(img, 0, 0, c.W, c.H, c.f.get('background', '#ffffff'))


def st_gems_over(img, c, R):
    f = c.f
    pk, cl = load_asset(os.path.join(c.asset_dir, 'gems/gem-pink.png')), load_asset(os.path.join(c.asset_dir, 'gems/gem-clear.png'))
    big = f.get('big', 0)

    def size(i): return (15 + R.random() * 3) if i < big else (7 + R.random() * 6 if R.random() < .75 else 11 + R.random() * 4)

    def draw(x, y, r, i):
        is_pink = R.random() < f['pink']
        a = pk if is_pink else cl
        if a is not None: paste_fit(img, a, x - r, y - r, r * 2, r * 2)
        else: gem(img, x, y, r, is_pink)
    # ưu tiên giao điểm/khe/góc ô: lấy mẫu gần mép ô ảnh, lấn tối đa 10px
    scatter(c, R, f['count'], size, 10, draw, edge=0.2, spread=4)


def st_bstars_over(img, c, R):
    f = c.f; big = f.get('big', 0)

    def size(i):
        if i < big: return 36 + R.random() * 10
        q = R.random()
        return 7 + R.random() * 5 if q < .6 else 14 + R.random() * 8 if q < .9 else 25 + R.random() * 10
    scatter(c, R, f['count'], size, 20, lambda x, y, r, i: draw_star(img, x, y, r, '#111111', rot=R.random() * 1.26), edge=0.1, spread=2.2)


def st_gstars_over(img, c, R):
    f = c.f
    for s in f['slots']:  # viền đen mảnh 3px ngay NGOÀI mép ô
        stroke_rect(img, s['x'] - 1.5, s['y'] - 1.5, s['x'] + s['w'] + 1.5, s['y'] + s['h'] + 1.5, f['outline'], 3)
    n = 0; placed = []
    order = list(range(len(f['slots']))); R.shuffle(order)
    for si in order:  # sao "đính" ở góc ô
        if n >= f['count'] * .6: break
        s = f['slots'][si]
        cx, cy = [(s['x'], s['y']), (s['x'] + s['w'], s['y']), (s['x'], s['y'] + s['h']), (s['x'] + s['w'], s['y'] + s['h'])][int(R.random() * 4)]
        r = 10 + R.random() * 6
        x, y = cx + (R.random() - .5) * 14, cy + (R.random() - .5) * 14
        if any(_sdist(x, y, b) < r for b in c.keep): continue
        if (c.cut_x and abs(x - c.cut_x) < r + 6) or (c.cut_y and abs(y - c.cut_y) < r + 6): continue
        metal_star(img, x, y, r, R.random() < f['gold'], R.random()); placed.append((x, y, r)); n += 1
    rest = f['count'] - n
    scatter(c, R, rest, lambda i: 6 + R.random() * 6, 12, lambda x, y, r, i: metal_star(img, x, y, r, R.random() < f['gold'], R.random()),
            edge=0.3, spread=3)


def st_night_bg(img, c, R):
    if c.f.get('violet'):
        img.alpha_composite(lin_grad(c.W, c.H, (0, 0), (0, c.H), [(0, '#1b1035'), (1, '#0d0a1f')]))
    else:
        rect(img, 0, 0, c.W, c.H, c.f['background'])


def st_night_over(img, c, R):
    f = c.f
    lowest = max(s['y'] + s['h'] for s in f['slots'])

    def size(i): return 4 + (R.random() ** 2.2) * 13

    def draw(x, y, r, i):
        col = '#d9ccff' if f.get('violet') and R.random() < .3 else '#ffffff'
        glow_star(img, x, y, r, col, four=R.random() < .4)
    scatter(c, R, int(f['count'] * .7), size, 8, draw, edge=0.3, spread=2)
    if lowest < c.H - 60:  # dải đen dưới cùng: dày hơn
        scatter(c, R, int(f['count'] * .3), size, 0, draw, region=(0, lowest, c.W, c.H), edge=0.3, spread=1.6)
    for _ in range(int(f['count'] * 1.2)):  # bụi sao li ti
        p = free_spot(c, R, 2, 0, edge=0.5)
        if p: circle(img, p[0], p[1], .8 + R.random() * 1.2, (255, 255, 255, 120 + int(R.random() * 120)))


def st_orient_bg(img, c, R):
    rect(img, 0, 0, c.W, c.H, c.f['background'])


def sign_diamond(img, x, y, ds):
    rect(img, x - 3, y, x + 3, y + ds * 2.2, '#8a97a6')
    sq = [(x, y - ds * .72), (x + ds * .72, y), (x, y + ds * .72), (x - ds * .72, y)]
    fill_poly(img, sq, '#2f6fd6'); stroke_poly(img, [(x, y - ds * .6), (x + ds * .6, y), (x, y + ds * .6), (x - ds * .6, y)], '#ffffff', ds * .06)
    stroke_poly(img, [(x - ds * .22, y + ds * .22), (x + ds * .02, y - ds * .05), (x - ds * .05, y + ds * .06), (x + ds * .22, y - ds * .22)],
                '#ffffff', ds * .08, closed=False)


def sign_arrow(img, x, y, w, h):
    rect(img, x + w / 2 - 3, y, x + w / 2 + 3, y + h * 2.6, '#8a97a6')
    rect(img, x, y, x + w, y + h, '#23a38a', radius=6); stroke_rect(img, x + 5, y + 5, x + w - 5, y + h - 5, '#ffffff', 3, radius=4)
    stroke_poly(img, [(x + w * .78, y + h / 2), (x + w * .25, y + h / 2)], '#ffffff', h * .12, closed=False)
    fill_poly(img, [(x + w * .18, y + h / 2), (x + w * .34, y + h * .25), (x + w * .34, y + h * .75)], '#ffffff')


def st_orient_over(img, c, R):
    f = c.f; band = f['band']; isC = f['mode'] == 'C'
    for ox, oy, W2, H2 in c.strips():
        k = W2 / 1200
        lh = 70 if isC else 80; top = 30 if isC else 40; cx = ox + W2 / 2
        c.asset('events/orientation/logo-1.png', img, (cx - lh * 2.3 - 12, top, lh * 2.3, lh), 'LOGO 1', align='right')
        c.asset('events/orientation/logo-2.png', img, (cx + 12, top, lh * 2.3, lh), 'LOGO 2', align='left')
        # mây trắng bồng bềnh dưới cùng
        for i in range(8):
            cloud(img, ox + (i / 7) * W2 * .98 + 10, c.H - (30 + R.random() * 50) * (1.3 if isC else 1), (90 + R.random() * 50) * (k * 1.3 if isC else k))
        cloud(img, ox + W2 * .1, band + 70 * k, 70 * k, '#ffffff', alpha=.85)
        bh = 300 if isC else 380
        c.asset('events/orientation/building.png', img, (ox + (230 if isC else 420) - bh * .55, c.H - bh, bh * 1.1, bh),
                'Tòa nhà\n(file khách)', align='bottom')
        if isC:
            sign_diamond(img, ox + 70, c.H - 250, 46)
        else:
            sign_diamond(img, ox + 180, 1600, 70)
            sign_arrow(img, ox + 850, 1640, 130, 46)
        for _ in range(5 if isC else 7):
            p = free_spot(c, R, 10, 0, region=(ox + 10, band, ox + W2 - 10, c.H - 120))
            if p: glow_star(img, p[0], p[1], 7 + R.random() * 7, '#ffffff', four=True, halo=.3)


def st_qk08_bg(img, c, R):
    W, H = c.W, c.H
    rect(img, 0, 0, W, H, '#f8eedb')
    cx, cy, L = W / 2, H / 2, 2600
    for i in range(0, 24, 2):  # 24 tia nắng xen kẽ
        a, b = i / 24 * math.pi * 2, (i + 1) / 24 * math.pi * 2
        fill_poly(img, [(cx, cy), (cx + math.cos(a) * L, cy + math.sin(a) * L), (cx + math.cos(b) * L, cy + math.sin(b) * L)], '#f3e3c4')
    for ox, oy, W2, H2 in c.strips():  # viền ngoài trắng 12px (mỗi dải riêng)
        stroke_rect(img, ox + 6, oy + 6, ox + W2 - 6, oy + H2 - 6, '#ffffff', 12)


QK_COLS = ['#d7261e', '#f2b632', '#e8743b']


def st_qk08_over(img, c, R):
    f = c.f
    if f['mode'] == 'C':
        for ox in (0, 600):
            fireworks(img, ox + 62, 62, 52, QK_COLS, R)
            if not f.get('everyday'): fireworks(img, ox + 215, 1716, 36, QK_COLS, R)   # bản thường ngày: chỗ này là chữ Young Booth
            fireworks(img, ox + 550, 1690, 26, QK_COLS, R)
            if f.get('everyday'):   # bản thường ngày: không tim cờ / nón lá, thêm 1 chùm pháo hoa nhỏ mép phải
                fireworks(img, ox + 556, 442, 30, QK_COLS, R)
            else:
                heart_flag(img, ox + 548, 442, 56)
                c.asset('holidays/quockhanh/non-la.png', img, (ox + 528, 1218, 70, 64), 'Nón lá')
            for _ in range(4):
                p = free_spot(c, R, 8, 0, region=(ox + 8, 8, ox + 592, 1792))
                if p: draw_star(img, p[0], p[1], 7 + R.random() * 5, '#f2b632', rot=R.random())
    else:
        fireworks(img, 105, 100, 85, QK_COLS, R); fireworks(img, 300, 1738, 56, QK_COLS, R); fireworks(img, 870, 1740, 52, QK_COLS, R)
        heart_flag(img, 1108, 106, 84)
        c.asset('holidays/quockhanh/non-la.png', img, (165, 1520, 130, 110), 'Nón lá')
        c.asset('holidays/quockhanh/be-cam-co.png', img, (980, 1440, 200, 340), 'Em bé\ncầm cờ', align='bottom')
        for _ in range(7):
            p = free_spot(c, R, 9, 0, region=(10, 10, 1190, 1790))
            if p: draw_star(img, p[0], p[1], 8 + R.random() * 6, '#f2b632', rot=R.random())


def st_motto_bg(img, c, R):
    W, H = c.W, c.H
    if c.f['tone'] == 'blue':
        img.alpha_composite(lin_grad(W, H, (0, 0), (W, H), [(0, '#d6e6f1'), (1, '#c4d9ea')]))
        lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        for _ in range(10):
            circle(lay, R.random() * W, R.random() * H, 120 + R.random() * 140, (255, 255, 255, 90) if R.random() < .6 else (150, 185, 215, 70))
        img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(45)))
    else:
        rect(img, 0, 0, W, H, '#d7261e')
        lay = Image.new('RGBA', (W * 2, H * 2), (0, 0, 0, 0))
        L = max(W, H) * 2
        for o, w, a in [(-.42, .13, .75), (.05, .07, .6), (.33, .18, .88)]:
            g = lin_grad(int(w * W * 2) or 1, L, (0, 0), (int(w * W * 2), 0),
                         [(0, (255, 255, 255, 0)), (.5, (255, 255, 255, int(255 * a))), (1, (255, 255, 255, 0))])
            lay.alpha_composite(g, (int(W - w * W + o * W * 2), 0))
        lay = lay.rotate(30, resample=Image.BICUBIC, center=(W, H)).crop((W // 2, H // 2, W // 2 + W, H // 2 + H))
        img.alpha_composite(lay)


def st_motto_over(img, c, R):
    col = '#d42a2a' if c.f['tone'] == 'blue' else '#ffd21f'
    if c.f['mode'] == 'C':
        pts = [(40, 48, 38, 1), (640, 48, 38, 1), (556, 868, 30, -1), (1156, 868, 30, -1), (40, 1702, 28, 1), (640, 1702, 28, 1)]
    else:
        pts = [(58, 64, 60, 1), (1138, 925, 52, -1), (70, 1690, 54, 1)]
    for x, y, r, d in pts:
        draw_star(img, x, y, r, col, rot=.1); draw_star(img, x + d * r * .95, y + r * .6, r * .38, col, rot=.3)


def st_q29_bg(img, c, R):
    W, H = c.W, c.H
    for ox, oy, W2, H2 in c.strips():
        g = rad_grad(W2, H2, (W2 / 2, H2 / 2), W2 * .2, max(W2, H2) * .62, [(0, '#ffffff'), (.6, '#fbe3e1'), (1, '#e03a3a')])
        img.alpha_composite(g, (ox, oy))
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for s in c.f['slots']:  # khe giữa ảnh: đỏ ánh sáng
        stroke_rect(lay, s['x'] - 3, s['y'] - 3, s['x'] + s['w'] + 3, s['y'] + s['h'] + 3, (205, 30, 30, 170), 9)
    img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(5)))


def building_icon(img, x, y, w, col):
    """Icon toà nhà đơn giản (tự vẽ): mái tam giác + cột."""
    h = w * .8
    fill_poly(img, [(x, y + h * .32), (x + w / 2, y), (x + w, y + h * .32)], col)
    rect(img, x + w * .06, y + h * .36, x + w * .94, y + h * .44, col)
    for i in range(4):
        cx = x + w * (.16 + i * .227); rect(img, cx - w * .045, y + h * .46, cx + w * .045, y + h * .88, col)
    rect(img, x, y + h * .9, x + w, y + h, col)


def chev(img, x, y, n, size, col, left=False, step=None):
    step = step or size * 1.3
    for i in range(n):
        cx = x + i * step
        pts = [(cx + size * .25, y - size * .5), (cx + size * .75, y), (cx + size * .25, y + size * .5)]
        if left: pts = [(2 * cx + size - px, py) for px, py in pts]
        stroke_poly(img, pts, col, size * .18, closed=False)


def caret_col(img, x, y, n, size, col, up=True):
    for i in range(n):
        cy = y + i * size * 1.25
        pts = [(x - size * .5, cy + size * .3), (x, cy - size * .3), (x + size * .5, cy + size * .3)]
        if not up: pts = [(px, 2 * cy - py) for px, py in pts]
        stroke_poly(img, pts, col, size * .16, closed=False)


def st_q29_over(img, c, R):
    red = '#d42a2a'
    if c.f['mode'] == 'C':
        for ox in (0, 600):
            flag_vn(img, ox + 512, 34, 52)
            skyline(img, ox + 24, 1782, 130, 62, red, R)
            caret_col(img, ox + 20, 1000, 3, 14, red); caret_col(img, ox + 580, 300, 3, 14, red)
    else:
        chev(img, 220, 82, 4, 22, red)
        flag_vn(img, 1000, 52, 62); building_icon(img, 1086, 40, 66, red)
        skyline(img, 40, 1772, 270, 92, red, R)
        chev(img, 330, 1712, 4, 20, red, left=True)
        heart_flag(img, 960, 1716, 70)
        caret_col(img, 25, 1000, 3, 18, red); caret_col(img, 1175, 300, 3, 18, red)


def ribbon(img, cx, cy, length, clip):
    lay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    a = -math.pi / 4; ca, sa = math.cos(a), math.sin(a)
    P = lambda u, v: (cx + u * ca - v * sa, cy + u * sa + v * ca)
    fill_poly(lay, [P(-length / 2, -22), P(length / 2, -22), P(length / 2, 22), P(-length / 2, 22)], '#d42a2a')
    for u in range(-int(length / 2) + 20, int(length / 2), 46):
        draw_star(lay, *P(u, 0), 11, '#ffd21f', rot=-a)
    m = Image.new('L', img.size, 0); ImageDraw.Draw(m).rectangle(clip, fill=255)
    lay.putalpha(Image.fromarray(np.minimum(np.asarray(lay.getchannel('A')), np.asarray(m))))
    img.alpha_composite(lay)


def bunting(img, x1, x2, y0, sag=34):
    stroke_poly(img, quad((x1, y0), ((x1 + x2) / 2, y0 + sag * 2), (x2, y0)), '#7a3b2e', 2, closed=False)
    for i in range(1, 6):
        t = i / 6; px = x1 + (x2 - x1) * t
        py = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * (y0 + sag * 2) + t * t * y0
        fill_poly(img, [(px - 13, py), (px + 13, py), (px, py + 28)], '#d42a2a')
        draw_star(img, px, py + 9, 5, '#ffd21f')


def st_wflags_over(img, c, R):
    isC = c.f['mode'] == 'C'
    for ox, oy, W2, H2 in c.strips():
        ribbon(img, ox + 40, 40, 230, (ox, 0, ox + W2 - 1, c.H - 1))
        ribbon(img, ox + W2 - 40, c.H - 40, 230, (ox, 0, ox + W2 - 1, c.H - 1))
        fw = 70 if isC else 84
        flag_vn(img, ox + W2 - fw - (28 if isC else 50), 92 if isC else 98, fw, wave=4)
        mine = [s for s in c.f['slots'] if ox <= s['x'] < ox + W2]
        for i, s in enumerate(mine):
            if i % 3 == 0: bunting(img, s['x'] + s['w'] * .45, s['x'] + s['w'] - 12, s['y'] + 6)
        c.asset('holidays/quockhanh/lang-bac.png', img,
                (ox + 40, c.H - 142, 190, 124) if isC else (ox + 60, c.H - 145, 400, 130), 'Lăng Bác\n(file bản quyền)', align='left')


def st_maroon_bg(img, c, R):
    W, H = c.W, c.H
    rect(img, 0, 0, W, H, '#8e1717')
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for _ in range(int(W * H / 60000)):  # hoa văn mây cuộn chìm
        x, y, r = R.random() * W, R.random() * H, 26 + R.random() * 46
        sp = [(x + math.cos(t) * r * (1 - t / 9), y + math.sin(t) * r * (1 - t / 9)) for t in (i * .25 for i in range(26))]
        stroke_poly(lay, sp, (122, 17, 17, 255), 5, closed=False)
        sp2 = [(x + r * 1.5 + math.cos(-t) * r * .6 * (1 - t / 9), y + r * .2 + math.sin(-t) * r * .6 * (1 - t / 9)) for t in (i * .25 for i in range(22))]
        stroke_poly(lay, sp2, (122, 17, 17, 255), 4, closed=False)
        stroke_poly(lay, [(x - r * 1.1, y + r * .9), (x + r * 2.2, y + r * .9)], (122, 17, 17, 255), 4, closed=False)
    lay.putalpha(lay.getchannel('A').point(lambda v: v * 4 // 10 + (40 if v else 0)))
    img.alpha_composite(lay)


def wavy_flag(img, fx, fy, fw):
    h = fw * .55
    top = cubic((fx, fy), (fx + fw * .3, fy - fw * .12), (fx + fw * .6, fy + fw * .12), (fx + fw, fy))
    bot = cubic((fx + fw, fy + h), (fx + fw * .6, fy + h + fw * .12), (fx + fw * .3, fy + h - fw * .12), (fx, fy + h))
    rect(img, fx - 7, fy - 12, fx, fy + fw * .95, '#dddddd')
    fill_poly(img, top + bot, '#da251d')
    fill_poly(img, top + bot, lambda w, hh, x0, y0: lin_grad(w, hh, (0, 0), (w, 0), [(0, (0, 0, 0, 0)), (.45, (255, 255, 255, 40)), (.7, (0, 0, 0, 40)), (1, (0, 0, 0, 0))]))
    draw_star(img, fx + fw * .5, fy + h * .5, h * .3, '#ffff00')


def st_maroon_over(img, c, R):
    isC = c.f['mode'] == 'C'
    for ox, oy, W2, H2 in c.strips():
        k = W2 / 1200
        for i in range(6):
            x, y, r = ox + 14 + R.random() * 150 * k, 14 + R.random() * 150 * k, (20 + R.random() * 30) * k + 8
            for j in (1, 2, 3):
                stroke_poly(img, ellipse_rot(x, y, r * j / 3, r * j / 3, 0, 36), '#e8b04a' if i % 2 else '#c23b2a', 3.5)
        skyline(img, ox + 20, c.H - 6, (340 * k + 80), 70 * k + 30, '#1c1c1c', R)
        wavy_flag(img, ox + 46, c.H - (150 if isC else 250), 190 if isC else 330)
    if not isC:
        c.asset('holidays/quockhanh/logo-ky-niem.png', img, (1030, 1470, 150, 150), 'Logo kỷ niệm\n(file chính thức)')


def st_bronze_bg(img, c, R):
    img.alpha_composite(lin_grad(c.W, c.H, (0, 0), (0, c.H), [(0, '#8a6a35'), (1, '#6d5226')]))
    lay = Image.new('RGBA', (c.W, c.H), (0, 0, 0, 0))
    for ox, oy, W2, H2 in c.strips():
        skyline(lay, ox, c.H, W2, 230 if W2 > 700 else 170, '#2e2211', R)
    lay.putalpha(lay.getchannel('A').point(lambda v: v * 15 // 100))
    img.alpha_composite(lay)


def st_bronze_over(img, c, R):
    mp = load_asset(os.path.join(c.asset_dir, 'holidays/quockhanh/ban-do-vn.png'))
    for x, y, r in c.f.get('stars', []):
        pts = star_pts(x, y, r)
        stroke_poly(img, pts, lambda w, h, x0, y0: lin_grad(w, h, (0, 0), (w, h), [(0, '#c9a24a'), (1, '#f3dc8a')]), max(2, r * .05))
        if mp is not None:  # bản đồ CHUẨN (đủ Hoàng Sa, Trường Sa) do chủ app cung cấp
            paste_fit(img, mp, x - r * .5, y - r * .62, r * 1.0, r * 1.25)
        else:               # không có file chuẩn → sao vàng đặc (không vẽ bản đồ)
            fill_poly(img, star_pts(x, y, r * .55), lambda w, h, x0, y0: lin_grad(w, h, (0, 0), (w, h), [(0, '#c9a24a'), (1, '#f3dc8a')]))


def st_air_bg(img, c, R):
    W, H = c.W, c.H
    rect(img, 0, 0, W, H, '#f3ece0')
    n = (np.random.default_rng(7).normal(0, 1, (H, W)) * 5).clip(-12, 12)
    a = np.asarray(img).astype(np.int16); a[..., :3] = (a[..., :3] + n[..., None]).clip(0, 255)
    img.paste(Image.fromarray(a.astype('uint8'), 'RGBA'))
    for ox, oy, W2, H2 in c.strips():  # viền phong bì máy bay: sọc chéo đỏ / kem / đen / kem, rộng 28, dày viền 22
        k = 2; lay = Image.new('RGBA', (W2 * k, H2 * k), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
        cols = [rgba('#c8252b'), rgba('#f3ece0'), rgba('#1a1a1a'), rgba('#f3ece0')]
        for i in range(-4, int((W2 + H2) / 28) + 5):
            x = i * 28
            d.polygon([(x * k, 0), ((x + 28) * k, 0), ((x + 28 - H2) * k, H2 * k), ((x - H2) * k, H2 * k)], fill=cols[i % 4])
        lay = lay.resize((W2, H2), Image.LANCZOS)
        m = Image.new('L', (W2, H2), 255)
        ImageDraw.Draw(m).rectangle([22, 22, W2 - 23, H2 - 23], fill=0)
        lay.putalpha(Image.fromarray(np.minimum(np.asarray(lay.getchannel('A')), np.asarray(m))))
        img.alpha_composite(lay, (ox, oy))


def stamp(img, c, x, y, w, h):
    if c.asset('holidays/quockhanh/tem.png', img, (x, y, w, h), 'tem.png', vector=True):
        return
    # tem vector đơn giản (KHÔNG chân dung): răng cưa, cờ, 2·9, VIỆT NAM, BƯU CHÍNH
    fill_poly(img, [(x, y), (x + w, y), (x + w, y + h), (x, y + h)], (0, 0, 0, 50), blur=3, offset=(3, 4))
    rect(img, x, y, x + w, y + h, '#efe6d6')
    d = max(6, w / 24)
    for i in range(0, int(w) + 1, int(d * 2)):
        circle(img, x + i, y, d / 2, '#f3ece0'); circle(img, x + i, y + h, d / 2, '#f3ece0')
    for j in range(0, int(h) + 1, int(d * 2)):
        circle(img, x, y + j, d / 2, '#f3ece0'); circle(img, x + w, y + j, d / 2, '#f3ece0')
    stroke_rect(img, x + w * .08, y + h * .08, x + w * .92, y + h * .92, '#c8252b', max(2, w * .012))
    flag_vn(img, x + w * .14, y + h * .16, w * .38)
    draw_text(img, c.fonts, '2·9', x + w * .74, y + h * .4, dict(size=h * .2, ff=NSERIF, weight=700, color='#c8252b'))
    draw_text(img, c.fonts, 'VIỆT NAM', x + w * .5, y + h * .74, dict(size=h * .13, ff=NSERIF, weight=700, color='#c8252b'))
    draw_text(img, c.fonts, 'BƯU CHÍNH', x + w * .5, y + h * .88, dict(size=h * .075, ff=SANS, weight=700, color='#1a1a1a', ls=2))


def st_air_over(img, c, R):
    for s in c.f['slots']:  # viền đen dày kiểu vẽ tay: 2 nét lệch nhau
        x0, y0, x1, y1 = s['x'], s['y'], s['x'] + s['w'], s['y'] + s['h']
        jit = lambda: (R.random() - .5) * 2.4
        pts = []
        for (ax, ay), (bx, by) in [((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)), ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0))]:
            for t in (i / 12 for i in range(12)): pts.append((ax + (bx - ax) * t + jit(), ay + (by - ay) * t + jit()))
        stroke_poly(img, [(px + (-3 if px < (x0 + x1) / 2 else 3), py + (-3 if py < (y0 + y1) / 2 else 3)) for px, py in pts], '#1a1a1a', 6)
        stroke_poly(img, [(px + (-8 if px < (x0 + x1) / 2 else 7), py + (-2 if py < (y0 + y1) / 2 else 5)) for px, py in pts], (26, 26, 26, 200), 2)
    for x, y, w, h in c.f.get('stamps', []): stamp(img, c, x, y, w, h)
    for x, y, w, h in c.f.get('buildings', []):
        c.asset('holidays/quockhanh/toa-nha.png', img, (x, y, w, h), 'Tòa nhà', align='bottom', vector=True)  # tuỳ chọn: thiếu → để trống
    for x, y, s in c.f.get('logos', []):  # cờ nhỏ + "Young Booth"
        fw = s * 2.2
        flag_vn(img, x, y - s * 1.15, fw)
        draw_text(img, c.fonts, 'Young Booth', x + fw + s * .5, y, dict(size=s, ff=NSERIF, weight=700, color='#1a1a1a', align='left'))


def st_moon_bg(img, c, R):
    img.alpha_composite(lin_grad(c.W, c.H, (0, 0), (0, c.H), [(0, '#4a2a9e'), (1, '#3a1f86')]))
    for ox, oy, W2, H2 in c.strips():  # dải kem chữ L: mép trên + mép phải
        img.alpha_composite(lin_grad(int(W2 * .66), 74, (0, 0), (0, 74), [(0, '#f5ecd2'), (1, (245, 236, 210, 0))]), (int(ox + W2 * .34), 0))
        gw = 64 if W2 < 700 else 80
        img.alpha_composite(lin_grad(gw, c.H - 230, (gw, 0), (0, 0), [(0, '#f5ecd2'), (1, (245, 236, 210, 0))]), (ox + W2 - gw, 0))


def st_moon_over(img, c, R):
    f = c.f
    lay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    for s in f['slots']:  # khe mảnh có vệt sáng
        stroke_rect(lay, s['x'] - 1, s['y'] - 1, s['x'] + s['w'] + 1, s['y'] + s['h'] + 1, (255, 255, 255, 200), 2)
    img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(1.2)))
    for ox, oy, W2, H2 in c.strips():
        k = W2 / 1200
        for i in range(3):  # mây cuộn trắng-xanh góc trên-trái
            cx, cy, r = ox + 54 + i * 34 * k, 40 + i * 16, 40 * k + 16
            stroke_poly(img, [(cx + math.cos(t) * r, cy + math.sin(t) * r) for t in (math.pi * (.1 + j * .055) for j in range(21))],
                        '#dbeafe', 9 * k + 4, closed=False)
        for dx, dy, r in [(0, 0, 90), (80, -30, 80), (150, 10, 70), (40, -80, 70)]:  # tán cây góc dưới-trái
            circle(img, ox + 30 + 60 * k + dx * k, c.H - 88 + dy * k, r * k + 12, '#2f7d3a')
            circle(img, ox + 30 + 60 * k + dx * k - r * k * .25, c.H - 88 + dy * k - r * k * .3, r * k * .45, (90, 170, 90, 120))
        reg = (ox + 6, 6, ox + W2 - 6, c.H - 6)
        scatter(c, R, 6 if W2 < 700 else 8, lambda i: 18 + R.random() * 12, 12, lambda x, y, r, i: lantern(img, x, y, r), region=reg, edge=0.6, spread=4)
        for _ in range(12):
            p = free_spot(c, R, 6, 0, region=reg)
            if p: glow_star(img, p[0], p[1], 3 + R.random() * 4, '#ffffff', four=True, halo=.3)
    if f['mode'] == 'F':
        c.asset('holidays/trungthu/kids.png', img, (760, 1380, 440, 420), 'Trẻ em rước đèn\n(file bản quyền)', align='bottom')


STYLES = {
    'plain': (st_plain_bg, None), 'clover': (st_clover_bg, st_clover_over), 'gems': (st_white_bg, st_gems_over),
    'bstars': (st_white_bg, st_bstars_over), 'gstars': (st_white_bg, st_gstars_over), 'night': (st_night_bg, st_night_over),
    'orient': (st_orient_bg, st_orient_over), 'qk08': (st_qk08_bg, st_qk08_over), 'motto': (st_motto_bg, st_motto_over),
    'q29': (st_q29_bg, st_q29_over), 'wflags': (st_white_bg, st_wflags_over), 'maroon': (st_maroon_bg, st_maroon_over),
    'bronze': (st_bronze_bg, st_bronze_over), 'airmail': (st_air_bg, st_air_over), 'moon': (st_moon_bg, st_moon_over),
}


# ---------------------------------------------------------------- dựng 1 khung
def render(f, fonts, asset_dir):
    c = Ctx(f, fonts, asset_dir)
    bg_fn, over_fn = STYLES[f['style']]
    img = Image.new('RGBA', (c.W, c.H), (0, 0, 0, 0))
    bg_fn(img, c, seeded(f['id']))
    punch(img, f['slots'])
    over = Image.new('RGBA', (c.W, c.H), (0, 0, 0, 0))
    if over_fn: over_fn(over, c, seeded(f['id'], 1))
    draw_fixed(over, c)
    img.alpha_composite(over)
    return img, c


def make_thumb(f, png, c, width=300):
    """Ảnh xem trước: nền khung + ô xám (người mẫu) + overlay + chữ mẫu + QR mẫu (+ ô giữ chỗ asset thiếu)."""
    W, H = c.W, c.H
    th = Image.new('RGBA', (W, H), rgba(f['background']))
    for i, s in enumerate(f['slots']):
        sl = Image.new('RGBA', (s['w'], s['h']), (0, 0, 0, 0))
        rect(sl, 0, 0, s['w'], s['h'], lambda w, h, x0, y0: lin_grad(w, h, (0, 0), (0, h), [(0, '#d9d9d9'), (1, '#bdbdbd')]), radius=s.get('radius', 0))
        cx, cy, u = s['w'] / 2, s['h'] * .62, min(s['w'], s['h'])
        circle(sl, cx, cy - u * .2, u * .16, '#a6a6a6')                                    # đầu
        rect(sl, cx - u * .3, cy, cx + u * .3, s['h'] + u * .3, '#a6a6a6', radius=u * .2)   # vai
        comp(th, sl, s['x'], s['y'])
    th.alpha_composite(png)
    for box, label in c.ph: placeholder(th, *box, label, c.fonts)
    for t in f['texts']:
        for x, y in _instances(t): draw_text(th, c.fonts, t['value'], x, y, t)
    if f['qr']:
        for i, p in enumerate(f['qr']['at']): fake_qr(th, p['x'], p['y'], f['qr']['size'], i + 3)
    return th.convert('RGB').resize((width, round(H * width / W)), Image.LANCZOS)


def check(f, c):
    """Cảnh báo: QR quá nhỏ / sát mép giấy / vắt qua đường cắt."""
    warn = []
    q = f['qr']
    if q:
        mn = 110 if (f['mode'] == 'C' or c.cut_y) else 120
        if q['size'] < mn: warn.append(f'QR {q["size"]} < {mn}')
        tile = q['size'] * 1.2
        for p in q['at']:
            x0, y0, x1, y1 = p['x'], p['y'], p['x'] + tile, p['y'] + tile
            if min(x0, y0, c.W - x1, c.H - y1) < 20: warn.append(f'QR ({p["x"]},{p["y"]}) sát mép giấy < 20px')
            if c.cut_x and x0 < 600 < x1 or c.cut_x and min(abs(600 - x0), abs(600 - x1)) < 12: warn.append(f'QR ({p["x"]},{p["y"]}) sát đường cắt x=600')
            if c.cut_y and (y0 < 600 < y1 or min(abs(600 - y0), abs(600 - y1)) < 12): warn.append(f'QR ({p["x"]},{p["y"]}) sát đường cắt y=600')
    return warn


SETS = sorted({f['set'] for f in FR})


def select(names):
    """'sets' → tất cả; 'set03' / '03' → theo bộ; còn lại → theo id khung."""
    out = []
    for n in names:
        nl = n.lower()
        if nl in ('sets', 'all-sets'): out += FR
        elif nl.startswith('set') and nl[3:].zfill(2) in SETS: out += [f for f in FR if f['set'] == nl[3:].zfill(2)]
        else: out += [f for f in FR if f['id'].lower() == nl]
    seen, res = set(), []
    for f in out:
        if f['id'] not in seen: seen.add(f['id']); res.append(f)
    return res


def build(frames, out_dir, asset_dir=None, log=print):
    fonts = Fonts()
    asset_dir = asset_dir or os.path.join(out_dir, 'assets')
    for f in frames:
        png, c = render(f, fonts, asset_dir)
        png.save(os.path.join(out_dir, f['id'] + '.png'), optimize=True)
        make_thumb(f, png, c).save(os.path.join(out_dir, f['id'] + '-thumb.png'), optimize=True)
        w = check(f, c)
        miss = sorted({l.splitlines()[0] for _, l in c.ph})
        vec = sorted(set(c.missing))
        log(f"  {f['id']:<24} {c.W}×{c.H}  {len(f['slots'])} ô" + (f"  · bỏ qua (thiếu asset): {', '.join(miss)}" if miss else '')
            + (f"  · vẽ vector thay: {', '.join(vec)}" if vec else '')
            + (f"  ⚠ {'; '.join(w)}" if w else ''))
