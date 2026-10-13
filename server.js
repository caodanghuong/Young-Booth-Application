const express = require('express');
const path = require('path');
const fs = require('fs');
const { adminPageHtml } = require('./admin-page');

/**
 * Start a small LAN web server that serves captured photos/GIFs and a nice
 * per-file download page (so guests can scan a QR and save to their phone).
 * @param {string} lanIp      the machine's LAN IPv4
 * @param {string} capturesDir a WRITABLE folder where captures are stored
 * Returns { port, lanUrl }.
 */
function startServer(lanIp, capturesDir, preferredPort = 3737, settingsApi = null) {
  const server = express();
  server.use(express.json({ limit: '1mb' }));

  server.use('/captures', express.static(capturesDir, { maxAge: 0 }));

  // ---------- Webadmin (pricing + payment) ----------
  if (settingsApi) {
    const DEFAULT_PIN = '1234';
    const isLocal = (req) => /^(::1|127\.|::ffff:127\.)/.test(req.socket.remoteAddress || '');
    // Chống dò PIN: sai 5 lần → khoá IP đó 5 phút.
    const fails = new Map(); // ip -> { n, until }
    const locked = (ip) => { const f = fails.get(ip); return !!(f && f.until > Date.now()); };
    const checkPin = (req, pin) => {
      const ip = req.socket.remoteAddress || '';
      if (locked(ip)) return false;
      let ok = false;
      try { ok = String(pin || '') === String(settingsApi.read().adminPin || ''); } catch { ok = false; }
      if (ok) { fails.delete(ip); return true; }
      const f = fails.get(ip) || { n: 0, until: 0 };
      f.n += 1;
      if (f.n >= 5) { f.n = 0; f.until = Date.now() + 5 * 60 * 1000; }
      fails.set(ip, f);
      return false;
    };
    // Khi PIN vẫn là mặc định → chỉ cho vào admin từ chính máy booth (khách chung Wi-Fi không vào được).
    const adminGuard = (req, res, next) => {
      let pinIsDefault = true;
      try { pinIsDefault = String(settingsApi.read().adminPin || '') === DEFAULT_PIN; } catch (_e) {}
      if (pinIsDefault && !isLocal(req)) {
        return res.status(403).send('Webadmin đang dùng PIN mặc định — hãy mở http://127.0.0.1:' + preferredPort + '/admin trên máy booth và đổi PIN trước.');
      }
      if (locked(req.socket.remoteAddress || '')) return res.status(429).json({ error: 'Sai PIN quá nhiều lần, thử lại sau 5 phút.' });
      next();
    };
    // Không bao giờ gửi token SePay ra trình duyệt; chỉ báo đã có hay chưa.
    const maskSecrets = (s) => {
      const c = JSON.parse(JSON.stringify(s));
      if (c.payment && c.payment.sepay) {
        c.payment.sepay.hasToken = !!c.payment.sepay.apiToken;
        c.payment.sepay.apiToken = '';
      }
      return c;
    };

    server.get('/admin/data', adminGuard, (req, res) => {
      if (!checkPin(req, req.query.pin)) return res.status(401).json({ error: 'Sai PIN' });
      res.json(maskSecrets(settingsApi.read()));
    });

    server.post('/admin/save', adminGuard, (req, res) => {
      const { pin, settings } = req.body || {};
      if (!checkPin(req, pin)) return res.status(401).json({ error: 'Sai PIN' });
      try {
        // Ô token để trống = giữ nguyên token đã lưu.
        const cur = settingsApi.read();
        const next = JSON.parse(JSON.stringify(settings || {}));
        if (next.payment && next.payment.sepay) {
          if (!next.payment.sepay.apiToken) next.payment.sepay.apiToken = (cur.payment && cur.payment.sepay && cur.payment.sepay.apiToken) || '';
          delete next.payment.sepay.hasToken;
        }
        if (!String(next.adminPin || '').trim()) next.adminPin = cur.adminPin;
        const err = checkEvents(next, cur);
        if (err) return res.status(400).json({ error: err });
        const stamp = new Date().toISOString();
        if (Array.isArray(next.events)) next.events.forEach((e) => { e.updatedAt = stamp; if (!e.createdAt) e.createdAt = stamp; });
        const saved = settingsApi.save(settingsApi.merge ? settingsApi.merge(cur, next) : next);
        res.json({ ok: true, settings: maskSecrets(saved) });
      }
      catch (e) { res.status(500).json({ error: e.message }); }
    });

    // Hồ sơ sự kiện hợp lệ: id a-z0-9- duy nhất; không xoá / đổi id sự kiện ĐANG CHẠY.
    function checkEvents(next, cur) {
      if (!Array.isArray(next.events)) return null;
      const ids = new Set();
      for (const e of next.events) {
        if (!e || !/^[a-z0-9-]+$/.test(String(e.id || ''))) return 'Mã sự kiện chỉ gồm chữ thường không dấu, số và dấu gạch ngang: ' + (e && e.id);
        if (ids.has(e.id)) return 'Trùng mã sự kiện: ' + e.id;
        if (!String(e.name || '').trim()) return 'Sự kiện ' + e.id + ' chưa có tên.';
        ids.add(e.id);
      }
      const running = cur.eventMode && cur.eventMode.enabled && cur.eventMode.activeEventId;
      const stillOn = !next.eventMode || next.eventMode.enabled !== false;
      if (running && stillOn && !ids.has(running)) return 'Không xoá / đổi mã sự kiện đang chạy (' + running + '). Tắt luồng sự kiện hoặc chọn sự kiện khác trước.';
      return null;
    }

    // Danh sách khung (thường + sự kiện) để chọn khung cho sự kiện; ảnh thumb phục vụ qua /admin/img.
    server.get('/admin/frames', adminGuard, (req, res) => {
      if (!checkPin(req, req.query.pin)) return res.status(401).json({ error: 'Sai PIN' });
      const toUrl = (src) => {
        const m = /^file:\/\/\/C:\/YoungBooth-Frames\/(.+)$/i.exec(String(src || ''));
        return m ? '/admin/img?f=' + encodeURIComponent(decodeURIComponent(m[1])) : '';
      };
      const frames = (settingsApi.frames ? settingsApi.frames() : []).map((f) => Object.assign({}, f, { thumbUrl: toUrl(f.thumb) }));
      res.json({ frames, modes: settingsApi.modes ? settingsApi.modes() : [], template: settingsApi.eventTemplate ? settingsApi.eventTemplate('su-kien-moi', 'Sự kiện mới') : null });
    });
    // Ảnh thumb trong C:\YoungBooth-Frames: chỉ đọc, chỉ .png/.jpg, chặn ra ngoài thư mục.
    server.get('/admin/img', adminGuard, (req, res) => {
      if (!checkPin(req, req.query.pin)) return res.status(401).end();
      const root = path.resolve(settingsApi.framesDir || 'C:\\YoungBooth-Frames');
      const rel = String(req.query.f || '');
      const full = path.resolve(root, rel);
      if (!/\.(png|jpe?g)$/i.test(full) || !(full + '').toLowerCase().startsWith(root.toLowerCase() + path.sep) || rel.includes('..')) return res.status(400).end();
      if (!fs.existsSync(full)) return res.status(404).end();
      res.set('Cache-Control', 'max-age=300');
      res.sendFile(full);
    });

    server.get('/admin', adminGuard, (_req, res) => res.send(adminPageHtml()));
  }
  // --------------------------------------------------

  // Friendly download/preview page for a single capture.
  server.get('/p/:file', (req, res) => {
    const file = path.basename(req.params.file);
    const full = path.join(capturesDir, file);
    if (!fs.existsSync(full)) return res.status(404).send('Not found');
    const isGif = file.toLowerCase().endsWith('.gif');
    res.send(`<!doctype html><html lang="vi"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Young Booth — Ảnh của bạn</title>
<style>
  :root { color-scheme: dark; }
  body{margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0b0b12;color:#fff;
       min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;box-sizing:border-box}
  h1{font-size:20px;font-weight:700;margin:0 0 4px}
  p{opacity:.6;margin:0 0 18px;font-size:14px}
  img{max-width:100%;max-height:64vh;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
  a.btn{margin-top:22px;display:inline-block;background:linear-gradient(135deg,#a855f7,#ec4899);
        color:#fff;text-decoration:none;font-weight:700;padding:14px 30px;border-radius:999px;font-size:16px}
</style></head><body>
  <h1>🎉 Young Booth</h1>
  <p>Nhấn giữ ảnh để lưu, hoặc bấm nút tải bên dưới.</p>
  <img src="/captures/${file}" alt="capture">
  <a class="btn" href="/captures/${file}" download="youngbooth-${file}">⬇️ Tải ${isGif ? 'GIF' : 'ảnh'} về máy</a>
</body></html>`);
  });

  // Session page: shows all files (photo + GIF + Boomerang) of one capture.
  server.get('/s/:id', (req, res) => {
    const id = path.basename(req.params.id);
    let files = [];
    try { files = fs.readdirSync(capturesDir).filter((f) => f.startsWith(id + '-')); } catch (_e) {}
    if (!files.length) {   // lượt chụp của luồng sự kiện
      try {
        for (const ev of fs.readdirSync(path.join(capturesDir, 'events'))) {
          const hit = fs.readdirSync(path.join(capturesDir, 'events', ev)).filter((f) => f.startsWith(ev + '_' + id + '-'));
          if (hit.length) { files = hit.map((f) => 'events/' + ev + '/' + f); break; }
        }
      } catch (_e) {}
    }
    if (!files.length) return res.status(404).send('Not found');
    const labels = { photo: 'Ảnh', gif: 'GIF động', boomerang: 'Boomerang', animation: 'Ảnh động' };
    const order = { photo: 0, gif: 1, boomerang: 2, animation: 1 };
    files.sort((a, b) => (order[roleOf(a)] ?? 9) - (order[roleOf(b)] ?? 9));
    function roleOf(fn) { const m = fn.match(/-([a-z]+)\.[a-z]+$/i); return m ? m[1] : ''; }
    const dl = (f) => path.basename(f);
    const cards = files.map((f) => {
      const role = roleOf(f);
      const label = labels[role] || 'Ảnh';
      return `<div class="card">
        <div class="lbl">${label}</div>
        <img src="/captures/${f}" alt="${label}">
        <a class="btn" href="/captures/${f}" download="youngbooth-${dl(f)}">⬇️ Tải ${label}</a>
      </div>`;
    }).join('');
    res.send(`<!doctype html><html lang="vi"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Young Booth — Ảnh của bạn</title>
<style>
  :root { color-scheme: dark; }
  body{margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0b0b12;color:#fff;
       min-height:100vh;padding:22px 16px;box-sizing:border-box;text-align:center}
  h1{font-size:22px;margin:0 0 4px}
  p{opacity:.6;margin:0 0 22px;font-size:14px}
  .grid{display:flex;flex-direction:column;gap:24px;max-width:460px;margin:0 auto}
  .card{background:#16161f;border-radius:16px;padding:14px}
  .lbl{font-weight:700;margin-bottom:10px;font-size:16px}
  .card img{max-width:100%;max-height:52vh;border-radius:10px}
  a.btn{margin-top:14px;display:inline-block;background:linear-gradient(135deg,#8B5CF6,#EC4899);
        color:#fff;text-decoration:none;font-weight:700;padding:12px 26px;border-radius:999px;font-size:15px}
</style></head><body>
  <h1>🎉 Young Booth</h1>
  <p>Nhấn giữ ảnh để lưu, hoặc bấm nút tải bên dưới.</p>
  <div class="grid">${cards}</div>
</body></html>`);
  });

  server.get('/', (_req, res) => res.send('Young Booth server running.'));

  return new Promise((resolve) => {
    const listener = server.listen(preferredPort, '0.0.0.0', () => {
      const port = listener.address().port;
      resolve({ port, lanUrl: `http://${lanIp}:${port}` });
    });
    listener.on('error', () => {
      // Port busy → let the OS pick a free one.
      const fallback = server.listen(0, '0.0.0.0', () => {
        const port = fallback.address().port;
        resolve({ port, lanUrl: `http://${lanIp}:${port}` });
      });
    });
  });
}

module.exports = { startServer };
