const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('booth', {
  /** Save a capture (dataUrl) → returns { fileUrl, pageUrl, qrDataUrl, filename }. */
  save: (dataUrl, kind) => ipcRenderer.invoke('booth:save', { dataUrl, kind }),
  /** Save a session of files [{role,dataUrl}] → returns { pageUrl, qrDataUrl, files, cloud }. */
  saveSession: (files, eventId) => ipcRenderer.invoke('booth:saveSession', { files, eventId }),
  /** Print a dataUrl. opts: { printerName, copies, silent }. */
  print: (dataUrl, opts) => ipcRenderer.invoke('booth:print', { dataUrl, opts }),
  /** Trang mặc định của máy in đang dọc hay ngang → { ok, width, height, landscape }. */
  pageShape: (printerName) => ipcRenderer.invoke('booth:pageShape', { printerName }),
  /** List installed printers. */
  listPrinters: () => ipcRenderer.invoke('booth:listPrinters'),
  /** { lanUrl } of the sharing server. */
  info: () => ipcRenderer.invoke('booth:info'),
  /** Public settings (pricing + payment, no secrets). */
  getSettings: () => ipcRenderer.invoke('booth:getSettings'),
  /** Webadmin / Cài đặt vừa lưu → cb(publicSettings). Trả về hàm huỷ đăng ký. */
  onSettingsChanged: (cb) => {
    const h = (_e, s) => cb(s);
    ipcRenderer.on('settings:changed', h);
    return () => ipcRenderer.removeListener('settings:changed', h);
  },
  /** Khung sự kiện khai báo ngoài app (C:\\YoungBooth-Frames\\events\\<bộ>\\frames.json). */
  eventFrames: () => ipcRenderer.invoke('booth:eventFrames'),
  /** Cài đặt riêng của máy (máy in, nguồn ảnh…) lưu trong booth-settings.json — đọc ĐỒNG BỘ lúc khởi động. */
  localSeed: () => ipcRenderer.sendSync('booth:localSeed'),
  /** Sao cài đặt riêng của máy (localStorage) vào booth-settings.json để mang sang máy mới. */
  saveLocal: (data) => ipcRenderer.invoke('booth:saveLocal', { data }),
  /** Bật/tắt luồng sự kiện + chọn sự kiện (Cài đặt trong app, đã qua PIN). */
  setEventMode: (enabled, activeEventId) => ipcRenderer.invoke('booth:setEventMode', { enabled, activeEventId }),
  pay: {
    createOrder: (modeId, eventId) => ipcRenderer.invoke('pay:createOrder', { modeId, eventId }),
    check: (amount, code) => ipcRenderer.invoke('pay:check', { amount, code }),
    verifyPin: (pin) => ipcRenderer.invoke('pay:verifyPin', { pin }),
  },
  /** Open a URL / mailto link in the OS default handler. */
  openExternal: (url) => ipcRenderer.invoke('booth:openExternal', { url }),
  /** Read an external image file (file:// or absolute path) → { ok, dataUrl }. */
  readImage: (src) => ipcRenderer.invoke('booth:readImage', { src }),
  /** Push an image (e.g. on print) to the cloud gallery. Returns { ok, url }. */
  galleryPush: (dataUrl, kind) => ipcRenderer.invoke('booth:galleryPush', { dataUrl, kind }),
  /** Set whether photos are shared publicly (listed in gallery) or private. */
  setPublic: (v) => ipcRenderer.invoke('booth:setPublic', { v }),
  /** Make a QR code dataURL for a text/URL. */
  makeQR: (text) => ipcRenderer.invoke('booth:makeQR', { text }),
  /** Push a whole session (photo+gif+boomerang) tagged by session id. */
  pushSession: (sessionId, files, isPublic, eventId) => ipcRenderer.invoke('booth:pushSession', { sessionId, files, isPublic, eventId }),

  // ---- Canon EDSDK ----
  canon: {
    available: () => ipcRenderer.invoke('canon:available'),
    init: () => ipcRenderer.invoke('canon:init'),
    startLiveView: (fps) => ipcRenderer.invoke('canon:startLiveView', { fps }),
    stopLiveView: () => ipcRenderer.invoke('canon:stopLiveView'),
    capture: () => ipcRenderer.invoke('canon:capture'),
    getSettings: () => ipcRenderer.invoke('canon:getSettings'),
    setSetting: (key, value) => ipcRenderer.invoke('canon:setSetting', { key, value }),
    shutdown: () => ipcRenderer.invoke('canon:shutdown'),
    /** Subscribe to EDSDK live-view frames. Returns an unsubscribe function. */
    onLiveViewFrame: (cb) => {
      const h = (_e, dataUrl) => cb(dataUrl);
      ipcRenderer.on('canon:liveview', h);
      return () => ipcRenderer.removeListener('canon:liveview', h);
    },
  },
  // ---- digiCamControl (DSLR Canon) ----
  dcc: {
    available: () => ipcRenderer.invoke('dcc:available'),
    liveFrame: () => ipcRenderer.invoke('dcc:liveFrame'),
    startLiveView: () => ipcRenderer.invoke('dcc:startLiveView'),
    capture: () => ipcRenderer.invoke('dcc:capture'),
  },
});
