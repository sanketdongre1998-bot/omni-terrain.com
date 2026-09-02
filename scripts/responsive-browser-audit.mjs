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
  "index.html",
  "deals.html",
  "us-catalogue.html",
  "automotive.html",
  "marine.html",
  "rv.html",
  "us-husky-towing-81147.html",
  "us-husky-towing-33055.html",
  "us-husky-towing-81148.html",
  "us-bilstein-24-066464.html",
  "cart.html",
  "checkout.html",
  "contact-and-order-help.html",
  "shipping-delivery-policy.html",
  "returns-refunds-policy.html",
];

const failures = [];
const warnings = [];
const pass = [];
const seen = new Set();

function addFailure(key, detail) {
  const fingerprint = `${key}::${detail}`;
  if (seen.has(fingerprint)) return;
  seen.add(fingerprint);
  failures.push({ key, detail });
}
function addWarning(key, detail) { warnings.push({ key, detail }); }
function addPass(detail) { pass.push(detail); }

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
      if (/\/(cart|checkout)\.html$/.test(location.pathname)) {
        localStorage.setItem("omniTerrainUsCart", JSON.stringify([{ id: "HUS33055", quantity: 2 }]));
      }
      if (/\/checkout\.html$/.test(location.pathname)) {
        localStorage.setItem("omniTerrainUsCoupon", "OMNI5");
      }
    } catch (_) {}
  });

  for (const route of routes) {
    const page = await context.newPage();
    const key = `${vp.name}/${route}`;
    const pageErrors = [];
    const localHttpErrors = [];

    page.on("pageerror", err => pageErrors.push(String(err?.message || err)));
    page.on("response", response => {
      try {
        const u = new URL(response.url());
        if (u.origin === new URL(BASE).origin && response.status() >= 400) {
          localHttpErrors.push(`${response.status()} ${u.pathname}`);
        }
      } catch (_) {}
    });

    try {
      await page.goto(`${BASE}/${route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(route === "deals.html" ? 1800 : 900);

      const snapshot = await page.evaluate(({ mobile }) => {
        const visible = el => {
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity || 1) > 0 && r.width > 0 && r.height > 0;
        };
        const rect = el => {
          const r = el.getBoundingClientRect();
          return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) };
        };
        const overflowers = [...document.querySelectorAll("body *")].filter(el => {
          if (!visible(el)) return false;
          const r = el.getBoundingClientRect();
          if (r.position === "fixed") return false;
          return r.right > innerWidth + 2 || r.left < -2;
        }).slice(0, 12).map(el => ({ tag: el.tagName, cls: String(el.className || "").slice(0,120), id: el.id || "", ...rect(el) }));

        const duplicateIds = [...document.querySelectorAll("[id]")].map(el => el.id).filter(Boolean).filter((id, i, arr) => arr.indexOf(id) !== i);
        const badImages = [...document.images].filter(img => img.complete && img.naturalWidth === 0 && !String(img.src).startsWith("data:")).slice(0, 8).map(img => img.currentSrc || img.src);
        const clippedControls = [...document.querySelectorAll("button,.ot-primary-btn,.ot-secondary-btn,.ot-live-button,.ot-display-action,.ot-growth-cta,.ot-deal-button,.ot-site-cart,.ot-site-menu")]
          .filter(visible).filter(el => el.scrollWidth > el.clientWidth + 3 || el.scrollHeight > el.clientHeight + 3)
          .slice(0, 10).map(el => ({ text: (el.textContent || "").trim().slice(0,70), ...rect(el) }));
        const tinyPrimaryControls = mobile ? [...document.querySelectorAll("button,.ot-primary-btn,.ot-secondary-btn,.ot-live-button,.ot-display-action,.ot-growth-cta,.ot-deal-button,.ot-site-cart,.ot-site-menu")]
          .filter(visible).filter(el => {
            const r = el.getBoundingClientRect();
            return r.height < 40 || r.width < 40;
          }).slice(0, 10).map(el => ({ text: (el.textContent || "").trim().slice(0,70), ...rect(el) })) : [];

        const brand = document.querySelector(".ot-site-brand");
        const actions = document.querySelector(".ot-site-actions");
        const headerOverlap = brand && actions && visible(brand) && visible(actions) ? (() => {
          const a = brand.getBoundingClientRect(), b = actions.getBoundingClientRect();
          return a.right > b.left - 4;
        })() : false;

        const fixedBottom = [...document.querySelectorAll(".ot-site-mobile-bar,.mobile-store-bar")].filter(visible).map(rect);
        const main = document.querySelector("main");
        const mainRect = main && visible(main) ? rect(main) : null;
        return {
          innerWidth,
          bodyScrollWidth: document.body.scrollWidth,
          docScrollWidth: document.documentElement.scrollWidth,
          overflowers,
          duplicateIds: [...new Set(duplicateIds)].slice(0,10),
          badImages,
          clippedControls,
          tinyPrimaryControls,
          headerOverlap,
          fixedBottom,
          mainRect,
          dealsCount: document.querySelectorAll(".ot-deal-card").length,
          dealsLoading: Boolean(document.querySelector("#otDealsGrid") && /loading featured deals/i.test(document.querySelector("#otDealsGrid")?.textContent || "")),
          productLayoutCols: document.querySelector(".product-layout") ? getComputedStyle(document.querySelector(".product-layout")).gridTemplateColumns : "",
          productVisualRect: document.querySelector(".product-visual") ? rect(document.querySelector(".product-visual")) : null,
          mobileMenuVisible: [document.querySelector("#otSiteMenu"), document.querySelector("#menuToggle")].some(node => node && visible(node)),
          securePayVisible: Boolean(document.querySelector("#otSecurePay") && visible(document.querySelector("#otSecurePay"))),
          promoBoxVisible: Boolean(document.querySelector(".ot-promo-box") && visible(document.querySelector(".ot-promo-box"))),
          checkoutPromoVisible: Boolean(document.querySelector(".ot-checkout-promo") && visible(document.querySelector(".ot-checkout-promo"))),
          authTriggerCount: document.querySelectorAll("[data-ot-auth-trigger]").length,
        };
      }, { mobile: vp.mobile });

      if (snapshot.docScrollWidth > vp.width + 2 || snapshot.bodyScrollWidth > vp.width + 2) {
        addFailure(key, `horizontal overflow doc=${snapshot.docScrollWidth} body=${snapshot.bodyScrollWidth} viewport=${vp.width}; elements=${JSON.stringify(snapshot.overflowers)}`);
      }
      if (snapshot.headerOverlap) addFailure(key, "header brand overlaps cart/menu actions");
      if (snapshot.clippedControls.length) addFailure(key, `clipped controls ${JSON.stringify(snapshot.clippedControls)}`);
      if (snapshot.tinyPrimaryControls.length) addFailure(key, `mobile primary tap targets under 40px ${JSON.stringify(snapshot.tinyPrimaryControls)}`);
      if (snapshot.duplicateIds.length) addFailure(key, `duplicate DOM ids ${snapshot.duplicateIds.join(",")}`);
      if (snapshot.authTriggerCount < 2) addFailure(key, `expected desktop and mobile account triggers, got ${snapshot.authTriggerCount}`);
      if (pageErrors.length) addFailure(key, `page errors ${pageErrors.join(" | ")}`);
      if (localHttpErrors.length) addFailure(key, `same-origin HTTP errors ${[...new Set(localHttpErrors)].join(" | ")}`);

      if (route === "deals.html") {
        if (snapshot.dealsCount !== 7) addFailure(key, `expected 7 deal cards, got ${snapshot.dealsCount}`);
        if (snapshot.dealsLoading) addFailure(key, "deals page stuck on loading state");
      }
      if (/^us-.*\.html$/.test(route) && route !== "us-catalogue.html" && vp.width <= 760) {
        if (snapshot.productLayoutCols && snapshot.productLayoutCols.split(" ").length > 1) addFailure(key, `mobile PDP still multi-column: ${snapshot.productLayoutCols}`);
        if (snapshot.productVisualRect && snapshot.productVisualRect.width > vp.width + 1) addFailure(key, `PDP image panel wider than viewport: ${snapshot.productVisualRect.width}`);
      }
      if (route === "cart.html" && !snapshot.promoBoxVisible) addFailure(key, "OMNI5 promo box missing from populated cart");
      if (route === "checkout.html") {
        if (!snapshot.securePayVisible) addFailure(key, "authorized cart does not expose secure Stripe CTA");
        if (!snapshot.checkoutPromoVisible) addFailure(key, "saved OMNI5 code not surfaced on checkout review");
      }

      if (vp.width <= 860 && snapshot.mobileMenuVisible) {
        const menu = page.locator("#otSiteMenu,#menuToggle").first();
        if (await menu.count()) {
          await menu.click();
          await page.waitForTimeout(120);
          const menuCheck = await page.evaluate(() => {
            const nav = document.querySelector("#otSiteMobileNav,#mobileNav");
            const button = document.querySelector("#otSiteMenu,#menuToggle");
            if (!nav || !button) return { ok:false, reason:"missing nodes" };
            const r = nav.getBoundingClientRect();
            return { ok: nav.classList.contains("open") && button.getAttribute("aria-expanded") === "true" && r.left >= -2 && r.right <= innerWidth + 2, left:r.left, right:r.right, width:innerWidth };
          });
          if (!menuCheck.ok) addFailure(key, `mobile menu failed/open overflow ${JSON.stringify(menuCheck)}`);
        }
      }

      if (route === "index.html") {
        try {
          await page.waitForFunction(() => Boolean(window.__OMNI_FIREBASE_AUTH__), null, { timeout: 10000 });
          const trigger = page.locator("[data-ot-auth-trigger]:visible").first();
          if (await trigger.count() !== 1) throw new Error("no visible account trigger");
          await trigger.click();
          await page.waitForTimeout(120);
          const authCheck = await page.evaluate(() => {
            const overlay = document.querySelector("#otAuthOverlay");
            const button = document.querySelector("[data-ot-google-signin]");
            return {
              open: Boolean(overlay && !overlay.hidden),
              googleButton: Boolean(button && /continue with google/i.test(button.textContent || "")),
              privacyLink: Boolean(document.querySelector('#otAuthDialog a[href="privacy-policy.html"]')),
            };
          });
          if (!authCheck.open || !authCheck.googleButton || !authCheck.privacyLink) addFailure(key, `Google account dialog failed ${JSON.stringify(authCheck)}`);
          else addPass(`${key} Google account dialog checked`);
          await page.locator("[data-ot-auth-close]").click();
        } catch (error) {
          addFailure(key, `Google account UI exception: ${error?.message || error}`);
        }
      }

      if (snapshot.badImages.length) addWarning(key, `images unavailable in QA runtime: ${snapshot.badImages.slice(0,3).join(" | ")}`);
      addPass(`${key} geometry checked`);
    } catch (error) {
      addFailure(key, `navigation/audit exception: ${error?.message || error}`);
    } finally {
      await page.close();
    }
  }

  await context.close();
}

// Authorization regression: pick a catalogue product not present in the real checkout registry.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/us-catalogue.html`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(700);
  const ids = await page.evaluate(() => {
    try { return typeof OMNI_US_PRODUCTS !== "undefined" && Array.isArray(OMNI_US_PRODUCTS) ? OMNI_US_PRODUCTS.map(p => String(p.id || "")).filter(Boolean) : []; }
    catch (_) { return []; }
  });
  const ineligible = ids.find(id => !enabledIds.has(id));
  if (!ineligible) {
    addFailure("authorization-regression", "could not find a non-authorized catalogue product for browser regression test");
  } else {
    await page.evaluate(id => {
      localStorage.setItem("omniTerrainUsCart", JSON.stringify([{ id, quantity: 1 }]));
      localStorage.removeItem("omniTerrainUsCoupon");
    }, ineligible);
    await page.goto(`${BASE}/checkout.html?qa=ineligible`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1200);
    const gate = await page.evaluate(() => ({
      securePay: Boolean(document.querySelector("#otSecurePay")),
      text: (document.querySelector("main")?.textContent || "").replace(/\s+/g," ").trim().slice(0,800),
    }));
    if (gate.securePay) addFailure("authorization-regression", `non-authorized product ${ineligible} incorrectly exposes Stripe CTA`);
    if (!/availability confirmation|need a quick current-availability check|no items to checkout/i.test(gate.text)) {
      addFailure("authorization-regression", `non-authorized product ${ineligible} lacks safe availability state: ${gate.text}`);
    } else addPass(`authorization-regression blocked ${ineligible}`);
  }
  await context.close();
}

await browser.close();

console.log("=== OMNI TERRAIN RESPONSIVE BROWSER AUDIT ===");
console.log(`PASS checks: ${pass.length}`);
if (warnings.length) {
  console.log(`WARNINGS: ${warnings.length}`);
  for (const item of warnings.slice(0, 30)) console.log(`WARN ${item.key}: ${item.detail}`);
}
if (failures.length) {
  console.log(`FAILURES: ${failures.length}`);
  for (const item of failures) console.log(`FAIL ${item.key}: ${item.detail}`);
  process.exit(1);
}
console.log("RESULT = PASS");
