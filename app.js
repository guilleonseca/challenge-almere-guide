const COLORS = {
  elite:    'var(--c-elite)',
  middle:   'var(--c-middle)',
  junior:   'var(--c-junior)',
  general:  'var(--c-general)',
  marathon: 'var(--c-marathon)',
};

const RACE_LABELS = {
  elite:    'Elite / Long Distance',
  middle:   'Middle Distance',
  marathon: 'Marathon',
  junior:   'Junior / Family',
  general:  'General / Logistics',
};

const DAY_ORDER = [
  'Thursday 10 September',
  'Friday 11 September',
  'Saturday 12 September',
  'Sunday 13 September',
];

let ALL_ENTRIES = [];
let fuse = null;
let activeCat = 'schedule';
let activeDay = 'all';
let activeRace = 'all';

const resultsEl = document.getElementById('results');
const emptyEl = document.getElementById('emptyState');
const countEl = document.getElementById('countLabel');
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const tabsEl = document.getElementById('tabs');
const dayFiltersEl = document.getElementById('dayFilters');
const raceFiltersEl = document.getElementById('raceFilters');

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

  renderSubfilters();
  render();
}

function renderSubfilters() {
  if (activeCat !== 'schedule') {
    dayFiltersEl.hidden = true;
    raceFiltersEl.hidden = true;
    return;
  }

  const daysPresent = DAY_ORDER.filter(d => ALL_ENTRIES.some(e => e.category === 'schedule' && e.day === d));
  dayFiltersEl.hidden = false;
  dayFiltersEl.innerHTML = ['all', ...daysPresent].map(d => {
    const label = d === 'all' ? 'All days' : d.split(' ').slice(0, 2).join(' ');
    return `<button class="pill ${activeDay === d ? 'active' : ''}" data-day="${d}">${label}</button>`;
  }).join('');

  const racesPresent = Object.keys(RACE_LABELS).filter(r => ALL_ENTRIES.some(e => e.category === 'schedule' && e.tag === r));
  raceFiltersEl.hidden = false;
  raceFiltersEl.innerHTML = ['all', ...racesPresent].map(r => {
    const label = r === 'all' ? 'All races' : RACE_LABELS[r];
    const dotColor = r === 'all' ? null : COLORS[r];
    return `<button class="pill ${activeRace === r ? 'active' : ''}" data-race="${r}">${dotColor ? `<span class="pill-dot" style="background:${dotColor}"></span>` : ''}${label}</button>`;
  }).join('');
}

function cardHTML(e) {
  const dotColor = COLORS[e.tag] || 'var(--c-general)';
  const metaBits = [e.day, e.time].filter(Boolean).join(' · ') || e.category.toUpperCase();
  const isPlaceholder = (e.detail || '').includes('PLACEHOLDER');
  const locLine = e.location && e.location !== '—' ? e.location : (e.detail || '');

  if (e.category === 'links') {
    const hasUrl = !!e.url;
    const tag = hasUrl ? 'a' : 'div';
    const hrefAttr = hasUrl ? `href="${e.url}" target="_blank" rel="noopener"` : '';
    return `
      <${tag} class="card link-card" ${hrefAttr}>
        <div class="body">
          <div class="title">${e.title}</div>
          ${e.detail ? `<div class="loc">${e.detail}</div>` : ''}
          ${isPlaceholder ? `<div class="placeholder-flag">NEEDS URL</div>` : ''}
        </div>
        <div class="arrow">›</div>
      </${tag}>
    `;
  }

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

  let list = query ? fuse.search(query).map(r => r.item) : ALL_ENTRIES;

  list = list.filter(e => e.category === activeCat);

  if (activeCat === 'schedule') {
    if (activeDay !== 'all') list = list.filter(e => e.day === activeDay);
    if (activeRace !== 'all') list = list.filter(e => e.tag === activeRace);
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
  activeDay = 'all';
  activeRace = 'all';
  renderSubfilters();
  render();
});

dayFiltersEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.pill');
  if (!btn) return;
  activeDay = btn.dataset.day;
  renderSubfilters();
  render();
});

raceFiltersEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.pill');
  if (!btn) return;
  activeRace = btn.dataset.race;
  renderSubfilters();
  render();
});

init();
