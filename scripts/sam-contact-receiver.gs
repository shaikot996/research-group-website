/**
 * SAM contact receiver (Google Apps Script).
 * Deployment: Deploy > New deployment > Web app.
 * Execute as: Me (the SAM Drive owner); Access: Anyone.
 * Set script property SAM_CONTACT_FOLDER_ID to the private Contact Responses folder.
 * Publish the resulting /exec URL as GitHub Actions variable SAM_CONTACT_ENDPOINT
 * and pass NEXT_PUBLIC_SAM_CONTACT_ENDPOINT during npm run build.
 *
 * WARNING: public endpoints can be spammed. Use Workspace audit logs and rate
 * limiting / CAPTCHA via a trusted proxy before wide public use.
 */
const LIMIT=5*1024*1024;
function doPost(e){
 try{
  const x=e.parameter||{};
  const name=(x.name||"").trim(),email=(x.email||"").trim();
  const msg=(x.message||"").trim(),topic=(x.topic||"").trim();
  if(x.website)return ContentService.createTextOutput("ignored");
  if(name.length<2||name.length>100||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||msg.length<20||msg.length>5000)throw Error("Bad input");
  if(!["Undergraduate research","Research collaboration","Seminar or visit","General inquiry"].includes(topic))throw Error("Bad topic");
  const rootId=PropertiesService.getScriptProperties().getProperty("SAM_CONTACT_FOLDER_ID");
  if(!rootId)throw Error("Contact folder not configured");
  const lock=LockService.getScriptLock();
  lock.waitLock(20000);
  try{
   const folder=DriveApp.getFolderById(rootId);
   const slug=name.replace(/[^A-Za-z0-9 -]/g,"").trim().replace(/\s+/g,"-").slice(0,60)||"Applicant";
   const d=Utilities.formatDate(new Date(),"Asia/Dhaka","yyyy-MM-dd_HH-mm-ss");
   const mine=folder.createFolder(d+"_"+slug);
   const content=["Name: "+name,"Email: "+email,"Inquiry type: "+topic,"Submitted: "+new Date().toISOString(),"","Message:",msg].join("\n");
   mine.createFile("Response.txt",content,MimeType.PLAIN_TEXT);
   if(x.cvBase64){
    if(x.cvBase64.length>Math.ceil(LIMIT*4/3)+100)throw Error("CV too large");
    const bytes=Utilities.base64Decode(x.cvBase64);
    if(bytes.length>LIMIT||bytes.length<5||bytes[0]!==37||bytes[1]!==80||bytes[2]!==68||bytes[3]!==70||bytes[4]!==45)throw Error("CV not a PDF");
    mine.createFile(Utilities.newBlob(bytes,"application/pdf","CV.pdf"));
   }
  }finally{lock.releaseLock();}
  return ContentService.createTextOutput("received");
 }catch(err){
  console.error(String(err));
  return ContentService.createTextOutput("invalid");
 }
}
