# SPEC — LUỒNG SỰ KIỆN (Event Mode) do admin bật/tắt

> Gửi Claude Code trong VS Code. Làm SAU khi nút "Chọn khung" (`SPEC-TONG-HOP-KHUNG.md`) đã chạy.
> File liên quan: `settings.js` (booth-settings.json), `server.js` (webadmin `/admin`), `main.js` (IPC), `preload.js`,
> `renderer/config.js`, `renderer/app.js`, `renderer/index.html`, `renderer/styles.css`.

## 0. Ý tưởng — chủ app đã chốt

- **Mặc định**: booth chạy **luồng thường** (Normal) như hiện tại. Không đổi gì.
- Admin có thể **tạo sẵn NHIỀU hồ sơ sự kiện** (vd "Đám cưới Thư & Hsun", "Orientation Day Greenwich"…), mỗi sự kiện có
  **giao diện riêng + bộ khung riêng**. Khi dùng thì **chọn 1 sự kiện và bật "Luồng sự kiện"**.
- Khi luồng sự kiện **BẬT**: booth **CHỈ chạy luồng sự kiện** (giao diện + khung của sự kiện đó). Khách không thấy luồng thường.
  Tắt đi → quay về luồng thường.
- **Thanh toán**: mỗi sự kiện có công tắc riêng, **mặc định TẮT** (ban tổ chức trả tiền, khách chụp miễn phí). Admin bật lại nếu cần.
- **Các bước chụp giống hệt luồng thường**; chỉ khác **giao diện**, **kiểu chụp** và **danh sách khung**. Khung sự kiện chủ app sẽ bổ sung dần
  → thêm khung mới chỉ cần thả PNG + khai báo, KHÔNG sửa code.
- **Luồng sự kiện chỉ có 3 kiểu chụp RIÊNG** (không dùng 5 kiểu A/B/C/D/F của luồng thường, không có GIF/Boomerang),
  **tất cả in tờ 4×6 DỌC (1200×1800), không xoay, không cắt**:

| Kiểu sự kiện | id | Số ảnh chụp | Bố cục mặc định |
|---|---|---|---|
| Khung 1 ảnh | `EV1` | 1 | 1 ảnh lớn + dải chữ dưới |
| Khung 2 ảnh | `EV2` | 2 | 2 ảnh ngang **chồng nhau** + dải chữ dưới |
| Khung 3 ảnh | `EV3` | 3 | 1 ảnh lớn trên + 2 ảnh nhỏ dưới + dải chữ dưới (khung riêng được đổi bố cục, vd 3 ảnh chồng) |

## 1. So sánh 2 luồng

```
LUỒNG THƯỜNG (eventMode tắt)                   LUỒNG SỰ KIỆN (eventMode bật, activeEventId = X)
───────────────────────────                    ─────────────────────────────────────────────────
Màn chờ YOUNG BOOTH (promo, bảng giá…)          Màn chờ SỰ KIỆN X (nền/logo/tên sự kiện/lời chào)
  ↓ BẮT ĐẦU                                       ↓ nút của sự kiện (vd "CHỤP ẢNH")
Chọn kiểu chụp (tất cả mode)                    Chọn kiểu chụp (CHỈ các mode sự kiện X cho phép;
                                                  nếu chỉ có 1 mode → BỎ QUA màn này)
  ↓                                               ↓
Thanh toán (theo cài đặt chung)                 Thanh toán CHỈ KHI sự kiện X bật payment (mặc định bỏ qua)
  ↓                                               ↓
Chụp → Xem lại → Ghép                           Chụp → Xem lại → Ghép  (y hệt)
  ↓                                               ↓
Kết quả: khung mặc định của mode                Kết quả: khung MẶC ĐỊNH CỦA SỰ KIỆN cho mode đó
  ↓ "Chọn khung"                                  ↓ "Chọn khung"
List = frames[] của mode (lọc hidden)           List = CHỈ khung sự kiện X gán cho mode đó
  ↓                                               ↓
In / QR / Kết thúc → màn chờ thường             In / QR / Kết thúc → về MÀN CHỜ SỰ KIỆN X
```
Hết giờ chờ (idle reset) cũng quay về màn chờ của luồng đang bật.

## 2. Dữ liệu

