# SPEC — Bộ khung #04 "Ngôi Sao Đen" (thương hiệu YOUNG BOOTH)

> Bản nháp, sẽ gộp vào file tổng hợp cuối. Hạ tầng chung: `SPEC-CHON-KHUNG.md` + mục 1, 5 của `SPEC-KHUNG-01`.
> Ảnh mẫu: `docs/frames-ref/khung-04-black-stars.png` (mockup: bỏ nghiêng, bỏ bóng). Ô xám trong mẫu = chỗ đặt ảnh.
> "Seoulday.booth" trong mẫu → THAY bằng **"Young Booth"**.
> **Bố cục 4 khung giống bộ #03 Pha Lê** → dùng lại slots của `SPEC-KHUNG-03` (chỉ khác trang trí + vị trí chữ thương hiệu ở khung #4).

## 0. Xếp khung (áp dụng các quy ước chủ app đã chốt ở bộ #03)

| # | Vị trí | Mẫu gốc | Mode | Slots |
|---|---|---|---|---|
| 1 | Trái (dải dọc) | Dải 2×6, 4 ảnh | **Nhật Ký (C)** | = `C-crystal-white` (SPEC-03 mục 3) |
| 2 | Giữa (tờ dọc) | Lưới 2×3 = 6 ảnh | **Dịu Dàng (F)** — đổi thành **2×2 (4 ảnh)** như quy ước | = `F-crystal-white` (SPEC-03 mục 5) |
| 3 | Phải (tờ dọc) | Lưới 2×2 | **Dịu Dàng (F)** | = `F-crystal-white` |
| 4 | Dưới (dải ngang) | Dải 6×2, 4 ảnh, chữ thương hiệu ở **TRÊN-trái** | **Nhật Ký (C) bản ngang** | Riêng (mục 3) |

Khung #2 và #3 cùng bố cục 2×2 → phân biệt bằng mật độ sao:
- #3 **"Ngôi Sao Đen"**: sao vừa phải (~18–22 sao/tờ), chủ yếu ở viền.
- #2 **"Ngôi Sao Dày"**: nhiều sao hơn (~30–35 sao/tờ), thêm 3–4 sao lớn 70–90px ở góc, vài sao đè lên khe giữa các ảnh.

## 1. Phong cách chung

- Nền **trắng** `#ffffff`; ô ảnh vuông góc, khe trắng 12–14px (giống #03).
- **Sao 5 cánh màu đen** `#111111`, vẽ vector (polygon 10 đỉnh, tỉ lệ bán kính trong/ngoài ≈ 0.45) — hình đơn giản, script tự vẽ, không cần file ảnh.
  - Kích thước trộn: 60% nhỏ 14–24px, 30% vừa 28–44px, 10% lớn 50–70px. Xoay ngẫu nhiên 0–72°.
  - Vị trí: **trên viền trắng quanh tờ**, một số **đè mép ô ảnh** tối đa ~20px (giống mẫu), KHÔNG vào giữa ảnh.
  - Random seed cố định theo id khung (in lần nào cũng giống nhau).
- **Thương hiệu**: chữ **"Young Booth"** viết tay (font script nhúng, cùng font bộ #03), màu `#111111`.
  Điểm nhấn như mẫu: **1 ngôi sao đen lớn phía sau chữ "Y"** (sao cao ≈ 1.6× cỡ chữ), chữ "Y" màu **trắng** viền đen mảnh đè lên sao,
  phần "oung Booth" màu đen bình thường. Vẽ cố định trong PNG.
- **Chữ động**: không có (mẫu chỉ có thương hiệu).
- QR: tối thiểu 110px (quy ước chung), có thể đè góc ô ảnh cuối.

## 2. Khung #1, #2, #3 — toạ độ

- `C-black-stars` (Nhật Ký): slots/QR như `C-crystal-white`. "Young Booth" cỡ ~56, **căn phải-giữa** dải như mẫu: tâm x 300 & 900, baseline y 1715.
- `F-black-stars` (#3) và `F-black-stars-dense` (#2) (Dịu Dàng): slots/QR như `F-crystal-white`.
  "Young Booth" cỡ ~90, tâm (560, 1715) — hơi lệch trái như mẫu, sao lớn sau chữ "Y". QR ở (1044, 1640).

## 3. Khung #4 → Nhật Ký bản NGANG — `C-black-stars-wide`

Canvas **1800×1200** = 2 dải 1800×600 (cắt y=600), `cut2inch: true`. Chữ thương hiệu ở **trên**, ảnh ở dưới:
```js
canvas: { w: 1800, h: 1200 },
slots: [
  { x: 24,   y: 90,  w: 427, h: 486 }, { x: 465,  y: 90,  w: 427, h: 486 },
  { x: 906,  y: 90,  w: 427, h: 486 }, { x: 1347, y: 90,  w: 427, h: 486 },
  { x: 24,   y: 690, w: 427, h: 486 }, { x: 465,  y: 690, w: 427, h: 486 },
  { x: 906,  y: 690, w: 427, h: 486 }, { x: 1347, y: 690, w: 427, h: 486 },
],
```
- "Young Booth" cỡ ~44, căn **trái** tại x 40, baseline y 66 & 666 (sao nhỏ ~56px sau chữ "Y").
- Sao rải ở dải trên (y 0–90) phần bên phải chữ và mép dưới (y 576–600), cách nhau đều, không đè chữ.
- QR 110px đè góc dưới-phải ảnh cuối mỗi dải: `at: [{ x: 1660, y: 462 }, { x: 1660, y: 1062 }]`.

## 4. Khai báo

```js
// mode C → frames: + { id: 'C-black-stars', name: 'Ngôi Sao Đen', ... }, { id: 'C-black-stars-wide', name: 'Ngôi Sao Đen – Ngang', ... }
// mode F → frames: + { id: 'F-black-stars', name: 'Ngôi Sao Đen', ... }, { id: 'F-black-stars-dense', name: 'Ngôi Sao Dày', ... }
// Tất cả: background '#ffffff', logo: null, texts: [], showBrand: false, overlay/thumb trỏ C:/YoungBooth-Frames/<id>.png
```

## 5. PNG overlay
`make-frames.py` xuất `C-black-stars.png`, `F-black-stars.png`, `F-black-stars-dense.png` (1200×1800), `C-black-stars-wide.png` (1800×1200) + thumb:
nền trắng, lỗ trong suốt đúng slots, sao đen vector (seed cố định), chữ "Young Booth" + sao sau chữ Y.
Viết hàm dùng chung `draw_star(draw, cx, cy, r, rot)` và `scatter_stars(seed, canvas, slots, count, size_mix, allow_overlap_px=20)`.

## 6. Nghiệm thu
- [ ] Nhật Ký → list có "Ngôi Sao Đen" (dọc) và "Ngôi Sao Đen – Ngang" (chữ ở trên).
- [ ] Dịu Dàng → list có "Ngôi Sao Đen" và "Ngôi Sao Dày" (cùng 2×2, khác mật độ sao).
- [ ] Sao không che mặt; chữ "Y" trắng nổi trên sao đen.
- [ ] Không còn chữ "Seoulday".
