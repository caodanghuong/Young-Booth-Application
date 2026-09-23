/* ================= Young Booth — renderer logic ================= */
const CFG = window.BOOTH_CONFIG;

// ---- apply brand colors to CSS vars ----
document.documentElement.style.setProperty('--accent1', CFG.brand.accent1);
document.documentElement.style.setProperty('--accent2', CFG.brand.accent2);
if (CFG.brand.accent3) document.documentElement.style.setProperty('--accent3', CFG.brand.accent3);
document.querySelector('.logo').textContent = CFG.brand.logoEmoji;

// ---- state ----
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
};
try { state.webcamDeviceId = localStorage.getItem('booth.webcamId') || null; } catch {}

// Print settings: config defaults, overridden by what the user saved in the UI.
function loadPrintCfg() {
  const def = Object.assign({ printerName: '', copies: 1, silent: false, stripDoubleOn4x6: false }, CFG.print || {});
  try {
    const saved = JSON.parse(localStorage.getItem('booth.print') || '{}');
    return Object.assign(def, saved);
  } catch { return def; }
}
state.printCfg = loadPrintCfg();
state.beauty = !!(CFG.beauty && CFG.beauty.enabled);

// ---- element refs ----
const $ = (sel) => document.querySelector(sel);
const screens = {
  home: $('#screen-home'),
  mode: $('#screen-mode'),
  pay: $('#screen-pay'),
  capture: $('#screen-capture'),
  select: $('#screen-select'),
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
function show(name) {
  Object.values(screens).forEach((s) => s.classList.remove('active'));
  screens[name].classList.add('active');
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
    state.stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false });
    video.srcObject = state.stream;
    videoWrap.classList.toggle('mirror', !!CFG.camera.mirror);
    await video.play().catch(() => {});
  } catch (err) {
    alert('Không mở được webcam.\n' + err.message +
      '\n\nKiểm tra: Windows > Cài đặt > Quyền riêng tư > Camera > cho phép ứng dụng máy tính dùng camera.');
  }
}

async function startCanon() {
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
  if (state.usingCanon) {
    try { await window.booth.canon.stopLiveView(); } catch (_e) {}
    try { await window.booth.canon.shutdown(); } catch (_e) {}
    state.usingCanon = false;
  }
}

/** Turn a data URL into a canvas (used for full-res Canon photos). */
function dataUrlToCanvas(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
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
  const canonAvailable = await window.booth.canon.available().catch(() => false);
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
    if (!enabled) chip.setAttribute('disabled', '');
    chip.innerHTML = `<span class="dot${connected ? ' ok' : ''}"></span>${icon} ${text}`;
    chip.addEventListener('click', () => {
      if (!enabled) return;
      state.source = src;
      try { localStorage.setItem('booth.source', src); } catch {}
      buildSourceBar();
    });
    return chip;
  };

  bar.appendChild(mkChip('webcam', '📷', 'Webcam', true, cams.length > 0));
  bar.appendChild(mkChip('canon', '📸', 'Máy ảnh Canon', canonAvailable, canonAvailable));

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
    status.textContent = canonAvailable
      ? '✅ Sẵn sàng dùng máy ảnh Canon (EDSDK). Cắm máy & bật nguồn trước khi chụp.'
      : '⚠️ Chưa cài EDSDK — sẽ tự dùng webcam. Xem CANON_SETUP.md để bật Canon.';
  } else {
    status.textContent = cams.length
      ? `Đang dùng webcam${cams.length > 1 ? ' (chọn thiết bị bên trên)' : ''}.`
      : '⚠️ Không thấy webcam nào.';
  }
  bar.appendChild(status);
}

// ---- mode grid ----
function buildModeGrid() {
  const grid = $('#mode-grid');
  grid.innerHTML = '';
  CFG.modes.forEach((m) => {
    const card = document.createElement('div');
    card.className = 'mode-card';
    card.innerHTML = `<div class="ic">${m.icon}</div><div class="nm">${m.name}</div><div class="ds">${m.desc}</div>`;
    card.addEventListener('click', () => chooseMode(m));
    grid.appendChild(card);
  });
}

async function chooseMode(m) {
  state.mode = m;
  state.rawFrames = []; state.captured = null; state.sessionAnim = null; state._shareRes = null;
  clearBeautyCache();
  // refresh settings (price may have changed on the webadmin)
  try { state.settings = await window.booth.getSettings(); } catch (_e) {}
  const pay = state.settings && state.settings.payment;
  if (pay && pay.enabled) { await openPayScreen(m); }
  else { await beginCapture(m); }
}

