#!/usr/bin/env python3
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATUS = ROOT / "assets/us-stock-status.json"
LIVE = ROOT / "assets/us-live-products.json"


def main() -> int:
    status = json.loads(STATUS.read_text(encoding="utf-8"))
    live = json.loads(LIVE.read_text(encoding="utf-8"))

    rows = status.get("products") or {}
    live_rows = live.get("products") or {}
    ready = {
        pid: row
        for pid, row in live_rows.items()
        if isinstance(row, dict)
        and row.get("enabled") is True
        and row.get("authorizationVerified") is True
        and int(row.get("priceCents") or 0) > 0
    }

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

    print("=== OMNI TERRAIN CHECKOUT EXPANSION ANALYSIS ===")
    print("CURRENT CHECKOUT READY =", len(ready))
    print("STATUS TOTAL =", len(rows))
    print("REVIEW =", sum(1 for row in rows.values() if isinstance(row, dict) and row.get("status") == "review"))
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
