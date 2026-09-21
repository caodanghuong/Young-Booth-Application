# Khung PNG tự thiết kế (template)

App hỗ trợ 2 cách gắn khung riêng:

## Cách A — Overlay PNG lên khung có sẵn (nhanh)

Thêm 1 file PNG **trong suốt** (chỉ có viền/hoạ tiết/logo, phần giữa để trống) đúng kích thước output, rồi khai báo `overlay` trong `renderer/config.js` cho kiểu chụp:

```js
{ id: 'single', name: 'Ảnh đơn', icon: '🖼️', kind: 'photo', shots: 1, layout: 'single',
  overlay: 'frames/single-overlay.png',  // PNG 1200×1800, trong suốt phần ảnh
  showBrand: false                       // tắt footer mặc định nếu PNG đã có branding
}
```

App vẽ ảnh trước, rồi phủ PNG lên trên. Bỏ file PNG vào `renderer/frames/`.

Kích thước PNG theo layout:
- `single`, `grid`: **1200 × 1800**
- `strip`: **600 × 1800**

## Cách B — Template với ô ảnh tự do (toàn quyền)

Tự đặt vị trí từng ảnh bằng `slots` + nền + PNG khung. Dùng khi muốn bố cục riêng hẳn:

```js
{ id: 'myframe', name: 'Khung sự kiện', icon: '💜', kind: 'photo', shots: 3,
  canvas: { w: 600, h: 1800 },           // kích thước tờ in
  background: 'gradient',                 // 'gradient' | '#ffffff' | null (trong suốt, để PNG lo nền)
  slots: [                                // toạ độ (px) từng ảnh, theo thứ tự chụp
    { x: 40,  y: 40,   w: 520, h: 500, radius: 20 },
    { x: 40,  y: 570,  w: 520, h: 500, radius: 20 },
    { x: 40,  y: 1100, w: 520, h: 500, radius: 20 },
  ],
  overlay: 'frames/event-frame.png',      // PNG 600×1800 phủ lên (viền, chữ, logo)
  showBrand: false
}
```

Thêm object này vào mảng `modes` trong `config.js`. `shots` = số ảnh chụp; nên bằng số `slots`.

## Mẹo làm PNG khung
- Xuất từ Photoshop/Canva/Figma **đúng px** ở trên, nền trong suốt (transparent).
- Chỗ nào muốn thấy ảnh khách → để **trống (trong suốt)**; chỗ nào là viền/hoạ tiết → vẽ đè.
- Đặt file vào `renderer/frames/`, tham chiếu `frames/<tên>.png`.
- Muốn dùng khung nằm ngoài app: dùng đường dẫn tuyệt đối kiểu `file:///C:/khung/abc.png`.

> Sau khi sửa `config.js` chỉ cần chạy lại app (`npm start`) — không cần build lại.
