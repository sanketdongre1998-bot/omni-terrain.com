import { corsHeaders, json, originAllowed } from "../lib/cors.mjs";
import { resolveCheckoutItems } from "../lib/uk-products.mjs";
import { stripePost } from "../lib/stripe-api.mjs";

const SITE = "https://omni-terrain.com";
const SHIPPING_PROFILE = "shield_uk_mainland_free";

export function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function POST(request) {
  if (!originAllowed(request)) return json({ error: "Origin not allowed." }, 403, request);

  try {
    const body = await request.json();
    if (body?.delivery_region !== "uk_mainland") {
      return json(
        { error: "Current online checkout is available for standard UK mainland delivery only. Contact UK support for Highlands, islands, Northern Ireland, Isle of Man or Channel Islands." },
        400,
        request,
      );
    }

    const rows = resolveCheckoutItems(body?.items);
    const shippingPence = 0;

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${SITE}/uk-order-success.html?session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${SITE}/uk-cart.html?checkout=cancelled`);
    params.set("submit_type", "pay");
    params.set("phone_number_collection[enabled]", "true");
    params.set("shipping_address_collection[allowed_countries][0]", "GB");
    params.set("metadata[store]", "uk");
    params.set("metadata[source]", "omni-terrain.com");
    params.set("metadata[delivery_region]", "uk_mainland");
    params.set("metadata[shipping_profile]", SHIPPING_PROFILE);
    params.set("metadata[cart]", rows.map(({ product, qty }) => `${product.id}:${qty}`).join(","));
    params.set("payment_intent_data[metadata][store]", "uk");
    params.set("payment_intent_data[metadata][source]", "omni-terrain.com");
    params.set("payment_intent_data[metadata][delivery_region]", "uk_mainland");
    params.set("payment_intent_data[metadata][shipping_profile]", SHIPPING_PROFILE);
    params.set("payment_intent_data[description]", "Omni Terrain UK website order");

    rows.forEach(({ product, qty }, index) => {
      const prefix = `line_items[${index}]`;
      params.set(`${prefix}[price_data][currency]`, "gbp");
      params.set(`${prefix}[price_data][unit_amount]`, String(product.pricePence));
      params.set(`${prefix}[price_data][product_data][name]`, product.title);
      params.set(`${prefix}[price_data][product_data][description]`, `${product.brand} · MPN ${product.mpn}`);
      params.set(`${prefix}[price_data][product_data][images][0]`, product.image);
      params.set(`${prefix}[quantity]`, String(qty));
    });

    params.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
    params.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", String(shippingPence));
    params.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "gbp");
    params.set("shipping_options[0][shipping_rate_data][display_name]", "Free UK mainland delivery");

    const session = await stripePost("/checkout/sessions", params);
    return json({ id: session.id, url: session.url }, 200, request);
  } catch (error) {
    console.error("UK checkout session error", error?.message || error);
    const status = error?.status >= 400 && error?.status < 500 ? 400 : 500;
    return json(
      { error: status === 400 ? error.message : "Secure checkout is temporarily unavailable." },
      status,
      request,
    );
  }
}
