#!/usr/bin/env python3
from __future__ import annotations
import argparse, csv, re
from collections import Counter
from pathlib import Path

DEFAULT_LAUNCH = Path("/home/ubuntu/keystone/feed/launch_wave1.csv")
DEFAULT_APPROVALS = Path("/home/ubuntu/keystone/feed/commerce_approvals.csv")
DEFAULT_OUTPUT = Path("/home/ubuntu/keystone/feed")
SITE = "https://omni-terrain.com"

APPROVAL_FIELDS = [
    "VCPN","BrandAuthorized","ChannelAuthorized","MAPVerified","ContentRights",
    "LiveStockVerified","ShippingVerified","ReturnsVerified","MarketPriceVerified",
    "PaidAdsEnabled","SellPrice","ShippingCharge","ProductTitle","ProductDescription",
    "ImageURL","ProductURL","GTIN","Notes",
]
REPORT_FIELDS = [
    "VCPN","VendorName","ManufacturerPartNo","CategoryInferred","CatalogVisible",
    "CheckoutReady","SearchAdsReady","MerchantReady","GateReasons",
]
MERCHANT_FIELDS = [
    "id","title","description","link","image_link","availability","price","brand",
    "gtin","mpn","condition",
]
TRUTHY = {"YES","Y","TRUE","1","APPROVED","PASS"}
MAP_OK = TRUTHY | {"NA","N/A","NOT_APPLICABLE","NOT APPLICABLE"}
CONTENT_VISIBLE = TRUTHY | {"FACTS_ONLY","FACTS ONLY"}

def clean(v): return str(v or "").strip()
def upper(v): return clean(v).upper()
def yes(v): return upper(v) in TRUTHY
def map_ok(v): return upper(v) in MAP_OK
def content_visible(v): return upper(v) in CONTENT_VISIBLE
def media_ok(v): return yes(v)
def paid_enabled(a): return yes(a.get("PaidAdsEnabled")) or yes(a.get("AdEnabled"))

def money(v):
    try: return round(float(clean(v).replace("$","").replace(",","")), 2)
    except (ValueError, TypeError): return 0.0

def slugify(v):
    return re.sub(r"[^a-z0-9]+","-",clean(v).lower()).strip("-")[:100] or "product"

def key(row):
    return clean(row.get("VCPN")) or clean(row.get("PartNumber")) or clean(row.get("ManufacturerPartNo"))

def product_url(feed, approval):
    if clean(approval.get("ProductURL")): return clean(approval["ProductURL"])
    return f"{SITE}/us-{slugify(feed.get('VendorName'))}-{slugify(feed.get('ManufacturerPartNo') or key(feed))}.html"

def read_csv(path):
    if not path.exists(): return [], []
    with path.open("r",encoding="utf-8-sig",errors="replace",newline="") as f:
        r=csv.DictReader(f); return list(r), list(r.fieldnames or [])

def write_csv(path, fields, rows, delimiter=","):
    with path.open("w",encoding="utf-8",newline="") as f:
        w=csv.DictWriter(f,fieldnames=fields,extrasaction="ignore",delimiter=delimiter)
        w.writeheader(); w.writerows(rows)

def load_approvals(path):
    rows,_=read_csv(path); out={}; counts=Counter()
    for row in rows:
        k=clean(row.get("VCPN"))
        if k: counts[k]+=1; out[k]=row
    dup=[k for k,c in counts.items() if c>1]
    if dup: raise SystemExit("Duplicate VCPN in approvals: "+", ".join(dup[:20]))
    return out

