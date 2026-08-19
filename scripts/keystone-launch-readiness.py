#!/usr/bin/env python3
from __future__ import annotations
import argparse, csv, json
from collections import Counter
from pathlib import Path

BASE=Path("/home/ubuntu/keystone/feed")
EXPECTED={"AUTO":650,"MARINE":250,"RV":100}

def clean(v): return str(v or "").strip()
def num(v):
    try: return float(clean(v).replace("$","").replace(",",""))
    except ValueError: return 0.0

def read(path):
    if not path.exists(): return []
    with path.open("r",encoding="utf-8-sig",errors="replace",newline="") as f: return list(csv.DictReader(f))

def key(r): return clean(r.get("VCPN")) or clean(r.get("id"))
def subset(child,parent): return {key(r) for r in child if key(r)} <= {key(r) for r in parent if key(r)}

def audit(args):
    launch=read(Path(args.launch)); visible=read(Path(args.visible)); checkout=read(Path(args.checkout))
    merchant=read(Path(args.merchant)); paid=read(Path(args.paid))
    blockers=[]; ads_blockers=[]; warnings=[]
    cats=Counter(clean(r.get("CategoryInferred")) for r in launch)
    if len(launch)!=1000: blockers.append(f"Wave 1 must contain 1,000 rows; found {len(launch)}")
    for cat,target in EXPECTED.items():
        if cats[cat]!=target: blockers.append(f"{cat} target {target}; found {cats[cat]}")
    keys=[key(r) for r in launch if key(r)]
    if len(keys)!=len(set(keys)): blockers.append("Duplicate VCPN/primary keys in Wave 1")
    if not subset(visible,launch): blockers.append("Visible catalogue contains rows outside Wave 1")
    if not subset(checkout,visible): blockers.append("Checkout set is not a subset of visible catalogue")
    if not subset(merchant,checkout): blockers.append("Merchant set is not a subset of checkout-ready")
    if not subset(paid,checkout): blockers.append("Paid Search set is not a subset of checkout-ready")

    if len(paid)<5: ads_blockers.append(f"Need at least 5 paid-ready products for first $50 test; found {len(paid)}")
    if len(paid)>10: ads_blockers.append(f"Paid Search must stay <=10 products for $50 test; found {len(paid)}")
    if paid and not subset(paid,merchant): ads_blockers.append("Every paid Search launch SKU must also be Merchant/page-quality ready")

    paid_rows=[]
    for r in paid:
        net=num(r.get("PlanningNetBeforeAdsUSD")); sell=num(r.get("SellPriceUSD")); comp=num(r.get("CompetitorDeliveredPriceUSD"))
        delta=(sell+num(r.get("ShippingChargeUSD")))-comp if comp else 0.0
        paid_rows.append({"vcpn":key(r),"brand":clean(r.get("VendorName")),"mpn":clean(r.get("ManufacturerPartNo")),
            "title":clean(r.get("ApprovedProductTitle")),"category":clean(r.get("CategoryInferred")),"sell_price":round(sell,2),
            "cost":round(num(r.get("Cost")),2),"competitor_delivered":round(comp,2),"customer_price_delta":round(delta,2),
            "planning_net_before_ads":round(net,2),"stock":num(r.get("NormalizedTotalQty")),"warehouses":int(num(r.get("WarehouseCount")))})
        if net<25: warnings.append(f"{key(r)} planning net before ads is only ${net:.2f}")
        if comp and delta>0: warnings.append(f"{key(r)} is ${delta:.2f} above benchmark; CustomerValuePass needs strong non-price reason")

    storefront_ready=not blockers
    ads_ready=storefront_ready and not ads_blockers
    report={
        "storefront_ready":storefront_ready,
        "ads_ready":ads_ready,
        "counts":{"launch":len(launch),"visible":len(visible),"checkout":len(checkout),"merchant":len(merchant),"paid_search":len(paid)},
        "categories":dict(cats),"blockers":blockers,"ads_blockers":ads_blockers,"warnings":warnings,"paid_products":paid_rows,
    }
    Path(args.output).write_text(json.dumps(report,indent=2),encoding="utf-8")
    print("=== OMNI TERRAIN AUG-21 LAUNCH READINESS ==="); print("COUNTS =",report["counts"]); print("CATEGORY =",dict(cats))
    print("STOREFRONT STATUS =", "READY" if storefront_ready else "BLOCKED")
    print("ADS STATUS =", "READY" if ads_ready else "BLOCKED")
    for x in blockers: print("BLOCKER |",x)
    for x in ads_blockers: print("ADS BLOCKER |",x)
    for x in warnings: print("WARNING |",x)
    if paid_rows:
        print("\nPAID SEARCH PRODUCTS")
        for r in sorted(paid_rows,key=lambda x:x["planning_net_before_ads"],reverse=True):
            print(f'{r["vcpn"]} | {r["brand"]} | {r["mpn"]} | ${r["sell_price"]:.2f} | benchmark ${r["competitor_delivered"]:.2f} | pre-ad ${r["planning_net_before_ads"]:.2f}')
    print("REPORT =",args.output)
    if args.strict and blockers: raise SystemExit(2)
    if args.strict_ads and (blockers or ads_blockers): raise SystemExit(3)

