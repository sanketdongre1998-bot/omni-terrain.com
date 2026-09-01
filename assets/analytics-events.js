(() => {
  "use strict";
  if (window.__OMNI_ANALYTICS_EVENTS__) return;
  window.__OMNI_ANALYTICS_EVENTS__ = true;

  window.dataLayer = window.dataLayer || [];
  const CART_KEY = "omniTerrainUsCart";
  const path = decodeURIComponent(String(location.pathname || "").split("/").filter(Boolean).pop() || "index.html").toLowerCase();

  function push(event, ecommerce = {}, extra = {}) {
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({ event, ecommerce, ...extra });
  }

  function productSchema() {
    for (const node of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const data = JSON.parse(node.textContent || "{}");
        if (data?.["@type"] === "Product") return data;
        if (Array.isArray(data?.["@graph"])) {
          const product = data["@graph"].find(item => item?.["@type"] === "Product");
          if (product) return product;
        }
      } catch (_) {}
    }
    return null;
  }

  function currentItem() {
    const schema = productSchema();
    if (!schema) return null;
    const offer = Array.isArray(schema.offers) ? schema.offers[0] : schema.offers;
    let price = Number(offer?.price || 0);
    let id = String(schema.sku || schema.mpn || "").trim();
    const page = path;
    const launches = window.OMNI_US_LAUNCH_OFFERS || {};
    for (const [launchId, promo] of Object.entries(launches)) {
      if (String(promo?.slug || "").toLowerCase() === page) {
        id = launchId;
        price = Number(promo.priceCents || 0) / 100;
        break;
      }
    }
    return {
      item_id: id,
      item_name: String(schema.name || document.querySelector("h1")?.textContent || id).trim(),
      item_brand: String(schema.brand?.name || schema.brand || "Omni Terrain").trim(),
      item_variant: String(schema.mpn || "").trim(),
      price: Number.isFinite(price) ? price : 0,
      currency: String(offer?.priceCurrency || "USD").toUpperCase(),
      quantity: 1,
    };
  }

  function cartItems() {
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch (_) {}
    if (!Array.isArray(cart)) return [];
    const launches = window.OMNI_US_LAUNCH_OFFERS || {};
    return cart.map(row => {
      const id = String(row?.id || "");
      const offer = launches[id];
      return {
        item_id: id,
        quantity: Math.max(1, Number(row?.quantity) || 1),
        ...(offer ? { price: Number(offer.priceCents || 0) / 100 } : {}),
      };
    }).filter(item => item.item_id);
  }

  function mountViewItem() {
    if (!/^us-.*\.html$/.test(path) || path === "us-catalogue.html" || path === "us-order-success.html") return;
    const item = currentItem();
    if (!item || sessionStorage.getItem(`ot_view_${path}`)) return;
    sessionStorage.setItem(`ot_view_${path}`, "1");
    push("view_item", { currency: item.currency || "USD", value: Number(item.price || 0), items: [item] });
  }

  document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target.closest("button,a") : null;
    if (!target) return;
    const text = String(target.textContent || "").replace(/\s+/g, " ").trim();
    const item = currentItem();
    if (item && (target.matches("[data-ot-add]") || /^add to cart$/i.test(text))) {
      push("add_to_cart", { currency: item.currency || "USD", value: Number(item.price || 0), items: [item] });
    }
    if (target.matches('a[href*="checkout.html"],#checkoutLink') || /^secure checkout/i.test(text) || /^continue to checkout/i.test(text)) {
      const items = cartItems();
      push("begin_checkout", { currency: "USD", items });
    }
    if (target.matches('a[href*="deals.html"]')) {
      window.dataLayer.push({ event: "select_promotion", promotion_name: "Featured Auto & Truck Deals" });
    }
  }, { capture: true });

  document.addEventListener("submit", event => {
    const form = event.target instanceof HTMLFormElement ? event.target : null;
    if (!form) return;
    if (path === "checkout.html" || form.id === "checkoutForm") {
      push("begin_checkout", { currency: "USD", items: cartItems() });
    }
  }, { capture: true });

  if (path === "deals.html") {
    window.dataLayer.push({ event: "view_promotion", promotion_name: "Featured Auto & Truck Deals", creative_slot: "deals_page" });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountViewItem, { once: true });
  else mountViewItem();
})();