### 2.0 Kiểu chụp sự kiện — `renderer/config.js`
Thêm mảng **`eventModes`** (cùng cấp `modes`, cùng schema mode ảnh hiện có). Mỗi kiểu có 1 **khung mặc định trơn** (nền trắng,
tên sự kiện + "YOUNG BOOTH" vẽ bằng chữ) để luôn chạy được khi sự kiện chưa có khung riêng:

```js
eventModes: [
  { id: 'EV1', name: 'Khung 1 ảnh', icon: '🖼️', desc: '4×6" · 1 ảnh', kind: 'photo',
    captureCount: 1, select: 1, canvas: { w: 1200, h: 1800 }, paper: '4x6', noRotate: true, background: '#ffffff',
    slots: [ { x: 60, y: 60, w: 1080, h: 1440, radius: 0 } ],                      // dải chữ y 1500→1800
  },
  { id: 'EV2', name: 'Khung 2 ảnh', icon: '🎞️', desc: '4×6" · 2 ảnh', kind: 'photo',
    captureCount: 2, select: 2, canvas: { w: 1200, h: 1800 }, paper: '4x6', noRotate: true, background: '#ffffff',
    slots: [ { x: 50, y: 50, w: 1100, h: 650 }, { x: 50, y: 740, w: 1100, h: 650 } ], // dải chữ y 1390→1800
  },
  { id: 'EV3', name: 'Khung 3 ảnh', icon: '🧩', desc: '4×6" · 3 ảnh', kind: 'photo',
    captureCount: 3, select: 3, canvas: { w: 1200, h: 1800 }, paper: '4x6', noRotate: true, background: '#ffffff',
    slots: [ { x: 50, y: 50, w: 1100, h: 700 },                                     // ảnh lớn trên
             { x: 50, y: 774, w: 538, h: 560 }, { x: 612, y: 774, w: 538, h: 560 } ], // 2 ảnh nhỏ dưới; dải chữ y 1334→1800
  },
],
```
- Tên hiển thị cho khách đổi được theo sự kiện (mục 2.2 `modeLabels`), id giữ nguyên.
- Mọi khung của `EV*` là **1200×1800 dọc** → in thẳng 4×6, không xoay (`effectiveMode()` đã xử lý), không dùng máy in 2-inch cut.
- Khung riêng của EV3 được ghi đè `slots` (vd 3 ảnh chồng: `{x:50,y:50,w:1100,h:440}`, `{x:50,y:510,...}`, `{x:50,y:970,...}`) miễn đủ 3 ô.

### 2.1 Thư viện khung sự kiện — `renderer/config.js`
Thêm mảng **`eventFrames`** (cùng cấp `modes`). Mỗi phần tử **cùng schema với phần tử `frames[]`** đã làm ở nút Chọn khung
(overlay, thumb, background, slots, texts, textGroup, qr…), thêm bắt buộc **`mode`** = `EV1` | `EV2` | `EV3`:

