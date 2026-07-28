const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "..");
const routes = fs.readdirSync(root)
  .filter((file) => file.endsWith(".html"))
  .sort();

if (routes.length < 95) {
  throw new Error(`Expected at least 95 root HTML routes after both catalogues; found ${routes.length}`);
}

const server = http.createServer((request, response) => {
  const relative = decodeURIComponent(request.url.split("?")[0]).replace(/^\//, "");
  const file = path.join(root, relative || "index.html");
  if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, {
    "Content-Type": file.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream"
  });
  fs.createReadStream(file).pipe(response);
});

server.listen(0, "127.0.0.1", async () => {
  const { port } = server.address();
  try {
    for (const route of ["", ...routes]) {
      await new Promise((resolve, reject) => {
        http.get({ host: "127.0.0.1", port, path: `/${route}` }, (response) => {
          response.resume();
          response.on("end", () => response.statusCode === 200
            ? resolve()
            : reject(new Error(`${route || "/"}: HTTP ${response.statusCode}`)));
        }).on("error", reject);
      });
    }
    console.log(`PASS home plus ${routes.length} root HTML routes returned HTTP 200`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
