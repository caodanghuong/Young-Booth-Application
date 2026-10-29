/* ================= Young Booth — renderer logic ================= */
const CFG = window.BOOTH_CONFIG;

// ---- apply brand colors to CSS vars ----
document.documentElement.style.setProperty('--accent1', CFG.brand.accent1);
document.documentElement.style.setProperty('--accent2', CFG.brand.accent2);
if (CFG.brand.accent3) document.documentElement.style.setProperty('--accent3', CFG.brand.accent3);
// Logo thật ở màn chờ (C:\YoungBooth-Frames\logo.png); thiếu file → ẩn ảnh.
{ const lg = document.getElementById('home-logo'); if (lg) lg.addEventListener('error', () => { lg.style.display = 'none'; }); }

// Hộp thông báo theo giao diện app, thay cho alert() mặc định của Windows (không chặn luồng).
(function setupNotice() {
  const modal = document.getElementById('notice-modal'), text = document.getElementById('notice-text');
  if (!modal || !text) return;
  const queue = [];
  const next = () => { if (!queue.length) { modal.classList.remove('show'); return; } text.textContent = queue.shift(); modal.classList.add('show'); };
  document.getElementById('notice-ok').addEventListener('click', next);
  window.alert = (msg) => { queue.push(String(msg == null ? '' : msg)); if (!modal.classList.contains('show')) next(); };
})();

// Đổi chữ trên nút có icon: chỉ đổi phần .lbl, giữ nguyên icon.
function setLbl(btn, text) {
  if (!btn) return;
  const l = btn.querySelector('.lbl');
  if (l) l.textContent = text; else btn.textContent = text;
}

// ---- state ----
// Máy mới: nạp cài đặt riêng (máy in, khổ in, nguồn ảnh, chữ trên khung…) mang theo trong booth-settings.json.
// Chỉ nạp 1 lần cho mỗi bản cài đặt (id); sau đó chỉnh trên máy này được giữ nguyên.
const LOCAL_KEYS = ['booth.print', 'booth.source', 'booth.brand', 'booth.frameText', 'booth.frameTextV', 'booth.frameGroups', 'booth.frameHidden'];
(function seedLocalSettings() {
  try {
    const seed = window.booth.localSeed && window.booth.localSeed();
    if (!seed || !seed.id || !seed.data || localStorage.getItem('booth.localSeedId') === seed.id) return;
    for (const k of LOCAL_KEYS) if (typeof seed.data[k] === 'string') localStorage.setItem(k, seed.data[k]);
    localStorage.setItem('booth.localSeedId', seed.id);
  } catch (_e) {}
})();
// Sao cài đặt riêng của máy vào booth-settings.json (lúc mở app + mỗi lần Lưu Cài đặt).
function snapshotLocalSettings() {
  try {
    if (!window.booth.saveLocal) return;
    const data = {};
    for (const k of LOCAL_KEYS) { const v = localStorage.getItem(k); if (v != null) data[k] = v; }
    window.booth.saveLocal(data).then((r) => { if (r && r.id) localStorage.setItem('booth.localSeedId', r.id); }).catch(() => {});
  } catch (_e) {}
}
function loadSource() {
  try { return localStorage.getItem('booth.source') || (CFG.camera && CFG.camera.source) || 'webcam'; }
  catch { return (CFG.camera && CFG.camera.source) || 'webcam'; }
}
const state = {
  mode: null,          // current mode object
  filter: CFG.filters[0], // active filter object
  rawFrames: [],       // array of raw (unfiltered) canvases
  stream: null,
  lastOutput: null,    // { dataUrl, kind }
  busy: false,
  source: loadSource(),// 'webcam' | 'canon' — chosen in the UI, remembered
  webcamDeviceId: null,// selected webcam (when several)
  usingCanon: false,   // true once a Canon camera is live
  canonUnsub: null,    // unsubscribe fn for live-view frames
  frameId: null,       // khung khách chọn ở màn kết quả (null = khung mặc định của kiểu chụp)
  framePreviews: {},   // ảnh xem trước theo frameId trong lượt hiện tại
  stickered: false,    // ảnh kết quả đã dán sticker (đổi khung sẽ mất sticker)
};
try { state.webcamDeviceId = localStorage.getItem('booth.webcamId') || null; } catch {}

// Print settings: config defaults, overridden by what the user saved in the UI.
const PRINT_CFG_VERSION = 8; // tăng số này khi đổi mặc định in → xoá cài cũ của máy
function loadPrintCfg() {
  const def = Object.assign({ printerName: '', stripPrinterName: '', copies: 1, silent: true, stripDoubleOn4x6: true, paper: 'auto', rotate: false, __v: PRINT_CFG_VERSION }, CFG.print || {});
  try {
    const saved = JSON.parse(localStorage.getItem('booth.print') || '{}');
    if (saved.__v !== PRINT_CFG_VERSION) {
      // Cài cũ (khác phiên bản) → dựng lại theo mặc định mới, chỉ giữ tên máy in đã chọn.
      const fresh = Object.assign({}, def, {
        printerName: saved.printerName || '',
        stripPrinterName: saved.stripPrinterName || '',
        __v: PRINT_CFG_VERSION,
      });
      try { localStorage.setItem('booth.print', JSON.stringify(fresh)); } catch {}
      return fresh;
    }
    return Object.assign(def, saved);
  } catch { return def; }
}
state.printCfg = loadPrintCfg();
state.beauty = !!(CFG.beauty && CFG.beauty.enabled);
try { state.brandOverride = JSON.parse(localStorage.getItem('booth.brand') || '{}'); } catch { state.brandOverride = {}; }

// ---- element refs ----
const $ = (sel) => document.querySelector(sel);
const screens = {
  home: $('#screen-home'),
  mode: $('#screen-mode'),
  pay: $('#screen-pay'),
  capture: $('#screen-capture'),
  select: $('#screen-select'),
  review: $('#screen-review'),
  processing: $('#screen-processing'),
  result: $('#screen-result'),
};
const video = $('#video');
const liveImg = $('#live-img');
const videoWrap = document.querySelector('.video-wrap');
const countdownEl = $('#countdown');
const flashEl = $('#flash');
const shotProgress = $('#shot-progress');

// ---- navigation ----
// Màn hình → bước trên thanh 5 bước (Chọn kiểu · Chụp · Chọn ảnh · Trang trí · In). 0 = ẩn thanh.
const STEP_OF = { home: 0, mode: 1, pay: 1, capture: 2, select: 3, review: 3, result: 4 };
function setStep(n) {
  const bar = document.getElementById('stepbar');
  if (!bar) return;
  bar.classList.toggle('show', n > 0);
  bar.querySelectorAll('.step').forEach((el) => {
    const k = +el.dataset.step;
    el.classList.toggle('done', k < n);
    el.classList.toggle('now', k === n);
    el.querySelector('b').innerHTML = k < n ? '<svg><use href="#i-check"/></svg>' : String(k);
  });
}
function show(name) {
  Object.values(screens).forEach((s) => s.classList.remove('active'));
  screens[name].classList.add('active');
  if (name in STEP_OF) setStep(STEP_OF[name]);   // 'processing' giữ nguyên bước hiện tại
}

document.querySelectorAll('[data-goto]').forEach((el) => {
  el.addEventListener('click', () => {
    const target = el.dataset.goto;
    stopPayPoll();
    if (target === 'home') stopCamera();
    if (target === 'mode') { /* keep camera for re-capture */ }
    show(target);
  });
});

// ---- camera (source-aware: webcam OR Canon EDSDK) ----
async function startCamera() {
  if (state.source === 'canon') {
    const ok = await startCanon();
    if (ok) return;
    // fall back to webcam so the booth still works
  }
  await startWebcam();
}

async function startWebcam() {
  state.usingCanon = false;
  liveImg.style.display = 'none';
  video.style.display = 'block';
  if (state.stream) return;
  try {
    const videoConstraints = {
      width: { ideal: CFG.camera.width }, height: { ideal: CFG.camera.height },
    };
    if (state.webcamDeviceId) videoConstraints.deviceId = { exact: state.webcamDeviceId };
    else videoConstraints.facingMode = 'user';
    try {
      state.stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });
    } catch (err) {
      // Saved camera unplugged/renamed → fall back to the default camera instead of failing.
      if (!state.webcamDeviceId || err.name !== 'OverconstrainedError' && err.name !== 'NotFoundError') throw err;
      delete videoConstraints.deviceId;
      state.stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });
    }
    video.srcObject = state.stream;
    videoWrap.classList.toggle('mirror', !!CFG.camera.mirror);
    await video.play().catch(() => {});
  } catch (err) {
    alert('Không mở được webcam.\n' + err.message +
      '\n\nKiểm tra: Windows > Cài đặt > Quyền riêng tư > Camera > cho phép ứng dụng máy tính dùng camera.');
  }
}

async function startCanon() {
  const provider = (CFG.camera.canon && CFG.camera.canon.provider) || 'dcc';
  if (provider === 'dcc') return startDcc();
  return startEdsdk();
}

// Canon qua digiCamControl (HTTP webserver) — full-res + liveview.
async function startDcc() {
  try {
    if (!(await window.booth.dcc.available())) {
      console.warn('[dcc] digiCamControl không sẵn sàng');
      alert('Chưa kết nối máy ảnh Canon qua digiCamControl.\n\nKiểm tra: digiCamControl đang MỞ, đã bật Webserver, máy ảnh bật + cắm cáp (đừng mở EOS Utility).\n\nTạm dùng webcam.');
      return false;
    }
    state.usingCanon = true; state.usingDcc = true;
    videoWrap.classList.remove('mirror');
    // ⚠ R50 + digiCamControl 2.1.7.0: bật Live View làm HỎNG lệnh chụp ("Invalid Handle")
    // cho tới khi khởi động lại dcc. Vì vậy KHÔNG bật live view — thay xem-trước trực tiếp
    // bằng màn hướng dẫn "Nhìn vào máy ảnh" + đếm ngược. Ảnh chụp full-res luôn chạy ổn.
    if (state.dccTimer) { clearInterval(state.dccTimer); state.dccTimer = null; }
    video.style.display = 'none';
    liveImg.style.display = 'none';
    const guide = document.getElementById('canon-guide');
    if (guide) guide.classList.add('show');
    return true;
  } catch (err) { console.error('[dcc] start error', err); return false; }
}

async function startEdsdk() {
  try {
    if (!(await window.booth.canon.available())) {
      console.warn('[canon] module not available');
      return false;
    }
    const res = await window.booth.canon.init();
    if (!res.ok) {
      alert('Không kết nối được máy ảnh Canon:\n' + res.reason + '\n\nTạm dùng webcam.');
      return false;
    }
    state.usingCanon = true;
    videoWrap.classList.remove('mirror'); // DSLR ảnh không lật gương
    if (!state.canonUnsub) {
      state.canonUnsub = window.booth.canon.onLiveViewFrame((dataUrl) => { liveImg.src = dataUrl; });
    }
    await window.booth.canon.startLiveView((CFG.camera.canon && CFG.camera.canon.liveViewFps) || 15);
    video.style.display = 'none';
    liveImg.style.display = 'block';
    return true;
  } catch (err) {
    console.error('[canon] start error', err);
    return false;
  }
}

async function stopCamera() {
  if (state.stream) {
    state.stream.getTracks().forEach((t) => t.stop());
    state.stream = null;
    video.srcObject = null;
  }
  if (state.dccTimer) { clearInterval(state.dccTimer); state.dccTimer = null; }
  { const guide = document.getElementById('canon-guide'); if (guide) guide.classList.remove('show'); }
  if (state.usingDcc) { state.usingDcc = false; state.usingCanon = false; return; }
  if (state.usingCanon) {
    try { await window.booth.canon.stopLiveView(); } catch (_e) {}
    try { await window.booth.canon.shutdown(); } catch (_e) {}
    state.usingCanon = false;
  }
}

// Chụp full-res từ Canon (digiCamControl hoặc EDSDK).
async function canonCapture() {
  if (state.usingDcc) return window.booth.dcc.capture();
  return window.booth.canon.capture();
}

// Cạnh dài tối đa của khung ảnh thô. Ô ảnh lớn nhất trên khung ~1120×1540 nên 2400px
// vẫn dư nét để in, nhưng làm đẹp/ghép nhanh hơn nhiều so với ảnh gốc 24MP của DSLR.
const FRAME_MAX_DIM = 2400;

/** Turn a data URL into a canvas (used for full-res Canon photos), downscaled to maxDim. */
function dataUrlToCanvas(dataUrl, maxDim) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const s = maxDim ? Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight)) : 1;
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, c.width, c.height);
      resolve(c);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// ---- filters UI ----
function buildFilterBar(container, onPick) {
  container.innerHTML = '';
  CFG.filters.forEach((f) => {
    const chip = document.createElement('button');
    chip.className = 'filter-chip' + (f.id === state.filter.id ? ' active' : '');
    chip.textContent = f.name;
    chip.addEventListener('click', () => {
      state.filter = f;
      document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
      // mark active in every filter bar
      document.querySelectorAll('.filter-bar').forEach((bar) => {
        [...bar.children].forEach((c) => { if (c.textContent === f.name) c.classList.add('active'); });
      });
      applyLivePreviewFilter();
      if (onPick) onPick(f);
    });
    container.appendChild(chip);
  });
}
function applyLivePreviewFilter() {
  const css = state.filter.css === 'none' ? 'none' : state.filter.css;
  video.style.filter = css;
  liveImg.style.filter = css;
  const t = state.filter.tint, tl = document.getElementById('live-tint');   // lớp ánh màu (Ấm / Lạnh / Cổ điển) giống ảnh ghép
  if (tl) {
    tl.style.background = t ? t.color : 'transparent';
    tl.style.opacity = t ? t.alpha : 0;
    tl.style.mixBlendMode = t ? (t.mode || 'soft-light') : 'normal';
  }
}

// ---- source selector (webcam vs Canon) ----
async function listWebcams(allowPrompt = true) {
  try {
    let devices = await navigator.mediaDevices.enumerateDevices();
    let cams = devices.filter((d) => d.kind === 'videoinput');
    // Labels are hidden until camera permission is granted once.
    if (allowPrompt && cams.length && !cams[0].label) {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        s.getTracks().forEach((t) => t.stop());
        devices = await navigator.mediaDevices.enumerateDevices();
        cams = devices.filter((d) => d.kind === 'videoinput');
      } catch {}
    }
    return cams;
  } catch { return []; }
}

