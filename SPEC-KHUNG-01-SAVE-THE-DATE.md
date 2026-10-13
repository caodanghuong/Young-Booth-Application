# SPEC — Bộ khung #01 "Save The Date" (trắng tối giản, thương hiệu YOUNG BOOTH)

> Gửi Claude trong VS Code. Làm SAU (hoặc cùng lúc) với `SPEC-CHON-KHUNG.md` (nút "Chọn khung").
> Ảnh mẫu gốc: `docs/frames-ref/khung-01-save-the-date.png` (mở ra xem trước khi làm).
> Ảnh mẫu là **mockup** (giấy nghiêng, có bóng đổ): KHÔNG làm nghiêng, KHÔNG có bóng; chỉ lấy bố cục + phong cách.

## 0. Ảnh mẫu có 3 khung → xếp vào 3 kiểu chụp của app

> ✅ Chủ app đã xác nhận (13/10/2026): #1 → Nhật Ký làm 4 ảnh/dải; #2 → Ngọt Ngào (tờ dọc); #3 → Chia Đôi.

| # | Vị trí trong ảnh mẫu | Mô tả mẫu gốc | Xếp vào mode | Ghi chú |
|---|---|---|---|---|
| 1 | Bên trái (dải dọc) | Dải 2×6 dọc, 3 ảnh ngang chồng nhau, chữ ở dưới | **Nhật Ký (C)** | Mẫu có 3 ảnh, Nhật Ký chụp **4** → làm 4 ảnh/dải, giữ nguyên phong cách. In 2 dải giống nhau trên 1 tờ 4×6, máy cắt đôi. |
| 2 | Bên phải (tờ dọc lớn) | Tờ 4×6 dọc, 2 ảnh ngang chồng nhau, chữ ở dưới | **Ngọt Ngào (B)** | Ngọt Ngào hiện là 6×4 NGANG; khung này là 4×6 **DỌC** → khung phải ghi đè `canvas/slots/paper/noRotate` (xem mục 4). |
| 3 | Phía dưới (dải ngang) | Dải 6×2 ngang, 2 ảnh cạnh nhau, chữ ở ô bên phải | **Chia Đôi (D)** | Ghép 2 dải giống nhau trên 1 tờ 6×4, cắt đôi ngang → khách nhận 2 dải 6×2. |

Phong cách chung cả bộ:
- Nền **trắng tinh** `#ffffff`, không viền, không hoạ tiết.
- Ô ảnh **vuông góc** (`radius: 0`), khe hở giữa các ảnh màu trắng.
- Chữ màu **đen than** `#1a1a1a`: 2 dòng tên viết tay (script) **so le** (dòng 1 lệch trái, dòng 2 lệch phải),
  dưới là ngày dạng `09.07.2026` và dòng `SAVE THE DATE` (serif nhỏ, chữ hoa, giãn chữ).
- Thương hiệu: thêm dòng **`YOUNG BOOTH`** nhỏ, xám nhạt `#9a9a9a`, serif chữ hoa giãn rộng, nằm dưới cùng khối chữ
  (dòng này CỐ ĐỊNH, vẽ sẵn vào PNG, admin không sửa). Không chèn logo màu (giữ tinh tế); nếu muốn logo thì dùng
  `logo.png` rất nhỏ (cao ≤ 48px) căn giữa ngay trên chữ YOUNG BOOTH — tuỳ chọn.

## 1. Chữ ĐỘNG — admin tự nhập

Tất cả chữ trừ "YOUNG BOOTH" là **dynamic**, vẽ bằng `drawFrameTexts()`, sửa trong ⚙️ Cài đặt.
Cả 3 khung dùng **chung 1 bộ chữ** (admin nhập 1 lần, áp cho cả 3) → thêm khái niệm `textGroup`:

| text id | Label trong Cài đặt | Giá trị mặc định | Font |
|---|---|---|---|
| `line1` | Tên dòng 1 | `Minh Thư` | Script |
| `line2` | Tên dòng 2 | `Kuan Hsun` | Script |
| `date`  | Ngày | `09.07.2026` | Serif |
| `tagline` | Dòng dưới ngày | `SAVE THE DATE` | Serif, chữ hoa |

