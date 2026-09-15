(() => {
  'use strict';
  if (window.__OMNI_UI_STABILITY__) return;
  window.__OMNI_UI_STABILITY__ = true;

  const CSS_ID = 'otUiStabilityCss';
  const css = document.getElementById(CSS_ID) || document.createElement('link');
  if (!css.id) {
    css.id = CSS_ID;
    css.rel = 'stylesheet';
    css.href = '/assets/ui-stability.css?v=1';
    document.head.appendChild(css);
  }

  const MAKES = [
    'Acura','Alfa Romeo','Audi','BMW','Buick','Cadillac','Chevrolet','Chrysler','Dodge','Fiat','Ford','Genesis','GMC','Honda','Hummer','Hyundai','Infiniti','Isuzu','Jaguar','Jeep','Kia','Land Rover','Lexus','Lincoln','Mazda','Mercedes-Benz','Mercury','MINI','Mitsubishi','Nissan','Oldsmobile','Pontiac','Porsche','Ram','Saab','Saturn','Scion','Subaru','Tesla','Toyota','Volkswagen','Volvo'
  ];
  const modelCache = new Map();

  const option = (select, value, label = value) => {
    const node = document.createElement('option');
    node.value = value;
    node.textContent = label;
    select.appendChild(node);
    return node;
  };

  const resetSelect = (select, placeholder, disabled = false) => {
    if (!select) return;
    select.replaceChildren();
    option(select, '', placeholder);
    select.disabled = disabled;
  };

  const fillYears = select => {
    resetSelect(select, 'Select Year');
    const maxYear = new Date().getFullYear() + 1;
    for (let year = maxYear; year >= 1996; year -= 1) option(select, String(year));
  };

  const fillMakes = select => {
    resetSelect(select, 'Select Make', true);
    MAKES.forEach(make => option(select, make));
  };

  const setStatus = (node, text = '', error = false) => {
    if (!node) return;
    node.textContent = text;
    node.classList.toggle('is-error', Boolean(error));
  };

  async function fetchModels(year, make) {
    const key = `${year}|${make}`;
    if (modelCache.has(key)) return modelCache.get(key);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);
    try {
      const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${encodeURIComponent(year)}?format=json`;
      const response = await fetch(url, { signal: controller.signal, mode: 'cors' });
      if (!response.ok) throw new Error(`Vehicle data ${response.status}`);
      const data = await response.json();
      const models = [...new Set((Array.isArray(data?.Results) ? data.Results : [])
        .map(row => String(row?.Model_Name || '').trim())
        .filter(Boolean))].sort((a, b) => a.localeCompare(b));
      modelCache.set(key, models);
      return models;
    } finally {
      clearTimeout(timeout);
    }
  }

  function bindVehicleCascade({ year, make, model, status, initial = {} }) {
    if (!year || !make || !model) return;
    fillYears(year);
    fillMakes(make);
    resetSelect(model, 'Select Model', true);

    const loadModels = async preferred => {
      const y = year.value;
      const mk = make.value;
      resetSelect(model, y && mk ? 'Loading models…' : 'Select Model', true);
      if (!y || !mk) return;
      setStatus(status, 'Loading vehicle models…');
      try {
        const models = await fetchModels(y, mk);
        resetSelect(model, models.length ? 'Select Model' : 'Model not listed', false);
        models.forEach(name => option(model, name));
        option(model, 'Other / Not listed', 'Other / Not listed');
        if (preferred && [...model.options].some(o => o.value === preferred)) model.value = preferred;
        setStatus(status, models.length ? '' : 'No exact model returned. Choose “Other / Not listed” and use the OEM/MPN if available.', !models.length);
      } catch (_) {
        resetSelect(model, 'Model lookup unavailable', false);
        option(model, 'Other / Not listed', 'Other / Not listed');
        setStatus(status, 'Model lookup is temporarily unavailable. You can still continue with Year + Make + OEM/MPN.', true);
      }
    };

    year.addEventListener('change', () => {
      make.disabled = !year.value;
      if (!year.value) {
        make.value = '';
        resetSelect(model, 'Select Model', true);
        setStatus(status, '');
        return;
      }
      if (make.value) loadModels();
      else resetSelect(model, 'Select Model', true);
    });
    make.addEventListener('change', () => loadModels());

    if (initial.year && [...year.options].some(o => o.value === String(initial.year))) {
      year.value = String(initial.year);
      make.disabled = false;
    }
    if (initial.make && [...make.options].some(o => o.value.toLowerCase() === String(initial.make).toLowerCase())) {
      const match = [...make.options].find(o => o.value.toLowerCase() === String(initial.make).toLowerCase());
      make.value = match?.value || '';
    }
    if (year.value && make.value) loadModels(String(initial.model || ''));
  }

  function closeMenus(except = null) {
    document.querySelectorAll('.ot-ref-nav-item.is-open').forEach(item => {
      if (item === except) return;
      item.classList.remove('is-open');
      item.classList.add('is-closed');
      item.querySelector(':scope>button')?.setAttribute('aria-expanded', 'false');
    });
  }

  function positionOpenMenu(item) {
    if (!item || !window.matchMedia('(max-width:760px)').matches) return;
    const nav = item.closest('.ot-ref-nav');
    const bottom = Math.max(0, nav?.getBoundingClientRect().bottom || 145);
    item.style.setProperty('--ot-ref-menu-top', `${Math.ceil(bottom + 4)}px`);
  }

  function stabilizeReferenceNav(root = document) {
    const header = root.querySelector?.('.ot-ref-header') || document.querySelector('.ot-ref-header');
    if (!header || header.dataset.otStableNav === '1') return Boolean(header);
    header.dataset.otStableNav = '1';

    header.querySelectorAll('.ot-ref-nav-item').forEach(item => {
      const button = item.querySelector(':scope>button');
      const menu = item.querySelector(':scope>.ot-ref-menu');
      if (!button || !menu) return;
      button.setAttribute('aria-haspopup', 'true');
      button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        const opening = !item.classList.contains('is-open');
        closeMenus(item);
        item.classList.toggle('is-open', opening);
        item.classList.toggle('is-closed', !opening);
        button.setAttribute('aria-expanded', opening ? 'true' : 'false');
        if (opening) positionOpenMenu(item);
      });
      item.addEventListener('mouseenter', () => {
        if (!window.matchMedia('(hover:none)').matches) item.classList.remove('is-closed');
      });
      item.addEventListener('mouseleave', () => {
        if (!item.classList.contains('is-open')) item.classList.remove('is-closed');
      });
    });

    header.querySelectorAll('.ot-ref-nav>.ot-ref-width>a').forEach(link => {
      if (!link.closest('.ot-ref-nav-item')) link.textContent = String(link.textContent || '').replace(/⌄/g, '').trim();
    });

    document.addEventListener('click', event => {
      if (!event.target.closest('.ot-ref-nav-item')) closeMenus();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeMenus();
        header.querySelector('.ot-ref-nav-item>button:focus')?.blur();
      }
    });
    const reposition = () => document.querySelectorAll('.ot-ref-nav-item.is-open').forEach(positionOpenMenu);
    window.addEventListener('resize', reposition, { passive: true });
    window.addEventListener('scroll', reposition, { passive: true });
    return true;
  }

  function stabilizeHomeFinder() {
    const form = document.getElementById('otRefFinder');
    if (!form || form.dataset.otStableFinder === '1') return Boolean(form);
    form.dataset.otStableFinder = '1';
    const selects = form.querySelectorAll('select');
    const year = selects[0];
    const make = selects[1];
    const model = selects[2];
    if (!year || !make || !model) return false;

    let status = form.querySelector('.ot-fitment-note');
    if (!status) {
      status = document.createElement('p');
      status.className = 'ot-fitment-note';
      status.setAttribute('aria-live', 'polite');
      form.appendChild(status);
    }
    bindVehicleCascade({ year, make, model, status });

    const keyword = form.querySelector('input[type="search"]');
    if (keyword) keyword.placeholder = 'OEM / MPN / part keyword';

    const tabs = form.closest('.ot-ref-finder-card')?.querySelectorAll('.ot-ref-findtabs span');
    if (tabs?.length) {
      const destinations = [null, '/used-auto-parts.html#used-search', '/marine.html', '/us-catalogue.html#catalogue-search'];
      tabs.forEach((tab, index) => {
        if (!destinations[index]) return;
        tab.setAttribute('role', 'link');
        tab.tabIndex = 0;
        tab.style.cursor = 'pointer';
        const go = () => { location.href = destinations[index]; };
        tab.addEventListener('click', go);
        tab.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); go(); }
        });
      });
    }
    return true;
  }

  function stabilizeUsedFinder() {
    const form = document.getElementById('usedRequestForm');
    const vehicle = document.getElementById('usedVehicle');
    if (!form || !vehicle || form.dataset.otStableFinder === '1') return Boolean(form);
    form.dataset.otStableFinder = '1';

    const params = new URLSearchParams(location.search);
    const grid = document.createElement('div');
    grid.className = 'used-fitment-grid';
    grid.setAttribute('aria-label', 'Vehicle fitment');
    const year = document.createElement('select');
    const make = document.createElement('select');
    const model = document.createElement('select');
    year.id = 'usedYear'; make.id = 'usedMake'; model.id = 'usedModel';
    year.name = 'year'; make.name = 'make'; model.name = 'model';
    year.setAttribute('aria-label', 'Vehicle year');
    make.setAttribute('aria-label', 'Vehicle make');
    model.setAttribute('aria-label', 'Vehicle model');
    grid.append(year, make, model);

    const label = document.createElement('span');
    label.className = 'used-fitment-label';
    label.textContent = 'Vehicle fitment';
    vehicle.insertAdjacentElement('beforebegin', label);
    vehicle.insertAdjacentElement('beforebegin', grid);
    vehicle.type = 'hidden';
    vehicle.removeAttribute('placeholder');

    const status = document.createElement('p');
    status.className = 'used-fitment-status';
    status.setAttribute('aria-live', 'polite');
    grid.insertAdjacentElement('afterend', status);

    const syncVehicle = () => {
      vehicle.value = [year.value, make.value, model.value].filter(Boolean).join(' ').trim();
    };
    [year, make, model].forEach(node => node.addEventListener('change', syncVehicle));

    const initialVehicle = String(params.get('vehicle') || '').trim().split(/\s+/);
    const initial = {
      year: params.get('year') || (/^\d{4}$/.test(initialVehicle[0] || '') ? initialVehicle.shift() : ''),
      make: params.get('make') || '',
      model: params.get('model') || ''
    };
    bindVehicleCascade({ year, make, model, status, initial });
    setTimeout(syncVehicle, 0);

    const part = document.getElementById('usedPartNumber');
    if (part) {
      part.required = false;
      part.placeholder = 'OEM / MPN / part name (recommended)';
      if (params.get('part')) part.value = params.get('part');
    }
    const category = document.getElementById('usedCategory');
    if (category && params.get('category') && [...category.options].some(o => o.value === params.get('category'))) category.value = params.get('category');

    form.addEventListener('submit', event => {
      syncVehicle();
      const hasInput = Boolean(part?.value.trim() || year.value || make.value || model.value || category?.value);
      if (!hasInput) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setStatus(status, 'Choose vehicle details, a part category, or enter an OEM/MPN to continue.', true);
        (part || year).focus();
      }
    }, true);

    return true;
  }

  function run() {
    stabilizeReferenceNav();
    stabilizeHomeFinder();
    stabilizeUsedFinder();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();

  if ('MutationObserver' in window) {
    const observer = new MutationObserver(() => run());
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 8000);
  }
  [150, 450, 1000, 2200].forEach(ms => setTimeout(run, ms));
})();
