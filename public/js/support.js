// support.html: online support chat with the admin. The admin answers from the admin panel (Support).
Shop.ready.then(async (cfg) => {
  const { $, esc, t, api, Account, visitorId } = Shop;
  const app = $('#app');
  const cid = visitorId();
  Shop.setTitle(t('support_title'));

  let known = { name: '', phone: '' };
  let messages = [];
  let sending = false;

  app.innerHTML =
    '<nav class="crumbs"><a href="/index.html">' + esc(t('nav_home')) + '</a><span>/</span><span aria-current="page">' + esc(t('support')) + '</span></nav>' +
    '<h1 class="page-title">' + esc(t('support_title')) + '</h1><p class="hint intro">' + esc(t('support_intro')) + '</p>' +
    '<div class="chat box"><div class="chat-log" id="log" aria-live="polite"></div>' +
    '<form class="chat-form" id="chatForm" novalidate><div id="chatError" class="error" role="alert" hidden></div>' +
    '<div class="row2" id="who" hidden><div class="field"><label for="c-name">' + esc(t('support_name')) + '</label><input id="c-name" maxlength="80" autocomplete="name"></div>' +
    '<div class="field"><label for="c-phone">' + esc(t('support_phone')) + '</label><input id="c-phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="07xx xxx xxx"></div></div>' +
    '<div class="chat-send"><textarea id="c-text" rows="2" maxlength="1000" placeholder="' + esc(t('support_ph')) + '" aria-label="' + esc(t('support_ph')) + '"></textarea>' +
    '<button type="submit" class="btn" id="c-btn">' + esc(t('support_send')) + '</button></div></form></div>';

  const log = $('#log');
  const when = (d) => new Date(d).toLocaleString(Shop.lang === 'fr' ? 'fr-RW' : 'en-GB', { timeZone: 'Africa/Kigali', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  function draw(stick) {
    const nearBottom = stick || log.scrollHeight - log.scrollTop - log.clientHeight < 80;
    log.innerHTML = messages.length
      ? messages.map((m) => '<div class="msg ' + (m.from === 'admin' ? 'admin' : 'me') + '"><b>' + esc(m.from === 'admin' ? t('support_admin') : t('support_you')) + '</b><p>' + esc(m.text) + '</p><small>' + esc(when(m.at)) + '</small></div>').join('')
      : '<p class="empty">' + esc(t('support_empty')) + '</p>';
    if (nearBottom) log.scrollTop = log.scrollHeight;
  }

  async function load(first) {
    try {
      const d = await api('/api/support/thread?cid=' + cid + '&read=1');
      const changed = d.messages.length !== messages.length;
      messages = d.messages;
      known = { name: d.name || known.name, phone: d.phone || known.phone };
      if (first || changed) draw(first);
    } catch (e) { if (first) log.innerHTML = '<p class="empty">' + esc(e.message) + '</p>'; }
    if (first) {
      const acc = Account.get();
      if (!known.name && acc) known = { name: acc.name, phone: acc.phone };
      if (!known.name) {
        $('#who').hidden = false;
        $('#c-name').value = '';
      }
    }
  }

  $('#chatForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;
    const err = $('#chatError');
    const text = $('#c-text').value.trim();
    err.hidden = true;
    if (!text) return;
    const name = known.name || $('#c-name').value.trim();
    const phone = known.phone || $('#c-phone').value.trim();
    sending = true;
    $('#c-btn').disabled = true;
    try {
      await api('/api/support/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cid, name, phone, text }) });
      $('#c-text').value = '';
      known = { name: name || known.name, phone: phone || known.phone };
      $('#who').hidden = true;
      messages = messages.concat({ from: 'customer', text, at: new Date().toISOString() });
      draw(true);
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
    } finally { sending = false; $('#c-btn').disabled = false; }
  });

  await load(true);
  // Look for the admin's reply every few seconds while this page is open.
  setInterval(() => { if (!document.hidden) load(false); }, 6000);
});
