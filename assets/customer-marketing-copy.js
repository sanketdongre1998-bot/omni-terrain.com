(() => {
  'use strict';
  if (window.__OMNI_INVESTOR_POLISH__) return;
  window.__OMNI_INVESTOR_POLISH__ = true;
  const CUSTOMER_TRUST_COPY = 'Shop with confidence.';

  const page = decodeURIComponent(String(location.pathname || '/').split('/').filter(Boolean).pop() || 'index.html').toLowerCase();
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const text = (sel, value, root=document) => { const el=$(sel,root); if(el) el.textContent=value; return el; };

  const setMeta=(name,content,property=false)=>{
    const selector=property?`meta[property="${name}"]`:`meta[name="${name}"]`;
    const node=document.querySelector(selector);
    if(node&&content) node.setAttribute('content',content);
  };
  const injectStyles=()=>{
    if(document.getElementById('otInvestorPolishStyles')) return;
    const style=document.createElement('style');
    style.id='otInvestorPolishStyles';
    style.textContent=`
      html.ot-investor-polish{scroll-behavior:smooth}
      html.ot-investor-polish body{-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
      html.ot-investor-polish #header{border-bottom-color:rgba(7,26,48,.08);box-shadow:0 8px 28px rgba(7,26,48,.045)}
      html.ot-investor-polish .header-main{min-height:74px}
      html.ot-investor-polish .nav-links a{position:relative}
      html.ot-investor-polish .nav-links a:after{content:"";position:absolute;left:0;right:0;bottom:-7px;height:2px;transform:scaleX(0);transform-origin:center;background:#c99a3e;transition:transform .18s ease}
      html.ot-investor-polish .nav-links a:hover:after,html.ot-investor-polish .nav-links a.active:after{transform:scaleX(1)}
      html.ot-investor-polish .button,html.ot-investor-polish button{transition:transform .18s ease,box-shadow .18s ease,background .18s ease}
      html.ot-investor-polish .button:hover,html.ot-investor-polish button:hover{transform:translateY(-1px)}
      html.ot-investor-polish a:focus-visible,html.ot-investor-polish button:focus-visible,html.ot-investor-polish input:focus-visible,html.ot-investor-polish select:focus-visible,html.ot-investor-polish textarea:focus-visible{outline:3px solid rgba(201,154,62,.36);outline-offset:3px}
      .ot-hero-search{display:grid;gap:9px;max-width:620px;margin-top:22px}
      .ot-hero-search>label{color:#e0bd72;font:700 .54rem/1.3 "DM Mono",monospace;letter-spacing:.08em;text-transform:uppercase}
      .ot-hero-search-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;padding:6px;border:1px solid rgba(255,255,255,.16);border-radius:14px;background:rgba(255,255,255,.09);backdrop-filter:blur(12px)}
      .ot-hero-search-row input{min-width:0;min-height:44px;border:0;border-radius:9px;padding:0 13px;background:#fff;color:#0b2138;font:700 .72rem/1 Manrope,system-ui,sans-serif;box-shadow:none}
      .ot-hero-search-row input::placeholder{color:#71808e;font-weight:600}
      .ot-hero-search-row button{min-height:44px;border:0;border-radius:9px;padding:0 17px;background:linear-gradient(135deg,#e3bb63,#c99331);color:#071a30;font:850 .68rem/1 Manrope,system-ui,sans-serif;cursor:pointer}
      .ot-hero-search>span{color:#aebdca;font-size:.58rem;line-height:1.45}
      .ot-trust-rail{padding:0 0 16px;background:#f5f7f8}
      .ot-trust-rail>.container{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;overflow:hidden;border:1px solid #dfe5ea;border-radius:16px;background:#dfe5ea;box-shadow:0 10px 30px rgba(7,26,48,.04)}
      .ot-trust-rail>.container>div{padding:18px 20px;background:#fff}
      .ot-trust-rail strong{display:block;color:#071a30;font:800 1.05rem/1.05 "Barlow Condensed",sans-serif;text-transform:uppercase}
      .ot-trust-rail span{display:block;margin-top:5px;color:#65717d;font-size:.59rem;line-height:1.45}
      .ot-checkout-trust{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;margin-top:20px;margin-bottom:0;overflow:hidden;border:1px solid #dfe5ea;border-radius:16px;background:#dfe5ea}
      .ot-checkout-trust>div{padding:16px 18px;background:#fff}
      .ot-checkout-trust strong{display:block;color:#071a30;font-size:.7rem;font-weight:850}
      .ot-checkout-trust span{display:block;margin-top:4px;color:#65717d;font-size:.58rem;line-height:1.45}
      html[data-ot-theme="dark"] .ot-checkout-trust{border-color:#26384a;background:#26384a}
      html[data-ot-theme="dark"] .ot-checkout-trust>div{background:#0d2238}
      html[data-ot-theme="dark"] .ot-checkout-trust strong{color:#f2f5f7}
      html[data-ot-theme="dark"] .ot-checkout-trust span{color:#aab8c5}
      html.ot-investor-polish .contact-panel,html.ot-investor-polish .commerce-card{box-shadow:0 18px 44px rgba(7,26,48,.055)}
      html.ot-investor-polish .address-card{border:1px solid #e7d5ae;background:linear-gradient(145deg,#fffdf6,#fff6e2)}
      html.ot-investor-polish .market-note{font-weight:650}
      @media(max-width:900px){.ot-trust-rail>.container{grid-template-columns:repeat(2,minmax(0,1fr))}.ot-checkout-trust{grid-template-columns:1fr}}
      @media(max-width:620px){.ot-hero-search-row{grid-template-columns:1fr}.ot-hero-search-row button{width:100%}.ot-trust-rail{padding-inline:10px}.ot-trust-rail>.container{grid-template-columns:1fr 1fr}.ot-trust-rail>.container>div{padding:14px}.ot-trust-rail strong{font-size:.92rem}.ot-trust-rail span{font-size:.54rem}}
      @media(max-width:390px){.ot-trust-rail>.container{grid-template-columns:1fr}}
      @media(prefers-reduced-motion:reduce){html.ot-investor-polish{scroll-behavior:auto}html.ot-investor-polish *,html.ot-investor-polish *:before,html.ot-investor-polish *:after{transition:none!important;animation:none!important}}
    `;
    document.head.appendChild(style);
  };
  const replaceParagraph = (needle, replacement) => {
    $$('p').forEach(p => {
      if (String(p.textContent||'').includes(needle)) p.textContent = replacement;
    });
  };
  const neutralizeUsOperator = () => {
    $$('.legal-note').forEach(node => {
      const raw=String(node.textContent||'');
      if (/PRP Xpert LLC|US operator:/i.test(raw)) {
        node.innerHTML='<strong>Omni Terrain US</strong> · Product support +1 307-533-0570 · procurement@omni-terrain.com';
      }
    });
  };
  const renameCartLinks = () => {
    $$('a[href$="cart.html"],a[href="cart.html"]').forEach(a => {
      const count=a.querySelector('[data-cart-count],.cart-count');
      if(count){
        [...a.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).forEach((n,i)=>{ if(i===0) n.nodeValue='Cart '; });
      } else if (/request cart/i.test(a.textContent||'')) a.textContent='Cart';
    });
    $$('a[href$="checkout.html"],a[href="checkout.html"]').forEach(a => {
      if (/guest checkout/i.test(a.textContent||'')) a.textContent='Checkout';
    });
  };

  function mountHomeSearch(){
    const actions=$('.home-actions');
    if(!actions || $('#otHeroSearch')) return;
    const form=document.createElement('form');
    form.id='otHeroSearch';
    form.className='ot-hero-search';
    form.setAttribute('role','search');
    form.innerHTML='<label for="otHeroSearchInput">Find a product by brand or manufacturer part number</label><div class="ot-hero-search-row"><input id="otHeroSearchInput" type="search" autocomplete="off" spellcheck="false" placeholder="Try Fabtech, Blue Sea or an MPN"><button type="submit">Search products</button></div><span>Search the U.S. catalogue by brand, product name or exact MPN.</span>';
    actions.insertAdjacentElement('afterend',form);
    form.addEventListener('submit',event=>{
      event.preventDefault();
      const q=String($('#otHeroSearchInput',form)?.value||'').trim();
      if(q){ try{sessionStorage.setItem('otCatalogueSearch',q);}catch(_){} }
      location.href='/us-catalogue.html#catalogue-search';
    });
  }

  function mountTrustRail(){
    if($('#otTrustRail')) return;
    const hero=$('.home-hero');
    if(!hero) return;
    const section=document.createElement('section');
    section.id='otTrustRail';
    section.className='ot-trust-rail';
    section.setAttribute('aria-label','Why shop Omni Terrain');
    section.innerHTML='<div class="container"><div><strong>Exact MPN lookup</strong><span>Search manufacturer part numbers</span></div><div><strong>Live availability</strong><span>Checkout-ready products are verified</span></div><div><strong>Secure checkout</strong><span>Protected online payment flow</span></div><div><strong>Product support</strong><span>Fitment help before you order</span></div></div>';
    hero.insertAdjacentElement('afterend',section);
  }

  function polishHome(){
    document.title='Automotive, Marine & RV Parts Online | Omni Terrain';
    setMeta('description','Shop automotive, towing, marine and RV parts at Omni Terrain. Search by brand and MPN, get fitment help, live availability and secure U.S. checkout.');
    setMeta('og:title','Omni Terrain | Automotive, Marine & RV Parts',true);
    setMeta('og:description','Specialist automotive, marine, RV and 12V parts with MPN lookup, fitment help and secure U.S. checkout.',true);
    text('.home-kicker','AUTOMOTIVE  •  MARINE  •  RV  •  12V POWER');
    const heroTitle=$('.home-hero-copy h1');
    if(heroTitle) heroTitle.innerHTML='Built for the Road.<br><em>Ready for Water.</em>';
    text('.home-hero-copy > p','Specialist parts for trucks, boats, RVs and 12V systems — clear MPNs, fitment guidance, live availability and secure U.S. checkout.');
    mountHomeSearch();
    mountTrustRail();
    const heads=$$('.section-head');
    if(heads[0]){
      text('.eyebrow','Shop by department',heads[0]);
      text('h2','Shop by application.',heads[0]);
      const p=$(':scope > p',heads[0]); if(p) p.textContent='Start with the vehicle, vessel or system you are working on, then narrow by brand and MPN.';
    }
    if(heads[1]){
      text('.eyebrow','Featured products',heads[1]);
      text('h2','Selected upgrades. Clear pricing.',heads[1]);
      const p=$(':scope > p',heads[1]); if(p) p.textContent='Selected products with straightforward pricing, product detail and support before checkout.';
    }
    neutralizeUsOperator();
  }

  function polishCatalogue(){
    let title='',description='';
    if(page==='us-catalogue.html'){title='Automotive, Marine & RV Parts Catalogue | Omni Terrain';description='Shop Omni Terrain automotive, towing, marine and RV parts by brand, MPN and category with clear online pricing and product support.';}
    else if(page.startsWith('automotive')){title='Truck, Towing & Automotive Parts | Omni Terrain';description='Shop truck, SUV, towing, suspension, lighting and aftermarket automotive parts by brand and MPN at Omni Terrain.';}
    else if(page.startsWith('marine')){title='Marine Parts, Electrical & Boat Equipment | Omni Terrain';description='Shop marine electrical, charging, navigation and boat equipment by brand and manufacturer part number at Omni Terrain.';}
    else if(page.startsWith('rv')){title='RV & Overlanding Parts and Equipment | Omni Terrain';description='Shop RV, travel, towing and overlanding parts and equipment for road trips, campsites and everyday adventure at Omni Terrain.';}
    if(title) document.title=title; if(description) setMeta('description',description);
    const key='otCatalogueSearch';
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      const input=$('.ot-search-input');
      if(input){
        let q='';
        try{q=sessionStorage.getItem(key)||'';sessionStorage.removeItem(key);}catch(_){}
        if(q){
          input.value=q;
          input.dispatchEvent(new Event('input',{bubbles:true}));
          input.focus({preventScroll:true});
          setTimeout(()=>input.scrollIntoView({behavior:'smooth',block:'center'}),60);
        }
        clearInterval(timer);
      } else if(tries>35) clearInterval(timer);
    },120);
  }

  function mountCheckoutTrust(){
    if($('#otCheckoutTrust')) return;
    const layout=$('.commerce-layout');
    if(!layout) return;
    const box=document.createElement('div');
    box.id='otCheckoutTrust';
    box.className='ot-checkout-trust container';
    box.innerHTML='<div><strong>Secure online checkout</strong><span>Payment details are handled in the secure payment flow.</span></div><div><strong>Live availability check</strong><span>We verify eligible products before payment.</span></div><div><strong>Fitment support</strong><span>Need help? Contact us before placing the order.</span></div>';
    layout.insertAdjacentElement('beforebegin',box);
  }

  function polishCheckout(){
    const strip=$('.availability-strip');
    if(strip){
      text('.status-chip','Live availability',strip);
      const spans=$$('span',strip); if(spans[1]) spans[1].textContent='Selected products are verified against the live catalogue before payment.';
    }
    text('.commerce-hero p','Enter your delivery details to confirm product availability and continue securely. If a product needs fitment or stock review, we will show that before payment.');
    const submit=$('#checkoutForm button[type="submit"]'); if(submit) submit.textContent='Continue securely';
    text('.checkout-note','Eligible products continue to secure payment. If an item needs review, we will show that clearly before any payment step.');
    mountCheckoutTrust();
    renameCartLinks();
    neutralizeUsOperator();
  }

  function polishContact(){
    const market=$('.market-note'); if(market) market.textContent='Account optional · Secure online checkout · Product support available.';
    renameCartLinks();
    text('.contact-hero p','Get product, fitment, checkout or order support from the Omni Terrain team. Never send card numbers, passwords or bank credentials by email.');
    const heroLinks=$$('.contact-hero .hero-links a');
    heroLinks.forEach(a=>{if(/open request cart/i.test(a.textContent||'')) a.textContent='Open cart';});
    replaceParagraph('Product details and an order-request reference help the team respond faster.','Product details and an order reference help the team respond faster.');
    const address=$('.address-card');
    if(address) address.innerHTML='<strong>Omni Terrain U.S. support</strong><br>Product &amp; fitment help: support@omni-terrain.com<br>Orders &amp; procurement: procurement@omni-terrain.com<br>Phone: +1 307-533-0570';
    $$('label').forEach(label=>{ if(/Order-request reference/i.test(label.textContent||'')) label.childNodes[0].nodeValue='Order reference (optional)'; });
    $$('.help-step span').forEach(node=>{
      node.textContent=node.textContent.replace('BEFORE REQUEST','BEFORE ORDER').replace('AFTER ACCEPTANCE','AFTER PURCHASE');
    });
    replaceParagraph('United States product, request-checkout and supplier support','United States product, checkout and supplier support');
    neutralizeUsOperator();
  }

  function polishAbout(){
    replaceParagraph('Omni Terrain is being built for people who want to understand gear before they buy it.','Omni Terrain is a specialist store for automotive, marine, RV and 12V products, built around clear product information, practical buying guidance and support before and after purchase.');
    replaceParagraph('Direct products, outside recommendations and support options will be clearly labeled','Products, support options and buying guidance are clearly labeled');
    neutralizeUsOperator();
  }

  function polishProductCopy(){
    document.querySelectorAll('.ot-live-trust').forEach(node=>{node.textContent='Secure checkout · Clear online pricing · Product support from Omni Terrain.';});
    document.querySelectorAll('.ot-live-label').forEach(node=>{if(/online price|launch price/i.test(node.textContent||''))node.textContent='Online price';});
    document.querySelectorAll('.ot-live-stock').forEach(node=>{if(/available online/i.test(node.textContent||''))node.textContent='In stock online';});
  }

  function addBrandSchema(){
    if(document.getElementById('otBrandSchema')) return;
    const script=document.createElement('script');
    script.id='otBrandSchema';
    script.type='application/ld+json';
    script.textContent=JSON.stringify({
      '@context':'https://schema.org',
      '@type':'Brand',
      name:'Omni Terrain',
      url:'https://omni-terrain.com/',
      slogan:'Road / Water / Power',
      description:'Specialist automotive, marine, RV, overlanding and 12V products with manufacturer part-number lookup and product support.'
    });
    document.head.appendChild(script);
  }

  function apply(){
    document.documentElement.classList.add('ot-investor-polish');
    injectStyles();
    polishProductCopy();
    addBrandSchema();
    renameCartLinks();
    if(page==='index.html') polishHome();
    if(page==='us-catalogue.html' || /^(automotive|marine|rv)(?:-|\.)/.test(page)) polishCatalogue();
    if(page==='checkout.html') polishCheckout();
    if(page==='contact-and-order-help.html') polishContact();
    if(page==='about-omni-terrain.html') polishAbout();
  }

  const start=()=>{apply();setTimeout(apply,450);setTimeout(apply,1400);};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
