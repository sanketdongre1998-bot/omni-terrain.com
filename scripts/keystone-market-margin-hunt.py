#!/usr/bin/env python3
"""Prefilter Keystone market-research candidates for manual competitor research.

ReferenceSpreadOnly / ReferenceMarginPctOnly are supplier reference signals only.
They are NOT sale profit and must never replace live market-price, shipping, fee,
authorization, MAP, content-rights, stock or demand checks.

The ranking deliberately supports two commercial paths:
1) margin winners, where healthy per-order contribution can carry modest volume;
2) volume winners, where lower per-order contribution is acceptable only when
   stock depth, warehouse coverage, fitment simplicity and live demand support it.
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


def volume_proxy_score(r):
    """Operational demand proxy only; live search/market demand must still be checked."""
    stock = num(r.get("NormalizedTotalQty"))
    wh = num(r.get("WarehouseCount"))
    fit = clean(r.get("FitmentRisk"))
    ship = clean(r.get("ShippingRisk"))
    category = clean(r.get("CategoryInferred"))
    cost = num(r.get("Cost"))

    score = 0.0
    score += 20 if stock >= 250 else 16 if stock >= 150 else 12 if stock >= 100 else 8 if stock >= 50 else 4
    score += 16 if wh >= 8 else 13 if wh >= 6 else 9 if wh >= 4 else 5
    score += {"LOW": 18, "MEDIUM": 7}.get(fit, -25)
    score += {"LOW": 14, "MEDIUM": 5}.get(ship, -25)
    score += {"AUTO": 8, "MARINE": 6, "RV": 3}.get(category, 0)
    if 25 <= cost <= 150:
        score += 8
    elif 150 < cost <= 250:
        score += 4
    elif cost > 400:
        score -= 5
    return round(score, 2)


def research_mode(r):
    spread = num(r.get("ReferenceSpreadOnly"))
    margin = num(r.get("ReferenceMarginPctOnly"))
    volume = num(r.get("VolumeProxyScore"))

    if spread >= 55 and margin >= 30:
        return "MARGIN_WINNER_RESEARCH"
    if volume >= 58 and spread >= 18 and margin >= 12:
        return "VOLUME_WINNER_RESEARCH"
    if spread >= 30 and margin >= 20:
        return "BALANCED_RESEARCH"
    return "STORE_OR_ORGANIC_RESEARCH"


def hunt_score(r):
    cost = num(r.get("Cost"))
    spread = num(r.get("ReferenceSpreadOnly"))
    margin = num(r.get("ReferenceMarginPctOnly"))
    storefront = num(r.get("StorefrontScore"))
    fit = clean(r.get("FitmentRisk"))
    ship = clean(r.get("ShippingRisk"))
    category = clean(r.get("CategoryInferred"))
    volume = volume_proxy_score(r)

    score = 0.0
    score += {"LOW": 20, "MEDIUM": 6}.get(fit, -30)
    score += {"LOW": 16, "MEDIUM": 5}.get(ship, -30)
    score += {"AUTO": 8, "MARINE": 6, "RV": 3}.get(category, 0)

    # Margin still matters, but no longer dominates the ranking.
    score += min(26, max(0, spread) * 0.26)
    score += min(14, max(0, margin) * 0.35)

    # Volume proxy is now a first-class signal so lower-margin fast movers surface.
    score += min(26, volume * 0.42)
    score += min(8, max(0, storefront - 100) * 0.16)

    if 35 <= cost <= 220:
        score += 8
    elif 20 <= cost <= 300:
        score += 4
    else:
        score -= 6
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
        r["VolumeProxyScore"] = volume_proxy_score(r)
        r["ResearchMode"] = research_mode(r)
        r["MarketHuntScore"] = hunt_score(r)

    rows.sort(key=lambda r: (
        num(r.get("MarketHuntScore")),
        num(r.get("VolumeProxyScore")),
        num(r.get("ReferenceSpreadOnly")),
        num(r.get("ReferenceMarginPctOnly")),
        num(r.get("NormalizedTotalQty")),
    ), reverse=True)

    selected = rows[:limit]
    fields = list(selected[0].keys()) if selected else []
    with Path(out).open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader(); w.writerows(selected)

    print("=== Omni Terrain MARKET + VOLUME HUNT ===")
    print(f"ELIGIBLE POOL = {len(rows):,}")
    print(f"OUTPUT ROWS = {len(selected):,}")
    print(f"OUTPUT = {out}")
    print("NOTE = Reference spread and volume proxy are research signals only; live competitor delivered-price and live demand checks remain mandatory.\n")
    print("TOP 60")
    for r in selected[:60]:
        print(" | ".join([
            clean(r.get("ResearchMode")), clean(r.get("CategoryInferred")), clean(r.get("VendorName")), clean(r.get("VCPN")),
            clean(r.get("ManufacturerPartNo")), clean(r.get("LongDescription")).replace("|", "/"),
            f"Cost=${num(r.get('Cost')):.2f}", f"RefSpread=${num(r.get('ReferenceSpreadOnly')):.2f}",
            f"RefMargin={num(r.get('ReferenceMarginPctOnly')):.1f}%", f"Volume={num(r.get('VolumeProxyScore')):.1f}",
            f"Fit={clean(r.get('FitmentRisk'))}", f"Stock={num(r.get('NormalizedTotalQty')):.0f}",
            f"WH={num(r.get('WarehouseCount')):.0f}", f"Hunt={num(r.get('MarketHuntScore')):.1f}",
        ]))


def self_test():
    high_margin={"PaidResearchBand":"CORE_MARKET_RESEARCH","FitmentRisk":"LOW","ShippingRisk":"LOW","CategoryInferred":"AUTO","Cost":"100","ReferenceSpreadOnly":"80","ReferenceMarginPctOnly":"40","NormalizedTotalQty":"100","WarehouseCount":"8","StorefrontScore":"140"}
    high_volume={"PaidResearchBand":"CORE_MARKET_RESEARCH","FitmentRisk":"LOW","ShippingRisk":"LOW","CategoryInferred":"AUTO","Cost":"70","ReferenceSpreadOnly":"24","ReferenceMarginPctOnly":"18","NormalizedTotalQty":"400","WarehouseCount":"8","StorefrontScore":"140"}
    weak={"PaidResearchBand":"CORE_MARKET_RESEARCH","FitmentRisk":"MEDIUM","ShippingRisk":"MEDIUM","CategoryInferred":"AUTO","Cost":"250","ReferenceSpreadOnly":"8","ReferenceMarginPctOnly":"5","NormalizedTotalQty":"25","WarehouseCount":"2","StorefrontScore":"105"}

    for row in (high_margin, high_volume, weak):
        row["VolumeProxyScore"] = volume_proxy_score(row)

    assert eligible(high_margin) and eligible(high_volume) and eligible(weak)
    assert research_mode(high_margin) == "MARGIN_WINNER_RESEARCH"
    assert research_mode(high_volume) == "VOLUME_WINNER_RESEARCH"
    assert hunt_score(high_volume) > hunt_score(weak)
    assert hunt_score(high_margin) > hunt_score(weak)
    print("SELF TEST PASSED = 4")


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
