/** Gallery is serialized by the Drive importer, never executable markup. */
export function editorialGallery(raw:string|null|undefined):string[] {
  if(!raw)return [];
  try {
    const parsed:unknown=JSON.parse(raw);
    if(!Array.isArray(parsed))return [];
    return parsed.filter((x):x is string=>
      typeof x==="string"&& /^\/drive-news-events\/(?:news|event)\/[a-z0-9-]+\/gallery-\d+\.(?:jpe?g|png|webp)$/.test(x)
    ).slice(0,15);
  }catch{return [];}
}
export function editorialDate(date:Date) {
  return new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Dhaka"}).format(date);
}