def init_approvals(launch, path):
    old_rows,old_fields=read_csv(path)
    old={clean(r.get("VCPN")):r for r in old_rows if clean(r.get("VCPN"))}
    output=[]
    for feed in launch:
        k=key(feed)
        if not k: continue
        prev=old.get(k,{})
        row={f:prev.get(f,"") for f in APPROVAL_FIELDS}
        if not clean(row["PaidAdsEnabled"]) and clean(prev.get("AdEnabled")):
            row["PaidAdsEnabled"]=prev["AdEnabled"]
        row["VCPN"]=k
        for f in ["BrandAuthorized","ChannelAuthorized","MAPVerified","ContentRights",
                  "LiveStockVerified","ShippingVerified","ReturnsVerified","MarketPriceVerified"]:
            if not clean(row[f]): row[f]="PENDING"
        if not clean(row["PaidAdsEnabled"]): row["PaidAdsEnabled"]="NO"
        if not clean(row["GTIN"]): row["GTIN"]=clean(feed.get("UPCCode"))
        output.append(row)
    launch_keys={key(r) for r in launch}
    for k,prev in old.items():
        if k not in launch_keys:
            row={f:prev.get(f,"") for f in APPROVAL_FIELDS}
            if not clean(row["PaidAdsEnabled"]) and clean(prev.get("AdEnabled")):
                row["PaidAdsEnabled"]=prev["AdEnabled"]
            output.append(row)
    write_csv(path,APPROVAL_FIELDS,output)
    print(f"APPROVAL TEMPLATE ROWS = {len(output):,}")
    print(f"APPROVAL FILE = {path}")
    if old_fields and set(old_fields)!=set(APPROVAL_FIELDS): print("NOTE = approval columns normalized")

def evaluate(feed,a):
    reasons=[]; k=key(feed); category=clean(feed.get("CategoryInferred"))
    mpn=clean(feed.get("ManufacturerPartNo")); gtin=clean(a.get("GTIN")) or clean(feed.get("UPCCode"))
    title=clean(a.get("ProductTitle")); desc=clean(a.get("ProductDescription"))
    image=clean(a.get("ImageURL")); price=money(a.get("SellPrice"))
    shipping=money(a.get("ShippingCharge")); url=product_url(feed,a)
    visible=True
    for passed,reason in [
        (category in {"AUTO","MARINE","RV"},"catalog:category"),
        (content_visible(a.get("ContentRights")),"catalog:content-rights"),
        (bool(title),"catalog:title"),(bool(mpn or gtin),"catalog:identifier"),
    ]:
        if not passed: visible=False; reasons.append(reason)
    checkout=visible
    for passed,reason in [
        (yes(a.get("BrandAuthorized")),"sale:brand-authorization"),
        (yes(a.get("ChannelAuthorized")),"sale:channel-authorization"),
        (map_ok(a.get("MAPVerified")),"sale:map"),
        (yes(a.get("LiveStockVerified")),"sale:live-stock"),
        (yes(a.get("ShippingVerified")),"sale:shipping"),
        (yes(a.get("ReturnsVerified")),"sale:returns"),
        (yes(a.get("MarketPriceVerified")),"sale:market-price"),
        (price>0,"sale:price"),(bool(url),"sale:url"),
    ]:
        if not passed: checkout=False; reasons.append(reason)
    search=checkout and paid_enabled(a)
    if checkout and not paid_enabled(a): reasons.append("ads:not-paid-enabled")
    merchant=checkout
    for passed,reason in [
        (media_ok(a.get("ContentRights")),"merchant:media-rights"),
        (bool(desc),"merchant:description"),(bool(image),"merchant:image"),
        (bool(mpn or gtin),"merchant:identifier"),
    ]:
        if not passed: merchant=False; reasons.append(reason)
    merged=dict(feed)
    merged.update({"ApprovedProductTitle":title,"ApprovedProductDescription":desc,
        "ApprovedImageURL":image,"ApprovedProductURL":url,"ApprovedGTIN":gtin,
        "SellPriceUSD":f"{price:.2f}" if price>0 else "","ShippingChargeUSD":f"{shipping:.2f}"})
    report={"VCPN":k,"VendorName":clean(feed.get("VendorName")),"ManufacturerPartNo":mpn,
        "CategoryInferred":category,"CatalogVisible":"YES" if visible else "NO",
        "CheckoutReady":"YES" if checkout else "NO","SearchAdsReady":"YES" if search else "NO",
        "MerchantReady":"YES" if merchant else "NO",
        "GateReasons":";".join(dict.fromkeys(reasons)) if reasons else "PASS"}
    mrow={"id":k,"title":title,"description":desc,"link":url,"image_link":image,
        "availability":"in_stock","price":f"{price:.2f} USD","brand":clean(feed.get("VendorName")),
        "gtin":gtin,"mpn":mpn,"condition":"new"}
    return merged,report,visible,checkout,search,merchant,mrow

