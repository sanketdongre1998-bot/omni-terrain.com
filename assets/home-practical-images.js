/* Commercial Omni Terrain homepage banners. Layout, copy, pricing, offers and checkout behavior remain untouched. */
(() => {
  'use strict';

  const file = (location.pathname.split('/').pop() || '').toLowerCase();
  if (file && file !== 'index.html') return;

  const regions = {
    hero: [0, 0, 900, 300],
    newAuto: [0, 300, 500, 200],
    usedOem: [0, 500, 500, 200],
    marine: [0, 700, 500, 200],
    solar: [0, 900, 500, 200],
    overland: [0, 1100, 500, 200],
    deals: [0, 1300, 500, 200]
  };

  let rendered = null;

  function crop(sprite, region) {
    const [sx, sy, sw, sh] = region;
    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.drawImage(sprite, sx, sy, sw, sh, 0, 0, sw, sh);
    return canvas.toDataURL('image/webp', 0.9);
  }

  function apply() {
    if (!rendered || !document.documentElement.classList.contains('ot-reference-home')) return false;

    const hero = document.querySelector('.ot-ref-hero-bg');
    if (hero) {
      hero.src = rendered.hero;
      hero.alt = 'Omni Terrain parts for every journey - auto, marine, power and outdoors';
      hero.loading = 'eager';
      hero.decoding = 'async';
    }

    const categoryImages = [
      [rendered.newAuto, 'New automotive parts and service essentials'],
      [rendered.usedOem, 'Used OEM automotive components'],
      [rendered.marine, 'Marine equipment and accessories'],
      [rendered.solar, 'Solar and 12V power equipment'],
      [rendered.overland, 'Overlanding and outdoor vehicle gear'],
      [rendered.deals, 'Featured automotive and outdoor gear']
    ];

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

  const sprite = new Image();
  sprite.decoding = 'async';
  sprite.onload = () => {
    rendered = Object.fromEntries(Object.entries(regions).map(([key, region]) => [key, crop(sprite, region)]));
    [0, 120, 400, 900].forEach(ms => setTimeout(apply, ms));
  };
  sprite.src = '/assets/ot-home-commercial-sprite.webp?v=1';

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
  else apply();
  window.addEventListener('load', apply, { once: true });
})();