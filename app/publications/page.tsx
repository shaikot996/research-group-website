export const metadata:Metadata={title:"Research Publications",description:"Publications and preprints from the SAM Research Group at BRAC University in mathematical physics, string theory and cosmology.",alternates:{canonical:"/publications/"}};
import type {Metadata} from "next";
import { prisma } from "@/lib/db";
import { SectionHeader } from "@/components/ui";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { GroupPublicationSnapshot } from "@/lib/inspire-publication-snapshot";

type Q = { q?: string; year?: string; author?: string };
export default async function Page({ searchParams }: { searchParams: Promise<Q> }) {
  const filters = await searchParams;
  let snapshot: GroupPublicationSnapshot = { updatedAt: null, records: [] };
  try {
    snapshot = JSON.parse(await readFile(path.resolve("data/inspire-publications.json"), "utf8")) as GroupPublicationSnapshot;
  } catch { /* The seeded bibliography remains visible until the first successful INSPIRE refresh. */ }
  const query = (filters.q || "").toLowerCase().trim();
  const author = (filters.author || "").toLowerCase().trim();
  const years = [...new Set(snapshot.records.map(p => p.year).filter(Boolean))].sort((a,b) => b-a);
  const records = snapshot.records.filter(p =>
    (!query || [p.title, p.authors, p.journal || "", p.arxiv || ""].join(" ").toLowerCase().includes(query)) &&
    (!author || p.authors.toLowerCase().includes(author)) &&
    (!filters.year || String(p.year) === filters.year)
  );
  const fallback = snapshot.records.length === 0 ? await prisma.publication.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ year: "desc" }, { sortOrder: "asc" }],
  }) : [];

  return <div className="container-site section-space">
    <SectionHeader eyebrow="Scholarship" title="Publications" description="Complete, chronological publication list from the verified INSPIRE-HEP profiles of SAM members. Preprints and their journal versions appear as one bibliographic record." />
    <p className="mb-7 border-l-2 academic-rule pl-4 text-xs leading-6 text-muted">
      Newest records first · Shared papers are listed only once · Automatically synchronized with INSPIRE-HEP
      {snapshot.updatedAt ? ` · Last updated ${new Date(snapshot.updatedAt).toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" })}` : ""}
    </p>
    <form method="get" className="mb-10 grid gap-3 border-y academic-rule py-5 md:grid-cols-4">
      <input name="q" defaultValue={filters.q} placeholder="Search publication titles…" className="surface border academic-rule px-3 py-2 md:col-span-2" />
      <select name="year" defaultValue={filters.year || ""} className="surface border academic-rule px-3 py-2">
        <option value="">All years</option>{years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <input name="author" defaultValue={filters.author} placeholder="Author filter" className="surface border academic-rule px-3 py-2" />
      <button className="bg-[#172a46] px-4 py-2 text-white md:col-span-4">Apply filters</button>
    </form>
    {snapshot.records.length ? <>
      <div className="mb-4 text-sm text-muted">{records.length} INSPIRE literature records</div>
      {records.map(p => <article key={p.id} className="border-t academic-rule py-6">
        <div className="grid gap-3 md:grid-cols-[90px_1fr]">
          <div className="text-sm font-semibold text-muted">{p.year || "—"}</div>
          <div>
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-serif text-xl leading-snug hover:text-accent">{p.title}</a>
            <p className="mt-2 text-sm text-muted">{p.authors}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
              {p.journal && <span>{p.journal}</span>}
              {p.arxiv && <a className="link-academic" href={`https://arxiv.org/abs/${p.arxiv}`} target="_blank" rel="noopener noreferrer">arXiv:{p.arxiv}</a>}
              {p.doi && <a className="link-academic" href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer">DOI</a>}
              <a className="link-academic" href={p.url} target="_blank" rel="noopener noreferrer">INSPIRE record</a>
              <span>INSPIRE citations: {p.citations}</span>
            </div>
          </div>
        </div>
      </article>)}
    </> : <>
      <div className="mb-4 text-sm text-muted">Showing local bibliography until INSPIRE synchronization completes</div>
      {fallback.map(p => <article key={p.id} className="border-t academic-rule py-6">
        <div className="grid gap-3 md:grid-cols-[90px_1fr]">
          <span className="text-muted">{p.year}</span>
          <div><a href={p.inspireUrl || `/publications/${p.slug}`} className="font-serif text-xl">{p.title}</a><p className="mt-2 text-sm text-muted">{p.authorText}</p></div>
        </div>
      </article>)}
    </>}
  </div>;
}
