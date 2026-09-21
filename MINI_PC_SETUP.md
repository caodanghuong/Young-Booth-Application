# Chạy Young Booth trên Mini PC (chế độ booth)

Mini PC Windows x64 (Intel N100/N95, NUC, Beelink, MinisForum...) là thiết bị lý tưởng để dựng booth: cắm màn hình cảm ứng + camera + máy in là thành máy photobooth hoàn chỉnh.

## 1. Cài app

Chọn 1 trong 2:
- **Portable**: copy `dist\YoungBooth-portable-win-x64.zip` sang mini PC → giải nén → chạy `Young Booth.exe`.
- **Installer**: chạy `Young Booth Setup.exe` (nếu đã build).

## 2. Bật chế độ kiosk (booth thật)

Mở `renderer/config.js`, phần `kiosk`:

```js
kiosk: {
  enabled: true,        // toàn màn hình, ẩn taskbar, KHÓA thoát
  autoStart: true,      // tự chạy khi Windows khởi động
  preventSleep: true,   // giữ màn hình luôn thức
  exitShortcut: 'CommandOrControl+Shift+Q', // phím nhân viên thoát app
}
```

- `enabled: true` → app chạy full màn hình, **khách không tắt/thu nhỏ được** (chặn Alt+F4, nút X).
- Nhân viên thoát bằng **Ctrl + Shift + Q** (đổi được ở `exitShortcut`).
- `preventSleep` giữ màn hình không tắt suốt sự kiện.

Đổi xong chạy lại app (hoặc khởi động lại máy nếu đã bật autoStart).

## 3. Tự khởi động khi bật máy

**Cách A (khuyên):** đặt `kiosk.autoStart: true` — app tự đăng ký chạy khi đăng nhập Windows.

**Cách B (thủ công, chắc ăn):** đặt shortcut vào thư mục Startup:
1. Nhấn `Win + R`, gõ `shell:startup`, Enter.
2. Tạo shortcut trỏ tới `Young Booth.exe` (bản portable/đã cài) và bỏ vào thư mục vừa mở.

## 4. Cấu hình Windows cho booth chạy 24/7

- **Tự đăng nhập** (không cần gõ mật khẩu): `netplwiz` → bỏ tick "Users must enter a user name and password".
- **Không cho máy ngủ**: Settings → System → Power → Screen and sleep → đặt tất cả **Never**.
- **Tắt Windows Update tự khởi động lại**: đặt Active hours rộng, hoặc tạm hoãn update trong lúc sự kiện.
- **Ẩn thông báo** (Focus assist / Do not disturb) để popup không đè lên app.
- Cân nhắc tài khoản Windows riêng chỉ để chạy booth.

## 5. Phần cứng cắm vào mini PC

| Thiết bị | Ghi chú |
|---|---|
| **Màn hình cảm ứng** | Giao diện nút to, chạm tốt. Không có cảm ứng vẫn dùng chuột được |
| **Camera** | Webcam USB, hoặc Canon (xem `CANON_SETUP.md`) — chọn nguồn trong app |
| **Máy in ảnh** | Cắm USB, đặt làm máy in mặc định. Xem phần in ở `README.md` |
| **Mạng Wi‑Fi/LAN** | Cần nếu dùng QR: điện thoại khách phải **cùng mạng** với mini PC |

## 6. Kiểm tra nhanh trước sự kiện

- [ ] App tự mở full màn hình khi bật máy.
- [ ] Camera lên hình (đúng nguồn webcam/Canon).
- [ ] Chụp thử → in ra 1 tấm (máy in đúng khổ giấy).
- [ ] Quét QR bằng điện thoại (cùng Wi‑Fi) tải được ảnh.
- [ ] Ctrl+Shift+Q thoát được (cho nhân viên).

> Yêu cầu cấu hình rất nhẹ: N100 / 8GB RAM là dư. Electron + ghép ảnh + GIF chạy mượt.
