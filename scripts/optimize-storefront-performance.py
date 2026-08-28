#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS = '<link rel="stylesheet" href="assets/storefront-performance.css">'
JS = '<script defer src="assets/storefront-performance.js"></script>'
PRECONNECT = '<link rel="preconnect" href="https://vehiclepartimages.com" crossorigin><link rel="dns-prefetch" href="//vehiclepartimages.com">'

IMG_RE = re.compile(r'<img\b[^>]*>', re.I)
ATTR_RE = lambda name: re.compile(rf'\s{name}\s*=\s*(["\']).*?\1', re.I | re.S)


def set_attr(tag: str, name: str, value: str) -> str:
    tag = ATTR_RE(name).sub('', tag)
    return tag[:-1].rstrip() + f' {name}="{value}">'


def resize_vehicle_image(tag: str, priority: bool) -> str:
    if 'vehiclepartimages.com' not in tag.lower():
        return tag
    max_h, max_w = (820, 1080) if priority else (440, 620)
    tag = re.sub(r'maxheight=\d+', f'maxheight={max_h}', tag, flags=re.I)
    tag = re.sub(r'maxwidth=\d+', f'maxwidth={max_w}', tag, flags=re.I)
    return tag


def tune_images(text: str) -> str:
    index = 0
    def repl(match: re.Match[str]) -> str:
        nonlocal index
        tag = match.group(0)
        priority = index == 0 or bool(re.search(r'(hero|product-visual|gallery-main)', tag, re.I))
        index += 1
        tag = set_attr(tag, 'decoding', 'async')
        tag = set_attr(tag, 'loading', 'eager' if priority else 'lazy')
        tag = set_attr(tag, 'fetchpriority', 'high' if priority else 'low')
        return resize_vehicle_image(tag, priority)
    return IMG_RE.sub(repl, text)


def optimize(path: Path) -> bool:
    text = path.read_text(encoding='utf-8')
    original = text

    if 'assets/storefront-performance.css' not in text:
        text = text.replace('</head>', CSS + '</head>', 1)
    if 'vehiclepartimages.com' in text and 'rel="preconnect" href="https://vehiclepartimages.com"' not in text:
        text = text.replace('</head>', PRECONNECT + '</head>', 1)

    text = tune_images(text)

    if 'assets/storefront-performance.js' not in text:
        text = text.replace('</body>', JS + '</body>', 1)

    if text != original:
        path.write_text(text, encoding='utf-8')
        return True
    return False


def main() -> None:
    changed = 0
    html_files = sorted(ROOT.glob('*.html'))
    for path in html_files:
        if optimize(path):
            changed += 1
    print(f'HTML FILES SCANNED = {len(html_files)}')
    print(f'HTML FILES UPDATED = {changed}')
    print('PERFORMANCE PASS READY')


if __name__ == '__main__':
    main()
