const { app, BrowserWindow, ipcMain, session, shell, globalShortcut, powerSaveBlocker } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const QRCode = require('qrcode');
const { startServer } = require('./server');
const canon = require('./canon');
const dcc = require('./dcc');
const settingsStore = require('./settings');
const CFG = require('./renderer/config.js');
try { if (CFG.camera && CFG.camera.canon && CFG.camera.canon.dccUrl) dcc.setBase(CFG.camera.canon.dccUrl); } catch (_e) {}

const KIOSK = (CFG && CFG.kiosk) || {};
const GALLERY = (CFG && CFG.gallery) || {};
// Khách có đồng ý đăng ảnh CÔNG KHAI lên gallery không (ảnh hưởng tag Cloudinary).
let SHARE_PUBLIC = GALLERY.publicDefault !== false;

/** Upload a saved capture to the online gallery. Returns a public URL or null. */
async function uploadToGallery(filePath, filename, kind, tagsOverride, folderOverride) {
  if (!GALLERY.enabled) return null;
  const buf = fs.readFileSync(filePath);
  const isGif = kind === 'gif' || filename.toLowerCase().endsWith('.gif');

  if ((GALLERY.provider || 'cloudinary') === 'cloudinary') {
    const c = GALLERY.cloudinary || {};
    if (!c.cloudName || !c.uploadPreset) return null;
    const dataUri = `data:image/${isGif ? 'gif' : 'png'};base64,` + buf.toString('base64');
    const form = new FormData();
    form.append('file', dataUri);
    form.append('upload_preset', c.uploadPreset);
    const folder = folderOverride || c.folder;
    if (folder) form.append('folder', folder);
    // Gắn tag để trang gallery lọc + liệt kê được qua Cloudinary list API.
    // Tag: nếu truyền tagsOverride thì dùng; không thì theo quyền công khai.
    let tags = tagsOverride;
    if (tags == null) tags = SHARE_PUBLIC ? [(c.tags || 'young-booth')] : [];
    if (tags && tags.length) form.append('tags', tags.join(','));
    const resp = await fetch(`https://api.cloudinary.com/v1_1/${c.cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    });
    if (!resp.ok) throw new Error('Cloudinary HTTP ' + resp.status);
    const j = await resp.json();
    const raw = j.secure_url || j.url;
    if (!raw) return null;
    // Serve an optimized URL to cut bandwidth (auto quality + auto format).
    // GIF keeps animation → only q_auto; photos get q_auto,f_auto.
    const tx = isGif ? 'q_auto' : 'q_auto,f_auto';
    return raw.includes('/upload/') ? raw.replace('/upload/', `/upload/${tx}/`) : raw;
  }

  // provider = 'custom'
  if (!GALLERY.uploadUrl) return null;
  const headers = { 'Content-Type': 'application/json' };
  if (GALLERY.apiKey) headers['Authorization'] = 'Bearer ' + GALLERY.apiKey;
  const resp = await fetch(GALLERY.uploadUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ filename, kind, dataBase64: buf.toString('base64') }),
  });
  if (!resp.ok) throw new Error('HTTP ' + resp.status);
  let url = null;
  try { const j = await resp.json(); url = j && j.url; } catch (_e) {}
  if (!url && GALLERY.publicBaseUrl) url = GALLERY.publicBaseUrl.replace(/\/$/, '') + '/' + filename;
  return url || null;
}

let mainWindow = null;
let serverInfo = null;   // { port, lanUrl }
let allowQuit = false;   // gate for kiosk close-prevention
let powerBlockerId = null;

// Captures must live in a WRITABLE folder. When packaged, __dirname is inside
// the read-only app.asar, so use the per-user app data folder instead.
const CAPTURES_DIR = app.isPackaged
  ? path.join(app.getPath('userData'), 'captures')
  : path.join(__dirname, 'captures');

const SETTINGS_PATH = app.isPackaged
  ? path.join(app.getPath('userData'), 'booth-settings.json')
  : path.join(__dirname, 'booth-settings.json');
const getSettings = () => settingsStore.read(SETTINGS_PATH);
// Lưu xong → báo giao diện (luồng sự kiện / giá áp dụng ngay, không cần mở lại app).
const saveSettings = (o) => {
  const saved = settingsStore.write(SETTINGS_PATH, o);
  try { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('settings:changed', settingsStore.publicView(saved)); } catch (_e) {}
  return saved;
};
// Hồ sơ sự kiện theo id (renderer chỉ gửi id; thư mục / quyền công khai lấy từ cài đặt, không tin dữ liệu từ giao diện).
const eventById = (id) => (id && (getSettings().events || []).find((e) => e.id === id)) || null;
const safeId = (id) => String(id || '').replace(/[^a-z0-9-]/g, '');
// Ảnh của lượt chụp sự kiện → captures/events/<id>/<id>_<tên file>; luồng thường → captures/<tên file>.
function captureTarget(eventId, filename) {
  const ev = safeId(eventId);
  if (!ev) return { dir: CAPTURES_DIR, name: filename, rel: filename };
  const dir = path.join(CAPTURES_DIR, 'events', ev);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const name = ev + '_' + filename;
  return { dir, name, rel: 'events/' + ev + '/' + name };
}
// Khung sự kiện khai báo NGOÀI app: C:\YoungBooth-Frames\events\<bộ>\frames.json (mảng khung, mỗi khung có id + mode).
// overlay/thumb ghi tên file tương đối → tính từ thư mục bộ đó. Thêm khung kiểu này KHÔNG cần đóng gói lại app.
const FRAMES_ROOT = 'C:\\YoungBooth-Frames';
function externalEventFrames() {
  const out = [];
  const dir = path.join(FRAMES_ROOT, 'events');
  let subs = [];
  try { subs = fs.readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()); } catch (_e) { return out; }
  const known = new Set((CFG.eventFrames || []).map((f) => f.id));
  for (const d of subs) {
    const fp = path.join(dir, d.name, 'frames.json');
    if (!fs.existsSync(fp)) continue;
    try {
      let arr = JSON.parse(fs.readFileSync(fp, 'utf8'));
      if (!Array.isArray(arr)) arr = (arr && arr.frames) || [];
      const abs = (v) => !v ? v : (/^(file:|[a-zA-Z]:[\\/])/.test(v) ? v : 'file:///C:/YoungBooth-Frames/events/' + d.name + '/' + String(v).replace(/^[\\/]+/, ''));
      for (const f of arr) {
        if (!f || !f.id || !f.mode || known.has(f.id)) continue;
        known.add(f.id);
        out.push(Object.assign({}, f, { overlay: abs(f.overlay), thumb: abs(f.thumb) || abs(f.overlay), source: 'events/' + d.name + '/frames.json' }));
      }
    } catch (e) { console.warn('[frames.json]', fp, e.message); }
  }
  return out;
}
ipcMain.handle('booth:eventFrames', async () => externalEventFrames());

// Danh sách mọi khung (thường + sự kiện) cho webadmin.
function frameCatalog() {
  const out = [];
  const add = (f, mode, lib) => out.push({
    id: f.id, mode, name: f.name, lib, hidden: !!f.hidden, holiday: f.holiday || '',
    photos: Number(f.photos) || ((CFG.modes || []).find((m) => m.id === mode) || {}).select || 1,
    thumb: f.thumb || f.overlay || '',
    texts: (f.texts || []).map((t) => ({ id: t.id, label: t.label || t.id, value: t.value || '' })),
  });
  for (const m of (CFG.modes || [])) {
    if (m.kind !== 'photo') continue;
    (Array.isArray(m.frames) ? m.frames : []).forEach((f, i) =>
      add(i === 0 ? Object.assign({ thumb: m.thumb || m.overlay, texts: m.texts }, f) : f, m.id, i === 0 ? 'default' : 'normal'));
  }
  for (const f of (CFG.eventFrames || []).concat(externalEventFrames())) add(f, f.mode, 'event');
  return out;
}

function priceForMode(pay, modeId) {
  if (pay.priceMode === 'perMode') {
    const v = pay.perMode && pay.perMode[modeId];
    return (v != null) ? v : pay.fixedPrice;
  }
  return pay.fixedPrice;
}

function buildVietQr(bank, amount, code) {
  if (!bank || !bank.bankCode || !bank.accountNumber) return null;
  const base = `https://img.vietqr.io/image/${encodeURIComponent(bank.bankCode)}-${encodeURIComponent(bank.accountNumber)}-compact2.png`;
  const q = `?amount=${amount}&addInfo=${encodeURIComponent(code)}&accountName=${encodeURIComponent(bank.accountName || '')}`;
  return base + q;
}

// Poll SePay for an incoming transfer matching the amount + order code.
async function sepayPaid(sepay, amount, code) {
  if (!sepay || !sepay.apiToken) return false;
  try {
    const resp = await fetch('https://my.sepay.vn/userapi/transactions/list?limit=20', {
      headers: { Authorization: 'Bearer ' + sepay.apiToken },
    });
    if (!resp.ok) return false;
    const j = await resp.json();
    const txs = j.transactions || j.data || [];
    return txs.some((t) => {
      const amt = Number(t.amount_in || t.amountIn || t.amount || 0);
      const content = String(t.transaction_content || t.content || t.description || '').toUpperCase();
      return amt >= amount && content.includes(String(code).toUpperCase());
    });
  } catch { return false; }
}

// ---- helpers -------------------------------------------------------------

function getLanIp() {
  const ifaces = os.networkInterfaces();
  // Prefer a private IPv4 (192.168.x / 10.x / 172.16-31.x)
  const candidates = [];
  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        candidates.push(net.address);
      }
    }
  }
  const priv = candidates.find((a) =>
    a.startsWith('192.168.') || a.startsWith('10.') || /^172\.(1[6-9]|2\d|3[01])\./.test(a)
  );
  return priv || candidates[0] || '127.0.0.1';
}

