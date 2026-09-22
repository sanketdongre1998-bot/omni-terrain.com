import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const UK_SOURCE = require("../assets/shield-products.js");

const SITE = "https://omni-terrain.com";
const CACHE_MS = 5 * 60 * 1000;
let usCache = null;
let usCacheUntil = 0;

function extractJsonAssignment(source, marker, opener, closer) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Missing data marker: ${marker}`);
  const start = source.indexOf(opener, markerIndex + marker.length);
  if (start < 0) throw new Error(`Missing data payload: ${marker}`);

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
  throw new Error(`Incomplete data payload: ${marker}`);
}

async function fetchText(path) {
  const response = await fetch(`${SITE}${path}`, {
    headers: { "User-Agent": "Omni-Terrain-AI/1.0" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Catalogue unavailable (${response.status})`);
  return response.text();
}

async function loadUs() {
  if (usCache && Date.now() < usCacheUntil) return usCache;

  const [productsSource, pricesSource, liveSource] = await Promise.all([
    fetchText("/assets/us-products.js"),
    fetchText("/assets/us-display-prices.js"),
    fetchText("/assets/us-live-products.json"),
  ]);

  const products = extractJsonAssignment(productsSource, "const OMNI_US_PRODUCTS =", "[", "]");
  const prices = extractJsonAssignment(pricesSource, "const PRICES =", "{", "}");
  const liveRegistry = JSON.parse(liveSource || "{}");
  const liveById = liveRegistry?.products || {};

  const priceById = new Map();
  for (const row of Object.values(prices || {})) {
    const id = String(row?.id || "").trim();
    const priceCents = Math.floor(Number(row?.priceCents) || 0);
    if (id && priceCents > 0) priceById.set(id, priceCents);
  }

  usCache = products
    .filter((row) => String(row?.decision || "LIST").toUpperCase() === "LIST")
    .map((row) => {
      const id = String(row?.id || "").trim();
      const live = liveById[id];
      const liveReady = Boolean(
        live?.enabled === true &&
        live?.authorizationVerified === true &&
        live?.liveKeystoneOrderable === true
      );
      return {
        region: "us",
        id,
        title: String(row?.title || row?.mpn || id).trim(),
        brand: String(row?.brand || "Omni Terrain").trim(),
        mpn: String(row?.mpn || "").trim(),
        category: String(row?.category || row?.segment || "Auto Parts").trim(),
        description: String(row?.description || "").trim(),
        slug: String(row?.slug || "").replace(/^\//, ""),
        price: liveReady && priceById.has(id) ? priceById.get(id) / 100 : null,
        currency: "USD",
        live: liveReady,
        availability: liveReady ? "Online purchase available" : String(row?.availability || "Availability review required"),
      };
    });

  usCacheUntil = Date.now() + CACHE_MS;
  return usCache;
}

function loadUk() {
  return (Array.isArray(UK_SOURCE) ? UK_SOURCE : []).map((row) => ({
    region: "uk",
    id: String(row?.id || "").trim(),
    title: String(row?.title || row?.mpn || "").trim(),
    brand: String(row?.brand || "Omni Terrain").trim(),
    mpn: String(row?.mpn || "").trim(),
    category: String(row?.category || row?.segment || "UK Store").trim(),
    description: String(row?.description || "").trim(),
    fitment: String(row?.fitment || "").trim(),
    specs: Array.isArray(row?.specs) ? row.specs.slice(0, 8) : [],
    slug: String(row?.slug || "").replace(/^\//, ""),
    price: Number.isFinite(Number(row?.price)) ? Number(row.price) : null,
    currency: "GBP",
    live: true,
    availability: String(row?.availability || "Available on the UK storefront"),
  }));
}

const STOP = new Set(["the","a","an","for","to","and","or","of","is","it","this","that","i","need","want","show","find","me","my","with","on","in","do","you","have"]);

function tokens(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9.+-]+/g, " ")
    .split(/\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 1 && !STOP.has(x));
}

function score(row, query) {
  const q = String(query || "").toLowerCase().trim();
  const qCompact = q.replace(/[^a-z0-9]/g, "");
  const title = row.title.toLowerCase();
  const brand = row.brand.toLowerCase();
  const mpn = row.mpn.toLowerCase();
  const id = row.id.toLowerCase();
  const hay = [title, brand, mpn, id, row.category, row.description].join(" ").toLowerCase();

  let value = 0;
  if (q && title.includes(q)) value += 45;
  if (q && brand === q) value += 40;
  if (q && mpn === q) value += 90;
  if (q && id === q) value += 90;
  if (qCompact && mpn.replace(/[^a-z0-9]/g, "") === qCompact) value += 110;
  if (qCompact && id.replace(/[^a-z0-9]/g, "") === qCompact) value += 110;

  for (const token of tokens(q)) {
    if (mpn.includes(token)) value += 30;
    if (id.includes(token)) value += 24;
    if (brand.includes(token)) value += 12;
    if (title.includes(token)) value += 10;
    if (hay.includes(token)) value += 3;
  }

  if (row.live) value += 2;
  return value;
}

export async function searchOmniCatalogue(query, region = "us", limit = 6) {
  const q = String(query || "").trim();
  if (!q || q.length < 2) return [];

  const rows = region === "uk" ? loadUk() : await loadUs();
  return rows
    .map((row) => ({ row, score: score(row, q) }))
    .filter((item) => item.score > 5)
    .sort((a, b) => b.score - a.score || Number(b.row.live) - Number(a.row.live))
    .slice(0, Math.max(1, Math.min(8, Number(limit) || 6)))
    .map(({ row }) => ({
      ...row,
      url: `${SITE}/${row.slug}`,
    }));
}

export function staticHelpRoutes(region = "us") {
  if (region === "uk") {
    return {
      home: `${SITE}/uk.html`,
      catalogue: `${SITE}/shield-autocare-uk.html`,
      cart: `${SITE}/uk-cart.html`,
      support: `${SITE}/uk-contact.html`,
      shipping: `${SITE}/uk-shipping-delivery-policy.html`,
      returns: `${SITE}/uk-returns-refunds-policy.html`,
    };
  }
  return {
    home: `${SITE}/`,
    catalogue: `${SITE}/us-catalogue.html`,
    used: `${SITE}/used-auto-parts.html`,
    usedRequest: `${SITE}/used-part-request.html`,
    cart: `${SITE}/cart.html`,
    support: `${SITE}/contact-and-order-help.html`,
    shipping: `${SITE}/shipping-delivery-policy.html`,
    returns: `${SITE}/returns-refunds-policy.html`,
  };
}
