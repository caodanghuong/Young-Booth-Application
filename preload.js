const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('booth', {
  /** Save a capture (dataUrl) → returns { fileUrl, pageUrl, qrDataUrl, filename }. */
  save: (dataUrl, kind) => ipcRenderer.invoke('booth:save', { dataUrl, kind }),
  /** Save a session of files [{role,dataUrl}] → returns { pageUrl, qrDataUrl, files, cloud }. */
  saveSession: (files) => ipcRenderer.invoke('booth:saveSession', { files }),
  /** Print a dataUrl. opts: { printerName, copies, silent }. */
  print: (dataUrl, opts) => ipcRenderer.invoke('booth:print', { dataUrl, opts }),
  /** List installed printers. */
  listPrinters: () => ipcRenderer.invoke('booth:listPrinters'),
  /** { lanUrl } of the sharing server. */
  info: () => ipcRenderer.invoke('booth:info'),
  /** Public settings (pricing + payment, no secrets). */
  getSettings: () => ipcRenderer.invoke('booth:getSettings'),
  pay: {
    createOrder: (modeId) => ipcRenderer.invoke('pay:createOrder', { modeId }),
    check: (amount, code) => ipcRenderer.invoke('pay:check', { amount, code }),
  },
  /** Open a URL / mailto link in the OS default handler. */
  openExternal: (url) => ipcRenderer.invoke('booth:openExternal', { url }),

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
    /** Subscribe to live-view frames. Returns an unsubscribe function. */
    onLiveViewFrame: (cb) => {
      const h = (_e, dataUrl) => cb(dataUrl);
      ipcRenderer.on('canon:liveview', h);
      return () => ipcRenderer.removeListener('canon:liveview', h);
    },
  },
});
