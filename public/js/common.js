// Shared by every storefront page: header, footer, cart, wishlist, product cards, language.
// Each page loads i18n.js, then this file, then its own script (home.js, shop.js, ...).
(() => {
  'use strict';

  /* ---------- Helpers ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (n) => Number(n).toLocaleString('en-US');
  const rwf = (n) => num(n) + ' RWF';
  const store = {
    get(k, f) { try { const v = localStorage.getItem(k); return v === null ? f : v; } catch (e) { return f; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode: ignore */ } },
    getJSON(k, f) { try { const v = JSON.parse(store.get(k, 'null')); return v === null || v === undefined ? f : v; } catch (e) { return f; } },
    setJSON(k, v) { store.set(k, JSON.stringify(v)); },
  };

  /* ---------- Language ---------- */
  let lang = store.get('lang', 'en');
  if (!window.I18N[lang]) lang = 'en';
  function t(key, vars) {
    let s = (window.I18N[lang] && window.I18N[lang][key]) || window.I18N.en[key] || key;
    Object.keys(vars || {}).forEach((k) => { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }

  /* ---------- Icons ---------- */
  const PATHS = {
    truck: '<path d="M1 6h13v10H1z"/><path d="M14 9h4l3 3v4h-7"/><circle cx="5.5" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
    heart: '<path d="M20.8 5.6a5.4 5.4 0 0 0-7.6 0L12 6.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 22l8.8-8.8a5.4 5.4 0 0 0 0-7.6z"/>',
    cart: '<path d="M3 3h2l2.4 12h10.4l2.2-8H6"/><circle cx="9.5" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    left: '<path d="M15 6l-6 6 6 6"/>',
    right: '<path d="M9 6l6 6-6 6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    whatsapp: '<path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.3-4.4A9 9 0 1 1 21 12z"/><path d="M9 9c0 3 3 6 6 6l1.5-1.5-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    pin: '<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3.3 7.6L12 12l8.7-4.4M12 22V12"/>',
  };
  const icon = (name) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + PATHS[name] + '</svg>';

  const LOGO = '<svg viewBox="0 0 40 44" aria-hidden="true"><path d="M6 14h28l2 26a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#4F46E5"/><path d="M13 14v-3a7 7 0 0 1 14 0v3" fill="none" stroke="#4F46E5" stroke-width="3.5" stroke-linecap="round"/><path d="M14 26c2.4 4.6 9.6 4.6 12 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>';
  const CAT_ICON = { phones: '📱', electronics: '🎧', clothes: '👕', shoes: '👟', home: '🏠', beauty: '💄', baby: '🧸', other: '✨' };

  /* ---------- Network ---------- */
  async function api(path, opts) {
    let res;
    try { res = await fetch(path, opts); } catch (e) { throw new Error(t('offline')); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || t('generic_error'));
    return data;
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    let el = $('#toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
  }

  /* ---------- Cart ---------- */
  let cartItems = store.getJSON('cart', {});
  const Cart = {
    all: () => Object.keys(cartItems).map((k) => cartItems[k]),
    count: () => Cart.all().reduce((s, l) => s + l.qty, 0),
    subtotal: () => Cart.all().reduce((s, l) => s + l.price * l.qty, 0),
    save() { store.setJSON('cart', cartItems); badges(); },
    add(p, qty) {
      qty = qty || 1;
      if (!p || p.stock <= 0) return false;
      const cur = cartItems[p._id] ? cartItems[p._id].qty : 0;
      if (cur + qty > p.stock) { toast(t('max_stock')); return false; }
      cartItems[p._id] = { id: p._id, name: p.name, price: p.salePrice, image: (p.images && p.images[0]) || '', category: p.category, qty: cur + qty, stock: p.stock };
      Cart.save();
      toast(t('added'));
      $$('[data-cart-count]').forEach((el) => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); });
      return true;
    },
    set(id, qty) {
      const l = cartItems[id];
      if (!l) return;
      if (qty <= 0) delete cartItems[id]; else l.qty = Math.min(qty, l.stock);
      Cart.save();
    },
    remove(id) { delete cartItems[id]; Cart.save(); },
    clear() { cartItems = {}; Cart.save(); },
    // Pull the latest prices and stock from the server (the admin may have changed them).
    async refresh() {
      const ids = Object.keys(cartItems);
      if (!ids.length) return;
      const data = await api('/api/products?ids=' + ids.join(','));
      const fresh = {};
      data.items.forEach((p) => { fresh[p._id] = p; cache.set(p._id, p); });
      ids.forEach((id) => {
        const p = fresh[id];
        if (!p || p.stock <= 0) { delete cartItems[id]; return; }
        const l = cartItems[id];
        l.name = p.name; l.price = p.salePrice; l.stock = p.stock; l.image = (p.images && p.images[0]) || '';
        if (l.qty > p.stock) l.qty = p.stock;
      });
      Cart.save();
    },
  };

  /* ---------- Wishlist ---------- */
  let wishIds = store.getJSON('wish', []);
  const Wish = {
    ids: () => wishIds.slice(),
    has: (id) => wishIds.indexOf(id) !== -1,
    toggle(id) {
      const on = !Wish.has(id);
      wishIds = on ? wishIds.concat(id) : wishIds.filter((x) => x !== id);
      store.setJSON('wish', wishIds);
      badges();
      $$('[data-wish="' + id + '"]').forEach((b) => { b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
      toast(on ? t('saved') : t('unsaved'));
      fetch('/api/products/' + encodeURIComponent(id) + '/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ on }) }).catch(() => {});
      document.dispatchEvent(new CustomEvent('shop:wish', { detail: { id, on } }));
      return on;
    },
  };

  function badges() {
    $$('[data-cart-count]').forEach((el) => { const n = Cart.count(); el.textContent = n; el.hidden = n === 0; });
    $$('[data-wish-count]').forEach((el) => { const n = wishIds.length; el.textContent = n; el.hidden = n === 0; });
  }

  /* ---------- Products: cache and cards ---------- */
  const cache = new Map();
  const remember = (list) => { list.forEach((p) => cache.set(p._id, p)); return list; };
  async function getProduct(id) {
    if (cache.has(id)) return cache.get(id);
    const p = await api('/api/products/' + encodeURIComponent(id));
    cache.set(id, p);
    return p;
  }

  function stars(rating) {
    let h = '';
    for (let i = 1; i <= 5; i++) h += '<i class="' + (rating >= i - 0.25 ? 'on' : rating >= i - 0.75 ? 'half' : '') + '">★</i>';
    return '<span class="stars" aria-hidden="true">' + h + '</span>';
  }
  const ratingHTML = (p) => p.ratingCount
    ? '<div class="rating" title="' + p.rating + ' / 5">' + stars(p.rating) + '<span>(' + p.rating.toFixed(1) + ')</span></div>'
    : '<div class="rating"></div>';
  const priceHTML = (p) => '<div class="price"><b>' + rwf(p.salePrice) + '</b>' + (p.discount ? '<s>' + num(p.price) + '</s>' : '') + '</div>';
  const thumb = (p) => (p.images && p.images[0]
    ? '<img src="' + esc(p.images[0]) + '" alt="" loading="lazy" decoding="async" width="400" height="400">'
    : '<div class="ph-empty c-' + esc(p.category) + '" aria-hidden="true">' + (CAT_ICON[p.category] || '✨') + '</div>');

  function productCard(p) {
    const out = p.stock <= 0;
    const on = Wish.has(p._id);
    return '<article class="card' + (out ? ' out' : '') + '">' +
      '<div class="ph">' + thumb(p) + (p.discount ? '<span class="disc">-' + p.discount + '%</span>' : '') +
      '<button type="button" class="heart' + (on ? ' on' : '') + '" data-wish="' + esc(p._id) + '" aria-pressed="' + on + '" aria-label="' + esc(t('save')) + '">' + icon('heart') + '</button></div>' +
      '<div class="info"><h3><a class="stretch" href="/product.html?id=' + esc(p._id) + '">' + esc(p.name) + '</a></h3>' +
      (p.condition !== 'new' ? '<span class="chip">' + esc(t('cond_' + p.condition)) + '</span>' : '') +
      ratingHTML(p) + priceHTML(p) +
      (!out && p.stock <= 3 ? '<span class="low">' + esc(t('left', { n: p.stock })) + '</span>' : '') +
      '<button type="button" class="add-btn" data-add="' + esc(p._id) + '"' + (out ? ' disabled' : '') + '>' + (out ? esc(t('sold')) : icon('cart') + esc(t('add'))) + '</button></div></article>';
  }
  const skeletonCards = (n) => Array.from({ length: n || 5 }, () => '<div class="card" aria-hidden="true"><div class="ph sk"></div><div class="info"><div class="sk sk-line"></div><div class="sk sk-line short"></div></div></div>').join('');
  const gridHTML = (list) => remember(list).map(productCard).join('');

  /* ---------- Config, delivery fee, links ---------- */
  let cfg = null;
  function deliveryFee(method, district, subtotal) {
    if (method === 'pickup') return 0;
    if (!district) return null;
    const inKigali = cfg.kigali.indexOf(district) !== -1;
    if (inKigali && cfg.freeDeliveryOver > 0 && subtotal >= cfg.freeDeliveryOver) return 0;
    return inKigali ? cfg.fees.kigali : cfg.fees.upcountry;
  }
  const waLink = (text) => 'https://wa.me/' + (cfg.whatsapp || '') + '?text=' + encodeURIComponent(text);
  const catLabel = (c) => t('cat_' + c);
  const catHref = (c) => '/shop.html?category=' + encodeURIComponent(c);

  /* ---------- Header, footer, bottom nav ---------- */
  function langSelect() {
    return '<select class="lang-select" aria-label="' + esc(t('lang')) + '"><option value="en">EN</option><option value="rw">RW</option><option value="fr">FR</option></select>';
  }

  function renderChrome() {
    const page = document.body.dataset.page || '';
    const params = new URLSearchParams(location.search);
    const here = (name) => (page === name ? ' aria-current="page"' : '');
    const shopName = cfg.shopName;
    const half = Math.max(1, Math.ceil(shopName.length / 2));
    const logoName = '<b>' + esc(shopName.slice(0, half)) + '<em>' + esc(shopName.slice(half)) + '</em></b>';
    const logo = '<a class="logo" href="/index.html" aria-label="' + esc(shopName) + '">' + LOGO + '<span class="logo-text">' + logoName + '<small>' + esc(cfg.tagline) + '</small></span></a>';
    const announce = cfg.announcement || (cfg.freeDeliveryOver > 0 ? t('ann_free', { amt: rwf(cfg.freeDeliveryOver) }) : t('ann_from', { fee: rwf(cfg.fees.kigali) }));
    const dealsOn = page === 'shop' && params.get('deals') === '1';

    $('#site-header').innerHTML =
      '<div class="topbar only-desktop"><div class="wrap"><span class="tb-left">' + icon('truck') + esc(announce) + '</span>' +
      '<span class="tb-right"><a href="/track.html">' + icon('box') + esc(t('track_order')) + '</a><a href="/contact.html">' + icon('headset') + esc(t('support')) + '</a>' + langSelect() + '</span></div></div>' +
      '<header class="site-head"><div class="wrap head-main">' + logo +
      '<div class="search-wrap"><form class="search" action="/shop.html" role="search" autocomplete="off">' +
      '<span class="s-ic">' + icon('search') + '</span><input type="search" name="q" id="hq" placeholder="' + esc(t('search_ph')) + '" aria-label="' + esc(t('search')) + '" value="' + esc(page === 'shop' ? params.get('q') || '' : '') + '">' +
      '<button class="s-btn" type="submit" aria-label="' + esc(t('search')) + '">' + icon('search') + '</button></form><div class="suggest" id="suggest" hidden></div></div>' +
      '<div class="head-actions"><a class="hbtn only-desktop" href="/track.html">' + icon('user') + '<span class="lbl">' + esc(t('account')) + '</span></a>' +
      '<a class="hbtn" href="/wishlist.html" aria-label="' + esc(t('wishlist')) + '">' + icon('heart') + '<span class="lbl">' + esc(t('wishlist')) + '</span><i class="badge" data-wish-count hidden>0</i></a>' +
      '<a class="hbtn" href="/cart.html" aria-label="' + esc(t('cart')) + '">' + icon('cart') + '<span class="lbl">' + esc(t('cart')) + '</span><i class="badge" data-cart-count hidden>0</i></a></div></div>' +
      '<nav class="main-nav only-desktop" aria-label="Main"><div class="wrap">' +
      '<a href="/index.html"' + here('home') + '>' + esc(t('nav_home')) + '</a>' +
      '<a href="/shop.html"' + (page === 'shop' && !dealsOn ? ' aria-current="page"' : '') + '>' + esc(t('nav_shop')) + '</a>' +
      '<div class="dd"><button type="button" id="ddBtn" aria-expanded="false">' + esc(t('nav_categories')) + icon('down') + '</button><div class="dd-menu" id="ddMenu" hidden>' +
      cfg.categories.map((c) => '<a href="' + catHref(c) + '">' + (CAT_ICON[c] || '') + ' ' + esc(catLabel(c)) + '</a>').join('') + '</div></div>' +
      '<a href="/shop.html?deals=1"' + (dealsOn ? ' aria-current="page"' : '') + '>' + esc(t('nav_deals')) + '</a>' +
      '<a href="/about.html"' + here('about') + '>' + esc(t('nav_about')) + '</a>' +
      '<a href="/contact.html"' + here('contact') + '>' + esc(t('nav_contact')) + '</a></div></nav></header>';

    const contact = [];
    if (cfg.phone) contact.push('<a href="tel:' + esc(cfg.phone.replace(/[^\d+]/g, '')) + '">' + icon('phone').replace('<svg', '<svg width="16" height="16"') + ' ' + esc(cfg.phone) + '</a>');
    if (cfg.whatsapp) contact.push('<a href="https://wa.me/' + esc(cfg.whatsapp) + '" target="_blank" rel="noopener">' + esc(t('whatsapp_us')) + '</a>');
    if (cfg.email) contact.push('<a href="mailto:' + esc(cfg.email) + '">' + esc(cfg.email) + '</a>');
    if (cfg.address) contact.push('<span>' + esc(cfg.address) + '</span>');

    $('#site-footer').innerHTML =
      '<div class="wrap trust"><div class="trust-in"><span>' + icon('box') + esc(t('tf_track')) + '</span><span>' + icon('shield') + esc(t('tf_momo')) + '</span><span>' + icon('truck') + esc(t('tf_deliver')) + '</span><span>' + icon('headset') + esc(t('tf_support')) + '</span></div></div>' +
      '<footer class="site-foot"><div class="wrap"><div class="foot-grid"><div>' + logo.replace('class="logo"', 'class="logo"') + '<p class="foot-about">' + esc(cfg.about || t('about_text', { shop: shopName })) + '</p></div>' +
      '<div><h4>' + esc(t('quick_links')) + '</h4><a href="/index.html">' + esc(t('nav_home')) + '</a><a href="/shop.html">' + esc(t('nav_shop')) + '</a><a href="/shop.html?deals=1">' + esc(t('nav_deals')) + '</a><a href="/track.html">' + esc(t('track_order')) + '</a><a href="/about.html">' + esc(t('nav_about')) + '</a></div>' +
      '<div><h4>' + esc(t('nav_categories')) + '</h4>' + cfg.categories.slice(0, 5).map((c) => '<a href="' + catHref(c) + '">' + esc(catLabel(c)) + '</a>').join('') + '</div>' +
      '<div><h4>' + esc(t('contact_title')) + '</h4>' + (contact.join('') || '<a href="/contact.html">' + esc(t('nav_contact')) + '</a>') + '</div></div>' +
      '<div class="foot-bottom"><span>© ' + new Date().getFullYear() + ' ' + esc(shopName) + '. ' + esc(t('foot_note')) + '</span>' + langSelect() + '</div></div></footer>' +
      '<nav class="bottom-nav only-mobile" aria-label="Mobile"><a href="/index.html"' + here('home') + '>' + icon('home') + esc(t('bn_home')) + '</a>' +
      '<a href="/index.html#categories">' + icon('grid') + esc(t('bn_cats')) + '</a>' +
      '<a href="/wishlist.html"' + here('wishlist') + '>' + icon('heart') + esc(t('bn_wish')) + '</a>' +
      '<a href="/track.html"' + here('track') + '>' + icon('user') + esc(t('bn_account')) + '</a></nav>';

    $$('.lang-select').forEach((s) => { s.value = lang; s.addEventListener('change', () => { store.set('lang', s.value); location.reload(); }); });
    badges();
    wireDropdown();
    wireSuggest();
  }

  function wireDropdown() {
    const btn = $('#ddBtn');
    const menu = $('#ddMenu');
    if (!btn) return;
    const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', (e) => { e.stopPropagation(); const open = menu.hidden; menu.hidden = !open; btn.setAttribute('aria-expanded', String(open)); });
    document.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  // Live search suggestions under the header search box.
  function wireSuggest() {
    const input = $('#hq');
    const box = $('#suggest');
    let timer = 0;
    let seq = 0;
    const hide = () => { box.hidden = true; box.innerHTML = ''; };
    input.addEventListener('input', () => {
      clearTimeout(timer);
      const q = input.value.trim();
      if (q.length < 2) { hide(); return; }
      timer = setTimeout(async () => {
        const mine = ++seq;
        try {
          const data = await api('/api/products?limit=5&q=' + encodeURIComponent(q));
          if (mine !== seq) return;
          remember(data.items);
          if (!data.items.length) { hide(); return; }
          box.innerHTML = data.items.map((p) => '<a href="/product.html?id=' + esc(p._id) + '">' +
            (p.images && p.images[0] ? '<img src="' + esc(p.images[0]) + '" alt="">' : '<span class="sg-ph c-' + esc(p.category) + '">' + (CAT_ICON[p.category] || '') + '</span>') +
            '<span class="sg-name">' + esc(p.name) + '</span><span class="sg-price">' + rwf(p.salePrice) + '</span></a>').join('') +
            '<a class="sg-all" href="/shop.html?q=' + encodeURIComponent(q) + '">' + esc(t('see_all_for', { q })) + '</a>';
          box.hidden = false;
        } catch (e) { hide(); }
      }, 250);
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('.search-wrap')) hide(); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  }

  /* ---------- Global clicks: add to cart, save to wishlist ---------- */
  document.addEventListener('click', async (e) => {
    const w = e.target.closest('[data-wish]');
    if (w) { e.preventDefault(); Wish.toggle(w.dataset.wish); return; }
    const a = e.target.closest('[data-add]');
    if (a && !a.disabled) {
      try { Cart.add(await getProduct(a.dataset.add), 1); } catch (err) { toast(err.message); }
    }
  });
  window.addEventListener('storage', badges);

  /* ---------- Start ---------- */
  const ready = (async () => {
    try {
      cfg = await api('/api/config');
    } catch (err) {
      const app = $('#app');
      if (app) app.innerHTML = '<p class="empty">' + esc(err.message) + '</p>';
      throw err;
    }
    renderChrome();
    return cfg;
  })();

  function setTitle(text) { document.title = (text ? text + ' | ' : '') + cfg.shopName; }

  window.Shop = {
    $, $$, esc, num, rwf, store, t, icon, api, toast, ready, setTitle,
    Cart, Wish, cache, remember, getProduct, productCard, gridHTML, skeletonCards, stars, ratingHTML, priceHTML, thumb,
    deliveryFee, waLink, catLabel, catHref, CAT_ICON,
    get cfg() { return cfg; },
    get lang() { return lang; },
  };
})();
