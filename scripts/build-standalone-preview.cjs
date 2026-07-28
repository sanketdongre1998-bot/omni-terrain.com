const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputRoot = process.env.PREVIEW_OUTPUT_DIR
  ? path.resolve(process.env.PREVIEW_OUTPUT_DIR)
  : path.resolve(root, "..", "deliverables");

fs.mkdirSync(outputRoot, { recursive: true });

function inlineLocalImages(html) {
  const sources = [...html.matchAll(/(?:src|content)="(assets\/[^"]+\.(?:webp|png|jpe?g))"/gi)]
    .map((match) => match[1]);
  for (const source of new Set(sources)) {
    const file = path.join(root, source);
    if (!fs.existsSync(file)) continue;
    const extension = path.extname(file).slice(1).replace("jpg", "jpeg");
    const dataUri = `data:image/${extension};base64,${fs.readFileSync(file).toString("base64")}`;
    html = html.replaceAll(source, dataUri);
  }
  return html;
}

function build({ input, output, cssFile, scriptFiles }) {
  let html = fs.readFileSync(path.join(root, input), "utf8");
  const css = fs.readFileSync(path.join(root, cssFile), "utf8");
  html = html.replace("<head>", '<head><base href="https://omni-terrain.com/">');
  html = html.replace(`<link rel="stylesheet" href="${cssFile}">`, `<style>${css}</style>`);
  for (const scriptFile of scriptFiles) {
    const script = fs.readFileSync(path.join(root, scriptFile), "utf8");
    html = html.replace(`<script src="${scriptFile}"></script>`, `<script>${script}</script>`);
  }
  html = inlineLocalImages(html);
  fs.writeFileSync(path.join(outputRoot, output), html);
}

for (const page of [
  {
    input: "us-catalogue.html",
    output: "OMNI-Terrain-US-Catalogue-Preview.html",
    cssFile: "assets/us-catalogue.css",
    scriptFiles: ["assets/us-products.js", "assets/us-commerce.js", "assets/us-catalogue.js"]
  },
  {
    input: "us-noco-genius10.html",
    output: "OMNI-Terrain-US-Product-Preview.html",
    cssFile: "assets/us-catalogue.css",
    scriptFiles: ["assets/us-products.js", "assets/us-commerce.js", "assets/us-catalogue.js"]
  },
  {
    input: "shield-autocare-uk.html",
    output: "OMNI-Terrain-UK-Catalogue-Preview.html",
    cssFile: "assets/shield-catalogue.css",
    scriptFiles: ["assets/shield-catalogue.js"]
  },
  {
    input: "uk-cool-mate-70l-fridge-black.html",
    output: "OMNI-Terrain-UK-Product-Preview.html",
    cssFile: "assets/shield-catalogue.css",
    scriptFiles: ["assets/shield-catalogue.js"]
  }
]) build(page);

console.log(`Built four standalone previews in ${outputRoot}.`);
