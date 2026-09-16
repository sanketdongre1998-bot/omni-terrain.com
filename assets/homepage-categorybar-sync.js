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

  function setText(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
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
      setText(button, index === 0 ? "Auto Parts" : "Marine");
      button.setAttribute("aria-haspopup", "true");
      const menu = item.querySelector(":scope > .ot-ref-menu");
      if (menu) menu.classList.add("ot-home-master-dropdown");
    });

    [...row.querySelectorAll(":scope > a")].forEach(anchor => {
      const label = cleanLabel(anchor.textContent);
      setText(anchor, label);
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

  function run() {
    if (sync()) return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (sync() || attempts >= 30) clearInterval(timer);
    }, 100);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once:true });
  else run();

  /* Reference storefront renders asynchronously. Use a few bounded retries only;
     never observe the whole DOM here because text normalization itself is a mutation. */
  [250, 600, 1200, 2200].forEach(delay => setTimeout(sync, delay));
})();
