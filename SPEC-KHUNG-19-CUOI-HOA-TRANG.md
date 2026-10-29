# SPEC — KHUNG #19 "Cưới Hoa Trắng – Rèm Kem" (khung sự kiện, 2 ảnh, tờ 4×6 DỌC)

> Gửi Claude Code trong VS Code. Làm theo đúng spec; **PNG khung đã vẽ sẵn**, chỉ cần khai báo vào config.
> Ảnh mẫu: `docs/frames-ref/khung-19-cuoi-hoa-trang.webp` · Preview: `docs/previews/khung-19-hoa-trang.png`
> Script vẽ lại PNG: `py scripts/make-frame-hoa-trang.py --preview`

## 1. Quyết định đã chốt (28/10/2026)
- Giữ **tờ 4×6 DỌC 1200×1800, 2 ảnh ngang xếp chồng** y như mẫu — **ngoại lệ** của quy ước "mọi khung tờ ngang" hôm nay. Không đổi sang ngang, không thêm vào `FRAME_ALIASES`.
- Là **khung sự kiện** (`EVENT_FRAMES`), `mode: 'B'` (Ngọt Ngào, 2 ảnh), `photos: 2`. Không thêm vào `modes[].frames` của luồng thường.
- Khung ghi đè `canvas` 1200×1800 và **`noRotate: false`** (mode B gốc có `noRotate: true` vì vốn ngang — phải tắt để in DNP tự xoay 90° như Khoảnh Khắc/Nhật Ký dọc; driver DS-RX1 chốt khổ ngang 6×4).

## 2. File đã có
| File | Nội dung |
|---|---|
| `C:/YoungBooth-Frames/events/hoa-trang/ht-d2.png` | Overlay 1200×1800 RGBA, 2 ô ảnh đã khoét trong suốt |
| `C:/YoungBooth-Frames/events/hoa-trang/ht-d2-thumb.png` | Thumb 300×450 |
| `scripts/make-frame-hoa-trang.py` | Script vẽ (dùng `frame_kit.py`); `SLOTS`, `QR`, `TEXTS` trong script PHẢI khớp config |

Thiết kế PNG: nền kem `#f6f1e6` + rèm vải nếp dọc + rèm võng trên cùng; 3 cụm hoa hồng trắng + lá bạch đàn xanh sage (góc trên-phải đè góc ảnh 1, góc dưới-trái ảnh 2, góc dưới-phải tờ); viền trắng 3px quanh ảnh. Phần **cố định** trong PNG: 2 vạch dọc + tim ở cột ngày, đường kẻ + tim dưới lời cảm ơn, chữ **YOUNG BOOTH** (Be Vietnam Pro 800, 32px, giãn chữ, xanh rêu `#3f5446`) — đúng quy ước thương hiệu phải rõ.

## 3. Khai báo — thêm vào cuối mảng `EVENT_FRAMES` trong `renderer/config.js`
```js
      { id: 'EV-B-ht-d2', mode: 'B', name: 'Cưới Hoa Trắng – 2 ảnh dọc', photos: 2, textGroup: 'ht', overlay: 'file:///C:/YoungBooth-Frames/events/hoa-trang/ht-d2.png', thumb: 'file:///C:/YoungBooth-Frames/events/hoa-trang/ht-d2-thumb.png', background: '#f6f1e6', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, noRotate: false, qr: { size: 120, label: false, at: [{ x: 1012, y: 1482 }] },
        slots: [{ x: 45, y: 95, w: 1110, h: 640 }, { x: 45, y: 765, w: 1110, h: 640 }],
        texts: [
          { id: 'dd', label: 'Ngày (2 số)', value: '20', x: 150, y: 1520, size: 58, color: '#3f5446', ff: '"Cormorant Garamond", "YB Serif", Georgia, serif', weight: '600' },
          { id: 'mm', label: 'Tháng (2 số)', value: '09', x: 150, y: 1608, size: 58, color: '#3f5446', ff: '"Cormorant Garamond", "YB Serif", Georgia, serif', weight: '600' },
          { id: 'yy', label: 'Năm (2 số)', value: '26', x: 150, y: 1696, size: 58, color: '#3f5446', ff: '"Cormorant Garamond", "YB Serif", Georgia, serif', weight: '600' },
          { id: 'name1', label: 'Tên chú rể', value: 'MINH VIỆT', x: 560, y: 1580, size: 58, fit: 300, color: '#3f5446', ff: '"Cormorant Garamond", "YB Serif", Georgia, serif', weight: '600', ls: 2, align: 'right' },
          { id: 'conn', label: 'Chữ nối 2 tên', value: 'and', x: 618, y: 1582, size: 70, color: '#3f5446', ff: '"Great Vibes", "YB Script", cursive' },
          { id: 'name2', label: 'Tên cô dâu', value: 'HÀ VY', x: 676, y: 1580, size: 58, fit: 300, color: '#3f5446', ff: '"Cormorant Garamond", "YB Serif", Georgia, serif', weight: '600', ls: 2, align: 'left' },
          { id: 'thanks', label: 'Lời cảm ơn', value: 'Thank you for being part of our special day', x: 618, y: 1648, size: 32, fit: 640, color: '#5d6b5f', ff: '"Cormorant Garamond", "YB Serif", Georgia, serif', weight: '500', italic: true },
        ] },
```
Và thêm vào `FRAME_TEXT_GROUPS`:
```js
  'ht': 'Khung Cưới Hoa Trắng (khung sự kiện)',
```