function ensureCapturesDir() {
  if (!fs.existsSync(CAPTURES_DIR)) {
    fs.mkdirSync(CAPTURES_DIR, { recursive: true });
  }
}

// ---- window --------------------------------------------------------------

function createWindow() {
  const kioskOn = !!KIOSK.enabled;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 640,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    backgroundColor: '#0b0b12',
    autoHideMenuBar: true,
    kiosk: kioskOn,          // full screen, hides taskbar
    fullscreen: kioskOn,
    frame: !kioskOn,         // frameless in kiosk (no title bar / close button)
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // In kiosk mode, block every close attempt (Alt+F4, etc.) unless staff
  // triggered the secret exit shortcut.
  mainWindow.on('close', (e) => {
    if (kioskOn && !allowQuit) e.preventDefault();
  });

  // Uncomment for debugging:
  // mainWindow.webContents.openDevTools({ mode: 'detach' });
}

// ---- app lifecycle -------------------------------------------------------

// Tìm CameraControl.exe (digiCamControl) ở các vị trí cài phổ biến.
function findDccExe() {
  const CAM = (CFG.camera && CFG.camera.canon) || {};
  const LAD = process.env.LOCALAPPDATA || '';
  const PF = process.env['ProgramFiles'] || 'C:\\Program Files';
  const PF86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const candidates = [
    CAM.dccExe,
    path.join(PF86, 'digiCamControl', 'CameraControl.exe'),
    path.join(PF, 'digiCamControl', 'CameraControl.exe'),
    LAD && path.join(LAD, 'Programs', 'digiCamControl', 'CameraControl.exe'),
    'D:\\Young Booth\\CameraControl.exe',
    'D:\\digiCamControl\\CameraControl.exe',
    'C:\\digiCamControl\\CameraControl.exe',
  ].filter(Boolean);
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch (_e) {}
  }
  return null;
}

