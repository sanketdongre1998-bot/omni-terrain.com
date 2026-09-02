#!/usr/bin/env python3
"""Build the large Omni Terrain Wave-1 storefront from commerce-gated CSVs.

Safety defaults:
- writes to a staging directory, never the repository root
- staging pages are noindex,nofollow
- products outside catalogue_visible.csv never appear
- price appears only for commercially checkout-ready rows
- schema.org Offer appears only for Merchant/direct-checkout-ready rows
- direct checkout buttons require an explicit checkout base URL

This builder intentionally separates store depth from paid advertising. A 1,000-product
catalogue can be visible while only a small verified subset is purchasable/advertised.
"""
from __future__ import annotations

import argparse
import csv
import html
import json
import math
import re
import shutil
import tempfile
from collections import Counter
from pathlib import Path
from urllib.parse import quote

DEFAULT_BASE = Path("/home/ubuntu/keystone/feed")
DEFAULT_OUTPUT = Path("/home/ubuntu/keystone/staging/wave1-site")
PAGE_SIZE = 48
CATEGORY_ORDER = ("AUTO", "MARINE", "RV")
CATEGORY_LABELS = {
    "AUTO": "Automotive Parts & Towing",
    "MARINE": "Marine Parts & Equipment",
    "RV": "RV & Overlanding",
}
CATEGORY_SLUGS = {"AUTO": "automotive", "MARINE": "marine", "RV": "rv"}


def clean(value):
    return str(value or "").strip()


def money(value):
    try:
        return round(float(clean(value).replace("$", "").replace(",", "")), 2)
    except (ValueError, TypeError):
        return 0.0


def key(row):
    return clean(row.get("VCPN")) or clean(row.get("id")) or clean(row.get("ManufacturerPartNo"))


def slugify(value):
    value = re.sub(r"[^a-z0-9]+", "-", clean(value).lower()).strip("-")
    return value[:90] or "product"


def product_slug(row):
    brand = slugify(row.get("VendorName") or row.get("brand"))
    mpn = slugify(row.get("ManufacturerPartNo") or row.get("mpn") or key(row))
    return f"us-{brand}-{mpn}.html"


def read_csv(path):
    path = Path(path)
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig", errors="replace", newline="") as handle:
        return list(csv.DictReader(handle))


def esc(value):
    return html.escape(clean(value), quote=True)


def absolute(site_url, value):
    value = clean(value)
    if value.startswith("http://") or value.startswith("https://"):
        return value
    return f"{site_url.rstrip('/')}/{value.lstrip('/')}"


def title_for(row):
    return clean(row.get("ApprovedProductTitle")) or clean(row.get("ProductTitle")) or clean(row.get("LongDescription"))


def description_for(row):
    return clean(row.get("ApprovedProductDescription")) or clean(row.get("ProductDescription")) or (
        f"{clean(row.get('VendorName'))} {title_for(row)}. Manufacturer part number "
        f"{clean(row.get('ManufacturerPartNo')) or key(row)}. Review product details before ordering."
    )


def image_for(row):
    return clean(row.get("ApprovedImageURL")) or clean(row.get("ImageURL"))


def build_state(visible, checkout, merchant, paid):
    visible_keys = {key(r) for r in visible if key(r)}
    checkout_keys = {key(r) for r in checkout if key(r)}
    merchant_keys = {key(r) for r in merchant if key(r)}
    paid_keys = {key(r) for r in paid if key(r)}
    if not checkout_keys <= visible_keys:
        raise SystemExit("checkout_ready.csv contains products outside catalogue_visible.csv")
    if not merchant_keys <= checkout_keys:
        raise SystemExit("google_merchant_ready.csv contains products outside checkout_ready.csv")
    if not paid_keys <= checkout_keys:
        raise SystemExit("google_search_ads_ready.csv contains products outside checkout_ready.csv")
    return visible_keys, checkout_keys, merchant_keys, paid_keys


