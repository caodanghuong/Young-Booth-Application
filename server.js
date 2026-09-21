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
function startServer(lanIp, capturesDir, preferredPort = 3737, settingsApi = null) {
  const server = express();
  server.use(express.json({ limit: '1mb' }));

  server.use('/captures', express.static(capturesDir, { maxAge: 0 }));

  // ---------- Webadmin (pricing + payment) ----------
  if (settingsApi) {
    const checkPin = (pin) => {
      try { return String(pin || '') === String(settingsApi.read().adminPin || ''); }
      catch { return false; }
    };

    server.get('/admin/data', (req, res) => {
      if (!checkPin(req.query.pin)) return res.status(401).json({ error: 'Sai PIN' });
      res.json(settingsApi.read());
    });

    server.post('/admin/save', (req, res) => {
      const { pin, settings } = req.body || {};
      if (!checkPin(pin)) return res.status(401).json({ error: 'Sai PIN' });
      try { const saved = settingsApi.save(settings); res.json({ ok: true, settings: saved }); }
      catch (e) { res.status(500).json({ error: e.message }); }
    });

    server.get('/admin', (_req, res) => res.send(adminPageHtml()));
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

function adminPageHtml() {
  return `<!doctype html><html lang="vi"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Young Booth — Webadmin</title>
<style>
  :root{color-scheme:dark}
  body{margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0b0b12;color:#f5f5f7;padding:20px}
  .wrap{max-width:560px;margin:0 auto}
  h1{font-size:22px}
  fieldset{border:1px solid #333;border-radius:12px;margin:16px 0;padding:14px}
  legend{padding:0 8px;color:#c084fc;font-weight:700}
  label{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:10px 0;font-size:15px}
  input,select{background:#1e1e2a;color:#fff;border:1px solid #333;border-radius:8px;padding:9px 11px;font-size:15px;width:220px}
  input[type=checkbox]{width:20px;height:20px}
  button{background:linear-gradient(135deg,#8B5CF6,#EC4899);color:#fff;border:none;border-radius:999px;padding:13px 30px;font-size:16px;font-weight:800;cursor:pointer;width:100%;margin-top:10px}
  .msg{margin-top:12px;font-size:14px}
  .hint{color:#888;font-size:12px}
</style></head><body><div class="wrap">
<h1>⚙️ Young Booth — Cài đặt thanh toán &amp; giá</h1>
<div id="app">Đang tải…</div>
<script>
let PIN='';
async function load(){
  PIN = prompt('Nhập PIN quản trị:')||'';
  const r = await fetch('/admin/data?pin='+encodeURIComponent(PIN));
  if(!r.ok){ document.getElementById('app').innerHTML='<p class="msg">❌ Sai PIN. Tải lại trang để thử lại.</p>'; return; }
  render(await r.json());
}
function render(s){
  const p=s.payment;
  const num=(v)=>v==null?'':v;
  document.getElementById('app').innerHTML=\`
  <fieldset><legend>Thanh toán</legend>
    <label>Bật thu tiền trước khi chụp <input type="checkbox" id="enabled" \${p.enabled?'checked':''}></label>
    <label>Hình thức
      <select id="method">
        <option value="manual" \${p.method==='manual'?'selected':''}>Nhân viên xác nhận</option>
        <option value="sepay" \${p.method==='sepay'?'selected':''}>Tự động (SePay)</option>
      </select></label>
    <label>Cho nhân viên bấm "Đã thanh toán" <input type="checkbox" id="override" \${p.allowStaffOverride!==false?'checked':''}></label>
  </fieldset>
  <fieldset><legend>Giá (đồng)</legend>
    <label>Kiểu tính giá
      <select id="priceMode">
        <option value="fixed" \${p.priceMode==='fixed'?'selected':''}>1 giá cố định</option>
        <option value="perMode" \${p.priceMode==='perMode'?'selected':''}>Theo kiểu chụp</option>
      </select></label>
    <label>Giá cố định <input type="number" id="fixedPrice" value="\${num(p.fixedPrice)}"></label>
    <label>Ảnh đơn <input type="number" id="m_single" value="\${num(p.perMode.single)}"></label>
    <label>Dải 4 ảnh <input type="number" id="m_strip" value="\${num(p.perMode.strip)}"></label>
    <label>Lưới 2×2 <input type="number" id="m_grid" value="\${num(p.perMode.grid)}"></label>
    <label>GIF <input type="number" id="m_gif" value="\${num(p.perMode.gif)}"></label>
    <label>Boomerang <input type="number" id="m_boom" value="\${num(p.perMode.boom)}"></label>
  </fieldset>
  <fieldset><legend>VietQR (tài khoản nhận tiền)</legend>
    <label>Mã ngân hàng <input id="bankCode" value="\${p.bank.bankCode||''}" placeholder="vd VCB, MB, TCB"></label>
    <label>Số tài khoản <input id="accountNumber" value="\${p.bank.accountNumber||''}"></label>
    <label>Tên tài khoản <input id="accountName" value="\${p.bank.accountName||''}"></label>
    <p class="hint">Điền để tạo mã QR chuyển khoản cho khách quét.</p>
  </fieldset>
  <fieldset><legend>SePay (tự xác nhận — tuỳ chọn)</legend>
    <label>API Token <input id="sepayToken" value="\${(p.sepay&&p.sepay.apiToken)||''}"></label>
    <label>STK theo dõi <input id="sepayAcc" value="\${(p.sepay&&p.sepay.accountNumber)||''}"></label>
    <p class="hint">Có token thì app tự phát hiện khách đã chuyển khoản.</p>
  </fieldset>
  <fieldset><legend>Bảo mật</legend>
    <label>Đổi PIN quản trị <input id="adminPin" value="\${s.adminPin||''}"></label>
  </fieldset>
  <button onclick="save()">💾 Lưu cài đặt</button>
  <div class="msg" id="msg"></div>\`;
}
async function save(){
  const g=(id)=>document.getElementById(id);
  const settings={
    adminPin:g('adminPin').value,
    payment:{
      enabled:g('enabled').checked,
      method:g('method').value,
      allowStaffOverride:g('override').checked,
      priceMode:g('priceMode').value,
      fixedPrice:Number(g('fixedPrice').value||0),
      perMode:{ single:Number(g('m_single').value||0), strip:Number(g('m_strip').value||0), grid:Number(g('m_grid').value||0), gif:Number(g('m_gif').value||0), boom:Number(g('m_boom').value||0) },
      bank:{ bankCode:g('bankCode').value.trim(), accountNumber:g('accountNumber').value.trim(), accountName:g('accountName').value.trim() },
      sepay:{ apiToken:g('sepayToken').value.trim(), accountNumber:g('sepayAcc').value.trim() },
    }
  };
  const r=await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:PIN,settings})});
  const j=await r.json();
  g('msg').textContent = r.ok ? '✅ Đã lưu. Giá mới áp dụng ngay cho lượt chụp tiếp theo.' : ('❌ '+(j.error||'Lỗi'));
  if(r.ok) PIN = settings.adminPin || PIN;
}
load();
</script>
</div></body></html>`;
}

module.exports = { startServer };