- Ô nào để trống → không vẽ dòng đó (hành vi hiện có: `if (!text) continue`).
- Khoá lưu localStorage: `${textGroup || m.id}.${t.id}` → với bộ này là `std-white.line1`, ...
- Cài đặt (`buildFrameTextFields` / `saveFrameTextFields`): hiện **1 nhóm** "Khung Save The Date (Nhật Ký · Ngọt Ngào · Chia Đôi)"
  thay vì lặp 3 lần. Hiện tại 2 hàm này chỉ duyệt `m.texts` của mode → phải duyệt thêm `m.frames[].texts`
  và gom theo `textGroup` (khử trùng theo `textGroup + t.id`).

### Font — BẮT BUỘC hỗ trợ tiếng Việt
Đã thử: **Segoe Script không có chữ "ư"** (ra ô vuông). Phải nhúng font **offline** (máy booth có thể không có mạng):
- Script: **"Great Vibes"** hoặc **"Dancing Script"** (Google Fonts, OFL, có bộ Vietnamese). Thử với `Minh Thư`, `Đặng Hùng`, `Ngọc Ánh`;
  font nào thiếu dấu thì đổi sang font kia.
- Serif: **"Cormorant Garamond"** (có Vietnamese), dự phòng `Georgia, "Times New Roman", serif`.
- Tải file `.ttf/.woff2` vào `renderer/fonts/`, khai báo `@font-face` trong `styles.css` (tên `YB Script`, `YB Serif`).
- Canvas không tự đợi font: trước khi compose gọi
  `await document.fonts.load('48px "YB Script"'); await document.fonts.load('24px "YB Serif"');` (làm 1 lần lúc khởi động + trước compose).

### Tự co chữ cho vừa (thêm vào `drawFrameTexts`)
Tên dài (vd "Nguyễn Hoàng Phương Anh") sẽ tràn, nhất là khung #3. Thêm thuộc tính `fit` (px):
nếu bề rộng dòng > `fit` thì giảm cỡ chữ dần (bước 2px, tối thiểu 60% `size`) cho tới khi vừa. Không xuống dòng với tên.

### Vẽ chữ ở nhiều vị trí
Đã có `xs` (nhiều cột, cùng y). Khung #3 cần nhiều HÀNG → thêm `ys` (cùng x, nhiều y).
Tổng quát: vẽ ở mọi cặp `(x ∈ xs||[x]) × (y ∈ ys||[y])`.

## 2. Khung #1 → Nhật Ký (C) — `C-std-white`

- Canvas **1200 × 1800** (4×6 dọc) = 2 dải 600×1800 giống hệt nhau, đường cắt ở **x = 600** (KHÔNG vẽ vạch cắt).
- 8 slots (dải phải lặp lại 4 ảnh như hiện tại, `i % 4`). Ảnh ngang tỉ lệ ~3:2 (520×328):

```js
slots: [
  { x: 40,  y: 40,   w: 520, h: 328 }, { x: 40,  y: 384,  w: 520, h: 328 },
  { x: 40,  y: 728,  w: 520, h: 328 }, { x: 40,  y: 1072, w: 520, h: 328 },
  { x: 640, y: 40,   w: 520, h: 328 }, { x: 640, y: 384,  w: 520, h: 328 },
  { x: 640, y: 728,  w: 520, h: 328 }, { x: 640, y: 1072, w: 520, h: 328 },
],
```
- Vùng chữ: y 1400 → 1800, mỗi dải căn giữa tại x = 300 và x = 900.

| Chữ | x (tâm) | y (baseline) | size | style |
|---|---|---|---|---|
| line1 | xs `[270, 870]` (lệch trái 30) | 1490 | 72, `fit: 480` | YB Script, `#1a1a1a` |
| line2 | xs `[330, 930]` (lệch phải 30) | 1570 | 72, `fit: 480` | YB Script |
| date | xs `[300, 900]` | 1625 | 24, `ls: 2` | YB Serif, `#333333` |
| tagline | xs `[300, 900]` | 1662 | 22, `ls: 4` | YB Serif, `#333333` |
| YOUNG BOOTH (PNG cố định) | 300 & 900 | 1712 | 16, giãn 7 | serif, `#9a9a9a` |

- QR: nhỏ, **không nhãn**, cạnh 96px, góc dưới-phải **mỗi dải**: (x 464, y 1680) và (x 1064, y 1680) — xem mục 4 về `qr`.
  Nếu chưa muốn sửa `drawGalleryQR` cho nhiều vị trí thì tạm chỉ đặt ở dải phải.

## 3. Khung #2 → Ngọt Ngào (B) — `B-std-white`

