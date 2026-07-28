const fs = require("fs");
const path = require("path");
const products = require("../assets/shield-products.js");

const root = path.resolve(__dirname, "..");
const site = "https://omni-terrain.com";
const sellerUrl = "https://www.ebay.co.uk/sch/i.html?_ssn=omniterrainuk";
const lastModified = "2026-07-28";

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
  <meta property="og:site_name" content="OMNI TERRAIN">
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
  return `<a class="brand" href="${href}" aria-label="OMNI TERRAIN UK home"><span class="wordmark"><span class="wordmark-main">OMNI</span><span class="wordmark-sub">Terrain</span><span class="wordmark-meta">Road / Water / Power</span></span></a>`;
}

function header(active = "") {
  const nav = [
    ["home", "uk.html", "UK Home"],
    ["catalogue", "shield-autocare-uk.html", "Shop UK"],
    ["fridges", "shield-autocare-uk.html#fridges", "Fridges"],
    ["windows", "shield-autocare-uk.html#windows", "Windows"],
    ["blinds", "shield-autocare-uk.html#blinds", "Blinds & Flyscreens"]
  ];
  const links = nav.map(([id, href, label]) => `<a${id === active ? ' class="active" aria-current="page"' : ""} href="${href}">${label}</a>`).join("");
  return `<body>
<div class="announcement"><div class="container"><span><strong>OMNI TERRAIN UK:</strong> 20 live campervan product listings with fitment-first information.</span><a href="${sellerUrl}" target="_blank" rel="noopener">Visit our eBay UK shop ↗</a></div></div>
<div class="market-strip"><div class="container"><span class="market-label">Store region</span><a href="index.html">United States</a><a class="market-link" href="uk.html">United Kingdom</a><span class="market-note">UK purchases are completed securely on eBay UK.</span></div></div>
<header id="header"><div class="container header-main">${wordmark()}<nav class="nav-links" aria-label="UK store navigation">${links}</nav><div class="header-actions"><a class="header-contact desktop-only" href="uk-contact.html">UK Help</a><button class="menu-btn" id="menuToggle" aria-expanded="false" aria-controls="mobileNav">Menu</button></div></div>
<nav class="mobile-nav" id="mobileNav" aria-label="UK store mobile navigation"><a href="uk.html">UK Home</a><a href="shield-autocare-uk.html">All 20 Products</a><a href="shield-autocare-uk.html#fridges">Campervan Fridges</a><a href="shield-autocare-uk.html#windows">Campervan Windows</a><a href="shield-autocare-uk.html#blinds">Blinds &amp; Flyscreens</a><a href="uk-contact.html">UK Contact &amp; Help</a><a href="${sellerUrl}" target="_blank" rel="noopener">eBay UK Shop ↗</a></nav></header>
<div class="draft-strip"><div class="container"><span class="draft-pill">Live on eBay UK</span><span>Website payments are not enabled. Current price, stock, delivery and returns are controlled by each linked eBay listing.</span></div></div>`;
}

function footer() {
  return `<footer><div class="container"><div class="footer-grid"><div>${wordmark()}<p class="footer-copy">Campervan refrigeration, windows, blackout blinds and flyscreens with clear dimensions and direct links to OMNI Terrain's eBay UK listings.</p><p class="legal-note"><strong>UK operator:</strong> PRASAD INC LTD · Company No. 07981226 · VAT GB 433306133 · EORI GB433306133000 · 19 Stones Avenue, Dartford, England, DA1 5GS</p></div><div><div class="footer-heading">Shop UK</div><div class="footer-links"><a href="shield-autocare-uk.html">All 20 Products</a><a href="shield-autocare-uk.html#fridges">Fridges</a><a href="shield-autocare-uk.html#windows">Windows</a><a href="shield-autocare-uk.html#blinds">Blinds &amp; Flyscreens</a></div></div><div><div class="footer-heading">UK support</div><div class="footer-links"><a href="uk-contact.html">Contact &amp; Order Help</a><a href="${sellerUrl}" target="_blank" rel="noopener">eBay UK Shop ↗</a><a href="mailto:support@omni-terrain.com">support@omni-terrain.com</a><a href="buyer-guides.html">Buyer Guides</a></div></div><div><div class="footer-heading">UK policies</div><div class="footer-links"><a href="uk-shipping-delivery-policy.html">Shipping</a><a href="uk-returns-refunds-policy.html">Returns</a><a href="uk-privacy-policy.html">Privacy</a><a href="uk-terms-conditions.html">Terms</a></div></div></div><div class="footer-bottom"><span>© 2026 OMNI TERRAIN. All rights reserved.</span><span>United Kingdom · Prices include VAT · Checkout on eBay UK</span></div></div></footer>`;
}