async function buildSourceBar(allowPrompt = true) {
  const bar = $('#source-bar');
  const canonProvider = (CFG.camera.canon && CFG.camera.canon.provider) || 'dcc';
  const canonAvailable = (canonProvider === 'dcc')
    ? await window.booth.dcc.available().catch(() => false)
    : await window.booth.canon.available().catch(() => false);
  const cams = await listWebcams(allowPrompt);

  // If the saved choice is Canon but it isn't available, keep the choice but flag it.
  bar.innerHTML = '';

  const label = document.createElement('span');
  label.className = 'lbl';
  label.textContent = 'Nguồn ảnh:';
  bar.appendChild(label);

  const mkChip = (src, icon, text, enabled, connected) => {
    const chip = document.createElement('button');
    chip.className = 'source-chip' + (state.source === src ? ' active' : '');
    if (!enabled) {
      chip.setAttribute('disabled', '');
      chip.title = canonProvider === 'dcc'
        ? 'Chưa kết nối Canon. Mở digiCamControl + bật Webserver + cắm máy ảnh (đừng mở EOS Utility).'
        : 'Chưa có module Canon EDSDK trong bản cài này.';
    }
    chip.innerHTML = `<span class="dot${connected ? ' ok' : ''}"></span>${icon} ${text}`;
    chip.addEventListener('click', () => {
      if (!enabled) return;
      state.source = src;
      try { localStorage.setItem('booth.source', src); } catch {}
      snapshotLocalSettings();
      buildSourceBar();
    });
    return chip;
  };

  bar.appendChild(mkChip('webcam', '📷', 'Webcam', true, cams.length > 0));
  bar.appendChild(mkChip('canon', '📸', 'Máy ảnh Canon', canonAvailable, canonAvailable));

  // No (valid) saved choice yet → prefer a Canon camera (e.g. EOS R50 via UVC) over the laptop cam,
  // so what the picker shows is what actually gets opened.
  if (cams.length && cams[0].label && !cams.some((c) => c.deviceId === state.webcamDeviceId)) {
    const preferred = cams.find((c) => /canon|eos/i.test(c.label)) || cams[0];
    state.webcamDeviceId = preferred.deviceId;
  }

  // Webcam device picker (only when webcam chosen and more than one exists)
  if (state.source === 'webcam' && cams.length > 1) {
    const sel = document.createElement('select');
    sel.className = 'webcam-select';
    cams.forEach((c, i) => {
      const opt = document.createElement('option');
      opt.value = c.deviceId;
      opt.textContent = c.label || `Webcam ${i + 1}`;
      if (state.webcamDeviceId === c.deviceId) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => {
      state.webcamDeviceId = sel.value;
      try { localStorage.setItem('booth.webcamId', sel.value); } catch {}
    });
    bar.appendChild(sel);
  }

  // Status line
  const status = document.createElement('div');
  status.className = 'source-status';
  if (state.source === 'canon') {
    if (canonProvider === 'dcc') {
      status.textContent = canonAvailable
        ? '✅ Sẵn sàng dùng máy ảnh Canon (digiCamControl). Giữ digiCamControl mở + máy bật.'
        : '⚠️ Chưa kết nối Canon — sẽ tự dùng webcam. Mở digiCamControl + bật Webserver + cắm máy.';
    } else {
      status.textContent = canonAvailable
        ? '✅ Máy ảnh Canon (EDSDK). Cắm cáp USB + bật máy, TẮT EOS Utility / digiCamControl trước khi chụp.'
        : '⚠️ Bản cài thiếu module Canon EDSDK — sẽ tự dùng webcam.';
    }
  } else {
    status.textContent = cams.length
      ? `Đang dùng webcam${cams.length > 1 ? ' (chọn thiết bị bên trên)' : ''}.`
      : '⚠️ Không thấy webcam nào.';
  }
  bar.appendChild(status);
}

// ---- mode grid ----
function shotsLabel(m) {
  const cap = m.captureCount || m.select || 1, sel = m.select || cap;
  return cap > sel ? `Chụp ${cap} · chọn ${sel}` : `${cap} tấm`;
}
const MOTION_ICON = { gif: 'i-gif', boomerang: 'i-loop', video: 'i-video' };
function buildModeGrid() {
  const grid = $('#mode-grid'), motion = $('#mode-motion');
  grid.innerHTML = '';
  if (motion) motion.innerHTML = '';
  flowModes().forEach((m) => {
    if (m.kind !== 'photo' && motion) {   // GIF / Boomerang / Video → hàng thẻ ngang phía dưới
      const c = document.createElement('div');
      c.className = 'mcard';
      c.innerHTML = `<span class="ic"><svg><use href="#${MOTION_ICON[m.kind] || 'i-gif'}"/></svg></span>` +
        `<div><b>${esc(m.name)}</b><span class="d">${esc(m.desc || '')}</span></div>`;
      c.addEventListener('click', () => chooseMode(m));
      motion.appendChild(c);
      return;
    }
    const card = document.createElement('div');
    card.className = 'mode-card';
    // Ảnh mẫu: khung thật ghép ảnh minh hoạ (buildModeThumbs), chưa có thì dùng thumb/overlay.
    const preview = (state.modeThumbs && state.modeThumbs[m.id]) || m.thumb || m.overlay;
    card.innerHTML = `<div class="ph">${preview ? `<img class="thumb" src="${preview}" alt="">` : ''}</div>` +
      `<div class="nm">${esc(m.name)}</div><div class="ds"><span>${esc(m.desc || '')}</span><em>${shotsLabel(m)}</em></div>`;
    const im = card.querySelector('img');
    if (im) im.addEventListener('error', () => im.remove());
    card.addEventListener('click', () => chooseMode(m));
    grid.appendChild(card);
  });
}

// Ảnh mẫu cho thẻ chọn kiểu + màn chờ: ghép KHUNG THẬT với ảnh minh hoạ, dựng 1 lần lúc mở app
// (đổi PNG khung → ảnh mẫu tự đúng theo). Không đụng lượt chụp của khách nếu khách bấm vào giữa chừng.
function placeholderFrame(w, h, i) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  const tones = [['#E9E1F3', '#C9BBDD'], ['#F6E3EC', '#DDBFCF'], ['#E6E7F4', '#C2C5DE'], ['#F3E8E1', '#D9C6B8']][i % 4];
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, tones[0]); g.addColorStop(1, tones[1]);
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  const u = Math.min(w, h);
  x.fillStyle = 'rgba(92, 78, 116, .55)';
  x.beginPath(); x.ellipse(w / 2, h * 1.02, u * 0.42, u * 0.30, 0, Math.PI, 0); x.fill();
  x.beginPath(); x.ellipse(w / 2, h * 0.55, u * 0.17, u * 0.21, 0, 0, Math.PI * 2); x.fill();
  return c;
}
async function buildModeThumbs() {
  state.modeThumbs = state.modeThumbs || {};
  const keep = { beauty: state.beauty, filter: state.filter };
  const prev = { mode: state.mode, qrUrl: state.qrUrl, rawFrames: state.rawFrames };
  let touched = false;
  try {
    state.beauty = false; state.filter = CFG.filters[0];
    state.qrUrl = ((CFG.galleryQR && CFG.galleryQR.galleryBase) || '') + '#/';
    for (const m of CFG.modes) {
      if (!(m.slots && m.canvas)) continue;
      state.mode = m;
      const n = m.select || m.captureCount || 1;
      state.rawFrames = Array.from({ length: n }, (_, i) => placeholderFrame(900, 1100, i));
      let c;
      try { c = await composeTemplate(applyFrame(m, defaultFrame(m))); } catch (e) { console.warn('[thumb]', m.id, e.message); continue; }
      if (state.mode !== m) { touched = true; break; }   // khách đã bấm chọn kiểu → dừng, không ghi đè
      const k = 560 / Math.max(c.width, c.height);
      const t = document.createElement('canvas'); t.width = Math.round(c.width * k); t.height = Math.round(c.height * k);
      t.getContext('2d').drawImage(c, 0, 0, t.width, t.height);
      state.modeThumbs[m.id] = t.toDataURL('image/jpeg', 0.86);
    }
    // Luồng sự kiện: ảnh mẫu xếp quạt ở màn chờ = tối đa 3 khung CỦA SỰ KIỆN (không lấy khung luồng thường).
    const ev = state.flow;
    state.flowFan = null;
    if (ev && !touched) {
      const fan = [];
      for (const m of ev._modes) {
        if (!(m.slots && m.canvas)) continue;
        for (const f of eventFramesFor(ev, m)) {
          if (fan.length >= 3) break;
          state.mode = m;
          state.rawFrames = Array.from({ length: m.select || m.captureCount || 1 }, (_, i) => placeholderFrame(900, 1100, i));
          let c;
          try { c = await composeTemplate(applyFrame(m, f)); } catch (e) { console.warn('[thumb]', f.id, e.message); continue; }
          if (state.mode !== m || state.flow !== ev) { touched = true; break; }
          const k = 560 / Math.max(c.width, c.height);
          const t = document.createElement('canvas'); t.width = Math.round(c.width * k); t.height = Math.round(c.height * k);
          t.getContext('2d').drawImage(c, 0, 0, t.width, t.height);
          fan.push(t.toDataURL('image/jpeg', 0.86));
        }
        if (touched) break;
      }
      if (!touched) state.flowFan = fan;
    }
  } finally {
    state.beauty = keep.beauty; state.filter = keep.filter;
    if (!touched) { state.mode = prev.mode; state.qrUrl = prev.qrUrl; state.rawFrames = prev.rawFrames; }
  }
}

async function chooseMode(m) {
  state.mode = m;
  state.rawFrames = []; state.captured = null; state.sessionAnim = null; state._shareRes = null;
  state.frameId = null; state.framePreviews = {}; state.stickered = false;
  state.printCount = 0;
  clearBeautyCache();
  // refresh settings (price may have changed on the webadmin)
  try { state.settings = await window.booth.getSettings(); } catch (_e) {}
  const pay = state.settings && state.settings.payment;
  // Luồng sự kiện: thu tiền CHỈ khi sự kiện bật payment (mặc định tắt). Luồng thường: theo cài đặt chung.
  const needPay = state.flow ? !!(state.flow.payment && state.flow.payment.enabled) : !!(pay && pay.enabled);
  if (needPay) { await openPayScreen(m); }
  else { await beginCapture(m); }
}

async function beginCapture(m) {
  buildFilterBar($('#filter-bar-capture'));
  show('capture');
  await startCamera();
  applyLivePreviewFilter();
  renderShotDots(0);
  updateSafeFrame();
}

// Tỉ lệ vùng ảnh sẽ được IN cho kiểu chụp hiện tại (để vẽ khung nét đứt).
function cellAspectForMode(m) {
  const O = CFG.output;
  if (m.slots && m.slots.length) { const s = m.slots[0]; return (s.w && s.h) ? s.w / s.h : 1; }
  if (m.kind !== 'photo') return 1; // gif/boomerang ~ vuông
  if (m.layout === 'single') { const W = m.outW || O.photoW, H = m.outH || O.photoH, pad = 60, footer = 240; return (W - 2 * pad) / (H - 2 * pad - footer); }
  if (m.layout === 'single-wide') { const pad = 50, footer = 190; return (O.wideW - 2 * pad) / (O.wideH - 2 * pad - footer); }
  if (m.layout === 'strip') {
    const W = m.outW || O.stripW, H = m.outH || O.stripH, pad = 26, gap = 16, footer = 210, n = m.select || m.captureCount || 4;
    return (W - 2 * pad) / ((H - footer - 2 * pad - gap * (n - 1)) / n);
  }
  if (m.layout === 'grid') {
    const W = m.outW || O.photoW, H = m.outH || O.photoH, pad = 40, gap = 24, footer = 240;
    const cols = m.cols || 2, rows = m.rows || 2;
    const cellW = (W - 2 * pad - gap * (cols - 1)) / cols;
    const cellH = (H - footer - 2 * pad - gap * (rows - 1)) / rows;
    return cellW / cellH;
  }
  return 1;
}

// Vẽ khung nét đứt = phần ảnh thật sự được in (căn giữa) trên preview.
function updateSafeFrame() {
  const wrap = videoWrap;
  const el = $('#safe-frame');
  if (!CFG.showCaptureGuide || !state.mode) { wrap.classList.remove('guide'); return; }
  const rcell = cellAspectForMode(state.mode);
  const rect = wrap.getBoundingClientRect();
  const rprev = (rect.width && rect.height) ? rect.width / rect.height : (16 / 9);
  let wPct, hPct;
  if (rcell <= rprev) { hPct = 1; wPct = rcell / rprev; }
  else { wPct = 1; hPct = rprev / rcell; }
  el.style.width = Math.round(wPct * 100) + '%';
  el.style.height = Math.round(hPct * 100) + '%';
  wrap.classList.add('guide');
}

// ---- payment gate ----
function stopPayPoll() { if (state.payTimer) { clearInterval(state.payTimer); state.payTimer = null; } }
async function openPayScreen(m) {
  stopPayPoll();
  show('pay');
  state.paidHandled = false;
  $('#pay-status').textContent = '';
  $('#pay-qr').style.display = 'none';
  $('#pay-staff').style.display = 'none';
  $('#pay-pin').value = '';
  $('#pay-amount').textContent = 'Đang tạo đơn…';
  $('#pay-info').textContent = '';
  let order;
  try { order = await window.booth.pay.createOrder(m.id, state.flow ? state.flow.id : undefined); } catch (_e) { order = { enabled: false }; }
  if (!order || !order.enabled) { await beginCapture(m); return; }
  state.payOrder = order;
  const cur = order.currency || 'đ';
  $('#pay-amount').textContent = 'Số tiền: ' + Number(order.amount).toLocaleString('vi-VN') + cur;
  if (order.qrUrl) {
    $('#pay-qr').src = order.qrUrl; $('#pay-qr').style.display = 'block';
    $('#pay-info').textContent = 'Quét QR để chuyển khoản • Nội dung: ' + order.code;
  } else {
    $('#pay-info').textContent = 'Chưa cấu hình VietQR (điền tài khoản trên webadmin).';
  }
  if (order.allowStaffOverride) $('#pay-staff').style.display = 'flex';
  if (order.method === 'sepay') {
    $('#pay-status').textContent = 'Đang chờ xác nhận chuyển khoản…';
    state.payTimer = setInterval(async () => {
      const r = await window.booth.pay.check(order.amount, order.code).catch(() => ({ paid: false }));
      if (r.paid) { $('#pay-status').textContent = '✅ Đã nhận thanh toán!'; onPaid(m); }
    }, 3000);
  }
}
async function onPaid(m) {
  if (state.paidHandled) return; // các lần poll SePay chồng nhau → chỉ vào chụp 1 lần
  state.paidHandled = true;
  stopPayPoll();
  await beginCapture(m);
}
$('#pay-confirm').addEventListener('click', async () => {
  const r = await window.booth.pay.verifyPin($('#pay-pin').value).catch(() => ({ ok: false }));
  $('#pay-pin').value = '';
  if (!r.ok) { $('#pay-status').textContent = '❌ Sai PIN nhân viên.'; return; }
  onPaid(state.mode);
});

const _shotThumbs = new WeakMap();
function shotThumb(cv) {
  let u = _shotThumbs.get(cv);
  if (!u) {
    const k = 240 / Math.max(cv.width, cv.height);
    const t = document.createElement('canvas'); t.width = Math.round(cv.width * k); t.height = Math.round(cv.height * k);
    t.getContext('2d').drawImage(cv, 0, 0, t.width, t.height);
    u = t.toDataURL('image/jpeg', 0.7); _shotThumbs.set(cv, u);
  }
  return u;
}
function renderShotDots(done) {
  const total = state.mode.kind === 'photo' ? (state.mode.captureCount || state.mode.select || 1) : 1;
  const lbl = $('#shot-count');
  if (lbl) lbl.textContent = state.mode.kind !== 'photo' ? 'Ảnh động' : (total > 1 ? `Tấm ${Math.min(done + 1, total)} / ${total}` : 'Ảnh đơn');
  shotProgress.innerHTML = '';
  if (total <= 1) return;
  for (let i = 0; i < total; i++) {
    const d = document.createElement('div');
    d.className = 'shot-dot' + (i < done ? ' done' : '');
    const cv = i < done && state.captured && state.captured[i];
    if (cv) d.style.backgroundImage = `url(${shotThumb(cv)})`;
    shotProgress.appendChild(d);
  }
}

// ---- capture helpers ----
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Grab one raw (unfiltered) frame from whichever preview is active.
// Used for webcam shots and for GIF/Boomerang bursts (incl. Canon live view).
function grabRawFrame() {
  const canon = state.usingCanon;
  const el = canon ? liveImg : video;
  const vw = canon ? (el.naturalWidth || CFG.camera.width) : el.videoWidth;
  const vh = canon ? (el.naturalHeight || CFG.camera.height) : el.videoHeight;
  const c = document.createElement('canvas');
  c.width = vw; c.height = vh;
  const ctx = c.getContext('2d');
  // Mirror only the webcam preview so selfies feel natural; DSLR stays true.
  if (!canon && CFG.camera.mirror) { ctx.translate(vw, 0); ctx.scale(-1, 1); }
  ctx.drawImage(el, 0, 0, vw, vh);
  return c;
}

async function runCountdown(seconds) {
  const total = seconds || CFG.countdownSeconds || 3;
  countdownEl.classList.add('show');
  for (let n = total; n >= 1; n--) {
    countdownEl.textContent = n;
    countdownEl.classList.remove('show'); void countdownEl.offsetWidth; countdownEl.classList.add('show');
    await wait(1000);
  }
  // Đếm xong là chụp luôn — không hiện icon giữa khung (che mặt khách lúc tạo dáng).
  countdownEl.classList.remove('show');
  countdownEl.textContent = '';
  // flash
  flashEl.classList.add('fire');
  setTimeout(() => flashEl.classList.remove('fire'), 400);
}

async function captureBurst(nFrames, delay) {
  // Canon qua dcc KHÔNG có live view → chụp full-res từng khung (chậm hơn, ít khung hơn).
  // EDSDK có live view → lấy khung từ live view như webcam (nhanh, không tốn màn trập).
  if (state.usingDcc) {
    const n = Math.min(nFrames, 5); // giới hạn cho đỡ lâu (mỗi khung ~1.5-2s)
    const frames = [];
    for (let i = 0; i < n; i++) {
      try { const shot = await canonCapture(); frames.push(await dataUrlToCanvas(shot.dataUrl, FRAME_MAX_DIM)); }
      catch (_e) { /* bỏ khung lỗi */ }
    }
    return frames;
  }
  const frames = [];
  for (let i = 0; i < nFrames; i++) {
    frames.push(grabRawFrame());
    await wait(delay);
  }
  return frames;
}