```js
eventFrames: [
  // ví dụ — khung Orientation bản dọc 2 ảnh (#06) chuyển sang đây làm khung EV2
  { id: 'EV-EV2-orientation', mode: 'EV2', name: 'Orientation Day', overlay: 'file:///C:/YoungBooth-Frames/events/orientation/EV2-orientation.png', ... },
  // khung 1 ảnh / 3 ảnh của chủ app thêm dần vào đây
],
```
- Quy ước id: `EV-<EV1|EV2|EV3>-<tên>`. File PNG/thumb để trong **`C:\YoungBooth-Frames\events\<tên bộ>\`**.
- Khung trong `eventFrames` **KHÔNG BAO GIỜ** hiện ở luồng thường.
- Sự kiện được **dùng lại khung thường** bằng id **nếu tương thích**: canvas 1200×1800 dọc và số ảnh khác nhau trong slots = số ảnh của kiểu EV.
  Hiện có: `A-clover-sage` → dùng được cho **EV1**; `B-std-white` (Save The Date dọc) → dùng được cho **EV2**. Khung không tương thích → không hiện trong lựa chọn của webadmin.
- Viết hàm `getFrameById(id)`: tìm trong `modes[].frames`, `eventFrames`. Tìm không thấy → bỏ qua + `console.warn`.
- **Dọn**: `B-event-orientation` → chuyển thành `EV-EV2-orientation`. `C-event-orientation` (dải 4 ảnh) **không hợp luồng sự kiện** → bỏ khỏi app.
  Công tắc "Khung sự kiện Orientation Day" cũ trong Cài đặt → bỏ, thay bằng hồ sơ sự kiện mẫu `orientation` (mục 2.2).
  Công tắc khung **dịp lễ** (Quốc Khánh, Trung Thu) GIỮ NGUYÊN cho luồng thường.

### 2.2 Hồ sơ sự kiện — `booth-settings.json` (qua `settings.js`, sửa được từ webadmin + Cài đặt trong app)
Thêm vào `DEFAULTS` của `settings.js`:

```js
eventMode: {
  enabled: false,          // false = luồng thường (MẶC ĐỊNH)
  activeEventId: '',       // id sự kiện đang chạy khi enabled = true
},
events: [
  {
    id: 'orientation',                     // a-z0-9-, duy nhất
    name: 'Orientation Day – Greenwich',   // tên hiển thị cho admin
    theme: {
      background: '#3fb6e8',               // màu nền màn chờ/màn chọn kiểu
      backgroundImage: '',                 // tuỳ chọn: file:///C:/YoungBooth-Frames/events/orientation/home.jpg
      accent: '#1d3a8a',                   // màu nút chính
      textColor: '#ffffff',
      logo: '',                            // tuỳ chọn: logo sự kiện (file:///…)
      font: '',                            // tuỳ chọn: 1 trong các font đã nhúng
    },
    home: {
      title: 'ORIENTATION DAY',            // chữ lớn màn chờ
      subtitle: 'Future Starts Here',      // dòng phụ
      welcome: 'Chạm để chụp ảnh lưu niệm',
      buttonLabel: 'CHỤP ẢNH',
      showYoungBoothBrand: true,           // dòng nhỏ "Powered by YOUNG BOOTH" ở chân màn chờ
    },
    modes: ['EV1', 'EV2', 'EV3'],          // CHỈ chọn trong EV1/EV2/EV3 (mặc định cả 3; thứ tự = thứ tự hiển thị). Chỉ 1 kiểu → bỏ màn chọn kiểu.
    modeLabels: { EV1: 'Khung 1 ảnh', EV2: 'Khung 2 ảnh', EV3: 'Khung 3 ảnh' }, // tên hiện cho khách (đổi được)
    frames: {                              // id khung cho từng kiểu (từ eventFrames hoặc khung thường tương thích)
      EV1: [],
      EV2: ['EV-EV2-orientation'],
      EV3: [],
    },
    defaultFrame: { EV2: 'EV-EV2-orientation' }, // trống → phần tử đầu của frames[kiểu]; frames trống → khung mặc định trơn của kiểu
    type: 'wedding',                       // loại sự kiện: wedding | engagement | birthday | corporate | custom (mục 9)
    content: {                             // NỘI DUNG CHỮ TRÊN KHUNG — admin nhập, áp cho MỌI khung của sự kiện (mục 9)
      name1: 'Minh Thư', connector: '&', name2: 'Kuan Hsun',
      title: '', subtitle: 'SAVE THE DATE', date: '09.07.2026', place: 'Saigon, Vietnam',
      message: '', hashtag: '#ThuHsun2026', custom1: '', custom2: '',
    },
    textStyle: {                           // kiểu chữ cho khung trơn mặc định + khung cho phép đổi (mục 9.4)
      nameFont: 'script', bodyFont: 'serif', color: '#1a1a1a', accent: '#b08d57', scale: 1,
    },
    payment: { enabled: false },           // MẶC ĐỊNH TẮT. true → dùng đúng cấu hình thanh toán chung (giá, VietQR, SePay…)
    price: { EV1: 0, EV2: 0, EV3: 0 },     // chỉ dùng khi payment.enabled (0 = lấy giá chung)
    print: { copies: 1, maxPrintsPerSession: 2 },  // giới hạn số lần bấm In mỗi lượt (0 = không giới hạn)
    gallery: { folder: 'young-booth/events/orientation', public: false },
    schedule: { startAt: '', endAt: '' },  // tuỳ chọn (ISO, giờ máy): ngoài khung giờ → tự về luồng thường
    createdAt: '', updatedAt: '',
  },
],
```

Quy tắc:
- `eventMode.enabled = true` nhưng `activeEventId` không tồn tại / sự kiện không có mode nào hợp lệ → **chạy luồng thường** + cảnh báo đỏ trong Cài đặt/webadmin.
- Mode trong `modes` mà không có khung nào hợp lệ → dùng khung mặc định của mode đó (luồng thường) để không bao giờ kẹt.
- `schedule` (nếu điền): kiểm tra mỗi khi về màn chờ + mỗi phút; ngoài khoảng → coi như tắt (không đổi giá trị `enabled`).

## 3. Lấy "chế độ đang chạy" trong renderer

Thêm 1 hàm duy nhất, mọi chỗ khác đọc qua nó:
```js
// Trả về null (luồng thường) hoặc object sự kiện đang chạy đã được kiểm tra hợp lệ.
function activeEvent() { ... dựa trên settings.eventMode + settings.events + schedule ... }
```
- Renderer lấy settings qua IPC sẵn có (hoặc thêm `window.booth.settings.get()` + sự kiện `settings:changed` trong `preload.js`/`main.js`
  để webadmin lưu xong thì app cập nhật ngay, không cần khởi động lại).
- **Đổi chế độ khi đang có khách**: KHÔNG đổi giữa chừng. Ghi nhận thay đổi, áp dụng khi lượt hiện tại kết thúc (về màn chờ).
  Nếu đang ở màn chờ → áp dụng ngay.

Các chỗ phải rẽ nhánh theo `activeEvent()`:

| Chỗ | Luồng thường | Luồng sự kiện |
|---|---|---|
| Màn chờ (`#screen-home`) | như hiện tại | Màn chờ sự kiện (mục 4.1) |
| Nút bắt đầu (`#btn-start`) | → chọn kiểu | → chọn kiểu sự kiện, hoặc thẳng màn chụp nếu chỉ 1 mode |
| `buildModeGrid()` | `modes` (A/B/C/D/F + GIF/BOOM) | CHỈ `eventModes` có trong `event.modes` (EV1/EV2/EV3), tên theo `modeLabels`; KHÔNG GIF/Boomerang |
| Số ảnh chụp | theo mode | EV1 = 1, EV2 = 2, EV3 = 3 |
| Khổ in | theo mode | luôn 4×6 dọc, không xoay, máy in thường |
| Thanh toán | cấu hình chung | chỉ khi `event.payment.enabled` |
| Khung mặc định khi ghép | `frames[0]` của mode | `event.defaultFrame[mode]` |
| List "Chọn khung" | `frames[]` mode (lọc hidden) | `event.frames[mode]` → `getFrameById` |
| Chữ động trên khung | localStorage `booth.frameText` | `event.content` theo bộ khoá chuẩn (mục 9) — KHÔNG đọc localStorage |
| In | không giới hạn | đếm số lần In mỗi lượt, đủ `maxPrintsPerSession` thì khoá nút In + báo "Đã in đủ số bản của sự kiện" |
| Upload gallery / QR | folder chung | `event.gallery.folder`, gắn tag `event:<id>`; `public:false` → không đẩy lên gallery chung |
| Idle reset / Kết thúc | về màn chờ thường | về màn chờ sự kiện |
| Tên file ảnh lưu máy | như cũ | thêm tiền tố `<eventId>_` và lưu vào `captures/events/<eventId>/` |

