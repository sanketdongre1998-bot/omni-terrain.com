import crypto from "node:crypto";

function verifyStripeSignature(rawBody, signatureHeader, secret, toleranceSeconds = 300) {
  if (!signatureHeader || !secret?.startsWith("whsec_")) return false;

  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || !signatures.length || !/^\d+$/.test(timestamp)) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (age > toleranceSeconds) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return signatures.some((signature) => {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
    const candidate = Buffer.from(signature, "hex");
    return candidate.length === expectedBuffer.length && crypto.timingSafeEqual(candidate, expectedBuffer);
  });
}

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature") || "";
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";

  if (!verifyStripeSignature(rawBody, signature, secret)) {
    return Response.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
    const session = event.data?.object || {};
    console.log(
      "Omni Terrain UK paid Checkout Session",
      JSON.stringify({
        event_id: event.id,
        session_id: session.id,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_details?.email || session.customer_email || null,
        delivery_region: session.metadata?.delivery_region || null,
        shipping_profile: session.metadata?.shipping_profile || null,
        cart: session.metadata?.cart || null,
      }),
    );
  }

  return Response.json({ received: true });
}
