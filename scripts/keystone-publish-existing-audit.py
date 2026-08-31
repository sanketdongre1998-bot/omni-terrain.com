#!/usr/bin/env python3
from __future__ import annotations

import csv
import importlib.util
import json
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

ROOT = Path('/home/ubuntu/keystone')
FEED = ROOT / 'feed'
AUDIT = FEED / 'website_bulk_live_audit.csv'
REGISTRY = FEED / 'us-live-products.bulk.json'
STATUS = FEED / 'us-stock-status.json'
BASE = ROOT / 'keystone-bulk-live-audit.py'
SOURCE_REPO = ROOT / 'production/site-candidate'


def load_prices():
    spec = importlib.util.spec_from_file_location('omni_bulk_base_publish', BASE)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.storefront_prices()


def build_status():
    prices = load_prices()
    with AUDIT.open('r', encoding='utf-8-sig', newline='') as f:
        rows = list(csv.DictReader(f))
    products = {}
    counts = {'in_stock': 0, 'out_of_stock': 0, 'review': 0}
    for row in rows:
        vcpn = str(row.get('VCPN') or '').strip()
        if not vcpn:
            continue
        reason = str(row.get('Reason') or '').strip()
        reason_code = reason.split(':', 1)[0].strip().upper()
        decision = str(row.get('Decision') or '').strip().upper()
        price = prices.get(vcpn, {})
        if decision == 'ENABLE':
            status, label, ready = 'in_stock', 'In stock', True
        elif reason_code in {'FEED_OUT_OF_STOCK', 'OUT_OF_STOCK'} or str(row.get('LiveAPI') or '').strip().upper() == 'OUT_OF_STOCK':
            status, label, ready = 'out_of_stock', 'Out of stock', False
        else:
            status, label, ready = 'review', 'Check availability', False
        counts[status] += 1
        products[vcpn] = {
            'status': status,
            'label': label,
            'checkoutReady': ready,
            'slug': str(price.get('slug') or '').strip(),
            'mpn': str(row.get('MPN') or price.get('mpn') or '').strip(),
            'feedStock': str(row.get('FeedStock') or '').strip(),
            'liveApi': str(row.get('LiveAPI') or '').strip(),
            'reason': reason_code,
        }
    payload = {
        'generatedAtUTC': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'source': 'Keystone bulk website live audit',
        'counts': counts,
        'products': dict(sorted(products.items())),
    }
    STATUS.write_text(json.dumps(payload, indent=2) + '\n', encoding='utf-8')
    print('STOCK COUNTS =', counts)


def publish():
    if not AUDIT.exists() or not REGISTRY.exists():
        raise SystemExit('Existing audit/registry files not found; do not rerun unless needed.')
    build_status()
    remote = subprocess.check_output(['git', '-C', str(SOURCE_REPO), 'remote', 'get-url', 'origin'], text=True).strip()
    tmp = Path(tempfile.mkdtemp(prefix='omni-existing-audit-'))
    try:
        subprocess.run(['git', 'clone', '--depth', '1', remote, str(tmp)], check=True)
        shutil.copy2(REGISTRY, tmp / 'assets/us-live-products.json')
        shutil.copy2(STATUS, tmp / 'assets/us-stock-status.json')
        subprocess.run(['git', '-C', str(tmp), 'config', 'user.name', 'Omni Terrain Ops'], check=True)
        subprocess.run(['git', '-C', str(tmp), 'config', 'user.email', 'procurement@omni-terrain.com'], check=True)
        subprocess.run(['git', '-C', str(tmp), 'add', 'assets/us-live-products.json', 'assets/us-stock-status.json'], check=True)
        if subprocess.run(['git', '-C', str(tmp), 'diff', '--cached', '--quiet']).returncode == 0:
            print('PUBLISH = no change')
            return
        subprocess.run(['git', '-C', str(tmp), 'commit', '-m', 'Publish Keystone live checkout and stock status'], check=True)
        subprocess.run(['git', '-C', str(tmp), 'push', 'origin', 'HEAD:main'], check=True)
        print('PUBLISH = pushed to main')
        print('COMMIT =', subprocess.check_output(['git', '-C', str(tmp), 'rev-parse', 'HEAD'], text=True).strip())
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    publish()
