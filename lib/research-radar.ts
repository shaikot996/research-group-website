import raw from "../data/research-radar.json";
import watchlist from "../data/radar-author-watchlist.json";

export type RadarSubject = "High-Energy Theory" | "Quantum Gravity & Cosmology" | "Mathematics" | "AI for Science" | "Quantum Information";
export type RadarPaper = {
  id:string;
  title:string;
  authors:string[];
  abstract:string;
  published:string;
  url:string;
  category:RadarSubject;
  primaryCategory:string;
  source:"arXiv";
  status:"Preprint";
};
export type RadarSnapshot = {
  updatedAt:string|null;
  status:string;
  sources:string[];
  papers:RadarPaper[];
};
export const subjects:RadarSubject[] = [
  "High-Energy Theory","Quantum Gravity & Cosmology","Mathematics","AI for Science","Quantum Information"
];
const authorNorm=(s:string)=>s.normalize("NFKD").toLowerCase()
  .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
const matchAuthor=(p:RadarPaper,list:string[])=>p.authors.some(a=>
  list.some(n=>authorNorm(a)===authorNorm(n)));
// Source snapshot has already passed the arXiv focused-topic screening.
// Keep UI validation narrow and deterministic so newly tracked math/AI/quantum
// subjects are not inadvertently filtered by a second, stale regex list.
export function radarIsRelevant(p:RadarPaper):boolean {
  return !matchAuthor(p,watchlist.excludedAuthors) &&
    /^(High-Energy Theory|Quantum Gravity & Cosmology|Mathematics|AI for Science|Quantum Information)$/.test(p.category);
}
function radarPriority(p:RadarPaper):number {
  const coauthor=matchAuthor(p,watchlist.verifiedCoauthors)||matchAuthor(p,watchlist.groupResearchers);
  const prominent=matchAuthor(p,watchlist.prominentStringTheorists);
  const age=Math.max(0,(Date.now()-Date.parse(p.published))/86400000);
  return (coauthor?14:prominent?7:0)+Math.max(0,34-age*1.8);
}

export function getRadarSnapshot():RadarSnapshot {
  const data=raw as unknown as RadarSnapshot;
  return {
    updatedAt:data.updatedAt || null, status:data.status || "awaiting-first-refresh",
    sources:Array.isArray(data.sources)?data.sources:["arXiv"],
    papers:Array.isArray(data.papers)?
      data.papers.filter(p=>p && /^https:\/\/arxiv\.org\/abs\//.test(p.url) &&
       p.title && p.id && subjects.includes(p.category) && Number.isFinite(Date.parse(p.published)) && radarIsRelevant(p))
        .sort((a,b)=>radarPriority(b)-radarPriority(a)||Date.parse(b.published)-Date.parse(a.published))
        .slice(0,110)
      :[],
  };
}
export function radarHighlights(papers:RadarPaper[],max=5):RadarPaper[] {
  const result:RadarPaper[]=[];
  const visited=new Set<string>();
  for(const subject of subjects) {
    const first=papers.find(p=>p.category===subject && !visited.has(p.id));
    if(first) {result.push(first);visited.add(first.id);}
  }
  for(const paper of papers) {
    if(result.length>=max)break;
    if(!visited.has(paper.id)) {result.push(paper);visited.add(paper.id);}
  }
  return result.slice(0,max);
}
export function prettyRadarDate(value:string) {
  return new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(value));
}
export function radarExcerpt(text:string, max=270) {
  if(text.length<=max)return text;
  const abbreviated=text.slice(0,max);
  return abbreviated.slice(0,abbreviated.lastIndexOf(" ")>max*.7?abbreviated.lastIndexOf(" "):max)+"…";
}
