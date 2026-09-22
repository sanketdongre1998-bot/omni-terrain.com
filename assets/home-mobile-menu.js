(() => {
  "use strict";
  if (window.__OMNI_HOME_MOBILE_MENU__) return;
  window.__OMNI_HOME_MOBILE_MENU__ = true;

  const file = decodeURIComponent(String(location.pathname || "/").split("/").filter(Boolean).pop() || "").toLowerCase();
  const isUS = !file || file === "index.html";
  const isUK = file === "uk.html";
  if (!isUS && !isUK) return;

  const style = document.createElement("style");
  style.id = "otHomeMobileMenuStyles";
  style.textContent = `
    .ot-home-mobile-menu-button,.ot-home-mobile-nav{display:none!important}
    @media(max-width:760px){
      .ot-reference-home .ot-ref-header{position:relative!important;overflow:visible!important}
      .ot-reference-home .ot-ref-nav{display:block!important;overflow:hidden!important}
      .ot-reference-home .ot-ref-nav>.ot-ref-width{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;width:100%!important;max-width:none!important;margin:0!important;padding:0!important;gap:0!important}
      .ot-reference-home .ot-ref-nav>.ot-ref-width>*:not(.ot-mobile-quick-link){display:none!important}
      .ot-reference-home .ot-ref-nav>.ot-ref-width>.ot-mobile-quick-link{display:flex!important;min-width:0!important;width:100%!important;height:42px!important;align-items:center!important;justify-content:center!important;padding:0 4px!important;border-right:1px solid #e3ebf2!important;background:#fff!important;color:#12325a!important;text-decoration:none!important;font:800 10px/1.05 Arial,"Helvetica Neue",sans-serif!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      .ot-reference-home .ot-ref-actions{gap:6px!important}
      .ot-reference-home .ot-home-mobile-menu-button{
        display:inline-flex!important;min-width:48px!important;min-height:38px!important;align-items:center!important;justify-content:center!important;
        margin:0!important;padding:0 9px!important;border:1px solid #cfdbea!important;border-radius:6px!important;background:#fff!important;
        color:#12325a!important;font:800 10px/1 Arial,"Helvetica Neue",sans-serif!important;box-shadow:none!important;cursor:pointer!important
      }
      .ot-reference-home .ot-home-mobile-menu-button[aria-expanded="true"]{background:#eef5fd!important;color:#075fca!important;border-color:#9ebce0!important}
      .ot-reference-home .ot-home-mobile-nav{
        position:absolute!important;left:0!important;right:0!important;top:100%!important;z-index:1500!important;display:none!important;
        width:100%!important;max-height:min(70vh,520px)!important;overflow-y:auto!important;padding:8px 12px 14px!important;
        border-top:1px solid #d9e4ee!important;background:#fff!important;box-shadow:0 14px 30px rgba(8,42,80,.18)!important
      }
      .ot-reference-home .ot-home-mobile-nav.open{display:grid!important;grid-template-columns:1fr!important}
      .ot-reference-home .ot-home-mobile-nav a{
        display:flex!important;min-height:46px!important;align-items:center!important;justify-content:space-between!important;padding:0 10px!important;
        border-bottom:1px solid #e7eef5!important;background:#fff!important;color:#12325a!important;text-decoration:none!important;
        font:800 12px/1.25 Arial,"Helvetica Neue",sans-serif!important
      }
      .ot-reference-home .ot-home-mobile-nav a:last-child{border-bottom:0!important}
      .ot-reference-home .ot-home-mobile-nav a::after{content:"›";color:#7b8da3;font-size:18px;font-weight:500}
      .ot-reference-home .ot-home-mobile-nav a.featured{color:#b97700!important}
    }
    @media(max-width:420px){
      .ot-reference-home .ot-ref-logo img{width:132px!important;height:40px!important}
      .ot-reference-home .ot-ref-account,.ot-reference-home .ot-ref-cart{min-width:40px!important;padding-inline:3px!important}
      .ot-reference-home .ot-home-mobile-menu-button{min-width:44px!important;padding:0 7px!important}
    }
  `;
  document.head.appendChild(style);

  function menuLinks() {
    if (isUK) return [
      ["Available Products", "/shield-autocare-uk.html", ""],
      ["Fridges", "/shield-autocare-uk.html#fridges", ""],
      ["Windows", "/shield-autocare-uk.html#windows", ""],
      ["Blinds & Flyscreens", "/shield-autocare-uk.html#blinds", ""],
      ["Cart", "/uk-cart.html", ""],
      ["Support", "/uk-contact.html", ""]
    ];
    return [
      ["Shop All Products", "/us-catalogue.html", ""],
      ["New Auto Parts", "/automotive.html", ""],
      ["Used OEM Auto Parts", "/used-auto-parts.html", ""],
      ["Marine", "/marine.html", ""],
      ["Solar & 12V", "/us-catalogue.html", ""],
      ["Overlanding", "/rv.html", ""],
      ["Featured Deals", "/deals.html", "featured"],
      ["Support", "/contact-and-order-help.html", ""]
    ];
  }

  function mount() {
    const header = document.querySelector(".ot-ref-header");
    const actions = header?.querySelector(".ot-ref-actions");
    const desktopNav = header?.querySelector(".ot-ref-nav");
    if (!header || !actions || !desktopNav) return false;
    if (header.querySelector(".ot-home-mobile-menu-button")) return true;

    const quickHost = desktopNav.querySelector(":scope > .ot-ref-width");
    if (quickHost && !quickHost.querySelector(".ot-mobile-quick-link")) {
      const quickLinks = isUK ? [
        ["Products", "/shield-autocare-uk.html"],
        ["Fridges", "/shield-autocare-uk.html#fridges"],
        ["Windows", "/shield-autocare-uk.html#windows"],
        ["Support", "/uk-contact.html"]
      ] : [
        ["New Auto", "/automotive.html"],
        ["Used OEM", "/used-auto-parts.html"],
        ["Marine", "/marine.html"],
        ["Deals", "/deals.html"]
      ];
      quickLinks.forEach(([label, href]) => {
        const link = document.createElement("a");
        link.className = "ot-mobile-quick-link";
        link.href = href;
        link.textContent = label;
        quickHost.appendChild(link);
      });
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "ot-home-mobile-menu-button";
    button.textContent = "Menu";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", "otHomeMobileNav");
    button.setAttribute("aria-label", "Open store menu");
    actions.appendChild(button);

    const nav = document.createElement("nav");
    nav.id = "otHomeMobileNav";
    nav.className = "ot-home-mobile-nav";
    nav.setAttribute("aria-label", "Mobile store navigation");
    nav.innerHTML = menuLinks().map(([label, href, cls]) => `<a${cls ? ` class="${cls}"` : ""} href="${href}">${label}</a>`).join("");
    desktopNav.insertAdjacentElement("afterend", nav);

    // The visible 4-item phone quick-nav uses the existing desktop nav markup.
    // Convert category dropdown buttons into direct mobile destinations so every
    // compact item is useful with one tap; the Menu button still exposes all links.
    const quickButtons = [...desktopNav.querySelectorAll(":scope > .ot-ref-width > .ot-ref-nav-item > button")];
    quickButtons.forEach((quickButton, index) => {
      quickButton.addEventListener("click", event => {
        if (window.innerWidth > 760) return;
        event.preventDefault();
        event.stopPropagation();
        const label = String(quickButton.textContent || "").toLowerCase();
        let href = isUK ? "/shield-autocare-uk.html" : "/automotive.html";
        if (label.includes("marine")) href = isUK ? "/shield-autocare-uk.html" : "/marine.html";
        location.href = href;
      });
    });

    const close = () => {
      nav.classList.remove("open");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open store menu");
    };
    const toggle = event => {
      event.stopPropagation();
      const open = !nav.classList.contains("open");
      if (open) {
        nav.classList.add("open");
        button.setAttribute("aria-expanded", "true");
        button.setAttribute("aria-label", "Close store menu");
      } else close();
    };

    button.addEventListener("click", toggle);
    nav.addEventListener("click", event => {
      if (event.target.closest("a")) close();
    });
    document.addEventListener("click", event => {
      if (!header.contains(event.target)) close();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") close();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) close();
    }, { passive: true });
    return true;
  }

  if (!mount()) {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (mount() || tries >= 40) clearInterval(timer);
    }, 100);
  }
})();
