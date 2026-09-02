(() => {
  "use strict";
  if (window.__OMNI_US_LAUNCH_OFFERS_INSTALLED__) return;
  window.__OMNI_US_LAUNCH_OFFERS_INSTALLED__ = true;

  // Featured offers are merchandising metadata only. Product price always comes
  // from the authorization registry / canonical display-price source.
  const OFFERS = {
    HUS81147: { label: "Deal Unlocked", shippingIncluded: true, slug: "us-husky-towing-81147.html" },
    HUS81148: { label: "Deal Unlocked", shippingIncluded: true, slug: "us-husky-towing-81148.html" },
    CCIN9010F: { label: "Deal Unlocked", shippingIncluded: true, slug: "us-coast2coast-iwcn9010f.html" },
    CCIN8010F: { label: "Deal Unlocked", shippingIncluded: true, slug: "us-coast2coast-iwcn8010f.html" },
    CCIIMP103X: { label: "Deal Unlocked", shippingIncluded: true, slug: "us-coast2coast-iwcimp103x.html" },
    A1360828HD: { label: "Deal Unlocked", shippingIncluded: true, slug: "us-air-lift-60828hd.html" },
    B5224066464: { label: "Deal Unlocked", shippingIncluded: true, slug: "us-bilstein-24-066464.html" }
  };
  window.OMNI_US_LAUNCH_OFFERS = OFFERS;

  function currentOffer() {
    const page = decodeURIComponent(String(location.pathname || "").split("/").filter(Boolean).pop() || "").toLowerCase();
    return Object.values(OFFERS).find(offer => String(offer.slug || "").toLowerCase() === page) || null;
  }

  function decorateOfferPage() {
    const offer = currentOffer();
    if (!offer) return;
    const box = document.querySelector(".ot-live-buybox");
    if (!box || box.dataset.otLaunchDecorated) return;
    box.dataset.otLaunchDecorated = "1";

    if (!document.getElementById("otLaunchOfferStyles")) {
      const style = document.createElement("style");
      style.id = "otLaunchOfferStyles";
      style.textContent = `
        .ot-launch-ribbon{display:inline-flex;align-items:center;min-height:34px;padding:8px 13px;margin-bottom:11px;border-radius:999px;background:linear-gradient(135deg,#ffd944,#f2b918);color:#071a30;box-shadow:0 8px 22px rgba(185,128,0,.24);font-size:10px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}
        .ot-launch-ribbon:before{content:"★";margin-right:7px;font-size:12px}
        .ot-live-buybox[data-ot-launch-deal="1"]{border:2px solid #e0b229;box-shadow:0 18px 42px rgba(7,26,48,.13)}
      `;
      document.head.appendChild(style);
    }

    box.dataset.otLaunchDeal = "1";
    const label = box.querySelector(".ot-live-label");
    if (label) label.textContent = "Today's featured deal price";
    if (!box.querySelector(".ot-launch-ribbon")) {
      const ribbon = document.createElement("div");
      ribbon.className = "ot-launch-ribbon";
      ribbon.textContent = offer.label;
      box.insertBefore(ribbon, label || box.firstChild);
    }
    const saving = box.querySelector(".ot-live-breakdown-row.saving span");
    if (saving) saving.textContent = "You save — free standard shipping";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", decorateOfferPage, { once: true });
  else decorateOfferPage();

  if ("MutationObserver" in window) {
    const observer = new MutationObserver(decorateOfferPage);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
  }
})();