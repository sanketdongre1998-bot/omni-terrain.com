import { corsHeaders, json } from "../lib/cors.mjs";
import { getCommerceReadyUsProducts } from "../lib/us-checkout-products.mjs";
import { stripeUsSecret } from "../lib/stripe-us-api.mjs";

function stripeConfigured() {
  try {
    return stripeUsSecret().startsWith("sk_");
  } catch (_) {
    return false;
  }
}

export function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export function GET(request) {
  return json({
    ok: true,
    store: "us",
    currency: "USD",
    stripeConfigured: stripeConfigured(),
    commerceReadyProducts: getCommerceReadyUsProducts().length,
  }, 200, request);
}
