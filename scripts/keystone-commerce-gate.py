#!/usr/bin/env python3
"""Commercial approval gate for the Omni Terrain Keystone launch catalogue.

The large storefront and paid-ad programme are intentionally separated:

1. catalogue_visible.csv
   Products that may be displayed on the website. Third-party content is only allowed
   when ContentRights=YES. FACTS_ONLY permits a factual, no-third-party-media page.
2. checkout_ready.csv
   Products that passed all hard pre-sale gates and may accept an order.
3. google_search_ads_ready.csv
   Checkout-ready products explicitly enabled for paid Search campaigns.
4. google_merchant_ready.csv / google_merchant_feed.tsv
   The stricter subset with the data required for Shopping/free product listings.

The script never infers brand/channel permission from the Keystone feed. A SKU in the
feed is not proof that Omni Terrain is authorised to sell or advertise it.
"""

from __future__ import annotations

import argparse
import csv
import re
from collections import Counter
from pathlib import Path
from urllib.parse import quote

DEFAULT_LAUNCH = Path("/home/ubuntu/keystone/feed/launch_wave1.csv")
DEFAULT_APPROVALS = Path("/home/ubuntu/keystone/feed/commerce_approvals.csv")
DEFAULT_OUTPUT = Path("/home/ubuntu/keystone/feed")
SITE = "https://omni-terrain.com"

APPROVAL_FIELDS = [
    "VCPN",
    "BrandAuthorized",
    "ChannelAuthorized",
    "MAPVerified",
    "ContentRights",
    "LiveStockVerified",
    "ShippingVerified",
    "ReturnsVerified",
    "MarketPriceVerified",
    "AdEnabled",
    "SellPrice",
    "ShippingCharge",
    "ProductTitle",
    "ProductDescription",
    "ImageURL",
    "ProductURL",
    "GTIN",
    "Notes",
]

REPORT_FIELDS = [
    "VCPN",
    "VendorName",
    "ManufacturerPartNo",
    "CategoryInferred",
    "CatalogVisible",
    "CheckoutReady",
    "SearchAdsReady",
    "MerchantReady",
    "GateReasons",
]

TRUTHY = {"YES", "Y", "TRUE", "1", "APPROVED", "PASS"}
MAP_OK = TRUTHY | {"NA", "N/A", "NOT_APPLICABLE", "NOT APPLICABLE"}
CONTENT_VISIBLE = TRUTHY | {"FACTS_ONLY", "FACTS ONLY"}


def clean(value):
    return str(value or "").strip()


def upper(value):
    return clean(value).upper()


def yes(value):
    return upper(value) in TRUTHY


def map_ok(value):
    return upper(value) in MAP_OK


def content_visible(value):
    return upper(value) in CONTENT_VISIBLE


def content_media_ok(value):
    return yes(value)


def money(value):
    text = clean(value).replace("$", "").replace(",", "")
    try:
        return round(float(text), 2) if text else 0.0
    except ValueError:
        return 0.0


def slugify(value):
    value = clean(value).lower()
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value[:100] or "product"


def primary_key(row):
    return clean(row.get("VCPN")) or clean(row.get("PartNumber")) or clean(row.get("ManufacturerPartNo"))


def default_product_url(feed_row, approval):
    explicit = clean(approval.get("ProductURL"))
    if explicit:
        return explicit
    brand = clean(feed_row.get("VendorName"))
    mpn = clean(feed_row.get("ManufacturerPartNo")) or primary_key(feed_row)
    return f"{SITE}/us-{slugify(brand)}-{slugify(mpn)}.html"


def load_csv(path):
    if not path.exists():
        return [], []
    with path.open("r", encoding="utf-8-sig", errors="replace", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader), list(reader.fieldnames or [])


def load_approvals(path):
    rows, _ = load_csv(path)
    result = {}
    duplicates = Counter()
    for row in rows:
        key = clean(row.get("VCPN"))
        if not key:
            continue
        duplicates[key] += 1
        result[key] = row
    duplicate_keys = [key for key, count in duplicates.items() if count > 1]
    if duplicate_keys:
        raise SystemExit("Duplicate VCPN values in approvals: " + ", ".join(duplicate_keys[:20]))
    return result


