// ================== Young Booth configuration ==================
// Sửa file này để đổi thương hiệu, màu, filter, kiểu chụp, chế độ kiosk.
// LƯU Ý: file nằm trong app.asar → sửa xong phải đóng gói lại (build/cài lại) mới có hiệu lực.
// Ô chữ id 'date' để trống ('') = tự in ngày hôm nay.

// ---- Công thức ô ảnh dùng chung cho các bộ khung (bản Python tương đương trong scripts/make-frames.py) ----
// Nhật Ký: canvas 1200×1800, 2 dải 600 giống nhau (cắt x=600), 4 ảnh/dải → 8 ô (dải phải lặp i % 4).
function stripSlots({ top, bottom, side, gap, radius = 0, n = 4 }) {   // n = số ảnh mỗi dải
  const w = 600 - 2 * side, h = Math.floor((1800 - top - bottom - (n - 1) * gap) / n);
  const out = [];
  for (const ox of [0, 600]) for (let i = 0; i < n; i++) out.push({ x: ox + side, y: top + i * (h + gap), w, h, radius });
  return out;
}
// Dịu Dàng: canvas 1200×1800, lưới 2×2.
function grid2x2Slots({ top, bottom, side, gap, radius = 0 }) {
  const w = Math.floor((1200 - 2 * side - gap) / 2), h = Math.floor((1800 - top - bottom - gap) / 2);
  return [[0, 0], [1, 0], [0, 1], [1, 1]].map(([c, r]) => ({ x: side + c * (w + gap), y: top + r * (h + gap), w, h, radius }));
}

