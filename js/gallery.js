'use strict';

/* =========================================================
   GALLERY LOADER
   Merges static images from data/gallery.json with any
   admin-added items from IndexedDB (admin additions override
   static items with the same id).
   ========================================================= */

function buildCard(inv, basePath) {
  const card = document.createElement('article');
  card.className = 'invitation-card';
  card.dataset.id = inv.id;

  const href = inv.id.startsWith('static-')
    ? null
    : basePath + 'pages/product.html?id=' + encodeURIComponent(inv.id);

  const imgWrap = href ? document.createElement('a') : document.createElement('div');
  imgWrap.className = 'invitation-img-wrap';
  if (href) {
    imgWrap.href = href;
    imgWrap.setAttribute('aria-label', 'לפרטים והזמנה');
  }

  const imgSrc = inv.imageData || (inv.imagePath ? basePath + inv.imagePath : null);
  if (imgSrc) {
    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = 'הזמנה ל' + categoryLabel(inv.category);
    img.className = 'invitation-card-img';
    img.loading = 'lazy';
    imgWrap.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'invitation-card-img-placeholder';
    placeholder.textContent = categoryLabel(inv.category);
    imgWrap.appendChild(placeholder);
  }

  const wm = document.createElement('div');
  wm.className = 'wm';
  wm.setAttribute('aria-hidden', 'true');
  imgWrap.appendChild(wm);

  card.appendChild(imgWrap);

  const footer = document.createElement('div');
  footer.className = 'invitation-card-footer';

  const priceTag = document.createElement('span');
  priceTag.className = 'price-tag';
  priceTag.innerHTML = '<span class="price-symbol">&#8362;</span>' + escHtml(inv.price || '0');

  footer.appendChild(priceTag);

  if (href) {
    const orderBtn = document.createElement('a');
    orderBtn.href = href;
    orderBtn.className = 'invitation-order-btn';
    orderBtn.textContent = 'להזמנה';
    footer.appendChild(orderBtn);
  } else {
    const orderBtn = document.createElement('button');
    orderBtn.className = 'invitation-order-btn open-contact-modal';
    orderBtn.textContent = 'להזמנה';
    const imgNum = inv.imagePath ? inv.imagePath.split('/').pop().replace(/\.\w+$/, '') : '';
    orderBtn.dataset.invLabel = categoryLabel(inv.category) + (imgNum ? ' — הזמנה ' + imgNum : '');
    if (inv.imagePath) orderBtn.dataset.invImg = inv.imagePath;
    footer.appendChild(orderBtn);
  }

  card.appendChild(footer);
  return card;
}

function renderInto(container, items, basePath, emptyHTML) {
  container.innerHTML = '';
  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'gallery-empty';
    empty.innerHTML = emptyHTML || 'עוד לא הועלו הזמנות לקטגוריה זו.';
    container.appendChild(empty);
    return;
  }
  items.forEach(inv => container.appendChild(buildCard(inv, basePath)));
}

function getBasePath() {
  return window.location.pathname.includes('/pages/') ? '../' : '';
}

function categoryLabel(cat) {
  const labels = {
    weddings:          'חתונות',
    henna:             'חינה',
    challah:           'הפרשת חלה',
    birthdays:         'ימי הולדת',
    'bar-bat-mitzvah': 'בר / בת מצווה',
    'brit-milah':      'ברית/בריתה',
    mimouna:           'מימונה',
    menus:             'תפריטים לאירועים',
    'save-the-date':   'Save the Date',
  };
  return labels[cat] || cat;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function loadStaticGallery(basePath) {
  try {
    const res = await fetch(basePath + 'data/gallery.json');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const grids = document.querySelectorAll('[data-gallery-category]');
  if (!grids.length) return;
  const basePath = getBasePath();

  const [staticItems, dbItems] = await Promise.all([
    loadStaticGallery(basePath),
    (async () => { try { return await dbLoadAll(); } catch { return []; } })(),
  ]);

  // Merge: DB items override static ones with same id; deleted DB items are hidden
  const dbIds = new Set(dbItems.map(i => i.id));
  const all = [
    ...staticItems.filter(i => !dbIds.has(i.id)),
    ...dbItems.filter(i => !i.deleted),
  ];

  // Apply per-category custom order saved from admin panel
  try {
    if (window.SiteSettings) {
      const settings = await window.SiteSettings.loadAll();
      const categories = ['weddings','henna','challah','bar-bat-mitzvah','brit-milah','save-the-date'];
      categories.forEach(cat => {
        const raw = settings['gallery_order_' + cat];
        if (!raw) return;
        const order = JSON.parse(raw);
        const idIndex = {};
        order.forEach((id, i) => { idIndex[id] = i; });
        /* Sort only the items belonging to this category */
        const catItems = all.filter(i => i.category === cat);
        catItems.sort((a, b) => (idIndex[a.id] ?? order.length) - (idIndex[b.id] ?? order.length));
        /* Write sorted items back in-place */
        let ci = 0;
        for (let i = 0; i < all.length; i++) {
          if (all[i].category === cat) all[i] = catItems[ci++];
        }
      });
    }
  } catch { /* use default order */ }

  grids.forEach(grid => {
    const category = grid.dataset.galleryCategory;
    const limit = parseInt(grid.dataset.galleryLimit || '0', 10);
    let items = category === 'all'
      ? all
      : all.filter(inv => inv.category === category);
    if (limit > 0) items = items.slice(0, limit);

    const empty = grid.dataset.galleryEmpty ||
      'הסטודיו רק התחיל לפרסם דוגמאות — בקרוב יופיעו כאן הזמנות.';

    renderInto(grid, items, basePath, empty);
  });
});