def prepare_rows(visible, checkout, merchant, paid):
    _, checkout_keys, merchant_keys, paid_keys = build_state(visible, checkout, merchant, paid)
    checkout_by_key = {key(r): r for r in checkout if key(r)}
    merchant_by_key = {key(r): r for r in merchant if key(r)}
    seen_slugs = set()
    prepared = []
    for source in visible:
        k = key(source)
        row = dict(source)
        if k in checkout_by_key:
            row.update(checkout_by_key[k])
        row["_key"] = k
        row["_slug"] = product_slug(row)
        if row["_slug"] in seen_slugs:
            raise SystemExit(f"Duplicate product slug: {row['_slug']}")
        seen_slugs.add(row["_slug"])
        row["_checkout"] = k in checkout_keys
        row["_merchant"] = k in merchant_keys
        row["_paid"] = k in paid_keys
        row["_merchant_row"] = merchant_by_key.get(k, {})
        prepared.append(row)
    return prepared


def css():
    return """:root{--ink:#071a30;--muted:#667382;--sand:#f3eee4;--line:#ded8cd;--gold:#b78d3e;--white:#fff;--green:#167047}*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;color:var(--ink);background:#faf9f6}a{color:inherit}.container{width:min(1180px,calc(100% - 32px));margin:auto}.topbar{background:var(--ink);color:#fff;padding:10px 0;font-size:13px}.topbar .container,.header .container,.footer .container{display:flex;align-items:center;justify-content:space-between;gap:20px}.header{background:#fff;border-bottom:1px solid var(--line);padding:18px 0;position:sticky;top:0;z-index:20}.brand{font-size:24px;font-weight:800;text-decoration:none}.brand span{font-weight:500}.nav{display:flex;gap:18px;flex-wrap:wrap}.nav a{text-decoration:none;font-weight:700;font-size:14px}.hero{padding:58px 0 36px;background:linear-gradient(135deg,#071a30,#14395d);color:#fff}.hero h1{font-size:clamp(38px,6vw,72px);line-height:.95;margin:8px 0 18px}.hero p{max-width:720px;color:#dce7f0;line-height:1.7}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:30px}.stat{border:1px solid rgba(255,255,255,.2);padding:16px;border-radius:14px}.stat b{display:block;font-size:24px}.section{padding:38px 0}.section-head{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:22px}.section-head h2{font-size:32px;margin:0}.muted{color:var(--muted)}.category-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.category-card{display:block;background:#fff;border:1px solid var(--line);border-radius:18px;padding:24px;text-decoration:none}.category-card b{font-size:27px}.category-card small{display:block;color:var(--muted);margin-top:7px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.card{background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column}.media{aspect-ratio:4/3;background:#e9eef3;display:grid;place-items:center;overflow:hidden}.media img{width:100%;height:100%;object-fit:contain;background:#fff}.placeholder{padding:20px;text-align:center;color:#506174}.placeholder strong{display:block;font-size:18px;color:var(--ink);margin-bottom:8px}.card-body{padding:17px;display:flex;flex-direction:column;gap:9px;flex:1}.kicker{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}.card h3{font-size:18px;line-height:1.25;margin:0}.mpn{font-family:monospace;font-size:12px}.price{font-size:21px;font-weight:800}.status{display:inline-flex;align-items:center;width:max-content;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:800;background:#eef2f5;color:#30465c}.status.buy{background:#e5f5ec;color:var(--green)}.status.ads{background:#fff0cb;color:#725315}.card-link{margin-top:auto;font-weight:800;text-decoration:none;padding-top:8px}.pagination{display:flex;gap:8px;flex-wrap:wrap;margin-top:25px}.pagination a,.pagination span{padding:9px 12px;border:1px solid var(--line);background:#fff;border-radius:9px;text-decoration:none}.pagination .current{background:var(--ink);color:#fff}.breadcrumb{font-size:13px;color:var(--muted);margin-bottom:20px}.product-layout{display:grid;grid-template-columns:1.05fr .95fr;gap:34px}.product-visual{background:#fff;border:1px solid var(--line);border-radius:20px;min-height:440px;display:grid;place-items:center;overflow:hidden}.product-visual img{width:100%;height:100%;max-height:560px;object-fit:contain}.product-copy h1{font-size:clamp(34px,5vw,58px);line-height:1;margin:8px 0 16px}.product-copy p{line-height:1.7}.product-price{font-size:36px;font-weight:900;margin:22px 0 8px}.button{display:inline-block;background:var(--ink);color:#fff;text-decoration:none;padding:14px 18px;border-radius:10px;font-weight:800}.button.secondary{background:#fff;color:var(--ink);border:1px solid var(--ink)}.facts{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:24px 0}.fact{background:#fff;border:1px solid var(--line);border-radius:12px;padding:13px}.fact small{display:block;color:var(--muted);margin-bottom:5px}.notice{padding:15px 16px;border:1px solid #d8c69c;background:#fff9e9;border-radius:12px;line-height:1.5}.footer{background:#071a30;color:#d9e2ea;margin-top:55px;padding:32px 0}.footer a{color:#fff}.footer .container{align-items:flex-start}.search-note{font-size:13px;color:var(--muted)}@media(max-width:980px){.grid{grid-template-columns:repeat(3,1fr)}.stats{grid-template-columns:repeat(2,1fr)}.product-layout{grid-template-columns:1fr}}@media(max-width:720px){.header .container{align-items:flex-start;flex-direction:column}.nav{gap:12px}.grid{grid-template-columns:repeat(2,1fr)}.category-grid{grid-template-columns:1fr}.hero{padding-top:38px}.product-visual{min-height:320px}.footer .container{flex-direction:column}}@media(max-width:480px){.grid{grid-template-columns:1fr}.stats{grid-template-columns:1fr}.facts{grid-template-columns:1fr}.container{width:min(100% - 22px,1180px)}}"""


