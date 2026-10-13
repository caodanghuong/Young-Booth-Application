# SPEC — Bộ khung #02 "Cỏ Bốn Lá – Xanh Sage" (thương hiệu YOUNG BOOTH)

> Bản nháp, sẽ gộp vào file tổng hợp cuối. Dùng chung hạ tầng của `SPEC-CHON-KHUNG.md` và mục 1 + 5 của
> `SPEC-KHUNG-01-SAVE-THE-DATE.md` (textGroup, `fit`, `ys`, `qr.at`, khung ghi đè canvas/slots, font tiếng Việt).
> Ảnh mẫu: `docs/frames-ref/khung-02-clover-sage.png` (mockup: bỏ nghiêng, bỏ bóng đổ).

## 0. Ảnh mẫu có 3 khung → xếp vào kiểu chụp

> ✅ Chủ app đã xác nhận: #3 (ngang, 1 ảnh) → Khoảnh Khắc.

| # | Vị trí | Mẫu gốc | Mode | Ghi chú |
|---|---|---|---|---|
| 1 | Trái (dải dọc) | Dải 2×6, 3 ảnh bo góc, chữ dưới | **Nhật Ký (C)** | Làm **4 ảnh/dải** (quy ước đã chốt), 2 dải trên 1 tờ 4×6, cắt đôi. |
| 2 | Phải (tờ dọc) | 4×6 dọc, 1 ảnh lớn bo góc, chữ dưới | **Khoảnh Khắc (A)** | Khớp sẵn (1 ảnh, dọc). |
| 3 | Dưới (tờ ngang) | 6×4 ngang, 1 ảnh lớn, chữ 1 hàng dưới | **Khoảnh Khắc (A)** | 1 ảnh nhưng **ngang** → khung ghi đè `canvas: 1800×1200`; app tự xoay về dọc khi in (như Ngọt Ngào/Chia Đôi). |

## 1. Phong cách chung

- **Nền**: xanh sage nhạt `#c3d1ba`.
- **Dải chữ dưới**: nền xanh sage đậm hơn kiểu **màu nước** — gradient `#a9bfa0` → `#8fab88` từ trên xuống,
  phủ vài vệt loang mờ (blob trắng/xanh alpha 10–20%, Gaussian blur 30–60px) cho cảm giác watercolor. Mép trên của dải hơi loang, không thẳng tắp.
- **Ô ảnh**: bo góc **radius 36–40px** (slot `radius` VÀ lỗ trong suốt trên PNG phải bo giống hệt).
- **Họa tiết**: cỏ bốn lá + lá xanh vẽ màu nước:
  - Cụm cỏ nhỏ, mờ (alpha ~60%) ở **góc trên-trái**, đè nhẹ lên góc ô ảnh đầu.
  - Cụm cỏ **lớn, tươi** ở **góc dưới-phải của ô ảnh cuối**, đè lên mép ảnh và tràn xuống dải chữ.
  - Vài **lá xanh đậm** ở **góc dưới-trái** của tờ.
  - Họa tiết nằm TRONG PNG overlay (vẽ đè lên ảnh khách được).
- **Chữ**: **trắng** `#ffffff`, serif thanh lịch (dùng `YB Serif` = Cormorant Garamond **SemiBold 600**), ngày trắng ngà `#f2f6ef`.
- **Thương hiệu**: dòng **`YOUNG BOOTH`** cố định trong PNG, trắng alpha 80%, serif chữ hoa, giãn chữ rộng, nằm dưới cùng.

### Họa tiết cỏ 4 lá — nguồn ảnh (quan trọng)
Họa tiết trong ảnh mẫu là tranh màu nước của người thiết kế mẫu → **KHÔNG cắt/đồ lại từ ảnh mẫu** (bản quyền).
- Cách chuẩn: chủ app cung cấp PNG nền trong suốt có bản quyền (Canva Pro, Freepik… "watercolor four leaf clover"),
  đặt tại `C:\YoungBooth-Frames\assets\clover\`: `clover-big.png`, `clover-small.png`, `leaves.png`.
  Script `make-frames.py` đọc các file này rồi đặt đúng vị trí/kích thước/độ mờ ở bảng dưới.
- Nếu chưa có file: script **tự vẽ tạm** cỏ 4 lá vector (4 lá hình trái tim, xanh `#6aa85a`→`#9ccc7e`, viền lá đậm hơn,
  thân mảnh, blur 1px, alpha 90%) để chạy thử. Khi có PNG thật chỉ cần chép vào thư mục và chạy lại script.

