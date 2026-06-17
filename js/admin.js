'use strict';

/* =========================================================
   ADMIN PANEL — Fine Design
   Storage: IndexedDB via db.js + site-settings.js
   Auth: simple password check (client-side only)
   ========================================================= */

const ADMIN_PW = 'amit2025';

const CATEGORY_LABELS = {
  weddings:          'חתונות',
  henna:             'חינה/מימונה',
  challah:           'הפרשת חלה',
  'bar-bat-mitzvah': 'בר/בת מצווה',
  'brit-milah':      'ברית/בריתה',
  'save-the-date':   'Save the Date',
};

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

/* ===========================================================
   AUTH
   =========================================================== */
let currentFilter = 'all';

function showAdminPanel() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-panel').style.display = 'block';
  renderGrid(currentFilter);
  buildSettingsForm('texts-form', /\b(hero|categories|about|cta|whatsapp|contact|footer)_/);
  buildSettingsForm('theme-form', /^theme_/);
}

function login() {
  const pw = document.getElementById('admin-password').value;
  if (pw === ADMIN_PW) {
    sessionStorage.setItem('adminAuth', '1');
    showAdminPanel();
  } else {
    document.getElementById('login-error').style.display = 'block';
    document.getElementById('admin-password').value = '';
    document.getElementById('admin-password').focus();
  }
}

document.getElementById('login-btn').addEventListener('click', login);
document.getElementById('admin-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') login();
});
document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.removeItem('adminAuth');
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-password').value = '';
});

/* ===========================================================
   TABS
   =========================================================== */
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    document.querySelectorAll('.admin-tab').forEach(t => {
      t.classList.toggle('active', t === tab);
      t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
    });
    document.querySelectorAll('.admin-tab-panel').forEach(panel => {
      const match = panel.id === 'tab-' + target;
      panel.classList.toggle('is-active', match);
      if (match) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');
    });
    if (target === 'reorder') buildReorderTab();
  });
});

/* ===========================================================
   INVITATIONS — image compression + upload
   =========================================================== */
let pendingImageData = null;

const imageInput = document.getElementById('admin-image-input');
const preview    = document.getElementById('upload-preview');
const uploadArea = document.getElementById('upload-area');
const saveBtn    = document.getElementById('admin-save-btn');

function compressImage(dataUrl, callback) {
  const img = new Image();
  img.onload = () => {
    const MAX = 1200;
    let w = img.width, h = img.height;
    if (w > MAX || h > MAX) {
      if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
      else        { w = Math.round(w * MAX / h); h = MAX; }
    }
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    callback(canvas.toDataURL('image/jpeg', 0.82));
  };
  img.src = dataUrl;
}

function handleImageFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  if (file.size > 5 * 1024 * 1024) { showToast('התמונה גדולה מדי. מקסימום 5MB.'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    compressImage(e.target.result, compressed => {
      pendingImageData = compressed;
      preview.src = compressed;
      preview.style.display = 'block';
      saveBtn.disabled = false;
    });
  };
  reader.readAsDataURL(file);
}

imageInput.addEventListener('change', () => handleImageFile(imageInput.files[0]));
uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
uploadArea.addEventListener('drop', e => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  handleImageFile(e.dataTransfer.files[0]);
});

saveBtn.addEventListener('click', async () => {
  if (!pendingImageData) return;

  const category   = document.getElementById('admin-category').value;
  const priceInput = document.getElementById('admin-price');
  const price      = priceInput.value.trim();

  if (!price || Number(price) <= 0) {
    showToast('יש להוסיף מחיר לפני שמירת ההזמנה');
    priceInput.focus();
    return;
  }

  const inv = {
    id:        Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    category,
    price,
    imageData: pendingImageData,
    createdAt: new Date().toISOString(),
  };

  try {
    await dbSave(inv);
  } catch (err) {
    showToast('שגיאה בשמירה: ' + err.message);
    return;
  }

  pendingImageData = null;
  preview.src = '';
  preview.style.display = 'none';
  imageInput.value = '';
  document.getElementById('admin-price').value = '';
  saveBtn.disabled = true;

  await renderGrid(currentFilter);
  showToast('ההזמנה נוספה בהצלחה!');
});

async function loadStaticItems() {
  try {
    /* admin.html is always at the site root, so no basePath prefix needed */
    const res = await fetch('./data/gallery.json');
    if (!res.ok) return [];
    const items = await res.json();
    return Array.isArray(items) ? items : [];
  } catch (err) {
    console.warn('loadStaticItems failed:', err);
    return [];
  }
}

