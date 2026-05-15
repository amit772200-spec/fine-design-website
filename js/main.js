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
  }, { threshold: 0.01, rootMargin: '0px 0px -10% 0px' });

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
