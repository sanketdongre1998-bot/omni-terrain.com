(() => {
  "use strict";
  const file = decodeURIComponent(String(location.pathname || "").split("/").filter(Boolean).pop() || "").toLowerCase();
  if (file !== "us-catalogue.html" || window.__OMNI_CATALOGUE_WIDE__) return;
  window.__OMNI_CATALOGUE_WIDE__ = true;

  const SOURCES = [
    { url: "/automotive.html", take: 24, label: "Auto Parts" },
    { url: "/marine.html", take: 12, label: "Marine" },
    { url: "/rv.html", take: 12, label: "RV & Overlanding" }
  ];

  async function cardsFrom(source) {
    try {
      const response = await fetch(source.url, { cache: "force-cache" });
      if (!response.ok) return [];
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      return [...doc.querySelectorAll("main .grid .card")].slice(0, source.take).map(card => {
        const clone = card.cloneNode(true);
        clone.dataset.otCatalogueSource = source.label;
        clone.querySelectorAll("script").forEach(node => node.remove());
        const status = clone.querySelector(".status");
        if (status && /check availability/i.test(status.textContent || "")) status.textContent = "Catalogue item";
        return clone;
      });
    } catch (_) {
      return [];
    }
  }

  function addBrowseRail(section) {
    if (!section || section.querySelector(".ot-wide-browse-rail")) return;
    const rail = document.createElement("div");
    rail.className = "ot-wide-browse-rail";
    rail.style.cssText = "display:flex;flex-wrap:wrap;gap:9px;margin-top:18px";
    rail.innerHTML = '<a class="card-link" href="automotive.html">Browse all Auto Parts →</a><a class="card-link" href="marine.html">Browse Marine →</a><a class="card-link" href="rv.html">Browse RV &amp; Overlanding →</a>';
    section.querySelector(".grid")?.insertAdjacentElement("afterend", rail);
  }

  async function mount() {
    const sections = [...document.querySelectorAll("main > .section")];
    const section = sections[1];
    const grid = section?.querySelector(".grid");
    if (!section || !grid || grid.dataset.otWideReady === "1") return;
    grid.dataset.otWideReady = "1";

    const head = section.querySelector(".section-head");
    if (head) head.innerHTML = '<div><div class="kicker">Wider US catalogue</div><h2>Explore more across the store.</h2></div><p class="cp-section-copy">Browse a broader mix of automotive, marine and RV products. Checkout is enabled only where current pricing and authorization are verified.</p>';

    const groups = await Promise.all(SOURCES.map(cardsFrom));
    const cards = groups.flat();
    if (cards.length >= 24) {
      grid.replaceChildren(...cards);
      grid.querySelectorAll("img").forEach((img, index) => {
        img.loading = index < 4 ? "eager" : "lazy";
        img.decoding = "async";
        try { img.fetchPriority = index < 2 ? "high" : "low"; } catch (_) {}
      });
    }
    addBrowseRail(section);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();