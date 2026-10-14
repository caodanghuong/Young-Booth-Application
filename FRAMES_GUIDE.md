# Hướng dẫn khung ảnh Young Booth

Khung = 1 file **PNG** đúng kích thước tờ in, **ô ảnh để trong suốt**. App ghép ảnh khách vào ô, phủ PNG lên trên, rồi vẽ chữ động + QR.
Mọi file khung nằm trong `C:\YoungBooth-Frames\` (ngoài app → đổi PNG không cần cài lại app).

| Kiểu chụp | id | Số ảnh | Khổ PNG mặc định |
|---|---|---|---|
| Khoảnh Khắc | A | 1 | 1200 × 1800 (dọc) |
| Ngọt Ngào | B | 2 | 1800 × 1200 (ngang) |
| Nhật Ký | C | 4 (chụp 6 chọn 4) | 1200 × 1800 = 2 dải 600 giống nhau, cắt ở x = 600 |
| Chia Đôi | D | 2 | 1800 × 1200 |
| Dịu Dàng | F | 4 | 1200 × 1800 |

In 300 dpi: 4×6 inch = 1200×1800 px. Chừa lề ~36 px (máy in hụt mép 1–2 mm); QR tối thiểu **110 px** (dải) / **120 px** (tờ).

---

## 1. Nhiều khung cho cùng một kiểu chụp (nút "Chọn khung")

Ở màn kết quả, khách bấm **Chọn khung** → thấy các khung **cùng kiểu chụp** (ảnh xem trước là ảnh thật của khách) → chạm để đổi.
Nút chỉ hiện khi kiểu chụp có từ 2 khung trở lên.

Danh sách khung của mỗi kiểu là mảng `frames` trong `renderer/config.js`. Phần tử đầu = khung mặc định.
Một khung có thể ghi đè bố cục của kiểu chụp:

```js
{ id: 'C-std-white', name: 'Save The Date – Trắng',
  overlay: 'file:///C:/YoungBooth-Frames/C-std-white.png',        // PNG, ô ảnh trong suốt
  thumb:   'file:///C:/YoungBooth-Frames/C-std-white-thumb.png',  // ảnh nhỏ (rộng ~300) cho bảng chọn
  background: '#ffffff', logo: null, showBrand: false,
  canvas: { w: 1200, h: 1800 },          // khác khổ mặc định của kiểu → app tự xoay đúng chiều khi in
  slots: stripSlots({ top: 40, bottom: 400, side: 40, gap: 16 }), // hoặc mảng { x, y, w, h, radius }
  cut2inch: true,                        // in qua máy "DS-RX1 (2inch cut)"
  qr: { size: 110, label: false, at: [{ x: 448, y: 1648 }, { x: 1048, y: 1648 }] },  // góc trên-trái ô QR
  textGroup: 'std-white',                // chữ dùng chung cho cả bộ khung (nhập 1 lần trong Cài đặt)
  texts: [ { id: 'line1', label: 'Tên dòng 1', value: 'Khoảnh Khắc', xs: [270, 870], y: 1490, size: 72, fit: 480,
             color: '#1a1a1a', ff: '"YB Script", cursive' } ],
}
```

- Ô ảnh: số ảnh khác nhau dùng trong `slots` = số ảnh của kiểu chụp (ô thừa lặp lại `i % số ảnh`); ít ô hơn cũng được.
- Hàm sẵn trong `config.js`: `stripSlots({ top, bottom, side, gap, radius })` (Nhật Ký 2 dải × 4 ảnh), `grid2x2Slots({ … })` (Dịu Dàng 2×2).
- Chữ động (`texts`): `x`/`xs`, `y`/`ys` (vẽ ở mọi cặp), `size`, `fit` (tự co tối đa 60% khi dài), `w` + `lh` (tự xuống dòng),
  `align`, `ls` (giãn chữ), `stroke` + `strokeW` (viền), `rotate` (độ), `weight`, `italic`. Ô để trống → không vẽ.
- **Font có tiếng Việt, nhúng sẵn** (chạy offline): `YB Script` (Great Vibes), `YB Serif` (Cormorant Garamond), `Dancing Script`,
  `Be Vietnam Pro`, `Oswald`, `Baloo 2`, `Noto Serif`, `Patrick Hand` (chữ tay in rời). Không dùng Segoe Script / Georgia (thiếu "ư", "ấ").
- Khung **dịp lễ** (`holiday: 'quockhanh'` / `'trungthu'`) mặc định ẩn → bật trong ⚙️ Cài đặt → "Khung dịp lễ / sự kiện".
- Khung **Trường cấp 3** (`holiday: 'truong'`, `textGroup: 'truong'` — preset `TR` trong `frame_sets.py`) cũng mặc định ẩn → bật ở cùng chỗ ("Khung Trường cấp 3").
  Mọi khung trường dùng chung ô chữ **Tên trường / Khóa / Năm / Ngày / Khẩu hiệu** (id `school` / `khoa` / `nam` / `date` / `slogan`) → nhập 1 lần trong Cài đặt, áp cho cả bộ.
  Bộ có sẵn: **Tết Trường – Đỏ Son** (`*-tet-truong`, đủ 5 kiểu chụp) — chi tiết ở `SPEC-KHUNG-TR-TET-TRUONG.md`, sinh lại: `py scripts/make-frames.py setTR`.

### 17 bộ khung có sẵn — sinh bằng script
Toạ độ + hình vẽ các bộ khung nằm trong `scripts/frame_sets.py` (cùng nguồn cho PNG và `config.js`):

```
py scripts/make-frames.py sets            ← vẽ lại tất cả PNG + thumb (tự backup C:\YoungBooth-Frames\_backup-YYYYMMDD)
py scripts/make-frames.py set03 set07     ← theo bộ        py scripts/make-frames.py C-night-sky   ← 1 khung
py scripts/make-frames.py config          ← ghi lại khối FRAME_SETS / EVENT_FRAMES trong renderer/config.js
```
Sửa `config.js` → phải **đóng gói lại app** (file nằm trong app.asar). Sửa PNG → chỉ cần mở lại app.

Hình minh hoạ có bản quyền (cỏ 4 lá màu nước, logo khách, Lăng Bác, em bé, bản đồ VN đủ Hoàng Sa – Trường Sa…) đặt vào
`C:\YoungBooth-Frames\assets\…` rồi chạy lại lệnh trên; thiếu file thì bản in bỏ qua phần đó (thumb hiện ô giữ chỗ).

---

## 2. Khung cho LUỒNG SỰ KIỆN (thêm nhiều lần, KHÔNG cần cài lại app)

Luồng sự kiện bật/tắt ở webadmin (`http://<IP máy booth>:3737/admin` → "Luồng sự kiện") hoặc ⚙️ Cài đặt trong app.
Mỗi sự kiện có giao diện riêng + danh sách khung riêng. Khung sự kiện **không bao giờ** hiện ở luồng thường.

