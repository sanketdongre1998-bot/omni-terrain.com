from pathlib import Path
import re

root = Path(__file__).resolve().parents[2]
index_path = root / "index.html"
uk_path = root / "uk.html"

source = index_path.read_text(encoding="utf-8")
head = source.split("</head>", 1)[0] + "</head>"


def replace_once(text: str, pattern: str, replacement: str) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f"Expected one match for: {pattern}")
    return updated


head = head.replace('<html lang="en">', '<html lang="en-GB">', 1)
head = replace_once(
    head,
    r'<meta name="description" content="[^"]*">',
    '<meta name="description" content="Shop OMNI Terrain UK automotive, campervan and campsite products from approved UK suppliers, starting with the Shield Autocare range.">',
)
head = replace_once(head, r'<title>.*?</title>', '<title>OMNI Terrain UK Store | Automotive, Campervan & Campsite Gear</title>')
head = replace_once(head, r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="https://omni-terrain.com/uk.html">')
head = replace_once(head, r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="OMNI Terrain UK Store | Automotive, Campervan & Campsite Gear">')
head = replace_once(head, r'<meta property="og:description" content="[^"]*">', '<meta property="og:description" content="Browse the OMNI Terrain UK storefront with seven Shield Autocare products and supplier-ready expansion for future UK ranges.">')
head = replace_once(head, r'<meta property="og:url" content="[^"]*">', '<meta property="og:url" content="https://omni-terrain.com/uk.html">')

uk_css = r'''
  <style>
    .uk-legal-note{margin-top:15px;color:#c7d4e1;font-size:.68rem;line-height:1.7}
    .uk-legal-note strong{color:var(--gold-light)}
    .uk-supplier-status{display:inline-flex;width:max-content;margin-top:16px;padding:7px 10px;border:1px solid rgba(198,154,80,.35);border-radius:999px;color:var(--gold);background:#fffaf0;font:600 .5rem/1 "DM Mono",monospace;letter-spacing:.09em;text-transform:uppercase}
    .market-card.uk .uk-supplier-status{color:var(--gold-light);background:rgba(255,255,255,.07);border-color:rgba(230,209,164,.35)}
    .uk-store-main .home-product-card h3{min-height:54px}
    .uk-store-main .home-product-visual img{width:100%;height:180px;object-fit:contain}
    .uk-store-main .shop-category-icon{font-size:1rem;letter-spacing:.02em}
    @media(max-width:760px){
      .uk-store-main .home-product-card h3{min-height:0}
      .uk-store-main .home-product-visual img{height:150px}
    }
  </style>
'''
head = head.replace("</head>", uk_css + "\n</head>", 1)

products = [
    {
        "href": "shield-400l-roof-bag.html",
        "image": "assets/shield/400l-roof-bag.svg",
        "alt": "400 litre soft-shell roof bag",
        "brand": "Shield Autocare",
        "mpn": "TR.RF.BAG.400L",
        "title": "400L Waterproof Roof Bag",
        "price": "£119.99",
        "group": "Road / Cargo",
    },
    {
        "href": "shield-transit-custom-2-roof-bars.html",
        "image": "assets/shield/transit-custom-2-roof-bars.svg",
        "alt": "Two roof bars for a Ford Transit Custom",
        "brand": "Shield Autocare",
        "mpn": "RF.BAR.FTC13.TWO.BAR",
        "title": "Ford Transit Custom 2 Roof Bars",
        "price": "£114.99",
        "group": "Road / Van",
    },
    {
        "href": "shield-7mm-insulation-10m.html",
        "image": "assets/shield/7mm-insulation-10m.svg",
        "alt": "7 millimetre campervan insulation roll",
        "brand": "Shield Autocare",
        "mpn": "7MM.INSUL.10M",
        "title": "7mm Self-Adhesive Insulation — 10m",
        "price": "£74.99",
        "group": "Campervan / Conversion",
    },
    {
        "href": "shield-jet-black-roof-vent.html",
        "image": "assets/shield/jet-black-roof-vent.svg",
        "alt": "Jet Black 12 volt campervan roof vent",
        "brand": "Shield Autocare",
        "mpn": "RF.JET.VENT.35x35.JETBLACK",
        "title": "Jet Black 12V Roof Vent",
        "price": "£79.95",
        "group": "Campervan / Ventilation",
    },
    {
        "href": "shield-portable-toilet-12l.html",
        "image": "assets/shield/portable-toilet-12l.svg",
        "alt": "Portable toilet with 12 litre holding tank",
        "brand": "Shield Autocare",
        "mpn": "PORTA.TLT.SML",
        "title": "Portable Toilet — 12L Holding Tank",
        "price": "£104.99",
        "group": "Campsite / Compact",
    },
    {
        "href": "shield-portable-toilet-20l.html",
        "image": "assets/shield/portable-toilet-20l.svg",
        "alt": "Portable toilet with 20 litre holding tank",
        "brand": "Shield Autocare",
        "mpn": "PORTA.TLT.LRG",
        "title": "Portable Toilet — 20L Holding Tank",
        "price": "£114.99",
        "group": "Campsite / Capacity",
    },
    {
        "href": "shield-12v-air-compressor.html",
        "image": "assets/shield/12v-air-compressor.svg",
        "alt": "12 volt heavy-duty air compressor",
        "brand": "Shield Autocare",
        "mpn": "DC.12V.COMPR",
        "title": "12V Heavy-Duty Air Compressor",
        "price": "£24.99",
        "group": "Road / Tyre Care",
    },
]

cards = []
for product in products:
    status = "Out of stock" if product["mpn"] == "DC.12V.COMPR" else "Currently unavailable"
    cards.append(f'''          <a class="home-product-card" href="{product['href']}">
            <div class="home-product-visual"><span class="home-product-status">{status}</span><img src="{product['image']}" alt="{product['alt']}" loading="lazy"><span class="home-image-fallback">Product image temporarily unavailable</span></div>
            <div class="home-product-body"><div class="home-product-brand"><span>{product['brand']}</span><span>MPN {product['mpn']}</span></div><h3>{product['title']}</h3><div class="home-product-footer"><span>{product['group']} · Indicative inc VAT</span><b>{product['price']} →</b></div></div>
          </a>''')
product_cards = "\n".join(cards)

body = f'''<body>
  <div class="announcement">
    <div class="container">
      <span><strong>OMNI TERRAIN UK:</strong> Automotive, campervan and campsite products with clear buying guidance.</span>
      <a href="contact-and-order-help.html#request-help">UK product support →</a>
    </div>
  </div>

  <div class="market-strip" aria-label="Marketplace region selector">
    <div class="container">
      <span class="market-label">Marketplace region</span>
      <div class="market-links">
        <a href="index.html">United States</a>
        <a class="active" aria-current="page" href="uk.html">United Kingdom</a>
      </div>
      <span class="market-note">UK prices, availability and delivery are shown by product.</span>
    </div>
  </div>

  <header id="header">
    <div class="container header-main">
      <a class="brand" href="uk.html" aria-label="OMNI TERRAIN UK home">
        <span class="wordmark">
          <span class="wordmark-main">OMNI</span>
          <span class="wordmark-sub">Terrain</span>
          <span class="wordmark-meta">Road / Water / Power</span>
        </span>
      </a>
      <nav class="nav-links" aria-label="Primary navigation">
        <a class="active" aria-current="page" href="#products">Shop UK</a>
        <a href="#categories">Categories</a>
        <a href="shield-autocare-uk.html">Shield Range</a>
        <a href="#suppliers">Suppliers</a>
        <a href="buyer-guides.html">Guides</a>
        <a href="contact-and-order-help.html#request-help">Contact</a>
      </nav>
      <div class="header-actions">
        <a class="contact-link header-contact header-cart" href="contact-and-order-help.html#request-help">Product Support</a>
        <button class="menu-btn" id="menuToggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobileNav">Menu</button>
      </div>
    </div>
    <div class="mobile-nav" id="mobileNav">
      <a href="uk.html">UK Store Home</a>
      <a href="#products">Shop Shield Products</a>
      <a href="#categories">UK Categories</a>
      <a href="shield-autocare-uk.html">Full Shield Range</a>
      <a href="#suppliers">UK Suppliers</a>
      <a href="buyer-guides.html">Buyer Guides</a>
      <a href="contact-and-order-help.html#request-help">Contact &amp; Order Help</a>
    </div>
  </header>

  <main class="storefront-main uk-store-main" id="top">
    <section class="shop-hero">
      <div class="container">
        <div class="shop-hero-shell">
          <div class="shop-hero-copy">
            <span class="eyebrow" style="color:var(--gold-light)">OMNI Terrain UK Store</span>
            <h1>Gear for road,<br>van &amp; <em>camp.</em></h1>
            <p>Browse a focused United Kingdom range for vehicle travel, campervan conversion and campsite use. The first supplier collection is Shield Autocare, with every product clearly labelled while ordering, stock, delivery and returns remain under confirmation.</p>
            <div class="shop-hero-actions">
              <a class="button primary" href="#products">Shop the UK range →</a>
              <a class="button light" href="shield-autocare-uk.html">Browse Shield catalogue</a>
            </div>
            <div class="shop-proof" aria-label="UK store overview">
              <span>7 Shield products</span><span>GBP prices include VAT</span><span>Road · Campervan · Campsite</span>
            </div>
          </div>
          <a class="shop-hero-product" href="shield-400l-roof-bag.html" aria-label="View Shield Autocare 400 litre roof bag">
            <img src="assets/shield/400l-roof-bag.svg" alt="Shield Autocare 400 litre waterproof roof bag">
            <span class="shop-hero-product-info"><span>Shield Autocare<b>400L Waterproof Roof Bag</b></span><small>Currently unavailable · £119.99</small></span>
          </a>
        </div>

        <nav class="shop-categories" id="categories" aria-label="Shop UK by category">
          <div class="shop-category-grid">
            <a class="shop-category-card" href="#products"><span class="shop-category-icon">ROAD</span><span><small>Shop category</small><h2>Road &amp; Cargo</h2></span><span class="shop-category-arrow">→</span></a>
            <a class="shop-category-card" href="#products"><span class="shop-category-icon">VAN</span><span><small>Shop category</small><h2>Campervan &amp; Conversion</h2></span><span class="shop-category-arrow">→</span></a>
            <a class="shop-category-card" href="#products"><span class="shop-category-icon">CAMP</span><span><small>Shop category</small><h2>Campsite &amp; Travel</h2></span><span class="shop-category-arrow">→</span></a>
          </div>
        </nav>
      </div>
    </section>

    <section class="section home-products" id="products">
      <div class="container">
        <div class="store-section-head">
          <div><span class="eyebrow">Shield Autocare UK products</span><h2>Shop the current UK range.</h2></div>
          <p>These seven product pages use the supplier catalogue information already reviewed. Prices are indicative and include UK VAT. Ordering stays disabled until stock, delivery, returns and commercial terms are confirmed.</p>
        </div>
        <div class="home-product-grid">
{product_cards}
        </div>
        <div class="all-products-link"><a class="button dark" href="shield-autocare-uk.html">Open the detailed Shield catalogue →</a></div>
      </div>
    </section>

    <section class="market-launch" id="suppliers">
      <div class="container">
        <div class="market-launch-inner">
          <div class="market-launch-head">
            <div><span class="eyebrow">United Kingdom supplier lanes</span><h2>One storefront. Multiple approved ranges.</h2></div>
            <p>The UK store is structured supplier by supplier. Products are added only when the line card, product data, commercial terms and fulfilment route are available for accurate product pages.</p>
          </div>
          <div class="market-grid">
            <article class="market-card">
              <div>
                <span class="market-chip">Supplier 01 · Shield Autocare</span>
                <h3>Road, campervan &amp; campsite</h3>
                <p>Seven selected products are already available to browse with existing product pages, supplier SKUs and indicative VAT-inclusive pricing.</p>
                <span class="uk-supplier-status">Range added · Ordering controlled</span>
              </div>
              <a href="shield-autocare-uk.html">Browse Shield products →</a>
            </article>
            <article class="market-card uk">
              <div>
                <span class="market-chip">Supplier 02 · LKQ UK</span>
                <h3>Future automotive range</h3>
                <p>LKQ products will be added after the UK line card and approved product data are available. No placeholder SKUs, specifications, prices or availability are being published.</p>
                <span class="uk-supplier-status">Line card pending</span>
              </div>
              <a href="mailto:procurement@omni-terrain.com?subject=LKQ%20UK%20Line%20Card%20and%20Product%20Data">Supplier data request →</a>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section class="section learning-section" id="learn">
      <div class="container learning-grid">
        <div class="learning-copy">
          <span class="eyebrow" style="color:var(--gold-light)">Check before you buy</span>
          <h2>Clear details.<br><em>Less return risk.</em></h2>
          <p>Vehicle fitment, measurements, installation requirements and delivery conditions should be checked on the individual UK product page or marketplace listing before an order is placed.</p>
        </div>
        <div class="learning-links">
          <a class="learning-link" href="shield-transit-custom-2-roof-bars.html"><i>01</i><span><b>Vehicle fitment</b><span>Confirm the exact van configuration and product requirements.</span></span><strong>→</strong></a>
          <a class="learning-link" href="shield-jet-black-roof-vent.html"><i>02</i><span><b>Installation details</b><span>Review cut-out, electrical and installation notes before choosing.</span></span><strong>→</strong></a>
          <a class="learning-link" href="returns-refunds-policy.html"><i>03</i><span><b>Returns guidance</b><span>Check product-specific conditions before opening, fitting or installing.</span></span><strong>→</strong></a>
        </div>
      </div>
    </section>

    <section class="store-support">
      <div class="container">
        <div class="store-support-inner">
          <div><span class="eyebrow">Need UK product help?</span><h2>Talk to OMNI Terrain before you choose.</h2></div>
          <div class="store-support-actions"><a class="button dark" href="contact-and-order-help.html#request-help">Contact product support →</a><a class="button light" href="index.html">Visit the US store</a></div>
        </div>
      </div>
    </section>
  </main>

  <footer>
    <div class="container">
      <div class="footer-grid">
        <div>
          <a class="brand footer-wordmark" href="uk.html" aria-label="OMNI TERRAIN UK home">
            <span class="wordmark"><span class="wordmark-main">OMNI</span><span class="wordmark-sub">Terrain</span><span class="wordmark-meta">Road / Water / Power</span></span>
          </a>
          <p class="footer-copy">A focused UK storefront for automotive, campervan and campsite products from approved supplier ranges.</p>
          <p class="uk-legal-note"><strong>UK operator:</strong> PRASAD INC LTD · Company No. 07981226 · VAT 433306133 · EORI GB433306133000</p>
        </div>
        <div>
          <div class="footer-heading">UK collections</div>
          <div class="footer-links"><a href="#products">All UK products</a><a href="shield-autocare-uk.html">Shield Autocare</a><a href="#categories">Road &amp; Cargo</a><a href="#categories">Campervan &amp; Campsite</a></div>
        </div>
        <div>
          <div class="footer-heading">Helpful links</div>
          <div class="footer-links"><a href="buyer-guides.html">Buyer Guides</a><a href="shipping-delivery-policy.html">Shipping &amp; Delivery</a><a href="returns-refunds-policy.html">Returns &amp; Refunds</a><a href="privacy-policy.html">Privacy Policy</a><a href="terms-conditions.html">Terms &amp; Conditions</a></div>
        </div>
        <div>
          <div class="footer-heading">Talk to us</div>
          <div class="footer-links"><a href="mailto:support@omni-terrain.com">support@omni-terrain.com</a><a href="mailto:ops@omni-terrain.com">ops@omni-terrain.com</a><a href="mailto:procurement@omni-terrain.com">procurement@omni-terrain.com</a><a href="contact-and-order-help.html#request-help">Contact &amp; order help</a></div>
        </div>
      </div>
      <div class="footer-bottom"><span>© 2026 OMNI TERRAIN. All rights reserved.</span><span>OMNI TERRAIN UK is operated by <strong>PRASAD INC LTD</strong>, England and Wales.</span></div>
    </div>
  </footer>

  <script>
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 30), {passive:true});
    const menuToggle = document.getElementById('menuToggle');
    const mobileNav = document.getElementById('mobileNav');
    menuToggle.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open menu');
    }));
  </script>

  <div class="mobile-store-bar" aria-label="UK store shortcuts">
    <a href="#products">Browse UK products</a>
    <a href="contact-and-order-help.html#request-help">Product support</a>
  </div>
</body>
</html>
'''

output = head + "\n" + body
uk_path.write_text(output, encoding="utf-8")

# Validation: exact approved product pages/assets, legal identity, supplier lanes and anchors.
for product in products:
    if not (root / product["href"]).exists():
        raise RuntimeError(f"Missing product page: {product['href']}")
    if not (root / product["image"]).exists():
        raise RuntimeError(f"Missing product image: {product['image']}")
    if output.count(f'href="{product["href"]}"') < 1:
        raise RuntimeError(f"Product not linked: {product['href']}")

required = [
    "OMNI Terrain UK Store",
    "Shield Autocare UK products",
    "LKQ UK",
    "Line card pending",
    "PRASAD INC LTD",
    "07981226",
    "433306133",
    "GB433306133000",
]
for value in required:
    if value not in output:
        raise RuntimeError(f"Required UK storefront content missing: {value}")

if "PRP Xpert LLC" in output:
    raise RuntimeError("US legal entity must not appear on the UK storefront")

ids = re.findall(r'\bid="([^"]+)"', output)
duplicates = sorted({value for value in ids if ids.count(value) > 1})
if duplicates:
    raise RuntimeError(f"Duplicate IDs: {duplicates}")

id_set = set(ids)
for anchor in re.findall(r'href="#([^"]+)"', output):
    if anchor not in id_set:
        raise RuntimeError(f"Broken internal anchor: #{anchor}")

if output.count("Currently unavailable") < 7:
    raise RuntimeError("All controlled Shield product cards must retain unavailable status")

print("UK storefront generated and validated")