function scripts() {
  return `<script src="assets/shield-catalogue.js"></script></body></html>`;
}

function formatPrice(price) {
  return `£${price.toFixed(2)}`;
}

function categoryLabel(segment) {
  return segment === "fridges" ? "Campervan Fridges" : segment === "windows" ? "Campervan Windows" : "Blinds & Flyscreens";
}

function productCard(product, index) {
  return `<article class="product-card" data-product-category="${esc(product.segment)}"><a class="product-image" href="${esc(product.slug)}"><span class="status-chip">Live on eBay UK</span><img src="${esc(product.images[0])}" alt="${esc(product.title)}" width="1000" height="1000" loading="${index < 3 ? "eager" : "lazy"}" decoding="async"></a><div class="product-body"><div class="product-kicker"><b>${esc(product.brand)}</b><span>${esc(product.mpn)}</span></div><h3><a href="${esc(product.slug)}">${esc(product.title)}</a></h3><p>${esc(product.description)}</p><div class="card-price-row"><div class="card-price"><small>Current eBay price · inc VAT</small><strong>${formatPrice(product.price)}</strong></div><a class="card-link" href="${esc(product.slug)}">View details →</a></div></div></article>`;
}

function collectionSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "OMNI Terrain UK Campervan Products",
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
  const description = "Shop 20 OMNI Terrain UK campervan fridges, frameless windows, blackout blinds and flyscreens. VAT-inclusive prices and direct eBay UK listing links.";
  return `${head({
    title: "Campervan Fridges, Windows & Blinds UK | OMNI Terrain",
    description,
    canonical: `${site}/shield-autocare-uk.html`,
    image: products[0].images[0],
    schema: [collectionSchema()]
  })}
${header("catalogue")}
<main><section class="catalogue-hero"><div class="container"><div class="catalogue-hero-shell"><div class="catalogue-hero-grid"><div><span class="eyebrow" style="color:var(--gold2)">OMNI Terrain UK catalogue</span><h1>Campervan gear.<br><em>Clear fitment.</em></h1><p class="hero-copy">Browse 20 live UK listings across compressor refrigeration, frameless cassette windows and blackout blind/flyscreen units. Every page includes the exact supplier SKU, verified dimensions and a direct eBay UK link.</p><div class="hero-actions"><a class="button primary" href="#products">Shop all 20 products →</a><a class="button light" href="${sellerUrl}" target="_blank" rel="noopener">Open eBay UK shop ↗</a></div></div><div class="hero-seal" aria-label="OMNI TERRAIN Road, Water, Power"><span class="hero-seal-mark">OMNI</span><span class="hero-seal-sub">Terrain</span><span class="hero-seal-meta">Road / Water / Power</span></div></div><div class="hero-facts"><div class="hero-fact"><b>20 live listings</b><span>Exact OMNI Terrain eBay UK item links.</span></div><div class="hero-fact"><b>VAT included</b><span>Customer prices displayed in GBP.</span></div><div class="hero-fact"><b>Fitment first</b><span>Dimensions and pre-install checks on every page.</span></div></div></div></div></section>
<section class="section white" id="products"><div class="container"><div class="section-header"><div><span class="eyebrow">Shop UK campervan products</span><h2 class="section-title">All current<br><em>UK listings.</em></h2></div><p class="section-copy">Use the filters to narrow the catalogue. Current price, availability, delivery and return settings must be rechecked on eBay before purchase.</p></div><div class="filter-row" aria-label="Product filters"><button class="filter-button" data-filter="all" aria-pressed="true">All 20</button><button class="filter-button" id="fridges" data-filter="fridges" aria-pressed="false">Fridges · ${counts.fridges}</button><button class="filter-button" id="windows" data-filter="windows" aria-pressed="false">Windows · ${counts.windows}</button><button class="filter-button" id="blinds" data-filter="blinds" aria-pressed="false">Blinds &amp; Flyscreens · ${counts.blinds}</button></div><p class="filter-result" aria-live="polite">Showing <strong data-filter-count>20</strong> products</p><div class="product-grid">${products.map(productCard).join("")}</div></div></section>
<section class="section navy"><div class="container"><div class="section-header"><div><span class="eyebrow" style="color:var(--gold2)">Before buying</span><h2 class="section-title">Measure twice.<br><em>Order once.</em></h2></div><p class="section-copy">Campervan components depend on exact apertures, installation space and electrical setup. Use the checks below before committing.</p></div><div class="selection-grid"><article class="selection-card"><b>01 / SKU</b><h3>Match the part</h3><p>Use the supplier SKU and selected colour or size, not a vehicle name alone.</p></article><article class="selection-card"><b>02 / Dimensions</b><h3>Measure the space</h3><p>Compare cut-out, overall and clearance dimensions with the physical installation.</p></article><article class="selection-card"><b>03 / Installation</b><h3>Check the build</h3><p>Confirm wall, roof, wiring, ventilation and competent-fitting requirements.</p></article><article class="selection-card"><b>04 / eBay terms</b><h3>Review checkout</h3><p>Recheck live price, stock, delivery and returns on the linked listing.</p></article></div></div></section></main>
${footer()}<div class="mobile-draft-bar"><a href="${sellerUrl}" target="_blank" rel="noopener">Shop on <strong>eBay UK ↗</strong></a></div>${scripts()}`;
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
      url: product.ebayUrl,
      priceCurrency: "GBP",
      price: product.price.toFixed(2),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "PRASAD INC LTD trading as OMNI Terrain" }
    }
  };
}

