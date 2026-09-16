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

  function renderUkCatalogue() {
    if (!isUkCatalogue) return;

    document.documentElement.classList.add("ot-uk-catalogue-commercial");
    if (!document.querySelector('link[data-ot-uk-catalogue-commercial]')) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "assets/uk-catalogue-commercial.css?v=4";
      css.dataset.otUkCatalogueCommercial = "true";
      document.head.appendChild(css);
    }

    const headerBrand = document.querySelector("#header .brand");
    if (headerBrand) {
      headerBrand.href = "uk.html";
      headerBrand.innerHTML = '<img src="/assets/omni-terrain-approved-gt.webp?v=1" alt="Omni Terrain">';
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
  }

  renderUkCatalogue();

  const menu = document.getElementById("menuToggle");
  const mobileNav = document.getElementById("mobileNav");
  const header = document.getElementById("header");

  if (menu && mobileNav) {
    menu.addEventListener("click", () => {
      const open = mobileNav.classList.toggle("open");
      menu.setAttribute("aria-expanded", String(open));
      menu.textContent = open ? "Close" : "Menu";
    });
  }

  if (header) {
    const updateHeader = () => header.classList.toggle("scrolled", window.scrollY > 8);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  if (isUkStore) {
    const desktopNav = document.querySelector(".nav-links");
    if (desktopNav && !desktopNav.querySelector('a[href="uk-tyres.html"]')) {
      const link = document.createElement("a");
      link.href = "uk-tyres.html";
      link.textContent = "Tyres";
      if (path.endsWith("/uk-tyres.html")) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
      const support = [...desktopNav.querySelectorAll("a")].find((a) => /support|help/i.test(a.textContent));
      desktopNav.insertBefore(link, support || null);
    }
    if (mobileNav && !mobileNav.querySelector('a[href="uk-tyres.html"]')) {
      const link = document.createElement("a");
      link.href = "uk-tyres.html";
      link.textContent = "Tyres · 351 staged references";
      mobileNav.insertBefore(link, mobileNav.children[1] || null);
    }

    if (path.endsWith("/uk.html")) {
      const grid = document.querySelector("#shop-by-use .uk-category-grid");
      if (grid && !grid.querySelector('a[href="uk-tyres.html"]')) {
        const card = document.createElement("a");
        card.href = "uk-tyres.html";
        card.innerHTML = '<span class="range-status">Feed pending</span><h3>Tyres</h3><p>Browse 351 staged car, van and SUV tyre references by size and brand. Live price and stock will appear only after supplier SFTP validation.</p><b>Browse staged tyre range →</b>';
        grid.insertBefore(card, grid.children[1] || null);
      }
    }
  }

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