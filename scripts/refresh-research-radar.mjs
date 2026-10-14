import { readFile, writeFile } from "node:fs/promises";
import authorWatchlist from "../data/radar-author-watchlist.json" with {type:"json"};

const OUTPUT = "data/research-radar.json";
const DAYS_TO_KEEP = 60;
const MAX_HISTORY = 54;
const FEEDS = [
  { key: "High-Energy Theory", category: "hep-th" },
  { key: "Quantum Gravity & Cosmology", category: "gr-qc" },
  { key: "Quantum Gravity & Cosmology", category: "astro-ph.CO" },
  { key: "Mathematics", category: "math-ph" },
  { key: "AI for Science", category: "cs.LG" },
];
const keywords = /string theor|compactification|quantum gravit|swampland|holograph|cosmolog|black hole|inflation|moduli|conformal field|ads\/cft|calabi.?yau|mirror symmetry|machine learning|neural network|ai for science|mathematical physics|geometr|gauge theor|quantum field|large language model|automated theorem|foundation model/i;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const xmlDecode = s => (s || "")
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
const plain = input => xmlDecode(String(input || "").replace(/<[^>]+>/g, " "))
  .replace(/\s+/g, " ").trim();
const contents = (block, name) => {
  const m = block.match(new RegExp("<(?:[\\w-]+:)?" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?" + name + ">", "i"));
  return m ? plain(m[1]) : "";
};
const validId = raw => {
  const found = String(raw || "").match(/(?:arxiv\.org\/(?:abs|pdf)\/)?((?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z-]+)?\/\d{7}))(?:v\d+)?(?:\.pdf)?$/i);
  return found?.[1] || null;
};
const isIso = date => typeof date === "string" && Number.isFinite(Date.parse(date));
export function parseAtom(xml, topic) {
  const matches = [...xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi)];
  return matches.flatMap(([, entry]) => {
    const rawId = contents(entry, "id");
    const id = validId(rawId);
    if (!id) return [];
    const title = contents(entry, "title");
    const abstract = contents(entry, "summary").replace(/^arXiv:\S+\s+Announce Type:\s*\S+\s+Abstract:\s*/i, "");
    const published = contents(entry, "published");
    if (!isIso(published) || title.length < 12 || !abstract) return [];
    const authors = [...entry.matchAll(/<author(?:\s[^>]*)?>([\s\S]*?)<\/author>/gi)]
      .map(([, a]) => contents(a, "name")).filter(Boolean).slice(0, 35);
    // arXiv daily Atom feeds use dc:creator instead of the API author nodes.
    if (!authors.length) {
      const creator = contents(entry, "creator");
      if (creator) authors.push(...creator.split(/,\s*/).filter(Boolean).slice(0,12));
    }
    return [{
      id, title: title.slice(0, 260), authors,
      abstract: abstract.slice(0, 3500),
      published: new Date(published).toISOString(),
      url: "https://arxiv.org/abs/" + id,
      category: topic.key,
      primaryCategory: topic.category,
      source: "arXiv", status: "Preprint",
    }];
  });
}
export function parseRss(xml, topic) {
  return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].flatMap(([, item]) => {
    const url = contents(item, "link") || contents(item, "guid");
    const id = validId(url);
    if (!id) return [];
    const title = contents(item, "title").replace(/^arXiv:\d{4}\.\d{4,5}\s*/i, "");
    const abstract = contents(item, "description");
    const date = contents(item, "date") || contents(item, "pubDate");
    // The arXiv RSS feed is a daily listing. If it omits the date, don't
    // invent a publication date; use API data instead.
    if (!isIso(date) || title.length < 12 || !abstract) return [];
    const creator = contents(item, "creator");
    return [{
      id, title: title.slice(0, 260), authors: creator ? creator.split(/,\s*/).slice(0, 12) : [],
      abstract: abstract.slice(0, 3500),
      published: new Date(date).toISOString(), url: "https://arxiv.org/abs/" + id,
      category: topic.key, primaryCategory: topic.category,
      source: "arXiv", status: "Preprint",
    }];
  });
}
const normalizeAuthor = name => String(name||"").normalize("NFKD").toLowerCase()
  .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
const matchedAuthors = (paper,list) => (paper.authors||[]).some(author=>
  list.some(name=>normalizeAuthor(author)===normalizeAuthor(name)));
