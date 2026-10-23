// One-time verifiable inspection: canonical INSPIRE literature record 3217980.
// An author byline alone does not prove that INSPIRE has a dedicated author profile.
const url="https://inspirehep.net/api/literature/3217980";
const response=await fetch(url,{headers:{Accept:"application/json","User-Agent":"SAM-Research-Group-Website/1.2"},signal:AbortSignal.timeout(20000)});
if(!response.ok){console.log("[inspire-audit] HTTP "+response.status+"; no verified author links yet.");process.exit(0)}
const payload=await response.json();
const authors=payload.metadata?.authors||[];
const target=["Arko, Kazi Fahim Reza","Hasan, Walid","Hoque, M. Fahim","Kamal, Ahmed Rakin"];
for(const name of target){
  const author=authors.find(a=>a.full_name?.toLowerCase()===name.toLowerCase());
  const ref=author?.record?.$ref||"";
  const match=ref.match(/\/authors\/(\d+)/);
  console.log("[inspire-audit] "+JSON.stringify({name,byline:!!author,authorId:match?.[1]||null,curatedRelation:!!match}));
}
