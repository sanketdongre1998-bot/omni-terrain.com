(() => {
  "use strict";
  if (window.__OMNI_US_LAUNCH_OFFERS_INSTALLED__) return;
  window.__OMNI_US_LAUNCH_OFFERS_INSTALLED__ = true;

  const OFFERS = {
    HUS81147: {
      priceCents: 11999,
      compareAtCents: 12626,
      label: "Featured Deal",
      shippingIncluded: true,
      slug: "us-husky-towing-81147.html"
    },
    HUS81148: {
      priceCents: 14999,
      compareAtCents: 15828,
      label: "Featured Deal",
      shippingIncluded: true,
      slug: "us-husky-towing-81148.html"
    },
    CCIN9010F: {
      priceCents: 21999,
      compareAtCents: 23900,
      label: "Featured Deal",
      shippingIncluded: true,
      slug: "us-coast2coast-iwcn9010f.html"
    },
    CCIN8010F: {
      priceCents: 19999,
      compareAtCents: 21900,
      label: "Featured Deal",
      shippingIncluded: true,
      slug: "us-coast2coast-iwcn8010f.html"
    },
    CCIIMP103X: {
      priceCents: 16999,
      compareAtCents: 18065,
      label: "Featured Deal",
      shippingIncluded: true,
      slug: "us-coast2coast-iwcimp103x.html"
    },
    A1360828HD: {
      priceCents: 20499,
      compareAtCents: 21399,
      label: "Featured Deal",
      shippingIncluded: true,
      slug: "us-air-lift-60828hd.html"
    },
    B5224066464: {
      priceCents: 13299,
      compareAtCents: 13697,
      label: "Featured Deal",
      shippingIncluded: true,
      slug: "us-bilstein-24-066464.html"
    }
  };
  window.OMNI_US_LAUNCH_OFFERS = OFFERS;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const response = await nativeFetch(input, init);
    let url = "";
    try { url = typeof input === "string" ? input : String(input?.url || ""); } catch (_) {}
    if (!/\/assets\/us-live-products\.json(?:\?|$)/i.test(url)) return response;

    try {
      const data = await response.clone().json();
      for (const [id, offer] of Object.entries(OFFERS)) {
        const row = data?.products?.[id];
        if (!row || row.enabled !== true || row.authorizationVerified !== true) continue;
        row.priceCents = offer.priceCents;
        row.launchOffer = {
          label: offer.label,
          compareAtCents: offer.compareAtCents,
          savingsCents: offer.compareAtCents - offer.priceCents
        };
      }
      const headers = new Headers(response.headers);
      headers.set("content-type", "application/json; charset=utf-8");
      headers.delete("content-length");
      return new Response(JSON.stringify(data), {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (_) {
      return response;
    }
  };

  function money(cents) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2
    }).format(Number(cents || 0) / 100);
  }

  function currentOffer() {
    const page = decodeURIComponent(String(location.pathname || "").split("/").filter(Boolean).pop() || "").toLowerCase();
    return Object.values(OFFERS).find(offer => String(offer.slug || "").toLowerCase() === page) || null;
  }

  function decorateOfferPage() {
    const offer = currentOffer();
    if (!offer) return;
    const box = document.querySelector(".ot-live-buybox");
    if (!box || box.dataset.otLaunchDecorated) return;
    box.dataset.otLaunchDecorated = "1";

    if (!document.getElementById("otLaunchOfferStyles")) {
      const style = document.createElement("style");
      style.id = "otLaunchOfferStyles";
      style.textContent = `
        .ot-launch-ribbon{display:inline-flex;align-items:center;padding:7px 10px;margin-bottom:10px;border-radius:999px;background:#fff1bf;color:#5e4300;font-size:11px;font-weight:900;letter-spacing:.06em;text-transform:uppercase}
        .ot-launch-compare{margin:7px 0 4px;display:flex;flex-wrap:wrap;align-items:center;gap:8px;color:#65717d;font-size:13px}
        .ot-launch-compare s{opacity:.8}.ot-launch-compare strong{color:#167047}
        .ot-live-buybox[data-ot-launch-deal="1"]{border-color:#d7b04c;box-shadow:0 16px 36px rgba(7,26,48,.10)}
      `;
      document.head.appendChild(style);
    }

    box.dataset.otLaunchDeal = "1";
    const label = box.querySelector(".ot-live-label");
    if (label) label.textContent = "Featured price";
    const price = box.querySelector(".ot-live-price");
    if (price && !box.querySelector(".ot-launch-ribbon")) {
      const ribbon = document.createElement("div");
      ribbon.className = "ot-launch-ribbon";
      ribbon.textContent = offer.label;
      box.insertBefore(ribbon, label || box.firstChild);

      const compare = document.createElement("div");
      compare.className = "ot-launch-compare";
      compare.innerHTML = `<span>Was <s>${money(offer.compareAtCents)}</s></span><strong>Save ${money(offer.compareAtCents - offer.priceCents)}</strong>`;
      price.insertAdjacentElement("afterend", compare);
    }
    const shipping = box.querySelector(".ot-live-shipping");
    if (shipping) shipping.textContent = "Free standard shipping in the contiguous U.S.";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", decorateOfferPage, { once: true });
  else decorateOfferPage();

  if ("MutationObserver" in window) {
    const observer = new MutationObserver(decorateOfferPage);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
  }
})();
