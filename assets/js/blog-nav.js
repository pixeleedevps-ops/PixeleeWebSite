/* Minimal nav toggle for blog/post pages (no GSAP dependency) */
(function () {
  function initNav() {
    const toggle = document.querySelector('.nav-toggle');
    const nav    = document.querySelector('.nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.classList.toggle('is-open', !open);
      nav.classList.toggle('is-open', !open);
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!toggle.contains(e.target) && !nav.contains(e.target)) {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.classList.remove('is-open');
        nav.classList.remove('is-open');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.classList.remove('is-open');
        nav.classList.remove('is-open');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
