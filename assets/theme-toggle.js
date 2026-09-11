(() => {
  "use strict";
  if(window.__OMNI_THEME_TOGGLE__)return;
  window.__OMNI_THEME_TOGGLE__=true;
  const ensureTheme=()=>{
    let base=document.querySelector('link[data-ot-yahoo-retail]');
    if(!base){base=document.createElement("link");base.rel="stylesheet";base.href="/assets/bnq-yahoo-light.css?v=20260912-1";base.dataset.otYahooRetail="true";}
    document.head.appendChild(base);
    let tokens=document.querySelector('link[data-ot-yahoo-tokens]');
    if(!tokens){tokens=document.createElement("link");tokens.rel="stylesheet";tokens.href="/assets/yahoo-purple-tokens.css?v=20260912-1";tokens.dataset.otYahooTokens="true";}
    document.head.appendChild(tokens);
  };
  const apply=()=>{
    document.documentElement.dataset.otTheme="light";
    document.documentElement.dataset.theme="light";
    document.documentElement.style.colorScheme="light";
    try{localStorage.setItem("omniTerrainTheme","light");localStorage.setItem("omni-theme","light");}catch(_){}
    document.querySelectorAll("[data-ot-theme-toggle],.ot-theme-toggle").forEach(node=>node.remove());
    const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute("content","#6001D2");
    ensureTheme();
  };
  apply();
  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",()=>{apply();setTimeout(ensureTheme,0);setTimeout(ensureTheme,750);},{once:true});
  }else{
    setTimeout(ensureTheme,0);setTimeout(ensureTheme,750);
  }
})();