// ---- main capture flow (Ảnh / GIF / Boomerang / Video) ----
async function captureOneShot() {
  const canonFullRes = state.usingCanon && CFG.camera.canon && CFG.camera.canon.fullResPhoto;
  if (canonFullRes) { const shot = await canonCapture(); return await dataUrlToCanvas(shot.dataUrl, FRAME_MAX_DIM); }
  return grabRawFrame();
}
async function runCaptureFlow() {
  if (state.busy || (!state.stream && !state.usingCanon)) return;
  state.busy = true;
  $('#btn-capture').disabled = true;

  try {
    const m = state.mode;
    if (m.kind === 'photo') {
      const cap = m.captureCount || m.select || 1;
      state.captured = [];
      const prep = CFG.prepSeconds || CFG.countdownSeconds || 3;
      for (let i = 0; i < cap; i++) {
        await runCountdown(prep);
        state.captured.push(await captureOneShot());
        renderShotDots(i + 1);
        if (i < cap - 1) await wait(600); // xem nhanh ảnh vừa chụp rồi qua tấm sau
      }
      const need = m.select || cap;
      state.sessionAnim = null; // new session
      if (need < state.captured.length) { openSelectScreen(need); return; }
      state.rawFrames = state.captured.slice();
      if (CFG.reviewShots) { openReviewScreen(); return; } // xem lại / chụp lại từng tấm
    } else if (m.kind === 'video') {
      await runCountdown(CFG.countdownSeconds || 3);
      const dataUrl = await recordVideo();
      state.rawFrames = null; state.captured = null; state.sessionAnim = null;
      showResult({ dataUrl, kind: 'video' });
      return;
    } else {
      // gif / boomerang: đếm ngược 1 lần rồi chụp loạt
      await runCountdown(CFG.countdownSeconds);
      state.rawFrames = await captureBurst(m.frames, m.frameDelay);
      state.captured = null;
      state.sessionAnim = null;
    }

    await finishToResult();
  } catch (err) {
    console.error(err);
    alert('Có lỗi khi xử lý: ' + err.message);
    show('capture');
  } finally {
    state.busy = false;
    $('#btn-capture').disabled = false;
  }
}
$('#btn-capture').addEventListener('click', runCaptureFlow);

// ---- Xem lại / chụp lại từng tấm (photo) ----
function openReviewScreen() {
  const grid = $('#review-grid');
  grid.innerHTML = '';
  state.captured.forEach((cv, idx) => {
    const cell = document.createElement('div');
    cell.className = 'review-cell';
    const num = document.createElement('span'); num.className = 'review-num'; num.textContent = idx + 1;
    const img = document.createElement('img'); img.src = cv.toDataURL('image/jpeg', 0.7);
    const btn = document.createElement('button'); btn.className = 'review-retake'; btn.innerHTML = '<svg><use href="#i-redo"/></svg>Chụp lại';
    btn.addEventListener('click', () => retakeShot(idx));
    cell.appendChild(num); cell.appendChild(img); cell.appendChild(btn);
    grid.appendChild(cell);
  });
  show('review');
}
async function retakeShot(idx) {
  if (state.busy) return;
  state.busy = true;
  show('capture');
  try {
    const prep = CFG.prepSeconds || CFG.countdownSeconds || 3;
    await runCountdown(prep);
    state.captured[idx] = await captureOneShot();
    state.rawFrames = state.captured.slice();
    state.sessionAnim = null;
  } catch (e) { alert('Lỗi chụp lại: ' + e.message); }
  finally { state.busy = false; openReviewScreen(); }
}
$('#btn-review-continue').addEventListener('click', () => {
  state.rawFrames = state.captured.slice();
  finishToResult();
});
$('#btn-review-retakeall').addEventListener('click', () => { show('capture'); runCaptureFlow(); });

// ---- Quay video ngắn (webcam hoặc liveview Canon) → WebM ----
async function recordVideo() {
  const m = state.mode;
  const secs = m.seconds || 6;
  const fps = m.fps || 15;
  const src = state.usingCanon ? liveImg : video;
  const sw = src.naturalWidth || src.videoWidth || 1280;
  const sh = src.naturalHeight || src.videoHeight || 720;
  const c = document.createElement('canvas');
  c.width = Math.min(sw, 1280);
  c.height = Math.round(c.width * sh / sw) || 720;
  const ctx = c.getContext('2d');
  const stream = c.captureStream(fps);
  let mime = 'video/webm;codecs=vp9'; if (!window.MediaRecorder || !MediaRecorder.isTypeSupported(mime)) mime = 'video/webm';
  const rec = new MediaRecorder(stream, { mimeType: mime });
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  const stopped = new Promise((res) => { rec.onstop = res; });
  // chỉ báo đang quay
  countdownEl.classList.add('show'); countdownEl.textContent = '● REC';
  rec.start();
  const t0 = Date.now();
  const mirror = !state.usingCanon && CFG.camera.mirror;
  await new Promise((resolve) => {
    const draw = () => {
      try {
        if (mirror) { ctx.save(); ctx.translate(c.width, 0); ctx.scale(-1, 1); ctx.drawImage(src, 0, 0, c.width, c.height); ctx.restore(); }
        else ctx.drawImage(src, 0, 0, c.width, c.height);
      } catch (_e) {}
      const left = Math.ceil((secs * 1000 - (Date.now() - t0)) / 1000);
      countdownEl.textContent = '● ' + Math.max(0, left) + 's';
      if (Date.now() - t0 >= secs * 1000) { resolve(); return; }
      setTimeout(draw, 1000 / fps);
    };
    draw();
  });
  countdownEl.classList.remove('show');
  rec.stop();
  await stopped;
  const blob = new Blob(chunks, { type: 'video/webm' });
  return await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
}

// Compose the selected frames and go to the result screen.
async function finishToResult() {
  // Mã LƯỢT chụp + link QR (động) — đặt trước khi ghép để vẽ đúng QR lên ảnh.
  const q = CFG.galleryQR || {};
  state.sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  state.qrUrl = (q.mode === 'session')
    ? ((q.galleryBase || '') + '#/s/' + state.sessionId)
    : ((q.galleryBase || '') + '#/');
  state.framePreviews = {}; state.stickered = false;
  show('processing');
  $('#proc-text').textContent = state.mode.kind === 'photo' ? 'Đang ghép khung…' : 'Đang tạo ảnh động…';
  await wait(60); // let UI paint
  const out = await composeOutput();
  showResult(out);
}

// Hiện kết quả: ảnh/gif qua <img>, video qua <video>. Ẩn công cụ ảnh khi là video.
function showResult(out) {
  state.lastOutput = out;
  state._shareRes = null;
  const img = $('#result-img'), vid = $('#result-video');
  const isVideo = out.kind === 'video';
  const show1 = (el, on) => { if (el) el.style.display = on ? 'block' : 'none'; };
  const imgOnly = ['#btn-sticker', '#btn-print', '#filter-bar-result', '#consent-row'];
  imgOnly.forEach((sel) => { const el = $(sel); if (el) el.style.display = isVideo ? 'none' : ''; });
  const fb = $('#btn-frame');
  if (fb) fb.style.display = (!isVideo && out.kind !== 'gif' && state.mode && state.mode.kind === 'photo' && modeFrames(state.mode).length > 1) ? '' : 'none';
  if (state.flow && !(state.flow.gallery && state.flow.gallery.public)) { const cr = $('#consent-row'); if (cr) cr.style.display = 'none'; }   // sự kiện riêng tư
  updatePrintBtn();
  if (isVideo) {
    show1(img, false);
    if (vid) { vid.src = out.dataUrl; show1(vid, true); vid.play().catch(() => {}); }
  } else {
    if (vid) { vid.pause(); vid.removeAttribute('src'); show1(vid, false); }
    if (img) { img.src = out.dataUrl; show1(img, true); }
    buildFilterBar($('#filter-bar-result'), () => rerenderResult());
  }
  show('result');
}

// ---- photo selection screen ----
function openSelectScreen(need) {
  state.selNeed = need;
  state.selOrder = [];
  $('#select-title').textContent = `Chọn ${need} ảnh đẹp nhất (chạm theo thứ tự)`;
  const grid = $('#select-grid');
  grid.innerHTML = '';
  state.captured.forEach((cv, idx) => {
    const cell = document.createElement('div');
    cell.className = 'select-cell';
    const img = document.createElement('img');
    img.src = cv.toDataURL('image/jpeg', 0.7);
    const ord = document.createElement('div');
    ord.className = 'order';
    cell.appendChild(img); cell.appendChild(ord);
    cell.addEventListener('click', () => toggleSelect(idx));
    grid.appendChild(cell);
  });
  refreshSelOrders();
  show('select');
}
function toggleSelect(idx) {
  const pos = state.selOrder.indexOf(idx);
  if (pos >= 0) state.selOrder.splice(pos, 1);
  else { if (state.selOrder.length >= state.selNeed) return; state.selOrder.push(idx); }
  refreshSelOrders();
}
function refreshSelOrders() {
  const cells = [...$('#select-grid').children];
  cells.forEach((cell, idx) => {
    const pos = state.selOrder.indexOf(idx);
    cell.classList.toggle('picked', pos >= 0);
    cell.querySelector('.order').textContent = pos >= 0 ? (pos + 1) : '';
  });
  $('#select-count').textContent = `Đã chọn ${state.selOrder.length}/${state.selNeed}`;
  $('#btn-select-continue').disabled = state.selOrder.length !== state.selNeed;
}
$('#btn-select-continue').addEventListener('click', async () => {
  state.rawFrames = state.selOrder.map((i) => state.captured[i]);
  await finishToResult();
});
$('#btn-select-retake').addEventListener('click', () => { show('capture'); });

// re-render result when the filter changes on the result screen
async function rerenderResult(msg, keepPreviews) {
  show('processing');
  $('#proc-text').textContent = msg || 'Đang áp bộ lọc…';
  if (!keepPreviews) state.framePreviews = {};   // bộ lọc đổi → ảnh xem trước các khung cũng đổi
  state.stickered = false;
  await wait(40);
  const out = await composeOutput();
  state.lastOutput = out;
  state.sessionAnim = null; // filter changed → rebuild animations on next share
  state._shareRes = null;   // …và QR/upload mới cho ảnh đã đổi bộ lọc
  $('#result-img').src = out.dataUrl;
  show('result');
}

/* ================= beauty (mịn da + làm nét) ================= */
const _beautyCache = new Map();
function clearBeautyCache() { _beautyCache.clear(); }

const newCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// Làm nét cho BẢN IN (unsharp mask Gauss 3×3, ~0.8px ở 300dpi) — chạy SAU khi ảnh đã về đúng kích thước ô in,
// nên độ nét giữ nguyên tới giấy. threshold: chênh lệch nhỏ hơn ngưỡng (hạt nhiễu ISO, vùng da phẳng) không bị đẩy lên.
function printSharpen(g, w, h, amount, threshold = 4) {
  if (!(amount > 0) || w < 3 || h < 3) return;
  const img = g.getImageData(0, 0, w, h), d = img.data, s = new Uint8ClampedArray(d), row = w * 4;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const p = i + c;
        const blur = (4 * s[p] + 2 * (s[p - 4] + s[p + 4] + s[p - row] + s[p + row])
          + s[p - row - 4] + s[p - row + 4] + s[p + row - 4] + s[p + row + 4]) / 16;
        const diff = s[p] - blur, ad = diff < 0 ? -diff : diff;
        if (ad <= threshold) continue;
        d[p] = s[p] + amount * diff * (ad - threshold) / ad;
      }
    }
  }
  g.putImageData(img, 0, 0);
}

// Thu nhỏ chất lượng cao: giảm từng nấc ½ (mỗi nấc smoothing 'high') rồi về đúng W×H.
// Thu 1 lần từ ảnh 2400px xuống ô 600px làm mất chi tiết / răng cưa — đây là 1 nguyên nhân ảnh in bị bệt.
function resampleHQ(src, sx, sy, sw, sh, W, H) {
  let cur = src;
  while (sw / 2 >= W && sh / 2 >= H) {
    const nw = Math.round(sw / 2), nh = Math.round(sh / 2), c = newCanvas(nw, nh), g = c.getContext('2d');
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(cur, sx, sy, sw, sh, 0, 0, nw, nh);
    cur = c; sx = 0; sy = 0; sw = nw; sh = nh;
  }
  const out = newCanvas(W, H), g = out.getContext('2d');
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(cur, sx, sy, sw, sh, 0, 0, W, H);
  return out;
}

// Làm đẹp (cache theo ảnh): MỊN DA CHỈ Ở VÙNG DA, giữ nguyên đường nét (mắt, mi, tóc, viền áo) + sáng da nhẹ.
// Không làm mờ cả ảnh như bản cũ (phủ bản blur 45% lên toàn ảnh → ảnh in bị mờ).
// smooth = độ mịn da (0–1), glow = sáng da (0–0.2). Làm nét do printSharpen() đảm nhận ở bước ghép khung.
function beautifyCanvas(src) {
  const b = CFG.beauty || {};
  const w = src.width, h = src.height;
  const out = newCanvas(w, h), ctx = out.getContext('2d');
  ctx.drawImage(src, 0, 0);
  const smooth = Math.min(1, b.smooth || 0), glow = b.glow || 0;
  if (smooth <= 0 && glow <= 0) return out;

  const r = Math.max(2, Math.round(Math.min(w, h) * 0.006));   // bán kính làm mịn ~ lỗ chân lông / mụn nhỏ
  const bl = newCanvas(w, h), bg = bl.getContext('2d');
  bg.filter = `blur(${r}px)`; bg.drawImage(src, 0, 0);
  const O = ctx.getImageData(0, 0, w, h), od = O.data, B = bg.getImageData(0, 0, w, h).data;

  // 1) mặt nạ màu da (YCbCr) — làm mềm mép mặt nạ để không lộ ranh giới
  const mask = new ImageData(w, h), md = mask.data;
  for (let i = 0; i < od.length; i += 4) {
    const R = od[i], G = od[i + 1], Bc = od[i + 2];
    const Y = 0.299 * R + 0.587 * G + 0.114 * Bc;
    const cb = 128 - 0.1687 * R - 0.3313 * G + 0.5 * Bc, cr = 128 + 0.5 * R - 0.4187 * G - 0.0813 * Bc;
    let m = 1 - ((cb - 104) / 26) ** 2 - ((cr - 150) / 22) ** 2;
    m = m <= 0 ? 0 : Math.min(1, m * 2.2);
    if (Y < 45) m *= Y / 45;
    md[i + 3] = m * 255;
  }
  const mc = newCanvas(w, h), mg = mc.getContext('2d'); mg.putImageData(mask, 0, 0);
  const ms = newCanvas(w, h), msg = ms.getContext('2d'); msg.filter = 'blur(3px)'; msg.drawImage(mc, 0, 0);
  const M = msg.getImageData(0, 0, w, h).data;

  // 2) trộn: chỉ vùng da + chỉ chỗ phẳng (chênh với bản blur nhỏ) → đường nét giữ nguyên độ sắc
  for (let i = 0; i < od.length; i += 4) {
    const m = M[i + 3] / 255;
    if (m < 0.02) continue;
    const yo = 0.299 * od[i] + 0.587 * od[i + 1] + 0.114 * od[i + 2];
    const yb = 0.299 * B[i] + 0.587 * B[i + 1] + 0.114 * B[i + 2];
    let we = 1 - Math.abs(yo - yb) / 20; we = we <= 0 ? 0 : we * we;
    const k = Math.min(0.85, smooth) * m * we, lift = 1 + glow * m;
    for (let c = 0; c < 3; c++) od[i + c] = (od[i + c] + (B[i + c] - od[i + c]) * k) * lift;
  }
  ctx.putImageData(O, 0, 0);
  return out;
}

// Return the frame to draw: beautified (cached) when beauty is on, else raw.
function frameFor(src) {
  if (!state.beauty) return src;
  let cached = _beautyCache.get(src);
  if (!cached) { cached = beautifyCanvas(src); _beautyCache.set(src, cached); }
  return cached;
}

/* ================= composition ================= */

function roundRectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Draw a photo, cover-fit, with optional rounded corners + filter.
// filter = chuỗi CSS hoặc bộ lọc trong config { css, tint: { color, alpha, mode } } — tint = lớp ánh màu phủ lên ảnh
// (vd soft-light cam / xanh) để ấm / mát mà không đổi màu da như hue-rotate.
// Chất lượng: cắt đúng vùng cover từ ảnh gốc → thu nhỏ từng nấc (resampleHQ) về ĐÚNG kích thước ô → bộ lọc + ánh màu
// → làm nét cho bản in (printSharpen, CFG.output.sharpen) → dán vào khung. Ảnh nhỏ (thumb < 300×300) bỏ qua làm nét cho nhanh.
function drawCover(ctx, src, dx, dy, dw, dh, filter, radius = 0) {
  const filterCss = filter && typeof filter === 'object' ? filter.css : filter;
  const tint = filter && typeof filter === 'object' ? filter.tint : null;
  const W = Math.max(1, Math.round(dw)), H = Math.max(1, Math.round(dh));
  const sw = src.width, sh = src.height;
  const scale = Math.max(W / sw, H / sh);
  const cw = W / scale, ch = H / scale;
  const cell = resampleHQ(src, (sw - cw) / 2, (sh - ch) / 2, cw, ch, W, H);
  let out = cell;
  if (filterCss && filterCss !== 'none') {
    out = newCanvas(W, H);
    const fg = out.getContext('2d');
    fg.filter = filterCss; fg.drawImage(cell, 0, 0); fg.filter = 'none';
  }
  const og = out.getContext('2d');
  if (tint && tint.color && tint.alpha > 0) {
    og.save();
    og.globalCompositeOperation = tint.mode || 'soft-light';
    og.globalAlpha = tint.alpha;
    og.fillStyle = tint.color;
    og.fillRect(0, 0, W, H);
    og.restore();
  }
  const sharp = CFG.output && CFG.output.sharpen != null ? CFG.output.sharpen : 0.8;
  if (W * H >= 90000) printSharpen(og, W, H, sharp);
  ctx.save();
  if (radius > 0) roundRectPath(ctx, dx, dy, dw, dh, radius);
  else { ctx.beginPath(); ctx.rect(dx, dy, dw, dh); }
  ctx.clip();
  ctx.drawImage(out, dx, dy, dw, dh);
  ctx.restore();
}

