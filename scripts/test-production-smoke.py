#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []
CHECKS: list[str] = []


def fail(message: str) -> None: ERRORS.append(message)
def ok(message: str) -> None: CHECKS.append(message)

def text(path: str) -> str:
    p = ROOT / path
    if not p.exists():
        fail(f"Missing required file: {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="replace")

def require(path: str, needle: str, label: str | None = None) -> None:
    if needle not in text(path): fail(f"{path}: missing {label or needle!r}")
    else: ok(f"{path}: {label or needle}")

def reject(path: str, needle: str, label: str | None = None) -> None:
    if needle in text(path): fail(f"{path}: contains disallowed {label or needle!r}")
    else: ok(f"{path}: no {label or needle}")


def main() -> int:
    for route in ["index.html","us-catalogue.html","automotive.html","marine.html","rv.html","cart.html","checkout.html","contact-and-order-help.html","shipping-delivery-policy.html","returns-refunds-policy.html","privacy-policy.html","terms-conditions.html"]:
        if (ROOT / route).exists(): ok(f"route exists: {route}")
        else: fail(f"Missing customer route: {route}")

    for asset in ["assets/us-shell.js","assets/catalogue-controls.js","assets/product-page-premium.js","assets/product-page-premium.css","assets/universal-checkout-ui.js","assets/cart-checkout-premium.js","assets/cart-checkout-premium.css","assets/us-checkout-api-bridge.js","assets/us-live-products.json","assets/us-display-prices.js","assets/us-products.js"]:
        if (ROOT / asset).exists(): ok(f"asset exists: {asset}")
        else: fail(f"Missing production asset: {asset}")

    require("index.html", "300+ specialist products", "subtle catalogue depth copy")
    reject("index.html", "Browse 1,000 products", "exact 1,000-product launch copy")
    reject("index.html", ">650 products<", "exact Auto product count")
    reject("index.html", ">250 products<", "exact Marine product count")
    reject("index.html", ">100 products<", "exact RV product count")

    require("assets/catalogue-controls.js", "Search product, brand or MPN", "catalogue search")
    require("assets/catalogue-controls.js", "No exact catalogue match", "search zero-state")
    require("assets/catalogue-controls.js", "Search across 300+ specialist products", "cross-catalogue search messaging")
    require("assets/catalogue-controls.js", "All brands", "brand filter")
    require("assets/catalogue-controls.js", "Price: Low to High", "catalogue sorting")

    require("assets/universal-checkout-ui.js", "Check availability", "safe unavailable-product action")
    require("assets/universal-checkout-ui.js", "Product support", "support fallback")
    require("assets/universal-checkout-ui.js", "us-live-products.json", "checkout eligibility source")
    require("assets/product-page-premium.js", 'imageBadge.textContent = "Product image"', "professional image badge")
    reject("assets/product-page-premium.js", "Representative image", "representative-image runtime label")

    checkout = text("assets/cart-checkout-premium.js")
    for token, label in [("us-live-products.json","checkout preflight eligibility"),("cart is still saved","customer-safe payment recovery"),("Price confirmation required","customer-safe missing-price copy")]:
        if token not in checkout: fail(f"assets/cart-checkout-premium.js: missing {label}")
        else: ok(f"checkout: {label}")

    for route in ["us-catalogue.html","automotive.html","cart.html","checkout.html"]:
        require(route, "assets/us-shell.js?v=4", "versioned shared US shell")
    require("assets/us-shell.js", "/assets/product-page-premium.js?v=3", "versioned product runtime")
    require("assets/us-shell.js", "/assets/universal-checkout-ui.js?v=2", "versioned checkout eligibility runtime")
    require("assets/us-shell.js", "/assets/cart-checkout-premium.js?v=3", "versioned cart/checkout runtime")

    try: live = json.loads((ROOT / "assets/us-live-products.json").read_text(encoding="utf-8"))
    except Exception as exc:
        fail(f"Invalid assets/us-live-products.json: {exc}"); live = {}

    api_base = str(live.get("checkoutApiBase") or "").rstrip("/")
    if not api_base.startswith("https://"): fail("us-live-products.json: checkoutApiBase must be HTTPS")
    else: ok("live registry: HTTPS checkout API base")

    bridge = text("assets/us-checkout-api-bridge.js")
    if api_base and api_base not in bridge: fail("Checkout API bridge does not match us-live-products.json checkoutApiBase")
    elif api_base: ok("checkout API bridge matches live registry")

    products = live.get("products") if isinstance(live, dict) else None
    if not isinstance(products, dict) or not products:
        fail("us-live-products.json: no products configured"); products = {}

    backend = text("lib/us-checkout-products.mjs")
    if "product.authorizationVerified === true" not in backend:
        fail("US backend checkout registry does not enforce verified authorization")
    else:
        ok("US backend checkout requires verified authorization")

    enabled = 0
    gated = 0
    for product_id, row in products.items():
        if not isinstance(row, dict):
            continue
        if row.get("enabled") is not True:
            gated += 1
            continue
        enabled += 1
        if row.get("authorizationVerified") is not True:
            fail(f"{product_id}: enabled without authorizationVerified=true")
        price = int(row.get("priceCents") or 0); slug = str(row.get("slug") or ""); mpn = str(row.get("mpn") or "").strip()
        if price <= 0: fail(f"{product_id}: enabled with invalid priceCents")
        if not mpn: fail(f"{product_id}: enabled with blank MPN")
        if not slug or not (ROOT / slug).exists(): fail(f"{product_id}: enabled slug missing from storefront: {slug}")
        if f'["{product_id}"' not in backend: fail(f"{product_id}: live frontend SKU missing from backend checkout registry")
    if enabled:
        ok(f"live checkout registry: {enabled} enabled authorized product(s) cross-checked")
    else:
        ok(f"live checkout registry: 0 enabled products; {gated} candidate(s) safely gated pending authorization")

    product_pages = []
    for p in ROOT.glob("us-*.html"):
        source = p.read_text(encoding="utf-8", errors="replace")
        if '"@type": "Product"' in source or '"@type":"Product"' in source:
            product_pages.append(p)
            if "assets/us-shell.js?v=4" not in source: fail(f"{p.name}: product page missing versioned shared shell")
    if product_pages: ok(f"product runtime wired across {len(product_pages)} US product pages")
    else: fail("No US product pages detected")

    print("=== OMNI TERRAIN PRODUCTION SMOKE ===")
    for item in CHECKS: print("PASS", item)
    if ERRORS:
        print("\nFAILURES")
        for item in ERRORS: print("FAIL", item)
        print(f"\nRESULT = FAIL ({len(ERRORS)} issue(s))")
        return 1
    print(f"\nRESULT = PASS ({len(CHECKS)} checks)")
    return 0

if __name__ == "__main__": sys.exit(main())
