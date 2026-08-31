#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import html
import json
import os
import shutil
import subprocess
import tempfile
import time
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path("/home/ubuntu/keystone")
FEED = ROOT / "feed"
LAUNCH = FEED / "launch_wave1.csv"
APPROVALS = FEED / "commerce_approvals.csv"
AUDIT_OUT = FEED / "website_bulk_live_audit.csv"
REGISTRY_OUT = FEED / "us-live-products.bulk.json"
STOREFRONT_PRICES = "https://omni-terrain.com/assets/us-display-prices.js"
SOAP_URL = "http://order.ekeystone.com/wselectronicorder/electronicorder.asmx"
SOAP_ACTION = "http://eKeystone.com/GetShippingOptionsWithQuantity"
DEFAULT_ACCOUNT = "176325"

# Source: Keystone/LKQ "eComm Restricted Lines 5.15.26", supplied by Brian Doran.
POLICY = {"A1P":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"No","vendor":"ALLOY AXLE","website":"Requires Authorization"},"A1S":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"ARIES","website":"Requires Authorization"},"A27":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"AEROMOTIVE","website":"Yes"},"A2B":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"AMP RESEARCH","website":"Requires Authorization"},"A3C":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"ANZO USA","website":"Requires Authorization"},"A45":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"No","vendor":"AEM Induction","website":"Requires Authorization"},"A4M":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"AIRHEAD","website":"Yes"},"A6Z":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"No","vendor":"AMP Tires","website":"Requires Authorization"},"A78":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"FUEL OFFROAD WHEELS / WHEEL PROS","website":"Yes"},"A8H":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"Air Lift","website":"Requires Authorization"},"AC8":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"ACLIM8","website":"Yes"},"ADD":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"No","vendor":"ADD Offroad","website":"Requires Authorization"},"ALC":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"ALCON BRAKE","website":"Yes"},"ARB":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"ARB USA","website":"Yes"},"AUS":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"AWE Tuning","website":"Requires Authorization"},"B1W":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"No","vendor":"BAK Industries","website":"Requires Authorization"},"B29":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"B&M RACING","website":"Requires Authorization"},"B2P":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"BAJA DESIGNS","website":"Requires Authorization"},"B30":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"Belltech","website":"Requires Authorization"},"B4S":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"B&W TRAILER HITCHES","website":"Requires Authorization"},"B52":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"BD DIESEL","website":"Requires Authorization"},"B6D":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"BLUE OX","website":"Requires Authorization"},"B6H":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"B&W TOWING","website":"Requires Authorization"},"B6V":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"No","vendor":"BFGOODRICH","website":"Requires Authorization"},"B72":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"BATTERY TENDER/DELTRAN","website":"Yes"},"B7R":{"ecommerce":"Yes","map":"No","marketplace":"Requires Authorization","vendor":"BMPRO","website":"Yes"},"B83":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"BUYERS PROD","website":"Yes"},"B85":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"BEDSLIDE","website":"Yes"},"B8V":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"BDS Suspension","website":"Requires Authorization"},"B8Z":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"No","vendor":"BFGOODRICH","website":"Requires Authorization"},"BIG":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"BIG COUNTRY","website":"Yes"},"BPH":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"BULLETPROOF","website":"Yes"},"BUR":{"ecommerce":"Yes","map":"No","marketplace":"Requires Authorization","vendor":"BURCO MIRRORS","website":"Yes"},"C16":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"Corsa Perf","website":"Requires Authorization"},"C2C":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"COAST2COAST","website":"Requires Authorization"},"C2F":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"No","vendor":"COVERCRAFT","website":"Requires Authorization"},"C4Q":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"CAMP CHEF","website":"Yes"},"C6F":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"No","vendor":"CAREFREE RV","website":"Requires Authorization"},"C73":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"CIPA","website":"Requires Authorization"},"C8O":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"No","vendor":"Coverking","website":"Requires Authorization"},"C8Z":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"Corsa Perf","website":"Requires Authorization"},"CAK":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"No","vendor":"CAN-AM","website":"Requires Authorization"},"CAS":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"GATE KING","website":"Requires Authorization"},"CGL":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"No","vendor":"CARGO GLIDE","website":"Requires Authorization"},"CNT":{"ecommerce":"Yes","map":"No","marketplace":"Requires Authorization","vendor":"CENTURY CHEMICAL","website":"Yes"},"CUR":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"CURT","website":"Requires Authorization"},"D1A":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"DV8 Offroad","website":"Requires Authorization"},"D1B":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"No","vendor":"Decked","website":"Requires Authorization"},"D54":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"DYNAMAT","website":"Yes"},"D64":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"DIRECTED ELECTRONICS","website":"Requires Authorization"},"D76":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"DOMETIC","website":"Requires Authorization"},"DIO":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"DIODE DYNAMICS","website":"Yes"},"DTH":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"Detroit Speed","website":"Requires Authorization"},"E63":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"EQUALIZER","website":"Yes"},"E6A":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"Equal-i-zer","website":"Requires Authorization"},"E6N":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"EQUALIZER","website":"Requires Authorization"},"E7C":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"No","vendor":"ECOFLOW","website":"Requires Authorization"},"ENJ":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"ENJOY COOL","website":"Yes"},"F21":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"FLEX-A-LITE","website":"Requires Authorization"},"F28":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"FORD PERFORMANCE","website":"Requires Authorization"},"F36":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"FIRESTONE","website":"Requires Authorization"},"F6N":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"FURRION LLC","website":"Requires Authorization"},"F7F":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"FOGATTI","website":"Yes"},"F80":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"FLUID FILM","website":"Requires Authorization"},"FIR":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"FIRMAN POWER","website":"Requires Authorization"},"FSH":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"FISHBONE","website":"Requires Authorization"},"FSR":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"FREESPIRIT RECREATION","website":"Yes"},"G20":{"ecommerce":"Yes","map":"No","marketplace":"Requires Authorization","vendor":"GORILLA","website":"Yes"},"G22":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"GO IND","website":"Yes"},"G3S":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"S.P.A.","website":"Yes"},"G75":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"GO POWER","website":"Yes"},"G7Z":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"GOALZERO","website":"Yes"},"G80":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"GPI","website":"Yes"},"GAR":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"No","vendor":"GARMIN ELEC.","website":"Requires Authorization"},"GLF":{"ecommerce":"Yes","map":"No","marketplace":"Requires Authorization","vendor":"GREAT LAKES LAMINATION","website":"Yes"},"GYH":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"GEN-Y HITCH","website":"Yes"},"H21":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"HUSKY LINER","website":"Requires Authorization"},"H6Z":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"HUGHES AUTO","website":"Yes"},"H77":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"H3R","website":"Yes"},"HUM":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"HUMMINBIRD","website":"Requires Authorization"},"I24":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"INJEN TECHNOLOGY","website":"Requires Authorization"},"I43":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"ICON VEHICLE DYNAMICS","website":"Requires Authorization"},"I9A":{"ecommerce":"Yes","map":"No","marketplace":"Requires Authorization","vendor":"IMMI BOATBUCKLE","website":"Yes"},"ICM":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"ICOM","website":"Yes"},"INR":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"INNO RACKS","website":"Yes"},"J69":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"JABSCO","website":"Requires Authorization"},"J76":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"No","vendor":"JVC","website":"Requires Authorization"},"K23":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"K&N","website":"Requires Authorization"},"K6N":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"KICKER","website":"Requires Authorization"},"K86":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"KLEINN AIR","website":"Yes"},"KDA":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"KENDA","website":"Yes"},"KLY":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"KLYMIT","website":"Yes"},"L6Y":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"LIPPERT COMP","website":"Requires Authorization"},"LGQ":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"LOGIQ","website":"Yes"},"LOK":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"LOKITHOR","website":"Yes"},"LUM":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"LUMISHORE US","website":"Yes"},"M36":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"BETTER BUILT","website":"Yes"},"M6U":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"EVA-DRY","website":"Yes"},"MBA":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"MOB ARMOR","website":"Yes"},"MDW":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"MID WHEELS","website":"Yes"},"MNS":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"MOONSHADE","website":"Yes"},"MON":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"MONTEZUMA","website":"Yes"},"MRM":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"MORIMOTO","website":"Yes"},"MRS":{"ecommerce":"Yes","map":"No","marketplace":"Requires Authorization","vendor":"MULTY RACK SYSTEMS LTD","website":"Yes"},"MTP":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"MASTERTOP","website":"Yes"},"MXN":{"ecommerce":"Yes","map":"No","marketplace":"Requires Authorization","vendor":"MAXON","website":"Yes"},"NOR":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"NORSK","website":"Yes"},"O37":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"ORACLE LIGHT","website":"Yes"},"P44":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"POPNLOCK LLC","website":"Yes"},"P45":{"ecommerce":"Requires Authorization","map":"Yes","marketplace":"Requires Authorization","vendor":"PUTCO","website":"Requires Authorization"},"P71":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"PERTRONIX","website":"Yes"},"P77":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"PACE EDWARDS","website":"Yes"},"PED":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"PEDAL COMMANDER","website":"Yes"},"R2G":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"RIGID INDUSTRIES","website":"Yes"},"R6L":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"ROADMASTER","website":"Yes"},"R90":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"READY LIFT","website":"Yes"},"RCI":{"ecommerce":"Yes","map":"No","marketplace":"Requires Authorization","vendor":"RC INDUSTRIES","website":"Yes"},"RDC":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"REDARC","website":"Yes"},"REN":{"ecommerce":"Yes","map":"No","marketplace":"Requires Authorization","vendor":"RENOGY","website":"Yes"},"RHR":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"RHINO RACK","website":"Yes"},"RPI":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"RPI COMPONENTS INC","website":"Yes"},"S1G":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"SWAGMAN","website":"Yes"},"S2K":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"SEA TECH INC","website":"Yes"},"SCV":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"SEAT COVER SOLUTIONS","website":"Yes"},"SHS":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"SHUTTLESLIDE","website":"Yes"},"SHU":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"SHURHOLD","website":"Yes"},"SNP":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"SNAPPAD","website":"Yes"},"SOL":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"SOLSTICE WATERSPORTS","website":"Yes"},"SST":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"SOFTSTARTRV","website":"Yes"},"SVW":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"SEAVIEW","website":"Yes"},"T1K":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"TIMBREN","website":"Yes"},"T4A":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"TRAILER VALE","website":"Yes"},"T4C":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"TRAIL SPHERE","website":"Yes"},"T64":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"TAYLOR CABLE","website":"Yes"},"T66":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"TRAC RAC","website":"Yes"},"TBD":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"TONNEAU BUDDY","website":"Yes"},"TER":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"TERAFLEX","website":"Yes"},"TES":{"ecommerce":"Yes","map":"No","marketplace":"Requires Authorization","vendor":"TESBROS","website":"Yes"},"TJM":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"TJM OFFROAD","website":"Yes"},"TOW":{"ecommerce":"Yes","map":"No","marketplace":"Requires Authorization","vendor":"TOW FORCE JAMMY","website":"Yes"},"TRP":{"ecommerce":"Yes","map":"No","marketplace":"Requires Authorization","vendor":"TRIPLE-R LIGHTS","website":"Yes"},"TRU":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"TRUCK TROLLEY","website":"Yes"},"TSW":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"TSW ALLOY WHEELS","website":"Yes"},"U12":{"ecommerce":"Yes","map":"No","marketplace":"Requires Authorization","vendor":"ULTRA","website":"Yes"},"W36":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"WARN","website":"Yes"},"W51":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"WEATHERGUARD","website":"Yes"},"WIL":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"WILTON TOOLS","website":"Yes"},"WNJ":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"WIN JET/ATTICA 4X4","website":"Yes"},"WSF":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"WEIGH SAFE","website":"Yes"},"XGC":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"XG CARGO","website":"Yes"},"Y6E":{"ecommerce":"Yes","map":"No","marketplace":"Requires Authorization","vendor":"FLAME KING","website":"Yes"},"ZAR":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"ZARGES","website":"Yes"},"ZRO":{"ecommerce":"Yes","map":"Yes","marketplace":"Requires Authorization","vendor":"ZERO BREEZE","website":"Yes"}}

