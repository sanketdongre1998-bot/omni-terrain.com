(() => {
  "use strict";

  const KEY = "omniTerrainUkCartV1";
  const DELIVERY_REGION_KEY = "omniTerrainUkDeliveryRegionV1";
  const CHECKOUT_API_BASE = "https://omni-terrain-uk-checkout.vercel.app";
  const products = Array.isArray(window.OMNI_SHIELD_PRODUCTS) ? window.OMNI_SHIELD_PRODUCTS : [];
  window.OMNI_UK_CHECKOUT_API_BASE = CHECKOUT_API_BASE;

  function readCart() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(value) ? value.filter((item) => item && typeof item.id === "string" && Number(item.qty) > 0) : [];
    } catch {
      return [];
    }
  }

  function writeCart(cart) {
    localStorage.setItem(KEY, JSON.stringify(cart));
    updateCounts();
    renderCart();
  }

  function findProduct(id) {
    return products.find((product) => product.id === id);
  }

  function countItems(cart = readCart()) {
    return cart.reduce((total, item) => total + Number(item.qty || 0), 0);
  }

  function money(value) {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);
  }

  function checkoutConfigured() {
    return /^https:\/\//.test(CHECKOUT_API_BASE);
  }

  function mainlandConfirmed() {
    return localStorage.getItem(DELIVERY_REGION_KEY) === "uk_mainland";
  }

  function updateCounts() {
    const count = countItems();
    document.querySelectorAll("[data-uk-cart-count]").forEach((node) => { node.textContent = String(count); });
  }

  function addItem(id, qty = 1) {
    if (!findProduct(id)) return false;
    const cart = readCart();
    const existing = cart.find((item) => item.id === id);
    if (existing) existing.qty = Math.min(20, Number(existing.qty || 0) + qty);
    else cart.push({ id, qty: Math.max(1, qty) });
    writeCart(cart);
    return true;
  }

  function showToast(message) {
    let toast = document.getElementById("ukCartToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "ukCartToast";
      toast.className = "uk-cart-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 3200);
  }

  function ensureDeliveryRegionUi(rows) {
    const summary = document.querySelector(".uk-cart-summary");
    if (!summary) return;

    let gate = document.getElementById("ukDeliveryRegionGate");
    if (!rows.length) {
      gate?.remove();
      return;
    }

    if (!gate) {
      gate = document.createElement("div");
      gate.id = "ukDeliveryRegionGate";
      gate.className = "mini-note";
      gate.style.cssText = "margin:14px 0 16px;padding:14px;border:1px solid var(--line);border-radius:12px;background:#fffdf8;line-height:1.55";
      const checkoutButton = summary.querySelector("button.checkout-disabled, [data-uk-checkout]");
      if (checkoutButton) summary.insertBefore(gate, checkoutButton);
      else summary.appendChild(gate);
    }

    gate.innerHTML = `<strong>Free UK mainland delivery</strong><br>
      <span>Current Shield Autocare products include free standard delivery to standard UK mainland addresses.</span>
      <label style="display:flex;gap:9px;align-items:flex-start;margin-top:10px;cursor:pointer;color:var(--navy)">
        <input type="checkbox" data-uk-mainland-confirm ${mainlandConfirmed() ? "checked" : ""} style="margin-top:3px">
        <span>I confirm my delivery address is standard UK mainland.</span>
      </label>
      <span style="display:block;margin-top:9px">Scottish Highlands, islands, Northern Ireland, Isle of Man or Channel Islands? <a href="uk-contact.html"><strong>Contact UK support before ordering →</strong></a></span>`;
  }

  async function startCheckout(items, trigger) {
    if (!checkoutConfigured()) {
      showToast("Secure card checkout is finishing setup.");
      return;
    }
    if (!items.length) {
      showToast("Your cart is empty.");
      return;
    }
    if (!mainlandConfirmed()) {
      showToast("Please confirm standard UK mainland delivery before checkout.");
      return;
    }

    const originalText = trigger?.textContent;
    if (trigger) {
      trigger.disabled = true;
      trigger.textContent = "Opening secure checkout…";
    }

    try {
      const response = await fetch(`${CHECKOUT_API_BASE}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_region: "uk_mainland",
          items: items.map((item) => ({ id: item.id, qty: Number(item.qty) })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) throw new Error(data.error || "Secure checkout is temporarily unavailable.");
      window.location.assign(data.url);
    } catch (error) {
      showToast(error?.message || "Secure checkout is temporarily unavailable.");
      if (trigger) {
        trigger.disabled = false;
        trigger.textContent = originalText;
      }
    }
  }

  function prepareCheckoutUi(rows) {
    const onCartPage = Boolean(document.getElementById("ukCartRoot"));
    if (onCartPage) ensureDeliveryRegionUi(rows);

    const buttons = document.querySelectorAll("button.checkout-disabled, [data-uk-checkout]");
    buttons.forEach((button) => {
      button.dataset.ukCheckout = "true";
      const regionReady = !onCartPage || mainlandConfirmed();
      const ready = checkoutConfigured() && rows.length > 0 && regionReady;
      button.disabled = !ready;
      button.classList.toggle("checkout-disabled", !ready);
      button.textContent = checkoutConfigured()
        ? (rows.length ? (regionReady ? "Secure checkout →" : "Confirm UK mainland delivery") : "Add items to checkout")
        : "Secure checkout being enabled";
    });

    if (checkoutConfigured()) {
      document.querySelectorAll(".draft-strip .container span:last-child").forEach((node) => {
        node.textContent = "Add products to your Omni Terrain cart and complete payment through secure Stripe Checkout.";
      });
      document.querySelectorAll(".purchase-box .mini-note").forEach((node) => {
        node.innerHTML = "<b>Secure checkout:</b> Add the item to your cart, confirm the delivery area, then complete payment through Stripe Checkout. Omni Terrain does not collect or store your full card details on this page.";
      });
      document.querySelectorAll(".uk-cart-summary .checkout-note").forEach((node) => {
        node.textContent = "Prices shown include UK VAT. Current Shield Autocare products include free standard UK mainland delivery. Other UK regions must be confirmed with support before payment.";
      });
    }
  }

  document.addEventListener("change", (event) => {
    const region = event.target.closest("[data-uk-mainland-confirm]");
    if (!region) return;
    if (region.checked) localStorage.setItem(DELIVERY_REGION_KEY, "uk_mainland");
    else localStorage.removeItem(DELIVERY_REGION_KEY);
    renderCart();
  });

  document.addEventListener("click", (event) => {
    const checkout = event.target.closest("[data-uk-checkout]");
    if (checkout) {
      startCheckout(readCart(), checkout);
      return;
    }

    const add = event.target.closest("[data-uk-add]");
    if (add) {
      const product = findProduct(add.dataset.ukAdd);
      if (product && addItem(product.id)) showToast(`${product.title} added to cart`);
      return;
    }

    const buy = event.target.closest("[data-uk-buy]");
    if (buy) {
      const product = findProduct(buy.dataset.ukBuy);
      if (!product) return;
      if (addItem(product.id)) window.location.href = "uk-cart.html";
      return;
    }

    const action = event.target.closest("[data-uk-cart-action]");
    if (!action) return;
    const id = action.dataset.productId;
    const cart = readCart();
    const row = cart.find((item) => item.id === id);
    if (!row) return;
    if (action.dataset.ukCartAction === "increase") row.qty = Math.min(20, Number(row.qty) + 1);
    if (action.dataset.ukCartAction === "decrease") row.qty = Number(row.qty) - 1;
    if (action.dataset.ukCartAction === "remove" || row.qty < 1) {
      writeCart(cart.filter((item) => item.id !== id));
    } else {
      writeCart(cart);
    }
  });

  function renderCart() {
    const root = document.getElementById("ukCartRoot");
    if (!root) {
      prepareCheckoutUi([]);
      return;
    }
    const cart = readCart();
    const rows = cart.map((item) => ({ ...item, product: findProduct(item.id) })).filter((item) => item.product);

    if (!rows.length) {
      root.innerHTML = `<div class="uk-cart-empty"><h3>Your cart is empty</h3><p>Browse the current UK range and add products you want to review.</p><a class="button primary" href="shield-autocare-uk.html">Shop available products →</a></div>`;
    } else {
      root.innerHTML = `<div class="uk-cart-items">${rows.map(({ product, qty }) => `<article class="uk-cart-item"><a class="uk-cart-thumb" href="${product.slug}"><img src="${product.images[0]}" alt="${product.title}"></a><div class="uk-cart-copy"><small>${product.brand} · ${product.mpn}</small><h3><a href="${product.slug}">${product.title}</a></h3><strong>${money(product.price)} <span>inc VAT</span></strong></div><div class="uk-cart-controls"><div class="qty-control" aria-label="Quantity"><button type="button" data-uk-cart-action="decrease" data-product-id="${product.id}" aria-label="Decrease quantity">−</button><span>${qty}</span><button type="button" data-uk-cart-action="increase" data-product-id="${product.id}" aria-label="Increase quantity">+</button></div><b>${money(product.price * qty)}</b><button class="remove-link" type="button" data-uk-cart-action="remove" data-product-id="${product.id}">Remove</button></div></article>`).join("")}</div>`;
    }

    const itemCount = rows.reduce((total, row) => total + Number(row.qty), 0);
    const subtotal = rows.reduce((total, row) => total + row.product.price * Number(row.qty), 0);
    document.querySelectorAll("[data-uk-summary-items]").forEach((node) => { node.textContent = String(itemCount); });
    document.querySelectorAll("[data-uk-subtotal]").forEach((node) => { node.textContent = money(subtotal); });
    prepareCheckoutUi(rows);
  }

  if (new URLSearchParams(window.location.search).get("checkout") === "cancelled") {
    setTimeout(() => showToast("Checkout cancelled — your cart is unchanged."), 100);
  }

  updateCounts();
  renderCart();
})();
