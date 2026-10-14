"use client";

import {useMemo,useState} from "react";
import type {RadarPaper,RadarSubject} from "@/lib/research-radar";

const topics:{label:string;value:RadarSubject|"All"}[]=[
  {label:"All disciplines",value:"All"},
  {label:"String Theory",value:"High-Energy Theory"},
  {label:"Quantum Gravity & Cosmology",value:"Quantum Gravity & Cosmology"},
  {label:"Mathematics",value:"Mathematics"},
  {label:"AI for Science",value:"AI for Science"},
];
function excerpt(text:string,length=220){
  if(text.length<=length)return text;
  const cut=text.slice(0,length);
  return cut.slice(0,cut.lastIndexOf(" ")>length*.6?cut.lastIndexOf(" "):length)+"…";
}
function shortDate(date:string){
  return new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(date));
}
export function RadarExplorer({papers}:{papers:RadarPaper[]}) {
  const [selected,setSelected]=useState<RadarSubject|"All">("All");
  const [query,setQuery]=useState("");
  const [limit,setLimit]=useState(18);
  const matching=useMemo(()=>{
    const search=query.trim().toLowerCase();
    return papers.filter(p=>{
      if(selected!=="All"&&p.category!==selected)return false;
      if(!search)return true;
      return [p.title,p.id,p.abstract,p.authors.join(" ")].some(text=>text.toLowerCase().includes(search));
    });
  },[papers,selected,query]);
  return <section className="radar-explorer" id="explore-radar" aria-labelledby="radar-explore-heading">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
      <div>
        <div className="text-xs font-bold uppercase tracking-[.2em] text-accent">Research library</div>
        <h2 id="radar-explore-heading" className="mt-2 font-serif text-4xl md:text-5xl">Explore the latest</h2>
      </div>
      <label className="w-full max-w-sm">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[.15em] text-muted">Search the radar</span>
        <input type="search" value={query} onChange={e=>{setQuery(e.target.value);setLimit(18);}}
          placeholder="Paper, author, arXiv ID…"
          className="focus-ring w-full border academic-rule bg-[var(--surface)] px-4 py-3 text-sm outline-none placeholder:text-muted"/>
      </label>
    </div>
    <div role="group" aria-label="Filter research papers by discipline"
       className="mb-8 flex gap-2 overflow-x-auto border-b academic-rule pb-5">
      {topics.map(topic=><button key={topic.value} type="button"
        aria-pressed={selected===topic.value}
        onClick={()=>{setSelected(topic.value);setLimit(18);}}
        className={"focus-ring shrink-0 border px-4 py-2.5 text-xs font-semibold transition-colors "+
          (selected===topic.value?"border-[#8c2131] bg-[#8c2131] text-white":"academic-rule bg-[var(--surface)] text-[var(--text)] hover:border-[#8c2131] hover:text-accent")}
      >{topic.label}</button>)}
    </div>
    <div className="mb-5 flex items-center justify-between gap-4">
      <span className="text-sm text-muted">{matching.length} verified {matching.length===1?"paper":"papers"}</span>
      <span className="text-xs text-muted">Newest submissions · original research links</span>
    </div>
    {matching.length===0?
      <div className="border academic-rule bg-[var(--surface)] p-8 md:p-12">
        <p className="font-serif text-2xl">No matching records yet.</p>
        <p className="mt-3 text-sm text-muted">Try a different subject or keyword. Only verified arXiv records are displayed.</p>
        {(selected!=="All"||query)&&<button className="mt-5 text-sm font-semibold text-accent underline"
            onClick={()=>{setSelected("All");setQuery("");}}>Clear filters</button>}
      </div>:
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {matching.slice(0,limit).map((paper,i)=><article key={paper.id} className="radar-paper-card radar-enter group flex min-w-0 flex-col border academic-rule bg-[var(--surface)] p-6"
            style={{animationDelay:String(Math.min(i%9,8)*55)+"ms"}}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <span className="radar-subject-mark text-[10px] font-bold uppercase tracking-[.14em]">{paper.category}</span>
            <time className="text-xs text-muted" dateTime={paper.published}>{shortDate(paper.published)}</time>
          </div>
          <h3 className="font-serif text-2xl leading-[1.22] tracking-[-.018em]">
            <a href={paper.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent">{paper.title}</a>
          </h3>
          <p className="mt-4 line-clamp-2 text-xs leading-6 text-muted">{paper.authors.length?paper.authors.join(", "):"Authors listed in original arXiv record"}</p>
          <p className="mt-4 line-clamp-4 text-sm leading-7 text-muted">{excerpt(paper.abstract)}</p>
          <div className="mt-auto flex items-center justify-between gap-4 border-t academic-rule pt-5 text-xs">
            <span className="font-medium text-muted">arXiv:{paper.id} · Preprint</span>
            <a href={paper.url} target="_blank" rel="noopener noreferrer" className="font-bold text-accent">Read ↗</a>
          </div>
        </article>)}
      </div>}
    {limit<matching.length&&<div className="mt-10 text-center">
      <button type="button" onClick={()=>setLimit(limit+18)}
        className="focus-ring border border-[#8c2131] px-7 py-3 text-sm font-semibold text-accent transition hover:bg-[#8c2131] hover:text-white">
        Load more papers ↓
      </button>
    </div>}
  </section>;
}
