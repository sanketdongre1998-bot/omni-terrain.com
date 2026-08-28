const STRIPE_API = "https://api.stripe.com/v1";

export function stripeUsSecret() {
  // US and UK website payments intentionally use the same Stripe account.
  // A dedicated override remains available for staging or a future account split.
  const secret = (
    process.env.STRIPE_US_SECRET_KEY ||
    process.env.STRIPE_SECRET_KEY ||
    ""
  ).trim();
  if (!secret.startsWith("sk_")) throw new Error("Stripe secret key is not configured for US checkout.");
  return secret;
}

async function stripeUsRequest(path, init = {}) {
  const response = await fetch(`${STRIPE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${stripeUsSecret()}`,
      ...(init.headers || {}),
    },
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data?.error?.message || "US Stripe request failed.");
    error.status = response.status;
    throw error;
  }
  return data;
}

export function stripeUsPost(path, params) {
  return stripeUsRequest(path, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
}

export function stripeUsGet(path) {
  return stripeUsRequest(path);
}
