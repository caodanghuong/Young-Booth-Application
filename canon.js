/**
 * Canon EDSDK integration (main process).
 *
 * Wraps @brick-a-brack/napi-canon-cameras. The native module + Canon EDSDK are
 * NOT bundled by default (Canon license + native build) — see CANON_SETUP.md.
 * Everything here is guarded so the app keeps running on webcam when the module,
 * SDK or camera is absent.
 *
 * Verify method names against the installed version after `npm install`:
 *   node -e "const c=require('@brick-a-brack/napi-canon-cameras'); console.log(Object.keys(c)); const cam=c.cameraBrowser.getCamera(); console.log(cam && Object.getOwnPropertyNames(Object.getPrototypeOf(cam)));"
 */
const fs = require('fs');

let edsdk = null;      // the loaded native module
let camera = null;     // connected camera handle
let liveTimer = null;  // live-view polling interval
let pendingCapture = null; // { resolve, reject } for an in-flight takePicture()
let captureDir = null;
let handlerBound = false;

function tryLoad() {
  if (edsdk) return edsdk;
  try {
    edsdk = require('@brick-a-brack/napi-canon-cameras');
  } catch (_e) {
    edsdk = null; // module not installed / not built
  }
  return edsdk;
}

/** Is the Canon integration even possible in this build? */
function moduleAvailable() {
  return !!tryLoad();
}

/** Connect to the first Canon camera and configure it to save photos to the PC. */
function init(capturesDir) {
  const mod = tryLoad();
  if (!mod) return { ok: false, reason: 'Chưa cài/build module Canon (xem CANON_SETUP.md)' };

  const { cameraBrowser, watchCameras, CameraProperty, Option, ImageQuality, CameraBrowser } = mod;
  captureDir = capturesDir;

  try {
    try { watchCameras(); } catch (_e) {}
    camera = cameraBrowser.getCamera();
    if (!camera) return { ok: false, reason: 'Không thấy máy ảnh Canon (kiểm tra cáp USB + đã bật máy)' };

    camera.connect();

    // Save captured photos to the host (PC), largest JPEG so prints look good.
    try {
      camera.setProperties({
        [CameraProperty.ID.SaveTo]: Option.SaveTo.Host,
        [CameraProperty.ID.ImageQuality]: ImageQuality.ID.LargeJPEGFine,
      });
    } catch (e) {
      console.warn('[canon] setProperties failed:', e.message);
    }

    // Receive downloaded files from takePicture().
    if (!handlerBound) {
      cameraBrowser.setEventHandler((eventName, event) => {
        const isDownload =
          eventName === (CameraBrowser.Events && CameraBrowser.Events.DownloadRequest) ||
          eventName === 'EdsObjectEvent_DirItemRequestTransfer' ||
          (event && event.file);
        if (isDownload && event && event.file && pendingCapture) {
          try {
            const local = event.file.downloadToPath(captureDir);
            const filePath = typeof local === 'string'
              ? local
              : (local && local.getPath ? local.getPath() : null);
            const buf = fs.readFileSync(filePath);
            const dataUrl = 'data:image/jpeg;base64,' + buf.toString('base64');
            const p = pendingCapture; pendingCapture = null;
            p.resolve({ dataUrl, filePath });
          } catch (err) {
            const p = pendingCapture; pendingCapture = null;
            p.reject(err);
          }
        }
      });
      handlerBound = true;
    }

    let model = 'Canon';
    try { model = camera.description || camera.getDescription?.() || 'Canon'; } catch (_e) {}
    return { ok: true, model };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

/** Grab one live-view frame as a data URL, tolerant of API naming differences. */
function grabLiveViewDataUrl() {
  if (!camera) return null;
  const fns = ['getLiveViewImage', 'downloadLiveViewImage', 'getLiveView'];
  for (const fn of fns) {
    if (typeof camera[fn] === 'function') {
      let img;
      try { img = camera[fn](); } catch (_e) { return null; }
      if (!img) return null;
      if (typeof img === 'string') return img;
      if (typeof img.getDataURL === 'function') return img.getDataURL();
      if (typeof img.getData === 'function') {
        return 'data:image/jpeg;base64,' + Buffer.from(img.getData()).toString('base64');
      }
    }
  }
  return null;
}

/** Start live view; calls onFrame(dataUrl) at ~fps. */
function startLiveView(onFrame, fps = 15) {
  if (!camera) return { ok: false, reason: 'no-camera' };
  try {
    if (typeof camera.startLiveView === 'function') camera.startLiveView();
  } catch (e) {
    return { ok: false, reason: e.message };
  }
  stopLiveView();
  const interval = Math.max(Math.round(1000 / fps), 40);
  liveTimer = setInterval(() => {
    const d = grabLiveViewDataUrl();
    if (d) onFrame(d);
  }, interval);
  return { ok: true };
}

function stopLiveView() {
  if (liveTimer) { clearInterval(liveTimer); liveTimer = null; }
  try { if (camera && typeof camera.stopLiveView === 'function') camera.stopLiveView(); } catch (_e) {}
}

/** Trigger the mechanical shutter and resolve with the downloaded full-res photo. */
function capture(timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    if (!camera) return reject(new Error('no-camera'));
    const to = setTimeout(() => {
      if (pendingCapture) { pendingCapture = null; reject(new Error('Hết thời gian chờ ảnh từ máy Canon')); }
    }, timeoutMs);
    pendingCapture = {
      resolve: (v) => { clearTimeout(to); resolve(v); },
      reject: (e) => { clearTimeout(to); reject(e); },
    };
    try {
      camera.takePicture();
    } catch (e) {
      clearTimeout(to); pendingCapture = null; reject(e);
    }
  });
}

// Camera settings we try to read for the control panel.
const READ_KEYS = [
  'ProductName', 'BatteryLevel', 'AvailableShots',
  'ISOSpeed', 'Av', 'Tv', 'ExposureCompensation', 'WhiteBalance', 'AEMode', 'DriveMode',
];

/** Read current camera parameters (defensive — skips anything unsupported). */
function getSettings() {
  const mod = tryLoad();
  if (!mod || !camera) return { ok: false, reason: 'no-camera' };
  const ID = mod.CameraProperty && mod.CameraProperty.ID;
  if (!ID) return { ok: false, reason: 'no-property-api' };
  const out = {};
  READ_KEYS.forEach((k) => {
    try {
      const id = ID[k];
      if (id === undefined) return;
      const p = camera.getProperty(id);
      if (p == null) return;
      if (typeof p === 'object') out[k] = (p.label != null ? p.label : (p.value != null ? p.value : String(p)));
      else out[k] = p;
    } catch (_e) {}
  });
  return { ok: true, settings: out };
}

/** Set one camera parameter. `key` = EDSDK property name, `value` = label/value. */
function setSetting(key, value) {
  const mod = tryLoad();
  if (!mod || !camera) return { ok: false, reason: 'no-camera' };
  const ID = mod.CameraProperty && mod.CameraProperty.ID;
  const id = ID && ID[key];
  if (id === undefined) return { ok: false, reason: 'unknown-prop:' + key };
  try {
    camera.setProperties({ [id]: value });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

function shutdown() {
  stopLiveView();
  try { if (camera && typeof camera.disconnect === 'function') camera.disconnect(); } catch (_e) {}
  camera = null;
}

module.exports = { moduleAvailable, init, startLiveView, stopLiveView, capture, getSettings, setSetting, shutdown };
