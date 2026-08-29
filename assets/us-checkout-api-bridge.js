(() => {
  "use strict";
  if (window.__OMNI_US_CHECKOUT_API_BRIDGE__) return;
  window.__OMNI_US_CHECKOUT_API_BRIDGE__ = true;

  const API_BASE = "https://omni-terrain-uk-checkout.vercel.app";
  const nativeFetch = window.fetch.bind(window);

  function inputUrl(input) {
    try {
      if (typeof input === "string") return new URL(input, location.href);
      if (input instanceof URL) return input;
      if (input instanceof Request) return new URL(input.url);
    } catch (_) {}
    return null;
  }

  function storefrontLiveResponse() {
    const products = {};
    try {
      if (typeof OMNI_US_PRODUCTS !== "undefined" && Array.isArray(OMNI_US_PRODUCTS)) {
        for (const product of OMNI_US_PRODUCTS) {
          const id = String(product?.id || "").trim();
          if (!id || String(product?.decision || "LIST").toUpperCase() !== "LIST") continue;
          products[id] = { enabled: true, priceCents: 1, storefrontWide: true };
        }
      }
    } catch (_) {}
    return new Response(JSON.stringify({
      version: "storefront-wide-v1",
      checkoutApiBase: API_BASE,
      products,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  function mapInput(input) {
    if (typeof input === "string" && input.startsWith("/api/us-")) return API_BASE + input;
    if (input instanceof URL && input.origin === location.origin && input.pathname.startsWith("/api/us-")) {
      return new URL(input.pathname + input.search, API_BASE);
    }
    if (input instanceof Request) {
      try {
        const url = new URL(input.url);
        if (url.origin === location.origin && url.pathname.startsWith("/api/us-")) {
          return new Request(API_BASE + url.pathname + url.search, input);
        }
      } catch (_) {}
    }
    return input;
  }

  window.fetch = function omniCheckoutFetch(input, init) {
    const url = inputUrl(input);
    if (url && url.origin === location.origin && url.pathname.endsWith("/assets/us-live-products.json")) {
      return Promise.resolve(storefrontLiveResponse());
    }
    return nativeFetch(mapInput(input), init);
  };

  window.OMNI_US_CHECKOUT_API_BASE = API_BASE;
})();
