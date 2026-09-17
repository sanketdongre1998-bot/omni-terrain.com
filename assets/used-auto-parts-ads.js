(() => {
  'use strict';
  if (window.__OMNI_USED_ADS_READY__) return;
  window.__OMNI_USED_ADS_READY__ = true;

  const $ = (id) => document.getElementById(id);
  const form = $('usedRequestForm');
  const topForm = $('usedTopSearch');
  const part = $('usedPartNumber');
  const year = $('usedYear');
  const make = $('usedMake');
  const model = $('usedModel');
  const category = $('usedCategory');
  const status = $('usedSearchStatus');
  const resultsSection = $('used-results');
  const resultsGrid = $('usedResultsGrid');
  const resultsSummary = $('usedResultsSummary');
  const requestLink = $('usedRequestFallback');
  const cart = $('usedCartCount');
  const provider = () => window.OMNI_USED_PARTS_PROVIDER || { ready: false, name: 'Inventory connection pending' };

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  const track = (eventName, data = {}) => {
    const attribution = readAttribution();
    const payload = { event: eventName, used_parts: true, ...attribution, ...data };
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
    window.dispatchEvent(new CustomEvent('omni:used-parts-event', { detail: payload }));
  };

  const captureAttribution = () => {
    const params = new URLSearchParams(location.search);
    const keys = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','gbraid','wbraid'];
    const found = {};
    keys.forEach((key) => { if (params.get(key)) found[key] = params.get(key); });
    if (Object.keys(found).length) {
      try { sessionStorage.setItem('omniUsedAttribution', JSON.stringify(found)); } catch (_) {}
    }
  };

  const readAttribution = () => {
    try { return JSON.parse(sessionStorage.getItem('omniUsedAttribution') || '{}') || {}; }
    catch (_) { return {}; }
  };

  const updateCart = () => {
    try {
      const rows = JSON.parse(localStorage.getItem('omniTerrainUsCart') || '[]');
      if (cart && Array.isArray(rows)) {
        cart.textContent = String(rows.reduce((n, row) => n + Math.max(1, Number(row?.quantity) || 1), 0));
      }
    } catch (_) {}
  };

  const years = () => {
    const current = new Date().getFullYear() + 1;
    const out = [];
    for (let y = current; y >= 1990; y--) out.push(String(y));
    return out;
  };

  const populateYears = () => {
    if (!year) return;
    years().forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      year.appendChild(option);
    });
  };

  const fallbackMakes = ['Acura','Audi','BMW','Buick','Cadillac','Chevrolet','Chrysler','Dodge','Ford','GMC','Honda','Hyundai','Infiniti','Jeep','Kia','Land Rover','Lexus','Lincoln','Mazda','Mercedes-Benz','Mercury','Mini','Mitsubishi','Nissan','Pontiac','Ram','Saturn','Scion','Subaru','Tesla','Toyota','Volkswagen','Volvo'];

  const setOptions = (select, values, placeholder) => {
    if (!select) return;
    const previous = select.value;
    select.innerHTML = `<option value="">${esc(placeholder)}</option>`;
    [...new Set(values.filter(Boolean))].sort((a,b) => a.localeCompare(b)).forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
    if ([...select.options].some((o) => o.value === previous)) select.value = previous;
  };

  const loadMakes = async () => {
    if (!make) return;
    setOptions(make, fallbackMakes, 'Select Make');
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4500);
      const response = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/GetAllMakes?format=json', { signal: controller.signal });
      clearTimeout(timer);
      if (!response.ok) return;
      const json = await response.json();
      const values = (json.Results || []).map((row) => String(row.Make_Name || '').trim()).filter(Boolean);
      if (values.length) setOptions(make, values, 'Select Make');
    } catch (_) {}
  };

  const loadModels = async () => {
    if (!model) return;
    const selectedMake = make?.value || '';
    const selectedYear = year?.value || '';
    if (!selectedMake) {
      setOptions(model, [], 'Select Model');
      model.disabled = true;
      return;
    }
    model.disabled = true;
    model.innerHTML = '<option value="">Loading models…</option>';
    try {
      const endpoint = selectedYear
        ? `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(selectedMake)}/modelyear/${encodeURIComponent(selectedYear)}?format=json`
        : `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(selectedMake)}?format=json`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timer);
      if (!response.ok) throw new Error('model lookup failed');
      const json = await response.json();
      const values = (json.Results || []).map((row) => String(row.Model_Name || '').trim()).filter(Boolean);
      setOptions(model, values, values.length ? 'Select Model' : 'Model not listed');
    } catch (_) {
      setOptions(model, [], 'Select Model');
    } finally {
      model.disabled = false;
    }
  };

  const criteria = () => ({
    part: String(part?.value || '').trim(),
    year: String(year?.value || '').trim(),
    make: String(make?.value || '').trim(),
    model: String(model?.value || '').trim(),
    category: String(category?.value || '').trim()
  });

  const validCriteria = (c) => Boolean(c.part || (c.year && c.make) || c.category);

  const requestUrl = (c) => {
    const params = new URLSearchParams();
    if (c.part) params.set('part', c.part);
    if (c.year) params.set('year', c.year);
    if (c.make) params.set('make', c.make);
    if (c.model) params.set('model', c.model);
    if (c.category) params.set('category', c.category);
    params.set('type', 'used-oem');
    const attribution = readAttribution();
    Object.entries(attribution).forEach(([key, value]) => { if (value) params.set(key, value); });
    return `/contact-and-order-help.html?${params.toString()}`;
  };

  const updateRequestLink = () => {
    if (!requestLink) return;
    requestLink.href = requestUrl(criteria());
  };

  const priceLabel = (item) => {
    const amount = Number(item?.price);
    if (!Number.isFinite(amount) || amount <= 0) return 'Check current price';
    try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency || 'USD' }).format(amount); }
    catch (_) { return `$${amount.toFixed(2)}`; }
  };

  const renderResults = (items, total) => {
    if (!resultsSection || !resultsGrid || !resultsSummary) return;
    resultsSection.hidden = false;
    if (!items.length) {
      resultsSummary.textContent = 'No live match was returned for this search.';
      resultsGrid.innerHTML = `<div class="used-empty-result"><strong>Need this exact part?</strong><span>Request a current availability check. We do not publish placeholder stock or placeholder pricing.</span><a class="used-result-cta" href="${esc(requestUrl(criteria()))}" data-used-request-link>Request this part →</a></div>`;
      return;
    }
    resultsSummary.textContent = `${Number(total || items.length)} current result${Number(total || items.length) === 1 ? '' : 's'}`;
    resultsGrid.innerHTML = items.map((item) => {
      const title = item.title || item.partName || item.category || 'Used OEM part';
      const pn = item.partNumber || item.mpn || item.oem || '';
      const vehicle = [item.year, item.make, item.model].filter(Boolean).join(' ');
      const image = item.image || '/assets/omni-terrain-emblem.webp';
      const condition = item.condition || 'Used OEM';
      const conditionNote = item.conditionNote || item.notes || 'Review source condition details before ordering.';
      const href = item.url || requestUrl({ ...criteria(), part: pn || criteria().part });
      return `<article class="used-result-card" data-result-id="${esc(item.id || pn || title)}">
        <div class="used-result-media"><img src="${esc(image)}" alt="${esc(title)}" loading="lazy"></div>
        <div class="used-result-body">
          <span class="used-result-condition">${esc(condition)}</span>
          <h3>${esc(title)}</h3>
          ${pn ? `<div class="used-result-mpn">OEM / MPN: <strong>${esc(pn)}</strong></div>` : ''}
          ${vehicle ? `<div class="used-result-vehicle">${esc(vehicle)}</div>` : ''}
          <p>${esc(conditionNote)}</p>
          <div class="used-result-bottom"><strong>${esc(priceLabel(item))}</strong><a class="used-result-cta" href="${esc(href)}" data-used-result-link>View / verify →</a></div>
        </div>
      </article>`;
    }).join('');
  };

  const setStatus = (message, type = '') => {
    if (!status) return;
    status.textContent = message;
    status.className = `used-search-status ${type}`.trim();
  };

  const runSearch = async (event) => {
    event?.preventDefault();
    const c = criteria();
    updateRequestLink();
    if (!validCriteria(c)) {
      setStatus('Enter an OEM/MPN, or select vehicle/category details to search.', 'error');
      part?.focus();
      return;
    }
    track('used_search', c);
    const p = provider();
    if (!p.ready || typeof p.search !== 'function') {
      setStatus('Live supplier inventory is not connected yet. Use “Request current availability” and we’ll check this exact part.', 'notice');
      if (resultsSection) resultsSection.hidden = false;
      renderResults([], 0);
      resultsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      track('used_inventory_not_connected', c);
      return;
    }
    setStatus(`Checking ${p.name || 'live inventory'}…`, 'loading');
    if (resultsSection) resultsSection.hidden = false;
    if (resultsSummary) resultsSummary.textContent = 'Checking current availability…';
    if (resultsGrid) resultsGrid.innerHTML = '<div class="used-loading">Checking current supplier inventory…</div>';
    resultsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    try {
      const response = await p.search(c);
      const items = Array.isArray(response) ? response : Array.isArray(response?.items) ? response.items : [];
      const total = Number(response?.total ?? items.length) || items.length;
      renderResults(items, total);
      setStatus(items.length ? 'Current matches loaded. Verify the exact OEM number and condition before ordering.' : 'No live match returned. Request this part and we’ll check current sourcing options.', items.length ? 'success' : 'notice');
      track(items.length ? 'used_search_results' : 'used_no_result', { ...c, result_count: items.length, total });
    } catch (error) {
      renderResults([], 0);
      setStatus('Inventory lookup is temporarily unavailable. Request this part and we’ll check it manually.', 'error');
      track('used_search_error', { ...c, error: String(error?.message || error || 'unknown') });
    }
  };

  const prefillFromUrl = () => {
    const params = new URLSearchParams(location.search);
    const partValue = params.get('part') || params.get('mpn') || params.get('oem') || params.get('q') || '';
    if (part && partValue) part.value = partValue;
    if (year && params.get('year')) year.value = params.get('year');
    if (category && params.get('category')) category.value = params.get('category');
    const desiredMake = params.get('make') || '';
    const desiredModel = params.get('model') || '';
    if (desiredMake) {
      const applyMake = () => {
        if ([...make.options].some((o) => o.value === desiredMake)) {
          make.value = desiredMake;
          loadModels().then(() => {
            if (desiredModel && [...model.options].some((o) => o.value === desiredModel)) model.value = desiredModel;
          });
        }
      };
      setTimeout(applyMake, 900);
    }
    if (partValue || params.get('category')) {
      setTimeout(() => $('used-search')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
    }
  };

  const bind = () => {
    captureAttribution();
    updateCart();
    populateYears();
    loadMakes().then(prefillFromUrl);
    year?.addEventListener('change', () => { if (make?.value) loadModels(); updateRequestLink(); });
    make?.addEventListener('change', () => { loadModels(); updateRequestLink(); });
    model?.addEventListener('change', updateRequestLink);
    category?.addEventListener('change', updateRequestLink);
    part?.addEventListener('input', updateRequestLink);
    form?.addEventListener('submit', runSearch);
    topForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const q = String($('usedTopQuery')?.value || '').trim();
      if (part) part.value = q;
      updateRequestLink();
      track('used_header_search', { part: q });
      $('used-search')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => part?.focus(), 250);
    });
    document.querySelectorAll('[data-used-category]').forEach((card) => card.addEventListener('click', () => {
      const selected = card.dataset.usedCategory || '';
      if (category) category.value = selected;
      updateRequestLink();
      track('used_category_select', { category: selected });
      setTimeout(() => part?.focus(), 150);
    }));
    document.addEventListener('click', (event) => {
      const request = event.target.closest('[data-used-request-link],#usedRequestFallback');
      if (request) track('used_request_click', criteria());
      const result = event.target.closest('[data-used-result-link]');
      if (result) track('used_result_click', { ...criteria(), href: result.getAttribute('href') || '' });
    });
    updateRequestLink();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();
