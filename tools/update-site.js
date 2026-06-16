'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function getAllHtmlFiles() {
  const files = [
    path.join(root, 'index.html'),
    path.join(root, 'admin.html'),
  ];
  const pagesDir = path.join(root, 'pages');
  fs.readdirSync(pagesDir)
    .filter(f => f.endsWith('.html'))
    .forEach(f => files.push(path.join(pagesDir, f)));
  return files;
}

function processNav(content, isRoot) {
  const p = isRoot ? 'pages/' : '';

  // Desktop nav — rename henna (with or without active class)
  content = content.replace(
    new RegExp(`(<li><a href="${p}henna\\.html"[^>]*>)חינה(</a></li>)`, 'g'),
    '$1חינה/מימונה$2'
  );
  // Desktop nav — remove birthdays, menus, mimouna
  content = content.replace(new RegExp(`[ \\t]*<li><a href="${p}birthdays\\.html">ימי הולדת</a></li>\\r?\\n`, 'g'), '');
  content = content.replace(new RegExp(`[ \\t]*<li><a href="${p}menus\\.html">תפריטים</a></li>\\r?\\n`, 'g'), '');
  content = content.replace(new RegExp(`[ \\t]*<li><a href="${p}mimouna\\.html">מימונה</a></li>\\r?\\n`, 'g'), '');

  // Mobile menu — rename henna text
  content = content.replace(
    new RegExp(`( הזמנות לחינה)(</a></li>)`, 'g'),
    '$1 ומימונה$2'
  );
  // Mobile menu — remove birthdays, menus, mimouna items
  content = content.replace(
    new RegExp(`[ \\t]*<li><a href="${p}birthdays\\.html"[^>]*>.*?</a></li>\\r?\\n`, 'g'),
    ''
  );
  content = content.replace(
    new RegExp(`[ \\t]*<li><a href="${p}menus\\.html"[^>]*>.*?</a></li>\\r?\\n`, 'g'),
    ''
  );
  content = content.replace(
    new RegExp(`[ \\t]*<li><a href="${p}mimouna\\.html"[^>]*>.*?</a></li>\\r?\\n`, 'g'),
    ''
  );
  // Mobile menu — renumber: 06→05, 07→06, 10→07
  content = content.replace(/(<span class="menu-number" aria-hidden="true">)06(<\/span>)/g, '$105$2');
  content = content.replace(/(<span class="menu-number" aria-hidden="true">)07(<\/span>)/g, '$106$2');
  content = content.replace(/(<span class="menu-number" aria-hidden="true">)10(<\/span>)/g, '$107$2');

  // Footer nav — rename henna link text (any text)
  content = content.replace(
    new RegExp(`(<li><a href="${p}henna\\.html">)[^<]+(</a></li>)`, 'g'),
    '$1חינה/מימונה$2'
  );
  // Footer nav — remove birthdays, menus, mimouna
  content = content.replace(new RegExp(`[ \\t]*<li><a href="${p}birthdays\\.html">[^<]+</a></li>\\r?\\n`, 'g'), '');
  content = content.replace(new RegExp(`[ \\t]*<li><a href="${p}menus\\.html">[^<]+</a></li>\\r?\\n`, 'g'), '');
  content = content.replace(new RegExp(`[ \\t]*<li><a href="${p}mimouna\\.html">[^<]+</a></li>\\r?\\n`, 'g'), '');

  return content;
}

function removeEyebrows(content) {
  return content.replace(/[ \t]*<span class="eyebrow"[^>]*>[^<]*<\/span>\r?\n/g, '');
}

// ---- Process all HTML files ----
const files = getAllHtmlFiles();
let updated = 0;
for (const filePath of files) {
  const isRoot = path.dirname(filePath) === root;
  const basename = path.basename(filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  content = processNav(content, isRoot);

  // Remove eyebrows from category pages (not privacy, terms, admin, index)
  const isCategory = filePath.includes(path.sep + 'pages' + path.sep) &&
    !['privacy.html', 'terms.html', 'product.html'].includes(basename);
  if (isCategory) {
    content = removeEyebrows(content);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated: ' + path.relative(root, filePath));
    updated++;
  }
}

// ---- henna.html: update page heading + breadcrumb ----
const hennaPath = path.join(root, 'pages', 'henna.html');
let henna = fs.readFileSync(hennaPath, 'utf8');
henna = henna.replace(
  '<h1 id="page-heading">הזמנות לחינה</h1>',
  '<h1 id="page-heading">הזמנות לחינה ומימונה</h1>'
);
henna = henna.replace(
  '<li aria-current="page">הזמנות לחינה</li>',
  '<li aria-current="page">הזמנות לחינה ומימונה</li>'
);
fs.writeFileSync(hennaPath, henna, 'utf8');
console.log('Updated henna.html headings');

// ---- index.html: marquee + categories grid ----
const indexPath = path.join(root, 'index.html');
let index = fs.readFileSync(indexPath, 'utf8');

// Marquee: remove ימי הולדת, תפריטים; rename מימונה; rename חינה
index = index.replace(/[ \t]*<span class="marquee-item">ימי הולדת<\/span>\r?\n/g, '');
index = index.replace(/[ \t]*<span class="marquee-item">תפריטים<\/span>\r?\n/g, '');
index = index.replace(/<span class="marquee-item">מימונה<\/span>/g, '');
index = index.replace(/<span class="marquee-item">חינה<\/span>/, '<span class="marquee-item">חינה/מימונה</span>');

// Categories grid: rename henna card; remove mimouna card
index = index.replace(
  '<h3 class="category-card-title">הזמנות לחינה</h3>',
  '<h3 class="category-card-title">הזמנות לחינה ומימונה</h3>'
);
index = index.replace(
  /[ \t]*<a href="pages\/mimouna\.html" class="category-card category-card--mimouna">[\s\S]*?<\/a>\r?\n/,
  ''
);

// Hero cards: replace fake text cards with real invitation images
const newHeroStack = `          <div class="hero-stack" aria-hidden="true">
            <div class="hero-card hero-card--1">
              <img src="images/gallery/henna/001.jpg" alt="הזמנה לחינה" class="hero-card-img">
            </div>
            <div class="hero-card hero-card--2">
              <img src="images/gallery/bar-bat-mitzvah/001.jpg" alt="הזמנה לבר מצווה" class="hero-card-img">
            </div>
            <div class="hero-card hero-card--3">
              <img src="images/gallery/brit-milah/001.jpg" alt="הזמנה לברית" class="hero-card-img">
            </div>
          </div>`;

index = index.replace(
  /          <div class="hero-stack" aria-hidden="true">[\s\S]*?<\/div>\n          <\/div>/,
  newHeroStack + '\n\n        </div>'
);

fs.writeFileSync(indexPath, index, 'utf8');
console.log('Updated index.html (marquee + categories grid + hero cards)');

// ---- gallery.json: challah prices → 97 ----
const galleryPath = path.join(root, 'data', 'gallery.json');
const gallery = JSON.parse(fs.readFileSync(galleryPath, 'utf8'));
let priceChanged = 0;
for (const item of gallery) {
  if (item.category === 'challah') {
    item.price = 97;
    priceChanged++;
  }
}
fs.writeFileSync(galleryPath, JSON.stringify(gallery, null, 2) + '\n', 'utf8');
console.log('Updated ' + priceChanged + ' challah items to price 97');

console.log('\nAll done! ' + updated + ' HTML files updated.');
