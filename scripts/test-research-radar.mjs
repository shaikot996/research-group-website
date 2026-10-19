import assert from "node:assert/strict";
import {parseAtom,parseRss,prepareSnapshot,relevance,isRelevantPaper} from "./refresh-research-radar.mjs";
const topic={key:"High-Energy Theory",category:"hep-th"};
const atom='<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">'+
'<entry><id>https://arxiv.org/abs/2610.12345v2</id>'+
'<title>Moduli Spaces and Quantum Gravity Constraints</title>'+
'<published>2026-10-13T08:05:00Z</published>'+
'<summary>We explore string compactifications &amp; moduli spaces.</summary>'+
'<author><name>First Author</name></author><author><name>Second Author</name></author></entry></feed>';
const parsed=parseAtom(atom,topic);
assert.equal(parsed.length,1);
assert.equal(parsed[0].id,"2610.12345");
assert.equal(parsed[0].authors[1],"Second Author");
assert.equal(parsed[0].url,"https://arxiv.org/abs/2610.12345");
assert.match(parsed[0].abstract,/& moduli/);
const rss='<rss><channel><item>'+
'<title>Quantum Cosmology and Holographic Dynamics</title>'+
'<link>https://arxiv.org/abs/2610.11111</link>'+
'<description>We discuss gravity in expanding spacetimes.</description>'+
'<dc:date>2026-10-14T04:00:00Z</dc:date></item></channel></rss>';
const rssItems=parseRss(rss,{key:"Quantum Gravity & Cosmology",category:"gr-qc"});
assert.equal(rssItems[0]?.id,"2610.11111");
const snapshot=prepareSnapshot({papers:[parsed[0]]},[parsed[0],...rssItems],new Date("2026-10-14T12:00:00Z"));
assert.equal(snapshot.papers.length,2,"duplicate arXiv versions must not multiply");
assert.ok(snapshot.papers.every(p=>p.source==="arXiv"));
assert.ok(relevance(parsed[0])>0);
const old={...parsed[0],published:"2019-01-01T00:00:00Z"};
assert.equal(prepareSnapshot({papers:[old]},[],new Date("2026-10-14T12:00:00Z")).papers.length,0);
assert.equal(parseAtom("<feed><entry><id>https://example.com/paper</id></entry></feed>",topic).length,0);
assert.equal(parseRss("<rss><item><title>Fake News</title><link>https://example.com/story</link></item></rss>",topic).length,0);
console.log("Research Radar verified-feed, deduplication, freshness and ranking tests passed.");

const unwanted={...parsed[0],authors:["Vladimir Rosenhaus"]};
assert.equal(isRelevantPaper(unwanted),false,"Excluded author must not be featured");
const irrelevant={...parsed[0],authors:["Another Researcher"],title:"A generic method for financial risk",abstract:"We study equity options in a stochastic market.",category:"AI for Science"};
assert.equal(isRelevantPaper(irrelevant),false,"Generic AI/finance papers must be excluded");
assert.equal(isRelevantPaper({...parsed[0],authors:["Noshin Ferdous Shamma"]}),true,"Verified coauthors must be tracked");
console.log("Curated and excluded author tracking tests passed.");

// Do not let famous hep-th authors crowd mathematics, AI or quantum-information
// publications out of the daily Radar. Check five-way topical coverage.
const themes = [
  ["High-Energy Theory","hep-th","String compactification and moduli dynamics","Type IIB supergravity and swampland physics"],
  ["Quantum Gravity & Cosmology","gr-qc","Anisotropic inflationary cosmology with black holes","Raychaudhuri equations in early universe cosmology"],
  ["Mathematics","math.OA","Noncommutative operator algebras and spectral triples","Moyal geometry and mathematical physics"],
  ["AI for Science","cs.LG","Neural operators for quantum field theory","Machine learning for scientific computing in physics"],
  ["Quantum Information","quant-ph","Quantum information and error correction","Quantum circuits and entanglement entropy"]
];
const basePapers=themes.flatMap(([category,primaryCategory,title,abstract],group)=>
  Array.from({length:25},(_,i)=>({
    ...parsed[0],
    id:`2610.${String(20000+group*100+i).padStart(5,"0")}`,
    url:`https://arxiv.org/abs/2610.${String(20000+group*100+i).padStart(5,"0")}`,
    category,primaryCategory,title,abstract,
    authors:["Sample Author"],
    published:new Date(Date.UTC(2026,9,14)-(i*1800000)).toISOString()
  })));
const diversified=prepareSnapshot({papers:[]},basePapers,new Date("2026-10-14T14:00:00Z"));
assert.equal(diversified.papers.length,110);
for(const [category] of themes) {
  const count=diversified.papers.filter(p=>p.category===category).length;
  assert.ok(count>=15,`Must retain at least fifteen relevant ${category} papers, found ${count}`);
}
const generic={...parsed[0],category:"AI for Science",title:"Neural networks for retail sales",abstract:"Machine learning in advertising and sales"};
assert.equal(isRelevantPaper(generic),false);
console.log("Five-theme category quota, quantum-information, math and AI matching tests passed.");
