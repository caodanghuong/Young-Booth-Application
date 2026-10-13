# SPEC — Bộ khung #05 "Sao Kim Tuyến" (viền mảnh + sao vàng/bạc, thương hiệu YOUNG BOOTH)

> Bản nháp, sẽ gộp vào file tổng hợp cuối. Hạ tầng chung: `SPEC-CHON-KHUNG.md` + mục 1, 5 của `SPEC-KHUNG-01`.
> Ảnh mẫu: `docs/frames-ref/khung-05-gold-silver-stars.png` (mockup: bỏ nghiêng/bóng). Ô hồng trong mẫu = chỗ đặt ảnh (không phải màu khung).
> "Seoulday.booth" → THAY bằng **"Young Booth"**.

## 0. Xếp khung (theo quy ước đã chốt)

| # | Vị trí | Mẫu gốc | Mode |
|---|---|---|---|
| 1 | Trái (dải dọc) | Dải 2×6, 4 ảnh, chữ ở **trên** | **Nhật Ký (C)** — `C-gold-stars` |
| 2 | Giữa (tờ dọc) | Lưới 2×3 = 6 ảnh | **Dịu Dàng (F)** — đổi thành **2×2** — `F-gold-stars-blush` |
| 3 | Phải (tờ dọc) | Lưới 2×2 | **Dịu Dàng (F)** — `F-gold-stars` |
| 4 | Dưới (dải ngang) | Dải 6×2, 4 ảnh, chữ ở **trên giữa** | **Nhật Ký (C) bản ngang** — `C-gold-stars-wide` |

Phân biệt #2/#3 (cùng 2×2):
- #3 **"Sao Kim Tuyến"**: giấy trắng `#ffffff`, sao vàng + bạc trộn đều.
- #2 **"Sao Kim Tuyến Hồng"**: giấy **hồng phấn rất nhạt** `#fdeef0`, sao **vàng chủ đạo** (~80%), viền ô màu `#3a2a2e`.

## 1. Phong cách chung

- Nền trắng, lề rộng, thanh lịch. Chữ thương hiệu **ở TRÊN** (khác bộ #03/#04).
- **Viền ô ảnh**: mỗi ô có **nét đen mảnh 3px** `#222222` bao quanh (vẽ trong PNG, nét nằm **ngay ngoài** mép lỗ trong suốt, không đè ảnh). Góc vuông.
- Khe giữa các ô: 14–16px trắng.
- **Sao kim tuyến nhỏ**: sao 5 cánh 10–28px (đa số 14–20), 2 màu kim loại:
  - Vàng: gradient `#c99a2e` → `#f5dc8c` (+ chấm sáng trắng nhỏ).
  - Bạc: gradient `#a9adb2` → `#f0f2f4`.
  - Vị trí: **ở góc ô ảnh và trên nét viền** (như đính lên viền), lấn vào ảnh tối đa ~12px; ~14–18 sao/tờ 4×6, ~8 sao/dải.
  - Seed cố định theo id khung. Sao vẽ vector trong script (dùng lại `draw_star` của bộ #04, thêm tô gradient).
- **Thương hiệu**: "Young Booth" viết tay **nét mảnh, bay bướm** (Great Vibes / Pinyon Script nhúng), màu `#333333`, cố định trong PNG.
- **Chữ động**: không có.
- QR ≥ 110px.

## 2. Toạ độ

### #1 `C-gold-stars` — Nhật Ký (1200×1800, 2 dải 600, cắt x=600, `cut2inch: true`)
```js
slots: [
  { x: 40,  y: 150, w: 520, h: 390 }, { x: 40,  y: 556,  w: 520, h: 390 },
  { x: 40,  y: 962, w: 520, h: 390 }, { x: 40,  y: 1368, w: 520, h: 390 },
  { x: 640, y: 150, w: 520, h: 390 }, { x: 640, y: 556,  w: 520, h: 390 },
  { x: 640, y: 962, w: 520, h: 390 }, { x: 640, y: 1368, w: 520, h: 390 },
],
```
"Young Booth" cỡ ~52, căn **trái** tại x 44 & 644, baseline y 112 (như mẫu, hơi nghiêng tự nhiên của nét chữ).
QR 110 đè góc dưới-phải ảnh cuối mỗi dải: `at: [{ x: 450, y: 1648 }, { x: 1050, y: 1648 }]`.

### #2 `F-gold-stars-blush`, #3 `F-gold-stars` — Dịu Dàng (1200×1800)
```js
slots: [
  { x: 60,  y: 160, w: 533, h: 733 }, { x: 607, y: 160, w: 533, h: 733 },
  { x: 60,  y: 907, w: 533, h: 733 }, { x: 607, y: 907, w: 533, h: 733 },
],
```
"Young Booth" cỡ ~80, căn giữa (600), baseline y 115. Lề dưới 160px trắng (vài sao nhỏ rải).
QR 120 ở góc dưới-phải: `at: [{ x: 1020, y: 1660 }]`. Ghi đè `logo: null`, `texts: []`.

### #4 `C-gold-stars-wide` — Nhật Ký ngang (1800×1200, 2 dải 1800×600, cắt y=600, `cut2inch: true`)
```js
canvas: { w: 1800, h: 1200 },
slots: [
  { x: 30,   y: 100, w: 424, h: 476 }, { x: 468,  y: 100, w: 424, h: 476 },
  { x: 906,  y: 100, w: 424, h: 476 }, { x: 1344, y: 100, w: 424, h: 476 },
  { x: 30,   y: 700, w: 424, h: 476 }, { x: 468,  y: 700, w: 424, h: 476 },
  { x: 906,  y: 700, w: 424, h: 476 }, { x: 1344, y: 700, w: 424, h: 476 },
],
```
"Young Booth" cỡ ~44, căn giữa x 900, baseline y 72 & 672.
QR 110 đè góc dưới-phải ảnh cuối: `at: [{ x: 1658, y: 466 }, { x: 1658, y: 1066 }]`.

## 3. Khai báo
```js
// mode C → frames: + { id: 'C-gold-stars', name: 'Sao Kim Tuyến', ... }, { id: 'C-gold-stars-wide', name: 'Sao Kim Tuyến – Ngang', ... }
// mode F → frames: + { id: 'F-gold-stars', name: 'Sao Kim Tuyến', background: '#ffffff', ... },
//                    { id: 'F-gold-stars-blush', name: 'Sao Kim Tuyến Hồng', background: '#fdeef0', ... }
// Tất cả: logo: null, texts: [], showBrand: false, overlay/thumb = C:/YoungBooth-Frames/<id>.png
```

## 4. PNG overlay
Xuất 4 PNG + thumb: nền (trắng hoặc hồng phấn), lỗ trong suốt đúng slots, viền ô 3px, sao vàng/bạc gradient (seed cố định), chữ "Young Booth".

## 5. Nghiệm thu
- [ ] Nhật Ký → list có "Sao Kim Tuyến" (dọc, chữ ở trên) và "Sao Kim Tuyến – Ngang".
- [ ] Dịu Dàng → list có "Sao Kim Tuyến" (trắng) và "Sao Kim Tuyến Hồng" (giấy hồng nhạt).
- [ ] Viền ô sát khít mép ảnh, không hở khe trắng giữa viền và ảnh.
- [ ] Sao nhỏ chỉ ở góc/viền, không che mặt. Không còn chữ "Seoulday".
