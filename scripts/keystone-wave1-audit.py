#!/usr/bin/env python3
"""Audit Omni Terrain Keystone launch_wave1.csv before content mapping / storefront generation.

Reports category, fitment, shipping, cost bands, brand concentration and basic data hygiene.
This is a catalogue quality audit only; it does not approve MAP/content rights or market economics.
"""
from __future__ import annotations

import csv
from collections import Counter
from pathlib import Path

SOURCE = Path('/home/ubuntu/keystone/feed/launch_wave1.csv')


def n(v, default=0.0):
    try:
        return float(str(v or '').replace(',', '').replace('$', '').strip() or default)
    except ValueError:
        return default


def cost_band(cost):
    if cost < 25: return '<$25'
    if cost < 50: return '$25-49'
    if cost < 100: return '$50-99'
    if cost < 150: return '$100-149'
    if cost < 200: return '$150-199'
    if cost < 250: return '$200-249'
    return '$250+'


def pct(part, total):
    return round((part / total * 100), 1) if total else 0


def main():
    if not SOURCE.exists():
        raise SystemExit(f'Input not found: {SOURCE}')

    cats = Counter(); fits = Counter(); ships = Counter(); bands = Counter(); brands = Counter(); paid = Counter()
    mpns = Counter(); vcpns = Counter()
    total = 0; stock_sum = 0.0; wh_sum = 0.0; cost_sum = 0.0
    low_stock = 0; one_wh = 0; missing_mpn = 0; missing_upc = 0

    with SOURCE.open('r', encoding='utf-8-sig', errors='replace', newline='') as f:
        for r in csv.DictReader(f):
            total += 1
            cat = r.get('CategoryInferred', ''); fit = r.get('FitmentRisk', ''); ship = r.get('ShippingRisk', '')
            cost = n(r.get('Cost')); stock = n(r.get('NormalizedTotalQty')); wh = n(r.get('WarehouseCount'))
            brand = (r.get('VendorName') or 'UNKNOWN').strip()
            mpn = (r.get('ManufacturerPartNo') or '').strip(); vcpn = (r.get('VCPN') or '').strip()
            cats[cat] += 1; fits[fit] += 1; ships[ship] += 1; bands[cost_band(cost)] += 1; brands[brand] += 1
            paid[r.get('PaidResearchBand','')] += 1
            if mpn: mpns[mpn] += 1
            else: missing_mpn += 1
            if vcpn: vcpns[vcpn] += 1
            if not (r.get('UPCCode') or '').strip(): missing_upc += 1
            stock_sum += stock; wh_sum += wh; cost_sum += cost
            if stock < 30: low_stock += 1
            if wh < 2: one_wh += 1

    dup_mpn = sum(1 for _, c in mpns.items() if c > 1)
    dup_vcpn = sum(1 for _, c in vcpns.items() if c > 1)
    top10 = brands.most_common(10)
    top10_count = sum(c for _, c in top10)

    print(f'WAVE1 ROWS = {total:,}')
    print('CATEGORY =', dict(cats))
    print('FITMENT =', dict(fits))
    print('SHIPPING =', dict(ships))
    print('COST BANDS =', dict(bands))
    print('PAID RESEARCH =', dict(paid))
    print(f'AVG COST = ${cost_sum/total:.2f}' if total else 'AVG COST = n/a')
    print(f'AVG STOCK = {stock_sum/total:.1f}' if total else 'AVG STOCK = n/a')
    print(f'AVG WAREHOUSES = {wh_sum/total:.2f}' if total else 'AVG WAREHOUSES = n/a')
    print(f'LOW STOCK <30 = {low_stock} ({pct(low_stock,total)}%)')
    print(f'<2 WAREHOUSES = {one_wh} ({pct(one_wh,total)}%)')
    print(f'MISSING MPN = {missing_mpn}')
    print(f'MISSING UPC = {missing_upc}')
    print(f'DUPLICATE MPN VALUES = {dup_mpn}')
    print(f'DUPLICATE VCPN VALUES = {dup_vcpn}')
    print(f'TOP-10 BRAND SHARE = {top10_count} ({pct(top10_count,total)}%)')
    print('\nTOP 20 BRANDS')
    for brand, count in brands.most_common(20):
        print(f'{brand} | {count} | {pct(count,total)}%')

if __name__ == '__main__':
    main()
