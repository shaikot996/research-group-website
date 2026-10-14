import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { extractDocxText } from "../lib/docx-text";
import { editorialSlug, parseEditorialDocument, type EditorialKind } from "../lib/drive-editorial";
import { imageExtensionFromBytes } from "../lib/drive-leader-media";
import {
  downloadGoogleDriveFile, getGoogleDriveAccessToken, GOOGLE_DOC_MIME, GOOGLE_DRIVE_FOLDER_MIME,
  listGoogleDriveChildren, readGoogleServiceAccount,
  type GoogleDriveAuth, type GoogleDriveFile,
} from "../lib/google-drive";

if (process.env.NODE_ENV !== "production") {
  try { process.loadEnvFile(".env"); } catch { /* supplied by CI */ }
}
const prisma = new PrismaClient();
const rootId = process.env.GOOGLE_DRIVE_NEWS_EVENTS_FOLDER_ID?.trim() || "19frcFmQJsFFA3xU6TqiypUvEeuVZ2fi6";
const mediaRoot = path.resolve("public/drive-news-events");
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const TEXT = "text/plain";
type Candidate = { folder: GoogleDriveFile; kind?: EditorialKind };
function placeholder(name: string) {
  return /(?:^|[^a-z])(?:dummy|test|template|example|sample|draft)(?:$|[^a-z])/i.test(name);
}
async function retry<T>(name:string, fn:()=>Promise<T>):Promise<T> {
  for(let n=1;n<=3;n++) {
    try {return await fn();}
    catch(error) {
      if(n===3) throw error;
      console.warn("[editorial] Retry "+name+" "+n+"/3: "+String(error));
      await new Promise(resolve=>setTimeout(resolve,n*850));
    }
  }
  throw new Error("Retry exhausted: "+name);
}
async function discover(auth:GoogleDriveAuth|null) {
  const first = await retry("news/events root",()=>listGoogleDriveChildren(auth,rootId));
  const containers = first.filter(f=>f.mimeType===GOOGLE_DRIVE_FOLDER_MIME);
  const candidates: Candidate[] = [];
  for(const item of containers) {
    if(placeholder(item.name)) continue;
    let kind:EditorialKind|undefined;
    if(/^news(?:[\s_-]*and[\s_-]*updates?)?$/i.test(item.name)) kind="NEWS";
    else if(/^events?(?:[\s_-]*and[\s_-]*seminars?)?$/i.test(item.name)) kind="EVENT";
    if(kind) {
      const child = await retry(item.name+" container",()=>listGoogleDriveChildren(auth,item.id));
      for(const folder of child.filter(f=>f.mimeType===GOOGLE_DRIVE_FOLDER_MIME && !placeholder(f.name))) {
        candidates.push({folder,kind});
      }
    } else {
      // Also support direct folders in root, when the document has TYPE: NEWS/EVENT.
      candidates.push({folder:item});
    }
  }
  if(candidates.length>500) throw new Error("Too many editorial folders; refusing to import.");
  console.log("[editorial] Discovered "+candidates.length+" candidate news/events folders.");
  return candidates;
}
function chooseDoc(files:GoogleDriveFile[]) {
  return files.filter(f=>f.mimeType===GOOGLE_DOC_MIME || f.mimeType===DOCX || f.mimeType===TEXT || /\.(?:docx|txt)$/i.test(f.name))
    .sort((a,b)=>{
      const score=(f:GoogleDriveFile)=>/(?:story|article|event|news|details|about|content)/i.test(f.name)?10:0;
      return score(b)-score(a)||a.name.localeCompare(b.name);
    })[0];
}
function chooseImages(files:GoogleDriveFile[]) {
  const images = files.filter(f=>/\.(?:jpe?g|png|webp)$/i.test(f.name)||/^image\/(?:jpeg|png|webp)$/i.test(f.mimeType));
  const cover=images.find(f=>/^(?:cover|poster|banner|hero|featured)(?:[._ -]|$)/i.test(f.name))
    || images.find(f=>/^(?:profile|image)(?:[._ -]|$)/i.test(f.name))
    || images[0];
  return {cover, gallery:images.filter(f=>f.id!==cover?.id).slice(0,15)};
}
async function downloadImage(auth:GoogleDriveAuth|null, file:GoogleDriveFile) {
  if(Number(file.size||"0")>15_000_000) throw new Error("Image exceeds 15MB: "+file.name);
  const bytes=await retry(file.name,()=>downloadGoogleDriveFile(auth,file));
  if(bytes.length>15_000_000) throw new Error("Image exceeds 15MB: "+file.name);
  const ext=imageExtensionFromBytes(bytes);
  return {bytes,ext};
}
async function syncEntry(auth:GoogleDriveAuth|null, candidate:Candidate) {
  const {folder,kind:assumedKind}=candidate;
  const files=await retry("listing "+folder.name,()=>listGoogleDriveChildren(auth,folder.id));
  const doc=chooseDoc(files);
  if(!doc) {
    console.log("[editorial] Skipped "+folder.name+": no Google Doc/DOCX/TXT file.");
    return "skipped";
  }
  const raw=await retry("profile "+folder.name,()=>downloadGoogleDriveFile(auth,doc));
  const body=doc.mimeType===DOCX||/\.docx$/i.test(doc.name)?extractDocxText(raw):raw.toString("utf8");
  let parsed;
  try {parsed=parseEditorialDocument(body,folder.name,assumedKind);}
  catch(error) {
    console.warn("[editorial] Skipped invalid document in "+folder.name+": "+String(error));
    return "skipped";
  }
  const existing = parsed.kind==="NEWS"
    ? await prisma.newsPost.findUnique({where:{driveFolderId:folder.id}})
    : await prisma.event.findUnique({where:{driveFolderId:folder.id}});
  const slug=existing?.slug || editorialSlug(parsed.title,folder.id);
  // Never overwrite old hand-curated records, even on a slug collision.
  if(!existing) {
    const collision=parsed.kind==="NEWS"
      ?await prisma.newsPost.findUnique({where:{slug}})
      :await prisma.event.findUnique({where:{slug}});
    if(collision) throw new Error("Editorial slug collision for "+folder.name);
  }
  const images=chooseImages(files);
  const cover=images.cover?await downloadImage(auth,images.cover):null;
  const gallery=await Promise.all(images.gallery.map(f=>downloadImage(auth,f)));
  const dir=path.join(mediaRoot,parsed.kind.toLowerCase(),slug);
  await mkdir(dir,{recursive:true});
  const existingFiles=await readdir(dir);
  const filenames=new Set<string>();
  let coverUrl:string|null=null;
  if(cover) {
    const file="cover"+cover.ext;
    await writeFile(path.join(dir,file),cover.bytes);
    filenames.add(file);
    coverUrl="/drive-news-events/"+parsed.kind.toLowerCase()+"/"+slug+"/"+file;
  }
  const galleryUrls:string[]=[];
  for(let i=0;i<gallery.length;i++) {
    const image=gallery[i];
    const name="gallery-"+String(i+1).padStart(2,"0")+image.ext;
    await writeFile(path.join(dir,name),image.bytes);
    filenames.add(name);
    galleryUrls.push("/drive-news-events/"+parsed.kind.toLowerCase()+"/"+slug+"/"+name);
  }
  for(const old of existingFiles) {
    if(!filenames.has(old) && /^cover\.|^gallery-\d+\./.test(old)) {
      await rm(path.join(dir,old),{force:true});
    }
  }
  if(parsed.kind==="NEWS") {
    const data={
      title:parsed.title, summary:parsed.summary, body:parsed.body, date:parsed.date,
      image:coverUrl, gallery:JSON.stringify(galleryUrls), category:parsed.category||"Group News",
      featured:parsed.featured, externalUrl:parsed.externalUrl||null,
      source:"DRIVE", driveFolderId:folder.id,
      status:parsed.published?"PUBLISHED":"DRAFT",
    };
    if(existing) await prisma.newsPost.update({where:{id:existing.id},data});
    else await prisma.newsPost.create({data:{...data,slug}});
  } else {
    const data={
      title:parsed.title, speaker:parsed.speaker||null,affiliation:parsed.affiliation||null,
      date:parsed.date, endDate:parsed.endDate||null, timeText:parsed.timeText||null,
      location:parsed.location||null,abstract:parsed.summary,
      description:parsed.body||null, category:parsed.category||"Seminar",
      registrationUrl:parsed.registrationUrl||null, externalUrl:parsed.externalUrl||null,
      poster:coverUrl,gallery:JSON.stringify(galleryUrls),source:"DRIVE",
      driveFolderId:folder.id,status:parsed.date.getTime()>=Date.now()?"UPCOMING":"COMPLETED",
      publishStatus:parsed.published?"PUBLISHED":"DRAFT",
    };
    if(existing) await prisma.event.update({where:{id:existing.id},data});
    else await prisma.event.create({data:{...data,slug}});
  }
  console.log("[editorial] "+(parsed.published?"Published ":"Draft ")+parsed.kind.toLowerCase()+" "+slug+" ("+files.length+" files)");
  return "synced";
}
async function main() {
  const account=readGoogleServiceAccount();
  if(!account) throw new Error("Missing Google service account. Editorial data must remain private.");
  const auth:GoogleDriveAuth={type:"bearer",value:await getGoogleDriveAccessToken(account)};
  const candidates=await discover(auth);
  const seen=new Set(candidates.map(c=>c.folder.id));
  let ok=0,skipped=0,fail=0;
  for(const candidate of candidates) {
    try {
      const res=await syncEntry(auth,candidate);
      if(res==="synced") ok++;else skipped++;
    } catch(error) {
      fail++;
      console.error("[editorial] Failed "+candidate.folder.name+": "+String(error));
    }
  }
  // Never delete source content; archived Drive records only. If any error,
  // hold existing rows as-is rather than mistakenly unpublishing content.
  if(!fail) {
    const [oldNews,oldEvents]=await Promise.all([
      prisma.newsPost.findMany({where:{source:"DRIVE"},select:{id:true,driveFolderId:true,status:true}}),
      prisma.event.findMany({where:{source:"DRIVE"},select:{id:true,driveFolderId:true,publishStatus:true}}),
    ]);
    for(const n of oldNews) if(n.driveFolderId&&!seen.has(n.driveFolderId)&&n.status==="PUBLISHED")
      await prisma.newsPost.update({where:{id:n.id},data:{status:"DRAFT"}});
    for(const e of oldEvents) if(e.driveFolderId&&!seen.has(e.driveFolderId)&&e.publishStatus==="PUBLISHED")
      await prisma.event.update({where:{id:e.id},data:{publishStatus:"DRAFT"}});
  }
  console.log("[editorial] Complete: "+ok+" synced, "+skipped+" skipped, "+fail+" failed; "+candidates.length+" folders.");
  if(fail) process.exitCode=1;
}
main().catch(error=>{console.error("[editorial] Fatal: "+String(error));process.exitCode=1;})
 .finally(()=>prisma.$disconnect());
