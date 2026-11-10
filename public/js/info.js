// about.html and contact.html
Shop.ready.then((cfg) => {
  const { $, esc, t, icon } = Shop;
  const page = document.body.dataset.page;
  const app = $('#app');

  if (page === 'about') {
    Shop.setTitle(t('about_title'));
    app.innerHTML = '<nav class="crumbs"><a href="/index.html">' + esc(t('nav_home')) + '</a><span>/</span><span aria-current="page">' + esc(t('about_title')) + '</span></nav>' +
      '<h1 class="page-title">' + esc(t('about_title')) + '</h1><div class="prose"><p>' + esc(cfg.about || t('about_text', { shop: cfg.shopName })) + '</p>' +
      '<p class="online-note"><b>' + esc(t('about_online')) + '.</b> ' + esc(t('about_online_text')) + '</p></div>' +
      '<div class="cards3"><div class="box">' + icon('truck') + '<b>' + esc(t('tf_deliver')) + '</b><span class="hint">' + esc(cfg.announcement || t('ann_from', { fee: Shop.rwf(cfg.fees.kigali) })) + '</span></div>' +
      '<div class="box">' + icon('shield') + '<b>' + esc(t('tf_momo')) + '</b><span class="hint">' + esc(t('p_cod_note')) + '</span></div>' +
      '<a class="box" href="/support.html">' + icon('headset') + '<b>' + esc(t('tf_support')) + '</b><span class="hint">' + esc(t('support_card')) + '</span></a></div>';
    return;
  }

  Shop.setTitle(t('contact_title'));
  const cards = [];
  if (cfg.phone) cards.push('<a class="box" href="tel:' + esc(cfg.phone.replace(/[^\d+]/g, '')) + '">' + icon('phone') + '<b>' + esc(t('call_us')) + '</b><span>' + esc(cfg.phone) + '</span></a>');
  cards.push('<a class="box" href="/support.html">' + icon('headset') + '<b>' + esc(t('support_title')) + '</b><span>' + esc(t('support_card')) + '</span></a>');
  if (cfg.email) cards.push('<a class="box" href="mailto:' + esc(cfg.email) + '">' + icon('mail') + '<b>' + esc(t('email_us')) + '</b><span>' + esc(cfg.email) + '</span></a>');
  if (cfg.address) cards.push('<div class="box">' + icon('pin') + '<b>' + esc(t('visit_us')) + '</b><span>' + esc(cfg.address) + '</span></div>');
  app.innerHTML = '<nav class="crumbs"><a href="/index.html">' + esc(t('nav_home')) + '</a><span>/</span><span aria-current="page">' + esc(t('contact_title')) + '</span></nav>' +
    '<h1 class="page-title">' + esc(t('contact_title')) + '</h1>' + (cards.length ? '<div class="cards3">' + cards.join('') + '</div>' : '<p class="empty">' + esc(t('no_contact')) + '</p>');
});
