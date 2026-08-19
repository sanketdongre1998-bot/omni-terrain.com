#!/usr/bin/env python3
"""Omni Terrain Keystone master catalogue scoring engine.

Memory-safe streaming version for the 512 MB Lightsail instance.

Reads Keystone Inventory.csv and writes:
- master_catalog.csv: normalized operational catalogue with launch gates
- marketing_candidates.csv: Hero/Core research queue

Important:
- This engine does NOT auto-publish products.
- JobberPrice - Cost is reference spread only, not profit.
- Brand/MAP/content rights and market pricing remain separate review gates.
"""

from __future__ import annotations

import argparse
import csv
import heapq
import re
from collections import Counter
from pathlib import Path

WAREHOUSE_FIELDS = [
    "EastQty", "MidwestQty", "CaliforniaQty", "SoutheastQty",
    "PacificNWQty", "TexasQty", "GreatLakesQty", "FloridaQty",
]

DERIVED_FIELDS = [
    "CategoryInferred", "CategoryConfidence", "AutoKeywordScore",
    "MarineKeywordScore", "RVKeywordScore", "WarehouseCount",
    "NormalizedTotalQty", "ShippingRisk", "LongestDimension",
    "SecondDimension", "LengthPlusGirth", "ReturnRisk",
    "ReferenceSpreadOnly", "ReferenceMarginPctOnly", "CatalogueScore",
    "LaunchStatus", "MarketingTier", "BrandMAPReviewRequired",
    "ContentRightsReviewRequired", "LiveAPIRecheckBeforeSale",
    "MarketPriceResearchRequired", "GateReasons",
]

CATEGORY_KEYWORDS = {
    "AUTO": [
        "automotive", "vehicle", "truck", "jeep", "brake", "hitch", "tow",
        "towing", "ball mount", "receiver", "receiver lock", "gooseneck", "pintle",
        "trailer brake", "control arm", "shock", "strut", "suspension", "steering",
        "steering coupler", "bumper", "grille", "wheel", "axle", "differential",
        "exhaust", "intake", "radiator", "winch", "running board", "nerf", "fender",
        "driveshaft", "transmission", "headlight", "tail light", "taillight", "fog light",
        "f150", "f-150", "f250", "f-250", "f350", "f-350", "silverado", "sierra",
        "ram 1500", "ram 2500", "ram 3500", "tacoma", "tundra", "wrangler",
        "gladiator", "bronco", "mustang", "camaro", "corvette", "charger",
        "challenger", "grand marquis",
    ],
    "MARINE": [
        "marine", "boat", "bilge", "fishfinder", "fish finder", "sonar", "transducer",
        "chartplotter", "chart plotter", "trolling", "anchor", "dock", "outboard",
        "inboard", "navigation light", "marine radio", "depth finder", "boat cover",
        "shore power", "windlass", "livewell",
    ],
    "RV": [
        "rv", "motorhome", "camper", "camping", "fifth wheel", "5th wheel", "awning",
        "sewer", "coach", "travel trailer", "rv trailer", "campervan", "leveling jack",
        "stabilizer jack", "converter/charger", "power center", "shore cord",
    ],
}

BRAND_HINTS = {
    "MARINE": [
        "raymarine", "lowrance", "humminbird", "blue sea", "scanstrut", "bep marine",
        "whale", "rule", "garmin marine", "power-pole", "ronstan", "navico",
    ],
    "RV": [
        "progressive dynamics", "wfco", "valterra", "lippert", "furrion", "dometic rv",
    ],
}


def num(value, default=0.0):
    text = str(value or "").strip().replace(",", "").replace("$", "")
    if not text:
        return default
    try:
        return float(text)
    except ValueError:
        match = re.search(r"-?\d+(?:\.\d+)?", text)
        return float(match.group()) if match else default


def boolean(value):
    return str(value or "").strip().lower() in {"true", "1", "yes", "y"}


def clean(value):
    text = str(value or "").strip()
    if text.startswith('="') and text.endswith('"'):
        text = text[2:-1]
    return text.strip('"').strip()


def score_bucket(value, rules):
    for threshold, score in rules:
        if value >= threshold:
            return score
    return 0


def term_pattern(term):
    """Match whole tokens/phrases and simple plurals without substring collisions."""
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


ALL_CATEGORY_TERMS = set(
    term for terms in CATEGORY_KEYWORDS.values() for term in terms
) | set(
    term for terms in BRAND_HINTS.values() for term in terms
)
TERM_PATTERNS = {term: term_pattern(term) for term in ALL_CATEGORY_TERMS}


