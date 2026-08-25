#!/usr/bin/env python3
"""Apply customer-facing retail presentation to generated Omni Terrain Wave-1 pages.

This is deliberately presentation-only. It does not relax commerce, MAP, stock,
shipping, returns, authorization, Merchant or paid-ad gates. It removes internal
operations language from public HTML while preserving the gated backend state.
"""
from __future__ import annotations

import argparse
import re
import shutil
import tempfile
from pathlib import Path

DEFAULT_ROOT = Path("/home/ubuntu/keystone/staging/wave1-site")
LEAK_TERMS = (
    "Catalogue reference only",
    "brand/channel authorization",
    "commercial product gates",
    "Paid test candidate",
    "Fitment risk",
    "Shipping profile",
    "Not sale-enabled",
    "Product reference",
    "Contact for current commercial availability",
)


def patch_text(text: str) -> str:
    replacements = {
        "Auto parts first · Marine · RV & overlanding": "Automotive · Marine · RV & Overlanding",
        "US specialist catalogue": "Omni Terrain US Store",
        "Selected catalogue": "Featured products",
        "Product reference": "Check availability",
        "Contact for current commercial availability": "Check price & availability",
        "curated product records": "products",
        "curated product record": "product",
        (
            "A broad, curated catalogue with Auto Parts first, followed by Marine and RV. "
            "Commercial availability and online purchase are enabled only on products that "
            "pass supplier, pricing, stock and fulfilment gates."
        ): (
            "Shop specialist automotive, marine and RV products from established brands, "
            "with straightforward product information and specialist support."
        ),
        (
            "Commercial availability and online purchase are enabled only on products that "
            "pass supplier, pricing, stock and fulfilment gates."
        ): (
            "Explore specialist automotive, marine and RV products with product support "
            "and nationwide delivery options."
        ),
    }
    for old, new in replacements.items():
        text = text.replace(old, new)

    text = re.sub(
        r'\s*<span class="status ads">Paid test candidate</span>',
        "",
        text,
        flags=re.I,
    )

    text = re.sub(
        r'<div class="notice">Catalogue reference only\. Checkout is disabled until '
        r'brand/channel authorization, stock, shipping, returns and market-value gates '
        r'are explicitly cleared\.</div><p><a class="button secondary" '
        r'href="contact-and-order-help\.html">Ask product support →</a></p>',
        '<div class="notice">Get current pricing, availability and delivery options for this item. '
        'Our product team can also help confirm the correct application before purchase.</div>'
        '<p><a class="button secondary" href="contact-and-order-help.html#request-help">'
        'Check price &amp; availability →</a></p>',
        text,
        flags=re.I,
    )

    text = re.sub(
        r'<div class="notice">This SKU passed commercial product gates, but direct online '
        r'payment is not enabled yet\. Use product support for the current ordering route\.'
        r'</div><p><a class="button secondary" href="contact-and-order-help\.html">'
        r'Request purchase help →</a></p>',
        '<div class="notice">Available to order. Contact Omni Terrain for current availability, '
        'delivery options and secure checkout.</div><p><a class="button secondary" '
        'href="contact-and-order-help.html#request-help">Buy / check availability →</a></p>',
        text,
        flags=re.I,
    )

    # Internal risk/gate labels belong in backend CSVs, not on the retail product page.
    text = re.sub(
        r'<div class="fact"><small>(?:Fitment risk|Shipping profile|Stock status)</small>'
        r'<strong>.*?</strong></div>',
        "",
        text,
        flags=re.I | re.S,
    )

    # Keep factual product copy but remove the internal scoring vocabulary.
    text = re.sub(
        r'Fitment review level:\s*(?:low|medium|high)\.\s*'
        r'Verify application and installation requirements before ordering\.',
        "Verify vehicle or application compatibility and installation requirements before ordering.",
        text,
        flags=re.I,
    )
    return text


def retailize(root: Path, css_source: Path | None = None) -> tuple[int, dict[str, int]]:
    if not root.exists():
        raise SystemExit(f"Storefront directory not found: {root}")

    changed = 0
    for page in sorted(root.glob("*.html")):
        before = page.read_text(encoding="utf-8", errors="ignore")
        after = patch_text(before)
        if after != before:
            page.write_text(after, encoding="utf-8")
            changed += 1

    if css_source and css_source.exists():
        assets = root / "assets"
        assets.mkdir(parents=True, exist_ok=True)
        shutil.copy2(css_source, assets / "wave1-storefront.css")

    counts = {}
    html = "\n".join(p.read_text(errors="ignore") for p in root.glob("*.html"))
    for term in LEAK_TERMS:
        counts[term] = html.lower().count(term.lower())
    return changed, counts


def self_test() -> None:
    sample = '''<html><body><p>A broad, curated catalogue with Auto Parts first, followed by Marine and RV. Commercial availability and online purchase are enabled only on products that pass supplier, pricing, stock and fulfilment gates.</p><span class="status">Product reference</span><span class="status ads">Paid test candidate</span><div class="search-note">Contact for current commercial availability</div><div class="notice">Catalogue reference only. Checkout is disabled until brand/channel authorization, stock, shipping, returns and market-value gates are explicitly cleared.</div><p><a class="button secondary" href="contact-and-order-help.html">Ask product support →</a></p><div class="facts"><div class="fact"><small>Brand</small><strong>Example</strong></div><div class="fact"><small>Fitment risk</small><strong>LOW</strong></div><div class="fact"><small>Shipping profile</small><strong>LOW</strong></div><div class="fact"><small>Stock status</small><strong>Not sale-enabled</strong></div></div></body></html>'''
    with tempfile.TemporaryDirectory() as temp:
        root = Path(temp)
        (root / "us-example.html").write_text(sample, encoding="utf-8")
        changed, counts = retailize(root)
        assert changed == 1
        assert all(value == 0 for value in counts.values()), counts
        result = (root / "us-example.html").read_text()
        assert "Check price & availability" in result
        assert "Brand</small><strong>Example" in result
        print("SELF TEST PASSED = 1")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=str(DEFAULT_ROOT))
    parser.add_argument("--css-source", default="")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        self_test()
        return

    root = Path(args.root)
    css_source = Path(args.css_source) if args.css_source else None
    changed, counts = retailize(root, css_source)
    print("=== OMNI TERRAIN RETAIL PRESENTATION ===")
    print("ROOT =", root)
    print("HTML FILES UPDATED =", changed)
    print("INTERNAL COPY LEAKS =", sum(counts.values()))
    for term, count in counts.items():
        if count:
            print(term, "=", count)


if __name__ == "__main__":
    main()
