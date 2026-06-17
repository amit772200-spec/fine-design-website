'use strict';

/* =========================================================
   SITE SETTINGS — store + apply text/theme overrides
   Adds an extra IndexedDB store ("settings") alongside db.js
   ========================================================= */

const SETTINGS_KEY = 'site';

/* ---- Defaults (also serve as authoring labels in admin) ---- */
const SETTINGS_SCHEMA = {
  hero_eyebrow:       { label: 'Hero · קטגוריית-על',        type: 'text',     default: 'Studio · Fine Design' },
  hero_title:         { label: 'Hero · כותרת ראשית',         type: 'html',     default: 'ההזמנה שתעטוף<br>\nאת <span class="accent">הרגע</span> הכי גדול<br>\nשלכם.' },
  hero_lede:          { label: 'Hero · תיאור',               type: 'textarea', default: 'סטודיו בוטיק לעיצוב הזמנות לאירועים — חתונות, חינה, ברית, בר/בת מצווה, מימונה ועוד. עיצוב בהתאמה אישית, מענה מהיר, ותוצאה שמרגישה אותך עוד לפני שהאורחים הגיעו.' },
  hero_cta_primary:   { label: 'Hero · כפתור ראשי',           type: 'text',     default: 'בואו נדבר ב-WhatsApp' },
  hero_cta_secondary: { label: 'Hero · כפתור משני',           type: 'text',     default: 'לכל סוגי ההזמנות' },

  categories_eyebrow: { label: 'קטגוריות · קטגוריית-על',     type: 'text',     default: '01 · קטגוריות' },
  categories_title:   { label: 'קטגוריות · כותרת',            type: 'text',     default: 'איזה אירוע אתם חוגגים?' },
  categories_lede:    { label: 'קטגוריות · תיאור',            type: 'text',     default: 'בחרו את הקטגוריה המתאימה וגלו את העיצובים שכבר עשו את ההבדל.' },

  about_eyebrow:      { label: 'אודות · קטגוריית-על',         type: 'text',     default: '03 · אודות' },
  about_title:        { label: 'אודות · כותרת',               type: 'text',     default: 'היי, אני עמית.' },
  about_p1:           { label: 'אודות · פסקה ראשונה',         type: 'textarea', default: 'במשך שנים אני מעצבת הזמנות לאירועים שמרגישים שונה — כי לכל זוג, לכל משפחה, לכל אורח ראשון יש סיפור שמגיע לו עיצוב משלו. אני מאמינה שהזמנה היא לא רק פיסת נייר; היא הרושם הראשון של הערב הכי מרגש שלכם.' },
  about_quote:        { label: 'אודות · ציטוט',               type: 'text',     default: 'כל הזמנה היא הדפסת אצבע של האירוע — ייחודית, אישית, מרגשת.' },
  about_p2:           { label: 'אודות · פסקה שנייה',          type: 'textarea', default: 'העבודה שלי מבוססת הקשבה: שיחה קצרה אתכם, ניסיון להבין את הסגנון, את הצבעים, את האנשים שעומדים מאחורי האירוע — ומשם נולד עיצוב שמרגיש כמוכם.' },

  cta_eyebrow:        { label: 'קריאה לפעולה · קטגוריית-על',  type: 'text',     default: '07 · יוצרים קשר' },
  cta_title:          { label: 'קריאה לפעולה · כותרת',        type: 'text',     default: 'בואו נתחיל לעצב יחד' },
  cta_lede:           { label: 'קריאה לפעולה · תיאור',        type: 'textarea', default: 'הזמנה אחת, שיחה קטנה, ואירוע אחד שיוצא לדרך. ספרו לי על האירוע ואחזור אליכם בהקדם — בדרך כלל תוך שעה.' },

  whatsapp_number:    { label: 'מספר WhatsApp (ללא +)',        type: 'text',     default: '972505900090' },
  contact_email:      { label: 'כתובת מייל',                   type: 'text',     default: 'amit@example.com' },
  footer_about:       { label: 'Footer · תיאור',                type: 'textarea', default: 'סטודיו בוטיק להזמנות מעוצבות לאירועים — עיצוב אישי, רגיש ומקצועי לכל סגנון.' },

  /* Theme — fonts only; colors are controlled solely by CSS */
  theme_font_heading: { label: 'גופן כותרות',                    type: 'select',   default: 'Frank Ruhl Libre',
                        options: ['Frank Ruhl Libre','Noto Serif Hebrew','David Libre','Suez One','Heebo','Assistant','Rubik'] },
  theme_font_body:    { label: 'גופן גוף',                       type: 'select',   default: 'Heebo',
                        options: ['Heebo','Assistant','Rubik','Frank Ruhl Libre','Noto Serif Hebrew'] },
  theme_base_size:    { label: 'גודל טקסט בסיס (px)',            type: 'number',   default: 16, min: 14, max: 20 },
};

