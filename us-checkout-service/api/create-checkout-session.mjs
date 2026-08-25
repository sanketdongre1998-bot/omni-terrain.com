import { corsHeaders, json, originAllowed } from "../lib/http.mjs";
import { resolveItems } from "../lib/products.mjs";
import { stripePost } from "../lib/stripe.mjs";

const SITE = "https://omni-terrain.com";

export function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function POST(request) {
  if (!originAllowed(request)) return json(request, { error: "Origin not allowed." }, 403);

  try {
    const body = await request.json();
    const rows = resolveItems(body?.items);
    const params = new URLSearchParams();

    params.set("mode", "payment");
    params.set("success_url", `${SITE}/us-order-success.html?session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${SITE}/cart.html?checkout=cancelled`);
    params.set("submit_type", "pay");
    params.set("phone_number_collection[enabled]", "true");
    params.set("shipping_address_collection[allowed_countries][0]", "US");
    params.set("customer_creation", "always");
    params.set("metadata[store]", "us");
    params.set("metadata[source]", "omni-terrain.com");
    params.set("metadata[operator]", "PRASAD INC LTD");
    params.set("metadata[cart]", rows.map(({ product, qty }) => `${product.id}:${qty}`).join(","));
    params.set("payment_intent_data[metadata][store]", "us");
    params.set("payment_intent_data[metadata][source]", "omni-terrain.com");

    rows.forEach(({ product, qty }, index) => {
      const prefix = `line_items[${index}]`;
      params.set(`${prefix}[price_data][currency]`, "usd");
      params.set(`${prefix}[price_data][unit_amount]`, String(product.priceCents));
      params.set(`${prefix}[price_data][product_data][name]`, product.title);
      params.set(`${prefix}[price_data][product_data][description]`, `${product.brand} · MPN ${product.mpn}`);
      params.set(`${prefix}[quantity]`, String(qty));
    });

    params.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
    params.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", "0");
    params.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "usd");
    params.set("shipping_options[0][shipping_rate_data][display_name]", "Free standard shipping");

    if (String(process.env.STRIPE_AUTOMATIC_TAX || "").toLowerCase() === "true") {
      params.set("automatic_tax[enabled]", "true");
    }

    const session = await stripePost("/checkout/sessions", params);
    return json(request, { id: session.id, url: session.url });
  } catch (error) {
    console.error("US checkout session error", error?.message || error);
    const status = error?.status >= 400 && error?.status < 500 ? 400 : 500;
    return json(request, {
      error: status === 400 ? error.message : "Secure checkout is temporarily unavailable.",
    }, status);
  }
}