TRUTHY = {"YES","Y","TRUE","1","APPROVED","PASS"}
MAP_OK = TRUTHY | {"NA","N/A","NOT_APPLICABLE","NOT APPLICABLE"}

def clean(v): return str(v or "").strip()
def upper(v): return clean(v).upper()
def truthy(v): return upper(v) in TRUTHY

def money(v):
    try:
        return float(clean(v).replace("$","").replace(",",""))
    except Exception:
        return 0.0

def boolish(v):
    return upper(v) in {"TRUE","YES","Y","1"}

def load_csv(path):
    if not path.exists(): return []
    with path.open("r",encoding="utf-8-sig",errors="replace",newline="") as f: return list(csv.DictReader(f))

def approvals_by_vcpn():
    out={}
    for row in load_csv(APPROVALS):
        k=clean(row.get("VCPN"))
        if k: out[k]=row
    return out

def parse_env_file(path,env):
    try:
        for line in path.read_text(encoding="utf-8",errors="ignore").splitlines():
            line=line.strip()
            if not line or line.startswith("#") or "=" not in line: continue
            k,v=line.split("=",1); k=k.strip(); v=v.strip().strip('"').strip("'")
            if k in {"KEYSTONE_API_KEY","KEYSTONE_ACCOUNT_NO"} and v and k not in env: env[k]=v
    except Exception: pass