// Đảm bảo digiCamControl đang chạy (cầu nối tới máy ảnh Canon). Tự mở nếu chưa chạy.
async function ensureDccRunning() {
  const CAM = (CFG.camera && CFG.camera.canon) || {};
  if (!(CFG.camera && CFG.camera.source === 'canon' && CAM.provider === 'dcc')) return;
  if (CAM.dccAutoLaunch === false) return;
  try { if (await dcc.available()) return; } catch (_e) {}

  const exe = findDccExe();
  if (!exe) {
    console.warn('[dcc] Không tìm thấy CameraControl.exe để tự mở (hãy cài digiCamControl).');
    return;
  }
  try {
    console.log('[dcc] Đang mở digiCamControl:', exe);
    const child = spawn(exe, [], { detached: true, stdio: 'ignore', cwd: path.dirname(exe) });
    child.unref();
  } catch (e) {
    console.warn('[dcc] Không mở được digiCamControl:', e.message);
    return;
  }
  // Chờ webserver digiCamControl lên (tối đa ~25s).
  const deadline = Date.now() + 25000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1500));
    try { if (await dcc.available()) { console.log('[dcc] digiCamControl sẵn sàng.'); return; } } catch (_e) {}
  }
  console.warn('[dcc] digiCamControl chưa phản hồi sau khi mở (kiểm tra Webserver đã bật + máy ảnh đã cắm).');
}

