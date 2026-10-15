import type { ResearchGateAuthorStats } from "@/lib/group-stats";

type ResearchSnapshotProps = {
  people: number;
  publications: number;
  activeProjects: number;
  researchAreas: number;
  totalCitations: number | null;
  updatedAt?: string | null;
  researchGateAuthors?: ResearchGateAuthorStats[];
  className?: string;
};

export function ResearchSnapshot({
  people,
  publications,
  activeProjects,
  researchAreas,
  totalCitations,
  updatedAt,
  researchGateAuthors = [],
  className = "",
}: ResearchSnapshotProps) {
  return (
    <section className={`border-t-2 academic-rule pt-5 ${className}`.trim()}>
      <div className="text-xs font-bold uppercase tracking-[.18em] text-accent">Research Snapshot</div>
      <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-7">
        <div><dt className="text-xs text-muted">People</dt><dd className="font-serif text-4xl">{people}</dd></div>
        <div><dt className="text-xs text-muted">INSPIRE publications</dt><dd className="font-serif text-4xl">{publications}</dd></div>
        <div><dt className="text-xs text-muted">Active projects</dt><dd className="font-serif text-4xl">{activeProjects}</dd></div>
        <div><dt className="text-xs text-muted">Research areas</dt><dd className="font-serif text-4xl">{researchAreas}</dd></div>
        <div className="col-span-2"><dt className="text-xs text-muted">INSPIRE citations (distinct records)</dt><dd className="font-serif text-4xl">{totalCitations?.toLocaleString("en-US") ?? "—"}</dd></div>
      </dl>
      {updatedAt && <p className="mt-5 text-[11px] leading-5 text-muted">INSPIRE snapshot updated {new Date(updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.</p>}
      {researchGateAuthors.length > 0 && (
        <div className="mt-6 border-t academic-rule pt-5">
          <div className="text-xs font-bold uppercase tracking-[.14em] text-accent">Additional ResearchGate coverage</div>
          {researchGateAuthors.map(author => (
            <div key={author.inspireControlNumber} className="mt-4">
              <a href={author.url} target="_blank" rel="noopener noreferrer" className="link-academic text-sm font-semibold">{author.name} ↗</a>
              <dl className="mt-3 grid grid-cols-2 gap-4">
                <div><dt className="text-xs text-muted">RG publications</dt><dd className="font-serif text-3xl">{author.publications}</dd></div>
                <div><dt className="text-xs text-muted">RG citations</dt><dd className="font-serif text-3xl">{author.citations.toLocaleString("en-US")}</dd></div>
              </dl>
              <p className="mt-2 text-[11px] text-muted">Public ResearchGate snapshot checked {author.verifiedAt}.</p>
            </div>
          ))}
          <p className="mt-3 text-[11px] leading-5 text-muted">ResearchGate and INSPIRE overlap. Source totals are shown separately, not summed or presented as distinct combined publications.</p>
        </div>
      )}
    </section>
  );
}