def head(title, description, canonical, robots, site_url, schema=None):
    schema_html = ""
    if schema:
        schema_html = f'<script type="application/ld+json">{html.escape(json.dumps(schema), quote=False)}</script>'
    return f"""<!doctype html><html lang="en-US"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="{esc(robots)}"><meta name="description" content="{esc(description)}"><title>{esc(title)}</title><link rel="canonical" href="{esc(canonical)}"><link rel="stylesheet" href="assets/wave1-storefront.css">{schema_html}</head>"""


def header():
    return """<div class="topbar"><div class="container"><strong>Omni Terrain US Store</strong><span>Auto parts first · Marine · RV & overlanding</span></div></div><header class="header"><div class="container"><a class="brand" href="us-catalogue.html">Omni <span>Terrain</span></a><nav class="nav" aria-label="Store navigation"><a href="us-catalogue.html">Shop All</a><a href="automotive.html">Auto Parts</a><a href="marine.html">Marine</a><a href="rv.html">RV</a><a href="contact-and-order-help.html">Help</a></nav></div></header>"""


def footer():
    return """<footer class="footer"><div class="container"><div><strong>Omni Terrain</strong><p>Specialist parts and equipment for road, water and travel.</p></div><div><a href="shipping-delivery-policy.html">Shipping</a> · <a href="returns-refunds-policy.html">Returns</a> · <a href="contact-and-order-help.html">Contact</a></div></div></footer>"""


def media(row):
    image = image_for(row)
    if image:
        return f'<div class="media"><img src="{esc(image)}" alt="{esc(title_for(row))}" loading="lazy" decoding="async"></div>'
    return f'<div class="media"><div class="placeholder"><strong>{esc(row.get("VendorName"))}</strong><span>MPN {esc(row.get("ManufacturerPartNo") or key(row))}</span></div></div>'


