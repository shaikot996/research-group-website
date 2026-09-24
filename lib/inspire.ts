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
  searchUrl: string | null;
  total: number;
  articles: InspireArticle[];
  truncated: boolean;
  error: boolean;
};

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

async function fetchBai(authorId: string) {
  try {
    const response = await fetch(`https://inspirehep.net/api/authors/${authorId}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 86400 },
    });
    if (!response.ok) return null;
    const json = await response.json() as { metadata?: { ids?: Array<{ schema?: string; value?: string }> } };
    return json.metadata?.ids?.find((id) => id.schema === "INSPIRE BAI")?.value ?? null;
  } catch {
    return null;
  }
}

async function fetchLiterature(query: string) {
  const apiUrl = `https://inspirehep.net/api/literature?q=${encodeURIComponent(query)}&sort=mostrecent&size=250`;
  const response = await fetch(apiUrl, {
    headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    next: { revalidate: 21600 },
  });
  if (!response.ok) throw new Error(`INSPIRE returned HTTP ${response.status}`);
  return response.json() as Promise<{
    hits?: {
      total?: unknown;
      hits?: Array<{ id?: string | number; metadata?: Record<string, unknown> }>;
    };
  }>;
}

function mapArticles(json: Awaited<ReturnType<typeof fetchLiterature>>, searchUrl: string) {
  const hits = json.hits?.hits ?? [];
  const total = totalValue(json.hits?.total);
  const articles = hits.map((hit): InspireArticle => {
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
    const yearCandidate = Number(pub.year ?? imprint.date ?? String(metadata.preprint_date ?? "").slice(0, 4));
    const year = Number.isFinite(yearCandidate) && yearCandidate > 0 ? yearCandidate : undefined;
    const journalTitle = firstString(pub.journal_title);
    const journalVolume = firstString(pub.journal_volume);
    const journal = [journalTitle, journalVolume].filter(Boolean).join(" ") || undefined;
    const id = String(hit.id ?? metadata.control_number ?? "");
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
  return { total: total || articles.length, articles };
}

export async function getInspireArticles(profileUrl?: string | null): Promise<InspireArticleResult> {
  const authorId = inspireAuthorId(profileUrl);
  if (!authorId) {
    return { authorId: null, searchUrl: null, total: 0, articles: [], truncated: false, error: false };
  }

  const recordQuery = `authors.record.$ref:${authorId}`;
  let query = recordQuery;
  let searchUrl = `https://inspirehep.net/literature?q=${encodeURIComponent(query)}&sort=mostrecent`;

  try {
    let json = await fetchLiterature(query);
    let mapped = mapArticles(json, searchUrl);

    // Older or differently-indexed INSPIRE records can be easier to resolve by BAI.
    // The BAI fallback still comes from the exact author record selected in the CMS.
    if (mapped.total === 0) {
      const bai = await fetchBai(authorId);
      if (bai) {
        query = `a ${bai}`;
        searchUrl = `https://inspirehep.net/literature?q=${encodeURIComponent(query)}&sort=mostrecent`;
        json = await fetchLiterature(query);
        mapped = mapArticles(json, searchUrl);
      }
    }

    return {
      authorId,
      searchUrl,
      total: mapped.total,
      articles: mapped.articles,
      truncated: mapped.total > mapped.articles.length,
      error: false,
    };
  } catch {
    return { authorId, searchUrl, total: 0, articles: [], truncated: false, error: true };
  }
}
