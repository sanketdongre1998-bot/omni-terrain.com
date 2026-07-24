(function () {
  "use strict";

  const CART_KEY = "omniTerrainUsCart";
  const US_PHONE_DISPLAY = "+1 307-533-0570";
  const US_PHONE_LINK = "+13075330570";
  const header = document.getElementById("header");
  const menuButton = document.getElementById("menuToggle");
  const mobileNav = document.getElementById("mobileNav");

  function getCartCount() {
    try {
      const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (!Array.isArray(cart)) return 0;
      return cart.reduce((total, item) => total + Math.max(1, Math.floor(Number(item && item.quantity) || 1)), 0);
    } catch (_) {
      return 0;
    }
  }

  function alignUniversalStoreDetails() {
    const count = getCartCount();
    document.querySelectorAll("[data-cart-count]").forEach((node) => {
      node.textContent = String(count);
    });

    document.querySelectorAll(".cart-link").forEach((link) => {
      const badge = link.querySelector("[data-cart-count]");
      if (badge && link.childNodes.length) link.childNodes[0].nodeValue = "Request Cart ";
    });

    document.querySelectorAll('.mobile-nav a[href="cart.html"]').forEach((link) => {
      link.textContent = "Request Cart";
    });
    document.querySelectorAll('.mobile-nav a[href="checkout.html"]').forEach((link) => {
      link.textContent = "Guest Checkout";
    });

    document.querySelectorAll(".legal-note").forEach((note) => {
      if (!note.textContent.includes(US_PHONE_DISPLAY)) {
        note.appendChild(document.createTextNode(" · " + US_PHONE_DISPLAY));
      }
    });

    document.querySelectorAll("footer .footer-links").forEach((links) => {
      if (links.querySelector("[data-us-phone]")) return;
      const parentText = links.parentElement ? links.parentElement.textContent || "" : "";
      if (!/Help|Support|Checkout|Talk/i.test(parentText)) return;
      const phone = document.createElement("a");
      phone.href = "tel:" + US_PHONE_LINK;
      phone.dataset.usPhone = "true";
      phone.textContent = US_PHONE_DISPLAY;
      links.appendChild(phone);
    });
  }

  if (header) {
    const updateHeader = () => header.classList.toggle("scrolled", window.scrollY > 8);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  if (menuButton && mobileNav) {
    menuButton.addEventListener("click", () => {
      const open = mobileNav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.textContent = open ? "Close" : "Menu";
    });
    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.textContent = "Menu";
      });
    });
  }

  const filterButtons = [...document.querySelectorAll("[data-us-filter]")];
  const productCards = [...document.querySelectorAll("[data-us-segment]")];
  const visibleCount = document.getElementById("visibleCount");
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.usFilter;
      filterButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      productCards.forEach((card) => {
        card.hidden = filter !== "all" && card.dataset.usSegment !== filter;
      });
      if (visibleCount) {
        const count = productCards.filter((card) => !card.hidden).length;
        visibleCount.textContent = `${count} ${count === 1 ? "product" : "products"}`;
      }
    });
  });

  const hashFilter = window.location.hash.replace("#", "");
  const hashButton = filterButtons.find((button) => button.dataset.usFilter === hashFilter);
  if (hashButton) hashButton.click();

  alignUniversalStoreDetails();
})();