function breadcrumbSchema(product) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "OMNI Terrain UK", item: `${site}/uk.html` },
      { "@type": "ListItem", position: 2, name: "UK Catalogue", item: `${site}/shield-autocare-uk.html` },
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
      title: `Cool Mate 70L Compressor Fridge – ${colour} | OMNI Terrain UK`,
      description: `Shop the Cool Mate 70L ${colour.toLowerCase()} compressor fridge. MPN ${product.mpn}. See verified specifications, fitment guidance and the current VAT-inclusive eBay UK price.`
    };
  }
  if (product.segment === "windows") {
    const size = product.specs.find(([label]) => label === "Cut-out size")?.[1] || "";
    return {
      title: `Shield ${size} Frameless Campervan Window | OMNI Terrain UK`,
      description: `Shop the Shield ${size} frameless campervan window with blackout blind and flyscreen. MPN ${product.mpn}. See dimensions and the current eBay UK price.`
    };
  }
  const size = product.specs.find(([label]) => label === "Cut-hole size")?.[1] || "";
  const colour = product.specs.find(([label]) => label === "Colour")?.[1] || "";
  return {
    title: `Shield ${size} ${colour} Campervan Blind | OMNI Terrain UK`,
    description: `Shop the Shield ${size} ${colour.toLowerCase()} campervan cassette blind and flyscreen. MPN ${product.mpn}. See dimensions and the current eBay UK price.`
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
<main><div class="product-wrap"><div class="container"><nav class="crumbs" aria-label="Breadcrumb"><a href="uk.html">UK Home</a><span>/</span><a href="shield-autocare-uk.html">UK Catalogue</a><span>/</span><a href="shield-autocare-uk.html#${esc(product.segment)}">${esc(category)}</a><span>/</span><span aria-current="page">${esc(product.mpn)}</span></nav><div class="product-layout"><figure class="gallery-card"><div class="gallery-main"><img id="galleryMain" src="${esc(product.images[0])}" alt="${esc(product.title)}" width="1000" height="1000" fetchpriority="high" decoding="async"></div><div class="gallery-thumbs" aria-label="Product image gallery">${gallery}</div><figcaption class="gallery-caption"><b>Supplier product imagery.</b><span>Family images may show another size; confirm the selected SKU and dimensions on the live listing.</span></figcaption></figure><section class="product-info"><div class="meta-topline"><strong>${esc(product.brand)} / ${esc(product.category)}</strong><span>eBay item ${esc(product.ebayItemId)}</span></div><h1 class="product-title">${esc(product.title)}</h1><p class="product-lede">${esc(product.description)}</p><div class="quick-cards"><div class="quick-card"><b>Brand</b><span>${esc(product.brand)}</span></div><div class="quick-card"><b>Supplier SKU / MPN</b><span>${esc(product.mpn)}</span></div><div class="quick-card"><b>Fitment</b><span>Universal by configuration; checks required</span></div></div><div class="purchase-box"><div class="purchase-head"><div><span class="price-label">Current eBay UK price</span><span class="price">${formatPrice(product.price)} <small>inc UK VAT</small></span></div><div class="availability"><b>Available on eBay UK</b>Price and listing status checked 28 July 2026.</div></div><div class="purchase-actions"><a class="button primary" href="${esc(product.ebayUrl)}" target="_blank" rel="noopener">View current eBay listing ↗</a><a class="button light" href="shield-autocare-uk.html#${esc(product.segment)}">Browse ${esc(category)}</a></div><p class="mini-note"><b>Checkout notice:</b> OMNI Terrain does not take UK payment on this website. The linked eBay listing controls the current price, stock, delivery estimate, payment and returns terms.</p></div></section></div></div></div>
<nav class="anchor-nav" aria-label="On this page"><div class="container"><div class="anchor-links"><a href="#details">Specifications</a><a href="#fitment">Fitment checks</a><a href="#related">Related products</a></div><span class="anchor-status">Live eBay UK listing</span></div></nav>
<section class="section white" id="details"><div class="container"><div class="detail-grid"><article class="detail-card"><span class="eyebrow">Product overview</span><h2>Factual product details.</h2><div class="feature-list"><div class="feature"><span class="feature-mark">01</span><div><h3>What is included</h3><p>${esc(product.included)}</p></div></div><div class="feature"><span class="feature-mark">02</span><div><h3>Universal status</h3><p>${esc(product.fitment)}</p></div></div><div class="feature"><span class="feature-mark">03</span><div><h3>Verification sources</h3><p>Identity and specifications were checked against the supplier product record and the live OMNI Terrain eBay UK listing.</p></div></div></div><a class="source-note" href="${esc(product.supplierSource)}" target="_blank" rel="noopener">View Shield Autocare product source ↗</a></article><article class="detail-card"><span class="eyebrow">Technical information</span><h2>Key specifications.</h2><div class="specs">${specs}<div class="spec-row"><b>Supplier SKU / MPN</b><span>${esc(product.mpn)}</span></div><div class="spec-row"><b>eBay item number</b><span>${esc(product.ebayItemId)}</span></div></div></article></div><section class="fitment-box" id="fitment"><div class="fitment-copy"><span class="eyebrow">Compatibility checks</span><h2>Verify before buying.</h2><p>${esc(product.fitment)}</p><div class="fitment-checks"><div class="fitment-check"><i>01</i><span>Match the supplier SKU, selected size and colour on the live eBay listing.</span></div><div class="fitment-check"><i>02</i><span>Measure the installation area and account for clearances before modifying a vehicle.</span></div><div class="fitment-check"><i>03</i><span>Use competent installation for cutting, sealing, structural or electrical work.</span></div><div class="fitment-check"><i>04</i><span>Review the eBay listing's current delivery and returns terms before payment.</span></div></div></div><aside class="fitment-panel"><span class="eyebrow" style="color:#fff">Shipping &amp; returns</span><h3>Check the live listing.</h3><p>Delivery service, destination exclusions, damage reporting and returns are governed by the eBay transaction and the exact listing terms displayed at checkout. For order-specific help, contact OMNI Terrain through eBay messages.</p><a class="button light" href="${esc(product.ebayUrl)}" target="_blank" rel="noopener">Review eBay terms ↗</a></aside></section></div></section>
<section class="section" id="related"><div class="container"><div class="section-header"><div><span class="eyebrow">More in ${esc(category)}</span><h2 class="section-title">Related UK<br><em>products.</em></h2></div><p class="section-copy">Compare nearby sizes or variants, then confirm the exact SKU before purchase.</p></div><div class="product-grid">${relatedProducts(product)}</div></div></section></main>
${footer()}<div class="mobile-draft-bar"><a href="${esc(product.ebayUrl)}" target="_blank" rel="noopener">View on <strong>eBay UK ↗</strong></a></div>${scripts()}`;
}

function ukHomePage() {
  const featured = [products[0], products[2], products[8], products[16]];
  const description = "OMNI Terrain UK campervan shop with 20 live eBay UK listings for compressor fridges, frameless windows, blackout blinds and flyscreens.";
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "OMNI Terrain UK",
    url: `${site}/uk.html`,
    publisher: {
      "@type": "Organization",
      name: "PRASAD INC LTD trading as OMNI Terrain",
      identifier: "07981226",
      address: {
        "@type": "PostalAddress",
        streetAddress: "19 Stones Avenue",
        addressLocality: "Dartford",
        postalCode: "DA1 5GS",
        addressCountry: "GB"
      }
    }
  };
  return `${head({
    title: "OMNI Terrain UK | Campervan Fridges, Windows & Blinds",
    description,
    canonical: `${site}/uk.html`,
    image: products[0].images[0],
    schema: [websiteSchema]
  })}
${header("home")}
<main><section class="catalogue-hero"><div class="container"><div class="catalogue-hero-shell"><div class="catalogue-hero-grid"><div><span class="eyebrow" style="color:var(--gold2)">OMNI Terrain United Kingdom</span><h1>Built for van,<br>camp &amp; <em>road.</em></h1><p class="hero-copy">A focused UK storefront for campervan refrigeration, windows, blackout blinds and flyscreens. Browse 20 current products here, then complete payment securely through OMNI Terrain on eBay UK.</p><div class="hero-actions"><a class="button primary" href="shield-autocare-uk.html">Shop all 20 products →</a><a class="button light" href="${sellerUrl}" target="_blank" rel="noopener">Visit eBay UK shop ↗</a></div></div><a class="hero-feature" href="${esc(products[0].slug)}"><span class="status-chip">Featured UK listing</span><img src="${esc(products[0].images[0])}" alt="${esc(products[0].title)}" width="1000" height="1000"><b>${esc(products[0].title)}</b><small>${formatPrice(products[0].price)} inc VAT · View details →</small></a></div><div class="hero-facts"><div class="hero-fact"><b>20 products</b><span>All linked to current eBay UK listings.</span></div><div class="hero-fact"><b>3 categories</b><span>Fridges, windows, blinds and flyscreens.</span></div><div class="hero-fact"><b>UK business seller</b><span>Operated by PRASAD INC LTD.</span></div></div></div></div></section>
<section class="section white"><div class="container"><div class="section-header"><div><span class="eyebrow">Shop by category</span><h2 class="section-title">Simple product<br><em>paths.</em></h2></div><p class="section-copy">Start by product type, then compare exact dimensions, colour and supplier SKU.</p></div><div class="uk-category-grid"><a href="shield-autocare-uk.html#fridges"><span>02 products</span><h3>Campervan Fridges</h3><p>70L AC/DC compressor refrigeration in black or silver.</p><b>Browse fridges →</b></a><a href="shield-autocare-uk.html#windows"><span>06 products</span><h3>Frameless Windows</h3><p>Six cut-out sizes with integrated blackout blind and flyscreen.</p><b>Browse windows →</b></a><a href="shield-autocare-uk.html#blinds"><span>12 products</span><h3>Blinds &amp; Flyscreens</h3><p>Black, white and beige cassette units across five sizes.</p><b>Browse blinds →</b></a></div></div></section>
<section class="section"><div class="container"><div class="section-header"><div><span class="eyebrow">Featured UK products</span><h2 class="section-title">Current live<br><em>listings.</em></h2></div><p class="section-copy">VAT-inclusive prices were checked against the public OMNI Terrain eBay UK shop on 28 July 2026.</p></div><div class="product-grid">${featured.map(productCard).join("")}</div><div class="section-action"><a class="button primary" href="shield-autocare-uk.html">View all 20 UK products →</a></div></div></section>
<section class="section navy"><div class="container"><div class="section-header"><div><span class="eyebrow" style="color:var(--gold2)">Transparent checkout</span><h2 class="section-title">Browse here.<br><em>Pay on eBay.</em></h2></div><p class="section-copy">The OMNI Terrain website provides structured product information and fitment guidance. UK checkout, payment and order records currently remain on eBay UK.</p></div><div class="selection-grid"><article class="selection-card"><b>01 / Browse</b><h3>Compare clearly</h3><p>See exact SKU, size, colour, specifications and fitment notes.</p></article><article class="selection-card"><b>02 / Verify</b><h3>Check the listing</h3><p>Open the matching OMNI Terrain eBay item and recheck current terms.</p></article><article class="selection-card"><b>03 / Pay</b><h3>Use eBay checkout</h3><p>Complete payment through the secure marketplace checkout.</p></article><article class="selection-card"><b>04 / Support</b><h3>Message the seller</h3><p>Use eBay messages for order-linked delivery or return help.</p></article></div></div></section></main>
${footer()}<div class="mobile-draft-bar"><a href="shield-autocare-uk.html">Shop <strong>20 UK products</strong></a></div>${scripts()}`;
}

function policyPage({ filename, title, description, intro, cards }) {
  const canonical = `${site}/${filename}`;
  return `${head({ title: `${title} | OMNI Terrain UK`, description, canonical })}
${header()}
<main class="policy-wrap"><div class="container"><section class="policy-hero"><span class="eyebrow" style="color:var(--gold2)">OMNI Terrain United Kingdom</span><h1>${esc(title)}</h1><p>${esc(intro)}</p><div class="policy-meta"><span>PRASAD INC LTD</span><span>Company No. 07981226</span><span>Last reviewed 28 July 2026</span></div></section><div class="policy-grid">${cards.map((card) => `<article class="policy-card${card.full ? " full" : ""}"><h2>${esc(card.title)}</h2>${card.html}</article>`).join("")}</div><div class="policy-callout"><strong>Marketplace purchases:</strong> For a product bought through eBay UK, the live item page, eBay checkout record and applicable marketplace protections form part of the transaction. Use the eBay order or message thread for order-specific help.</div></div></main>
${footer()}${scripts()}`;
}

function legacyRedirect() {
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${site}/shield-autocare-uk.html"><meta http-equiv="refresh" content="0;url=shield-autocare-uk.html"><title>UK Catalogue Moved | OMNI Terrain</title></head><body><p>This earlier product preview has moved to the <a href="shield-autocare-uk.html">current OMNI Terrain UK catalogue</a>.</p></body></html>`;
}

