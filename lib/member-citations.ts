import { readFile } from "node:fs/promises";
import path from "node:path";
import { inspireAuthorId } from "@/lib/inspire";
import { resolveInspireUrl } from "@/lib/verified-inspire-profiles";

export type MemberCitationSummary = {
  citations: number;
  publications: number;
};

type AuthorRecord = {
  controlNumber?: string;
  records?: number;
  citations?: number;
};
type CitationSnapshot = { authors?: AuthorRecord[] };

/** Citation totals are attributed to each INSPIRE author, not divided across coauthors. */
export async function getMemberCitationMap(): Promise<Map<string, MemberCitationSummary>> {
  const result = new Map<string, MemberCitationSummary>();
  try {
    const file = path.resolve(process.env.INSPIRE_STATS_FILE || "data/inspire-stats.json");
    const snapshot = JSON.parse(await readFile(file, "utf8")) as CitationSnapshot;
    for (const author of snapshot.authors ?? []) {
      if (!author.controlNumber || typeof author.citations !== "number" ||
          !Number.isFinite(author.citations) || typeof author.records !== "number" ||
          !Number.isFinite(author.records)) continue;
      result.set(author.controlNumber, {
        citations: author.citations,
        publications: author.records,
      });
    }
  } catch { /* INSPIRE cache may not exist on a fresh local installation. */ }
  return result;
}

export function memberCitationFor(
  map: Map<string, MemberCitationSummary>,
  inspireUrl?: string | null,
  slug?: string | null,
): MemberCitationSummary | null {
  const id = inspireAuthorId(resolveInspireUrl(inspireUrl, slug));
  return id ? map.get(id) ?? null : null;
}
