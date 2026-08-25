const fs = require("fs");
const path = require("path");
const vm = require("vm");
const products = require("../assets/us-products.js");

const source = fs.readFileSync(path.resolve(__dirname, "../assets/us-commerce.js"), "utf8");

function classList() {
  const classes = new Set();
  return {
    add: (...items) => items.forEach((item) => classes.add(item)),
    remove: (...items) => items.forEach((item) => classes.delete(item)),
    contains: (item) => classes.has(item)
  };
}

function storage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    value: (key) => values.get(key)
  };
}

function node(overrides = {}) {
  return {
    textContent: "",
    innerHTML: "",
    attrs: {},
    classList: classList(),
    childNodes: [],
    dataset: {},
    style: {},
    setAttribute(key, value) { this.attrs[key] = value; },
    removeAttribute(key) { delete this.attrs[key]; },
    addEventListener(event, handler) { this.handlers[event] = handler; },
    handlers: {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    appendChild() {},
    ...overrides
  };
}

function baseDocument({ ids = {}, selectors = {}, body = node({ dataset: {} }) } = {}) {
  return {
    body,
    getElementById: (id) => ids[id] || null,
    querySelector: (selector) => selectors[selector] || null,
    querySelectorAll: (selector) => selectors[selector] ? [selectors[selector]] : [],
    createElement: () => node(),
    createTextNode: (text) => ({ textContent: text })
  };
}

function run(sourceDocument, localStorage, extras = {}) {
  const window = { OMNI_US_PRODUCTS: products, location: { search: "" }, ...extras.window };
  const context = {
    window,
    document: sourceDocument,
    localStorage,
    URLSearchParams,
    JSON,
    Math,
    Number,
    Array,
    Date,
    FormData: extras.FormData || FormData,
    setTimeout: (callback) => callback()
  };
  vm.runInNewContext(source, context);
  return window;
}

function testProductAdd() {
  const product = products[0];
  const button = node();
  const meta = node();
  const document = baseDocument({
    body: node({ dataset: { productId: product.id } }),
    selectors: {
      ".purchase-actions button": button,
      'meta[name="description"]': meta
    }
  });
  const localStorage = storage();
  const window = run(document, localStorage);

  if (button.disabled) throw new Error("Request-cart button remained disabled");
  if (button.textContent !== "Add to Request Cart") throw new Error("Request-cart button label is incorrect");
  if (typeof button.handlers.click !== "function") throw new Error("Request-cart click handler was not attached");
  button.handlers.click();
  const cart = JSON.parse(localStorage.value("omniTerrainUsCart"));
  if (cart.length !== 1 || cart[0].id !== product.id || cart[0].quantity !== 1) {
    throw new Error("Product was not added to the request cart");
  }
  window.OMNI_US_CART.add(product.id);
  if (JSON.parse(localStorage.value("omniTerrainUsCart"))[0].quantity !== 2) {
    throw new Error("Adding the same product did not increase quantity");
  }
}

function testCartRendering() {
  const cartRoot = node();
  const checkoutLink = node();
  const count = node();
  const document = baseDocument({
    ids: { cartRoot, checkoutLink },
    selectors: { "[data-cart-count]": count }
  });
  document.querySelectorAll = (selector) => selector === "[data-cart-count]" ? [count] : [];
  const localStorage = storage({
    omniTerrainUsCart: JSON.stringify([
      { id: products[0].id, quantity: 2 },
      { id: products[1].id, quantity: 1 }
    ])
  });
  run(document, localStorage);

  // Titles are HTML escaped by the runtime before rendering, so assert the
  // stable manufacturer part numbers rather than comparing unescaped HTML.
  if (!cartRoot.innerHTML.includes(products[0].mpn) || !cartRoot.innerHTML.includes(products[1].mpn)) {
    throw new Error("Cart did not render selected product records");
  }
  if (checkoutLink.classList.contains("disabled")) throw new Error("Populated cart disabled checkout");
  if (count.textContent !== "3") throw new Error("Cart count did not include quantities");

  const emptyRoot = node();
  const emptyCheckout = node();
  const emptyDocument = baseDocument({ ids: { cartRoot: emptyRoot, checkoutLink: emptyCheckout } });
  run(emptyDocument, storage());
  if (!emptyRoot.innerHTML.includes("Your request cart is empty")) throw new Error("Empty cart state did not render");
  if (!emptyCheckout.classList.contains("disabled") || emptyCheckout.attrs["aria-disabled"] !== "true") {
    throw new Error("Empty cart did not disable checkout");
  }
}

function testCheckoutHandoff() {
  const fields = {
    firstName: "Ava",
    lastName: "Taylor",
    email: "ava@example.com",
    phone: "3075550100",
    address: "1 Main Street",
    city: "Sheridan",
    state: "WY",
    zip: "82801",
    country: "US",
    notes: "Confirm 12V system",
    consent: "on"
  };
  class MockFormData {
    entries() {
      return Object.entries(fields);
    }
  }

  const parent = { insertBefore() {} };
  const form = node({
    parentNode: parent,
    reportValidity: () => true
  });
  const checkoutItems = node();
  const status = node();
  const document = baseDocument({
    ids: { checkoutForm: form, checkoutItems, checkoutStatus: status }
  });
  const localStorage = storage({
    omniTerrainUsCart: JSON.stringify([{ id: products[0].id, quantity: 1 }])
  });
  run(document, localStorage, { FormData: MockFormData });

  if (!checkoutItems.innerHTML.includes(products[0].mpn)) throw new Error("Checkout review did not render the selected item");
  if (typeof form.handlers.submit !== "function") throw new Error("Checkout submit handler was not attached");
  form.handlers.submit({ preventDefault() {} });
  if (!status.classList.contains("show")) throw new Error("Checkout completion status was not shown");
  if (!status.innerHTML.includes("Email order request") || !status.innerHTML.includes("No account was created and no payment has been taken")) {
    throw new Error("Checkout handoff disclosure is incomplete");
  }
  if (!status.innerHTML.includes("mailto:procurement@omni-terrain.com")) throw new Error("Checkout did not create the email handoff");

  const request = JSON.parse(localStorage.value("omniTerrainUsLastRequest"));
  if (!request.reference.startsWith("OT-") || request.customer.email !== fields.email || request.items.length !== 1) {
    throw new Error("Checkout request record was not stored correctly");
  }
}

testProductAdd();
testCartRendering();
testCheckoutHandoff();
console.log("PASS request-cart add, quantity, empty/populated cart and guest checkout email handoff");
