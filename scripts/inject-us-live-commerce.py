#!/usr/bin/env python3
"""Inject the inert-by-default US live-commerce runtime into storefront pages.

The runtime exposes prices and secure checkout only for products present as enabled
records in assets/us-live-products.json. This script does not change product gates,
prices, authorization, stock, shipping, or paid-ad eligibility.
"""
from __future__ import annotations

import argparse
from pathlib import Path

SCRIPT = '<script defer src="assets/us-live-commerce.js"></script>'


def eligible(page: Path, text: str) -> bool:
    name = page.name
    if name in {"cart.html", "checkout.html", "us-catalogue.html"}:
        return True
    if name.startswith("automotive") or name.startswith("marine") or name.startswith("rv"):
        return True
    if name.startswith("us-") and "product-layout" in text:
        return True
    return False


def inject(root: Path) -> tuple[int, int]:
    changed = 0
    eligible_count = 0
    for page in sorted(root.glob("*.html")):
        text = page.read_text(encoding="utf-8", errors="ignore")
        if not eligible(page, text):
            continue
        eligible_count += 1
        if "assets/us-live-commerce.js" in text:
            continue
        if "</body>" not in text:
            raise SystemExit(f"Missing </body> in {page}")
        text = text.replace("</body>", SCRIPT + "</body>", 1)
        page.write_text(text, encoding="utf-8")
        changed += 1
    return changed, eligible_count


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    args = parser.parse_args()
    root = Path(args.root)
    changed, eligible_count = inject(root)
    print("=== US LIVE COMMERCE HOOK ===")
    print("ELIGIBLE PAGES =", eligible_count)
    print("UPDATED PAGES =", changed)
    if eligible_count < 1003:
        raise SystemExit(f"Expected at least 1003 commerce surfaces; found {eligible_count}")


if __name__ == "__main__":
    main()
