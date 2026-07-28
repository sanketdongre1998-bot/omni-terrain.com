const fs = require("fs");
const path = require("path");
const products = require("../assets/shield-products.js");

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

const expected = new Map([
  ["COOL.MATE.SOLAR.AC.DC.70L.BLCK", ["479.95", "236961146598"]],
  ["COOL.MATE.SOLAR.AC.DC.70L.SILV", ["489.95", "236961146599"]],
  ["FRMLS.500x300", ["194.95", "236961146612"]],
  ["FRMLS.500x450", ["244.95", "236961146594"]],
  ["FRMLS.700x500", ["304.95", "236961146616"]],
  ["FRMLS.700x550", ["324.95", "236961146608"]],
  ["FRMLS.720x360", ["274.95", "236961146600"]],
  ["FRMLS.900x500", ["335.95", "236961146602"]],
  ["BLIND.1000x800.WHTE", ["219.95", "236961146603"]],
  ["BLIND.1000x800.BLCK", ["219.95", "236961146607"]],
  ["BLIND.1000x800.BEIGE", ["219.95", "236961146610"]],
  ["BLIND.1100x450.WHTE", ["179.95", "236961146601"]],
  ["BLIND.1100x450.BLCK", ["179.95", "236961146604"]],
  ["BLIND.1100x450.BEIGE", ["179.95", "236961146609"]],
  ["BLIND.1100x550.BLCK", ["189.95", "236961146606"]],
  ["BLIND.1100x550.BEIGE", ["189.95", "236961146596"]],
  ["BLIND.1200x500.WHTE", ["199.95", "236961146613"]],
  ["BLIND.1200x500.BLCK", ["199.95", "236961146597"]],
  ["BLIND.1200x500.BEIGE", ["199.95", "236961146611"]],
  ["BLIND.1450x550.WHTE", ["229.95", "236961146614"]]
]);

check(products.length === 20, "exactly 20 Shield/Cool Mate UK products");
check(products.filter((product) => product.segment === "fridges").length === 2, "two fridge listings");
check(products.filter((product) => product.segment === "windows").length === 6, "six window listings");
check(products.filter((product) => product.segment === "blinds").length === 12, "12 blind listings");
check(new Set(products.map((product) => product.mpn)).size === 20, "all UK MPNs are unique");
check(new Set(products.map((product) => product.slug)).size === 20, "all UK slugs are unique");
check(new Set(products.map((product) => product.ebayItemId)).size === 20, "all UK eBay item IDs are unique");
check(products.every((product) => product.decision === "LIST"), "all UK products are LIST decisions");
check(products.every((product) => product.currency === "GBP"), "all UK products use GBP");
check(products.every((product) => product.availability === "Available on eBay UK"), "availability points to eBay UK");

for (const product of products) {
  const exact = expected.get(product.mpn);
  check(Boolean(exact), `${product.mpn} is in the approved 20-row register`);
  check(product.price.toFixed(2) === exact?.[0], `${product.mpn} has the checked VAT-inclusive customer price`);
  check(product.ebayItemId === exact?.[1], `${product.mpn} has the exact eBay item ID`);
  check(product.ebayUrl === `https://www.ebay.co.uk/itm/${product.ebayItemId}`, `${product.mpn} has a direct eBay URL`);
  check(/^https:\/\/shieldautocare\.com\/product\//.test(product.supplierSource), `${product.mpn} links the supplier product record`);
  check(product.images.length >= 4, `${product.mpn} has a local image gallery`);
  for (const image of product.images) {
    check(image.startsWith("assets/shield-live/"), `${product.mpn} uses the approved local image folder`);
    check(fs.existsSync(path.join(root, image)), `${image} exists`);
  }

  const html = read(product.slug);
  const records = jsonLd(html);
  const schema = records.find((record) => record["@type"] === "Product");
  check(html.includes(`<link rel="canonical" href="https://omni-terrain.com/${product.slug}">`), `${product.slug} has exact canonical`);
  check(html.includes("PRASAD INC LTD") && !html.includes("PRP XPERT LLC"), `${product.slug} uses only the UK legal identity`);
  check(html.includes(product.ebayUrl), `${product.slug} links the exact eBay item`);
  check(html.includes(`£${product.price.toFixed(2)}`) && html.includes("inc UK VAT"), `${product.slug} shows its VAT-inclusive price`);
  check(html.includes("uk-shipping-delivery-policy.html") && html.includes("uk-returns-refunds-policy.html"), `${product.slug} links UK policies`);
  check(schema?.mpn === product.mpn, `${product.slug} Product schema uses exact MPN`);
  check(schema?.offers?.price === product.price.toFixed(2), `${product.slug} Offer schema uses exact price`);
  check(schema?.offers?.url === product.ebayUrl, `${product.slug} Offer schema links exact eBay item`);
  check(records.some((record) => record["@type"] === "BreadcrumbList"), `${product.slug} has BreadcrumbList schema`);
}

const catalogue = read("shield-autocare-uk.html");
check((catalogue.match(/class="product-card"/g) || []).length === 20, "UK catalogue renders 20 product cards");
check(catalogue.includes('"numberOfItems":20'), "UK catalogue CollectionPage schema lists 20 items");
check(catalogue.includes("Prices include VAT"), "UK footer identifies VAT-inclusive prices");
check(catalogue.includes("Checkout on eBay UK"), "UK catalogue identifies checkout route");
check(!/\b(LKQ|Keystone|NTP-STAG|SeaWide)\b/i.test(catalogue), "UK catalogue has no unrelated supplier claim");

for (const page of [
  "uk.html",
  "shield-autocare-uk.html",
  "uk-contact.html",
  "uk-shipping-delivery-policy.html",
  "uk-returns-refunds-policy.html",
  "uk-privacy-policy.html",
  "uk-terms-conditions.html"
]) {
  const html = read(page);
  check(html.includes("PRASAD INC LTD"), `${page} contains UK operator identity`);
  check(!html.includes("PRP XPERT LLC"), `${page} excludes US operator identity`);
  check(html.includes('href="index.html"'), `${page} links back to the US storefront`);
  check(!/lorem ipsum/i.test(html), `${page} has no lorem ipsum`);
}

for (const legacy of [
  "shield-400l-roof-bag.html",
  "shield-transit-custom-2-roof-bars.html",
  "shield-12v-air-compressor.html",
  "shield-7mm-insulation-10m.html",
  "shield-portable-toilet-12l.html",
  "shield-portable-toilet-20l.html",
  "shield-jet-black-roof-vent.html"
]) {
  const html = read(legacy);
  check(html.includes('name="robots" content="noindex,follow"'), `${legacy} is noindex`);
  check(html.includes('content="0;url=shield-autocare-uk.html"'), `${legacy} redirects to the current UK catalogue`);
}

const css = read("assets/shield-catalogue.css");
check(css.includes("@media(max-width:780px)"), "UK primary mobile breakpoint exists");
check(css.includes("@media(max-width:560px)"), "UK phone breakpoint exists");
check(css.includes("grid-template-columns:minmax(118px,38%) minmax(0,1fr)"), "UK mobile catalogue uses compact product rows");
check(css.includes(".gallery-thumbs"), "UK responsive image gallery styles exist");

if (failures.length) {
  console.error(`FAILED ${failures.length} of ${checks} checks`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`PASS ${checks} UK Shield catalogue checks`);
