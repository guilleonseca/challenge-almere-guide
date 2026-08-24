const COLORS = {
  elite:    'var(--c-elite)',
  middle:   'var(--c-middle)',
  junior:   'var(--c-junior)',
  general:  'var(--c-general)',
  marathon: 'var(--c-marathon)',
};

let ALL_ENTRIES = [];
let fuse = null;
let activeCat = 'all';

const resultsEl = document.getElementById('results');
const emptyEl = document.getElementById('emptyState');
const countEl = document.getElementById('countLabel');
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const tabsEl = document.getElementById('tabs');

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

function cardHTML(e) {
  const dotColor = COLORS[e.tag] || 'var(--c-general)';
  const metaBits = [e.day, e.time].filter(Boolean).join(' · ') || e.category.toUpperCase();
  const isPlaceholder = (e.detail || '').includes('PLACEHOLDER');
  const locLine = e.location && e.location !== '—' ? e.location : (e.detail || '');
  return `
    <div class="card">
      <div class="dot" style="background:${dotColor}"></div>
      <div class="body">
        <div class="meta">${metaBits}</div>
        <div class="title">${e.title}</div>
        ${locLine ? `<div class="loc">${locLine}</div>` : ''}
        ${isPlaceholder ? `<div class="placeholder-flag">CONTENT NEEDED</div>` : ''}
      </div>
    </div>
  `;
}

function render() {
  const query = searchInput.value.trim();
  clearBtn.hidden = query.length === 0;

  let list;
  if (query) {
    list = fuse.search(query).map(r => r.item);
  } else {
    list = ALL_ENTRIES;
  }

  if (activeCat !== 'all') {
    list = list.filter(e => e.category === activeCat);
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

searchInput.addEventListener('input', render);
clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  render();
  searchInput.focus();
});

tabsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.tab');
  if (!btn) return;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  activeCat = btn.dataset.cat;
  render();
});

init();
