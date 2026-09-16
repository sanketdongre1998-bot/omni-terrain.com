(() => {
  "use strict";

  const path = window.location.pathname.toLowerCase();
  const isUkStore = path.endsWith("/uk.html") || path.endsWith("/shield-autocare-uk.html") || path.endsWith("/uk-tyres.html") || path.includes("/uk-");
  const isUkCatalogue = path.endsWith("/shield-autocare-uk.html");

  if (isUkStore) {
    document.documentElement.classList.add("ot-uk-refresh");
    if (!document.querySelector('link[data-ot-uk-refresh]')) {
      const refresh = document.createElement("link");
      refresh.rel = "stylesheet";
      refresh.href = "assets/uk-storefront-refresh.css?v=2";
      refresh.dataset.otUkRefresh = "true";
      document.head.appendChild(refresh);
    }

    document.querySelectorAll(".market-note").forEach((el) => {
      if (/PRASAD\s+INC\s+LTD/i.test(el.textContent || "")) el.textContent = "UK storefront";
    });
    document.querySelectorAll(".hero-fact").forEach((fact) => {
      if (/PRASAD\s+INC\s+LTD/i.test(fact.textContent || "")) {
        const title = fact.querySelector("b");
        const copy = fact.querySelector("span");
        if (title) title.textContent = "UK storefront";
        if (copy) copy.textContent = "Clear product, delivery and support information for UK orders.";
      }
    });
    document.querySelectorAll(".business-band").forEach((band) => {
      if (/PRASAD\s+INC\s+LTD|19\s+Stones\s+Avenue/i.test(band.textContent || "")) {
        const container = band.querySelector(".container");
        if (container) container.innerHTML = '<div class="lead"><strong>Omni Terrain UK</strong><span>Practical product information and customer support for UK orders.</span></div><div><strong>Customer support</strong><span>support@omni-terrain.com</span></div><div><strong>Policies & terms</strong><span><a href="uk-terms-conditions.html">View UK legal information →</a></span></div>';
      }
    });
    document.querySelectorAll(".legal-note").forEach((el) => {
      if (/PRASAD\s+INC\s+LTD|19\s+Stones\s+Avenue/i.test(el.textContent || "")) el.innerHTML = 'UK business and legal information is available in our <a href="uk-terms-conditions.html">Terms &amp; Conditions</a>.';
    });
    document.querySelectorAll(".footer-bottom span").forEach((el) => {
      if (/PRASAD\s+INC\s+LTD|19\s+Stones\s+Avenue/i.test(el.textContent || "")) el.textContent = "United Kingdom storefront";
    });
    document.querySelectorAll('meta[property="og:description"],meta[name="description"]').forEach((meta) => {
      const content = meta.getAttribute("content") || "";
      if (/PRASAD\s+INC\s+LTD/i.test(content)) meta.setAttribute("content", content.replace(/,?\s*operated by PRASAD\s+INC\s+LTD\.?/gi, "."));
    });
    document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
      if (/PRASAD\s+INC\s+LTD|19\s+Stones\s+Avenue/i.test(script.textContent || "")) script.remove();
    });
  }

  function ensureStyle(selector, href, dataKey) {
    const existing = document.querySelector(selector);
    if (existing) {
      if (existing.tagName === "LINK" && existing.getAttribute("href") !== href) existing.setAttribute("href", href);
      return existing;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    if (dataKey) link.dataset[dataKey] = "true";
    document.head.appendChild(link);
    return link;
  }

  function renderUkCatalogue() {
    if (!isUkCatalogue) return;

    document.documentElement.classList.add("ot-uk-catalogue-commercial", "ot-shell-loaded");
    ensureStyle('link[data-ot-uk-catalogue-commercial],link[href*="uk-catalogue-commercial.css"]', "/assets/uk-catalogue-commercial.css?v=5", "otUkCatalogueCommercial");
    ensureStyle('link[data-ot-us-shell],link[href*="us-shell.css"]', "/assets/us-shell.css?v=4", "otUsShell");
    ensureStyle('link[data-ot-us-shell-refresh],link[href*="us-shell-refresh.css"]', "/assets/us-shell-refresh.css?v=2", "otUsShellRefresh");
    ensureStyle('link[data-ot-ui-consistency],link[href*="ui-consistency.css"]', "/assets/ui-consistency.css?v=1", "otUiConsistency");

    document.querySelectorAll("body > .announcement, body > .market-strip, body > #header, body > .draft-strip").forEach((node) => node.remove());
    document.getElementById("otUkCatalogueTop")?.remove();

    const ukMenu = (label) => `<h4>${label}</h4><a href="/shield-autocare-uk.html">Current UK range</a><a href="/uk-contact.html">Product &amp; fitment help</a><a href="/uk-shipping-delivery-policy.html">Delivery information</a><a class="all" href="/shield-autocare-uk.html">Shop available products →</a>`;
    const shell = document.createElement("div");
    shell.id = "otUkCatalogueTop";
    shell.innerHTML = `
      <div class="ot-site-announcement"><div class="ot-shell-container">
        <div class="ot-site-utility-left"><span>UK delivery on eligible products</span><span class="ot-site-region"><a href="/">US</a><a class="active" href="/uk.html">UK</a></span></div>
        <div class="ot-site-utility-center">Omni Terrain UK</div>
        <div class="ot-site-utility-right"><a href="/uk-contact.html">Expert Support</a><a href="/uk-returns-refunds-policy.html">Easy Returns</a></div>
      </div></div>
      <header class="ot-site-header" id="otUkSiteHeader">
        <div class="ot-shell-container ot-site-header-main">
          <a class="ot-site-brand ot-logo-direct" href="/uk.html" aria-label="Omni Terrain UK home"><img class="ot-brand-logo-image" src="/assets/omni-terrain-subtle-logo.svg?v=3" alt="Omni Terrain" width="340" height="78" decoding="async" loading="eager" fetchpriority="high"></a>
          <form class="ot-site-search" id="otUkSiteSearch" role="search"><input type="search" aria-label="Search UK products" placeholder="Search products, brand or MPN"><button type="submit">Search</button></form>
          <div class="ot-site-actions">
            <a class="ot-auth-trigger ot-auth-primary" href="/uk-contact.html"><span>Support</span><strong>UK Help</strong></a>
            <a class="ot-site-cart" href="/uk-cart.html"><span>Cart</span><strong><span class="ot-site-cart-count" data-uk-cart-count>0</span> items</strong></a>
            <button class="ot-site-menu" id="otUkSiteMenu" type="button" aria-expanded="false" aria-controls="otUkSiteMobileNav">Menu</button>
          </div>
        </div>
        <nav class="ot-site-categorybar" aria-label="UK store categories"><div class="ot-shell-container">
          <div class="ot-site-nav-item"><button type="button" aria-expanded="false">Auto Parts <i class="ot-site-nav-caret"></i></button><div class="ot-site-dropdown">${ukMenu("Auto Parts")}</div></div>
          <div class="ot-site-nav-item"><button type="button" aria-expanded="false">Marine <i class="ot-site-nav-caret"></i></button><div class="ot-site-dropdown">${ukMenu("Marine")}</div></div>
          <a class="active" href="/shield-autocare-uk.html">Campervan &amp; 12V</a>
          <a href="/shield-autocare-uk.html">Travel &amp; Overlanding</a>
          <a href="/uk-tyres.html">Tyres</a>
          <a class="featured" href="/shield-autocare-uk.html#products">Featured Deals</a>
          <a href="/uk-contact.html">Support</a>
        </div></nav>
        <nav class="ot-site-mobile-nav" id="otUkSiteMobileNav" aria-label="UK mobile navigation"><a href="/uk.html">UK Home</a><a href="/shield-autocare-uk.html">Shop Available Products</a><a href="/shield-autocare-uk.html#fridges">Fridges</a><a href="/shield-autocare-uk.html#windows">Windows</a><a href="/shield-autocare-uk.html#blinds">Blinds &amp; Flyscreens</a><a href="/uk-tyres.html">Tyres</a><a href="/uk-cart.html">Cart</a><a href="/uk-contact.html">Contact &amp; Support</a></nav>
      </header>`;
    document.body.insertBefore(shell, document.body.firstChild);

    const shellHeader = document.getElementById("otUkSiteHeader");
    const shellMenu = document.getElementById("otUkSiteMenu");
    const shellMobile = document.getElementById("otUkSiteMobileNav");
    if (shellHeader) {
      const update = () => shellHeader.classList.toggle("scrolled", window.scrollY > 8);
      update();
      window.addEventListener("scroll", update, { passive: true });
    }
    const navItems = [...shell.querySelectorAll(".ot-site-nav-item")];
    const closeNav = (except = null) => navItems.forEach((item) => {
      if (item === except) return;
      item.classList.remove("is-open");
      item.querySelector(":scope>button")?.setAttribute("aria-expanded", "false");
    });
    navItems.forEach((item) => {
      const button = item.querySelector(":scope>button");
      button?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const opening = !item.classList.contains("is-open");
        closeNav(item);
        item.classList.toggle("is-open", opening);
        button.setAttribute("aria-expanded", opening ? "true" : "false");
      });
    });
    document.addEventListener("click", (event) => { if (!event.target.closest("#otUkCatalogueTop .ot-site-nav-item")) closeNav(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeNav(); });
    if (shellMenu && shellMobile) {
      shellMenu.addEventListener("click", () => {
        const open = shellMobile.classList.toggle("open");
        shellMenu.setAttribute("aria-expanded", String(open));
        shellMenu.textContent = open ? "Close" : "Menu";
      });
      shellMobile.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
        shellMobile.classList.remove("open");
        shellMenu.setAttribute("aria-expanded", "false");
        shellMenu.textContent = "Menu";
      }));
    }

    const heroContainer = document.querySelector(".catalogue-hero > .container");
    if (heroContainer) {
      heroContainer.innerHTML = `
        <div class="ukcp-hero">
          <div class="ukcp-hero-grid">
            <div class="ukcp-hero-copy">
              <div class="ukcp-kicker">Omni Terrain / UK Store</div>
              <h1>Specialist campervan gear.<br><em>One focused range.</em></h1>
              <p>Shop specialist campervan refrigeration, frameless windows, blinds and flyscreens with clear GBP pricing, product details and UK support.</p>
              <p class="ukcp-hero-subcopy">Browse by product type, supplier part number and size, with VAT-inclusive pricing and fitment guidance before you order.</p>
              <div class="ukcp-hero-actions">
                <a href="#fridges">Shop Fridges →</a>
                <a href="#windows">Windows</a>
                <a href="#blinds">Blinds &amp; Flyscreens</a>
              </div>
            </div>
            <aside class="ukcp-search-card" aria-label="Search UK products">
              <div class="ukcp-search-heading"><span class="ukcp-search-icon">⌕</span><div><strong>MPN / PRODUCT</strong><b>Find the right item faster</b></div></div>
              <p>Search the live UK range by product name, brand, manufacturer part number or size.</p>
              <form class="ukcp-search-form"><input type="search" autocomplete="off" aria-label="Search UK products" placeholder="Enter MPN, product or size"><button type="submit">Search</button></form>
              <a class="ukcp-search-help" href="uk-contact.html">Need help choosing the right product? →</a>
            </aside>
          </div>
          <div class="ukcp-stats">
            <div class="ukcp-stat"><span class="ukcp-stat-icon">→</span><div><b>UK Delivery</b><span>Clear delivery information before checkout</span></div></div>
            <div class="ukcp-stat"><span class="ukcp-stat-icon">£</span><div><b>VAT Included</b><span>Customer prices displayed in GBP include VAT</span></div></div>
            <div class="ukcp-stat"><span class="ukcp-stat-icon">⚙</span><div><b>Fitment Support</b><span>Dimensions and pre-install checks available</span></div></div>
            <div class="ukcp-stat"><span class="ukcp-stat-icon">✓</span><div><b>Secure Checkout</b><span>Shop online through Omni Terrain</span></div></div>
          </div>
        </div>`;
    }

    const sectionTitle = document.querySelector("#products .section-title");
    if (sectionTitle) sectionTitle.innerHTML = "Start with your<br><em>setup.</em>";
    const sectionEyebrow = document.querySelector("#products .section-header .eyebrow");
    if (sectionEyebrow) sectionEyebrow.textContent = "Shop by product type";
    const sectionCopy = document.querySelector("#products .section-copy");
    if (sectionCopy) sectionCopy.textContent = "Three focused product groups keep the UK range easy to browse before you narrow by exact part number, size or specification.";

    const filterRow = document.querySelector("#products .filter-row");
    if (filterRow && !document.querySelector(".ukcp-departments")) {
      const departments = document.createElement("div");
      departments.className = "ukcp-departments";
      departments.innerHTML = `
        <a class="ukcp-department" href="#fridges"><small>REFRIGERATION</small><b>Campervan Fridges</b></a>
        <a class="ukcp-department" href="#windows"><small>FITMENT & APERTURES</small><b>Frameless Windows</b></a>
        <a class="ukcp-department" href="#blinds"><small>PRIVACY & VENTILATION</small><b>Blinds &amp; Flyscreens</b></a>`;
      filterRow.insertAdjacentElement("beforebegin", departments);
    }

    document.getElementById("otUkSiteSearch")?.addEventListener("submit", (event) => {
      event.preventDefault();
      applyTextSearch(event.currentTarget.querySelector("input")?.value || "");
    });
  }

  renderUkCatalogue();

  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const productCards = [...document.querySelectorAll("[data-product-category]")];
  const filterCount = document.querySelector("[data-filter-count]");

  function applyFilter(filter) {
    let visible = 0;
    productCards.forEach((card) => {
      const show = filter === "all" || card.dataset.productCategory === filter;
      card.hidden = !show;
      if (show) visible += 1;
    });
    filterButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.filter === filter)));
    if (filterCount) filterCount.textContent = String(visible);
  }

  function applyTextSearch(query) {
    const q = String(query || "").trim().toLowerCase();
    let visible = 0;
    productCards.forEach((card) => {
      const text = (card.textContent || "").toLowerCase();
      const show = !q || text.includes(q);
      card.hidden = !show;
      if (show) visible += 1;
    });
    filterButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.filter === "all")));
    if (filterCount) filterCount.textContent = String(visible);
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyFilter(button.dataset.filter);
      const url = new URL(window.location.href);
      url.hash = button.dataset.filter === "all" ? "products" : button.dataset.filter;
      window.history.replaceState(null, "", url);
    });
  });

  document.querySelectorAll(".ukcp-department,.ukcp-hero-actions a[href^='#']").forEach((link) => {
    link.addEventListener("click", (event) => {
      const filter = link.getAttribute("href")?.slice(1);
      if (!["fridges", "windows", "blinds"].includes(filter)) return;
      event.preventDefault();
      applyFilter(filter);
      window.history.replaceState(null, "", `#${filter}`);
      document.getElementById("products")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelector(".ukcp-search-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    applyTextSearch(event.currentTarget.querySelector("input")?.value || "");
  });

  const initialFilter = ["fridges", "windows", "blinds"].includes(window.location.hash.slice(1)) ? window.location.hash.slice(1) : "all";
  if (filterButtons.length) applyFilter(initialFilter);

  const galleryMain = document.getElementById("galleryMain");
  const galleryButtons = [...document.querySelectorAll("[data-gallery-src]")];
  galleryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!galleryMain) return;
      galleryMain.src = button.dataset.gallerySrc;
      galleryButtons.forEach((candidate) => candidate.classList.toggle("active", candidate === button));
    });
  });
})();