def write_csv(path, fieldnames, rows):
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def init_or_merge_approvals(launch_rows, path):
    existing_rows, existing_fields = load_csv(path)
    existing = {clean(row.get("VCPN")): row for row in existing_rows if clean(row.get("VCPN"))}
    output = []

    for feed_row in launch_rows:
        key = primary_key(feed_row)
        if not key:
            continue
        row = {field: "" for field in APPROVAL_FIELDS}
        if key in existing:
            row.update({field: existing[key].get(field, "") for field in APPROVAL_FIELDS})
        row["VCPN"] = key
        for field in (
            "BrandAuthorized", "ChannelAuthorized", "MAPVerified", "ContentRights",
            "LiveStockVerified", "ShippingVerified", "ReturnsVerified",
            "MarketPriceVerified", "AdEnabled",
        ):
            if not clean(row.get(field)):
                row[field] = "PENDING" if field != "AdEnabled" else "NO"
        if not clean(row.get("GTIN")):
            row["GTIN"] = clean(feed_row.get("UPCCode"))
        output.append(row)

    # Preserve approval rows whose SKU is temporarily absent from this launch wave.
    launch_keys = {primary_key(row) for row in launch_rows}
    for key, row in existing.items():
        if key not in launch_keys:
            output.append({field: row.get(field, "") for field in APPROVAL_FIELDS})

    write_csv(path, APPROVAL_FIELDS, output)
    print(f"APPROVAL TEMPLATE ROWS = {len(output):,}")
    print(f"APPROVAL FILE = {path}")
    if existing_fields and set(existing_fields) != set(APPROVAL_FIELDS):
        print("NOTE = approval columns normalized to the current schema")


def evaluate(feed_row, approval):
    reasons = []
    key = primary_key(feed_row)
    category = clean(feed_row.get("CategoryInferred"))
    mpn = clean(feed_row.get("ManufacturerPartNo"))
    gtin = clean(approval.get("GTIN")) or clean(feed_row.get("UPCCode"))
    title = clean(approval.get("ProductTitle"))
    description = clean(approval.get("ProductDescription"))
    image = clean(approval.get("ImageURL"))
    price = money(approval.get("SellPrice"))
    shipping_charge = money(approval.get("ShippingCharge"))
    product_url = default_product_url(feed_row, approval)

    catalog_visible = True
    if category not in {"AUTO", "MARINE", "RV"}:
        catalog_visible = False
        reasons.append("catalog:category-not-approved")
    if not content_visible(approval.get("ContentRights")):
        catalog_visible = False
        reasons.append("catalog:content-rights-not-cleared")
    if not title:
        catalog_visible = False
        reasons.append("catalog:approved-title-missing")
    if not mpn and not gtin:
        catalog_visible = False
        reasons.append("catalog:identifier-missing")

    hard_checks = [
        (yes(approval.get("BrandAuthorized")), "sale:brand-authorization"),
        (yes(approval.get("ChannelAuthorized")), "sale:channel-authorization"),
        (map_ok(approval.get("MAPVerified")), "sale:map-review"),
        (yes(approval.get("LiveStockVerified")), "sale:live-stock"),
        (yes(approval.get("ShippingVerified")), "sale:shipping"),
        (yes(approval.get("ReturnsVerified")), "sale:returns"),
        (yes(approval.get("MarketPriceVerified")), "sale:market-price"),
        (price > 0, "sale:sell-price"),
        (bool(product_url), "sale:product-url"),
    ]
    checkout_ready = catalog_visible
    for passed, reason in hard_checks:
        if not passed:
            checkout_ready = False
            reasons.append(reason)

    search_ads_ready = checkout_ready and yes(approval.get("AdEnabled"))
    if checkout_ready and not yes(approval.get("AdEnabled")):
        reasons.append("ads:not-enabled")

    merchant_checks = [
        (content_media_ok(approval.get("ContentRights")), "merchant:approved-media-rights"),
        (bool(description), "merchant:description-missing"),
        (bool(image), "merchant:image-missing"),
        (bool(mpn or gtin), "merchant:identifier-missing"),
    ]
    merchant_ready = search_ads_ready
    for passed, reason in merchant_checks:
        if not passed:
            merchant_ready = False
            reasons.append(reason)

    merged = dict(feed_row)
    merged.update({
        "ApprovedProductTitle": title,
        "ApprovedProductDescription": description,
        "ApprovedImageURL": image,
        "ApprovedProductURL": product_url,
        "ApprovedGTIN": gtin,
        "SellPriceUSD": f"{price:.2f}" if price > 0 else "",
        "ShippingChargeUSD": f"{shipping_charge:.2f}",
    })

    report = {
        "VCPN": key,
        "VendorName": clean(feed_row.get("VendorName")),
        "ManufacturerPartNo": mpn,
        "CategoryInferred": category,
        "CatalogVisible": "YES" if catalog_visible else "NO",
        "CheckoutReady": "YES" if checkout_ready else "NO",
        "SearchAdsReady": "YES" if search_ads_ready else "NO",
        "MerchantReady": "YES" if merchant_ready else "NO",
        "GateReasons": ";".join(dict.fromkeys(reasons)) if reasons else "PASS",
    }

    merchant = {
        "id": key,
        "title": title,
        "description": description,
        "link": product_url,
        "image_link": image,
        "availability": "in_stock",
        "price": f"{price:.2f} USD",
        "brand": clean(feed_row.get("VendorName")),
        "gtin": gtin,
        "mpn": mpn,
        "condition": "new",
    }
    return merged, report, catalog_visible, checkout_ready, search_ads_ready, merchant_ready, merchant


