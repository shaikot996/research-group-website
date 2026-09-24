import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { absolute, fmt, humanize, lines } from "@/lib/utils";
import { InspirePublications } from "@/components/inspire-publications";
import { Breadcrumbs, ProjectCard, PubEntry, SectionHeader } from "@/components/ui";
import { Portrait } from "@/components/portrait";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await prisma.person.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      education: { orderBy: { sortOrder: "asc" } },
      positions: { orderBy: { sortOrder: "asc" } },
      talks: { orderBy: { date: "desc" } },
      software: true,
      awards: { orderBy: { sortOrder: "asc" } },
      teaching: { orderBy: { sortOrder: "asc" } },
      grants: { orderBy: { sortOrder: "asc" } },
      publications: { where: { status: "PUBLISHED" }, orderBy: { year: "desc" } },
      projects: { where: { publishStatus: "PUBLISHED" } },
      researchAreas: { where: { status: "PUBLISHED" } },
    },
  });
  if (!p) notFound();

  const same = [p.website, p.googleScholar, p.inspire, p.orcid, p.arxiv, p.github, p.linkedin].filter(Boolean);
  const selected = p.publications.filter((x) => x.featured);
  const externalLinks = [
    ["Website", p.website],
    ["Scholar", p.googleScholar],
    ["INSPIRE", p.inspire],
    ["ORCID", p.orcid],
    ["arXiv", p.arxiv],
    ["GitHub", p.github],
    ["LinkedIn", p.linkedin],
  ].filter((x): x is string[] => Boolean(x[1]));

  const ld = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.name,
    jobTitle: p.title,
    affiliation: { "@type": "Organization", name: p.affiliation },
    url: absolute(`/people/${p.slug}`),
    sameAs: same,
  };

  return (
    <div className="container-site section-space">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <Breadcrumbs items={[{ label: "People", href: "/people" }, { label: p.name }]} />

      <section className="grid gap-10 border-b academic-rule pb-12 lg:grid-cols-[280px_1fr]">
        <div className="relative aspect-[4/5] overflow-hidden bg-slate-200">
          <Portrait slug={p.slug} name={p.name} photo={p.photo} sizes="280px" />
        </div>
        <div className="self-end">
          <div className="text-xs font-bold uppercase tracking-[.18em] text-accent">{humanize(p.role)}</div>
          <h1 className="mt-3 font-serif text-5xl md:text-6xl">{p.name}</h1>
          <p className="mt-3 text-lg text-navy">{p.title}</p>
          <p className="text-sm text-muted">{p.affiliation}</p>
          {p.email && <a className="mt-5 inline-block link-academic" href={`mailto:${p.email}`}>{p.email}</a>}
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
            {externalLinks.map(([label, url]) => <a className="link-academic" key={label} href={url}>{label}</a>)}
            {p.cvUrl && <a className="bg-[#172a46] px-4 py-2 text-xs font-semibold text-white" href={p.cvUrl}>Download CV</a>}
          </div>
        </div>
      </section>

      <div className="mt-14 grid gap-14 lg:grid-cols-[1.35fr_.65fr]">
        <div>
          {p.bio && <section><SectionHeader eyebrow="Biography" title="Profile" /><p className="text-lg leading-8 text-muted">{p.bio}</p></section>}
          {p.researchSummary && <section className="mt-14"><SectionHeader eyebrow="Research" title="Current research" /><p className="leading-8 text-muted">{p.researchSummary}</p></section>}

          {selected.length > 0 && <section className="mt-14"><SectionHeader eyebrow="Scholarship" title="Selected publications" />{selected.map((x) => <PubEntry key={x.id} p={x} />)}</section>}
          {p.publications.length > 0 && <section className="mt-14"><SectionHeader eyebrow="Curated record" title="Site publications" />{p.publications.map((x) => <PubEntry key={x.id} p={x} />)}</section>}

          {p.inspire && <InspirePublications slug={p.slug} profileUrl={p.inspire} />}

          {p.projects.length > 0 && <section className="mt-14"><SectionHeader eyebrow="Projects" title="Research projects" /><div className="grid gap-8 md:grid-cols-2">{p.projects.map((x) => <ProjectCard key={x.id} p={x} />)}</div></section>}
          {p.software.length > 0 && <section className="mt-14"><SectionHeader eyebrow="Open Source" title="Scientific software" /><div className="divide-y academic-rule border-y academic-rule">{p.software.map((x) => <article key={x.id} className="grid gap-3 py-6 md:grid-cols-[180px_1fr]"><div><h3 className="font-serif text-xl">{x.name}</h3><p className="text-xs text-muted">{x.languages}</p></div><div><p className="text-sm text-muted">{x.description}</p>{x.url && <a className="link-academic text-sm" href={x.url}>Repository →</a>}</div></article>)}</div></section>}
        </div>

        <aside className="space-y-10">
          <section className="border-t-2 academic-rule pt-5"><strong className="text-xs uppercase tracking-[.14em] text-muted">Research interests</strong><ul className="mt-4 grid gap-2 text-sm">{lines(p.researchInterests).map((x) => <li key={x}>— {x}</li>)}</ul></section>

          {p.grants.length > 0 && <section className="border-t academic-rule pt-5"><strong className="text-xs uppercase tracking-[.14em] text-muted">Research funding</strong><div className="mt-4 grid gap-5">{p.grants.map((x) => <div key={x.id}><div className="font-semibold">{x.title}</div><div className="text-xs text-muted">{[x.funder, x.grantId, x.period].filter(Boolean).join(" · ")}</div>{x.role && <div className="mt-1 text-xs font-semibold text-accent">{x.role}</div>}{x.amount && <div className="text-xs text-muted">{x.amount}</div>}{x.description && <div className="mt-1 text-xs text-muted">{x.description}</div>}{x.url && <a className="link-academic text-xs" href={x.url}>Funding/project source →</a>}</div>)}</div></section>}

          {p.education.length > 0 && <section className="border-t academic-rule pt-5"><strong className="text-xs uppercase tracking-[.14em] text-muted">Education</strong><div className="mt-4 grid gap-5">{p.education.map((x) => <div key={x.id}><div className="font-semibold">{x.degree}</div><div className="text-sm text-muted">{x.institution} · {x.years}</div>{x.thesis && <div className="text-xs text-muted">Thesis: {x.thesis}</div>}{x.advisor && <div className="text-xs text-muted">Advisor: {x.advisor}</div>}</div>)}</div></section>}
          {p.positions.length > 0 && <section className="border-t academic-rule pt-5"><strong className="text-xs uppercase tracking-[.14em] text-muted">Academic experience</strong><div className="mt-4 grid gap-5">{p.positions.map((x) => <div key={x.id}><div className="font-semibold">{x.title}</div><div className="text-sm text-muted">{x.institution} · {x.years}</div>{x.description && <div className="mt-1 text-xs text-muted">{x.description}</div>}</div>)}</div></section>}
          {p.talks.length > 0 && <section className="border-t academic-rule pt-5"><strong className="text-xs uppercase tracking-[.14em] text-muted">Talks</strong><div className="mt-4 grid gap-5">{p.talks.map((x) => <div key={x.id}><div className="font-semibold">{x.title}</div><div className="text-xs text-muted">{x.venue} · {fmt(x.date)}</div>{x.slidesUrl && <a href={x.slidesUrl} className="link-academic text-xs">Slides →</a>}</div>)}</div></section>}
          {p.teaching.length > 0 && <section className="border-t academic-rule pt-5"><strong className="text-xs uppercase tracking-[.14em] text-muted">Teaching</strong><div className="mt-4 grid gap-5">{p.teaching.map((x) => <div key={x.id}><div className="font-semibold">{x.title}</div><div className="text-xs text-muted">{[x.institution, x.term].filter(Boolean).join(" · ")}</div>{x.description && <div className="mt-1 text-xs text-muted">{x.description}</div>}</div>)}</div></section>}
          {p.awards.length > 0 && <section className="border-t academic-rule pt-5"><strong className="text-xs uppercase tracking-[.14em] text-muted">Awards & honors</strong><div className="mt-4 grid gap-5">{p.awards.map((x) => <div key={x.id}><div className="font-semibold">{x.title}</div><div className="text-xs text-muted">{[x.issuer, x.year].filter(Boolean).join(" · ")}</div>{x.description && <div className="mt-1 text-xs text-muted">{x.description}</div>}</div>)}</div></section>}
        </aside>
      </div>
    </div>
  );
}
