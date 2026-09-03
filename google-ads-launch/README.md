# Omni Terrain — $50 / 7-Day Google Search Launch

Prepared: 2026-09-04

## Locked campaign

- Campaign name: `OT_US_Search_Featured_7D_50`
- Campaign type: **Search**
- Geography: **United States**
- Location option: **Presence — people in or regularly in the targeted locations**
- Language: **English**
- Network: **Google Search only**
- Google Search Partners: **OFF**
- Display Network: **OFF**
- AI Max for Search: **OFF**
- Text customization / automatically generated text: **OFF**
- Final URL expansion: **OFF**
- Budget type: **Campaign total budget**
- Total budget: **$50.00 USD hard cap**
- Start date: **2026-09-04**
- End date: **2026-09-10**
- Bid strategy: **Maximize Clicks**
- Maximum CPC bid limit: **$1.50**
- Ad rotation: Optimize
- Auto-tagging: ON
- Final URL suffix: `utm_source=google&utm_medium=cpc&utm_campaign=ot_us_search_featured_7d_50&utm_term={keyword}&utm_content={adgroupid}-{creative}`

### Why campaign-total budget

Google Ads now supports campaign-total budgets for Search campaigns with fixed start/end dates. It is the correct setting for this test because it is a hard total cap: Google says the advertiser will not be charged more than the campaign-total amount. Do **not** create this campaign with an average daily budget, because the budget type cannot be switched after the campaign is created.

## Critical controls

1. **Do not enable AI Max.** New Search campaigns may have AI Max selected by default. AI Max can broaden matching and, when Final URL Expansion is active, can send users to other relevant URLs on the domain. This test intentionally restricts landing pages to the seven approved PDPs.
2. **Do not enable Search Partners.** Search partners are included by default on Search campaigns; uncheck them for this controlled test.
3. **Use Presence location targeting**, not the default Presence-or-Interest option, so the test focuses on people likely to be physically in the United States.
4. **Do not advertise OMNI5 on these seven featured products.** The live checkout rule excludes featured deals from OMNI5.
5. **No broad-match keywords for this first $50 test.** Use the exact/phrase set in `editor-bulk-import.csv`.
6. **No homepage, category-page, catalogue-page or policy-page ad landing URLs.** Each RSA uses its exact approved PDP.

## Seven ad groups / landing pages

| Ad group | Product | Current price | Final URL |
|---|---|---:|---|
| HUS81147 | HUSKY TOWING 81147 — Hitch Mounted 4 Bike Rack | $126.26 | https://omni-terrain.com/us-husky-towing-81147.html |
| HUS81148 | HUSKY TOWING 81148 — Cargo Carrier 500LBS | $158.28 | https://omni-terrain.com/us-husky-towing-81148.html |
| CCIN9010F | COAST2COAST IWCN9010F — 2019-2025 RAM 3500 front 17in simulator | $239.00 | https://omni-terrain.com/us-coast2coast-iwcn9010f.html |
| CCIN8010F | COAST2COAST IWCN8010F — 2003-2018 RAM 3500 front 17in simulator | $219.00 | https://omni-terrain.com/us-coast2coast-iwcn8010f.html |
| CCIIMP103X | COAST2COAST IWCIMP103X — 2022-2025 Tundra 18in chrome wheel skin | $180.65 | https://omni-terrain.com/us-coast2coast-iwcimp103x.html |
| A1360828HD | AIR LIFT 60828HD — RAM 1500 AL1000HD | $213.99 | https://omni-terrain.com/us-air-lift-60828hd.html |
| B5224066464 | BILSTEIN 24-066464 — 5100 for RAM 2500/3500 with 4in lift | $136.97 | https://omni-terrain.com/us-bilstein-24-066464.html |

Prices are shown here only as a launch QA reference. The RSA copy intentionally does not hard-code prices so an ad does not become inaccurate if the canonical storefront price changes.

## Fastest publish workflow

### 1. Create the campaign shell first

In Google Ads or Google Ads Editor 2.12+, create a **new Search campaign** named exactly `OT_US_Search_Featured_7D_50` with the locked campaign settings above. Select **Campaign total budget = $50** during creation.

Do not create/import a daily-budget campaign first: Google does not allow changing an existing campaign from average-daily budget to campaign-total budget.

### 2. Import the bulk file

In Google Ads Editor:

`Account → Import → From file…` and select `editor-bulk-import.csv`.

The expected proposal is:

- 7 ad groups
- 28 tightly controlled exact/phrase keywords
- 7 responsive search ads

Review the import before posting. Reject any unexpected campaign creation, broad-match keyword, extra landing URL, Display network setting or Search Partner setting.

### 3. Add campaign negative keywords

Paste the contents of `campaign-negative-keywords.txt` as **campaign-level negative keywords**.

### 4. Final pre-publish check

Before clicking Post/Publish, confirm all of these are true:

- Campaign total budget = **$50.00**, not $50/day
- Start/end = **2026-09-04 → 2026-09-10**
- Google Search only
- Search Partners OFF
- Display OFF
- United States + Presence-only location option
- AI Max OFF
- Final URL expansion OFF
- Maximize Clicks + $1.50 max CPC bid limit
- 7 ad groups
- 28 keywords, Exact/Phrase only
- 7 RSAs
- Every ad Final URL is one of the seven PDPs above
- No OMNI5 ad copy

## Tracking status

The storefront already captures `gclid`, `gbraid`, `wbraid` and UTM attribution locally and emits ecommerce-style `dataLayer` events including product views, add-to-cart, checkout and verified purchase events. For this first low-budget test the bid strategy is Maximize Clicks, so the campaign can launch without conversion-based Smart Bidding. Google Ads/GA4 conversion linking should still be configured in the advertising account when account access is available.

## Official references checked for this launch

- Campaign total budgets: https://support.google.com/google-ads/answer/10486938
- Search network / Search Partners: https://support.google.com/google-ads/answer/1722047
- Keyword match types: https://support.google.com/google-ads/answer/7478529
- Location Presence setting: https://support.google.com/google-ads/answer/9376662
- AI Max for Search setup: https://support.google.com/google-ads/answer/15909989
- AI Max / Final URL expansion behavior: https://support.google.com/google-ads/answer/15910187
- Google Ads Editor CSV import: https://support.google.com/google-ads/editor/answer/56368
- Google Ads Editor CSV columns: https://support.google.com/google-ads/editor/answer/57747
- RSA character limits: https://support.google.com/google-ads/answer/12159014
