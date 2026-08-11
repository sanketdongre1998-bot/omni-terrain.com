const fs = require("fs");
const path = require("path");
const products = require("../assets/shield-products.js");

const root = path.resolve(__dirname, "..");
const failures = [];
let checks = 0;
const sellerUrl = "https://www.ebay.co.uk/sch/i.html?_ssn=omniterrainuk";

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

check(products.length === 20, "exactly 20 current Shield/Cool Mate UK products");
check(products.filter((product) => product.segment === "fridges").length === 2, "two fridge products");
check(products.filter((product) => product.segment === "windows").length === 6, "six window products");
check(products.filter((product) => product.segment === "blinds").length === 12, "12 blind products");
check(new Set(products.map((product) => product.mpn)).size === 20, "all UK MPNs are unique");
check(new Set(products.map((product) => product.slug)).size === 20, "all UK slugs are unique");

for (const product of products) {
  const exact = expected.get(product.mpn);
  check(Boolean(exact), `${product.mpn} is in the approved product register`);
  check(product.price.toFixed(2) === exact?.[0], `${product.mpn} has the approved VAT-inclusive price`);
  check(product.ebayItemId === exact?.[1], `${product.mpn} retains the marketplace reference in source data`);
  check(/^https:\/\/shieldautocare\.com\/product\//.test(product.supplierSource), `${product.mpn} links the supplier record`);
  check(product.images.length >= 4, `${product.mpn} has a local image gallery`);
  for (const image of product.images) check(fs.existsSync(path.join(root, image)), `${image} exists`);

  const html = read(product.slug);
  const records = jsonLd(html);
  const schema = records.find((record) => record["@type"] === "Product");
  check(html.includes(`<link rel="canonical" href="https://omni-terrain.com/${product.slug}">`), `${product.slug} has exact canonical`);
  check(html.includes("PRASAD INC LTD") && !html.includes("PRP XPERT LLC"), `${product.slug} uses only the UK legal identity`);
  check(!html.includes(product.ebayUrl), `${product.slug} does not redirect shoppers to the individual eBay item`);
  check(!html.includes("www.ebay.co.uk"), `${product.slug} has no eBay redirect, including the footer`);
  check(html.includes(`£${product.price.toFixed(2)}`) && html.includes("inc UK VAT"), `${product.slug} shows its VAT-inclusive price`);
  check(html.includes(`data-uk-add="${product.id}"`) && html.includes(`data-uk-buy="${product.id}"`), `${product.slug} has Add to Cart and Buy Now website actions`);
  check(html.includes("uk-cart.html") && html.includes("assets/uk-commerce.js"), `${product.slug} uses the UK website cart`);
  check(html.includes("uk-shipping-delivery-policy.html") && html.includes("uk-returns-refunds-policy.html"), `${product.slug} links UK policies`);
  check(!/eBay item number|Current eBay UK price|View current eBay listing|Review eBay terms/i.test(html), `${product.slug} has no marketplace-first product copy`);
  check(schema?.mpn === product.mpn, `${product.slug} Product schema uses exact MPN`);
  check(schema?.offers?.price === product.price.toFixed(2), `${product.slug} Offer schema uses exact price`);
  check(schema?.offers?.url === `https://omni-terrain.com/${product.slug}`, `${product.slug} Offer schema stays on Omni Terrain`);
  check(records.some((record) => record["@type"] === "BreadcrumbList"), `${product.slug} has BreadcrumbList schema`);
}

const catalogue = read("shield-autocare-uk.html");
check((catalogue.match(/class="product-card"/g) || []).length === 20, "UK catalogue renders 20 current product cards");
check(catalogue.includes('"numberOfItems":20'), "UK catalogue CollectionPage schema lists current products");
check(catalogue.includes("Prices include VAT"), "UK footer identifies VAT-inclusive prices");
check(!/Checkout on eBay UK|Current eBay price|Live on eBay UK/i.test(catalogue), "UK catalogue has no marketplace-first shopping copy");
check((catalogue.match(/https:\/\/www\.ebay\.co\.uk/g) || []).length === 1 && catalogue.includes(sellerUrl), "UK catalogue keeps only one small eBay store link");
check((catalogue.match(/data-uk-add=/g) || []).length === 20, "UK catalogue has Add to Cart on all current products");
check(catalogue.includes("uk-cart.html") && catalogue.includes("assets/uk-commerce.js"), "UK catalogue routes shopping through website cart");
check(!/\b(LKQ|Keystone|NTP-STAG|SeaWide)\b/i.test(catalogue), "UK catalogue has no unrelated supplier claim");

const cart = read("uk-cart.html");
check(cart.includes('name="robots" content="noindex,nofollow"'), "UK cart is noindex");
check(cart.includes("PRASAD INC LTD") && !cart.includes("PRP XPERT LLC"), "UK cart uses UK legal identity only");
check(cart.includes("ukCartRoot") && cart.includes("assets/uk-commerce.js"), "UK cart has functional local cart runtime");
check(cart.includes("Secure checkout being enabled"), "UK cart is transparent that card checkout is not live yet");

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
check(css.includes(".uk-cart-layout") && css.includes(".cart-link"), "UK cart and header cart styles exist");

const commerce = read("assets/uk-commerce.js");
check(commerce.includes("omniTerrainUkCartV1"), "UK cart has an isolated localStorage key");
check(commerce.includes("data-uk-add") && commerce.includes("data-uk-buy"), "UK commerce runtime handles Add to Cart and Buy Now");

if (failures.length) {
  console.error(`FAILED ${failures.length} of ${checks} checks`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`PASS ${checks} UK website-first storefront checks`);