def has_term(text, term):
    return bool(TERM_PATTERNS.get(term, term_pattern(term)).search(text))


def infer_category(row):
    vendor = clean(row.get("VendorName")).lower()
    text = " ".join([
        vendor,
        clean(row.get("LongDescription")).lower(),
        clean(row.get("PartNumber")).lower(),
        clean(row.get("ManufacturerPartNo")).lower(),
    ])
    scores = {category: 0 for category in CATEGORY_KEYWORDS}
    for category, keywords in CATEGORY_KEYWORDS.items():
        scores[category] += sum(1 for keyword in keywords if has_term(text, keyword))
    for category, hints in BRAND_HINTS.items():
        scores[category] += 3 * sum(1 for hint in hints if has_term(vendor, hint))
    best = max(scores, key=scores.get)
    best_score = scores[best]
    tied = [k for k, v in scores.items() if v == best_score and v > 0]
    if best_score == 0 or len(tied) > 1:
        return "UNCLASSIFIED", "LOW", scores
    confidence = "HIGH" if best_score >= 3 else "MEDIUM" if best_score >= 2 else "LOW"
    return best, confidence, scores


def shipping_risk(row):
    upsable = boolean(row.get("UPSable"))
    weight = num(row.get("Weight"))
    dims = sorted([num(row.get("Length")), num(row.get("Width")), num(row.get("Height"))], reverse=True)
    longest = dims[0] if dims else 0
    second = dims[1] if len(dims) > 1 else 0
    girth = longest + 2 * sum(dims[1:]) if len(dims) == 3 else longest
    accessorial = num(row.get("UPS_Ground_Assessorial"))

    # US_LTL is intentionally NOT used as a boolean gate.
    if (not upsable) or weight > 150 or longest > 108 or girth > 165:
        risk = "LTL"
    elif accessorial > 0 or weight > 50 or longest > 48 or second > 30 or girth > 130:
        risk = "HIGH"
    elif weight > 20 or longest > 36:
        risk = "MEDIUM"
    else:
        risk = "LOW"
    return risk, round(longest, 2), round(second, 2), round(girth, 2)


