import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.OT_QA_BASE || "http://127.0.0.1:4173";
const viewports = [
  { name: "phone-320", width: 320, height: 568, mobile: true },
  { name: "phone-390", width: 390, height: 844, mobile: true },
  { name: "tablet-768", width: 768, height: 1024, mobile: false },
  { name: "desktop-1280", width: 1280, height: 800, mobile: false },
  { name: "desktop-1920", width: 1920, height: 1080, mobile: false },
];

const routes = [
  { path: "index.html", region: "us", home: true },
  { path: "deals.html", region: "us" },
  { path: "us-catalogue.html", region: "us", catalogue: true },
  { path: "automotive.html", region: "us" },
  { path: "marine.html", region: "us" },
  { path: "rv.html", region: "us" },
  { path: "us-husky-towing-81147.html", region: "us", pdp: true },
  { path: "us-bilstein-24-066464.html", region: "us", pdp: true },
  { path: "cart.html", region: "us", cart: true },
  { path: "checkout.html", region: "us", checkout: true },
  { path: "contact-and-order-help.html", region: "us" },
  { path: "uk.html", region: "uk", home: true },
  { path: "shield-autocare-uk.html", region: "uk", catalogue: true },
  { path: "uk-tyres.html", region: "uk" },
  { path: "uk-cool-mate-70l-fridge-black.html", region: "uk", pdp: true },
  { path: "uk-cart.html", region: "uk", cart: true },
  { path: "uk-contact.html", region: "uk" },
  { path: "uk-shipping-delivery-policy.html", region: "uk" },
  { path: "uk-returns-refunds-policy.html", region: "uk" },
];

const failures = [];
const warnings = [];
const passes = [];
const seen = new Set();
fs.mkdirSync("responsive-audit", { recursive: true });

function addFailure(key, detail) {
  const fingerprint = `${key}::${detail}`;
  if (seen.has(fingerprint)) return;
  seen.add(fingerprint);
  failures.push({ key, detail });
}
function addWarning(key, detail) { warnings.push({ key, detail }); }
function addPass(detail) { passes.push(detail); }
function localUrl(value) {
  try { return new URL(value, BASE).origin === new URL(BASE).origin; }
  catch (_) { return true; }
}

const browser = await chromium.launch({ headless: true });

