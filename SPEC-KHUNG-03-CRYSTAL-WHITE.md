# SPEC — Bộ khung #03 "Pha Lê Trắng" (lưới ảnh đen-trắng + đá pha lê, thương hiệu YOUNG BOOTH)

> Bản nháp, sẽ gộp vào file tổng hợp cuối. Hạ tầng chung: `SPEC-CHON-KHUNG.md` + mục 1, 5 của `SPEC-KHUNG-01`.
> Ảnh mẫu: `docs/frames-ref/khung-03-crystal-white.png` (mockup: bỏ nghiêng, bỏ bóng, bỏ đá rơi BÊN NGOÀI tờ giấy).
> Chữ "Seoulday.booth" trong mẫu là thương hiệu khác → THAY bằng **"Young Booth"**.

## 0. Ảnh mẫu có 4 khung → xếp vào kiểu chụp

| # | Vị trí | Mẫu gốc | Mode | Trạng thái |
|---|---|---|---|---|
| 1 | Trái (dải dọc) | Dải 2×6, 4 ảnh chồng nhau | **Nhật Ký (C)** | Khớp sẵn 4 ảnh |
| 2 | Giữa (tờ dọc) | 4×6 dọc, lưới 2 cột × 3 hàng = 6 ảnh | **Dịu Dàng (F)** | ✅ Chủ app chốt: **đổi thành 4 ảnh (lưới 2×2)**. Để khác khung #3: bản này đá **hồng là chủ đạo** (~85% hồng) → tên "Pha Lê Hồng" |
| 3 | Phải (tờ dọc) | 4×6 dọc, lưới 2×2 = 4 ảnh | **Dịu Dàng (F)** | Khớp sẵn |
| 4 | Dưới (dải ngang) | Dải 6×2 ngang, 4 ảnh cạnh nhau | **Nhật Ký (C) bản ngang** | ✅ Đã chốt. 2 dải ngang trên tờ 6×4, cắt đôi |

## 1. Phong cách chung

- Nền **trắng** `#ffffff`. Ô ảnh **vuông góc** (`radius: 0`), sát nhau, ngăn bằng **khe trắng mảnh 14px** (lưới liền khối).
- **Đá pha lê** (rhinestone) rải rác: ~60% **hồng** (`#e8618c` tâm, viền `#b8325f`, ánh `#ffd1e0`), ~40% **trong/bạc** (`#e9ecef`, viền `#9aa0a6`).
  - Kích thước 14–30px (đa số 16–22), mỗi tờ 4×6 khoảng **12–16 viên**, dải 2×6 khoảng 6–8 viên/dải.
  - Khung #3 "Pha Lê Trắng": ~70% đá trong/bạc. Khung #2 "Pha Lê Hồng": ~85% đá hồng. Các khung còn lại: tỉ lệ 60/40 như trên.
  - Vị trí: ưu tiên nằm **trên khe trắng, giao điểm lưới, góc ô ảnh và mép giấy**; chỉ lấn vào ảnh tối đa ~10px từ mép ô
    (KHÔNG đặt giữa ảnh — tránh che mặt). Rải ngẫu nhiên nhưng **cố định** (random seed theo id khung) để in lần nào cũng giống.
  - Vẽ trong PNG overlay. Nguồn hình: PNG pha lê có bản quyền tại `C:\YoungBooth-Frames\assets\gems\` (`gem-pink.png`, `gem-clear.png`).
    Chưa có → script tự vẽ: hình tròn gradient toả tâm + 8 mặt cắt hình sao (đường mảnh sáng/tối xen kẽ) + 1 chấm highlight trắng + bóng đổ mờ 2px.
- **Thương hiệu**: chữ **"Young Booth"** viết tay (font script nhúng, vd Great Vibes), màu `#2a2a2a`, căn giữa vùng trắng dưới cùng, cố định trong PNG.
  (Có thể thêm nét gạch hoa mảnh dưới chữ cho giống mẫu.)
- **Chữ động**: mẫu chỉ có thương hiệu nên **không có chữ admin nhập**. (Nếu muốn, thêm 1 dòng tuỳ chọn `caption` mặc định rỗng — rỗng thì không vẽ.)

## 2. QR — cỡ tối thiểu (áp dụng cho TẤT CẢ bộ khung khi tổng hợp)
In 300dpi: 96px ≈ 8mm là quá nhỏ, khó quét. **QR tối thiểu 110px (~9.3mm), khuyên 120px+**, không nhãn ở dải hẹp.
Chỗ chật cho phép QR đè lên **góc ô ảnh cuối** (có nền trắng bo góc).

## 3. Khung #1 → Nhật Ký (C) — `C-crystal-white`

