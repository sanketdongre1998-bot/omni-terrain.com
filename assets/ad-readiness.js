(() => {
  "use strict";
  if (window.__OMNI_AD_READINESS__) return;
  window.__OMNI_AD_READINESS__ = true;

  const GOOGLE_ADS_ID = "AW-18417309188";
  const KEY = "omniTerrainAdAttribution";
  const PARAMS = ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","gclid","gbraid","wbraid","gad_source"];

  function ensureGoogleAdsTag() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
    if (window.__OMNI_GOOGLE_ADS_CONFIGURED__) return;
    window.__OMNI_GOOGLE_ADS_CONFIGURED__ = true;

    if (!document.querySelector("script[data-omni-google-ads]")) {
      const tag = document.createElement("script");
      tag.async = true;
      tag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GOOGLE_ADS_ID)}`;
      tag.dataset.omniGoogleAds = "1";
      document.head.appendChild(tag);
    }

    window.gtag("js", new Date());
    window.gtag("config", GOOGLE_ADS_ID);
  }

  ensureGoogleAdsTag();

  const now = Date.now();
  const params = new URLSearchParams(location.search);
  const current = {};
  for (const key of PARAMS) {
    const value = String(params.get(key) || "").trim();
    if (value) current[key] = value.slice(0, 500);
  }

  let previous = {};
  try { previous = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (_) {}
  const previousLast = previous && typeof previous.last === "object" ? previous.last : {};
  const first = previous && typeof previous.first === "object" && Object.keys(previous.first).length ? previous.first : current;
  const last = Object.keys(current).length ? current : previousLast;
  const attribution = { first, last, updated_at: now };
  try { localStorage.setItem(KEY, JSON.stringify(attribution)); } catch (_) {}
  window.OMNI_AD_ATTRIBUTION = attribution;

  window.dataLayer = window.dataLayer || [];
  if (Object.keys(current).length) {
    window.dataLayer.push({
      event: "landing_attribution",
      traffic_attribution: current,
      landing_page: location.pathname,
    });
  }

  function scrubCatalogueCounts() {
    document.querySelectorAll(".home-proof b").forEach(node => {
      const text = String(node.textContent || "").trim();
      if (/^\d[\d,]*\+?$/.test(text)) node.textContent = "Specialist range";
    });

    const stats = document.querySelectorAll(".stats .stat");
    const replacements = [
      ["Specialist", "curated product range"],
      ["Auto", "parts & towing"],
      ["Marine", "parts & equipment"],
      ["RV", "travel & overlanding"],
    ];
    stats.forEach((stat, index) => {
      const bold = stat.querySelector("b");
      const label = stat.querySelector("span");
      if (!bold || !/^\d[\d,]*\+?$/.test(String(bold.textContent || "").trim())) return;
      const replacement = replacements[index] || ["Specialist", "product range"];
      bold.textContent = replacement[0];
      if (label) label.textContent = replacement[1];
    });

    document.querySelectorAll(".category-card small").forEach(node => {
      if (/^\s*\d[\d,]*\s+products?\s*$/i.test(String(node.textContent || ""))) {
        node.textContent = "Browse products";
      }
    });

    document.querySelectorAll(".hero p").forEach(node => {
      const text = String(node.textContent || "").trim();
      if (/^\d[\d,]*\s+products?\.\s*page\s+\d+\s+of\s+\d+\.?$/i.test(text)) {
        node.textContent = "Browse specialist products and product details.";
      }
    });

    document.querySelectorAll(".section-head .muted").forEach(node => {
      if (/products?\s+\d+[–-]\d+\s+of\s+\d+/i.test(String(node.textContent || ""))) {
        node.textContent = "Browse available products";
      }
    });

    document.querySelectorAll('script[type="application/ld+json"]').forEach(node => {
      try {
        const data = JSON.parse(node.textContent || "{}");
        let changed = false;
        const strip = item => {
          if (!item || typeof item !== "object") return;
          if (Object.prototype.hasOwnProperty.call(item, "numberOfItems")) {
            delete item.numberOfItems;
            changed = true;
          }
          if (Array.isArray(item["@graph"])) item["@graph"].forEach(strip);
        };
        strip(data);
        if (changed) node.textContent = JSON.stringify(data);
      } catch (_) {}
    });
  }

  function retailCopy() {
    document.querySelectorAll(".ot-growth-banner p").forEach(node => {
      if (/checkout-ready|canonical online pricing|seven featured/i.test(node.textContent || "")) {
        node.textContent = "Shop featured automotive offers with free standard shipping in the contiguous U.S. and secure online checkout.";
      }
    });
    document.querySelectorAll(".ot-growth-benefits span").forEach(node => {
      const text = String(node.textContent || "").trim();
      if (/canonical online pricing/i.test(text)) node.textContent = "Clear online pricing";
      if (/secure stripe checkout/i.test(text)) node.textContent = "Secure online checkout";
    });
    scrubCatalogueCounts();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", retailCopy, { once: true });
  else retailCopy();
  if ("MutationObserver" in window) {
    const observer = new MutationObserver(retailCopy);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 8000);
  }
})();