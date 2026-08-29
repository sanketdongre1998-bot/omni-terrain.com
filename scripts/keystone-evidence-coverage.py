#!/usr/bin/env python3
from __future__ import annotations
import csv, re
from pathlib import Path

ROOT = Path('/home/ubuntu/keystone')
SHORTLIST = ROOT / 'feed' / 'launch_shortlist.csv'
KEYWORDS = ('market','research','margin','shipping','quote','finalist','benchmark','competitor','approval','return')
KEY_FIELDS = ('VCPN','PartNumber','ManufacturerPartNo','MPN','SKU','KeystoneSKU','id')

def clean(v):
    return re.sub(r'[^A-Z0-9]+','',str(v or '').upper())

def read_csv(path):
    try:
        with path.open('r',encoding='utf-8-sig',errors='replace',newline='') as f:
            return list(csv.DictReader(f))
    except Exception:
        return []

def row_ids(row):
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
    wanted=set()
    for r in shortlist:
        wanted |= row_ids(r)
    print('=== OMNI TERRAIN EVIDENCE COVERAGE ===')
    print('SHORTLIST ROWS =', len(shortlist))

    files=[]
    for p in ROOT.rglob('*.csv'):
        if p == SHORTLIST: continue
        try:
            rel=p.relative_to(ROOT)
        except Exception:
            rel=p
        depth=len(rel.parts)
        if depth > 4: continue
        low=p.name.lower()
        if not any(k in low for k in KEYWORDS): continue
        rows=read_csv(p)
        if not rows: continue
        matches=set()
        for r in rows:
            ids=row_ids(r)
            if ids & wanted:
                matches |= (ids & wanted)
        if matches:
            files.append((len(matches), len(rows), str(p)))

    files.sort(reverse=True)
    if not files:
        print('MATCHING EVIDENCE FILES = 0')
        print('No existing market/shipping/research CSV matched shortlist identifiers.')
        return

    print('MATCHING EVIDENCE FILES =', len(files))
    for coverage, rows, path in files[:25]:
        print(f'{coverage:>3}/500 matched | rows {rows:>6} | {path}')

if __name__ == '__main__':
    main()
