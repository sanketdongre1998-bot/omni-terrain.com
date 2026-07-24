(function () {
  "use strict";

  const CART_KEY = "omniTerrainUsCart";
  const REQUEST_KEY = "omniTerrainUsLastRequest";
  const US_PHONE_DISPLAY = "+1 307-533-0570";
  const US_PHONE_LINK = "+13075330570";
  const MAX_QUANTITY = 99;
  const products = Array.isArray(window.OMNI_US_PRODUCTS) ? window.OMNI_US_PRODUCTS : [];

  function normaliseQuantity(value) {
    const quantity = Math.floor(Number(value) || 1);
    return Math.min(MAX_QUANTITY, Math.max(1, quantity));
  }

  function readCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item) => item && typeof item.id === "string")
        .map((item) => ({ id: item.id, quantity: normaliseQuantity(item.quantity) }));
    } catch (_) {
      return [];
    }
  }

  function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateCounts();
  }

  function updateCounts() {
    const count = readCart().reduce((total, item) => total + normaliseQuantity(item.quantity), 0);
    document.querySelectorAll("[data-cart-count]").forEach((node) => {
      node.textContent = String(count);
    });
  }

  function getProduct(id) {
    return products.find((product) => product.id === id);
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function setMeta(name, content) {
    const meta = document.querySelector('meta[name="' + name + '"]');
    if (meta) meta.setAttribute("content", content);
  }

  function setCartLinkLabels() {
    document.querySelectorAll(".cart-link").forEach((link) => {
      const count = link.querySelector("[data-cart-count]");
      if (count && link.childNodes.length) link.childNodes[0].nodeValue = "Request Cart ";
    });
    document.querySelectorAll('.mobile-nav a[href="cart.html"]').forEach((link) => {
      link.textContent = "Request Cart";
    });
  }

  function injectUsContactNumber() {
    document.querySelectorAll("footer .footer-links").forEach((links) => {
      if (links.querySelector("[data-us-phone]")) return;
      const heading = links.parentElement ? links.parentElement.textContent || "" : "";
      if (!links.querySelector('a[href^="mailto:"]') && !/Talk to us|Help|Support/i.test(heading)) return;
      const phone = document.createElement("a");
      phone.href = "tel:" + US_PHONE_LINK;
      phone.dataset.usPhone = "true";
      phone.textContent = US_PHONE_DISPLAY;
      links.appendChild(phone);
    });

    document.querySelectorAll(".legal-note").forEach((note) => {
      if (!note.textContent.includes(US_PHONE_DISPLAY)) {
        note.appendChild(document.createTextNode(" · " + US_PHONE_DISPLAY));
      }
    });
  }

  function injectGuestCheckoutNotice() {
    const commerceShell = document.querySelector(".commerce-shell");
    if (commerceShell && !commerceShell.querySelector("[data-guest-checkout-note]")) {
      const notice = document.createElement("div");
      notice.dataset.guestCheckoutNote = "true";
      notice.setAttribute("role", "note");
      notice.style.cssText = "display:inline-flex;flex-wrap:wrap;gap:6px;margin-top:16px;padding:9px 12px;border:1px solid rgba(230,209,164,.35);border-radius:999px;background:rgba(255,255,255,.08);color:#eef4fa;font-size:.67rem;line-height:1.45";
      notice.innerHTML = "<strong>Guest checkout</strong><span>— no account or login required.</span>";
      commerceShell.appendChild(notice);
    }

    const checkoutForm = document.getElementById("checkoutForm");
    if (checkoutForm && !document.querySelector("[data-checkout-account-note]")) {
      const formNotice = document.createElement("div");
      formNotice.dataset.checkoutAccountNote = "true";
      formNotice.setAttribute("role", "note");
      formNotice.style.cssText = "margin:0 0 18px;padding:13px 15px;border:1px solid #e4d1a9;border-radius:12px;background:#fff8e9;color:#59491f;font-size:.72rem;line-height:1.6";
      formNotice.innerHTML = "<strong>No account required.</strong> Continue as a guest using your email and delivery address. These details are used to review the selected products and confirm the next secure step.";
      checkoutForm.parentNode.insertBefore(formNotice, checkoutForm);
    }
  }

  function alignCatalogueLanguage() {
    if (!document.querySelector(".store-catalogue")) return;

    setMeta("robots", "index,follow");
    setMeta("description", "Browse 50 automotive, towing, RV, overlanding and marine product records from established brands. Add products to the OMNI Terrain request cart for availability, pricing and shipping review.");

    const statusChip = document.querySelector(".availability-strip .status-chip");
    const availabilityText = document.querySelector(".availability-strip .container span:last-child");
    if (statusChip) statusChip.textContent = "Request checkout available";
    if (availabilityText) availabilityText.textContent = "Products can be added to the request cart. Availability, price, shipping and return terms are confirmed before payment.";

    const introSummary = document.querySelector(".store-intro-summary p");
    if (introSummary) introSummary.textContent = "Product records are available for review now. Final availability, price and shipping are confirmed before an order is accepted.";

    const productsHeading = document.querySelector(".store-products-heading p");
    if (productsHeading) productsHeading.textContent = "Use the category filters to narrow the range. Each page includes the manufacturer part number, specifications, fitment notes and an availability-review request option.";

    const footerStatus = document.querySelector(".footer-bottom span:last-child");
    if (footerStatus) footerStatus.textContent = "US Store · Guest request checkout active · No payment before confirmation";

    setCartLinkLabels();
  }

  function alignProductPageLanguage() {
    if (!document.body || !document.body.dataset || !document.body.dataset.productId) return;

    const product = getProduct(document.body.dataset.productId);
    setMeta("robots", "index,follow");
    if (product) {
      setMeta("description", product.brand + " " + product.title + ", MPN " + product.mpn + ". Review specifications and submit an availability, price and shipping request through OMNI Terrain.");
    }

    const statusChip = document.querySelector(".availability-strip .status-chip");
    const availabilityText = document.querySelector(".availability-strip .container span:last-child");
    if (statusChip) statusChip.textContent = "Availability review";
    if (availabilityText) availabilityText.textContent = "This product is not available for immediate purchase, but it can be added to the request cart for availability, price and shipping review.";

    const visualCaption = document.querySelector(".visual-caption");
    if (visualCaption) {
      const captionText = visualCaption.querySelector("span");
      const captionStrong = visualCaption.querySelector("b");
      if (captionText) captionText.textContent = "Manufacturer reference image";
      if (captionStrong) captionStrong.textContent = "Confirm the supplied item by brand and MPN";
    }

    const purchaseLabel = document.querySelector(".purchase-label");
    const purchaseTitle = document.querySelector(".purchase-panel h2");
    const priceText = document.querySelector(".price-withheld");
    const purchaseCopy = document.querySelector(".purchase-panel > p");
    if (purchaseLabel) purchaseLabel.textContent = "Request status";
    if (purchaseTitle) purchaseTitle.textContent = "Confirmation Required";
    if (priceText) priceText.textContent = "Price confirmed after review";
    if (purchaseCopy) purchaseCopy.textContent = "Add this product to the request cart. OMNI Terrain will confirm supplier availability, final price, shipping, return terms and secure payment before accepting an order.";

    const shippingCopy = document.querySelector(".shipping-card p");
    if (shippingCopy) shippingCopy.textContent = "Shipping method, dispatch estimate, damage handling, return address and product-specific conditions are confirmed before payment. No unavailable product is charged or treated as an accepted order.";

    const footerStatus = document.querySelector(".footer-bottom span:last-child");
    if (footerStatus) footerStatus.textContent = "US Store · Request-cart checkout active · Availability confirmed before payment";

    document.querySelectorAll('.mobile-store-bar a[href="cart.html"]').forEach((link) => {
      link.textContent = "Request cart";
    });
    setCartLinkLabels();
  }

  function alignCartAndCheckoutLanguage() {
    if (document.getElementById("cartRoot") || document.getElementById("checkoutForm")) {
      setCartLinkLabels();
      const footerStatus = document.querySelector(".footer-bottom span:last-child");
      if (footerStatus) footerStatus.textContent = "US Store · Guest request checkout · No payment before confirmation";
    }
  }

  function addRequestItem(id) {
    const product = getProduct(id);
    if (!product) return 0;

    const cart = readCart();
    const existing = cart.find((item) => item.id === id);
    if (existing) {
      existing.quantity = Math.min(MAX_QUANTITY, normaliseQuantity(existing.quantity) + 1);
    } else {
      cart.push({ id, quantity: 1 });
    }
    writeCart(cart);
    return existing ? existing.quantity : 1;
  }

  function changeRequestQuantity(id, delta) {
    const cart = readCart();
    const item = cart.find((entry) => entry.id === id);
    if (!item) return;
    item.quantity = Math.min(MAX_QUANTITY, Math.max(1, normaliseQuantity(item.quantity) + delta));
    writeCart(cart);
    renderCart();
    renderCheckoutItems();
  }

  function removeRequestItem(id) {
    writeCart(readCart().filter((item) => item.id !== id));
    renderCart();
    renderCheckoutItems();
  }

  function setupProductRequestButton() {
    const id = document.body && document.body.dataset ? document.body.dataset.productId : "";
    const product = getProduct(id);
    if (!product) return;

    const button = document.querySelector(".purchase-actions button");
    if (!button) return;
    button.disabled = false;
    button.removeAttribute("aria-disabled");
    button.textContent = "Add to Request Cart";

    button.addEventListener("click", () => {
      const quantity = addRequestItem(id);
      button.textContent = "Quantity " + quantity + " in Request Cart ✓";
      setTimeout(() => {
        button.textContent = "Add Another to Request Cart";
      }, 1600);
    });
  }

  function renderCart() {
    const root = document.getElementById("cartRoot");
    if (!root) return;

    const originalCart = readCart();
    const cart = originalCart.filter((item) => getProduct(item.id));
    if (cart.length !== originalCart.length) writeCart(cart);

    const checkoutLink = document.getElementById("checkoutLink");
    if (!cart.length) {
      root.innerHTML = '<div class="empty-state"><b>Your request cart is empty</b><p>Open any US product page and choose “Add to Request Cart”. Products remain subject to supplier availability and final commercial confirmation.</p><a class="button dark" href="us-catalogue.html">Browse US catalogue</a></div>';
      if (checkoutLink) {
        checkoutLink.classList.add("disabled");
        checkoutLink.setAttribute("aria-disabled", "true");
        checkoutLink.addEventListener("click", (event) => event.preventDefault(), { once: true });
      }
      return;
    }

    if (checkoutLink) {
      checkoutLink.classList.remove("disabled");
      checkoutLink.removeAttribute("aria-disabled");
    }

    root.innerHTML = '<div class="request-list">' + cart.map((item) => {
      const product = getProduct(item.id);
      const quantity = normaliseQuantity(item.quantity);
      return '<article class="request-item">' +
        '<div><small>' + escapeHtml(product.brand) + ' · MPN ' + escapeHtml(product.mpn) + '</small>' +
        '<h3>' + escapeHtml(product.title) + '</h3><p>' + escapeHtml(product.category) + '</p></div>' +
        '<div class="request-item-actions"><span>Availability review</span>' +
        '<div aria-label="Quantity controls" style="display:flex;align-items:center;gap:8px">' +
        '<button type="button" data-decrease-request="' + escapeHtml(product.id) + '" aria-label="Decrease quantity" style="width:30px;height:30px;border:1px solid #e7e1d8;border-radius:8px;background:#fff;color:#071a30;font-size:1rem">−</button>' +
        '<b style="min-width:26px;text-align:center;color:#071a30">' + quantity + '</b>' +
        '<button type="button" data-increase-request="' + escapeHtml(product.id) + '" aria-label="Increase quantity" style="width:30px;height:30px;border:1px solid #e7e1d8;border-radius:8px;background:#fff;color:#071a30;font-size:1rem">+</button>' +
        '</div><button type="button" data-remove-request="' + escapeHtml(product.id) + '">Remove</button></div></article>';
    }).join("") + "</div>";

    root.querySelectorAll("[data-decrease-request]").forEach((button) => {
      button.addEventListener("click", () => changeRequestQuantity(button.dataset.decreaseRequest, -1));
    });
    root.querySelectorAll("[data-increase-request]").forEach((button) => {
      button.addEventListener("click", () => changeRequestQuantity(button.dataset.increaseRequest, 1));
    });
    root.querySelectorAll("[data-remove-request]").forEach((button) => {
      button.addEventListener("click", () => removeRequestItem(button.dataset.removeRequest));
    });
  }

  function renderCheckoutItems() {
    const root = document.getElementById("checkoutItems");
    if (!root) return;

    const cart = readCart().filter((item) => getProduct(item.id));
    if (!cart.length) {
      root.innerHTML = '<div class="empty-state"><b>No products selected</b><p>Add products to the request cart before submitting checkout details.</p><a class="button outline" href="us-catalogue.html">Browse products</a></div>';
      return;
    }

    root.innerHTML = '<div class="checkout-product-list">' + cart.map((item) => {
      const product = getProduct(item.id);
      return '<div class="checkout-product"><b>' + escapeHtml(product.title) + '</b><span>' + escapeHtml(product.brand) + ' · MPN ' + escapeHtml(product.mpn) + ' · Qty ' + normaliseQuantity(item.quantity) + '</span></div>';
    }).join("") + "</div>";
  }

  function setupCheckout() {
    const form = document.getElementById("checkoutForm");
    if (!form) return;

    const status = document.getElementById("checkoutStatus");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const cart = readCart().filter((item) => getProduct(item.id));
      if (!cart.length) {
        if (status) {
          status.classList.add("show");
          status.textContent = "Add at least one product to the request cart before submitting checkout.";
        }
        return;
      }

      const data = Object.fromEntries(new FormData(form).entries());
      const reference = "OT-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 7).toUpperCase();
      const lines = cart.map((item, index) => {
        const product = getProduct(item.id);
        return (index + 1) + ". " + product.brand + " " + product.title + " | MPN " + product.mpn + " | Qty " + normaliseQuantity(item.quantity);
      });

      const request = { reference, createdAt: new Date().toISOString(), customer: data, items: cart };
      localStorage.setItem(REQUEST_KEY, JSON.stringify(request));

      const subject = "OMNI Terrain order request " + reference;
      const body = [
        "Order request reference: " + reference,
        "",
        "Checkout type: Guest checkout — no account required",
        "Customer: " + data.firstName + " " + data.lastName,
        "Email: " + data.email,
        "Phone: " + (data.phone || "Not supplied"),
        "Delivery: " + data.address + ", " + data.city + ", " + data.state + " " + data.zip + ", United States",
        "",
        "Products:",
        ...lines,
        "",
        "Notes: " + (data.notes || "None"),
        "",
        "OMNI Terrain support: " + US_PHONE_DISPLAY,
        "I understand availability, price, shipping, returns and secure payment will be confirmed before order acceptance."
      ].join("\n");

      const emailUrl = "mailto:procurement@omni-terrain.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      if (status) {
        status.classList.add("show");
        status.innerHTML = '<b>Guest request ' + escapeHtml(reference) + ' is ready.</b><br>Your details were validated. Use the button below to send the request to OMNI Terrain. No account was created and no payment has been taken.<br><a class="button dark" style="margin-top:12px" href="' + emailUrl + '">Email order request</a>';
      }
    });
  }

  window.OMNI_US_CART = {
    read: readCart,
    write: writeCart,
    clear: () => writeCart([]),
    add: addRequestItem,
    remove: removeRequestItem,
    changeQuantity: changeRequestQuantity
  };

  updateCounts();
  injectUsContactNumber();
  injectGuestCheckoutNotice();
  alignCatalogueLanguage();
  alignProductPageLanguage();
  alignCartAndCheckoutLanguage();
  setupProductRequestButton();
  renderCart();
  renderCheckoutItems();
  setupCheckout();
})();