// Vibrant diagonal gradient (tím → hồng → cam) for the print background.
function brandBgGradient(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, CFG.brand.accent1);
  g.addColorStop(0.55, CFG.brand.accent2);
  g.addColorStop(1, CFG.brand.accent3 || CFG.brand.accent2);
  return g;
}

function fillBackground(ctx, w, h) {
  if (CFG.brand.frameStyle === 'white') { ctx.fillStyle = '#fff'; }
  else { ctx.fillStyle = brandBgGradient(ctx, w, h); }
  ctx.fillRect(0, 0, w, h);
}

function dateStr() {
  const d = new Date();
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Tagline + dòng ngày/nội dung: ưu tiên cấu hình trong app (⚙️), rồi config, rồi ngày hôm nay.
function brandTagline() {
  const o = state.brandOverride;
  if (o && typeof o.tagline === 'string') return o.tagline;
  return CFG.brand.tagline || '';
}
function brandSub() {
  const o = state.brandOverride && state.brandOverride.subFooter;
  if (o != null && String(o).trim() !== '') return o;
  if (CFG.brand.subFooter) return CFG.brand.subFooter;
  return dateStr();
}

// Footer: brand name + gold divider + date + tagline. White text on gradient,
// accent text on white frames. `y` = vertical center of the footer band.
function drawBrand(ctx, cx, y, big) {
  const onGradient = CFG.brand.frameStyle !== 'white';
  const s = big ? 1 : 0.72; // scale for the narrow strip
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const titleY = y - 48 * s;
  // Brand name in the brand blue.
  ctx.fillStyle = CFG.brand.brandTextColor || (onGradient ? '#ffffff' : CFG.brand.accent1);
  ctx.font = `800 ${Math.round(60 * s)}px "Segoe UI", sans-serif`;
  ctx.fillText(CFG.brand.footer, cx, titleY);

  // gold divider
  const lineW = 150 * s;
  ctx.strokeStyle = CFG.brand.gold || '#F7D774';
  ctx.lineWidth = Math.max(3 * s, 2);
  ctx.beginPath();
  ctx.moveTo(cx - lineW / 2, titleY + 34 * s);
  ctx.lineTo(cx + lineW / 2, titleY + 34 * s);
  ctx.stroke();

  // tagline (above the date)
  const tagline = brandTagline();
  if (tagline) {
    ctx.fillStyle = onGradient ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.5)';
    ctx.font = `italic 500 ${Math.round(22 * s)}px "Segoe UI", sans-serif`;
    ctx.fillText(tagline, cx, titleY + 66 * s);
  }

  // date at the very bottom
  const sub = brandSub();
  ctx.fillStyle = onGradient ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.55)';
  ctx.font = `600 ${Math.round(24 * s)}px "Segoe UI", sans-serif`;
  ctx.fillText(sub, cx, titleY + 100 * s);
}

// Load an image once and cache it (used for PNG frame overlays + logo).
const _imgCache = {};
function loadImage(src) {
  if (_imgCache[src]) return _imgCache[src];
  const p = (async () => {
    let realSrc = src;
    // Ảnh khung NGOÀI (file:// hoặc đường dẫn tuyệt đối Windows) → đọc qua tiến trình
    // chính thành dataURL để tránh "tainted canvas" làm hỏng xuất/in ảnh.
    if (/^file:/i.test(src) || /^[a-zA-Z]:[\\/]/.test(src)) {
      try {
        const r = await window.booth.readImage(src);
        if (r && r.ok && r.dataUrl) realSrc = r.dataUrl;
      } catch (_e) {}
    }
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Không nạp được ảnh: ' + src));
      img.src = realSrc;
    });
  })();
  _imgCache[src] = p;
  return p;
}

/* ================= nhiều khung cho một kiểu chụp (mode.frames[]) ================= */
// frames[0] = khung mặc định. Mỗi khung được ghi đè các trường dưới đây (KHÔNG ghi đè captureCount/select).
const FRAME_OVERRIDES = ['background', 'logo', 'texts', 'showBrand', 'canvas', 'slots', 'paper', 'noRotate', 'cut2inch', 'qr', 'textGroup'];
function readJSON(key) { try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (_e) { return {}; } }
const getFrameVis = () => readJSON('booth.frameHidden');      // { frameId: true(ẩn)/false(hiện) } — ghi đè riêng từng khung
const getFrameGroupsOn = () => readJSON('booth.frameGroups'); // { quockhanh: true, 'event:orientation': true, … }
function frameGroupKey(f) { return f.holiday || (f.event ? 'event:' + f.event : null); }
function isFrameHidden(f) {
  const own = getFrameVis();
  if (Object.prototype.hasOwnProperty.call(own, f.id)) return !!own[f.id];
  const g = frameGroupKey(f);
  if (g) return !getFrameGroupsOn()[g];   // khung dịp lễ / sự kiện: theo công tắc nhóm (mặc định tắt)
  return !!f.hidden;
}
// Khung đang hiện cho khách (khung mặc định luôn hiện). Luồng sự kiện → CHỈ khung sự kiện gán cho kiểu đó.
function modeFrames(m, includeHidden) {
  if (state.flow && m) {   // chỉ khung CÙNG SỐ ẢNH với lượt chụp (ảnh đã chụp xong trước khi chọn khung)
    const n = m.select || m.captureCount || 1, all = eventFramesFor(state.flow, m);
    const same = all.filter((f) => framePhotos(CFG.modes.find((x) => x.id === m.id) || m, f) === n);
    return same.length ? same : all;
  }
  const list = Array.isArray(m && m.frames) ? m.frames : [];
  return includeHidden ? list : list.filter((f, i) => i === 0 || !isFrameHidden(f));
}
// Khung mặc định: frames[0], hoặc khung sự kiện đang bật có defaultForEvent.
function defaultFrame(m) {
  if (state.flow && m) {   // luồng sự kiện: khung mặc định của sự kiện cho kiểu này
    const list = eventFramesFor(state.flow, m), id = frameAlias(state.flow.defaultFrame && state.flow.defaultFrame[m.id]);
    return list.find((f) => f.id === id) || list[0] || null;
  }
  const vis = modeFrames(m);
  return vis.find((f, i) => i > 0 && f.defaultForEvent) || vis[0] || null;
}
function currentFrame(m = state.mode) {
  const list = state.flow ? modeFrames(m) : (Array.isArray(m && m.frames) ? m.frames : []);
  return list.find((f) => f.id === state.frameId) || defaultFrame(m);
}
// Mode đã áp 1 khung (không sửa object gốc trong config). Giữ nguyên m.id.
function applyFrame(m, fr) {
  if (!m || !fr) return m;
  const out = Object.assign({}, m, { overlay: fr.overlay || m.overlay, frameId: fr.id, frameName: fr.name });
  FRAME_OVERRIDES.forEach((k) => { if (fr[k] !== undefined) out[k] = fr[k]; });
  if (fr.textColor && out.texts) out.texts = out.texts.map((t) => Object.assign({}, t, { color: fr.textColor }));
  return out;
}
function effectiveMode(m = state.mode) { return m ? applyFrame(m, currentFrame(m)) : m; }

/* ================= LUỒNG SỰ KIỆN (SPEC-LUONG-SU-KIEN.md) =================
   Cài đặt (booth-settings.json, sửa ở webadmin / Cài đặt): eventMode { enabled, activeEventId } + events[].
   state.flow = sự kiện ĐANG ÁP DỤNG (null = luồng thường). Chỉ đổi khi ở màn chờ — không đổi giữa lượt chụp. */
