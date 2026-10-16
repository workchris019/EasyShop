// wishlist.html: products saved with the heart button (kept on this phone).
Shop.ready.then(async () => {
  const { $, esc, t, api } = Shop;
  const app = $('#app');
  Shop.setTitle(t('wishlist'));

  async function render() {
    const ids = Shop.Wish.ids();
    app.innerHTML = '<nav class="crumbs"><a href="/index.html">' + esc(t('nav_home')) + '</a><span>/</span><span aria-current="page">' + esc(t('wl_title')) + '</span></nav>' +
      '<div class="page-head"><h1 class="page-title">' + esc(t('wl_title')) + '</h1></div><div class="grid" id="list"></div>';
    const list = $('#list');
    if (!ids.length) {
      list.innerHTML = '<div class="empty">' + esc(t('wl_empty')) + '<br><a class="btn" href="/shop.html">' + esc(t('nav_shop')) + '</a></div>';
      return;
    }
    list.innerHTML = Shop.skeletonCards(Math.min(ids.length, 5));
    try {
      const data = await api('/api/products?ids=' + ids.join(','));
      list.innerHTML = data.items.length ? Shop.gridHTML(data.items) : '<div class="empty">' + esc(t('wl_empty')) + '</div>';
    } catch (e) { list.innerHTML = '<p class="empty">' + esc(e.message) + '</p>'; }
  }

  // Un-hearting an item removes it from this page.
  document.addEventListener('shop:wish', (e) => {
    if (!e.detail.on) {
      const btn = document.querySelector('[data-wish="' + e.detail.id + '"]');
      const card = btn && btn.closest('.card');
      if (card) card.remove();
      if (!Shop.Wish.ids().length) render();
    }
  });
  render();
});
