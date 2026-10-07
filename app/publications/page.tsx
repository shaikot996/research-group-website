import { prisma } from "@/lib/db";
import { PubEntry, SectionHeader } from "@/components/ui";

type Q = { q?: string; year?: string; author?: string; area?: string };

export default async function Page({ searchParams }: { searchParams: Promise<Q> }) {
  const f = await searchParams;
  const [areas, years, pubs] = await Promise.all([
    prisma.researchArea.findMany({ where: { status: "PUBLISHED" }, orderBy: { title: "asc" } }),
    prisma.publication.findMany({ where: { status: "PUBLISHED" }, select: { year: true }, distinct: ["year"], orderBy: { year: "desc" } }),
    prisma.publication.findMany({
      where: {
        status: "PUBLISHED",
        ...(f.q ? { OR: [{ title: { contains: f.q } }, { abstract: { contains: f.q } }, { authorText: { contains: f.q } }] } : {}),
        ...(/^\d{4}$/.test(f.year ?? "") ? { year: Number(f.year) } : {}),
        ...(f.author ? { authorText: { contains: f.author } } : {}),
        ...(f.area ? { researchAreas: { some: { slug: f.area } } } : {}),
      },
      orderBy: [{ year: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  return <div className="container-site section-space">
    <SectionHeader eyebrow="Scholarship" title="Publications" description="One bibliographic record per work, combining journal and e-print information when both are available. INSPIRE HEP is used as the reference source for members with verified INSPIRE identities." />
    <div className="mb-8 border-l-2 academic-rule pl-4 text-xs leading-6 text-muted">INSPIRE record links remain the authoritative source. Individual member profiles use verified INSPIRE author identities for complete publication lists; group-level publication and citation totals deduplicate shared literature records by INSPIRE control number.</div>
    <form method="get" className="mb-10 grid gap-3 border-y academic-rule py-5 md:grid-cols-4">
      <input name="q" defaultValue={f.q} placeholder="Search title, author, abstract…" className="surface border academic-rule px-3 py-2 md:col-span-2" />
      <select name="year" defaultValue={f.year||""} className="surface border academic-rule px-3 py-2"><option value="">All years</option>{years.map(x=><option key={x.year}>{x.year}</option>)}</select>
      <select name="area" defaultValue={f.area||""} className="surface border academic-rule px-3 py-2"><option value="">All research areas</option>{areas.map(a=><option key={a.id} value={a.slug}>{a.title}</option>)}</select>
      <input name="author" defaultValue={f.author} placeholder="Author filter" className="surface border academic-rule px-3 py-2 md:col-span-3" />
      <button className="bg-[#172a46] px-4 py-2 text-white">Apply filters</button>
    </form>
    <div className="mb-4 text-sm text-muted">{pubs.length} bibliographic records</div>
    {pubs.map(p=><PubEntry key={p.id} p={p}/>)}</div>;
}
