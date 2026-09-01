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
    for route in ["index.html","deals.html","us-catalogue.html","automotive.html","marine.html","rv.html","cart.html","checkout.html","contact-and-order-help.html","shipping-delivery-policy.html","returns-refunds-policy.html","privacy-policy.html","terms-conditions.html"]:
        if (ROOT / route).exists(): ok(f"route exists: {route}")
        else: fail(f"Missing customer route: {route}")

    for asset in ["assets/us-shell.js","assets/catalogue-controls.js","assets/live-storefront-priority.js","assets/customer-marketing-copy.js","assets/growth-marketing.js","assets/analytics-events.js","assets/product-page-premium.js","assets/product-page-premium.css","assets/universal-checkout-ui.js","assets/cart-checkout-premium.js","assets/cart-checkout-premium.css","assets/us-checkout-api-bridge.js","assets/storefront-performance.js","assets/us-display-prices.js","assets/us-products.js","assets/us-live-products.json","lib/us-checkout-products.mjs","api/us-create-checkout-session.mjs","api/us-checkout-health.mjs"]:
        if (ROOT / asset).exists(): ok(f"asset exists: {asset}")
        else: fail(f"Missing production asset: {asset}")

    require("index.html", "Products across automotive, marine and RV", "customer-facing catalogue depth copy")
    require("index.html", "Upgrade more. Spend less.", "retail featured-deals headline")
    reject("index.html", "Browse 1,000 products", "exact 1,000-product launch copy")
    reject("index.html", ">650 products<", "exact Auto product count")
    reject("index.html", ">250 products<", "exact Marine product count")
    reject("index.html", ">100 products<", "exact RV product count")
    reject("index.html", "Five products priced to win", "internal winning-product language")
    reject("index.html", "operating gates", "internal operating-gate language")
    reject("index.html", "Clear availability gates", "internal availability-gate language")
    reject("index.html", "Auto first", "internal department-priority language")

    require("deals.html", "Featured Auto &amp; Truck Deals", "SEO deals title")
    require("deals.html", "Upgrade more.", "deals-page retail headline")
    require("assets/growth-marketing.js", "OMNI5", "public promotion code")
    require("assets/growth-marketing.js", "7 featured deals", "seven-deal banner")
    require("assets/analytics-events.js", 'push("view_item"', "view_item tracking")
    require("assets/analytics-events.js", 'push("add_to_cart"', "add_to_cart tracking")
    require("assets/analytics-events.js", 'push("begin_checkout"', "begin_checkout tracking")

    require("assets/catalogue-controls.js", "Search brand, product or MPN", "customer catalogue search")
    require("assets/catalogue-controls.js", "No matching products", "customer search zero-state")
    require("assets/catalogue-controls.js", "Shop by brand, MPN or price", "customer catalogue messaging")
    require("assets/catalogue-controls.js", "All brands", "brand filter")
    require("assets/catalogue-controls.js", "Price: Low to High", "catalogue sorting")
    require("assets/catalogue-controls.js", "authorizationVerified===true", "browse visibility requires authorization")
    require("assets/live-storefront-priority.js", "7 featured auto & truck deals", "retail featured-deals merchandising")
    require("assets/live-storefront-priority.js", "Upgrade more. Spend less.", "retail promotion headline")
    require("assets/customer-marketing-copy.js", "Shop with confidence.", "customer-first trust copy")

    require("assets/universal-checkout-ui.js", "Add to Cart", "product-page Add to Cart")
    require("assets/universal-checkout-ui.js", "Buy Now", "product-page Buy Now")
    require("assets/universal-checkout-ui.js", "Final product pricing is validated server-side", "server-price validation copy")
    reject("assets/universal-checkout-ui.js", "us-live-products.json", "product-page UI does not grant server authorization")
    require("assets/product-page-premium.js", 'imageBadge.textContent = "Product image"', "professional image badge")
    reject("assets/product-page-premium.js", "Representative image", "representative-image runtime label")

    reject("assets/storefront-performance.js", "storefront-wide-v1", "legacy storefront-wide cart eligibility bridge")
    require("assets/storefront-performance.js", "Checkout eligibility now comes only from the published authorization-gated registry", "authorization-gated frontend eligibility")
    require("assets/storefront-performance.js", "live-storefront-priority.js", "homepage priority runtime")
    require("assets/storefront-performance.js", "customer-marketing-copy.js", "customer marketing copy runtime")
    require("assets/storefront-performance.js", "growth-marketing.js", "growth marketing runtime")
    require("assets/storefront-performance.js", "analytics-events.js", "analytics event runtime")
    require("assets/us-checkout-api-bridge.js", "omni-terrain-uk-checkout.vercel.app", "production US checkout API bridge")

    checkout = text("assets/cart-checkout-premium.js")
    for token, label in [("us-live-products.json","checkout preflight registry hook"),("cart is still saved","customer-safe payment recovery"),("Price confirmation required","customer-safe missing-price copy")]:
        if token not in checkout: fail(f"assets/cart-checkout-premium.js: missing {label}")
        else: ok(f"checkout: {label}")

    backend = text("lib/us-checkout-products.mjs")
    for token, label in [
        ("/assets/us-products.js", "server product catalogue source"),
        ("/assets/us-display-prices.js", "server price catalogue source"),
        ("/assets/us-live-products.json", "server authorization registry source"),
        ("approval.enabled !== true", "explicit checkout enable gate"),
        ("approval.authorizationVerified !== true", "explicit authorization gate"),
        ("authorizationVerified !== true", "cart authorization re-check"),
        ("storefrontVerified", "server storefront verification"),
        ("MAX_ORDER_CENTS", "server cart value guard"),
        ("MAX_QTY", "server quantity guard"),
    ]:
        if token not in backend: fail(f"lib/us-checkout-products.mjs: missing {label}")
        else: ok(f"backend: {label}")
    reject("lib/us-checkout-products.mjs", "enabled: true,\n      operatorApproved: true,\n      storefrontVerified: true", "unguarded storefront-wide enable block")

    try:
        live_registry = json.loads(text("assets/us-live-products.json") or "{}")
        live_products = live_registry.get("products", {}) if isinstance(live_registry, dict) else {}
        bad_enabled = [pid for pid, row in live_products.items() if isinstance(row, dict) and row.get("enabled") is True and row.get("authorizationVerified") is not True]
        enabled_count = sum(1 for row in live_products.values() if isinstance(row, dict) and row.get("enabled") is True and row.get("authorizationVerified") is True and int(row.get("priceCents") or 0) > 0)
        if bad_enabled: fail(f"Authorization registry enables unverified products: {', '.join(bad_enabled[:10])}")
        else: ok("authorization registry has no enabled-unverified products")
        if enabled_count > 0: ok(f"authorization registry has {enabled_count} checkout-ready products")
        else: fail("authorization registry has no checkout-ready products")
    except Exception as exc:
        fail(f"assets/us-live-products.json: invalid authorization registry ({exc})")

    require("api/us-create-checkout-session.mjs", "await resolveUsCheckoutItems", "async server-side product/price resolution")
    require("api/us-create-checkout-session.mjs", "server_storefront_catalogue", "Stripe pricing validation metadata")
    require("api/us-create-checkout-session.mjs", "shipping_address_collection", "US delivery address collection")
    require("api/us-create-checkout-session.mjs", 'PROMO_CODE = "OMNI5"', "server promo validation")
    require("api/us-create-checkout-session.mjs", "FEATURED_DEAL_IDS", "promo no-stacking guard")
    require("api/us-checkout-health.mjs", 'checkoutMode: "authorization-gated"', "authorization-gated health mode")
    require("api/us-checkout-health.mjs", 'PROMOTION_CODE = "OMNI5"', "promotion health marker")

    products_source = text("assets/us-products.js")
    product_count = products_source.count('"id":')
    if product_count >= 900: ok(f"US product source contains {product_count} listed product records")
    else: fail(f"US product source unexpectedly small: {product_count}")

    for route in ["us-catalogue.html","automotive.html","cart.html","checkout.html"]:
        require(route, "assets/us-shell.js?v=4", "versioned shared US shell")
    require("assets/us-shell.js", "/assets/product-page-premium.js?v=3", "versioned product runtime")
    require("assets/us-shell.js", "/assets/universal-checkout-ui.js?v=2", "shared product checkout runtime")
    require("assets/us-shell.js", "/assets/cart-checkout-premium.js?v=3", "shared cart/checkout runtime")

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