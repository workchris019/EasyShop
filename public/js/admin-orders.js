// admin-orders.html: all orders, filter by status, search, open details.
Admin.ready.then(async ({ view }) => {
  const { esc, rwf, date, pill, api, pager, $, STATUS, PAY } = Admin;
  const q = new URLSearchParams(location.search);
  const st = { page: Math.max(1, parseInt(q.get('page'), 10) || 1), q: q.get('q') || '', status: q.get('status') || '' };
  const LIMIT = 10;
  const rows = new Map();

  view.innerHTML = '<div class="page-head"><h1>Orders</h1></div><div class="card"><form class="filters" id="filters">' +
    '<input type="search" name="q" placeholder="Search by order number, name or phone..." value="' + esc(st.q) + '" aria-label="Search orders">' +
    '<select name="status" aria-label="Status"><option value="">All statuses</option>' + Object.keys(STATUS).map((s) => '<option value="' + s + '"' + (st.status === s ? ' selected' : '') + '>' + STATUS[s] + '</option>').join('') + '</select></form>' +
    '<div class="tbl-wrap" id="table"><p class="empty">Loading...</p></div><div id="pager"></div></div>';

  const go = (over) => {
    const s = Object.assign({}, st, over);
    const p = new URLSearchParams();
    if (s.q) p.set('q', s.q);
    if (s.status) p.set('status', s.status);
    if (s.page > 1) p.set('page', s.page);
    location.search = p.toString();
  };
  $('#filters').addEventListener('submit', (e) => { e.preventDefault(); go({ q: $('[name=q]').value.trim(), page: 1 }); });
  $('[name=status]').addEventListener('change', (e) => go({ status: e.target.value, page: 1 }));

  async function load() {
    const params = new URLSearchParams({ page: st.page, limit: LIMIT });
    if (st.q) params.set('q', st.q);
    if (st.status) params.set('status', st.status);
    try {
      const r = await api('/api/admin/orders?' + params);
      r.items.forEach((o) => rows.set(o._id, o));
      $('#table').innerHTML = r.items.length
        ? '<table><thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th></th></tr></thead><tbody>' +
          r.items.map((o) => '<tr class="click" data-o="' + esc(o._id) + '"><td><b>' + esc(o.ref) + '</b></td><td>' + esc(o.customer.name) + '<br><span class="muted">+' + esc(o.customer.phone) + '</span></td>' +
            '<td>' + o.items.reduce((s, i) => s + i.qty, 0) + '</td><td><b>' + esc(rwf(o.total)) + '</b></td><td>' + esc(PAY[o.payment.method] || '') + '</td><td>' + pill(o.status) + '</td><td class="muted">' + esc(date(o.createdAt)) + '</td>' +
            '<td><button type="button" class="btn sm ghost" data-o="' + esc(o._id) + '">View</button></td></tr>').join('') + '</tbody></table>'
        : '<p class="empty">No orders found.</p>';
      $('#pager').innerHTML = pager(r.page, r.pages, r.total, LIMIT, 'orders');
    } catch (e) { $('#table').innerHTML = '<p class="empty">' + esc(e.message) + '</p>'; }
  }
  view.addEventListener('click', (e) => {
    const pg = e.target.closest('[data-page]');
    if (pg && !pg.disabled) { go({ page: Number(pg.dataset.page) }); return; }
    const el = e.target.closest('[data-o]');
    if (el) Admin.openOrder(rows.get(el.dataset.o), load);
  });
  load();
});