def discover_credentials():
    env=dict(os.environ)
    for p in [ROOT/".env",ROOT/"production/.env",ROOT/"production/site-candidate/.env",Path("/etc/environment"),Path("/home/ubuntu/.profile")]:
        if p.exists(): parse_env_file(p,env)
    if not env.get("KEYSTONE_API_KEY"):
        try:
            for p in Path("/proc").iterdir():
                if not p.name.isdigit(): continue
                try:
                    vals={}
                    for item in (p/"environ").read_bytes().split(b"\0"):
                        if b"=" in item:
                            k,v=item.split(b"=",1); vals[k.decode("utf-8","ignore")]=v.decode("utf-8","ignore")
                    if vals.get("KEYSTONE_API_KEY"):
                        env["KEYSTONE_API_KEY"]=vals["KEYSTONE_API_KEY"]
                        if vals.get("KEYSTONE_ACCOUNT_NO"): env["KEYSTONE_ACCOUNT_NO"]=vals["KEYSTONE_ACCOUNT_NO"]
                        break
                except Exception: continue
        except Exception: pass
    key=clean(env.get("KEYSTONE_API_KEY")); account=clean(env.get("KEYSTONE_ACCOUNT_NO")) or DEFAULT_ACCOUNT
    if not key: raise SystemExit("KEYSTONE_API_KEY not found in shell, known .env files, or running process environment.")
    return key,account

