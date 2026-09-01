(() => {
  "use strict";
  if (window.__OMNI_CATALOGUE_CONTROLS__) return;
  const file=decodeURIComponent(String(location.pathname||"").split("/").filter(Boolean).pop()||"").toLowerCase();
  if (!(file==="us-catalogue.html"||/^(automotive|marine|rv)(?:-|\.)/.test(file))) return;
  window.__OMNI_CATALOGUE_CONTROLS__=true;

  const text=node=>String(node?.textContent||"").replace(/\s+/g," ").trim();
  const basename=value=>{try{return decodeURIComponent(String(value||"").split("?")[0].split("#")[0].split("/").pop()||"").toLowerCase();}catch(_){return String(value||"").toLowerCase();}};
  const money=cents=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2}).format((Number(cents)||0)/100);
  const cardSlug=card=>basename(card.querySelector('a.card-link[href],a[href^="us-"]')?.getAttribute("href")||"");
  const priceOf=card=>{
    const raw=text(card.querySelector(".ot-live-inline-price,.ot-display-price,.price"));
    const n=Number(raw.replace(/[^0-9.]/g,""));
    return Number.isFinite(n)?n:NaN;
  };
  const brandOf=card=>{
    const k=text(card.querySelector(".kicker"));
    return (k.split("·")[0]||k||"Other").trim();
  };
  const haystack=card=>[text(card.querySelector("h3")),brandOf(card),text(card.querySelector(".mpn")),text(card)].join(" ").toLowerCase();

  const launchOffers=new Map([
    ["us-husky-towing-81147.html",{priceCents:11999,compareAtCents:12626}],
    ["us-husky-towing-81148.html",{priceCents:14999,compareAtCents:15828}],
    ["us-coast2coast-iwcn8010f.html",{priceCents:19999,compareAtCents:21900}],
    ["us-air-lift-60828hd.html",{priceCents:20499,compareAtCents:21399}],
    ["us-bilstein-24-066464.html",{priceCents:13299,compareAtCents:13697}]
  ].map(([slug,offer])=>[basename(slug),offer]));
  const featuredSlugs=[...launchOffers.keys()];
  const featuredRank=new Map(featuredSlugs.map((slug,index)=>[slug,index]));

  function loadProducts(){
    return new Promise(resolve=>{
      try{ if(typeof OMNI_US_PRODUCTS!=="undefined"&&Array.isArray(OMNI_US_PRODUCTS)) return resolve(OMNI_US_PRODUCTS); }catch(_){ }
      const existing=document.querySelector('script[data-ot-us-products]');
      if(existing){existing.addEventListener("load",()=>{try{resolve(Array.isArray(OMNI_US_PRODUCTS)?OMNI_US_PRODUCTS:[])}catch(_){resolve([])}},{once:true});return;}
      const s=document.createElement("script");s.src="/assets/us-products.js?v=4";s.dataset.otUsProducts="true";s.onload=()=>{try{resolve(Array.isArray(OMNI_US_PRODUCTS)?OMNI_US_PRODUCTS:[])}catch(_){resolve([])}};s.onerror=()=>resolve([]);document.head.appendChild(s);
    });
  }

  async function loadLiveSlugs(){
    try{
      const response=await fetch("/assets/us-live-products.json?v=checkout-pool-301",{cache:"no-store"});
      if(!response.ok)return new Set();
      const data=await response.json();
      return new Set(Object.values(data?.products||{}).filter(p=>p&&p.enabled===true&&p.authorizationVerified===true&&Number(p.priceCents)>0&&p.slug).map(p=>basename(p.slug)));
    }catch(_){return new Set();}
  }

  function productSection(){
    return [...document.querySelectorAll("main .section")].find(sec=>sec.querySelector(".grid"))||null;
  }

  function softenDepartmentCounts(){
    if(!/^(automotive|marine|rv)(?:-|\.)/.test(file)) return;
    const heroCopy=document.querySelector("main .hero p");
    if(heroCopy) heroCopy.textContent="Browse products currently enabled for secure online checkout. Use search and filters to narrow by brand, MPN or price.";
    document.querySelectorAll("main .section-head .muted").forEach(node=>{node.textContent="Available to buy online · Five launch deals shown first";});
  }

  function decorateLaunchCard(card){
    const offer=launchOffers.get(cardSlug(card));
    if(!offer)return;
    let target=card.querySelector(".ot-live-inline-price,.ot-display-price,.price");
    if(!target){
      target=document.createElement("div");
      target.className="ot-live-inline-price";
      const link=card.querySelector(".card-link");
      if(link?.parentNode)link.parentNode.insertBefore(target,link);
    }
    if(target){target.className="ot-live-inline-price";target.textContent=money(offer.priceCents);}
    let note=card.querySelector(".ot-launch-card-note");
    if(!note){
      note=document.createElement("div");
      note.className="ot-launch-card-note";
      target?.insertAdjacentElement("afterend",note);
    }
    if(note)note.innerHTML=`Launch deal · <s>${money(offer.compareAtCents)}</s> · Save ${money(offer.compareAtCents-offer.priceCents)}`;
    card.dataset.otLaunchDeal="true";
  }

  async function mount(){
    softenDepartmentCounts();
    const section=productSection(); const grid=section?.querySelector(".grid"); if(!section||!grid) return;
    const allCards=[...grid.querySelectorAll(".card")]; if(!allCards.length) return;
    const [products,liveSlugs]=await Promise.all([loadProducts(),loadLiveSlugs()]);
    if(!liveSlugs.size) return;

    const cards=allCards.filter(card=>liveSlugs.has(cardSlug(card)));
    allCards.forEach(card=>{
      const live=liveSlugs.has(cardSlug(card));
      card.classList.toggle("ot-card-hidden",!live);
      card.setAttribute("aria-hidden",live?"false":"true");
      if(!live) card.dataset.otCheckoutSuppressed="true";
      else decorateLaunchCard(card);
    });

    const defaultOrder=new Map(cards.map((c,i)=>[c,i]));
    const brands=[...new Set(cards.map(brandOf).filter(Boolean))].sort((a,b)=>a.localeCompare(b));

    const controls=document.createElement("div");
    controls.className="ot-catalogue-controls";
    controls.innerHTML=`<div class="ot-control-row">
      <div class="ot-search-wrap"><input class="ot-search-input" type="search" autocomplete="off" spellcheck="false" placeholder="Search available product, brand or MPN" aria-label="Search products available online"><span class="ot-search-icon">⌕</span></div>
      <select class="ot-filter-select" data-filter="brand" aria-label="Filter by brand"><option value="">All brands</option>${brands.map(b=>`<option value="${b.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}">${b}</option>`).join("")}</select>
      <select class="ot-filter-select" data-filter="price" aria-label="Filter by price"><option value="">All prices</option><option value="0-50">Under $50</option><option value="50-100">$50–$100</option><option value="100-200">$100–$200</option><option value="200-999999">$200+</option></select>
      <select class="ot-filter-select" data-filter="sort" aria-label="Sort products"><option value="default">Recommended</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option><option value="brand">Brand A–Z</option></select>
    </div><div class="ot-control-meta"><span>Showing <b data-visible-count>${cards.length}</b> products available for secure checkout.</span><button class="ot-clear-filters" type="button">Clear filters</button></div><div class="ot-search-results" role="listbox"></div>`;
    grid.parentNode.insertBefore(controls,grid);

    if(!document.getElementById("otLaunchCardStyles")){
      const style=document.createElement("style");
      style.id="otLaunchCardStyles";
      style.textContent=".ot-launch-card-note{margin:4px 0 8px;color:#167047;font-size:11px;font-weight:800}.ot-launch-card-note s{color:#7a8490;font-weight:600}.card[data-ot-launch-deal=true]{border-color:#d7b04c}";
      document.head.appendChild(style);
    }

    const input=controls.querySelector(".ot-search-input");
    const brandSel=controls.querySelector('[data-filter="brand"]');
    const priceSel=controls.querySelector('[data-filter="price"]');
    const sortSel=controls.querySelector('[data-filter="sort"]');
    const count=controls.querySelector("[data-visible-count]");
    const results=controls.querySelector(".ot-search-results");

    function apply(){
      const q=input.value.trim().toLowerCase(); const brand=brandSel.value; const range=priceSel.value;
      let visible=0;
      allCards.forEach(card=>{
        if(card.dataset.otCheckoutSuppressed==="true"){card.classList.add("ot-card-hidden");return;}
        let ok=!q||haystack(card).includes(q);
        if(ok&&brand) ok=brandOf(card)===brand;
        if(ok&&range){const [lo,hi]=range.split("-").map(Number);const p=priceOf(card);ok=Number.isFinite(p)&&p>=lo&&p<hi;}
        card.classList.toggle("ot-card-hidden",!ok); if(ok) visible++;
      });
      count.textContent=String(visible);
      const sorted=[...cards];
      if(sortSel.value==="price-asc") sorted.sort((a,b)=>(priceOf(a)||Infinity)-(priceOf(b)||Infinity));
      else if(sortSel.value==="price-desc") sorted.sort((a,b)=>(priceOf(b)||-Infinity)-(priceOf(a)||-Infinity));
      else if(sortSel.value==="brand") sorted.sort((a,b)=>brandOf(a).localeCompare(brandOf(b)));
      else sorted.sort((a,b)=>{
        const ai=featuredRank.get(cardSlug(a)), bi=featuredRank.get(cardSlug(b));
        if(ai!==undefined||bi!==undefined) return (ai===undefined?999:ai)-(bi===undefined?999:bi);
        return defaultOrder.get(a)-defaultOrder.get(b);
      });
      sorted.forEach(c=>grid.appendChild(c));
    }

    function showSuggestions(){
      const q=input.value.trim().toLowerCase();
      if(q.length<2){results.classList.remove("open");results.innerHTML="";return;}
      const hits=products.filter(p=>liveSlugs.has(basename(p.slug))&&[p.title,p.brand,p.mpn,p.description].join(" ").toLowerCase().includes(q)).slice(0,10);
      results.innerHTML=hits.length?hits.map(p=>`<a class="ot-search-result" role="option" href="${p.slug}"><span><strong>${String(p.title||p.mpn).replace(/</g,"&lt;").replace(/>/g,"&gt;")}</strong><span>${String(p.brand||"")} · MPN ${String(p.mpn||"")}</span></span><em>Buy online →</em></a>`).join(""):`<div class="ot-no-result">No checkout-ready match. Try a brand name, MPN or simpler product term.</div>`;
      results.classList.add("open");
    }

    input.addEventListener("input",()=>{apply();showSuggestions();});
    [brandSel,priceSel,sortSel].forEach(el=>el.addEventListener("change",apply));
    controls.querySelector(".ot-clear-filters").addEventListener("click",()=>{input.value="";brandSel.value="";priceSel.value="";sortSel.value="default";results.classList.remove("open");apply();input.focus();});
    document.addEventListener("click",e=>{if(!controls.contains(e.target))results.classList.remove("open")});
    input.addEventListener("focus",showSuggestions);

    if(!cards.length){
      const empty=document.createElement("div");
      empty.className="ot-no-result";
      empty.textContent="No products on this page are currently enabled for online checkout.";
      grid.parentNode.insertBefore(empty,grid);
    }
    setTimeout(()=>{cards.forEach(decorateLaunchCard);apply();},250);
  }

  function addAssets(){
    if(!document.querySelector('link[data-ot-catalogue-controls]')){const l=document.createElement("link");l.rel="stylesheet";l.href="/assets/catalogue-controls.css?v=1";l.dataset.otCatalogueControls="true";document.head.appendChild(l);}
    mount();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",addAssets,{once:true});else addAssets();
})();