async function renderGrid(filter) {
  const grid = document.getElementById('admin-grid');
  grid.innerHTML = '<div class="admin-empty">טוען...</div>';

  let dbItems = [];
  let staticItems = [];

  try {
    dbItems = await dbLoadAll();
  } catch (err) {
    grid.innerHTML = '<div class="admin-empty">שגיאה בטעינת ההזמנות.</div>';
    return;
  }

  staticItems = await loadStaticItems();

  // Merge: DB items override static ones with same id
  const dbIds = new Set(dbItems.map(i => i.id));
  const allItems = [
    ...staticItems.filter(i => !dbIds.has(i.id)).map(i => ({ ...i, _static: true })),
    ...dbItems.filter(i => !i.deleted),
  ];

  const items = filter === 'all' ? allItems : allItems.filter(i => i.category === filter);
  document.getElementById('inv-count').textContent = allItems.length;

  if (items.length === 0) {
    grid.innerHTML = '<div class="admin-empty">אין הזמנות בקטגוריה זו.</div>';
    return;
  }

  grid.innerHTML = '';

  items.forEach(inv => {
    const item = document.createElement('div');
    item.className = 'admin-invitation-item';
    item.dataset.id = inv.id;

    const badge = document.createElement('span');
    badge.className = 'admin-category-badge';
    badge.textContent = CATEGORY_LABELS[inv.category] || inv.category;
    item.appendChild(badge);

    const img = document.createElement('img');
    img.src = inv.imageData || inv.imagePath || '';
    img.alt = 'הזמנה ל' + (CATEGORY_LABELS[inv.category] || '');
    img.loading = 'lazy';
    item.appendChild(img);

    const meta = document.createElement('div');
    meta.className = 'admin-invitation-meta';

    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.className = 'admin-price-input';
    priceInput.value = inv.price || '0';
    priceInput.title = 'מחיר בשקלים';
    priceInput.setAttribute('aria-label', 'מחיר ההזמנה בשקלים');
    priceInput.addEventListener('change', async () => {
      if (inv._static) {
        /* Promote static item to DB so price change persists */
        await dbSave({
          id: inv.id,
          category: inv.category,
          price: priceInput.value,
          imagePath: inv.imagePath,
          createdAt: new Date().toISOString(),
        });
      } else {
        await dbUpdatePrice(inv.id, priceInput.value);
      }
      showToast('המחיר עודכן');
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'admin-delete-btn';
    delBtn.title = 'מחק הזמנה';
    delBtn.setAttribute('aria-label', 'מחיקת הזמנה');
    delBtn.textContent = '×';
    delBtn.addEventListener('click', async () => {
      if (confirm('למחוק הזמנה זו?')) {
        /* Always save a tombstone so static items (or promoted static items)
           don't reappear from gallery.json after their DB record is removed */
        await dbSave({
          id: inv.id,
          category: inv.category,
          deleted: true,
          createdAt: new Date().toISOString(),
        });
        await renderGrid(currentFilter);
        showToast('ההזמנה נמחקה');
      }
    });

    meta.appendChild(priceInput);
    meta.appendChild(delBtn);
    item.appendChild(meta);
    grid.appendChild(item);
  });
}

document.querySelectorAll('.admin-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.admin-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderGrid(currentFilter);
  });
});

/* ===========================================================
   SETTINGS — build forms dynamically from schema
   =========================================================== */
async function buildSettingsForm(containerId, filterRegex) {
  const container = document.getElementById(containerId);
  if (!container || container.dataset.built === '1') return;
  container.dataset.built = '1';

  const schema  = window.SiteSettings.schema;
  const current = await window.SiteSettings.loadAll();

  Object.keys(schema).forEach(key => {
    if (!filterRegex.test(key)) return;
    const meta = schema[key];
    const value = current[key] != null ? current[key] : meta.default;

    const row = document.createElement('div');
    row.className = 'settings-row';

    const label = document.createElement('label');
    label.textContent = meta.label;
    label.setAttribute('for', 'set-' + key);

    let input;
    if (meta.type === 'textarea' || meta.type === 'html') {
      input = document.createElement('textarea');
      input.rows = meta.type === 'html' ? 4 : 3;
      input.value = value;
    } else if (meta.type === 'select') {
      input = document.createElement('select');
      meta.options.forEach(opt => {
        const o = document.createElement('option');
        o.value = opt; o.textContent = opt;
        if (opt === value) o.selected = true;
        input.appendChild(o);
      });
    } else if (meta.type === 'color') {
      input = document.createElement('input');
      input.type = 'color';
      input.value = value;
    } else if (meta.type === 'number') {
      input = document.createElement('input');
      input.type = 'number';
      input.value = value;
      if (meta.min != null) input.min = meta.min;
      if (meta.max != null) input.max = meta.max;
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.value = value;
    }
    input.id = 'set-' + key;
    input.dataset.settingKey = key;
    input.dataset.settingType = meta.type;
    input.dataset.settingDefault = meta.default;

    row.appendChild(label);
    row.appendChild(input);
    container.appendChild(row);
  });
}

