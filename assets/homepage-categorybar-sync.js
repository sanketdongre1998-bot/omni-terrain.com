(() => {
  "use strict";
  if (window.__OMNI_HOME_CATEGORYBAR_SYNC__) return;
  window.__OMNI_HOME_CATEGORYBAR_SYNC__ = true;

  const file = decodeURIComponent(String(location.pathname || "/").split("/").filter(Boolean).pop() || "").toLowerCase();
  const isUSHome = !file || file === "index.html";
  const isUKHome = file === "uk.html";
  if (!isUSHome && !isUKHome) return;

  function cleanLabel(text) {
    return String(text || "").replace(/[⌄▼▾]/g, "").replace(/\s+/g, " ").trim();
  }

  function sync() {
    const nav = document.querySelector(".ot-ref-nav");
    const row = nav?.querySelector(":scope > .ot-ref-width");
    if (!nav || !row) return false;

    nav.classList.add("ot-home-master-categorybar");
    row.classList.add("ot-home-master-categorybar-row");

    const navItems = [...row.querySelectorAll(":scope > .ot-ref-nav-item")];
    navItems.forEach((item, index) => {
      const button = item.querySelector(":scope > button");
      if (!button) return;
      button.textContent = index === 0 ? "Auto Parts" : "Marine";
      button.setAttribute("aria-haspopup", "true");
      const menu = item.querySelector(":scope > .ot-ref-menu");
      if (menu) menu.classList.add("ot-home-master-dropdown");
    });

    [...row.querySelectorAll(":scope > a")].forEach(anchor => {
      anchor.textContent = cleanLabel(anchor.textContent);
    });

    if (isUKHome && !row.querySelector('a[data-ot-home-tyres="true"]')) {
      const tyres = document.createElement("a");
      tyres.href = "/uk-tyres.html";
      tyres.textContent = "Tyres";
      tyres.dataset.otHomeTyres = "true";
      const featured = row.querySelector(":scope > a.featured");
      row.insertBefore(tyres, featured || null);
    }

    return true;
  }

  const run = () => {
    if (sync()) return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (sync() || attempts >= 20) clearInterval(timer);
    }, 100);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once:true });
  else run();

  const observer = new MutationObserver(() => sync());
  observer.observe(document.documentElement, { childList:true, subtree:true });
  setTimeout(() => observer.disconnect(), 5000);
})();