// ==== KHUNG MỚI cho nút "Chọn khung" — TỰ SINH bởi: py scripts/make-frames.py config
// Toạ độ ô ảnh / chữ / QR khớp file PNG trong C:/YoungBooth-Frames. Muốn sửa: sửa scripts/frame_sets.py rồi chạy lại
// "py scripts/make-frames.py sets config" (sinh lại PNG + khối này). Thứ tự trong mảng = thứ tự trong bảng "Chọn khung".
const FRAME_SETS = {
  A: [
      { id: 'A-clover-sage', name: 'Cỏ Bốn Lá – Sage', textGroup: 'clover-sage', overlay: 'file:///C:/YoungBooth-Frames/A-clover-sage.png', thumb: 'file:///C:/YoungBooth-Frames/A-clover-sage-thumb.png', background: '#c3d1ba', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, qr: { size: 120, label: false, at: [{ x: 1036, y: 1636 }] },
        slots: [{ x: 80, y: 80, w: 1040, h: 1300, radius: 40 }],
        texts: [
          { id: 'line1', label: 'Tên người thứ nhất', value: 'Tấn Nhã', x: 470, y: 1530, size: 64, fit: 520, color: '#ffffff', ff: '"YB Serif", Georgia, serif', weight: '600' },
          { id: 'sep', label: 'Ký tự nối', value: '+', x: 600, y: 1600, size: 40, color: '#ffffff', ff: '"YB Serif", Georgia, serif', weight: '600' },
          { id: 'line2', label: 'Tên người thứ hai', value: 'Huỳnh Như', x: 720, y: 1680, size: 64, fit: 520, color: '#ffffff', ff: '"YB Serif", Georgia, serif', weight: '600' },
          { id: 'date', label: 'Ngày', value: '05.07.2026', x: 720, y: 1735, size: 22, color: '#f2f6ef', ff: '"YB Serif", Georgia, serif', weight: '600', ls: 2 },
        ] },
      { id: 'A-clover-sage-wide', name: 'Cỏ Bốn Lá – Sage (ngang)', textGroup: 'clover-sage', overlay: 'file:///C:/YoungBooth-Frames/A-clover-sage-wide.png', thumb: 'file:///C:/YoungBooth-Frames/A-clover-sage-wide-thumb.png', background: '#c3d1ba', logo: null, showBrand: false, canvas: { w: 1800, h: 1200 }, paper: '4x6', qr: { size: 120, label: false, at: [{ x: 1636, y: 1036 }] },
        slots: [{ x: 85, y: 63, w: 1630, h: 910, radius: 40 }],
        texts: [
          { id: 'line1', label: 'Tên người thứ nhất', value: 'Tấn Nhã', x: 840, y: 1090, size: 64, fit: 620, color: '#ffffff', ff: '"YB Serif", Georgia, serif', weight: '600', align: 'right' },
          { id: 'sep', label: 'Ký tự nối', value: '+', x: 900, y: 1088, size: 44, color: '#ffffff', ff: '"YB Serif", Georgia, serif', weight: '600' },
          { id: 'line2', label: 'Tên người thứ hai', value: 'Huỳnh Như', x: 960, y: 1090, size: 64, fit: 620, color: '#ffffff', ff: '"YB Serif", Georgia, serif', weight: '600', align: 'left' },
          { id: 'date', label: 'Ngày', value: '05.07.2026', x: 900, y: 1140, size: 22, color: '#f2f6ef', ff: '"YB Serif", Georgia, serif', weight: '600', ls: 2 },
        ] },
  ],
  B: [
      { id: 'B-std-white', name: 'Save The Date – Trắng (dọc)', textGroup: 'std-white', overlay: 'file:///C:/YoungBooth-Frames/B-std-white.png', thumb: 'file:///C:/YoungBooth-Frames/B-std-white-thumb.png', background: '#ffffff', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, paper: '4x6', noRotate: false, qr: { size: 130, label: false, at: [{ x: 1024, y: 1624 }] },
        slots: [{ x: 50, y: 50, w: 1100, h: 650 }, { x: 50, y: 740, w: 1100, h: 650 }],
        texts: [
          { id: 'line1', label: 'Tên dòng 1', value: 'Minh Thư', x: 560, y: 1500, size: 100, fit: 760, color: '#1a1a1a', ff: '"YB Script", "Dancing Script", cursive' },
          { id: 'line2', label: 'Tên dòng 2', value: 'Kuan Hsun', x: 640, y: 1610, size: 100, fit: 760, color: '#1a1a1a', ff: '"YB Script", "Dancing Script", cursive' },
          { id: 'date', label: 'Ngày', value: '09.07.2026', x: 600, y: 1680, size: 32, color: '#333333', ff: '"YB Serif", Georgia, serif', weight: '600', ls: 3 },
          { id: 'tagline', label: 'Dòng dưới ngày', value: 'SAVE THE DATE', x: 600, y: 1728, size: 30, color: '#333333', ff: '"YB Serif", Georgia, serif', weight: '600', ls: 5 },
        ] },
  ],
  C: [
      { id: 'C-std-white', name: 'Save The Date – Trắng', textGroup: 'std-white', overlay: 'file:///C:/YoungBooth-Frames/C-std-white.png', thumb: 'file:///C:/YoungBooth-Frames/C-std-white-thumb.png', background: '#ffffff', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, cut2inch: true, qr: { size: 110, label: false, at: [{ x: 448, y: 1648 }, { x: 1048, y: 1648 }] },
        slots: [{ x: 40, y: 40, w: 520, h: 328 }, { x: 40, y: 384, w: 520, h: 328 }, { x: 40, y: 728, w: 520, h: 328 }, { x: 40, y: 1072, w: 520, h: 328 }, { x: 640, y: 40, w: 520, h: 328 }, { x: 640, y: 384, w: 520, h: 328 }, { x: 640, y: 728, w: 520, h: 328 }, { x: 640, y: 1072, w: 520, h: 328 }],
        texts: [
          { id: 'line1', label: 'Tên dòng 1', value: 'Minh Thư', xs: [270, 870], y: 1490, size: 72, fit: 480, color: '#1a1a1a', ff: '"YB Script", "Dancing Script", cursive' },
          { id: 'line2', label: 'Tên dòng 2', value: 'Kuan Hsun', xs: [330, 930], y: 1570, size: 72, fit: 480, color: '#1a1a1a', ff: '"YB Script", "Dancing Script", cursive' },
          { id: 'date', label: 'Ngày', value: '09.07.2026', xs: [300, 900], y: 1625, size: 24, color: '#333333', ff: '"YB Serif", Georgia, serif', weight: '600', ls: 2 },
          { id: 'tagline', label: 'Dòng dưới ngày', value: 'SAVE THE DATE', xs: [300, 900], y: 1662, size: 22, color: '#333333', ff: '"YB Serif", Georgia, serif', weight: '600', ls: 4 },
        ] },
      { id: 'C-clover-sage', name: 'Cỏ Bốn Lá – Sage', textGroup: 'clover-sage', overlay: 'file:///C:/YoungBooth-Frames/C-clover-sage.png', thumb: 'file:///C:/YoungBooth-Frames/C-clover-sage-thumb.png', background: '#c3d1ba', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, cut2inch: true, qr: { size: 110, label: false, at: [{ x: 36, y: 1648 }, { x: 636, y: 1648 }] },
        slots: [{ x: 45, y: 45, w: 510, h: 325, radius: 36 }, { x: 45, y: 394, w: 510, h: 325, radius: 36 }, { x: 45, y: 743, w: 510, h: 325, radius: 36 }, { x: 45, y: 1092, w: 510, h: 325, radius: 36 }, { x: 645, y: 45, w: 510, h: 325, radius: 36 }, { x: 645, y: 394, w: 510, h: 325, radius: 36 }, { x: 645, y: 743, w: 510, h: 325, radius: 36 }, { x: 645, y: 1092, w: 510, h: 325, radius: 36 }],
        texts: [
          { id: 'line1', label: 'Tên người thứ nhất', value: 'Tấn Nhã', xs: [220, 820], y: 1500, size: 52, fit: 360, color: '#ffffff', ff: '"YB Serif", Georgia, serif', weight: '600' },
          { id: 'sep', label: 'Ký tự nối', value: '+', xs: [290, 890], y: 1552, size: 36, color: '#ffffff', ff: '"YB Serif", Georgia, serif', weight: '600' },
          { id: 'line2', label: 'Tên người thứ hai', value: 'Huỳnh Như', xs: [370, 970], y: 1612, size: 52, fit: 360, color: '#ffffff', ff: '"YB Serif", Georgia, serif', weight: '600' },
          { id: 'date', label: 'Ngày', value: '05.07.2026', xs: [370, 970], y: 1660, size: 20, color: '#f2f6ef', ff: '"YB Serif", Georgia, serif', weight: '600', ls: 2 },
        ] },
      { id: 'C-crystal-white', name: 'Pha Lê Trắng', overlay: 'file:///C:/YoungBooth-Frames/C-crystal-white.png', thumb: 'file:///C:/YoungBooth-Frames/C-crystal-white-thumb.png', background: '#ffffff', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, cut2inch: true, qr: { size: 110, label: false, at: [{ x: 448, y: 1648 }, { x: 1048, y: 1648 }] },
        slots: [{ x: 30, y: 30, w: 540, h: 380 }, { x: 30, y: 422, w: 540, h: 380 }, { x: 30, y: 814, w: 540, h: 380 }, { x: 30, y: 1206, w: 540, h: 380 }, { x: 630, y: 30, w: 540, h: 380 }, { x: 630, y: 422, w: 540, h: 380 }, { x: 630, y: 814, w: 540, h: 380 }, { x: 630, y: 1206, w: 540, h: 380 }],
        texts: [] },
      { id: 'C-crystal-white-wide', name: 'Pha Lê Trắng – Ngang', overlay: 'file:///C:/YoungBooth-Frames/C-crystal-white-wide.png', thumb: 'file:///C:/YoungBooth-Frames/C-crystal-white-wide-thumb.png', background: '#ffffff', logo: null, showBrand: false, canvas: { w: 1800, h: 1200 }, cut2inch: true, qr: { size: 110, label: false, at: [{ x: 1640, y: 448 }, { x: 1640, y: 1048 }] },
        slots: [{ x: 24, y: 24, w: 427, h: 476 }, { x: 465, y: 24, w: 427, h: 476 }, { x: 906, y: 24, w: 427, h: 476 }, { x: 1347, y: 24, w: 427, h: 476 }, { x: 24, y: 624, w: 427, h: 476 }, { x: 465, y: 624, w: 427, h: 476 }, { x: 906, y: 624, w: 427, h: 476 }, { x: 1347, y: 624, w: 427, h: 476 }],
        texts: [] },
      { id: 'C-black-stars', name: 'Ngôi Sao Đen', overlay: 'file:///C:/YoungBooth-Frames/C-black-stars.png', thumb: 'file:///C:/YoungBooth-Frames/C-black-stars-thumb.png', background: '#ffffff', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, cut2inch: true, qr: { size: 110, label: false, at: [{ x: 448, y: 1648 }, { x: 1048, y: 1648 }] },
        slots: [{ x: 30, y: 30, w: 540, h: 380 }, { x: 30, y: 422, w: 540, h: 380 }, { x: 30, y: 814, w: 540, h: 380 }, { x: 30, y: 1206, w: 540, h: 380 }, { x: 630, y: 30, w: 540, h: 380 }, { x: 630, y: 422, w: 540, h: 380 }, { x: 630, y: 814, w: 540, h: 380 }, { x: 630, y: 1206, w: 540, h: 380 }],
        texts: [] },
      { id: 'C-black-stars-wide', name: 'Ngôi Sao Đen – Ngang', overlay: 'file:///C:/YoungBooth-Frames/C-black-stars-wide.png', thumb: 'file:///C:/YoungBooth-Frames/C-black-stars-wide-thumb.png', background: '#ffffff', logo: null, showBrand: false, canvas: { w: 1800, h: 1200 }, cut2inch: true, qr: { size: 110, label: false, at: [{ x: 1640, y: 448 }, { x: 1640, y: 1048 }] },
        slots: [{ x: 24, y: 90, w: 427, h: 486 }, { x: 465, y: 90, w: 427, h: 486 }, { x: 906, y: 90, w: 427, h: 486 }, { x: 1347, y: 90, w: 427, h: 486 }, { x: 24, y: 690, w: 427, h: 486 }, { x: 465, y: 690, w: 427, h: 486 }, { x: 906, y: 690, w: 427, h: 486 }, { x: 1347, y: 690, w: 427, h: 486 }],
        texts: [] },
      { id: 'C-gold-stars', name: 'Sao Kim Tuyến', overlay: 'file:///C:/YoungBooth-Frames/C-gold-stars.png', thumb: 'file:///C:/YoungBooth-Frames/C-gold-stars-thumb.png', background: '#ffffff', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, cut2inch: true, qr: { size: 110, label: false, at: [{ x: 448, y: 1648 }, { x: 1048, y: 1648 }] },
        slots: [{ x: 40, y: 150, w: 520, h: 390 }, { x: 40, y: 556, w: 520, h: 390 }, { x: 40, y: 962, w: 520, h: 390 }, { x: 40, y: 1368, w: 520, h: 390 }, { x: 640, y: 150, w: 520, h: 390 }, { x: 640, y: 556, w: 520, h: 390 }, { x: 640, y: 962, w: 520, h: 390 }, { x: 640, y: 1368, w: 520, h: 390 }],
        texts: [] },
      { id: 'C-gold-stars-wide', name: 'Sao Kim Tuyến – Ngang', overlay: 'file:///C:/YoungBooth-Frames/C-gold-stars-wide.png', thumb: 'file:///C:/YoungBooth-Frames/C-gold-stars-wide-thumb.png', background: '#ffffff', logo: null, showBrand: false, canvas: { w: 1800, h: 1200 }, cut2inch: true, qr: { size: 110, label: false, at: [{ x: 1640, y: 448 }, { x: 1640, y: 1048 }] },
        slots: [{ x: 30, y: 100, w: 424, h: 476 }, { x: 468, y: 100, w: 424, h: 476 }, { x: 906, y: 100, w: 424, h: 476 }, { x: 1344, y: 100, w: 424, h: 476 }, { x: 30, y: 700, w: 424, h: 476 }, { x: 468, y: 700, w: 424, h: 476 }, { x: 906, y: 700, w: 424, h: 476 }, { x: 1344, y: 700, w: 424, h: 476 }],
        texts: [] },
      { id: 'C-night-sky', name: 'Bầu Trời Sao', overlay: 'file:///C:/YoungBooth-Frames/C-night-sky.png', thumb: 'file:///C:/YoungBooth-Frames/C-night-sky-thumb.png', background: '#0b0b0d', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, cut2inch: true, qr: { size: 110, label: false, at: [{ x: 36, y: 1648 }, { x: 636, y: 1648 }] },
        slots: [{ x: 30, y: 30, w: 540, h: 380 }, { x: 30, y: 422, w: 540, h: 380 }, { x: 30, y: 814, w: 540, h: 380 }, { x: 30, y: 1206, w: 540, h: 380 }, { x: 630, y: 30, w: 540, h: 380 }, { x: 630, y: 422, w: 540, h: 380 }, { x: 630, y: 814, w: 540, h: 380 }, { x: 630, y: 1206, w: 540, h: 380 }],
        texts: [] },
      { id: 'C-night-sky-wide', name: 'Bầu Trời Sao – Ngang', overlay: 'file:///C:/YoungBooth-Frames/C-night-sky-wide.png', thumb: 'file:///C:/YoungBooth-Frames/C-night-sky-wide-thumb.png', background: '#0b0b0d', logo: null, showBrand: false, canvas: { w: 1800, h: 1200 }, cut2inch: true, qr: { size: 110, label: false, at: [{ x: 1640, y: 448 }, { x: 1640, y: 1048 }] },
        slots: [{ x: 24, y: 90, w: 427, h: 486 }, { x: 465, y: 90, w: 427, h: 486 }, { x: 906, y: 90, w: 427, h: 486 }, { x: 1347, y: 90, w: 427, h: 486 }, { x: 24, y: 690, w: 427, h: 486 }, { x: 465, y: 690, w: 427, h: 486 }, { x: 906, y: 690, w: 427, h: 486 }, { x: 1347, y: 690, w: 427, h: 486 }],
        texts: [] },
      { id: 'C-quoc-khanh', name: 'Quốc Khánh 02.09', hidden: true, holiday: 'quockhanh', textGroup: 'quockhanh', overlay: 'file:///C:/YoungBooth-Frames/C-quoc-khanh.png', thumb: 'file:///C:/YoungBooth-Frames/C-quoc-khanh-thumb.png', background: '#f8eedb', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, cut2inch: true, qr: { size: 110, label: false, at: [{ x: 40, y: 1648 }, { x: 640, y: 1648 }] },
        slots: [{ x: 50, y: 50, w: 500, h: 386 }, { x: 50, y: 448, w: 500, h: 386 }, { x: 50, y: 846, w: 500, h: 386 }, { x: 50, y: 1244, w: 500, h: 386 }, { x: 650, y: 50, w: 500, h: 386 }, { x: 650, y: 448, w: 500, h: 386 }, { x: 650, y: 846, w: 500, h: 386 }, { x: 650, y: 1244, w: 500, h: 386 }],
        texts: [
          { id: 'date', label: 'Ngày lễ', value: '02.09', xs: [40, 640], y: 862, size: 48, color: '#d42a2a', ff: '"Be Vietnam Pro", Arial, sans-serif', weight: '800', italic: true, align: 'left', stroke: '#ffffff', strokeW: 12, rotate: -4 },
          { id: 'title', label: 'Dòng chữ dưới', value: 'VIỆT NAM', xs: [390, 990], y: 1740, size: 48, fit: 250, color: '#d42a2a', ff: '"Be Vietnam Pro", Arial, sans-serif', weight: '800' },
        ] },
      { id: 'C-sunburst', name: 'Tia Nắng Pháo Hoa', overlay: 'file:///C:/YoungBooth-Frames/C-sunburst.png', thumb: 'file:///C:/YoungBooth-Frames/C-sunburst-thumb.png', background: '#f8eedb', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, cut2inch: true, qr: { size: 110, label: false, at: [{ x: 40, y: 1648 }, { x: 640, y: 1648 }] },
        slots: [{ x: 50, y: 50, w: 500, h: 386 }, { x: 50, y: 448, w: 500, h: 386 }, { x: 50, y: 846, w: 500, h: 386 }, { x: 50, y: 1244, w: 500, h: 386 }, { x: 650, y: 50, w: 500, h: 386 }, { x: 650, y: 448, w: 500, h: 386 }, { x: 650, y: 846, w: 500, h: 386 }, { x: 650, y: 1244, w: 500, h: 386 }],
        texts: [] },
      { id: 'C-qk-blue', name: 'Độc Lập – Xanh Nhạt', hidden: true, holiday: 'quockhanh', textGroup: 'qk-motto', overlay: 'file:///C:/YoungBooth-Frames/C-qk-blue.png', thumb: 'file:///C:/YoungBooth-Frames/C-qk-blue-thumb.png', background: '#d6e6f1', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, cut2inch: true, qr: { size: 110, label: false, at: [{ x: 234, y: 1648 }, { x: 834, y: 1648 }] },
        slots: [{ x: 40, y: 110, w: 520, h: 367 }, { x: 40, y: 501, w: 520, h: 367 }, { x: 40, y: 892, w: 520, h: 367 }, { x: 40, y: 1283, w: 520, h: 367 }, { x: 640, y: 110, w: 520, h: 367 }, { x: 640, y: 501, w: 520, h: 367 }, { x: 640, y: 892, w: 520, h: 367 }, { x: 640, y: 1283, w: 520, h: 367 }],
        texts: [
          { id: 'header', label: 'Khẩu hiệu trên', value: 'ĐỘC LẬP — TỰ DO — HẠNH PHÚC', xs: [100, 700], y: 80, size: 24, fit: 440, color: '#1f2a44', ff: 'Oswald, "Be Vietnam Pro", sans-serif', weight: '600', align: 'left' },
          { id: 'title', label: 'Chữ dưới trái', value: 'VIỆT NAM', xs: [100, 700], y: 1760, size: 26, fit: 120, color: '#1f2a44', ff: 'Oswald, "Be Vietnam Pro", sans-serif', weight: '600', align: 'left' },
          { id: 'years', label: 'Chữ dưới phải', value: '1945 - 2026', xs: [540, 1140], y: 1700, size: 24, fit: 180, color: '#1f2a44', ff: 'Oswald, "Be Vietnam Pro", sans-serif', weight: '600', align: 'right' },
        ] },
      { id: 'C-qk-red-gloss', name: 'Độc Lập – Đỏ Bóng', hidden: true, holiday: 'quockhanh', textGroup: 'qk-motto', overlay: 'file:///C:/YoungBooth-Frames/C-qk-red-gloss.png', thumb: 'file:///C:/YoungBooth-Frames/C-qk-red-gloss-thumb.png', background: '#d7261e', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, cut2inch: true, qr: { size: 110, label: false, at: [{ x: 234, y: 1648 }, { x: 834, y: 1648 }] },
        slots: [{ x: 40, y: 110, w: 520, h: 367 }, { x: 40, y: 501, w: 520, h: 367 }, { x: 40, y: 892, w: 520, h: 367 }, { x: 40, y: 1283, w: 520, h: 367 }, { x: 640, y: 110, w: 520, h: 367 }, { x: 640, y: 501, w: 520, h: 367 }, { x: 640, y: 892, w: 520, h: 367 }, { x: 640, y: 1283, w: 520, h: 367 }],
        texts: [
          { id: 'header', label: 'Khẩu hiệu trên', value: 'ĐỘC LẬP — TỰ DO — HẠNH PHÚC', xs: [100, 700], y: 80, size: 24, fit: 440, color: '#ffffff', ff: 'Oswald, "Be Vietnam Pro", sans-serif', weight: '600', align: 'left' },
          { id: 'title', label: 'Chữ dưới trái', value: 'VIỆT NAM', xs: [100, 700], y: 1760, size: 26, fit: 120, color: '#ffffff', ff: 'Oswald, "Be Vietnam Pro", sans-serif', weight: '600', align: 'left' },
          { id: 'years', label: 'Chữ dưới phải', value: '1945 - 2026', xs: [540, 1140], y: 1700, size: 24, fit: 180, color: '#ffffff', ff: 'Oswald, "Be Vietnam Pro", sans-serif', weight: '600', align: 'right' },
        ] },
      { id: 'C-qk-29', name: 'Quốc Khánh 2.9 – Đỏ Trắng', hidden: true, holiday: 'quockhanh', textGroup: 'qk-29', overlay: 'file:///C:/YoungBooth-Frames/C-qk-29.png', thumb: 'file:///C:/YoungBooth-Frames/C-qk-29-thumb.png', background: '#ffffff', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, cut2inch: true, qr: { size: 110, label: false, at: [{ x: 448, y: 1648 }, { x: 1048, y: 1648 }] },
        slots: [{ x: 40, y: 110, w: 520, h: 384 }, { x: 40, y: 508, w: 520, h: 384 }, { x: 40, y: 906, w: 520, h: 384 }, { x: 40, y: 1304, w: 520, h: 384 }, { x: 640, y: 110, w: 520, h: 384 }, { x: 640, y: 508, w: 520, h: 384 }, { x: 640, y: 906, w: 520, h: 384 }, { x: 640, y: 1304, w: 520, h: 384 }],
        texts: [
          { id: 'badge', label: 'Số lớn', value: '2.9', xs: [50, 650], y: 82, size: 44, color: '#d42a2a', ff: '"Be Vietnam Pro", Arial, sans-serif', weight: '800', align: 'left' },
          { id: 'header', label: 'Dòng trên', value: 'MỪNG QUỐC KHÁNH', xs: [330, 930], y: 76, size: 20, fit: 280, color: '#d42a2a', ff: '"Be Vietnam Pro", Arial, sans-serif', weight: '800', ls: 1 },
          { id: 'footer', label: 'Dòng dưới', value: 'VIỆT NAM TỰ HÀO', xs: [300, 900], y: 1760, size: 20, fit: 250, color: '#d42a2a', ff: '"Be Vietnam Pro", Arial, sans-serif', weight: '800', ls: 1 },
        ] },
      { id: 'C-qk-white-flags', name: 'Độc Lập – Trắng Cờ Hoa', hidden: true, holiday: 'quockhanh', textGroup: 'qk-white-flags', overlay: 'file:///C:/YoungBooth-Frames/C-qk-white-flags.png', thumb: 'file:///C:/YoungBooth-Frames/C-qk-white-flags-thumb.png', background: '#ffffff', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, cut2inch: true, qr: { size: 110, label: false, at: [{ x: 234, y: 1648 }, { x: 834, y: 1648 }] },
        slots: [{ x: 40, y: 170, w: 520, h: 359 }, { x: 40, y: 543, w: 520, h: 359 }, { x: 40, y: 916, w: 520, h: 359 }, { x: 40, y: 1289, w: 520, h: 359 }, { x: 640, y: 170, w: 520, h: 359 }, { x: 640, y: 543, w: 520, h: 359 }, { x: 640, y: 916, w: 520, h: 359 }, { x: 640, y: 1289, w: 520, h: 359 }],
        texts: [
          { id: 'kicker', label: 'Dòng nhỏ', value: 'Còn gì vui hơn ?', xs: [300, 900], y: 62, size: 22, color: '#1a1a1a', ff: '"Dancing Script", cursive', weight: '600' },
          { id: 'header', label: 'Dòng chính', value: 'Độc lập - Tự do', xs: [300, 900], y: 120, size: 38, fit: 330, color: '#1a1a1a', ff: '"Dancing Script", cursive', weight: '700' },
        ] },
      { id: 'C-qk-maroon', name: 'Độc Lập – Đỏ Thẫm Hoa Văn', hidden: true, holiday: 'quockhanh', textGroup: 'qk-maroon', overlay: 'file:///C:/YoungBooth-Frames/C-qk-maroon.png', thumb: 'file:///C:/YoungBooth-Frames/C-qk-maroon-thumb.png', background: '#8e1717', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, cut2inch: true, qr: { size: 110, label: false, at: [{ x: 448, y: 1648 }, { x: 1048, y: 1648 }] },
        slots: [{ x: 40, y: 110, w: 520, h: 370, radius: 36 }, { x: 40, y: 510, w: 520, h: 370, radius: 36 }, { x: 40, y: 910, w: 520, h: 370, radius: 36 }, { x: 40, y: 1310, w: 520, h: 370, radius: 36 }, { x: 640, y: 110, w: 520, h: 370, radius: 36 }, { x: 640, y: 510, w: 520, h: 370, radius: 36 }, { x: 640, y: 910, w: 520, h: 370, radius: 36 }, { x: 640, y: 1310, w: 520, h: 370, radius: 36 }],
        texts: [
          { id: 'header', label: 'Khẩu hiệu', value: 'ĐỘC LẬP - TỰ DO', xs: [560, 1160], y: 74, size: 24, fit: 330, color: '#ffd21f', ff: '"Be Vietnam Pro", Arial, sans-serif', weight: '800', align: 'right' },
        ] },
      { id: 'C-qk-bronze', name: 'Không Gì Quý Hơn Độc Lập Tự Do', hidden: true, holiday: 'quockhanh', textGroup: 'qk-bronze', overlay: 'file:///C:/YoungBooth-Frames/C-qk-bronze.png', thumb: 'file:///C:/YoungBooth-Frames/C-qk-bronze-thumb.png', background: '#7b5e2d', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, cut2inch: true, qr: { size: 110, label: false, at: [{ x: 448, y: 1648 }, { x: 1048, y: 1648 }] },
        slots: [{ x: 40, y: 40, w: 520, h: 369 }, { x: 40, y: 423, w: 520, h: 369 }, { x: 40, y: 806, w: 520, h: 369 }, { x: 40, y: 1189, w: 520, h: 369 }, { x: 640, y: 40, w: 520, h: 369 }, { x: 640, y: 423, w: 520, h: 369 }, { x: 640, y: 806, w: 520, h: 369 }, { x: 640, y: 1189, w: 520, h: 369 }],
        texts: [
          { id: 'quote', label: 'Câu trích', value: '“Không có gì quý hơn độc lập, tự do.”', xs: [330, 930], y: 1640, size: 24, w: 230, lh: 32, color: '#f1d58a', ff: '"YB Script", "Dancing Script", cursive' },
        ] },
      { id: 'C-qk-airmail', name: 'Thư Bưu Chính 2/9', hidden: true, holiday: 'quockhanh', textGroup: 'qk-airmail', overlay: 'file:///C:/YoungBooth-Frames/C-qk-airmail.png', thumb: 'file:///C:/YoungBooth-Frames/C-qk-airmail-thumb.png', background: '#f3ece0', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, cut2inch: true, qr: { size: 110, label: false, at: [{ x: 40, y: 1580 }, { x: 640, y: 1580 }] },
        slots: [{ x: 40, y: 40, w: 520, h: 323 }, { x: 40, y: 379, w: 520, h: 323 }, { x: 40, y: 718, w: 520, h: 323 }, { x: 40, y: 1057, w: 520, h: 323 }, { x: 640, y: 40, w: 520, h: 323 }, { x: 640, y: 379, w: 520, h: 323 }, { x: 640, y: 718, w: 520, h: 323 }, { x: 640, y: 1057, w: 520, h: 323 }],
        texts: [
          { id: 'para2', label: 'Đoạn dài', value: 'Chúc mừng ngày Quốc khánh 2/9 – cùng nhau lưu giữ khoảnh khắc tự hào.', xs: [44, 644], y: 1440, size: 22, w: 300, lh: 30, color: '#c8252b', ff: '"Noto Serif", Georgia, serif', weight: '700', align: 'left' },
        ] },
      { id: 'C-trungthu', name: 'Trung Thu', hidden: true, holiday: 'trungthu', textGroup: 'trungthu', overlay: 'file:///C:/YoungBooth-Frames/C-trungthu.png', thumb: 'file:///C:/YoungBooth-Frames/C-trungthu-thumb.png', background: '#4a2a9e', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, cut2inch: true, qr: { size: 110, label: false, at: [{ x: 448, y: 1648 }, { x: 1048, y: 1648 }] },
        slots: [{ x: 30, y: 60, w: 540, h: 374 }, { x: 30, y: 448, w: 540, h: 374 }, { x: 30, y: 836, w: 540, h: 374 }, { x: 30, y: 1224, w: 540, h: 374 }, { x: 630, y: 60, w: 540, h: 374 }, { x: 630, y: 448, w: 540, h: 374 }, { x: 630, y: 836, w: 540, h: 374 }, { x: 630, y: 1224, w: 540, h: 374 }],
        texts: [
          { id: 'title', label: 'Tiêu đề', value: 'Happy Mid Autumn', xs: [300, 900], y: 1690, size: 30, fit: 290, color: '#ffffff', ff: '"Baloo 2", "Be Vietnam Pro", sans-serif', weight: '700' },
        ] },
  ],
  D: [
      { id: 'D-std-white', name: 'Save The Date – Trắng', textGroup: 'std-white', overlay: 'file:///C:/YoungBooth-Frames/D-std-white.png', thumb: 'file:///C:/YoungBooth-Frames/D-std-white-thumb.png', background: '#ffffff', logo: null, showBrand: false, canvas: { w: 1800, h: 1200 }, cut2inch: true, noRotate: false, qr: { size: 120, label: false, at: [{ x: 1567, y: 420 }, { x: 1567, y: 1020 }] },
        slots: [{ x: 30, y: 30, w: 700, h: 540 }, { x: 754, y: 30, w: 700, h: 540 }, { x: 30, y: 630, w: 700, h: 540 }, { x: 754, y: 630, w: 700, h: 540 }],
        texts: [
          { id: 'line1', label: 'Tên dòng 1', value: 'Minh Thư', x: 1612, ys: [150, 750], size: 46, fit: 300, color: '#1a1a1a', ff: '"YB Script", "Dancing Script", cursive' },
          { id: 'line2', label: 'Tên dòng 2', value: 'Kuan Hsun', x: 1642, ys: [220, 820], size: 46, fit: 300, color: '#1a1a1a', ff: '"YB Script", "Dancing Script", cursive' },
          { id: 'date', label: 'Ngày', value: '09.07.2026', x: 1627, ys: [280, 880], size: 20, color: '#333333', ff: '"YB Serif", Georgia, serif', weight: '600', ls: 2 },
          { id: 'tagline', label: 'Dòng dưới ngày', value: 'SAVE THE DATE', x: 1627, ys: [315, 915], size: 18, color: '#333333', ff: '"YB Serif", Georgia, serif', weight: '600', ls: 3 },
        ] },
  ],
  F: [
      { id: 'F-crystal-white', name: 'Pha Lê Trắng', overlay: 'file:///C:/YoungBooth-Frames/F-crystal-white.png', thumb: 'file:///C:/YoungBooth-Frames/F-crystal-white-thumb.png', background: '#ffffff', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, qr: { size: 120, label: false, at: [{ x: 1036, y: 1636 }] },
        slots: [{ x: 36, y: 36, w: 557, h: 760 }, { x: 607, y: 36, w: 557, h: 760 }, { x: 36, y: 810, w: 557, h: 760 }, { x: 607, y: 810, w: 557, h: 760 }],
        texts: [] },
      { id: 'F-crystal-pink', name: 'Pha Lê Hồng', overlay: 'file:///C:/YoungBooth-Frames/F-crystal-pink.png', thumb: 'file:///C:/YoungBooth-Frames/F-crystal-pink-thumb.png', background: '#ffffff', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, qr: { size: 120, label: false, at: [{ x: 1036, y: 1636 }] },
        slots: [{ x: 36, y: 36, w: 557, h: 760 }, { x: 607, y: 36, w: 557, h: 760 }, { x: 36, y: 810, w: 557, h: 760 }, { x: 607, y: 810, w: 557, h: 760 }],
        texts: [] },
      { id: 'F-black-stars', name: 'Ngôi Sao Đen', overlay: 'file:///C:/YoungBooth-Frames/F-black-stars.png', thumb: 'file:///C:/YoungBooth-Frames/F-black-stars-thumb.png', background: '#ffffff', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, qr: { size: 120, label: false, at: [{ x: 1036, y: 1636 }] },
        slots: [{ x: 36, y: 36, w: 557, h: 760 }, { x: 607, y: 36, w: 557, h: 760 }, { x: 36, y: 810, w: 557, h: 760 }, { x: 607, y: 810, w: 557, h: 760 }],
        texts: [] },
      { id: 'F-black-stars-dense', name: 'Ngôi Sao Dày', overlay: 'file:///C:/YoungBooth-Frames/F-black-stars-dense.png', thumb: 'file:///C:/YoungBooth-Frames/F-black-stars-dense-thumb.png', background: '#ffffff', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, qr: { size: 120, label: false, at: [{ x: 1036, y: 1636 }] },
        slots: [{ x: 36, y: 36, w: 557, h: 760 }, { x: 607, y: 36, w: 557, h: 760 }, { x: 36, y: 810, w: 557, h: 760 }, { x: 607, y: 810, w: 557, h: 760 }],
        texts: [] },
      { id: 'F-gold-stars', name: 'Sao Kim Tuyến', overlay: 'file:///C:/YoungBooth-Frames/F-gold-stars.png', thumb: 'file:///C:/YoungBooth-Frames/F-gold-stars-thumb.png', background: '#ffffff', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, qr: { size: 120, label: false, at: [{ x: 1020, y: 1636 }] },
        slots: [{ x: 60, y: 160, w: 533, h: 733 }, { x: 607, y: 160, w: 533, h: 733 }, { x: 60, y: 907, w: 533, h: 733 }, { x: 607, y: 907, w: 533, h: 733 }],
        texts: [] },
      { id: 'F-gold-stars-blush', name: 'Sao Kim Tuyến Hồng', overlay: 'file:///C:/YoungBooth-Frames/F-gold-stars-blush.png', thumb: 'file:///C:/YoungBooth-Frames/F-gold-stars-blush-thumb.png', background: '#fdeef0', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, qr: { size: 120, label: false, at: [{ x: 1020, y: 1636 }] },
        slots: [{ x: 60, y: 160, w: 533, h: 733 }, { x: 607, y: 160, w: 533, h: 733 }, { x: 60, y: 907, w: 533, h: 733 }, { x: 607, y: 907, w: 533, h: 733 }],
        texts: [] },
      { id: 'F-night-sky', name: 'Bầu Trời Sao', overlay: 'file:///C:/YoungBooth-Frames/F-night-sky.png', thumb: 'file:///C:/YoungBooth-Frames/F-night-sky-thumb.png', background: '#0b0b0d', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, qr: { size: 120, label: false, at: [{ x: 36, y: 1636 }] },
        slots: [{ x: 36, y: 36, w: 557, h: 760 }, { x: 607, y: 36, w: 557, h: 760 }, { x: 36, y: 810, w: 557, h: 760 }, { x: 607, y: 810, w: 557, h: 760 }],
        texts: [] },
      { id: 'F-night-sky-violet', name: 'Bầu Trời Sao – Tím Đêm', overlay: 'file:///C:/YoungBooth-Frames/F-night-sky-violet.png', thumb: 'file:///C:/YoungBooth-Frames/F-night-sky-violet-thumb.png', background: '#140d2a', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, qr: { size: 120, label: false, at: [{ x: 36, y: 1636 }] },
        slots: [{ x: 36, y: 36, w: 557, h: 760 }, { x: 607, y: 36, w: 557, h: 760 }, { x: 36, y: 810, w: 557, h: 760 }, { x: 607, y: 810, w: 557, h: 760 }],
        texts: [] },
      { id: 'F-quoc-khanh', name: 'Quốc Khánh 02.09', hidden: true, holiday: 'quockhanh', textGroup: 'quockhanh', overlay: 'file:///C:/YoungBooth-Frames/F-quoc-khanh.png', thumb: 'file:///C:/YoungBooth-Frames/F-quoc-khanh-thumb.png', background: '#f8eedb', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, qr: { size: 120, label: false, at: [{ x: 36, y: 1636 }] },
        slots: [{ x: 70, y: 70, w: 523, h: 763 }, { x: 607, y: 70, w: 523, h: 763 }, { x: 70, y: 847, w: 523, h: 763 }, { x: 607, y: 847, w: 523, h: 763 }],
        texts: [
          { id: 'date', label: 'Ngày lễ', value: '02.09', x: 40, y: 868, size: 64, color: '#d42a2a', ff: '"Be Vietnam Pro", Arial, sans-serif', weight: '800', italic: true, align: 'left', stroke: '#ffffff', strokeW: 12, rotate: -4 },
          { id: 'title', label: 'Dòng chữ dưới', value: 'VIỆT NAM', x: 600, y: 1730, size: 72, fit: 420, color: '#d42a2a', ff: '"Be Vietnam Pro", Arial, sans-serif', weight: '800' },
        ] },
      { id: 'F-qk-blue', name: 'Độc Lập – Xanh Nhạt', hidden: true, holiday: 'quockhanh', textGroup: 'qk-motto', overlay: 'file:///C:/YoungBooth-Frames/F-qk-blue.png', thumb: 'file:///C:/YoungBooth-Frames/F-qk-blue-thumb.png', background: '#d6e6f1', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, qr: { size: 120, label: false, at: [{ x: 528, y: 1636 }] },
        slots: [{ x: 50, y: 120, w: 538, h: 753 }, { x: 612, y: 120, w: 538, h: 753 }, { x: 50, y: 897, w: 538, h: 753 }, { x: 612, y: 897, w: 538, h: 753 }],
        texts: [
          { id: 'header', label: 'Khẩu hiệu trên', value: 'ĐỘC LẬP — TỰ DO — HẠNH PHÚC', x: 130, y: 92, size: 34, fit: 960, color: '#1f2a44', ff: 'Oswald, "Be Vietnam Pro", sans-serif', weight: '600', align: 'left' },
          { id: 'title', label: 'Chữ dưới trái', value: 'VIỆT NAM', x: 140, y: 1730, size: 34, fit: 360, color: '#1f2a44', ff: 'Oswald, "Be Vietnam Pro", sans-serif', weight: '600', align: 'left' },
          { id: 'years', label: 'Chữ dưới phải', value: '1945 - 2026', x: 1090, y: 1730, size: 34, fit: 360, color: '#1f2a44', ff: 'Oswald, "Be Vietnam Pro", sans-serif', weight: '600', align: 'right' },
        ] },
      { id: 'F-qk-red-gloss', name: 'Độc Lập – Đỏ Bóng', hidden: true, holiday: 'quockhanh', textGroup: 'qk-motto', overlay: 'file:///C:/YoungBooth-Frames/F-qk-red-gloss.png', thumb: 'file:///C:/YoungBooth-Frames/F-qk-red-gloss-thumb.png', background: '#d7261e', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, qr: { size: 120, label: false, at: [{ x: 528, y: 1636 }] },
        slots: [{ x: 50, y: 120, w: 538, h: 753 }, { x: 612, y: 120, w: 538, h: 753 }, { x: 50, y: 897, w: 538, h: 753 }, { x: 612, y: 897, w: 538, h: 753 }],
        texts: [
          { id: 'header', label: 'Khẩu hiệu trên', value: 'ĐỘC LẬP — TỰ DO — HẠNH PHÚC', x: 130, y: 92, size: 34, fit: 960, color: '#ffffff', ff: 'Oswald, "Be Vietnam Pro", sans-serif', weight: '600', align: 'left' },
          { id: 'title', label: 'Chữ dưới trái', value: 'VIỆT NAM', x: 140, y: 1730, size: 34, fit: 360, color: '#ffffff', ff: 'Oswald, "Be Vietnam Pro", sans-serif', weight: '600', align: 'left' },
          { id: 'years', label: 'Chữ dưới phải', value: '1945 - 2026', x: 1090, y: 1730, size: 34, fit: 360, color: '#ffffff', ff: 'Oswald, "Be Vietnam Pro", sans-serif', weight: '600', align: 'right' },
        ] },
      { id: 'F-qk-29', name: 'Quốc Khánh 2.9 – Đỏ Trắng', hidden: true, holiday: 'quockhanh', textGroup: 'qk-29', overlay: 'file:///C:/YoungBooth-Frames/F-qk-29.png', thumb: 'file:///C:/YoungBooth-Frames/F-qk-29-thumb.png', background: '#ffffff', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, qr: { size: 120, label: false, at: [{ x: 1036, y: 1636 }] },
        slots: [{ x: 50, y: 130, w: 544, h: 764 }, { x: 606, y: 130, w: 544, h: 764 }, { x: 50, y: 906, w: 544, h: 764 }, { x: 606, y: 906, w: 544, h: 764 }],
        texts: [
          { id: 'badge', label: 'Số lớn', value: '2.9', x: 70, y: 100, size: 64, color: '#d42a2a', ff: '"Be Vietnam Pro", Arial, sans-serif', weight: '800', align: 'left' },
          { id: 'header', label: 'Dòng trên', value: 'MỪNG QUỐC KHÁNH', x: 720, y: 96, size: 28, fit: 520, color: '#d42a2a', ff: '"Be Vietnam Pro", Arial, sans-serif', weight: '800', ls: 1 },
          { id: 'footer', label: 'Dòng dưới', value: 'VIỆT NAM TỰ HÀO', x: 640, y: 1722, size: 28, fit: 520, color: '#d42a2a', ff: '"Be Vietnam Pro", Arial, sans-serif', weight: '800', ls: 1 },
        ] },
      { id: 'F-qk-white-flags', name: 'Độc Lập – Trắng Cờ Hoa', hidden: true, holiday: 'quockhanh', textGroup: 'qk-white-flags', overlay: 'file:///C:/YoungBooth-Frames/F-qk-white-flags.png', thumb: 'file:///C:/YoungBooth-Frames/F-qk-white-flags-thumb.png', background: '#ffffff', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, qr: { size: 120, label: false, at: [{ x: 528, y: 1636 }] },
        slots: [{ x: 50, y: 170, w: 542, h: 732 }, { x: 608, y: 170, w: 542, h: 732 }, { x: 50, y: 918, w: 542, h: 732 }, { x: 608, y: 918, w: 542, h: 732 }],
        texts: [
          { id: 'kicker', label: 'Dòng nhỏ', value: 'Còn gì vui hơn ?', x: 600, y: 70, size: 30, color: '#1a1a1a', ff: '"Dancing Script", cursive', weight: '600' },
          { id: 'header', label: 'Dòng chính', value: 'Độc lập - Tự do', x: 600, y: 132, size: 52, fit: 760, color: '#1a1a1a', ff: '"Dancing Script", cursive', weight: '700' },
        ] },
      { id: 'F-qk-maroon', name: 'Độc Lập – Đỏ Thẫm Hoa Văn', hidden: true, holiday: 'quockhanh', textGroup: 'qk-maroon', overlay: 'file:///C:/YoungBooth-Frames/F-qk-maroon.png', thumb: 'file:///C:/YoungBooth-Frames/F-qk-maroon-thumb.png', background: '#8e1717', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, qr: { size: 120, label: false, at: [{ x: 1036, y: 1636 }] },
        slots: [{ x: 40, y: 110, w: 550, h: 780, radius: 40 }, { x: 610, y: 110, w: 550, h: 780, radius: 40 }, { x: 40, y: 910, w: 550, h: 780, radius: 40 }, { x: 610, y: 910, w: 550, h: 780, radius: 40 }],
        texts: [
          { id: 'header', label: 'Khẩu hiệu', value: 'ĐỘC LẬP - TỰ DO', x: 1150, y: 82, size: 34, fit: 760, color: '#ffd21f', ff: '"Be Vietnam Pro", Arial, sans-serif', weight: '800', align: 'right' },
        ] },
      { id: 'F-qk-bronze', name: 'Không Gì Quý Hơn Độc Lập Tự Do', hidden: true, holiday: 'quockhanh', textGroup: 'qk-bronze', overlay: 'file:///C:/YoungBooth-Frames/F-qk-bronze.png', thumb: 'file:///C:/YoungBooth-Frames/F-qk-bronze-thumb.png', background: '#7b5e2d', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, qr: { size: 120, label: false, at: [{ x: 60, y: 1636 }] },
        slots: [{ x: 40, y: 40, w: 553, h: 708 }, { x: 607, y: 40, w: 553, h: 708 }, { x: 40, y: 762, w: 553, h: 708 }, { x: 607, y: 762, w: 553, h: 708 }],
        texts: [
          { id: 'quote', label: 'Câu trích', value: '“Không có gì quý hơn độc lập, tự do.”', x: 560, y: 1600, size: 32, w: 360, lh: 44, color: '#f1d58a', ff: '"YB Script", "Dancing Script", cursive' },
          { id: 'kicker', label: 'Dòng 1', value: 'CHÀO MỪNG', x: 1150, y: 1560, size: 18, color: '#f1d58a', ff: '"Be Vietnam Pro", Arial, sans-serif', weight: '700', ls: 2, align: 'right' },
          { id: 'header', label: 'Dòng 2', value: 'QUỐC KHÁNH', x: 1150, y: 1592, size: 22, color: '#f1d58a', ff: '"Be Vietnam Pro", Arial, sans-serif', weight: '700', ls: 2, align: 'right' },
          { id: 'title', label: 'Dòng 3', value: 'VIỆT NAM', x: 1150, y: 1630, size: 30, color: '#f1d58a', ff: '"Be Vietnam Pro", Arial, sans-serif', weight: '800', align: 'right' },
          { id: 'badge', label: 'Số lớn', value: '2-9', x: 1150, y: 1730, size: 90, color: '#f1d58a', ff: '"Be Vietnam Pro", Arial, sans-serif', weight: '800', align: 'right' },
        ] },
      { id: 'F-qk-airmail', name: 'Thư Bưu Chính 2/9 (3 ảnh)', hidden: true, holiday: 'quockhanh', textGroup: 'qk-airmail', overlay: 'file:///C:/YoungBooth-Frames/F-qk-airmail.png', thumb: 'file:///C:/YoungBooth-Frames/F-qk-airmail-thumb.png', background: '#f3ece0', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, qr: { size: 120, label: false, at: [{ x: 1030, y: 1630 }] },
        slots: [{ x: 60, y: 60, w: 528, h: 693 }, { x: 612, y: 60, w: 528, h: 693 }, { x: 60, y: 777, w: 528, h: 693 }],
        texts: [
          { id: 'para1', label: 'Đoạn ngắn', value: '2/9 – Ngày Quốc khánh nước Việt Nam.', x: 640, y: 830, size: 32, w: 480, lh: 42, color: '#c8252b', ff: '"Noto Serif", Georgia, serif', weight: '700', align: 'left' },
          { id: 'para2', label: 'Đoạn dài', value: 'Chúc mừng ngày Quốc khánh 2/9 – cùng nhau lưu giữ khoảnh khắc tự hào.', x: 60, y: 1545, size: 30, w: 1080, lh: 42, color: '#c8252b', ff: '"Noto Serif", Georgia, serif', weight: '700', align: 'left' },
        ] },
      { id: 'F-trungthu', name: 'Trung Thu', hidden: true, holiday: 'trungthu', textGroup: 'trungthu', overlay: 'file:///C:/YoungBooth-Frames/F-trungthu.png', thumb: 'file:///C:/YoungBooth-Frames/F-trungthu-thumb.png', background: '#4a2a9e', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, qr: { size: 120, label: false, at: [{ x: 1036, y: 1636 }] },
        slots: [{ x: 50, y: 70, w: 547, h: 762 }, { x: 603, y: 70, w: 547, h: 762 }, { x: 50, y: 838, w: 547, h: 762 }, { x: 603, y: 838, w: 547, h: 762 }],
        texts: [
          { id: 'title', label: 'Tiêu đề', value: 'Happy Mid Autumn', x: 640, y: 1690, size: 42, fit: 560, color: '#ffffff', ff: '"Baloo 2", "Be Vietnam Pro", sans-serif', weight: '700' },
        ] },
  ],
};
// Thư viện khung SỰ KIỆN (có thêm trường mode). Chỉ hiện trong Luồng sự kiện khi sự kiện đang chạy chọn khung đó.
const EVENT_FRAMES = [
      { id: 'EV-C-orientation', mode: 'C', name: 'Orientation Day', photos: 3, textGroup: 'event-orientation', overlay: 'file:///C:/YoungBooth-Frames/events/orientation/C-orientation.png', thumb: 'file:///C:/YoungBooth-Frames/events/orientation/C-orientation-thumb.png', background: '#3fb6e8', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, cut2inch: true, qr: { size: 110, label: false, at: [{ x: 448, y: 1648 }, { x: 1048, y: 1648 }] },
        slots: [{ x: 36, y: 130, w: 528, h: 418 }, { x: 36, y: 566, w: 528, h: 418 }, { x: 36, y: 1002, w: 528, h: 418 }, { x: 636, y: 130, w: 528, h: 418 }, { x: 636, y: 566, w: 528, h: 418 }, { x: 636, y: 1002, w: 528, h: 418 }],
        texts: [
          { id: 'title', label: 'Tên sự kiện', value: 'ORIENTATION', xs: [330, 930], y: 1500, size: 52, color: '#ffffff', ff: '"Be Vietnam Pro", Arial, sans-serif', weight: '800', italic: true, stroke: '#1d3a8a', strokeW: 10, rotate: -6 },
          { id: 'title2', label: 'Chữ phụ tên sự kiện', value: 'day', xs: [470, 1070], y: 1515, size: 36, color: '#ffffff', ff: '"Dancing Script", cursive', weight: '700', stroke: '#1d3a8a', strokeW: 8, rotate: -6 },
          { id: 'tagline', label: 'Khẩu hiệu', value: 'Future Starts Here', xs: [320, 920], y: 1548, size: 22, color: '#ffffff', ff: '"Be Vietnam Pro", Arial, sans-serif', weight: '700', stroke: '#1d3a8a', strokeW: 6, rotate: -6 },
        ] },
      { id: 'EV-B-orientation', mode: 'B', name: 'Orientation Day (dọc)', photos: 2, textGroup: 'event-orientation', overlay: 'file:///C:/YoungBooth-Frames/events/orientation/B-orientation.png', thumb: 'file:///C:/YoungBooth-Frames/events/orientation/B-orientation-thumb.png', background: '#3fb6e8', logo: null, showBrand: false, canvas: { w: 1200, h: 1800 }, paper: '4x6', noRotate: false, qr: { size: 120, label: false, at: [{ x: 1036, y: 1636 }] },
        slots: [{ x: 50, y: 150, w: 1100, h: 600 }, { x: 50, y: 780, w: 1100, h: 600 }],
        texts: [
          { id: 'title', label: 'Tên sự kiện', value: 'ORIENTATION', x: 600, y: 1540, size: 84, color: '#ffffff', ff: '"Be Vietnam Pro", Arial, sans-serif', weight: '800', italic: true, stroke: '#1d3a8a', strokeW: 10, rotate: -6 },
          { id: 'title2', label: 'Chữ phụ tên sự kiện', value: 'day', x: 830, y: 1560, size: 56, color: '#ffffff', ff: '"Dancing Script", cursive', weight: '700', stroke: '#1d3a8a', strokeW: 8, rotate: -6 },
          { id: 'tagline', label: 'Khẩu hiệu', value: 'Future Starts Here', x: 590, y: 1600, size: 34, color: '#ffffff', ff: '"Be Vietnam Pro", Arial, sans-serif', weight: '700', stroke: '#1d3a8a', strokeW: 6, rotate: -6 },
        ] },
];
const FRAME_TEXT_GROUPS = {
  'std-white': 'Khung Save The Date (Nhật Ký · Chia Đôi · Ngọt Ngào)',
  'clover-sage': 'Khung Cỏ Bốn Lá (Khoảnh Khắc · Nhật Ký)',
  'event-orientation': 'Khung Orientation Day (khung sự kiện)',
  'quockhanh': 'Khung Quốc Khánh 02.09 (Nhật Ký · Dịu Dàng)',
  'qk-motto': 'Khung Độc Lập (Xanh Nhạt · Đỏ Bóng) (Nhật Ký · Dịu Dàng)',
  'qk-29': 'Khung Quốc Khánh 2.9 – Đỏ Trắng (Nhật Ký · Dịu Dàng)',
  'qk-white-flags': 'Khung Trắng Cờ Hoa (Nhật Ký · Dịu Dàng)',
  'qk-maroon': 'Khung Đỏ Thẫm Hoa Văn (Nhật Ký · Dịu Dàng)',
  'qk-bronze': 'Khung Không Gì Quý Hơn Độc Lập Tự Do (Nhật Ký · Dịu Dàng)',
  'qk-airmail': 'Khung Thư Bưu Chính 2/9 (Nhật Ký · Dịu Dàng)',
  'trungthu': 'Khung Trung Thu (Nhật Ký · Dịu Dàng)',
};
// ==== HẾT KHUNG MỚI (tự sinh)

