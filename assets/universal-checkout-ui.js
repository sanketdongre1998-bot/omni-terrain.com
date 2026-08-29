(() => {
  "use strict";
  if (window.__OMNI_UNIVERSAL_CHECKOUT_UI__) return;
  window.__OMNI_UNIVERSAL_CHECKOUT_UI__ = true;

  const CART_KEY = "omniTerrainUsCart";
  const MAX_QTY = 10;

  function schemaProduct() {
    for (const node of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const data = JSON.parse(node.textContent || "{}");
        if (data && data["@type"] === "Product") return data;
      } catch (_) {}
    }
    return {};
  }

  function productId() {
    const schema = schemaProduct();
    return String(document.body?.dataset?.productId || schema.sku || "").trim();
  }

  function readCart() {
    try {
      const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(cart) ? cart.filter(x => x && typeof x.id === "string") : [];
    } catch (_) { return []; }
  }

  function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    const count = cart.reduce((sum, item) => sum + Math.max(1, Math.floor(Number(item.quantity) || 1)), 0);
    document.querySelectorAll("[data-cart-count]").forEach(node => { node.textContent = String(count); });
  }

  function add(id, replace = false) {
    const cart = replace ? [] : readCart();
    const existing = cart.find(item => item.id === id);
    if (existing) existing.quantity = Math.min(MAX_QTY, Math.max(1, Number(existing.quantity) || 1) + 1);
    else cart.push({ id, quantity: 1 });
    writeCart(cart);
  }

  async function liveProduct(id) {
    try {
      const response = await fetch("/assets/us-live-products.json?v=eligibility-2", { cache: "no-store" });
      if (!response.ok) return null;
      const data = await response.json();
      const product = data && data.products ? data.products[id] : null;
      return product && product.enabled === true && Number(product.priceCents) > 0 ? product : null;
    } catch (_) {
      return null;
    }
  }

  function mountAvailability(box) {
    box.classList.add("ot-universal-buybox", "ot-availability-buybox");
    box.querySelector(".ot-display-action")?.remove();
    const note = box.querySelector(".ot-display-note");
    if (note) note.textContent = "Current price is shown for reference. Online purchase availability is confirmed before checkout.";

    const actions = document.createElement("div");
    actions.className = "ot-universal-actions";
    actions.innerHTML = '<a class="ot-universal-button" href="contact-and-order-help.html#request-help">Check availability</a><a class="ot-universal-button secondary" href="contact-and-order-help.html">Product support</a>';
    box.appendChild(actions);
  }

  function mountCheckout(box, id) {
    box.classList.add("ot-universal-buybox", "ot-online-buybox");
    box.querySelector(".ot-display-action")?.remove();
    const note = box.querySelector(".ot-display-note");
    if (note) note.textContent = "Online checkout is available for this product with server-verified pricing and US delivery details collected securely.";

    const actions = document.createElement("div");
    actions.className = "ot-universal-actions";
    actions.innerHTML = '<button type="button" class="ot-universal-button" data-ot-universal-add>Add to Cart</button><button type="button" class="ot-universal-button secondary" data-ot-universal-buy>Buy Now</button>';
    box.appendChild(actions);

    const addButton = actions.querySelector("[data-ot-universal-add]");
    const buyButton = actions.querySelector("[data-ot-universal-buy]");
    addButton.addEventListener("click", () => {
      add(id, false);
      addButton.textContent = "Added to Cart ✓";
      setTimeout(() => { addButton.textContent = "Add Another"; }, 1200);
    });
    buyButton.addEventListener("click", () => {
      add(id, false);
      window.location.assign("checkout.html");
    });
  }

  async function mount() {
    if (!document.body.classList.contains("ot-product-page")) return;
    if (document.querySelector(".ot-live-buybox")) return;

    const box = document.querySelector(".ot-display-buybox");
    const id = productId();
    if (!box || !id || box.dataset.otUniversalCheckout) return;
    box.dataset.otUniversalCheckout = "true";

    const live = await liveProduct(id);
    if (document.querySelector(".ot-live-buybox")) return;
    if (live) mountCheckout(box, id);
    else mountAvailability(box);
  }

  const css = document.createElement("style");
  css.textContent = `
    .ot-universal-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
    .ot-universal-button{display:flex;align-items:center;justify-content:center;min-height:49px;padding:0 16px;border:1px solid #071a30;border-radius:11px;background:#071a30;color:#fff;text-decoration:none;font:850 12px/1 Manrope,Inter,system-ui,sans-serif;cursor:pointer;text-align:center}
    .ot-universal-button.secondary{background:#fff;color:#071a30}
    .ot-availability-buybox .ot-universal-button:first-child{background:#071a30;color:#fff}
    html[data-ot-theme="dark"] .ot-universal-button.secondary{background:#13283a;color:#eef4f8;border-color:#476078}
    @media(max-width:760px){.ot-universal-actions{grid-template-columns:1fr}.ot-universal-button{width:100%;min-height:52px}}
  `;
  document.head.appendChild(css);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(mount, 220), { once: true });
  else setTimeout(mount, 220);
})();