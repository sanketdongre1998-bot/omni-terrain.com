const fs = require("fs");
const http = require("http");
const path = require("path");
const products = require("../assets/us-products.js");

const root = path.resolve(__dirname, "..");
const routes = ["us-catalogue.html", "cart.html", "checkout.html", ...products.map((product) => product.slug)];

const server = http.createServer((request, response) => {
  const relative = decodeURIComponent(request.url.split("?")[0]).replace(/^\//, "");
  const file = path.join(root, relative || "index.html");
  if (!file.startsWith(root) || !fs.existsSync(file)) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  fs.createReadStream(file).pipe(response);
});

server.listen(0, "127.0.0.1", async () => {
  const { port } = server.address();
  try {
    for (const route of routes) {
      await new Promise((resolve, reject) => {
        http.get({ host: "127.0.0.1", port, path: `/${route}` }, (response) => {
          response.resume();
          response.on("end", () => response.statusCode === 200 ? resolve() : reject(new Error(`${route}: HTTP ${response.statusCode}`)));
        }).on("error", reject);
      });
    }
    console.log(`PASS ${routes.length} HTTP routes returned 200`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
