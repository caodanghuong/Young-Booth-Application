# SPEC — Bộ khung #07 "Bầu Trời Sao" (nền đen, sao trắng lấp lánh, thương hiệu YOUNG BOOTH)

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
