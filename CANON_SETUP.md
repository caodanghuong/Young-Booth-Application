# Tích hợp máy ảnh Canon EOS R50 (EDSDK) — Hướng dẫn setup

App đã **được dựng sẵn khung tích hợp Canon**. Phần webcam vẫn chạy mặc định; để bật DSLR anh cần làm các bước dưới đây **trên máy có gắn R50** (không làm được từ xa vì EDSDK phải đăng nhập tài khoản Canon để tải và cần máy ảnh thật).

Tổng quan luồng: `EDSDK (Canon)` → `@brick-a-brack/napi-canon-cameras` (native addon) → `canon.js` (main process) → IPC → giao diện booth.

---

## 0. Yêu cầu

- Windows **64-bit**.
- **Canon EOS R50** + cáp **USB‑C truyền dữ liệu** (không phải cáp chỉ sạc).
- R50 được EDSDK hỗ trợ — **dùng EDSDK mới** (khuyên **≥ 13.18**; kiểm tra tên R50 trong file *Supported Camera List* kèm gói EDSDK).
- Công cụ build native:
  - **Visual Studio Build Tools 2022** với workload *Desktop development with C++*.
  - **Python 3.x** (cho node-gyp).
  - Node 18/20 LTS khuyến nghị (đang dùng Node 24 vẫn được, nếu lỗi hãy thử LTS).

```bash
# Cài toolchain build (chạy PowerShell Administrator)
winget install Python.Python.3.12
winget install Microsoft.VisualStudio.2022.BuildTools --override "--wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

---

## 1. Lấy Canon EDSDK

1. Đăng ký **Canon Developer Program** (miễn phí): https://developers.canon-europe.com hoặc trang Canon khu vực. *Duyệt có thể mất vài ngày.*
2. Tải **EDSDK for Windows** (bản mới nhất hỗ trợ R50).
3. Giải nén, tìm thư mục có:
   - `EDSDK/Header/` (các file .h)
   - `EDSDK/Dll/` hoặc `EDSDK64/Dll/` — chứa **`EDSDK.dll`, `EdsImage.dll`** (bản **x64**).
   - `EDSDK/Library/` (EDSDK.lib)

> ⚠️ Không được public/redistribute EDSDK. Chỉ dùng theo license Canon.

---

## 2. Build module native `@brick-a-brack/napi-canon-cameras`

Module này **không kèm EDSDK** — phải nhét EDSDK vào rồi build.

```bash
# clone nơi khác (không cần trong project)
git clone https://github.com/brick-a-brack/napi-canon-cameras
cd napi-canon-cameras