### Font — BẮT BUỘC có tiếng Việt
Bản dựng thử bằng Georgia **mất chữ "ấ", "ư"** (Tấn → T□n, Như → Nh□). Dùng `YB Serif` nhúng offline (Cormorant Garamond
hoặc Playfair Display — cả 2 có bộ Vietnamese), kiểm tra với "Tấn Nhã", "Huỳnh Như", "Phương Thảo".

## 2. Chữ động — admin nhập (textGroup `clover-sage`, dùng chung cả 3 khung)

| id | Label | Mặc định |
|---|---|---|
| `line1` | Tên người thứ nhất | `Tấn Nhã` |
| `sep` | Ký tự nối | `+` |
| `line2` | Tên người thứ hai | `Huỳnh Như` |
| `date` | Ngày | `05.07.2026` |

## 3. Khung #1 → Nhật Ký (C) — `C-clover-sage`

Canvas 1200×1800 = 2 dải 600 (cắt x=600), `cut2inch: true`. 8 slots, radius 36:
```js
slots: [
  { x: 45,  y: 45,   w: 510, h: 325, radius: 36 }, { x: 45,  y: 394,  w: 510, h: 325, radius: 36 },
  { x: 45,  y: 743,  w: 510, h: 325, radius: 36 }, { x: 45,  y: 1092, w: 510, h: 325, radius: 36 },
  { x: 645, y: 45,   w: 510, h: 325, radius: 36 }, { x: 645, y: 394,  w: 510, h: 325, radius: 36 },
  { x: 645, y: 743,  w: 510, h: 325, radius: 36 }, { x: 645, y: 1092, w: 510, h: 325, radius: 36 },
],
```
Dải chữ màu nước: y 1417 → 1800. Chữ **so le** (tên 1 lệch trái, "+" ở giữa, tên 2 lệch phải):

| Chữ | xs | y | size | ghi chú |
|---|---|---|---|---|
| line1 | `[220, 820]` | 1500 | 52, `fit: 360` | YB Serif 600 trắng |
| sep | `[290, 890]` | 1552 | 36 | |
| line2 | `[370, 970]` | 1612 | 52, `fit: 360` | |
| date | `[370, 970]` | 1660 | 20, `ls: 2` | `#f2f6ef` |
| YOUNG BOOTH (PNG) | 300 & 900 | 1765 | 16, giãn 7 | trắng 80% |

Họa tiết (mỗi dải, toạ độ theo dải trái; dải phải +600): cỏ nhỏ tâm (40, 40) rộng ~110; cỏ lớn tâm (520, 1400) rộng ~170;
lá góc dưới-trái chỉ vẽ nhỏ phía trên QR (y < 1660) để không đè QR.
QR: `qr: { size: 90, label: false, at: [{ x: 40, y: 1675 }, { x: 640, y: 1675 }] }`.

## 4. Khung #2 → Khoảnh Khắc (A) — `A-clover-sage`

Canvas 1200×1800 dọc (giống mode A, không cần ghi đè canvas). 1 slot:
```js
slots: [ { x: 80, y: 80, w: 1040, h: 1300, radius: 40 } ],
```
Dải chữ: y 1380 → 1800.

| Chữ | x | y | size |
|---|---|---|---|
| line1 | 470 | 1530 | 64, `fit: 520` |
| sep | 600 | 1600 | 40 |
| line2 | 720 | 1680 | 64, `fit: 520` |
| date | 720 | 1735 | 22, `ls: 2` |
| YOUNG BOOTH (PNG) | 600 | 1780 | 18, giãn 8 |

Họa tiết: cỏ nhỏ tâm (60, 60) rộng ~160; cỏ lớn tâm (1090, 1380) rộng ~260 (đè góc dưới-phải ảnh); lá xanh vùng (0–220, 1480–1760).
QR: `qr: { size: 120, label: false, at: [{ x: 1040, y: 1640 }] }`.
Ghi đè `logo: null` (không dùng logo màu & chữ ngày mặc định của mode A).