- Canvas **1200 × 1800 DỌC**, `paper: '4x6'`, **in KHÔNG xoay** (khác các khung Ngọt Ngào ngang hiện có).
- 2 slots ngang chồng nhau, lề 50px, khe 40px:
```js
canvas: { w: 1200, h: 1800 },
slots: [
  { x: 50, y: 50,  w: 1100, h: 650 },
  { x: 50, y: 740, w: 1100, h: 650 },
],
```
- Vùng chữ: y 1390 → 1800, căn giữa x = 600.

| Chữ | x | y | size | style |
|---|---|---|---|---|
| line1 | 560 | 1500 | 100, `fit: 900` | YB Script |
| line2 | 640 | 1610 | 100, `fit: 900` | YB Script |
| date | 600 | 1680 | 32, `ls: 3` | YB Serif `#333` |
| tagline | 600 | 1728 | 30, `ls: 5` | YB Serif `#333` |
| YOUNG BOOTH (PNG) | 600 | 1772 | 22, giãn 9 | `#9a9a9a` |

- QR: cạnh 150, không nhãn, góc dưới-phải, cách mép 40 → ô (1010, 1610). Chữ căn giữa không đụng QR (đã kiểm tra bản dựng thử).

## 4. Khung #3 → Chia Đôi (D) — `D-std-white`

- Canvas **1800 × 1200** (6×4 ngang) = 2 dải **1800×600** giống hệt nhau chồng lên nhau, đường cắt ở **y = 600**.
  (App xoay ngang→dọc khi in như hiện tại → thành 2 dải dọc cạnh nhau, giống cách cắt của Nhật Ký → in bằng máy có 2-inch cut,
  dùng `stripPrinterName` nếu có: thêm cờ `cut2inch: true` cho khung này và cho Nhật Ký, logic chọn máy in đọc cờ đó.)
- 4 slots (dải dưới lặp 2 ảnh, `i % 2`), ảnh ~4:3:
```js
canvas: { w: 1800, h: 1200 },
slots: [
  { x: 30,  y: 30,  w: 700, h: 540 }, { x: 754, y: 30,  w: 700, h: 540 },
  { x: 30,  y: 630, w: 700, h: 540 }, { x: 754, y: 630, w: 700, h: 540 },
],
```
- Ô chữ bên phải: x 1454 → 1800 (rộng 346), tâm x = 1627. Dùng `ys` để vẽ cho 2 dải:

| Chữ | x | ys | size | style |
|---|---|---|---|---|
| line1 | 1612 | `[150, 750]` | 46, `fit: 300` | YB Script |
| line2 | 1642 | `[220, 820]` | 46, `fit: 300` | YB Script |
| date | 1627 | `[280, 880]` | 20, `ls: 2` | YB Serif `#333` |
| tagline | 1627 | `[315, 915]` | 18, `ls: 3` | YB Serif `#333` |
| YOUNG BOOTH (PNG) | 1627 | 352 & 952 | 14, giãn 5 | `#9a9a9a` |

- QR: cạnh 120, không nhãn, mỗi dải: (1567, 420) và (1567, 1020).
- Bản dựng thử cho thấy size 56 bị **tràn** ô 346px → đã hạ còn 46 + `fit: 300`.

## 5. Mở rộng code cần thiết (bổ sung cho SPEC-CHON-KHUNG.md)

1. **Khung được ghi đè bố cục**: cho phép phần tử trong `frames` ghi đè `canvas`, `slots`, `paper`, `noRotate`, `cut2inch`, `qr`,
   với điều kiện số ảnh khác nhau dùng trong slots = `captureCount` của mode (slots thừa lặp lại `i % captureCount`).
   → Sửa lại quy tắc "KHÔNG được ghi đè slots/canvas…" trong `SPEC-CHON-KHUNG.md`.
   Ảnh đã chụp được `drawCover` cắt cho vừa ô nên đổi tỉ lệ ô vẫn ổn.
2. Ở **mọi chỗ** đang đọc `state.mode.canvas` / `state.mode.noRotate` / chọn máy in (`isStrip`) — đặc biệt đoạn in
   AUTO (~app.js:1218 `landscapeDesign`) — phải dùng `effectiveMode()`. Nếu không, khung #2 (dọc) trong mode B (ngang)
   sẽ bị **xoay sai** khi in.
3. `drawGalleryQR(ctx, canvas, m)`: nhận cấu hình `m.qr` ghi đè `CFG.galleryQR`:
   `{ size, label: false, at: [{x, y}, ...] }` (toạ độ góc trên-trái ô QR, vẽ ở mọi vị trí trong `at`).
   Không có `m.qr` → giữ hành vi cũ.
