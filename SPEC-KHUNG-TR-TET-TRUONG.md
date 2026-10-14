# SPEC — Bộ khung "Tết Trường – Đỏ Son" (nhóm Khung Trường cấp 3)

> Tài liệu bàn giao cho Claude trong VS Code. Đọc hết trước khi sửa code.
> Phần lớn việc ĐÃ LÀM SẴN trong working tree (chưa commit). Nhiệm vụ của bạn: **kiểm tra, chạy thử trong app, sửa lỗi nếu có, rồi commit.**
> Không viết lại từ đầu. Không sửa tay file PNG hay khối tự sinh trong `config.js`; mọi thay đổi khung đi qua `scripts/frame_sets.py`.

---

## 1. Mục tiêu

Thêm bộ 5 khung in cho **trường cấp 3**, phong cách Tết đỏ (theo ảnh mẫu dải photobooth Lê Quý Đôn), mỗi kiểu chụp 1 khung:

| Kiểu chụp | Mã mode | id khung | Tờ in | Ô ảnh |
|---|---|---|---|---|
| Khoảnh Khắc | A | `A-tet-truong` | 1200×1800 (4×6 dọc) | 1 ô hình mây |
| Nhật Ký | C | `C-tet-truong` | 1200×1800, 2 dải 2×6, cắt x=600 | 4 ô/dải (ảnh lặp 2 dải), 2 dải trang trí khác nhau |
| Ngọt Ngào | B | `B-tet-truong` | 1200×1800 dọc (`paper:'4x6'`, `noRotate:false`) | 2 ô xếp chồng |
| Chia Đôi | D | `D-tet-truong` | 1800×1200 ngang, cắt x=900 | 2 ảnh khác nhau → 2 tấm 3×4" dọc |
| Dịu Dàng | F | `F-tet-truong` | 1200×1800 | lưới 2×2 |

Yêu cầu bắt buộc của chủ app:
1. **Tên trường, Khóa, Năm, Ngày, Khẩu hiệu** là chữ động, chỉnh trong ⚙️ Cài đặt. Không bake cứng vào PNG.
2. Thương hiệu **"YOUNG BOOTH"** phải nhìn rõ trên mọi khung (vàng `#f5c443`, đậm 800, 21–32px, ngay dưới khẩu hiệu). Chữ này cố định trong PNG, người dùng không sửa được.
3. Chữ lớn ở footer mặc định **"THANH XUÂN"** (thay "PHOTO TIME" của ảnh mẫu), đổi được trong Cài đặt.

---

## 2. Đã có sẵn (đừng làm lại)

| Thành phần | Vị trí | Trạng thái |
|---|---|---|
| Code vẽ khung + toạ độ | `scripts/frame_sets.py`, đoạn cuối file "Bộ TR Tết Trường" (style `tet-truong`, preset `TRS`) | xong |
| Nhóm chữ `truong` | `GROUPS['truong']` trong `scripts/frame_sets.py` | xong (5 ô, xem mục 3) |
| PNG overlay + thumb | `C:\YoungBooth-Frames\{A,B,C,D,F}-tet-truong.png` và `*-thumb.png` | đã sinh |
| Khai báo khung | `renderer/config.js`, khối tự sinh `FRAME_SETS` (giữa 2 dòng `// ==== KHUNG MỚI…` và `// ==== HẾT KHUNG MỚI`) | đã sinh |
| Tên nhóm trong Cài đặt | `renderer/config.js` → `frameGroups.truong: 'Khung Trường cấp 3'` và `FRAME_TEXT_GROUPS.truong` | xong |
| Hướng dẫn chung | `FRAMES_GUIDE.md` (đoạn "Khung Trường cấp 3") | xong |
| Ảnh xem trước | `docs/previews/khung-tet-truong.png` | xong |
| Demo tương tác (HTML 1 file) | `docs/demo/khung-tet-truong.html` | xong |

App **không cần sửa logic**: các cơ chế dưới đây đã có trong `renderer/app.js` và khung mới chỉ dùng lại:
- `frameGroupKey()` / `isFrameHidden()`: khung có `holiday` ẩn mặc định, bật theo công tắc nhóm.
- `frameTextGroups()` / `buildFrameTextFields()`: gom ô chữ theo `textGroup`, khử trùng theo `id` (nhiều text cùng `id` trong 1 khung, ví dụ 2 dải Nhật Ký, dùng chung 1 giá trị).
- `frameTextValue()`: lưu ở localStorage `booth.frameText` với key `truong.<id>`; ô `date` trống thì in ngày hôm nay dạng `dd . mm . yyyy`.
- `drawFrameTexts()`: hỗ trợ `fit` (tự thu nhỏ tới 60%), `ls`, `stroke`/`strokeW`, `rotate`, `align`, `xs`/`ys`.
- Font Oswald, Be Vietnam Pro, Baloo 2 (có tiếng Việt) đã nhúng trong `renderer/fonts/fonts.css`.