async function beginCapture(m) {
  buildFilterBar($('#filter-bar-capture'));
  show('capture');
  await startCamera();
  applyLivePreviewFilter();
  renderShotDots(0);
}

// ---- payment gate ----
function stopPayPoll() { if (state.payTimer) { clearInterval(state.payTimer); state.payTimer = null; } }
async function openPayScreen(m) {
  stopPayPoll();
  show('pay');
  $('#pay-status').textContent = '';
  $('#pay-qr').style.display = 'none';
  $('#pay-confirm').style.display = 'none';
  $('#pay-amount').textContent = 'Đang tạo đơn…';
  $('#pay-info').textContent = '';
  let order;
  try { order = await window.booth.pay.createOrder(m.id); } catch (_e) { order = { enabled: false }; }
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
  if (order.allowStaffOverride) $('#pay-confirm').style.display = 'inline-block';
  if (order.method === 'sepay') {
    $('#pay-status').textContent = 'Đang chờ xác nhận chuyển khoản…';
    state.payTimer = setInterval(async () => {
      const r = await window.booth.pay.check(order.amount, order.code).catch(() => ({ paid: false }));
      if (r.paid) { $('#pay-status').textContent = '✅ Đã nhận thanh toán!'; onPaid(m); }
    }, 3000);
  }
}
async function onPaid(m) { stopPayPoll(); await beginCapture(m); }
$('#pay-confirm').addEventListener('click', () => onPaid(state.mode));

