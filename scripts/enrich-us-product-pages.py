#!/usr/bin/env python3
"""Enrich every Omni Terrain US product page with factual search/customer content.

The script uses only the existing assets/us-products.js catalogue record. It does
not invent vehicle fitment, materials, features, dimensions or other facts. Two
manually researched rich pages can coexist with this generated layer: any page
that already contains a non-generated .product-detail-section is preserved.

Generated fields:
- keyword-first HTML title and H1 (brand + MPN + supplier product wording)
- customer-readable item description
- item specifics / specifications
- Product JSON-LD name/description/additionalProperty
- image alt text
- direct CSS + runtime enrichment assets as a regression-safe fallback
"""
from __future__ import annotations

import html as html_lib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS_JS = ROOT / "assets" / "us-products.js"
STYLE_HREF = "assets/product-content-enrichment.css?v=1"
SCRIPT_SRC = "assets/product-content-enrichment.js?v=1"
MANUAL_DETAIL_RE = re.compile(r'class=["\'][^"\']*\bproduct-detail-section\b[^"\']*["\']', re.I)
GENERATED_DETAIL_RE = re.compile(r'data-ot-auto-content=["\']true["\']', re.I)

CATEGORY_LABELS = {
    "automotive": "Automotive Parts & Towing",
    "marine": "Marine Parts & Equipment",
    "rv": "RV & Overlanding",
}


