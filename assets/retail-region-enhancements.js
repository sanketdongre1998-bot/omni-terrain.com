(() => {
  "use strict";
  if(window.__OMNI_REGION_ENHANCEMENTS__)return;
  window.__OMNI_REGION_ENHANCEMENTS__=true;

  const isUk=String(location.pathname||"").toLowerCase().endsWith("/uk.html")||String(document.documentElement.lang||"").toLowerCase().startsWith("en-gb");

  function normalizeRegionSwitches(){
    document.querySelectorAll(".ot-region-mini").forEach(group=>{
      const links=Array.from(group.querySelectorAll("a"));
      links.forEach(link=>{
        const href=String(link.getAttribute("href")||"").toLowerCase();
        const targetUk=href.includes("uk.html");
        link.classList.toggle("active",targetUk===isUk);
        if(targetUk)link.innerHTML='UK Store <small>GBP</small>';
        else link.innerHTML='US Store <small>USD</small>';
      });
    });

    document.querySelectorAll(".market-strip .container").forEach(container=>{
      container.classList.add("ot-centered-market");
      const links=Array.from(container.querySelectorAll("a"));
      links.forEach(link=>{
        const href=String(link.getAttribute("href")||"").toLowerCase();
        const targetUk=href.includes("uk.html");
        link.textContent=targetUk?"UK Store":"US Store";
        link.classList.toggle("market-link",targetUk===isUk);
      });
      const label=container.querySelector(".market-label");if(label)label.textContent="Choose store";
    });
  }

  function enhanceWelcome(overlay){
    if(!overlay||overlay.dataset.otRegionEnhanced)return;
    const copy=overlay.querySelector(".ot-welcome-copy");
    if(!copy)return;
    overlay.dataset.otRegionEnhanced="1";

    const logo=copy.querySelector("img");
    const switcher=document.createElement("div");
    switcher.className="ot-welcome-store-switch";
    switcher.setAttribute("aria-label","Choose Omni Terrain store");
    switcher.innerHTML=`<a href="/" class="${isUk?"":"active"}" ${isUk?"":"aria-current=\"page\""}>US Store</a><a href="/uk.html" class="${isUk?"active":""}" ${isUk?"aria-current=\"page\"":""}>UK Store</a>`;
    if(logo)logo.insertAdjacentElement("afterend",switcher);else copy.prepend(switcher);

    const form=copy.querySelector("form");
    const skip=copy.querySelector(".ot-welcome-skip");
    if(skip){
      skip.classList.add("ot-direct-continue");
      skip.textContent=isUk?"Continue to UK Store":"Continue to US Store";
      if(form&&!copy.querySelector(".ot-welcome-or")){
        const divider=document.createElement("div");divider.className="ot-welcome-or";divider.textContent="or";form.insertAdjacentElement("afterend",divider);
        divider.insertAdjacentElement("afterend",skip);
      }
    }
  }

  function scan(){
    normalizeRegionSwitches();
    document.querySelectorAll(".ot-welcome").forEach(enhanceWelcome);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",scan,{once:true});else scan();
  if("MutationObserver" in window){
    const observer=new MutationObserver(scan);
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),15000);
  }
})();
