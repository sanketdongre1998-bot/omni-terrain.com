(() => {
  "use strict";
  if (window.__OMNI_MASTER_DROPDOWN__) return;
  window.__OMNI_MASTER_DROPDOWN__ = true;

  const path = String(location.pathname || "/").toLowerCase();
  const file = decodeURIComponent(path.split("/").filter(Boolean).pop() || "").toLowerCase();
  const lang = String(document.documentElement.lang || "").toLowerCase();
  const isUSHome = path === "/" || file === "index.html";
  const isUKHome = file === "uk.html";
  if (isUSHome || isUKHome) return;

  const isUK = lang === "en-gb" || /(^|\/)uk(?:-|\.|\/)/.test(path) || /shield-autocare-uk/.test(path);
  const ROOT_ID = "otUnifiedHeaderShell";
  const CART_KEY = isUK ? "omniTerrainUkCartV1" : "omniTerrainUsCart";

  const routes = isUK ? {
    home: "/uk.html",
    catalogue: "/shield-autocare-uk.html",
    auto: "/shield-autocare-uk.html",
    marine: "/shield-autocare-uk.html",
    rv: "/shield-autocare-uk.html",
    deals: "/shield-autocare-uk.html",
    support: "/uk-contact.html",
    returns: "/uk-returns-refunds-policy.html",
    cart: "/uk-cart.html",
    tyres: "/uk-tyres.html"
  } : {
    home: "/",
    catalogue: "/us-catalogue.html",
    auto: "/automotive.html",
    marine: "/marine.html",
    rv: "/rv.html",
    deals: "/deals.html",
    support: "/contact-and-order-help.html",
    returns: "/returns-refunds-policy.html",
    cart: "/cart.html",
    used: "/used-auto-parts.html"
  };

  function cartCount() {
    try {
      const rows = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (!Array.isArray(rows)) return 0;
      return rows.reduce((n, row) => n + Math.max(1, Number(isUK ? row?.qty : row?.quantity) || 1), 0);
    } catch (_) { return 0; }
  }

  function isActive(key) {
    if (key === "auto") return !isUK && /^automotive(?:-|\.)/.test(file);
    if (key === "used") return !isUK && file === "used-auto-parts.html";
    if (key === "marine") return !isUK && /^marine(?:-|\.)/.test(file);
    if (key === "rv") return !isUK && /^rv(?:-|\.)/.test(file);
    if (key === "deals") return !isUK && file === "deals.html";
    if (key === "support") return /contact/.test(file);
    if (key === "tyres") return isUK && /tyre/.test(file);
    if (key === "shop") return isUK && /shield-autocare-uk/.test(file);
    return false;
  }

  function usAutoMenu() {
    return `<h4>Auto Parts</h4>
      <a href="/automotive.html">New Auto Parts</a>
      <a href="/used-auto-parts.html"><strong>Used OEM Auto Parts</strong></a>
      <a href="/automotive.html">Exterior &amp; Body</a>
      <a href="/automotive.html">Interior Parts</a>
      <a href="/automotive.html">Performance</a>
      <a href="/automotive.html">Towing &amp; Hauling</a>
      <a href="/automotive.html">Replacement Parts</a>
      <a class="all" href="/automotive.html">Shop New Auto Parts →</a>`;
  }

  function usMarineMenu() {
    return `<h4>Marine</h4>
      <a href="/marine.html">Marine Electronics</a>
      <a href="/marine.html">Deck &amp; Hardware</a>
      <a href="/marine.html">Lighting</a>
      <a href="/marine.html">Anchoring &amp; Mooring</a>
      <a href="/marine.html">Safety &amp; Navigation</a>
      <a href="/marine.html">Boat Care &amp; Maintenance</a>
      <a class="all" href="/marine.html">Shop All Marine →</a>`;
  }

  function ukMenu(label) {
    return `<h4>${label}</h4>
      <a href="/shield-autocare-uk.html">Current UK range</a>
      <a href="/shield-autocare-uk.html#fridges">Campervan Fridges</a>
      <a href="/shield-autocare-uk.html#windows">Windows</a>
      <a href="/shield-autocare-uk.html#blinds">Blinds &amp; Flyscreens</a>
      <a href="/uk-tyres.html">Tyres</a>
      <a href="/uk-contact.html">Product &amp; Fitment Help</a>
      <a class="all" href="/shield-autocare-uk.html">Shop Available Products →</a>`;
  }

  function cleanupLegacy() {
    document.querySelectorAll("#otUsShellTop").forEach(node => node.remove());
    document.querySelectorAll("body > .announcement, body > .market-strip, body > .topbar, body > .used-top, body > .launch-strip, body > .draft-strip, body > .ot-retail-header, body > .ot-ref-header").forEach(node => node.remove());
    document.querySelectorAll("body > header").forEach(node => {
      if (!node.closest(`#${ROOT_ID}`)) node.remove();
    });
  }

  function desktopNav() {
    if (isUK) {
      return `
        <div class="ot-unified-nav-item ${isActive("shop") ? "active" : ""}"><button type="button" aria-expanded="false">Auto Parts <i></i></button><div class="ot-unified-dropdown">${ukMenu("Auto Parts")}</div></div>
        <div class="ot-unified-nav-item"><button type="button" aria-expanded="false">Marine <i></i></button><div class="ot-unified-dropdown">${ukMenu("Marine")}</div></div>
        <a href="/shield-autocare-uk.html">Campervan &amp; 12V</a>
        <a href="/shield-autocare-uk.html">Travel &amp; Overlanding</a>
        <a class="${isActive("tyres") ? "active" : ""}" href="/uk-tyres.html">Tyres</a>
        <a class="featured" href="/shield-autocare-uk.html">Featured Deals</a>
        <a class="${isActive("support") ? "active" : ""}" href="/uk-contact.html">Support</a>`;
    }
    return `
      <div class="ot-unified-nav-item ${isActive("auto") ? "active" : ""}"><button type="button" aria-expanded="false">Auto Parts <i></i></button><div class="ot-unified-dropdown">${usAutoMenu()}</div></div>
      <a class="${isActive("used") ? "active" : ""}" href="/used-auto-parts.html">Used OEM</a>
      <div class="ot-unified-nav-item ${isActive("marine") ? "active" : ""}"><button type="button" aria-expanded="false">Marine <i></i></button><div class="ot-unified-dropdown">${usMarineMenu()}</div></div>
      <a href="/us-catalogue.html">Solar &amp; 12V</a>
      <a class="${isActive("rv") ? "active" : ""}" href="/rv.html">Overlanding</a>
      <a class="featured ${isActive("deals") ? "active" : ""}" href="/deals.html">Featured Deals</a>
      <a class="${isActive("support") ? "active" : ""}" href="/contact-and-order-help.html">Support</a>`;
  }

  function mobileNav() {
    if (isUK) {
      return `<a href="/uk.html">UK Home</a><a href="/shield-autocare-uk.html">Shop Available</a><a href="/shield-autocare-uk.html#fridges">Fridges</a><a href="/shield-autocare-uk.html#windows">Windows</a><a href="/shield-autocare-uk.html#blinds">Blinds &amp; Flyscreens</a><a href="/uk-tyres.html">Tyres</a><a href="/uk-cart.html">Cart</a><a href="/uk-contact.html">Support</a>`;
    }
    return `<a href="/">Home</a><a href="/us-catalogue.html">Shop All Products</a><a href="/automotive.html">Auto Parts</a><a href="/used-auto-parts.html">Used OEM Auto Parts</a><a href="/marine.html">Marine</a><a href="/rv.html">RV &amp; Overlanding</a><a href="/deals.html">Featured Deals</a><a href="/cart.html">Cart</a><a href="/contact-and-order-help.html">Support</a>`;
  }

  function handleSearch(query) {
    const q = String(query || "").trim();
    if (!q) return;
    if (!isUK && file === "used-auto-parts.html") {
      const input = document.getElementById("usedPartNumber");
      if (input) input.value = q;
      document.getElementById("used-search")?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => input?.focus(), 180);
      return;
    }
    if (isUK) {
      location.href = `/shield-autocare-uk.html?q=${encodeURIComponent(q)}`;
      return;
    }
    try {
      sessionStorage.setItem("otPendingCatalogueSearch", q);
      sessionStorage.setItem("otCatalogueSearch", q);
    } catch (_) {}
    location.href = `/us-catalogue.html?q=${encodeURIComponent(q)}#catalogue-search`;
  }

  function bind(root) {
    const search = root.querySelector("#otUnifiedSearch");
    search?.addEventListener("submit", event => {
      event.preventDefault();
      handleSearch(search.querySelector("input")?.value || "");
    });

    const items = [...root.querySelectorAll(".ot-unified-nav-item")];
    const closeAll = except => items.forEach(item => {
      if (item === except) return;
      item.classList.remove("is-open");
      item.querySelector(":scope > button")?.setAttribute("aria-expanded", "false");
    });
    items.forEach(item => {
      const button = item.querySelector(":scope > button");
      button?.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        const opening = !item.classList.contains("is-open");
        closeAll(item);
        item.classList.toggle("is-open", opening);
        button.setAttribute("aria-expanded", opening ? "true" : "false");
      });
    });
    document.addEventListener("click", event => {
      if (!event.target.closest(".ot-unified-nav-item")) closeAll();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeAll();
    });

    const toggle = root.querySelector("#otUnifiedMenuButton");
    const mobile = root.querySelector("#otUnifiedMobileNav");
    toggle?.addEventListener("click", () => {
      const open = mobile?.classList.toggle("open") || false;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Close" : "Menu";
    });
    mobile?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
      mobile.classList.remove("open");
      toggle?.setAttribute("aria-expanded", "false");
      if (toggle) toggle.textContent = "Menu";
    }));
  }

  function mount() {
    if (!document.body) return false;
    cleanupLegacy();
    if (document.getElementById(ROOT_ID)) return true;

    const root = document.createElement("div");
    root.id = ROOT_ID;
    root.className = `ot-unified-shell ${isUK ? "is-uk" : "is-us"}`;
    root.innerHTML = `
      <div class="ot-unified-utility"><div class="ot-unified-width">
        <div class="ot-unified-utility-left"><span>${isUK ? "UK delivery on eligible products" : "Free standard shipping on eligible featured products"}</span><span class="ot-unified-region"><a class="${isUK ? "" : "active"}" href="/">US</a><a class="${isUK ? "active" : ""}" href="/uk.html">UK</a></span></div>
        <div class="ot-unified-utility-center">Gear for a Brighter Horizon</div>
        <div class="ot-unified-utility-right"><a href="${routes.support}">Expert Support</a><a href="${routes.returns}">Easy Returns</a></div>
      </div></div>
      <header class="ot-unified-header" id="otUnifiedHeader">
        <div class="ot-unified-mainbar"><div class="ot-unified-width">
          <a class="ot-unified-logo" href="${routes.home}" aria-label="Omni Terrain ${isUK ? "UK" : "US"} home"><img src="/assets/omni-terrain-approved-gt.webp?v=1" alt="Omni Terrain" width="300" height="80"></a>
          <form class="ot-unified-search" id="otUnifiedSearch" role="search"><input type="search" aria-label="Search products" placeholder="Search brand, MPN, part or vehicle..."><button type="submit">Search</button></form>
          <div class="ot-unified-actions"><button class="ot-unified-account" type="button" data-ot-auth-trigger aria-haspopup="dialog"><span>Account</span><strong>Sign In</strong></button><a class="ot-unified-cart" href="${routes.cart}"><span>Cart</span><strong><b data-ot-unified-cart-count>${cartCount()}</b> items</strong></a><button class="ot-unified-menu-button" id="otUnifiedMenuButton" type="button" aria-expanded="false" aria-controls="otUnifiedMobileNav">Menu</button></div>
        </div></div>
        <nav class="ot-unified-nav" aria-label="${isUK ? "UK" : "US"} store navigation"><div class="ot-unified-width">${desktopNav()}</div></nav>
        <nav class="ot-unified-mobile-nav" id="otUnifiedMobileNav" aria-label="Mobile navigation">${mobileNav()}</nav>
      </header>`;
    document.body.insertBefore(root, document.body.firstChild);
    bind(root);
    return true;
  }

  function syncCart() {
    const count = String(cartCount());
    document.querySelectorAll("[data-ot-unified-cart-count]").forEach(node => { node.textContent = count; });
  }

  const run = () => { mount(); cleanupLegacy(); syncCart(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
  else run();

  [120, 420, 900, 1800, 3200].forEach(delay => setTimeout(run, delay));
  window.addEventListener("storage", syncCart);

  if ("MutationObserver" in window) {
    const observer = new MutationObserver(mutations => {
      const legacyAdded = mutations.some(m => [...m.addedNodes].some(node => node.nodeType === 1 && (node.id === "otUsShellTop" || node.matches?.("header,.announcement,.market-strip,.topbar,.used-top"))));
      if (legacyAdded) requestAnimationFrame(run);
    });
    const start = () => {
      if (!document.body) return;
      observer.observe(document.body, { childList: true });
      setTimeout(() => observer.disconnect(), 6500);
    };
    if (document.body) start(); else document.addEventListener("DOMContentLoaded", start, { once: true });
  }
})();
