#!/usr/bin/env node
/**
 * Xoá ảnh/GIF cũ trên Cloudinary để ở lại free tier lâu.
 * Bản GỐC vẫn nằm trên máy booth (thư mục captures) → không mất ảnh.
 *
 * Cần credentials (KHÔNG lưu vào code) — đặt biến môi trường:
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *
 * Cách chạy (PowerShell):
 *   $env:CLOUDINARY_CLOUD_NAME="youngbooth"
 *   $env:CLOUDINARY_API_KEY="123..."
 *   $env:CLOUDINARY_API_SECRET="abc..."
 *   node scripts/cleanup-cloudinary.js --days 15 --folder young-booth
 *
 *   Thêm --dry để CHỈ liệt kê, chưa xoá.
 */

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const KEY = process.env.CLOUDINARY_API_KEY;
const SECRET = process.env.CLOUDINARY_API_SECRET;

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i === -1) return def;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
}

const DAYS = parseInt(arg('days', '15'), 10);
const FOLDER = arg('folder', 'young-booth');
const DRY = !!arg('dry', false);

if (!CLOUD || !KEY || !SECRET) {
  console.error('Thiếu biến môi trường CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET.');
  process.exit(1);
}

const AUTH = 'Basic ' + Buffer.from(`${KEY}:${SECRET}`).toString('base64');
const BASE = `https://api.cloudinary.com/v1_1/${CLOUD}`;
const cutoff = Date.now() - DAYS * 24 * 60 * 60 * 1000;

async function listAll() {
  const items = [];
  let cursor = null;
  do {
    const url = new URL(`${BASE}/resources/image`);
    url.searchParams.set('type', 'upload');
    url.searchParams.set('prefix', FOLDER + '/');
    url.searchParams.set('max_results', '500');
    if (cursor) url.searchParams.set('next_cursor', cursor);
    const r = await fetch(url, { headers: { Authorization: AUTH } });
    if (!r.ok) throw new Error('List HTTP ' + r.status + ' — ' + (await r.text()));
    const j = await r.json();
    (j.resources || []).forEach((res) => items.push(res));
    cursor = j.next_cursor;
  } while (cursor);
  return items;
}

async function deleteBatch(publicIds) {
  // Cloudinary cho xoá tối đa 100 public_id / lần.
  for (let i = 0; i < publicIds.length; i += 100) {
    const chunk = publicIds.slice(i, i + 100);
    const url = new URL(`${BASE}/resources/image/upload`);
    chunk.forEach((id) => url.searchParams.append('public_ids[]', id));
    const r = await fetch(url, { method: 'DELETE', headers: { Authorization: AUTH } });
    if (!r.ok) throw new Error('Delete HTTP ' + r.status + ' — ' + (await r.text()));
    console.log(`  Đã xoá ${chunk.length} ảnh.`);
  }
}

(async () => {
  console.log(`Quét thư mục "${FOLDER}/" trên cloud "${CLOUD}", xoá ảnh cũ hơn ${DAYS} ngày...`);
  const all = await listAll();
  const old = all.filter((r) => new Date(r.created_at).getTime() < cutoff);
  console.log(`Tổng ${all.length} ảnh, trong đó ${old.length} ảnh quá hạn.`);
  if (!old.length) return console.log('Không có gì để xoá.');
  if (DRY) {
    console.log('(--dry) Danh sách sẽ xoá:');
    old.forEach((r) => console.log('  -', r.public_id, r.created_at));
    return;
  }
  await deleteBatch(old.map((r) => r.public_id));
  console.log('Xong. Bản gốc vẫn còn trong thư mục captures trên máy booth.');
})().catch((e) => { console.error('LỖI:', e.message); process.exit(1); });
