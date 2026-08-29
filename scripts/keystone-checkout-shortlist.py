#!/usr/bin/env python3
from __future__ import annotations
import argparse, csv, json, math
from collections import defaultdict
from pathlib import Path

BASE = Path('/home/ubuntu/keystone/feed')
DEFAULT_LAUNCH = BASE / 'launch_wave1.csv'
DEFAULT_APPROVALS = BASE / 'commerce_approvals.csv'
DEFAULT_OUT = BASE / 'launch_shortlist.csv'
DEFAULT_SUMMARY = BASE / 'launch_shortlist_summary.json'

LIVE_FIRST = {'F37FTL5607','P4592852','P45950001','P44PL8547TUN','T8WW865001S'}
TRUTHY = {'YES','Y','TRUE','1','APPROVED','PASS'}
MAP_OK = TRUTHY | {'NA','N/A','NOT_APPLICABLE','NOT APPLICABLE'}
# Keep a broad, store-sized checkout candidate pool while preserving the
# storefront's category mix: ~65% Auto, 25% Marine, 10% RV.
QUOTAS = {'AUTO':195,'MARINE':75,'RV':30}


def clean(v): return str(v or '').strip()
def upper(v): return clean(v).upper()
def yes(v): return upper(v) in TRUTHY
def map_ok(v): return upper(v) in MAP_OK

def num(v):
    try: return float(clean(v).replace('$','').replace(',',''))
    except (TypeError, ValueError): return 0.0

def first_num(row, *keys):
    for k in keys:
        x = num(row.get(k))
        if x > 0: return x
    return 0.0

def first_text(row, *keys):
    for k in keys:
        x = clean(row.get(k))
        if x: return x
    return ''

def key(row):
    return first_text(row, 'VCPN','PartNumber','id','SKU','KeystoneSKU')

def read_csv(path):
    if not path.exists(): return []
    with path.open('r', encoding='utf-8-sig', errors='replace', newline='') as f:
        return list(csv.DictReader(f))

def checkout_gate(a):
    checks = [
        (yes(a.get('BrandAuthorized')), 'brand'),
        (yes(a.get('ChannelAuthorized')), 'channel'),
        (map_ok(a.get('MAPVerified')), 'map'),
        (yes(a.get('LiveStockVerified')), 'stock'),
        (yes(a.get('ShippingVerified')), 'shipping'),
        (yes(a.get('ReturnsVerified')), 'returns'),
        (yes(a.get('MarketPriceVerified')), 'market-price'),
        (yes(a.get('CustomerValuePass')), 'customer-value'),
        (num(a.get('SellPrice')) > 0, 'sell-price'),
    ]
    failed = [name for ok, name in checks if not ok]
    return not failed, failed

