'use strict';

/* =========================================================
   COOKIE / STORAGE CONSENT BANNER
   Israeli Privacy Law Amendment 13 (in force 14/8/2025) +
   PPA guidance (Feb 2026): granular, specific, freely-given consent.

   This site doesn't load 3rd-party trackers, but it uses:
   - IndexedDB  → invitations gallery, site settings
   - localStorage → accessibility preferences

   Categories:
   - essential  (always on; cannot be disabled — needed for service)
   - analytics  (off by default; reserved for future use)
   - marketing  (off by default; reserved for future use)

   Usage:
   - Banner shows on first visit until user makes a choice.
   - "אישור הכל"  → all categories on
   - "רק חיוני"   → essential only
   - "התאמה אישית"→ checkboxes
   - Decision saved in localStorage as JSON:
       cookie-consent: { essential: true, analytics: bool, marketing: bool, ts: ISO }
   - To re-open later, call window.CookieConsent.open()

   Hidden on /admin.html.
   ========================================================= */

(function () {
  if (window.location.pathname.includes('admin.html')) return;

  const KEY = 'cookie-consent-v1';

  function loadDecision() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
    catch (e) { return null; }
  }

  function saveDecision(decision) {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        ...decision,
        ts: new Date().toISOString(),
      }));
    } catch (e) {}
    /* Notify any listeners (analytics scripts gated on consent) */
    window.dispatchEvent(new CustomEvent('cookieConsent:updated', { detail: decision }));
  }

  function buildBanner() {
    const wrap = document.createElement('div');
    wrap.id = 'cookie-banner';
    wrap.className = 'cookie-banner';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'false');
    wrap.setAttribute('aria-labelledby', 'cookie-banner-title');
    wrap.setAttribute('aria-describedby', 'cookie-banner-desc');
    wrap.dir = 'rtl';
    wrap.lang = 'he-IL';

    wrap.innerHTML = `
      <div class="cookie-banner-card">
        <div class="cookie-banner-head">
          <h2 class="cookie-banner-title" id="cookie-banner-title">העדפות פרטיות</h2>
          <p class="cookie-banner-desc" id="cookie-banner-desc">
            האתר שומר נתונים מקומיים בדפדפן שלך — לדוגמה הגלריה והעדפות הנגישות.
            לפי תיקון 13 לחוק הגנת הפרטיות, ביכולתך לבחור איזה מידע יישמר.
            <a href="pages/privacy.html" class="cookie-banner-link">פירוט במדיניות הפרטיות</a>
          </p>
        </div>

        <div class="cookie-banner-body" hidden>
          <div class="cookie-cat">
            <label class="cookie-cat-label">
              <input type="checkbox" checked disabled aria-describedby="cookie-cat-essential-desc">
              <span class="cookie-cat-text">
                <strong>חיוני</strong> <span class="cookie-cat-tag">תמיד פעיל</span>
                <small id="cookie-cat-essential-desc">דרוש להפעלת האתר: שמירת ההעדפות שלך לנגישות, הצגת הזמנות שעלו לסטודיו.</small>
              </span>
            </label>
          </div>
          <div class="cookie-cat">
            <label class="cookie-cat-label">
              <input type="checkbox" id="cookie-cat-analytics" aria-describedby="cookie-cat-analytics-desc">
              <span class="cookie-cat-text">
                <strong>סטטיסטיקה</strong>
                <small id="cookie-cat-analytics-desc">איסוף נתונים אנונימיים על שימוש באתר לצורך שיפורו. (לא בשימוש כיום).</small>
              </span>
            </label>
          </div>
          <div class="cookie-cat">
            <label class="cookie-cat-label">
              <input type="checkbox" id="cookie-cat-marketing" aria-describedby="cookie-cat-marketing-desc">
              <span class="cookie-cat-text">
                <strong>שיווק</strong>
                <small id="cookie-cat-marketing-desc">פיקסלים פרסומיים והתאמה אישית של מודעות. (לא בשימוש כיום).</small>
              </span>
            </label>
          </div>
        </div>

        <div class="cookie-banner-actions">
          <button type="button" class="cookie-btn cookie-btn--ghost" data-action="customize" aria-expanded="false">התאמה אישית</button>
          <button type="button" class="cookie-btn cookie-btn--secondary" data-action="essential">רק חיוני</button>
          <button type="button" class="cookie-btn cookie-btn--primary" data-action="accept-all">אישור הכל</button>
        </div>
      </div>
    `;

    document.body.appendChild(wrap);

    /* Focus trap-lite — focus the primary CTA on open */
    setTimeout(() => {
      const primary = wrap.querySelector('[data-action="accept-all"]');
      primary && primary.focus({ preventScroll: true });
    }, 200);

    /* Wire actions */
    wrap.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;
      if (action === 'accept-all') {
        saveDecision({ essential: true, analytics: true, marketing: true });
        close();
      } else if (action === 'essential') {
        saveDecision({ essential: true, analytics: false, marketing: false });
        close();
      } else if (action === 'customize') {
        const body = wrap.querySelector('.cookie-banner-body');
        const btn = wrap.querySelector('[data-action="customize"]');
        const isOpen = !body.hidden;
        if (isOpen) {
          /* Save with current selections */
          saveDecision({
            essential: true,
            analytics: wrap.querySelector('#cookie-cat-analytics').checked,
            marketing: wrap.querySelector('#cookie-cat-marketing').checked,
          });
          close();
        } else {
          body.hidden = false;
          btn.setAttribute('aria-expanded', 'true');
          btn.textContent = 'שמירת בחירה';
        }
      }
    });

    function close() {
      wrap.classList.add('is-closing');
      setTimeout(() => wrap.remove(), 280);
    }

    return { wrap, close };
  }

  function show() {
    if (document.getElementById('cookie-banner')) return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => buildBanner());
    } else {
      buildBanner();
    }
  }

  /* Public API */
  window.CookieConsent = {
    /* Returns current decision or null if user hasn't decided yet */
    get: loadDecision,
    /* True if a particular category is allowed */
    allowed: (cat) => {
      const d = loadDecision();
      if (!d) return cat === 'essential';
      return !!d[cat];
    },
    /* Open (or re-open) the banner */
    open: show,
    /* Wipe decision so banner re-appears (used by "ניקוי הסכמות") */
    reset: () => {
      try { localStorage.removeItem(KEY); } catch (e) {}
      show();
    },
  };

  /* Auto-show on first visit (no decision saved) */
  if (!loadDecision()) {
    show();
  }

  /* Wire any [data-cookie-settings] button (footer link) to re-open */
  function wireSettingsButtons() {
    document.querySelectorAll('[data-cookie-settings]').forEach(btn => {
      if (btn.dataset.wired) return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.CookieConsent.open();
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireSettingsButtons);
  } else {
    wireSettingsButtons();
  }
})();
