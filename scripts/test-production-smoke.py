#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ERRORS: list[str] = []
CHECKS: list[str] = []


def fail(message: str) -> None:
    ERRORS.append(message)


def ok(message: str) -> None:
    CHECKS.append(message)


def text(path: str) -> str:
    p = ROOT / path
    if not p.exists():
        fail(f"Missing required file: {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="replace")


def require(path: str, needle: str, label: str | None = None) -> None:
    if needle not in text(path):
        fail(f"{path}: missing {label or needle!r}")
    else:
        ok(f"{path}: {label or needle}")


def reject(path: str, needle: str, label: str | None = None) -> None:
    if needle in text(path):
        fail(f"{path}: contains disallowed {label or needle!r}")
    else:
        ok(f"{path}: no {label or needle}")


def product_schema(path: str) -> dict:
    source = text(path)
    for raw in re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', source, flags=re.I | re.S):
        try:
            data = json.loads(raw)
        except Exception:
            continue
        candidates = data.get("@graph", []) if isinstance(data, dict) and isinstance(data.get("@graph"), list) else [data]
        for item in candidates:
            if isinstance(item, dict) and item.get("@type") == "Product":
                return item
    return {}


def main() -> int:
    routes = [
        "index.html", "deals.html", "us-catalogue.html", "automotive.html", "marine.html", "rv.html",
        "cart.html", "checkout.html", "contact-and-order-help.html", "shipping-delivery-policy.html",
        "returns-refunds-policy.html", "privacy-policy.html", "terms-conditions.html", "us-order-success.html",
    ]
    for route in routes:
        if (ROOT / route).exists():
            ok(f"route exists: {route}")
        else:
            fail(f"Missing customer route: {route}")

    assets = [
        "assets/us-shell.js", "assets/us-shell.css", "assets/catalogue-controls.js",
        "assets/live-storefront-priority.js", "assets/customer-marketing-copy.js",
        "assets/growth-marketing.js", "assets/analytics-events.js", "assets/product-page-premium.js",
        "assets/product-page-premium.css", "assets/universal-checkout-ui.js",
        "assets/cart-checkout-premium.js", "assets/cart-checkout-premium.css",
        "assets/us-checkout-api-bridge.js", "assets/storefront-performance.js",
        "assets/responsive-hardening.css", "assets/dark-theme-polish.css",
        "assets/us-launch-offers.js", "assets/us-display-prices.js", "assets/us-products.js",
        "assets/us-live-products.json", "assets/us-order-success.js",
        "scripts/responsive-browser-audit.mjs", "scripts/dark-theme-browser-audit.mjs",
        "lib/us-checkout-products.mjs", "api/us-create-checkout-session.mjs", "api/us-checkout-health.mjs",
    ]
    for asset in assets:
        if (ROOT / asset).exists():
            ok(f"asset exists: {asset}")
        else:
            fail(f"Missing production asset: {asset}")

    # Customer-facing homepage / deals copy must read like a retail store, never an internal ops memo.
    require("index.html", "Products across automotive, marine and RV", "customer-facing catalogue depth copy")
    reject("index.html", "Five products priced to win", "internal winning-product language")
    reject("index.html", "operating gates", "internal operating-gate language")
    reject("index.html", "Clear availability gates", "internal availability-gate language")
    reject("index.html", "Auto first", "internal department-priority language")

    require("deals.html", "Featured Auto &amp; Truck Offers", "SEO featured-offers title")
    require("deals.html", "Gear up for", "retail featured-offers headline")
    require("deals.html", "7 featured offers", "seven-offer customer copy")
    reject("deals.html", "exact dollar savings", "stale numerical savings claim")
    reject("deals.html", "regular online price, featured price", "stale compare-price claim")
    reject("deals.html", "Clear savings", "stale savings benefit")

    require("assets/growth-marketing.js", "OMNI5", "public promotion code")
    require("assets/growth-marketing.js", "7 featured offers", "seven-offer merchandising")
    require("assets/customer-marketing-copy.js", "Shop with confidence.", "customer-first trust copy")
    require("assets/customer-marketing-copy.js", "featured offers", "featured-offer SEO copy")
    require("assets/customer-marketing-copy.js", "canonical online pricing", "runtime cleanup for internal canonical-pricing phrase")

    # Analytics must keep canonical Product/Offer value and never derive a fake promo price.
    require("assets/analytics-events.js", 'push("view_item"', "view_item tracking")
    require("assets/analytics-events.js", 'push("add_to_cart"', "add_to_cart tracking")
    require("assets/analytics-events.js", 'push("begin_checkout"', "begin_checkout tracking")
    require("assets/analytics-events.js", "const price = Number(offer?.price || 0);", "canonical schema analytics value")
    reject("assets/analytics-events.js", "promo.priceCents", "promo metadata cannot override analytics price")
    require("assets/us-order-success.js", 'event: "purchase"', "verified purchase event")
    require("assets/us-order-success.js", "if (!data.paid)", "purchase only after paid verification")

    # Catalogue discovery is fail-closed to the published authorization registry.
    require("assets/catalogue-controls.js", "Search brand, product or MPN", "customer catalogue search")
    require("assets/catalogue-controls.js", "No matching products", "customer search zero-state")
    require("assets/catalogue-controls.js", "All brands", "brand filter")
    require("assets/catalogue-controls.js", "Price: Low to High", "catalogue sorting")
    require("assets/catalogue-controls.js", "authorizationVerified===true", "browse visibility requires authorization")

    # PDP checkout fallback is allowed to read the registry, but it must never grant authorization itself.
    universal = text("assets/universal-checkout-ui.js")
    for token, label in [
        ("us-live-products.json", "published authorization registry"),
        ("row.enabled !== true", "explicit checkout-enabled gate"),
        ("row.authorizationVerified !== true", "explicit authorization gate"),
        ("Number(row.priceCents || 0) <= 0", "positive-price gate"),
        ("Add to Cart", "product-page Add to Cart"),
        ("Buy Now", "product-page Buy Now"),
        ("Final product pricing, authorization and current availability are re-validated", "server re-validation customer copy"),
        ("liveCommerceAlreadyMounted", "duplicate buybox race prevention"),
    ]:
        if token not in universal:
            fail(f"assets/universal-checkout-ui.js: missing {label}")
        else:
            ok(f"universal checkout: {label}")

    require("assets/product-page-premium.js", 'imageBadge.textContent = "Product image"', "professional image badge")
    reject("assets/product-page-premium.js", "Representative image", "representative-image runtime label")

    # Cross-device and dark-theme final layers must be loaded last and cache-busted.
    require("assets/storefront-performance.js", "responsive-hardening.css?v=2", "versioned responsive hardening")
    require("assets/responsive-hardening.css", "dark-theme-polish.css?v=1", "dark-theme polish import")
    require("assets/dark-theme-polish.css", 'content:"OT"', "classic OT crest")
    require("assets/dark-theme-polish.css", '--ot-night-text:#f3f6fa', "high-contrast dark primary text")
    require("assets/dark-theme-polish.css", ".ot-promo-box", "dark promo styling")
    require("assets/dark-theme-polish.css", ".ot-search-input", "dark search/filter styling")
    require("assets/dark-theme-polish.css", ".ot-primary-btn", "dark primary CTA styling")

    # Cart / checkout must use the same authorization registry and pass coupon server-side.
    checkout = text("assets/cart-checkout-premium.js")
    for token, label in [
        ("us-live-products.json", "checkout preflight registry hook"),
        ("authorizationVerified === true", "checkout preflight authorization"),
        ("couponCode", "coupon handoff to Stripe backend"),
        ("cart is still saved", "customer-safe payment recovery"),
        ("Price confirmation required", "customer-safe missing-price copy"),
    ]:
        if token not in checkout:
            fail(f"assets/cart-checkout-premium.js: missing {label}")
        else:
            ok(f"checkout: {label}")

    # Server-side checkout remains the source of truth.
    backend = text("lib/us-checkout-products.mjs")
    for token, label in [
        ("/assets/us-products.js", "server product catalogue source"),
        ("/assets/us-display-prices.js", "server price catalogue source"),
        ("/assets/us-live-products.json", "server authorization registry source"),
        ("approval.enabled !== true", "explicit checkout enable gate"),
        ("approval.authorizationVerified !== true", "explicit authorization gate"),
        ("storefrontVerified", "server storefront verification"),
        ("MAX_ORDER_CENTS", "server cart value guard"),
        ("MAX_QTY", "server quantity guard"),
    ]:
        if token not in backend:
            fail(f"lib/us-checkout-products.mjs: missing {label}")
        else:
            ok(f"backend: {label}")
    reject("lib/us-checkout-products.mjs", "LAUNCH_PRICE_OVERRIDES", "client-promotion price override")

    require("api/us-create-checkout-session.mjs", "await resolveUsCheckoutItems", "async server-side product/price resolution")
    require("api/us-create-checkout-session.mjs", "server_storefront_catalogue", "Stripe pricing validation metadata")
    require("api/us-create-checkout-session.mjs", "shipping_address_collection", "US delivery address collection")
    require("api/us-create-checkout-session.mjs", 'PROMO_CODE = "OMNI5"', "server promo validation")
    require("api/us-create-checkout-session.mjs", "FEATURED_DEAL_IDS", "promo no-stacking guard")
    require("api/us-checkout-health.mjs", 'checkoutMode: "authorization-gated"', "authorization-gated health mode")
    require("api/us-checkout-health.mjs", 'PROMOTION_CODE = "OMNI5"', "promotion health marker")

    # Registry integrity and featured PDP canonical price/schema parity.
    try:
        live_registry = json.loads(text("assets/us-live-products.json") or "{}")
        live_products = live_registry.get("products", {}) if isinstance(live_registry, dict) else {}
        bad_enabled = [pid for pid, row in live_products.items() if isinstance(row, dict) and row.get("enabled") is True and row.get("authorizationVerified") is not True]
        enabled_count = sum(1 for row in live_products.values() if isinstance(row, dict) and row.get("enabled") is True and row.get("authorizationVerified") is True and int(row.get("priceCents") or 0) > 0)
        if bad_enabled:
            fail(f"Authorization registry enables unverified products: {', '.join(bad_enabled[:10])}")
        else:
            ok("authorization registry has no enabled-unverified products")
        if enabled_count > 0:
            ok(f"authorization registry has {enabled_count} checkout-ready products")
        else:
            fail("authorization registry has no checkout-ready products")

        featured_ids = ["HUS81147", "HUS81148", "CCIN9010F", "CCIN8010F", "CCIIMP103X", "A1360828HD", "B5224066464"]
        for pid in featured_ids:
            row = live_products.get(pid) or {}
            if row.get("enabled") is not True or row.get("authorizationVerified") is not True:
                fail(f"featured product {pid} is not authorization-verified and enabled")
                continue
            slug = str(row.get("slug") or "")
            cents = int(row.get("priceCents") or 0)
            schema = product_schema(slug)
            offer = schema.get("offers") if isinstance(schema, dict) else None
            if isinstance(offer, list):
                offer = offer[0] if offer else {}
            actual = round(float((offer or {}).get("price") or 0) * 100)
            if actual != cents:
                fail(f"{slug}: Product schema price {actual}c != registry canonical {cents}c")
            else:
                ok(f"{pid}: PDP schema matches canonical {cents}c")
    except Exception as exc:
        fail(f"assets/us-live-products.json: invalid authorization registry ({exc})")

    launch = text("assets/us-launch-offers.js")
    reject("assets/us-launch-offers.js", "priceCents", "featured merchandising cannot override product price")
    reject("assets/us-launch-offers.js", "compareAtCents", "featured merchandising cannot synthesize compare-at price")
    require("assets/us-launch-offers.js", "Featured Offer", "featured merchandising label")

    products_source = text("assets/us-products.js")
    product_count = products_source.count('"id":')
    if product_count >= 900:
        ok(f"US product source contains {product_count} listed product records")
    else:
        fail(f"US product source unexpectedly small: {product_count}")

    for route in ["us-catalogue.html", "automotive.html", "cart.html", "checkout.html"]:
        require(route, "assets/us-shell.js?v=4", "versioned shared US shell")
    require("assets/us-shell.js", "/assets/product-page-premium.js?v=3", "versioned product runtime")
    require("assets/us-shell.js", "/assets/universal-checkout-ui.js?v=2", "shared product checkout runtime")
    require("assets/us-shell.js", "/assets/cart-checkout-premium.js?v=3", "shared cart/checkout runtime")

    product_pages = []
    for p in ROOT.glob("us-*.html"):
        source = p.read_text(encoding="utf-8", errors="replace")
        if '"@type": "Product"' in source or '"@type":"Product"' in source:
            product_pages.append(p)
            if "assets/us-shell.js?v=4" not in source and "assets/us-shell.js?v=5" not in source:
                fail(f"{p.name}: product page missing versioned shared shell")
    if product_pages:
        ok(f"product runtime wired across {len(product_pages)} US product pages")
    else:
        fail("No US product pages detected")

    print("=== OMNI TERRAIN PRODUCTION SMOKE ===")
    for item in CHECKS:
        print("PASS", item)
    if ERRORS:
        print("\nFAILURES")
        for item in ERRORS:
            print("FAIL", item)
        print(f"\nRESULT = FAIL ({len(ERRORS)} issue(s))")
        return 1
    print(f"\nRESULT = PASS ({len(CHECKS)} checks)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
