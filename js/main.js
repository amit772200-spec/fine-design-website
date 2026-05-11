'use strict';

/* =========================================================
   HAMBURGER MENU
   ========================================================= */
const hamburgerBtn = document.getElementById('hamburger-btn');
const mobileMenu   = document.getElementById('mobile-menu');
const menuClose    = document.getElementById('mobile-menu-close');
const menuOverlay  = document.getElementById('mobile-menu-overlay');

function openMenu() {
  mobileMenu.classList.add('is-open');
  hamburgerBtn.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  menuClose && menuClose.focus();
}

function closeMenu() {
  mobileMenu.classList.remove('is-open');
  hamburgerBtn.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
  hamburgerBtn && hamburgerBtn.focus();
}

hamburgerBtn && hamburgerBtn.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.contains('is-open');
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
   ADMIN BUTTON — fixed bottom-left, subtle but accessible
   ========================================================= */
(function injectAdminLink() {
  const isAdminPage = window.location.pathname.includes('admin.html');
  if (isAdminPage) return;

  const basePath = window.location.pathname.includes('/pages/') ? '../' : '';

  const link = document.createElement('a');
  link.href  = basePath + 'admin.html';
  link.setAttribute('aria-label', 'כניסה לפאנל ניהול');
  link.style.cssText = [
    'position:fixed',
    'bottom:76px',
    'inset-inline-start:12px',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'padding:6px 12px',
    'background:rgba(44,36,24,0.75)',
    'color:rgba(184,149,90,0.9)',
    'font-family:Arial,sans-serif',
    'font-size:10px',
    'font-weight:700',
    'letter-spacing:0.12em',
    'text-decoration:none',
    'border-radius:4px',
    'border:1px solid rgba(184,149,90,0.4)',
    'backdrop-filter:blur(4px)',
    'transition:all 0.25s ease',
    'z-index:9000',
    'opacity:0.55',
    'cursor:pointer',
    'white-space:nowrap',
  ].join(';');
  link.textContent = 'ADMIN';

  link.addEventListener('mouseenter', () => {
    link.style.opacity = '1';
    link.style.background = 'rgba(44,36,24,0.92)';
    link.style.color = '#b8955a';
    link.style.borderColor = '#b8955a';
    link.style.boxShadow = '0 4px 16px rgba(44,36,24,0.4)';
  });
  link.addEventListener('mouseleave', () => {
    link.style.opacity = '0.55';
    link.style.background = 'rgba(44,36,24,0.75)';
    link.style.color = 'rgba(184,149,90,0.9)';
    link.style.borderColor = 'rgba(184,149,90,0.4)';
    link.style.boxShadow = 'none';
  });

  document.body.appendChild(link);
})();

/* =========================================================
   SMOOTH SCROLL for anchor links
   ========================================================= */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    closeMenu();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
