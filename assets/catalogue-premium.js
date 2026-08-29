(() => {
  "use strict";
  const file = decodeURIComponent(String(window.location.pathname || "").split("/").filter(Boolean).pop() || "");
  if (file !== "us-catalogue.html") return;
  if (window.__OMNI_CATALOGUE_PREMIUM__) return;
  window.__OMNI_CATALOGUE_PREMIUM__ = true;

  function addCss() {
    if (!document.querySelector('link[href*="catalogue-premium.css"]')) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "/assets/catalogue-premium.css?v=1";
      document.head.appendChild(css);
    }
    if (!document.querySelector('link[href*="fonts.googleapis.com"][href*="Barlow"]')) {
      const font = document.createElement("link");
      font.rel = "stylesheet";
      font.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=DM+Mono:wght@400;500&family=Manrope:wght@500;600;700;800&display=swap";
      document.head.appendChild(font);
    }
  }

  function upgradeHero() {
    const hero = document.querySelector("main > .hero");
    const container = hero?.querySelector(":scope > .container");
    if (!hero || !container) return;
    container.innerHTML = `
      <div class="cp-hero-grid">
        <div><div class="cp-kicker">Omni Terrain / US Catalogue</div><h1>Specialist depth.<br><em>One focused store.</em></h1><p>Browse automotive, marine and RV equipment with clear manufacturer part numbers, visible customer pricing and specialist product support. Automotive is our deepest department, backed by focused marine and travel ranges.</p><div class="cp-hero-actions"><a href="automotive.html">Shop Auto Parts →</a><a href="marine.html">Marine</a><a href="rv.html">RV &amp; Overlanding</a></div></div>
        <div class="cp-hero-panel"><strong>300+</strong><b>specialist products to explore</b><span>A broad catalogue organized around real applications, established brands and clear product data.</span></div>
      </div>
      <div class="cp-stats"><div class="cp-stat"><b>Auto first</b><span>Our deepest department</span></div><div class="cp-stat"><b>Marine</b><span>Focused equipment range</span></div><div class="cp-stat"><b>RV</b><span>Travel &amp; overlanding</span></div><div class="cp-stat"><b>US + UK</b><span>Regional storefronts</span></div></div>`;
  }

  function upgradeDepartments() {
    const sections = [...document.querySelectorAll("main > .section")];
    const section = sections[0];
    if (!section) return;
    const head = section.querySelector(".section-head");
    if (head) head.innerHTML = `<div><div class="kicker">Shop by department</div><h2>Start with the terrain.</h2></div><p class="cp-section-copy">Three focused departments keep the catalogue easy to navigate before deeper filters are applied.</p>`;
    const cards = [...section.querySelectorAll(".category-card")];
    if (cards[0]) cards[0].querySelector("small") && (cards[0].querySelector("small").textContent = "01 / PRIMARY · DEEPEST RANGE");
    if (cards[1]) cards[1].querySelector("small") && (cards[1].querySelector("small").textContent = "02 / MARINE · SPECIALIST RANGE");
    if (cards[2]) cards[2].querySelector("small") && (cards[2].querySelector("small").textContent = "03 / TRAVEL · CURATED RANGE");

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
    if (head) head.innerHTML = `<div><div class="kicker">Catalogue highlights</div><h2>Explore established brands.</h2></div><p class="cp-section-copy">A selection from the wider US catalogue. Product pages keep the brand, MPN and current customer-facing price easy to verify.</p>`;
    const grid = section.querySelector(".grid");
    if (grid && !section.querySelector(".cp-catalogue-note")) {
      const note = document.createElement("div");
      note.className = "cp-catalogue-note";
      note.innerHTML = '<span>Need something specific? Browse a department or use the product MPN when contacting support.</span><a href="contact-and-order-help.html">Product help →</a>';
      grid.insertAdjacentElement("afterend", note);
    }
  }

  function cleanCards() {
    document.querySelectorAll(".card .status").forEach((node) => {
      if (/check availability/i.test(node.textContent || "")) node.textContent = "Catalogue item";
    });
  }

  function mount() {
    addCss();
    document.body.classList.add("ot-catalogue-premium");
    upgradeHero();
    upgradeDepartments();
    upgradeProducts();
    cleanCards();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();
