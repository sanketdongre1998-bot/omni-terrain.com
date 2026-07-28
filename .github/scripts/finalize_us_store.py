from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[2]
SITE = "https://omni-terrain.com"
US_DATA = ROOT / "assets" / "us-products.js"
UK_DATA = ROOT / "assets" / "shield-products.js"


def extract(path: Path, pattern: str) -> list[str]:
    return re.findall(pattern, path.read_text(encoding="utf-8"))


def local_target_exists(source: Path, href: str) -> bool:
    parsed = urlsplit(href)
    if parsed.scheme in {"http", "https", "mailto", "tel"} or href.startswith(("#", "//")):
        return True
    if not parsed.path:
        return True
    target = (source.parent / parsed.path).resolve()
    try:
        target.relative_to(ROOT.resolve())
    except ValueError:
        return False
    if parsed.path.endswith("/"):
        target /= "index.html"
    return target.exists()


def validate_internal_links(paths: list[Path]) -> list[str]:
    errors: list[str] = []
    href_pattern = re.compile(r'href=["\']([^"\']+)["\']', re.IGNORECASE)
    for path in paths:
        for href in href_pattern.findall(path.read_text(encoding="utf-8")):
            if not local_target_exists(path, href):
                errors.append(f"{path.relative_to(ROOT)} -> missing {href}")
    return errors


def require(condition: bool, message: str, errors: list[str]) -> None:
    if not condition:
        errors.append(message)


