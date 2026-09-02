const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const products = require(path.join(root, "assets/us-products.js"));
const output = path.join(root, "assets/us-product-images.json");

function decodeHtml(value) {
  return String(value || "")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function productImage(product) {
  const file = path.join(root, String(product.slug || ""));
  if (!fs.existsSync(file)) return "";
  const html = fs.readFileSync(file, "utf8");
  const visual = html.match(/<div class="product-visual"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/i);
  if (visual?.[1]) return decodeHtml(visual[1]);

  for (const match of html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(match[1]);
      if (data?.["@type"] !== "Product") continue;
      const image = Array.isArray(data.image) ? data.image[0] : data.image;
      if (image) return decodeHtml(image);
    } catch (_) {}
  }
  return "";
}

const images = Object.fromEntries(products.map(product => [String(product.id), productImage(product)]));
const payload = {
  version: 1,
  source: "Existing Omni Terrain product-page imagery",
  products: images,
};

const mapped = Object.values(images).filter(Boolean).length;
const serialized = `${JSON.stringify(payload)}\n`;
if (process.argv.includes("--check")) {
  if (!fs.existsSync(output) || fs.readFileSync(output, "utf8") !== serialized) {
    console.error(`${path.relative(root, output)} is stale; run node scripts/build-us-product-images.cjs.`);
    process.exit(1);
  }
  console.log(`Verified ${path.relative(root, output)} with ${mapped}/${products.length} mapped product images.`);
} else {
  fs.writeFileSync(output, serialized);
  console.log(`Generated ${path.relative(root, output)} with ${mapped}/${products.length} mapped product images.`);
}
