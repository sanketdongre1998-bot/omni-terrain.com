const fs = require("fs");
const path = require("path");
const usProducts = require("../assets/us-products.js");
const ukProducts = require("../assets/shield-products.js");

const root = path.resolve(__dirname, "..");
const site = "https://omni-terrain.com";
const lastModified = "2026-07-28";

const corePages = [
  "",
  "us-catalogue.html",
  "automotive.html",
  "rv-solar.html",
  "marine.html",
  "buyer-guides.html",
  "how-it-works.html",
  "about-omni-terrain.html",
  "suppliers-and-brands.html",
  "contact-and-order-help.html",
  "shipping-delivery-policy.html",
  "returns-refunds-policy.html",
  "privacy-policy.html",
  "terms-conditions.html",
  "affiliate-disclosure.html",
  "uk.html",
  "shield-autocare-uk.html",
  "uk-contact.html",
  "uk-shipping-delivery-policy.html",
  "uk-returns-refunds-policy.html",
  "uk-privacy-policy.html",
  "uk-terms-conditions.html"
];

const routes = [
  ...corePages,
  ...usProducts.map((product) => product.slug),
  ...ukProducts.map((product) => product.slug)
];

if (new Set(routes).size !== routes.length) {
  throw new Error("Duplicate sitemap route detected.");
}

for (const route of routes.filter(Boolean)) {
  if (!fs.existsSync(path.join(root, route))) {
    throw new Error(`Cannot add missing route to sitemap: ${route}`);
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((route) => `  <url>
    <loc>${site}/${route}</loc>
    <lastmod>${lastModified}</lastmod>
  </url>`).join("\n")}
</urlset>
`;

fs.writeFileSync(path.join(root, "sitemap.xml"), xml);
console.log(`Generated sitemap with ${routes.length} indexable routes.`);
