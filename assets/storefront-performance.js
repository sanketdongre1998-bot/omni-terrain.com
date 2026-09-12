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
  if(isUk){document.documentElement.classList.add("ot-uk-refresh");addCss("otUkRefreshCss","/assets/uk-storefront-refresh.css?v=retail-4");}

  addCss("otImageLayoutCss","/assets/image-layout-fix.css?v=2");
  addCss("otResponsiveCss","/assets/responsive-hardening.css?v=4");
  addCss("otBrandSpeedCss","/assets/brand-speed.css?v=16");
  addCss("otRetailRegionCss","/assets/retail-region-enhancements.css?v=2");
  addCss("otRetailColorSystem","/assets/retail-color-system.css?v=3");
  addCss("otRetailVisualRefinement","/assets/retail-visual-refinement.css?v=1");

  const scrubLegacyHome=()=>{
    if(!home)return;
    document.documentElement.classList.add("ot-home-retail-v2");
    document.querySelectorAll(".announcement,.market-strip,#header,header.header,.launch-strip,.mobile-store-bar").forEach(node=>{
      if(!node.classList.contains("ot-ref-header"))node.remove();
    });
    document.querySelectorAll("[data-ot-theme-toggle],.ot-theme-toggle").forEach(node=>node.remove());
  };

  if(home||file==="uk.html"){
    if(home){scrubLegacyHome();ready(scrubLegacyHome);}
    addCss("otReferenceStorefrontCss","/assets/reference-storefront.css?v=3");
    addScript("otReferenceStorefrontJs","/assets/reference-storefront.js?v=3");
    addCss("otReferenceStorefrontFidelityCss","/assets/reference-storefront-fidelity.css?v=1");
    addScript("otReferenceStorefrontFidelityJs","/assets/reference-storefront-fidelity.js?v=1");
    if(home&&"MutationObserver" in window){
      const shellObserver=new MutationObserver(()=>scrubLegacyHome());
      const target=document.body||document.documentElement;
      shellObserver.observe(target,{childList:true,subtree:false});
      setTimeout(()=>shellObserver.disconnect(),7000);
    }
  }

  addScript("otRetailRegionJs","/assets/retail-region-enhancements.js?v=2");

  if(file==="us-catalogue.html"){addCss("otCataloguePremiumCss","/assets/catalogue-premium.css?v=retail-3");addScript("otCataloguePremiumJs","/assets/catalogue-premium.js?v=2");addScript("otCatalogueWideJs","/assets/catalogue-wide.js?v=2");addScript("otCatalogueControlsJs","/assets/catalogue-controls.js?v=11");}
  if(file==="cart.html"||file==="checkout.html"){addCss("otCartPremiumCss","/assets/cart-checkout-premium.css?v=retail-3");addScript("otCartPremiumJs","/assets/cart-checkout-premium.js?v=2");}

  /* Always load last: fixes mobile overflow, dark-footer contrast and ad landing polish. */
  addCss("otAdReadyStabilityCss","/assets/ad-ready-stability.css?v=1");

  function sanitizeStructuredData(){
    document.querySelectorAll('script[type="application/ld+json"]').forEach(node=>{
      try{
        const data=JSON.parse(node.textContent||"{}");let changed=false;
        const walk=value=>{
          if(Array.isArray(value)){value.forEach(walk);return;}
          if(!value||typeof value!=="object")return;
          Object.keys(value).forEach(key=>{
            const current=value[key];
            if(typeof current==="string"){
              let next=current;
              if(/PRASAD INC LTD/i.test(next))next=next.replace(/PRASAD INC LTD(?:\s+trading as Omni Terrain)?/ig,"Omni Terrain");
              if(/PRP Xpert LLC/i.test(next))next=next.replace(/PRP Xpert LLC/ig,"Omni Terrain");
              if(next!==current){value[key]=next;changed=true;}
            }else walk(current);
          });
        };
        walk(data);if(changed)node.textContent=JSON.stringify(data);
      }catch(_){}
    });
  }

  function scrubPublicBusinessDetails(){
    const ukSensitive=/PRASAD INC LTD|07981226|19\s+Stones\s+Avenue|DA1\s*5GS/i;
    const usSensitive=/PRP Xpert LLC|30\s+N\s+Gould|Sheridan,?\s*WY\s*82801/i;
    document.querySelectorAll(".market-note,.legal-note,footer p").forEach(node=>{
      const text=String(node.textContent||"");
      if(isUk&&ukSensitive.test(text)){
        if(node.classList.contains("market-note"))node.textContent="UK storefront · Omni Terrain";else node.remove();
      }else if(!isUk&&usSensitive.test(text)){
        if(node.classList.contains("market-note"))node.textContent="U.S. storefront · Omni Terrain";else node.remove();
      }
    });
    sanitizeStructuredData();
  }

  function compactReferenceMobileNav(){
    const header=document.querySelector(".ot-ref-header");if(!header)return;
    const featured=header.querySelector(".ot-ref-nav .featured");
    const support=header.querySelector(".ot-ref-nav .ot-ref-width>a:last-child");
    [featured,support].forEach(node=>{if(node&&!node.dataset.otDesktopLabel)node.dataset.otDesktopLabel=node.textContent||"";});
    const mobile=window.matchMedia&&window.matchMedia("(max-width:760px)").matches;
    if(featured)featured.textContent=mobile?"Deals":featured.dataset.otDesktopLabel;
    if(support)support.textContent=mobile?"Help":support.dataset.otDesktopLabel;
  }

  function stabilityPass(){
    scrubLegacyHome();
    scrubPublicBusinessDetails();
    compactReferenceMobileNav();
    if(file==="cart.html"||file==="checkout.html")document.querySelectorAll(".mobile-store-bar").forEach(node=>node.remove());
  }

  ready(()=>{
    stabilityPass();
    document.querySelectorAll(".brand,.ot-site-brand").forEach(brand=>{brand.querySelectorAll(".ot-brand-crest,.brand-badge,.brand-mark,.logo-badge,.logo-mark").forEach(n=>n.remove());let img=brand.querySelector("img.ot-brand-logo-image");if(!img){img=document.createElement("img");img.className="ot-brand-logo-image";brand.replaceChildren(img);}img.src="/assets/omni-terrain-approved-gt.webp?v=1";img.alt="Omni Terrain";img.width=270;img.height=90;img.decoding="async";img.loading="eager";img.style.objectFit="contain";img.style.objectPosition="left center";});
    if(document.querySelector(".product-layout")&&document.querySelector(".product-copy")&&document.querySelector(".product-visual")){addCss("otProductPremiumCss","/assets/product-page-premium.css?v=retail-3");addCss("otProductEnrichmentCss","/assets/product-content-enrichment.css?v=2");addScript("otProductPremiumJs","/assets/product-page-premium.js?v=2");}
  });

  if(window.addEventListener)window.addEventListener("resize",compactReferenceMobileNav,{passive:true});

  addScript("otAdReadinessJs","/assets/ad-readiness.js?v=2");
  setTimeout(()=>{addScript("otCustomerCopyJs","/assets/customer-marketing-copy.js?v=2");addScript("otGrowthJs","/assets/growth-marketing.js?v=4");addScript("otSavingsJs","/assets/offer-savings-copy.js?v=1");addScript("otAnalyticsJs","/assets/analytics-events.js?v=2");},700);

  const tune=img=>{if(!img||img.dataset.otPerfTuned)return;img.dataset.otPerfTuned="1";img.decoding="async";const priority=Boolean(img.closest(".product-visual,.ot-ref-hero"))||Boolean((home||file==="uk.html")&&img.closest(".ot-ref-category,.ot-ref-product"));img.loading=priority?"eager":"lazy";try{img.fetchPriority=img.closest(".product-visual,.ot-ref-hero")?"high":priority?"auto":"low";}catch(_){}};
  ready(()=>document.querySelectorAll("img").forEach(tune));
  if("MutationObserver" in window){
    const observer=new MutationObserver(ms=>{ms.forEach(m=>m.addedNodes.forEach(node=>{if(!(node instanceof Element))return;if(node.matches?.("img"))tune(node);node.querySelectorAll?.("img").forEach(tune);}));stabilityPass();});
    observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),12000);
  }
  [250,800,1800,3500].forEach(delay=>setTimeout(stabilityPass,delay));
})();