def card(row):
    price = money(row.get("SellPriceUSD"))
    if row["_merchant"]:
        badge = '<span class="status buy">Online purchase ready</span>'
    elif row["_checkout"]:
        badge = '<span class="status buy">Commercially approved</span>'
    else:
        badge = '<span class="status">Product reference</span>'
    if row["_paid"]:
        badge += ' <span class="status ads">Paid test candidate</span>'
    price_html = f'<div class="price">${price:,.2f}</div>' if row["_checkout"] and price > 0 else '<div class="search-note">Contact for current commercial availability</div>'
    return f"""<article class="card">{media(row)}<div class="card-body"><div class="kicker">{esc(row.get('VendorName'))} · {esc(CATEGORY_LABELS.get(clean(row.get('CategoryInferred')), clean(row.get('CategoryInferred'))))}</div><h3>{esc(title_for(row))}</h3><div class="mpn">MPN {esc(row.get('ManufacturerPartNo') or key(row))}</div>{badge}{price_html}<a class="card-link" href="{esc(row['_slug'])}">View product →</a></div></article>"""


def pagination(category, page, page_count):
    if page_count <= 1:
        return ""
    slug = CATEGORY_SLUGS[category]
    links = []
    for number in range(1, page_count + 1):
        filename = f"{slug}.html" if number == 1 else f"{slug}-{number}.html"
        if number == page:
            links.append(f'<span class="current">{number}</span>')
        else:
            links.append(f'<a href="{filename}">{number}</a>')
    return '<nav class="pagination" aria-label="Pagination">' + "".join(links) + "</nav>"


def catalogue_page(rows, robots, site_url):
    counts = Counter(clean(r.get("CategoryInferred")) for r in rows)
    cards = []
    for cat in CATEGORY_ORDER:
        cards.append(f'<a class="category-card" href="{CATEGORY_SLUGS[cat]}.html"><b>{esc(CATEGORY_LABELS[cat])}</b><small>{counts[cat]} curated product records</small></a>')
    featured = sorted(rows, key=lambda r: (bool(r["_merchant"]), bool(r["_checkout"]), money(r.get("StorefrontScore"))), reverse=True)[:12]
    schema = {
        "@context": "https://schema.org", "@type": "CollectionPage",
        "name": "Omni Terrain US Catalogue", "url": f"{site_url}/us-catalogue.html",
        "numberOfItems": len(rows),
    }
    body = f"""{head('US Auto Parts, Marine & RV Catalogue | Omni Terrain','Browse the Omni Terrain US catalogue of curated automotive, marine and RV products.',f'{site_url}/us-catalogue.html',robots,site_url,schema)}<body>{header()}<main><section class="hero"><div class="container"><div class="kicker">US specialist catalogue</div><h1>Parts for road,<br>water & travel.</h1><p>A broad, curated catalogue with Auto Parts first, followed by Marine and RV. Commercial availability and online purchase are enabled only on products that pass supplier, pricing, stock and fulfilment gates.</p><div class="stats"><div class="stat"><b>{len(rows)}</b><span>visible products</span></div><div class="stat"><b>{counts['AUTO']}</b><span>Auto Parts</span></div><div class="stat"><b>{counts['MARINE']}</b><span>Marine</span></div><div class="stat"><b>{counts['RV']}</b><span>RV</span></div></div></div></section><section class="section"><div class="container"><div class="section-head"><div><div class="kicker">Departments</div><h2>Shop by category</h2></div></div><div class="category-grid">{''.join(cards)}</div></div></section><section class="section"><div class="container"><div class="section-head"><div><div class="kicker">Selected catalogue</div><h2>Featured products</h2></div><a href="automotive.html">Browse Auto Parts →</a></div><div class="grid">{''.join(card(r) for r in featured)}</div></div></section></main>{footer()}</body></html>"""
    return body


