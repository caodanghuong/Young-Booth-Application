# SPEC — Bộ khung #06 "Sự kiện – Orientation Day" (khung SỰ KIỆN theo khách hàng, có thương hiệu YOUNG BOOTH)

> Bản nháp, sẽ gộp vào file tổng hợp cuối. Hạ tầng chung: `SPEC-CHON-KHUNG.md` + mục 1, 5 của `SPEC-KHUNG-01`.
> Ảnh mẫu: `docs/frames-ref/khung-06-event-orientation.png` (mockup: bỏ nghiêng/bóng; phần tòa nhà tràn ra ngoài tờ là trang trí mockup → bỏ).

## 0. Xếp khung

| # | Vị trí | Mẫu gốc | Mode | Ghi chú |
|---|---|---|---|---|
| 1 | Trái (dải dọc) | Dải 2×6, 3 ảnh | **Nhật Ký (C)** — `C-event-orientation` | Làm **4 ảnh/dải** (quy ước) |
| 2 | Phải (tờ dọc) | 4×6 dọc, 2 ảnh ngang chồng nhau | **Ngọt Ngào (B)** bản dọc — `B-event-orientation` | Giống cách làm khung Save The Date #01-2 (ghi đè canvas dọc, in không xoay) |

## 1. ⚠️ Khung sự kiện — logo & hình của khách hàng

Khung này mang **logo của University of Greenwich và logo đối tác ("UK Super University")** + hình minh họa tòa nhà của trường.
- **KHÔNG tự vẽ lại / đồ lại / cắt từ ảnh mẫu** các logo và hình tòa nhà. Dùng **file gốc do khách hàng (ban tổ chức) cung cấp**,
  đúng bộ nhận diện của họ, và chỉ dùng cho sự kiện của họ.
- Đặt file tại `C:\YoungBooth-Frames\assets\events\orientation\`:
  `logo-1.png` (logo trường), `logo-2.png` (logo đối tác), `building.png` (tòa nhà, nền trong suốt), `flag.png` (cờ, tuỳ chọn).
- Thiếu file nào → script vẽ **ô giữ chỗ** viền nét đứt ghi "LOGO 1" / "BUILDING" (để test bố cục), KHÔNG vẽ logo giả.
- Phần tự vẽ được bằng vector (không vướng bản quyền): mây trắng, biển báo giao thông (hình thoi xanh dương mũi tên zíc-zắc,
  biển chữ nhật xanh ngọc mũi tên trái), lấp lánh ✦ trắng.

### Bật/tắt khung theo sự kiện (thêm vào hạ tầng chung)
Khung sự kiện chỉ dùng trong ngày sự kiện → thêm thuộc tính `hidden: true|false` cho phần tử `frames`
và công tắc trong ⚙️ Cài đặt ("Khung sự kiện: Orientation Day — Bật/Tắt"), lưu localStorage `booth.frameHidden`.
Khung `hidden` không hiện trong list "Chọn khung". Mặc định bộ này **tắt** (`hidden: true`), admin bật khi tới sự kiện.
Tuỳ chọn: thêm `defaultForEvent: true` để khi bật, khung này thành **khung mặc định** của mode (khách khỏi phải chọn).

## 2. Phong cách

- Nền **xanh da trời** `#3fb6e8` phủ toàn tờ; ô ảnh vuông góc, khe xanh 18–30px.
- **Dải logo trên cùng** (nền xanh): logo-1 + logo-2 căn giữa, cạnh nhau, cách 24px.
- **Dải minh họa dưới cùng**: mây trắng bồng bềnh làm nền → tòa nhà (`building.png`) ở giữa-trái → biển báo ở 2 bên →
  tiêu đề sự kiện + khẩu hiệu → lấp lánh ✦. Mây đè nhẹ lên mép dưới ô ảnh cuối.
- **Thương hiệu**: "YOUNG BOOTH" chữ hoa nhỏ màu trắng, giãn chữ, ở mép dưới cùng (cố định trong PNG).

## 3. Chữ động — admin nhập (textGroup `event-orientation`)

| id | Label | Mặc định | Style |
|---|---|---|---|
| `title` | Tên sự kiện | `ORIENTATION` | Sans đậm nghiêng (Be Vietnam Pro / Montserrat **ExtraBold Italic**, có tiếng Việt), trắng, **viền xanh navy `#1d3a8a` 5px** |
| `title2` | Chữ phụ tên sự kiện | `day` | Script nhỏ trắng viền navy, đặt sát phải-dưới `title` |
| `tagline` | Khẩu hiệu | `Future Starts Here` | Sans **Bold** trắng, viền navy 3px |