function renderShotDots(done) {
  const total = state.mode.kind === 'photo' ? (state.mode.captureCount || state.mode.select || 1) : 1;
  shotProgress.innerHTML = '';
  if (total <= 1) return;
  for (let i = 0; i < total; i++) {
    const d = document.createElement('div');
    d.className = 'shot-dot' + (i < done ? ' done' : '');
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
  countdownEl.textContent = '😊';
  await wait(500);
  countdownEl.classList.remove('show');
  // flash
  flashEl.classList.add('fire');
  setTimeout(() => flashEl.classList.remove('fire'), 400);
}

async function captureBurst(nFrames, delay) {
  const frames = [];
  for (let i = 0; i < nFrames; i++) {
    frames.push(grabRawFrame());
    await wait(delay);
  }
  return frames;
}

// ---- main capture button ----
$('#btn-capture').addEventListener('click', async () => {
  if (state.busy || !state.stream) return;
  state.busy = true;
  $('#btn-capture').disabled = true;

  try {
    if (state.mode.kind === 'photo') {
      const cap = state.mode.captureCount || state.mode.select || 1;
      const canonFullRes = state.usingCanon && CFG.camera.canon && CFG.camera.canon.fullResPhoto;
      state.captured = [];
      const prep = CFG.prepSeconds || CFG.countdownSeconds || 3;
      for (let i = 0; i < cap; i++) {
        await runCountdown(prep);
        if (canonFullRes) {
          const shot = await window.booth.canon.capture(); // full-res JPEG from the DSLR
          state.captured.push(await dataUrlToCanvas(shot.dataUrl));
        } else {
          state.captured.push(grabRawFrame());
        }
        renderShotDots(i + 1);
        if (i < cap - 1) await wait(600); // xem nhanh ảnh vừa chụp rồi qua tấm sau
      }
      const need = state.mode.select || cap;
      state.sessionAnim = null; // new session
      if (need < state.captured.length) {
        openSelectScreen(need);
        return; // flow continues from the select screen
      }
      state.rawFrames = state.captured.slice();
    } else {
      // gif / boomerang mode: single countdown then burst
      await runCountdown(CFG.countdownSeconds);
      state.rawFrames = await captureBurst(state.mode.frames, state.mode.frameDelay);
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
});

// Compose the selected frames and go to the result screen.
async function finishToResult() {
  show('processing');
  $('#proc-text').textContent = state.mode.kind === 'photo' ? 'Đang ghép khung…' : 'Đang tạo ảnh động…';
  await wait(60); // let UI paint
  const out = await composeOutput();
  state.lastOutput = out;
  state._shareRes = null;
  $('#result-img').src = out.dataUrl;
  buildFilterBar($('#filter-bar-result'), () => rerenderResult());
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
async function rerenderResult() {
  show('processing');
  $('#proc-text').textContent = 'Đang áp bộ lọc…';
  await wait(40);
  const out = await composeOutput();
  state.lastOutput = out;
  state.sessionAnim = null; // filter changed → rebuild animations on next share
  $('#result-img').src = out.dataUrl;
  show('result');
}

/* ================= beauty (mịn da + làm nét) ================= */
const _beautyCache = new Map();
function clearBeautyCache() { _beautyCache.clear(); }

// Unsharp/Laplacian sharpen in-place on a 2d context.
function sharpenCtx(ctx, w, h, amount) {
  if (amount <= 0) return;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const src = new Uint8ClampedArray(d);
  const idx = (x, y) => ((y * w + x) << 2);
  const k = amount * 0.8;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const o = idx(x, y);
      for (let c = 0; c < 3; c++) {
        const i = o + c, ctr = src[i];
        const lap = src[idx(x - 1, y) + c] + src[idx(x + 1, y) + c] +
                    src[idx(x, y - 1) + c] + src[idx(x, y + 1) + c] - 4 * ctr;
        d[i] = ctr - k * lap;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

// Produce a beautified copy of a raw frame canvas (cached).
function beautifyCanvas(src) {
  const b = CFG.beauty || {};
  const w = src.width, h = src.height;
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const ctx = out.getContext('2d');

  // base with a slight brighten/glow
  ctx.filter = `brightness(${1 + (b.glow || 0)}) saturate(1.03)`;
  ctx.drawImage(src, 0, 0);
  ctx.filter = 'none';

  // skin smoothing: overlay a blurred copy
  if (b.smooth > 0) {
    const blur = document.createElement('canvas');
    blur.width = w; blur.height = h;
    const bx = blur.getContext('2d');
    const radius = Math.max(1, Math.round(Math.min(w, h) * 0.008 * b.smooth * 2));
    bx.filter = `blur(${radius}px)`;
    bx.drawImage(src, 0, 0);
    ctx.globalAlpha = Math.min(0.8, b.smooth);
    ctx.drawImage(blur, 0, 0);
    ctx.globalAlpha = 1;
  }

  // sharpen to keep eyes / edges crisp
  sharpenCtx(ctx, w, h, b.sharpen || 0);
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
function drawCover(ctx, src, dx, dy, dw, dh, filterCss, radius = 0) {
  const sw = src.width, sh = src.height;
  const scale = Math.max(dw / sw, dh / sh);
  const w = sw * scale, h = sh * scale;
  const ox = dx + (dw - w) / 2, oy = dy + (dh - h) / 2;
  ctx.save();
  if (radius > 0) roundRectPath(ctx, dx, dy, dw, dh, radius);
  else { ctx.beginPath(); ctx.rect(dx, dy, dw, dh); }
  ctx.clip();
  ctx.filter = (filterCss && filterCss !== 'none') ? filterCss : 'none';
  ctx.drawImage(src, ox, oy, w, h);
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
  if (CFG.brand.tagline) {
    ctx.fillStyle = onGradient ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.5)';
    ctx.font = `italic 500 ${Math.round(22 * s)}px "Segoe UI", sans-serif`;
    ctx.fillText(CFG.brand.tagline, cx, titleY + 66 * s);
  }

  // date at the very bottom
  const sub = CFG.brand.subFooter || dateStr();
  ctx.fillStyle = onGradient ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.55)';
  ctx.font = `600 ${Math.round(24 * s)}px "Segoe UI", sans-serif`;
  ctx.fillText(sub, cx, titleY + 100 * s);
}

// Load an image once and cache it (used for PNG frame overlays + logo).
const _imgCache = {};
function loadImage(src) {
  if (_imgCache[src]) return _imgCache[src];
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Không nạp được ảnh: ' + src));
    img.src = src;
  });
  _imgCache[src] = p;
  return p;
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
  const m = state.mode;
  // Custom template: designer PNG + explicit photo slots → full control.
  if (m.slots && m.canvas) return composeTemplate(m);

  const O = CFG.output;
  const f = state.filter.css;
  const rad = CFG.brand.photoRadius || 0;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const layout = m.layout;
  const showBrand = m.showBrand !== false;

  if (layout === 'single') {
    canvas.width = O.photoW; canvas.height = O.photoH;
    fillBackground(ctx, canvas.width, canvas.height);
    const pad = 60, footer = showBrand ? 240 : 60;
    drawCover(ctx, frameFor(state.rawFrames[0]), pad, pad, canvas.width - pad * 2, canvas.height - pad * 2 - footer, f, rad);
    if (showBrand) drawBrand(ctx, canvas.width / 2, canvas.height - footer / 2 - 4, true);

  } else if (layout === 'strip') {
    canvas.width = O.stripW; canvas.height = O.stripH;
    fillBackground(ctx, canvas.width, canvas.height);
    const pad = 26, gap = 16, footer = showBrand ? 210 : 26;
    const n = state.rawFrames.length;
    const cellW = canvas.width - pad * 2;
    const cellH = (canvas.height - footer - pad * 2 - gap * (n - 1)) / n;
    state.rawFrames.forEach((fr, i) => {
      drawCover(ctx, frameFor(fr), pad, pad + i * (cellH + gap), cellW, cellH, f, Math.min(rad, 18));
    });
    if (showBrand) drawBrand(ctx, canvas.width / 2, canvas.height - footer / 2 - 2, false);

  } else { // grid 2x2
    canvas.width = O.photoW; canvas.height = O.photoH;
    fillBackground(ctx, canvas.width, canvas.height);
    const pad = 40, gap = 24, footer = showBrand ? 240 : 40;
    const cols = 2, rows = 2;
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
  return canvas;
}

// Template-driven layout: background, photos into named slots, then a PNG frame.
async function composeTemplate(m) {
  const f = state.filter.css;
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
  if (m.showBrand) drawBrand(ctx, canvas.width / 2, canvas.height - 120, true);
  return canvas;
}

// Build an animated GIF from a list of raw frames (square photo + brand bar).
function framesToGif(rawFrames, boomerang, delay) {
  return new Promise((resolve, reject) => {
    const O = CFG.output;
    const size = O.gifSize, bar = O.gifBrandBar;
    const f = state.filter.css;
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
      if (CFG.brand.tagline) {
        ctx.fillStyle = onGradient ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.5)';
        ctx.font = 'italic 500 20px "Segoe UI", sans-serif';
        ctx.fillText(CFG.brand.tagline, size / 2, size + bar * 0.74);
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
  let dataUrl = state.lastOutput.dataUrl;
  // Strip: optionally lay 2 copies side by side on a 4×6 sheet.
  if (state.printCfg.stripDoubleOn4x6 && state.mode && state.mode.layout === 'strip') {
    dataUrl = await makeDoubleStrip(dataUrl);
  }
  const res = await window.booth.print(dataUrl, {
    printerName: state.printCfg.printerName,
    copies: state.printCfg.copies,
    silent: state.printCfg.silent,
  });
  if (res && res.success === false && res.reason) console.warn('Print:', res.reason);
  return res;
}

$('#btn-print').addEventListener('click', async () => {
  const btn = $('#btn-print'); btn.disabled = true; const label = btn.textContent; btn.textContent = '🖨️ Đang in…';
  try { await doPrint(); }
  catch (e) { alert('Lỗi khi in: ' + e.message); }
  finally { btn.disabled = false; btn.textContent = label; }
});

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
  const sel = $('#set-printer');
  sel.innerHTML = '<option value="">(Máy in mặc định)</option>';
  try {
    const printers = await window.booth.listPrinters();
    printers.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.name;
      opt.textContent = (p.displayName || p.name) + (p.isDefault ? ' — mặc định' : '');
      if (state.printCfg.printerName === p.name) opt.selected = true;
      sel.appendChild(opt);
    });
  } catch {}
  $('#set-copies').value = state.printCfg.copies || 1;
  $('#set-silent').checked = !!state.printCfg.silent;
  $('#set-stripdouble').checked = !!state.printCfg.stripDoubleOn4x6;

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
    copies: Math.max(1, parseInt($('#set-copies').value, 10) || 1),
    silent: $('#set-silent').checked,
    stripDoubleOn4x6: $('#set-stripdouble').checked,
  };
  try { localStorage.setItem('booth.print', JSON.stringify(state.printCfg)); } catch {}
  $('#settings-modal').classList.remove('show');
}
$('#btn-settings').addEventListener('click', openSettings);
$('#btn-settings-capture').addEventListener('click', openSettings);
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
    const maxW = Math.min(window.innerWidth * 0.6, 520);
    const maxH = window.innerHeight * 0.4;
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
    ...(S.emojis || []).map((ch) => ({ type: 'emoji', char: ch })),
    ...(S.images || []).map((src) => ({ type: 'img', src })),
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
  const size = Math.round(SE.stageW * 0.22);
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
      try { const im = await loadImage(m.src); ctx.drawImage(im, cx - size / 2, cy - size / 2, size, size); } catch (_e) {}
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
  }
}

