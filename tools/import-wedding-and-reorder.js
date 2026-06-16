'use strict';
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BASE = 'C:\\Users\\amit7\\OneDrive\\שולחן העבודה\\הזמנות לאירועים כללי';
const root = path.resolve(__dirname, '..');

// ---- 1. Import wedding invitation 001 ----
async function importWedding() {
  const src = path.join(BASE, 'הזמנות לחתונה', '001.jpg');
  const dst = path.join(root, 'images', 'gallery', 'weddings');
  fs.mkdirSync(dst, { recursive: true });
  const dstFile = path.join(dst, '001.jpg');
  await sharp(src)
    .resize(1200, 1600, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, progressive: true })
    .toFile(dstFile);
  console.log('Imported: weddings/001.jpg');
}

// ---- 2. Reorder henna items + add wedding item ----
function updateGallery() {
  const galleryPath = path.join(root, 'data', 'gallery.json');
  const gallery = JSON.parse(fs.readFileSync(galleryPath, 'utf8'));

  // Henna items with text (from screenshot analysis)
  // These image numbers have visible guest names/text in the invitation
  const hennaWithText = new Set([2, 3, 5, 6, 13, 14, 16, 17, 18]);

  const hennaItems = gallery.filter(i => i.category === 'henna');
  const otherItems = gallery.filter(i => i.category !== 'henna');

  // Split henna into text-first, blank-second (preserving relative order within each group)
  const hennaText  = hennaItems.filter(i => {
    const num = parseInt(path.basename(i.imagePath, '.jpg').replace(/\D/g, ''), 10);
    return hennaWithText.has(num);
  });
  const hennaBlank = hennaItems.filter(i => {
    const num = parseInt(path.basename(i.imagePath, '.jpg').replace(/\D/g, ''), 10);
    return !hennaWithText.has(num);
  });
  const reorderedHenna = [...hennaText, ...hennaBlank];

  // Build new gallery: non-henna items + reordered henna + new wedding item
  // Insert wedding item right after the non-henna items that are before henna
  // Actually just append it at the start with category 'weddings'
  const weddingItem = {
    id: 'static-0085',
    category: 'weddings',
    price: 97,
    imagePath: 'images/gallery/weddings/001.jpg',
  };

  // Rebuild: keep all non-henna items in original position, replace henna block with reordered
  const beforeHenna = [];
  const afterHenna  = [];
  let hennaStarted = false;
  let hennaEnded   = false;
  for (const item of otherItems) {
    if (!hennaStarted && item.category !== 'henna') beforeHenna.push(item);
    else afterHenna.push(item);
  }
  // Actually otherItems has no henna, so just: prepend wedding, then bar-bat-mitzvah/brit-milah, then henna reordered, then save-the-date
  // Let's just rebuild in a sensible order:
  const nonHenna = gallery.filter(i => i.category !== 'henna');
  const final = [...nonHenna, weddingItem, ...reorderedHenna];

  fs.writeFileSync(galleryPath, JSON.stringify(final, null, 2) + '\n', 'utf8');
  console.log('gallery.json updated:', final.length, 'items');
  console.log('  Henna: text-first =', hennaText.length, ', blanks =', hennaBlank.length);
}

(async () => {
  await importWedding();
  updateGallery();
  console.log('Done!');
})();
