// product.html?id=...  Product page: photos, price, rating, add to cart, share, related items.
Shop.ready.then(async (cfg) => {
  const { $, $$, esc, t, icon, api, rwf, num } = Shop;
  const app = $('#app');
  const id = new URLSearchParams(location.search).get('id') || '';

  let p;
  try {
    p = await Shop.getProduct(id);
  } catch (e) {
    Shop.setTitle(t('not_found_title'));
    app.innerHTML = '<div class="empty"><h1 class="page-title">' + esc(t('not_found_title')) + '</h1><p>' + esc(t('not_found_text')) + '</p><a class="btn" href="/shop.html">' + esc(t('nav_shop')) + '</a></div>';
    return;
  }
  Shop.setTitle(p.name);

  const out = p.stock <= 0;
  const imgs = p.images && p.images.length ? p.images : [];
  const ratedIds = Shop.store.getJSON('rated', []);
  let qty = 1;

  const ratingLine = () => (p.ratingCount
    ? Shop.stars(p.rating) + ' <b>' + p.rating.toFixed(1) + '</b> <span>(' + p.ratingCount + ')</span>'
    : '<span>' + esc(t('no_ratings')) + '</span>');

  app.innerHTML =
    '<nav class="crumbs" aria-label="Breadcrumb"><a href="/index.html">' + esc(t('nav_home')) + '</a><span>/</span><a href="/shop.html">' + esc(t('nav_shop')) + '</a><span>/</span>' +
    '<a href="' + Shop.catHref(p.category) + '">' + esc(Shop.catLabel(p.category)) + '</a><span>/</span><span aria-current="page">' + esc(p.name) + '</span></nav>' +
    '<div class="pd"><div><div class="pd-main">' + (imgs.length ? '<img id="mainImg" src="' + esc(imgs[0]) + '" alt="' + esc(p.name) + '">' : '<div class="ph-empty c-' + esc(p.category) + '" aria-hidden="true">' + Shop.CAT_ICON[p.category] + '</div>') + '</div>' +
    (imgs.length > 1 ? '<div class="pd-thumbs">' + imgs.map((u, i) => '<button type="button" data-img="' + esc(u) + '" aria-current="' + (i === 0) + '" aria-label="' + (i + 1) + '"><img src="' + esc(u) + '" alt=""></button>').join('') + '</div>' : '') + '</div>' +
    '<div class="pd-body"><h1>' + esc(p.name) + '</h1>' +
    '<div class="meta-row"><span class="rating" id="ratingLine">' + ratingLine() + '</span>' +
    (p.condition !== 'new' ? '<span class="chip">' + esc(t('cond_' + p.condition)) + '</span>' : '') +
    '<span class="dot' + (out ? ' out' : '') + '">' + esc(out ? t('sold') : p.stock <= 3 ? t('left', { n: p.stock }) : t('in_stock')) + '</span></div>' +
    '<div class="pd-price"><b>' + rwf(p.salePrice) + '</b>' + (p.discount ? '<s>' + rwf(p.price) + '</s><span class="disc">-' + p.discount + '%</span>' : '') + '</div>' +
    (p.description ? '<p class="pd-desc">' + esc(p.description) + '</p>' : '') +
    (out ? '<p class="error">' + esc(t('sold_out_msg')) + '</p>' :
      '<div class="meta-row"><span>' + esc(t('qty')) + '</span><div class="stepper"><button type="button" id="dec" aria-label="-">−</button><span id="qty">1</span><button type="button" id="inc" aria-label="+">+</button></div></div>' +
      '<div class="buy-row"><button type="button" class="btn" id="addBtn">' + icon('cart') + esc(t('add')) + '</button><button type="button" class="btn ghost" id="buyBtn">' + esc(t('buy_now')) + '</button></div>') +
    '<div class="buy-row"><button type="button" class="btn ghost" data-wish="' + esc(p._id) + '" aria-pressed="' + Shop.Wish.has(p._id) + '">' + icon('heart') + esc(t('save')) + '</button>' +
    '<a class="btn wa" target="_blank" rel="noopener" href="' + esc(Shop.waLink(t('share_text', { shop: cfg.shopName, name: p.name, price: rwf(p.salePrice) }) + ' ' + location.href)) + '">' + icon('whatsapp') + esc(t('share')) + '</a></div>' +
    '<div class="rate-box"><b>' + esc(t('rate_this')) + '</b><div id="rateStars">' + [1, 2, 3, 4, 5].map((n) => '<button type="button" class="star" data-star="' + n + '" aria-label="' + n + '">★</button>').join('') + '</div></div>' +
    '</div></div>' +
    '<section class="sec"><div class="sec-head"><h2>' + esc(t('related')) + '</h2></div><div class="grid cap" id="related">' + Shop.skeletonCards(5) + '</div></section>';

  // Photos
  $$('[data-img]').forEach((b) => b.addEventListener('click', () => {
    $('#mainImg').src = b.dataset.img;
    $$('[data-img]').forEach((x) => x.setAttribute('aria-current', String(x === b)));
  }));

  // Quantity and buying
  if (!out) {
    const show = () => { $('#qty').textContent = qty; };
    $('#dec').addEventListener('click', () => { qty = Math.max(1, qty - 1); show(); });
    $('#inc').addEventListener('click', () => { if (qty < p.stock) qty++; else Shop.toast(t('max_stock')); show(); });
    $('#addBtn').addEventListener('click', () => { Shop.Cart.add(p, qty); });
    $('#buyBtn').addEventListener('click', () => { if (Shop.Cart.add(p, qty)) location.href = '/checkout.html'; });
  }

  // Rating
  const stars = $$('#rateStars .star');
  const paint = (n) => stars.forEach((s) => s.classList.toggle('on', Number(s.dataset.star) <= n));
  stars.forEach((s) => {
    s.addEventListener('mouseenter', () => paint(Number(s.dataset.star)));
    s.addEventListener('mouseleave', () => paint(0));
    s.addEventListener('click', async () => {
      if (ratedIds.indexOf(p._id) !== -1) { Shop.toast(t('rated_already')); return; }
      try {
        const r = await api('/api/products/' + encodeURIComponent(p._id) + '/rate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stars: Number(s.dataset.star) }),
        });
        p.rating = r.rating; p.ratingCount = r.ratingCount;
        ratedIds.push(p._id);
        Shop.store.setJSON('rated', ratedIds);
        $('#ratingLine').innerHTML = ratingLine();
        Shop.toast(t('rated'));
      } catch (e) { Shop.toast(e.message); }
    });
  });

  // Related products
  try {
    const data = await api('/api/products?category=' + encodeURIComponent(p.category) + '&limit=7');
    const list = data.items.filter((x) => x._id !== p._id).slice(0, 5);
    if (list.length) $('#related').innerHTML = Shop.gridHTML(list);
    else $('#related').closest('section').remove();
  } catch (e) { $('#related').closest('section').remove(); }
});
