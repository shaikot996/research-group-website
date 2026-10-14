import Link from "next/link";
import {notFound} from "next/navigation";
import {prisma} from "@/lib/db";
import {Breadcrumbs,RichText} from "@/components/ui";
import {editorialDate,editorialGallery} from "@/lib/editorial-view";
export const dynamic="force-dynamic";
export default async function Page({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const event=await prisma.event.findFirst({where:{slug,publishStatus:"PUBLISHED"}});
  if(!event)notFound();
  const gallery=editorialGallery(event.gallery);
  const upcoming=event.status!=="CANCELLED"&&event.date>=new Date();
  return <main className="container-site section-space">
    <div className="mx-auto max-w-5xl">
      <Breadcrumbs items={[{label:"News & Events",href:"/news-events"},{label:event.title}]}/>
      <div className="grid gap-10 lg:grid-cols-[1.45fr_.65fr]">
        <article>
          <div className="text-xs font-bold uppercase tracking-[.2em] text-accent">{event.category||"Academic Event"} · {upcoming?"Upcoming":"Archive"}</div>
          <h1 className="mt-5 font-serif text-[clamp(2.7rem,5.1vw,4.5rem)] leading-[1.06] tracking-[-.035em]">{event.title}</h1>
          <p className="mt-6 text-lg leading-8 text-muted">{event.abstract}</p>
          {event.poster&&<div className="mt-9 overflow-hidden border academic-rule bg-[var(--surface)]"><img src={event.poster} alt={"Poster for "+event.title} className="max-h-[680px] w-full object-contain"/></div>}
          {event.description&&<div className="prose-academic mt-10 whitespace-pre-line"><RichText text={event.description}/></div>}
        </article>
        <aside className="self-start border-t-[3px] border-[#8c2131] bg-[var(--surface)] p-6 shadow-sm lg:sticky lg:top-24">
          <div className="text-xs font-bold uppercase tracking-[.17em] text-accent">Event information</div>
          <dl className="mt-5 space-y-5 text-sm">
            <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted">Date</dt><dd className="mt-1 font-semibold">{editorialDate(event.date)}</dd></div>
            {event.timeText&&<div><dt className="text-xs font-semibold uppercase tracking-wider text-muted">Time</dt><dd className="mt-1">{event.timeText}</dd></div>}
            {event.speaker&&<div><dt className="text-xs font-semibold uppercase tracking-wider text-muted">Speaker</dt><dd className="mt-1 font-semibold">{event.speaker}</dd>{event.affiliation&&<dd className="mt-1 text-muted">{event.affiliation}</dd>}</div>}
            {event.location&&<div><dt className="text-xs font-semibold uppercase tracking-wider text-muted">Venue</dt><dd className="mt-1">{event.location}</dd></div>}
          </dl>
          <div className="mt-7 space-y-3 border-t academic-rule pt-6">
            {upcoming&&event.registrationUrl&&<a href={event.registrationUrl} target="_blank" rel="noopener noreferrer" className="block bg-[#172a46] px-5 py-3 text-center text-sm font-semibold text-white hover:bg-[#8c2131]">Register / RSVP ↗</a>}
            <a href={"/events/"+event.slug+"/calendar"} className="block border academic-rule px-5 py-3 text-center text-sm font-semibold hover:text-accent">Add to calendar ↓</a>
            {event.externalUrl&&<a href={event.externalUrl} target="_blank" rel="noopener noreferrer" className="block text-center text-sm link-academic">Official event link ↗</a>}
          </div>
        </aside>
      </div>
      {gallery.length>0&&<section className="mt-14 border-t academic-rule pt-9"><div className="text-xs font-bold uppercase tracking-[.18em] text-accent">Event gallery</div><h2 className="mt-3 font-serif text-3xl">Highlights from the event</h2><div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3">{gallery.map((src,i)=><a key={src} href={src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden border academic-rule"><img src={src} alt={event.title+" — photo "+(i+1)} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform hover:scale-105"/></a>)}</div></section>}
      <Link href="/news-events" className="mt-12 inline-block link-academic">← Back to all news & events</Link>
    </div>
  </main>;
}