---

## 3. Chữ động (nhóm `truong`)

Cài đặt ⚙️ → **Chữ trên khung** → nhóm **"Khung Trường cấp 3"**:

| id | Nhãn trong Cài đặt | Mặc định | Font / màu |
|---|---|---|---|
| `school` | Tên trường | `TRƯỜNG THPT YOUNG BOOTH` | Be Vietnam Pro 800, xanh `#1f4fa3`, trong thẻ trắng |
| `khoa` | Khóa | `Khóa 2023 – 2026` | Be Vietnam Pro 600, đỏ `#b3202e`, dưới tên trường |
| `nam` | Năm | `2026` | Baloo 2 800, vàng `#f5c443` viền `#4a0c14` 8px, nghiêng −6°, góc trên trái |
| `date` | Ngày (trống = hôm nay) | *(trống)* | Be Vietnam Pro 600, vàng nhạt `#f7d98a`, ls 3 |
| `slogan` | Khẩu hiệu lớn (thay Photo Time) | `THANH XUÂN` | Oswald 600, hồng kem `#fcd9c4` |

Nhập 1 lần, áp cho cả 5 khung. Tên dài tự thu nhỏ theo `fit`.
Gợi ý khẩu hiệu cho học sinh: TUỔI HỌC TRÒ · MÃI MỘT THỜI ÁO TRẮNG · NHỚ MÃI THANH XUÂN · 12 NĂM MỘT HÀNH TRÌNH.

---

## 4. Thiết kế (để kiểm bằng mắt)

- Nền đỏ son `#a3192b` + hoa văn sóng (seigaiha) `#8a1225`; viền kem mảnh quanh **từng tấm** (dải/tấm cắt có viền riêng, không vắt qua đường cắt).
- Ô ảnh: hình mây / mây trên / lõm giữa / sóng / bo góc; viền kem 9px + bóng hồng `#f4a39b` lệch xuống phải. PNG khoét trong suốt đúng ô chữ nhật; phần ngoài hình mây được phủ nền đỏ.
- Thẻ trường: nhãn trắng viền xanh, bóng hồng, logo tròn bên trái.
- Sticker cắt dán (viền trắng): lì xì, áo đồng phục, huy chương, cành mai, máy ảnh, sách, dưa hấu, bánh chưng; sao lấp lánh vàng rải ngẫu nhiên (seed cố định).
- Footer: khẩu hiệu → YOUNG BOOTH → ngày; QR riêng mỗi tấm (110px ở Nhật Ký, 120px ở các kiểu khác; app tự vẽ QR + nền trắng tại `qr.at`).
- Mọi chi tiết cách mép giấy ≥ 36px.

---

## 5. Việc của VS Code

