// admin-hero.html: the homepage slideshow. Add, edit, reorder, hide, delete slides.
Admin.ready.then(async ({ view }) => {
  const { esc, icon, api, json, toast, $, $$, CAT } = Admin;
  let slides = [];
  let files = [];

  view.innerHTML = '<div class="page-head"><div><h1>Hero banners</h1><p>The slideshow at the top of your home page. Each slide has a picture, a short text and a button.</p></div>' +
    '<button type="button" class="btn" id="add">' + icon('plus') + 'Add banner</button></div><div class="banners" id="list"><p class="empty">Loading...</p></div>';

  const linkLabel = (l) => (l === 'all' ? 'All products' : l === 'deals' ? 'Deals' : l.indexOf('cat:') === 0 ? 'Category: ' + (CAT[l.slice(4)] || l.slice(4)) : l);

  async function load() {
    try {
      slides = await api('/api/admin/hero');
      $('#list').innerHTML = slides.length ? slides.map((s) =>
        '<article class="bn"><div class="bn-prev"><div class="tx">' + (s.badge ? '<span class="p">' + esc(s.badge) + '</span>' : '') + '<b>' + esc(s.title) + '</b><small>' + esc(s.subtitle) + '</small></div>' +
        (s.image ? '<img src="' + esc(s.image) + '" alt="">' : '') + '</div>' +
        '<div class="bn-body"><div class="meta">Position ' + s.order + ' · Button: ' + esc(s.buttonText) + ' → ' + esc(linkLabel(s.link)) + '<br>' + (s.active ? '<span class="pill p-delivered">Showing</span>' : '<span class="pill p-cancelled">Hidden</span>') + '</div>' +
        '<div class="actions"><button type="button" class="btn sm ghost" data-edit="' + esc(s._id) + '">' + icon('edit') + 'Edit</button><button type="button" class="btn sm outline-danger" data-del="' + esc(s._id) + '">Delete</button></div></div></article>').join('')
        : '<p class="empty">No banners yet. Add your first one: your home page shows a default message until then.</p>';
    } catch (e) { $('#list').innerHTML = '<p class="empty">' + esc(e.message) + '</p>'; }
  }

  async function form(s) {
    let imgFiles = [];
    try { imgFiles = await api('/api/admin/hero-files'); } catch (e) { imgFiles = []; }
    files = [];
    let dlg = $('#heroDlg');
    if (!dlg) { dlg = document.createElement('dialog'); dlg.id = 'heroDlg'; document.body.appendChild(dlg); }
    const link = s ? s.link : 'all';
    const isCat = link.indexOf('cat:') === 0;
    const isCustom = !(link === 'all' || link === 'deals' || isCat);
    dlg.innerHTML = '<form class="dlg" id="hf" novalidate><div class="dlg-head"><h2>' + (s ? 'Edit banner' : 'Add banner') + '</h2><button type="button" class="icon-btn" data-x aria-label="Close">' + icon('x') + '</button></div>' +
      '<div id="hErr" class="error" role="alert" hidden></div>' +
      '<div class="row2"><div class="field"><label for="hBadge">Small label (optional)</label><input id="hBadge" maxlength="40" placeholder="Special Offer" value="' + esc(s ? s.badge : '') + '"></div>' +
      '<div class="field"><label for="hOrder">Position (1 shows first)</label><input id="hOrder" type="number" min="0" max="999" value="' + (s ? s.order : slides.length + 1) + '"></div></div>' +
      '<div class="field"><label for="hTitle">Title *</label><input id="hTitle" maxlength="80" placeholder="Upgrade Your Lifestyle" value="' + esc(s ? s.title : '') + '"></div>' +
      '<div class="field"><label for="hSub">Description</label><textarea id="hSub" rows="2" maxlength="200" placeholder="Discover amazing products, fair prices, and delivery across Rwanda.">' + esc(s ? s.subtitle : '') + '</textarea></div>' +
      '<div class="row2"><div class="field"><label for="hBtn">Button text</label><input id="hBtn" maxlength="30" value="' + esc(s ? s.buttonText : 'Shop Now') + '"></div>' +
      '<div class="field"><label for="hLink">Button goes to</label><select id="hLink"><option value="all"' + (link === 'all' ? ' selected' : '') + '>All products</option><option value="deals"' + (link === 'deals' ? ' selected' : '') + '>Deals</option>' +
      Object.keys(CAT).map((c) => '<option value="cat:' + c + '"' + (link === 'cat:' + c ? ' selected' : '') + '>Category: ' + esc(CAT[c]) + '</option>').join('') + '<option value="custom"' + (isCustom ? ' selected' : '') + '>Other link...</option></select></div></div>' +
      '<div class="field" id="hCustomWrap"' + (isCustom ? '' : ' hidden') + '><label for="hCustom">Link</label><input id="hCustom" placeholder="/about.html or https://..." value="' + esc(isCustom ? link : '') + '"></div>' +
      '<fieldset><legend>Banner picture ' + (s ? '' : '*') + '</legend><div class="radios"><label><input type="radio" name="src" value="upload" checked> Upload a picture</label><label><input type="radio" name="src" value="path"> Use a file from my project (VS Code)</label></div></fieldset>' +
      '<div class="field" id="srcUpload"><input type="file" id="hFile" accept="image/jpeg,image/png,image/webp"><span class="hint">Best: a wide picture (about 1200 × 600) with a plain or transparent background, product on the right side.</span></div>' +
      '<div class="field" id="srcPath" hidden><select id="hPath"><option value="">Choose a file...</option>' + imgFiles.map((f) => '<option value="' + esc(f) + '"' + (s && s.image === f ? ' selected' : '') + '>' + esc(f) + '</option>').join('') + '</select>' +
      '<span class="hint">Put the picture in <b>public/images/hero/</b> in VS Code, reload this window, and it appears in this list.</span></div>' +
      '<div class="bn-prev" id="hPrev"></div><label class="check"><input type="checkbox" id="hActive"' + (!s || s.active ? ' checked' : '') + '> Show this banner on the home page</label>' +
      '<div class="actions"><button type="submit" class="btn" id="hSave">Save banner</button><button type="button" class="btn ghost" data-x>Cancel</button></div></form>';

    const prev = () => {
      const url = files[0] ? URL.createObjectURL(files[0]) : ($('input[name=src]:checked', dlg).value === 'path' && $('#hPath').value) || (s && s.image) || '';
      $('#hPrev').innerHTML = '<div class="tx">' + ($('#hBadge').value ? '<span class="p">' + esc($('#hBadge').value) + '</span>' : '') + '<b>' + esc($('#hTitle').value || 'Title') + '</b><small>' + esc($('#hSub').value) + '</small></div>' + (url ? '<img src="' + esc(url) + '" alt="">' : '');
    };
    dlg.addEventListener('input', prev);
    dlg.addEventListener('change', (e) => {
      if (e.target.id === 'hFile') files = Array.from(e.target.files);
      if (e.target.name === 'src') { $('#srcUpload').hidden = e.target.value !== 'upload'; $('#srcPath').hidden = e.target.value !== 'path'; }
      if (e.target.id === 'hLink') $('#hCustomWrap').hidden = e.target.value !== 'custom';
      prev();
    });
    dlg.addEventListener('click', (e) => { if (e.target.hasAttribute('data-x') || e.target.closest('[data-x]') || e.target === dlg) dlg.close(); });
    prev();

    $('#hf').addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = $('#hErr');
      err.hidden = true;
      const fd = new FormData();
      fd.append('badge', $('#hBadge').value); fd.append('title', $('#hTitle').value); fd.append('subtitle', $('#hSub').value);
      fd.append('buttonText', $('#hBtn').value); fd.append('order', $('#hOrder').value); fd.append('active', $('#hActive').checked ? 'true' : 'false');
      fd.append('link', $('#hLink').value === 'custom' ? $('#hCustom').value : $('#hLink').value);
      if ($('input[name=src]:checked', dlg).value === 'upload') { if (files[0]) fd.append('image', files[0]); }
      else if ($('#hPath').value) fd.append('imageUrl', $('#hPath').value);
      $('#hSave').disabled = true;
      try {
        await api('/api/admin/hero' + (s ? '/' + s._id : ''), { method: s ? 'PATCH' : 'POST', body: fd });
        dlg.close();
        toast('Banner saved');
        load();
      } catch (ex) { err.textContent = ex.message; err.hidden = false; $('#hSave').disabled = false; }
    });
    dlg.showModal();
  }

  $('#add').addEventListener('click', () => form(null));
  view.addEventListener('click', async (e) => {
    const ed = e.target.closest('[data-edit]');
    if (ed) { form(slides.find((x) => x._id === ed.dataset.edit)); return; }
    const del = e.target.closest('[data-del]');
    if (del && confirm('Delete this banner?')) {
      try { await api('/api/admin/hero/' + del.dataset.del, { method: 'DELETE' }); toast('Banner deleted'); load(); } catch (ex) { toast(ex.message, true); }
    }
  });
  load();
});
