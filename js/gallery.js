'use strict';

/* =========================================================
   GALLERY LOADER — reads from IndexedDB via db.js
   ========================================================= */

function buildCard(inv, basePath) {
  const card = document.createElement('article');
  card.className = 'invitation-card';
  card.dataset.id = inv.id;

  const imgLink = document.createElement('a');
  imgLink.href = basePath + 'pages/product.html?id=' + encodeURIComponent(inv.id);
  imgLink.setAttribute('aria-label', 'לפרטים והזמנה');

  if (inv.imageData) {
    const img = document.createElement('img');
    img.src = inv.imageData;
    img.alt = 'הזמנה ל' + categoryLabel(inv.category);
    img.className = 'invitation-card-img';
    img.loading = 'lazy';
    imgLink.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'invitation-card-img-placeholder';
    placeholder.textContent = 'תמונה';
    imgLink.appendChild(placeholder);
  }

  card.appendChild(imgLink);

  const footer = document.createElement('div');
  footer.className = 'invitation-card-footer';

  const priceTag = document.createElement('span');
  priceTag.className = 'price-tag';
  priceTag.innerHTML = '<span class="price-symbol">&#8362;</span>' + escHtml(inv.price || '0');

  const orderBtn = document.createElement('a');
  orderBtn.href = basePath + 'pages/product.html?id=' + encodeURIComponent(inv.id);
  orderBtn.className = 'invitation-order-btn';
  orderBtn.textContent = 'להזמנה';

  footer.appendChild(priceTag);
  footer.appendChild(orderBtn);
  card.appendChild(footer);

  return card;
}

function renderGallery(all, containerId, category, basePath) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const items = category === 'all'
    ? all
    : all.filter(inv => inv.category === category);

  container.innerHTML = '';

  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'gallery-empty';
    empty.textContent = 'עוד לא הועלו הזמנות לקטגוריה זו.';
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

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.querySelector('[data-gallery-category]');
  if (!grid) return;
  const category = grid.dataset.galleryCategory;
  const basePath = getBasePath();
  try {
    const all = await dbLoadAll();
    renderGallery(all, grid.id, category, basePath);
  } catch (err) {
    console.error('Gallery load error:', err);
  }
});