state.flow = null; state.flowPending = false; state.printCount = 0;
// Tìm khung theo id: khung thường (modes[].frames) rồi thư viện khung sự kiện (eventFrames).
const frameAlias = (id) => (id && (CFG.frameAliases || {})[id]) || id;   // id khung đã bỏ → khung thay thế
function getFrameById(id) {
  id = frameAlias(id);
  if (!id) return null;
  for (const m of CFG.modes) { const f = (Array.isArray(m.frames) ? m.frames : []).find((x) => x.id === id); if (f) return f; }
  const f = (CFG.eventFrames || []).find((x) => x.id === id);
  if (!f) console.warn('[sự kiện] không có khung', id);
  return f || null;
}
// Khung của sự kiện cho 1 kiểu chụp; không có khung hợp lệ → khung mặc định của kiểu đó (không bao giờ kẹt).
function eventFramesFor(ev, m) {
  const ids = (ev.frames && ev.frames[m.id]) || [];
  const own = Array.isArray(m.frames) ? m.frames : [];
  const list = ids.map(getFrameById).filter((f) => f && (own.includes(f) || f.mode === m.id));
  return list.length ? list : own.slice(0, 1);
}
function inSchedule(ev, now = Date.now()) {
  const sc = ev.schedule || {};
  const a = sc.startAt ? Date.parse(sc.startAt) : NaN, b = sc.endAt ? Date.parse(sc.endAt) : NaN;
  return !(a === a && now < a) && !(b === b && now > b);
}
// Sự kiện đang chạy (đã kiểm tra hợp lệ) hoặc null = luồng thường. Dữ liệu thiếu/hỏng → luồng thường.
function activeEvent(settings = state.settings) {
  const em = settings && settings.eventMode;
  if (!em || !em.enabled) return null;
  const ev = (settings.events || []).find((e) => e && e.id === em.activeEventId);
  if (!ev || !inSchedule(ev)) return null;
  const modes = (ev.modes || []).map((id) => CFG.modes.find((m) => m.id === id))
    .filter((m) => m && (m.kind === 'photo' || ev.allowAnimated !== false));
  if (!modes.length) return null;
  return Object.assign({}, ev, { _modes: modes });
}
// Lý do sự kiện không chạy (hiện cảnh báo đỏ trong Cài đặt).
function eventProblem(settings = state.settings) {
  const em = settings && settings.eventMode;
  if (!em || !em.enabled) return '';
  const ev = (settings.events || []).find((e) => e && e.id === em.activeEventId);
  if (!ev) return 'Đã bật luồng sự kiện nhưng chưa chọn sự kiện hợp lệ → đang chạy luồng thường.';
  if (!inSchedule(ev)) return 'Sự kiện "' + ev.name + '" đang ngoài lịch chạy → đang chạy luồng thường.';
  if (!activeEvent(settings)) return 'Sự kiện "' + ev.name + '" chưa có kiểu chụp hợp lệ → đang chạy luồng thường.';
  return '';
}
// Số ảnh khác nhau của 1 khung (frames[].photos; không ghi → số ảnh mặc định của kiểu chụp).
function framePhotos(m, f) { return (f && Number(f.photos)) || m.select || m.captureCount || 1; }
// Luồng sự kiện: số tấm chụp/chọn THEO KHUNG MẶC ĐỊNH của sự kiện (vd khung dải 3 ảnh → Nhật Ký chụp 5 chọn 3).
// Trả về bản sao kiểu chụp (không sửa config); khung khác số ảnh không hiện trong bảng "Chọn khung" của lượt đó.
function eventMode(m) {
  const ev = state.flow;
  if (!ev || !m || m.kind !== 'photo') return m;
  const list = eventFramesFor(ev, m), id = frameAlias(ev.defaultFrame && ev.defaultFrame[m.id]);
  const n = framePhotos(m, list.find((f) => f.id === id) || list[0]);
  const sel = m.select || m.captureCount || 1, cap = m.captureCount || sel;
  if (n === sel) return m;
  return Object.assign({}, m, { select: n, captureCount: n + Math.max(0, cap - sel),
    desc: String(m.desc || '').replace(/\d+\s*ảnh/, n + ' ảnh') });
}
// Kiểu chụp khách thấy: luồng thường = tất cả; sự kiện = event.modes (+ GIF/Boomerang nếu cho phép).
function flowModes() {
  const ev = state.flow;
  if (!ev) return CFG.modes;
  const list = ev._modes.map(eventMode);
  if (ev.allowAnimated !== false) CFG.modes.forEach((m) => { if (m.kind !== 'photo' && !list.some((x) => x.id === m.id)) list.push(m); });
  return list;
}
// Nạp khung sự kiện khai báo ngoài app (frames.json trong C:\YoungBooth-Frames\events\<bộ>\) vào CFG.eventFrames.
async function loadExternalEventFrames() {
  if (!window.booth.eventFrames) return;
  try {
    const list = await window.booth.eventFrames();
    if (!Array.isArray(list)) return;
    CFG.eventFrames = (CFG.eventFrames || []).filter((f) => !f.source);   // bỏ bản nạp lần trước
    const ids = new Set(CFG.eventFrames.map((f) => f.id));
    list.forEach((f) => { if (f && f.id && !ids.has(f.id)) { CFG.eventFrames.push(f); ids.add(f.id); } });
  } catch (_e) {}
}
let _flowKey = null;
// Áp luồng đang bật (giao diện + khung). Gọi ở màn chờ; nếu đang có khách → để dành tới khi về màn chờ.
function applyFlow(force) {
  const ev = activeEvent();
  const key = ev ? JSON.stringify(ev) : '';
  state.flowPending = false;
  if (!force && key === _flowKey) return;
  _flowKey = key; state.flow = ev;
  applyEventTheme(ev);
  renderEventHome(ev);
  state.modeThumbs = {}; state.flowFan = null;
  renderHomeFan();
  buildModeGrid();
  resetConsent();
  updatePrintBtn();
  buildModeThumbs().then(() => { buildModeGrid(); renderHomeFan(); }).catch(() => {});
}
function maybeApplyFlow() {
  const atHome = screens.home && screens.home.classList.contains('active');
  if (atHome && !state.busy) applyFlow(); else state.flowPending = true;
}
// Sự kiện giao diện riêng (theme.style = 'custom')? Mặc định giữ giao diện YoungBooth như luồng thường.
const customUI = (ev) => !!(ev && ev.theme && ev.theme.style === 'custom');
function applyEventTheme(ev) {
  const b = document.body;
  b.classList.toggle('event-yb', !!ev && !customUI(ev));   // giao diện YoungBooth: chỉ ẩn ưu đãi + thêm dòng tên sự kiện
  const badge = $('#home-ev-badge');
  if (badge) badge.textContent = ev && !customUI(ev) ? ((ev.home && ev.home.title) || ev.name) : '';
  ev = customUI(ev) ? ev : null;                            // màu / màn chờ riêng chỉ khi giao diện riêng
  b.classList.toggle('event-mode', !!ev);
  const t = (ev && ev.theme) || {};
  const set = (k, v) => { if (v) b.style.setProperty(k, v); else b.style.removeProperty(k); };
  set('--ev-bg', ev ? (t.background || '#f4eefb') : '');
  set('--ev-accent', ev ? (t.accent || '#8d6ccf') : '');
  set('--ev-text', ev ? (t.textColor || '#2e2240') : '');
  set('--ev-img', ev && t.backgroundImage ? 'url("' + String(t.backgroundImage).replace(/"/g, '%22') + '")' : '');
  set('--ev-font', ev && t.font ? '"' + t.font + '", var(--font)' : '');
  const title = document.querySelector('#screen-mode .screen-title');
  if (title) {
    if (!title.dataset.orig) title.dataset.orig = title.innerHTML;
    title.innerHTML = ev ? esc(ev.name) + '<span>Chọn kiểu chụp</span>'
      : (state.flow ? title.dataset.orig.replace(/<span>[\s\S]*<\/span>/, '<span>' + esc(state.flow.name) + '</span>') : title.dataset.orig);
  }
}
// Màn chờ sự kiện: logo, tiêu đề, lời chào, nút lớn, dải xem trước khung của sự kiện.
function renderEventHome(ev) {
  const box = $('#home-event');
  if (!box) return;
  if (!customUI(ev)) { box.innerHTML = ''; return; }
  const h = ev.home || {}, t = ev.theme || {};
  const thumbs = [];
  ev._modes.forEach((m) => eventFramesFor(ev, m).forEach((f) => {
    const src = f.thumb || (f.overlay || m.overlay);
    if (src && !thumbs.includes(src)) thumbs.push(src);
  }));
  const strip = thumbs.length ? `<div class="ev-strip"><div class="ev-track${thumbs.length > 3 ? ' run' : ''}">` +
    (thumbs.length > 3 ? thumbs.concat(thumbs) : thumbs).map((u) => `<img src="${esc(u)}" alt="">`).join('') + '</div></div>' : '';
  box.innerHTML =
    (t.logo ? `<img class="ev-logo" src="${esc(t.logo)}" alt="">` : '') +
    `<h1 class="ev-title">${esc(h.title || ev.name)}</h1>` +
    (h.subtitle ? `<p class="ev-sub">${esc(h.subtitle)}</p>` : '') +
    (h.welcome ? `<p class="ev-welcome">${esc(h.welcome)}</p>` : '') +
    `<button class="btn btn-primary btn-cta" id="btn-ev-start" type="button"><span class="lbl">${esc(h.buttonLabel || 'CHỤP ẢNH')}</span></button>` +
    strip +
    (h.showYoungBoothBrand !== false ? '<div class="ev-powered">Powered by <b>YOUNG BOOTH</b></div>' : '');
  box.querySelectorAll('img').forEach((im) => im.addEventListener('error', () => im.remove()));
  $('#btn-ev-start').addEventListener('click', startFlow);
}
// Nút bắt đầu: chọn kiểu chụp; sự kiện chỉ có 1 kiểu → vào chụp luôn.
function startFlow() {
  const list = flowModes();
  buildSourceBar();
  if (state.flow && list.length === 1) { chooseMode(list[0]); return; }
  buildModeGrid(); show('mode');
}
// Giới hạn số lần In mỗi lượt (sự kiện). 0 = không giới hạn.
function printLimit() {
  const p = state.flow && state.flow.print;
  const n = p ? Number(p.maxPrintsPerSession) || 0 : 0;
  return n > 0 ? n : 0;
}
function updatePrintBtn() {
  const lim = printLimit();
  ['#btn-print', '#se-print'].forEach((sel) => {
    const b = $(sel);
    if (!b) return;
    if (!lim) { b.disabled = false; setLbl(b, 'In ảnh'); return; }
    const left = Math.max(0, lim - (state.printCount || 0));
    b.disabled = left === 0;
    setLbl(b, left ? `In ảnh (còn ${left})` : 'Đã in đủ số bản');
  });
}

// Font tiếng Việt nhúng sẵn — nạp trước khi vẽ chữ lên canvas (canvas không tự đợi font → vẽ bằng font dự phòng).
// Danh sách lấy từ CHÍNH chữ của mọi khung (font + độ đậm + nghiêng), gồm cả khung sự kiện nạp từ frames.json;
// mỗi kiểu chỉ nạp 1 lần, gọi lại sau khi có khung mới thì nạp thêm phần còn thiếu.
const _fontLoads = new Map();
function ensureFrameFonts() {
  const specs = new Set(['400 48px "YB Script"', '400 32px "YB Serif"', '600 32px "YB Serif"', '700 32px "YB Serif"',
    '700 48px "Dancing Script"', '400 48px "Great Vibes"', '700 32px "Oswald"', '800 32px "Baloo 2"',
    '700 32px "Noto Serif"', '800 32px "Be Vietnam Pro"', 'italic 800 32px "Be Vietnam Pro"']);
  const addTexts = (texts) => (texts || []).forEach((t) => {
    if (t && t.ff) specs.add((t.italic ? 'italic ' : '') + (t.weight || '400') + ' 32px ' + t.ff);
  });
  (CFG.modes || []).forEach((m) => {
    addTexts(m.texts);
    (Array.isArray(m.frames) ? m.frames : []).forEach((f) => addTexts(f.texts));
  });
  (CFG.eventFrames || []).forEach((f) => addTexts(f.texts));
  specs.forEach((s) => {
    if (!_fontLoads.has(s)) _fontLoads.set(s, document.fonts.load(s, 'Thư Huỳnh Như ĐỘC LẬP Ệ ấ ư <3').catch(() => null));
  });
  return Promise.all(_fontLoads.values());
}

// Ảnh xem trước = ảnh THẬT của khách ghép vào khung đó (cache theo frameId trong lượt).
async function framePreview(m, f) {
  if (state.framePreviews[f.id]) return state.framePreviews[f.id];
  if (!state.rawFrames || !state.rawFrames.length) return null;
  const em = applyFrame(m, f);
  if (em.overlay) { try { await loadImage(em.overlay); } catch (_e) { console.warn('[frame] thiếu PNG', f.id, em.overlay); return 'missing'; } }
  try {
    const c = await composeTemplate(em);
    const k = 420 / Math.max(c.width, c.height);
    const t = document.createElement('canvas'); t.width = Math.round(c.width * k); t.height = Math.round(c.height * k);
    t.getContext('2d').drawImage(c, 0, 0, t.width, t.height);
    return (state.framePreviews[f.id] = t.toDataURL('image/jpeg', 0.72));
  } catch (e) { console.warn('[frame]', f.id, e.message); return null; }
}
let _pickerRun = 0;
async function openFramePicker() {
  const m = state.mode;
  if (!m || !state.lastOutput) return;
  const run = ++_pickerRun;
  const list = modeFrames(m), cur = currentFrame(m);
  $('#frame-picker-title').textContent = `Chọn khung — ${m.name}` + (state.flow ? ` · ${state.flow.name}` : '');
  const hiddenN = state.flow ? 0 : modeFrames(m, true).length - list.length;
  $('#frame-pick-note').textContent = hiddenN ? `${hiddenN} khung dịp lễ / sự kiện đang ẩn.` : '';
  const grid = $('#frame-grid');
  grid.innerHTML = '';
  const tiles = list.map((f) => {
    const em = applyFrame(m, f);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'frame-tile' + (f.id === cur.id ? ' on' : '');
    const ar = em.canvas ? `${em.canvas.w} / ${em.canvas.h}` : '2 / 3';
    b.innerHTML = `<span class="ph" style="aspect-ratio:${ar}"><img alt="" src="${esc(f.thumb || em.overlay || '')}"></span>` +
      `<span class="nm">${esc(f.name)}</span>` +
      `<span class="meta">${f.id === cur.id ? '<em class="tag now"><svg><use href="#i-check"/></svg>Đang dùng</em>' : ''}` +
      `${frameGroupKey(f) ? '<em class="tag">Dịp lễ / sự kiện</em>' : ''}</span>`;
    const im = b.querySelector('img');
    im.addEventListener('error', () => { im.style.visibility = 'hidden'; });   // thumb/overlay chưa có → ô trống, không hiện icon ảnh vỡ
    b.addEventListener('click', () => pickFrame(f));
    grid.appendChild(b);
    return { f, b, im };
  });
  $('#frame-picker').classList.add('show');
  for (const { f, b, im } of tiles) {   // thay dần bằng ảnh thật của khách (không chặn giao diện)
    if (run !== _pickerRun || !$('#frame-picker').classList.contains('show')) return;
    const url = await framePreview(m, f);
    if (url === 'missing') { b.classList.add('missing'); b.disabled = true; b.querySelector('.meta').innerHTML = '<em class="tag warn">Thiếu file khung</em>'; }
    else if (url) im.src = url;
  }
}
function closeFramePicker() { _pickerRun++; $('#frame-picker').classList.remove('show'); }
async function pickFrame(f) {
  const cur = currentFrame();
  if (cur && f.id === cur.id) { closeFramePicker(); return; }
  if (state.stickered && !(await askConfirm('Đổi khung sẽ xoá sticker đã dán. Tiếp tục?'))) return;
  state.frameId = f.id;
  closeFramePicker();
  await rerenderResult('Đang đổi khung…', true);
}
// Hộp xác nhận theo giao diện app (confirm() mặc định của Windows xấu và chặn luồng).
function askConfirm(msg) {
  return new Promise((resolve) => {
    const md = $('#confirm-modal');
    $('#confirm-text').textContent = msg;
    const done = (v) => { md.classList.remove('show'); $('#confirm-ok').onclick = $('#confirm-cancel').onclick = null; resolve(v); };
    $('#confirm-ok').onclick = () => done(true);
    $('#confirm-cancel').onclick = () => done(false);
    md.classList.add('show');
  });
}

async function composeOutput() {
  const m = state.mode;
  if (m.kind === 'photo') {
    const canvas = await composePhoto();
    return { dataUrl: canvas.toDataURL('image/png'), kind: 'photo' };
  }
  // gif / boomerang
  const dataUrl = await composeGif(m.kind === 'boomerang');
  return { dataUrl, kind: 'gif' };
}

async function composePhoto() {
  const m = effectiveMode();   // kiểu chụp + khung khách chọn (frames[])
  // Custom template: designer PNG + explicit photo slots → full control.
  if (m.slots && m.canvas) return composeTemplate(m);

  const O = CFG.output;
  const f = state.filter;   // { css, tint? }
  const rad = CFG.brand.photoRadius || 0;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const layout = m.layout;
  const showBrand = m.showBrand !== false;

  if (layout === 'single') {
    canvas.width = m.outW || O.photoW; canvas.height = m.outH || O.photoH;
    fillBackground(ctx, canvas.width, canvas.height);
    const pad = 60, footer = showBrand ? 240 : 60;
    drawCover(ctx, frameFor(state.rawFrames[0]), pad, pad, canvas.width - pad * 2, canvas.height - pad * 2 - footer, f, rad);
    if (showBrand) drawBrand(ctx, canvas.width / 2, canvas.height - footer / 2 - 4, true);

  } else if (layout === 'single-wide') {
    // Ảnh sự kiện NGANG (6×4) — rộng để lọt nhóm đông người.
    canvas.width = O.wideW; canvas.height = O.wideH;
    fillBackground(ctx, canvas.width, canvas.height);
    const pad = 50, footer = showBrand ? 190 : 50;
    drawCover(ctx, frameFor(state.rawFrames[0]), pad, pad, canvas.width - pad * 2, canvas.height - pad * 2 - footer, f, rad);
    if (showBrand) drawBrand(ctx, canvas.width / 2, canvas.height - footer / 2 - 6, true);

  } else if (layout === 'strip') {
    canvas.width = m.outW || O.stripW; canvas.height = m.outH || O.stripH;
    fillBackground(ctx, canvas.width, canvas.height);
    const pad = 26, gap = 16, footer = showBrand ? 210 : 26;
    const n = state.rawFrames.length;
    const cellW = canvas.width - pad * 2;
    const cellH = (canvas.height - footer - pad * 2 - gap * (n - 1)) / n;
    state.rawFrames.forEach((fr, i) => {
      drawCover(ctx, frameFor(fr), pad, pad + i * (cellH + gap), cellW, cellH, f, Math.min(rad, 18));
    });
    if (showBrand) drawBrand(ctx, canvas.width / 2, canvas.height - footer / 2 - 2, false);

  } else { // grid cols×rows
    canvas.width = m.outW || O.photoW; canvas.height = m.outH || O.photoH;
    fillBackground(ctx, canvas.width, canvas.height);
    const pad = 40, gap = 24, footer = showBrand ? 240 : 40;
    const cols = m.cols || 2, rows = m.rows || 2;
    const cellW = (canvas.width - pad * 2 - gap * (cols - 1)) / cols;
    const areaH = canvas.height - footer - pad * 2 - gap * (rows - 1);
    const cellH = areaH / rows;
    state.rawFrames.forEach((fr, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      drawCover(ctx, frameFor(fr), pad + c * (cellW + gap), pad + r * (cellH + gap), cellW, cellH, f, rad);
    });
    if (showBrand) drawBrand(ctx, canvas.width / 2, canvas.height - footer / 2 - 4, true);
  }

  // Optional PNG frame overlaid on top of the photos.
  if (m.overlay) {
    try { const img = await loadImage(m.overlay); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); }
    catch (e) { console.warn(e.message); }
  }
  await drawGalleryQR(ctx, canvas, m); // QR tĩnh góc ảnh → gallery
  return canvas;
}

// Template-driven layout: background, photos into named slots, then a PNG frame.
async function composeTemplate(m) {
  await ensureFrameFonts();   // canvas không tự đợi font → nạp font tiếng Việt trước khi vẽ chữ
  const f = state.filter;   // { css, tint? }
  const canvas = document.createElement('canvas');
  canvas.width = m.canvas.w; canvas.height = m.canvas.h;
  const ctx = canvas.getContext('2d');

  // Background: explicit color, gradient, or transparent (let the PNG provide it).
  if (m.background === 'gradient') ctx.fillStyle = brandBgGradient(ctx, canvas.width, canvas.height);
  else if (typeof m.background === 'string') ctx.fillStyle = m.background;
  else ctx.fillStyle = null;
  if (ctx.fillStyle) ctx.fillRect(0, 0, canvas.width, canvas.height);

  m.slots.forEach((s, i) => {
    const fr = state.rawFrames[i % state.rawFrames.length];
    if (fr) drawCover(ctx, frameFor(fr), s.x, s.y, s.w, s.h, f, s.radius || 0);
  });

  if (m.overlay) {
    try { const img = await loadImage(m.overlay); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); }
    catch (e) { console.warn(e.message); }
  }
  // Logo (ảnh màu) ở góc, nếu khung có khai báo.
  if (m.logo && m.logo.src) {
    try {
      const img = await loadImage(m.logo.src);
      const h = m.logo.h || 110;
      const w = m.logo.w || (h * (img.naturalWidth / img.naturalHeight || 3));
      const ly = m.logo.y != null ? m.logo.y : 48;
      if (Array.isArray(m.logo.xs)) m.logo.xs.forEach((cx) => ctx.drawImage(img, cx - w / 2, ly, w, h)); // nhiều cột (tâm)
      else {
        const lx = m.logo.center ? (canvas.width - w) / 2 : (m.logo.x != null ? m.logo.x : 60);
        ctx.drawImage(img, lx, ly, w, h);
      }
    } catch (e) { console.warn('logo:', e.message); }
  }
  drawFrameTexts(ctx, m); // chữ sửa được (tên/ngày/lời mời...) vẽ lên trên khung
  await drawGalleryQR(ctx, canvas, m); // QR tĩnh góc ảnh → gallery
  if (m.showBrand) drawBrand(ctx, canvas.width / 2, canvas.height - 120, true);
  return canvas;
}

// Vẽ QR ở 1 góc ảnh (động: QR riêng từng lượt state.qrUrl, hoặc tĩnh về gallery).
const _qrCache = {};
async function makeQRCached(url) {
  if (_qrCache[url]) return _qrCache[url];
  try { const r = await window.booth.makeQR(url); if (r && r.ok) { _qrCache[url] = r.dataUrl; return r.dataUrl; } } catch (_e) {}
  return null;
}
async function drawGalleryQR(ctx, canvas, m) {
  // Ghi đè theo khung: m.qr = false → không vẽ; { size, label:false, at:[{x,y},…] } → vẽ ở mọi vị trí trong at
  // (toạ độ = góc trên-trái ô QR); hoặc kiểu cũ { xs:[…], y, width }.
  const mq = (m || effectiveMode() || {}).qr;
  if (mq === false) return;
  const q = Object.assign({}, CFG.galleryQR || {}, mq || {});
  if (q.size) q.width = q.size;
  if (q.label === false) q.label = '';
  if (!q.enabled) return;
  const url = state.qrUrl || ((q.galleryBase || '') + '#/');
  if (!url) return;
  const qrData = await makeQRCached(url);
  if (!qrData) return;
  let img; try { img = await loadImage(qrData); } catch (_e) { return; }
  const qs = q.width || 168;
  const pad = Math.round(qs * 0.10);
  const labelH = q.label ? Math.round(qs * 0.22) : pad;
  const tileW = qs + pad * 2;
  const tileH = pad + qs + labelH;
  const mg = q.margin != null ? q.margin : 34;
  const corner = q.corner || 'br';
  // Khung có thể đặt QR riêng (m.qr.xs = mép trái từng ô QR, m.qr.y = mép trên) — vd dải đôi: mỗi dải 1 QR.
  const y0 = q.y != null ? q.y : (corner.indexOf('t') >= 0 ? mg : (canvas.height - mg - tileH));
  const spots = Array.isArray(q.at) && q.at.length ? q.at.map((p) => [p.x, p.y])
    : (Array.isArray(q.xs) ? q.xs : [corner.indexOf('l') >= 0 ? mg : (canvas.width - mg - tileW)]).map((x) => [x, y0]);
  const r = 16;
  const rr = (xx, yy, w, h, rad) => { ctx.beginPath(); ctx.moveTo(xx + rad, yy); ctx.arcTo(xx + w, yy, xx + w, yy + h, rad); ctx.arcTo(xx + w, yy + h, xx, yy + h, rad); ctx.arcTo(xx, yy + h, xx, yy, rad); ctx.arcTo(xx, yy, xx + w, yy, rad); ctx.closePath(); };
  for (const [x, y] of spots) {
    ctx.save();
    rr(x, y, tileW, tileH, r); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.12)'; rr(x, y, tileW, tileH, r); ctx.stroke();
    ctx.drawImage(img, x + pad, y + pad, qs, qs);
    if (q.label) {
      ctx.fillStyle = '#28283c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '800 ' + Math.round(qs * 0.125) + 'px "Segoe UI", Arial, sans-serif';
      ctx.fillText(q.label, x + tileW / 2, y + pad + qs + labelH / 2);
    }
    ctx.restore();
  }
}

