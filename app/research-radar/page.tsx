import type {Metadata} from "next";
import Link from "next/link";
import {getRadarSnapshot,radarHighlights,prettyRadarDate,radarExcerpt} from "@/lib/research-radar";
import {RadarExplorer} from "@/components/research-radar-explorer";
export const dynamic="force-dynamic";
export const metadata:Metadata={
  title:"Research Radar",
  description:"Daily curated-by-algorithm arXiv preprints spanning string theory, quantum gravity, cosmology, mathematics and AI for science, with verified links and original abstract excerpts.",
};

export default function ResearchRadarPage() {
  const snapshot=getRadarSnapshot();
  const papers=snapshot.papers;
  const selection=radarHighlights(papers,5);
  const featured=selection[0];
  const other=selection.slice(1);
  return <main className="radar-shell">
    <header className="radar-hero relative isolate overflow-hidden border-b academic-rule">
      <div className="radar-mesh pointer-events-none absolute inset-0" aria-hidden="true"/>
      <div className="pointer-events-none absolute -right-16 top-5 hidden aspect-square w-[520px] items-center justify-center opacity-50 lg:flex" aria-hidden="true">
        <div className="radar-orbits"><i/><i/><i/><i/><span className="radar-core"/><span className="radar-dot radar-dot-one"/><span className="radar-dot radar-dot-two"/><span className="radar-dot radar-dot-three"/></div>
      </div>
      <div className="container-site relative z-10 py-16 md:py-24">
        <div className="radar-enter inline-flex items-center gap-3 border border-[#8c2131]/30 bg-[var(--surface)]/70 px-4 py-2 text-[11px] font-bold uppercase tracking-[.2em] text-accent backdrop-blur">
          <span className="radar-pulse-dot" aria-hidden="true"/> SAM Research Intelligence · arXiv
        </div>
        <h1 className="radar-enter mt-7 max-w-3xl font-serif text-[clamp(3.6rem,8.5vw,7.7rem)] leading-[.9] tracking-[-.058em]">
          Research <span className="radar-gradient-ink">Radar.</span>
        </h1>
        <p className="radar-enter mt-8 max-w-2xl text-base leading-8 text-muted md:text-xl md:leading-9">
          An automatically refreshed view of string theory, cosmology, quantum gravity, mathematical physics, quantum information and AI for scientific research.
          Real papers. Original authors. Traceable science.
        </p>
        <div className="radar-enter mt-9 flex flex-wrap items-center gap-3">
          <a className="focus-ring inline-flex items-center gap-3 bg-[#172a46] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#8c2131]"
            href="#explore-radar">Explore research <span aria-hidden="true">↗</span></a>
          <Link href="/news-events" className="focus-ring inline-flex border academic-rule bg-[var(--surface)] px-6 py-3.5 text-sm font-semibold hover:text-accent">Group news & events</Link>
        </div>
        <div className="radar-enter mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t academic-rule pt-6 text-xs text-muted">
          <span>Refresh schedule <strong className="text-[var(--text)]">4 checks/day · Bangladesh time</strong></span>
          <span>Last successful collection <strong className="text-[var(--text)]">{snapshot.updatedAt?new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"Asia/Dhaka"}).format(new Date(snapshot.updatedAt))+" (BDT)":"Awaiting first sync"}</strong></span>
          <span>Coverage <strong className="text-[var(--text)]">13 arXiv subject feeds · 5 themes</strong></span>
        </div>
      </div>
    </header>

    <section className="container-site border-b academic-rule py-5">
      <p className="text-xs leading-6 text-muted"><strong className="text-[var(--text)]">SAM focus:</strong> String compactifications, fluxes &amp; moduli · Early-universe cosmology · Swampland &amp; quantum gravity · CFT &amp; holography · Black holes · Noncommutative geometry &amp; operator algebras · Quantum information · AI for physics &amp; mathematics</p>
      <p className="mt-1 text-xs text-muted">The collection is checked several times daily. arXiv has no new announcements every calendar day; the time above indicates the latest successful ingestion, not the submission date of every paper.</p>
    </section>
    <section className="container-site py-12 md:py-20" aria-labelledby="radar-today">
      <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[.2em] text-accent">Selected by subject relevance & recency</div>
          <h2 id="radar-today" className="mt-2 font-serif text-4xl tracking-tight md:text-5xl">Today's research highlights</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">A reproducible ranking of recent preprints, not a claim of peer review or scientific endorsement.</p>
        </div>
        <span className="text-xs font-medium text-muted">{selection.length} {selection.length===1?"highlight":"highlights"} · arXiv</span>
      </div>
      {featured?<div className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
        <article className="radar-feature radar-enter group relative isolate flex min-h-[420px] flex-col justify-between overflow-hidden p-7 text-white sm:p-10">
          <div className="radar-feature-art" aria-hidden="true"><span/><span/><span/></div>
          <div className="relative z-10 flex items-start justify-between gap-4">
            <span className="border border-white/35 bg-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[.21em]">Paper of the day · Algorithmic pick</span>
            <span className="text-xs text-white/80">{prettyRadarDate(featured.published)}</span>
          </div>
          <div className="relative z-10 mt-14 max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-[.18em] text-[#ffbac1]">{featured.category}</div>
            <h3 className="mt-4 font-serif text-3xl leading-[1.13] tracking-tight sm:text-5xl">{featured.title}</h3>
            <p className="mt-5 line-clamp-3 max-w-xl text-sm leading-7 text-white/80">{radarExcerpt(featured.abstract,325)}</p>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-t border-white/25 pt-6">
              <span className="text-xs text-white/80">arXiv:{featured.id} · Preprint</span>
              <a href={featured.url} target="_blank" rel="noopener noreferrer" className="focus-ring inline-flex items-center gap-2 border border-white/70 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-[#152a46]">Read original paper ↗</a>
            </div>
          </div>
        </article>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {other.length?other.map((p,i)=><article key={p.id} className="radar-highlight-card radar-enter group flex flex-col border academic-rule bg-[var(--surface)] p-6" style={{animationDelay:String(i*85)+"ms"}}>
            <div className="mb-3 flex justify-between gap-3 text-[10px] font-bold uppercase tracking-[.16em] text-accent"><span>{p.category}</span><span className="text-muted">0{i+2}</span></div>
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-serif text-xl leading-tight hover:text-accent">{p.title}</a>
            <div className="mt-auto flex items-end justify-between gap-3 pt-4 text-xs text-muted">
              <span>arXiv:{p.id}</span><span aria-hidden="true" className="text-accent">↗</span>
            </div>
          </article>):<div className="border academic-rule bg-[var(--surface)] p-8 text-sm leading-7 text-muted">More subject highlights will appear as additional verified preprints arrive.</div>}
        </div>
      </div>:<div className="radar-awaiting grid gap-6 overflow-hidden border academic-rule bg-[var(--surface)] p-8 md:grid-cols-[1fr_auto] md:items-center md:p-12">
        <div><div className="text-xs font-bold uppercase tracking-[.2em] text-accent">First collection pending</div>
          <h3 className="mt-3 font-serif text-3xl">The radar is warming up.</h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">The daily pipeline will publish original, verified arXiv papers here after its first successful refresh. We do not insert sample discoveries or invented headlines.</p>
        </div>
        <a href="https://arxiv.org/list/hep-th/recent" target="_blank" rel="noopener noreferrer" className="focus-ring border border-[#8c2131] px-6 py-3 text-sm font-semibold text-accent hover:bg-[#8c2131] hover:text-white">Browse arXiv ↗</a>
      </div>}
    </section>

    <section className="radar-library-bg border-y academic-rule py-14 md:py-20">
      <div className="container-site"><RadarExplorer papers={papers}/></div>
    </section>
    <footer className="container-site py-12">
      <div className="grid items-start gap-7 border-t academic-rule pt-8 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">Our editorial standard</p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">Sources are linked to original arXiv records. Titles, author names, submission dates and abstract excerpts are sourced from arXiv. Rankings use transparent keyword and recency heuristics; no unverified AI summaries, invented paper claims or peer-review status are inferred. This is an independent discovery tool, not affiliated with or endorsed by arXiv.</p><p className="mt-2 text-xs text-muted">Thank you to arXiv for use of its open access interoperability.</p>
        </div>
        <Link className="text-sm font-semibold text-accent hover:underline" href="/news-events">SAM news & events ↗</Link>
      </div>
    </footer>
  </main>;
}
