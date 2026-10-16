// track.html: check an order with order number + phone number.
Shop.ready.then((cfg) => {
  const { $, esc, t, rwf, api } = Shop;
  const app = $('#app');
  Shop.setTitle(t('track_title'));

  const q = new URLSearchParams(location.search);
  const last = Shop.store.getJSON('lastTrack', null);
  const pre = { ref: q.get('ref') || (last && last.ref) || '', phone: q.get('phone') || (last && last.phone) || '' };

  app.innerHTML =
    '<nav class="crumbs"><a href="/index.html">' + esc(t('nav_home')) + '</a><span>/</span><span aria-current="page">' + esc(t('track_order')) + '</span></nav>' +
    '<div class="two-col"><div class="box"><h1 class="page-title">' + esc(t('track_title')) + '</h1><br>' +
    '<form id="trackForm" novalidate><div id="trackError" class="error" role="alert" hidden></div>' +
    '<div class="field"><label for="t-ref">' + esc(t('track_ref')) + '</label><input id="t-ref" name="ref" autocomplete="off" value="' + esc(pre.ref) + '"></div>' +
    '<div class="field"><label for="t-phone">' + esc(t('track_phone')) + '</label><input id="t-phone" name="phone" type="tel" inputmode="tel" value="' + esc(pre.phone) + '"></div>' +
    '<button class="btn block" type="submit" id="trackBtn">' + esc(t('track_btn')) + '</button></form></div>' +
    '<div class="box" id="result" hidden></div></div>';

  const steps = (o) => (o.deliveryMethod === 'pickup' ? ['new', 'confirmed', 'delivered'] : ['new', 'confirmed', 'shipped', 'delivered']);

  function show(o) {
    const box = $('#result');
    let html = '<h2>' + esc(o.ref) + '</h2>';
    if (o.status === 'cancelled') {
      html += '<p class="error">' + esc(t('st_cancelled')) + '</p>';
    } else {
      const list = steps(o);
      const at = list.indexOf(o.status);
      html += '<div class="timeline">' + list.map((s, i) => '<div class="tl' + (i <= at ? ' done-step' : '') + '">' + esc(t('st_' + s)) + '</div>').join('') + '</div>';
    }
    if (o.driver) {
      html += '<div class="pay-box"><b>' + esc(t('rider')) + ':</b> ' + esc(o.driver.name) + ' <a class="link" href="tel:+' + esc(o.driver.phone) + '">' + esc(t('call')) + ' +' + esc(o.driver.phone) + '</a></div>';
    }
    html += o.items.map((i) => '<div class="sum"><span>' + i.qty + ' × ' + esc(i.name) + '</span><span>' + esc(rwf(i.price * i.qty)) + '</span></div>').join('') +
      '<div class="sum"><span>' + esc(t('delivery')) + '</span><span>' + esc(o.deliveryFee ? rwf(o.deliveryFee) : t('free')) + '</span></div>' +
      '<div class="sum total"><span>' + esc(t('total')) + '</span><span>' + esc(rwf(o.total)) + '</span></div>';
    box.innerHTML = html;
    box.hidden = false;
  }

  async function lookup(ref, phone) {
    const err = $('#trackError');
    err.hidden = true;
    $('#trackBtn').disabled = true;
    try {
      show(await api('/api/orders/track?ref=' + encodeURIComponent(ref) + '&phone=' + encodeURIComponent(phone)));
    } catch (e) {
      $('#result').hidden = true;
      err.textContent = e.message;
      err.hidden = false;
    } finally { $('#trackBtn').disabled = false; }
  }

  $('#trackForm').addEventListener('submit', (e) => { e.preventDefault(); lookup($('#t-ref').value, $('#t-phone').value); });
  if (pre.ref && pre.phone && (q.get('ref') || last)) lookup(pre.ref, pre.phone);
});
