/* Omni Terrain US homepage commercial images. Keep the approved storefront structure intact. */
(() => {
  'use strict';

  const file = (location.pathname.split('/').pop() || '').toLowerCase();
  if (file && file !== 'index.html') return;

  const heroAsset = '/assets/ot-hero-auto-final.jpg?v=3';
  const categoryAssets = [
    ['/assets/ot-cat-new-auto-final.jpg?v=3', 'New automotive parts and service essentials'],
    ['/assets/ot-cat-used-oem-v3.jpg?v=3', 'Used OEM automotive components'],
    ['/assets/ot-cat-marine.webp?v=3', 'Marine equipment and accessories'],
    ['/assets/ot-cat-solar.webp?v=3', 'Solar and 12V power equipment'],
    ['/assets/ot-cat-overland.webp?v=3', 'Overlanding and outdoor vehicle gear'],
    ['/assets/ot-cat-deals.webp?v=3', 'Featured automotive and outdoor gear']
  ];

  function paint(img, src, alt, eager = false) {
    if (!img) return;
    img.src = src;
    img.alt = alt;
    img.loading = eager ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.style.setProperty('background-image', 'none', 'important');
    img.style.setProperty('background-position', 'center', 'important');
    img.style.setProperty('background-size', 'cover', 'important');
    img.style.setProperty('filter', 'none', 'important');
    img.style.setProperty('object-fit', 'cover', 'important');
    img.style.setProperty('object-position', 'center', 'important');
  }

  function apply() {
    const hero = document.querySelector('.ot-ref-hero-bg');
    const cards = document.querySelectorAll('.ot-ref-category img');

    if (hero) {
      paint(hero, heroAsset, 'Omni Terrain automotive parts and road-ready gear', true);
    }

    cards.forEach((img, index) => {
      const row = categoryAssets[index];
      if (!row) return;
      paint(img, row[0], row[1]);
    });

    return Boolean(hero && cards.length >= 6);
  }

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      apply();
    });
  };

  const start = () => {
    apply();
    [80, 200, 450, 900, 1500, 2500, 4000].forEach(ms => setTimeout(apply, ms));
    if ('MutationObserver' in window) {
      const observer = new MutationObserver(schedule);
      observer.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), 7000);
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  window.addEventListener('load', apply, { once: true });
})();
