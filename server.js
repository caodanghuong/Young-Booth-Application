const express = require('express');
const path = require('path');
const fs = require('fs');

/**
 * Start a small LAN web server that serves captured photos/GIFs and a nice
 * per-file download page (so guests can scan a QR and save to their phone).
 * @param {string} lanIp      the machine's LAN IPv4
 * @param {string} capturesDir a WRITABLE folder where captures are stored
 * Returns { port, lanUrl }.
 */
function startServer(lanIp, capturesDir, preferredPort = 3737) {
  const server = express();

  server.use('/captures', express.static(capturesDir, { maxAge: 0 }));

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
    if (!files.length) return res.status(404).send('Not found');
    const labels = { photo: 'Ảnh', gif: 'GIF động', boomerang: 'Boomerang', animation: 'Ảnh động' };
    const order = { photo: 0, gif: 1, boomerang: 2, animation: 1 };
    files.sort((a, b) => (order[roleOf(a)] ?? 9) - (order[roleOf(b)] ?? 9));
    function roleOf(fn) { const m = fn.match(/-([a-z]+)\.[a-z]+$/i); return m ? m[1] : ''; }
    const cards = files.map((f) => {
      const role = roleOf(f);
      const label = labels[role] || 'Ảnh';
      return `<div class="card">
        <div class="lbl">${label}</div>
        <img src="/captures/${f}" alt="${label}">
        <a class="btn" href="/captures/${f}" download="youngbooth-${f}">⬇️ Tải ${label}</a>
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
