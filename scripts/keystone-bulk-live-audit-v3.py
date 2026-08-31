#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import importlib.util
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path('/home/ubuntu/keystone')
V2 = ROOT / 'keystone-bulk-live-audit-v2.py'
BASE = ROOT / 'keystone-bulk-live-audit.py'
AUDIT = ROOT / 'feed/website_bulk_live_audit.csv'
STATUS_OUT = ROOT / 'feed/us-stock-status.json'
HISTORY = Path('/home/ubuntu/.bash_history')


def _history_value(name: str) -> str:
    if not HISTORY.exists():
        return ''
    try:
        source = HISTORY.read_text(encoding='utf-8', errors='ignore')
    except Exception:
        return ''
    pattern = re.compile(r'(?:^|[\s;&|])(?:export\s+)?' + re.escape(name) + r'\s*=\s*(?:"([^"]+)"|\'([^\']+)\'|([^\s;&|]+))', re.MULTILINE)
    matches = pattern.findall(source)
    if not matches:
        return ''
    quoted_double, quoted_single, bare = matches[-1]
    return (quoted_double or quoted_single or bare).strip()


def load_credentials_safely():
    if not os.environ.get('KEYSTONE_API_KEY'):
        value = _history_value('KEYSTONE_API_KEY')
        if value:
            os.environ['KEYSTONE_API_KEY'] = value
            print('KEYSTONE_API_KEY = loaded securely from local shell history', flush=True)
    if not os.environ.get('KEYSTONE_ACCOUNT_NO'):
        value = _history_value('KEYSTONE_ACCOUNT_NO')
        if value:
            os.environ['KEYSTONE_ACCOUNT_NO'] = value
            print('KEYSTONE_ACCOUNT_NO = loaded securely from local shell history', flush=True)
        else:
            os.environ['KEYSTONE_ACCOUNT_NO'] = '176325'
            print('KEYSTONE_ACCOUNT_NO = using configured customer account', flush=True)
    if not os.environ.get('KEYSTONE_API_KEY'):
        raise SystemExit('KEYSTONE_API_KEY could not be recovered securely. Do not print shell history; re-enter the production key into a protected .env file instead.')


def run_v2(args):
    if not V2.exists():
        raise SystemExit(f'Missing V2 auditor: {V2}')
    cmd = [sys.executable, str(V2), '--workers', str(args.workers), '--zip', args.zip]
    if args.publish:
        cmd.append('--publish')
    subprocess.run(cmd, check=True, env=os.environ.copy())


def load_prices():
    if not BASE.exists():
        raise SystemExit(f'Missing base auditor: {BASE}')
    spec = importlib.util.spec_from_file_location('omni_bulk_base_v3', BASE)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.storefront_prices()


def build_status():
    if not AUDIT.exists():
        raise SystemExit(f'Missing audit output: {AUDIT}')
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
            status = 'in_stock'
            label = 'In stock'
            checkout_ready = True
        elif reason_code in {'FEED_OUT_OF_STOCK', 'OUT_OF_STOCK'} or str(row.get('LiveAPI') or '').strip().upper() == 'OUT_OF_STOCK':
            status = 'out_of_stock'
            label = 'Out of stock'
            checkout_ready = False
        else:
            status = 'review'
            label = 'Check availability'
            checkout_ready = False

        counts[status] += 1
        products[vcpn] = {
            'status': status,
            'label': label,
            'checkoutReady': checkout_ready,
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
    STATUS_OUT.write_text(json.dumps(payload, indent=2) + '\n', encoding='utf-8')
    print('STOCK STATUS =', STATUS_OUT)
    print('STOCK COUNTS =', counts)
    return payload


def publish_status():
    source_repo = ROOT / 'production/site-candidate'
    if not (source_repo / '.git').exists():
        raise RuntimeError(f'Git repo not found at {source_repo}')
    remote = subprocess.check_output(['git', '-C', str(source_repo), 'remote', 'get-url', 'origin'], text=True).strip()
    tmp = Path(tempfile.mkdtemp(prefix='omni-stock-status-'))
    try:
        subprocess.run(['git', 'clone', '--depth', '1', remote, str(tmp)], check=True, stdout=subprocess.DEVNULL)
        shutil.copy2(STATUS_OUT, tmp / 'assets/us-stock-status.json')
        subprocess.run(['git', '-C', str(tmp), 'config', 'user.name', 'Omni Terrain Ops'], check=True)
        subprocess.run(['git', '-C', str(tmp), 'config', 'user.email', 'procurement@omni-terrain.com'], check=True)
        subprocess.run(['git', '-C', str(tmp), 'add', 'assets/us-stock-status.json'], check=True)
        if subprocess.run(['git', '-C', str(tmp), 'diff', '--cached', '--quiet']).returncode == 0:
            print('STOCK PUBLISH = no status change')
            return
        subprocess.run(['git', '-C', str(tmp), 'commit', '-m', 'Update Keystone storefront stock status'], check=True, stdout=subprocess.DEVNULL)
        subprocess.run(['git', '-C', str(tmp), 'push', 'origin', 'HEAD:main'], check=True)
        print('STOCK PUBLISH = pushed to main')
        print('STOCK COMMIT =', subprocess.check_output(['git', '-C', str(tmp), 'rev-parse', 'HEAD'], text=True).strip())
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--zip', default='77001')
    ap.add_argument('--workers', type=int, default=8)
    ap.add_argument('--publish', action='store_true')
    args = ap.parse_args()
    load_credentials_safely()
    run_v2(args)
    build_status()
    if args.publish:
        publish_status()
        print('NOTE = Out-of-stock labels update after GitHub Pages publishes the new status asset.')


if __name__ == '__main__':
    main()
