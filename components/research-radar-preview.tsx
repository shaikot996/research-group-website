import Link from "next/link";
import {getRadarSnapshot,radarHighlights,radarExcerpt,prettyRadarDate} from "@/lib/research-radar";
export function ResearchRadarPreview(){
  const snapshot=getRadarSnapshot();
  const papers=radarHighlights(snapshot.papers,3);
  return <section aria-labelledby="home-radar-heading" className="border-y academic-rule surface py-12 md:py-16">
    <div className="container-site">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-accent"><span className="radar-pulse-dot" aria-hidden="true"/> SAM research intelligence</div>
          <h2 id="home-radar-heading" className="mt-3 font-serif text-4xl tracking-tight md:text-5xl">Research Radar <span className="text-accent">↗</span></h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">Automatically refreshed arXiv research across string theory, cosmology, mathematical physics, AI for science and quantum information.</p></div>
        <Link href="/research-radar" className="focus-ring inline-flex border border-[#8c2131] px-5 py-3 text-sm font-semibold text-accent transition hover:bg-[#8c2131] hover:text-white">Explore Research Radar ↗</Link>
      </div>
      {papers.length?<div className="grid gap-4 lg:grid-cols-3">
        {papers.map((paper,i)=><article key={paper.id} className="radar-highlight-card radar-enter flex flex-col border academic-rule bg-[var(--bg)] p-6" style={{animationDelay:String(i*95)+"ms"}}>
          <div className="mb-4 flex justify-between gap-4 text-[10px] font-bold uppercase tracking-[.12em]"><span className="text-accent">{paper.category}</span><time dateTime={paper.published} className="text-muted">{prettyRadarDate(paper.published)}</time></div>
          <h3 className="font-serif text-2xl leading-tight"><a href={paper.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">{paper.title}</a></h3>
          <p className="mt-4 text-sm leading-7 text-muted">{radarExcerpt(paper.abstract,175)}</p>
          <div className="mt-auto border-t academic-rule pt-5 text-xs text-muted">arXiv:{paper.id} · Preprint</div>
        </article>)}
      </div>:<div className="grid gap-4 border academic-rule bg-[var(--bg)] p-7 md:grid-cols-[1fr_auto] md:items-center">
        <p className="text-sm leading-7 text-muted">Our automated arXiv feed is awaiting its first verified collection. New paper highlights will appear after a successful daily refresh.</p>
        <Link href="/research-radar" className="text-sm font-bold text-accent">View radar →</Link>
      </div>}
    </div>
  </section>;
}
