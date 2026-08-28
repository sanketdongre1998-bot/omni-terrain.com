(() => {
  "use strict";
  if (window.__OMNI_CATALOGUE_CONTROLS__) return;
  const file=decodeURIComponent(String(location.pathname||"").split("/").filter(Boolean).pop()||"").toLowerCase();
  if (!(file==="us-catalogue.html"||/^(automotive|marine|rv)(?:-|\.)/.test(file))) return;
  window.__OMNI_CATALOGUE_CONTROLS__=true;

  const money=n=>Number.isFinite(n)?new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n):"";
  const text=node=>String(node?.textContent||"").replace(/\s+/g," ").trim();
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

  function loadProducts(){
    return new Promise(resolve=>{
      try{ if(typeof OMNI_US_PRODUCTS!=="undefined"&&Array.isArray(OMNI_US_PRODUCTS)) return resolve(OMNI_US_PRODUCTS); }catch(_){ }
      const existing=document.querySelector('script[data-ot-us-products]');
      if(existing){existing.addEventListener("load",()=>{try{resolve(Array.isArray(OMNI_US_PRODUCTS)?OMNI_US_PRODUCTS:[])}catch(_){resolve([])}},{once:true});return;}
      const s=document.createElement("script");s.src="/assets/us-products.js?v=3";s.dataset.otUsProducts="true";s.onload=()=>{try{resolve(Array.isArray(OMNI_US_PRODUCTS)?OMNI_US_PRODUCTS:[])}catch(_){resolve([])}};s.onerror=()=>resolve([]);document.head.appendChild(s);
    });
  }

  function productSection(){
    return [...document.querySelectorAll("main .section")].find(sec=>sec.querySelector(".grid"))||null;
  }

  async function mount(){
    const section=productSection(); const grid=section?.querySelector(".grid"); if(!section||!grid) return;
    const cards=[...grid.querySelectorAll(".card")]; if(!cards.length) return;
    const products=await loadProducts();
    const defaultOrder=new Map(cards.map((c,i)=>[c,i]));
    const brands=[...new Set(cards.map(brandOf).filter(Boolean))].sort((a,b)=>a.localeCompare(b));

    const controls=document.createElement("div");
    controls.className="ot-catalogue-controls";
    controls.innerHTML=`<div class="ot-control-row">
      <div class="ot-search-wrap"><input class="ot-search-input" type="search" autocomplete="off" spellcheck="false" placeholder="Search product, brand or MPN" aria-label="Search products"><span class="ot-search-icon">⌕</span></div>
      <select class="ot-filter-select" data-filter="brand" aria-label="Filter by brand"><option value="">All brands</option>${brands.map(b=>`<option value="${b.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}">${b}</option>`).join("")}</select>
      <select class="ot-filter-select" data-filter="price" aria-label="Filter by price"><option value="">All prices</option><option value="0-50">Under $50</option><option value="50-100">$50–$100</option><option value="100-200">$100–$200</option><option value="200-999999">$200+</option></select>
      <select class="ot-filter-select" data-filter="sort" aria-label="Sort products"><option value="default">Recommended</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option><option value="brand">Brand A–Z</option></select>
    </div><div class="ot-control-meta"><span><b data-visible-count>${cards.length}</b> products on this page · Search checks the full 1,000-product catalogue.</span><button class="ot-clear-filters" type="button">Clear filters</button></div><div class="ot-search-results" role="listbox"></div>`;
    grid.parentNode.insertBefore(controls,grid);

    const input=controls.querySelector(".ot-search-input");
    const brandSel=controls.querySelector('[data-filter="brand"]');
    const priceSel=controls.querySelector('[data-filter="price"]');
    const sortSel=controls.querySelector('[data-filter="sort"]');
    const count=controls.querySelector("[data-visible-count]");
    const results=controls.querySelector(".ot-search-results");

    function apply(){
      const q=input.value.trim().toLowerCase(); const brand=brandSel.value; const range=priceSel.value;
      let visible=0;
      cards.forEach(card=>{
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
      else sorted.sort((a,b)=>defaultOrder.get(a)-defaultOrder.get(b));
      sorted.forEach(c=>grid.appendChild(c));
    }

    function showSuggestions(){
      const q=input.value.trim().toLowerCase();
      if(q.length<2){results.classList.remove("open");results.innerHTML="";return;}
      const hits=products.filter(p=>[p.title,p.brand,p.mpn,p.description].join(" ").toLowerCase().includes(q)).slice(0,10);
      results.innerHTML=hits.length?hits.map(p=>`<a class="ot-search-result" role="option" href="${p.slug}"><span><strong>${String(p.title||p.mpn).replace(/</g,"&lt;").replace(/>/g,"&gt;")}</strong><span>${String(p.brand||"")} · MPN ${String(p.mpn||"")}</span></span><em>View →</em></a>`).join(""):`<div class="ot-no-result">No exact catalogue match. Try a brand name, MPN or simpler product term.</div>`;
      results.classList.add("open");
    }

    input.addEventListener("input",()=>{apply();showSuggestions();});
    [brandSel,priceSel,sortSel].forEach(el=>el.addEventListener("change",apply));
    controls.querySelector(".ot-clear-filters").addEventListener("click",()=>{input.value="";brandSel.value="";priceSel.value="";sortSel.value="default";results.classList.remove("open");apply();input.focus();});
    document.addEventListener("click",e=>{if(!controls.contains(e.target))results.classList.remove("open")});
    input.addEventListener("focus",showSuggestions);

    setTimeout(apply,450);
  }

  function addAssets(){
    if(!document.querySelector('link[data-ot-catalogue-controls]')){const l=document.createElement("link");l.rel="stylesheet";l.href="/assets/catalogue-controls.css?v=1";l.dataset.otCatalogueControls="true";document.head.appendChild(l);}
    mount();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",addAssets,{once:true});else addAssets();
})();
