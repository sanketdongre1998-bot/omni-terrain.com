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

  function isUsProductPage() {
    const path = decodeURIComponent(String(location.pathname || "")).toLowerCase();
    const schema = schemaProduct();
    if (!String(schema.sku || "").trim()) return false;
    if (/\/(uk-|uk\/)/.test(path) || String(document.documentElement.lang || "").toLowerCase() === "en-gb") return false;
    return Boolean(document.querySelector(".product-copy") || document.querySelector(".purchase-panel"));
  }

  function readCart() {
    try {
      const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(cart) ? cart.filter((x) => x && typeof x.id === "string") : [];
    } catch (_) {
      return [];
    }
  }

  function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    const count = cart.reduce((sum, item) => sum + Math.max(1, Math.floor(Number(item.quantity) || 1)), 0);
    document.querySelectorAll("[data-cart-count]").forEach((node) => { node.textContent = String(count); });
  }

  function add(id) {
    const cart = readCart();
    const existing = cart.find((item) => item.id === id);
    if (existing) existing.quantity = Math.min(MAX_QTY, Math.max(1, Number(existing.quantity) || 1) + 1);
    else cart.push({ id, quantity: 1 });
    writeCart(cart);
    return cart.find((item) => item.id === id)?.quantity || 1;
  }

  function ensureBuybox() {
    let box = document.querySelector(".ot-live-buybox, .ot-display-buybox, .ot-online-buybox");
    if (box) return box;

    const copy = document.querySelector(".product-copy");
    if (!copy) return null;

    box = document.createElement("div");
    box.className = "ot-display-buybox";
    const facts = copy.querySelector(".facts");
    if (facts) copy.insertBefore(box, facts);
    else copy.appendChild(box);
    return box;
  }

  function mountCheckout(box, id) {
    if (!box || box.dataset.otUniversalCheckout === "true") return;
    box.dataset.otUniversalCheckout = "true";
    box.classList.add("ot-universal-buybox", "ot-online-buybox");

    box.querySelector(".ot-display-action")?.remove();
    box.querySelectorAll("[data-ot-add],[data-ot-buy],.ot-universal-actions").forEach((node) => node.remove());

    let note = box.querySelector(".ot-display-note");
    if (!note) {
      note = document.createElement("div");
      note.className = "ot-display-note";
      box.appendChild(note);
    }
    note.textContent = "Add this item to your cart and continue to secure checkout. Final pricing and order availability are validated before payment opens.";

    const actions = document.createElement("div");
    actions.className = "ot-universal-actions";
    actions.innerHTML = '<button type="button" class="ot-universal-button" data-ot-universal-add>Add to Cart</button><button type="button" class="ot-universal-button secondary" data-ot-universal-buy>Buy Now</button>';
    box.appendChild(actions);

    const addButton = actions.querySelector("[data-ot-universal-add]");
    const buyButton = actions.querySelector("[data-ot-universal-buy]");

    addButton?.addEventListener("click", () => {
      const quantity = add(id);
      addButton.textContent = quantity > 1 ? `Quantity ${quantity} in Cart ✓` : "Added to Cart ✓";
      setTimeout(() => { addButton.textContent = "Add Another"; }, 1200);
    });

    buyButton?.addEventListener("click", () => {
      add(id);
      window.location.assign("checkout.html");
    });
  }

  function mount(attempt = 0) {
    if (!isUsProductPage()) {
      if (attempt < 30 && document.readyState !== "complete") setTimeout(() => mount(attempt + 1), 150);
      return;
    }

    const id = productId();
    const box = ensureBuybox();
    if (!id || !box) {
      if (attempt < 30) setTimeout(() => mount(attempt + 1), 150);
      return;
    }
    mountCheckout(box, id);
  }

  const css = document.createElement("style");
  css.textContent = `
    .ot-universal-buybox{margin:22px 0;padding:20px;border:1px solid rgba(7,26,48,.14);border-radius:16px;background:#fff;box-shadow:0 12px 30px rgba(7,26,48,.06)}
    .ot-universal-buybox .ot-display-note{margin:0;color:#52606d;font:600 12px/1.65 Manrope,Inter,system-ui,sans-serif}
    .ot-universal-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}
    .ot-universal-button{display:flex;align-items:center;justify-content:center;min-height:49px;padding:0 16px;border:1px solid #071a30;border-radius:11px;background:#071a30;color:#fff;text-decoration:none;font:850 12px/1 Manrope,Inter,system-ui,sans-serif;cursor:pointer;text-align:center}
    .ot-universal-button.secondary{background:#fff;color:#071a30}
    html[data-ot-theme="dark"] .ot-universal-buybox{background:#13283a;border-color:#476078}
    html[data-ot-theme="dark"] .ot-universal-buybox .ot-display-note{color:#c8d5df}
    html[data-ot-theme="dark"] .ot-universal-button.secondary{background:#13283a;color:#eef4f8;border-color:#476078}
    @media(max-width:760px){.ot-universal-actions{grid-template-columns:1fr}.ot-universal-button{width:100%;min-height:52px}}
  `;
  document.head.appendChild(css);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => mount(), { once: true });
  else mount();
})();
