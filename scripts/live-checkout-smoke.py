#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from urllib.parse import urlparse

API = "https://omni-terrain-uk-checkout.vercel.app/api/us-create-checkout-session"
HEALTH = "https://omni-terrain-uk-checkout.vercel.app/api/us-checkout-health"
ORIGIN = "https://omni-terrain.com"

AD_IDS = ["HUS81147", "HUS81148", "CCIN9010F", "B5224066464"]
errors: list[str] = []
passes: list[str] = []


def request_json(url: str, payload: dict | None = None) -> tuple[int, dict]:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="GET" if payload is None else "POST")
    req.add_header("Origin", ORIGIN)
    req.add_header("Accept", "application/json")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=25) as response:
            body = json.loads(response.read().decode("utf-8"))
            return response.status, body
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try: body = json.loads(raw)
        except Exception: body = {"error": raw}
        return exc.code, body


def valid_checkout_url(value: object) -> bool:
    try:
        parsed = urlparse(str(value or ""))
        return parsed.scheme == "https" and parsed.hostname in {"checkout.stripe.com", "billing.stripe.com"}
    except Exception:
        return False


def main() -> int:
    status, health = request_json(HEALTH)
    if status != 200 or health.get("ok") is not True:
        errors.append(f"health failed: HTTP {status}")
    else:
        for key, expected in [("stripeConfigured", True), ("checkoutMode", "authorization-gated"), ("commerceReadyProducts", 301), ("featuredDeals", 7), ("promotionCode", "OMNI5")]:
            if health.get(key) == expected:
                passes.append(f"PASS health {key}={expected}")
            else:
                errors.append(f"health {key}: expected {expected!r}, got {health.get(key)!r}")

    for product_id in AD_IDS:
        status, body = request_json(API, {"items": [{"id": product_id, "qty": 1}]})
        if status == 200 and valid_checkout_url(body.get("url")):
            passes.append(f"PASS {product_id}: Stripe Checkout session created")
        else:
            errors.append(f"{product_id}: checkout session failed HTTP {status}: {body.get('error', 'missing Stripe URL')}")

    # Eligible non-featured cart should accept OMNI5.
    status, body = request_json(API, {"items": [{"id": "HUS33055", "qty": 2}], "couponCode": "OMNI5"})
    promo = body.get("promotion") or {}
    if status == 200 and valid_checkout_url(body.get("url")) and promo.get("code") == "OMNI5" and int(promo.get("savingsCents") or 0) == 500:
        passes.append("PASS OMNI5: eligible regular-priced cart receives $5 promotion")
    else:
        errors.append(f"OMNI5 eligible-cart smoke failed HTTP {status}: {body.get('error', 'promotion marker missing')}")

    # Featured offers must reject coupon stacking before a Stripe session is opened.
    status, body = request_json(API, {"items": [{"id": "HUS81147", "qty": 1}], "couponCode": "OMNI5"})
    message = str(body.get("error") or "")
    if status == 400 and "cannot be combined" in message.lower():
        passes.append("PASS OMNI5: featured-offer stacking rejected")
    else:
        errors.append(f"featured no-stack guard failed HTTP {status}: {message or 'unexpected response'}")

    print("=== OMNI TERRAIN LIVE CHECKOUT SMOKE ===")
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
