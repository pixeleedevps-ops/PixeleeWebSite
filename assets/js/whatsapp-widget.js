/* whatsapp-widget.js — floating JoinChat-style WhatsApp button */
(function () {
  const WA_LINK       = 'https://wa.link/01a8m1';
  const AUTO_DELAY_MS = 4000;
  const SESSION_KEY   = 'wa_closed';

  const WA_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.533 5.854L0 24l6.335-1.51A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.653-.49-5.19-1.349l-.372-.22-3.77.899.939-3.649-.241-.374A9.966 9.966 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>`;

  const SEND_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>`;

  const CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18"
      stroke="currentColor" stroke-width="2.5" width="14" height="14" aria-hidden="true">
    <path stroke-linecap="round" stroke-linejoin="round" d="M2 2l14 14M16 2L2 16"/>
  </svg>`;

  function inject() {
    const el = document.createElement('div');
    el.id = 'wa-widget';
    el.className = 'wa-widget';
    el.setAttribute('aria-label', 'Chat de WhatsApp con Pixelee');

    el.innerHTML = `
<div class="wa-widget__popup" id="wa-popup" role="dialog"
     aria-label="Inicia una conversación con Pixelee">
  <div class="wa-widget__header">
    <span class="wa-widget__brand">Pixelee</span>
    <button class="wa-widget__close" id="wa-close" type="button" aria-label="Cerrar">
      ${CLOSE_ICON}
    </button>
  </div>
  <div class="wa-widget__body">
    <div class="wa-widget__bubble">
      Hola 😎, Bienvenido a <strong>Pixelee</strong>
    </div>
    <div class="wa-widget__bubble">
      ¿Necesitas ayuda?
    </div>
  </div>
  <a href="${WA_LINK}" class="wa-widget__start"
     target="_blank" rel="noopener noreferrer">
    ${SEND_ICON}
    Abrir chat
  </a>
</div>

<button class="wa-widget__btn" id="wa-btn" type="button"
        aria-label="Abrir chat de WhatsApp" aria-expanded="false">
  ${WA_ICON}
  <span class="wa-widget__badge" id="wa-badge" aria-hidden="true">1</span>
</button>`;

    document.body.appendChild(el);
  }

  function init() {
    inject();

    const widget  = document.getElementById('wa-widget');
    const popup   = document.getElementById('wa-popup');
    const btn     = document.getElementById('wa-btn');
    const close   = document.getElementById('wa-close');
    const badge   = document.getElementById('wa-badge');
    let hoverTimer = null;

    function open() {
      /* Reset bubble animations so they replay on every open */
      popup.querySelectorAll('.wa-widget__bubble').forEach(b => {
        b.style.animation = 'none';
        b.offsetHeight; // force reflow
        b.style.animation = '';
      });
      popup.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      badge.classList.add('is-hidden');
      sessionStorage.removeItem(SESSION_KEY);
    }

    function closeWidget() {
      popup.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      sessionStorage.setItem(SESSION_KEY, '1');
    }

    /* Click: toggle open/close */
    btn.addEventListener('click', () => {
      popup.classList.contains('is-open') ? closeWidget() : open();
    });

    close.addEventListener('click', closeWidget);

    /* Hover: open on mouseenter (desktop only), keep open while over widget */
    widget.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimer);
      if (!sessionStorage.getItem(SESSION_KEY)) open();
    });

    widget.addEventListener('mouseleave', () => {
      hoverTimer = setTimeout(() => {
        if (popup.classList.contains('is-open')) closeWidget();
      }, 300);
    });

    /* Auto-open after delay on first visit */
    if (!sessionStorage.getItem(SESSION_KEY)) {
      setTimeout(open, AUTO_DELAY_MS);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