def category_page(category, rows, page, robots, site_url):
    label = CATEGORY_LABELS[category]
    slug = CATEGORY_SLUGS[category]
    page_count = max(1, math.ceil(len(rows) / PAGE_SIZE))
    start = (page - 1) * PAGE_SIZE
    subset = rows[start:start + PAGE_SIZE]
    filename = f"{slug}.html" if page == 1 else f"{slug}-{page}.html"
    schema = {"@context":"https://schema.org","@type":"CollectionPage","name":label,"url":f"{site_url}/{filename}","numberOfItems":len(rows)}
    seo_title = f'{label} | Omni Terrain' if page == 1 else f'{label} — Page {page} | Omni Terrain'
    body = f"""{head(seo_title,f'Browse {len(rows)} curated {label.lower()} product records at Omni Terrain. Page {page} of {page_count}.',f'{site_url}/{filename}',robots,site_url,schema)}<body>{header()}<main><section class="hero"><div class="container"><div class="breadcrumb"><a href="us-catalogue.html" style="color:#fff">US Catalogue</a> / {esc(label)}</div><h1>{esc(label)}</h1><p>{len(rows)} curated product records. Page {page} of {page_count}.</p></div></section><section class="section"><div class="container"><div class="section-head"><div><h2>{esc(label)}</h2><div class="muted">Products {start + 1}–{min(start + PAGE_SIZE, len(rows))} of {len(rows)}</div></div></div><div class="grid">{''.join(card(r) for r in subset)}</div>{pagination(category,page,page_count)}</div></section></main>{footer()}</body></html>"""
    return body


def product_page(row, robots, site_url, checkout_base_url):
    category = clean(row.get("CategoryInferred"))
    label = CATEGORY_LABELS.get(category, category)
    title = title_for(row)
    desc = description_for(row)
    image = image_for(row)
    price = money(row.get("SellPriceUSD"))
    mpn = clean(row.get("ManufacturerPartNo")) or key(row)
    product_schema = {
        "@context": "https://schema.org", "@type": "Product", "name": title,
        "description": desc, "brand": {"@type": "Brand", "name": clean(row.get("VendorName"))},
        "mpn": mpn, "sku": key(row), "url": f"{site_url}/{row['_slug']}",
        "itemCondition": "https://schema.org/NewCondition",
    }
    if image:
        product_schema["image"] = image
    if row["_merchant"]:
        if not checkout_base_url:
            raise SystemExit(f"{key(row)} is Merchant/direct-checkout-ready but --checkout-base-url is missing")
        product_schema["offers"] = {
            "@type": "Offer", "priceCurrency": "USD", "price": f"{price:.2f}",
            "availability": "https://schema.org/InStock",
            "url": f"{site_url}/{row['_slug']}",
        }
    visual = f'<div class="product-visual"><img src="{esc(image)}" alt="{esc(title)}"></div>' if image else f'<div class="product-visual"><div class="placeholder"><strong>{esc(row.get("VendorName"))}</strong><span>MPN {esc(mpn)}</span></div></div>'
    if row["_merchant"]:
        checkout_url = checkout_base_url.rstrip("/") + "?sku=" + quote(key(row))
        action = f'<div class="product-price">${price:,.2f}</div><p class="muted">Online checkout enabled for this verified product.</p><a class="button" href="{esc(checkout_url)}">Buy online →</a>'
    elif row["_checkout"]:
        action = f'<div class="product-price">${price:,.2f}</div><div class="notice">This SKU passed commercial product gates, but direct online payment is not enabled yet. Use product support for the current ordering route.</div><p><a class="button secondary" href="contact-and-order-help.html">Request purchase help →</a></p>'
    else:
        action = '<div class="notice">Catalogue reference only. Checkout is disabled until brand/channel authorization, stock, shipping, returns and market-value gates are explicitly cleared.</div><p><a class="button secondary" href="contact-and-order-help.html">Ask product support →</a></p>'
    facts = [
        ("Brand", row.get("VendorName")), ("MPN", mpn), ("Category", label),
        ("Fitment risk", row.get("FitmentRisk") or "Review required"),
        ("Shipping profile", row.get("ShippingRisk") or "Review required"),
        ("Stock status", "Live recheck before sale" if row["_checkout"] else "Not sale-enabled"),
    ]
    facts_html = "".join(f'<div class="fact"><small>{esc(k)}</small><strong>{esc(v)}</strong></div>' for k,v in facts)
    return f"""{head(f'{title} | Omni Terrain',desc[:155],f'{site_url}/{row['_slug']}',robots,site_url,product_schema)}<body>{header()}<main><section class="section"><div class="container"><div class="breadcrumb"><a href="us-catalogue.html">US Catalogue</a> / <a href="{CATEGORY_SLUGS.get(category,'us-catalogue')}.html">{esc(label)}</a> / {esc(mpn)}</div><div class="product-layout">{visual}<div class="product-copy"><div class="kicker">{esc(row.get('VendorName'))}</div><h1>{esc(title)}</h1><p>{esc(desc)}</p>{action}<div class="facts">{facts_html}</div></div></div></div></section></main>{footer()}</body></html>"""