Ghi chú chữ:
- Tên viết HOA (admin nhập sao in vậy; gợi ý nhập HOA cho giống mẫu). `fit: 300` → tên dài tự thu nhỏ tới 60%.
- Ngày tách 3 ô `dd/mm/yy` vì in dọc thành cột — **không** dùng ô `date` "trống = hôm nay". Nếu muốn tự điền: trống → lấy ngày hôm nay dạng 2 số (tuỳ chọn, không bắt buộc).
- Font Cormorant Garamond + Great Vibes đã có trong `renderer/fonts` (đủ dấu tiếng Việt). Kiểm `app.js` (~dòng 1396 danh sách nạp font trước khi in) đã tự thêm font từ `texts[].ff` của `eventFrames` → in tờ đầu không sai font.

## 4. Việc cần kiểm trong code
1. `effectiveMode()` áp `canvas`, `slots`, `noRotate`, `qr`, `texts` của khung đè lên mode B (`FRAME_OVERRIDES` đã có đủ các khoá này).
2. Màn chụp / màn chọn ảnh của mode B khi khung này là khung mặc định sự kiện: khung xem trước hiển thị **dọc** (không méo ảnh, ô ảnh tỉ lệ 1110:640 ≈ 1,73 → crop cover từ ảnh 3:2 của Canon).
3. Bảng "Chọn khung" ở màn kết quả trong sự kiện: khung dọc và khung ngang của B cùng hiện được; đổi qua lại thì render lại đúng canvas.
4. In (AUTO + GDI): canvas dọc → xoay 90° sang 6×4 ngang, đủ 4 mép, không bị cắt. In thử 1 tờ thật.
5. Ảnh lưu/QR tải về: giữ bản DỌC 1200×1800 (không phải bản đã xoay để in).

## 5. Cách bật cho 1 đám cưới
Webadmin `/admin` → Sự kiện → chọn kiểu chụp **Ngọt Ngào (B)** → khung `EV-B-ht-d2` làm mặc định → Cài đặt chữ nhóm **"Khung Cưới Hoa Trắng"**: nhập Ngày/Tháng/Năm, Tên chú rể, Tên cô dâu, lời cảm ơn.

## 6. Checklist nghiệm thu
- [ ] Khung hiện trong luồng sự kiện mode B, thumb dọc đúng.
- [ ] 2 ảnh nằm khít ô, hoa đè lên góc ảnh 1 (trên-phải) và ảnh 2 (dưới-trái) như preview.
- [ ] Tên có dấu (VIỆT, HÀ) hiển thị đúng font Cormorant; "and" là chữ viết tay Great Vibes.
- [ ] QR 120px ở góc dưới-phải, quét được, không đè chữ.
- [ ] Chữ YOUNG BOOTH rõ ở đáy tờ.
- [ ] In DNP: tờ ra đủ, ảnh xoay nghiêng (khách xoay để xem), không mất mép.
