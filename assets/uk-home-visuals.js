(() => {
  'use strict';
  if ((location.pathname.split('/').pop() || '').toLowerCase() !== 'uk.html') return;

  const HERO = '/assets/omni-main-hero-20260916.png';
  const CATEGORY_IMAGES = {
    'Auto Parts': ['/assets/ot-cat-new-auto-final.jpg?v=4', 'Automotive parts and service essentials'],
    'Marine': ['/assets/ot-cat-marine.webp?v=4', 'Marine equipment and accessories'],
    'Campervan': ['/assets/ot-cat-overland.webp?v=4', 'Campervan and overlanding gear'],
    '12V & Power': ['/assets/ot-cat-solar.webp?v=4', 'Solar and 12V power equipment'],
    'Featured': ['/assets/ot-cat-deals.webp?v=4', 'Featured automotive and outdoor gear']
  };

  const apply = () => {
    if (!document.documentElement.classList.contains('ot-reference-home')) return false;

    const hero = document.querySelector('.ot-ref-hero-bg');
    if (hero) {
      if (hero.getAttribute('src') !== HERO) hero.src = HERO;
      hero.width = 2048;
      hero.height = 682;
      hero.alt = 'Omni Terrain parts for every journey — auto, marine, power and outdoors';
      hero.loading = 'eager';
      hero.fetchPriority = 'high';
      hero.decoding = 'async';
      hero.style.backgroundImage = 'none';
      hero.style.filter = 'none';
      hero.style.objectFit = 'contain';
      hero.style.objectPosition = 'center';

      const heroWrap = hero.closest('.ot-ref-hero');
      if (heroWrap && !heroWrap.querySelector('.ot-hero-shop-hotspot')) {
        const hotspot = document.createElement('a');
        hotspot.className = 'ot-hero-shop-hotspot';
        hotspot.href = '/shield-autocare-uk.html';
        hotspot.setAttribute('aria-label', 'Shop all UK products');
        hotspot.title = 'Shop all UK products';
        heroWrap.appendChild(hotspot);
      }
    }

    document.querySelectorAll('.ot-ref-category').forEach(card => {
      const title = (card.querySelector('.ot-ref-category-body strong')?.textContent || '')
        .replace(/→/g, '')
        .trim();

      if (title === 'Current Range') {
        card.remove();
        return;
      }

      const item = CATEGORY_IMAGES[title];
      const img = card.querySelector('img');
      if (!item || !img) return;
      img.src = item[0];
      img.alt = item[1];
      img.loading = 'lazy';
      img.decoding = 'async';
      img.style.backgroundImage = 'none';
      img.style.filter = 'none';
      img.style.objectFit = 'cover';
      img.style.objectPosition = 'center';
    });

    return !!hero;
  };

  const run = () => [0, 100, 250, 600, 1200, 2500].forEach(ms => setTimeout(apply, ms));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
  window.addEventListener('load', apply, { once: true });
})();
