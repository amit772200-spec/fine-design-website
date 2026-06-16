'use strict';
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BASE = 'C:\\Users\\amit7\\OneDrive\\שולחן העבודה\\הזמנות לאירועים כללי';
const OUT  = path.resolve(__dirname, '..', 'images', 'gallery');

const CATEGORIES = [
  { folder: 'הזמנה לברית בריתה',      slug: 'brit-milah' },
  { folder: 'הזמנות SAVE THE DATE',    slug: 'save-the-date' },
  { folder: 'הזמנות לבר או בת מצווה', slug: 'bar-bat-mitzvah' },
  { folder: 'הזמנות להפרשת חלה',       slug: 'challah' },
  { folder: 'הזמנות לחינה',            slug: 'henna' },
];

async function processCategory(folder, slug) {
  const src = path.join(BASE, folder);
  const dst = path.join(OUT, slug);
  fs.mkdirSync(dst, { recursive: true });

  const files = fs.readdirSync(src)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort();

  // Deduplicate by base name — if both 001.jpg and 001.png exist, keep first (jpg sorts before png)
  const seen = new Set();
  const unique = files.filter(f => {
    const base = path.basename(f, path.extname(f)).toLowerCase();
    if (seen.has(base)) return false;
    seen.add(base);
    return true;
  });

  console.log(slug + ': ' + unique.length + ' images');
  let i = 1;
  for (const file of unique) {
    const srcPath = path.join(src, file);
    const outName = String(i).padStart(3, '0') + '.jpg';
    const dstPath = path.join(dst, outName);
    try {
      await sharp(srcPath)
        .resize(1200, 1600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82, progressive: true })
        .toFile(dstPath);
      process.stdout.write('.');
      i++;
    } catch (e) {
      console.log('\n  SKIP ' + file + ': ' + e.message);
    }
  }
  console.log(' (' + (i - 1) + ' saved)\n');
}

(async () => {
  for (const cat of CATEGORIES) {
    await processCategory(cat.folder, cat.slug);
  }
  console.log('All done!');
})();