const BOOTH_CONFIG = {
  brand: {
    title: 'YOUNG BOOTH',
    footer: 'YOUNG BOOTH',      // chữ in dưới khung ảnh
    tagline: 'Chụp ảnh theo phong cách của bạn', // dòng nhỏ dưới ngày
    subFooter: '',              // dòng phụ (vd: tên sự kiện). Trống = tự điền ngày.
    logoEmoji: '📸',
    accent1: '#8B5CF6',         // tím tươi
    accent2: '#EC4899',         // hồng
    accent3: '#FB923C',         // cam ấm (điểm cuối gradient)
    gold: '#F7D774',            // vàng gold cho nét sang
    brandTextColor: '#1665D8',  // màu xanh thương hiệu cho chữ YOUNG BOOTH (sửa đúng mã của anh)
    frameStyle: 'gradient',     // 'gradient' = nền khung gradient tươi | 'white' = nền trắng cổ điển
    photoRadius: 26,            // bo góc ảnh (px)
  },

  camera: {
    // 'webcam' = webcam/laptop cam | 'canon' = máy ảnh Canon (DSLR/mirrorless)
    source: 'canon',
    mirror: true,               // gương như selfie (chỉ áp cho webcam)
    width: 1920,
    height: 1080,
    canon: {
      provider: 'edsdk',        // 'dcc' = digiCamControl | 'edsdk' = native EDSDK (khuyên cho R50)
      dccUrl: 'http://127.0.0.1:5513', // webserver digiCamControl (IPv4)
      liveViewFps: 12,          // số khung liveview/giây
      fullResPhoto: true,       // ảnh (A/B/C/D/F) chụp FULL-RES bằng màn trập; GIF/Boom lấy liveview
      dccAutoLaunch: true,      // app tự mở digiCamControl khi khởi động (nếu chưa chạy)
      dccExe: '',               // đường dẫn CameraControl.exe (để trống = tự dò vị trí cài phổ biến)
    },
  },

  // Dải hiển thị ở màn hình chờ: thẻ Ưu đãi (HTML) + ảnh mẫu khung.
  home: {
    // Thẻ "Ưu đãi & Chính sách" (Khung 1). Sửa nội dung ở đây.
    promo: {
      enabled: true,
      title: 'ƯU ĐÃI & CHÍNH SÁCH',
      brand: 'YOUNG BOOTH',
      offersTitle: 'Ưu đãi',
      offers: [
        'Mỗi lượt tặng 01 bản in thêm',
        'Nhóm từ 4 người: giảm 10%',
        'Tặng ảnh GIF khi check-in Fanpage',
        'Khách cũ quay lại: giảm 15.000đ',
      ],
      policiesTitle: 'Chính sách',
      policies: [
        'Nhiều kiểu khung để chọn',
        'Ảnh lưu cloud, quét QR tải về',
        'Giữ gìn đạo cụ, không mang ra ngoài',
        'Mỗi lượt tối đa 6 người',
      ],
    },
    // Thẻ "Bảng giá" (Khung giữa). Sửa giá/nội dung ở đây.
    pricing: {
      enabled: true,
      title: 'BẢNG GIÁ',
      brand: 'YOUNG BOOTH',
      packages: [
        { name: 'GÓI MINI',     price: '3.000.000đ', color: '#2f8fd0', note: '2 giờ · in 120 ảnh · 1 nhân sự' },
        { name: 'GÓI BASIC',    price: '3.500.000đ', color: '#2bbd7e', note: '2.5 giờ · in 200 ảnh · phụ kiện + sổ dán' },
        { name: 'GÓI PRO',      price: '4.200.000đ', color: '#f3a52a', popular: true, note: '3 giờ · in không giới hạn · tranh 40×60' },
        { name: 'GÓI PREMIUM',  price: '5.000.000đ', color: '#e84c9a', note: '3.5 giờ · in không giới hạn · đồ VIP' },
      ],
    },
    // Thẻ "Sự kiện khung fanclub" (Khung 3) — phong cách poster giấy.
    event: {
      enabled: true,
      month: 'Tháng 10',
      brandLeft: 'FANCLUB\nFRAME EVENT',
      brandRight: 'YOUNG BOOTH\nVIỆT NAM',
      // TODO: thay danh sách khung fanclub tháng 10 (đang giữ tạm danh sách tháng 9).
      periods: [
        { range: '01.10 ~ 15.10', items: ['Jungkook', 'NCT Haechan', 'StrayKids Han', 'Jimmy & Sea', 'Sungho'] },
        { range: '16.10 ~ 31.10', items: ['Faker & Peanut', 'Keria', 'BLG Bin', 'Thiều Bảo Trâm', 'Doran'] },
      ],
      note: '(*) Áp dụng tại các cửa hàng YOUNG BOOTH Việt Nam',
    },
    showcase: {
      enabled: true,
      title: 'MẪU KHUNG ẢNH',
      images: [],
    },
  },

  countdownSeconds: 3,   // đếm ngược cho kiểu GIF/Boomerang
  prepSeconds: 10,       // thời gian chuẩn bị + đếm ngược trước MỖI ảnh (kiểu ảnh)
  showCaptureGuide: true, // khung nét đứt trên màn chụp = vùng sẽ được in (tránh cắt mất người)
  reviewShots: true,      // sau khi chụp loạt ảnh → cho XEM LẠI + CHỤP LẠI từng tấm trước khi ghép

  // Làm đẹp: mịn da + làm nét. 0 = tắt, 1 = mạnh.
  beauty: {
    enabled: true,       // bật sẵn (có nút bật/tắt ở màn kết quả)
    smooth: 0.45,        // mịn da (0–1)
    sharpen: 0.35,       // làm nét (0–1)
    glow: 0.05,          // sáng da nhẹ (0–1)
  },

  // Sticker dán lên ảnh (màn kết quả). emojis = mặc định; images = PNG trong renderer/stickers/.
  stickers: {
    // Prop chữ tiệc/quẩy (SVG tự vẽ) — hiện trước, rồi tới emoji.
    images: [
      'stickers/trai-tim-doodle.svg',
      'stickers/sparkle-doodle.svg',
      'stickers/umbala.svg',
      'stickers/quay-len-nao.svg',
      'stickers/quay-kho-mau.svg',
      'stickers/mai-ben-nhau.svg',
      'stickers/cheers.svg',
      'stickers/123-dzo.svg',
      'stickers/kinh-trai-tim.svg',
      'stickers/bien-10-diem.svg',
      'stickers/vuong-mien.svg',
      'stickers/ria-mep.svg',
      'stickers/bom-tai-tho.svg',
      'stickers/ngoi-sao.svg',
    ],
    emojis: ['😎', '🥳', '😍', '🤩', '😂', '❤️', '🔥', '⭐', '🎉', '🎂', '👑', '🕶️', '💯', '🦄', '🌈', '✨', '💖', '🎈', '🍾', '💋', '🌸', '🐶'],
  },

  // Bộ lọc màu (CSS filter). Áp cho ảnh & GIF, đổi được cả sau khi chụp.
  filters: [
    { id: 'none',    name: 'Gốc',       css: 'none' },
    { id: 'bw',      name: 'Đen trắng', css: 'grayscale(1) contrast(1.05)' },
    { id: 'sepia',   name: 'Nâu',       css: 'sepia(0.7) saturate(1.1) contrast(1.05)' },
    { id: 'warm',    name: 'Ấm',        css: 'saturate(1.2) sepia(0.15) brightness(1.03) contrast(1.05)' },
    { id: 'cool',    name: 'Lạnh',      css: 'saturate(1.05) hue-rotate(-12deg) brightness(1.02)' },
    { id: 'vivid',   name: 'Rực rỡ',    css: 'saturate(1.55) contrast(1.15)' },
    { id: 'vintage', name: 'Cổ điển',   css: 'sepia(0.35) saturate(0.85) contrast(0.95) brightness(1.05)' },
  ],

  // Kiểu chụp.
  //  captureCount = số ảnh CHỤP; select = số ảnh user CHỌN để ghép; layout = cách ghép khung.
  //  (captureCount > select → hiện màn hình chọn ảnh sau khi chụp)
  // Bộ layout chuẩn photobooth (4×6" và 2×6"). cols×rows = số ô ảnh.
  // captureCount = select = số ô → chụp đúng số ô, không có bước chọn.
  // Mỗi Layout = 1 KHUNG ĐẸP thiết kế sẵn (PNG ngoài ở C:\YoungBooth-Frames).
  // PNG phải 1200×1800, CHỪA TRONG SUỐT đúng các ô ảnh (slots); đổi khung = thay PNG, không build lại.
  modes: [
    // Layout A — Khoảnh Khắc: GALLERY sang trọng (nền navy nhung, 2 lớp viền vàng đồng, góc art-deco).
    // Khung: make_a() trong scripts/make-frames.py — slots PHẢI khớp SLOTS['A'].
    { id: 'A', name: 'Khoảnh Khắc', icon: '🖼️', desc: '4×6" · 1 ảnh', kind: 'photo',
      captureCount: 1, select: 1,
      canvas: { w: 1200, h: 1800 },
      background: '#1C2541',
      slots: [
        { x: 60, y: 150, w: 1080, h: 1390, radius: 0 },
      ],
      overlay: 'file:///C:/YoungBooth-Frames/grid1-dark.png',
      // Khung cho nút "Chọn khung" ở màn kết quả. frames[0] = khung mặc định (giá trị của chính kiểu chụp này).
      // Thêm khung: 1 phần tử { id, name, overlay, … } (xem FRAMES_GUIDE.md).
      frames: [
        { id: 'A-default', name: 'Gallery Navy' },
        ...FRAME_SETS.A,   // khung mới (tự sinh ở đầu file)
      ],
      showBrand: false,
      qr: { xs: [994], y: 1586, width: 136, label: '' },   // QR trong footer, thẳng viền ngoài bên phải
      // Logo giữa header (thay file C:\YoungBooth-Frames\logo.png để đổi logo).
      logo: { src: 'file:///C:/YoungBooth-Frames/logo.png', center: true, y: 44, h: 74 },
      texts: [
        { id: 'brand', label: 'Chữ thương hiệu (footer)', value: 'YoungBooth',
          x: 600, y: 1648, size: 62, color: '#C9A961', ff: '"Segoe Script", cursive', weight: '700' },
        { id: 'date', label: 'Ngày', value: '',
          x: 600, y: 1712, size: 22, color: '#E8E1D3', ff: 'Arial, sans-serif', weight: '600', ls: 10 },
        { id: 'qrhint', label: 'Dòng hướng dẫn QR', value: 'Quét QR lấy ảnh + GIF · lưu 3 ngày',
          x: 600, y: 1746, size: 17, color: 'rgba(232,225,211,0.75)', ff: 'Arial, sans-serif', weight: '600', ls: 1 },
      ],
    },

    // Layout B — Ngọt Ngào: giấy 6×4 NGANG, 2 tấm cắt đôi ở x=900 (mỗi tấm hoàn chỉnh: viền ren riêng).
    // Mỗi tấm: logo + 1 ảnh bo góc + hoa hồng + "YoungBooth" (script) + ngày + QR. Khổ 6×4 ngang → noRotate.
    // Khung: make_b() trong scripts/make-frames.py — slots PHẢI khớp SLOTS['B'].
    { id: 'B', name: 'Ngọt Ngào', icon: '💞', desc: '6×4" · 2 ảnh (ngang)', kind: 'photo',
      captureCount: 2, select: 2,
      canvas: { w: 1800, h: 1200 },
      background: '#FBF1EE',
      paper: '6x4',
      noRotate: true,
      slots: [
        { x: 110, y: 160, w: 680, h: 810, radius: 24 },
        { x: 1010, y: 160, w: 680, h: 810, radius: 24 },
      ],
      overlay: 'file:///C:/YoungBooth-Frames/wedding-4x6.png',
      // Khung cho nút "Chọn khung" ở màn kết quả. frames[0] = khung mặc định (giá trị của chính kiểu chụp này).
      // Thêm khung: 1 phần tử { id, name, overlay, … } (xem FRAMES_GUIDE.md).
      frames: [
        { id: 'B-default', name: 'Ngọt Ngào Hồng' },
        ...FRAME_SETS.B,   // khung mới (tự sinh ở đầu file)
      ],
      showBrand: false,
      qr: { xs: [640, 1540], y: 990, width: 126, label: '' },   // mỗi tấm 1 QR, thẳng mép phải ảnh
      logo: { src: 'file:///C:/YoungBooth-Frames/logo.png', xs: [450, 1350], y: 60, h: 66 },
      texts: [
        { id: 'name', label: 'Chữ dưới ảnh (2 bên)', value: 'YoungBooth',
          xs: [450, 1350], y: 1046, size: 46, color: '#8C4A5A', ff: '"Segoe Script", "Brush Script MT", cursive', weight: '700' },
        { id: 'date', label: 'Ngày (2 bên)', value: '',
          xs: [450, 1350], y: 1096, size: 22, color: '#8C4A5A', ff: '"Palatino Linotype", Cambria, serif', ls: 5 },
        { id: 'qrhint', label: 'Dòng hướng dẫn QR (2 bên)', value: 'Quét QR lấy ảnh + GIF · lưu 3 ngày',
          xs: [450, 1350], y: 1130, size: 17, color: 'rgba(140,74,90,0.8)', ff: '"Palatino Linotype", Cambria, serif', italic: true },
      ],
    },

    // Layout C — Nhật Ký: dải 2×6 phong cách chocolate. DẢI ĐÔI trên tờ 4×6 dọc, cắt đôi ở x=600.
    // 8 slots = 4 trái + 4 phải; chụp 6 → khách chọn 4; cột phải lặp lại (i % 4).
    // Toạ độ PHẢI khớp SLOTS['YB'] trong scripts/make-frames.py. Mỗi dải 1 QR riêng ở footer.
    // Khung cũ (nền trắng viền navy) vẫn còn file grid6-navy.png nếu cần quay lại.
    { id: 'C', name: 'Nhật Ký', icon: '🍫', desc: '2×6" · 4 ảnh (2 dải)', kind: 'photo',
      captureCount: 6, select: 4,
      stripCut: true,
      canvas: { w: 1200, h: 1800 },
      background: '#F3EBDD',
      slots: [
        { x: 50, y: 112, w: 500, h: 330, radius: 14 },
        { x: 50, y: 468, w: 500, h: 330, radius: 14 },
        { x: 50, y: 824, w: 500, h: 330, radius: 14 },
        { x: 50, y: 1180, w: 500, h: 330, radius: 14 },
        { x: 650, y: 112, w: 500, h: 330, radius: 14 },
        { x: 650, y: 468, w: 500, h: 330, radius: 14 },
        { x: 650, y: 824, w: 500, h: 330, radius: 14 },
        { x: 650, y: 1180, w: 500, h: 330, radius: 14 },
      ],
      overlay: 'file:///C:/YoungBooth-Frames/youngbooth-strip.png',
      // Khung cho nút "Chọn khung" ở màn kết quả. frames[0] = khung mặc định (giá trị của chính kiểu chụp này).
      // Thêm khung: 1 phần tử { id, name, overlay, … } (xem FRAMES_GUIDE.md).
      frames: [
        { id: 'C-default', name: 'Chocolate YoungBooth' },
        ...FRAME_SETS.C,   // khung mới (tự sinh ở đầu file)
      ],
      showBrand: false,
      qr: { xs: [378, 978], y: 1536, width: 150, label: '' },
      texts: [
        { id: 'brand', label: 'Chữ đầu dải (2 dải)', value: 'YoungBooth',
          xs: [300, 900], y: 70, size: 30, color: '#F3EBDD', ff: '"Segoe Script", cursive', weight: '700' },
        { id: 'title', label: 'Chữ lớn cuối dải (2 dải)', value: 'YoungBooth',
          xs: [196, 796], y: 1620, size: 48, color: '#5A3A2E', color2: '#F2C230',
          stroke: '#5A3A2E', strokeWidth: 6, rotate: -5,
          ff: '"Segoe Print", "Comic Sans MS", cursive', weight: '700' },
        { id: 'date', label: 'Ngày (2 dải)', value: '',
          xs: [196, 796], y: 1686, size: 22, color: '#7A5A48', ff: 'Arial, sans-serif', weight: '600', ls: 3 },
        { id: 'qrhint', label: 'Dòng hướng dẫn QR (2 dải)', value: 'Quét QR lấy ảnh + GIF · lưu 3 ngày',
          xs: [196, 796], y: 1714, size: 15, color: '#7A5A48', ff: 'Arial, sans-serif', weight: '600' },
      ],
    },

    // Layout D — Chia Đôi: SCRAPBOOK. Giấy 6×4 NGANG, 2 ảnh khác nhau, cắt đôi ở x=900 → 2 tấm 3×4" dọc
    // (mỗi tấm lề trái = lề phải 110px). Canvas đã ngang nên KHÔNG xoay khi in (noRotate).
    // Khung: make_d() trong scripts/make-frames.py — slots PHẢI khớp SLOTS['D'].
    { id: 'D', name: 'Chia Đôi', icon: '✂️', desc: '6×4" · 2 ảnh → cắt 2 tấm 3×4', kind: 'photo',
      captureCount: 2, select: 2,
      canvas: { w: 1800, h: 1200 },
      paper: '6x4', noRotate: true,
      background: '#FAF6EF',
      slots: [
        { x: 110, y: 150, w: 680, h: 810, radius: 0 },
        { x: 1010, y: 150, w: 680, h: 810, radius: 0 },
      ],
      overlay: 'file:///C:/YoungBooth-Frames/split2-ivory.png',
      // Khung cho nút "Chọn khung" ở màn kết quả. frames[0] = khung mặc định (giá trị của chính kiểu chụp này).
      // Thêm khung: 1 phần tử { id, name, overlay, … } (xem FRAMES_GUIDE.md).
      frames: [
        { id: 'D-default', name: 'Scrapbook' },
        ...FRAME_SETS.D,   // khung mới (tự sinh ở đầu file)
      ],
      showBrand: false,
      qr: { xs: [640, 1540], y: 1000, width: 126, label: '' },   // mỗi tấm 1 QR, thẳng mép phải ảnh
      logo: { src: 'file:///C:/YoungBooth-Frames/logo.png', xs: [450, 1350], y: 44, h: 56 },
      texts: [
        { id: 'title', label: 'Tiêu đề (2 tấm)', value: 'YoungBooth',
          xs: [450, 1350], y: 1056, size: 56, color: '#333333', ff: '"Ink Free", "Segoe Print", cursive' },
        { id: 'date', label: 'Ngày (2 tấm)', value: '',
          xs: [450, 1350], y: 1108, size: 22, color: '#333333', ff: '"Ink Free", "Segoe Print", cursive', ls: 4 },
        { id: 'qrhint', label: 'Dòng hướng dẫn QR (2 tấm)', value: 'Quét QR lấy ảnh + GIF · lưu 3 ngày',
          xs: [450, 1350], y: 1140, size: 17, color: '#333333', ff: '"Ink Free", "Segoe Print", cursive' },
      ],
    },

    // Layout F — Dịu Dàng: PASTEL HÀN QUỐC (Life4Cuts). Lưới 2×2 ảnh bo góc 28, viền trắng 8px,
    // sticker bế ở góc mỗi ảnh. Khung: make_f() trong scripts/make-frames.py — slots PHẢI khớp SLOTS['F'].
    { id: 'F', name: 'Dịu Dàng', icon: '🎀', desc: '4×6" · 4 ảnh', kind: 'photo',
      captureCount: 4, select: 4,
      canvas: { w: 1200, h: 1800 },
      background: '#FBF3E9',
      slots: [
        { x: 92, y: 168, w: 490, h: 650, radius: 28 },
        { x: 618, y: 168, w: 490, h: 650, radius: 28 },
        { x: 92, y: 854, w: 490, h: 650, radius: 28 },
        { x: 618, y: 854, w: 490, h: 650, radius: 28 },
      ],
      overlay: 'file:///C:/YoungBooth-Frames/grid4-charcoal.png',
      // Khung cho nút "Chọn khung" ở màn kết quả. frames[0] = khung mặc định (giá trị của chính kiểu chụp này).
      // Thêm khung: 1 phần tử { id, name, overlay, … } (xem FRAMES_GUIDE.md).
      frames: [
        { id: 'F-default', name: 'Pastel Hàn Quốc' },
        ...FRAME_SETS.F,   // khung mới (tự sinh ở đầu file)
      ],
      showBrand: false,
      qr: { xs: [960], y: 1588, width: 130, label: '' },   // QR footer, thẳng mép phải lưới ảnh
      logo: { src: 'file:///C:/YoungBooth-Frames/logo.png', center: true, y: 50, h: 74 },
      texts: [
        { id: 'brand', label: 'Chữ thương hiệu (footer)', value: 'YoungBooth',
          x: 600, y: 1648, size: 58, color: '#D86A8A', ff: '"Nunito", "Quicksand", "Segoe UI", sans-serif', weight: '900' },
        { id: 'date', label: 'Ngày', value: '',
          x: 600, y: 1702, size: 24, color: '#A08A8F', ff: '"Nunito", "Quicksand", "Segoe UI", sans-serif', weight: '600', ls: 4 },
        { id: 'qrhint', label: 'Dòng hướng dẫn QR', value: 'Quét QR lấy ảnh + GIF · lưu 3 ngày',
          x: 600, y: 1736, size: 18, color: '#A08A8F', ff: '"Nunito", "Quicksand", "Segoe UI", sans-serif', weight: '600' },
      ],
    },

    // ---- Kiểu ĐỘNG: GIF / Boomerang / Video (khách chọn ở màn "Chọn kiểu chụp") ----
    { id: 'GIF',  name: 'Ảnh động GIF', icon: '🎞️', desc: 'Chụp loạt → GIF chuyển động', kind: 'gif',
      frames: 12, frameDelay: 120 },
    { id: 'BOOM', name: 'Boomerang',    icon: '🔁', desc: 'Tới–lui lặp vui nhộn',       kind: 'boomerang',
      frames: 12, frameDelay: 90 },
  ],

  // QR in ở góc ảnh.
  //  mode:'session' = QR RIÊNG từng lượt → khách quét ra ảnh + GIF + Boomerang của mình (lưu 3 ngày).
  //  mode:'gallery' = QR TĨNH về trang gallery chung.
  galleryQR: {
    enabled: true,
    mode: 'session',
    galleryBase: 'https://caodanghuong.github.io/Young-Booth-Gallery/',
    label: 'Quét lấy ảnh + GIF',
    width: 168,     // cạnh ô QR (px trên canvas ảnh)
    margin: 34,     // cách mép ảnh
    corner: 'br',   // 'br' | 'bl' | 'tr' | 'tl'
  },

  // Với các kiểu ẢNH: tự tạo thêm GIF + Boomerang từ loạt ảnh đã chụp,
  // để khi quét QR khách nhận được cả ảnh tĩnh + GIF + Boomerang.
  session: {
    includeAnimation: true,
    animationFrameDelay: 450, // ms mỗi khung của GIF/Boomerang tạo từ ảnh chụp
  },

  // Tên hiển thị trong ⚙️ Cài đặt cho nhóm khung dịp lễ / sự kiện (frames[].holiday / frames[].event) — mặc định ẨN.
  frameGroups: {
    quockhanh: 'Khung Quốc Khánh 2/9',
    trungthu: 'Khung Trung Thu',
  },
  // Tên nhóm chữ (frames[].textGroup) trong Cài đặt → admin nhập 1 lần cho cả bộ khung.
  textGroups: FRAME_TEXT_GROUPS,
  // Thư viện khung SỰ KIỆN (Luồng sự kiện — bật/tắt + hồ sơ sự kiện trong webadmin). Mỗi phần tử = 1 khung + trường mode.
  // Thêm khung sự kiện mới: PNG vào C:\YoungBooth-Frames\events\<bộ>\ + 1 dòng ở đây (id 'EV-<mode>-<tên>'), xem FRAMES_GUIDE.md.
  eventFrames: EVENT_FRAMES,

  // Kích thước xuất ảnh (px). 300dpi: 4×6 = 1200×1800.
  output: {
    photoW: 1200,
    photoH: 1800,
    wideW: 1800,   // ảnh sự kiện NGANG (6×4 = 4R ngang) — chụp nhóm đông người
    wideH: 1200,
    stripW: 600,
    stripH: 1800,
    gifSize: 600,
    gifBrandBar: 104,
  },

  // ---- In ấn ----
  print: {
    printerName: '',          // máy in cho ảnh/lưới 4×6 (bản thường, 2inch cut = Disable)
    stripPrinterName: '',     // máy in cho DẢI 2×6 (bản có 2inch cut = Enable). Trống = dùng printerName
    copies: 1,                // số bản mỗi lần in
    silent: true,             // in thẳng, KHÔNG hiện hộp thoại chọn máy in (booth)
    stripDoubleOn4x6: true,   // DẢI: app ghép 2 dải trên 1 tờ 4×6 để DNP 2inch-cut cắt đôi
    paper: 'auto',            // 'auto': dải = 4×6 (2 dải, máy cắt); ảnh/lưới = 4×6
    rotate: false,            // IN DỌC đúng thiết kế khung 4×6 (KHÔNG xoay) → driver DNP để Portrait, hết cắt ảnh
  },

  // ---- Upload gallery online ----
  // Khi bật, ảnh/GIF được đẩy lên internet và QR trỏ tới link cloud
  // (khách tải được MỌI NƠI, không cần chung Wi-Fi). Nếu tắt/lỗi → tự dùng link LAN.
  gallery: {
    enabled: true,
    provider: 'cloudinary',   // 'cloudinary' | 'custom'

    // provider = 'cloudinary' (KHÔNG cần server riêng):
    // Tạo tài khoản cloudinary.com → Settings → Upload → thêm 1 "Upload preset"
    // đặt Signing Mode = Unsigned → điền tên preset + cloud name vào đây.
    cloudinary: {
      cloudName: 'ynewakqm',      // Cloud name của anh
      uploadPreset: 'YoungBooth', // preset unsigned
      folder: 'young-booth',      // thư mục trên Cloudinary
    },

    // provider = 'custom' (endpoint tự dựng):
    uploadUrl: '',            // POST JSON { filename, kind, dataBase64 } → trả { url }
    apiKey: '',               // (tuỳ chọn) header Authorization: Bearer <apiKey>
    publicBaseUrl: '',        // (tuỳ chọn) ghép publicBaseUrl + '/' + filename nếu endpoint không trả url

    // Quyền riêng tư: khách chọn ĐĂNG CÔNG KHAI lên gallery hay chỉ tải riêng.
    publicDefault: true,      // mặc định của ô tick ở màn kết quả (true = công khai)
    consentNote: 'Đồng ý đăng ảnh lên gallery công khai (tự xoá sau 3 ngày).',
  },

  // ---- Chế độ vận hành booth trên mini PC ----
  kiosk: {
    enabled: false,          // true = toàn màn hình, ẩn taskbar, KHÓA thoát (dành cho booth thật)
    autoStart: true,         // true = tự chạy khi Windows khởi động (đăng ký ở login)
    preventSleep: true,      // giữ màn hình luôn thức khi app mở (chỉ tác dụng khi kiosk bật)
    exitShortcut: 'CommandOrControl+Shift+Q', // phím bí mật cho nhân viên thoát app
    idleResetSeconds: 90,    // để trống không thao tác X giây → tự về màn chờ (0 = tắt)
  },
};

// Cho phép cả giao diện (renderer) lẫn tiến trình chính (main) đọc chung config này.
if (typeof window !== 'undefined') window.BOOTH_CONFIG = BOOTH_CONFIG;
if (typeof module !== 'undefined' && module.exports) module.exports = BOOTH_CONFIG;