function write(filename, content) {
  fs.writeFileSync(path.join(root, filename), content);
}

write("uk.html", ukHomePage());
write("shield-autocare-uk.html", cataloguePage());
for (const product of products) write(product.slug, productPage(product));

write("uk-contact.html", policyPage({
  filename: "uk-contact.html",
  title: "UK Contact & Order Help",
  description: "Contact OMNI Terrain UK for campervan product guidance or use eBay messages for an existing order.",
  intro: "Use the route that matches your question so product guidance and order-linked support stay clear.",
  cards: [
    { title: "Product guidance", html: '<p>For pre-purchase questions about dimensions, SKU selection or installation considerations, email <a href="mailto:support@omni-terrain.com"><strong>support@omni-terrain.com</strong></a>.</p>' },
    { title: "Existing eBay order", html: `<p>Open the order in your eBay account and choose “Contact seller”. This keeps the item number, delivery record and message history together.</p><p><a class="button primary" href="${sellerUrl}" target="_blank" rel="noopener">Open OMNI Terrain on eBay UK ↗</a></p>` },
    { title: "Business identity", full: true, html: "<p><strong>PRASAD INC LTD trading as OMNI Terrain</strong><br>Company No. 07981226 · VAT GB 433306133 · EORI GB433306133000<br>Registered office: 19 Stones Avenue, Dartford, England, DA1 5GS.</p><p>This registered office is also the initial returns contact address recorded for the UK operation. Do not send an item without first opening the appropriate eBay return or support request.</p>" }
  ]
}));