Canvas 1200×1800 = 2 dải 600 (cắt x=600), `cut2inch: true`. Lề 30, khe 12:
```js
slots: [
  { x: 30,  y: 30,  w: 540, h: 380 }, { x: 30,  y: 422,  w: 540, h: 380 },
  { x: 30,  y: 814, w: 540, h: 380 }, { x: 30,  y: 1206, w: 540, h: 380 },
  { x: 630, y: 30,  w: 540, h: 380 }, { x: 630, y: 422,  w: 540, h: 380 },
  { x: 630, y: 814, w: 540, h: 380 }, { x: 630, y: 1206, w: 540, h: 380 },
],
```
Vùng trắng dưới: y 1586 → 1800. "Young Booth" script cỡ ~64, tâm x 250 & 850, baseline y 1715.
QR: `{ size: 110, label: false, at: [{ x: 460, y: 1660 }, { x: 1060, y: 1660 }] }`.

## 4. Khung #2 → Dịu Dàng (F) — `F-crystal-pink`

Chủ app chốt: KHÔNG tạo mode 6 ảnh; đổi khung lưới 2×3 thành **lưới 2×2 (4 ảnh)** đưa vào Dịu Dàng.
Bố cục, slots, chữ "Young Booth", QR **giống hệt khung #3 (mục 5)**; chỉ khác đá pha lê:
- ~85% đá **hồng**, nhiều hơn (16–20 viên/tờ), có 2–3 viên lớn 30–36px ở giao điểm lưới và góc trên-phải.
- Tên hiển thị: **"Pha Lê Hồng"**; khung #3 đổi tên thành **"Pha Lê Trắng"** (đá trong/bạc chủ đạo ~70%).
- File: `F-crystal-pink.png` + thumb. Seed random khác khung #3.

## 5. Khung #3 → Dịu Dàng (F) — `F-crystal-white`

Canvas 1200×1800, lưới 2×2, lề 36, khe 14:
```js
slots: [
  { x: 36,  y: 36,  w: 557, h: 760 }, { x: 607, y: 36,  w: 557, h: 760 },
  { x: 36,  y: 810, w: 557, h: 760 }, { x: 607, y: 810, w: 557, h: 760 },
],
```
Vùng trắng dưới: y 1570 → 1800, "Young Booth" script cỡ ~90 tâm (600, 1715).
QR: `{ size: 120, label: false, at: [{ x: 1044, y: 1640 }] }`. Ghi đè `logo: null`, `texts: []` (không dùng chữ ngày của F mặc định).

## 6. Khung #4 → Nhật Ký (C) bản NGANG — `C-crystal-white-wide`

Ghi đè `canvas: { w: 1800, h: 1200 }` = 2 dải **1800×600** chồng nhau, cắt **y = 600**, `cut2inch: true`
(app xoay về dọc khi in → 2 dải dọc cạnh nhau, cắt giống Nhật Ký thường).
4 ảnh/dải (dải dưới lặp `i % 4`), lề 24, khe 14:
```js
canvas: { w: 1800, h: 1200 },
slots: [
  { x: 24,   y: 24,  w: 427, h: 476 }, { x: 465,  y: 24,  w: 427, h: 476 },
  { x: 906,  y: 24,  w: 427, h: 476 }, { x: 1347, y: 24,  w: 427, h: 476 },
  { x: 24,   y: 624, w: 427, h: 476 }, { x: 465,  y: 624, w: 427, h: 476 },
  { x: 906,  y: 624, w: 427, h: 476 }, { x: 1347, y: 624, w: 427, h: 476 },
],
```
Vùng trắng dưới mỗi dải: y 500 → 600 (và 1100 → 1200). "Young Booth" script cỡ ~48, tâm x 900, baseline y 568 & 1168.
QR: dải quá hẹp → QR 110px đè góc dưới-phải ảnh cuối mỗi dải:
`{ size: 110, label: false, at: [{ x: 1660, y: 476 }, { x: 1660, y: 1076 }] }`.

## 7. PNG overlay (`scripts/make-frames.py`)
Xuất `C-crystal-white.png`, `F-crystal-white.png`, `F-crystal-pink.png` (1200×1800), `C-crystal-white-wide.png` (1800×1200) + thumb:
nền trắng, lỗ trong suốt đúng slots, đá pha lê (seed cố định), chữ "Young Booth" script.

## 8. Nghiệm thu
- [ ] Nhật Ký → list có thêm "Pha Lê Trắng" (dọc) và "Pha Lê Trắng – Ngang".
- [ ] Dịu Dàng → list có "Pha Lê Trắng" và "Pha Lê Hồng" (cùng bố cục 2×2, khác màu đá).
- [ ] Đá pha lê chỉ nằm ở khe/góc/mép, không che mặt; in 2 lần giống hệt nhau.
- [ ] Không còn chữ "Seoulday" ở bất kỳ đâu.
