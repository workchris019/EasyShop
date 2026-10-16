// admin-reports.html: last 7 days of sales, best sellers, stock health.
Admin.ready.then(async ({ view, stats }) => {
  const { esc, rwf, num, $, $$ } = Admin;
  const s = stats;
  if (!s) { view.innerHTML = '<p class="empty">Could not load the numbers. Please refresh.</p>'; return; }
  const max = Math.max.apply(null, s.days.map((d) => d.total).concat([1]));
  view.innerHTML =
    '<div class="page-head"><h1>Reports</h1></div><div class="stats">' +
    '<div class="stat"><span class="ic i-green">$</span><small>Total sales</small><b>' + esc(rwf(s.revenue)) + '</b><span class="chg">Orders not cancelled</span></div>' +
    '<div class="stat"><span class="ic i-blue">#</span><small>Orders this week</small><b>' + num(s.ordersWeek) + '</b><span class="chg">' + num(s.orders) + ' in total</span></div>' +
    '<div class="stat"><span class="ic i-orange">!</span><small>Low stock</small><b>' + num(s.lowStock) + '</b><span class="chg"><a class="link" href="/admin-products.html?stock=low">See products</a></span></div>' +
    '<div class="stat"><span class="ic i-purple">0</span><small>Out of stock</small><b>' + num(s.outOfStock) + '</b><span class="chg"><a class="link" href="/admin-products.html?stock=out">See products</a></span></div></div><br>' +
    '<div class="card"><div class="card-head"><h2>Sales, last 7 days</h2></div><div class="bars">' +
    s.days.map((d) => '<div class="bcol"><div class="track"><div class="bar" data-h="' + Math.round((d.total / max) * 100) + '" title="' + esc(rwf(d.total)) + '"></div></div><b>' + esc(num(d.total)) + '</b><span>' + esc(d.label) + '</span></div>').join('') + '</div></div>' +
    '<div class="card"><div class="card-head"><h2>Best sellers</h2></div>' + (s.top.length ? '<ol class="rank">' + s.top.map((t) => '<li><span>' + esc(t.name) + '</span><span><b>' + t.qty + '</b> sold · ' + esc(rwf(t.revenue)) + '</span></li>').join('') + '</ol>' : '<p class="empty">No sales yet.</p>') + '</div>';
  $$('[data-h]').forEach((b) => { b.style.height = b.dataset.h + '%'; });
});