### 5.1 Kiểm tra file
```bash
node -e "require('./renderer/config.js'); console.log('config OK')"
```
- Trong `renderer/config.js` phải có 5 khung `*-tet-truong`, mỗi khung có `hidden: true, holiday: 'truong', textGroup: 'truong'`, và text `id: 'slogan'`.
- `C:\YoungBooth-Frames\` phải có đủ 10 file `*-tet-truong.png` / `*-tet-truong-thumb.png`. Thiếu thì sinh lại (mục 6).

### 5.2 Chạy thử trong app (`npm start`)
1. ⚙️ Cài đặt → **Khung dịp lễ / sự kiện** → bật **Khung Trường cấp 3** → Lưu.
2. ⚙️ Cài đặt → **Chữ trên khung** → nhóm "Khung Trường cấp 3" phải có đủ 5 ô: Tên trường, Khóa, Năm, Ngày, Khẩu hiệu lớn. Nhập thử:
   - Tên trường: `TRƯỜNG THPT LÊ QUÝ ĐÔN`
   - Khóa: `Khóa 2023 – 2026`
   - Năm: `2026`
   - Ngày: để trống
   - Khẩu hiệu: `TUỔI HỌC TRÒ`
3. Chụp lần lượt 5 kiểu A, C, B, D, F → màn kết quả → nút **Chọn khung** → chọn "Tết Trường – Đỏ Son".
4. In thử 1 tờ mỗi kiểu (máy DNP DS-RX1, khổ 6×4 ngang; app tự xoay A/B/C/F, D giữ ngang).

### 5.3 Tiêu chí chấp nhận
- [ ] Khung chỉ hiện khi bật nhóm "Khung Trường cấp 3"; tắt nhóm thì biến mất khỏi "Chọn khung".
- [ ] Ảnh khách nằm đúng ô, không lộ mép trắng/đen quanh hình mây.
- [ ] Cả 5 chữ động hiện đúng chỗ, đủ dấu tiếng Việt, đổi trong Cài đặt là khung đổi theo.
- [ ] Ô Ngày trống thì in ngày hôm nay.
- [ ] Tên trường dài (~30 ký tự) tự thu nhỏ, không tràn ra khỏi thẻ trắng.
- [ ] Chữ YOUNG BOOTH vàng nhìn rõ trên mọi khung, kể cả bản in.
- [ ] Nhật Ký: 2 dải giống nhau về ảnh và chữ, cắt ở x=600 ra 2 dải hoàn chỉnh. Chia Đôi: cắt ở x=900 ra 2 tấm hoàn chỉnh, mỗi tấm có năm, thẻ trường, khẩu hiệu, QR riêng.
- [ ] QR quét được, không đè lên chữ hay sticker.
- [ ] In ra không bị cắt mất chi tiết ở mép giấy.

### 5.4 Commit
Chỉ commit sau khi 5.3 đạt. Working tree đang có thay đổi của **nhiều việc**:
- Bộ Tết Trường (tài liệu này).
- Bộ #19 Music Player, #20 Polaroid I Love You, font Patrick Hand: đã có trong `config.js`.
- Bộ **#18 Cosmos**: chỉ có trong `frame_sets.py`, **CHƯA được duyệt**, chưa được đưa vào `config.js`. Đừng để nó lọt vào `config.js`.

Hỏi chủ app muốn commit chung hay tách theo từng bộ trước khi commit.

---

## 6. Sinh lại / chỉnh khung

Sửa toạ độ, màu hay sticker trong `scripts/frame_sets.py` (đoạn "Bộ TR"), rồi chạy từ thư mục gốc repo:

```bash
py scripts/make-frames.py setTR
```
Lệnh này sinh lại 5 PNG + thumb vào `C:\YoungBooth-Frames`.

**Cập nhật `config.js` mà KHÔNG đưa bộ #18 Cosmos vào** (đừng chạy `py scripts/make-frames.py config` trần):
```bash
cd scripts && py -c "import frame_sets as fs; fs.FR[:]=[f for f in fs.FR if f['set']!='18']; fs.emit_config('../renderer/config.js')"
```
Sau đó xoá dòng `'cosmos': 'Khung Cosmos (khung sự kiện)',` trong `FRAME_TEXT_GROUPS` nếu nó xuất hiện (nhóm chữ Cosmos vẫn nằm trong `GROUPS` nên bị sinh ra). Kiểm lại bằng lệnh ở 5.1.

Ghi chú kỹ thuật:
- Toạ độ ô ảnh / chữ / QR trong `frame_sets.py` là nguồn duy nhất cho cả PNG lẫn `config.js`; hai bên luôn khớp nếu sinh bằng script.
- Khẩu hiệu được khai báo dạng chữ cố định "PHOTO TIME" trong các `add(...)`, rồi vòng lặp cuối file chuyển thành text động `slogan` (kèm `fit` theo kiểu). Đổi mặc định ở `GROUPS['truong']`.
- `select()` so mã bộ không phân biệt hoa thường, nên `setTR` / `settr` đều chạy được.
- Python cần Pillow + numpy; trên Windows đặt `PYTHONUTF8=1` nếu lỗi encoding.

---

## 7. Logo trường (tuỳ chọn)

Đặt `C:\YoungBooth-Frames\assets\truong\logo.png` (vuông, nền trong suốt) rồi chạy `py scripts/make-frames.py setTR`. Logo được in trong thẻ trường ở cả 5 khung. Chưa có file thì khung dùng huy hiệu vẽ sẵn (vòng xanh, sao vàng, quyển sách).
Đổi trường = đổi logo (chạy lại script) + sửa chữ trong Cài đặt. Không sửa code.

---

## 8. Thêm biến thể sau này (không bắt buộc)

- Màu khác (ví dụ xanh navy): tham số hoá `TR_RED` / `TR_RED_D` trong `st_tr_bg`, thêm `add(id='X-tet-truong-navy', …)` với cùng `slots`/`texts`, giữ `**TRS` để vào chung nhóm "Khung Trường cấp 3".
- Ô chữ mới (ví dụ Lớp): thêm vào `GROUPS['truong']` rồi thêm `T('truong', '<id>', …)` vào `texts` của khung cần dùng.
- Khung trường mới luôn phải có chữ YOUNG BOOTH rõ và để thông tin của trường là chữ động.
