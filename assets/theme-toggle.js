(() => {
  "use strict";
  if (window.__OMNI_THEME_TOGGLE__) return;
  window.__OMNI_THEME_TOGGLE__ = true;

  const file = decodeURIComponent(String(location.pathname || "/").split("/").filter(Boolean).pop() || "").toLowerCase();
  const isHome = !file || file === "index.html" || file === "uk.html";
  if (!isHome) document.documentElement.classList.add("ot-master-header-pending");

  const USER_THEME_KEY = "omniTerrainThemeUser";
  const LEGACY_KEYS = ["omniTerrainTheme", "omni-theme"];
  const root = document.documentElement;

  const styleAssets = [
    ["otSubtleStorefront", "/assets/omni-subtle-storefront.css?v=20260912-1"],
    ["otSubtleEnhancements", "/assets/omni-subtle-enhancements.css?v=20260912-1"],
    ["otUiConsistency", "/assets/ui-consistency.css?v=20260917-1"],
    ["otMasterDropdown", "/assets/master-dropdown.css?v=20260917-3"],
    ["otHeaderFirstPaintLock", "/assets/header-first-paint-lock.css?v=20260917-2"],
    ["otMobilePerformance", "/assets/mobile-performance.css?v=20260917-1"]
  ];
  if (!isHome) styleAssets.push(["otInternalShellFinal", "/assets/internal-shell-final.css?v=20260917-1"]);
  if (isHome) styleAssets.push(["otHomepageCategorybarSync", "/assets/homepage-categorybar-sync.css?v=20260917-1"]);
  styleAssets.push(["otFinalResponsiveGuard", "/assets/final-responsive-guard.css?v=20260918-3"]);
  styleAssets.push(["otMasterDropdownPremium", "/assets/master-dropdown-premium.css?v=20260922-2"]);
  styleAssets.push(["otTypography20260922", "/assets/typography-20260922.css?v=1"]);
  // Dark mode wins legacy force-light rules; PDP optimizer then applies product-specific final polish.
  styleAssets.push(["otDarkMode", "/assets/dark-mode.css?v=20260922-2"]);
  styleAssets.push(["otProductPageOptimizer", "/assets/product-page-optimizer.css?v=20260922-4"]);

  const ensureStyles = () => {
    styleAssets.forEach(([key, href]) => {
      const attr = `data-${key.replace(/[A-Z]/g, m => "-" + m.toLowerCase())}`;
      let link = document.querySelector(`link[${attr}]`);
      if (!link) {
        link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.dataset[key] = "true";
        document.head.appendChild(link);
      } else if (link.getAttribute("href") !== href) {
        link.href = href;
      }
    });
  };

  const ensureScript = (selector, src, dataKey) => {
    let script = document.querySelector(selector);
    if (script) {
      if (script.getAttribute("src") !== src) script.src = src;
      return script;
    }
    script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.dataset[dataKey] = "true";
    (document.body || document.documentElement).appendChild(script);
    return script;
  };

  const ensureScripts = () => {
    ensureScript('script[data-ot-subtle-storefront]', "/assets/omni-subtle-storefront.js?v=20260917-2", "otSubtleStorefront");
    ensureScript('script[data-ot-master-dropdown]', "/assets/master-dropdown.js?v=20260922-2", "otMasterDropdown");
    ensureScript('script[data-ot-product-page-optimizer]', "/assets/product-page-optimizer.js?v=20260922-5", "otProductPageOptimizer");
    ensureScript('script[data-ot-marine-reman-nav]', "/assets/marine-reman-nav.js?v=20260918-1", "otMarineRemanNav");
    if (file === "marine-reman.html") {
      ensureScript('script[data-ot-marine-reman-form-priority]', "/assets/marine-reman-form-priority.js?v=20260918-1", "otMarineRemanFormPriority");
    }
    if (!isHome) {
      ensureScript('script[data-ot-internal-shell-final]', "/assets/internal-shell-final.js?v=20260917-6", "otInternalShellFinal");
    }
    if (isHome) {
      ensureScript('script[data-ot-homepage-categorybar-sync]', "/assets/homepage-categorybar-sync.js?v=20260917-2", "otHomepageCategorybarSync");
      ensureScript('script[data-ot-home-mobile-menu]', "/assets/home-mobile-menu.js?v=20260918-2", "otHomeMobileMenu");
    }
  };

  const normalizeTheme = value => value === "dark" ? "dark" : value === "light" ? "light" : "";
  const readUserTheme = () => {
    try { return normalizeTheme(localStorage.getItem(USER_THEME_KEY)); }
    catch (_) { return ""; }
  };
  const systemTheme = () => {
    try { return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; }
    catch (_) { return "light"; }
  };

  let explicitPreference = !!readUserTheme();

  const updateToggle = theme => {
    const button = document.getElementById("otThemeToggle");
    if (!button) return;
    const dark = theme === "dark";
    button.setAttribute("aria-pressed", dark ? "true" : "false");
    button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    button.title = dark ? "Light mode" : "Dark mode";
  };

  const updateThemeColor = theme => {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", theme === "dark" ? "#08111f" : "#ffffff");
  };

  const applyTheme = (theme, persist = false) => {
    const next = normalizeTheme(theme) || "light";
    root.dataset.otTheme = next;
    root.dataset.theme = next;
    root.style.colorScheme = next;
    root.classList.toggle("ot-dark-mode", next === "dark");
    updateThemeColor(next);
    updateToggle(next);

    if (persist) {
      explicitPreference = true;
      try {
        localStorage.setItem(USER_THEME_KEY, next);
        LEGACY_KEYS.forEach(key => localStorage.setItem(key, next));
      } catch (_) {}
    }

    try {
      window.dispatchEvent(new CustomEvent("ot:themechange", { detail: { theme: next } }));
    } catch (_) {}
  };

  const initialTheme = readUserTheme() || systemTheme();

  const createToggle = () => {
    let button = document.getElementById("otThemeToggle");
    if (button) return button;

    document.querySelectorAll("[data-ot-theme-toggle],.ot-theme-toggle").forEach(node => {
      if (node.id !== "otThemeToggle") node.remove();
    });

    button = document.createElement("button");
    button.id = "otThemeToggle";
    button.type = "button";
    button.className = "ot-theme-toggle";
    button.dataset.otThemeToggle = "true";
    button.innerHTML = '<span class="ot-theme-icon-moon" aria-hidden="true">☾</span><span class="ot-theme-icon-sun" aria-hidden="true">☀</span>';
    button.addEventListener("click", () => {
      applyTheme(root.dataset.otTheme === "dark" ? "light" : "dark", true);
    });
    updateToggle(root.dataset.otTheme || initialTheme);
    return button;
  };

  const findToggleHost = () => {
    const selectors = [
      ".ot-ref-actions",
      ".used-actions",
      ".ot-unified-actions",
      ".ot-site-actions",
      ".header .actions",
      ".header-actions",
      ".nav-actions"
    ];
    for (const selector of selectors) {
      const host = document.querySelector(selector);
      if (host) return host;
    }
    return null;
  };

  let mountQueued = false;
  const mountToggle = () => {
    mountQueued = false;
    if (!document.body) return;
    const button = createToggle();
    const host = findToggleHost();

    if (host) {
      button.classList.remove("ot-theme-toggle--floating");
      if (button.parentElement !== host) host.appendChild(button);
    } else {
      button.classList.add("ot-theme-toggle--floating");
      if (button.parentElement !== document.body) document.body.appendChild(button);
    }
    updateToggle(root.dataset.otTheme || initialTheme);
  };

  const queueMount = () => {
    if (mountQueued) return;
    mountQueued = true;
    requestAnimationFrame(mountToggle);
  };

  ensureStyles();
  applyTheme(initialTheme, false);
  ensureScripts();

  const start = () => {
    mountToggle();

    const observer = new MutationObserver(queueMount);
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 6000);

    [120, 350, 800, 1600, 3000].forEach(ms => setTimeout(mountToggle, ms));

    try {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const onSystemChange = event => {
        if (!explicitPreference) applyTheme(event.matches ? "dark" : "light", false);
      };
      if (media.addEventListener) media.addEventListener("change", onSystemChange);
      else if (media.addListener) media.addListener(onSystemChange);
    } catch (_) {}

    requestAnimationFrame(() => root.classList.add("ot-theme-ready"));
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();