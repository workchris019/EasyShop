// 404.html
Shop.ready.then(() => {
  const { $, esc, t } = Shop;
  Shop.setTitle(t('not_found_title'));
  $('#app').innerHTML = '<div class="empty"><h1 class="page-title">' + esc(t('not_found_title')) + '</h1><p>' + esc(t('not_found_text')) + '</p><a class="btn" href="/index.html">' + esc(t('nav_home')) + '</a></div>';
});
