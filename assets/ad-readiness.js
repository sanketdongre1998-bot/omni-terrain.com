(() => {
  "use strict";
  if (window.__OMNI_AD_READINESS__) return;
  window.__OMNI_AD_READINESS__ = true;

  const KEY = "omniTerrainAdAttribution";
  const PARAMS = ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","gclid","gbraid","wbraid","gad_source"];
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

  function retailCopy() {
    document.querySelectorAll(".ot-growth-banner p").forEach(node => {
      if (/checkout-ready|canonical online pricing/i.test(node.textContent || "")) {
        node.textContent = "Shop seven featured automotive offers with free standard shipping in the contiguous U.S. and secure online checkout.";
      }
    });
    document.querySelectorAll(".ot-growth-benefits span").forEach(node => {
      const text = String(node.textContent || "").trim();
      if (/canonical online pricing/i.test(text)) node.textContent = "Clear online pricing";
      if (/secure stripe checkout/i.test(text)) node.textContent = "Secure online checkout";
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", retailCopy, { once: true });
  else retailCopy();
  if ("MutationObserver" in window) {
    const observer = new MutationObserver(retailCopy);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 8000);
  }
})();