$('#se-print').addEventListener('click', async () => {
  const btn = $('#se-print'); btn.disabled = true; const label = btn.textContent; btn.textContent = '🖨️ Đang in…';
  try {
    await applyStickers();
    await doPrint();
    $('#sticker-editor').classList.remove('show');
  } catch (e) {
    alert('Lỗi khi in: ' + e.message);
  } finally {
    btn.disabled = false; btn.textContent = label;
  }
});

$('#se-done').addEventListener('click', async () => {
  const btn = $('#se-done'); btn.disabled = true; btn.textContent = '⏳ Đang lưu…';
  try {
    await applyStickers();
    $('#sticker-editor').classList.remove('show');
  } catch (e) {
    alert('Lỗi khi gắn sticker: ' + e.message);
  } finally {
    btn.disabled = false; btn.textContent = '✅ Xong';
  }
});

// Build the shareable session (photo + GIF + Boomerang for photo modes) once.
async function ensureShare() {
  if (state._shareRes) return state._shareRes;
  const files = [];
  const mainRole = state.lastOutput.kind === 'gif' ? 'animation' : 'photo';
  files.push({ role: mainRole, dataUrl: state.lastOutput.dataUrl });
  if (state.mode && state.mode.kind === 'photo') {
    const anim = await ensureSessionAnim().catch(() => null);
    if (anim) {
      files.push({ role: 'gif', dataUrl: anim.gif });
      files.push({ role: 'boomerang', dataUrl: anim.boomerang });
    }
  }
  state._shareRes = await window.booth.saveSession(files);
  return state._shareRes;
}

