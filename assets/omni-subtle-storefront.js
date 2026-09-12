(() => {
  "use strict";
  if (window.__OMNI_SUBTLE_STOREFRONT__) return;
  window.__OMNI_SUBTLE_STOREFRONT__ = true;

  const LOGO = "/assets/omni-terrain-subtle-logo.svg?v=20260912";
  const isUK = String(document.documentElement.lang || "").toLowerCase() === "en-gb" || /(^|\/)uk(?:-|\.|\/)/i.test(location.pathname) || /shield-autocare-uk/i.test(location.pathname);
  const file = decodeURIComponent(String(location.pathname || "/").split("/").filter(Boolean).pop() || "index.html").toLowerCase();

  function installLogo(root=document){
    const selectors = ["a.brand","a.ot-site-brand","a.footer-wordmark",".ot-retail-logo"];
    root.querySelectorAll(selectors.join(",")).forEach(node => {
      if (node.querySelector("img.ot-approved-logo")) return;
      node.innerHTML = `<img class="ot-approved-logo" src="${LOGO}" alt="Omni Terrain" width="340" height="78" decoding="async">`;
      node.classList.add("ot-logo-approved");
    });
  }

  function menuItems(label){
    const key = String(label || "").toLowerCase();
    if (isUK) {
      if (key.includes("auto")) return [["Automotive help","uk-contact.html"],["Available UK products","shield-autocare-uk.html"],["Shipping & delivery","uk-shipping-delivery-policy.html"],["Returns & refunds","uk-returns-refunds-policy.html"]];
      if (key.includes("marine")) return [["Marine product help","uk-contact.html"],["Available UK products","shield-autocare-uk.html"],["Contact UK support","uk-contact.html"]];
      if (key.includes("shop") || key.includes("available")) return [["All available products","shield-autocare-uk.html"],["Campervan fridges","shield-autocare-uk.html#fridges"],["Windows","shield-autocare-uk.html#windows"],["Blinds & flyscreens","shield-autocare-uk.html#blinds"]];
      return [];
    }
    if (key.includes("auto")) return [["All Auto Parts","automotive.html"],["Lighting & Electrical","automotive.html"],["Suspension & Performance","automotive.html"],["Towing & Hauling","automotive.html"],["Exterior Accessories","automotive.html"]];
    if (key.includes("marine")) return [["All Marine","marine.html"],["Marine Electrical","marine.html"],["Charging & Power","marine.html"],["Boat Equipment","marine.html"]];
    if (key.includes("rv") || key.includes("overland")) return [["RV & Overlanding","rv.html"],["12V & Power","rv.html"],["Travel & Campsite","rv.html"],["Towing","rv.html"]];
    if (key.includes("shop all")) return [["All Products","us-catalogue.html"],["Featured Deals","deals.html"],["Auto Parts","automotive.html"],["Marine","marine.html"],["RV & Overlanding","rv.html"]];
    return [];
  }

  function enhanceNav(header){
    if (!header || header.dataset.otSubtleNav === "true") return;
    const main = header.querySelector(".header-main,.ot-site-header-main,.container");
    let nav = header.querySelector(":scope > .header-main .nav-links,:scope > .ot-site-header-main .ot-site-nav,:scope > .container .nav,:scope > .nav-links,:scope > .ot-site-nav,:scope > .nav");
    if (!main || !nav) return;

    const row = document.createElement("div");
    row.className = "ot-nav-row";
    nav.parentNode.removeChild(nav);
    row.appendChild(nav);
    const mobile = header.querySelector(".mobile-nav,.ot-site-mobile-nav");
    if (mobile) header.insertBefore(row, mobile); else header.appendChild(row);

    [...nav.children].forEach(anchor => {
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const items = menuItems(anchor.textContent);
      if (!items.length) return;
      const wrap = document.createElement("span");
      wrap.className = "ot-mega-wrap";
      anchor.parentNode.insertBefore(wrap, anchor);
      wrap.appendChild(anchor);
      const menu = document.createElement("div");
      menu.className = "ot-mega-menu";
      menu.innerHTML = `<div class="ot-mega-title">${anchor.textContent.trim()}</div>` + items.map(([name,href]) => `<a href="${href}">${name}</a>`).join("");
      wrap.appendChild(menu);
    });

    if (!main.querySelector(".ot-commerce-search")) {
      const form = document.createElement("form");
      form.className = "ot-commerce-search";
      form.role = "search";
      form.innerHTML = `<input type="search" name="q" autocomplete="off" placeholder="Search products, brand or MPN" aria-label="Search products"><button type="submit">Search</button>`;
      const actions = main.querySelector(".header-actions,.ot-site-actions");
      if (actions) main.insertBefore(form, actions); else main.appendChild(form);
      form.addEventListener("submit", event => {
        event.preventDefault();
        const q = String(form.q.value || "").trim();
        if (!q) return;
        const target = isUK ? "shield-autocare-uk.html" : "us-catalogue.html";
        location.assign(`${target}?q=${encodeURIComponent(q)}`);
      });
    }
    header.dataset.otSubtleNav = "true";
  }

  function addHomeUtilityCategories(){
    if (isUK || !/^(?:|index\.html)$/.test(file)) return;
    const grid = document.querySelector(".category-grid-home");
    if (!grid || grid.dataset.otExtraCategories === "true") return;
    const extras = [
      ["Shop by vehicle","Find the correct application before you buy.","us-catalogue.html","04 / FITMENT"],
      ["Featured deals","Selected live products with clear online pricing.","deals.html","05 / DEALS"],
      ["All products","Search the full verified online catalogue.","us-catalogue.html","06 / ALL"]
    ];
    extras.forEach(([title,copy,href,kicker]) => {
      const a = document.createElement("a"); a.className = "ot-category-extra"; a.href = href;
      a.innerHTML = `<small>${kicker}</small><strong>${title}</strong><span>${copy}</span><b>Explore →</b>`;
      grid.appendChild(a);
    });
    grid.dataset.otExtraCategories = "true";
  }

  function movePurchaseBox(){
    const layout = document.querySelector(".product-layout");
    if (!layout || layout.classList.contains("ot-product-moved")) return;
    const liveBox = layout.querySelector(".product-copy .ot-live-buybox");
    const ukBox = layout.querySelector(".product-info .purchase-box");
    const box = liveBox || ukBox;
    if (!box) return;
    const aside = document.createElement("aside");
    aside.className = "ot-modern-buy-column";
    box.parentNode.removeChild(box);
    aside.appendChild(box);
    layout.appendChild(aside);
    layout.classList.add("ot-product-moved");
  }

  function applyQueryToCatalogue(){
    const q = new URLSearchParams(location.search).get("q");
    if (!q) return;
    const catalogueInput = document.querySelector(".ot-search-input");
    if (catalogueInput && catalogueInput.dataset.otQueryApplied !== "true") {
      catalogueInput.value = q;
      catalogueInput.dataset.otQueryApplied = "true";
      catalogueInput.dispatchEvent(new Event("input", { bubbles:true }));
    }
    if (isUK && /shield-autocare-uk\.html/.test(file)) {
      const cards = [...document.querySelectorAll(".product-card")];
      if (!cards.length) return;
      const needle = q.toLowerCase();
      cards.forEach(card => card.hidden = !String(card.textContent || "").toLowerCase().includes(needle));
      let note = document.querySelector(".ot-subtle-search-note");
      if (!note) {
        note = document.createElement("span"); note.className = "ot-subtle-search-note";
        const heading = document.querySelector("main .section-header,main .section-head");
        heading?.appendChild(note);
      }
      if (note) note.textContent = `Search results for “${q}”`;
    }
  }

  function run(){
    installLogo();
    document.querySelectorAll("header").forEach(enhanceNav);
    addHomeUtilityCategories();
    movePurchaseBox();
    applyQueryToCatalogue();
  }

  const observer = new MutationObserver(() => run());
  if (document.documentElement) observer.observe(document.documentElement,{childList:true,subtree:true});
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",run,{once:true}); else run();
  setTimeout(run,250); setTimeout(run,900); setTimeout(run,1800);
})();
