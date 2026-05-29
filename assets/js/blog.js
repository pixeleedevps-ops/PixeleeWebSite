/* blog.js — listing page con filtro por categorías
 * Base '../' porque la página vive en /blog/index.html
 */

const BLOG_BASE   = '../';
const POSTS_INDEX = BLOG_BASE + 'posts/index.json';

let ALL_POSTS = [];

/* ── formatters ── */

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}

function buildImageHtml(post) {
  if (!post.image) {
    return `<div class="blog-card__image-placeholder"><span>✦</span></div>`;
  }
  return `<img src="${BLOG_BASE}${post.image}" alt="${post.title}" loading="lazy" decoding="async">`;
}

function buildCard(post, index) {
  const postUrl = `${BLOG_BASE}post.html?slug=${post.slug}`;
  return `
<article
  class="blog-card"
  style="animation-delay:${index * 80}ms"
  role="link"
  tabindex="0"
  data-href="${postUrl}"
  aria-label="${post.title}">
  <div class="blog-card__image-wrap">${buildImageHtml(post)}</div>
  <div class="blog-card__body">
    <div class="blog-card__meta">
      ${post.tag ? `<span class="blog-card__tag">${post.tag}</span>` : ''}
      <span class="blog-card__date">${formatDate(post.date)}</span>
    </div>
    <h2 class="blog-card__title">${post.title}</h2>
    <p class="blog-card__desc">${post.description}</p>
    <a href="${postUrl}" class="blog-card__link" tabindex="-1" aria-hidden="true">
      Leer artículo
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
           stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
      </svg>
    </a>
  </div>
</article>`;
}

function buildSkeletons(count) {
  return Array.from({ length: count }, () => `
<div class="blog-card blog-card--skeleton" aria-hidden="true">
  <div class="blog-card__image-wrap" style="aspect-ratio:16/9"></div>
  <div class="blog-card__body">
    <div class="skel-line skel-line--xs" style="margin-bottom:.8rem"></div>
    <div class="skel-line skel-line--title"></div>
    <div class="skel-line skel-line--lg"></div>
    <div class="skel-line skel-line--md"></div>
    <div class="skel-line skel-line--sm" style="margin-top:.5rem"></div>
  </div>
</div>`).join('');
}

/* ── card click delegation (bind once, persiste tras re-render) ── */
function bindCardClicks(grid) {
  grid.addEventListener('click', function (e) {
    const card = e.target.closest('[data-href]');
    if (card && !e.target.closest('a')) {
      window.location.href = card.dataset.href;
    }
  });

  grid.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      const card = e.target.closest('[data-href]');
      if (card) window.location.href = card.dataset.href;
    }
  });
}

/* ── filters ── */

function getUniqueTags(posts) {
  const seen = new Set();
  return posts
    .map(p => p.tag)
    .filter(t => t && !seen.has(t) && seen.add(t));
}

function countByTag(posts) {
  const counts = {};
  posts.forEach(p => {
    if (p.tag) counts[p.tag] = (counts[p.tag] || 0) + 1;
  });
  return counts;
}

function renderFilters(tags, activeTag) {
  const wrap = document.getElementById('blog-filters');
  if (!wrap) return;

  const counts  = countByTag(ALL_POSTS);
  const allTags = ['all', ...tags];

  wrap.innerHTML = allTags.map(tag => {
    const label  = tag === 'all' ? 'Todos' : tag;
    const count  = tag === 'all' ? ALL_POSTS.length : (counts[tag] || 0);
    const active = tag === activeTag ? 'is-active' : '';
    return `<button class="blog-filter ${active}" data-tag="${tag}">
  ${label}<span class="blog-filter__count">${count}</span>
</button>`;
  }).join('');

  wrap.querySelectorAll('.blog-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.tag;
      if (btn.classList.contains('is-active')) return;
      renderFilters(tags, tag);
      applyFilter(tag);
    });
  });
}

function applyFilter(tag) {
  const grid = document.getElementById('blog-grid');
  if (!grid) return;

  const filtered = tag === 'all'
    ? ALL_POSTS
    : ALL_POSTS.filter(p => p.tag === tag);

  /* fade out → swap content → fade in */
  grid.classList.add('is-filtering');

  setTimeout(() => {
    if (!filtered.length) {
      grid.innerHTML = `
<div class="blog-empty">
  <h3>Sin artículos en esta categoría</h3>
  <p>Pronto publicaremos contenido sobre este tema.</p>
</div>`;
    } else {
      grid.innerHTML = filtered.map((p, i) => buildCard(p, i)).join('');
    }
    grid.classList.remove('is-filtering');
  }, 150);
}

/* ── main ── */
async function initBlog() {
  const grid = document.getElementById('blog-grid');
  if (!grid) return;

  grid.innerHTML = buildSkeletons(6);
  bindCardClicks(grid);

  try {
    const res = await fetch(POSTS_INDEX);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    ALL_POSTS = await res.json();

    if (!ALL_POSTS.length) {
      grid.innerHTML = `
<div class="blog-empty">
  <h3>Próximamente</h3>
  <p>Estamos preparando contenido increíble. ¡Vuelve pronto!</p>
</div>`;
      return;
    }

    const tags = getUniqueTags(ALL_POSTS);
    renderFilters(tags, 'all');
    grid.innerHTML = ALL_POSTS.map((p, i) => buildCard(p, i)).join('');
    grid.removeAttribute('aria-busy');
  } catch (err) {
    grid.innerHTML = `
<div class="blog-empty">
  <h3>No se pudo cargar el blog</h3>
  <p>${err.message}</p>
</div>`;
  }
}

document.addEventListener('DOMContentLoaded', initBlog);