def extract_json_assignment(source,marker):
    pos=source.find(marker)
    if pos<0: raise ValueError(f"marker missing: {marker}")
    start=source.find("{",pos+len(marker))
    if start<0: raise ValueError("object start missing")
    return json.JSONDecoder().raw_decode(source[start:])[0]

def storefront_prices():
    req=urllib.request.Request(STOREFRONT_PRICES,headers={"User-Agent":"Omni-Terrain-Bulk-Audit/1.0","Cache-Control":"no-cache"})
    with urllib.request.urlopen(req,timeout=25) as r: text=r.read().decode("utf-8","replace")
    obj=extract_json_assignment(text,"const PRICES ="); by_id={}
    for slug,row in obj.items():
        if not isinstance(row,dict): continue
        pid=clean(row.get("id")); cents=int(float(row.get("priceCents") or 0))
        if pid and cents>0: by_id[pid]={"price":cents/100.0,"priceCents":cents,"slug":clean(slug),"mpn":clean(row.get("mpn"))}
    return by_id

def soap_quote(key,account,vcpn,zip_code,quantity=1,timeout=25):
    esc=lambda s: html.escape(str(s),quote=False)
    body=f'''<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetShippingOptionsWithQuantity xmlns="http://eKeystone.com"><Key>{esc(key)}</Key><FullAccountNo>{esc(account)}</FullAccountNo><FullPartNo>{esc(vcpn)}</FullPartNo><ToZip>{esc(zip_code)}</ToZip><Quantity>{int(quantity)}</Quantity></GetShippingOptionsWithQuantity></soap:Body></soap:Envelope>'''.encode("utf-8")
    req=urllib.request.Request(SOAP_URL,data=body,headers={"Content-Type":"text/xml; charset=utf-8","SOAPAction":f'"{SOAP_ACTION}"',"User-Agent":"Omni-Terrain-Bulk-Audit/1.0"},method="POST")
    try:
        with urllib.request.urlopen(req,timeout=timeout) as r: raw=r.read()
    except Exception as exc: return {"ok":False,"class":"API_ERROR","message":str(exc)[:220],"rate":0.0,"service":""}
    try: root=ET.fromstring(raw)
    except Exception as exc: return {"ok":False,"class":"PARSE_ERROR","message":str(exc)[:220],"rate":0.0,"service":""}
    def local(tag): return tag.rsplit("}",1)[-1] if "}" in tag else tag
    rate_rows=[]
    for elem in root.iter():
        if local(elem.tag)=="Rates":
            row={local(c.tag):clean(c.text) for c in list(elem)}
            if row: rate_rows.append(row)
    if not rate_rows:
        for elem in root.iter():
            txt=clean(elem.text)
            if "<Rates" in txt or "&lt;Rates" in txt:
                try:
                    nroot=ET.fromstring(html.unescape(txt))
                    for e in nroot.iter():
                        if local(e.tag)=="Rates":
                            row={local(c.tag):clean(c.text) for c in list(e)}
                            if row: rate_rows.append(row)
                except Exception: pass
    if not rate_rows:
        msgs=[clean(e.text) for e in root.iter() if local(e.tag) in {"faultstring","StatusText","Message"} and clean(e.text)]
        return {"ok":False,"class":"NO_RATES","message":" | ".join(msgs)[:220] or "No Rates rows returned","rate":0.0,"service":""}
    errors=[r for r in rate_rows if upper(r.get("ServiceLevel"))=="ERROR"]
    if errors:
        msg=" | ".join(clean(r.get("Name")) for r in errors if clean(r.get("Name")))[:300]; u=upper(msg)
        cls="BLOCKED_PART" if ("BLOCKED PART" in u or "NOT AUTHORIZED" in u) else "OUT_OF_STOCK" if ("INSUFFICIENT QUANTITY" in u or "LACK OF INVENTORY" in u) else "CASE_QTY" if ("MULTIPLES OF" in u or "CASE" in u) else "INVALID_PART" if ("INVALID PART" in u or "PART NUMBER" in u) else "API_REJECT"
        return {"ok":False,"class":cls,"message":msg or "Keystone rejected part","rate":0.0,"service":""}
    options=[]
    for row in rate_rows:
        service=clean(row.get("Description")) or clean(row.get("Name")) or clean(row.get("ServiceLevel")); rate=money(row.get("Rate") or row.get("TotalFreightCharge"))
        if service and rate>=0: options.append((rate,service,row))
    if not options: return {"ok":False,"class":"NO_USABLE_RATE","message":"No usable shipping option","rate":0.0,"service":""}
    ground=[x for x in options if "GROUND" in upper(x[1]) or "UPS" in upper(x[1])]; chosen=min(ground or options,key=lambda x:x[0])
    return {"ok":True,"class":"ORDERABLE","message":"","rate":round(chosen[0],2),"service":chosen[1][:120]}

