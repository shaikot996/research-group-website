import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

if (process.env.NODE_ENV !== "production") {
  try { process.loadEnvFile(".env"); } catch { /* CI can provide env directly. */ }
}

type AuthorConfig = { name: string; controlNumber: string };
type LiteratureHit = { id?: string | number; metadata?: { control_number?: number; citation_count?: number } };
type AuthorApiRecord = {
  metadata?: {
    ids?: Array<{ schema?: string; value?: string }>;
  };
};
type Output = {
  totalCitations: number | null;
  uniquePublications: number | null;
  updatedAt: string | null;
  authors: Array<{ name: string; controlNumber: string; bai?: string | null; records?: number }>;
};

const configPath = path.resolve(process.env.INSPIRE_AUTHORS_FILE || "config/inspire-authors.json");
const outputPath = path.resolve(process.env.INSPIRE_STATS_FILE || "data/inspire-stats.json");
const force = process.argv.includes("--force");
const maxAgeMs = Number(process.env.INSPIRE_REFRESH_HOURS || "24") * 60 * 60 * 1000;
const userAgent = "SAM-Research-Group-Website/1.1";

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function readOutput(): Promise<Output | null> {
  try { return JSON.parse(await readFile(outputPath, "utf8")) as Output; } catch { return null; }
}

async function fetchJson<T>(url: string, label: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": userAgent,
        },
        signal: AbortSignal.timeout(20_000),
      });

      if (response.ok) {
        const json = await response.json() as T;
        // INSPIRE documents a per-IP request limit. A small spacing keeps the
        // six-author group refresh comfortably below that limit.
        await sleep(400);
        return json;
      }

      const body = await response.text();
      if (response.status === 429 || response.status >= 500) {
        const retryAfter = Number(response.headers.get("retry-after"));
        const delay = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : attempt * 1500;
        lastError = new Error(`${label}: HTTP ${response.status} ${body}`);
        await sleep(delay);
        continue;
      }

      throw new Error(`${label}: HTTP ${response.status} ${body}`);
    } catch (error) {
      lastError = error;
      if (attempt < 4) {
        await sleep(attempt * 1200);
        continue;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`${label}: request failed`);
}

async function fetchAuthorBai(author: AuthorConfig): Promise<string | null> {
  const json = await fetchJson<AuthorApiRecord>(
    `https://inspirehep.net/api/authors/${encodeURIComponent(author.controlNumber)}`,
    `INSPIRE author lookup failed for ${author.name}`,
  );
  return json.metadata?.ids?.find(id => id.schema === "INSPIRE BAI")?.value?.trim() || null;
}

async function fetchLiteraturePage(query: string, page: number) {
  const params = new URLSearchParams({
    q: query,
    fields: "control_number,citation_count",
    size: "250",
    page: String(page),
    sort: "mostrecent",
  });
  return fetchJson<{
    hits?: { hits?: LiteratureHit[]; total?: number | { value?: number } };
  }>(
    `https://inspirehep.net/api/literature?${params}`,
    `INSPIRE literature query failed (${query}, page ${page})`,
  );
}

async function fetchAuthorLiterature(author: AuthorConfig) {
  // Resolve the stable author record to its INSPIRE BAI first. INSPIRE's own
  // documented literature-search syntax uses `a <BAI>` for an exact author.
  // This is more robust than depending on the internal nested $ref encoding.
  const bai = await fetchAuthorBai(author);
  const primaryQuery = bai ? `a ${bai}` : `authors.record.$ref:${author.controlNumber}`;

  async function collect(query: string) {
    const records: LiteratureHit[] = [];
    let page = 1;
    while (true) {
      const payload = await fetchLiteraturePage(query, page);
      const hits = payload.hits?.hits || [];
      records.push(...hits);
      const totalRaw = payload.hits?.total;
      const total = typeof totalRaw === "number" ? totalRaw : totalRaw?.value || records.length;
      if (!hits.length || records.length >= total) break;
      page += 1;
      if (page > 100) throw new Error(`INSPIRE pagination safety limit reached for ${author.name}.`);
    }
    return records;
  }

  let records = await collect(primaryQuery);

  // Defensive fallback for an unusual author record that lacks a BAI or has
  // an indexing lag. This preserves the stable control-number based path.
  if (records.length === 0 && bai) {
    records = await collect(`authors.record.$ref:${author.controlNumber}`);
  }

  return { records, bai };
}

async function main() {
  const previous = await readOutput();
  if (!force && previous?.updatedAt && previous.totalCitations !== null) {
    const age = Date.now() - new Date(previous.updatedAt).getTime();
    if (Number.isFinite(age) && age >= 0 && age < maxAgeMs) {
      console.log(`[inspire] Cache is ${Math.round(age / 3600000)}h old; refresh interval not reached.`);
      return;
    }
  }

  const authors = JSON.parse(await readFile(configPath, "utf8")) as AuthorConfig[];
  if (!Array.isArray(authors) || !authors.length) throw new Error("No INSPIRE authors configured.");

  const papers = new Map<string, number>();
  const resolvedAuthors: Output["authors"] = [];

  for (const author of authors) {
    const { records, bai } = await fetchAuthorLiterature(author);
    for (const record of records) {
      const key = String(record.metadata?.control_number ?? record.id ?? "");
      if (!key) continue;
      const citations = Number(record.metadata?.citation_count ?? 0);
      papers.set(key, Math.max(papers.get(key) ?? 0, Number.isFinite(citations) ? citations : 0));
    }
    resolvedAuthors.push({ ...author, bai, records: records.length });
    console.log(`[inspire] ${author.name}${bai ? ` [${bai}]` : ""}: ${records.length} literature record(s)`);
  }

  const output: Output = {
    totalCitations: [...papers.values()].reduce((sum, value) => sum + value, 0),
    uniquePublications: papers.size,
    updatedAt: new Date().toISOString(),
    authors: resolvedAuthors,
  };

  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`[inspire] Total citations: ${output.totalCitations} across ${output.uniquePublications} unique publication(s).`);
}

main().catch(async error => {
  const previous = await readOutput();
  if (previous?.totalCitations !== null && previous?.totalCitations !== undefined) {
    console.error(`[inspire] Refresh failed; retaining last successful cache from ${previous.updatedAt}:`, error);
    return;
  }
  console.error("[inspire] Initial citation refresh failed; no usable cache exists yet.", error);
  process.exitCode = 1;
});
