/* Practical commercial homepage imagery only. Layout, copy, pricing, offers and checkout behavior remain untouched. */
(() => {
  'use strict';

  const file = (location.pathname.split('/').pop() || '').toLowerCase();
  if (file && file !== 'index.html') return;

  const categoryImages = [
    ['/assets/ot-cat-new-auto-v3.jpg', 'New automotive parts and service essentials'],
    ['/assets/ot-cat-used-oem-v3.jpg', 'Used OEM automotive components'],
    ['/assets/ot-cat-marine.webp?v=1', 'Marine equipment and accessories'],
    ['/assets/ot-cat-solar.webp?v=1', 'Solar and 12V power equipment'],
    ['/assets/ot-cat-overland.webp?v=1', 'Overlanding and outdoor vehicle gear'],
    ['/assets/ot-cat-deals.webp?v=1', 'Featured automotive and outdoor gear']
  ];

  function apply() {
    if (!document.documentElement.classList.contains('ot-reference-home')) return false;

    const hero = document.querySelector('.ot-ref-hero-bg');
    if (hero) {
      hero.src = '/assets/ot-hero-auto-v3.jpg';
      hero.alt = 'Automotive parts, maintenance and roadside equipment';
      hero.loading = 'eager';
      hero.decoding = 'async';
    }

    document.querySelectorAll('.ot-ref-category img').forEach((img, index) => {
      const row = categoryImages[index];
      if (!row) return;
      img.src = row[0];
      img.alt = row[1];
      img.loading = 'lazy';
      img.decoding = 'async';
    });

    return !!hero;
  }

  const run = () => [0, 120, 400, 900].forEach(ms => setTimeout(apply, ms));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
  window.addEventListener('load', apply, { once: true });
})();