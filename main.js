const { app, BrowserWindow, ipcMain, session, shell, globalShortcut, powerSaveBlocker } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const QRCode = require('qrcode');
const { startServer } = require('./server');
const canon = require('./canon');
const CFG = require('./renderer/config.js');

const KIOSK = (CFG && CFG.kiosk) || {};
const GALLERY = (CFG && CFG.gallery) || {};

/** Upload a saved capture to the online gallery. Returns a public URL or null. */
async function uploadToGallery(filePath, filename, kind) {
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
    if (c.folder) form.append('folder', c.folder);
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

app.whenReady().then(async () => {
  ensureCapturesDir();

  // Auto-approve camera / microphone permission requests for the booth.
  session.defaultSession.setPermissionRequestHandler((wc, permission, callback) => {
    if (permission === 'media') return callback(true);
    return callback(false);
  });

  const lanIp = getLanIp();
  serverInfo = await startServer(lanIp, CAPTURES_DIR);

  // Auto-start on Windows login (registers the current executable).
  try {
    app.setLoginItemSettings({ openAtLogin: !!KIOSK.autoStart });
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

/**
 * Save a whole session (photo + gif + boomerang) under one id, and return a
 * QR pointing to a session page that lists all of them for download.
 */
ipcMain.handle('booth:saveSession', async (_evt, { files }) => {
  ensureCapturesDir();
  const sid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const saved = [];
  let cloudAny = false;
  for (const f of (files || [])) {
    const isGif = /^data:image\/gif/.test(f.dataUrl);
    const ext = isGif ? 'gif' : 'png';
    const filename = `${sid}-${f.role}.${ext}`;
    const filePath = path.join(CAPTURES_DIR, filename);
    fs.writeFileSync(filePath, Buffer.from(f.dataUrl.replace(/^data:[^;]+;base64,/, ''), 'base64'));
    let url = `${serverInfo.lanUrl}/captures/${filename}`;
    try {
      const cloud = await uploadToGallery(filePath, filename, isGif ? 'gif' : 'photo');
      if (cloud) { url = cloud; cloudAny = true; }
    } catch (e) { console.warn('[gallery] session upload failed:', e.message); }
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

/** Print a data URL by rendering it full-page in a hidden window. */
ipcMain.handle('booth:print', async (_evt, { dataUrl, opts }) => {
  opts = opts || {};
  const printWin = new BrowserWindow({ show: false, webPreferences: { offscreen: false } });
  const html = `<!doctype html><html><head><style>
    @page { margin: 0; }
    html,body{margin:0;padding:0;height:100%;}
    body{display:flex;align-items:center;justify-content:center;}
    img{max-width:100%;max-height:100%;}
  </style></head><body><img src="${dataUrl}"></body></html>`;
  await printWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

  // Make sure the image has actually decoded before printing (avoid blank pages).
  try {
    await printWin.webContents.executeJavaScript(
      'new Promise((r)=>{const i=document.querySelector("img");' +
      'if(i&&i.complete&&i.naturalWidth)return r();' +
      'i.addEventListener("load",r);i.addEventListener("error",r);setTimeout(r,1500);});'
    );
  } catch (_e) {}

  const printOpts = {
    silent: !!opts.silent,
    printBackground: true,
    margins: { marginType: 'none' },
    copies: Math.max(1, parseInt(opts.copies, 10) || 1),
  };
  if (opts.printerName) printOpts.deviceName = opts.printerName;

  return new Promise((resolve) => {
    printWin.webContents.print(printOpts, (success, reason) => {
      printWin.close();
      resolve({ success, reason });
    });
  });
});

ipcMain.handle('booth:info', async () => {
  return { lanUrl: serverInfo ? serverInfo.lanUrl : null };
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
