/* Omni Terrain US homepage commercial banners. Keep the approved storefront structure intact. */
(() => {
  'use strict';

  const file = (location.pathname.split('/').pop() || '').toLowerCase();
  if (file && file !== 'index.html') return;

  const sprite = '/assets/ot-home-commercial-sprite.webp?v=2';
  const transparent = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
  const categoryRows = [
    ['23.0769%', 'New automotive parts and service essentials'],
    ['38.4615%', 'Used OEM automotive components'],
    ['53.8462%', 'Marine equipment and accessories'],
    ['69.2308%', 'Solar and 12V power equipment'],
    ['84.6154%', 'Overlanding and outdoor vehicle gear'],
    ['100%', 'Featured automotive and outdoor gear']
  ];

  function paint(img, size, position, alt, eager = false) {
    if (!img) return;
    img.src = transparent;
    img.alt = alt;
    img.loading = eager ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.style.setProperty('background-image', `url("${sprite}")`, 'important');
    img.style.setProperty('background-repeat', 'no-repeat', 'important');
    img.style.setProperty('background-size', size, 'important');
    img.style.setProperty('background-position', `0 ${position}`, 'important');
    img.style.setProperty('filter', 'none', 'important');
  }

  function apply() {
    const hero = document.querySelector('.ot-ref-hero-bg');
    const cards = document.querySelectorAll('.ot-ref-category img');

    if (hero) {
      paint(hero, '100% 500%', '0', 'Omni Terrain parts for every journey - auto, marine, power and outdoors', true);
    }

    cards.forEach((img, index) => {
      const row = categoryRows[index];
      if (!row) return;
      paint(img, '180% 750%', row[0], row[1]);
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