// ---- Chữ động trên khung (sửa trong Cài đặt) ----
// Chạy 1 lần: xoá các giá trị MẪU cũ (ngày cố định, tên mẫu) đã bị lưu vào máy,
// để ngày tự cập nhật theo hôm nay. Giá trị nhân viên tự gõ khác mẫu được giữ nguyên.
(function migrateFrameText() {
  const VER = 3;   // v3 (13/10/2026): bỏ tên người + ngày mẫu cũ của các bộ khung (đã đổi sang chữ chung, ngày trống = hôm nay)
  try {
    if (Number(localStorage.getItem('booth.frameTextV')) >= VER) return;
    const OLD = ['06 . 10 . 2026', '07 . 10 . 2026', '17 . 03 . 2024', 'Thu & Raph', 'Saigon, Vietnam',
      'Minh Thư', 'Kuan Hsun', '09.07.2026', 'Tấn Nhã', 'Huỳnh Như', '05.07.2026', '01 . 01 . 2026', 'Nhã', 'Như', 'H&T', '05 - 07 - 2026', '01.07.2026'];
    const store = JSON.parse(localStorage.getItem('booth.frameText') || '{}');
    Object.keys(store).forEach((k) => { if (OLD.includes(store[k])) delete store[k]; });
    localStorage.setItem('booth.frameText', JSON.stringify(store));
    localStorage.setItem('booth.frameTextV', String(VER));
  } catch (_e) {}
})();
function getFrameTextStore() {
  try { return JSON.parse(localStorage.getItem('booth.frameText') || '{}'); } catch (_e) { return {}; }
}
// Ngày hôm nay theo kiểu khung: "12 . 10 . 2026".
function frameDateToday() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())} . ${p(d.getMonth() + 1)} . ${d.getFullYear()}`;
}
// group = textGroup của khung (1 bộ khung = 1 nhóm, admin nhập 1 lần) hoặc id kiểu chụp.
function frameTextValue(group, t) {
  if (state.flow) {   // luồng sự kiện: chữ của sự kiện → chữ mặc định của khung (không dùng chữ đã nhập cho luồng thường)
    const ev = (state.flow.texts || {})[t.id];
    const val = (ev != null && ev !== '') ? ev : (t.value || '');
    return (!val && t.id === 'date') ? frameDateToday() : val;
  }
  const v = getFrameTextStore()[group + '.' + t.id];
  const val = (v != null && v !== '') ? v : (t.value || '');
  // Ô ngày để trống → tự điền ngày hôm nay (không in ngày cũ cố định).
  if (!val && t.id === 'date') return frameDateToday();
  return val;
}
// Vị trí bắt đầu phần chữ màu 2: sau dấu cách đầu tiên, nếu không có thì chữ HOA thứ 2.
function splitIndexFor(chars) {
  const sp = chars.indexOf(' ');
  if (sp >= 0) return sp + 1;
  for (let i = 1; i < chars.length; i++) if (/\p{Lu}/u.test(chars[i])) return i;
  return -1;
}
function drawFrameTexts(ctx, m) {
  if (!m.texts || !m.texts.length) return;
  const group = m.textGroup || m.id;
  for (const t of m.texts) {
    const text = frameTextValue(group, t);
    if (!text) continue;   // ô trống → không vẽ
    const ls = t.ls || 0;
    const fontAt = (px) => (t.italic ? 'italic ' : '') + (t.weight || '400') + ' ' + px + 'px ' + (t.ff || 'Arial, sans-serif');
    const lineW = (str) => [...str].reduce((a, c) => a + ctx.measureText(c).width, 0) + ls * Math.max(0, [...str].length - 1);
    // fit: tên dài → giảm cỡ chữ dần (bước 2px, tối thiểu 60% size) cho tới khi vừa bề rộng fit
    let size = t.size;
    ctx.font = fontAt(size);
    if (t.fit && !t.w) {
      const min = Math.max(8, Math.round(t.size * 0.6));
      while (size > min && lineW(String(text)) > t.fit) { size -= 2; ctx.font = fontAt(size); }
    }
    ctx.fillStyle = t.color || '#000';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const align = t.align || 'center'; // 'left' | 'center' | 'right'
    const xs = Array.isArray(t.xs) ? t.xs : [t.x];   // nhiều cột
    const ys = Array.isArray(t.ys) ? t.ys : [t.y];   // nhiều hàng → vẽ ở mọi cặp (x, y)
    const strokeW = t.strokeW || t.strokeWidth || 4;
    for (const X of xs) for (const Y of ys) {
      // color2 = màu nửa sau chữ (tách ở dấu cách / chữ HOA thứ 2); stroke + strokeW = viền chữ; rotate = độ nghiêng.
      const drawLine = (str, cy) => {
        const chars = [...str];
        const widths = chars.map((c) => ctx.measureText(c).width);
        const tot = widths.reduce((a, b) => a + b, 0) + ls * Math.max(0, chars.length - 1);
        const x0 = align === 'left' ? 0 : align === 'right' ? -tot : -tot / 2;
        const split = t.color2 ? splitIndexFor(chars) : -1;
        ctx.save();
        ctx.translate(X, cy);
        if (t.rotate) ctx.rotate(t.rotate * Math.PI / 180);
        if (t.stroke) {
          ctx.strokeStyle = t.stroke; ctx.lineWidth = strokeW; ctx.lineJoin = 'round';
          let sx = x0;
          for (let i = 0; i < chars.length; i++) { ctx.strokeText(chars[i], sx, 0); sx += widths[i] + ls; }
        }
        let cx = x0;
        for (let i = 0; i < chars.length; i++) {
          ctx.fillStyle = (split >= 0 && i >= split) ? t.color2 : (t.color || '#000');
          ctx.fillText(chars[i], cx, 0); cx += widths[i] + ls;
        }
        ctx.restore();
      };
      if (t.w) { // tự xuống dòng theo bề rộng
        const words = String(text).split(/\s+/);
        const lines = []; let line = '';
        for (const wd of words) {
          const test = line ? line + ' ' + wd : wd;
          if (lineW(test) > t.w && line) { lines.push(line); line = wd; } else line = test;
        }
        if (line) lines.push(line);
        const lh = t.lh || size * 1.3;
        lines.forEach((ln, i) => drawLine(ln, Y + i * lh));
      } else {
        drawLine(String(text), Y);
      }
    }
  }
}

// Build an animated GIF from a list of raw frames (square photo + brand bar).
function framesToGif(rawFrames, boomerang, delay) {
  return new Promise((resolve, reject) => {
    const O = CFG.output;
    const size = O.gifSize, bar = O.gifBrandBar;
    const f = state.filter;   // { css, tint? }
    const onGradient = CFG.brand.frameStyle !== 'white';

    let frames = rawFrames.map((fr) => {
      const c = document.createElement('canvas');
      c.width = size; c.height = size + bar;
      const ctx = c.getContext('2d');
      if (onGradient) { ctx.fillStyle = brandBgGradient(ctx, size, size + bar); }
      else { ctx.fillStyle = '#fff'; }
      ctx.fillRect(0, 0, c.width, c.height);
      drawCover(ctx, frameFor(fr), 0, 0, size, size, f);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = CFG.brand.brandTextColor || (onGradient ? '#ffffff' : CFG.brand.accent1);
      ctx.font = '800 34px "Segoe UI", sans-serif';
      ctx.fillText(CFG.brand.footer, size / 2, size + bar * 0.38);
      const _tag = brandTagline();
      if (_tag) {
        ctx.fillStyle = onGradient ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.5)';
        ctx.font = 'italic 500 20px "Segoe UI", sans-serif';
        ctx.fillText(_tag, size / 2, size + bar * 0.74);
      }
      return c;
    });

    if (boomerang && frames.length > 2) {
      frames = frames.concat(frames.slice(1, -1).reverse());
    }

    const gif = new GIF({
      workers: 2, quality: 10, width: size, height: size + bar,
      workerScript: 'vendor/gif.worker.js', repeat: 0,
    });
    frames.forEach((c) => gif.addFrame(c, { delay, copy: true }));
    gif.on('finished', (blob) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    gif.on('abort', () => reject(new Error('GIF bị hủy')));
    try { gif.render(); } catch (e) { reject(e); }
  });
}

function composeGif(boomerang) {
  return framesToGif(state.rawFrames, boomerang, state.mode.frameDelay);
}

// For photo sessions: build GIF + Boomerang from ALL captured shots (lazy, cached).
async function ensureSessionAnim() {
  if (state.sessionAnim) return state.sessionAnim;
  if (!(CFG.session && CFG.session.includeAnimation)) return null;
  if (state.mode.kind !== 'photo' || !state.captured || state.captured.length < 1) return null;
  const delay = (CFG.session && CFG.session.animationFrameDelay) || 450;
  const gif = await framesToGif(state.captured, false, delay);
  const boomerang = await framesToGif(state.captured, true, delay);
  state.sessionAnim = { gif, boomerang };
  return state.sessionAnim;
}

/* ================= sharing / print / email ================= */

async function doPrint() {
  if (!state.lastOutput) return;
  const lim = printLimit();
  if (lim && (state.printCount || 0) >= lim) { updatePrintBtn(); alert('Đã in đủ số bản của sự kiện.'); return { success: false, reason: 'limit' }; }
  let dataUrl = state.lastOutput.dataUrl;
  const em = effectiveMode() || {};   // kiểu chụp + khung đang chọn (khung có thể ghi đè canvas/noRotate/cut2inch)
  const isStrip = em.layout === 'strip';
  const doubled = state.printCfg.stripDoubleOn4x6 && isStrip;
  // Strip: optionally lay 2 copies side by side on a 4×6 sheet.
  if (doubled) dataUrl = await makeDoubleStrip(dataUrl);

  // ================= IN THEO KHỔ CỦA DRIVER =================
  // Máy DNP chỉ in đúng khổ mặc định đặt trong driver. Nếu ảnh gửi sang khác hướng với trang
  // (dọc ↔ ngang) thì ảnh bị phóng/cắt và có mảng đen. Vì vậy app KHÔNG ép khổ giấy mà hỏi
  // driver trang đang dọc hay ngang rồi xoay ảnh cho khớp (giấy 4×6 và 6×4 là cùng một loại).
  let paper;
  let pageIn = null;
  let rotated = false;   // ghi vào nhật ký in   // kích thước trang driver cấp (inch) → ảnh được đặt đúng khung trang
  const manual = state.printCfg.paper && state.printCfg.paper !== 'auto';
  if (manual) {
    // Chế độ nâng cao: người dùng tự chọn khổ trong Cài đặt → giữ hành vi cũ (xoay tay).
    paper = state.printCfg.paper;
    if (state.printCfg.rotate && !em.noRotate) {
      dataUrl = await rotate90(dataUrl);
      const toLandscape = { '4x6': '6x4', '2x6': '6x2', '10.5x15.5': '15.5x10.5', '5.5x15.5': '15.5x5.5' };
      if (toLandscape[paper]) paper = toLandscape[paper];
    }
  }

  // Dải (và khung đã có sẵn 2 dải, vd Nhật Ký C) dùng máy in có 2inch cut; ảnh/lưới dùng máy in thường.
  const useStripPrinter = isStrip || !!(em.cut2inch || em.stripCut);
  let printerName = useStripPrinter
    ? (state.printCfg.stripPrinterName || state.printCfg.printerName)
    : state.printCfg.printerName;
  // "(Máy in mặc định)" → lấy TÊN máy in mặc định của Windows. Không gửi tên thì Electron in theo trang mặc định
  // của riêng nó (không theo khổ 4×6 DỌC của driver DNP) → ra tờ ngang, ảnh bị cắt (lỗi 13/10/2026).
  if (!printerName) {
    try { const def = (await window.booth.listPrinters()).find((p) => p.isDefault); if (def) printerName = def.name; } catch (_e) {}
  }

  let engine = 'chromium';
  if (!manual && state.printCfg.silent) {
    // AUTO + in thẳng (mặc định của booth): in bằng Windows (System.Drawing) — hỏi driver kích thước TỜ THẬT,
    // tự xoay ảnh nếu khác chiều, vẽ phủ kín tờ. Không qua Chromium: Chromium dựng trang cho máy DNP sai chiều
    // (in thật 13/10/2026: ảnh dọc chỉ in được ~2/3 tờ dù đã xoay hay không xoay).
    engine = 'gdi';
  } else if (!manual) {
    // AUTO + có hộp thoại in (Chromium): xoay ảnh cho CÙNG HƯỚNG với trang driver cấp.
    const shape = await window.booth.pageShape(printerName).catch(() => null);
    const pageLandscape = !!(shape && shape.ok && shape.landscape);   // không đọc được → coi như dọc
    if (shape && shape.ok) pageIn = { w: shape.width / 100, h: shape.height / 100 };  // 1/100 inch → inch
    const designLandscape = !!(em.canvas && em.canvas.w > em.canvas.h);
    if (designLandscape !== pageLandscape) { dataUrl = await rotate90(dataUrl); rotated = true; }
    paper = '4x6';   // = dùng khổ mặc định của driver, không ép kích thước
  }

  const res = await window.booth.print(dataUrl, {
    printerName,
    copies: (state.flow && state.flow.print && Number(state.flow.print.copies)) || state.printCfg.copies,
    silent: state.printCfg.silent,
    paper,
    pageIn,
    rotated,
    engine,
  });
  if (res && res.success === false) {
    // Người dùng tự bấm Huỷ trong hộp thoại in → không phải lỗi.
    if (res.reason && res.reason !== 'cancelled') {
      throw new Error(res.reason + '\nKiểm tra máy in: đã bật, còn giấy/ribbon, đúng máy in trong ⚙️ Cài đặt.');
    }
    return res;
  }
  state.printCount = (state.printCount || 0) + 1;
  // Đẩy TRỌN LƯỢT (ảnh + GIF + Boomerang) lên cloud theo mã lượt → QR trên ảnh
  // truy cập được 3 ngày. Chạy ngầm, không chặn in.
  pushSessionOnce();
  return res;
}

// Upload lượt chụp lên cloud đúng 1 lần cho mỗi kết quả (in nhiều lần / bấm Chia sẻ
// không upload trùng). Kết quả đổi (bộ lọc, sticker…) → upload bản mới.
// Ảnh lên gallery chung chỉ khi khách đồng ý công khai.
function pushSessionOnce() {
  const out = state.lastOutput;
  if (!(CFG.gallery && CFG.gallery.enabled) || !out || out.kind === 'video') {
    return Promise.resolve({ ok: false });
  }
  if (state.pushedOutput === out && state.pushPromise) return state.pushPromise;
  state.pushedOutput = out;
  state.pushPromise = (async () => {
    const files = [];
    if (state.mode && state.mode.kind === 'photo') {
      files.push({ role: 'photo', dataUrl: out.dataUrl });
      const anim = await ensureSessionAnim().catch(() => null);
      if (anim) { files.push({ role: 'gif', dataUrl: anim.gif }); files.push({ role: 'boomerang', dataUrl: anim.boomerang }); }
    } else {
      files.push({ role: out.kind === 'gif' ? 'gif' : 'photo', dataUrl: out.dataUrl });
    }
    const r = await window.booth.pushSession(state.sessionId, files, !!state.publicShare, state.flow ? state.flow.id : undefined);
    if (!r || !r.ok) state.pushedOutput = null; // lỗi mạng → lần sau thử lại
    return Object.assign({ files }, r);
  })().catch((e) => { state.pushedOutput = null; return { ok: false, reason: e.message }; });
  return state.pushPromise;
}

$('#btn-print').addEventListener('click', async () => {
  const btn = $('#btn-print'); btn.disabled = true; setLbl(btn, 'Đang in…'); setStep(5);
  try { await doPrint(); }
  catch (e) { setStep(4); alert('Lỗi khi in: ' + e.message); }
  finally { updatePrintBtn(); }
});

// Xoay ảnh 90° (dọc → ngang) để in vừa giấy nằm ngang.
function rotate90(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.height; c.height = img.width; // hoán đổi
      const ctx = c.getContext('2d');
      ctx.translate(c.width / 2, c.height / 2);
      ctx.rotate(Math.PI / 2); // xoay 90° theo chiều kim đồng hồ
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// Build a 4×6 (1200×1800) sheet with two copies of the strip side by side.
function makeDoubleStrip(stripDataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = CFG.output.photoW; c.height = CFG.output.photoH; // 1200×1800
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      const halfW = c.width / 2;
      const scale = Math.min(halfW / img.width, c.height / img.height);
      const w = img.width * scale, h = img.height * scale;
      const oy = (c.height - h) / 2;
      ctx.drawImage(img, (halfW - w) / 2, oy, w, h);
      ctx.drawImage(img, halfW + (halfW - w) / 2, oy, w, h);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = stripDataUrl;
  });
}

// ---- settings modal ----
async function openSettings() {
  buildSourceBar().catch(() => {});
  let printers = [];
  try { printers = await window.booth.listPrinters(); } catch {}
  const fillPrinterSelect = (sel, current) => {
    sel.innerHTML = '<option value="">(Máy in mặc định)</option>';
    printers.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.name;
      opt.textContent = (p.displayName || p.name) + (p.isDefault ? ' — mặc định' : '');
      if (current === p.name) opt.selected = true;
      sel.appendChild(opt);
    });
  };
  fillPrinterSelect($('#set-printer'), state.printCfg.printerName);
  fillPrinterSelect($('#set-printer-strip'), state.printCfg.stripPrinterName);
  $('#set-paper').value = state.printCfg.paper || 'auto';
  $('#set-copies').value = state.printCfg.copies || 1;
  $('#set-silent').checked = !!state.printCfg.silent;
  $('#set-stripdouble').checked = !!state.printCfg.stripDoubleOn4x6;
  $('#set-rotate').checked = !!state.printCfg.rotate;
  $('#set-tagline').value = (state.brandOverride && typeof state.brandOverride.tagline === 'string')
    ? state.brandOverride.tagline : (CFG.brand.tagline || '');
  $('#set-subfooter').value = (state.brandOverride && state.brandOverride.subFooter) || '';
  buildFrameTextFields();
  buildFrameGroupFields();
  await buildEventModeFields();

  // Canon control panel: only when the EDSDK module is present.
  const canonAvail = await window.booth.canon.available().catch(() => false);
  const panel = $('#canon-panel');
  if (canonAvail) { panel.style.display = 'block'; loadCanonPanel(); }
  else { panel.style.display = 'none'; }

  $('#settings-modal').classList.add('show');
}
function saveSettings() {
  state.printCfg = {
    printerName: $('#set-printer').value,
    stripPrinterName: $('#set-printer-strip').value,
    paper: $('#set-paper').value,
    copies: Math.max(1, parseInt($('#set-copies').value, 10) || 1),
    silent: $('#set-silent').checked,
    stripDoubleOn4x6: $('#set-stripdouble').checked,
    rotate: $('#set-rotate').checked,
    __v: PRINT_CFG_VERSION,
  };
  try { localStorage.setItem('booth.print', JSON.stringify(state.printCfg)); } catch {}

  // nội dung trên ảnh (tagline + ngày/dòng dưới)
  state.brandOverride = { tagline: $('#set-tagline').value, subFooter: $('#set-subfooter').value };
  try { localStorage.setItem('booth.brand', JSON.stringify(state.brandOverride)); } catch {}

  saveFrameTextFields();
  saveFrameGroupFields();
  saveEventModeFields();
  snapshotLocalSettings();

  $('#settings-modal').classList.remove('show');

  // Nếu đang ở màn kết quả, dựng lại ảnh để áp nội dung mới ngay.
  if (screens.result.classList.contains('active') && state.lastOutput) {
    state.sessionAnim = null; state._shareRes = null;
    rerenderResult();
  }
}
// Luồng sự kiện trong Cài đặt: bật/tắt + chọn sự kiện (sửa chi tiết sự kiện ở webadmin).
async function buildEventModeFields() {
  try { state.settings = await window.booth.getSettings(); } catch (_e) {}
  const s = state.settings || {}, em = s.eventMode || {}, evs = s.events || [];
  const on = $('#set-ev-on'), sel = $('#set-ev-id');
  if (!on || !sel) return;
  on.checked = !!em.enabled;
  sel.innerHTML = '<option value="">— chọn sự kiện —</option>' +
    evs.map((e) => `<option value="${esc(e.id)}"${e.id === em.activeEventId ? ' selected' : ''}>${esc(e.name)}</option>`).join('');
  const st = $('#ev-status'), warn = eventProblem(s), run = activeEvent(s);
  st.textContent = run ? 'ĐANG BẬT: Sự kiện ' + run.name : 'ĐANG CHẠY: Luồng thường';
  st.classList.toggle('on', !!run);
  $('#ev-warn').textContent = warn ? '⚠️ ' + warn : '';
  $('#ev-warn').style.display = warn ? '' : 'none';
  let lan = '';
  try { const i = await window.booth.info(); lan = (i && i.lanUrl) || ''; } catch (_e) {}
  $('#ev-admin-link').textContent = 'Tạo / sửa sự kiện (giao diện, khung, chữ, thanh toán, giới hạn in): webadmin ' + (lan ? lan + '/admin' : 'http://127.0.0.1:3737/admin');
}
function saveEventModeFields() {
  const on = $('#set-ev-on'), sel = $('#set-ev-id');
  if (!on || !sel || !window.booth.setEventMode) return;
  const em = (state.settings && state.settings.eventMode) || {};
  if (!!em.enabled === on.checked && (em.activeEventId || '') === sel.value) return;   // không đổi
  window.booth.setEventMode(on.checked, sel.value).then((r) => {
    if (r && r.settings) { state.settings = r.settings; maybeApplyFlow(); }
  }).catch((e) => alert('Không lưu được luồng sự kiện: ' + e.message));
}
// Dựng ô nhập chữ cho mọi khung có `texts` (sửa tên/ngày/lời mời... ngay trong app).
// Ô nhập chữ trên khung, gom theo NHÓM: mode.texts (nhóm = id kiểu chụp) + frames[].texts (nhóm = textGroup).
// 1 nhóm hiện 1 lần (khử trùng theo nhóm + id chữ) → admin nhập 1 lần, áp cho cả bộ khung.
function frameTextGroups() {
  const groups = new Map();
  const add = (g, label, t, hidden) => {
    if (!groups.has(g)) groups.set(g, { label, texts: new Map(), allHidden: true });
    const G = groups.get(g);
    if (!G.texts.has(t.id)) G.texts.set(t.id, t);
    if (!hidden) G.allHidden = false;
  };
  (CFG.modes || []).forEach((m) => {
    (m.texts || []).forEach((t) => add(m.id, m.name, t, false));
    (Array.isArray(m.frames) ? m.frames : []).forEach((f) => {   // GIF/Boomerang dùng frames = số khung hình
      if (!f.texts || !f.texts.length) return;
      const g = f.textGroup || m.id;
      const label = (CFG.textGroups && CFG.textGroups[g]) || (f.textGroup ? f.name : m.name);
      f.texts.forEach((t) => add(g, label, t, isFrameHidden(f)));
    });
  });
  return groups;
}
const ftInputId = (g, tid) => 'ft-' + String(g).replace(/[^a-zA-Z0-9_-]/g, '_') + '-' + tid;
function buildFrameTextFields() {
  const wrap = $('#frame-text-wrap');
  const box = $('#frame-text-fields');
  if (!wrap || !box) return;
  const store = getFrameTextStore();
  const groups = frameTextGroups();
  box.innerHTML = '';
  if (!groups.size) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  groups.forEach((G, g) => {
    const grp = document.createElement('div');
    grp.className = 'ft-group';
    grp.innerHTML = `<div class="ft-title">${esc(G.label)}${G.allHidden ? ' <small>(đang ẩn)</small>' : ''}</div>`;
    G.texts.forEach((t) => {
      const key = g + '.' + t.id;
      const val = (store[key] != null) ? store[key] : (t.value || '');
      const row = document.createElement('div');
      row.className = 'set-row col';
      const inpId = ftInputId(g, t.id);
      row.innerHTML = `<label for="${inpId}">${esc(t.label || t.id)}</label>` +
        `<input type="text" id="${inpId}" class="set-text" value="${String(val).replace(/"/g, '&quot;')}"` +
        (t.id === 'date' ? ' placeholder="Để trống = ngày hôm nay"' : ' placeholder="Để trống = không in dòng này"') + ' />';
      grp.appendChild(row);
    });
    box.appendChild(grp);
  });
}
function saveFrameTextFields() {
  const store = getFrameTextStore();   // giữ giá trị của nhóm không hiện (nếu có)
  frameTextGroups().forEach((G, g) => {
    G.texts.forEach((t) => {
      const el = document.getElementById(ftInputId(g, t.id));
      if (!el) return;
      // Chỉ lưu chữ ĐÃ SỬA; để nguyên như mặc định → không lưu (đổi chữ mặc định sau này khung tự đổi theo).
      if (el.value === (t.value || '')) delete store[g + '.' + t.id];
      else store[g + '.' + t.id] = el.value;
    });
  });
  try { localStorage.setItem('booth.frameText', JSON.stringify(store)); } catch (_e) {}
}

