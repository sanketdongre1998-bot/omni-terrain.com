(() => {
  "use strict";
  if (window.__OMNI_LIVE_STOREFRONT_PRIORITY__) return;
  const file=decodeURIComponent(String(location.pathname||"").split("/").filter(Boolean).pop()||"").toLowerCase();
  if(!(file===""||file==="index.html"))return;
  window.__OMNI_LIVE_STOREFRONT_PRIORITY__=true;

  const money=cents=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format((Number(cents)||0)/100);
  const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const offerMath=row=>{const priceCents=Math.max(0,Math.round(Number(row?.priceCents)||0)),shippingCents=row?.shippingIncluded===true?Math.max(0,Math.round((Number(row?.shippingQuoteUSD)||0)*100)):0;return{priceCents,shippingCents,deliveredValueCents:priceCents+shippingCents};};
  const featuredIds=["HUS81147","HUS81148","CCIN9010F","CCIN8010F","CCIIMP103X","A1360828HD","B5224066464"];
  const marketingDescriptions={HUS81147:"Carry up to four bikes with a hitch-mounted rack built for road trips, weekend rides and everyday transport.",HUS81148:"Add serious cargo space with a 500 lb hitch-mounted carrier for road trips, hauling and everyday utility.",CCIN9010F:"Chrome front wheel simulator designed for compatible 2019–2025 Ram 3500 applications with a bold factory-style finish.",CCIN8010F:"Chrome front wheel simulator designed for compatible 2003–2018 Ram 3500 applications.",CCIIMP103X:"Chrome wheel-cover upgrade for compatible 2022–2025 Toyota Tundra applications with an 18-inch six-spoke design.",A1360828HD:"Load-support air spring kit for compatible Ram 1500 applications, designed to improve stability under load.",B5224066464:"Bilstein B8 5100 shock absorber for compatible Ram 2500/3500 trucks with lifted suspension applications."};

  function loadProducts(){return new Promise(resolve=>{try{if(typeof OMNI_US_PRODUCTS!=="undefined"&&Array.isArray(OMNI_US_PRODUCTS))return resolve(OMNI_US_PRODUCTS);}catch(_){}const existing=document.querySelector('script[data-ot-us-products]');if(existing){existing.addEventListener("load",()=>{try{resolve(Array.isArray(OMNI_US_PRODUCTS)?OMNI_US_PRODUCTS:[])}catch(_){resolve([])}},{once:true});return;}const s=document.createElement("script");s.src="/assets/us-products.js?v=4";s.dataset.otUsProducts="true";s.onload=()=>{try{resolve(Array.isArray(OMNI_US_PRODUCTS)?OMNI_US_PRODUCTS:[])}catch(_){resolve([])}};s.onerror=()=>resolve([]);document.head.appendChild(s);});}
  async function productImage(slug){try{const response=await fetch(`/${String(slug||"").replace(/^\//,"")}`,{cache:"force-cache"});if(!response.ok)return"/assets/omni-terrain-emblem.webp";const html=await response.text(),doc=new DOMParser().parseFromString(html,"text/html"),img=doc.querySelector(".product-visual img");return img?.getAttribute("src")||"/assets/omni-terrain-emblem.webp";}catch(_){return"/assets/omni-terrain-emblem.webp";}}

  async function mount(){
    let registry={products:{}};try{const response=await fetch("/assets/us-live-products.json?v=checkout-pool-301-auth5",{cache:"no-store"});if(!response.ok)return;registry=await response.json();}catch(_){return;}
    const products=await loadProducts(),productById=new Map(products.map(p=>[String(p.id),p]));
    const enabled=Object.entries(registry.products||{}).filter(([,row])=>row&&row.enabled===true&&row.authorizationVerified===true&&Number(row.priceCents)>0).map(([id,row])=>({id,row,product:productById.get(String(id))})).filter(x=>x.product&&x.product.slug);
    if(!enabled.length)return;
    enabled.sort((a,b)=>{const ai=featuredIds.indexOf(a.id),bi=featuredIds.indexOf(b.id);if(ai>=0||bi>=0)return(ai<0?999:ai)-(bi<0?999:bi);return String(a.product.brand||"").localeCompare(String(b.product.brand||""))||String(a.product.mpn||"").localeCompare(String(b.product.mpn||""));});
    const featured=enabled.filter(x=>featuredIds.includes(x.id)).slice(0,4);if(!featured.length)return;
    const images=await Promise.all(featured.map(x=>productImage(x.product.slug)));

    const grid=document.querySelector(".live-grid");
    if(grid){
      grid.innerHTML=featured.map((x,i)=>{const p=x.product,r=x.row,pricing=offerMath(r),desc=marketingDescriptions[x.id]||String(p.description||"").split(". ")[0].slice(0,150)||"Shop online with clear pricing and product details.",badge=pricing.shippingCents?`Save ${money(pricing.shippingCents)}`:"Featured offer",breakdown=pricing.shippingCents?`<div class="live-offer-value"><span>Product + delivery</span><span>${money(pricing.deliveredValueCents)}</span></div><div class="live-offer-save"><span>Featured shipping savings</span><strong>−${money(pricing.shippingCents)}</strong></div><div class="live-offer-today"><small>Today's delivered price</small><strong>${money(pricing.priceCents)}</strong></div>`:`<div class="live-offer-today"><small>Today's price</small><strong>${money(pricing.priceCents)}</strong></div>`;return `<article class="live-card" data-live-id="${esc(x.id)}"><a class="live-media" href="${esc(p.slug)}"><span class="live-badge">${badge}</span><img src="${esc(images[i])}" alt="${esc(p.title||p.mpn)}" decoding="async" loading="${i===0?"eager":"lazy"}"></a><div class="live-body"><div class="live-brand"><span>${esc(p.brand||"Omni Terrain")}</span><span>${esc(p.mpn||"")}</span></div><h3>${esc(p.title||p.mpn)}</h3><p>${esc(desc)}</p><div class="live-card-footer"><div class="live-offer-price">${breakdown}</div><a class="live-link" href="${esc(p.slug)}">Get this deal →</a></div></div></article>`;}).join("");
      const section=grid.closest(".home-section"),eyebrow=section?.querySelector(".section-head .eyebrow"),heading=section?.querySelector(".section-head h2"),copy=section?.querySelector(".section-head p");
      if(eyebrow)eyebrow.textContent="Featured products";if(heading)heading.textContent="Popular upgrades.";if(copy)copy.textContent="Selected products with clear pricing and straightforward product details.";
    }

    const heroCandidate=enabled.find(x=>x.id==="F37FTL5607")||featured[0];
    if(heroCandidate){const p=heroCandidate.product,r=heroCandidate.row,pricing=offerMath(r),heroImage=await productImage(p.slug),hero=document.querySelector(".hero-showcase");if(hero){hero.href=p.slug;hero.setAttribute("aria-label",`View ${p.brand||"product"} ${p.mpn||""}`.trim());const img=hero.querySelector("img"),small=hero.querySelector(".hero-showcase-top small"),h2=hero.querySelector(".hero-showcase-top h2"),price=hero.querySelector(".hero-price"),foot=hero.querySelector(".hero-showcase-foot span:first-child");if(img){img.src=heroImage;img.alt=p.title||p.mpn||"Featured product";}if(small)small.textContent=`${p.brand||"Omni Terrain"} · MPN ${p.mpn||""}`;if(h2)h2.textContent=p.title||p.mpn||"Featured product";if(price){price.removeAttribute("data-live-price");price.textContent=money(pricing.priceCents);}if(foot)foot.textContent=pricing.shippingCents?`Today's delivered price · Save ${money(pricing.shippingCents)} on standard shipping`:"Today's online price";}}

    const liveBrands=[...new Set(featured.map(x=>String(x.product.brand||"").trim()).filter(Boolean))].slice(0,5),brandNodes=[...document.querySelectorAll(".brand-strip .brand-name")];brandNodes.forEach((node,i)=>{if(liveBrands[i]){node.textContent=liveBrands[i];node.style.display="";}else node.style.display="none";});const brandLabel=document.querySelector(".brand-strip-label");if(brandLabel)brandLabel.textContent="Featured brands";
    const launch=document.querySelector(".launch-strip .container span:last-child");if(launch)launch.textContent="7 featured offers · Free standard shipping in the contiguous U.S.";
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})();
