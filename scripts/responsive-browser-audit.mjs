import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.OT_QA_BASE || "http://127.0.0.1:4173";
const registry = JSON.parse(fs.readFileSync("assets/us-live-products.json", "utf8"));
const enabledIds = new Set(Object.entries(registry?.products || {})
  .filter(([, row]) => row?.enabled === true && row?.authorizationVerified === true && Number(row?.priceCents || 0) > 0)
  .map(([id]) => id));

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

function addFailure(key, detail) {
  const fingerprint = `${key}::${detail}`;
  if (seen.has(fingerprint)) return;
  seen.add(fingerprint);
  failures.push({ key, detail });
}
function addWarning(key, detail) { warnings.push({ key, detail }); }
function addPass(detail) { passes.push(detail); }
function isIgnorableImage(src) { return !src || src.startsWith("data:") || src.startsWith("blob:"); }

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
        localStorage.setItem("omniTerrainUsCart", JSON.stringify([{ id: "HUS33055", quantity: 2 }]));
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
        if (u.origin === new URL(BASE).origin && response.status() >= 400) localHttpErrors.push(`${response.status()} ${u.pathname}`);
      } catch (_) {}
    });

    try {
      await page.goto(`${BASE}/${route.path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(route.path === "deals.html" ? 1600 : 900);
      const snapshot = await page.evaluate(({ mobile, region, home }) => {
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
        }).slice(0, 12).map(el => ({ tag: el.tagName, cls: String(el.className || "").slice(0,120), id: el.id || "", ...rect(el) }));
        const duplicateIds = [...document.querySelectorAll("[id]")].map(el => el.id).filter(Boolean).filter((id, i, arr) => arr.indexOf(id) !== i);
        const badImages = [...document.images].filter(img => {
          const src = String(img.currentSrc || img.getAttribute("src") || "");
          return src && img.complete && img.naturalWidth === 0 && !src.startsWith("data:") && !src.startsWith("blob:");
        }).slice(0,8).map(img => img.currentSrc || img.getAttribute("src") || "");
        const controls = [...document.querySelectorAll("button,a.ot-hero-buttons a,.ot-retail-search button,.ot-find-form button,.ot-welcome-skip,.ot-welcome-close,.ot-email-submit,.ot-google-auth-button")].filter(visible);
        const clippedControls = controls.filter(el => el.scrollWidth > el.clientWidth + 4 || el.scrollHeight > el.clientHeight + 4).slice(0,10).map(el => ({ text:(el.textContent||"").trim().slice(0,70), ...rect(el) }));
        const tinyControls = mobile ? controls.filter(el => { const r = el.getBoundingClientRect(); return r.height < 38 || r.width < 38; }).slice(0,10).map(el => ({ text:(el.textContent||"").trim().slice(0,70), ...rect(el) })) : [];
        const headers = [...document.querySelectorAll("header")].filter(visible);
        const retailHeaders = [...document.querySelectorAll(".ot-retail-header")].filter(visible);
        const mainText = (document.querySelector("main")?.innerText || "").replace(/\s+/g," ").trim();
        const headerText = (document.querySelector(".ot-retail-header")?.innerText || "").replace(/\s+/g," ").trim();
        const storeLinks = [...document.querySelectorAll(".ot-region-mini a")].filter(visible).map(a => ({ text:(a.textContent||"").replace(/\s+/g," ").trim(), href:a.getAttribute("href")||"", active:a.classList.contains("active") || a.getAttribute("aria-current")==="page" }));
        const hero = document.querySelector(".ot-retail-hero");
        const heroRect = hero && visible(hero) ? rect(hero) : null;
        return {
          innerWidth,
          bodyScrollWidth: document.body.scrollWidth,
          docScrollWidth: document.documentElement.scrollWidth,
          overflowers,
          duplicateIds:[...new Set(duplicateIds)].slice(0,10),
          badImages,
          clippedControls,
          tinyControls,
          visibleHeaderCount:headers.length,
          retailHeaderCount:retailHeaders.length,
          authTriggerCount:[...document.querySelectorAll("[data-ot-auth-trigger]")].filter(visible).length,
          storeLinks,
          mainText:mainText.slice(0,1200),
          headerText:headerText.slice(0,500),
          heroRect,
          dealsCount:document.querySelectorAll(".ot-deal-card").length,
          dealsLoading:Boolean(document.querySelector("#otDealsGrid") && /loading featured deals/i.test(document.querySelector("#otDealsGrid")?.textContent||"")),
          productLayoutCols:document.querySelector(".product-layout") ? getComputedStyle(document.querySelector(".product-layout")).gridTemplateColumns : "",
          productVisualRect:document.querySelector(".product-visual") ? rect(document.querySelector(".product-visual")) : null,
          securePayVisible:Boolean(document.querySelector("#otSecurePay") && visible(document.querySelector("#otSecurePay"))),
          promoBoxVisible:Boolean(document.querySelector(".ot-promo-box") && visible(document.querySelector(".ot-promo-box"))),
          checkoutPromoVisible:Boolean(document.querySelector(".ot-checkout-promo") && visible(document.querySelector(".ot-checkout-promo"))),
          region,
          home,
        };
      }, { mobile: vp.mobile, region: route.region, home: route.home });

      if (snapshot.docScrollWidth > vp.width + 2 || snapshot.bodyScrollWidth > vp.width + 2) addFailure(key, `horizontal overflow doc=${snapshot.docScrollWidth} body=${snapshot.bodyScrollWidth} viewport=${vp.width}; elements=${JSON.stringify(snapshot.overflowers)}`);
      if (snapshot.clippedControls.length) addFailure(key, `clipped controls ${JSON.stringify(snapshot.clippedControls)}`);
      if (snapshot.tinyControls.length) addFailure(key, `mobile tap targets under 38px ${JSON.stringify(snapshot.tinyControls)}`);
      if (snapshot.duplicateIds.length) addFailure(key, `duplicate DOM ids ${snapshot.duplicateIds.join(",")}`);
      if (pageErrors.length) addFailure(key, `page errors ${pageErrors.join(" | ")}`);
      if (localHttpErrors.length) addFailure(key, `same-origin HTTP errors ${[...new Set(localHttpErrors)].join(" | ")}`);

      if (route.home) {
        if (snapshot.visibleHeaderCount !== 1 || snapshot.retailHeaderCount !== 1) addFailure(key, `expected one visible retail header, got headers=${snapshot.visibleHeaderCount} retail=${snapshot.retailHeaderCount}`);
        if (snapshot.authTriggerCount !== 1) addFailure(key, `expected one visible account trigger, got ${snapshot.authTriggerCount}`);
        if (snapshot.storeLinks.length !== 2) addFailure(key, `expected two visible store links, got ${snapshot.storeLinks.length}`);
        const active = snapshot.storeLinks.find(link => link.active);
        const expectedHref = route.region === "uk" ? "/uk.html" : "/";
        if (!active || active.href !== expectedHref) addFailure(key, `wrong active store ${JSON.stringify(snapshot.storeLinks)}`);
        if (!snapshot.heroRect || snapshot.heroRect.width > vp.width + 2) addFailure(key, `home hero missing or wider than viewport ${JSON.stringify(snapshot.heroRect)}`);
        if (route.region === "us") {
          if (!/Find the right part/i.test(snapshot.mainText)) addFailure(key, "US retail hero copy missing");
          if (!/United States|US Store/i.test(snapshot.headerText)) addFailure(key, "US store identity missing from header");
          if (/£\d/.test(snapshot.mainText)) addFailure(key, "GBP price leaked into US homepage");
        } else {
          if (!/UK auto, marine|Find a UK product/i.test(snapshot.mainText)) addFailure(key, "UK retail hero/search copy missing");
          if (!/UK Store|United Kingdom/i.test(snapshot.headerText)) addFailure(key, "UK store identity missing from header");
          if (/\$\d/.test(snapshot.mainText)) addFailure(key, "USD price leaked into UK homepage");
        }
      }

      if (route.path === "deals.html") {
        if (snapshot.dealsCount !== 7) addFailure(key, `expected 7 deal cards, got ${snapshot.dealsCount}`);
        if (snapshot.dealsLoading) addFailure(key, "deals page stuck on loading state");
      }
      if (route.pdp && vp.width <= 760) {
        if (snapshot.productLayoutCols && snapshot.productLayoutCols.split(" ").length > 1) addFailure(key, `mobile PDP still multi-column: ${snapshot.productLayoutCols}`);
        if (snapshot.productVisualRect && snapshot.productVisualRect.width > vp.width + 1) addFailure(key, `PDP image panel wider than viewport: ${snapshot.productVisualRect.width}`);
      }
      if (route.path === "cart.html" && !snapshot.promoBoxVisible) addFailure(key, "OMNI5 promo box missing from populated US cart");
      if (route.checkout) {
        if (!snapshot.securePayVisible) addFailure(key, "authorized US cart does not expose secure Stripe CTA");
        if (!snapshot.checkoutPromoVisible) addFailure(key, "saved OMNI5 code not surfaced on checkout review");
      }
      if (snapshot.badImages.length) addWarning(key, `images unavailable in QA runtime: ${snapshot.badImages.filter(src=>!isIgnorableImage(src)).slice(0,3).join(" | ")}`);
      addPass(`${key} geometry checked`);
    } catch (error) {
      addFailure(key, `navigation/audit exception: ${error?.message || error}`);
    } finally {
      await page.close();
    }
  }

  for (const [homePath, region] of [["index.html","us"],["uk.html","uk"]]) {
    const page = await context.newPage();
    const key = `${vp.name}/${homePath}/interactive`;
    try {
      await page.addInitScript(() => { try { localStorage.removeItem("otRetailPromoSeen"); } catch (_) {} });
      await page.goto(`${BASE}/${homePath}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(1300);
      const modalState = await page.evaluate((region) => {
        const visible = el => { if(!el)return false; const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=="none"&&s.visibility!=="hidden"&&r.width>0&&r.height>0; };
        const overlay=document.querySelector(".ot-welcome"), card=document.querySelector(".ot-welcome-card"), r=card?.getBoundingClientRect();
        const links=[...document.querySelectorAll(".ot-welcome-store-switch a")].filter(visible).map(a=>({text:(a.textContent||"").trim(),href:a.getAttribute("href")||"",active:a.classList.contains("active")}));
        return { visible:Boolean(overlay&&visible(overlay)), card:r?{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}:null, direct:Boolean(document.querySelector(".ot-direct-continue,.ot-welcome-skip")), close:Boolean(document.querySelector(".ot-welcome-close")), storeLinks:links, region };
      }, region);
      if (!modalState.visible) addFailure(key, "first-visit welcome modal did not open");
      if (!modalState.card || modalState.card.left < -2 || modalState.card.right > vp.width + 2) addFailure(key, `welcome modal outside viewport ${JSON.stringify(modalState.card)}`);
      if (!modalState.direct || !modalState.close) addFailure(key, `welcome modal missing direct continue/close ${JSON.stringify(modalState)}`);
      if (modalState.storeLinks.length !== 2) addFailure(key, `welcome modal missing US/UK switch ${JSON.stringify(modalState.storeLinks)}`);

      const direct = page.locator(".ot-direct-continue,.ot-welcome-skip").first();
      if (await direct.count()) { await direct.click(); await page.waitForTimeout(120); }
      const stillOpen = await page.evaluate(() => { const el=document.querySelector(".ot-welcome"); return Boolean(el && !el.hidden && getComputedStyle(el).display!=="none"); });
      if (stillOpen) addFailure(key, "direct continue did not dismiss welcome modal");

      await page.waitForFunction(() => Boolean(window.__OMNI_FIREBASE_AUTH__), null, { timeout: 10000 });
      const trigger = page.locator("[data-ot-auth-trigger]:visible").first();
      if (await trigger.count() !== 1) throw new Error("no visible account trigger after welcome dismissal");
      await trigger.click();
      await page.waitForTimeout(150);
      const auth = await page.evaluate(() => {
        const overlay=document.querySelector("#otAuthOverlay"), dialog=document.querySelector(".ot-auth-dialog"), r=dialog?.getBoundingClientRect();
        return { open:Boolean(overlay && !overlay.hidden), google:/continue with google/i.test(document.querySelector("[data-ot-google-signin]")?.textContent||""), email:Boolean(document.querySelector("#otAuthEmail")), password:Boolean(document.querySelector("#otAuthPassword")), privacy:Boolean(document.querySelector('.ot-auth-dialog a[href="privacy-policy.html"],.ot-auth-dialog a[href="/privacy-policy.html"]')), terms:Boolean(document.querySelector('.ot-auth-dialog a[href="terms-conditions.html"],.ot-auth-dialog a[href="/terms-conditions.html"]')), rect:r?{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}:null };
      });
      if (!auth.open || !auth.google || !auth.email || !auth.password || !auth.privacy || !auth.terms) addFailure(key, `account modal incomplete ${JSON.stringify(auth)}`);
      if (!auth.rect || auth.rect.left < -2 || auth.rect.right > vp.width + 2) addFailure(key, `account modal outside viewport ${JSON.stringify(auth.rect)}`);
      await page.locator("[data-ot-auth-close]").click();
      addPass(`${key} welcome/store switch/account checked`);
    } catch (error) {
      addFailure(key, `interactive UI exception: ${error?.message || error}`);
    } finally {
      await page.close();
    }
  }
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme:"light" });
  const page = await context.newPage();
  await page.goto(`${BASE}/us-catalogue.html`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(700);
  const ids = await page.evaluate(() => {
    try { return typeof OMNI_US_PRODUCTS !== "undefined" && Array.isArray(OMNI_US_PRODUCTS) ? OMNI_US_PRODUCTS.map(p => String(p.id || "")).filter(Boolean) : []; }
    catch (_) { return []; }
  });
  const ineligible = ids.find(id => !enabledIds.has(id));
  if (!ineligible) addFailure("authorization-regression", "could not find a non-authorized catalogue product for browser regression test");
  else {
    await page.evaluate(id => { localStorage.setItem("omniTerrainUsCart", JSON.stringify([{ id, quantity: 1 }])); localStorage.removeItem("omniTerrainUsCoupon"); }, ineligible);
    await page.goto(`${BASE}/checkout.html?qa=ineligible`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1000);
    const gate = await page.evaluate(() => ({ securePay: Boolean(document.querySelector("#otSecurePay")), text: (document.querySelector("main")?.textContent || "").replace(/\s+/g," ").trim().slice(0,800) }));
    if (gate.securePay) addFailure("authorization-regression", `non-authorized product ${ineligible} incorrectly exposes Stripe CTA`);
    if (!/availability confirmation|need a quick current-availability check|no items to checkout/i.test(gate.text)) addFailure("authorization-regression", `non-authorized product ${ineligible} lacks safe availability state: ${gate.text}`);
    else addPass(`authorization-regression blocked ${ineligible}`);
  }
  await page.close();
  await context.close();
}

await browser.close();
console.log("=== OMNI TERRAIN RESPONSIVE BROWSER AUDIT ===");
console.log(`PASS checks: ${passes.length}`);
if (warnings.length) {
  console.log(`WARNINGS: ${warnings.length}`);
  for (const item of warnings.slice(0,40)) console.log(`WARN ${item.key}: ${item.detail}`);
}
if (failures.length) {
  console.log(`FAILURES: ${failures.length}`);
  for (const item of failures) console.log(`FAIL ${item.key}: ${item.detail}`);
  process.exit(1);
}
console.log("RESULT = PASS");