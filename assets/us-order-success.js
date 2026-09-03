(() => {
  "use strict";
  const API = "https://omni-terrain-uk-checkout.vercel.app";
  const CART_KEY = "omniTerrainUsCart";
  const PURCHASE_KEY = "omniTerrainTrackedPurchases";
  const ATTR_KEY = "omniTerrainAdAttribution";
  const GOOGLE_ADS_ID = "AW-18417309188";
  const GOOGLE_ADS_PURCHASE_SEND_TO = "AW-18417309188/wzqWCOGU1-0cElSsh85E";
  const PURCHASE_TTL_MS = 90 * 24 * 60 * 60 * 1000;
  const params = new URLSearchParams(location.search);
  const sessionId = params.get("session_id") || "";
  const status = document.getElementById("otOrderVerification");
  const title = document.getElementById("otOrderTitle");
  const copy = document.getElementById("otOrderCopy");
  const meta = document.getElementById("otOrderMeta");

  const money = cents => new Intl.NumberFormat("en-US", {style:"currency",currency:"USD"}).format((Number(cents)||0)/100);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const attribution = () => { try { return JSON.parse(localStorage.getItem(ATTR_KEY) || "{}"); } catch (_) { return {}; } };

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

  function purchaseLedger() {
    const now = Date.now();
    let ledger = {};
    try {
      const parsed = JSON.parse(localStorage.getItem(PURCHASE_KEY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) ledger = parsed;
    } catch (_) {}
    for (const [id, trackedAt] of Object.entries(ledger)) {
      if (!Number(trackedAt) || now - Number(trackedAt) > PURCHASE_TTL_MS) delete ledger[id];
    }
    return ledger;
  }

  function trackedPurchase(data) {
    if (!data?.id) return;
    const ledger = purchaseLedger();
    if (ledger[data.id]) return;

    const items = String(data.cart || "").split(",").map(token => {
      const [id, qty] = token.split(":");
      return id ? { item_id: id, quantity: Math.max(1, Number(qty) || 1) } : null;
    }).filter(Boolean);

    const orderValue = Number(data.amount_total || 0) / 100;
    const orderCurrency = String(data.currency || "usd").toUpperCase();

    ledger[data.id] = Date.now();
    try { localStorage.setItem(PURCHASE_KEY, JSON.stringify(ledger)); } catch (_) {}

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: "purchase",
      ecommerce: {
        transaction_id: data.id,
        affiliation: "Omni Terrain US",
        value: orderValue,
        currency: orderCurrency,
        coupon: data.promotion_code || undefined,
        items,
      },
      promotion_savings: Number(data.promotion_savings_cents || 0) / 100,
      traffic_attribution: attribution().last || {},
    });

    ensureGoogleAdsTag();
    window.gtag("event", "conversion", {
      send_to: GOOGLE_ADS_PURCHASE_SEND_TO,
      value: orderValue,
      currency: orderCurrency,
      transaction_id: data.id,
    });
  }

  async function verify() {
    if (!/^cs_(test_|live_)?[A-Za-z0-9_]+$/.test(sessionId)) {
      title.textContent = "Order verification needed";
      copy.textContent = "We could not find a valid payment session in this link. If you completed payment, contact Omni Terrain support with the email used at checkout.";
      status.textContent = "Payment status unavailable";
      status.className = "ot-order-status error";
      return;
    }

    status.textContent = "Verifying secure payment…";
    try {
      const response = await fetch(`${API}/api/us-session-status?session_id=${encodeURIComponent(sessionId)}`, {cache:"no-store"});
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to verify payment.");

      if (!data.paid) {
        title.textContent = "Payment not completed";
        copy.textContent = "This checkout session is not marked paid yet. Your cart has been kept so you can try again.";
        status.textContent = `Stripe status: ${data.payment_status || data.status || "pending"}`;
        status.className = "ot-order-status warning";
        return;
      }

      trackedPurchase(data);
      localStorage.removeItem(CART_KEY);
      localStorage.removeItem("omniTerrainUsCoupon");
      document.querySelectorAll("[data-cart-count]").forEach(node => { node.textContent = "0"; });
      title.textContent = "Thank you for your order";
      copy.textContent = "Your secure payment is confirmed. Omni Terrain will send order and fulfilment updates to the email used at checkout.";
      status.textContent = "Payment confirmed";
      status.className = "ot-order-status success";
      meta.innerHTML = `<span>Order ${esc(String(data.id || "").slice(-10))}</span><span>${esc(money(data.amount_total))}</span>${data.promotion_code ? `<span>Promo ${esc(data.promotion_code)}</span>` : ""}${data.customer_email ? `<span>${esc(data.customer_email)}</span>` : ""}`;
    } catch (error) {
      title.textContent = "We’re verifying your order";
      copy.textContent = "Stripe returned you to Omni Terrain, but the payment status could not be confirmed on this attempt. Do not pay again until support confirms the order status.";
      status.textContent = error.message || "Verification temporarily unavailable";
      status.className = "ot-order-status error";
    }
  }

  verify();
})();