def self_test(tmp):
    base=Path(tmp); base.mkdir(parents=True,exist_ok=True)
    fields=["VCPN","CategoryInferred","PlanningNetBeforeAdsUSD","SellPriceUSD","ShippingChargeUSD","CompetitorDeliveredPriceUSD",
            "Cost","VendorName","ManufacturerPartNo","ApprovedProductTitle","NormalizedTotalQty","WarehouseCount"]
    launch=[]
    for cat,n in EXPECTED.items():
        for i in range(n): launch.append({"VCPN":f"{cat}{i}","CategoryInferred":cat})
    def w(name,rows):
        with (base/name).open("w",newline="",encoding="utf-8") as f:
            cw=csv.DictWriter(f,fieldnames=fields,extrasaction="ignore"); cw.writeheader(); cw.writerows(rows)
    w("launch.csv",launch); w("visible.csv",launch); w("checkout.csv",launch[:20])
    merchant=[dict(r,PlanningNetBeforeAdsUSD="40",SellPriceUSD="120",CompetitorDeliveredPriceUSD="120") for r in launch[:10]]
    paid=merchant[:5]; w("merchant.csv",merchant); w("paid.csv",paid)
    class A: pass
    a=A(); a.launch=str(base/"launch.csv"); a.visible=str(base/"visible.csv"); a.checkout=str(base/"checkout.csv")
    a.merchant=str(base/"merchant.csv"); a.paid=str(base/"paid.csv"); a.output=str(base/"report.json"); a.strict=True; a.strict_ads=True
    audit(a); data=json.loads((base/"report.json").read_text()); assert data["storefront_ready"] and data["ads_ready"] and data["counts"]["paid_search"]==5
    w("paid.csv",[]); a.strict=False; a.strict_ads=False; audit(a); data=json.loads((base/"report.json").read_text()); assert data["storefront_ready"] and not data["ads_ready"]
    print("SELF TEST PASSED = 2")

def main():
    p=argparse.ArgumentParser(); p.add_argument("--launch",default=str(BASE/"launch_wave1.csv")); p.add_argument("--visible",default=str(BASE/"catalogue_visible.csv"))
    p.add_argument("--checkout",default=str(BASE/"checkout_ready.csv")); p.add_argument("--merchant",default=str(BASE/"google_merchant_ready.csv"))
    p.add_argument("--paid",default=str(BASE/"google_search_ads_ready.csv")); p.add_argument("--output",default=str(BASE/"launch_readiness.json"))
    p.add_argument("--strict",action="store_true"); p.add_argument("--strict-ads",action="store_true"); p.add_argument("--self-test",action="store_true"); a=p.parse_args()
    if a.self_test:
        import tempfile
        with tempfile.TemporaryDirectory() as d: self_test(d)
        return
    audit(a)

if __name__=="__main__": main()
