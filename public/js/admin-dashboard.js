// admin.html: welcome, key numbers, recent orders, deliveries to manage, low stock.
Admin.ready.then(async ({ view, me, stats }) => {
  const { esc, rwf, num, date, day, icon, pill, thumb, api, LOGO, $, $$ } = Admin;
  const s = stats || {};

  const change = (pct, fallback) => (pct === null || pct === undefined
    ? '<span class="muted">' + esc(fallback) + '</span>'
    : '<span class="' + (pct >= 0 ? 'up' : 'down') + '">' + (pct >= 0 ? '↑ ' : '↓ ') + Math.abs(pct) + '%</span> from last week');

  view.innerHTML =
    '<div class="dash"><div>' +
    '<div class="card welcome"><span class="logo-tile">' + LOGO + '</span><div><h1>Welcome, ' + esc(me.username) + '!</h1><p>Here\'s what\'s happening with your store today.</p></div>' +
    '<div class="today">' + icon('calendar') + '<div><small>Today</small><b>' + esc(day(new Date())) + '</b></div></div></div>' +
    '<div class="stats">' +
    '<div class="stat"><span class="ic i-blue">' + icon('box') + '</span><small>Total Products</small><b>' + num(s.products) + '</b><span class="chg">' + (s.productsWeek ? '<span class="up">+' + s.productsWeek + '</span> added this week' : 'None added this week') + '</span></div>' +
    '<div class="stat"><span class="ic i-green">' + icon('cart') + '</span><small>Total Orders</small><b>' + num(s.orders) + '</b><span class="chg">' + change(s.ordersChange, (s.ordersWeek || 0) + ' this week') + '</span></div>' +
    '<div class="stat"><span class="ic i-orange">' + icon('truck') + '</span><small>Deliveries In Progress</small><b>' + num(s.shipped) + '</b><span class="chg">' + num(s.activeDeliveries) + ' active in total</span></div>' +
    '<div class="stat"><span class="ic i-purple">' + icon('users') + '</span><small>Total Customers</small><b>' + num(s.customers) + '</b><span class="chg">' + change(s.customersChange, (s.customersWeek || 0) + ' new this week') + '</span></div></div>' +
    '<div class="card"><div class="card-head"><h2>Recent Orders</h2><a class="link" href="/admin-orders.html">View All</a></div><div class="tbl-wrap" id="recent"><p class="empty">Loading...</p></div></div>' +
    '</div><div>' +
    '<div class="card"><div class="card-head"><h2>Manage Deliveries</h2><a class="link" href="/admin-deliveries.html">View All</a></div><div id="dlv"><p class="empty">Loading...</p></div></div>' +
    '<div class="card"><div class="card-head"><h2>Low stock</h2><a class="link" href="/admin-products.html?stock=low">View All</a></div><div id="low"><p class="empty">Loading...</p></div></div>' +
    '</div></div>';

  const orders = new Map();
  const open = (id) => Admin.openOrder(orders.get(id), () => loadLists());

  async function loadLists() {
  try {
    const r = await api('/api/admin/orders?limit=5');
    r.items.forEach((o) => orders.set(o._id, o));
    $('#recent').innerHTML = r.items.length
      ? '<table><thead><tr><th>Order #</th><th>Customer</th><th>Total</th><th>Status</th><th>Delivery</th><th>Date</th></tr></thead><tbody>' +
        r.items.map((o) => '<tr class="click" data-o="' + esc(o._id) + '"><td><b>' + esc(o.ref) + '</b></td><td>' + esc(o.customer.name) + '</td><td>' + esc(rwf(o.total)) + '</td><td>' + pill(o.status) + '</td>' +
          '<td>' + (o.deliveryMethod === 'pickup' ? '<span class="muted">Pickup</span>' : o.driver && o.driver.name ? esc(o.driver.name) : '<span class="muted">Not assigned</span>') + '</td><td class="muted">' + esc(date(o.createdAt)) + '</td></tr>').join('') + '</tbody></table>'
      : '<p class="empty">No orders yet. They will appear here as soon as customers order.</p>';
  } catch (e) { $('#recent').innerHTML = '<p class="empty">' + esc(e.message) + '</p>'; }

  try {
    const r = await api('/api/admin/orders?delivery=1&status=new,confirmed,shipped&limit=5');
    r.items.forEach((o) => orders.set(o._id, o));
    $('#dlv').innerHTML = r.items.length ? r.items.map((o) => {
      const first = o.items[0] || {};
      return '<div class="dlv">' + thumb(first.image, 'other') + '<div class="dlv-main"><b>' + esc(o.ref) + '</b> ' + pill(o.status) + '<small>' + esc(o.customer.name) + '</small><small>' + esc(o.customer.district) + '</small></div>' +
        '<div class="dlv-end"><small class="muted">' + esc(date(o.createdAt)) + '</small><button type="button" class="btn sm" data-o="' + esc(o._id) + '">' + (o.status === 'shipped' ? 'Track' : 'Assign Rider') + '</button></div></div>';
    }).join('') : '<p class="empty">No deliveries waiting.</p>';
  } catch (e) { $('#dlv').innerHTML = '<p class="empty">' + esc(e.message) + '</p>'; }

  try {
    const r = await api('/api/admin/products?stock=low&limit=5');
    $('#low').innerHTML = r.items.length ? r.items.map((p) => '<div class="dlv">' + thumb(p.images && p.images[0], p.category) + '<div class="dlv-main"><b>' + esc(p.name) + '</b><small>' + p.stock + ' left</small></div>' +
      '<div class="dlv-end"><a class="btn sm ghost" href="/admin-product-form.html?id=' + esc(p._id) + '">Restock</a></div></div>').join('') : '<p class="empty">Nothing is running low.</p>';
  } catch (e) { $('#low').innerHTML = '<p class="empty">' + esc(e.message) + '</p>'; }

  }

  view.addEventListener('click', (e) => {
    const el = e.target.closest('[data-o]');
    if (el) open(el.dataset.o);
  });
  loadLists();
});
