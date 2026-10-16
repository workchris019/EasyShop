// index.html: hero carousel (slides come from Admin > Hero banners), categories, product sections.
Shop.ready.then((cfg) => {
  const { $, $$, esc, t, icon, api } = Shop;
  Shop.setTitle(cfg.tagline);

  /* ----- Hero carousel ----- */
  const heroHref = (link) => {
    if (!link || link === 'all') return '/shop.html';
    if (link === 'deals') return '/shop.html?deals=1';
    if (link.indexOf('cat:') === 0) return Shop.catHref(link.slice(4));
    return link;
  };

  const slideHTML = (s, i, total) =>
    '<div class="slide" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' / ' + total + '">' +
    '<div class="slide-text">' + (s.badge ? '<span class="pill">' + esc(s.badge) + '</span>' : '') +
    '<h2>' + esc(s.title) + '</h2>' + (s.subtitle ? '<p>' + esc(s.subtitle) + '</p>' : '') +
    '<a class="btn" href="' + esc(heroHref(s.link)) + '">' + esc(s.buttonText || t('shop_now')) + icon('arrow') + '</a></div>' +
    (s.image
      ? '<div class="slide-img"><img src="' + esc(s.image) + '" alt=""' + (i === 0 ? '' : ' loading="lazy"') + ' decoding="async"></div>'
      : '<div class="slide-img decor" aria-hidden="true">🎧 📱 👟</div>') + '</div>';

  async function initHero() {
    let slides = [];
    try { slides = await api('/api/hero'); } catch (e) { slides = []; }
    if (!slides.length) slides = [{ title: t('hero_title'), subtitle: t('hero_sub'), buttonText: t('shop_now'), link: 'all', image: '' }];

    const root = $('#hero');
    const many = slides.length > 1;
    root.innerHTML =
      '<div class="hero-track" id="track">' + slides.map((s, i) => slideHTML(s, i, slides.length)).join('') + '</div>' +
      '<div class="hero-trust only-desktop"><span>' + icon('truck') + esc(t('tr_fast')) + '</span><span>' + icon('shield') + esc(t('tr_secure')) + '</span><span>' + icon('headset') + esc(t('tr_support')) + '</span></div>' +
      (many
        ? '<button type="button" class="hero-arrow prev" aria-label="Previous">' + icon('left') + '</button><button type="button" class="hero-arrow next" aria-label="Next">' + icon('right') + '</button>' +
          '<div class="hero-dots">' + slides.map((s, i) => '<button type="button" aria-label="' + (i + 1) + '"></button>').join('') + '</div>'
        : '');
    if (!many) return;

    const track = $('#track');
    const dots = $$('.hero-dots button', root);
    let index = 0;
    let timer = 0;
    const go = (i) => {
      index = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-100 * index) + '%)';
      dots.forEach((d, n) => d.setAttribute('aria-current', String(n === index)));
    };
    const play = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      clearInterval(timer);
      timer = setInterval(() => go(index + 1), 6000);
    };
    const stop = () => clearInterval(timer);
    $('.prev', root).addEventListener('click', () => { go(index - 1); play(); });
    $('.next', root).addEventListener('click', () => { go(index + 1); play(); });
    dots.forEach((d, n) => d.addEventListener('click', () => { go(n); play(); }));
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', play);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', play);
    let startX = null;
    root.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; stop(); }, { passive: true });
    root.addEventListener('touchend', (e) => {
      if (startX !== null) {
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      }
      startX = null;
      play();
    });
    go(0);
    play();
  }

  /* ----- Categories ----- */
  async function initCats() {
    const draw = (counts) => {
      $('#cats').innerHTML = cfg.categories.map((c) =>
        '<a class="tile" href="' + Shop.catHref(c) + '"><span class="ic c-' + c + '" aria-hidden="true">' + Shop.CAT_ICON[c] + '</span>' +
        '<b>' + esc(Shop.catLabel(c)) + '</b>' + (counts[c] ? '<small>(' + counts[c] + ')</small>' : '') + '</a>').join('');
    };
    draw({});
    try { draw(await api('/api/categories')); } catch (e) { /* counts are optional */ }
  }

  /* ----- Product sections ----- */
  const sections = [
    { id: 'featured', title: 'featured', url: '/api/products?featured=1&limit=10', href: '/shop.html' },
    { id: 'deals', title: 'deals', url: '/api/products?deals=1&sort=discount&limit=10', href: '/shop.html?deals=1' },
    { id: 'fresh', title: 'fresh', url: '/api/products?sort=new&limit=10', href: '/shop.html?sort=new' },
  ];

  async function initSections() {
    $('#sections').innerHTML = sections.map((s) =>
      '<section class="sec" id="sec-' + s.id + '"><div class="sec-head"><h2>' + esc(t(s.title)) + '</h2>' +
      '<a class="link" href="' + s.href + '">' + esc(t('view_all')) + ' →</a></div><div class="grid cap" id="grid-' + s.id + '">' + Shop.skeletonCards(5) + '</div></section>').join('');
    await Promise.all(sections.map(async (s) => {
      try {
        const data = await api(s.url);
        if (!data.items.length) { $('#sec-' + s.id).remove(); return; }
        $('#grid-' + s.id).innerHTML = Shop.gridHTML(data.items);
      } catch (e) {
        $('#grid-' + s.id).innerHTML = '<p class="empty">' + esc(e.message) + '</p>';
      }
    }));
    if (!$('#sections section')) {
      $('#sections').innerHTML = '<p class="empty">' + esc(t('none')) + '</p>';
    }
  }

  initHero();
  initCats();
  initSections();
});
