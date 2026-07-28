const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const site = "https://omni-terrain.com";
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const failures = [];
let checks = 0;

function check(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}

const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
check(locations.length === 92, `sitemap has 92 indexable URLs (found ${locations.length})`);
check(new Set(locations).size === locations.length, "sitemap URLs are unique");
check(!locations.some((url) => /(?:cart|checkout|product-page-template|shield-(?:400l|transit|7mm|portable|jet-black|12v-air))/.test(url)), "sitemap excludes noindex, checkout and legacy routes");

const titles = new Map();
const canonicals = new Set();
for (const url of locations) {
  check(url.startsWith(`${site}/`), `${url} uses the canonical site origin`);
  const relative = url.slice(`${site}/`.length) || "index.html";
  const file = path.join(root, relative);
  check(fs.existsSync(file), `${relative} exists`);
  if (!fs.existsSync(file)) continue;

  const html = fs.readFileSync(file, "utf8");
  const expectedCanonical = relative === "index.html" ? `${site}/` : `${site}/${relative}`;
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const description = html.match(/<meta name="description" content="([^"]+)"/i)?.[1]?.trim();
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];

  check(html.includes('name="robots" content="index,follow"'), `${relative} is indexable`);
  check(canonical === expectedCanonical, `${relative} has exact self-canonical`);
  check(Boolean(title) && title.length >= 12 && title.length <= 80, `${relative} has a useful title`);
  check(Boolean(description) && description.length >= 55 && description.length <= 200, `${relative} has a useful meta description`);
  check((html.match(/<h1(?:\s|>)/gi) || []).length === 1, `${relative} has exactly one H1`);
  check(!/lorem ipsum/i.test(html), `${relative} has no lorem ipsum`);
  check(!/\b(LKQ|Keystone|NTP-STAG|SeaWide)\b|authori[sz]ed dealer/i.test(html), `${relative} has no restricted public supplier claim`);

  if (title) {
    const duplicate = titles.get(title);
    check(!duplicate, `${relative} title is unique${duplicate ? ` (duplicates ${duplicate})` : ""}`);
    titles.set(title, relative);
  }
  if (canonical) {
    check(!canonicals.has(canonical), `${relative} canonical is unique`);
    canonicals.add(canonical);
  }
}

const robots = fs.readFileSync(path.join(root, "robots.txt"), "utf8");
check(robots.includes("User-agent: *") && robots.includes("Allow: /"), "robots.txt permits crawling");
check(robots.includes(`Sitemap: ${site}/sitemap.xml`), "robots.txt points to the canonical sitemap");

const template = fs.readFileSync(path.join(root, "product-page-template.html"), "utf8");
check(template.includes('name="robots" content="noindex,follow"'), "product template is noindex");

const allHtml = fs.readdirSync(root).filter((file) => file.endsWith(".html"));
for (const sourceName of allHtml) {
  const sourcePath = path.join(root, sourceName);
  const html = fs.readFileSync(sourcePath, "utf8");
  const refs = [
    ...html.matchAll(/href="([^"]+)"/gi),
    ...html.matchAll(/(?:src|data-gallery-src)="([^"]+)"/gi)
  ].map((match) => match[1].replaceAll("&amp;", "&"));

  for (const ref of refs) {
    if (ref.includes("+url+")) continue;
    if (/^(?:https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(ref)) continue;
    const [pathname, rawFragment] = ref.split("#", 2);
    const cleanPath = pathname.split("?")[0];
    const targetName = cleanPath || sourceName;
    const targetPath = path.resolve(root, targetName.replace(/^\//, ""));
    check(targetPath.startsWith(root) && fs.existsSync(targetPath), `${sourceName} internal target exists: ${ref}`);
    if (!fs.existsSync(targetPath) || !rawFragment || !targetPath.endsWith(".html")) continue;
    const fragment = decodeURIComponent(rawFragment);
    const targetHtml = fs.readFileSync(targetPath, "utf8");
    const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    check(new RegExp(`(?:id|name)="${escaped}"`, "i").test(targetHtml), `${sourceName} fragment exists: ${ref}`);
  }
}

if (failures.length) {
  console.error(`FAILED ${failures.length} of ${checks} SEO checks`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`PASS ${checks} site SEO checks across ${locations.length} sitemap URLs`);
