(() => {
  "use strict";
  if (window.__OMNI_CUSTOMER_MARKETING_COPY__) return;
  window.__OMNI_CUSTOMER_MARKETING_COPY__ = true;

  const path = decodeURIComponent(String(location.pathname || "").split("/").filter(Boolean).pop() || "index.html").toLowerCase();
  const money = value => String(value || "").trim();

  function setText(selector, value) {
    const node = document.querySelector(selector);
    if (node && value) node.textContent = value;
  }

  function setMeta(name, content, property = false) {
    const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
    const node = document.querySelector(selector);
    if (node && content) node.setAttribute("content", content);
  }

  function homeCopy() {
    document.title = "Automotive, Marine & RV Parts Online | Omni Terrain";
    const description = "Shop automotive, towing, marine and RV parts at Omni Terrain. Find products by brand and MPN, get fitment help, featured savings and secure U.S. checkout.";
    setMeta("description", description);
    setMeta("og:title", "Omni Terrain | Automotive, Marine & RV Parts", true);
    setMeta("og:description", "Shop automotive, towing, marine and RV parts by brand and MPN, with featured savings, fitment help and secure U.S. checkout.", true);

    setText(".market-note", "U.S. pricing · Secure online checkout");
    setText(".launch-strip .container span:last-child", "Featured deals · Free standard shipping on featured offers in the contiguous U.S.");
    setText(".home-hero-copy p", "Shop automotive, towing, marine, RV and 12V parts by brand and manufacturer part number. Discover featured offers, fitment-focused product details and secure U.S. checkout.");

    const proofs = [...document.querySelectorAll(".home-proof > div")];
    if (proofs[0]) { const b=proofs[0].querySelector("b"), s=proofs[0].querySelector("span"); if(b)b.textContent="300+"; if(s)s.textContent="Products across automotive, marine and RV"; }
    if (proofs[1]) { const b=proofs[1].querySelector("b"), s=proofs[1].querySelector("span"); if(b)b.textContent="Shop by MPN"; if(s)s.textContent="Find parts using manufacturer part numbers"; }
    if (proofs[2]) { const b=proofs[2].querySelector("b"), s=proofs[2].querySelector("span"); if(b)b.textContent="Product help"; if(s)s.textContent="Fitment and order support when you need it"; }

    setText(".brand-strip-label", "Featured brands");
    const departmentSection = [...document.querySelectorAll(".home-section")].find(sec => /Shop by department/i.test(sec.querySelector(".eyebrow")?.textContent || ""));
    if (departmentSection) {
      const p = departmentSection.querySelector(".section-head p");
      if (p) p.textContent = "Browse truck, towing and suspension parts, marine electrical and navigation equipment, plus RV and overlanding essentials.";
    }

    const cats = [...document.querySelectorAll(".category-home")];
    if (cats[0]) { setNode(cats[0], ".num", "01 / AUTO"); setNode(cats[0], ".count", "Truck & SUV"); }
    if (cats[1]) { setNode(cats[1], ".num", "02 / MARINE"); setNode(cats[1], ".count", "Boat & Marine"); }
    if (cats[2]) { setNode(cats[2], ".num", "03 / RV"); setNode(cats[2], ".count", "RV & Travel"); }

    const why = document.querySelector(".why-shell");
    if (why) {
      setNode(why, ".why-head h2", "Shop with confidence.");
      setNode(why, ".why-head p", "Exact MPNs, practical fitment details and specialist support make it easier to choose the right part for your vehicle, boat or trip.");
      const cards=[...why.querySelectorAll(".why-card")];
      if(cards[0]){setNode(cards[0],"h3","Find the exact part");setNode(cards[0],"p","Search by brand and manufacturer part number, with application details and key specifications easy to review.");}
      if(cards[1]){setNode(cards[1],"h3","Fast, simple checkout");setNode(cards[1],"p","See online pricing and shipping offers at a glance, then move through secure checkout without marketplace clutter.");}
      if(cards[2]){setNode(cards[2],"h3","Specialist product help");setNode(cards[2],"p","Need help with fitment or product selection? Contact Omni Terrain before you order and get practical support.");}
    }

    const support = document.querySelector(".support-inner");
    if (support) {
      setNode(support, "h2", "Need the right fit? We can help.");
      setNode(support, "p", "Send us the MPN, vehicle or application details and what you need. Our team will help narrow down the right product before you order.");
    }
  }

  function setNode(root, selector, value) {
    const node = root?.querySelector(selector);
    if (node && value) node.textContent = value;
  }

  function catalogueCopy() {
    if (path === "us-catalogue.html") {
      document.title = "Automotive, Marine & RV Parts Catalogue | Omni Terrain";
      setMeta("description", "Shop Omni Terrain automotive, towing, marine and RV parts by brand, MPN and category with clear online pricing and product support.");
    } else if (path.startsWith("automotive")) {
      document.title = "Truck, Towing & Automotive Parts | Omni Terrain";
      setMeta("description", "Shop truck, SUV, towing, suspension, lighting and aftermarket automotive parts by brand and MPN at Omni Terrain.");
    } else if (path.startsWith("marine")) {
      document.title = "Marine Parts, Electrical & Boat Equipment | Omni Terrain";
      setMeta("description", "Shop marine electrical, charging, navigation and boat equipment by brand and manufacturer part number at Omni Terrain.");
    } else if (path.startsWith("rv")) {
      document.title = "RV & Overlanding Parts and Equipment | Omni Terrain";
      setMeta("description", "Shop RV, travel, towing and overlanding parts and equipment for road trips, campsites and everyday adventure at Omni Terrain.");
    }

    document.querySelectorAll(".ot-control-meta span").forEach(node => {
      const count = node.querySelector("b")?.textContent || "";
      if (count) node.innerHTML = `Showing <b data-visible-count>${count}</b> products.`;
    });
  }

  function productCopy() {
    document.querySelectorAll(".ot-live-trust").forEach(node => {
      node.textContent = "Secure checkout powered by Stripe · Free standard shipping on eligible items · Product support from Omni Terrain.";
    });
    document.querySelectorAll(".ot-live-label").forEach(node => {
      if (/online price|launch price/i.test(node.textContent || "")) node.textContent = "Online price";
    });
    document.querySelectorAll(".ot-live-stock").forEach(node => {
      if (/available online/i.test(node.textContent || "")) node.textContent = "In stock online";
    });
  }

  function cleanInternalLanguage() {
    document.querySelectorAll("p,span,small,h2,h3,div").forEach(node => {
      if (node.children.length) return;
      const raw = String(node.textContent || "").trim();
      if (!raw) return;
      if (/five products priced to win/i.test(raw)) node.textContent = "Upgrade more. Spend less.";
      else if (/focused launch selection combines real checkout/i.test(raw)) node.textContent = "Save on towing, truck and suspension essentials with secure online checkout and free standard shipping on featured offers in the contiguous U.S.";
      else if (/product eligibility and checkout coverage will expand/i.test(raw)) node.textContent = "Shop featured offers with clear pricing, free shipping on eligible deals and secure online checkout.";
      else if (/checkout coverage expands only as products clear/i.test(raw)) node.textContent = "See online pricing, shipping offers and availability at a glance, then check out securely.";
      else if (/available to buy online · five launch deals shown first/i.test(raw)) node.textContent = "Shop by brand, MPN or price · Featured deals highlighted";
      else if (/products available for secure checkout/i.test(raw)) node.textContent = raw.replace(/products available for secure checkout/i, "products");
      else if (/brands in our launch deals/i.test(raw)) node.textContent = "Featured brands";
      else if (/launch pricing is live on 5 featured products/i.test(raw)) node.textContent = "Featured deals · Free standard shipping on featured offers in the contiguous U.S.";
      else if (/selected online product · standard us shipping included/i.test(raw)) node.textContent = "Free standard shipping in the contiguous U.S.";
    });
  }

  function apply() {
    if (path === "" || path === "index.html") homeCopy();
    if (path === "us-catalogue.html" || /^(automotive|marine|rv)(?:-|\.)/.test(path)) catalogueCopy();
    productCopy();
    cleanInternalLanguage();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply, { once: true });
  else apply();

  if ("MutationObserver" in window) {
    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => { scheduled = false; apply(); });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
  }
})();