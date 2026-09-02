(() => {
  "use strict";
  if (window.__OMNI_CATALOGUE_CONTROLS__) return;
  const file=decodeURIComponent(String(location.pathname||"").split("/").filter(Boolean).pop()||"").toLowerCase();
  if (!(file==="us-catalogue.html"||/^(automotive|marine|rv)(?:-|\.)/.test(file))) return;
  window.__OMNI_CATALOGUE_CONTROLS__=true;

  const text=node=>String(node?.textContent||"").replace(/\s+/g," ").trim();
  const basename=value=>{try{return decodeURIComponent(String(value||"").split("?")[0].split("#")[0].split("/").pop()||"").toLowerCase();}catch(_){return String(value||"").toLowerCase();}};
  const cardSlug=card=>basename(card.querySelector('a.card-link[href],a[href^="us-"]')?.getAttribute("href")||"");
  const priceOf=card=>{const raw=text(card.querySelector(".ot-live-inline-price,.ot-display-price,.price"));const n=Number(raw.replace(/[^0-9.]/g,""));return Number.isFinite(n)?n:NaN;};
  const brandOf=card=>{const k=text(card.querySelector(".kicker"));return (k.split("·")[0]||k||"Other").trim();};
  const haystack=card=>[text(card.querySelector("h3")),brandOf(card),text(card.querySelector(".mpn")),text(card)].join(" ").toLowerCase();
  const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));

  const featuredSlugs=[
    "us-husky-towing-81147.html","us-husky-towing-81148.html","us-coast2coast-iwcn9010f.html",
    "us-coast2coast-iwcn8010f.html","us-coast2coast-iwcimp103x.html","us-air-lift-60828hd.html",
    "us-bilstein-24-066464.html"
  ].map(basename);
  const featuredRank=new Map(featuredSlugs.map((slug,index)=>[slug,index]));

  function loadProducts(){
    return new Promise(resolve=>{
      try{if(typeof OMNI_US_PRODUCTS!=="undefined"&&Array.isArray(OMNI_US_PRODUCTS))return resolve(OMNI_US_PRODUCTS);}catch(_){}
      const existing=document.querySelector('script[data-ot-us-products]');
      if(existing){existing.addEventListener("load",()=>{try{resolve(Array.isArray(OMNI_US_PRODUCTS)?OMNI_US_PRODUCTS:[])}catch(_){resolve([])}},{once:true});return;}
      const s=document.createElement("script");s.src="/assets/us-products.js?v=4";s.dataset.otUsProducts="true";s.onload=()=>{try{resolve(Array.isArray(OMNI_US_PRODUCTS)?OMNI_US_PRODUCTS:[])}catch(_){resolve([])}};s.onerror=()=>resolve([]);document.head.appendChild(s);
    });
  }

  async function loadLiveRegistry(){
    try{
      const [registryResponse,stockResponse]=await Promise.all([fetch("/assets/us-live-products.json?v=checkout-registry",{cache:"no-store"}),fetch("/assets/us-stock-status.json?v=checkout-stock",{cache:"no-store"})]);
      if(!registryResponse.ok||!stockResponse.ok)throw new Error("live catalogue unavailable");
      const [data,stock]=await Promise.all([registryResponse.json(),stockResponse.json()]);
      const registryTime=Date.parse(String(data?.generatedAtUTC||"")),stockTime=Date.parse(String(stock?.generatedAtUTC||""));
      if(!Number.isFinite(registryTime)||!Number.isFinite(stockTime)||stockTime<registryTime)throw new Error("stock status is stale");
      const rows=Object.entries(data?.products||{}).filter(([id,p])=>{const s=stock?.products?.[id];return p&&p.enabled===true&&p.authorizationVerified===true&&p.liveKeystoneOrderable===true&&Number(p.priceCents)>0&&p.slug&&s?.checkoutReady===true&&s?.status==="in_stock"&&s?.liveApi==="ORDERABLE"&&basename(s.slug)===basename(p.slug);});
      return {ok:true,slugs:new Set(rows.map(([,p])=>basename(p.slug)))};
    }catch(_){return {ok:false,slugs:new Set()};}
  }

  function productSection(){return [...document.querySelectorAll("main .section")].find(sec=>sec.querySelector(".grid"))||null;}
  function customerDepartmentCopy(){
    const heroCopy=document.querySelector("main .hero p");
    if(file==="us-catalogue.html"){
      if(heroCopy)heroCopy.textContent="Shop automotive, towing, marine and RV parts by brand, MPN and category, with clear pricing and product support when you need it.";
      return;
    }
    if(!/^(automotive|marine|rv)(?:-|\.)/.test(file))return;
    if(heroCopy){
      if(file.startsWith("automotive"))heroCopy.textContent="Shop truck, SUV, towing, suspension, lighting and aftermarket automotive parts by brand and manufacturer part number.";
      else if(file.startsWith("marine"))heroCopy.textContent="Shop marine electrical, charging, navigation and boat-support equipment by brand and manufacturer part number.";
      else heroCopy.textContent="Shop RV, travel, towing and overlanding equipment for road trips, campsites and everyday adventures.";
    }
    document.querySelectorAll("main .section-head .muted").forEach(node=>{node.textContent="Shop by brand, MPN or price · Featured offers shown first";});
  }

  function decorateFeaturedCard(card){
    if(!featuredRank.has(cardSlug(card)))return;
    let note=card.querySelector(".ot-featured-card-note");
    if(!note){
      note=document.createElement("div");note.className="ot-featured-card-note";
      const price=card.querySelector(".ot-live-inline-price,.ot-display-price,.price");
      if(price)price.insertAdjacentElement("afterend",note);else card.querySelector(".card-link")?.insertAdjacentElement("beforebegin",note);
    }
    if(note)note.textContent="Featured offer · Free standard shipping";
    card.dataset.otFeaturedOffer="true";
  }

  function failClosed(allCards,grid){
    allCards.forEach(card=>{card.classList.add("ot-card-hidden");card.setAttribute("aria-hidden","true");card.dataset.otCheckoutSuppressed="true";});
    const state=document.createElement("div");state.className="ot-catalogue-safe-state";state.innerHTML='<strong>Online catalogue is updating.</strong><span>Checkout availability could not be verified right now. Refresh the page or contact product support before ordering.</span><a href="contact-and-order-help.html">Product support →</a>';
    grid.parentNode.insertBefore(state,grid);
  }

  async function mount(){
    customerDepartmentCopy();
    const section=productSection();const grid=section?.querySelector(".grid");if(!section||!grid)return;
    const allCards=[...grid.querySelectorAll(".card")];if(!allCards.length)return;
    const [products,registry]=await Promise.all([loadProducts(),loadLiveRegistry()]);
    if(!registry.ok||!registry.slugs.size){failClosed(allCards,grid);return;}
    const liveSlugs=registry.slugs;

    const cards=allCards.filter(card=>liveSlugs.has(cardSlug(card)));
    allCards.forEach(card=>{
      const live=liveSlugs.has(cardSlug(card));
      card.classList.toggle("ot-card-hidden",!live);card.setAttribute("aria-hidden",live?"false":"true");
      if(!live)card.dataset.otCheckoutSuppressed="true";else{delete card.dataset.otCheckoutSuppressed;decorateFeaturedCard(card);}
    });

    const defaultOrder=new Map(cards.map((c,i)=>[c,i]));
    const brands=[...new Set(cards.map(brandOf).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    const controls=document.createElement("div");controls.className="ot-catalogue-controls";
    controls.innerHTML=`<div class="ot-control-row"><div class="ot-search-wrap"><input class="ot-search-input" type="search" autocomplete="off" spellcheck="false" placeholder="Search brand, product or MPN" aria-label="Search products"><span class="ot-search-icon">⌕</span></div><select class="ot-filter-select" data-filter="brand" aria-label="Filter by brand"><option value="">All brands</option>${brands.map(b=>`<option value="${esc(b)}">${esc(b)}</option>`).join("")}</select><select class="ot-filter-select" data-filter="price" aria-label="Filter by price"><option value="">All prices</option><option value="0-50">Under $50</option><option value="50-100">$50–$100</option><option value="100-200">$100–$200</option><option value="200-999999">$200+</option></select><select class="ot-filter-select" data-filter="sort" aria-label="Sort products"><option value="default">Featured</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option><option value="brand">Brand A–Z</option></select></div><div class="ot-control-meta"><span>Showing <b data-visible-count>${cards.length}</b> products.</span><button class="ot-clear-filters" type="button">Clear filters</button></div><div class="ot-search-results" role="listbox"></div>`;
    grid.parentNode.insertBefore(controls,grid);

    if(!document.getElementById("otFeaturedCardStyles")){
      const style=document.createElement("style");style.id="otFeaturedCardStyles";style.textContent=".ot-featured-card-note{margin:4px 0 8px;color:#167047;font-size:11px;font-weight:800}.card[data-ot-featured-offer=true]{border-color:#d7b04c}.ot-catalogue-safe-state{display:grid;gap:8px;padding:24px;border:1px solid #e4d1a7;border-radius:16px;background:#fff9ec;color:#5f4a22}.ot-catalogue-safe-state strong{color:#071a30}.ot-catalogue-safe-state span{font-size:12px;line-height:1.6}.ot-catalogue-safe-state a{font-weight:850;color:#071a30}";document.head.appendChild(style);
    }

    const input=controls.querySelector(".ot-search-input"),brandSel=controls.querySelector('[data-filter="brand"]'),priceSel=controls.querySelector('[data-filter="price"]'),sortSel=controls.querySelector('[data-filter="sort"]'),count=controls.querySelector("[data-visible-count]"),results=controls.querySelector(".ot-search-results");
    function apply(){
      const q=input.value.trim().toLowerCase(),brand=brandSel.value,range=priceSel.value;let visible=0;
      allCards.forEach(card=>{
        if(card.dataset.otCheckoutSuppressed==="true"){card.classList.add("ot-card-hidden");return;}
        let ok=!q||haystack(card).includes(q);if(ok&&brand)ok=brandOf(card)===brand;if(ok&&range){const[lo,hi]=range.split("-").map(Number);const p=priceOf(card);ok=Number.isFinite(p)&&p>=lo&&p<hi;}card.classList.toggle("ot-card-hidden",!ok);if(ok)visible++;
      });count.textContent=String(visible);
      const sorted=[...cards];
      if(sortSel.value==="price-asc")sorted.sort((a,b)=>(priceOf(a)||Infinity)-(priceOf(b)||Infinity));
      else if(sortSel.value==="price-desc")sorted.sort((a,b)=>(priceOf(b)||-Infinity)-(priceOf(a)||-Infinity));
      else if(sortSel.value==="brand")sorted.sort((a,b)=>brandOf(a).localeCompare(brandOf(b)));
      else sorted.sort((a,b)=>{const ai=featuredRank.get(cardSlug(a)),bi=featuredRank.get(cardSlug(b));if(ai!==undefined||bi!==undefined)return(ai===undefined?999:ai)-(bi===undefined?999:bi);return defaultOrder.get(a)-defaultOrder.get(b);});
      sorted.forEach(c=>grid.appendChild(c));
    }
    function showSuggestions(){
      const q=input.value.trim().toLowerCase();if(q.length<2){results.classList.remove("open");results.innerHTML="";return;}
      const hits=products.filter(p=>liveSlugs.has(basename(p.slug))&&[p.title,p.brand,p.mpn,p.description].join(" ").toLowerCase().includes(q)).slice(0,10);
      results.innerHTML=hits.length?hits.map(p=>`<a class="ot-search-result" role="option" href="${esc(p.slug)}"><span><strong>${esc(p.title||p.mpn)}</strong><span>${esc(p.brand||"")} · MPN ${esc(p.mpn||"")}</span></span><em>Shop now →</em></a>`).join(""):'<div class="ot-no-result">No matching products. Try a brand, MPN or broader search.</div>';results.classList.add("open");
    }
    input.addEventListener("input",()=>{apply();showSuggestions();});[brandSel,priceSel,sortSel].forEach(el=>el.addEventListener("change",apply));controls.querySelector(".ot-clear-filters").addEventListener("click",()=>{input.value="";brandSel.value="";priceSel.value="";sortSel.value="default";results.classList.remove("open");apply();input.focus();});document.addEventListener("click",e=>{if(!controls.contains(e.target))results.classList.remove("open")});input.addEventListener("focus",showSuggestions);
    setTimeout(()=>{cards.forEach(decorateFeaturedCard);apply();},250);
  }

  function addAssets(){if(!document.querySelector('link[data-ot-catalogue-controls]')){const l=document.createElement("link");l.rel="stylesheet";l.href="/assets/catalogue-controls.css?v=2";l.dataset.otCatalogueControls="true";document.head.appendChild(l);}mount();}
  function start(){
    if(file==="us-catalogue.html"&&!window.__OMNI_CATALOGUE_WIDE_READY__){document.addEventListener("omni:catalogue-ready",addAssets,{once:true});return;}
    addAssets();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
