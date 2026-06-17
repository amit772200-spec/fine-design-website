'use strict';

/* Mark JS as available — enables [data-reveal] hidden-by-default rules */
document.documentElement.classList.add('js');

/* =========================================================
   HAMBURGER MENU
   ========================================================= */
const hamburgerBtn = document.getElementById('hamburger-btn');
const mobileMenu   = document.getElementById('mobile-menu');
const menuClose    = document.getElementById('mobile-menu-close');
const menuOverlay  = document.getElementById('mobile-menu-overlay');

function openMenu() {
  if (!mobileMenu) return;
  mobileMenu.classList.add('is-open');
  hamburgerBtn && hamburgerBtn.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  menuClose && menuClose.focus();
}

function closeMenu() {
  if (!mobileMenu) return;
  mobileMenu.classList.remove('is-open');
  hamburgerBtn && hamburgerBtn.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
  hamburgerBtn && hamburgerBtn.focus();
}

hamburgerBtn && hamburgerBtn.addEventListener('click', () => {
  const isOpen = mobileMenu && mobileMenu.classList.contains('is-open');
  isOpen ? closeMenu() : openMenu();
});

menuClose && menuClose.addEventListener('click', closeMenu);
menuOverlay && menuOverlay.addEventListener('click', closeMenu);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('is-open')) {
    closeMenu();
  }
});