→ `drawFrameTexts` cần thêm `stroke` (màu viền) + `strokeW` (vẽ `strokeText` trước rồi `fillText`, `lineJoin: 'round'`),
và `rotate` (độ) — tiêu đề trong mẫu hơi chéo lên ~ -6°.

## 4. Toạ độ

### #1 `C-event-orientation` — Nhật Ký (1200×1800, 2 dải 600, cắt x=600, `cut2inch: true`)
```js
slots: [
  { x: 36,  y: 130, w: 528, h: 309 }, { x: 36,  y: 457,  w: 528, h: 309 },
  { x: 36,  y: 784, w: 528, h: 309 }, { x: 36,  y: 1111, w: 528, h: 309 },
  { x: 636, y: 130, w: 528, h: 309 }, { x: 636, y: 457,  w: 528, h: 309 },
  { x: 636, y: 784, w: 528, h: 309 }, { x: 636, y: 1111, w: 528, h: 309 },
],
```
- Logo: mỗi dải, căn giữa x 300 / 900, y 30–100 (cao 70).
- Minh họa: y 1420 → 1800. Tòa nhà tâm x 230 (mỗi dải +600), cao ~300, đáy chạm mép dưới; biển báo trái x 40–150.
- Chữ: `title` xs `[330, 930]` y 1500 size 52 rotate -6; `title2` xs `[470, 1070]` y 1515 size 36; `tagline` xs `[320, 920]` y 1548 size 22.
- "YOUNG BOOTH" y 1788 size 14 tâm 300/900.
- QR 110: `at: [{ x: 460, y: 1660 }, { x: 1060, y: 1660 }]` (biển báo phải dời vào trong, chừa góc QR).

### #2 `B-event-orientation` — Ngọt Ngào bản dọc (ghi đè `canvas: 1200×1800`, `paper: '4x6'`, `noRotate: false`)
```js
canvas: { w: 1200, h: 1800 },
slots: [
  { x: 50, y: 150, w: 1100, h: 600 },
  { x: 50, y: 780, w: 1100, h: 600 },
],
```
- Logo: căn giữa x 600, y 40–120 (cao 80).
- Minh họa: y 1380 → 1800. Tòa nhà tâm x 420, cao ~380; biển thoi trái (100–260, 1560–1760); biển phải dời vào (840–990) để chừa góc QR.
- Chữ: `title` x 600 y 1540 size 84 rotate -6; `title2` x 830 y 1560 size 56; `tagline` x 590 y 1600 size 34.
- "YOUNG BOOTH" x 600 y 1786 size 16.
- QR 120: `at: [{ x: 1040, y: 1640 }]`.

## 5. Khai báo
```js
// mode C → frames: + { id: 'C-event-orientation', name: 'Orientation Day', hidden: true, textGroup: 'event-orientation', cut2inch: true, ... }
// mode B → frames: + { id: 'B-event-orientation', name: 'Orientation Day', hidden: true, textGroup: 'event-orientation',
//                      canvas: { w: 1200, h: 1800 }, paper: '4x6', noRotate: false, ... }
// background: '#3fb6e8', logo: null, showBrand: false
```

## 6. PNG overlay
`make-frames.py` xuất `C-event-orientation.png`, `B-event-orientation.png` + thumb: nền xanh, lỗ trong suốt, logo khách (nếu có file),
mây/biển báo/lấp lánh vector, tòa nhà (nếu có file), chữ "YOUNG BOOTH". KHÔNG vẽ title/tagline/QR (động).
Viết thành hàm `make_event_frame(event_dir, ...)` để sau này làm khung sự kiện khác chỉ cần đổi thư mục asset + màu nền.

## 7. Nghiệm thu
- [ ] Mặc định KHÔNG thấy "Orientation Day" trong list; bật trong Cài đặt → xuất hiện ở Nhật Ký và Ngọt Ngào.
- [ ] Logo là file gốc khách hàng, sắc nét, không méo tỉ lệ.
- [ ] Admin đổi "ORIENTATION" → "WELCOME" / "Future Starts Here" → "Chào tân sinh viên" → cả 2 khung đổi, đủ dấu, có viền navy.
- [ ] Bản Ngọt Ngào dọc in ra đúng chiều.
