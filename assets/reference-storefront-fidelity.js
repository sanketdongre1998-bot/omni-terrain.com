(() => {
  'use strict';
  if (window.__OMNI_REFERENCE_FIDELITY__) return;
  window.__OMNI_REFERENCE_FIDELITY__ = true;

  const ensureNavFix = () => {
    let style = document.getElementById('otHomeNavSingleLabelCss');
    if (!style) {
      style = document.createElement('style');
      style.id = 'otHomeNavSingleLabelCss';
      style.textContent = `
        @media(min-width:861px){
          html.ot-reference-home .ot-ref-nav .ot-ref-width>.ot-ref-nav-item>button,
          html.ot-reference-home .ot-ref-nav .ot-ref-width>a{
            font-size:12px!important;
          }
          html.ot-reference-home .ot-ref-nav .ot-ref-width>.ot-ref-nav-item>button::before,
          html.ot-reference-home .ot-ref-nav .ot-ref-width>a::before,
          html.ot-reference-home .ot-ref-nav .ot-ref-width>a::after{
            content:none!important;
            display:none!important;
          }
          html.ot-reference-home .ot-ref-nav .ot-ref-width>.ot-ref-nav-item>button::after{
            content:""!important;
            display:block!important;
            width:7px!important;
            height:7px!important;
            flex:0 0 7px!important;
            border-right:1.7px solid currentColor!important;
            border-bottom:1.7px solid currentColor!important;
            transform:rotate(45deg) translateY(-2px)!important;
          }
          html.ot-reference-home .ot-ref-nav .ot-ref-width>a.featured::before{
            content:"◆"!important;
            display:inline-block!important;
            margin-right:2px!important;
            color:#f6b624!important;
            font-size:10px!important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  };

  const normalizeNavText = () => {
    document.querySelectorAll('.ot-ref-nav .ot-ref-nav-item>button,.ot-ref-nav>.ot-ref-width>a').forEach(node => {
      const clean = String(node.textContent || '').replace(/⌄/g, '').replace(/\s+/g, ' ').trim();
      if (clean && node.childElementCount === 0 && node.textContent !== clean) node.textContent = clean;
    });
  };

  const apply = () => {
    if (!document.documentElement.classList.contains('ot-reference-home')) return false;
    document.querySelectorAll('.ot-ref-hero-tag').forEach(n => n.remove());
    document.querySelectorAll('.ot-ref-logo img,.ot-ref-footer-logo img').forEach(img => {
      img.src = '/assets/omni-terrain-subtle-logo.svg?v=3';
      img.alt = 'Omni Terrain';
      img.removeAttribute('width');
      img.removeAttribute('height');
    });
    ensureNavFix();
    normalizeNavText();
    return Boolean(document.querySelector('.ot-ref-header'));
  };

  const boot = () => {
    if (apply()) return;
    if (!('MutationObserver' in window)) {
      [100, 300, 700, 1400].forEach(ms => setTimeout(apply, ms));
      return;
    }
    const observer = new MutationObserver(() => {
      if (apply()) observer.disconnect();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
    setTimeout(() => { apply(); observer.disconnect(); }, 2500);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
