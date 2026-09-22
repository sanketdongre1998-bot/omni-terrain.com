(() => {
  'use strict';
  if ((location.pathname.split('/').pop() || '').toLowerCase() !== 'uk.html') return;

  const HERO = '/assets/omni-main-hero-20260916.png';
  const AUTO_FALLBACK = '/assets/ot-cat-new-auto-final.jpg?v=4';
  const AUTO_SHARP_CHUNKS = [
    '/assets/.newauto-q30-1.txt?v=1',
    '/assets/.newauto-q30-2.txt?v=1',
    '/assets/.newauto-q30-3.txt?v=1'
  ];
  let sharpAutoSrc = '';
  let sharpAutoRequested = false;

  const CATEGORY_IMAGES = {
    'Marine': ['/assets/ot-cat-marine-hd-v2.webp?v=5', 'Marine equipment and accessories'],
    'Campervan': ['/assets/ot-cat-overland-hd-v2.webp?v=5', 'Campervan and overlanding gear'],
    '12V & Power': ['/assets/ot-cat-solar-hd-v2.webp?v=5', 'Solar and 12V power equipment'],
    'Featured': ['/assets/ot-cat-deals-hd-v2.webp?v=5', 'Featured automotive and outdoor gear']
  };

  const chunkedBlobUrl = async paths => {
    const base64 = (await Promise.all(paths.map(async path => {
      const response = await fetch(path, { cache: 'force-cache' });
      if (!response.ok) throw new Error(`Failed to load ${path}`);
      return (await response.text()).trim();
    }))).join('');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: 'image/webp' }));
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

      const img = card.querySelector('img');
      if (!img) return;

      if (title === 'Auto Parts') {
        img.src = sharpAutoSrc || AUTO_FALLBACK;
        img.alt = 'Automotive parts and service essentials';
      } else {
        const item = CATEGORY_IMAGES[title];
        if (!item) return;
        img.src = item[0];
        img.alt = item[1];
      }

      img.loading = 'lazy';
      img.decoding = 'async';
      img.style.backgroundImage = 'none';
      img.style.filter = 'none';
      img.style.objectFit = 'cover';
      img.style.objectPosition = 'center';
    });

    return !!hero;
  };

  const prepareSharpAuto = async () => {
    if (sharpAutoRequested) return;
    sharpAutoRequested = true;
    try {
      sharpAutoSrc = await chunkedBlobUrl(AUTO_SHARP_CHUNKS);
      apply();
    } catch (error) {
      console.warn('UK Auto Parts image enhancement failed', error);
    }
  };

  const run = () => {
    apply();
    prepareSharpAuto();
    setTimeout(apply, 150);
    setTimeout(apply, 600);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
  window.addEventListener('load', apply, { once: true });
})();