app.whenReady().then(async () => {
  ensureCapturesDir();

  // Tự mở digiCamControl (cầu nối Canon) nếu cấu hình dùng Canon qua dcc.
  ensureDccRunning().catch(() => {});

  // Auto-approve camera / microphone permission requests for the booth.
  session.defaultSession.setPermissionRequestHandler((wc, permission, callback) => {
    if (permission === 'media') return callback(true);
    return callback(false);
  });

  const lanIp = getLanIp();
  serverInfo = await startServer(lanIp, CAPTURES_DIR, 3737, {
    read: getSettings,
    save: saveSettings,
    publicView: settingsStore.publicView,
    merge: settingsStore.deepMerge,
    eventTemplate: settingsStore.EVENT_TEMPLATE,
    frames: frameCatalog,
    modes: () => (CFG.modes || []).map((m) => ({ id: m.id, name: m.name, kind: m.kind })),
    framesDir: 'C:\\YoungBooth-Frames',
  });

  // Auto-start on Windows login (registers the installed executable).
  // Chỉ áp dụng cho bản đã ĐÓNG GÓI (cài qua installer) — bản dev (electron .) bỏ qua
  // để không đăng ký nhầm electron.exe vào khởi động cùng Windows.
  try {
    if (app.isPackaged) {
      app.setLoginItemSettings({
        openAtLogin: !!KIOSK.autoStart,
        path: process.execPath,
        args: [],
      });
    }
  } catch (_e) {}

  createWindow();

  if (KIOSK.enabled) {
    // Keep the display awake during an event.
    if (KIOSK.preventSleep !== false) {
      try { powerBlockerId = powerSaveBlocker.start('prevent-display-sleep'); } catch (_e) {}
    }
    // Secret staff exit shortcut.
    const combo = KIOSK.exitShortcut || 'CommandOrControl+Shift+Q';
    try {
      globalShortcut.register(combo, () => { allowQuit = true; app.quit(); });
    } catch (_e) {}
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  try { globalShortcut.unregisterAll(); } catch (_e) {}
  try { if (powerBlockerId !== null && powerSaveBlocker.isStarted(powerBlockerId)) powerSaveBlocker.stop(powerBlockerId); } catch (_e) {}
});

app.on('before-quit', () => {
  allowQuit = true;
  try { canon.shutdown(); } catch (_e) {}
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---- IPC handlers --------------------------------------------------------

/**
 * Save a data URL (PNG or GIF) into the captures folder, and return a
 * shareable LAN URL + a QR code (data URL) pointing to a download page.
 */
ipcMain.handle('booth:save', async (_evt, { dataUrl, kind }) => {
  ensureCapturesDir();
  const isGif = /^data:image\/gif/.test(dataUrl) || kind === 'gif';
  const ext = isGif ? 'gif' : 'png';
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const filename = `${id}.${ext}`;
  const filePath = path.join(CAPTURES_DIR, filename);

  const base64 = dataUrl.replace(/^data:[^;]+;base64,/, '');
  fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));

  let fileUrl = `${serverInfo.lanUrl}/captures/${filename}`;
  let pageUrl = `${serverInfo.lanUrl}/p/${filename}`;
  let cloud = false;

  // Prefer a cloud/public URL so the QR works off the local network.
  try {
    const publicUrl = await uploadToGallery(filePath, filename, isGif ? 'gif' : 'photo');
    if (publicUrl) { fileUrl = publicUrl; pageUrl = publicUrl; cloud = true; }
  } catch (e) {
    console.warn('[gallery] upload failed, falling back to LAN:', e.message);
  }

  const qrDataUrl = await QRCode.toDataURL(pageUrl, {
    margin: 1,
    width: 420,
    color: { dark: '#111827', light: '#ffffff' },
  });

  return { id, filename, fileUrl, pageUrl, qrDataUrl, cloud };
});

// Khách chọn công khai / riêng tư ở màn kết quả.
ipcMain.handle('booth:setPublic', async (_evt, { v }) => { SHARE_PUBLIC = !!v; return { ok: true, public: SHARE_PUBLIC }; });

// Tạo QR dataURL (để vẽ lên ảnh in).
ipcMain.handle('booth:makeQR', async (_evt, { text }) => {
  try {
    const dataUrl = await QRCode.toDataURL(String(text), { margin: 1, width: 420, color: { dark: '#1a1a2e', light: '#ffffff' } });
    return { ok: true, dataUrl };
  } catch (e) { return { ok: false, reason: e.message }; }
});

// Đẩy trọn 1 LƯỢT chụp (ảnh + GIF + Boomerang) lên Cloudinary, gắn tag theo mã lượt
// (sess-<id>) để trang gallery #/s/<id> đọc lại được. Ảnh công khai thêm tag gallery.
ipcMain.handle('booth:pushSession', async (_evt, { sessionId, files, isPublic, eventId }) => {
  try {
    if (!GALLERY.enabled) return { ok: false, reason: 'gallery disabled' };
    ensureCapturesDir();
    const ev = eventById(eventId);
    if (ev && !(ev.gallery && ev.gallery.public)) isPublic = false;   // sự kiện riêng tư → không lên gallery chung
    const sTag = 'sess-' + sessionId;
    const pubTag = (GALLERY.cloudinary && GALLERY.cloudinary.tags) || 'young-booth';
    let uploaded = 0;
    for (const f of (files || [])) {
      const isGif = /^data:image\/gif/.test(f.dataUrl);
      const ext = isGif ? 'gif' : 'png';
      const tgt = captureTarget(ev && ev.id, `${sessionId}-${f.role}.${ext}`);
      const fp = path.join(tgt.dir, tgt.name);
      fs.writeFileSync(fp, Buffer.from(f.dataUrl.replace(/^data:[^;]+;base64,/, ''), 'base64'));
      const tags = [sTag];
      if (ev) tags.push('event:' + ev.id);
      if (f.role === 'photo' && isPublic) tags.push(pubTag); // chỉ ảnh mới lên gallery chung
      try { if (await uploadToGallery(fp, tgt.name, isGif ? 'gif' : 'photo', tags, ev && ev.gallery && ev.gallery.folder)) uploaded++; }
      catch (e) { console.warn('[session] upload fail', f.role, e.message); }
    }
    // ok = ít nhất 1 file lên cloud (để renderer biết QR cloud có dùng được không).
    return { ok: uploaded > 0, uploaded, total: (files || []).length };
  } catch (e) { return { ok: false, reason: e.message }; }
});

// Đẩy ảnh (vd khi bấm IN) lên gallery cloud. Chạy ngầm, không chặn in.
ipcMain.handle('booth:galleryPush', async (_evt, { dataUrl, kind }) => {
  try {
    if (!GALLERY.enabled) return { ok: false, reason: 'gallery disabled' };
    const isGif = kind === 'gif';
    ensureCapturesDir();
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const filename = `${id}.${isGif ? 'gif' : 'png'}`;
    const filePath = path.join(CAPTURES_DIR, filename);
    const b64 = String(dataUrl).replace(/^data:[^;]+;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));
    const url = await uploadToGallery(filePath, filename, isGif ? 'gif' : 'photo');
    return { ok: !!url, url: url || null };
  } catch (e) { return { ok: false, reason: e.message }; }
});

