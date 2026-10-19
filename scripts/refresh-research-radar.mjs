import { readFile, writeFile } from "node:fs/promises";
import authorWatchlist from "../data/radar-author-watchlist.json" with {type:"json"};

const OUTPUT = "data/research-radar.json";
const DAYS_TO_KEEP = 45;
const MAX_HISTORY = 110;
const FEEDS = [
  { key: "High-Energy Theory", category: "hep-th" },
  { key: "Quantum Gravity & Cosmology", category: "gr-qc" },
  { key: "Quantum Gravity & Cosmology", category: "astro-ph.CO" },
  { key: "High-Energy Theory", category: "hep-ph" },
  { key: "Mathematics", category: "math-ph" },
  { key: "Mathematics", category: "math.DG" },
  { key: "Mathematics", category: "math.OA" },
  { key: "Mathematics", category: "math.FA" },
  { key: "Mathematics", category: "math.QA" },
  { key: "AI for Science", category: "cs.LG" },
  { key: "AI for Science", category: "cs.AI" },
  { key: "AI for Science", category: "stat.ML" },
  { key: "Quantum Information", category: "quant-ph" },
];
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
const stringTheory = /string theor|superstring|compactific|calabi.?yau|k[aä]hler|moduli|swampland|holograph|ads.?cft|flux vacua|flux compact|type iib|type iia|supergrav|worldsheet|f.theory|heterotic|topological string|decompactif|m.theory|brane|extra.dimension|landscape|kaluza.klein|quantum gravit|supersymmetr|conformal field theor/i;
const cosmology = /cosmolog|inflation|early.universe|de sitter|anti.de sitter|black hole|raychaudhuri|anisotrop|bianchi|bounce|dark energy|dark matter|primordial|big bang|reheating|scalar.tens|quantum gravity|spacetime|gravitational collapse|singularit|black brane/i;
const mathematics = /noncommutative|operator algebra|functional analy|spectral triple|dirac operator|moyal|symplectic|differential geometr|kahler|kähler|k.theor|index theor|geometric quantiz|gauge theor|quantum group|quantum algebra|geometric representation|quantum field theor|integrable system|moduli space|mirror symmetry|algebraic geometr|topological field theor|conformal field theor|mathematical physics/i;
const aiMethod = /machine learning|deep learning|neural network|neural operator|physics.informed|artificial intelligence|large language model|foundation model|symbolic regression|automated theorem|theorem prov|scientific machine learning|equation discovery/i;
const aiDomain = /physic|quantum|cosmolog|gravit|astronom|mathematic|theorem|geometry|algebra|partial differential|pdes?\b|differential equation|scientific computing|scientific discover|field theor|particle|lattice gauge|computational science|symbolic mathematic/i;
const quantumInfo = /quantum inform|quantum comput|quantum algorithm|quantum circuit|quantum error correct|quantum channel|entanglement|quantum entropy|quantum complexity|quantum simulation|quantum cryptograph|quantum many.body|holograph|quantum code|quantum teleport/i;

