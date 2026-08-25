const PRODUCTS = new Map([
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
  ["P44PL8547TUN", {
    id: "P44PL8547TUN",
    brand: "Pop & Lock",
    title: "Heavy Duty Power Tailgate Lock for 2014-2021 Toyota Tundra",
    mpn: "PL8547TUN",
    priceCents: 14797,
    enabled: false,
    authorizationVerified: false,
    stockVerified: false,
    shippingVerified: false,
    shippingIncluded: false,
  }],
]);

function quantity(value) {
  const parsed = Math.floor(Number(value) || 0);
  if (parsed < 1 || parsed > 10) throw new Error("Invalid quantity.");
  return parsed;
}

export function commerceReady(product) {
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

export function resolveItems(items) {
  if (!Array.isArray(items) || !items.length || items.length > 10) {
    throw new Error("Checkout requires 1-10 products.");
  }
  return items.map((row) => {
    const product = PRODUCTS.get(String(row?.id || ""));
    if (!commerceReady(product)) {
      throw new Error("A selected product is not currently available for online purchase.");
    }
    return { product, qty: quantity(row?.quantity ?? row?.qty) };
  });
}

export function readyCount() {
  return Array.from(PRODUCTS.values()).filter(commerceReady).length;
}
