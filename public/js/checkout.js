// checkout.html: delivery details, payment choice, place the order.
Shop.ready.then(async (cfg) => {
  const { $, $$, esc, t, rwf, Cart, api } = Shop;
  const app = $('#app');
  Shop.setTitle(t('checkout'));

  try { await Cart.refresh(); } catch (e) { /* offline: use saved cart */ }
  if (!Cart.all().length) { location.replace('/cart.html'); return; }

  const saved = Shop.store.getJSON('customer', {});
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
    '<div class="field"><label for="f-address">' + esc(t('address')) + '</label><textarea id="f-address" name="address" rows="2" maxlength="200"></textarea></div></div>' +
    '<fieldset><legend>' + esc(t('payment')) + '</legend><div class="opts">' + opt('pay', 'mtn', t('p_mtn'), ' checked') + opt('pay', 'airtel', t('p_airtel')) +
    '<label class="opt" id="codOpt"><input type="radio" name="pay" value="cod"><span>' + esc(t('p_cod')) + '<br><span class="hint">' + esc(t('p_cod_note')) + '</span></span></label></div></fieldset>' +
    '<div id="payBox" class="pay-box" hidden></div>' +
    '<div class="field" id="refField"><label for="f-ref">' + esc(t('reference')) + '</label><input id="f-ref" name="reference" maxlength="40" autocomplete="off"></div></div>' +
    '<aside class="box"><h2>' + esc(t('order_summary')) + '</h2>' +
    Cart.all().map((l) => '<div class="sum"><span>' + l.qty + ' × ' + esc(l.name) + '</span><span>' + esc(rwf(l.price * l.qty)) + '</span></div>').join('') +
    '<hr><div class="sum"><span>' + esc(t('items')) + '</span><span>' + esc(rwf(sub)) + '</span></div>' +
    '<div class="sum"><span>' + esc(t('delivery')) + '</span><span id="sFee"></span></div>' +
    '<div class="sum total"><span>' + esc(t('total')) + '</span><span id="sTotal"></span></div>' +
    '<div class="stack"><button type="submit" class="btn block" id="placeBtn">' + esc(t('place')) + '</button><a class="btn ghost block" href="/cart.html">' + esc(t('back')) + '</a></div></aside></form>';

  const form = $('#orderForm');
  const val = (name) => (form.elements[name] && form.elements[name].value) || '';

  function update() {
    const method = val('dmethod');
    const district = val('district');
    let pay = val('pay');
    $('#addrBlock').hidden = method === 'pickup';

    // Pay on delivery works for pickup, or for delivery inside Kigali only.
    const codOk = method === 'pickup' || !district || cfg.kigali.indexOf(district) !== -1;
    const cod = form.querySelector('input[value="cod"]');
    cod.disabled = !codOk;
    $('#codOpt').setAttribute('aria-disabled', String(!codOk));
    if (!codOk && pay === 'cod') { form.querySelector('input[value="mtn"]').checked = true; pay = 'mtn'; }

    const fee = Shop.deliveryFee(method, district, sub);
    const total = sub + (fee || 0);
    $('#sFee').textContent = fee === null ? t('fee_note') : fee === 0 ? t('free') : rwf(fee);
    $('#sTotal').textContent = rwf(total);

    const box = $('#payBox');
    if (pay === 'cod') { box.hidden = true; } else {
      const info = cfg.payments[pay];
      box.textContent = info.code
        ? t('pay_to', { total: rwf(total), name: info.name || (pay === 'mtn' ? 'MTN MoMo' : 'Airtel Money'), code: info.code })
        : t('pay_later');
      box.hidden = false;
    }
    $('#refField').hidden = pay === 'cod';
  }
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  update();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('#formError');
    const btn = $('#placeBtn');
    err.hidden = true;
    btn.disabled = true;
    btn.textContent = t('placing');
    const customer = { name: val('name'), phone: val('phone'), district: val('district'), address: val('address') };
    try {
      const order = await api('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: Cart.all().map((l) => ({ id: l.id, qty: l.qty })),
          deliveryMethod: val('dmethod'), customer, payment: { method: val('pay'), reference: val('reference') },
        }),
      });
      Shop.store.setJSON('customer', { name: customer.name, phone: customer.phone, district: customer.district });
      Shop.store.setJSON('lastTrack', { ref: order.ref, phone: customer.phone });
      try { sessionStorage.setItem('lastOrder', JSON.stringify(order)); } catch (x) { /* ignore */ }
      Cart.clear();
      location.href = '/order-confirmed.html';
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
      err.scrollIntoView({ block: 'center' });
      btn.disabled = false;
      btn.textContent = t('place');
    }
  });
});
