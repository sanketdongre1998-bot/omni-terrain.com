(() => {
  "use strict";

  if (window.__OMNI_US_SHELL__) return;
  const path = String(window.location.pathname || "/").toLowerCase();
  const lang = String(document.documentElement.lang || "").toLowerCase();
  if (lang === "en-gb" || /(^|\/)uk(?:-|\.|\/)/.test(path) || /shield-autocare-uk/.test(path)) return;
  if (path === "/" || /\/index\.html$/.test(path)) return;
  window.__OMNI_US_SHELL__ = true;

  const CART_KEY = "omniTerrainUsCart";
  const file = decodeURIComponent(path.split("/").filter(Boolean).pop() || "");
  if (/^(automotive|marine|rv)(?:-|\.)/.test(file)) document.documentElement.classList.add("ot-department-page");

  function cartCount() {
    try {
      const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(cart) ? cart.reduce((sum, item) => sum + Math.max(1, Math.floor(Number(item && item.quantity) || 1)), 0) : 0;
    } catch (_) { return 0; }
  }

  function active(name) {
    if (name === "catalogue" && (file === "us-catalogue.html" || /^us-/.test(file))) return "active";
    if (name === "auto" && /^automotive(?:-|\.)/.test(file)) return "active";
    if (name === "marine" && /^marine(?:-|\.)/.test(file)) return "active";
    if (name === "rv" && /^rv(?:-|\.)/.test(file)) return "active";
    if (name === "help" && /contact-and-order-help/.test(file)) return "active";
    return "";
  }

  function brand() {
    return `<span class="ot-site-wordmark"><span class="ot-site-wordmark-main">OMNI</span><span class="ot-site-wordmark-sub">Terrain</span><span class="ot-site-wordmark-meta">Road / Water / Power</span></span>`;
  }

  function injectFonts() {
    if (!document.querySelector('link[href*="fonts.gstatic.com"]')) {
      const preconnect = document.createElement("link");
      preconnect.rel = "preconnect";
      preconnect.href = "https://fonts.gstatic.com";
      preconnect.crossOrigin = "anonymous";
      document.head.appendChild(preconnect);
    }
    if (!document.querySelector('link[href*="fonts.googleapis.com/css2"][href*="Barlow"]')) {
      const font = document.createElement("link");
      font.rel = "stylesheet";
      font.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&family=Teko:wght@500;600;700&display=swap";
      document.head.appendChild(font);
    }
  }

  function injectCss() {
    if (document.querySelector('link[href^="assets/us-shell.css"],link[href^="/assets/us-shell.css"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/assets/us-shell.css?v=3";
    document.head.appendChild(link);
  }

  function injectImageLayoutFix() {
    if (document.querySelector('link[data-ot-image-layout-fix]')) return;
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "/assets/image-layout-fix.css?v=2";
    css.dataset.otImageLayoutFix = "true";
    document.head.appendChild(css);
  }

  function injectProductAssets() {
    if (!document.querySelector(".product-layout") || !document.querySelector(".product-copy")) return;
    if (!document.querySelector('link[data-ot-product-premium]')) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "/assets/product-page-premium.css?v=2";
      css.dataset.otProductPremium = "true";
      document.head.appendChild(css);
    }
    if (!document.querySelector('link[data-ot-product-mobile]')) {
      const mobile = document.createElement("link");
      mobile.rel = "stylesheet";
      mobile.href = "/assets/product-mobile-fix.css?v=1";
      mobile.dataset.otProductMobile = "true";
      document.head.appendChild(mobile);
    }
    if (!document.querySelector('script[data-ot-product-premium]')) {
      const script = document.createElement("script");
      script.src = "/assets/product-page-premium.js?v=2";
      script.dataset.otProductPremium = "true";
      document.body.appendChild(script);
    }
  }

  function injectCatalogueAssets() {
    if (!(file === "us-catalogue.html" || /^(automotive|marine|rv)(?:-|\.)/.test(file))) return;
    if (document.querySelector('script[data-ot-catalogue-controls]')) return;
    const script = document.createElement("script");
    script.src = "/assets/catalogue-controls.js?v=2";
    script.dataset.otCatalogueControls = "true";
    document.body.appendChild(script);
  }

  function mountHeader() {
    document.documentElement.classList.add("ot-shell-loaded");
    document.querySelectorAll("body > .topbar, body > .announcement, body > .market-strip").forEach((node) => node.remove());
    const oldHeader = document.querySelector("body > header");
    if (oldHeader) oldHeader.remove();

    const shell = document.createElement("div");
    shell.id = "otUsShellTop";
    shell.innerHTML = `
      <div class="ot-site-announcement"><div class="ot-shell-container"><span><strong>Omni Terrain US:</strong> Specialist automotive, marine, RV &amp; 12V products.</span><a href="tel:+13075330570">Product support +1 307-533-0570 →</a></div></div>
      <div class="ot-site-market"><div class="ot-shell-container"><span class="ot-site-market-label">Store region</span><a class="active" href="index.html">United States</a><a href="uk.html">United Kingdom</a><span class="ot-site-market-note">Online pricing is live on selected products.</span></div></div>
      <header class="ot-site-header" id="otSiteHeader"><div class="ot-shell-container ot-site-header-main">
        <a class="ot-site-brand" href="index.html" aria-label="Omni Terrain home">${brand()}</a>
        <nav class="ot-site-nav" aria-label="US store navigation"><a href="index.html">Home</a><a class="${active("catalogue")}" href="us-catalogue.html">Shop All</a><a class="${active("auto")}" href="automotive.html">Auto Parts</a><a class="${active("marine")}" href="marine.html">Marine</a><a class="${active("rv")}" href="rv.html">RV &amp; Overlanding</a><a class="${active("help")}" href="contact-and-order-help.html">Help</a></nav>
        <div class="ot-site-actions"><a class="ot-site-cart" href="cart.html">Cart <span class="ot-site-cart-count" data-cart-count>${cartCount()}</span></a><button class="ot-site-menu" id="otSiteMenu" type="button" aria-expanded="false" aria-controls="otSiteMobileNav">Menu</button></div>
      </div><nav class="ot-site-mobile-nav" id="otSiteMobileNav" aria-label="US mobile navigation"><a href="index.html">Home</a><a href="us-catalogue.html">Shop All Products</a><a href="automotive.html">Auto Parts</a><a href="marine.html">Marine</a><a href="rv.html">RV &amp; Overlanding</a><a href="cart.html">Cart</a><a href="checkout.html">Checkout</a><a href="contact-and-order-help.html">Contact &amp; Support</a></nav></header>`;
    document.body.insertBefore(shell, document.body.firstChild);

    const header = document.getElementById("otSiteHeader");
    const menu = document.getElementById("otSiteMenu");
    const mobile = document.getElementById("otSiteMobileNav");
    if (header) {
      const update = () => header.classList.toggle("scrolled", window.scrollY > 8);
      update(); window.addEventListener("scroll", update, { passive: true });
    }
    if (menu && mobile) {
      menu.addEventListener("click", () => {
        const open = mobile.classList.toggle("open");
        menu.setAttribute("aria-expanded", String(open));
        menu.textContent = open ? "Close" : "Menu";
      });
      mobile.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => { mobile.classList.remove("open"); menu.setAttribute("aria-expanded", "false"); menu.textContent = "Menu"; }));
    }
  }

  function mountFooter() {
    const oldFooter = document.querySelector("body > footer, body > .footer");
    if (oldFooter) oldFooter.remove();
    document.querySelectorAll("body > .mobile-store-bar").forEach((node) => node.remove());

    const footer = document.createElement("footer");
    footer.className = "ot-site-footer";
    footer.innerHTML = `<div class="ot-shell-container"><div class="ot-site-footer-grid"><div><a class="ot-site-brand" href="index.html">${brand()}</a><p class="ot-site-footer-copy">Specialist automotive, marine, RV and 12V parts for road, water and travel.</p><p class="ot-site-legal"><strong>US operator:</strong> PRP Xpert LLC · 30 N Gould St Ste R, Sheridan, WY 82801 · procurement@omni-terrain.com</p></div><div><div class="ot-site-footer-heading">Shop US</div><div class="ot-site-footer-links"><a href="us-catalogue.html">All Products</a><a href="automotive.html">Auto Parts</a><a href="marine.html">Marine</a><a href="rv.html">RV &amp; Overlanding</a></div></div><div><div class="ot-site-footer-heading">Checkout &amp; support</div><div class="ot-site-footer-links"><a href="cart.html">Cart</a><a href="checkout.html">Checkout</a><a href="contact-and-order-help.html">Contact &amp; Order Help</a><a href="tel:+13075330570">+1 307-533-0570</a></div></div><div><div class="ot-site-footer-heading">Policies</div><div class="ot-site-footer-links"><a href="shipping-delivery-policy.html">Shipping</a><a href="returns-refunds-policy.html">Returns</a><a href="privacy-policy.html">Privacy</a><a href="terms-conditions.html">Terms</a></div></div></div><div class="ot-site-footer-bottom"><span>© 2026 Omni Terrain. All rights reserved.</span><span>US Store · Specialist parts for road, water and travel</span></div></div>`;
    document.body.appendChild(footer);

    const mobile = document.createElement("div");
    mobile.className = "ot-site-mobile-bar";
    mobile.innerHTML = '<a href="us-catalogue.html">Shop products</a><a href="cart.html">Cart</a>';
    document.body.appendChild(mobile);
  }

  function syncCart() {
    const count = String(cartCount());
    document.querySelectorAll("[data-cart-count]").forEach((node) => { node.textContent = count; });
  }

  function mount() {
    injectFonts();
    injectCss();
    injectImageLayoutFix();
    mountHeader();
    mountFooter();
    syncCart();
    injectProductAssets();
    injectCatalogueAssets();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();
