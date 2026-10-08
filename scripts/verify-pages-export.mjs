// Verify the GitHub Pages artifact before it is uploaded by Actions.
import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const out = path.resolve(process.env.EXPORT_OUT_DIR || "_site");
const domain = "sam.cse.bracu.ac.bd";
const errors = [];
const mandatory = ["index.html", "404.html", ".nojekyll", "CNAME", "static-demo.js", "search-index.json", "sitemap.xml", "robots.txt", "feed.xml", "people/index.html", "research/index.html", "publications/index.html", "projects/index.html", "about/index.html", "contact/index.html", "news-events/index.html", "join/index.html", "search/index.html"];
for (const rel of mandatory) {
  if (!existsSync(path.join(out, rel))) errors.push(`Missing export file: ${rel}`);
}
if (existsSync(path.join(out, "CNAME"))) {
  const cname = (await readFile(path.join(out, "CNAME"), "utf8")).trim();
  if (cname !== domain) errors.push(`Incorrect CNAME: ${cname}`);
}
let htmlCount = 0, cssCount = 0, assetCount = 0;
async function walk(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) { await walk(file); continue; }
    const rel = path.relative(out, file).replaceAll(path.sep, "/");
    if (entry.name.endsWith(".css")) { cssCount++; continue; }
    if (!entry.name.endsWith(".html")) { assetCount++; continue; }
    htmlCount++;
    const content = await readFile(file, "utf8");
    if (content.includes('/research-group-website/')) errors.push(`${rel}: legacy project prefix detected`);
    for (const match of content.matchAll(/\b(?:href|src|poster|data)\s*=\s*(["'])(.*?)\1/gi)) {
      const raw = match[2].replaceAll("&amp;", "&");
      if (!raw.startsWith("/") || raw.startsWith("//")) continue;
      const pathname = decodeURIComponent(new URL(raw, `https://${domain}`).pathname);
      const dest = path.join(out, pathname.slice(1));
      if (!existsSync(dest) && !existsSync(`${dest}.html`) && !existsSync(path.join(dest, "index.html"))) {
        errors.push(`${rel}: missing local resource ${pathname}`);
      }
    }
  }
}
if (existsSync(out)) await walk(out);
else errors.push(`Export directory missing: ${out}`);
if (!cssCount) errors.push("No CSS files found in static export");
if (existsSync(path.join(out, "sitemap.xml"))) {
  const sitemap = await readFile(path.join(out, "sitemap.xml"), "utf8");
  if (!sitemap.includes(`https://${domain}/`)) errors.push("Sitemap does not use the official domain");
  if (sitemap.includes("shaikot996.github.io")) errors.push("Sitemap contains old GitHub Pages domain");
}
if (existsSync(path.join(out, "robots.txt"))) {
  const robots = await readFile(path.join(out, "robots.txt"), "utf8");
  if (!robots.includes(`https://${domain}/sitemap.xml`)) errors.push("robots.txt points to the wrong sitemap");
}
if (existsSync(path.join(out, "index.html"))) {
  const home = await readFile(path.join(out, "index.html"), "utf8");
  if (!/href=["']\/_next\/static\/[^"']+\.css["']/.test(home)) errors.push("Homepage is missing root-relative Next.js CSS link");
  if (!home.includes('src="/static-demo.js"')) errors.push("Static interactions script is missing or improperly prefixed");
  if (!home.includes('href="/people/"')) errors.push("People navigation does not point to the domain root");
}
if (errors.length) {
  console.error(`Pages verification failed (${errors.length} problems):`);
  for (const err of errors.slice(0, 60)) console.error(` - ${err}`);
  if (errors.length > 60) console.error(` ... and ${errors.length - 60} more`);
  process.exit(1);
}
console.log(`Pages artifact verified for ${domain}: ${htmlCount} HTML files, ${cssCount} CSS files, ${assetCount} other assets`);
