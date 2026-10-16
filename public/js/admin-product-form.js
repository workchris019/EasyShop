// admin-product-form.html: add a product, or edit one (?id=...). Photos: drag and drop or pick.
Admin.ready.then(async ({ view }) => {
  const { esc, rwf, icon, api, toast, flash, $, $$, CAT, COND } = Admin;
  const id = new URLSearchParams(location.search).get('id');
  let p = null;
  if (id) {
    try { p = await api('/api/admin/products/' + encodeURIComponent(id)); } catch (e) { view.innerHTML = '<p class="empty">' + esc(e.message) + '</p>'; return; }
  }
  document.title = (p ? 'Edit product' : 'Add new product') + ' | ShopEasy Admin';

  const existing = p ? p.images.slice() : [];
  const removed = [];
  const files = [];
  const v = (k, d) => esc(p && p[k] !== undefined ? p[k] : d);

  view.innerHTML =
    '<form id="f" novalidate><div class="page-head"><div><a class="link" href="/admin-products.html">‹ Back to products</a><h1>' + (p ? 'Edit Product' : 'Add New Product') + '</h1></div>' +
    '<button type="submit" class="btn" id="save">' + icon('plus') + 'Save Product</button></div><div id="err" class="error" role="alert" hidden></div>' +
    '<div class="form-grid"><div class="card"><h2 class="sub-h">Product Details</h2>' +
    '<div class="field"><label for="name">Product Name *</label><input id="name" name="name" maxlength="120" required placeholder="e.g. Nike Air Zoom Pegasus 40" value="' + v('name', '') + '"></div>' +
    '<div class="field"><label for="category">Category *</label><select id="category" name="category">' + Object.keys(CAT).map((c) => '<option value="' + c + '"' + (p && p.category === c ? ' selected' : '') + '>' + esc(CAT[c]) + '</option>').join('') + '</select></div>' +
    '<fieldset><legend>Product Type *</legend><div class="radios">' + Object.keys(COND).map((c) => '<label><input type="radio" name="condition" value="' + c + '"' + ((p ? p.condition : 'new') === c ? ' checked' : '') + '> ' + esc(COND[c]) + '</label>').join('') + '</div></fieldset>' +
    '<div class="row2"><div class="field"><label for="price">Price (RWF) *</label><input id="price" name="price" type="number" min="1" step="1" inputmode="numeric" placeholder="25000" required value="' + v('price', '') + '"></div>' +
    '<div class="field"><label for="discount">Discount (%)</label><input id="discount" name="discount" type="number" min="0" max="90" step="1" inputmode="numeric" value="' + v('discount', 0) + '"><span class="hint">Optional. Customers see the old price crossed out.</span></div></div>' +
    '<div class="final-price" id="final"></div><br>' +
    '<div class="row2"><div class="field"><label for="stock">Stock Quantity *</label><input id="stock" name="stock" type="number" min="0" step="1" inputmode="numeric" required value="' + v('stock', 1) + '"></div></div>' +
    '<label class="check"><input type="checkbox" id="featured"' + (p && p.featured ? ' checked' : '') + '> Show in "Featured Products" on the home page</label></div>' +
    '<div class="card"><h2 class="sub-h">Description</h2><div class="field"><textarea id="description" name="description" rows="6" maxlength="2000" placeholder="Enter product description...">' + esc(p ? p.description : '') + '</textarea></div>' +
    '<h2 class="sub-h">Product Photos</h2><div class="drop" id="drop" tabindex="0" role="button">' + icon('upload') + '<span><b>Click to upload</b> or drag and drop</span><span class="hint">PNG, JPG or WEBP, up to 4 photos. Big photos are shrunk automatically.</span></div>' +
    '<input type="file" id="pick" accept="image/jpeg,image/png,image/webp" multiple hidden><div class="thumbs" id="thumbs"></div></div></div></form>';

  const price = () => {
    const pr = Number($('#price').value) || 0;
    const d = Math.min(90, Math.max(0, Number($('#discount').value) || 0));
    $('#final').textContent = 'Customers pay: ' + rwf(Math.round(pr * (100 - d) / 100)) + (d ? ' (was ' + rwf(pr) + ')' : '');
  };
  $('#price').addEventListener('input', price);
  $('#discount').addEventListener('input', price);
  price();

  const urls = new Map();
  function thumbs() {
    const html = existing.map((u, i) => '<div class="tb"><img src="' + esc(u) + '" alt=""><button type="button" data-rm-old="' + i + '" aria-label="Remove">' + icon('x') + '</button></div>').join('') +
      files.map((f, i) => { if (!urls.has(f)) urls.set(f, URL.createObjectURL(f)); return '<div class="tb"><img src="' + urls.get(f) + '" alt=""><button type="button" data-rm-new="' + i + '" aria-label="Remove">' + icon('x') + '</button></div>'; }).join('');
    $('#thumbs').innerHTML = html;
  }
  function add(list) {
    Array.from(list).filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type)).forEach((f) => {
      if (existing.length + files.length >= 4) { toast('A product can have up to 4 photos.', true); return; }
      files.push(f);
    });
    thumbs();
  }
  $('#drop').addEventListener('click', () => $('#pick').click());
  $('#drop').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#pick').click(); } });
  $('#pick').addEventListener('change', (e) => { add(e.target.files); e.target.value = ''; });
  ['dragover', 'dragenter'].forEach((n) => $('#drop').addEventListener(n, (e) => { e.preventDefault(); $('#drop').classList.add('over'); }));
  ['dragleave', 'drop'].forEach((n) => $('#drop').addEventListener(n, (e) => { e.preventDefault(); $('#drop').classList.remove('over'); }));
  $('#drop').addEventListener('drop', (e) => add(e.dataTransfer.files));
  $('#thumbs').addEventListener('click', (e) => {
    const o = e.target.closest('[data-rm-old]');
    const n = e.target.closest('[data-rm-new]');
    if (o) removed.push(existing.splice(Number(o.dataset.rmOld), 1)[0]);
    if (n) files.splice(Number(n.dataset.rmNew), 1);
    thumbs();
  });
  thumbs();

  $('#f').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('#err');
    const btn = $('#save');
    err.hidden = true;
    btn.disabled = true;
    const fd = new FormData();
    ['name', 'category', 'price', 'discount', 'stock', 'description'].forEach((k) => fd.append(k, $('#' + k).value));
    fd.append('condition', $('input[name=condition]:checked').value);
    fd.append('featured', $('#featured').checked ? 'true' : 'false');
    files.forEach((f) => fd.append('images', f));
    if (p) fd.append('removeImages', JSON.stringify(removed));
    try {
      await api('/api/admin/products' + (p ? '/' + p._id : ''), { method: p ? 'PATCH' : 'POST', body: fd });
      flash(p ? 'Product saved' : 'Product added');
      location.href = '/admin-products.html';
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
      err.scrollIntoView({ block: 'center' });
      btn.disabled = false;
    }
  });
});
