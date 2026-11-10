// checkout.html: delivery details and the pay button.
// Name shown on the pay button: "Pay with <PAY_PROVIDER>". Change it to your payment provider's name.
const PAY_PROVIDER = '...';

Shop.ready.then(async (cfg) => {
  const { $, $$, esc, t, rwf, Cart, api, icon } = Shop;
  const app = $('#app');
  Shop.setTitle(t('checkout'));

  try { await Cart.refresh(); } catch (e) { /* offline: use saved cart */ }
  if (!Cart.all().length) { location.replace('/cart.html'); return; }

  // Name and phone come from the saved account when there is one, so they are not typed again.
  const acct = Shop.Account.get();
  const saved = Object.assign({}, Shop.store.getJSON('customer', {}), acct ? { name: acct.name, phone: acct.phone } : {});
  const sub = Cart.subtotal();
  const districts = (list) => list.map((d) => '<option value="' + esc(d) + '"' + (saved.district === d ? ' selected' : '') + '>' + esc(d) + '</option>').join('');
  const opt = (name, value, label, extra) => '<label class="opt"><input type="radio" name="' + name + '" value="' + value + '"' + (extra || '') + '><span>' + esc(label) + '</span></label>';

  app.innerHTML =
    '<nav class="crumbs"><a href="/index.html">' + esc(t('nav_home')) + '</a><span>/</span><a href="/cart.html">' + esc(t('cart_title')) + '</a><span>/</span><span aria-current="page">' + esc(t('checkout')) + '</span></nav>' +
    '<div class="page-head"><h1 class="page-title">' + esc(t('checkout')) + '</h1></div>' +
    '<form id="orderForm" class="two-col" novalidate><div class="box"><div id="formError" class="error" role="alert" hidden></div>' +
    '<div class="field"><label for="f-name">' + esc(t('name')) + '</label><input id="f-name" name="name" autocomplete="name" maxlength="80" required value="' + esc(saved.name || '') + '"></div>' +
    '<div class="field"><label for="f-phone">' + esc(t('phone')) + '</label><input id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="07xx xxx xxx" required value="' + esc(saved.phone || '') + '"><span class="hint">' + esc(t('phone_hint')) + '</span></div>' +
    '<fieldset><legend>' + esc(t('method')) + '</legend><div class="opts">' + opt('dmethod', 'delivery', t('m_delivery'), ' checked') + opt('dmethod', 'pickup', t('m_pickup')) + '</div></fieldset>' +
    '<div id="addrBlock"><div class="field"><label for="f-district">' + esc(t('district')) + '</label><select id="f-district" name="district"><option value="">' + esc(t('choose')) + '</option>' +
    '<optgroup label="' + esc(t('grp_kigali')) + '">' + districts(cfg.kigali) + '</optgroup><optgroup label="' + esc(t('grp_other')) + '">' + districts(cfg.upcountry) + '</optgroup></select></div>' +
    '<div class="field"><label for="f-address">' + esc(t('address')) + '</label><textarea id="f-address" name="address" rows="2" maxlength="200" autocomplete="street-address"></textarea><span class="hint" id="locHint"></span></div></div>' +
    '<label class="check terms-check"><input type="checkbox" id="agree" name="agree"> <span>' + esc(t('terms_agree')) + ' <a href="#" id="termsLink" class="link">' + esc(t('terms_link')) + '</a></span></label>' +
    '</div>' +
    '<aside class="box"><h2>' + esc(t('order_summary')) + '</h2>' +
    Cart.all().map((l) => '<div class="sum"><span>' + l.qty + ' × ' + esc(l.name) + '</span><span>' + esc(rwf(l.price * l.qty)) + '</span></div>').join('') +
    '<hr><div class="sum"><span>' + esc(t('items')) + '</span><span>' + esc(rwf(sub)) + '</span></div>' +
    '<div class="sum"><span>' + esc(t('delivery')) + '</span><span id="sFee"></span></div>' +
    '<div class="sum total"><span>' + esc(t('total')) + '</span><span id="sTotal"></span></div>' +
    '<div class="stack"><button type="submit" class="btn block" id="placeBtn">' + esc(t('pay_btn', { provider: PAY_PROVIDER })) + '</button><p class="secure">' + icon('lock') + esc(t('secured')) + '</p><a class="btn ghost block" href="/cart.html">' + esc(t('back')) + '</a></div></aside></form>';

  const form = $('#orderForm');
  const val = (name) => (form.elements[name] && form.elements[name].value) || '';

  function update() {
    const method = val('dmethod');
    const district = val('district');
    $('#addrBlock').hidden = method === 'pickup';

    const fee = Shop.deliveryFee(method, district, sub);
    const total = sub + (fee || 0);
    $('#sFee').textContent = fee === null ? t('fee_note') : fee === 0 ? t('free') : rwf(fee);
    $('#sTotal').textContent = rwf(total);
  }
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  update();

  // Fill "Location" automatically when the visitor allows location access.
  // It only fills an empty box, so anything the customer typed is never overwritten.
  let locTried = false;
  function autoLocation() {
    if (locTried || val('dmethod') === 'pickup' || !navigator.geolocation) return;
    locTried = true;
    const box = $('#f-address');
    const hint = $('#locHint');
    hint.textContent = t('loc_finding');
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude.toFixed(6);
      const lng = pos.coords.longitude.toFixed(6);
      if (!box.value.trim()) box.value = lat + ', ' + lng + ' - https://maps.google.com/?q=' + lat + ',' + lng;
      hint.textContent = t('loc_found');
    }, () => { hint.textContent = t('loc_denied'); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  }
  form.addEventListener('change', (e) => { if (e.target.name === 'dmethod') autoLocation(); });
  autoLocation();

  // Terms and conditions card. Accept ticks the box and saves name and phone as the customer's account.
  const dlg = document.createElement('dialog');
  dlg.className = 'terms-dlg';
  dlg.setAttribute('aria-labelledby', 'termsTitle');
  dlg.innerHTML = '<div class="terms-card"><h2 id="termsTitle">' + esc(t('terms_title')) + '</h2><p>' + esc(t('terms_text')) + '</p>' +
    '<div class="terms-actions"><button type="button" class="btn ghost" id="termsNo">' + esc(t('terms_decline')) + '</button><button type="button" class="btn" id="termsYes">' + esc(t('terms_accept')) + '</button></div></div>';
  document.body.appendChild(dlg);

  const saveAccount = () => {
    if (val('name').trim().length >= 2 && val('phone').trim().length >= 9) Shop.Account.save(val('name'), val('phone'));
  };
  $('#termsLink').addEventListener('click', (e) => { e.preventDefault(); dlg.showModal(); });
  $('#termsNo').addEventListener('click', () => dlg.close());
  $('#termsYes').addEventListener('click', () => { $('#agree').checked = true; saveAccount(); dlg.close(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('#formError');
    const btn = $('#placeBtn');
    err.hidden = true;
    if (!$('#agree').checked) {
      err.textContent = t('terms_required');
      err.hidden = false;
      err.scrollIntoView({ block: 'center' });
      return;
    }
    btn.disabled = true;
    btn.textContent = t('placing');
    // >>> Start your payment API here (e.g. redirect to your payment page) if it must happen before the order is saved.
    const customer = { name: val('name'), phone: val('phone'), district: val('district'), address: val('address') };
    try {
      const order = await api('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: Cart.all().map((l) => ({ id: l.id, qty: l.qty })),
          deliveryMethod: val('dmethod'), customer, payment: { method: 'online', reference: '' },
        }),
      });
      Shop.store.setJSON('customer', { name: customer.name, phone: customer.phone, district: customer.district });
      saveAccount(); // the terms are agreed, so the name and phone become the saved account
      Shop.store.setJSON('lastTrack', { ref: order.ref, phone: customer.phone });
      try { sessionStorage.setItem('lastOrder', JSON.stringify(order)); } catch (x) { /* ignore */ }
      Cart.clear();
      location.href = '/order-confirmed.html';
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
      err.scrollIntoView({ block: 'center' });
      btn.disabled = false;
      btn.textContent = t('pay_btn', { provider: PAY_PROVIDER });
    }
  });
});
