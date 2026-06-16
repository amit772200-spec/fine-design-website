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
   WHATSAPP CAROUSEL
   ========================================================= */
(function initWaCarousel() {
  const track = document.getElementById('wa-track');
  if (!track) return;

  const slides = track.querySelectorAll('.wa-slide');
  const dots   = document.querySelectorAll('.wa-dot');
  let current  = 0;
  let timer;

  function goTo(idx) {
    current = (idx + slides.length) % slides.length;
    track.style.transform = 'translateX(' + (current * 100) + '%)';
    dots.forEach((d, i) => {
      d.classList.toggle('wa-dot--active', i === current);
      d.setAttribute('aria-selected', String(i === current));
    });
  }

  document.getElementById('wa-next') &&
    document.getElementById('wa-next').addEventListener('click', () => { clearInterval(timer); goTo(current - 1); startAuto(); });
  document.getElementById('wa-prev') &&
    document.getElementById('wa-prev').addEventListener('click', () => { clearInterval(timer); goTo(current + 1); startAuto(); });

  dots.forEach((dot, i) => dot.addEventListener('click', () => { clearInterval(timer); goTo(i); startAuto(); }));

  function startAuto() {
    timer = setInterval(() => goTo(current + 1), 4500);
  }

  /* RTL: slides stack right-to-left, positive translateX moves right */
  track.style.display = 'flex';
  track.style.transition = 'transform 0.4s ease';
  slides.forEach(s => { s.style.minWidth = '100%'; });

  startAuto();
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

  function openModal(invLabel) {
    const form = document.getElementById('contact-modal-form');
    const success = document.getElementById('modal-success');
    const btn = form.querySelector('.modal-submit-btn');
    form.hidden = false;
    form.reset();
    success.hidden = true;
    btn.disabled = false;
    btn.textContent = 'שליחה';

    // Add or remove hidden invitation-reference field
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
    const invLabel = btn.dataset.invLabel || null;
    openModal(invLabel);
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
