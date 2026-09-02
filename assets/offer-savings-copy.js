(() => {
  "use strict";
  if (window.__OMNI_OFFER_SAVINGS_COPY__) return;
  window.__OMNI_OFFER_SAVINGS_COPY__ = true;

  const injectStyles = () => {
    if (document.getElementById("otOfferSavingsCopyStyles")) return;
    const style = document.createElement("style");
    style.id = "otOfferSavingsCopyStyles";
    style.textContent = `
      .ot-growth-code{gap:6px!important;background:rgba(224,189,114,.10)!important;border-color:rgba(224,189,114,.44)!important}
      .ot-growth-code .ot-save-head{color:#f4c94f;font-weight:950;letter-spacing:.035em}
      .ot-growth-code .ot-save-detail{color:#fff;font-weight:800}
      .ot-growth-code .ot-save-code{display:inline-flex;align-items:center;padding:3px 7px;border-radius:6px;background:#f2bd22;color:#071a30!important;font-weight:950;letter-spacing:.07em}
      .ot-promo-box .ot-save-headline{color:#167047!important;font-size:15px!important;font-weight:950!important}
      .ot-promo-box .ot-save-example{color:#071a30!important;font-size:12px!important;font-weight:800!important}
      .ot-checkout-promo .ot-save-headline{color:#167047;font-weight:950}
      html[data-ot-theme="dark"] .ot-promo-box .ot-save-example{color:#f3f6fa!important}
    `;
    document.head.appendChild(style);
  };

  const apply = () => {
    injectStyles();

    document.querySelectorAll(".ot-growth-code").forEach(node => {
      if (node.dataset.otSavingsReady === "1") return;
      node.dataset.otSavingsReady = "1";
      node.innerHTML = '<span class="ot-save-head">SAVE $5 TODAY</span><span class="ot-save-detail">Spend $150, pay $145 · Use code</span><strong class="ot-save-code">OMNI5</strong>';
    });

    document.querySelectorAll(".ot-promo-box").forEach(box => {
      const heading = box.querySelector("strong");
      const copy = box.querySelector("p");
      if (heading) {
        heading.classList.add("ot-save-headline");
        heading.textContent = "SAVE $5 TODAY — USE OMNI5";
      }
      if (copy) {
        copy.classList.add("ot-save-example");
        copy.textContent = "Spend $150, pay $145 on eligible regular-priced items. Enter OMNI5 at checkout.";
      }
    });

    document.querySelectorAll(".ot-checkout-promo").forEach(box => {
      if (box.dataset.otSavingsReady === "1") return;
      box.dataset.otSavingsReady = "1";
      box.innerHTML = '<span class="ot-save-headline">SAVE $5 TODAY:</span> Spend $150, pay $145 on eligible regular-priced items with code <strong>OMNI5</strong>.';
    });

    document.querySelectorAll(".ot-deals-savings-guide").forEach(guide => {
      guide.innerHTML = '<strong>SAVE $5 TODAY</strong><span><b>Spend $150, pay $145</b> on eligible regular-priced items with code <code>OMNI5</code>. Featured offers below already include free standard shipping and do not stack with OMNI5.</span>';
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply, { once: true });
  else apply();

  if ("MutationObserver" in window) {
    let timer = 0;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = window.setTimeout(apply, 60);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
    window.setTimeout(() => observer.disconnect(), 12000);
  }
})();