/**
 * Save a whole session (photo + gif + boomerang) under one id, and return a
 * QR pointing to a session page that lists all of them for download.
 */
ipcMain.handle('booth:saveSession', async (_evt, { files, eventId }) => {
  ensureCapturesDir();
  const ev = eventById(eventId);
  const sid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const saved = [];
  let cloudAny = false;
  for (const f of (files || [])) {
    const isGif = /^data:image\/gif/.test(f.dataUrl);
    const isVideo = /^data:video\//.test(f.dataUrl);
    const ext = isVideo ? 'webm' : isGif ? 'gif' : 'png';
    const tgt = captureTarget(ev && ev.id, `${sid}-${f.role}.${ext}`);
    const filename = tgt.name;
    const filePath = path.join(tgt.dir, filename);
    fs.writeFileSync(filePath, Buffer.from(f.dataUrl.replace(/^data:[^;]+;base64,/, ''), 'base64'));
    let url = `${serverInfo.lanUrl}/captures/${tgt.rel}`;
    if (!isVideo) { // video: chỉ tải qua LAN (Cloudinary preset dành cho ảnh)
      try {
        const evTags = ev ? ['event:' + ev.id] : undefined;
        const cloud = await uploadToGallery(filePath, filename, isGif ? 'gif' : 'photo', evTags, ev && ev.gallery && ev.gallery.folder);
        if (cloud) { url = cloud; cloudAny = true; }
      } catch (e) { console.warn('[gallery] session upload failed:', e.message); }
    }
    saved.push({ role: f.role, filename, url });
  }
  const pageUrl = `${serverInfo.lanUrl}/s/${sid}`;
  const qrDataUrl = await QRCode.toDataURL(pageUrl, { margin: 1, width: 420, color: { dark: '#111827', light: '#ffffff' } });
  return { sid, pageUrl, qrDataUrl, files: saved, cloud: cloudAny };
});

