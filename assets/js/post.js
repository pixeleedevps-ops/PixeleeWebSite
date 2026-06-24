/* post.js — renders an individual blog post
 * Base is './' because post.html is at the site root
 */

const POST_BASE = './';
const DISPLAY_AUTHOR = 'Equipo Pixelee';

/* ── helpers ── */

function getSlug() {
  return new URLSearchParams(window.location.search).get('slug');
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function fetchPost(slug) {
  const res = await fetch(`${POST_BASE}posts/${slug}.json`);
  if (!res.ok) throw new Error('Artículo no encontrado (HTTP ' + res.status + ')');
  return res.json();
}

/* ── social share ── */
function buildShareButtons(post) {
  const url   = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(post.title);
  const text  = encodeURIComponent(post.title + ' — Blog Pixelee');

  return `
<div class="post-share" aria-label="Compartir artículo">
  <span class="post-share__label">Compartir</span>
  <div class="post-share__buttons">

    <a href="https://wa.me/?text=${text}%20${url}"
       class="post-share__btn post-share__btn--wa"
       target="_blank" rel="noopener noreferrer"
       aria-label="Compartir en WhatsApp">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.533 5.854L0 24l6.335-1.51A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.653-.49-5.19-1.349l-.372-.22-3.77.899.939-3.649-.241-.374A9.966 9.966 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
      </svg>
      WhatsApp
    </a>

    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${url}"
       class="post-share__btn post-share__btn--li"
       target="_blank" rel="noopener noreferrer"
       aria-label="Compartir en LinkedIn">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      LinkedIn
    </a>

    <a href="https://www.facebook.com/sharer/sharer.php?u=${url}"
       class="post-share__btn post-share__btn--fb"
       target="_blank" rel="noopener noreferrer"
       aria-label="Compartir en Facebook">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
      Facebook
    </a>

    <button
      class="post-share__btn post-share__btn--ig"
      id="post-ig-btn"
      type="button"
      aria-label="Copiar enlace para Instagram">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
      Instagram
    </button>

    <button
      class="post-share__btn post-share__btn--tt"
      id="post-tt-btn"
      type="button"
      aria-label="Copiar enlace para TikTok">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.95a8.27 8.27 0 004.84 1.55V7.06a4.85 4.85 0 01-1.07-.37z"/>
      </svg>
      TikTok
    </button>

    <a href="https://twitter.com/intent/tweet?text=${title}&url=${url}"
       class="post-share__btn post-share__btn--x"
       target="_blank" rel="noopener noreferrer"
       aria-label="Compartir en X (Twitter)">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.26 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
      X
    </a>

    <button
      class="post-share__btn post-share__btn--copy"
      id="post-copy-btn"
      type="button"
      aria-label="Copiar enlace">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
           stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
      </svg>
      Copiar enlace
    </button>

  </div>
</div>`;
}

function makeCopyHandler(btnId, defaultLabel, copiedLabel) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      btn.classList.add('is-copied');
      btn.innerHTML = btn.innerHTML.replace(defaultLabel, copiedLabel);
      setTimeout(() => {
        btn.classList.remove('is-copied');
        btn.innerHTML = btn.innerHTML.replace(copiedLabel, defaultLabel);
      }, 2200);
    } catch (_) { /* silent */ }
  });
}

function initShareButtons() {
  makeCopyHandler('post-copy-btn', 'Copiar enlace', '¡Copiado!');
  makeCopyHandler('post-ig-btn',   'Instagram',     '¡Listo!');
  makeCopyHandler('post-tt-btn',   'TikTok',        '¡Listo!');
}

