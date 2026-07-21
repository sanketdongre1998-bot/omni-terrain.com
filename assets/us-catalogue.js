(function () {
  const header = document.getElementById("header");
  const menuButton = document.getElementById("menuToggle");
  const mobileNav = document.getElementById("mobileNav");

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
})();
