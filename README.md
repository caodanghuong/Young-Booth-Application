# Young Booth 📸

App photo booth kiểu **LumaBooth**, chạy trên **Windows desktop** (Electron). Bản MVP.

## Tính năng
- **Chụp ảnh + đếm giờ**: đếm ngược 3‑2‑1, hiệu ứng flash.
- **Khung ghép / template in**: ảnh đơn (4×6), dải phim 4 ảnh, lưới 2×2 — có branding, in trực tiếp.
- **GIF & Boomerang**: chụp chuỗi khung, xuất GIF động (boomerang tới–lui lặp).
- **Bộ lọc màu (filter)**: Gốc, Đen trắng, Nâu, Ấm, Lạnh, Rực rỡ, Cổ điển — đổi được cả sau khi chụp.
- **Chia sẻ QR**: máy chạy web server LAN; khách quét QR tải ảnh/GIF về điện thoại (cùng Wi‑Fi).
- **Gửi Email**: mở app email với link tải ảnh.
- **In ảnh**: gửi thẳng ra máy in qua hộp thoại in của Windows.
- **Máy ảnh Canon (EDSDK)**: hỗ trợ chụp full-res + liveview từ DSLR/mirrorless Canon (vd EOS R50). Mặc định dùng webcam; xem [CANON_SETUP.md](CANON_SETUP.md) để bật. Tự fallback về webcam nếu không có SDK/máy.
- **Chế độ booth trên Mini PC (kiosk)**: toàn màn hình, khóa thoát, chống ngủ, tự khởi động, phím thoát cho nhân viên. Bật trong `renderer/config.js` (`kiosk`); xem [MINI_PC_SETUP.md](MINI_PC_SETUP.md).
- **Khung PNG tự thiết kế**: nạp file PNG khung (overlay) hoặc template có ô ảnh tự do; xem [FRAMES_GUIDE.md](FRAMES_GUIDE.md).
- **Cài đặt in trong app (⚙️)**: chọn máy in, số bản, in tự động (silent), dải 4 ảnh in 2 bản/tờ 4×6.
- **Upload gallery online**: đẩy ảnh lên Cloudinary (hoặc endpoint tự dựng) để QR tải được mọi nơi (không cần chung Wi‑Fi). Xem [CLOUDINARY_SETUP.md](CLOUDINARY_SETUP.md).

## Chạy thử (dev)
```bash
npm install
npm start
```

## Đóng gói thành file .exe cài đặt
```bash
npm run dist
```
File cài đặt xuất ra thư mục `dist/`.

## Tùy chỉnh
Mở `renderer/config.js` để đổi:
- Tên thương hiệu, logo, màu (`brand`)
- Bật/tắt gương, độ phân giải camera (`camera`)
- Danh sách filter (`filters`)
- Các kiểu chụp & số ảnh (`modes`)
- Kích thước ảnh xuất (`output`)

Không cần build lại khi sửa config — chỉ chạy lại `npm start`.

## Ghi chú
- Ảnh/GIF lưu trong thư mục `captures/`.
- QR chỉ hoạt động khi điện thoại và máy dùng **chung mạng Wi‑Fi/LAN**.
- Lần đầu Windows có thể hỏi quyền Camera và quyền mở cổng mạng (Firewall) — chọn **Cho phép**.

## Cấu trúc
```
main.js        Electron main: cửa sổ, server LAN, tạo QR, in, lưu file
server.js      Express server phục vụ ảnh + trang tải cho điện thoại
preload.js     Cầu nối IPC an toàn
renderer/      Giao diện booth (HTML/CSS/JS)
  config.js    Cấu hình thương hiệu & tính năng
  app.js       Luồng chụp, ghép khung, GIF, filter, chia sẻ
  vendor/      gif.js (bộ mã hóa GIF)
captures/      Nơi lưu ảnh/GIF đã chụp
```
