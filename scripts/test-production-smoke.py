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
    (passes if token in src(path) else errors).append(("PASS " if token in src(path) else "") + f"{path}: {label}")


def ban(path: str, token: str, label: str) -> None:
    if token in src(path): errors.append(f"{path}: disallowed {label}")
    else: passes.append(f"PASS {path}: no {label}")


def schema(path: str) -> dict:
    for raw in re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', src(path), re.I | re.S):
        try: data = json.loads(raw)
        except Exception: continue
        items = data.get("@graph", []) if isinstance(data, dict) and isinstance(data.get("@graph"), list) else [data]
        for item in items:
            if isinstance(item, dict) and item.get("@type") == "Product": return item
    return {}


def main() -> int:
    routes = ["index.html","deals.html","us-catalogue.html","automotive.html","marine.html","rv.html","cart.html","checkout.html","contact-and-order-help.html","shipping-delivery-policy.html","returns-refunds-policy.html","privacy-policy.html","terms-conditions.html","us-order-success.html"]
    assets = ["assets/us-shell.js","assets/firebase-auth.js","assets/firebase-auth.css","assets/catalogue-controls.js","assets/customer-marketing-copy.js","assets/growth-marketing.js","assets/offer-copy-polish.js","assets/ad-readiness.js","assets/analytics-events.js","assets/universal-checkout-ui.js","assets/cart-checkout-premium.js","assets/storefront-performance.js","assets/responsive-hardening.css","assets/dark-theme-polish.css","assets/brand-speed.css","assets/us-launch-offers.js","assets/us-live-products.json","assets/us-display-prices.js","assets/us-products.js","assets/us-order-success.js","scripts/responsive-browser-audit.mjs","scripts/dark-theme-browser-audit.mjs","lib/us-checkout-products.mjs","api/us-create-checkout-session.mjs","api/us-checkout-health.mjs"]
    for path in routes + assets:
        if (ROOT / path).exists(): passes.append(f"PASS exists: {path}")
        else: errors.append(f"missing {path}")

    # Retail copy / SEO safety.
    need("index.html", "Automotive, marine and RV products", "customer catalogue depth")
    for bad in ["Five products priced to win","operating gates","Clear availability gates","Auto first"]: ban("index.html", bad, bad)
    need("deals.html", "Featured Auto &amp; Truck Offers", "featured offers title")
    need("deals.html", "Gear up for", "retail offer headline")
    need("deals.html", "7 featured offers", "seven featured offers")
    for bad in ["exact dollar savings","regular online price, featured price","Clear savings"]: ban("deals.html", bad, bad)
    need("assets/growth-marketing.js", "OMNI5", "promo code")
    need("assets/offer-copy-polish.js", "ot-deal-saving", "generated deal-savings cleanup")
    need("assets/live-storefront-priority.js", "standard US shipping included", "factual homepage shipping copy")
    ban("assets/live-storefront-priority.js", "Featured shipping savings", "homepage shipping-as-discount claim")
    need("assets/us-live-commerce.js", "Standard US shipping", "product-page shipping copy")
    ban("assets/us-live-commerce.js", "Your delivery discount", "product-page shipping-as-discount claim")
    ban("assets/us-live-commerce.js", "us-display-prices.js", "broad public supplier-price injection")
    ban("assets/growth-marketing.js", "compareAtCents", "unverified compare-at pricing")
    ban("assets/live-storefront-priority.js", "compareAtCents", "unverified homepage compare-at pricing")
    need("assets/customer-marketing-copy.js", "Shop with confidence.", "customer trust copy")
    need("assets/ad-readiness.js", "gclid", "paid-search attribution capture")
    need("assets/ad-readiness.js", "Clear online pricing", "retail ad landing copy")

    # Google account sign-in uses Firebase Auth with no additional Google scopes.
    for token, label in [("omni-terrain.firebaseapp.com","Firebase auth domain"),("new GoogleAuthProvider()","Google provider"),("signInWithPopup(auth, provider)","popup sign-in"),("browserLocalPersistence","persistent browser session"),("onAuthStateChanged","auth state observer"),("prefillCheckout(currentUser)","signed-in checkout prefill")]: need("assets/firebase-auth.js", token, label)
    ban("assets/firebase-auth.js", ".addScope(", "extra Google OAuth scope")
    need("assets/us-shell.js", "data-ot-auth-trigger", "shared account trigger")
    need("index.html", "assets/firebase-auth.js?v=1", "homepage account module")
    need("privacy-policy.html", "Google account profile", "Firebase account privacy notice")

    # Final responsive/dark/approved-brand UI layer.
    need("assets/storefront-performance.js", "responsive-hardening.css?v=4", "cache-busted responsive layer")
    need("assets/storefront-performance.js", "brand-speed.css?v=16", "locked brand-speed layer")
    need("assets/storefront-performance.js", "omni-terrain-approved-gt.webp?v=1", "approved locked GT logo asset")
    need("assets/responsive-hardening.css", "dark-theme-polish.css?v=1", "dark theme import")
    need("assets/brand-speed.css", "Exact approved GT-shield Omni Terrain logo", "approved GT wordmark styling")
    need("assets/brand-speed.css", ".ot-brand-logo-image", "locked logo image styling")
    need("assets/brand-speed.css", "content-visibility:auto", "below-fold render skipping")
    need("assets/dark-theme-polish.css", "--ot-night-text:#f3f6fa", "dark primary contrast")
    for token, label in [(".ot-promo-box","dark promo"),(".ot-search-input","dark filters"),(".ot-primary-btn","dark CTA")]: need("assets/dark-theme-polish.css", token, label)

    # Product checkout UI can only mount after published registry authorization.
    universal = src("assets/universal-checkout-ui.js")
    for token, label in [("us-live-products.json","registry read"),("row.enabled !== true","enabled gate"),("row.authorizationVerified !== true","authorization gate"),("Number(row.priceCents || 0) <= 0","price gate"),("liveCommerceAlreadyMounted","duplicate-buybox prevention"),("Final product pricing, authorization and current availability are re-validated","server re-validation copy")]:
        if token in universal: passes.append(f"PASS universal: {label}")
        else: errors.append(f"universal checkout missing {label}")

    # Cart/checkout uses same real registry; minified runtime intentionally has no whitespace.
    checkout = src("assets/cart-checkout-premium.js")
    for token, label in [("us-live-products.json","registry preflight"),("p.enabled===true&&p.authorizationVerified===true&&Number(p.priceCents)>0","authorization+price preflight"),("couponCode","coupon server handoff"),("PROMO_SAVE_CENTS=500","OMNI5 $5 preview"),("PROMO_MIN_CENTS=15000","OMNI5 $150 minimum preview"),("cart is still saved","safe payment recovery")]:
        if token in checkout: passes.append(f"PASS checkout: {label}")
        else: errors.append(f"checkout missing {label}")

    # Server source of truth.
    backend = src("lib/us-checkout-products.mjs")
    for token, label in [("/assets/us-products.js","products source"),("/assets/us-display-prices.js","price source"),("/assets/us-live-products.json","authorization source"),("approval.enabled !== true","enabled gate"),("approval.authorizationVerified !== true","authorization gate"),("price.priceCents !== approvedPriceCents","price agreement gate"),("MAX_ORDER_CENTS","cart value guard"),("MAX_QTY","quantity guard")]:
        if token in backend: passes.append(f"PASS backend: {label}")
        else: errors.append(f"backend missing {label}")
    ban("lib/us-checkout-products.mjs", "LAUNCH_PRICE_OVERRIDES", "launch price override")

    # Stripe endpoint, OMNI5 and verified purchase tracking.
    for token, label in [("await resolveUsCheckoutItems","server item resolution"),("server_storefront_catalogue","pricing metadata"),("shipping_address_collection","US address collection"),('PROMO_CODE = "OMNI5"',"OMNI5 validation"),("PROMO_MIN_CENTS = 15_000","OMNI5 $150 minimum"),("PROMO_SAVE_CENTS = 500","OMNI5 $5 discount"),("FEATURED_DEAL_IDS","no-stack guard")]: need("api/us-create-checkout-session.mjs", token, label)
    need("api/us-checkout-health.mjs", 'checkoutMode: "authorization-gated"', "authorization-gated health")
    need("assets/analytics-events.js", "const price = Number(offer?.price || 0);", "canonical analytics price")
    need("assets/analytics-events.js", "traffic_attribution", "attribution on ecommerce events")
    ban("assets/analytics-events.js", "promo.priceCents", "promo analytics price override")
    need("assets/us-order-success.js", 'event: "purchase"', "purchase event")
    need("assets/us-order-success.js", "if (!data.paid)", "paid verification before purchase")
    need("assets/us-order-success.js", "traffic_attribution", "attribution on verified purchase")

    # Registry integrity + 7 featured PDP schema prices must equal canonical registry prices exactly.
    try:
        registry = json.loads(src("assets/us-live-products.json") or "{}")
        products = registry.get("products", {})
        enabled = {pid: row for pid, row in products.items() if isinstance(row, dict) and row.get("enabled") is True and row.get("authorizationVerified") is True and int(row.get("priceCents") or 0) > 0}
        bad = [pid for pid, row in products.items() if isinstance(row, dict) and row.get("enabled") is True and row.get("authorizationVerified") is not True]
        if bad: errors.append(f"enabled but unverified: {bad[:10]}")
        else: passes.append("PASS registry: no enabled-unverified products")
        if len(enabled) == 301: passes.append("PASS registry: 301 checkout-ready products")
        else: errors.append(f"registry checkout-ready count changed: {len(enabled)}")

        featured = ["HUS81147","HUS81148","CCIN9010F","CCIN8010F","CCIIMP103X","A1360828HD","B5224066464"]
        for pid in featured:
            row = enabled.get(pid)
            if not row:
                errors.append(f"featured {pid} not enabled+verified")
                continue
            page = schema(str(row.get("slug") or ""))
            offer = page.get("offers", {}) if isinstance(page, dict) else {}
            if isinstance(offer, list): offer = offer[0] if offer else {}
            actual = round(float((offer or {}).get("price") or 0) * 100)
            expected = int(row.get("priceCents") or 0)
            if actual == expected: passes.append(f"PASS {pid}: schema={expected}c")
            else: errors.append(f"{pid}: schema {actual}c != registry {expected}c")
    except Exception as exc:
        errors.append(f"registry/schema validation error: {exc}")

    # Featured merchandising metadata must never rewrite prices or claim an unverified markdown.
    ban("assets/us-launch-offers.js", "priceCents", "featured price override")
    ban("assets/us-launch-offers.js", "compareAtCents", "compare-at price override")
    need("assets/us-launch-offers.js", "Featured Pick", "factual featured-product metadata")
    ban("assets/us-launch-offers.js", "Today's featured deal price", "unverified featured deal-price claim")

    if src("assets/us-products.js").count('"id":') >= 900: passes.append("PASS catalogue: broad product source")
    else: errors.append("US product source unexpectedly small")

    print("=== OMNI TERRAIN PRODUCTION SMOKE ===")
    for row in passes: print(row)
    if errors:
        print("\nFAILURES")
        for row in errors: print("FAIL", row)
        print(f"\nRESULT = FAIL ({len(errors)} issue(s))")
        return 1
    print(f"\nRESULT = PASS ({len(passes)} checks)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
