// Verify the GitHub Pages artifact before it is uploaded by Actions.
import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const out = path.resolve(process.env.EXPORT_OUT_DIR || "_site");
const domain = "sam.cse.bracu.ac.bd";
const errors = [];
const googleVerificationFilename = "google541d3d739d6713f5.html";
const expectedGoogleVerification = "google-site-verification: google541d3d739d6713f5.html";
const verificationPath = path.join(out, googleVerificationFilename);
if (!existsSync(verificationPath)) {
  errors.push("Google Search Console ownership verification file missing from Pages export");
} else {
  const actual = (await readFile(verificationPath, "utf8")).trim();
  if (actual !== expectedGoogleVerification) errors.push("Google verification file content mismatch");
}
const mandatory = ["index.html", "404.html", ".nojekyll", "CNAME", "static-demo.js", "search-index.json", "sitemap.xml", "robots.txt", "feed.xml", "people/index.html", "research/index.html", "publications/index.html", "projects/index.html", "about/index.html", "contact/index.html", "news-events/index.html", "research-radar/index.html", "open-source/index.html", "open-source/ray/index.html", "images/open-source/ray-spacetime.webp", "join/index.html", "search/index.html"];
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

if (process.env.SAM_VERIFY_CURRENT_PROFILES === "1") {
const joinExport = path.join(out, "join", "index.html");
if (existsSync(joinExport)) {
  const join = await readFile(joinExport, "utf8");
  if (!join.includes("Undergraduate Research Opportunities") ||
      join.includes("Prospective Graduate Students") ||
      join.includes("Postdoctoral Researchers")) {
    errors.push("Join Us export contains outdated recruitment text; expected undergraduate research only");
  }
}

const hasibProfilePath = path.join(out, "people", "syed-hasibul-hassan-chowdhury", "index.html");
if (!existsSync(hasibProfilePath)) {
  errors.push("Hasib PI profile page missing from Pages export");
} else {
  const hasibProfile = await readFile(hasibProfilePath, "utf8");
  if (!hasibProfile.includes("https://inspirehep.net/authors/1511186")) {
    errors.push("Hasib PI profile is missing his verified INSPIRE author link");
  }
  if (!hasibProfile.includes("INSPIRE citations")) {
    errors.push("Hasib PI profile is missing cached INSPIRE citation statistics");
  }
}

// Compare deployed DP bytes with the authoritative Drive snapshot from this run.
// This catches wrong portrait sources, stale assets, and accidental dummy images.
const shaikotSource = path.resolve(process.env.DRIVE_PEOPLE_ASSET_DIR || "data/drive-people",
  "md-shaikot-jahan-shuvo", "profile.png");
const shaikotExport = path.join(out, "portraits", "md-shaikot-jahan-shuvo.png");
const shaikotPage = path.join(out, "people", "index.html");
if (!existsSync(shaikotSource)) {
  errors.push("Shaikot's current Google Drive profile.png was not synced");
} else if (!existsSync(shaikotExport)) {
  errors.push("Shaikot's profile portrait PNG missing from Pages export");
} else {
  const checksum = (bytes) => createHash("sha256").update(bytes).digest("hex");
  const original = await readFile(shaikotSource);
  const published = await readFile(shaikotExport);
  if (checksum(original) !== checksum(published)) errors.push("Shaikot portrait does not match current Drive image bytes");
}
if (existsSync(shaikotPage)) {
  const people = await readFile(shaikotPage, "utf8");
  if (!/src="\/portraits\/md-shaikot-jahan-shuvo\.png(?:\?[^"]*)?"/.test(people)) {
    errors.push("People card still points to an outdated Shaikot portrait URL");
  }
}

}
if (existsSync(path.join(out, "people/md-shaikot-jahan-shuvo/index.html"))) {
  const profile = await readFile(path.join(out, "people/md-shaikot-jahan-shuvo/index.html"), "utf8");
  if (!profile.includes('rel="canonical"') || !profile.includes("md-shaikot-jahan-shuvo")) errors.push("Person profile missing SEO canonical");
  if (!/<script\b[^>]*type=["\']application\/ld\+json["\'][^>]*>[\s\S]*?https:\/\/schema\.org[\s\S]*?<\/script>/i.test(profile)) errors.push("Person profile missing preserved JSON-LD structured data");
}
if (process.env.SAM_VERIFY_LIVE_SEO === "1") {
// Ensure every important static section has its own canonical, not the root.
// A root canonical inherited on all pages can prevent individual-page indexing.
const priorityMemberProfiles=[
  ["mahbubul-alam-majumdar","Mahbubul Alam Majumdar"],
  ["syed-hasibul-hassan-chowdhury","Syed Hasibul Hassan Chowdhury"],
  ["md-shaikot-jahan-shuvo","Md Shaikot Jahan Shuvo"],
  ["mishaal-hai","Mishaal Hai"],
  ["ahmed-rakin-kamal","Ahmed Rakin Kamal"],
];
for(const [slug,memberName] of priorityMemberProfiles){
  const memberFile=path.join(out,"people",slug,"index.html");
  if(!existsSync(memberFile)){
    errors.push(`Missing priority researcher profile: ${slug}`);
    continue;
  }
  const html=await readFile(memberFile,"utf8");
  const title=html.match(/<title>([\\s\\S]*?)<\\/title>/i)?.[1]||"";
  if(!title.includes(memberName)||!title.includes("SAM Research Group")||!title.includes("BRAC University"))
    errors.push(`${slug}: researcher title missing name/SAM/BRAC University`);
  if(!html.includes('memberOf')||!html.includes("sam.cse.bracu.ac.bd/#organization"))
    errors.push(`${slug}: researcher profile lacks SAM Person membership structured data`);
}
const seoCanonicalPages = [
  ["index.html", "https://sam.cse.bracu.ac.bd/"],
  ["people/index.html", "https://sam.cse.bracu.ac.bd/people/"],
  ["research/index.html", "https://sam.cse.bracu.ac.bd/research/"],
  ["about/index.html", "https://sam.cse.bracu.ac.bd/about/"],
  ["publications/index.html", "https://sam.cse.bracu.ac.bd/publications/"],
  ["research-radar/index.html", "https://sam.cse.bracu.ac.bd/research-radar/"],
];
for (const [rel, expected] of seoCanonicalPages) {
  const file = path.join(out, rel);
  if (!existsSync(file)) continue;
  const html = await readFile(file, "utf8");
  const canonicalLinks = [...html.matchAll(/<link\b[^>]*>/gi)].map(m => m[0])
    .filter(tag => /\brel=["']canonical["']/i.test(tag))
    .map(tag => tag.match(/\bhref=["']([^"']+)["']/i)?.[1])
    .filter(Boolean);
  const matchesExpected = canonicalLinks[0] === expected ||
    (rel === "index.html" && canonicalLinks[0] === expected.replace(/\/$/, ""));
  if (canonicalLinks.length !== 1 || !matchesExpected)
    errors.push(`${rel}: expected unique canonical ${expected}, found ${JSON.stringify(canonicalLinks)}`);
}
if (existsSync(path.join(out, "index.html"))) {
  const homeSeo = await readFile(path.join(out, "index.html"), "utf8");
  if (!homeSeo.includes("SAM Research Group") || !homeSeo.includes("BRAC University"))
    errors.push("Homepage brand and university missing from search metadata");
  if (!homeSeo.includes('"@type":"Organization"') || !homeSeo.includes('"@type":"WebSite"'))
    errors.push("Homepage missing Organization / WebSite JSON-LD identity");
}

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
