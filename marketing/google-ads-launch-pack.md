# Omni Terrain — Google Ads Search Launch Pack

Status: **DRAFT / DO NOT ENABLE YET**

Campaign working name: `US | Search | High-Intent MPN Test`

## Locked first-week budget

- **$50 TOTAL for the first 7-day test.**
- Use a **Campaign total budget** with a 7-day start/end date when available so the campaign cannot exceed the $50 test cap.
- Do not substitute `$30/day`, `$7.14/day`, or any other daily budget for this locked first-week test without explicit approval.

## Store depth vs paid scope

The storefront can remain broad for customer trust, discovery and SEO. Paid traffic must stay on a **very small, verified subset**. Catalogue size is not the ad-product count.

## Current seven-product draft — NOT approved for spend

The seven products used in the current draft RSA/keyword CSVs were assembled as a technical ad-pack test. They are **not the final paid-search SKU set**. Fresh market checks show the current set is not clean enough to spend on at current prices.

| SKU | Brand / MPN | Omni price | Market finding | Paid status |
|---|---|---:|---|---|
| HUS81147 | HUSKY 81147 | $126.26 | Walmart currently shows $93.77 with free shipping | EXCLUDE at current price |
| HUS81148 | HUSKY 81148 | $158.28 | Walmart currently shows $123.99 with free shipping | EXCLUDE at current price |
| CCIN9010F | Coast2Coast IWCN9010F | $239.00 | AutoZone currently shows $126.99; other market offers are also materially lower | EXCLUDE at current price |
| CCIN8010F | Coast2Coast IWCN8010F | $219.00 | Walmart Business currently shows $93.47; AutoZone shows $133.99 | EXCLUDE at current price |
| CCIIMP103X | Coast2Coast IWCIMP103X | $180.65 | AutoZone currently shows $132.99 | HOLD — reprice/economics review only |
| A1360828HD | Air Lift 60828HD | $213.99 | Air Lift official price is $213.99 | LOWER PRIORITY — parity, no price edge |
| B5224066464 | Bilstein 24-066464 | $136.97 | JEGS currently shows $123.00 | EXCLUDE at current price |

**Do not enable the existing 7-product CSVs.** Keep all rows paused until a new final 3–5 SKU paid set passes the complete gate below.

## Complete ad-product gate

A product is eligible for paid search only when all of these are true at the same time:

1. live registry `enabled === true`;
2. supplier / website authorization verified;
3. supplier API currently ORDERABLE;
4. storefront stock is checkout-ready and in stock;
5. current selling price is positive;
6. shipping promise is currently valid;
7. no MAP / channel restriction blocks the offer;
8. **current delivered price is competitive against exact-MPN U.S. retailers / marketplaces**;
9. **supplier cost + shipping + Stripe fees + return reserve + risk reserve + expected ad cost still leave acceptable contribution**;
10. landing page, image, MPN, fitment/application text and checkout all work on mobile and desktop.

The existing CI validator covers the technical live/checkout portion. It does **not** prove market competitiveness or paid-ad profitability; those checks must be completed before any ad group is enabled.

## Correct first-test campaign settings

- Campaign type: **Search**.
- Goal: Sales / Purchase measurement.
- Network: **Google Search only** for the first controlled test; Search Partners OFF.
- Location: United States.
- Location option: people **in or regularly in** the targeted United States locations; do not use interest-only expansion.
- Language: English.
- Budget: **$50 campaign total for 7 days**.
- Keywords: exact MPN + very tight phrase intent only. No broad match in week 1.
- Auto-tagging: ON.
- Initial paid SKU count: **3–5 maximum**, preferably 3–4 if query volume is sufficient.

## Bidding for the $50 test

Do **not** default this zero-history $50 test to Maximize Conversions simply because Purchase tracking exists.

For the first controlled test:

- use **Maximize Clicks with a maximum CPC bid limit**, or Manual CPC if account controls make that cleaner;
- set the CPC ceiling from real Google keyword estimates plus each SKU's allowable ad-cost headroom — **do not guess a generic CPC cap**;
- keep `Purchase` as the primary sales conversion;
- keep `view_item`, `add_to_cart`, and `begin_checkout` as secondary/observation signals initially;
- consider conversion-based Smart Bidding only after clean purchase data is actually accumulating.

## Ad copy rules

Never advertise a crossed-out price, `% off`, `save $X`, lowest-price claim, price-match claim, free-return claim or other promotional comparison unless the exact claim is supported by a current, defensible reference price/policy.

Safe launch value propositions:

1. Exact brand + MPN relevance.
2. Clear current online price.
3. Current online availability.
4. Secure U.S. checkout.
5. Product / fitment support before ordering.
6. Free standard shipping only where the current product offer genuinely includes it.

## Current site tracking plumbing

The repository already contains useful ecommerce event plumbing:

- `assets/ad-readiness.js` captures first/last attribution including UTM parameters, `gclid`, `gbraid`, `wbraid`, and `gad_source`.
- `assets/analytics-events.js` pushes `view_item`, `add_to_cart`, `begin_checkout`, `view_promotion`, and `select_promotion` into `window.dataLayer`.
- `assets/us-order-success.js` verifies the Stripe Checkout session server-side before pushing the `purchase` event with transaction ID, revenue, currency, items and attribution.

### Required before any spend

The repository still needs the actual Google tag / GTM connection before Google Ads can receive those purchase conversions.

Before enabling a campaign:

1. verify the correct Google Ads account and billing/business identity — do not assume an email/account from prior drafts;
2. create/select the Google Ads `Purchase` conversion action (or correctly linked GA4 purchase conversion);
3. connect the actual Google tag or GTM container to `omni-terrain.com`;
4. map the verified purchase event with dynamic value, currency and unique transaction ID;
5. complete one controlled test checkout and confirm exactly one Purchase conversion fires with the correct value;
6. confirm the final paid SKUs still pass live stock/auth/MAP/market/economics gates;
7. only then enable the final campaign.

## First-week operating rule

- Review search terms and spend daily.
- Add clearly irrelevant searches to negatives.
- Do not expand into broad generic category terms on a $50 test.
- Pause an SKU immediately if stock, authorization, MAP, shipping, market price or economics no longer pass.
- Judge the first week on qualified traffic, checkout behavior, purchases and contribution — not clicks alone.

## Draft files currently in repo

- `google-ads-search-rsa.csv`
- `google-ads-keywords.csv`
- `google-ads-negative-keywords.csv`
- `google-ads-assets.csv`

These remain **draft/import scaffolding**, not authorization to spend. Final RSA/keyword files should be regenerated once the 3–5 paid SKUs are selected from market-verified winners.
