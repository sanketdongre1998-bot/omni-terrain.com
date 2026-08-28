import { corsHeaders, json, originAllowed } from "../lib/cors.mjs";
import { stripeUsGet } from "../lib/stripe-us-api.mjs";

export function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(request) {
  if (!originAllowed(request)) return json({ error: "Origin not allowed." }, 403, request);

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id") || "";
  if (!/^cs_(test_|live_)?[A-Za-z0-9_]+$/.test(sessionId)) {
    return json({ error: "Invalid Checkout Session." }, 400, request);
  }

  try {
    const session = await stripeUsGet(`/checkout/sessions/${encodeURIComponent(sessionId)}`);
    if (session.metadata?.store !== "us") {
      return json({ error: "This is not a US store Checkout Session." }, 400, request);
    }
    const paid = session.payment_status === "paid" || session.payment_status === "no_payment_required";
    return json({
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      paid,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_details?.email || session.customer_email || null,
      customer_name: session.customer_details?.name || null,
      cart: session.metadata?.cart || null,
    }, 200, request);
  } catch (error) {
    console.error("US checkout status error", error?.message || error);
    return json({ error: "Unable to verify this order right now." }, error?.status === 404 ? 404 : 500, request);
  }
}
