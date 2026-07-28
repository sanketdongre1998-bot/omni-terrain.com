const OMNI_SHIELD_PRODUCTS = (() => {
  "use strict";

  const asset = (name) => `assets/shield-live/${name}`;
  const verifiedOn = "2026-07-28";
  const supplierSources = {
    fridge: "https://shieldautocare.com/product/cool-mate-45l-70l-solar-powered-ac-dc-fridge-campervan-off-grid-refrigerator/",
    window: "https://shieldautocare.com/product/frameless-rubber-sealed-campervan-cassette-window-with-blackout-blind-flynet-screen/",
    blind: "https://shieldautocare.com/product/cassette-campervan-blinds-with-integrated-blackout-blind-fly-screen-black-white-beige/"
  };

  const fridgeShared = [
    asset("shield-autocare-coolmate-solar-powered-12v-fridge-campervan-caravan-motorhome-1000x1000.webp"),
    asset("coolmate-solar-12v-fridge-campervan-2-1000x1000.webp"),
    asset("coolmate-solar-12v-fridge-campervan-3-1000x1000.webp"),
    asset("coolmate-solar-12v-fridge-campervan-4-1000x1000.webp"),
    asset("coolmate-solar-12v-fridge-campervan-power-1000x1000.webp")
  ];
  const windowImages = [
    asset("frameless-cassette-window-campervan-caravan-motorhome-1-1000x1000.webp"),
    asset("frameless-cassette-window-campervan-caravan-motorhome-blind-800x800-1.webp"),
    asset("frameless-cassette-window-campervan-caravan-motorhome-5-1000x1000.webp"),
    asset("frameless-cassette-window-campervan-caravan-motorhome-4-1000x1000.webp"),
    asset("frameless-cassette-window-campervan-caravan-motorhome-3-1000x1000.webp"),
    asset("frameless-cassette-window-campervan-caravan-motorhome-2-1000x1000.webp")
  ];
  const blindImages = {
    White: [
      asset("white-camper-van-blind-built-in-black-out-blind-1000x1000.webp"),
      asset("white-camper-van-blind-fly-net-black-out-blind-integrated-1000x1000.webp"),
      asset("white-camper-van-blind-built-in-fly-net-1000x1000.webp"),
      asset("campervan-blinds-black-out-fly-net-white-black-beige.webp")
    ],
    Black: [
      asset("black-campervan-blind-black-out-blind-1000x1000.webp"),
      asset("black-campervan-blind-fly-net-1000x1000.webp"),
      asset("black-campervan-blind-cassette-frame-1000x1000.webp"),
      asset("campervan-blinds-black-out-fly-net-white-black-beige.webp")
    ],
    Beige: [
      asset("smoke-beige-campervan-blind-integrated-black-out-blind-1000x1000.webp"),
      asset("smoke-beige-campervan-blind-cassette-1000x1000.webp"),
      asset("smoke-beige-campervan-blind-built-in-fly-net-1000x1000.webp"),
      asset("campervan-blinds-black-out-fly-net-white-black-beige.webp")
    ]
  };

  function base(record) {
    return {
      decision: "LIST",
      verifiedOn,
      availability: "Available on eBay UK",
      itemCondition: "New",
      currency: "GBP",
      ebayUrl: `https://www.ebay.co.uk/itm/${record.ebayItemId}`,
      ...record
    };
  }

  function fridge(colour, price, itemId) {
    const lower = colour.toLowerCase();
    const sku = `COOL.MATE.SOLAR.AC.DC.70L.${colour === "Black" ? "BLCK" : "SILV"}`;
    return base({
      id: `cool-mate-70l-fridge-${lower}`,
      slug: `uk-cool-mate-70l-fridge-${lower}.html`,
      title: `Cool Mate 70L AC/DC Compressor Fridge – ${colour}`,
      ebayTitle: `Cool Mate 70L Solar 12V 24V AC/DC Compressor Fridge Campervan ${colour}`,
      brand: "Cool Mate",
      mpn: sku,
      category: "Campervan Refrigeration",
      segment: "fridges",
      price,
      ebayItemId: itemId,
      description: `A 69.5-litre gross-capacity compressor fridge for suitable campervan, motorhome and off-grid installations, finished in ${lower}.`,
      specs: [
        ["Gross / net capacity", "69.5 L / 67.5 L"],
        ["Dimensions", "460 W × 460 D × 820 H mm"],
        ["Weight", "25 kg"],
        ["Power input", "12V / 24V DC; 220–240V AC"],
        ["Current draw", "3.5A at 12V DC"],
        ["Temperature range", "+10°C to -18°C"],
        ["Refrigerant", "R600a, 17 g"],
        ["Door", "Single reversible door"],
        ["Colour", colour]
      ],
      fitment: "Universal leisure-vehicle appliance by space and electrical configuration. Confirm ventilation, clearances, power supply and installation method before purchase.",
      included: "One Cool Mate 70L fridge in the selected colour.",
      supplierSource: supplierSources.fridge,
      images: [
        asset(`coolmate-solar-12v-fridge-campervan-${lower}-1000x1000.webp`),
        ...fridgeShared
      ]
    });
  }

  function windowProduct(size, price, itemId) {
    const slugSize = size.replace(" × ", "x");
    const sku = `FRMLS.${slugSize}`;
    return base({
      id: `frameless-window-${slugSize}`,
      slug: `uk-shield-frameless-window-${slugSize}.html`,
      title: `Shield Autocare ${size} mm Frameless Campervan Window`,
      ebayTitle: `${slugSize}mm Frameless Campervan Caravan Window Blackout Blind Flyscreen Motorhome`,
      brand: "Shield Autocare",
      mpn: sku,
      category: "Campervan Windows",
      segment: "windows",
      price,
      ebayItemId: itemId,
      description: `A frameless push-out cassette window in the ${size} mm cut-out size, with an integrated blackout blind and flyscreen.`,
      specs: [
        ["Cut-out size", `${size} mm`],
        ["Corner radius", "R70"],
        ["Glazing", "UV-resistant acrylic double glazing"],
        ["Opening", "Push-out with two locking ventilation positions"],
        ["Blind and screen", "Integrated blackout blind and flyscreen"],
        ["Seal", "Rubber-sealed weatherproof design"],
        ["Hinges", "Heavy-duty aluminium"],
        ["Road-use certification", "E-Mark certified (supplier stated)"]
      ],
      fitment: "Universal by measured aperture, wall construction and installation clearances; not vehicle-specific. Confirm the physical product and template before cutting.",
      included: "One frameless cassette window with integrated blackout blind and flyscreen.",
      supplierSource: supplierSources.window,
      images: windowImages
    });
  }

  function blind(size, colour, price, itemId) {
    const slugSize = size.replace(" × ", "x");
    const colourCode = { White: "WHTE", Black: "BLCK", Beige: "BEIGE" }[colour];
    const sku = `BLIND.${slugSize}.${colourCode}`;
    const [width, height] = size.split(" × ").map(Number);
    return base({
      id: `cassette-blind-${slugSize}-${colour.toLowerCase()}`,
      slug: `uk-shield-cassette-blind-${slugSize}-${colour.toLowerCase()}.html`,
      title: `Shield Autocare ${size} mm Cassette Blind & Flyscreen – ${colour}`,
      ebayTitle: `${slugSize}mm ${colour} Cassette Blackout Blind Flyscreen Campervan Caravan Motorhome`,
      brand: "Shield Autocare",
      mpn: sku,
      category: "Campervan Blinds & Flyscreens",
      segment: "blinds",
      price,
      ebayItemId: itemId,
      description: `A ${colour.toLowerCase()} cassette unit for compatible campervan, motorhome, caravan and horsebox windows, combining a blackout blind and removable flyscreen.`,
      specs: [
        ["Cut-hole size", `${size} mm`],
        ["Overall size", `${width + 28} × ${height + 28} mm`],
        ["Frame", "38 mm with 40 mm corner caps"],
        ["Functions", "Integrated blackout blind and removable flyscreen"],
        ["Mounting", "Window-frame mounted"],
        ["Colour", colour]
      ],
      fitment: "Universal by measured aperture, not by vehicle model. Confirm the cut-hole, overall dimensions and window-frame compatibility before purchase.",
      included: "One cassette blackout blind and flyscreen unit in the selected size and colour.",
      supplierSource: supplierSources.blind,
      images: blindImages[colour]
    });
  }

  return [
    fridge("Black", 479.95, "236961146598"),
    fridge("Silver", 489.95, "236961146599"),
    windowProduct("500 × 300", 194.95, "236961146612"),
    windowProduct("500 × 450", 244.95, "236961146594"),
    windowProduct("700 × 500", 304.95, "236961146616"),
    windowProduct("700 × 550", 324.95, "236961146608"),
    windowProduct("720 × 360", 274.95, "236961146600"),
    windowProduct("900 × 500", 335.95, "236961146602"),
    blind("1000 × 800", "White", 219.95, "236961146603"),
    blind("1000 × 800", "Black", 219.95, "236961146607"),
    blind("1000 × 800", "Beige", 219.95, "236961146610"),
    blind("1100 × 450", "White", 179.95, "236961146601"),
    blind("1100 × 450", "Black", 179.95, "236961146604"),
    blind("1100 × 450", "Beige", 179.95, "236961146609"),
    blind("1100 × 550", "Black", 189.95, "236961146606"),
    blind("1100 × 550", "Beige", 189.95, "236961146596"),
    blind("1200 × 500", "White", 199.95, "236961146613"),
    blind("1200 × 500", "Black", 199.95, "236961146597"),
    blind("1200 × 500", "Beige", 199.95, "236961146611"),
    blind("1450 × 550", "White", 229.95, "236961146614")
  ];
})();

if (typeof module !== "undefined" && module.exports) module.exports = OMNI_SHIELD_PRODUCTS;
if (typeof window !== "undefined") window.OMNI_SHIELD_PRODUCTS = OMNI_SHIELD_PRODUCTS;
