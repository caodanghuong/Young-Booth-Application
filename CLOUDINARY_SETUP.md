# Bật QR tải mọi nơi bằng Cloudinary

Cho phép khách quét QR tải ảnh **ở bất cứ đâu** (4G, về nhà...), không cần chung Wi‑Fi với booth. Miễn phí (Cloudinary free 25GB/tháng), **không cần dựng server**.

## Bước 1 — Tạo tài khoản & Upload preset (unsigned)

1. Đăng ký tại https://cloudinary.com (miễn phí).
2. Vào **Dashboard** → ghi lại **Cloud name** (vd `youngbooth`).
3. Vào **Settings (bánh răng) → Upload → Upload presets → Add upload preset**.
4. Đặt **Signing Mode = Unsigned** → Save. Ghi lại **tên preset** (vd `young_booth_unsigned`).

> "Unsigned" cho phép app đẩy ảnh lên mà không cần nhúng API secret (an toàn hơn cho máy đặt ở booth).

## Bước 2 — Điền vào config

Mở `renderer/config.js`, phần `gallery`:

```js
gallery: {
  enabled: true,            // BẬT
  provider: 'cloudinary',
  cloudinary: {
    cloudName: 'youngbooth',            // Cloud name của anh
    uploadPreset: 'young_booth_unsigned', // tên preset unsigned
    folder: 'young-booth',              // thư mục trên Cloudinary (tuỳ chọn)
  },
},
```

Chạy lại app (`npm start`). Xong.

## Kết quả

- Khi khách bấm **📱 Chia sẻ / QR**, ảnh tự đẩy lên Cloudinary → QR trỏ link `https://res.cloudinary.com/...`.
- Khách quét là tải được **mọi nơi**, kể cả 4G.
- Nếu mất mạng lúc sự kiện → app **tự quay về QR‑LAN** (cùng Wi‑Fi) để vẫn dùng được.

## Tiết kiệm dung lượng / băng thông (ở lại free tier lâu)

### 1. Nén khi tải — TỰ ĐỘNG (đã bật sẵn)
Link QR trỏ tới URL Cloudinary có `q_auto,f_auto` (ảnh) / `q_auto` (GIF) → giảm băng thông nhiều mà mắt thường gần như không thấy khác. Không cần làm gì thêm.

### 2. Xoá ảnh cũ định kỳ — script sẵn (giữ bản gốc trên máy booth)
`scripts/cleanup-cloudinary.js` xoá ảnh Cloudinary cũ hơn N ngày. **Ảnh gốc vẫn nằm trong `captures` trên máy booth** nên không mất.

Script này cần **API Key + Secret** (khác với upload preset unsigned) — lấy ở Cloudinary Dashboard. **Đặt qua biến môi trường, đừng ghi vào code:**

```powershell
$env:CLOUDINARY_CLOUD_NAME="youngbooth"
$env:CLOUDINARY_API_KEY="123456789012345"
$env:CLOUDINARY_API_SECRET="xxxxxxxxxxxxxxxxxxxxxx"

# Xem trước (chưa xoá):
node scripts/cleanup-cloudinary.js --days 15 --folder young-booth --dry

# Xoá thật ảnh cũ hơn 15 ngày:
node scripts/cleanup-cloudinary.js --days 15 --folder young-booth
```

> Đổi số sau `--days` để chỉnh thời gian hết hạn (vd `--days 7`, `--days 30`).

### 3. Chạy tự động hằng ngày (Windows Task Scheduler)
1. Tạo file `cleanup.bat` (đặt cùng thư mục app), nội dung:
   ```bat
   set CLOUDINARY_CLOUD_NAME=youngbooth
   set CLOUDINARY_API_KEY=123456789012345
   set CLOUDINARY_API_SECRET=xxxxxxxxxxxx
   node "%~dp0scripts\cleanup-cloudinary.js" --days 15 --folder young-booth
   ```
2. Mở **Task Scheduler** → Create Basic Task → chạy **hằng ngày** → Action = chạy `cleanup.bat`.
   Chạy mỗi ngày nên ảnh sẽ tồn tại tối đa ~15 ngày rồi tự bị xoá.

> Giữ `cleanup.bat` an toàn vì có chứa API Secret (không đưa lên git/chia sẻ).

## Khi data lớn → chuyển sang lưu trữ rẻ hơn
App tách sẵn `gallery.provider`. Khi gần chạm giới hạn Cloudinary, chuyển sang **DigitalOcean Spaces** (~$5/250GB) hoặc **Backblaze B2** (~$6/TB): đổi `provider: 'custom'` + trỏ tới endpoint upload nhỏ — không phải làm lại app.

## Lưu ý
- Ảnh/GIF nằm công khai theo link (ai có link đều xem được) — đúng nhu cầu chia sẻ cho khách.
- Free tier ~25GB (gồm lưu trữ + băng thông/tháng) — kiểm tra trang pricing Cloudinary vì có thể thay đổi.