def classify_policy(row,approval):
    code=clean(row.get("VendorCode")) or clean(row.get("VCPN"))[:3]; p=POLICY.get(code)
    if p:
        website=upper(p.get("website")); mapflag=upper(p.get("map"))
        if website=="NO": return False,"WEBSITE_NO",False,p
        if website=="REQUIRES AUTHORIZATION":
            if not (truthy(approval.get("BrandAuthorized")) and truthy(approval.get("ChannelAuthorized"))): return False,"WEBSITE_AUTH_REQUIRED",False,p
        if mapflag=="YES" and upper(approval.get("MAPVerified")) not in MAP_OK: return False,"MAP_PRICE_REQUIRED",True,p
        return True,"RESTRICTED_SHEET_OK",mapflag=="YES",p
    return True,"NOT_LISTED_RESTRICTED_SHEET",False,None

def row_is_operational(row):
    if money(row.get("NormalizedTotalQty") or row.get("TotalQty"))<=0: return False,"FEED_OUT_OF_STOCK"
    if boolish(row.get("IsHazmat")) or boolish(row.get("IsChemical")): return False,"HAZMAT_OR_CHEMICAL"
    if boolish(row.get("IsNonReturnable")): return False,"SUPPLIER_NONRETURNABLE"
    if int(money(row.get("CaseQty")) or 1)>1: return False,"CASE_QTY_GT_1"
    if money(row.get("Cost"))<=0: return False,"NO_COST"
    return True,""

