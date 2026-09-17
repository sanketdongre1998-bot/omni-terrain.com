(() => {
  "use strict";
  if(window.__OMNI_THEME_TOGGLE__)return;
  window.__OMNI_THEME_TOGGLE__=true;

  const file=decodeURIComponent(String(location.pathname||"/").split("/").filter(Boolean).pop()||"").toLowerCase();
  const isHome=!file||file==="index.html"||file==="uk.html";
  if(!isHome)document.documentElement.classList.add("ot-master-header-pending");

  const styleAssets=[
    ["otSubtleStorefront","/assets/omni-subtle-storefront.css?v=20260912-1"],
    ["otSubtleEnhancements","/assets/omni-subtle-enhancements.css?v=20260912-1"],
    ["otUiConsistency","/assets/ui-consistency.css?v=20260917-1"],
    ["otMasterDropdown","/assets/master-dropdown.css?v=20260917-3"],
    ["otHeaderFirstPaintLock","/assets/header-first-paint-lock.css?v=20260917-2"],
    ["otMobilePerformance","/assets/mobile-performance.css?v=20260917-1"]
  ];
  if(!isHome)styleAssets.push(["otInternalShellFinal","/assets/internal-shell-final.css?v=20260917-1"]);
  if(isHome)styleAssets.push(["otHomepageCategorybarSync","/assets/homepage-categorybar-sync.css?v=20260917-1"]);
  styleAssets.push(["otFinalResponsiveGuard","/assets/final-responsive-guard.css?v=20260918-3"]);

  const ensureStyles=()=>{
    styleAssets.forEach(([key,href])=>{
      const attr=`data-${key.replace(/[A-Z]/g,m=>"-"+m.toLowerCase())}`;
      let link=document.querySelector(`link[${attr}]`);
      if(!link){
        link=document.createElement("link");
        link.rel="stylesheet";
        link.href=href;
        link.dataset[key]="true";
        document.head.appendChild(link);
      }else if(link.getAttribute("href")!==href){
        link.href=href;
      }
    });
  };

  const ensureScript=(selector,src,dataKey)=>{
    let script=document.querySelector(selector);
    if(script){
      if(script.getAttribute("src")!==src)script.src=src;
      return script;
    }
    script=document.createElement("script");
    script.src=src;
    script.defer=true;
    script.dataset[dataKey]="true";
    (document.body||document.documentElement).appendChild(script);
    return script;
  };

  const ensureScripts=()=>{
    ensureScript('script[data-ot-subtle-storefront]',"/assets/omni-subtle-storefront.js?v=20260917-2","otSubtleStorefront");
    ensureScript('script[data-ot-master-dropdown]',"/assets/master-dropdown.js?v=20260917-3","otMasterDropdown");
    if(!isHome)ensureScript('script[data-ot-internal-shell-final]',"/assets/internal-shell-final.js?v=20260917-6","otInternalShellFinal");
    if(isHome)ensureScript('script[data-ot-homepage-categorybar-sync]',"/assets/homepage-categorybar-sync.js?v=20260917-2","otHomepageCategorybarSync");
  };

  const apply=()=>{
    document.documentElement.dataset.otTheme="light";
    document.documentElement.dataset.theme="light";
    document.documentElement.style.colorScheme="light";
    try{localStorage.setItem("omniTerrainTheme","light");localStorage.setItem("omni-theme","light");}catch(_){}
    document.querySelectorAll("[data-ot-theme-toggle],.ot-theme-toggle").forEach(node=>node.remove());
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute("content","#33495D");
    ensureStyles();
    ensureScripts();
  };

  apply();
})();
