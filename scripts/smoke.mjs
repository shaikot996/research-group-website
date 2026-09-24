import assert from "node:assert/strict";
import { setTimeout } from "node:timers/promises";
import { existsSync, writeFileSync, unlinkSync } from "node:fs";
const base = process.env.BASE_URL || "http://127.0.0.1:3000";
async function get(path, status = 200) {
  const response = await fetch(base + path, { signal: AbortSignal.timeout(15000), redirect: "manual" });
  assert.equal(response.status, status, `${path}: HTTP ${response.status}, expected ${status}`);
  return response;
}
let ready = false;
for (let i = 0; i < 40; i++) {
  try { ready = (await fetch(base + "/api/health")).ok; } catch {}
  if (ready) break;
  await setTimeout(500);
}
assert.ok(ready, "Server did not become ready");
const sitemap = await (await get("/sitemap.xml")).text();
const routes = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(x => new URL(x[1].replaceAll("&amp;", "&")).pathname);
for (const route of routes) {
  const html = await (await get(route)).text();
  assert.ok(html.includes("Fundamental Physics"), `Missing site content: ${route}`);
}
const profile = await (await get("/people/md-shaikot-jahan-shuvo")).text();
assert.ok(profile.includes("MPhil in Physics") && profile.includes("August 2026") && profile.includes("Research Assistant"), "Corrected profile missing");
assert.ok((await (await get("/search?q=Shaikot")).text()).includes("Md Shaikot Jahan Shuvo"));
assert.ok((await (await get("/publications?year=2025")).text()).includes("Perturbative Kähler"));
await get("/publications?year=invalid");
assert.ok((await (await get("/contact")).text()).includes("mailto:majumdar@bracu.ac.bd"));
const news = await (await get("/news-events")).text();
assert.ok(news.includes("No upcoming events"));
const feed = await (await get("/feed.xml")).text();
assert.ok(feed.includes("&amp; Cosmology Group News"));
assert.ok((await (await get("/robots.txt")).text()).includes("Sitemap:"));
await get("/api/auth/providers", 404);
await get("/admin/login", 404);
await get("/people/unknown-researcher", 404);
await get("/portraits/unknown-researcher", 404);
if (process.argv.includes("--photos")) {
  const filename = "public/people/md-shaikot-jahan-shuvo/profile.png";
  assert.ok(!existsSync(filename), "Photo check requires an empty test profile folder");
  const original = await get("/portraits/md-shaikot-jahan-shuvo");
  assert.ok(original.headers.get("content-type")?.includes("svg"));
  assert.ok((await original.text()).includes(">MS</text>"));
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jK1cAAAAASUVORK5CYII=", "base64");
  try {
    writeFileSync(filename, png, { flag: "wx" });
    const response = await get("/portraits/md-shaikot-jahan-shuvo");
    assert.equal(response.headers.get("content-type"), "image/png");
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), png);
  } finally { unlinkSync(filename); }
  assert.ok((await get("/portraits/md-shaikot-jahan-shuvo")).headers.get("content-type")?.includes("svg"));
}
console.log(`PASS: ${routes.length} public routes, profile data, search, publication filters, RSS, sitemap, contact links, disabled administration${process.argv.includes("--photos") ? ", and live photo insertion/removal" : ""}.`);