def main() -> int:
    errors: list[str] = []
    require(US_DATA.exists(), "Missing assets/us-products.js", errors)
    require(UK_DATA.exists(), "Missing assets/shield-products.js", errors)
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1

    us_slugs = extract(US_DATA, r'\bslug:\s*"([^"]+\.html)"')
    us_ids = extract(US_DATA, r'\bid:\s*"([^"]+)"')
    uk_slugs = extract(UK_DATA, r'\bslug:\s*`?["]?([^"`]+\.html)')
    uk_item_ids = extract(UK_DATA, r'\b(?:ebayItemId:\s*itemId|itemId\),?)')
    uk_explicit_item_ids = extract(UK_DATA, r'\b(?:fridge|windowProduct|blind)\([^\n]+?"(\d{12})"\)')

    require(len(us_slugs) == 50, f"Expected 50 US slugs; found {len(us_slugs)}", errors)
    require(len(us_ids) == 50, f"Expected 50 US IDs; found {len(us_ids)}", errors)
    require(len(set(us_slugs)) == 50 and len(set(us_ids)) == 50, "US slugs/IDs must be unique", errors)
    require(len(uk_explicit_item_ids) == 20, f"Expected 20 UK eBay item IDs; found {len(uk_explicit_item_ids)}", errors)
    require(len(set(uk_explicit_item_ids)) == 20, "UK eBay item IDs must be unique", errors)

    # UK slugs are built by three factory functions, so obtain the generated set
    # from the public pages after the generator has run.
    uk_product_paths = sorted(ROOT.glob("uk-cool-mate-*.html")) + sorted(ROOT.glob("uk-shield-cassette-*.html")) + sorted(ROOT.glob("uk-shield-frameless-*.html"))
    require(len(uk_product_paths) == 20, f"Expected 20 generated UK product pages; found {len(uk_product_paths)}", errors)

    us_product_paths = [ROOT / slug for slug in us_slugs]
    required_core = [
        ROOT / "index.html",
        ROOT / "us-catalogue.html",
        ROOT / "cart.html",
        ROOT / "checkout.html",
        ROOT / "contact-and-order-help.html",
        ROOT / "shipping-delivery-policy.html",
        ROOT / "returns-refunds-policy.html",
        ROOT / "privacy-policy.html",
        ROOT / "terms-conditions.html",
        ROOT / "uk.html",
        ROOT / "shield-autocare-uk.html",
        ROOT / "uk-contact.html",
        ROOT / "uk-shipping-delivery-policy.html",
        ROOT / "uk-returns-refunds-policy.html",
        ROOT / "uk-privacy-policy.html",
        ROOT / "uk-terms-conditions.html",
        ROOT / "sitemap.xml",
        *us_product_paths,
        *uk_product_paths,
    ]
    for path in required_core:
        require(path.exists(), f"Missing required file: {path.relative_to(ROOT)}", errors)
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1

    forbidden_supplier_claim = re.compile(
        r"\b(LKQ|Keystone|NTP-STAG|SeaWide)\b|authori[sz]ed dealer|will fulfil|will fulfill",
        re.IGNORECASE,
    )
    stale = (
        "Orders are not being accepted for unavailable items.",
        "Usage approval pending",
        "Add to Cart — Unavailable",
        "lorem ipsum",
    )

    us_public = [ROOT / "us-catalogue.html", *us_product_paths]
    for path in us_public:
        html = path.read_text(encoding="utf-8")
        name = path.name
        require(not forbidden_supplier_claim.search(html), f"{name}: restricted supplier/dealer claim", errors)
        require('name="robots" content="index,follow"' in html, f"{name}: must be indexable", errors)
        require(f'<link rel="canonical" href="{SITE}/{name}">' in html, f"{name}: missing exact canonical", errors)
        require("application/ld+json" in html, f"{name}: missing JSON-LD", errors)
        require("shipping-delivery-policy.html" in html and "returns-refunds-policy.html" in html, f"{name}: missing US policy links", errors)
        require("PRP XPERT LLC" in html and "PRASAD INC LTD" not in html, f"{name}: US/UK legal identity is mixed", errors)
        require(not any(phrase.lower() in html.lower() for phrase in stale), f"{name}: stale or placeholder language", errors)

    catalogue = (ROOT / "us-catalogue.html").read_text(encoding="utf-8")
    require(catalogue.count('class="product-card"') == 50, "US catalogue must render exactly 50 cards", errors)
    require('"numberOfItems":50' in catalogue, "US catalogue JSON-LD must list 50 items", errors)

    for path in us_product_paths:
        html = path.read_text(encoding="utf-8")
        require('"@type":"Product"' in html and '"@type":"BreadcrumbList"' in html, f"{path.name}: missing Product/Breadcrumb schema", errors)
        require('"offers":' not in html and '"priceCurrency":' not in html, f"{path.name}: unverified price/offer schema must not be published", errors)
        require("Add to Request Cart" in html, f"{path.name}: request-cart action missing", errors)
        require("No unavailable product is charged" in html, f"{path.name}: payment/availability disclosure missing", errors)

    uk_public = [ROOT / "uk.html", ROOT / "shield-autocare-uk.html", *uk_product_paths]
    for path in uk_public:
        html = path.read_text(encoding="utf-8")
        require("PRASAD INC LTD" in html and "PRP XPERT LLC" not in html, f"{path.name}: UK/US legal identity is mixed", errors)
        require("uk-shipping-delivery-policy.html" in html and "uk-returns-refunds-policy.html" in html, f"{path.name}: missing UK policy links", errors)
        require('name="robots" content="index,follow"' in html, f"{path.name}: must be indexable", errors)
        require("application/ld+json" in html, f"{path.name}: missing JSON-LD", errors)
        require("lorem ipsum" not in html.lower(), f"{path.name}: lorem ipsum remains", errors)

    for path in uk_product_paths:
        html = path.read_text(encoding="utf-8")
        require('"@type":"Product"' in html and '"@type":"Offer"' in html, f"{path.name}: missing Product/Offer schema", errors)
        require("ebay.co.uk/itm/" in html, f"{path.name}: missing direct eBay UK listing", errors)
        require("inc UK VAT" in html, f"{path.name}: VAT-inclusive price label missing", errors)

    sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    for path in [ROOT / "us-catalogue.html", ROOT / "shield-autocare-uk.html", *us_product_paths, *uk_product_paths]:
        require(f"{SITE}/{path.name}" in sitemap, f"sitemap.xml: missing {path.name}", errors)
    require("product-page-template.html" not in sitemap, "sitemap.xml: product template must be excluded", errors)
    require("OMNI-TERRAIN-V1.1-CALL-SUPPORT" not in sitemap, "sitemap.xml: legacy duplicate path must be excluded", errors)

    link_errors = validate_internal_links(required_core[:-1])
    errors.extend(link_errors)

    if errors:
        print(f"Storefront validation failed with {len(errors)} error(s):", file=sys.stderr)
        print("\n".join(f"- {error}" for error in errors), file=sys.stderr)
        return 1

    print("PASS validation-only storefront gate")
    print("50 US products + 20 UK Shield products + cart/checkout + legal/SEO/link checks")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
