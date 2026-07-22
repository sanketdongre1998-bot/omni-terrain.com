#!/usr/bin/env python3
from __future__ import annotations
import re
from pathlib import Path

CSS_BLOCK = r'''

    /* Used OEM auto parts — US */
    .used-oem-section{background:linear-gradient(145deg,#061629,#0f3658);color:#fff}
    .used-oem-shell{display:grid;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);gap:38px;align-items:start;padding:38px;border:1px solid rgba(255,255,255,.12);border-radius:24px;background:radial-gradient(circle at 92% 10%,rgba(198,154,80,.19),transparent 28%),rgba(255,255,255,.035);box-shadow:var(--shadow-dark)}
    .used-oem-copy h2{margin:12px 0 15px;font:800 clamp(3.3rem,5vw,5.4rem)/.8 "Barlow Condensed",sans-serif;letter-spacing:-.035em;text-transform:uppercase}
    .used-oem-copy h2 em{color:var(--gold-light);font-style:normal}
    .used-oem-copy>p{max-width:620px;margin:0;color:#c7d4e1;font-size:.86rem;line-height:1.75}
    .used-oem-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}
    .used-oem-actions .button.light{background:#fff;color:var(--navy)}
    .used-oem-safety{margin-top:21px;padding:15px 17px;border:1px solid rgba(230,209,164,.28);border-radius:13px;background:rgba(230,209,164,.08);color:#e9dfc9;font-size:.69rem;line-height:1.6}
    .used-oem-safety b{color:var(--gold-light)}
    .used-oem-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .used-oem-card{min-height:145px;padding:20px;border:1px solid rgba(255,255,255,.13);border-radius:16px;background:rgba(255,255,255,.055)}
    .used-oem-card span{display:inline-flex;padding:6px 8px;border-radius:999px;background:rgba(230,209,164,.12);color:var(--gold-light);font:500 .49rem/1 "DM Mono",monospace;letter-spacing:.1em;text-transform:uppercase}
    .used-oem-card h3{margin:13px 0 7px;font:800 1.72rem/.88 "Barlow Condensed",sans-serif;text-transform:uppercase}
    .used-oem-card p{margin:0;color:#b8c7d5;font-size:.68rem;line-height:1.55}
    .used-oem-standards{grid-column:1/-1;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:2px}
    .used-oem-standards div{padding:12px 10px;border-radius:11px;background:rgba(255,255,255,.055);color:#d7e1ea;font-size:.61rem;text-align:center}
    @media(max-width:920px){.used-oem-shell{grid-template-columns:1fr}.used-oem-standards{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:560px){.used-oem-shell{gap:25px;padding:24px 18px}.used-oem-copy h2{font-size:3.35rem}.used-oem-grid{grid-template-columns:1fr}.used-oem-actions{display:grid}.used-oem-actions .button{width:100%}.used-oem-standards{grid-template-columns:1fr 1fr}}
'''

HTML_BLOCK = r'''

    <section class="section used-oem-section" id="used-oem">
      <div class="container">
        <div class="used-oem-shell">
          <div class="used-oem-copy">
            <span class="eyebrow" style="color:var(--gold-light)">Used OEM auto parts · United States</span>
            <h2>Original parts.<br><em>Clearly identified.</em></h2>
            <p>OMNI Terrain is building a focused U.S. collection of used original-equipment automotive electronics. Each available part should be supported by its own photos, OEM part number, condition details, testing status and fitment notes before it is offered for sale.</p>
            <div class="used-oem-actions">
              <a class="button primary" href="mailto:support@omni-terrain.com?subject=Used%20OEM%20Part%20Request&amp;body=Vehicle%20year%3A%0AMake%3A%0AModel%3A%0AVIN%20(optional)%3A%0AOEM%20part%20number%3A%0APart%20needed%3A">Request a used OEM part →</a>
              <a class="button light" href="contact-and-order-help.html#request-help">Ask a fitment question</a>
            </div>
            <div class="used-oem-safety"><b>Safety boundary:</b> OMNI Terrain does not offer used airbags, inflators or seat-belt pretensioners. Programming, anti-theft and calibration requirements will be disclosed where relevant.</div>
          </div>
          <div class="used-oem-grid" aria-label="Used OEM part categories">
            <article class="used-oem-card"><span>HVAC</span><h3>Climate controls</h3><p>AC and heater control panels identified by exact OEM number and visible condition.</p></article>
            <article class="used-oem-card"><span>Infotainment</span><h3>Radios &amp; displays</h3><p>OEM radios, touchscreens and display units with anti-theft or programming notes.</p></article>
            <article class="used-oem-card"><span>Instrumentation</span><h3>Clusters &amp; speedometers</h3><p>Instrument clusters with mileage and programming disclosures whenever applicable.</p></article>
            <article class="used-oem-card"><span>Controls</span><h3>Switches &amp; modules</h3><p>Window, mirror, multifunction and selected non-safety electronic control units.</p></article>
            <div class="used-oem-standards">
              <div>Actual available-item photos</div><div>Exact OEM part number</div><div>Condition &amp; test status</div><div>U.S. shipping details</div>
            </div>
          </div>
        </div>
      </div>
    </section>
'''

