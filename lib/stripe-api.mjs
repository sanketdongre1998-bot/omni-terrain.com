const STRIPE_API = "https://api.stripe.com/v1";

export function stripeSecret() {
  const secret = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!secret.startsWith("sk_")) throw new Error("Stripe secret key is not configured.");
  return secret;
}

export async function stripePost(path, params) {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecret()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data?.error?.message || "Stripe request failed.");
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function stripeGet(path) {
  const response = await fetch(`${STRIPE_API}${path}`, {
    headers: { Authorization: `Bearer ${stripeSecret()}` },
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data?.error?.message || "Stripe request failed.");
    error.status = response.status;
    throw error;
  }
  return data;
}
