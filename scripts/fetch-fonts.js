#!/usr/bin/env node
/**
 * Tải font (Google Fonts, giấy phép OFL) về renderer/fonts/ để app chạy OFFLINE và dựng lại fonts.css.
 * Chỉ lấy subset vietnamese + latin + latin-ext. Chạy lại khi cần thêm font:  node scripts/fetch-fonts.js
 *
 * Tên gọi chung dùng trong khung (config.js → texts[].ff):
 *   "YB Script" = Great Vibes (chữ viết tay)      "YB Serif" = Cormorant Garamond (serif thanh lịch)
 */
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '..', 'renderer', 'fonts');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const FAMILIES = [
  'Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700;1,800',  // UI + sans đậm / đậm nghiêng
  'Dancing+Script:wght@400;600;700',                                       // script
  'Great+Vibes',                                                           // script (YB Script)
  'Cormorant+Garamond:wght@400;500;600;700',                               // serif (YB Serif)
  'Oswald:wght@400;500;600;700',                                           // condensed
  'Baloo+2:wght@400;600;700;800',                                          // tròn vui
  'Noto+Serif:wght@400;700',                                               // serif đậm
  'Patrick+Hand',                                                          // chữ tay in rời (khung Polaroid)
];
const ALIASES = { 'Great Vibes': 'YB Script', 'Cormorant Garamond': 'YB Serif' };
const KEEP = ['vietnamese', 'latin', 'latin-ext'];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  let css = '/* Font đóng gói sẵn (Google Fonts, OFL) — sinh bởi scripts/fetch-fonts.js, subset vietnamese/latin/latin-ext */\n';
  let n = 0;
  for (const fam of FAMILIES) {
    const text = await (await fetch(`https://fonts.googleapis.com/css2?family=${fam}&display=swap`, { headers: { 'User-Agent': UA } })).text();
    for (const block of text.split('/* ').slice(1)) {
      const subset = block.split(' */')[0].trim();
      if (!KEEP.includes(subset)) continue;
      const face = block.slice(block.indexOf('@font-face')).trim();
      const family = /font-family: '([^']+)'/.exec(face)[1];
      const style = /font-style: (\w+)/.exec(face)[1];
      const weight = /font-weight: ([\d ]+)/.exec(face)[1].trim().replace(' ', '-');
      const url = /url\((https:[^)]+)\)/.exec(face)[1];
      const file = `${family.replace(/ /g, '')}-${weight}${style === 'italic' ? 'i' : ''}-${subset}.woff2`;
      if (!fs.existsSync(path.join(OUT, file))) {
        fs.writeFileSync(path.join(OUT, file), Buffer.from(await (await fetch(url)).arrayBuffer()));
      }
      const local = face.replace(url, file);
      css += local + '\n';
      if (ALIASES[family]) css += local.replace(`'${family}'`, `'${ALIASES[family]}'`) + '\n';
      n++;
    }
  }
  fs.writeFileSync(path.join(OUT, 'fonts.css'), css);
  console.log('ok:', n, 'font-face →', OUT);
})().catch((e) => { console.error(e); process.exit(1); });