write("uk-shipping-delivery-policy.html", policyPage({
  filename: "uk-shipping-delivery-policy.html",
  title: "UK Shipping & Delivery",
  description: "OMNI Terrain UK shipping guidance for products purchased through its eBay UK listings.",
  intro: "The exact eBay listing and checkout show the current delivery service, destination eligibility and any applicable surcharge.",
  cards: [
    { title: "Current fulfilment route", html: "<p>Current Shield products are recorded for dispatch from Bradford, West Yorkshire, BD3 9QP. Tracking and the delivery estimate are provided through the eBay order when available.</p>" },
    { title: "Destination checks", html: "<p>UK mainland delivery and any Highlands, islands or remote-area surcharge must be checked on the exact listing before payment. Do not rely on a general website statement where the eBay checkout shows different terms.</p>" },
    { title: "Damage or delay", full: true, html: "<p>Use the eBay order page to report non-delivery, visible transit damage or an incorrect item promptly. Keep packaging, labels and photographs where relevant, and do not install a visibly damaged product before receiving guidance.</p>" }
  ]
}));

write("uk-returns-refunds-policy.html", policyPage({
  filename: "uk-returns-refunds-policy.html",
  title: "UK Returns & Refunds",
  description: "OMNI Terrain UK returns guidance for orders completed through eBay UK.",
  intro: "Return eligibility, timing, postage and instructions must be checked on the exact eBay order because product and marketplace terms can vary.",
  cards: [
    { title: "Start through eBay", html: "<p>Open a return or contact the seller from the eBay purchase record before sending anything. This creates the correct item-linked record and provides the current return instructions.</p>" },
    { title: "Fitment-sensitive items", html: "<p>Check dimensions before cutting, drilling, sealing, wiring or installing. Installed, modified, damaged or incomplete products may need additional review, subject to statutory rights and the applicable eBay terms.</p>" },
    { title: "Initial return contact", full: true, html: "<p>The UK operation currently records PRASAD INC LTD, 19 Stones Avenue, Dartford, Kent, DA1 5GS as its initial returns contact. Do not send a parcel there without first receiving the item-specific eBay return instructions.</p><p>The public eBay search result and individual item views currently show inconsistent return wording. Customers should rely on the terms shown in their exact checkout and order record, and OMNI Terrain should correct the marketplace-policy mismatch.</p>" }
  ]
}));

