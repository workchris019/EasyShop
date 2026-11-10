// admin-categories.html: add, edit and delete product categories. The picture shows on the home page.
Admin.ready.then(async ({ view }) => {
  const { esc, icon, api, toast, $ } = Admin;
  let cats = [];

  view.innerHTML = '<div class="page-head"><div><h1>Categories</h1><p>The groups your products belong to. Each category can have a picture, shown on the home page and in the menu.</p></div>' +
    '<button type="button" class="btn" id="add">' + icon('plus') + 'Add category</button></div><div class="cat-grid" id="list"><p class="empty">Loading...</p></div>';

  async function load() {
    try {
      cats = await api('/api/admin/categories');
      $('#list').innerHTML = cats.length ? cats.map((c) =>
        '<article class="cat-card"><div class="cat-pic">' + (c.image ? '<img src="' + esc(c.image) + '" alt="">' : '<span>' + esc(c.icon || '🛍️') + '</span>') + '</div>' +
        '<div class="cat-body"><b>' + esc(c.label) + '</b><small class="muted">' + c.products + ' product' + (c.products === 1 ? '' : 's') + ' · Position ' + c.order + '</small>' +
        '<div class="actions"><button type="button" class="btn sm ghost" data-edit="' + esc(c._id) + '">' + icon('edit') + 'Edit</button><button type="button" class="btn sm outline-danger" data-del="' + esc(c._id) + '">Delete</button></div></div></article>').join('')
        : '<p class="empty">No categories yet.</p>';
    } catch (e) { $('#list').innerHTML = '<p class="empty">' + esc(e.message) + '</p>'; }
  }

  function form(c) {
    const old = $('#catDlg');
    if (old) old.remove();
    const dlg = document.createElement('dialog');
    dlg.id = 'catDlg';
    document.body.appendChild(dlg);
    let file = null;
    let removeImage = false;
    dlg.innerHTML = '<form class="dlg" id="cf" novalidate><div class="dlg-head"><h2>' + (c ? 'Edit category' : 'Add category') + '</h2><button type="button" class="icon-btn" data-x aria-label="Close">' + icon('x') + '</button></div>' +
      '<div id="cErr" class="error" role="alert" hidden></div>' +
      '<div class="row2"><div class="field"><label for="cLabel">Name *</label><input id="cLabel" maxlength="30" placeholder="e.g. Sports" value="' + esc(c ? c.label : '') + '"></div>' +
      '<div class="field"><label for="cOrder">Position (1 shows first)</label><input id="cOrder" type="number" min="0" max="999" value="' + (c ? c.order : cats.length + 1) + '"></div></div>' +
      '<div class="field"><label for="cIcon">Emoji (used only when there is no picture)</label><input id="cIcon" maxlength="4" placeholder="🏀" value="' + esc(c ? c.icon : '') + '"></div>' +
      '<div class="field"><label for="cFile">Picture</label><input type="file" id="cFile" accept="image/jpeg,image/png,image/webp"><span class="hint">A square picture works best. It is shrunk automatically.</span></div>' +
      '<div class="cat-prev" id="cPrev"></div>' +
      '<div class="actions"><button type="submit" class="btn" id="cSave">Save category</button><button type="button" class="btn ghost" data-x>Cancel</button></div></form>';

    const prev = () => {
      const url = file ? URL.createObjectURL(file) : (!removeImage && c && c.image) || '';
      $('#cPrev').innerHTML = url ? '<div class="cat-pic"><img src="' + esc(url) + '" alt=""></div>' + (c && c.image && !file ? '<button type="button" class="btn sm outline-danger" id="cRm">Remove picture</button>' : '') : '';
    };
    dlg.addEventListener('change', (e) => { if (e.target.id === 'cFile') { file = e.target.files[0] || null; removeImage = false; prev(); } });
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg || e.target.closest('[data-x]')) dlg.close();
      if (e.target.closest('#cRm')) { removeImage = true; prev(); }
    });
    prev();

    $('#cf', dlg).addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = $('#cErr', dlg);
      err.hidden = true;
      const fd = new FormData();
      fd.append('label', $('#cLabel', dlg).value);
      fd.append('order', $('#cOrder', dlg).value);
      fd.append('icon', $('#cIcon', dlg).value);
      if (file) fd.append('image', file);
      if (removeImage) fd.append('removeImage', 'true');
      $('#cSave', dlg).disabled = true;
      try {
        await api('/api/admin/categories' + (c ? '/' + c._id : ''), { method: c ? 'PATCH' : 'POST', body: fd });
        dlg.close();
        toast('Category saved');
        load();
      } catch (ex) { err.textContent = ex.message; err.hidden = false; $('#cSave', dlg).disabled = false; }
    });
    dlg.showModal();
  }

  $('#add').addEventListener('click', () => form(null));
  view.addEventListener('click', async (e) => {
    const ed = e.target.closest('[data-edit]');
    if (ed) { form(cats.find((x) => x._id === ed.dataset.edit)); return; }
    const del = e.target.closest('[data-del]');
    if (!del) return;
    const c = cats.find((x) => x._id === del.dataset.del);
    if (!confirm('Delete the category "' + c.label + '"?')) return;
    try { await api('/api/admin/categories/' + c._id, { method: 'DELETE' }); toast('Category deleted'); load(); } catch (ex) { toast(ex.message, true); }
  });
  load();
});
