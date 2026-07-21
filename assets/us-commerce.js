(function () {
  const CART_KEY = "omniTerrainUsCart";
  const products = Array.isArray(window.OMNI_US_PRODUCTS) ? window.OMNI_US_PRODUCTS : [];

  function readCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateCounts();
  }

  function updateCounts() {
    const count = readCart().reduce((total, item) => total + Math.max(0, Number(item.quantity) || 0), 0);
    document.querySelectorAll("[data-cart-count]").forEach((node) => { node.textContent = String(count); });
  }

  function renderCart() {
    const root = document.getElementById("cartRoot");
    if (!root) return;
    const cart = readCart();
    const usable = cart.filter((item) => products.some((product) => product.id === item.id && product.availability !== "Currently Unavailable"));
    if (usable.length !== cart.length) writeCart(usable);

    if (!usable.length) {
      root.innerHTML = '<div class="empty-state"><b>Your cart is empty</b><p>All 50 US catalogue products are currently unavailable, so they cannot be added to cart.</p><a class="button dark" href="us-catalogue.html">Browse US catalogue</a></div>';
      const checkoutLink = document.getElementById("checkoutLink");
      if (checkoutLink) {
        checkoutLink.classList.add("disabled");
        checkoutLink.setAttribute("aria-disabled", "true");
        checkoutLink.addEventListener("click", (event) => event.preventDefault());
      }
    }
  }

  function setupCheckout() {
    const form = document.getElementById("checkoutForm");
    if (!form) return;
    const qaMode = new URLSearchParams(window.location.search).get("qa") === "1";
    const fields = [...form.querySelectorAll("input, select, textarea, button")];
    const qaBanner = document.getElementById("qaBanner");
    const status = document.getElementById("checkoutStatus");

    if (!qaMode) {
      fields.forEach((field) => { field.disabled = true; });
      return;
    }

    if (qaBanner) qaBanner.classList.add("show");
    fields.forEach((field) => { field.disabled = false; });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      if (status) {
        status.classList.add("show");
        status.textContent = "QA checkout path completed locally. No order, payment or customer data was transmitted.";
      }
    });
  }

  window.OMNI_US_CART = { read: readCart, write: writeCart, clear: () => writeCart([]) };
  updateCounts();
  renderCart();
  setupCheckout();
})();
