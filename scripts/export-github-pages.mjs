import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const origin = (process.env.EXPORT_ORIGIN || "http://127.0.0.1:4173").replace(/\/$/, "");
const basePathRaw = process.env.GITHUB_PAGES_BASE_PATH || "/research-group-website";
const basePath = `/${basePathRaw.replace(/^\/+|\/+$/g, "")}`;
const outDir = path.resolve(process.env.EXPORT_OUT_DIR || "_site");
const publicDir = path.resolve("public");
const uploadDir = path.resolve(process.env.UPLOAD_DIR || "data/uploads");

const pageQueue = ["/"];
const queuedPages = new Set(pageQueue);
const pages = new Map();
const assetQueue = [];
const queuedAssets = new Set();
const assetMap = new Map();
const failures = [];

const ignoredPagePrefixes = ["/admin", "/api"];
const specialAssetPatterns = [
  /^\/portraits\//,
  /^\/uploads\//,
  /^\/events\/[^/]+\/calendar\/?$/,
  /^\/feed\.xml$/,
];

const mimeExt = new Map([
  ["image/svg+xml", ".svg"],
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["application/pdf", ".pdf"],
  ["text/calendar", ".ics"],
  ["application/ics", ".ics"],
  ["text/css", ".css"],
  ["application/json", ".json"],
  ["application/xml", ".xml"],
  ["text/xml", ".xml"],
  ["font/woff2", ".woff2"],
  ["font/woff", ".woff"],
]);

function cleanPathname(input) {
  let p = input || "/";
  if (!p.startsWith("/")) p = `/${p}`;
  p = p.replace(/\/{2,}/g, "/");
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p;
}

function stripQueryAndHash(value) {
  try {
    const u = new URL(value, origin);
    return cleanPathname(u.pathname);
  } catch {
    return null;
  }
}

function isExternalLike(value) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value || "");
}

function internalUrl(value, currentRoute = "/") {
  if (!value || value.startsWith("#") || /^(?:mailto:|tel:|data:|javascript:)/i.test(value)) return null;
  try {
    const base = new URL(currentRoute, `${origin}/`);
    const url = new URL(value, base);
    if (url.origin !== new URL(origin).origin) return null;
    return url;
  } catch {
    return null;
  }
}

function shouldIgnorePage(route) {
  return ignoredPagePrefixes.some((prefix) => route === prefix || route.startsWith(`${prefix}/`));
}

function looksLikePage(route) {
  if (specialAssetPatterns.some((re) => re.test(route))) return false;
  if (shouldIgnorePage(route)) return false;
  const ext = path.posix.extname(route);
  return ext === "" || ext === ".html";
}

function queuePage(route) {
  route = cleanPathname(route.replace(/\.html$/, ""));
  if (shouldIgnorePage(route) || queuedPages.has(route)) return;
  queuedPages.add(route);
  pageQueue.push(route);
}

