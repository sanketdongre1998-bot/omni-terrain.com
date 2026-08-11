const fs = require("fs");
const path = require("path");
const products = require("../assets/shield-products.js");

const root = path.resolve(__dirname, "..");
const site = "https://omni-terrain.com";
const sellerUrl = "https://www.ebay.co.uk/sch/i.html?_ssn=omniterrainuk";

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function jsonLd(value) {
  return `<script type="application/ld+json">${JSON.stringify(value).replaceAll("<", "\\u003c")}</script>`;
}

function absolute(url) {
  return url.startsWith("http") ? url : `${site}/${url}`;
}

function head({ title, description, canonical, image, schema = [], robots = "index,follow" }) {
  const imageUrl = absolute(image || "assets/omni-terrain-emblem.webp");
  return `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#071a30">
  <meta name="robots" content="${esc(robots)}">
  <title>${esc(title)}</title>
  <link rel="canonical" href="${esc(canonical)}">
  <meta property="og:site_name" content="Omni Terrain">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="${esc(imageUrl)}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&amp;family=DM+Mono:wght@400;500&amp;family=Manrope:wght@400;500;600;700;800&amp;family=Teko:wght@500;600;700&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/shield-catalogue.css">
${schema.map((record) => `  ${jsonLd(record)}`).join("\n")}
</head>`;
}

function wordmark(href = "uk.html") {
  return `<a class="brand" href="${href}" aria-label="Omni Terrain UK home"><span class="wordmark"><span class="wordmark-main">Omni</span><span class="wordmark-sub">Terrain</span><span class="wordmark-meta">Road / Water / Power</span></span></a>`;
}

function header(active = "") {
  const nav = [
    ["home", "uk.html", "UK Home"],
    ["catalogue", "shield-autocare-uk.html", "Shop Available"],
    ["fridges", "shield-autocare-uk.html#fridges", "Fridges"],
    ["windows", "shield-autocare-uk.html#windows", "Windows"],
    ["blinds", "shield-autocare-uk.html#blinds", "Blinds & Flyscreens"]
  ];
  const links = nav.map(([id, href, label]) => `<a${id === active ? ' class="active" aria-current="page"' : ""} href="${href}">${label}</a>`).join("");
  return `<body>
<div class="announcement"><div class="container"><span><strong>Omni Terrain UK:</strong> Practical parts and equipment with clear support before and after you buy.</span><a href="uk-contact.html">Need help choosing? →</a></div></div>
<div class="market-strip"><div class="container"><span class="market-label">Store region</span><a href="index.html">United States</a><a class="market-link" href="uk.html">United Kingdom</a><span class="market-note">UK operator: PRASAD INC LTD · VAT registered</span></div></div>
<header id="header"><div class="container header-main">${wordmark()}<nav class="nav-links" aria-label="UK store navigation">${links}</nav><div class="header-actions"><a class="cart-link${active === "cart" ? " active" : ""}" href="uk-cart.html">Cart <span class="cart-count" data-uk-cart-count>0</span></a><a class="header-contact desktop-only" href="uk-contact.html">UK Help</a><button class="menu-btn" id="menuToggle" aria-expanded="false" aria-controls="mobileNav">Menu</button></div></div>
<nav class="mobile-nav" id="mobileNav" aria-label="UK store mobile navigation"><a href="uk.html">UK Home</a><a href="shield-autocare-uk.html">Shop Available Products</a><a href="shield-autocare-uk.html#fridges">Campervan Fridges</a><a href="shield-autocare-uk.html#windows">Campervan Windows</a><a href="shield-autocare-uk.html#blinds">Blinds &amp; Flyscreens</a><a href="uk-cart.html">Cart <span data-uk-cart-count>0</span></a><a href="uk-contact.html">Contact &amp; Help</a></nav></header>
<div class="draft-strip"><div class="container"><span class="draft-pill">Website shopping</span><span>Add products to your Omni Terrain cart and keep your buying journey on our website. Secure card checkout will be enabled when payment setup is live.</span></div></div>`;
}

