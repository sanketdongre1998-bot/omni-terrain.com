const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const categoryLabels = {
  automotive: "Automotive Parts & Towing",
  marine: "Marine Parts & Equipment",
  rv: "RV & Overlanding",
};

function decode(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function encode(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function productSchema(html) {
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(match[1]);
      const rows = Array.isArray(data?.["@graph"]) ? data["@graph"] : [data];
      const product = rows.find((row) => row?.["@type"] === "Product");
      if (product) return product;
    } catch (_) {}
  }
  return null;
}

function cleanBrand(value) {
  return String(value || "Omni Terrain").replace(/\s+/g, " ").trim().slice(0, 28);
}

function productTitle(html) {
  const product = productSchema(html);
  if (!product) return null;
  const brand = cleanBrand(product.brand?.name);
  const mpn = String(product.mpn || product.sku || "").trim();
  const breadcrumb = [...html.matchAll(/<a href="(?:automotive|marine|rv)\.html">([^<]+)<\/a>/gi)].at(-1)?.[1];
  const category = decode(breadcrumb || "Parts & Equipment").replace("Parts & Equipment", "Parts");
  let title = `${brand} ${mpn} | ${category} | Omni Terrain`;
  if (title.length > 80) title = `${brand} ${mpn} | Omni Terrain`;
  return title.slice(0, 80);
}

let changed = 0;
for (const name of fs.readdirSync(root).filter((file) => file.endsWith(".html"))) {
  const file = path.join(root, name);
  let html = fs.readFileSync(file, "utf8");
  const before = html;

  html = html
    .replaceAll('href="us-catalogue.html#automotive"', 'href="automotive.html"')
    .replaceAll('href="us-catalogue.html#marine"', 'href="marine.html"')
    .replaceAll('href="us-catalogue.html#rv"', 'href="rv.html"')
    .replaceAll('href="index.html#start"', 'href="index.html"')
    .replaceAll('href="index.html#collections"', 'href="us-catalogue.html"');

  const category = name.match(/^(automotive|marine|rv)(?:-(\d+))?\.html$/);
  if (category) {
    const page = Number(category[2] || 1);
    const label = categoryLabels[category[1]];
    const title = page === 1 ? `${label} | Omni Terrain` : `${label} — Page ${page} | Omni Terrain`;
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${encode(title)}</title>`);
  } else if (/^us-.*\.html$/.test(name)) {
    const title = productTitle(html);
    if (title) html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${encode(title)}</title>`);
  }

  if (html !== before) {
    fs.writeFileSync(file, html);
    changed += 1;
  }
}

console.log(`SEO normalization updated ${changed} HTML files.`);