4. `drawFrameTexts`: thêm `ys`, `fit`, đọc khoá theo `textGroup` (mục 1).
5. Khung chữ chụp (`updateSafeFrame`) vẫn theo khung mặc định của mode — chấp nhận được.

## 6. Khai báo trong `config.js`

Thêm vào mảng `frames` của mode tương ứng (sau khung mặc định đang có). Ví dụ cho C:

```js
{ id: 'C-std-white', name: 'Save The Date – Trắng', textGroup: 'std-white', cut2inch: true,
  overlay: 'file:///C:/YoungBooth-Frames/C-std-white.png',
  thumb:   'file:///C:/YoungBooth-Frames/C-std-white-thumb.png',
  background: '#ffffff', logo: null, showBrand: false,
  canvas: { w: 1200, h: 1800 }, slots: [ /* mục 2 */ ],
  qr: { size: 96, label: false, at: [{ x: 464, y: 1680 }, { x: 1064, y: 1680 }] },
  texts: [
    { id: 'line1', label: 'Tên dòng 1', value: 'Minh Thư', xs: [270, 870], y: 1490, size: 72, fit: 480,
      color: '#1a1a1a', ff: '"YB Script", "Dancing Script", cursive' },
    { id: 'line2', label: 'Tên dòng 2', value: 'Kuan Hsun', xs: [330, 930], y: 1570, size: 72, fit: 480,
      color: '#1a1a1a', ff: '"YB Script", "Dancing Script", cursive' },
    { id: 'date', label: 'Ngày', value: '09.07.2026', xs: [300, 900], y: 1625, size: 24, ls: 2,
      color: '#333333', ff: '"YB Serif", Georgia, serif' },
    { id: 'tagline', label: 'Dòng dưới ngày', value: 'SAVE THE DATE', xs: [300, 900], y: 1662, size: 22, ls: 4,
      color: '#333333', ff: '"YB Serif", Georgia, serif' },
  ] },
```
B (`B-std-white`, `paper: '4x6'`, `noRotate: false`, canvas dọc) và D (`D-std-white`, `cut2inch: true`) làm tương tự theo mục 3, 4.
`logo: null` để KHÔNG kế thừa logo màu của mode.

## 7. Sinh file PNG overlay (`scripts/make-frames.py`)

Thêm 3 hàm sinh vào script hiện có, xuất ra `C:\YoungBooth-Frames\`:
- `C-std-white.png` 1200×1800, `B-std-white.png` 1200×1800, `D-std-white.png` 1800×1200.
- Nội dung PNG: **nền trắng đục**, các ô slots **trong suốt hoàn toàn** (alpha 0, đúng toạ độ ở trên),
  + chữ cố định "YOUNG BOOTH" (serif, `#9a9a9a`, chữ hoa giãn rộng) ở vị trí trong bảng. KHÔNG vẽ tên/ngày/tagline/QR vào PNG.
- Kèm `*-thumb.png` (rộng 300px) có ô xám thay ảnh + chữ mẫu, dùng làm preview trong bảng "Chọn khung".
- Nhớ backup thư mục `C:\YoungBooth-Frames` trước khi ghi (như các lần trước, `_backup-YYYYMMDD`).

## 8. Nghiệm thu
- [ ] Chụp Nhật Ký → "Chọn khung" có "Save The Date – Trắng"; chọn → 2 dải 4 ảnh, chữ đúng, cắt đôi ra 2 dải đẹp đều lề.
- [ ] Chụp Ngọt Ngào → chọn khung → tờ **dọc** 2 ảnh chồng; in ra đúng chiều, không bị cắt, không bị xoay.
- [ ] Chụp Chia Đôi → chọn khung → 2 dải 6×2; in ra cắt đôi được 2 dải ngang.
- [ ] Admin sửa "Tên dòng 1" = `Ngọc Ánh`, "Tên dòng 2" = `Đức Hưng`, ngày = `20.12.2026` 1 lần → cả 3 khung đổi theo, đủ dấu tiếng Việt.
- [ ] Tên rất dài tự co nhỏ, không tràn ra khỏi ô chữ / sang ảnh.
- [ ] Để trống tagline → dòng đó biến mất.
- [ ] Mạng tắt vẫn đúng font (font nhúng offline).
- [ ] QR quét được, không đè lên chữ.
