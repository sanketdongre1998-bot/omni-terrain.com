import assert from "node:assert/strict";
import { commerceReady, readyCount, resolveItems } from "../us-checkout-service/lib/products.mjs";
import { GET as healthGet } from "../us-checkout-service/api/health.mjs";

assert.equal(readyCount(), 0, "US checkout must start with zero commerce-ready products until launch gates are explicitly verified");

assert.equal(commerceReady({
  enabled: true,
  authorizationVerified: true,
  stockVerified: true,
  shippingVerified: true,
  shippingIncluded: true,
  priceCents: 19999,
}), true, "fully verified products should satisfy commerceReady");

assert.equal(commerceReady({
  enabled: true,
  authorizationVerified: false,
  stockVerified: true,
  shippingVerified: true,
  shippingIncluded: true,
  priceCents: 19999,
}), false, "authorization is a hard checkout gate");

assert.throws(
  () => resolveItems([{ id: "F37FTL5607", quantity: 1 }]),
  /not currently available for online purchase/i,
  "disabled candidates must never resolve into a payable checkout item"
);

const request = new Request("https://checkout.example/api/health", {
  headers: { Origin: "https://omni-terrain.com" },
});
const response = healthGet(request);
assert.equal(response.status, 200);
const health = await response.json();
assert.equal(health.ok, true);
assert.equal(health.store, "us");
assert.equal(health.currency, "USD");
assert.equal(health.commerceReadyProducts, 0);
assert.equal(typeof health.stripeConfigured, "boolean");

console.log("PASS isolated US checkout safety gates, registry and health endpoint");
