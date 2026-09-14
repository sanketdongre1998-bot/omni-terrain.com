#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []
passes: list[str] = []


def src(path: str) -> str:
    p = ROOT / path
    if not p.exists():
        errors.append(f"missing {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="replace")


def exists(path: str) -> None:
    if (ROOT / path).exists():
        passes.append(f"PASS exists: {path}")
    else:
        errors.append(f"missing {path}")


def need(path: str, token: str, label: str) -> None:
    if token in src(path):
        passes.append(f"PASS {path}: {label}")
    else:
        errors.append(f"{path}: missing {label}")


def ban(path: str, token: str, label: str) -> None:
    if token in src(path):
        errors.append(f"{path}: disallowed {label}")
    else:
        passes.append(f"PASS {path}: no {label}")


def product_schema(path: str) -> dict:
    for raw in re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', src(path), re.I | re.S):
        try:
            data = json.loads(raw)
        except Exception:
            continue
        items = data.get("@graph", []) if isinstance(data, dict) and isinstance(data.get("@graph"), list) else [data]
        for item in items:
            if isinstance(item, dict) and item.get("@type") == "Product":
                return item
    return {}


def main() -> int:
    # Files that define the currently deployed storefront and its checkout path.
    routes = [
        "index.html", "used-auto-parts.html", "deals.html", "us-catalogue.html", "automotive.html",
        "marine.html", "rv.html", "cart.html", "checkout.html", "contact-and-order-help.html",
        "shipping-delivery-policy.html", "returns-refunds-policy.html", "privacy-policy.html",
        "terms-conditions.html", "us-order-success.html", "uk.html", "shield-autocare-uk.html",
        "uk-tyres.html", "uk-cool-mate-70l-fridge-black.html", "uk-cart.html", "uk-contact.html",
        "uk-shipping-delivery-policy.html", "uk-returns-refunds-policy.html", "uk-privacy-policy.html",
        "uk-terms-conditions.html",
    ]
    assets = [
        "assets/storefront-performance.js", "assets/reference-storefront.js", "assets/reference-storefront.css",
        "assets/reference-storefront-fidelity.js", "assets/reference-storefront-fidelity.css",
        "assets/used-oem-integration.css", "assets/used-auto-parts.css", "assets/home-header-stability.css",
        "assets/ad-ready-stability.css", "assets/firebase-auth.js", "assets/firebase-auth.css",
        "assets/catalogue-controls.js", "assets/catalogue-controls.css", "assets/catalogue-wide.js",
        "assets/cart-checkout-premium.js", "assets/universal-checkout-ui.js", "assets/ad-readiness.js",
        "assets/analytics-events.js", "assets/us-live-products.json", "assets/us-stock-status.json",
        "assets/us-products.js", "assets/us-order-success.js", "scripts/responsive-browser-audit.mjs",
        "lib/us-checkout-products.mjs", "api/us-create-checkout-session.mjs", "api/us-checkout-health.mjs",
        "llms.txt", "robots.txt", "sitemap.xml",
    ]
    for path in routes + assets:
        exists(path)

    # Homepages must load the approved renderer deterministically. Generic marketing
    # mutation layers are intentionally kept off the approved homepage path.
    for path in ("index.html", "uk.html"):
        need(path, 'reference-storefront.css?v=4', "reference storefront CSS v4")
        need(path, 'reference-storefront-fidelity.css?v=2', "reference fidelity CSS v2")
        need(path, 'reference-storefront.js?v=4', "reference storefront runtime v4")
        need(path, 'reference-storefront-fidelity.js?v=2', "reference fidelity runtime v2")
        need(path, 'home-header-stability.css?v=1', "mobile header stability layer")
        need(path, 'ad-ready-stability.css?v=2', "ad-ready stability layer v2")
        need(path, 'storefront-performance.js?v=17', "storefront performance runtime")

    need("index.html", 'used-oem-integration.css?v=1', "Used OEM homepage integration styles")
    need("index.html", "New & Used OEM Auto Parts", "US new + used SEO title")

    performance = src("assets/storefront-performance.js")
    for token, label in [
        ('document.documentElement.dataset.otTheme = "light"', "light retail theme lock"),
        ('if (home)', "dedicated homepage stability path"),
        ('addCss("otUsedOemIntegrationCss"', "Used OEM home styles"),
        ('addScript("otReferenceStorefrontJs"', "approved home renderer"),
        ('addScript("otReferenceStorefrontFidelityJs"', "approved home fidelity runtime"),
        ('scrubPublicBusinessDetails()', "public business-detail cleanup"),
        ('sanitizeStructuredData()', "structured-data cleanup"),
        ('compactReferenceMobileNav()', "mobile nav compaction"),
        ('observer.disconnect()', "bounded mutation observer"),
    ]:
        if token in performance:
            passes.append(f"PASS storefront-performance: {label}")
        else:
            errors.append(f"storefront-performance missing {label}")

    # Approved customer-facing US/UK home architecture plus Used OEM integration.
    for token, label in [
        ("header.className = 'ot-ref-header'", "reference retail header"),
        ('Gear for a Brighter Horizon', "brand utility line"),
        ('id="otRefHeaderSearch"', "header product search"),
        ('Find the Right Parts for Your Adventure', "fitment/product finder"),
        ('Shop by Category', "category merchandising"),
        ('Featured Products', "featured merchandising"),
        ('href="/uk.html"', "UK store switch"),
        ('href="/"', "US store switch"),
        ('data-ot-auth-trigger', "account trigger"),
        ('omniTerrainUkCartV1', "UK cart isolation"),
        ('omniTerrainUsCart', "US cart isolation"),
        ('us-live-products.json', "US live product registry"),
        ('href="/used-auto-parts.html"', "Used OEM route"),
        ('Used OEM Auto Parts', "Used OEM merchandising"),
        ('Factory parts, matched by the numbers that matter.', "Used OEM homepage callout"),
    ]:
        need("assets/reference-storefront.js", token, label)

    # Used OEM page: real sourcing/request flow only, no invented purchasable stock.
    for token, label in [
        ('Used OEM Auto Parts | Omni Terrain US', "Used OEM page title"),
        ('OEM / MPN / engineering number', "part-number search"),
        ('Year Make Model', "vehicle detail field"),
        ('Audio & Infotainment', "launch category"),
        ('Modules & Computers', "modules category"),
        ('Climate Controls', "climate category"),
        ('type','request flow marker'),
        ('No fake inventory or placeholder pricing', "inventory-integrity disclosure"),
    ]:
        need("used-auto-parts.html", token, label)
    need("used-auto-parts.html", "type','used-oem", "Used OEM support handoff")

    for token, label in [
        ('omni-terrain-subtle-logo.svg', "approved light storefront logo"),
        ('MutationObserver', "short-lived renderer readiness observer"),
        ('observer.disconnect()', "fidelity observer disconnect"),
    ]:
        need("assets/reference-storefront-fidelity.js", token, label)

    need("assets/home-header-stability.css", '.ot-ref-account{display:flex!important', "mobile Sign In visibility")
    need("assets/home-header-stability.css", 'min-height:38px', "mobile tap target minimum")
    need("assets/used-oem-integration.css", '.ot-ref-used-nav', "Used OEM nav styling")
    need("assets/used-oem-integration.css", 'display:flex!important', "Used OEM compact mobile nav visibility")

    for token, label in [
        ('.fitment-panel', "UK dark-panel contrast fix"),
        ('body>footer:not(.ot-ref-footer)', "legacy footer contrast fix"),
        ('.ot-catalogue-loadmore', "catalogue load-more styling"),
        ('grid-template-columns:repeat(4,minmax(0,1fr))', "compact mobile navigation"),
        ('.ot-ref-product{content-visibility:visible', "homepage product visibility safeguard"),
    ]:
        need("assets/ad-ready-stability.css", token, label)

    # Catalogue must progressively expose only authorized/orderable products.
    for token, label in [
        ('PAGE_SIZE=24', "24-product progressive rendering"),
        ('Load more products', "load-more control"),
        ('displayLimit+=PAGE_SIZE', "progressive load-more action"),
        ('liveSlugs.has(cardSlug(card))', "live-registry visibility gate"),
        ('authorizationVerified===true', "catalogue authorization gate"),
        ('s?.checkoutReady===true', "catalogue checkout-ready gate"),
    ]:
        need("assets/catalogue-controls.js", token, label)
    need("assets/catalogue-controls.css", '.ot-card-hidden{display:none!important}', "hidden-card layout collapse")

    # Auth/customer account safety.
    auth = src("assets/firebase-auth.js")
    for token, label in [
        ("omni-terrain.firebaseapp.com", "Firebase auth domain"),
        ("new GoogleAuthProvider()", "Google provider"),
        ("signInWithPopup(auth,provider)", "Google popup sign-in"),
        ("createUserWithEmailAndPassword", "email/password account creation"),
        ("signInWithEmailAndPassword", "email/password sign-in"),
        ("sendPasswordResetEmail", "password reset"),
        ("browserLocalPersistence", "persistent session"),
        ("onAuthStateChanged", "auth state observer"),
        ("prefillCheckout(currentUser)", "checkout prefill"),
    ]:
        if token in auth:
            passes.append(f"PASS auth: {label}")
        else:
            errors.append(f"auth missing {label}")
    ban("assets/firebase-auth.js", ".addScope(", "extra Google OAuth scope")

    # Ads measurement may exist while campaign launch remains an independent decision.
    for token, label in [
        ('AW-18417309188', "Google Ads account tag"),
        ('gclid', "Google click attribution"),
        ('utm_campaign', "campaign attribution"),
        ('landing_attribution', "landing attribution event"),
    ]:
        need("assets/ad-readiness.js", token, label)

    need("llms.txt", "United States", "US LLM storefront guidance")
    need("llms.txt", "United Kingdom", "UK LLM storefront guidance")
    need("robots.txt", "Allow: /", "crawl allowed")
    need("sitemap.xml", "https://omni-terrain.com/", "canonical URLs in sitemap")

    # Checkout and policy guards.
    universal = src("assets/universal-checkout-ui.js")
    for token, label in [
        ("us-live-products.json", "registry read"),
        ("row.enabled !== true", "enabled gate"),
        ("row.authorizationVerified !== true", "authorization gate"),
        ("Number(row.priceCents || 0) <= 0", "price gate"),
        ("liveCommerceAlreadyMounted", "duplicate-buybox prevention"),
    ]:
        if token in universal:
            passes.append(f"PASS universal: {label}")
        else:
            errors.append(f"universal checkout missing {label}")

    checkout = src("assets/cart-checkout-premium.js")
    for token, label in [
        ("us-live-products.json", "registry preflight"),
        ("p.enabled===true&&p.authorizationVerified===true&&Number(p.priceCents)>0", "authorization+price preflight"),
        ("couponCode", "coupon server handoff"),
        ("PROMO_SAVE_CENTS=500", "OMNI5 $5 preview"),
        ("PROMO_MIN_CENTS=15000", "OMNI5 $150 minimum preview"),
    ]:
        if token in checkout:
            passes.append(f"PASS checkout: {label}")
        else:
            errors.append(f"checkout missing {label}")

    backend = src("lib/us-checkout-products.mjs")
    for token, label in [
        ("/assets/us-products.js", "products source"),
        ("/assets/us-live-products.json", "authorization source"),
        ("/assets/us-stock-status.json", "stock-status source"),
        ("approval.enabled !== true", "enabled gate"),
        ("approval.authorizationVerified !== true", "authorization gate"),
        ("stock.checkoutReady !== true", "current stock gate"),
        ("MAX_ORDER_CENTS", "cart value guard"),
        ("MAX_QTY", "quantity guard"),
    ]:
        if token in backend:
            passes.append(f"PASS backend: {label}")
        else:
            errors.append(f"backend missing {label}")
    ban("lib/us-checkout-products.mjs", "LAUNCH_PRICE_OVERRIDES", "launch price override")

    for token, label in [
        ("await resolveUsCheckoutItems", "server item resolution"),
        ('PROMO_CODE = "OMNI5"', "OMNI5 validation"),
        ("PROMO_MIN_CENTS = 15_000", "OMNI5 $150 minimum"),
        ("PROMO_SAVE_CENTS = 500", "OMNI5 $5 discount"),
        ("shipping_address_collection", "US address collection"),
    ]:
        need("api/us-create-checkout-session.mjs", token, label)
    need("api/us-checkout-health.mjs", 'checkoutMode: "authorization-gated"', "authorization-gated health")

    # Registry, stock status and PDP schema must agree for live featured products.
    try:
        registry = json.loads(src("assets/us-live-products.json") or "{}")
        stock = json.loads(src("assets/us-stock-status.json") or "{}")
        products = registry.get("products", {})
        enabled = {
            pid: row for pid, row in products.items()
            if isinstance(row, dict) and row.get("enabled") is True
            and row.get("authorizationVerified") is True and int(row.get("priceCents") or 0) > 0
        }
        stock_ready = {
            pid: row for pid, row in stock.get("products", {}).items()
            if isinstance(row, dict) and row.get("checkoutReady") is True
            and row.get("status") == "in_stock" and row.get("liveApi") == "ORDERABLE"
        }
        bad = [pid for pid, row in products.items() if isinstance(row, dict) and row.get("enabled") is True and row.get("authorizationVerified") is not True]
        if bad:
            errors.append(f"enabled but unverified: {bad[:10]}")
        else:
            passes.append("PASS registry: no enabled-unverified products")
        if enabled and set(enabled) == set(stock_ready):
            passes.append(f"PASS registry/status: {len(enabled)} checkout-ready products agree")
        else:
            errors.append(f"registry/status checkout-ready mismatch: registry={len(enabled)}, stock={len(stock_ready)}")

        featured = ["HUS81147", "HUS81148", "CCIN9010F", "CCIN8010F", "CCIIMP103X", "A1360828HD", "B5224066464"]
        for pid in featured:
            row = enabled.get(pid)
            if not row:
                errors.append(f"featured {pid} not enabled+verified")
                continue
            page = product_schema(str(row.get("slug") or ""))
            offer = page.get("offers", {}) if isinstance(page, dict) else {}
            if isinstance(offer, list):
                offer = offer[0] if offer else {}
            actual = round(float((offer or {}).get("price") or 0) * 100)
            expected = int(row.get("priceCents") or 0)
            if actual == expected:
                passes.append(f"PASS {pid}: schema={expected}c")
            else:
                errors.append(f"{pid}: schema {actual}c != registry {expected}c")
    except Exception as exc:
        errors.append(f"registry/schema validation error: {exc}")

    if src("assets/us-products.js").count('"id":') >= 900:
        passes.append("PASS catalogue: broad product source")
    else:
        errors.append("US product source unexpectedly small")

    print("=== OMNI TERRAIN PRODUCTION SMOKE ===")
    for row in passes:
        print(row)
    if errors:
        print("\nFAILURES")
        for row in errors:
            print("FAIL", row)
        print(f"\nRESULT = FAIL ({len(errors)} issue(s))")
        return 1
    print(f"\nRESULT = PASS ({len(passes)} checks)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