def build_record(row):
    normalized = {key: clean(value) for key, value in row.items()}
    stock_by_wh = {field: num(row.get(field)) for field in WAREHOUSE_FIELDS}
    total_stock = num(row.get("TotalQty")) or sum(stock_by_wh.values())
    warehouse_count = sum(value > 0 for value in stock_by_wh.values())

    cost = num(row.get("Cost"))
    jobber = num(row.get("JobberPrice"))
    spread = jobber - cost if jobber > 0 and cost > 0 else 0
    margin_pct = spread / jobber * 100 if jobber > 0 else 0

    category, confidence, category_scores = infer_category(row)
    ship_risk, longest, second, girth = shipping_risk(row)
    return_risk = "HIGH" if boolean(row.get("IsNonReturnable")) else "MEDIUM" if boolean(row.get("IsKit")) or num(row.get("CaseQty"), 1) > 1 else "LOW"

    stock_score = score_bucket(total_stock, [(100, 25), (50, 22), (20, 18), (10, 12), (5, 6)])
    wh_score = score_bucket(warehouse_count, [(5, 20), (4, 18), (3, 15), (2, 12), (1, 6)])
    logistics_score = {"LOW": 25, "MEDIUM": 18, "HIGH": 5, "LTL": 0}[ship_risk]
    returns_score = {"LOW": 10, "MEDIUM": 5, "HIGH": 0}[return_risk]
    category_score = {"AUTO": 10, "MARINE": 8, "RV": 4, "UNCLASSIFIED": 0}[category]
    price_score = 10 if 40 <= cost <= 200 else 7 if 25 <= cost <= 250 else 3 if 10 <= cost <= 400 else 0
    catalogue_score = min(100, stock_score + wh_score + logistics_score + returns_score + category_score + price_score)

    reasons = []
    if boolean(row.get("IsHazmat")): reasons.append("hazmat")
    if boolean(row.get("IsChemical")): reasons.append("chemical")
    if boolean(row.get("IsNonReturnable")): reasons.append("non-returnable")
    if boolean(row.get("IsKit")): reasons.append("kit")
    if num(row.get("CaseQty"), 1) > 1: reasons.append("case-qty>1")
    if ship_risk == "LTL": reasons.append("ltl/oversize")
    elif ship_risk == "HIGH": reasons.append("high-shipping-risk")
    if total_stock <= 0: reasons.append("out-of-stock")
    if cost <= 0: reasons.append("missing-cost")
    if category == "UNCLASSIFIED": reasons.append("category-review")

    if boolean(row.get("IsHazmat")) or boolean(row.get("IsChemical")) or total_stock <= 0 or cost <= 0:
        launch_status = "REJECT"
    elif boolean(row.get("IsNonReturnable")) or boolean(row.get("IsKit")) or num(row.get("CaseQty"), 1) > 1 or ship_risk == "LTL":
        launch_status = "HOLD"
    elif catalogue_score >= 70 and total_stock >= 20 and warehouse_count >= 2 and ship_risk in {"LOW", "MEDIUM"} and num(row.get("UPS_Ground_Assessorial")) == 0 and category in {"AUTO", "MARINE", "RV"}:
        launch_status = "PUBLISH_CANDIDATE"
    else:
        launch_status = "RESEARCH"

    if launch_status == "PUBLISH_CANDIDATE" and catalogue_score >= 80 and category in {"AUTO", "MARINE"} and ship_risk == "LOW" and 40 <= cost <= 200:
        marketing_tier = "HERO_RESEARCH"
    elif launch_status == "PUBLISH_CANDIDATE" and catalogue_score >= 70:
        marketing_tier = "CORE_RESEARCH"
    elif launch_status == "RESEARCH" and catalogue_score >= 55 and category in {"AUTO", "MARINE", "RV"}:
        marketing_tier = "SEO_LONGTAIL_RESEARCH"
    else:
        marketing_tier = "NO_ADS"

    normalized.update({
        "CategoryInferred": category,
        "CategoryConfidence": confidence,
        "AutoKeywordScore": category_scores["AUTO"],
        "MarineKeywordScore": category_scores["MARINE"],
        "RVKeywordScore": category_scores["RV"],
        "WarehouseCount": warehouse_count,
        "NormalizedTotalQty": round(total_stock, 2),
        "ShippingRisk": ship_risk,
        "LongestDimension": longest,
        "SecondDimension": second,
        "LengthPlusGirth": girth,
        "ReturnRisk": return_risk,
        "ReferenceSpreadOnly": round(spread, 2),
        "ReferenceMarginPctOnly": round(margin_pct, 2),
        "CatalogueScore": catalogue_score,
        "LaunchStatus": launch_status,
        "MarketingTier": marketing_tier,
        "BrandMAPReviewRequired": "YES",
        "ContentRightsReviewRequired": "YES",
        "LiveAPIRecheckBeforeSale": "YES",
        "MarketPriceResearchRequired": "YES" if marketing_tier != "NO_ADS" else "NO",
        "GateReasons": ";".join(reasons) if reasons else "operationally-clean",
    })
    return normalized


def rank_tuple(row):
    return (
        {"HERO_RESEARCH": 2, "CORE_RESEARCH": 1}.get(row["MarketingTier"], 0),
        {"AUTO": 3, "MARINE": 2, "RV": 1}.get(row["CategoryInferred"], 0),
        num(row.get("CatalogueScore")),
        num(row.get("WarehouseCount")),
        num(row.get("NormalizedTotalQty")),
    )


