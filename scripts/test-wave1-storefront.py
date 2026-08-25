
#!/usr/bin/env python3



from pathlib import Path

from collections import Counter

import json, re, sys



ROOT = Path(".")

MANIFEST = ROOT / "storefront-manifest.json"

PRODUCT_JS = ROOT / "assets/us-products.js"



errors = []



def check(cond, msg):

    if not cond:

        errors.append(msg)



manifest = json.loads(MANIFEST.read_text())

products = manifest.get("products", [])



check(len(products) == 1000, f"manifest products expected 1000, got {len(products)}")



counts = Counter(p.get("category") for p in products)

check(counts == Counter({"AUTO":650, "MARINE":250, "RV":100}),

      f"category counts wrong: {dict(counts)}")



ids = [p["id"] for p in products]

slugs = [p["slug"] for p in products]



check(len(set(ids)) == 1000, "manifest IDs are not unique")

check(len(set(slugs)) == 1000, "manifest slugs are not unique")



check(sum(bool(p.get("checkout_ready")) for p in products) == 0,

      "checkout_ready must remain 0")

check(sum(bool(p.get("merchant_ready")) for p in products) == 0,

      "merchant_ready must remain 0")

check(sum(bool(p.get("paid_search")) for p in products) == 0,

      "paid_search must remain 0")



# Validate 1,000-product client data layer

js = PRODUCT_JS.read_text(errors="ignore")

m = re.search(r'const OMNI_US_PRODUCTS = (.*?);\s*if \(typeof window', js, re.S)



check(bool(m), "cannot parse assets/us-products.js")



client = []



if m:

    try:

        client = json.loads(m.group(1))

    except Exception as e:

        errors.append(f"invalid us-products.js JSON payload: {e}")



if client:

    check(len(client) == 1000, f"client products expected 1000, got {len(client)}")

    check(len({p["id"] for p in client}) == 1000, "client IDs are not unique")

    check(len({p["slug"] for p in client}) == 1000, "client slugs are not unique")

    check({p["id"] for p in client} == set(ids), "client IDs do not match manifest")

    check({p["slug"] for p in client} == set(slugs), "client slugs do not match manifest")



    seg = Counter(p.get("segment") for p in client)

    check(

        seg == Counter({"automotive":650, "marine":250, "rv":100}),

        f"client segments wrong: {dict(seg)}"

    )



# Validate all 1,000 product pages

manifest_page_names = set(slugs)

actual_pages = {p.name for p in ROOT.glob("us-*.html") if p.name in manifest_page_names}



check(actual_pages == set(slugs),

      f"product page mismatch: actual={len(actual_pages)}, expected={len(slugs)}")



broken = set()

wrong_brand = []

old_50 = []

product_noindex = []

missing_title = []

missing_desc = []

missing_canonical = []



for p in ROOT.glob("*.html"):

    text = p.read_text(errors="ignore")



    if re.search(r'\bOMNI\s+TERRAIN\b|\bOMNI\s+Terrain\b', text):

        wrong_brand.append(p.name)



    if re.search(r'\b50\s+(?:focused\s+)?(?:US\s+)?product', text, re.I):

        old_50.append(p.name)



    if p.name in actual_pages:

        if re.search(r'noindex|nofollow', text, re.I):

            product_noindex.append(p.name)



        if not re.search(r'<title>.+?</title>', text, re.I | re.S):

            missing_title.append(p.name)



        if not re.search(r'<meta\s+name=["\']description["\']', text, re.I):

            missing_desc.append(p.name)



        if not re.search(r'<link\s+rel=["\']canonical["\']', text, re.I):

            missing_canonical.append(p.name)



    for href in re.findall(r'href=["\']([^"\']+)', text, re.I):

        href = href.split("#",1)[0].split("?",1)[0].strip()



        if not href or href.startswith(

            ("http://","https://","mailto:","tel:","javascript:","data:")

        ):

            continue



        if href.endswith(".html") and not (ROOT / href).exists():

            broken.add((p.name, href))



check(not wrong_brand, f"wrong Omni Terrain casing: {wrong_brand[:10]}")

check(not old_50, f"old 50-product wording: {old_50[:10]}")

check(not product_noindex, f"Wave1 product pages noindex: {product_noindex[:10]}")

check(not missing_title, f"missing titles: {missing_title[:10]}")

check(not missing_desc, f"missing descriptions: {missing_desc[:10]}")

check(not missing_canonical, f"missing canonicals: {missing_canonical[:10]}")

check(not broken, f"broken links: {sorted(broken)[:10]}")



# Image host safety

html_blob = "\n".join(p.read_text(errors="ignore") for p in ROOT.glob("*.html"))

check("sdk.vehiclepartimages.com" not in html_blob,

      "blocked sdk.vehiclepartimages.com host still referenced")



# Sitemap / robots

sitemap = ROOT / "sitemap.xml"

robots = ROOT / "robots.txt"



check(sitemap.exists(), "sitemap.xml missing")

check(robots.exists(), "robots.txt missing")



if sitemap.exists():

    sitemap_text = sitemap.read_text(errors="ignore")

    url_count = sitemap_text.count("<url>")

    check(url_count >= 1024, f"sitemap URLs too low: {url_count}")



if robots.exists():

    check(

        "https://omni-terrain.com/sitemap.xml" in robots.read_text(errors="ignore"),

        "robots.txt missing sitemap reference"

    )



print("=== Omni Terrain WAVE1 STOREFRONT VALIDATION ===")

print("MANIFEST =", len(products))

print("CATEGORIES =", dict(counts))

print("CLIENT PRODUCTS =", len(client))

print("PRODUCT PAGES =", len(actual_pages))

print("BROKEN LINKS =", len(broken))

print("PRODUCT NOINDEX =", len(product_noindex))

print("WRONG BRAND CASING =", len(wrong_brand))

print("OLD 50-PRODUCT WORDING =", len(old_50))

print("ERRORS =", len(errors))



if errors:

    print("\nFAILURES:")

    for e in errors:

        print("-", e)

    sys.exit(1)



print("RESULT = PASS")
