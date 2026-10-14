import raw from "../data/research-radar.json";
import watchlist from "../data/radar-author-watchlist.json";

export type RadarSubject = "High-Energy Theory" | "Quantum Gravity & Cosmology" | "Mathematics" | "AI for Science";
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
  "High-Energy Theory","Quantum Gravity & Cosmology","Mathematics","AI for Science"
];
const authorNorm=(s:string)=>s.normalize("NFKD").toLowerCase()
  .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
const matchAuthor=(p:RadarPaper,list:string[])=>p.authors.some(a=>
  list.some(n=>authorNorm(a)===authorNorm(n)));
const deep=/string theor|superstring|compactification|calabi.?yau|kahler|kähler|moduli|swampland|holograph|ads.?cft|flux vacua|type iib|supergrav|worldsheet|f.theory|heterotic|topological string|decompactif|m.theory/i;
const broad=/black hole|quantum gravit|inflation|cosmolog|quantum field theor|gauge theor|branes?|supersymmetr|de sitter/i;
export function radarIsRelevant(p:RadarPaper):boolean {
  if(matchAuthor(p,watchlist.excludedAuthors))return false;
  if(matchAuthor(p,watchlist.verifiedCoauthors)||matchAuthor(p,watchlist.groupResearchers)||
     matchAuthor(p,watchlist.prominentStringTheorists))return true;
  const text=p.title+" "+p.abstract;
  if(p.category==="AI for Science")
    return /machine learning|deep learning|neural network|artificial intelligence|ai for science/i.test(text)&&
      /string theor|physics|quantum|cosmolog|general relativ|gravitation|mathematical physics|theorem prov|particle physic|field theor|scientific discover/i.test(text);
  if(p.category==="Mathematics")
    return deep.test(text)||(/quantum field|quantum gravit|black hole|gauge theor/i.test(text)&&
      /geometry|conformal|supersymmetr|algebra/i.test(text));
  return deep.test(text)||(broad.test(p.title)&&/gravity|cosmology|field theory|strings|black hole|quantum/i.test(text));
}
function radarPriority(p:RadarPaper):number {
  const coauthor=matchAuthor(p,watchlist.verifiedCoauthors)||matchAuthor(p,watchlist.groupResearchers);
  const prominent=matchAuthor(p,watchlist.prominentStringTheorists);
  const strong=deep.test(p.title)?15:deep.test(p.abstract)?7:0;
  const age=(Date.now()-Date.parse(p.published))/86400000;
  return (coauthor?200:0)+(prominent?100:0)+strong+Math.max(0,16-age/3);
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
        .slice(0,54)
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
