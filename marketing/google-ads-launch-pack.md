# Omni Terrain — Google Ads Search Launch Pack

Status: **UPLOAD READY / KEEP PAUSED UNTIL CONVERSION TAG TEST PASSES**

Campaign: `US | Search | Featured Auto | MPN Intent`

## Launch scope

Initial paid traffic is deliberately limited to the seven current featured products below. This follows the Omni Terrain rule that catalogue depth and paid-ad scope are separate: the store may list many products, while ads only target a small verified subset.

| SKU | Brand / MPN | Landing page | Live registry price | Featured shipping |
|---|---|---|---:|---|
| HUS81147 | HUSKY Towing 81147 | `/us-husky-towing-81147.html` | $126.26 | Included |
| HUS81148 | HUSKY Towing 81148 | `/us-husky-towing-81148.html` | $158.28 | Included |
| CCIN9010F | Coast2Coast IWCN9010F | `/us-coast2coast-iwcn9010f.html` | $239.00 | Included |
| CCIN8010F | Coast2Coast IWCN8010F | `/us-coast2coast-iwcn8010f.html` | $219.00 | Included |
| CCIIMP103X | Coast2Coast IWCIMP103X | `/us-coast2coast-iwcimp103x.html` | $180.65 | Included |
| A1360828HD | Air Lift 60828HD | `/us-air-lift-60828hd.html` | $213.99 | Included |
| B5224066464 | Bilstein 24-066464 | `/us-bilstein-24-066464.html` | $136.97 | Included |

**Do not hard-code these prices in ad copy.** The live authorization registry remains the storefront source of truth and prices/availability can change.

Marine is not included in the first paid campaign. The Marine storefront now surfaces its existing strictly checkout-ready inventory across pagination, but Marine ads should wait until the exact Marine SKUs have their own margin/market/ad review.

## Files

- `google-ads-search-rsa.csv` — 2 paused responsive search ads per product ad group.
- `google-ads-keywords.csv` — exact + phrase high-intent MPN/product keywords only.
- `google-ads-negative-keywords.csv` — conservative irrelevant-intent exclusions.
- `google-ads-assets.csv` — sitelinks, callouts and a brand structured snippet.

All ad and keyword rows are intentionally `Paused` to prevent accidental spend during import.

## Recommended campaign settings

- Campaign type: Search.
- Goal: Sales.
- Networks: Google Search only at launch. Turn Search Partners off for the first test.
- Locations: United States.
- Location option: people **in or regularly in** the targeted locations; do not use interest-only location expansion.
- Language: English.
- Budget: **$30/day total** for the first 7-day controlled test ($210 planned test spend).
- Bidding after conversion tracking is verified: **Maximize Conversions** with `Purchase` as the only primary sales conversion.
- Do not use broad match in the first launch. Start with the exact/phrase MPN intent already in the CSV.
- Auto-tagging: ON.
- Ad rotation/asset optimization: allow Google to combine RSA assets; no headline pinning unless a later policy or legal requirement makes it necessary.

## Ad copy strategy

The ads deliberately avoid fake discounts, fake crossed-out prices, unsupported superlatives, and price-match/free-return claims.

Primary customer value propositions:

1. Exact brand + MPN relevance.
2. Clear online pricing.
3. Check online availability.
4. Secure U.S. checkout.
5. Product / fitment support before ordering.
6. Free standard shipping on the seven current featured offers in the contiguous U.S.

`OMNI5` can remain an on-site regular-order promotion, but it is **not** used in the seven featured-product ads because featured shipping offers are excluded from stacking with that coupon.

## Current site tracking plumbing

The repo already has a useful ecommerce tracking layer:

- `assets/ad-readiness.js` captures first/last attribution including UTM parameters, `gclid`, `gbraid`, `wbraid`, and `gad_source`.
- `assets/analytics-events.js` pushes `view_item`, `add_to_cart`, `begin_checkout`, `view_promotion`, and `select_promotion` into `window.dataLayer`.
- `assets/us-order-success.js` verifies the Stripe Checkout session server-side before pushing the `purchase` event. Purchase events include transaction ID, revenue, currency, coupon, items and traffic attribution, and are locally deduplicated.

### One required account-side step before enabling spend

The repository currently does **not** contain an actual Google tag / Google Tag Manager container ID. `dataLayer` events by themselves do not send conversions to Google Ads.

Before campaign enablement:

1. Create/select the Google Ads Purchase conversion action (or linked GA4 purchase conversion).
2. Install/connect the actual Google tag or GTM container for `omni-terrain.com`.
3. Map the verified `purchase` dataLayer event as the primary Purchase conversion with dynamic value and currency.
4. Keep `view_item`, `add_to_cart`, and `begin_checkout` secondary/observation conversions initially so bidding is optimized to completed purchases rather than micro-conversions.
5. Use Tag Assistant / Google Ads diagnostics and complete one controlled test checkout to confirm exactly one purchase conversion fires with the Stripe transaction ID and correct value.
6. Only then change campaign/ad/keyword status from Paused to Enabled.

Do not send raw customer email, phone or address in ad URLs or plain-text analytics events. Enhanced conversions should be configured through Google's supported hashed first-party-data flow only after the Google tag/account is connected and consent/privacy handling is confirmed.

## Search-term control

First 7 days:

- Review Search terms daily.
- Add clearly irrelevant terms to negatives.
- Do not negative legitimate comparison/research terms solely because they mention another retailer; evaluate conversion behavior first.
- Keep exact MPN searches active even if volume is low.
- Expand only winning ad groups from exact into additional phrase terms.
- Broad match comes later only if purchase tracking is clean and the account has enough conversion data.

## Product safety gate for ads

Before enabling any ad group, and periodically while it is running, the SKU must still pass:

- live registry enabled;
- authorization verified;
- supplier/API orderable;
- stock status checkout-ready/in-stock;
- current price > 0;
- shipping offer still valid if the ad says free standard shipping;
- no new MAP/channel restriction;
- current economics still acceptable.

If a SKU fails the gate, pause that ad group immediately. Do not redirect a product-specific MPN ad to a generic category page just to keep spend running.

## Google Ads format validation used for this pack

Current Google Search RSA limits used here:

- up to 15 headlines;
- headline maximum 30 characters;
- up to 4 descriptions;
- description maximum 90 characters;
- path fields maximum 15 characters each.

The pack supplies two RSAs per ad group and uses direct product landing pages. Google Ads documentation also recommends multiple strong RSAs, keyword-relevant assets and unique/relevant landing URLs.

Official references checked during build:

- https://support.google.com/google-ads/answer/17092074
- https://support.google.com/google-ads/answer/7684791
- https://support.google.com/google-ads/answer/7478529
- https://support.google.com/google-ads/answer/13738234
- https://support.google.com/google-ads/answer/15712870

## Launch order

1. Import RSA CSV.
2. Import keyword CSV.
3. Add negative keywords.
4. Add sitelinks/callouts/snippet assets.
5. Set Search-only U.S. campaign settings and $30/day test budget.
6. Connect Google tag/GTM and verify Purchase conversion.
7. Preview all seven landing pages on desktop + mobile.
8. Confirm each SKU is still live/authorized/orderable.
9. Enable the campaign.
10. Review Search terms, spend, conversions and profit every day during the first week.
