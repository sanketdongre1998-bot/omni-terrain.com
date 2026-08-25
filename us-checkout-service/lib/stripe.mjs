const STRIPE_API = "https://api.stripe.com/v1";

function secret() {
  const value = String(process.env.STRIPE_SECRET_KEY || "").trim();
  if (!value.startsWith("sk_")) throw new Error("Stripe is not configured.");
  return value;
}

export function stripeConfigured() {
  try {
    return secret().startsWith("sk_");
  } catch (_) {
    return false;
  }
}

export async function stripePost(path, params) {
  const response = await fetch(STRIPE_API + path, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret()}`,
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
