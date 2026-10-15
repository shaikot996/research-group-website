import type { Metadata } from "next";
import Link from "next/link";
import {SectionHeader} from "@/components/ui";
export const metadata: Metadata = {
 title:"Undergraduate Research Opportunities",
 description:"Explore undergraduate research opportunities with SAM at BRAC University in theoretical physics, mathematics and scientific computing.",
 alternates:{canonical:"/join/"}
};
export default function Page(){
 return <div className="container-site section-space max-w-5xl">
  <SectionHeader eyebrow="Opportunities" title="Join Us" description="Undergraduate research and collaboration at SAM." />
  <div className="mt-10 space-y-10">
   <section><h2 className="font-serif text-3xl">Undergraduate Research Opportunities</h2>
    <p className="mt-4 leading-8 text-muted">We welcome motivated undergraduate students interested in theoretical physics, mathematics, artificial intelligence and computational research. Research opportunities depend on current projects, preparation and mentorship capacity. Students may express their interests and share their academic background, relevant skills and CV.</p></section>
   <section><h2 className="font-serif text-3xl">Research Collaborations and Visitors</h2><p className="mt-4 leading-8 text-muted">Researchers interested in scholarly collaborations, seminars or joint computational projects are welcome to contact us.</p></section>
   <section><h2 className="font-serif text-3xl">How to Express Interest</h2><p className="mt-4 leading-8 text-muted">Introduce your background, research interests, relevant experience and links to previous work. You can include a CV when contacting us.</p><Link href="/contact/" className="mt-5 inline-block bg-[#172a46] px-5 py-3 text-sm font-semibold text-white">Contact SAM →</Link></section>
  </div>
 </div>;
}
