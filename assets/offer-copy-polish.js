(() => {
  "use strict";
  if (window.__OMNI_OFFER_COPY_POLISH__) return;
  window.__OMNI_OFFER_COPY_POLISH__ = true;

  function setText(node, text) {
    if (node && node.textContent !== text) node.textContent = text;
  }

  function remove(node) {
    if (node) node.remove();
  }

  function polish() {
    document.querySelectorAll(".ot-deal-card").forEach(card => {
      remove(card.querySelector(".ot-deal-value"));
      remove(card.querySelector(".ot-deal-saving"));
      setText(card.querySelector(".ot-deal-today small"), "Featured offer price · free standard US shipping");
      setText(card.querySelector(".ot-deal-badge"), "★ Featured Offer · Free Shipping");
    });

    document.querySelectorAll(".live-card").forEach(card => {
      remove(card.querySelector(".live-offer-value"));
      remove(card.querySelector(".live-offer-save"));
      setText(card.querySelector(".live-offer-today small"), "Featured offer price · free standard US shipping");
    });

    document.querySelectorAll(".ot-live-buybox").forEach(box => {
      setText(box.querySelector(".ot-live-label"), box.dataset.otLaunchDeal === "1" ? "Featured offer price" : "Omni Terrain online price");
      const shipping = [...box.querySelectorAll(".ot-live-breakdown-row")].find(row => /standard us shipping/i.test(row.textContent || ""));
      if (shipping) {
        setText(shipping.querySelector("span"), "Standard US shipping");
        setText(shipping.querySelector("strong"), "Included");
      }
    });

    const dealsHero = document.querySelector(".ot-deals-hero p, .deals-hero p");
    if (dealsHero && /delivered value|save on seven|shipping you avoid/i.test(dealsHero.textContent || "")) {
      dealsHero.textContent = "Shop seven featured Omni Terrain offers with current online pricing, free standard US shipping and secure checkout.";
    }
    document.querySelectorAll(".ot-deals-note,.ot-deal-disclaimer").forEach(node => {
      if (/delivered value|shipping you avoid|regular delivered price/i.test(node.textContent || "")) {
        node.textContent = "Prices shown are current Omni Terrain featured offer prices. Standard US shipping is included on featured offers; tax is calculated if applicable.";
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", polish, { once: true });
  else polish();

  const root = document.getElementById("otDealsGrid") || document.querySelector("main");
  if (root && "MutationObserver" in window) {
    const observer = new MutationObserver(polish);
    observer.observe(root, { childList: true, subtree: true });
    window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
  }
})();