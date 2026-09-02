#!/usr/bin/env python3
"""Technical validation for Omni Terrain's paused Google Ads draft pack.

IMPORTANT: a passing result is NOT approval to spend. This script validates
ad-file structure plus the storefront live checkout gate only. It does not
validate competitor pricing, supplier economics, expected CPC/CPA, MAP/channel
changes outside the live gate, or commercial profitability. Final ad products
must pass the separate market + economics review before any campaign is enabled.
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
    raise SystemExit(f"ADS PACK TECHNICAL VALIDATION FAILED: {message}")


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


def validate_url(raw: str, expected_slug: str) -> None:
    parsed = urlparse(raw)
    if parsed.scheme != "https" or parsed.netloc.lower() != "omni-terrain.com":
        fail(f"unexpected final URL {raw!r}")
    if parsed.path.lstrip("/").lower() != expected_slug.lower():
        fail(f"final URL {raw!r} does not land on {expected_slug}")
    qs = parse_qs(parsed.query)
    if qs.get("utm_source") != ["google"] or qs.get("utm_medium") != ["cpc"]:
        fail(f"missing google/cpc attribution: {raw!r}")
    if qs.get("utm_campaign") != ["us_search_featured_auto"]:
        fail(f"unexpected utm_campaign: {raw!r}")


def validate_rsa() -> None:
    rows = load_csv("google-ads-search-rsa.csv")
    if len(rows) != 14:
        fail(f"expected 14 RSA rows, found {len(rows)}")
    counts: Counter[str] = Counter()
    variants: defaultdict[str, set[str]] = defaultdict(set)
    for row in rows:
        group = row.get("Ad group", "")
        if row.get("Campaign") != CAMPAIGN or group not in EXPECTED_AD_GROUPS:
            fail(f"unexpected RSA campaign/ad group: {group!r}")
        if row.get("Ad type") != "Responsive search ad":
            fail(f"unexpected ad type in {group}")
        if row.get("Status") != "Paused":
            fail(f"draft RSA must remain Paused: {group}")
        variant = row.get("RSA Variant", "")
        if variant not in {"A", "B"}:
            fail(f"invalid RSA variant in {group}")
        counts[group] += 1
        variants[group].add(variant)
        sku = EXPECTED_AD_GROUPS[group]
        validate_url(row.get("Final URL", ""), EXPECTED[sku])
        if len(row.get("Path 1", "")) > 15 or len(row.get("Path 2", "")) > 15:
            fail(f"display path exceeds 15 characters in {group}")
        headlines = [row.get(f"Headline {i}", "").strip() for i in range(1, 16)]
        headlines = [x for x in headlines if x]
        if not 3 <= len(headlines) <= 15 or any(len(x) > 30 for x in headlines):
            fail(f"headline count/length invalid in {group}/{variant}")
        if len(set(headlines)) != len(headlines):
            fail(f"duplicate headline in {group}/{variant}")
        descriptions = [row.get(f"Description {i}", "").strip() for i in range(1, 5)]
        descriptions = [x for x in descriptions if x]
        if not 2 <= len(descriptions) <= 4 or any(len(x) > 90 for x in descriptions):
            fail(f"description count/length invalid in {group}/{variant}")
    if set(counts) != set(EXPECTED_AD_GROUPS):
        fail("RSA ad-group set differs from draft set")
    for group in EXPECTED_AD_GROUPS:
        if counts[group] != 2 or variants[group] != {"A", "B"}:
            fail(f"{group} must have exactly variants A and B")


def validate_keywords() -> None:
    rows = load_csv("google-ads-keywords.csv")
    if len(rows) != 35:
        fail(f"expected 35 keyword rows, found {len(rows)}")
    counts: Counter[str] = Counter()
    for row in rows:
        group = row.get("Ad group", "")
        if row.get("Campaign") != CAMPAIGN or group not in EXPECTED_AD_GROUPS:
            fail(f"unexpected keyword campaign/ad group: {group!r}")
        if row.get("Match type") not in {"Exact", "Phrase"}:
            fail(f"draft keyword is not Exact/Phrase: {row.get('Keyword')!r}")
        if row.get("Status") != "Paused":
            fail(f"draft keyword must remain Paused: {row.get('Keyword')!r}")
        if not row.get("Keyword", "").strip():
            fail(f"blank keyword in {group}")
        sku = EXPECTED_AD_GROUPS[group]
        validate_url(row.get("Final URL", ""), EXPECTED[sku])
        counts[group] += 1
    for group in EXPECTED_AD_GROUPS:
        if counts[group] != 5:
            fail(f"{group} must contain exactly five draft keywords")


def validate_negatives_and_assets() -> None:
    negatives = load_csv("google-ads-negative-keywords.csv")
    if len(negatives) < 15:
        fail("negative keyword list is unexpectedly short")
    seen = set()
    for row in negatives:
        keyword = row.get("Negative keyword", "").strip().lower()
        if row.get("Campaign") != CAMPAIGN or not keyword:
            fail("invalid negative keyword row")
        if keyword in seen:
            fail(f"duplicate negative keyword: {keyword}")
        seen.add(keyword)
        if row.get("Match type") not in {"Exact", "Phrase", "Broad"}:
            fail(f"invalid negative match type for {keyword}")

    assets = load_csv("google-ads-assets.csv")
    sitelinks = callouts = snippets = 0
    for row in assets:
        if row.get("Campaign") != CAMPAIGN:
            fail("unexpected campaign in assets CSV")
        kind = row.get("Asset type", "")
        text = row.get("Text", "").strip()
        if kind == "Sitelink":
            sitelinks += 1
            if len(text) > 25 or len(row.get("Description line 1", "")) > 35 or len(row.get("Description line 2", "")) > 35:
                fail(f"invalid sitelink length: {text!r}")
            parsed = urlparse(row.get("Final URL", ""))
            if parsed.scheme != "https" or parsed.netloc.lower() != "omni-terrain.com":
                fail(f"invalid sitelink URL: {row.get('Final URL')!r}")
        elif kind == "Callout":
            callouts += 1
            if not text or len(text) > 25:
                fail(f"invalid callout: {text!r}")
        elif kind == "Structured snippet":
            snippets += 1
            if not row.get("Header", "").strip() or not row.get("Values", "").strip():
                fail("structured snippet missing header/values")
        else:
            fail(f"unexpected asset type {kind!r}")
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
        if not isinstance(live, dict) or not isinstance(state, dict):
            fail(f"{sku} missing from live/stock registries")
        if live.get("enabled") is not True or live.get("authorizationVerified") is not True or live.get("liveKeystoneOrderable") is not True:
            fail(f"{sku} fails live enable/auth/orderable gate")
        if int(live.get("priceCents") or 0) <= 0 or str(live.get("slug") or "").lower() != slug.lower():
            fail(f"{sku} fails live price/slug gate")
        if live.get("shippingIncluded") is not True:
            fail(f"{sku} featured shipping promise is no longer active")
        if state.get("checkoutReady") is not True or state.get("status") != "in_stock" or state.get("liveApi") != "ORDERABLE":
            fail(f"{sku} fails current stock/orderable gate")
        if str(state.get("slug") or "").lower() != slug.lower() or not (ROOT / slug).exists():
            fail(f"{sku} landing-page slug/file mismatch")


def main() -> None:
    validate_rsa()
    validate_keywords()
    validate_negatives_and_assets()
    validate_live_gate()
    print("Google Ads draft pack TECHNICAL validation passed")
    print(f"Draft campaign: {CAMPAIGN}")
    print("Draft products checked: 7")
    print("RSAs: 14; keywords: 35; all rows remain Paused")
    print("Live checkout/auth/stock gate: PASS for the seven draft SKUs")
    print("NOT LAUNCH APPROVAL: competitor pricing, economics and CPC headroom are not validated here")


if __name__ == "__main__":
    main()