## 5. Khung #3 → Khoảnh Khắc (A) bản NGANG — `A-clover-sage-wide`

Ghi đè `canvas: { w: 1800, h: 1200 }`, `paper: '4x6'` (app tự xoay ngang→dọc khi in AUTO — phải dùng `effectiveMode()`).
```js
canvas: { w: 1800, h: 1200 },
slots: [ { x: 85, y: 63, w: 1630, h: 910, radius: 40 } ],
```
Dải chữ: y 973 → 1200. Tên trên **1 hàng** quanh dấu "+":

| Chữ | x | y | size | align |
|---|---|---|---|---|
| line1 | 840 | 1090 | 64, `fit: 620` | `right` |
| sep | 900 | 1088 | 44 | center |
| line2 | 960 | 1090 | 64, `fit: 620` | `left` |
| date | 900 | 1140 | 22, `ls: 2` | center |
| YOUNG BOOTH (PNG) | 900 | 1182 | 16, giãn 7 | center |

Họa tiết: cỏ nhỏ tâm (70, 60); cỏ lớn tâm (1690, 870) rộng ~240 (KHÔNG tràn ra ngoài mép phải); lá vùng (0–180, 980–1200).
QR: `qr: { size: 120, label: false, at: [{ x: 1650, y: 1050 }] }`.

## 6. Khai báo (mẫu cho khung #2)

```js
// trong mode A → frames: [ <khung mặc định>, ... ]
{ id: 'A-clover-sage', name: 'Cỏ Bốn Lá – Sage', textGroup: 'clover-sage',
  overlay: 'file:///C:/YoungBooth-Frames/A-clover-sage.png',
  thumb:   'file:///C:/YoungBooth-Frames/A-clover-sage-thumb.png',
  background: '#c3d1ba', logo: null, showBrand: false,
  slots: [ { x: 80, y: 80, w: 1040, h: 1300, radius: 40 } ],
  qr: { size: 120, label: false, at: [{ x: 1040, y: 1640 }] },
  texts: [
    { id: 'line1', label: 'Tên người thứ nhất', value: 'Tấn Nhã', x: 470, y: 1530, size: 64, fit: 520,
      color: '#ffffff', ff: '"YB Serif", serif', weight: '600' },
    { id: 'sep', label: 'Ký tự nối', value: '+', x: 600, y: 1600, size: 40, color: '#ffffff', ff: '"YB Serif", serif' },
    { id: 'line2', label: 'Tên người thứ hai', value: 'Huỳnh Như', x: 720, y: 1680, size: 64, fit: 520,
      color: '#ffffff', ff: '"YB Serif", serif', weight: '600' },
    { id: 'date', label: 'Ngày', value: '05.07.2026', x: 720, y: 1735, size: 22, ls: 2,
      color: '#f2f6ef', ff: '"YB Serif", serif' },
  ] },
```
Khung #1 (`C-clover-sage`, thêm `cut2inch: true`, dùng `xs`) và #3 (`A-clover-sage-wide`, thêm `canvas` ngang, `align`) tương tự.

## 7. PNG overlay (`scripts/make-frames.py`)
Xuất `C-clover-sage.png` (1200×1800), `A-clover-sage.png` (1200×1800), `A-clover-sage-wide.png` (1800×1200) + `*-thumb.png`:
nền sage + dải màu nước + lỗ **trong suốt bo góc** đúng slots + họa tiết cỏ/lá + chữ "YOUNG BOOTH". KHÔNG vẽ tên/ngày/QR.

## 8. Nghiệm thu
- [ ] Nhật Ký → "Chọn khung" có "Cỏ Bốn Lá – Sage"; 2 dải × 4 ảnh bo góc, lỗ ảnh khớp đúng góc bo (không lộ viền trắng/đen ở góc).
- [ ] Khoảnh Khắc → list có **2** khung mới: bản dọc và bản ngang; bản ngang in ra không bị cắt.
- [ ] Admin nhập "Phương Thảo" + "Đức Hưng" 1 lần → cả 3 khung đổi, đủ dấu.
- [ ] Cỏ bốn lá đè lên góc ảnh nhìn tự nhiên, không che mặt người (nằm sát góc).
