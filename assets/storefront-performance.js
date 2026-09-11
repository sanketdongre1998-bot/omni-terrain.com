(() => {
  "use strict";
  if(window.__OMNI_PERFORMANCE__)return;
  window.__OMNI_PERFORMANCE__=true;
  const file=decodeURIComponent(String(location.pathname||"").split("/").filter(Boolean).pop()||"").toLowerCase();
  const lang=String(document.documentElement.lang||"").toLowerCase();
  const home=file===""||file==="index.html";
  const isUk=lang.startsWith("en-gb")||file==="uk.html"||/^uk-/.test(file)||file==="shield-autocare-uk.html";
  const ready=fn=>document.readyState==="loading"?document.addEventListener("DOMContentLoaded",fn,{once:true}):fn();
  const addCss=(id,href)=>{let link=document.getElementById(id);if(!link){link=document.createElement("link");link.id=id;link.rel="stylesheet";document.head.appendChild(link);}link.href=href;return link;};
  const addScript=(id,src,type="text/javascript")=>{if(document.getElementById(id))return;const script=document.createElement("script");script.id=id;script.src=src;script.type=type;if(type!=="module")script.defer=true;document.head.appendChild(script);};

  document.documentElement.classList.add("ot-executive");
  document.documentElement.dataset.otTheme="light";document.documentElement.dataset.theme="light";document.documentElement.style.colorScheme="light";
  addCss("otExecutiveCss","/assets/executive-polish.css?v=retail-3");
  addCss("otAuthRetailCss","/assets/firebase-auth.css?v=retail-3");
  addScript("otAuthRetailJs","/assets/firebase-auth.js?v=retail-3","module");
  if(isUk){document.documentElement.classList.add("ot-uk-refresh");addCss("otUkRefreshCss","/assets/uk-storefront-refresh.css?v=retail-3");}

  addCss("otImageLayoutCss","/assets/image-layout-fix.css?v=2");
  addCss("otResponsiveCss","/assets/responsive-hardening.css?v=4");
  addCss("otBrandSpeedCss","/assets/brand-speed.css?v=16");
  addCss("otRetailRegionCss","/assets/retail-region-enhancements.css?v=2");

  const scrubLegacyHome=()=>{
    if(!home)return;
    document.documentElement.classList.add("ot-home-retail-v2");
    document.querySelectorAll(".announcement,.market-strip,#header,header.header,.launch-strip,.mobile-store-bar").forEach(node=>{
      if(!node.classList.contains("ot-retail-header"))node.remove();
    });
    document.querySelectorAll("[data-ot-theme-toggle],.ot-theme-toggle").forEach(node=>node.remove());
  };

  if(home){
    scrubLegacyHome();
    ready(scrubLegacyHome);
    addCss("otRetailGlitchFixes","/assets/retail-glitch-fixes.css?v=1");
    addCss("otHomePremiumCss","/assets/home-premium.css?v=retail-5");
    addScript("otHomePremiumJs","/assets/home-premium.js?v=retail-5");
    if("MutationObserver" in window){
      const shellObserver=new MutationObserver(()=>scrubLegacyHome());
      const target=document.body||document.documentElement;
      shellObserver.observe(target,{childList:true,subtree:false});
      setTimeout(()=>shellObserver.disconnect(),7000);
    }
  }

  if(file==="uk.html"){
    addCss("otUkHomePremiumCss","/assets/home-premium.css?v=retail-5");
    addCss("otUkHomeRetailCss","/assets/uk-home-retail.css?v=3");
    addScript("otUkHomeRetailJs","/assets/uk-home-retail.js?v=2");
  }

  addScript("otRetailRegionJs","/assets/retail-region-enhancements.js?v=2");

  if(file==="us-catalogue.html"){addCss("otCataloguePremiumCss","/assets/catalogue-premium.css?v=retail-3");addScript("otCataloguePremiumJs","/assets/catalogue-premium.js?v=2");addScript("otCatalogueWideJs","/assets/catalogue-wide.js?v=2");addScript("otCatalogueControlsJs","/assets/catalogue-controls.js?v=10");}
  if(file==="cart.html"||file==="checkout.html"){addCss("otCartPremiumCss","/assets/cart-checkout-premium.css?v=retail-3");addScript("otCartPremiumJs","/assets/cart-checkout-premium.js?v=2");}

  ready(()=>{
    scrubLegacyHome();
    document.querySelectorAll(".brand,.ot-site-brand").forEach(brand=>{brand.querySelectorAll(".ot-brand-crest,.brand-badge,.brand-mark,.logo-badge,.logo-mark").forEach(n=>n.remove());let img=brand.querySelector("img.ot-brand-logo-image");if(!img){img=document.createElement("img");img.className="ot-brand-logo-image";brand.replaceChildren(img);}img.src="/assets/omni-terrain-approved-gt.webp?v=1";img.alt="Omni Terrain";img.width=270;img.height=90;img.decoding="async";img.loading="eager";img.style.objectFit="contain";img.style.objectPosition="left center";});
    if(document.querySelector(".product-layout")&&document.querySelector(".product-copy")&&document.querySelector(".product-visual")){addCss("otProductPremiumCss","/assets/product-page-premium.css?v=retail-3");addCss("otProductEnrichmentCss","/assets/product-content-enrichment.css?v=2");addScript("otProductPremiumJs","/assets/product-page-premium.js?v=2");}
  });

  addScript("otAdReadinessJs","/assets/ad-readiness.js?v=2");
  setTimeout(()=>{addScript("otCustomerCopyJs","/assets/customer-marketing-copy.js?v=2");addScript("otGrowthJs","/assets/growth-marketing.js?v=4");addScript("otSavingsJs","/assets/offer-savings-copy.js?v=1");addScript("otAnalyticsJs","/assets/analytics-events.js?v=2");},700);

  const tune=img=>{if(!img||img.dataset.otPerfTuned)return;img.dataset.otPerfTuned="1";img.decoding="async";const priority=Boolean(img.closest(".product-visual,.ot-hero-deal"));img.loading=priority?"eager":"lazy";try{img.fetchPriority=priority?"high":"low";}catch(_){}};
  ready(()=>document.querySelectorAll("img").forEach(tune));
  if("MutationObserver" in window){const observer=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(node=>{if(!(node instanceof Element))return;if(node.matches?.("img"))tune(node);node.querySelectorAll?.("img").forEach(tune);})));observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),12000);}
})();