Gợi ý code: `effectiveMode()` (đã có) nhận thêm danh sách khung từ `framesForCurrentFlow(modeId)`:
```js
function framesForCurrentFlow(modeId) {
  const ev = activeEvent();
  if (!ev) return visibleFramesOfMode(modeId);                 // luồng thường (đã có)
  const ids = (ev.frames && ev.frames[modeId]) || [];
  const list = ids.map(getFrameById).filter(Boolean);
  return list.length ? list : [defaultFrameOfMode(modeId)];
}
```

## 4. Giao diện luồng sự kiện

Dùng lại các màn hình hiện có (không nhân đôi HTML); chỉ đổi nội dung + theme bằng class `body.event-mode` và CSS variables:
```css
body.event-mode { --ev-bg: …; --ev-accent: …; --ev-text: …; }   /* gán từ event.theme bằng JS */
```

### 4.1 Màn chờ sự kiện
- Nền `theme.background` (+ `backgroundImage` phủ kín, `object-fit: cover`), logo sự kiện ở trên, `home.title` to, `home.subtitle`, `home.welcome`.
- 1 nút lớn `home.buttonLabel` màu `theme.accent`.
- ẨN các thẻ của luồng thường: Ưu đãi & Chính sách, Bảng giá, Sự kiện fanclub, Mẫu khung ảnh.
- Thay bằng **dải xem trước khung của sự kiện** (thumb các khung trong `event.frames`, cuộn ngang tự động) — để khách thấy khung đẹp và bấm chụp.
- Chân màn hình: "Powered by YOUNG BOOTH" nhỏ nếu `showYoungBoothBrand`.
- Góc giữ 3 giây + PIN để vào Cài đặt vẫn hoạt động như cũ.

