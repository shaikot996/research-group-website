import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { absolute, fmt, humanize, lines } from "@/lib/utils";
import { Breadcrumbs, ProjectCard, PubEntry, SectionHeader } from "@/components/ui";
import { Portrait } from "@/components/portrait";
import { MahbubProfileSections } from "@/components/mahbub-profile-sections";
import { getInspireArticles, type InspireArticle } from "@/lib/inspire";
import { getMemberCitationMap, memberCitationFor } from "@/lib/member-citations";
import { getResearchGateAuthorStats } from "@/lib/group-stats";

function driveProfileSections(value?: string | null): Array<[string, string]> {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return Object.entries(parsed)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string" && Boolean(entry[1].trim()))
      .map(([key, text]) => [key === "other" ? "Other information" : humanize(key), text]);
  } catch {
    return [];
  }
}

function InspireEntry({ article }: { article: InspireArticle }) {
  return (
    <article className="border-t academic-rule py-6">
      <div className="grid gap-3 md:grid-cols-[90px_1fr]">
        <div className="text-sm font-semibold text-muted">{article.year ?? "—"}</div>
        <div>
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="font-serif text-xl leading-snug hover:text-accent">{article.title}</a>
          {article.authors && <p className="mt-2 text-sm text-muted">{article.authors}</p>}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
            {article.journal && <span>{article.journal}</span>}
            {article.arxiv && <a className="link-academic" href={`https://arxiv.org/abs/${article.arxiv}`} target="_blank" rel="noopener noreferrer">arXiv:{article.arxiv}</a>}
            {article.doi && <a className="link-academic" href={`https://doi.org/${article.doi}`} target="_blank" rel="noopener noreferrer">DOI</a>}
            {article.citations !== undefined && <span>INSPIRE citations: {article.citations}</span>}
          </div>
        </div>
      </div>
    </article>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await prisma.person.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { name: true, title: true, affiliation: true, bio: true, researchInterests: true, photo: true, inspire: true },
  });
  if (!p) return { title: "Researcher not found", robots: { index: false, follow: false } };
  const canonical = absolute(`/people/${slug}/`);
  const description = [p.title, p.affiliation, p.researchInterests?.split("\\n").slice(0, 3).join(", ") || p.bio?.slice(0, 120)]
    .filter(Boolean).join(" · ").slice(0, 260);
  return {
    title: `${p.name} — Research Profile`,
    description,
    alternates: { canonical },
    openGraph: { type: "profile", title: p.name, description, url: canonical,
      images: [{url:absolute(`/portraits/${slug}`),alt:`Photograph of ${p.name}`}] },
    twitter: {card:"summary_large_image", title:p.name, description },
    robots: { index: true, follow: true },
  };
}

