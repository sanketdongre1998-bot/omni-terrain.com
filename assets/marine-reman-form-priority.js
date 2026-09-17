(()=>{
  "use strict";
  const file=decodeURIComponent(String(location.pathname||"/").split("/").filter(Boolean).pop()||"").toLowerCase();
  if(file!=="marine-reman.html")return;

  const moveQuoteUp=()=>{
    const quote=document.getElementById("quote");
    const categories=document.querySelector(".mr-categories")?.closest("section");
    if(!quote||!categories)return false;
    if(categories.nextElementSibling===quote)return true;
    categories.insertAdjacentElement("afterend",quote);
    return true;
  };

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",moveQuoteUp,{once:true});
  else moveQuoteUp();
})();
