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

  // Dải "mẫu khung / khuyến mãi" hiển thị ở màn hình chờ (giống Hari Film).
  home: {
    showcase: {
      enabled: true,
      title: 'MẪU KHUNG ẢNH',
      images: [], // vd: ['home/mau1.png','home/mau2.png','home/mau3.png'] (bỏ file vào renderer/home/)
    },
  },

  countdownSeconds: 3,   // đếm ngược cho kiểu GIF/Boomerang
  prepSeconds: 10,       // thời gian chuẩn bị + đếm ngược trước MỖI ảnh (kiểu ảnh)
  showCaptureGuide: true, // khung nét đứt trên màn chụp = vùng sẽ được in (tránh cắt mất người)

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
    { id: 'A', name: 'Layout A', icon: '🖼️', desc: '4×6" · 1 ảnh', kind: 'photo',
      captureCount: 1, select: 1,
      canvas: { w: 1200, h: 1800 },
      background: '#2b3a5e',
      slots: [
        { x: 80, y: 180, w: 1040, h: 1420, radius: 0 },
      ],
      overlay: 'file:///C:/YoungBooth-Frames/grid1-dark.png',
      showBrand: false,
      texts: [
        { id: 'title', label: 'Tiêu đề (góc trên)', value: 'YOUNG BOOTH',
          x: 66, y: 104, size: 46, color: '#ffffff', ff: 'Arial, sans-serif', weight: '800', align: 'left' },
        { id: 'date', label: 'Ngày / dòng dưới', value: '06 . 10 . 2026',
          x: 600, y: 1700, size: 28, color: '#e9ecf5', ff: 'Arial, sans-serif', weight: '600', ls: 5 },
      ],
    },

    // Layout B — 2 ảnh (khung Cưới). Chữ VẼ ĐỘNG (sửa trong Cài đặt ⚙️ → "Chữ khung cưới").
    { id: 'B', name: 'Layout B', icon: '💍', desc: '4×6" · 2 ảnh', kind: 'photo',
      captureCount: 2, select: 2,
      canvas: { w: 1200, h: 1800 },
      background: '#ffffff',
      slots: [
        { x: 100, y: 320, w: 1000, h: 620, radius: 0 },
        { x: 100, y: 960, w: 1000, h: 620, radius: 0 },
      ],
      overlay: 'file:///C:/YoungBooth-Frames/wedding-4x6.png',
      showBrand: false,
      // Các dòng chữ sửa được (id dùng để lưu giá trị). label = nhãn hiện trong Cài đặt.
      texts: [
        { id: 'invite', label: 'Dòng mời (trên)', value: 'YOU ARE INVITED TO CELEBRATE THE WEDDING OF',
          x: 600, y: 108, w: 860, size: 26, color: '#9c6b4f', ff: 'Georgia, serif', weight: '600', ls: 4, lh: 38 },
        { id: 'mono', label: 'Ký tự monogram (trong vòng tròn)', value: '&',
          x: 600, y: 256, size: 52, color: '#9c6b4f', ff: 'Georgia, serif', italic: true },
        { id: 'names', label: 'Tên cô dâu & chú rể', value: 'Anh & Em',
          x: 600, y: 1662, size: 64, color: '#9c6b4f', ff: 'Georgia, serif', italic: true },
        { id: 'date', label: 'Ngày cưới', value: '01 . 01 . 2026',
          x: 600, y: 1712, size: 30, color: '#5a4a3c', ff: 'Georgia, serif', weight: '600', ls: 6 },
        { id: 'thanks', label: 'Lời cảm ơn (dưới)', value: 'Thank you for being part of our special day',
          x: 600, y: 1748, w: 900, size: 22, color: '#b98c6d', ff: 'Georgia, serif', italic: true, lh: 30 },
      ],
    },

    // Layout C — 6 ảnh (khung Navy 2×3)
    { id: 'C', name: 'Layout C', icon: '🎞️', desc: '4×6" · 6 ảnh', kind: 'photo',
      captureCount: 6, select: 6,
      canvas: { w: 1200, h: 1800 },
      background: '#2b3a5e',
      slots: [
        { x: 60,  y: 150,  w: 528, h: 514, radius: 0 },
        { x: 612, y: 150,  w: 528, h: 514, radius: 0 },
        { x: 60,  y: 688,  w: 528, h: 514, radius: 0 },
        { x: 612, y: 688,  w: 528, h: 514, radius: 0 },
        { x: 60,  y: 1226, w: 528, h: 514, radius: 0 },
        { x: 612, y: 1226, w: 528, h: 514, radius: 0 },
      ],
      overlay: 'file:///C:/YoungBooth-Frames/grid6-navy.png',
      showBrand: false,
      texts: [
        { id: 'title', label: 'Tiêu đề (góc trên)', value: 'YOUNG BOOTH',
          x: 66, y: 104, size: 42, color: '#ffffff', ff: 'Arial, sans-serif', weight: '800', align: 'left' },
        { id: 'date', label: 'Ngày / dòng dưới', value: '06 . 10 . 2026',
          x: 600, y: 1778, size: 26, color: '#e9ecf5', ff: 'Arial, sans-serif', weight: '600', ls: 5 },
      ],
    },

    // Layout F — 4 ảnh (khung Charcoal 2×2)
    { id: 'F', name: 'Layout F', icon: '🖼️', desc: '4×6" · 4 ảnh', kind: 'photo',
      captureCount: 4, select: 4,
      canvas: { w: 1200, h: 1800 },
      background: '#3a3a3c',
      slots: [
        { x: 60,  y: 150, w: 528, h: 783, radius: 0 },
        { x: 612, y: 150, w: 528, h: 783, radius: 0 },
        { x: 60,  y: 957, w: 528, h: 783, radius: 0 },
        { x: 612, y: 957, w: 528, h: 783, radius: 0 },
      ],
      overlay: 'file:///C:/YoungBooth-Frames/grid4-charcoal.png',
      showBrand: false,
      texts: [
        { id: 'title', label: 'Tiêu đề (góc trên)', value: 'YOUNG BOOTH',
          x: 66, y: 104, size: 42, color: '#ffffff', ff: 'Arial, sans-serif', weight: '800', align: 'left' },
        { id: 'date', label: 'Ngày / dòng dưới', value: '06 . 10 . 2026',
          x: 600, y: 1778, size: 26, color: '#ededed', ff: 'Arial, sans-serif', weight: '600', ls: 5 },
      ],
    },
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
  },

  // ---- Chế độ vận hành booth trên mini PC ----
  kiosk: {
    enabled: false,          // true = toàn màn hình, ẩn taskbar, KHÓA thoát (dành cho booth thật)
    autoStart: true,         // true = tự chạy khi Windows khởi động (đăng ký ở login)
    preventSleep: true,      // giữ màn hình luôn thức khi app mở (chỉ tác dụng khi kiosk bật)
    exitShortcut: 'CommandOrControl+Shift+Q', // phím bí mật cho nhân viên thoát app
  },
};

// Cho phép cả giao diện (renderer) lẫn tiến trình chính (main) đọc chung config này.
if (typeof window !== 'undefined') window.BOOTH_CONFIG = BOOTH_CONFIG;
if (typeof module !== 'undefined' && module.exports) module.exports = BOOTH_CONFIG;