function footer(showEbayStore = false) {
  const ebayStoreLink = showEbayStore ? `<a href="${sellerUrl}" target="_blank" rel="noopener">Visit eBay store ↗</a>` : "";
  return `<footer><div class="container"><div class="footer-grid"><div>${wordmark()}<p class="footer-copy">Practical automotive, marine, campervan and power equipment with clear product information and customer support.</p><p class="legal-note"><strong>UK operator:</strong> PRASAD INC LTD trading as Omni Terrain · Company No. 07981226 · VAT GB 433306133 · EORI GB433306133000 · 19 Stones Avenue, Dartford, England, DA1 5GS</p></div><div><div class="footer-heading">Shop UK</div><div class="footer-links"><a href="shield-autocare-uk.html">Available Products</a><a href="shield-autocare-uk.html#fridges">Fridges</a><a href="shield-autocare-uk.html#windows">Windows</a><a href="shield-autocare-uk.html#blinds">Blinds &amp; Flyscreens</a><a href="uk-cart.html">Cart</a></div></div><div><div class="footer-heading">UK support</div><div class="footer-links"><a href="uk-contact.html">Contact &amp; Order Help</a><a href="mailto:support@omni-terrain.com">support@omni-terrain.com</a><a href="buyer-guides.html">Buyer Guides</a>${ebayStoreLink}</div></div><div><div class="footer-heading">UK policies</div><div class="footer-links"><a href="uk-shipping-delivery-policy.html">Shipping</a><a href="uk-returns-refunds-policy.html">Returns</a><a href="uk-privacy-policy.html">Privacy</a><a href="uk-terms-conditions.html">Terms</a></div></div></div><div class="footer-bottom"><span>© 2026 Omni Terrain. All rights reserved.</span><span>United Kingdom · Prices include VAT · Website-first shopping</span></div></div></footer>`;
}

function scripts() {
  return `<script src="assets/shield-products.js"></script><script src="assets/uk-commerce.js"></script><script src="assets/shield-catalogue.js"></script></body></html>`;
}

function formatPrice(price) {
  return `£${price.toFixed(2)}`;
}

function categoryLabel(segment) {
  return segment === "fridges" ? "Campervan Fridges" : segment === "windows" ? "Campervan Windows" : "Blinds & Flyscreens";
}

function productCard(product, index = 99) {
  return `<article class="product-card" data-product-category="${esc(product.segment)}"><a class="product-image" href="${esc(product.slug)}"><span class="status-chip">Available now</span><img src="${esc(product.images[0])}" alt="${esc(product.title)}" width="1000" height="1000" loading="${index < 3 ? "eager" : "lazy"}" decoding="async"></a><div class="product-body"><div class="product-kicker"><b>${esc(product.brand)}</b><span>${esc(product.mpn)}</span></div><h3><a href="${esc(product.slug)}">${esc(product.title)}</a></h3><p>${esc(product.description)}</p><div class="card-price-row"><div class="card-price"><small>UK price · inc VAT</small><strong>${formatPrice(product.price)}</strong></div><a class="card-link" href="${esc(product.slug)}">View details →</a></div><div class="card-actions"><button class="button primary" type="button" data-uk-add="${esc(product.id)}">Add to cart</button></div></div></article>`;
}

function collectionSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Omni Terrain UK Available Products",
    url: `${site}/shield-autocare-uk.html`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${site}/${product.slug}`,
        name: product.title
      }))
    }
  };
}

function cataloguePage() {
  const counts = Object.fromEntries(["fridges", "windows", "blinds"].map((segment) => [segment, products.filter((product) => product.segment === segment).length]));
  const description = "Shop the currently available Omni Terrain UK campervan refrigeration, windows, blackout blinds and flyscreens with VAT-inclusive pricing and fitment guidance.";
  return `${head({
    title: "Available Campervan Fridges, Windows & Blinds UK | Omni Terrain",
    description,
    canonical: `${site}/shield-autocare-uk.html`,
    image: products[0].images[0],
    schema: [collectionSchema()]
  })}
