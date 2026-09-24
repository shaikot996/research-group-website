import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
if (Number(process.versions.node.split(".")[0]) < 22) throw new Error("Node.js 22 or later is required.");
if (!existsSync(".env")) writeFileSync(".env", readFileSync(".env.example", "utf8").replace("GENERATE_ON_SETUP", randomBytes(48).toString("hex")), { mode: 0o600 });
else {
  const env = readFileSync(".env", "utf8");
  if (env.includes("GENERATE_ON_SETUP")) writeFileSync(".env", env.replace("GENERATE_ON_SETUP", randomBytes(48).toString("hex")), { mode: 0o600 });
}
process.loadEnvFile(".env");
for (const dir of ["data", process.env.UPLOAD_DIR || "data/uploads", process.env.PEOPLE_PHOTO_DIR || "public/people"]) mkdirSync(resolve(dir), { recursive: true });
// Create a new SQLite file without overwriting an existing database.
if (process.env.DATABASE_URL?.startsWith("file:")) {
  const databasePath = resolve("prisma", process.env.DATABASE_URL.slice(5));
  mkdirSync(dirname(databasePath), { recursive: true });
  if (!existsSync(databasePath)) writeFileSync(databasePath, "", { flag: "wx", mode: 0o600 });
}
for (const args of [["run", "db:generate"], ["run", "db:push", "--", "--skip-generate"], ["run", "db:seed"]]) {
  const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", args, { stdio: "inherit", shell: process.platform === "win32", env: process.env });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log("Setup complete. Existing content is preserved. Run npm run dev for development, or npm run build followed by npm start.");
