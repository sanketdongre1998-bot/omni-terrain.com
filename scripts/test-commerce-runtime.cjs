const fs = require("fs");
const path = require("path");
const vm = require("vm");
const products = require("../assets/us-products.js");

const source = fs.readFileSync(path.resolve(__dirname, "../assets/us-commerce.js"), "utf8");

function classList() {
  const classes = new Set();
  return { add: (...items) => items.forEach((item) => classes.add(item)), contains: (item) => classes.has(item) };
}

function storage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    value: (key) => values.get(key)
  };
}

function runCartGuard() {
  const cartRoot = { innerHTML: "" };
  const checkoutLink = { classList: classList(), attrs: {}, setAttribute(key, value) { this.attrs[key] = value; }, addEventListener() {} };
  const count = { textContent: "" };
  const localStorage = storage({ omniTerrainUsCart: JSON.stringify([{ id: products[0].id, quantity: 1 }]) });
  const document = {
    querySelectorAll: (selector) => selector === "[data-cart-count]" ? [count] : [],
    getElementById: (id) => ({ cartRoot, checkoutLink }[id] || null)
  };
  const window = { OMNI_US_PRODUCTS: products, location: { search: "" } };
  vm.runInNewContext(source, { window, document, localStorage, URLSearchParams, JSON, Math, Number, Array });
  if (localStorage.value("omniTerrainUsCart") !== "[]") throw new Error("Unavailable product was not removed from cart");
  if (!cartRoot.innerHTML.includes("Your cart is empty")) throw new Error("Empty cart state did not render");
  if (!checkoutLink.classList.contains("disabled")) throw new Error("Empty cart did not disable checkout link");
  if (checkoutLink.attrs["aria-disabled"] !== "true") throw new Error("Checkout link missing aria-disabled");
}

function runCheckout(search) {
  const fields = Array.from({ length: 10 }, () => ({ disabled: true }));
  const submit = { disabled: true };
  fields.push(submit);
  const handlers = {};
  const form = {
    querySelectorAll: () => fields,
    addEventListener: (event, handler) => { handlers[event] = handler; },
    reportValidity: () => true
  };
  const qaBanner = { classList: classList() };
  const status = { classList: classList(), textContent: "" };
  const localStorage = storage();
  const document = {
    querySelectorAll: () => [],
    getElementById: (id) => ({ checkoutForm: form, qaBanner, checkoutStatus: status }[id] || null)
  };
  const window = { OMNI_US_PRODUCTS: products, location: { search } };
  vm.runInNewContext(source, { window, document, localStorage, URLSearchParams, JSON, Math, Number, Array });
  return { fields, handlers, qaBanner, status };
}

runCartGuard();

const publicCheckout = runCheckout("");
if (!publicCheckout.fields.every((field) => field.disabled)) throw new Error("Public checkout fields were enabled");

const qaCheckout = runCheckout("?qa=1");
if (!qaCheckout.fields.every((field) => !field.disabled)) throw new Error("QA checkout fields did not enable");
if (!qaCheckout.qaBanner.classList.contains("show")) throw new Error("QA banner did not display");
if (typeof qaCheckout.handlers.submit !== "function") throw new Error("QA submit handler missing");
qaCheckout.handlers.submit({ preventDefault() {} });
if (!qaCheckout.status.classList.contains("show")) throw new Error("QA completion status did not display");
if (!qaCheckout.status.textContent.includes("No order, payment or customer data was transmitted")) throw new Error("QA completion message is incorrect");

console.log("PASS cart unavailable-item guard, public checkout lock and local QA checkout path");
