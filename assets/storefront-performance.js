(() => {
  "use strict";
  if (window.__OMNI_PERFORMANCE__) return;
  window.__OMNI_PERFORMANCE__ = true;

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const saveData = Boolean(connection && connection.saveData);
  const slowNetwork = Boolean(connection && /(^|-)2g$|3g/.test(String(connection.effectiveType || "")));
  const lowMemory = Number(navigator.deviceMemory || 8) <= 4;
  const lowCpu = Number(navigator.hardwareConcurrency || 8) <= 4;
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lite = saveData || slowNetwork || reducedMotion || (lowMemory && lowCpu);

  if (lite) document.documentElement.classList.add("ot-perf-lite");

  const imageFrame = (img) => img && img.closest ? img.closest(".media,.live-media") : null;
  const attachImageState = (img) => {
    if (!img || img.dataset.otImageStateBound) return;
    img.dataset.otImageStateBound = "1";
    const frame = imageFrame(img);
    if (!frame) return;
    const ready = () => frame.classList.remove("ot-media-failed");
    const failed = () => frame.classList.add("ot-media-failed");
    img.addEventListener("load", ready, { passive: true });
    img.addEventListener("error", failed, { passive: true });
    if (img.complete) {
      if (img.naturalWidth) ready(); else failed();
    }
  };

  // Runtime fallback for images added dynamically after HTML parsing.
  const tuneImage = (img, index = 1) => {
    if (!img || img.dataset.otPerfTuned) return;
    img.dataset.otPerfTuned = "1";
    img.decoding = "async";
    const priority = index === 0 || img.closest(".product-visual,.hero-showcase,.ot-motion-stage");
    if (priority) {
      img.loading = "eager";
      try { img.fetchPriority = "high"; } catch (_) {}
    } else {
      img.loading = "lazy";
      try { img.fetchPriority = "low"; } catch (_) {}
    }
    attachImageState(img);
  };

  const tuneAllImages = () => {
    document.querySelectorAll("img").forEach((img, index) => tuneImage(img, index));
  };

  tuneAllImages();
  if ("MutationObserver" in window) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.matches && node.matches("img")) tuneImage(node, 1);
          node.querySelectorAll && node.querySelectorAll("img").forEach((img) => tuneImage(img, 1));
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
  }

  // Avoid expensive decorative work while the tab is hidden.
  document.addEventListener("visibilitychange", () => {
    document.documentElement.classList.toggle("ot-page-hidden", document.hidden);
  });
})();
