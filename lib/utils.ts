export const slugify=(s:string)=>s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
export const humanize=(s:string)=>s.toLowerCase().replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
export const lines=(s?:string|null)=>(s??"").split(/\r?\n|;/).map(x=>x.trim()).filter(Boolean);
export const fmt=(d:Date|string,o?:Intl.DateTimeFormatOptions)=>new Intl.DateTimeFormat("en-GB",o??{day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Dhaka"}).format(typeof d==="string"?new Date(d):d);
export const absolute=(p="/")=>(process.env.SITE_URL||process.env.NEXTAUTH_URL||"http://localhost:3000").replace(/\/$/,"")+(p.startsWith("/")?p:`/${p}`);
