export type InspireArticle = {
  id: string;
  title: string;
  authors: string;
  year?: number;
  journal?: string;
  arxiv?: string;
  doi?: string;
  citations?: number;
  url: string;
};

export type InspireArticleResult = {
  authorId: string | null;
  bai?: string | null;
  searchUrl: string | null;
  total: number;
  articles: InspireArticle[];
  truncated: boolean;
  error: boolean;
};

type LiteratureHit = { id?: string | number; metadata?: Record<string, unknown> };
type LiteratureResponse = { hits?: { total?: unknown; hits?: LiteratureHit[] } };

export function inspireAuthorId(profileUrl?: string | null) {
  if (!profileUrl) return null;
  return profileUrl.match(/\/authors\/(\d+)/)?.[1] ?? null;
}

function totalValue(total: unknown): number {
  if (typeof total === "number") return total;
  if (total && typeof total === "object" && "value" in total) {
    const value = Number((total as { value?: unknown }).value);
    return Number.isFinite(value) ? value : 0;
  }
  return 0;
}

function firstString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function recordId(hit: LiteratureHit): string {
  const controlNumber = Number(hit.metadata?.control_number);
  if (Number.isFinite(controlNumber) && controlNumber > 0) return String(controlNumber);
  return String(hit.id ?? "");
}

async function fetchBai(authorId: string) {
  try {
    const response = await fetch(`https://inspirehep.net/api/authors/${authorId}`, {
      headers: { Accept: "application/json", "User-Agent": "SAM-Research-Group-Website/1.2" },
      signal: AbortSignal.timeout(12_000),
      next: { revalidate: 86400 },
    });
    if (!response.ok) return null;
    const json = await response.json() as { metadata?: { ids?: Array<{ schema?: string; value?: string }> } };
    return json.metadata?.ids?.find((id) => id.schema === "INSPIRE BAI")?.value?.trim() || null;
  } catch {
    return null;
  }
}

async function fetchLiteraturePage(query: string, page: number): Promise<LiteratureResponse> {
  const params = new URLSearchParams({
    q: query,
    sort: "mostrecent",
    size: "250",
    page: String(page),
  });
  const response = await fetch(`https://inspirehep.net/api/literature?${params}`, {
    headers: { Accept: "application/json", "User-Agent": "SAM-Research-Group-Website/1.2" },
    signal: AbortSignal.timeout(15_000),
    next: { revalidate: 21600 },
  });
  if (!response.ok) throw new Error(`INSPIRE returned HTTP ${response.status}`);
  return response.json() as Promise<LiteratureResponse>;
}

async function fetchAllLiterature(query: string) {
  const byRecord = new Map<string, LiteratureHit>();
  let page = 1;
  let expectedTotal = 0;

  while (true) {
    const json = await fetchLiteraturePage(query, page);
    const hits = json.hits?.hits ?? [];
    expectedTotal = Math.max(expectedTotal, totalValue(json.hits?.total));

    for (const hit of hits) {
      const id = recordId(hit);
      if (id) byRecord.set(id, hit);
    }

    if (!hits.length || byRecord.size >= expectedTotal) break;
    page += 1;
    if (page > 100) throw new Error(`INSPIRE pagination safety limit reached for query: ${query}`);
  }

  return { hits: [...byRecord.values()], total: expectedTotal || byRecord.size };
}

function mapArticles(hits: LiteratureHit[], searchUrl: string) {
  return hits.map((hit): InspireArticle => {
    const metadata = hit.metadata ?? {};
    const titles = Array.isArray(metadata.titles) ? metadata.titles as Array<Record<string, unknown>> : [];
    const authorsRaw = Array.isArray(metadata.authors) ? metadata.authors as Array<Record<string, unknown>> : [];
    const publicationInfo = Array.isArray(metadata.publication_info) ? metadata.publication_info as Array<Record<string, unknown>> : [];
    const arxivRaw = Array.isArray(metadata.arxiv_eprints) ? metadata.arxiv_eprints as Array<Record<string, unknown>> : [];
    const doiRaw = Array.isArray(metadata.dois) ? metadata.dois as Array<Record<string, unknown>> : [];
    const imprints = Array.isArray(metadata.imprints) ? metadata.imprints as Array<Record<string, unknown>> : [];

    const authorNames = authorsRaw
      .map((author) => firstString(author.full_name))
      .filter((name): name is string => Boolean(name));
    const authors = authorNames.length > 8
      ? `${authorNames.slice(0, 8).join(", ")} et al.`
      : authorNames.join(", ");

    const pub = publicationInfo[0] ?? {};
    const imprint = imprints[0] ?? {};
    const yearCandidate = Number(pub.year ?? firstString(imprint.date)?.slice(0, 4) ?? firstString(metadata.preprint_date)?.slice(0, 4));
    const year = Number.isFinite(yearCandidate) && yearCandidate > 0 ? yearCandidate : undefined;
    const journalTitle = firstString(pub.journal_title);
    const journalVolume = firstString(pub.journal_volume);
    const journal = [journalTitle, journalVolume].filter(Boolean).join(" ") || undefined;
    const id = recordId(hit);
    const citationCount = Number(metadata.citation_count);

    return {
      id,
      title: firstString(titles[0]?.title) ?? "Untitled INSPIRE record",
      authors,
      year,
      journal,
      arxiv: firstString(arxivRaw[0]?.value),
      doi: firstString(doiRaw[0]?.value),
      citations: Number.isFinite(citationCount) ? citationCount : undefined,
      url: id ? `https://inspirehep.net/literature/${id}` : searchUrl,
    };
  });
}

export async function getInspireArticles(profileUrl?: string | null): Promise<InspireArticleResult> {
  const authorId = inspireAuthorId(profileUrl);
  if (!authorId) {
    return { authorId: null, bai: null, searchUrl: null, total: 0, articles: [], truncated: false, error: false };
  }

  try {
    const bai = await fetchBai(authorId);
    const primaryQuery = bai ? `a ${bai}` : `authors.record.$ref:${authorId}`;
    let query = primaryQuery;
    let result = await fetchAllLiterature(query);

    // The BAI is INSPIRE's author-level identifier and is the primary path.
    // Fall back to the stable author record only if the BAI path yields nothing.
    if (result.total === 0 && bai) {
      query = `authors.record.$ref:${authorId}`;
      result = await fetchAllLiterature(query);
    }

    const searchUrl = `https://inspirehep.net/literature?q=${encodeURIComponent(query)}&sort=mostrecent`;
    const articles = mapArticles(result.hits, searchUrl);

    return {
      authorId,
      bai,
      searchUrl,
      total: articles.length,
      articles,
      truncated: false,
      error: false,
    };
  } catch {
    const searchUrl = `https://inspirehep.net/literature?q=${encodeURIComponent(`authors.record.$ref:${authorId}`)}&sort=mostrecent`;
    return { authorId, bai: null, searchUrl, total: 0, articles: [], truncated: false, error: true };
  }
}
