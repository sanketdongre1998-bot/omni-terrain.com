(() => {
  "use strict";
  if (window.__OMNI_MASTER_DROPDOWN__) return;
  window.__OMNI_MASTER_DROPDOWN__ = true;

  const path = String(location.pathname || "/").toLowerCase();
  const lang = String(document.documentElement.lang || "").toLowerCase();
  const isUK = lang === "en-gb" || /(^|\/)uk(?:-|\.|\/)/.test(path) || /shield-autocare-uk/.test(path);
  const desktop = () => !window.matchMedia || window.matchMedia("(min-width:861px)").matches;

  const usMenus = {
    auto: {
      title: "Auto Parts",
      items: [["New Auto Parts","/automotive.html"],["Used OEM Auto Parts","/used-auto-parts.html"],["Towing & Hauling","/automotive.html"],["Replacement Parts","/automotive.html"],["Shop New Auto Parts →","/automotive.html","all"]]
    },
    marine: {
      title: "Marine",
      items: [["Marine Electronics","/marine.html"],["Deck & Hardware","/marine.html"],["Lighting","/marine.html"],["Safety & Navigation","/marine.html"],["Shop All Marine →","/marine.html","all"]]
    },
    rv: {
      title: "RV & Overlanding",
      items: [["RV & Overlanding","/rv.html"],["Solar & 12V","/us-catalogue.html"],["Travel & Campsite","/rv.html"],["Towing","/automotive.html"],["Shop RV & Overlanding →","/rv.html","all"]]
    },
    shop: {
      title: "Shop All",
      items: [["All Products","/us-catalogue.html"],["Auto Parts","/automotive.html"],["Used OEM","/used-auto-parts.html"],["Marine","/marine.html"],["RV & Overlanding","/rv.html"],["Featured Deals →","/deals.html","all"]]
    }
  };

  const ukMenus = {
    shop: {
      title: "Shop UK",
      items: [["All Available Products","/shield-autocare-uk.html"],["Campervan Fridges","/shield-autocare-uk.html#fridges"],["Windows","/shield-autocare-uk.html#windows"],["Blinds & Flyscreens","/shield-autocare-uk.html#blinds"],["Tyres","/uk-tyres.html"],["Shop Available Products →","/shield-autocare-uk.html","all"]]
    },
    auto: {
      title: "Auto Parts",
      items: [["Available UK Products","/shield-autocare-uk.html"],["Tyres","/uk-tyres.html"],["Product & Fitment Help","/uk-contact.html"],["Delivery Information","/uk-shipping-delivery-policy.html"],["UK Support →","/uk-contact.html","all"]]
    },
    marine: {
      title: "Marine",
      items: [["Available UK Products","/shield-autocare-uk.html"],["Product & Fitment Help","/uk-contact.html"],["Delivery Information","/uk-shipping-delivery-policy.html"],["UK Support →","/uk-contact.html","all"]]
    }
  };

  function keyFor(label) {
    const text = String(label || "").trim().toLowerCase();
    if (/shop all|shop available|shop uk|available products/.test(text)) return "shop";
    if (/new auto|auto parts|automotive/.test(text)) return "auto";
    if (/marine/.test(text)) return "marine";
    if (/rv|overland/.test(text)) return "rv";
    return "";
  }

  function menuMarkup(menu) {
    return `<h4>${menu.title}</h4>` + menu.items.map(([name,href,cls]) => `<a${cls ? ` class="${cls}"` : ""} href="${href}">${name}</a>`).join("");
  }

  function closeAll(except = null) {
    document.querySelectorAll(".ot-master-nav-item.is-open,.ot-mega-wrap.is-open").forEach(item => {
      if (item === except) return;
      item.classList.remove("is-open");
      item.querySelector(":scope > a")?.setAttribute("aria-expanded","false");
    });
  }

  function enhanceLegacyNav(nav) {
    if (!nav || nav.dataset.otMasterDropdown === "true") return;
    nav.dataset.otMasterDropdown = "true";
    const menuSet = isUK ? ukMenus : usMenus;

    [...nav.children].forEach(node => {
      if (!(node instanceof HTMLAnchorElement)) return;
      if (node.closest(".ot-master-nav-item,.ot-mega-wrap")) return;
      const key = keyFor(node.textContent);
      const menu = menuSet[key];
      if (!menu) return;

      const wrap = document.createElement("span");
      wrap.className = "ot-master-nav-item";
      node.parentNode.insertBefore(wrap,node);
      wrap.appendChild(node);
      node.classList.add("ot-master-trigger");
      node.setAttribute("aria-haspopup","true");
      node.setAttribute("aria-expanded","false");

      const dropdown = document.createElement("div");
      dropdown.className = "ot-master-dropdown";
      dropdown.innerHTML = menuMarkup(menu);
      wrap.appendChild(dropdown);

      node.addEventListener("click", event => {
        if (!desktop()) return;
        event.preventDefault();
        event.stopPropagation();
        const opening = !wrap.classList.contains("is-open");
        closeAll(wrap);
        wrap.classList.toggle("is-open", opening);
        node.setAttribute("aria-expanded", opening ? "true" : "false");
      });
    });
  }

  function bindExistingMega() {
    document.querySelectorAll(".ot-mega-wrap").forEach(wrap => {
      if (wrap.dataset.otMasterBound === "true") return;
      wrap.dataset.otMasterBound = "true";
      const trigger = wrap.querySelector(":scope > a");
      if (!trigger) return;
      trigger.setAttribute("aria-haspopup","true");
      trigger.setAttribute("aria-expanded","false");
      trigger.addEventListener("click", event => {
        if (!desktop()) return;
        event.preventDefault();
        event.stopPropagation();
        const opening = !wrap.classList.contains("is-open");
        closeAll(wrap);
        wrap.classList.toggle("is-open", opening);
        trigger.setAttribute("aria-expanded", opening ? "true" : "false");
      });
    });
  }

  function run() {
    document.querySelectorAll("header#header .nav-links, header.header .nav, .used-header .used-nav > .used-width").forEach(enhanceLegacyNav);
    bindExistingMega();
  }

  document.addEventListener("click", event => {
    if (!event.target.closest(".ot-master-nav-item,.ot-mega-wrap")) closeAll();
  });
  document.addEventListener("keydown", event => { if (event.key === "Escape") closeAll(); });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",run,{once:true});
  else run();

  const observer = new MutationObserver(() => run());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(() => observer.disconnect(),6000);
})();
