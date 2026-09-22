(() => {
  "use strict";
  if (window.__OMNI_AI_CHAT__) return;
  window.__OMNI_AI_CHAT__ = true;

  const API_BASE = window.OMNI_US_CHECKOUT_API_BASE || "https://omni-terrain-uk-checkout.vercel.app";
  const isUK = () => {
    const path = String(location.pathname || "").toLowerCase();
    return document.documentElement.lang?.toLowerCase() === "en-gb" || path === "/uk.html" || path.includes("/uk-") || path.includes("shield-autocare");
  };
  const region = isUK() ? "uk" : "us";
  const STORAGE_KEY = `omniAiChatV1:${region}`;
  const MAX_LOCAL_MESSAGES = 10;

  const one = (selector, root = document) => root.querySelector(selector);
  const text = (selector, root = document) => {
    const node = one(selector, root);
    return String(node?.textContent || "").replace(/\s+/g, " ").trim();
  };
  const clean = (value, max = 1500) => String(value || "").replace(/\s+/g, " ").trim().slice(0, max);

  function findMpn(scope) {
    const direct = one("[data-mpn]", scope);
    if (direct?.dataset?.mpn) return clean(direct.dataset.mpn, 120);

    const candidates = scope.querySelectorAll(".fact,.quick-card,.spec-row,.meta-topline,[class*='spec']");
    for (const node of candidates) {
      const raw = clean(node.textContent, 300);
      const match = raw.match(/\bMPN\s*[:#-]?\s*([A-Z0-9][A-Z0-9._\/-]{2,})/i);
      if (match) return match[1];
    }

    const all = clean(scope.textContent, 4000);
    return all.match(/\bMPN\s*[:#-]?\s*([A-Z0-9][A-Z0-9._\/-]{2,})/i)?.[1] || "";
  }

  function pageContext() {
    const productScope =
      one(".product-copy") ||
      one(".product-info") ||
      one(".product-layout") ||
      one("main") ||
      document.body;

    const heading = text("h1") || text("main h2");
    const productTitle =
      text(".product-title") ||
      text(".product-copy h1") ||
      text(".product-info h1") ||
      (/product|mpn|sku/i.test(document.title) ? heading : "");

    const price =
      text(".ot-live-price") ||
      text(".purchase-box .price") ||
      text(".product-price") ||
      text(".price");

    const description =
      text(".product-description") ||
      text(".product-lede") ||
      text(".product-copy>p") ||
      text(".detail-card p");

    const factsNode =
      one(".facts", productScope) ||
      one(".quick-cards", productScope) ||
      one(".spec-list", productScope) ||
      one(".specs", productScope);

    return {
      path: location.pathname + location.search,
      title: document.title,
      heading,
      productTitle,
      mpn: findMpn(productScope),
      price,
      description: clean(description, 1400),
      facts: clean(factsNode?.textContent, 1400),
    };
  }

  function loadState() {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((row) => row && (row.role === "user" || row.role === "assistant") && typeof row.content === "string")
        .slice(-MAX_LOCAL_MESSAGES);
    } catch (_) {
      return [];
    }
  }

  function saveState(messages) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_LOCAL_MESSAGES)));
    } catch (_) {}
  }

  function formatPrice(product) {
    if (!Number.isFinite(Number(product?.price))) return "";
    return new Intl.NumberFormat(region === "uk" ? "en-GB" : "en-US", {
      style: "currency",
      currency: product.currency === "GBP" ? "GBP" : "USD",
    }).format(Number(product.price));
  }

  function greeting() {
    const ctx = pageContext();
    if (ctx.productTitle) {
      return region === "uk"
        ? "Hi — I’m Omni AI. I can help with this product, fitment information, delivery, returns or finding another UK item."
        : "Hi — I’m Omni AI. I can help with this product, MPN matching, fitment information, shipping, returns or finding another part.";
    }
    return region === "uk"
      ? "Hi — I’m Omni AI. I can help you find a UK product, compare sizes, understand fitment information, delivery and returns."
      : "Hi — I’m Omni AI. I can help you find parts, match OEM/MPN numbers, understand fitment information, shipping and returns.";
  }

  function quickActions() {
    const ctx = pageContext();
    if (ctx.productTitle) {
      return [
        ["Will this fit?", "What information do you need to confirm whether this product fits my vehicle or application?"],
        ["Product details", "Summarize the important details for this product."],
        ["Shipping", "What should I know about shipping for this product?"],
        ["Returns", "What should I know about returns for this product?"],
      ];
    }
    return region === "uk"
      ? [
          ["Find a product", "Help me find the right product in the UK store."],
          ["Fitment help", "What details do you need from me to check product fitment?"],
          ["Delivery", "Tell me about UK delivery."],
          ["Returns", "Tell me about UK returns."],
        ]
      : [
          ["Find a part", "Help me find the right part. What information do you need from me?"],
          ["Used OEM", "I need help finding a used OEM auto part."],
          ["Fitment help", "What details do you need from me to check fitment?"],
          ["Shipping", "Tell me about US shipping."],
        ];
  }

  function build() {
    if (document.getElementById("otAiRoot")) return;

    const root = document.createElement("div");
    root.id = "otAiRoot";
    root.innerHTML = `
      <button class="ot-ai-launcher" type="button" aria-expanded="false" aria-controls="otAiPanel" aria-label="Open Omni AI assistant">
        <span class="ot-ai-launcher-mark"><img src="/assets/omni-terrain-emblem.webp" alt="" width="27" height="27"></span>
        <span class="ot-ai-launcher-copy"><strong>Ask Omni AI</strong><span>Product & fitment help</span></span>
      </button>
      <section class="ot-ai-panel" id="otAiPanel" aria-label="Omni AI assistant" aria-hidden="true">
        <header class="ot-ai-head">
          <span class="ot-ai-brandmark"><img src="/assets/omni-terrain-emblem.webp" alt="" width="29" height="29"></span>
          <span class="ot-ai-head-copy">
            <strong>Omni AI</strong>
            <span><i class="ot-ai-status-dot" aria-hidden="true"></i><b data-ot-ai-status>Online · ${region === "uk" ? "UK store" : "US store"}</b></span>
          </span>
          <span class="ot-ai-head-actions">
            <button class="ot-ai-icon-btn" data-ot-ai-reset type="button" title="New chat" aria-label="Start a new chat">↻</button>
            <button class="ot-ai-icon-btn" data-ot-ai-close type="button" title="Close" aria-label="Close chat">×</button>
          </span>
        </header>
        <div class="ot-ai-context">
          <span class="ot-ai-region">${region === "uk" ? "UK" : "US"} storefront</span>
          <span class="ot-ai-context-page" data-ot-ai-page></span>
        </div>
        <div class="ot-ai-messages" data-ot-ai-messages role="log" aria-live="polite"></div>
        <div class="ot-ai-quick" data-ot-ai-quick></div>
        <div class="ot-ai-compose">
          <form class="ot-ai-form" data-ot-ai-form>
            <textarea class="ot-ai-input" data-ot-ai-input rows="1" maxlength="1200" placeholder="Ask about a product, MPN, fitment..." aria-label="Message Omni AI"></textarea>
            <button class="ot-ai-send" data-ot-ai-send type="submit" aria-label="Send message">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.4 20.3 21 12 3.4 3.7l.8 6.4L16 12 4.2 13.9l-.8 6.4Z"/></svg>
            </button>
          </form>
          <div class="ot-ai-note">AI can help narrow the choice. Verify critical fitment details before ordering.</div>
        </div>
      </section>`;

    document.body.appendChild(root);

    const launcher = one(".ot-ai-launcher", root);
    const panel = one(".ot-ai-panel", root);
    const messagesNode = one("[data-ot-ai-messages]", root);
    const quickNode = one("[data-ot-ai-quick]", root);
    const form = one("[data-ot-ai-form]", root);
    const input = one("[data-ot-ai-input]", root);
    const sendButton = one("[data-ot-ai-send]", root);
    const pageNode = one("[data-ot-ai-page]", root);
    const statusNode = one("[data-ot-ai-status]", root);

    const state = { messages: loadState(), sending: false };

    function setOpen(open) {
      root.classList.toggle("is-open", open);
      launcher.setAttribute("aria-expanded", String(open));
      panel.setAttribute("aria-hidden", String(!open));
      if (open) setTimeout(() => input.focus({ preventScroll: true }), 80);
    }

    function scrollBottom() {
      requestAnimationFrame(() => {
        messagesNode.scrollTop = messagesNode.scrollHeight;
      });
    }

    function appendMessage(role, content, products = []) {
      const row = document.createElement("div");
      row.className = `ot-ai-row ${role === "user" ? "is-user" : "is-assistant"}`;
      const bubble = document.createElement("div");
      bubble.className = "ot-ai-bubble";
      bubble.textContent = content;
      row.appendChild(bubble);
      messagesNode.appendChild(row);

      if (role === "assistant" && Array.isArray(products) && products.length) {
        const list = document.createElement("div");
        list.className = "ot-ai-products";

        products.slice(0, 4).forEach((product) => {
          let url;
          try {
            url = new URL(product.url, location.origin);
            if (url.hostname !== "omni-terrain.com" && url.hostname !== "www.omni-terrain.com") return;
          } catch (_) {
            return;
          }

          const card = document.createElement("a");
          card.className = "ot-ai-product";
          card.href = url.href;
          const side = formatPrice(product) || "View →";
          card.innerHTML = `
            <span class="ot-ai-product-main"><strong></strong><span></span></span>
            <span class="ot-ai-product-side"></span>`;
          one("strong", card).textContent = product.title || product.mpn || "Product";
          one(".ot-ai-product-main span", card).textContent = [product.brand, product.mpn ? `MPN ${product.mpn}` : ""].filter(Boolean).join(" · ");
          one(".ot-ai-product-side", card).textContent = side;
          list.appendChild(card);
        });

        if (list.childElementCount) messagesNode.appendChild(list);
      }

      scrollBottom();
    }

    function showTyping() {
      const row = document.createElement("div");
      row.className = "ot-ai-row is-assistant";
      row.dataset.otAiTyping = "true";
      row.innerHTML = '<div class="ot-ai-bubble"><span class="ot-ai-typing"><i></i><i></i><i></i></span></div>';
      messagesNode.appendChild(row);
      scrollBottom();
      return row;
    }

    function renderConversation() {
      messagesNode.replaceChildren();
      appendMessage("assistant", greeting());
      state.messages.forEach((row) => appendMessage(row.role, row.content));
    }

    function renderQuick() {
      quickNode.replaceChildren();
      quickActions().forEach(([label, prompt]) => {
        const button = document.createElement("button");
        button.className = "ot-ai-chip";
        button.type = "button";
        button.textContent = label;
        button.addEventListener("click", () => send(prompt));
        quickNode.appendChild(button);
      });
    }

    async function send(raw) {
      const content = clean(raw, 1200);
      if (!content || state.sending) return;

      state.sending = true;
      sendButton.disabled = true;
      input.disabled = true;

      state.messages.push({ role: "user", content });
      state.messages = state.messages.slice(-MAX_LOCAL_MESSAGES);
      appendMessage("user", content);
      saveState(state.messages);
      input.value = "";
      input.style.height = "";

      const typing = showTyping();
      try {
        const response = await fetch(`${API_BASE}/api/ai-chat`, {
          method: "POST",
          mode: "cors",
          credentials: "omit",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            region,
            messages: state.messages,
            page: pageContext(),
          }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.error || "Chat request failed.");

        typing.remove();
        const reply = clean(payload?.reply, 5000) || "I couldn’t produce a useful answer just now. Please try again.";
        state.messages.push({ role: "assistant", content: reply });
        state.messages = state.messages.slice(-MAX_LOCAL_MESSAGES);
        saveState(state.messages);
        appendMessage("assistant", reply, payload?.products || []);

        if (statusNode) {
          statusNode.textContent = payload?.ai === false
            ? `Product helper · ${region === "uk" ? "UK store" : "US store"}`
            : `Online · ${region === "uk" ? "UK store" : "US store"}`;
        }
      } catch (error) {
        typing.remove();
        const support = region === "uk" ? "/uk-contact.html" : "/contact-and-order-help.html";
        appendMessage("assistant", `I’m having trouble connecting right now. Please try again, or use Omni Terrain support: ${support}`);
      } finally {
        state.sending = false;
        sendButton.disabled = false;
        input.disabled = false;
        input.focus({ preventScroll: true });
      }
    }

    launcher.addEventListener("click", () => setOpen(!root.classList.contains("is-open")));
    one("[data-ot-ai-close]", root)?.addEventListener("click", () => setOpen(false));
    one("[data-ot-ai-reset]", root)?.addEventListener("click", () => {
      state.messages = [];
      saveState(state.messages);
      renderConversation();
      renderQuick();
      input.value = "";
      input.focus({ preventScroll: true });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      send(input.value);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
      }
    });

    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = `${Math.min(96, Math.max(42, input.scrollHeight))}px`;
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && root.classList.contains("is-open")) setOpen(false);
    });

    const ctx = pageContext();
    pageNode.textContent = ctx.productTitle || ctx.heading || document.title.replace(/\s*[|–—-]\s*Omni Terrain.*$/i, "") || "Omni Terrain";
    renderConversation();
    renderQuick();

    fetch(`${API_BASE}/api/ai-chat-health`, { mode: "cors", credentials: "omit" })
      .then((response) => response.ok ? response.json() : null)
      .then((health) => {
        if (!health || !statusNode) return;
        statusNode.textContent = health.configured
          ? `Online · ${region === "uk" ? "UK store" : "US store"}`
          : `Product helper · ${region === "uk" ? "UK store" : "US store"}`;
      })
      .catch(() => {});

    if (new URLSearchParams(location.search).get("chat") === "1") setOpen(true);
  }

  const start = () => {
    if (!document.body) return;
    build();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
