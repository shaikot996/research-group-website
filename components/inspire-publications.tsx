"use client";
import { useState } from "react";
import type { InspireArticleResult } from "@/lib/inspire";
export function InspirePublications({ slug, profileUrl }: { slug: string; profileUrl: string }) {
  const [result, setResult] = useState<InspireArticleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  async function load() {
    if (result || loading || failed) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/people/${encodeURIComponent(slug)}/publications`);
      if (!response.ok) throw new Error("Unavailable");
      const data: InspireArticleResult = await response.json();
      setResult(data); setFailed(data.error);
    } catch { setFailed(true); }
    finally { setLoading(false); }
  }
  return <section className="mt-14"><div className="mb-8"><div className="mb-3 text-xs font-bold uppercase tracking-[.18em] text-accent">INSPIRE-HEP</div><h2 className="section-heading">Complete publication record</h2></div>
    <details className="border-y academic-rule" onToggle={event => { if (event.currentTarget.open) void load(); }}><summary className="cursor-pointer py-5 font-serif text-xl">All INSPIRE articles{result && !failed ? ` (${result.total})` : ""}</summary>
      <div className="pb-6" aria-live="polite">{loading && <p className="py-4 text-sm text-muted">Loading publications…</p>}{failed && <p className="py-4 text-sm text-muted">The publication feed is temporarily unavailable. <a className="link-academic" href={profileUrl}>View the INSPIRE author record →</a></p>}
        {result && !failed && result.articles.map(article => <article key={article.id || article.url} className="border-t academic-rule py-5"><div className="text-xs text-muted">{article.year}</div><a href={article.url} className="font-serif text-xl">{article.title}</a><p className="mt-2 text-sm text-muted">{article.authors}</p><div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">{article.journal && <span>{article.journal}</span>}{article.arxiv && <a className="link-academic" href={`https://arxiv.org/abs/${article.arxiv}`}>arXiv:{article.arxiv}</a>}{article.doi && <a className="link-academic" href={`https://doi.org/${article.doi}`}>DOI</a>}{article.citations !== undefined && <span>{article.citations} citations</span>}</div></article>)}
        {result && !failed && result.articles.length === 0 && <p className="py-4 text-sm text-muted">No linked articles were returned.</p>}
        <a className="mt-4 inline-block link-academic text-sm" href={result?.searchUrl || profileUrl}>Open complete record on INSPIRE →</a>
        {result?.truncated && <p className="mt-2 text-xs text-muted">Additional records are available on INSPIRE.</p>}
      </div>
    </details>
  </section>;
}
