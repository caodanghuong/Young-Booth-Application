# YOUNG BOOTH — TỔNG HỢP: NÚT "CHỌN KHUNG" + 17 BỘ KHUNG MỚI

> **Gửi Claude Code trong VS Code.** Đây là file DUY NHẤT cần đọc. Phần 0–3 là tổng quan + quy tắc chung (ƯU TIÊN CAO NHẤT,
> ghi đè các phần chi tiết nếu mâu thuẫn). Phần 4 trở đi là đặc tả chi tiết từng phần (gộp nguyên văn từ các file SPEC-*.md).
> Ảnh mẫu gốc: `docs/frames-ref/khung-01-…` → `khung-17-…`.
> Bản demo trực quan (chạy được, mô phỏng đúng luồng + vẽ minh hoạ mọi khung): `docs/demo-chon-khung.html`
> — mở bằng trình duyệt để xem bố cục/màu/vị trí chữ mong muốn. Code canvas trong demo (hàm `stripSlots`, `grid2x2`, các style vẽ)
> có thể tham khảo khi viết `make-frames.py`.

## 0. Luồng người dùng (chủ app đã chốt)

```
Màn chờ → BẮT ĐẦU → Chọn kiểu chụp (vd "Nhật Ký") → (Thanh toán) → Chụp đủ ảnh → (Xem lại / chụp lại)
→ MÀN KẾT QUẢ (ảnh đã ghép khung MẶC ĐỊNH của kiểu đó)
→ bấm "🖼️ Chọn khung" → hiện DANH SÁCH CHỈ GỒM khung của kiểu đã chọn (theo state.mode.id, không hỏi lại)
→ chạm 1 khung → ghép lại ngay → In / Chia sẻ QR / Kết thúc
```
Khách KHÔNG chọn khung trước khi chụp. Khung thêm vào `frames[]` của mode nào thì tự hiện trong list mode đó.

## 1. Thứ tự triển khai đề xuất

1. **Hạ tầng** (Phần 4 + mục 1, 5 của Phần 5): `frames[]` mỗi mode, `effectiveMode()`, nút + modal "Chọn khung", khung được ghi đè
   `canvas/slots/paper/noRotate/cut2inch/qr/textGroup`, `drawFrameTexts` thêm `fit`/`ys`/`w`/`stroke`/`strokeW`/`rotate`/`align`,
   `drawGalleryQR` theo `qr.at`, chữ động theo `textGroup` trong Cài đặt, cờ `hidden` + công tắc nhóm dịp lễ/sự kiện,
   font nhúng offline có tiếng Việt, hàm `stripSlots()`/`grid2x2Slots()`.
