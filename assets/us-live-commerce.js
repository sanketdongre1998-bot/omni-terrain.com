(async function () {
  "use strict";
  if (window.__OMNI_US_LIVE_COMMERCE__) return;
  window.__OMNI_US_LIVE_COMMERCE__ = true;

  const CART_KEY = "omniTerrainUsCart";
  const CONFIG_URL = "/assets/us-live-products.json?v=authorization-5";
  const MAX_QTY = 10;

  function readCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.filter(item => item && typeof item.id === "string").map(item => ({ id: String(item.id), quantity: Math.max(1, Math.min(MAX_QTY, Math.floor(Number(item.quantity) || 1))) })) : [];
    } catch (_) { return []; }
  }
  function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCounts();
  }
  function addToCart(id, replaceCart = false) {
    const cart = replaceCart ? [] : readCart();
    const existing = cart.find(item => item.id === id);
    if (existing) existing.quantity = Math.min(MAX_QTY, existing.quantity + 1);
    else cart.push({ id, quantity: 1 });
    writeCart(cart);
    return cart.find(item => item.id === id)?.quantity || 1;
  }
  function updateCartCounts() {
    const count = readCart().reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll("[data-cart-count]").forEach(node => { node.textContent = String(count); });
  }
  function money(cents) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(Number(cents || 0) / 100);
  }

  let config = { products: {} };
  try {
    const response = await fetch(CONFIG_URL, { cache: "no-store" });
    if (!response.ok) return;
    config = await response.json();
  } catch (_) { return; }

  const live = new Map(Object.entries(config?.products || {})
    .filter(([, row]) => row && row.enabled === true && row.authorizationVerified === true && Number(row.priceCents || 0) > 0)
    .map(([id, row]) => [String(id), { ...row, id: String(id), priceCents: Number(row.priceCents) }]));
  if (!live.size) return;

  function pageFilename() {
    return decodeURIComponent(String(location.pathname || "").split("/").filter(Boolean).pop() || "index.html");
  }
  function parseProductSchema() {
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const data = JSON.parse(script.textContent || "{}");
        if (data && data["@type"] === "Product") return data;
      } catch (_) {}
    }
    return null;
  }
  function currentLiveProduct() {
    const datasetId = String(document.body?.dataset?.productId || "");
    if (datasetId && live.has(datasetId)) return live.get(datasetId);
    const filename = pageFilename();
    for (const product of live.values()) if (product.slug === filename) return product;
    const schema = parseProductSchema();
    if (schema?.sku && live.has(String(schema.sku))) return live.get(String(schema.sku));
    for (const product of live.values()) {
      if (schema?.mpn && product.mpn && String(schema.mpn).toLowerCase() === String(product.mpn).toLowerCase()) return product;
    }
    return null;
  }

  function injectStyles() {
    if (document.getElementById("otLiveCommerceStyles")) return;
    const style = document.createElement("style");
    style.id = "otLiveCommerceStyles";
    style.textContent = `
      .ot-live-buybox{margin:24px 0;padding:22px;border:1px solid #d9c28f;border-radius:16px;background:linear-gradient(135deg,#fffdf8,#f8f1e3);box-shadow:0 12px 30px rgba(7,26,48,.07)}
      .ot-live-label{font-size:11px;font-weight:850;text-transform:uppercase;letter-spacing:.09em;color:#8b6a31}.ot-live-price{margin:7px 0 2px;font-size:36px;line-height:1;font-weight:900;color:#071a30;letter-spacing:-.035em}.ot-live-shipping{margin:8px 0 18px;color:#52606d;font-size:13px}.ot-live-actions{display:flex;flex-wrap:wrap;gap:10px}.ot-live-button{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 18px;border:0;border-radius:10px;background:#071a30;color:#fff!important;text-decoration:none;font-weight:850;cursor:pointer}.ot-live-button.secondary{background:#fff;color:#071a30!important;border:1px solid #071a30}.ot-live-trust{margin-top:14px;padding-top:12px;border-top:1px solid rgba(7,26,48,.08);color:#65717d;font-size:12px;line-height:1.55}.ot-live-inline-price{margin-top:4px;color:#071a30;font-size:20px;font-weight:900}.ot-live-stock{display:inline-flex;width:max-content;padding:6px 9px;border-radius:999px;background:#e5f5ec;color:#167047;font-size:11px;font-weight:850}
      @media(max-width:760px){.ot-live-actions{display:grid;grid-template-columns:1fr}.ot-live-button{width:100%;min-height:50px}}
    `;
    document.head.appendChild(style);
  }

  function relabelCartLinks() {
    document.querySelectorAll('.cart-link,.mobile-nav a[href="cart.html"],.mobile-store-bar a[href="cart.html"],.nav a[href="cart.html"],.nav-links a[href="cart.html"]').forEach(link => {
      const count = link.querySelector?.("[data-cart-count]");
      if (count && link.childNodes.length) link.childNodes[0].nodeValue = "Cart ";
      else if (/request cart/i.test(link.textContent || "")) link.textContent = "Cart";
    });
    updateCartCounts();
  }

  function enhanceProductPage() {
    const product = currentLiveProduct();
    const copy = document.querySelector(".product-copy");
    if (!product || !copy) return;
    injectStyles();
    relabelCartLinks();
    copy.querySelector(".notice")?.remove();
    copy.querySelectorAll(".product-price").forEach(node => node.remove());

    let box = copy.querySelector(".ot-live-buybox");
    if (!box) {
      box = document.createElement("div");
      box.className = "ot-live-buybox";
      const facts = copy.querySelector(".facts");
      if (facts) copy.insertBefore(box, facts); else copy.appendChild(box);
    }
    box.innerHTML = `<div class="ot-live-label">Online price</div><div class="ot-live-price">${money(product.priceCents)}</div><div class="ot-live-shipping">${product.shippingIncluded ? "Free standard shipping in the contiguous U.S." : "Shipping confirmed before payment"}</div><div class="ot-live-actions"><button type="button" class="ot-live-button" data-ot-add>Add to Cart</button><button type="button" class="ot-live-button secondary" data-ot-buy>Buy Now</button></div><div class="ot-live-trust">Secure payment powered by Stripe · Price and authorization are re-validated before payment opens.</div>`;
    box.querySelector("[data-ot-add]")?.addEventListener("click", event => {
      const quantity = addToCart(product.id, false);
      const button = event.currentTarget;
      button.textContent = quantity > 1 ? `Quantity ${quantity} in Cart ✓` : "Added to Cart ✓";
      setTimeout(() => { button.textContent = "Add Another"; }, 1200);
    });
    box.querySelector("[data-ot-buy]")?.addEventListener("click", () => {
      addToCart(product.id, false);
      location.assign("checkout.html");
    });
  }

  function enhanceCatalogueCards() {
    injectStyles();
    const bySlug = new Map([...live.values()].filter(p => p.slug).map(p => [String(p.slug).toLowerCase(), p]));
    document.querySelectorAll(".card").forEach(card => {
      const link = card.querySelector(".card-link");
      if (!link) return;
      const slug = decodeURIComponent(String(link.getAttribute("href") || "").split("?")[0].split("/").pop() || "").toLowerCase();
      const product = bySlug.get(slug);
      if (!product) return;
      let price = card.querySelector(".ot-live-inline-price,.price,.search-note");
      if (price) {
        price.className = "ot-live-inline-price";
        price.textContent = money(product.priceCents);
      }
      const status = card.querySelector(".status");
      if (status) {
        status.className = "ot-live-stock";
        status.textContent = "Available online";
      }
    });
    relabelCartLinks();
  }

  enhanceProductPage();
  enhanceCatalogueCards();
  updateCartCounts();

  if (!document.querySelector('script[data-ot-display-pricing]')) {
    const displayPricing = document.createElement("script");
    displayPricing.src = "/assets/us-display-prices.js?v=4";
    displayPricing.dataset.otDisplayPricing = "true";
    document.head.appendChild(displayPricing);
  }
})();