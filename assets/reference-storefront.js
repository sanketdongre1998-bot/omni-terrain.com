(() => {
  'use strict';
  if (window.__OMNI_REFERENCE_STOREFRONT__) return;

  const file = (location.pathname.split('/').pop() || '').toLowerCase();
  const isUS = !file || file === 'index.html';
  const isUK = file === 'uk.html';
  if (!isUS && !isUK) return;
  window.__OMNI_REFERENCE_STOREFRONT__ = true;

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = value => new Intl.NumberFormat(isUK ? 'en-GB' : 'en-US', { style: 'currency', currency: isUK ? 'GBP' : 'USD' }).format(Number(value) || 0);

  const US_CANDIDATES = [
    ['F37FTL5607','us-fabtech-ftl5607.html'], ['HUS81147','us-husky-towing-81147.html'], ['HUS81148','us-husky-towing-81148.html'],
    ['CCIN9010F','us-coast2coast-iwcn9010f.html'], ['CCIN8010F','us-coast2coast-iwcn8010f.html'], ['CCIIMP103X','us-coast2coast-iwcimp103x.html'],
    ['A1360828HD','us-air-lift-60828hd.html'], ['B5224066464','us-bilstein-24-066464.html']
  ];

  const IMG = {
    hero: '/assets/omni-main-hero-20260916.png',
    auto: '/assets/ot-cat-new-auto-final.jpg',
    used: '/assets/ot-cat-used-oem-hd-v2.webp?v=5',
    marine: '/assets/ot-cat-marine-hd-v2.webp?v=5',
    solar: '/assets/ot-cat-solar-hd-v2.webp?v=5',
    overland: '/assets/ot-cat-overland-hd-v2.webp?v=5',
    vehicle: '/assets/ot-cat-auto.webp',
    deals: '/assets/ot-cat-deals-hd-v2.webp?v=5'
  };

  function cartCount() {
    try {
      const key = isUK ? 'omniTerrainUkCartV1' : 'omniTerrainUsCart';
      const rows = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(rows)) return 0;
      return rows.reduce((n, row) => n + Math.max(1, Number(isUK ? row?.qty : row?.quantity) || 1), 0);
    } catch (_) { return 0; }
  }

  function catalogueSearch(q = '') {
    const text = String(q || '').trim();
    if (isUK) { filterUK(text); return; }
    try { text ? sessionStorage.setItem('otCatalogueSearch', text) : sessionStorage.removeItem('otCatalogueSearch'); } catch (_) {}
    location.href = '/us-catalogue.html#catalogue-search';
  }

  function removeLegacy() {
    document.querySelectorAll('.ot-retail-header,.announcement,.market-strip,#header,header.header,.launch-strip,.draft-strip,.mobile-store-bar').forEach(n => n.remove());
    document.querySelectorAll('[data-ot-theme-toggle],.ot-theme-toggle,.ot-welcome').forEach(n => n.remove());
    const oldFooter = document.querySelector('body>footer');
    if (oldFooter) oldFooter.remove();
  }

  function autoMenu() {
    return `<div class="ot-mega-head"><span class="ot-mega-kicker">VEHICLE PARTS</span><h4>Auto Parts</h4><p>New, used OEM and remanufactured parts with part-number-led shopping and fitment support.</p></div>
      <div class="ot-mega-links">
        <a href="/automotive.html"><strong>New Auto Parts</strong><small>New specialist parts and accessories</small></a>
        <a class="ot-mega-feature" href="/used-auto-parts.html"><strong>Used OEM Parts</strong><small>Genuine used factory components</small></a>
        <a href="/auto-reman.html"><strong>Remanufactured</strong><small>Selected rebuilt electronic and mechanical parts</small></a>
        <a href="/automotive.html"><strong>Performance</strong><small>Upgrade and performance components</small></a>
        <a href="/automotive.html"><strong>Towing &amp; Hauling</strong><small>Hitches, towing and load gear</small></a>
        <a href="/automotive.html"><strong>Replacement Parts</strong><small>Repair and replacement essentials</small></a>
      </div>
      <a class="all" href="/automotive.html">Browse all Auto Parts <span>→</span></a>`;
  }

  function marineMenu() {
    return `<div class="ot-mega-head"><span class="ot-mega-kicker">ON THE WATER</span><h4>Marine</h4><p>Marine parts, electronics and selected reman solutions for repair, maintenance and upgrades.</p></div>
      <div class="ot-mega-links">
        <a href="/marine.html"><strong>Marine Electronics</strong><small>Electronics, controls and accessories</small></a>
        <a class="ot-mega-feature" href="/marine-reman.html"><strong>Marine Reman</strong><small>Selected rebuilt marine components</small></a>
        <a href="/marine.html"><strong>Deck &amp; Hardware</strong><small>Deck fittings and marine hardware</small></a>
        <a href="/marine.html"><strong>Lighting</strong><small>Interior, deck and navigation lighting</small></a>
        <a href="/marine.html"><strong>Safety &amp; Navigation</strong><small>Safety and navigation essentials</small></a>
        <a href="/marine.html"><strong>Care &amp; Maintenance</strong><small>Maintenance and boat-care products</small></a>
      </div>
      <a class="all" href="/marine.html">Browse all Marine <span>→</span></a>`;
  }

  function ukMenu(label) {
    return `<div class="ot-mega-head"><span class="ot-mega-kicker">UK STORE</span><h4>${label}</h4><p>Browse the current UK range with product and fitment support when you need it.</p></div>
      <div class="ot-mega-links">
        <a class="ot-mega-feature" href="/shield-autocare-uk.html"><strong>Current UK Range</strong><small>Products currently available to the UK store</small></a>
        <a href="/shield-autocare-uk.html#fridges"><strong>Campervan Fridges</strong><small>Cooling for campervan and travel builds</small></a>
        <a href="/shield-autocare-uk.html#windows"><strong>Windows</strong><small>Campervan windows and fitting options</small></a>
        <a href="/shield-autocare-uk.html#blinds"><strong>Blinds &amp; Flyscreens</strong><small>Privacy, shade and ventilation solutions</small></a>
        <a href="/uk-tyres.html"><strong>Tyres</strong><small>Browse the current UK tyre range</small></a>
        <a href="/uk-contact.html"><strong>Product &amp; Fitment Help</strong><small>Get help before ordering</small></a>
      </div>
      <a class="all" href="/shield-autocare-uk.html">Browse available UK products <span>→</span></a>`;
  }

  function mountHeader() {
    const header = document.createElement('header');
    header.className = 'ot-ref-header';
    const support = isUK ? '/uk-contact.html' : '/contact-and-order-help.html';
    const cart = isUK ? '/uk-cart.html' : '/cart.html';
    const storeHome = isUK ? '/uk.html' : '/';
    const shipping = isUK ? 'UK delivery on eligible products' : 'Free standard shipping on eligible featured products';

    header.innerHTML = `
      <div class="ot-ref-utility"><div class="ot-ref-width">
        <div class="ot-ref-utility-left"><span>${shipping}</span><span class="ot-ref-region"><a class="${isUS ? 'active' : ''}" href="/">US</a><a class="${isUK ? 'active' : ''}" href="/uk.html">UK</a></span></div>
        <div class="ot-ref-utility-center">Gear for a Brighter Horizon</div>
        <div class="ot-ref-utility-right"><a href="${support}">Expert Support</a><a href="${isUK ? '/uk-returns-refunds-policy.html' : '/returns-refunds-policy.html'}">Easy Returns</a></div>
      </div></div>
      <div class="ot-ref-mainbar"><div class="ot-ref-width">
        <a class="ot-ref-logo" href="${storeHome}" aria-label="Omni Terrain ${isUK ? 'UK' : 'US'} home"><img src="/assets/omni-terrain-approved-gt.webp?v=1" alt="Omni Terrain"></a>
        <form class="ot-ref-search" id="otRefHeaderSearch" role="search"><input type="search" aria-label="Search products" placeholder="Search brand, MPN, part or vehicle..."><button type="submit">Search</button></form>
        <div class="ot-ref-actions"><button class="ot-ref-account" type="button" data-ot-auth-trigger><span>Account</span><strong>Sign In⌄</strong></button><a class="ot-ref-cart" href="${cart}"><span>Cart</span><strong><b>${cartCount()}</b> items</strong></a></div>
      </div></div>
      <nav class="ot-ref-nav"><div class="ot-ref-width">
        <div class="ot-ref-nav-item"><button type="button">Auto Parts⌄</button><div class="ot-ref-menu">${isUK ? ukMenu('Auto Parts') : autoMenu()}</div></div>
        ${isUS ? '<a class="ot-ref-used-nav" href="/used-auto-parts.html">Used OEM</a>' : ''}
        <div class="ot-ref-nav-item"><button type="button">Marine⌄</button><div class="ot-ref-menu">${isUK ? ukMenu('Marine') : marineMenu()}</div></div>
        <a href="${isUK ? '/shield-autocare-uk.html' : '/us-catalogue.html'}">${isUK ? 'Campervan & 12V' : 'Solar & 12V'}⌄</a>
        <a href="${isUK ? '/shield-autocare-uk.html' : '/rv.html'}">${isUK ? 'Travel & Overlanding' : 'Overlanding'}⌄</a>
        <a class="featured" href="${isUK ? '/shield-autocare-uk.html' : '/deals.html'}">Featured Deals</a>
        <a href="${support}">Support⌄</a>
      </div></nav>`;

    const main = document.querySelector('main');
    main?.insertAdjacentElement('beforebegin', header);
    header.querySelector('#otRefHeaderSearch')?.addEventListener('submit', e => {
      e.preventDefault();
      catalogueSearch(e.currentTarget.querySelector('input')?.value || '');
    });
  }

  function categories() {
    if (isUK) return [
      ['Auto Parts','Clear references and fitment help.','/uk-contact.html',IMG.auto],
      ['Marine','Parts & gear for life on the water.','/uk-contact.html',IMG.marine],
      ['Campervan','Fridges, windows, blinds and travel gear.','/shield-autocare-uk.html',IMG.overland],
      ['12V & Power','Power for campervans and mobile use.','/shield-autocare-uk.html',IMG.solar],
      ['Current Range','Browse products available to the UK store.','/shield-autocare-uk.html',IMG.vehicle],
      ['Featured','Current UK products and highlights.','/shield-autocare-uk.html',IMG.deals]
    ];

    return [
      ['New Auto Parts','New specialist parts for road, towing and travel.','/automotive.html',IMG.auto],
      ['Used OEM Auto Parts','Genuine used factory parts with part-number-led matching.','/used-auto-parts.html',IMG.used],
      ['Marine','Parts & gear for life on the water.','/marine.html',IMG.marine],
      ['Solar & 12V','Power your freedom off the grid.','/us-catalogue.html',IMG.solar],
      ['Overlanding','Gear for bigger adventures.','/rv.html',IMG.overland],
      ['Featured Deals','Top gear. Great prices. Brighter adventures.','/deals.html',IMG.deals]
    ];
  }

  function categoryCards() {
    return categories().map(([title, copy, href, img], index) => `<a class="ot-ref-category" href="${href}"><img src="${img}" alt="${esc(title)}" width="640" height="312" loading="${index < 3 ? 'eager' : 'lazy'}" decoding="async" fetchpriority="${index < 2 ? 'auto' : 'low'}"><div class="ot-ref-category-body"><strong>${esc(title)} →</strong><p>${esc(copy)}</p></div></a>`).join('');
  }

  async function loadUSProducts() {
    try {
      const [r1, r2] = await Promise.all([
        fetch('/assets/us-live-products.json?v=ref-1', { cache: 'no-store' }),
        fetch('/assets/us-stock-status.json?v=ref-1', { cache: 'no-store' })
      ]);
      if (!r1.ok) return [];
      const registry = await r1.json();
      const stock = r2.ok ? await r2.json() : { products: {} };
      const rows = [];
      for (const [id, slug] of US_CANDIDATES) {
        const p = registry?.products?.[id];
        const s = stock?.products?.[id];
        if (!p || p.enabled !== true || p.authorizationVerified !== true || Number(p.priceCents) <= 0) continue;
        if (s && s.checkoutReady === false) continue;
        rows.push({ id, slug, row: p, price: Number(p.priceCents) / 100 });
      }
      return await Promise.all(rows.slice(0, 6).map(hydrateUS));
    } catch (_) { return []; }
  }

  async function hydrateUS(item) {
    try {
      const r = await fetch('/' + item.slug, { cache: 'force-cache' });
      if (!r.ok) return item;
      const doc = new DOMParser().parseFromString(await r.text(), 'text/html');
      const title = (doc.querySelector('main h1')?.textContent || item.row?.mpn || 'Featured product').replace(/\s+/g, ' ').trim();
      const image = doc.querySelector('.product-visual img')?.getAttribute('src') || doc.querySelector('main img')?.getAttribute('src') || '';
      const kicker = (doc.querySelector('.kicker')?.textContent || '').replace(/\s+/g, ' ').trim();
      const brand = (kicker.split('·')[0] || item.row?.brand || 'Omni Terrain').trim();
      return { ...item, title, image, brand };
    } catch (_) { return item; }
  }

  function ukProducts() {
    return (Array.isArray(window.OMNI_SHIELD_PRODUCTS) ? window.OMNI_SHIELD_PRODUCTS : []).slice(0, 6).map(p => ({
      slug: p.slug,
      title: p.title,
      image: p.images?.[0] ? '/' + p.images[0] : '',
      brand: p.brand || 'Omni Terrain',
      price: Number(p.price) || 0,
      row: { mpn: p.mpn || '' }
    }));
  }

  function productCard(p, index) {
    const slug = p.slug || '#';
    const title = p.title || p.row?.mpn || 'Product';
    const brand = p.brand || p.row?.brand || 'Omni Terrain';
    const mpn = p.row?.mpn || '';
    return `<a class="ot-ref-product" href="/${esc(slug)}"><div class="ot-ref-product-media">${index === 0 ? '<span class="ot-ref-badge">Featured</span>' : ''}${p.image ? `<img src="${esc(p.image)}" alt="${esc(title)}" loading="${index < 2 ? 'eager' : 'lazy'}" decoding="async">` : ''}</div><div class="ot-ref-product-body"><small>${esc(brand)}${mpn ? ' · ' + esc(mpn) : ''}</small><h3>${esc(title)}</h3><div class="ot-ref-product-price">${money(p.price)}</div><span class="ot-ref-product-button">View product</span></div></a>`;
  }

  async function renderProducts() {
    const grid = document.getElementById('otRefProducts');
    if (!grid) return;
    const rows = isUK ? ukProducts() : await loadUSProducts();
    grid.innerHTML = rows.length ? rows.map(productCard).join('') : '<div class="ot-ref-empty"><strong>Browse the full current range</strong><p>Search by brand, category or exact manufacturer part number.</p></div>';
  }

  function filterUK(q) {
    const text = String(q || '').trim().toLowerCase();
    const all = Array.isArray(window.OMNI_SHIELD_PRODUCTS) ? window.OMNI_SHIELD_PRODUCTS : [];
    const rows = (text ? all.filter(p => [p.title,p.brand,p.mpn,p.category,p.segment].some(v => String(v || '').toLowerCase().includes(text))) : all)
      .slice(0, 12)
      .map(p => ({ slug: p.slug, title: p.title, image: p.images?.[0] ? '/' + p.images[0] : '', brand: p.brand || 'Omni Terrain', price: Number(p.price) || 0, row: { mpn: p.mpn || '' } }));
    const grid = document.getElementById('otRefProducts');
    if (grid) grid.innerHTML = rows.length ? rows.map(productCard).join('') : '<div class="ot-ref-empty">No exact match found. Try another product name, brand, MPN or size.</div>';
    document.getElementById('otRefProductsSection')?.scrollIntoView({ behavior: 'smooth' });
  }

  function mountMain() {
    const main = document.querySelector('main');
    if (!main) return;
    main.className = 'ot-ref-main';

    const shopAll = isUK ? '/shield-autocare-uk.html' : '/us-catalogue.html';
    const trustTitle = isUK ? 'Shopping Support' : 'Secure Checkout';
    const trustCopy = isUK ? 'Product and delivery help before you order.' : 'Shop with confidence.';

    main.innerHTML = `
      <section class="ot-ref-hero"><img class="ot-ref-hero-bg" src="${IMG.hero}" alt="Mountain lake adventure landscape"><div class="ot-ref-width ot-ref-hero-copy"><a class="ot-ref-hero-tag" href="${shopAll}">Shop All Products →</a><div class="ot-ref-hero-slogan">More<br>Horizons<br>Ahead</div></div></section>
      <section class="ot-ref-iconbar"><div class="ot-ref-width"><a class="ot-ref-shopall" href="${shopAll}">Shop All Products →</a><div class="ot-ref-pillar"><i>▣</i>Drive Further</div><div class="ot-ref-pillar"><i>≈</i>Explore More</div><div class="ot-ref-pillar"><i>☼</i>Power Bigger</div><div class="ot-ref-pillar"><i>▲</i>Live Outdoors</div></div></section>
      <section class="ot-ref-finder"><div class="ot-ref-width"><div class="ot-ref-finder-card"><div class="ot-ref-finder-copy"><h2>Find the Right Parts for Your Adventure</h2><p>${isUK ? 'Search by product, brand, MPN, dimensions or application.' : 'Search new parts by vehicle or exact manufacturer part number.'}</p></div><div><div class="ot-ref-findtabs"><span>${isUK ? 'Product' : 'Vehicle'}</span><span>${isUK ? 'Marine' : 'Used OEM'}</span><span>${isUK ? '12V & Power' : 'Marine'}</span><span>Universal Search</span></div><form class="ot-ref-findform" id="otRefFinder"><select aria-label="Year"><option value="">${isUK ? 'Category' : 'Select Year'}</option><option>${isUK ? 'Campervan' : '2026'}</option><option>${isUK ? 'Marine' : '2025'}</option></select><select aria-label="Make"><option value="">${isUK ? 'Brand' : 'Select Make'}</option></select><select aria-label="Model"><option value="">${isUK ? 'Product type' : 'Select Model'}</option></select><input type="search" aria-label="Search term" placeholder="${isUK ? 'Name, MPN or size' : 'MPN / keyword'}"><button type="submit">Find Parts →</button></form></div></div></div></section>
      <section class="ot-ref-section"><div class="ot-ref-width"><div class="ot-ref-section-head"><h2>Shop by Category</h2><a href="${shopAll}">View All Categories →</a></div><div class="ot-ref-category-grid">${categoryCards()}</div></div></section>
      ${isUS ? `<section class="ot-ref-used-callout"><div class="ot-ref-width"><div class="ot-ref-used-card"><div><span class="ot-ref-used-eyebrow">USED OEM AUTO PARTS</span><h2>Factory parts, matched by the numbers that matter.</h2><p>Search genuine used OEM electronics, modules, audio, climate controls and other selected components by OEM/MPN and vehicle details.</p></div><a href="/used-auto-parts.html">Shop Used OEM →</a></div></div></section>` : ''}
      <section class="ot-ref-section" id="otRefProductsSection"><div class="ot-ref-width"><div class="ot-ref-section-head"><h2>Featured Products</h2><a href="${shopAll}">View All Products →</a></div><div class="ot-ref-products" id="otRefProducts"><div class="ot-ref-empty">Loading current products…</div></div></div></section>
      <section class="ot-ref-trust"><div class="ot-ref-width"><div class="ot-ref-trust-item"><div class="ot-ref-trust-icon">→</div><div><strong>${isUK ? 'UK Delivery' : 'Fast, Reliable Shipping'}</strong><span>${isUK ? 'Delivery details shown for current products.' : 'Shipping terms shown before checkout.'}</span></div></div><div class="ot-ref-trust-item"><div class="ot-ref-trust-icon">✓</div><div><strong>${trustTitle}</strong><span>${trustCopy}</span></div></div><div class="ot-ref-trust-item"><div class="ot-ref-trust-icon">⚙</div><div><strong>Expert Fitment Help</strong><span>Get the right part the first time.</span></div></div><div class="ot-ref-trust-item"><div class="ot-ref-trust-icon">?</div><div><strong>Real People, Real Support</strong><span>Here for your next adventure.</span></div></div></div></section>`;

    main.querySelector('#otRefFinder')?.addEventListener('submit', e => {
      e.preventDefault();
      const values = [...e.currentTarget.querySelectorAll('select,input')].map(x => x.value).filter(Boolean);
      catalogueSearch(values.join(' '));
    });
  }

  function mountFooter() {
    const support = isUK ? '/uk-contact.html' : '/contact-and-order-help.html';
    const shop = isUK ? '/shield-autocare-uk.html' : '/us-catalogue.html';
    const privacy = isUK ? '/uk-privacy-policy.html' : '/privacy-policy.html';
    const terms = isUK ? '/uk-terms-conditions.html' : '/terms-conditions.html';
    const footer = document.createElement('footer');
    footer.className = 'ot-ref-footer';
    footer.innerHTML = `<div class="ot-ref-width"><div class="ot-ref-footer-main"><div><a class="ot-ref-footer-logo" href="${isUK ? '/uk.html' : '/'}"><img src="/assets/omni-terrain-approved-gt.webp?v=1" alt="Omni Terrain"></a><p>Quality parts and outdoor gear for vehicles, water, power and everywhere beyond.</p></div><div><h4>Shop</h4><nav><a href="${shop}">All Products</a><a href="${isUK ? '/uk-contact.html' : '/automotive.html'}">New Auto Parts</a>${isUS ? '<a href="/used-auto-parts.html">Used OEM Auto Parts</a>' : ''}<a href="${isUK ? '/uk-contact.html' : '/marine.html'}">Marine</a><a href="${isUK ? '/shield-autocare-uk.html' : '/rv.html'}">${isUK ? 'Campervan & 12V' : 'RV & Overlanding'}</a></nav></div><div><h4>Support</h4><nav><a href="${support}">Help Center</a><a href="${isUK ? '/uk-shipping-delivery-policy.html' : '/shipping-delivery-policy.html'}">Shipping & Delivery</a><a href="${isUK ? '/uk-returns-refunds-policy.html' : '/returns-refunds-policy.html'}">Returns & Warranty</a><a href="${support}">Fitment Help</a></nav></div><div><h4>About</h4><nav><a href="${support}">Contact Us</a><a href="${privacy}">Privacy</a><a href="${terms}">Terms</a></nav></div><div><h4>Join Our Journey</h4><p>Questions about a product or fitment? Our team is available to help.</p><nav><a href="${support}">Contact Omni Terrain →</a></nav></div></div><div class="ot-ref-footer-bottom"><span>© 2026 Omni Terrain. All rights reserved.</span><span>${isUK ? 'UK Store · GBP' : 'US Store · USD'} · Road / Water / Power</span></div></div>`;
    document.body.appendChild(footer);
  }

  function seo() {
    document.documentElement.lang = isUK ? 'en-GB' : 'en-US';
    document.documentElement.classList.add('ot-reference-home');
    document.documentElement.dataset.theme = 'light';
    document.documentElement.dataset.otTheme = 'light';
    document.documentElement.style.colorScheme = 'light';
  }

  function init() {
    removeLegacy();
    seo();
    mountHeader();
    mountMain();
    mountFooter();
    renderProducts();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
