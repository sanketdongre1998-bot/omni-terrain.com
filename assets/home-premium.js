(async function () {
  "use strict";
  const path=String(location.pathname||"/");
  if(!(path==="/"||/\/index\.html$/i.test(path)))return;
  if(window.__OMNI_HOME_PREMIUM__)return;
  window.__OMNI_HOME_PREMIUM__=true;

  document.body.classList.add("ot-retail-home");
  document.documentElement.lang="en-US";

  const money=cents=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format((Number(cents)||0)/100);
  const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const CANDIDATES=[
    ["F37FTL5607","us-fabtech-ftl5607.html"],
    ["HUS81147","us-husky-towing-81147.html"],
    ["HUS81148","us-husky-towing-81148.html"],
    ["CCIN9010F","us-coast2coast-iwcn9010f.html"],
    ["CCIN8010F","us-coast2coast-iwcn8010f.html"],
    ["CCIIMP103X","us-coast2coast-iwcimp103x.html"],
    ["A1360828HD","us-air-lift-60828hd.html"],
    ["B5224066464","us-bilstein-24-066464.html"]
  ];

  function enhanceSeo(){
    document.title="Omni Terrain US | Auto Parts, Marine, RV & 12V";
    const description=document.querySelector('meta[name="description"]');
    if(description)description.content="Shop Omni Terrain US for automotive, towing, marine, RV, overlanding and 12V parts. Search by exact manufacturer part number, brand or category with current pricing and secure checkout on eligible products.";
    const ogTitle=document.querySelector('meta[property="og:title"]');if(ogTitle)ogTitle.content=document.title;
    const ogDescription=document.querySelector('meta[property="og:description"]');if(ogDescription)ogDescription.content=description?.content||"Omni Terrain US specialist parts store.";
    document.getElementById("ot-home-seo-schema")?.remove();
    const schema=document.createElement("script");schema.id="ot-home-seo-schema";schema.type="application/ld+json";schema.textContent=JSON.stringify({
      "@context":"https://schema.org","@graph":[
        {"@type":"WebSite","@id":"https://omni-terrain.com/#website","name":"Omni Terrain","url":"https://omni-terrain.com/","inLanguage":"en-US","potentialAction":{"@type":"SearchAction","target":"https://omni-terrain.com/us-catalogue.html#catalogue-search","query-input":"required name=search_term_string"}},
        {"@type":"ItemList","name":"Omni Terrain US shopping departments","itemListElement":[
          {"@type":"ListItem","position":1,"name":"Auto Parts","url":"https://omni-terrain.com/automotive.html"},
          {"@type":"ListItem","position":2,"name":"Marine","url":"https://omni-terrain.com/marine.html"},
          {"@type":"ListItem","position":3,"name":"RV & Overlanding","url":"https://omni-terrain.com/rv.html"},
          {"@type":"ListItem","position":4,"name":"US Catalogue","url":"https://omni-terrain.com/us-catalogue.html"}
        ]}
      ]
    });document.head.appendChild(schema);
  }

  function goSearch(value){
    const q=String(value||"").trim();
    try{if(q)sessionStorage.setItem("otCatalogueSearch",q);else sessionStorage.removeItem("otCatalogueSearch");}catch(_){}
    location.href="/us-catalogue.html#catalogue-search";
  }

  function cartCount(){
    try{const cart=JSON.parse(localStorage.getItem("omniTerrainUsCart")||"[]");return Array.isArray(cart)?cart.reduce((n,row)=>n+Math.max(1,Number(row?.quantity)||1),0):0;}catch(_){return 0;}
  }

  function mountHeader(){
    document.querySelector(".ot-retail-header")?.remove();
    const header=document.createElement("header");
    header.className="ot-retail-header";
    header.innerHTML=`
      <div class="ot-retail-utility"><div class="ot-retail-width">
        <div class="ot-region-mini"><a class="active" href="/" aria-current="page">🇺🇸 United States <small>USD</small></a><a href="/uk.html">🇬🇧 United Kingdom <small>GBP</small></a></div>
        <div class="ot-utility-links"><a href="/contact-and-order-help.html">Help</a><a href="tel:+13075330570">Product support · +1 307-533-0570</a></div>
      </div></div>
      <div class="ot-retail-mainbar"><div class="ot-retail-width">
        <a class="ot-retail-logo" href="/" aria-label="Omni Terrain home"><img src="/assets/omni-terrain-approved-gt.webp?v=1" alt="Omni Terrain" width="250" height="66"></a>
        <form class="ot-retail-search" id="otRetailHeaderSearch" role="search"><input type="search" aria-label="Search products" placeholder="Search by part, brand or manufacturer part number"><button type="submit" aria-label="Search">Search</button></form>
        <div class="ot-retail-actions"><button type="button" class="ot-account-button" data-ot-auth-trigger><span>Account</span><strong>Sign in</strong></button><a class="ot-cart-button" href="/cart.html"><span>Cart</span><strong><b data-cart-count>${cartCount()}</b> items</strong></a></div>
      </div></div>
      <nav class="ot-retail-nav" aria-label="Main navigation"><div class="ot-retail-width">
        <a class="shop-all" href="/us-catalogue.html">Shop All</a><a href="/automotive.html">Auto Parts</a><a href="/marine.html">Marine</a><a href="/rv.html">RV & Overlanding</a><a href="/deals.html">Deals</a><a href="/contact-and-order-help.html">Help & Fitment</a>
      </div></nav>`;
    const main=document.querySelector("main");
    if(main)main.insertAdjacentElement("beforebegin",header);else document.body.prepend(header);
    header.querySelector("#otRetailHeaderSearch")?.addEventListener("submit",e=>{e.preventDefault();goSearch(e.currentTarget.querySelector("input")?.value);});
  }

  async function loadOffers(){
    try{
      const [r1,r2]=await Promise.all([fetch("/assets/us-live-products.json?v=retail-1",{cache:"no-store"}),fetch("/assets/us-stock-status.json?v=retail-1",{cache:"no-store"})]);
      if(!r1.ok)return[];
      const registry=await r1.json();
      const stock=r2.ok?await r2.json():{products:{}};
      const rows=[];
      for(const [id,slug] of CANDIDATES){
        const p=registry?.products?.[id];const s=stock?.products?.[id];
        if(!p||p.enabled!==true||p.authorizationVerified!==true||Number(p.priceCents)<=0)continue;
        if(s&&s.checkoutReady===false)continue;
        rows.push({id,slug,row:p,priceCents:Number(p.priceCents)});
      }
      return rows.slice(0,4);
    }catch(_){return[];}
  }

  async function hydrateOffer(item){
    try{
      const response=await fetch("/"+item.slug,{cache:"force-cache"});
      if(!response.ok)return item;
      const doc=new DOMParser().parseFromString(await response.text(),"text/html");
      const title=(doc.querySelector("main h1")?.textContent||item.row?.mpn||"Featured product").replace(/\s+/g," ").trim();
      const image=doc.querySelector(".product-visual img")?.getAttribute("src")||doc.querySelector("main img")?.getAttribute("src")||"";
      const kicker=(doc.querySelector(".product-copy .kicker")?.textContent||doc.querySelector(".kicker")?.textContent||"").replace(/\s+/g," ").trim();
      const brand=(kicker.split("·")[0]||item.row?.brand||"Omni Terrain").trim();
      return {...item,title,image,brand};
    }catch(_){return item;}
  }

  function renderOfferCards(items){
    const grid=document.getElementById("otRetailProducts");if(!grid)return;
    if(!items.length){grid.innerHTML='<div class="ot-retail-empty"><strong>Browse the full US catalogue</strong><p>Search current products by brand, category or exact manufacturer part number.</p><a href="/us-catalogue.html">Shop all products →</a></div>';return;}
    grid.innerHTML=items.map((item,index)=>`<a class="ot-retail-product" href="/${esc(item.slug)}"><div class="ot-product-img">${item.image?`<img src="${esc(item.image)}" alt="${esc(item.title||item.row?.mpn||"Product")}" loading="${index===0?"eager":"lazy"}" decoding="async">`:'<span>Product image</span>'}${index===0?'<b class="ot-badge">Featured</b>':''}</div><div class="ot-product-info"><small>${esc(item.brand||"Omni Terrain")} · MPN ${esc(item.row?.mpn||"")}</small><h3>${esc(item.title||item.row?.mpn||"Featured product")}</h3><div class="ot-product-bottom"><strong>${money(item.priceCents)}</strong><span>View product →</span></div></div></a>`).join("");
  }

  function mountMain(heroPrice){
    const main=document.querySelector("main");if(!main)return;
    main.className="ot-retail-main";
    main.innerHTML=`
      <section class="ot-retail-promo"><div class="ot-retail-width"><strong>Save $5 on eligible $150+ regular-priced orders</strong><span>Use code <b>OMNI5</b> at checkout · U.S. storefront</span><a href="/deals.html">Shop deals</a></div></section>
      <section class="ot-retail-hero"><div class="ot-retail-width ot-hero-grid">
        <div class="ot-hero-copy"><span class="ot-eyebrow">AUTO · MARINE · RV · 12V</span><h1>Find the right part.<br>Fast.</h1><p>Search by exact manufacturer part number, brand or category. Clear product information, current U.S. pricing and secure checkout on eligible products.</p><div class="ot-hero-buttons"><a class="primary" href="/us-catalogue.html">Shop all products</a><a href="/automotive.html">Shop Auto Parts</a></div></div>
        <a class="ot-hero-deal" href="/us-fabtech-ftl5607.html"><div class="ot-hero-deal-label">Featured US product</div><img src="https://vehiclepartimages.com/ImageServerAPI?File=FAB/Images/FTL5607_1.jpg&maxheight=620&maxwidth=760" alt="Fabtech FTL5607 suspension leveling system"><div class="ot-hero-deal-copy"><div><small>FABTECH · MPN FTL5607</small><h2>Fabtech FTL5607</h2></div><div class="ot-hero-price"><span>Current price</span><strong>${heroPrice}</strong></div></div></a>
      </div></section>
      <section class="ot-find-section"><div class="ot-retail-width"><div class="ot-find-card"><div class="ot-find-title"><span>1</span><div><small>START HERE</small><h2>Find your part</h2><p>Type a brand, product name or exact MPN.</p></div></div><form id="otFindPart" class="ot-find-form"><input id="otFindInput" type="search" placeholder="Example: FTL5607, Fabtech, Blue Sea" aria-label="Part, brand or MPN"><select id="otFindCategory" aria-label="Category"><option value="">All categories</option><option>Auto Parts</option><option>Marine</option><option>RV & Overlanding</option><option>12V</option></select><button type="submit">Find products</button></form><a class="ot-find-help" href="/contact-and-order-help.html">Need fitment help?</a></div></div></section>
      <section class="ot-retail-section"><div class="ot-retail-width"><div class="ot-section-head"><div><small>SHOP BY DEPARTMENT</small><h2>What are you shopping for?</h2></div><a href="/us-catalogue.html">View all products →</a></div><div class="ot-department-grid">
        <a href="/automotive.html"><span class="ot-dept-icon">AUTO</span><div><h3>Auto Parts</h3><p>Suspension, towing, exterior, electrical and upgrades.</p><b>Shop Auto Parts →</b></div></a>
        <a href="/marine.html"><span class="ot-dept-icon">MARINE</span><div><h3>Marine</h3><p>Electrical, navigation and on-water equipment.</p><b>Shop Marine →</b></div></a>
        <a href="/rv.html"><span class="ot-dept-icon">RV</span><div><h3>RV & Overlanding</h3><p>Road travel, overlanding and mobile equipment.</p><b>Shop RV →</b></div></a>
        <a href="/us-catalogue.html"><span class="ot-dept-icon">12V</span><div><h3>12V Power</h3><p>Electrical and power products for road and water.</p><b>Shop 12V →</b></div></a>
      </div></div></section>
      <section class="ot-retail-section alt"><div class="ot-retail-width"><div class="ot-section-head"><div><small>LATEST OFFERS & TOP SELLERS</small><h2>Popular US products</h2></div><a href="/deals.html">See all deals →</a></div><div class="ot-retail-products" id="otRetailProducts"><div class="ot-loading-products">Loading current products…</div></div></div></section>
      <section class="ot-benefits"><div class="ot-retail-width"><h2>Why shop Omni Terrain?</h2><div class="ot-benefit-grid"><div><span>01</span><strong>Search exact MPNs</strong><p>Manufacturer part numbers stay visible so you can verify the product before buying.</p></div><div><span>02</span><strong>Current availability</strong><p>Eligible US products show current online pricing and checkout status.</p></div><div><span>03</span><strong>Secure checkout</strong><p>Eligible orders continue to protected Stripe-hosted payment.</p></div><div><span>04</span><strong>Product support</strong><p>Need help choosing the right item? Contact the Omni Terrain support team.</p></div></div></div></section>
      <section class="ot-support-cta"><div class="ot-retail-width"><div><small>NOT SURE WHICH PART?</small><h2>Tell us what you need.</h2><p>Send the manufacturer part number, vehicle/application details or product question and our team will help.</p></div><div><a class="primary" href="/contact-and-order-help.html">Get product help</a><a href="tel:+13075330570">Call +1 307-533-0570</a></div></div></section>`;

    main.querySelector("#otFindPart")?.addEventListener("submit",e=>{e.preventDefault();const q=main.querySelector("#otFindInput")?.value||main.querySelector("#otFindCategory")?.value||"";goSearch(q);});
  }

  function mountWelcome(){
    let seen=0;try{seen=Number(localStorage.getItem("otRetailPromoSeen")||0);}catch(_){}
    if(seen&&Date.now()-seen<7*24*60*60*1000)return;
    const overlay=document.createElement("div");overlay.className="ot-welcome";overlay.hidden=true;overlay.innerHTML=`<section class="ot-welcome-card" role="dialog" aria-modal="true" aria-labelledby="otWelcomeTitle"><button type="button" class="ot-welcome-close" aria-label="Close">×</button><div class="ot-welcome-art"><span>OMNI TERRAIN</span><strong>SHOP<br>SMARTER.</strong><small>ROAD · WATER · TRAVEL</small></div><div class="ot-welcome-copy"><img src="/assets/omni-terrain-approved-gt.webp?v=1" alt="Omni Terrain"><span class="ot-welcome-kicker">WELCOME OFFER</span><h2 id="otWelcomeTitle">Save $5 on your eligible $150+ order</h2><p>Use code <b>OMNI5</b> on eligible regular-priced U.S. merchandise. Enter your email to sign in or create an account and shop faster.</p><form id="otWelcomeForm"><input type="email" required autocomplete="email" placeholder="Email address"><button type="submit">Continue</button></form><button type="button" class="ot-welcome-skip">Continue as guest</button><small class="ot-welcome-terms">Account is optional. Guest checkout remains available on eligible products.</small></div></section>`;document.body.appendChild(overlay);
    const dismiss=()=>{overlay.hidden=true;try{localStorage.setItem("otRetailPromoSeen",String(Date.now()));}catch(_){}};
    overlay.querySelector(".ot-welcome-close")?.addEventListener("click",dismiss);overlay.querySelector(".ot-welcome-skip")?.addEventListener("click",dismiss);overlay.addEventListener("click",e=>{if(e.target===overlay)dismiss();});
    overlay.querySelector("#otWelcomeForm")?.addEventListener("submit",e=>{e.preventDefault();const email=e.currentTarget.querySelector("input")?.value||"";dismiss();document.dispatchEvent(new CustomEvent("omni:open-auth",{detail:{email,mode:"signup"}}));});
    setTimeout(()=>{overlay.hidden=false;overlay.querySelector("input")?.focus();},900);
  }

  enhanceSeo();
  document.querySelectorAll(".announcement,.market-strip,#header,.launch-strip,.mobile-store-bar").forEach(node=>node.setAttribute("aria-hidden","true"));
  let registry={products:{}};try{const r=await fetch("/assets/us-live-products.json?v=retail-hero",{cache:"no-store"});if(r.ok)registry=await r.json();}catch(_){}
  const hero=registry?.products?.F37FTL5607;const heroPrice=hero?.enabled&&Number(hero?.priceCents)>0?money(hero.priceCents):"$199.99";
  mountHeader();mountMain(heroPrice);mountWelcome();
  const offers=await loadOffers();renderOfferCards(await Promise.all(offers.map(hydrateOffer)));
})();
