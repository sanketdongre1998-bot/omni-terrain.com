from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[2]
PRODUCT_DATA = ROOT / "assets" / "us-products.js"
CATALOGUE = ROOT / "us-catalogue.html"

STALE_PHRASES = (
    "Orders are not being accepted for unavailable items.",
    "Usage approval pending",
    "Add to Cart — Unavailable",
    "No shipping speed, stock, fulfilment or return-eligibility promise is made on this preview page.",
    "US Store · Prices pending · Ordering disabled",
)


def replace_all(path: Path, replacements: list[tuple[str, str]]) -> bool:
    text = path.read_text(encoding="utf-8")
    updated = text
    for old, new in replacements:
        updated = updated.replace(old, new)
    if updated != text:
        path.write_text(updated, encoding="utf-8")
        return True
    return False


def product_slugs() -> list[str]:
    data = PRODUCT_DATA.read_text(encoding="utf-8")
    return re.findall(r'\bslug:\s*"([^"]+\.html)"', data)


def product_ids() -> list[str]:
    data = PRODUCT_DATA.read_text(encoding="utf-8")
    return re.findall(r'\bid:\s*"([^"]+)"', data)


def finalize_catalogue() -> bool:
    replacements = [
        (
            'content="Browse 50 genuine US automotive, towing, RV, overlanding and marine products. All items are currently unavailable and have no displayed price."',
            'content="Browse 50 automotive, towing, RV, overlanding and marine product records. Add products to the OMNI Terrain request cart for availability, pricing and shipping review."',
        ),
        ('<meta name="robots" content="noindex,nofollow">', '<meta name="robots" content="index,follow">'),
        (
            '<span class="status-chip">Currently unavailable</span><span>US product availability is currently being finalised. Orders are not being accepted for unavailable items.</span>',
            '<span class="status-chip">Request checkout available</span><span>Products can be added to the request cart. Availability, price, shipping and return terms are confirmed before payment.</span>',
        ),
        (
            'Prices and ordering remain unavailable until commercial details are confirmed.',
            'Product records are available for review now. Availability, pricing and shipping are confirmed before an order is accepted.',
        ),
        ('<a class="cart-link" href="cart.html">Cart ', '<a class="cart-link" href="cart.html">Request Cart '),
        ('<a href="cart.html">Cart</a>', '<a href="cart.html">Request Cart</a>'),
        ('US Store · Prices pending · Ordering disabled', 'US Store · Guest request checkout active · No payment before confirmation'),
    ]
    return replace_all(CATALOGUE, replacements)


def finalize_product(path: Path) -> bool:
    replacements = [
        (
            'Currently unavailable; no price or purchasing control is shown.',
            'Availability, pricing and shipping are confirmed through the OMNI Terrain request checkout.',
        ),
        ('<meta name="robots" content="noindex,nofollow">', '<meta name="robots" content="index,follow">'),
        (
            '<span class="status-chip">Currently unavailable</span><span>US product availability is currently being finalised. Orders are not being accepted for unavailable items.</span>',
            '<span class="status-chip">Availability review</span><span>This product can be added to the request cart for availability, price and shipping review. No payment is taken before confirmation.</span>',
        ),
        ('Manufacturer-hosted product preview', 'Manufacturer reference image'),
        ('<b>Usage approval pending</b>', '<b>Confirm the supplied item by brand and MPN</b>'),
        ('<span class="purchase-label">Availability status</span>', '<span class="purchase-label">Request status</span>'),
        ('<h2>Currently Unavailable</h2>', '<h2>Confirmation Required</h2>'),
        ('<span class="price-withheld">Price not displayed</span>', '<span class="price-withheld">Price confirmed after review</span>'),
        (
            '<p>US product availability is currently being finalised. Orders are not being accepted for unavailable items.</p>',
            '<p>Add this product to the request cart. OMNI Terrain will confirm supplier availability, final price, shipping, return terms and secure payment before accepting an order.</p>',
        ),
        (
            '<button class="button dark" type="button" disabled aria-disabled="true">Add to Cart — Unavailable</button>',
            '<button class="button dark" type="button">Add to Request Cart</button>',
        ),
        (
            'Shipping method, dispatch timing, damage handling, return address and product-specific installed-item rules will be confirmed before orders open. No shipping speed, stock, fulfilment or return-eligibility promise is made on this preview page.',
            'Shipping method, dispatch estimate, damage handling, return address and product-specific conditions are confirmed before payment. No unavailable product is charged or treated as an accepted order.',
        ),
        ('<a class="cart-link" href="cart.html">Cart ', '<a class="cart-link" href="cart.html">Request Cart '),
        ('<a href="cart.html">Cart</a>', '<a href="cart.html">Request Cart</a>'),
        ('<a href="cart.html">View cart</a>', '<a href="cart.html">Request cart</a>'),
        ('US Store · Prices pending · Ordering disabled', 'US Store · Request-cart checkout active · Availability confirmed before payment'),
    ]
    return replace_all(path, replacements)