### 4.2 Chọn kiểu chụp (sự kiện)
- Tối đa **3 thẻ**: Khung 1 ảnh · Khung 2 ảnh · Khung 3 ảnh (theo `event.modes` + `modeLabels`), xếp 1 hàng, thẻ to dễ chạm.
- Ảnh đại diện mỗi thẻ = thumb khung mặc định của sự kiện cho kiểu đó; dưới thẻ ghi "1 ảnh" / "2 ảnh" / "3 ảnh".
- Tiêu đề màn hình dùng tên sự kiện. Chỉ 1 kiểu → không hiện màn này.

### 4.3 Chụp → Xem lại → Kết quả
- Giữ nguyên logic. Đổi màu nút/nhấn theo `theme.accent`.
- Màn kết quả: nút **"🖼️ Chọn khung"** chỉ hiện khi `event.frames[mode]` có ≥ 2 khung; modal tiêu đề "Chọn khung — <tên mode> · <tên sự kiện>".
- Nút In hiện số bản còn lại nếu có giới hạn: "🖨️ In ảnh (còn 1)".

## 5. Admin

### 5.1 Webadmin (`/admin` trong `server.js`) — nơi chính để cấu hình
Thêm mục **"Luồng sự kiện"**:
1. **Công tắc lớn**: "Bật luồng sự kiện" + **dropdown chọn sự kiện**. Hiện trạng thái rõ: "ĐANG CHẠY: Luồng thường" / "ĐANG CHẠY: Sự kiện <tên>".
2. **Danh sách sự kiện**: Thêm mới · Nhân bản · Sửa · Xoá (xác nhận trên trang, không dùng `confirm()`). Không cho xoá sự kiện đang chạy.
3. **Form sửa sự kiện**: tên, id (tự sinh từ tên, sửa được khi tạo mới), theme (màu + đường dẫn ảnh nền/logo), chữ màn chờ,
   chọn kiểu chụp (3 checkbox EV1/EV2/EV3 + ô đổi tên hiển thị, kéo để đổi thứ tự), **chọn khung cho từng kiểu** (lưới thumb từ `eventFrames`
   + khung thường TƯƠNG THÍCH, tick chọn, chọn 1 làm mặc định), **loại sự kiện + nội dung chữ + kiểu chữ** (mục 9),
   thanh toán bật/tắt (+ giá từng kiểu), giới hạn in, folder gallery, lịch chạy.
4. **Xem trước**: ảnh thumb khung mặc định của từng mode với chữ đã nhập.
5. Lưu → ghi `booth-settings.json` → báo app (IPC/`settings:changed`) → app áp dụng theo quy tắc mục 3.
Webadmin chạy trên máy khác cần đọc danh sách khung + thumb: thêm route `GET /admin/frames` trả `{ id, mode, name, thumbUrl, textFields }`
và route phục vụ ảnh thumb từ `C:\YoungBooth-Frames` (chỉ đọc, chỉ đuôi .png/.jpg, chặn `..`), có `adminGuard`.

### 5.2 Cài đặt trong app (giữ góc 3s + PIN) — để nhân viên đổi nhanh tại chỗ
- Mục "Luồng sự kiện": công tắc bật/tắt + dropdown chọn sự kiện + dòng trạng thái.
- **Sửa nhanh nội dung chữ** của sự kiện đang chạy (các ô của mục 9, có xem trước) — để nhân viên sửa lỗi chính tả ngay tại chỗ.
- Sửa các phần khác của sự kiện → làm ở webadmin (hiện link `http://<ip máy>:<port>/admin`).

## 6. Thêm khung sự kiện mới (chủ app sẽ làm nhiều lần) — viết vào `FRAMES_GUIDE.md`
1. Thiết kế PNG **1200×1800 dọc**, ô ảnh **trong suốt** đúng slots mặc định của kiểu (mục 2.0) — 1, 2 hoặc 3 ô —
   hoặc toạ độ riêng (khai báo `slots` trong khung).
