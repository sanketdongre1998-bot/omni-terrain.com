#!/usr/bin/env python3
"""Validate Omni Terrain's initial Google Ads Search launch pack.

This is intentionally strict: paid traffic must remain limited to the approved
featured products and every advertised SKU must still pass the storefront live
checkout gate before the pack is considered safe to enable.
"""

from __future__ import annotations

import csv
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
MARKETING = ROOT / "marketing"

CAMPAIGN = "US | Search | Featured Auto | MPN Intent"
EXPECTED = {
    "HUS81147": "us-husky-towing-81147.html",
    "HUS81148": "us-husky-towing-81148.html",
    "CCIN9010F": "us-coast2coast-iwcn9010f.html",
    "CCIN8010F": "us-coast2coast-iwcn8010f.html",
    "CCIIMP103X": "us-coast2coast-iwcimp103x.html",
    "A1360828HD": "us-air-lift-60828hd.html",
    "B5224066464": "us-bilstein-24-066464.html",
}
EXPECTED_AD_GROUPS = {
    "HUSKY 81147 Bike Rack": "HUS81147",
    "HUSKY 81148 Cargo Carrier": "HUS81148",
    "Coast2Coast IWCN9010F": "CCIN9010F",
    "Coast2Coast IWCN8010F": "CCIN8010F",
    "Coast2Coast IWCIMP103X": "CCIIMP103X",
    "Air Lift 60828HD": "A1360828HD",
    "Bilstein 24-066464": "B5224066464",
}


def fail(message: str) -> None:
    raise SystemExit(f"ADS PACK INVALID: {message}")


