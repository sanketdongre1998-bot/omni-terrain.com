#!/usr/bin/env python3
"""Quote Keystone drop-ship freight without exposing credentials.

Uses Keystone's WSElectronicOrder/GetShippingOptionsWithQuantity SOAP method.
Credentials are read only from environment variables and are never printed.
This tool does not place orders.
"""
from __future__ import annotations

import argparse
import csv
import os
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from html import escape

ENDPOINT = "https://order.ekeystone.com/WSElectronicOrder/ElectronicOrder.asmx"
SOAP_ACTION = "http://eKeystone.com/GetShippingOptionsWithQuantity"
DEFAULT_ZIPS = ["10001", "30301", "60601", "75201", "90001", "98101"]
FINALISTS = [
    "B701060602",      # BD Diesel 1060602
    "F37FTL5607",     # Fabtech FTL5607
    "P44PL8547TUN",   # Pop & Lock PL8547TUN
    "P4592852",       # Putco 92852
    "P45950001",      # Putco 950001
    "T8SF20LL3",      # Suspension Pro F20LL3
    "T8WW865001S",    # TrailFX W865001S
]


def local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def money(v: str | None) -> float | None:
    if v is None:
        return None
    try:
        return float(str(v).strip().replace("$", "").replace(",", ""))
    except ValueError:
        return None


def soap_envelope(key: str, account: str, part: str, zipcode: str, qty: int) -> bytes:
    body = f'''<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetShippingOptionsWithQuantity xmlns="http://eKeystone.com">
      <Key>{escape(key)}</Key>
      <FullAccountNo>{escape(account)}</FullAccountNo>
      <FullPartNo>{escape(part)}</FullPartNo>
      <ToZip>{escape(zipcode)}</ToZip>
      <Quantity>{qty}</Quantity>
    </GetShippingOptionsWithQuantity>
  </soap:Body>
</soap:Envelope>'''
    return body.encode("utf-8")


def parse_options(xml_bytes: bytes) -> list[dict[str, str]]:
    root = ET.fromstring(xml_bytes)
    for elem in root.iter():
        if local(elem.tag).lower() in {"faultstring", "message", "error"}:
            txt = (elem.text or "").strip()
            if txt and "error" in txt.lower():
                raise RuntimeError(txt)

    options: list[dict[str, str]] = []
    seen: set[tuple[str, str, str, str]] = set()
    for parent in root.iter():
        row: dict[str, str] = {}
        for child in list(parent):
            name = local(child.tag)
            text = (child.text or "").strip()
            if text:
                row[name] = text
        lower = {k.lower(): v for k, v in row.items()}
        if "rate" not in lower:
            continue
        if not any(k in lower for k in ("servicelevel", "name", "warehouses", "additionalfees", "additionalfee")):
            continue
        normalized = {
            "ServiceLevel": lower.get("servicelevel", ""),
            "Name": lower.get("name", ""),
            "Rate": lower.get("rate", ""),
            "AdditionalFees": lower.get("additionalfees", lower.get("additionalfee", "")),
            "Warehouses": lower.get("warehouses", ""),
            "Backordered": lower.get("backordered", ""),
            "Cancelled": lower.get("cancelled", ""),
        }
        key = (normalized["ServiceLevel"], normalized["Name"], normalized["Rate"], normalized["Warehouses"])
        if key not in seen:
            options.append(normalized)
            seen.add(key)
    return options


