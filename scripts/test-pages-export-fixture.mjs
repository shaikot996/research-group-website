// Offline regression test: the GitHub Pages exporter must produce root-relative assets.
import http from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import assert from "node:assert/strict";

const dir = await mkdtemp(path.join(os.tmpdir(), "sam-pages-root-"));
const routes = ["research", "people", "publications", "projects", "news-events", "join", "about", "contact", "search"];
const html = (name) => `<!doctype html><html><head><title>${name}</title><link rel="stylesheet" href="/_next/static/chunks/main.css"></head><body><h1>${name}</h1><nav>${routes.map(r=>`<a href="/${r}/">${r}</a>`).join("")}</nav><a href="/">Home</a><img src="/test.svg"><script src="/_next/static/chunks/main.js"></script></body></html>`;
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  if (pathname === "/" || routes.some(r=> pathname === `/${r}` || pathname === `/${r}/`)) {
    res.writeHead(200, {"content-type":"text/html; charset=utf-8"});
    res.end(html(pathname === "/" ? "Home" : pathname));
  } else if (pathname === "/_next/static/chunks/main.css") {
    res.writeHead(200, {"content-type":"text/css"});
    res.end('body{font-family:Test} @font-face{font-family:Test;src:url("/test.woff2")}');
  } else if (pathname === "/test.woff2") {
    res.writeHead(200, {"content-type":"font/woff2"}); res.end(Buffer.from("FAKEFONT"));
  } else if (pathname === "/sitemap.xml") {
    res.writeHead(200, {"content-type":"application/xml"});
    res.end('<urlset><url><loc>https://sam.cse.bracu.ac.bd/</loc></url></urlset>');
  } else if (pathname === "/robots.txt") {
    res.writeHead(200, {"content-type":"text/plain"});
    res.end('User-agent: *\nSitemap: https://sam.cse.bracu.ac.bd/sitemap.xml');
  } else if (pathname === "/feed.xml") {
    res.writeHead(200, {"content-type":"application/xml"});
    res.end('<rss version="2.0"><channel><title>SAM</title></channel></rss>');
  } else if (pathname === "/test.svg") {
    res.writeHead(200, {"content-type":"image/svg+xml"}); res.end('<svg xmlns="http://www.w3.org/2000/svg"/>');
  } else {
    res.writeHead(404, {"content-type":"text/plain"}); res.end("Not found");
  }
});
try {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  // spawnSync would block this server's event loop; instead spawn asynchronously.
  const { spawn } = await import("node:child_process");
  const execute = async (file) => new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [file], {cwd: process.cwd(), env:{...process.env, EXPORT_ORIGIN:`http://127.0.0.1:${port}`, GITHUB_PAGES_BASE_PATH:"", EXPORT_OUT_DIR:dir}});
    let stdout = "", stderr = "";
    proc.stdout.on("data", b => stdout += b.toString());
    proc.stderr.on("data", b => stderr += b.toString());
    proc.on("error", reject);
    proc.on("close", code => code === 0 ? resolve(stdout) : reject(new Error(`${file} exit ${code}:\n${stdout}\n${stderr}`)));
  });
  const result = await execute("scripts/export-github-pages.mjs");
  await execute("scripts/verify-pages-export.mjs");
  const homepage = await readFile(path.join(dir, "index.html"), "utf8");
  const stylesheet = await readFile(path.join(dir, "_next/static/chunks/main.css"), "utf8");
  assert.match(homepage, /href="\/_next\/static\/chunks\/main\.css"/);
  assert.match(homepage, /href="\/people\/"/);
  assert.match(homepage, /src="\/static-demo\.js"/);
  assert.doesNotMatch(homepage, /\/research-group-website\//);
  assert.match(stylesheet, /url\("\/test\.woff2"\)/);
  assert.equal((await readFile(path.join(dir, "CNAME"), "utf8")).trim(), "sam.cse.bracu.ac.bd");
  console.log("PASS: offline root-domain export, CSS, font URL, navigation, static JS and CNAME");
  console.log(result.split("\n").filter(l=>l.includes("Validation passed") || l.includes("Pages crawled") || l.includes("Assets copied")).join("\n"));
} finally {
  server.close();
  await rm(dir, {recursive:true, force:true});
}
