// Persisted booth settings (pricing + payment), editable via the webadmin page.
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
};

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

function read(filePath) {
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return deepMerge(JSON.parse(JSON.stringify(DEFAULTS)), raw);
  } catch {
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
}

function write(filePath, obj) {
  const merged = deepMerge(JSON.parse(JSON.stringify(DEFAULTS)), obj || {});
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

module.exports = { DEFAULTS, deepMerge, read, write, publicView };
