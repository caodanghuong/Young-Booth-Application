// Trang webadmin (/admin): thanh toán & giá + LUỒNG SỰ KIỆN (SPEC-LUONG-SU-KIEN.md).
// Một trang tĩnh, gọi API: GET /admin/data, GET /admin/frames, POST /admin/save (đều cần PIN).
function adminPageHtml() {
  return `<!doctype html><html lang="vi"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Young Booth — Webadmin</title>
<style>
  :root{color-scheme:dark}
  *{box-sizing:border-box}
  body{margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0b0b12;color:#f5f5f7;padding:20px}
  .wrap{max-width:760px;margin:0 auto}
  h1{font-size:22px}
  h3{margin:18px 0 8px;font-size:16px}
  fieldset{border:1px solid #333;border-radius:12px;margin:16px 0;padding:14px}
  legend{padding:0 8px;color:#c084fc;font-weight:700}
  label{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:10px 0;font-size:15px}
  input,select,textarea{background:#1e1e2a;color:#fff;border:1px solid #333;border-radius:8px;padding:9px 11px;font-size:15px;width:260px;font-family:inherit}
  input[type=checkbox],input[type=radio]{width:20px;height:20px}
  input[type=color]{width:60px;padding:2px;height:36px}
  button{background:linear-gradient(135deg,#8B5CF6,#EC4899);color:#fff;border:none;border-radius:999px;padding:13px 30px;font-size:16px;font-weight:800;cursor:pointer;width:100%;margin-top:10px}
  button.sm{width:auto;padding:7px 14px;font-size:13px;margin:0 0 0 6px;font-weight:700}
  button.ghost{background:#26263a}
  button.danger{background:#b4233c}
  .msg{margin-top:12px;font-size:14px}
  .hint{color:#999;font-size:12px;margin:4px 0}
  .status{font-size:17px;font-weight:800;padding:12px 14px;border-radius:10px;background:#1b2a1f;color:#8ef0a6;margin-bottom:6px}
  .status.ev{background:#2a1b33;color:#f0b6ff}
  .warn{background:#3a1515;color:#ff9b9b;border-radius:10px;padding:10px 12px;font-size:14px;margin:8px 0}
  .evrow{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border:1px solid #2c2c3c;border-radius:10px;margin:8px 0}
  .evrow b{font-size:15px}.evrow small{color:#999;display:block;margin-top:2px}
  .evrow.on{border-color:#c084fc}
  .chip{display:inline-block;font-size:11px;padding:2px 8px;border-radius:99px;background:#6d28d9;margin-left:6px;vertical-align:middle}
  .modes .mrow{display:flex;align-items:center;gap:8px;margin:6px 0}
  .modes .mrow span{flex:1}
  .fgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:10px;margin:8px 0 14px}
  .ft{border:2px solid #2c2c3c;border-radius:10px;padding:6px;font-size:12px;text-align:center;background:#15151f}
  .ft.sel{border-color:#c084fc;background:#22182e}
  .ft img{width:100%;height:120px;object-fit:contain;background:#0e0e16;border-radius:6px;display:block}
  .ft .nm{margin:5px 0 3px;min-height:30px}
  .ft .ctl{display:flex;justify-content:space-around;align-items:center;font-size:11px}
  .ft .ctl label{margin:0;gap:3px;font-size:11px}
  .ft .tag{color:#f0b6ff;font-size:10px}
  .prev{display:flex;gap:10px;flex-wrap:wrap}
  .prev figure{margin:0;text-align:center;font-size:12px}
  .prev img{height:150px;border-radius:8px;background:#0e0e16}
  .confirm{background:#2a1520;border:1px solid #b4233c;border-radius:10px;padding:10px;margin:6px 0;font-size:14px}
  #pinbox{max-width:360px;margin:40px auto;text-align:center}
  #pinbox input{width:100%;text-align:center;font-size:20px}
</style></head><body><div class="wrap">
<h1>⚙️ Young Booth — Webadmin</h1>
<div id="app"><form id="pinbox"><p>Nhập PIN quản trị</p><input type="password" id="pin" inputmode="numeric" autocomplete="off" autofocus><button type="submit">Vào</button><p class="msg" id="pinmsg"></p></form></div>
<script>
let PIN='', S=null, CAT={frames:[],modes:[],template:null}, EDIT=null, DEL=null;
const $=(id)=>document.getElementById(id);
const esc=(v)=>String(v==null?'':v).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const img=(u)=>u?u+'&pin='+encodeURIComponent(PIN):'';
const clone=(o)=>JSON.parse(JSON.stringify(o));
$('pinbox').addEventListener('submit',async(e)=>{e.preventDefault();PIN=$('pin').value;const r=await fetch('/admin/data?pin='+encodeURIComponent(PIN));
  if(!r.ok){$('pinmsg').textContent='❌ '+((await r.json().catch(()=>({}))).error||'Sai PIN');return;}
  S=await r.json();
  try{const f=await fetch('/admin/frames?pin='+encodeURIComponent(PIN));if(f.ok)CAT=await f.json();}catch(_e){}
  render();});

// ---------- hồ sơ sự kiện ----------
const modeName=(id)=>(CAT.modes.find((m)=>m.id===id)||{}).name||id;
const photoModes=()=>CAT.modes.filter((m)=>m.kind==='photo');
const framesOf=(mode)=>CAT.frames.filter((f)=>f.mode===mode);
const frameById=(id)=>CAT.frames.find((f)=>f.id===id);
function slug(s){return String(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'su-kien';}
function uniqueId(base){let id=base,n=2;while((S.events||[]).some((e)=>e.id===id))id=base+'-'+(n++);return id;}
function runningState(){
  const em=S.eventMode||{};const ev=(S.events||[]).find((e)=>e.id===em.activeEventId);
  if(!em.enabled) return {text:'ĐANG CHẠY: Luồng thường',ev:false};
  if(!ev) return {text:'ĐANG CHẠY: Luồng thường',ev:false,warn:'Đã bật luồng sự kiện nhưng chưa chọn sự kiện hợp lệ → booth đang chạy luồng thường.'};
  const okModes=(ev.modes||[]).filter((m)=>CAT.modes.some((x)=>x.id===m));
  if(!okModes.length) return {text:'ĐANG CHẠY: Luồng thường',ev:false,warn:'Sự kiện "'+ev.name+'" chưa chọn kiểu chụp nào → booth đang chạy luồng thường.'};
  const sc=ev.schedule||{},now=Date.now();
  if((sc.startAt&&now<Date.parse(sc.startAt))||(sc.endAt&&now>Date.parse(sc.endAt))) return {text:'ĐANG CHẠY: Luồng thường',ev:false,warn:'Sự kiện "'+ev.name+'" đang ngoài lịch chạy ('+(sc.startAt||'…')+' → '+(sc.endAt||'…')+') → luồng thường.'};
  return {text:'ĐANG CHẠY: Sự kiện '+ev.name,ev:true};
}
function renderEvents(){
  const st=runningState(), em=S.eventMode||{enabled:false,activeEventId:''};
  const opts=(S.events||[]).map((e)=>'<option value="'+esc(e.id)+'" '+(e.id===em.activeEventId?'selected':'')+'>'+esc(e.name)+'</option>').join('');
  let h='<fieldset><legend>Luồng sự kiện</legend>'+
    '<div class="status '+(st.ev?'ev':'')+'">'+esc(st.text)+'</div>'+(st.warn?'<div class="warn">⚠️ '+esc(st.warn)+'</div>':'')+
    '<label>Bật luồng sự kiện <input type="checkbox" id="ev_on" '+(em.enabled?'checked':'')+'></label>'+
    '<label>Sự kiện chạy <select id="ev_active"><option value="">— chọn sự kiện —</option>'+opts+'</select></label>'+
    '<p class="hint">Bật: booth CHỈ chạy giao diện + khung của sự kiện đã chọn. Đang có khách chụp thì đổi sau khi lượt đó xong. Nhớ bấm 💾 Lưu.</p>'+
    '<h3>Danh sách sự kiện</h3>';
  (S.events||[]).forEach((e,i)=>{
    const on=em.enabled&&em.activeEventId===e.id;
    h+='<div class="evrow '+(on?'on':'')+'"><div><b>'+esc(e.name)+'</b>'+(on?'<span class="chip">đang chạy</span>':'')+
      '<small>'+esc(e.id)+' · '+(e.modes||[]).map(modeName).map(esc).join(', ')+' · '+(e.payment&&e.payment.enabled?'có thanh toán':'miễn phí')+'</small></div>'+
      '<div><button class="sm" onclick="editEv('+i+')">Sửa</button><button class="sm ghost" onclick="dupEv('+i+')">Nhân bản</button>'+
      '<button class="sm danger" onclick="askDel('+i+')">Xoá</button></div></div>';
    if(DEL===i) h+='<div class="confirm">'+(on?'Không xoá được sự kiện đang chạy. Tắt luồng sự kiện hoặc chọn sự kiện khác trước.':
      'Xoá sự kiện "'+esc(e.name)+'"? <button class="sm danger" onclick="delEv('+i+')">Xoá hẳn</button><button class="sm ghost" onclick="DEL=null;render()">Huỷ</button>')+'</div>';
  });
  h+='<button class="ghost" onclick="newEv()">＋ Thêm sự kiện mới</button>';
  if(EDIT) h+=renderEditor();
  return h+'</fieldset>';
}
function readTop(){ if(!$('ev_on'))return; S.eventMode={enabled:$('ev_on').checked,activeEventId:$('ev_active').value}; }
function newEv(){readTop();const t=clone(CAT.template||{});t.id=uniqueId('su-kien-moi');t.name='Sự kiện mới';t.home.title='Sự kiện mới';t.gallery.folder='young-booth/events/'+t.id;
  EDIT={idx:-1,isNew:true,ev:t};render();}
function editEv(i){readTop();EDIT={idx:i,isNew:false,ev:clone(S.events[i])};DEL=null;render();}
function dupEv(i){readTop();const e=clone(S.events[i]);e.id=uniqueId(e.id+'-ban-sao');e.name=e.name+' (bản sao)';e.gallery=Object.assign({},e.gallery,{folder:'young-booth/events/'+e.id});e.createdAt='';
  EDIT={idx:-1,isNew:true,ev:e};render();}
function askDel(i){readTop();DEL=i;render();}
function delEv(i){S.events.splice(i,1);DEL=null;EDIT=null;render();$('msg').textContent='Đã xoá khỏi danh sách — bấm 💾 Lưu để ghi lại.';}

function renderEditor(){
  const e=EDIT.ev,t=e.theme||{},hm=e.home||{},pm=photoModes();
  const order=(e.modes||[]).concat(pm.map((m)=>m.id).filter((id)=>!(e.modes||[]).includes(id)));
  let h='<h3>'+(EDIT.isNew?'Thêm sự kiện':'Sửa sự kiện: '+esc(e.name))+'</h3>'+
    '<label>Tên sự kiện <input id="e_name" value="'+esc(e.name)+'" oninput="'+(EDIT.isNew?'onNameInput(this.value)':'')+'"></label>'+
    '<label>Mã (id) <input id="e_id" value="'+esc(e.id)+'" '+(EDIT.isNew?'':'disabled')+'></label>'+
    (EDIT.isNew?'<p class="hint">Mã tự sinh từ tên (chữ thường không dấu, số, dấu -). Sau khi tạo không đổi được.</p>':'')+
    '<h3>Giao diện</h3>'+
    '<label>Màu nền <input type="color" id="t_bg" value="'+esc(t.background||'#f4eefb')+'"></label>'+
    '<label>Màu nút chính <input type="color" id="t_accent" value="'+esc(t.accent||'#8d6ccf')+'"></label>'+
    '<label>Màu chữ <input type="color" id="t_text" value="'+esc(t.textColor||'#2e2240')+'"></label>'+
    '<label>Ảnh nền (tuỳ chọn) <input id="t_img" value="'+esc(t.backgroundImage)+'" placeholder="file:///C:/YoungBooth-Frames/events/…/home.jpg"></label>'+
    '<label>Logo sự kiện (tuỳ chọn) <input id="t_logo" value="'+esc(t.logo)+'" placeholder="file:///C:/YoungBooth-Frames/events/…/logo.png"></label>'+
    '<label>Font tiêu đề <select id="t_font">'+['','Be Vietnam Pro','YB Script','YB Serif','Dancing Script','Oswald','Baloo 2','Noto Serif'].map((f)=>'<option '+(f===(t.font||'')?'selected':'')+' value="'+esc(f)+'">'+(f||'(mặc định)')+'</option>').join('')+'</select></label>'+
    '<h3>Màn chờ</h3>'+
    '<label>Chữ lớn <input id="h_title" value="'+esc(hm.title)+'"></label>'+
    '<label>Dòng phụ <input id="h_sub" value="'+esc(hm.subtitle)+'"></label>'+
    '<label>Lời chào <input id="h_welcome" value="'+esc(hm.welcome)+'"></label>'+
    '<label>Chữ trên nút <input id="h_btn" value="'+esc(hm.buttonLabel)+'"></label>'+
    '<label>Hiện "Powered by YOUNG BOOTH" <input type="checkbox" id="h_brand" '+(hm.showYoungBoothBrand!==false?'checked':'')+'></label>'+
    '<h3>Kiểu chụp & khung</h3><p class="hint">Tick kiểu chụp được phép (↑↓ đổi thứ tự). Chỉ 1 kiểu (và tắt GIF/Boomerang) → khách bấm nút là vào chụp luôn. Mỗi kiểu: tick khung khách được chọn, chọn 1 khung mặc định.</p><div class="modes">';
  order.forEach((id,k)=>{const on=(e.modes||[]).includes(id);
    h+='<div class="mrow"><input type="checkbox" id="m_'+id+'" '+(on?'checked':'')+' onchange="syncEditor();render()"><span>'+esc(modeName(id))+' ('+id+')</span>'+
      '<button class="sm ghost" onclick="mv(\\''+id+'\\',-1)">↑</button><button class="sm ghost" onclick="mv(\\''+id+'\\',1)">↓</button></div>';
    if(on){const sel=(e.frames&&e.frames[id])||[];const def=(e.defaultFrame&&e.defaultFrame[id])||sel[0]||'';
      h+='<div class="fgrid">'+framesOf(id).map((f)=>{const s=sel.includes(f.id);
        return '<div class="ft '+(s?'sel':'')+'"><img src="'+esc(img(f.thumbUrl))+'" alt="" onerror="this.style.visibility=\\'hidden\\'"><div class="nm">'+esc(f.name)+
          (f.lib==='event'?'<div class="tag">khung sự kiện</div>':f.holiday?'<div class="tag">dịp lễ</div>':f.lib==='default'?'<div class="tag">mặc định của kiểu</div>':'')+'</div>'+
          '<div class="ctl"><label><input type="checkbox" class="fsel" data-mode="'+id+'" value="'+esc(f.id)+'" '+(s?'checked':'')+' onchange="syncEditor();render()">chọn</label>'+
          '<label><input type="radio" name="def_'+id+'" value="'+esc(f.id)+'" '+(s&&f.id===def?'checked':'')+' '+(s?'':'disabled')+' onchange="syncEditor()">mặc định</label></div></div>';}).join('')+'</div>';
      if(!sel.length) h+='<p class="hint">⚠️ Chưa chọn khung → dùng khung mặc định của kiểu '+esc(modeName(id))+'.</p>';}
  });
  h+='</div><label>Cho chụp GIF / Boomerang <input type="checkbox" id="e_anim" '+(e.allowAnimated!==false?'checked':'')+'></label>';
  // chữ động: các ô chữ của khung đã chọn
  const fields={};(e.modes||[]).forEach((m)=>((e.frames&&e.frames[m])||[]).forEach((fid)=>{const f=frameById(fid);(f&&f.texts||[]).forEach((t)=>{if(!fields[t.id])fields[t.id]=t;});}));
  const keys=Object.keys(fields);
  h+='<h3>Chữ trên khung</h3>'+(keys.length?'<p class="hint">Để trống = dùng chữ mặc định của khung (hiện mờ).</p>':'<p class="hint">Khung đã chọn không có ô chữ nào.</p>')+
    keys.map((k)=>'<label>'+esc(fields[k].label)+' <input class="etext" data-k="'+esc(k)+'" value="'+esc((e.texts||{})[k]||'')+'" placeholder="'+esc(fields[k].value)+'"></label>').join('');
  const pr=e.print||{},ga=e.gallery||{},sc=e.schedule||{};
  h+='<h3>Thanh toán, in, gallery</h3>'+
    '<label>Bắt thanh toán <input type="checkbox" id="e_pay" '+(e.payment&&e.payment.enabled?'checked':'')+'></label><p class="hint">Mặc định tắt (ban tổ chức trả). Bật → dùng giá + VietQR/SePay ở mục Thanh toán bên dưới.</p>'+
    '<label>Số bản mỗi lần in <input type="number" min="1" max="10" id="p_copies" value="'+esc(pr.copies||1)+'"></label>'+
    '<label>Số lần bấm In tối đa mỗi lượt (0 = không giới hạn) <input type="number" min="0" id="p_max" value="'+esc(pr.maxPrintsPerSession!=null?pr.maxPrintsPerSession:2)+'"></label>'+
    '<label>Thư mục Cloudinary <input id="g_folder" value="'+esc(ga.folder)+'"></label>'+
    '<label>Đăng lên gallery chung <input type="checkbox" id="g_public" '+(ga.public?'checked':'')+'></label>'+
    '<h3>Lịch chạy (tuỳ chọn)</h3><p class="hint">Ngoài khung giờ → booth tự chạy luồng thường. Để trống = không giới hạn.</p>'+
    '<label>Bắt đầu <input type="datetime-local" id="s_start" value="'+esc((sc.startAt||'').slice(0,16))+'"></label>'+
    '<label>Kết thúc <input type="datetime-local" id="s_end" value="'+esc((sc.endAt||'').slice(0,16))+'"></label>';
  // xem trước khung mặc định từng kiểu
  h+='<h3>Xem trước khung mặc định</h3><div class="prev">'+(e.modes||[]).map((m)=>{const sel=(e.frames&&e.frames[m])||[];const f=frameById((e.defaultFrame&&e.defaultFrame[m])||sel[0])||framesOf(m).find((x)=>x.lib==='default');
    return f?'<figure><img src="'+esc(img(f.thumbUrl))+'" alt=""><figcaption>'+esc(modeName(m))+'<br>'+esc(f.name)+'</figcaption></figure>':'';}).join('')+'</div>'+
    '<button onclick="applyEv()">✔ Xong sửa sự kiện (rồi bấm 💾 Lưu)</button><button class="ghost" onclick="EDIT=null;render()">Huỷ sửa</button>';
  return h;
}
// Sự kiện mới: gõ tên → mã, chữ lớn màn chờ, thư mục Cloudinary đổi theo (nếu chưa sửa tay).
function onNameInput(v){const oldId=$('e_id').value,oldName=EDIT.ev.name;const id=slug(v);$('e_id').value=id;
  if(!$('h_title').value||$('h_title').value===oldName||$('h_title').value==='Sự kiện mới')$('h_title').value=v;
  if(!$('g_folder').value||$('g_folder').value==='young-booth/events/'+oldId)$('g_folder').value='young-booth/events/'+id;
  EDIT.ev.name=v;}
function mv(id,d){syncEditor();const e=EDIT.ev;const pm=photoModes().map((m)=>m.id);const order=(e.modes||[]).concat(pm.filter((x)=>!(e.modes||[]).includes(x)));
  const i=order.indexOf(id),j=i+d;if(j<0||j>=order.length)return;[order[i],order[j]]=[order[j],order[i]];e.modes=order.filter((x)=>(e.modes||[]).includes(x));render();}
function syncEditor(){
  if(!EDIT||!$('e_name'))return;const e=EDIT.ev,v=(id)=>$(id).value;
  e.name=v('e_name').trim();if(EDIT.isNew)e.id=v('e_id').trim();
  e.theme=Object.assign({},e.theme,{background:v('t_bg'),accent:v('t_accent'),textColor:v('t_text'),backgroundImage:v('t_img').trim(),logo:v('t_logo').trim(),font:v('t_font')});
  e.home=Object.assign({},e.home,{title:v('h_title'),subtitle:v('h_sub'),welcome:v('h_welcome'),buttonLabel:v('h_btn'),showYoungBoothBrand:$('h_brand').checked});
  const pm=photoModes().map((m)=>m.id);const prev=e.modes||[];const order=prev.concat(pm.filter((x)=>!prev.includes(x)));
  e.modes=order.filter((id)=>$('m_'+id)&&$('m_'+id).checked);
  e.frames={};e.defaultFrame={};
  document.querySelectorAll('.fsel').forEach((c)=>{if(c.checked&&e.modes.includes(c.dataset.mode))(e.frames[c.dataset.mode]=e.frames[c.dataset.mode]||[]).push(c.value);});
  e.modes.forEach((m)=>{const r=document.querySelector('input[name="def_'+m+'"]:checked');const sel=e.frames[m]||[];e.defaultFrame[m]=(r&&sel.includes(r.value))?r.value:(sel[0]||'');});
  if($('e_anim'))e.allowAnimated=$('e_anim').checked;
  if($('e_pay')){e.texts={};document.querySelectorAll('.etext').forEach((i)=>{if(i.value.trim())e.texts[i.dataset.k]=i.value;});
    e.payment={enabled:$('e_pay').checked};e.print={copies:Math.max(1,Number(v('p_copies')||1)),maxPrintsPerSession:Math.max(0,Number(v('p_max')||0))};
    e.gallery={folder:v('g_folder').trim()||('young-booth/events/'+e.id),public:$('g_public').checked};
    e.schedule={startAt:v('s_start'),endAt:v('s_end')};}
}
function applyEv(){syncEditor();const e=EDIT.ev;
  if(!e.name){$('msg').textContent='❌ Sự kiện cần có tên.';return;}
  if(!/^[a-z0-9-]+$/.test(e.id)){$('msg').textContent='❌ Mã sự kiện chỉ gồm chữ thường không dấu, số, dấu -.';return;}
  if(S.events.some((x,i)=>x.id===e.id&&i!==EDIT.idx)){$('msg').textContent='❌ Trùng mã sự kiện '+e.id;return;}
  if(EDIT.idx>=0)S.events[EDIT.idx]=e;else S.events.push(e);
  EDIT=null;render();$('msg').textContent='Đã cập nhật danh sách — bấm 💾 Lưu để ghi lại và áp dụng cho booth.';}

// ---------- thanh toán & giá (như cũ) ----------
function renderPay(){
  const p=S.payment,num=(v)=>v==null?'':v;
  return \`<fieldset><legend>Thanh toán (luồng thường)</legend>
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
    <label>Mã ngân hàng <input id="bankCode" value="\${esc(p.bank.bankCode||'')}" placeholder="vd VCB, MB, TCB"></label>
    <label>Số tài khoản <input id="accountNumber" value="\${esc(p.bank.accountNumber||'')}"></label>
    <label>Tên tài khoản <input id="accountName" value="\${esc(p.bank.accountName||'')}"></label>
    <p class="hint">Điền để tạo mã QR chuyển khoản cho khách quét.</p>
  </fieldset>
  <fieldset><legend>SePay (tự xác nhận — tuỳ chọn)</legend>
    <label>API Token <input id="sepayToken" type="password" value="" placeholder="\${(p.sepay&&p.sepay.hasToken)?'(đã lưu — để trống = giữ nguyên)':''}"></label>
    <label>STK theo dõi <input id="sepayAcc" value="\${esc((p.sepay&&p.sepay.accountNumber)||'')}"></label>
    <p class="hint">Có token thì app tự phát hiện khách đã chuyển khoản.</p>
  </fieldset>
  <fieldset><legend>Bảo mật</legend>
    <label>Đổi PIN quản trị <input id="adminPin" value="\${esc(S.adminPin||'')}"></label>
    <p class="hint">\${S.adminPin==='1234'?'⚠️ Đang dùng PIN mặc định 1234 — hãy đổi để vào được webadmin từ điện thoại.':''}</p>
  </fieldset>\`;
}
function render(){
  $('app').innerHTML=renderEvents()+renderPay()+'<button onclick="save()">💾 Lưu cài đặt</button><div class="msg" id="msg"></div>';
  $('ev_on').addEventListener('change',()=>{readTop();render();});
  $('ev_active').addEventListener('change',()=>{readTop();render();});
}
async function save(){
  if(EDIT){syncEditor();$('msg').textContent='❌ Đang sửa sự kiện — bấm "✔ Xong sửa sự kiện" hoặc "Huỷ sửa" trước khi lưu.';return;}
  readTop();
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
    },
    eventMode:S.eventMode,
    events:S.events,
  };
  const r=await fetch('/admin/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:PIN,settings})});
  const j=await r.json().catch(()=>({}));
  if(r.ok){PIN=settings.adminPin||PIN;S=j.settings;render();$('msg').textContent='✅ Đã lưu. Booth áp dụng ngay (nếu đang có khách chụp thì sau khi lượt đó xong).';}
  else $('msg').textContent='❌ '+(j.error||'Lỗi');
}
</script>
</div></body></html>`;
}

module.exports = { adminPageHtml };
