# Khung "Chia Đôi": giấy 6×4 ngang (1800×1200) → cắt đôi giữa thành 2 tấm 3×4" dọc.
# Mỗi nửa 900×1200, 1 ô ảnh trong suốt. Vạch cắt nét đứt ở x=900.
from PIL import Image, ImageDraw
W, H = 1800, 1200
BG = (247, 241, 234, 255)        # ivory
LINE = (214, 196, 178, 255)      # viền ảnh be
CUT = (190, 180, 170, 255)       # vạch cắt
SLOTS = [(70, 150, 760, 860), (970, 150, 760, 860)]  # khớp config.js mode D

im = Image.new('RGBA', (W, H), BG)
d = ImageDraw.Draw(im)
for x, y, w, h in SLOTS:
    d.rectangle([x - 12, y - 12, x + w + 11, y + h + 11], outline=LINE, width=3)
    d.rectangle([x, y, x + w - 1, y + h - 1], fill=(0, 0, 0, 0))
# vạch cắt nét đứt (chỉ là dấu canh, nằm đúng đường cắt)
for y in range(0, H, 32):
    d.line([(W // 2, y), (W // 2, min(y + 16, H))], fill=CUT, width=2)
im.save('C:/YoungBooth-Frames/split2-ivory.png')
print('ok')
