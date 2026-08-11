import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sourceProducts = require("../assets/shield-products.js");

const SITE = "https://omni-terrain.com";

export const UK_PRODUCTS = new Map(
  sourceProducts.map((product) => [
    product.id,
    Object.freeze({
      id: product.id,
      title: product.title,
      brand: product.brand,
      mpn: product.mpn,
      pricePence: Math.round(Number(product.price) * 100),
      image: product.images?.[0]
        ? new URL(product.images[0], `${SITE}/`).href
        : `${SITE}/assets/omni-terrain-emblem.webp`,
    }),
  ]),
);

export function resolveCheckoutItems(input) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 20) {
    throw new Error("Your cart is empty or contains too many line items.");
  }

  const merged = new Map();
  for (const row of input) {
    const id = typeof row?.id === "string" ? row.id : "";
    const qty = Number(row?.qty);
    const product = UK_PRODUCTS.get(id);

    if (!product || !Number.isInteger(qty) || qty < 1 || qty > 20) {
      throw new Error("One or more cart items are invalid.");
    }

    const nextQty = (merged.get(id) || 0) + qty;
    if (nextQty > 20) throw new Error("Maximum quantity per product is 20.");
    merged.set(id, nextQty);
  }

  const rows = [...merged.entries()].map(([id, qty]) => ({
    product: UK_PRODUCTS.get(id),
    qty,
  }));

  const totalUnits = rows.reduce((sum, row) => sum + row.qty, 0);
  if (totalUnits > 50) throw new Error("Maximum cart quantity is 50 items.");

  return rows;
}
