#!/usr/bin/env python3
"""Omni Terrain Keystone master catalogue scoring engine.

Reads Keystone Inventory.csv and produces two review files:
- master_catalog.csv: normalized operational catalogue with launch gates
- marketing_candidates.csv: research queue for Hero/Core product evaluation

Important: this engine does NOT auto-publish products and does NOT treat
JobberPrice - Cost as profit. Brand/MAP/content rights and live market pricing
remain separate review steps before a product becomes sellable or advertised.
"""

from __future__ import annotations

import argparse
import csv
import re
from collections import Counter
from pathlib import Path

WAREHOUSE_FIELDS = [
    "EastQty",
    "MidwestQty",
    "CaliforniaQty",
    "SoutheastQty",
    "PacificNWQty",
    "TexasQty",
    "GreatLakesQty",
    "FloridaQty",
]

CATEGORY_KEYWORDS = {
    "AUTO": [
        "automotive", "vehicle", "truck", "jeep", "brake", "hitch", "tow ",
        "towing", "ball mount", "receiver", "gooseneck", "pintle", "trailer brake",
        "control arm", "shock", "strut", "suspension", "steering", "bumper", "grille",
        "wheel", "axle", "differential", "exhaust", "intake", "radiator", "winch",
        "running board", "nerf", "fender", "driveshaft", "transmission",
    ],
    "MARINE": [
        "marine", "boat", "bilge", "fishfinder", "fish finder", "sonar", "transducer",
        "chartplotter", "chart plotter", "trolling", "anchor", "dock", "outboard",
        "inboard", "navigation light", "marine radio", "depth finder", "boat cover",
        "shore power", "windlass", "livewell",
    ],
    "RV": [
        "rv ", "motorhome", "camper", "camping", "fifth wheel", "5th wheel", "awning",
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
    if value is None:
        return default
    text = str(value).strip().replace(",", "").replace("$", "")
    if not text:
        return default
    try:
        return float(text)
    except ValueError:
        m = re.search(r"-?\d+(?:\.\d+)?", text)
        return float(m.group()) if m else default


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


def infer_category(row):
    vendor = clean(row.get("VendorName")).lower()
    text = " ".join(
        [
            vendor,
            clean(row.get("LongDescription")).lower(),
            clean(row.get("PartNumber")).lower(),
            clean(row.get("ManufacturerPartNo")).lower(),
        ]
    )

    scores = {category: 0 for category in CATEGORY_KEYWORDS}
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text:
                scores[category] += 1

    for category, hints in BRAND_HINTS.items():
        for hint in hints:
            if hint in vendor:
                scores[category] += 3

    best = max(scores, key=scores.get)
    best_score = scores[best]
    tied = [category for category, value in scores.items() if value == best_score and value > 0]
    if best_score == 0 or len(tied) > 1:
        return "UNCLASSIFIED", "LOW", scores
    confidence = "HIGH" if best_score >= 3 else "MEDIUM" if best_score >= 2 else "LOW"
    return best, confidence, scores


def shipping_risk(row):
    upsable = boolean(row.get("UPSable"))
    weight = num(row.get("Weight"))
    dims = sorted(
        [num(row.get("Length")), num(row.get("Width")), num(row.get("Height"))],
        reverse=True,
    )
    longest = dims[0] if dims else 0
    second = dims[1] if len(dims) > 1 else 0
    girth = longest + 2 * sum(dims[1:]) if len(dims) == 3 else longest
    accessorial = num(row.get("UPS_Ground_Assessorial"))

    # US_LTL is deliberately NOT used as a boolean gate. The Keystone feed can
    # contain a dollar amount there even for UPSable parcel products.
    if (not upsable) or weight > 150 or longest > 108 or girth > 165:
        risk = "LTL"
    elif accessorial > 0 or weight > 50 or longest > 48 or second > 30 or girth > 130:
        risk = "HIGH"
    elif weight > 20 or longest > 36:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    return risk, round(longest, 2), round(second, 2), round(girth, 2)


def return_risk(row):
    if boolean(row.get("IsNonReturnable")):
        return "HIGH"
    if boolean(row.get("IsKit")) or num(row.get("CaseQty"), 1) > 1:
        return "MEDIUM"
    return "LOW"


def build_record(row):
    normalized = {key: clean(value) for key, value in row.items()}

    stock_by_wh = {field: num(row.get(field)) for field in WAREHOUSE_FIELDS}
    total_stock = num(row.get("TotalQty"))
    if total_stock <= 0:
        total_stock = sum(stock_by_wh.values())
    warehouse_count = sum(value > 0 for value in stock_by_wh.values())

    cost = num(row.get("Cost"))
    jobber = num(row.get("JobberPrice"))
    reference_spread = jobber - cost if jobber > 0 and cost > 0 else 0
    reference_margin_pct = (reference_spread / jobber * 100) if jobber > 0 else 0

    category, category_confidence, category_scores = infer_category(row)
    ship_risk, longest, second, girth = shipping_risk(row)
    ret_risk = return_risk(row)

    stock_score = score_bucket(total_stock, [(100, 25), (50, 22), (20, 18), (10, 12), (5, 6)])
    warehouse_score = score_bucket(warehouse_count, [(5, 20), (4, 18), (3, 15), (2, 12), (1, 6)])
    logistics_score = {"LOW": 25, "MEDIUM": 18, "HIGH": 5, "LTL": 0}[ship_risk]
    returns_score = {"LOW": 10, "MEDIUM": 5, "HIGH": 0}[ret_risk]
    category_score = {"AUTO": 10, "MARINE": 8, "RV": 4, "UNCLASSIFIED": 0}[category]
    price_fit_score = 10 if 40 <= cost <= 200 else 7 if 25 <= cost <= 250 else 3 if 10 <= cost <= 400 else 0
    catalogue_score = min(100, stock_score + warehouse_score + logistics_score + returns_score + category_score + price_fit_score)

    reasons = []
    if boolean(row.get("IsHazmat")):
        reasons.append("hazmat")
    if boolean(row.get("IsChemical")):
        reasons.append("chemical")
    if boolean(row.get("IsNonReturnable")):
        reasons.append("non-returnable")
    if boolean(row.get("IsKit")):
        reasons.append("kit")
    if num(row.get("CaseQty"), 1) > 1:
        reasons.append("case-qty>1")
    if ship_risk == "LTL":
        reasons.append("ltl/oversize")
    elif ship_risk == "HIGH":
        reasons.append("high-shipping-risk")
    if total_stock <= 0:
        reasons.append("out-of-stock")
    if cost <= 0:
        reasons.append("missing-cost")
    if category == "UNCLASSIFIED":
        reasons.append("category-review")

    if boolean(row.get("IsHazmat")) or boolean(row.get("IsChemical")) or total_stock <= 0 or cost <= 0:
        launch_status = "REJECT"
    elif boolean(row.get("IsNonReturnable")) or boolean(row.get("IsKit")) or num(row.get("CaseQty"), 1) > 1 or ship_risk == "LTL":
        launch_status = "HOLD"
    elif (
        catalogue_score >= 70
        and total_stock >= 20
        and warehouse_count >= 2
        and ship_risk in {"LOW", "MEDIUM"}
        and num(row.get("UPS_Ground_Assessorial")) == 0
        and category in {"AUTO", "MARINE", "RV"}
    ):
        launch_status = "PUBLISH_CANDIDATE"
    else:
        launch_status = "RESEARCH"

    if (
        launch_status == "PUBLISH_CANDIDATE"
        and catalogue_score >= 80
        and category in {"AUTO", "MARINE"}
        and ship_risk == "LOW"
        and 40 <= cost <= 200
        and total_stock >= 20
        and warehouse_count >= 2
    ):
        marketing_tier = "HERO_RESEARCH"
    elif launch_status == "PUBLISH_CANDIDATE" and catalogue_score >= 70:
        marketing_tier = "CORE_RESEARCH"
    elif launch_status == "RESEARCH" and catalogue_score >= 55 and category in {"AUTO", "MARINE", "RV"}:
        marketing_tier = "SEO_LONGTAIL_RESEARCH"
    else:
        marketing_tier = "NO_ADS"

    record = dict(normalized)
    record.update(
        {
            "CategoryInferred": category,
            "CategoryConfidence": category_confidence,
            "AutoKeywordScore": category_scores["AUTO"],
            "MarineKeywordScore": category_scores["MARINE"],
            "RVKeywordScore": category_scores["RV"],
            "WarehouseCount": warehouse_count,
            "NormalizedTotalQty": round(total_stock, 2),
            "ShippingRisk": ship_risk,
            "LongestDimension": longest,
            "SecondDimension": second,
            "LengthPlusGirth": girth,
            "ReturnRisk": ret_risk,
            "ReferenceSpreadOnly": round(reference_spread, 2),
            "ReferenceMarginPctOnly": round(reference_margin_pct, 2),
            "CatalogueScore": catalogue_score,
            "LaunchStatus": launch_status,
            "MarketingTier": marketing_tier,
            "BrandMAPReviewRequired": "YES",
            "ContentRightsReviewRequired": "YES",
            "LiveAPIRecheckBeforeSale": "YES",
            "MarketPriceResearchRequired": "YES" if marketing_tier != "NO_ADS" else "NO",
            "GateReasons": ";".join(reasons) if reasons else "operationally-clean",
        }
    )
    return record


def write_csv(path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()), extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input",
        default="/home/ubuntu/keystone/feed/Inventory.csv",
        help="Path to Keystone Inventory.csv",
    )
    parser.add_argument(
        "--output-dir",
        default="/home/ubuntu/keystone/feed",
        help="Directory for generated CSV files",
    )
    args = parser.parse_args()

    source = Path(args.input)
    output_dir = Path(args.output_dir)
    if not source.exists():
        raise SystemExit(f"Input not found: {source}")

    with source.open("r", encoding="utf-8-sig", errors="replace", newline="") as handle:
        reader = csv.DictReader(handle)
        rows = [build_record(row) for row in reader]

    rows.sort(
        key=lambda row: (
            {"PUBLISH_CANDIDATE": 3, "RESEARCH": 2, "HOLD": 1, "REJECT": 0}.get(row["LaunchStatus"], 0),
            num(row.get("CatalogueScore")),
            num(row.get("NormalizedTotalQty")),
        ),
        reverse=True,
    )

    marketing = [
        row
        for row in rows
        if row["MarketingTier"] in {"HERO_RESEARCH", "CORE_RESEARCH"}
    ]
    marketing.sort(
        key=lambda row: (
            {"HERO_RESEARCH": 2, "CORE_RESEARCH": 1}.get(row["MarketingTier"], 0),
            {"AUTO": 3, "MARINE": 2, "RV": 1}.get(row["CategoryInferred"], 0),
            num(row.get("CatalogueScore")),
            num(row.get("WarehouseCount")),
            num(row.get("NormalizedTotalQty")),
        ),
        reverse=True,
    )

    master_path = output_dir / "master_catalog.csv"
    marketing_path = output_dir / "marketing_candidates.csv"
    write_csv(master_path, rows)
    write_csv(marketing_path, marketing)

    print(f"INPUT ROWS = {len(rows):,}")
    print(f"MASTER = {master_path}")
    print(f"MARKETING = {marketing_path}")
    print("LAUNCH STATUS =", dict(Counter(row["LaunchStatus"] for row in rows)))
    print("CATEGORY =", dict(Counter(row["CategoryInferred"] for row in rows)))
    print("SHIPPING RISK =", dict(Counter(row["ShippingRisk"] for row in rows)))
    print("MARKETING TIER =", dict(Counter(row["MarketingTier"] for row in rows)))
    print("\nTOP MARKETING RESEARCH CANDIDATES")
    for row in marketing[:40]:
        print(
            row.get("MarketingTier"),
            "|", row.get("CategoryInferred"),
            "|", row.get("VendorName"),
            "|", row.get("VCPN"),
            "|", row.get("ManufacturerPartNo"),
            "| Cost=" + str(row.get("Cost")),
            "| Stock=" + str(row.get("NormalizedTotalQty")),
            "| WH=" + str(row.get("WarehouseCount")),
            "| Ship=" + str(row.get("ShippingRisk")),
            "| Score=" + str(row.get("CatalogueScore")),
        )


if __name__ == "__main__":
    main()
