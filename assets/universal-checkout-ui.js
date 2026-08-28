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

  function mount() {
    if (!document.body.classList.contains("ot-product-page")) return;
    if (document.querySelector(".ot-live-buybox")) return;

    const box = document.querySelector(".ot-display-buybox");
    const id = productId();
    if (!box || !id || box.dataset.otUniversalCheckout) return;
    box.dataset.otUniversalCheckout = "true";
    box.classList.add("ot-universal-buybox");

    const oldAction = box.querySelector(".ot-display-action");
    if (oldAction) oldAction.remove();

    const actions = document.createElement("div");
    actions.className = "ot-universal-actions";
    actions.innerHTML = '<button type="button" class="ot-universal-button" data-ot-universal-add>Add to Cart</button><button type="button" class="ot-universal-button secondary" data-ot-universal-buy>Buy Now</button>';
    box.appendChild(actions);

    const note = box.querySelector(".ot-display-note");
    if (note) note.textContent = "Secure checkout is available after supplier, stock and shipping eligibility are confirmed for the selected item.";

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

  const css = document.createElement("style");
  css.textContent = `
    .ot-universal-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
    .ot-universal-button{min-height:49px;border:1px solid #071a30;border-radius:11px;background:#071a30;color:#fff;font:850 12px/1 Manrope,Inter,system-ui,sans-serif;cursor:pointer}
    .ot-universal-button.secondary{background:#fff;color:#071a30}
    html[data-ot-theme="dark"] .ot-universal-button.secondary{background:#13283a;color:#eef4f8;border-color:#476078}
    @media(max-width:760px){.ot-universal-actions{grid-template-columns:1fr}.ot-universal-button{width:100%;min-height:52px}}
  `;
  document.head.appendChild(css);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(mount, 180), { once: true });
  else setTimeout(mount, 180);
})();