/* Trap focus inside mobile menu when open */
mobileMenu && mobileMenu.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  const focusable = mobileMenu.querySelectorAll(
    'a[href], button, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

/* =========================================================
   ACTIVE NAV LINK HIGHLIGHT
   ========================================================= */
(function markActiveLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-desktop a, .mobile-menu-nav a');
  navLinks.forEach(link => {
    const href = link.getAttribute('href').split('/').pop();
    if (href === currentPath) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
})();

/* =========================================================
   SMOOTH SCROLL for anchor links
   ========================================================= */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#' || href.length < 2) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    closeMenu();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* =========================================================
   SCROLL-REVEAL — fade up sections as they enter the viewport
   ========================================================= */
(function initScrollReveal() {
  const all = document.querySelectorAll('[data-reveal]');
  if (!all.length) return;

  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    all.forEach(el => el.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.01, rootMargin: '0px 0px -5% 0px' });

  all.forEach(el => observer.observe(el));

  /* Safety fallback — reveal anything left after 1.5s
     (covers headless screenshot tools that don't trigger IntersectionObserver) */
  setTimeout(() => {
    document.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach(el => {
      el.classList.add('is-revealed');
    });
  }, 1500);
})();

/* =========================================================
   MARQUEE — duplicate inner content for seamless loop
   ========================================================= */
(function initMarquee() {
  document.querySelectorAll('.marquee-track').forEach(track => {
    if (track.dataset.cloned) return;
    const clone = track.innerHTML;
    track.innerHTML = clone + clone;
    track.dataset.cloned = 'true';
  });
})();

/* =========================================================
   HERO IMAGE STRIP — clone images for seamless vertical loop
   ========================================================= */
(function initHeroStrip() {
  const track = document.getElementById('hero-img-track');
  if (!track) return;
  const imgs = Array.from(track.querySelectorAll('.hero-img-item'));
  imgs.forEach(img => track.appendChild(img.cloneNode(true)));
})();

/* =========================================================
   BACK TO TOP
   ========================================================= */
(function initBackToTop() {
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'חזרה לראש הדף');
  btn.innerHTML = '&#8679;';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('is-visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

/* =========================================================
   LIGHTBOX
   ========================================================= */
(function initLightbox() {
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'תצוגת תמונה מוגדלת');
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="lightbox-inner">
      <button class="lightbox-close" aria-label="סגור">&#215;</button>
      <img class="lightbox-img" src="" alt="">
    </div>
    <button class="lightbox-prev" aria-label="הקודם">&#8250;</button>
    <button class="lightbox-next" aria-label="הבא">&#8249;</button>
  `;
  document.body.appendChild(overlay);

  let items = [];
  let current = 0;

  function getItems() {
    return Array.from(document.querySelectorAll('.invitation-card .invitation-img-wrap img:not([aria-hidden])'));
  }

  function openLightbox(index) {
    items = getItems();
    current = index;
    show();
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    overlay.querySelector('.lightbox-close').focus();
  }

  function closeLightbox() {
    overlay.classList.remove('is-open');
    overlay.addEventListener('transitionend', () => { overlay.hidden = true; }, { once: true });
    document.body.style.overflow = '';
  }

  function show() {
    const img = items[current];
    if (!img) return;
    const lb = overlay.querySelector('.lightbox-img');
    lb.src = img.src;
    lb.alt = img.alt || '';
  }

  function prev() { current = (current - 1 + items.length) % items.length; show(); }
  function next() { current = (current + 1) % items.length; show(); }

  overlay.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  overlay.querySelector('.lightbox-prev').addEventListener('click', prev);
  overlay.querySelector('.lightbox-next').addEventListener('click', next);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeLightbox(); });

  document.addEventListener('keydown', e => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') prev();
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   next();
  });

  document.addEventListener('click', e => {
    const wrap = e.target.closest('.invitation-card .invitation-img-wrap');
    if (!wrap) return;
    const img = wrap.querySelector('img');
    if (!img) return;
    items = getItems();
    const idx = items.indexOf(img);
    openLightbox(idx >= 0 ? idx : 0);
  });
})();

/* =========================================================
   CONTACT MODAL
   ========================================================= */
(function injectContactModal() {
  const modal = document.createElement('div');
  modal.id = 'contact-modal';
  modal.className = 'modal-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'modal-heading');
  modal.hidden = true;
  modal.innerHTML = `
    <div class="modal-box">
      <button class="modal-close" aria-label="סגור">&#215;</button>
      <h2 id="modal-heading">השאירו פרטים ונחזור אליכם</h2>
      <p>מלאו את הפרטים ונחזור אליכם בהקדם</p>
      <form id="contact-modal-form" class="modal-form" novalidate>
        <div class="modal-form-row">
          <div class="modal-form-group">
            <label for="modal-firstname">שם פרטי *</label>
            <input type="text" id="modal-firstname" name="שם פרטי" required autocomplete="given-name" placeholder="שם פרטי">
          </div>
          <div class="modal-form-group">
            <label for="modal-lastname">שם משפחה *</label>
            <input type="text" id="modal-lastname" name="שם משפחה" required autocomplete="family-name" placeholder="שם משפחה">
          </div>
        </div>
        <div class="modal-form-group">
          <label for="modal-phone">מספר טלפון *</label>
          <input type="tel" id="modal-phone" name="טלפון" required autocomplete="tel" placeholder="05X-XXXXXXX">
        </div>
        <div class="modal-form-group">
          <label for="modal-email">כתובת מייל</label>
          <input type="email" id="modal-email" name="מייל" autocomplete="email" placeholder="example@mail.com">
        </div>
        <div class="modal-form-group">
          <label for="modal-notes">הערות <span class="modal-optional">(לא חובה)</span></label>
          <textarea id="modal-notes" name="הערות" rows="3" placeholder="כל מה שתרצו להוסיף..."></textarea>
        </div>
        <button type="submit" class="modal-submit-btn">שליחה</button>
        <p class="modal-note">נחזור אליכם תוך 24 שעות</p>
      </form>
      <div id="modal-success" class="modal-success" hidden>
        <p>תודה! קיבלנו את פרטיכם ונחזור אליכם בקרוב.</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  function openModal(invLabel, invImgPath) {
    const form = document.getElementById('contact-modal-form');
    const success = document.getElementById('modal-success');
    const btn = form.querySelector('.modal-submit-btn');
    form.hidden = false;
    form.reset();
    success.hidden = true;
    btn.disabled = false;
    btn.textContent = 'שליחה';

    // Hidden field: invitation name
    let invField = form.querySelector('[name="הזמנה שהתעניין בה"]');
    if (invLabel) {
      if (!invField) {
        invField = document.createElement('input');
        invField.type = 'hidden';
        invField.name = 'הזמנה שהתעניין בה';
        form.appendChild(invField);
      }
      invField.value = invLabel;
    } else if (invField) {
      invField.remove();
    }

    // Hidden field: direct link to invitation image
    let imgField = form.querySelector('[name="קישור לתמונת ההזמנה"]');
    if (invImgPath) {
      const imgUrl = window.location.origin + '/' + invImgPath;
      if (!imgField) {
        imgField = document.createElement('input');
        imgField.type = 'hidden';
        imgField.name = 'קישור לתמונת ההזמנה';
        form.appendChild(imgField);
      }
      imgField.value = imgUrl;
    } else if (imgField) {
      imgField.remove();
    }

    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-close').focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  document.addEventListener('click', e => {
    if (!e.target.classList.contains('open-contact-modal')) return;
    const btn = e.target;
    openModal(btn.dataset.invLabel || null, btn.dataset.invImg || null);
  });

  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  document.getElementById('contact-modal-form').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('.modal-submit-btn');
    btn.disabled = true;
    btn.textContent = 'שולח...';
    try {
      const res = await fetch('https://formsubmit.co/ajax/finedesign772200@gmail.com', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });
      if (res.ok) {
        form.hidden = true;
        document.getElementById('modal-success').hidden = false;
        setTimeout(closeModal, 3500);
      } else {
        btn.disabled = false;
        btn.textContent = 'שליחה';
        alert('שגיאה בשליחה. אנא נסו שוב מאוחר יותר.');
      }
    } catch {
      btn.disabled = false;
      btn.textContent = 'שליחה';
      alert('שגיאה בשליחה. אנא נסו שוב מאוחר יותר.');
    }
  });
})();