def local_target_exists(source: Path, href: str) -> bool:
    parsed = urlsplit(href)
    if parsed.scheme in {"http", "https", "mailto", "tel"} or href.startswith("#"):
        return True
    if href.startswith("//"):
        return True
    target_path = parsed.path
    if not target_path:
        return True
    target = (source.parent / target_path).resolve()
    try:
        target.relative_to(ROOT.resolve())
    except ValueError:
        return False
    if target_path.endswith("/"):
        target = target / "index.html"
    return target.exists()


def validate_internal_links(paths: list[Path]) -> list[str]:
    errors: list[str] = []
    href_pattern = re.compile(r'href=["\']([^"\']+)["\']', re.IGNORECASE)
    for path in paths:
        text = path.read_text(encoding="utf-8")
        for href in href_pattern.findall(text):
            if not local_target_exists(path, href):
                errors.append(f"{path.relative_to(ROOT)} -> missing {href}")
    return errors


def main() -> int:
    if not PRODUCT_DATA.exists() or not CATALOGUE.exists():
        print("Required US store files are missing.", file=sys.stderr)
        return 1

    slugs = product_slugs()
    ids = product_ids()
    if len(slugs) != 50 or len(ids) != 50:
        print(f"Expected 50 product records, found {len(slugs)} slugs and {len(ids)} IDs.", file=sys.stderr)
        return 1
    if len(set(slugs)) != 50 or len(set(ids)) != 50:
        print("Duplicate product slug or ID detected.", file=sys.stderr)
        return 1

    missing_products = [slug for slug in slugs if not (ROOT / slug).exists()]
    if missing_products:
        print("Missing product pages: " + ", ".join(missing_products), file=sys.stderr)
        return 1

    changed: list[str] = []
    if finalize_catalogue():
        changed.append(CATALOGUE.name)
    product_paths = [ROOT / slug for slug in slugs]
    for path in product_paths:
        if finalize_product(path):
            changed.append(path.name)

    required_pages = [
        ROOT / "index.html",
        CATALOGUE,
        ROOT / "cart.html",
        ROOT / "checkout.html",
        ROOT / "shipping-delivery-policy.html",
        ROOT / "returns-refunds-policy.html",
        ROOT / "privacy-policy.html",
        ROOT / "terms-conditions.html",
        ROOT / "contact-and-order-help.html",
        *product_paths,
    ]

    missing_required = [str(path.relative_to(ROOT)) for path in required_pages if not path.exists()]
    if missing_required:
        print("Missing required pages: " + ", ".join(missing_required), file=sys.stderr)
        return 1

    stale_errors: list[str] = []
    for path in [CATALOGUE, *product_paths]:
        text = path.read_text(encoding="utf-8")
        for phrase in STALE_PHRASES:
            if phrase in text:
                stale_errors.append(f"{path.name}: {phrase}")
    if stale_errors:
        print("Stale storefront language remains:\n" + "\n".join(stale_errors), file=sys.stderr)
        return 1

    link_errors = validate_internal_links(required_pages)
    if link_errors:
        print("Broken internal links:\n" + "\n".join(link_errors), file=sys.stderr)
        return 1

    print(f"Validated 50 unique US product records and {len(required_pages)} required pages.")
    print("Updated files: " + (", ".join(changed) if changed else "none"))
    print("Internal links and stale-language checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