const SETTINGS_DB_NAME = 'amit_design_db';
const SETTINGS_STORE   = 'settings';

function openSettingsDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SETTINGS_DB_NAME, 2);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('invitations')) {
        db.createObjectStore('invitations', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = () => reject(req.error);
  });
}

async function loadAllSettings() {
  try {
    const db = await openSettingsDB();
    return new Promise((resolve) => {
      const tx = db.transaction(SETTINGS_STORE, 'readonly');
      const st = tx.objectStore(SETTINGS_STORE);
      const req = st.getAll();
      req.onsuccess = () => {
        const obj = {};
        (req.result || []).forEach(r => obj[r.key] = r.value);
        resolve(obj);
      };
      req.onerror = () => resolve({});
    });
  } catch (err) {
    return {};
  }
}

async function saveSetting(key, value) {
  const db = await openSettingsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, 'readwrite');
    tx.objectStore(SETTINGS_STORE).put({ key, value });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteSetting(key) {
  const db = await openSettingsDB();
  return new Promise((resolve) => {
    const tx = db.transaction(SETTINGS_STORE, 'readwrite');
    tx.objectStore(SETTINGS_STORE).delete(key);
    tx.oncomplete = resolve;
    tx.onerror = resolve;
  });
}

function applySettings(settings) {
  /* THEME — fonts and size only; colors are fixed in CSS */
  const root = document.documentElement;
  if (settings.theme_font_heading) root.style.setProperty('--font-heading', `'${settings.theme_font_heading}', serif`);
  if (settings.theme_font_body)    root.style.setProperty('--font-body', `'${settings.theme_font_body}', sans-serif`);
  if (settings.theme_base_size) {
    document.documentElement.style.fontSize = settings.theme_base_size + 'px';
  }

  /* TEXTS — replace innerHTML / href on every [data-edit-key] element */
  Object.keys(settings).forEach(key => {
    if (key.startsWith('theme_')) return;
    const value = settings[key];
    if (value == null) return;

    document.querySelectorAll(`[data-edit-key="${key}"]`).forEach(el => {
      /* HTML-allowed for hero title (has <br> + <span>) */
      const meta = SETTINGS_SCHEMA[key];
      if (meta && meta.type === 'html') {
        el.innerHTML = value;
      } else {
        el.textContent = value;
      }
    });

    /* WhatsApp + email link rewrites */
    if (key === 'whatsapp_number') {
      document.querySelectorAll('a[href*="wa.me/"]').forEach(a => {
        const u = new URL(a.href);
        const qs = u.search;
        a.href = `https://wa.me/${value}${qs || ''}`;
      });
    }
    if (key === 'contact_email') {
      document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
        a.href = `mailto:${value}`;
        if (a.textContent.includes('@')) a.textContent = value;
      });
    }
  });
}

/* Auto-apply on load (skip on admin page itself — handled there separately) */
if (!window.location.pathname.includes('admin.html')) {
  loadAllSettings().then(s => applySettings(s)).catch(() => {});
}

/* Expose for admin */
window.SiteSettings = {
  schema:   SETTINGS_SCHEMA,
  loadAll:  loadAllSettings,
  save:     saveSetting,
  delete:   deleteSetting,
  apply:    applySettings,
};
