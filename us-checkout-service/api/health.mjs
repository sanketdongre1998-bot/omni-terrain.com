import { corsHeaders, json } from "../lib/http.mjs";
import { readyCount } from "../lib/products.mjs";
import { stripeConfigured } from "../lib/stripe.mjs";

export function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export function GET(request) {
  return json(request, {
    ok: true,
    store: "us",
    currency: "USD",
    stripeConfigured: stripeConfigured(),
    commerceReadyProducts: readyCount(),
  });
}
