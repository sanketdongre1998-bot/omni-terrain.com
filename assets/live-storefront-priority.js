(() => {
  "use strict";
  if (window.__OMNI_LIVE_STOREFRONT_PRIORITY__) return;
  const file = decodeURIComponent(String(location.pathname || "").split("/").filter(Boolean).pop() || "").toLowerCase();
  if (!(file === "" || file === "index.html")) return;
  window.__OMNI_LIVE_STOREFRONT_PRIORITY__ = true;

  const money = cents => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((Number(cents) || 0) / 100);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));

  function loadProducts() {
    return new Promise(resolve => {
      try { if (typeof OMNI_US_PRODUCTS !== "undefined" && Array.isArray(OMNI_US_PRODUCTS)) return resolve(OMNI_US_PRODUCTS); } catch (_) {}
      const existing = document.querySelector('script[data-ot-us-products]');
      if (existing) {
        existing.addEventListener("load", () => { try { resolve(Array.isArray(OMNI_US_PRODUCTS) ? OMNI_US_PRODUCTS : []); } catch (_) { resolve([]); } }, { once: true });
        return;
      }
      const s = document.createElement("script");
      s.src = "/assets/us-products.js?v=4";
      s.dataset.otUsProducts = "true";
      s.onload = () => { try { resolve(Array.isArray(OMNI_US_PRODUCTS) ? OMNI_US_PRODUCTS : []); } catch (_) { resolve([]); } };
      s.onerror = () => resolve([]);
      document.head.appendChild(s);
    });
  }

  async function productImage(slug) {
    try {
      const response = await fetch(`/${String(slug || "").replace(/^\//, "")}`, { cache: "force-cache" });
      if (!response.ok) return "/assets/omni-terrain-emblem.webp";
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const img = doc.querySelector(".product-visual img");
      return img?.getAttribute("src") || "/assets/omni-terrain-emblem.webp";
    } catch (_) {
      return "/assets/omni-terrain-emblem.webp";
    }
  }

  async function mount() {
    let registry = { products: {} };
    try {
      const response = await fetch("/assets/us-live-products.json?v=checkout-pool-301", { cache: "no-store" });
      if (!response.ok) return;
      registry = await response.json();
    } catch (_) { return; }

    const products = await loadProducts();
    const productById = new Map(products.map(p => [String(p.id), p]));
    const enabled = Object.entries(registry.products || {})
      .filter(([, row]) => row && row.enabled === true && row.authorizationVerified === true && Number(row.priceCents) > 0)
      .map(([id, row]) => ({ id, row, product: productById.get(String(id)) }))
      .filter(x => x.product && x.product.slug);
    if (!enabled.length) return;

    // Deliberate launch merchandising: broad-use/low-fitment products with healthy stock and
    // commercial room are shown first. HUS33055 remains the hero because its single-SKU
    // Stripe checkout has already been smoke-tested end to end.
    const priorityIds = ["HUS81147", "HUS33055", "HUS81148", "B5224066464"];
    const heroId = "HUS33055";
    enabled.sort((a, b) => {
      const ai = priorityIds.indexOf(a.id), bi = priorityIds.indexOf(b.id);
      if (ai >= 0 || bi >= 0) return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
      return String(a.product.brand || "").localeCompare(String(b.product.brand || "")) || String(a.product.mpn || "").localeCompare(String(b.product.mpn || ""));
    });

    const featured = enabled.slice(0, 4);
    const images = await Promise.all(featured.map(x => productImage(x.product.slug)));

    const grid = document.querySelector(".live-grid");
    if (grid) {
      grid.innerHTML = featured.map((x, i) => {
        const p = x.product, r = x.row;
        const desc = String(p.description || "").split(". ")[0].slice(0, 150);
        const badge = r.shippingIncluded ? "Free U.S. shipping" : "Ready to buy";
        const priceLabel = r.shippingIncluded ? "Featured price · Free shipping" : "Featured price";
        return `<article class="live-card" data-live-id="${esc(x.id)}"><a class="live-media" href="${esc(p.slug)}"><span class="live-badge">${esc(badge)}</span><img src="${esc(images[i])}" alt="${esc(p.title || p.mpn)}" decoding="async" loading="${i === 0 ? "eager" : "lazy"}"></a><div class="live-body"><div class="live-brand"><span>${esc(p.brand || "Omni Terrain")}</span><span>${esc(p.mpn || "")}</span></div><h3>${esc(p.title || p.mpn)}</h3><p>${esc(desc || "Available for secure online checkout.")}</p><div class="live-card-footer"><div class="live-price"><small>${esc(priceLabel)}</small>${money(r.priceCents)}</div><a class="live-link" href="${esc(p.slug)}">Buy online →</a></div></div></article>`;
      }).join("");
      const section = grid.closest(".home-section");
      const eyebrow = section?.querySelector(".section-head .eyebrow");
      const heading = section?.querySelector(".section-head h2");
      const copy = section?.querySelector(".section-head p");
      if (eyebrow) eyebrow.textContent = "Featured checkout deals";
      if (heading) heading.textContent = "Featured products, ready to buy.";
      if (copy) copy.textContent = "A focused launch selection chosen for a cleaner buying path. Featured products marked Free U.S. shipping include standard delivery in the contiguous United States.";
    }

    const heroCandidate = enabled.find(x => x.id === heroId) || featured[0];
    if (heroCandidate) {
      const p = heroCandidate.product, r = heroCandidate.row;
      const heroImage = await productImage(p.slug);
      const hero = document.querySelector(".hero-showcase");
      if (hero) {
        hero.href = p.slug;
        hero.setAttribute("aria-label", `View ${p.brand || "product"} ${p.mpn || ""}`.trim());
        const img = hero.querySelector("img");
        if (img) { img.src = heroImage; img.alt = p.title || p.mpn || "Checkout-ready product"; }
        const small = hero.querySelector(".hero-showcase-top small");
        const h2 = hero.querySelector(".hero-showcase-top h2");
        const price = hero.querySelector(".hero-price");
        const foot = hero.querySelector(".hero-showcase-foot span:first-child");
        if (small) small.textContent = `${p.brand || "Omni Terrain"} · MPN ${p.mpn || ""}`;
        if (h2) h2.textContent = p.title || p.mpn || "Checkout-ready product";
        if (price) { price.removeAttribute("data-live-price"); price.textContent = money(r.priceCents); }
        if (foot) foot.textContent = r.shippingIncluded ? "Featured online deal · Free standard U.S. shipping included" : "In stock · Secure online checkout available";
      }
    }

    const liveBrands = [...new Set(enabled.map(x => String(x.product.brand || "").trim()).filter(Boolean))].slice(0, 5);
    const brandNodes = [...document.querySelectorAll(".brand-strip .brand-name")];
    brandNodes.forEach((node, i) => {
      if (liveBrands[i]) { node.textContent = liveBrands[i]; node.style.display = ""; }
      else node.style.display = "none";
    });
    const brandLabel = document.querySelector(".brand-strip-label");
    if (brandLabel) brandLabel.textContent = "Brands available to buy online";

    const launch = document.querySelector(".launch-strip .container span:last-child");
    if (launch) {
      const allFeaturedShipFree = featured.length > 0 && featured.every(x => x.row.shippingIncluded === true);
      launch.textContent = allFeaturedShipFree
        ? "Launch offer: Free standard U.S. shipping on featured checkout-ready products."
        : "Checkout-ready featured products are shown first across the US storefront.";
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();
