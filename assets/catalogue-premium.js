(() => {
  "use strict";
  const file = decodeURIComponent(String(window.location.pathname || "").split("/").filter(Boolean).pop() || "");
  if (file !== "us-catalogue.html") return;
  if (window.__OMNI_CATALOGUE_PREMIUM__) return;
  window.__OMNI_CATALOGUE_PREMIUM__ = true;

  const icon = (kind) => {
    if (kind === "auto") return '<svg viewBox="0 0 24 24" fill="none"><path d="M5 16h14l-1.7-5.2A2 2 0 0 0 15.4 9H8.6a2 2 0 0 0-1.9 1.8L5 16Zm0 0v2m14-2v2M8 18h.01M16 18h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    if (kind === "marine") return '<svg viewBox="0 0 24 24" fill="none"><path d="M4 15h16l-2 4H7l-3-4Zm4 0V8h8v7M10 8V5h4v3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    if (kind === "rv") return '<svg viewBox="0 0 24 24" fill="none"><path d="m3 19 6-11 4 7 2-4 6 8H3Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Zm-3 8 2 2 4-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  };

  function addCss() {
    let css = document.querySelector('link[href*="catalogue-premium.css"]');
    if (!css) {
      css = document.createElement("link");
      css.rel = "stylesheet";
      document.head.appendChild(css);
    }
    css.href = "/assets/catalogue-premium.css?v=3";
    if (!document.querySelector('link[href*="fonts.googleapis.com"][href*="Barlow"]')) {
      const font = document.createElement("link");
      font.rel = "stylesheet";
      font.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=DM+Mono:wght@400;500&family=Manrope:wght@500;600;700;800&display=swap";
      document.head.appendChild(font);
    }
  }

  function sendCatalogueSearch(query) {
    const text = String(query || "").trim();
    if (!text) return;
    try { sessionStorage.setItem("otPendingCatalogueSearch", text); } catch (_) {}
    let tries = 0;
    const apply = () => {
      tries += 1;
      const input = document.querySelector(".ot-catalogue-controls .ot-search-input");
      if (input) {
        input.value = text;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        document.querySelector(".ot-catalogue-controls")?.scrollIntoView({ behavior: "smooth", block: "center" });
        try { sessionStorage.removeItem("otPendingCatalogueSearch"); } catch (_) {}
        return;
      }
      if (tries < 24) setTimeout(apply, 150);
    };
    apply();
  }

  function upgradeHero() {
    const hero = document.querySelector("main > .hero");
    const container = hero?.querySelector(":scope > .container");
    if (!hero || !container) return;
    container.innerHTML = `
      <div class="cp-hero-visual">
        <div class="cp-hero-grid">
          <div class="cp-hero-copy">
            <div class="cp-kicker">Omni Terrain / US Catalogue</div>
            <h1>Specialist depth.<br><em>One focused store.</em></h1>
            <p>Shop specialist automotive, marine and RV products from established brands, with product support and nationwide delivery options.</p>
            <p class="cp-hero-subcopy">Shop automotive, towing, marine and RV parts by brand, MPN and category, with clear pricing and product support when you need it.</p>
            <div class="cp-hero-actions"><a href="/automotive.html">Shop Auto Parts →</a><a href="/marine.html">Marine</a><a href="/rv.html">RV &amp; Overlanding</a></div>
          </div>
          <aside class="cp-mpn-card" aria-label="Search by manufacturer part number">
            <div class="cp-mpn-heading"><span class="cp-mpn-icon"><svg viewBox="0 0 24 24" fill="none"><circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" stroke-width="1.8"/><path d="m15 15 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span><div><strong>MPN</strong><b>Find the right part faster</b></div></div>
            <p>Search by manufacturer part number, compare clear product details and get specialist support before you order.</p>
            <form class="cp-mpn-form"><input type="search" autocomplete="off" aria-label="Manufacturer part number" placeholder="Enter manufacturer part number (MPN)"><button type="submit">Search</button></form>
            <a class="cp-mpn-help" href="/contact-and-order-help.html">Need help finding your MPN? →</a>
          </aside>
        </div>
        <div class="cp-stats">
          <div class="cp-stat"><span class="cp-stat-icon">${icon("auto")}</span><div><b>Auto first</b><span>Our deepest department</span></div></div>
          <div class="cp-stat"><span class="cp-stat-icon">${icon("marine")}</span><div><b>Marine</b><span>Focused equipment range</span></div></div>
          <div class="cp-stat"><span class="cp-stat-icon">${icon("rv")}</span><div><b>RV</b><span>Travel &amp; overlanding</span></div></div>
          <div class="cp-stat"><span class="cp-stat-icon">${icon("shield")}</span><div><b>Verified checkout</b><span>On eligible products</span></div></div>
        </div>
      </div>`;

    container.querySelector(".cp-mpn-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      sendCatalogueSearch(event.currentTarget.querySelector("input")?.value || "");
    });
  }

  function upgradeDepartments() {
    const sections = [...document.querySelectorAll("main > .section")];
    const section = sections[0];
    if (!section) return;
    const head = section.querySelector(".section-head");
    if (head) head.innerHTML = `<div><div class="kicker">Shop by department</div><h2>START WITH THE TERRAIN.</h2></div><p class="cp-section-copy">Three focused departments keep the catalogue easy to navigate before deeper filters are applied.</p>`;
    const cards = [...section.querySelectorAll(".category-card")];
    if (cards[0]?.querySelector("small")) cards[0].querySelector("small").textContent = "AUTO · TRUCK · TOWING";
    if (cards[1]?.querySelector("small")) cards[1].querySelector("small").textContent = "MARINE · ELECTRICAL · NAVIGATION";
    if (cards[2]?.querySelector("small")) cards[2].querySelector("small").textContent = "RV · TRAVEL · OVERLANDING";
    if (!section.querySelector(".cp-brand-rail")) {
      const rail = document.createElement("div");
      rail.className = "cp-brand-rail";
      rail.innerHTML = '<small>Brands across the catalogue</small><b>Fabtech</b><b>Putco</b><b>TrailFX</b><b>Bilstein</b><b>Blue Sea</b><b>Humminbird</b><b>Husky Towing</b><b>K-Source</b><b>Pop & Lock</b>';
      section.querySelector(".category-grid")?.insertAdjacentElement("afterend", rail);
    }
  }

  function upgradeProducts() {
    const sections = [...document.querySelectorAll("main > .section")];
    const section = sections[1];
    if (!section) return;
    const head = section.querySelector(".section-head");
    if (head) head.innerHTML = `<div><div class="kicker">Verified online range</div><h2>Shop current online products.</h2></div><p class="cp-section-copy">Every product shown here has a verified online-selling gate, current orderable status and checkout price. Browse the wider catalogue inside each department.</p>`;
  }

  function cleanCards() {
    document.querySelectorAll(".card .status").forEach((node) => {
      if (/check availability/i.test(node.textContent || "")) node.textContent = "Catalogue item";
    });
  }

  function keepApprovedCopy() {
    const firstHead = document.querySelector("main > .section .section-head h2");
    if (firstHead) firstHead.textContent = "START WITH THE TERRAIN.";
    const heroSub = document.querySelector(".cp-hero-subcopy");
    if (heroSub) heroSub.textContent = "Shop automotive, towing, marine and RV parts by brand, MPN and category, with clear pricing and product support when you need it.";
  }

  function mount() {
    addCss();
    document.body.classList.add("ot-catalogue-premium", "ot-catalogue-approved");
    upgradeHero();
    upgradeDepartments();
    upgradeProducts();
    cleanCards();
    [250, 700, 1400].forEach((ms) => setTimeout(keepApprovedCopy, ms));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();