// shop.html: all products with category, search, sort, condition, deals filters and page links.
Shop.ready.then(async (cfg) => {
  const { $, esc, t, api } = Shop;
  const app = $('#app');
  const params = new URLSearchParams(location.search);
  const state = {
    category: cfg.categories.indexOf(params.get('category')) !== -1 ? params.get('category') : '',
    q: (params.get('q') || '').trim().slice(0, 60),
    sort: ['featured', 'new', 'price-asc', 'price-desc', 'discount'].indexOf(params.get('sort')) !== -1 ? params.get('sort') : 'featured',
    condition: cfg.conditions.indexOf(params.get('condition')) !== -1 ? params.get('condition') : '',
    deals: params.get('deals') === '1',
    page: Math.max(1, parseInt(params.get('page'), 10) || 1),
  };

  // Build a shop.html link with some values changed.
  const href = (over) => {
    const s = Object.assign({}, state, over);
    const p = new URLSearchParams();
    if (s.category) p.set('category', s.category);
    if (s.q) p.set('q', s.q);
    if (s.sort !== 'featured') p.set('sort', s.sort);
    if (s.condition) p.set('condition', s.condition);
    if (s.deals) p.set('deals', '1');
    if (s.page > 1) p.set('page', s.page);
    const qs = p.toString();
    return '/shop.html' + (qs ? '?' + qs : '');
  };

  const title = state.q ? t('results_for', { q: state.q }) : state.category ? Shop.catLabel(state.category) : state.deals ? t('deals') : t('shop_all');
  Shop.setTitle(title);

  const opt = (v, label, cur) => '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(label) + '</option>';
  app.innerHTML =
    '<nav class="crumbs" aria-label="Breadcrumb"><a href="/index.html">' + esc(t('nav_home')) + '</a><span>/</span>' +
    (state.category ? '<a href="/shop.html">' + esc(t('nav_shop')) + '</a><span>/</span><span aria-current="page">' + esc(Shop.catLabel(state.category)) + '</span>' : '<span aria-current="page">' + esc(t('nav_shop')) + '</span>') + '</nav>' +
    '<div class="page-head"><h1 class="page-title">' + esc(title) + '</h1><p id="count"></p></div>' +
    '<nav class="pills" aria-label="' + esc(t('nav_categories')) + '"><a href="' + href({ category: '', page: 1 }) + '" aria-current="' + (!state.category) + '">' + esc(t('shop_all')) + '</a>' +
    cfg.categories.map((c) => '<a href="' + href({ category: c, page: 1 }) + '" aria-current="' + (state.category === c) + '">' + Shop.CAT_ICON[c] + ' ' + esc(Shop.catLabel(c)) + '</a>').join('') + '</nav>' +
    '<form class="toolbar" id="filters" action="/shop.html">' +
    (state.q ? '<input type="hidden" name="q" value="' + esc(state.q) + '">' : '') + (state.category ? '<input type="hidden" name="category" value="' + esc(state.category) + '">' : '') +
    '<select name="sort" aria-label="' + esc(t('sort')) + '">' +
    ['featured', 'new', 'price-asc', 'price-desc', 'discount'].map((s) => opt(s, t('sort_' + s.replace('-', '_')), state.sort)).join('') + '</select>' +
    '<select name="condition" aria-label="' + esc(t('cond')) + '">' + opt('', t('any'), state.condition) + cfg.conditions.map((c) => opt(c, t('cond_' + c), state.condition)).join('') + '</select>' +
    '<label class="chk"><input type="checkbox" name="deals" value="1"' + (state.deals ? ' checked' : '') + '> ' + esc(t('deals_only')) + '</label></form>' +
    '<div class="grid" id="results">' + Shop.skeletonCards(10) + '</div><nav class="pager" id="pager" aria-label="Pages"></nav>';

  // Changing any filter reloads the page with the new filter in the address bar (so links can be shared).
  $('#filters').addEventListener('change', () => $('#filters').submit());

  const q = new URLSearchParams({ page: state.page, limit: 20, sort: state.sort });
  if (state.category) q.set('category', state.category);
  if (state.q) q.set('q', state.q);
  if (state.condition) q.set('condition', state.condition);
  if (state.deals) q.set('deals', '1');

  try {
    const data = await api('/api/products?' + q);
    $('#count').textContent = t('n_products', { n: data.total });
    $('#results').innerHTML = data.items.length
      ? Shop.gridHTML(data.items)
      : '<div class="empty">' + esc(t('none')) + '<br><a class="btn" href="/shop.html">' + esc(t('shop_all')) + '</a></div>';

    // Page links with a window of numbers around the current page.
    const pages = data.pages;
    if (pages > 1) {
      const nums = [];
      for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - state.page) <= 1) nums.push(i);
      let html = state.page > 1 ? '<a href="' + href({ page: state.page - 1 }) + '">‹ ' + esc(t('prev')) + '</a>' : '<span class="off">‹ ' + esc(t('prev')) + '</span>';
      let last = 0;
      nums.forEach((n) => {
        if (n - last > 1) html += '<span class="off">…</span>';
        html += n === state.page ? '<span aria-current="page">' + n + '</span>' : '<a href="' + href({ page: n }) + '">' + n + '</a>';
        last = n;
      });
      html += state.page < pages ? '<a href="' + href({ page: state.page + 1 }) + '">' + esc(t('next')) + ' ›</a>' : '<span class="off">' + esc(t('next')) + ' ›</span>';
      $('#pager').innerHTML = html;
    }
  } catch (e) {
    $('#results').innerHTML = '<p class="empty">' + esc(e.message) + '</p>';
  }
});
