const { $, api, json, LOGO } = Admin;
$('#loginBrand').innerHTML = LOGO + '<b>ShopEasy<small>Admin</small></b>';
// Already signed in? Go straight to the dashboard.
api('/api/admin/me').then(() => { location.replace('/admin.html'); }).catch(() => {});

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('#loginError');
  const btn = $('#loginBtn');
  err.hidden = true;
  btn.disabled = true;
  try {
    await api('/api/admin/login', json('POST', { username: $('#u').value, password: $('#p').value }));
    location.href = '/admin.html';
  } catch (ex) {
    err.textContent = ex.message;
    err.hidden = false;
    btn.disabled = false;
  }
});
