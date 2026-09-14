(() => {
  'use strict';
  if (window.__OMNI_REFERENCE_FIDELITY__) return;
  window.__OMNI_REFERENCE_FIDELITY__ = true;

  const apply = () => {
    if (!document.documentElement.classList.contains('ot-reference-home')) return;
    document.querySelectorAll('.ot-ref-hero-tag').forEach(n => n.remove());
    document.querySelectorAll('.ot-ref-logo img,.ot-ref-footer-logo img').forEach(img => {
      img.src = '/assets/omni-terrain-subtle-logo.svg?v=1';
      img.alt = 'Omni Terrain';
      img.removeAttribute('width');
      img.removeAttribute('height');
    });
  };

  const boot = () => {
    apply();
    requestAnimationFrame(apply);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