/** List installed printers so the UI can offer a picker. */
ipcMain.handle('booth:listPrinters', async () => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      return await mainWindow.webContents.getPrintersAsync();
    }
  } catch (_e) {}
  return [];
});

/**
 * Hỏi driver: trang mặc định của máy in này DỌC hay NGANG (đọc qua System.Drawing).
 * DNP DS-RX1: hàng in thường = PR (4x6) dọc; hàng in bật 2inch cut = (6x4) ngang.
 * Kết quả lưu đệm 60s/máy in để không gọi PowerShell mỗi lần in.
 */
const _pageShapeCache = {};
ipcMain.handle('booth:pageShape', async (_evt, { printerName }) => {
  const key = printerName || '';
  const hit = _pageShapeCache[key];
  if (hit && Date.now() - hit.at < 60000) return hit.res;
  const { execFile } = require('child_process');
  const safe = key.replace(/'/g, "''");
  const ps = 'Add-Type -AssemblyName System.Drawing; $s = New-Object Drawing.Printing.PrinterSettings; ' +
    (safe ? `$s.PrinterName = '${safe}'; ` : '') +
    'if (-not $s.IsValid) { exit 2 }; $b = $s.DefaultPageSettings.Bounds; Write-Output ("{0} {1}" -f $b.Width, $b.Height)';
  const res = await new Promise((resolve) => {
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', ps],
      { timeout: 10000, windowsHide: true }, (err, stdout) => {
        const m = /(\d+)\s+(\d+)/.exec(String(stdout || ''));
        if (err || !m) return resolve({ ok: false, reason: err ? err.message : 'no-output' });
        const w = +m[1], h = +m[2];
        resolve({ ok: true, width: w, height: h, landscape: w > h });
      });
  });
  if (res.ok) _pageShapeCache[key] = { at: Date.now(), res };
  return res;
});

