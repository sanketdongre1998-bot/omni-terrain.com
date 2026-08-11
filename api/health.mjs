export function GET() {
  const key = process.env.STRIPE_SECRET_KEY || "";
  const configured = key.startsWith("sk_");
  const mode = key.startsWith("sk_live_") ? "live" : key.startsWith("sk_test_") ? "test" : "unconfigured";

  return Response.json(
    { service: "Omni Terrain UK checkout", configured, mode },
    { headers: { "Cache-Control": "no-store" } },
  );
}