function queueAsset(pathname) {
  const p = cleanPathname(pathname);
  if (queuedAssets.has(p) || p.startsWith("/api/") || p.startsWith("/admin/")) return;
  queuedAssets.add(p);
  assetQueue.push(p);
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractAttr(html, tag, attr) {
  const result = [];
  const tagRe = new RegExp(`<${tag}\\b[^>]*>`, "gi");
  const attrRe = new RegExp(`\\b${attr}\\s*=\\s*(["'])(.*?)\\1`, "i");
  for (const m of html.matchAll(tagRe)) {
    const a = m[0].match(attrRe);
    if (a) result.push(decodeEntities(a[2]));
  }
  return result;
}

function extractSrcsetValues(html) {
  const result = [];
  const re = /\bsrcset\s*=\s*(["'])(.*?)\1/gi;
  for (const m of html.matchAll(re)) {
    for (const item of m[2].split(",")) {
      const url = item.trim().split(/\s+/)[0];
      if (url) result.push(decodeEntities(url));
    }
  }
  return result;
}

function discoverFromHtml(html, route) {
  for (const href of extractAttr(html, "a", "href")) {
    const u = internalUrl(href, route);
    if (!u) continue;
    const p = cleanPathname(u.pathname);
    if (looksLikePage(p)) queuePage(p);
    else queueAsset(p);
  }

  for (const href of extractAttr(html, "link", "href")) {
    const u = internalUrl(href, route);
    if (u) queueAsset(u.pathname);
  }

  for (const tag of ["img", "source", "video", "audio", "iframe", "object"]) {
    for (const src of extractAttr(html, tag, tag === "object" ? "data" : "src")) {
      const u = internalUrl(src, route);
      if (u) queueAsset(u.pathname);
    }
  }

  for (const src of extractSrcsetValues(html)) {
    const u = internalUrl(src, route);
    if (u) queueAsset(u.pathname);
  }

  for (const action of extractAttr(html, "form", "action")) {
    const u = internalUrl(action, route);
    if (u && looksLikePage(cleanPathname(u.pathname))) queuePage(u.pathname);
  }

  const cssUrlRe = /url\(\s*(["']?)(\/[^)'"\s]+)\1\s*\)/gi;
  for (const m of html.matchAll(cssUrlRe)) queueAsset(m[2]);
}

async function fetchChecked(urlPath) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    return await fetch(`${origin}${urlPath}`, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "CIPM-GitHub-Pages-Exporter/5" },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function crawlPages() {
  while (pageQueue.length) {
    const route = pageQueue.shift();
    let response;
    try {
      response = await fetchChecked(route);
    } catch (error) {
      failures.push(`PAGE ${route}: ${error.message}`);
      continue;
    }

    if (!response.ok) {
      failures.push(`PAGE ${route}: HTTP ${response.status}`);
      continue;
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("text/html")) {
      failures.push(`PAGE ${route}: expected HTML, got ${contentType || "unknown content type"}`);
      continue;
    }

    const html = await response.text();
    pages.set(route, html);
    discoverFromHtml(html, route);
  }
}

function extensionFor(contentType, pathname) {
  const existing = path.posix.extname(pathname);
  if (existing) return "";
  const mime = contentType.split(";")[0].trim().toLowerCase();
  return mimeExt.get(mime) || "";
}

function safeAssetRel(pathname, contentType = "") {
  const decoded = decodeURIComponent(pathname).replace(/^\/+/, "");
  const clean = decoded
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/[^a-zA-Z0-9._@+-]/g, "_"))
    .join("/");
  const rel = clean || "asset";
  return `${rel}${extensionFor(contentType, pathname)}`;
}

function discoverFromCss(css, cssPath) {
  const re = /url\(\s*(["']?)(.*?)\1\s*\)/gi;
  for (const m of css.matchAll(re)) {
    const raw = m[2].trim();
    if (!raw || raw.startsWith("data:") || raw.startsWith("#")) continue;
    const u = internalUrl(raw, cssPath);
    if (u) queueAsset(u.pathname);
  }
}

async function crawlAssets() {
  while (assetQueue.length) {
    const pathname = assetQueue.shift();
    let response;
    try {
      response = await fetchChecked(pathname);
    } catch (error) {
      failures.push(`ASSET ${pathname}: ${error.message}`);
      continue;
    }
    if (!response.ok) {
      failures.push(`ASSET ${pathname}: HTTP ${response.status}`);
      continue;
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    const rel = safeAssetRel(pathname, contentType);
    assetMap.set(pathname, rel);
    const target = path.join(outDir, rel);
    await mkdir(path.dirname(target), { recursive: true });

    if (contentType.includes("text/css")) {
      const css = await response.text();
      discoverFromCss(css, pathname);
      await writeFile(target, css, "utf8");
    } else {
      const bytes = Buffer.from(await response.arrayBuffer());
      await writeFile(target, bytes);
    }
  }
}

function pagePublicUrl(route) {
  const r = cleanPathname(route.replace(/\.html$/, ""));
  return r === "/" ? `${basePath}/` : `${basePath}${r}/`;
}

function outPagePath(route) {
  const r = cleanPathname(route.replace(/\.html$/, ""));
  if (r === "/") return path.join(outDir, "index.html");
  return path.join(outDir, r.slice(1), "index.html");
}

function aliasHtmlPath(route) {
  const r = cleanPathname(route.replace(/\.html$/, ""));
  if (r === "/") return null;
  return path.join(outDir, `${r.slice(1)}.html`);
}

function resolveMappedInternal(value, currentRoute, kind = "href") {
  const u = internalUrl(value, currentRoute);
  if (!u) return value;
  const p = cleanPathname(u.pathname);
  let mapped;

  if (pages.has(p) || (p.endsWith(".html") && pages.has(p.slice(0, -5)))) {
    mapped = pagePublicUrl(p);
  } else if (assetMap.has(p)) {
    mapped = `${basePath}/${assetMap.get(p).replace(/^\/+/, "")}`;
  } else {
    const publicCandidate = path.join(outDir, p.replace(/^\/+/, ""));
    if (existsSync(publicCandidate)) mapped = `${basePath}${p}`;
    else if (p === "/") mapped = `${basePath}/`;
    else if (shouldIgnorePage(p)) return value;
    else mapped = `${basePath}${p}`;
  }

  return `${mapped}${u.search || ""}${u.hash || ""}`;
}

function rewriteSrcset(value, route) {
  return value
    .split(",")
    .map((item) => {
      const trimmed = item.trim();
      if (!trimmed) return trimmed;
      const [url, ...descriptor] = trimmed.split(/\s+/);
      const mapped = resolveMappedInternal(url, route, "src");
      return [mapped, ...descriptor].join(" ");
    })
    .join(", ");
}

function stripNextRuntime(html) {
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<link\b(?=[^>]*(?:rel=["']modulepreload["']|as=["']script["']))[^>]*>/gi, "");
  return html;
}

function rewriteHtml(html, route) {
  html = stripNextRuntime(html);

  html = html.replace(
    /\b(href|src|action|poster|data)\s*=\s*(["'])(.*?)\2/gi,
    (full, attr, quote, raw) => {
      if (!raw || isExternalLike(raw) && !raw.startsWith("/")) return full;
      const mapped = resolveMappedInternal(decodeEntities(raw), route, attr.toLowerCase());
      return `${attr}=${quote}${mapped}${quote}`;
    },
  );

  html = html.replace(/\bsrcset\s*=\s*(["'])(.*?)\1/gi, (full, quote, raw) => {
    return `srcset=${quote}${rewriteSrcset(decodeEntities(raw), route)}${quote}`;
  });

  html = html.replace(/url\(\s*(["']?)(\/[^)'"\s]+)\1\s*\)/gi, (full, quote, raw) => {
    const mapped = resolveMappedInternal(raw, route, "src");
    return `url(${quote}${mapped}${quote})`;
  });

  const scriptTag = `<script defer src="${basePath}/static-demo.js"></script>`;
  if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, `${scriptTag}</body>`);
  else html += scriptTag;

  if (!html.includes("CIPM-GITHUB-PAGES-V5")) html = `<!-- CIPM-GITHUB-PAGES-V5 -->\n${html}`;
  return html;
}

async function rewriteCssAssets() {
  for (const [sourcePath, rel] of assetMap) {
    if (!rel.endsWith(".css")) continue;
    const file = path.join(outDir, rel);
    let css = await readFile(file, "utf8");
    css = css.replace(/url\(\s*(["']?)(.*?)\1\s*\)/gi, (full, quote, raw) => {
      const value = raw.trim();
      if (!value || value.startsWith("data:") || value.startsWith("#")) return full;
      const u = internalUrl(value, sourcePath);
      if (!u) return full;
      const p = cleanPathname(u.pathname);
      const mappedRel = assetMap.get(p) || p.replace(/^\/+/, "");
      return `url(${quote}${basePath}/${mappedRel}${u.search || ""}${u.hash || ""}${quote})`;
    });
    await writeFile(file, css, "utf8");
  }
}

function stripTags(html) {
  return html
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function firstTagText(html, tag) {
  const m = html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? stripTags(m[1]) : "";
}

async function writeStaticHelpers() {
  const searchIndex = [...pages.entries()].map(([route, html]) => ({
    route: pagePublicUrl(route),
    title: firstTagText(html, "h1") || firstTagText(html, "title") || route,
    text: stripTags(html).slice(0, 12000),
    type: route === "/" ? "Home" : route.split("/").filter(Boolean)[0]?.replace(/-/g, " ") || "Page",
  }));
  await writeFile(path.join(outDir, "search-index.json"), JSON.stringify(searchIndex), "utf8");

  const js = String.raw`(() => {
  const BASE = ${JSON.stringify(basePath)};
  const root = document.documentElement;
  const saved = localStorage.getItem("theme");
  const dark = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.classList.toggle("dark", dark);

  function syncThemeButtons() {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.textContent = root.classList.contains("dark") ? "Light" : "Dark";
    });
  }
  syncThemeButtons();
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-theme-toggle]");
    if (!button) return;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    syncThemeButtons();
  });

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy-value]");
    if (!button) return;
    const value = button.getAttribute("data-copy-value") || "";
    try {
      await navigator.clipboard.writeText(value);
      const old = button.textContent;
      button.textContent = "Copied";
      setTimeout(() => { button.textContent = old || "Copy BibTeX"; }, 1500);
    } catch {}
  });

  const form = document.querySelector('form[data-static-search]') ||
    (location.pathname.includes('/search') ? document.querySelector('form') : null);
  if (form) {
    const input = form.querySelector('input[name="q"]');
    let host = document.querySelector('[data-static-search-results]');
    if (!host) {
      host = document.createElement('div');
      host.setAttribute('data-static-search-results', '');
      host.className = 'mt-10';
      form.insertAdjacentElement('afterend', host);
    }
    const render = async (query) => {
      const q = (query || '').trim().toLowerCase();
      if (!q) { host.innerHTML = ''; return; }
      const response = await fetch(BASE + "/search-index.json");
      const rows = await response.json();
      const terms = q.split(/\s+/).filter(Boolean);
      const matches = rows.filter((row) => terms.every((term) => (row.title + " " + row.text).toLowerCase().includes(term))).slice(0, 40);
      const safeQ = q.replace(/[<>&"]/g, '');
      const items = matches.map((row) => '<article class="py-5"><div class="text-xs font-bold uppercase tracking-[.14em] text-accent">' + row.type + '</div><a class="mt-1 block font-serif text-2xl" href="' + row.route + '">' + row.title + '</a></article>').join('');
      host.innerHTML = '<div class="mb-4 text-sm text-muted">' + matches.length + ' result' + (matches.length === 1 ? '' : 's') + ' for “' + safeQ + '”</div><div class="divide-y academic-rule border-y academic-rule">' + items + '</div>';
    };
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const q = input?.value || '';
      const url = new URL(location.href);
      if (q) url.searchParams.set('q', q); else url.searchParams.delete('q');
      history.replaceState(null, '', url);
      render(q);
    });
    const initial = new URLSearchParams(location.search).get('q') || '';
    if (input && initial) input.value = initial;
    if (initial) render(initial);
  }
})();`;
  await writeFile(path.join(outDir, "static-demo.js"), js, "utf8");
}

async function copyStaticDirectories() {
  if (existsSync(publicDir)) await cp(publicDir, outDir, { recursive: true, force: true });
  if (existsSync(uploadDir)) {
    const target = path.join(outDir, "uploads");
    await mkdir(target, { recursive: true });
    await cp(uploadDir, target, { recursive: true, force: true });
  }
}

async function emitPages() {
  for (const [route, source] of pages) {
    const html = rewriteHtml(source, route);
    const target = outPagePath(route);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, html, "utf8");

    const alias = aliasHtmlPath(route);
    if (alias) {
      await mkdir(path.dirname(alias), { recursive: true });
      await writeFile(alias, html, "utf8");
    }
  }
}

function outputPathForPublicUrl(urlPath) {
  if (!urlPath.startsWith(basePath)) return null;
  let rel = urlPath.slice(basePath.length) || "/";
  if (!rel.startsWith("/")) rel = `/${rel}`;
  rel = decodeURIComponent(rel.split("?")[0].split("#")[0]);
  if (rel === "/") return path.join(outDir, "index.html");
  const raw = path.join(outDir, rel.slice(1));
  if (rel.endsWith("/")) return path.join(raw, "index.html");
  if (existsSync(raw)) return raw;
  if (existsSync(`${raw}.html`)) return `${raw}.html`;
  if (existsSync(path.join(raw, "index.html"))) return path.join(raw, "index.html");
  return raw;
}

async function validateOutput() {
  const errors = [];
  const htmlFiles = [];
  async function walk(dir) {
    for (const name of await (await import("node:fs/promises")).readdir(dir)) {
      const full = path.join(dir, name);
      const info = await stat(full);
      if (info.isDirectory()) await walk(full);
      else if (name.endsWith(".html")) htmlFiles.push(full);
    }
  }
  await walk(outDir);

  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    const attrRe = /\b(?:href|src|action|poster|data)\s*=\s*(["'])(.*?)\1/gi;
    for (const m of html.matchAll(attrRe)) {
      const value = decodeEntities(m[2]);
      if (!value || /^(?:https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(value)) continue;
      if (value.startsWith("/")) {
        if (!value.startsWith(`${basePath}/`) && value !== basePath) {
          errors.push(`${path.relative(outDir, file)} contains unprefixed root URL: ${value}`);
          continue;
        }
        const u = new URL(value, "https://example.invalid");
        const target = outputPathForPublicUrl(u.pathname);
        if (!target || !existsSync(target)) errors.push(`${path.relative(outDir, file)} -> missing ${value}`);
      }
    }
  }

  const critical = ["/", "/research", "/people", "/publications", "/projects", "/news-events", "/join", "/about", "/contact", "/search"];
  for (const route of critical) {
    if (!pages.has(route)) errors.push(`Critical page was not crawled: ${route}`);
    const target = outPagePath(route);
    if (!existsSync(target)) errors.push(`Critical output missing: ${path.relative(outDir, target)}`);
  }

  const home = await readFile(path.join(outDir, "index.html"), "utf8");
  for (const expected of [`href="${basePath}/research/"`, `href="${basePath}/people/"`]) {
    if (!home.includes(expected)) errors.push(`Homepage is missing expected fixed link: ${expected}`);
  }

  if (errors.length) {
    console.error("\nSTATIC EXPORT VALIDATION FAILED:\n");
    for (const error of errors) console.error(` - ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`\nValidation passed: ${htmlFiles.length} HTML files checked; all internal root links use ${basePath}.`);
}

async function main() {
  console.log(`Exporting ${origin} -> ${outDir}`);
  console.log(`GitHub Pages base path: ${basePath}`);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  await copyStaticDirectories();
  await crawlPages();
  await crawlAssets();
  await rewriteCssAssets();
  await emitPages();
  await writeStaticHelpers();
  await writeFile(path.join(outDir, ".nojekyll"), "", "utf8");

  if (pages.has("/")) {
    const home = await readFile(path.join(outDir, "index.html"), "utf8");
    await writeFile(path.join(outDir, "404.html"), home, "utf8");
  }

  const hardFailures = failures.filter((line) => !/ASSET \/_next\//.test(line));
  if (hardFailures.length) {
    console.warn("\nCrawler warnings:");
    for (const line of hardFailures) console.warn(` - ${line}`);
  }

  await validateOutput();
  if (process.exitCode) return;
  console.log(`Pages crawled: ${pages.size}`);
  console.log(`Assets copied/fetched: ${assetMap.size}`);
}

await main();