${header("catalogue")}
<main><section class="catalogue-hero"><div class="container"><div class="catalogue-hero-shell"><div class="catalogue-hero-grid"><div><span class="eyebrow" style="color:var(--gold2)">Omni Terrain UK · Available now</span><h1>Campervan gear.<br><em>Clear fitment.</em></h1><p class="hero-copy">Browse our currently available UK range across compressor refrigeration, frameless cassette windows and blackout blind/flyscreen units. Each product page keeps price, dimensions, fitment checks and support in one place.</p><div class="hero-actions"><a class="button primary" href="#products">Shop available products →</a><a class="button light" href="uk-cart.html">View cart</a></div></div><div class="hero-seal" aria-label="Omni Terrain Road, Water, Power"><span class="hero-seal-mark">Omni</span><span class="hero-seal-sub">Terrain</span><span class="hero-seal-meta">Road / Water / Power</span></div></div><div class="hero-facts"><div class="hero-fact"><b>Available UK range</b><span>Products shown here are part of our current UK storefront.</span></div><div class="hero-fact"><b>VAT included</b><span>Customer prices displayed in GBP include UK VAT.</span></div><div class="hero-fact"><b>Fitment first</b><span>Dimensions and pre-install checks are provided before you buy.</span></div></div></div></div></section>
<section class="section white" id="products"><div class="container"><div class="section-header"><div><span class="eyebrow">Shop available products</span><h2 class="section-title">Current UK<br><em>range.</em></h2></div><p class="section-copy">Use the filters to narrow the current range. Auto Parts and Marine will be added to the wider UK storefront as those product ranges become ready.</p></div><div class="filter-row" aria-label="Product filters"><button class="filter-button" data-filter="all" aria-pressed="true">All current</button><button class="filter-button" id="fridges" data-filter="fridges" aria-pressed="false">Fridges · ${counts.fridges}</button><button class="filter-button" id="windows" data-filter="windows" aria-pressed="false">Windows · ${counts.windows}</button><button class="filter-button" id="blinds" data-filter="blinds" aria-pressed="false">Blinds &amp; Flyscreens · ${counts.blinds}</button></div><p class="filter-result" aria-live="polite">Showing <strong data-filter-count>${products.length}</strong> products</p><div class="product-grid">${products.map(productCard).join("")}</div></div></section>
<section class="section navy"><div class="container"><div class="section-header"><div><span class="eyebrow" style="color:var(--gold2)">Before buying</span><h2 class="section-title">Measure twice.<br><em>Order once.</em></h2></div><p class="section-copy">Campervan components depend on exact apertures, installation space and electrical setup. Use the checks below before committing.</p></div><div class="selection-grid"><article class="selection-card"><b>01 / SKU</b><h3>Match the part</h3><p>Use the supplier SKU and selected colour or size, not a vehicle name alone.</p></article><article class="selection-card"><b>02 / Dimensions</b><h3>Measure the space</h3><p>Compare cut-out, overall and clearance dimensions with the physical installation.</p></article><article class="selection-card"><b>03 / Installation</b><h3>Check the build</h3><p>Confirm wall, roof, wiring, ventilation and competent-fitting requirements.</p></article><article class="selection-card"><b>04 / Policies</b><h3>Review delivery & returns</h3><p>Read our UK shipping and returns information before payment so the process is clear.</p></article></div></div></section></main>
${footer(true)}<div class="mobile-draft-bar"><a href="uk-cart.html">View cart <strong><span data-uk-cart-count>0</span> item(s)</strong></a></div>${scripts()}`;
}

function productSchema(product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images.map(absolute),
    sku: product.mpn,
    mpn: product.mpn,
    category: product.category,
    brand: { "@type": "Brand", name: product.brand },
    itemCondition: "https://schema.org/NewCondition",
    offers: {
      "@type": "Offer",
      url: `${site}/${product.slug}`,
      priceCurrency: "GBP",
      price: product.price.toFixed(2),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "PRASAD INC LTD trading as Omni Terrain" }
    }
  };
}

function breadcrumbSchema(product) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Omni Terrain UK", item: `${site}/uk.html` },
      { "@type": "ListItem", position: 2, name: "Available Products", item: `${site}/shield-autocare-uk.html` },
      { "@type": "ListItem", position: 3, name: product.category, item: `${site}/shield-autocare-uk.html#${product.segment}` },
      { "@type": "ListItem", position: 4, name: product.title, item: `${site}/${product.slug}` }
    ]
  };
}

function relatedProducts(product) {
  const related = products.filter((candidate) => candidate.segment === product.segment && candidate.id !== product.id).slice(0, 3);
  return related.map(productCard).join("");
}

function productSeo(product) {
  if (product.segment === "fridges") {
    const colour = product.specs.find(([label]) => label === "Colour")?.[1] || "";
    return {
      title: `Cool Mate 70L Compressor Fridge – ${colour} | Omni Terrain UK`,
      description: `Shop the Cool Mate 70L ${colour.toLowerCase()} compressor fridge. MPN ${product.mpn}. See specifications, fitment guidance and the VAT-inclusive UK price.`
    };
  }
  if (product.segment === "windows") {
    const size = product.specs.find(([label]) => label === "Cut-out size")?.[1] || "";
    return {
      title: `Shield ${size} Frameless Campervan Window | Omni Terrain UK`,
      description: `Shop the Shield ${size} frameless campervan window with blackout blind and flyscreen. MPN ${product.mpn}. See dimensions, fitment checks and the UK price.`
    };
  }
  const size = product.specs.find(([label]) => label === "Cut-hole size")?.[1] || "";
  const colour = product.specs.find(([label]) => label === "Colour")?.[1] || "";
  return {
    title: `Shield ${size} ${colour} Campervan Blind | Omni Terrain UK`,
    description: `Shop the Shield ${size} ${colour.toLowerCase()} campervan cassette blind and flyscreen. MPN ${product.mpn}. See dimensions, fitment checks and the UK price.`
  };
}