def score_row(feed, approval):
    cat = upper(feed.get('CategoryInferred'))
    stock = first_num(feed, 'NormalizedTotalQty','TotalQty','Stock','QtyAvailable','Quantity')
    wh = first_num(feed, 'WarehouseCount','WH','Warehouses')
    cost = first_num(feed, 'Cost','DealerCost','NetCost')
    sell = first_num(approval, 'SellPrice') or first_num(feed, 'JobberPrice','MAPPrice','MapPrice','RetailPrice','MSRP')
    ship = first_num(approval, 'SupplierShippingCost')
    spread = sell - cost - ship if sell and cost else 0.0
    margin_pct = (spread / sell * 100.0) if sell > 0 else 0.0
    title = first_text(approval, 'ProductTitle') or first_text(feed, 'ProductTitle','Description','PartDescription')
    brand = first_text(feed, 'VendorName','Brand','Manufacturer')
    mpn = first_text(feed, 'ManufacturerPartNo','MPN','PartNumber')
    gate, failed = checkout_gate(approval)

    score = 0.0
    reasons = []
    if gate: score += 100; reasons.append('checkout-gate-pass')
    approval_points = [
        ('BrandAuthorized',10),('ChannelAuthorized',10),('LiveStockVerified',8),
        ('ShippingVerified',8),('ReturnsVerified',6),('MarketPriceVerified',8),('CustomerValuePass',8)
    ]
    for fld, pts in approval_points:
        if yes(approval.get(fld)): score += pts
    if map_ok(approval.get('MAPVerified')): score += 5
    if yes(approval.get('ContentRights')): score += 4

    if stock >= 100: score += 20; reasons.append('stock-100+')
    elif stock >= 30: score += 15; reasons.append('stock-30+')
    elif stock >= 10: score += 8; reasons.append('stock-10+')
    elif stock > 0: score += 2
    else: score -= 25; reasons.append('no-stock-signal')

    if wh >= 5: score += 12; reasons.append('5+-warehouses')
    elif wh >= 3: score += 8
    elif wh >= 2: score += 4

    if 89 <= sell <= 250: score += 20; reasons.append('ideal-ticket')
    elif 75 <= sell <= 350: score += 10
    elif sell > 0: score -= 8
    else: score -= 20; reasons.append('no-sale-price')

    if spread >= 70: score += 22; reasons.append('spread-70+')
    elif spread >= 45: score += 16; reasons.append('spread-45+')
    elif spread >= 30: score += 10
    elif spread >= 20: score += 4
    elif spread < 10 and sell > 0 and cost > 0: score -= 18; reasons.append('thin-spread')

    if margin_pct >= 35: score += 8
    elif margin_pct >= 25: score += 5

    if upper(feed.get('LaunchStatus')) in {'PUBLISH_CANDIDATE','KEEP','WINNER','PASS'}:
        score += 8; reasons.append('launch-candidate')
    if upper(feed.get('LiveAPIRecheckBeforeSale')) in TRUTHY:
        score += 2

    low = f'{title} {brand}'.lower()
    risky_words = ('aerosol','chemical','hazmat','fuel additive','paint','battery acid')
    if any(w in low for w in risky_words): score -= 80; reasons.append('hazmat-risk')

    weight = first_num(feed, 'Weight','ShippingWeight','WeightLb','WeightLbs')
    if weight > 50: score -= 30; reasons.append('heavy-50lb+')
    elif weight > 30: score -= 12; reasons.append('heavy-30lb+')

    if key(feed) in LIVE_FIRST:
        score += 200; reasons.insert(0,'current-live-launch')

    return {
        'VCPN': key(feed), 'CategoryInferred': cat, 'VendorName': brand,
        'ManufacturerPartNo': mpn, 'ProductTitle': title,
        'Cost': f'{cost:.2f}' if cost else '', 'CandidateSellPrice': f'{sell:.2f}' if sell else '',
        'Stock': str(int(stock)) if stock else '', 'WarehouseCount': str(int(wh)) if wh else '',
        'EstimatedSpreadBeforeFees': f'{spread:.2f}' if sell and cost else '',
        'EstimatedGrossMarginPct': f'{margin_pct:.1f}' if sell and cost else '',
        'CheckoutGatePass': 'YES' if gate else 'NO',
        'GateMissing': ';'.join(failed), 'Score': f'{score:.1f}',
        'ShortlistReasons': ';'.join(reasons),
    }

