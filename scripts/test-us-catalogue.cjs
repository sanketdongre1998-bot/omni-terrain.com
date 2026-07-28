const fs = require("fs");
const path = require("path");
const products = require("../assets/us-products.js");
const imageRecords = require("../US-PRODUCT-IMAGE-SOURCES.json");

const root = path.resolve(__dirname, "..");
const failures = [];
let checks = 0;

function check(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function jsonLd(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
}

check(products.length === 50, "exactly 50 products");
check(products.filter((product) => product.segment === "automotive").length === 20, "20 Automotive & Towing products");
check(products.filter((product) => product.segment === "rv").length === 15, "15 RV & Overlanding products");
check(products.filter((product) => product.segment === "marine").length === 15, "15 Marine products");
check(new Set(products.map((product) => product.id)).size === 50, "all IDs are unique");
check(new Set(products.map((product) => product.slug)).size === 50, "all slugs are unique");
check(new Set(products.map((product) => product.mpn)).size === 50, "all MPNs are unique");
check(products.every((product) => product.decision === "LIST"), "all products are LIST decisions");
check(products.every((product) => product.availability === "Currently Unavailable"), "supplier availability remains unavailable");
check(products.every((product) => /^https:\/\//.test(product.source)), "all records have an HTTPS verification source");

check(imageRecords.length === 50, "image manifest maps all 50 products");
check(new Set(imageRecords.map((record) => record.id)).size === 50, "image manifest IDs are unique");
const imageByProductId = new Map(imageRecords.map((record) => [record.id, record]));
const directImageProducts = products.filter((product) => {
  const record = imageByProductId.get(product.id);
  return record && record.imageUrl && record.status.includes("DIRECT");
});
check(directImageProducts.length === 37, "37 products have live manufacturer-hosted images");
check(products.length - directImageProducts.length === 13, "13 products retain controlled placeholders");
check(products.every((product) => imageByProductId.has(product.id)), "every product has an image manifest record");

const forbidden = /\b(LKQ|Keystone|NTP-STAG|SeaWide)\b|authori[sz]ed dealer|will fulfil|will fulfill/i;
const publicFiles = ["us-catalogue.html", ...products.map((product) => product.slug)];
for (const file of publicFiles) {
  const fullPath = path.join(root, file);
  check(fs.existsSync(fullPath), `${file} exists`);
  if (!fs.existsSync(fullPath)) continue;
  const html = read(file);
  check(!forbidden.test(html), `${file} has no restricted supplier/dealer claim`);
  check(!/lorem ipsum/i.test(html), `${file} has no lorem ipsum`);
  check(html.includes('name="robots" content="index,follow"'), `${file} is indexable`);
  check(html.includes(`<link rel="canonical" href="https://omni-terrain.com/${file}">`), `${file} has exact canonical`);
  check(html.includes("PRP XPERT LLC") && !html.includes("PRASAD INC LTD"), `${file} uses only the US legal identity`);
  check(html.includes("shipping-delivery-policy.html"), `${file} links US shipping policy`);
  check(html.includes("returns-refunds-policy.html"), `${file} links US returns policy`);
  check(html.includes('class="mobile-store-bar"'), `${file} includes mobile store shortcuts`);
  check(html.includes('href="uk.html"'), `${file} links the UK storefront`);
  check(jsonLd(html).length > 0, `${file} contains valid JSON-LD`);
}

const catalogue = read("us-catalogue.html");
check((catalogue.match(/class="product-card"/g) || []).length === 50, "catalogue renders 50 product cards");
check((catalogue.match(/class="product-image"/g) || []).length === 37, "catalogue renders 37 live manufacturer-hosted images");
check((catalogue.match(/<b>Product image pending<\/b>/g) || []).length === 13, "catalogue renders 13 controlled image placeholders");
check(catalogue.includes("Products can be added to the request cart."), "catalogue explains request checkout");
check(!/(amazon|ebay|walmart)\./i.test(catalogue), "catalogue uses no retailer image domains");
const collection = jsonLd(catalogue).find((record) => record["@type"] === "CollectionPage");
check(Boolean(collection), "catalogue has CollectionPage schema");
check(collection?.mainEntity?.numberOfItems === 50, "CollectionPage schema includes 50 products");

for (const product of products) {
  const html = read(product.slug);
  const records = jsonLd(html);
  const productRecord = records.find((record) => record["@type"] === "Product");
  const breadcrumbs = records.find((record) => record["@type"] === "BreadcrumbList");
  const imageRecord = imageByProductId.get(product.id);
  const hasDirectImage = Boolean(imageRecord?.imageUrl && imageRecord.status.includes("DIRECT"));

  check(html.includes(product.mpn), `${product.slug} contains MPN`);
  check(html.includes(product.brand), `${product.slug} contains brand`);
  check(html.includes(product.source), `${product.slug} links the official verification source`);
  check(html.includes("Add to Request Cart"), `${product.slug} has request-cart action`);
  check(html.includes("Price confirmed after review"), `${product.slug} withholds price`);
  check(html.includes("No unavailable product is charged"), `${product.slug} explains the payment hold`);
  check(!html.includes('"offers":') && !html.includes('"priceCurrency":'), `${product.slug} publishes no unverified Offer`);
  check(productRecord?.mpn === product.mpn, `${product.slug} Product schema has the exact MPN`);
  check(productRecord?.brand?.name === product.brand, `${product.slug} Product schema has the exact brand`);
  check(Boolean(breadcrumbs), `${product.slug} has BreadcrumbList schema`);
  check(
    hasDirectImage
      ? html.includes('class="product-image"') && html.includes(imageRecord.imageUrl.replaceAll("&", "&amp;"))
      : html.includes("Product image pending") && !html.includes('class="product-image"'),
    `${product.slug} uses its mapped image or controlled placeholder`
  );
}

const css = read("assets/us-catalogue.css");
check(css.includes("@media(max-width:850px)"), "tablet/mobile navigation breakpoint exists");
check(css.includes("@media(max-width:760px)"), "primary mobile storefront breakpoint exists");
check(css.includes("@media(max-width:560px)"), "phone layout breakpoint exists");
check(css.includes("@media(max-width:380px)"), "small-phone breakpoint exists");
check(css.includes(".storefront-products .product-card[hidden]{display:none}"), "filtered products remain hidden on mobile");
check(css.includes("grid-template-columns:minmax(126px,40%) minmax(0,1fr)"), "mobile catalogue uses compact product rows");
check(css.includes("max-height:calc(100dvh - 64px)"), "mobile navigation is viewport bounded");
check(css.includes(".field input,.field select,.field textarea{font-size:16px}"), "mobile inputs avoid iOS zoom");
check(css.includes(".mobile-store-bar{position:fixed"), "mobile storefront shortcuts remain reachable");

const home = read("index.html");
check(home.includes('rel="canonical" href="https://omni-terrain.com/"'), "homepage has canonical URL");
check(home.includes('"@type":"WebSite"') && home.includes('"@type":"Organization"'), "homepage has WebSite and Organization schema");
check(home.includes("Browse all 50 products"), "homepage leads to the full catalogue");
check(home.includes('href="cart.html"'), "homepage links the request cart");
check(!forbidden.test(home), "homepage has no restricted supplier claim");

if (failures.length) {
  console.error(`FAILED ${failures.length} of ${checks} checks`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`PASS ${checks} US catalogue checks`);