**Thêm khung sự kiện mới:**
1. Thiết kế PNG đúng khổ của kiểu chụp (dọc 1200×1800, ngang 1800×1200), ô ảnh **trong suốt** đúng toạ độ `slots`.
   Kèm ảnh nhỏ `*-thumb.png` rộng ~300 px (không bắt buộc — thiếu thì dùng chính PNG khung).
2. Chép vào `C:\YoungBooth-Frames\events\<tên bộ>\`, ví dụ `C:\YoungBooth-Frames\events\tiec-cuoi\`.
3. Trong cùng thư mục tạo file **`frames.json`** khai báo khung (đường dẫn ảnh viết **tương đối** theo thư mục này):

```json
[
  { "id": "EV-C-cuoi-thu-hsun", "mode": "C", "name": "Tiệc cưới",
    "overlay": "C-cuoi.png", "thumb": "C-cuoi-thumb.png",
    "background": "#ffffff", "logo": null, "showBrand": false, "cut2inch": true,
    "canvas": { "w": 1200, "h": 1800 },
    "slots": [ { "x": 40, "y": 40, "w": 520, "h": 328 }, { "x": 40, "y": 384, "w": 520, "h": 328 },
               { "x": 40, "y": 728, "w": 520, "h": 328 }, { "x": 40, "y": 1072, "w": 520, "h": 328 },
               { "x": 640, "y": 40, "w": 520, "h": 328 }, { "x": 640, "y": 384, "w": 520, "h": 328 },
               { "x": 640, "y": 728, "w": 520, "h": 328 }, { "x": 640, "y": 1072, "w": 520, "h": 328 } ],
    "qr": { "size": 110, "label": false, "at": [ { "x": 448, "y": 1648 }, { "x": 1048, "y": 1648 } ] },
    "texts": [ { "id": "line1", "label": "Dòng chữ", "value": "Khoảnh Khắc", "xs": [300, 900], "y": 1520,
                 "size": 64, "fit": 480, "color": "#1a1a1a", "ff": "\"YB Script\", cursive" } ] }
]
```
   - `id` nên đặt `EV-<kiểu>-<tên>`, không trùng khung khác. `mode`: A / B / C / D / F.
   - `"photos": 3` = số ảnh khác nhau của khung (khung dải 3 ảnh, tờ 2 ảnh…). Trong luồng sự kiện, khách chụp/chọn **theo số ảnh
     của khung mặc định** (vd Nhật Ký + khung 3 ảnh → chụp 5 chọn 3); khung khác số ảnh không hiện cùng lượt trong "Chọn khung".
     Không ghi → bằng số ảnh mặc định của kiểu chụp. Dải 2 bản (Nhật Ký) thì `slots` gồm cả dải phải (3 ảnh × 2 = 6 ô).
   - Không ghi `canvas` / `slots` / `qr` → dùng giống khung mặc định của kiểu chụp đó.
   - JSON không có chú thích; sai cú pháp thì cả file bị bỏ qua (xem log app).
4. Mở webadmin → sự kiện → **Sửa** → tick khung mới ở kiểu chụp tương ứng (chọn 1 khung làm mặc định) → điền chữ trên khung →
   **✔ Xong sửa sự kiện** → **💾 Lưu**. Booth áp dụng ngay (đang có khách thì sau khi lượt đó xong).

Khung sự kiện có sẵn trong app: `EV-C-orientation`, `EV-B-orientation` (Orientation Day, thư mục `events\orientation\`).
Sự kiện cũng được dùng lại khung thường bằng id (vd `C-std-white` cho đám cưới).

**Ảnh của luồng sự kiện** lưu ở `%APPDATA%\YoungBooth\captures\events\<mã sự kiện>\` (tên file có tiền tố `<mã sự kiện>_`),
lên Cloudinary vào thư mục của sự kiện (mặc định `young-booth/events/<mã>`), gắn tag `event:<mã>`; sự kiện riêng tư không lên gallery chung.

---

## Mẹo làm PNG khung
- Xuất từ Photoshop / Canva / Figma **đúng px**, nền trong suốt; chỗ thấy ảnh khách → để **trống (trong suốt)**.
- Ô bo góc: lỗ trong suốt trên PNG phải bo **đúng** `radius` của slot (không lộ viền ở góc).
- Khung cắt đôi: mỗi nửa là 1 tấm hoàn chỉnh (lề trái = lề phải), không vẽ chi tiết vắt qua đường cắt.
- Không vẽ tên / ngày / QR vào PNG — để app vẽ (đổi được trong Cài đặt / webadmin, QR riêng từng lượt).
