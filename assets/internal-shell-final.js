(() => {
  "use strict";
  if (window.__OMNI_INTERNAL_SHELL_FINAL__) return;
  window.__OMNI_INTERNAL_SHELL_FINAL__ = true;

  const file = decodeURIComponent(String(location.pathname || "/").split("/").filter(Boolean).pop() || "").toLowerCase();
  const isHome = !file || file === "index.html" || file === "uk.html";
  if (isHome) return;

  const exact = (node, value) => {
    if (node && node.textContent !== value) node.textContent = value;
  };

  function installLastMileStyle() {
    let style = document.getElementById("otInternalShellLastMile");
    if (!style) {
      style = document.createElement("style");
      style.id = "otInternalShellLastMile";
      document.head.appendChild(style);
    }
    style.textContent = `
      #otUnifiedHeaderShell .ot-unified-region a.active{
        background:#fff!important;
        color:#0b4e93!important;
      }
      html[lang="en-US"] body.ot-catalogue-premium .cp-hero-copy>p::before,
      html[lang="en-US"] body.ot-catalogue-premium .cp-hero-copy>p::after,
      html[lang="en-US"] body.ot-catalogue-premium .cp-mpn-card>p::before,
      html[lang="en-US"] body.ot-catalogue-premium .cp-mpn-card>p::after{
        content:none!important;
        display:none!important;
      }
      body>.ot-site-mobile-bar,
      body>.mobile-store-bar{
        display:none!important;
      }
    `;
  }

  function removeLegacyOverlays() {
    document.querySelectorAll("body > .ot-site-mobile-bar, body > .mobile-store-bar").forEach(node => node.remove());
  }

  function stabilizeHeader() {
    const root = document.getElementById("otUnifiedHeaderShell");
    if (!root) return false;

    const logo = root.querySelector(".ot-unified-logo img");
    if (logo) {
      const src = "/assets/omni-terrain-subtle-logo.svg?v=4";
      if (logo.getAttribute("src") !== src) logo.setAttribute("src", src);
      logo.setAttribute("width", "340");
      logo.setAttribute("height", "78");
      logo.setAttribute("alt", "Omni Terrain");
      logo.decoding = "async";
      logo.loading = "eager";
    }

    const search = root.querySelector(".ot-unified-search");
    const actions = root.querySelector(".ot-unified-actions");
    if (search) search.style.minWidth = "0";
    if (actions) actions.style.minWidth = "0";

    /* Once the canonical shell exists, legacy first-paint protection is no longer needed. */
    document.documentElement.classList.remove("ot-master-header-pending");
    return true;
  }

  function stabilizeCatalogueCopy() {
    if (file !== "us-catalogue.html") return;
    const hero = document.querySelector(".cp-hero-copy");
    const mpn = document.querySelector(".cp-mpn-card");
    if (!hero) return;

    const primary = [...hero.children].find(node => node.tagName === "P" && !node.classList.contains("cp-hero-subcopy"));
    const secondary = hero.querySelector(".cp-hero-subcopy");
    exact(primary, "Shop specialist automotive, marine and RV products from established brands, with product support and nationwide delivery options.");
    exact(secondary, "Search by brand, MPN or category, with clear pricing and product support before you order.");
    exact(mpn?.querySelector(":scope > p"), "Search by manufacturer part number (MPN) to compare clear product details and get specialist support before you order.");
  }

  function pass() {
    installLastMileStyle();
    removeLegacyOverlays();
    stabilizeHeader();
    stabilizeCatalogueCopy();
  }

  const ready = () => {
    pass();
    [120, 350, 700, 1200, 2000, 3500].forEach(ms => setTimeout(pass, ms));

    /* A few legacy scripts can add UI or update copy after load. Hold the
       canonical internal shell steady during that initialization window. */
    if ("MutationObserver" in window) {
      const target = document.body;
      if (target) {
        let queued = false;
        const observer = new MutationObserver(() => {
          if (queued) return;
          queued = true;
          requestAnimationFrame(() => {
            queued = false;
            removeLegacyOverlays();
            if (file === "us-catalogue.html") stabilizeCatalogueCopy();
          });
        });
        observer.observe(target, { childList: true, subtree: true, characterData: file === "us-catalogue.html" });
        setTimeout(() => observer.disconnect(), 6500);
      }
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready, { once: true });
  else ready();
})();