export const dynamic = "force-dynamic";

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
  const extraSections = driveProfileSections(p.profileSections);
  const inspirePublications = p.inspire ? await getInspireArticles(p.inspire) : null;
  const memberCitationMap = await getMemberCitationMap();
  const cachedCitations = memberCitationFor(memberCitationMap, p.inspire);
  const currentArticles = inspirePublications && !inspirePublications.error ? inspirePublications.articles : [];
  const liveCitations = currentArticles.length
    ? {
        citations: [...new Map(currentArticles.map((article) => [article.id, article.citations ?? 0])).values()]
          .reduce((sum, count) => sum + count, 0),
        publications: new Set(currentArticles.map((article) => article.id)).size,
      }
    : null;
  const memberCitationStats = cachedCitations ?? liveCitations;
  // ResearchGate represents a broader subject scope than INSPIRE. Keep their
  // source-specific counts distinct; never add potentially overlapping citations.
  const isHasibProfile = p.slug === "syed-hasibul-hassan-chowdhury";
  const researchGateSnapshot = isHasibProfile ? await getResearchGateAuthorStats("1511186") : null;

  const same = [p.website, p.googleScholar, p.inspire, p.orcid, p.arxiv, p.github, p.linkedin].filter(Boolean);
  const externalLinks = [
    ["Website", p.website],
    ["Scholar", p.googleScholar],
    ["INSPIRE", p.inspire],
    ["ResearchGate", p.slug === "syed-hasibul-hassan-chowdhury" ? "https://www.researchgate.net/profile/S-Chowdhury-2" : null],
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
    image: absolute(`/portraits/${p.slug}`),
    description: p.bio || p.researchSummary || undefined,
    knowsAbout: lines(p.researchInterests),
    identifier: p.inspire || undefined,
    mainEntityOfPage: absolute(`/people/${p.slug}/`),
  };

  return (
    <div className="container-site section-space">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <Breadcrumbs items={[{ label: "People", href: "/people" }, { label: p.name }]} />

      <section className="grid gap-10 border-b academic-rule pb-12 lg:grid-cols-[280px_1fr]">
        <div className="relative aspect-[4/5] overflow-hidden bg-slate-200">
          <Portrait slug={p.slug} name={p.name} photo={p.photo} revision={p.contentSource.startsWith("DRIVE_LEADER") ? p.sourceUpdatedAt?.toISOString() : undefined} sizes="280px" />
        </div>
        <div className="self-end">
          <div className="text-xs font-bold uppercase tracking-[.18em] text-accent">{humanize(p.role)}</div>
          <h1 className="mt-3 font-serif text-5xl md:text-6xl">{p.name}</h1>
          <p className="mt-3 text-lg text-navy">{p.title}</p>
          <p className="text-sm text-muted">{p.affiliation}</p>
          {memberCitationStats && <div className="mt-5 flex flex-wrap gap-6 border-y academic-rule py-4">
            <div><div className="text-2xl font-semibold tabular-nums">{memberCitationStats.citations.toLocaleString("en-US")}</div><div className="text-xs text-muted">INSPIRE citations</div></div>
            <div><div className="text-2xl font-semibold tabular-nums">{memberCitationStats.publications}</div><div className="text-xs text-muted">INSPIRE publications</div></div>
          </div>}
          {researchGateSnapshot && <div className="mt-3 flex flex-wrap gap-6 border-b academic-rule pb-4">
            <div><div className="text-2xl font-semibold tabular-nums">{researchGateSnapshot.citations}</div><div className="text-xs text-muted">ResearchGate citations</div></div>
            <div><div className="text-2xl font-semibold tabular-nums">{researchGateSnapshot.publications}</div><div className="text-xs text-muted">ResearchGate publications</div></div>
            <div className="self-end text-xs text-muted"><a href={researchGateSnapshot.url} target="_blank" rel="noopener noreferrer" className="link-academic">Source ↗</a><span className="ml-2">Snapshot: {researchGateSnapshot.verifiedAt}</span></div>
          </div>}
          {p.email && <a className="mt-5 inline-block link-academic" href={`mailto:${p.email}`}>{p.email}</a>}
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
            {externalLinks.map(([label, url]) => <a className="link-academic" key={label} href={url} target="_blank" rel="noopener noreferrer">{label}</a>)}
            {p.cvUrl && <a className="bg-[#172a46] px-4 py-2 text-xs font-semibold text-white" href={p.cvUrl} target="_blank" rel="noopener noreferrer">View CV</a>}
          </div>
        </div>
      </section>

      <div className="mt-14 grid gap-14 lg:grid-cols-[1.35fr_.65fr]">
        <div>
          {p.bio && <section><SectionHeader eyebrow="Biography" title="Profile" /><p className="whitespace-pre-line text-lg leading-8 text-muted">{p.bio}</p></section>}
          {p.researchSummary && <section className="mt-14"><SectionHeader eyebrow="Research" title="Current research" /><p className="whitespace-pre-line leading-8 text-muted">{p.researchSummary}</p></section>}
          {extraSections.map(([title, text]) => <section className="mt-14" key={title}><SectionHeader title={title} /><p className="whitespace-pre-line leading-8 text-muted">{text}</p></section>)}

          {p.slug === "mahbubul-alam-majumdar" && <MahbubProfileSections />}
          {inspirePublications && !inspirePublications.error ? (
            <section className="mt-14">
              <SectionHeader
                eyebrow="Scholarship"
                title={`Publications (${inspirePublications.total})`}
                description="Complete publication record from the verified INSPIRE author identity. Journal and preprint versions are represented by the same INSPIRE literature record."
              />
              {inspirePublications.articles.map((article) => <InspireEntry key={article.id || article.url} article={article} />)}
              {inspirePublications.searchUrl && <a className="mt-4 inline-block link-academic text-sm" href={inspirePublications.searchUrl} target="_blank" rel="noopener noreferrer">Open complete record on INSPIRE →</a>}
            </section>
          ) : p.publications.length > 0 ? (
            <section className="mt-14">
              <SectionHeader eyebrow="Scholarship" title={p.slug === "mahbubul-alam-majumdar" ? "Selected Research / Publications" : "Publications"} description="INSPIRE is temporarily unavailable; showing the locally curated publication records." />
              {p.publications.map((x) => <PubEntry key={x.id} p={x} />)}
            </section>
          ) : null}

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
