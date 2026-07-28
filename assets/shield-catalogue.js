(() => {
  "use strict";

  const menu = document.getElementById("menuToggle");
  const mobileNav = document.getElementById("mobileNav");
  const header = document.getElementById("header");

  if (menu && mobileNav) {
    menu.addEventListener("click", () => {
      const open = mobileNav.classList.toggle("open");
      menu.setAttribute("aria-expanded", String(open));
      menu.textContent = open ? "Close" : "Menu";
    });
  }

  if (header) {
    const updateHeader = () => header.classList.toggle("scrolled", window.scrollY > 8);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const productCards = [...document.querySelectorAll("[data-product-category]")];
  const filterCount = document.querySelector("[data-filter-count]");

  function applyFilter(filter) {
    let visible = 0;
    productCards.forEach((card) => {
      const show = filter === "all" || card.dataset.productCategory === filter;
      card.hidden = !show;
      if (show) visible += 1;
    });
    filterButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
    });
    if (filterCount) filterCount.textContent = String(visible);
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyFilter(button.dataset.filter);
      const url = new URL(window.location.href);
      if (button.dataset.filter === "all") {
        url.hash = "products";
      } else {
        url.hash = button.dataset.filter;
      }
      window.history.replaceState(null, "", url);
    });
  });

  const initialFilter = ["fridges", "windows", "blinds"].includes(window.location.hash.slice(1))
    ? window.location.hash.slice(1)
    : "all";
  if (filterButtons.length) applyFilter(initialFilter);

  const galleryMain = document.getElementById("galleryMain");
  const galleryButtons = [...document.querySelectorAll("[data-gallery-src]")];
  galleryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!galleryMain) return;
      galleryMain.src = button.dataset.gallerySrc;
      galleryButtons.forEach((candidate) => candidate.classList.toggle("active", candidate === button));
    });
  });
})();
