"use client";
import {useMemo,useState} from "react";
import type {RadarPaper,RadarSubject} from "@/lib/research-radar";

const topics:{label:string;value:RadarSubject|"All"}[]=[
  {label:"All",value:"All"},
  {label:"String Theory",value:"High-Energy Theory"},
  {label:"Quantum Gravity & Cosmology",value:"Quantum Gravity & Cosmology"},
  {label:"Mathematics",value:"Mathematics"},
  {label:"AI for Science",value:"AI for Science"},
];
const short=(s:string,n=220)=>s.length>n?s.slice(0,n).trimEnd()+"…":s;
function shortDate(date:string){return new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(date));}
export function RadarExplorer({papers}:{papers:RadarPaper[]}) {
  const [selected,setSelected]=useState<RadarSubject|"All">("All");
  const [query,setQuery]=useState("");
  const [limit,setLimit]=useState(12);
  const matching=useMemo(()=>{
    const q=query.trim().toLowerCase();
    return papers.filter(p=>(selected==="All"||p.category===selected)&&
      (!q||[p.title,p.id,p.abstract,p.authors.join(" ")].some(v=>v.toLowerCase().includes(q))));
  },[papers,selected,query]);
  return <section className="radar-explorer" id="explore-radar" data-radar-explorer aria-labelledby="radar-explore-heading">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
      <div>
        <div className="text-xs font-bold uppercase tracking-[.2em] text-accent">Research library</div>
        <h2 id="radar-explore-heading" className="mt-2 font-serif text-4xl md:text-5xl">Explore the latest</h2>
        <p className="mt-3 max-w-xl text-sm text-muted">A focused selection of directly relevant research, with original arXiv abstracts.</p>
      </div>
      <label className="w-full max-w-sm">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[.15em] text-muted">Search the radar</span>
        <input data-radar-query type="search" value={query} onChange={e=>{setQuery(e.target.value);setLimit(12);}}
          placeholder="Paper, author, arXiv ID…"
          className="focus-ring w-full border academic-rule bg-[var(--surface)] px-4 py-3 text-sm outline-none placeholder:text-muted"/>
      </label>
    </div>
    <div role="group" aria-label="Filter papers by discipline" className="mb-8 flex flex-wrap gap-2 border-b academic-rule pb-5">
      {topics.map(topic=><button data-radar-filter={topic.value} key={topic.value} type="button"
        aria-pressed={selected===topic.value} onClick={()=>{setSelected(topic.value);setLimit(12);}}
        className={"focus-ring shrink-0 border px-4 py-2.5 text-xs font-semibold transition-colors "+
          (selected===topic.value?"border-[#8c2131] bg-[#8c2131] text-white":"academic-rule bg-[var(--surface)] text-[var(--text)] hover:border-[#8c2131] hover:text-accent")}
      >{topic.label}</button>)}
    </div>
    <div className="mb-5 flex items-center justify-between gap-4">
      <span data-radar-count className="text-sm text-muted">{matching.length} focused {matching.length===1?"paper":"papers"}</span>
      <span className="text-xs text-muted">Original research · arXiv abstracts</span>
    </div>
    <div data-radar-empty style={{display:matching.length===0?"block":"none"}} className="border academic-rule bg-[var(--surface)] p-8 md:p-12">
      <p className="font-serif text-2xl">No matching records yet.</p>
      <p className="mt-3 text-sm text-muted">Try another subject or keyword; only relevant verified arXiv papers are indexed.</p>
      <button data-radar-clear type="button" className="mt-5 text-sm font-semibold text-accent underline"
        onClick={()=>{setSelected("All");setQuery("");}}>Clear filters</button>
    </div>
    <div data-radar-grid className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" style={{display:matching.length?"grid":"none"}}>
      {matching.map((paper,i)=><article key={paper.id} data-radar-card data-radar-subject={paper.category}
          data-radar-search={[paper.title,paper.id,paper.authors.join(" "),paper.abstract].join(" ").toLowerCase()}
          className="radar-paper-card radar-enter group flex min-w-0 flex-col border academic-rule bg-[var(--surface)] p-6"
          style={{display:i<limit?"flex":"none",animationDelay:String(Math.min(i%9,8)*55)+"ms"}}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <span className="radar-subject-mark text-[10px] font-bold uppercase tracking-[.14em]">{paper.category}</span>
          <time className="text-xs text-muted" dateTime={paper.published}>{shortDate(paper.published)}</time>
        </div>
        <h3 className="font-serif text-2xl leading-[1.22] tracking-[-.018em]">
          <a href={paper.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">{paper.title}</a>
        </h3>
        <p className="mt-4 line-clamp-2 text-xs leading-6 text-muted">{paper.authors.length?paper.authors.join(", "):"Authors in original arXiv record"}</p>
        <p className="mt-4 line-clamp-3 text-sm leading-7 text-muted">{short(paper.abstract)}</p>
        <details className="mt-3 mb-5 border-l-2 border-[#8c2131] pl-3 text-sm text-muted">
          <summary className="focus-ring w-fit cursor-pointer font-semibold text-accent">Full original arXiv abstract ▾</summary>
          <p className="mt-3 whitespace-pre-line leading-7">{paper.abstract}</p>
        </details>
        <div className="mt-auto flex items-center justify-between gap-4 border-t academic-rule pt-5 text-xs">
          <span className="font-medium text-muted">arXiv:{paper.id} · Preprint</span>
          <a href={paper.url} target="_blank" rel="noopener noreferrer" className="font-bold text-accent">Read ↗</a>
        </div>
      </article>)}
    </div>
    <div data-radar-more-wrap className="mt-10 text-center" style={{display:limit<matching.length?"block":"none"}}>
      <button data-radar-more type="button" onClick={()=>setLimit(limit+12)}
        className="focus-ring border border-[#8c2131] px-7 py-3 text-sm font-semibold text-accent transition hover:bg-[#8c2131] hover:text-white">Load more papers ↓</button>
    </div>
  </section>;
}
