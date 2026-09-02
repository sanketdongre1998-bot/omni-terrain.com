import { corsHeaders, json, originAllowed } from "../lib/cors.mjs";
import { resolveUsCheckoutItems } from "../lib/us-checkout-products.mjs";
import { stripeUsGet, stripeUsPost } from "../lib/stripe-us-api.mjs";

const SITE = "https://omni-terrain.com";
const PROMO_CODE = "OMNI5";
const STRIPE_COUPON_ID = "OMNI5_USD5";
const PROMO_MIN_CENTS = 15_000;
const PROMO_SAVE_CENTS = 500;
const FEATURED_DEAL_IDS = new Set([
  "HUS81147",
  "HUS81148",
  "CCIN9010F",
  "CCIN8010F",
  "CCIIMP103X",
  "A1360828HD",
  "B5224066464",
]);

export function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

async function ensureOmni5Coupon() {
  try {
    const coupon = await stripeUsGet(`/coupons/${encodeURIComponent(STRIPE_COUPON_ID)}`);
    const valid = coupon?.valid !== false && Number(coupon?.amount_off) === PROMO_SAVE_CENTS && String(coupon?.currency || "").toLowerCase() === "usd";
    if (!valid) throw new Error("OMNI5 promotion configuration is temporarily unavailable.");
    return coupon.id;
  } catch (error) {
    if (Number(error?.status) !== 404) throw error;
    const params = new URLSearchParams();
    params.set("id", STRIPE_COUPON_ID);
    params.set("name", "OMNI5 - $5 off eligible $150+ US order");
    params.set("amount_off", String(PROMO_SAVE_CENTS));
    params.set("currency", "usd");
    params.set("duration", "once");
    params.set("metadata[store]", "us");
    params.set("metadata[public_code]", PROMO_CODE);
    const coupon = await stripeUsPost("/coupons", params);
    return coupon.id;
  }
}

export async function POST(request) {
  if (!originAllowed(request)) return json({ error: "Origin not allowed." }, 403, request);

  try {
    const body = await request.json();
    const rows = await resolveUsCheckoutItems(body?.items);
    const subtotalCents = rows.reduce((sum, { product, qty }) => sum + Number(product.priceCents) * Number(qty), 0);
    const requestedPromo = String(body?.couponCode || "").trim().toUpperCase();

    let appliedPromo = null;
    if (requestedPromo) {
      if (requestedPromo !== PROMO_CODE) throw new Error("That promo code is not valid.");
      if (subtotalCents < PROMO_MIN_CENTS) throw new Error("OMNI5 requires a minimum $150 order subtotal.");
      if (rows.some(({ product }) => FEATURED_DEAL_IDS.has(String(product.id)))) {
        throw new Error("OMNI5 cannot be combined with featured deal pricing.");
      }
      appliedPromo = {
        code: PROMO_CODE,
        couponId: await ensureOmni5Coupon(),
        savingsCents: PROMO_SAVE_CENTS,
      };
    }

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

    if (appliedPromo) {
      params.set("discounts[0][coupon]", appliedPromo.couponId);
      params.set("metadata[promo_code]", appliedPromo.code);
      params.set("metadata[promo_savings_cents]", String(appliedPromo.savingsCents));
      params.set("payment_intent_data[metadata][promo_code]", appliedPromo.code);
    }

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
    return json({
      id: session.id,
      url: session.url,
      promotion: appliedPromo ? { code: appliedPromo.code, savingsCents: appliedPromo.savingsCents } : null,
    }, 200, request);
  } catch (error) {
    const message = String(error?.message || error || "");
    const clientError = /Invalid quantity|Checkout requires|selected product|manual order review|cart total|promo code|OMNI5|featured deal/i.test(message);
    const upstreamClientError = Number(error?.status) >= 400 && Number(error?.status) < 500;
    const status = clientError || upstreamClientError ? 400 : 500;
    if (status === 400) console.warn("US checkout validation", message);
    else console.error("US checkout session error", message);
    return json(
      { error: status === 400 ? message : "Secure US checkout is temporarily unavailable." },
      status,
      request,
    );
  }
}
