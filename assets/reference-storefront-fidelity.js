(() => {
  'use strict';
  if (window.__OMNI_REFERENCE_FIDELITY__) return;
  window.__OMNI_REFERENCE_FIDELITY__ = true;

  const apply = () => {
    if (!document.documentElement.classList.contains('ot-reference-home')) return false;
    document.querySelectorAll('.ot-ref-hero-tag').forEach(n => n.remove());
    document.querySelectorAll('.ot-ref-logo img,.ot-ref-footer-logo img').forEach(img => {
      img.src = '/assets/omni-terrain-subtle-logo.svg?v=1';
      img.alt = 'Omni Terrain';
      img.removeAttribute('width');
      img.removeAttribute('height');
    });
    return true;
  };

  const boot = () => {
    if (apply()) return;
    if (!('MutationObserver' in window)) {
      setTimeout(apply, 250);
      return;
    }
    const observer = new MutationObserver(() => {
      if (apply()) observer.disconnect();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 2000);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
