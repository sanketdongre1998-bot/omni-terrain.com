(() => {
  'use strict';
  const apply=()=>{
    if(!document.documentElement.classList.contains('ot-reference-home'))return;
    document.querySelectorAll('.ot-ref-hero-tag').forEach(n=>n.remove());
    document.querySelectorAll('.ot-ref-logo img,.ot-ref-footer-logo img').forEach(img=>{
      img.src='/assets/omni-terrain-subtle-logo.svg?v=1';
      img.alt='Omni Terrain';
      img.removeAttribute('width');
      img.removeAttribute('height');
    });
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
  let tries=0;
  const timer=setInterval(()=>{apply();if(++tries>24)clearInterval(timer);},120);
})();