def build(args):
    visible = read_csv(args.visible)
    checkout = read_csv(args.checkout)
    merchant = read_csv(args.merchant)
    paid = read_csv(args.paid)
    if not visible:
        raise SystemExit(f"No visible catalogue rows found: {args.visible}")
    rows = prepare_rows(visible, checkout, merchant, paid)
    if args.mode == "live" and len(rows) < args.minimum_live_products:
        raise SystemExit(f"Live build requires at least {args.minimum_live_products} visible products; found {len(rows)}")
    robots = "index,follow" if args.mode == "live" else "noindex,nofollow"
    site_url = args.site_url.rstrip("/")
    out = Path(args.output_dir)
    if out.exists():
        shutil.rmtree(out)
    (out / "assets").mkdir(parents=True, exist_ok=True)
    (out / "assets" / "wave1-storefront.css").write_text(css(), encoding="utf-8")
    (out / "us-catalogue.html").write_text(catalogue_page(rows, robots, site_url), encoding="utf-8")

    by_category = {category: [] for category in CATEGORY_ORDER}
    for row in rows:
        category = clean(row.get("CategoryInferred"))
        if category not in by_category:
            raise SystemExit(f"Unexpected visible category {category!r} for {key(row)}")
        by_category[category].append(row)
    for category in CATEGORY_ORDER:
        by_category[category].sort(key=lambda r: (bool(r["_merchant"]), bool(r["_checkout"]), money(r.get("StorefrontScore")), money(r.get("NormalizedTotalQty"))), reverse=True)
        pages = max(1, math.ceil(len(by_category[category]) / PAGE_SIZE))
        for page in range(1, pages + 1):
            slug = CATEGORY_SLUGS[category]
            filename = f"{slug}.html" if page == 1 else f"{slug}-{page}.html"
            (out / filename).write_text(category_page(category, by_category[category], page, robots, site_url), encoding="utf-8")

    for row in rows:
        (out / row["_slug"]).write_text(product_page(row, robots, site_url, args.checkout_base_url), encoding="utf-8")

    manifest = {
        "mode": args.mode,
        "site_url": site_url,
        "counts": {
            "visible": len(rows), "checkout_ready": sum(r["_checkout"] for r in rows),
            "merchant_ready": sum(r["_merchant"] for r in rows), "paid_search": sum(r["_paid"] for r in rows),
        },
        "categories": {cat: len(by_category[cat]) for cat in CATEGORY_ORDER},
        "products": [
            {"id": r["_key"], "slug": r["_slug"], "category": clean(r.get("CategoryInferred")),
             "checkout_ready": r["_checkout"], "merchant_ready": r["_merchant"], "paid_search": r["_paid"]}
            for r in rows
        ],
    }
    (out / "storefront-manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    urls = ["us-catalogue.html"]
    for category in CATEGORY_ORDER:
        pages = max(1, math.ceil(len(by_category[category]) / PAGE_SIZE))
        slug = CATEGORY_SLUGS[category]
        urls.extend(slug + (".html" if page == 1 else f"-{page}.html") for page in range(1, pages + 1))
    urls.extend(r["_slug"] for r in rows)
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(
        f"  <url><loc>{esc(absolute(site_url, url))}</loc></url>" for url in urls
    ) + "\n</urlset>\n"
    (out / "sitemap-wave1.xml").write_text(sitemap, encoding="utf-8")
    if args.mode != "live":
        (out / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")
    print("=== OMNI TERRAIN WAVE-1 STOREFRONT BUILD ===")
    print("MODE =", args.mode)
    print("VISIBLE =", len(rows))
    print("CATEGORY =", {cat: len(by_category[cat]) for cat in CATEGORY_ORDER})
    print("CHECKOUT READY =", manifest["counts"]["checkout_ready"])
    print("MERCHANT READY =", manifest["counts"]["merchant_ready"])
    print("PAID SEARCH =", manifest["counts"]["paid_search"])
    print("OUTPUT =", out)
    return manifest


def write_test_csv(path, rows):
    fields = sorted({field for row in rows for field in row})
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader(); writer.writerows(rows)


def self_test():
    with tempfile.TemporaryDirectory() as temp:
        base = Path(temp)
        visible = []
        counts = {"AUTO":650,"MARINE":250,"RV":100}
        serial = 0
        for category, count in counts.items():
            for i in range(count):
                serial += 1
                visible.append({
                    "VCPN":f"SKU{serial}","VendorName":f"Brand {category}","ManufacturerPartNo":f"MPN{serial}",
                    "ApprovedProductTitle":f"Sample {category} Product {serial}","ApprovedProductDescription":"Sample factual product description.",
                    "CategoryInferred":category,"FitmentRisk":"LOW","ShippingRisk":"LOW","StorefrontScore":"120","NormalizedTotalQty":"100",
                })
        checkout = []
        for row in visible[:20]:
            checkout.append(dict(row, SellPriceUSD="129.99", DirectCheckoutEnabled="NO"))
        merchant = []
        for row in checkout[:10]:
            merchant.append({"id":row["VCPN"],"title":row["ApprovedProductTitle"],"description":"Description","link":"https://example.com/product","image_link":"https://example.com/image.jpg","availability":"in_stock","price":"129.99 USD","brand":row["VendorName"],"gtin":"","mpn":row["ManufacturerPartNo"],"condition":"new"})
        paid = checkout[:5]
        write_test_csv(base/"visible.csv",visible); write_test_csv(base/"checkout.csv",checkout)
        write_test_csv(base/"merchant.csv",merchant); write_test_csv(base/"paid.csv",paid)
        class Args: pass
        args=Args(); args.visible=str(base/"visible.csv"); args.checkout=str(base/"checkout.csv"); args.merchant=str(base/"merchant.csv"); args.paid=str(base/"paid.csv")
        args.output_dir=str(base/"site"); args.mode="staging"; args.site_url="https://omni-terrain.com"; args.checkout_base_url="https://checkout.example.com"
        args.minimum_live_products=900
        manifest=build(args)
        assert manifest["counts"]=={"visible":1000,"checkout_ready":20,"merchant_ready":10,"paid_search":5}
        assert manifest["categories"]==counts
        product_pages=list((base/"site").glob("us-*.html"))
        # us-catalogue.html also matches; 1,000 products + catalogue = 1,001.
        assert len(product_pages)==1001, len(product_pages)
        assert (base/"site"/"automotive-14.html").exists()
        assert (base/"site"/"marine-6.html").exists()
        assert (base/"site"/"rv-3.html").exists()
        assert "noindex,nofollow" in (base/"site"/"us-catalogue.html").read_text(encoding="utf-8")
        print("SELF TEST PASSED = 1")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--visible", default=str(DEFAULT_BASE/"catalogue_visible.csv"))
    parser.add_argument("--checkout", default=str(DEFAULT_BASE/"checkout_ready.csv"))
    parser.add_argument("--merchant", default=str(DEFAULT_BASE/"google_merchant_ready.csv"))
    parser.add_argument("--paid", default=str(DEFAULT_BASE/"google_search_ads_ready.csv"))
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT))
    parser.add_argument("--mode", choices=["staging","live"], default="staging")
    parser.add_argument("--site-url", default="https://omni-terrain.com")
    parser.add_argument("--checkout-base-url", default="")
    parser.add_argument("--minimum-live-products", type=int, default=900)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test(); return
    build(args)

if __name__ == "__main__":
    main()
