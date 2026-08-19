#!/usr/bin/env python3
"""Stage-two Omni Terrain storefront selector for Keystone master_catalog.csv.

Purpose:
- keep the large catalogue strategy intact
- separate launch-wave catalogue selection from paid-ad Hero research
- reduce fitment-heavy products from the first storefront wave
- preserve expansion candidates instead of discarding them
- avoid substring collisions when classifying fitment signals

This script is intentionally streaming-friendly for the 512 MB Lightsail box.
It does NOT approve MAP/brand rights, content/image rights, market price or final sale eligibility.
"""

from __future__ import annotations

import argparse
import csv
import heapq
import re
from collections import Counter
from pathlib import Path

HIGH_FITMENT = [
    "shock", "strut", "stabilizer", "control arm", "coilover", "steering shaft",
    "steering coupler", "suspension", "lift kit", "lowering kit", "leveling kit",
    "sway bar", "headlight", "tail light", "taillight", "fog light", "grille",
    "fender", "bumper", "running board", "nerf", "wheel spacer", "hub assembly",
    "cv axle", "driveshaft", "motor mount", "transmission mount", "header",
]

MODEL_SPECIFIC = [
    "f150", "f-150", "f250", "f-250", "f350", "f-350", "silverado", "sierra",
    "ram 1500", "ram 2500", "ram 3500", "tacoma", "tundra", "4runner", "wrangler",
    "gladiator", "bronco", "mustang", "camaro", "corvette", "charger", "challenger",
    "sprinter", "transit", "promaster", "suburban", "tahoe", "yukon",
]

VEHICLE_MAKES = [
    "ford", "chevrolet", "chevy", "gmc", "dodge", "ram", "toyota", "nissan",
    "jeep", "honda", "subaru", "mercury", "lincoln", "cadillac", "buick",
    "mazda", "volkswagen", "bmw", "mercedes", "audi", "kia", "hyundai",
]

# These words are valid vehicle makes but also occur frequently in non-auto product names.
# Do not treat them as vehicle-fitment signals when the stronger non-auto phrase is present.
MAKE_COLLISION_PHRASES = {
    "ram": ["ram mount", "ram mounts", "ram-mount"],
    "mercury": ["mercury marine", "mercury outboard", "mercury mercruiser"],
}

LOW_FITMENT_HINTS = [
    "universal", "ball mount", "pintle", "gooseneck ball", "hitch lock", "receiver lock",
    "tow bar adapter", "tow bar", "bike rack", "cargo carrier", "coupler", "brake controller",
    "brake control", "battery charger", "battery maintainer", "battery switch", "fuse block",
    "fishfinder", "fish finder", "sonar", "marine charger", "wireless charger",
]

CATEGORY_PRIORITY = {"AUTO": 3, "MARINE": 2, "RV": 1}
WAVE_QUOTA = {"AUTO": 650, "MARINE": 250, "RV": 100}


def n(value, default=0.0):
    try:
        return float(str(value or "").replace(",", "").strip() or default)
    except ValueError:
        return default


def text_for(row):
    return " ".join(
        str(row.get(k, "")) for k in (
            "VendorName", "LongDescription", "PartNumber", "ManufacturerPartNo"
        )
    ).lower()


def term_pattern(term):
    """Compile a token/phrase matcher instead of unsafe ``term in text`` matching.

    Spaces inside phrases also match hyphen, slash or underscore separators. The final
    word accepts a simple plural for normal alphabetic terms, which catches inputs such
    as SHOCKS and HEADLIGHTS without allowing matches inside unrelated words.
    """
    raw = term.strip().lower()
    pieces = [p for p in re.split(r"[\s/_-]+", raw) if p]
    if not pieces:
        return re.compile(r"a^")

    encoded = [re.escape(piece) for piece in pieces]
    last = pieces[-1]
    if last.isalpha() and not last.endswith("s"):
        encoded[-1] = rf"{re.escape(last)}(?:s|es)?"
    body = r"[\s/_-]+".join(encoded)
    return re.compile(rf"(?<![a-z0-9]){body}(?![a-z0-9])", re.IGNORECASE)


