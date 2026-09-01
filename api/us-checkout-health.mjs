import { corsHeaders, json } from "../lib/cors.mjs";
import { getCommerceReadyUsProductCount } from "../lib/us-checkout-products.mjs";
import { stripeUsSecret } from "../lib/stripe-us-api.mjs";

const FEATURED_DEALS = 7;
const PROMOTION_CODE = "OMNI5";

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

export async function GET(request) {
  try {
    const commerceReadyProducts = await getCommerceReadyUsProductCount();
    return json({
      ok: true,
      store: "us",
      currency: "USD",
      stripeConfigured: stripeConfigured(),
      catalogueSource: "omni-terrain.com",
      checkoutMode: "authorization-gated",
      commerceReadyProducts,
      featuredDeals: FEATURED_DEALS,
      promotionCode: PROMOTION_CODE,
      promotionRule: "$5 off eligible regular-priced orders of $150+; featured deals excluded",
    }, 200, request);
  } catch (error) {
    console.error("US checkout health error", error?.message || error);
    return json({
      ok: false,
      store: "us",
      currency: "USD",
      stripeConfigured: stripeConfigured(),
      checkoutMode: "authorization-gated",
      commerceReadyProducts: 0,
      featuredDeals: FEATURED_DEALS,
      promotionCode: PROMOTION_CODE,
      error: "US checkout catalogue is temporarily unavailable.",
    }, 503, request);
  }
}
