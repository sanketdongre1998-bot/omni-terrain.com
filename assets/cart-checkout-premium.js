(() => {
  "use strict";
  if (window.__OMNI_CART_CHECKOUT_PREMIUM__) return;
  const file=decodeURIComponent(String(location.pathname||"").split("/").filter(Boolean).pop()||"").toLowerCase();
  if(file!=="cart.html"&&file!=="checkout.html")return;
  window.__OMNI_CART_CHECKOUT_PREMIUM__=true;

  const CART_KEY="omniTerrainUsCart",COUPON_KEY="omniTerrainUsCoupon";
  const PROMO_CODE="OMNI5",PROMO_MIN_CENTS=15000,PROMO_SAVE_CENTS=500;
  const FEATURED_DEAL_IDS=new Set(["HUS81147","HUS81148","CCIN9010F","CCIN8010F","CCIIMP103X","A1360828HD","B5224066464"]);
  const isCheckout=file==="checkout.html";
  const money=cents=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format((Number(cents)||0)/100);
  const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));

  function readCart(){try{const raw=JSON.parse(localStorage.getItem(CART_KEY)||"[]");return Array.isArray(raw)?raw.filter(x=>x&&typeof x.id==="string").map(x=>({id:String(x.id),quantity:Math.min(10,Math.max(1,Math.floor(Number(x.quantity)||1)))})):[];}catch(_){return[];}}
  function writeCart(cart){localStorage.setItem(CART_KEY,JSON.stringify(cart));const count=cart.reduce((sum,row)=>sum+row.quantity,0);document.querySelectorAll("[data-cart-count]").forEach(node=>node.textContent=String(count));}
  function productMap(){try{if(typeof OMNI_US_PRODUCTS!=="undefined"&&Array.isArray(OMNI_US_PRODUCTS))return new Map(OMNI_US_PRODUCTS.map(p=>[String(p.id),p]));}catch(_){}return new Map();}

  async function loadPriceMap(){
    try{const response=await fetch("/assets/us-display-prices.js?v=4",{cache:"force-cache"});if(!response.ok)throw new Error();const source=await response.text(),marker="const PRICES = ",start=source.indexOf(marker);if(start<0)throw new Error();const from=start+marker.length,end=source.indexOf(";\n\n  function money",from);if(end<0)throw new Error();return JSON.parse(source.slice(from,end));}catch(_){return{};}
  }
  async function loadLiveSet(){
    try{const response=await fetch("/assets/us-live-products.json?v=eligibility-auth5",{cache:"no-store"});if(!response.ok)return new Set();const data=await response.json();return new Set(Object.entries(data?.products||{}).filter(([,p])=>p&&p.enabled===true&&p.authorizationVerified===true&&Number(p.priceCents)>0).map(([id])=>String(id)));}catch(_){return new Set();}
  }
  function normalizedRows(cart,products,prices,liveSet){const rows=[];for(const item of cart){const product=products.get(item.id);if(!product)continue;const price=prices[String(product.slug||"").split("/").pop()]||null;rows.push({item,product,priceCents:Number(price?.priceCents||0),onlineReady:liveSet.has(item.id)});}return rows;}
  function steps(active){return `<div class="ot-checkout-steps"><span class="${active===1?"active":""}"><i>1</i>Cart</span><span class="${active===2?"active":""}"><i>2</i>Secure checkout</span><span><i>3</i>Confirmation</span></div>`;}
  function hero(active){return `<section class="ot-commerce-hero"><div class="ot-commerce-kicker">Omni Terrain / US Store</div><h1>${active===1?"Your cart.":"Secure checkout."}</h1><p>${active===1?"Review your selected parts, quantities and merchandise subtotal before continuing.":"Review your order, then continue to Stripe for protected payment and US delivery details."}</p>${steps(active)}</section>`;}

  function promoState(rows){
    const subtotalCents=rows.reduce((sum,row)=>sum+(row.priceCents*row.item.quantity),0);
    const code=String(localStorage.getItem(COUPON_KEY)||"").trim().toUpperCase();
    const hasFeatured=rows.some(row=>FEATURED_DEAL_IDS.has(String(row.item.id)));
    const eligible=code===PROMO_CODE&&subtotalCents>=PROMO_MIN_CENTS&&!hasFeatured;
    return {subtotalCents,code,hasFeatured,eligible,discountCents:eligible?PROMO_SAVE_CENTS:0,totalCents:subtotalCents-(eligible?PROMO_SAVE_CENTS:0)};
  }
  function promoRow(state){return state.eligible?`<div class="ot-summary-row"><span>${PROMO_CODE} discount</span><strong>−${money(state.discountCents)}</strong></div>`:"";}
  function promoNote(state){
    if(state.code!==PROMO_CODE)return"";
    if(state.hasFeatured)return" OMNI5 does not stack with featured deal pricing.";
    if(state.subtotalCents<PROMO_MIN_CENTS)return` Add ${money(PROMO_MIN_CENTS-state.subtotalCents)} more in eligible merchandise to use OMNI5.`;
    return state.eligible?" OMNI5 is included in the estimated total below.":"";
  }

  function summary(rows,checkout=false){
    const state=promoState(rows),reviewCount=rows.filter(row=>!row.onlineReady).length,cta=reviewCount?"Review Checkout Availability →":"Continue to Secure Checkout →";
    return `<aside class="ot-commerce-card ot-summary"><h2>Order summary</h2><div class="ot-summary-row"><span>Items</span><strong>${rows.reduce((s,r)=>s+r.item.quantity,0)}</strong></div><div class="ot-summary-row"><span>Merchandise</span><strong>${money(state.subtotalCents)}</strong></div>${promoRow(state)}<div class="ot-summary-row"><span>Shipping</span><strong>Free standard shipping</strong></div><div class="ot-summary-row"><span>Tax</span><strong>Calculated if applicable</strong></div><div class="ot-summary-row total"><span>${state.eligible?"Estimated total":"Subtotal"}</span><strong>${money(state.totalCents)}</strong></div><div class="ot-summary-note">${reviewCount?`${reviewCount} item${reviewCount===1?"":"s"} need current availability confirmation before online payment.`:"Current authorization, pricing and delivery are confirmed before payment is accepted."}${promoNote(state)}</div>${checkout?"":`<a class="ot-primary-btn" href="checkout.html">${cta}</a><a class="ot-secondary-btn" href="us-catalogue.html">Continue shopping</a>`}<div class="ot-pay-trust"><div><b>Secure payment</b>Stripe hosted</div><div><b>US delivery</b>Address protected</div><div><b>Support</b>MPN-based help</div></div></aside>`;
  }

  function renderCart(rows){
    document.title="Cart | Omni Terrain";const main=document.querySelector("main");if(!main)return;
    if(!rows.length){main.innerHTML=`<div class="ot-commerce-wrap">${hero(1)}<section class="ot-commerce-card ot-empty-cart"><strong>Your cart is empty.</strong><p>Browse the US catalogue and add products to start an order.</p><a class="ot-primary-btn" href="us-catalogue.html">Shop all products →</a></section></div>`;return;}
    const items=rows.map(({item,product,priceCents,onlineReady})=>`<article class="ot-cart-item" data-cart-id="${esc(item.id)}"><div><div class="ot-cart-brand">${esc(product.brand||product.category||"Omni Terrain")}</div><h3>${esc(product.title||product.mpn||item.id)}</h3><div class="ot-cart-meta"><span>MPN ${esc(product.mpn||"—")}</span><span>${onlineReady?"Online checkout available":"Availability confirmation"}</span></div></div><div class="ot-cart-item-side"><div class="ot-line-price">${priceCents?money(priceCents*item.quantity):"Price confirmation required"}</div>${priceCents?`<div class="ot-unit-price">${money(priceCents)} each</div>`:""}<div class="ot-qty-row"><div class="ot-qty"><button type="button" data-qty="down" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button type="button" data-qty="up" aria-label="Increase quantity">+</button></div><button class="ot-remove" type="button" data-remove>Remove</button></div></div></article>`).join("");
    main.innerHTML=`<div class="ot-commerce-wrap">${hero(1)}<div class="ot-commerce-grid"><section class="ot-commerce-card"><div class="ot-commerce-card-head"><div><h2>Cart items</h2><p>Manufacturer part numbers remain visible for verification.</p></div><div class="ot-commerce-count">${rows.length} PRODUCT${rows.length===1?"":"S"}</div></div><div class="ot-cart-list">${items}</div></section>${summary(rows,false)}</div></div>`;
    main.querySelectorAll("[data-cart-id]").forEach(card=>{const id=card.getAttribute("data-cart-id");card.querySelector('[data-qty="down"]')?.addEventListener("click",()=>changeQty(id,-1));card.querySelector('[data-qty="up"]')?.addEventListener("click",()=>changeQty(id,1));card.querySelector("[data-remove]")?.addEventListener("click",()=>removeItem(id));});
  }

  let currentProducts=new Map(),currentPrices={},currentLiveSet=new Set();
  function rerender(){const cart=readCart(),rows=normalizedRows(cart,currentProducts,currentPrices,currentLiveSet);if(rows.length!==cart.length)writeCart(rows.map(r=>r.item));if(isCheckout)renderCheckout(rows);else renderCart(rows);}
  function changeQty(id,delta){const cart=readCart(),row=cart.find(x=>x.id===id);if(!row)return;row.quantity=Math.min(10,Math.max(1,row.quantity+delta));writeCart(cart);rerender();}
  function removeItem(id){const cart=readCart().filter(x=>x.id!==id);writeCart(cart);rerender();}
  function checkoutLines(rows){return rows.map(({item,product,priceCents,onlineReady})=>`<div class="ot-checkout-line"><div><b>${esc(product.title||product.mpn||item.id)}</b><span>${esc(product.brand||"")} · MPN ${esc(product.mpn||"—")} · Qty ${item.quantity}${onlineReady?"":" · Availability confirmation required"}</span></div><strong>${priceCents?money(priceCents*item.quantity):"—"}</strong></div>`).join("");}

  function renderCheckout(rows){
    document.title="Secure Checkout | Omni Terrain";const main=document.querySelector("main");if(!main)return;
    if(!rows.length){main.innerHTML=`<div class="ot-commerce-wrap">${hero(2)}<section class="ot-commerce-card ot-empty-cart"><strong>No items to checkout.</strong><p>Add products to your cart before continuing to secure payment.</p><a class="ot-primary-btn" href="us-catalogue.html">Shop all products →</a></section></div>`;return;}
    const reviewRows=rows.filter(row=>!row.onlineReady||!row.priceCents);
    const paymentPanel=reviewRows.length?`<section class="ot-commerce-card ot-checkout-panel"><h2>Availability confirmation</h2><p>One or more selected items need a quick current-availability check before online payment can open.</p><div class="ot-payment-box"><h3>Your cart is saved.</h3><p>No payment has been attempted. Product support can confirm the affected item${reviewRows.length===1?"":"s"} by manufacturer part number.</p><a class="ot-primary-btn" href="contact-and-order-help.html#request-help">Confirm availability →</a></div><a class="ot-secondary-btn" href="cart.html">← Back to cart</a><div class="ot-pay-trust"><div><b>No charge</b>Payment not started</div><div><b>Cart saved</b>Items remain here</div><div><b>Support</b>MPN-based help</div></div></section>`:`<section class="ot-commerce-card ot-checkout-panel"><h2>Secure payment</h2><p>Stripe collects payment, billing, phone and US delivery details on its protected checkout page.</p><div class="ot-payment-box"><h3>Ready to continue?</h3><p>We confirm current authorization and pricing before opening secure payment.</p><button class="ot-primary-btn" id="otSecurePay" type="button">Continue to Stripe →</button><div class="ot-payment-status" id="otPaymentStatus" role="status"></div></div><a class="ot-secondary-btn" href="cart.html">← Back to cart</a><div class="ot-pay-trust"><div><b>Card details</b>Never stored here</div><div><b>Delivery</b>US addresses</div><div><b>Payment</b>Server-verified pricing</div></div></section>`;
    main.innerHTML=`<div class="ot-commerce-wrap">${hero(2)}<div class="ot-commerce-grid">${paymentPanel}<aside class="ot-commerce-card ot-summary"><h2>Your order</h2><div class="ot-checkout-items">${checkoutLines(rows)}</div>${summaryInner(rows)}</aside></div></div>`;
    if(!reviewRows.length)document.getElementById("otSecurePay")?.addEventListener("click",()=>startPayment(rows));if(new URLSearchParams(location.search).get("checkout")==="cancelled")showStatus("Payment was cancelled. Your cart is still saved.","info");
  }
  function summaryInner(rows){const state=promoState(rows),reviewCount=rows.filter(row=>!row.onlineReady||!row.priceCents).length;return `<div class="ot-summary-row"><span>Merchandise</span><strong>${money(state.subtotalCents)}</strong></div>${promoRow(state)}<div class="ot-summary-row"><span>Shipping</span><strong>Free standard shipping</strong></div><div class="ot-summary-row"><span>Tax</span><strong>Calculated if applicable</strong></div><div class="ot-summary-row total"><span>${state.eligible?"Estimated total":"Subtotal"}</span><strong>${money(state.totalCents)}</strong></div><div class="ot-summary-note">${reviewCount?"Online payment stays closed until current availability is confirmed for every selected item.":"Current authorization and pricing are confirmed before secure payment opens."}${promoNote(state)}</div>`;}
  function showStatus(message,type="error"){const status=document.getElementById("otPaymentStatus");if(!status)return;status.className=`ot-payment-status show ${type}`;status.innerHTML=message;}
  function friendlyCheckoutError(raw){const text=String(raw||"").toLowerCase();if(/unavailable|not currently available|eligib|selected product/.test(text))return"One or more items need a current availability confirmation before payment. Your cart is saved.";if(/promo|omni5|featured/.test(text))return String(raw||"The promo code could not be applied to this cart.");if(/stock|inventory/.test(text))return"One or more items changed availability while you were checking out. Your cart is saved for review.";if(/shipping|delivery/.test(text))return"Delivery options need confirmation before payment can continue. Your cart is saved.";return"We couldn't open secure payment right now. Your cart is saved. Please try again or contact product support.";}

  async function startPayment(rows){
    const button=document.getElementById("otSecurePay");if(!button)return;const original=button.innerHTML;button.disabled=true;button.innerHTML='<span class="ot-spinner"></span>Confirming order…';showStatus("Confirming current authorization and pricing before secure payment…","info");const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
    try{const couponCode=String(localStorage.getItem(COUPON_KEY)||"").trim().toUpperCase();const payload={items:rows.map(r=>({id:r.item.id,qty:r.item.quantity}))};if(couponCode)payload.couponCode=couponCode;const response=await fetch("/api/us-create-checkout-session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),signal:controller.signal});const data=await response.json().catch(()=>({}));if(!response.ok||!data.url)throw new Error(data.error||"Secure checkout could not be started.");location.assign(data.url);}catch(error){const message=error?.name==="AbortError"?"Secure payment is taking longer than expected. Your cart is saved — please try again.":friendlyCheckoutError(error?.message);showStatus(`${esc(message)}<br><br><a href="cart.html">Review cart</a> · <a href="contact-and-order-help.html">Product support</a>`,"error");button.disabled=false;button.innerHTML=original;}finally{clearTimeout(timer);}
  }

  document.addEventListener("click",event=>{if(event.target.closest?.(".ot-promo-button"))setTimeout(rerender,80);});
  document.addEventListener("keydown",event=>{if(event.key==="Enter"&&event.target.matches?.(".ot-promo-input"))setTimeout(rerender,80);});
  window.addEventListener("storage",event=>{if(event.key===COUPON_KEY)rerender();});

  async function mount(){document.body.classList.add("ot-commerce-page");document.querySelector(".availability-strip")?.remove();currentProducts=productMap();[currentPrices,currentLiveSet]=await Promise.all([loadPriceMap(),loadLiveSet()]);rerender();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})();