(async function () {
  "use strict";

  const path = String(window.location.pathname || "/");
  if (!(path === "/" || /\/index\.html$/i.test(path))) return;
  if (window.__OMNI_HOME_PREMIUM__) return;
  window.__OMNI_HOME_PREMIUM__ = true;

  document.body.classList.add("home-premium-active");
  document.documentElement.setAttribute("lang", "en-US");

  const money = (cents) => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(cents || 0) / 100);

  let liveConfig = { products: {} };
  try {
    const response = await fetch("/assets/us-live-products.json?v=cinematic-3", { cache: "no-store" });
    if (response.ok) liveConfig = await response.json();
  } catch (_) {}

  const liveProducts = liveConfig && liveConfig.products ? liveConfig.products : {};
  const heroProduct = liveProducts.F37FTL5607 || null;
  const heroPrice = heroProduct && heroProduct.enabled && Number(heroProduct.priceCents) > 0
    ? money(heroProduct.priceCents)
    : "$199.99";

  function enhanceSeo() {
    document.title = "Omni Terrain US | Automotive, Marine, RV & 12V Parts";
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", "Shop Omni Terrain US for automotive, towing, marine, RV, overlanding and 12V parts. Search by brand or manufacturer part number, review fitment guidance and shop eligible products with secure checkout.");
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", "Omni Terrain US | Automotive, Marine, RV & 12V Parts");
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute("content", "Specialist US automotive, marine, RV and 12V parts with manufacturer part numbers, practical fitment guidance and secure checkout on eligible products.");

    if (!document.getElementById("ot-home-seo-schema")) {
      const schema = document.createElement("script");
      schema.type = "application/ld+json";
      schema.id = "ot-home-seo-schema";
      schema.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": "https://omni-terrain.com/#website",
            "name": "Omni Terrain",
            "url": "https://omni-terrain.com/",
            "inLanguage": "en-US",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://omni-terrain.com/us-catalogue.html#catalogue-search",
              "query-input": "required name=search_term_string"
            }
          },
          {
            "@type": "ItemList",
            "@id": "https://omni-terrain.com/#departments",
            "name": "Omni Terrain US departments",
            "itemListElement": [
              {"@type":"ListItem","position":1,"name":"Automotive Parts","url":"https://omni-terrain.com/automotive.html"},
              {"@type":"ListItem","position":2,"name":"Marine Parts & Equipment","url":"https://omni-terrain.com/marine.html"},
              {"@type":"ListItem","position":3,"name":"RV & Overlanding","url":"https://omni-terrain.com/rv.html"}
            ]
          }
        ]
      });
      document.head.appendChild(schema);
    }
  }

  function cleanStoreLanguage() {
    document.querySelectorAll(".cart-link").forEach((link) => {
      const badge = link.querySelector("[data-cart-count]");
      if (badge && link.childNodes.length) link.childNodes[0].nodeValue = "Cart ";
      else if (/request cart/i.test(link.textContent || "")) link.textContent = "Cart";
    });
    document.querySelectorAll('.mobile-nav a[href="cart.html"]').forEach((link) => { link.textContent = "Cart"; });
    document.querySelectorAll('.mobile-nav a[href="checkout.html"]').forEach((link) => { link.textContent = "Secure Checkout"; });

    const announcement = document.querySelector(".announcement span");
    if (announcement) announcement.innerHTML = "<strong>Omni Terrain US:</strong> Specialist parts for road, water &amp; travel — shop by brand, category or exact MPN.";
    const marketNote = document.querySelector(".market-note");
    if (marketNote) marketNote.textContent = "Choose your regional storefront · USD or GBP · region-specific products";
    const launch = document.querySelector(".launch-strip .container");
    if (launch) launch.innerHTML = '<span class="launch-dot" aria-hidden="true"></span><span><strong>US storefront:</strong> eligible products show current online pricing, availability and secure checkout.</span><a href="deals.html">View featured deals →</a>';

    document.querySelectorAll("footer a, .mobile-store-bar a").forEach((link) => {
      if (/request cart/i.test(link.textContent || "")) link.textContent = "Cart";
    });
    document.querySelectorAll("footer .footer-copy").forEach((node) => {
      node.textContent = "Specialist automotive, marine, RV and 12V equipment with clear MPNs, practical fitment guidance and customer support.";
    });
    document.querySelectorAll(".footer-bottom span").forEach((node) => {
      if (/request|no payment before confirmation/i.test(node.textContent || "")) {
        node.textContent = "US Store · Secure online checkout on eligible products";
      }
    });
  }

  enhanceSeo();
  cleanStoreLanguage();

  const oldHero = document.querySelector(".home-hero");
  if (oldHero) {
    const hero = document.createElement("section");
    hero.className = "ot-cinema-hero";
    hero.id = "start";
    hero.innerHTML = `
      <div class="ot-cinema-grid">
        <div class="ot-cinema-copy">
          <div class="ot-cinema-kicker">Omni Terrain / United States</div>
          <h1>Built for road.<br><em>Water.</em> Beyond.</h1>
          <p>Specialist automotive, marine, RV and 12V parts with exact manufacturer part numbers, practical fitment guidance, live availability and secure checkout.</p>
          <div class="ot-cinema-actions">
            <a class="ot-primary" href="us-catalogue.html">Explore the US store →</a>
            <a class="ot-secondary" href="automotive.html">Shop Auto Parts</a>
            <a class="ot-secondary" href="marine.html">Shop Marine</a>
          </div>
          <form class="ot-cinema-search" id="otCinemaSearch" role="search">
            <label for="otCinemaSearchInput">Find a product by brand or manufacturer part number</label>
            <div class="ot-cinema-search-row"><input id="otCinemaSearchInput" type="search" autocomplete="off" spellcheck="false" placeholder="Try Fabtech, Blue Sea or an exact MPN"><button type="submit">Search catalogue</button></div>
            <small>Search the U.S. catalogue by brand, product name or exact MPN.</small>
          </form>
          <div class="ot-cinema-proof" aria-label="Store highlights">
            <div><b>1,000</b><span>catalogued US products across focused specialist categories</span></div>
            <div><b>15+</b><span>established manufacturers represented across the US range</span></div>
            <div><b>US Store</b><span>USD pricing and U.S.-specific product merchandising</span></div>
          </div>
        </div>
        <div class="ot-motion-stage" aria-label="Featured United States product">
          <div class="ot-stage-glow"></div>
          <div class="ot-stage-orbit"></div>
          <div class="ot-reel ot-reel-static" id="otMotionReel">
            <div class="ot-reel-scene ot-scene-road ot-scene-featured">
              <span class="ot-scene-word">US / AUTO</span>
              <img class="ot-product-float" src="https://vehiclepartimages.com/ImageServerAPI?File=FAB/Images/FTL5607_1.jpg&maxheight=700&maxwidth=900" alt="Fabtech FTL5607 suspension leveling system" loading="eager" decoding="async" fetchpriority="high" referrerpolicy="no-referrer">
            </div>
            <div class="ot-stage-overlay">
              <div>
                <small>Featured US product · Fabtech · MPN FTL5607</small>
                <b>Fabtech FTL5607 · ${heroPrice}</b>
                <div class="ot-stage-status"><i aria-hidden="true"></i><span>U.S. product · current online pricing and availability</span></div>
              </div>
              <a href="us-fabtech-ftl5607.html">View product →</a>
            </div>
          </div>
        </div>
      </div>
      <div class="ot-scroll-cue">Scroll to explore</div>
    `;
    oldHero.replaceWith(hero);

    const search = document.getElementById("otCinemaSearch");
    search?.addEventListener("submit", (event) => {
      event.preventDefault();
      const q = String(document.getElementById("otCinemaSearchInput")?.value || "").trim();
      if (q) {
        try { sessionStorage.setItem("otCatalogueSearch", q); } catch (_) {}
      }
      location.href = "/us-catalogue.html#catalogue-search";
    });
  }

  const metrics = document.createElement("section");
  metrics.className = "ot-metrics-band";
  metrics.setAttribute("aria-label", "Omni Terrain US store scale");
  metrics.innerHTML = `
    <div class="ot-metrics-inner">
      <div class="ot-metrics-intro"><small>United States storefront</small><b>Depth without the clutter.</b></div>
      <div class="ot-metric"><strong data-ot-count="1000" data-ot-suffix="">0</strong><span>catalogued US products</span></div>
      <div class="ot-metric"><strong data-ot-count="15" data-ot-suffix="+">0</strong><span>established brands</span></div>
      <div class="ot-metric"><strong>3</strong><span>core specialist departments</span></div>
      <div class="ot-metric"><strong>USD</strong><span>regional pricing for the US storefront</span></div>
    </div>`;
  const heroNow = document.querySelector(".ot-cinema-hero");
  if (heroNow) heroNow.insertAdjacentElement("afterend", metrics);

  const story = document.createElement("section");
  story.className = "ot-story";
  story.innerHTML = `
    <div class="ot-story-inner">
      <div class="ot-story-head ot-reveal">
        <div><small>One US store / three specialist terrains</small><h2>Designed around how people actually move.</h2></div>
        <p>Road, water and travel equipment should feel like one specialist ecosystem — not a random catalogue. Omni Terrain organizes the buying journey around clear applications, credible product data and fast routes from discovery to purchase.</p>
      </div>
      <div class="ot-story-rail">
        <article class="ot-story-card ot-reveal" data-mode="road"><img class="ot-story-media" src="https://vehiclepartimages.com/ImageServerAPI?File=FAB/Images/FTL5607_1.jpg&maxheight=700&maxwidth=900" alt="Automotive suspension product" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span class="ot-story-index">01 / ROAD</span><span class="ot-story-ghost">AUTO</span><div class="ot-story-copy"><h3>Automotive first.</h3><p>Suspension, towing, exterior, electrical and upgrade parts organized around manufacturer MPNs and application clarity.</p><a href="automotive.html">Explore Auto Parts →</a></div></article>
        <article class="ot-story-card ot-reveal ot-reveal-delay-1" data-mode="water"><img class="ot-story-media" src="https://vehiclepartimages.com/ImageServerAPI?File=HUM/Images/410190-1_1.jpg&maxheight=700&maxwidth=900" alt="Marine electronics product" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span class="ot-story-index">02 / WATER</span><span class="ot-story-ghost">SEA</span><div class="ot-story-copy"><h3>Marine, clearly.</h3><p>Electrical, navigation and on-water equipment presented as a focused US marine range with practical specifications.</p><a href="marine.html">Explore Marine →</a></div></article>
        <article class="ot-story-card ot-reveal ot-reveal-delay-2" data-mode="power"><img class="ot-story-media" src="https://vehiclepartimages.com/ImageServerAPI?File=BLU/Images/5026-BSS_1.jpg&maxheight=700&maxwidth=900" alt="Blue Sea 12V electrical product" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span class="ot-story-index">03 / POWER</span><span class="ot-story-ghost">12V</span><div class="ot-story-copy"><h3>Travel & 12V.</h3><p>RV, overlanding and electrical products selected for road-based travel and mobile-power applications.</p><a href="rv.html">Explore RV & Travel →</a></div></article>
      </div>
    </div>`;

  const whySection = document.querySelector(".why-shell")?.closest("section");
  if (whySection) whySection.insertAdjacentElement("beforebegin", story);
  else document.querySelector("main")?.appendChild(story);

  const marquee = document.createElement("div");
  marquee.className = "ot-marquee";
  const ticker = ["US Auto Parts","US Marine","Towing","Suspension","Electrical","RV & Overlanding","12V Equipment","Fitment Guidance","Secure Checkout"];
  marquee.innerHTML = `<div class="ot-marquee-track">${[...ticker,...ticker].map((item) => `<span class="ot-marquee-item">${item}</span>`).join("")}</div>`;
  const footer = document.querySelector("footer");
  if (footer) footer.insertAdjacentElement("beforebegin", marquee);

  const revealTargets = [
    ...document.querySelectorAll(".section-head,.category-home,.live-card,.why-card,.support-inner,.brand-strip-inner")
  ];
  revealTargets.forEach((node, index) => {
    node.classList.add("ot-reveal");
    if (index % 4 === 1) node.classList.add("ot-reveal-delay-1");
    if (index % 4 === 2) node.classList.add("ot-reveal-delay-2");
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12, rootMargin: "0px 0px -30px 0px" });
    document.querySelectorAll(".ot-reveal").forEach((node) => observer.observe(node));
  } else {
    document.querySelectorAll(".ot-reveal").forEach((node) => node.classList.add("is-visible"));
  }

  const counters = document.querySelectorAll("[data-ot-count]");
  const animateCounter = (node) => {
    const target = Number(node.dataset.otCount || 0);
    if (!target || node.dataset.done) return;
    node.dataset.done = "true";
    const suffix = String(node.dataset.otSuffix || "");
    const duration = 900;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = Math.round(target * eased).toLocaleString("en-US") + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .6 });
    counters.forEach((node) => countObserver.observe(node));
  } else counters.forEach(animateCounter);

  const reel = document.getElementById("otMotionReel");
  if (reel && matchMedia("(pointer:fine)").matches && !matchMedia("(prefers-reduced-motion:reduce)").matches) {
    reel.addEventListener("pointermove", (event) => {
      const rect = reel.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      reel.style.transform = `rotateY(${x * 2.1}deg) rotateX(${y * -1.8}deg)`;
    });
    reel.addEventListener("pointerleave", () => { reel.style.transform = ""; });
  }
})();
