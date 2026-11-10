// account.html: the name and phone saved on this device (filled in at checkout) and quick links.
Shop.ready.then((cfg) => {
  const { $, esc, t, icon, Account, toast } = Shop;
  const app = $('#app');
  Shop.setTitle(t('acct_title'));

  function draw() {
    const a = Account.get();
    app.innerHTML =
      '<nav class="crumbs"><a href="/index.html">' + esc(t('nav_home')) + '</a><span>/</span><span aria-current="page">' + esc(t('acct_title')) + '</span></nav>' +
      '<div class="two-col"><div class="box"><h1 class="page-title">' + esc(t('acct_title')) + '</h1><p class="hint">' + esc(a ? t('acct_text') : t('acct_none')) + '</p><br>' +
      '<form id="acctForm" novalidate><div id="acctError" class="error" role="alert" hidden></div>' +
      '<div class="field"><label for="a-name">' + esc(t('acct_name')) + '</label><input id="a-name" maxlength="80" autocomplete="name" value="' + esc(a ? a.name : '') + '"></div>' +
      '<div class="field"><label for="a-phone">' + esc(t('acct_phone')) + '</label><input id="a-phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="07xx xxx xxx" value="' + esc(a ? a.phone : '') + '"></div>' +
      '<div class="stack"><button type="submit" class="btn block">' + esc(t('acct_save')) + '</button>' +
      (a ? '<button type="button" class="btn ghost block" id="forget">' + esc(t('acct_forget')) + '</button>' : '') + '</div></form></div>' +
      '<div class="box acct-links"><a href="/track.html">' + icon('box') + '<b>' + esc(t('acct_orders')) + '</b></a><a href="/support.html">' + icon('headset') + '<b>' + esc(t('acct_help')) + '</b></a>' +
      '<a href="/wishlist.html">' + icon('heart') + '<b>' + esc(t('acct_wish')) + '</b></a></div></div>';

    $('#acctForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#a-name').value.trim();
      const phone = $('#a-phone').value.trim();
      const err = $('#acctError');
      if (name.length < 2 || phone.replace(/\D/g, '').length < 9) {
        err.textContent = t('acct_name') + ' / ' + t('acct_phone');
        err.hidden = false;
        return;
      }
      Account.save(name, phone);
      toast(t('acct_saved'));
      draw();
    });
    const f = $('#forget');
    if (f) f.addEventListener('click', () => { Account.clear(); toast(t('acct_removed')); draw(); });
  }
  draw();
});