def write_merchant_tsv(path, rows):
    fields = ["id", "title", "description", "link", "image_link", "availability", "price", "brand", "gtin", "mpn", "condition"]
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, delimiter="\t", extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def run_self_test(tmp_dir):
    feed = {
        "VCPN": "TEST-1", "VendorName": "Test Brand", "ManufacturerPartNo": "MPN-1",
        "UPCCode": "012345678901", "CategoryInferred": "AUTO",
    }
    approval = {
        "VCPN": "TEST-1", "BrandAuthorized": "YES", "ChannelAuthorized": "YES",
        "MAPVerified": "N/A", "ContentRights": "YES", "LiveStockVerified": "YES",
        "ShippingVerified": "YES", "ReturnsVerified": "YES", "MarketPriceVerified": "YES",
        "AdEnabled": "YES", "SellPrice": "129.99", "ShippingCharge": "0",
        "ProductTitle": "Test Product", "ProductDescription": "Test product description",
        "ImageURL": "https://example.com/product.jpg", "ProductURL": "https://omni-terrain.com/us-test-product.html",
        "GTIN": "012345678901",
    }
    _, report, visible, checkout, search, merchant, _ = evaluate(feed, approval)
    assert visible and checkout and search and merchant, report

    approval["BrandAuthorized"] = "PENDING"
    _, report, _, checkout, search, merchant, _ = evaluate(feed, approval)
    assert not checkout and not search and not merchant and "sale:brand-authorization" in report["GateReasons"]

    approval["BrandAuthorized"] = "YES"
    approval["ContentRights"] = "FACTS_ONLY"
    _, report, visible, checkout, search, merchant, _ = evaluate(feed, approval)
    assert visible and checkout and search and not merchant and "merchant:approved-media-rights" in report["GateReasons"]
    print("SELF TEST PASSED = 3")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--launch", default=str(DEFAULT_LAUNCH))
    parser.add_argument("--approvals", default=str(DEFAULT_APPROVALS))
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT))
    parser.add_argument("--init-approvals", action="store_true", help="create/merge the approval ledger and exit")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    if args.self_test:
        run_self_test(out_dir)
        return

    launch_path = Path(args.launch)
    approval_path = Path(args.approvals)
    launch_rows, launch_fields = load_csv(launch_path)
    if not launch_rows:
        raise SystemExit(f"No launch rows found: {launch_path}")

    if args.init_approvals:
        init_or_merge_approvals(launch_rows, approval_path)
        return

    if not approval_path.exists():
        raise SystemExit(
            f"Approval ledger missing: {approval_path}\n"
            "Run with --init-approvals first. Nothing is sellable until explicit approvals are recorded."
        )

    approvals = load_approvals(approval_path)
    catalogue_rows = []
    checkout_rows = []
    search_rows = []
    merchant_rows = []
    reports = []
    missing_approval = 0
    extra_fields = [
        "ApprovedProductTitle", "ApprovedProductDescription", "ApprovedImageURL",
        "ApprovedProductURL", "ApprovedGTIN", "SellPriceUSD", "ShippingChargeUSD",
    ]
    output_fields = list(launch_fields) + [field for field in extra_fields if field not in launch_fields]

    for feed_row in launch_rows:
        key = primary_key(feed_row)
        approval = approvals.get(key)
        if approval is None:
            missing_approval += 1
            approval = {field: "" for field in APPROVAL_FIELDS}
            approval["VCPN"] = key
        merged, report, visible, checkout, search, merchant, merchant_row = evaluate(feed_row, approval)
        reports.append(report)
        if visible:
            catalogue_rows.append(merged)
        if checkout:
            checkout_rows.append(merged)
        if search:
            search_rows.append(merged)
        if merchant:
            merchant_rows.append(merchant_row)

    write_csv(out_dir / "catalogue_visible.csv", output_fields, catalogue_rows)
    write_csv(out_dir / "checkout_ready.csv", output_fields, checkout_rows)
    write_csv(out_dir / "google_search_ads_ready.csv", output_fields, search_rows)
    write_csv(out_dir / "google_merchant_ready.csv", list(merchant_rows[0].keys()) if merchant_rows else ["id", "title", "description", "link", "image_link", "availability", "price", "brand", "gtin", "mpn", "condition"], merchant_rows)
    write_merchant_tsv(out_dir / "google_merchant_feed.tsv", merchant_rows)
    write_csv(out_dir / "commerce_gate_report.csv", REPORT_FIELDS, reports)

    print(f"LAUNCH ROWS = {len(launch_rows):,}")
    print(f"MISSING APPROVAL ROWS = {missing_approval:,}")
    print(f"CATALOGUE VISIBLE = {len(catalogue_rows):,}")
    print(f"CHECKOUT READY = {len(checkout_rows):,}")
    print(f"GOOGLE SEARCH ADS READY = {len(search_rows):,}")
    print(f"GOOGLE MERCHANT READY = {len(merchant_rows):,}")
    print(f"REPORT = {out_dir / 'commerce_gate_report.csv'}")


if __name__ == "__main__":
    main()
