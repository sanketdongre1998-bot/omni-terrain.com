(() => {
  "use strict";
  const file = decodeURIComponent(String(location.pathname || "").split("/").filter(Boolean).pop() || "").toLowerCase();
  if (file !== "us-catalogue.html" || window.__OMNI_CATALOGUE_WIDE__) return;
  window.__OMNI_CATALOGUE_WIDE__ = true;

  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch]);
  const money = cents => new Intl.NumberFormat("en-US", { style:"currency", currency:"USD", minimumFractionDigits:2 }).format(Number(cents || 0) / 100);
  const label = segment => ({ automotive:"Automotive Parts & Towing", marine:"Marine Parts & Equipment", rv:"RV & Overlanding" })[segment] || "Specialist Parts";
  const basename = value => decodeURIComponent(String(value || "").split("?")[0].split("#")[0].split("/").pop() || "").toLowerCase();

  function loadProducts() {
    return new Promise(resolve => {
      if (Array.isArray(window.OMNI_US_PRODUCTS)) return resolve(window.OMNI_US_PRODUCTS);
      const existing = document.querySelector('script[data-ot-us-products]');
      if (existing) {
        existing.addEventListener("load", () => resolve(Array.isArray(window.OMNI_US_PRODUCTS) ? window.OMNI_US_PRODUCTS : []), { once:true });
        existing.addEventListener("error", () => resolve([]), { once:true });
        return;
      }
      const script = document.createElement("script");
      script.src = "/assets/us-products.js?v=4";
      script.dataset.otUsProducts = "true";
      script.onload = () => resolve(Array.isArray(window.OMNI_US_PRODUCTS) ? window.OMNI_US_PRODUCTS : []);
      script.onerror = () => resolve([]);
      document.head.appendChild(script);
    });
  }

  async function json(url) {
    const response = await fetch(url, { cache:"no-store" });
    if (!response.ok) throw new Error(`${url} unavailable`);
    return response.json();
  }

  function productCard(product, approval, image, index) {
    const category = label(product.segment);
    const safeImage = /^https:\/\//i.test(String(image || "")) ? String(image) : "";
    const media = safeImage
      ? `<img src="${esc(safeImage)}" alt="${esc(product.title)}" decoding="async" loading="${index < 4 ? "eager" : "lazy"}" fetchpriority="${index < 2 ? "high" : "low"}">`
      : '<div class="placeholder"><b>Product image pending</b><span>See product details</span></div>';
    return `<article class="card" data-product-id="${esc(product.id)}"><div class="media">${media}</div><div class="card-body"><div class="kicker">${esc(product.brand)} · ${esc(category)}</div><h3>${esc(product.title)}</h3><div class="mpn">MPN ${esc(product.mpn)}</div><span class="ot-live-stock">Available online</span><div class="ot-live-inline-price">${money(approval.priceCents)}</div><a class="card-link" href="${esc(product.slug)}">View product →</a></div></article>`;
  }

  function notify(count, ok) {
    window.__OMNI_CATALOGUE_WIDE_READY__ = true;
    document.dispatchEvent(new CustomEvent("omni:catalogue-ready", { detail:{ count, ok } }));
  }

  async function mount() {
    const section = [...document.querySelectorAll("main > .section")].find(node => node.querySelector(".grid"));
    const grid = section?.querySelector(".grid");
    if (!section || !grid || grid.dataset.otWideReady === "1") return;
    grid.dataset.otWideReady = "1";

    try {
      const [products, registry, stock, imageData] = await Promise.all([
        loadProducts(),
        json("/assets/us-live-products.json?v=checkout-registry"),
        json("/assets/us-stock-status.json?v=checkout-stock"),
        json("/assets/us-product-images.json?v=1").catch(() => ({ products:{} })),
      ]);
      const byId = new Map(products.map(product => [String(product.id), product]));
      const stockRows = stock?.products || {};
      const registryTime = Date.parse(String(registry?.generatedAtUTC || ""));
      const stockTime = Date.parse(String(stock?.generatedAtUTC || ""));
      if (!Number.isFinite(registryTime) || !Number.isFinite(stockTime) || stockTime < registryTime) throw new Error("stock status is older than checkout registry");
      const liveEntries = Object.entries(registry?.products || {}).filter(([, row]) => row?.enabled === true && row?.authorizationVerified === true && Number(row?.priceCents) > 0 && row?.liveKeystoneOrderable === true);
      const verified = liveEntries.map(([id, approval]) => {
        const product = byId.get(String(id));
        const status = stockRows[id];
        const agrees = product && basename(product.slug) === basename(approval.slug) && status?.checkoutReady === true && status?.status === "in_stock" && status?.liveApi === "ORDERABLE" && basename(status.slug) === basename(product.slug);
        return agrees ? { product, approval } : null;
      }).filter(Boolean);

      if (!liveEntries.length || verified.length !== liveEntries.length) throw new Error("live catalogue sources disagree");
      grid.innerHTML = verified.map(({ product, approval }, index) => productCard(product, approval, imageData?.products?.[product.id], index)).join("");

      const head = section.querySelector(".section-head");
      if (head) head.innerHTML = '<div><div class="kicker">Verified online range</div><h2>Shop current online products.</h2></div><p class="cp-section-copy">Every product shown here has a verified online-selling gate, current orderable status and checkout price. Browse the wider catalogue inside each department.</p>';
      notify(verified.length, true);
    } catch (_) {
      grid.innerHTML = '<div class="notice" style="grid-column:1/-1"><strong>Online catalogue is updating.</strong><br>Checkout availability could not be verified right now. Refresh the page or contact product support before ordering.</div>';
      notify(0, false);
    }

    if (!section.querySelector(".ot-wide-browse-rail")) {
      const rail = document.createElement("div");
      rail.className = "ot-wide-browse-rail";
      rail.style.cssText = "display:flex;flex-wrap:wrap;gap:9px;margin-top:18px";
      rail.innerHTML = '<a class="card-link" href="automotive.html">Browse all Auto Parts →</a><a class="card-link" href="marine.html">Browse Marine →</a><a class="card-link" href="rv.html">Browse RV &amp; Overlanding →</a>';
      grid.insertAdjacentElement("afterend", rail);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once:true });
  else mount();
})();
