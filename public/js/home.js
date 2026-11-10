// index.html: banner carousel at the top, categories with pictures, then Featured, Deals and New Arrivals.
Shop.ready.then((cfg) => {
  const { $, $$, esc, t, icon, api } = Shop;
  Shop.setTitle(cfg.tagline);

  /* ----- Banners (Admin > Deals banners). The button always leads to the Deals page. ----- */
  const heroHref = (link) => {
    if (!link || link === 'all' || link === 'deals') return '/shop.html?deals=1';
    if (link.indexOf('cat:') === 0) return Shop.catHref(link.slice(4));
    return link;
  };

  // The picture takes the right 60% of the banner (a 16:9 picture fits exactly) and fades into the background; the text sits on the left 40% and overlaps it.
  const slideHTML = (s, i, total) =>
    '<div class="slide" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' / ' + total + '">' +
    '<div class="slide-img"><img src="' + esc(s.image) + '" alt="' + esc(s.title) + '"' + (i === 0 ? '' : ' loading="lazy"') + ' decoding="async"></div>' +
    '<div class="slide-text">' + (s.badge ? '<span class="pill">' + esc(s.badge) + '</span>' : '') +
    '<h2>' + esc(s.title) + '</h2>' + (s.subtitle ? '<p>' + esc(s.subtitle) + '</p>' : '') +
    '<a class="btn" href="' + esc(heroHref(s.link)) + '">' + esc(s.buttonText || t('shop_now')) + icon('arrow') + '</a></div></div>';

  const trustHTML = '<div class="hero-trust only-desktop"><span>' + icon('truck') + esc(t('tr_fast')) + '</span><span>' + icon('shield') + esc(t('tr_secure')) + '</span><a href="/support.html">' + icon('headset') + esc(t('tr_support')) + '</a></div>';

  async function initBanners() {
    const root = $('#hero');
    let slides = [];
    try { slides = (await api('/api/hero')).filter((x) => x.image); } catch (e) { slides = []; }
    if (!slides.length) { root.remove(); return; }
    const many = slides.length > 1;
    root.innerHTML =
      '<div class="hero-track" id="track">' + slides.map((s, i) => slideHTML(s, i, slides.length)).join('') + '</div>' + trustHTML +
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
      clearInterval(timer);
      timer = setInterval(() => { if (!document.hidden) go(index + 1); }, 5000);
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

  /* ----- Categories (with pictures) ----- */
  async function initCats() {
    const draw = (counts) => {
      $('#cats').innerHTML = cfg.categories.map((c) => {
        const it = Shop.catItem(c);
        const inner = it && it.image
          ? '<img src="' + esc(it.image) + '" alt="" loading="lazy" decoding="async" width="124" height="124">'
          : esc((it && it.icon) || Shop.CAT_ICON[c] || '✨');
        return '<a class="tile" href="' + Shop.catHref(c) + '"><span class="ic c-' + esc(c) + '" aria-hidden="true">' + inner + '</span>' +
          '<b>' + esc(Shop.catLabel(c)) + '</b>' + (counts[c] ? '<small>(' + counts[c] + ')</small>' : '') + '</a>';
      }).join('');
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
      '<a class="link" href="' + s.href + '">' + esc(t('view_all')) + ' →</a></div>' +
      '<div class="grid cap" id="grid-' + s.id + '">' + Shop.skeletonCards(5) + '</div></section>').join('');

    await Promise.all(sections.map(async (s) => {
      let items = [];
      let failed = null;
      try { items = (await api(s.url)).items; } catch (e) { failed = e; }

      if (failed) { $('#grid-' + s.id).innerHTML = '<p class="empty">' + esc(failed.message) + '</p>'; return; }
      if (!items.length) { $('#sec-' + s.id).remove(); return; }
      $('#grid-' + s.id).innerHTML = Shop.gridHTML(items);
    }));
    if (!$('#sections section')) {
      $('#sections').innerHTML = '<p class="empty">' + esc(t('none')) + '</p>';
    }
  }

  initBanners();
  initCats();
  initSections();
});