REPLACEMENTS = [
('content="OMNI TERRAIN supports clear automotive, marine, RV and power buying guidance for United States and United Kingdom marketplace journeys. Operated by PRP Xpert LLC."','content="OMNI TERRAIN offers clear automotive, marine, RV and power buying guidance, plus a focused U.S. collection of clearly identified used OEM auto parts. Operated by PRP Xpert LLC."','meta description'),
('content="OMNI TERRAIN makes automotive, marine, RV and solar buying simple with clear products, plain-English guides and honest recommendations. Operated by PRP Xpert LLC."','content="OMNI TERRAIN makes automotive, marine, RV and solar buying simpler with clear products, used OEM auto parts, plain-English guides and honest information. Operated by PRP Xpert LLC."','Open Graph description'),
('<span><strong>OMNI TERRAIN:</strong> Automotive, RV and marine products with clear buying guidance.</span>','<span><strong>OMNI TERRAIN:</strong> New gear and clearly identified used OEM auto parts for U.S. customers.</span>','announcement'),
('        <a href="us-catalogue.html#automotive">Automotive</a>\n        <a href="us-catalogue.html#rv">RV &amp; Overlanding</a>','        <a href="us-catalogue.html#automotive">Automotive</a>\n        <a href="#used-oem">Used OEM Parts</a>\n        <a href="us-catalogue.html#rv">RV &amp; Overlanding</a>','desktop navigation'),
('      <a href="us-catalogue.html#automotive">Automotive &amp; Towing</a>\n      <a href="us-catalogue.html#rv">RV &amp; Overlanding</a>','      <a href="us-catalogue.html#automotive">Automotive &amp; Towing</a>\n      <a href="#used-oem">Used OEM Auto Parts</a>\n      <a href="us-catalogue.html#rv">RV &amp; Overlanding</a>','mobile navigation'),
('              <a class="button primary" href="us-catalogue.html">Shop the US catalogue →</a>\n              <a class="button light" href="buyer-guides.html">Read buying guides</a>','              <a class="button primary" href="us-catalogue.html">Shop the US catalogue →</a>\n              <a class="button light" href="#used-oem">Find used OEM parts</a>\n              <a class="button ghost" href="buyer-guides.html">Read buying guides</a>','hero actions'),
('              <span>50 focused products</span><span>15 established brands</span><span>Automotive · RV · Marine</span>','              <span>New products + used OEM</span><span>Exact part-number focus</span><span>Automotive · RV · Marine</span>','hero proof points'),
('    .shop-category-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}','    .shop-category-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}','category grid CSS'),
('            <a class="shop-category-card" href="us-catalogue.html#automotive"><span class="shop-category-icon">20</span><span><small>Shop category</small><h2>Automotive &amp; Towing</h2></span><span class="shop-category-arrow">→</span></a>\n            <a class="shop-category-card" href="us-catalogue.html#rv">','            <a class="shop-category-card" href="us-catalogue.html#automotive"><span class="shop-category-icon">20</span><span><small>Shop category</small><h2>Automotive &amp; Towing</h2></span><span class="shop-category-arrow">→</span></a>\n            <a class="shop-category-card" href="#used-oem"><span class="shop-category-icon">OEM</span><span><small>US used parts</small><h2>Used OEM Auto Parts</h2></span><span class="shop-category-arrow">→</span></a>\n            <a class="shop-category-card" href="us-catalogue.html#rv">','used OEM category card'),
('<span>New products only</span>','<span>New products + used OEM</span>','supplier scope'),
('OMNI TERRAIN is being built around new automotive, marine, RV and solar products. We are focused on helpful gear for vehicles, boats and off-grid power—not used parts or random general products.','OMNI TERRAIN is being built around new automotive, marine, RV and solar products, together with a focused U.S. collection of clearly identified used OEM automotive electronics. Used safety-restraint components are excluded.','FAQ product scope'),
('            <a href="us-catalogue.html#automotive">Automotive &amp; Towing</a>\n            <a href="us-catalogue.html#rv">','            <a href="us-catalogue.html#automotive">Automotive &amp; Towing</a>\n            <a href="#used-oem">Used OEM Auto Parts</a>\n            <a href="us-catalogue.html#rv">','footer collection link')]

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected exactly 1 marker, found {count}')
    return text.replace(old, new, 1)

def validate(text):
    required=['id="used-oem"','Used OEM Auto Parts','Climate controls','Radios &amp; displays','Clusters &amp; speedometers','Actual available-item photos','Exact OEM part number','does not offer used airbags, inflators or seat-belt pretensioners']
    errors=[f'missing: {x}' for x in required if x not in text]
    for x in ['New products only','not used parts or random general products']:
        if x in text: errors.append(f'obsolete contradiction: {x}')
    ids=re.findall(r'\bid=["\']([^"\']+)["\']',text)
    dup=sorted({x for x in ids if ids.count(x)>1})
    if dup: errors.append('duplicate IDs: '+', '.join(dup))
    broken=sorted({x for x in re.findall(r'href=["\']#([^"\']+)["\']',text) if x not in set(ids)})
    if broken: errors.append('broken anchors: '+', '.join(broken))
    return errors

path=Path('index.html')
text=path.read_text(encoding='utf-8')
if 'id="used-oem"' in text:
    raise SystemExit('Used OEM section already exists')
if '<main class="storefront-main" id="top">' not in text:
    raise SystemExit('Current storefront marker missing')
for old,new,label in REPLACEMENTS:
    text=replace_once(text,old,new,label)
text=replace_once(text,'    /* Mobile storefront hardening */',CSS_BLOCK+'\n    /* Mobile storefront hardening */','CSS insertion point')
text=replace_once(text,'    <section class="section learning-section" id="learn">',HTML_BLOCK+'\n    <section class="section learning-section" id="learn">','HTML insertion point')
errors=validate(text)
if errors:
    raise SystemExit('\n'.join(errors))
path.write_text(text,encoding='utf-8',newline='\n')
print('Used OEM patch applied and validated')