def audit_one(row,approval,price_info,key,account,zip_code):
    vcpn=clean(row.get("VCPN")); code=clean(row.get("VendorCode")) or vcpn[:3]
    base={"VCPN":vcpn,"VendorCode":code,"VendorName":clean(row.get("VendorName")),"MPN":clean(row.get("ManufacturerPartNo")),"Category":clean(row.get("CategoryInferred")),"FeedStock":clean(row.get("NormalizedTotalQty") or row.get("TotalQty")),"Cost":f"{money(row.get('Cost')):.2f}","DisplayPrice":f"{money(price_info.get('price')):.2f}" if price_info else "","PolicyBasis":"","WebsitePolicy":"","RetailMAP":"","LiveAPI":"","ShippingRate":"","ShippingService":"","PlanningNet":"","Decision":"","Reason":""}
    operational,reason=row_is_operational(row)
    if not operational: base.update({"Decision":"HOLD","Reason":reason}); return base,None
    policy_ok,basis,map_yes,p=classify_policy(row,approval); base["PolicyBasis"]=basis; base["WebsitePolicy"]=clean(p.get("website")) if p else "Not listed in restricted-lines file"; base["RetailMAP"]=clean(p.get("map")) if p else "Not listed"
    if not policy_ok: base.update({"Decision":"HOLD","Reason":basis}); return base,None
    if not price_info or money(price_info.get("price"))<=0: base.update({"Decision":"HOLD","Reason":"NO_STOREFRONT_PRICE"}); return base,None
    q=soap_quote(key,account,vcpn,zip_code,1); base["LiveAPI"]=q["class"]; base["ShippingRate"]=f"{q['rate']:.2f}" if q["ok"] else ""; base["ShippingService"]=q["service"]
    if not q["ok"]: base.update({"Decision":"HOLD","Reason":q["class"]+(": "+q["message"] if q["message"] else "")}); return base,None
    price=money(price_info["price"]); cost=money(row.get("Cost")); freight=max(11.50,q["rate"]) if boolish(row.get("UPSable")) else q["rate"]; net=price-cost-freight-(price*0.06)-0.30; base["PlanningNet"]=f"{net:.2f}"; min_net=max(5.0,price*0.03)
    if net<min_net: base.update({"Decision":"HOLD","Reason":f"LOW_MARGIN_AFTER_FREIGHT<{min_net:.2f}"}); return base,None
    entry={"enabled":True,"authorizationVerified":True,"priceCents":int(price_info["priceCents"]),"shippingIncluded":True,"slug":clean(price_info.get("slug")),"mpn":clean(row.get("ManufacturerPartNo") or price_info.get("mpn")),"authorizationBasis":basis,"liveKeystoneOrderable":True,"shippingQuoteZip":zip_code,"shippingQuoteUSD":round(q["rate"],2),"shippingService":q["service"],"retailMapBasis":"ledger-verified" if map_yes else ("not-listed-restricted-lines" if p is None else "no-retail-map")}
    base.update({"Decision":"ENABLE","Reason":"PASS"}); return base,entry

def write_audit(rows):
    fields=["VCPN","VendorCode","VendorName","MPN","Category","FeedStock","Cost","DisplayPrice","PolicyBasis","WebsitePolicy","RetailMAP","LiveAPI","ShippingRate","ShippingService","PlanningNet","Decision","Reason"]
    with AUDIT_OUT.open("w",encoding="utf-8",newline="") as f: w=csv.DictWriter(f,fieldnames=fields,extrasaction="ignore"); w.writeheader(); w.writerows(rows)

