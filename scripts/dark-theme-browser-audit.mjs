import { chromium } from "playwright";

const BASE = process.env.OT_QA_BASE || "http://127.0.0.1:4173";
const viewports = [
  { name: "phone-320", width: 320, height: 568, mobile: true },
  { name: "phone-360", width: 360, height: 800, mobile: true },
  { name: "phone-390", width: 390, height: 844, mobile: true },
  { name: "phone-430", width: 430, height: 932, mobile: true },
  { name: "tablet-768", width: 768, height: 1024, mobile: false },
  { name: "tablet-landscape", width: 1024, height: 768, mobile: false },
  { name: "desktop-1280", width: 1280, height: 800, mobile: false },
  { name: "desktop-1440", width: 1440, height: 900, mobile: false },
  { name: "desktop-1920", width: 1920, height: 1080, mobile: false },
];

const routes = [
  "index.html",
  "deals.html",
  "us-catalogue.html",
  "automotive.html",
  "marine.html",
  "rv.html",
  "us-husky-towing-81147.html",
  "us-husky-towing-81148.html",
  "us-coast2coast-iwcn9010f.html",
  "us-coast2coast-iwcimp103x.html",
  "us-air-lift-60828hd.html",
  "us-bilstein-24-066464.html",
  "cart.html",
  "checkout.html",
  "contact-and-order-help.html",
  "shipping-delivery-policy.html",
  "returns-refunds-policy.html",
];

const failures = [];
const warnings = [];
let checks = 0;
const browser = await chromium.launch({ headless: true });

const color = value => String(value || "").replace(/\s+/g, "").toLowerCase();
const knownDarkText = new Set([
  "rgb(7,26,48)", "rgb(19,34,53)", "rgb(64,81,104)", "rgb(101,113,125)",
  "rgb(82,96,109)", "rgb(104,117,136)", "rgb(113,128,141)",
]);

function fail(key, detail) { failures.push({ key, detail }); }
function warn(key, detail) { warnings.push({ key, detail }); }

