"use client";
import {useState, type FormEvent} from "react";

const ENDPOINT = process.env.NEXT_PUBLIC_SAM_CONTACT_ENDPOINT || "";
const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function ContactForm(){
 const [status,setStatus]=useState("");
 const [sending,setSending]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(!ENDPOINT){setStatus("Online submissions are being configured. Please email the group directly for now.");return;}
  const form=e.currentTarget;
  const fd=new FormData(form);
  if(String(fd.get("website")||"").trim())return;
  const file=fd.get("cv");
  if(file instanceof File && file.size>MAX_FILE_BYTES){setStatus("CV must be 5 MB or smaller.");return;}
  if(file instanceof File && file.size && file.type!=="application/pdf"){setStatus("Please attach a PDF CV.");return;}
  setSending(true);setStatus("");
  try{
   let cvBase64="";
   if(file instanceof File && file.size){
    const buf=await file.arrayBuffer();
    const bytes=new Uint8Array(buf);
    let binary="";
    for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    cvBase64=btoa(binary);
   }
   const payload=new URLSearchParams({
    name:String(fd.get("name")||""),email:String(fd.get("email")||""),
    topic:String(fd.get("topic")||""),message:String(fd.get("message")||""),
    website:"",cvBase64,cvFilename:file instanceof File?file.name:"",
    timestamp:String(Date.now()),
   });
   // Apps Script redirects POST responses. Cross-origin fetch is opaque; do not
   // falsely tell applicants delivery succeeded without server confirmation.
   await fetch(ENDPOINT,{method:"POST",mode:"no-cors",body:payload});
   setStatus("Submission sent for processing. Please also retain a copy of your message; confirmation is not available for this connection.");
   form.reset();
  }catch{
   setStatus("We could not submit the form. Please email the group instead.");
  }finally{setSending(false);}
 }
 const common="w-full border academic-rule surface px-4 py-3 text-sm";
 return <section aria-label="Contact form" className="border-t-2 academic-rule pt-6">
  <h2 className="font-serif text-3xl">Send an inquiry</h2>
  <p className="mt-3 text-sm leading-7 text-muted">Share your question, research interests or undergraduate research inquiry. A PDF CV is optional.</p>
  {!ENDPOINT?<p className="mt-4 text-sm text-muted">Online submission will be enabled after the secure Drive receiver is deployed. Use the email link below in the meantime.</p>:null}
  <form className="mt-6 space-y-4" onSubmit={submit}>
   <div className="hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
   <label className="block text-sm">Name<input className={common+" mt-2"} name="name" required minLength={2} maxLength={100}/></label>
   <label className="block text-sm">Email<input className={common+" mt-2"} name="email" type="email" required maxLength={180}/></label>
   <label className="block text-sm">Inquiry type<select className={common+" mt-2"} name="topic" required><option value="Undergraduate research">Undergraduate research</option><option value="Research collaboration">Research collaboration</option><option value="Seminar or visit">Seminar or visit</option><option value="General inquiry">General inquiry</option></select></label>
   <label className="block text-sm">Your message<textarea className={common+" mt-2"} name="message" rows={5} minLength={20} maxLength={5000} required/></label>
   <label className="block text-sm">CV (optional, PDF up to 5 MB)<input className="mt-2 block w-full text-sm" name="cv" type="file" accept=".pdf,application/pdf"/></label>
   <button type="submit" disabled={!ENDPOINT||sending} className="bg-[#172a46] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{sending?"Submitting…":"Submit inquiry"}</button>
   <p role="status" aria-live="polite" className="text-sm text-muted">{status}</p>
  </form>
 </section>;
}
