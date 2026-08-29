(() => {
  "use strict";
  if (window.__OMNI_PRODUCT_PREMIUM__) return;

  const layout = document.querySelector(".product-layout");
  const copy = document.querySelector(".product-copy");
  const visual = document.querySelector(".product-visual");
  if (!layout || !copy || !visual) return;
  window.__OMNI_PRODUCT_PREMIUM__ = true;
  document.body.classList.add("ot-product-page");

  const schema = (() => {
    for (const node of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const value = JSON.parse(node.textContent || "{}");
        if (value && value["@type"] === "Product") return value;
      } catch (_) {}
    }
    return {};
  })();

  const imageBadge = visual.querySelector(".image-badge");
  if (imageBadge) imageBadge.textContent = "Product image";

  // Remove the legacy enquiry CTA once the production product runtime is active.
  // Live products receive Add to Cart / Buy Now; other products receive the
  // customer-safe availability actions from universal-checkout-ui.js.
  copy.querySelector(".notice")?.remove();
  copy.querySelectorAll("p").forEach((node) => {
    if (node.querySelector("a.button")) node.remove();
  });

  const breadcrumb = document.querySelector(".breadcrumb");
  if (breadcrumb && !document.querySelector(".ot-product-confidence")) {
    const row = document.createElement("div");
    row.className = "ot-product-confidence";
    row.innerHTML = '<span><i></i>Manufacturer MPN shown</span><span><i></i>Product support available</span><span><i></i>US delivery options</span>';
    breadcrumb.insertAdjacentElement("afterend", row);
  }

  const image = visual.querySelector("img");
  if (image) {
    image.dataset.otImageReady = image.complete && image.naturalWidth ? "1" : "0";
    image.decoding = "async";
    image.loading = "eager";
    try { image.fetchPriority = "high"; } catch (_) {}

    const ready = () => {
      image.dataset.otImageReady = "1";
      visual.classList.remove("ot-image-failed");
      if (imageBadge) imageBadge.textContent = "Product image";
    };
    const failed = () => {
      image.dataset.otImageReady = "1";
      visual.classList.add("ot-image-failed");
      if (imageBadge) imageBadge.textContent = "Image unavailable";
    };
    if (image.complete) {
      if (image.naturalWidth) ready(); else failed();
    } else {
      image.addEventListener("load", ready, { once: true });
      image.addEventListener("error", failed, { once: true });
    }

    if (!visual.querySelector(".ot-image-tools")) {
      const tools = document.createElement("div");
      tools.className = "ot-image-tools";
      tools.innerHTML = '<span class="ot-image-hint">Tap image to inspect</span><button class="ot-image-zoom" type="button">Enlarge image</button>';
      visual.appendChild(tools);

      const viewer = document.createElement("div");
      viewer.className = "ot-image-viewer";
      viewer.setAttribute("role", "dialog");
      viewer.setAttribute("aria-modal", "true");
      viewer.setAttribute("aria-label", "Product image viewer");
      viewer.innerHTML = '<div class="ot-image-viewer-inner"><button class="ot-image-viewer-close" type="button" aria-label="Close image viewer">×</button><img alt=""></div>';
      document.body.appendChild(viewer);
      const viewerImage = viewer.querySelector("img");
      const close = viewer.querySelector(".ot-image-viewer-close");
      const openViewer = () => {
        if (visual.classList.contains("ot-image-failed")) return;
        if (!image.currentSrc && !image.src) return;
        viewerImage.src = image.currentSrc || image.src;
        viewerImage.alt = image.alt || schema.name || "Product image";
        viewer.classList.add("open");
        document.body.style.overflow = "hidden";
        close.focus();
      };
      const closeViewer = () => {
        viewer.classList.remove("open");
        document.body.style.overflow = "";
      };
      tools.querySelector(".ot-image-zoom").addEventListener("click", openViewer);
      image.addEventListener("click", openViewer);
      image.style.cursor = "zoom-in";
      close.addEventListener("click", closeViewer);
      viewer.addEventListener("click", (event) => { if (event.target === viewer) closeViewer(); });
      document.addEventListener("keydown", (event) => { if (event.key === "Escape" && viewer.classList.contains("open")) closeViewer(); });
    }
  } else {
    visual.classList.add("ot-image-failed");
    if (imageBadge) imageBadge.textContent = "Image unavailable";
  }

  const facts = copy.querySelector(".facts");
  if (facts && schema) {
    const brand = typeof schema.brand === "object" ? schema.brand?.name : schema.brand;
    const values = [brand, schema.mpn, schema.category].filter(Boolean);
    if (!facts.children.length && values.length) {
      facts.innerHTML = values.map((value, index) => `<div class="fact"><small>${["Brand","MPN","Category"][index] || "Detail"}</small><strong>${String(value)}</strong></div>`).join("");
    }
  }

  if (!copy.querySelector(".ot-product-support")) {
    const support = document.createElement("div");
    support.className = "ot-product-support";
    support.innerHTML = '<div><b>Need fitment help?</b><span>Send the MPN and vehicle or application details.</span></div><div><b>Clear product identity</b><span>Brand and manufacturer part number stay visible.</span></div><div><b>Delivery support</b><span>Availability and delivery are checked before fulfilment.</span></div>';
    const factsNode = copy.querySelector(".facts");
    if (factsNode) factsNode.insertAdjacentElement("afterend", support);
    else copy.appendChild(support);
  }
})();
