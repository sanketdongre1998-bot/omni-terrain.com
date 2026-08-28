#!/usr/bin/env python3
"""Build catalogue-wide display pricing from the local Keystone master feed.

This intentionally separates *display pricing* from *checkout eligibility*.
Existing market-verified live-commerce prices remain authoritative for checkout-ready
SKUs; the rest of the catalogue receives a visible price without being silently
promoted to online checkout.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import subprocess
from pathlib import Path

LOADER_MARKER = "OT_CATALOGUE_DISPLAY_PRICING_LOADER"


def cents(value: str) -> int:
    try:
        amount = float(str(value or "").strip())
    except ValueError:
        return 0
    if not math.isfinite(amount) or amount <= 0:
        return 0
    return int(round(amount * 100))


def load_products(root: Path) -> list[dict]:
    js = "process.stdout.write(JSON.stringify(require('./assets/us-products.js')))"
    proc = subprocess.run(
        ["node", "-e", js],
        cwd=root,
        check=True,
        capture_output=True,
        text=True,
    )
    data = json.loads(proc.stdout)
    if not isinstance(data, list):
        raise SystemExit("assets/us-products.js did not export a product array")
    return data


def load_feed(path: Path) -> tuple[dict[str, dict], dict[str, list[dict]]]:
    by_id: dict[str, dict] = {}
    by_mpn: dict[str, list[dict]] = {}
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            product_id = str(row.get("VCPN") or "").strip()
            mpn = str(row.get("ManufacturerPartNo") or row.get("PartNumber") or "").strip().lower()
            if product_id:
                by_id[product_id] = row
            if mpn:
                by_mpn.setdefault(mpn, []).append(row)
    return by_id, by_mpn


def fallback_price(row: dict) -> int:
    """Prefer supplier JobberPrice. Use a conservative cost floor only if absent."""
    jobber = cents(row.get("JobberPrice", ""))
    if jobber:
        return jobber
    cost = cents(row.get("Cost", ""))
    if not cost:
        return 0
    # Display-only emergency fallback. Checkout remains separately gated.
    dollars = cost / 100
    provisional = max(dollars * 1.25, dollars + 15.0)
    # Retail-looking .99 ending while never reducing the calculated floor.
    rounded = math.ceil(provisional) - 0.01
    return int(round(rounded * 100))


def build_runtime(prices: dict[str, dict]) -> str:
    payload = json.dumps(prices, separators=(",", ":"), ensure_ascii=False)
    return f'''(function () {{
  "use strict";
  const PRICES = {payload};

  function money(cents) {{
    return new Intl.NumberFormat("en-US", {{style:"currency",currency:"USD",minimumFractionDigits:2}}).format(Number(cents || 0) / 100);
  }}

  function injectStyles() {{
    if (document.getElementById("otDisplayPriceStyles")) return;
    const style = document.createElement("style");
    style.id = "otDisplayPriceStyles";
    style.textContent = `
      .ot-display-price{{margin-top:6px;color:#071a30;font-size:20px;font-weight:900;letter-spacing:-.02em}}
      .ot-display-buybox{{margin:22px 0;padding:20px;border:1px solid #dde3e8;border-radius:16px;background:linear-gradient(135deg,#fff,#f6f8f9);box-shadow:0 10px 28px rgba(7,26,48,.06)}}
      .ot-display-label{{color:#8b6a31;font-size:11px;font-weight:850;text-transform:uppercase;letter-spacing:.09em}}
      .ot-display-big{{margin:7px 0 6px;color:#071a30;font-size:36px;line-height:1;font-weight:900;letter-spacing:-.035em}}
      .ot-display-note{{color:#65717d;font-size:12px;line-height:1.55}}
      .ot-display-action{{display:inline-flex;align-items:center;justify-content:center;min-height:42px;margin-top:14px;padding:10px 15px;border:1px solid #071a30;border-radius:10px;color:#071a30!important;text-decoration:none;font-size:12px;font-weight:850}}
    `;
    document.head.appendChild(style);
  }}

  function cleanHref(value) {{
    return String(value || "").split("?")[0].split("#")[0].split("/").pop();
  }}

  function decorateCards() {{
    document.querySelectorAll(".card").forEach((card) => {{
      if (card.querySelector(".ot-live-inline-price")) return;
      const link = card.querySelector(".card-link");
      const slug = cleanHref(link && link.getAttribute("href"));
      const product = PRICES[slug];
      if (!product || !product.priceCents) return;
      const old = card.querySelector(".search-note");
      if (old) {{
        old.className = "ot-display-price";
        old.textContent = money(product.priceCents);
      }} else if (link && link.parentNode && !card.querySelector(".ot-display-price")) {{
        const node = document.createElement("div");
        node.className = "ot-display-price";
        node.textContent = money(product.priceCents);
        link.parentNode.insertBefore(node, link);
      }}
    }});
  }}

  function currentProduct() {{
    const slug = cleanHref(window.location.pathname);
    return PRICES[slug] || null;
  }}

  function decorateProductPage() {{
    const product = currentProduct();
    if (!product || !product.priceCents) return;
    if (document.querySelector(".ot-live-buybox")) return;

    const copy = document.querySelector(".product-copy");
    if (copy && !copy.querySelector(".ot-display-buybox")) {{
      const box = document.createElement("div");
      box.className = "ot-display-buybox";
      box.innerHTML = `<div class="ot-display-label">Current price</div><div class="ot-display-big">${{money(product.priceCents)}}</div><div class="ot-display-note">Availability and delivery options are verified before purchase. Checkout is enabled only after the product's sale gates are cleared.</div><a class="ot-display-action" href="contact-and-order-help.html#request-help">Check availability →</a>`;
      const notice = copy.querySelector(".notice");
      if (notice) copy.insertBefore(box, notice);
      else {{ const facts = copy.querySelector(".facts"); facts ? copy.insertBefore(box, facts) : copy.appendChild(box); }}
      if (notice) notice.style.display = "none";
      const oldLink = copy.querySelector('a[href*="request-help"]');
      if (oldLink && oldLink.closest("p")) oldLink.closest("p").style.display = "none";
      return;
    }}

    const panel = document.querySelector(".purchase-panel");
    if (panel && !panel.querySelector(".ot-live-price")) {{
      const heading = panel.querySelector("h2");
      const withheld = panel.querySelector(".price-withheld");
      if (heading) heading.textContent = money(product.priceCents);
      if (withheld) withheld.textContent = "Availability verified before purchase";
    }}
  }}

  function render() {{
    injectStyles();
    decorateCards();
    decorateProductPage();
  }}

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render, {{once:true}});
  else render();
  setTimeout(render, 500);
}})();
'''


def ensure_loader(root: Path) -> None:
    path = root / "assets" / "us-live-commerce.js"
    text = path.read_text(encoding="utf-8")
    if LOADER_MARKER in text:
        return
    needle = "\n  updateCartCounts();\n})();"
    loader = f'''\n  updateCartCounts();\n\n  // {LOADER_MARKER}\n  if (!document.querySelector('script[data-ot-display-pricing]')) {{\n    const displayPricing = document.createElement("script");\n    displayPricing.src = "/assets/us-display-prices.js?v=1";\n    displayPricing.dataset.otDisplayPricing = "true";\n    document.head.appendChild(displayPricing);\n  }}\n}})();'''
    if needle not in text:
        raise SystemExit("Could not find the live-commerce footer to attach display pricing")
    path.write_text(text.replace(needle, loader, 1), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    parser.add_argument("--feed", default="/home/ubuntu/keystone/feed/master_catalog.csv")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    feed_path = Path(args.feed).resolve()
    if not feed_path.exists():
        raise SystemExit(f"Master feed not found: {feed_path}")

    products = load_products(root)
    by_id, by_mpn = load_feed(feed_path)

    live_path = root / "assets" / "us-live-products.json"
    live = json.loads(live_path.read_text(encoding="utf-8")) if live_path.exists() else {"products": {}}
    overrides = live.get("products") or {}

    output: dict[str, dict] = {}
    missing: list[str] = []
    fallback_count = 0

    for product in products:
        pid = str(product.get("id") or "").strip()
        slug = str(product.get("slug") or "").strip()
        mpn = str(product.get("mpn") or "").strip()
        if not slug:
            continue

        row = by_id.get(pid)
        if row is None and mpn:
            matches = by_mpn.get(mpn.lower(), [])
            if len(matches) == 1:
                row = matches[0]

        override = overrides.get(pid) or {}
        price = int(override.get("priceCents") or 0) if int(override.get("priceCents") or 0) > 0 else 0
        source = "market-verified-live" if price else "supplier-jobber"

        if not price and row:
            jobber = cents(row.get("JobberPrice", ""))
            price = fallback_price(row)
            if price and not jobber:
                source = "cost-floor-display-only"
                fallback_count += 1

        if not price:
            missing.append(f"{pid}:{mpn}:{slug}")
            continue

        output[slug] = {
            "id": pid,
            "mpn": mpn,
            "priceCents": price,
            "source": source,
        }

    runtime = build_runtime(output)
    (root / "assets" / "us-display-prices.js").write_text(runtime, encoding="utf-8")
    ensure_loader(root)

    print(f"PRODUCTS IN STOREFRONT = {len(products)}")
    print(f"DISPLAY PRICES BUILT  = {len(output)}")
    print(f"COST-FLOOR FALLBACKS  = {fallback_count}")
    print(f"MISSING PRICES        = {len(missing)}")
    if missing:
        print("FIRST MISSING =", ", ".join(missing[:10]))
    if len(output) < max(950, int(len(products) * 0.95)):
        raise SystemExit("Too many storefront products are missing a defensible display price; refusing to publish")
    print("DISPLAY PRICING READY — checkout eligibility remains separately gated")


if __name__ == "__main__":
    main()