def load_csv(name: str) -> list[dict[str, str]]:
    path = MARKETING / name
    if not path.exists():
        fail(f"missing {path.relative_to(ROOT)}")
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def load_json(path: Path) -> dict:
    if not path.exists():
        fail(f"missing {path.relative_to(ROOT)}")
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def parse_time(value: object) -> datetime:
    raw = str(value or "").strip()
    if not raw:
        fail("missing generatedAtUTC timestamp")
    if raw.endswith("Z"):
        raw = raw[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(raw)
    except ValueError as exc:
        fail(f"invalid timestamp {value!r}: {exc}")
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def validate_url(raw: str, expected_slug: str | None = None) -> None:
    parsed = urlparse(raw)
    if parsed.scheme != "https" or parsed.netloc.lower() != "omni-terrain.com":
        fail(f"unexpected final URL {raw!r}")
    if expected_slug and parsed.path.lstrip("/").lower() != expected_slug.lower():
        fail(f"final URL {raw!r} does not land on {expected_slug}")
    qs = parse_qs(parsed.query)
    if qs.get("utm_source") != ["google"] or qs.get("utm_medium") != ["cpc"]:
        fail(f"final URL missing google/cpc attribution: {raw!r}")
    if qs.get("utm_campaign") != ["us_search_featured_auto"]:
        fail(f"unexpected utm_campaign in {raw!r}")


def validate_rsa() -> None:
    rows = load_csv("google-ads-search-rsa.csv")
    if len(rows) != 14:
        fail(f"expected 14 RSA rows (2 x 7), found {len(rows)}")

    counts: Counter[str] = Counter()
    variants: defaultdict[str, set[str]] = defaultdict(set)
    for row in rows:
        if row.get("Campaign") != CAMPAIGN:
            fail(f"unexpected campaign in RSA row: {row.get('Campaign')!r}")
        group = row.get("Ad group", "")
        if group not in EXPECTED_AD_GROUPS:
            fail(f"unexpected RSA ad group {group!r}")
        if row.get("Ad type") != "Responsive search ad":
            fail(f"unexpected ad type in {group}")
        if row.get("Status") != "Paused":
            fail(f"RSA must remain Paused before account-side conversion validation: {group}")
        variant = row.get("RSA Variant", "")
        if variant not in {"A", "B"}:
            fail(f"RSA variant must be A or B in {group}")
        counts[group] += 1
        variants[group].add(variant)

        sku = EXPECTED_AD_GROUPS[group]
        validate_url(row.get("Final URL", ""), EXPECTED[sku])

        if len(row.get("Path 1", "")) > 15 or len(row.get("Path 2", "")) > 15:
            fail(f"display path exceeds 15 chars in {group}")

        headlines = [row.get(f"Headline {i}", "").strip() for i in range(1, 16)]
        headlines = [value for value in headlines if value]
        if not 3 <= len(headlines) <= 15:
            fail(f"RSA {group}/{variant} has {len(headlines)} headlines")
        if len(set(headlines)) != len(headlines):
            fail(f"duplicate headline in RSA {group}/{variant}")
        for value in headlines:
            if len(value) > 30:
                fail(f"headline over 30 chars in {group}/{variant}: {value!r}")

        descriptions = [row.get(f"Description {i}", "").strip() for i in range(1, 5)]
        descriptions = [value for value in descriptions if value]
        if not 2 <= len(descriptions) <= 4:
            fail(f"RSA {group}/{variant} has {len(descriptions)} descriptions")
        for value in descriptions:
            if len(value) > 90:
                fail(f"description over 90 chars in {group}/{variant}: {value!r}")

    if set(counts) != set(EXPECTED_AD_GROUPS):
        fail("RSA ad-group set does not match approved launch set")
    for group in EXPECTED_AD_GROUPS:
        if counts[group] != 2 or variants[group] != {"A", "B"}:
            fail(f"{group} must have exactly RSA variants A and B")


def validate_keywords() -> None:
    rows = load_csv("google-ads-keywords.csv")
    if len(rows) != 35:
        fail(f"expected 35 keyword rows (5 x 7), found {len(rows)}")
    counts: Counter[str] = Counter()
    for row in rows:
        if row.get("Campaign") != CAMPAIGN:
            fail("unexpected campaign in keyword CSV")
        group = row.get("Ad group", "")
        if group not in EXPECTED_AD_GROUPS:
            fail(f"unexpected keyword ad group {group!r}")
        if row.get("Match type") not in {"Exact", "Phrase"}:
            fail(f"launch keyword is not Exact/Phrase: {row.get('Keyword')!r}")
        if row.get("Status") != "Paused":
            fail(f"keyword must remain Paused before conversion validation: {row.get('Keyword')!r}")
        if not row.get("Keyword", "").strip():
            fail(f"blank keyword in {group}")
        sku = EXPECTED_AD_GROUPS[group]
        validate_url(row.get("Final URL", ""), EXPECTED[sku])
        counts[group] += 1
    for group in EXPECTED_AD_GROUPS:
        if counts[group] != 5:
            fail(f"{group} must contain exactly 5 launch keywords")


def validate_negatives() -> None:
    rows = load_csv("google-ads-negative-keywords.csv")
    if len(rows) < 15:
        fail("negative keyword list is unexpectedly short")
    seen = set()
    for row in rows:
        if row.get("Campaign") != CAMPAIGN:
            fail("unexpected campaign in negative-keyword CSV")
        keyword = row.get("Negative keyword", "").strip().lower()
        if not keyword:
            fail("blank negative keyword")
        if keyword in seen:
            fail(f"duplicate negative keyword: {keyword}")
        seen.add(keyword)
        if row.get("Match type") not in {"Exact", "Phrase", "Broad"}:
            fail(f"invalid negative match type for {keyword}")


def validate_assets() -> None:
    rows = load_csv("google-ads-assets.csv")
    if not rows:
        fail("asset CSV is empty")
    sitelinks = callouts = snippets = 0
    for row in rows:
        if row.get("Campaign") != CAMPAIGN:
            fail("unexpected campaign in assets CSV")
        asset_type = row.get("Asset type", "")
        text = row.get("Text", "").strip()
        if asset_type == "Sitelink":
            sitelinks += 1
            if len(text) > 25:
                fail(f"sitelink text over 25 chars: {text!r}")
            if len(row.get("Description line 1", "")) > 35 or len(row.get("Description line 2", "")) > 35:
                fail(f"sitelink description over 35 chars: {text!r}")
            parsed = urlparse(row.get("Final URL", ""))
            if parsed.scheme != "https" or parsed.netloc.lower() != "omni-terrain.com":
                fail(f"invalid sitelink URL: {row.get('Final URL')!r}")
        elif asset_type == "Callout":
            callouts += 1
            if not text or len(text) > 25:
                fail(f"callout must be 1-25 chars: {text!r}")
        elif asset_type == "Structured snippet":
            snippets += 1
            if not row.get("Header", "").strip() or not row.get("Values", "").strip():
                fail("structured snippet missing header/values")
        else:
            fail(f"unexpected asset type {asset_type!r}")
    if sitelinks < 4 or callouts < 4 or snippets < 1:
        fail("insufficient campaign assets")


def validate_live_gate() -> None:
    registry = load_json(ROOT / "assets" / "us-live-products.json")
    stock = load_json(ROOT / "assets" / "us-stock-status.json")
    if parse_time(stock.get("generatedAtUTC")) < parse_time(registry.get("generatedAtUTC")):
        fail("stock-status snapshot is older than the live registry")

    registry_products = registry.get("products") or {}
    stock_products = stock.get("products") or {}
    for sku, slug in EXPECTED.items():
        live = registry_products.get(sku)
        state = stock_products.get(sku)
        if not isinstance(live, dict):
            fail(f"{sku} missing from live registry")
        if not isinstance(state, dict):
            fail(f"{sku} missing from stock-status registry")
        if live.get("enabled") is not True:
            fail(f"{sku} live registry enabled != true")
        if live.get("authorizationVerified") is not True:
            fail(f"{sku} authorization is not verified")
        if live.get("liveKeystoneOrderable") is not True:
            fail(f"{sku} is not live supplier-orderable")
        if int(live.get("priceCents") or 0) <= 0:
            fail(f"{sku} has no positive live price")
        if str(live.get("slug") or "").lower() != slug.lower():
            fail(f"{sku} live-registry slug mismatch")
        if live.get("shippingIncluded") is not True:
            fail(f"{sku} no longer has featured shipping included")

        if state.get("checkoutReady") is not True:
            fail(f"{sku} stock status checkoutReady != true")
        if state.get("status") != "in_stock":
            fail(f"{sku} stock status is {state.get('status')!r}")
        if state.get("liveApi") != "ORDERABLE":
            fail(f"{sku} live API is {state.get('liveApi')!r}")
        if str(state.get("slug") or "").lower() != slug.lower():
            fail(f"{sku} stock-status slug mismatch")

        if not (ROOT / slug).exists():
            fail(f"landing page missing for {sku}: {slug}")


def main() -> None:
    validate_rsa()
    validate_keywords()
    validate_negatives()
    validate_assets()
    validate_live_gate()
    print("Google Ads pack validation passed")
    print(f"Campaign: {CAMPAIGN}")
    print("Approved paid-search products: 7")
    print("RSAs: 14 (2 per ad group)")
    print("Keywords: 35 (Exact/Phrase only)")
    print("All campaign rows remain Paused")
    print("All seven SKUs pass the current strict live checkout gate")


if __name__ == "__main__":
    main()
