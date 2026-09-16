(() => {
  "use strict";
  if(window.__OMNI_THEME_TOGGLE__)return;
  window.__OMNI_THEME_TOGGLE__=true;

  const styleAssets=[
    ["otSubtleStorefront","/assets/omni-subtle-storefront.css?v=20260912-1"],
    ["otSubtleEnhancements","/assets/omni-subtle-enhancements.css?v=20260912-1"],
    ["otUiConsistency","/assets/ui-consistency.css?v=20260917-1"],
    ["otMasterDropdown","/assets/master-dropdown.css?v=20260917-1"],
    ["otHomepageCategorybarSync","/assets/homepage-categorybar-sync.css?v=20260917-1"]
  ];

  const ensureStyles=()=>{
    styleAssets.forEach(([key,href])=>{
      const attr=`data-${key.replace(/[A-Z]/g,m=>"-"+m.toLowerCase())}`;
      let link=document.querySelector(`link[${attr}]`);
      if(!link){
        link=document.createElement("link");
        link.rel="stylesheet";
        link.href=href;
        link.dataset[key]="true";
      }else if(link.getAttribute("href")!==href){
        link.href=href;
      }
      document.head.appendChild(link);
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
    document.body?document.body.appendChild(script):document.documentElement.appendChild(script);
    return script;
  };

  const ensureScripts=()=>{
    ensureScript('script[data-ot-subtle-storefront]',"/assets/omni-subtle-storefront.js?v=20260912-1","otSubtleStorefront");
    ensureScript('script[data-ot-master-dropdown]',"/assets/master-dropdown.js?v=20260917-1","otMasterDropdown");
    ensureScript('script[data-ot-homepage-categorybar-sync]',"/assets/homepage-categorybar-sync.js?v=20260917-1","otHomepageCategorybarSync");
  };

  const apply=()=>{
    document.documentElement.dataset.otTheme="light";
    document.documentElement.dataset.theme="light";
    document.documentElement.style.colorScheme="light";
    try{localStorage.setItem("omniTerrainTheme","light");localStorage.setItem("omni-theme","light");}catch(_){}
    document.querySelectorAll("[data-ot-theme-toggle],.ot-theme-toggle").forEach(node=>node.remove());
    const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute("content","#33495D");
    ensureStyles();
    ensureScripts();
  };

  apply();
  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",()=>{apply();setTimeout(ensureStyles,0);setTimeout(ensureScripts,0);setTimeout(ensureStyles,700);setTimeout(ensureScripts,700);},{once:true});
  }else{
    setTimeout(ensureStyles,0);setTimeout(ensureScripts,0);setTimeout(ensureStyles,700);setTimeout(ensureScripts,700);
  }
})();
