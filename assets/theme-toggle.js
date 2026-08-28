(() => {
  "use strict";

  if (window.__OMNI_THEME_TOGGLE__) return;
  window.__OMNI_THEME_TOGGLE__ = true;

  const STORAGE_KEY = "omniTerrainTheme";
  const DARK = "dark";
  const LIGHT = "light";

  const readTheme = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === DARK || saved === LIGHT) return saved;
    } catch (_) {}
    return LIGHT;
  };

  const setTheme = (theme, persist = true) => {
    const next = theme === DARK ? DARK : LIGHT;
    document.documentElement.dataset.otTheme = next;
    document.documentElement.style.colorScheme = next;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", next === DARK ? "#07111d" : "#071a30");
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, next); } catch (_) {}
    }
    document.querySelectorAll("[data-ot-theme-toggle]").forEach((button) => {
      const dark = next === DARK;
      button.setAttribute("aria-pressed", String(dark));
      button.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
      button.title = dark ? "Light theme" : "Dark theme";
      const text = button.querySelector("[data-ot-theme-label]");
      if (text) text.textContent = dark ? "Light" : "Dark";
    });
  };

  const injectStyles = () => {
    if (document.getElementById("otThemeStyles")) return;
    const style = document.createElement("style");
    style.id = "otThemeStyles";
    style.textContent = `
      :root{
        --ot-dark-bg:#07111d;
        --ot-dark-surface:#0c1b2a;
        --ot-dark-surface-2:#112437;
        --ot-dark-surface-3:#172c40;
        --ot-dark-line:#24384a;
        --ot-dark-text:#eef4f8;
        --ot-dark-muted:#a9b8c5;
        --ot-dark-gold:#d8b469;
      }
      .ot-theme-toggle{
        position:fixed;right:18px;bottom:18px;z-index:9999;
        display:inline-flex;align-items:center;gap:8px;height:40px;padding:4px 10px 4px 5px;
        border:1px solid rgba(7,26,48,.14);border-radius:999px;
        background:rgba(255,255,255,.94);color:#071a30;
        box-shadow:0 12px 34px rgba(7,26,48,.18);backdrop-filter:blur(16px);
        cursor:pointer;font:800 11px/1 Inter,Manrope,system-ui,sans-serif;letter-spacing:.02em;
        transition:transform .2s ease,background .2s ease,color .2s ease,border-color .2s ease,box-shadow .2s ease;
      }
      .ot-theme-toggle:hover{transform:translateY(-2px);box-shadow:0 16px 40px rgba(7,26,48,.24)}
      .ot-theme-toggle:focus-visible{outline:3px solid rgba(198,154,80,.34);outline-offset:3px}
      .ot-theme-toggle-track{
        position:relative;width:54px;height:30px;flex:0 0 54px;border-radius:999px;
        background:#eef1f3;border:1px solid #d9e0e5;box-shadow:inset 0 1px 2px rgba(7,26,48,.06);
        transition:background .25s ease,border-color .25s ease;
      }
      .ot-theme-toggle-track:before,.ot-theme-toggle-track:after{
        position:absolute;top:50%;transform:translateY(-50%);font-size:12px;line-height:1;opacity:.72
      }
      .ot-theme-toggle-track:before{content:"☀";left:7px;color:#9a6f1f}
      .ot-theme-toggle-track:after{content:"☾";right:7px;color:#506174}
      .ot-theme-toggle-knob{
        position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;
        background:#fff;box-shadow:0 3px 9px rgba(7,26,48,.22);transition:transform .25s cubic-bezier(.2,.8,.2,1),background .25s ease;
      }
      html[data-ot-theme="dark"] .ot-theme-toggle{
        background:rgba(12,27,42,.94);color:var(--ot-dark-text);border-color:rgba(255,255,255,.12);box-shadow:0 12px 34px rgba(0,0,0,.32)
      }
      html[data-ot-theme="dark"] .ot-theme-toggle-track{background:#07111d;border-color:#2d4255}
      html[data-ot-theme="dark"] .ot-theme-toggle-knob{transform:translateX(24px);background:#d8b469}

      html[data-ot-theme="dark"] body{background:var(--ot-dark-bg)!important;color:var(--ot-dark-text)!important}
      html[data-ot-theme="dark"] body,
      html[data-ot-theme="dark"] .section,
      html[data-ot-theme="dark"] .home-section,
      html[data-ot-theme="dark"] .policy-wrap,
      html[data-ot-theme="dark"] .commerce-shell,
      html[data-ot-theme="dark"] main{color:var(--ot-dark-text)}

      html[data-ot-theme="dark"] .header,
      html[data-ot-theme="dark"] #header,
      html[data-ot-theme="dark"] .market-strip,
      html[data-ot-theme="dark"] .home-section.white,
      html[data-ot-theme="dark"] .section.white,
      html[data-ot-theme="dark"] .mobile-nav,
      html[data-ot-theme="dark"] .mobile-store-bar{
        background:rgba(7,17,29,.96)!important;border-color:var(--ot-dark-line)!important;color:var(--ot-dark-text)!important
      }
      html[data-ot-theme="dark"] .header.scrolled,
      html[data-ot-theme="dark"] #header.scrolled{box-shadow:0 12px 34px rgba(0,0,0,.28)!important}

      html[data-ot-theme="dark"] .card,
      html[data-ot-theme="dark"] .category-card,
      html[data-ot-theme="dark"] .product-copy,
      html[data-ot-theme="dark"] .product-visual,
      html[data-ot-theme="dark"] .live-card,
      html[data-ot-theme="dark"] .brand-strip-inner,
      html[data-ot-theme="dark"] .hero-showcase,
      html[data-ot-theme="dark"] .hero-showcase-info,
      html[data-ot-theme="dark"] .category-home:not(:first-child),
      html[data-ot-theme="dark"] .policy-card,
      html[data-ot-theme="dark"] .commerce-card,
      html[data-ot-theme="dark"] .summary-card,
      html[data-ot-theme="dark"] .request-item,
      html[data-ot-theme="dark"] .uk-cart-item,
      html[data-ot-theme="dark"] .uk-cart-summary,
      html[data-ot-theme="dark"] .purchase-box,
      html[data-ot-theme="dark"] .support-inner,
      html[data-ot-theme="dark"] .ot-display-buybox,
      html[data-ot-theme="dark"] .ot-live-buybox{
        background:var(--ot-dark-surface)!important;border-color:var(--ot-dark-line)!important;color:var(--ot-dark-text)!important;box-shadow:0 14px 34px rgba(0,0,0,.18)!important
      }

      html[data-ot-theme="dark"] .media,
      html[data-ot-theme="dark"] .live-media,
      html[data-ot-theme="dark"] .uk-cart-thumb{
        background:var(--ot-dark-surface-2)!important;border-color:var(--ot-dark-line)!important
      }
      html[data-ot-theme="dark"] .media img,
      html[data-ot-theme="dark"] .product-visual img,
      html[data-ot-theme="dark"] .live-media img,
      html[data-ot-theme="dark"] .uk-cart-thumb img{background:#fff;border-radius:10px}

      html[data-ot-theme="dark"] h1,
      html[data-ot-theme="dark"] h2,
      html[data-ot-theme="dark"] h3,
      html[data-ot-theme="dark"] h4,
      html[data-ot-theme="dark"] .brand,
      html[data-ot-theme="dark"] .wordmark-main,
      html[data-ot-theme="dark"] .live-price,
      html[data-ot-theme="dark"] .price,
      html[data-ot-theme="dark"] .product-price,
      html[data-ot-theme="dark"] .ot-live-price,
      html[data-ot-theme="dark"] .ot-live-inline-price,
      html[data-ot-theme="dark"] .ot-display-big,
      html[data-ot-theme="dark"] .ot-display-price,
      html[data-ot-theme="dark"] .hero-price,
      html[data-ot-theme="dark"] strong{color:var(--ot-dark-text)!important}

      html[data-ot-theme="dark"] p,
      html[data-ot-theme="dark"] li,
      html[data-ot-theme="dark"] .muted,
      html[data-ot-theme="dark"] .mpn,
      html[data-ot-theme="dark"] .breadcrumb,
      html[data-ot-theme="dark"] .legal-note,
      html[data-ot-theme="dark"] .footer-copy,
      html[data-ot-theme="dark"] .market-note,
      html[data-ot-theme="dark"] .ot-live-shipping,
      html[data-ot-theme="dark"] .ot-live-trust,
      html[data-ot-theme="dark"] .ot-display-note{color:var(--ot-dark-muted)!important}

      html[data-ot-theme="dark"] .nav a,
      html[data-ot-theme="dark"] .nav-links a,
      html[data-ot-theme="dark"] .header-actions a,
      html[data-ot-theme="dark"] .market-link,
      html[data-ot-theme="dark"] .card-link,
      html[data-ot-theme="dark"] .live-link,
      html[data-ot-theme="dark"] .footer-links a,
      html[data-ot-theme="dark"] .mobile-nav a{color:#dce6ee!important}
      html[data-ot-theme="dark"] .nav a:hover,
      html[data-ot-theme="dark"] .nav-links a:hover,
      html[data-ot-theme="dark"] .card-link:hover,
      html[data-ot-theme="dark"] .live-link:hover{color:var(--ot-dark-gold)!important}

      html[data-ot-theme="dark"] .pagination a,
      html[data-ot-theme="dark"] .pagination span,
      html[data-ot-theme="dark"] input,
      html[data-ot-theme="dark"] select,
      html[data-ot-theme="dark"] textarea{
        background:var(--ot-dark-surface-2)!important;border-color:var(--ot-dark-line)!important;color:var(--ot-dark-text)!important
      }
      html[data-ot-theme="dark"] input::placeholder,
      html[data-ot-theme="dark"] textarea::placeholder{color:#7f91a0!important}

      html[data-ot-theme="dark"] .notice,
      html[data-ot-theme="dark"] .policy-callout,
      html[data-ot-theme="dark"] .launch-strip,
      html[data-ot-theme="dark"] .mini-note{
        background:#1b2630!important;border-color:#604f2b!important;color:#e4d8be!important
      }
      html[data-ot-theme="dark"] .status{background:#1b2a38!important;color:#bfd0dc!important}
      html[data-ot-theme="dark"] .status.buy,
      html[data-ot-theme="dark"] .ot-live-stock{background:#123628!important;color:#9ee0bc!important}

      html[data-ot-theme="dark"] .button.outline,
      html[data-ot-theme="dark"] .ot-live-button.secondary,
      html[data-ot-theme="dark"] .ot-display-action{
        background:transparent!important;color:var(--ot-dark-text)!important;border-color:#607589!important
      }
      html[data-ot-theme="dark"] .button.dark,
      html[data-ot-theme="dark"] .button.primary,
      html[data-ot-theme="dark"] .ot-live-button{background:#d0a85e!important;color:#07111d!important}

      html[data-ot-theme="dark"] .hero-showcase,
      html[data-ot-theme="dark"] .live-media{background:linear-gradient(145deg,#122538,#0b1825)!important}
      html[data-ot-theme="dark"] .support-inner{background:linear-gradient(135deg,#102235,#0b1724)!important}
      html[data-ot-theme="dark"] .brand-name{color:#cdd8e1!important}
      html[data-ot-theme="dark"] .card-link,
      html[data-ot-theme="dark"] .hero-showcase-foot{border-color:var(--ot-dark-line)!important}

      @media(max-width:760px){
        .ot-theme-toggle{right:12px;bottom:78px;height:38px;padding-right:8px}
        .ot-theme-toggle-label{display:none}
      }
      @media(prefers-reduced-motion:reduce){
        .ot-theme-toggle,.ot-theme-toggle-knob{transition:none!important}
      }
    `;
    document.head.appendChild(style);
  };

  const mount = () => {
    injectStyles();
    setTheme(readTheme(), false);
    if (document.querySelector("[data-ot-theme-toggle]")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "ot-theme-toggle";
    button.dataset.otThemeToggle = "true";
    button.innerHTML = `
      <span class="ot-theme-toggle-track" aria-hidden="true"><span class="ot-theme-toggle-knob"></span></span>
      <span class="ot-theme-toggle-label" data-ot-theme-label>Dark</span>
    `;
    button.addEventListener("click", () => {
      const next = document.documentElement.dataset.otTheme === DARK ? LIGHT : DARK;
      setTheme(next, true);
    });
    document.body.appendChild(button);
    setTheme(document.documentElement.dataset.otTheme || readTheme(), false);
  };

  setTheme(readTheme(), false);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();
