const PRODUCTS = new Map([
  ["T8WW865001S", {
    id: "T8WW865001S",
    brand: "TrailFX",
    title: "8x6.5 Wheel Spacer, Silver, 1.25-inch",
    mpn: "W865001S",
    priceCents: 12900,
    enabled: false,
    authorizationVerified: false,
    stockVerified: false,
    shippingVerified: false,
    shippingIncluded: false,
  }],
  ["F37FTL5607", {
    id: "F37FTL5607",
    brand: "Fabtech",
    title: "1.5-inch Leveling System for Toyota Tacoma / 4Runner",
    mpn: "FTL5607",
    priceCents: 19999,
    enabled: false,
    authorizationVerified: false,
    stockVerified: false,
    shippingVerified: false,
    shippingIncluded: false,
  }],
  ["P4592852", {
    id: "P4592852",
    brand: "Putco",
    title: "Luminix LED Grille Emblem for Ford Bronco with Front Camera",
    mpn: "92852",
    priceCents: 39999,
    enabled: false,
    authorizationVerified: false,
    stockVerified: false,
    shippingVerified: false,
    shippingIncluded: false,
  }],
  ["P45950001", {
    id: "P45950001",
    brand: "Putco",
    title: "Hornet Light Roof Mounting Bracket for Ford F-150 / Super Duty",
    mpn: "950001",
    priceCents: 19499,
    enabled: false,
    authorizationVerified: false,
    stockVerified: false,
    shippingVerified: false,
    shippingIncluded: false,
  }],
]);

function qty(value) {
  const parsed = Math.floor(Number(value) || 0);
  if (parsed < 1 || parsed > 10) throw new Error("Invalid quantity.");
  return parsed;
}

function isCommerceReady(product) {
  return Boolean(
    product &&
    product.enabled === true &&
    product.authorizationVerified === true &&
    product.stockVerified === true &&
    product.shippingVerified === true &&
    product.shippingIncluded === true &&
    Number(product.priceCents) > 0
  );
}

export function resolveUsCheckoutItems(items) {
  if (!Array.isArray(items) || !items.length || items.length > 10) {
    throw new Error("Checkout requires 1-10 products.");
  }

  return items.map((row) => {
    const product = PRODUCTS.get(String(row?.id || ""));
    if (!isCommerceReady(product)) {
      throw new Error("A selected product is not currently available for online purchase.");
    }
    return { product, qty: qty(row?.qty ?? row?.quantity) };
  });
}

export function getUsCheckoutProduct(id) {
  return PRODUCTS.get(String(id || "")) || null;
}

export function getCommerceReadyUsProducts() {
  return Array.from(PRODUCTS.values()).filter(isCommerceReady).map((product) => ({ ...product }));
}

export const US_CHECKOUT_PRODUCTS = Object.freeze(Array.from(PRODUCTS.values()).map((product) => ({ ...product })));
