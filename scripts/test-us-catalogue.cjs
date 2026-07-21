const fs = require("fs");
const path = require("path");
const products = require("../assets/us-products.js");
const imageRecords = require("../US-PRODUCT-IMAGE-SOURCES.json");

const root = path.resolve(__dirname, "..");
const failures = [];
const checks = [];

function check(condition, message) {
  checks.push(message);
  if (!condition) failures.push(message);
}

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

check(products.length === 50, "exactly 50 products");
check(products.filter((p) => p.segment === "automotive").length === 20, "20 Automotive & Towing products");
check(products.filter((p) => p.segment === "rv").length === 15, "15 RV & Overlanding products");
check(products.filter((p) => p.segment === "marine").length === 15, "15 Marine products");
check(new Set(products.map((p) => p.mpn)).size === 50, "all MPNs are unique");
check(products.every((p) => p.decision === "LIST"), "all public products are LIST decisions");
check(products.every((p) => p.availability === "Currently Unavailable"), "all public products are unavailable");
check(imageRecords.length === 50, "image manifest maps all 50 products");
check(new Set(imageRecords.map((record) => record.id)).size === 50, "image manifest IDs are unique");

const imageByProductId = new Map(imageRecords.map((record) => [record.id, record]));
const directImageProducts = products.filter((product) => {
  const record = imageByProductId.get(product.id);
  return record && record.imageUrl && record.status.includes("DIRECT");
});
const placeholderProducts = products.filter((product) => !directImageProducts.includes(product));
check(directImageProducts.length === 44, "44 products have direct manufacturer images");
check(placeholderProducts.length === 6, "6 products retain controlled placeholders");
check(products.every((product) => imageByProductId.has(product.id)), "every product has an image manifest record");

const publicFiles = ["us-catalogue.html", "cart.html", "checkout.html", ...products.map((p) => p.slug)];
const forbidden = /\b(LKQ|Keystone|NTP-STAG|SeaWide)\b|authori[sz]ed dealer|will fulfil|will fulfill/i;
const lorem = /lorem ipsum/i;

for (const file of publicFiles) {
  const fullPath = path.join(root, file);
  check(fs.existsSync(fullPath), `${file} exists`);
  if (!fs.existsSync(fullPath)) continue;
  const html = read(file);
  check(!forbidden.test(html), `${file} has no restricted supplier claim`);
  check(!lorem.test(html), `${file} has no lorem ipsum`);
  check(html.includes('name="robots" content="noindex,nofollow"'), `${file} remains preview/noindex`);
  check(html.includes("shipping-delivery-policy.html"), `${file} links shipping policy`);
  check(html.includes("returns-refunds-policy.html"), `${file} links returns policy`);
  check(html.includes("privacy-policy.html"), `${file} links privacy policy`);
  check(html.includes("terms-conditions.html"), `${file} links terms`);
}

const catalogue = read("us-catalogue.html");
check((catalogue.match(/class="product-card"/g) || []).length === 50, "catalogue renders 50 product cards");
check((catalogue.match(/class="product-image"/g) || []).length === 44, "catalogue renders 44 manufacturer product images");
check((catalogue.match(/<b>Product image pending<\/b>/g) || []).length === 6, "catalogue retains 6 controlled image-pending placeholders");
check(catalogue.includes("US product availability is currently being finalised. Orders are not being accepted for unavailable items."), "catalogue includes exact availability notice");
check(!/(amazon|ebay|walmart)\./i.test(catalogue), "catalogue uses no retailer image domains");

for (const product of products) {
  const html = read(product.slug);
  const imageRecord = imageByProductId.get(product.id);
  const hasDirectImage = imageRecord && imageRecord.imageUrl && imageRecord.status.includes("DIRECT");
  check(html.includes(product.mpn), `${product.slug} contains MPN`);
  check(html.includes(product.brand), `${product.slug} contains brand`);
  check(
    hasDirectImage ? html.includes('class="product-image"') && html.includes(imageRecord.imageUrl.replaceAll("&", "&amp;")) : html.includes("Product image pending") && !html.includes('class="product-image"'),
    `${product.slug} uses the correct image or controlled placeholder`
  );
  check(hasDirectImage ? html.includes("Usage approval pending") : html.includes("Authorised product image pending"), `${product.slug} shows the correct image-rights caption`);
  check(html.includes("Price not displayed"), `${product.slug} withholds price`);
  check(/<button[^>]+disabled[^>]*>Add to Cart — Unavailable<\/button>/.test(html), `${product.slug} disables Add to Cart`);
  check(html.includes(product.source), `${product.slug} links official verification source`);
}

const checkout = read("checkout.html");
check(checkout.includes('id="checkoutForm"'), "checkout form exists");
check((checkout.match(/ disabled/g) || []).length >= 10, "public checkout inputs and submit are disabled");
check(checkout.includes("Payment fields are intentionally absent"), "checkout explains payment hold");

const requiredPages = ["contact-and-order-help.html", "shipping-delivery-policy.html", "returns-refunds-policy.html", "privacy-policy.html", "terms-conditions.html", "cart.html", "checkout.html"];
for (const page of requiredPages) check(fs.existsSync(path.join(root, page)), `${page} is present`);

const hrefPattern = /href="([^"]+)"/g;
for (const file of publicFiles.concat("index.html")) {
  const html = read(file);
  for (const match of html.matchAll(hrefPattern)) {
    const href = match[1];
    if (/^(https?:|mailto:|tel:|#)/.test(href)) continue;
    const pathname = href.split("#")[0].split("?")[0];
    if (!pathname) continue;
    check(fs.existsSync(path.join(root, pathname)), `${file} link target exists: ${pathname}`);
  }
}

const css = read("assets/us-catalogue.css");
check(css.includes("@media(max-width:850px)"), "tablet/mobile navigation breakpoint exists");
check(css.includes("@media(max-width:560px)"), "phone layout breakpoint exists");

if (failures.length) {
  console.error(`FAILED ${failures.length} of ${checks.length} checks`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`PASS ${checks.length} checks`);
