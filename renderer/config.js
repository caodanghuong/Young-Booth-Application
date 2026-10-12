// ================== Young Booth configuration ==================
// Sửa file này để đổi thương hiệu, màu, filter, kiểu chụp, chế độ kiosk.
// LƯU Ý: file nằm trong app.asar → sửa xong phải đóng gói lại (build/cài lại) mới có hiệu lực.
// Ô chữ id 'date' để trống ('') = tự in ngày hôm nay.

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
