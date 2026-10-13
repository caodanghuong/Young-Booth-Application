# SPEC — Bộ khung #08 "Quốc Khánh 02.09" (khung DỊP LỄ, thương hiệu YOUNG BOOTH)

> Bản nháp, sẽ gộp vào file tổng hợp cuối. Hạ tầng chung: `SPEC-CHON-KHUNG.md` + mục 1, 5 của `SPEC-KHUNG-01`,
> cờ `hidden` + chữ có viền/xoay (`stroke`, `strokeW`, `rotate`) của `SPEC-KHUNG-06`.
> Ảnh mẫu: `docs/frames-ref/khung-08-quoc-khanh.png` (mockup: bỏ nghiêng/bóng, bỏ nền tia nắng bên ngoài tờ).
> Chữ dọc **"LUCY.DESIGN"** trong mẫu = tên người thiết kế khác → THAY bằng **"YOUNG BOOTH"**.

## 0. Xếp khung

| # | Vị trí | Mẫu gốc | Mode | id |
|---|---|---|---|---|
| 1 | Trái (dải dọc) | Dải 2×6, 4 ảnh | **Nhật Ký (C)** — khớp sẵn | `C-quoc-khanh` |
| 2 | Phải (tờ dọc) | 4×6 dọc, lưới 2×2 | **Dịu Dàng (F)** — khớp sẵn | `F-quoc-khanh` |

