"use client";
import { useEffect, useState } from "react";
import { uploadMedia } from "@/app/admin/actions";
import { Field, inputClass } from "@/components/admin/common";

export function MediaUploadForm(){
  const [preview,setPreview]=useState<string|null>(null);
  const [isImage,setIsImage]=useState(false);
  useEffect(()=>()=>{ if(preview) URL.revokeObjectURL(preview); },[preview]);
  return <form action={uploadMedia} encType="multipart/form-data" className="grid gap-5 border academic-rule p-5">
    <Field label="File">
      <input required type="file" name="file" accept="image/jpeg,image/png,image/webp,application/pdf" className={inputClass} onChange={e=>{
        if(preview) URL.revokeObjectURL(preview);
        const f=e.target.files?.[0];
        setIsImage(Boolean(f?.type.startsWith("image/")));
        setPreview(f?URL.createObjectURL(f):null);
      }}/>
    </Field>
    {preview&&<div className="border academic-rule p-3">{isImage?<img src={preview} alt="Selected upload preview" className="max-h-64 w-full object-contain"/>:<div className="text-sm text-muted">PDF selected and ready to upload.</div>}</div>}
    <Field label="Alt text / description"><input name="altText" className={inputClass}/></Field>
    <button className="justify-self-start bg-[#172a46] px-5 py-3 text-white">Upload media</button>
  </form>
}
