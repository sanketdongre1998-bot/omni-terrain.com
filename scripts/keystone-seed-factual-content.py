#!/usr/bin/env python3
"""Seed original factual catalogue copy for Omni Terrain Wave 1.

This script does not grant supplier/brand/channel permission. It only creates original,
fact-based website copy from identifiers and operational fields already present in the
Keystone launch CSV. It deliberately does not copy supplier/manufacturer images.

Default behavior is safe: write a new seeded approval file. Use --in-place only after
reviewing the output.
"""
from __future__ import annotations

import argparse
import csv
import re
import tempfile
from pathlib import Path

BASE = Path("/home/ubuntu/keystone/feed")
APPROVAL_FIELDS = [
    "VCPN","BrandAuthorized","ChannelAuthorized","MAPVerified","ContentRights",
    "LiveStockVerified","ShippingVerified","ReturnsVerified","MarketPriceVerified",
    "DirectCheckoutEnabled","PaidAdsEnabled","SellPrice","ShippingCharge","SupplierShippingCost",
    "CompetitorDeliveredPrice","CompetitorSource","CustomerValuePass",
    "ProductTitle","ProductDescription","ImageURL","ProductURL","GTIN","Notes",
]
CATEGORY_NAMES = {"AUTO":"automotive parts","MARINE":"marine equipment","RV":"RV and overlanding"}


def clean(v): return str(v or "").strip()

def key(row): return clean(row.get("VCPN")) or clean(row.get("PartNumber")) or clean(row.get("ManufacturerPartNo"))

def read_csv(path):
    path=Path(path)
    if not path.exists(): return [], []
    with path.open("r",encoding="utf-8-sig",errors="replace",newline="") as f:
        r=csv.DictReader(f); return list(r), list(r.fieldnames or [])

def write_csv(path,rows):
    path=Path(path); path.parent.mkdir(parents=True,exist_ok=True)
    with path.open("w",encoding="utf-8",newline="") as f:
        w=csv.DictWriter(f,fieldnames=APPROVAL_FIELDS,extrasaction="ignore"); w.writeheader(); w.writerows(rows)

def smart_words(text):
    text=re.sub(r"\s+"," ",clean(text)).strip(" -")
    if not text: return ""
    words=[]
    for token in text.split():
        bare=re.sub(r"[^A-Za-z]","",token)
        if any(ch.isdigit() for ch in token) or (bare and len(bare)<=5 and bare.isupper()):
            words.append(token)
        else:
            words.append(token.capitalize())
    return " ".join(words)

def compact_title(feed):
    brand=smart_words(feed.get("VendorName"))
    raw=smart_words(feed.get("LongDescription"))
    mpn=clean(feed.get("ManufacturerPartNo")) or clean(feed.get("PartNumber")) or key(feed)
    title=" ".join(x for x in (brand,raw) if x)
    suffix=f" — MPN {mpn}" if mpn else ""
    maximum=150
    if len(title)+len(suffix)>maximum:
        title=title[:maximum-len(suffix)-1].rstrip(" -/,")
    return (title+suffix).strip()

def dimensions(feed):
    values=[]
    for label,field in (("L","Length"),("W","Width"),("H","Height")):
        value=clean(feed.get(field))
        if value and value not in {"0","0.0","0.00"}: values.append(f"{label} {value} in")
    return " × ".join(values)

def factual_description(feed,title):
    brand=smart_words(feed.get("VendorName")) or "This product"
    mpn=clean(feed.get("ManufacturerPartNo")) or clean(feed.get("PartNumber")) or key(feed)
    category=CATEGORY_NAMES.get(clean(feed.get("CategoryInferred")),"specialist parts")
    parts=[f"{brand} product record for {category}"]
    if mpn: parts.append(f"manufacturer part number {mpn}")
    upc=clean(feed.get("UPCCode"))
    if upc: parts.append(f"UPC {upc}")
    weight=clean(feed.get("Weight"))
    if weight and weight not in {"0","0.0","0.00"}: parts.append(f"listed weight {weight} lb")
    dims=dimensions(feed)
    if dims: parts.append(f"listed dimensions {dims}")
    sentence="; ".join(parts)+"."
    fit=clean(feed.get("FitmentRisk"))
    if fit:
        sentence += f" Fitment review level: {fit.lower()}. Verify application and installation requirements before ordering."
    else:
        sentence += " Verify application and installation requirements before ordering."
    return sentence[:900]

