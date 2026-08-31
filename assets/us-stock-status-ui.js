(() => {
  "use strict";
  if (window.__OMNI_US_STOCK_STATUS_UI__) return;
  window.__OMNI_US_STOCK_STATUS_UI__ = true;

  let statusData = null;

  function basename(value) {
    try {
      return decodeURIComponent(String(value || "").split("?")[0].split("#")[0].split("/").pop() || "").toLowerCase();
    } catch (_) {
      return String(value || "").toLowerCase();
    }
  }

  function schemaProductId() {
    for (const node of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const data = JSON.parse(node.textContent || "{}");
        if (data && data["@type"] === "Product" && data.sku) return String(data.sku).trim();
      } catch (_) {}
    }
    return "";
  }

  function productId() {
    return String(document.body?.dataset?.productId || schemaProductId() || "").trim();
  }

  function statusBySlug() {
    const map = new Map();
    for (const [id, row] of Object.entries(statusData?.products || {})) {
      const slug = basename(row?.slug);
      if (slug) map.set(slug, { id, ...row });
    }
    return map;
  }

  function ensureBadge(box) {
    let badge = box.querySelector(".ot-stock-state-badge");
    if (!badge) {
      badge = document.createElement("div");
      badge.className = "ot-stock-state-badge";
      box.prepend(badge);
    }
    return badge;
  }

  function applyProductPage() {
    const id = productId();
    const state = statusData?.products?.[id];
    if (!id || !state) return;
    const box = document.querySelector(".ot-live-buybox, .ot-display-buybox, .ot-online-buybox");
    if (!box) return;

    const badge = ensureBadge(box);
    const note = box.querySelector(".ot-display-note");
    box.dataset.otStockStatus = String(state.status || "review");

    if (state.status === "out_of_stock") {
      badge.textContent = "Out of stock";
      badge.className = "ot-stock-state-badge out";
      box.querySelectorAll("[data-ot-universal-add],[data-ot-universal-buy],[data-ot-add],[data-ot-buy],.ot-universal-actions,.ot-display-action").forEach(node => node.remove());
      if (note) note.textContent = "This item is currently out of stock with the supplier. It remains visible in the catalogue so you can check back later.";
      return;
    }

    if (state.checkoutReady === true) {
      badge.textContent = "In stock";
      badge.className = "ot-stock-state-badge in";
      return;
    }

    badge.textContent = "Check availability";
    badge.className = "ot-stock-state-badge review";
    box.querySelectorAll("[data-ot-universal-add],[data-ot-universal-buy],[data-ot-add],[data-ot-buy],.ot-universal-actions,.ot-display-action").forEach(node => node.remove());
    if (note) note.textContent = "This product is listed in the catalogue, but online ordering is not currently enabled. Contact product support for current availability.";
  }

  function applyCards() {
    const bySlug = statusBySlug();
    document.querySelectorAll("article.card, .product-card, [data-product-card]").forEach(card => {
      const link = card.querySelector('a.card-link[href], a[href^="us-"]');
      if (!link) return;
      const state = bySlug.get(basename(link.getAttribute("href")));
      if (!state) return;
      const badge = card.querySelector(".status");
      const note = card.querySelector(".search-note");
      card.dataset.otStockStatus = String(state.status || "review");
      if (state.status === "out_of_stock") {
        if (badge) badge.textContent = "Out of stock";
        if (note) note.textContent = "Currently unavailable";
        card.classList.add("ot-card-out-of-stock");
      } else if (state.checkoutReady === true) {
        if (badge) badge.textContent = "In stock";
        if (note) note.textContent = "Available for online order";
        card.classList.remove("ot-card-out-of-stock");
      } else {
        if (badge) badge.textContent = "Check availability";
        if (note) note.textContent = "Online ordering under review";
        card.classList.remove("ot-card-out-of-stock");
      }
    });
  }

  function applyAll() {
    if (!statusData) return;
    applyProductPage();
    applyCards();
  }

  async function load() {
    try {
      const response = await fetch("/assets/us-stock-status.json?v=1", { cache: "no-store" });
      if (!response.ok) return;
      statusData = await response.json();
      window.__OMNI_US_STOCK_STATUS__ = statusData;
      applyAll();
      let queued = false;
      const observer = new MutationObserver(() => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => { queued = false; applyAll(); });
      });
      observer.observe(document.body, { childList: true, subtree: true });
    } catch (_) {}
  }

  const css = document.createElement("style");
  css.textContent = `
    .ot-stock-state-badge{display:inline-flex;align-items:center;width:max-content;margin:0 0 10px;padding:6px 10px;border-radius:999px;font:800 11px/1 Manrope,Inter,system-ui,sans-serif;letter-spacing:.02em}
    .ot-stock-state-badge.in{background:#e9f7ef;color:#166534;border:1px solid #bbebcb}
    .ot-stock-state-badge.out{background:#f3f4f6;color:#4b5563;border:1px solid #d1d5db}
    .ot-stock-state-badge.review{background:#fff8e8;color:#8a5a00;border:1px solid #f1d38a}
    .ot-card-out-of-stock .media img{filter:saturate(.5);opacity:.72}
    .ot-card-out-of-stock .status{background:#f3f4f6!important;color:#4b5563!important;border-color:#d1d5db!important}
    html[data-ot-theme="dark"] .ot-stock-state-badge.in{background:#163725;color:#b7f0cb;border-color:#315c40}
    html[data-ot-theme="dark"] .ot-stock-state-badge.out{background:#263441;color:#d7e0e7;border-color:#465766}
    html[data-ot-theme="dark"] .ot-stock-state-badge.review{background:#3a311d;color:#f7d98a;border-color:#625330}
  `;
  document.head.appendChild(css);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load, { once: true });
  else load();
})();