/* ── reading progress bar ── */
function initProgressBar() {
  const bar = document.getElementById('post-progress');
  if (!bar) return;

  function update() {
    const scrolled = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (total > 0 ? (scrolled / total) * 100 : 0) + '%';
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ── meta & SEO ── */
function applyMeta(post) {
  document.title = post.title + ' | Blog Pixelee';

  const setMeta = (sel, val) => {
    const el = document.querySelector(sel);
    if (el) el.setAttribute('content', val);
  };

  setMeta('meta[name="description"]',        post.description);
  setMeta('meta[property="og:title"]',       post.title);
  setMeta('meta[property="og:description"]', post.description);
  setMeta('meta[property="og:url"]',         window.location.href);
  if (post.image) {
    setMeta('meta[property="og:image"]',
      window.location.origin + '/' + post.image);
  }
}

/* ── author initials ── */
function initials(name) {
  if (!name) return 'PX';
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('');
}

/* ── sidebar social links ── */
function buildSidebar() {
  const arrow = `<svg class="post-sidebar__link__arrow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>`;

  const networks = [
    {
      cls: 'ig', label: 'Instagram',
      href: 'https://www.instagram.com/pixelee.co?igsh=MWdwNWF5eTgwczZ2ZQ==',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`
    },
    {
      cls: 'fb', label: 'Facebook',
      href: 'https://www.facebook.com/share/18xwTrtbjK/?mibextid=wwXIfr',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`
    },
    {
      cls: 'tt', label: 'TikTok',
      href: 'https://www.tiktok.com/@pixelee.co?_r=1&_t=ZS-96m970W9eMS',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.95a8.27 8.27 0 004.84 1.55V7.06a4.85 4.85 0 01-1.07-.37z"/></svg>`
    },
    {
      cls: 'li', label: 'LinkedIn',
      href: 'https://www.linkedin.com/',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`
    },
    {
      cls: 'wa', label: 'WhatsApp',
      href: 'https://wa.link/01a8m1',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.533 5.854L0 24l6.335-1.51A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.653-.49-5.19-1.349l-.372-.22-3.77.899.939-3.649-.241-.374A9.966 9.966 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>`
    },
  ];

  return `
<div class="post-sidebar__inner">
  <div class="post-sidebar__header">
    <span class="post-sidebar__eyebrow">Nuestras Redes</span>
    <p class="post-sidebar__title">Contenido digital cada semana</p>
    <p class="post-sidebar__sub">Tips de diseño web, SEO y marketing para hacer crecer tu negocio.</p>
  </div>
  <div class="post-sidebar__links">
    ${networks.map(({ cls, href, label, svg }) => `
    <a href="${href}" class="post-sidebar__link post-sidebar__link--${cls}"
       target="_blank" rel="noopener noreferrer">
      ${svg}<span>${label}</span>${arrow}
    </a>`).join('')}
  </div>
</div>`;
}

/* ── render ── */
function renderPost(post) {
  applyMeta(post);

  const container = document.getElementById('post-container');
  if (!container) return;

  /* Cover HTML */
  const coverInner = post.image
    ? `<img src="${POST_BASE}${post.image}" alt="${post.title}"
            width="1200" height="514" loading="eager" decoding="async">`
    : '';

  /* Meta row */
  const visibleAuthor = post.author ? DISPLAY_AUTHOR : '';

  const metaHtml = [
    post.tag    ? `<span class="post-header__tag">${post.tag}</span>` : '',
    post.date   ? `<span class="post-header__date">${formatDate(post.date)}</span>` : '',
    visibleAuthor ? `<span class="post-header__author">por ${visibleAuthor}</span>` : '',
  ].join('');

  /* Author card */
  const authorHtml = visibleAuthor ? `
<div class="post-author" itemscope itemtype="https://schema.org/Organization">
  <div class="post-author__avatar" aria-hidden="true">${initials(visibleAuthor)}</div>
  <div class="post-author__info">
    <strong class="post-author__name" itemprop="name">${visibleAuthor}</strong>
    <span class="post-author__role">Pixelee</span>
    <p class="post-author__bio">
      Equipo de estrategia, diseño, marketing y desarrollo web para negocios en Colombia.
    </p>
  </div>
</div>` : '';

  container.innerHTML = `

<div class="container">
  <a href="blog/" class="post-back">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
         stroke="currentColor" stroke-width="2.5" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18"/>
    </svg>
    Volver al blog
  </a>

  <header class="post-header" itemscope itemtype="https://schema.org/Article">
    <meta itemprop="headline"      content="${post.title}">
    <meta itemprop="description"   content="${post.description || ''}">
    <meta itemprop="datePublished" content="${post.date || ''}">
    <meta itemprop="author"        content="${visibleAuthor || ''}">
    ${post.image ? `<meta itemprop="image" content="${window.location.origin}/${post.image}">` : ''}

    <div class="post-header__meta">${metaHtml}</div>
    <h1 class="post-header__title">${post.title}</h1>
    <div class="post-header__divider" aria-hidden="true"></div>
  </header>
</div>

<div class="container">
  <div class="post-cover">${coverInner}</div>
</div>

<div class="container">
  <div class="post-layout">
    <div class="post-layout__content">
      <article class="post-body" id="post-body" itemprop="articleBody">
        ${post.content || ''}
      </article>
      ${authorHtml}
      ${buildShareButtons(post)}
      <div class="post-nav">
        <a href="blog/" class="btn btn-ghost">
          ← Más artículos
        </a>
      </div>
    </div>
    <aside class="post-sidebar" aria-label="Redes sociales de Pixelee">
      ${buildSidebar()}
    </aside>
  </div>
</div>`;
}

/* ── skeleton ── */
function renderSkeleton() {
  const container = document.getElementById('post-container');
  if (!container) return;
  container.innerHTML = `
<div class="post-skeleton container">
  <div class="skel-line skel-line--sm"  style="margin-top:2.25rem;height:.6em;width:7rem"></div>
  <div class="skel-line skel-line--title" style="height:2.8em;width:78%;margin-top:1.75rem"></div>
  <div class="skel-line skel-line--title" style="height:2.8em;width:58%"></div>
  <div class="post-skeleton__cover"></div>
  <div class="skel-line skel-line--lg"></div>
  <div class="skel-line skel-line--md" style="margin-top:.3rem"></div>
  <div class="skel-line skel-line--lg" style="margin-top:.3rem"></div>
  <div class="skel-line skel-line--sm" style="margin-top:.3rem"></div>
</div>`;
}

/* ── error state ── */
function renderError(message) {
  const container = document.getElementById('post-container');
  if (!container) return;
  container.innerHTML = `
<div class="container" style="text-align:center;padding:7rem 0">
  <div style="font-size:2.5rem;margin-bottom:1.25rem;opacity:.25">✦</div>
  <h2 style="font-family:var(--font-display);font-size:2rem;font-weight:700;margin-bottom:.75rem">
    Artículo no encontrado
  </h2>
  <p style="color:var(--text-soft);margin-bottom:2.25rem;max-width:380px;margin-inline:auto">
    ${message}
  </p>
  <a href="blog/" class="btn btn-primary">← Volver al blog</a>
</div>`;
}

/* ── main ── */
async function initPost() {
  const slug = getSlug();

  if (!slug) {
    renderError('No se especificó ningún artículo en la URL.');
    return;
  }

  renderSkeleton();

  try {
    const post = await fetchPost(slug);
    renderPost(post);
    initProgressBar();
    initShareButtons();
  } catch (err) {
    renderError(err.message);
  }
}

document.addEventListener('DOMContentLoaded', initPost);
