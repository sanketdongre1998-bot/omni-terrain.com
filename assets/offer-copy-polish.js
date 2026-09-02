(() => {
  "use strict";
  if (window.__OMNI_OFFER_COPY_POLISH__) return;
  window.__OMNI_OFFER_COPY_POLISH__ = true;

  function setText(node, text) {
    if (node && node.textContent !== text) node.textContent = text;
  }

  function polish() {
    document.querySelectorAll(".ot-deal-card").forEach(card => {
      setText(card.querySelector(".ot-deal-value span:first-child"), "Was · regular delivered price");
      setText(card.querySelector(".ot-deal-saving span:first-child"), "You save · free shipping");
      setText(card.querySelector(".ot-deal-today small"), "Now · your deal price");
    });

    document.querySelectorAll(".live-card").forEach(card => {
      setText(card.querySelector(".live-offer-value span:first-child"), "Was · regular delivered price");
      setText(card.querySelector(".live-offer-save span:first-child"), "You save · free shipping");
      setText(card.querySelector(".live-offer-today small"), "Now · your deal price");
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