/* =========================================================
   REVIEW MODAL — customers submit a review for approval
   ========================================================= */
(function injectReviewModal() {
  const modal = document.createElement('div');
  modal.id = 'review-modal';
  modal.className = 'modal-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'review-modal-heading');
  modal.hidden = true;
  modal.innerHTML = `
    <div class="modal-box">
      <button class="modal-close" aria-label="סגור">&#215;</button>
      <h2 id="review-modal-heading">כתבו לנו ביקורת</h2>
      <p>נשמח לשמוע איך היה! הביקורת תפורסם באתר לאחר אישור.</p>
      <form id="review-modal-form" class="modal-form" novalidate>
        <input type="hidden" name="_subject" value="ביקורת חדשה מהאתר">
        <div class="modal-form-group">
          <label>דירוג</label>
          <div class="star-rating-input" role="radiogroup" aria-label="דירוג בכוכבים">
            <button type="button" data-value="5" aria-label="5 כוכבים">★</button>
            <button type="button" data-value="4" aria-label="4 כוכבים">★</button>
            <button type="button" data-value="3" aria-label="3 כוכבים">★</button>
            <button type="button" data-value="2" aria-label="2 כוכבים">★</button>
            <button type="button" data-value="1" aria-label="כוכב אחד">★</button>
          </div>
          <input type="hidden" id="review-rating" name="דירוג" value="5" required>
        </div>
        <div class="modal-form-group">
          <label for="review-name">שם *</label>
          <input type="text" id="review-name" name="שם" required placeholder="השם שלך">
        </div>
        <div class="modal-form-group">
          <label for="review-event">סוג האירוע *</label>
          <input type="text" id="review-event" name="סוג האירוע" required placeholder="חתונה, חינה, בר מצווה...">
        </div>
        <div class="modal-form-group">
          <label for="review-text">הביקורת שלך *</label>
          <textarea id="review-text" name="תוכן הביקורת" rows="4" required placeholder="ספרו לנו על החוויה שלכם..."></textarea>
        </div>
        <button type="submit" class="modal-submit-btn">שליחת ביקורת</button>
      </form>
      <div id="review-modal-success" class="modal-success" hidden>
        <p>תודה רבה! קיבלנו את הביקורת שלך ונפרסם אותה בקרוב.</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const stars = Array.from(modal.querySelectorAll('.star-rating-input button'));
  const ratingInput = modal.querySelector('#review-rating');

  function setRating(value) {
    ratingInput.value = value;
    stars.forEach(star => {
      star.classList.toggle('is-filled', Number(star.dataset.value) >= Number(value));
    });
  }
  stars.forEach(star => {
    star.addEventListener('click', () => setRating(star.dataset.value));
  });

  function openModal() {
    const form = document.getElementById('review-modal-form');
    const success = document.getElementById('review-modal-success');
    const btn = form.querySelector('.modal-submit-btn');
    form.hidden = false;
    form.reset();
    setRating(5);
    success.hidden = true;
    btn.disabled = false;
    btn.textContent = 'שליחת ביקורת';
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-close').focus();
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  document.addEventListener('click', e => {
    if (!e.target.classList.contains('open-review-modal')) return;
    openModal();
  });

  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  document.getElementById('review-modal-form').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('.modal-submit-btn');
    btn.disabled = true;
    btn.textContent = 'שולח...';
    try {
      const res = await fetch('https://formsubmit.co/ajax/finedesign772200@gmail.com', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });
      if (res.ok) {
        form.hidden = true;
        document.getElementById('review-modal-success').hidden = false;
        setTimeout(closeModal, 3500);
      } else {
        btn.disabled = false;
        btn.textContent = 'שליחת ביקורת';
        alert('שגיאה בשליחה. אנא נסו שוב מאוחר יותר.');
      }
    } catch {
      btn.disabled = false;
      btn.textContent = 'שליחת ביקורת';
      alert('שגיאה בשליחה. אנא נסו שוב מאוחר יותר.');
    }
  });
})();
