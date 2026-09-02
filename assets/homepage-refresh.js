/* Final homepage implementation verification trigger — no locked logo changes. */
(() => {
  'use strict';
  if (window.__OMNI_HOMEPAGE_REFRESH__) return;
  window.__OMNI_HOMEPAGE_REFRESH__ = true;
  const path=(location.pathname||'/').replace(/\/+/g,'/');
  if (!(path==='/' || path.endsWith('/index.html'))) return;

  const onReady=(fn)=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):fn();
  onReady(()=>{
    if(!document.getElementById('ot-home-glitch-fixes')){
      const style=document.createElement('style');
      style.id='ot-home-glitch-fixes';
      style.textContent=`
        .live-media img{position:relative;z-index:1}
        .live-badge{z-index:4!important;pointer-events:none}
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
      showcase.setAttribute('aria-label','View featured Fabtech deal');
      const info=showcase.querySelector('.hero-showcase-info');
      if(info){
        info.innerHTML='<div class="hero-showcase-top"><h2>Fabtech FTL5607</h2><div class="hero-price" data-live-price="F37FTL5607">$199.99</div></div>';
      }
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