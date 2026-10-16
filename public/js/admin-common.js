// Shared by every admin page: sign-in check, sidebar, top bar, helpers, order details window.
// Each page has <body data-page="..." data-title="..."> and loads this file, then its own script.
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (n) => Number(n || 0).toLocaleString('en-US');
  const rwf = (n) => num(n) + ' RWF';
  const date = (d) => new Date(d).toLocaleString('en-GB', { timeZone: 'Africa/Kigali', dateStyle: 'medium', timeStyle: 'short' });
  const day = (d) => new Date(d).toLocaleDateString('en-GB', { timeZone: 'Africa/Kigali', dateStyle: 'long' });

  const P = {
    dashboard: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3.3 7.6L12 12l8.7-4.4M12 22V12"/>',
    cart: '<path d="M3 3h2l2.4 12h10.4l2.2-8H6"/><circle cx="9.5" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>',
    truck: '<path d="M1 6h13v10H1z"/><path d="M14 9h4l3 3v4h-7"/><circle cx="5.5" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M22 21v-1a6 6 0 0 0-4-5.6"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M3 17l5-5 4 4 3-3 6 6"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    settings: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    store: '<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9v11h16V9"/><path d="M4 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 4 0"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  };
  const icon = (n) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[n] + '</svg>';
  const LOGO = '<svg viewBox="0 0 40 44" aria-hidden="true"><path d="M6 14h28l2 26a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#4F46E5"/><path d="M13 14v-3a7 7 0 0 1 14 0v3" fill="none" stroke="#6366F1" stroke-width="3.5" stroke-linecap="round"/><path d="M14 26c2.4 4.6 9.6 4.6 12 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>';

  const STATUS = { new: 'New', confirmed: 'Processing', shipped: 'On the way', delivered: 'Delivered', cancelled: 'Cancelled' };
  const pill = (s) => '<span class="pill p-' + esc(s) + '">' + esc(STATUS[s] || s) + '</span>';
  const PAY = { mtn: 'MTN MoMo', airtel: 'Airtel Money', cod: 'Pay on delivery' };
  const COND = { new: 'New', 'like-new': 'Like new', used: 'Used' };
  const CAT = { phones: 'Phones', electronics: 'Electronics', clothes: 'Clothes', shoes: 'Shoes', home: 'Home & Kitchen', beauty: 'Beauty', baby: 'Baby & Kids', other: 'Other' };
  const CAT_ICON = { phones: '📱', electronics: '🎧', clothes: '👕', shoes: '👟', home: '🏠', beauty: '💄', baby: '🧸', other: '✨' };
  const thumb = (img, cat) => '<span class="thumb">' + (img ? '<img src="' + esc(img) + '" alt="" loading="lazy">' : (CAT_ICON[cat] || '🛍️')) + '</span>';

  let toastTimer;
  function toast(msg, bad) {
    let el = $('#toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.toggle('bad', !!bad);
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2800);
  }
  // Show a message on the next page (used after saving, then going back to a list).
  const flash = (msg) => { try { sessionStorage.setItem('adminFlash', msg); } catch (e) { /* ignore */ } };

  async function api(path, opts) {
    let res;
    try { res = await fetch(path, Object.assign({ credentials: 'same-origin' }, opts || {})); } catch (e) { throw new Error('No connection. Check your internet and try again.'); }
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && path.indexOf('/login') === -1 && document.body.dataset.page !== 'login') { location.href = '/admin-login.html'; return new Promise(() => {}); }
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  }
  const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  // "Showing 1 to 10 of 24 items" plus page buttons. The page script listens for clicks on [data-page].
  function pager(page, pages, total, limit, noun) {
    if (!total) return '';
    const from = (page - 1) * limit + 1;
    const to = Math.min(total, page * limit);
    const nums = [];
    for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    let btns = '<button type="button" data-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + ' aria-label="Previous">‹</button>';
    let last = 0;
    nums.forEach((n) => {
      if (n - last > 1) btns += '<button type="button" disabled>…</button>';
      btns += '<button type="button" data-page="' + n + '"' + (n === page ? ' aria-current="page"' : '') + '>' + n + '</button>';
      last = n;
    });
    btns += '<button type="button" data-page="' + (page + 1) + '"' + (page >= pages ? ' disabled' : '') + ' aria-label="Next">›</button>';
    return '<div class="pager"><span>Showing ' + from + ' to ' + to + ' of ' + total + ' ' + noun + '</span><div class="pgs">' + btns + '</div></div>';
  }

  /* ---------- Order details window (used on dashboard, orders and deliveries pages) ---------- */
  function openOrder(order, onChange) {
    let dlg = $('#orderDlg');
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.id = 'orderDlg';
      document.body.appendChild(dlg);
      dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    }
    let o = order;

    async function change(path, body) {
      try {
        o = await api('/api/admin/orders/' + o._id + path, json('PATCH', body));
        toast('Order updated');
        draw();
        if (onChange) onChange(o);
      } catch (e) { toast(e.message, true); }
    }

    function draw() {
      const c = o.customer;
      const closed = o.status === 'delivered' || o.status === 'cancelled';
      dlg.innerHTML = '<div class="dlg"><div class="dlg-head"><div><h2>Order ' + esc(o.ref) + '</h2><span class="muted">' + esc(date(o.createdAt)) + '</span></div>' +
        '<div>' + pill(o.status) + ' <button type="button" class="icon-btn" data-x aria-label="Close">' + icon('x') + '</button></div></div>' +
        '<div class="sub-h">Customer</div><div class="sec-line"><span>' + esc(c.name) + '</span><span><a class="link" href="tel:+' + esc(c.phone) + '">+' + esc(c.phone) + '</a> · <a class="link" target="_blank" rel="noopener" href="https://wa.me/' + esc(c.phone) + '">WhatsApp</a></span></div>' +
        '<div class="sec-line"><span class="muted">' + (o.deliveryMethod === 'pickup' ? 'Customer will pick up' : 'Deliver to') + '</span><span>' + (o.deliveryMethod === 'pickup' ? '' : esc(c.district + ', ' + c.address)) + '</span></div>' +
        '<div class="sub-h">Items</div>' + o.items.map((i) => '<div class="sec-line"><span>' + i.qty + ' × ' + esc(i.name) + '</span><span>' + esc(rwf(i.price * i.qty)) + '</span></div>').join('') +
        '<div class="sec-line"><span class="muted">Delivery</span><span>' + (o.deliveryFee ? esc(rwf(o.deliveryFee)) : 'Free / none') + '</span></div>' +
        '<div class="sec-line total"><span>Total</span><span>' + esc(rwf(o.total)) + '</span></div>' +
        '<div class="sec-line"><span class="muted">Payment</span><span>' + esc(PAY[o.payment.method] || o.payment.method) + (o.payment.reference ? ', ID ' + esc(o.payment.reference) : '') + '</span></div>' +
        '<div class="sub-h">Status</div><div class="row2"><div class="field"><select id="stSel" aria-label="Order status">' +
        Object.keys(STATUS).map((s) => '<option value="' + s + '"' + (s === o.status ? ' selected' : '') + (o.status === 'cancelled' && s !== 'cancelled' ? ' disabled' : '') + '>' + STATUS[s] + '</option>').join('') + '</select></div>' +
        '<div class="field"><button type="button" class="btn" id="stBtn">Update status</button></div></div>' +
        (o.deliveryMethod === 'delivery'
          ? '<div class="sub-h">Delivery rider</div>' + (o.driver && o.driver.name ? '<p class="muted">Assigned: <b>' + esc(o.driver.name) + '</b> +' + esc(o.driver.phone) + '</p>' : '<p class="muted">No rider assigned yet.</p>') +
            (closed ? '' : '<div class="row2"><div class="field"><label for="dName">Rider name</label><input id="dName" maxlength="60" value="' + esc((o.driver && o.driver.name) || '') + '"></div>' +
              '<div class="field"><label for="dPhone">Rider phone</label><input id="dPhone" type="tel" placeholder="07xx xxx xxx" value="' + esc((o.driver && o.driver.phone) || '') + '"></div></div>' +
              '<button type="button" class="btn ghost" id="dBtn">' + icon('truck') + ' Assign rider and mark on the way</button>')
          : '') + '</div>';
      $('#stBtn', dlg).addEventListener('click', () => change('', { status: $('#stSel', dlg).value }));
      const d = $('#dBtn', dlg);
      if (d) d.addEventListener('click', () => change('/driver', { name: $('#dName', dlg).value, phone: $('#dPhone', dlg).value }));
      $('[data-x]', dlg).addEventListener('click', () => dlg.close());
    }
    draw();
    dlg.showModal();
  }

  /* ---------- Page shell ---------- */
  const page = document.body.dataset.page;
  const NAV = [
    ['dashboard', '/admin.html', 'Dashboard', 'dashboard'], ['products', '/admin-products.html', 'Products', 'box'], ['orders', '/admin-orders.html', 'Orders', 'cart'],
    ['deliveries', '/admin-deliveries.html', 'Deliveries', 'truck'], ['customers', '/admin-customers.html', 'Customers', 'users'],
    ['hero', '/admin-hero.html', 'Hero banners', 'image'], ['reports', '/admin-reports.html', 'Reports', 'chart'], ['settings', '/admin-settings.html', 'Settings', 'settings'],
  ];

  function renderShell(me, stats) {
    const nb = { orders: stats && stats.newOrders, deliveries: stats && stats.activeDeliveries };
    $('#shell').innerHTML =
      '<div class="shell"><aside class="side" id="side"><div class="brand">' + LOGO + '<b>ShopEasy<small>Admin</small></b></div>' +
      '<nav class="nav" aria-label="Admin">' + NAV.map((n) => '<a href="' + n[1] + '"' + (page === n[0] ? ' aria-current="page"' : '') + '>' + icon(n[3]) + n[2] + (nb[n[0]] ? '<span class="nb">' + nb[n[0]] + '</span>' : '') + '</a>').join('') + '</nav>' +
      '<div class="side-foot"><a href="/index.html" target="_blank" rel="noopener">' + icon('store') + 'View shop</a><button type="button" id="logout">' + icon('logout') + 'Logout</button></div></aside>' +
      '<div class="main-col"><header class="top"><button type="button" class="icon-btn menu-btn" id="menuBtn" aria-label="Menu">' + icon('menu') + '</button>' +
      '<form class="gsearch" id="gsearch" role="search">' + icon('search') + '<input type="search" id="gq" placeholder="Search orders, products, customers..." aria-label="Search"></form>' +
      '<div class="top-right"><a class="icon-btn" href="/admin-orders.html?status=new" aria-label="New orders">' + icon('bell') + (stats && stats.newOrders ? '<span class="dot-badge">' + stats.newOrders + '</span>' : '') + '</a>' +
      '<div class="me"><span class="avatar">' + esc(me.username.charAt(0)) + '</span><div><b>' + esc(me.username) + '</b><small>Store admin</small></div></div></div></header>' +
      '<main id="view"></main></div></div>';

    const side = $('#side');
    let scrim = null;
    const close = () => { side.classList.remove('open'); if (scrim) { scrim.remove(); scrim = null; } };
    $('#menuBtn').addEventListener('click', () => {
      side.classList.add('open');
      scrim = document.createElement('div');
      scrim.className = 'scrim';
      scrim.addEventListener('click', close);
      document.body.appendChild(scrim);
    });
    $('#logout').addEventListener('click', async () => { await api('/api/admin/logout', { method: 'POST' }).catch(() => {}); location.href = '/admin-login.html'; });
    $('#gsearch').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = $('#gq').value.trim();
      if (!v) return;
      // Order numbers (IS...) and phone numbers go to Orders; everything else to Products.
      const looksLikeOrder = /^[A-Za-z]{2}[A-Za-z0-9]{4,}$/.test(v) && /\d/.test(v) || /^\+?\d[\d\s]{4,}$/.test(v);
      location.href = (looksLikeOrder ? '/admin-orders.html?q=' : '/admin-products.html?q=') + encodeURIComponent(v);
    });
    document.title = (document.body.dataset.title || 'Admin') + ' | ShopEasy Admin';
  }

  const ready = (async () => {
    if (page === 'login') return {};
    const me = await api('/api/admin/me');
    const stats = await api('/api/admin/stats').catch(() => null);
    renderShell(me, stats);
    let msg = null;
    try { msg = sessionStorage.getItem('adminFlash'); sessionStorage.removeItem('adminFlash'); } catch (e) { /* ignore */ }
    if (msg) toast(msg);
    return { view: $('#view'), me, stats };
  })();

  window.Admin = { $, $$, esc, num, rwf, date, day, icon, LOGO, pill, thumb, toast, flash, api, json, pager, openOrder, ready, STATUS, PAY, COND, CAT, CAT_ICON };
})();
