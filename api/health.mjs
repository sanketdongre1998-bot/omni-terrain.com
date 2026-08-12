export function GET() {
  const rawKey = process.env.STRIPE_SECRET_KEY || "";
  const rawWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  const key = rawKey.trim();
  const webhookSecret = rawWebhookSecret.trim();
  const configured = key.startsWith("sk_");
  const mode = key.startsWith("sk_live_") ? "live" : key.startsWith("sk_test_") ? "test" : "unconfigured";
  const webhook_configured = webhookSecret.startsWith("whsec_");

  return Response.json(
    {
      service: "Omni Terrain UK checkout",
      configured,
      mode,
      webhook_configured,
      shipping_profile: "shield_uk_mainland_free",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
