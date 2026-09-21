(() => {
  "use strict";
  if (window.__OMNI_PRODUCT_PAGE_OPTIMIZER__) return;
  window.__OMNI_PRODUCT_PAGE_OPTIMIZER__ = true;

  function productSchema() {
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const data = JSON.parse(script.textContent || "{}");
        if (data?.["@type"] === "Product") return data;
        if (Array.isArray(data?.["@graph"])) {
          const hit = data["@graph"].find(x => x?.["@type"] === "Product");
          if (hit) return hit;
        }
      } catch (_) {}
    }
    return null;
  }

  function isProductPage() {
    return !!productSchema() ||
      !!document.querySelector(".product-layout .product-copy,.product-layout .product-info,.gallery-card");
  }

  function addId(node, id) {
    if (node && !node.id) node.id = id;
    return node;
  }

  function firstText(selectors) {
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      const value = String(node?.textContent || "").replace(/\s+/g, " ").trim();
      if (value) return value;
    }
    return "";
  }

  function installTrust(region) {
    if (document.querySelector(".ot-pdp-trust")) return;
    const host = document.querySelector(".purchase-box,.ot-live-buybox,.product-copy .notice,.product-copy .facts,.quick-cards");
    if (!host) return;

    const row = document.createElement("div");
    row.className = "ot-pdp-trust";
    row.setAttribute("aria-label", "Order support");
    const items = region === "uk"
      ? [
          ["Fitment support", "Check application details before ordering"],
          ["UK order help", "Product and order support available"],
          ["Policy backed", "Shipping and returns terms shown on site"]
        ]
      : [
          ["Fitment support", "Confirm application details before ordering"],
          ["Product support", "Help with MPN and product questions"],
          ["Policy backed", "Shipping and returns terms shown on site"]
        ];
    row.innerHTML = items.map(([title, copy]) =>
      `<div class="ot-pdp-trust-item"><b>${title}</b><span>${copy}</span></div>`
    ).join("");

    if (host.matches(".purchase-box,.ot-live-buybox")) host.insertAdjacentElement("afterend", row);
    else host.insertAdjacentElement("beforebegin", row);
  }

  function installJumps(region) {
    if (document.querySelector(".ot-pdp-jumps")) return;

    const details = addId(
      document.querySelector(".product-detail-section,.detail-grid,.detail-card"),
      "product-details"
    );
    const specs = addId(
      document.querySelector(".spec-grid,.specs"),
      "product-specifications"
    );
    const fitment = addId(
      document.querySelector(".fitment-box,.fitment-warning"),
      "fitment-help"
    );

    const shippingHref = region === "uk" ? "/uk-shipping-delivery-policy.html" : "/shipping-delivery-policy.html";
    const returnsHref = region === "uk" ? "/uk-returns-refunds-policy.html" : "/returns-refunds-policy.html";

    const nav = document.createElement("nav");
    nav.className = "ot-pdp-jumps";
    nav.setAttribute("aria-label", "Product page sections");

    const links = [];
    if (details) links.push('<a href="#product-details">Details</a>');
    if (specs && specs !== details) links.push('<a href="#product-specifications">Specifications</a>');
    if (fitment) links.push('<a href="#fitment-help">Fitment</a>');
    links.push(`<a href="${shippingHref}">Shipping</a>`);
    links.push(`<a href="${returnsHref}">Returns</a>`);
    nav.innerHTML = links.join("");

    const layout = document.querySelector(".product-layout");
    layout?.insertAdjacentElement("afterend", nav);
  }

  function softenLegacyDraftCopy() {
    document.querySelectorAll(".mini-note,.availability,.draft-strip").forEach(node => {
      const text = String(node.textContent || "");
      if (/card checkout will be (?:connected|enabled)|payment setup is live|draft page/i.test(text)) {
        if (node.classList.contains("mini-note")) {
          node.innerHTML = "<b>Checkout:</b> Current ordering and checkout options are shown in your Omni Terrain cart.";
        } else if (node.classList.contains("availability")) {
          const b = node.querySelector("b")?.outerHTML || "<b>Availability</b>";
          node.innerHTML = `${b} Current ordering options are shown in your cart.`;
        }
      }
    });
  }

  function installMobileDock(region, schema) {
    if (document.querySelector(".ot-pdp-mobile-dock")) return;
    const title = firstText([".product-title",".product-copy h1"]) || schema?.name || "Product";
    const price = firstText([".price",".ot-live-price",".product-price"]);
    const dock = document.createElement("div");
    dock.className = "ot-pdp-mobile-dock";
    dock.innerHTML = `
      <div class="ot-pdp-mobile-dock-copy"><b></b><span></span></div>
      <button type="button">Purchase options</button>`;
    dock.querySelector("b").textContent = title;
    dock.querySelector("span").textContent = price || (region === "uk" ? "View price & order options" : "Price & availability");
    dock.querySelector("button").addEventListener("click", () => {
      const target = document.querySelector(".purchase-box,.ot-live-buybox,.product-copy .notice,.product-copy .button.secondary");
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    document.body.appendChild(dock);
  }

  function normalize(region) {
    const body = document.body;
    if (!body || !isProductPage()) return false;
    const schema = productSchema();

    body.classList.add("ot-pdp", region === "uk" ? "ot-pdp-uk" : "ot-pdp-us");

    const layout = document.querySelector(".product-layout");
    if (layout) layout.setAttribute("data-ot-pdp-layout", "true");

    const visual = document.querySelector(".product-visual,.gallery-card");
    if (visual) visual.setAttribute("data-ot-pdp-visual", "true");

    const info = document.querySelector(".product-copy,.product-info");
    if (info) info.setAttribute("data-ot-pdp-info", "true");

    softenLegacyDraftCopy();
    installTrust(region);
    installJumps(region);
    installMobileDock(region, schema);

    document.querySelectorAll(".product-visual img,.gallery-main img").forEach(img => {
      img.decoding = "async";
      if (!img.loading) img.loading = "eager";
    });

    return true;
  }

  function run() {
    if (!document.body) return;
    const region = String(document.documentElement.lang || "").toLowerCase() === "en-gb" ? "uk" : "us";
    normalize(region);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once:true });
  else run();

  [150,500,1100,2200].forEach(ms => setTimeout(run, ms));

  if ("MutationObserver" in window) {
    const observer = new MutationObserver(() => {
      if (document.body?.classList.contains("ot-pdp")) {
        const region = document.body.classList.contains("ot-pdp-uk") ? "uk" : "us";
        installTrust(region);
      }
    });
    const start = () => {
      if (!document.body) return;
      observer.observe(document.body,{childList:true,subtree:true});
      setTimeout(() => observer.disconnect(),5000);
    };
    if (document.body) start(); else document.addEventListener("DOMContentLoaded",start,{once:true});
  }
})();