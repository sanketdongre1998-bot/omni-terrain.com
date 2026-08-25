const STRIPE_API = "https://api.stripe.com/v1";

export function stripeUsSecret() {
  // US and UK website payments intentionally use the same PRASAD INC LTD
  // Stripe account. A dedicated override remains available for staging or a
  // future account split, but production can use the existing STRIPE_SECRET_KEY.
  const secret = (
    process.env.STRIPE_US_SECRET_KEY ||
    process.env.STRIPE_SECRET_KEY ||
    ""
  ).trim();
  if (!secret.startsWith("sk_")) throw new Error("Stripe secret key is not configured for US checkout.");
  return secret;
}

export async function stripeUsPost(path, params) {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeUsSecret()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data?.error?.message || "US Stripe request failed.");
    error.status = response.status;
    throw error;
  }
  return data;
}
