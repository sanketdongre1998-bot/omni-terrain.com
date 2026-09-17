(() => {
  "use strict";
  if (window.__OMNI_MARINE_REMAN_NAV__) return;
  window.__OMNI_MARINE_REMAN_NAV__ = true;

  const isUK = String(document.documentElement.lang || "").toLowerCase() === "en-gb" || /(^|\/)uk(?:-|\.|\/)/i.test(location.pathname) || /shield-autocare-uk/i.test(location.pathname);
  if (isUK) return;

  const href = "/marine-reman.html";

  function addUnifiedDesktop() {
    const marineMenus = [...document.querySelectorAll(".ot-unified-dropdown")].filter(menu => menu.querySelector("h4")?.textContent.trim().toLowerCase() === "marine");
    marineMenus.forEach(menu => {
      if (menu.querySelector(`a[href="${href}"]`)) return;
      const link = document.createElement("a");
      link.href = href;
      link.innerHTML = "<strong>Remanufactured Marine Parts</strong>";
      const heading = menu.querySelector("h4");
      if (heading) heading.insertAdjacentElement("afterend", link); else menu.prepend(link);
    });
  }

  function addUnifiedMobile() {
    const nav = document.getElementById("otUnifiedMobileNav");
    if (!nav || nav.querySelector(`a[href="${href}"]`)) return;
    const marine = [...nav.querySelectorAll("a")].find(a => a.textContent.trim().toLowerCase() === "marine");
    const link = document.createElement("a");
    link.href = href;
    link.textContent = "Reman Marine Parts";
    if (marine) marine.insertAdjacentElement("afterend", link); else nav.appendChild(link);
  }

  function addHomeMobile() {
    const nav = document.getElementById("otHomeMobileNav");
    if (!nav || nav.querySelector(`a[href="${href}"]`)) return;
    const marine = [...nav.querySelectorAll("a")].find(a => a.textContent.trim().toLowerCase() === "marine");
    const link = document.createElement("a");
    link.href = href;
    link.textContent = "Reman Marine Parts";
    if (marine) marine.insertAdjacentElement("afterend", link); else nav.appendChild(link);
  }

  function addMarinePageCta() {
    const file = String(location.pathname || "").split("/").pop().toLowerCase();
    if (file !== "marine.html" || document.getElementById("otMarineRemanCta")) return;
    const main = document.querySelector("main");
    if (!main) return;
    const section = document.createElement("section");
    section.id = "otMarineRemanCta";
    section.style.cssText = "padding:18px 0;background:#eef6ff;border-bottom:1px solid #d7e5f1";
    section.innerHTML = `<div style="width:min(1180px,calc(100% - 36px));margin:auto;display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap"><div><strong style="display:block;color:#103a62;font-size:18px">Need a remanufactured marine part?</strong><span style="display:block;margin-top:4px;color:#647b90;font-size:13px">Search reman carburetors, trim & tilt components, starters, alternators and selected rebuildable marine parts.</span></div><a href="${href}" style="display:inline-flex;min-height:44px;align-items:center;padding:0 16px;border-radius:9px;background:#0869d5;color:#fff;text-decoration:none;font-weight:800;font-size:13px">View Reman Marine Parts →</a></div>`;
    main.insertBefore(section, main.firstChild);
  }

  const run = () => {
    addUnifiedDesktop();
    addUnifiedMobile();
    addHomeMobile();
    addMarinePageCta();
  };

  run();
  [120, 350, 800, 1600, 3000].forEach(ms => setTimeout(run, ms));
  if ("MutationObserver" in window) {
    const observer = new MutationObserver(() => run());
    const start = () => {
      if (!document.body) return;
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), 6000);
    };
    if (document.body) start(); else document.addEventListener("DOMContentLoaded", start, { once: true });
  }
})();