// Bật/tắt khung dịp lễ / sự kiện: công tắc cả nhóm + từng khung (lưu booth.frameGroups / booth.frameHidden).
function frameGroupList() {
  const groups = new Map();
  (CFG.modes || []).forEach((m) => (Array.isArray(m.frames) ? m.frames : []).forEach((f) => {
    const g = frameGroupKey(f);
    if (!g) return;
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push({ m, f });
  }));
  return groups;
}
function buildFrameGroupFields() {
  const wrap = $('#frame-group-wrap'), box = $('#frame-group-fields');
  if (!wrap || !box) return;
  const groups = frameGroupList();
  box.innerHTML = '';
  if (!groups.size) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  const on = getFrameGroupsOn();
  groups.forEach((list, g) => {
    const label = (CFG.frameGroups && CFG.frameGroups[g]) || g;
    const el = document.createElement('div');
    el.className = 'fg-group';
    const gid = 'fg-' + g.replace(/[^a-zA-Z0-9_-]/g, '_');
    el.innerHTML = `<div class="set-row"><label for="${gid}"><b>${esc(label)}</b> <small>(${list.length} khung)</small></label>` +
      `<input type="checkbox" id="${gid}" data-group="${esc(g)}" ${on[g] ? 'checked' : ''} /></div>` +
      `<div class="fg-items">${list.map(({ m, f }) => `<label class="fg-item"><input type="checkbox" data-frame="${esc(f.id)}" data-group="${esc(g)}" ${isFrameHidden(f) ? '' : 'checked'} />${esc(m.name)} · ${esc(f.name)}</label>`).join('')}</div>`;
    el.querySelector('#' + gid).addEventListener('change', (e) => {   // bật/tắt cả nhóm 1 lần
      el.querySelectorAll('input[data-frame]').forEach((cb) => { cb.checked = e.target.checked; });
    });
    box.appendChild(el);
  });
}
function saveFrameGroupFields() {
  const box = $('#frame-group-fields');
  if (!box || !box.children.length) return;
  const on = getFrameGroupsOn(), own = getFrameVis();
  box.querySelectorAll('input[data-group]:not([data-frame])').forEach((cb) => { on[cb.dataset.group] = cb.checked; });
  box.querySelectorAll('input[data-frame]').forEach((cb) => {
    const groupOn = !!on[cb.dataset.group];
    if (cb.checked === groupOn) delete own[cb.dataset.frame];   // giống công tắc nhóm → theo nhóm
    else own[cb.dataset.frame] = !cb.checked;                   // khác nhóm → ghi đè riêng (true = ẩn)
  });
  try { localStorage.setItem('booth.frameGroups', JSON.stringify(on)); localStorage.setItem('booth.frameHidden', JSON.stringify(own)); } catch (_e) {}
}

// Cài đặt chỉ dành cho nhân viên: giữ góc phải-trên màn hình 3 giây → nhập PIN quản trị.
(function setupStaffAccess() {
  const corner = document.getElementById('staff-corner');
  const modal = $('#pin-modal'), input = $('#pin-input'), err = $('#pin-err');
  if (!corner || !modal) return;
  let timer = null;
  const cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };
  corner.addEventListener('pointerdown', () => {
    cancel();
    timer = setTimeout(() => { timer = null; err.textContent = ''; input.value = ''; modal.classList.add('show'); setTimeout(() => input.focus(), 50); }, 3000);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => corner.addEventListener(ev, cancel));
  $('#pin-cancel').addEventListener('click', () => modal.classList.remove('show'));
  $('#pin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const r = await window.booth.pay.verifyPin(input.value).catch(() => ({ ok: false }));
    input.value = '';
    if (!r.ok) { err.textContent = 'Sai PIN, thử lại.'; return; }
    modal.classList.remove('show');
    openSettings();
  });
})();
$('#btn-settings-save').addEventListener('click', saveSettings);
$('#btn-settings-close').addEventListener('click', () => $('#settings-modal').classList.remove('show'));

// ---- Canon camera control panel (inside settings) ----
const CAM_OPTIONS = {
  ISOSpeed: ['Auto', '100', '200', '400', '800', '1600', '3200', '6400', '12800'],
  Av: ['1.8', '2.0', '2.8', '4.0', '5.6', '8.0', '11', '16', '22'],
  Tv: ['1/30', '1/50', '1/60', '1/100', '1/125', '1/200', '1/250', '1/500', '1/1000', '1/2000'],
  ExposureCompensation: ['-2', '-1 2/3', '-1 1/3', '-1', '-2/3', '-1/3', '0', '+1/3', '+2/3', '+1', '+1 1/3', '+1 2/3', '+2'],
  WhiteBalance: ['Auto', 'Daylight', 'Cloudy', 'Tungsten', 'Fluorescent', 'Flash', 'Shade'],
};

async function loadCanonPanel() {
  const note = $('#cam-note');
  const readout = $('#cam-readout');
  const res = await window.booth.canon.getSettings().catch(() => ({ ok: false }));
  if (!res.ok) {
    readout.innerHTML = '';
    document.querySelectorAll('.cam-ctl').forEach((s) => { s.innerHTML = ''; s.disabled = true; });
    note.textContent = 'Chưa kết nối máy Canon. Vào chụp bằng nguồn "Máy ảnh Canon" rồi mở lại để điều khiển.';
    return;
  }
  const s = res.settings || {};
  // read-only pills
  const pill = (label, val) => val != null ? `<span class="pill">${label}: <b>${val}</b></span>` : '';
  readout.innerHTML =
    pill('Máy', s.ProductName) + pill('Pin', s.BatteryLevel) + pill('Còn chụp', s.AvailableShots) +
    pill('Chế độ', s.AEMode);
  // editable selects
  Object.keys(CAM_OPTIONS).forEach((key) => {
    const sel = $('#cam-' + key);
    if (!sel) return;
    sel.disabled = false;
    sel.innerHTML = '';
    const cur = s[key] != null ? String(s[key]) : '';
    if (cur && !CAM_OPTIONS[key].includes(cur)) {
      const o = document.createElement('option'); o.value = cur; o.textContent = cur + ' (hiện tại)'; o.selected = true; sel.appendChild(o);
    }
    CAM_OPTIONS[key].forEach((v) => {
      const o = document.createElement('option'); o.value = v; o.textContent = v;
      if (v === cur) o.selected = true;
      sel.appendChild(o);
    });
    sel.onchange = async () => {
      const r = await window.booth.canon.setSetting(key, sel.value).catch((e) => ({ ok: false, reason: e.message }));
      if (!r.ok) { note.textContent = 'Không đặt được ' + key + ': ' + (r.reason || ''); }
      else { note.textContent = 'Đã đổi ' + key + ' = ' + sel.value; }
      loadCanonPanel();
    };
  });
  note.textContent = 'Đổi thông số sẽ áp ngay lên máy ảnh.';
}
$('#cam-refresh').addEventListener('click', loadCanonPanel);

/* ================= sticker editor ================= */
const SE = { stickers: [], selected: null, stageW: 0, stageH: 0, natW: 0, natH: 0, active: null };
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));

function openStickerEditor() {
  if (!state.lastOutput) return;
  if (state.lastOutput.kind === 'gif') {
    alert('Sticker hiện chỉ áp cho ảnh (Ảnh đơn / Dải / Lưới), chưa hỗ trợ GIF/Boomerang.');
    return;
  }
  const stage = $('#se-stage');
  SE.stickers.forEach((s) => s.el.remove());
  SE.stickers = []; SE.selected = null;

  const img = new Image();
  img.onload = () => {
    SE.natW = img.naturalWidth; SE.natH = img.naturalHeight;
    $('#sticker-editor').classList.add('show');          // hiện trước để đo vùng đặt ảnh
    const box = document.querySelector('.se-stage-wrap').getBoundingClientRect();
    const maxW = box.width * 0.96;
    const maxH = box.height * 0.96;
    let w = maxW, h = w * SE.natH / SE.natW;
    if (h > maxH) { h = maxH; w = h * SE.natW / SE.natH; }
    SE.stageW = Math.round(w); SE.stageH = Math.round(h);
    stage.style.width = SE.stageW + 'px';
    stage.style.height = SE.stageH + 'px';
    $('#se-base').src = state.lastOutput.dataUrl;
    buildStickerItems();
    renderStickerGrid();
    $('#sticker-editor').classList.add('show');
  };
  img.src = state.lastOutput.dataUrl;
}

