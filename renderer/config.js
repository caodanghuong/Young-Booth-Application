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
    // 'webcam' = webcam/laptop cam (mặc định) | 'canon' = máy ảnh Canon qua EDSDK
    source: 'webcam',
    mirror: true,               // gương như selfie (chỉ áp cho webcam)
    width: 1280,
    height: 720,
    canon: {
      liveViewFps: 15,          // số khung liveview/giây gửi lên giao diện
      fullResPhoto: true,       // true = ảnh đơn/strip/grid chụp full-res bằng màn trập;
                                // GIF/Boomerang luôn lấy từ liveview cho mượt
    },
  },

  // Dải "mẫu khung / khuyến mãi" hiển thị ở màn hình chờ (giống Hari Film).
  home: {
    showcase: {
      enabled: true,
      title: 'MẪU KHUNG ẢNH',
      images: [], // vd: ['home/mau1.png','home/mau2.png','home/mau3.png'] (bỏ file vào renderer/home/)
    },
  },

  countdownSeconds: 3,   // đếm ngược cho kiểu GIF/Boomerang
  prepSeconds: 15,       // thời gian chuẩn bị + đếm ngược trước MỖI ảnh (kiểu ảnh)

  // Sticker dán lên ảnh (màn kết quả). emojis = mặc định; images = PNG trong renderer/stickers/.
  stickers: {
    emojis: ['😎', '🥳', '😍', '🤩', '😂', '❤️', '🔥', '⭐', '🎉', '🎂', '👑', '🕶️', '💯', '🦄', '🌈', '✨', '💖', '🎈', '🍾', '💋', '🌸', '🐶'],
    images: [], // vd: ['stickers/logo.png', 'stickers/hat.png']
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
  modes: [
    { id: 'single', name: 'Ảnh đơn',   icon: '🖼️', desc: 'Chụp 3, chọn 1', kind: 'photo', layout: 'single', captureCount: 3, select: 1 },
    { id: 'strip',  name: 'Dải 4 ảnh', icon: '🎞️', desc: 'Chụp 6, chọn 4', kind: 'photo', layout: 'strip', captureCount: 6, select: 4 },
    { id: 'grid',   name: 'Lưới 2×2',  icon: '🔲', desc: 'Chụp 6, chọn 4',  kind: 'photo', layout: 'grid', captureCount: 6, select: 4 },
    { id: 'gif',    name: 'GIF động',  icon: '✨', desc: 'Ảnh động vui nhộn', kind: 'gif', shots: 1, frames: 12, frameDelay: 120 },
    { id: 'boom',   name: 'Boomerang', icon: '🔁', desc: 'Tới–lui lặp vô tận', kind: 'boomerang', shots: 1, frames: 12, frameDelay: 90 },
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
    stripW: 600,
    stripH: 1800,
    gifSize: 600,
    gifBrandBar: 104,
  },

  // ---- In ấn ----
  print: {
    printerName: '',          // '' = máy in mặc định Windows; hoặc điền tên máy in
    copies: 1,                // số bản mỗi lần in
    silent: false,            // true = in thẳng không hiện hộp thoại (booth)
    stripDoubleOn4x6: false,  // true = dải 4 ảnh in 2 bản cạnh nhau trên 1 tờ 4×6 (cắt đôi)
  },

  // ---- Upload gallery online ----
  // Khi bật, ảnh/GIF được đẩy lên internet và QR trỏ tới link cloud
  // (khách tải được MỌI NƠI, không cần chung Wi-Fi). Nếu tắt/lỗi → tự dùng link LAN.
  gallery: {
    enabled: false,
    provider: 'cloudinary',   // 'cloudinary' | 'custom'

    // provider = 'cloudinary' (KHÔNG cần server riêng):
    // Tạo tài khoản cloudinary.com → Settings → Upload → thêm 1 "Upload preset"
    // đặt Signing Mode = Unsigned → điền tên preset + cloud name vào đây.
    cloudinary: {
      cloudName: '',          // vd 'youngbooth'
      uploadPreset: '',       // tên preset unsigned
      folder: 'young-booth',  // thư mục trên Cloudinary (tuỳ chọn)
    },

    // provider = 'custom' (endpoint tự dựng):
    uploadUrl: '',            // POST JSON { filename, kind, dataBase64 } → trả { url }
    apiKey: '',               // (tuỳ chọn) header Authorization: Bearer <apiKey>
    publicBaseUrl: '',        // (tuỳ chọn) ghép publicBaseUrl + '/' + filename nếu endpoint không trả url
  },

  // ---- Chế độ vận hành booth trên mini PC ----
  kiosk: {
    enabled: false,          // true = toàn màn hình, ẩn taskbar, KHÓA thoát (dành cho booth thật)
    autoStart: false,        // true = tự chạy khi Windows khởi động (đăng ký ở login)
    preventSleep: true,      // giữ màn hình luôn thức khi app mở (chỉ tác dụng khi kiosk bật)
    exitShortcut: 'CommandOrControl+Shift+Q', // phím bí mật cho nhân viên thoát app
  },
};

// Cho phép cả giao diện (renderer) lẫn tiến trình chính (main) đọc chung config này.
if (typeof window !== 'undefined') window.BOOTH_CONFIG = BOOTH_CONFIG;
if (typeof module !== 'undefined' && module.exports) module.exports = BOOTH_CONFIG;
