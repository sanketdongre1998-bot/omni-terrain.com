(() => {
  "use strict";
  if(window.__OMNI_UK_RETAIL_HOME__)return;
  if(!String(location.pathname||"").toLowerCase().endsWith("/uk.html"))return;
  window.__OMNI_UK_RETAIL_HOME__=true;

  const products=Array.isArray(window.OMNI_SHIELD_PRODUCTS)?window.OMNI_SHIELD_PRODUCTS:[];
  const money=value=>new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"}).format(Number(value)||0);
  const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const readCartCount=()=>{try{const rows=JSON.parse(localStorage.getItem("omniTerrainUkCartV1")||"[]");return Array.isArray(rows)?rows.reduce((n,row)=>n+Math.max(0,Number(row?.qty)||0),0):0;}catch(_){return 0;}};

  function mountSeo(){
    const title="UK Auto, Marine, Campervan & 12V Parts | Omni Terrain";
    const description="Shop Omni Terrain UK for automotive, marine, campervan and 12V products with GBP pricing, clear product specifications, MPNs, fitment guidance and UK support.";
    document.title=title;
    const setMeta=(selector,attrs)=>{let node=document.head.querySelector(selector);if(!node){node=document.createElement("meta");Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,value));document.head.appendChild(node);}else if(attrs.content){node.setAttribute("content",attrs.content);}};
    setMeta('meta[name="description"]',{name:"description",content:description});
    setMeta('meta[property="og:title"]',{property:"og:title",content:title});
    setMeta('meta[property="og:description"]',{property:"og:description",content:description});
    setMeta('meta[name="twitter:title"]',{name:"twitter:title",content:title});
    setMeta('meta[name="twitter:description"]',{name:"twitter:description",content:description});
    let canonical=document.head.querySelector('link[rel="canonical"]');
    if(!canonical){canonical=document.createElement("link");canonical.rel="canonical";document.head.appendChild(canonical);}canonical.href="https://omni-terrain.com/uk.html";
    if(!document.getElementById("otUkRetailSeo")){
      const schema=document.createElement("script");schema.type="application/ld+json";schema.id="otUkRetailSeo";schema.textContent=JSON.stringify({
        "@context":"https://schema.org",
        "@graph":[
          {"@type":"WebSite","@id":"https://omni-terrain.com/#website","url":"https://omni-terrain.com/","name":"Omni Terrain","inLanguage":"en-GB"},
          {"@type":"CollectionPage","@id":"https://omni-terrain.com/uk.html#webpage","url":"https://omni-terrain.com/uk.html","name":title,"description":description,"inLanguage":"en-GB","isPartOf":{"@id":"https://omni-terrain.com/#website"},"about":[{"@type":"Thing","name":"Automotive parts"},{"@type":"Thing","name":"Marine equipment"},{"@type":"Thing","name":"Campervan equipment"},{"@type":"Thing","name":"12V power products"}]}
        ]
      });document.head.appendChild(schema);
    }
  }

  function scrubLegacy(){
    document.body.classList.add("ot-retail-home","ot-retail-home-uk");
    document.querySelectorAll(".announcement,.market-strip,#header,header.header,.draft-strip,.mobile-store-bar").forEach(node=>{
      if(!node.classList.contains("ot-retail-header"))node.remove();
    });
  }

  function mountHeader(){
    document.querySelector(".ot-retail-header")?.remove();
    const header=document.createElement("header");
    header.className="ot-retail-header";
    header.innerHTML=`
      <div class="ot-retail-utility"><div class="ot-retail-width">
        <div class="ot-region-mini"><a href="/">US Store <small>USD</small></a><a class="active" href="/uk.html" aria-current="page">UK Store <small>GBP</small></a></div>
        <div class="ot-utility-links"><a href="/uk-contact.html">Help</a><a href="mailto:support@omni-terrain.com">UK support</a></div>
      </div></div>
      <div class="ot-retail-mainbar"><div class="ot-retail-width">
        <a class="ot-retail-logo" href="/uk.html" aria-label="Omni Terrain UK home"><img src="/assets/omni-terrain-approved-gt.webp?v=1" alt="Omni Terrain" width="250" height="66"></a>
        <form class="ot-retail-search" id="otUkHeaderSearch" role="search"><input type="search" aria-label="Search UK products" placeholder="Search UK products by name, brand, MPN or size"><button type="submit">Search</button></form>
        <div class="ot-retail-actions"><button type="button" class="ot-account-button" data-ot-auth-trigger><span>Account</span><strong>Sign in</strong></button><a class="ot-cart-button" href="/uk-cart.html"><span>Cart</span><strong><b data-uk-cart-count>${readCartCount()}</b> items</strong></a></div>
      </div></div>
      <nav class="ot-retail-nav" aria-label="UK store navigation"><div class="ot-retail-width">
        <a class="shop-all" href="/shield-autocare-uk.html">Shop Available</a><a href="#ukProducts">Current Range</a><a href="#ukDepartments">Departments</a><a href="/uk-contact.html">Help & Fitment</a><a href="/uk-shipping-delivery-policy.html">Delivery</a><a href="/uk-returns-refunds-policy.html">Returns</a>
      </div></nav>`;
    document.querySelector("main")?.insertAdjacentElement("beforebegin",header);
    header.querySelector("#otUkHeaderSearch")?.addEventListener("submit",event=>{event.preventDefault();filterProducts(event.currentTarget.querySelector("input")?.value||"");});
  }

  function productCard(product,index){
    const image=product?.images?.[0]||"";
    return `<a class="ot-retail-product" href="/${esc(product.slug)}"><div class="ot-product-img">${image?`<img src="/${esc(image)}" alt="${esc(product.title)}" loading="${index<2?"eager":"lazy"}" decoding="async">`:'<span>Product image</span>'}${index===0?'<b class="ot-badge">Available now</b>':''}</div><div class="ot-product-info"><small>${esc(product.brand)} · ${esc(product.mpn)}</small><h3>${esc(product.title)}</h3><div class="ot-product-bottom"><strong>${money(product.price)}</strong><span>View product →</span></div></div></a>`;
  }

  function renderProducts(rows=products.slice(0,8)){
    const grid=document.getElementById("otUkProducts");if(!grid)return;
    if(!rows.length){grid.innerHTML='<div class="ot-retail-empty"><div><strong>No exact match found.</strong><p>Try another product name, brand, MPN or size, or ask UK support.</p><a href="/uk-contact.html">Ask UK support →</a></div></div>';return;}
    grid.innerHTML=rows.slice(0,12).map(productCard).join("");
  }

  function filterProducts(query){
    const q=String(query||"").trim().toLowerCase();
    const rows=q?products.filter(product=>[product.title,product.brand,product.mpn,product.category,product.segment].some(value=>String(value||"").toLowerCase().includes(q))):products.slice(0,8);
    renderProducts(rows);
    document.getElementById("ukProducts")?.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function mountMain(){
    const main=document.querySelector("main");if(!main)return;
    const featured=products.find(product=>product.id==="cool-mate-70l-fridge-black")||products[0];
    const heroImage=featured?.images?.[0]?`/${featured.images[0]}`:"/assets/shield-live/coolmate-solar-12v-fridge-campervan-black-1000x1000.webp";
    main.className="ot-retail-main";
    main.innerHTML=`
      <section class="ot-retail-promo"><div class="ot-retail-width"><strong>Omni Terrain UK Store</strong><span>GBP pricing · UK product data · fitment help · secure checkout on eligible products</span><a href="/shield-autocare-uk.html">Shop available</a></div></section>
      <section class="ot-retail-hero"><div class="ot-retail-width ot-hero-grid">
        <div class="ot-hero-copy"><span class="ot-eyebrow">UK AUTO PARTS · MARINE · CAMPERVAN · 12V POWER</span><h1>UK auto, marine<br>& campervan parts.</h1><p>Explore automotive, marine, campervan, 12V power and travel products with clear GBP pricing, manufacturer part numbers, product specifications, dimensions, fitment guidance and UK support.</p><div class="ot-hero-buttons"><a class="primary" href="/shield-autocare-uk.html">Shop UK products</a><a href="/uk-contact.html">Get fitment help</a></div><div class="ot-uk-status">Current UK availability · GBP pricing · UK support</div></div>
        <a class="ot-hero-deal" href="/${esc(featured?.slug||"uk-cool-mate-70l-fridge-black.html")}"><div class="ot-hero-deal-label">Available in UK</div><img src="${esc(heroImage)}" alt="${esc(featured?.title||"Cool Mate 70L AC/DC Compressor Fridge")}"><div class="ot-hero-deal-copy"><div><small>${esc(featured?.brand||"Cool Mate")} · ${esc(featured?.mpn||"")}</small><h2>${esc(featured?.title||"Cool Mate 70L Fridge")}</h2></div><div class="ot-hero-price"><span>Price inc VAT</span><strong>${money(featured?.price||479.95)}</strong></div></div></a>
      </div></section>
      <section class="ot-find-section"><div class="ot-retail-width"><div class="ot-find-card"><div class="ot-find-title"><span>1</span><div><small>START HERE</small><h2>Find a UK product</h2><p>Search by product name, brand, manufacturer part number or size.</p></div></div><form id="otUkFindPart" class="ot-find-form"><input id="otUkFindInput" type="search" placeholder="Example: Cool Mate, 700 × 500, BLIND, exact MPN" aria-label="Search UK products"><select id="otUkFindCategory" aria-label="Category"><option value="">All categories</option><option value="fridge">Campervan refrigeration</option><option value="window">Campervan windows</option><option value="blind">Blinds & flyscreens</option></select><button type="submit">Find products</button></form><a class="ot-find-help" href="/uk-contact.html">Need fitment help?</a></div></div></section>
      <section class="ot-retail-section" id="ukDepartments"><div class="ot-retail-width"><div class="ot-section-head"><div><small>SHOP UK DEPARTMENTS</small><h2>What are you shopping for?</h2></div><a href="/shield-autocare-uk.html">View current range →</a></div><div class="ot-department-grid">
        <a href="/uk-contact.html"><span class="ot-dept-icon">AUTO</span><div><h3>Auto Parts</h3><p>Automotive parts and vehicle equipment organized around clear product references, manufacturer part numbers and fitment information where relevant.</p><b>Ask for an auto part →</b></div></a>
        <a href="/uk-contact.html"><span class="ot-dept-icon">MARINE</span><div><h3>Marine</h3><p>Marine parts, electrical equipment and onboard products with clear specifications and practical installation information.</p><b>Ask for marine gear →</b></div></a>
        <a href="/shield-autocare-uk.html"><span class="ot-dept-icon">VAN</span><div><h3>Campervan</h3><p>Campervan fridges, windows, blackout blinds and flyscreens with dimensions, specifications and UK pricing.</p><b>Shop campervan →</b></div></a>
        <a href="/shield-autocare-uk.html"><span class="ot-dept-icon">POWER</span><div><h3>12V Power & Travel</h3><p>12V, mobile-power and practical travel equipment for campervans, leisure vehicles and road use.</p><b>Browse available →</b></div></a>
      </div></div></section>
      <section class="ot-retail-section alt" id="ukProducts"><div class="ot-retail-width"><div class="ot-section-head"><div><small>AVAILABLE NOW</small><h2>Current UK products</h2></div><a href="/shield-autocare-uk.html">See full current range →</a></div><div class="ot-retail-products" id="otUkProducts"><div class="ot-loading-products">Loading UK products…</div></div></div></section>
      <section class="ot-uk-trust-strip"><div class="ot-retail-width ot-uk-trust-grid"><div><strong>Clear UK pricing</strong><span>Prices are shown in GBP with VAT information where applicable.</span></div><div><strong>Exact product identity</strong><span>Brand, MPN, dimensions and compatibility details stay visible where relevant.</span></div><div><strong>UK customer support</strong><span>Product, delivery and returns help is available before and after ordering.</span></div></div></section>
      <section class="ot-benefits"><div class="ot-retail-width"><h2>Why shop Omni Terrain UK?</h2><div class="ot-benefit-grid"><div><span>01</span><strong>Search by MPN</strong><p>Use exact manufacturer part numbers, brand names, product names or dimensions to find the right item faster.</p></div><div><span>02</span><strong>Current UK range</strong><p>Regional availability and GBP pricing stay separate from the United States storefront.</p></div><div><span>03</span><strong>Secure purchase flow</strong><p>Eligible UK orders continue through the active secure checkout route.</p></div><div><span>04</span><strong>Fitment support</strong><p>Need help? Send the product, MPN, size or application details before ordering.</p></div></div></div></section>
      <section class="ot-support-cta"><div class="ot-retail-width"><div><small>NOT SURE WHICH PRODUCT?</small><h2>Ask before you buy.</h2><p>Send the product name, brand, manufacturer part number, dimensions or application details and we will help.</p></div><div><a class="primary" href="/uk-contact.html">Get UK product help</a><a href="mailto:support@omni-terrain.com">Email support</a></div></div></section>`;

    main.querySelector("#otUkFindPart")?.addEventListener("submit",event=>{event.preventDefault();const text=main.querySelector("#otUkFindInput")?.value||"";const category=main.querySelector("#otUkFindCategory")?.value||"";filterProducts(text||category);});
    renderProducts();
  }

  function mountWelcome(){
    let seen=0;try{seen=Number(localStorage.getItem("otRetailPromoSeen")||0);}catch(_){}
    if(seen&&Date.now()-seen<7*24*60*60*1000)return;
    const overlay=document.createElement("div");overlay.className="ot-welcome";overlay.hidden=true;overlay.innerHTML=`<section class="ot-welcome-card" role="dialog" aria-modal="true" aria-labelledby="otWelcomeTitle"><button type="button" class="ot-welcome-close" aria-label="Close">×</button><div class="ot-welcome-art"><span>OMNI TERRAIN UK</span><strong>SHOP<br>SMARTER.</strong><small>ROAD · WATER · TRAVEL</small></div><div class="ot-welcome-copy"><img src="/assets/omni-terrain-approved-gt.webp?v=1" alt="Omni Terrain"><span class="ot-welcome-kicker">WELCOME</span><h2 id="otWelcomeTitle">Choose your store and continue</h2><p>Use your email to sign in or create an account, or continue directly without signing in.</p><form id="otUkWelcomeForm"><input type="email" required autocomplete="email" placeholder="Email address"><button type="submit">Sign in / Continue</button></form><button type="button" class="ot-welcome-skip">Continue as guest</button><small class="ot-welcome-terms">Account is optional. You can browse and shop without signing in.</small></div></section>`;document.body.appendChild(overlay);
    const dismiss=()=>{overlay.hidden=true;try{localStorage.setItem("otRetailPromoSeen",String(Date.now()));}catch(_){}};
    overlay.querySelector(".ot-welcome-close")?.addEventListener("click",dismiss);overlay.querySelector(".ot-welcome-skip")?.addEventListener("click",dismiss);overlay.addEventListener("click",event=>{if(event.target===overlay)dismiss();});
    overlay.querySelector("#otUkWelcomeForm")?.addEventListener("submit",event=>{event.preventDefault();const email=event.currentTarget.querySelector("input")?.value||"";dismiss();document.dispatchEvent(new CustomEvent("omni:open-auth",{detail:{email,mode:"signup"}}));});
    setTimeout(()=>{overlay.hidden=false;overlay.querySelector("input")?.focus();},850);
  }

  mountSeo();
  scrubLegacy();
  mountHeader();
  mountMain();
  mountWelcome();
})();