2. Chép vào `C:\YoungBooth-Frames\events\<tên bộ>\` (kèm `*-thumb.png` rộng ~300px).
3. Thêm 1 dòng vào `eventFrames` trong `config.js` (id `EV-<EV1|EV2|EV3>-<tên>`, mode, name, overlay, thumb, slots/texts nếu khác chuẩn).
4. Vào webadmin → sự kiện → tick khung mới cho mode tương ứng → Lưu. **Không cần build lại.**

(Giai đoạn sau, tuỳ chọn: cho upload PNG khung ngay trong webadmin và lưu khai báo khung vào `booth-settings.json` thay vì `config.js`.)

## 7. Không được làm hỏng
- `eventMode.enabled = false` → app chạy **y hệt hiện tại** (màn chờ, thẻ promo/bảng giá, thanh toán, khung, khung dịp lễ).
- Không đổi giữa lượt chụp của khách.
- Sự kiện thiếu/hỏng dữ liệu → tự rơi về luồng thường, không crash, không màn trắng.
- In vẫn đúng chiều theo `effectiveMode()` (khung dọc/ngang).

## 8. Nghiệm thu
- [ ] Mặc định (tắt) → mọi thứ như cũ.
- [ ] Webadmin: tạo sự kiện "Đám cưới Thư & Hsun" (EV1 + EV2 + EV3; EV1 dùng `A-clover-sage`, EV2 dùng `B-std-white`, EV3 để trống → khung trơn;
      chữ "Minh Thư"/"Kuan Hsun", thanh toán tắt), bật → app đổi sang màn chờ sự kiện trong ≤ 2s (nếu đang ở màn chờ).
- [ ] Màn chờ sự kiện không còn thẻ bảng giá/ưu đãi; có tên sự kiện + dải xem trước khung.
- [ ] Màn chọn kiểu chỉ có 3 thẻ: Khung 1 ảnh / 2 ảnh / 3 ảnh — không có Nhật Ký, Dịu Dàng…, không có GIF/Boomerang.
- [ ] Khung 3 ảnh → chụp đúng 3 tấm → không qua thanh toán → kết quả dùng khung mặc định sự kiện → "Chọn khung" chỉ hiện khung EV3 của sự kiện.
- [ ] Cả 3 kiểu in ra tờ 4×6 dọc đúng chiều, không bị cắt.
- [ ] Sự kiện chỉ có 1 mode → bấm nút là vào chụp luôn.
- [ ] Bật `payment.enabled` cho sự kiện → có bước thanh toán như luồng thường.
- [ ] `maxPrintsPerSession = 2` → in được 2 lần, lần 3 nút In khoá + thông báo.
- [ ] Bật sự kiện khi khách đang chụp → khách chụp xong lượt mới đổi.
- [ ] Đổi sang sự kiện khác (dropdown) → giao diện + khung đổi theo; tắt → về luồng thường.
- [ ] Xoá/đổi tên id sự kiện đang chạy bị chặn; `activeEventId` sai → chạy luồng thường + cảnh báo.
- [ ] Ảnh lưu vào `captures/events/<id>/`, gallery upload vào folder sự kiện.
- [ ] Thêm 1 khung mới theo mục 6 (không build lại) → tick trong webadmin → xuất hiện trong list "Chọn khung" của sự kiện.

## 9. NỘI DUNG CHỮ TRÊN KHUNG — cấu hình theo từng sự kiện

> Sự kiện có thể là **đám cưới, đám hỏi, sinh nhật, sự kiện doanh nghiệp/trường học…** → chữ trên khung phải do admin nhập
> cho từng sự kiện, KHÔNG cố định trong PNG. PNG khung sự kiện chỉ chứa hình/hoạ tiết + "YOUNG BOOTH"; mọi chữ nội dung vẽ động.

### 9.1 Bộ khoá chữ CHUẨN (dùng chung cho mọi khung sự kiện)

Mọi khung trong `eventFrames` chỉ được dùng các khoá sau trong `texts[].k` (để 1 nội dung nhập 1 lần áp cho mọi khung của sự kiện):

| Khoá | Ý nghĩa | Ví dụ cưới | Ví dụ đám hỏi | Ví dụ doanh nghiệp |
|---|---|---|---|---|
| `name1` | Tên người thứ nhất | Minh Thư | Ngọc Ánh | — |
| `connector` | Ký tự nối 2 tên | & | ♥ | — |
| `name2` | Tên người thứ hai | Kuan Hsun | Đức Hưng | — |
| `title` | Tiêu đề chính (khi không có 2 tên) | — | — | YEAR END PARTY 2026 |
| `subtitle` | Dòng phụ / tên nghi lễ | SAVE THE DATE | LỄ ĂN HỎI | Together We Grow |
| `date` | Ngày | 09.07.2026 | 20.12.2026 | 28.12.2026 |
| `place` | Địa điểm | Saigon, Vietnam | Tư gia nhà gái | GEM Center |
| `message` | Lời cảm ơn / lời chúc (nhiều dòng) | Cảm ơn bạn đã đến chung vui | … | … |
| `hashtag` | Hashtag | #ThuHsun2026 | #AnhHung | #YEP2026 |
| `custom1`, `custom2` | Dòng tự do | | | |

- Ô **trống → không vẽ dòng đó**. Khung trơn mặc định (mục 9.3) **tự dồn lại** các dòng còn lại cho cân (không để khoảng trống lẻ loi).
- `name1 + connector + name2` là **khối tên đôi**: chỉ vẽ khi có cả `name1` và `name2`; nếu chỉ có 1 tên → vẽ 1 tên, bỏ `connector`.
- Khối tên đôi và `title` loại trừ nhau trên khung trơn: có tên đôi → dùng tên đôi; không có → dùng `title`.
- `message` cho phép xuống dòng (Enter) và tự ngắt dòng theo bề rộng (`w`).

### 9.2 Loại sự kiện = bộ mẫu điền sẵn (preset)

Chọn loại sự kiện ở webadmin → **điền sẵn nhãn + giá trị gợi ý + ẩn ô không cần**. Admin vẫn sửa được mọi ô.
Đổi loại khi đã nhập → hỏi xác nhận trên trang ("Giữ nội dung đang nhập" / "Điền lại theo mẫu").

| `type` | Ô hiện | Gợi ý điền sẵn |
|---|---|---|
| `wedding` — Đám cưới | name1, connector, name2, subtitle, date, place, message, hashtag | connector `&`; subtitle chọn nhanh: `SAVE THE DATE` · `WEDDING DAY` · `LỄ THÀNH HÔN` · `LỄ VU QUY` · `TIỆC CƯỚI`; message `Cảm ơn bạn đã đến chung vui` |
| `engagement` — Đám hỏi | name1, connector, name2, subtitle, date, place | connector `♥`; subtitle: `LỄ ĂN HỎI` · `LỄ DẠM NGÕ` · `ENGAGEMENT` |
| `birthday` — Sinh nhật | title, name1, subtitle, date, message | title `HAPPY BIRTHDAY`; subtitle ví dụ `Tròn 1 tuổi` |
| `corporate` — Sự kiện / doanh nghiệp / trường | title, subtitle, date, place, hashtag | title = tên sự kiện; subtitle = khẩu hiệu |
| `custom` — Tự do | tất cả | trống |

Nhãn ô trong webadmin đổi theo loại (vd `name1` = "Tên cô dâu" cho cưới, "Tên người thứ nhất" cho đám hỏi, "Tên bé" cho sinh nhật).

### 9.3 Khung TRƠN mặc định của EV1/EV2/EV3 — tự dàn chữ

Khung trơn (khi sự kiện chưa có khung riêng) vẽ dải chữ dưới ảnh bằng code, theo thứ tự từ trên xuống, căn giữa:
```
[subtitle]            chữ hoa nhỏ, giãn chữ, màu accent        (vd SAVE THE DATE)
[name1 connector name2] hoặc [title]   chữ lớn nhất, font tên     (vd Minh Thư & Kuan Hsun)
[date · place]        1 dòng, chữ nhỏ; thiếu 1 trong 2 thì chỉ hiện cái còn lại
[message]             nghiêng, tối đa 2 dòng
[hashtag]             nhỏ, màu accent
[YOUNG BOOTH]         rất nhỏ, xám — cố định
```
- Dàn theo **chiều cao thật** của các dòng có nội dung, rồi căn giữa cả khối trong dải chữ (EV1: y 1500–1800, EV2: 1390–1800, EV3: 1334–1800).
- Tên đôi dài → tự thu nhỏ (`fit` = bề rộng dải − 120px); nếu vẫn quá dài (cỡ < 60%) → tách thành 2 dòng: `name1` / `connector name2`.
- Chừa chỗ cho QR ở góc dưới-phải (120px), chữ không đè QR.

### 9.4 Kiểu chữ (`event.textStyle`)
- `nameFont`: `script` (Great Vibes) · `hand` (Dancing Script) · `serif` (Cormorant Garamond) · `sans` (Be Vietnam Pro đậm) · `round` (Baloo 2).
- `bodyFont`: `serif` · `sans`. Tất cả font đã nhúng offline, **có đủ dấu tiếng Việt**.
- `color` (chữ chính), `accent` (subtitle, hashtag), `scale` (0.8–1.3, phóng to/thu nhỏ toàn khối chữ).
- Áp dụng cho **khung trơn**. Khung thiết kế riêng giữ font/màu/vị trí của khung, CHỈ thay nội dung — trừ khi khung khai báo
  `allowStyleOverride: true` (khi đó dùng `color`/`nameFont` của sự kiện).

### 9.5 Khung riêng & khung dùng lại
- Khung trong `eventFrames`: khai báo `texts` với khoá chuẩn, vd:
  `{ k: 'name1', x: 560, y: 1500, size: 100, fit: 900, font: '"Great Vibes"', color: '#1a1a1a' }`.
- Khung thường dùng lại (vd `B-std-white`, `A-clover-sage`) dùng khoá riêng (`line1`, `line2`, `tagline`, `sep`…) → thêm **`eventKeyMap`** vào khung đó:
  - `B-std-white`: `{ line1: 'name1', line2: 'name2', tagline: 'subtitle', date: 'date' }`
  - `A-clover-sage`: `{ line1: 'name1', sep: 'connector', line2: 'name2', date: 'date' }`
  - Khung không có `eventKeyMap` → không được chọn cho sự kiện (webadmin ẩn), tránh hiện chữ mặc định sai sự kiện.
- Thứ tự lấy giá trị khi vẽ khung trong luồng sự kiện: `event.content[khoá chuẩn]` → (trống thì) **không vẽ**.
  KHÔNG lấy giá trị mặc định của khung (tránh in nhầm "Minh Thư" ở đám cưới người khác).

### 9.6 Nhập liệu & xem trước (webadmin + Cài đặt trong app)
- Mỗi ô có **giới hạn độ dài** (tên ≤ 30 ký tự, subtitle ≤ 40, place ≤ 50, message ≤ 120, hashtag ≤ 30) + đếm ký tự.
- **Ô ngày**: nhập tự do; kèm nút chọn nhanh định dạng từ 1 ngày chọn trên lịch: `09.07.2026` · `09 · 07 · 2026` · `09/07/2026` · `Thứ Năm, 09.07.2026` · `July 9, 2026`.
- **Xem trước trực tiếp**: bên cạnh form, vẽ thumb khung mặc định của từng kiểu (EV1/EV2/EV3) với chữ đang nhập (dùng chính hàm compose của app, ảnh mẫu).
  Dòng nào bị tự thu nhỏ / tách dòng → hiện cảnh báo vàng "Tên hơi dài, đã thu nhỏ".
- Lưu → app cập nhật ngay (nếu đang ở màn chờ) hoặc sau lượt hiện tại.
- Bỏ khoảng trắng thừa đầu/cuối; giữ nguyên chữ hoa/thường admin nhập (trừ dòng có `uppercase: true` trong khung).

### 9.7 Nghiệm thu nội dung chữ
- [ ] Tạo sự kiện **Đám cưới**: nhập "Minh Thư" & "Kuan Hsun", subtitle "LỄ VU QUY", ngày, địa điểm → cả 3 kiểu EV1/EV2/EV3 hiện đúng chữ, đủ dấu.
- [ ] Đổi sang loại **Đám hỏi** → nhãn ô đổi, connector gợi ý "♥", subtitle gợi ý "LỄ ĂN HỎI"; hỏi trước khi ghi đè nội dung đã nhập.
- [ ] Loại **Doanh nghiệp**: chỉ nhập title "YEAR END PARTY 2026" + hashtag → khung trơn hiện title (không có khối tên đôi), các dòng dồn cân giữa.
- [ ] Xoá `place` → dòng ngày đứng một mình, không còn dấu "·" thừa.
- [ ] Tên rất dài ("Nguyễn Thị Phương Thảo & Trần Đức Hoàng Long") → tự thu nhỏ/tách dòng, không tràn, không đè QR, có cảnh báo trong xem trước.
- [ ] Khung dùng lại `B-std-white` trong sự kiện in đúng tên của sự kiện, không bao giờ hiện "Minh Thư" mặc định khi ô tên trống.
- [ ] Nhân viên sửa 1 lỗi chính tả trong Cài đặt app → lượt chụp kế tiếp in đúng.
