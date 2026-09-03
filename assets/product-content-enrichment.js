(() => {
  "use strict";
  if (window.__OMNI_PRODUCT_CONTENT_ENRICHMENT__) return;
  if (!document.querySelector(".product-layout") || !document.querySelector(".product-copy")) return;
  window.__OMNI_PRODUCT_CONTENT_ENRICHMENT__ = true;

  const file = decodeURIComponent(String(location.pathname || "").split("/").filter(Boolean).pop() || "").toLowerCase();
  const copy = document.querySelector(".product-copy");
  const layout = document.querySelector(".product-layout");
  const visual = document.querySelector(".product-visual");
  const manualDetail = !!document.querySelector(".product-detail-section:not([data-ot-auto-content])");

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));
  const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
  const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const truncate = (value, max) => {
    const text = clean(value);
    if (text.length <= max) return text;
    const cut = text.slice(0, max + 1).replace(/\s+\S*$/, "").replace(/[\s,;:–—-]+$/, "");
    return `${cut || text.slice(0, max).trim()}…`;
  };
  const departmentFor = (product) => product.segment === "marine" ? "Marine Parts & Equipment" : product.segment === "rv" ? "RV & Overlanding" : "Automotive Parts & Towing";

  function productSchemaNode() {
    for (const node of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const value = JSON.parse(node.textContent || "{}");
        if (value && value["@type"] === "Product") return { node, value };
      } catch (_) {}
    }
    return { node: null, value: {} };
  }

  function coreTitle(product) {
    let value = clean(product.title);
    const mpn = clean(product.mpn);
    const brand = clean(product.brand);
    if (mpn) value = value.replace(new RegExp(`\\s*[—–-]\\s*MPN\\s*${escapeRegExp(mpn)}\\s*$`, "i"), "");
    if (brand) value = value.replace(new RegExp(`^${escapeRegExp(brand)}\\s+`, "i"), "");
    value = value
      .replace(/\bLEVEL KIT\b/gi, "Leveling Kit")
      .replace(/\bHITCH LOCK\b/gi, "Hitch Lock")
      .replace(/\bRECEIVER LOCK\b/gi, "Receiver Lock")
      .replace(/\bBIKE RACK\b/gi, "Bike Rack")
      .replace(/\bTRAILER HITCH\b/gi, "Trailer Hitch")
      .replace(/\bF150\b/g, "F-150")
      .replace(/\bF250\b/g, "F-250")
      .replace(/\bF350\b/g, "F-350")
      .replace(/\bF450\b/g, "F-450")
      .replace(/Silverado\s*\/\s*sierra/gi, "Silverado / Sierra")
      .replace(/\s+/g, " ")
      .trim();
    return value || clean(product.title) || `MPN ${mpn}`;
  }

  function parseExactFields(product) {
    const text = clean(product.description);
    const match = (regex) => clean(text.match(regex)?.[1] || "");
    const upc = match(/\bUPC\s+([^;,.]+(?:[A-Za-z0-9-]*))/i);
    const weight = match(/listed\s+(?:package\s+)?weight\s+([^;]+?)(?=;|\.\s|$)/i);
    const dimensions = match(/listed\s+(?:package\s+)?dimensions\s+(.+?)(?=\.\s+(?:Fitment|Verify)|;|$)/i);
    let length = "", width = "", height = "";
    if (dimensions) {
      const d = dimensions.match(/L\s*([^×x]+?)\s*(?:×|x)\s*W\s*([^×x]+?)\s*(?:×|x)\s*H\s*(.+)$/i);
      if (d) [length, width, height] = d.slice(1).map(clean);
    }
    return { upc, weight, dimensions, length, width, height };
  }

  function buildDescription(product, core, exact) {
    const brand = clean(product.brand);
    const mpn = clean(product.mpn);
    const identity = `${brand} ${mpn}`.trim();
    const parts = [`${identity} is listed as ${core}.`];
    if (exact.upc) parts.push(`UPC ${exact.upc}.`);
    if (exact.weight || exact.dimensions) {
      const packageBits = [];
      if (exact.weight) packageBits.push(`listed package weight ${exact.weight}`);
      if (exact.dimensions) packageBits.push(`listed package dimensions ${exact.dimensions}`);
      parts.push(`${packageBits.join(" and ")}.`);
    }
    parts.push("Review the item specifics below and confirm exact vehicle or application compatibility and installation requirements before ordering.");
    return parts.join(" ");
  }

  function buildMeta(product, core, exact) {
    const bits = [`${clean(product.brand)} ${clean(product.mpn)} – ${core}.`];
    if (exact.upc) bits.push(`UPC ${exact.upc}.`);
    if (exact.weight || exact.dimensions) bits.push("View package specifications and product details.");
    bits.push("Confirm application before ordering.");
    return truncate(bits.join(" "), 158);
  }

  function buildSpecifics(product, core, exact, schema) {
    const rows = [
      ["Brand", clean(product.brand)],
      ["Manufacturer part number", clean(product.mpn)],
      ["SKU", clean(product.id)],
      ["Department", departmentFor(product)],
      ["Product / application", core],
      ["UPC", exact.upc],
      ["Listed package weight", exact.weight],
      ["Listed package dimensions", exact.dimensions],
      ["Package length", exact.length],
      ["Package width", exact.width],
      ["Package height", exact.height],
      ["Condition", String(schema.itemCondition || "").includes("NewCondition") ? "New" : ""]
    ];
    const seen = new Set();
    return rows.filter(([label, value]) => {
      const key = `${label}:${clean(value)}`;
      if (!clean(value) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function setMeta(name, content) {
    let node = document.querySelector(`meta[name="${name}"]`);
    if (!node) {
      node = document.createElement("meta");
      node.setAttribute("name", name);
      document.head.appendChild(node);
    }
    node.setAttribute("content", content);
  }

  function updateSchema(schemaNode, schema, product, title, description, specifics) {
    if (!schemaNode) return;
    schema.name = title;
    schema.description = description;
    schema.brand = { "@type": "Brand", name: clean(product.brand) };
    schema.mpn = clean(product.mpn);
    schema.sku = clean(product.id);
    schema.category = departmentFor(product);
    const properties = specifics
      .filter(([label]) => !["Brand", "Manufacturer part number", "SKU", "Department", "Condition"].includes(label))
      .map(([label, value]) => ({ "@type": "PropertyValue", name: label, value }));
    if (properties.length) schema.additionalProperty = properties;
    schemaNode.textContent = JSON.stringify(schema).replace(/</g, "\\u003c");
  }

  function renderFacts(specifics) {
    let facts = copy.querySelector(".facts");
    if (!facts) {
      facts = document.createElement("div");
      facts.className = "facts";
      copy.appendChild(facts);
    }
    const primary = specifics.filter(([label]) => ["Brand", "Manufacturer part number", "SKU", "UPC", "Listed package weight", "Department"].includes(label)).slice(0, 6);
    facts.innerHTML = primary.map(([label, value]) => `<div class="fact"><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`).join("");
  }

  function renderDetail(product, title, description, specifics) {
    if (manualDetail || document.querySelector('.product-detail-section[data-ot-auto-content="true"]')) return;
    const section = document.createElement("section");
    section.className = "product-detail-section ot-auto-product-detail";
    section.dataset.otAutoContent = "true";
    section.setAttribute("aria-label", "Product description and item specifics");
    section.innerHTML = `
      <div class="ot-product-detail-heading"><span>Product information</span><h2>${esc(title)} details</h2></div>
      <h3>Item description</h3>
      <p>${esc(description)}</p>
      <h3>Item specifics / specifications</h3>
      <div class="spec-grid">${specifics.map(([label, value]) => `<div class="spec-item"><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`).join("")}</div>
      <div class="fitment-warning"><strong>Compatibility note:</strong> Product titles and specifications use supplier/manufacturer catalogue data. Confirm the exact vehicle, trim, configuration or application before ordering when compatibility is relevant.</div>`;
    layout.insertAdjacentElement("afterend", section);
  }

  function findCurrentProduct(products) {
    return products.find((product) => clean(product?.slug).toLowerCase() === file) || null;
  }

  function apply(product) {
    if (!product) return;
    const schemaEntry = productSchemaNode();
    const schema = schemaEntry.value || {};
    const core = coreTitle(product);
    const exact = parseExactFields(product);
    const keywordTitle = `${clean(product.brand)} ${clean(product.mpn)} – ${core}`.replace(/\s+/g, " ").trim();
    const description = buildDescription(product, core, exact);
    const specifics = buildSpecifics(product, core, exact, schema);

    if (!manualDetail) {
      document.title = truncate(keywordTitle, 70);
      setMeta("description", buildMeta(product, core, exact));
      const h1 = copy.querySelector("h1");
      if (h1) h1.textContent = keywordTitle;
      let paragraph = copy.querySelector(":scope > p.product-description") || copy.querySelector(":scope > p:not(:has(a.button))");
      if (!paragraph) {
        paragraph = document.createElement("p");
        const h1Node = copy.querySelector("h1");
        if (h1Node) h1Node.insertAdjacentElement("afterend", paragraph); else copy.prepend(paragraph);
      }
      paragraph.classList.add("product-description");
      paragraph.textContent = description;
      if (visual?.querySelector("img")) visual.querySelector("img").alt = `${clean(product.brand)} ${clean(product.mpn)} ${core}`;
      updateSchema(schemaEntry.node, schema, product, keywordTitle, description, specifics);
      renderFacts(specifics);
    }
    renderDetail(product, keywordTitle, description, specifics);
  }

  function useProducts() {
    if (Array.isArray(window.OMNI_US_PRODUCTS) && window.OMNI_US_PRODUCTS.length) {
      apply(findCurrentProduct(window.OMNI_US_PRODUCTS));
      return;
    }
    const existing = document.querySelector('script[src*="/assets/us-products.js"],script[src*="assets/us-products.js"]');
    if (existing) {
      const run = () => apply(findCurrentProduct(window.OMNI_US_PRODUCTS || []));
      existing.addEventListener("load", run, { once: true });
      setTimeout(run, 0);
      return;
    }
    const script = document.createElement("script");
    script.src = "/assets/us-products.js?v=product-content-1";
    script.defer = true;
    script.dataset.otProductData = "true";
    script.addEventListener("load", () => apply(findCurrentProduct(window.OMNI_US_PRODUCTS || [])), { once: true });
    document.body.appendChild(script);
  }

  useProducts();
})();