const deepPhysics = /string theor|superstring|compactification|calabi.?yau|kahler|kähler|moduli|swampland|holograph|anti.de sitter|ads.?cft|brane|flux vacua|flux compact|type iib|supergrav|worldsheet|matrix string|f.theory|heterotic|de sitter|black hole|quantum gravit|inflation|effective field theor|conformal field theor|topological string|extra dimensions|quantum cosmolog|decompactif|supersymmet|quantum field theor|black brane|m.theory|landscape/i;
const highlySpecific = /string theor|superstring|compactification|calabi.?yau|kahler|kähler|moduli|swampland|holograph|ads.?cft|flux vacua|type iib|supergrav|worldsheet|f.theory|heterotic|topological string|decompactif|m.theory/i;
export function isRelevantPaper(paper) {
  if(matchedAuthors(paper,authorWatchlist.excludedAuthors)) return false;
  if(matchedAuthors(paper,authorWatchlist.verifiedCoauthors) ||
     matchedAuthors(paper,authorWatchlist.groupResearchers))return true;
  if(matchedAuthors(paper,authorWatchlist.prominentStringTheorists))return true;
  const text=paper.title+" "+paper.abstract;
  if(paper.category==="AI for Science")
    return /machine learning|deep learning|neural network|artificial intelligence|ai for science/i.test(text) &&
      /string theor|physics|quantum|cosmolog|general relativ|gravitation|mathematical physics|theorem prov|particle physic|field theor|scientific discover/i.test(text);
  if(paper.category==="Mathematics")
    return highlySpecific.test(text) || (/quantum field|quantum gravit|black hole|gauge theor/i.test(text) &&
      /geometry|conformal|supersymmetr|algebra/i.test(text));
  return highlySpecific.test(text) ||
    (deepPhysics.test(paper.title) && /gravity|cosmology|field theory|strings|black hole|quantum/i.test(text));
}
export function relevance(paper) {
  const haystack = (paper.title + " " + paper.abstract).toLowerCase();
  const authorScore=matchedAuthors(paper,authorWatchlist.verifiedCoauthors) ||
    matchedAuthors(paper,authorWatchlist.groupResearchers) ? 100 :
    matchedAuthors(paper,authorWatchlist.prominentStringTheorists) ? 50 : 0;
  const focus = (paper.title + " " + paper.abstract.slice(0, 380)).toLowerCase();
  const matched = keywords.test(haystack);
  const strong = keywords.test(focus);
  const daysOld = Math.max(0, (Date.now() - Date.parse(paper.published)) / 86400000);
  const subjects = {"High-Energy Theory":5,"Quantum Gravity & Cosmology":4,"Mathematics":3,"AI for Science":2};
  return authorScore + (subjects[paper.category] || 0) + (matched ? 4 : 0) + (strong ? 4 : 0) + Math.max(0, 9 - daysOld / 2);
}
export function prepareSnapshot(current, incoming, now = new Date()) {
  const cutoff = now.getTime() - DAYS_TO_KEEP * 86400000;
  const map = new Map();
  for (const item of [...(current.papers || []), ...incoming]) {
    if (!item?.id || !isIso(item.published) || Date.parse(item.published) < cutoff) continue;
    if (Date.parse(item.published) > now.getTime() + 86400000) continue;
    if (!/^https:\/\/arxiv\.org\/abs\//.test(item.url) || !isRelevantPaper(item)) continue;
    const existing = map.get(item.id);
    if (!existing || (incoming.includes(item) && !incoming.includes(existing))) map.set(item.id, item);
  }
  const papers = [...map.values()].sort((a,b) => relevance(b)-relevance(a) ||
    Date.parse(b.published)-Date.parse(a.published) || a.id.localeCompare(b.id)).slice(0, MAX_HISTORY);
  return {
    updatedAt:now.toISOString(), status:"verified",
    sources:["arXiv (official research preprints)"], papers
  };
}
async function loadPrevious() {
  try{return JSON.parse(await readFile(OUTPUT,"utf8"));}
  catch{return {updatedAt:null,papers:[]};}
}
async function download(url) {
  const response = await fetch(url, {
    headers: {"User-Agent":"SAMResearchRadar/1.0 (scholarly research digest; https://sam.cse.bracu.ac.bd/)","Accept":"application/atom+xml,application/rss+xml,application/xml,text/xml"},
    signal:AbortSignal.timeout(25000),
  });
  if(!response.ok)throw Error("HTTP "+response.status+" from "+new URL(url).hostname);
  return await response.text();
}
async function fetchCategory(topic) {
  const params = new URLSearchParams({
    search_query:"cat:"+topic.category, start:"0", max_results:"40",
    sortBy:"submittedDate", sortOrder:"descending"
  });
  const api = "https://export.arxiv.org/api/query?"+params.toString();
  const rss = "https://rss.arxiv.org/atom/"+topic.category;
  const candidates = [api,rss];
  for(const url of candidates) {
    for(let attempt=1;attempt<=2;attempt++) {
      try{
        const xml=await download(url);
        const parsed=parseAtom(xml,topic);
        const papers=parsed.length?parsed:parseRss(xml,topic);
        if(papers.length) {
          console.log("[radar] "+topic.category+": "+papers.length+" verified records via "+new URL(url).hostname);
          return papers;
        }
        throw Error("No usable arXiv items");
      }catch(error){
        console.warn("[radar] "+topic.category+" fetch attempt "+attempt+": "+String(error));
        if(attempt<2) await sleep(2000);
      }
    }
  }
  return [];
}
async function main() {
  const previous=await loadPrevious();
  const collected=[];
  let successful=0;
  for(const topic of FEEDS) {
    const papers=await fetchCategory(topic);
    if(papers.length)successful++;
    collected.push(...papers);
    await sleep(3100); // Respect arXiv API's suggested 3-second minimum.
  }
  if(successful===0) {
    // Existing checked-in snapshot stays unmodified and the scheduled job
    // fails loudly. Never silently replace verified results with placeholders.
    throw Error("All official arXiv endpoints failed; keeping last known good snapshot.");
  }
  const snapshot=prepareSnapshot(previous,collected);
  if(!snapshot.papers.length)throw Error("No recent verified papers; preserving existing snapshot.");
  await writeFile(OUTPUT,JSON.stringify(snapshot,null,2)+"\n","utf8");
  console.log("[radar] Refreshed "+snapshot.papers.length+" unique recent papers from "+
    successful+"/"+FEEDS.length+" subject feeds.");
}
if(process.argv[1]?.endsWith("refresh-research-radar.mjs")) {
  main().catch(error=>{console.error("[radar] "+String(error));process.exitCode=1;});
}
