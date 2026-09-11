(() => {
  "use strict";
  if(window.__OMNI_THEME_TOGGLE__)return;
  window.__OMNI_THEME_TOGGLE__=true;
  const ensureTheme=()=>{
    let link=document.querySelector('link[data-ot-yahoo-retail]');
    if(!link){
      link=document.createElement("link");
      link.rel="stylesheet";
      link.href="/assets/bnq-yahoo-light.css?v=20260912-1";
      link.dataset.otYahooRetail="true";
      document.head.appendChild(link);
    }
    return link;
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
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",apply,{once:true});
})();
