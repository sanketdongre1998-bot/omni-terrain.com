#!/usr/bin/env python3
from __future__ import annotations

import json
from collections import Counter
from datetime import datetime
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
STATUS = ROOT / "assets/us-stock-status.json"
LIVE = ROOT / "assets/us-live-products.json"
PRODUCTS = ROOT / "assets/us-products.js"


def basename(value: object) -> str:
    text = unquote(str(value or ""))
    text = text.split("?", 1)[0].split("#", 1)[0].rstrip("/")
    return text.rsplit("/", 1)[-1].lower()


def parse_utc(value: object) -> datetime:
    text = str(value or "").strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    return datetime.fromisoformat(text)


def positive_cents(value: object) -> bool:
    try:
        return int(value or 0) > 0
    except (TypeError, ValueError):
        return False


def load_catalogue_products() -> list[dict]:
    text = PRODUCTS.read_text(encoding="utf-8")
    marker = "const OMNI_US_PRODUCTS = "
    start = text.find(marker)
    if start < 0:
        raise SystemExit("ERROR: OMNI_US_PRODUCTS marker not found")
    start += len(marker)
    end = text.find(";", start)
    if end < 0:
        raise SystemExit("ERROR: OMNI_US_PRODUCTS terminator not found")
    try:
        rows = json.loads(text[start:end])
    except json.JSONDecodeError as exc:
        raise SystemExit(f"ERROR: unable to parse us-products.js: {exc}")
    if not isinstance(rows, list):
        raise SystemExit("ERROR: OMNI_US_PRODUCTS is not a list")
    return [row for row in rows if isinstance(row, dict)]


def main() -> int:
    status = json.loads(STATUS.read_text(encoding="utf-8"))
    live = json.loads(LIVE.read_text(encoding="utf-8"))
    catalogue = load_catalogue_products()

    rows = status.get("products") or {}
    live_rows = live.get("products") or {}
    catalogue_by_id = {str(row.get("id") or ""): row for row in catalogue if row.get("id")}

    try:
        live_time = parse_utc(live.get("generatedAtUTC"))
        stock_time = parse_utc(status.get("generatedAtUTC"))
    except (TypeError, ValueError) as exc:
        raise SystemExit(f"ERROR: invalid registry/stock timestamp: {exc}")
    if stock_time < live_time:
        raise SystemExit("ERROR: stock status is older than checkout registry")

    registry_gated = {}
    ready = {}
    for pid, live_row in live_rows.items():
        if not isinstance(live_row, dict):
            continue
        if not (
            live_row.get("enabled") is True
            and live_row.get("authorizationVerified") is True
            and live_row.get("liveKeystoneOrderable") is True
            and positive_cents(live_row.get("priceCents"))
            and basename(live_row.get("slug"))
        ):
            continue
        registry_gated[pid] = live_row
        stock_row = rows.get(pid)
        if not isinstance(stock_row, dict):
            continue
        if (
            stock_row.get("checkoutReady") is True
            and str(stock_row.get("status") or "").strip().lower() == "in_stock"
            and str(stock_row.get("liveApi") or "").strip().upper() == "ORDERABLE"
            and basename(stock_row.get("slug")) == basename(live_row.get("slug"))
        ):
            ready[pid] = live_row

    reasons = Counter()
    api_states = Counter()
    orderable_review = []
    low_margin_orderable = []
    policy_holds = []

    for pid, row in rows.items():
        if not isinstance(row, dict):
            continue
        reason = str(row.get("reason") or "UNKNOWN").strip().upper()
        api = str(row.get("liveApi") or "").strip().upper()
        status_name = str(row.get("status") or "").strip().lower()
        reasons[reason] += 1
        api_states[api or "NONE"] += 1
        if status_name == "review" and api == "ORDERABLE":
            orderable_review.append(pid)
            if reason.startswith("LOW_MARGIN_AFTER_FREIGHT"):
                low_margin_orderable.append(pid)
        if "AUTH" in reason or "WEBSITE_" in reason or "MAP_" in reason:
            policy_holds.append(pid)

    catalogue_categories = Counter(str(row.get("segment") or "unknown").strip().lower() for row in catalogue)
    ready_categories = Counter(
        str((catalogue_by_id.get(pid) or {}).get("segment") or "unknown").strip().lower()
        for pid in ready
    )
    review_categories = Counter(
        str((catalogue_by_id.get(pid) or {}).get("segment") or "unknown").strip().lower()
        for pid, row in rows.items()
        if isinstance(row, dict) and str(row.get("status") or "").strip().lower() == "review"
    )

    print("=== OMNI TERRAIN CHECKOUT EXPANSION ANALYSIS ===")
    print("LIVE REGISTRY UTC =", live.get("generatedAtUTC"))
    print("STOCK SNAPSHOT UTC =", status.get("generatedAtUTC"))
    print("REGISTRY-GATED PRODUCTS =", len(registry_gated))
    print("CURRENT CHECKOUT READY =", len(ready))
    print("STATUS TOTAL =", len(rows))
    print("CATALOGUE BY CATEGORY =", dict(sorted(catalogue_categories.items())))
    print("CHECKOUT READY BY CATEGORY =", dict(sorted(ready_categories.items())))
    print("REVIEW BY CATEGORY =", dict(sorted(review_categories.items())))
    print("REVIEW =", sum(1 for row in rows.values() if isinstance(row, dict) and str(row.get("status") or "").strip().lower() == "review"))
    print("ORDERABLE REVIEW =", len(orderable_review))
    print("LOW-MARGIN + ORDERABLE =", len(low_margin_orderable))
    print("POLICY/AUTH/MAP HOLDS =", len(policy_holds))
    print("TOP REASONS =", reasons.most_common(20))
    print("API STATES =", api_states.most_common())
    print("LOW-MARGIN SAMPLE =", low_margin_orderable[:30])
    print("TO REACH 400 =", max(0, 400 - len(ready)))
    print("TO REACH 500 =", max(0, 500 - len(ready)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
