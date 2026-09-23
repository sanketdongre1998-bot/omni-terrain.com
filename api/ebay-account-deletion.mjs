import { createHash } from "node:crypto";

const ENDPOINT =
  process.env.EBAY_DELETION_ENDPOINT ||
  "https://omni-terrain-uk-checkout.vercel.app/api/ebay-account-deletion";

const DEFAULT_VERIFICATION_TOKEN = "g8Lvy8Rtq8ZiexGyyrK1ETk3rTRRtegcYchRkd_9rzVWDcu3";

export function GET(request) {
  const url = new URL(request.url);
  const challengeCode = url.searchParams.get("challenge_code");
  const verificationToken =
    process.env.EBAY_DELETION_VERIFICATION_TOKEN ||
    DEFAULT_VERIFICATION_TOKEN;

  if (!challengeCode) {
    return Response.json(
      { ok: true, service: "ebay-marketplace-account-deletion" },
      { status: 200, headers: { "Cache-Control": "no-store" } },
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
  try {
    await request.text();
  } catch (_) {}

  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
