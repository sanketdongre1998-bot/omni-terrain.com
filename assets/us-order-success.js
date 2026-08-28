(() => {
  "use strict";
  const API = "https://omni-terrain-uk-checkout.vercel.app";
  const CART_KEY = "omniTerrainUsCart";
  const params = new URLSearchParams(location.search);
  const sessionId = params.get("session_id") || "";
  const status = document.getElementById("otOrderVerification");
  const title = document.getElementById("otOrderTitle");
  const copy = document.getElementById("otOrderCopy");
  const meta = document.getElementById("otOrderMeta");

  const money = cents => new Intl.NumberFormat("en-US", {style:"currency",currency:"USD"}).format((Number(cents)||0)/100);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));

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

      localStorage.removeItem(CART_KEY);
      document.querySelectorAll("[data-cart-count]").forEach(node => { node.textContent = "0"; });
      title.textContent = "Thank you for your order";
      copy.textContent = "Your secure payment is confirmed. Omni Terrain will send order and fulfilment updates to the email used at checkout.";
      status.textContent = "Payment confirmed";
      status.className = "ot-order-status success";
      meta.innerHTML = `<span>Order ${esc(String(data.id || "").slice(-10))}</span><span>${esc(money(data.amount_total))}</span>${data.customer_email ? `<span>${esc(data.customer_email)}</span>` : ""}`;
    } catch (error) {
      title.textContent = "We’re verifying your order";
      copy.textContent = "Stripe returned you to Omni Terrain, but the payment status could not be confirmed on this attempt. Do not pay again until support confirms the order status.";
      status.textContent = error.message || "Verification temporarily unavailable";
      status.className = "ot-order-status error";
    }
  }

  verify();
})();