**Khung dịp lễ** → `hidden: true` mặc định; admin bật trong ⚙️ Cài đặt quanh dịp 2/9 (cùng cơ chế khung sự kiện bộ #06).
Nhóm hiển thị trong Cài đặt: "Khung dịp lễ: Quốc Khánh 02.09 — Bật/Tắt".

## 1. Phong cách

- **Nền**: kem `#f8eedb` với **tia nắng** (sunburst) toả từ tâm tờ: các tia xen kẽ `#fbf5e8` / `#f3e3c4`, 24 tia, độ tương phản nhẹ.
  Viền ngoài trắng mảnh 12px.
- **Ô ảnh**: vuông góc, khe **trắng** 12–14px.
- **Trang trí** (vẽ trong PNG):
  - **Pháo hoa** đỏ `#d7261e` + vàng `#f2b632` (tia toả tròn, chấm nhỏ) ở góc trên-trái và đáy.
  - **Trái tim cờ Việt Nam** (tim đỏ, sao vàng 5 cánh ở giữa) ở mép phải.
  - **Cờ đỏ sao vàng** đúng chuẩn: nền đỏ `#da251d`, sao vàng `#ffff00`, tỉ lệ cờ 2:3, sao ở tâm, một cánh hướng thẳng lên, đường kính vòng ngoại tiếp sao ≈ 0.6 chiều cao cờ.
  - **Nón lá** và **em bé cầm cờ** (hình minh họa).
  - Sao vàng nhỏ rải rác.
- **Hình minh họa nón lá / em bé**: là tranh của người thiết kế mẫu → **KHÔNG cắt/đồ lại từ ảnh mẫu**.
  Dùng PNG có bản quyền đặt tại `C:\YoungBooth-Frames\assets\holidays\quockhanh\` (`non-la.png`, `be-cam-co.png`).
  Thiếu file → bỏ qua (không vẽ ô giữ chỗ trên bản in thật), chỉ vẽ ô giữ chỗ trong thumb để admin biết thiếu.
  Pháo hoa, tim, cờ, sao, tia nắng → script vẽ vector được.
- **Thương hiệu**: chữ **"YOUNG BOOTH" xoay dọc** (90°) màu đỏ gạch `#b5523b`, chữ hoa giãn rộng, cỡ ~22, đặt ở lề phải phía trên
  và lề trái phía dưới (đúng chỗ "LUCY.DESIGN" trong mẫu). Cố định trong PNG.

## 2. Chữ động — admin nhập (textGroup `quockhanh`)

| id | Label | Mặc định | Style |
|---|---|---|---|
| `date` | Ngày lễ | `02.09` | Sans **ExtraBold Italic** đỏ `#d42a2a`, **viền trắng 6px**, `rotate: -4` |
| `title` | Dòng chữ dưới | `VIỆT NAM` | Sans **ExtraBold** đỏ `#d42a2a`, chữ hoa (font phải có dấu tiếng Việt: "Ệ") |

(Admin có thể đổi thành "30.04" / "MỪNG ĐẠI LỄ"… để dùng cho dịp khác.)

## 3. Toạ độ

### #1 `C-quoc-khanh` — Nhật Ký (1200×1800, 2 dải 600, cắt x=600, `cut2inch: true`)
```js
slots: [
  { x: 45,  y: 50,  w: 500, h: 386 }, { x: 45,  y: 448,  w: 500, h: 386 },
  { x: 45,  y: 846, w: 500, h: 386 }, { x: 45,  y: 1244, w: 500, h: 386 },
  { x: 645, y: 50,  w: 500, h: 386 }, { x: 645, y: 448,  w: 500, h: 386 },
  { x: 645, y: 846, w: 500, h: 386 }, { x: 645, y: 1244, w: 500, h: 386 },
],
```
- `date`: xs `[40, 640]` (align left), y 862, size 48, đè lên khe giữa ảnh 2 và 3 như mẫu.
- `title`: xs `[390, 990]`, y 1740, size 48.
- "YOUNG BOOTH" dọc: lề phải x 575 / 1175 (tâm y 600); lề trái x 22 / 622 (tâm y 1400).
- Trang trí mỗi dải: pháo hoa góc trên-trái (0–120, 0–120); tim cờ tâm (540, 440) rộng 60; nón lá tâm (565, 1250) rộng 70; pháo hoa đáy (60–200, 1680–1790).
- QR 110: `at: [{ x: 40, y: 1668 }, { x: 640, y: 1668 }]` (dời pháo hoa đáy sang phải QR).

### #2 `F-quoc-khanh` — Dịu Dàng (1200×1800)
```js
slots: [
  { x: 70,  y: 70,  w: 523, h: 763 }, { x: 607, y: 70,  w: 523, h: 763 },
  { x: 70,  y: 847, w: 523, h: 763 }, { x: 607, y: 847, w: 523, h: 763 },
],
```
- `date`: x 40 (align left), y 868, size 64, đè khe giữa 2 hàng ảnh bên trái.
- `title`: x 600, y 1730, size 72.
- "YOUNG BOOTH" dọc: lề phải x 1165 (tâm y 520); lề trái x 35 (tâm y 1300).
- Trang trí: pháo hoa góc trên-trái (0–200, 0–180); tim cờ tâm (1110, 100) rộng 80; nón lá tâm (230, 1600) rộng 130 (dời sang phải để chừa QR);
  em bé cầm cờ đáy phải (980–1180, 1450–1790); pháo hoa đáy rải 2 bên chữ VIỆT NAM.
- QR 120: `at: [{ x: 40, y: 1650 }]`.

## 4. Khai báo
```js
// mode C → frames: + { id: 'C-quoc-khanh', name: 'Quốc Khánh 02.09', hidden: true, textGroup: 'quockhanh', cut2inch: true, background: '#f8eedb', ... }
// mode F → frames: + { id: 'F-quoc-khanh', name: 'Quốc Khánh 02.09', hidden: true, textGroup: 'quockhanh', background: '#f8eedb', ... }
// logo: null, showBrand: false; texts theo mục 2–3 (có stroke '#ffffff', strokeW 6, rotate -4 cho date)
```

## 5. PNG overlay
Xuất `C-quoc-khanh.png`, `F-quoc-khanh.png` + thumb: nền kem tia nắng, viền trắng, lỗ trong suốt, pháo hoa/tim/cờ/sao vector,
nón lá + em bé từ asset (nếu có), "YOUNG BOOTH" dọc. KHÔNG vẽ date/title/QR.

## 6. Nghiệm thu
- [ ] Mặc định ẩn; bật trong Cài đặt → Nhật Ký và Dịu Dàng có "Quốc Khánh 02.09".
- [ ] Cờ đúng chuẩn (đỏ, sao vàng 5 cánh ở giữa, không méo).
- [ ] "VIỆT NAM" đủ dấu "Ệ"; đổi sang "30.04" / "MỪNG ĐẠI LỄ" hiển thị đúng.
- [ ] Không còn chữ "LUCY.DESIGN".
