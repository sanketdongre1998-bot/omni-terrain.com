const STRIPE_API = "https://api.stripe.com/v1";

export function stripeUsSecret() {
  const secret = (process.env.STRIPE_US_SECRET_KEY || "").trim();
  if (!secret.startsWith("sk_")) throw new Error("US Stripe secret key is not configured.");
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
