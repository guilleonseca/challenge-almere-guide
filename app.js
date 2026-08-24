const COLORS = {
  elite:    'var(--c-elite)',
  middle:   'var(--c-middle)',
  junior:   'var(--c-junior)',
  general:  'var(--c-general)',
  marathon: 'var(--c-marathon)',
};

// Categories whose cards get the collapsible <details> treatment —
// these tend to have long text, so collapsing keeps the page short.
const ACCORDION_CATS = new Set(['course', 'venue']);

let ALL_ENTRIES = [];
let fuse = null;
let activeCat = 'schedule';
let activeDay = 'all';
let activeEvent = 'all';

const resultsEl = document.getElementById('results');
const emptyEl = document.getElementById('emptyState');
const countEl = document.getElementById('countLabel');
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const tabsEl = document.getElementById('tabs');
const dayTabsEl = document.getElementById('dayTabs');
const courseTabsEl = document.getElementById('courseTabs');
const searchNoteEl = document.getElementById('searchNote');

const imgModal = document.getElementById('imgModal');
const imgModalPic = document.getElementById('imgModalPic');
const imgModalClose = document.getElementById('imgModalClose');

async function init() {
  try {
    const res = await fetch('content.json');
    ALL_ENTRIES = await res.json();
  } catch (e) {
    resultsEl.innerHTML = `<div class="card"><div class="body"><div class="title">Could not load content.json</div><div class="loc">Check the file is in the same folder as index.html</div></div></div>`;
    return;
  }

  fuse = new Fuse(ALL_ENTRIES, {
    keys: ['title', 'location', 'day', 'detail', 'category'],
    threshold: 0.35,
    ignoreLocation: true,
  });

  render();
}

function plainCardInner(e) {
  const dotColor = COLORS[e.tag] || 'var(--c-general)';
  const metaBits = [e.day, e.time].filter(Boolean).join(' · ') || e.category.toUpperCase();
  const isPlaceholder = (e.detail || '').includes('PLACEHOLDER');
  const locLine = e.location && e.location !== '—' ? e.location : (e.detail || '');
  const isLink = !!e.url;

  const inner = `
      <div class="dot" style="background:${dotColor}"></div>
      <div class="body">
        <div class="meta">${metaBits}</div>
        <div class="title">${e.title}</div>
        ${locLine ? `<div class="loc">${locLine}</div>` : ''}
        ${isPlaceholder ? `<div class="placeholder-flag">CONTENT NEEDED</div>` : ''}
      </div>
      ${isLink ? `<div class="ext-arrow">↗</div>` : ''}
  `;

  return isLink
    ? `<a class="card link-card" href="${e.url}" target="_blank" rel="noopener">${inner}</a>`
    : `<div class="card">${inner}</div>`;
}

function accordionCardHTML(e) {
  const hasImg = !!e.img;
  const catLabel = e.category === 'course' ? 'COURSE' : 'VENUE';
  return `
    <details class="card acc-card">
      <summary class="acc-summary">
        <div class="acc-summary-text">
          <div class="meta">${catLabel}</div>
          <div class="title">${e.title}</div>
        </div>
        <span class="acc-chevron">⌄</span>
      </summary>
      <div class="acc-body">
        ${hasImg ? `
          <button type="button" class="img-link acc-img-btn" data-img="${e.img}" data-alt="${e.title}">
            <img class="card-img" src="${e.img}" alt="${e.title}" loading="lazy">
            <span class="zoom-hint">Tap to view full image</span>
          </button>
        ` : ''}
        <div class="loc acc-detail">${e.detail}</div>
      </div>
    </details>
  `;
}

function proCardHTML(e) {
  const initials = (e.title.match(/[A-Z]/g) || ['?']).slice(0, 2).join('');
  const isPlaceholder = e.title.includes('PLACEHOLDER');
  return `
    <div class="card pro-card">
      <div class="pro-avatar">${initials}</div>
      <div class="body">
        <div class="title">${e.title}</div>
        <div class="loc">${e.detail}</div>
        <div class="pro-sub">${e.sub || ''}</div>
        ${isPlaceholder ? `<div class="placeholder-flag">CONTENT NEEDED</div>` : ''}
      </div>
    </div>
  `;
}

function cardHTML(e) {
  if (e.category === 'pros') return proCardHTML(e);
  if (ACCORDION_CATS.has(e.category)) return accordionCardHTML(e);
  return plainCardInner(e);
}

function render() {
  const query = searchInput.value.trim();
  clearBtn.hidden = query.length === 0;
  searchNoteEl.hidden = query.length === 0;

  // Sub-nav rows only make sense when NOT searching (search spans everything).
  dayTabsEl.hidden = query.length > 0 || activeCat !== 'schedule';
  courseTabsEl.hidden = query.length > 0 || activeCat !== 'course';

  let list;

  if (query) {
    // Search overrides tab/day/event filtering entirely — search the whole guide.
    list = fuse.search(query).map(r => r.item);
  } else {
    list = ALL_ENTRIES.filter(e => e.category === activeCat);
    if (activeCat === 'schedule' && activeDay !== 'all') {
      list = list.filter(e => e.day === activeDay);
    }
    if (activeCat === 'course' && activeEvent !== 'all') {
      list = list.filter(e => e.event === activeEvent);
    }
  }

  countEl.textContent = `${list.length} ${list.length === 1 ? 'entry' : 'entries'}`;

  if (list.length === 0) {
    resultsEl.innerHTML = '';
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  resultsEl.innerHTML = list.map(cardHTML).join('');
}

// ---------- search ----------
searchInput.addEventListener('input', render);
clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  render();
  searchInput.focus();
});

// ---------- main tabs ----------
tabsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.tab');
  if (!btn) return;
  document.querySelectorAll('#tabs .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  activeCat = btn.dataset.cat;
  activeDay = 'all';
  activeEvent = 'all';
  dayTabsEl.querySelector('[data-day="all"]').classList.add('active');
  document.querySelectorAll('#dayTabs .sub-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.day === 'all');
  });
  document.querySelectorAll('#courseTabs .sub-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.event === 'all');
  });
  searchInput.value = '';
  render();
});

// ---------- day sub-tabs ----------
dayTabsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.sub-tab');
  if (!btn) return;
  document.querySelectorAll('#dayTabs .sub-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  activeDay = btn.dataset.day;
  render();
});

// ---------- course event sub-tabs ----------
courseTabsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.sub-tab');
  if (!btn) return;
  document.querySelectorAll('#courseTabs .sub-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  activeEvent = btn.dataset.event;
  render();
});

// ---------- image lightbox (event delegation, since cards re-render) ----------
resultsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.acc-img-btn');
  if (!btn) return;
  e.preventDefault();
  openImgModal(btn.dataset.img, btn.dataset.alt);
});

function openImgModal(src, alt) {
  imgModalPic.src = src;
  imgModalPic.alt = alt || '';
  imgModal.hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeImgModal() {
  imgModal.hidden = true;
  imgModalPic.src = '';
  document.body.style.overflow = '';
}
imgModalClose.addEventListener('click', closeImgModal);
imgModal.addEventListener('click', (e) => {
  if (e.target === imgModal) closeImgModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !imgModal.hidden) closeImgModal();
});

init();
