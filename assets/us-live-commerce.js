(async function () {
  "use strict";

  const CART_KEY = "omniTerrainUsCart";
  const CONFIG_URL = "/assets/us-live-products.json";
  const MAX_QTY = 10;
  const LAUNCH_OFFERS = {
    HUS81147: { priceCents: 11999, compareAtCents: 12626, label: "Launch Deal" },
    HUS81148: { priceCents: 14999, compareAtCents: 15828, label: "Launch Deal" },
    CCIN8010F: { priceCents: 19999, compareAtCents: 21900, label: "Launch Deal" },
    A1360828HD: { priceCents: 20499, compareAtCents: 21399, label: "Launch Deal" },
    B5224066464: { priceCents: 13299, compareAtCents: 13697, label: "Launch Deal" },
  };

  function readCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item) => item && typeof item.id === "string")
        .map((item) => ({ id: item.id, quantity: cartQty(item) }));
    } catch (_) {
      return [];
    }
  }

  function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCounts();
  }

  function cartQty(item) {
    return Math.max(1, Math.min(MAX_QTY, Math.floor(Number(item?.quantity || 1))));
  }

  function addToCart(id, replaceCart) {
    const cart = replaceCart ? [] : readCart();
    const existing = cart.find((item) => item.id === id);
    if (existing) existing.quantity = Math.min(MAX_QTY, cartQty(existing) + 1);
    else cart.push({ id, quantity: 1 });
    writeCart(cart);
    return cart.find((item) => item.id === id)?.quantity || 1;
  }

  function updateCartCounts() {
    const count = readCart().reduce((sum, item) => sum + cartQty(item), 0);
    document.querySelectorAll("[data-cart-count]").forEach((node) => {
      node.textContent = String(count);
    });
  }

  function money(cents) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(Number(cents || 0) / 100);
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[char]));
  }

  function injectStyles() {
    if (document.getElementById("otLiveCommerceStyles")) return;
    const style = document.createElement("style");
    style.id = "otLiveCommerceStyles";
    style.textContent = `
      .ot-live-buybox{margin:24px 0;padding:22px;border:1px solid #d9c28f;border-radius:16px;background:linear-gradient(135deg,#fffdf8,#f8f1e3);box-shadow:0 12px 30px rgba(7,26,48,.07)}
      .ot-live-label{font-size:11px;font-weight:850;text-transform:uppercase;letter-spacing:.09em;color:#8b6a31}
      .ot-live-price{margin:7px 0 2px;font-size:36px;line-height:1;font-weight:900;color:#071a30;letter-spacing:-.035em}
      .ot-live-shipping{margin:8px 0 18px;color:#52606d;font-size:13px}
      .ot-live-actions{display:flex;flex-wrap:wrap;gap:10px}
      .ot-live-button{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:12px 18px;border:0;border-radius:10px;background:#071a30;color:#fff!important;text-decoration:none;font-weight:850;cursor:pointer}
      .ot-live-button.secondary{background:#fff;color:#071a30!important;border:1px solid #071a30}
      .ot-live-trust{margin-top:14px;color:#65717d;font-size:12px;line-height:1.55}
      .ot-live-inline-price{margin-top:4px;color:#071a30;font-size:20px;font-weight:900}
      .ot-live-stock{display:inline-flex;width:max-content;padding:6px 9px;border-radius:999px;background:#e5f5ec;color:#167047;font-size:11px;font-weight:850}
      .ot-live-total{margin-top:18px;padding-top:16px;border-top:1px solid #e3e6e9;display:flex;justify-content:space-between;gap:20px;color:#071a30;font-weight:900}
      .ot-live-offer-note{margin:4px 0 8px;color:#167047;font-size:11px;font-weight:800}.ot-live-offer-note s{color:#7a8490;font-weight:600}
    `;
    document.head.appendChild(style);
  }

  let config;
  try {
    const response = await fetch(CONFIG_URL + "?v=2", { cache: "no-store" });
    if (!response.ok) return;
    config = await response.json();
  } catch (_) {
    return;
  }

  const live = new Map(
    Object.entries(config?.products || {})
      .filter(([, product]) => product && product.enabled === true && Number(product.priceCents) > 0)
      .map(([id, product]) => {
        const offer = LAUNCH_OFFERS[id];
        const effective = offer ? { ...product, priceCents: offer.priceCents, launchOffer: offer } : product;
        return [String(id), { ...effective, id: String(id) }];
      })
  );

  if (!live.size) return;
  injectStyles();

  function liveProduct(id) {
    return live.get(String(id || "")) || null;
  }

  function pageFilename() {
    return decodeURIComponent(String(window.location?.pathname || "").split("/").filter(Boolean).pop() || "index.html");
  }

  function parseProductSchema() {
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const data = JSON.parse(script.textContent || "{}");
        if (data && data["@type"] === "Product") return data;
      } catch (_) {}
    }
    return null;
  }

  function currentLiveProduct() {
    const datasetId = document.body?.dataset?.productId;
    if (datasetId && liveProduct(datasetId)) return liveProduct(datasetId);

    const filename = pageFilename();
    for (const product of live.values()) {
      if (product.slug && product.slug === filename) return product;
    }

    const schema = parseProductSchema();
    if (schema?.sku && liveProduct(schema.sku)) return liveProduct(schema.sku);
    for (const product of live.values()) {
      if (schema?.mpn && product.mpn && String(schema.mpn).toLowerCase() === String(product.mpn).toLowerCase()) return product;
    }
    return null;
  }

  function ensureCartLink() {
    const existing = document.querySelector('a[href="cart.html"]');
    if (existing) {
      if (/request cart/i.test(existing.textContent || "")) {
        existing.childNodes[0] ? existing.childNodes[0].nodeValue = "Cart " : existing.textContent = "Cart";
      }
      return;
    }
    const nav = document.querySelector(".nav") || document.querySelector(".nav-links");
    if (!nav) return;
    const link = document.createElement("a");
    link.href = "cart.html";
    link.innerHTML = 'Cart <span data-cart-count>0</span>';
    nav.appendChild(link);
  }

  function relabelCartLinks() {
    ensureCartLink();
    document.querySelectorAll('.cart-link, .mobile-nav a[href="cart.html"], .mobile-store-bar a[href="cart.html"], .nav a[href="cart.html"], .nav-links a[href="cart.html"]').forEach((link) => {
      const count = link.querySelector?.("[data-cart-count]");
      if (count) {
        if (link.childNodes.length) link.childNodes[0].nodeValue = "Cart ";
      } else if (/request cart/i.test(link.textContent || "")) {
        link.textContent = "Cart";
      }
    });
    updateCartCounts();
  }

  function enhanceWave1ProductPage(product) {
    const copy = document.querySelector(".product-copy");
    if (!copy) return false;

    relabelCartLinks();

    const oldNotice = copy.querySelector(".notice");
    const oldSupport = oldNotice?.nextElementSibling;
    if (oldNotice) oldNotice.remove();
    if (oldSupport && oldSupport.matches?.("p") && oldSupport.querySelector?.("a")) oldSupport.remove();

    copy.querySelectorAll(".product-price").forEach((node) => node.remove());

    let box = copy.querySelector(".ot-live-buybox");
    if (!box) {
      box = document.createElement("div");
      box.className = "ot-live-buybox";
      const facts = copy.querySelector(".facts");
      if (facts) copy.insertBefore(box, facts);
      else copy.appendChild(box);
    }

    box.innerHTML = `
      <div class="ot-live-label">Online price</div>
      <div class="ot-live-price">${money(product.priceCents)}</div>
      <div class="ot-live-shipping">${product.shippingIncluded ? "Free standard shipping in the contiguous U.S." : "Shipping calculated at checkout"}</div>
      <div class="ot-live-actions">
        <button type="button" class="ot-live-button" data-ot-add>Add to Cart</button>
        <button type="button" class="ot-live-button secondary" data-ot-buy>Buy Now</button>
      </div>
      <div class="ot-live-trust">Secure payment powered by Stripe · Product eligibility, stock and fulfilment verified before online sale.</div>
    `;

    const add = box.querySelector("[data-ot-add]");
    const buy = box.querySelector("[data-ot-buy]");
    add.addEventListener("click", () => {
      const quantity = addToCart(product.id, false);
      add.textContent = quantity > 1 ? `Quantity ${quantity} in Cart ✓` : "Added to Cart ✓";
      setTimeout(() => { add.textContent = "Add Another"; }, 1400);
    });
    buy.addEventListener("click", () => {
      addToCart(product.id, false);
      window.location.assign("checkout.html");
    });
    return true;
  }

  function enhanceLegacyProductPage(product) {
    const panel = document.querySelector(".purchase-panel");
    if (!panel) return false;
    relabelCartLinks();
    const heading = panel.querySelector("h2");
    const priceNode = panel.querySelector(".price-withheld");
    const copy = panel.querySelector(":scope > p");
    if (heading) heading.textContent = money(product.priceCents);
    if (priceNode) priceNode.textContent = product.shippingIncluded ? "Free standard shipping" : "Shipping calculated at checkout";
    if (copy) copy.textContent = "Add this item to your cart and continue to secure checkout. Payment is handled by Stripe.";
    const oldButton = panel.querySelector(".purchase-actions button");
    if (oldButton) {
      const button = oldButton.cloneNode(true);
      oldButton.replaceWith(button);
      button.disabled = false;
      button.removeAttribute("aria-disabled");
      button.textContent = "Add to Cart";
      button.addEventListener("click", () => {
        addToCart(product.id, false);
        button.textContent = "Added to Cart ✓";
      });
    }
    return true;
  }

  function enhanceProductPage() {
    const product = currentLiveProduct();
    if (!product) return;
    if (enhanceWave1ProductPage(product)) return;
    enhanceLegacyProductPage(product);
  }

  function enhanceCatalogueCards() {
    let touched = false;
    document.querySelectorAll(".card").forEach((card) => {
      const link = card.querySelector(".card-link");
      if (!link) return;
      const href = String(link.getAttribute("href") || "").split("?")[0];
      const product = Array.from(live.values()).find((item) => item.slug === href);
      if (!product) return;
      touched = true;
      const note = card.querySelector(".search-note");
      const oldPrice = card.querySelector(".price");
      const target = oldPrice || note;
      if (target) {
        target.className = "ot-live-inline-price";
        target.textContent = money(product.priceCents);
      } else {
        const price = document.createElement("div");
        price.className = "ot-live-inline-price";
        price.textContent = money(product.priceCents);
        link.parentNode.insertBefore(price, link);
      }
      if (product.launchOffer) {
        let promo = card.querySelector(".ot-live-offer-note");
        if (!promo) {
          promo = document.createElement("div");
          promo.className = "ot-live-offer-note";
          const priceNode = card.querySelector(".ot-live-inline-price");
          priceNode?.insertAdjacentElement("afterend", promo);
        }
        if (promo) promo.innerHTML = `Launch deal · <s>${money(product.launchOffer.compareAtCents)}</s> · Save ${money(product.launchOffer.compareAtCents - product.launchOffer.priceCents)}`;
      }
      const status = card.querySelector(".status");
      if (status) {
        status.className = "ot-live-stock";
        status.textContent = "Available online";
      }
    });
    if (touched) relabelCartLinks();
  }

  function enhanceCart() {
    const root = document.getElementById("cartRoot");
    if (!root) return;
    const cart = readCart();
    if (!cart.length || !cart.every((item) => liveProduct(item.id))) return;

    relabelCartLinks();
    document.title = "Cart | Omni Terrain";
    const hero = document.querySelector(".commerce-shell h1");
    const heroCopy = document.querySelector(".commerce-shell p");
    if (hero) hero.textContent = "Your cart";
    if (heroCopy) heroCopy.textContent = "Review your selected products and continue to secure checkout.";

    let total = 0;
    cart.forEach((item) => {
      const product = liveProduct(item.id);
      const quantity = cartQty(item);
      total += Number(product.priceCents) * quantity;
      let row = null;
      try {
        const control = root.querySelector(`[data-increase-request="${CSS.escape(item.id)}"]`);
        row = control?.closest(".request-item") || null;
      } catch (_) {}
      const status = row?.querySelector(".request-item-actions > span");
      if (status) status.textContent = `${money(product.priceCents)} each`;
    });

    const summaryRows = document.querySelectorAll(".summary-row");
    summaryRows.forEach((row) => {
      const label = row.querySelector("span")?.textContent?.trim().toLowerCase();
      const value = row.querySelector("strong");
      if (!value) return;
      if (label === "price") value.textContent = money(total);
      if (label === "shipping") value.textContent = "Free standard shipping";
      if (label === "payment") value.textContent = "Secure Stripe checkout";
    });
    const note = document.querySelector(".checkout-note");
    if (note) note.textContent = "Continue to secure checkout. Card and delivery details are collected by Stripe.";
    const checkout = document.getElementById("checkoutLink");
    if (checkout) checkout.textContent = "Secure Checkout →";
  }

  function enhanceCheckoutSummary(cart) {
    const root = document.getElementById("checkoutItems");
    if (!root) return;
    const total = cart.reduce((sum, item) => sum + Number(liveProduct(item.id).priceCents) * cartQty(item), 0);
    root.querySelectorAll(".checkout-product").forEach((node, index) => {
      const item = cart[index];
      const product = item ? liveProduct(item.id) : null;
      const span = node.querySelector("span");
      if (span && product) span.textContent += ` · ${money(product.priceCents)} each`;
    });
    if (!root.querySelector(".ot-live-total")) {
      const totalNode = document.createElement("div");
      totalNode.className = "ot-live-total";
      totalNode.innerHTML = `<span>Order total</span><strong>${money(total)}</strong>`;
      root.appendChild(totalNode);
    }
  }

  function enhanceCheckout() {
    const form = document.getElementById("checkoutForm");
    if (!form) return;
    const cart = readCart();
    if (!cart.length) return;

    if (!cart.every((item) => liveProduct(item.id))) {
      relabelCartLinks();
      const button = form.querySelector('button[type="submit"]');
      if (button) {
        button.disabled = true;
        button.textContent = "Online checkout unavailable";
      }
      const status = form.querySelector("#checkoutStatus");
      if (status) {
        status.classList.add("show");
        status.textContent = "One or more products in this cart are not currently enabled for online purchase. Remove those products to continue.";
      }
      return;
    }

    const apiBase = String(config?.checkoutApiBase || "").replace(/\/$/, "");
    if (!apiBase) {
      const button = form.querySelector('button[type="submit"]');
      if (button) {
        button.disabled = true;
        button.textContent = "Secure checkout temporarily unavailable";
      }
      return;
    }

    relabelCartLinks();
    enhanceCheckoutSummary(cart);
    document.title = "Secure Checkout | Omni Terrain";

    const heroHeading = document.querySelector(".commerce-shell h1");
    const heroCopy = document.querySelector(".commerce-shell p");
    if (heroHeading) heroHeading.textContent = "Secure checkout";
    if (heroCopy) heroCopy.textContent = "Continue to Stripe to securely enter delivery and payment details.";

    const card = form.closest(".commerce-card");
    const cardHeading = card?.querySelector("h2");
    if (cardHeading) cardHeading.textContent = "Secure payment";

    const cleanForm = form.cloneNode(false);
    form.replaceWith(cleanForm);
    cleanForm.innerHTML = '<div class="policy-callout" style="margin-top:0"><strong>Secure checkout.</strong> Payment and card details are collected by Stripe. Omni Terrain never receives or stores your full card number.</div><button class="button dark" type="submit" style="width:100%;margin-top:18px">Continue to Secure Payment</button><div class="form-status" id="checkoutStatus" role="status"></div>';

    cleanForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = cleanForm.querySelector('button[type="submit"]');
      const status = cleanForm.querySelector("#checkoutStatus");
      button.disabled = true;
      button.textContent = "Opening secure checkout…";
      try {
        const response = await fetch(`${apiBase}/api/us-create-checkout-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cart.map((item) => ({ id: item.id, quantity: cartQty(item) })),
          }),
        });
        const data = await response.json();
        if (!response.ok || !data?.url) throw new Error(data?.error || "Secure checkout could not be started.");
        window.location.assign(data.url);
      } catch (error) {
        button.disabled = false;
        button.textContent = "Continue to Secure Payment";
        if (status) {
          status.classList.add("show");
          status.textContent = error?.message || "Secure checkout is temporarily unavailable.";
        }
      }
    });
  }

  enhanceProductPage();
  enhanceCatalogueCards();
  enhanceCart();
  enhanceCheckout();
  updateCartCounts();

  // OT_CATALOGUE_DISPLAY_PRICING_LOADER
  if (!document.querySelector('script[data-ot-display-pricing]')) {
    const displayPricing = document.createElement("script");
    displayPricing.src = "/assets/us-display-prices.js?v=2";
    displayPricing.dataset.otDisplayPricing = "true";
    document.head.appendChild(displayPricing);
  }
})();