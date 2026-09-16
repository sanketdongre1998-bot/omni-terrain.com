(() => {
  "use strict";

  const path = window.location.pathname.toLowerCase();
  const isUkStore = path.endsWith("/uk.html") || path.endsWith("/shield-autocare-uk.html") || path.endsWith("/uk-tyres.html") || path.includes("/uk-");
  const isUkCatalogue = path.endsWith("/shield-autocare-uk.html");

  // UK-only visual refresh. The US storefront never loads this stylesheet/class.
  if (isUkStore) {
    document.documentElement.classList.add("ot-uk-refresh");
    if (!document.querySelector('link[data-ot-uk-refresh]')) {
      const refresh = document.createElement("link");
      refresh.rel = "stylesheet";
      refresh.href = "assets/uk-storefront-refresh.css?v=2";
      refresh.dataset.otUkRefresh = "true";
      document.head.appendChild(refresh);
    }

    // Keep company identifiers out of prominent merchandising surfaces. Dedicated legal/policy
    // pages remain the place for required business disclosures rather than repeating them site-wide.
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
        if (container) {
          container.innerHTML = '<div class="lead"><strong>Omni Terrain UK</strong><span>Practical product information and customer support for UK orders.</span></div><div><strong>Customer support</strong><span>support@omni-terrain.com</span></div><div><strong>Policies & terms</strong><span><a href="uk-terms-conditions.html">View UK legal information →</a></span></div>';
        }
      }
    });
    document.querySelectorAll(".legal-note").forEach((el) => {
      if (/PRASAD\s+INC\s+LTD|19\s+Stones\s+Avenue/i.test(el.textContent || "")) {
        el.innerHTML = 'UK business and legal information is available in our <a href="uk-terms-conditions.html">Terms &amp; Conditions</a>.';
      }
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

  // Make the live UK products page feel like a proper commercial catalogue rather than a supplier page.
  if (isUkCatalogue) {
    document.documentElement.classList.add("ot-uk-catalogue-commercial");
    if (!document.querySelector('link[data-ot-uk-catalogue-commercial]')) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "assets/uk-catalogue-commercial.css?v=1";
      css.dataset.otUkCatalogueCommercial = "true";
      document.head.appendChild(css);
    }

    const eyebrow = document.querySelector(".catalogue-hero .eyebrow");
    if (eyebrow) eyebrow.textContent = "Omni Terrain UK · Available now · Campervan essentials";

    const heroTitle = document.querySelector(".catalogue-hero h1");
    if (heroTitle) heroTitle.innerHTML = "Adventure-ready gear.<br><em>Clear fitment.</em>";

    const heroCopy = document.querySelector(".catalogue-hero .hero-copy");
    if (heroCopy) heroCopy.textContent = "Shop our current UK range of compressor fridges, frameless campervan windows, blackout blinds and flyscreens, with clear GBP pricing, fitment guidance and support before you buy.";

    const facts = [...document.querySelectorAll(".catalogue-hero .hero-fact")];
    if (facts[0]) {
      facts[0].querySelector("b").textContent = "UK stock & delivery";
      facts[0].querySelector("span").textContent = "Available products with clear UK delivery information.";
    }
    if (facts[1]) {
      facts[1].querySelector("b").textContent = "VAT included";
      facts[1].querySelector("span").textContent = "Customer prices displayed in GBP include UK VAT.";
    }
    if (facts[2]) {
      facts[2].querySelector("b").textContent = "Fitment support";
      facts[2].querySelector("span").textContent = "Dimensions and pre-install checks before you order.";
    }

    const sectionTitle = document.querySelector("#products .section-title");
    if (sectionTitle) sectionTitle.innerHTML = "Shop available<br><em>products.</em>";
    const sectionCopy = document.querySelector("#products .section-copy");
    if (sectionCopy) sectionCopy.textContent = "Browse the live UK range by product type. Each listing includes the current GBP price, product details and fitment guidance.";
  }

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

  // UK-only catalogue discovery. The US storefront does not load this path-specific enhancement.
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

    // Add a visible tyre-range card to the UK home only. It stays informational until SFTP validation.
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
    filterButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
    });
    if (filterCount) filterCount.textContent = String(visible);
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyFilter(button.dataset.filter);
      const url = new URL(window.location.href);
      if (button.dataset.filter === "all") {
        url.hash = "products";
      } else {
        url.hash = button.dataset.filter;
      }
      window.history.replaceState(null, "", url);
    });
  });

  const initialFilter = ["fridges", "windows", "blinds"].includes(window.location.hash.slice(1))
    ? window.location.hash.slice(1)
    : "all";
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