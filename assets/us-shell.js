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
  const isCatalogue = file === "us-catalogue.html" || /^(automotive|marine|rv)(?:-|\.)/.test(file);
  const isProduct = /^us-/.test(file) && file !== "us-catalogue.html";
  if (/^(automotive|marine|rv)(?:-|\.)/.test(file)) document.documentElement.classList.add("ot-department-page");

  function cartCount() {
    try {
      const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(cart) ? cart.reduce((sum, item) => sum + Math.max(1, Math.floor(Number(item && item.quantity) || 1)), 0) : 0;
    } catch (_) { return 0; }
  }

  function active(name) {
    if (name === "deals" && file === "deals.html") return "active";
    if (name === "catalogue" && (file === "us-catalogue.html" || /^us-/.test(file))) return "active";
    if (name === "auto" && /^automotive(?:-|\.)/.test(file)) return "active";
    if (name === "marine" && /^marine(?:-|\.)/.test(file)) return "active";
    if (name === "rv" && /^rv(?:-|\.)/.test(file)) return "active";
    if (name === "help" && /contact-and-order-help/.test(file)) return "active";
    return "";
  }

  function brand() {
    return `<img class="ot-brand-logo-image" src="https://raw.githubusercontent.com/sanketdongre1998-bot/omni-terrain.com/main/assets/omni-terrain-logo-lock.webp" alt="Omni Terrain" width="240" height="56" decoding="async">`;
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
      font.media = "print";
      font.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=DM+Mono:wght@500&family=Manrope:wght@500;600;700;800&display=swap";
      font.onload = () => { font.media = "all"; };
      document.head.appendChild(font);
    }
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

  function injectCss() {
    ensureStyle('link[href*="storefront-performance.css"]', "/assets/storefront-performance.css", "otStorefrontPerformance");
    ensureStyle('link[href*="us-shell.css"]', "/assets/us-shell.css?v=4", "otUsShell");
    ensureStyle('link[data-ot-image-layout-fix],link[data-ot-image-layout],link[href*="image-layout-fix.css"]', "/assets/image-layout-fix.css?v=2", "otImageLayoutFix");
    ensureStyle('link[data-ot-responsive-hardening],link[href*="responsive-hardening.css"]', "/assets/responsive-hardening.css?v=4", "otResponsiveHardening");
    ensureStyle('link[data-ot-brand-speed],link[href*="brand-speed.css"]', "/assets/brand-speed.css?v=9", "otBrandSpeed");
  }

  function injectStockStatusAssets() {
    if (!(isCatalogue || isProduct) || document.querySelector('script[data-ot-stock-status]')) return;
    const script = document.createElement("script");
    script.src = "/assets/us-stock-status-ui.js?v=1";
    script.dataset.otStockStatus = "true";
    script.defer = true;
    document.body.appendChild(script);
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
      script.src = "/assets/product-page-premium.js?v=3";
      script.dataset.otProductPremium = "true";
      script.defer = true;
      document.body.appendChild(script);
    }
    if (!document.querySelector('script[data-ot-universal-checkout]')) {
      const universal = document.createElement("script");
      universal.src = "/assets/universal-checkout-ui.js?v=2";
      universal.dataset.otUniversalCheckout = "true";
      universal.defer = true;
      document.body.appendChild(universal);
    }
  }

  function injectCatalogueAssets() {
    if (!isCatalogue || document.querySelector('script[data-ot-catalogue-controls]')) return;
    const script = document.createElement("script");
    script.src = "/assets/catalogue-controls.js?v=9";
    script.dataset.otCatalogueControls = "true";
    script.defer = true;
    document.body.appendChild(script);
  }

  function injectCommerceAssets() {
    if (!(file === "cart.html" || file === "checkout.html")) return;
    if (!document.querySelector('link[data-ot-commerce-premium]')) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "/assets/cart-checkout-premium.css?v=1";
      css.dataset.otCommercePremium = "true";
      document.head.appendChild(css);
    }

    const appendPremium = () => {
      if (document.querySelector('script[data-ot-commerce-premium]')) return;
      const script = document.createElement("script");
      script.src = "/assets/cart-checkout-premium.js?v=3";
      script.dataset.otCommercePremium = "true";
      script.defer = true;
      document.body.appendChild(script);
    };

    if (file === "checkout.html" && !window.__OMNI_US_CHECKOUT_API_BRIDGE__) {
      const existing = document.querySelector('script[data-ot-checkout-api-bridge]');
      if (existing) {
        existing.addEventListener("load", appendPremium, { once: true });
      } else {
        const bridge = document.createElement("script");
        bridge.src = "/assets/us-checkout-api-bridge.js?v=1";
        bridge.dataset.otCheckoutApiBridge = "true";
        bridge.defer = true;
        bridge.addEventListener("load", appendPremium, { once: true });
        bridge.addEventListener("error", appendPremium, { once: true });
        document.body.appendChild(bridge);
      }
    } else {
      appendPremium();
    }
  }

  function injectGrowthAssets() {
    if (document.querySelector('script[data-ot-growth-marketing],script[src*="growth-marketing.js"]')) return;
    const load = () => {
      if (document.querySelector('script[data-ot-growth-marketing],script[src*="growth-marketing.js"]')) return;
      const script = document.createElement("script");
      script.src = "/assets/growth-marketing.js?v=3";
      script.dataset.otGrowthMarketing = "true";
      script.defer = true;
      document.body.appendChild(script);
    };
    if ("requestIdleCallback" in window) requestIdleCallback(load, { timeout: 1400 });
    else setTimeout(load, 700);
  }

  function mountHeader() {
    document.documentElement.classList.add("ot-shell-loaded");
    document.querySelectorAll("body > .topbar, body > .announcement, body > .market-strip").forEach((node) => node.remove());
    const oldHeader = document.querySelector("body > header");
    if (oldHeader) oldHeader.remove();

    const shell = document.createElement("div");
    shell.id = "otUsShellTop";
    shell.innerHTML = `
      <div class="ot-site-announcement"><div class="ot-shell-container"><span><strong>Omni Terrain US:</strong> Specialist automotive, marine, RV &amp; 12V products.</span><a href="deals.html">Shop 7 featured deals →</a></div></div>
      <div class="ot-site-market"><div class="ot-shell-container"><span class="ot-site-market-label">Store region</span><a class="active" href="index.html">United States</a><a href="uk.html">United Kingdom</a><span class="ot-site-market-note">U.S. pricing · Secure online checkout</span></div></div>
      <header class="ot-site-header" id="otSiteHeader"><div class="ot-shell-container ot-site-header-main">
        <a class="ot-site-brand ot-logo-direct" href="index.html" aria-label="Omni Terrain home">${brand()}</a>
        <nav class="ot-site-nav" aria-label="US store navigation"><a href="index.html">Home</a><a class="${active("catalogue")}" href="us-catalogue.html">Shop All</a><a class="${active("deals")}" href="deals.html">Deals</a><a class="${active("auto")}" href="automotive.html">Auto Parts</a><a class="${active("marine")}" href="marine.html">Marine</a><a class="${active("rv")}" href="rv.html">RV &amp; Overlanding</a><a class="${active("help")}" href="contact-and-order-help.html">Help</a></nav>
        <div class="ot-site-actions"><a class="ot-site-cart" href="cart.html">Cart <span class="ot-site-cart-count" data-cart-count>${cartCount()}</span></a><button class="ot-site-menu" id="otSiteMenu" type="button" aria-expanded="false" aria-controls="otSiteMobileNav">Menu</button></div>
      </div><nav class="ot-site-mobile-nav" id="otSiteMobileNav" aria-label="US mobile navigation"><a href="index.html">Home</a><a href="us-catalogue.html">Shop All Products</a><a href="deals.html">Featured Deals</a><a href="automotive.html">Auto Parts</a><a href="marine.html">Marine</a><a href="rv.html">RV &amp; Overlanding</a><a href="cart.html">Cart</a><a href="checkout.html">Checkout</a><a href="contact-and-order-help.html">Contact &amp; Support</a></nav></header>`;
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
    footer.innerHTML = `<div class="ot-shell-container"><div class="ot-site-footer-grid"><div><a class="ot-site-brand ot-logo-direct" href="index.html">${brand()}</a><p class="ot-site-footer-copy">Specialist automotive, marine, RV and 12V parts for road, water and travel.</p><p class="ot-site-legal"><strong>US operator:</strong> PRP Xpert LLC · 30 N Gould St Ste R, Sheridan, WY 82801 · procurement@omni-terrain.com</p></div><div><div class="ot-site-footer-heading">Shop US</div><div class="ot-site-footer-links"><a href="deals.html">Featured Deals</a><a href="us-catalogue.html">All Products</a><a href="automotive.html">Auto Parts</a><a href="marine.html">Marine</a><a href="rv.html">RV &amp; Overlanding</a></div></div><div><div class="ot-site-footer-heading">Checkout &amp; support</div><div class="ot-site-footer-links"><a href="cart.html">Cart</a><a href="checkout.html">Checkout</a><a href="contact-and-order-help.html">Contact &amp; Order Help</a><a href="tel:+13075330570">+1 307-533-0570</a></div></div><div><div class="ot-site-footer-heading">Policies</div><div class="ot-site-footer-links"><a href="shipping-delivery-policy.html">Shipping</a><a href="returns-refunds-policy.html">Returns</a><a href="privacy-policy.html">Privacy</a><a href="terms-conditions.html">Terms</a></div></div></div><div class="ot-site-footer-bottom"><span>© 2026 Omni Terrain. All rights reserved.</span><span>US Store · Specialist parts for road, water and travel</span></div></div>`;
    document.body.appendChild(footer);

    const mobile = document.createElement("div");
    mobile.className = "ot-site-mobile-bar";
    mobile.innerHTML = '<a href="deals.html">Shop deals</a><a href="cart.html">Cart</a>';
    document.body.appendChild(mobile);
  }

  function syncCart() {
    const count = String(cartCount());
    document.querySelectorAll("[data-cart-count]").forEach((node) => { node.textContent = count; });
  }

  function mount() {
    injectFonts();
    injectCss();
    mountHeader();
    mountFooter();
    syncCart();
    injectStockStatusAssets();
    injectProductAssets();
    injectCatalogueAssets();
    injectCommerceAssets();
    injectGrowthAssets();
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount, { once: true });
})();