def publish_registry(registry_path):
    source_repo=ROOT/"production/site-candidate"
    if not (source_repo/".git").exists(): raise RuntimeError(f"Git repo not found at {source_repo}")
    remote=subprocess.check_output(["git","-C",str(source_repo),"remote","get-url","origin"],text=True).strip(); tmp=Path(tempfile.mkdtemp(prefix="omni-bulk-live-"))
    try:
        subprocess.run(["git","clone","--depth","1",remote,str(tmp)],check=True,stdout=subprocess.DEVNULL); shutil.copy2(registry_path,tmp/"assets/us-live-products.json"); subprocess.run(["git","-C",str(tmp),"config","user.name","Omni Terrain Ops"],check=True); subprocess.run(["git","-C",str(tmp),"config","user.email","procurement@omni-terrain.com"],check=True); subprocess.run(["git","-C",str(tmp),"add","assets/us-live-products.json"],check=True)
        if subprocess.run(["git","-C",str(tmp),"diff","--cached","--quiet"]).returncode==0: print("PUBLISH = no registry change"); return
        subprocess.run(["git","-C",str(tmp),"commit","-m","Enable bulk Keystone website-orderable checkout products"],check=True,stdout=subprocess.DEVNULL); subprocess.run(["git","-C",str(tmp),"push","origin","HEAD:main"],check=True); print("PUBLISH = pushed to main"); print("COMMIT =",subprocess.check_output(["git","-C",str(tmp),"rev-parse","HEAD"],text=True).strip())
    finally: shutil.rmtree(tmp,ignore_errors=True)

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--zip",default="77001"); ap.add_argument("--workers",type=int,default=8); ap.add_argument("--publish",action="store_true"); args=ap.parse_args()
    rows=load_csv(LAUNCH)
    if not rows: raise SystemExit(f"No launch rows: {LAUNCH}")
    approvals=approvals_by_vcpn(); prices=storefront_prices(); key,account=discover_credentials()
    print("=== OMNI TERRAIN BULK WEBSITE LIVE AUDIT ===",flush=True); print("CATALOGUE =",len(rows),flush=True); print("RESTRICTED POLICY VENDOR CODES =",len(POLICY),flush=True); print("STOREFRONT PRICES =",len(prices),flush=True); print("ACCOUNT =",account,flush=True); print("ZIP =",args.zip,flush=True); print("MODE = full catalogue; no 20/50 pilot",flush=True)
    output=[]; registry={}; start=time.time()
    def job(row):
        v=clean(row.get("VCPN")); return audit_one(row,approvals.get(v,{}),prices.get(v,{}),key,account,args.zip)
    with ThreadPoolExecutor(max_workers=max(1,min(args.workers,12))) as ex:
        futures={ex.submit(job,row):row for row in rows}; done=0
        for fut in as_completed(futures):
            row=futures[fut]
            try: audit,entry=fut.result()
            except Exception as exc:
                v=clean(row.get("VCPN")); audit={"VCPN":v,"VendorCode":clean(row.get("VendorCode")),"VendorName":clean(row.get("VendorName")),"MPN":clean(row.get("ManufacturerPartNo")),"Category":clean(row.get("CategoryInferred")),"FeedStock":clean(row.get("NormalizedTotalQty") or row.get("TotalQty")),"Cost":clean(row.get("Cost")),"DisplayPrice":"","PolicyBasis":"","WebsitePolicy":"","RetailMAP":"","LiveAPI":"EXCEPTION","ShippingRate":"","ShippingService":"","PlanningNet":"","Decision":"HOLD","Reason":str(exc)[:220]}; entry=None
            output.append(audit)
            if entry: registry[audit["VCPN"]]=entry
            done+=1
            if done%100==0 or done==len(rows): print(f"CHECKED {done}/{len(rows)} | ENABLE {len(registry)}",flush=True)
    output.sort(key=lambda r:(r["Decision"]!="ENABLE",r["VendorName"],r["VCPN"])); write_audit(output)
    payload={"checkoutApiBase":"https://omni-terrain-uk-checkout.vercel.app","currency":"USD","generatedBy":"keystone-bulk-live-audit","generatedAtUTC":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),"products":dict(sorted(registry.items()))}; REGISTRY_OUT.write_text(json.dumps(payload,indent=2)+"\n",encoding="utf-8")
    from collections import Counter
    reasons=Counter(r["Reason"].split(":",1)[0] for r in output if r["Decision"]!="ENABLE"); policies=Counter(r["PolicyBasis"] for r in output); categories=Counter(r["Category"] for r in output if r["Decision"]=="ENABLE")
    print("\n=== RESULT ==="); print("CHECKOUT ENABLE CANDIDATES =",len(registry)); print("ENABLE BY CATEGORY =",dict(categories)); print("POLICY MIX =",dict(policies)); print("TOP HOLDS =",reasons.most_common(15)); print("AUDIT =",AUDIT_OUT); print("REGISTRY =",REGISTRY_OUT); print("SECONDS =",round(time.time()-start,1))
    if args.publish:
        if not registry: print("PUBLISH SKIPPED = zero eligible products; existing live registry left untouched"); return
        publish_registry(REGISTRY_OUT); print("NOTE = GitHub Pages must finish publishing before checkout registry becomes live."); print("NOTE = Vercel checkout backend caches the registry for up to 5 minutes.")

if __name__=="__main__": main()