export function isRelevantPaper(paper) {
  if (matchedAuthors(paper,authorWatchlist.excludedAuthors)) return false;
  const combined = paper.title + " " + paper.abstract;
  const title = paper.title;
  // Focus gates also apply to watched authors: a famous name is not enough.
  if (paper.category === "Mathematics") {
    return mathematics.test(title) || (mathematics.test(combined) &&
      /physics|quantum|spectral|operator|noncommutative|gauge|symplectic|geometry/i.test(title));
  }
  if (paper.category === "AI for Science")
    return aiMethod.test(combined) && aiDomain.test(combined) &&
      (aiMethod.test(title) || aiDomain.test(title));
  if (paper.category === "Quantum Information")
    return quantumInfo.test(title) ||
      (quantumInfo.test(combined) && /quantum|entanglement|holograph|information/i.test(title));
  if (paper.category === "Quantum Gravity & Cosmology")
    return stringTheory.test(title) || cosmology.test(title) ||
      (stringTheory.test(combined) && cosmology.test(combined));
  return stringTheory.test(title) || cosmology.test(title) ||
    (/quantum field|conformal field|effective field|gauge theor|scattering amplitude|spectral theor/i.test(title) &&
      /string|quantum|gravity|field|conformal|holograph|gauge/i.test(combined));
}
export function relevance(paper, now = new Date()) {
  const title = paper.title;
  const abstract = paper.abstract;
  const isAuthor = matchedAuthors(paper,authorWatchlist.verifiedCoauthors) ||
    matchedAuthors(paper,authorWatchlist.groupResearchers);
  const isProminent = matchedAuthors(paper,authorWatchlist.prominentStringTheorists);
  const titleFocus = stringTheory.test(title) || cosmology.test(title) ||
    mathematics.test(title) || quantumInfo.test(title) || (aiMethod.test(title) && aiDomain.test(title));
  const abstractFocus = stringTheory.test(abstract) || cosmology.test(abstract) ||
    mathematics.test(abstract) || quantumInfo.test(abstract) || (aiMethod.test(abstract) && aiDomain.test(abstract));
  const daysOld = Math.max(0, (now.getTime() - Date.parse(paper.published)) / 86400000);
  return (isAuthor ? 14 : isProminent ? 7 : 0) + (titleFocus ? 13 : 0) +
    (abstractFocus ? 4 : 0) + Math.max(0, 34 - daysOld * 1.8);
}
const CATEGORY_QUOTAS = {
  "High-Energy Theory": 36,
  "Quantum Gravity & Cosmology": 24,
  "Mathematics": 20,
  "AI for Science": 15,
  "Quantum Information": 15,
};
const CATEGORY_MAXIMUM = {
  "High-Energy Theory": 46,
  "Quantum Gravity & Cosmology": 30,
  "Mathematics": 25,
  "AI for Science": 19,
  "Quantum Information": 19,
};
export function prepareSnapshot(current, incoming, now = new Date()) {
  const cutoff = now.getTime() - DAYS_TO_KEEP * 86400000;
  const map = new Map();
  for (const item of [...(current.papers || []), ...incoming]) {
    if (!item?.id || !isIso(item.published) || Date.parse(item.published) < cutoff) continue;
    if (Date.parse(item.published) > now.getTime() + 86400000) continue;
    if (!/^https:\/\/arxiv\.org\/abs\//.test(item.url) || !isRelevantPaper(item)) continue;
    // Prefer freshly fetched metadata over a stored record with the same ID.
    const existing = map.get(item.id);
    // Author-only queries do not carry a reliable subject; preserve a feed
    // category when an overlapping article is also found in an official feed.
    const fromWatchedAuthorWithGenericHep = item.primaryCategory === "hep-th" &&
      item.category === "High-Energy Theory" && incoming.includes(item);
    if (!existing || !fromWatchedAuthorWithGenericHep || existing.category === "High-Energy Theory")
      map.set(item.id, item);
  }
  const ranked = [...map.values()].sort((a,b) =>
    relevance(b, now)-relevance(a, now) ||
    Date.parse(b.published)-Date.parse(a.published) || a.id.localeCompare(b.id));
  const selected = [], used = new Set(), perCategory = {};
  function select(item) {
    if (used.has(item.id)) return;
    used.add(item.id); selected.push(item);
    perCategory[item.category] = (perCategory[item.category] || 0) + 1;
  }
  for (const [category, quota] of Object.entries(CATEGORY_QUOTAS))
    for (const paper of ranked) {
      if (perCategory[category] >= quota) break;
      if (paper.category === category) select(paper);
    }
  for (const paper of ranked) {
    if (selected.length >= MAX_HISTORY) break;
    if ((perCategory[paper.category] || 0) < (CATEGORY_MAXIMUM[paper.category] || 0))
      select(paper);
  }
  const papers = selected.sort((a,b)=>relevance(b,now)-relevance(a,now) ||
    Date.parse(b.published)-Date.parse(a.published) || a.id.localeCompare(b.id));
  return {updatedAt:now.toISOString(),status:"verified",
    sources:["arXiv official API and official subject feeds"],
    papers};
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
    search_query:"cat:"+topic.category, start:"0", max_results:"75",
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
export function authorWatchQueries(names, batchSize=5) {
  const unique=[...new Set(names.filter(Boolean))];
  const queries=[];
  for(let i=0;i<unique.length;i+=batchSize) {
    const batch=unique.slice(i,i+batchSize);
    queries.push({
      batch,
      query:batch.map(name=>'au:"'+name.replaceAll('"',"")+'"').join(" OR ")
    });
  }
  return queries;
}
async function fetchWatchlistPapers() {
  const names=[...authorWatchlist.prominentStringTheorists,
    ...authorWatchlist.verifiedCoauthors,...authorWatchlist.groupResearchers];
  const batches=authorWatchQueries(names,5);
  const found=[];
  for(const {batch,query} of batches) {
    const params=new URLSearchParams({
      search_query:query,start:"0",max_results:"50",
      sortBy:"submittedDate",sortOrder:"descending"
    });
    try {
      const xml=await download("https://export.arxiv.org/api/query?"+params);
      const parsed=parseAtom(xml,{key:"High-Energy Theory",category:"hep-th"});
      // Never treat a substring or coincidental coauthor name as a match.
      const exact=parsed.filter(p=>matchedAuthors(p,batch));
      found.push(...exact);
      console.log("[radar] Author watchlist batch: "+exact.length+" tracked submissions.");
    } catch(error) {
      console.warn("[radar] Author watchlist API batch unavailable: "+String(error));
    }
    await sleep(3100);
  }
  return found;
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
  const authorPapers=await fetchWatchlistPapers();
  collected.push(...authorPapers);
  if(successful===0 && authorPapers.length===0) {
    // Existing checked-in snapshot stays unmodified and the scheduled job
    // fails loudly. Never silently replace verified results with placeholders.
    throw Error("All official arXiv endpoints failed; keeping last known good snapshot.");
  }
  const snapshot=prepareSnapshot(previous,collected);
  if(!snapshot.papers.length)throw Error("No recent verified papers; preserving existing snapshot.");
  await writeFile(OUTPUT,JSON.stringify(snapshot,null,2)+"\n","utf8");
  console.log("[radar] Refreshed "+snapshot.papers.length+" topic-balanced papers from "+
    successful+"/"+FEEDS.length+" subject feeds plus "+authorPapers.length+" tracked-author records.");
}
if(process.argv[1]?.endsWith("refresh-research-radar.mjs")) {
  main().catch(error=>{console.error("[radar] "+String(error));process.exitCode=1;});
}
