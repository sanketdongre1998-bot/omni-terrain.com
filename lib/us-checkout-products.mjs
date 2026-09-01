const STOREFRONT = "https://omni-terrain.com";
const CACHE_MS = 5 * 60 * 1000;
const MAX_LINES = 20;
const MAX_QTY = 10;
const MAX_ORDER_CENTS = 1_500_000;
const LAUNCH_PRICE_OVERRIDES = new Map([
  ["HUS81147", 11_999],
  ["HUS81148", 14_999],
  ["CCIN8010F", 19_999],
  ["A1360828HD", 20_499],
  ["B5224066464", 13_299],
]);

let catalogueCache = null;
let catalogueCacheUntil = 0;

function qty(value) {
  const parsed = Math.floor(Number(value) || 0);
  if (parsed < 1 || parsed > MAX_QTY) throw new Error("Invalid quantity.");
  return parsed;
}

function extractJsonAssignment(source, marker, opener, closer) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Storefront data marker missing: ${marker}`);
  const start = source.indexOf(opener, markerIndex + marker.length);
  if (start < 0) throw new Error(`Storefront data payload missing: ${marker}`);

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === opener) depth += 1;
    else if (ch === closer) {
      depth -= 1;
      if (depth === 0) return JSON.parse(source.slice(start, i + 1));
    }
  }
  throw new Error(`Storefront data payload incomplete: ${marker}`);
}

async function fetchText(path) {
  const response = await fetch(`${STOREFRONT}${path}`, {
    headers: { "User-Agent": "Omni-Terrain-Checkout/3.0" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Storefront catalogue unavailable (${response.status}).`);
  return response.text();
}

async function buildCatalogue() {
  const [productsSource, pricesSource, liveRegistrySource] = await Promise.all([
    fetchText("/assets/us-products.js"),
    fetchText("/assets/us-display-prices.js"),
    fetchText("/assets/us-live-products.json"),
  ]);

  const products = extractJsonAssignment(productsSource, "const OMNI_US_PRODUCTS =", "[", "]");
  const prices = extractJsonAssignment(pricesSource, "const PRICES =", "{", "}");
  const liveRegistry = JSON.parse(liveRegistrySource || "{}");
  const approvals = liveRegistry && typeof liveRegistry.products === "object" ? liveRegistry.products : {};

  if (!Array.isArray(products) || !products.length) throw new Error("US storefront catalogue is empty.");

  const priceById = new Map();
  for (const [slug, row] of Object.entries(prices || {})) {
    const id = String(row?.id || "").trim();
    const priceCents = Math.floor(Number(row?.priceCents) || 0);
    if (!id || priceCents <= 0) continue;
    priceById.set(id, {
      priceCents,
      priceSource: String(row?.source || "storefront"),
      slug: String(slug || ""),
      mpn: String(row?.mpn || "").trim(),
    });
  }

  const byId = new Map();
  for (const row of products) {
    const id = String(row?.id || "").trim();
    if (!id || String(row?.decision || "LIST").toUpperCase() !== "LIST") continue;

    const approval = approvals[id];
    if (!approval || approval.enabled !== true || approval.authorizationVerified !== true) continue;

    const price = priceById.get(id);
    const approvedPriceCents = Math.floor(Number(approval.priceCents) || 0);
    if (!price?.priceCents || approvedPriceCents <= 0 || price.priceCents !== approvedPriceCents) continue;

    const launchPriceCents = LAUNCH_PRICE_OVERRIDES.get(id);
    const effectivePriceCents = Number(launchPriceCents) > 0 ? Number(launchPriceCents) : approvedPriceCents;

    byId.set(id, {
      id,
      brand: String(row?.brand || "Omni Terrain").trim(),
      title: String(row?.title || row?.mpn || id).trim(),
      mpn: String(row?.mpn || price.mpn || id).trim(),
      slug: String(row?.slug || price.slug || approval.slug || "").trim(),
      segment: String(row?.segment || "").trim(),
      priceCents: effectivePriceCents,
      priceSource: launchPriceCents ? `${price.priceSource}+launch-offer` : price.priceSource,
      enabled: true,
      operatorApproved: true,
      authorizationVerified: true,
      storefrontVerified: true,
    });
  }

  return byId;
}

async function catalogue() {
  const now = Date.now();
  if (catalogueCache && now < catalogueCacheUntil) return catalogueCache;
  catalogueCache = await buildCatalogue();
  catalogueCacheUntil = now + CACHE_MS;
  return catalogueCache;
}

export async function resolveUsCheckoutItems(items) {
  if (!Array.isArray(items) || !items.length || items.length > MAX_LINES) {
    throw new Error(`Checkout requires 1-${MAX_LINES} products.`);
  }

  const byId = await catalogue();
  let orderCents = 0;
  const rows = items.map((row) => {
    const id = String(row?.id || "").trim();
    const product = byId.get(id);
    if (!product?.enabled || product.authorizationVerified !== true || !product?.storefrontVerified || Number(product.priceCents) <= 0) {
      throw new Error("A selected product is not currently available for online purchase.");
    }
    const quantity = qty(row?.qty ?? row?.quantity);
    orderCents += product.priceCents * quantity;
    return { product: { ...product }, qty: quantity };
  });

  if (orderCents <= 0 || orderCents > MAX_ORDER_CENTS) {
    throw new Error("This cart total needs manual order review before payment.");
  }
  return rows;
}

export async function getUsCheckoutProduct(id) {
  const byId = await catalogue();
  const product = byId.get(String(id || "").trim());
  return product ? { ...product } : null;
}

export async function getCommerceReadyUsProducts() {
  const byId = await catalogue();
  return Array.from(byId.values()).map((product) => ({ ...product }));
}

export async function getCommerceReadyUsProductCount() {
  const byId = await catalogue();
  return byId.size;
}