const SE_PAGE_SIZE = 9; // 3×3 mỗi trang
function buildStickerItems() {
  const S = CFG.stickers || {};
  SE.items = [
    ...(S.images || []).map((src) => ({ type: 'img', src })),
    ...(S.emojis || []).map((ch) => ({ type: 'emoji', char: ch })),
  ];
  SE.page = 0;
}
function renderStickerGrid() {
  const grid = $('#se-grid');
  grid.innerHTML = '';
  const start = SE.page * SE_PAGE_SIZE;
  SE.items.slice(start, start + SE_PAGE_SIZE).forEach((it) => {
    const b = document.createElement('button');
    b.className = 'se-chip';
    if (it.type === 'emoji') b.textContent = it.char;
    else { const im = document.createElement('img'); im.src = it.src; b.appendChild(im); }
    b.onclick = () => addSticker(it.type === 'emoji' ? { type: 'emoji', char: it.char } : { type: 'img', src: it.src });
    grid.appendChild(b);
  });
  const pages = Math.max(1, Math.ceil(SE.items.length / SE_PAGE_SIZE));
  $('#se-prev').disabled = SE.page <= 0;
  $('#se-next').disabled = SE.page >= pages - 1;
}

function layoutSticker(m) {
  m.el.style.left = (m.cx - m.size / 2) + 'px';
  m.el.style.top = (m.cy - m.size / 2) + 'px';
  m.el.style.width = m.size + 'px';
  m.el.style.height = m.size + 'px';
  if (m.type === 'emoji') m.el.style.fontSize = Math.round(m.size * 0.82) + 'px';
}

function selectSticker(m) {
  SE.selected = m;
  SE.stickers.forEach((s) => s.el.classList.toggle('selected', s === m));
  if (m) { $('#se-stage').appendChild(m.el); } // bring to front
}

function removeSticker(m) {
  m.el.remove();
  SE.stickers = SE.stickers.filter((s) => s !== m);
  if (SE.selected === m) SE.selected = null;
}

function addSticker(opts) {
  const size = Math.round(SE.stageW * (opts.type === 'img' ? 0.4 : 0.22));
  const m = Object.assign({ cx: SE.stageW / 2, cy: SE.stageH / 2, size }, opts);
  const el = document.createElement('div');
  el.className = 'se-sticker';
  if (opts.type === 'emoji') el.textContent = opts.char;
  else { const im = document.createElement('img'); im.src = opts.src; el.appendChild(im); }
  const del = document.createElement('div'); del.className = 'se-badge se-del'; del.textContent = '✕';
  const rez = document.createElement('div'); rez.className = 'se-badge se-resize'; rez.textContent = '⤡';
  el.appendChild(del); el.appendChild(rez);
  $('#se-stage').appendChild(el);
  m.el = el;
  SE.stickers.push(m);
  layoutSticker(m);
  selectSticker(m);

  el.addEventListener('pointerdown', (e) => startSE(e, m, 'move'));
  del.addEventListener('pointerdown', (e) => { e.stopPropagation(); removeSticker(m); });
  rez.addEventListener('pointerdown', (e) => { e.stopPropagation(); startSE(e, m, 'resize'); });
}

function startSE(e, m, type) {
  e.preventDefault();
  selectSticker(m);
  const rect = $('#se-stage').getBoundingClientRect();
  SE.active = { m, type, dx: (e.clientX - rect.left) - m.cx, dy: (e.clientY - rect.top) - m.cy };
  window.addEventListener('pointermove', onSEMove);
  window.addEventListener('pointerup', onSEUp);
}
function onSEMove(e) {
  if (!SE.active) return;
  const rect = $('#se-stage').getBoundingClientRect();
  const px = e.clientX - rect.left, py = e.clientY - rect.top;
  const m = SE.active.m;
  if (SE.active.type === 'move') {
    m.cx = clampN(px - SE.active.dx, 0, SE.stageW);
    m.cy = clampN(py - SE.active.dy, 0, SE.stageH);
  } else {
    const d = Math.max(Math.abs(px - m.cx), Math.abs(py - m.cy));
    m.size = clampN(d * 2, 28, SE.stageW * 1.3);
  }
  layoutSticker(m);
}
function onSEUp() {
  SE.active = null;
  window.removeEventListener('pointermove', onSEMove);
  window.removeEventListener('pointerup', onSEUp);
}

// tap empty area to deselect
$('#se-base').addEventListener('pointerdown', () => selectSticker(null));

async function bakeStickers() {
  const canvas = document.createElement('canvas');
  canvas.width = SE.natW; canvas.height = SE.natH;
  const ctx = canvas.getContext('2d');
  const base = await loadImage(state.lastOutput.dataUrl);
  ctx.drawImage(base, 0, 0, SE.natW, SE.natH);
  const scale = SE.natW / SE.stageW;
  for (const m of SE.stickers) {
    const cx = m.cx * scale, cy = m.cy * scale, size = m.size * scale;
    if (m.type === 'emoji') {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = Math.round(size * 0.82) + 'px "Segoe UI Emoji", "Segoe UI", sans-serif';
      ctx.fillText(m.char, cx, cy);
    } else {
      try {
        const im = await loadImage(m.src);
        const ar = (im.width && im.height) ? im.width / im.height : 1;
        let dw = size, dh = size;
        if (ar >= 1) dh = size / ar; else dw = size * ar; // giữ tỉ lệ (contain trong ô)
        ctx.drawImage(im, cx - dw / 2, cy - dh / 2, dw, dh);
      } catch (_e) {}
    }
  }
  return canvas.toDataURL('image/png');
}

$('#btn-sticker').addEventListener('click', openStickerEditor);
$('#se-prev').addEventListener('click', () => { if (SE.page > 0) { SE.page--; renderStickerGrid(); } });
$('#se-next').addEventListener('click', () => {
  const pages = Math.max(1, Math.ceil(SE.items.length / SE_PAGE_SIZE));
  if (SE.page < pages - 1) { SE.page++; renderStickerGrid(); }
});
$('#se-undo').addEventListener('click', () => { const m = SE.stickers[SE.stickers.length - 1]; if (m) removeSticker(m); });
$('#se-clear').addEventListener('click', () => { SE.stickers.forEach((s) => s.el.remove()); SE.stickers = []; SE.selected = null; });
$('#se-cancel').addEventListener('click', () => $('#sticker-editor').classList.remove('show'));

async function applyStickers() {
  if (SE.stickers.length) {
    const dataUrl = await bakeStickers();
    state.lastOutput = { dataUrl, kind: 'photo' };
    $('#result-img').src = dataUrl;
    state._shareRes = null; // buộc tạo QR/upload mới cho ảnh có sticker
    state.stickered = true;
  }
}

$('#se-print').addEventListener('click', async () => {
  const btn = $('#se-print'); btn.disabled = true; setLbl(btn, 'Đang in…'); setStep(5);
  try {
    await applyStickers();
    await doPrint();
    $('#sticker-editor').classList.remove('show');
  } catch (e) {
    setStep(4); alert('Lỗi khi in: ' + e.message);
  } finally {
    updatePrintBtn();
  }
});

$('#se-done').addEventListener('click', async () => {
  const btn = $('#se-done'); btn.disabled = true; setLbl(btn, 'Đang lưu…');
  try {
    await applyStickers();
    $('#sticker-editor').classList.remove('show');
  } catch (e) {
    alert('Lỗi khi gắn sticker: ' + e.message);
  } finally {
    btn.disabled = false; setLbl(btn, 'Xong');
  }
});

// Build the shareable session (photo + GIF + Boomerang for photo modes) once.
async function ensureShare() {
  if (state._shareRes) return state._shareRes;
  // Ưu tiên QR cloud — CÙNG link với QR in trên ảnh, quét được ở mọi nơi.
  const q = CFG.galleryQR || {};
  if (q.enabled && q.mode === 'session' && state.qrUrl && state.lastOutput.kind !== 'video') {
    const r = await pushSessionOnce();
    if (r && r.ok) {
      const qrDataUrl = await makeQRCached(state.qrUrl);
      if (qrDataUrl) {
        state._shareRes = { pageUrl: state.qrUrl, qrDataUrl, files: r.files, cloud: true };
        return state._shareRes;
      }
    }
  }
  // Không có mạng / cloud lỗi → link LAN (điện thoại cần chung Wi-Fi).
  const files = [];
  const k = state.lastOutput.kind;
  const mainRole = k === 'video' ? 'video' : k === 'gif' ? 'animation' : 'photo';
  files.push({ role: mainRole, dataUrl: state.lastOutput.dataUrl });
  if (state.mode && state.mode.kind === 'photo') {
    const anim = await ensureSessionAnim().catch(() => null);
    if (anim) {
      files.push({ role: 'gif', dataUrl: anim.gif });
      files.push({ role: 'boomerang', dataUrl: anim.boomerang });
    }
  }
  state._shareRes = await window.booth.saveSession(files, state.flow ? state.flow.id : undefined);
  return state._shareRes;
}

$('#btn-share').addEventListener('click', async () => {
  if (!state.lastOutput) return;
  const btn = $('#btn-share'); btn.disabled = true; setLbl(btn, 'Đang tạo QR…');
  try {
    const res = await ensureShare();
    $('#qr-img').src = res.qrDataUrl;
    $('#qr-url').textContent = res.pageUrl;
    const note = document.querySelector('#share-modal .qr-note');
    const many = res.files && res.files.length > 1;
    if (note) note.textContent =
      (many ? 'Quét QR để tải ảnh + GIF + Boomerang. ' : '') +
      (res.cloud ? 'Tải được ở bất cứ đâu.' : 'Điện thoại cần chung Wi‑Fi với máy này.');
    $('#share-modal').classList.add('show');
  } catch (e) {
    alert('Lỗi tạo link chia sẻ: ' + e.message);
  } finally {
    btn.disabled = false; setLbl(btn, 'Lấy ảnh qua QR');
  }
});
$('#btn-close-share').addEventListener('click', () => $('#share-modal').classList.remove('show'));
$('#btn-frame').addEventListener('click', openFramePicker);
$('#btn-frame-close').addEventListener('click', closeFramePicker);
$('#frame-picker').addEventListener('click', (e) => { if (e.target.id === 'frame-picker') closeFramePicker(); });

// retake / home / start
$('#btn-retake').addEventListener('click', () => { state._shareRes = null; state.sessionAnim = null; show('capture'); startCamera(); });
function goHome() {
  state._shareRes = null; state.sessionAnim = null; state.pushedOutput = null;
  state.frameId = null; state.framePreviews = {}; state.stickered = false;
  // Đóng mọi lớp phủ (sticker / QR / cài đặt) — nếu không, khách sau sẽ thấy ảnh khách trước.
  ['#sticker-editor', '#share-modal', '#settings-modal', '#pin-modal', '#notice-modal', '#frame-picker', '#confirm-modal'].forEach((sel) => { const el = $(sel); if (el) el.classList.remove('show'); });
  SE.stickers.forEach((s) => s.el.remove()); SE.stickers = []; SE.selected = null;
  state.lastOutput = null;
  $('#result-img').removeAttribute('src');
  try { stopPayPoll && stopPayPoll(); } catch (_e) {}
  stopCamera();
  state.printCount = 0;
  show('home');
  applyFlow();      // admin đổi luồng / sự kiện trong lúc khách chụp → áp dụng bây giờ
  resetConsent();
  updatePrintBtn();
}
$('#btn-home').addEventListener('click', goHome);

// ---- Quyền công khai / riêng tư (consent) ----
function resetConsent() {
  const gal = CFG.gallery || {};
  const def = gal.publicDefault !== false && !(state.flow && !(state.flow.gallery && state.flow.gallery.public));
  state.publicShare = def;
  const cb = $('#consent-public'); if (cb) cb.checked = def;
  try { window.booth.setPublic(def); } catch (_e) {}
}
(function setupConsent() {
  const row = $('#consent-row'), cb = $('#consent-public'), txt = $('#consent-text');
  const gal = CFG.gallery || {};
  if (!row || !cb) return;
  if (gal.enabled === false) { row.style.display = 'none'; return; }
  if (txt && gal.consentNote) txt.textContent = gal.consentNote;
  resetConsent();
  cb.addEventListener('change', () => {
    state.publicShare = cb.checked;
    try { window.booth.setPublic(cb.checked); } catch (_e) {}
  });
})();

// ---- Tự về màn chờ khi để trống quá lâu (booth tự phục vụ) ----
(function setupIdleReset() {
  const secs = ((CFG.kiosk || {}).idleResetSeconds) || 0;
  if (!secs) return;
  let last = Date.now();
  const bump = () => { last = Date.now(); };
  ['pointerdown', 'keydown', 'touchstart', 'click'].forEach((ev) => document.addEventListener(ev, bump, { passive: true }));
  setInterval(() => {
    if (state.busy) { last = Date.now(); return; }                 // đang chụp/xử lý → không reset
    if (screens.home && screens.home.classList.contains('active')) { last = Date.now(); return; }
    if (Date.now() - last > secs * 1000) { last = Date.now(); goHome(); }
  }, 3000);
})();
$('#btn-start').addEventListener('click', startFlow);
// Webadmin / Cài đặt lưu → áp luồng mới ngay nếu đang ở màn chờ, không thì sau lượt hiện tại.
if (window.booth.onSettingsChanged) window.booth.onSettingsChanged(async (s) => { state.settings = s; await loadExternalEventFrames(); _flowKey = null; maybeApplyFlow(); });
setInterval(() => { if (state.settings && state.settings.eventMode && state.settings.eventMode.enabled) maybeApplyFlow(); }, 30000);   // lịch chạy sự kiện

// ---- init ----
window.addEventListener('DOMContentLoaded', async () => {
  buildModeGrid();
  buildSourceBar(false); // don't power on the webcam just to read labels at startup
  buildHomeShowcase();
  setStep(0);
  ensureFrameFonts();
  try { state.settings = await window.booth.getSettings(); } catch (_e) {}
  await loadExternalEventFrames();
  applyFlow(true);
  snapshotLocalSettings();   // luồng thường hoặc sự kiện đang bật (dựng luôn ảnh mẫu khung)
});

// Dải "mẫu khung" ở màn hình chờ (thẻ ưu đãi + ảnh mẫu khung).
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
// Màn chờ: 3 ảnh mẫu khung xếp hình quạt + 1 dòng ưu đãi tự chuyển (chấm chỉ trang).
function renderHomeFan() {
  const fan = $('#home-fan');
  if (!fan) return;
  if (state.flow) {   // luồng sự kiện: chỉ khung của sự kiện
    const list = state.flowFan || [];
    fan.classList.toggle('n1', list.length === 1);
    fan.innerHTML = list.map((u) => `<img src="${u}" alt="">`).join('');
    return;
  }
  fan.classList.remove('n1');
  const t = state.modeThumbs || {};
  const pick = ['A', 'C', 'F'].filter((id) => t[id]);
  Object.keys(t).forEach((id) => { if (pick.length < 3 && !pick.includes(id)) pick.push(id); });
  fan.innerHTML = pick.slice(0, 3).map((id) => `<img src="${t[id]}" alt="">`).join('');
}
let _tickerTimer = null;
function buildHomeShowcase() {
  const wrap = $('#home-showcase');
  renderHomeFan();
  if (!wrap) return;
  const promo = (CFG.home && CFG.home.promo) || {};
  const event = (CFG.home && CFG.home.event) || {};
  const items = promo.enabled === false ? [] : (promo.offers || []).filter(Boolean);
  if (_tickerTimer) { clearInterval(_tickerTimer); _tickerTimer = null; }
  if (!items.length) { wrap.innerHTML = ''; return; }
  const title = (promo.offersTitle || 'Ưu đãi') + (event.enabled !== false && event.month ? ' ' + String(event.month).toLowerCase() : '');
  wrap.innerHTML = `<div class="ticker"><strong>${esc(title)}</strong><span class="tk-text"></span>` +
    `<span class="dots">${items.map(() => '<i></i>').join('')}</span></div>`;
  const text = wrap.querySelector('.tk-text'), dots = [...wrap.querySelectorAll('.dots i')];
  let n = 0;
  const paint = () => { text.textContent = items[n]; dots.forEach((d, idx) => d.classList.toggle('on', idx === n)); };
  paint();
  if (items.length > 1) {
    _tickerTimer = setInterval(() => {
      text.classList.add('fade');
      setTimeout(() => { n = (n + 1) % items.length; paint(); text.classList.remove('fade'); }, 350);
    }, 5000);
  }
}
