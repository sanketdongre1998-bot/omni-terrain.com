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

  function normalizeLivePurchasePlacement() {
    const copy = document.querySelector(".product-copy");
    const box = document.querySelector(".ot-live-buybox");
    if (!copy || !box) return;

    const title = copy.querySelector("h1");
    if (box.parentElement !== copy || (title && title.nextElementSibling !== box)) {
      if (title) title.insertAdjacentElement("afterend", box);
      else copy.prepend(box);
    }

    box.querySelectorAll(".ot-live-label,.ot-live-stock,.status.buy,.status.stock,.stock-pill,.availability-pill").forEach(node => node.remove());

    const price = box.querySelector(".ot-live-price");
    const oldRow = box.querySelector(".ot-live-price-row");
    if (oldRow && price) oldRow.insertAdjacentElement("beforebegin", price);

    const oldBreakdown = box.querySelector(".ot-live-breakdown");
    let shipping = box.querySelector(".ot-live-shipping");
    const included = /free|included/i.test(String(oldBreakdown?.textContent || shipping?.textContent || ""));
    if (!shipping) {
      shipping = document.createElement("div");
      shipping.className = "ot-live-shipping";
    }
    shipping.innerHTML = included
      ? "<strong>In stock</strong><span> · Free standard US shipping</span>"
      : "<strong>In stock</strong><span> · Shipping confirmed before payment</span>";

    if (price && price.nextElementSibling !== shipping) price.insertAdjacentElement("afterend", shipping);
    oldBreakdown?.remove();
    oldRow?.remove();

    const trust = box.querySelector(".ot-live-trust");
    if (trust && trust.textContent !== "Secure Stripe checkout · Availability is confirmed again before payment.") {
      trust.textContent = "Secure Stripe checkout · Availability is confirmed again before payment.";
    }

    copy.querySelector(".notice")?.remove();
    copy.querySelectorAll("p").forEach(node => {
      if (node.querySelector("a.button")) node.remove();
    });
  }

  function installTrust(region) {
    const preferred = document.querySelector(".ot-live-buybox,.purchase-box");
    let row = document.querySelector(".ot-pdp-trust");

    if (!row) {
      const fallbackHost = document.querySelector(".product-copy .notice,.product-copy .facts,.quick-cards");
      const host = preferred || fallbackHost;
      if (!host) return;

      row = document.createElement("div");
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

      if (preferred) preferred.insertAdjacentElement("afterend", row);
      else fallbackHost.insertAdjacentElement("beforebegin", row);
      return;
    }

    if (preferred && row.previousElementSibling !== preferred) {
      preferred.insertAdjacentElement("afterend", row);
    }
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

  function installBreadcrumbSchema(schema) {
    if (!schema || document.querySelector('script[data-ot-pdp-breadcrumb-schema]')) return;
    const trail = document.querySelector(".breadcrumb,.crumbs");
    if (!trail) return;

    const anchors = [...trail.querySelectorAll("a")].map(a => ({
      name: String(a.textContent || "").replace(/\s+/g, " ").trim(),
      href: a.href
    })).filter(x => x.name && x.href);
    const current = firstText([".product-title",".product-copy h1"]) || schema.name || "";
    if (!anchors.length || !current) return;

    const list = anchors.map((x,index) => ({
      "@type":"ListItem",
      position:index+1,
      name:x.name,
      item:x.href
    }));
    list.push({
      "@type":"ListItem",
      position:list.length+1,
      name:current,
      item:location.href.split("#")[0]
    });

    const node = document.createElement("script");
    node.type = "application/ld+json";
    node.dataset.otPdpBreadcrumbSchema = "true";
    node.textContent = JSON.stringify({
      "@context":"https://schema.org",
      "@type":"BreadcrumbList",
      itemListElement:list
    });
    document.head.appendChild(node);
  }

  function installImageFallback(schema) {
    const title = firstText([".product-title",".product-copy h1"]) || schema?.name || "Product";
    const mpn = String(schema?.mpn || schema?.sku || "").trim();
    document.querySelectorAll(".product-visual img,.gallery-main img").forEach(img => {
      if (img.dataset.otPdpFallbackBound === "true") return;
      img.dataset.otPdpFallbackBound = "true";
      img.addEventListener("error", () => {
        const host = img.closest(".product-visual,.gallery-main");
        if (!host || host.querySelector(".ot-pdp-image-fallback")) return;
        img.style.display = "none";
        const fallback = document.createElement("div");
        fallback.className = "ot-pdp-image-fallback";
        fallback.innerHTML = '<div class="ot-pdp-image-fallback-inner"><b>Product image unavailable</b><div></div><span></span></div>';
        fallback.querySelector("div div").textContent = title;
        fallback.querySelector("span").textContent = mpn ? `MPN / SKU: ${mpn}` : "Please use the product details to confirm the exact item.";
        host.appendChild(fallback);
      });
    });
  }

  function syncMobileDock(region) {
    const dock = document.querySelector(".ot-pdp-mobile-dock");
    if (!dock) return;
    const price = firstText([".price",".ot-live-price",".product-price"]);
    const span = dock.querySelector(".ot-pdp-mobile-dock-copy span");
    const button = dock.querySelector("button");
    const buyTarget = document.querySelector("[data-ot-buy],[data-uk-buy]");
    const next = price || (buyTarget ? "Ready to order" : (region === "uk" ? "View price & order options" : "Price & availability"));
    if (span && span.textContent !== next) span.textContent = next;
    const label = buyTarget ? "Buy Now" : "Check availability";
    if (button && button.textContent !== label) button.textContent = label;
    dock.dataset.otBuyReady = buyTarget ? "true" : "false";
  }

  function installMobileDock(region, schema) {
    if (document.querySelector(".ot-pdp-mobile-dock")) return;
    const title = firstText([".product-title",".product-copy h1"]) || schema?.name || "Product";
    const price = firstText([".price",".ot-live-price",".product-price"]);
    const dock = document.createElement("div");
    dock.className = "ot-pdp-mobile-dock";
    dock.innerHTML = `
      <div class="ot-pdp-mobile-dock-copy"><b></b><span></span></div>
      <button type="button">Check availability</button>`;
    dock.querySelector("b").textContent = title;
    dock.querySelector("span").textContent = price || (region === "uk" ? "View price & order options" : "Price & availability");
    dock.querySelector("button").addEventListener("click", () => {
      const buyTarget = document.querySelector("[data-ot-buy],[data-uk-buy]");
      if (buyTarget) {
        buyTarget.click();
        return;
      }
      const target = document.querySelector(".product-copy .button.secondary,.product-copy .notice,.purchase-box,.ot-live-buybox");
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    document.body.appendChild(dock);
    syncMobileDock(region);
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
    normalizeLivePurchasePlacement();
    document.querySelectorAll(".product-copy .button.secondary").forEach(button => {
      if (/check\s+price\s*&?\s*availability/i.test(button.textContent || "")) button.textContent = "Check availability";
    });
    installTrust(region);
    installJumps(region);
    installMobileDock(region, schema);
    installBreadcrumbSchema(schema);
    installImageFallback(schema);
    syncMobileDock(region);

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

  // Live commerce can inject price/buybox after initial paint.
  // Use a few bounded syncs instead of a subtree MutationObserver to avoid
  // feedback loops and main-thread churn on large product pages.
  [3000,4500,6500].forEach(ms => setTimeout(() => {
    if (!document.body?.classList.contains("ot-pdp")) return;
    const region = document.body.classList.contains("ot-pdp-uk") ? "uk" : "us";
    normalizeLivePurchasePlacement();
    installTrust(region);
    syncMobileDock(region);
  }, ms));

})();