(() => {
  'use strict';
  if (window.__OMNI_REFERENCE_STOREFRONT__) return;
  const file=(location.pathname.split('/').pop()||'').toLowerCase();
  const isUS=!file||file==='index.html';
  const isUK=file==='uk.html';
  if(!isUS&&!isUK)return;
  window.__OMNI_REFERENCE_STOREFRONT__=true;

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=value=>new Intl.NumberFormat(isUK?'en-GB':'en-US',{style:'currency',currency:isUK?'GBP':'USD'}).format(Number(value)||0);
  const US_CANDIDATES=[
    ['F37FTL5607','us-fabtech-ftl5607.html'],['HUS81147','us-husky-towing-81147.html'],['HUS81148','us-husky-towing-81148.html'],
    ['CCIN9010F','us-coast2coast-iwcn9010f.html'],['CCIN8010F','us-coast2coast-iwcn8010f.html'],['CCIIMP103X','us-coast2coast-iwcimp103x.html'],
    ['A1360828HD','us-air-lift-60828hd.html'],['B5224066464','us-bilstein-24-066464.html']
  ];
  const IMG={
    hero:'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2200&q=86',
    auto:'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=700&q=82',
    marine:'https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?auto=format&fit=crop&w=700&q=82',
    solar:'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=700&q=82',
    overland:'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=700&q=82',
    vehicle:'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=700&q=82',
    deals:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=82'
  };

  function cartCount(){
    try{
      const key=isUK?'omniTerrainUkCartV1':'omniTerrainUsCart';
      const rows=JSON.parse(localStorage.getItem(key)||'[]');
      if(!Array.isArray(rows))return 0;
      return rows.reduce((n,row)=>n+Math.max(1,Number(isUK?row?.qty:row?.quantity)||1),0);
    }catch(_){return 0;}
  }
  function catalogueSearch(q=''){
    const text=String(q||'').trim();
    if(isUK){filterUK(text);return;}
    try{text?sessionStorage.setItem('otCatalogueSearch',text):sessionStorage.removeItem('otCatalogueSearch');}catch(_){}
    location.href='/us-catalogue.html#catalogue-search';
  }

  function removeLegacy(){
    document.querySelectorAll('.ot-retail-header,.announcement,.market-strip,#header,header.header,.launch-strip,.draft-strip,.mobile-store-bar').forEach(n=>n.remove());
    document.querySelectorAll('[data-ot-theme-toggle],.ot-theme-toggle,.ot-welcome').forEach(n=>n.remove());
    const oldFooter=document.querySelector('body>footer');if(oldFooter)oldFooter.remove();
  }

  function autoMenu(){return `<h4>Auto Parts</h4>
    <a href="/automotive.html">Exterior Parts</a><a href="/automotive.html">Interior Parts</a><a href="/automotive.html">Performance</a><a href="/automotive.html">Towing & Hauling</a><a href="/automotive.html">Replacement Parts</a><a href="/automotive.html">Tools & Garage</a><a href="/automotive.html">Fluids & Maintenance</a><a class="all" href="/automotive.html">Shop All Auto Parts →</a>`}
  function marineMenu(){return `<h4>Marine</h4>
    <a href="/marine.html">Marine Electronics</a><a href="/marine.html">Deck & Hardware</a><a href="/marine.html">Lighting</a><a href="/marine.html">Anchoring & Mooring</a><a href="/marine.html">Safety & Navigation</a><a href="/marine.html">Boat Care & Maintenance</a><a href="/marine.html">Water Sports</a><a class="all" href="/marine.html">Shop All Marine →</a>`}
  function ukMenu(label){return `<h4>${label}</h4><a href="/shield-autocare-uk.html">Current UK range</a><a href="/uk-contact.html">Product & fitment help</a><a href="/uk-shipping-delivery-policy.html">Delivery information</a><a class="all" href="/shield-autocare-uk.html">Shop available products →</a>`}

  function mountHeader(){
    const header=document.createElement('header');header.className='ot-ref-header';
    const support=isUK?'/uk-contact.html':'/contact-and-order-help.html';
    const cart=isUK?'/uk-cart.html':'/cart.html';
    const storeHome=isUK?'/uk.html':'/';
    const shipping=isUK?'UK delivery on eligible products':'Free standard shipping on eligible featured products';
    header.innerHTML=`
      <div class="ot-ref-utility"><div class="ot-ref-width">
        <div class="ot-ref-utility-left"><span>${shipping}</span><span class="ot-ref-region"><a class="${isUS?'active':''}" href="/">US</a><a class="${isUK?'active':''}" href="/uk.html">UK</a></span></div>
        <div class="ot-ref-utility-center">Gear for a Brighter Horizon</div>
        <div class="ot-ref-utility-right"><a href="${support}">Expert Support</a><a href="${isUK?'/uk-returns-refunds-policy.html':'/returns-refunds-policy.html'}">Easy Returns</a></div>
      </div></div>
      <div class="ot-ref-mainbar"><div class="ot-ref-width">
        <a class="ot-ref-logo" href="${storeHome}" aria-label="Omni Terrain ${isUK?'UK':'US'} home"><img src="/assets/omni-terrain-approved-gt.webp?v=1" alt="Omni Terrain"></a>
        <form class="ot-ref-search" id="otRefHeaderSearch" role="search"><input type="search" aria-label="Search products" placeholder="Search for parts, gear, or your vehicle..."><button type="submit">Search</button></form>
        <div class="ot-ref-actions"><button class="ot-ref-account" type="button" data-ot-auth-trigger><span>Account</span><strong>Sign In⌄</strong></button><a class="ot-ref-cart" href="${cart}"><span>Cart</span><strong><b>${cartCount()}</b> items</strong></a></div>
      </div></div>
      <nav class="ot-ref-nav"><div class="ot-ref-width">
        <div class="ot-ref-nav-item"><button type="button">Auto Parts⌄</button><div class="ot-ref-menu">${isUK?ukMenu('Auto Parts'):autoMenu()}</div></div>
        <div class="ot-ref-nav-item"><button type="button">Marine⌄</button><div class="ot-ref-menu">${isUK?ukMenu('Marine'):marineMenu()}</div></div>
        <a href="${isUK?'/shield-autocare-uk.html':'/us-catalogue.html'}">${isUK?'Campervan & 12V':'Solar & 12V'}⌄</a>
        <a href="${isUK?'/shield-autocare-uk.html':'/rv.html'}">${isUK?'Travel & Overlanding':'Overlanding'}⌄</a>
        <a href="${isUK?'/shield-autocare-uk.html':'/us-catalogue.html'}">Shop by ${isUK?'Product':'Vehicle'}⌄</a>
        <a class="featured" href="${isUK?'/shield-autocare-uk.html':'/deals.html'}">Featured Deals</a>
        <a href="${support}">Support⌄</a>
      </div></nav>`;
    const main=document.querySelector('main');main?.insertAdjacentElement('beforebegin',header);
    header.querySelector('#otRefHeaderSearch')?.addEventListener('submit',e=>{e.preventDefault();catalogueSearch(e.currentTarget.querySelector('input')?.value||'');});
  }

  function categories(){
    if(isUK)return [
      ['Auto Parts','Clear references and fitment help.','/uk-contact.html',IMG.auto],['Marine','Parts & gear for life on the water.','/uk-contact.html',IMG.marine],['Campervan','Fridges, windows, blinds and travel gear.','/shield-autocare-uk.html',IMG.overland],['12V & Power','Power for campervans and mobile use.','/shield-autocare-uk.html',IMG.solar],['Current Range','Browse products available to the UK store.','/shield-autocare-uk.html',IMG.vehicle],['Featured','Current UK products and highlights.','/shield-autocare-uk.html',IMG.deals]
    ];
    return [
      ['Auto Parts','Keep your vehicle ready for what’s next.','/automotive.html',IMG.auto],['Marine','Parts & gear for life on the water.','/marine.html',IMG.marine],['Solar & 12V','Power your freedom off the grid.','/us-catalogue.html',IMG.solar],['Overlanding','Gear for bigger adventures.','/rv.html',IMG.overland],['Shop by Vehicle','Find the perfect fit for your ride.','/us-catalogue.html',IMG.vehicle],['Featured Deals','Top gear. Great prices. Brighter adventures.','/deals.html',IMG.deals]
    ];
  }
  function categoryCards(){return categories().map(([title,copy,href,img])=>`<a class="ot-ref-category" href="${href}"><img src="${img}" alt="" loading="lazy"><div class="ot-ref-category-body"><strong>${esc(title)} →</strong><p>${esc(copy)}</p></div></a>`).join('')}

  async function loadUSProducts(){
    try{
      const [r1,r2]=await Promise.all([fetch('/assets/us-live-products.json?v=ref-1',{cache:'no-store'}),fetch('/assets/us-stock-status.json?v=ref-1',{cache:'no-store'})]);
      if(!r1.ok)return[];const registry=await r1.json();const stock=r2.ok?await r2.json():{products:{}};const rows=[];
      for(const [id,slug] of US_CANDIDATES){
        const p=registry?.products?.[id],s=stock?.products?.[id];
        if(!p||p.enabled!==true||p.authorizationVerified!==true||Number(p.priceCents)<=0)continue;if(s&&s.checkoutReady===false)continue;
        rows.push({id,slug,row:p,price:Number(p.priceCents)/100});
      }
      return await Promise.all(rows.slice(0,6).map(hydrateUS));
    }catch(_){return[]}
  }
  async function hydrateUS(item){
    try{
      const r=await fetch('/'+item.slug,{cache:'force-cache'});if(!r.ok)return item;const doc=new DOMParser().parseFromString(await r.text(),'text/html');
      const title=(doc.querySelector('main h1')?.textContent||item.row?.mpn||'Featured product').replace(/\s+/g,' ').trim();
      const image=doc.querySelector('.product-visual img')?.getAttribute('src')||doc.querySelector('main img')?.getAttribute('src')||'';
      const kicker=(doc.querySelector('.kicker')?.textContent||'').replace(/\s+/g,' ').trim();const brand=(kicker.split('·')[0]||item.row?.brand||'Omni Terrain').trim();
      return {...item,title,image,brand};
    }catch(_){return item}
  }
  function ukProducts(){return (Array.isArray(window.OMNI_SHIELD_PRODUCTS)?window.OMNI_SHIELD_PRODUCTS:[]).slice(0,6).map(p=>({slug:p.slug,title:p.title,image:p.images?.[0]?'/'+p.images[0]:'',brand:p.brand||'Omni Terrain',price:Number(p.price)||0,row:{mpn:p.mpn||''}}));}
  function productCard(p,index){
    const slug=p.slug||'#',title=p.title||p.row?.mpn||'Product',brand=p.brand||p.row?.brand||'Omni Terrain',mpn=p.row?.mpn||'';
    return `<a class="ot-ref-product" href="/${esc(slug)}"><div class="ot-ref-product-media">${index===0?'<span class="ot-ref-badge">Featured</span>':''}${p.image?`<img src="${esc(p.image)}" alt="${esc(title)}" loading="${index<2?'eager':'lazy'}" decoding="async">`:''}</div><div class="ot-ref-product-body"><small>${esc(brand)}${mpn?' · '+esc(mpn):''}</small><h3>${esc(title)}</h3><div class="ot-ref-product-price">${money(p.price)}</div><span class="ot-ref-product-button">View product</span></div></a>`;
  }
  async function renderProducts(){
    const grid=document.getElementById('otRefProducts');if(!grid)return;const rows=isUK?ukProducts():await loadUSProducts();
    grid.innerHTML=rows.length?rows.map(productCard).join(''):'<div class="ot-ref-empty"><strong>Browse the full current range</strong><p>Search by brand, category or exact manufacturer part number.</p></div>';
  }
  function filterUK(q){
    const text=String(q||'').trim().toLowerCase();const all=Array.isArray(window.OMNI_SHIELD_PRODUCTS)?window.OMNI_SHIELD_PRODUCTS:[];
    const rows=(text?all.filter(p=>[p.title,p.brand,p.mpn,p.category,p.segment].some(v=>String(v||'').toLowerCase().includes(text))):all).slice(0,12).map(p=>({slug:p.slug,title:p.title,image:p.images?.[0]?'/'+p.images[0]:'',brand:p.brand||'Omni Terrain',price:Number(p.price)||0,row:{mpn:p.mpn||''}}));
    const grid=document.getElementById('otRefProducts');if(grid)grid.innerHTML=rows.length?rows.map(productCard).join(''):'<div class="ot-ref-empty">No exact match found. Try another product name, brand, MPN or size.</div>';document.getElementById('otRefProductsSection')?.scrollIntoView({behavior:'smooth'});
  }

  function mountMain(){
    const main=document.querySelector('main');if(!main)return;main.className='ot-ref-main';
    const shopAll=isUK?'/shield-autocare-uk.html':'/us-catalogue.html';
    main.innerHTML=`
      <section class="ot-ref-hero"><img class="ot-ref-hero-bg" src="${IMG.hero}" alt="Mountain lake adventure landscape"><div class="ot-ref-width ot-ref-hero-copy"><a class="ot-ref-hero-tag" href="${shopAll}">Shop All Products →</a><div class="ot-ref-hero-slogan">More<br>Horizons<br>Ahead</div></div></section>
      <section class="ot-ref-iconbar"><div class="ot-ref-width"><a class="ot-ref-shopall" href="${shopAll}">Shop All Products →</a><div class="ot-ref-pillar"><i>▣</i>Drive Further</div><div class="ot-ref-pillar"><i>≈</i>Explore More</div><div class="ot-ref-pillar"><i>☼</i>Power Bigger</div><div class="ot-ref-pillar"><i>▲</i>Live Outdoors</div></div></section>
      <section class="ot-ref-finder"><div class="ot-ref-width"><div class="ot-ref-finder-card"><div class="ot-ref-finder-copy"><h2>Find the Right Parts for Your Adventure</h2><p>${isUK?'Search by product, brand, MPN, dimensions or application.':'Select your vehicle or search by exact manufacturer part number.'}</p></div><div><div class="ot-ref-findtabs"><span>${isUK?'Product':'Vehicle'}</span><span>Marine</span><span>${isUK?'12V & Power':'Solar & 12V'}</span><span>Universal Search</span></div><form class="ot-ref-findform" id="otRefFinder"><select aria-label="Year"><option value="">${isUK?'Category':'Select Year'}</option><option>${isUK?'Campervan':'2026'}</option><option>${isUK?'Marine':'2025'}</option></select><select aria-label="Make"><option value="">${isUK?'Brand':'Select Make'}</option></select><select aria-label="Model"><option value="">${isUK?'Product type':'Select Model'}</option></select><input type="search" aria-label="Search term" placeholder="${isUK?'Name, MPN or size':'MPN / keyword'}"><button type="submit">Find Parts →</button></form></div></div></div></section>
      <section class="ot-ref-section"><div class="ot-ref-width"><div class="ot-ref-section-head"><h2>Shop by Category</h2><a href="${shopAll}">View All Categories →</a></div><div class="ot-ref-category-grid">${categoryCards()}</div></div></section>
      <section class="ot-ref-section" id="otRefProductsSection"><div class="ot-ref-width"><div class="ot-ref-section-head"><h2>Featured Products</h2><a href="${shopAll}">View All Products →</a></div><div class="ot-ref-products" id="otRefProducts"><div class="ot-ref-empty">Loading current products…</div></div></div></section>
      <section class="ot-ref-trust"><div class="ot-ref-width"><div class="ot-ref-trust-item"><div class="ot-ref-trust-icon">→</div><div><strong>${isUK?'UK Delivery':'Fast, Reliable Shipping'}</strong><span>${isUK?'Delivery details shown for current products.':'Shipping terms shown before checkout.'}</span></div></div><div class="ot-ref-trust-item"><div class="ot-ref-trust-icon">✓</div><div><strong>Secure Checkout</strong><span>Shop with confidence.</span></div></div><div class="ot-ref-trust-item"><div class="ot-ref-trust-icon">⚙</div><div><strong>Expert Fitment Help</strong><span>Get the right part the first time.</span></div></div><div class="ot-ref-trust-item"><div class="ot-ref-trust-icon">?</div><div><strong>Real People, Real Support</strong><span>Here for your next adventure.</span></div></div></div></section>`;
    main.querySelector('#otRefFinder')?.addEventListener('submit',e=>{e.preventDefault();const values=[...e.currentTarget.querySelectorAll('select,input')].map(x=>x.value).filter(Boolean);catalogueSearch(values.join(' '));});
  }

  function mountFooter(){
    const support=isUK?'/uk-contact.html':'/contact-and-order-help.html';const shop=isUK?'/shield-autocare-uk.html':'/us-catalogue.html';
    const footer=document.createElement('footer');footer.className='ot-ref-footer';footer.innerHTML=`<div class="ot-ref-width"><div class="ot-ref-footer-main"><div><a class="ot-ref-footer-logo" href="${isUK?'/uk.html':'/'}"><img src="/assets/omni-terrain-approved-gt.webp?v=1" alt="Omni Terrain"></a><p>Quality parts and outdoor gear for vehicles, water, power and everywhere beyond.</p></div><div><h4>Shop</h4><nav><a href="${shop}">All Products</a><a href="${isUK?'/uk-contact.html':'/automotive.html'}">Auto Parts</a><a href="${isUK?'/uk-contact.html':'/marine.html'}">Marine</a><a href="${isUK?'/shield-autocare-uk.html':'/rv.html'}">${isUK?'Campervan & 12V':'RV & Overlanding'}</a></nav></div><div><h4>Support</h4><nav><a href="${support}">Help Center</a><a href="${isUK?'/uk-shipping-delivery-policy.html':'/shipping-delivery-policy.html'}">Shipping & Delivery</a><a href="${isUK?'/uk-returns-refunds-policy.html':'/returns-refunds-policy.html'}">Returns & Warranty</a><a href="${support}">Fitment Help</a></nav></div><div><h4>About</h4><nav><a href="${support}">Contact Us</a><a href="/privacy-policy.html">Privacy</a><a href="/terms-conditions.html">Terms</a></nav></div><div><h4>Join Our Journey</h4><p>Questions about a product or fitment? Our team is available to help.</p><nav><a href="${support}">Contact Omni Terrain →</a></nav></div></div><div class="ot-ref-footer-bottom"><span>© 2026 Omni Terrain. All rights reserved.</span><span>${isUK?'UK Store · GBP':'US Store · USD'} · Road / Water / Power</span></div></div>`;document.body.appendChild(footer);
  }

  function seo(){
    document.documentElement.lang=isUK?'en-GB':'en-US';
    document.documentElement.classList.add('ot-reference-home');
    document.documentElement.dataset.theme='light';document.documentElement.dataset.otTheme='light';document.documentElement.style.colorScheme='light';
  }
  function init(){removeLegacy();seo();mountHeader();mountMain();mountFooter();renderProducts();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();