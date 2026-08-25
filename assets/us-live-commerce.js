(async function () {
  "use strict";

  const CART_KEY = "omniTerrainUsCart";
  const CONFIG_URL = "/assets/us-live-products.json";
  const products = Array.isArray(window.OMNI_US_PRODUCTS) ? window.OMNI_US_PRODUCTS : [];

  function readCart() {
    try {
      const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(cart) ? cart : [];
    } catch (_) {
      return [];
    }
  }

  function productById(id) {
    return products.find((product) => product.id === id) || null;
  }

  function money(cents) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(cents || 0) / 100);
  }

  function cartQty(item) {
    return Math.max(1, Math.min(99, Math.floor(Number(item?.quantity || 1))));
  }

  let config;
  try {
    const response = await fetch(CONFIG_URL + "?v=1", { cache: "no-store" });
    if (!response.ok) return;
    config = await response.json();
  } catch (_) {
    return;
  }

  const live = new Map(
    Object.entries(config?.products || {})
      .filter(([, value]) => value && value.enabled === true && Number(value.priceCents) > 0)
  );

  if (!live.size) return;

  function liveProduct(id) {
    return live.get(String(id || "")) || null;
  }

  function relabelCart() {
    document.querySelectorAll(".cart-link").forEach((link) => {
      const count = link.querySelector("[data-cart-count]");
      if (count && link.childNodes.length) link.childNodes[0].nodeValue = "Cart ";
    });
    document.querySelectorAll('.mobile-nav a[href="cart.html"], .mobile-store-bar a[href="cart.html"]').forEach((link) => {
      link.textContent = "Cart";
    });
  }

  function enhanceProductPage() {
    const id = document.body?.dataset?.productId || "";
    const price = liveProduct(id);
    if (!price) return;

    relabelCart();

    const statusChip = document.querySelector(".availability-strip .status-chip");
    const statusText = document.querySelector(".availability-strip .container span:last-child");
    if (statusChip) statusChip.textContent = "Online checkout";
    if (statusText) statusText.textContent = "Current online price is available. Shipping shown here is included unless checkout states otherwise.";

    const label = document.querySelector(".purchase-label");
    const heading = document.querySelector(".purchase-panel h2");
    const priceNode = document.querySelector(".price-withheld");
    const copy = document.querySelector(".purchase-panel > p");
    if (label) label.textContent = "Online price";
    if (heading) heading.textContent = money(price.priceCents);
    if (priceNode) priceNode.textContent = price.shippingIncluded ? "Shipping included" : "Shipping calculated at checkout";
    if (copy) copy.textContent = "Add this item to your cart and continue to secure checkout. Payment details are handled by Stripe and are never stored on Omni Terrain.";

    const oldButton = document.querySelector(".purchase-actions button");
    if (!oldButton || !window.OMNI_US_CART?.add) return;
    const button = oldButton.cloneNode(true);
    oldButton.replaceWith(button);
    button.disabled = false;
    button.removeAttribute("aria-disabled");
    button.textContent = "Add to Cart";
    button.addEventListener("click", () => {
      const qty = window.OMNI_US_CART.add(id);
      button.textContent = qty > 1 ? `Quantity ${qty} in Cart ✓` : "Added to Cart ✓";
      setTimeout(() => { button.textContent = "Add Another"; }, 1400);
      relabelCart();
    });
  }

  function enhanceCart() {
    const root = document.getElementById("cartRoot");
    if (!root) return;

    const cart = readCart();
    let liveCount = 0;
    cart.forEach((item) => {
      const price = liveProduct(item.id);
      if (!price) return;
      liveCount += 1;
      const control = root.querySelector(`[data-increase-request="${CSS.escape(item.id)}"]`);
      const row = control?.closest(".request-item");
      const status = row?.querySelector(".request-item-actions > span");
      if (status) status.textContent = `${money(price.priceCents)} each`;
    });

    if (cart.length && liveCount === cart.length) {
      relabelCart();
      const checkout = document.getElementById("checkoutLink");
      if (checkout) checkout.textContent = "Secure Checkout →";
    }
  }

  function enhanceCheckoutSummary(cart) {
    const root = document.getElementById("checkoutItems");
    if (!root) return;
    const total = cart.reduce((sum, item) => sum + liveProduct(item.id).priceCents * cartQty(item), 0);
    root.querySelectorAll(".checkout-product").forEach((node, index) => {
      const item = cart[index];
      if (!item) return;
      const price = liveProduct(item.id);
      const span = node.querySelector("span");
      if (span && price) span.textContent += ` · ${money(price.priceCents)} each`;
    });
    const totalNode = document.createElement("div");
    totalNode.style.cssText = "margin-top:18px;padding-top:16px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:20px;color:var(--navy);font-weight:800";
    totalNode.innerHTML = `<span>Order total</span><strong>${money(total)}</strong>`;
    root.appendChild(totalNode);
  }

  function enhanceCheckout() {
    const form = document.getElementById("checkoutForm");
    if (!form) return;

    const cart = readCart();
    if (!cart.length || !cart.every((item) => liveProduct(item.id))) return;
    const apiBase = String(config?.checkoutApiBase || "").replace(/\/$/, "");
    if (!apiBase) return;

    relabelCart();
    enhanceCheckoutSummary(cart);

    const cardHeading = form.closest(".commerce-card")?.querySelector("h2");
    const heroHeading = document.querySelector(".commerce-shell h1");
    const heroCopy = document.querySelector(".commerce-shell p");
    if (cardHeading) cardHeading.textContent = "Secure payment";
    if (heroHeading) heroHeading.textContent = "Secure checkout";
    if (heroCopy) heroCopy.textContent = "Review your order and continue to Stripe to enter delivery and payment details securely.";

    const cleanForm = form.cloneNode(false);
    form.replaceWith(cleanForm);
    cleanForm.innerHTML = '<div class="policy-callout" style="margin-top:0">Payment and card details are collected securely by Stripe. Omni Terrain never receives or stores your full card number.</div><button class="button dark" type="submit" style="width:100%;margin-top:18px">Continue to Secure Payment</button><div class="form-status" id="checkoutStatus" role="status"></div>';

    cleanForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = cleanForm.querySelector("button[type=submit]");
      const status = cleanForm.querySelector("#checkoutStatus");
      button.disabled = true;
      button.textContent = "Opening secure checkout…";
      try {
        const response = await fetch(`${apiBase}/api/us-create-checkout-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: cart.map((item) => ({ id: item.id, quantity: cartQty(item) })) }),
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
  enhanceCart();
  enhanceCheckout();
})();