function productPage(product) {
  const seo = productSeo(product);
  const specs = product.specs.map(([label, value]) => `<div class="spec-row"><b>${esc(label)}</b><span>${esc(value)}</span></div>`).join("");
  const gallery = product.images.map((image, index) => `<button class="gallery-thumb${index === 0 ? " active" : ""}" type="button" data-gallery-src="${esc(image)}" aria-label="Show product image ${index + 1}"><img src="${esc(image)}" alt="" width="120" height="120" loading="lazy"></button>`).join("");
  const category = categoryLabel(product.segment);
  return `${head({
    title: seo.title,
    description: seo.description,
    canonical: `${site}/${product.slug}`,
    image: product.images[0],
    schema: [productSchema(product), breadcrumbSchema(product)]
  })}
${header(product.segment)}
<main><div class="product-wrap"><div class="container"><nav class="crumbs" aria-label="Breadcrumb"><a href="uk.html">UK Home</a><span>/</span><a href="shield-autocare-uk.html">Available Products</a><span>/</span><a href="shield-autocare-uk.html#${esc(product.segment)}">${esc(category)}</a><span>/</span><span aria-current="page">${esc(product.mpn)}</span></nav><div class="product-layout"><figure class="gallery-card"><div class="gallery-main"><img id="galleryMain" src="${esc(product.images[0])}" alt="${esc(product.title)}" width="1000" height="1000" fetchpriority="high" decoding="async"></div><div class="gallery-thumbs" aria-label="Product image gallery">${gallery}</div><figcaption class="gallery-caption"><b>Supplier product imagery.</b><span>Family images may show another size; confirm the selected SKU and dimensions on this product page before ordering.</span></figcaption></figure><section class="product-info"><div class="meta-topline"><strong>${esc(product.brand)} / ${esc(product.category)}</strong><span>UK product</span></div><h1 class="product-title">${esc(product.title)}</h1><p class="product-lede">${esc(product.description)}</p><div class="quick-cards"><div class="quick-card"><b>Brand</b><span>${esc(product.brand)}</span></div><div class="quick-card"><b>Supplier SKU / MPN</b><span>${esc(product.mpn)}</span></div><div class="quick-card"><b>Fitment</b><span>Universal by configuration; checks required</span></div></div><div class="purchase-box"><div class="purchase-head"><div><span class="price-label">UK price</span><span class="price">${formatPrice(product.price)} <small>inc UK VAT</small></span></div><div class="availability"><b>Available now</b>Add this product to your Omni Terrain cart and keep the order journey on our website.</div></div><div class="purchase-actions"><button class="button primary" type="button" data-uk-add="${esc(product.id)}">Add to cart</button><button class="button light" type="button" data-uk-buy="${esc(product.id)}">Buy now</button><a class="button light" href="shield-autocare-uk.html#${esc(product.segment)}">Browse ${esc(category)}</a></div><p class="mini-note"><b>Secure checkout:</b> Your cart stays on Omni Terrain. Card checkout will be connected here when the UK payment setup is live; no card details are collected by this static page.</p></div></section></div></div></div>
<nav class="anchor-nav" aria-label="On this page"><div class="container"><div class="anchor-links"><a href="#details">Specifications</a><a href="#fitment">Fitment checks</a><a href="#related">Related products</a></div><span class="anchor-status">Omni Terrain UK product</span></div></nav>
<section class="section white" id="details"><div class="container"><div class="detail-grid"><article class="detail-card"><span class="eyebrow">Product overview</span><h2>Product details.</h2><div class="feature-list"><div class="feature"><span class="feature-mark">01</span><div><h3>What is included</h3><p>${esc(product.included)}</p></div></div><div class="feature"><span class="feature-mark">02</span><div><h3>Universal status</h3><p>${esc(product.fitment)}</p></div></div><div class="feature"><span class="feature-mark">03</span><div><h3>Verification source</h3><p>Identity and specifications were checked against the supplier product record used for this Omni Terrain product page.</p></div></div></div><a class="source-note" href="${esc(product.supplierSource)}" target="_blank" rel="noopener">View supplier product source ↗</a></article><article class="detail-card"><span class="eyebrow">Technical information</span><h2>Key specifications.</h2><div class="specs">${specs}<div class="spec-row"><b>Supplier SKU / MPN</b><span>${esc(product.mpn)}</span></div></div></article></div><section class="fitment-box" id="fitment"><div class="fitment-copy"><span class="eyebrow">Compatibility checks</span><h2>Verify before buying.</h2><p>${esc(product.fitment)}</p><div class="fitment-checks"><div class="fitment-check"><i>01</i><span>Match the supplier SKU, selected size and colour shown on this product page.</span></div><div class="fitment-check"><i>02</i><span>Measure the installation area and account for clearances before modifying a vehicle.</span></div><div class="fitment-check"><i>03</i><span>Use competent installation for cutting, sealing, structural or electrical work.</span></div><div class="fitment-check"><i>04</i><span>Review our UK delivery and returns information before payment.</span></div></div></div><aside class="fitment-panel"><span class="eyebrow" style="color:#fff">Shipping &amp; returns</span><h3>Know the process.</h3><p>Review delivery estimates, destination eligibility, damage reporting, cancellation and returns before payment. If you need product-specific help, contact Omni Terrain before ordering.</p><div class="purchase-actions"><a class="button light" href="uk-shipping-delivery-policy.html">Shipping policy</a><a class="button light" href="uk-returns-refunds-policy.html">Returns policy</a></div></aside></section></div></section>
<section class="section" id="related"><div class="container"><div class="section-header"><div><span class="eyebrow">More in ${esc(category)}</span><h2 class="section-title">Related UK<br><em>products.</em></h2></div><p class="section-copy">Compare nearby sizes or variants, then confirm the exact SKU before purchase.</p></div><div class="product-grid">${relatedProducts(product)}</div></div></section></main>
${footer()}<div class="mobile-draft-bar"><button type="button" data-uk-buy="${esc(product.id)}">Buy now <strong>${formatPrice(product.price)}</strong></button></div>${scripts()}`;
}