$('#btn-share').addEventListener('click', async () => {
  if (!state.lastOutput) return;
  const btn = $('#btn-share'); btn.disabled = true; btn.textContent = '⏳ Đang tạo QR…';
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
    btn.disabled = false; btn.textContent = '📱 Chia sẻ / QR';
  }
});
$('#btn-close-share').addEventListener('click', () => $('#share-modal').classList.remove('show'));

$('#btn-email').addEventListener('click', async () => {
  if (!state.lastOutput) return;
  const btn = $('#btn-email'); btn.disabled = true;
  try { await ensureShare(); $('#email-modal').classList.add('show'); }
  catch (e) { alert('Lỗi: ' + e.message); }
  finally { btn.disabled = false; }
});
$('#btn-close-email').addEventListener('click', () => $('#email-modal').classList.remove('show'));
$('#btn-email-send').addEventListener('click', () => {
  const to = $('#email-input').value.trim();
  const link = state._shareRes ? state._shareRes.pageUrl : '';
  const subject = encodeURIComponent('Ảnh của bạn từ ' + CFG.brand.title);
  const body = encodeURIComponent('Chào bạn,\n\nẢnh vừa chụp tại ' + CFG.brand.title + ':\n' + link + '\n\nCảm ơn bạn đã ghé booth! 🎉');
  window.booth.openExternal(`mailto:${to}?subject=${subject}&body=${body}`);
  $('#email-modal').classList.remove('show');
});

// retake / home / start
$('#btn-retake').addEventListener('click', () => { state._shareRes = null; state.sessionAnim = null; show('capture'); startCamera(); });
$('#btn-home').addEventListener('click', () => { state._shareRes = null; state.sessionAnim = null; stopCamera(); show('home'); });
$('#btn-start').addEventListener('click', () => { buildModeGrid(); buildSourceBar(); show('mode'); });

// ---- init ----
window.addEventListener('DOMContentLoaded', async () => {
  buildModeGrid();
  buildSourceBar(false); // don't power on the webcam just to read labels at startup
  buildHomeShowcase();
  try { state.settings = await window.booth.getSettings(); } catch (_e) {}
});

// Dải "mẫu khung" ở màn hình chờ (ảnh từ config, hoặc placeholder gradient).
function buildHomeShowcase() {
  const cfg = (CFG.home && CFG.home.showcase) || {};
  const wrap = $('#home-showcase');
  if (!wrap) return;
  if (cfg.enabled === false) { wrap.style.display = 'none'; return; }
  const imgs = (cfg.images && cfg.images.length) ? cfg.images : null;
  const cards = imgs
    ? imgs.map((src) => `<div class="hs-card"><img src="${src}" alt="mẫu khung"></div>`).join('')
    : [1, 2, 3].map((n) => `<div class="hs-card hs-ph">Khung ${n}</div>`).join('');
  wrap.innerHTML = `<div class="hs-title">${cfg.title || ''}</div><div class="hs-row">${cards}</div>`;
}
