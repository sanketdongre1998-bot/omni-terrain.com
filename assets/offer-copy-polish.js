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

  function injectStyles() {
    if (document.getElementById("otOfferPolishStyles")) return;
    const style = document.createElement("style");
    style.id = "otOfferPolishStyles";
    style.textContent = `
      .ot-deal-badge{
        left:14px!important;top:14px!important;display:inline-flex!important;align-items:center!important;
        min-height:30px!important;padding:0 11px!important;border:1px solid rgba(7,26,48,.12)!important;
        border-radius:8px!important;background:#f2bd22!important;color:#071a30!important;
        box-shadow:0 4px 12px rgba(7,26,48,.12)!important;
        font:800 10px/1 Manrope,sans-serif!important;letter-spacing:.035em!important;text-transform:uppercase!important;
        white-space:nowrap!important;text-rendering:geometricPrecision;-webkit-font-smoothing:antialiased
      }
      .ot-deal-badge-free{
        position:absolute;right:14px;top:14px;z-index:2;display:inline-flex;align-items:center;min-height:30px;padding:0 11px;
        border:1px solid rgba(255,255,255,.2);border-radius:8px;background:#071a30;color:#fff;
        box-shadow:0 4px 12px rgba(7,26,48,.14);font:800 10px/1 Manrope,sans-serif;letter-spacing:.025em;text-transform:uppercase;
        white-space:nowrap;text-rendering:geometricPrecision;-webkit-font-smoothing:antialiased
      }
      .ot-deal-today small{font:800 9px/1.3 Manrope,sans-serif!important;letter-spacing:.045em!important}
      .ot-offer-shipping-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:4px;padding-top:9px;border-top:1px solid #e9edf0;color:#65717d;font-size:10px;font-weight:750}
      .ot-offer-shipping-row strong{color:#167047;font-size:12px;font-weight:900}
      .ot-offer-coupon-note{margin-top:2px;color:#6c7782;font-size:9.5px;line-height:1.45;font-weight:650}
      .ot-deals-savings-guide{display:flex;align-items:center;justify-content:space-between;gap:18px;margin:18px 0 0;padding:13px 15px;border:1px solid #dfd0ab;border-radius:12px;background:#fff9ec;color:#4f4324;box-shadow:0 5px 18px rgba(7,26,48,.04)}
      .ot-deals-savings-guide>strong{flex:0 0 auto;color:#071a30;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}
      .ot-deals-savings-guide span{font-size:10.5px;line-height:1.5}
      .ot-deals-savings-guide b{color:#071a30}.ot-deals-savings-guide .ot-save-five{color:#167047;font-weight:900}.ot-deals-savings-guide code{padding:2px 6px;border-radius:5px;background:#071a30;color:#fff;font:800 10px/1.3 "DM Mono",monospace}
      html[data-ot-theme="dark"] .ot-offer-shipping-row{border-top-color:rgba(255,255,255,.12);color:#aab8c5}
      html[data-ot-theme="dark"] .ot-offer-coupon-note{color:#aab8c5}
      html[data-ot-theme="dark"] .ot-deals-savings-guide{border-color:#66582e;background:#211f18;color:#d8cfb3}
      html[data-ot-theme="dark"] .ot-deals-savings-guide>strong,html[data-ot-theme="dark"] .ot-deals-savings-guide b{color:#f3f6fa}
      @media(max-width:720px){.ot-deal-badge,.ot-deal-badge-free{min-height:28px!important;padding:0 9px!important;font-size:9px!important}.ot-deals-savings-guide{align-items:flex-start;flex-direction:column;gap:5px}.ot-deal-badge-free{right:10px;top:10px}.ot-deal-badge{left:10px!important;top:10px!important}}
    `;
    document.head.appendChild(style);
  }

  function mountSavingsGuide() {
    const root = document.getElementById("otDealsGrid");
    if (!root || document.querySelector(".ot-deals-savings-guide")) return;
    const guide = document.createElement("div");
    guide.className = "ot-deals-savings-guide";
    guide.setAttribute("aria-label", "How Omni Terrain offers and coupon savings work");
    guide.innerHTML = '<strong>How savings work</strong><span><b>Featured offers below:</b> standard shipping is <b>$0.00</b>, no code needed, and OMNI5 does not apply. &nbsp; <b>Eligible regular-priced orders $150+:</b> <span class="ot-save-five">SAVE $5</span> with code <code>OMNI5</code>.</span>';
    root.insertAdjacentElement("beforebegin", guide);
  }

  function polish() {
    injectStyles();
    mountSavingsGuide();

    document.querySelectorAll(".ot-deal-card").forEach(card => {
      remove(card.querySelector(".ot-deal-value"));
      remove(card.querySelector(".ot-deal-saving"));

      const media = card.querySelector(".ot-deal-media");
      const badge = card.querySelector(".ot-deal-badge");
      setText(badge, "Featured Offer");
      if (media && !media.querySelector(".ot-deal-badge-free")) {
        const free = document.createElement("span");
        free.className = "ot-deal-badge-free";
        free.textContent = "Free Shipping";
        media.appendChild(free);
      }

      const price = card.querySelector(".ot-deal-price");
      setText(card.querySelector(".ot-deal-today small"), "Featured offer price");
      if (price && !price.querySelector(".ot-offer-shipping-row")) {
        const shipping = document.createElement("div");
        shipping.className = "ot-offer-shipping-row";
        shipping.innerHTML = "<span>Standard shipping</span><strong>$0.00</strong>";
        price.appendChild(shipping);
      }
      if (price && !price.querySelector(".ot-offer-coupon-note")) {
        const note = document.createElement("div");
        note.className = "ot-offer-coupon-note";
        note.textContent = "Offer applied automatically · No code needed · OMNI5 not applicable";
        price.appendChild(note);
      }
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
        setText(shipping.querySelector("strong"), "$0.00");
      }
    });

    const dealsHero = document.querySelector(".ot-deals-hero p, .deals-hero p");
    if (dealsHero && /delivered value|save on seven|shipping you avoid/i.test(dealsHero.textContent || "")) {
      dealsHero.textContent = "Shop seven featured Omni Terrain offers with current online pricing, free standard US shipping and secure checkout.";
    }
    document.querySelectorAll(".ot-deals-note,.ot-deal-disclaimer").forEach(node => {
      if (/delivered value|shipping you avoid|regular delivered price/i.test(node.textContent || "")) {
        node.textContent = "Prices shown are current Omni Terrain featured offer prices. Standard US shipping is $0.00 on featured offers; tax is calculated if applicable. OMNI5 applies only to eligible regular-priced orders of $150+.";
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", polish, { once: true });
  else polish();

  const root = document.getElementById("otDealsGrid") || document.querySelector("main");
  if (root && "MutationObserver" in window) {
    let timer = 0;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = window.setTimeout(polish, 30);
    });
    observer.observe(root, { childList: true, subtree: true });
    window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
  }
})();