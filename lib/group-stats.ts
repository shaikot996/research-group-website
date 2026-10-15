import { readFile } from "node:fs/promises";
import path from "node:path";

export type ResearchGateAuthorStats = {
  name: string;
  inspireControlNumber: string;
  publications: number;
  citations: number;
  url: string;
  verifiedAt: string;
};

export type GroupCitationStats = {
  totalCitations: number | null;
  uniquePublications: number | null;
  updatedAt: string | null;
  researchGateAuthors: ResearchGateAuthorStats[];
};

async function readResearchGateStats(): Promise<ResearchGateAuthorStats[]> {
  try {
    // ResearchGate has no public API with dependable live citation totals.
    // This is a separately verified public-profile snapshot, not an INSPIRE replacement.
    const file = path.resolve(process.env.RESEARCHGATE_STATS_FILE || "data/researchgate-stats.json");
    const parsed = JSON.parse(await readFile(file, "utf8")) as { authors?: unknown };
    if (!Array.isArray(parsed.authors)) return [];
    return parsed.authors.filter((raw): raw is ResearchGateAuthorStats => {
      if (!raw || typeof raw !== "object") return false;
      const a = raw as Partial<ResearchGateAuthorStats>;
      return typeof a.name === "string" && Boolean(a.name.trim())
        && typeof a.inspireControlNumber === "string" && Boolean(a.inspireControlNumber.trim())
        && typeof a.publications === "number" && Number.isInteger(a.publications) && a.publications >= 0
        && typeof a.citations === "number" && Number.isInteger(a.citations) && a.citations >= 0
        && typeof a.url === "string" && /^https:\/\/www\.researchgate\.net\/profile\//.test(a.url)
        && typeof a.verifiedAt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(a.verifiedAt);
    });
  } catch {
    return [];
  }
}

export async function getResearchGateAuthorStats(inspireControlNumber: string): Promise<ResearchGateAuthorStats | null> {
  return (await readResearchGateStats()).find(author => author.inspireControlNumber === inspireControlNumber) ?? null;
}

export async function getGroupCitationStats(): Promise<GroupCitationStats> {
  const researchGateAuthors = await readResearchGateStats();
  const file = path.resolve(process.env.INSPIRE_STATS_FILE || "data/inspire-stats.json");
  try {
    const parsed = JSON.parse(await readFile(file, "utf8")) as Partial<GroupCitationStats>;
    return {
      totalCitations: typeof parsed.totalCitations === "number" && Number.isFinite(parsed.totalCitations) ? parsed.totalCitations : null,
      uniquePublications: typeof parsed.uniquePublications === "number" && Number.isFinite(parsed.uniquePublications) ? parsed.uniquePublications : null,
      updatedAt: parsed.updatedAt || null,
      researchGateAuthors,
    };
  } catch {
    return { totalCitations: null, uniquePublications: null, updatedAt: null, researchGateAuthors };
  }
}
