import { readFile } from "node:fs/promises";
import path from "node:path";

export type GroupCitationStats = {
  totalCitations: number | null;
  uniquePublications: number | null;
  updatedAt: string | null;
};

export async function getGroupCitationStats(): Promise<GroupCitationStats> {
  const file = path.resolve(process.env.INSPIRE_STATS_FILE || "data/inspire-stats.json");
  try {
    const parsed = JSON.parse(await readFile(file, "utf8")) as GroupCitationStats;
    return {
      totalCitations: Number.isFinite(parsed.totalCitations) ? parsed.totalCitations : null,
      uniquePublications: Number.isFinite(parsed.uniquePublications) ? parsed.uniquePublications : null,
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return { totalCitations: null, uniquePublications: null, updatedAt: null };
  }
}
