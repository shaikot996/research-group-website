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
  title:{default:"SAM Research Group | BRAC University",template:"%s | SAM Research Group"},
  description:"Strings, Artificial Intelligence and Mathematics (SAM) Research Group at BRAC University. Research in string theory, mathematical physics, quantum gravity, cosmology and computational methods.",
  robots:{index:true,follow:true,googleBot:{index:true,follow:true,"max-image-preview":"large","max-snippet":-1}},
  openGraph:{type:"website",url:canonical,siteName:"SAM Research Group",title:"SAM Research Group | BRAC University",description:"Strings, Artificial Intelligence and Mathematics at BRAC University — theoretical and mathematical physics research."},
  twitter:{card:"summary_large_image",title:"SAM Research Group | BRAC University",description:"Strings, Artificial Intelligence and Mathematics at BRAC University."}
 };
}
export default async function Layout({children}:{children:ReactNode}){
 const s=await getSiteSettings();
 return <html lang="en" suppressHydrationWarning><body><Navbar name={s.groupName} logo={s.logoText}/><main>{children}</main><Footer s={s}/></body></html>
}
