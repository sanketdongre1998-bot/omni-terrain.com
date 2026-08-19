#!/usr/bin/env python3
"""Prefilter Keystone market-research candidates for manual competitor research.

ReferenceSpreadOnly / ReferenceMarginPctOnly are supplier reference signals only.
They are NOT sale profit and must never replace live market-price, shipping, fee,
authorization, MAP, content-rights or stock checks.
"""
from __future__ import annotations

import argparse
import csv
from pathlib import Path

BASE = Path("/home/ubuntu/keystone/feed")


def clean(v): return str(v or "").strip()
def num(v):
    try: return float(clean(v).replace("$", "").replace(",", ""))
    except ValueError: return 0.0


def hunt_score(r):
    cost = num(r.get("Cost"))
    spread = num(r.get("ReferenceSpreadOnly"))
    margin = num(r.get("ReferenceMarginPctOnly"))
    stock = num(r.get("NormalizedTotalQty"))
    wh = num(r.get("WarehouseCount"))
    storefront = num(r.get("StorefrontScore"))
    fit = clean(r.get("FitmentRisk"))
    ship = clean(r.get("ShippingRisk"))
    category = clean(r.get("CategoryInferred"))

    score = 0.0
    score += {"LOW": 24, "MEDIUM": 6}.get(fit, -30)
    score += {"LOW": 18, "MEDIUM": 6}.get(ship, -30)
    score += {"AUTO": 9, "MARINE": 7, "RV": 3}.get(category, 0)
    score += min(32, max(0, spread) * 0.32)
    score += min(18, max(0, margin) * 0.45)
    score += min(10, max(0, storefront - 100) * 0.2)
    score += 8 if stock >= 100 else 5 if stock >= 50 else 2 if stock >= 20 else -10
    score += 6 if wh >= 6 else 4 if wh >= 4 else 2 if wh >= 2 else -10
    if 45 <= cost <= 220: score += 10
    elif 30 <= cost <= 300: score += 4
    else: score -= 8
    return round(score, 2)


def eligible(r):
    return (
        clean(r.get("PaidResearchBand")) in {"HERO_MARKET_RESEARCH", "CORE_MARKET_RESEARCH"}
        and clean(r.get("FitmentRisk")) in {"LOW", "MEDIUM"}
        and clean(r.get("ShippingRisk")) in {"LOW", "MEDIUM"}
        and num(r.get("NormalizedTotalQty")) >= 20
        and num(r.get("WarehouseCount")) >= 2
        and num(r.get("Cost")) > 0
    )


def run(inp, out, limit):
    with Path(inp).open("r", encoding="utf-8-sig", errors="replace", newline="") as f:
        rows = [r for r in csv.DictReader(f) if eligible(r)]
    for r in rows:
        r["MarketHuntScore"] = hunt_score(r)
    rows.sort(key=lambda r: (
        num(r.get("MarketHuntScore")),
        num(r.get("ReferenceSpreadOnly")),
        num(r.get("ReferenceMarginPctOnly")),
        num(r.get("NormalizedTotalQty")),
    ), reverse=True)
    selected = rows[:limit]
    fields = list(selected[0].keys()) if selected else []
    with Path(out).open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader(); w.writerows(selected)

    print("=== OMNI TERRAIN MARKET MARGIN HUNT ===")
    print(f"ELIGIBLE POOL = {len(rows):,}")
    print(f"OUTPUT ROWS = {len(selected):,}")
    print(f"OUTPUT = {out}")
    print("NOTE = Reference spread is a prefilter only; live competitor delivered-price research is still mandatory.\n")
    print("TOP 60")
    for r in selected[:60]:
        print(" | ".join([
            clean(r.get("CategoryInferred")), clean(r.get("VendorName")), clean(r.get("VCPN")),
            clean(r.get("ManufacturerPartNo")), clean(r.get("LongDescription")).replace("|", "/"),
            f"Cost=${num(r.get('Cost')):.2f}", f"RefSpread=${num(r.get('ReferenceSpreadOnly')):.2f}",
            f"RefMargin={num(r.get('ReferenceMarginPctOnly')):.1f}%", f"Fit={clean(r.get('FitmentRisk'))}",
            f"Stock={num(r.get('NormalizedTotalQty')):.0f}", f"WH={num(r.get('WarehouseCount')):.0f}",
            f"Hunt={num(r.get('MarketHuntScore')):.1f}",
        ]))


def self_test():
    a={"PaidResearchBand":"CORE_MARKET_RESEARCH","FitmentRisk":"LOW","ShippingRisk":"LOW","CategoryInferred":"AUTO","Cost":"100","ReferenceSpreadOnly":"80","ReferenceMarginPctOnly":"40","NormalizedTotalQty":"100","WarehouseCount":"8","StorefrontScore":"140"}
    b=dict(a, ReferenceSpreadOnly="10", ReferenceMarginPctOnly="8")
    assert eligible(a) and hunt_score(a) > hunt_score(b)
    print("SELF TEST PASSED = 1")


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--input", default=str(BASE/"hero_core_market_research.csv"))
    p.add_argument("--output", default=str(BASE/"market_hunt_top200.csv"))
    p.add_argument("--limit", type=int, default=200)
    p.add_argument("--self-test", action="store_true")
    a=p.parse_args()
    if a.self_test: self_test(); return
    run(a.input, a.output, a.limit)

if __name__=="__main__": main()
