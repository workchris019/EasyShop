// admin-settings.html: shop name, contact details, delivery fees, Mobile Money codes, password.
Admin.ready.then(async ({ view }) => {
  const { esc, api, json, toast, $ } = Admin;
  let s;
  try { s = await api('/api/admin/settings'); } catch (e) { view.innerHTML = '<p class="empty">' + esc(e.message) + '</p>'; return; }
  const f = (id, label, type, hint, extra) => '<div class="field"><label for="' + id + '">' + label + '</label>' +
    (type === 'textarea' ? '<textarea id="' + id + '" rows="3"' + (extra || '') + '>' + esc(s[id]) + '</textarea>' : '<input id="' + id + '" type="' + (type || 'text') + '" value="' + esc(s[id]) + '"' + (extra || '') + '>') +
    (hint ? '<span class="hint">' + hint + '</span>' : '') + '</div>';

  view.innerHTML = '<div class="page-head"><h1>Settings</h1><button type="submit" form="sf" class="btn" id="save">Save settings</button></div><div id="err" class="error" role="alert" hidden></div>' +
    '<form id="sf" novalidate><div class="form-grid"><div class="card"><h2 class="sub-h">Shop</h2>' +
    f('shopName', 'Shop name', 'text', '', ' maxlength="60"') + f('tagline', 'Tagline', 'text', 'Shown under the logo.', ' maxlength="100"') +
    f('announcement', 'Top bar message', 'text', 'Leave empty to show the delivery message automatically.', ' maxlength="140"') + f('about', 'About us text', 'textarea', 'Shown on the About page and the footer.', ' maxlength="600"') +
    '<h2 class="sub-h">Contact</h2>' + f('phone', 'Phone', 'tel') + f('whatsapp', 'WhatsApp number', 'tel', 'With country code, digits only. Example: 250788123456') + f('email', 'Email', 'email') + f('address', 'Address', 'text') +
    '</div><div class="card"><h2 class="sub-h">Delivery (RWF)</h2>' +
    f('feeKigali', 'Delivery fee in Kigali', 'number', '', ' min="0" step="50"') + f('feeUpcountry', 'Delivery fee outside Kigali', 'number', '', ' min="0" step="50"') +
    f('freeDeliveryOver', 'Free delivery in Kigali over', 'number', 'Orders at or above this amount get free delivery in Kigali. 0 turns it off.', ' min="0" step="1000"') +
    '<h2 class="sub-h">Mobile Money</h2>' + f('mtnCode', 'MTN MoMo Pay code', 'text') + f('mtnName', 'MTN account name', 'text') + f('airtelCode', 'Airtel Money code', 'text') + f('airtelName', 'Airtel account name', 'text') + '</div></div></form>' +
    '<div class="card"><h2 class="sub-h">Change password</h2><form id="pf" novalidate><div class="row2"><div class="field"><label for="cur">Current password</label><input id="cur" type="password" autocomplete="current-password"></div>' +
    '<div class="field"><label for="nw">New password (8+ characters)</label><input id="nw" type="password" autocomplete="new-password"></div></div><button type="submit" class="btn ghost">Change password</button></form></div>';

  const keys = ['shopName', 'tagline', 'announcement', 'about', 'phone', 'whatsapp', 'email', 'address', 'feeKigali', 'feeUpcountry', 'freeDeliveryOver', 'mtnCode', 'mtnName', 'airtelCode', 'airtelName'];
  $('#sf').addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('#err');
    err.hidden = true;
    const body = {};
    keys.forEach((k) => { body[k] = $('#' + k).value; });
    try { await api('/api/admin/settings', json('PUT', body)); toast('Settings saved'); } catch (ex) { err.textContent = ex.message; err.hidden = false; window.scrollTo(0, 0); }
  });
  $('#pf').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await api('/api/admin/password', json('POST', { current: $('#cur').value, next: $('#nw').value })); toast('Password changed'); $('#cur').value = ''; $('#nw').value = ''; } catch (ex) { toast(ex.message, true); }
  });
});
