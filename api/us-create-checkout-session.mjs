import { corsHeaders, json, originAllowed } from "../lib/cors.mjs";
import { resolveUsCheckoutItems } from "../lib/us-checkout-products.mjs";
import { stripeUsPost } from "../lib/stripe-us-api.mjs";

const SITE = "https://omni-terrain.com";

export function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function POST(request) {
  if (!originAllowed(request)) return json({ error: "Origin not allowed." }, 403, request);

  try {
    const body = await request.json();
    const rows = await resolveUsCheckoutItems(body?.items);

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${SITE}/us-order-success.html?session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${SITE}/cart.html?checkout=cancelled`);
    params.set("submit_type", "pay");
    params.set("phone_number_collection[enabled]", "true");
    params.set("billing_address_collection", "required");
    params.set("shipping_address_collection[allowed_countries][0]", "US");
    params.set("metadata[store]", "us");
    params.set("metadata[source]", "omni-terrain.com");
    params.set("metadata[pricing_validation]", "server_storefront_catalogue");
    params.set("metadata[shipping_profile]", "standard_us_included");
    params.set("metadata[cart]", rows.map(({ product, qty }) => `${product.id}:${qty}`).join(","));
    params.set("payment_intent_data[metadata][store]", "us");
    params.set("payment_intent_data[metadata][source]", "omni-terrain.com");
    params.set("payment_intent_data[description]", "Omni Terrain US website order");

    if ((process.env.STRIPE_US_AUTOMATIC_TAX || "").toLowerCase() === "true") {
      params.set("automatic_tax[enabled]", "true");
    }

    rows.forEach(({ product, qty }, index) => {
      const prefix = `line_items[${index}]`;
      params.set(`${prefix}[price_data][currency]`, "usd");
      params.set(`${prefix}[price_data][unit_amount]`, String(product.priceCents));
      params.set(`${prefix}[price_data][product_data][name]`, `${product.brand} ${product.title}`.slice(0, 250));
      params.set(`${prefix}[price_data][product_data][description]`, `MPN ${product.mpn}`.slice(0, 250));
      params.set(`${prefix}[quantity]`, String(qty));
    });

    params.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
    params.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", "0");
    params.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "usd");
    params.set("shipping_options[0][shipping_rate_data][display_name]", "Standard US shipping");

    const session = await stripeUsPost("/checkout/sessions", params);
    return json({ id: session.id, url: session.url }, 200, request);
  } catch (error) {
    console.error("US checkout session error", error?.message || error);
    const clientError = /Invalid quantity|Checkout requires|selected product|manual order review|cart total/i.test(String(error?.message || ""));
    const status = clientError || (error?.status >= 400 && error?.status < 500) ? 400 : 500;
    return json(
      { error: status === 400 ? error.message : "Secure US checkout is temporarily unavailable." },
      status,
      request,
    );
  }
}
