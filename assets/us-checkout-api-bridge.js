(() => {
  "use strict";
  if (window.__OMNI_US_CHECKOUT_API_BRIDGE__) return;
  window.__OMNI_US_CHECKOUT_API_BRIDGE__ = true;

  const API_BASE = "https://omni-terrain-uk-checkout.vercel.app";
  const nativeFetch = window.fetch.bind(window);

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

  // Only bridge API calls. Never replace catalogue/authorization assets in the
  // browser: cart, checkout and backend must all read the same published
  // authorization-gated registry.
  window.fetch = function omniCheckoutFetch(input, init) {
    return nativeFetch(mapInput(input), init);
  };

  window.OMNI_US_CHECKOUT_API_BASE = API_BASE;
})();