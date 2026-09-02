/* Final homepage implementation verification trigger — no locked logo changes. */
(() => {
  'use strict';
  if (window.__OMNI_HOMEPAGE_REFRESH__) return;
  window.__OMNI_HOMEPAGE_REFRESH__ = true;
  const path=(location.pathname||'/').replace(/\/+/g,'/');
  if (!(path==='/' || path.endsWith('/index.html'))) return;

  const FEATURED_OFFERS=[
    {id:'HUS81147',slug:'us-husky-towing-81147.html'},
    {id:'HUS81148',slug:'us-husky-towing-81148.html'},
    {id:'CCIN9010F',slug:'us-coast2coast-iwcn9010f.html'},
    {id:'CCIN8010F',slug:'us-coast2coast-iwcn8010f.html'},
    {id:'CCIIMP103X',slug:'us-coast2coast-iwcimp103x.html'},
    {id:'A1360828HD',slug:'us-air-lift-60828hd.html'},
    {id:'B5224066464',slug:'us-bilstein-24-066464.html'}
  ];
  const money=cents=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format((Number(cents)||0)/100);
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const basename=value=>{try{return decodeURIComponent(String(value||'').split('?')[0].split('#')[0].split('/').pop()||'').toLowerCase();}catch(_){return String(value||'').toLowerCase();}};
  const onReady=(fn)=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();

  async function loadVerifiedFeaturedOffers(){
    try{
      const [registryResponse,stockResponse]=await Promise.all([
        fetch('/assets/us-live-products.json?v=home-featured-verified',{cache:'no-store'}),
        fetch('/assets/us-stock-status.json?v=home-featured-stock',{cache:'no-store'})
      ]);
      if(!registryResponse.ok||!stockResponse.ok)return[];
      const [registry,stock]=await Promise.all([registryResponse.json(),stockResponse.json()]);
      const registryTime=Date.parse(String(registry?.generatedAtUTC||'')),stockTime=Date.parse(String(stock?.generatedAtUTC||''));
      if(!Number.isFinite(registryTime)||!Number.isFinite(stockTime)||stockTime<registryTime)return[];
      const eligible=[];
      for(const item of FEATURED_OFFERS){
        const row=registry?.products?.[item.id],status=stock?.products?.[item.id];
        if(!row||row.enabled!==true||row.authorizationVerified!==true||row.liveKeystoneOrderable!==true||Number(row.priceCents)<=0)continue;
        if(status?.checkoutReady!==true||status?.status!=='in_stock'||status?.liveApi!=='ORDERABLE'||basename(status?.slug)!==basename(item.slug))continue;
        const shippingCents=Math.max(0,Math.round((Number(row.shippingQuoteUSD)||0)*100));
        const priceCents=Math.max(0,Math.round(Number(row.priceCents)||0));
        if(!priceCents)continue;
        eligible.push({...item,row,priceCents,shippingCents,regularDeliveredCents:priceCents+shippingCents});
      }
      return eligible;
    }catch(_){return[];}
  }

  async function hydrateFeaturedOffer(item){
    try{
      const response=await fetch('/'+item.slug,{cache:'force-cache'});
      if(!response.ok)return null;
      const html=await response.text();
      const doc=new DOMParser().parseFromString(html,'text/html');
      const img=doc.querySelector('.product-visual img')?.getAttribute('src')||doc.querySelector('main img')?.getAttribute('src')||'';
      const title=(doc.querySelector('main h1')?.textContent||doc.querySelector('h1')?.textContent||item.row?.mpn||'Featured product').replace(/\s+/g,' ').trim();
      const brand=(doc.querySelector('.product-copy .kicker')?.textContent||doc.querySelector('.kicker')?.textContent||'Omni Terrain').replace(/\s+/g,' ').trim().split('·')[0].trim();
      return {...item,img,title,brand};
    }catch(_){return null;}
  }

  function mountDynamicShowcase(showcase,items){
    if(!showcase||!items.length)return;
    const image=showcase.querySelector('img');
    const info=showcase.querySelector('.hero-showcase-info');
    if(!image||!info)return;
    let index=Math.floor(Date.now()/6000)%items.length;

    const render=item=>{
      if(!item)return;
      showcase.href=item.slug;
      showcase.setAttribute('aria-label',`View featured deal: ${item.title}`);
      if(item.img){image.src=item.img;image.alt=item.title;}
      const saveCents=Math.max(0,item.shippingCents);
      const savePct=item.regularDeliveredCents>0?Math.round((saveCents/item.regularDeliveredCents)*100):0;
      const pricing=saveCents>0
        ? `<div class="ot-hero-deal-pricing"><div class="ot-hero-was"><span>Regular delivered value</span><s>${money(item.regularDeliveredCents)}</s></div><div class="ot-hero-now"><span>Featured price</span><strong>${money(item.priceCents)}</strong></div><div class="ot-hero-save">Save ${money(saveCents)}${savePct?` (${savePct}% off)`:''} · Free standard shipping</div></div>`
        : `<div class="ot-hero-deal-pricing"><div class="ot-hero-now"><span>Featured price</span><strong>${money(item.priceCents)}</strong></div></div>`;
      info.innerHTML=`<div class="hero-showcase-top"><div><small>${esc(item.brand)} · MPN ${esc(item.row?.mpn||'')}</small><h2>${esc(item.title)}</h2></div>${pricing}</div>`;
      showcase.dataset.otFeaturedId=item.id;
    };

    render(items[index]);
    if(items.length>1){
      const timer=setInterval(()=>{index=(index+1)%items.length;render(items[index]);},6000);
      window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
    }
  }

  onReady(()=>{
    if(!document.getElementById('ot-home-glitch-fixes')){
      const style=document.createElement('style');
      style.id='ot-home-glitch-fixes';
      style.textContent=`
        .live-media img{position:relative;z-index:1}
        .live-badge{z-index:4!important;pointer-events:none}
        .hero-showcase .hero-showcase-top{align-items:flex-end}
        .hero-showcase .hero-showcase-top>div:first-child{min-width:0;flex:1}
        .hero-showcase .hero-showcase-top h2{overflow-wrap:anywhere}
        .ot-hero-deal-pricing{display:grid;min-width:190px;gap:5px;text-align:right}
        .ot-hero-was,.ot-hero-now{display:flex;align-items:baseline;justify-content:flex-end;gap:9px}
        .ot-hero-was span,.ot-hero-now span{color:#65717d;font:700 .48rem/1.2 "DM Mono",monospace;text-transform:uppercase}
        .ot-hero-was s{color:#7d8995;font:800 1rem/1 "Barlow Condensed",sans-serif}
        .ot-hero-now strong{color:#071a30;font:800 2rem/1 "Barlow Condensed",sans-serif}
        .ot-hero-save{color:#167047;font-size:.58rem;font-weight:850}
        html[data-ot-theme="dark"] .ot-hero-was span,html[data-ot-theme="dark"] .ot-hero-now span{color:#7d8995}
        @media(max-width:760px){.hero-showcase .hero-showcase-top{display:grid;gap:10px}.ot-hero-deal-pricing{min-width:0;text-align:left}.ot-hero-was,.ot-hero-now{justify-content:flex-start}.ot-hero-now strong{font-size:1.65rem}}
        /* Preserve department photography when the runtime dark-theme surface rule
           uses the background shorthand. Light mode remains untouched. */
        html[data-ot-theme="dark"] .category-home:nth-child(1){background-image:url('https://vehiclepartimages.com/ImageServerAPI?File=FAB/Images/FTL5607_1.jpg&maxheight=500&maxwidth=700')!important}
        html[data-ot-theme="dark"] .category-home:nth-child(2){background-image:url('https://vehiclepartimages.com/ImageServerAPI?File=HUM/Images/410190-1_1.jpg&maxheight=500&maxwidth=700')!important}
        html[data-ot-theme="dark"] .category-home:nth-child(3){background-image:url('https://vehiclepartimages.com/ImageServerAPI?File=VLT/Images/K88205_1.jpg&maxheight=500&maxwidth=700')!important}
        html[data-ot-theme="dark"] .category-home:nth-child(4){background-image:url('https://vehiclepartimages.com/ImageServerAPI?File=BLU/Images/5026-BSS_1.jpg&maxheight=500&maxwidth=700')!important}
      `;
      document.head.appendChild(style);
    }

    const kicker=document.querySelector('.home-kicker');
    if(kicker) kicker.textContent='AUTOMOTIVE  •  MARINE  •  RV  •  12V POWER';

    const heroTitle=document.querySelector('.home-hero-copy h1');
    if(heroTitle) heroTitle.innerHTML='Built for the Road.<br><em>Ready for Water.</em>';

    const heroCopy=document.querySelector('.home-hero-copy > p');
    if(heroCopy) heroCopy.textContent='Specialist automotive, marine, RV & 12V parts.';

    const proof=document.querySelector('.home-proof');
    if(proof){
      const first=proof.querySelector('div:first-child');
      if(first){
        const b=first.querySelector('b');
        const span=first.querySelector('span');
        if(b)b.textContent='Specialist range';
        if(span)span.textContent='Auto, marine, RV & 12V essentials';
      }
    }

    const showcase=document.querySelector('.hero-showcase');
    if(showcase){
      loadVerifiedFeaturedOffers().then(rows=>Promise.all(rows.map(hydrateFeaturedOffer))).then(rows=>mountDynamicShowcase(showcase,rows.filter(Boolean))).catch(()=>{});
    }

    const sectionHeads=[...document.querySelectorAll('.section-head')];
    if(sectionHeads[0]){
      const eye=sectionHeads[0].querySelector('.eyebrow');
      const h=sectionHeads[0].querySelector('h2');
      const p=sectionHeads[0].querySelector(':scope > p');
      if(eye) eye.textContent='Shop by department';
      if(h) h.textContent='Shop your setup.';
      if(p) p.textContent='Automotive, marine, RV and 12V essentials in one specialist store.';
    }
    if(sectionHeads[1]){
      const eye=sectionHeads[1].querySelector('.eyebrow');
      const h=sectionHeads[1].querySelector('h2');
      const p=sectionHeads[1].querySelector(':scope > p');
      if(eye) eye.textContent='Featured products';
      if(h) h.textContent='Popular upgrades.';
      if(p) p.textContent='Selected products with clear pricing and straightforward product details.';
    }

    const grid=document.querySelector('.category-grid-home');
    if(grid){
      const cards=[...grid.querySelectorAll('.category-home')];
      const config=[
        ['01 / AUTO','Auto Parts','Shop Auto Parts →'],
        ['02 / MARINE','Marine','Shop Marine →'],
        ['03 / RV','RV & Overlanding','Shop RV →']
      ];
      cards.forEach((card,i)=>{
        const [num,title,go]=config[i]||[];
        if(!title) return;
        const n=card.querySelector('.num'),h=card.querySelector('h3'),g=card.querySelector('.go');
        if(n)n.textContent=num;if(h)h.textContent=title;if(g)g.textContent=go;
      });
      if(!grid.querySelector('[data-ot-category="12v"]')){
        const card=document.createElement('a');
        card.className='category-home';
        card.href='us-catalogue.html';
        card.dataset.otCategory='12v';
        card.innerHTML='<span class="num">04 / 12V</span><span class="count">Electrical</span><h3>12V Power</h3><p>Electrical and power products for road, water and travel.</p><span class="go">Shop 12V Power →</span>';
        grid.appendChild(card);
      }
    }

    const whyCards=[...document.querySelectorAll('.why-card')];
    const benefits=[
      ['01 / SHIPPING','Free featured shipping','On eligible featured offers in the contiguous U.S.'],
      ['02 / CHECKOUT','Secure checkout','Simple encrypted online payment.'],
      ['03 / SUPPORT','Product support','Help with product selection and fitment.']
    ];
    whyCards.forEach((card,i)=>{
      if(!benefits[i]) return;
      const [tag,title,copy]=benefits[i];
      const s=card.querySelector('span'),h=card.querySelector('h3'),p=card.querySelector('p');
      if(s)s.textContent=tag;if(h)h.textContent=title;if(p)p.textContent=copy;
    });
  });
})();