write("uk-privacy-policy.html", policyPage({
  filename: "uk-privacy-policy.html",
  title: "UK Privacy",
  description: "Privacy information for OMNI Terrain UK website visitors and eBay UK customers.",
  intro: "This static website does not run a customer account or UK payment checkout. Product purchases currently take place on eBay UK.",
  cards: [
    { title: "Website browsing", html: "<p>The UK catalogue is a static website. It does not request card details, create a customer account or submit an order form. Standard hosting logs may record technical information such as IP address, browser and requested page.</p>" },
    { title: "Email enquiries", html: "<p>If you email support, the information you provide is used to respond to the enquiry and maintain a reasonable support record. Do not send payment-card details by email.</p>" },
    { title: "eBay transactions", full: true, html: "<p>eBay processes marketplace accounts, checkout and payment under its own privacy terms. OMNI Terrain receives the customer and order information made available to the business seller for fulfilment, support, returns, fraud prevention and legal record-keeping.</p><p>Privacy questions can be sent to <a href=\"mailto:support@omni-terrain.com\"><strong>support@omni-terrain.com</strong></a>.</p>" }
  ]
}));

write("uk-terms-conditions.html", policyPage({
  filename: "uk-terms-conditions.html",
  title: "UK Website Terms",
  description: "Terms for using the OMNI Terrain UK catalogue and following its links to eBay UK.",
  intro: "The website provides product information and links to current marketplace listings; it does not itself accept UK payment or create an order.",
  cards: [
    { title: "Product information", html: "<p>Dimensions, specifications and supplier SKUs are provided to support comparison. Customers must verify the selected variant and installation requirements before purchase, particularly before modifying a vehicle.</p>" },
    { title: "Price and availability", html: "<p>Website prices are VAT-inclusive snapshots checked on 28 July 2026. The live eBay listing controls the current price, stock, delivery estimate and checkout terms.</p>" },
    { title: "Business and transaction", full: true, html: "<p>The UK operation is PRASAD INC LTD trading as OMNI Terrain, Company No. 07981226, registered at 19 Stones Avenue, Dartford, England, DA1 5GS. A purchase made through eBay is subject to the exact listing, checkout information, applicable eBay terms and the customer's statutory rights.</p><p>Brand names and product marks belong to their respective owners. Their use identifies genuine products and does not by itself claim authorised-dealer status.</p>" }
  ]
}));

for (const legacy of [
  "shield-400l-roof-bag.html",
  "shield-transit-custom-2-roof-bars.html",
  "shield-12v-air-compressor.html",
  "shield-7mm-insulation-10m.html",
  "shield-portable-toilet-12l.html",
  "shield-portable-toilet-20l.html",
  "shield-jet-black-roof-vent.html"
]) write(legacy, legacyRedirect());

console.log(`Generated OMNI Terrain UK home, catalogue, ${products.length} product pages and five UK support/policy pages.`);