def choose(rows, target):
    by_cat = defaultdict(list)
    for r in rows:
        if r['CategoryInferred'] in QUOTAS: by_cat[r['CategoryInferred']].append(r)
    for cat in by_cat:
        by_cat[cat].sort(key=lambda r: float(r['Score']), reverse=True)

    chosen, seen = [], set()
    # Always keep existing live launch products if present.
    for r in sorted(rows, key=lambda r: (r['VCPN'] not in LIVE_FIRST, -float(r['Score']))):
        if r['VCPN'] in LIVE_FIRST and r['VCPN'] not in seen:
            chosen.append(r); seen.add(r['VCPN'])

    # Scale the category targets if --target differs from the default 300.
    quota_total = sum(QUOTAS.values())
    scaled = {cat: max(1, round(target * quota / quota_total)) for cat, quota in QUOTAS.items()}
    # Correct rounding so the scaled quotas sum exactly to target.
    while sum(scaled.values()) > target:
        cat = max(scaled, key=scaled.get)
        if scaled[cat] > 1: scaled[cat] -= 1
        else: break
    while sum(scaled.values()) < target:
        cat = max(QUOTAS, key=lambda c: QUOTAS[c] / max(1, scaled[c]))
        scaled[cat] += 1

    for cat, quota in scaled.items():
        have = sum(1 for r in chosen if r['CategoryInferred'] == cat)
        for r in by_cat.get(cat, []):
            if have >= quota: break
            if r['VCPN'] in seen: continue
            chosen.append(r); seen.add(r['VCPN']); have += 1

    if len(chosen) < target:
        for r in sorted(rows, key=lambda r: float(r['Score']), reverse=True):
            if r['VCPN'] in seen: continue
            chosen.append(r); seen.add(r['VCPN'])
            if len(chosen) >= target: break

    chosen = chosen[:target]
    chosen.sort(key=lambda r: (r['CheckoutGatePass'] != 'YES', -float(r['Score'])))
    for i, r in enumerate(chosen, 1): r['ShortlistRank'] = str(i)
    return chosen

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--launch', default=str(DEFAULT_LAUNCH))
    p.add_argument('--approvals', default=str(DEFAULT_APPROVALS))
    p.add_argument('--out', default=str(DEFAULT_OUT))
    p.add_argument('--summary', default=str(DEFAULT_SUMMARY))
    p.add_argument('--target', type=int, default=300)
    a = p.parse_args()

    launch = read_csv(Path(a.launch))
    if not launch: raise SystemExit(f'No launch feed found: {a.launch}')
    approvals = {clean(r.get('VCPN')): r for r in read_csv(Path(a.approvals)) if clean(r.get('VCPN'))}

    ranked = [score_row(feed, approvals.get(key(feed), {})) for feed in launch if key(feed)]
    chosen = choose(ranked, max(5, min(a.target, len(ranked))))

    fields = ['ShortlistRank','VCPN','CategoryInferred','VendorName','ManufacturerPartNo','ProductTitle',
              'Cost','CandidateSellPrice','Stock','WarehouseCount','EstimatedSpreadBeforeFees',
              'EstimatedGrossMarginPct','CheckoutGatePass','GateMissing','Score','ShortlistReasons']
    out = Path(a.out); out.parent.mkdir(parents=True, exist_ok=True)
    with out.open('w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader(); w.writerows(chosen)

    summary = {
        'source_rows': len(ranked), 'shortlist_rows': len(chosen),
        'categories': {cat: sum(1 for r in chosen if r['CategoryInferred']==cat) for cat in QUOTAS},
        'checkout_gate_pass_now': sum(1 for r in chosen if r['CheckoutGatePass']=='YES'),
        'current_live_ids_found': sorted([r['VCPN'] for r in chosen if r['VCPN'] in LIVE_FIRST]),
        'output': str(out),
    }
    Path(a.summary).write_text(json.dumps(summary, indent=2), encoding='utf-8')
    print('=== OMNI TERRAIN CHECKOUT SHORTLIST ===')
    print('SOURCE =', len(ranked))
    print('SHORTLIST =', len(chosen))
    print('CATEGORY =', summary['categories'])
    print('CHECKOUT GATE PASS NOW =', summary['checkout_gate_pass_now'])
    print('LIVE FOUND =', ', '.join(summary['current_live_ids_found']) or 'none')
    print('OUTPUT =', out)
    print('\nTOP 15')
    for r in chosen[:15]:
        print(f"#{r['ShortlistRank']} | {r['VCPN']} | {r['VendorName']} | {r['ManufacturerPartNo']} | ${r['CandidateSellPrice'] or '0'} | stock {r['Stock'] or '0'} | gate {r['CheckoutGatePass']} | score {r['Score']}")

if __name__ == '__main__':
    main()
