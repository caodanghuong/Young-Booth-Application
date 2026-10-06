/**
 * digiCamControl integration (main process) — điều khiển DSLR Canon (vd R50)
 * qua webserver HTTP của digiCamControl.
 *
 * LƯU Ý: webserver digiCamControl trả HTTP hơi lỗi chuẩn (Duplicate Content-Length)
 * nên PHẢI dùng http.request với insecureHTTPParser:true (fetch/undici sẽ từ chối).
 * Và dùng 127.0.0.1 (IPv4) vì nó chỉ nghe IPv4.
 */
const fs = require('fs');
const path = require('path');
const net = require('net');

let BASE = 'http://127.0.0.1:5513';
function setBase(url) {
  if (!url) return;
  // ép localhost → 127.0.0.1 để tránh lỗi IPv6
  BASE = url.replace(/\/$/, '').replace('://localhost', '://127.0.0.1');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// digiCamControl trả HTTP lỗi chuẩn (Duplicate Content-Length) → http/fetch của Node từ chối.
// Nên đọc RAW TCP socket, lấy Content-Length ĐẦU TIÊN, đọc đúng số byte body.
function httpGet(pathUrl, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    let u;
    try { u = new URL(BASE + pathUrl); } catch (e) { return reject(e); }
    const s = net.connect({ host: u.hostname, port: u.port || 80 }, () => {
      s.write('GET ' + u.pathname + u.search + ' HTTP/1.1\r\nHost: ' + u.hostname + ':' + (u.port || 80) + '\r\nConnection: close\r\n\r\n');
    });
    let buf = Buffer.alloc(0), hd = false, he = 0, cl = null, st = 0, fin = false;
    const done = (v) => { if (fin) return; fin = true; try { s.destroy(); } catch (_e) {} resolve(v); };
    const chk = () => {
      if (!hd) {
        const i = buf.indexOf('\r\n\r\n');
        if (i < 0) return;
        hd = true; he = i + 4;
        const h = buf.slice(0, i).toString('latin1');
        const sm = /^HTTP\/\d\.\d (\d+)/.exec(h);
        st = sm ? +sm[1] : 0;
        const cm = /content-length:\s*(\d+)/i.exec(h); // lấy cái đầu tiên
        cl = cm ? +cm[1] : null;
      }
      if (hd && cl != null) {
        const b = buf.slice(he);
        if (b.length >= cl) done({ status: st, body: b.slice(0, cl) });
      }
    };
    s.on('data', (c) => { buf = Buffer.concat([buf, c]); chk(); });
    s.on('end', () => { if (!fin) { const b = hd ? buf.slice(he) : buf; done({ status: st, body: cl != null ? b.slice(0, cl) : b }); } });
    s.on('error', (e) => { if (!fin) { fin = true; reject(e); } });
    s.setTimeout(timeoutMs, () => { if (!fin) { if (hd) done({ status: st, body: buf.slice(he) }); else { fin = true; try { s.destroy(); } catch (_e) {} reject(new Error('timeout')); } } });
  });
}

// Gửi một "single line command" (slc) tới digiCamControl.
async function slc(cmd, p1, p2) {
  let p = `/?slc=${encodeURIComponent(cmd)}`;
  if (p1 != null) p += `&param1=${encodeURIComponent(p1)}`;
  if (p2 != null) p += `&param2=${encodeURIComponent(p2)}`;
  const { body } = await httpGet(p);
  return body.toString('utf8').trim();
}

/** digiCamControl có đang chạy + thấy máy ảnh không? */
async function available() {
  try {
    const cams = await slc('list', 'cameras');
    return !!(cams && cams.trim() && cams.trim() !== '?');
  } catch { return false; }
}

/** Lấy 1 khung liveview dưới dạng dataURL (null nếu chưa có). */
async function liveFrame() {
  try {
    const { status, body } = await httpGet('/liveview.jpg', 4000);
    if (status === 200 && body && body.length > 100) {
      return 'data:image/jpeg;base64,' + body.toString('base64');
    }
  } catch (_e) {}
  return null;
}

/** Cố bật liveview trong digiCamControl. */
async function startLiveView() {
  try { await slc('do', 'LiveViewWnd_Show'); } catch (_e) {}
  try { await slc('do', 'LiveViewWnd_StartLiveView'); } catch (_e) {}
}

/** Chụp full-res: bấm màn trập → chờ file về → trả dataURL. */
async function capture(timeoutMs = 20000) {
  let folder = '';
  try { folder = await slc('get', 'session.folder'); } catch (_e) {}
  let before = '';
  try { before = await slc('get', 'lastcaptured'); } catch (_e) {}

  await slc('capture');

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleep(400);
    let name = '';
    try { name = await slc('get', 'lastcaptured'); } catch (_e) {}
    if (name && name !== '?' && name !== before) {
      const fp = path.join(folder || '', name);
      try {
        if (fs.existsSync(fp)) {
          const s1 = fs.statSync(fp).size;
          await sleep(250);
          const s2 = fs.statSync(fp).size;
          if (s1 === s2 && s2 > 0) {
            const buf = fs.readFileSync(fp);
            return { dataUrl: 'data:image/jpeg;base64,' + buf.toString('base64'), filePath: fp };
          }
        }
      } catch (_e) {}
    }
  }
  throw new Error('Không nhận được ảnh từ digiCamControl (kiểm tra máy ảnh + webserver).');
}

module.exports = { setBase, available, liveFrame, startLiveView, capture };