/** Print a data URL by rendering it full-page in a hidden window. */
ipcMain.handle('booth:print', async (_evt, { dataUrl, opts }) => {
  opts = opts || {};
  const printWin = new BrowserWindow({ show: false, webPreferences: { offscreen: false } });
  // Khung ảnh = ĐÚNG kích thước trang driver cấp (inch), đặt ở góc trên-trái; ảnh vừa khít trong khung.
  // Không dùng %/vw/vh: khi in, Chromium tính chúng theo cửa sổ ẩn (800×600) → ảnh to/lệch khỏi trang.
  // Trừ 0.02in để không tràn sang trang thứ 2 do làm tròn. Không có kích thước → khung theo trang mặc định cũ.
  const pg = opts.pageIn && opts.pageIn.w > 0 && opts.pageIn.h > 0
    ? `width:${(opts.pageIn.w - 0.02).toFixed(3)}in;height:${(opts.pageIn.h - 0.02).toFixed(3)}in;`
    : 'width:100%;height:100%;';
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { margin: 0; }
    html,body{margin:0;padding:0;background:#fff;overflow:hidden;}
    .pg{position:absolute;left:0;top:0;${pg}}
    .pg img{display:block;width:100%;height:100%;object-fit:contain;}
  </style></head><body><div class="pg"><img src="${dataUrl}"></div></body></html>`;
  // Write to a temp file (data: URLs are too short for a full-res image → ERR_INVALID_URL).
  const tmpHtml = path.join(app.getPath('temp'), `yb-print-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.html`);
  try { fs.writeFileSync(tmpHtml, html, 'utf8'); } catch (e) { printWin.close(); return { success: false, reason: e.message }; }
  await printWin.loadFile(tmpHtml);

  // Make sure the image has actually decoded before printing (avoid blank pages).
  try {
    await printWin.webContents.executeJavaScript(
      'new Promise((r)=>{const i=document.querySelector("img");' +
      'if(i&&i.complete&&i.naturalWidth)return r();' +
      'i.addEventListener("load",r);i.addEventListener("error",r);setTimeout(r,1500);});'
    );
  } catch (_e) {}

  // Luôn in vào máy in ĐÍCH DANH (thiếu tên → máy in mặc định của Windows) để dùng đúng khổ trang của driver.
  if (!opts.printerName) {
    try { const def = (await mainWindow.webContents.getPrintersAsync()).find((p) => p.isDefault); if (def) opts.printerName = def.name; } catch (_e) {}
  }
  const printOpts = {
    silent: !!opts.silent,
    printBackground: true,
    margins: { marginType: 'none' },
    copies: Math.max(1, parseInt(opts.copies, 10) || 1),
  };
  if (opts.printerName) printOpts.deviceName = opts.printerName;

  // Force the paper size so it lands on the right photo paper (microns).
  const MIC = 25400; // microns per inch
  const CM = 10000; // microns per cm
  const PAPER = {
    '4x6': { width: Math.round(4 * MIC), height: Math.round(6 * MIC) }, // = 4R dọc
    '6x4': { width: Math.round(6 * MIC), height: Math.round(4 * MIC) }, // = 4R ngang
    '2x6': { width: Math.round(2 * MIC), height: Math.round(6 * MIC) },
    '5.5x15.5': { width: Math.round(5.5 * CM), height: Math.round(15.5 * CM) },   // dải sự kiện
    '10.5x15.5': { width: Math.round(10.5 * CM), height: Math.round(15.5 * CM) }, // ảnh cưới
    // các khổ NGANG (khi xoay 90° cho giấy nằm ngang)
    '6x2': { width: Math.round(6 * MIC), height: Math.round(2 * MIC) },
    '15.5x5.5': { width: Math.round(15.5 * CM), height: Math.round(5.5 * CM) },
    '15.5x10.5': { width: Math.round(15.5 * CM), height: Math.round(10.5 * CM) },
    'a4': 'A4',
    'letter': 'Letter',
  };
  const paper = (opts.paper || '').toLowerCase();
  if (paper === '4x6') {
    // Driver DNP đã đặt khổ PR (4x6) DỌC. Dùng THẲNG khổ mặc định của driver —
    // KHÔNG ép custom pageSize (ép microns làm driver hiểu nhầm → ra tờ NGANG + mảng đen).
    printOpts.landscape = false;
  } else if (PAPER[paper]) {
    printOpts.pageSize = PAPER[paper];
    // Trang ngang (width>height) → in landscape.
    printOpts.landscape = (typeof printOpts.pageSize === 'object' && printOpts.pageSize.width > printOpts.pageSize.height);
  }

  return new Promise((resolve) => {
    printWin.webContents.print(printOpts, (success, reason) => {
      printWin.close();
      try { fs.unlinkSync(tmpHtml); } catch (_e) {}
      // Nhật ký in (userData/print-log.txt): máy in, khổ trang driver, có xoay không → dò lỗi in sai khổ.
      try {
        const line = [new Date().toISOString(), success ? 'OK' : 'LOI ' + (reason || ''), 'may=' + (printOpts.deviceName || '(mac dinh)'),
          'kho=' + (opts.paper || ''), 'trang=' + (opts.pageIn ? opts.pageIn.w + 'x' + opts.pageIn.h + 'in' : '?'),
          'xoay=' + (opts.rotated ? 'co' : 'khong'), 'ban=' + printOpts.copies].join(' | ');
        const lf = path.join(app.getPath('userData'), 'print-log.txt');
        fs.appendFileSync(lf, line + '\r\n');
        if (fs.statSync(lf).size > 512 * 1024) fs.writeFileSync(lf, fs.readFileSync(lf, 'utf8').split('\r\n').slice(-500).join('\r\n'));
      } catch (_e) {}
      resolve({ success, reason });
    });
  });
});

ipcMain.handle('booth:info', async () => {
  return { lanUrl: serverInfo ? serverInfo.lanUrl : null };
});

// Đọc 1 file ảnh ngoài (file:// hoặc đường dẫn tuyệt đối) → dataURL cho renderer.
ipcMain.handle('booth:readImage', async (_evt, { src }) => {
  try {
    let p = String(src || '');
    if (/^file:/i.test(p)) p = decodeURIComponent(p.replace(/^file:\/\/\/?/i, ''));
    const buf = fs.readFileSync(p);
    const ext = path.extname(p).toLowerCase();
    const mime = (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg'
      : ext === '.webp' ? 'image/webp' : 'image/png';
    return { ok: true, dataUrl: `data:${mime};base64,` + buf.toString('base64') };
  } catch (e) { return { ok: false, reason: e.message }; }
});

ipcMain.handle('booth:openExternal', async (_evt, { url }) => {
  // Only allow safe schemes.
  if (/^(https?:|mailto:)/i.test(url)) {
    await shell.openExternal(url);
    return { ok: true };
  }
  return { ok: false };
});

// ---- Canon EDSDK ----
ipcMain.handle('canon:available', async () => canon.moduleAvailable());
ipcMain.handle('canon:init', async () => canon.init(CAPTURES_DIR));
ipcMain.handle('canon:startLiveView', async (_evt, { fps }) => {
  return canon.startLiveView((dataUrl) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('canon:liveview', dataUrl);
    }
  }, fps || 15);
});
ipcMain.handle('canon:stopLiveView', async () => { canon.stopLiveView(); return { ok: true }; });
ipcMain.handle('canon:capture', async () => canon.capture());
ipcMain.handle('canon:getSettings', async () => canon.getSettings());
ipcMain.handle('canon:setSetting', async (_evt, { key, value }) => canon.setSetting(key, value));
ipcMain.handle('canon:shutdown', async () => { canon.shutdown(); return { ok: true }; });

// ---- digiCamControl (DSLR Canon) ----
ipcMain.handle('dcc:available', async () => dcc.available());
ipcMain.handle('dcc:liveFrame', async () => dcc.liveFrame());
ipcMain.handle('dcc:startLiveView', async () => { await dcc.startLiveView(); return { ok: true }; });
ipcMain.handle('dcc:capture', async () => dcc.capture());

// ---- Payment ----
ipcMain.handle('booth:getSettings', async () => settingsStore.publicView(getSettings()));

ipcMain.handle('pay:createOrder', async (_evt, { modeId, eventId }) => {
  const pay = getSettings().payment;
  const ev = eventById(eventId);
  const on = ev ? !!(ev.payment && ev.payment.enabled) : pay.enabled;
  if (!on) return { enabled: false };
  const amount = priceForMode(pay, modeId);
  const code = 'YB' + Date.now().toString().slice(-7);
  const orderId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    enabled: true, orderId, amount, code, currency: pay.currency,
    method: pay.method, allowStaffOverride: pay.allowStaffOverride !== false,
    qrUrl: buildVietQr(pay.bank, amount, code),
    bank: pay.bank,
  };
});

ipcMain.handle('pay:check', async (_evt, { amount, code }) => {
  const pay = getSettings().payment;
  if (pay.method === 'sepay') {
    const paid = await sepayPaid(pay.sepay, amount, code);
    return { paid };
  }
  return { paid: false }; // manual → staff confirms in the app
});

// Cài đặt trong app (đã qua PIN): bật/tắt luồng sự kiện + chọn sự kiện đang chạy.
ipcMain.handle('booth:setEventMode', async (_evt, { enabled, activeEventId }) => {
  const s = getSettings();
  s.eventMode = { enabled: !!enabled, activeEventId: safeId(activeEventId) };
  const saved = saveSettings(s);
  return { ok: true, settings: settingsStore.publicView(saved) };
});

// Nhân viên xác nhận "Đã thanh toán" bằng PIN quản trị (khách không tự bấm được).
ipcMain.handle('pay:verifyPin', async (_evt, { pin }) => {
  const s = getSettings();
  return { ok: String(pin || '') !== '' && String(pin) === String(s.adminPin || '') };
});
