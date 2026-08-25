const PRODUCTS = new Map([
  ["T8WW865001S", {
    id: "T8WW865001S",
    brand: "TrailFX",
    title: "Wheel Spacers",
    mpn: "W865001S",
    priceCents: 15999,
    enabled: false,
    shippingIncluded: true,
  }],
  ["F37FTL5607", {
    id: "F37FTL5607",
    brand: "Fabtech",
    title: "1.5-inch Leveling Kit",
    mpn: "FTL5607",
    priceCents: 19999,
    enabled: false,
    shippingIncluded: true,
  }],
  ["P4592852", {
    id: "P4592852",
    brand: "Putco",
    title: "Luminix Ford Bronco LED Grille Emblem",
    mpn: "92852",
    priceCents: 39999,
    enabled: false,
    shippingIncluded: true,
  }],
  ["P45950001", {
    id: "P45950001",
    brand: "Putco",
    title: "Hornet Light Roof Mounting Bracket",
    mpn: "950001",
    priceCents: 19499,
    enabled: false,
    shippingIncluded: true,
  }],
]);

function qty(value) {
  const parsed = Math.floor(Number(value) || 0);
  if (parsed < 1 || parsed > 10) throw new Error("Invalid quantity.");
  return parsed;
}

export function resolveUsCheckoutItems(items) {
  if (!Array.isArray(items) || !items.length || items.length > 10) {
    throw new Error("Checkout requires 1-10 products.");
  }

  return items.map((row) => {
    const product = PRODUCTS.get(String(row?.id || ""));
    if (!product || !product.enabled) throw new Error("A selected product is not currently available for online purchase.");
    return { product, qty: qty(row?.qty ?? row?.quantity) };
  });
}

export function getUsCheckoutProduct(id) {
  return PRODUCTS.get(String(id || "")) || null;
}

export const US_CHECKOUT_PRODUCTS = Object.freeze(Array.from(PRODUCTS.values()).map((product) => ({ ...product })));
