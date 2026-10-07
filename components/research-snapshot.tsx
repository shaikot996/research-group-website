type ResearchSnapshotProps = {
  people: number;
  publications: number;
  activeProjects: number;
  researchAreas: number;
  totalCitations: number | null;
  updatedAt?: string | null;
  className?: string;
};

export function ResearchSnapshot({
  people,
  publications,
  activeProjects,
  researchAreas,
  totalCitations,
  updatedAt,
  className = "",
}: ResearchSnapshotProps) {
  return (
    <section className={`border-t-2 academic-rule pt-5 ${className}`.trim()}>
      <div className="text-xs font-bold uppercase tracking-[.18em] text-accent">Research Snapshot</div>
      <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-7">
        <div><dt className="text-xs text-muted">People</dt><dd className="font-serif text-4xl">{people}</dd></div>
        <div><dt className="text-xs text-muted">Publications</dt><dd className="font-serif text-4xl">{publications}</dd></div>
        <div><dt className="text-xs text-muted">Active projects</dt><dd className="font-serif text-4xl">{activeProjects}</dd></div>
        <div><dt className="text-xs text-muted">Research areas</dt><dd className="font-serif text-4xl">{researchAreas}</dd></div>
        <div className="col-span-2"><dt className="text-xs text-muted">Total citations</dt><dd className="font-serif text-4xl">{totalCitations ?? "—"}</dd></div>
      </dl>
      {updatedAt && <p className="mt-5 text-[11px] leading-5 text-muted">INSPIRE snapshot updated {new Date(updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.</p>}
    </section>
  );
}
