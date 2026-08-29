#!/usr/bin/env python3
from __future__ import annotations
import csv, re
from collections import defaultdict
from pathlib import Path

ROOT = Path('/home/ubuntu/keystone')
SHORTLIST = ROOT / 'feed' / 'launch_shortlist.csv'
KEYWORDS = ('market','research','margin','shipping','quote','finalist','benchmark','competitor','return')
KEY_FIELDS = ('VCPN','PartNumber','ManufacturerPartNo','MPN','SKU','KeystoneSKU','id')
EVIDENCE_WORDS = ('ship','delivered','competitor','market','price','margin','return','map','author','channel','quote','research','source','status','winner','decision')

def clean(v):
    return re.sub(r'[^A-Z0-9]+','',str(v or '').upper())

def read_csv(path):
    try:
        with path.open('r',encoding='utf-8-sig',errors='replace',newline='') as f:
            return list(csv.DictReader(f))
    except Exception:
        return []

def row_tokens(row):
    out=set()
    for k in KEY_FIELDS:
        if k in row:
            v=clean(row.get(k))
            if v: out.add(v)
    return out

def main():
    shortlist=read_csv(SHORTLIST)
    if not shortlist:
        raise SystemExit(f'No shortlist found: {SHORTLIST}')

    token_to_vcpn=defaultdict(set)
    shortlist_vcpns=[]
    for r in shortlist:
        vcpn=clean(r.get('VCPN'))
        if not vcpn: continue
        shortlist_vcpns.append(vcpn)
        for token in row_tokens(r):
            token_to_vcpn[token].add(vcpn)

    wanted=set(shortlist_vcpns)
    print('=== OMNI TERRAIN EVIDENCE COVERAGE V2 ===')
    print('SHORTLIST UNIQUE VCPN =', len(wanted))

    files=[]
    for p in ROOT.rglob('*.csv'):
        if p == SHORTLIST: continue
        try:
            rel=p.relative_to(ROOT)
        except Exception:
            rel=p
        if len(rel.parts) > 4: continue
        low=p.name.lower()
        if 'commerce_approvals' in low or 'launch_shortlist' in low:
            continue
        if not any(k in low for k in KEYWORDS): continue
        rows=read_csv(p)
        if not rows: continue

        matched_vcpns=set()
        for r in rows:
            for token in row_tokens(r):
                matched_vcpns.update(token_to_vcpn.get(token, ()))
        matched_vcpns &= wanted
        if not matched_vcpns: continue

        fields=list(rows[0].keys()) if rows else []
        evidence_fields=[f for f in fields if any(w in f.lower() for w in EVIDENCE_WORDS)]
        files.append((len(matched_vcpns),len(rows),str(p),evidence_fields[:14]))

    files.sort(key=lambda x:(x[0],x[1]), reverse=True)
    print('MATCHING EVIDENCE FILES =', len(files))
    for coverage, rows, path, fields in files[:25]:
        print(f'{coverage:>3}/{len(wanted)} VCPNs | rows {rows:>6} | {path}')
        if fields:
            print('    fields:', ', '.join(fields))

    if not files:
        print('No matching market/shipping/research CSV found.')

if __name__ == '__main__':
    main()
