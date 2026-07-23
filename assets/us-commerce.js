(function () {
  const CART_KEY = "omniTerrainUsCart";
  const REQUEST_KEY = "omniTerrainUsLastRequest";
  const US_PHONE_DISPLAY = "+1 307-533-0570";
  const US_PHONE_LINK = "+13075330570";
  const products = Array.isArray(window.OMNI_US_PRODUCTS) ? window.OMNI_US_PRODUCTS : [];

  function readCart() {
    try { const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); return Array.isArray(parsed) ? parsed : []; }
    catch (_) { return []; }
  }
  function writeCart(items) { localStorage.setItem(CART_KEY, JSON.stringify(items)); updateCounts(); }
  function updateCounts() {
    const count = readCart().reduce((total,item)=>total + Math.max(1,Number(item.quantity)||1),0);
    document.querySelectorAll("[data-cart-count]").forEach((node)=>{ node.textContent=String(count); });
  }
  function getProduct(id) { return products.find((product)=>product.id===id); }
  function addRequestItem(id) {
    const product=getProduct(id); if(!product) return;
    const cart=readCart(); const existing=cart.find((item)=>item.id===id);
    if(existing) existing.quantity=1; else cart.push({id,quantity:1});
    writeCart(cart);
  }
  function removeRequestItem(id) { writeCart(readCart().filter((item)=>item.id!==id)); renderCart(); renderCheckoutItems(); }
  function escapeHtml(value) { return String(value||"").replace(/[&<>"']/g,(char)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char])); }

  function injectUsContactNumber() {
    document.querySelectorAll("footer .footer-links").forEach((links)=>{
      if(links.querySelector('[data-us-phone]')) return;
      const phone=document.createElement("a");
      phone.href="tel:"+US_PHONE_LINK;
      phone.dataset.usPhone="true";
      phone.textContent=US_PHONE_DISPLAY;
      if(links.querySelector('a[href^="mailto:"]') || links.parentElement && /Talk to us|Help/i.test(links.parentElement.textContent||"")) links.appendChild(phone);
    });
    const legalNotes=document.querySelectorAll(".legal-note");
    legalNotes.forEach((note)=>{
      if(!note.textContent.includes(US_PHONE_DISPLAY)) note.appendChild(document.createTextNode(" · "+US_PHONE_DISPLAY));
    });
  }

  function alignProductPageLanguage() {
    if(!document.body || !document.body.dataset || !document.body.dataset.productId) return;
    const availabilityText=document.querySelector(".availability-strip .container span:last-child");
    if(availabilityText) availabilityText.textContent="This product is currently unavailable for immediate purchase, but it can be added to the request cart for availability, price and shipping review.";
    const purchaseCopy=document.querySelector(".purchase-panel > p");
    if(purchaseCopy) purchaseCopy.textContent="Add this product to the request cart. OMNI Terrain will confirm supplier availability, final price, shipping, return terms and secure payment before accepting an order.";
    const shippingCopy=document.querySelector(".shipping-card p");
    if(shippingCopy) shippingCopy.textContent="Shipping method, dispatch estimate, damage handling, return address and product-specific conditions are confirmed before payment. No unavailable product is charged or treated as an accepted order.";
    const footerStatus=document.querySelector(".footer-bottom span:last-child");
    if(footerStatus) footerStatus.textContent="US Store · Request-cart checkout active · Availability confirmed before payment";
    document.querySelectorAll(".cart-link").forEach((link)=>{
      const count=link.querySelector("[data-cart-count]");
      if(count){ link.childNodes[0].nodeValue="Request Cart "; }
    });
  }

  function setupProductRequestButton() {
    const id=document.body && document.body.dataset ? document.body.dataset.productId : "";
    const product=getProduct(id); if(!product) return;
    const button=document.querySelector(".purchase-actions button"); if(!button) return;
    button.disabled=false; button.removeAttribute("aria-disabled"); button.textContent="Add to Request Cart";
    button.addEventListener("click",()=>{ addRequestItem(id); button.textContent="Added to Request Cart ✓"; setTimeout(()=>{button.textContent="Add to Request Cart";},1800); });
  }

  function renderCart() {
    const root=document.getElementById("cartRoot"); if(!root) return;
    const cart=readCart().filter((item)=>getProduct(item.id));
    if(cart.length!==readCart().length) writeCart(cart);
    const checkoutLink=document.getElementById("checkoutLink");
    if(!cart.length) {
      root.innerHTML='<div class="empty-state"><b>Your request cart is empty</b><p>Open any US product page and choose “Add to Request Cart”. Products remain subject to supplier availability and final commercial confirmation.</p><a class="button dark" href="us-catalogue.html">Browse US catalogue</a></div>';
      if(checkoutLink){checkoutLink.classList.add("disabled");checkoutLink.setAttribute("aria-disabled","true");checkoutLink.addEventListener("click",(event)=>event.preventDefault(),{once:true});}
      return;
    }
    if(checkoutLink){if(checkoutLink.classList&&typeof checkoutLink.classList.remove==="function") checkoutLink.classList.remove("disabled"); if(typeof checkoutLink.removeAttribute==="function") checkoutLink.removeAttribute("aria-disabled");}
    root.innerHTML='<div class="request-list">'+cart.map((item)=>{const p=getProduct(item.id);return '<article class="request-item"><div><small>'+escapeHtml(p.brand)+' · MPN '+escapeHtml(p.mpn)+'</small><h3>'+escapeHtml(p.title)+'</h3><p>'+escapeHtml(p.category)+'</p></div><div class="request-item-actions"><span>Availability review</span><button type="button" data-remove-request="'+escapeHtml(p.id)+'">Remove</button></div></article>';}).join('')+'</div>';
    root.querySelectorAll("[data-remove-request]").forEach((button)=>button.addEventListener("click",()=>removeRequestItem(button.dataset.removeRequest)));
  }

  function renderCheckoutItems() {
    const root=document.getElementById("checkoutItems"); if(!root) return;
    const cart=readCart().filter((item)=>getProduct(item.id));
    if(!cart.length){root.innerHTML='<div class="empty-state"><b>No products selected</b><p>Add products to the request cart before submitting checkout details.</p><a class="button outline" href="us-catalogue.html">Browse products</a></div>';return;}
    root.innerHTML='<div class="checkout-product-list">'+cart.map((item)=>{const p=getProduct(item.id);return '<div class="checkout-product"><b>'+escapeHtml(p.title)+'</b><span>'+escapeHtml(p.brand)+' · '+escapeHtml(p.mpn)+'</span></div>';}).join('')+'</div>';
  }

  function setupCheckout() {
    const form=document.getElementById("checkoutForm"); if(!form) return;
    const status=document.getElementById("checkoutStatus");
    form.addEventListener("submit",(event)=>{
      event.preventDefault(); if(!form.reportValidity()) return;
      const cart=readCart().filter((item)=>getProduct(item.id));
      if(!cart.length){if(status){status.classList.add("show");status.textContent="Add at least one product to the request cart before submitting checkout.";}return;}
      const data=Object.fromEntries(new FormData(form).entries());
      const reference='OT-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+Math.random().toString(36).slice(2,7).toUpperCase();
      const lines=cart.map((item,index)=>{const p=getProduct(item.id);return (index+1)+'. '+p.brand+' '+p.title+' | MPN '+p.mpn;});
      const request={reference,createdAt:new Date().toISOString(),customer:data,items:cart};
      localStorage.setItem(REQUEST_KEY,JSON.stringify(request));
      const subject='OMNI Terrain order request '+reference;
      const body=[
        'Order request reference: '+reference,'',
        'Customer: '+data.firstName+' '+data.lastName,
        'Email: '+data.email,
        'Phone: '+(data.phone||'Not supplied'),
        'Delivery: '+data.address+', '+data.city+', '+data.state+' '+data.zip+', United States','',
        'Products:',...lines,'',
        'Notes: '+(data.notes||'None'),'','OMNI Terrain support: '+US_PHONE_DISPLAY,
        'I understand availability, price, shipping, returns and secure payment will be confirmed before order acceptance.'
      ].join('\n');
      const emailUrl='mailto:procurement@omni-terrain.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
      if(status){status.classList.add("show");status.innerHTML='<b>Request '+escapeHtml(reference)+' is ready.</b><br>Your details were validated in the checkout. Use the button below to send the request to OMNI Terrain. No payment has been taken.<br><a class="button dark" style="margin-top:12px" href="'+emailUrl+'">Email order request</a>';}
    });
  }

  window.OMNI_US_CART={read:readCart,write:writeCart,clear:()=>writeCart([]),add:addRequestItem,remove:removeRequestItem};
  updateCounts(); injectUsContactNumber(); alignProductPageLanguage(); setupProductRequestButton(); renderCart(); renderCheckoutItems(); setupCheckout();
})();