def self_test():
    feed={"VCPN":"T1","VendorName":"Test","ManufacturerPartNo":"MPN1",
          "UPCCode":"012345678901","CategoryInferred":"AUTO"}
    a={"BrandAuthorized":"YES","ChannelAuthorized":"YES","MAPVerified":"N/A",
       "ContentRights":"YES","LiveStockVerified":"YES","ShippingVerified":"YES",
       "ReturnsVerified":"YES","MarketPriceVerified":"YES","PaidAdsEnabled":"YES",
       "SellPrice":"129.99","ShippingCharge":"0","ProductTitle":"Test Product",
       "ProductDescription":"Original description","ImageURL":"https://example.com/x.jpg",
       "ProductURL":"https://omni-terrain.com/us-test.html","GTIN":"012345678901"}
    _,r,v,c,s,m,_=evaluate(feed,a); assert v and c and s and m, r
    a["PaidAdsEnabled"]="NO"
    _,r,v,c,s,m,_=evaluate(feed,a); assert v and c and not s and m, r
    a["BrandAuthorized"]="PENDING"
    _,r,_,c,s,m,_=evaluate(feed,a); assert not c and not s and not m and "sale:brand-authorization" in r["GateReasons"]
    a["BrandAuthorized"]="YES"; a["ContentRights"]="FACTS_ONLY"
    _,r,v,c,s,m,_=evaluate(feed,a); assert v and c and not s and not m and "merchant:media-rights" in r["GateReasons"]
    a["ContentRights"]="YES"; a["PaidAdsEnabled"]="YES"; a["ImageURL"]=""
    _,r,v,c,s,m,_=evaluate(feed,a); assert v and c and s and not m and "merchant:image" in r["GateReasons"]
    print("SELF TEST PASSED = 5")

def main():
    p=argparse.ArgumentParser(); p.add_argument("--launch",default=str(DEFAULT_LAUNCH))
    p.add_argument("--approvals",default=str(DEFAULT_APPROVALS)); p.add_argument("--output-dir",default=str(DEFAULT_OUTPUT))
    p.add_argument("--init-approvals",action="store_true"); p.add_argument("--self-test",action="store_true")
    args=p.parse_args()
    if args.self_test: self_test(); return
    launch_path=Path(args.launch); approvals_path=Path(args.approvals); out=Path(args.output_dir); out.mkdir(parents=True,exist_ok=True)
    launch,launch_fields=read_csv(launch_path)
    if not launch: raise SystemExit(f"No launch rows found: {launch_path}")
    if args.init_approvals: init_approvals(launch,approvals_path); return
    if not approvals_path.exists(): raise SystemExit(f"Approval ledger missing: {approvals_path}. Run --init-approvals first.")
    approvals=load_approvals(approvals_path); catalogue=[]; checkout=[]; search=[]; merchant=[]; reports=[]; missing=0
    extra=["ApprovedProductTitle","ApprovedProductDescription","ApprovedImageURL","ApprovedProductURL","ApprovedGTIN","SellPriceUSD","ShippingChargeUSD"]
    output_fields=list(launch_fields)+[f for f in extra if f not in launch_fields]
    for feed in launch:
        a=approvals.get(key(feed))
        if a is None: missing+=1; a={f:"" for f in APPROVAL_FIELDS}
        merged,report,v,c,s,m,mrow=evaluate(feed,a); reports.append(report)
        if v: catalogue.append(merged)
        if c: checkout.append(merged)
        if s: search.append(merged)
        if m: merchant.append(mrow)
    write_csv(out/"catalogue_visible.csv",output_fields,catalogue); write_csv(out/"checkout_ready.csv",output_fields,checkout)
    write_csv(out/"google_search_ads_ready.csv",output_fields,search); write_csv(out/"google_merchant_ready.csv",MERCHANT_FIELDS,merchant)
    write_csv(out/"google_merchant_feed.tsv",MERCHANT_FIELDS,merchant,delimiter="\t"); write_csv(out/"commerce_gate_report.csv",REPORT_FIELDS,reports)
    print(f"LAUNCH ROWS = {len(launch):,}"); print(f"MISSING APPROVAL ROWS = {missing:,}")
    print(f"CATALOGUE VISIBLE = {len(catalogue):,}"); print(f"CHECKOUT READY = {len(checkout):,}")
    print(f"GOOGLE MERCHANT READY = {len(merchant):,}"); print(f"GOOGLE SEARCH ADS READY = {len(search):,}")
    print(f"REPORT = {out/'commerce_gate_report.csv'}")

if __name__=="__main__": main()