def run_self_test():
    """Fast category regression suite for known Auto/Marine collision cases."""
    cases = [
        ({"VendorName": "Generic", "LongDescription": "PERFORMANCE SHOCKS"}, "AUTO"),
        ({"VendorName": "Generic", "LongDescription": "LED HEADLIGHTS"}, "AUTO"),
        ({"VendorName": "Generic", "LongDescription": "5/8 RECEIVER LOCK FORD"}, "AUTO"),
        ({"VendorName": "Generic", "LongDescription": "STEERING COUPLER"}, "AUTO"),
        ({"VendorName": "RAM Mounts", "LongDescription": "RAM Mount fish finder holder for boat"}, "MARINE"),
        ({"VendorName": "Mercury Marine", "LongDescription": "Mercury Marine outboard battery switch"}, "MARINE"),
        ({"VendorName": "Mercury", "LongDescription": "Mercury Grand Marquis steering coupler"}, "AUTO"),
        ({"VendorName": "Generic", "LongDescription": "RAM 1500 receiver lock"}, "AUTO"),
    ]
    failures = []
    for row, expected in cases:
        actual, confidence, scores = infer_category(row)
        description = row.get("LongDescription", "")
        status = "PASS" if actual == expected else "FAIL"
        print(f"{status} | expected={expected:<6} actual={actual:<12} confidence={confidence:<6} | {description} | {scores}")
        if actual != expected:
            failures.append((description, expected, actual, scores))
    if failures:
        raise SystemExit(f"SELF TEST FAILED = {len(failures)}")
    print(f"SELF TEST PASSED = {len(cases)}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="/home/ubuntu/keystone/feed/Inventory.csv")
    parser.add_argument("--output-dir", default="/home/ubuntu/keystone/feed")
    parser.add_argument("--self-test", action="store_true", help="run fast category regression tests and exit")
    args = parser.parse_args()

    if args.self_test:
        run_self_test()
        return

    source = Path(args.input)
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    if not source.exists():
        raise SystemExit(f"Input not found: {source}")

    master_path = out_dir / "master_catalog.csv"
    marketing_path = out_dir / "marketing_candidates.csv"

    launch_counts = Counter()
    category_counts = Counter()
    shipping_counts = Counter()
    marketing_counts = Counter()
    top_marketing = []
    processed = 0

    with source.open("r", encoding="utf-8-sig", errors="replace", newline="") as src, \
         master_path.open("w", newline="", encoding="utf-8") as master_handle, \
         marketing_path.open("w", newline="", encoding="utf-8") as marketing_handle:

        reader = csv.DictReader(src)
        if not reader.fieldnames:
            raise SystemExit("Inventory.csv has no header")
        fieldnames = list(reader.fieldnames) + [f for f in DERIVED_FIELDS if f not in reader.fieldnames]
        master_writer = csv.DictWriter(master_handle, fieldnames=fieldnames, extrasaction="ignore")
        marketing_writer = csv.DictWriter(marketing_handle, fieldnames=fieldnames, extrasaction="ignore")
        master_writer.writeheader()
        marketing_writer.writeheader()

        for raw in reader:
            row = build_record(raw)
            processed += 1
            master_writer.writerow(row)

            launch_counts[row["LaunchStatus"]] += 1
            category_counts[row["CategoryInferred"]] += 1
            shipping_counts[row["ShippingRisk"]] += 1
            marketing_counts[row["MarketingTier"]] += 1

            if row["MarketingTier"] in {"HERO_RESEARCH", "CORE_RESEARCH"}:
                marketing_writer.writerow(row)
                rank = rank_tuple(row)
                item = (rank, processed, {
                    "MarketingTier": row["MarketingTier"],
                    "CategoryInferred": row["CategoryInferred"],
                    "VendorName": row.get("VendorName", ""),
                    "VCPN": row.get("VCPN", ""),
                    "ManufacturerPartNo": row.get("ManufacturerPartNo", ""),
                    "Cost": row.get("Cost", ""),
                    "NormalizedTotalQty": row.get("NormalizedTotalQty", ""),
                    "WarehouseCount": row.get("WarehouseCount", ""),
                    "ShippingRisk": row.get("ShippingRisk", ""),
                    "CatalogueScore": row.get("CatalogueScore", ""),
                })
                if len(top_marketing) < 40:
                    heapq.heappush(top_marketing, item)
                elif rank > top_marketing[0][0]:
                    heapq.heapreplace(top_marketing, item)

            if processed % 10000 == 0:
                print(f"PROCESSED = {processed:,}", flush=True)

    print(f"INPUT ROWS = {processed:,}")
    print(f"MASTER = {master_path}")
    print(f"MARKETING = {marketing_path}")
    print("LAUNCH STATUS =", dict(launch_counts))
    print("CATEGORY =", dict(category_counts))
    print("SHIPPING RISK =", dict(shipping_counts))
    print("MARKETING TIER =", dict(marketing_counts))
    print("\nTOP MARKETING RESEARCH CANDIDATES")

    for _, _, row in sorted(top_marketing, reverse=True):
        print(
            row["MarketingTier"], "|", row["CategoryInferred"], "|",
            row["VendorName"], "|", row["VCPN"], "|", row["ManufacturerPartNo"],
            "| Cost=" + str(row["Cost"]),
            "| Stock=" + str(row["NormalizedTotalQty"]),
            "| WH=" + str(row["WarehouseCount"]),
            "| Ship=" + str(row["ShippingRisk"]),
            "| Score=" + str(row["CatalogueScore"]),
        )


if __name__ == "__main__":
    main()
