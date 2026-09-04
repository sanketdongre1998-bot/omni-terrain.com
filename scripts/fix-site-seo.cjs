const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const categoryLabels = {
  automotive: "Automotive Parts & Towing",
  marine: "Marine Parts & Equipment",
  rv: "RV & Overlanding",
};

const marketPairs = {
  "index.html": "uk.html",
  "uk.html": "index.html",
  "contact-and-order-help.html": "uk-contact.html",
  "uk-contact.html": "contact-and-order-help.html",
  "shipping-delivery-policy.html": "uk-shipping-delivery-policy.html",
  "uk-shipping-delivery-policy.html": "shipping-delivery-policy.html",
  "returns-refunds-policy.html": "uk-returns-refunds-policy.html",
  "uk-returns-refunds-policy.html": "returns-refunds-policy.html",
  "privacy-policy.html": "uk-privacy-policy.html",
  "uk-privacy-policy.html": "privacy-policy.html",
  "terms-conditions.html": "uk-terms-conditions.html",
  "uk-terms-conditions.html": "terms-conditions.html",
};

const coreUsTitles = {
  "index.html": "US Auto Parts, Marine & RV Gear | Omni Terrain",
  "us-catalogue.html": "US Auto Parts, Marine & RV Catalogue | Omni Terrain",
  "deals.html": "Verified Auto & Truck Offers | Omni Terrain US",
  "buyer-guides.html": "US Auto Parts, Marine & RV Buyer Guides | Omni Terrain",
  "contact-and-order-help.html": "US Product & Order Help | Omni Terrain",
  "shipping-delivery-policy.html": "US Shipping & Delivery Policy | Omni Terrain",
  "returns-refunds-policy.html": "US Returns & Refunds Policy | Omni Terrain",
  "privacy-policy.html": "US Privacy Policy | Omni Terrain",
  "terms-conditions.html": "US Terms & Conditions | Omni Terrain",
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
  let title = `${brand} ${mpn} | ${category} | Omni Terrain US`;
  if (title.length > 80) title = `${brand} ${mpn} | Omni Terrain US`;
  return title.slice(0, 80);
}

function isUkPage(name) {
  return name === "uk.html" || name.startsWith("uk-") || name === "shield-autocare-uk.html";
}

function absoluteUrl(name) {
  return name === "index.html" ? "https://omni-terrain.com/" : `https://omni-terrain.com/${name}`;
}

function marketAlternates(name) {
  const alternate = marketPairs[name];
  if (!alternate) return "";
  const usName = isUkPage(name) ? alternate : name;
  const ukName = isUkPage(name) ? name : alternate;
  return [
    '<!-- omni-market-targeting:start -->',
    `  <link rel="alternate" hreflang="en-US" href="${absoluteUrl(usName)}">`,
    `  <link rel="alternate" hreflang="en-GB" href="${absoluteUrl(ukName)}">`,
    `  <link rel="alternate" hreflang="x-default" href="${absoluteUrl(usName)}">`,
    '<!-- omni-market-targeting:end -->',
  ].join("\n");
}

function applyMarketAlternates(html, name) {
  html = html.replace(/\s*<!-- omni-market-targeting:start -->[\s\S]*?<!-- omni-market-targeting:end -->\s*/i, "\n");
  const links = marketAlternates(name);
  if (!links) return html;
  const canonical = /<link rel="canonical" href="[^"]+">/i;
  if (!canonical.test(html)) return html;
  return html.replace(canonical, (match) => `${match}\n  ${links}`);
}

function localizeStructuredData(html, ukPage) {
  const locale = ukPage ? "en-GB" : "en-US";
  const countryCode = ukPage ? "GB" : "US";
  const countryName = ukPage ? "United Kingdom" : "United States";
  return html.replace(/(<script[^>]+type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi, (full, open, raw, close) => {
    try {
      const data = JSON.parse(raw);
      const rows = Array.isArray(data?.["@graph"]) ? data["@graph"] : [data];
      let changed = false;
      for (const row of rows) {
        const types = Array.isArray(row?.["@type"]) ? row["@type"] : [row?.["@type"]];
        if (types.includes("WebSite") || types.includes("CollectionPage")) {
          row.inLanguage = locale;
          row.audience = { "@type": "Audience", geographicArea: { "@type": "Country", name: countryName } };
          changed = true;
        }
        if (types.includes("Organization")) {
          row.areaServed = { "@type": "Country", name: countryName, identifier: countryCode };
          changed = true;
        }
      }
      return changed ? `${open}${JSON.stringify(data)}${close}` : full;
    } catch (_) {
      return full;
    }
  });
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

  const ukPage = isUkPage(name);
  html = html.replace(/<html\s+lang=["'][^"']+["']/i, `<html lang="${ukPage ? "en-GB" : "en-US"}"`);
  html = applyMarketAlternates(html, name);
  html = localizeStructuredData(html, ukPage);

  const category = name.match(/^(automotive|marine|rv)(?:-(\d+))?\.html$/);
  if (category) {
    const page = Number(category[2] || 1);
    const label = categoryLabels[category[1]];
    const title = page === 1 ? `${label} | Omni Terrain US` : `${label} — Page ${page} | Omni Terrain US`;
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${encode(title)}</title>`);
  } else if (/^us-.*\.html$/.test(name)) {
    const title = productTitle(html);
    if (title) html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${encode(title)}</title>`);
  } else if (coreUsTitles[name]) {
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${encode(coreUsTitles[name])}</title>`);
  }

  if (html !== before) {
    fs.writeFileSync(file, html);
    changed += 1;
  }
}

console.log(`SEO normalization updated ${changed} HTML files.`);
