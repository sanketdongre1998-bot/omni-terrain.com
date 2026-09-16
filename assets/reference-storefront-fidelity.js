(() => {
  'use strict';
  if (window.__OMNI_REFERENCE_FIDELITY__) return;
  window.__OMNI_REFERENCE_FIDELITY__ = true;

  const ensureNavFix = () => {
    let style = document.getElementById('otHomeNavSingleLabelCss');
    if (!style) {
      style = document.createElement('style');
      style.id = 'otHomeNavSingleLabelCss';
      document.head.appendChild(style);
    }
    style.textContent = `
      @media(min-width:861px){
        html.ot-reference-home .ot-ref-nav .ot-ref-width>.ot-ref-nav-item>button,
        html.ot-reference-home .ot-ref-nav .ot-ref-width>a{
          font-size:12px!important;
          line-height:1!important;
          white-space:nowrap!important;
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
          margin-right:4px!important;
          color:#f6b624!important;
          font-size:9px!important;
        }
        html.ot-reference-home .ot-ref-nav .ot-ref-width>a.featured::after{content:none!important;display:none!important}
      }
      html.ot-reference-home .ot-ref-logo img,
      html.ot-reference-home .ot-ref-footer-logo img{
        display:block!important;
        object-fit:contain!important;
        object-position:left center!important;
        opacity:1!important;
        filter:none!important;
        transform:none!important;
      }
    `;
  };

  const canonicalLabels = ['Used OEM', 'Solar & 12V', 'Overlanding', 'Featured Deals', 'Support'];

  const dedupe = value => {
    let text = String(value || '').replace(/⌄/g, '').replace(/\s+/g, ' ').trim();
    if (!text) return text;
    canonicalLabels.forEach(label => {
      const doubled = `${label} ${label}`;
      while (text === doubled || text.includes(`${doubled} `) || text.includes(` ${doubled}`)) {
        text = text.replace(doubled, label).replace(/\s+/g, ' ').trim();
      }
    });
    const half = text.length / 2;
    if (Number.isInteger(half) && text.slice(0, half).trim() === text.slice(half).trim()) text = text.slice(0, half).trim();
    return text;
  };

  const normalizeNavText = () => {
    document.querySelectorAll('.ot-ref-nav .ot-ref-nav-item>button,.ot-ref-nav>.ot-ref-width>a').forEach(node => {
      const clean = dedupe(node.textContent);
      if (clean && node.childElementCount === 0 && node.textContent !== clean) node.textContent = clean;
    });
  };

  const normalizeLogos = () => {
    document.querySelectorAll('.ot-ref-logo img,.ot-ref-footer-logo img').forEach(img => {
      img.src = '/assets/omni-terrain-subtle-logo.svg?v=4';
      img.alt = 'Omni Terrain';
      img.removeAttribute('width');
      img.removeAttribute('height');
      img.style.objectFit = 'contain';
      img.style.objectPosition = 'left center';
    });
  };

  const apply = () => {
    if (!document.documentElement.classList.contains('ot-reference-home')) return false;
    document.querySelectorAll('.ot-ref-hero-tag').forEach(n => n.remove());
    ensureNavFix();
    normalizeNavText();
    normalizeLogos();
    return Boolean(document.querySelector('.ot-ref-header'));
  };

  const boot = () => {
    apply();
    [80,180,350,700,1200,2200,4000].forEach(ms => setTimeout(apply, ms));
    if (!('MutationObserver' in window)) return;
    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        apply();
      });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true, characterData: true });
    setTimeout(() => observer.disconnect(), 10000);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();