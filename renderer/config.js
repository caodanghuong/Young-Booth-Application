// ================== Young Booth configuration ==================
// Sửa file này để đổi thương hiệu, màu, filter, kiểu chụp, chế độ kiosk. Không cần build lại.

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
      provider: 'dcc',          // 'dcc' = digiCamControl (khuyên) | 'edsdk' = native EDSDK
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
      month: 'Tháng 9',
      brandLeft: 'FANCLUB\nFRAME EVENT',
      brandRight: 'YOUNG BOOTH\nVIỆT NAM',
      periods: [
        { range: '01.09 ~ 15.09', items: ['Jungkook', 'NCT Haechan', 'StrayKids Han', 'Jimmy & Sea', 'Sungho'] },
        { range: '16.09 ~ 30.09', items: ['Faker & Peanut', 'Keria', 'BLG Bin', 'Thiều Bảo Trâm', 'Doran'] },
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
    // Layout A — 1 ảnh (nền tối, YOUNG BOOTH)
    { id: 'A', name: 'Khoảnh Khắc', icon: '🖼️', desc: '4×6" · 1 ảnh', kind: 'photo',
      captureCount: 1, select: 1,
      canvas: { w: 1200, h: 1800 },
      background: '#dde5ec',
      slots: [
        { x: 40, y: 140, w: 1120, h: 1540, radius: 0 },
      ],
      overlay: 'file:///C:/YoungBooth-Frames/grid1-dark.png',
      showBrand: false,
      // Logo màu góc trên (thay file C:\YoungBooth-Frames\logo.png để đổi logo).
      logo: { src: 'file:///C:/YoungBooth-Frames/logo.png', center: true, y: 36, h: 90 },
      texts: [
        { id: 'date', label: 'Ngày / dòng dưới', value: '06 . 10 . 2026',
          x: 600, y: 1716, size: 28, color: '#5c6672', ff: 'Arial, sans-serif', weight: '600', ls: 5 },
        { id: 'sub', label: 'Dòng chữ dưới ngày', value: 'Chụp ảnh theo phong cách của bạn',
          x: 600, y: 1758, w: 1000, size: 24, color: '#7a828c', ff: 'Arial, sans-serif', italic: true, lh: 32 },
      ],
    },

    // Layout B — 2 ảnh (khung Cưới). Chữ VẼ ĐỘNG (sửa trong Cài đặt ⚙️ → "Chữ khung cưới").
    // Layout B — Ngọt Ngào: khung NGANG giấy kem, 2 ảnh cạnh nhau, đường cắt nét đứt giữa.
    // Mỗi bên: logo + 1 ảnh + "Young Booth" (script) + ngày. Khổ 6×4 ngang → noRotate.
    { id: 'B', name: 'Ngọt Ngào', icon: '💞', desc: '6×4" · 2 ảnh (ngang)', kind: 'photo',
      captureCount: 2, select: 2,
      canvas: { w: 1800, h: 1200 },
      background: '#f3ede1',
      paper: '6x4',
      noRotate: true,
      slots: [
        { x: 46, y: 122, w: 808, h: 928, radius: 0 },
        { x: 946, y: 122, w: 808, h: 928, radius: 0 },
      ],
      overlay: 'file:///C:/YoungBooth-Frames/wedding-4x6.png',
      showBrand: false,
      logo: { src: 'file:///C:/YoungBooth-Frames/logo.png', xs: [450, 1350], y: 36, h: 66 },
      texts: [
        { id: 'name', label: 'Chữ dưới ảnh (2 bên)', value: 'Young Booth',
          xs: [450, 1350], y: 1110, size: 46, color: '#4b4030', ff: '"Segoe Script", "Brush Script MT", cursive' },
        { id: 'date', label: 'Ngày (2 bên)', value: '07 . 10 . 2026',
          xs: [450, 1350], y: 1158, size: 24, color: '#8a7a60', ff: 'Georgia, serif', ls: 5 },
      ],
    },

    // Layout C — Nhật Ký: DẢI ĐÔI (4 ảnh, in thành 2 dải giống nhau cạnh nhau).
    // 8 slots = 4 trái + 4 phải; chụp 4 ảnh → cột phải lặp lại (i % 4). Viền vàng gold.
    { id: 'C', name: 'Nhật Ký', icon: '🎞️', desc: '4×6" · 4 ảnh (2 dải)', kind: 'photo',
      captureCount: 4, select: 4,
      canvas: { w: 1200, h: 1800 },
      background: '#ffffff',
      slots: [
        { x: 42, y: 124, w: 516, h: 340, radius: 0 },
        { x: 42, y: 478, w: 516, h: 340, radius: 0 },
        { x: 42, y: 832, w: 516, h: 340, radius: 0 },
        { x: 42, y: 1186, w: 516, h: 340, radius: 0 },
        { x: 642, y: 124, w: 516, h: 340, radius: 0 },
        { x: 642, y: 478, w: 516, h: 340, radius: 0 },
        { x: 642, y: 832, w: 516, h: 340, radius: 0 },
        { x: 642, y: 1186, w: 516, h: 340, radius: 0 },
      ],
      overlay: 'file:///C:/YoungBooth-Frames/grid6-navy.png',
      showBrand: false,
      logo: { src: 'file:///C:/YoungBooth-Frames/logo.png', xs: [300, 900], y: 38, h: 64 },
      texts: [
        { id: 'names', label: 'Tên / tiêu đề (2 cột)', value: 'Thu & Raph',
          xs: [300, 900], y: 1592, size: 54, color: '#2b2b2b', ff: '"Segoe Script", "Brush Script MT", cursive' },
        { id: 'date', label: 'Ngày (2 cột)', value: '17 . 03 . 2024',
          xs: [300, 900], y: 1655, size: 24, color: '#555555', ff: 'Georgia, serif', ls: 3 },
        { id: 'loc', label: 'Địa điểm (2 cột)', value: 'Saigon, Vietnam',
          xs: [300, 900], y: 1695, size: 22, color: '#777777', ff: 'Georgia, serif' },
      ],
    },

    // Layout D — Chia Đôi: giấy 6×4 NGANG, 2 ảnh khác nhau, cắt đôi giữa → 2 tấm 3×4" dọc.
    // Canvas đã ngang nên KHÔNG xoay khi in (noRotate). Vạch cắt nét đứt ở x=900; mỗi tấm lề đều 36px (viền ảnh 36→864), giữa 2 viền 72px. PNG sinh bằng scripts/make-frames.py.
    { id: 'D', name: 'Chia Đôi', icon: '✂️', desc: '6×4" · 2 ảnh → cắt 2 tấm 3×4', kind: 'photo',
      captureCount: 2, select: 2,
      canvas: { w: 1800, h: 1200 },
      paper: '6x4', noRotate: true,
      background: '#f7f1ea',
      slots: [
        { x: 48, y: 122, w: 804, h: 928, radius: 0 },
        { x: 948, y: 122, w: 804, h: 928, radius: 0 },
      ],
      overlay: 'file:///C:/YoungBooth-Frames/split2-ivory.png',
      showBrand: false,
      logo: { src: 'file:///C:/YoungBooth-Frames/logo.png', xs: [450, 1350], y: 36, h: 64 },
      texts: [
        { id: 'title', label: 'Tiêu đề (2 tấm)', value: 'Young Booth',
          xs: [450, 1350], y: 1110, size: 46, color: '#4a3f38', ff: '"Segoe Script", "Brush Script MT", cursive' },
        { id: 'date', label: 'Ngày (2 tấm)', value: '07 . 10 . 2026',
          xs: [450, 1350], y: 1160, size: 22, color: '#7a6d63', ff: 'Georgia, serif', ls: 4 },
      ],
    },

    // Layout F — 4 ảnh (khung Charcoal 2×2)
    { id: 'F', name: 'Dịu Dàng', icon: '🖼️', desc: '4×6" · 4 ảnh', kind: 'photo',
      captureCount: 4, select: 4,
      canvas: { w: 1200, h: 1800 },
      background: '#f1e4de',
      slots: [
        { x: 40, y: 118, w: 550, h: 771, radius: 0 },
        { x: 610, y: 118, w: 550, h: 771, radius: 0 },
        { x: 40, y: 909, w: 550, h: 771, radius: 0 },
        { x: 610, y: 909, w: 550, h: 771, radius: 0 },
      ],
      overlay: 'file:///C:/YoungBooth-Frames/grid4-charcoal.png',
      showBrand: false,
      logo: { src: 'file:///C:/YoungBooth-Frames/logo.png', x: 40, y: 36, h: 70 },
      texts: [
        { id: 'date', label: 'Ngày', value: '06 . 10 . 2026',
          x: 600, y: 1720, size: 26, color: '#6e5f57', ff: 'Arial, sans-serif', weight: '600', ls: 5 },
        { id: 'sub', label: 'Dòng chữ dưới ngày', value: 'Chụp ảnh theo phong cách của bạn',
          x: 600, y: 1758, w: 1000, size: 22, color: '#8a7a70', ff: 'Arial, sans-serif', italic: true, lh: 30 },
      ],
    },

    // ---- Kiểu ĐỘNG: GIF / Boomerang / Video (khách chọn ở màn "Chọn kiểu chụp") ----
    { id: 'GIF',  name: 'Ảnh động GIF', icon: '🎞️', desc: 'Chụp loạt → GIF chuyển động', kind: 'gif',
      frames: 12, frameDelay: 120 },
    { id: 'BOOM', name: 'Boomerang',    icon: '🔁', desc: 'Tới–lui lặp vui nhộn',       kind: 'boomerang',
      frames: 12, frameDelay: 90 },
  ],

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
    rotate: true,             // DNP media (6x4) nằm ngang → app xoay ảnh dọc 90° cho khớp
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