def seed(launch,approvals):
    approval_by_key={clean(r.get("VCPN")):r for r in approvals if clean(r.get("VCPN"))}
    output=[]; created=0; facts_only=0; preserved=0
    for feed in launch:
        k=key(feed)
        if not k: continue
        old=approval_by_key.get(k,{})
        row={field:clean(old.get(field)) for field in APPROVAL_FIELDS}
        row["VCPN"]=k
        if not row["ProductTitle"]:
            row["ProductTitle"]=compact_title(feed); created+=1
        else: preserved+=1
        if not row["ProductDescription"]:
            row["ProductDescription"]=factual_description(feed,row["ProductTitle"])
        rights=row["ContentRights"].upper()
        if rights in {"","PENDING"}:
            row["ContentRights"]="FACTS_ONLY"; facts_only+=1
        # Never auto-approve a commercial gate or third-party media permission.
        for field in ("BrandAuthorized","ChannelAuthorized","MAPVerified","LiveStockVerified",
                      "ShippingVerified","ReturnsVerified","MarketPriceVerified","CustomerValuePass"):
            if not row[field]: row[field]="PENDING"
        if not row["DirectCheckoutEnabled"]: row["DirectCheckoutEnabled"]="NO"
        if not row["PaidAdsEnabled"]: row["PaidAdsEnabled"]="NO"
        if not row["GTIN"]: row["GTIN"]=clean(feed.get("UPCCode"))
        if not row["Notes"]:
            row["Notes"]="Original factual catalogue copy seeded; no third-party image permission inferred."
        output.append(row)
    return output,{"rows":len(output),"titles_created":created,"manual_titles_preserved":preserved,"facts_only":facts_only}

def run(args):
    launch,_=read_csv(args.launch); approvals,_=read_csv(args.approvals)
    if not launch: raise SystemExit(f"No launch rows: {args.launch}")
    if not approvals: raise SystemExit(f"No approval ledger: {args.approvals}. Run keystone-commerce-gate.py --init-approvals first.")
    out,stats=seed(launch,approvals)
    output=Path(args.approvals if args.in_place else args.output)
    write_csv(output,out)
    print("=== OMNI TERRAIN FACTUAL CONTENT SEED ===")
    for name,value in stats.items(): print(name.upper(),"=",value)
    print("OUTPUT =",output)

def self_test():
    launch=[
        {"VCPN":"A1","VendorName":"HUSKY TOWING","LongDescription":"2-5/16 GOOSENECK BALL","ManufacturerPartNo":"33055","UPCCode":"123","CategoryInferred":"AUTO","Weight":"8.16","Length":"8.23","Width":"3","Height":"3","FitmentRisk":"LOW"},
        {"VCPN":"M1","VendorName":"RAYMARINE","LongDescription":"MARINE BATTERY SWITCH","ManufacturerPartNo":"X1","CategoryInferred":"MARINE","FitmentRisk":"MEDIUM"},
    ]
    approvals=[
        {"VCPN":"A1","ContentRights":"PENDING","BrandAuthorized":"PENDING"},
        {"VCPN":"M1","ContentRights":"NO","ProductTitle":"Manual Raymarine Title","BrandAuthorized":"NO"},
    ]
    out,stats=seed(launch,approvals); by={r["VCPN"]:r for r in out}
    assert by["A1"]["ContentRights"]=="FACTS_ONLY"
    assert "HUSKY" in by["A1"]["ProductTitle"].upper() and "33055" in by["A1"]["ProductTitle"]
    assert "listed weight 8.16 lb" in by["A1"]["ProductDescription"]
    assert by["A1"]["BrandAuthorized"]=="PENDING"
    assert by["A1"]["DirectCheckoutEnabled"]=="NO" and by["A1"]["PaidAdsEnabled"]=="NO"
    assert by["M1"]["ContentRights"]=="NO" and by["M1"]["ProductTitle"]=="Manual Raymarine Title"
    assert by["M1"]["BrandAuthorized"]=="NO"
    assert stats["rows"]==2 and stats["titles_created"]==1 and stats["manual_titles_preserved"]==1
    print("SELF TEST PASSED = 1")

def main():
    p=argparse.ArgumentParser(); p.add_argument("--launch",default=str(BASE/"launch_wave1.csv"))
    p.add_argument("--approvals",default=str(BASE/"commerce_approvals.csv")); p.add_argument("--output",default=str(BASE/"commerce_approvals_seeded.csv"))
    p.add_argument("--in-place",action="store_true"); p.add_argument("--self-test",action="store_true"); a=p.parse_args()
    if a.self_test: self_test(); return
    run(a)

if __name__=="__main__": main()