def quote(key: str, account: str, part: str, zipcode: str, qty: int, timeout: int) -> list[dict[str, str]]:
    req = urllib.request.Request(
        ENDPOINT,
        data=soap_envelope(key, account, part, zipcode, qty),
        headers={
            "Content-Type": "text/xml; charset=utf-8",
            "SOAPAction": SOAP_ACTION,
            "User-Agent": "Omni-Terrain-Keystone-Quote/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return parse_options(resp.read())
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")[:800]
        raise RuntimeError(f"HTTP {e.code}: {detail}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"Network error: {e.reason}") from e


def cheapest(options: list[dict[str, str]]) -> dict[str, str] | None:
    priced = []
    for o in options:
        rate = money(o.get("Rate"))
        fee = money(o.get("AdditionalFees")) or 0.0
        if rate is not None:
            priced.append((rate + fee, o))
    return min(priced, key=lambda x: x[0])[1] if priced else None


def self_test() -> None:
    sample = b'''<?xml version="1.0"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><R><NewDataSet><Shipping><ServiceLevel>GND</ServiceLevel><Name>Ground</Name><Rate>12.34</Rate><Warehouses>EAST,1</Warehouses><AdditionalFees>1.00</AdditionalFees></Shipping><Shipping><ServiceLevel>2DY</ServiceLevel><Name>2 Day</Name><Rate>29.99</Rate><Warehouses>EAST,1</Warehouses><AdditionalFees>0.00</AdditionalFees></Shipping></NewDataSet></R></soap:Body></soap:Envelope>'''
    opts = parse_options(sample)
    assert len(opts) == 2
    assert cheapest(opts)["ServiceLevel"] == "GND"
    print("SELF TEST PASSED = 1")


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--part", action="append", dest="parts", help="Full Keystone part number/VCPN; repeatable")
    p.add_argument("--finalists", action="store_true", help="Quote the seven Omni Terrain finalist VCPNs")
    p.add_argument("--zip", action="append", dest="zips", help="US destination ZIP; repeatable")
    p.add_argument("--qty", type=int, default=1)
    p.add_argument("--timeout", type=int, default=30)
    p.add_argument("--csv", dest="csv_path")
    p.add_argument("--check-config", action="store_true")
    p.add_argument("--self-test", action="store_true")
    a = p.parse_args()

    if a.self_test:
        self_test(); return 0

    key = os.environ.get("KEYSTONE_API_KEY", "").strip()
    account = os.environ.get("KEYSTONE_ACCOUNT_NO", "").strip()
    if a.check_config:
        print("KEYSTONE_API_KEY =", "SET" if key else "MISSING")
        print("KEYSTONE_ACCOUNT_NO =", "SET" if account else "MISSING")
        return 0 if key and account else 2
    if not key or not account:
        print("ERROR: set KEYSTONE_API_KEY and KEYSTONE_ACCOUNT_NO in the shell/environment. Values are never printed.", file=sys.stderr)
        return 2

    parts = list(a.parts or [])
    if a.finalists:
        parts.extend(FINALISTS)
    parts = list(dict.fromkeys(x.strip() for x in parts if x and x.strip()))
    if not parts:
        p.error("use --part VCPN (repeatable) or --finalists")
    zips = list(dict.fromkeys(a.zips or DEFAULT_ZIPS))

    records: list[dict[str, str]] = []
    print("=== Omni Terrain KEYSTONE LIVE SHIPPING QUOTES ===")
    print("PARTS =", len(parts), "| ZIPS =", ",".join(zips), "| QTY =", a.qty)
    print("Credentials: loaded from environment and redacted")

    for part in parts:
        best_totals: list[float] = []
        print("\n" + "=" * 78)
        print(part)
        for zipcode in zips:
            try:
                opts = quote(key, account, part, zipcode, a.qty, a.timeout)
                best = cheapest(opts)
                if not best:
                    print(f"{zipcode} | NO PRICED SHIPPING OPTION")
                    records.append({"Part": part, "Zip": zipcode, "Status": "NO_OPTION"})
                    continue
                rate = money(best.get("Rate")) or 0.0
                fees = money(best.get("AdditionalFees")) or 0.0
                total = rate + fees
                best_totals.append(total)
                print(f"{zipcode} | {best.get('ServiceLevel','')} | {best.get('Name','')} | Rate=${rate:.2f} | Fees=${fees:.2f} | Total=${total:.2f} | WH={best.get('Warehouses','')}")
                records.append({
                    "Part": part, "Zip": zipcode, "Status": "OK",
                    "ServiceLevel": best.get("ServiceLevel", ""), "Name": best.get("Name", ""),
                    "Rate": f"{rate:.2f}", "AdditionalFees": f"{fees:.2f}", "Total": f"{total:.2f}",
                    "Warehouses": best.get("Warehouses", ""), "Backordered": best.get("Backordered", ""),
                    "Cancelled": best.get("Cancelled", ""),
                })
            except Exception as e:
                print(f"{zipcode} | ERROR | {e}")
                records.append({"Part": part, "Zip": zipcode, "Status": "ERROR", "Error": str(e)[:500]})
        if best_totals:
            print(f"SUMMARY | cheapest-zone=${min(best_totals):.2f} | median-ish=${sorted(best_totals)[len(best_totals)//2]:.2f} | worst-zone=${max(best_totals):.2f}")

    if a.csv_path:
        fields = ["Part","Zip","Status","ServiceLevel","Name","Rate","AdditionalFees","Total","Warehouses","Backordered","Cancelled","Error"]
        with open(a.csv_path, "w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
            w.writeheader(); w.writerows(records)
        print("\nCSV =", a.csv_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
