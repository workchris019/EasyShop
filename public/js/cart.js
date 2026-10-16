// cart.html: cart lines, quantities, free-delivery progress, link to checkout.
Shop.ready.then(async (cfg) => {
  const { $, $$, esc, t, rwf, Cart } = Shop;
  const app = $('#app');
  Shop.setTitle(t('cart'));

  try { await Cart.refresh(); } catch (e) { /* offline: show what we have */ }

  function render() {
    const items = Cart.all();
    if (!items.length) {
      app.innerHTML = '<div class="empty"><h1 class="page-title">' + esc(t('cart_title')) + '</h1><p>' + esc(t('cart_empty')) + '</p><a class="btn" href="/shop.html">' + esc(t('continue')) + '</a></div>';
      return;
    }
    const sub = Cart.subtotal();
    const over = cfg.freeDeliveryOver;
    let promo = '';
    if (over > 0) {
      const done = sub >= over;
      promo = '<div class="progress"><i data-w="' + Math.min(100, Math.round((sub / over) * 100)) + '"></i></div><p class="hint ' + (done ? 'note-ok' : '') + '">' +
        esc(done ? t('free_unlock') : t('free_more', { amt: rwf(over - sub) })) + '</p>';
    }
    app.innerHTML =
      '<nav class="crumbs"><a href="/index.html">' + esc(t('nav_home')) + '</a><span>/</span><span aria-current="page">' + esc(t('cart_title')) + '</span></nav>' +
      '<div class="page-head"><h1 class="page-title">' + esc(t('cart_title')) + '</h1></div>' +
      '<div class="two-col"><div class="box">' + items.map((l) =>
        '<div class="line"><a class="thumb c-' + esc(l.category || 'other') + '" href="/product.html?id=' + esc(l.id) + '">' + (l.image ? '<img src="' + esc(l.image) + '" alt="">' : Shop.CAT_ICON[l.category] || '🛍️') + '</a>' +
        '<div><a class="line-name" href="/product.html?id=' + esc(l.id) + '">' + esc(l.name) + '</a><div class="line-sub">' + esc(rwf(l.price)) + '</div>' +
        '<div class="stepper"><button type="button" data-dec="' + esc(l.id) + '" aria-label="-">−</button><span>' + l.qty + '</span><button type="button" data-inc="' + esc(l.id) + '" aria-label="+">+</button></div></div>' +
        '<div class="line-end"><b>' + esc(rwf(l.price * l.qty)) + '</b><button type="button" class="rm" data-rm="' + esc(l.id) + '">' + esc(t('remove')) + '</button></div></div>').join('') + '</div>' +
      '<aside class="box"><h2>' + esc(t('order_summary')) + '</h2>' +
      '<div class="sum"><span>' + esc(t('items')) + '</span><span>' + esc(rwf(sub)) + '</span></div>' +
      '<div class="sum"><span>' + esc(t('delivery')) + '</span><span class="hint">' + esc(t('delivery_note')) + '</span></div>' + promo +
      '<div class="sum total"><span>' + esc(t('total')) + '</span><span>' + esc(rwf(sub)) + '</span></div>' +
      '<div class="stack"><a class="btn block" href="/checkout.html">' + esc(t('go_checkout')) + '</a><a class="btn ghost block" href="/shop.html">' + esc(t('continue')) + '</a></div></aside></div>';
    $$('[data-w]').forEach((el) => { el.style.width = el.dataset.w + '%'; });
  }

  app.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    const line = d.inc || d.dec || d.rm ? Cart.all().filter((l) => l.id === (d.inc || d.dec || d.rm))[0] : null;
    if (!line) return;
    if (d.inc) { if (line.qty < line.stock) Cart.set(line.id, line.qty + 1); else Shop.toast(t('max_stock')); }
    else if (d.dec) Cart.set(line.id, line.qty - 1);
    else if (d.rm) Cart.remove(line.id);
    render();
  });

  render();
});
