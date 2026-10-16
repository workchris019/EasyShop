// admin-deliveries.html: deliveries to manage, assign riders.
Admin.ready.then(async ({ view }) => {
  const { esc, date, pill, thumb, api, pager, $, $$ } = Admin;
  const q = new URLSearchParams(location.search);
  const tab = ['active', 'delivered', 'all'].indexOf(q.get('tab')) !== -1 ? q.get('tab') : 'active';
  const page = Math.max(1, parseInt(q.get('page'), 10) || 1);
  const LIMIT = 10;
  const rows = new Map();
  const STATUSES = { active: 'new,confirmed,shipped', delivered: 'delivered', all: '' };

  view.innerHTML = '<div class="page-head"><h1>Manage Deliveries</h1></div><div class="card"><div class="filters">' +
    ['active', 'delivered', 'all'].map((t) => '<a class="btn sm ' + (t === tab ? '' : 'ghost') + '" href="?tab=' + t + '">' + t.charAt(0).toUpperCase() + t.slice(1) + '</a>').join('') +
    '</div><div id="list"><p class="empty">Loading...</p></div><div id="pager"></div></div>';

  async function load() {
    const params = new URLSearchParams({ delivery: '1', page, limit: LIMIT });
    if (STATUSES[tab]) params.set('status', STATUSES[tab]);
    try {
      const r = await api('/api/admin/orders?' + params);
      r.items.forEach((o) => rows.set(o._id, o));
      $('#list').innerHTML = r.items.length ? r.items.map((o) => {
        const first = o.items[0] || {};
        return '<div class="dlv">' + thumb(first.image, 'other') + '<div class="dlv-main"><b>' + esc(o.ref) + '</b> ' + pill(o.status) +
          '<small>' + esc(o.customer.name) + ' · +' + esc(o.customer.phone) + '</small><small>' + esc(o.customer.district) + ', ' + esc(o.customer.address) + '</small>' +
          (o.driver && o.driver.name ? '<small>Rider: <b>' + esc(o.driver.name) + '</b> +' + esc(o.driver.phone) + '</small>' : '') + '</div>' +
          '<div class="dlv-end"><small class="muted">' + esc(date(o.createdAt)) + '</small><button type="button" class="btn sm' + (o.status === 'delivered' ? ' ghost' : '') + '" data-o="' + esc(o._id) + '">' +
          (o.status === 'delivered' || o.status === 'cancelled' ? 'View' : o.status === 'shipped' ? 'Track' : 'Assign Rider') + '</button></div></div>';
      }).join('') : '<p class="empty">No deliveries here.</p>';
      $('#pager').innerHTML = pager(r.page, r.pages, r.total, LIMIT, 'deliveries');
    } catch (e) { $('#list').innerHTML = '<p class="empty">' + esc(e.message) + '</p>'; }
  }
  view.addEventListener('click', (e) => {
    const pg = e.target.closest('[data-page]');
    if (pg && !pg.disabled) { location.search = '?tab=' + tab + '&page=' + pg.dataset.page; return; }
    const el = e.target.closest('[data-o]');
    if (el) Admin.openOrder(rows.get(el.dataset.o), load);
  });
  load();
});
