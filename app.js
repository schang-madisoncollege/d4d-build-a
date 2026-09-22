const app = document.querySelector('#app');

const statusStyles = {
  available: { label: 'Available', className: 'bg-status-available-bg text-status-available' },
  checked_out: { label: 'Checked out', className: 'bg-status-out-bg text-status-out' },
  repair: { label: 'Out for repair', className: 'bg-status-repair-bg text-status-repair' },
};

const filterStorageKey = 'sixth-ward-catalog-filters';
let catalog = null;
let filters = loadFilters();

function loadFilters() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(filterStorageKey));
    return {
      category: saved?.category || 'all',
      search: saved?.search || '',
      availableOnly: Boolean(saved?.availableOnly),
    };
  } catch {
    return { category: 'all', search: '', availableOnly: false };
  }
}

function saveFilters() {
  sessionStorage.setItem(filterStorageKey, JSON.stringify(filters));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function categoryLabel(categoryId) {
  return catalog.categories.find((category) => category.id === categoryId)?.label || categoryId;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

function statusBadge(tool) {
  const status = statusStyles[tool.availability];
  return `<span class="inline-flex w-fit items-center rounded-full px-2 py-1 text-xs leading-none ${status.className}">${status.label}</span>`;
}

function cardMeta(tool) {
  if (tool.availability === 'checked_out') return `Due back ${formatDate(tool.due_back)}`;
  if (tool.availability === 'repair') return 'This tool is out for repair.';

  const details = [];
  if (tool.members_only) details.push('Members only');
  if (tool.requires_orientation) details.push('Orientation required');
  if (tool.deposit > 0) {
    details.push(tool.requires_orientation || tool.members_only ? `Deposit $${tool.deposit}` : `Deposit $${tool.deposit} held at pickup`);
  }
  if (details.length > 1) return `${details.join('. ')}.`;
  return details[0] || 'No deposit';
}

function header() {
  return `
    <header class="border-b border-border bg-surface-raised">
      <nav aria-label="Main navigation" class="px-5 pb-6 pt-[30px] sm:px-10">
        <a class="font-display text-lg font-semibold leading-none text-ink" href="/" data-route>Sixth Ward Tool Library</a>
      </nav>
    </header>`;
}

function emptyState() {
  return `
    <section class="mt-6 rounded-card border border-border bg-surface-raised p-6" aria-label="No matching tools">
      <p class="text-base text-ink-muted">No tools match these filters.</p>
      <button id="clear-filters" class="mt-4 text-sm text-accent underline underline-offset-4 hover:text-accent-hover">Clear all filters</button>
    </section>`;
}

function card(tool) {
  return `
    <a href="/tool/${encodeURIComponent(tool.id)}" data-route aria-label="View details for ${escapeHtml(tool.name)}" class="group flex min-h-[364px] w-full flex-col overflow-hidden rounded-card border border-border bg-surface-raised text-left transition-colors hover:border-ink-muted">
      <div class="flex h-60 items-center justify-center bg-surface-image">
        <img class="h-16 w-16" src="/images/${escapeHtml(tool.category)}.svg" alt="${escapeHtml(categoryLabel(tool.category))} icon">
      </div>
      <div class="flex flex-1 flex-col items-start gap-2 p-4">
        <p class="text-sm leading-5 text-ink-muted">${escapeHtml(categoryLabel(tool.category))}</p>
        <h2 class="font-display text-lg font-semibold leading-6 text-ink group-hover:text-accent">${escapeHtml(tool.name)}</h2>
        ${statusBadge(tool)}
        <p class="mt-auto text-sm leading-5 text-ink-muted">${escapeHtml(cardMeta(tool))}</p>
      </div>
    </a>`;
}

function getFilteredTools() {
  const normalizedSearch = filters.search.trim().toLowerCase();
  return catalog.tools.filter((tool) => {
    if (tool.availability === 'retired') return false;
    if (filters.category !== 'all' && tool.category !== filters.category) return false;
    if (filters.availableOnly && tool.availability !== 'available') return false;
    return !normalizedSearch || tool.name.toLowerCase().includes(normalizedSearch);
  });
}

function renderCatalog(restoreSearchFocus = false) {
  const tools = getFilteredTools();
  const categoryOrder = ['power-tools', 'automotive', 'ladders', 'yard', 'plumbing'];
  const categories = categoryOrder
    .map((categoryId) => catalog.categories.find((category) => category.id === categoryId))
    .filter(Boolean);
  const countLabel = `${tools.length} ${tools.length === 1 ? 'tool' : 'tools'}`;

  app.innerHTML = `
    ${header()}
    <main class="mx-auto max-w-[1440px] px-5 pb-16 pt-12 sm:px-10">
      <h1 class="font-display text-xl font-semibold leading-tight text-ink">Browse the catalog</h1>
      <form class="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center" aria-label="Catalog filters">
        <label class="sr-only" for="category-filter">Category</label>
        <select id="category-filter" class="h-12 w-full rounded-sm border border-border bg-surface-raised px-3 text-base text-ink focus:border-accent lg:w-60">
          <option value="all">All categories</option>
          ${categories.map((category) => `<option value="${category.id}" ${filters.category === category.id ? 'selected' : ''}>${escapeHtml(category.label)}</option>`).join('')}
        </select>
        <label class="sr-only" for="tool-search">Search tools</label>
        <input id="tool-search" class="h-12 w-full rounded-sm border border-border bg-surface-raised px-3 text-base text-ink placeholder:text-ink-muted focus:border-accent lg:w-60" type="search" value="${escapeHtml(filters.search)}" placeholder="Search tools" autocomplete="off">
        <label class="flex h-12 cursor-pointer items-center gap-2 text-sm text-ink">
          <input id="available-only" class="h-5 w-5 rounded-sm border-border accent-accent" type="checkbox" ${filters.availableOnly ? 'checked' : ''}>
          <span>Available only</span>
        </label>
      </form>
      <p class="mt-6 text-sm text-ink-muted" aria-live="polite" aria-atomic="true">${countLabel}</p>
      ${tools.length ? `<section class="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-[repeat(4,320px)]" aria-label="Tool catalog">${tools.map(card).join('')}</section>` : emptyState()}
    </main>`;

  document.querySelector('#category-filter').addEventListener('change', (event) => {
    filters.category = event.target.value;
    saveFilters();
    renderCatalog();
  });

  document.querySelector('#tool-search').addEventListener('input', (event) => {
    filters.search = event.target.value;
    saveFilters();
    renderCatalog(true);
  });

  document.querySelector('#available-only').addEventListener('change', (event) => {
    filters.availableOnly = event.target.checked;
    saveFilters();
    renderCatalog();
  });

  document.querySelector('#clear-filters')?.addEventListener('click', () => {
    filters = { category: 'all', search: '', availableOnly: false };
    saveFilters();
    renderCatalog();
  });

  if (restoreSearchFocus) {
    const searchInput = document.querySelector('#tool-search');
    searchInput.focus();
    searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
  }
}

function detailLines(tool) {
  const lines = [];
  if (tool.availability === 'checked_out') lines.push(`Due back ${formatDate(tool.due_back)}`);
  if (tool.availability === 'repair') lines.push('This tool is out for repair.');
  if (tool.members_only) lines.push('Members only');
  if (tool.requires_orientation) lines.push('Requires orientation');
  if (tool.deposit > 0) lines.push(`$${tool.deposit} refundable deposit held at pickup`);
  if (tool.deposit === 0 && tool.availability !== 'repair') lines.push('No deposit');
  return lines;
}

function renderNotFound() {
  app.innerHTML = `
    ${header()}
    <main class="mx-auto max-w-[1440px] px-5 pb-16 pt-12 sm:px-10">
      <a class="inline-flex items-center text-base text-accent hover:text-accent-hover" href="/" data-route>&larr; Back to catalog</a>
      <section class="mt-8 max-w-[640px] rounded-card border border-border bg-surface-raised p-6">
        <h1 class="font-display text-xl font-semibold text-ink">Tool not found</h1>
        <p class="mt-3 text-base text-ink-muted">This tool is not in the current catalog.</p>
      </section>
    </main>`;
}

function renderDetail(id) {
  const tool = catalog.tools.find((item) => item.id === id && item.availability !== 'retired');
  if (!tool) {
    renderNotFound();
    return;
  }
  const actionEnabled = tool.availability !== 'repair';
  const actionLabel = tool.availability === 'checked_out' ? 'Join waitlist' : 'Place hold';

  app.innerHTML = `
    ${header()}
    <main class="mx-auto max-w-[1440px] px-5 pb-16 pt-10 sm:px-10">
      <a class="inline-flex items-center text-base text-accent hover:text-accent-hover" href="/" data-route>&larr; Back to catalog</a>
      <section class="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[640px_minmax(0,1fr)] lg:gap-10">
        <div class="flex h-[360px] w-full max-w-[640px] items-center justify-center rounded-card border border-border bg-surface-raised sm:h-[480px]">
          <img class="h-24 w-24" src="/images/${escapeHtml(tool.category)}.svg" alt="${escapeHtml(categoryLabel(tool.category))} icon">
        </div>
        <div class="flex max-w-[540px] flex-col items-start gap-4 lg:pt-2">
          <p class="text-sm leading-5 text-ink-muted">${escapeHtml(categoryLabel(tool.category))}</p>
          <h1 class="font-display text-xl font-semibold leading-tight text-ink">${escapeHtml(tool.name)}</h1>
          ${statusBadge(tool)}
          <p class="text-base leading-6 text-ink">${escapeHtml(tool.summary)}</p>
          <ul class="flex flex-col gap-2 text-sm leading-5 text-ink-muted" aria-label="Tool details">
            ${detailLines(tool).map((line) => `<li>${escapeHtml(line)}</li>`).join('')}
          </ul>
          ${actionEnabled
            ? `<a class="mt-2 inline-flex h-[51px] w-[150px] items-center justify-center rounded-sm bg-accent text-base text-accent-ink transition-colors hover:bg-accent-hover" href="/tool/${encodeURIComponent(tool.id)}/hold" data-route>${actionLabel}</a>`
            : `<button class="mt-2 inline-flex h-[51px] w-[150px] cursor-not-allowed items-center justify-center rounded-sm bg-disabled text-base text-disabled-ink" type="button" disabled>Unavailable</button>`}
        </div>
      </section>
    </main>`;
}

function holdItems(tool) {
  const items = [];
  if (tool.members_only) items.push('Your Sixth Ward membership card');
  if (tool.deposit > 0) items.push(`A $${tool.deposit} refundable deposit`);
  if (tool.requires_orientation) items.push('Time for a required safety orientation');
  if (!items.length) items.push('Your Sixth Ward membership card');
  return items;
}

function renderConfirmation(id) {
  const tool = catalog.tools.find((item) => item.id === id && item.availability !== 'retired');
  if (!tool) {
    renderNotFound();
    return;
  }

  const isWaitlist = tool.availability === 'checked_out';
  app.innerHTML = `
    ${header()}
    <main class="mx-auto flex max-w-[1440px] justify-center px-5 pb-16 pt-12 sm:px-10 sm:pt-16">
      <section class="flex min-h-[380px] w-full max-w-[640px] flex-col rounded-card border border-border bg-surface-raised p-6 sm:p-10" aria-labelledby="confirmation-title">
        <h1 id="confirmation-title" class="font-display text-xl font-semibold leading-tight text-ink">${isWaitlist ? "You're on the waitlist" : 'Your hold is placed'}</h1>
        <p class="mt-6 font-display text-lg font-semibold leading-6 text-ink">${escapeHtml(tool.name)}</p>
        <p class="mt-4 text-base leading-6 text-ink-muted">${isWaitlist ? "We'll let you know when this tool is returned and ready for pickup." : 'Pick this up within 3 days. After that the hold is released.'}</p>
        <h2 class="mt-6 text-base font-semibold text-ink">What to bring</h2>
        <ul class="mt-2 list-disc space-y-1 pl-5 text-sm leading-5 text-ink-muted">
          ${holdItems(tool).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
        </ul>
        <a class="mt-auto pt-6 text-base text-accent underline underline-offset-4 hover:text-accent-hover" href="/" data-route>Back to catalog</a>
      </section>
    </main>`;
}

function routeFromLocation() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const holdMatch = path.match(/^\/tool\/([^/]+)\/hold$/);
  const detailMatch = path.match(/^\/tool\/([^/]+)$/);
  const staticPage = document.body.dataset.staticPage;
  const fallbackId = new URLSearchParams(window.location.search).get('id');

  if (holdMatch) return { page: 'hold', id: decodeURIComponent(holdMatch[1]) };
  if (detailMatch) return { page: 'detail', id: decodeURIComponent(detailMatch[1]) };
  if (staticPage === 'confirmation') return { page: 'hold', id: fallbackId };
  if (staticPage === 'detail') return { page: 'detail', id: fallbackId };
  return { page: 'catalog' };
}

function renderRoute() {
  const route = routeFromLocation();
  if (route.page === 'detail') renderDetail(route.id);
  else if (route.page === 'hold') renderConfirmation(route.id);
  else renderCatalog();
}

function interceptRoutes(event) {
  const link = event.target.closest('a[data-route]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const destination = new URL(link.href, window.location.origin);
  if (destination.origin !== window.location.origin) return;
  event.preventDefault();
  window.history.pushState({}, '', `${destination.pathname}${destination.search}`);
  renderRoute();
  window.scrollTo(0, 0);
}

async function start() {
  try {
    const response = await fetch('/data/tools.json');
    if (!response.ok) throw new Error('Catalog could not be loaded');
    catalog = await response.json();
    renderRoute();
  } catch (error) {
    app.innerHTML = `
      ${header()}
      <main class="mx-auto max-w-[1440px] px-5 pb-16 pt-12 sm:px-10">
        <section class="max-w-[640px] rounded-card border border-border bg-surface-raised p-6">
          <h1 class="font-display text-xl font-semibold text-ink">Catalog unavailable</h1>
          <p class="mt-3 text-base text-ink-muted">Please refresh the page and try again.</p>
        </section>
      </main>`;
    console.error(error);
  }
}

document.addEventListener('click', interceptRoutes);
window.addEventListener('popstate', renderRoute);
start();
