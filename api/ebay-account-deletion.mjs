import { createHash } from "node:crypto";

const ENDPOINT =
  process.env.EBAY_DELETION_ENDPOINT ||
  "https://omni-terrain-uk-checkout.vercel.app/api/ebay-account-deletion";

export function GET(request) {
  const url = new URL(request.url);
  const challengeCode = url.searchParams.get("challenge_code");
  const verificationToken = process.env.EBAY_DELETION_VERIFICATION_TOKEN || "";

  if (!challengeCode) {
    return Response.json(
      { ok: true, service: "ebay-marketplace-account-deletion" },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!verificationToken) {
    return Response.json(
      { error: "verification_token_not_configured" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  const challengeResponse = createHash("sha256")
    .update(challengeCode)
    .update(verificationToken)
    .update(ENDPOINT)
    .digest("hex");

  return Response.json(
    { challengeResponse },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request) {
  // Acknowledge eBay marketplace account deletion/closure notifications immediately.
  // The integration currently does not persist eBay marketplace user data in this endpoint.
  // If persistence is added later, verify eBay's notification signature and delete/retain
  // data according to eBay policy and applicable legal requirements.
  try {
    await request.text();
  } catch (_) {
    // Intentionally acknowledge even if the body cannot be parsed.
  }

  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