TERM_PATTERNS = {
    term: term_pattern(term)
    for term in set(HIGH_FITMENT + MODEL_SPECIFIC + VEHICLE_MAKES + LOW_FITMENT_HINTS)
}


def has_term(text, term):
    pattern = TERM_PATTERNS.get(term)
    if pattern is None:
        pattern = term_pattern(term)
    return bool(pattern.search(text))


def matching_terms(text, terms):
    return [term for term in terms if has_term(text, term)]


def vehicle_make_hits(text):
    hits = []
    for make in VEHICLE_MAKES:
        if not has_term(text, make):
            continue
        collisions = MAKE_COLLISION_PHRASES.get(make, [])
        if any(term_pattern(phrase).search(text) for phrase in collisions):
            continue
        hits.append(make)
    return hits


def fitment_risk(row):
    text = text_for(row)
    high_hits = matching_terms(text, HIGH_FITMENT)
    model_hits = matching_terms(text, MODEL_SPECIFIC)
    year_hits = re.findall(r"\b(?:19|20)\d{2}\b", text)
    low_hits = matching_terms(text, LOW_FITMENT_HINTS)
    make_hits = vehicle_make_hits(text)

    if high_hits:
        return "HIGH", ",".join(high_hits[:4])
    if model_hits or year_hits:
        return "MEDIUM", ",".join((model_hits + year_hits)[:4])
    # A nominally universal accessory becomes fitment-sensitive when the listing itself
    # names a vehicle make. This catches examples such as "5/8 receiver lock Ford" while
    # keeping generic receiver locks in LOW.
    if make_hits and low_hits:
        return "MEDIUM", ",".join((make_hits + low_hits)[:4])
    if low_hits:
        return "LOW", ",".join(low_hits[:4])
    return "MEDIUM", "no-universal-signal"


def storefront_score(row, fitment):
    category = row.get("CategoryInferred", "UNCLASSIFIED")
    score = n(row.get("CatalogueScore"))
    score += CATEGORY_PRIORITY.get(category, 0) * 4
    score += min(12, n(row.get("WarehouseCount")) * 1.5)
    stock = n(row.get("NormalizedTotalQty"))
    score += 8 if stock >= 100 else 6 if stock >= 50 else 4 if stock >= 20 else 0
    score += {"LOW": 10, "MEDIUM": 2, "HIGH": -18}.get(fitment, -10)
    score += {"LOW": 8, "MEDIUM": 2, "HIGH": -15, "LTL": -30}.get(row.get("ShippingRisk"), -10)
    if row.get("CategoryConfidence") == "HIGH":
        score += 5
    elif row.get("CategoryConfidence") == "LOW":
        score -= 4
    return round(score, 2)


def stage(row, fitment, score):
    category = row.get("CategoryInferred")
    launch = row.get("LaunchStatus")
    ship = row.get("ShippingRisk")
    stock = n(row.get("NormalizedTotalQty"))
    warehouses = n(row.get("WarehouseCount"))

    if category not in {"AUTO", "MARINE", "RV"}:
        return "OUT_OF_SCOPE"
    if launch != "PUBLISH_CANDIDATE":
        return "EXPANSION_REVIEW"
    if ship in {"HIGH", "LTL"}:
        return "EXPANSION_REVIEW"
    if stock < 20 or warehouses < 2:
        return "EXPANSION_REVIEW"
    if fitment == "HIGH":
        return "EXPANSION_REVIEW"
    if score >= 100:
        return "WAVE1_ELIGIBLE"
    return "CORE_REVIEW"


