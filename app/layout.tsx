import type {Metadata} from "next";
import type {ReactNode} from "react";
import "./globals.css";
import {Navbar} from "@/components/navbar";
import {Footer} from "@/components/footer";
import {getSiteSettings} from "@/lib/site";
import {absolute} from "@/lib/utils";
export const dynamic = "force-dynamic";
export async function generateMetadata():Promise<Metadata>{
 const s=await getSiteSettings();
 const canonical=absolute("/");
 return {
  metadataBase:new URL(canonical),
  title:{default:s.groupName,template:`%s | ${s.groupName}`},
  description:s.groupDescription,
  alternates:{canonical},
  robots:{index:true,follow:true,googleBot:{index:true,follow:true,"max-image-preview":"large","max-snippet":-1}},
  openGraph:{type:"website",url:canonical,siteName:"SAM Research Group",title:s.groupName,description:s.groupDescription},
  twitter:{card:"summary_large_image",title:s.groupName,description:s.groupDescription}
 };
}
export default async function Layout({children}:{children:ReactNode}){
 const s=await getSiteSettings();
 return <html lang="en" suppressHydrationWarning><body><Navbar name={s.groupName} logo={s.logoText}/><main>{children}</main><Footer s={s}/></body></html>
}
