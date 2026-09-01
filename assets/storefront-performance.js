(() => {
  "use strict";
  if (window.__OMNI_PERFORMANCE__) return;
  window.__OMNI_PERFORMANCE__ = true;

  const path=decodeURIComponent(String(location.pathname||"").split("/").filter(Boolean).pop()||"").toLowerCase();
  const mobile=window.matchMedia&&window.matchMedia("(max-width:760px)").matches;

  if(!document.querySelector('script[data-ot-customer-copy]')){
    const marketing=document.createElement("script");
    marketing.src="/assets/customer-marketing-copy.js?v=1";
    marketing.defer=true;
    marketing.dataset.otCustomerCopy="true";
    document.head.appendChild(marketing);
  }

  if(!document.querySelector('script[data-ot-growth-marketing]')){
    const growth=document.createElement("script");
    growth.src="/assets/growth-marketing.js?v=1";
    growth.defer=true;
    growth.dataset.otGrowthMarketing="true";
    document.head.appendChild(growth);
  }

  if(!document.querySelector('script[data-ot-analytics-events]')){
    const analytics=document.createElement("script");
    analytics.src="/assets/analytics-events.js?v=1";
    analytics.defer=true;
    analytics.dataset.otAnalyticsEvents="true";
    document.head.appendChild(analytics);
  }

  // Checkout eligibility now comes only from the published authorization-gated registry.
  // Do not synthesize storefront-wide eligibility in the browser.

  // Keep public catalogue scale messaging broad and customer-friendly.
  if(path===""||path==="index.html"){
    const softenHomeCounts=()=>{
      document.querySelectorAll(".home-proof b").forEach(node=>{
        if(/^1,?000\+?$/.test(String(node.textContent||"").trim())) node.textContent="300+";
      });
      const labels=["Truck & SUV","Boat & Marine","RV & Travel"];
      document.querySelectorAll(".category-home .count").forEach((node,index)=>{node.textContent=labels[index]||"Shop category";});
    };
    if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",softenHomeCounts,{once:true}); else softenHomeCounts();
    if(!document.querySelector('script[data-ot-live-priority]')){
      const priority=document.createElement("script");
      priority.src="/assets/live-storefront-priority.js?v=7";
      priority.defer=true;
      priority.dataset.otLivePriority="true";
      document.head.appendChild(priority);
    }
  }

  // Load the final responsive image layer after legacy page CSS.
  if(!document.querySelector('link[data-ot-image-layout]')){
    const imageCss=document.createElement("link");imageCss.rel="stylesheet";imageCss.href="/assets/image-layout-fix.css?v=2";imageCss.dataset.otImageLayout="true";document.head.appendChild(imageCss);
  }
  // Catalogue/department pages get the shared search + filter runtime.
  if(path==="us-catalogue.html"||/^(automotive|marine|rv)(?:-|\.)/.test(path)){
    if(!document.querySelector('script[data-ot-catalogue-controls]')){
      const controls=document.createElement("script");controls.src="/assets/catalogue-controls.js?v=8";controls.defer=true;controls.dataset.otCatalogueControls="true";document.head.appendChild(controls);
    }
  }

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = Boolean(connection && connection.saveData);
  const slowNetwork = Boolean(connection && /(^|-)2g$|3g/.test(String(connection.effectiveType || "")));
  const lowMemory = Number(navigator.deviceMemory || 8) <= 4;
  const lowCpu = Number(navigator.hardwareConcurrency || 8) <= 4;
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lite = saveData || slowNetwork || reducedMotion || (lowMemory && lowCpu);

  if (lite) document.documentElement.classList.add("ot-perf-lite");

  const imageFrame = (img) => img && img.closest ? img.closest(".media,.live-media") : null;
  const attachImageState = (img) => {
    if (!img || img.dataset.otImageStateBound) return;
    img.dataset.otImageStateBound = "1";
    const frame = imageFrame(img);
    if (!frame) return;
    const ready = () => frame.classList.remove("ot-media-failed");
    const failed = () => frame.classList.add("ot-media-failed");
    img.addEventListener("load", ready, { passive: true });
    img.addEventListener("error", failed, { passive: true });
    if (img.complete) {
      if (img.naturalWidth) ready(); else failed();
    }
  };

  const rightSizeVehicleImage=(img)=>{
    if(!mobile||!img||img.dataset.otMobileSized) return;
    const raw=String(img.getAttribute("src")||"");
    if(!raw.includes("vehiclepartimages.com/ImageServerAPI")) return;
    try{
      const u=new URL(raw,location.href);
      const hero=Boolean(img.closest(".product-visual,.hero-showcase"));
      u.searchParams.set("maxheight",hero?"620":"380");
      u.searchParams.set("maxwidth",hero?"760":"520");
      img.dataset.otMobileSized="1";
      img.src=u.toString();
    }catch(_){ }
  };

  // Runtime fallback for images added dynamically after HTML parsing.
  const tuneImage = (img, index = 1) => {
    if (!img || img.dataset.otPerfTuned) return;
    img.dataset.otPerfTuned = "1";
    rightSizeVehicleImage(img);
    img.decoding = "async";
    const priority = index === 0 || img.closest(".product-visual,.hero-showcase,.ot-motion-stage");
    if (priority) {
      img.loading = "eager";
      try { img.fetchPriority = "high"; } catch (_) {}
    } else {
      img.loading = "lazy";
      try { img.fetchPriority = "low"; } catch (_) {}
    }
    attachImageState(img);
  };

  const tuneAllImages = () => {
    document.querySelectorAll("img").forEach((img, index) => tuneImage(img, index));
  };

  tuneAllImages();
  if ("MutationObserver" in window) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.matches && node.matches("img")) tuneImage(node, 1);
          node.querySelectorAll && node.querySelectorAll("img").forEach((img) => tuneImage(img, 1));
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
  }

  // Avoid expensive decorative work while the tab is hidden.
  document.addEventListener("visibilitychange", () => {
    document.documentElement.classList.toggle("ot-page-hidden", document.hidden);
  });
})();