def marketing_band(row, fitment, score):
    category = row.get("CategoryInferred")
    cost = n(row.get("Cost"))
    stock = n(row.get("NormalizedTotalQty"))
    wh = n(row.get("WarehouseCount"))
    ship = row.get("ShippingRisk")

    if (
        category in {"AUTO", "MARINE"}
        and fitment == "LOW"
        and ship == "LOW"
        and 35 <= cost <= 220
        and stock >= 20
        and wh >= 2
        and score >= 110
    ):
        return "HERO_MARKET_RESEARCH"
    if (
        category in {"AUTO", "MARINE", "RV"}
        and fitment in {"LOW", "MEDIUM"}
        and ship in {"LOW", "MEDIUM"}
        and stock >= 20
        and wh >= 2
        and score >= 100
    ):
        return "CORE_MARKET_RESEARCH"
    return "NO_PAID_RESEARCH"


def write_rows(path, fieldnames, rows):
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)


def run_self_test():
    """Fast regression suite for the known fitment/collision edge cases."""
    cases = [
        ("PERFORMANCE SHOCKS", "HIGH"),
        ("LED HEADLIGHTS", "HIGH"),
        ("5/8 RECEIVER LOCK FORD", "MEDIUM"),
        ("5/8 RECEIVER LOCK", "LOW"),
        ("STEERING COUPLER", "HIGH"),
        ("RAM Mount fish finder", "LOW"),
        ("Mercury Marine battery switch", "LOW"),
    ]
    failures = []
    for description, expected in cases:
        actual, signals = fitment_risk({"LongDescription": description})
        status = "PASS" if actual == expected else "FAIL"
        print(f"{status} | expected={expected:<6} actual={actual:<6} | {description} | {signals}")
        if actual != expected:
            failures.append((description, expected, actual, signals))
    if failures:
        raise SystemExit(f"SELF TEST FAILED = {len(failures)}")
    print(f"SELF TEST PASSED = {len(cases)}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", default="/home/ubuntu/keystone/feed/master_catalog.csv")
    ap.add_argument("--output-dir", default="/home/ubuntu/keystone/feed")
    ap.add_argument("--self-test", action="store_true", help="run fast classifier regression tests and exit")
    args = ap.parse_args()

    if args.self_test:
        run_self_test()
        return

    source = Path(args.input)
    outdir = Path(args.output_dir)
    outdir.mkdir(parents=True, exist_ok=True)
    if not source.exists():
        raise SystemExit(f"Input not found: {source}")

    all_candidates_path = outdir / "storefront_candidates.csv"
    expansion_path = outdir / "expansion_candidates.csv"
    marketing_path = outdir / "hero_core_market_research.csv"
    wave1_path = outdir / "launch_wave1.csv"

    counts = Counter()
    fit_counts = Counter()
    cat_counts = Counter()
    marketing_counts = Counter()
    fieldnames = None

    # Keep only the best eligible rows in memory. 1000 rows is safe on 512 MB RAM.
    heaps = {category: [] for category in WAVE_QUOTA}
    marketing_heap = []
    seq = 0

    with source.open("r", encoding="utf-8-sig", errors="replace", newline="") as src, \
         all_candidates_path.open("w", newline="", encoding="utf-8") as cand_f, \
         expansion_path.open("w", newline="", encoding="utf-8") as exp_f, \
         marketing_path.open("w", newline="", encoding="utf-8") as mkt_f:

        reader = csv.DictReader(src)
        extra = ["FitmentRisk", "FitmentSignals", "StorefrontScore", "StorefrontStage", "PaidResearchBand"]
        fieldnames = list(reader.fieldnames or []) + extra
        cand_w = csv.DictWriter(cand_f, fieldnames=fieldnames, extrasaction="ignore")
        exp_w = csv.DictWriter(exp_f, fieldnames=fieldnames, extrasaction="ignore")
        mkt_w = csv.DictWriter(mkt_f, fieldnames=fieldnames, extrasaction="ignore")
        cand_w.writeheader(); exp_w.writeheader(); mkt_w.writeheader()

        for row in reader:
            seq += 1
            fitment, signals = fitment_risk(row)
            score = storefront_score(row, fitment)
            storefront_stage = stage(row, fitment, score)
            band = marketing_band(row, fitment, score)
            row.update({
                "FitmentRisk": fitment,
                "FitmentSignals": signals,
                "StorefrontScore": score,
                "StorefrontStage": storefront_stage,
                "PaidResearchBand": band,
            })

            counts[storefront_stage] += 1
            fit_counts[fitment] += 1
            cat_counts[row.get("CategoryInferred", "UNCLASSIFIED")] += 1
            marketing_counts[band] += 1

            if storefront_stage in {"WAVE1_ELIGIBLE", "CORE_REVIEW"}:
                cand_w.writerow(row)
            elif storefront_stage == "EXPANSION_REVIEW":
                exp_w.writerow(row)

            if band != "NO_PAID_RESEARCH":
                mkt_w.writerow(row)
                item = (score, n(row.get("NormalizedTotalQty")), seq, row.copy())
                if len(marketing_heap) < 150:
                    heapq.heappush(marketing_heap, item)
                elif item[:3] > marketing_heap[0][:3]:
                    heapq.heapreplace(marketing_heap, item)

            if storefront_stage == "WAVE1_ELIGIBLE":
                category = row.get("CategoryInferred")
                if category in heaps:
                    item = (score, n(row.get("NormalizedTotalQty")), seq, row.copy())
                    quota = WAVE_QUOTA[category]
                    if len(heaps[category]) < quota:
                        heapq.heappush(heaps[category], item)
                    elif item[:3] > heaps[category][0][:3]:
                        heapq.heapreplace(heaps[category], item)

            if seq % 25000 == 0:
                print(f"STAGE2 PROCESSED = {seq:,}")

    wave_rows = []
    for category in ("AUTO", "MARINE", "RV"):
        wave_rows.extend(item[3] for item in sorted(heaps[category], reverse=True))
    wave_rows.sort(
        key=lambda r: (
            CATEGORY_PRIORITY.get(r.get("CategoryInferred"), 0),
            n(r.get("StorefrontScore")),
            n(r.get("NormalizedTotalQty")),
        ),
        reverse=True,
    )
    write_rows(wave1_path, fieldnames, wave_rows)

    top_marketing = [item[3] for item in sorted(marketing_heap, reverse=True)]

    print(f"INPUT ROWS = {seq:,}")
    print("STOREFRONT STAGE =", dict(counts))
    print("FITMENT RISK =", dict(fit_counts))
    print("CATEGORY =", dict(cat_counts))
    print("PAID RESEARCH =", dict(marketing_counts))
    print(f"WAVE1 SELECTED = {len(wave_rows):,}")
    print("WAVE1 BY CATEGORY =", dict(Counter(r.get("CategoryInferred") for r in wave_rows)))
    print(f"WAVE1 FILE = {wave1_path}")
    print(f"STORE CANDIDATES = {all_candidates_path}")
    print(f"EXPANSION = {expansion_path}")
    print(f"MARKET RESEARCH = {marketing_path}")
    print("\nTOP 40 PAID-MARKET-RESEARCH CANDIDATES")
    for r in top_marketing[:40]:
        print(
            r.get("PaidResearchBand"), "|", r.get("CategoryInferred"), "|",
            r.get("VendorName"), "|", r.get("VCPN"), "|", r.get("ManufacturerPartNo"),
            "| Fit=" + str(r.get("FitmentRisk")),
            "| Cost=" + str(r.get("Cost")),
            "| Stock=" + str(r.get("NormalizedTotalQty")),
            "| WH=" + str(r.get("WarehouseCount")),
            "| Ship=" + str(r.get("ShippingRisk")),
            "| Score=" + str(r.get("StorefrontScore")),
        )


if __name__ == "__main__":
    main()