async function saveSettingsFromForm(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const inputs = container.querySelectorAll('[data-setting-key]');
  for (const input of inputs) {
    const key = input.dataset.settingKey;
    let v = input.value;
    if (input.dataset.settingType === 'number') v = parseInt(v, 10);
    await window.SiteSettings.save(key, v);
  }
  showToast('השמירה הצליחה ✓');
}

async function resetSettingsFromForm(containerId) {
  if (!confirm('לאפס את כל השדות בלשונית זו לברירת מחדל?')) return;
  const container = document.getElementById(containerId);
  if (!container) return;
  const inputs = container.querySelectorAll('[data-setting-key]');
  for (const input of inputs) {
    const key = input.dataset.settingKey;
    await window.SiteSettings.delete(key);
    input.value = input.dataset.settingDefault;
  }
  showToast('אופס לברירת המחדל');
}

document.getElementById('texts-save-btn').addEventListener('click', () => saveSettingsFromForm('texts-form'));
document.getElementById('theme-save-btn').addEventListener('click', () => saveSettingsFromForm('theme-form'));
document.getElementById('texts-reset-btn').addEventListener('click', () => resetSettingsFromForm('texts-form'));
document.getElementById('theme-reset-btn').addEventListener('click', () => resetSettingsFromForm('theme-form'));

/* ===========================================================
   REORDER TAB — per-category drag-and-drop swap
   =========================================================== */
let reorderItems = [];
let currentReorderCat = 'weddings';

async function loadSavedOrder(cat) {
  try {
    const settings = await window.SiteSettings.loadAll();
    const raw = settings['gallery_order_' + cat];
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function buildReorderTab(cat) {
  cat = cat || currentReorderCat;
  currentReorderCat = cat;

  const container = document.getElementById('reorder-grid');
  if (!container) return;
  container.innerHTML = '<div class="admin-empty">טוען...</div>';

  let dbItems = [];
  let staticItems = [];
  try { dbItems = await dbLoadAll(); } catch { /* ignore */ }
  staticItems = await loadStaticItems();

  const dbIds = new Set(dbItems.map(i => i.id));
  const allItems = [
    ...staticItems.filter(i => !dbIds.has(i.id)),
    ...dbItems.filter(i => !i.deleted),
  ].filter(i => i.category === cat);

  const savedOrder = await loadSavedOrder(cat);
  if (savedOrder && savedOrder.length) {
    const idIndex = {};
    savedOrder.forEach((id, idx) => { idIndex[id] = idx; });
    allItems.sort((a, b) => (idIndex[a.id] ?? savedOrder.length) - (idIndex[b.id] ?? savedOrder.length));
  }

  reorderItems = allItems;
  renderReorderGrid(container);
}

function renderReorderGrid(container) {
  container.innerHTML = '';
  if (!reorderItems.length) {
    container.innerHTML = '<div class="admin-empty">אין הזמנות בקטגוריה זו.</div>';
    return;
  }
  let dragSrcIdx = null;

  reorderItems.forEach((inv, index) => {
    const card = document.createElement('div');
    card.className = 'reorder-card';
    card.draggable = true;

    const img = document.createElement('img');
    img.src = inv.imageData || inv.imagePath || '';
    img.alt = CATEGORY_LABELS[inv.category] || inv.category;
    img.loading = 'lazy';

    const pos = document.createElement('span');
    pos.className = 'reorder-pos';
    pos.textContent = index + 1;

    card.appendChild(img);
    card.appendChild(pos);

    card.addEventListener('dragstart', e => {
      dragSrcIdx = index;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      container.querySelectorAll('.reorder-card').forEach(c => c.classList.remove('drag-over'));
    });

    card.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      container.querySelectorAll('.reorder-card').forEach(c => c.classList.remove('drag-over'));
      card.classList.add('drag-over');
    });

    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));

    card.addEventListener('drop', e => {
      e.preventDefault();
      card.classList.remove('drag-over');
      if (dragSrcIdx === null || dragSrcIdx === index) return;
      const tmp = reorderItems[dragSrcIdx];
      reorderItems[dragSrcIdx] = reorderItems[index];
      reorderItems[index] = tmp;
      dragSrcIdx = null;
      renderReorderGrid(container);
    });

    container.appendChild(card);
  });
}

/* Category filter buttons inside the reorder tab */
document.querySelectorAll('[data-reorder-cat]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-reorder-cat]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    buildReorderTab(btn.dataset.reorderCat);
  });
});

document.getElementById('save-order-btn').addEventListener('click', async () => {
  if (!reorderItems.length) { showToast('אין הזמנות לשמור'); return; }
  const ids = reorderItems.map(i => i.id);
  await window.SiteSettings.save('gallery_order_' + currentReorderCat, JSON.stringify(ids));
  showToast('הסדר נשמר! רענן את דף הקטגוריה כדי לראות את השינוי.');
});

/* Auto-login if session is still active (survives page refresh, clears on tab close) */
if (sessionStorage.getItem('adminAuth') === '1') {
  showAdminPanel();
}