function cartPage() {
  const description = "Review products added to your Omni Terrain UK cart before secure checkout.";
  return `${head({
    title: "UK Cart | Omni Terrain",
    description,
    canonical: `${site}/uk-cart.html`,
    image: products[0].images[0],
    robots: "noindex,nofollow"
  })}
${header("cart")}
<main><section class="cart-hero"><div class="container"><div class="cart-hero-shell"><span class="eyebrow" style="color:var(--gold2)">Omni Terrain UK</span><h1>Your cart</h1><p>Review the products you want to buy. Your cart is stored in this browser and stays on Omni Terrain.</p></div></div></section><section class="section white"><div class="container uk-cart-layout"><div class="uk-cart-panel"><div class="section-header compact"><div><span class="eyebrow">Selected products</span><h2 class="section-title">Cart items.</h2></div></div><div id="ukCartRoot" aria-live="polite"></div></div><aside class="uk-cart-summary"><h2>Order summary</h2><div class="summary-row"><span>Items</span><strong data-uk-summary-items>0</strong></div><div class="summary-row"><span>Subtotal</span><strong data-uk-subtotal>£0.00</strong></div><p class="checkout-note">Prices shown include UK VAT. Delivery charges and the final delivery estimate will be shown before payment when secure checkout is enabled.</p><button class="button primary checkout-disabled" type="button" disabled>Secure checkout being enabled</button><a class="button light" href="shield-autocare-uk.html">Continue shopping</a><p class="mini-note">Need help before ordering? <a href="uk-contact.html"><strong>Contact UK support →</strong></a></p></aside></div></section></main>
${footer()}${scripts()}`;
}

function legacyRedirect() {
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><meta http-equiv="refresh" content="0;url=shield-autocare-uk.html"><title>Moved | Omni Terrain</title><link rel="canonical" href="${site}/shield-autocare-uk.html"></head><body><p>This page has moved to the current <a href="shield-autocare-uk.html">Omni Terrain UK catalogue</a>.</p></body></html>`;
}

function write(file, content) {
  fs.writeFileSync(path.join(root, file), `${content}\n`);
}

write("shield-autocare-uk.html", cataloguePage());
for (const product of products) write(product.slug, productPage(product));
write("uk-cart.html", cartPage());

for (const legacy of [
  "shield-400l-roof-bag.html",
  "shield-transit-custom-2-roof-bars.html",
  "shield-12v-air-compressor.html",
  "shield-7mm-insulation-10m.html",
  "shield-portable-toilet-12l.html",
  "shield-portable-toilet-20l.html",
  "shield-jet-black-roof-vent.html"
]) write(legacy, legacyRedirect());

console.log(`Generated Omni Terrain UK catalogue, ${products.length} product pages, cart and legacy redirects.`);
