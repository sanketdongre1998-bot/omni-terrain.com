const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputRoot = path.resolve(root, "..");
const css = fs.readFileSync(path.join(root, "assets/us-catalogue.css"), "utf8");
const productData = fs.readFileSync(path.join(root, "assets/us-products.js"), "utf8");
const commerce = fs.readFileSync(path.join(root, "assets/us-commerce.js"), "utf8");
const catalogue = fs.readFileSync(path.join(root, "assets/us-catalogue.js"), "utf8");
const emblem = fs.readFileSync(path.join(root, "assets/omni-terrain-emblem.webp")).toString("base64");

function build(input, output) {
  let html = fs.readFileSync(path.join(root, input), "utf8");
  html = html.replace("<head>", '<head><base href="repo-current/">');
  html = html.replace('<link rel="stylesheet" href="assets/us-catalogue.css">', `<style>${css}</style>`);
  html = html.replace('src="assets/omni-terrain-emblem.webp"', `src="data:image/webp;base64,${emblem}"`);
  html = html.replace('<script src="assets/us-products.js"></script>', `<script>${productData}</script>`);
  html = html.replace('<script src="assets/us-commerce.js"></script>', `<script>${commerce}</script>`);
  html = html.replace('<script src="assets/us-catalogue.js"></script>', `<script>${catalogue}</script>`);
  fs.writeFileSync(path.join(outputRoot, output), html);
}

build("us-catalogue.html", "OMNI-Terrain-US-Catalogue-Visual-Preview.html");
build("us-noco-genius10.html", "OMNI-Terrain-US-Product-Visual-Preview.html");
console.log("Built standalone catalogue and product visual previews.");
