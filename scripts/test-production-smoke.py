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


def need(path: str, token: str, label: str) -> None:
    text = src(path)
    if token in text:
        passes.append(f"PASS {path}: {label}")
    else:
        errors.append(f"{path}: missing {label}")


def ban(path: str, token: str, label: str) -> None:
    if token in src(path):
        errors.append(f"{path}: disallowed {label}")
    else:
        passes.append(f"PASS {path}: no {label}")


def schema(path: str) -> dict:
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
    routes = [
        "index.html", "deals.html", "us-catalogue.html", "automotive.html", "marine.html", "rv.html",
        "cart.html", "checkout.html", "contact-and-order-help.html", "shipping-delivery-policy.html",
        "returns-refunds-policy.html", "privacy-policy.html", "terms-conditions.html", "us-order-success.html",
        "uk.html", "shield-autocare-uk.html", "uk-tyres.html", "uk-cool-mate-70l-fridge-black.html",
        "uk-cart.html", "uk-contact.html", "uk-shipping-delivery-policy.html", "uk-returns-refunds-policy.html",
        "uk-privacy-policy.html", "uk-terms-conditions.html",
    ]
    assets = [
        "assets/storefront-performance.js", "assets/storefront-performance.css",
        "assets/reference-storefront.js", "assets/reference-storefront.css",
        "assets/reference-storefront-fidelity.js", "assets/reference-storefront-fidelity.css",
        "assets/ad-ready-stability.css", "assets/retail-region-enhancements.js",
        "assets/firebase-auth.js", "assets/firebase-auth.css", "assets/catalogue-controls.js",
        "assets/catalogue-controls.css", "assets/catalogue-wide.js", "assets/cart-checkout-premium.js",
        "assets/universal-checkout-ui.js", "assets/ad-readiness.js", "assets/analytics-events.js",
        "assets/us-live-products.json", "assets/us-stock-status.json", "assets/us-products.js",
        "assets/us-order-success.js", "scripts/responsive-browser-audit.mjs", "lib/us-checkout-products.mjs",
        "api/us-create-checkout-session.mjs", "api/us-checkout-health.mjs", "llms.txt", "robots.txt", "sitemap.xml",
    ]
    for path in routes + assets:
        if (ROOT / path).exists():
            passes.append(f"PASS exists: {path}")
        else:
            errors.append(f"missing {path}")

    # Current storefront shell: approved reference home + final stability layer.
    for token, label in [
        ('dataset.otTheme="light"', "light retail theme lock"),
        ('reference-storefront.css?v=3', "approved reference storefront CSS"),
        ('reference-storefront.js?v=3', "approved reference storefront runtime"),
        ('reference-storefront-fidelity.css?v=1', "reference fidelity CSS"),
        ('reference-storefront-fidelity.js?v=1', "reference fidelity runtime"),
        ('ad-ready-stability.css?v=1', "final ad-ready stability layer"),
        ('retail-region-enhancements.js?v=2', "regional switch enhancement"),
        ('querySelectorAll("[data-ot-theme-toggle],.ot-theme-toggle").forEach(node=>node.remove())', "legacy theme-toggle removal"),
        ('scrubPublicBusinessDetails()', "public business-detail cleanup"),
        ('sanitizeStructuredData()', "structured-data cleanup"),
        ('compactReferenceMobileNav()', "mobile nav compaction"),
        ('document.querySelectorAll(".mobile-store-bar").forEach(node=>node.remove())', "cart/checkout overlay removal"),
    ]:
        need("assets/storefront-performance.js", token, label)

    # Approved customer-facing US/UK homepage architecture.
    for token, label in [
        ("header.className='ot-ref-header'", "reference retail header"),
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
    ]:
        need("assets/reference-storefront.js", token, label)

    for token, label in [
        ('omni-terrain-subtle-logo.svg', "approved light storefront logo"),
        ('ot-ref-hero-tag', "hero cleanup"),
    ]:
        need("assets/reference-storefront-fidelity.js", token, label)

    for token, label in [
        ('.fitment-panel', "UK dark-panel contrast fix"),
        ('body>footer:not(.ot-ref-footer)', "legacy footer contrast fix"),
        ('.ot-catalogue-loadmore', "catalogue load-more styling"),
        ('grid-template-columns:repeat(4,minmax(0,1fr))', "compact mobile navigation"),
        ('.ot-ref-product{content-visibility:visible', "homepage product visibility safeguard"),
    ]:
        need("assets/ad-ready-stability.css", token, label)

    # Catalogue must not render hundreds of live cards at once.
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

    # Auth/customer account safety remains intact.
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
        ("Continue with Google", "Google UI"),
        ("Create account", "email account UI"),
        ("Privacy Policy", "privacy link"),
    ]:
        if token in auth:
            passes.append(f"PASS auth: {label}")
        else:
            errors.append(f"auth missing {label}")
    ban("assets/firebase-auth.js", ".addScope(", "extra Google OAuth scope")

    # Ads measurement may be present, but campaign launch is a separate decision.
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

    policy_paths = ["terms-conditions.html", "shipping-delivery-policy.html", "returns-refunds-policy.html", "privacy-policy.html"]
    for path in policy_paths:
        need(path, "Effective 3 September 2026", "current policy date")
        need(path, "Secure online checkout", "current checkout footer")
        ban(path, "Request Cart", "legacy request-cart navigation")
        ban(path, "request cart", "legacy request-cart copy")
    need("terms-conditions.html", "Payment is collected immediately through secure Stripe Checkout.", "immediate Stripe payment disclosure")
    need("shipping-delivery-policy.html", "we aim to ship within 30 days", "default shipping-time commitment")
    need("returns-refunds-policy.html", "within 30 calendar days after delivery", "default return-request window")

    need("uk-cart.html", "Secure checkout being enabled", "UK payment-state disclosure")
    need("uk-cart.html", "Prices shown include UK VAT", "UK VAT cart disclosure")

    universal = src("assets/universal-checkout-ui.js")
    for token, label in [
        ("us-live-products.json", "registry read"), ("row.enabled !== true", "enabled gate"),
        ("row.authorizationVerified !== true", "authorization gate"), ("Number(row.priceCents || 0) <= 0", "price gate"),
        ("liveCommerceAlreadyMounted", "duplicate-buybox prevention"),
        ("Final product pricing, authorization and current availability are re-validated", "server re-validation copy"),
    ]:
        if token in universal:
            passes.append(f"PASS universal: {label}")
        else:
            errors.append(f"universal checkout missing {label}")

    checkout = src("assets/cart-checkout-premium.js")
    for token, label in [
        ("us-live-products.json", "registry preflight"),
        ("p.enabled===true&&p.authorizationVerified===true&&Number(p.priceCents)>0", "authorization+price preflight"),
        ("couponCode", "coupon server handoff"), ("PROMO_SAVE_CENTS=500", "OMNI5 $5 preview"),
        ("PROMO_MIN_CENTS=15000", "OMNI5 $150 minimum preview"), ("cart is still saved", "safe payment recovery"),
    ]:
        if token in checkout:
            passes.append(f"PASS checkout: {label}")
        else:
            errors.append(f"checkout missing {label}")

    backend = src("lib/us-checkout-products.mjs")
    for token, label in [
        ("/assets/us-products.js", "products source"), ("/assets/us-live-products.json", "authorization source"),
        ("/assets/us-stock-status.json", "stock-status source"), ("approval.enabled !== true", "enabled gate"),
        ("approval.authorizationVerified !== true", "authorization gate"), ("stock.checkoutReady !== true", "current stock gate"),
        ("MAX_ORDER_CENTS", "cart value guard"), ("MAX_QTY", "quantity guard"),
    ]:
        if token in backend:
            passes.append(f"PASS backend: {label}")
        else:
            errors.append(f"backend missing {label}")
    ban("lib/us-checkout-products.mjs", "LAUNCH_PRICE_OVERRIDES", "launch price override")

    for token, label in [
        ("await resolveUsCheckoutItems", "server item resolution"), ('PROMO_CODE = "OMNI5"', "OMNI5 validation"),
        ("PROMO_MIN_CENTS = 15_000", "OMNI5 $150 minimum"), ("PROMO_SAVE_CENTS = 500", "OMNI5 $5 discount"),
        ("shipping_address_collection", "US address collection"),
    ]:
        need("api/us-create-checkout-session.mjs", token, label)
    need("api/us-checkout-health.mjs", 'checkoutMode: "authorization-gated"', "authorization-gated health")

    # Registry, current stock and product-page schema must agree for advertised products.
    try:
        registry = json.loads(src("assets/us-live-products.json") or "{}")
        stock = json.loads(src("assets/us-stock-status.json") or "{}")
        products = registry.get("products", {})
        enabled = {pid: row for pid, row in products.items() if isinstance(row, dict) and row.get("enabled") is True and row.get("authorizationVerified") is True and int(row.get("priceCents") or 0) > 0}
        stock_ready = {pid: row for pid, row in stock.get("products", {}).items() if isinstance(row, dict) and row.get("checkoutReady") is True and row.get("status") == "in_stock" and row.get("liveApi") == "ORDERABLE"}
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
            page = schema(str(row.get("slug") or ""))
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
