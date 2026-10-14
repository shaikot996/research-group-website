/**
 * A single bibliographic record for each INSPIRE literature control number.
 * Journal and e-print metadata are shown together, as on INSPIRE.
 */
export type GroupInspirePublication = {
  id: string;
  title: string;
  authors: string;
  year: number;
  date: string;
  journal: string | null;
  arxiv: string | null;
  doi: string | null;
  citations: number;
  url: string;
};

type JsonObject = Record<string, unknown>;
export type GroupLiteratureHit = { id?: number | string; metadata?: JsonObject };
export type GroupPublicationSnapshot = {
  updatedAt: string | null;
  records: GroupInspirePublication[];
};

function objects(value: unknown): JsonObject[] {
  return Array.isArray(value)
    ? value.filter((item): item is JsonObject => !!item && typeof item === "object" && !Array.isArray(item))
    : [];
}
function string(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
function isoDate(value: unknown): string {
  const raw = string(value);
  if (!/^\d{4}(?:-\d{2})?(?:-\d{2})?$/.test(raw)) return "";
  return raw.length === 4 ? `${raw}-01-01` : raw.length === 7 ? `${raw}-01` : raw;
}
export function mapGroupPublication(hit: GroupLiteratureHit): GroupInspirePublication | null {
  const m = hit.metadata ?? {};
  const id = String(m.control_number ?? hit.id ?? "").trim();
  if (!/^\d+$/.test(id)) return null;
  const pub = objects(m.publication_info)[0] ?? {};
  const imprint = objects(m.imprints)[0] ?? {};
  const titles = objects(m.titles);
  const arxiv = objects(m.arxiv_eprints);
  const dois = objects(m.dois);
  const authorNames = objects(m.authors).map((author) => string(author.full_name)).filter(Boolean);
  const authors = authorNames.length > 8
    ? `${authorNames.slice(0, 8).join(", ")} et al.`
    : authorNames.join(", ");
  const dates = [
    isoDate(m.preprint_date),
    isoDate(imprint.date),
    isoDate(m.earliest_date),
    isoDate(String(pub.year ?? "")),
  ].filter(Boolean).sort().reverse();
  const date = dates[0] || "0000-01-01";
  const year = Number(date.slice(0, 4));
  const journal = [
    string(pub.journal_title),
    string(pub.journal_volume),
    string(pub.artid || pub.page_start || pub.pages),
  ].filter(Boolean).join(" ");
  const citationCount = Number(m.citation_count ?? 0);
  return {
    id,
    title: string(titles[0]?.title) || "Untitled INSPIRE record",
    authors,
    year: Number.isFinite(year) && year > 0 ? year : 0,
    date,
    journal: journal || null,
    arxiv: string(arxiv[0]?.value) || null,
    doi: string(dois[0]?.value) || null,
    citations: Number.isFinite(citationCount) && citationCount > 0 ? citationCount : 0,
    url: `https://inspirehep.net/literature/${id}`,
  };
}
/** Deduplicate shared papers across SAM members and sort newest to oldest. */
export function groupPublications(hits: GroupLiteratureHit[]): GroupInspirePublication[] {
  const unique = new Map<string, GroupInspirePublication>();
  for (const hit of hits) {
    const entry = mapGroupPublication(hit);
    if (!entry) continue;
    const old = unique.get(entry.id);
    if (!old || entry.citations > old.citations) unique.set(entry.id, entry);
  }
  return [...unique.values()].sort((a, b) =>
    b.date.localeCompare(a.date) || Number(b.id) - Number(a.id),
  );
}