2. **Sửa mọi chỗ đọc `state.mode.canvas` / `noRotate` / chọn máy in** sang `effectiveMode()` (nếu không: khung dọc trong mode ngang bị xoay sai khi in).
3. **`scripts/make-frames.py`**: hàm dùng chung (lỗ trong suốt theo slots, sao, đá, glow, pháo hoa, cờ, mây, chữ thương hiệu, placeholder asset) → sinh PNG + thumb cho từng khung. Backup `C:\YoungBooth-Frames` trước khi ghi.
4. Khai báo từng khung trong `config.js` theo Phần 5–13 (Phần 5 = bộ #01 … Phần 13 = bộ #09–#17). Làm theo bộ, test từng bộ trên máy.
5. Cập nhật `FRAMES_GUIDE.md`.

## 2. Quy tắc chung (GHI ĐÈ phần chi tiết nếu mâu thuẫn)

- **Thương hiệu**: mọi tên thương hiệu/người thiết kế khác trong mẫu ("Seoulday.booth", "LUCY.DESIGN", "Lucy"…) → **"YOUNG BOOTH" / "Young Booth"**, cùng vị trí & kiểu. Cố định trong PNG.
- **Thiết kế mới theo phong cách mẫu**, không sao chép y nguyên. Logo/hình minh hoạ của bên thứ ba (logo trường, tòa nhà, Lăng Bác, tem có chân dung,
  logo kỷ niệm, em bé, nón lá, cỏ bốn lá màu nước, đá pha lê ảnh thật…) → chỉ dùng **file có bản quyền / file chính thức** do chủ app đặt vào
  `C:\YoungBooth-Frames\assets\<nhóm>\`. Thiếu file → bản in bỏ qua phần đó (hoặc dùng hình vector đơn giản nếu spec cho phép); thumb hiện ô giữ chỗ.
- **Bản đồ Việt Nam** (nếu có) BẮT BUỘC có Hoàng Sa, Trường Sa; không có file chuẩn → không vẽ bản đồ.
- **Cờ Việt Nam**: đỏ `#da251d`, sao vàng `#ffff00` ở tâm, tỉ lệ 2:3.
- **QR tối thiểu 110px (dải) / 120px (tờ)** — áp cho MỌI khung (khung #01 đang ghi 96px → nâng lên 110px, giữ góc dưới-phải mỗi dải).
- **Font có tiếng Việt, nhúng offline**: Segoe Script và Georgia THIẾU "ư", "ấ" → không dùng. Bộ font: Great Vibes / Dancing Script (script),
  Cormorant Garamond hoặc Playfair (serif), Be Vietnam Pro (sans đậm), Oswald (condensed), Baloo 2 (tròn), Noto Serif (serif đậm). `document.fonts.load` trước khi compose.
- **Quy ước xếp khung** (đã chốt): dải dọc 3 ảnh → làm 4 ảnh vào Nhật Ký; dải ngang 6×2 4 ảnh → Nhật Ký bản ngang; tờ dọc 2 ảnh chồng → Ngọt Ngào (dọc);
  dải ngang 2 ảnh → Chia Đôi; 1 ảnh (dọc/ngang) → Khoảnh Khắc; lưới 2×3 (6 ảnh) → đổi thành 2×2 vào Dịu Dàng (biến thể khác màu/mật độ trang trí);
  tờ 3 ảnh (bộ #16) → giữ 3 ô trong Dịu Dàng (khung có ít slot hơn số ảnh chụp là hợp lệ).
- **Khung dịp lễ / sự kiện mặc định ẨN** (`hidden: true`), công tắc trong ⚙️ Cài đặt:
  - "Khung Quốc Khánh 2/9" (`holiday: 'quockhanh'`): bộ **#08, #09, #10, #11, #12, #13, #14, #16** — bật/tắt cả nhóm 1 lần.
  - "Khung Trung Thu" (`holiday: 'trungthu'`): bộ **#17**.
  - "Khung sự kiện Orientation Day" (`event`): bộ **#06**.
- **Chữ động**: mọi tên/ngày/khẩu hiệu là chữ admin nhập theo `textGroup` (1 bộ khung = 1 nhóm, nhập 1 lần áp cho cả bộ). Ô trống → không vẽ.

## 3. Danh mục khung theo kiểu chụp (sau khi làm xong)

| Kiểu chụp | Khung (id) | Số lượng |
|---|---|---|
| **Khoảnh Khắc (A)** | mặc định · `A-clover-sage` · `A-clover-sage-wide` | 3 |
| **Ngọt Ngào (B)** | mặc định · `B-std-white` · `B-event-orientation`* | 3 |
| **Nhật Ký (C)** | mặc định · `C-std-white` · `C-clover-sage` · `C-crystal-white` · `C-crystal-white-wide` · `C-black-stars` · `C-black-stars-wide` · `C-gold-stars` · `C-gold-stars-wide` · `C-night-sky` · `C-night-sky-wide` · `C-event-orientation`* · `C-quoc-khanh`** · `C-qk-blue`** · `C-qk-29`** · `C-qk-red-gloss`** · `C-qk-white-flags`** · `C-qk-maroon`** · `C-qk-bronze`** · `C-qk-airmail`** · `C-trungthu`** | 21 |
| **Chia Đôi (D)** | mặc định · `D-std-white` | 2 |
| **Dịu Dàng (F)** | mặc định · `F-crystal-white` · `F-crystal-pink` · `F-black-stars` · `F-black-stars-dense` · `F-gold-stars` · `F-gold-stars-blush` · `F-night-sky` · `F-night-sky-violet` · `F-quoc-khanh`** · `F-qk-blue`** · `F-qk-29`** · `F-qk-red-gloss`** · `F-qk-white-flags`** · `F-qk-maroon`** · `F-qk-bronze`** · `F-qk-airmail`** (3 ô) · `F-trungthu`** | 18 |

`*` sự kiện (ẩn mặc định) · `**` dịp lễ (ẩn mặc định). Bộ #15 trùng #13 → bỏ.

### Asset chủ app cần chuẩn bị (thiếu vẫn chạy được)
| Thư mục `C:\YoungBooth-Frames\assets\…` | File | Dùng cho |
|---|---|---|
| `clover\` | clover-big.png, clover-small.png, leaves.png | #02 (thiếu → cỏ vector) |
| `gems\` | gem-pink.png, gem-clear.png | #03 (thiếu → đá vector) |
| `events\orientation\` | logo-1.png, logo-2.png, building.png, flag.png | #06 (file từ ban tổ chức) |
| `holidays\quockhanh\` | non-la.png, be-cam-co.png, lang-bac.png, logo-ky-niem.png, ban-do-vn.png (đủ HS/TS), tem.png | #08, #12, #13, #14, #16 |
| `holidays\trungthu\` | kids.png | #17 |

---

# PHẦN 4 — (nguyên văn từ `SPEC-CHON-KHUNG.md`)

## SPEC — Nút "Chọn khung" ở màn kết quả (trước khi in)

> Gửi Claude trong VS Code: đọc hết file này rồi triển khai. Project: Electron app Young Booth.
> File liên quan: `renderer/config.js`, `renderer/app.js`, `renderer/index.html`, `renderer/styles.css`.

## 1. Mục tiêu

Ở màn kết quả (`#screen-result`), ảnh đã được ghép sẵn vào **khung mặc định** của kiểu chụp mà khách đã chọn.
Thêm một nút **"🖼️ Chọn khung"**. Khi bấm, hiện ra danh sách các **khung thay thế CÙNG LOẠI** với kiểu chụp hiện tại.
Khách chạm vào khung nào thì ảnh được ghép lại ngay vào khung đó (không chụp lại), rồi in như bình thường.

"Cùng loại" nghĩa là cùng kiểu chụp (cùng `mode.id`):

| Kiểu chụp (mode)           | id | Số ảnh | Khổ        | List khung hiển thị        |
|----------------------------|----|--------|------------|----------------------------|
| Khoảnh Khắc                | A  | 1      | 4×6 dọc    | chỉ các khung của A        |
| Ngọt Ngào                  | B  | 2      | 6×4 ngang  | chỉ các khung của B        |
| Nhật Ký (2×6, 2 dải)       | C  | 4      | 4×6 dọc    | chỉ các khung của C        |
| Chia Đôi                   | D  | 2      | 6×4 ngang  | chỉ các khung của D        |
| Dịu Dàng                   | F  | 4      | 4×6 dọc    | chỉ các khung của F        |

App **tự biết** khách đang ở kiểu nào qua `state.mode` (đã được set khi khách chọn ở màn "Chọn kiểu chụp"), KHÔNG hỏi lại khách.
Ví dụ: khách chụp 4 ảnh Nhật Ký → bấm "Chọn khung" chỉ thấy các khung Nhật Ký; không bao giờ thấy khung Ngọt Ngào.

## 1b. Luồng người dùng (chủ app đã chốt)

```
Màn chờ → BẮT ĐẦU → Chọn kiểu chụp (vd "Nhật Ký") → (Thanh toán) → Chụp đủ ảnh
   → (Xem lại / chụp lại từng tấm) → Đang xử lý → MÀN KẾT QUẢ (ảnh ghép sẵn KHUNG MẶC ĐỊNH của Nhật Ký)
   → bấm "🖼️ Chọn khung" → hiện LIST CHỈ GỒM các khung của Nhật Ký (mọi khung đã khai báo trong frames[] của mode C)
   → chạm 1 khung → ảnh ghép lại ngay với khung đó → (đổi tiếp nếu muốn) → In / Chia sẻ QR / Kết thúc
```

- Khách **không chọn khung trước khi chụp**; chọn kiểu chụp xong là chụp luôn, chọn khung ở màn kết quả.
- List khung lấy theo `state.mode.id` mà khách đã chọn ở bước "Chọn kiểu chụp" — không hỏi lại.
- Tương tự cho mọi kiểu: Khoảnh Khắc → chỉ khung Khoảnh Khắc; Ngọt Ngào → chỉ khung Ngọt Ngào; Chia Đôi; Dịu Dàng.
- Mỗi khung mới thêm vào `frames[]` của mode nào thì tự động xuất hiện trong list của mode đó (không cần sửa code).

## 2. Dữ liệu — khai báo khung thay thế trong `config.js`

Thêm vào MỖI mode kiểu ảnh (A, B, C, D, F) một mảng `frames`. Phần tử đầu tiên = khung mặc định hiện tại
(chính là các giá trị `overlay` / `background` / `logo` / `texts` đang có).

```js
{ id: 'C', name: 'Nhật Ký', ... ,
  overlay: 'file:///C:/YoungBooth-Frames/grid6-navy.png',   // giữ nguyên (mặc định)
  background: '#ffffff',
  frames: [
    { id: 'navy',  name: 'Xanh Navy', overlay: 'file:///C:/YoungBooth-Frames/grid6-navy.png' },          // = mặc định
    { id: 'pink',  name: 'Hồng Pastel', overlay: 'file:///C:/YoungBooth-Frames/C-pink.png', background: '#fde7ef' },
    { id: 'film',  name: 'Film Đen',   overlay: 'file:///C:/YoungBooth-Frames/C-film.png',  background: '#111111',
      textColor: '#ffffff' },
  ],
}
```

Quy tắc cho mỗi phần tử trong `frames`:
- Bắt buộc: `id`, `name`, `overlay` (PNG cùng kích thước `canvas` của mode, trong suốt đúng vị trí `slots`).
- Tuỳ chọn, ghi đè lên mode khi khung được chọn: `thumb` (ảnh preview nhỏ, nếu không có thì dùng `overlay`),
  `background`, `logo`, `texts`, `textColor` (đổi màu tất cả `texts` cho hợp nền tối), `showBrand`.
- **Được ghi đè** `canvas`, `slots`, `paper`, `noRotate`, `cut2inch`, `qr`, `textGroup` (xem `SPEC-KHUNG-01-SAVE-THE-DATE.md` mục 5),
  miễn số ảnh khác nhau dùng trong slots = `captureCount` (slots thừa lặp `i % captureCount`).
  **KHÔNG được ghi đè** `captureCount`, `select` — khách đã chụp xong trước khi chọn khung.
  Mọi chỗ đọc `canvas`/`noRotate`/máy in phải dùng `effectiveMode()`.
- Mode nào không có `frames` hoặc chỉ có 1 khung → **ẩn** nút "Chọn khung".
- Mode GIF / BOOM / video → ẩn nút (không áp dụng).
- Nếu PNG không tải được → bỏ qua khung đó trong list (hoặc hiện mờ), không làm crash; log `console.warn`.

Tạm thời có thể khai báo khung mẫu trỏ tới file PNG chưa tồn tại; hoặc dùng `scripts/make-frames.py` để sinh thêm
vài biến thể màu cho từng mode (cùng toạ độ ô). Tên file gợi ý: `C:\YoungBooth-Frames\<modeId>-<frameId>.png`.

## 3. State

Trong `state` (app.js) thêm `frameId: null`.
- Khi khách chọn mode mới / bắt đầu lượt mới (chỗ đang reset `state.rawFrames = []; state.captured = null; ...`, ~dòng 357)
  → reset `state.frameId = null` (= dùng khung mặc định, tức `frames[0]`).
- "Chụp lại" vẫn giữ nguyên `state.frameId` đã chọn trong lượt đó (khách đã thích khung đó rồi).

Hàm helper:

```js
// Trả về mode đã áp khung khách chọn (không sửa object gốc trong config).
function effectiveMode() {
  const m = state.mode;
  const list = Array.isArray(m.frames) ? m.frames : [];
  const fr = list.find((f) => f.id === state.frameId) || list[0];
  if (!fr) return m;
  const out = { ...m, overlay: fr.overlay };
  ['background', 'logo', 'texts', 'showBrand', 'canvas', 'slots', 'paper', 'noRotate', 'cut2inch', 'qr', 'textGroup'].forEach((k) => { if (fr[k] !== undefined) out[k] = fr[k]; });
  if (fr.textColor && out.texts) out.texts = out.texts.map((t) => ({ ...t, color: fr.textColor }));
  return out;
}
```

Sửa `composePhoto()` (~dòng 934): chỗ đang dùng `state.mode` để ghép (`if (m.slots && m.canvas) return composeTemplate(m);`)
→ lấy `const m = effectiveMode();`. `composeTemplate(m)` giữ nguyên logic.
Lưu ý `drawFrameTexts(ctx, m)` dùng `m.id` để đọc chữ khách đã sửa trong localStorage (`booth.frameText`) —
vì `effectiveMode()` giữ nguyên `id` của mode nên chữ đã sửa vẫn dùng chung cho mọi khung của mode đó. Giữ như vậy.

## 4. Giao diện

### 4.1 Nút
Trong `index.html`, khối `.result-buttons` của `#screen-result`, thêm nút **ngay trước** nút In:

```html
<button class="btn-secondary" id="btn-frame">🖼️ Chọn khung</button>
```

Trong `showResult(out)` (~dòng 660): thêm `'#btn-frame'` vào mảng `imgOnly` để ẩn khi là video,
và ẩn thêm khi `!(state.mode.frames && state.mode.frames.length > 1)`.

### 4.2 Bảng chọn khung (modal / bottom sheet)
Thêm modal mới giống phong cách `share modal` đang có:

```html
<div class="modal" id="frame-picker">
  <div class="modal-card">
    <h3 id="frame-picker-title">Chọn khung — Nhật Ký</h3>
    <div class="frame-grid" id="frame-grid"></div>
    <button class="btn-ghost" id="btn-frame-close">Đóng</button>
  </div>
</div>
```

- Tiêu đề: `Chọn khung — ${state.mode.name}` (vd "Chọn khung — Ngọt Ngào").
- Mỗi ô trong `#frame-grid`: ảnh preview + tên khung bên dưới. Khung đang dùng có viền nổi bật + dấu ✓.
- **Preview nên là ẢNH THẬT của khách trong khung đó** (đẹp & dễ chọn nhất): với mỗi khung, gọi
  `composeTemplate()` với mode đã áp khung đó, xuất `toDataURL('image/jpeg', 0.6)` cỡ nhỏ (có thể vẽ ra canvas
  thu nhỏ ~300px cạnh dài). Tạo lần lượt (không chặn UI): hiện `thumb`/`overlay` trước, rồi thay bằng preview thật khi xong.
  Cache preview theo `frameId` trong lượt hiện tại; xoá cache khi đổi filter, bật/tắt làm đẹp, hoặc chụp lại.
- Tỉ lệ ô preview theo `canvas` của mode (dọc 2:3 cho A/C/F, ngang 3:2 cho B/D).
- Màn hình cảm ứng: ô to, chạm dễ (tối thiểu ~180px), grid tự xuống dòng, cuộn được nếu nhiều khung.
- Chạm ra ngoài hoặc nút "Đóng" → đóng modal, không đổi gì.

### 4.3 Khi chọn một khung
1. `state.frameId = frame.id`
2. Đóng modal.
3. Gọi `rerenderResult()` (đã có, ~dòng 723) — hàm này gọi `composeOutput()` → ghép lại và cập nhật `#result-img`.
   Đổi text processing thành "Đang đổi khung…" khi gọi từ đây (thêm tham số tuỳ chọn cho message).
4. `rerenderResult()` đã set `state.sessionAnim = null`; thêm `state._shareRes = null` để QR/upload dùng ảnh khung mới.

## 5. Tương tác với tính năng khác
- **Bộ lọc màu / làm đẹp**: giữ nguyên khi đổi khung (filter được áp trong `composeTemplate`).
- **Sticker**: sticker editor dán sticker lên ảnh kết quả. Nếu khách đã dán sticker rồi mới đổi khung → hiện xác nhận
  "Đổi khung sẽ xoá sticker đã dán. Tiếp tục?"; đồng ý thì xoá sticker (dùng logic `#se-clear`) rồi đổi khung.
  (Hoặc nếu dễ: lưu toạ độ sticker và vẽ lại lên ảnh mới — chỉ làm khi cùng kích thước canvas, mà trong cùng mode luôn cùng.)
- **In**: nút In dùng `state.lastOutput` → tự in đúng khung mới. Khổ giấy / `noRotate` không đổi vì cùng mode.
- **Nhật Ký (C)**: 8 slots (2 dải lặp `i % 4`) — khung mới phải giữ đúng 8 ô, 2 dải giống nhau.
- **QR góc ảnh** (`drawGalleryQR`) vẫn vẽ sau overlay như hiện tại.

## 6. Tiêu chí nghiệm thu
- [ ] Chụp Nhật Ký (4 ảnh) → bấm "Chọn khung" → chỉ thấy các khung Nhật Ký, khung đang dùng được đánh dấu.
- [ ] Chụp Ngọt Ngào (2 ảnh) → chỉ thấy khung Ngọt Ngào; tương tự Khoảnh Khắc, Chia Đôi, Dịu Dàng.
- [ ] Chọn khung khác → ảnh ghép lại trong ~1–2s, ảnh khách giữ nguyên, đúng vị trí ô, filter giữ nguyên.
- [ ] In ra đúng khung vừa chọn, đúng khổ (6×4 ngang cho B/D không bị xoay sai).
- [ ] QR chia sẻ trỏ tới ảnh khung mới (không phải ảnh cũ).
- [ ] Mode chỉ có 1 khung, GIF, Boomerang, video → không thấy nút.
- [ ] Lượt khách mới → về lại khung mặc định.
- [ ] PNG khung bị thiếu → không crash, khung đó không hiện hoặc hiện mờ.
- [ ] Không phải build lại: thêm khung mới chỉ cần thêm PNG + 1 dòng vào `frames` trong `config.js`.

## 7. Cập nhật tài liệu
Thêm mục "Nhiều khung cho cùng một kiểu chụp (`frames`)" vào `FRAMES_GUIDE.md`, hướng dẫn: kích thước PNG theo mode,
giữ nguyên toạ độ slots, cách đặt tên file, ví dụ khai báo.

---

# PHẦN 5 — (nguyên văn từ `SPEC-KHUNG-01-SAVE-THE-DATE.md`)

## SPEC — Bộ khung #01 "Save The Date" (trắng tối giản, thương hiệu YOUNG BOOTH)

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

---

# PHẦN 6 — (nguyên văn từ `SPEC-KHUNG-02-CLOVER-SAGE.md`)

## SPEC — Bộ khung #02 "Cỏ Bốn Lá – Xanh Sage" (thương hiệu YOUNG BOOTH)

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

---

# PHẦN 7 — (nguyên văn từ `SPEC-KHUNG-03-CRYSTAL-WHITE.md`)

## SPEC — Bộ khung #03 "Pha Lê Trắng" (lưới ảnh đen-trắng + đá pha lê, thương hiệu YOUNG BOOTH)

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

---

# PHẦN 8 — (nguyên văn từ `SPEC-KHUNG-04-BLACK-STARS.md`)

## SPEC — Bộ khung #04 "Ngôi Sao Đen" (thương hiệu YOUNG BOOTH)

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

---

# PHẦN 9 — (nguyên văn từ `SPEC-KHUNG-05-GOLD-SILVER-STARS.md`)

## SPEC — Bộ khung #05 "Sao Kim Tuyến" (viền mảnh + sao vàng/bạc, thương hiệu YOUNG BOOTH)

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

---

# PHẦN 10 — (nguyên văn từ `SPEC-KHUNG-06-EVENT-ORIENTATION.md`)

## SPEC — Bộ khung #06 "Sự kiện – Orientation Day" (khung SỰ KIỆN theo khách hàng, có thương hiệu YOUNG BOOTH)

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

---

# PHẦN 11 — (nguyên văn từ `SPEC-KHUNG-07-NIGHT-SKY.md`)

## SPEC — Bộ khung #07 "Bầu Trời Sao" (nền đen, sao trắng lấp lánh, thương hiệu YOUNG BOOTH)

> Bản nháp, sẽ gộp vào file tổng hợp cuối. Hạ tầng chung: `SPEC-CHON-KHUNG.md` + mục 1, 5 của `SPEC-KHUNG-01`.
> Ảnh mẫu: `docs/frames-ref/khung-07-night-sky.png` (mockup: bỏ nghiêng/bóng). Ô hồng = chỗ đặt ảnh.
> "Seoulday.booth" → THAY bằng **"Young Booth"**.
> Bố cục giống bộ #03/#04 → **dùng lại slots** (xem bảng).

## 0. Xếp khung (theo quy ước đã chốt)

| # | Vị trí | Mẫu gốc | Mode | id | Slots dùng lại |
|---|---|---|---|---|---|
| 1 | Trái (dải dọc) | Dải 2×6, 4 ảnh, chữ dưới-phải | **Nhật Ký (C)** | `C-night-sky` | = `C-crystal-white` (SPEC-03 mục 3) |
| 2 | Giữa (tờ dọc) | Lưới 2×3 = 6 ảnh | **Dịu Dàng (F)** — đổi thành **2×2** | `F-night-sky-violet` | = `F-crystal-white` (SPEC-03 mục 5) |
| 3 | Phải (tờ dọc) | Lưới 2×2, chữ dưới-phải | **Dịu Dàng (F)** | `F-night-sky` | = `F-crystal-white` |
| 4 | Dưới (dải ngang) | Dải 6×2, 4 ảnh, chữ **trên-trái** | **Nhật Ký (C) bản ngang** | `C-night-sky-wide` | = `C-black-stars-wide` (SPEC-04 mục 3, chữ ở trên) |

Phân biệt #2/#3 (cùng 2×2):
- #3 **"Bầu Trời Sao"**: nền **đen** `#0b0b0d`.
- #2 **"Bầu Trời Sao – Tím Đêm"**: nền **tím than đêm** gradient `#1b1035` (trên) → `#0d0a1f` (dưới), thêm vài sao hơi ánh tím `#d9ccff`.

## 1. Phong cách

- **Nền đen** phủ toàn tờ, khe giữa các ô màu đen 12–14px (ô ảnh như dán trên nền đêm). Ô vuông góc.
- **Sao trắng lấp lánh** dày đặc trên viền đen:
  - Trộn 2 loại: sao 5 cánh (60%) và **sao lấp lánh 4 cánh** ✦ (40%), trắng `#ffffff`.
  - Mỗi sao có **quầng sáng** (halo): vẽ bản trắng alpha 35% blur 4–8px phía sau → cảm giác phát sáng.
  - Kích thước 6–30px (đa số 8–16), mật độ cao: ~50–70 sao/tờ 4×6, ~25–35/dải; dày hơn ở dải đen dưới cùng.
  - Một số sao đè mép ô ảnh ≤ 10px; không vào giữa ảnh. Seed cố định theo id.
  - Vẽ vector trong script (dùng lại `draw_star`/`scatter_stars` của bộ #04 + hàm `draw_twinkle` 4 cánh + glow).
- **Thương hiệu**: "Young Booth" viết tay **nét mảnh, màu trắng** `#f5f5f5` (Great Vibes/Pinyon Script), có 1 ✦ nhỏ phía trước chữ, cố định trong PNG.
- **Chữ động**: không có.
- QR ≥ 110px; ô QR có nền trắng bo góc (hành vi sẵn của `drawGalleryQR`) → nổi rõ trên nền đen.

## 2. Vị trí chữ thương hiệu & QR

| Khung | "Young Booth" | QR |
|---|---|---|
| `C-night-sky` | cỡ ~52, căn **phải** x 560 & 1160, baseline y 1700 | 110 tại `{x: 40, y: 1660}`, `{x: 640, y: 1660}` (góc dưới-**trái**, vì chữ ở phải) |
| `F-night-sky`, `F-night-sky-violet` | cỡ ~80, căn **phải** x 1160, baseline y 1650 | 120 tại `{x: 40, y: 1640}` (góc dưới-trái) |
| `C-night-sky-wide` | cỡ ~44, căn **trái** x 40, baseline y 66 & 666 | 110 đè góc dưới-phải ảnh cuối: `{x: 1660, y: 462}`, `{x: 1660, y: 1062}` |

## 3. Khai báo
```js
// mode C → frames: + { id: 'C-night-sky', name: 'Bầu Trời Sao', background: '#0b0b0d', cut2inch: true, ... },
//                    { id: 'C-night-sky-wide', name: 'Bầu Trời Sao – Ngang', background: '#0b0b0d', cut2inch: true, canvas: { w: 1800, h: 1200 }, ... }
// mode F → frames: + { id: 'F-night-sky', name: 'Bầu Trời Sao', background: '#0b0b0d', ... },
//                    { id: 'F-night-sky-violet', name: 'Bầu Trời Sao – Tím Đêm', background: '#140d2a', ... }
// Tất cả: logo: null, texts: [], showBrand: false, overlay/thumb = C:/YoungBooth-Frames/<id>.png
```

## 4. PNG overlay
Xuất 4 PNG + thumb: nền đen (hoặc tím đêm gradient), lỗ trong suốt đúng slots, sao trắng + glow (seed cố định), "✦ Young Booth" trắng.
Lưu ý PNG nền tối: kiểm tra mép lỗ không bị viền sáng do khử răng cưa (dùng mask cứng hoặc nới lỗ 1px vào trong).

## 5. Nghiệm thu
- [ ] Nhật Ký → list có "Bầu Trời Sao" (dọc) và "Bầu Trời Sao – Ngang" (chữ ở trên).
- [ ] Dịu Dàng → list có "Bầu Trời Sao" (đen) và "Bầu Trời Sao – Tím Đêm".
- [ ] In ra nền đen đều màu, sao có quầng sáng nhẹ; QR quét được.
- [ ] Không còn chữ "Seoulday".

---

# PHẦN 12 — (nguyên văn từ `SPEC-KHUNG-08-QUOC-KHANH.md`)

## SPEC — Bộ khung #08 "Quốc Khánh 02.09" (khung DỊP LỄ, thương hiệu YOUNG BOOTH)

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

---

# PHẦN 13 — (nguyên văn từ `SPEC-KHUNG-09-17-LE-HOI.md`)

## SPEC — Bộ khung #09 → #17: Quốc Khánh 2/9 (8 bộ) + Trung Thu (1 bộ)

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

---
