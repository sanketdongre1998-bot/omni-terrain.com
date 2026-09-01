(() => {
  "use strict";
  if (window.__OMNI_US_LAUNCH_OFFERS_INSTALLED__) return;
  window.__OMNI_US_LAUNCH_OFFERS_INSTALLED__ = true;

  // Featured offers are merchandising metadata only. Product price always comes
  // from the authorization registry / canonical display-price source.
  const OFFERS = {
    HUS81147: { label: "Featured Offer", shippingIncluded: true, slug: "us-husky-towing-81147.html" },
    HUS81148: { label: "Featured Offer", shippingIncluded: true, slug: "us-husky-towing-81148.html" },
    CCIN9010F: { label: "Featured Offer", shippingIncluded: true, slug: "us-coast2coast-iwcn9010f.html" },
    CCIN8010F: { label: "Featured Offer", shippingIncluded: true, slug: "us-coast2coast-iwcn8010f.html" },
    CCIIMP103X: { label: "Featured Offer", shippingIncluded: true, slug: "us-coast2coast-iwcimp103x.html" },
    A1360828HD: { label: "Featured Offer", shippingIncluded: true, slug: "us-air-lift-60828hd.html" },
    B5224066464: { label: "Featured Offer", shippingIncluded: true, slug: "us-bilstein-24-066464.html" }
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
        .ot-launch-ribbon{display:inline-flex;align-items:center;min-height:30px;padding:7px 10px;margin-bottom:10px;border-radius:999px;background:#fff1bf;color:#5e4300;font-size:10px;font-weight:900;letter-spacing:.06em;text-transform:uppercase}
        .ot-launch-shipping{margin:7px 0 4px;color:#167047;font-size:11px;font-weight:850}
        .ot-live-buybox[data-ot-launch-deal="1"]{border-color:#d7b04c;box-shadow:0 16px 36px rgba(7,26,48,.10)}
      `;
      document.head.appendChild(style);
    }

    box.dataset.otLaunchDeal = "1";
    const label = box.querySelector(".ot-live-label");
    if (label) label.textContent = "Featured online offer";
    if (!box.querySelector(".ot-launch-ribbon")) {
      const ribbon = document.createElement("div");
      ribbon.className = "ot-launch-ribbon";
      ribbon.textContent = offer.label;
      box.insertBefore(ribbon, label || box.firstChild);
    }
    if (!box.querySelector(".ot-launch-shipping")) {
      const price = box.querySelector(".ot-live-price");
      const note = document.createElement("div");
      note.className = "ot-launch-shipping";
      note.textContent = "Free standard shipping in the contiguous U.S.";
      price?.insertAdjacentElement("afterend", note);
    }
    const shipping = box.querySelector(".ot-live-shipping");
    if (shipping) shipping.textContent = "Free standard shipping in the contiguous U.S.";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", decorateOfferPage, { once: true });
  else decorateOfferPage();

  if ("MutationObserver" in window) {
    const observer = new MutationObserver(decorateOfferPage);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
  }
})();