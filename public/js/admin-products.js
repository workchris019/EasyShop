// admin-products.html: list, search, filter, edit, delete (one or many).
Admin.ready.then(async ({ view }) => {
  const { esc, rwf, num, icon, pill, thumb, api, json, pager, toast, $, $$, CAT, COND } = Admin;
  const q = new URLSearchParams(location.search);
  const st = { page: Math.max(1, parseInt(q.get('page'), 10) || 1), q: q.get('q') || '', category: q.get('category') || '', condition: q.get('condition') || '', stock: q.get('stock') || '' };
  const LIMIT = 10;
  const selected = new Set();
  let items = [];

  const opt = (v, l, cur) => '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(l) + '</option>';
  view.innerHTML =
    '<div class="page-head"><h1>Manage Products</h1><a class="btn" href="/admin-product-form.html">' + icon('plus') + 'Add Product</a></div>' +
    '<div class="card"><form class="filters" id="filters"><input type="search" name="q" placeholder="Search products..." value="' + esc(st.q) + '" aria-label="Search products">' +
    '<select name="category" aria-label="Category">' + opt('', 'All Categories', st.category) + Object.keys(CAT).map((c) => opt(c, CAT[c], st.category)).join('') + '</select>' +
    '<select name="condition" aria-label="Type">' + opt('', 'All Types', st.condition) + Object.keys(COND).map((c) => opt(c, COND[c], st.condition)).join('') + '</select>' +
    '<select name="stock" aria-label="Stock">' + opt('', 'Any stock', st.stock) + opt('in', 'In stock', st.stock) + opt('low', 'Low stock', st.stock) + opt('out', 'Out of stock', st.stock) + '</select></form>' +
    '<div class="bulk" id="bulk" hidden><b id="bulkN"></b><button type="button" class="btn sm danger" id="bulkDel">' + icon('trash') + 'Delete selected</button></div>' +
    '<div class="tbl-wrap" id="table"><p class="empty">Loading...</p></div><div id="pager"></div></div>';

  const go = (over) => {
    const s = Object.assign({}, st, over);
    const p = new URLSearchParams();
    ['q', 'category', 'condition', 'stock'].forEach((k) => { if (s[k]) p.set(k, s[k]); });
    if (s.page > 1) p.set('page', s.page);
    location.search = p.toString();
  };
  $('#filters').addEventListener('submit', (e) => { e.preventDefault(); go({ q: $('[name=q]').value.trim(), page: 1 }); });
  $$('#filters select').forEach((sel) => sel.addEventListener('change', () => go({ [sel.name]: sel.value, page: 1 })));

  const stockPill = (n) => (n <= 0 ? '<span class="pill p-out">Out of Stock</span>' : n <= 3 ? '<span class="pill p-low">Low Stock</span>' : '<span class="pill p-in">In Stock</span>');

  function bulkUI() {
    $('#bulk').hidden = selected.size === 0;
    $('#bulkN').textContent = selected.size + ' selected';
  }

  async function load() {
    const params = new URLSearchParams({ page: st.page, limit: LIMIT });
    ['q', 'category', 'condition', 'stock'].forEach((k) => { if (st[k]) params.set(k, st[k]); });
    try {
      const r = await api('/api/admin/products?' + params);
      items = r.items;
      $('#table').innerHTML = items.length
        ? '<table><thead><tr><th><input type="checkbox" id="all" aria-label="Select all"></th><th>Image</th><th>Product Name</th><th>Category</th><th>Type</th><th>Price</th><th>Stock</th><th>Likes</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
          items.map((p) => '<tr><td><input type="checkbox" data-sel="' + esc(p._id) + '" aria-label="Select"></td><td>' + thumb(p.images && p.images[0], p.category) + '</td>' +
            '<td><b>' + esc(p.name) + '</b>' + (p.featured ? ' <span class="pill p-shipped">Featured</span>' : '') + '</td><td>' + esc(CAT[p.category] || p.category) + '</td><td class="muted">' + esc(COND[p.condition] || p.condition) + '</td>' +
            '<td><b>' + esc(rwf(p.salePrice)) + '</b>' + (p.discount ? '<span class="old">' + esc(num(p.price)) + '</span> <span class="pill p-new">-' + p.discount + '%</span>' : '') + '</td>' +
            '<td>' + p.stock + '</td><td>' + (p.likes || 0) + '</td><td>' + stockPill(p.stock) + '</td>' +
            '<td><div class="actions"><a class="btn sm" href="/admin-product-form.html?id=' + esc(p._id) + '">' + icon('edit') + 'Edit</a><button type="button" class="btn sm outline-danger" data-del="' + esc(p._id) + '">Delete</button></div></td></tr>').join('') + '</tbody></table>'
        : '<p class="empty">No products found.</p>';
      $('#pager').innerHTML = pager(r.page, r.pages, r.total, LIMIT, 'products');
      bulkUI();
    } catch (e) { $('#table').innerHTML = '<p class="empty">' + esc(e.message) + '</p>'; }
  }

  view.addEventListener('click', async (e) => {
    const pg = e.target.closest('[data-page]');
    if (pg && !pg.disabled) { go({ page: Number(pg.dataset.page) }); return; }
    const del = e.target.closest('[data-del]');
    if (del) {
      const p = items.find((x) => x._id === del.dataset.del);
      if (!confirm('Delete "' + p.name + '"? This cannot be undone.')) return;
      try { await api('/api/admin/products/' + p._id, { method: 'DELETE' }); toast('Product deleted'); selected.delete(p._id); load(); } catch (ex) { toast(ex.message, true); }
    }
  });
  view.addEventListener('change', (e) => {
    if (e.target.id === 'all') { $$('[data-sel]').forEach((c) => { c.checked = e.target.checked; e.target.checked ? selected.add(c.dataset.sel) : selected.delete(c.dataset.sel); }); bulkUI(); }
    else if (e.target.dataset.sel) { e.target.checked ? selected.add(e.target.dataset.sel) : selected.delete(e.target.dataset.sel); bulkUI(); }
  });
  $('#bulkDel').addEventListener('click', async () => {
    if (!confirm('Delete ' + selected.size + ' products? This cannot be undone.')) return;
    try { const r = await api('/api/admin/products/delete-many', json('POST', { ids: Array.from(selected) })); toast(r.deleted + ' products deleted'); selected.clear(); load(); } catch (ex) { toast(ex.message, true); }
  });
  load();
});