# Giải nén EDSDK vào third_party/ (giữ đúng tên thư mục gói EDSDK)
#   third_party/EDSDK/Header/...
#   third_party/EDSDK/Dll/...
#   third_party/EDSDK64/... (nếu gói tách 64-bit)
```

Mở `binding.gyp`, sửa biến **`edsdk_version`** cho khớp phiên bản EDSDK vừa tải, rồi:

```bash
npm install
npm run package          # tạo file .tgz của addon
```

Cài addon vào app Young Booth:

```bash
cd C:\Users\Lenovo\young-booth-app
npm i ..\napi-canon-cameras\brick-a-brack-napi-canon-cameras-*.tgz
```

---

## 3. Rebuild theo ABI của Electron

Electron dùng ABI Node khác → phải rebuild addon:

```bash
cd C:\Users\Lenovo\young-booth-app
npm i -D @electron/rebuild
npx electron-rebuild -f -w @brick-a-brack/napi-canon-cameras
```

Xác minh API đúng tên với bản đã cài (tên hàm liveview có thể khác giữa các bản):

```bash
node -e "const c=require('@brick-a-brack/napi-canon-cameras'); console.log('exports:', Object.keys(c)); const cam=c.cameraBrowser.getCamera(); console.log('camera methods:', cam && Object.getOwnPropertyNames(Object.getPrototypeOf(cam)));"
```

Nếu tên hàm liveview không phải `getLiveViewImage`/`startLiveView`, sửa lại trong [`canon.js`](canon.js) (hàm `grabLiveViewDataUrl` và `startLiveView` đã viết sẵn để thử nhiều tên — chỉ cần thêm tên đúng vào mảng `fns`).

---

## 4. Đặt DLL của EDSDK đúng chỗ

Native addon (`.node`) cần tìm thấy **`EDSDK.dll` + `EdsImage.dll` (x64)** lúc chạy.

**Khi chạy dev (`npm start`)** — copy 2 DLL (và mọi DLL trong `EDSDK/Dll`) vào cạnh file `.node`:
```
node_modules\@brick-a-brack\napi-canon-cameras\build\Release\
```

**Khi đóng gói (`npm run dist`)** — thêm vào `package.json > build` để DLL nằm cạnh `Young Booth.exe`:
```json
"extraFiles": [
  { "from": "edsdk-dll", "to": ".", "filter": ["**/*"] }
]
```
rồi tạo thư mục `edsdk-dll/` trong project chứa `EDSDK.dll`, `EdsImage.dll` (x64). (`asarUnpack` cho addon đã cấu hình sẵn.)

> Lỗi *"The specified module could not be found"* khi require addon = thiếu DLL này trong đường dẫn tìm kiếm.

---

## 5. Bật chế độ Canon trong app

Sửa [`renderer/config.js`](renderer/config.js):

```js
camera: {
  source: 'canon',      // đổi từ 'webcam' sang 'canon'
  canon: {
    liveViewFps: 15,
    fullResPhoto: true, // ảnh đơn/strip/grid chụp full-res bằng màn trập
  },
}
```

Cắm R50 → bật máy → `npm start`. App sẽ tự kết nối Canon; nếu không thấy máy/không có SDK, app **tự quay về webcam** và báo lý do.

---

## 6. Cấu hình máy R50 cho booth

- Cắm cáp USB‑C vào PC; nếu máy hỏi chế độ kết nối, chọn để app điều khiển (PC/remote).
- **Tắt Auto power off** (Menu → thời gian tắt nguồn = Disable) để không rớt kết nối giữa sự kiện.
- Dùng **AC adapter / pin giả (DC coupler)** cho sự kiện dài.
- Lấy nét: để chế độ AF hợp lý; nếu chụp full-res mà kẹt lấy nét, có thể chuyển MF hoặc chỉnh trong `canon.js` (dùng lệnh chụp không AF nếu bản addon hỗ trợ).

---

## Cách app dùng Canon (đã code sẵn)

| Việc | Webcam | Canon (R50) |
|---|---|---|
| Preview | `getUserMedia` vào `<video>` | Liveview EDSDK → khung JPEG đẩy vào `<img id="live-img">` |
| Ảnh đơn / Strip / Grid | Chộp khung video | **Màn trập thật** → tải file **full-res** JPEG về `%APPDATA%\Young Booth\captures` |
| GIF / Boomerang | Burst khung video | Burst **khung liveview** (mượt; màn trập cơ học quá chậm cho GIF) |
| Filter, ghép khung, in, QR, email | Như nhau | Như nhau |

Code liên quan: [`canon.js`](canon.js) (điều khiển máy), [`main.js`](main.js) (IPC + stream liveview), [`renderer/app.js`](renderer/app.js) (chuyển nguồn, chụp full-res).

## Sự cố thường gặp

| Triệu chứng | Nguyên nhân / cách xử lý |
|---|---|
| `Cannot find module ...napi-canon-cameras` | Chưa cài/build addon (bước 2) |
| require addon lỗi *module could not be found* | Thiếu `EDSDK.dll`/`EdsImage.dll` cạnh `.node` (bước 4) |
| App mở nhưng báo *Không thấy máy ảnh Canon* | Cáp chỉ-sạc, máy tắt, hoặc đang mở bởi app Canon khác (EOS Utility) → đóng app kia |
| Crash `NODE_MODULE_VERSION mismatch` | Chưa `electron-rebuild` (bước 3) |
| Liveview đen / không có khung | Sai tên hàm liveview → xem lại bước 3, sửa mảng `fns` trong `canon.js` |
