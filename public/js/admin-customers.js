// admin-customers.html: customers built from their orders.
Admin.ready.then(async ({ view }) => {
  const { esc, rwf, date, api, pager, $ } = Admin;
  const q = new URLSearchParams(location.search);
  const st = { q: q.get('q') || '', page: Math.max(1, parseInt(q.get('page'), 10) || 1) };
  const LIMIT = 10;
  view.innerHTML = '<div class="page-head"><h1>Customers</h1></div><div class="card"><form class="filters" id="filters"><input type="search" name="q" placeholder="Search by name or phone..." value="' + esc(st.q) + '" aria-label="Search customers"></form><div class="tbl-wrap" id="table"><p class="empty">Loading...</p></div><div id="pager"></div></div>';
  $('#filters').addEventListener('submit', (e) => { e.preventDefault(); location.search = $('[name=q]').value.trim() ? '?q=' + encodeURIComponent($('[name=q]').value.trim()) : ''; });
  try {
    const r = await api('/api/admin/customers?limit=' + LIMIT + '&page=' + st.page + (st.q ? '&q=' + encodeURIComponent(st.q) : ''));
    $('#table').innerHTML = r.items.length
      ? '<table><thead><tr><th>Name</th><th>Phone</th><th>District</th><th>Orders</th><th>Total spent</th><th>Last order</th></tr></thead><tbody>' +
        r.items.map((c) => '<tr><td><b>' + esc(c.name) + '</b></td><td><a class="link" href="tel:+' + esc(c.phone) + '">+' + esc(c.phone) + '</a> · <a class="link" target="_blank" rel="noopener" href="https://wa.me/' + esc(c.phone) + '">WhatsApp</a></td>' +
          '<td>' + esc(c.district || '-') + '</td><td>' + c.orders + '</td><td>' + esc(rwf(c.spent)) + '</td><td class="muted">' + esc(date(c.last)) + '</td></tr>').join('') + '</tbody></table>'
      : '<p class="empty">No customers yet.</p>';
    $('#pager').innerHTML = pager(r.page, r.pages, r.total, LIMIT, 'customers');
    view.addEventListener('click', (e) => { const pg = e.target.closest('[data-page]'); if (pg && !pg.disabled) location.search = '?page=' + pg.dataset.page + (st.q ? '&q=' + encodeURIComponent(st.q) : ''); });
  } catch (e) { $('#table').innerHTML = '<p class="empty">' + esc(e.message) + '</p>'; }
});
