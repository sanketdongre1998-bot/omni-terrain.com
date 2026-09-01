(() => {
  "use strict";
  if (window.__OMNI_LIVE_STOREFRONT_PRIORITY__) return;
  const file = decodeURIComponent(String(location.pathname || "").split("/").filter(Boolean).pop() || "").toLowerCase();
  if (!(file === "" || file === "index.html")) return;
  window.__OMNI_LIVE_STOREFRONT_PRIORITY__ = true;

  const money = cents => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((Number(cents) || 0) / 100);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const launchOffers = {
    HUS81147: { priceCents: 11999, compareAtCents: 12626, label: "Featured Deal" },
    HUS81148: { priceCents: 14999, compareAtCents: 15828, label: "Featured Deal" },
    CCIN8010F: { priceCents: 19999, compareAtCents: 21900, label: "Featured Deal" },
    A1360828HD: { priceCents: 20499, compareAtCents: 21399, label: "Featured Deal" },
    B5224066464: { priceCents: 13299, compareAtCents: 13697, label: "Featured Deal" }
  };
  const marketingDescriptions = {
    HUS81147: "Carry up to four bikes with a hitch-mounted rack built for road trips, weekend rides and everyday transport.",
    HUS81148: "Add serious cargo space with a 500 lb hitch-mounted carrier for road trips, hauling and everyday utility.",
    CCIN8010F: "Chrome front wheel simulator designed for compatible 2003–2018 Ram 3500 applications.",
    A1360828HD: "Load-support air spring kit for compatible Ram 1500 applications, designed to improve stability under load.",
    B5224066464: "Bilstein B8 5100 shock absorber for compatible Ram 2500/3500 trucks with lifted suspension applications."
  };

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
      .map(([id, row]) => {
        const offer = launchOffers[id];
        const effectiveRow = offer ? { ...row, priceCents: offer.priceCents, launchOffer: offer } : row;
        return { id, row: effectiveRow, product: productById.get(String(id)) };
      })
      .filter(x => x.product && x.product.slug);
    if (!enabled.length) return;

    const priorityIds = ["HUS81147", "HUS81148", "CCIN8010F", "A1360828HD", "B5224066464"];
    const heroId = "HUS81147";
    enabled.sort((a, b) => {
      const ai = priorityIds.indexOf(a.id), bi = priorityIds.indexOf(b.id);
      if (ai >= 0 || bi >= 0) return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
      return String(a.product.brand || "").localeCompare(String(b.product.brand || "")) || String(a.product.mpn || "").localeCompare(String(b.product.mpn || ""));
    });

    const featured = enabled.slice(0, 5);
    const images = await Promise.all(featured.map(x => productImage(x.product.slug)));

    const grid = document.querySelector(".live-grid");
    if (grid) {
      grid.innerHTML = featured.map((x, i) => {
        const p = x.product, r = x.row;
        const promo = launchOffers[x.id];
        const savings = promo ? promo.compareAtCents - promo.priceCents : 0;
        const desc = marketingDescriptions[x.id] || String(p.description || "").split(". ")[0].slice(0, 150) || "Shop online with clear pricing and product details.";
        const badge = promo ? `Featured deal · Save ${money(savings)}` : (r.shippingIncluded ? "Free standard shipping" : "Shop online");
        const priceLabel = r.shippingIncluded ? "Online price · Free shipping" : "Online price";
        const priceMeta = promo
          ? `<small><s>${money(promo.compareAtCents)}</s> · Save ${money(savings)}</small>`
          : `<small>${esc(priceLabel)}</small>`;
        return `<article class="live-card" data-live-id="${esc(x.id)}"><a class="live-media" href="${esc(p.slug)}"><span class="live-badge">${esc(badge)}</span><img src="${esc(images[i])}" alt="${esc(p.title || p.mpn)}" decoding="async" loading="${i === 0 ? "eager" : "lazy"}"></a><div class="live-body"><div class="live-brand"><span>${esc(p.brand || "Omni Terrain")}</span><span>${esc(p.mpn || "")}</span></div><h3>${esc(p.title || p.mpn)}</h3><p>${esc(desc)}</p><div class="live-card-footer"><div class="live-price">${priceMeta}${money(r.priceCents)}</div><a class="live-link" href="${esc(p.slug)}">Shop now →</a></div></div></article>`;
      }).join("");
      const section = grid.closest(".home-section");
      const eyebrow = section?.querySelector(".section-head .eyebrow");
      const heading = section?.querySelector(".section-head h2");
      const copy = section?.querySelector(".section-head p");
      if (eyebrow) eyebrow.textContent = "Featured auto & truck deals";
      if (heading) heading.textContent = "Upgrade more. Spend less.";
      if (copy) copy.textContent = "Save on towing, truck and suspension essentials with secure online checkout and free standard shipping on featured offers in the contiguous U.S.";
    }

    const heroCandidate = enabled.find(x => x.id === heroId) || featured[0];
    if (heroCandidate) {
      const p = heroCandidate.product, r = heroCandidate.row;
      const promo = launchOffers[heroCandidate.id];
      const heroImage = await productImage(p.slug);
      const hero = document.querySelector(".hero-showcase");
      if (hero) {
        hero.href = p.slug;
        hero.setAttribute("aria-label", `View ${p.brand || "product"} ${p.mpn || ""}`.trim());
        const img = hero.querySelector("img");
        if (img) { img.src = heroImage; img.alt = p.title || p.mpn || "Featured product"; }
        const small = hero.querySelector(".hero-showcase-top small");
        const h2 = hero.querySelector(".hero-showcase-top h2");
        const price = hero.querySelector(".hero-price");
        const foot = hero.querySelector(".hero-showcase-foot span:first-child");
        if (small) small.textContent = `${p.brand || "Omni Terrain"} · MPN ${p.mpn || ""}`;
        if (h2) h2.textContent = p.title || p.mpn || "Featured product";
        if (price) { price.removeAttribute("data-live-price"); price.textContent = money(r.priceCents); }
        if (foot) foot.textContent = promo
          ? `Featured deal · Save ${money(promo.compareAtCents - promo.priceCents)} · Free standard shipping in the contiguous U.S.`
          : (r.shippingIncluded ? "Free standard shipping in the contiguous U.S." : "Secure online checkout");
      }
    }

    const liveBrands = [...new Set(featured.map(x => String(x.product.brand || "").trim()).filter(Boolean))].slice(0, 5);
    const brandNodes = [...document.querySelectorAll(".brand-strip .brand-name")];
    brandNodes.forEach((node, i) => {
      if (liveBrands[i]) { node.textContent = liveBrands[i]; node.style.display = ""; }
      else node.style.display = "none";
    });
    const brandLabel = document.querySelector(".brand-strip-label");
    if (brandLabel) brandLabel.textContent = "Featured brands";

    const launch = document.querySelector(".launch-strip .container span:last-child");
    if (launch) {
      launch.textContent = "Featured deals · Free standard shipping on featured offers in the contiguous U.S.";
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();