for (const vp of viewports) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.mobile ? 2 : 1,
    hasTouch: vp.mobile,
    colorScheme: "dark",
    reducedMotion: "reduce",
  });

  await context.addInitScript(() => {
    try {
      localStorage.setItem("omniTerrainTheme", "dark");
      if (/\/(cart|checkout)\.html$/.test(location.pathname)) {
        localStorage.setItem("omniTerrainUsCart", JSON.stringify([{ id: "HUS33055", quantity: 2 }]));
      }
      if (/\/checkout\.html$/.test(location.pathname)) localStorage.setItem("omniTerrainUsCoupon", "OMNI5");
    } catch (_) {}
  });

  for (const route of routes) {
    const key = `dark/${vp.name}/${route}`;
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", err => pageErrors.push(String(err?.message || err)));

    try {
      await page.goto(`${BASE}/${route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(route === "deals.html" ? 1800 : 1000);

      const result = await page.evaluate(({ mobile }) => {
        const visible = el => {
          if (!el) return false;
          const s = getComputedStyle(el), r = el.getBoundingClientRect();
          return s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity || 1) > 0 && r.width > 0 && r.height > 0;
        };
        const rect = el => { const r = el.getBoundingClientRect(); return {left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),height:Math.round(r.height)}; };
        const bodyBg = getComputedStyle(document.body).backgroundColor;
        const primarySelectors = [
          "h1", ".section-head h2", ".product-copy h1", ".ot-deal-card h2", ".ot-summary h2",
          ".ot-commerce-card-head h2", ".live-card h3"
        ];
        const bodySelectors = [
          ".product-copy>p", ".ot-deal-card p", ".live-card p", ".ot-promo-box p",
          ".ot-checkout-panel>p", ".section-head p"
        ];
        const samples = [];
        for (const sel of [...primarySelectors, ...bodySelectors]) {
          const el = document.querySelector(sel);
          if (visible(el)) samples.push({selector:sel,color:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor});
        }
        const inputs = [...document.querySelectorAll("input,select,textarea")].filter(visible).slice(0,8).map(el => ({tag:el.tagName,color:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor,border:getComputedStyle(el).borderColor}));
        const overflowers = [...document.querySelectorAll("body *")].filter(el => {
          if (!visible(el)) return false;
          const r = el.getBoundingClientRect();
          return r.right > innerWidth + 2 || r.left < -2;
        }).slice(0,10).map(el => ({tag:el.tagName,cls:String(el.className||"").slice(0,90),...rect(el)}));
        const tiny = mobile ? [...document.querySelectorAll("button,.ot-primary-btn,.ot-secondary-btn,.ot-live-button,.ot-display-action,.ot-growth-cta,.ot-deal-button,.ot-site-cart,.ot-site-menu,.cart-link,.menu-btn")]
          .filter(visible).filter(el => { const r=el.getBoundingClientRect(); return r.height < 40 || r.width < 40; })
          .slice(0,10).map(el => ({text:String(el.textContent||"").trim().slice(0,60),...rect(el)})) : [];
        const brand = document.querySelector(".ot-site-brand,#header .brand,.header .brand");
        const crest = brand ? getComputedStyle(brand,"::before").content : "none";
        const promo = document.querySelector(".ot-promo-box");
        const promoVisible = visible(promo);
        const promoColors = promoVisible ? {bg:getComputedStyle(promo).backgroundColor,text:getComputedStyle(promo).color,p:getComputedStyle(promo.querySelector("p")||promo).color} : null;
        const securePay = document.querySelector("#otSecurePay");
        const securePayVisible = visible(securePay);
        const dealsCount = document.querySelectorAll(".ot-deal-card").length;
        return {
          theme: document.documentElement.getAttribute("data-ot-theme"),
          bodyBg,
          scrollWidth: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth),
          overflowers,
          tiny,
          samples,
          inputs,
          crest,
          promoVisible,
          promoColors,
          securePayVisible,
          dealsCount,
        };
      }, { mobile: vp.mobile });

      checks++;
      if (result.theme !== "dark") fail(key, `theme did not resolve to dark (got ${result.theme})`);
      if (result.scrollWidth > vp.width + 2) fail(key, `horizontal overflow ${result.scrollWidth}px > ${vp.width}px; ${JSON.stringify(result.overflowers)}`);
      if (result.tiny.length) fail(key, `dark mobile tap targets under 40px ${JSON.stringify(result.tiny)}`);
      if (/rgb\(255,\s*255,\s*255\)/.test(result.bodyBg)) fail(key, `body remained white in dark mode: ${result.bodyBg}`);
      if (pageErrors.length) fail(key, `page errors: ${pageErrors.join(" | ")}`);

      for (const sample of result.samples) {
        if (knownDarkText.has(color(sample.color))) fail(key, `${sample.selector} retained dark-theme-unreadable text color ${sample.color}`);
      }
      for (const input of result.inputs) {
        if (knownDarkText.has(color(input.color))) fail(key, `${input.tag} retained dark input text ${input.color}`);
      }

      if (vp.width > 330 && result.crest === "none") fail(key, "classic OT crest missing from visible store brand");
      if (route === "deals.html" && result.dealsCount !== 7) fail(key, `expected 7 dark deal cards, got ${result.dealsCount}`);
      if (route === "cart.html" && !result.promoVisible) fail(key, "OMNI5 promo box missing in dark cart");
      if (route === "cart.html" && result.promoColors && knownDarkText.has(color(result.promoColors.p))) fail(key, `promo copy unreadable in dark mode: ${JSON.stringify(result.promoColors)}`);
      if (route === "checkout.html" && !result.securePayVisible) fail(key, "authorized cart missing secure Stripe CTA in dark checkout");
    } catch (error) {
      fail(key, `audit exception: ${error?.message || error}`);
    } finally {
      await page.close();
    }
  }
  await context.close();
}

await browser.close();
console.log("=== OMNI TERRAIN DARK THEME AUDIT ===");
console.log(`CHECKS: ${checks}`);
if (warnings.length) for (const item of warnings) console.log(`WARN ${item.key}: ${item.detail}`);
if (failures.length) {
  console.log(`FAILURES: ${failures.length}`);
  for (const item of failures) console.log(`FAIL ${item.key}: ${item.detail}`);
  process.exit(1);
}
console.log("RESULT = PASS");
