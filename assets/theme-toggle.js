(() => {
  "use strict";
  if(window.__OMNI_THEME_TOGGLE__)return;
  window.__OMNI_THEME_TOGGLE__=true;

  const styleAssets=[
    ["otSubtleStorefront","/assets/omni-subtle-storefront.css?v=20260912-1"],
    ["otSubtleEnhancements","/assets/omni-subtle-enhancements.css?v=20260912-1"]
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
      }
      document.head.appendChild(link);
    });
  };

  const ensureScript=()=>{
    if(document.querySelector('script[data-ot-subtle-storefront]'))return;
    const script=document.createElement("script");
    script.src="/assets/omni-subtle-storefront.js?v=20260912-1";
    script.defer=true;
    script.dataset.otSubtleStorefront="true";
    document.body?document.body.appendChild(script):document.documentElement.appendChild(script);
  };

  const apply=()=>{
    document.documentElement.dataset.otTheme="light";
    document.documentElement.dataset.theme="light";
    document.documentElement.style.colorScheme="light";
    try{localStorage.setItem("omniTerrainTheme","light");localStorage.setItem("omni-theme","light");}catch(_){}
    document.querySelectorAll("[data-ot-theme-toggle],.ot-theme-toggle").forEach(node=>node.remove());
    const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute("content","#33495D");
    ensureStyles();
    ensureScript();
  };

  apply();
  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",()=>{apply();setTimeout(ensureStyles,0);setTimeout(ensureScript,0);setTimeout(ensureStyles,700);},{once:true});
  }else{
    setTimeout(ensureStyles,0);setTimeout(ensureScript,0);setTimeout(ensureStyles,700);
  }
})();
