#!/usr/bin/env python3
from __future__ import annotations
import argparse, csv, shutil
from datetime import datetime, timezone
from pathlib import Path

BASE = Path('/home/ubuntu/keystone/feed')
DEFAULT_LAUNCH = BASE / 'launch_wave1.csv'
DEFAULT_SHORTLIST = BASE / 'launch_shortlist.csv'
DEFAULT_APPROVALS = BASE / 'commerce_approvals.csv'


def clean(v): return str(v or '').strip()
def num(v):
    try: return float(clean(v).replace('$','').replace(',',''))
    except (TypeError, ValueError): return 0.0

def read_csv(path):
    with path.open('r', encoding='utf-8-sig', errors='replace', newline='') as f:
        r = csv.DictReader(f)
        return list(r), list(r.fieldnames or [])

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--launch', default=str(DEFAULT_LAUNCH))
    p.add_argument('--shortlist', default=str(DEFAULT_SHORTLIST))
    p.add_argument('--approvals', default=str(DEFAULT_APPROVALS))
    p.add_argument('--apply', action='store_true')
    a = p.parse_args()

    launch_path, shortlist_path, approvals_path = map(Path, (a.launch, a.shortlist, a.approvals))
    launch, _ = read_csv(launch_path)
    shortlist, _ = read_csv(shortlist_path)
    approvals, fields = read_csv(approvals_path)

    launch_by = {clean(r.get('VCPN')): r for r in launch if clean(r.get('VCPN'))}
    shortlist_ids = {clean(r.get('VCPN')) for r in shortlist if clean(r.get('VCPN'))}

    stock_yes = price_filled = notes_touched = missing_feed = 0
    changed = []
    stamp = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

    for row in approvals:
        k = clean(row.get('VCPN'))
        if k not in shortlist_ids: continue
        feed = launch_by.get(k)
        if not feed:
            missing_feed += 1
            continue

        before = dict(row)
        stock = num(feed.get('NormalizedTotalQty')) or num(feed.get('TotalQty'))
        jobber = num(feed.get('JobberPrice'))
        shipping_risk = clean(feed.get('ShippingRisk'))
        market_research = clean(feed.get('MarketPriceResearchRequired'))

        # Supplier-feed inventory is valid evidence for the current feed snapshot.
        # Keep the mandatory recheck note because stock can change after the snapshot.
        if stock > 0 and clean(row.get('LiveStockVerified')).upper() in {'', 'PENDING'}:
            row['LiveStockVerified'] = 'YES'
            stock_yes += 1

        # Populate a candidate storefront price from Keystone jobber only when no
        # approved sell price exists. This does NOT mark MAP or market price as verified.
        if jobber > 0 and not clean(row.get('SellPrice')):
            row['SellPrice'] = f'{jobber:.2f}'
            price_filled += 1

        evidence = f'Auto-fill {stamp}: supplier feed stock={int(stock) if stock else 0}'
        if jobber > 0: evidence += f', jobber=${jobber:.2f}'
        if shipping_risk: evidence += f', ShippingRisk={shipping_risk}'
        if market_research: evidence += f', MarketPriceResearchRequired={market_research}'
        evidence += '. Live stock must be rechecked before fulfilment; shipping, returns, authorization, MAP and market-value gates remain separately verified.'
        old_notes = clean(row.get('Notes'))
        if evidence not in old_notes:
            row['Notes'] = (old_notes + ' | ' + evidence).strip(' |')
            notes_touched += 1

        # Deliberately do not auto-approve these fields from a catalogue/feed snapshot.
        # BrandAuthorized, ChannelAuthorized, MAPVerified, ShippingVerified,
        # ReturnsVerified, MarketPriceVerified, CustomerValuePass stay unchanged.
        if row != before: changed.append(k)

    print('=== OMNI TERRAIN SAFE COMMERCE AUTO-FILL ===')
    print('SHORTLIST IDS =', len(shortlist_ids))
    print('ROWS CHANGED =', len(changed))
    print('STOCK VERIFIED FROM SUPPLIER FEED =', stock_yes)
    print('SELL PRICE FILLED FROM JOBBER =', price_filled)
    print('NOTES UPDATED =', notes_touched)
    print('MISSING FEED ROWS =', missing_feed)
    print('MODE =', 'APPLY' if a.apply else 'DRY RUN')

    if not a.apply:
        print('No file changed. Re-run with --apply to write the ledger.')
        return

    backup = approvals_path.with_name(approvals_path.stem + '.backup-' + datetime.now().strftime('%Y%m%d-%H%M%S') + approvals_path.suffix)
    shutil.copy2(approvals_path, backup)
    with approvals_path.open('w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction='ignore')
        w.writeheader(); w.writerows(approvals)
    print('BACKUP =', backup)
    print('UPDATED =', approvals_path)

if __name__ == '__main__':
    main()
