(async function () {
  "use strict";

  const path = String(window.location.pathname || "/");
  if (!(path === "/" || /\/index\.html$/i.test(path))) return;

  document.body.classList.add("home-premium-active");

  const money = (cents) => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(cents || 0) / 100);

  let liveConfig = { products: {} };
  try {
    const response = await fetch("/assets/us-live-products.json?v=cinematic-1", { cache: "no-store" });
    if (response.ok) liveConfig = await response.json();
  } catch (_) {}

  const liveProducts = liveConfig && liveConfig.products ? liveConfig.products : {};
  const heroProduct = liveProducts.F37FTL5607 || null;
  const heroPrice = heroProduct && heroProduct.enabled && Number(heroProduct.priceCents) > 0
    ? money(heroProduct.priceCents)
    : "Shop online";

  function cleanStoreLanguage() {
    document.querySelectorAll(".cart-link").forEach((link) => {
      const badge = link.querySelector("[data-cart-count]");
      if (badge && link.childNodes.length) link.childNodes[0].nodeValue = "Cart ";
      else if (/request cart/i.test(link.textContent || "")) link.textContent = "Cart";
    });
    document.querySelectorAll('.mobile-nav a[href="cart.html"]').forEach((link) => { link.textContent = "Cart"; });
    document.querySelectorAll('.mobile-nav a[href="checkout.html"]').forEach((link) => { link.textContent = "Secure Checkout"; });

    const announcement = document.querySelector(".announcement span");
    if (announcement) announcement.innerHTML = "<strong>Omni Terrain US:</strong> Specialist parts for road, water &amp; travel — selected products available online.";
    const marketNote = document.querySelector(".market-note");
    if (marketNote) marketNote.textContent = "US storefront · UK storefront · specialist product support";
    const launch = document.querySelector(".launch-strip .container");
    if (launch) launch.innerHTML = '<span class="launch-dot" aria-hidden="true"></span><span>Online pricing is live on selected products. More products are enabled as supplier, stock and shipping checks are completed.</span>';

    document.querySelectorAll("footer a, .mobile-store-bar a").forEach((link) => {
      if (/request cart/i.test(link.textContent || "")) link.textContent = "Cart";
    });
    document.querySelectorAll("footer .footer-copy").forEach((node) => {
      node.textContent = "Specialist automotive, marine, RV and 12V equipment for customers who care about the right part, the right application and clear support.";
    });
    document.querySelectorAll(".footer-bottom span").forEach((node) => {
      if (/request|no payment before confirmation/i.test(node.textContent || "")) {
        node.textContent = "US Store · Selected products available for secure online checkout";
      }
    });
  }

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
          <p>Specialist automotive, marine, RV and 12V equipment with clear manufacturer part numbers, practical fitment guidance and a growing online-buy catalogue.</p>
          <div class="ot-cinema-actions">
            <a class="ot-primary" href="us-catalogue.html">Explore the US store →</a>
            <a class="ot-secondary" href="automotive.html">Shop Auto Parts</a>
            <a class="ot-secondary" href="marine.html">Shop Marine</a>
          </div>
          <div class="ot-cinema-proof" aria-label="Store highlights">
            <div><b>1,000+</b><span>curated product records across specialist categories</span></div>
            <div><b>15+</b><span>established manufacturers represented in the catalogue</span></div>
            <div><b>US + UK</b><span>two regional storefronts under one Omni Terrain brand</span></div>
          </div>
        </div>
        <div class="ot-motion-stage" aria-label="Omni Terrain road water and power motion showcase">
          <div class="ot-stage-glow"></div>
          <div class="ot-stage-orbit"></div>
          <div class="ot-reel" id="otMotionReel">
            <div class="ot-reel-scene ot-scene-road">
              <span class="ot-scene-word">Road</span>
              <img class="ot-product-float" src="https://vehiclepartimages.com/ImageServerAPI?File=FAB/Images/FTL5607_1.jpg&maxheight=700&maxwidth=900" alt="Fabtech suspension product" loading="eager" referrerpolicy="no-referrer">
            </div>
            <div class="ot-reel-scene ot-scene-water">
              <span class="ot-scene-word">Water</span>
              <div class="ot-water-lines" aria-hidden="true"></div>
              <img class="ot-product-float compact" src="assets/omni-terrain-emblem.webp" alt="Omni Terrain" loading="eager">
            </div>
            <div class="ot-reel-scene ot-scene-power">
              <span class="ot-scene-word">Power</span>
              <div class="ot-power-grid" aria-hidden="true"></div>
              <img class="ot-product-float compact" src="assets/shield-live/coolmate-solar-12v-fridge-campervan-black-1000x1000.webp" alt="12V travel equipment" loading="lazy">
            </div>
            <div class="ot-stage-overlay">
              <div>
                <small>Featured online product</small>
                <b>Fabtech FTL5607 · ${heroPrice}</b>
                <div class="ot-stage-status"><i aria-hidden="true"></i><span>Selected online pricing live now</span></div>
              </div>
              <a href="us-fabtech-ftl5607.html">View product →</a>
            </div>
          </div>
        </div>
      </div>
      <div class="ot-scroll-cue">Scroll to explore</div>
    `;
    oldHero.replaceWith(hero);
  }

  const metrics = document.createElement("section");
  metrics.className = "ot-metrics-band";
  metrics.setAttribute("aria-label", "Omni Terrain store scale");
  metrics.innerHTML = `
    <div class="ot-metrics-inner">
      <div class="ot-metrics-intro"><small>Built as a specialist store</small><b>Depth without the clutter.</b></div>
      <div class="ot-metric"><strong data-ot-count="1000">0</strong><span>catalogue products</span></div>
      <div class="ot-metric"><strong data-ot-count="15">0</strong><span>established brands</span></div>
      <div class="ot-metric"><strong>3</strong><span>core terrain categories</span></div>
      <div class="ot-metric"><strong>2</strong><span>regional storefronts</span></div>
    </div>`;
  const heroNow = document.querySelector(".ot-cinema-hero");
  if (heroNow) heroNow.insertAdjacentElement("afterend", metrics);

  const story = document.createElement("section");
  story.className = "ot-story";
  story.innerHTML = `
    <div class="ot-story-inner">
      <div class="ot-story-head ot-reveal">
        <div><small>One brand / multiple terrains</small><h2>Designed around how people actually move.</h2></div>
        <p>Road, water and travel equipment should feel like one specialist ecosystem — not a random catalogue. Omni Terrain is being built around clear applications, credible product data and fast routes from discovery to purchase.</p>
      </div>
      <div class="ot-story-rail">
        <article class="ot-story-card ot-reveal" data-mode="road"><span class="ot-story-index">01 / ROAD</span><span class="ot-story-ghost">AUTO</span><div class="ot-story-copy"><h3>Automotive first.</h3><p>Suspension, towing, exterior, electrical and upgrade parts organized around manufacturer MPNs and application clarity.</p><a href="automotive.html">Explore Auto Parts →</a></div></article>
        <article class="ot-story-card ot-reveal ot-reveal-delay-1" data-mode="water"><span class="ot-story-index">02 / WATER</span><span class="ot-story-ghost">SEA</span><div class="ot-story-copy"><h3>Marine next.</h3><p>Electrical, deck, safety and on-water equipment presented as a specialist marine range.</p><a href="marine.html">Explore Marine →</a></div></article>
        <article class="ot-story-card ot-reveal ot-reveal-delay-2" data-mode="power"><span class="ot-story-index">03 / POWER</span><span class="ot-story-ghost">12V</span><div class="ot-story-copy"><h3>Travel & 12V.</h3><p>RV, overlanding and mobile-power products that support longer trips beyond the pavement.</p><a href="rv.html">Explore RV & Travel →</a></div></article>
      </div>
    </div>`;

  const whySection = document.querySelector(".why-shell")?.closest("section");
  if (whySection) whySection.insertAdjacentElement("beforebegin", story);
  else document.querySelector("main")?.appendChild(story);

  const marquee = document.createElement("div");
  marquee.className = "ot-marquee";
  const ticker = ["Auto Parts","Marine","Towing","Suspension","Electrical","RV & Overlanding","12V Equipment","Fitment Guidance","Secure Checkout"];
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
    const suffix = target >= 100 ? "+" : "+";
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
      reel.style.transform = `rotateY(${x * 2.8}deg) rotateX(${y * -2.4}deg)`;
    });
    reel.addEventListener("pointerleave", () => { reel.style.transform = ""; });
  }
})();
