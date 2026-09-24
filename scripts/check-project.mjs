import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const required = [
  "package.json",
  ".env.example",
  "README.md",
  "DEPLOYMENT.md",
  "scripts/setup.mjs",
  "scripts/serve.mjs",
  "scripts/smoke.mjs",
  "lib/site-defaults.ts",
  "lib/features.ts",
  "app/portraits/[slug]/route.ts",
  "public/people/README.md",
  "PROJECT_STRUCTURE.md",
  "VALIDATION.md",
  "run-local.sh",
  "Dockerfile",
  "docker-compose.yml",
  "deploy/nginx.conf.example",
  "data/member-sources.json",
  "lib/inspire.ts",
  "prisma/schema.prisma",
  "prisma/seed.ts",
  "scripts/create-admin.ts",
  "scripts/reset-admin.ts",
  "scripts/docker-entrypoint.sh",
  "app/page.tsx",
  "app/layout.tsx",
  "app/globals.css",
  "app/api/auth/[...nextauth]/route.ts",
  "app/admin/(protected)/page.tsx",
  "app/admin/(protected)/people/page.tsx",
  "app/admin/(protected)/publications/page.tsx",
  "app/admin/(protected)/projects/page.tsx",
  "app/admin/(protected)/research/page.tsx",
  "app/admin/(protected)/news/page.tsx",
  "app/admin/(protected)/events/page.tsx",
  "app/admin/(protected)/pages/page.tsx",
  "app/admin/(protected)/media/page.tsx",
  "app/admin/(protected)/settings/page.tsx",
  "public/uploads/.gitkeep",
  "data/.gitkeep",
];

const missing = [];
for (const file of required) {
  try {
    await access(path.join(root, file));
  } catch {
    missing.push(file);
  }
}
if (missing.length) {
  console.error("Missing required project files:\n" + missing.map((x) => ` - ${x}`).join("\n"));
  process.exit(1);
}

const schema = await readFile(path.join(root, "prisma/schema.prisma"), "utf8");
const models = [
  "User",
  "Person",
  "ResearchGrant",
  "ResearchArea",
  "Publication",
  "Project",
  "NewsPost",
  "Event",
  "Page",
  "Media",
  "SiteSetting",
];
const missingModels = models.filter((model) => !schema.includes(`model ${model}`));
if (missingModels.length) {
  console.error("Missing Prisma models: " + missingModels.join(", "));
  process.exit(1);
}

const seed = await readFile(path.join(root, "prisma/seed.ts"), "utf8");
const publicMembers = [
  ["Mahbubul Alam Majumdar", "1023635"],
  ["Syed Hasibul Hassan Chowdhury", "1511186"],
  ["Ahmed Rakin Kamal", "2763317"],
  ["Sayeda Tashnuba Jahan", "3088919"],
  ["Mishaal Hai", "2931658"],
  ["Md Shaikot Jahan Shuvo", "2648798"],
];

if (!seed.includes('role: "PRINCIPAL_INVESTIGATOR"') || !seed.includes("Research Seed Grant Initiative (RSGI)")) {
  console.error("PI/RSGI seed metadata is incomplete.");
  process.exit(1);
}

for (const [name, id] of publicMembers) {
  if (!seed.includes(name) || !seed.includes(`/authors/${id}`)) {
    console.error(`Public member seed is incomplete for ${name} / INSPIRE ${id}.`);
    process.exit(1);
  }
}

const routes = [];
const sourceFiles = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
    } else {
      const normalized = full.replaceAll("\\", "/");
      if (/\/(page|route)\.tsx?$/.test(normalized)) routes.push(path.relative(root, full));
      if (/\.(ts|tsx|mjs)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) sourceFiles.push(full);
    }
  }
}
await walk(root);
if (routes.length < 20) {
  console.error(`Expected a full route tree; found only ${routes.length} page/route files.`);
  process.exit(1);
}

function localCandidates(specifier, importingFile) {
  let base;
  if (specifier.startsWith("@/")) base = path.join(root, specifier.slice(2));
  else if (specifier.startsWith(".")) base = path.resolve(path.dirname(importingFile), specifier);
  else return [];
  return [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.mjs`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
    path.join(base, "index.mjs"),
  ];
}

const unresolved = [];
for (const file of sourceFiles) {
  const text = await readFile(file, "utf8");
  const importPattern = /(?:from\s+|import\s*\()(["'])([^"']+)\1/g;
  for (const match of text.matchAll(importPattern)) {
    const specifier = match[2];
    const candidates = localCandidates(specifier, file);
    if (!candidates.length) continue;
    let found = false;
    for (const candidate of candidates) {
      try {
        await access(candidate);
        found = true;
        break;
      } catch {}
    }
    if (!found) unresolved.push(`${path.relative(root, file)} -> ${specifier}`);
  }
}
if (unresolved.length) {
  console.error("Unresolved local imports:\n" + unresolved.map((x) => ` - ${x}`).join("\n"));
  process.exit(1);
}

// When dependencies are installed, this script also performs a parser-level TypeScript pass.
try {
  const ts = await import("typescript");
  const syntaxErrors = [];
  for (const file of sourceFiles.filter((file) => /\.(ts|tsx)$/.test(file))) {
    const source = await readFile(file, "utf8");
    const result = ts.transpileModule(source, {
      fileName: file,
      reportDiagnostics: true,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.Preserve,
      },
    });
    for (const diagnostic of result.diagnostics ?? []) {
      if (diagnostic.category !== ts.DiagnosticCategory.Error) continue;
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, " ");
      syntaxErrors.push(`${path.relative(root, file)}: TS${diagnostic.code} ${message}`);
    }
  }
  if (syntaxErrors.length) {
    console.error("TypeScript parser errors:\n" + syntaxErrors.map((x) => ` - ${x}`).join("\n"));
    process.exit(1);
  }
} catch {
  // npm install has not completed yet; structural checks above still run.
}

console.log(
  `Project integrity check passed: ${required.length} required files, ${models.length} core models, ${publicMembers.length} public members, ${routes.length} app routes, ${sourceFiles.length} source files.`,
);