def clean(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def esc(value: object) -> str:
    return html_lib.escape(clean(value), quote=True)


def load_products() -> list[dict]:
    text = PRODUCTS_JS.read_text(encoding="utf-8")
    marker = "const OMNI_US_PRODUCTS = "
    start = text.find(marker)
    if start < 0:
        raise SystemExit("Could not find OMNI_US_PRODUCTS declaration")
    start = text.find("[", start + len(marker))
    end_marker = ";\nif (typeof window"
    end = text.find(end_marker, start)
    if start < 0 or end < 0:
        raise SystemExit("Could not isolate OMNI_US_PRODUCTS JSON payload")
    products = json.loads(text[start:end])
    if not isinstance(products, list) or not products:
        raise SystemExit("OMNI_US_PRODUCTS is empty or invalid")
    return products


def core_title(product: dict) -> str:
    value = clean(product.get("title"))
    mpn = clean(product.get("mpn"))
    brand = clean(product.get("brand"))
    if mpn:
        value = re.sub(rf"\s*[—–-]\s*MPN\s*{re.escape(mpn)}\s*$", "", value, flags=re.I)
    if brand:
        value = re.sub(rf"^{re.escape(brand)}\s+", "", value, flags=re.I)
    # Only expand unambiguous catalogue abbreviations. Do not infer fitment.
    replacements = (
        (r"\bLEVEL KIT\b", "Leveling Kit"),
        (r"\bHITCH LOCK\b", "Hitch Lock"),
        (r"\bRECEIVER LOCK\b", "Receiver Lock"),
        (r"\bBIKE RACK\b", "Bike Rack"),
        (r"\bTRAILER HITCH\b", "Trailer Hitch"),
        (r"\bTOW MIRROR\b", "Towing Mirror"),
        (r"\bF150\b", "F-150"),
        (r"\bF250\b", "F-250"),
        (r"\bF350\b", "F-350"),
        (r"\bF450\b", "F-450"),
    )
    for pattern, replacement in replacements:
        value = re.sub(pattern, replacement, value, flags=re.I)
    value = re.sub(r"Silverado\s*/\s*sierra", "Silverado / Sierra", value, flags=re.I)
    return clean(value) or clean(product.get("title")) or f"MPN {mpn}"


def exact_fields(product: dict) -> dict[str, str]:
    text = clean(product.get("description"))

    def match(pattern: str) -> str:
        found = re.search(pattern, text, flags=re.I)
        return clean(found.group(1)) if found else ""

    upc = match(r"\bUPC\s+([^;,.]+)")
    weight = match(r"listed\s+(?:package\s+)?weight\s+([^;]+?)(?=;|\.\s|$)")
    dimensions = match(r"listed\s+(?:package\s+)?dimensions\s+(.+?)(?=\.\s+(?:Fitment|Verify)|;|$)")
    length = width = height = ""
    if dimensions:
        d = re.match(r"L\s*([^×x]+?)\s*(?:×|x)\s*W\s*([^×x]+?)\s*(?:×|x)\s*H\s*(.+)$", dimensions, flags=re.I)
        if d:
            length, width, height = [clean(value) for value in d.groups()]
    return {
        "upc": upc,
        "weight": weight,
        "dimensions": dimensions,
        "length": length,
        "width": width,
        "height": height,
    }


def keyword_title(product: dict, core: str) -> str:
    return clean(f"{product.get('brand')} {product.get('mpn')} – {core}")


def item_description(product: dict, core: str, exact: dict[str, str]) -> str:
    brand = clean(product.get("brand"))
    mpn = clean(product.get("mpn"))
    parts = [f"{brand} part {mpn} is listed as {core}."]
    if exact["upc"]:
        parts.append(f"Supplier catalogue UPC: {exact['upc']}.")
    package = []
    if exact["weight"]:
        package.append(f"listed package weight {exact['weight']}")
    if exact["dimensions"]:
        package.append(f"listed package dimensions {exact['dimensions']}")
    if package:
        parts.append("Supplier package data lists " + " and ".join(package) + ".")
    parts.append("Review the item specifics below and confirm exact vehicle, trim, configuration or application compatibility before ordering when fitment is relevant.")
    return " ".join(parts)


def meta_description(product: dict, core: str, exact: dict[str, str]) -> str:
    value = f"{clean(product.get('brand'))} {clean(product.get('mpn'))}: {core}."
    if exact["upc"]:
        value += f" UPC {exact['upc']}."
    value += " View item specifications and confirm application before ordering."
    value = clean(value)
    if len(value) <= 158:
        return value
    cut = re.sub(r"\s+\S*$", "", value[:159]).rstrip(" ,;:–—-")
    return (cut or value[:157].rstrip()) + "…"


def specifics(product: dict, core: str, exact: dict[str, str], schema: dict) -> list[tuple[str, str]]:
    condition = "New" if "NewCondition" in clean(schema.get("itemCondition")) else ""
    rows = [
        ("Brand", clean(product.get("brand"))),
        ("Manufacturer part number", clean(product.get("mpn"))),
        ("SKU", clean(product.get("id"))),
        ("Department", CATEGORY_LABELS.get(clean(product.get("segment")).lower(), clean(product.get("category")))),
        ("Product / application", core),
        ("UPC", exact["upc"]),
        ("Listed package weight", exact["weight"]),
        ("Listed package dimensions", exact["dimensions"]),
        ("Package length", exact["length"]),
        ("Package width", exact["width"]),
        ("Package height", exact["height"]),
        ("Condition", condition),
    ]
    output: list[tuple[str, str]] = []
    seen: set[tuple[str, str]] = set()
    for label, value in rows:
        value = clean(value)
        if not value or (label, value) in seen:
            continue
        output.append((label, value))
        seen.add((label, value))
    return output


def find_matching_div(text: str, start: int) -> int:
    tag_re = re.compile(r"<div\b[^>]*>|</div\s*>", re.I)
    depth = 0
    for match in tag_re.finditer(text, start):
        token = match.group(0).lower()
        if token.startswith("<div"):
            depth += 1
        else:
            depth -= 1
            if depth == 0:
                return match.end()
    raise ValueError("Unbalanced div structure")


def replace_div_class(text: str, class_name: str, replacement: str) -> str:
    opening = re.search(rf'<div\b[^>]*class=["\'][^"\']*\b{re.escape(class_name)}\b[^"\']*["\'][^>]*>', text, flags=re.I)
    if not opening:
        return text
    end = find_matching_div(text, opening.start())
    return text[:opening.start()] + replacement + text[end:]


def insert_after_div_class(text: str, class_name: str, addition: str) -> str:
    opening = re.search(rf'<div\b[^>]*class=["\'][^"\']*\b{re.escape(class_name)}\b[^"\']*["\'][^>]*>', text, flags=re.I)
    if not opening:
        return text
    end = find_matching_div(text, opening.start())
    return text[:end] + addition + text[end:]


def parse_product_schema(text: str) -> tuple[dict, tuple[int, int] | None]:
    for match in re.finditer(r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script\s*>', text, flags=re.I | re.S):
        try:
            value = json.loads(html_lib.unescape(match.group(1)))
        except Exception:
            continue
        if isinstance(value, dict) and value.get("@type") == "Product":
            return value, (match.start(), match.end())
    return {}, None


def facts_html(rows: list[tuple[str, str]]) -> str:
    preferred = {"Brand", "Manufacturer part number", "SKU", "UPC", "Listed package weight", "Department"}
    primary = [row for row in rows if row[0] in preferred][:6]
    return '<div class="facts">' + "".join(
        f'<div class="fact"><small>{esc(label)}</small><strong>{esc(value)}</strong></div>' for label, value in primary
    ) + "</div>"


def detail_html(title: str, description: str, rows: list[tuple[str, str]]) -> str:
    grid = "".join(
        f'<div class="spec-item"><small>{esc(label)}</small><strong>{esc(value)}</strong></div>' for label, value in rows
    )
    return (
        '<section class="product-detail-section ot-auto-product-detail" data-ot-auto-content="true" '
        'aria-label="Product description and item specifics">'
        '<div class="ot-product-detail-heading"><span>Product information</span>'
        f'<h2>{esc(title)} details</h2></div>'
        '<h3>Item description</h3>'
        f'<p>{esc(description)}</p>'
        '<h3>Item specifics / specifications</h3>'
        f'<div class="spec-grid">{grid}</div>'
        '<div class="fitment-warning"><strong>Compatibility note:</strong> Product titles and specifications use supplier/manufacturer catalogue data. Confirm the exact vehicle, trim, configuration or application before ordering when compatibility is relevant.</div>'
        '</section>'
    )


def ensure_assets(text: str) -> str:
    if "product-content-enrichment.css" not in text:
        text = text.replace("</head>", f'<link rel="stylesheet" href="{STYLE_HREF}"></head>', 1)
    if "product-content-enrichment.js" not in text:
        text = text.replace("</body>", f'<script defer src="{SCRIPT_SRC}"></script></body>', 1)
    return text


def enrich_page(path: Path, product: dict) -> tuple[bool, bool]:
    text = path.read_text(encoding="utf-8", errors="replace")
    original = text
    text = ensure_assets(text)

    has_manual_detail = bool(MANUAL_DETAIL_RE.search(text)) and not bool(GENERATED_DETAIL_RE.search(text))
    if has_manual_detail:
        if text != original:
            path.write_text(text, encoding="utf-8")
            return True, True
        return False, True

    core = core_title(product)
    title = keyword_title(product, core)
    exact = exact_fields(product)
    description = item_description(product, core, exact)
    schema, schema_span = parse_product_schema(text)
    rows = specifics(product, core, exact, schema)

    # HTML title: use keyword space for product identity; the site brand is not forced.
    html_title = title if len(title) <= 72 else title[:72].rsplit(" ", 1)[0].rstrip(" ,;:–—-")
    text = re.sub(r"<title>.*?</title>", f"<title>{esc(html_title)}</title>", text, count=1, flags=re.I | re.S)
    meta = esc(meta_description(product, core, exact))
    if re.search(r'<meta\b[^>]*name=["\']description["\'][^>]*>', text, flags=re.I):
        text = re.sub(r'<meta\b[^>]*name=["\']description["\'][^>]*>', f'<meta name="description" content="{meta}">', text, count=1, flags=re.I)
    else:
        text = text.replace("</title>", f'</title><meta name="description" content="{meta}">', 1)

    # H1 and lead description in the product-copy region.
    copy_open = re.search(r'<div\b[^>]*class=["\'][^"\']*\bproduct-copy\b[^"\']*["\'][^>]*>', text, flags=re.I)
    if not copy_open:
        raise ValueError(f"product-copy missing: {path.name}")
    copy_end = find_matching_div(text, copy_open.start())
    copy_block = text[copy_open.start():copy_end]
    copy_block = re.sub(r"<h1>.*?</h1>", f"<h1>{esc(title)}</h1>", copy_block, count=1, flags=re.I | re.S)
    if re.search(r'<p\b[^>]*class=["\'][^"\']*\bproduct-description\b[^"\']*["\'][^>]*>.*?</p>', copy_block, flags=re.I | re.S):
        copy_block = re.sub(r'<p\b[^>]*class=["\'][^"\']*\bproduct-description\b[^"\']*["\'][^>]*>.*?</p>', f'<p class="product-description">{esc(description)}</p>', copy_block, count=1, flags=re.I | re.S)
    else:
        h1_match = re.search(r"</h1>", copy_block, flags=re.I)
        legacy_p = re.search(r"<p>(?!\s*<a\b).*?</p>", copy_block[h1_match.end():] if h1_match else copy_block, flags=re.I | re.S)
        if h1_match and legacy_p:
            start = h1_match.end() + legacy_p.start()
            end = h1_match.end() + legacy_p.end()
            copy_block = copy_block[:start] + f'<p class="product-description">{esc(description)}</p>' + copy_block[end:]
        elif h1_match:
            copy_block = copy_block[:h1_match.end()] + f'<p class="product-description">{esc(description)}</p>' + copy_block[h1_match.end():]
    text = text[:copy_open.start()] + copy_block + text[copy_end:]

    # Recalculate positions after product-copy replacement, then rebuild facts.
    text = replace_div_class(text, "facts", facts_html(rows))

    # Replace previous generated detail section if present, otherwise append after product-layout.
    generated = re.search(r'<section\b[^>]*class=["\'][^"\']*\bproduct-detail-section\b[^"\']*["\'][^>]*data-ot-auto-content=["\']true["\'][^>]*>.*?</section\s*>', text, flags=re.I | re.S)
    detail = detail_html(title, description, rows)
    if generated:
        text = text[:generated.start()] + detail + text[generated.end():]
    else:
        text = insert_after_div_class(text, "product-layout", detail)

    # Product image alt.
    product_visual = re.search(r'(<div\b[^>]*class=["\'][^"\']*\bproduct-visual\b[^"\']*["\'][^>]*>.*?<img\b)([^>]*)(>)', text, flags=re.I | re.S)
    if product_visual:
        attrs = re.sub(r'\s+alt=["\'][^"\']*["\']', "", product_visual.group(2), flags=re.I)
        replacement = product_visual.group(1) + attrs + f' alt="{esc(title)}"' + product_visual.group(3)
        text = text[:product_visual.start()] + replacement + text[product_visual.end():]

    # Product structured data: preserve any existing Offer and other commerce fields.
    schema, schema_span = parse_product_schema(text)
    if schema_span:
        schema["name"] = title
        schema["description"] = description
        schema["brand"] = {"@type": "Brand", "name": clean(product.get("brand"))}
        schema["mpn"] = clean(product.get("mpn"))
        schema["sku"] = clean(product.get("id"))
        schema["category"] = CATEGORY_LABELS.get(clean(product.get("segment")).lower(), clean(product.get("category")))
        excluded = {"Brand", "Manufacturer part number", "SKU", "Department", "Condition"}
        schema["additionalProperty"] = [
            {"@type": "PropertyValue", "name": label, "value": value}
            for label, value in rows if label not in excluded
        ]
        payload = json.dumps(schema, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")
        text = text[:schema_span[0]] + f'<script type="application/ld+json">{payload}</script>' + text[schema_span[1]:]

    if text != original:
        path.write_text(text, encoding="utf-8")
        return True, False
    return False, False


def validate(products: list[dict]) -> None:
    missing = []
    weak = []
    for product in products:
        path = ROOT / clean(product.get("slug"))
        if not path.exists():
            missing.append(path.name)
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        if "product-content-enrichment.css" not in text or "product-content-enrichment.js" not in text:
            weak.append(f"{path.name}: enrichment assets missing")
        if not re.search(r"<h1>.*?</h1>", text, flags=re.I | re.S):
            weak.append(f"{path.name}: H1 missing")
        if not re.search(r"class=[""']product-description[""']", text, flags=re.I) and not (MANUAL_DETAIL_RE.search(text) and not GENERATED_DETAIL_RE.search(text)):
            weak.append(f"{path.name}: item description missing")
        if "product-detail-section" not in text:
            weak.append(f"{path.name}: specifications section missing")
    if missing or weak:
        preview = "\n".join((missing + weak)[:30])
        raise SystemExit(f"Product content validation failed. Missing={len(missing)} Weak={len(weak)}\n{preview}")


def main() -> None:
    products = load_products()
    changed = manual = 0
    failures: list[str] = []
    for product in products:
        slug = clean(product.get("slug"))
        path = ROOT / slug
        if not path.exists():
            failures.append(f"missing page: {slug}")
            continue
        try:
            did_change, preserved_manual = enrich_page(path, product)
            changed += int(did_change)
            manual += int(preserved_manual)
        except Exception as exc:
            failures.append(f"{slug}: {exc}")
    if failures:
        raise SystemExit("Static product enrichment failed:\n" + "\n".join(failures[:50]))
    validate(products)
    print("=== OMNI TERRAIN PRODUCT CONTENT ENRICHMENT ===")
    print("CATALOGUE PRODUCTS =", len(products))
    print("PRODUCT PAGES CHANGED =", changed)
    print("MANUAL-RICH PAGES PRESERVED =", manual)
    print("TITLE + DESCRIPTION + SPECIFICATIONS VALIDATED =", len(products))


if __name__ == "__main__":
    main()
