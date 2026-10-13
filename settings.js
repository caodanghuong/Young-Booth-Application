// Persisted booth settings (pricing + payment + luồng sự kiện), editable via the webadmin page.
const fs = require('fs');

const DEFAULTS = {
  adminPin: '1234',            // PIN để vào webadmin (đổi trong webadmin)
  payment: {
    enabled: false,            // true = bắt thanh toán trước khi chụp
    method: 'manual',          // 'manual' (nhân viên xác nhận) | 'sepay' (tự xác nhận)
    currency: 'đ',
    allowStaffOverride: true,  // luôn cho nút "Đã thanh toán" cho nhân viên
    priceMode: 'fixed',        // 'fixed' | 'perMode'
    fixedPrice: 50000,
    perMode: { single: 40000, strip: 60000, grid: 60000, gif: 50000, boom: 50000 },
    bank: { bankCode: '', accountNumber: '', accountName: '' }, // để tạo VietQR
    sepay: { apiToken: '', accountNumber: '' }, // để tự xác nhận (không lộ ra app)
  },
  // ---- Luồng sự kiện (SPEC-LUONG-SU-KIEN.md) — mặc định TẮT = luồng thường như cũ ----
  eventMode: {
    enabled: false,            // true = booth CHỈ chạy luồng của sự kiện activeEventId
    activeEventId: '',
  },
  events: [EVENT_TEMPLATE('orientation', 'Orientation Day – Greenwich', {
    theme: { background: '#3fb6e8', accent: '#1d3a8a', textColor: '#ffffff' },
    home: { title: 'ORIENTATION DAY', subtitle: 'Future Starts Here' },
    modes: ['C', 'B'],
    frames: { C: ['EV-C-orientation'], B: ['EV-B-orientation'] },
    defaultFrame: { C: 'EV-C-orientation', B: 'EV-B-orientation' },
  })],
};

// Hồ sơ sự kiện đầy đủ trường (webadmin "Thêm mới" dùng chung khuôn này).
function EVENT_TEMPLATE(id, name, over) {
  const base = {
    id, name,
    theme: { background: '#f4eefb', backgroundImage: '', accent: '#8d6ccf', textColor: '#2e2240', logo: '', font: '' },
    home: { title: name, subtitle: '', welcome: 'Chạm để chụp ảnh lưu niệm', buttonLabel: 'CHỤP ẢNH', showYoungBoothBrand: true },
    modes: ['C'],
    frames: {},
    defaultFrame: {},
    texts: {},
    payment: { enabled: false },      // mặc định TẮT: ban tổ chức trả tiền, khách chụp miễn phí
    allowAnimated: true,
    print: { copies: 1, maxPrintsPerSession: 2 },
    gallery: { folder: 'young-booth/events/' + id, public: false },
    schedule: { startAt: '', endAt: '' },
    createdAt: '', updatedAt: '',
  };
  return deepMerge(base, over || {});
}

function deepMerge(base, over) {
  if (Array.isArray(base) || typeof base !== 'object' || base === null) {
    return over === undefined ? base : over;
  }
  const out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
  for (const k of Object.keys(over || {})) {
    if (out[k] && typeof out[k] === 'object' && !Array.isArray(out[k]) &&
        over[k] && typeof over[k] === 'object' && !Array.isArray(over[k])) {
      out[k] = deepMerge(out[k], over[k]);
    } else {
      out[k] = over[k];
    }
  }
  return out;
}

// Mỗi sự kiện luôn đủ trường (hồ sơ cũ / nhập tay thiếu trường vẫn chạy được).
function normalize(s) {
  s.events = (Array.isArray(s.events) ? s.events : [])
    .filter((e) => e && typeof e === 'object' && /^[a-z0-9-]+$/.test(String(e.id || '')))
    .map((e) => EVENT_TEMPLATE(e.id, e.name || e.id, e));
  s.eventMode = Object.assign({ enabled: false, activeEventId: '' }, s.eventMode || {});
  return s;
}

function read(filePath) {
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return normalize(deepMerge(JSON.parse(JSON.stringify(DEFAULTS)), raw));
  } catch {
    return normalize(JSON.parse(JSON.stringify(DEFAULTS)));
  }
}

function write(filePath, obj) {
  const merged = normalize(deepMerge(JSON.parse(JSON.stringify(DEFAULTS)), obj || {}));
  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

// View safe to expose to the renderer (no secrets).
function publicView(s) {
  const c = JSON.parse(JSON.stringify(s));
  delete c.adminPin;
  if (c.payment && c.payment.sepay) delete c.payment.sepay.apiToken;
  return c;
}

module.exports = { DEFAULTS, EVENT_TEMPLATE, deepMerge, normalize, read, write, publicView };
