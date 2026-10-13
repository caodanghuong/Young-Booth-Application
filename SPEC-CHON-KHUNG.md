# SPEC — Nút "Chọn khung" ở màn kết quả (trước khi in)

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