for (const vp of viewports) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.mobile ? 2 : 1,
    isMobile: false,
    hasTouch: vp.mobile,
    colorScheme: "light",
    reducedMotion: "reduce",
  });

  await context.addInitScript(() => {
    try {
      localStorage.setItem("otRetailPromoSeen", String(Date.now()));
      if (/\/(cart|checkout)\.html$/.test(location.pathname) && !location.pathname.startsWith("/uk-")) {
        localStorage.setItem("omniTerrainUsCart", JSON.stringify([{ id: "HUS81147", quantity: 1 }]));
      }
      if (/\/checkout\.html$/.test(location.pathname)) localStorage.setItem("omniTerrainUsCoupon", "OMNI5");
    } catch (_) {}
  });

  for (const route of routes) {
    const page = await context.newPage();
    const key = `${vp.name}/${route.path}`;
    const pageErrors = [];
    const localHttpErrors = [];
    page.on("pageerror", err => pageErrors.push(String(err?.message || err)));
    page.on("response", response => {
      try {
        const u = new URL(response.url());
        if (u.origin === new URL(BASE).origin && response.status() >= 400 && !u.pathname.startsWith("/api/")) {
          localHttpErrors.push(`${response.status()} ${u.pathname}`);
        }
      } catch (_) {}
    });

    try {
      await page.goto(`${BASE}/${route.path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(route.home ? 1800 : route.catalogue ? 1700 : 1100);

      const snapshot = await page.evaluate(({ mobile, region, home, catalogue, pdp }) => {
        const visible = el => {
          if (!el) return false;
          const s = getComputedStyle(el), r = el.getBoundingClientRect();
          return s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity || 1) > 0 && r.width > 0 && r.height > 0;
        };
        const rect = el => {
          const r = el.getBoundingClientRect();
          return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) };
        };
        const overflowers = [...document.querySelectorAll("body *")].filter(el => {
          if (!visible(el)) return false;
          const r = el.getBoundingClientRect();
          return r.right > innerWidth + 2 || r.left < -2;
        }).slice(0, 12).map(el => ({ tag: el.tagName, cls: String(el.className || "").slice(0,100), id: el.id || "", ...rect(el) }));
        const duplicateIds = [...document.querySelectorAll("[id]")].map(el => el.id).filter(Boolean).filter((id, i, arr) => arr.indexOf(id) !== i);
        const badImages = [...document.images].filter(img => {
          const src = String(img.currentSrc || img.getAttribute("src") || "");
          return src && img.complete && img.naturalWidth === 0 && !src.startsWith("data:") && !src.startsWith("blob:");
        }).slice(0,12).map(img => img.currentSrc || img.getAttribute("src") || "");
        const importantControls = [...document.querySelectorAll("button,.button,input,select,.ot-ref-cart,.ot-ref-account,.ot-ref-nav>.ot-ref-width>a,.ot-ref-nav-item>button")].filter(visible);
        const clippedControls = importantControls.filter(el => el.scrollWidth > el.clientWidth + 5 || el.scrollHeight > el.clientHeight + 5).slice(0,10).map(el => ({ text:(el.textContent||el.getAttribute('placeholder')||"").trim().slice(0,70), ...rect(el) }));
        const tinyControls = mobile ? importantControls.filter(el => { const r = el.getBoundingClientRect(); return r.height < 38 || r.width < 38; }).slice(0,10).map(el => ({ text:(el.textContent||el.getAttribute('placeholder')||"").trim().slice(0,70), ...rect(el) })) : [];
        const mainText = (document.querySelector("main")?.innerText || "").replace(/\s+/g," ").trim();
        const bodyText = (document.body?.innerText || "").replace(/\s+/g," ").trim();
        const headers = [...document.querySelectorAll("header")].filter(visible);
        const refHeaders = [...document.querySelectorAll(".ot-ref-header")].filter(visible);
        const storeLinks = [...document.querySelectorAll(".ot-ref-region a")].filter(visible).map(a => ({ text:(a.textContent||"").trim(), href:a.getAttribute("href")||"", active:a.classList.contains("active") }));
        const hero = document.querySelector(".ot-ref-hero");
        const heroRect = hero && visible(hero) ? rect(hero) : null;
        const topNav = home ? [...document.querySelectorAll(".ot-ref-nav>.ot-ref-width>.ot-ref-nav-item,.ot-ref-nav>.ot-ref-width>a")].filter(visible).length : 0;
        const productCards = home ? [...document.querySelectorAll(".ot-ref-product")].filter(visible).length : 0;
        const catalogueVisible = catalogue ? [...document.querySelectorAll("main .grid .card")].filter(visible).length : 0;
        const loadMore = catalogue ? document.querySelector(".ot-catalogue-loadmore button") : null;
        return {
          bodyScrollWidth: document.body.scrollWidth,
          docScrollWidth: document.documentElement.scrollWidth,
          overflowers,
          duplicateIds:[...new Set(duplicateIds)].slice(0,10),
          badImages,
          clippedControls,
          tinyControls,
          visibleHeaderCount:headers.length,
          refHeaderCount:refHeaders.length,
          authTriggerCount:[...document.querySelectorAll("[data-ot-auth-trigger]")].filter(visible).length,
          storeLinks,
          mainText:mainText.slice(0,1800),
          bodyText:bodyText.slice(0,5000),
          heroRect,
          topNav,
          productCards,
          catalogueVisible,
          loadMoreVisible:Boolean(loadMore&&visible(loadMore)),
          productLayoutCols:pdp&&document.querySelector(".product-layout") ? getComputedStyle(document.querySelector(".product-layout")).gridTemplateColumns : "",
          productVisualRect:pdp&&document.querySelector(".product-visual") ? rect(document.querySelector(".product-visual")) : null,
          region,
          home,
          mobile
        };
      }, { mobile: vp.mobile, region: route.region, home: route.home, catalogue: route.catalogue, pdp: route.pdp });

      if (snapshot.docScrollWidth > vp.width + 2 || snapshot.bodyScrollWidth > vp.width + 2) addFailure(key, `horizontal overflow doc=${snapshot.docScrollWidth} body=${snapshot.bodyScrollWidth} viewport=${vp.width}; ${JSON.stringify(snapshot.overflowers)}`);
      if (snapshot.clippedControls.length) addFailure(key, `clipped important controls ${JSON.stringify(snapshot.clippedControls)}`);
      if (snapshot.tinyControls.length) addFailure(key, `mobile important tap targets under 38px ${JSON.stringify(snapshot.tinyControls)}`);
      if (snapshot.duplicateIds.length) addFailure(key, `duplicate DOM ids ${snapshot.duplicateIds.join(",")}`);
      if (pageErrors.length) addFailure(key, `page errors ${pageErrors.join(" | ")}`);
      if (localHttpErrors.length) addFailure(key, `same-origin HTTP errors ${[...new Set(localHttpErrors)].join(" | ")}`);

      const brokenLocal = snapshot.badImages.filter(localUrl);
      const brokenExternal = snapshot.badImages.filter(src => !localUrl(src));
      if (brokenLocal.length) addFailure(key, `broken same-origin images ${brokenLocal.slice(0,4).join(" | ")}`);
      if (brokenExternal.length) addWarning(key, `external images unavailable in QA runtime ${brokenExternal.slice(0,4).join(" | ")}`);

      if (route.home) {
        if (snapshot.visibleHeaderCount !== 1 || snapshot.refHeaderCount !== 1) addFailure(key, `expected one reference header, got headers=${snapshot.visibleHeaderCount} reference=${snapshot.refHeaderCount}`);
        if (snapshot.authTriggerCount !== 1) addFailure(key, `expected one visible account trigger, got ${snapshot.authTriggerCount}`);
        if (snapshot.storeLinks.length !== 2) addFailure(key, `expected US/UK store links, got ${JSON.stringify(snapshot.storeLinks)}`);
        const active = snapshot.storeLinks.find(link => link.active);
        const expectedHref = route.region === "uk" ? "/uk.html" : "/";
        if (!active || active.href !== expectedHref) addFailure(key, `wrong active store ${JSON.stringify(snapshot.storeLinks)}`);
        if (!snapshot.heroRect || snapshot.heroRect.width > vp.width + 2) addFailure(key, `reference hero missing or too wide ${JSON.stringify(snapshot.heroRect)}`);
        if (!/Find the Right Parts for Your Adventure/i.test(snapshot.mainText)) addFailure(key, "finder merchandising missing");
        if (snapshot.productCards < 1) addFailure(key, "no visible featured products");
        if (vp.width <= 760 && snapshot.topNav !== 4) addFailure(key, `mobile home should expose 4 compact nav items, got ${snapshot.topNav}`);
        if (route.region === "us" && /£\d/.test(snapshot.mainText)) addFailure(key, "GBP price leaked into US homepage");
        if (route.region === "uk" && /\$\d/.test(snapshot.mainText)) addFailure(key, "USD price leaked into UK homepage");
      }

      if (route.catalogue && route.region === "us") {
        if (snapshot.catalogueVisible > 24) addFailure(key, `US catalogue initial render exceeds 24 products: ${snapshot.catalogueVisible}`);
        if (snapshot.catalogueVisible > 0 && !snapshot.loadMoreVisible) addWarning(key, "catalogue has no load-more control; may be fewer than 25 eligible products");
      }

      if (route.pdp && vp.width <= 760) {
        const cols = snapshot.productLayoutCols.trim().split(/\s+/).filter(Boolean);
        if (cols.length > 1) addFailure(key, `mobile PDP still multi-column: ${snapshot.productLayoutCols}`);
        if (snapshot.productVisualRect && snapshot.productVisualRect.width > vp.width + 2) addFailure(key, `PDP image panel wider than viewport: ${snapshot.productVisualRect.width}`);
      }

      if (route.path === "cart.html" || route.path === "checkout.html") {
        if (/US operator:\s*PRP Xpert LLC|30 N Gould|Sheridan,? WY 82801/i.test(snapshot.bodyText)) addFailure(key, "legacy US operator/address is customer-visible");
      }
      if (route.path === "uk-cool-mate-70l-fridge-black.html") {
        if (/VAT\s*(?:No|Number)|EORI/i.test(snapshot.bodyText)) addFailure(key, "VAT/EORI identifier label is customer-visible on UK PDP");
      }

      addPass(`${key} checked`);
    } catch (error) {
      addFailure(key, `navigation/audit exception: ${error?.message || error}`);
    } finally {
      if (failures.some(item => item.key === key)) {
        try { await page.screenshot({ path: `responsive-audit/${vp.name}-${route.path.replace(/\.html$/,'')}.png`, fullPage: true }); } catch (_) {}
      }
      await page.close();
    }
  }
  await context.close();
}

await browser.close();
fs.writeFileSync("responsive-audit/report.json", JSON.stringify({ passes, warnings, failures }, null, 2));

console.log(`Responsive browser audit: ${passes.length} passes, ${warnings.length} warnings, ${failures.length} failures`);
for (const item of warnings.slice(0,30)) console.log(`WARN ${item.key}: ${item.detail}`);
if (failures.length) {
  for (const item of failures) console.log(`FAIL ${item.key}: ${item.detail}`);
  process.exit(1);
}
console.log("RESULT = PASS");