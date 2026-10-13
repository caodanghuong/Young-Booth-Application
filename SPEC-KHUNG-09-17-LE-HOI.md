# SPEC — Bộ khung #09 → #17: Quốc Khánh 2/9 (8 bộ) + Trung Thu (1 bộ)

> Bản nháp, sẽ gộp vào file tổng hợp cuối. Hạ tầng chung: `SPEC-CHON-KHUNG.md`, mục 1 + 5 của `SPEC-KHUNG-01`
> (textGroup, `fit`, `ys`, `qr.at`, khung ghi đè canvas/slots, font tiếng Việt), `stroke/strokeW/rotate` + cờ `hidden` của `SPEC-KHUNG-06`.
> Ảnh mẫu: `docs/frames-ref/khung-09-…` → `khung-17-…` (mockup: bỏ nghiêng/bóng, bỏ trang trí nằm NGOÀI tờ giấy).

## A. Quy tắc chung cho cả 9 bộ

1. **Thương hiệu**: mọi chữ "LUCY.DESIGN" / "Lucy.Design" / "Lucy design" / "Lucy" trong mẫu = tên người thiết kế khác
   → THAY bằng **"YOUNG BOOTH"** (cùng vị trí, cùng kiểu: chữ dọc, chữ script…). Cố định trong PNG.
2. **Thiết kế MỚI theo phong cách mẫu**, không sao chép y nguyên: các mẫu này là sản phẩm của Lucy.Design. Script vẽ lại bằng vector
   (màu, bố cục, hoạ tiết đơn giản). **Hình minh họa** (Lăng Bác, Dinh Độc Lập/skyline chi tiết, em bé, tem bưu chính có chân dung,
   logo kỷ niệm 80 năm…) → KHÔNG cắt/đồ từ ảnh mẫu; dùng PNG có bản quyền / file chính thức do chủ app đặt vào
   `C:\YoungBooth-Frames\assets\holidays\<bo>\`. Thiếu file → bỏ qua trên bản in (thumb hiện ô giữ chỗ).
3. **Bản đồ Việt Nam** (bộ #14): nếu vẽ bản đồ thì **BẮT BUỘC có quần đảo Hoàng Sa và Trường Sa**. Dùng file bản đồ chuẩn do chủ app cung cấp;
   không có file chuẩn → thay bản đồ bằng ngôi sao vàng (không vẽ bản đồ thiếu đảo).
4. **Cờ Việt Nam**: nền đỏ `#da251d`, sao vàng `#ffff00` 5 cánh ở tâm, tỉ lệ 2:3 (như bộ #08).
5. **Khung dịp lễ** → `hidden: true` mặc định (✅ chủ app đã chốt: ẩn, admin bật khi gần lễ). Nhóm bật/tắt trong ⚙️ Cài đặt:
   - "Khung Quốc Khánh 2/9" — bật/tắt **cả nhóm** #08 → #16 một lần (thêm thuộc tính `holiday: 'quockhanh'`; công tắc theo nhóm, vẫn cho bật/tắt từng khung).
   - "Khung Trung Thu" — #17 (`holiday: 'trungthu'`).
6. **Chữ động**: mọi câu chữ (khẩu hiệu, năm, tiêu đề, đoạn văn) là **chữ admin nhập**, mỗi bộ 1 `textGroup`. Font có dấu tiếng Việt.
7. **QR** ≥ 110px (dải) / 120px (tờ), đặt ở góc trống của dải trang trí dưới (ghi trong từng bộ); chật thì đè góc ô ảnh cuối.
8. Mẫu dải 3 ảnh → làm **4 ảnh/dải** (quy ước đã chốt).

## B. Công thức toạ độ ô ảnh (dùng cho mọi bộ bên dưới)

Mỗi khung chỉ ghi tham số `top`, `bottom`, `side`, `gap`, `radius`. Script & config tính slots như sau:

```js
// Nhật Ký: canvas 1200×1800, 2 dải 600 giống nhau (cắt x=600), 4 ảnh/dải, cut2inch: true
function stripSlots({ top, bottom, side, gap, radius = 0 }) {
  const w = 600 - 2 * side, h = Math.floor((1800 - top - bottom - 3 * gap) / 4);
  const out = [];
  for (const ox of [0, 600]) for (let i = 0; i < 4; i++)
    out.push({ x: ox + side, y: top + i * (h + gap), w, h, radius });
  return out;
}
// Dịu Dàng: canvas 1200×1800, lưới 2×2
function grid2x2Slots({ top, bottom, side, gap, radius = 0 }) {
  const w = Math.floor((1200 - 2 * side - gap) / 2), h = Math.floor((1800 - top - bottom - gap) / 2);
  return [[0, 0], [1, 0], [0, 1], [1, 1]].map(([c, r]) =>
    ({ x: side + c * (w + gap), y: top + r * (h + gap), w, h, radius }));
}
```
Nên đưa 2 hàm này vào `config.js` (hoặc helper riêng) để khai báo `slots: stripSlots({...})` cho gọn; `make-frames.py` có bản Python tương đương.

## C. Từng bộ

### #09 "Độc Lập – Xanh Nhạt" (`qk-blue`) — ảnh `khung-09-qk-xanh-nhat.png`
| Khung | Mode | id | top / bottom / side / gap |
|---|---|---|---|
| Dải dọc 4 ảnh | Nhật Ký | `C-qk-blue` | 110 / 150 / 40 / 24 |
| Lưới 2×2 | Dịu Dàng | `F-qk-blue` | 120 / 150 / 50 / 24 |
- Nền **xanh nhạt loang màu nước** `#d6e6f1` → `#c4d9ea`; khe giữa ảnh cùng màu nền (thấy rõ khe xanh). Ô ảnh vuông góc.
- **Sao đỏ** `#d42a2a` (to ~70px + 1 sao nhỏ ~30px kèm) ở: góc trên-trái, mép phải giữa tờ (khe giữa 2 hàng), góc dưới-trái.
- Chữ động (textGroup `qk-motto`, **dùng chung với bộ #11**), font sans **condensed bold** (vd "Oswald"/"Barlow Condensed" có tiếng Việt), màu navy `#1f2a44`:
  - `header` = `ĐỘC LẬP — TỰ DO — HẠNH PHÚC` — trên cùng, căn trái cạnh sao góc (tờ: x 130, y 92, size 34; dải: x 100/700, y 80, size 24, `fit` 440).
  - `title` = `VIỆT NAM` — dưới-trái (tờ: x 140, y 1730, size 34; dải: x 100/700, y 1760, size 26).
  - `years` = `1945 - 2026` — dưới-phải (tờ: align right x 1090, y 1730; dải: align right x 540/1140, y 1700).
- "YOUNG BOOTH" **dọc** serif nhỏ đen: lề phải phía trên + lề trái phía dưới (thay LUCY.DESIGN).
- QR: tờ `{x: 540, y: 1665}` (giữa 2 chữ dưới, 120px); dải `{x: 245, y: 1668}` & `{x: 845, y: 1668}` (110px).

### #10 "Quốc Khánh 2.9 – Đỏ Trắng" (`qk-29`) — ảnh `khung-10-qk-29-do-trang.png`
| Khung | Mode | id | top / bottom / side / gap |
|---|---|---|---|
| Dải dọc 4 ảnh | Nhật Ký | `C-qk-29` | 110 / 110 / 40 / 14 |
| Lưới 2×2 | Dịu Dàng | `F-qk-29` | 130 / 130 / 50 / 12 |
- Nền **gradient toả**: trắng ở giữa → đỏ `#e03a3a` ở mép (vignette đỏ). Khe giữa ảnh mảnh, **đỏ ánh sáng** (gradient đỏ đậm ở giữa khe).
- Hoạ tiết đỏ vector: chuỗi mũi tên `› › › ›` (trên, hướng phải) và `‹ ‹ ‹ ‹` (dưới, hướng trái); cột `^ ^ ^` dọc 2 mép;
  icon cờ nhỏ cạnh câu chữ; icon toà nhà đơn giản góc trên-phải; **skyline thành phố** đỏ (silhouette đơn giản, tự vẽ) góc dưới-trái;
  cờ hình trái tim góc dưới-phải.
- Chữ động (textGroup `qk-29`), màu đỏ `#d42a2a`:
  - `badge` = `2.9` — **ExtraBold** to, góc trên-trái (tờ: x 70, y 100, size 64; dải: x 50/650, y 82, size 44).
  - `header` = `MỪNG QUỐC KHÁNH` — trên, giữa-phải (tờ: x 760, y 96, size 28; dải: x 330/930, y 76, size 20) — bold chữ hoa.
  - `footer` = `VIỆT NAM TỰ HÀO` — dưới, giữa (tờ: x 640, y 1722, size 28; dải: x 330/930, y 1755, size 20).
  - (Mẫu gốc dùng 2 câu riêng của người thiết kế; app để mặc định câu trung tính trên, admin tự sửa.)
- "YOUNG BOOTH": chữ dọc đỏ nhỏ ở mép phải (giữa cột `^`).
- QR: tờ `{x: 1040, y: 1650}` (dời cờ-tim sang trái QR); dải `{x: 460, y: 1680}` & `{x: 1060, y: 1680}`.

### #11 "Độc Lập – Đỏ Bóng" (`qk-red-gloss`) — ảnh `khung-11-qk-do-bong.png`
- **Cùng bố cục, toạ độ chữ, textGroup `qk-motto` với bộ #09** (`C-qk-red-gloss`, `F-qk-red-gloss`; top/bottom/side/gap như #09).
- Khác: nền **đỏ bóng** `#d7261e` có **vệt sáng trắng chéo** (2–3 dải gradient trắng alpha 60–90% chạy chéo 30°, như phản chiếu satin);
  chữ **trắng**; sao **vàng** `#ffd21f`; khe giữa ảnh lộ nền đỏ/trắng bóng; "YOUNG BOOTH" dọc màu trắng.

### #12 "Độc Lập – Trắng Cờ Hoa" (`qk-white-flags`) — ảnh `khung-12-qk-trang-co.png`
| Khung | Mode | id | top / bottom / side / gap |
|---|---|---|---|
| Dải dọc 4 ảnh | Nhật Ký | `C-qk-white-flags` | 170 / 150 / 40 / 14 |
| Lưới 2×2 | Dịu Dàng | `F-qk-white-flags` | 170 / 150 / 50 / 16 |
- Nền **trắng**, khe trắng. Ô vuông góc.
- Hoạ tiết vector: **ruy băng chéo** đỏ có sao vàng ở góc trên-trái và góc dưới-phải; **cờ nhỏ** (hình chữ nhật hơi gợn) góc trên-phải;
  **dây cờ đuôi nheo** (bunting, cờ đỏ sao vàng tam giác) vắt ngang mép trên một vài ô ảnh (đè ≤ 40px vào ảnh, không che mặt);
  quạt giấy có cờ ở mép trái khe giữa (tuỳ chọn).
- Minh họa **Lăng Bác** góc dưới-trái: chỉ dùng asset `lang-bac.png` nếu chủ app có; không có thì để trống (KHÔNG tự vẽ công trình).
- Chữ động (textGroup `qk-white-flags`), font **viết tay** (vd "Dancing Script" có tiếng Việt), màu đen `#1a1a1a`:
  - `kicker` = `Còn gì vui hơn ?` — nhỏ, trên (tờ: x 600, y 70, size 30; dải: x 300/900, y 62, size 22).
  - `header` = `Độc lập - Tự do` — to hơn, ngay dưới (tờ: x 600, y 130, size 52; dải: x 300/900, y 118, size 38).
- "YOUNG BOOTH": chữ nhỏ đen giãn rộng ở dải dưới, góc dưới-phải trước ruy băng.
- QR: tờ `{x: 540, y: 1660}`; dải `{x: 245, y: 1676}` & `{x: 845, y: 1676}`.

### #13 "Độc Lập – Đỏ Thẫm Hoa Văn" (`qk-maroon`) — ảnh `khung-13-qk-do-tham.webp`
| Khung | Mode | id | top / bottom / side / gap / radius |
|---|---|---|---|
| Dải dọc 4 ảnh | Nhật Ký | `C-qk-maroon` | 110 / 120 / 40 / 30 / 36 |
| Lưới 2×2 | Dịu Dàng | `F-qk-maroon` | 110 / 110 / 40 / 20 / 40 |
- Nền **đỏ thẫm** `#8e1717` có **hoa văn mây truyền thống** chìm (tone-on-tone `#7a1111`, nét cong cuộn, alpha 40%).
- Ô ảnh **bo góc** (giống mẫu: có thể bo so le — góc ngoài bo, góc trong vuông — tuỳ chọn; mặc định bo đều).
- Hoạ tiết: cụm **vòng tròn hoạ tiết** (đỏ/vàng kim) góc trên-trái; **cờ đỏ sao vàng tung bay** (vector) góc dưới-trái
  + silhouette thành phố đen phía dưới cờ (đơn giản, tự vẽ).
- Logo kỷ niệm "2-9-1945" của mẫu: chỉ dùng **file logo chính thức** nếu chủ app có (`logo-ky-niem.png`), không tự vẽ.
- Chữ động (textGroup `qk-maroon`): `header` = `ĐỘC LẬP - TỰ DO` — vàng `#ffd21f` ExtraBold, góc trên-phải
  (tờ: align right x 1150, y 82, size 34; dải: align right x 560/1160, y 74, size 24).
- "YOUNG BOOTH": chữ nhỏ vàng nhạt góc dưới-phải.
- QR: tờ `{x: 1040, y: 1660}` (nếu có logo kỷ niệm thì đặt logo trên QR); dải `{x: 450, y: 1676}` & `{x: 1050, y: 1676}`.

### #14 "Không Gì Quý Hơn Độc Lập Tự Do – Đồng" (`qk-bronze`) — ảnh `khung-14-qk-dong.png`
| Khung | Mode | id | top / bottom / side / gap |
|---|---|---|---|
| Dải dọc 4 ảnh | Nhật Ký | `C-qk-bronze` | 40 / 240 / 40 / 14 |
| Lưới 2×2 | Dịu Dàng | `F-qk-bronze` | 40 / 330 / 40 / 14 |
- Nền **nâu đồng** gradient `#8a6a35` → `#6d5226`; khe giữa ảnh màu nền. Dải dưới có **skyline thành phố mờ** (silhouette alpha 15%).
- Hoạ tiết vàng kim (gradient `#c9a24a` → `#f3dc8a`): **ngôi sao viền vàng** lớn ở dải dưới-trái; bên trong sao là **bản đồ Việt Nam vàng**
  — CHỈ khi có file bản đồ chuẩn đủ Hoàng Sa, Trường Sa (quy tắc A.3); không có → sao vàng đặc.
- Chữ động (textGroup `qk-bronze`), màu vàng kim `#f1d58a`:
  - `quote` = `"Không có gì quý hơn độc lập, tự do."` — script nghiêng, giữa dải dưới (tờ: x 560, y 1600, w 360, size 30, lh 44; dải: x 330/930, y 1640, w 230, size 22).
  - `kicker` = `CHÀO MỪNG`, `header` = `QUỐC KHÁNH`, `title` = `VIỆT NAM` — 3 dòng căn phải, nhỏ → vừa (tờ: x 1150, y 1560/1592/1630, size 18/22/30).
  - `badge` = `2-9` — số to ExtraBold căn phải (tờ: x 1150, y 1720, size 90). (Dải: chỉ hiện `quote`; các chữ khác ẩn bằng `xs: []`.)
- "YOUNG BOOTH" **dọc script** vàng nhạt ở lề phải phía trên + lề trái phía dưới.
- QR: tờ `{x: 60, y: 1660}` (dưới sao); dải `{x: 450, y: 1676}` & `{x: 1050, y: 1676}`.

### #15 — TRÙNG với #13
Ảnh `khung-15-qk-do-tham-trung.webp` giống hệt bộ #13 (chỉ khác ảnh chụp mockup) → **không làm thêm**. ✅ Chủ app đã xác nhận bỏ.

### #16 "Thư Bưu Chính 2/9" (`qk-airmail`) — ảnh `khung-16-qk-thu-buu-chinh.webp`
| Khung | Mode | id | Ghi chú |
|---|---|---|---|
| Dải dọc (mẫu 3 ảnh + khối chữ) | Nhật Ký | `C-qk-airmail` | 4 ảnh: top 40 / bottom 420 / side 40 / gap 16 |
| Tờ dọc (mẫu **3 ảnh** + khối chữ + tem) | **Dịu Dàng (F)** ✅ giữ 3 ô | `F-qk-airmail` | xem dưới |
- Giấy **kem cũ** `#f3ece0` có vân giấy nhẹ; viền **phong bì thư máy bay** (sọc chéo đỏ `#c8252b` / trắng / đen `#1a1a1a`, mỗi sọc ~28px, dày viền 22px).
- Ô ảnh có **viền đen dày 6px kiểu vẽ tay** (nét hơi run, 2 nét lệch nhau 2px). Ô vuông góc.
- Chữ động (textGroup `qk-airmail`), serif **đậm** đỏ `#c8252b` (vd "Noto Serif" Bold), căn đều 2 bên:
  - `para1` (đoạn ngắn), `para2` (đoạn dài) — mặc định: `2/9 – Ngày Quốc khánh nước Việt Nam.` /
    `Chúc mừng ngày Quốc khánh 2/9 – cùng nhau lưu giữ khoảnh khắc tự hào.` (admin sửa tuỳ ý; vẽ có `w` để tự xuống dòng).
- **Tem bưu chính**: mẫu dùng tem lịch sử có chân dung → KHÔNG tự vẽ/cắt. Chỉ dùng `tem.png` nếu chủ app có quyền dùng;
  không có → vẽ **tem vector đơn giản** (khung răng cưa, lá cờ, chữ "VIỆT NAM", "2·9", "BƯU CHÍNH") không có chân dung.
- Hình toà nhà nét đỏ góc dưới-phải: asset tuỳ chọn.
- Logo cờ + "Lucy.Design" góc dưới-trái → **cờ nhỏ + "Young Booth"** (serif đậm đen).
- Dải Nhật Ký: khối chữ dưới gồm `para2` (x 40–330, wrap) + tem nhỏ (380–560); QR 110 trên logo Young Booth `{x: 40, y: 1610}`.
- **Tờ dọc — ✅ chủ app đã chốt**: đưa vào **Dịu Dàng**, khung chỉ có **3 ô** (trên-trái, trên-phải, dưới-trái; dùng ảnh 1–3,
  ảnh 4 vẫn có trong GIF/QR; khung có ít slots hơn captureCount là hợp lệ — `effectiveMode` không đòi đủ ảnh) + ô dưới-phải là `para1` + tem; `para2` ở dải dưới. Slots (side 60, gap 24, top 60, bottom 330):
  `{x:60,y:60,w:528,h:693}`, `{x:612,y:60,w:528,h:693}`, `{x:60,y:777,w:528,h:693}`; `para1` x 640–1140 y 820; tem (680–1120, 1080–1440);
  `para2` x 60–1140 y 1540 wrap; QR `{x: 1040, y: 1660}`.

### #17 "Trung Thu" (`trungthu`) — ảnh `khung-17-trung-thu.webp`
| Khung | Mode | id | top / bottom / side / gap |
|---|---|---|---|
| Dải dọc (mẫu 3 ảnh) | Nhật Ký | `C-trungthu` | 4 ảnh: 60 / 200 / 30 / 14 |
| Lưới 2×2 | Dịu Dàng | `F-trungthu` | 70 / 200 / 50 / 6 |
- Nền **tím đêm** `#4a2a9e` → `#3a1f86`; **dải kem chữ L** ở mép trên + mép phải (`#f5ecd2`, chuyển dần vào tím) như mẫu.
  Khe giữa ảnh rất mảnh (tờ 6px), có vệt sáng trắng ở giữa khe.
- Hoạ tiết vector: **đèn ông sao** vàng/xanh lá (sao 5 cánh viền đỏ, có tua) rải mép; sao nhỏ lấp lánh; **mây cuộn** trắng-xanh góc trên-trái;
  **tán cây** xanh tròn góc dưới-trái.
- Minh họa **trẻ em rước đèn / cá chép / chú Cuội**: chỉ dùng asset có bản quyền `assets/holidays/trungthu/kids.png`; không có → bỏ.
- Chữ động (textGroup `trungthu`), font tròn vui (vd "Baloo 2" có tiếng Việt), trắng:
  - `title` = `Happy Mid Autumn` (admin có thể đổi "Trung Thu Vui Vẻ") — dải dưới giữa (tờ: x 640, y 1690, size 40; dải: x 300/900, y 1690, size 28).
- "Lucy" dưới tiêu đề → **"Young Booth"** cùng font, nhỏ hơn (cố định PNG).
- `hidden: true`, `holiday: 'trungthu'`.
- QR: tờ `{x: 1040, y: 1660}` nếu không có asset trẻ em; có asset (trẻ em chiếm góc phải) thì `{x: 300, y: 1668}` (tán cây thu nhỏ sang trái). Dải: `{x: 460, y: 1676}` & `{x: 1060, y: 1676}`.

## D. Tổng hợp nhanh

| Bộ | Nhật Ký (C) | Dịu Dàng (F) | Nhóm |
|---|---|---|---|
| #09 Độc Lập – Xanh Nhạt | ✅ | ✅ | quockhanh |
| #10 Quốc Khánh 2.9 – Đỏ Trắng | ✅ | ✅ | quockhanh |
| #11 Độc Lập – Đỏ Bóng | ✅ | ✅ | quockhanh |
| #12 Độc Lập – Trắng Cờ Hoa | ✅ | ✅ | quockhanh |
| #13 Độc Lập – Đỏ Thẫm Hoa Văn | ✅ | ✅ | quockhanh |
| #14 Không Gì Quý Hơn Độc Lập Tự Do | ✅ | ✅ | quockhanh |
| #15 (trùng #13) | — | — | — |
| #16 Thư Bưu Chính 2/9 | ✅ | ✅ (3 ô) | quockhanh |
| #17 Trung Thu | ✅ | ✅ | trungthu |

## E. Nghiệm thu
- [ ] Bật "Khung Quốc Khánh 2/9" 1 lần → Nhật Ký & Dịu Dàng hiện đủ các khung 2/9; tắt → ẩn hết.
- [ ] Không còn chữ "Lucy" ở bất kỳ khung nào; mỗi khung có "YOUNG BOOTH".
- [ ] Không có bản đồ thiếu Hoàng Sa/Trường Sa; không có chân dung/logo chính thức nếu không có file hợp lệ.
- [ ] Cờ đúng chuẩn ở mọi khung.
- [ ] Chữ động đủ dấu; đoạn văn #16 tự xuống dòng gọn trong khối.
