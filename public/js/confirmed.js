// order-confirmed.html: thank-you page with payment instructions and a WhatsApp button.
Shop.ready.then((cfg) => {
  const { $, esc, t, rwf, icon } = Shop;
  let o = null;
  try { o = JSON.parse(sessionStorage.getItem('lastOrder') || 'null'); } catch (e) { o = null; }
  if (!o) { location.replace('/index.html'); return; }
  Shop.setTitle(t('done_title'));

  const payName = { mtn: 'MTN MoMo', airtel: 'Airtel Money', cod: 'Pay on delivery' }[o.payment.method];
  const lines = [
    cfg.shopName + ' order ' + o.ref,
    ...o.items.map((i) => i.qty + ' x ' + i.name + ' - ' + rwf(i.price * i.qty)),
    'Delivery: ' + (o.deliveryMethod === 'pickup' ? 'Pickup' : o.deliveryFee ? rwf(o.deliveryFee) : 'Free'),
    'Total: ' + rwf(o.total),
    'Name: ' + o.customer.name,
    'Phone: ' + o.customer.phone,
    o.deliveryMethod === 'pickup' ? 'I will pick it up' : 'Deliver to: ' + o.customer.district + ', ' + o.customer.address,
    'Payment: ' + payName + (o.payment.reference ? ' (ID ' + o.payment.reference + ')' : ''),
  ];

  let pay = '';
  if (o.payment.method !== 'cod') {
    const info = cfg.payments[o.payment.method];
    pay = '<div class="pay-box">' + esc(info.code ? t('pay_to', { total: rwf(o.total), name: info.name || payName, code: info.code }) : t('pay_later')) + '</div>';
  }

  $('#app').innerHTML =
    '<div class="done"><div class="tick" aria-hidden="true">✓</div><h1 class="page-title">' + esc(t('done_title')) + '</h1>' +
    '<p class="hint">' + esc(t('done_ref')) + '</p><p class="ref">' + esc(o.ref) + '</p>' +
    '<div class="box"><div class="sum total"><span>' + esc(t('total')) + '</span><span>' + esc(rwf(o.total)) + '</span></div>' + pay + '<p>' + esc(t('done_next')) + '</p></div>' +
    '<div class="stack">' + (cfg.whatsapp ? '<a class="btn wa block" target="_blank" rel="noopener" href="' + esc(Shop.waLink(lines.join('\n'))) + '">' + icon('whatsapp') + esc(t('wa_btn')) + '</a>' : '') +
    '<a class="btn block" href="/track.html?ref=' + encodeURIComponent(o.ref) + '&phone=' + encodeURIComponent(o.customer.phone) + '">' + esc(t('track_order')) + '</a>' +
    '<a class="btn ghost block" href="/shop.html">' + esc(t('continue')) + '</a></div></div>';
});
