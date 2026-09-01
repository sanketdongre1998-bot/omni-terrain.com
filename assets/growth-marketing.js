(() => {
  "use strict";
  if (window.__OMNI_GROWTH_MARKETING__) return;
  window.__OMNI_GROWTH_MARKETING__ = true;

  const path = decodeURIComponent(String(location.pathname || "/").split("/").filter(Boolean).pop() || "index.html").toLowerCase();
  const CART_KEY = "omniTerrainUsCart";
  const COUPON_KEY = "omniTerrainUsCoupon";
  const PROMO_CODE = "OMNI5";
  const PROMO_MIN_CENTS = 15000;
  const PROMO_SAVE_CENTS = 500;
  const FEATURED_IDS = new Set(["HUS81147","HUS81148","CCIN9010F","CCIN8010F","CCIIMP103X","A1360828HD","B5224066464"]);
  const FALLBACK_OFFERS = {
    HUS81147:{priceCents:11999,compareAtCents:12626,label:"Featured Deal",shippingIncluded:true,slug:"us-husky-towing-81147.html"},
    HUS81148:{priceCents:14999,compareAtCents:15828,label:"Featured Deal",shippingIncluded:true,slug:"us-husky-towing-81148.html"},
    CCIN9010F:{priceCents:21999,compareAtCents:23900,label:"Featured Deal",shippingIncluded:true,slug:"us-coast2coast-iwcn9010f.html"},
    CCIN8010F:{priceCents:19999,compareAtCents:21900,label:"Featured Deal",shippingIncluded:true,slug:"us-coast2coast-iwcn8010f.html"},
    CCIIMP103X:{priceCents:16999,compareAtCents:18065,label:"Featured Deal",shippingIncluded:true,slug:"us-coast2coast-iwcimp103x.html"},
    A1360828HD:{priceCents:20499,compareAtCents:21399,label:"Featured Deal",shippingIncluded:true,slug:"us-air-lift-60828hd.html"},
    B5224066464:{priceCents:13299,compareAtCents:13697,label:"Featured Deal",shippingIncluded:true,slug:"us-bilstein-24-066464.html"}
  };
  const descriptions = {
    HUS81147:"Four-bike hitch-mounted carrier for road trips, weekend rides and everyday transport.",
    HUS81148:"500 lb hitch-mounted cargo carrier for hauling gear, luggage and road-trip essentials.",
    CCIN9010F:"Chrome front wheel simulator for compatible 2019–2025 Ram 3500 applications.",
    CCIN8010F:"Chrome front wheel simulator for compatible 2003–2018 Ram 3500 applications.",
    CCIIMP103X:"Chrome 18-inch six-spoke wheel-cover upgrade for compatible 2022–2025 Toyota Tundra applications.",
    A1360828HD:"Load-support air spring kit for compatible Ram 1500 applications.",
    B5224066464:"Bilstein B8 5100 shock absorber for compatible Ram 2500/3500 lifted applications."
  };

  const money = cents => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format((Number(cents)||0)/100);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const offers = () => (window.OMNI_US_LAUNCH_OFFERS && Object.keys(window.OMNI_US_LAUNCH_OFFERS).length ? window.OMNI_US_LAUNCH_OFFERS : FALLBACK_OFFERS);

  function readCart(){
    try{
      const data=JSON.parse(localStorage.getItem(CART_KEY)||"[]");
      return Array.isArray(data)?data:[];
    }catch(_){return [];}
  }
  function savedCoupon(){return String(localStorage.getItem(COUPON_KEY)||"").trim().toUpperCase();}
  function saveCoupon(code){
    const value=String(code||"").trim().toUpperCase();
    if(value) localStorage.setItem(COUPON_KEY,value); else localStorage.removeItem(COUPON_KEY);
    return value;
  }

  function injectStyles(){
    if(document.getElementById("otGrowthMarketingStyles")) return;
    const style=document.createElement("style");
    style.id="otGrowthMarketingStyles";
    style.textContent=`
      .ot-deal-nav{position:relative}.ot-deal-nav:after{content:"SALE";position:absolute;right:-14px;top:-8px;padding:2px 4px;border-radius:5px;background:#c69a50;color:#071a30;font:900 8px/1 Manrope,sans-serif;letter-spacing:.04em}
      .ot-growth-banner{margin:0 0 18px}.ot-growth-banner-inner{position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(300px,.85fr);min-height:300px;padding:42px 46px;border-radius:26px;background:radial-gradient(circle at 83% 22%,rgba(224,189,114,.25),transparent 24%),linear-gradient(125deg,#061629 0%,#0a2945 62%,#123b5b 100%);box-shadow:0 24px 60px rgba(7,26,48,.18);color:#fff}.ot-growth-banner-inner:after{content:"";position:absolute;right:-80px;bottom:-130px;width:520px;height:520px;border:1px solid rgba(224,189,114,.18);border-radius:50%;box-shadow:0 0 0 70px rgba(224,189,114,.035),0 0 0 140px rgba(224,189,114,.025)}
      .ot-growth-kicker{color:#e0bd72;font:700 11px/1 "DM Mono",monospace;letter-spacing:.12em;text-transform:uppercase}.ot-growth-banner h2{position:relative;z-index:1;max-width:760px;margin:14px 0 12px;font:800 clamp(3.3rem,5.8vw,6.2rem)/.78 "Barlow Condensed",sans-serif;text-transform:uppercase;letter-spacing:-.035em}.ot-growth-banner p{position:relative;z-index:1;max-width:680px;margin:0;color:#d4e0eb;font-size:14px;line-height:1.7}.ot-growth-actions{position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}.ot-growth-cta{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 18px;border-radius:10px;background:#d3a746;color:#071a30!important;text-decoration:none;font-weight:900}.ot-growth-code{display:inline-flex;align-items:center;padding:12px 15px;border:1px solid rgba(255,255,255,.18);border-radius:10px;color:#fff;font-size:12px;font-weight:800}.ot-growth-code strong{margin-left:6px;color:#e0bd72;letter-spacing:.08em}.ot-growth-benefits{position:relative;z-index:1;display:flex;flex-wrap:wrap;align-content:flex-end;justify-content:flex-end;gap:10px;padding-left:30px}.ot-growth-benefits span{padding:10px 12px;border:1px solid rgba(255,255,255,.14);border-radius:999px;background:rgba(255,255,255,.06);font-size:11px;font-weight:800}.ot-growth-terms{position:absolute;right:46px;bottom:22px;z-index:1;color:#91a8ba;font-size:9px}
      .ot-promo-box{margin:18px 0 0;padding:18px;border:1px solid #dfd0ab;border-radius:14px;background:#fff9ec}.ot-promo-box strong{display:block;color:#071a30;font-size:13px}.ot-promo-box p{margin:5px 0 10px;color:#65717d;font-size:11px;line-height:1.55}.ot-promo-row{display:flex;gap:8px}.ot-promo-input{min-width:0;flex:1;height:42px;padding:0 12px;border:1px solid #ccd5dc;border-radius:9px;background:#fff;color:#071a30;font-weight:800;text-transform:uppercase}.ot-promo-button{height:42px;padding:0 14px;border:0;border-radius:9px;background:#071a30;color:#fff;font-weight:850;cursor:pointer}.ot-promo-message{margin-top:8px;color:#167047;font-size:10px;font-weight:750}.ot-promo-message.error{color:#8a3d31}
      .ot-checkout-promo{margin:12px 0;padding:12px 14px;border:1px solid #dfd0ab;border-radius:10px;background:#fff9ec;color:#59491f;font-size:11px;line-height:1.5}.ot-checkout-promo strong{color:#071a30}
      .ot-deals-page{padding:48px 0 82px}.ot-deals-hero{padding:44px;border-radius:25px;background:linear-gradient(125deg,#061629,#103958);color:#fff;box-shadow:0 22px 54px rgba(7,26,48,.18)}.ot-deals-hero h1{max-width:880px;margin:14px 0 12px;font:800 clamp(4rem,7vw,7.5rem)/.76 "Barlow Condensed",sans-serif;text-transform:uppercase;letter-spacing:-.04em}.ot-deals-hero p{max-width:760px;margin:0;color:#d4e0eb;font-size:14px;line-height:1.75}.ot-deals-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}.ot-deals-chips span{padding:8px 10px;border:1px solid rgba(255,255,255,.16);border-radius:999px;font-size:10px;font-weight:800}.ot-deals-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:17px;margin-top:24px}.ot-deal-card{display:flex;flex-direction:column;overflow:hidden;border:1px solid #dde4e9;border-radius:19px;background:#fff;box-shadow:0 11px 30px rgba(7,26,48,.05)}.ot-deal-media{position:relative;display:grid;place-items:center;height:250px;padding:24px;background:linear-gradient(145deg,#fafbfc,#e8edf0)}.ot-deal-media img{width:100%;height:190px;object-fit:contain}.ot-deal-badge{position:absolute;left:13px;top:13px;padding:7px 9px;border-radius:999px;background:#e8f4ed;color:#176d49;font:800 10px/1 "DM Mono",monospace;text-transform:uppercase}.ot-deal-body{display:flex;flex:1;flex-direction:column;padding:19px}.ot-deal-brand{display:flex;justify-content:space-between;gap:10px;color:#8b6a31;font:700 10px/1.3 "DM Mono",monospace;text-transform:uppercase}.ot-deal-card h2{margin:11px 0 8px;color:#071a30;font:800 26px/.92 "Barlow Condensed",sans-serif;text-transform:uppercase}.ot-deal-card p{margin:0;color:#65717d;font-size:11px;line-height:1.6}.ot-deal-price{margin-top:auto;padding-top:16px;color:#071a30;font:900 28px/1 "Barlow Condensed",sans-serif}.ot-deal-price small{display:block;margin-bottom:5px;color:#167047;font:800 10px/1.4 Manrope,sans-serif}.ot-deal-button{display:flex;align-items:center;justify-content:center;margin-top:13px;min-height:44px;border-radius:9px;background:#071a30;color:#fff!important;text-decoration:none;font-weight:850}.ot-deals-info{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22px}.ot-deals-info div{padding:18px;border:1px solid #e0e5e9;border-radius:15px;background:#fff}.ot-deals-info strong{display:block;color:#071a30;font-size:12px}.ot-deals-info span{display:block;margin-top:5px;color:#65717d;font-size:10px;line-height:1.5}
      @media(max-width:900px){.ot-growth-banner-inner{grid-template-columns:1fr}.ot-growth-benefits{justify-content:flex-start;padding:24px 0 20px}.ot-growth-terms{position:static;margin-top:10px}.ot-deals-grid{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:620px){.ot-growth-banner-inner{min-height:0;padding:28px 22px;border-radius:20px}.ot-growth-banner h2{font-size:3.8rem}.ot-growth-benefits{gap:7px}.ot-growth-benefits span{font-size:9px}.ot-promo-row{display:grid}.ot-deals-page{padding-top:28px}.ot-deals-hero{padding:28px 22px}.ot-deals-grid{grid-template-columns:1fr}.ot-deals-info{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function addDealsNav(){
    const navs=document.querySelectorAll(".nav-links,.nav,.ot-site-nav,.mobile-nav,.ot-site-mobile-nav");
    navs.forEach(nav=>{
      if(nav.querySelector('a[href="deals.html"],a[href="/deals.html"]')) return;
      const link=document.createElement("a");
      link.href="deals.html";
      link.textContent="Deals";
      link.className="ot-deal-nav";
      const shop=[...nav.querySelectorAll("a")].find(a=>/shop all|all products/i.test(a.textContent||""));
      if(shop?.nextSibling) nav.insertBefore(link,shop.nextSibling); else nav.appendChild(link);
    });
  }

  function mountHomeBanner(){
    if(!(path==="index.html"||path==="")) return;
    if(document.querySelector(".ot-growth-banner")) return;
    const hero=document.querySelector(".home-hero");
    if(!hero) return;
    const section=document.createElement("section");
    section.className="ot-growth-banner";
    section.innerHTML=`<div class="container"><div class="ot-growth-banner-inner"><div><div class="ot-growth-kicker">7 featured deals · Auto & truck</div><h2>Save on the upgrades that matter.</h2><p>Featured pricing on towing, cargo, wheel and suspension upgrades, plus free standard shipping on featured offers in the contiguous U.S.</p><div class="ot-growth-actions"><a class="ot-growth-cta" href="deals.html">Shop Featured Deals →</a><span class="ot-growth-code">Extra $5 off $150+ regular-priced orders · Code <strong>OMNI5</strong></span></div></div><div class="ot-growth-benefits"><span>Featured savings</span><span>Secure Stripe checkout</span><span>Free shipping on featured deals</span></div><div class="ot-growth-terms">OMNI5 excludes featured-deal items and cannot be combined with other promotional pricing.</div></div></div>`;
    hero.insertAdjacentElement("afterend",section);
  }

  async function productImage(slug){
    try{
      const response=await fetch(`/${String(slug||"").replace(/^\//,"")}`,{cache:"force-cache"});
      if(!response.ok)return "/assets/omni-terrain-emblem.webp";
      const html=await response.text();
      const doc=new DOMParser().parseFromString(html,"text/html");
      return doc.querySelector(".product-visual img")?.getAttribute("src")||"/assets/omni-terrain-emblem.webp";
    }catch(_){return "/assets/omni-terrain-emblem.webp";}
  }

  async function mountDealsPage(){
    if(path!=="deals.html") return;
    const root=document.getElementById("otDealsGrid");
    if(!root||root.dataset.ready) return;
    root.dataset.ready="1";
    let registry={products:{}};
    try{const r=await fetch("/assets/us-live-products.json?v=deals-7",{cache:"no-store"});if(r.ok)registry=await r.json();}catch(_){}
    let products=[];
    try{if(typeof OMNI_US_PRODUCTS!=="undefined"&&Array.isArray(OMNI_US_PRODUCTS))products=OMNI_US_PRODUCTS;}catch(_){}
    const byId=new Map(products.map(p=>[String(p.id),p]));
    const list=[];
    for(const [id,offer] of Object.entries(offers())){
      const row=registry?.products?.[id];
      const p=byId.get(id);
      if(!row||row.enabled!==true||row.authorizationVerified!==true||!p)continue;
      list.push({id,offer,row,p});
    }
    const imgs=await Promise.all(list.map(x=>productImage(x.p.slug||x.offer.slug)));
    root.innerHTML=list.map((x,i)=>{
      const save=x.offer.compareAtCents-x.offer.priceCents;
      return `<article class="ot-deal-card"><a class="ot-deal-media" href="${esc(x.p.slug||x.offer.slug)}"><span class="ot-deal-badge">Save ${money(save)}</span><img src="${esc(imgs[i])}" alt="${esc(x.p.title||x.p.mpn)}" loading="${i<2?"eager":"lazy"}" decoding="async"></a><div class="ot-deal-body"><div class="ot-deal-brand"><span>${esc(x.p.brand||"Omni Terrain")}</span><span>MPN ${esc(x.p.mpn||"")}</span></div><h2>${esc(x.p.title||x.p.mpn)}</h2><p>${esc(descriptions[x.id]||"Featured pricing with clear product details and secure online checkout.")}</p><div class="ot-deal-price"><small>Was <s>${money(x.offer.compareAtCents)}</s> · Save ${money(save)}</small>${money(x.offer.priceCents)}</div><a class="ot-deal-button" href="${esc(x.p.slug||x.offer.slug)}">Shop This Deal →</a></div></article>`;
    }).join("");
  }

  function mountPromoBox(){
    if(path!=="cart.html") return;
    if(document.querySelector(".ot-promo-box")) return;
    const aside=[...document.querySelectorAll("aside.commerce-card,.commerce-card")].find(node=>/summary/i.test(node.querySelector("h2")?.textContent||""));
    if(!aside) return;
    const note=aside.querySelector(".checkout-note");
    const box=document.createElement("div");
    box.className="ot-promo-box";
    box.innerHTML=`<strong>Have a promo code?</strong><p><b>OMNI5</b> saves $5 on regular-priced orders of $150+. Featured deals are already specially priced and cannot be combined with this code.</p><div class="ot-promo-row"><input class="ot-promo-input" aria-label="Promo code" placeholder="Enter promo code" maxlength="24" value="${esc(savedCoupon())}"><button class="ot-promo-button" type="button">Apply</button></div><div class="ot-promo-message" aria-live="polite"></div>`;
    if(note)aside.insertBefore(box,note);else aside.appendChild(box);
    const input=box.querySelector("input");
    const button=box.querySelector("button");
    const msg=box.querySelector(".ot-promo-message");
    const update=()=>{
      const code=String(input.value||"").trim().toUpperCase();
      if(!code){saveCoupon("");msg.textContent="";msg.classList.remove("error");return;}
      if(code!==PROMO_CODE){msg.textContent="That promo code is not recognized.";msg.classList.add("error");return;}
      if(readCart().some(item=>FEATURED_IDS.has(String(item?.id||"")))){
        saveCoupon("");
        msg.textContent="Featured deal pricing is already applied to this cart, so OMNI5 cannot be stacked.";
        msg.classList.add("error");
        return;
      }
      saveCoupon(code);
      msg.textContent="OMNI5 saved. Final $150 eligibility is confirmed at secure checkout.";
      msg.classList.remove("error");
    };
    button.addEventListener("click",update);
    input.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();update();}});
    if(savedCoupon()) setTimeout(update,0);
  }

  function mountCheckoutPromo(){
    if(path!=="checkout.html") return;
    const code=savedCoupon();
    if(!code||document.querySelector(".ot-checkout-promo")) return;
    const shell=document.querySelector(".commerce-shell");
    if(!shell)return;
    const node=document.createElement("div");
    node.className="ot-checkout-promo";
    node.innerHTML=`Promo code <strong>${esc(code)}</strong> will be validated before Stripe checkout. OMNI5 applies to eligible $150+ regular-priced orders.`;
    shell.appendChild(node);
  }

  function interceptCheckout(){
    if(window.__OMNI_PROMO_FETCH_INTERCEPT__)return;
    window.__OMNI_PROMO_FETCH_INTERCEPT__=true;
    const nativeFetch=window.fetch.bind(window);
    window.fetch=async function(input,init){
      let url="";
      try{url=typeof input==="string"?input:String(input?.url||"");}catch(_){}
      if(/\/api\/us-create-checkout-session(?:\?|$)/i.test(url)&&init&&typeof init.body==="string"){
        try{
          const data=JSON.parse(init.body);
          const code=savedCoupon();
          if(code)data.couponCode=code;
          init={...init,body:JSON.stringify(data)};
        }catch(_){}
      }
      return nativeFetch(input,init);
    };
  }

  function clearAfterSuccess(){if(path==="us-order-success.html")localStorage.removeItem(COUPON_KEY);}

  function mount(){
    injectStyles();
    addDealsNav();
    mountHomeBanner();
    mountPromoBox();
    mountCheckoutPromo();
    mountDealsPage();
    clearAfterSuccess();
  }

  interceptCheckout();
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
  if("MutationObserver" in window){
    let timer=0;
    const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{addDealsNav();mountPromoBox();mountCheckoutPromo();},80);});
    observer.observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener("pagehide",()=>observer.disconnect(),{once:true});
  }
})();